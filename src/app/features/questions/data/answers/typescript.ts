import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'type-vs-interface': {
    summary:
      'Both describe the shape of data. An interface describes object shapes and can be extended or re-opened (declaration merging). A type alias can name ANY type — unions, tuples, primitives, mapped and conditional types — but cannot be re-opened. Rule of thumb: use interface for public object/class contracts, type for unions and type-level logic.',
    details: [
      {
        type: 'paragraph',
        text: 'For a plain object shape the two are almost interchangeable — the compiler treats them the same when checking values. The differences show up at the edges: what each can express, how they are extended, and whether they can be declared more than once.',
      },
      { type: 'heading3', text: 'Same result for simple objects' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface UserI {
  id: number;
  name: string;
}

type UserT = {
  id: number;
  name: string;
};

const a: UserI = { id: 1, name: 'Asha' }; // ✅
const b: UserT = a;                        // ✅ structurally identical`,
      },
      { type: 'heading3', text: 'What only a type alias can do' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Union — "one of these"
type Status = 'idle' | 'loading' | 'success' | 'error';

// Tuple
type Point = [x: number, y: number];

// Alias a primitive or function signature
type UserId = string;
type Handler = (event: MouseEvent) => void;

// Mapped & conditional types (type-level programming)
type ReadonlyDeep<T> = { readonly [K in keyof T]: ReadonlyDeep<T[K]> };
type ApiResult<T> = T extends Error ? { ok: false; error: T } : { ok: true; data: T };`,
      },
      { type: 'heading3', text: 'What only an interface can do: declaration merging' },
      {
        type: 'paragraph',
        text: 'Declaring the same interface twice merges the members. This is how libraries let you add properties to their types (module augmentation). Doing the same with `type` is a "Duplicate identifier" error.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface Window {
  analytics: { track(event: string): void };
}
// Now window.analytics is typed everywhere — merged into the built-in Window

type Config = { a: string };
type Config = { b: string }; // ❌ Error: Duplicate identifier 'Config'`,
      },
      { type: 'heading3', text: 'Extending: extends vs intersection (&)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface Animal { name: string }
interface Dog extends Animal { bark(): void }   // interface → extends

type AnimalT = { name: string };
type DogT = AnimalT & { bark(): void };          // type → intersection

// An interface can also extend a type alias (if it's an object type)
interface Cat extends AnimalT { meow(): void }`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Conflicts behave differently: `interface B extends A` with an incompatible property is a compile error right away, while `A & B` silently produces `never` for that property — a bug you may only notice later.',
      },
      {
        type: 'flow',
        title: 'Which one should I use?',
        code: `flowchart TD
  Q{What are you describing?} -->|"Object or class contract"| P{Will others need to<br/>extend or augment it?}
  Q -->|"Union, tuple, primitive,<br/>function, mapped type"| T([type]):::highlight
  P -->|Yes / public API| I([interface]):::server
  P -->|No| E([Either — follow team convention]):::external`,
      },
      {
        type: 'bullets',
        items: [
          'Angular/NestJS code: interfaces for DTOs, service contracts and component inputs; types for unions like `type Theme = "light" | "dark"`.',
          'A class can `implements` both an interface and an object type alias.',
          'Error messages and editor tooltips are often clearer with interfaces because they show the interface name instead of the expanded shape.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: don\'t say "interfaces are for objects, types are for everything else" and stop. Mention declaration merging and unions — those are the concrete differences interviewers look for.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the difference between interface and type alias in TypeScript?',
      },
      {
        type: 'paragraph',
        text: "Both can describe object shapes and are mostly interchangeable for that. An `interface` can be extended with `extends` and re-opened via **declaration merging** (used for module augmentation, e.g. adding `user` to Express's `Request`). A `type` alias can name **any** type — unions, intersections, tuples, primitives, function types, mapped and conditional types — but cannot be re-declared. Common convention: interfaces for object contracts, types for unions and type-level logic.",
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Equivalent object shapes
interface UserI { id: string; email: string }
type UserT = { id: string; email: string };

// Only a type alias can express these
type OrderStatus = 'pending' | 'paid' | 'shipped';        // union
type Handler = (req: Request) => Promise<Response>;        // function type
type Pair = [key: string, value: number];                  // tuple
type Nullable<T> = T | null;                               // generic union
type Events = { [K in OrderStatus as \`order.\${K}\`]: { orderId: string } }; // mapped + template literal

// Extending
interface Admin extends UserI { permissions: string[] }
type AdminT = UserT & { permissions: string[] };`,
      },
      { type: 'heading3', text: 'Declaration merging — the Node use case' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// src/types/express.d.ts — add req.user to Express everywhere
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; roles: string[] };
  }
}

// Now in any route handler:
app.get('/me', (req, res) => {
  res.json({ id: req.user?.id }); // ✅ typed
});

