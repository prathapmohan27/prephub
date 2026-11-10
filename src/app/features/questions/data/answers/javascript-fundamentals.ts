import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'es6-features': {
    summary:
      'ES6 (ES2015) was the biggest update to JavaScript: block-scoped `let`/`const`, arrow functions, classes, template literals, destructuring, default/rest/spread parameters, ES modules (`import`/`export`), Promises, iterators and `for...of`, generators, `Map`/`Set`/`WeakMap`, Symbols and Proxy/Reflect.',
    details: [
      {
        type: 'paragraph',
        text: 'Before ES6, JavaScript had only function scope, prototype-based "classes" written by hand, callback-based async code and no native module system. ES6 introduced the syntax almost all modern code — including every Angular app — is built on.',
      },
      { type: 'heading3', text: 'Variables, functions and strings' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// let / const — block scoped
const API = '/api';
let count = 0;

// Arrow functions — short syntax + lexical this
const double = (n) => n * 2;

// Default, rest parameters
function greet(name = 'Guest', ...tags) {
  // Template literal with interpolation
  return \`Hello \${name} [\${tags.join(', ')}]\`;
}
greet();                 // 'Hello Guest []'
greet('Asha', 'admin');  // 'Hello Asha [admin]'`,
      },
      { type: 'heading3', text: 'Destructuring and spread' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const user = { id: 1, name: 'Asha', role: 'admin' };
const { name, role = 'user' } = user;        // object destructuring + default
const [first, , third] = [10, 20, 30];       // array destructuring → 10, 30

const copy = { ...user, role: 'editor' };    // object spread (ES2018 for objects)
const merged = [...[1, 2], ...[3, 4]];       // array spread → [1, 2, 3, 4]`,
      },
      { type: 'heading3', text: 'Classes, modules and Promises' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// user.service.js
export class UserService {
  constructor(http) { this.http = http; }
  static create(http) { return new UserService(http); }
  getUser(id) {
    return new Promise((resolve, reject) => {
      this.http.get(\`/users/\${id}\`, (err, data) => (err ? reject(err) : resolve(data)));
    });
  }
}

// main.js
import { UserService } from './user.service.js';
const service = UserService.create(http);`,
      },
      { type: 'heading3', text: 'New collections, iteration and meta-programming' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const seen = new Set([1, 2, 2, 3]);   // Set {1, 2, 3}
const cache = new Map();
cache.set({ id: 1 }, 'any value');    // keys can be objects

for (const n of seen) console.log(n); // for...of works on any iterable

function* ids() { let i = 0; while (true) yield i++; }
const gen = ids(); gen.next().value;  // 0

const id = Symbol('id');              // unique property key

const logged = new Proxy({}, {
  set(target, key, value) { console.log('set', key); target[key] = value; return true; },
});`,
      },
      {
        type: 'bullets',
        items: [
          '`async/await` is NOT ES6 — it arrived in ES2017. Object spread is ES2018. Interviewers sometimes check this.',
          '`let`/`const` fix the hoisting and loop-closure bugs of `var`.',
          'ES modules are static (`import` at top level), which enables tree-shaking in Angular builds.',
          'Classes are syntactic sugar over prototypes — inheritance still uses the prototype chain.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: list 6–8 features, then go deeper on two you use daily (e.g. destructuring in component code and Promises/modules) with a quick example. Breadth plus one concrete example beats a long list.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: What is the latest JavaScript version you have used?' },
      {
        type: 'paragraph',
        text: 'JavaScript is standardised as ECMAScript and has shipped a new edition every year since ES2015 (ES6). Day to day I use modern ES2020+ features — optional chaining, nullish coalescing, `async/await`, top-level `await` in ES modules, `Array.prototype.at()`, `structuredClone`, and newer additions like `findLast()` and the non-mutating `toSorted()`/`toReversed()` — with the exact target controlled by TypeScript and the build tool.',
      },
      {
        type: 'paragraph',
        text: 'This is partly a knowledge question and partly an experience question. The interviewer wants to know that you understand JavaScript evolves yearly through TC39, that you know the features you actually use, and that you understand how the code you write maps to what browsers run (the build "target").',
      },
      { type: 'heading3', text: 'How versions work' },
      {
        type: 'bullets',
        items: [
          '**ES5 (2009)** — the old baseline: `var`, function scope, `prototype`-based classes.',
          '**ES2015 / ES6** — the big release: `let/const`, arrow functions, classes, modules, promises, destructuring, template literals.',
          '**ES2016+** — one smaller release per year, named by year (ES2017, ES2018 …). A feature lands when it reaches **Stage 4** in the TC39 process.',
          'Browsers implement features individually, so "which version" matters less than "which features are supported by my target browsers".',
        ],
      },
      { type: 'heading3', text: 'Modern features worth mentioning (with the year they landed)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ES2017 — async/await
const user = await fetch('/api/user').then((r) => r.json());

// ES2020 — optional chaining + nullish coalescing
const city = user?.address?.city ?? 'Unknown';

// ES2021 — logical assignment, numeric separators, replaceAll
config.retries ??= 3;
const budget = 1_000_000;
'a-b-c'.replaceAll('-', '/'); // 'a/b/c'

// ES2022 — top-level await (in modules), .at(), private class fields, Object.hasOwn
const last = [1, 2, 3].at(-1); // 3
class Counter { #count = 0; inc() { return ++this.#count; } }

// ES2023 — findLast and non-mutating array copies
const nums = [3, 1, 2];
const sorted = nums.toSorted(); // [1, 2, 3]  — nums is still [3, 1, 2]
nums.findLast((n) => n > 1);    // 2

// ES2024 — Object.groupBy, Promise.withResolvers
const byRole = Object.groupBy(users, (u) => u.role);
const { promise, resolve } = Promise.withResolvers();`,
      },
      { type: 'heading3', text: 'How it relates to your Angular/TypeScript project' },
      {
        type: 'paragraph',
        text: 'In an Angular project you write TypeScript; `tsconfig.json` sets `target` (e.g. `ES2022`) and `lib`, and the Angular CLI (esbuild) produces output for the browsers listed in `.browserslistrc`. So you can use new syntax while still supporting your target browsers — but new **runtime APIs** (like `Object.groupBy`) are not down-levelled and need either browser support or a polyfill.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Sample answer: "I mainly write TypeScript compiled to an ES2022 target, so I use ES2022-era features daily — optional chaining, `??`, async/await, private `#fields`, `.at()` — and some ES2023 additions like `toSorted()`. I check browser support for newer runtime APIs before using them." Name features you have really used rather than reciting a version number.',
      },
    ],
  },

  'var-vs-let-vs-const': {
    summary:
      '`var` is function-scoped, hoisted and initialised to `undefined`, and can be re-declared. `let` and `const` are block-scoped, hoisted but stay in the Temporal Dead Zone until their declaration line, and cannot be re-declared in the same scope. `const` additionally cannot be reassigned — but the object it points to can still be mutated.',
    details: [
      {
        type: 'paragraph',
        text: 'The three keywords differ in four ways: scope, hoisting behaviour, whether you can re-declare, and whether you can reassign. Modern code uses `const` by default, `let` when the value must change, and avoids `var`.',
      },
      { type: 'heading3', text: 'Scope: function vs block' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function demo() {
  if (true) {
    var a = 1;   // function-scoped
    let b = 2;   // block-scoped
    const c = 3; // block-scoped
  }
  console.log(a); // 1
  console.log(b); // ❌ ReferenceError: b is not defined
}`,
      },
      { type: 'heading3', text: 'Hoisting and the TDZ' },
      {
        type: 'code',
        lang: 'javascript',
        code: `console.log(x); // undefined — var is hoisted AND initialised to undefined
var x = 5;

console.log(y); // ❌ ReferenceError: Cannot access 'y' before initialization
let y = 5;      // let/const are hoisted but uninitialised (TDZ)`,
      },
      { type: 'heading3', text: 'Re-declaration and reassignment' },
      {
        type: 'code',
        lang: 'javascript',
        code: `var n = 1;
var n = 2;      // ✅ allowed (easy to cause bugs)

let m = 1;
let m = 2;      // ❌ SyntaxError: Identifier 'm' has already been declared
m = 3;          // ✅ reassignment is fine

const user = { name: 'Asha' };
user.name = 'Ravi'; // ✅ mutation is allowed — the binding is constant, not the value
user = {};          // ❌ TypeError: Assignment to constant variable
const z;            // ❌ SyntaxError: const must be initialised`,
      },
      { type: 'heading3', text: 'The classic loop bug' },
      {
        type: 'code',
        lang: 'javascript',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 3, 3, 3 — one shared i
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j)); // 0, 1, 2 — a new j per iteration
}`,
      },
      {
        type: 'bullets',
        items: [
          '`var` at the top level of a script creates a property on `window`; `let`/`const` do not.',
          '**Scope:** `var` → function; `let`/`const` → block `{}`.',
          '**Hoisting:** all three are hoisted; only `var` is initialised (to `undefined`).',
          '**Reassign:** `var` ✅, `let` ✅, `const` ❌. **Re-declare:** only `var`.',
          'Use `Object.freeze()` if you need the object itself to be immutable (shallow).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: saying "`const` makes a value immutable". It only prevents reassigning the variable. `const arr = []; arr.push(1)` works fine.',
      },
    ],
  },

  'temporal-dead-zone-and-hoisting': {
    summary:
      'The TDZ is the period between entering a scope and reaching the line where a `let`, `const` (or `class`) variable is declared. The variable is hoisted — the engine knows it exists — but it is uninitialised, so any access during the TDZ throws a `ReferenceError` instead of quietly returning `undefined` like `var` does.',
    details: [
      {
        type: 'paragraph',
        text: 'A common misconception is that `let` and `const` are "not hoisted". They are: when a block starts, the engine creates bindings for all its declarations. The difference is initialisation — `var` bindings start as `undefined`, while `let`/`const`/`class` bindings stay uninitialised until execution reaches the declaration. That uninitialised window is the TDZ.',
      },
      { type: 'heading3', text: 'Proof that let is hoisted' },
      {
        type: 'code',
        lang: 'javascript',
        code: `let value = 'outer';
{
  // If let were NOT hoisted, this would print 'outer'.
  // Instead the inner 'value' is already in scope — but in its TDZ.
  console.log(value); // ❌ ReferenceError: Cannot access 'value' before initialization
  let value = 'inner';
}`,
      },
      { type: 'heading3', text: 'TDZ is about time, not position' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function read() {
  return total; // refers to the outer let
}

// read();      // ❌ would throw here — total is still in the TDZ
let total = 10;
read();         // ✅ 10 — the TDZ ended when the declaration line ran`,
      },
      { type: 'heading3', text: 'Other places the TDZ shows up' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// typeof is NOT safe in the TDZ
typeof undeclaredVar; // 'undefined' (never declared — fine)
typeof x;             // ❌ ReferenceError
let x = 1;

// Default parameters have their own TDZ (left to right)
function f(a = b, b = 2) {} // f() → ❌ ReferenceError: b in TDZ

// Classes are in the TDZ too
new Person(); // ❌ ReferenceError
class Person {}`,
      },
      {
        type: 'flow',
        title: 'Lifecycle of a let/const binding',
        code: `stateDiagram-v2
  [*] --> Hoisted: scope entered
  Hoisted --> TDZ: binding created, uninitialised
  TDZ --> Error: accessed before declaration
  TDZ --> Initialised: declaration line runs
  Initialised --> Initialised: read / write (let)
  Error --> [*]`,
        text: '`var` skips the TDZ state: it goes straight from hoisted to initialised with `undefined`.',
      },
      {
        type: 'bullets',
        items: [
          'Why it exists: catches use-before-declare bugs early and makes `const` meaningful (a const can never be observed as `undefined` and then change).',
          'Function declarations are fully hoisted (callable before their line); function **expressions** assigned to `let`/`const` are in the TDZ.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "let and const ARE hoisted, but not initialised" — then show the inner-block example. That one sentence separates a confident answer from a memorised one.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the Temporal Dead Zone (TDZ) in JavaScript and why does accessing let and const before declaration throw a ReferenceError?',
      },
      {
        type: 'paragraph',
        text: "`let`, `const` and `class` declarations **are hoisted** — the engine knows about the binding from the start of its scope — but they are **not initialised** until the declaration line executes. The period between entering the scope and that line is the Temporal Dead Zone; touching the variable there throws `ReferenceError: Cannot access 'x' before initialization`. `var`, by contrast, is initialised to `undefined` when hoisted, so early access silently returns `undefined`.",
      },
      {
        type: 'paragraph',
        text: 'The TDZ exists to catch bugs: reading a variable before it has a meaningful value is almost always a mistake, and `const` would be meaningless if you could observe it as `undefined` and then as its real value. It is "temporal" because it depends on execution time, not on where code is written.',
      },
      { type: 'heading3', text: 'var vs let/const' },
      {
        type: 'code',
        lang: 'javascript',
        code: `console.log(a); // undefined — var is hoisted AND initialised
var a = 1;

console.log(b); // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 2;

// Proof that let IS hoisted — the inner b shadows the outer one for the whole block
let c = 'outer';
{
  console.log(c); // ❌ ReferenceError (not 'outer') — inner c is in its TDZ
  let c = 'inner';
}`,
      },
      { type: 'heading3', text: 'Temporal, not positional' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function logLimit() {
  console.log(LIMIT); // defined above the const — but only CALLED later
}
const LIMIT = 100;
logLimit(); // ✅ 100 — the declaration ran before the call

// typeof is not safe in the TDZ either
typeof undeclared;   // 'undefined'
typeof later;        // ❌ ReferenceError
let later = 1;`,
      },
      { type: 'heading3', text: 'Where it bites in Node' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Circular ES module imports
// a.mjs
import { b } from './b.mjs';
export const a = 'A';

// b.mjs
import { a } from './a.mjs';
console.log(a); // ❌ ReferenceError — a.mjs has not finished evaluating, a is in its TDZ
export const b = 'B';

// Default parameters have their own TDZ as well
function f(x = y, y = 1) {}
f(); // ❌ ReferenceError — y is used before it is initialised`,
      },
      {
        type: 'bullets',
        items: [
          'Hoisting summary: `var` → hoisted + `undefined`; `let`/`const`/`class` → hoisted, uninitialised (TDZ); function declarations → hoisted with their body.',
          'The TDZ turns subtle ordering bugs into immediate, loud errors.',
          'In CommonJS, circular requires give you a partially filled `exports` object instead; in ESM they can surface as TDZ errors.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common wrong answer: "let and const are not hoisted." They are hoisted — the shadowing example proves it. The correct statement is that they are hoisted but not initialised.',
      },
    ],
  },

  'loose-vs-strict-equality': {
    summary:
      '`===` (strict equality) compares value and type with no conversion. `==` (loose equality) first coerces the operands to a common type using the Abstract Equality rules, which leads to surprising results like `0 == ""` being `true`. Use `===` by default; the one idiomatic use of `==` is `x == null` to check for both `null` and `undefined`.',
    details: [
      {
        type: 'paragraph',
        text: "Both operators return a boolean, but `==` performs type coercion before comparing. The rules are well defined but hard to remember, so most style guides (and ESLint's `eqeqeq` rule) require `===`.",
      },
      { type: 'heading3', text: 'Examples' },
      {
        type: 'code',
        lang: 'javascript',
        code: `1 === 1        // true
1 === '1'      // false — different types
1 == '1'       // true  — '1' converted to number 1

0 == ''        // true  — '' → 0
0 == '0'       // true
'' == '0'      // false — both strings, compared directly (not transitive!)

false == 0     // true  — boolean → number
false == 'false' // false — false → 0, 'false' → NaN

null == undefined  // true  — special rule
null === undefined // false
null == 0          // false — null only loosely equals undefined

NaN == NaN     // false — NaN is never equal to anything
NaN === NaN    // false → use Number.isNaN(x) or Object.is(x, NaN)

[] == false    // true  — [] → '' → 0, false → 0
[1] == 1       // true  — [1] → '1' → 1`,
      },
      { type: 'heading3', text: 'Simplified coercion rules for ==' },
      {
        type: 'numbered',
        items: [
          'Same type → compare like `===`.',
          '`null == undefined` is true; neither equals anything else.',
          'Number vs string → convert the string to a number.',
          'Boolean vs anything → convert the boolean to a number (true → 1, false → 0) first.',
          'Object vs primitive → convert the object with `valueOf()`/`toString()` (ToPrimitive), then compare again.',
        ],
      },
      { type: 'heading3', text: 'Objects compare by reference with both operators' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const a = { id: 1 };
const b = { id: 1 };
a === b // false — different objects
a == b  // false
a === a // true

// The one accepted == idiom:
if (value == null) { /* value is null OR undefined */ }

// Object.is — like === but handles the two edge cases
Object.is(NaN, NaN) // true
Object.is(0, -0)    // false (0 === -0 is true)`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain that `==` coerces, give two surprising examples (`0 == ""`, `[] == false`), mention `NaN` and `Object.is`, and finish with "I use `===` everywhere, except `x == null` as a deliberate null-or-undefined check".',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the difference between == and === in JavaScript?',
      },
      {
        type: 'paragraph',
        text: '`===` (strict equality) compares value **and** type with no conversion. `==` (loose equality) first applies type coercion when the types differ, following a set of rules that produce surprising results like `"0" == false` being `true`. Use `===` by default; the one common accepted use of `==` is `x == null` to check for both null and undefined.',
      },
      {
        type: 'paragraph',
        text: 'With `==`, if the operand types differ JavaScript converts them: booleans become numbers, strings are converted to numbers when compared with numbers, objects are converted to primitives via `valueOf`/`toString`, and `null`/`undefined` equal only each other.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `1 === 1;            // true
1 === '1';          // false — different types
1 == '1';           // true  — '1' → 1

0 == '';            // true  — '' → 0
'0' == false;       // true  — false → 0, '0' → 0
'' == false;        // true
[] == false;        // true  — [] → '' → 0
[] == ![];          // true  🤯
null == undefined;  // true
null == 0;          // false — null only loosely equals undefined
NaN == NaN;         // false — and NaN === NaN is false too`,
      },
      { type: 'heading3', text: 'A Node-flavoured bug' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Query strings and env vars are always strings
app.get('/orders', (req, res) => {
  const page = req.query.page;           // '0'
  if (page == 0) { /* true — works by accident */ }
  if (page === 0) { /* false — string vs number */ }

  // ✅ Convert explicitly, then compare strictly
  const pageNum = Number.parseInt(page ?? '1', 10);
  if (pageNum === 0) { /* ... */ }
});

if (process.env.FEATURE_X == true) {}  // ❌ 'true' == true → NaN == 1 → false!
if (process.env.FEATURE_X === 'true') {} // ✅`,
      },
      { type: 'heading3', text: 'Related: Object.is' },
      {
        type: 'code',
        lang: 'javascript',
        code: `Object.is(NaN, NaN);  // true   (=== says false)
Object.is(0, -0);     // false  (=== says true)
// Number.isNaN(x) is the usual way to check for NaN`,
      },
      {
        type: 'bullets',
        items: [
          'Objects (including arrays) are compared by **reference** with both operators: `{} === {}` is `false`.',
          'ESLint rule `eqeqeq` (often with the `"null": "ignore"` option) enforces strict equality.',
          'TypeScript flags many nonsensical comparisons (e.g. number vs string) at compile time.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: don\'t just say "=== also checks type". Explain that `==` performs coercion, give one surprising example, and mention the `x == null` idiom as the deliberate exception.',
      },
    ],
  },

  'closures-with-practical-examples': {
    summary:
      "A closure is a function bundled with the variables from the scope where it was created. Because JavaScript uses lexical scope, an inner function keeps access to its outer function's variables even after the outer function has returned. Closures power data privacy, factories, memoisation, debounce/throttle, event handlers and callbacks.",
    details: [
      {
        type: 'paragraph',
        text: "When a function is created, it captures a reference to its surrounding lexical environment. Normally a function's local variables are garbage-collected when it returns, but if an inner function that uses them is still reachable, those variables stay alive. Note it captures the **variable**, not a snapshot of its value.",
      },
      { type: 'heading3', text: 'The basic idea' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function makeCounter() {
  let count = 0;              // private — not reachable from outside
  return {
    increment: () => ++count,
    get: () => count,
  };
}

const c1 = makeCounter();
c1.increment(); c1.increment();
c1.get();          // 2
const c2 = makeCounter();
c2.get();          // 0 — each call creates a new, independent closure
c1.count;          // undefined — truly private`,
      },
      { type: 'heading3', text: 'Practical 1 — function factories / configuration' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function createLogger(prefix) {
  return (message) => console.log(\`[\${prefix}] \${message}\`);
}
const apiLog = createLogger('API');
const authLog = createLogger('AUTH');
apiLog('Request sent');  // [API] Request sent
authLog('Token expired'); // [AUTH] Token expired`,
      },
      { type: 'heading3', text: 'Practical 2 — memoisation (cache in a closure)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function memoize(fn) {
  const cache = new Map();          // survives between calls
  return (n) => {
    if (cache.has(n)) return cache.get(n);
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}
const slowSquare = (n) => { /* expensive */ return n * n; };
const fastSquare = memoize(slowSquare);
fastSquare(9); // computed
fastSquare(9); // from cache`,
      },
      { type: 'heading3', text: 'Practical 3 — once(), debounce and event handlers' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function once(fn) {
  let called = false, result;
  return (...args) => {
    if (!called) { called = true; result = fn(...args); }
    return result;
  };
}
const init = once(() => console.log('init!'));
init(); init(); // logs 'init!' only once

// Each button handler "remembers" its own id
['save', 'delete'].forEach((id) => {
  document.getElementById(id).addEventListener('click', () => console.log(id));
});`,
      },
      {
        type: 'bullets',
        items: [
          'Angular uses closures everywhere: `inject()` inside a functional guard, RxJS operator callbacks, `computed(() => ...)` reading signals from the component scope.',
          'Memory: a closure keeps its captured variables alive. A long-lived listener that captures a large object can leak — remove listeners / unsubscribe when done.',
          'The `var`-in-a-loop bug is a closure bug: all callbacks share the same `var i`. `let` creates a fresh binding per iteration.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: define it in one sentence ("a function plus its lexical environment"), then show a private counter and one real use like memoize or debounce. Mentioning the memory-leak trade-off shows senior-level understanding.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: What are closures and how are they used in Node.js?' },
      {
        type: 'paragraph',
        text: 'A closure is a function bundled with the variables of the scope where it was **created**, so it can keep reading and updating them even after that outer function has returned. In Node, closures are everywhere: callbacks and promise handlers capturing request data, middleware factories, private state in modules, memoisation, and partially applied functions.',
      },
      {
        type: 'paragraph',
        text: 'JavaScript uses lexical scope: a function can see variables from where it is written. When an inner function outlives its outer function — returned, stored, or passed as a callback — the engine keeps those captured variables alive in memory. That captured environment is the closure.',
      },
      { type: 'heading3', text: 'Basic example: private state' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function createCounter() {
  let count = 0; // not reachable from outside
  return {
    increment: () => ++count,
    current: () => count,
  };
}

const c = createCounter();
c.increment();
c.increment();
console.log(c.current()); // 2
console.log(c.count);     // undefined — truly private`,
      },
      { type: 'heading3', text: 'Node use case: middleware factories' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// The returned middleware "remembers" options and the limits map
function rateLimit({ max, windowMs }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip) ?? { count: 0, start: now };
    if (now - entry.start > windowMs) Object.assign(entry, { count: 0, start: now });
    entry.count++;
    hits.set(req.ip, entry);
    if (entry.count > max) return res.status(429).send('Too many requests');
    next();
  };
}

app.use('/api', rateLimit({ max: 100, windowMs: 60_000 }));`,
      },
      { type: 'heading3', text: 'Callbacks capture request context' },
      {
        type: 'code',
        lang: 'javascript',
        code: `app.get('/users/:id', (req, res) => {
  const { id } = req.params;          // captured by the callback below
  const started = Date.now();
  db.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
    // Runs later, but still sees id, started and res from this request
    console.log('user', id, 'took', Date.now() - started, 'ms');
    res.json(result.rows[0]);
  });
});`,
      },
      { type: 'heading3', text: 'Memoisation' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
const getConfig = memoize((env) => loadConfigFromDisk(env));`,
      },
      {
        type: 'bullets',
        items: [
          'Classic loop gotcha: with `var i` all callbacks share one `i`; `let i` creates a new binding per iteration.',
          'Closures keep captured objects alive — a long-lived closure (e.g. an event listener or a module-level cache) holding a large object is a common **memory leak** in Node.',
          'Each closure has its own copy of the environment per call: two `createCounter()` calls give two independent counters.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: unbounded caches inside closures (like the `hits` map above) grow forever in a long-running server. Add eviction/TTL, use an LRU cache, or store the data in Redis.',
      },
    ],
  },

  currying: {
    summary:
      'Currying transforms a function that takes several arguments, `f(a, b, c)`, into a chain of functions that each take one argument, `f(a)(b)(c)`. It relies on closures to remember earlier arguments and is useful for creating specialised, reusable functions (partial application) and for function composition.',
    details: [
      {
        type: 'paragraph',
        text: 'Each call returns a new function that "remembers" the arguments given so far. Once all arguments are collected, the original logic runs. Currying is closely related to **partial application** — fixing some arguments now and supplying the rest later.',
      },
      { type: 'heading3', text: 'Manual currying' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Normal
const add = (a, b, c) => a + b + c;
add(1, 2, 3); // 6

// Curried
const addC = (a) => (b) => (c) => a + b + c;
addC(1)(2)(3); // 6

const add10 = addC(10);   // partially applied
add10(5)(1);              // 16`,
      },
      { type: 'heading3', text: 'A generic curry() helper' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);            // got enough args → run
    }
    return (...next) => curried.apply(this, [...args, ...next]); // keep collecting
  };
}

const volume = (l, w, h) => l * w * h;
const cVolume = curry(volume);
cVolume(2)(3)(4);   // 24
cVolume(2, 3)(4);   // 24 — flexible grouping
cVolume(2)(3, 4);   // 24`,
      },
      { type: 'heading3', text: 'Practical uses' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// 1. Reusable, specialised helpers
const hasRole = (role) => (user) => user.roles.includes(role);
const admins = users.filter(hasRole('admin'));
const editors = users.filter(hasRole('editor'));

// 2. Pre-configured API calls
const request = (baseUrl) => (method) => (path) => fetch(\`\${baseUrl}\${path}\`, { method });
const api = request('https://api.example.com');
const get = api('GET');
get('/users');
get('/orders');

// 3. Event handlers with extra data
const onSelect = (id) => (event) => console.log('selected', id, event.type);
button.addEventListener('click', onSelect(42));`,
      },
      {
        type: 'bullets',
        items: [
          "`fn.length` counts declared parameters — it ignores default and rest parameters, so the helper above doesn't work for those.",
          'Currying vs partial application: currying always yields unary functions; partial application fixes any number of arguments (e.g. `fn.bind(null, a, b)`).',
          'Libraries like Lodash (`_.curry`) and Ramda use currying heavily for point-free style.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a classic follow-up is "implement `sum(1)(2)(3)()`" or a generic `curry`. Practise writing the recursive helper above — and explain that it works because of closures.',
      },
    ],
  },

  'arrow-functions-vs-regular-functions': {
    summary:
      'Arrow functions are a concise function syntax introduced in ES6. Beyond shorter syntax they behave differently: they have no own `this` (they use the `this` of the surrounding scope), no `arguments` object, cannot be used as constructors with `new`, have no `prototype`, and their `this` cannot be changed by `call`, `apply` or `bind`.',
    details: [
      {
        type: 'paragraph',
        text: 'Syntax-wise, an arrow function can drop the `function` keyword, the parentheses for a single parameter, and the braces plus `return` for a single expression. The more important differences are semantic — mainly how `this` is resolved.',
      },
      { type: 'heading3', text: 'Syntax forms' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function square(n: number) { return n * n; }   // regular

const sq1 = (n: number) => n * n;               // implicit return
const sq2 = (n: number) => { return n * n; };   // block body needs return
const log = () => console.log('hi');            // no params
const toUser = (name: string) => ({ name });    // returning an object → wrap in ()`,
      },
      { type: 'heading3', text: 'Difference 1 — this' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const team = {
  name: 'Platform',
  members: ['Asha', 'Ravi'],
  listRegular() {
    this.members.forEach(function (m) {
      console.log(this.name, m); // ❌ this is undefined (strict) / window — not team
    });
  },
  listArrow() {
    this.members.forEach((m) => {
      console.log(this.name, m); // ✅ 'Platform Asha' — inherits this from listArrow
    });
  },
};`,
      },
      { type: 'heading3', text: 'Difference 2 — arguments, new, prototype' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function regular() { return arguments.length; }
regular(1, 2, 3);       // 3

const arrow = (...args) => args.length; // no 'arguments' → use rest params
arrow(1, 2, 3);         // 3

function Person(name) { this.name = name; }
new Person('Asha');     // ✅

const P = (name) => { this.name = name; };
new P('Asha');          // ❌ TypeError: P is not a constructor
P.prototype;            // undefined`,
      },
      { type: 'heading3', text: 'When NOT to use an arrow function' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const counter = {
  count: 0,
  inc: () => this.count++,   // ❌ this is NOT counter — arrow takes outer this
  incOk() { this.count++; }, // ✅ method shorthand
};

button.addEventListener('click', function () {
  this.classList.toggle('active'); // ✅ this = the button (regular function)
});`,
      },
      {
        type: 'bullets',
        items: [
          '**this:** regular → decided by how it is called; arrow → taken from the enclosing scope at definition time.',
          '**call/apply/bind:** can change `this` for regular functions; ignored for arrows.',
          '**Hoisting:** function declarations are hoisted; arrows are expressions assigned to variables (TDZ with `const`).',
          '**Use arrows** for callbacks, array methods, RxJS operators, promise chains. **Use regular functions/methods** for object methods, constructors, and DOM handlers that need `this` = element.',
          'Arrow functions cannot be generators (no `yield`).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Common pitfall: defining object methods or prototype methods as arrows. They won't see the object as `this`. Use method shorthand instead.",
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Why do we need Arrow Functions when regular function declarations already exist (`lexical this binding`)?',
      },
      {
        type: 'paragraph',
        text: 'Arrow functions exist mainly to fix the "lost `this`" problem in callbacks. A regular function gets its `this` from how it is called, so passing a method\'s inner callback to `setTimeout`, `forEach` or a subscription loses the object context. Arrows use lexical `this` — they inherit it from where they are written — which replaced old workarounds like `var self = this` and `.bind(this)`.',
      },
      { type: 'heading3', text: 'The problem — and the old workarounds' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function Timer() {
  this.seconds = 0;

  // ❌ Bug: inside the callback, this is undefined (strict) or window
  setInterval(function () { this.seconds++; }, 1000);

  // Workaround 1: capture this
  var self = this;
  setInterval(function () { self.seconds++; }, 1000);

  // Workaround 2: bind
  setInterval(function () { this.seconds++; }.bind(this), 1000);

  // ✅ ES6: arrow function — lexical this
  setInterval(() => { this.seconds++; }, 1000);
}`,
      },
      { type: 'heading3', text: 'Why it matters in Angular / TypeScript classes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-users', template: '...' })
export class UsersComponent {
  private http = inject(HttpClient);
  users = signal<User[]>([]);
  loading = signal(false);

  load() {
    this.loading.set(true);
    this.http.get<User[]>('/api/users').subscribe({
      // Arrow callbacks: 'this' is still the component
      next: (data) => this.users.set(data),
      complete: () => this.loading.set(false),
    });
  }

  // Arrow as a class field: safe to pass as a callback reference
  onResize = () => console.log(this.users().length);
  // window.addEventListener('resize', this.onResize) keeps the right this
}`,
      },
      {
        type: 'flow',
        title: 'How this is resolved',
        code: `flowchart TD
  F{Function type?} -->|Arrow| L["Look up this in the<br/>enclosing scope (lexical)"]:::highlight
  F -->|Regular| C{How was it called?}
  C -->|"new Fn()"| N[New object]:::server
  C -->|"obj.fn()"| O[obj]:::server
  C -->|"fn.call(x) / bind(x)"| X[x]:::server
  C -->|"plain fn()"| U["undefined (strict)<br/>or globalThis"]:::external`,
      },
      {
        type: 'bullets',
        items: [
          'Arrows also make callbacks shorter (`items.map(i => i.id)`), which suits functional style and RxJS pipelines.',
          'Trade-off: class-field arrows are created per instance (not on the prototype), so they use a little more memory and cannot be easily overridden via `super`.',
          "Arrows don't replace regular functions: you still need them for constructors, methods using dynamic `this`, generators and `arguments`.",
        ],
      },
    ],
  },

  'prototype-vs-proto': {
    summary:
      "`prototype` is a property on constructor functions (and classes): it is the object that will become the prototype of instances created with `new`. `__proto__` is an accessor on every object that points to that object's actual prototype — the next link in its prototype chain. So `new Foo().__proto__ === Foo.prototype`. Prefer `Object.getPrototypeOf()` over the legacy `__proto__`.",
    details: [
      {
        type: 'paragraph',
        text: "Every object has an internal `[[Prototype]]` link used for property lookup. `__proto__` is a (legacy, but widely supported) getter/setter that exposes that link. `prototype`, on the other hand, exists only on functions that can be constructors — it is a blueprint object, not the function's own prototype.",
      },
      { type: 'heading3', text: 'The relationship in code' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function User(name) { this.name = name; }
User.prototype.greet = function () { return 'Hi ' + this.name; };

const asha = new User('Asha');

asha.__proto__ === User.prototype;                 // true
Object.getPrototypeOf(asha) === User.prototype;    // true (preferred API)
User.prototype.constructor === User;               // true

asha.prototype;          // undefined — plain objects don't have .prototype
User.__proto__ === Function.prototype; // true — User itself is a function object

asha.greet();            // 'Hi Asha' — found via the prototype chain
asha.hasOwnProperty('greet'); // false — it lives on User.prototype`,
      },
      {
        type: 'flow',
        title: 'Prototype chain for asha',
        code: `flowchart LR
  A["asha<br/>{ name }"]:::client -->|__proto__| UP["User.prototype<br/>{ greet, constructor }"]:::server
  UP -->|__proto__| OP["Object.prototype<br/>{ toString, hasOwnProperty }"]:::db
  OP -->|__proto__| N[null]:::external
  U["User (function)"]:::highlight -->|.prototype| UP`,
        text: 'Property lookup walks the `__proto__` links until it finds the property or reaches `null`.',
      },
      { type: 'heading3', text: 'Same thing with ES6 classes' },
      {
        type: 'code',
        lang: 'javascript',
        code: `class Animal { speak() { return 'generic sound'; } }
class Dog extends Animal { speak() { return 'woof'; } }

const d = new Dog();
Object.getPrototypeOf(d) === Dog.prototype;               // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
typeof Dog.prototype.speak;                               // 'function' — methods live on prototype`,
      },
      {
        type: 'bullets',
        items: [
          '`prototype` → on functions/classes; shared by all instances; where methods live.',
          '`__proto__` → on every object; points to its prototype; deprecated in favour of `Object.getPrototypeOf` / `Object.setPrototypeOf`.',
          '`Object.create(proto)` creates an object whose `__proto__` is `proto` — no constructor needed.',
          "Changing an object's prototype at runtime (`setPrototypeOf`) is slow — engines de-optimise such objects.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the one-liner "`instance.__proto__ === Constructor.prototype`" plus the chain diagram is usually all the interviewer needs. Mention `Object.getPrototypeOf` to show you know `__proto__` is legacy.',
      },
    ],
  },

  'implementing-inheritance': {
    summary:
      'JavaScript uses prototypal inheritance: objects delegate property lookups to their prototype. The modern way is ES6 `class Child extends Parent` with `super()`. Under the hood that is the same as the older constructor-function pattern (`Parent.call(this)` + `Object.create(Parent.prototype)`), and you can also inherit directly from an object with `Object.create()`. Prefer composition when the "is-a" relationship is weak.',
    details: [
      {
        type: 'paragraph',
        text: 'There are no "real" classes copied at creation time like in Java. An instance holds its own data, and methods are found by walking the prototype chain. All three approaches below build the same chain — `child → Child.prototype → Parent.prototype → Object.prototype`.',
      },
      { type: 'heading3', text: '1. ES6 classes (recommended)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `class Employee {
  #salary;                              // private field
  constructor(name, salary) {
    this.name = name;
    this.#salary = salary;
  }
  describe() { return \`\${this.name} is an employee\`; }
  get annualPay() { return this.#salary * 12; }
  static compare(a, b) { return a.annualPay - b.annualPay; }
}

class Manager extends Employee {
  constructor(name, salary, reports = []) {
    super(name, salary);                // must call super() before using this
    this.reports = reports;
  }
  describe() {                          // override
    return \`\${super.describe()} and manages \${this.reports.length} people\`;
  }
}

const m = new Manager('Asha', 100, ['Ravi']);
m.describe();            // 'Asha is an employee and manages 1 people'
m.annualPay;             // 1200 — inherited getter
m instanceof Employee;   // true
Manager.compare;         // static methods are inherited too`,
      },
      { type: 'heading3', text: '2. Constructor functions (pre-ES6, what classes compile to)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return this.name + ' makes a sound'; };

function Dog(name, breed) {
  Animal.call(this, name);        // 1. inherit instance properties
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);  // 2. inherit methods
Dog.prototype.constructor = Dog;                  // 3. fix constructor reference
Dog.prototype.speak = function () { return this.name + ' barks'; };

new Dog('Rex', 'Lab').speak(); // 'Rex barks'`,
      },
      { type: 'heading3', text: '3. Object.create — inherit from an object directly' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const vehicle = {
  start() { return \`\${this.type} started\`; },
};
const car = Object.create(vehicle); // car.__proto__ === vehicle
car.type = 'Car';
car.start(); // 'Car started'`,
      },
      { type: 'heading3', text: 'Alternative: composition over inheritance' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const canFly = (obj) => ({ fly: () => \`\${obj.name} flies\` });
const canSwim = (obj) => ({ swim: () => \`\${obj.name} swims\` });

const duck = (name) => {
  const self = { name };
  return Object.assign(self, canFly(self), canSwim(self));
};
duck('Donald').fly(); // 'Donald flies' — mix behaviours without deep hierarchies`,
      },
      {
        type: 'bullets',
        items: [
          'JavaScript supports single inheritance only — one `extends`. Use mixins/composition for multiple behaviours.',
          'Forgetting `super()` in a derived constructor throws `ReferenceError: Must call super constructor`.',
          'In Angular, inheritance is used for base components/services, but composition (injectable services, `hostDirectives`) is usually preferred.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: write the `class ... extends` version, then say "this is syntactic sugar over prototypes" and show the `Object.create(Parent.prototype)` version. Being able to write both proves you understand the mechanism.',
      },
    ],
  },

  'deep-copy-vs-shallow-copy': {
    summary:
      'A shallow copy creates a new top-level object but nested objects/arrays are still shared references, so changing a nested value affects the original. A deep copy recursively copies everything, so the copy is fully independent. Shallow: spread `{...obj}`, `Object.assign`, `Array.slice()`. Deep: `structuredClone()` (modern, built-in), `JSON.parse(JSON.stringify())` (lossy), or a library like Lodash `cloneDeep`.',
    details: [
      {
        type: 'paragraph',
        text: 'Objects are assigned by reference. `const b = a` is not a copy at all — both names point to one object. A shallow copy duplicates only the first level; a deep copy duplicates every level.',
      },
      { type: 'heading3', text: 'Shallow copy and its trap' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const user = { name: 'Asha', address: { city: 'Chennai' }, tags: ['admin'] };

const shallow = { ...user };     // or Object.assign({}, user)
shallow.name = 'Ravi';           // ✅ original unchanged (top level copied)
shallow.address.city = 'Pune';   // ❌ original changed too!
shallow.tags.push('editor');     // ❌ original.tags is now ['admin', 'editor']

console.log(user.address.city);  // 'Pune'
console.log(user.address === shallow.address); // true — shared reference`,
      },
      { type: 'heading3', text: 'Deep copy options' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// 1. structuredClone — built-in (browsers + Node 17+), handles Date, Map, Set, cycles
const deep = structuredClone(user);
deep.address.city = 'Delhi';
user.address.city; // unchanged

// 2. JSON round trip — quick but LOSSY
const json = JSON.parse(JSON.stringify({
  when: new Date(), fn() {}, missing: undefined, big: 10n,
}));
// → Date becomes a string, functions & undefined are dropped,
//   BigInt throws, circular references throw

// 3. Library
// import cloneDeep from 'lodash/cloneDeep';
// const copy = cloneDeep(user);`,
      },
      { type: 'heading3', text: 'A simple recursive deep clone (interview version)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value; // primitives
  if (value instanceof Date) return new Date(value);
  if (seen.has(value)) return seen.get(value);                   // circular refs

  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}`,
      },
      {
        type: 'bullets',
        items: [
          '`structuredClone` cannot copy functions, DOM nodes or class methods (class instances come back as plain objects).',
          'Shallow copies are often exactly what you want — e.g. immutable updates in Angular signals or NgRx reducers: `state.update(s => ({ ...s, user: { ...s.user, name } }))` copies only the path that changed.',
          'Deep copying large objects is expensive; avoid it in hot paths like change detection.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: using spread for "immutable" updates of nested state and mutating a nested object. The reference stays the same, so OnPush components or signal `equal` checks may not see the change — and the original is corrupted.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the difference between deep clone and shallow clone?',
      },
      {
        type: 'paragraph',
        text: 'A shallow clone copies only the top level: primitive values are copied, but nested objects and arrays are **shared by reference** with the original. A deep clone recursively copies every level, so the copy is fully independent. In modern Node, `structuredClone()` is the built-in way to deep clone; spread (`{...obj}`) and `Object.assign` are shallow.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `const original = {
  name: 'order-1',
  items: [{ sku: 'A', qty: 1 }],
  meta: { createdAt: new Date('2026-01-01') },
};

// Shallow
const shallow = { ...original };
shallow.name = 'changed';           // original.name unchanged ✅
shallow.items[0].qty = 99;          // original.items[0].qty is now 99 ❌ shared!

// Deep
const deep = structuredClone(original);
deep.items[0].qty = 5;              // original untouched ✅
deep.meta.createdAt instanceof Date; // true — Dates are preserved`,
      },
      { type: 'heading3', text: 'Ways to clone and their trade-offs' },
      {
        type: 'bullets',
        items: [
          '**Shallow**: `{ ...obj }`, `Object.assign({}, obj)`, `[...arr]`, `arr.slice()`, `Array.from(arr)`.',
          '**structuredClone(obj)** (Node 17+): handles nested objects, arrays, `Date`, `Map`, `Set`, `RegExp`, typed arrays and **circular references**. Throws on functions and DOM nodes; drops class prototypes (instances become plain objects) and getters.',
          '**JSON.parse(JSON.stringify(obj))**: old trick — loses `undefined`, functions, `Date` (becomes string), `Map`/`Set` (become `{}`), `NaN`/`Infinity` (become null), and throws on circular references.',
          '**Library**: `lodash.cloneDeep` for more control (keeps prototypes in some cases).',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `const data = { when: new Date(), tags: new Set(['a']), skip: undefined };
data.self = data; // circular

JSON.parse(JSON.stringify(data));  // ❌ TypeError: Converting circular structure to JSON
structuredClone(data);             // ✅ { when: Date, tags: Set, skip: undefined, self: [Circular] }

structuredClone({ fn: () => 1 });  // ❌ DataCloneError: functions cannot be cloned`,
      },
      { type: 'heading3', text: 'Why it matters in a Node service' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Shared default config mutated per request — a real bug
const DEFAULTS = { headers: { 'x-client': 'api' }, retries: 3 };

function buildRequest(userHeaders) {
  const opts = { ...DEFAULTS };              // shallow!
  Object.assign(opts.headers, userHeaders);  // ❌ mutates DEFAULTS.headers for everyone
  return opts;
}

function buildRequestFixed(userHeaders) {
  return { ...DEFAULTS, headers: { ...DEFAULTS.headers, ...userHeaders } }; // ✅ copy what you change
}`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say that you rarely need a full deep clone — copying only the path you modify (immutable update) is cheaper. When you do need one, name `structuredClone` and its limits (no functions, loses class prototypes).',
      },
    ],
  },

  'how-the-event-loop-works': {
    summary:
      'JavaScript runs on a single thread with one call stack. Async work (timers, network, I/O) is handled by the browser or Node.js, and their callbacks are queued. The event loop repeatedly: runs the current synchronous code until the stack is empty, then drains the entire **microtask** queue (Promise callbacks, `queueMicrotask`, `MutationObserver`), then (in the browser) may render, then takes the next **macrotask** (timers, events, I/O). That is why `Promise.then` always runs before `setTimeout(fn, 0)`.',
    details: [
      {
        type: 'paragraph',
        text: 'The key pieces are: the **call stack** (where functions execute), **Web APIs / Node APIs** (which do the waiting off the main thread), the **task (macrotask) queue**, the **microtask queue**, and the **event loop** that moves callbacks onto the stack when it is empty.',
      },
      {
        type: 'flow',
        title: 'One turn of the browser event loop',
        code: `flowchart TD
  S["Run synchronous code<br/>until call stack is empty"]:::server --> M{"Microtasks queued?"}
  M -->|Yes| RM["Run ALL microtasks<br/>(Promise.then, queueMicrotask)"]:::highlight
  RM --> M
  M -->|No| R["Render if needed<br/>(rAF, style, layout, paint)"]:::client
  R --> T{"Macrotask waiting?"}
  T -->|"Yes: timer, click, message"| P["Take ONE macrotask"]:::queue
  P --> S
  T -->|No| W["Wait for new events"]:::external
  W --> T`,
      },
      { type: 'heading3', text: 'Classic ordering question' },
      {
        type: 'code',
        lang: 'javascript',
        code: `console.log('1: sync');

setTimeout(() => console.log('2: timeout (macrotask)'), 0);

Promise.resolve()
  .then(() => console.log('3: promise (microtask)'))
  .then(() => console.log('4: promise 2 (microtask)'));

queueMicrotask(() => console.log('5: queueMicrotask'));

(async () => {
  console.log('6: async fn body runs synchronously');
  await null;
  console.log('7: after await (microtask)');
})();

console.log('8: sync');

// Output:
// 1: sync
// 6: async fn body runs synchronously
// 8: sync
// 3: promise (microtask)
// 5: queueMicrotask
// 7: after await (microtask)
// 4: promise 2 (microtask)
// 2: timeout (macrotask)`,
      },
      { type: 'heading3', text: 'Why it matters: blocking the loop' },
      {
        type: 'code',
        lang: 'javascript',
        code: `button.addEventListener('click', () => {
  const end = Date.now() + 3000;
  while (Date.now() < end) {} // ❌ blocks the stack for 3s — no clicks, no rendering
});

// Fix: split work, use a Web Worker, or yield back to the loop
async function processInChunks(items) {
  for (let i = 0; i < items.length; i += 500) {
    items.slice(i, i + 500).forEach(heavyWork);
    await new Promise((r) => setTimeout(r)); // let the browser render & handle input
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          '`setTimeout(fn, 0)` means "at least 0 ms", not "immediately" — it waits for the stack and all microtasks.',
          'Microtasks can starve rendering: a microtask that keeps queueing microtasks freezes the page.',
          'Node.js has phases (timers → pending → poll → check → close) and runs `process.nextTick` callbacks before promise microtasks.',
          "Angular's Zone.js patched these async APIs to know when to run change detection; zoneless Angular relies on signals and explicit notifications instead.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: draw stack → APIs → queues → loop, state the rule "after each macrotask, all microtasks run", and walk through an ordering example out loud. Interviewers often hand you such a snippet to predict.',
      },
    ],
  },

  'what-a-promise-is': {
    summary:
      'A Promise is an object representing the eventual result of an asynchronous operation. It starts `pending` and settles exactly once, either `fulfilled` with a value or `rejected` with a reason. You consume it with `.then/.catch/.finally` or `async/await`, and combine several with `Promise.all`, `allSettled`, `race` and `any`. Promises replaced deeply nested callbacks with chainable, composable code.',
    details: [
      {
        type: 'paragraph',
        text: 'Before promises, async code used callbacks, leading to "callback hell" and inconsistent error handling. A promise is a placeholder you can pass around and attach handlers to — even after it has settled. Its callbacks always run asynchronously as microtasks.',
      },
      {
        type: 'flow',
        title: 'Promise states',
        code: `stateDiagram-v2
  [*] --> Pending: new Promise(executor)
  Pending --> Fulfilled: resolve(value)
  Pending --> Rejected: reject(error) / throw
  Fulfilled --> [*]: .then handlers run
  Rejected --> [*]: .catch handlers run`,
        text: 'Once settled, a promise never changes state again; extra `resolve`/`reject` calls are ignored.',
      },
      { type: 'heading3', text: 'Creating and consuming a promise' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function wait(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(\`waited \${ms}ms\`), ms));
}

function getUser(id) {
  return new Promise((resolve, reject) => {
    if (id <= 0) return reject(new Error('Invalid id'));
    resolve({ id, name: 'Asha' });
  });
}

getUser(1)
  .then((user) => user.name)          // return value → next .then
  .then((name) => console.log(name))  // 'Asha'
  .catch((err) => console.error(err)) // catches any error above
  .finally(() => console.log('done'));`,
      },
      { type: 'heading3', text: 'The same with async/await' },
      {
        type: 'code',
        lang: 'javascript',
        code: `async function showUser(id) {
  try {
    const user = await getUser(id);   // pauses this function, not the thread
    console.log(user.name);
  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    console.log('done');
  }
}`,
      },
      { type: 'heading3', text: 'Combinators' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const p1 = fetch('/api/users');
const p2 = fetch('/api/orders');

await Promise.all([p1, p2]);        // all succeed → array; first rejection rejects
await Promise.allSettled([p1, p2]); // never rejects → [{status, value|reason}, ...]
await Promise.race([p1, wait(5000)]); // first to SETTLE wins (timeouts)
await Promise.any([p1, p2]);        // first to FULFIL wins; AggregateError if all fail

// ❌ Sequential by accident (slow)
const a = await fetch('/a');
const b = await fetch('/b');
// ✅ Parallel
const [c, d] = await Promise.all([fetch('/c'), fetch('/d')]);`,
      },
      {
        type: 'bullets',
        items: [
          'Promise vs Observable (Angular): a promise is eager, single-value and not cancellable; an Observable is lazy, can emit many values and can be cancelled by unsubscribing.',
          "Always return or await promises inside `.then` — otherwise the chain doesn't wait and errors escape.",
          'Unhandled rejections log warnings in browsers and crash Node.js processes by default (Node 15+).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: cover the three states, chaining, error handling, and the difference between `all`, `allSettled`, `race` and `any`. Mentioning the accidental-sequential-await mistake shows practical experience.',
      },
    ],
  },

  'debounce-vs-throttle': {
    summary:
      'Both limit how often a function runs during a burst of events. **Debounce** waits until events STOP for a given delay and then runs once (e.g. search-as-you-type, auto-save, resize end). **Throttle** runs at most once per interval while events keep firing (e.g. scroll position, mouse move, button spam). Debounce = "after the user is done", throttle = "at a steady rate".',
    details: [
      {
        type: 'paragraph',
        text: 'Imagine a user typing "angular" quickly. With a 300 ms debounce, the search runs once, 300 ms after the last keystroke. With a 300 ms throttle, it would run roughly every 300 ms while they type. Both are implemented with closures holding a timer or timestamp.',
      },
      { type: 'heading3', text: 'Debounce implementation' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function debounce(fn, delay = 300) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);                      // cancel the previous pending call
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const search = debounce((q) => console.log('Searching', q), 300);
input.addEventListener('input', (e) => search(e.target.value));
// Typing 'a','an','ang' quickly → only 'Searching ang' is logged`,
      },
      { type: 'heading3', text: 'Throttle implementation' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function throttle(fn, interval = 200) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {   // enough time passed → run now
      last = now;
      fn.apply(this, args);
    }                               // otherwise ignore this call
  };
}

window.addEventListener('scroll', throttle(() => {
  console.log('scrollY', window.scrollY); // at most every 200ms while scrolling
}, 200));`,
      },
      { type: 'heading3', text: 'In Angular with RxJS' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule],
  template: \`<input [formControl]="query" placeholder="Search" />\`,
})
export class SearchComponent {
  private api = inject(SearchApi);
  query = new FormControl('', { nonNullable: true });

  results = toSignal(
    this.query.valueChanges.pipe(
      debounceTime(300),          // wait for typing to pause
      distinctUntilChanged(),     // skip same value
      switchMap((q) => this.api.search(q)), // cancel the previous request
    ),
    { initialValue: [] },
  );
}

// Throttle example: fromEvent(window, 'scroll').pipe(throttleTime(200))`,
      },
      {
        type: 'bullets',
        items: [
          '**Debounce** — search box, form auto-save, validating a username, window resize "end".',
          '**Throttle** — infinite scroll checks, drag/mousemove handlers, analytics tracking, preventing double-click submits.',
          'Leading vs trailing: both can fire on the first event (leading), the last (trailing), or both — Lodash and RxJS expose these options.',
          'For scroll/animation work, `requestAnimationFrame` is often a better "throttle" (once per frame).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give one real use-case for each, then write debounce from memory — it is one of the most common live-coding questions. Remember `clearTimeout` and preserving `this`/arguments.',
      },
    ],
  },

  'null-vs-undefined': {
    summary:
      '`undefined` means a value was never assigned — it is what JavaScript gives you for uninitialised variables, missing properties, missing arguments and functions without a `return`. `null` is an explicit, intentional "no value" that a developer assigns. `typeof undefined` is `"undefined"`, while `typeof null` is `"object"` (a historical bug).',
    details: [
      {
        type: 'paragraph',
        text: 'A practical way to think about it: **undefined is the language saying "nothing here yet"**, **null is your code saying "deliberately empty"**. Many teams use `null` for "known to be absent" (e.g. a user without a middle name) and let `undefined` mean "not provided".',
      },
      { type: 'heading3', text: 'Where each one comes from' },
      {
        type: 'code',
        lang: 'javascript',
        code: `let a;
console.log(a);                    // undefined — declared, not assigned

const user = { name: 'Asha' };
console.log(user.email);           // undefined — missing property

function greet(name) { return name; }
console.log(greet());              // undefined — missing argument
console.log((() => {})());         // undefined — no return

const row = await db.findUser(42);
console.log(row);                  // null — the driver explicitly says "no row"
console.log(JSON.parse('{"manager": null}').manager); // null — JSON has null, not undefined`,
      },
      { type: 'heading3', text: 'Comparisons and checks' },
      {
        type: 'code',
        lang: 'javascript',
        code: `typeof undefined;        // 'undefined'
typeof null;             // 'object'  ← historical quirk
null == undefined;       // true   (loose equality treats them as equal)
null === undefined;      // false
Number(null);            // 0
Number(undefined);       // NaN

// Check for "either one"
if (value == null) { /* null or undefined */ }
const port = process.env.PORT ?? 3000;  // ?? only falls back on null/undefined
const name = user?.profile?.name;       // optional chaining → undefined if missing`,
      },
      { type: 'heading3', text: 'Behaviour that matters in Node APIs' },
      {
        type: 'code',
        lang: 'javascript',
        code: `JSON.stringify({ a: undefined, b: null });
// '{"b":null}'  — undefined properties are DROPPED, null is kept

function connect({ retries = 3 } = {}) { return retries; }
connect({ retries: undefined }); // 3 — default parameters apply to undefined
connect({ retries: null });      // null — but NOT to null

// In a PATCH endpoint this distinction is useful:
// { "nickname": null }  → clear the nickname
// {}                    → leave nickname unchanged`,
      },
      {
        type: 'bullets',
        items: [
          "Use `??` instead of `||` for defaults so valid values like `0` and `''` are not replaced.",
          'Both are falsy and both are primitives; neither has properties — accessing `null.x` throws `TypeError`.',
          'In TypeScript with `strictNullChecks`, `null` and `undefined` are distinct types; `x?: string` means `string | undefined`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention the JSON difference (undefined is dropped) and default parameters (only undefined triggers them) — these are the real-world consequences that show experience beyond the definition.',
      },
    ],
  },

  'call-vs-apply-vs-bind': {
    summary:
      'All three set the value of `this` for a function. `call(thisArg, a, b)` invokes it immediately with arguments listed individually; `apply(thisArg, [a, b])` invokes it immediately with arguments as an array; `bind(thisArg, a)` does **not** invoke — it returns a new function permanently bound to that `this` (and optional pre-filled arguments).',
    details: [
      {
        type: 'paragraph',
        text: 'In JavaScript `this` is decided by **how** a function is called, not where it is defined (except arrow functions, which inherit `this` lexically). These three methods let you control it explicitly.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `const logger = { prefix: '[api]' };

function log(level, msg) {
  return this.prefix + ' ' + level + ': ' + msg;
}

log.call(logger, 'info', 'started');        // '[api] info: started'
log.apply(logger, ['warn', 'slow query']);  // '[api] warn: slow query'

const info = log.bind(logger, 'info');      // nothing runs yet
info('listening on 3000');                  // '[api] info: listening on 3000'`,
      },
      { type: 'heading3', text: 'The classic lost-this problem' },
      {
        type: 'code',
        lang: 'javascript',
        code: `class UserController {
  constructor(service) { this.service = service; }
  async list(req, res) {
    res.json(await this.service.findAll());
  }
}
const ctrl = new UserController(userService);

app.get('/users', ctrl.list);              // ❌ TypeError: Cannot read properties of undefined
app.get('/users', ctrl.list.bind(ctrl));   // ✅
app.get('/users', (req, res) => ctrl.list(req, res)); // ✅ arrow wrapper

// Or define as a class field arrow function:
// list = async (req, res) => { ... }`,
      },
      { type: 'heading3', text: 'Practical uses of apply/call' },
      {
        type: 'code',
        lang: 'javascript',
        code: `Math.max.apply(null, [3, 9, 2]);   // 9 — today you'd write Math.max(...arr)

// Borrowing a method
Array.prototype.slice.call(arguments); // old way to turn arguments into an array

// Event emitters call listeners with this = emitter
emitter.on('data', function () { console.log(this === emitter); }); // true
emitter.on('data', () => { /* arrow: this is NOT the emitter */ });`,
      },
      {
        type: 'bullets',
        items: [
          'Memory hook: **C**all = **c**omma-separated args, **A**pply = **a**rray, **B**ind = **b**ound for later.',
          '`bind` is permanent: binding a bound function again does not change `this`.',
          'Arrow functions ignore `call`/`apply`/`bind` for `this` (arguments still pass through).',
          'In strict mode (all ES modules and classes), calling a detached method gives `this === undefined` rather than the global object.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: show the Express/controller example where passing a method as a callback loses `this` — it demonstrates why `bind` matters in real Node code, not just in trivia.',
      },
    ],
  },

  'prototype-chain': {
    summary:
      'Every JavaScript object has an internal link (`[[Prototype]]`) to another object, its prototype. When you read a property that the object does not have, the engine walks up this chain of prototypes until it finds the property or reaches `null`. This is how inheritance works in JavaScript — `class` and `extends` are syntax on top of prototypes.',
    details: [
      {
        type: 'paragraph',
        text: "Methods are not copied onto each object. A thousand `User` instances share one `User.prototype` object that holds the methods, which saves memory. Writing a property, however, always creates it on the object itself (shadowing the prototype's version) — the chain is only used for lookups.",
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name + ' makes a sound'; }
}
class Dog extends Animal {
  bark() { return this.name + ' barks'; }
}

const rex = new Dog('Rex');
rex.bark();      // own prototype: Dog.prototype
rex.speak();     // found one level up: Animal.prototype
rex.toString();  // found on Object.prototype
rex.fly;         // undefined — reached null without finding it

Object.getPrototypeOf(rex) === Dog.prototype;              // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
Object.getPrototypeOf(Object.prototype);                   // null — end of chain

Object.hasOwn(rex, 'name');  // true — own property
Object.hasOwn(rex, 'speak'); // false — inherited
rex instanceof Animal;       // true — Animal.prototype is somewhere in the chain`,
      },
      {
        type: 'flow',
        title: 'Property lookup for rex.speak()',
        code: `flowchart LR
  R["rex<br/>own: name"]:::client -->|"[[Prototype]]"| D["Dog.prototype<br/>bark"]:::server
  D -->|"[[Prototype]]"| A["Animal.prototype<br/>speak ✓"]:::highlight
  A -->|"[[Prototype]]"| O["Object.prototype<br/>toString, hasOwnProperty"]:::server
  O --> N["null"]:::external`,
      },
      { type: 'heading3', text: 'The same thing without class syntax' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return this.name + ' makes a sound'; };

const base = { greet() { return 'hi from ' + this.name; } };
const obj = Object.create(base); // obj's prototype is base
obj.name = 'Asha';
obj.greet(); // 'hi from Asha'

const dict = Object.create(null); // no prototype at all — no toString, no __proto__`,
      },
      { type: 'heading3', text: 'Why it matters in Node' },
      {
        type: 'bullets',
        items: [
          'Node core builds on it: `class MyStream extends Readable`, `class Service extends EventEmitter`.',
          '**Prototype pollution**: if user JSON like `{"__proto__": {"isAdmin": true}}` is deep-merged into an object, it can modify `Object.prototype` and affect every object in the process. Use `Object.create(null)`, `Map`, schema validation, and safe merge libraries.',
          'Performance: V8 optimises objects with stable shapes; mutating prototypes at runtime (`Object.setPrototypeOf`) deoptimises code.',
          'Do not extend built-in prototypes (`Array.prototype.myFn = ...`) — it leaks into every module and dependency.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain lookup ("walk up until found or null"), say `class` is syntactic sugar, and mention prototype pollution — linking the concept to a real Node security issue stands out.',
      },
    ],
  },

  'map-vs-filter-vs-reduce': {
    summary:
      'All three iterate an array without mutating it. `map` transforms each element and returns a new array of the **same length**; `filter` returns a new array with only the elements whose callback returns truthy (**same or shorter**); `reduce` folds all elements into a **single value** of any type — a number, object, Map or even another array — using an accumulator.',
    details: [
      {
        type: 'code',
        lang: 'javascript',
        code: `const orders = [
  { id: 1, customer: 'asha', total: 120, status: 'paid' },
  { id: 2, customer: 'ben',  total: 40,  status: 'pending' },
  { id: 3, customer: 'asha', total: 75,  status: 'paid' },
];

// map: 1 → 1 transformation
const ids = orders.map((o) => o.id);                 // [1, 2, 3]

// filter: keep some
const paid = orders.filter((o) => o.status === 'paid'); // orders 1 and 3

// reduce: many → one
const revenue = paid.reduce((sum, o) => sum + o.total, 0); // 195

// reduce into an object: group by customer
const byCustomer = orders.reduce((acc, o) => {
  (acc[o.customer] ??= []).push(o.id);
  return acc;
}, {});
// { asha: [1, 3], ben: [2] }

// Chaining
const paidTotalsOver50 = orders
  .filter((o) => o.status === 'paid')
  .map((o) => o.total)
  .filter((t) => t > 50);  // [120, 75]`,
      },
      { type: 'heading3', text: 'Comparison' },
      {
        type: 'bullets',
        items: [
          '**map(fn)** → new array, same length; use for transforming/shaping (e.g. DB rows → DTOs).',
          '**filter(fn)** → new array, subset; use for selecting.',
          '**reduce(fn, initial)** → anything; use for sums, grouping, indexing by id, flattening.',
          'All three skip holes in sparse arrays and pass `(element, index, array)` to the callback (reduce gets the accumulator first).',
          'Always pass an initial value to `reduce` — without it, an empty array throws `TypeError: Reduce of empty array with no initial value`.',
        ],
      },
      { type: 'heading3', text: 'Async callbacks are a trap' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// map with async returns an array of Promises
const users = await Promise.all(ids.map((id) => db.findUser(id))); // ✅ parallel

// filter with async does NOT work — a Promise is always truthy
const active = ids.filter(async (id) => (await db.findUser(id)).active); // ❌ keeps everything

// ✅ resolve first, then filter
const all = await Promise.all(ids.map((id) => db.findUser(id)));
const activeUsers = all.filter((u) => u.active);`,
      },
      {
        type: 'bullets',
        items: [
          'Modern alternatives for grouping: `Object.groupBy(orders, (o) => o.customer)` and `Map.groupBy` (Node 21+).',
          'For very hot paths, a single `for` loop can be faster than a long chain that allocates intermediate arrays — measure before optimising.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: using `map` just for side effects (ignoring the returned array) — use `forEach` or `for...of` instead. And never pass an async callback to `filter` or `reduce` expecting it to await.',
      },
    ],
  },

  'promise-all-vs-allsettled-vs-race-vs-any': {
    summary:
      'All four take an iterable of promises and run them concurrently. `Promise.all` resolves with all values or **rejects on the first rejection** (fail-fast). `Promise.allSettled` always resolves with every outcome (`{status, value | reason}`). `Promise.race` settles with **whichever settles first**, success or failure. `Promise.any` resolves with the **first success** and rejects with an `AggregateError` only if all fail.',
    details: [
      {
        type: 'bullets',
        items: [
          '**all** — need every result; one failure means the whole operation failed. E.g. load user + permissions + settings for a page.',
          '**allSettled** — want every outcome, even partial failures. E.g. send notifications to 50 webhooks and report which failed.',
          '**race** — first to settle wins. E.g. implement a timeout around an operation.',
          '**any** — first success wins. E.g. query several mirrors/replicas and use the fastest healthy one.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (e, ms) => new Promise((_, rj) => setTimeout(() => rj(new Error(e)), ms));

await Promise.all([ok('a', 100), ok('b', 50)]);
// ['a', 'b'] — order matches input, not completion

await Promise.all([ok('a', 100), fail('boom', 50)]);
// rejects with Error('boom') after 50 ms

await Promise.allSettled([ok('a', 100), fail('boom', 50)]);
// [ { status: 'fulfilled', value: 'a' },
//   { status: 'rejected',  reason: Error('boom') } ]

await Promise.race([ok('slow', 100), fail('fast-fail', 50)]);
// rejects with 'fast-fail' — first to SETTLE

await Promise.any([fail('x', 10), ok('first-success', 50), ok('later', 100)]);
// 'first-success'

await Promise.any([fail('x', 10), fail('y', 20)]);
// AggregateError: All promises were rejected  (err.errors = [x, y])`,
      },
      { type: 'heading3', text: 'Real Node patterns' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Parallel independent queries for one response
const [user, orders] = await Promise.all([
  db.users.findById(id),
  db.orders.findByUser(id),
]);

// Batch job that must not stop on the first failure
const results = await Promise.allSettled(webhooks.map((url) => fetch(url, { method: 'POST' })));
const failed = results.filter((r) => r.status === 'rejected');
logger.warn({ failed: failed.length }, 'webhook delivery');

// Timeout — prefer AbortSignal.timeout so the request is actually cancelled
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });`,
      },
      {
        type: 'bullets',
        items: [
          '`Promise.all` does **not** cancel the other promises when one rejects — they keep running; their later rejections are ignored by `all`.',
          'A `race`-based timeout leaves the losing operation running too; pass an `AbortSignal` when the API supports it.',
          'Empty input: `all([])` and `allSettled([])` resolve to `[]`; `any([])` rejects with `AggregateError`; `race([])` stays pending forever.',
          'To limit concurrency (e.g. 10 at a time out of 10,000), use a pool like `p-limit` rather than one huge `Promise.all`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame it as "what does failure mean for my use case?" — fail-fast (all), collect everything (allSettled), first settled (race), first success (any) — and give one realistic backend example for each.',
      },
    ],
  },

  'generators-and-async-generators': {
    summary:
      'A generator (`function*`) is a function that can pause with `yield` and resume later; calling it returns an iterator, and each `next()` runs it to the next `yield`. An async generator (`async function*`) can also `await` inside and yields promises, so you consume it with `for await...of`. In Node they are ideal for lazily producing sequences and for consuming streams, paginated APIs and large files piece by piece.',
    details: [
      {
        type: 'paragraph',
        text: 'Generators are lazy: values are produced only when asked for. That makes them perfect for infinite sequences or large data sets where you do not want everything in memory at once.',
      },
      { type: 'heading3', text: 'Sync generators' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function* idGenerator(prefix) {
  let n = 1;
  while (true) yield prefix + '-' + n++; // infinite, but lazy
}

const ids = idGenerator('order');
ids.next(); // { value: 'order-1', done: false }
ids.next(); // { value: 'order-2', done: false }

function* chunk(arr, size) {
  for (let i = 0; i < arr.length; i += size) yield arr.slice(i, i + size);
}
for (const batch of chunk(rows, 500)) {
  await db.insertMany(batch); // insert in batches of 500
}

[...chunk([1, 2, 3, 4, 5], 2)]; // [[1, 2], [3, 4], [5]] — generators are iterable`,
      },
      { type: 'heading3', text: 'Async generators: paginated APIs' },
      {
        type: 'code',
        lang: 'javascript',
        code: `async function* fetchAllCustomers() {
  let cursor = null;
  do {
    const url = 'https://api.example.com/customers?limit=100' + (cursor ? '&cursor=' + cursor : '');
    const res = await fetch(url);
    const page = await res.json();
    yield* page.data;            // yield each customer individually
    cursor = page.nextCursor;
  } while (cursor);
}

for await (const customer of fetchAllCustomers()) {
  await syncToCrm(customer);
  if (customer.id === stopId) break; // break calls return() → generator stops fetching
}`,
      },
      { type: 'heading3', text: 'Streams are async iterables' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { createReadStream } from 'node:fs';
import readline from 'node:readline';
import { pipeline } from 'node:stream/promises';

// Read a 5 GB log file line by line with constant memory
const rl = readline.createInterface({ input: createReadStream('access.log') });
let errors = 0;
for await (const line of rl) {
  if (line.includes(' 500 ')) errors++;
}

// Async generators can be pipeline stages
await pipeline(
  createReadStream('input.txt'),
  async function* (source) {
    for await (const chunk of source) yield chunk.toString().toUpperCase();
  },
  process.stdout,
);`,
      },
      {
        type: 'bullets',
        items: [
          'Iterator protocol: `next()`, `return()` (early exit, runs `finally` blocks), `throw()`.',
          '`yield*` delegates to another iterable or generator.',
          'Generators can also receive values: `const x = yield 1;` gets whatever is passed to `next(value)`.',
          'Async iteration over a stream respects backpressure — the stream pauses while your loop body awaits.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give the paginated-API or stream example — it shows you know generators are a practical tool for memory-efficient data processing in Node, not just a syntax curiosity.',
      },
    ],
  },

  'proxy-objects-and-their-uses': {
    summary:
      'A `Proxy` wraps a target object and lets you intercept fundamental operations on it — property get/set, `in`, delete, function calls, `new` — through "trap" functions in a handler. It is used for validation, logging/observability, default values, access control, lazy loading and reactive systems (Vue 3, MobX, Immer use Proxies). `Reflect` provides the default behaviour for each trap.',
    details: [
      {
        type: 'code',
        lang: 'javascript',
        code: `const target = { name: 'Asha' };

const proxy = new Proxy(target, {
  get(obj, prop, receiver) {
    console.log('read', String(prop));
    return Reflect.get(obj, prop, receiver); // default behaviour
  },
  set(obj, prop, value, receiver) {
    console.log('write', String(prop), value);
    return Reflect.set(obj, prop, value, receiver); // must return true on success
  },
});

proxy.name;        // logs: read name → 'Asha'
proxy.age = 30;    // logs: write age 30
target.age;        // 30 — the target is actually modified`,
      },
      { type: 'heading3', text: 'Use case: validated config object' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function strictEnv(env) {
  return new Proxy(env, {
    get(obj, key) {
      if (typeof key === 'string' && !(key in obj)) {
        throw new Error('Missing required env var: ' + key);
      }
      return obj[key];
    },
    set() {
      throw new Error('Config is read-only');
    },
  });
}

const config = strictEnv(process.env);
config.DATABASE_URL;   // value
config.DATABSE_URL;    // ❌ throws immediately — typo caught at startup, not in production`,
      },
      { type: 'heading3', text: 'Use case: auto-instrumented client' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function withTiming(client, logger) {
  return new Proxy(client, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver);
      if (typeof value !== 'function') return value;
      return async (...args) => {
        const start = performance.now();
        try {
          return await value.apply(obj, args);
        } finally {
          logger.info({ method: String(prop), ms: performance.now() - start });
        }
      };
    },
  });
}

const repo = withTiming(new UserRepository(pool), logger);
await repo.findById(42); // logs { method: 'findById', ms: 3.2 }`,
      },
      {
        type: 'bullets',
        items: [
          'Common traps: `get`, `set`, `has` (for `in`), `deleteProperty`, `ownKeys`, `apply` (function calls), `construct` (`new`).',
          'Always use `Reflect.*` inside traps to preserve correct semantics (getters, `receiver`, return values).',
          'Proxies add overhead on every intercepted operation — avoid them in very hot code paths.',
          'Identity: `proxy !== target`, and some built-ins with internal slots (`Map`, `Date`) need methods bound to the target to work through a proxy.',
          '`Proxy.revocable()` creates a proxy you can disable later — useful for granting temporary access.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name a real library that relies on Proxies (Vue 3 reactivity, Immer, MobX) and one practical backend use (validation, instrumentation) — that shows you know where Proxies are worth their cost.',
      },
    ],
  },

  'weakmap-weakset-and-garbage-collection': {
    summary:
      '`WeakMap` is a key-value map whose keys must be objects (or non-registered symbols) and are held **weakly**; `WeakSet` is a set of weakly held objects. "Weak" means the collection does not keep its keys alive — if nothing else references a key object, the garbage collector can reclaim it and the entry disappears automatically. Because entries can vanish at any time, they are not iterable and have no `size`.',
    details: [
      {
        type: 'paragraph',
        text: 'A normal `Map` holds a strong reference to its keys. If you use request or socket objects as keys and forget to delete them, those objects (and everything they reference) can never be collected — a classic memory leak in long-running Node processes. A `WeakMap` lets you attach data to an object for exactly as long as that object lives.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Map: leaks — every request object stays in memory forever
const startTimes = new Map();
app.use((req, res, next) => { startTimes.set(req, Date.now()); next(); });

// ✅ WeakMap: once req is no longer referenced, its entry can be collected
const startTimesWeak = new WeakMap();
app.use((req, res, next) => {
  startTimesWeak.set(req, Date.now());
  res.on('finish', () => {
    console.log('took', Date.now() - startTimesWeak.get(req), 'ms');
  });
  next();
});`,
      },
      { type: 'heading3', text: 'Typical use cases' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// 1. Caching computed results per object
const cache = new WeakMap();
function expensiveSummary(order) {
  if (!cache.has(order)) cache.set(order, computeSummary(order));
  return cache.get(order);
}

// 2. Private data for class instances (pre-#private fields pattern)
const secrets = new WeakMap();
class ApiClient {
  constructor(token) { secrets.set(this, { token }); }
  headers() { return { authorization: 'Bearer ' + secrets.get(this).token }; }
}

// 3. WeakSet: "have I seen/processed this object?" without leaking
const visited = new WeakSet();
function walk(node) {
  if (visited.has(node)) return; // handles circular graphs
  visited.add(node);
  node.children.forEach(walk);
}`,
      },
      { type: 'heading3', text: 'Map vs WeakMap' },
      {
        type: 'bullets',
        items: [
          '**Keys**: Map — any value; WeakMap — objects (and non-registered symbols) only. Primitives cannot be weak keys because they have no identity to collect.',
          '**References**: Map keeps keys alive; WeakMap does not.',
          '**API**: WeakMap has only `get`, `set`, `has`, `delete` — no `size`, `keys()`, `forEach` or iteration, because contents depend on GC timing.',
          'Values are held strongly **while the key is alive** — but a value that references its own key does not keep the entry alive (ephemeron semantics).',
          'Related: `WeakRef` and `FinalizationRegistry` give lower-level weak references and cleanup callbacks; use them sparingly since GC timing is non-deterministic.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: expecting a WeakMap entry to disappear immediately after you drop the key. Collection happens whenever V8 decides to run GC — never build logic that depends on when an entry vanishes.',
      },
    ],
  },
};
