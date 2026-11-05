import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Difference between Type and Interface': {
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
    ],
  },

  'What are Generics in TypeScript?': {
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
    ],
  },
};
