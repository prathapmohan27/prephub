var e={"profile-and-debug-performance-issues":{summary:"Start by measuring, not guessing: confirm the symptom with metrics (latency percentiles, throughput, CPU, memory, event-loop lag), then narrow down with the right tool — CPU profiles and flame graphs (`--cpu-prof`, Chrome DevTools via `--inspect`, Clinic.js) for CPU-bound slowness, heap snapshots and `--heapsnapshot-signal` for memory leaks, and distributed tracing/APM for slow I/O like DB queries or downstream APIs. Fix the hottest path, then re-measure.",details:[{type:`paragraph`,text:`Most Node.js slowness falls into three buckets: (1) the event loop is blocked by synchronous CPU work, (2) the app is waiting on slow I/O (DB, network), or (3) memory pressure causing long GC pauses or crashes. Each needs a different tool.`},{type:`flow`,title:`Diagnosis workflow`,code:`flowchart TD
  S["Symptom: slow or unstable"]:::client --> M["Metrics: p95/p99, CPU,<br/>heap, event-loop lag"]:::highlight
  M --> Q{"Which resource?"}
  Q -->|"High CPU, high loop lag"| CPU["CPU profile / flame graph<br/>--cpu-prof, clinic flame"]:::server
  Q -->|"Low CPU, high latency"| IO["Tracing / APM<br/>slow queries, external calls"]:::db
  Q -->|"Growing memory, GC"| MEM["Heap snapshots<br/>compare over time"]:::cache
  CPU --> F["Fix hottest path, re-measure"]:::highlight
  IO --> F
  MEM --> F`},{type:`heading3`,text:`1. Measure event-loop lag in production`},{type:`code`,lang:`typescript`,code:`import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => {
  console.log({
    loopP99ms: h.percentile(99) / 1e6,          // ns \u2192 ms; > ~100ms = blocked loop
    elu: performance.eventLoopUtilization().utilization,
    heapUsedMB: process.memoryUsage().heapUsed / 1e6,
  });
  h.reset();
}, 10_000);`},{type:`heading3`,text:`2. CPU profiling`},{type:`code`,lang:`bash`,code:`# Writes a .cpuprofile on exit \u2014 open in Chrome DevTools \u2192 Performance
node --cpu-prof --cpu-prof-dir=./profiles dist/server.js

# Attach DevTools live: open chrome://inspect
node --inspect dist/server.js

# Clinic.js under load (autocannon generates traffic)
npx clinic doctor -- node dist/server.js     # overall diagnosis
npx clinic flame  -- node dist/server.js     # flame graph of hot functions
npx autocannon -c 100 -d 30 http://localhost:3000/api/products`},{type:`heading3`,text:`3. Memory leaks`},{type:`code`,lang:`bash`,code:`# Take heap snapshots on demand without restarting
node --heapsnapshot-signal=SIGUSR2 dist/server.js
kill -USR2 <pid>      # snapshot 1 ... generate load ... snapshot 2
# Compare in DevTools \u2192 Memory \u2192 "Comparison" view: look for growing object counts
# Typical culprits: unbounded Maps/caches, listeners never removed, closures holding requests`},{type:`bullets`,items:[`**APM / tracing:** OpenTelemetry, Datadog, New Relic — shows time per DB query and HTTP call per request.`,"**DB side:** slow query logs, `EXPLAIN ANALYZE`, MongoDB profiler.","**Sync APIs:** `--trace-sync-io` warns when synchronous I/O runs after the first tick.",`**Load test** before and after each change; compare p95/p99, not just averages.`]},{type:`callout`,variant:`tip`,text:`Interview tip: describe a concrete process (metrics → hypothesis → profile → fix → verify) and, if you can, a real example: "[your project]: p99 jumped to 2s; a flame graph showed JSON.parse of a 5 MB payload on every request; caching the parsed result fixed it." Mark it clearly as your own experience.`}]},"performance-optimization-techniques":{summary:`Keep the event loop free (no heavy sync work — move CPU tasks to worker threads or queues), make I/O efficient (indexes, connection pooling, avoiding N+1, running independent calls in parallel), cache aggressively (in-memory, Redis, HTTP/CDN), reduce payloads (pagination, field selection, compression, streaming), and scale out across cores (cluster/PM2/containers). Always profile first and measure after each change.`,details:[{type:`heading3`,text:`1. Don't block the event loop`},{type:`code`,lang:`typescript`,code:`// \u274C Synchronous work in a request handler blocks ALL requests
app.get('/report', (req, res) => {
  const data = fs.readFileSync('big.json', 'utf8');   // sync I/O
  const result = heavyCalculation(JSON.parse(data));   // CPU-bound
  res.json(result);
});

// \u2705 Async I/O + offload CPU work
app.get('/report', async (req, res) => {
  const data = await fs.promises.readFile('big.json', 'utf8');
  const result = await pool.run(data);                // Piscina worker pool
  res.json(result);
});`},{type:`heading3`,text:`2. Parallelize independent I/O`},{type:`code`,lang:`typescript`,code:`// \u274C Sequential: 120 + 80 + 100 = ~300 ms
const user = await getUser(id);
const orders = await getOrders(id);
const recs = await getRecommendations(id);

// \u2705 Parallel: max(120, 80, 100) = ~120 ms
const [user2, orders2, recs2] = await Promise.all([
  getUser(id), getOrders(id), getRecommendations(id),
]);`},{type:`heading3`,text:`3. Stream large data instead of buffering`},{type:`code`,lang:`typescript`,code:`import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import { createGzip } from 'node:zlib';

app.get('/export', async (_req, res) => {
  res.setHeader('Content-Encoding', 'gzip');
  await pipeline(createReadStream('export.csv'), createGzip(), res); // constant memory
});`},{type:`heading3`,text:`Checklist`},{type:`bullets`,items:[`**Database:** indexes, connection pooling, select only needed columns, fix N+1, cursor pagination, read replicas.`,"**Caching:** in-process LRU for hot static data, Redis for shared data, `Cache-Control`/ETag and CDN for HTTP responses.","**Payloads:** compression (often at the reverse proxy), pagination, avoid huge `JSON.stringify` on hot paths, faster serializers (Fastify schemas).",`**Framework:** Fastify has lower overhead than Express for high-throughput APIs.`,`**Concurrency:** cluster module / PM2 / multiple containers to use all cores; worker threads for CPU tasks; BullMQ for background work.`,"**HTTP clients:** reuse connections with keep-alive (undici / built-in `fetch` pool by default).","**Runtime:** current LTS Node, `NODE_ENV=production`, tune `--max-old-space-size` to container memory.","**Logging:** async structured logger (pino) instead of heavy sync `console.log` in hot paths."]},{type:`callout`,variant:`warning`,text:"Pitfall: optimizing without measuring. Micro-optimizations (for vs forEach) rarely matter; one missing index or a sequential `await` in a loop usually dominates. Profile, fix the biggest bottleneck, re-measure."},{type:`divider`},{type:`heading3`,text:`Follow-up: What is lazy loading and how do you implement it?`},{type:`paragraph`,text:"Lazy loading means deferring the loading or initialization of something until it is actually needed, instead of doing it up front. In Node.js that includes dynamically importing heavy modules with `await import()` only on the code paths that use them, creating expensive resources (clients, connections, caches) on first use, and loading related data or large result sets on demand. It improves startup time and memory — critical for serverless cold starts and CLIs — at the cost of a delay on first use."},{type:`heading3`,text:`1. Lazy module loading`},{type:`code`,lang:`typescript`,code:`// \u274C Eager: loaded at startup even if no one ever exports a PDF
import puppeteer from 'puppeteer';

// \u2705 Lazy: loaded on first request to this route, then cached by the module system
app.get('/invoice/:id/pdf', async (req, res) => {
  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch();
  // ...
});
// Subsequent import() calls resolve immediately from the module cache`},{type:`heading3`,text:`2. Lazy singleton initialization`},{type:`code`,lang:`typescript`,code:`let clientPromise: Promise<S3Client> | undefined;

export function getS3(): Promise<S3Client> {
  // Store the PROMISE so concurrent callers share one initialization
  clientPromise ??= (async () => {
    const { S3Client } = await import('@aws-sdk/client-s3');
    return new S3Client({ region: process.env.AWS_REGION });
  })();
  return clientPromise;
}

// Usage
const s3 = await getS3();   // first call creates it, later calls reuse it`},{type:`heading3`,text:`3. Lazy data loading`},{type:`code`,lang:`typescript`,code:`// Load relations only when requested: GET /users/7?include=orders
const include = String(req.query.include ?? '').split(',');
const user = await prisma.user.findUnique({
  where: { id: 7 },
  include: { orders: include.includes('orders') },
});

// Process a huge collection lazily with an async iterator instead of loading all rows
for await (const doc of db.collection('events').find({ type: 'click' })) {
  await handle(doc);       // MongoDB cursor fetches batches on demand
}`},{type:`bullets`,items:[`**Benefits:** faster startup/cold starts, lower baseline memory, unused features cost nothing.`,`**Costs:** first request on that path is slower; errors (missing module, bad config) surface at runtime instead of startup.`,`**Mitigation:** warm critical lazy resources after startup or in a readiness check; validate config eagerly even if the client is created lazily.`,`**Beware ORM lazy relations:** lazy-loading related entities inside a loop is exactly the N+1 problem.`,'On the frontend, lazy loading means code-splitting routes/components (e.g. Angular `loadComponent`, `@defer`) and `loading="lazy"` images.']},{type:`callout`,variant:`warning`,text:"Pitfall: a lazy initializer that stores the resolved value instead of the promise. Two concurrent requests both see `undefined` and create two clients/connections. Cache the promise (`??=` on the promise) as shown above."}]},"database-connection-pooling":{summary:`A connection pool keeps a set of already-open database connections and lends them to queries on demand, returning them to the pool afterwards instead of closing them. This avoids the cost of a TCP + TLS + auth handshake per query and caps concurrent connections so the database is not overwhelmed. When all connections are busy, new requests wait in a queue until one is released or a timeout fires.`,details:[{type:`paragraph`,text:`Opening a PostgreSQL connection can take several milliseconds and each one costs server memory (Postgres forks a process per connection). Because Node.js handles many concurrent requests on one thread, a small pool (often 10–20) can serve thousands of requests per second.`},{type:`heading3`,text:`node-postgres pool`},{type:`code`,lang:`typescript`,code:`import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                          // max open connections per process
  idleTimeoutMillis: 30_000,        // close idle connections after 30s
  connectionTimeoutMillis: 2_000,   // fail if no connection available in 2s
});

// Simple query: pool checks out a connection, runs, returns it automatically
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// Transaction: must use ONE connection for all statements
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = $1', [a]);
  await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = $1', [b]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();                 // \u2190 forgetting this leaks the connection
}`},{type:`flow`,title:`Pool lifecycle`,code:`flowchart LR
  R1["Request A"]:::client --> P{"Pool<br/>idle connection?"}:::highlight
  R2["Request B"]:::client --> P
  P -->|yes| C["Checkout connection"]:::server
  P -->|"no, below max"| N["Open new connection"]:::server
  P -->|"no, at max"| Q["Wait in queue<br/>until timeout"]:::queue
  C --> DB[("Database")]:::db
  N --> DB
  DB --> REL["release() back to pool"]:::cache
  REL --> P`},{type:`heading3`,text:`Sizing the pool`},{type:`bullets`,items:["Total connections = pool max × number of processes/pods. 10 pods × 20 = 200 — check against the DB's `max_connections`.",`Bigger is not faster: the DB has limited cores; too many connections cause contention. Start small and load test.`,`Serverless / many pods: use an external pooler (PgBouncer, RDS Proxy) in transaction mode.`,"MongoDB driver pools automatically (`maxPoolSize`, default 100); Prisma uses `connection_limit`; mysql2 uses `createPool({ connectionLimit })`.",`Create ONE pool per process at startup and reuse it — never create a pool per request.`,"Close the pool on shutdown: `await pool.end()` in your SIGTERM handler."]},{type:`callout`,variant:`warning`,text:"Classic production bug: a code path that calls `pool.connect()` but skips `release()` on an error. The pool slowly drains, then every request hangs until `connectionTimeoutMillis`. Always release in `finally`, and monitor `pool.totalCount`, `idleCount` and `waitingCount`."}]},"offset-vs-cursor-pagination":{summary:'Offset pagination uses `LIMIT n OFFSET k` (or `skip`) — simple and supports jumping to page N, but the database still scans and discards k rows, so deep pages get slow, and inserts/deletes cause duplicated or skipped items. Cursor (keyset) pagination remembers the last item\'s sort key and asks for rows "after" it (`WHERE (created_at, id) < ($1, $2)`) — constant-time with an index and stable under writes, but no random page jumps. Use offset for small admin tables, cursor for feeds, infinite scroll and large datasets.',details:[{type:`heading3`,text:`Offset-based`},{type:`code`,lang:`typescript`,code:`// GET /products?page=3&limit=20
app.get('/products', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);   // cap the page size
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.query('SELECT id, name, price FROM products ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]),
    db.query('SELECT COUNT(*) FROM products'),
  ]);
  res.json({ items: items.rows, page, limit, total: Number(total.rows[0].count) });
});
// OFFSET 200000 \u2192 DB reads 200,020 rows and throws 200,000 away`},{type:`heading3`,text:`Cursor-based (keyset)`},{type:`code`,lang:`typescript`,code:`// GET /posts?limit=20&cursor=eyJjIjoiMjAyNi0xMS0wNVQx...
const encode = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const decode = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString());

app.get('/posts', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const cur = req.query.cursor ? decode(String(req.query.cursor)) : null;

  const { rows } = await db.query(
    \`SELECT id, title, created_at FROM posts
     WHERE ($1::timestamptz IS NULL OR (created_at, id) < ($1, $2))
     ORDER BY created_at DESC, id DESC
     LIMIT $3\`,
    [cur?.c ?? null, cur?.id ?? null, limit + 1],      // fetch one extra to detect "has more"
  );

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  res.json({
    items,
    nextCursor: hasMore && last ? encode({ c: last.created_at, id: last.id }) : null,
  });
});
// Index: CREATE INDEX ON posts (created_at DESC, id DESC);  \u2192 each page is an index seek`},{type:`heading3`,text:`MongoDB equivalent`},{type:`code`,lang:`javascript`,code:`// Offset
db.posts.find().sort({ _id: -1 }).skip(40).limit(20);

// Cursor: _id (ObjectId) is roughly time-ordered and unique
db.posts.find({ _id: { $lt: ObjectId(lastSeenId) } }).sort({ _id: -1 }).limit(20);`},{type:`bullets`,items:[`**Offset:** + jump to any page, + simple total/page counts; − slow deep pages, − items shift when data changes.`,"**Cursor:** + O(log n) per page, + no duplicates/skips during inserts; − no page numbers, − sort key must be unique (add `id` as tie-breaker), − harder to sort by arbitrary columns.",`Make cursors opaque (base64) so clients do not depend on their structure.`,"`COUNT(*)` on large tables is itself expensive — consider estimates or omit totals for feeds.","GraphQL Relay connections (`edges`, `pageInfo.endCursor`) are a standard cursor format."]},{type:`callout`,variant:`tip`,text:"Interview tip: explain WHY offset gets slow (rows are scanned then discarded) and the consistency problem (a new post shifts every page), then show the composite `(created_at, id)` cursor — the tie-breaker detail is what interviewers look for."}]},"http-response-compression":{summary:"Response compression encodes the body (usually gzip or Brotli) before sending it; the client advertises support via `Accept-Encoding` and the server responds with `Content-Encoding`. Text formats like JSON, HTML, CSS and JS typically shrink by 60–90%, cutting bandwidth and transfer time. In Node.js enable it with the `compression` middleware (Express) or `@fastify/compress` — or, preferably in production, at the reverse proxy/CDN (Nginx, Cloudflare) to keep CPU work off the event loop.",details:[{type:`paragraph`,text:`Compression trades CPU for bytes. It pays off for text responses over roughly 1 KB; it is wasteful for already-compressed formats (JPEG, PNG, MP4, ZIP) and for tiny payloads.`},{type:`flow`,title:`Content negotiation`,code:`sequenceDiagram
  participant B as Browser
  participant S as Node.js / Nginx
  B->>S: GET /api/products  Accept-Encoding: br, gzip
  S->>S: JSON 480 KB \u2192 Brotli
  S-->>B: 200  Content-Encoding: br  (\u2248 60 KB)  Vary: Accept-Encoding
  B->>B: Decompress, parse JSON`},{type:`heading3`,text:`Express`},{type:`code`,lang:`typescript`,code:`import express from 'express';
import compression from 'compression';

const app = express();
app.use(compression({
  threshold: 1024,               // skip bodies smaller than 1 KB
  level: 6,                      // zlib level: balance of speed vs size
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);   // default: compressible content types only
  },
}));
// Recent versions of the compression package can also negotiate Brotli \u2014 check the version you use.`},{type:`heading3`,text:`Fastify and reverse proxy`},{type:`code`,lang:`typescript`,code:`// Fastify \u2014 supports br, gzip, deflate
import Fastify from 'fastify';
import compress from '@fastify/compress';

const app = Fastify();
await app.register(compress, { global: true, threshold: 1024, encodings: ['br', 'gzip'] });`},{type:`code`,lang:`text`,code:`# nginx.conf \u2014 compress at the edge instead of in Node.js
gzip on;
gzip_types application/json text/css application/javascript image/svg+xml;
gzip_min_length 1024;
# Brotli needs the ngx_brotli module; CDNs like Cloudflare enable it automatically`},{type:`bullets`,items:["**Brotli** compresses text better than gzip, at higher CPU cost for high levels — pre-compress static assets at build time (`.br`, `.gz`) and serve them directly.",`**Vary: Accept-Encoding** header ensures caches store separate variants.`,"**Streaming:** compression works with streamed responses; for Server-Sent Events call `res.flush()` (the compression middleware adds it) so events are not buffered.",`**Security:** compressing responses that mix secrets with attacker-controlled input can enable BREACH-style attacks — be cautious with sensitive pages over HTTPS.`]},{type:`callout`,variant:`tip`,text:`Interview tip: mention both "how" (middleware) and "where" — in production, compressing at Nginx/CDN offloads CPU from the single-threaded Node.js process and lets the CDN cache compressed variants.`}]}};export{e as answers};