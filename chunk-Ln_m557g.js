var e={"operational-vs-programmer-errors":{summary:'**Operational errors** are expected runtime problems in a correctly written program — a database is down, a request times out, a file is missing, user input is invalid. You anticipate and handle them (retry, return 4xx/5xx, fall back). **Programmer errors** are bugs — reading a property of `undefined`, passing the wrong argument type, a forgotten `await`. You cannot meaningfully "handle" them at runtime; you fix the code, and if one escapes, the safest response is to log and restart the process.',details:[{type:`paragraph`,text:`This distinction (popularised by Joyent's Node.js error-handling guide) drives the whole error strategy of a Node service: operational errors are part of normal control flow, programmer errors mean the process may be in an unknown state.`},{type:`heading3`,text:`Examples`},{type:`bullets`,items:["**Operational**: `ECONNREFUSED` from Postgres, `ETIMEDOUT` from an upstream API, `ENOENT` for a missing upload, validation failure, 404 not found, rate limit exceeded, out of disk space.","**Programmer**: `TypeError: Cannot read properties of undefined`, calling a function with wrong arguments, an unhandled promise rejection from a missing `await`, an infinite loop, a wrong SQL column name."]},{type:`heading3`,text:`Modelling operational errors explicitly`},{type:`code`,lang:`typescript`,code:`export class AppError extends Error {
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
  R -->|"caught in request scope"| C["Continue, fix code ASAP"]:::external`},{type:`bullets`,items:[`Never expose stack traces or internal messages for programmer errors to clients.`,"Use `Error.cause` to wrap low-level errors while keeping the original for logs.",`Validate input at the boundary so bad input becomes an operational 400 instead of a deep TypeError.`,`Track programmer errors in an error tracker (Sentry, Datadog) — each one is a bug ticket.`]},{type:`callout`,variant:`tip`,text:'Interview tip: the key sentence is "handle operational errors, fix programmer errors." Follow with how your code tells them apart (custom error classes with an `isOperational` flag) and that uncaught bugs lead to a restart.'}]},"handling-uncaught-exceptions":{summary:"Prevent them first (async/await with try/catch, promise `.catch`, an Express error middleware, `error` listeners on emitters and streams). As a last line of defence, register `process.on('uncaughtException')` and `process.on('unhandledRejection')` handlers that **log the error, flush, shut down gracefully and exit with a non-zero code** — then let a supervisor (Kubernetes, systemd, PM2, Docker restart policy) start a fresh process. Do not keep running after an uncaught exception.",details:[{type:`paragraph`,text:"By default an uncaught exception prints the stack and exits with code 1. Since Node 15, an unhandled promise rejection does the same (`--unhandled-rejections=throw`). After an uncaught exception, the process may hold half-finished state — open transactions, locks, corrupted in-memory data — which is why the Node docs say it is not safe to resume normal operation."},{type:`heading3`,text:`Layer 1: handle errors where they happen`},{type:`code`,lang:`javascript`,code:`// Async route handlers: Express 5 forwards rejected promises to error middleware.
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
  Sup->>App: start a new healthy instance`},{type:`bullets`,items:[`Run multiple instances behind a load balancer so a restart does not cause downtime.`,"`process.on('uncaughtExceptionMonitor')` lets you observe (e.g. report to Sentry) without changing the default crash behaviour.","Synchronous `try/catch` does **not** catch errors thrown later in callbacks or timers — they become uncaught exceptions.",`Inside the handler, keep work minimal and synchronous-safe; logging with a synchronous/flushable logger avoids losing the final message.`]},{type:`callout`,variant:`warning`,text:"Pitfall: `process.on('uncaughtException', err => console.log(err))` with no exit. The server keeps running in an unknown state — leaked connections, stuck locks, corrupted caches — and failures become silent and much harder to debug."},{type:`divider`},{type:`heading3`,text:`Follow-up: What is the domain module and is it still recommended?`},{type:`paragraph`,text:"The `domain` module was an early attempt (Node 0.8 era) to group multiple async operations so that errors thrown anywhere inside them would be routed to a single handler instead of crashing the process. It is **deprecated** and not recommended: it was unreliable (it did not reliably cover all async paths, especially promises) and it encouraged continuing after unknown errors. Use async/await with try/catch, Express error middleware, process-level handlers with restart, and `AsyncLocalStorage` for request context."},{type:`paragraph`,text:"The idea was attractive: wrap a request in a domain, and any error from its callbacks lands in `domain.on('error')`, so you could send a 500 for that request without crashing the server. In practice, implicit binding of emitters and timers was leaky, it added overhead, and it conflicted with the core principle that an uncaught error leaves the process in an untrusted state."},{type:`heading3`,text:`What domain code looked like`},{type:`code`,lang:`javascript`,code:`// \u26A0\uFE0F Legacy \u2014 do not use in new code
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

// 3. Truly uncaught errors: process.on('uncaughtException') \u2192 log \u2192 graceful shutdown \u2192 restart`},{type:`bullets`,items:[`The module is still present for backward compatibility but documented as deprecated — expect to see it only in very old codebases.`,`Promise-based code (async/await) made domains largely unnecessary: errors propagate through the awaited chain to a single try/catch.`,"`AsyncLocalStorage` (stable since Node 16) is the supported way to carry context such as request IDs or tenant IDs across async calls.",`Process isolation (multiple instances + supervisor restart) is the accepted strategy for unexpected errors.`]},{type:`callout`,variant:`tip`,text:'Interview tip: answer "deprecated — don\'t use it", explain in one line why (unreliable, encouraged resuming after unknown errors), and immediately name the replacements: async/await + error middleware, `AsyncLocalStorage`, and crash-and-restart.'}]},"try-catch-vs-uncaughtexception":{summary:'`try/catch` is **local, intentional** error handling: it catches errors thrown synchronously inside the block (or rejected promises you `await` inside it) so you can recover and continue. `process.on("uncaughtException")` is a **global last-resort hook** that fires only when an error escapes every handler and reaches the event loop; at that point recovery is unsafe, so it should be used to log, clean up and exit — not to continue.',details:[{type:`heading3`,text:`What try/catch can and cannot catch`},{type:`code`,lang:`javascript`,code:`// \u2705 Synchronous errors
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
});`},{type:`callout`,variant:`tip`,text:"Interview tip: show the `setTimeout` example — it proves you understand why try/catch is stack-bound and why errors in callbacks end up at the process level. Then state clearly that the global handler is for logging and exiting, not recovery."}]},"graceful-shutdown":{summary:"Listen for termination signals (`SIGTERM` from Kubernetes/Docker/PM2, `SIGINT` from Ctrl+C), then: mark the instance unhealthy so the load balancer stops sending traffic, stop accepting new connections with `server.close()`, let in-flight requests finish, close idle keep-alive connections, stop background workers/consumers, close database pools, Redis and message-broker connections, flush logs and exit with code 0. Always add a hard timeout that force-exits if cleanup hangs.",details:[{type:`paragraph`,text:"Without graceful shutdown, every deploy or scale-down kills requests mid-flight — users see 502s, a job may half-complete, and a DB transaction may be aborted. Orchestrators send `SIGTERM` first and only `SIGKILL` after a grace period (30 seconds by default in Kubernetes), so you have a window to clean up."},{type:`code`,lang:`javascript`,code:`import http from 'node:http';
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
  S -.->|"timeout reached"| K["Force exit 1"]:::security`},{type:`heading3`,text:`Details that matter in production`},{type:`bullets`,items:["**Keep-alive connections**: in older Node versions `server.close()` waited for idle keep-alive sockets to time out; since Node 19 it also closes idle connections, so calling `server.closeIdleConnections()` explicitly is harmless. `server.closeAllConnections()` is the forceful option for stragglers once the timeout hits.","**Kubernetes**: there is a short delay before endpoints are removed, so some teams add a brief sleep (or a `preStop` hook) before closing the server; keep total time below `terminationGracePeriodSeconds`.",'**PID 1 in Docker**: run `node` directly (`CMD ["node", "dist/server.js"]`) or use `--init`/tini. `npm start` as PID 1 may not forward `SIGTERM` to Node.',`**Idempotent**: guard against the handler running twice (two signals).`,`**Workers/jobs**: finish or re-queue the current job; message brokers should ack only after completion so unacked messages are redelivered.`,"Libraries such as `http-terminator`, `@godaddy/terminus`, or NestJS `enableShutdownHooks()` package these steps."]},{type:`callout`,variant:`warning`,text:"Pitfall: calling `process.exit()` immediately in the SIGTERM handler. It cuts off in-flight requests and may lose buffered log lines — the exact problem graceful shutdown is meant to solve."}]},"custom-error-hierarchy-and-http-mapping":{summary:"I keep two layers apart. Domain and application code throw errors that describe what went wrong in business terms (`NotFoundError`, `ConflictError`, `ValidationError`, `ForbiddenError`) and carry a stable machine-readable `code`, but they know nothing about HTTP. Infrastructure errors from drivers are wrapped into those domain errors with `Error.cause` at the repository or adapter boundary. Exactly one place, the Express error middleware or a NestJS exception filter, translates them into status codes and a Problem Details body, and everything it does not recognise becomes a logged, generic 500.",details:[{type:`paragraph`,text:'The goal is that a service function can be called from an HTTP route, a queue consumer or a CLI script and still make sense. If the service throws `new HttpException(404)`, the queue consumer has to understand HTTP. If it throws `NotFoundError`, each entry point decides what that means for its own transport: a 404 for HTTP, an "ack and drop" for a message, an exit code for a CLI.'},{type:`heading3`,text:`A small, flat hierarchy`},{type:`code`,lang:`typescript`,code:`// errors.ts: transport-agnostic, no HTTP status codes in here
export abstract class AppError extends Error {
  abstract readonly code: string;          // stable, documented, e.g. 'ORDER_NOT_FOUND'
  readonly details?: Record<string, unknown>;

  constructor(message: string, opts?: { cause?: unknown; details?: Record<string, unknown> }) {
    super(message, { cause: opts?.cause }); // ES2022 Error.cause keeps the original error
    this.name = new.target.name;
    this.details = opts?.details;
  }
}

export class ValidationError extends AppError { readonly code = 'VALIDATION_FAILED'; }
export class NotFoundError extends AppError   { readonly code = 'NOT_FOUND'; }
export class ConflictError extends AppError   { readonly code = 'CONFLICT'; }
export class ForbiddenError extends AppError  { readonly code = 'FORBIDDEN'; }
export class DependencyError extends AppError { readonly code = 'DEPENDENCY_UNAVAILABLE'; }

// More specific business errors subclass a category, so the mapper stays small
export class InsufficientStockError extends ConflictError {
  override readonly code = 'INSUFFICIENT_STOCK';
}`},{type:`bullets`,items:["**Categories, not one class per situation.** A handful of base categories map to HTTP; specific errors subclass a category and only change `code` and `message`. The mapper never grows when you add a new business rule.","**`code` is the contract**, not the message. Clients and tests branch on `INSUFFICIENT_STOCK`; the message can be reworded or translated.","**Programmer errors are not in the hierarchy.** A `TypeError` from a bug is deliberately not an `AppError`, so it falls through to the generic 500 path and gets alerted on."]},{type:`heading3`,text:`Wrap infrastructure errors at the edge of the infrastructure`},{type:`paragraph`,text:"Driver errors (Postgres SQLSTATE `23505`, MongoDB `E11000`, an Axios timeout) must not leak upwards, or the service layer starts importing driver types. The repository or adapter translates them once:"},{type:`code`,lang:`typescript`,code:`// users.repository.ts
async create(user: NewUser): Promise<User> {
  try {
    return await this.db.insert(users).values(user).returning();
  } catch (err) {
    if (isPgError(err) && err.code === '23505') {
      throw new ConflictError('Email is already registered', { cause: err, details: { field: 'email' } });
    }
    throw err; // unknown: let it surface as a 500, do not guess
  }
}

// payment.client.ts
async charge(req: ChargeRequest) {
  try {
    return await this.http.post('/charges', req, { signal: AbortSignal.timeout(3000) });
  } catch (err) {
    throw new DependencyError('Payment provider unavailable', { cause: err });
  }
}`},{type:`callout`,variant:`warning`,text:"Note the `return await` inside `try`. Writing `return this.db.insert(...)` without `await` returns the promise before it settles, so a rejection skips the `catch` block entirely."},{type:`heading3`,text:`One translation point`},{type:`code`,lang:`typescript`,code:`const STATUS: Array<[new (...a: any[]) => AppError, number]> = [
  [ValidationError, 400], [ForbiddenError, 403], [NotFoundError, 404],
  [ConflictError, 409], [DependencyError, 503],
];

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    const status = STATUS.find(([cls]) => err instanceof cls)?.[1] ?? 500;
    req.log.warn({ err, code: err.code }, err.message);   // pino serialises err.cause too
    return res.status(status).type('application/problem+json').json({
      type: 'https://api.example.com/errors/' + err.code.toLowerCase(),
      title: err.message,
      status,
      code: err.code,
      ...err.details,
      instance: req.originalUrl,
    });
  }
  req.log.error({ err }, 'Unhandled error');               // bug: alert on this
  res.status(500).type('application/problem+json').json({
    type: 'about:blank', title: 'Internal Server Error', status: 500,
  });
});`},{type:`paragraph`,text:"In NestJS the same mapper is a global `@Catch()` exception filter registered with `APP_FILTER`. Nest’s own `HttpException` subclasses are fine inside controllers, but I keep them out of services for the reason above."},{type:`heading3`,text:`Trade-offs and edge cases`},{type:`bullets`,items:["**`instanceof` across package copies.** If two versions of a shared errors package are installed, `instanceof` fails. Checking a brand such as `err.code` or a symbol property is more robust for errors that cross package boundaries.",'**Result types vs exceptions.** Returning `Result<T, E>` makes expected failures explicit in signatures, but it is noisy in JavaScript and every library still throws. A common middle ground is exceptions for failures plus explicit return values for normal "not found" lookups.',"**4xx vs 5xx decides alerting.** 4xx are logged at `warn` and counted; 5xx page someone. Misclassifying a validation error as 500 creates alert noise; classifying a dependency outage as 400 hides it.","**Never put secrets or internal identifiers in `details`.** They go to the client."]},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How does the same error behave in a queue consumer? *Map categories to ack/retry/dead-letter: `ValidationError` → dead-letter, `DependencyError` → retry with backoff.*","How do you keep error codes consistent across services? *A shared, versioned catalogue of codes documented in OpenAPI, with the Problem Details `type` URI pointing at docs.*",'Why not just `throw new Error("not found")`? *String matching on messages is brittle; you lose a stable code, a status mapping and structured details.*',"How do you test the mapping? *Unit test the middleware with each category, plus one Supertest case per route asserting the `code`.*"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Throwing HTTP exceptions from services and repositories, tying business logic to one transport.`,"Swallowing the original driver error instead of attaching it as `cause`, losing the root cause in logs.",`Catching everything in each route and sending ad-hoc JSON, so every endpoint has a different error shape.`,"Sending `err.message` or the stack trace of unknown errors to the client."]},{type:`callout`,variant:`important`,text:"Senior signal: separating transport-agnostic domain errors from the single HTTP translation point, wrapping infrastructure errors with `cause` at the adapter, treating unknown errors as bugs that alert, and explaining how the same hierarchy maps to queues and CLIs."}]},"how-async-errors-get-lost":{summary:"Async errors get lost whenever a promise is created and nobody awaits or catches it: a call without `await`, an `async` callback passed to something that ignores its return value (`forEach`, an event listener, `setTimeout`), a `return promise` inside `try` without `await`, or an `error` event on an emitter or stream with no listener. Since Node 15 an unhandled rejection crashes the process, so these become outages instead of silent bugs. I prevent them with lint rules (`no-floating-promises`, `no-misused-promises`), `Promise.all` or `for...of` instead of `forEach`, `stream.pipeline`, and `events.once` or `captureRejections` for emitters.",details:[{type:`heading3`,text:"1. Floating promises and missing `await`"},{type:`code`,lang:`typescript`,code:`async function placeOrder(order: Order) {
  await orders.insert(order);
  audit.record('order.placed', order.id);   // floating: if this rejects, nobody catches it
  sendEmail(order);                         // same: the request returns 201 before it fails
}

// Fix: await it, or make "fire and forget" explicit and handled
await audit.record('order.placed', order.id);
void sendEmail(order).catch((err) => logger.warn({ err }, 'confirmation email failed'));`},{type:`paragraph`,text:"Fire-and-forget is sometimes correct (a non-critical email), but it should be a visible decision with its own `.catch`, and work that must not be lost belongs on a queue rather than in a detached promise that dies with the process."},{type:`heading3`,text:"2. `return` without `await` inside `try`"},{type:`code`,lang:`typescript`,code:`async function load(id: string) {
  try {
    return repo.find(id);        // promise returned unsettled: rejection bypasses catch
  } catch (err) {
    throw new NotFoundError('missing', { cause: err });
  }
}
// Fix: return await repo.find(id);`},{type:`heading3`,text:`3. Async callbacks where the caller ignores the promise`},{type:`code`,lang:`typescript`,code:`// forEach does not await: the function returns immediately, errors are unhandled
ids.forEach(async (id) => { await process(id); });

// Sequential
for (const id of ids) await process(id);

// Parallel, all errors observed (allSettled if partial failure is acceptable)
await Promise.all(ids.map((id) => process(id)));

// Express 4 route or EventEmitter listener returning a promise: the return value is ignored
emitter.on('message', async (msg) => { await handle(msg); });   // rejection = unhandledRejection`},{type:`paragraph`,text:"The same trap applies to `setTimeout(async () => ...)`, `array.map(async ...)` without `Promise.all`, and Express 4 handlers. Express 5 forwards rejected promises from route handlers to the error middleware, but only for the handler itself, not for promises you start inside it and do not await."},{type:`heading3`,text:`4. EventEmitters and streams`},{type:`bullets`,items:["An `error` event with **no listener throws**, usually far away from the code that caused it. Every long-lived emitter (sockets, DB clients, Redis, Kafka consumers) needs an `error` listener.","`.pipe()` does **not** forward errors or destroy the other streams. Use `pipeline` from `node:stream/promises`, which propagates the first error, destroys every stream and rejects one promise you can await.","Use `finished(stream)` when you only need to know a single stream completed or failed.",'To wait for one event as a promise, use `events.once(emitter, "ready")`: it rejects if `error` fires first.','For async listeners, `new EventEmitter({ captureRejections: true })` routes a rejected listener promise to the `error` event (or `Symbol.for("nodejs.rejection")`) instead of an unhandled rejection.']},{type:`code`,lang:`typescript`,code:`import { pipeline } from 'node:stream/promises';
import { once, EventEmitter } from 'node:events';

await pipeline(fs.createReadStream(src), zlib.createGzip(), fs.createWriteStream(dst));

const conn = createConnection();
await once(conn, 'connect');              // rejects on 'error' instead of hanging or crashing

const bus = new EventEmitter({ captureRejections: true });
bus.on('order', async (o) => { await save(o); });
bus.on('error', (err) => logger.error({ err }, 'order listener failed'));`},{type:`heading3`,text:`5. Catch them before production`},{type:`bullets`,items:["`@typescript-eslint/no-floating-promises`: flags any promise that is neither awaited, returned, `.catch`ed nor explicitly `void`ed.","`@typescript-eslint/no-misused-promises`: flags passing an async function where a void callback is expected (`forEach`, listeners, Express 4 handlers).","`require-await` / `return-await` (`in-try-catch`) rules catch the `return` without `await` case.",`Tests: let unhandled rejections fail the test run (Vitest and Jest report them; Node’s test runner fails the process).`,"Production safety net: the `unhandledRejection` handler logs and shuts down gracefully (covered in the uncaught exceptions answer). Treat every occurrence as a bug ticket."]},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Why does Node crash on an unhandled rejection now? *Since v15 the default is `--unhandled-rejections=throw`: a silently ignored failure is treated like an uncaught exception.*","Is `Promise.all` always right? *It rejects on the first failure but the other promises keep running; use `allSettled` for partial success and an `AbortSignal` to cancel the rest.*",`How do you do background work safely in a request? *Respond, then push a job to a durable queue; do not rely on a detached promise surviving a deploy.*`,"What does `.pipe()` leak? *On error the other streams are not destroyed, so file descriptors and sockets can stay open.*"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Using `forEach` with an async callback and assuming the loop waited.","Adding a global `unhandledRejection` handler that only logs and keeps running, hiding broken state.","Forgetting `error` listeners on Redis or database clients, so a network blip crashes the process.","Wrapping `await` calls in `try/catch` but returning un-awaited promises from inside the `try`."]},{type:`callout`,variant:`important`,text:"Senior signal: naming the concrete patterns that create unobserved promises, enforcing them with type-aware lint rules rather than code review, choosing `pipeline`, `events.once` and `captureRejections` deliberately, and moving must-not-lose work to a queue."}]},"asynclocalstorage-for-request-context":{summary:"`AsyncLocalStorage` from `node:async_hooks` gives each asynchronous call chain its own store, similar to thread-local storage: you call `als.run(store, fn)` and anything that runs inside `fn`, including later `await`s, timers and promise callbacks, can read the same store with `als.getStore()`. I use it to carry a request ID, user and tenant into logs, outgoing headers and database tags without threading a `context` argument through every function. The pitfalls are context loss through libraries that queue callbacks themselves, using `enterWith` instead of `run`, storing too much, and treating it as a substitute for explicit parameters in business logic.",details:[{type:`heading3`,text:`How it works`},{type:`paragraph`,text:`Node tracks which asynchronous resource (a promise, a timer, a socket callback) was created while which context was active. When that resource later runs its callback, Node restores the store that was active at creation time. So the store follows the logical request even though thousands of requests interleave on one thread. Modern Node implements this efficiently; the overhead is small enough that frameworks and APM agents enable it by default.`},{type:`heading3`,text:`A typed request context module`},{type:`code`,lang:`typescript`,code:`// request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
}

const als = new AsyncLocalStorage<RequestContext>();

export const runWithContext = <T>(ctx: RequestContext, fn: () => T) => als.run(ctx, fn);
export const getContext = () => als.getStore();             // undefined outside a request
export const requireContext = () => {
  const ctx = als.getStore();
  if (!ctx) throw new Error('No request context: called outside runWithContext');
  return ctx;
};

// Express middleware
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') ?? crypto.randomUUID();
  res.set('x-request-id', requestId);
  runWithContext({ requestId }, next);
});

