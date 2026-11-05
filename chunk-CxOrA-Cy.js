var e={"What is clustering in Node.js and why is it needed?":{summary:`Clustering means running several Node.js processes (workers) of the same app, usually one per CPU core, that share the same server port. A single Node process runs your JavaScript on one thread, so it can only use one core; clustering lets one machine use all its cores and keeps the service up if one worker crashes.`,details:[{type:`paragraph`,text:"Node.js runs JavaScript on a single main thread with an event loop. That is great for I/O-heavy work, but one process can only keep **one CPU core** busy with JavaScript. On an 8-core server, a single `node server.js` leaves 7 cores mostly idle. Clustering starts N copies of the app, and the operating system or the primary process spreads incoming connections across them."},{type:`heading3`,text:`Why it is needed`},{type:`bullets`,items:[`**Throughput:** CPU-bound parts of request handling (JSON parsing, templating, crypto, validation) are spread across cores, so requests per second go up roughly with the number of cores.`,`**Resilience:** if one worker crashes or gets stuck, the others keep serving while the primary restarts it.`,`**Zero-downtime reloads:** workers can be replaced one at a time (rolling restart) so a deploy never drops all connections.`,`**Memory isolation:** each worker has its own V8 heap, so a memory leak or heap limit affects one worker, not the whole service.`]},{type:`heading3`,text:`What it does NOT do`},{type:`bullets`,items:[`Workers do **not share memory**. An in-memory cache, session store or rate-limit counter in one worker is invisible to the others — move that state to Redis or a database.`,"It does not make a single slow CPU-bound request faster; for that, use `worker_threads` or move the work to a background job.",`It scales one machine only. Beyond that you scale horizontally with more machines/containers behind a load balancer.`]},{type:`flow`,title:`One process vs a cluster`,code:`flowchart LR
  C[Clients]:::client --> P["Primary process<br/>(listens on :3000)"]:::network
  P --> W1["Worker 1<br/>core 1"]:::server
  P --> W2["Worker 2<br/>core 2"]:::server
  P --> W3["Worker 3<br/>core 3"]:::server
  P --> W4["Worker 4<br/>core 4"]:::server
  W1 & W2 & W3 & W4 --> R[("Redis / DB<br/>shared state")]:::db`,text:`Each worker is a full Node process with its own event loop and heap; shared state lives outside the processes.`},{type:`heading3`,text:`Clustering vs other options`},{type:`bullets`,items:["`cluster` module / PM2 cluster mode — multiple processes on one host, sharing a port.","`worker_threads` — threads inside one process for CPU-heavy tasks; can share memory via `SharedArrayBuffer`.",`Containers + Kubernetes — run one Node process per container and let the orchestrator scale replicas. In Kubernetes this is usually preferred over in-process clustering, because the platform already restarts and load-balances pods.`]},{type:`callout`,variant:`tip`,text:`Interview tip: say clearly that Node is single-threaded **for JavaScript execution** (libuv still uses a thread pool for some I/O), then explain that clustering is about using all cores and fault tolerance — and immediately mention that state must move out of process memory.`}]},"How do you implement clustering in Node.js using the cluster module?":{summary:"Use the built-in `node:cluster` module: in the primary process (`cluster.isPrimary`) fork one worker per CPU with `cluster.fork()` and restart workers on `exit`; in each worker, start the HTTP server normally. All workers can call `listen()` on the same port and the primary distributes connections between them.",details:[{type:`paragraph`,text:"The same file runs in both roles. When you start it, it is the **primary**; each `cluster.fork()` re-runs the file as a **worker** where `cluster.isPrimary` is false. Use `os.availableParallelism()` (Node 18.14+/20+) or `os.cpus().length` to decide how many workers to start."},{type:`heading3`,text:`Basic cluster with auto-restart`},{type:`code`,lang:`javascript`,code:`// server.js
import cluster from 'node:cluster';
import http from 'node:http';
import { availableParallelism } from 'node:os';
import process from 'node:process';

const numWorkers = availableParallelism();

if (cluster.isPrimary) {
  console.log(\`Primary \${process.pid} starting \${numWorkers} workers\`);

  for (let i = 0; i < numWorkers; i++) cluster.fork();

  // Keep the pool full: restart a worker if it dies unexpectedly
  cluster.on('exit', (worker, code, signal) => {
    if (worker.exitedAfterDisconnect) return; // intentional shutdown
    console.warn(\`Worker \${worker.process.pid} died (\${signal || code}), restarting\`);
    cluster.fork();
  });
} else {
  // Workers: a normal server. They all "listen" on 3000.
  http
    .createServer((req, res) => {
      res.end(\`Handled by worker \${process.pid}\\n\`);
    })
    .listen(3000);

  console.log(\`Worker \${process.pid} started\`);
}

// $ node server.js
// Primary 4100 starting 8 workers
// Worker 4101 started ... Worker 4108 started
// $ curl localhost:3000  -> Handled by worker 4103`},{type:`heading3`,text:`Graceful shutdown and rolling restart`},{type:`code`,lang:`javascript`,code:`// Primary: on SIGTERM, ask workers to finish in-flight requests
process.on('SIGTERM', () => {
  for (const id in cluster.workers) {
    cluster.workers[id].disconnect(); // stop accepting new connections
  }
});

// Primary: zero-downtime reload \u2014 replace workers one by one
async function rollingRestart() {
  for (const worker of Object.values(cluster.workers)) {
    const fresh = cluster.fork();
    await new Promise((r) => fresh.once('listening', r)); // new one ready first
    worker.disconnect();                                  // then retire old one
  }
}
process.on('SIGUSR2', rollingRestart);

// Worker: close the server cleanly when disconnected
// server.close(() => process.exit(0));`},{type:`heading3`,text:`Messaging between primary and workers`},{type:`code`,lang:`javascript`,code:`// Primary
cluster.on('message', (worker, msg) => {
  if (msg.type === 'stats') console.log(worker.id, msg.requests);
});

// Worker
let requests = 0;
setInterval(() => process.send({ type: 'stats', requests }), 5000);`},{type:`bullets`,items:["`cluster.isMaster` is the deprecated old name for `cluster.isPrimary`.",`Guard against crash loops: if workers die repeatedly within seconds, back off instead of forking forever.`,`Do not fork more workers than cores for CPU-bound apps; leave room for the primary and the OS.`,"In production many teams use PM2 (`pm2 start app.js -i max`) instead of hand-written cluster code."]},{type:`callout`,variant:`warning`,text:`Common pitfall: storing sessions, WebSocket rooms or caches in a worker's memory. A user's next request may hit another worker. Use Redis (and sticky sessions for WebSockets/Socket.IO).`}]},"How does the primary process distribute requests among workers in cluster mode?":{summary:"Node supports two strategies. The default on every platform except Windows is round-robin (`SCHED_RR`): the primary accepts each TCP connection and hands it to the next worker in turn. The other (`SCHED_NONE`) lets the primary create the listening socket and pass it to workers, which then compete to accept connections — the OS decides, which often leads to uneven load.",details:[{type:`paragraph`,text:`Important detail: distribution is per **connection**, not per HTTP request. With HTTP keep-alive, many requests over one connection all go to the same worker.`},{type:`heading3`,text:`1. Round-robin (default, except Windows)`},{type:`paragraph`,text:"The primary owns the listening socket, calls `accept()`, then sends the connection handle to a worker over the IPC channel, cycling through workers. It avoids one worker hogging connections, at the cost of the primary doing a little extra work per connection."},{type:`heading3`,text:`2. Shared handle / OS scheduling (SCHED_NONE)`},{type:`paragraph`,text:"The primary creates the socket and shares the handle; every worker calls `accept()` on it and the kernel wakes one of them. In theory this is fastest, but in practice the kernel tends to favour a few busy workers, giving skewed load. It is the default on Windows."},{type:`code`,lang:`javascript`,code:`import cluster from 'node:cluster';

// Must be set before the first fork()
cluster.schedulingPolicy = cluster.SCHED_RR;   // round-robin
// cluster.schedulingPolicy = cluster.SCHED_NONE; // leave it to the OS

// Or via environment variable:
// NODE_CLUSTER_SCHED_POLICY=rr node server.js
// NODE_CLUSTER_SCHED_POLICY=none node server.js`},{type:`flow`,title:`Round-robin connection handoff`,code:`sequenceDiagram
  participant C as Client
  participant P as Primary
  participant W1 as Worker 1
  participant W2 as Worker 2
  C->>P: TCP connect :3000
  P->>W1: pass socket handle (IPC)
  W1-->>C: HTTP response
  C->>P: new TCP connect
  P->>W2: pass socket handle (IPC)
  W2-->>C: HTTP response`},{type:`bullets`,items:[`Round-robin is not load-aware: a worker busy with a slow request still gets its turn.`,`Long-lived connections (WebSockets, keep-alive) stick to one worker for their lifetime.`,"Socket.IO with HTTP long-polling needs **sticky sessions** (e.g. `@socket.io/sticky`) so a client's requests reach the same worker.",`In containers, an external load balancer (Nginx, Kubernetes Service, ALB) usually does the distribution across one-process-per-container instances instead.`]},{type:`callout`,variant:`tip`,text:`Interview tip: mentioning that balancing is per connection (not per request) and that round-robin is the default except on Windows shows you understand the internals rather than just the API.`}]},"How do you share state between cluster workers?":{summary:"Workers are separate processes with separate memory, so you cannot share JavaScript objects. Either keep the app stateless and put shared state in an external store like Redis or a database (the standard answer), or pass messages through the primary with IPC (`process.send` / `worker.send`) for small, non-critical coordination.",details:[{type:`paragraph`,text:"A global variable like `let counter = 0` exists once **per worker**. With 4 workers you get 4 independent counters, and a user may hit a different worker on each request. Sessions, caches, rate limits and WebSocket rooms break in subtle ways if they live in memory."},{type:`heading3`,text:`Option 1: external store (recommended)`},{type:`code`,lang:`javascript`,code:`import express from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const app = express();

// Sessions visible to every worker (and every server)
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Atomic shared counter
app.get('/hits', async (_req, res) => {
  const hits = await redis.incr('hits'); // INCR is atomic across workers
  res.json({ hits, pid: process.pid });
});`},{type:`heading3`,text:`Option 2: IPC through the primary`},{type:`code`,lang:`javascript`,code:`// Primary keeps the "source of truth" and broadcasts updates
if (cluster.isPrimary) {
  let featureFlags = { newCheckout: false };
  cluster.on('message', (_worker, msg) => {
    if (msg.type === 'setFlag') {
      featureFlags = { ...featureFlags, ...msg.flags };
      for (const w of Object.values(cluster.workers)) {
        w.send({ type: 'flags', featureFlags });
      }
    }
  });
} else {
  let flags = {};
  process.on('message', (msg) => {
    if (msg.type === 'flags') flags = msg.featureFlags; // local copy
  });
  // process.send({ type: 'setFlag', flags: { newCheckout: true } });
}`},{type:`bullets`,items:[`**Redis:** sessions, caches, counters, rate limits, distributed locks, pub/sub to notify all workers (e.g. "invalidate cache key X").`,`**Database:** durable business state.`,`**IPC:** config broadcasts, metrics aggregation. Messages are serialized and asynchronous, and the state is lost if the primary restarts. It also does not work across machines.`,"**Socket.IO:** use the Redis adapter so `io.to(room).emit()` reaches clients connected to other workers.","`SharedArrayBuffer` sharing only works between `worker_threads`, not cluster processes."]},{type:`flow`,title:`Where state should live`,code:`flowchart LR
  W1[Worker 1]:::server --> R[("Redis<br/>sessions, cache, counters")]:::cache
  W2[Worker 2]:::server --> R
  W3[Worker 3]:::server --> R
  W1 & W2 & W3 --> DB[("Database<br/>durable data")]:::db
  P[Primary]:::network -. "IPC: config, metrics" .-> W1 & W2 & W3`},{type:`callout`,variant:`tip`,text:`Interview tip: frame it as "design for statelessness". If state is external, the same code scales from 4 workers on one box to 40 pods in Kubernetes without changes.`}]},"What is PM2 and how does it manage Node.js processes?":{summary:"PM2 is a production process manager for Node.js. It keeps apps alive (auto-restart on crash), runs them in cluster mode across all cores with `-i max`, supports zero-downtime reloads, collects logs, monitors CPU/memory, and can generate startup scripts so apps come back after a server reboot.",details:[{type:`paragraph`,text:"PM2 runs a background daemon that spawns and supervises your processes. In **fork mode** it runs a single process; in **cluster mode** it uses Node's `cluster` module under the hood, so you get multi-core scaling without writing any cluster code yourself."},{type:`heading3`,text:`Everyday commands`},{type:`code`,lang:`bash`,code:`npm install -g pm2

pm2 start server.js --name api -i max   # cluster mode, one worker per core
pm2 list                                # status, CPU, memory, restarts
pm2 logs api                            # tail logs
pm2 monit                               # live terminal dashboard
pm2 reload api                          # zero-downtime rolling reload
pm2 restart api                         # hard restart (brief downtime)
pm2 stop api && pm2 delete api

pm2 startup                             # generate systemd/launchd startup script
pm2 save                                # remember current process list`},{type:`heading3`,text:`Ecosystem file (config as code)`},{type:`code`,lang:`javascript`,code:`// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/server.js',
      instances: 'max',          // or a number
      exec_mode: 'cluster',
      max_memory_restart: '500M', // restart a worker that leaks past 500 MB
      kill_timeout: 5000,         // time for graceful shutdown before SIGKILL
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production', PORT: 3000 },
    },
    {
      name: 'worker',
      script: './dist/queue-worker.js',
      instances: 2,
      exec_mode: 'fork',
    },
  ],
};

// pm2 start ecosystem.config.js --env production`},{type:`flow`,title:`How PM2 supervises an app`,code:`stateDiagram-v2
  [*] --> online: pm2 start
  online --> errored: crash / uncaught exception
  errored --> online: auto-restart (with backoff)
  online --> online: pm2 reload (one worker at a time)
  online --> stopped: pm2 stop
  stopped --> [*]: pm2 delete`},{type:`bullets`,items:["`reload` replaces workers one by one so there is always a worker serving; `restart` kills all at once.","Handle `SIGINT`/`SIGTERM` in your app to close servers and DB pools gracefully during reloads.","Features like `max_memory_restart` and `--exp-backoff-restart-delay` limit damage from leaks and crash loops.","Inside Docker/Kubernetes, PM2 is often unnecessary: the orchestrator restarts containers and scales replicas. If used, run `pm2-runtime` so PM2 stays in the foreground.",`Alternatives: systemd units, Docker restart policies, Kubernetes Deployments.`]},{type:`callout`,variant:`tip`,text:`Interview tip: explain both what PM2 gives you (restarts, clustering, reloads, logs) and when you would not use it — "on Kubernetes we run one process per container and let the platform supervise it" is a mature answer.`}]}};export{e as answers};