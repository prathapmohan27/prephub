import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'How do you set up TypeScript in a Node.js project?': {
    summary:
      'Install `typescript` and `@types/node` as dev dependencies, create a `tsconfig.json` with Node-appropriate settings (`"module": "nodenext"`, a modern `target`, `strict: true`, `outDir`/`rootDir`), compile with `tsc` to JavaScript for production, and use a fast runner like `tsx` (or Node\'s built-in type stripping in recent versions) during development.',
    details: [
      {
        type: 'paragraph',
        text: 'TypeScript is a compile-time tool: Node ultimately runs JavaScript. The setup is about three things — getting type checking right (tsconfig + Node types), a fast dev loop, and a clean build output for production.',
      },
      { type: 'heading3', text: '1. Install and initialise' },
      {
        type: 'code',
        lang: 'bash',
        code: `mkdir orders-api && cd orders-api
npm init -y
npm pkg set type=module            # use ES modules
npm i -D typescript @types/node tsx
npx tsc --init`,
      },
      { type: 'heading3', text: '2. tsconfig.json for Node' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": false,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"]
}`,
      },
      {
        type: 'bullets',
        items: [
          "`module`/`moduleResolution: NodeNext` makes TypeScript follow Node's real ESM/CJS rules — including requiring `.js` extensions in relative imports (`import { db } from './db.js'` even though the file is `db.ts`).",
          'Match `@types/node` to the Node major version you run in production.',
          'Shared base configs such as `@tsconfig/node22` give sensible defaults you can extend.',
        ],
      },
      { type: 'heading3', text: '3. Scripts' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "typecheck": "tsc --noEmit",
    "build": "tsc",
    "start": "node --enable-source-maps dist/server.js"
  }
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// src/server.ts
import http from 'node:http';
import { getOrders } from './orders.js'; // .js extension with NodeNext

const port = Number(process.env.PORT ?? 3000);

http
  .createServer(async (_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(await getOrders()));
  })
  .listen(port, () => console.log('listening on', port));`,
      },
      { type: 'heading3', text: 'Running .ts directly' },
      {
        type: 'bullets',
        items: [
          '**tsx** (esbuild-based) and **ts-node** run TypeScript without a separate build — great for development. They strip types and do not type-check; run `tsc --noEmit` in CI.',
          'Recent Node releases can also run `.ts` files directly using built-in **type stripping** (introduced behind a flag in Node 22 and enabled by default in newer releases). It only supports erasable syntax — no `enum`, `namespace` or constructor parameter properties — and does not type-check.',
          'For production, compiling to JS with `tsc` (or bundling with esbuild/tsup) is still the most common, predictable approach.',
        ],
      },
      {
        type: 'flow',
        title: 'Dev vs production pipeline',
        code: `flowchart LR
  SRC["src/*.ts"]:::client --> DEV["tsx watch<br/>fast, no type-check"]:::highlight
  SRC --> TC["tsc --noEmit<br/>type-check in CI"]:::security
  SRC --> BUILD["tsc build"]:::server
  BUILD --> DIST["dist/*.js + source maps"]:::db
  DIST --> RUN["node dist/server.js"]:::server`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention the `.js` extension rule with NodeNext and that dev runners do not type-check — these are the two things people get wrong in real projects.',
      },
    ],
  },

  'What is the difference between interface and type alias in TypeScript?': {
    summary:
      "Both can describe object shapes and are mostly interchangeable for that. An `interface` can be extended with `extends` and re-opened via **declaration merging** (used for module augmentation, e.g. adding `user` to Express's `Request`). A `type` alias can name **any** type — unions, intersections, tuples, primitives, function types, mapped and conditional types — but cannot be re-declared. Common convention: interfaces for object contracts, types for unions and type-level logic.",
    details: [
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

  'What is the difference between unknown and any in TypeScript?': {
    summary:
      'Both can hold any value, but `any` switches off type checking — you can call, access or assign anything, and errors surface only at runtime. `unknown` is the type-safe counterpart: you can assign anything to it, but you cannot use the value until you **narrow** it (with `typeof`, `instanceof`, a type guard or a schema validator). Use `unknown` for untrusted data like `JSON.parse` results, request bodies and caught errors.',
    details: [
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

  'What are generics in TypeScript and how do they improve type safety?': {
    summary:
      'Generics are type parameters (`<T>`) that let you write a function, class or interface once and have it work with many types while **preserving** the specific type the caller uses. Unlike `any`, the type information flows from input to output, so the compiler still catches mistakes — e.g. a generic `Repository<User>` returns `User`, not `any`.',
    details: [
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

  'What are TypeScript utility types? (Partial, Pick, Omit, Record, Readonly)': {
    summary:
      'Utility types are built-in generic types that transform existing types so you do not have to redeclare them. `Partial<T>` makes all properties optional, `Pick<T, K>` keeps only the listed keys, `Omit<T, K>` removes the listed keys, `Record<K, V>` builds an object type with keys `K` and values `V`, and `Readonly<T>` makes all properties read-only. They keep DTOs and models in sync with a single source of truth.',
    details: [
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

  'How do you type async functions and Promises in TypeScript?': {
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

  'What are TypeScript decorators and how are they used?': {
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

  'What is the difference between namespace and module in TypeScript?': {
    summary:
      'A **module** is any file with a top-level `import` or `export`; it has its own scope and is loaded by the runtime\'s module system (ESM or CommonJS). A **namespace** (`namespace Foo { ... }`, formerly "internal module") is a TypeScript-only construct that groups code under a named object in the global or enclosing scope. Modern code should use ES modules; namespaces survive mainly in declaration files (`.d.ts`) and for augmenting global types like `NodeJS.ProcessEnv`.',
    details: [
      {
        type: 'paragraph',
        text: "Namespaces predate ES modules — they were TypeScript's way of avoiding global name collisions when everything was loaded with `<script>` tags. ES modules solve the same problem natively, with better tooling: tree-shaking, static analysis, and native support in Node and browsers.",
      },
      { type: 'heading3', text: 'Module (recommended)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// src/validation/email.ts
export function isEmail(s: string): boolean {
  return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(s);
}

// src/app.ts
import { isEmail } from './validation/email.js';
isEmail('dev@example.com'); // true`,
      },
      { type: 'heading3', text: 'Namespace (legacy pattern)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `namespace Validation {
  export function isEmail(s: string): boolean { return s.includes('@'); }
  const internal = 'not exported'; // private to the namespace
}

Validation.isEmail('a@b.c');

// Compiles to an IIFE that builds an object:
// var Validation;
// (function (Validation) { function isEmail(s) {...} Validation.isEmail = isEmail; })(Validation || (Validation = {}));`,
      },
      { type: 'heading3', text: 'Where namespaces are still legitimately used' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Typing environment variables — @types/node declares the NodeJS namespace
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      JWT_SECRET: string;
    }
  }
}
export {};

// Declaration files for libraries that expose a global object
declare namespace MyLegacySdk {
  function init(key: string): void;
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Scope**: module → file scope, imported explicitly; namespace → a named object, possibly global.',
          '**Runtime**: modules are handled by Node/bundlers; namespaces compile into IIFEs and plain objects.',
          '**Tree-shaking**: works with modules, effectively not with namespaces.',
          '**Merging**: namespaces can merge with each other, classes, functions and enums — useful in `.d.ts` files.',
          "Non-declare namespaces are not erasable syntax, so Node's built-in type stripping and `--erasableSyntaxOnly` reject them.",
          "`declare module 'pkg' { ... }` is **module augmentation/ambient module declaration**, not a namespace — a common naming confusion.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "use ES modules for code organisation; namespaces only appear in type declarations, like augmenting `NodeJS.ProcessEnv`." That one sentence covers what interviewers want.',
      },
    ],
  },
};
