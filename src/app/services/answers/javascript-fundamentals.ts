import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is the latest JavaScript version you have used?': {
    summary:
      'JavaScript is standardised as ECMAScript and has shipped a new edition every year since ES2015 (ES6). Day to day I use modern ES2020+ features — optional chaining, nullish coalescing, `async/await`, top-level `await` in ES modules, `Array.prototype.at()`, `structuredClone`, and newer additions like `findLast()` and the non-mutating `toSorted()`/`toReversed()` — with the exact target controlled by TypeScript and the build tool.',
    details: [
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

  'What are ES6 features?': {
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
    ],
  },

  'Difference between var, let, and const': {
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

  'What is the Temporal Dead Zone (TDZ) in JavaScript and how does it affect hoisting with let and const?':
    {
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
      ],
    },

  'Difference between == and ===': {
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
    ],
  },

  'Explain closures with practical examples': {
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
    ],
  },

  'What is currying in JavaScript?': {
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

  'What are ES6 Arrow Functions (`() => {}`) in JavaScript/TypeScript and how do they differ from regular functions?':
    {
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

  'Difference between prototype and __proto__': {
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

  'How to implement inheritance in JavaScript?': {
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

  'Deep copy vs shallow copy': {
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
    ],
  },

  'Explain how the JavaScript Event Loop works': {
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

  'What is a Promise in JavaScript?': {
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

  'Debounce vs Throttle': {
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
};
