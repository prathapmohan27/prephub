var e={"microservices-vs-monolith":{summary:`A monolith is one deployable application containing all features and usually one shared database. Microservices split the system into small, independently deployable services, each owning one business capability and its own data, communicating over the network (HTTP/gRPC or messaging). Monoliths are simpler to build and operate; microservices let teams deploy and scale parts independently at the price of distributed-systems complexity.`,details:[{type:`paragraph`,text:`The defining traits of microservices are **independent deployability**, **ownership of data** (no other service reads your tables directly) and **organization around business capabilities** (Orders, Payments, Catalog) rather than technical layers. Each service is typically owned by one team.`},{type:`flow`,title:`Monolith vs microservices`,code:`flowchart LR
  subgraph Mono["Monolith"]
    M["Users + Orders + Payments<br/>one process"]:::server --> MDB[("Shared DB")]:::db
  end
  subgraph Micro["Microservices"]
    GW[API Gateway]:::network --> U[Users svc]:::server
    GW --> O[Orders svc]:::server
    GW --> P[Payments svc]:::server
    U --> UDB[("Users DB")]:::db
    O --> ODB[("Orders DB")]:::db
    P --> PDB[("Payments DB")]:::db
    O -. events .-> Q[[Broker]]:::queue
  end`},{type:`heading3`,text:`Side-by-side`},{type:`bullets`,items:[`**Deployment:** monolith — one artifact, all-or-nothing; microservices — each service ships on its own schedule.`,`**Scaling:** monolith — scale the whole app; microservices — scale only the hot service (e.g. Search).`,`**Data:** monolith — one DB, easy joins and ACID transactions; microservices — database per service, cross-service consistency via events/sagas.`,`**Communication:** monolith — in-process function calls (fast, reliable); microservices — network calls (latency, partial failure, retries).`,`**Tech:** monolith — one stack; microservices — each service can choose (Node for APIs, Go/Python where better suited).`,`**Failure:** a monolith crash takes everything down; a failing microservice can be isolated — if you design for it (timeouts, circuit breakers).`,`**Operations:** microservices need CI/CD per service, service discovery, centralized logging, distributed tracing, and container orchestration.`]},{type:`heading3`,text:`Example: a call that becomes a network call`},{type:`code`,lang:`typescript`,code:`// Monolith: in-process call, same transaction
const user = await usersService.findById(order.userId);

// Microservices: HTTP call with timeout and failure handling
const res = await fetch(\`http://users-service/users/\${order.userId}\`, {
  signal: AbortSignal.timeout(2000),
});
if (!res.ok) throw new UpstreamError('users-service', res.status);
const user = await res.json();`},{type:`bullets`,items:[`A **modular monolith** — one deployable with strict internal module boundaries — is a strong middle ground and an easy path to extracting services later.`,`Splitting services that share a database or must deploy together gives you a **distributed monolith**: all the costs, none of the benefits.`]},{type:`callout`,variant:`tip`,text:`Interview tip: don't present microservices as simply "better". Say they solve organizational and scaling problems of large teams, and that many products should start as a well-structured monolith.`}]},"pros-and-cons-of-microservices":{summary:`Advantages: independent deployment and scaling, team autonomy, fault isolation, freedom of technology, and smaller codebases that are easier to understand. Disadvantages: distributed-systems complexity (network failures, latency, eventual consistency), harder testing and debugging, data consistency across services, and much higher operational overhead for CI/CD, monitoring and infrastructure.`,details:[{type:`heading3`,text:`Advantages`},{type:`bullets`,items:[`**Independent deployments** — ship the Payments fix without redeploying everything; smaller, safer, more frequent releases.`,`**Independent scaling** — run 20 Search instances and 2 Admin instances.`,`**Team autonomy** \u2014 each team owns a service end to end ("you build it, you run it"), fewer merge conflicts and coordination meetings (Conway's Law).`,`**Fault isolation** — a crash in Recommendations need not take down Checkout.`,`**Technology flexibility** — choose the best language/database per service; upgrade Node versions one service at a time.`,`**Smaller codebases** — faster builds and easier onboarding per service.`]},{type:`heading3`,text:`Disadvantages`},{type:`bullets`,items:[`**Network is unreliable** — every call can time out or fail; you need timeouts, retries, circuit breakers, idempotency.`,`**Data consistency** — no cross-service ACID transactions; you need sagas, outbox, eventual consistency.`,`**Latency** — a request fanning out to 5 services pays 5 network hops.`,`**Observability** — debugging needs correlation IDs, centralized logs and distributed tracing (OpenTelemetry).`,`**Testing** — integration across services needs contract tests and environments.`,`**Operational cost** — Kubernetes, service mesh, many pipelines, many dashboards; needs DevOps maturity.`,`**Wrong boundaries are expensive** — moving a feature between services is far harder than between modules.`]},{type:`code`,lang:`typescript`,code:`// The hidden cost in code: what used to be one line...
const stock = inventory.check(sku);

// ...becomes resilience plumbing around a remote call
const stock = await breaker.fire(() =>
  retry(() => inventoryClient.check(sku, { timeoutMs: 800 }), { retries: 2, backoffMs: 100 }),
).catch(() => ({ available: null, stale: true })); // graceful fallback`},{type:`callout`,variant:`tip`,text:`Interview tip: finish with when you would choose them — "multiple teams, parts with very different scaling or release needs, and the platform maturity to run them". Otherwise a modular monolith is usually the better start.`}]},"how-microservices-communicate":{summary:`Two families: synchronous request/response — REST over HTTP, gRPC, or GraphQL — where the caller waits for an answer; and asynchronous messaging — message queues (RabbitMQ, SQS) and event streams (Kafka, NATS, Redis Streams) — where services publish commands or events and consumers process them later. Most systems use synchronous calls for queries that need an immediate answer and events for propagating state changes.`,details:[{type:`heading3`,text:`Synchronous`},{type:`bullets`,items:[`**REST/HTTP + JSON** — universal, easy to debug, cacheable; good for public and most internal APIs.`,`**gRPC** — HTTP/2 + Protocol Buffers; typed contracts, fast binary payloads, streaming; great for internal service-to-service calls.`,`**GraphQL** — usually at the edge (BFF/gateway) to aggregate data for clients.`]},{type:`heading3`,text:`Asynchronous`},{type:`bullets`,items:[`**Queues (point-to-point)** — RabbitMQ, SQS, BullMQ: one consumer handles each message; good for commands/jobs ("send this email").`,`**Pub/sub & event streams** — Kafka, SNS, NATS, Google Pub/Sub: many consumers react to events ("OrderPlaced"); Kafka also retains and replays history.`]},{type:`code`,lang:`typescript`,code:`// Sync: Orders asks Inventory and waits
const res = await fetch('http://inventory/stock/sku-123', { signal: AbortSignal.timeout(1000) });
const { available } = await res.json();

// Async: Orders publishes an event and moves on (kafkajs)
await producer.send({
  topic: 'orders.events',
  messages: [{ key: order.id, value: JSON.stringify({ type: 'OrderPlaced', orderId: order.id, items }) }],
});

// Inventory, Email and Analytics each consume it independently
await consumer.subscribe({ topic: 'orders.events' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value!.toString());
    if (event.type === 'OrderPlaced') await reserveStock(event); // must be idempotent
  },
});`},{type:`flow`,title:`Mixed communication in an order flow`,code:`flowchart LR
  C[Client]:::client --> GW[API Gateway]:::network
  GW -->|REST| O[Orders]:::server
  O -->|"gRPC: check price"| PR[Pricing]:::server
  O -->|"OrderPlaced"| K[[Kafka]]:::queue
  K --> I[Inventory]:::server
  K --> E[Email]:::server
  K --> A[Analytics]:::server`},{type:`heading3`,text:`Supporting pieces`},{type:`bullets`,items:["**Service discovery** — Kubernetes DNS (`http://inventory`), Consul, or cloud service maps.",`**Resilience** — timeouts, retries with backoff and jitter, circuit breakers, bulkheads.`,"**Contracts** — OpenAPI, `.proto` files, AsyncAPI or a schema registry; version them and keep changes backward compatible.",`**Observability** — propagate a trace/correlation ID across HTTP headers and message metadata.`,`**Service mesh** (Istio, Linkerd) can add mTLS, retries and telemetry without code changes.`]},{type:`callout`,variant:`warning`,text:`Common pitfall: long synchronous call chains (A → B → C → D). Availability multiplies down (four 99.9% services ≈ 99.6%) and latency adds up. Prefer events or data replication for anything that doesn't need an immediate answer.`}]},"sync-vs-async-communication":{summary:`In synchronous communication (REST, gRPC) the caller sends a request and waits for the response, so both services must be up at the same time and the caller's latency includes the callee's. In asynchronous communication (queues, events) the sender publishes a message to a broker and continues; consumers process it later. Async gives loose coupling and resilience to outages, at the cost of eventual consistency and harder debugging.`,details:[{type:`paragraph`,text:"Note: this is about **architectural** coupling, not JavaScript `async/await`. An `await fetch()` in Node is non-blocking for the event loop, but it is still synchronous communication — the request cannot complete until the other service answers."},{type:`flow`,title:`Sync vs async`,code:`sequenceDiagram
  participant O as Orders
  participant P as Payments
  participant B as Broker
  participant E as Email
  Note over O,P: Synchronous
  O->>P: POST /charge
  P-->>O: 200 charged
  Note over O,E: Asynchronous
  O->>B: publish OrderPlaced
  B-->>O: ack (stored)
  B->>E: deliver later
  E->>E: send confirmation`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**Coupling:** sync — temporal coupling (callee must be available now); async — the broker buffers messages if a consumer is down.`,`**Latency:** sync — adds up along the chain; async — the producer returns immediately, work happens in the background.`,`**Consistency:** sync — immediate answer; async — eventual consistency.`,`**Failure handling:** sync — timeouts, retries, circuit breakers; async — redelivery, dead-letter queues, idempotent consumers.`,`**Scaling:** async smooths traffic spikes (queue as a buffer, consumers scale on queue depth).`,`**Debugging:** sync is easier to trace; async needs correlation IDs and tracing through the broker.`]},{type:`heading3`,text:`When to use which`},{type:`bullets`,items:[`Use **sync** when the user needs the answer to continue: authenticate, get price, validate a coupon, read data for the page.`,`Use **async** for side effects and fan-out: send emails, update search index, analytics, reserve stock in a saga, long-running work like video processing.`,"A common hybrid: accept the request synchronously, return `202 Accepted` with a job ID, process asynchronously, and notify via webhook/WebSocket or polling."]},{type:`code`,lang:`typescript`,code:`// Hybrid: respond fast, process in background (BullMQ)
app.post('/reports', async (req, res) => {
  const job = await reportQueue.add('generate', { userId: req.user.id, range: req.body.range });
  res.status(202).json({ jobId: job.id, statusUrl: \`/reports/\${job.id}\` });
});

// Worker process
new Worker('reports', async (job) => {
  const file = await buildReport(job.data);
  await notifyUser(job.data.userId, file.url);
});`},{type:`callout`,variant:`tip`,text:"Interview tip: clarify that `async/await` ≠ asynchronous communication — interviewers sometimes test exactly this. Then give one concrete example of each from a system you built."}]},"api-gateways":{summary:`An API Gateway is a single entry point that sits between clients and backend microservices. It routes each request to the right service and handles cross-cutting concerns centrally — authentication, rate limiting, TLS, CORS, request/response transformation, caching, logging and metrics — so clients don't need to know the internal topology and services don't each reimplement those concerns.`,details:[{type:`paragraph`,text:`Without a gateway, a mobile app would need to know the address of 15 services, call several of them per screen, and every service would need its own auth, rate limiting and CORS logic. The gateway hides that and gives one stable public API.`},{type:`heading3`,text:`Problems it solves`},{type:`bullets`,items:["**Routing** — `/api/orders/*` → Orders, `/api/users/*` → Users; internal services can move or split without breaking clients.",`**Authentication** — validate the JWT/OAuth token once, forward trusted identity headers (e.g. user ID) downstream.`,`**Rate limiting and quotas** — per user, API key or IP.`,`**Aggregation** — combine several service calls into one response (reduces chatty mobile clients).`,`**Protocol translation** — REST outside, gRPC inside; WebSocket handling.`,`**Cross-cutting** — TLS termination, CORS, compression, caching, request IDs, access logs, metrics.`,`**Release control** — canary routing, A/B tests, API versioning.`]},{type:`flow`,title:`Gateway in front of services`,code:`flowchart LR
  W[Web app]:::client --> GW["API Gateway<br/>auth, rate limit, routing"]:::network
  M[Mobile app]:::client --> GW
  GW --> U[Users svc]:::server
  GW --> O[Orders svc]:::server
  GW --> C[Catalog svc]:::server
  GW -.-> A["Auth / IdP"]:::security`},{type:`heading3`,text:`A minimal Node gateway`},{type:`code`,lang:`javascript`,code:`import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { verifyJwt } from './auth.js';

const app = express();
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));

app.use('/api', (req, res, next) => {
  try {
    const user = verifyJwt(req.headers.authorization);
    req.headers['x-user-id'] = user.sub;           // trusted header for services
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.use('/api/orders', createProxyMiddleware({ target: 'http://orders:3000', changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: 'http://users:3000', changeOrigin: true }));

// Aggregation endpoint for a dashboard screen
app.get('/api/dashboard', async (req, res) => {
  const [orders, profile] = await Promise.all([
    fetch(\`http://orders:3000/recent?user=\${req.headers['x-user-id']}\`).then((r) => r.json()),
    fetch(\`http://users:3000/\${req.headers['x-user-id']}\`).then((r) => r.json()),
  ]);
  res.json({ profile, orders });
});

app.listen(8080);`},{type:`bullets`,items:[`Products: Kong, AWS API Gateway, Apigee, Azure API Management, Traefik, Envoy-based gateways, NGINX; or a custom Node/NestJS gateway.`,`**BFF (Backend for Frontend)** — a separate gateway per client type (web, mobile) shaped to its needs.`,`**Risks:** a single point of failure and bottleneck (run multiple instances, keep it stateless), and a "god gateway" that accumulates business logic — keep business rules in services.`,`Gateway (north-south traffic, client → services) vs service mesh (east-west traffic, service → service).`]},{type:`callout`,variant:`warning`,text:"Common pitfall: trusting identity headers like `x-user-id` that a client could send directly. Services must only be reachable through the gateway (network policy) or verify tokens themselves."}]},"circuit-breaker-pattern":{summary:`A circuit breaker wraps calls to a remote dependency and stops calling it once failures cross a threshold. In the Closed state calls pass through; too many failures trip it Open, where calls fail fast (or return a fallback) without hitting the dependency; after a cooldown it goes Half-Open and lets a few trial calls through — success closes it, failure re-opens it. It prevents cascading failures and gives the struggling service time to recover.`,details:[{type:`paragraph`,text:`Without it, when Inventory becomes slow, every Orders request waits for a timeout, Orders' connections and memory fill up, and Orders fails too — then everything calling Orders fails. A breaker cuts that chain by failing fast.`},{type:`flow`,title:`Circuit breaker states`,code:`stateDiagram-v2
  [*] --> Closed
  Closed --> Open: failure rate over threshold
  Open --> HalfOpen: reset timeout elapsed
  HalfOpen --> Closed: trial calls succeed
  HalfOpen --> Open: trial call fails
  note right of Open: fail fast or use fallback`},{type:`heading3`,text:`Using opossum in Node`},{type:`code`,lang:`javascript`,code:`import CircuitBreaker from 'opossum';

async function getRecommendations(userId) {
  const res = await fetch(\`http://recs/users/\${userId}\`, { signal: AbortSignal.timeout(800) });
  if (!res.ok) throw new Error(\`recs \${res.status}\`);
  return res.json();
}

const breaker = new CircuitBreaker(getRecommendations, {
  timeout: 1000,                 // a call slower than this counts as a failure
  errorThresholdPercentage: 50,  // open when >= 50% of recent calls fail
  volumeThreshold: 10,           // ...but only after at least 10 calls
  resetTimeout: 30_000,          // try again (half-open) after 30 s
});

breaker.fallback(() => ({ items: [], fallback: true })); // degrade gracefully
breaker.on('open', () => logger.warn('recs circuit OPEN'));
breaker.on('close', () => logger.info('recs circuit closed'));

app.get('/home', async (req, res) => {
  const recs = await breaker.fire(req.user.id); // instant fallback while open
  res.json({ recs });
});`},{type:`heading3`,text:`Core logic (simplified)`},{type:`code`,lang:`typescript`,code:`class SimpleBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private openedAt = 0;

  constructor(private fn: () => Promise<unknown>, private threshold = 5, private resetMs = 30_000) {}

  async call() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt < this.resetMs) throw new Error('Circuit open');
      this.state = 'HALF_OPEN';
    }
    try {
      const result = await this.fn();
      this.failures = 0;
      this.state = 'CLOSED';
      return result;
    } catch (err) {
      if (this.state === 'HALF_OPEN' || ++this.failures >= this.threshold) {
        this.state = 'OPEN';
        this.openedAt = Date.now();
      }
      throw err;
    }
  }
}`},{type:`bullets`,items:[`Combine with **timeouts** (a breaker without timeouts never sees slow calls fail), **retries with backoff** (inside the breaker, few attempts) and **bulkheads** (limit concurrent calls per dependency).`,`Choose fallbacks per use case: cached data, a default, a degraded feature, or a clear 503 — never silently wrong data for critical operations like payments.`,`One breaker per dependency (or per endpoint), not one global breaker.`,`Export breaker state as metrics and alert on it.`,`Service meshes (Istio, Linkerd) and Envoy offer outlier detection / circuit breaking at the infrastructure level.`]},{type:`callout`,variant:`tip`,text:`Interview tip: draw the three states and explain the half-open probe — that detail is what separates a memorized answer from a real one. Then mention fallback and timeouts.`}]},"saga-pattern":{summary:`A saga manages a business transaction that spans several services as a sequence of local transactions, each in its own service and database. If a step fails, the saga runs compensating actions to undo the steps already completed (e.g. refund the payment, release the stock). It can be coordinated by choreography (services react to each other's events) or orchestration (a central orchestrator tells each service what to do).`,details:[{type:`paragraph`,text:`Because each microservice owns its database, you cannot wrap "create order, charge card, reserve stock" in one ACID transaction. A saga accepts **eventual consistency**: each step commits locally, and failures are handled by explicit compensation rather than rollback.`},{type:`heading3`,text:`Orchestration example`},{type:`flow`,title:`Order saga with compensation`,code:`sequenceDiagram
  participant O as Orchestrator
  participant Ord as Orders
  participant Pay as Payments
  participant Inv as Inventory
  O->>Ord: create order (PENDING)
  O->>Pay: charge card
  Pay-->>O: charged
  O->>Inv: reserve stock
  Inv-->>O: out of stock
  O->>Pay: refund (compensate)
  O->>Ord: mark CANCELLED (compensate)`},{type:`code`,lang:`typescript`,code:`type Step = { name: string; action: (ctx: Ctx) => Promise<void>; compensate: (ctx: Ctx) => Promise<void> };

const placeOrderSaga: Step[] = [
  { name: 'createOrder',   action: (c) => orders.create(c),        compensate: (c) => orders.cancel(c.orderId) },
  { name: 'chargePayment', action: (c) => payments.charge(c),      compensate: (c) => payments.refund(c.paymentId) },
  { name: 'reserveStock',  action: (c) => inventory.reserve(c),    compensate: (c) => inventory.release(c.orderId) },
  { name: 'confirm',       action: (c) => orders.confirm(c.orderId), compensate: async () => {} },
];

async function runSaga(steps: Step[], ctx: Ctx) {
  const done: Step[] = [];
  for (const step of steps) {
    try {
      await step.action(ctx);
      done.push(step);
      await sagaLog.save(ctx.sagaId, step.name, 'DONE'); // persist progress to resume after a crash
    } catch (err) {
      for (const s of done.reverse()) {
        await s.compensate(ctx); // must be idempotent and retried until it succeeds
      }
      throw new SagaFailed(step.name, err);
    }
  }
}`},{type:`heading3`,text:`Choreography example`},{type:`code`,lang:`text`,code:`Orders     -- OrderCreated -->     Payments
Payments   -- PaymentCompleted --> Inventory
Inventory  -- StockReserved -->    Orders (mark CONFIRMED)

Failure:
Inventory  -- StockFailed -->      Payments (refund) and Orders (cancel)`},{type:`bullets`,items:[`**Choreography:** no central coordinator, loosely coupled; but the flow is implicit and hard to follow as steps grow; risk of cyclic dependencies.`,`**Orchestration:** the flow is explicit in one place, easier to monitor and change; the orchestrator is extra infrastructure. Tools: Temporal, AWS Step Functions, Camunda, or a custom state machine.`,`Compensations are **semantic undo**, not rollback — an email already sent can only be followed by a "sorry, cancelled" email.`,`Every step and compensation must be **idempotent** because messages can be redelivered.`,`Publish events reliably with the **transactional outbox** pattern.`,`No isolation: other requests may see intermediate states (e.g. order PENDING) — design for that.`]},{type:`callout`,variant:`tip`,text:`Interview tip: walk through a concrete failure (stock unavailable after payment) and the compensations, then compare choreography vs orchestration with when you'd pick each — a few steps and teams: choreography; complex flows: orchestration.`}]},"distributed-transactions":{summary:`Avoid classic distributed ACID transactions (two-phase commit) because they block, couple services and scale poorly. Instead accept eventual consistency and use: sagas with compensating actions for multi-step business processes, the transactional outbox to atomically save data and publish events, idempotent consumers with retries and dead-letter queues, and — best of all — service boundaries designed so that most transactions stay inside one service.`,details:[{type:`heading3`,text:`Why not two-phase commit (2PC)?`},{type:`bullets`,items:[`A coordinator asks all participants to "prepare", then "commit". Participants hold locks until the coordinator decides — if it crashes, resources stay locked.`,`Requires every database/broker to support XA; many (Kafka, most NoSQL, SaaS APIs) don't.`,`Availability drops: one slow participant blocks everyone. It contradicts service autonomy.`]},{type:`heading3`,text:`The toolkit`},{type:`numbered`,items:[`**Rethink boundaries** — if two services always need to change together atomically, they may belong in one service.`,`**Saga** — sequence of local transactions with compensations (orchestrated or choreographed).`,`**Transactional outbox** — write the business change and the event in the same local DB transaction; a relay publishes the event later. No "saved to DB but event lost" bugs.`,`**Idempotent consumers** — at-least-once delivery means duplicates; deduplicate by message ID or use natural idempotency keys.`,`**Retries + dead-letter queues** — transient failures retry with backoff; poison messages go to a DLQ for inspection.`,`**Reconciliation jobs** — periodic checks that detect and fix drift (e.g. payments without orders).`]},{type:`heading3`,text:`Transactional outbox in Node + Postgres`},{type:`code`,lang:`typescript`,code:`// 1. Business write + event in ONE local transaction
await db.tx(async (t) => {
  await t.none('INSERT INTO orders (id, user_id, total, status) VALUES ($1, $2, $3, $4)',
    [order.id, order.userId, order.total, 'PENDING']);
  await t.none('INSERT INTO outbox (id, topic, payload) VALUES ($1, $2, $3)',
    [randomUUID(), 'orders.events', { type: 'OrderPlaced', orderId: order.id, total: order.total }]);
});

// 2. Relay: publish unsent outbox rows (polling, or CDC with Debezium)
setInterval(async () => {
  await db.tx(async (t) => {
    const rows = await t.any(
      'SELECT * FROM outbox WHERE sent_at IS NULL ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED');
    for (const row of rows) {
      await producer.send({ topic: row.topic, messages: [{ key: row.id, value: JSON.stringify(row.payload) }] });
      await t.none('UPDATE outbox SET sent_at = now() WHERE id = $1', [row.id]);
    }
  });
}, 1000);

// 3. Consumer: idempotent by message id
async function handle(msg) {
  const inserted = await db.result(
    'INSERT INTO processed_messages (id) VALUES ($1) ON CONFLICT DO NOTHING', [msg.key]);
  if (inserted.rowCount === 0) return; // duplicate \u2014 already handled
  await reserveStock(JSON.parse(msg.value));
}`},{type:`flow`,title:`Outbox: reliable publish without 2PC`,code:`flowchart LR
  API[Orders API]:::server -->|"one local tx"| DB[("orders + outbox")]:::db
  DB --> R["Relay / CDC<br/>(Debezium)"]:::server
  R --> K[[Kafka]]:::queue
  K --> C["Inventory consumer<br/>idempotent"]:::server
  C -->|failures| DLQ[[Dead-letter queue]]:::queue`},{type:`bullets`,items:[`Ideally the dedup insert and the business change in the consumer happen in the same local transaction.`,`Communicate eventual consistency in the UX: "Order received — confirming payment".`,"Use idempotency keys on external APIs (e.g. Stripe's `Idempotency-Key` header) so retries never double-charge."]},{type:`callout`,variant:`tip`,text:`Interview tip: the strongest answer names the **dual-write problem** (DB commit succeeds, publish fails) and solves it with the outbox, then pairs it with sagas and idempotency. Saying "we use 2PC" usually raises a red flag.`}]},"strangler-fig-migration":{summary:`The Strangler Fig pattern migrates a monolith incrementally instead of rewriting it. You put a routing layer (proxy or API gateway) in front of the monolith, build new functionality or extract one capability at a time into a new service, and switch routes for that capability to the new service. Over time the monolith shrinks until it can be retired — while the system stays in production the whole way.`,details:[{type:`paragraph`,text:`The name comes from strangler fig trees, which grow around a host tree until they replace it. The point is to avoid a risky "big bang" rewrite: each step is small, delivers value, and can be rolled back by flipping the route back.`},{type:`flow`,title:`Migration stages`,code:`flowchart LR
  C[Clients]:::client --> F["Facade / API gateway"]:::network
  F -->|"/api/catalog (new)"| S1[Catalog service]:::highlight
  F -->|"/api/payments (new)"| S2[Payments service]:::highlight
  F -->|"everything else"| M["Legacy monolith<br/>(shrinking)"]:::external
  S1 --> D1[("Catalog DB")]:::db
  M --> MD[("Monolith DB")]:::db`},{type:`heading3`,text:`Step by step`},{type:`numbered`,items:[`**Add a facade** (Nginx, API gateway, or a thin Node proxy) in front of the monolith, routing 100% of traffic to it — no behaviour change.`,`**Pick a seam** — a well-bounded capability with clear value and few dependencies (e.g. notifications, catalog, search).`,`**Build the new service**, often with an anti-corruption layer that translates between the legacy model and the new domain model.`,`**Migrate data** — the new service gets its own database; sync via CDC or dual-write during transition, then make it the source of truth.`,`**Shift traffic gradually** — feature flag or canary (e.g. 5% → 50% → 100%), compare results, monitor.`,`**Remove the old code** from the monolith. Repeat for the next capability.`]},{type:`code`,lang:`javascript`,code:`// A Node facade routing by path and feature flag
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const monolith = createProxyMiddleware({ target: 'http://legacy-app:8080', changeOrigin: true });
const catalog = createProxyMiddleware({ target: 'http://catalog-svc:3000', changeOrigin: true });

app.use('/api/products', (req, res, next) => {
  // Canary: send 10% of users to the new service
  const inCanary = hash(req.headers['x-user-id'] ?? req.ip) % 100 < 10;
  return inCanary ? catalog(req, res, next) : monolith(req, res, next);
});

app.use('/', monolith); // everything not yet migrated
app.listen(80);`},{type:`bullets`,items:[`**Benefits:** low risk, continuous delivery of value, easy rollback, learning as you go.`,`**Challenges:** shared database coupling (the hardest part), keeping data in sync during transition, the facade becoming a bottleneck, and long-running "half migrated" states — set a plan to finish.`,`Start with edges that change often or need to scale independently; leave stable, tangled core logic for later (or forever).`,`Branch by Abstraction is the in-code counterpart: introduce an interface inside the monolith, then swap the implementation to call the new service.`]},{type:`callout`,variant:`warning`,text:`Common pitfall: extracting the service but leaving it reading the monolith's tables. That creates a distributed monolith. Plan data ownership for each extracted capability up front.`}]}};export{e as answers};