// The auth middleware later enriches the SAME object (it is a reference)
app.use(authenticate, (req, _res, next) => {
  const ctx = requireContext();
  ctx.userId = req.user.id;
  ctx.tenantId = req.user.tenantId;
  next();
});`},{type:`heading3`,text:`Where the context pays off`},{type:`code`,lang:`typescript`,code:`// 1. Propagate to downstream services
export async function callInventory(path: string) {
  const ctx = getContext();
  return fetch(INVENTORY_URL + path, {
    headers: ctx ? { 'x-request-id': ctx.requestId } : {},
    signal: AbortSignal.timeout(2000),
  });
}

// 2. Put the request ID on queue messages, then restore it in the consumer
await queue.add('send-invoice', { orderId, requestId: getContext()?.requestId });

worker.process(async (job) =>
  runWithContext({ requestId: job.data.requestId ?? crypto.randomUUID() }, () => handle(job)),
);

// 3. Tag database queries for slow-query logs
const sql = '/* request_id=' + (getContext()?.requestId ?? '-') + ' */ ' + query;`},{type:`heading3`,text:"`run` vs `enterWith`"},{type:`bullets`,items:["`als.run(store, fn)` scopes the store to `fn` and everything it schedules, then restores the previous store. This is what you want almost always.","`als.enterWith(store)` sets the store for the rest of the current synchronous execution and everything scheduled from it, with no clear end. It is easy to leak a context into unrelated work (for example an event listener registered during that request), so I avoid it outside tests."]},{type:`heading3`,text:`Pitfalls`},{type:`bullets`,items:["**Context loss through custom queues.** Libraries that collect callbacks and run them later from their own internal loop (some older connection pools, callback-based drivers, custom batching) can run your callback in another request’s context or none. Fix with `AsyncResource.bind(fn)` or `AsyncLocalStorage.bind(fn)` at the point you hand over the callback, or use the promise-based API.","**Context bleeding.** The reverse problem: a pooled object captures the context of the first request that created it, and later requests see the wrong `requestId`. Watch for this with singletons created lazily inside a request.",`**Mutable shared store.** The store is a reference. Enriching it in middleware is fine; mutating it inside parallel branches of the same request can surprise you.`,"**Hidden dependencies.** Business logic that reads `getContext().tenantId` deep inside is hard to test and to call from a job. I use the context for cross-cutting concerns (logs, tracing, outgoing headers) and pass business inputs such as `tenantId` explicitly into services, or read it once at the boundary.","**Storing large objects.** Keep the store small (IDs, flags). Putting the whole `req` in it keeps request bodies alive for as long as any async work from that request exists."]},{type:`callout`,variant:`tip`,text:"OpenTelemetry’s Node SDK uses `AsyncLocalStorage` for the active span, which is why traces follow `await` chains automatically. If spans lose their parent in one library, the same context-loss fix applies."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How is this different from `req.locals`? *`res.locals` only exists where you have `req`/`res`; ALS reaches repositories, loggers and HTTP clients that never see the request.*","How do you test code that reads context? *Wrap the test body in `runWithContext({...}, () => ...)`, and prefer explicit parameters for business inputs so most tests do not need it.*","How does NestJS do this? *Request-scoped providers rebuild the DI graph per request and cost performance; `nestjs-cls` (built on ALS) is the lighter alternative.*","How do you carry context across services? *Headers (`x-request-id`, W3C `traceparent`) on HTTP and message metadata on queues, restored with `run` on the other side.*"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Calling `enterWith` in middleware and later seeing request IDs from other requests in logs.","Reading the context in code that also runs from cron jobs or consumers where no context was set, and crashing on `undefined`.",`Using ALS to pass business data everywhere, turning it into a global variable with extra steps.`,`Forgetting to propagate the ID into queued jobs, so the trail ends at the queue.`]},{type:`callout`,variant:`important`,text:"Senior signal: explaining how the store follows async resources, preferring `run` over `enterWith`, knowing the context-loss and bleeding failure modes and the `bind` fix, propagating context across queues and services, and drawing a line between cross-cutting context and explicit business parameters."}]},"surviving-a-failing-dependency":{summary:`I first classify each dependency as critical (the primary database: without it the request cannot succeed) or optional (a cache, a recommendations API, analytics). Every call gets a timeout, and failures are contained so one slow dependency cannot exhaust shared resources: separate pools and concurrency limits per dependency, a circuit breaker, bounded retries. Critical failures fail fast with a clear 503; optional ones degrade, for example by skipping the cache or serving stale data. Health checks follow the same split, so readiness never fails because an optional dependency is down, which would otherwise cause cascading restarts.`,details:[{type:`paragraph`,text:`Most "the whole service went down" incidents are not caused by the dependency failing, but by how the service reacts: requests pile up waiting on a dependency with no timeout, the event loop stays healthy but every connection and pool slot is held, memory grows, the load balancer sees timeouts, and Kubernetes restarts pods that were fine. The design goal is to keep failures **fast, contained and visible**.`},{type:`heading3`,text:`1. A timeout on every call`},{type:`code`,lang:`typescript`,code:`// HTTP: AbortSignal.timeout is built in (Node 17.3+)
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });

