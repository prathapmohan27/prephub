var e={"common-design-patterns-in-node-js":{summary:`Design patterns are proven, reusable solutions to recurring design problems — a shared vocabulary rather than code to copy. In Node.js the most common are Module/Singleton (via the module cache), Factory, Observer (EventEmitter), Middleware/Chain of Responsibility (Express), Dependency Injection, Repository, Strategy, Adapter, Decorator, and Streams/Pipeline.`,details:[{type:`paragraph`,text:"Patterns are grouped as **creational** (how objects are created), **structural** (how they are composed) and **behavioural** (how they communicate). Node's module system, event loop and first-class functions make some patterns almost built in — for example `require`/`import` caching gives you singletons for free."},{type:`heading3`,text:`Patterns you see in everyday Node code`},{type:`bullets`,items:["**Module / Singleton** — a module is evaluated once and cached, so `export const db = new Pool()` is shared by every importer.","**Factory** — a function that builds configured objects: `createLogger({ level })`, `express()`.",'**Observer** — `EventEmitter`, streams, `process.on("SIGTERM")`.',"**Middleware / Chain of Responsibility** — Express/Koa `(req, res, next)` pipelines.",`**Dependency Injection** — NestJS, InversifyJS, or simply passing dependencies to constructors.`,`**Repository** — isolate data access behind an interface.`,`**Strategy** — swap algorithms at runtime (payment providers, Passport auth strategies).`,"**Adapter** — wrap a third-party API in your own interface (e.g. a `StorageAdapter` for S3 or local disk).",`**Decorator / Proxy** — add caching, retries or logging around an existing function.`]},{type:`heading3`,text:`Examples: Singleton, Factory and Strategy`},{type:`code`,lang:`typescript`,code:`// Singleton via module cache \u2014 every import gets the same pool
// db.ts
import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Factory \u2014 hides construction details
export function createNotifier(channel: 'email' | 'sms'): Notifier {
  switch (channel) {
    case 'email': return new EmailNotifier(process.env.SMTP_URL!);
    case 'sms':   return new SmsNotifier(process.env.TWILIO_KEY!);
  }
}

// Strategy \u2014 pick the algorithm at runtime
interface PricingStrategy { price(base: number): number }
const strategies: Record<string, PricingStrategy> = {
  regular: { price: (b) => b },
  premium: { price: (b) => b * 0.8 },
  blackFriday: { price: (b) => b * 0.5 },
};
const total = strategies[user.tier].price(100); // no if/else chain`},{type:`heading3`,text:`Example: Middleware (Chain of Responsibility)`},{type:`code`,lang:`javascript`,code:`app.use(requestId);          // each handler does one job...
app.use(authenticate);       // ...and either calls next() or ends the chain
app.use(rateLimit);
app.get('/orders', listOrders);

function authenticate(req, res, next) {
  if (!req.headers.authorization) return res.status(401).end(); // stop chain
  req.user = verify(req.headers.authorization);
  next();                                                       // pass along
}`},{type:`callout`,variant:`tip`,text:`Interview tip: tie each pattern to a real problem you solved \u2014 "we used Strategy for payment providers so adding Stripe didn't touch checkout logic". Avoid forcing Java-style patterns where a plain function or module would do.`}]},"observer-pattern":{summary:'The Observer pattern lets a subject notify any number of subscribers when something happens, without knowing who they are. In Node.js it is built in as `EventEmitter`: objects `emit("event", data)` and listeners register with `on()` / `once()`. Streams, HTTP servers, `process` and sockets are all EventEmitters.',details:[{type:`paragraph`,text:`The benefit is **loose coupling**: the order service just says "order created"; email, analytics and inventory each subscribe independently. Adding a new reaction does not change the emitter.`},{type:`heading3`,text:`Using EventEmitter`},{type:`code`,lang:`typescript`,code:`import { EventEmitter } from 'node:events';

class OrderService extends EventEmitter {
  async create(order: Order) {
    const saved = await repo.save(order);
    this.emit('order:created', saved);   // notify \u2014 doesn't know who listens
    return saved;
  }
}

const orders = new OrderService();

orders.on('order:created', (o) => mailer.sendConfirmation(o));
orders.on('order:created', (o) => analytics.track('purchase', o.total));
orders.once('order:created', () => console.log('first order today!'));

// Errors: an 'error' event with no listener THROWS and can crash the process
orders.on('error', (err) => logger.error(err));`},{type:`heading3`,text:`How it works — a minimal implementation`},{type:`code`,lang:`typescript`,code:`class MiniEmitter {
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  on(event: string, fn: (...args: any[]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)!.delete(fn); // unsubscribe
  }

  emit(event: string, ...args: any[]) {
    for (const fn of this.listeners.get(event) ?? []) fn(...args); // synchronous
    return this.listeners.has(event);
  }
}`},{type:`flow`,title:`One event, many independent observers`,code:`flowchart LR
  S["OrderService<br/>emit('order:created')"]:::server --> E1[Email listener]:::external
  S --> E2[Analytics listener]:::external
  S --> E3[Inventory listener]:::external`},{type:`heading3`,text:`Things to know`},{type:`bullets`,items:["**`emit` is synchronous** — listeners run immediately, in registration order, on the same tick. A slow listener blocks the emitter; async listeners' rejections are not caught by `emit` (you can opt in with `captureRejections`).","**Memory leaks** — forgetting `off()`/`removeListener()` keeps objects alive; Node warns after 10 listeners per event (`MaxListenersExceededWarning`).",'`await once(emitter, "ready")` and `for await (const [e] of on(emitter, "data"))` from `node:events` bridge events and promises.',`In-process only: for observers in other services, use a message broker (Kafka, RabbitMQ, Redis pub/sub) — the same idea at system level.`]},{type:`callout`,variant:`warning`,text:"Common pitfall: emitting `error` with no `error` listener. Node throws it as an uncaught exception and the process crashes. Always attach an error handler to emitters and streams."}]},"dependency-injection":{summary:`Dependency Injection means a component receives its dependencies (DB repository, logger, HTTP client) from outside instead of creating or importing them itself. It decouples code from concrete implementations, making it easy to swap them and to test with fakes. In Node you can do it manually with constructor/function parameters and a composition root, or use a container such as NestJS, InversifyJS, tsyringe or Awilix.`,details:[{type:`paragraph`,text:'Without DI, a service that does `import { db } from "./db"` is welded to that database — to test it you must mock the module. With DI, the service just declares "I need something with `findById`", and whoever builds it decides what to pass.'},{type:`heading3`,text:`Before and after`},{type:`code`,lang:`typescript`,code:`// \u274C Hard-wired: creates its own dependencies
class UserService {
  private repo = new PostgresUserRepo();
  private mailer = new SendgridMailer();
}

// \u2705 Injected via constructor
interface UserRepo { findByEmail(e: string): Promise<User | null>; create(u: NewUser): Promise<User> }
interface Mailer { sendWelcome(to: string): Promise<void> }

class UserService {
  constructor(private repo: UserRepo, private mailer: Mailer) {}
  async register(email: string) {
    const user = await this.repo.create({ email });
    await this.mailer.sendWelcome(email);
    return user;
  }
}

// Composition root (main.ts) \u2014 the ONE place that wires real implementations
const service = new UserService(new PostgresUserRepo(pool), new SendgridMailer(key));

// Test \u2014 wire fakes instead
const svc = new UserService(new InMemoryUserRepo(), { sendWelcome: jest.fn() });`},{type:`heading3`,text:`With a container: NestJS`},{type:`code`,lang:`typescript`,code:`@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    @Inject('MAILER') private readonly mailer: Mailer, // token for an interface
  ) {}
}

@Module({
  providers: [
    UsersService,
    UsersRepository,
    { provide: 'MAILER', useClass: SendgridMailer }, // swap here, e.g. useClass: FakeMailer in tests
  ],
})
export class UsersModule {}`},{type:`bullets`,items:[`**Benefits:** testability, swapping implementations (Postgres → Mongo, SES → SendGrid), clear dependency graphs, single place to configure lifetimes (singleton vs per-request scope).`,"**Manual DI** is often enough for small Express apps — functions taking a `deps` object work well.",`**Containers** (NestJS, InversifyJS, tsyringe, Awilix) resolve dependency graphs automatically; TypeScript interfaces vanish at runtime, so they use classes or tokens.`,`DI is the practical way to follow the **Dependency Inversion Principle** (the D in SOLID): depend on abstractions, not concretions.`]},{type:`callout`,variant:`tip`,text:`Interview tip: explain the "composition root" — dependencies are wired in one place at startup — and show how DI made a test simple. That shows practical understanding, not just framework usage.`}]},"repository-pattern":{summary:"The Repository pattern puts a collection-like interface — `findById`, `findByEmail`, `save`, `delete` — between your business logic and the data store. Services talk to the repository in domain terms and never see SQL, ORM calls or database details, so storage can change and business logic can be tested with an in-memory fake.",details:[{type:`paragraph`,text:`Without it, queries get scattered through route handlers and services, mixing "what the business wants" with "how Postgres stores it". A repository centralizes data access per aggregate or entity, so query logic lives in one place.`},{type:`code`,lang:`typescript`,code:`// Domain contract \u2014 no database types leak out
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomer(customerId: string, opts?: { limit: number }): Promise<Order[]>;
  save(order: Order): Promise<void>;
}

// Postgres implementation
export class PgOrderRepository implements OrderRepository {
  constructor(private pool: Pool) {}

  async findById(id: string) {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return rows[0] ? toDomain(rows[0]) : null; // map DB row -> domain object
  }

  async findByCustomer(customerId: string, { limit } = { limit: 20 }) {
    const { rows } = await this.pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2',
      [customerId, limit],
    );
    return rows.map(toDomain);
  }

  async save(order: Order) {
    await this.pool.query(
      \`INSERT INTO orders (id, customer_id, status, total) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, total = EXCLUDED.total\`,
      [order.id, order.customerId, order.status, order.total],
    );
  }
}

// In-memory implementation for unit tests
export class InMemoryOrderRepository implements OrderRepository {
  private orders = new Map<string, Order>();
  async findById(id: string) { return this.orders.get(id) ?? null; }
  async findByCustomer(c: string) { return [...this.orders.values()].filter((o) => o.customerId === c); }
  async save(o: Order) { this.orders.set(o.id, o); }
}`},{type:`code`,lang:`typescript`,code:`// Service depends on the interface only
class OrderService {
  constructor(private orders: OrderRepository) {}

  async cancel(id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundError('Order');
    order.cancel();               // business rule lives in the domain
    await this.orders.save(order);
  }
}`},{type:`flow`,title:`Layers`,code:`flowchart LR
  C[Controller / route]:::client --> S[Service<br/>business rules]:::server
  S --> I{{"OrderRepository<br/>interface"}}:::highlight
  I --> PG[PgOrderRepository]:::server
  I --> MEM["InMemoryOrderRepository<br/>(tests)"]:::external
  PG --> DB[("PostgreSQL")]:::db`},{type:`bullets`,items:["Expose intention-revealing methods (`findActiveByCustomer`) rather than a generic `query(sql)` that leaks the database back out.",`Transactions spanning several repositories are usually coordinated with a **Unit of Work** (or by passing a transaction handle).`,`With an ORM (Prisma, TypeORM), the repository still adds value as a domain boundary — but avoid a pointless wrapper that just forwards every call.`,`Trade-off: extra abstraction. For a tiny CRUD service it can be overkill.`]},{type:`callout`,variant:`tip`,text:`Interview tip: the two benefits to name are **testability** (in-memory repo) and **separation of concerns** (no SQL in business logic). Mention that it pairs naturally with Dependency Injection.`}]},cqrs:{summary:"CQRS separates the write side (commands that change state, like `PlaceOrder`) from the read side (queries that return data, like `GetOrderHistory`), often with different models and even different databases. Writes go through a model focused on business rules and consistency; reads come from denormalized views optimized for each screen. It helps when read and write workloads or shapes differ a lot, at the cost of complexity and eventual consistency.",details:[{type:`paragraph`,text:"In a classic CRUD app the same model serves both: you validate and save an `Order`, and the dashboard query joins six tables over that same schema. As systems grow, writes need strict rules while reads need fast, flattened data. CQRS gives each side its own model so they can evolve and scale independently."},{type:`heading3`,text:`Levels of CQRS`},{type:`bullets`,items:[`**Light:** separate command and query handlers/classes over the same database. Low cost, clearer code.`,`**Full:** a write database (normalized, transactional) plus read stores (Elasticsearch, Redis, denormalized tables) updated asynchronously from events.`,`Often combined with **Event Sourcing**, but neither requires the other.`]},{type:`code`,lang:`typescript`,code:`// ---- Command side: enforce rules, change state, emit an event ----
class PlaceOrderHandler {
  constructor(private orders: OrderRepository, private bus: EventBus) {}

  async execute(cmd: { customerId: string; items: Item[] }) {
    const order = Order.place(cmd.customerId, cmd.items); // validates invariants
    await this.orders.save(order);
    await this.bus.publish({ type: 'OrderPlaced', orderId: order.id, total: order.total, customerId: cmd.customerId });
    return order.id; // commands return little or nothing
  }
}

// ---- Projection: keep the read model up to date ----
bus.subscribe('OrderPlaced', async (e) => {
  await readDb.query(
    'INSERT INTO customer_order_summary (customer_id, order_count, lifetime_value) VALUES ($1, 1, $2) ' +
    'ON CONFLICT (customer_id) DO UPDATE SET order_count = customer_order_summary.order_count + 1, ' +
    'lifetime_value = customer_order_summary.lifetime_value + $2',
    [e.customerId, e.total],
  );
});

// ---- Query side: no business rules, just fast reads ----
class GetCustomerSummaryHandler {
  async execute(customerId: string) {
    const { rows } = await readDb.query('SELECT * FROM customer_order_summary WHERE customer_id = $1', [customerId]);
    return rows[0]; // already shaped for the UI \u2014 no joins
  }
}`},{type:`flow`,title:`CQRS with separate read model`,code:`flowchart LR
  UI[Client]:::client -->|"Command: PlaceOrder"| CH[Command handler]:::server
  CH --> WDB[("Write DB")]:::db
  CH -->|OrderPlaced| BUS[[Event bus]]:::queue
  BUS --> PR[Projector]:::server
  PR --> RDB[("Read DB / view")]:::cache
  UI -->|"Query: GetSummary"| QH[Query handler]:::server
  QH --> RDB`},{type:`bullets`,items:[`**Good fit:** read-heavy systems, complex domains, very different read/write shapes, need to scale reads separately, many specialized views (search, dashboards).`,`**Costs:** more moving parts, **eventual consistency** (the user may not see their write instantly — handle with optimistic UI or reading your own write from the write side), projection rebuilds, duplicate data.`,`Not a fit for simple CRUD — it is often over-engineering there.`,"NestJS has a `@nestjs/cqrs` module with `CommandBus`, `QueryBus` and `EventBus`."]},{type:`callout`,variant:`warning`,text:`Common pitfall: applying full CQRS everywhere. Use it per bounded context where the read/write asymmetry is real, and be ready to explain how you handle eventual consistency in the UI.`}]},"event-sourcing":{summary:"Event Sourcing stores the full history of changes as an append-only sequence of immutable events (`AccountOpened`, `MoneyDeposited`, `MoneyWithdrawn`) instead of only the current state. Current state is derived by replaying events. You get a complete audit trail, the ability to rebuild state at any point in time and to create new read models later — at the cost of complexity around schema evolution, snapshots and eventual consistency.",details:[{type:`paragraph`,text:`A normal table row says "balance = 70" and the history is lost. An event-sourced account stores *why* it is 70. Think of a bank ledger or a git log: the history is the source of truth, and the "current state" is a calculated view.`},{type:`code`,lang:`typescript`,code:`type AccountEvent =
  | { type: 'AccountOpened'; accountId: string; owner: string }
  | { type: 'MoneyDeposited'; amount: number }
  | { type: 'MoneyWithdrawn'; amount: number };

// Rebuild state by folding over events
function apply(state: Account, e: AccountEvent): Account {
  switch (e.type) {
    case 'AccountOpened':  return { id: e.accountId, owner: e.owner, balance: 0 };
    case 'MoneyDeposited': return { ...state, balance: state.balance + e.amount };
    case 'MoneyWithdrawn': return { ...state, balance: state.balance - e.amount };
  }
}

async function withdraw(accountId: string, amount: number) {
  const { events, version } = await eventStore.load(accountId);
  const account = events.reduce(apply, {} as Account);       // replay

  if (account.balance < amount) throw new Error('Insufficient funds'); // rule

  // Append with optimistic concurrency: fails if someone appended meanwhile
  await eventStore.append(accountId, [{ type: 'MoneyWithdrawn', amount }], version);
}

// Stream for account 42:
// 1 AccountOpened  { owner: 'Asha' }   balance 0
// 2 MoneyDeposited { amount: 100 }     balance 100
// 3 MoneyWithdrawn { amount: 30 }      balance 70  <- derived, never stored`},{type:`code`,lang:`sql`,code:`-- A simple event store in Postgres
CREATE TABLE events (
  stream_id   TEXT        NOT NULL,
  version     INT         NOT NULL,
  type        TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (stream_id, version)   -- duplicate version = concurrency conflict
);`},{type:`flow`,title:`Write events, project read models`,code:`flowchart LR
  C["Command: Withdraw 30"]:::client --> A["Aggregate<br/>replay + validate"]:::server
  A -->|append| ES[("Event store<br/>append-only")]:::db
  ES --> P1["Projection:<br/>balances table"]:::cache
  ES --> P2["Projection:<br/>fraud analytics"]:::cache
  ES --> P3["Projection:<br/>monthly statements"]:::cache`},{type:`heading3`,text:`Benefits and costs`},{type:`bullets`,items:[`**Benefits:** full audit log (finance, healthcare, compliance), time travel/debugging ("what was the state on March 3rd?"), new projections built later by replaying history, natural fit for event-driven integration.`,`**Snapshots:** long streams are slow to replay, so periodically store a snapshot and replay only newer events.`,`**Schema evolution:** events are immutable forever — use versioned event types and "upcasters" to read old shapes.`,"**Corrections** are new compensating events (`MoneyRefunded`), never edits or deletes. GDPR erasure needs care (e.g. crypto-shredding).",`Usually paired with **CQRS** because querying raw event streams is impractical.`,`Tools: EventStoreDB, Kafka (as a log, with care), or a Postgres table as above.`]},{type:`callout`,variant:`tip`,text:`Interview tip: say where you would and would not use it. "Great for a ledger or order lifecycle with audit needs; overkill for a user-profile CRUD service." Mentioning snapshots and event versioning shows real-world depth.`}]}};export{e as answers};