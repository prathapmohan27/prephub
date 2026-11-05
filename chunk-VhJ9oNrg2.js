var e={"What is the difference between operational errors and programmer errors?":{summary:'**Operational errors** are expected runtime problems in a correctly written program — a database is down, a request times out, a file is missing, user input is invalid. You anticipate and handle them (retry, return 4xx/5xx, fall back). **Programmer errors** are bugs — reading a property of `undefined`, passing the wrong argument type, a forgotten `await`. You cannot meaningfully "handle" them at runtime; you fix the code, and if one escapes, the safest response is to log and restart the process.',details:[{type:`paragraph`,text:`This distinction (popularised by Joyent's Node.js error-handling guide) drives the whole error strategy of a Node service: operational errors are part of normal control flow, programmer errors mean the process may be in an unknown state.`},{type:`heading3`,text:`Examples`},{type:`bullets`,items:["**Operational**: `ECONNREFUSED` from Postgres, `ETIMEDOUT` from an upstream API, `ENOENT` for a missing upload, validation failure, 404 not found, rate limit exceeded, out of disk space.","**Programmer**: `TypeError: Cannot read properties of undefined`, calling a function with wrong arguments, an unhandled promise rejection from a missing `await`, an infinite loop, a wrong SQL column name."]},{type:`heading3`,text:`Modelling operational errors explicitly`},{type:`code`,lang:`typescript`,code:`export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly isOperational = true,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(resource + ' ' + id + ' not found', 404, 'NOT_FOUND');
  }
}

// Service layer
async function getOrder(id: string) {
  try {
    const order = await db.orders.findById(id);
    if (!order) throw new NotFoundError('Order', id);        // operational
    return order;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (isConnectionError(err)) {
      throw new AppError('Database unavailable', 503, 'DB_DOWN', true, { cause: err }); // operational
    }
    throw err;                                                // unknown \u2192 treat as a bug
  }
}`},{type:`heading3`,text:`Central handler decides the response`},{type:`code`,lang:`typescript`,code:`app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err, path: req.path }, err.message);
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  // Programmer error: don't leak details, alert, and consider the process suspect
  logger.error({ err, path: req.path }, 'Unexpected error');
  res.status(500).json({ code: 'INTERNAL', message: 'Something went wrong' });
});`},{type:`flow`,title:`Handling strategy`,code:`flowchart TD
  E["Error occurs"]:::client --> Q{Operational?}
  Q -->|"yes: expected failure"| H["Handle: retry, fallback,<br/>4xx/5xx response, log warn"]:::server
  Q -->|"no: a bug"| L["Log error + alert<br/>return generic 500"]:::security
  L --> R{Process state trustworthy?}
  R -->|"unsure / uncaught"| X["Graceful shutdown<br/>let supervisor restart"]:::highlight
  R -->|"caught in request scope"| C["Continue, fix code ASAP"]:::external`},{type:`bullets`,items:[`Never expose stack traces or internal messages for programmer errors to clients.`,"Use `Error.cause` to wrap low-level errors while keeping the original for logs.",`Validate input at the boundary so bad input becomes an operational 400 instead of a deep TypeError.`,`Track programmer errors in an error tracker (Sentry, Datadog) — each one is a bug ticket.`]},{type:`callout`,variant:`tip`,text:'Interview tip: the key sentence is "handle operational errors, fix programmer errors." Follow with how your code tells them apart (custom error classes with an `isOperational` flag) and that uncaught bugs lead to a restart.'}]},"How do you handle uncaught exceptions in Node.js?":{summary:"Prevent them first (async/await with try/catch, promise `.catch`, an Express error middleware, `error` listeners on emitters and streams). As a last line of defence, register `process.on('uncaughtException')` and `process.on('unhandledRejection')` handlers that **log the error, flush, shut down gracefully and exit with a non-zero code** — then let a supervisor (Kubernetes, systemd, PM2, Docker restart policy) start a fresh process. Do not keep running after an uncaught exception.",details:[{type:`paragraph`,text:"By default an uncaught exception prints the stack and exits with code 1. Since Node 15, an unhandled promise rejection does the same (`--unhandled-rejections=throw`). After an uncaught exception, the process may hold half-finished state — open transactions, locks, corrupted in-memory data — which is why the Node docs say it is not safe to resume normal operation."},{type:`heading3`,text:`Layer 1: handle errors where they happen`},{type:`code`,lang:`javascript`,code:`// Async route handlers: Express 5 forwards rejected promises to error middleware.
// In Express 4, wrap them or use a helper:
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/orders/:id', asyncHandler(async (req, res) => {
  res.json(await orders.get(req.params.id));
}));

// EventEmitters and streams: an 'error' event with no listener THROWS
socket.on('error', (err) => logger.warn({ err }, 'socket error'));

// Streams: use pipeline so errors and cleanup are handled
await pipeline(fs.createReadStream(src), zlib.createGzip(), fs.createWriteStream(dst));`},{type:`heading3`,text:`Layer 2: process-level safety net`},{type:`code`,lang:`javascript`,code:`import { logger } from './logger.js';
import { shutdown } from './shutdown.js';

process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'Uncaught exception \u2014 shutting down');
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection \u2014 shutting down');
  shutdown(1);
});

// shutdown(code): stop accepting traffic, finish in-flight requests,
// close DB pools, flush logs/metrics, then process.exit(code).
// Always include a hard timeout so a hung cleanup cannot keep a broken process alive.`},{type:`flow`,title:`From uncaught error to fresh process`,code:`sequenceDiagram
  participant App as Node process
  participant Log as Logs / error tracker
  participant Sup as Supervisor (K8s, PM2)
  App->>App: throw in callback, nobody catches
  App->>Log: uncaughtException handler logs fatal
  App->>App: close server, drain, close DB
  App->>Sup: process.exit(1)
  Sup->>App: start a new healthy instance`},{type:`bullets`,items:[`Run multiple instances behind a load balancer so a restart does not cause downtime.`,"`process.on('uncaughtExceptionMonitor')` lets you observe (e.g. report to Sentry) without changing the default crash behaviour.","Synchronous `try/catch` does **not** catch errors thrown later in callbacks or timers — they become uncaught exceptions.",`Inside the handler, keep work minimal and synchronous-safe; logging with a synchronous/flushable logger avoids losing the final message.`]},{type:`callout`,variant:`warning`,text:"Pitfall: `process.on('uncaughtException', err => console.log(err))` with no exit. The server keeps running in an unknown state — leaked connections, stuck locks, corrupted caches — and failures become silent and much harder to debug."}]},'What is the difference between try/catch and process.on("uncaughtException")?':{summary:'`try/catch` is **local, intentional** error handling: it catches errors thrown synchronously inside the block (or rejected promises you `await` inside it) so you can recover and continue. `process.on("uncaughtException")` is a **global last-resort hook** that fires only when an error escapes every handler and reaches the event loop; at that point recovery is unsafe, so it should be used to log, clean up and exit — not to continue.',details:[{type:`heading3`,text:`What try/catch can and cannot catch`},{type:`code`,lang:`javascript`,code:`// \u2705 Synchronous errors
try {
  JSON.parse('{bad json');
} catch (err) {
  console.log('caught:', err.message);
}

// \u2705 Awaited promises inside an async function
try {
  await db.query('SELECT 1');
} catch (err) {
  console.log('db failed, using cache');
}

// \u274C Errors thrown later, in a different call stack
try {
  setTimeout(() => { throw new Error('boom'); }, 10);
} catch (err) {
  // never runs \u2014 by the time the timer fires, this try block is long gone
}
// \u2192 becomes an uncaughtException

// \u274C A promise you did not await
try {
  db.query('SELECT 1'); // no await
} catch {}
// \u2192 a rejection here becomes an unhandledRejection`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**Scope**: try/catch — one block of code; uncaughtException — the whole process.`,`**Timing**: try/catch — the same synchronous execution (or awaited chain); uncaughtException — after the error has unwound the entire stack.`,`**Context**: try/catch knows what was being attempted and can retry, fall back or return a specific HTTP status; the global handler only has the error object.`,`**Recovery**: try/catch → continue normally; uncaughtException → log, clean up, exit.`,`**Purpose**: try/catch is control flow for operational errors; the global hook is a crash reporter and shutdown trigger.`]},{type:`code`,lang:`javascript`,code:`// Typical combination in a service
async function getProfile(userId) {
  try {
    return await profileApi.get(userId);
  } catch (err) {
    if (err.code === 'ETIMEDOUT') return cache.get('profile:' + userId); // recover locally
    throw err; // unknown \u2192 let the request-level handler deal with it
  }
}

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'escaped all handlers');
  gracefulShutdown(1); // never resume
});`},{type:`callout`,variant:`tip`,text:"Interview tip: show the `setTimeout` example — it proves you understand why try/catch is stack-bound and why errors in callbacks end up at the process level. Then state clearly that the global handler is for logging and exiting, not recovery."}]},"How do you implement graceful shutdown in Node.js?":{summary:"Listen for termination signals (`SIGTERM` from Kubernetes/Docker/PM2, `SIGINT` from Ctrl+C), then: mark the instance unhealthy so the load balancer stops sending traffic, stop accepting new connections with `server.close()`, let in-flight requests finish, close idle keep-alive connections, stop background workers/consumers, close database pools, Redis and message-broker connections, flush logs and exit with code 0. Always add a hard timeout that force-exits if cleanup hangs.",details:[{type:`paragraph`,text:"Without graceful shutdown, every deploy or scale-down kills requests mid-flight — users see 502s, a job may half-complete, and a DB transaction may be aborted. Orchestrators send `SIGTERM` first and only `SIGKILL` after a grace period (30 seconds by default in Kubernetes), so you have a window to clean up."},{type:`code`,lang:`javascript`,code:`import http from 'node:http';
import { app } from './app.js';
import { pool } from './db.js';
import { redis } from './redis.js';
import { consumer } from './queue.js';

const server = http.createServer(app);
server.listen(3000);

let shuttingDown = false;
app.get('/healthz', (req, res) => res.status(shuttingDown ? 503 : 200).end());

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  // Hard deadline \u2014 must be shorter than the orchestrator's grace period
  const force = setTimeout(() => {
    logger.error('forced exit after timeout');
    process.exit(1);
  }, 25_000);
  force.unref();

  try {
    await consumer.stop();                       // stop taking new jobs
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve())); // waits for in-flight requests
      server.closeIdleConnections();             // drop idle keep-alive sockets
    });
    await Promise.allSettled([pool.end(), redis.quit()]);
    logger.info('clean shutdown complete');
    process.exit(exitCode);
  } catch (err) {
    logger.error({ err }, 'error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  shutdown('uncaughtException', 1);
});`},{type:`flow`,title:`Shutdown sequence`,code:`flowchart TD
  S["SIGTERM received"]:::external --> H["Fail readiness check<br/>LB stops routing"]:::network
  H --> C["server.close<br/>no new connections"]:::server
  C --> W["Finish in-flight requests<br/>stop queue consumers"]:::queue
  W --> D["Close DB pool, Redis,<br/>broker connections"]:::db
  D --> F["Flush logs and metrics"]:::server
  F --> E["process.exit 0"]:::highlight
  S -.->|"timeout reached"| K["Force exit 1"]:::security`},{type:`heading3`,text:`Details that matter in production`},{type:`bullets`,items:["**Keep-alive connections**: in older Node versions `server.close()` waited for idle keep-alive sockets to time out; since Node 19 it also closes idle connections, so calling `server.closeIdleConnections()` explicitly is harmless. `server.closeAllConnections()` is the forceful option for stragglers once the timeout hits.","**Kubernetes**: there is a short delay before endpoints are removed, so some teams add a brief sleep (or a `preStop` hook) before closing the server; keep total time below `terminationGracePeriodSeconds`.",'**PID 1 in Docker**: run `node` directly (`CMD ["node", "dist/server.js"]`) or use `--init`/tini. `npm start` as PID 1 may not forward `SIGTERM` to Node.',`**Idempotent**: guard against the handler running twice (two signals).`,`**Workers/jobs**: finish or re-queue the current job; message brokers should ack only after completion so unacked messages are redelivered.`,"Libraries such as `http-terminator`, `@godaddy/terminus`, or NestJS `enableShutdownHooks()` package these steps."]},{type:`callout`,variant:`warning`,text:"Pitfall: calling `process.exit()` immediately in the SIGTERM handler. It cuts off in-flight requests and may lose buffered log lines — the exact problem graceful shutdown is meant to solve."}]},"What is the domain module and is it still recommended?":{summary:"The `domain` module was an early attempt (Node 0.8 era) to group multiple async operations so that errors thrown anywhere inside them would be routed to a single handler instead of crashing the process. It is **deprecated** and not recommended: it was unreliable (it did not reliably cover all async paths, especially promises) and it encouraged continuing after unknown errors. Use async/await with try/catch, Express error middleware, process-level handlers with restart, and `AsyncLocalStorage` for request context.",details:[{type:`paragraph`,text:"The idea was attractive: wrap a request in a domain, and any error from its callbacks lands in `domain.on('error')`, so you could send a 500 for that request without crashing the server. In practice, implicit binding of emitters and timers was leaky, it added overhead, and it conflicted with the core principle that an uncaught error leaves the process in an untrusted state."},{type:`heading3`,text:`What domain code looked like`},{type:`code`,lang:`javascript`,code:`// \u26A0\uFE0F Legacy \u2014 do not use in new code
