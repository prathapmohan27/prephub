import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is Node.js and how does it differ from browser JavaScript?': {
    summary:
      "Node.js is a JavaScript runtime built on Chrome's V8 engine plus libuv, designed for running JavaScript outside the browser — typically servers, CLIs and tooling. The language is the same, but the environment differs: Node has no DOM or `window`, and instead gives you system APIs (file system, network sockets, processes, streams) and a module system, all built around a non-blocking event loop.",
    details: [
      {
        type: 'paragraph',
        text: 'JavaScript the language (ECMAScript) defines things like objects, closures, promises and classes. Everything else — how you draw on screen, read a file or open a socket — comes from the **host environment**. The browser hosts JS to manipulate web pages safely in a sandbox; Node hosts JS to talk to the operating system with full privileges of the process.',
      },
      { type: 'heading3', text: 'What Node.js is made of' },
      {
        type: 'bullets',
        items: [
          '**V8** — compiles and executes JavaScript (the same engine as Chrome).',
          '**libuv** — a C library providing the event loop, a thread pool and cross-platform async I/O (files, TCP, DNS, timers).',
          '**Core modules** — `fs`, `http`, `net`, `crypto`, `stream`, `child_process`, `worker_threads`, etc., exposed via JS bindings to C++.',
          '**npm ecosystem** — the package manager and registry that made Node popular for tooling and backends.',
        ],
      },
      { type: 'heading3', text: 'Same language, different globals' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Browser
console.log(typeof window);    // 'object'
document.querySelector('h1');  // DOM access
localStorage.setItem('k', 'v');

// Node.js
console.log(typeof window);    // 'undefined'
console.log(typeof globalThis); // 'object' — works in both
console.log(process.version);   // e.g. 'v22.11.0'
console.log(__dirname);         // only in CommonJS modules

import { readFile } from 'node:fs/promises';
const text = await readFile('./config.json', 'utf8'); // direct file system access

// Shared Web APIs (available in modern Node too):
// fetch, URL, AbortController, TextEncoder, structuredClone, setTimeout, Web Streams`,
      },
      { type: 'heading3', text: 'Key differences' },
      {
        type: 'bullets',
        items: [
          '**APIs**: browser has DOM, BOM (`window`, `navigator`), `localStorage`; Node has `fs`, `http`, `process`, `Buffer`, `os`, `child_process`.',
          '**Security model**: the browser is sandboxed (same-origin policy, no file access); Node runs with the OS permissions of the user (an opt-in Permission Model exists via `--permission`).',
          '**Modules**: browsers use ES modules via `<script type="module">`; Node supports both CommonJS (`require`) and ES modules (`import`).',
          '**Runtime version control**: in Node you choose the exact runtime version, so you can use modern syntax without transpiling for old browsers.',
          "**Event loop**: both have one, but Node's is libuv-based with distinct phases (timers, poll, check…) and adds `process.nextTick` and `setImmediate`.",
          '**Global object**: `window` in browsers, `global` in Node — `globalThis` works in both.',
        ],
      },
      {
        type: 'flow',
        title: 'Node.js architecture at a glance',
        code: `flowchart TD
  APP["Your JavaScript code"]:::client --> CORE["Node core modules<br/>fs, http, crypto, stream"]:::server
  CORE --> BIND["C++ bindings"]:::server
  BIND --> V8["V8 engine<br/>executes JS"]:::highlight
  BIND --> UV["libuv<br/>event loop + thread pool"]:::highlight
  UV --> OS["Operating system<br/>epoll, kqueue, IOCP"]:::external`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "Node is a runtime, not a language or framework" and name V8 + libuv. Then mention that it is ideal for I/O-heavy workloads (APIs, real-time apps) but not for CPU-heavy work on the main thread — that shows you understand its trade-offs.',
      },
    ],
  },

  'What is libuv and what role does it play in Node.js?': {
    summary:
      "libuv is the C library that gives Node.js its event loop and asynchronous I/O. It wraps the OS's non-blocking mechanisms (epoll on Linux, kqueue on macOS, IOCP on Windows) behind one API, and provides a thread pool (default 4 threads) for operations the OS cannot do asynchronously — file system calls, DNS `lookup`, some `crypto` and `zlib` work.",
    details: [
      {
        type: 'paragraph',
        text: 'V8 only knows how to run JavaScript; it has no idea what a socket or a file is. libuv is the piece that lets a single JavaScript thread start thousands of I/O operations, go back to running code, and get notified when each one finishes. Without libuv, Node would just be a JavaScript interpreter.',
      },
      { type: 'heading3', text: 'What libuv provides' },
      {
        type: 'bullets',
        items: [
          '**The event loop** — the phases (timers, pending callbacks, poll, check, close) that Node runs through.',
          "**Network I/O** — TCP/UDP sockets, pipes and TTYs handled with the OS's non-blocking polling, **no thread pool needed**.",
          '**Thread pool** — for blocking work: `fs.*`, `dns.lookup()`, `crypto.pbkdf2/scrypt/randomBytes` (async versions), `zlib` async compression.',
          '**Timers, signals, child processes, file watching** — all cross-platform.',
        ],
      },
      { type: 'heading3', text: 'Seeing the thread pool in action' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import crypto from 'node:crypto';

const start = Date.now();
for (let i = 1; i <= 6; i++) {
  crypto.pbkdf2('secret', 'salt', 100_000, 64, 'sha512', () => {
    console.log(\`hash \${i} done after \${Date.now() - start} ms\`);
  });
}
// With the default pool size of 4:
// hash 1..4 finish at roughly the same time (~T ms)
// hash 5..6 finish at roughly 2T ms — they waited for a free thread

// Increase the pool (must be set before the pool is first used):
// UV_THREADPOOL_SIZE=8 node hash.mjs`,
      },
      {
        type: 'flow',
        title: 'How libuv dispatches async work',
        code: `flowchart LR
  JS["JS calls fs.readFile<br/>or http request"]:::client --> Q{Kind of work?}
  Q -->|"Network socket"| OS["OS async I/O<br/>epoll / kqueue / IOCP"]:::network
  Q -->|"File, dns.lookup,<br/>crypto, zlib"| TP["libuv thread pool<br/>default 4 threads"]:::queue
  OS --> EL["Event loop<br/>queues callback"]:::highlight
  TP --> EL
  EL --> CB["Callback runs on<br/>the main JS thread"]:::server`,
      },
      {
        type: 'bullets',
        items: [
          '`UV_THREADPOOL_SIZE` can be raised (max 1024) if you do heavy file or crypto work and see queuing.',
          '`dns.lookup()` (used by `http.get` by default) uses the thread pool; `dns.resolve*()` uses the network and does not.',
          'Your JavaScript never runs on the pool threads — only the native work does. CPU-heavy JS needs Worker Threads instead.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common misconception: "Node handles every request on the thread pool." It does not — network I/O uses OS-level non-blocking sockets. The pool is only for operations without a good async OS API.',
      },
    ],
  },

  'What is the difference between synchronous and asynchronous code in Node.js?': {
    summary:
      'Synchronous code runs line by line and blocks the thread until each operation completes — in Node that means the entire process (every request) waits. Asynchronous code starts an operation, hands it off to libuv/the OS, and continues; the result arrives later via a callback, promise or `await`. In a server you should almost always use the async APIs.',
    details: [
      {
        type: 'paragraph',
        text: "Node runs your JavaScript on a single main thread. If that thread is blocked on a 200 ms disk read, nobody else's request can be processed during those 200 ms. Async APIs let the thread keep working on other requests while the I/O happens in the background.",
      },
      { type: 'heading3', text: 'Side by side' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import fs from 'node:fs';
import { readFile } from 'node:fs/promises';

// ❌ Synchronous — blocks the event loop
console.log('A');
const data = fs.readFileSync('big.json', 'utf8');
console.log('B', data.length);
console.log('C');
// Output: A, B ..., C   (nothing else can run while reading)

// ✅ Asynchronous with a callback
console.log('A');
fs.readFile('big.json', 'utf8', (err, data) => {
  if (err) return console.error(err);
  console.log('B', data.length);
});
console.log('C');
// Output: A, C, B ...   (the loop is free while reading)

// ✅ Asynchronous with async/await — reads like sync, behaves async
async function load() {
  const data = await readFile('big.json', 'utf8');
  return JSON.parse(data);
}`,
      },
      { type: 'heading3', text: 'The real impact on a server' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import http from 'node:http';
import fs from 'node:fs';

http.createServer((req, res) => {
  // If this takes 100 ms, 50 concurrent requests wait ~5 seconds in total
  const html = fs.readFileSync('./page.html');
  res.end(html);
}).listen(3000);

// Fix: fs.promises.readFile / streams (fs.createReadStream(...).pipe(res))`,
      },
      { type: 'heading3', text: 'When synchronous is fine' },
      {
        type: 'bullets',
        items: [
          'At **startup**, before the server accepts traffic — e.g. reading config or certificates with `readFileSync`.',
          'In **CLI scripts** and build tools where there is no concurrency to protect.',
          'Async is about **I/O**. A CPU-heavy loop is synchronous no matter how you wrap it — `async` does not move it off the thread.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: wrapping CPU work in a Promise (`new Promise(r => r(heavyLoop()))`) does not make it non-blocking. The executor runs synchronously. Use Worker Threads or split the work instead.',
      },
    ],
  },

  'How does Node.js handle asynchronous operations if it is single-threaded?': {
    summary:
      "Only the JavaScript execution is single-threaded. Node delegates I/O to the operating system (non-blocking sockets via epoll/kqueue/IOCP) and to libuv's thread pool (files, DNS lookup, crypto, zlib). When an operation finishes, libuv puts its callback in a queue, and the event loop runs it on the main thread once the call stack is empty.",
    details: [
      {
        type: 'paragraph',
        text: 'A useful analogy: a restaurant with one waiter (the JS thread). The waiter takes your order, passes it to the kitchen (OS / thread pool), and immediately serves the next table instead of standing by the stove. When the dish is ready the kitchen rings a bell (event), and the waiter delivers it when free.',
      },
      { type: 'heading3', text: 'The moving parts' },
      {
        type: 'numbered',
        items: [
          'JavaScript calls an async API, e.g. `fs.readFile()` or `socket.write()`.',
          "Node's C++ layer hands it to libuv, which uses the OS async facility or a pool thread.",
          'JavaScript continues; the call stack eventually becomes empty.',
          'When the I/O completes, libuv queues the callback for the appropriate event loop phase.',
          'The event loop picks it up and runs it on the main thread. Promise continuations (microtasks) run right after each callback.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { readFile } from 'node:fs/promises';

console.log('1: start');

setTimeout(() => console.log('4: timer'), 0);
readFile(import.meta.filename).then(() => console.log('5: file read'));
Promise.resolve().then(() => console.log('3: microtask'));

console.log('2: end of script');

// 1: start
// 2: end of script
// 3: microtask
// 4: timer
// 5: file read   (file I/O usually takes longer than a 0 ms timer)`,
      },
      {
        type: 'flow',
        title: 'One JS thread, many background workers',
        code: `sequenceDiagram
  participant JS as Main JS thread
  participant UV as libuv
  participant OS as OS / thread pool
  JS->>UV: fs.readFile(path, cb)
  UV->>OS: perform read in background
  JS->>JS: keeps running other code
  OS-->>UV: read finished
  UV-->>JS: queue cb for poll phase
  JS->>JS: event loop runs cb(data)`,
      },
      {
        type: 'bullets',
        items: [
          'This is why Node handles 10k+ concurrent connections with little memory: each waiting connection is just a small object, not a thread.',
          'The model breaks down for **CPU-bound** work — the single JS thread is busy and cannot serve the queue. Use Worker Threads, child processes or a separate service.',
          'Node itself is multi-threaded internally (V8 GC helper threads, libuv pool); "single-threaded" refers to your JS code.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: correct the premise politely — "Node runs JavaScript on one thread, but the runtime is not single-threaded." Then explain OS async I/O vs the thread pool. That distinction is exactly what the question is probing.',
      },
    ],
  },

  'What is the Event Loop in Node.js and how does it work?': {
    summary:
      "The event loop is the mechanism (implemented by libuv) that lets Node's single JavaScript thread process asynchronous work. After your main script runs, the loop repeatedly cycles through phases — timers, pending callbacks, poll (I/O), check (`setImmediate`), close — running any callbacks whose operations are ready. Between every callback it drains the microtask queues (`process.nextTick`, then promises). When nothing is left to wait for, the process exits.",
    details: [
      {
        type: 'paragraph',
        text: 'The core rule is simple: **JavaScript runs to completion**. A callback is never interrupted; the event loop only picks the next callback when the call stack is empty. So the loop is essentially "while there is pending work: wait for something to be ready, then run its callback".',
      },
      { type: 'heading3', text: 'The big picture' },
      {
        type: 'numbered',
        items: [
          'Node runs your entry script synchronously (registering timers, starting I/O, creating servers).',
          'Microtasks queued during the script run (`nextTick`, then promise callbacks).',
          'The event loop starts: in each iteration it visits the phases in a fixed order.',
          'In the **poll** phase it waits for I/O events (blocking efficiently in the OS if nothing else is due).',
          'After **every** individual callback, Node drains `process.nextTick` callbacks and then promise microtasks.',
          'If there are no active handles (servers, timers, sockets) or requests left, the loop ends and the process exits.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `import fs from 'node:fs';

console.log('1 script start');

setTimeout(() => console.log('5 timeout'), 0);
setImmediate(() => console.log('6 immediate'));

fs.readFile(import.meta.filename, () => {
  console.log('7 I/O callback (poll phase)');
  setTimeout(() => console.log('9 timeout from I/O'), 0);
  setImmediate(() => console.log('8 immediate from I/O — always before that timeout'));
});

Promise.resolve().then(() => console.log('4 promise microtask'));
process.nextTick(() => console.log('3 nextTick'));

console.log('2 script end');

// 1, 2, 3, 4 are guaranteed first.
// 5 vs 6 order can vary when scheduled from the main module.
// 8 always comes before 9.`,
      },
      {
        type: 'flow',
        title: 'Event loop iteration',
        code: `flowchart TD
  S["Run main script"]:::client --> M0["Drain microtasks<br/>nextTick then promises"]:::highlight
  M0 --> T["timers<br/>setTimeout / setInterval"]:::server
  T --> P["pending callbacks<br/>deferred system errors"]:::server
  P --> PO["poll<br/>wait for and run I/O callbacks"]:::network
  PO --> C["check<br/>setImmediate"]:::server
  C --> CL["close callbacks<br/>socket.on close"]:::server
  CL --> A{Any pending work?}
  A -->|yes| T
  A -->|no| E([process exits]):::external`,
        text: 'Microtasks are drained after every single callback in every phase, not just between phases.',
      },
      { type: 'heading3', text: 'Blocking the loop' },
      {
        type: 'code',
        lang: 'javascript',
        code: `app.get('/report', (req, res) => {
  // 2 seconds of synchronous CPU work — EVERY other request waits
  const result = computeHugeReport();
  res.json(result);
});

// Detect it in production with perf_hooks:
import { monitorEventLoopDelay } from 'node:perf_hooks';
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => console.log('p99 loop delay ms', h.percentile(99) / 1e6), 5000);`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention three things — phases in order, microtasks drained between callbacks, and "don\'t block the loop" with a concrete fix (worker threads, chunking with `setImmediate`, streaming). That covers what most interviewers want.',
      },
    ],
  },

  'What are the phases of the Node.js Event Loop?': {
    summary:
      "Each iteration of the libuv event loop goes through six phases in order: **timers** (expired `setTimeout`/`setInterval`), **pending callbacks** (some deferred system-level I/O errors), **idle/prepare** (internal), **poll** (retrieve new I/O events and run their callbacks; may block here waiting), **check** (`setImmediate` callbacks), and **close callbacks** (e.g. `socket.on('close')`). Microtasks — `process.nextTick` then promises — run between every callback.",
    details: [
      {
        type: 'paragraph',
        text: "Each phase has its own FIFO queue of callbacks. When the loop enters a phase it runs that phase's callbacks until the queue is empty (or a system limit is reached), then moves on to the next phase.",
      },
      { type: 'heading3', text: 'Phase by phase' },
      {
        type: 'bullets',
        items: [
          '**1. timers** — runs callbacks of `setTimeout`/`setInterval` whose threshold has passed. The delay is a minimum, not a guarantee.',
          '**2. pending callbacks** — runs I/O callbacks deferred from the previous iteration, e.g. some TCP errors like `ECONNREFUSED` on certain systems.',
          '**3. idle, prepare** — used internally by Node; not relevant to application code.',
          '**4. poll** — the heart of the loop: computes how long to block, waits for I/O, then runs I/O callbacks (incoming data, completed file reads, new connections). If the poll queue is empty and `setImmediate` callbacks are pending, it moves on to check instead of waiting; otherwise it waits until the nearest timer is due.',
          '**5. check** — runs `setImmediate()` callbacks, right after poll.',
          "**6. close callbacks** — runs `close` events such as `socket.on('close')` after `socket.destroy()`.",
        ],
      },
      {
        type: 'flow',
        title: 'The six phases',
        code: `flowchart LR
  T["timers"]:::server --> PC["pending callbacks"]:::server
  PC --> IP["idle, prepare<br/>internal"]:::external
  IP --> PO["poll<br/>I/O"]:::network
  PO --> CH["check<br/>setImmediate"]:::highlight
  CH --> CL["close callbacks"]:::server
  CL --> T`,
        text: 'Between each callback: process.nextTick queue, then the promise microtask queue.',
      },
      { type: 'heading3', text: 'Mapping APIs to phases' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import net from 'node:net';

setTimeout(() => console.log('timers phase'), 0);
setImmediate(() => console.log('check phase'));

const server = net.createServer((socket) => {
  console.log('poll phase: new connection');
  socket.on('data', () => console.log('poll phase: data'));
  socket.on('close', () => console.log('close callbacks phase'));
  socket.destroy();
});

process.nextTick(() => console.log('not a phase: nextTick queue'));
queueMicrotask(() => console.log('not a phase: promise/microtask queue'));`,
      },
      {
        type: 'bullets',
        items: [
          '`process.nextTick` and promises are **not** part of any phase — they are processed by Node between callbacks.',
          'Since Node 11 microtasks run after **each** `setTimeout`/`setImmediate` callback, matching browser behaviour (previously they ran between phases).',
          'The poll phase is where an idle server spends most of its time — blocked efficiently in `epoll_wait`/`kevent`, using no CPU.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Memory hook: "**T**ired **P**eople **I**dle, **P**oll, **C**heck, **C**lose" — timers, pending, idle/prepare, poll, check, close. Be ready to say which phase `setImmediate` (check) and I/O callbacks (poll) belong to.',
      },
    ],
  },

  'What is the difference between process.nextTick() and setImmediate()?': {
    summary:
      '`process.nextTick()` queues a callback to run immediately after the current operation finishes — before promises and before the event loop continues to any phase. `setImmediate()` queues a callback for the **check** phase of the event loop, i.e. after I/O polling. The names are confusingly swapped: nextTick is actually the more "immediate" one.',
    details: [
      {
        type: 'paragraph',
        text: 'nextTick callbacks live in a special queue that Node drains as soon as the current JavaScript stack unwinds — even before promise microtasks. setImmediate callbacks are proper event loop tasks: they let I/O and other phases happen first, then run.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `setImmediate(() => console.log('3 or 4: setImmediate (check phase)'));
setTimeout(() => console.log('3 or 4: setTimeout 0 (timers phase)'), 0);
Promise.resolve().then(() => console.log('2 promise'));
process.nextTick(() => console.log('1 nextTick'));

// 1 nextTick
// 2 promise
// then setTimeout and setImmediate (relative order may vary from main module)`,
      },
      { type: 'heading3', text: 'nextTick can starve the event loop' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Recursive nextTick: the loop never reaches the poll phase — I/O starves
function spin() {
  process.nextTick(spin);
}
spin(); // server stops responding, timers never fire

// ✅ Recursive setImmediate: I/O gets a turn every iteration
function chunked(items, i = 0) {
  const end = Math.min(i + 1000, items.length);
  for (; i < end; i++) handleItem(items[i]);
  if (i < items.length) setImmediate(() => chunked(items, i));
}`,
      },
      { type: 'heading3', text: 'Where nextTick is legitimately useful' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { EventEmitter } from 'node:events';

class Connection extends EventEmitter {
  constructor() {
    super();
    // ❌ emit('ready') here would fire before the caller attaches a listener
    // ✅ defer until after the constructor returns and listeners are attached
    process.nextTick(() => this.emit('ready'));
  }
}

const c = new Connection();
c.on('ready', () => console.log('ready!')); // works thanks to nextTick`,
      },
      {
        type: 'bullets',
        items: [
          '**nextTick**: runs before anything else; good for making APIs consistently async and emitting events after construction. Risk: starvation.',
          '**setImmediate**: runs in the check phase; good for yielding to I/O and breaking up long work.',
          'Prefer `queueMicrotask()` or promises over nextTick in new code — the Node docs recommend that for most cases.',
          'Inside an I/O callback, `setImmediate` always runs before a `setTimeout(fn, 0)`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: using `process.nextTick` to "yield" in a long loop. It does not yield at all — it runs before I/O. Use `setImmediate` (or `await new Promise(r => setImmediate(r))`) to actually let other requests through.',
      },
    ],
  },

  'What is the difference between setTimeout() and setImmediate() in the context of the event loop?':
    {
      summary:
        '`setTimeout(fn, 0)` schedules `fn` for the **timers** phase once at least ~1 ms has passed; `setImmediate(fn)` schedules it for the **check** phase, right after the poll phase. When both are called from the main module their order is non-deterministic (it depends on process performance/timer granularity), but when both are called inside an I/O callback, `setImmediate` always runs first.',
      details: [
        {
          type: 'paragraph',
          text: 'Node clamps a 0 ms timeout to 1 ms. When the loop starts, if 1 ms has already elapsed since the timer was set, the timers phase runs it first; if not, the loop moves on and the check phase runs the immediate first. That race is why the main-module order varies.',
        },
        { type: 'heading3', text: 'From the main module: order is not guaranteed' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// main.mjs
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// $ node main.mjs  → timeout, immediate
// $ node main.mjs  → immediate, timeout   (can differ between runs)`,
        },
        { type: 'heading3', text: 'Inside an I/O callback: setImmediate always wins' },
        {
          type: 'code',
          lang: 'javascript',
          code: `import fs from 'node:fs';

fs.readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// Always: immediate, timeout
// We are in the poll phase → next comes check (immediate),
// then the loop wraps around to timers (timeout).`,
        },
        {
          type: 'flow',
          title: 'Why I/O callbacks favour setImmediate',
          code: `flowchart LR
  PO["poll phase<br/>I/O callback schedules both"]:::network --> CH["check phase<br/>setImmediate runs"]:::highlight
  CH --> CL["close callbacks"]:::server
  CL --> T["timers phase<br/>setTimeout 0 runs"]:::server`,
        },
        {
          type: 'bullets',
          items: [
            '**setTimeout(fn, ms)**: "run after at least ms milliseconds" — time-based, timers phase; delays below 1 are treated as 1.',
            '**setImmediate(fn)**: "run after this round of I/O" — phase-based, check phase; no timer bookkeeping, so slightly cheaper.',
            'Use `setImmediate` to defer work or yield to I/O; use `setTimeout` when you actually need a time delay.',
            'Both return handles: `clearTimeout` / `clearImmediate`; both keep the process alive unless you call `.unref()` on a timeout.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: the strong answer is "it depends where they are called from" — explain the non-determinism in the main module and the guaranteed order inside an I/O callback, and why (poll → check → timers).',
        },
      ],
    },

  'What is the difference between CommonJS (require) and ES Modules (import) in Node.js?': {
    summary:
      'CommonJS is Node\'s original module system: `require()` loads modules **synchronously** at runtime and `module.exports` exports a value. ES Modules are the JavaScript standard: `import`/`export` are **static** declarations, resolved and linked before code runs, loaded asynchronously, support top-level `await` and enable tree-shaking. Node picks the system by file extension (`.cjs`/`.mjs`) or the `"type"` field in package.json.',
    details: [
      {
        type: 'paragraph',
        text: 'Both systems coexist in Node today. New projects usually go ESM-first, but a lot of the npm ecosystem and older code is still CommonJS, so you need to understand how they differ and how they interoperate.',
      },
      { type: 'heading3', text: 'Syntax side by side' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ---- CommonJS: math.cjs ----
function add(a, b) { return a + b; }
module.exports = { add };
// usage
const { add } = require('./math.cjs');
const path = require('node:path');
console.log(__dirname, __filename); // available

// ---- ES Modules: math.mjs ----
export function add(a, b) { return a + b; }
export default { add };
// usage
import { add } from './math.mjs';      // extension is required for relative imports
import path from 'node:path';
const config = await import('./config.mjs'); // dynamic import
const data = await fetch('https://api.example.com').then(r => r.json()); // top-level await
console.log(import.meta.dirname, import.meta.filename); // ESM replacement for __dirname`,
      },
      { type: 'heading3', text: 'Key differences' },
      {
        type: 'bullets',
        items: [
          '**Loading**: CJS is synchronous and dynamic (`require` can be called anywhere, with a computed path). ESM imports are static, hoisted and analysed before execution.',
          '**Bindings**: CJS exports a **copy of the value** at the time of `require` (for primitives). ESM exports are **live bindings** — importers see updates to the exported variable.',
          '**Top-level await**: only in ESM.',
          '**Module-scoped variables**: CJS has `__dirname`, `__filename`, `require`, `module`, `exports`. ESM has `import.meta.url`, `import.meta.dirname`, `import.meta.filename`.',
          '**Strict mode**: ESM is always strict; CJS only with `"use strict"`.',
          '**`this` at top level**: `module.exports` in CJS, `undefined` in ESM.',
          '**Resolution**: ESM requires full relative paths with extensions (`./util.js`) and does not auto-resolve `index.js` in directories.',
          '**Tree-shaking**: bundlers can statically remove unused ESM exports.',
        ],
      },
      { type: 'heading3', text: 'Choosing and interoperating' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "name": "my-api",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}`,
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ESM importing CommonJS: works — module.exports becomes the default export
import express from 'express';
import pkg from 'some-cjs-lib';     // named imports work only if Node can detect them statically
const { helper } = pkg;

// CommonJS loading ESM:
// - always possible with dynamic import()
const { add } = await import('./math.mjs'); // inside an async function in CJS

// - recent Node 22/24 releases also support require() of ESM
//   (only if the ES module graph has no top-level await)
const esm = require('./math.mjs');`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: "static vs dynamic" and "live bindings vs copied values" are the two conceptual differences interviewers look for. Then mention the practical bits: `"type": "module"`, `.mjs`/`.cjs`, `import.meta.dirname`, and how to load ESM from CJS.',
      },
    ],
  },

  'What is module caching in Node.js?': {
    summary:
      'The first time a module is loaded, Node executes it and caches the result keyed by its resolved absolute filename. Every later `require()`/`import` of the same file returns the **same cached instance** without running the code again. This makes modules effectively singletons — useful for shared state like a DB pool, but a source of surprises if you expect fresh state.',
    details: [
      {
        type: 'paragraph',
        text: 'For CommonJS the cache is the public `require.cache` object; for ES modules there is an internal module map that you cannot modify. The cache key is the resolved filename, so the same file reached through two different paths (e.g. symlinks, or two copies in different `node_modules`) can end up as two instances.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// counter.js
console.log('counter.js executing');
let count = 0;
module.exports = {
  increment: () => ++count,
};

// app.js
const a = require('./counter');   // logs "counter.js executing"
const b = require('./counter');   // no log — served from cache
a.increment();
a.increment();
console.log(b.increment());       // 3 — a and b are the same object
console.log(a === b);             // true`,
      },
      { type: 'heading3', text: 'Using the cache intentionally: singletons' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// db.js — every file that imports this shares ONE pool
import pg from 'pg';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

// users.repo.js
import { pool } from './db.js';
export const findUser = (id) => pool.query('SELECT * FROM users WHERE id = $1', [id]);`,
      },
      { type: 'heading3', text: 'Clearing the cache (CommonJS only)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const key = require.resolve('./config');
delete require.cache[key];
const fresh = require('./config'); // executes config.js again

// ESM has no public API to evict modules. Workarounds such as
// import('./config.js?v=' + Date.now()) create a NEW module each time
// and leak memory — avoid in long-running processes.`,
      },
      {
        type: 'bullets',
        items: [
          'Circular dependencies interact with caching: in CJS, a module required mid-cycle receives the **partially populated** `exports` from the cache.',
          'Duplicate package versions in `node_modules` mean duplicate instances — a classic cause of "instanceof fails" or two copies of a singleton.',
          'Test runners (Jest) give each test file its own module registry; `jest.resetModules()` clears it.',
          'Prefer exporting a factory (`createClient(options)`) when consumers need separate instances.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: storing per-request data in a module-level variable. Because the module is cached and shared, every concurrent request sees the same variable — a data-leak bug between users. Use `AsyncLocalStorage` or pass context explicitly.',
      },
    ],
  },

  'What are Worker Threads in Node.js and when should you use them?': {
    summary:
      'The `worker_threads` module runs JavaScript in parallel threads inside the same process, each with its own V8 isolate and event loop. Workers communicate via message passing (`postMessage`) and can share memory with `SharedArrayBuffer`. Use them for **CPU-bound** work — image processing, hashing, parsing large files, compression — not for I/O, which Node already handles asynchronously.',
    details: [
      {
        type: 'paragraph',
        text: 'A worker is cheaper than a child process (shared process, can transfer or share memory) but heavier than an async call — each one has its own heap and startup cost of tens of milliseconds. So you create a small pool of workers up front and send them jobs, rather than spawning one per request.',
      },
      { type: 'heading3', text: 'Basic example' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// main.mjs
import { Worker } from 'node:worker_threads';

function runFib(n) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./fib-worker.mjs', import.meta.url), {
      workerData: n,
    });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => code !== 0 && reject(new Error('exit ' + code)));
  });
}

console.log(await runFib(42)); // main thread stays responsive meanwhile

// fib-worker.mjs
import { parentPort, workerData } from 'node:worker_threads';
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));
parentPort.postMessage(fib(workerData));`,
      },
      { type: 'heading3', text: 'In production: use a pool' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Using the popular 'piscina' worker pool
import Piscina from 'piscina';

const pool = new Piscina({
  filename: new URL('./resize-worker.mjs', import.meta.url).href,
  maxThreads: 4, // ~ number of CPU cores available
});

app.post('/thumbnail', async (req, res) => {
  const out = await pool.run({ path: req.body.path, width: 200 });
  res.json(out);
});`,
      },
      {
        type: 'flow',
        title: 'Main thread offloading CPU work',
        code: `sequenceDiagram
  participant C as Client
  participant M as Main thread
  participant W as Worker pool
  C->>M: POST /thumbnail
  M->>W: postMessage job
  Note over M: keeps serving other requests
  W->>W: CPU-heavy resize
  W-->>M: postMessage result
  M-->>C: 200 OK`,
      },
      { type: 'heading3', text: 'Worker threads vs alternatives' },
      {
        type: 'bullets',
        items: [
          '**Async I/O**: for DB queries, HTTP calls, file reads — no workers needed.',
          '**Worker threads**: CPU work inside one process; can share memory (`SharedArrayBuffer` + `Atomics`) and transfer `ArrayBuffer`s without copying.',
          '**Cluster / multiple processes**: scale an HTTP server across cores; full isolation, no shared memory.',
          '**child_process**: run other programs or fully isolated Node scripts.',
          'Data sent with `postMessage` is copied using the structured clone algorithm — sending huge objects has a cost; transfer buffers instead.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the key phrase is "CPU-bound, not I/O-bound". Add that you would use a fixed-size pool (e.g. Piscina) sized to the CPU count, and measure event-loop delay to decide when offloading is needed.',
      },
    ],
  },

  'What is the difference between child_process.fork(), spawn(), and exec()?': {
    summary:
      "`spawn()` launches any command and **streams** its stdout/stderr — best for long-running processes or large output. `exec()` runs a command **in a shell** and **buffers** the whole output into a callback — convenient for short commands, but limited by `maxBuffer` and risky with untrusted input. `fork()` is a special `spawn()` for **Node.js scripts** that sets up an IPC channel so parent and child can exchange messages with `send()`/`on('message')`.",
    details: [
      {
        type: 'paragraph',
        text: 'All three create a separate OS process with its own memory and event loop. The differences are about what you run, whether a shell is involved, how output comes back, and whether there is a built-in messaging channel. There is also `execFile()`, which is like `exec()` but without a shell.',
      },
      { type: 'heading3', text: 'spawn — streaming output' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { spawn } from 'node:child_process';

const ffmpeg = spawn('ffmpeg', ['-i', 'in.mp4', 'out.webm']); // args as an array, no shell
ffmpeg.stderr.on('data', (chunk) => process.stdout.write(chunk)); // progress as it happens
ffmpeg.on('close', (code) => console.log('ffmpeg exited with', code));`,
      },
      { type: 'heading3', text: 'exec — buffered output via a shell' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);

const { stdout } = await execAsync('git rev-parse --short HEAD');
console.log('commit', stdout.trim()); // whole output at once

// ❌ Command injection risk with user input:
exec('ls ' + req.query.dir); // dir = "; rm -rf /" 💥
// ✅ execFile / spawn pass args without a shell:
execFile('ls', [req.query.dir], (err, out) => { /* ... */ });`,
      },
      { type: 'heading3', text: 'fork — Node child with IPC' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// parent.mjs
import { fork } from 'node:child_process';
const child = fork('./report-worker.mjs');
child.send({ month: '2026-10' });
child.on('message', (msg) => {
  console.log('report ready', msg);
  child.kill();
});

// report-worker.mjs
process.on('message', async ({ month }) => {
  const report = await buildReport(month); // heavy work in its own process
  process.send({ month, rows: report.length });
});`,
      },
      {
        type: 'bullets',
        items: [
          '**spawn**: any executable · no shell by default · streams · use for long-running or big-output processes.',
          '**exec**: shell command string · buffers output (default `maxBuffer` 1 MB) · pipes/globs work · avoid with untrusted input.',
          '**execFile**: like exec but no shell · safer and slightly faster.',
          '**fork**: Node scripts only · IPC channel via `send`/`message` · each child is a full Node process (~tens of MB) — the basis of the `cluster` module.',
          'Sync variants (`spawnSync`, `execSync`, `execFileSync`) block the event loop — fine in CLI scripts, not in servers.',
        ],
      },
      {
        type: 'flow',
        title: 'Which one to use',
        code: `flowchart TD
  Q{Running a Node.js script<br/>that needs messaging?} -->|yes| F([fork]):::highlight
  Q -->|no| O{Large or continuous output?}
  O -->|yes| S([spawn]):::server
  O -->|no| SH{Need shell features<br/>pipes, globs?}
  SH -->|"yes, trusted input"| E([exec]):::external
  SH -->|no| EF([execFile]):::server`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Security pitfall: never interpolate user input into `exec()`. Use `spawn`/`execFile` with an argument array — and validate the input anyway.',
      },
    ],
  },
};
