import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'An API that previously responded quickly is now taking around 30 seconds to complete. How would you debug the issue and identify the root cause?':
    {
      summary:
        'Work systematically from symptoms to cause: confirm and scope the problem (which endpoints, all users or some, since when), correlate with recent changes (deploys, config, data growth, traffic), then use traces, logs and metrics to find where the 30 seconds is spent — database, a downstream service, the Node event loop, or resource exhaustion. A suspiciously round 30 s usually points to a timeout somewhere. Mitigate first (rollback, scale, cache), then fix the root cause and add monitoring so it is caught earlier next time.',
      details: [
        {
          type: 'paragraph',
          text: 'Interviewers want to see a calm, structured process — not a guess. Talk through each step and the evidence you would look for, and mention that during a real incident you would stabilize production before deep-diving.',
        },
        {
          type: 'flow',
          title: 'Debugging flow',
          code: `flowchart TD
  A["Confirm + scope<br/>which endpoints, since when"]:::client --> B{"Recent change?<br/>deploy, config, traffic"}
  B -->|Yes| RB["Roll back / disable flag<br/>to confirm"]:::highlight
  B -->|No| T["Trace one slow request<br/>(APM / OpenTelemetry)"]:::server
  T --> D{Where is the time?}
  D -->|DB span| DB["EXPLAIN ANALYZE, indexes,<br/>locks, pool exhaustion"]:::db
  D -->|HTTP span| EX["Downstream slow,<br/>timeouts, retries"]:::external
  D -->|"Gaps, no spans"| EL["Event loop blocked,<br/>CPU, GC, memory"]:::security
  DB & EX & EL --> F["Fix, verify with metrics,<br/>add alert + postmortem"]:::highlight`,
        },
        { type: 'heading3', text: '1. Confirm and scope' },
        {
          type: 'bullets',
          items: [
            'Reproduce it: `curl -w` timing, or check p50/p95/p99 latency dashboards. Is it every request or only some (specific users, tenants, payload sizes, regions, instances)?',
            'When did it start? Line that up with deploys, config changes, migrations, traffic spikes, data growth, dependency incidents.',
            'Is it one endpoint or everything? Everything slow points to shared resources (event loop, DB, pool, CPU, network); one endpoint points to its query or dependency.',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          code: `# Where does the time go at the network level?
curl -o /dev/null -s -w 'dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\\n' \\
  https://api.example.com/orders?user=42
# dns:0.01 connect:0.03 tls:0.08 ttfb:30.02 total:30.03  -> server-side wait

kubectl top pods                 # CPU / memory per instance
kubectl logs deploy/api --since=30m | grep -i -E 'timeout|ECONNRESET|pool'`,
        },
        { type: 'heading3', text: '2. Find where the time is spent' },
        {
          type: 'paragraph',
          text: 'Distributed tracing (OpenTelemetry, Datadog, New Relic) shows a waterfall of spans for one slow request — the fastest way to see whether 29 s is in a SQL query, an HTTP call, or unaccounted time inside Node. Without APM, add timing logs around each step with a request ID.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Quick instrumentation when there is no APM
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';

async function timed<T>(label: string, fn: () => Promise<T>, reqId: string) {
  const t0 = performance.now();
  try { return await fn(); }
  finally { logger.info({ reqId, label, ms: Math.round(performance.now() - t0) }); }
}

const user = await timed('db.user', () => repo.findUser(id), req.id);          // 12 ms
const orders = await timed('db.orders', () => repo.findOrders(id), req.id);    // 29,850 ms  <- here
const recs = await timed('http.recs', () => recsClient.get(id), req.id);       // 40 ms

// Is the event loop blocked?
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => logger.info({ p99LoopDelayMs: h.percentile(99) / 1e6 }), 10_000);`,
        },
        { type: 'heading3', text: '3. Common root causes and how to confirm them' },
        {
          type: 'bullets',
          items: [
            '**Slow query** — data grew, missing index, plan changed. Check slow query log / `pg_stat_statements`, run `EXPLAIN ANALYZE` (look for Seq Scan on a big table). Fix with an index, pagination, or query rewrite.',
            '**Lock contention** — a long transaction or migration holding locks. Check `pg_locks` / `pg_stat_activity` for waiting queries.',
            "**Connection pool exhaustion** — requests wait for a free DB connection (pool size 10, slow queries holding them, or leaked connections never released). The 30 s often equals the pool's acquire timeout.",
            '**Downstream dependency** — a third-party API is slow; no timeout set, so we wait for a default 30 s, possibly with retries multiplying it.',
            '**Event loop blocked** — synchronous CPU work (big `JSON.parse`, sync crypto, regex backtracking, `fs.readFileSync`) blocks every request on that instance. Profile with `node --cpu-prof` or `clinic flame`.',
            '**Memory pressure / GC** — a leak makes the heap grow and GC pauses dominate; check heap metrics and take heap snapshots.',
            '**N+1 queries** — a code change now issues 1,000 queries per request.',
            '**Infrastructure** — DNS resolution issues, exhausted sockets, CPU throttling from container limits, noisy neighbours, cross-region calls after a config change.',
          ],
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Postgres: what is running and what is waiting?
SELECT pid, now() - query_start AS running_for, wait_event_type, state, left(query, 80)
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY running_for DESC;

-- Why is this query slow?
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
-- Seq Scan on orders (rows=12,000,000) ... Execution Time: 29714 ms
-- Fix: CREATE INDEX CONCURRENTLY idx_orders_customer_created ON orders (customer_id, created_at DESC);
-- After: Index Scan ... Execution Time: 1.8 ms`,
        },
        { type: 'heading3', text: '4. Mitigate, fix, prevent' },
        {
          type: 'numbered',
          items: [
            '**Mitigate:** roll back the suspect deploy, disable a feature flag, scale out, add a cache, or shed load — restore service first.',
            '**Fix the root cause:** index, query rewrite, add timeouts and circuit breakers to dependencies, move CPU work to worker threads/queues, fix the leak.',
            '**Verify:** p95/p99 latency back to baseline on dashboards.',
            '**Prevent:** latency SLO alerts, slow-query alerts, explicit timeouts on every outbound call, load tests in CI for critical endpoints, blameless postmortem with action items.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Sample answer framing: "In [your project], [endpoint] went from [200 ms] to [30 s]. Tracing showed [the orders query] taking the time; `EXPLAIN ANALYZE` revealed [a sequential scan after the table grew]. We [added a composite index concurrently], latency dropped to [x ms], and we added [a slow-query alert]." Replace the brackets with a real incident you handled.',
        },
      ],
    },

  'Walk me through your process of taking a new feature from requirement gathering to production deployment.':
    {
      summary:
        'Describe an end-to-end lifecycle: clarify requirements and acceptance criteria with product and stakeholders; write a short technical design covering API, data model, risks and rollout; break it into small tasks; implement behind a feature flag with tests; go through code review and CI; deploy to staging for QA; release to production gradually with monitoring and a rollback plan; then measure the outcome against the original goal.',
      details: [
        {
          type: 'paragraph',
          text: 'This is a process and experience question. The interviewer is checking whether you think beyond writing code: do you clarify ambiguity, consider edge cases and non-functional requirements, communicate, test, ship safely, and follow up after release? Use a real feature as the thread through your answer — a STAR-style story with the process steps in the middle.',
        },
        {
          type: 'flow',
          title: 'Feature lifecycle',
          code: `flowchart LR
  R["Requirements<br/>+ acceptance criteria"]:::client --> D["Technical design<br/>+ review"]:::server
  D --> P["Plan + estimate<br/>small tasks"]:::server
  P --> I["Build behind flag<br/>+ tests"]:::server
  I --> CR["PR review + CI"]:::security
  CR --> S["Staging + QA / UAT"]:::network
  S --> PR["Gradual rollout<br/>monitor"]:::highlight
  PR --> M["Measure + iterate"]:::db`,
        },
        { type: 'heading3', text: '1. Requirements' },
        {
          type: 'bullets',
          items: [
            'Understand the **why**: the user problem and the success metric (e.g. reduce checkout drop-off by 5%).',
            'Clarify scope, edge cases and non-functional needs: expected load, latency, security/permissions, data retention, accessibility, backward compatibility.',
            'Agree on **acceptance criteria** (Given/When/Then) and what is explicitly out of scope.',
          ],
        },
        { type: 'heading3', text: '2. Design' },
        {
          type: 'bullets',
          items: [
            'Short design doc or RFC: API contract, data model and migrations, sequence of calls, failure handling, alternatives considered.',
            'Identify risks early: migrations on large tables, third-party limits, performance hot spots, security review.',
            'Get feedback from peers and dependent teams (frontend, mobile, other services) before building.',
          ],
        },
        {
          type: 'code',
          lang: 'text',
          code: `RFC: Saved payment methods
- Goal: 1-click checkout for returning users (metric: checkout conversion)
- API:  POST /payment-methods, GET /payment-methods, DELETE /payment-methods/:id
- Data: payment_methods(id, user_id, provider_token, last4, brand, created_at)  -- no raw card data (PCI)
- Flow: tokenise via provider -> store token -> charge with token
- Risks: PCI scope, duplicate cards, provider outage -> fall back to manual entry
- Rollout: flag 'saved-cards', internal users -> 5% -> 50% -> 100%
- Metrics/alerts: save success rate, charge failure rate, p95 latency`,
        },
        { type: 'heading3', text: '3. Build and test' },
        {
          type: 'bullets',
          items: [
            'Split into small, independently mergeable PRs (migration first, then API, then UI), all behind a **feature flag** so incomplete work can ship safely.',
            'Tests at each level: unit tests for logic, integration tests for API + DB, a few E2E tests for the critical path; update API docs (OpenAPI).',
            'Backward-compatible database migrations (expand → migrate → contract) so old and new code can run side by side during deploys.',
            'Add logging, metrics and tracing as part of the feature, not afterwards.',
          ],
        },
        { type: 'heading3', text: '4. Review, CI and staging' },
        {
          type: 'bullets',
          items: [
            'Code review focused on correctness, security, readability; CI runs lint, type-check, tests, security scans.',
            'Deploy to staging; QA and product verify against acceptance criteria (UAT); run performance tests if load-sensitive.',
          ],
        },
        { type: 'heading3', text: '5. Release and follow-up' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Gradual release: deploy is separate from release
app.post('/checkout', async (req, res) => {
  if (await flags.isEnabled('saved-cards', { userId: req.user.id })) {
    return checkoutWithSavedCard(req, res);   // new path: 5% of users first
  }
  return legacyCheckout(req, res);            // instant rollback = turn flag off
});`,
        },
        {
          type: 'bullets',
          items: [
            'Roll out gradually (internal → canary → percentage → 100%) while watching error rates, latency and business metrics; have a documented rollback.',
            'Communicate: release notes, support team briefing, documentation.',
            'After launch: compare the metric with the goal, gather feedback, fix issues, and remove the feature flag and dead code.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Sample answer structure: "Recently I built [feature] for [your project]. I started by [clarifying X with the PM], wrote a short design covering [API/data model], and we flagged [risk]. I shipped it in [N] small PRs behind a flag with [tests], validated it on staging with QA, then rolled it out [5% → 100%] while monitoring [metric]. Result: [outcome]. What I\'d do differently: [lesson]." The reflection at the end is what makes it sound senior.',
        },
      ],
    },

  'A Node.js service is stuck at 100% CPU and requests are timing out. How do you find what is blocking the event loop?':
    {
      summary:
        'Node runs your JavaScript on one thread, so a single CPU-heavy synchronous task stalls every request on that instance. First stabilise: take the hot instance out of rotation or roll back, and scale out. Then confirm the event loop is blocked with event-loop-delay metrics, capture a CPU profile (`--cpu-prof`, `--inspect` + DevTools, or e.g. clinic.js) from the busy process, and read the flame graph for the widest synchronous frame. Typical culprits are a catastrophic regex, `JSON.parse`/`stringify` of huge payloads, sync crypto/zlib/fs, or a large loop; fix by moving the work to worker threads, chunking it, or streaming.',
      details: [
        {
          type: 'paragraph',
          text: 'The tell-tale signature is: CPU pinned near 100% on one core per process, event loop delay in the hundreds of milliseconds or seconds, health checks failing, and every endpoint on that instance timing out — not just one. Compare that with a slow database, where CPU is low and Node is simply waiting.',
        },
        {
          type: 'flow',
          title: 'Investigation decision tree',
          code: `flowchart TD
  A["Timeouts + CPU 100%"]:::client --> M["Mitigate: pull instance,<br/>roll back, scale out"]:::highlight
  M --> B{"Event loop delay high?"}
  B -->|No| G["Check GC / memory:<br/>heap near limit, long GC pauses"]:::db
  B -->|Yes| P["Capture CPU profile<br/>on a hot instance"]:::server
  P --> F{"Widest frame in flame graph"}
  F -->|"RegExp / JSON / crypto / zlib"| C["Sync hot spot:<br/>regex, parse, hash, compress"]:::security
  F -->|"Your own function"| L["Big loop / sort /<br/>O(n^2) over large data"]:::security
  C & L --> X["Fix: worker thread, chunk,<br/>stream, limit input size"]:::highlight
  X --> R["Alert on loop delay +<br/>regression test"]:::network`,
        },
        { type: 'heading3', text: '1. Stabilise first' },
        {
          type: 'bullets',
          items: [
            'If it started after a deploy, roll back — that is both mitigation and a strong clue.',
            'If one request type triggers it (a huge upload, a particular search string), block or rate-limit that input at the gateway while you investigate.',
            'Keep one misbehaving instance alive but out of the load balancer so you can profile it; restarting everything destroys the evidence.',
          ],
        },
        { type: 'heading3', text: '2. Prove the event loop is blocked' },
        {
          type: 'code',
          lang: 'javascript',
          code: `const { monitorEventLoopDelay } = require('node:perf_hooks');

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => {
  // Values are in nanoseconds; baseline is roughly the resolution (~20 ms here)
  logger.info({ loopP99Ms: h.percentile(99) / 1e6, loopMaxMs: h.max / 1e6 });
  h.reset();
}, 10_000);

// Healthy:  { loopP99Ms: 21.1, loopMaxMs: 21.1 }
// Blocked:  { loopP99Ms: 1301.3, loopMaxMs: 1301.3 }  <- something ran for 1.3 s`,
        },
        { type: 'heading3', text: '3. Capture a CPU profile' },
        {
          type: 'code',
          lang: 'bash',
          code: `# A) Profile from start to exit; writes a .cpuprofile you open in Chrome DevTools
node --cpu-prof --cpu-prof-dir=./profiles server.js

# B) Attach to a running process: enable the inspector with SIGUSR1 (Linux/macOS),
#    port-forward 9229, open chrome://inspect -> Profiler -> Start, reproduce, Stop
kill -USR1 <pid>

# C) Local reproduction with a load generator, e.g. clinic.js
npx clinic doctor -- node server.js     # diagnoses: event loop vs I/O vs GC
npx clinic flame  -- node server.js     # flame graph of hot functions`,
        },
        {
          type: 'paragraph',
          text: 'In the flame graph, look for the widest bar at the top of the stack that is *synchronous*. General profiling tooling is covered in the Performance category; here the job is to find the one function holding the thread.',
        },
        { type: 'heading3', text: '4. Usual culprits' },
        {
          type: 'bullets',
          items: [
            '**Catastrophic regex backtracking (ReDoS):** `/^(\\w+)+$/` against `"aaaa…a!"` took 1.3 s with 25 characters, doubling with each extra character. Often triggered by user input.',
            '**Huge payloads:** `JSON.parse`/`JSON.stringify` on 50 MB bodies, or building a giant response in memory.',
            '**Sync APIs:** `crypto.pbkdf2Sync`, `bcrypt` sync variants, `zlib.gzipSync`, `fs.readFileSync` in a request path.',
            '**Algorithmic blowups:** nested loops over data that grew, sorting large arrays per request, deep cloning big objects.',
            '**Not the loop at all:** a heap near its limit makes the GC run constantly — CPU is high but the profile shows "(garbage collector)". See the Memory category.',
          ],
        },
        { type: 'heading3', text: '5. Fix and prevent' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// Option 1: break long work into chunks so I/O and timers get a turn
async function processInChunks(items, fn, chunkSize = 1000) {
  for (let i = 0; i < items.length; i += chunkSize) {
    for (const item of items.slice(i, i + chunkSize)) fn(item);
    await new Promise((resolve) => setImmediate(resolve)); // yield to the event loop
  }
}

// Option 2: move CPU work off the main thread (worker_threads / a pool like piscina)
// Option 3: use async/streaming APIs (crypto.pbkdf2, zlib streams, stream JSON parsing)
// Option 4: fix the regex (no nested quantifiers) and cap input length`,
        },
        {
          type: 'numbered',
          items: [
            'Ship the fix, then verify loop delay and p99 latency return to baseline under the same load.',
            'Alert on event-loop delay p99 and CPU per instance, not just average CPU.',
            'Add a regression test (e.g. the evil regex input must finish in < 50 ms) and a request body size limit.',
            'Lint for unsafe regexes and sync APIs in request handlers; document the profiling steps in the runbook.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: say the key insight out loud — "one blocked event loop means every request on that instance is slow, so I look for synchronous CPU work, not slow I/O." Then name the concrete evidence: loop delay metric, a `.cpuprofile` from a hot pod, and the widest synchronous frame in the flame graph.',
        },
      ],
    },

  'Your API intermittently returns 502 or 504 errors behind Nginx or a load balancer. How do you troubleshoot it?':
    {
      summary:
        'A 502 means the proxy got a bad or no response from Node (connection refused or reset, process crashed); a 504 means Node did not answer within the proxy timeout. I check which code it is, then line up proxy logs with app logs and restarts. The classic intermittent 502 is a keep-alive mismatch: Node closes idle connections after 5 s by default while the load balancer keeps them for 60 s and reuses a socket Node just closed — fix by setting `server.keepAliveTimeout` above the LB idle timeout and `headersTimeout` above that. 504s point to slow handlers or downstreams, so I trace them and add explicit timeouts.',
      details: [
        {
          type: 'paragraph',
          text: 'Treat it as two different problems. Start by splitting the errors by status code, instance, endpoint and time — "intermittent" usually hides a pattern such as "only on reused connections", "only during deploys" or "only on the export endpoint".',
        },
        { type: 'heading3', text: '1. Read the proxy logs — they tell you which failure it is' },
        {
          type: 'code',
          lang: 'text',
          code: `# Nginx error.log
upstream prematurely closed connection while reading response header   -> Node closed the socket (keep-alive race, crash)
recv() failed (104: Connection reset by peer)                           -> socket reset (keep-alive race, OOM kill)
connect() failed (111: Connection refused)                              -> nothing listening (restart, deploy, crash loop)
upstream timed out (110: Connection timed out) while reading response   -> 504: handler slower than proxy_read_timeout (60s default)

# AWS ALB access logs: elb_status_code=502, target_status_code=-  -> target closed / reset the connection
#                      elb_status_code=504                        -> target did not respond within the idle timeout`,
        },
        {
          type: 'heading3',
          text: '2. The keep-alive timeout mismatch (most common intermittent 502)',
        },
        {
          type: 'flow',
          title: 'Keep-alive race between LB and Node',
          code: `flowchart TD
  R1["Request 1 on socket S"]:::client --> N1["Node replies 200,<br/>keeps S alive"]:::server
  N1 --> I["S idle for 5 s"]:::network
  I --> NC["Node closes S<br/>(keepAliveTimeout 5 s)"]:::security
  I --> LB["LB still thinks S is open<br/>(idle timeout 60 s)"]:::external
  NC & LB --> R2["LB sends request 2 on S"]:::client
  R2 --> E["Socket reset/closed:<br/>LB returns 502"]:::highlight
  E -.->|"Fix"| F["Node keepAliveTimeout 65 s<br/>> LB idle 60 s"]:::server`,
        },
        {
          type: 'paragraph',
          text: 'It is low-volume and random because it only hits requests that land on a connection right as Node closes it. HTTP keep-alive itself is covered in the Networking category; the operational fix is making the upstream (Node) keep connections open longer than the downstream (proxy).',
        },
        {
          type: 'code',
          lang: 'javascript',
          code: `const http = require('node:http');
const server = http.createServer(app);

// Defaults (Node 22): keepAliveTimeout 5000, headersTimeout 60000, requestTimeout 300000
// node -e "const s=require('http').createServer();console.log(s.keepAliveTimeout,s.headersTimeout,s.requestTimeout)"

server.keepAliveTimeout = 65_000; // > LB idle timeout (ALB default 60 s)
server.headersTimeout = 66_000;   // must be > keepAliveTimeout
server.listen(3000);`,
        },
        {
          type: 'code',
          lang: 'text',
          code: `# Nginx: keep upstream connections alive, but let Nginx close them first
upstream api {
  server 127.0.0.1:3000;
  keepalive 32;
  keepalive_timeout 60s;     # < Node keepAliveTimeout (65 s)
}
location / {
  proxy_pass http://api;
  proxy_http_version 1.1;
  proxy_set_header Connection "";
  proxy_read_timeout 30s;    # 504 after this; align with app-level timeouts
}`,
        },
        { type: 'heading3', text: '3. Other causes to rule out' },
        {
          type: 'bullets',
          items: [
            '**Crashes and restarts:** check restart counts and exit reasons (`kubectl get pods`, `kubectl describe pod` → `OOMKilled`, exit code 137). Unhandled rejections or OOM kills produce bursts of 502 "connection refused/reset".',
            '**Deploys without graceful shutdown:** pods killed while serving, or receiving traffic before they are ready. Handle `SIGTERM` with `server.close()`, use readiness probes and a short pre-stop delay (see the DevOps category on health checks).',
            '**Health checks too aggressive:** a slow event loop fails the check, the LB drains the instance, others overload — a cascade.',
            '**504 = slow handler or dependency:** trace the slow requests; a missing timeout on a downstream call keeps the request open until the proxy gives up. Set app timeouts shorter than the proxy timeout so you return a clean error instead.',
            '**Response too large / headers too big:** Nginx `upstream sent too big header` (proxy buffer sizes) shows as 502.',
          ],
        },
        { type: 'heading3', text: '4. Prevent recurrence' },
        {
          type: 'numbered',
          items: [
            'Alert on LB 5xx rate split by 502/504 and by target, and on pod restarts/OOM kills.',
            'Codify the timeout chain in config: client timeout > LB timeout > app request timeout > downstream timeouts, with Node keep-alive > LB idle.',
            'Add graceful shutdown and readiness probes; run a deploy under load test to confirm zero 502s.',
            'Write the runbook entry: "502 burst → check restarts and keep-alive; 504 → check traces for the slow span".',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: distinguishing 502 (bad/closed upstream connection) from 504 (upstream too slow) in your first sentence shows real production experience — and naming the Node `keepAliveTimeout` (5 s) vs LB idle timeout (60 s) mismatch is the answer many interviewers are hoping for.',
        },
      ],
    },

  'Requests start hanging because the database connection pool is exhausted. How do you diagnose and fix it?':
    {
      summary:
        'When every pooled connection is checked out, new queries queue inside the app and requests hang until the acquire timeout fires — while the database itself may look idle. I mitigate by restarting/scaling carefully and killing stuck sessions, then look at pool metrics (total, idle, waiting) and the database side (`pg_stat_activity`, especially "idle in transaction"). The root cause is usually connections leaked on error paths, long transactions holding connections during slow work, N+1 bursts, or pool size × instances exceeding the database limit. The fix is releasing in `finally` (or using `pool.query`), short transactions, timeouts, and right-sized pools with alerts.',
      details: [
        {
          type: 'paragraph',
          text: 'How pooling works is covered in the Performance category; this answer is about the incident. The signature: latency jumps to exactly the pool acquire timeout (or hangs forever if none is set), errors like "timeout exceeded when trying to connect", low DB CPU, and a growing number of requests waiting for a client.',
        },
        { type: 'heading3', text: '1. Stabilise' },
        {
          type: 'bullets',
          items: [
            'Terminate sessions stuck "idle in transaction" for minutes (`pg_terminate_backend`) — those are holding connections and often locks.',
            'Roll back if a recent deploy introduced it; a rolling restart frees leaked connections but they will leak again, so treat it as a stop-gap.',
            'Do not blindly raise the pool size: more connections × more instances can exceed `max_connections` and make the database slower for everyone.',
          ],
        },
        { type: 'heading3', text: '2. Gather evidence on both sides' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// App side, e.g. node-postgres: expose pool stats as metrics
setInterval(() => {
  metrics.gauge('db_pool_total', pool.totalCount);
  metrics.gauge('db_pool_idle', pool.idleCount);
  metrics.gauge('db_pool_waiting', pool.waitingCount); // > 0 for long = exhaustion
}, 5_000);`,
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Database side: who holds connections and what are they doing?
SELECT state, count(*) FROM pg_stat_activity WHERE datname = 'app' GROUP BY state;
--  active               3
--  idle in transaction 17   <- connections checked out and never committed/released

SELECT pid, now() - xact_start AS tx_age, left(query, 60)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY tx_age DESC;`,
        },
        { type: 'heading3', text: '3. Hypotheses and how to confirm' },
        {
          type: 'bullets',
          items: [
            '**Leak on an error path** — `pool.connect()` without `release()` when a query throws. Confirm: `totalCount` stays at max while `idleCount` is 0 and traffic is low; "idle in transaction" sessions with the last query from that code path.',
            '**Long transactions** — a transaction held open while calling an external API or sending email. Confirm: traces show a DB span wrapping an HTTP span.',
            '**Slow queries** — each query holds its connection longer, so throughput collapses under load. Confirm: `pg_stat_statements`, slow query log, `EXPLAIN ANALYZE`.',
            '**N+1 or fan-out** — one request issues hundreds of queries or `Promise.all` over 500 items. Confirm: query count per request in traces.',
            '**Sizing** — e.g. 20 pods × pool max 10 = 200 connections against `max_connections` = 100. Confirm: database "too many clients" errors, connection counts per host.',
          ],
        },
        { type: 'heading3', text: '4. Fix' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// BAD: if the UPDATE throws, the client is never released
const client = await pool.connect();
await client.query('BEGIN');
await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amt, id]);
await client.query('COMMIT');
client.release();

// GOOD: always release; keep the transaction short and do no network I/O inside it
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amt, id]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

// Single statements: pool.query() checks out and releases for you
const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Pool with explicit limits, e.g. node-postgres
const pool = new Pool({
  max: 10,                        // per instance; instances x max < DB max_connections (minus headroom)
  connectionTimeoutMillis: 2_000, // fail fast instead of hanging when the pool is empty
  idleTimeoutMillis: 30_000,
});`,
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Server-side safety nets for the app's role
ALTER ROLE app SET statement_timeout = '5s';
ALTER ROLE app SET idle_in_transaction_session_timeout = '30s';`,
        },
        { type: 'heading3', text: '5. Prevent recurrence' },
        {
          type: 'numbered',
          items: [
            'Alert on `waiting` clients > 0 for more than a minute and on "idle in transaction" count.',
            'Wrap transactions in a helper (`withTransaction(fn)`) so nobody hand-writes connect/release again; add a lint or review rule.',
            'Integration test that forces a query error and asserts the pool returns to full idle.',
            'Use a connection pooler such as PgBouncer when many instances or serverless functions share one database.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: point out the counter-intuitive part — "the database looked idle while the app was hanging" — and that raising the pool size is usually the wrong fix. Leaks in error paths and transactions that wrap slow network calls are the real answers interviewers look for.',
        },
      ],
    },

  'Customers are charged twice when they retry a payment request. How do you make the API idempotent?':
    {
      summary:
        'Clients retry when a response is lost or times out, but the first request may have succeeded, so a non-idempotent `POST /payments` charges twice. The fix is an `Idempotency-Key` header: the client generates one key per logical payment and reuses it on retries; the server records the key with a hash of the request under a unique constraint, processes it once, stores the response, and returns that same stored response for any repeat. Concurrent duplicates are handled by inserting the key first so only one request wins, and the key is passed through to the payment provider, which supports idempotency keys too (e.g. Stripe).',
      details: [
        {
          type: 'paragraph',
          text: 'Start the incident by stopping the bleeding: identify duplicate charges (same customer, amount and order within seconds), refund them, and tell support. Then confirm the cause in logs: two `POST /payments` for the same order with different request IDs, typically after a client timeout or a mobile network retry.',
        },
        {
          type: 'flow',
          title: 'Idempotency-key flow',
          code: `flowchart TD
  C["POST /payments<br/>Idempotency-Key: k1"]:::client --> I{"INSERT key k1<br/>status = processing"}:::db
  I -->|"Inserted (first time)"| P["Charge provider<br/>with same key k1"]:::external
  P --> S["Save response,<br/>status = completed"]:::db
  S --> R["Return 201"]:::highlight
  I -->|"Conflict: key exists"| H{"Same request hash?"}
  H -->|No| E1["422: key reused<br/>with different body"]:::security
  H -->|"Yes, completed"| R2["Return stored response"]:::highlight
  H -->|"Yes, processing"| E2["409: retry later"]:::security`,
        },
        { type: 'heading3', text: '1. Store keys with a unique constraint' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE idempotency_keys (
  user_id       bigint      NOT NULL,
  key           text        NOT NULL,
  request_hash  text        NOT NULL,
  status        text        NOT NULL,          -- 'processing' | 'completed'
  response_code int,
  response_body jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)                   -- scope keys per client
);
-- Clean up after a TTL (e.g. 24 h) with a scheduled job`,
        },
        { type: 'heading3', text: '2. Insert first, then do the work' },
        {
          type: 'code',
          lang: 'typescript',
          code: `app.post('/payments', async (req, res) => {
  const key = req.header('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  const hash = sha256(JSON.stringify(req.body));

  // Atomic claim: only one concurrent request can insert the key
  const claimed = await db.query(
    \`INSERT INTO idempotency_keys (user_id, key, request_hash, status)
     VALUES ($1, $2, $3, 'processing')
     ON CONFLICT (user_id, key) DO NOTHING
     RETURNING key\`,
    [req.user.id, key, hash],
  );

  if (claimed.rowCount === 0) {
    const { rows: [row] } = await db.query(
      'SELECT * FROM idempotency_keys WHERE user_id = $1 AND key = $2', [req.user.id, key]);
    if (row.request_hash !== hash) return res.status(422).json({ error: 'Key reused with a different request' });
    if (row.status === 'processing') return res.status(409).json({ error: 'Request in progress, retry later' });
    return res.status(row.response_code).json(row.response_body); // replay, no second charge
  }

  try {
    const charge = await paymentProvider.charge(req.body, { idempotencyKey: key });
    const body = { paymentId: charge.id, status: charge.status };
    await db.query(
      \`UPDATE idempotency_keys SET status = 'completed', response_code = 201, response_body = $3
       WHERE user_id = $1 AND key = $2\`, [req.user.id, key, body]);
    return res.status(201).json(body);
  } catch (err) {
    // Transient failure: release the key so the client can retry safely
    await db.query('DELETE FROM idempotency_keys WHERE user_id = $1 AND key = $2', [req.user.id, key]);
    throw err;
  }
});`,
        },
        { type: 'heading3', text: 'Details that matter' },
        {
          type: 'bullets',
          items: [
            '**Client side:** generate the key (UUID) once per checkout attempt, persist it, and reuse it on every retry. A new key per retry defeats the whole design.',
            '**Pass the key downstream:** payment providers dedupe on their side, e.g. Stripe accepts an idempotency key on create calls (`stripe.paymentIntents.create(params, { idempotencyKey })`). That covers the case where your process crashes after charging but before saving the response.',
            '**Crash in "processing":** a key stuck in processing after a timeout window should be reconciled by checking the provider (by the same key or your order ID), not by charging again.',
            '**Natural keys too:** a unique constraint such as one successful payment per `order_id` is a second line of defence.',
            '**Decline vs error:** a card decline is a final answer — store and replay it. Only transient errors (network, 5xx) should release the key.',
          ],
        },
        { type: 'heading3', text: 'Prevent recurrence' },
        {
          type: 'numbered',
          items: [
            'Test: fire the same request twice concurrently and sequentially; assert exactly one provider call and identical responses.',
            'Alert on duplicate charges per order (a reconciliation job against the provider).',
            'Make the header mandatory for all money-moving and create endpoints; document it in the API spec.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: interviewers often follow up with "what if two retries arrive at the same millisecond?" — answer with the insert-first claim on a unique constraint (not check-then-insert, which races), and mention forwarding the key to the payment provider for the crash-after-charge case.',
        },
      ],
    },

  'Two requests update the same record at the same time and one update is lost. How do you prevent this race condition?':
    {
      summary:
        'A lost update happens with read-modify-write: two requests read the same row, both compute a new value in Node, and the second write silently overwrites the first. I prevent it by not doing read-modify-write in application code: use an atomic conditional update (`SET stock = stock - 1 WHERE stock > 0`), optimistic locking with a version column (`WHERE version = ?`, retry or return 409 on conflict), or pessimistic locking with `SELECT … FOR UPDATE` inside a short transaction. In MongoDB the equivalent is `findOneAndUpdate` with the condition in the filter and `$inc`/`$set` operators, and unique constraints guard invariants like "one booking per seat".',
      details: [
        {
          type: 'paragraph',
          text: "Async/await makes this easy to write by accident: the `await` between the read and the write is exactly where another request sneaks in, even though Node is single-threaded. Detection usually comes from data that does not add up — inventory going negative, counters lower than the event count, a customer's edit disappearing.",
        },
        {
          type: 'code',
          lang: 'javascript',
          code: `// Reproduction (run against an in-memory "row"): two concurrent decrements
async function buy(id) {
  const row = await repo.find(id);                  // both read stock = 10
  await repo.save(id, { stock: row.stock - 1 });    // both write 9
}
await Promise.all([buy(1), buy(1)]);
// stock: 9  <- expected 8, one update lost`,
        },
        { type: 'heading3', text: 'Option 1: atomic update in the database (simplest, preferred)' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- The database applies the change to the current value and checks the invariant
UPDATE products SET stock = stock - 1
WHERE id = $1 AND stock > 0
RETURNING stock;
-- 0 rows updated = sold out; no read in Node, no race`,
        },
        { type: 'heading3', text: 'Option 2: optimistic locking (version column)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `async function updateProfile(id: string, changes: Partial<Profile>, expectedVersion: number) {
  const result = await db.query(
    \`UPDATE profiles SET name = $1, bio = $2, version = version + 1
     WHERE id = $3 AND version = $4\`,
    [changes.name, changes.bio, id, expectedVersion],
  );
  if (result.rowCount === 0) {
    // Someone else updated first: re-read and retry, or tell the client
    throw new ConflictError('Record changed, reload and try again'); // -> HTTP 409
  }
}
// HTTP variant: return an ETag, require If-Match on PUT, respond 412 on mismatch`,
        },
        {
          type: 'paragraph',
          text: 'Best when conflicts are rare and the user is editing a form: no locks are held while they think. ORMs support it directly (e.g. `@VersionColumn` in TypeORM, the `optimisticConcurrency` schema option in Mongoose).',
        },
        { type: 'heading3', text: 'Option 3: pessimistic locking' },
        {
          type: 'code',
          lang: 'sql',
          code: `BEGIN;
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;  -- second transaction waits here
-- business logic in Node using the locked value
UPDATE accounts SET balance = 70 WHERE id = 42;
COMMIT;                                                  -- lock released`,
        },
        {
          type: 'paragraph',
          text: 'Use it when conflicts are frequent or the logic is complex. Keep the transaction short, lock rows in a consistent order to avoid deadlocks, and consider `NOWAIT` / `SKIP LOCKED` for queues. Isolation levels (covered in the SQL category) are the related theory: `SERIALIZABLE` also prevents it but you must retry serialization failures.',
        },
        { type: 'heading3', text: 'MongoDB and other guards' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// Condition + atomic operator in a single document operation
const doc = await products.findOneAndUpdate(
  { _id: id, stock: { $gt: 0 } },
  { $inc: { stock: -1 } },
  { returnDocument: 'after' },
); // Mongoose and the v6+ driver return the document (or null)
if (!doc) throw new Error('Sold out');

// Optimistic: { _id: id, version: v } in the filter, { $set: {...}, $inc: { version: 1 } }`,
        },
        {
          type: 'bullets',
          items: [
            '**Unique constraints** enforce invariants no matter what the code does: `UNIQUE (event_id, seat_no)` makes double-booking impossible.',
            '**Distributed locks** (e.g. Redis) are a last resort for resources outside the database, with TTLs and fencing tokens.',
            '**Prevent recurrence:** a concurrency test that fires N parallel requests and asserts the final value, code review rule "no read-modify-write without a version or lock", and a reconciliation job or alert for impossible states (negative stock).',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: name the pattern ("read-modify-write lost update"), then rank the fixes — atomic SQL first, optimistic locking for user edits, `FOR UPDATE` for high-contention multi-step logic — and explain the trade-off (retries/409s vs lock waits and deadlocks).',
        },
      ],
    },

  'A deployment went out and the error rate spiked. Walk through your incident response and rollback.':
    {
      summary:
        'Detect via alerts on error rate and latency, then declare an incident with an owner and a communication channel. Because the spike correlates with a deploy, mitigation comes before diagnosis: roll back (or turn off the feature flag) immediately, then verify that error rate and latency return to baseline. Once stable, find the root cause from logs, traces and the diff, fix forward with a test, and run a blameless postmortem with action items — for example canary releases with automatic rollback so the next bad deploy reaches 5% of users, not 100%.',
      details: [
        {
          type: 'flow',
          title: 'Incident lifecycle',
          code: `flowchart LR
  D["Detect<br/>alert: 5xx > 2%"]:::client --> DC["Declare<br/>owner + channel"]:::server
  DC --> M["Mitigate<br/>rollback / flag off"]:::highlight
  M --> V["Verify<br/>metrics at baseline"]:::network
  V --> RC["Root cause<br/>logs, traces, diff"]:::db
  RC --> F["Fix forward<br/>+ test"]:::server
  F --> PM["Blameless<br/>postmortem"]:::security`,
        },
        { type: 'heading3', text: '1. Detect and declare (first 5 minutes)' },
        {
          type: 'bullets',
          items: [
            'An alert fires on 5xx rate / SLO burn, or customers report it. Check the deploy log: does the spike start at the deploy time? Is it only on new-version pods?',
            'Declare an incident: one incident commander coordinating, one person hands-on, a dedicated channel, and a status page or support update if users are affected.',
            'Post short timestamped updates ("14:05 rolled back api v1.42 → v1.41, watching errors") — they become the postmortem timeline.',
          ],
        },
        { type: 'heading3', text: '2. Mitigate: roll back first, debug later' },
        {
          type: 'code',
          lang: 'bash',
          code: `# Kubernetes: confirm what changed and go back to the previous ReplicaSet
kubectl rollout history deployment/api
kubectl rollout undo deployment/api
kubectl rollout status deployment/api

# Or, if the change is behind a flag, disable it (faster, no redeploy)
# Or redeploy the previous image tag through the normal pipeline`,
        },
        {
          type: 'bullets',
          items: [
            'Rolling back is safe only if the release is backward compatible. A migration that dropped or renamed a column can make the old code fail too — the reason to use expand → migrate → contract migrations.',
            'If rollback is impossible, mitigate differently: disable the endpoint, shed load, scale out, or hotfix a one-line revert.',
            'Freeze further deploys to that service until resolved.',
          ],
        },
        { type: 'heading3', text: '3. Verify' },
        {
          type: 'paragraph',
          text: 'Watch error rate, p95/p99 latency and key business metrics (orders per minute) return to the pre-deploy baseline for a few minutes before declaring the impact over. Check side effects: failed jobs to replay, messages in dead-letter queues, data written incorrectly while broken.',
        },
        { type: 'heading3', text: '4. Root cause' },
        {
          type: 'bullets',
          items: [
            'Group errors by type and stack trace (Sentry or log search with the new version label); open traces of failing requests.',
            'Diff the release: code, dependencies (lockfile), config and environment variables, infrastructure, migrations.',
            'Typical findings: missing env var or secret in production, a dependency upgrade, a query that is slow on production-sized data, a contract change breaking another service, a code path only real traffic hits.',
            'Reproduce in staging, fix, and add the test that would have caught it.',
          ],
        },
        { type: 'heading3', text: '5. Blameless postmortem and prevention' },
        {
          type: 'numbered',
          items: [
            'Write the timeline, impact (users, duration, revenue), root cause, and what went well/badly — focus on systems, not people.',
            '**Canary releases:** ship to a small slice of traffic, compare error rate and latency against the stable version, and roll back automatically on regression.',
            '**Blue-green:** keep the old environment running and switch traffic back instantly.',
            'Feature flags to separate deploy from release; smoke tests and readiness checks that block bad pods from receiving traffic.',
            'Owned, dated action items — and check they actually get done.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: the strongest signal is the phrase "mitigate first, investigate second" — roll back within minutes instead of debugging in production. Follow it with one real story: what the alert was, how long until rollback, the root cause, and the process change (canary, flag, migration rule) that came out of the postmortem.',
        },
      ],
    },

  'How do you add logging, metrics, and tracing to a Node.js service so production issues are easy to debug?':
    {
      summary:
        'Use the three pillars together. Structured JSON logs (e.g. pino) with a request/correlation ID carried through async code by `AsyncLocalStorage`, appropriate log levels, and redaction of secrets and PII. Metrics in RED form for every endpoint (rate, errors, duration as histograms) plus USE/runtime metrics (CPU, memory, event-loop delay, pool usage), exported Prometheus-style and alerted on. Distributed tracing with OpenTelemetry auto-instrumentation so one request can be followed across HTTP, database and queue hops, with sampling to control cost — and trace IDs in the logs so you can jump between them.',
      details: [
        {
          type: 'paragraph',
          text: 'The goal is to answer three incident questions fast: *is something wrong* (metrics + alerts), *where* (traces), and *why* (logs). Each pillar should link to the others via shared IDs and labels.',
        },
        {
          type: 'flow',
          title: 'Telemetry pipeline',
          code: `flowchart LR
  A["Node service<br/>pino + prom-client + OTel"]:::server
  A -->|"JSON logs, stdout"| L["Log store<br/>(Loki / ELK)"]:::db
  A -->|"/metrics scrape"| P["Prometheus"]:::db
  A -->|"OTLP spans"| T["Tracing backend<br/>(Jaeger / Tempo)"]:::db
  P --> AL["Alerts<br/>RED + SLOs"]:::security
  L & P & T --> G["Dashboards<br/>linked by trace_id"]:::highlight`,
        },
        { type: 'heading3', text: '1. Structured logs with a request ID' },
        {
          type: 'code',
          lang: 'javascript',
          code: `const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');
const pino = require('pino');

const als = new AsyncLocalStorage();
const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', '*.password', '*.cardNumber'],
  mixin: () => als.getStore() ?? {},   // adds requestId etc. to every log line
});

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] ?? randomUUID();
  res.setHeader('x-request-id', requestId);
  als.run({ requestId, method: req.method, path: req.path }, next);
});

// Anywhere deeper in the call stack, no need to pass req around:
logger.info({ count: orders.length }, 'loaded orders');
// {"level":30,"time":...,"requestId":"abc-1","method":"GET","path":"/orders","count":3,"msg":"loaded orders"}`,
        },
        {
          type: 'bullets',
          items: [
            'Log to stdout as JSON and let the platform ship it; never `console.log` strings you will need to grep.',
            'Levels: `error` for failures needing attention, `warn` for degraded but handled, `info` for key business events, `debug` off in production (switchable at runtime).',
            'Forward the request ID to downstream services and queue messages so logs correlate across services.',
            'Never log tokens, passwords, full card numbers or unnecessary PII; use redaction as a safety net, not the plan.',
          ],
        },
        { type: 'heading3', text: '2. Metrics: RED for requests, USE for resources' },
        {
          type: 'code',
          lang: 'javascript',
          code: `const client = require('prom-client');
client.collectDefaultMetrics(); // CPU, heap, GC, event loop lag

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  // use the route template, not the raw URL, to keep label cardinality low
  res.on('finish', () => end({ method: req.method, route: req.route?.path ?? 'unknown', status: res.statusCode }));
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});`,
        },
        {
          type: 'paragraph',
          text: 'Add business and resource gauges that matter in incidents: DB pool waiting clients, queue depth, cache hit rate, outbound call latency per dependency. Alert on symptoms users feel (error rate, p99 latency, SLO burn rate) rather than every internal metric.',
        },
        { type: 'heading3', text: '3. Distributed tracing with OpenTelemetry' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// tracing.js — load before the app: node --require ./tracing.js server.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  serviceName: 'orders-api',
  traceExporter: new OTLPTraceExporter(), // endpoint from OTEL_EXPORTER_OTLP_ENDPOINT
  instrumentations: [getNodeAutoInstrumentations()], // http, express, pg, redis, ...
});
sdk.start();`,
        },
        {
          type: 'bullets',
          items: [
            'Auto-instrumentation creates spans for incoming requests, outgoing HTTP, DB and cache calls and propagates the W3C `traceparent` header between services. Add manual spans around important business steps.',
            'Sample to control cost (e.g. a percentage of normal traffic, but keep errors and slow requests via tail sampling in the collector).',
            'Put `trace_id` in every log line so a slow trace links to its logs and vice versa. Tracing concepts across services are covered in the Microservices category.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: tie it to an incident — "an alert on p99 latency (metrics) told us something was wrong, the trace showed 4 s in one SQL span, and the logs filtered by that trace ID showed the exact query and tenant." That shows you use the pillars together, not just that you know the tool names.',
        },
      ],
    },
};
