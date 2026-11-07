var e={"design-a-rate-limiter":{summary:"Clarify the rules (limit per user, API key or IP; how many requests per window; what happens when exceeded), choose an algorithm — fixed window, sliding window log/counter, or token bucket — and store counters in a shared, fast store like Redis with atomic operations so all Node instances agree. Expose it as middleware that returns `429 Too Many Requests` with `Retry-After` and rate-limit headers.",details:[{type:`paragraph`,text:`In-memory counters only work for a single process. With clustering or multiple pods, each instance would allow the full limit, so a production limiter keeps state in Redis (or at the gateway/edge). The algorithm choice trades accuracy, memory and burst behaviour.`},{type:`heading3`,text:`Algorithms`},{type:`bullets`,items:["**Fixed window** — count per key per minute (`INCR` + `EXPIRE`). Very cheap, but allows up to 2× the limit at a window boundary (100 at 12:00:59 + 100 at 12:01:00).",`**Sliding window log** — store each request timestamp in a sorted set and count those in the last 60 s. Exact, but memory grows with the limit.`,`**Sliding window counter** — weighted average of the current and previous fixed windows. Good approximation with O(1) memory.`,`**Token bucket** — bucket refills at a steady rate up to a capacity; each request takes a token. Allows controlled bursts; widely used (e.g. by API providers).`,`**Leaky bucket** — requests queue and drain at a fixed rate; smooths output traffic.`]},{type:`heading3`,text:`Sliding window log with Redis (atomic via Lua)`},{type:`code`,lang:`typescript`,code:`import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
const redis = new Redis(process.env.REDIS_URL);

// Lua runs atomically in Redis: no race between instances
const SLIDING_WINDOW = \`
local key, now, window, limit, member = KEYS[1], tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, count, oldest[2]}
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return {1, count + 1, now}
\`;

export function rateLimit({ limit = 100, windowMs = 60_000, keyFn = (req) => req.user?.id ?? req.ip }) {
  return async (req, res, next) => {
    const key = \`rl:\${keyFn(req)}\`;
    const now = Date.now();
    try {
      const [allowed, count, oldest] = (await redis.eval(
        SLIDING_WINDOW, 1, key, now, windowMs, limit, randomUUID(),
      )) as [number, number, string];

      res.set('RateLimit-Limit', String(limit));
      res.set('RateLimit-Remaining', String(Math.max(0, limit - count)));

      if (!allowed) {
        const retryAfterSec = Math.ceil((Number(oldest) + windowMs - now) / 1000);
        res.set('Retry-After', String(retryAfterSec));
        return res.status(429).json({ error: 'Too many requests' });
      }
      next();
    } catch (err) {
      // Redis down: fail open (availability) or fail closed (protection) \u2014 a deliberate choice
      next();
    }
  };
}

// app.use('/api', rateLimit({ limit: 100, windowMs: 60_000 }));
// app.post('/login', rateLimit({ limit: 5, windowMs: 15 * 60_000, keyFn: (r) => r.body.email }));`},{type:`flow`,title:`Request path`,code:`flowchart LR
  C[Client]:::client --> LB[Load balancer]:::network
  LB --> N1[Node 1]:::server
  LB --> N2[Node 2]:::server
  N1 -->|"EVAL script"| R[("Redis<br/>shared counters")]:::cache
  N2 -->|"EVAL script"| R
  N1 -->|"allowed"| H[Route handler]:::server
  N1 -->|"denied"| X["429 + Retry-After"]:::security`},{type:`heading3`,text:`Design decisions to discuss`},{type:`bullets`,items:[`**Where:** edge/CDN or API gateway for coarse IP limits (cheapest, protects Node), app middleware for business-aware limits (per plan, per endpoint).`,"**Key:** user ID or API key when authenticated; IP for anonymous traffic (beware NAT and set `trust proxy` correctly).",`**Tiers:** different limits per plan, stricter limits on expensive endpoints (login, search, exports).`,`**Failure mode:** fail open vs fail closed when Redis is unavailable; add a local in-memory fallback.`,`**Scale:** Redis handles very high throughput; shard keys with Redis Cluster; keep limiter latency to ~1 ms.`,"Libraries: `express-rate-limit` with `rate-limit-redis`, `rate-limiter-flexible`, `@fastify/rate-limit`."]},{type:`callout`,variant:`tip`,text:`Interview tip: structure the answer as requirements → algorithm trade-offs → distributed storage with atomicity → response headers → failure mode. Explicitly calling out the fixed-window boundary burst and the need for atomic Redis operations shows depth.`}]},"design-a-url-shortener":{summary:"Two core operations: create (`POST /urls` takes a long URL and returns a short code) and redirect (`GET /:code` looks up the code and returns a 301/302). Generate short codes by base62-encoding a unique ID (from a counter, ID ranges or Snowflake) or by random codes with collision checks, store mappings in a scalable key-value or relational store, and put a cache (Redis/CDN) in front because reads vastly outnumber writes.",details:[{type:`heading3`,text:`1. Requirements and estimates`},{type:`bullets`,items:[`**Functional:** shorten a URL, redirect, optional custom alias, expiry, click analytics.`,`**Non-functional:** very low redirect latency, high availability, codes not easily guessable (if required).`,`**Estimates (example):** 100M new URLs/month (~40 writes/s), 100:1 read/write ratio (~4,000 redirects/s, peaks higher). 7 base62 characters give 62^7 ≈ 3.5 trillion codes — plenty.`,`Storage: ~500 bytes per record × 1.2B/year ≈ 600 GB/year — fits easily in a sharded DB.`]},{type:`heading3`,text:`2. API`},{type:`code`,lang:`text`,code:`POST /api/urls        { "url": "https://example.com/very/long", "alias"?: "promo", "expiresAt"?: "..." }
  -> 201 { "code": "aZ3kP9q", "shortUrl": "https://sho.rt/aZ3kP9q" }

GET /:code
  -> 302 Location: https://example.com/very/long    (or 404 / 410 if expired)

GET /api/urls/:code/stats  -> { "clicks": 1234, "byCountry": {...} }`},{type:`heading3`,text:`3. Short code generation`},{type:`code`,lang:`typescript`,code:`const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function toBase62(n: bigint): string {
  let s = '';
  do {
    s = ALPHABET[Number(n % 62n)] + s;
    n /= 62n;
  } while (n > 0n);
  return s;
}

// Option A: unique numeric ID -> base62 (no collisions)
// Each app instance reserves a block of IDs from Redis so it rarely needs coordination
let next = 0n, max = -1n;
async function nextId(): Promise<bigint> {
  if (next > max) {
    const end = BigInt(await redis.incrby('url:id', 1000)); // reserve 1000 IDs
    next = end - 999n; max = end;
  }
  return next++;
}
// toBase62(125n) -> "21"; toBase62(3_500_000_000n) -> "3ORDSU"

// Option B: random 7-char code, retry on unique-constraint conflict
import { randomInt } from 'node:crypto';
const randomCode = () => Array.from({ length: 7 }, () => ALPHABET[randomInt(62)]).join('');`},{type:`bullets`,items:[`Sequential IDs are predictable (users can enumerate links) — shuffle/obfuscate the ID, or use random codes when privacy matters.`,`Hashing the long URL (e.g. first 7 chars of base62(SHA-256)) gives the same code for the same URL but needs collision handling.`]},{type:`heading3`,text:`4. Redirect path with caching`},{type:`code`,lang:`typescript`,code:`app.get('/:code', async (req, res) => {
  const { code } = req.params;

  let url = await redis.get(\`u:\${code}\`);                 // 1. cache
  if (!url) {
    const row = await db.oneOrNone('SELECT long_url, expires_at FROM urls WHERE code = $1', [code]);
    if (!row) return res.status(404).send('Not found');
    if (row.expires_at && row.expires_at < new Date()) return res.status(410).send('Expired');
    url = row.long_url;
    await redis.set(\`u:\${code}\`, url, 'EX', 86_400);        // 2. populate cache
  }

  analyticsQueue.add('click', { code, ts: Date.now(), ua: req.get('user-agent') }); // 3. async, non-blocking
  res.redirect(302, url);                                       // 302 so clicks keep hitting us
});`},{type:`flow`,title:`Architecture`,code:`flowchart LR
  U[User]:::client --> CDN["CDN / edge cache"]:::network
  CDN --> LB[Load balancer]:::network
  LB --> API["Node API<br/>stateless"]:::server
  API --> R[("Redis cache")]:::cache
  API --> DB[("URL store<br/>sharded by code")]:::db
  API --> Q[[Click events queue]]:::queue
  Q --> AN["Analytics workers<br/>ClickHouse"]:::server`},{type:`bullets`,items:[`**301 vs 302:** 301 is cached by browsers (less load, but you lose click analytics and cannot change the target); 302/307 keeps every click visible.`,"**Database:** a key-value lookup by code — DynamoDB/Cassandra scale horizontally; Postgres with a unique index on `code` works well into large scale, shard by code hash later.",`**Abuse:** validate URLs, block malware/phishing domains (Safe Browsing), rate-limit creation, require auth for custom aliases.`,`**Availability:** stateless Node instances behind a load balancer, read replicas, multi-region cache.`]},{type:`callout`,variant:`tip`,text:`Interview tip: drive the discussion yourself — requirements, numbers, API, code generation trade-offs, read path with cache, then scaling and analytics. Interviewers mostly probe code generation (collisions, predictability) and 301 vs 302.`}]},"design-a-notification-system":{summary:`Expose a single Notification API that accepts an event (who, which template, data), checks user preferences and rate limits, renders the content per channel, and enqueues one job per channel. Separate worker pools for email, SMS and push call the providers (SES/SendGrid, Twilio, FCM/APNs) with retries, backoff, fallbacks and a dead-letter queue. Delivery status is tracked in a database, and idempotency keys prevent duplicate sends.`,details:[{type:`heading3`,text:`Requirements`},{type:`bullets`,items:[`**Functional:** multi-channel (email, SMS, push, maybe in-app), templates with localization, user preferences and opt-outs, scheduled and bulk sends, delivery status tracking.`,`**Non-functional:** reliable (at-least-once, no duplicates visible to users), scalable to bursts (marketing campaigns), priority for critical messages (OTP, password reset) over marketing, provider failover, compliance (unsubscribe, quiet hours, GDPR).`]},{type:`flow`,title:`High-level architecture`,code:`flowchart LR
  S["Services<br/>orders, auth"]:::client --> API["Notification API<br/>validate, idempotency"]:::server
  API --> PR[("Preferences +<br/>templates")]:::db
  API --> Q1[[email queue]]:::queue
  API --> Q2[[sms queue]]:::queue
  API --> Q3[[push queue]]:::queue
  Q1 --> W1[Email workers]:::server --> P1["SES / SendGrid"]:::external
  Q2 --> W2[SMS workers]:::server --> P2[Twilio]:::external
  Q3 --> W3[Push workers]:::server --> P3["FCM / APNs"]:::external
  W1 & W2 & W3 --> LOG[("Delivery log")]:::db`},{type:`heading3`,text:`Notification API (producer side)`},{type:`code`,lang:`typescript`,code:`// POST /notifications  { userId, template: 'order_shipped', data: {...}, idempotencyKey }
app.post('/notifications', async (req, res) => {
  const { userId, template, data, idempotencyKey, priority = 'normal' } = req.body;

  // 1. Idempotency: same key -> same result, no duplicate sends
  const firstTime = await redis.set(\`idem:\${idempotencyKey}\`, '1', 'EX', 86_400, 'NX');
  if (!firstTime) return res.status(200).json({ status: 'duplicate_ignored' });

  // 2. Preferences and channel selection
  const prefs = await prefsRepo.get(userId);            // { email: true, sms: false, push: true, quietHours }
  const tpl = await templates.get(template, prefs.locale);
  const channels = tpl.channels.filter((c) => prefs[c] && !(c === 'sms' && tpl.category === 'marketing'));

  // 3. One job per channel; critical messages go to a high-priority queue
  for (const channel of channels) {
    const id = randomUUID();
    await notificationsRepo.insert({ id, userId, channel, template, status: 'QUEUED' });
    await queues[channel].add('send', { id, userId, template, data }, {
      priority: priority === 'critical' ? 1 : 10,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      jobId: \`\${idempotencyKey}:\${channel}\`,            // BullMQ also dedupes by jobId
    });
  }
  res.status(202).json({ status: 'queued', channels });
});`},{type:`heading3`,text:`Channel worker (consumer side)`},{type:`code`,lang:`typescript`,code:`import { Worker } from 'bullmq';

new Worker('email', async (job) => {
  const { id, userId, template, data } = job.data;
  const user = await usersClient.get(userId);
  const { subject, html } = await render(template, 'email', data, user.locale);

  try {
    const providerId = await primaryEmail.send({ to: user.email, subject, html });
    await notificationsRepo.update(id, { status: 'SENT', providerId });
  } catch (err) {
    if (isPermanent(err)) {                      // invalid address, unsubscribed
      await notificationsRepo.update(id, { status: 'FAILED', error: err.message });
      return;                                    // don't retry
    }
    if (job.attemptsMade >= 2) {                 // failover after repeated provider errors
      await fallbackEmail.send({ to: user.email, subject, html });
      return notificationsRepo.update(id, { status: 'SENT_FALLBACK' });
    }
    throw err;                                   // BullMQ retries with backoff, then DLQ
  }
}, { connection, concurrency: 50, limiter: { max: 100, duration: 1000 } }); // respect provider rate limits`},{type:`heading3`,text:`Key design points`},{type:`bullets`,items:[`**Queues decouple** producers from slow, rate-limited providers and absorb spikes; Kafka/SQS/RabbitMQ/BullMQ all work.`,`**Separate queues per channel and priority** so a 5M-email campaign never delays OTP SMS.`,`**Retries:** exponential backoff for transient errors, no retry for permanent ones, dead-letter queue for inspection.`,`**Status tracking:** QUEUED → SENT → DELIVERED/OPENED/BOUNCED via provider webhooks; expose it for support and analytics.`,`**Push specifics:** store device tokens per user; remove tokens that FCM/APNs report as invalid.`,`**Compliance:** unsubscribe links, quiet hours by user timezone, frequency caps, consent records.`,`**Scheduling/bulk:** a scheduler service enqueues jobs at send time; batch fan-out for campaigns.`,`**Observability:** metrics per channel and provider (send rate, failures, latency), alerts on DLQ growth.`]},{type:`callout`,variant:`tip`,text:`Interview tip: interviewers usually probe reliability — how you avoid duplicate SMS (idempotency keys, deduped job IDs), what happens when a provider is down (retry + failover), and how critical messages bypass bulk traffic (priority queues). Cover those three explicitly.`}]}};export{e as answers};