const domain = require('node:domain');

http.createServer((req, res) => {
  const d = domain.create();
  d.on('error', (err) => {
    console.error('request failed', err);
    res.statusCode = 500;
    res.end('error');
  });
  d.run(() => {
    setTimeout(() => {
      throw new Error('async failure'); // routed to d.on('error') instead of crashing
    }, 10);
  });
}).listen(3000);`},{type:`heading3`,text:`Modern replacements`},{type:`code`,lang:`javascript`,code:`// 1. Errors: async/await + central error middleware
app.get('/report', async (req, res, next) => {
  try {
    res.json(await buildReport(req.query));
  } catch (err) {
    next(err); // Express 5 does this automatically for rejected promises
  }
});

// 2. Request-scoped context (what domains were also used for): AsyncLocalStorage
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const requestContext = new AsyncLocalStorage();

app.use((req, res, next) => {
  requestContext.run({ requestId: req.get('x-request-id') ?? randomUUID() }, next);
});

export function log(msg) {
  const ctx = requestContext.getStore();
  console.log(JSON.stringify({ requestId: ctx?.requestId, msg }));
}

// 3. Truly uncaught errors: process.on('uncaughtException') \u2192 log \u2192 graceful shutdown \u2192 restart`},{type:`bullets`,items:[`The module is still present for backward compatibility but documented as deprecated — expect to see it only in very old codebases.`,`Promise-based code (async/await) made domains largely unnecessary: errors propagate through the awaited chain to a single try/catch.`,"`AsyncLocalStorage` (stable since Node 16) is the supported way to carry context such as request IDs or tenant IDs across async calls.",`Process isolation (multiple instances + supervisor restart) is the accepted strategy for unexpected errors.`]},{type:`callout`,variant:`tip`,text:'Interview tip: answer "deprecated — don\'t use it", explain in one line why (unreliable, encouraged resuming after unknown errors), and immediately name the replacements: async/await + error middleware, `AsyncLocalStorage`, and crash-and-restart.'}]}};export{e as answers};