// Postgres (pg): fail fast instead of waiting forever for a pool slot or a slow query
const pool = new Pool({ max: 20, connectionTimeoutMillis: 2000, statement_timeout: 5000 });

// Redis (ioredis): bounded command time and no infinite offline queue
const redis = new Redis(url, { commandTimeout: 200, maxRetriesPerRequest: 1, enableOfflineQueue: false });`},{type:`paragraph`,text:`The timeout budget should fit inside the caller’s own timeout. If the load balancer gives up after 30 s and your service waits 60 s on a provider, you are doing work nobody will receive.`},{type:`heading3`,text:`2. Fail fast for critical, degrade for optional`},{type:`code`,lang:`typescript`,code:`// Optional dependency: the cache. Redis down = slower, not broken.
async function getProduct(id: string) {
  const cached = await redis.get('product:' + id).catch((err) => {
    metrics.increment('cache.errors');
    logger.warn({ err }, 'cache read failed, falling back to DB');
    return null;
  });
  if (cached) return JSON.parse(cached);

  const product = await db.products.findById(id);        // critical: errors propagate
  redis.set('product:' + id, JSON.stringify(product), 'EX', 300).catch(() => {});
  return product;
}

// Optional third-party: recommendations. Serve the page without them.
const recs = await recommendations.forUser(userId).catch(() => []);`},{type:`bullets`,items:[`**Stale-while-error**: keep the last good value (in memory or Redis with a longer TTL) and serve it when the source fails, marking it stale. Good for config, exchange rates, feature flags.`,"**Fail fast with a useful error** for critical paths: return 503 with `Retry-After` (a `DependencyError` mapped by the error middleware) instead of hanging.","**Make degradation visible**: a metric per fallback and a log at `warn`, otherwise the service quietly runs in degraded mode for weeks."]},{type:`heading3`,text:`3. Contain the blast radius (bulkheads)`},{type:`bullets`,items:[`Separate connection pools or HTTP agents per dependency, so a slow reporting query cannot take the slots used by checkout.`,"Concurrency limits per dependency (`p-limit`, a semaphore, or the pool size itself) plus a bounded queue: when it is full, reject immediately instead of buffering unbounded promises in memory.","A circuit breaker (for example `opossum`) around flaky third parties, so that after repeated failures you stop calling for a while and fail instantly. Retries use exponential backoff with jitter and a small cap; the circuit breaker and retry-storm answers cover the details.",`Load shedding when the service itself is saturated: reject early with 503 (event-loop lag or in-flight request count above a threshold) rather than letting every request time out.`]},{type:`heading3`,text:`4. Health checks that do not cause cascading restarts`},{type:`code`,lang:`typescript`,code:`// Liveness: is THIS process broken? Never check dependencies here.
app.get('/livez', (_req, res) => res.sendStatus(200));

