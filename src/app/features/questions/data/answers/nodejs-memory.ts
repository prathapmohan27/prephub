import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'how-garbage-collection-works': {
    summary:
      "Node uses V8's generational, tracing garbage collector. Objects are allocated in the **young generation** and cleaned by a fast **Scavenge** (semi-space copying) collection; objects that survive two scavenges are promoted to the **old generation**, which is collected by **Mark-Sweep-Compact** — done mostly incrementally and concurrently on helper threads to keep pauses short. Anything still reachable from a root (globals, the stack, closures, handles) is kept; everything else is freed.",
    details: [
      {
        type: 'paragraph',
        text: 'JavaScript has no `free()`. V8 decides an object is garbage when it is no longer **reachable** from a set of roots: the global object, the current call stack, active closures and handles held by Node internals (timers, sockets, listeners). The design rests on the "generational hypothesis": most objects die young, so V8 collects young objects often and cheaply and old objects rarely.',
      },
      { type: 'heading3', text: 'The heap spaces' },
      {
        type: 'bullets',
        items: [
          '**New space (young generation)** — small (a few to tens of MB), split into two semi-spaces. Most allocations land here.',
          '**Old space (old generation)** — objects that survived; this is what `--max-old-space-size` limits.',
          '**Large object space** — objects too big for normal pages, never moved.',
          '**Code space** — JIT-compiled machine code.',
          'Outside the V8 heap: `Buffer`/`ArrayBuffer` memory (reported as `external` and `arrayBuffers`).',
        ],
      },
      { type: 'heading3', text: 'Minor GC: Scavenge' },
      {
        type: 'paragraph',
        text: 'Live objects are copied from the "from" semi-space to the "to" semi-space, then the roles flip. Cost is proportional to the number of **live** objects, so it is very fast when most objects are dead. Objects that survive twice are promoted to old space. V8\'s Orinoco project made this parallel across helper threads.',
      },
      { type: 'heading3', text: 'Major GC: Mark-Sweep-Compact' },
      {
        type: 'numbered',
        items: [
          '**Mark** — traverse from roots, marking every reachable object (tri-colour marking). Done incrementally and concurrently while JS keeps running, with write barriers to track changes.',
          '**Sweep** — free memory of unmarked objects, adding it to free lists (concurrent, lazy).',
          '**Compact** — move surviving objects together on fragmented pages to reduce fragmentation (done selectively).',
        ],
      },
      {
        type: 'flow',
        title: 'Object lifecycle in V8',
        code: `flowchart LR
  A["new object"]:::client --> N["New space<br/>(nursery)"]:::cache
  N -->|"dead at Scavenge"| F["freed"]:::external
  N -->|"survives 2 Scavenges"| O["Old space"]:::db
  O -->|"unreachable at<br/>Mark-Sweep"| F
  O -->|"still reachable"| O`,
      },
      { type: 'heading3', text: 'Observing it' },
      {
        type: 'code',
        lang: 'bash',
        code: `# Log every GC event with timing
node --trace-gc app.js
# [12345:0x...]   52 ms: Scavenge 4.1 (5.0) -> 3.6 (6.0) MB, 0.8 / 0.0 ms ...
# [12345:0x...] 1840 ms: Mark-Compact 120.3 (130.1) -> 80.2 (95.0) MB, 45.1 / 0.0 ms ...

# Raise the old-generation limit (MB) — e.g. container with 4 GB RAM
node --max-old-space-size=3072 app.js`,
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `console.log(process.memoryUsage());
// { rss: 52_000_000,        total memory held by the process
//   heapTotal: 20_000_000,  V8 heap reserved
//   heapUsed: 12_000_000,   V8 heap in use
//   external: 1_500_000,    C++ objects bound to JS (incl. Buffers)
//   arrayBuffers: 300_000 }`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Key point for interviews: GC is "stop-the-world" only for short phases — most marking and sweeping is concurrent — but a huge heap or high allocation rate still causes noticeable pauses on the single JS thread. Reducing allocations (reusing objects, avoiding giant arrays/strings) is the practical lever.',
      },
    ],
  },

  'common-causes-of-memory-leaks': {
    summary:
      'A leak in a GC language is memory that stays **reachable** when you no longer need it. Common causes: unbounded in-memory caches/maps, global variables, event listeners that are never removed, timers/intervals that are never cleared, closures capturing large objects, and growing collections of pending promises or requests. Long-running servers turn small per-request leaks into OOM crashes.',
    details: [
      {
        type: 'paragraph',
        text: 'The GC only frees what is unreachable. So a "leak" is almost always a reference you forgot about: something long-lived (a module-level object, an emitter, a timer) holds a reference to something per-request. Each request adds a little, the heap only grows, GC runs more and more often, latency rises, and finally the process dies with "JavaScript heap out of memory".',
      },
      { type: 'heading3', text: '1. Unbounded caches and module-level maps' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Grows forever — one entry per unique user/URL
const cache = new Map();
app.get('/user/:id', async (req, res) => {
  if (!cache.has(req.params.id)) {
    cache.set(req.params.id, await db.users.find(req.params.id));
  }
  res.json(cache.get(req.params.id));
});

// ✅ Bounded with size limit + TTL (npm 'lru-cache')
import { LRUCache } from 'lru-cache';
const users = new LRUCache({ max: 10_000, ttl: 60_000 });`,
      },
      { type: 'heading3', text: '2. Event listeners that are never removed' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Adds a listener to a long-lived emitter on EVERY request
app.get('/stream', (req, res) => {
  const onPrice = (p) => res.write(\`data: \${p}\\n\\n\`);
  priceFeed.on('price', onPrice); // closure holds res forever
});
// Warning: MaxListenersExceededWarning: Possible EventEmitter memory leak detected

// ✅ Remove on close
app.get('/stream', (req, res) => {
  const onPrice = (p) => res.write(\`data: \${p}\\n\\n\`);
  priceFeed.on('price', onPrice);
  req.on('close', () => priceFeed.off('price', onPrice));
});`,
      },
      { type: 'heading3', text: '3. Timers and closures' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ setInterval keeps its callback — and everything it closes over — alive forever
function startPolling(bigConfig) {
  setInterval(() => check(bigConfig), 1000); // never cleared
}

// ✅ Keep the handle and clear it, or unref/abort
const timer = setInterval(poll, 1000);
process.on('SIGTERM', () => clearInterval(timer));

// ❌ Closure retaining a large object it doesn't need
function handler() {
  const huge = loadHugeReport();          // 50 MB
  const summary = huge.summary;
  return () => summary;                   // fine in modern V8, but avoid putting
}                                          // 'huge' in any closure that outlives the call`,
      },
      { type: 'heading3', text: 'Other frequent culprits' },
      {
        type: 'bullets',
        items: [
          '**Accidental globals** — assigning to an undeclared variable in sloppy mode (use ESM/strict mode, which throws).',
          '**Arrays used as logs/queues** that are pushed to but never drained, e.g. storing every request for metrics.',
          '**Promises that never settle** — e.g. a request awaiting a reply that never comes, with no timeout; each holds its closures.',
          '**Unconsumed streams / response bodies** — with `fetch`/undici, not reading or cancelling `res.body` keeps the connection and buffers alive.',
          '**Per-request objects stored on singletons** — in NestJS/Express, attaching request data to a singleton service or `app.locals`.',
          '**Retained Buffers** — a tiny `buf.subarray()` slice keeps the whole underlying allocation.',
          '**Native addons / unclosed handles** — DB connections, file descriptors, sockets that are opened per request and never closed.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Rule of thumb to quote: "Anything long-lived that holds a reference to something short-lived is a leak candidate." Every cache needs a bound, every `on()` needs an `off()`, every `setInterval` needs a `clearInterval`, every outbound call needs a timeout.',
      },
    ],
  },

  'diagnose-a-leak-in-production': {
    summary:
      'First **detect** it from metrics: heap used / RSS growing steadily across GC cycles (a sawtooth whose floor keeps rising), increasing GC time, and eventual OOM restarts. Then **diagnose** by taking heap snapshots at intervals (via `--heapsnapshot-signal`, `v8.writeHeapSnapshot()` or the inspector), comparing them in Chrome DevTools to find which object types grow and following their retainer chain back to the code holding them.',
    details: [
      {
        type: 'paragraph',
        text: 'Healthy memory looks like a sawtooth: it rises as objects are allocated and drops after GC, returning to roughly the same baseline. A leak shows the **baseline** (memory after GC) creeping up over hours or days. Since leaks often only appear under real traffic, you need a way to capture evidence from production safely.',
      },
      { type: 'heading3', text: 'Step 1: Detect with metrics' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Export memory metrics (e.g. prom-client collects these by default)
import client from 'prom-client';
client.collectDefaultMetrics(); // nodejs_heap_size_used_bytes, nodejs_gc_duration_seconds, ...

// Or log periodically
setInterval(() => {
  const { rss, heapUsed, external } = process.memoryUsage();
  logger.info({ rss, heapUsed, external }, 'memory');
}, 60_000).unref();`,
      },
      {
        type: 'bullets',
        items: [
          'Alert on heap-after-GC trend and on container restarts with exit code 137 (OOMKilled) or "heap out of memory".',
          'Correlate with deploys and traffic: a leak that started with release X narrows the search to that diff.',
          'If `heapUsed` is flat but `rss`/`external` grows, suspect Buffers, native addons or memory fragmentation rather than JS objects.',
        ],
      },
      { type: 'heading3', text: 'Step 2: Capture heap snapshots' },
      {
        type: 'code',
        lang: 'bash',
        code: `# Write a snapshot when the process receives a signal
node --heapsnapshot-signal=SIGUSR2 app.js
kill -USR2 <pid>          # → Heap.<date>.<pid>.heapsnapshot in cwd

# Automatically write snapshots as the heap nears its limit (useful for OOM)
node --heapsnapshot-near-heap-limit=2 app.js

# Or attach the inspector (only on a private network / via port-forward!)
node --inspect=127.0.0.1:9229 app.js`,
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Programmatic snapshot behind an admin-only endpoint
import v8 from 'node:v8';
adminRouter.post('/debug/heap', (req, res) => {
  const file = v8.writeHeapSnapshot(); // blocks the event loop while writing!
  res.json({ file });
});`,
      },
      { type: 'heading3', text: 'Step 3: Analyse in Chrome DevTools' },
      {
        type: 'numbered',
        items: [
          'Take snapshot A after warm-up, send traffic, take B, send more traffic, take C.',
          'Load them in DevTools → Memory. Use the **Comparison** view (B vs A, C vs B) and sort by "# Delta" / "Size Delta".',
          'Look for constructors whose count only grows: `(closure)`, `Array`, your own classes, `IncomingMessage`, `Socket`...',
          'Select an instance and read the **Retainers** panel — the chain from GC root to the object tells you exactly which variable holds it (e.g. `cache` in `userService.js` → `Map` → entries).',
          'Fix, deploy, and confirm the post-GC baseline is flat.',
        ],
      },
      {
        type: 'flow',
        title: 'Leak investigation workflow',
        code: `flowchart TD
  M["Metrics: heap floor<br/>rising over time"]:::highlight --> R{"heapUsed or<br/>external/RSS?"}
  R -->|heapUsed| S["Take 3 heap snapshots<br/>under traffic"]:::server
  R -->|"external / RSS"| N["Check Buffers, native addons,<br/>allocator fragmentation"]:::external
  S --> C["Compare snapshots<br/>sort by delta"]:::server
  C --> RT["Follow retainer chain<br/>to the owning code"]:::security
  RT --> FX["Fix + verify flat<br/>baseline"]:::db`,
      },
      { type: 'heading3', text: 'Other tools' },
      {
        type: 'bullets',
        items: [
          '**Allocation sampling / allocation timeline** in DevTools — shows which call sites allocate the retained memory.',
          '**APM** (Datadog, New Relic, Dynatrace, Elastic) — continuous heap and GC metrics, some with heap profiling.',
          '**Clinic.js Heap Profiler** (`clinic heapprofiler`) for flame-graph style allocation views (best locally/staging).',
          '`--trace-gc` to see GC frequency and how much each cycle reclaims.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Writing a heap snapshot is synchronous, pauses the process and can need roughly as much extra memory as the heap itself. Take it on one instance that is drained from the load balancer, or reproduce in staging with replayed traffic — and never expose the inspector port publicly.',
      },
    ],
  },

  'test-for-memory-leaks': {
    summary:
      "Run the suspect operation many times in a loop, force GC (`node --expose-gc` + `global.gc()`), and assert that heap usage after GC stays within a small bound — or use a `WeakRef`/`FinalizationRegistry` to assert a specific object gets collected. Complement unit-level checks with soak/load tests (autocannon, k6) while monitoring the post-GC heap trend, and Jest's `--detectLeaks` / `--detectOpenHandles` for test-suite leaks.",
    details: [
      {
        type: 'paragraph',
        text: 'Memory tests are inherently noisy — GC timing, JIT and caches all change heap size. The trick is to measure **after forced GC**, warm up first, run enough iterations that a real leak dominates the noise, and assert a generous threshold rather than an exact number.',
      },
      { type: 'heading3', text: 'Approach 1: heap growth test' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// leak.test.mjs — run with: node --expose-gc --test leak.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { handleRequest } from './handler.js';

function heapAfterGc() {
  global.gc();
  global.gc(); // twice to also collect objects freed by the first pass
  return process.memoryUsage().heapUsed;
}

test('handleRequest does not leak', async () => {
  for (let i = 0; i < 1_000; i++) await handleRequest(fakeReq()); // warm-up (JIT, caches)
  const before = heapAfterGc();

  for (let i = 0; i < 20_000; i++) await handleRequest(fakeReq());
  const after = heapAfterGc();

  const growthMb = (after - before) / 1024 / 1024;
  assert.ok(growthMb < 5, \`heap grew \${growthMb.toFixed(1)} MB\`);
});`,
      },
      { type: 'heading3', text: 'Approach 2: assert a specific object is collected' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// run with --expose-gc
import { setImmediate as tick } from 'node:timers/promises';

test('component is released after destroy()', async () => {
  let widget = createWidget(emitter);
  const ref = new WeakRef(widget);

  widget.destroy();     // should remove its listeners from 'emitter'
  widget = null;        // drop our own reference

  await tick();         // let pending callbacks settle
  global.gc();

  assert.strictEqual(ref.deref(), undefined, 'widget is still retained');
});`,
      },
      { type: 'heading3', text: 'Approach 3: soak / load test' },
      {
        type: 'code',
        lang: 'bash',
        code: `# Start the server with a smaller heap so leaks surface faster
node --max-old-space-size=256 --trace-gc server.js &

# Hammer it for 30 minutes
npx autocannon -c 50 -d 1800 http://localhost:3000/api/orders

# Watch: does Mark-Compact still reclaim back to the same floor?`,
      },
      {
        type: 'bullets',
        items: [
          '**Jest**: `--detectOpenHandles` finds timers/sockets keeping the process alive; `--detectLeaks` (experimental) fails if test files are retained between tests; `--logHeapUsage` prints heap after each test file.',
          '**memlab** (Meta) can automate snapshot diffing for Node and browser scenarios.',
          'Add the soak test to a nightly CI job and graph heap-after-GC; a rising slope is a failing build.',
          'Lower `--max-old-space-size` in tests so a leak crashes quickly instead of hiding.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Mention that `global.gc()` is only for tests/diagnostics — never call it in production code. And always warm up before measuring, otherwise lazily-initialised caches look like leaks.',
      },
    ],
  },

  'tools-to-monitor-memory-usage': {
    summary:
      "Built-ins: `process.memoryUsage()`, `v8.getHeapStatistics()`/`getHeapSpaceStatistics()`, `--trace-gc`, `perf_hooks` GC entries, heap snapshots (`v8.writeHeapSnapshot`, `--heapsnapshot-signal`) and the inspector with Chrome DevTools. In production: Prometheus via `prom-client` + Grafana, APM agents (Datadog, New Relic, Elastic, Dynatrace), container metrics, and PM2's monitoring. For deep analysis: Clinic.js and memlab.",
    details: [
      {
        type: 'paragraph',
        text: 'Think in two layers: **continuous monitoring** (cheap metrics always on, with alerts) to know that something is wrong, and **diagnostic tools** (heap snapshots, profilers) used on demand to find out why.',
      },
      { type: 'heading3', text: 'Built-in APIs' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import v8 from 'node:v8';
import { PerformanceObserver } from 'node:perf_hooks';

// 1. Process-level numbers
const m = process.memoryUsage();
// rss, heapTotal, heapUsed, external, arrayBuffers (bytes)

// 2. Heap limit & usage — how close are we to OOM?
const h = v8.getHeapStatistics();
console.log((h.used_heap_size / h.heap_size_limit * 100).toFixed(1) + '% of heap limit');

// 3. Per-space breakdown (new_space, old_space, large_object_space...)
console.table(v8.getHeapSpaceStatistics().map(s => ({
  space: s.space_name, usedMb: (s.space_used_size / 1e6).toFixed(1),
})));

// 4. GC pauses as performance entries
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    console.log('GC', e.detail?.kind, e.duration.toFixed(1), 'ms');
  }
}).observe({ entryTypes: ['gc'] });`,
      },
      { type: 'heading3', text: 'CLI flags' },
      {
        type: 'code',
        lang: 'bash',
        code: `node --trace-gc app.js                      # one line per GC with before/after sizes
node --inspect app.js                        # attach Chrome DevTools (chrome://inspect)
node --heapsnapshot-signal=SIGUSR2 app.js    # snapshot on demand
node --heapsnapshot-near-heap-limit=1 app.js # snapshot right before OOM
node --max-old-space-size=2048 app.js        # set heap limit (MB)`,
      },
      { type: 'heading3', text: 'Production monitoring' },
      {
        type: 'bullets',
        items: [
          '**prom-client** — `collectDefaultMetrics()` exposes heap size, heap spaces, external memory, GC duration and event-loop lag for Prometheus/Grafana dashboards and alerts.',
          '**APM agents** — Datadog, New Relic, Elastic APM, Dynatrace, AppSignal: memory, GC and event-loop metrics per service, correlated with traces and deploys.',
          '**Container / orchestrator metrics** — cAdvisor/Kubernetes `container_memory_working_set_bytes`, OOMKilled restarts.',
          '**PM2** — `pm2 monit` and `max_memory_restart` (a safety net, not a fix).',
          '**OpenTelemetry** — runtime metrics instrumentation exported to any backend.',
        ],
      },
      { type: 'heading3', text: 'Diagnostic tools' },
      {
        type: 'bullets',
        items: [
          '**Chrome DevTools Memory tab** — heap snapshots, comparison view, retainers, allocation timeline/sampling.',
          '**Clinic.js** — `clinic doctor` (spots memory/GC/event-loop issues), `clinic heapprofiler` (allocation flame graphs).',
          '**memlab** — automated leak detection by diffing snapshots.',
          '**heapdump / v8-profiler-next** packages — older approaches, largely replaced by built-in `v8.writeHeapSnapshot()`.',
        ],
      },
      {
        type: 'flow',
        title: 'Monitoring pipeline',
        code: `flowchart LR
  APP["Node app<br/>prom-client / OTel"]:::server --> PR["Prometheus /<br/>APM backend"]:::db
  PR --> G["Grafana<br/>dashboards"]:::client
  PR --> AL["Alert: heap > 85%<br/>of limit"]:::security
  AL --> SN["On-call takes<br/>heap snapshot"]:::highlight`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'In containers, set `--max-old-space-size` below the container limit (leave room for Buffers, native memory and the new space — e.g. ~75% of the limit) and alert on heap usage relative to `heap_size_limit`, not absolute numbers.',
      },
    ],
  },
};