// Also how process.env can be typed:
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Merging**: interfaces merge across declarations; a duplicate `type` name is a compile error.',
          '**Conflicts**: `interface B extends A` with an incompatible property errors immediately; `A & B` silently produces `never` for that property.',
          '**Classes** can `implements` either an interface or an object type alias.',
          '**Performance/readability**: TypeScript caches interface relationships, and error messages show the interface name — slightly better for large object hierarchies.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the Express `Request` augmentation is a perfect Node-specific example of why declaration merging (and therefore interfaces) matters — use it.',
      },
    ],
  },

  generics: {
    summary:
      'Generics are type parameters — placeholders like <T> that let one function, class or interface work with many types while keeping full type safety. Instead of using `any` (which loses type information), the caller\'s actual type flows through, so `identity<string>("a")` returns a `string`, not `any`.',
    details: [
      {
        type: 'paragraph',
        text: 'Think of a generic as a function parameter for types. You write the logic once, and TypeScript fills in the real type each time it is used — usually inferring it automatically from the arguments.',
      },
      { type: 'heading3', text: 'The problem generics solve' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ With any: works for everything, but the type is lost
function firstAny(items: any[]): any {
  return items[0];
}
const n = firstAny([1, 2, 3]); // n: any — typo n.toFixd() compiles fine 😬

// ✅ With a generic: works for everything AND keeps the type
function first<T>(items: T[]): T | undefined {
  return items[0];
}
const x = first([1, 2, 3]);    // x: number | undefined (T inferred as number)
const s = first(['a', 'b']);   // s: string | undefined`,
      },
      { type: 'heading3', text: 'Constraints — "T must have at least …"' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// T can be any type that HAS a length property
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest('hello', 'hi');     // ✅ string
longest([1, 2], [1, 2, 3]); // ✅ number[]
longest(10, 20);            // ❌ number has no 'length'

// keyof constraint: only allow real property names
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: 'Asha' };
getProp(user, 'name');  // string
getProp(user, 'email'); // ❌ '"email"' is not assignable to '"id" | "name"'`,
      },
      { type: 'heading3', text: 'Generic interfaces and classes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

// Angular example — HttpClient.get is generic too
getUsers(): Observable<User[]> {
  return this.http.get<User[]>('/api/users');
}

class Cache<K, V> {
  private store = new Map<K, V>();
  set(key: K, value: V) { this.store.set(key, value); }
  get(key: K): V | undefined { return this.store.get(key); }
}
const cache = new Cache<string, User>();`,
      },
      {
        type: 'flow',
        title: 'How the type flows through a generic',
        code: `flowchart LR
  C["Call: first(['a', 'b'])"]:::client --> INF["TypeScript infers<br/>T = string"]:::highlight
  INF --> SIG["Signature becomes<br/>first(items: string[]): string | undefined"]:::server
  SIG --> R["Result typed as<br/>string | undefined"]:::db`,
      },
      {
        type: 'bullets',
        items: [
          'Default type parameters: `interface Page<T = unknown> { items: T[] }`.',
          'Built-in utility types are generics: `Partial<T>`, `Pick<T, K>`, `Record<K, V>`, `Promise<T>`, `Observable<T>`, `Signal<T>`.',
          'Prefer inference — write `first([1, 2])`, not `first<number>([1, 2])`, unless TypeScript cannot infer the type (e.g. an empty array or an HTTP response).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: contrast generics with `any` (type safety is kept) and show a constraint (`extends`) — it proves you have used generics beyond the textbook identity function.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What are generics in TypeScript and how do they improve type safety?',
      },
      {
        type: 'paragraph',
        text: 'Generics are type parameters (`<T>`) that let you write a function, class or interface once and have it work with many types while **preserving** the specific type the caller uses. Unlike `any`, the type information flows from input to output, so the compiler still catches mistakes — e.g. a generic `Repository<User>` returns `User`, not `any`.',
      },
      {
        type: 'paragraph',
        text: 'Without generics you either duplicate code per type or use `any` and lose checking. Generics give you reuse **and** precision, and TypeScript usually infers the type argument so call sites stay clean.',
      },
      { type: 'heading3', text: 'Generic function with a constraint' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Group any list of records by one of their keys
function groupBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T[]> {
  const map = new Map<T[K], T[]>();
  for (const item of items) {
    const k = item[key];
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
}

interface Order { id: string; status: 'paid' | 'pending'; total: number }
const byStatus = groupBy(orders, 'status'); // Map<'paid' | 'pending', Order[]>
groupBy(orders, 'customer');                // ❌ '"customer"' is not assignable to keyof Order`,
      },
      { type: 'heading3', text: 'Generic repository for a Node service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface Entity { id: string }

class Repository<T extends Entity> {
  constructor(private readonly table: string, private readonly db: Db) {}

  async findById(id: string): Promise<T | null> {
    const rows = await this.db.query<T>('SELECT * FROM ' + this.table + ' WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async insert(entity: Omit<T, 'id'>): Promise<T> {
    const id = crypto.randomUUID();
    await this.db.insert(this.table, { ...entity, id });
    return { ...entity, id } as T;
  }
}

interface User extends Entity { email: string; name: string }
const users = new Repository<User>('users', db);
const u = await users.findById('42');   // u: User | null
u?.email.toLowerCase();                 // ✅ typed
await users.insert({ email: 'a@b.c' }); // ❌ property 'name' is missing`,
      },
      { type: 'heading3', text: 'Generic API response wrapper' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function getJson<T>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(url);
  if (!res.ok) return { ok: false, error: res.statusText };
  return { ok: true, data: (await res.json()) as T }; // ⚠️ an assertion — validate if untrusted
}

const result = await getJson<User[]>('https://api.example.com/users');
if (result.ok) result.data.map((u) => u.email); // data: User[]`,
      },
      {
        type: 'bullets',
        items: [
          '**Constraints** (`T extends Entity`) restrict what callers may pass and let you use members of the constraint inside.',
          '**Defaults**: `interface Page<T = unknown>`.',
          'Built-in generics you use daily: `Promise<T>`, `Map<K, V>`, `Array<T>`, `Record<K, V>`, `Partial<T>`.',
          'Generics are erased at runtime — `T` cannot be used in `instanceof` or to validate data. A generic return type on `res.json()` is a promise, not a check.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: `getJson<User>(url)` looks type-safe but is just an assertion — the server can return anything. At trust boundaries, combine generics with a runtime validator (Zod, Valibot) whose inferred type becomes `T`.',
      },
    ],
  },

  'any-vs-unknown-vs-never': {
    summary:
      '`any` turns type checking off — anything goes in and anything comes out, so mistakes surface at runtime. `unknown` also accepts any value, but you must narrow it before using it, which makes it the safe type for untrusted data (JSON, localStorage, caught errors). `never` is the opposite end: a type with no values, used for functions that never return and for exhaustive checks that make the compiler flag a forgotten case.',
    details: [
      {
        type: 'paragraph',
        text: 'Think of them as positions in the type hierarchy. `unknown` is the top type (every value fits in it), `never` is the bottom type (no value fits in it), and `any` is an escape hatch that sits outside the rules — it is assignable to and from everything, so it silently spreads through your code.',
      },
      { type: 'heading3', text: 'any vs unknown' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const fromAny: any = JSON.parse('{"name":"Asha"}');
fromAny.nmae.toUpperCase();          // compiles — crashes at runtime
const n: number = fromAny;           // compiles — any assigns to everything

const fromUnknown: unknown = JSON.parse('{"name":"Asha"}');
fromUnknown.name;                    // ❌ error: 'fromUnknown' is of type 'unknown'
const m: number = fromUnknown;       // ❌ error: Type 'unknown' is not assignable to type 'number'

if (typeof fromUnknown === 'object' && fromUnknown !== null && 'name' in fromUnknown) {
  console.log(fromUnknown.name);     // ✅ narrowed — now you may use it
}`,
      },
      { type: 'heading3', text: 'unknown at the edges of an Angular app' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Restoring saved UI state — localStorage can contain anything
function readSaved<T>(key: string, isValid: (v: unknown) => v is T): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch (err) {
    // err is unknown under strict (useUnknownInCatchVariables)
    console.warn('Corrupt saved state', err instanceof Error ? err.message : err);
    return null;
  }
}

// Error handlers receive unknown — narrow before reading fields
function toMessage(err: unknown): string {
  return err instanceof HttpErrorResponse ? \`HTTP \${err.status}\` : 'Unexpected error';
}`,
      },
      { type: 'heading3', text: 'never: exhaustive checks' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Status = 'idle' | 'loading' | 'success' | 'error';

function statusIcon(status: Status): string {
  switch (status) {
    case 'idle': return 'ti-clock';
    case 'loading': return 'ti-loader';
    case 'success': return 'ti-check';
    case 'error': return 'ti-alert-triangle';
    default: return assertNever(status); // status is never here
  }
}

function assertNever(value: never): never {
  throw new Error(\`Unhandled value: \${String(value)}\`);
}

// Later someone adds 'cancelled' to Status and forgets the switch:
// ❌ error: Argument of type '"cancelled"' is not assignable to parameter of type 'never'`,
      },
      {
        type: 'bullets',
        items: [
          '`never` also shows up as the result of impossible types: `string & number` is `never`, and `Exclude<T, U>` drops members by turning them into `never`.',
          'A function typed `(): never` either always throws or loops forever; a function that returns nothing is `void`, not `never`.',
          'Where `any` sneaks in: untyped third-party libraries, `JSON.parse`, `HttpErrorResponse.error`, `$any()` in templates. Treat each as a boundary and convert to `unknown` or a real type quickly.',
          'Lint rules like `@typescript-eslint/no-explicit-any` and `no-unsafe-*` keep `any` from spreading.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give one line for each: "`any` opts out of checking, `unknown` makes you prove the type before use, `never` means this cannot happen." Then show the `assertNever` switch — it shows you use `never` on purpose, not just know the definition.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the difference between unknown and any in TypeScript?',
      },
      {
        type: 'paragraph',
        text: 'Both can hold any value, but `any` switches off type checking — you can call, access or assign anything, and errors surface only at runtime. `unknown` is the type-safe counterpart: you can assign anything to it, but you cannot use the value until you **narrow** it (with `typeof`, `instanceof`, a type guard or a schema validator). Use `unknown` for untrusted data like `JSON.parse` results, request bodies and caught errors.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `let a: any = JSON.parse('{"port": "3000"}');
a.port.toFixed(2);     // compiles ✅ — crashes at runtime: toFixed is not a function
const n: number = a;   // compiles — any is assignable to everything (it spreads)

let u: unknown = JSON.parse('{"port": "3000"}');
u.port;                // ❌ 'u' is of type 'unknown'
const m: number = u;   // ❌ unknown is not assignable to number

// Narrow first
if (typeof u === 'object' && u !== null && 'port' in u && typeof u.port === 'string') {
  const port = Number(u.port); // ✅ safe
}`,
      },
      { type: 'heading3', text: 'Validating request bodies' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { z } from 'zod';

const CreateOrder = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
type CreateOrder = z.infer<typeof CreateOrder>;

app.post('/orders', (req, res) => {
  const body: unknown = req.body;          // treat input as unknown
  const parsed = CreateOrder.safeParse(body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const order: CreateOrder = parsed.data;  // fully typed from here on
  res.status(201).json(order);
});`,
      },
      { type: 'heading3', text: 'Caught errors are unknown' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// With "strict" (useUnknownInCatchVariables), catch variables are unknown
try {
  await db.connect();
} catch (err) {
  // err.message           ❌ not allowed on unknown
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err }, message);
}

// A reusable type guard
function isNodeError(e: unknown): e is NodeJS.ErrnoException {
  return e instanceof Error && 'code' in e;
}
if (isNodeError(err) && err.code === 'ENOENT') { /* file missing */ }`,
      },
      {
        type: 'bullets',
        items: [
          '`any` is contagious: values derived from it are also `any`, silently removing type safety across the codebase.',
          '`unknown` is the "top type" done right: anything goes in, nothing comes out without proof.',
          'Legitimate `any` use: gradual migration from JS or working around a broken third-party type — prefer `// eslint-disable` with a comment so it is visible.',
          'Enable `noImplicitAny` (part of `strict`) and the ESLint rule `@typescript-eslint/no-explicit-any`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: one sentence that lands well — "`any` trusts you, `unknown` makes you prove it." Then show narrowing or a Zod schema at the API boundary.',
      },
    ],
  },

  'utility-types-and-where-to-use-them': {
    summary:
      'Utility types are built-in generic types that derive new types from existing ones, so you keep one source of truth. In Angular I use `Omit<Product, "id">` for create DTOs, `Partial<…>` for PATCH payloads, `Pick<…>` for the slice a card component needs, `Record<Status, string>` for label/icon maps that must cover every case, and `Readonly<…>` for state that should not be changed in place.',
    details: [
      {
        type: 'paragraph',
        text: 'Without them you end up copying the `Product` interface into `CreateProductDto`, `UpdateProductDto` and `ProductCardData` — and the copies drift apart the first time someone adds a field. With utility types, a change to `Product` flows through to all of them automatically.',
      },
      { type: 'heading3', text: 'DTOs in a typed HttpClient service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: 'books' | 'electronics' | 'toys';
  createdAt: string;
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt'>; // server sets these
export type UpdateProductDto = Partial<CreateProductDto>;          // PATCH: any subset
export type ProductSummary = Pick<Product, 'id' | 'name' | 'price'>; // what a card needs

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  create(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>('/api/products', dto);
  }

  update(id: number, changes: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(\`/api/products/\${id}\`, changes);
  }
}

productService.update(1, { price: 19.99 }); // ✅ only what changed
productService.create({ name: 'Pen', price: 2, stock: 10, category: 'toys', id: 5 });
// ❌ error: Object literal may only specify known properties, and 'id' does not exist in type 'CreateProductDto'`,
      },
      { type: 'heading3', text: 'Record and Readonly for UI state' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Category = Product['category'];

// Every category MUST have a label — add 'garden' to the union and this errors
const categoryLabels: Record<Category, string> = {
  books: 'Books',
  electronics: 'Electronics',
  toys: 'Toys & Games',
};

interface CartState {
  items: ProductSummary[];
  coupon: string | null;
}

const initialState: Readonly<CartState> = { items: [], coupon: null };
initialState.coupon = 'SAVE10';  // ❌ error: Cannot assign to 'coupon' because it is a read-only property
initialState.items.push(item);   // ✅ compiles — Readonly is shallow!

cart = signal<Readonly<CartState>>(initialState); // nudges everyone to use update() with new objects`,
      },
      {
        type: 'bullets',
        items: [
          'Also worth knowing: `Required<T>`, `NonNullable<T>`, `Exclude`/`Extract` for unions, `ReturnType<typeof fn>`, `Parameters<typeof fn>`, and `Awaited<T>` to unwrap a Promise.',
          'They compose: `Partial<Omit<Product, "id">>` reads as "any editable field".',
          '`Record<string, T>` is a loose dictionary; `Record<Union, T>` is an exhaustive map — prefer the second whenever the keys are known.',
          'They are all shallow and type-only: nothing is removed or frozen at runtime (`Readonly` is not `Object.freeze`).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: anchor each utility type to a real job — create DTO (`Omit`), PATCH body (`Partial`), card input (`Pick`), status label map (`Record`), store state (`Readonly`). Mentioning that `Readonly` is shallow shows you have actually hit its limits.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What are TypeScript utility types? (Partial, Pick, Omit, Record, Readonly)',
      },
      {
        type: 'paragraph',
        text: 'Utility types are built-in generic types that transform existing types so you do not have to redeclare them. `Partial<T>` makes all properties optional, `Pick<T, K>` keeps only the listed keys, `Omit<T, K>` removes the listed keys, `Record<K, V>` builds an object type with keys `K` and values `V`, and `Readonly<T>` makes all properties read-only. They keep DTOs and models in sync with a single source of truth.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

// Partial — PATCH body: any subset of fields
type UpdateUserDto = Partial<Pick<User, 'email' | 'name'>>;
// { email?: string; name?: string }

// Omit — what you send to clients (never leak the hash)
type PublicUser = Omit<User, 'passwordHash'>;

// Pick — a lightweight projection
type UserSummary = Pick<User, 'id' | 'name'>;

// Omit for create input: server generates id and createdAt
type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string };

// Record — lookup tables with exhaustive keys
type Role = 'admin' | 'editor' | 'viewer';
const permissions: Record<Role, string[]> = {
  admin: ['*'],
  editor: ['posts:write', 'posts:read'],
  viewer: ['posts:read'],
}; // forgetting a role is a compile error

// Readonly — immutable config
const config: Readonly<{ port: number; dbUrl: string }> = { port: 3000, dbUrl: '...' };
config.port = 4000; // ❌ Cannot assign to 'port' because it is a read-only property`,
      },
      { type: 'heading3', text: 'In a service layer' },
      {
        type: 'code',
        lang: 'typescript',
        code: `async function updateUser(id: string, patch: UpdateUserDto): Promise<PublicUser> {
  const user = await repo.update(id, patch);
  const { passwordHash, ...publicUser } = user; // strip sensitive field
  return publicUser;
}`,
      },
      { type: 'heading3', text: 'Other utilities worth knowing' },
      {
        type: 'bullets',
        items: [
          '`Required<T>` — opposite of Partial.',
          '`ReturnType<typeof fn>` / `Parameters<typeof fn>` — derive types from functions.',
          '`Awaited<T>` — unwrap a Promise type: `Awaited<ReturnType<typeof getUser>>`.',
          '`Exclude<U, X>` / `Extract<U, X>` / `NonNullable<T>` — work on unions.',
          'All are **shallow**: `Readonly<T>` and `Partial<T>` affect only top-level properties.',
          'They are implemented with mapped and conditional types, e.g. `type Partial<T> = { [P in keyof T]?: T[P] }`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: show them on a realistic model — create/update DTOs and a public projection that omits secrets. Mentioning that `Readonly` and `Partial` are shallow is a nice senior-level detail.',
      },
    ],
  },

  'type-guards-and-narrowing': {
    summary:
      'Narrowing is TypeScript following your runtime checks to work out a more specific type inside a branch. A type guard is the check that does it: `typeof` for primitives, `instanceof` for classes like `HttpErrorResponse`, `in` to tell object shapes apart by a property, and a custom function returning `value is T` when the check is more complex — for example validating JSON before you trust it.',
    details: [
      {
        type: 'paragraph',
        text: 'TypeScript does control-flow analysis: after `if (typeof x === "string")` it knows `x` is a string in that block and the remaining union members in the `else`. Equality checks, truthiness checks, `return`/`throw` and `switch` statements all narrow too.',
      },
      { type: 'heading3', text: 'typeof and instanceof' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function formatPrice(value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(2);       // value: number
  }
  return value.trim();             // value: string
}

// catchError / error callbacks give you unknown
function toMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.status === 404 ? 'Not found' : err.message; // err: HttpErrorResponse
  }
  if (err instanceof Error) {
    return err.message;            // err: Error
  }
  return 'Something went wrong';
}`,
      },
      { type: 'heading3', text: 'in — tell interfaces apart' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface CardPayment { cardNumber: string; expiry: string }
interface UpiPayment { upiId: string }

function describe(payment: CardPayment | UpiPayment): string {
  if ('upiId' in payment) {
    return \`UPI \${payment.upiId}\`;                        // UpiPayment
  }
  return \`Card ending \${payment.cardNumber.slice(-4)}\`;  // CardPayment
}`,
      },
      {
        type: 'paragraph',
        text: '`instanceof` only works for classes — interfaces do not exist at runtime, so `x instanceof Product` is impossible when `Product` is an interface. That is exactly when you reach for `in` or a custom predicate.',
      },
      { type: 'heading3', text: 'Custom predicates: value is T' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Product).id === 'number' &&
    typeof (value as Product).name === 'string' &&
    typeof (value as Product).price === 'number'
  );
}

const saved: unknown = JSON.parse(localStorage.getItem('lastViewed') ?? 'null');
if (isProduct(saved)) {
  this.recent.set(saved);          // saved: Product
}

// Predicates narrow arrays too
const products = maybeProducts.filter((p): p is Product => p !== null); // Product[]
// TS 5.5+ infers that predicate for simple callbacks: .filter(p => p !== null)

// Assertion function: throws instead of returning boolean
function assertIsProduct(value: unknown): asserts value is Product {
  if (!isProduct(value)) throw new Error('Invalid product');
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A custom predicate is a promise you make to the compiler — it is not checked. If `isProduct` forgets a field, TypeScript still trusts it. Keep guards small and unit-tested, or generate them from a schema.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name all four guards with a one-line use case each, then stress the key difference — `instanceof` needs a class at runtime, so for interfaces and API data you use `in` or a `value is T` predicate.',
      },
    ],
  },

  'discriminated-unions-for-ui-state': {
    summary:
      'A discriminated union is a union of object types that all share a literal property — the discriminant, like `status`. Checking that property narrows to exactly one member, so `data` is only reachable when `status` is "success" and `error` only when it is "error". For UI state this makes impossible combinations (loading with an error and stale data) unrepresentable, and `@switch` in the template plus a `never` check keep every state handled.',
    details: [
      {
        type: 'paragraph',
        text: 'The usual alternative is a bag of flags: `loading: boolean; error?: string; data?: User[]`. It allows nonsense states — `loading: true` together with an `error` — and forces `data!` or `?.` everywhere. A discriminated union describes only the states that can actually exist.',
      },
      { type: 'heading3', text: 'Model the state' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };`,
      },
      { type: 'heading3', text: 'Use it in a component' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-users',
  templateUrl: './users.html',
})
export class UsersComponent {
  private http = inject(HttpClient);
  state = signal<LoadState<User[]>>({ status: 'idle' });

  userCount = computed(() => {
    const s = this.state();
    return s.status === 'success' ? s.data.length : 0; // data exists only after the check
  });

  load() {
    this.state.set({ status: 'loading' });
    this.http.get<User[]>('/api/users').subscribe({
      next: (data) => this.state.set({ status: 'success', data }),
      error: () => this.state.set({ status: 'error', error: 'Could not load users' }),
    });
  }
}

// Mistakes are compile errors:
// s.data                                    ❌ Property 'data' does not exist on type '{ status: "idle"; }'
// state.set({ status: 'loading', data: [] }) ❌ 'data' does not exist in type '{ status: "loading"; }'`,
      },
      { type: 'heading3', text: 'Render it with @switch' },
      {
        type: 'code',
        lang: 'html',
        code: `@let s = state();
@switch (s.status) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <p class="error">{{ s.error }}</p> }
  @case ('success') {
    @for (user of s.data; track user.id) {
      <p>{{ user.name }}</p>
    } @empty {
      <p>No users yet.</p>
    }
  }
}`,
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Narrowing in templates needs a stable reference. With `strictTemplates`, switching on `s.status` (a `@let` variable) narrows `s` inside each `@case`. Writing `state().error` instead does NOT narrow, because each `state()` call is a separate expression — you get "Property \'error\' does not exist on type LoadState<User[]>".',
      },
      {
        type: 'bullets',
        items: [
          'Pair it with `Record<LoadState<unknown>["status"], string>` for labels, or an `assertNever` default in TypeScript switches, so adding a new status breaks the build until every place handles it.',
          'The same pattern models form submission (`idle | submitting | submitted | failed`), wizard steps, WebSocket connection state and NgRx action payloads.',
          "Angular's `resource()` / `httpResource()` expose a similar idea through `status()`, `value()` and `error()`.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: start with the "bag of booleans" problem, then show the union and say "make impossible states impossible". Showing that `s.data` is a compile error outside the success branch is the moment it clicks for interviewers.',
      },
    ],
  },

  'enums-vs-string-literal-unions': {
    summary:
      'For most Angular code I prefer string literal unions: they cost nothing at runtime, accept plain strings straight from the API, work directly in templates, and still give autocomplete and exhaustiveness checks. Enums create a real runtime object and are nominal — a string enum will not accept the plain string "admin" — which adds casts at API boundaries. When I want named constants too, I use an `as const` object and derive the union from it.',
    details: [
      { type: 'heading3', text: 'String enum: nominal and has runtime code' },
      {
        type: 'code',
        lang: 'typescript',
        code: `enum Role {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

function canEdit(role: Role): boolean {
  return role === Role.Admin || role === Role.Editor;
}

canEdit(Role.Admin); // ✅
canEdit('admin');    // ❌ error: Argument of type '"admin"' is not assignable to parameter of type 'Role'
canEdit(user.role as Role); // API data is a plain string → you end up casting`,
      },
      { type: 'heading3', text: 'Union: erased at compile time, plain strings work' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Role = 'admin' | 'editor' | 'viewer';

function canEdit(role: Role): boolean {
  return role === 'admin' || role === 'editor';
}

canEdit('admin'); // ✅ and autocomplete still suggests the three values
canEdit('owner'); // ❌ error: Argument of type '"owner"' is not assignable to parameter of type 'Role'`,
      },
      { type: 'heading3', text: 'Best of both: an as const object' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Named constants (Role.Admin style) + a union type with the same name
export const Role = { Admin: 'admin', Editor: 'editor', Viewer: 'viewer' } as const;
export type Role = (typeof Role)[keyof typeof Role]; // 'admin' | 'editor' | 'viewer'

canEdit(Role.Admin); // ✅ constant
canEdit('viewer');   // ✅ plain string from the API

// Runtime list for a <select> and for validating API input
export const ROLE_OPTIONS = Object.values(Role); // ('admin' | 'editor' | 'viewer')[]
export function isRole(value: string): value is Role {
  return (ROLE_OPTIONS as readonly string[]).includes(value);
}`,
      },
      { type: 'heading3', text: 'Trade-offs' },
      {
        type: 'bullets',
        items: [
          "**Templates**: with an enum you must expose it on the component (`protected readonly Role = Role;`) before writing `@if (role() === Role.Admin)`. With a union you just write `role() === 'admin'`, and `strictTemplates` still type-checks the literal.",
          '**Numeric enums** add reverse mapping (`Priority[0] === "Low"`) and values that are just numbers in logs and payloads, which are hard to read. Since TS 5.0 assigning an out-of-range literal is at least an error.',
          '**`const enum`** is inlined only when the compiler sees the whole program. Angular CLI projects use `isolatedModules`, which implies `preserveConstEnums` and forbids reading ambient const enums from `.d.ts` files (TS2748), so you lose most of the benefit.',
          "**Type-stripping tools**: TypeScript 5.8 added `erasableSyntaxOnly` for Node's built-in type stripping — enums (including `const enum`) and namespaces with code are errors under it, while unions erase cleanly.",
          '**Where enums still fit**: a large existing codebase that already uses them, or a shared library where you want a single named runtime object to iterate over. Consistency beats switching halfway.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: don\'t say "enums are bad". Say what they cost (runtime code, nominal typing, template boilerplate, `isolatedModules` issues) and show the `as const` pattern, which gives you a runtime list AND a union type from one source.',
      },
    ],
  },

  'keyof-and-typeof-in-type-position': {
    summary:
      'In a type position, `typeof value` gives you the TypeScript type of an existing variable — handy for config objects and functions you do not want to describe twice. `keyof Type` gives the union of that type\'s property names, e.g. `keyof Product` is `"id" | "name" | "price"`. Combined as `keyof typeof obj`, they turn a runtime object into a union of its keys, which is perfect for typed table columns, sort keys and feature flags.',
    details: [
      {
        type: 'paragraph',
        text: 'Do not confuse the two kinds of `typeof`. In an expression (`typeof x === "string"`) it is the JavaScript operator that returns a string at runtime. After a colon or in a `type` alias, it is a compile-time query that produces a type and disappears from the output.',
      },
      { type: 'heading3', text: 'typeof: derive types from values' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const environment = {
  apiUrl: 'https://api.example.com',
  production: false,
  features: { darkMode: true, chat: false },
};

type Environment = typeof environment;
// { apiUrl: string; production: boolean; features: { darkMode: boolean; chat: boolean } }

type FeatureFlag = keyof typeof environment.features; // 'darkMode' | 'chat'

function isEnabled(flag: FeatureFlag): boolean {
  return environment.features[flag];
}
isEnabled('darkMode'); // ✅
isEnabled('payments'); // ❌ error: Argument of type '"payments"' is not assignable to parameter of type '"darkMode" | "chat"'

function createUser(name: string) {
  return { id: Date.now(), name, createdAt: new Date() };
}
type NewUser = ReturnType<typeof createUser>; // { id: number; name: string; createdAt: Date }`,
      },
      { type: 'heading3', text: 'keyof: a typed sortable table' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-product-table',
  template: \`
    @for (col of columns; track col) {
      <th (click)="sortBy.set(col)">{{ col }}</th>
    }
  \`,
})
export class ProductTableComponent {
  products = signal<Product[]>([]);
  columns: (keyof Product)[] = ['name', 'price', 'stock'];
  sortBy = signal<keyof Product>('name');

  sorted = computed(() => {
    const key = this.sortBy();
    return [...this.products()].sort((a, b) => compare(a[key], b[key]));
  });
}

// this.sortBy.set('cost');
// ❌ error: Argument of type '"cost"' is not assignable to parameter of type 'keyof Product'`,
      },
      { type: 'heading3', text: 'keyof in generics + indexed access' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
const prices = pluck(products, 'price'); // number[] — T[K] looks up the property type

type Price = Product['price'];                     // number
const PATHS = ['', 'products', 'cart'] as const;
type AppPath = (typeof PATHS)[number];             // '' | 'products' | 'cart'`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain the two `typeof`s (runtime operator vs type query), then show `keyof typeof` on a config object. The `K extends keyof T` → `T[K]` pattern is the follow-up most interviewers ask for.',
      },
    ],
  },

  'mapped-and-conditional-types': {
    summary:
      'A mapped type loops over the keys of a type and builds a new one — `{ [K in keyof T]: … }` — which is how `Partial` and `Readonly` are implemented and how you can turn a model into a typed form-controls object. A conditional type is an if/else for types — `T extends U ? X : Y` — often with `infer` to pull a type out, like unwrapping the value type of an `Observable<T>` or `Signal<T>`.',
    details: [
      { type: 'heading3', text: 'Mapped type: model → typed form' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface Address { street: string; city: string; zip: string }

// For every key K of T, a FormControl holding that property's type
type ControlsOf<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

const addressForm = new FormGroup<ControlsOf<Address>>({
  street: new FormControl('', { nonNullable: true }),
  city: new FormControl('', { nonNullable: true }),
  zip: new FormControl('', { nonNullable: true }),
});

const city: string = addressForm.controls.city.value; // ✅ typed per field
addressForm.controls.country;
// ❌ error: Property 'country' does not exist on type 'ControlsOf<Address>'`,
      },
      { type: 'heading3', text: 'Modifiers and key remapping' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Mutable<T> = { -readonly [K in keyof T]: T[K] };   // strip readonly
type Nullable<T> = { [K in keyof T]: T[K] | null };      // every field nullable
type FieldValidators<T> = { [K in keyof T]?: (value: T[K]) => string | null };

// "as" renames keys; template literal types build the new names
type ChangeHandlers<T> = {
  [K in keyof T as \`on\${Capitalize<string & K>}Change\`]: (value: T[K]) => void;
};
type AddressHandlers = ChangeHandlers<Address>;
// { onStreetChange: (value: string) => void; onCityChange: …; onZipChange: … }

const validators: FieldValidators<Address> = {
  zip: (zip) => (/^\\d{6}$/.test(zip) ? null : 'Invalid PIN code'), // zip: string
};`,
      },
      { type: 'heading3', text: 'Conditional types with infer' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Unwrap<T> =
  T extends Observable<infer V> ? V :
  T extends Signal<infer V> ? V :
  T extends Promise<infer V> ? V :
  T;

type A = Unwrap<Observable<Address[]>>; // Address[]
type B = Unwrap<Signal<number>>;        // number
type C = Unwrap<string>;                // string (fell through)

// Combined with a mapped type: only the method names of a store
type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];

interface CartStore { count: number; reset(): void; load(id: number): void }
type CartActions = MethodKeys<CartStore>; // 'reset' | 'load'`,
      },
      {
        type: 'paragraph',
        text: 'Conditional types distribute over unions: given `"a" | null`, `T extends null ? never : T` runs once per member and drops `null`. That is exactly how the built-ins `NonNullable<T>`, `Exclude<T, U>` and `Extract<T, U>` work.',
      },
      {
        type: 'bullets',
        items: [
          'Built-ins built this way: `Partial`, `Required`, `Readonly`, `Record`, `Pick` (mapped) and `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited` (conditional).',
          'Use them in shared/library code (form helpers, typed stores, API clients). In feature code, readable named types beat clever type gymnastics.',
          'If a type gets hard to read in tooltips, wrap the result in a named interface or split it into steps.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "mapped = loop over keys, conditional = if/else on types", show that `Partial<T>` is just `{ [K in keyof T]?: T[K] }`, then give one real example such as `ControlsOf<T>` for typed reactive forms.',
      },
    ],
  },

  'satisfies-vs-annotation-vs-as': {
    summary:
      '`satisfies` (TypeScript 4.9+) checks that a value matches a type without changing the type that gets inferred. A type annotation also checks, but it widens the variable to the annotated type, so you lose specific keys and literal values. `as` is an assertion — it does not check that the value is complete, it just tells the compiler to trust you. Use `satisfies` for config objects, label maps, themes and route tables where you want both validation and precise types.',
    details: [
      { type: 'heading3', text: 'Annotation vs as vs satisfies' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type ThemeColors = Record<'primary' | 'surface' | 'danger', string>;

// 1. Annotation — checked, but the variable's type IS ThemeColors from now on
const theme1: ThemeColors = { primary: '#185FA5', surface: '#fff', danger: '#d33' };

// 2. as — NOT checked for completeness; compiles even though two colours are missing
const theme2 = { primary: '#185FA5' } as ThemeColors;

// 3. satisfies — checked, and the precise inferred type is kept
const theme3 = { primary: '#185FA5', surface: '#fff', danger: '#d33' } satisfies ThemeColors;

const theme4 = { primary: '#185FA5', surface: '#fff' } satisfies ThemeColors;
// ❌ error: Type '{ primary: string; surface: string; }' does not satisfy the expected type 'ThemeColors'
//    (Property 'danger' is missing)

const theme5 = { primary: '#185FA5', surface: '#fff', danger: '#d33', dangr: '#f00' } satisfies ThemeColors;
// ❌ error: Object literal may only specify known properties ... Did you mean to write 'danger'?`,
      },
      { type: 'heading3', text: 'Why keeping the inferred type matters' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Status = 'idle' | 'loading' | 'success' | 'error';
type StatusView = { label: string; icon: string; spin?: boolean; retry?: boolean };

const statusConfig = {
  idle: { label: 'Ready', icon: 'ti-clock' },
  loading: { label: 'Loading…', icon: 'ti-loader', spin: true },
  success: { label: 'Done', icon: 'ti-check' },
  error: { label: 'Failed', icon: 'ti-alert-triangle', retry: true },
} satisfies Record<Status, StatusView>; // forget a status → compile error

statusConfig.error.retry;  // ✅ known to exist — no optional chaining needed
statusConfig.eror;         // ❌ error: Property 'eror' does not exist ... Did you mean 'error'?

// With a wide annotation the same typo would compile:
const loose: Record<string, StatusView> = statusConfig;
loose['eror'];             // compiles — undefined at runtime`,
      },
      { type: 'heading3', text: 'as const satisfies — literal types plus a check' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const ROUTE_PATHS = {
  home: '',
  products: 'products',
  productDetail: 'products/:id',
} as const satisfies Record<string, string>;

type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
// '' | 'products' | 'products/:id'

export const routes = [
  { path: ROUTE_PATHS.home, loadComponent: () => import('./home/home').then((m) => m.Home) },
  { path: ROUTE_PATHS.products, title: 'Products', loadComponent: () => import('./products/product-list').then((m) => m.ProductList) },
  { path: '**', redirectTo: '' },
] satisfies Routes;
// a typo such as pathMatch: 'ful' → ❌ Type '"ful"' is not assignable to type '"prefix" | "full" | undefined'`,
      },
      {
        type: 'bullets',
        items: [
          '`satisfies` is purely compile-time — it emits nothing.',
          'Use an annotation when you WANT the wider type (a variable that will be reassigned, a public API return type).',
          "Reserve `as` for cases where you genuinely know more than the compiler (e.g. `document.getElementById('x') as HTMLInputElement`), and treat `as unknown as T` as a code smell.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the one-liner is "annotation checks and widens, `as` trusts and does not check, `satisfies` checks and keeps the inferred type". Then show a `Record<Status, …>` map — a missing key is an error, yet you still get exact keys and autocomplete.',
      },
    ],
  },

  'strict-mode-and-stricttemplates': {
    summary:
      "`strict` is an umbrella flag that turns on the strict family of checks: `strictNullChecks`, `noImplicitAny`, `strictPropertyInitialization`, `strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `useUnknownInCatchVariables` and `strictBuiltinIteratorReturn` (plus `alwaysStrict` historically). `strictTemplates` is the Angular compiler's equivalent for templates: it type-checks input bindings (including null/undefined), outputs and `$event`, local references and control-flow blocks with full types instead of `any`.",
    details: [
      {
        type: 'paragraph',
        text: 'Each sub-flag can be switched off individually (`"strict": true, "strictPropertyInitialization": false`), and new strict checks added in later TypeScript versions join the family automatically — which is why upgrades can surface new errors in strict projects.',
      },
      { type: 'heading3', text: 'What the main strict flags catch' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// strictNullChecks
const admin = users.find((u) => u.id === 1);  // User | undefined
admin.name;                                   // ❌ error: 'admin' is possibly 'undefined'

// noImplicitAny
function total(items) { return items.length; } // ❌ error: Parameter 'items' implicitly has an 'any' type

// strictPropertyInitialization
class ProfileComponent {
  user: User; // ❌ error: Property 'user' has no initializer and is not definitely assigned in the constructor
}

// useUnknownInCatchVariables
try { JSON.parse(raw); } catch (e) {
  e.message;  // ❌ error: 'e' is of type 'unknown'
}

// strictFunctionTypes
type Handler = (u: User | null) => void;
const h: Handler = (u: User) => console.log(u.name);
// ❌ error: Type 'User | null' is not assignable to type 'User'`,
      },
      { type: 'heading3', text: "Angular's template strictness" },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "extendedDiagnostics": {
      "checks": { "optionalChainNotNullable": "error" },
      "defaultCategory": "warning"
    }
  }
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- selected = signal<Product | undefined>(undefined); product = input.required<Product>() -->
<app-product-card [product]="selected()" />
<!-- ❌ error: Type 'Product | undefined' is not assignable to type 'Product'. -->

<app-product-card [product]="'pen'" />
<!-- ❌ error: Type 'string' is not assignable to type 'Product'. -->`,
      },
      {
        type: 'bullets',
        items: [
          '`strictTemplates` turns on the template sub-checks: `strictInputTypes`, `strictNullInputTypes`, `strictAttributeTypes`, `strictOutputEventTypes`, `strictDomEventTypes`, `strictSafeNavigationTypes`, `strictDomLocalRefTypes`, `strictContextGenerics` and `strictLiteralTypes`. Each can be relaxed on its own.',
          '`strictInjectionParameters`: error when a constructor parameter cannot be resolved for DI instead of silently failing at runtime.',
          '`strictInputAccessModifiers`: respects `private`/`protected`/`readonly` when binding to inputs.',
          '`extendedDiagnostics` (requires `strictTemplates`): extra template lint checks such as `invalidBananaInBox`, `nullishCoalescingNotNullable`, `optionalChainNotNullable`, `interpolatedSignalNotInvoked` and `missingControlFlowDirective`.',
          '`alwaysStrict` (emit "use strict") used to be listed under `strict`; in TypeScript 6.0 it is always on and setting it to `false` is deprecated.',
          'Newer defaults: from TypeScript 6.0 `strict` is on unless you set it to `false`, and recent Angular compilers (e.g. v22) treat `strictTemplates` as on unless set to `false` — new CLI projects only write these flags out when you opt out.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Turning strict on in a legacy app produces a wall of errors. Enable it per flag (start with `strictNullChecks` and `strictTemplates`), fix module by module, and avoid "fixing" errors by sprinkling `!` and `as any`.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: list four or five strict flags with the bug each prevents, then explain that TypeScript strictness stops at the `.ts` file — without `strictTemplates`, a wrong input binding in HTML would still compile.',
      },
    ],
  },

  'optional-chaining-nullish-non-null': {
    summary:
      'Use `?.` when a value can legitimately be null or undefined and "nothing" is an acceptable result — it short-circuits instead of throwing. Use `??` to supply a default only for null/undefined, unlike `||` which also replaces 0, "" and false. Use `!` rarely: it only silences the compiler and does nothing at runtime, so prefer narrowing, a thrown error, or APIs like `viewChild.required()` that are typed as non-null.',
    details: [
      { type: 'heading3', text: 'Optional chaining ?.' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const city = user?.address?.city;         // string | undefined — stops at the first null/undefined
const initial = user?.name.toUpperCase(); // name is required on User, so one ?. is enough
config.onSave?.();                        // optional call — only if the callback exists
const firstTag = product?.tags?.[0];      // optional element access`,
      },
      { type: 'heading3', text: 'Nullish coalescing ?? vs ||' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const pageSize = settings?.pageSize ?? 20;      // 0 stays 0 ✅
const buggy = settings?.pageSize || 20;         // 0 becomes 20 ❌ bug
const nickname = user?.nickname ?? user?.name ?? 'Guest'; // '' stays ''

cache ??= new Map<number, User>();              // assign only if null/undefined`,
      },
      { type: 'heading3', text: 'Avoiding the non-null assertion' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-product-detail', template: '<input #search />' })
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);

  // paramMap.get() returns string | null — handle it, don't assert it
  productId = Number(this.route.snapshot.paramMap.get('id') ?? 0);

  // ✅ typed as Signal<ElementRef<HTMLInputElement>> — no ! needed
  search = viewChild.required<ElementRef<HTMLInputElement>>('search');

  // ⚠️ legacy definite-assignment pattern: "trust me, it's set later"
  legacyId!: number;
}

const u1 = users.find((u) => u.id === 1)!;  // User — crashes later if not found
const u2 = users.find((u) => u.id === 1);
if (!u2) throw new Error('User 1 not found');
u2.name;                                    // narrowed — safe and self-documenting`,
      },
      {
        type: 'bullets',
        items: [
          "In templates `?.` is the safe navigation operator: `{{ user()?.address?.city }}`. With `strictTemplates`, Angular's extended diagnostics warn when you use `?.` or `??` on something that can never be null (`optionalChainNotNullable`, `nullishCoalescingNotNullable`).",
          'Do not chain `?.` everywhere "just in case" — it hides bugs where a value should always exist. Fix the type instead.',
          '`!` is acceptable when you truly know more than the compiler (a value set in `ngOnInit` by framework guarantee, test setup), ideally with a comment.',
          'Prefer `input.required()`, `viewChild.required()` and `inject()` over `!:` fields — they are non-null by type.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the `||` vs `??` difference with `0` or an empty string is the classic follow-up — have that example ready. And describe `!` as "a promise to the compiler, not a runtime check".',
      },
    ],
  },

  'typing-httpclient-get-t-responses': {
    summary:
      '`http.get<User[]>(url)` tells TypeScript what the JSON will look like, and you get an `Observable<User[]>` with full autocomplete. But generics are erased at compile time — Angular just parses JSON and hands it to you, so if the backend changes a field, the app still believes the old type and fails later in a confusing place. For data you do not fully control, type the response as a DTO (or `unknown`), validate it with a type guard or a schema library, and map it into your own domain model inside the service.',
    details: [
      { type: 'heading3', text: 'The generic is an assertion, not a check' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class ProductApi {
  private http = inject(HttpClient);

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(\`/api/products/\${id}\`);
  }
}

// Backend now sends { "id": "42", "title": "Pen", "price": "19.99" }
// Still typed as Product → product.price.toFixed(2) compiles,
// then throws "toFixed is not a function" at runtime.`,
      },
      { type: 'heading3', text: 'Separate the DTO from the domain model' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// What the API sends
interface ProductDto {
  product_id: number;
  title: string;
  price_cents: number;
  discount_cents: number | null;
  created_at: string; // ISO date
}

// What components work with
export interface Product {
  id: number;
  name: string;
  price: number;
  finalPrice: number;
  createdAt: Date;
}

function toProduct(dto: ProductDto): Product {
  const price = dto.price_cents / 100;
  return {
    id: dto.product_id,
    name: dto.title,
    price,
    finalPrice: price - (dto.discount_cents ?? 0) / 100,
    createdAt: new Date(dto.created_at),
  };
}`,
      },
      { type: 'heading3', text: 'Option 1: a hand-written type guard' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function isProductDto(value: unknown): value is ProductDto {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['product_id'] === 'number' &&
    typeof v['title'] === 'string' &&
    typeof v['price_cents'] === 'number' &&
    (v['discount_cents'] === null || typeof v['discount_cents'] === 'number') &&
    typeof v['created_at'] === 'string'
  );
}

getProduct(id: number): Observable<Product> {
  return this.http.get<unknown>(\`/api/products/\${id}\`).pipe(
    map((body) => {
      if (!isProductDto(body)) throw new Error(\`Unexpected product payload for id \${id}\`);
      return toProduct(body);
    }),
  );
}`,
      },
      { type: 'heading3', text: 'Option 2: a schema library (e.g. Zod)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { z } from 'zod';

const ProductDtoSchema = z.object({
  product_id: z.number(),
  title: z.string(),
  price_cents: z.number().int(),
  discount_cents: z.number().nullable(),
  created_at: z.string(),
});
type ProductDto = z.infer<typeof ProductDtoSchema>; // type derived from the schema

list(): Observable<Product[]> {
  return this.http
    .get<unknown>('/api/products')
    .pipe(map((body) => z.array(ProductDtoSchema).parse(body).map(toProduct))); // throws on mismatch
}

// httpResource has a parse hook for the same job
product = httpResource(() => \`/api/products/\${this.productId()}\`, {
  parse: (raw) => toProduct(ProductDtoSchema.parse(raw)),
}); // product.value(): Product | undefined, product.error() set if parsing throws`,
      },
      {
        type: 'flow',
        title: 'Where types become trustworthy',
        code: `flowchart LR
  API["Backend JSON"]:::external --> HC["HttpClient.get, typed as unknown<br/>(no runtime check)"]:::network
  HC --> V{"Validate<br/>guard or schema"}:::security
  V -->|valid| M["Map DTO → domain model"]:::server
  V -->|invalid| E["Throw / log error<br/>show error state"]:::highlight
  M --> C["Components & signals<br/>(fully typed)"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          'Angular does not ship a schema validator — Zod, Valibot or a generated client from an OpenAPI spec are common choices.',
          'Validation has a cost; many teams validate at the boundary in development and for third-party APIs, and rely on generated types for their own backend.',
          'Keep components unaware of the wire format: only the service knows about snake_case fields, cents and ISO strings.',
          'Interceptors work on `HttpEvent<unknown>` — they are a good place for generic concerns (auth, errors), not per-endpoint typing.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say clearly that `get<T>` is "a cast with nicer syntax" because types are erased at runtime. Then describe the boundary pattern — DTO in, validate, map to a domain model — and name a guard or schema library as the runtime check.',
      },
    ],
  },

  'typing-async-functions-and-promises': {
    summary:
      'An `async` function always returns a Promise, so its return type is `Promise<T>` where `T` is what you `return` — e.g. `async function getUser(id: string): Promise<User | null>`. `await` unwraps `Promise<T>` to `T`. Use `Awaited<T>` to unwrap types, type `new Promise<T>` explicitly, and treat rejections as `unknown` because TypeScript does not type what a promise rejects with.',
    details: [
      {
        type: 'code',
        lang: 'typescript',
        code: `interface User { id: string; email: string }

async function getUser(id: string): Promise<User | null> {
  const row = await db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return row[0] ?? null;           // returning User | null is wrapped automatically
}

const user = await getUser('1');   // user: User | null

// Async arrow functions and callbacks
const handler = async (req: Request): Promise<Response> => new Response('ok');

// A void-returning async function
async function sendEmail(to: string): Promise<void> {
  await mailer.send({ to, subject: 'Welcome' });
}`,
      },
      { type: 'heading3', text: 'Wrapping callback APIs' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { promisify } from 'node:util';
import { scrypt as scryptCb, randomBytes } from 'node:crypto';

// promisify keeps types for most core APIs
const scrypt = promisify(scryptCb) as (pwd: string, salt: Buffer, len: number) => Promise<Buffer>;

// Manual wrapping — give new Promise a type argument
function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function readJson<T>(path: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, text) => {
      if (err) return reject(err);
      resolve(JSON.parse(text) as T);
    });
  });
}`,
      },
      { type: 'heading3', text: 'Deriving and combining types' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type UserResult = Awaited<ReturnType<typeof getUser>>; // User | null

// Promise.all preserves tuple types
const [u, orders] = await Promise.all([getUser('1'), getOrders('1')]);
// u: User | null, orders: Order[]

// allSettled results are a discriminated union
const results = await Promise.allSettled([getUser('1')]);
for (const r of results) {
  if (r.status === 'fulfilled') r.value;  // User | null
  else r.reason;                          // any — treat as unknown
}`,
      },
      { type: 'heading3', text: 'Errors are not part of the type' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Promise<T> says nothing about rejection types. If you want typed failures,
// return a result union instead of throwing:
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function chargeCard(amount: number): Promise<Result<string, 'DECLINED' | 'TIMEOUT'>> {
  // ...
  return { ok: false, error: 'DECLINED' };
}`,
      },
      {
        type: 'bullets',
        items: [
          'Enable `@typescript-eslint/no-floating-promises` and `no-misused-promises` to catch un-awaited promises and async callbacks passed where void is expected (e.g. `arr.forEach(async ...)`).',
          'Async generators are typed as `AsyncGenerator<Yield, Return, Next>` or simply `AsyncIterable<T>`.',
          'Do not annotate `async function f(): User` — the return type must be a Promise type.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: floating promises — calling an async function without `await` or `.catch()`. The error becomes an unhandled rejection, which crashes the process by default in modern Node. The `no-floating-promises` lint rule prevents this.',
      },
    ],
  },

  decorators: {
    summary:
      'Decorators are functions applied with `@name` to classes, methods, accessors, fields (and, in the legacy implementation, parameters) to add metadata or wrap behaviour declaratively. Node frameworks like **NestJS**, TypeORM and class-validator rely on them (`@Controller`, `@Get`, `@Injectable`, `@Entity`, `@IsEmail`). TypeScript 5.0+ supports standard (TC39) decorators by default; many frameworks still use the older `experimentalDecorators` mode together with `emitDecoratorMetadata`.',
    details: [
      {
        type: 'paragraph',
        text: 'A decorator is just a function called at class-definition time with information about what it decorates. It can return a replacement (e.g. a wrapped method) or register metadata that a framework reads later — that is how NestJS knows which method handles `GET /users`.',
      },
      { type: 'heading3', text: 'How you meet them in NestJS' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {} // DI via constructor metadata

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }
}

export class CreateUserDto {
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
}`,
      },
      { type: 'heading3', text: 'Writing a method decorator (standard decorators, TS 5+)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function logTime<This, Args extends unknown[], R>(
  target: (this: This, ...args: Args) => Promise<R>,
  context: ClassMethodDecoratorContext<This>,
) {
  const name = String(context.name);
  return async function (this: This, ...args: Args): Promise<R> {
    const start = performance.now();
    try {
      return await target.apply(this, args);
    } finally {
      console.log(name + ' took ' + (performance.now() - start).toFixed(1) + ' ms');
    }
  };
}

class ReportService {
  @logTime
  async build(month: string) {
    /* heavy query */
  }
}

await new ReportService().build('2026-10'); // "build took 182.4 ms"`,
      },
      { type: 'heading3', text: 'Legacy (experimental) decorators' },
      {
        type: 'code',
        lang: 'json',
        code: `// tsconfig.json — required by NestJS, TypeORM, class-validator, Inversify
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Standard decorators**: signature `(value, context)`; no parameter decorators; no automatic type metadata.',
          '**Legacy decorators**: signature `(target, key, descriptor)`; support parameter decorators (`@Param()`, `@Inject()`); with `emitDecoratorMetadata` the compiler emits constructor parameter types via `reflect-metadata`, which powers DI.',
          'The two modes are not interchangeable — pick the one your framework expects.',
          'Decorators run once at class definition, not per instance or per call (the wrapper they return runs per call).',
          "Node's built-in type stripping does not transform decorators — run decorator-based code through `tsc`/SWC.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain decorators as "metadata + wrapping at definition time", show a NestJS example, and mention the legacy vs standard split — interviewers like hearing why NestJS needs `experimentalDecorators` and `emitDecoratorMetadata`.',
      },
    ],
  },
};
