import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What are common caching strategies? (Cache-Aside, Write-Through, Write-Behind)': {
    summary:
      '**Cache-aside** (lazy loading): the app checks the cache, on a miss reads the DB and populates the cache — simple and the most common. **Write-through**: every write goes to the cache and the DB synchronously, so the cache is always fresh but writes are slower. **Write-behind** (write-back): writes go to the cache and are flushed to the DB asynchronously — very fast writes, but risk of data loss and eventual consistency. Read-through and refresh-ahead are related variants.',
    details: [
      {
        type: 'paragraph',
        text: 'The strategies differ in who loads the cache (app or cache layer) and when the database is written (immediately, together, or later). Choose based on read/write ratio and how much staleness or data-loss risk you can tolerate.',
      },
      { type: 'heading3', text: 'Cache-aside (lazy loading)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `async function getProduct(id: string) {
  const key = \`product:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);                    // HIT

  const product = await db.product.findUnique({ where: { id } }); // MISS → DB
  if (product) await redis.set(key, JSON.stringify(product), 'EX', 300);
  return product;
}

async function updateProduct(id: string, data: Partial<Product>) {
  const updated = await db.product.update({ where: { id }, data });
  await redis.del(\`product:\${id}\`);                         // invalidate, next read reloads
  return updated;
}`,
      },
      {
        type: 'flow',
        title: 'Cache-aside read path',
        code: `sequenceDiagram
  participant App
  participant Cache as Redis
  participant DB
  App->>Cache: GET product:42
  alt hit
    Cache-->>App: cached JSON
  else miss
    Cache-->>App: nil
    App->>DB: SELECT product 42
    DB-->>App: row
    App->>Cache: SET product:42 EX 300
  end`,
      },
      { type: 'heading3', text: 'Write-through' },
      {
        type: 'code',
        lang: 'typescript',
        code: `async function saveProfile(userId: string, profile: Profile) {
  await db.profile.upsert({ where: { userId }, create: profile, update: profile });
  await redis.set(\`profile:\${userId}\`, JSON.stringify(profile));  // write both, synchronously
}
// Reads almost always hit; every write pays the cache cost even if never read`,
      },
      { type: 'heading3', text: 'Write-behind (write-back)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Hot counter: increment in Redis, persist in batches
async function recordView(postId: string) {
  await redis.hincrby('views:pending', postId, 1);     // fast, in-memory
}

setInterval(async () => {                                // flush every 10 s
  const pending = await redis.hgetall('views:pending');
  await redis.del('views:pending');                      // (use a MULTI/rename in real code)
  for (const [postId, n] of Object.entries(pending)) {
    await db.$executeRaw\`UPDATE posts SET views = views + \${Number(n)} WHERE id = \${postId}\`;
  }
}, 10_000);
// If Redis crashes before a flush, those views are lost`,
      },
      {
        type: 'bullets',
        items: [
          '**Cache-aside:** best general default; only requested data is cached; first read is a miss; risk of stale data between DB write and invalidation.',
          '**Read-through:** like cache-aside but the cache library/provider loads from the DB on a miss — app code only talks to the cache.',
          '**Write-through:** fresh cache, higher write latency, caches data that may never be read (combine with TTL).',
          '**Write-behind:** lowest write latency and batched DB load (counters, analytics); risk of loss and complex failure handling.',
          '**Refresh-ahead:** proactively refresh hot keys before they expire to avoid miss spikes.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say cache-aside is your default and justify exceptions — write-behind for high-volume counters, write-through for data read immediately after write. Mention TTLs as a safety net in every strategy.',
      },
    ],
  },

  'What is cache invalidation and what are the strategies?': {
    summary:
      'Cache invalidation is removing or updating cached data when the source of truth changes so users do not see stale values. Main strategies: TTL/expiry (time-based), explicit delete-on-write (event-based), write-through updates, versioned/namespaced keys, tag- or pattern-based purges, and event-driven invalidation via pub/sub or change data capture across instances. In practice you combine an explicit invalidation with a TTL as a safety net.',
    details: [
      {
        type: 'paragraph',
        text: '"There are only two hard things in computer science: cache invalidation and naming things." It is hard because the cache and DB are separate systems — any gap between updating one and the other, or concurrency between readers and writers, can leave stale data cached indefinitely.',
      },
      { type: 'heading3', text: '1. TTL (time-based expiry)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `await redis.set('exchange-rates', JSON.stringify(rates), 'EX', 60);
// Stale for at most 60 s. Simple, no coordination. Add jitter to avoid mass expiry:
const ttl = 300 + Math.floor(Math.random() * 60);`,
      },
      { type: 'heading3', text: '2. Delete on write (event-based)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `async function updateUser(id: string, data: UpdateUserDto) {
  const user = await db.user.update({ where: { id }, data });   // 1) DB first
  await redis.del(\`user:\${id}\`, \`user:\${id}:profile\`);        // 2) then delete cache
  return user;
}
// Delete rather than set: avoids racing writers caching an older value`,
      },
      { type: 'heading3', text: '3. Versioned keys (namespace bump)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Invalidate a whole group at once without scanning keys
const v = (await redis.get('catalog:version')) ?? '1';
const key = \`catalog:v\${v}:category:\${categoryId}:page:\${page}\`;

// On any catalog change:
await redis.incr('catalog:version');   // old keys are simply never read again and expire via TTL`,
      },
      { type: 'heading3', text: '4. Cross-instance invalidation' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Each Node.js instance also keeps an in-process LRU cache
const local = new LRUCache<string, User>({ max: 10_000, ttl: 30_000 });

// Publisher (on write)
await redis.publish('invalidate', JSON.stringify({ key: \`user:\${id}\` }));

// Every instance subscribes (separate connection for subscriber mode)
sub.subscribe('invalidate');
sub.on('message', (_ch, msg) => local.delete(JSON.parse(msg).key));`,
      },
      {
        type: 'bullets',
        items: [
          '**Order matters:** update DB, then delete cache. Deleting first lets a concurrent reader re-cache the old value before the DB write.',
          '**Delayed double delete:** delete, write DB, delete again after a short delay — mitigates the remaining read/write race.',
          '**CDC:** stream DB changes (Debezium, MongoDB change streams) to an invalidator — catches writes from every service and script.',
          '**HTTP caches:** `Cache-Control`, `ETag`, CDN purge APIs and content-hashed asset names.',
          '**Stampede protection:** on popular keys, use a lock or request coalescing so one request rebuilds the cache.',
        ],
      },
      {
        type: 'flow',
        title: 'Invalidate-on-write with TTL safety net',
        code: `flowchart LR
  W["Write request"]:::client --> DB[("Update DB")]:::db
  DB --> DEL["DEL cache key"]:::cache
  DEL --> PUB["Publish invalidation"]:::queue
  PUB --> I1["Instance 1<br/>local LRU"]:::server
  PUB --> I2["Instance 2<br/>local LRU"]:::server
  TTL["TTL expiry"]:::highlight -.->|"if a delete is missed"| DEL`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "explicit invalidation for correctness, TTL for safety", explain why you delete instead of update the cache, and mention the DB-then-cache ordering race. That covers what most interviewers probe.',
      },
    ],
  },

  'What is Redis and what are its use cases in Node.js?': {
    summary:
      'Redis is an in-memory data structure store — strings, hashes, lists, sets, sorted sets, streams, bitmaps, HyperLogLog, geospatial indexes — with sub-millisecond latency, optional persistence (RDB snapshots, AOF), replication and clustering. In Node.js it is used for caching, sessions, rate limiting, distributed locks, queues (BullMQ), pub/sub and real-time features, leaderboards and counters.',
    details: [
      {
        type: 'paragraph',
        text: 'Redis executes commands on a single main thread, so each command is atomic — that makes primitives like `INCR`, `SET NX` and Lua scripts reliable building blocks for coordination between many Node.js instances. Popular clients: `ioredis` and the official `redis` (node-redis) package.',
      },
      { type: 'heading3', text: 'Use cases with the matching data structure' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

// 1) Cache (string + TTL)
await redis.set('product:42', JSON.stringify(product), 'EX', 300);

// 2) Session store (hash)
await redis.hset('sess:abc', { userId: '7', role: 'admin' });
await redis.expire('sess:abc', 1800);

// 3) Rate limiting / counters (atomic INCR)
const hits = await redis.incr(\`rl:\${ip}:\${Math.floor(Date.now() / 60000)}\`);

// 4) Leaderboard (sorted set)
await redis.zincrby('leaderboard', 50, 'player:asha');
const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');

// 5) Unique visitors (HyperLogLog, ~12 KB regardless of count)
await redis.pfadd('visitors:2026-11-05', userId);
const approx = await redis.pfcount('visitors:2026-11-05');

// 6) Distributed lock
const ok = await redis.set('lock:invoice:9', token, 'PX', 10_000, 'NX');

// 7) Pub/Sub for real-time fan-out (e.g. Socket.IO Redis adapter)
await redis.publish('chat:room1', JSON.stringify({ from: 'asha', text: 'hi' }));`,
      },
      {
        type: 'bullets',
        items: [
          '**Caching** — DB query results, API responses, rendered fragments.',
          '**Sessions** — `connect-redis` with `express-session`; shared across instances.',
          '**Rate limiting** — `rate-limiter-flexible`, `express-rate-limit` with a Redis store.',
          '**Job queues** — BullMQ for emails, image processing, scheduled jobs.',
          '**Real-time** — pub/sub, Socket.IO adapter to broadcast across server instances.',
          '**Streams** — lightweight event log with consumer groups.',
          '**Coordination** — locks, idempotency keys, feature flags.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Redis is memory-bound: set `maxmemory` and an eviction policy (`allkeys-lru` for caches, `noeviction` for queues), always use TTLs on cache keys, and avoid `KEYS *` in production (use `SCAN`). Persistence is optional — do not treat a cache-configured Redis as your source of truth.',
      },
    ],
  },

  'How do you implement a Redis cache in a Node.js application?': {
    summary:
      'Create a shared Redis client (ioredis or node-redis), wrap DB reads in a cache-aside helper that does `GET` → on miss query the DB → `SET key value EX ttl`, invalidate keys on writes, and treat Redis as optional — if it is down, fall back to the DB. Add consistent key naming, serialization, TTL jitter and stampede protection for hot keys, and optionally HTTP-level middleware for whole responses.',
    details: [
      { type: 'heading3', text: '1. Client setup' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 2,        // fail fast instead of hanging requests
  enableOfflineQueue: false,      // don't queue commands while disconnected
});
redis.on('error', (err) => console.error('[redis]', err.message));`,
      },
      { type: 'heading3', text: '2. A reusable cache-aside helper' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// cache.ts
const inflight = new Map<string, Promise<unknown>>();   // per-process request coalescing

export async function cached<T>(key: string, ttlSec: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch { /* Redis down → fall through to DB */ }

  if (inflight.has(key)) return inflight.get(key) as Promise<T>; // avoid stampede in this instance

  const p = (async () => {
    const value = await load();
    const ttl = ttlSec + Math.floor(Math.random() * ttlSec * 0.1); // jitter
    redis.set(key, JSON.stringify(value), 'EX', ttl).catch(() => {});
    return value;
  })().finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}

export const invalidate = (...keys: string[]) => redis.del(...keys).catch(() => 0);`,
      },
      { type: 'heading3', text: '3. Using it in a service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// products.service.ts
export const productKey = (id: string) => \`app:v1:product:\${id}\`;

export function getProduct(id: string) {
  return cached(productKey(id), 300, () => db.product.findUnique({ where: { id } }));
}

export async function updateProduct(id: string, data: ProductUpdate) {
  const p = await db.product.update({ where: { id }, data });
  await invalidate(productKey(id), 'app:v1:products:featured');
  return p;
}

// route
app.get('/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);
  product ? res.json(product) : res.sendStatus(404);
});`,
      },
      {
        type: 'flow',
        title: 'Request flow with graceful degradation',
        code: `flowchart TD
  R["GET /products/42"]:::client --> C{"Redis GET"}:::cache
  C -->|hit| OK["Return JSON"]:::server
  C -->|miss| DB[("Query DB")]:::db
  C -->|"error / down"| DB
  DB --> S["SET with TTL<br/>fire and forget"]:::cache
  S --> OK`,
      },
      {
        type: 'bullets',
        items: [
          '**Key naming:** `app:version:entity:id` — the version prefix lets you invalidate everything after a schema change.',
          '**Serialization:** JSON is fine; beware Dates become strings — revive them or store ISO strings intentionally.',
          '**Don\'t cache:** per-user sensitive data under shared keys, or errors/nulls without a short TTL (but caching "not found" briefly prevents DB hammering).',
          '**Observability:** track hit ratio, latency and memory (`INFO stats`: keyspace_hits/misses).',
          '**NestJS:** `@nestjs/cache-manager` with a Redis store provides `CacheInterceptor` and `@CacheTTL()`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the details that stand out are "Redis failures must not break the API", TTL jitter, stampede protection and a clear invalidation point next to every write.',
      },
    ],
  },

  'How do you implement rate limiting using Redis?': {
    summary:
      'Store a per-client counter in Redis (keyed by user ID, API key or IP) and use atomic operations so every Node.js instance shares the same limit. Common algorithms: fixed window (`INCR` + `EXPIRE`), sliding window log (sorted set of timestamps), sliding window counter, and token bucket (usually a Lua script for atomicity). Return HTTP 429 with `Retry-After` and rate-limit headers when exceeded; in production, libraries like `rate-limiter-flexible` implement these correctly.',
    details: [
      {
        type: 'paragraph',
        text: 'An in-memory limiter breaks as soon as you run more than one instance — each process counts separately. Redis gives a single shared, atomic counter with automatic expiry.',
      },
      { type: 'heading3', text: 'Fixed window (simplest)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import type { Request, Response, NextFunction } from 'express';

export function fixedWindow(limit = 100, windowSec = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id ?? req.ip;
    const window = Math.floor(Date.now() / 1000 / windowSec);
    const key = \`rl:\${id}:\${window}\`;

    const [[, count]] = (await redis.multi()
      .incr(key)
      .expire(key, windowSec)          // key cleans itself up
      .exec()) as [[null, number], unknown];

    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - count));
    if (count > limit) {
      res.setHeader('Retry-After', windowSec);
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}
// Weakness: 100 requests at 0:59 + 100 at 1:00 = 200 in two seconds (boundary burst)`,
      },
      { type: 'heading3', text: 'Sliding window log (sorted set + Lua for atomicity)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const slidingWindow = \`
local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)   -- drop old entries
local count = redis.call('ZCARD', key)
if count >= limit then return 0 end
redis.call('ZADD', key, now, now .. '-' .. ARGV[4])    -- unique member
redis.call('PEXPIRE', key, window)
return 1
\`;

const allowed = await redis.eval(
  slidingWindow, 1, \`rl:\${userId}\`, Date.now(), 60_000, 100, crypto.randomUUID());
if (allowed === 0) return res.status(429).end();
// Exact, but stores one entry per request (memory grows with limit)`,
      },
      { type: 'heading3', text: 'Using a library' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { RateLimiterRedis } from 'rate-limiter-flexible';

const limiter = new RateLimiterRedis({
  storeClient: redis, keyPrefix: 'rl', points: 100, duration: 60,
});

app.use(async (req, res, next) => {
  try {
    await limiter.consume(req.ip!);           // consume 1 point
    next();
  } catch (rej: any) {
    res.set('Retry-After', String(Math.ceil(rej.msBeforeNext / 1000)));
    res.status(429).send('Too Many Requests');
  }
});`,
      },
      {
        type: 'flow',
        title: 'Shared limiter across instances',
        code: `flowchart LR
  C1["Client"]:::client --> LB["Load balancer"]:::network
  LB --> N1["Node instance 1"]:::server
  LB --> N2["Node instance 2"]:::server
  N1 -->|"INCR rl:user:window"| R[("Redis")]:::cache
  N2 -->|"INCR rl:user:window"| R
  R -->|"count > limit"| X["429 + Retry-After"]:::security`,
      },
      {
        type: 'bullets',
        items: [
          '**Fixed window:** cheapest, boundary bursts.',
          '**Sliding log:** exact, more memory.',
          '**Sliding window counter:** weighted mix of current and previous window — good accuracy, O(1) memory.',
          '**Token bucket:** allows controlled bursts with a steady refill rate — common for public APIs.',
          'Decide fail-open vs fail-closed if Redis is unavailable (usually fail-open for normal APIs, fail-closed for login/OTP endpoints).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: doing `GET` then `SET` from Node.js is a race — two instances read 99 and both allow. Use `INCR`, `MULTI`, or a Lua script so check-and-increment is atomic. Also be careful with `req.ip` behind proxies (configure `trust proxy`).',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: How do you implement rate limiting in Node.js?' },
      {
        type: 'paragraph',
        text: 'Count requests per key (IP, user ID or API key) within a time window and reject excess with **429 Too Many Requests** plus `Retry-After`/`RateLimit` headers. In Express use `express-rate-limit` (with a **Redis store** when you run multiple instances); in NestJS use `@nestjs/throttler`. Common algorithms are fixed window, sliding window and token bucket. Apply stricter limits to sensitive endpoints such as login, and ideally also limit at the edge (API gateway, nginx, Cloudflare).',
      },
      {
        type: 'paragraph',
        text: 'Rate limiting protects against brute-force and credential-stuffing on login, scraping, abusive clients and accidental retry storms, and it enforces API plan quotas. The two key design decisions are **what you key on** and **where the counters live** — an in-memory counter only works for a single process.',
      },
      { type: 'heading3', text: 'Express with express-rate-limit + Redis' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

app.set('trust proxy', 1); // behind a load balancer: use the real client IP

// General API limit: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-7',  // RateLimit / RateLimit-Policy headers
  legacyHeaders: false,        // drop X-RateLimit-*
  store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) }),
});

// Strict limit for login, keyed by IP + username
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  keyGenerator: (req) => \`\${req.ip}:\${String(req.body?.username ?? '').toLowerCase()}\`,
  skipSuccessfulRequests: true, // only failed attempts count
  message: { error: 'Too many login attempts, try again later' },
});

app.use('/api', apiLimiter);
app.post('/auth/login', loginLimiter, login);
// Exceeded → 429 Too Many Requests, Retry-After header set`,
      },
      { type: 'heading3', text: 'NestJS with @nestjs/throttler' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },    // 10 req/sec burst
      { name: 'long', ttl: 60_000, limit: 200 },  // 200 req/min sustained
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

@Controller('auth')
export class AuthController {
  @Throttle({ short: { limit: 3, ttl: 60_000 } }) // override per route
  @Post('login') login() {}

  @SkipThrottle()
  @Get('health') health() {}
}
// For multiple instances, plug in a Redis storage for the throttler.`,
      },
      { type: 'heading3', text: 'How a token bucket works (DIY with Redis)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Simplest distributed limiter: fixed window counter with INCR + EXPIRE
async function isAllowed(key, limit, windowSec) {
  const bucket = \`rl:\${key}:\${Math.floor(Date.now() / 1000 / windowSec)}\`;
  const count = await redis.incr(bucket);
  if (count === 1) await redis.expire(bucket, windowSec);
  return count <= limit;
}
// Fixed windows allow bursts at the boundary (100 at 0:59 + 100 at 1:00).
// Sliding-window logs/counters or a token bucket (often a Lua script for atomicity) smooth this.`,
      },
      {
        type: 'flow',
        title: 'Token bucket',
        code: `flowchart LR
  REF["Refill: r tokens<br/>per second"]:::cache --> B[("Bucket<br/>capacity = burst")]:::db
  R["Request"]:::client --> C{"Token available?"}
  B --> C
  C -->|"Yes, take 1"| OK["Handle request"]:::server
  C -->|No| E["429 + Retry-After"]:::external`,
      },
      {
        type: 'bullets',
        items: [
          '**Algorithms**: fixed window (simple, bursty at edges), sliding window log (accurate, more memory), sliding window counter (good compromise), token/leaky bucket (allows controlled bursts, smooth rate).',
          '**Keys**: IP for anonymous traffic (careful with NAT/corporate proxies), user ID or API key for authenticated traffic, and combined keys for login.',
          "**Trust proxy correctly** — otherwise every request appears to come from the load balancer's IP, or attackers spoof `X-Forwarded-For`.",
          '**Layered limits**: edge/WAF for volumetric abuse, app-level for business rules (per user, per plan).',
          'Return helpful headers so well-behaved clients can back off; consider slowing down (`express-slow-down`) before blocking.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'The default in-memory store resets on restart and is per process — with 4 cluster workers or 10 pods, a "100/min" limit is really 400 or 1,000/min. Use a shared store such as Redis for anything that matters.',
      },
    ],
  },

  'How do you implement distributed locks with Redis?': {
    summary:
      "Acquire with `SET lock:<resource> <unique-token> NX PX <ttl>` — it succeeds only if the key does not exist, and the TTL guarantees release if the holder crashes. Release with a Lua script that deletes the key only if the stored token matches yours, so you never remove someone else's lock. For stronger guarantees use Redlock across independent Redis nodes and fencing tokens — or prefer a DB-level lock when correctness is critical.",
    details: [
      {
        type: 'paragraph',
        text: 'Typical use: ensure only one instance runs a cron job, processes a given order, or refreshes an expensive cache entry at a time. A plain in-process mutex does not work across multiple Node.js instances or pods.',
      },
      { type: 'heading3', text: 'Acquire, do work, release safely' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { randomUUID } from 'node:crypto';

const RELEASE = \`
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end\`;

export async function withLock<T>(resource: string, ttlMs: number, fn: () => Promise<T>) {
  const key = \`lock:\${resource}\`;
  const token = randomUUID();                               // identifies THIS holder

  const ok = await redis.set(key, token, 'PX', ttlMs, 'NX'); // atomic acquire
  if (ok !== 'OK') return null;                               // someone else holds it

  try {
    return await fn();
  } finally {
    await redis.eval(RELEASE, 1, key, token);                // delete only if still ours
  }
}

// Usage: only one instance sends the daily report
await withLock('daily-report', 60_000, async () => sendDailyReport());`,
      },
      {
        type: 'flow',
        title: 'Why the token check matters',
        code: `sequenceDiagram
  participant A as Instance A
  participant R as Redis
  participant B as Instance B
  A->>R: SET lock NX PX 10s (token a)
  Note over A: long GC pause, TTL expires
  B->>R: SET lock NX PX 10s (token b)
  R-->>B: OK
  A->>R: release with token a
  R-->>A: 0 (token mismatch, B keeps lock)`,
      },
      { type: 'heading3', text: 'Library: Redlock' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import Redlock from 'redlock';

const redlock = new Redlock([redisA, redisB, redisC], { retryCount: 3, retryDelay: 200 });

await redlock.using(['order:9001'], 5000, async (signal) => {
  // lock is auto-extended while work runs
  await processOrder('9001');
  if (signal.aborted) throw signal.error;   // lost the lock — stop
});`,
      },
      {
        type: 'bullets',
        items: [
          'Never use `SETNX` + `EXPIRE` as two commands — a crash between them leaves a lock that never expires.',
          'Choose a TTL longer than the worst-case job duration, or extend it periodically (watchdog).',
          'A lock with a TTL can expire while the holder is still working (GC pause, slow network). For correctness-critical writes, use **fencing tokens**: an increasing number checked by the storage layer.',
          "Redlock's safety under clock drift and failover is debated (Kleppmann vs antirez) — for money or inventory, prefer DB constraints, `SELECT ... FOR UPDATE`, or optimistic concurrency.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the three must-mention points are NX + TTL in one command, a unique token checked atomically on release (Lua), and the limitation that TTL-based locks are about efficiency, not perfect correctness — hence fencing tokens.',
      },
    ],
  },

  'What is the difference between Redis Pub/Sub and Redis Streams?': {
    summary:
      'Pub/Sub is fire-and-forget broadcasting: a message is pushed to whoever is subscribed at that moment and is not stored — offline subscribers miss it and there are no acknowledgements. Streams are an append-only, persisted log: messages get IDs, can be replayed from any point, and consumer groups distribute messages among workers with acknowledgements (`XACK`) and pending-message tracking for retries. Use Pub/Sub for ephemeral real-time notifications, Streams for durable event processing.',
    details: [
      { type: 'heading3', text: 'Pub/Sub' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Subscriber needs a dedicated connection (it enters subscriber mode)
const sub = new Redis();
await sub.subscribe('notifications');
sub.on('message', (channel, message) => {
  console.log(channel, JSON.parse(message));   // only if connected right now
});

// Publisher
const delivered = await redis.publish('notifications',
  JSON.stringify({ userId: 7, text: 'Order shipped' }));
// delivered = number of subscribers that received it (0 → message gone)`,
      },
      { type: 'heading3', text: 'Streams with a consumer group' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Producer: append to the log (capped to ~100k entries)
await redis.xadd('orders', 'MAXLEN', '~', 100000, '*',
  'orderId', '9001', 'event', 'created');

// Create group once ('$' = only new messages, '0' = from the beginning)
await redis.xgroup('CREATE', 'orders', 'billing', '$', 'MKSTREAM').catch(() => {});

// Worker: read new messages for this consumer, block up to 5 s
while (true) {
  const res = await redis.xreadgroup('GROUP', 'billing', 'worker-1',
    'COUNT', 10, 'BLOCK', 5000, 'STREAMS', 'orders', '>');
  if (!res) continue;
  for (const [, entries] of res as [string, [string, string[]][]][]) {
    for (const [id, fields] of entries) {
      await handle(fields);                       // if this throws, message stays pending
      await redis.xack('orders', 'billing', id);  // acknowledge success
    }
  }
}
// Crashed worker's messages: inspect with XPENDING, reclaim with XAUTOCLAIM`,
      },
      {
        type: 'flow',
        title: 'Delivery models compared',
        code: `flowchart LR
  P1["Publisher"]:::client -->|PUBLISH| CH(("channel")):::queue
  CH --> S1["Subscriber A online"]:::server
  CH -.->|lost| S2["Subscriber B offline"]:::external
  P2["Producer"]:::client -->|XADD| ST[("Stream log<br/>persisted")]:::db
  ST --> G["Consumer group"]:::queue
  G --> W1["Worker 1<br/>XACK"]:::server
  G --> W2["Worker 2<br/>XACK"]:::server`,
      },
      {
        type: 'bullets',
        items: [
          '**Persistence:** Pub/Sub none; Streams stored in memory (and RDB/AOF) until trimmed.',
          '**Delivery:** Pub/Sub at-most-once to every subscriber; Streams at-least-once with acks.',
          '**Fan-out vs work-sharing:** Pub/Sub broadcasts to all; a Streams consumer group splits messages among workers (multiple groups = fan-out).',
          '**Replay/history:** only Streams (`XRANGE`, read from an ID).',
          '**Backpressure:** slow Pub/Sub subscribers can be disconnected (output buffer limits); Streams consumers read at their own pace.',
          '**Use Pub/Sub for:** cache invalidation broadcasts, Socket.IO adapter, live presence. **Use Streams for:** event processing, audit trails, lightweight Kafka-like pipelines.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame it as "broadcast now vs durable log". Mention consumer groups and XACK for Streams, and note that for very high volume or long retention, Kafka is usually the next step.',
      },
    ],
  },

  'What is BullMQ and how does it use Redis for job queues?': {
    summary:
      'BullMQ is a Node.js library for durable background jobs built on Redis. A `Queue` adds jobs, `Worker` processes in any number of instances pull and run them with configurable concurrency, and it provides retries with backoff, delays, priorities, repeatable/cron jobs, rate limiting, parent-child flows and events. Internally it stores jobs as Redis hashes and keeps job IDs in lists/sorted sets per state (wait, active, delayed, completed, failed), moving them atomically with Lua scripts.',
    details: [
      {
        type: 'paragraph',
        text: 'Offload slow or unreliable work (emails, PDFs, image resizing, webhooks, third-party API calls) from the request path: the API enqueues a job and responds immediately; workers process it in the background and retry on failure. It is the successor to the `bull` package, written in TypeScript.',
      },
      { type: 'heading3', text: 'Producer and worker' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Queue, Worker, QueueEvents } from 'bullmq';
const connection = { host: 'localhost', port: 6379 };

// Producer (API process)
export const emailQueue = new Queue('emails', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },  // 1s, 2s, 4s, ...
    removeOnComplete: { count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
});

app.post('/signup', async (req, res) => {
  const user = await createUser(req.body);
  await emailQueue.add('welcome', { userId: user.id }, { jobId: \`welcome:\${user.id}\` }); // idempotent
  res.status(201).json(user);                           // respond without waiting
});

// Worker (separate process / container)
const worker = new Worker('emails', async (job) => {
  if (job.name === 'welcome') {
    await job.updateProgress(10);
    await sendWelcomeEmail(job.data.userId);           // throw → retried
  }
  return { sentAt: Date.now() };                        // stored as returnvalue
}, { connection, concurrency: 10 });

worker.on('failed', (job, err) => console.error(job?.id, err.message));`,
      },
      { type: 'heading3', text: 'Other features' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Delayed job — runs in 1 hour
await emailQueue.add('reminder', { cartId }, { delay: 60 * 60 * 1000 });

// Priority (lower number = higher priority)
await emailQueue.add('otp', { phone }, { priority: 1 });

// Repeatable / cron (newer versions also offer upsertJobScheduler)
await reportQueue.add('daily', {}, { repeat: { pattern: '0 6 * * *' } });

// Worker-level rate limit: max 50 jobs per second for this queue
new Worker('webhooks', processor, { connection, limiter: { max: 50, duration: 1000 } });`,
      },
      {
        type: 'flow',
        title: 'Job lifecycle in Redis',
        code: `stateDiagram-v2
  [*] --> waiting: add()
  [*] --> delayed: add with delay
  delayed --> waiting: delay elapsed
  waiting --> active: worker picks job
  active --> completed: processor resolves
  active --> delayed: throws, retry with backoff
  active --> failed: attempts exhausted
  failed --> waiting: manual retry`,
      },
      {
        type: 'bullets',
        items: [
          '**Redis structures:** job data in a hash (`bull:emails:<id>`), state lists/sorted sets (`wait`, `active`, `delayed` scored by timestamp, `completed`, `failed`), and a stream for events.',
          '**Atomic transitions** via Lua scripts prevent two workers taking the same job.',
          '**Stalled jobs:** workers hold a lock per active job; if a worker dies, the job is detected as stalled and moved back to wait.',
          'Configure Redis with `maxmemory-policy noeviction` — eviction would silently delete jobs.',
          'Ensure graceful shutdown: `await worker.close()` on SIGTERM so active jobs finish.',
          'Dashboards: Bull Board or Taskforce.sh. NestJS: `@nestjs/bullmq`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: emphasize at-least-once delivery — a job can run twice (stall, retry after partial success), so processors must be idempotent. Mention `jobId` for de-duplication and exponential backoff.',
      },
    ],
  },
};
