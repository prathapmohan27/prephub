// Low-level design & OOP: principles, patterns as refactoring exercises, and full LLD
// interview walkthroughs with class diagrams. Examples are TypeScript/Node.
import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'approaching-a-low-level-design-interview': {
    summary:
      'I treat it as a structured conversation, not a race to code: I clarify requirements and scope, list the core entities and use cases, define interfaces before classes, then walk one real use case through the design and show how it extends. Interviewers are scoring how I model the domain, where I put responsibilities, whether the design survives a new requirement, and whether I think about concurrency, errors and testing, far more than how many classes I draw.',
    details: [
      {
        type: 'paragraph',
        text: 'A low-level design (LLD) round, also called machine coding or object-oriented design, asks you to design and often partly implement something like a parking lot, an elevator controller, a rate limiter library, a notification service or a splitwise-style expense tracker. The problem is deliberately vague. What is being tested is your process.',
      },
      { type: 'heading3', text: 'A step-by-step framework' },
      {
        type: 'numbered',
        items: [
          '**Clarify requirements and scope (5 min).** Ask what must work, what is out of scope and what will change. "Multiple floors? Vehicle sizes? Payments in scope? Is this single-process or shared across instances?" Write the agreed list down and refer back to it.',
          '**Identify entities and use cases (5 min).** Nouns become candidate entities (`ParkingLot`, `Level`, `Spot`, `Ticket`), verbs become use cases (`park`, `unpark`, `pay`). Drop nouns that carry no behaviour or data.',
          '**Define interfaces first (5–10 min).** Write the public API the caller sees, then the key abstractions behind it (`SpotAllocationStrategy`, `PricingPolicy`, `PaymentGateway`). Interfaces force you to decide responsibilities before implementation detail.',
          '**Class relationships (5 min).** Composition vs inheritance, who owns whom, one-to-many relations, and where state lives. Keep it to the classes you need for the agreed scope.',
          '**Walk a use case end to end (5–10 min).** "A car arrives": show the call sequence through your objects. This is where missing responsibilities and wrong ownership become obvious.',
          '**Extensibility (5 min).** Apply one realistic new requirement ("add EV charging spots", "hourly plus flat weekend pricing") and show which class changes and which do not.',
          '**Concurrency, errors and edge cases (5 min).** Two cars taking the last spot at the same time, a failed payment, a lost ticket. Say where locking or atomic operations live.',
          '**Testing (2–3 min).** Which units you would test in isolation and which seams (interfaces) make that possible.',
        ],
      },
      {
        type: 'heading3',
        text: 'Interfaces before classes: a short example',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Public API the caller sees
interface ParkingService {
  park(vehicle: Vehicle): Ticket;          // throws NoSpotAvailableError
  unpark(ticketId: string): Receipt;
}

// Variation points I expect to change, hidden behind interfaces
interface SpotAllocationStrategy {
  findSpot(levels: Level[], vehicle: Vehicle): Spot | undefined;
}

interface PricingPolicy {
  priceFor(ticket: Ticket, exitTime: Date): Money;
}

// Concrete pieces are swappable without touching ParkingService
class NearestToEntranceStrategy implements SpotAllocationStrategy { /* ... */ }
class HourlyPricing implements PricingPolicy { /* ... */ }`,
      },
      {
        type: 'paragraph',
        text: 'Saying out loud "allocation and pricing are the things most likely to change, so they get their own interfaces (Strategy pattern)" is exactly the kind of reasoning interviewers write down.',
      },
      { type: 'heading3', text: 'What interviewers score' },
      {
        type: 'bullets',
        items: [
          '**Requirement handling:** did you ask the questions that change the design, and stay inside the agreed scope?',
          '**Domain modelling:** sensible entities with behaviour, not anaemic data bags plus one god-service.',
          '**Responsibility assignment:** each class has one reason to change; logic sits next to the data it needs.',
          '**Extensibility:** a new requirement touches few classes; variation points are behind interfaces.',
          '**Code quality (if you implement):** clear names, small methods, explicit errors, no hidden global state.',
          '**Concurrency and failure awareness:** you notice shared mutable state and say how you protect it.',
          '**Communication:** you narrate trade-offs and accept hints instead of defending the first draft.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'If the round includes coding, implement the happy path of one use case fully and stub the rest behind interfaces. A working, well-structured slice beats a half-finished full design.',
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How would this change if it ran on several servers? — State moves to a database or Redis; allocation needs an atomic operation or a lock.',
          'Add a new vehicle type or pricing rule: what changes? — Ideally one new class implementing an existing interface.',
          'Where would you put validation? — At the boundary (input) and as invariants inside the entity that owns the state.',
          'How would you test the allocation logic? — Pure strategy class, tested with plain objects, no I/O.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Starting to code or draw class diagrams before agreeing on requirements.',
          'Modelling every noun as a class, including ones with no behaviour.',
          'Building deep inheritance trees (`Car extends Vehicle extends Asset`) instead of composing behaviour.',
          'Applying every design pattern you know; patterns should answer a stated variation point.',
          'Ignoring concurrency until the interviewer asks.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you drive the session with a visible process, identify the likely variation points from the requirements and put only those behind interfaces, walk a concrete use case to validate the design, and raise concurrency, failure and testability yourself.',
      },
    ],
  },

  'solid-with-typescript-examples': {
    summary:
      'SOLID is five guidelines for code that is easy to change: Single responsibility, Open/closed, Liskov substitution, Interface segregation and Dependency inversion. In Node services the one I see broken most is single responsibility: a `UserService` or route handler that validates input, runs SQL, sends email and formats responses, so every change touches it and nothing is testable in isolation. I apply SOLID where code actually changes, not as a checklist for every class.',
    details: [
      {
        type: 'paragraph',
        text: 'The Angular Architecture topic maps SOLID to components and services. Here the focus is backend code, where the same principles decide whether a service stays maintainable as it grows.',
      },
      { type: 'heading3', text: 'S — Single responsibility' },
      {
        type: 'paragraph',
        text: 'A module should have one reason to change, meaning one actor or concern it answers to.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: one class answers to the API team, the DBA and marketing
class UserService {
  async register(body: any) {
    if (!body.email?.includes('@')) throw new Error('bad email');   // validation
    const hash = await bcrypt.hash(body.password, 12);               // security
    await db.query('INSERT INTO users ...', [body.email, hash]);     // persistence
    await mailer.send(body.email, '<h1>Welcome!</h1>');              // messaging + copy
    return { id: '...', email: body.email };                         // presentation
  }
}

// After: each concern has a home; the use case orchestrates
class RegisterUser {
  constructor(
    private users: UserRepository,
    private hasher: PasswordHasher,
    private events: EventPublisher,
  ) {}

  async execute(input: RegisterInput): Promise<User> {   // input already validated at the edge
    const user = User.create(input.email, await this.hasher.hash(input.password));
    await this.users.save(user);
    await this.events.publish({ type: 'UserRegistered', userId: user.id });
    return user;
  }
}
// The welcome email is a subscriber to UserRegistered, owned by whoever owns the copy.`,
      },
      { type: 'heading3', text: 'O — Open/closed' },
      {
        type: 'paragraph',
        text: 'Open for extension, closed for modification: adding a variant should mean adding code, not editing a growing `switch`.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: every new channel edits this function
function notify(channel: string, msg: Message) {
  if (channel === 'email') { /* ... */ }
  else if (channel === 'sms') { /* ... */ }
  else if (channel === 'push') { /* ... */ }
}

// After: new channels are new classes, registered once
interface Notifier { readonly channel: string; send(msg: Message): Promise<void>; }

class NotificationDispatcher {
  private byChannel = new Map<string, Notifier>();
  constructor(notifiers: Notifier[]) {
    notifiers.forEach((n) => this.byChannel.set(n.channel, n));
  }
  send(channel: string, msg: Message) {
    const notifier = this.byChannel.get(channel);
    if (!notifier) throw new UnknownChannelError(channel);
    return notifier.send(msg);
  }
}`,
      },
      { type: 'heading3', text: 'L — Liskov substitution' },
      {
        type: 'paragraph',
        text: 'A subtype must be usable anywhere its base type is expected without surprising the caller: no stronger preconditions, no weaker guarantees, no "not supported" exceptions.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface FileStorage {
  read(key: string): Promise<Buffer>;
  write(key: string, data: Buffer): Promise<void>;
}

// Violation: callers that write now crash at runtime
class ReadOnlyCdnStorage implements FileStorage {
  read(key: string) { /* ... */ }
  write(): Promise<void> { throw new Error('not supported'); }
}

// Fix: split the contract so the type tells the truth
interface FileReader { read(key: string): Promise<Buffer>; }
interface FileWriter { write(key: string, data: Buffer): Promise<void>; }`,
      },
      { type: 'heading3', text: 'I — Interface segregation' },
      {
        type: 'paragraph',
        text: 'Clients should not depend on methods they do not use. The `FileReader`/`FileWriter` split above is also interface segregation: a thumbnail job that only reads does not need a fake `write` in its tests. In TypeScript, small role interfaces cost nothing because typing is structural, so a single class can satisfy several of them.',
      },
      { type: 'heading3', text: 'D — Dependency inversion' },
      {
        type: 'paragraph',
        text: 'High-level policy (use cases) should depend on abstractions it owns, and low-level details (Postgres, S3, SendGrid) implement them. `RegisterUser` above depends on `UserRepository`, not on `pg`. The wiring happens in one composition root or a DI container such as NestJS (see the Design Patterns topic for DI mechanics).',
      },
      { type: 'heading3', text: 'When not to apply them' },
      {
        type: 'bullets',
        items: [
          'A 40-line script or a CRUD endpoint with no business rules does not need ports, adapters and five interfaces.',
          'Do not add an interface with exactly one implementation "just in case" unless it is a seam you need for testing or a known variation point.',
          'Open/closed is about the places that actually vary. Predicting variation everywhere produces speculative abstraction that is harder to change than the original `switch`.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you decide a class has too many responsibilities? — Count reasons to change and actors it serves; watch for unrelated imports and huge test setup.',
          'Give a real Liskov violation you have seen. — Subclasses throwing "not implemented", or overriding a method to silently do nothing.',
          'Is dependency inversion the same as dependency injection? — No: inversion is about who owns the abstraction; injection is one way to supply the implementation.',
          'How does SOLID apply to functions rather than classes? — Same ideas: small single-purpose functions, pass dependencies as parameters, depend on function types.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Reciting the acronym without a before/after example.',
          'Confusing single responsibility with "one method per class".',
          'Creating an `IUserService` interface for every class with one implementation and calling it dependency inversion.',
          'Letting the abstraction leak details (`UserRepository.runSql()`), which defeats the inversion.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you show a concrete smell and the refactor that fixes it, name which principle you see broken most and why, and say clearly where you would not apply SOLID because the extra abstraction costs more than it saves.',
      },
    ],
  },

  'composition-vs-inheritance': {
    summary:
      'I default to composition: an object gets behaviour by holding collaborators behind interfaces, which can be combined and swapped at runtime. Inheritance is right when there is a true, stable "is-a" relationship and the subclass honours the whole base contract, typically a small framework base class or a closed set of variants. To untangle a deep hierarchy I extract the varying behaviours into strategy objects, move shared code into helpers, and flatten the tree step by step behind tests.',
    details: [
      { type: 'heading3', text: 'Why deep hierarchies hurt' },
      {
        type: 'bullets',
        items: [
          '**Fragile base class:** a change in the base silently changes every subclass.',
          '**Combinatorial explosion:** `EmailNotifier`, `RetryingEmailNotifier`, `LoggedRetryingEmailNotifier`... every new capability multiplies classes.',
          '**Tight coupling to internals:** subclasses rely on protected fields and the order the base calls hooks.',
          '**Single axis only:** a class can inherit from one parent, but real behaviour varies on several axes at once.',
        ],
      },
      { type: 'heading3', text: 'Before: inheritance used for code reuse' },
      {
        type: 'code',
        lang: 'typescript',
        code: `class ReportExporter {
  export(data: Row[]) {
    const rows = this.filter(data);
    const content = this.format(rows);
    return this.deliver(content);
  }
  protected filter(d: Row[]) { return d; }
  protected format(_: Row[]): string { throw new Error('abstract'); }
  protected deliver(_: string): Promise<void> { throw new Error('abstract'); }
}

class CsvExporter extends ReportExporter { /* format as CSV, deliver by email */ }
class CsvS3Exporter extends CsvExporter { /* override deliver to upload to S3 */ }
class FilteredCsvS3Exporter extends CsvS3Exporter { /* override filter */ }
class PdfS3Exporter extends ReportExporter { /* duplicates S3 delivery from CsvS3Exporter */ }`,
      },
      { type: 'heading3', text: 'After: compose independent behaviours' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface RowFilter { apply(rows: Row[]): Row[]; }
interface Formatter { format(rows: Row[]): string; }
interface Delivery { deliver(content: string): Promise<void>; }

class ReportExporter {
  constructor(
    private formatter: Formatter,
    private delivery: Delivery,
    private filters: RowFilter[] = [],
  ) {}

  export(data: Row[]) {
    const rows = this.filters.reduce((acc, f) => f.apply(acc), data);
    return this.delivery.deliver(this.formatter.format(rows));
  }
}

// Any combination, no new classes per combination
const exporter = new ReportExporter(new PdfFormatter(), new S3Delivery(bucket), [
  new ActiveOnlyFilter(),
]);`,
      },
      {
        type: 'paragraph',
        text: 'Two formats times three deliveries times N filters used to need a class per combination; now it needs one class per behaviour. Each piece is tested on its own with plain inputs.',
      },
      { type: 'heading3', text: 'When inheritance is the right tool' },
      {
        type: 'bullets',
        items: [
          '**Framework extension points** designed for it: `class MyError extends Error`, `class Transform extends stream.Transform`, a NestJS `ExceptionFilter` base. The base contract is documented and stable.',
          '**Error hierarchies:** `NotFoundError extends DomainError` gives `instanceof` checks and shared fields with no behaviour override problems.',
          '**A shallow, closed set of variants** that genuinely share invariants, one level deep, where every subclass satisfies Liskov substitution.',
          'In TypeScript, a discriminated union is often better than a class hierarchy for closed variants: the compiler checks exhaustiveness.',
        ],
      },
      { type: 'heading3', text: 'Refactoring a deep hierarchy safely' },
      {
        type: 'numbered',
        items: [
          'Put characterization tests around the current behaviour of each leaf class you will touch.',
          'List the axes of variation (here: filtering, format, delivery). Each axis becomes an interface.',
          'Extract one axis at a time: move the overridden method into a strategy class and have the base call the injected strategy, defaulting to the old behaviour.',
          'Replace subclasses with factory functions that build the composed object, so call sites keep working.',
          'Delete empty subclasses once nothing references them. Keep each step a small, shippable PR.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Mixins are a third option in TypeScript, but they bring back many of the problems of inheritance (name clashes, hidden ordering). Prefer explicit composed collaborators unless a framework requires mixins.',
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'What is the fragile base class problem? — Base-class changes break subclasses that depended on its internals or call order.',
          'Template Method vs Strategy? — Template Method varies steps by subclassing; Strategy injects the step, so it composes and swaps at runtime.',
          'How do you share code between unrelated classes without inheritance? — Extract a collaborator or a plain function and call it.',
          'When would you use a discriminated union instead of classes? — Closed set of variants with data, where you want exhaustive `switch` checks.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Using inheritance purely to reuse a few helper methods.',
          'Overriding a method to throw or do nothing, which breaks substitutability.',
          'Relying on `protected` mutable state shared up and down the tree.',
          'Flattening a hierarchy in one big-bang rewrite without tests.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you can name the axes of variation, explain concretely why the hierarchy multiplies classes, show the composed version, and describe an incremental, test-backed refactor rather than a rewrite, while still knowing the cases where inheritance is the simplest correct choice.',
      },
    ],
  },

  'coupling-and-cohesion': {
    summary:
      'Cohesion is how strongly the things inside a module belong together; coupling is how much one module depends on the internals of another. I aim for high cohesion and loose coupling, so a change stays inside one module. I spot bad coupling through change patterns (one feature touches many folders), import graphs and cycles, shared mutable state and shared database tables, and I reduce it with narrow interfaces, moving behaviour next to its data, events for side effects, and enforced module boundaries.',
    details: [
      { type: 'heading3', text: 'The two ideas' },
      {
        type: 'bullets',
        items: [
          '**High cohesion:** everything in `billing/` is about billing. A change to invoicing rules happens in one place.',
          '**Low coupling:** `orders/` uses billing through a small public API (`billing.chargeOrder(orderId)`), not by reading the `invoices` table or importing internal helpers.',
          'They are connected: when related logic is scattered (low cohesion), modules must reach into each other (high coupling).',
        ],
      },
      { type: 'heading3', text: 'Kinds of coupling, from worst to most acceptable' },
      {
        type: 'bullets',
        items: [
          '**Shared database tables** between services or modules: any schema change breaks unknown readers.',
          '**Shared mutable global state:** module-level singletons that several features write to.',
          '**Content coupling:** importing the internal files of another module or depending on private fields.',
          '**Temporal coupling:** "you must call `init()` before `load()`", enforced by nobody.',
          '**Data coupling through a narrow, explicit interface:** the healthy default.',
          '**Event coupling:** publisher does not know the subscribers; looser, but harder to trace.',
        ],
      },
      { type: 'heading3', text: 'How I spot it' },
      {
        type: 'numbered',
        items: [
          '**Change coupling from git history:** files that always change together across folders. `git log --name-only` plus a quick script, or tools like CodeScene, shows this quickly.',
          '**Import graph and cycles:** `madge --circular src/` or `dependency-cruiser` show cycles and modules imported by everything.',
          '**Test pain:** a unit test that needs ten mocks is a coupling report.',
          '**Shared tables:** grep for the same table or collection name in several modules.',
          '**"Shotgun surgery" in reviews:** a small feature PR touches eight unrelated directories.',
        ],
      },
      { type: 'heading3', text: 'Before and after: reaching into internals' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: orders knows how billing stores and computes things
import { db } from '../db';
import { taxRateFor } from '../billing/internal/tax';

async function completeOrder(order: Order) {
  const rate = taxRateFor(order.country);                        // billing internal
  await db.collection('invoices').insertOne({ orderId: order.id, total: order.total * (1 + rate) });
  await db.collection('ledger').updateOne({ account: order.customerId }, { $inc: { due: order.total } });
}

// After: billing owns its data and exposes one intention-revealing call
// billing/index.ts (the only file other modules may import)
export interface BillingApi {
  invoiceOrder(order: { id: string; customerId: string; total: Money; country: string }): Promise<InvoiceId>;
}

// orders/complete-order.ts
class CompleteOrder {
  constructor(private billing: BillingApi, private orders: OrderRepository) {}
  async execute(orderId: string) {
    const order = await this.orders.get(orderId);
    order.complete();
    await this.orders.save(order);
    await this.billing.invoiceOrder(order.toBillingInput());
  }
}`,
      },
      { type: 'heading3', text: 'Ways to reduce coupling' },
      {
        type: 'bullets',
        items: [
          '**Public API per module:** one `index.ts` barrel; forbid deep imports with ESLint (`no-restricted-imports`), `dependency-cruiser` rules or Nx module boundaries.',
          '**Move behaviour to the data:** if `orders` keeps computing billing totals, that logic belongs in billing.',
          '**Own your data:** one module writes a table or collection; others ask through its API or consume its events.',
          '**Events for side effects:** "order completed" triggers email, loyalty points and analytics without `orders` importing them.',
          '**Depend on abstractions you own** (dependency inversion) at boundaries with infrastructure.',
          '**Break cycles** by extracting the shared concept into a third module or inverting one dependency with an interface.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Decoupling has a cost. Events make flows harder to follow and debug, and every interface is one more indirection. Decouple along boundaries that change independently or are owned by different teams; inside a small cohesive module, direct calls are fine.',
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Is microservices the fix for coupling? — No; it turns in-process coupling into network coupling. Fix boundaries in a modular monolith first.',
          'How do you enforce boundaries in a monorepo? — Lint rules or Nx tags that fail CI on forbidden imports.',
          'Events vs direct calls? — Direct when the caller needs the result or a failure must roll back; events for side effects that can happen later.',
          'How do you measure improvement? — Fewer cycles, fewer cross-module files per PR, smaller test setups.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Defining coupling vaguely ("things depend on each other") without kinds or examples.',
          'Treating shared database tables as harmless.',
          'Replacing every call with an event and losing traceability.',
          'Creating a `shared/` or `utils/` folder that every module imports, which becomes the new coupling hub.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you find coupling with evidence (change history, import graphs, test setup), fix it by moving behaviour and data ownership rather than adding layers, enforce boundaries in CI, and weigh the debugging cost of looser coupling.',
      },
    ],
  },

  'designing-code-for-testability': {
    summary:
      'I keep business rules in a pure core of functions and domain objects that take data in and return decisions, with no I/O. Everything that touches the outside world (database, HTTP, clock, random IDs, queues) sits behind small interfaces the core owns, the ports, implemented by adapters at the edge. Then most tests are fast unit tests of pure logic, adapters get a few integration tests against real infrastructure, and only a handful of end-to-end tests cover the wiring.',
    details: [
      { type: 'heading3', text: 'What makes code hard to test' },
      {
        type: 'bullets',
        items: [
          'Hidden dependencies: modules that `import { db }` or `new StripeClient()` inside the function.',
          'Non-determinism: `Date.now()`, `Math.random()`, `crypto.randomUUID()` called directly.',
          'Logic mixed with I/O: a 120-line handler where the pricing rule sits between two database calls.',
          'Global or module-level mutable state shared between tests.',
        ],
      },
      { type: 'heading3', text: 'Before: logic tangled with I/O' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export async function applyCoupon(req: Request, res: Response) {
  const cart = await db.collection('carts').findOne({ _id: req.params.id });
  const coupon = await db.collection('coupons').findOne({ code: req.body.code });
  if (!coupon || coupon.expiresAt < new Date()) return res.status(400).send('invalid');
  if (cart.total < coupon.minTotal) return res.status(400).send('too small');
  const discount = coupon.type === 'percent' ? cart.total * coupon.value / 100 : coupon.value;
  await db.collection('carts').updateOne({ _id: cart._id }, { $set: { discount } });
  res.json({ discount });
}
// Testing the discount rule needs a database, an HTTP request and a frozen clock.`,
      },
      { type: 'heading3', text: 'After: pure core, ports and adapters' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// 1. Pure core: data in, decision out
export type CouponResult =
  | { ok: true; discount: number }
  | { ok: false; reason: 'expired' | 'below-minimum' };

export function evaluateCoupon(cart: Cart, coupon: Coupon, now: Date): CouponResult {
  if (coupon.expiresAt <= now) return { ok: false, reason: 'expired' };
  if (cart.total < coupon.minTotal) return { ok: false, reason: 'below-minimum' };
  const discount =
    coupon.type === 'percent' ? Math.round((cart.total * coupon.value) / 100) : coupon.value;
  return { ok: true, discount: Math.min(discount, cart.total) };
}

// 2. Ports: owned by the application, shaped by what it needs
export interface CartRepository { get(id: string): Promise<Cart>; saveDiscount(id: string, d: number): Promise<void>; }
export interface CouponRepository { findByCode(code: string): Promise<Coupon | null>; }
export interface Clock { now(): Date; }

// 3. Use case: orchestration only
export class ApplyCoupon {
  constructor(private carts: CartRepository, private coupons: CouponRepository, private clock: Clock) {}
  async execute(cartId: string, code: string): Promise<CouponResult> {
    const [cart, coupon] = await Promise.all([this.carts.get(cartId), this.coupons.findByCode(code)]);
    if (!coupon) return { ok: false, reason: 'expired' };
    const result = evaluateCoupon(cart, coupon, this.clock.now());
    if (result.ok) await this.carts.saveDiscount(cartId, result.discount);
    return result;
  }
}

// 4. Adapters at the edge: MongoCartRepository, SystemClock, and a thin Express handler`,
      },
      { type: 'heading3', text: 'What the tests look like now' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Pure core: no mocks, runs in microseconds
it('caps a fixed discount at the cart total', () => {
  const result = evaluateCoupon(cart({ total: 30 }), coupon({ type: 'fixed', value: 50 }), now);
  expect(result).toEqual({ ok: true, discount: 30 });
});

// Use case: in-memory fakes instead of a mocking library
it('does not save when the coupon is expired', async () => {
  const carts = new InMemoryCarts([cart({ id: 'c1', total: 100 })]);
  const useCase = new ApplyCoupon(carts, new InMemoryCoupons([expiredCoupon]), fixedClock(now));
  await useCase.execute('c1', 'OLD10');
  expect(carts.discountOf('c1')).toBeUndefined();
});`,
      },
      {
        type: 'paragraph',
        text: 'Adapters (`MongoCartRepository`) get a few integration tests against a real MongoDB, for example with Testcontainers or `mongodb-memory-server`, because mocking the driver would only test your assumptions about it. The Express handler is covered by a couple of Supertest tests (see the Node Testing topic).',
      },
      { type: 'heading3', text: 'Trade-offs and limits' },
      {
        type: 'bullets',
        items: [
          'Hand-written fakes are worth it for ports used in many tests; for a one-off, `jest.fn()` is fine.',
          'A pure core needs the data loaded up front. For logic that must query as it goes, pass a narrow port into the function rather than the whole repository.',
          'Do not invent ports for things you never swap and can run cheaply in tests (a pure utility library, `JSON`).',
          'Over-mocking couples tests to implementation; prefer asserting on outputs and on the state of fakes.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Fakes vs mocks vs stubs? — Stubs return canned data, mocks verify calls, fakes are working lightweight implementations; prefer fakes and state checks.',
          'How do you test code that uses the current time? — Inject a `Clock` or pass `now` as a parameter; avoid global fake timers where you can.',
          'Is hexagonal architecture overkill for a small service? — Often yes; a pure function plus injected dependencies gets most of the benefit.',
          'How do you keep adapter tests fast enough? — Reuse one container per test run and isolate data per test.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Mocking the database driver call by call instead of putting a repository port in front of it.',
          'Letting the core import framework types such as `Request` or Mongoose documents.',
          'Calling `Date.now()` and `randomUUID()` deep inside business logic.',
          'Chasing 100% coverage with brittle interaction tests instead of testing behaviour.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate decisions from side effects so most logic is tested without mocks, choose fakes over interaction mocks, test adapters against real infrastructure, and scale the amount of architecture to the size and risk of the service.',
      },
    ],
  },

  'refactor-a-provider-switch-to-strategy': {
    summary:
      'I put each provider behind one `PaymentProvider` interface, give every provider its own class, and let the service pick a strategy from a registry keyed by provider name instead of switching on it. Adding a provider then means adding a class and one registration line, with no edits to checkout logic, and each provider can be tested on its own. The cost is more files and an indirection, so I only do it once there are real, diverging variants, not for two branches that will never grow.',
    details: [
      { type: 'heading3', text: 'Before: one method that knows every provider' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class PaymentService {
  async charge(order: Order, provider: 'stripe' | 'razorpay' | 'paypal') {
    switch (provider) {
      case 'stripe': {
        const intent = await stripe.paymentIntents.create({
          amount: order.totalMinor, currency: order.currency, metadata: { orderId: order.id },
        });
        return { id: intent.id, status: intent.status === 'succeeded' ? 'paid' : 'pending' };
      }
      case 'razorpay': {
        const rp = await razorpay.orders.create({ amount: order.totalMinor, currency: order.currency, receipt: order.id });
        return { id: rp.id, status: 'pending' };
      }
      case 'paypal':
        // ... 40 more lines, plus refunds and webhooks switch on provider again elsewhere
      default:
        throw new Error('Unknown provider ' + provider);
    }
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'The smell is not the `switch` itself; it is that the same `switch` appears in `charge`, `refund` and `handleWebhook`, every change touches a shared file, and a bug fix for one provider risks breaking the others. That breaks the Open/Closed principle: the class must be modified for every new provider.',
      },
      { type: 'heading3', text: 'After: one interface, one class per provider' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export type ProviderName = 'stripe' | 'razorpay' | 'paypal';

export interface ChargeResult { providerRef: string; status: 'paid' | 'pending' | 'failed'; }

export interface PaymentProvider {
  readonly name: ProviderName;
  charge(order: Order, idempotencyKey: string): Promise<ChargeResult>;
  refund(providerRef: string, amountMinor: number): Promise<void>;
  parseWebhook(rawBody: Buffer, signature: string): PaymentEvent;
}

export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;
  constructor(private readonly stripe: Stripe) {}

  async charge(order: Order, idempotencyKey: string): Promise<ChargeResult> {
    const intent = await this.stripe.paymentIntents.create(
      { amount: order.totalMinor, currency: order.currency, metadata: { orderId: order.id } },
      { idempotencyKey },
    );
    return { providerRef: intent.id, status: intent.status === 'succeeded' ? 'paid' : 'pending' };
  }
  // refund / parseWebhook ...
}

export class PaymentService {
  private readonly providers: Map<ProviderName, PaymentProvider>;

  constructor(providers: PaymentProvider[], private readonly payments: PaymentRepository) {
    this.providers = new Map(providers.map((p) => [p.name, p]));
  }

  async charge(order: Order, name: ProviderName) {
    const provider = this.providers.get(name);
    if (!provider) throw new UnsupportedProviderError(name);
    const result = await provider.charge(order, 'charge:' + order.id);
    await this.payments.record(order.id, name, result);
    return result;
  }
}`,
      },
      { type: 'heading3', text: 'Wiring' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Plain Node composition root
const paymentService = new PaymentService(
  [new StripeProvider(stripeClient), new RazorpayProvider(razorpayClient), new PaypalProvider(paypalClient)],
  paymentRepository,
);

// NestJS: a multi-provider token collects every strategy
export const PAYMENT_PROVIDERS = Symbol('PAYMENT_PROVIDERS');

@Module({
  providers: [
    StripeProvider, RazorpayProvider, PaypalProvider,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (...all: PaymentProvider[]) => all,
      inject: [StripeProvider, RazorpayProvider, PaypalProvider],
    },
    PaymentService, // constructor: @Inject(PAYMENT_PROVIDERS) providers: PaymentProvider[]
  ],
})
export class PaymentsModule {}`,
      },
      { type: 'heading3', text: 'Testing' },
      {
        type: 'bullets',
        items: [
          '`PaymentService` is tested with a fake `PaymentProvider` object: no SDK mocking, just "when the provider returns pending, we record pending".',
          'Each provider class gets its own tests against the SDK (mocked client, or the provider sandbox in a slower contract suite).',
          'A shared test suite run against every provider (a "contract test" for the interface) catches a provider that maps statuses differently.',
        ],
      },
      { type: 'heading3', text: 'Trade-offs and when not to do it' },
      {
        type: 'bullets',
        items: [
          '**Benefit:** new providers are additive, ownership is clear, and provider-specific dependencies stay out of the core service.',
          '**Cost:** more files and one level of indirection; reading the flow means jumping to the strategy class.',
          '**Leaky interface risk:** if one provider needs a redirect step and others do not, a too-narrow interface forces hacks. Model the difference (`status: "requires_action"` with a `nextAction`) instead of adding provider checks back into the service.',
          '**Do not** introduce Strategy for two stable branches or a simple value mapping; a lookup object or a small `switch` is clearer.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you choose the provider per request? — A separate selection policy (country, currency, feature flag, failover) that returns a name; keep it out of the strategies.',
          'How would you add automatic failover to a second provider? — A composite or decorator strategy that tries the primary and falls back, only for errors that are safe to retry.',
          'Where does idempotency live? — Pass an idempotency key into every strategy and persist it, so retries never double-charge regardless of provider.',
          'Strategy vs polymorphism on the Order? — Behaviour depends on the provider, not the order, so the provider owns it.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Moving the `switch` into a factory but still switching on provider in refund and webhook code.',
          'Returning raw SDK objects from strategies, which leaks provider types into the core.',
          'Making the interface the union of every provider feature, so most methods throw "not supported".',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you name the real driver (the same branch repeated in several places and changing for different reasons), keep provider selection separate from provider behaviour, design the interface around the domain rather than the first SDK, and say when a plain `switch` is the better choice.',
      },
    ],
  },

  'factory-vs-abstract-factory': {
    summary:
      'I use a Factory when creating an object involves a decision or non-trivial setup that callers should not repeat, such as picking an implementation from config or assembling a client with retries and credentials. An Abstract Factory creates a family of related objects that must match, like the storage, queue and secrets clients for AWS vs local development. In TypeScript, a plain function or the DI container usually covers this, so a factory class hierarchy is over-engineering unless there really are several families that vary together.',
    details: [
      { type: 'heading3', text: 'Before: construction logic copied around' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// In three different modules
const storage =
  process.env.STORAGE === 's3'
    ? new S3Storage(new S3Client({ region: process.env.AWS_REGION, maxAttempts: 3 }), process.env.BUCKET!)
    : new LocalDiskStorage('./uploads');`,
      },
      {
        type: 'paragraph',
        text: 'Every caller knows about environment variables, SDK options and every implementation. Changing the retry setting or adding GCS means hunting down all copies.',
      },
      { type: 'heading3', text: 'Factory function: one place decides' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface FileStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export function createFileStorage(config: StorageConfig): FileStorage {
  switch (config.kind) {
    case 's3':
      return new S3Storage(new S3Client({ region: config.region, maxAttempts: 3 }), config.bucket);
    case 'gcs':
      return new GcsStorage(new Storage({ projectId: config.projectId }), config.bucket);
    case 'local':
      return new LocalDiskStorage(config.dir);
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'The `switch` is fine here: it runs once at startup in the composition root, and `config` is a discriminated union so TypeScript checks that every kind is handled. Callers only see `FileStorage`.',
      },
      { type: 'heading3', text: 'Abstract Factory: a family that must match' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface InfrastructureFactory {
  fileStorage(): FileStorage;
  queue(): JobQueue;
  secrets(): SecretStore;
}

export class AwsInfrastructure implements InfrastructureFactory {
  constructor(private readonly cfg: AwsConfig) {}
  fileStorage() { return new S3Storage(new S3Client({ region: this.cfg.region }), this.cfg.bucket); }
  queue() { return new SqsQueue(new SQSClient({ region: this.cfg.region }), this.cfg.queueUrl); }
  secrets() { return new SecretsManagerStore(new SecretsManagerClient({ region: this.cfg.region })); }
}

export class LocalInfrastructure implements InfrastructureFactory {
  fileStorage() { return new LocalDiskStorage('./.data/uploads'); }
  queue() { return new InMemoryQueue(); }
  secrets() { return new EnvSecretStore(process.env); }
}

const infra: InfrastructureFactory =
  config.env === 'local' ? new LocalInfrastructure() : new AwsInfrastructure(config.aws);`,
      },
      {
        type: 'paragraph',
        text: 'The value is consistency: you cannot accidentally pair a local queue with S3 in production, and adding an Azure family is one new class. Without that "must match" constraint, separate factory functions are simpler.',
      },
      { type: 'heading3', text: 'In NestJS' },
      {
        type: 'code',
        lang: 'typescript',
        code: `{
  provide: FILE_STORAGE,
  useFactory: (config: ConfigService) => createFileStorage(config.getOrThrow('storage')),
  inject: [ConfigService],
}`,
      },
      {
        type: 'paragraph',
        text: '`useFactory` is the factory pattern built into the container, which is why hand-written factory classes are rarely needed in Nest apps.',
      },
      { type: 'heading3', text: 'When it is over-engineering' },
      {
        type: 'bullets',
        items: [
          'There is only one implementation and no real plan for a second: just call the constructor.',
          'A `UserFactory` whose `create()` is `new User(...)` with the same arguments adds a file and nothing else.',
          'Factory hierarchies (`AbstractStorageFactory` → `S3StorageFactory`) when one function with a union config would do.',
          'Hiding construction that tests need to control. Inject the factory result, not a factory you then have to mock.',
        ],
      },
      {
        type: 'paragraph',
        text: 'One legitimate small case: factories for test data (`buildOrder({ status: "paid" })`) keep tests short and are worth having even in simple codebases.',
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Factory vs Builder? — Factory picks what to create; Builder assembles one complex object step by step (for example a query or a request with many optional parts).',
          'Factory vs DI container? — The container calls factories for you; you still write the decision logic in `useFactory` or the composition root.',
          'How do you validate config before the factory runs? — Parse it with a schema at startup and fail fast, so the factory receives a typed, valid config.',
          'Where do factories live? — At the edge (composition root or module), never deep in business logic.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Calling the factory inside request handlers, creating a new SDK client and connection pool per request.',
          'Reading `process.env` inside the factory instead of receiving validated config.',
          'Using an Abstract Factory for objects that do not need to vary together.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you tie the pattern to a concrete need (a creation decision, or a family that must stay consistent), show that in TypeScript a function plus a discriminated union usually beats a class hierarchy, keep creation at the composition root, and can name when it is ceremony.',
      },
    ],
  },

  'adapter-and-facade-around-a-third-party-sdk': {
    summary:
      'An Adapter makes a third-party SDK fit an interface that my application owns, translating names, types and errors at the boundary, so the rest of the code never imports the SDK. A Facade gives callers one simple entry point over a multi-step subsystem, such as upload, scan and generate a signed URL. Together they turn "replace the vendor" into rewriting one adapter and its tests, and they let me unit test business logic with a fake instead of mocking the SDK.',
    details: [
      { type: 'heading3', text: 'Before: the SDK leaks everywhere' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// documents.service.ts
import { S3Client, PutObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async upload(file: Express.Multer.File, userId: string) {
  try {
    await this.s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: userId + '/' + file.originalname, Body: file.buffer }));
  } catch (e) {
    if (e instanceof S3ServiceException && e.name === 'AccessDenied') { /* ... */ }
    throw e;
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'AWS types, command classes and error names are spread across services and tests. Moving to Google Cloud Storage, or even upgrading the SDK, touches every file that uploads.',
      },
      { type: 'heading3', text: 'Adapter: my interface, their SDK' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// application-owned port
export interface ObjectStorage {
  put(key: string, body: Buffer | Readable, contentType: string): Promise<void>;
  signedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

export class StorageUnavailableError extends Error {}
export class StorageForbiddenError extends Error {}

// adapter: the only file that imports the AWS SDK
export class S3ObjectStorage implements ObjectStorage {
  constructor(private readonly s3: S3Client, private readonly bucket: string) {}

  async put(key: string, body: Buffer | Readable, contentType: string) {
    try {
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    } catch (e) {
      throw this.translate(e);
    }
  }

  signedReadUrl(key: string, expiresInSeconds: number) {
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private translate(e: unknown): Error {
    if (e instanceof S3ServiceException && e.name === 'AccessDenied') return new StorageForbiddenError(e.message, { cause: e });
    if (e instanceof S3ServiceException && e.$retryable) return new StorageUnavailableError(e.message, { cause: e });
    return e as Error;
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'A `GcsObjectStorage` implements the same interface. Error translation matters as much as method translation: callers catch `StorageUnavailableError`, not vendor exceptions, and the original stays available as `cause` for logs.',
      },
      { type: 'heading3', text: 'Facade: one call for a multi-step workflow' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class DocumentStore {
  constructor(
    private readonly storage: ObjectStorage,
    private readonly scanner: VirusScanner,
    private readonly documents: DocumentRepository,
  ) {}

  async save(userId: string, file: IncomingFile): Promise<{ id: string; url: string }> {
    await this.scanner.assertClean(file.buffer);
    const id = randomUUID();
    const key = 'documents/' + userId + '/' + id;
    await this.storage.put(key, file.buffer, file.mimeType);
    await this.documents.insert({ id, userId, key, name: file.originalName });
    return { id, url: await this.storage.signedReadUrl(key, 900) };
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Controllers call `documentStore.save()` and never coordinate scanner, storage and repository themselves. This is the same idea as the Angular facade described in the Architecture topic, applied on the server.',
      },
      { type: 'heading3', text: 'Testing' },
      {
        type: 'bullets',
        items: [
          'Business logic and the facade use an `InMemoryObjectStorage` fake: fast, deterministic, no SDK mocks.',
          'The adapter has a small integration suite against the real service or an emulator (MinIO or LocalStack for S3, the GCS emulator), including error translation.',
          'Run the same contract tests against every adapter to prove they behave alike (for example, deleting a missing key is not an error).',
        ],
      },
      { type: 'heading3', text: 'When not to bother' },
      {
        type: 'bullets',
        items: [
          'A throwaway script or a tiny service where the SDK is used in one place.',
          'Wrapping every SDK method one-to-one: that is a pass-through, not an adapter. Define only the operations your domain needs.',
          'Pretending vendors are interchangeable when they are not: if you rely on a unique feature (S3 Object Lock, for example), say so in the interface rather than hiding it.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How is this related to hexagonal architecture? — The interface is a port owned by the application, and the SDK wrapper is an adapter on the outside.',
          'Adapter vs Facade in one sentence? — Adapter changes an interface to one you expect; Facade simplifies several interfaces behind one.',
          'How would you migrate from S3 to GCS with no downtime? — Dual-write through a composite adapter, backfill, switch reads, then remove the old adapter.',
          'Where do retries go? — Inside the adapter or in a decorator around it, with SDK-level retry settings configured once.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Returning SDK response types from the adapter, so vendor types leak back in.',
          'Letting vendor exceptions escape, which forces callers to know the vendor anyway.',
          'Designing the interface from the first SDK, so the second vendor does not fit.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you keep the SDK import in one file, own the interface and the error types, translate errors with `cause`, back adapters with contract tests, and are honest about vendor-specific features instead of over-abstracting.',
      },
    ],
  },

  'cross-cutting-concerns-with-decorator': {
    summary:
      'I wrap the object in another object that implements the same interface, adds one behaviour such as caching, retries or timing, and delegates the real work to the wrapped instance. Each decorator does one thing, so I can stack them in the composition root (logging around retry around caching around the repository) and test each in isolation. The original class stays focused on its job, and the order of decorators becomes an explicit, reviewable decision.',
    details: [
      { type: 'heading3', text: 'Before: concerns tangled into the repository' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const cached = await redis.get('product:' + id);
    if (cached) return JSON.parse(cached);
    for (let attempt = 1; ; attempt++) {
      try {
        const start = Date.now();
        const p = await this.db.collection('products').findOne({ _id: id });
        logger.info({ ms: Date.now() - start }, 'findById');
        if (p) await redis.set('product:' + id, JSON.stringify(p), 'EX', 300);
        return p;
      } catch (e) {
        if (attempt >= 3) throw e;
      }
    }
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Data access, caching, retry and metrics are mixed in one method, repeated in every other method, and impossible to test separately.',
      },
      { type: 'heading3', text: 'After: one interface, small decorators' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface ProductReader {
  findById(id: string): Promise<Product | null>;
}

export class MongoProductReader implements ProductReader {
  constructor(private readonly products: Collection<Product>) {}
  findById(id: string) {
    return this.products.findOne({ _id: id }, { maxTimeMS: 2000 });
  }
}

export class CachedProductReader implements ProductReader {
  constructor(private readonly inner: ProductReader, private readonly cache: Cache, private readonly ttlSeconds = 300) {}

  async findById(id: string) {
    const key = 'product:v1:' + id;
    const hit = await this.cache.get<Product>(key);
    if (hit) return hit;
    const product = await this.inner.findById(id);
    if (product) await this.cache.set(key, product, this.ttlSeconds);
    return product;
  }
}

export class RetryingProductReader implements ProductReader {
  constructor(private readonly inner: ProductReader, private readonly retry: RetryPolicy) {}
  findById(id: string) {
    return this.retry.run(() => this.inner.findById(id)); // retries only transient errors, with backoff + jitter
  }
}

export class TimedProductReader implements ProductReader {
  constructor(private readonly inner: ProductReader, private readonly metrics: Metrics) {}
  async findById(id: string) {
    const stop = this.metrics.timer('product_reader_find_by_id');
    try {
      return await this.inner.findById(id);
    } finally {
      stop();
    }
  }
}`,
      },
      { type: 'heading3', text: 'Wiring: the order is the design' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const productReader: ProductReader = new TimedProductReader(
  new CachedProductReader(
    new RetryingProductReader(new MongoProductReader(db.collection('products')), retryPolicy),
    redisCache,
  ),
  metrics,
);

// NestJS: build the chain in one factory provider
{
  provide: PRODUCT_READER,
  useFactory: (db: Db, cache: Cache, metrics: Metrics) =>
    new TimedProductReader(new CachedProductReader(new RetryingProductReader(new MongoProductReader(db.collection('products')), defaultRetry), cache), metrics),
  inject: [MONGO_DB, CACHE, METRICS],
}`,
      },
      {
        type: 'bullets',
        items: [
          'Retry sits inside the cache, so a cache hit never triggers database retries.',
          'Timing is outermost, so it measures what callers actually experience, including cache hits.',
          'Swapping the order is a one-line change in one place, which is the point.',
        ],
      },
      { type: 'heading3', text: 'TypeScript decorators vs the Decorator pattern' },
      {
        type: 'paragraph',
        text: 'A method decorator such as `@Cacheable()` or a NestJS interceptor is a different mechanism with the same goal. Language decorators are convenient for uniform concerns across many classes, but they hide behaviour at the definition site and are harder to order and to switch per environment. Object decorators are plain code, explicit at wiring time, and need no framework. For HTTP-level concerns in Nest, interceptors are the idiomatic choice; for repository and client concerns, I prefer object decorators.',
      },
      { type: 'heading3', text: 'Testing' },
      {
        type: 'bullets',
        items: [
          '`CachedProductReader` with a fake inner reader and an in-memory cache: assert the inner reader is called once for two reads.',
          '`RetryingProductReader` with an inner reader that fails twice then succeeds, and a policy with zero delay.',
          'One integration test of the assembled chain to catch ordering mistakes.',
        ],
      },
      { type: 'heading3', text: 'When not to use it' },
      {
        type: 'bullets',
        items: [
          'Interfaces with many methods, where every decorator must forward 15 methods; consider a narrower interface or a generic proxy.',
          'When the concern needs internal state of the class (for example, caching partial results inside a computation).',
          'Deep stacks nobody can read; if the chain grows past four or five, document it or group concerns.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you invalidate the cache on writes? — A write-side decorator or the writer itself deletes or versions the key; see the cache invalidation answer.',
          'Decorator vs Proxy? — Same structure; a proxy controls access (lazy loading, permissions), a decorator adds behaviour.',
          'How would you avoid writing forwarding code? — A generic helper using `Proxy`, at the cost of type clarity and debuggability.',
          'What should never be retried here? — Non-idempotent writes without an idempotency key, and validation or not-found errors.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Putting retry outside the cache, so cache failures cause database retries.',
          'Caching `null` results forever or not at all, without deciding on negative caching.',
          'Decorators that change the contract (swallowing errors, returning stale data silently) without making it explicit.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you keep each concern in its own wrapper behind the same interface, treat decorator order as a deliberate decision you can explain, compare object decorators with framework interceptors and language decorators, and test each layer plus the assembled chain.',
      },
    ],
  },

  'refactoring-a-600-line-god-service': {
    summary:
      'I start by pinning current behaviour with characterization tests at the service boundary, because I cannot refactor safely what I cannot verify. Then I map responsibilities and pick the extraction with the best value-to-risk ratio, usually pure logic such as pricing or validation first, then I/O behind interfaces. I move in small, behaviour-preserving PRs, route callers to the new pieces gradually, and measure progress so the refactor can stop at any point without leaving the code worse.',
    details: [
      { type: 'heading3', text: 'Step 1: understand before touching' },
      {
        type: 'bullets',
        items: [
          'List what the service does and who calls each method; group methods by responsibility (pricing, inventory, notifications, persistence, provider calls).',
          'Use git history to find hotspots: the methods that change most often and cause the most bugs are where refactoring pays.',
          'Note hidden dependencies: module-level singletons, `Date.now()`, `process.env`, direct SDK calls.',
        ],
      },
      { type: 'heading3', text: 'Step 2: characterization tests' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Pin what the code does today, even if it looks wrong
describe('OrderService.placeOrder (characterization)', () => {
  it('applies the loyalty discount after the coupon', async () => {
    const { service, db, mailer } = buildLegacyService({ now: new Date('2026-01-10T10:00:00Z') });
    db.seed({ user: loyalUser, products: [keyboard], coupon: tenPercentOff });

    const order = await service.placeOrder(loyalUser.id, [{ sku: keyboard.sku, qty: 2 }], 'TEN');

    expect(order.totalMinor).toBe(16_200);           // record the current answer
    expect(mailer.sent).toHaveLength(1);
    expect(db.collection('inventory').find(keyboard.sku).reserved).toBe(2);
  });
});`,
      },
      {
        type: 'paragraph',
        text: 'These tests run against the public methods with fakes or a real test database, not against internals, so they survive the refactor. If a result looks like a bug, I record it, file it, and fix it in a separate PR, so behaviour changes are never hidden inside a refactor.',
      },
      { type: 'heading3', text: 'Step 3: create seams' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: hard-wired dependencies
export class OrderService {
  async placeOrder(userId: string, items: Item[], coupon?: string) {
    const now = new Date();
    const user = await mongo.collection('users').findOne({ _id: userId });
    // ...
  }
}

// After: inject what the service uses; behaviour unchanged
export class OrderService {
  constructor(
    private readonly users: UserRepository,
    private readonly clock: Clock = systemClock,
  ) {}
}`,
      },
      {
        type: 'paragraph',
        text: 'Seams (constructor injection of repositories, clock, SDK clients) are the cheapest early change and make every later step testable.',
      },
      { type: 'heading3', text: 'Step 4: extract in this order' },
      {
        type: 'numbered',
        items: [
          '**Pure logic first:** pricing, discount rules and validation become pure functions or a `PricingPolicy` class. No I/O, easy to test exhaustively, low risk.',
          '**Data access next:** queries move into repositories so the service stops building Mongo queries inline.',
          '**External calls:** payment, email and storage go behind interfaces (adapters), which also removes SDK mocks from tests.',
          '**Workflows last:** the remaining orchestration becomes thin use-case classes (`PlaceOrder`, `CancelOrder`), each small enough to read in one screen.',
        ],
      },
      {
        type: 'paragraph',
        text: 'The old `OrderService` methods temporarily delegate to the new classes, so callers keep working. That is a strangler inside the codebase: new code uses the use cases directly, old call sites migrate over time, and the god service shrinks until it can be deleted.',
      },
      { type: 'heading3', text: 'Keeping it safe in production' },
      {
        type: 'bullets',
        items: [
          'Small PRs, each one a single behaviour-preserving move, reviewed and deployed separately.',
          'For risky paths (pricing, payments), run old and new code side by side behind a feature flag and compare results in logs before switching (a shadow comparison).',
          'Watch error rates and key business metrics after each deploy; keep rollback a flag flip.',
          'Agree with the team on the target structure and a lint rule (for example, controllers may not import repositories) so the new layout does not decay.',
        ],
      },
      { type: 'heading3', text: 'Measuring progress' },
      {
        type: 'bullets',
        items: [
          'Lines and dependencies left in the god service, and the number of call sites still using it.',
          'Test coverage on the extracted modules and the time the test suite takes.',
          'Change failure rate and lead time for changes in this area, before and after.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you justify the time to your manager? — Tie it to hotspot data: bug count, slow changes, incidents in this code, and deliver it alongside feature work.',
          'Rewrite or refactor? — Refactor incrementally unless the code is small and fully covered; big-bang rewrites lose undocumented behaviour.',
          'What if there are no tests and no time to write many? — Cover the single most critical path end to end, then add tests for each piece as you extract it.',
          'How do you stop it from growing back? — Clear module boundaries, lint rules on imports, and code review guidance.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Refactoring and fixing bugs in the same PR, so nobody can tell whether a behaviour change was intended.',
          'Extracting by layer ("all helpers") instead of by responsibility, producing new god classes.',
          'A long-lived refactor branch that never merges.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you lead with safety (characterization tests and seams), prioritize by hotspots and risk, extract pure logic before I/O, keep every step shippable and reversible, and can explain how you measured that the refactor paid off.',
      },
    ],
  },

  'design-a-parking-lot': {
    summary:
      'I start by scoping: a multi-floor lot with spot sizes (motorcycle, compact, large), entry and exit gates that issue tickets, an hourly pricing rule and a live availability count. I model `ParkingLot` → `Floor` → `ParkingSpot`, with `Ticket` linking a `Vehicle` to a spot, a `SpotAllocationStrategy` to choose spots and a `PricingStrategy` to compute fees. The concurrency problem is two gates grabbing the same spot, so allocation must be an atomic claim, either a conditional database update or a lock, never a read-then-write.',
    details: [
      { type: 'heading3', text: '1. Clarifying questions and scope' },
      {
        type: 'bullets',
        items: [
          'How many floors and gates? Several of each, so allocation happens concurrently.',
          'Which vehicle types and spot sizes? Motorcycle, car, truck; spots are SMALL, COMPACT, LARGE. A smaller vehicle may use a bigger spot.',
          'Pricing? Hourly, rounded up, different rates per spot size. Must be easy to change (weekend rates, flat fee).',
          'Payment, reservations, EV charging? Out of scope for v1, but the design should not block them.',
          'Does it run on one machine or as a service? Assume a backend service with a database, several gate devices calling it.',
        ],
      },
      { type: 'heading3', text: '2. Entities and use cases' },
      {
        type: 'bullets',
        items: [
          '**Use cases:** vehicle enters → get a ticket with an assigned spot; vehicle exits → pay fee, spot freed; show free spots per floor and size.',
          '**Entities:** `ParkingLot`, `Floor`, `ParkingSpot`, `Vehicle`, `Ticket`, `Gate`, plus two strategies: `SpotAllocationStrategy` and `PricingStrategy`.',
          '**Value types:** `SpotSize`, `VehicleType`, `TicketStatus` as string-literal unions, not classes.',
        ],
      },
      {
        type: 'flow',
        title: 'Parking lot class diagram',
        code: `classDiagram
  class ParkingLot {
    +floors Floor[]
    +park(vehicle) Ticket
    +exit(ticketId) Receipt
  }
  class Floor {
    +level number
    +spots ParkingSpot[]
  }
  class ParkingSpot {
    +id string
    +size SpotSize
    +occupiedBy string
    +fits(vehicle) boolean
  }
  class Vehicle {
    +plate string
    +type VehicleType
  }
  class Ticket {
    +id string
    +spotId string
    +entryAt Date
    +status TicketStatus
  }
  class SpotAllocationStrategy {
    <<interface>>
    +candidates(floors, vehicle) ParkingSpot[]
  }
  class NearestFirstStrategy
  class PricingStrategy {
    <<interface>>
    +price(ticket, exitAt) number
  }
  class HourlyPricing
  ParkingLot *-- Floor
  Floor *-- ParkingSpot
  Ticket --> Vehicle
  Ticket --> ParkingSpot
  ParkingLot --> SpotAllocationStrategy
  ParkingLot --> PricingStrategy
  NearestFirstStrategy ..|> SpotAllocationStrategy
  HourlyPricing ..|> PricingStrategy`,
        text: 'Composition for the physical structure (a floor cannot exist without its lot); strategies are injected so allocation and pricing change without touching ParkingLot.',
      },
      { type: 'heading3', text: '3. Core types and classes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type SpotSize = 'SMALL' | 'COMPACT' | 'LARGE';
type VehicleType = 'MOTORCYCLE' | 'CAR' | 'TRUCK';

const MIN_SPOT: Record<VehicleType, SpotSize> = {
  MOTORCYCLE: 'SMALL',
  CAR: 'COMPACT',
  TRUCK: 'LARGE',
};
const RANK: Record<SpotSize, number> = { SMALL: 0, COMPACT: 1, LARGE: 2 };

class Vehicle {
  constructor(readonly plate: string, readonly type: VehicleType) {}
}

class ParkingSpot {
  constructor(readonly id: string, readonly floor: number, readonly size: SpotSize) {}
  fits(v: Vehicle): boolean {
    return RANK[this.size] >= RANK[MIN_SPOT[v.type]];
  }
}

interface SpotAllocationStrategy {
  /** Ordered list of spots to try; the repository does the atomic claim. */
  candidates(free: ParkingSpot[], v: Vehicle): ParkingSpot[];
}

class NearestFirstStrategy implements SpotAllocationStrategy {
  candidates(free: ParkingSpot[], v: Vehicle) {
    return free
      .filter((s) => s.fits(v))
      // smallest suitable size first, then lowest floor
      .sort((a, b) => RANK[a.size] - RANK[b.size] || a.floor - b.floor);
  }
}

interface PricingStrategy {
  price(entryAt: Date, exitAt: Date, size: SpotSize): number;
}

class HourlyPricing implements PricingStrategy {
  constructor(private readonly ratePerHour: Record<SpotSize, number>) {}
  price(entryAt: Date, exitAt: Date, size: SpotSize) {
    const hours = Math.max(1, Math.ceil((exitAt.getTime() - entryAt.getTime()) / 3_600_000));
    return hours * this.ratePerHour[size];
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Persistence sits behind a repository interface. The important method is `claim`, which must succeed for exactly one caller:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface SpotRepository {
  findFree(size?: SpotSize): Promise<ParkingSpot[]>;
  /** Atomically marks the spot occupied. Returns false if someone else got it first. */
  claim(spotId: string, ticketId: string): Promise<boolean>;
  release(spotId: string): Promise<void>;
}

class ParkingLotService {
  constructor(
    private readonly spots: SpotRepository,
    private readonly tickets: TicketRepository,
    private readonly allocation: SpotAllocationStrategy,
    private readonly pricing: PricingStrategy,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async park(vehicle: Vehicle): Promise<Ticket> {
    const free = await this.spots.findFree();
    const ticketId = crypto.randomUUID();
    for (const spot of this.allocation.candidates(free, vehicle)) {
      if (await this.spots.claim(spot.id, ticketId)) {
        return this.tickets.create({ id: ticketId, spot, plate: vehicle.plate, entryAt: this.clock() });
      }
      // lost the race for this spot: try the next candidate
    }
    throw new LotFullError(vehicle.type);
  }

  async exit(ticketId: string): Promise<Receipt> {
    const t = await this.tickets.get(ticketId);
    if (t.status !== 'ACTIVE') throw new TicketAlreadyClosedError(ticketId);
    const exitAt = this.clock();
    const fee = this.pricing.price(t.entryAt, exitAt, t.spot.size);
    await this.tickets.close(ticketId, exitAt, fee);
    await this.spots.release(t.spot.id);
    return { ticketId, fee, exitAt };
  }
}`,
      },
      { type: 'heading3', text: '4. Walking through "a car enters"' },
      {
        type: 'numbered',
        items: [
          'Gate calls `park(new Vehicle("KA01AB1234", "CAR"))`.',
          '`findFree()` returns free spots; `NearestFirstStrategy` filters to COMPACT and LARGE and orders COMPACT on floor 0 first.',
          '`claim(spotId, ticketId)` runs a conditional update. If it returns false (another gate won), the loop tries the next spot.',
          'A ticket is created with entry time and spot; the gate prints it.',
        ],
      },
      { type: 'heading3', text: '5. Patterns and why' },
      {
        type: 'bullets',
        items: [
          '**Strategy** for allocation and pricing: they are the parts the business changes most (EV-first, VIP floors, weekend rates).',
          '**Repository** so the domain does not know about SQL or MongoDB, and tests can use an in-memory fake.',
          '**Injected clock** so pricing is testable without waiting hours.',
          '**State** (optional) for `Ticket`: ACTIVE → PAID → CLOSED, rejecting invalid transitions such as exiting twice.',
          'I avoid a `Singleton` ParkingLot: it makes testing and multi-lot support harder; one instance wired at the composition root is enough.',
        ],
      },
      { type: 'heading3', text: '6. Concurrency' },
      {
        type: 'paragraph',
        text: 'Node runs JavaScript on one thread, but `await` points interleave requests, and in production there are several instances. So "check if free, then mark occupied" is a race even on one process. The claim must be a single atomic operation in the shared store:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// MongoDB: only one caller can match occupiedBy: null
async claim(spotId: string, ticketId: string) {
  const res = await this.col.updateOne(
    { _id: spotId, occupiedBy: null },
    { $set: { occupiedBy: ticketId, occupiedAt: new Date() } },
  );
  return res.modifiedCount === 1;
}

// SQL equivalent:
// UPDATE spots SET occupied_by = $2 WHERE id = $1 AND occupied_by IS NULL;  -- rowCount === 1`,
      },
      {
        type: 'bullets',
        items: [
          'An in-memory mutex only works for one process; I would not rely on it.',
          'Under heavy contention, many gates may chase the same "best" spot. Randomising among the top N candidates reduces collisions.',
          'Exit must be idempotent: a retried exit request on a CLOSED ticket returns the existing receipt instead of charging twice.',
          'Availability counters are derived (count of free spots) or updated in the same atomic operation, so the display board never drifts.',
        ],
      },
      { type: 'heading3', text: '7. Extensibility and testing' },
      {
        type: 'bullets',
        items: [
          'New vehicle type (e.g. EV): add to `VehicleType` and `MIN_SPOT`; an `EvFirstStrategy` prefers charger spots. No change to `ParkingLotService`.',
          'Reservations: a `Reservation` claims a spot with a time window, using the same atomic claim.',
          'Unit tests: strategies are pure functions, easy to test with tables of inputs.',
          'Concurrency test: run 50 parallel `park()` calls against a lot with 10 spots and a real database (Testcontainers); assert exactly 10 tickets and 40 `LotFullError`s.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How would you add reservations? — A reservation claims a spot for a window; entry converts it into a ticket; expired reservations are released by a job.',
          'What if the database is down at the gate? — Fail safe: open the barrier and issue an offline ticket with entry time, reconcile later; never trap cars.',
          'How do you show live availability on displays? — Publish spot-changed events after each claim/release; displays subscribe instead of polling.',
          'Why not one class per vehicle type (Car extends Vehicle)? — The types differ only by data (minimum spot size), so a type field plus a lookup table is simpler than an inheritance tree.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Jumping into code before agreeing on scope and use cases.',
          'A deep inheritance tree (Car, Truck, Bike, CompactSpot, LargeSpot) where data would do.',
          'Checking availability and then updating in two steps, which double-allocates under concurrency.',
          'Hard-coding pricing inside the exit method.',
          'Making ParkingLot a global singleton, which blocks testing and multiple lots.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you scope before modelling, keep the model small (data over inheritance), isolate what changes behind strategies, and you identify the double-allocation race and solve it with an atomic conditional update that works across processes, then prove it with a concurrency test.',
      },
    ],
  },

  'design-a-rate-limiter-library': {
    summary:
      'I design it as a small library with one core interface, `RateLimiter.consume(key, cost)`, that returns allowed or denied plus the headers a caller needs (remaining, retry-after). Algorithms (fixed window, sliding window, token bucket) are strategies, and storage is a separate `RateLimitStore` interface, so the same algorithm runs in memory for tests and on Redis in production. Framework adapters (Express middleware, NestJS guard) sit on top and stay thin. The distributed architecture is covered in the System Design rate limiter lesson; this answer is about the class design and testability.',
    details: [
      { type: 'heading3', text: '1. Clarifying questions and scope' },
      {
        type: 'bullets',
        items: [
          'Who uses it? Several services in a Node codebase, so it is a library with framework adapters, not a standalone service.',
          'Keys? Per user, API key or IP, and per route; callers decide the key.',
          'Algorithms? Token bucket and sliding window now; must be easy to add more.',
          'Distributed? Yes, limits must hold across instances, so a shared store (Redis) with atomic operations.',
          'Behaviour on store failure? Configurable: fail open (allow) or fail closed (deny).',
        ],
      },
      { type: 'heading3', text: '2. Entities' },
      {
        type: 'bullets',
        items: [
          '`RateLimiter`: the façade callers use.',
          '`RateLimitAlgorithm`: strategy that decides allow/deny from stored state.',
          '`RateLimitStore`: persistence with atomic read-modify-write.',
          '`RateLimitRule`: limit, window and cost per key pattern.',
          '`Decision`: the result value object.',
          'Adapters: `expressRateLimit()` middleware, `RateLimitGuard` for NestJS.',
        ],
      },
      {
        type: 'flow',
        title: 'Rate limiter library class diagram',
        code: `classDiagram
  class RateLimiter {
    +consume(key, cost) Decision
  }
  class RateLimitAlgorithm {
    <<interface>>
    +evaluate(state, rule, cost, now) Result
  }
  class TokenBucket
  class SlidingWindowCounter
  class FixedWindow
  class RateLimitStore {
    <<interface>>
    +update(key, apply) void
  }
  class MemoryStore
  class RedisStore
  class Decision {
    +allowed boolean
    +remaining number
    +retryAfterMs number
  }
  class ExpressAdapter
  RateLimiter --> RateLimitAlgorithm
  RateLimiter --> RateLimitStore
  RateLimiter ..> Decision
  TokenBucket ..|> RateLimitAlgorithm
  SlidingWindowCounter ..|> RateLimitAlgorithm
  FixedWindow ..|> RateLimitAlgorithm
  MemoryStore ..|> RateLimitStore
  RedisStore ..|> RateLimitStore
  ExpressAdapter --> RateLimiter`,
        text: 'Two independent axes of change, algorithm and storage, each behind its own interface. Adapters depend on the façade, never on concrete algorithms.',
      },
      { type: 'heading3', text: '3. Interfaces' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface Decision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number; // 0 when allowed
}

export interface RateLimitRule {
  limit: number;      // tokens or requests
  windowMs: number;   // refill period or window size
}

/** Algorithm-specific state, serialisable so any store can hold it. */
export type LimiterState = Record<string, number>;

export interface RateLimitAlgorithm {
  readonly name: string;
  /** Pure: computes the new state and the decision. No I/O. */
  evaluate(state: LimiterState | null, rule: RateLimitRule, cost: number, now: number): {
    state: LimiterState;
    decision: Decision;
    ttlMs: number;
  };
}

export interface RateLimitStore {
  /** Runs evaluate atomically for one key (lock, transaction or Lua script). */
  update(key: string, apply: (s: LimiterState | null) => { state: LimiterState; ttlMs: number }):
    Promise<void>;
}`,
      },
      {
        type: 'paragraph',
        text: 'Keeping `evaluate` pure is the key design decision: all the tricky arithmetic is testable without Redis, timers or mocks. The store only guarantees atomicity.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class TokenBucket implements RateLimitAlgorithm {
  readonly name = 'token-bucket';
  evaluate(state: LimiterState | null, rule: RateLimitRule, cost: number, now: number) {
    const ratePerMs = rule.limit / rule.windowMs;
    const prevTokens = state ? state.tokens : rule.limit;
    const last = state ? state.ts : now;
    const tokens = Math.min(rule.limit, prevTokens + (now - last) * ratePerMs);
    const allowed = tokens >= cost;
    const left = allowed ? tokens - cost : tokens;
    return {
      state: { tokens: left, ts: now },
      ttlMs: rule.windowMs,
      decision: {
        allowed,
        limit: rule.limit,
        remaining: Math.floor(left),
        retryAfterMs: allowed ? 0 : Math.ceil((cost - left) / ratePerMs),
      },
    };
  }
}

export class RateLimiter {
  constructor(
    private readonly algorithm: RateLimitAlgorithm,
    private readonly store: RateLimitStore,
    private readonly rule: RateLimitRule,
    private readonly options: { failOpen: boolean; clock?: () => number } = { failOpen: true },
  ) {}

  async consume(key: string, cost = 1): Promise<Decision> {
    const now = (this.options.clock ?? Date.now)();
    let decision: Decision | undefined;
    try {
      await this.store.update(key, (s) => {
        const r = this.algorithm.evaluate(s, this.rule, cost, now);
        decision = r.decision;
        return { state: r.state, ttlMs: r.ttlMs };
      });
    } catch (err) {
      if (!this.options.failOpen) throw err;
      return { allowed: true, limit: this.rule.limit, remaining: this.rule.limit, retryAfterMs: 0 };
    }
    return decision!;
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'A Redis store cannot run a JavaScript callback inside Redis, so in practice `RedisStore` pairs with algorithm-specific Lua scripts (the algorithm exposes a `luaScript` alongside `evaluate`), or uses `WATCH`/`MULTI` optimistic retries. I keep the TypeScript `evaluate` as the reference implementation and run the same test table against both, so the Lua and the TypeScript cannot drift. The Express token-bucket exercise in the Coding Round shows the single-process version.',
      },
      { type: 'heading3', text: '4. Walking through one request' },
      {
        type: 'numbered',
        items: [
          'Express adapter builds the key, e.g. `"orders:POST:" + apiKey`, and calls `limiter.consume(key)`.',
          'The store atomically loads state, runs `TokenBucket.evaluate`, writes new state with a TTL.',
          'Adapter sets `RateLimit-Limit`, `RateLimit-Remaining` and, on deny, `Retry-After`, then returns 429 or calls `next()`.',
        ],
      },
      { type: 'heading3', text: '5. Patterns' },
      {
        type: 'bullets',
        items: [
          '**Strategy**: algorithms and stores are interchangeable.',
          '**Façade**: `RateLimiter` hides the two collaborators behind one method.',
          '**Adapter**: Express/NestJS wrappers translate HTTP to `consume()` and back.',
          '**Factory** (optional): `createRateLimiter({ algorithm: "token-bucket", store: "redis" })` for configuration-driven setup.',
          '**Dependency injection of the clock** for deterministic tests.',
        ],
      },
      { type: 'heading3', text: '6. Concurrency' },
      {
        type: 'bullets',
        items: [
          'In-memory store: Node is single-threaded and `evaluate` is synchronous, so a synchronous read-evaluate-write on a `Map` is atomic within one process. It is wrong across instances.',
          'Redis store: one Lua script per call makes read-evaluate-write atomic across instances.',
          'Clock skew between instances matters for time-based state; using Redis server time (`TIME`) inside the script avoids it.',
          'Memory growth: every state write carries a TTL so idle keys disappear.',
        ],
      },
      { type: 'heading3', text: '7. Testing' },
      {
        type: 'code',
        lang: 'typescript',
        code: `describe('TokenBucket', () => {
  const rule = { limit: 10, windowMs: 1000 };
  const bucket = new TokenBucket();

  it('allows a burst up to the limit, then denies with retry-after', () => {
    let state = null;
    for (let i = 0; i < 10; i++) {
      const r = bucket.evaluate(state, rule, 1, 0);
      expect(r.decision.allowed).toBe(true);
      state = r.state;
    }
    const denied = bucket.evaluate(state, rule, 1, 0);
    expect(denied.decision.allowed).toBe(false);
    expect(denied.decision.retryAfterMs).toBe(100);
  });

  it('refills over time', () => {
    const empty = { tokens: 0, ts: 0 };
    expect(bucket.evaluate(empty, rule, 1, 100).decision.allowed).toBe(true);
  });
});`,
      },
      {
        type: 'bullets',
        items: [
          'Pure algorithm tests with an explicit `now`: no fake timers needed.',
          'Store contract tests: one shared suite run against `MemoryStore` and `RedisStore` (Testcontainers).',
          'Concurrency test: 100 parallel `consume()` calls on a limit of 10 against real Redis; exactly 10 allowed.',
          'Adapter tests with Supertest for headers and the 429 body.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you support different limits per plan? — A rule resolver `(key, req) => RateLimitRule` injected into the limiter instead of a fixed rule.',
          'What if Redis is down? — The configured fail-open/closed policy, plus a local in-memory fallback limiter per instance as a coarse guard.',
          'How do you avoid a Redis round trip per request? — Local token pre-allocation (take 10 tokens at a time) at the cost of slight over-admission.',
          'Sliding window log vs counter? — The log is exact but stores every timestamp; the counter approximates with two windows and constant memory.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Mixing algorithm, storage and HTTP handling in one middleware function, which makes every change risky.',
          'Read-then-write against Redis without atomicity.',
          'Calling `Date.now()` inside the algorithm, which forces fake timers in every test.',
          'Forgetting TTLs, so the store grows forever.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate the two axes of change (algorithm and store), keep the algorithm a pure function with an injected clock, make atomicity the store contract, and back it with a shared contract-test suite and a real concurrency test.',
      },
    ],
  },

  'design-a-notification-service': {
    summary:
      "I scope it as an in-process module that other code calls with `notify(userId, event, data)`. A `NotificationService` resolves the user's preferences, renders a template per channel, and hands each message to a `Channel` implementation (email, SMS, push) behind one interface, through a queue so retries and rate limits do not block the caller. Channels are strategies chosen by a registry, providers (SES, Twilio, FCM) sit behind adapters, and every message has an idempotency key so a retry never sends twice. The distributed pipeline is covered in the System Design notification lesson; here I focus on classes and responsibilities.",
    details: [
      { type: 'heading3', text: '1. Clarifying questions and scope' },
      {
        type: 'bullets',
        items: [
          'Who triggers notifications? Domain events such as `OrderShipped` or `PasswordReset`.',
          'Channels? Email, SMS, push now; WhatsApp or Slack later, so adding a channel must not touch existing code.',
          'User preferences? Per event category and channel (e.g. marketing off, order updates by push only), plus quiet hours.',
          'Delivery guarantees? At-least-once with deduplication; transactional messages (password reset) must bypass marketing opt-outs.',
          'Templates? Per event, per channel, per locale.',
        ],
      },
      { type: 'heading3', text: '2. Entities and responsibilities' },
      {
        type: 'bullets',
        items: [
          '`NotificationService`: orchestrates; the only entry point.',
          '`PreferenceService`: answers "which channels may I use for this user and event now?"',
          '`TemplateRenderer`: turns event + data + locale into channel-specific content.',
          '`Channel` (interface) with `EmailChannel`, `SmsChannel`, `PushChannel`.',
          '`ChannelRegistry`: maps a channel name to its implementation.',
          '`Message`: one rendered notification for one channel, with status and attempts.',
          '`RetryPolicy`: decides whether and when to retry a failure.',
        ],
      },
      {
        type: 'flow',
        title: 'Notification service class diagram',
        code: `classDiagram
  class NotificationService {
    +notify(userId, event, data) void
  }
  class PreferenceService {
    +channelsFor(userId, event) ChannelName[]
  }
  class TemplateRenderer {
    +render(event, channel, locale, data) Content
  }
  class ChannelRegistry {
    +get(name) Channel
  }
  class Channel {
    <<interface>>
    +name ChannelName
    +send(message) SendResult
  }
  class EmailChannel
  class SmsChannel
  class PushChannel
  class EmailProvider {
    <<interface>>
    +sendEmail(to, subject, html) string
  }
  class SesEmailProvider
  class Message {
    +id string
    +idempotencyKey string
    +status MessageStatus
    +attempts number
  }
  class RetryPolicy {
    +nextDelay(attempt, error) number
  }
  NotificationService --> PreferenceService
  NotificationService --> TemplateRenderer
  NotificationService --> ChannelRegistry
  NotificationService --> RetryPolicy
  ChannelRegistry o-- Channel
  EmailChannel ..|> Channel
  SmsChannel ..|> Channel
  PushChannel ..|> Channel
  EmailChannel --> EmailProvider
  SesEmailProvider ..|> EmailProvider
  NotificationService ..> Message`,
        text: 'Channels are strategies looked up by name; providers are adapters behind each channel, so switching from SES to SendGrid touches one class.',
      },
      { type: 'heading3', text: '3. Interfaces and the orchestrator' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type ChannelName = 'email' | 'sms' | 'push';
type MessageStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';

interface Content { subject?: string; body: string; }

interface Message {
  id: string;
  idempotencyKey: string; // e.g. eventId + ':' + channel
  userId: string;
  channel: ChannelName;
  content: Content;
  status: MessageStatus;
  attempts: number;
}

type SendResult =
  | { ok: true; providerId: string }
  | { ok: false; retryable: boolean; error: string };

interface Channel {
  readonly name: ChannelName;
  send(message: Message): Promise<SendResult>;
}

class ChannelRegistry {
  private readonly channels = new Map<ChannelName, Channel>();
  register(channel: Channel) { this.channels.set(channel.name, channel); return this; }
  get(name: ChannelName): Channel {
    const c = this.channels.get(name);
    if (!c) throw new Error('No channel registered for ' + name);
    return c;
  }
}

class NotificationService {
  constructor(
    private readonly prefs: PreferenceService,
    private readonly templates: TemplateRenderer,
    private readonly messages: MessageRepository,
    private readonly queue: JobQueue,
  ) {}

  async notify(userId: string, event: DomainEvent): Promise<void> {
    const user = await this.prefs.load(userId);
    for (const channel of this.prefs.channelsFor(user, event)) {
      const key = event.id + ':' + channel;
      const content = this.templates.render(event.type, channel, user.locale, event.data);
      // insert-if-absent on the unique idempotency key: duplicates of the same event are no-ops
      const message = await this.messages.createOnce({ idempotencyKey: key, userId, channel, content });
      if (message) await this.queue.enqueue('send-notification', { messageId: message.id });
    }
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'Sending happens in a worker, so the caller (e.g. the order service) never waits on Twilio. The worker owns retries:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `class SendNotificationWorker {
  constructor(
    private readonly messages: MessageRepository,
    private readonly registry: ChannelRegistry,
    private readonly retry: RetryPolicy,
  ) {}

  async handle(job: { messageId: string }): Promise<void> {
    const msg = await this.messages.get(job.messageId);
    if (msg.status === 'SENT') return; // redelivered job: already done

    const result = await this.registry.get(msg.channel).send(msg);
    if (result.ok) {
      await this.messages.markSent(msg.id, result.providerId);
      return;
    }
    const attempts = msg.attempts + 1;
    const delay = result.retryable ? this.retry.nextDelay(attempts) : null;
    if (delay === null) {
      await this.messages.markFailed(msg.id, result.error, attempts);
    } else {
      await this.messages.recordAttempt(msg.id, attempts);
      throw new RetryLaterError(delay); // queue reschedules with this delay
    }
  }
}

class ExponentialRetry implements RetryPolicy {
  constructor(private readonly maxAttempts = 5, private readonly baseMs = 1000) {}
  nextDelay(attempt: number): number | null {
    if (attempt >= this.maxAttempts) return null;
    const cap = this.baseMs * 2 ** attempt;
    return Math.round(Math.random() * cap); // full jitter
  }
}`,
      },
      { type: 'heading3', text: '4. Walking through "order shipped"' },
      {
        type: 'numbered',
        items: [
          'Order module emits `OrderShipped { id: "evt_9", userId, data }` and calls `notify()`.',
          '`PreferenceService` returns `["push", "email"]` (SMS off, not in quiet hours).',
          'Two messages are created with keys `evt_9:push` and `evt_9:email`, then enqueued.',
          'The push worker gets a 503 from FCM → retryable → rescheduled with jittered backoff; the email succeeds.',
          'If the event is delivered twice, `createOnce` finds the existing keys and enqueues nothing.',
        ],
      },
      { type: 'heading3', text: '5. Patterns and why' },
      {
        type: 'bullets',
        items: [
          '**Strategy + registry** for channels: adding WhatsApp means one new class and one `register()` call (open/closed).',
          '**Adapter** for providers: `EmailChannel` depends on an `EmailProvider` interface, not on the SES SDK.',
          '**Template Method or composition** inside channels for shared steps (validate address, render, send, map provider errors to retryable/non-retryable).',
          '**Observer / event-driven** triggering: domain modules publish events and do not know notifications exist.',
          '**Policy object** for retries, so per-channel policies (SMS costs money, fewer retries) are easy.',
        ],
      },
      { type: 'heading3', text: '6. Concurrency and correctness' },
      {
        type: 'bullets',
        items: [
          'Queues deliver at least once, so the worker checks status and the provider call carries the idempotency key where supported.',
          'A unique index on `idempotencyKey` makes `createOnce` safe across instances (duplicate-key error means "already created").',
          'Concurrency limits per channel protect provider rate limits (e.g. a BullMQ limiter on the SMS queue).',
          'Preferences are re-checked at send time for delayed messages, so an opt-out made after queuing is honoured.',
        ],
      },
      { type: 'heading3', text: '7. Extensibility and testing' },
      {
        type: 'bullets',
        items: [
          'New channel: implement `Channel`, register it, add templates. No change to the orchestrator.',
          'Digests (batching): a `DigestChannel` decorator that buffers messages and sends one summary.',
          'Unit tests: `NotificationService` with fake prefs, renderer, repository and queue; assert which messages were created.',
          'Worker tests: a fake channel returning retryable and non-retryable failures; assert status transitions and delays (inject `Math.random` or a seeded RNG).',
          'Contract tests per provider adapter against the provider sandbox, run nightly rather than on every commit.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you guarantee a password-reset email is not blocked by opt-out? — Event categories: transactional events bypass marketing preferences but still respect hard bounces.',
          'How do you avoid sending a notification if the order transaction rolled back? — Publish the event via a transactional outbox, not directly from inside the transaction.',
          'How would you add a fallback channel (SMS if push fails)? — A `FallbackChannel` composite that tries channels in order, recorded as separate attempts.',
          'Where do templates live? — Versioned in the repo or a template service; rendering is pure, so it is unit-tested with snapshots per locale.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'A `switch (channel)` in the service that grows with every new channel.',
          'Calling providers synchronously in the request path, so a slow SMS gateway slows checkout.',
          'Retrying non-retryable errors (invalid phone number) and burning money.',
          'No idempotency key, so queue redelivery sends duplicates.',
          'Checking preferences only at enqueue time.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you keep the orchestrator closed to change (channel strategies + registry, provider adapters), move sending off the request path, make retries policy-driven and classified by error type, and make duplicates impossible with an idempotency key backed by a unique index.',
      },
    ],
  },

  'design-a-cache-with-pluggable-eviction': {
    summary:
      'I separate storage from the eviction decision: a `Cache` class owns a `Map` of entries and asks an `EvictionPolicy` (Strategy) which key to drop when it is full, while expiry is a separate concern checked lazily on read and swept in the background. LRU, LFU and FIFO become small classes behind one interface with O(1) hooks (`onGet`, `onPut`, `onRemove`, `victim`). I add a single-flight `getOrLoad` so concurrent misses for the same key trigger one load, and emit eviction events so callers can observe hit rate and evictions.',
    details: [
      { type: 'heading3', text: '1. Clarifying questions and scope' },
      {
        type: 'bullets',
        items: [
          '**In-process or distributed?** In-process, single Node.js instance. The distributed version (sharding, replication) is the HLD question; here I stay at class level.',
          '**Capacity by count or by size?** Start with entry count; design so a `weigher` (bytes per entry) can be added later.',
          '**Which policies?** LRU and LFU must be swappable at construction; TTL is per entry and works with any policy.',
          '**Loading?** Support `getOrLoad(key, loader)` so callers do not write cache-aside code by hand, with protection against stampedes.',
          '**Observability?** Hit/miss counters and eviction events.',
          '**Non-goals:** persistence, cross-process consistency, write-behind.',
        ],
      },
      { type: 'heading3', text: '2. Entities and use cases' },
      {
        type: 'bullets',
        items: [
          '**Cache** — public API: `get`, `set(key, value, { ttlMs })`, `delete`, `getOrLoad`, `stats`.',
          '**Entry** — value, `expiresAt`, optional size.',
          '**EvictionPolicy** (interface) — tracks access order or frequency and names the victim. Implementations: `LruPolicy`, `LfuPolicy`, `FifoPolicy`.',
          '**Clock** (interface) — injected so TTL logic is testable without real time.',
          '**CacheListener** — receives `evicted(key, reason)` where reason is `capacity`, `expired` or `explicit`.',
        ],
      },
      {
        type: 'flow',
        title: 'Class diagram',
        code: `classDiagram
  class Cache {
    -entries Map
    -policy EvictionPolicy
    -clock Clock
    -inflight Map
    +get(key) value
    +set(key, value, options)
    +delete(key) boolean
    +getOrLoad(key, loader) Promise
    +stats() CacheStats
  }
  class EvictionPolicy {
    <<interface>>
    +onGet(key)
    +onPut(key)
    +onRemove(key)
    +victim() key
  }
  class LruPolicy
  class LfuPolicy
  class FifoPolicy
  class Clock {
    <<interface>>
    +now() number
  }
  class CacheListener {
    <<interface>>
    +evicted(key, reason)
  }
  class Entry {
    +value
    +expiresAt number
  }
  EvictionPolicy <|.. LruPolicy
  EvictionPolicy <|.. LfuPolicy
  EvictionPolicy <|.. FifoPolicy
  Cache *-- Entry
  Cache o-- EvictionPolicy
  Cache --> Clock
  Cache --> CacheListener`,
        text: 'The cache depends only on interfaces, so a policy, the clock and listeners can be swapped or faked in tests.',
      },
      { type: 'heading3', text: '3. Core interfaces and the Cache class' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface EvictionPolicy<K> {
  onGet(key: K): void;     // a hit: update recency / frequency
  onPut(key: K): void;     // a new key was inserted
  onRemove(key: K): void;  // deleted, expired or evicted
  victim(): K | undefined; // which key to evict next
}

export interface Clock { now(): number }
export const systemClock: Clock = { now: () => Date.now() };

type EvictReason = 'capacity' | 'expired' | 'explicit';
export interface CacheListener<K> { evicted(key: K, reason: EvictReason): void }

interface Entry<V> { value: V; expiresAt: number } // Infinity = no TTL

export class Cache<K, V> {
  private entries = new Map<K, Entry<V>>();
  private inflight = new Map<K, Promise<V>>();
  private hits = 0;
  private misses = 0;

  constructor(
    private readonly capacity: number,
    private readonly policy: EvictionPolicy<K>,
    private readonly clock: Clock = systemClock,
    private readonly listeners: CacheListener<K>[] = [],
  ) {
    if (capacity < 1) throw new RangeError('capacity must be >= 1');
  }

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) { this.misses++; return undefined; }
    if (entry.expiresAt <= this.clock.now()) {
      this.remove(key, 'expired');       // lazy expiry on read
      this.misses++;
      return undefined;
    }
    this.hits++;
    this.policy.onGet(key);
    return entry.value;
  }

  set(key: K, value: V, opts: { ttlMs?: number } = {}): void {
    const expiresAt = opts.ttlMs ? this.clock.now() + opts.ttlMs : Infinity;
    if (this.entries.has(key)) {
      this.entries.set(key, { value, expiresAt });
      this.policy.onGet(key);            // an update counts as a use
      return;
    }
    while (this.entries.size >= this.capacity) {
      const victim = this.policy.victim();
      if (victim === undefined) break;
      this.remove(victim, 'capacity');
    }
    this.entries.set(key, { value, expiresAt });
    this.policy.onPut(key);
  }

  delete(key: K): boolean {
    if (!this.entries.has(key)) return false;
    this.remove(key, 'explicit');
    return true;
  }

  stats() {
    const total = this.hits + this.misses;
    return { size: this.entries.size, hits: this.hits, misses: this.misses,
             hitRate: total ? this.hits / total : 0 };
  }

  private remove(key: K, reason: EvictReason): void {
    this.entries.delete(key);
    this.policy.onRemove(key);
    for (const l of this.listeners) l.evicted(key, reason);
  }
}`,
      },
      { type: 'heading3', text: '4. Policies behind one interface' },
      {
        type: 'paragraph',
        text: 'LRU reuses the insertion-order trick from the coding-round LRU answer: a `Map` (or set) where a touch deletes and re-inserts the key, so the first key is always the least recently used. All operations are O(1).',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class LruPolicy<K> implements EvictionPolicy<K> {
  private order = new Set<K>();          // oldest first
  onGet(key: K) { this.order.delete(key); this.order.add(key); }
  onPut(key: K) { this.order.add(key); }
  onRemove(key: K) { this.order.delete(key); }
  victim() { return this.order.values().next().value; }
}

// O(1) LFU: frequency buckets, each bucket keeps LRU order to break ties
export class LfuPolicy<K> implements EvictionPolicy<K> {
  private freq = new Map<K, number>();
  private buckets = new Map<number, Set<K>>();
  private minFreq = 0;

  onPut(key: K) {
    this.freq.set(key, 1);
    this.bucket(1).add(key);
    this.minFreq = 1;
  }
  onGet(key: K) {
    const f = this.freq.get(key);
    if (f === undefined) return;
    this.buckets.get(f)!.delete(key);
    if (f === this.minFreq && this.buckets.get(f)!.size === 0) this.minFreq = f + 1;
    this.freq.set(key, f + 1);
    this.bucket(f + 1).add(key);
  }
  onRemove(key: K) {
    const f = this.freq.get(key);
    if (f === undefined) return;
    this.buckets.get(f)!.delete(key);
    this.freq.delete(key);
    // minFreq may now be stale; victim() skips empty buckets
  }
  victim(): K | undefined {
    if (this.freq.size === 0) return undefined;
    while (!this.buckets.get(this.minFreq)?.size) this.minFreq++;
    return this.buckets.get(this.minFreq)!.values().next().value;
  }
  private bucket(f: number) {
    let b = this.buckets.get(f);
    if (!b) { b = new Set(); this.buckets.set(f, b); }
    return b;
  }
}`,
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Why TTL is not an EvictionPolicy: expiry is a property of each entry and must apply whatever the capacity policy is. Keeping it in `Cache` means "LRU + TTL" or "LFU + TTL" need no extra class. A background sweep (`setInterval(...).unref()`) can remove expired keys that are never read again, so they do not occupy capacity.',
      },
      { type: 'heading3', text: '5. Walking one use case: a full cache with LRU' },
      {
        type: 'numbered',
        items: [
          'Capacity 2: `set(a)`, `set(b)` → entries {a, b}, LRU order [a, b].',
          '`get(a)` → hit, `onGet(a)` moves it: order [b, a].',
          '`set(c)` → size is 2, so `victim()` returns `b`; `remove(b, "capacity")` notifies listeners; then insert c → order [a, c].',
          'Swap in `new LfuPolicy()` and the same calls evict by frequency instead — no change to `Cache`.',
        ],
      },
      { type: 'heading3', text: '6. Patterns and why' },
      {
        type: 'bullets',
        items: [
          '**Strategy** — `EvictionPolicy` isolates the one thing that varies. Open/closed: a new policy (ARC, random) is a new class.',
          '**Observer** — `CacheListener` decouples metrics, logging or write-back from the core.',
          '**Dependency injection** — `Clock` and policy come in through the constructor, which makes TTL and eviction deterministic in tests.',
          '**Factory (optional)** — `createCache({ policy: "lru", capacity })` hides wiring from callers and keeps config-driven setup simple.',
        ],
      },
      { type: 'heading3', text: '7. Concurrency and correctness' },
      {
        type: 'paragraph',
        text: 'Node runs this on one thread, so `get`/`set` never interleave mid-operation and need no locks. The real hazard is async: many requests miss the same key at once and all call the database (a cache stampede). I fix it with single-flight: store the in-flight promise and let later callers await it.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// inside Cache
async getOrLoad(key: K, loader: () => Promise<V>, opts: { ttlMs?: number } = {}): Promise<V> {
  const cached = this.get(key);
  if (cached !== undefined) return cached;

  const pending = this.inflight.get(key);
  if (pending) return pending;           // join the load already running

  const p = loader()
    .then((value) => { this.set(key, value, opts); return value; })
    .finally(() => this.inflight.delete(key)); // failures are not cached
  this.inflight.set(key, p);
  return p;
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Stale write after delete:** if `delete(key)` runs while a load is in flight, the load result would re-insert old data. Fix with a per-key version counter bumped on delete, and only `set` if the version is unchanged.',
          '**Mutable values:** returning the stored object lets callers mutate cached state. Store immutable values or clone on read for safety-critical data.',
          '**`undefined` as a value:** `get` uses `undefined` for a miss, so either forbid storing `undefined` or return `{ hit, value }`.',
          '**Worker threads / cluster:** each process has its own cache; sharing requires Redis, which is the HLD conversation.',
        ],
      },
      { type: 'heading3', text: '8. Extensibility and testing' },
      {
        type: 'bullets',
        items: [
          '**Size-based capacity:** add an optional `weigher(value) => bytes` and evict until `totalWeight <= maxWeight`.',
          '**Refresh-ahead / stale-while-revalidate:** serve the stale value and reload in the background when close to expiry.',
          '**Tests:** a fake `Clock` to step time for TTL; policy unit tests that assert `victim()` order; a contract test suite run against every `EvictionPolicy` implementation; a stampede test that fires 100 concurrent `getOrLoad` calls and asserts the loader ran once.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `it('evicts the least recently used key', () => {
  const cache = new Cache<string, number>(2, new LruPolicy());
  cache.set('a', 1); cache.set('b', 2);
  cache.get('a');
  cache.set('c', 3);
  expect(cache.get('b')).toBeUndefined();
  expect(cache.get('a')).toBe(1);
});

it('expires entries using the injected clock', () => {
  let now = 0;
  const cache = new Cache<string, number>(10, new LruPolicy(), { now: () => now });
  cache.set('a', 1, { ttlMs: 1000 });
  now = 1001;
  expect(cache.get('a')).toBeUndefined();
});`,
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you make LFU adapt when old popular keys stop being used? — Age frequencies (halve counts periodically) or use a windowed policy such as W-TinyLFU.',
          'How would you bound memory instead of entry count? — A weigher per entry and a running total; evict until under budget.',
          'What changes if this runs in several Node processes? — Each has its own copy; use Redis for shared state or accept per-process caches with short TTLs and pub/sub invalidation.',
          'How do you avoid caching errors or empty results forever? — Do not cache rejected loads; cache "not found" only with a short negative TTL.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Putting `if (policy === "lru")` branches inside the cache instead of a Strategy interface.',
          'An O(n) victim search (scanning all entries for the smallest timestamp or count).',
          'Treating TTL as another eviction policy, which makes "LRU with TTL" impossible without a new class.',
          'Calling `Date.now()` directly, which makes expiry untestable.',
          'Ignoring the stampede: every concurrent miss hits the database.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate the axis that varies (eviction policy) from the ones that do not, keep every operation O(1), inject time, and go beyond the data structure to async correctness — single-flight loads, not caching failures, and the stale-write-after-delete race.',
      },
    ],
  },

  'design-a-splitwise-style-expense-app': {
    summary:
      'I model users, groups and expenses, and treat each split type (equal, exact amounts, percentage, shares) as a Strategy that turns one expense into per-user owed amounts in integer minor units. Every expense updates a net balance per user in the group, so "who owes whom" is derived from balances rather than stored pairwise. To settle up I simplify debts greedily by matching the biggest creditor with the biggest debtor, which needs at most n − 1 payments and runs in O(n log n) with heaps.',
    details: [
      { type: 'heading3', text: '1. Clarifying questions and scope' },
      {
        type: 'bullets',
        items: [
          '**Groups only, or also 1:1 expenses?** Both; a 1:1 expense is a group of two.',
          '**Split types?** Equal, exact amounts, percentages and shares (for example 2:1:1).',
          '**Currencies?** One currency per group for this round; multi-currency is a follow-up.',
          '**Settle up?** Record a payment between two users, and suggest the minimum set of payments to clear the group.',
          '**Edits and deletes?** Supported, which means balances must be recomputable from history.',
          '**Non-goals:** notifications, receipts and OCR, authentication.',
        ],
      },
      { type: 'heading3', text: '2. Entities and use cases' },
      {
        type: 'bullets',
        items: [
          '**User**, **Group** (members).',
          '**Expense** — payer(s), total amount, description, split type, the computed **Split** lines (user, owed amount), and an idempotency key.',
          '**SplitStrategy** — `EqualSplit`, `ExactSplit`, `PercentSplit`, `ShareSplit`.',
          '**Payment** (settlement) — from, to, amount.',
          '**BalanceSheet** — net balance per user in a group (positive = is owed, negative = owes).',
          '**ExpenseService** — validates, applies strategies, writes expenses and updates balances.',
          '**SettlementService** — computes the simplified payment plan.',
        ],
      },
      {
        type: 'flow',
        title: 'Class diagram',
        code: `classDiagram
  class User {
    +id string
    +name string
  }
  class Group {
    +id string
    +members User[]
  }
  class Expense {
    +id string
    +groupId string
    +paidBy string
    +amountMinor number
    +splits Split[]
    +idempotencyKey string
  }
  class Split {
    +userId string
    +owedMinor number
  }
  class SplitStrategy {
    <<interface>>
    +split(amountMinor, participants, input) Split[]
  }
  class EqualSplit
  class ExactSplit
  class PercentSplit
  class ShareSplit
  class BalanceSheet {
    -net Map
    +apply(expense)
    +applyPayment(payment)
    +balances() Map
  }
  class ExpenseService {
    +addExpense(command) Expense
  }
  class SettlementService {
    +simplify(balances) Payment[]
  }
  class Payment {
    +from string
    +to string
    +amountMinor number
  }
  Group o-- User
  Expense *-- Split
  SplitStrategy <|.. EqualSplit
  SplitStrategy <|.. ExactSplit
  SplitStrategy <|.. PercentSplit
  SplitStrategy <|.. ShareSplit
  ExpenseService --> SplitStrategy
  ExpenseService --> BalanceSheet
  SettlementService --> Payment`,
        text: 'Balances are derived from expenses and payments; the settlement plan is computed from balances, never stored.',
      },
      { type: 'heading3', text: '3. Money and split strategies' },
      {
        type: 'paragraph',
        text: 'All amounts are integers in minor units (cents, paise). Floating point cannot represent 0.10 exactly, and summing thousands of float splits drifts. Every strategy must return splits that add up exactly to the total, so remainders are distributed deterministically.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface Split { userId: string; owedMinor: number }

export interface SplitStrategy {
  split(amountMinor: number, participants: string[], input?: Record<string, number>): Split[];
}

/** Distribute an integer amount by weights; leftover cents go to the largest fractional parts. */
function allocate(amountMinor: number, weights: Record<string, number>): Split[] {
  const ids = Object.keys(weights);
  const totalWeight = ids.reduce((s, id) => s + weights[id], 0);
  if (totalWeight <= 0) throw new Error('weights must be positive');
  const raw = ids.map((id) => {
    const exact = (amountMinor * weights[id]) / totalWeight;
    return { userId: id, owedMinor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let leftover = amountMinor - raw.reduce((s, r) => s + r.owedMinor, 0);
  [...raw]
    .sort((a, b) => b.frac - a.frac || a.userId.localeCompare(b.userId)) // deterministic
    .forEach((r) => { if (leftover > 0) { r.owedMinor++; leftover--; } });
  return raw.map(({ userId, owedMinor }) => ({ userId, owedMinor }));
}

export class EqualSplit implements SplitStrategy {
  split(amountMinor: number, participants: string[]) {
    return allocate(amountMinor, Object.fromEntries(participants.map((p) => [p, 1])));
  }
}

export class ShareSplit implements SplitStrategy {
  split(amountMinor: number, _p: string[], shares: Record<string, number> = {}) {
    return allocate(amountMinor, shares);
  }
}

export class PercentSplit implements SplitStrategy {
  split(amountMinor: number, _p: string[], percents: Record<string, number> = {}) {
    const sum = Object.values(percents).reduce((s, v) => s + v, 0);
    if (Math.abs(sum - 100) > 1e-9) throw new Error('percentages must add up to 100');
    return allocate(amountMinor, percents);
  }
}

export class ExactSplit implements SplitStrategy {
  split(amountMinor: number, _p: string[], exact: Record<string, number> = {}) {
    const sum = Object.values(exact).reduce((s, v) => s + v, 0);
    if (sum !== amountMinor) throw new Error('exact amounts must add up to the total');
    return Object.entries(exact).map(([userId, owedMinor]) => ({ userId, owedMinor }));
  }
}

export const splitStrategies: Record<string, SplitStrategy> = {
  EQUAL: new EqualSplit(),
  EXACT: new ExactSplit(),
  PERCENT: new PercentSplit(),
  SHARES: new ShareSplit(),
};`,
      },
      { type: 'heading3', text: '4. Balances and adding an expense' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class BalanceSheet {
  private net = new Map<string, number>(); // + is owed money, - owes money

  apply(paidBy: string, amountMinor: number, splits: Split[]) {
    this.add(paidBy, amountMinor);
    for (const s of splits) this.add(s.userId, -s.owedMinor);
  }
  applyPayment(from: string, to: string, amountMinor: number) {
    this.add(from, amountMinor);   // paying reduces what you owe
    this.add(to, -amountMinor);
  }
  balances() { return new Map(this.net); }
  private add(user: string, delta: number) {
    this.net.set(user, (this.net.get(user) ?? 0) + delta);
  }
}

export class ExpenseService {
  constructor(private repo: ExpenseRepository, private groups: GroupRepository) {}

  async addExpense(cmd: AddExpenseCommand): Promise<Expense> {
    const existing = await this.repo.findByIdempotencyKey(cmd.groupId, cmd.idempotencyKey);
    if (existing) return existing;                   // retry-safe

    const group = await this.groups.get(cmd.groupId);
    const participants = cmd.participants.filter((p) => group.hasMember(p));
    if (participants.length !== cmd.participants.length) throw new Error('not a group member');

    const strategy = splitStrategies[cmd.splitType];
    if (!strategy) throw new Error('unknown split type');
    const splits = strategy.split(cmd.amountMinor, participants, cmd.input);

    // expense + balance deltas in one transaction (unique index on groupId + idempotencyKey)
    return this.repo.saveWithBalanceDeltas({ ...cmd, splits });
  }
}`,
      },
      { type: 'heading3', text: '5. Walking one use case' },
      {
        type: 'numbered',
        items: [
          'Asha pays 100.00 (10000 minor) for dinner, split equally among Asha, Ben and Chen.',
          '`EqualSplit` → Asha 3334, Ben 3333, Chen 3333: the leftover cent goes to the deterministic tiebreak (equal fractions, then user id), and the splits sum to exactly 10000.',
          'Balances: Asha +10000 − 3334 = +6666, Ben −3333, Chen −3333. The sum of all balances is always zero — a cheap invariant to assert.',
          'Ben then pays 60.00 for a taxi, shares 1:1 between Ben and Chen → Ben −3333 + 6000 − 3000 = −333; Chen −3333 − 3000 = −6333; Asha still +6666.',
          'Simplify (below): Chen pays Asha 63.33 and Ben pays Asha 3.33 — two payments instead of tracking every pairwise debt.',
        ],
      },
      { type: 'heading3', text: '6. Settling up: debt simplification' },
      {
        type: 'paragraph',
        text: 'Because only net balances matter, I put creditors and debtors in two max-heaps and repeatedly settle the largest debtor against the largest creditor. Each step zeroes at least one person, so there are at most n − 1 payments, and with heaps it is O(n log n). Finding the true minimum number of payments is NP-hard (it reduces to partitioning balances into zero-sum subsets), so the greedy result is the standard, explainable answer.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface Payment { from: string; to: string; amountMinor: number }

export function simplify(balances: Map<string, number>): Payment[] {
  // arrays sorted descending stand in for max-heaps to keep the example short
  const creditors = [...balances].filter(([, b]) => b > 0).map(([id, b]) => ({ id, b }));
  const debtors = [...balances].filter(([, b]) => b < 0).map(([id, b]) => ({ id, b: -b }));
  const byAmount = (x: { b: number }, y: { b: number }) => y.b - x.b;
  const payments: Payment[] = [];

  while (creditors.length && debtors.length) {
    creditors.sort(byAmount);
    debtors.sort(byAmount);
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.b, d.b);
    payments.push({ from: d.id, to: c.id, amountMinor: amount });
    c.b -= amount;
    d.b -= amount;
    if (c.b === 0) creditors.shift();
    if (d.b === 0) debtors.shift();
  }
  return payments;
}`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Mention the trade-off out loud: simplification can create payments between people who never shared an expense (Chen pays Asha even if they never ate together). Real products make it a group setting for that reason.',
      },
      { type: 'heading3', text: '7. Concurrency and correctness' },
      {
        type: 'bullets',
        items: [
          '**Integer money** everywhere, formatted only at the edge; store currency with the group.',
          '**Deterministic rounding** so the same expense always produces the same splits, and the splits always sum to the total.',
          '**Idempotent expense creation:** the client sends an idempotency key; a unique index on `(groupId, idempotencyKey)` makes double taps or retries return the first expense instead of charging twice.',
          '**Atomic updates:** the expense row and its balance deltas are written in one transaction, or balances are recomputed from the expense log. Concurrent expenses in the same group use atomic increments (`$inc` / `UPDATE … SET net = net + ?`), never read-modify-write.',
          '**Edits and deletes:** apply the reverse deltas of the old splits and the deltas of the new ones in one transaction, and keep an audit history; never mutate silently.',
          '**Invariant:** the sum of balances in a group is zero; a periodic job recomputes balances from history and alerts on drift.',
        ],
      },
      { type: 'heading3', text: '8. Extensibility and testing' },
      {
        type: 'bullets',
        items: [
          '**New split type** (for example "by item") = a new `SplitStrategy`; nothing else changes (open/closed).',
          '**Multiple payers:** model `payers: { userId, paidMinor }[]` and apply each as a credit.',
          '**Multi-currency:** store the original currency and an FX rate snapshot on the expense; convert to the group currency when computing balances.',
          '**Tests:** property-based tests that splits always sum to the total and balances always sum to zero; unit tests for rounding edge cases (1 cent among 3 people); `simplify` tests asserting at most n − 1 payments and that applying them zeroes every balance; an idempotency test that submits the same key twice.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Can you guarantee the minimum number of payments? — Not efficiently; it is NP-hard. Greedy gives at most n − 1 payments, which is good enough and explainable.',
          'How do you store balances at scale? — A per-group, per-user balance row updated with atomic increments, rebuilt from the expense log if needed.',
          'How would you support offline creation on mobile? — Client-generated ids plus idempotency keys, then sync; conflicts resolved per expense, not per balance.',
          'Where do you put the rounding remainder and why? — A deterministic rule (largest remainder, then id) so results are reproducible and fair over time.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Using floating-point numbers for money.',
          'Splits that do not sum to the total because remainders are dropped.',
          'Storing a pairwise debt matrix and updating it per expense, which is O(n²) and hard to keep consistent.',
          'A `switch` on split type inside the service instead of strategies.',
          'No idempotency, so a retried request records the expense twice.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you treat money as integers with an explicit rounding rule, derive everything from net balances with a zero-sum invariant, make writes idempotent and atomic, and can explain why greedy simplification is used even though the true minimum is NP-hard.',
      },
    ],
  },
};