// Readiness: can this instance serve useful traffic? Only critical dependencies.
app.get('/readyz', async (_req, res) => {
  const dbOk = await db.ping({ timeoutMs: 500 }).then(() => true, () => false);
  res.status(dbOk ? 200 : 503).json({ db: dbOk, cache: redis.status === 'ready' }); // cache reported, not gating
});`},{type:`paragraph`,text:`If liveness checks the database, a database blip makes Kubernetes kill every pod at once, and they all reconnect at the same time when it recovers. If readiness gates on Redis, a cache outage takes the whole service out of the load balancer even though it could serve from the database.`},{type:`heading3`,text:`5. Startup and recovery`},{type:`bullets`,items:[`Start the process even if an optional dependency is unreachable, and connect lazily with backoff. Crash-looping on startup because Redis is down turns a cache outage into a full outage.`,`For the critical database, retry the initial connection with backoff and stay not-ready until it succeeds, rather than exiting immediately.`,"Make sure clients reconnect on their own (`error` listeners attached, reconnect strategy configured) and that a recovered dependency is not hit by every instance at once (jittered reconnects)."]},{type:`heading3`,text:`6. Alerting`},{type:`paragraph`,text:`Alert on user-facing symptoms (error rate and latency SLOs for the endpoints) and use per-dependency metrics (error rate, latency, circuit state, fallback count) to explain the cause. Page on "checkout 5xx above budget", not on "one Redis command timed out".`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you pick timeout values? *From the dependency’s p99 latency plus headroom, kept inside the caller’s budget; revisit with real metrics.*`,`What if the critical database is down for 10 minutes? *Fail fast with 503, stay up, stop accepting writes you cannot store, or queue writes if the business allows it.*`,`How do you test this? *Fault injection in staging (Toxiproxy, killing containers), unit tests with fakes that time out, and game days.*`,`Why not just retry more? *Retries multiply load on a struggling dependency; without budgets and jitter they turn a partial outage into a total one.*`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Relying on library defaults, many of which wait indefinitely or queue commands while disconnected.`,`Checking every dependency in the liveness probe.`,`One shared pool or HTTP agent for all downstream calls, so the slowest dependency starves the rest.`,`Catching dependency errors and silently returning empty data for critical paths, producing wrong answers instead of errors.`]},{type:`callout`,variant:`important`,text:`Senior signal: classifying dependencies as critical or optional and designing the failure behaviour for each, putting timeouts and bulkheads on every call, separating liveness from readiness to avoid cascading restarts, and making degraded mode observable with symptom-based alerts.`}]}};export{e as answers};