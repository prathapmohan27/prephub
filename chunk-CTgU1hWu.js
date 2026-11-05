var e={"What is the difference between null and undefined in JavaScript?":{summary:'`undefined` means a value was never assigned — it is what JavaScript gives you for uninitialised variables, missing properties, missing arguments and functions without a `return`. `null` is an explicit, intentional "no value" that a developer assigns. `typeof undefined` is `"undefined"`, while `typeof null` is `"object"` (a historical bug).',details:[{type:`paragraph`,text:'A practical way to think about it: **undefined is the language saying "nothing here yet"**, **null is your code saying "deliberately empty"**. Many teams use `null` for "known to be absent" (e.g. a user without a middle name) and let `undefined` mean "not provided".'},{type:`heading3`,text:`Where each one comes from`},{type:`code`,lang:`javascript`,code:`let a;
console.log(a);                    // undefined \u2014 declared, not assigned

const user = { name: 'Asha' };
console.log(user.email);           // undefined \u2014 missing property

function greet(name) { return name; }
console.log(greet());              // undefined \u2014 missing argument
console.log((() => {})());         // undefined \u2014 no return

const row = await db.findUser(42);
console.log(row);                  // null \u2014 the driver explicitly says "no row"
console.log(JSON.parse('{"manager": null}').manager); // null \u2014 JSON has null, not undefined`},{type:`heading3`,text:`Comparisons and checks`},{type:`code`,lang:`javascript`,code:`typeof undefined;        // 'undefined'
typeof null;             // 'object'  \u2190 historical quirk
null == undefined;       // true   (loose equality treats them as equal)
null === undefined;      // false
Number(null);            // 0
Number(undefined);       // NaN

// Check for "either one"
if (value == null) { /* null or undefined */ }
const port = process.env.PORT ?? 3000;  // ?? only falls back on null/undefined
const name = user?.profile?.name;       // optional chaining \u2192 undefined if missing`},{type:`heading3`,text:`Behaviour that matters in Node APIs`},{type:`code`,lang:`javascript`,code:`JSON.stringify({ a: undefined, b: null });
// '{"b":null}'  \u2014 undefined properties are DROPPED, null is kept

function connect({ retries = 3 } = {}) { return retries; }
connect({ retries: undefined }); // 3 \u2014 default parameters apply to undefined
connect({ retries: null });      // null \u2014 but NOT to null

// In a PATCH endpoint this distinction is useful:
// { "nickname": null }  \u2192 clear the nickname
// {}                    \u2192 leave nickname unchanged`},{type:`bullets`,items:["Use `??` instead of `||` for defaults so valid values like `0` and `''` are not replaced.","Both are falsy and both are primitives; neither has properties — accessing `null.x` throws `TypeError`.","In TypeScript with `strictNullChecks`, `null` and `undefined` are distinct types; `x?: string` means `string | undefined`."]},{type:`callout`,variant:`tip`,text:`Interview tip: mention the JSON difference (undefined is dropped) and default parameters (only undefined triggers them) — these are the real-world consequences that show experience beyond the definition.`}]},"What is the difference between == and === in JavaScript?":{summary:'`===` (strict equality) compares value **and** type with no conversion. `==` (loose equality) first applies type coercion when the types differ, following a set of rules that produce surprising results like `"0" == false` being `true`. Use `===` by default; the one common accepted use of `==` is `x == null` to check for both null and undefined.',details:[{type:`paragraph`,text:"With `==`, if the operand types differ JavaScript converts them: booleans become numbers, strings are converted to numbers when compared with numbers, objects are converted to primitives via `valueOf`/`toString`, and `null`/`undefined` equal only each other."},{type:`code`,lang:`javascript`,code:`1 === 1;            // true
1 === '1';          // false \u2014 different types
1 == '1';           // true  \u2014 '1' \u2192 1

0 == '';            // true  \u2014 '' \u2192 0
'0' == false;       // true  \u2014 false \u2192 0, '0' \u2192 0
'' == false;        // true
[] == false;        // true  \u2014 [] \u2192 '' \u2192 0
[] == ![];          // true  \u{1F92F}
null == undefined;  // true
null == 0;          // false \u2014 null only loosely equals undefined
NaN == NaN;         // false \u2014 and NaN === NaN is false too`},{type:`heading3`,text:`A Node-flavoured bug`},{type:`code`,lang:`javascript`,code:`// Query strings and env vars are always strings
app.get('/orders', (req, res) => {
  const page = req.query.page;           // '0'
  if (page == 0) { /* true \u2014 works by accident */ }
  if (page === 0) { /* false \u2014 string vs number */ }

  // \u2705 Convert explicitly, then compare strictly
  const pageNum = Number.parseInt(page ?? '1', 10);
  if (pageNum === 0) { /* ... */ }
});

if (process.env.FEATURE_X == true) {}  // \u274C 'true' == true \u2192 NaN == 1 \u2192 false!
if (process.env.FEATURE_X === 'true') {} // \u2705`},{type:`heading3`,text:`Related: Object.is`},{type:`code`,lang:`javascript`,code:`Object.is(NaN, NaN);  // true   (=== says false)
Object.is(0, -0);     // false  (=== says true)
// Number.isNaN(x) is the usual way to check for NaN`},{type:`bullets`,items:["Objects (including arrays) are compared by **reference** with both operators: `{} === {}` is `false`.",'ESLint rule `eqeqeq` (often with the `"null": "ignore"` option) enforces strict equality.',`TypeScript flags many nonsensical comparisons (e.g. number vs string) at compile time.`]},{type:`callout`,variant:`tip`,text:'Interview tip: don\'t just say "=== also checks type". Explain that `==` performs coercion, give one surprising example, and mention the `x == null` idiom as the deliberate exception.'}]},"What is the Temporal Dead Zone (TDZ) in JavaScript and why does accessing let and const before declaration throw a ReferenceError?":{summary:"`let`, `const` and `class` declarations **are hoisted** — the engine knows about the binding from the start of its scope — but they are **not initialised** until the declaration line executes. The period between entering the scope and that line is the Temporal Dead Zone; touching the variable there throws `ReferenceError: Cannot access 'x' before initialization`. `var`, by contrast, is initialised to `undefined` when hoisted, so early access silently returns `undefined`.",details:[{type:`paragraph`,text:'The TDZ exists to catch bugs: reading a variable before it has a meaningful value is almost always a mistake, and `const` would be meaningless if you could observe it as `undefined` and then as its real value. It is "temporal" because it depends on execution time, not on where code is written.'},{type:`heading3`,text:`var vs let/const`},{type:`code`,lang:`javascript`,code:`console.log(a); // undefined \u2014 var is hoisted AND initialised
var a = 1;

console.log(b); // \u274C ReferenceError: Cannot access 'b' before initialization
let b = 2;

// Proof that let IS hoisted \u2014 the inner b shadows the outer one for the whole block
let c = 'outer';
{
  console.log(c); // \u274C ReferenceError (not 'outer') \u2014 inner c is in its TDZ
  let c = 'inner';
}`},{type:`heading3`,text:`Temporal, not positional`},{type:`code`,lang:`javascript`,code:`function logLimit() {
  console.log(LIMIT); // defined above the const \u2014 but only CALLED later
}
const LIMIT = 100;
logLimit(); // \u2705 100 \u2014 the declaration ran before the call

// typeof is not safe in the TDZ either
typeof undeclared;   // 'undefined'
typeof later;        // \u274C ReferenceError
let later = 1;`},{type:`heading3`,text:`Where it bites in Node`},{type:`code`,lang:`javascript`,code:`// Circular ES module imports
// a.mjs
import { b } from './b.mjs';
export const a = 'A';

// b.mjs
import { a } from './a.mjs';
console.log(a); // \u274C ReferenceError \u2014 a.mjs has not finished evaluating, a is in its TDZ
export const b = 'B';

// Default parameters have their own TDZ as well
function f(x = y, y = 1) {}
f(); // \u274C ReferenceError \u2014 y is used before it is initialised`},{type:`bullets`,items:["Hoisting summary: `var` → hoisted + `undefined`; `let`/`const`/`class` → hoisted, uninitialised (TDZ); function declarations → hoisted with their body.",`The TDZ turns subtle ordering bugs into immediate, loud errors.`,"In CommonJS, circular requires give you a partially filled `exports` object instead; in ESM they can surface as TDZ errors."]},{type:`callout`,variant:`warning`,text:`Common wrong answer: "let and const are not hoisted." They are hoisted — the shadowing example proves it. The correct statement is that they are hoisted but not initialised.`}]},"What are closures and how are they used in Node.js?":{summary:`A closure is a function bundled with the variables of the scope where it was **created**, so it can keep reading and updating them even after that outer function has returned. In Node, closures are everywhere: callbacks and promise handlers capturing request data, middleware factories, private state in modules, memoisation, and partially applied functions.`,details:[{type:`paragraph`,text:`JavaScript uses lexical scope: a function can see variables from where it is written. When an inner function outlives its outer function — returned, stored, or passed as a callback — the engine keeps those captured variables alive in memory. That captured environment is the closure.`},{type:`heading3`,text:`Basic example: private state`},{type:`code`,lang:`javascript`,code:`function createCounter() {
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
console.log(c.count);     // undefined \u2014 truly private`},{type:`heading3`,text:`Node use case: middleware factories`},{type:`code`,lang:`javascript`,code:`// The returned middleware "remembers" options and the limits map
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

app.use('/api', rateLimit({ max: 100, windowMs: 60_000 }));`},{type:`heading3`,text:`Callbacks capture request context`},{type:`code`,lang:`javascript`,code:`app.get('/users/:id', (req, res) => {
  const { id } = req.params;          // captured by the callback below
  const started = Date.now();
  db.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
    // Runs later, but still sees id, started and res from this request
    console.log('user', id, 'took', Date.now() - started, 'ms');
    res.json(result.rows[0]);
  });
});`},{type:`heading3`,text:`Memoisation`},{type:`code`,lang:`javascript`,code:`function memoize(fn) {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) cache.set(arg, fn(arg));
    return cache.get(arg);
  };
}
const getConfig = memoize((env) => loadConfigFromDisk(env));`},{type:`bullets`,items:["Classic loop gotcha: with `var i` all callbacks share one `i`; `let i` creates a new binding per iteration.",`Closures keep captured objects alive — a long-lived closure (e.g. an event listener or a module-level cache) holding a large object is a common **memory leak** in Node.`,"Each closure has its own copy of the environment per call: two `createCounter()` calls give two independent counters."]},{type:`callout`,variant:`warning`,text:"Pitfall: unbounded caches inside closures (like the `hits` map above) grow forever in a long-running server. Add eviction/TTL, use an LRU cache, or store the data in Redis."}]},"What is the difference between call(), apply(), and bind()?":{summary:"All three set the value of `this` for a function. `call(thisArg, a, b)` invokes it immediately with arguments listed individually; `apply(thisArg, [a, b])` invokes it immediately with arguments as an array; `bind(thisArg, a)` does **not** invoke — it returns a new function permanently bound to that `this` (and optional pre-filled arguments).",details:[{type:`paragraph`,text:"In JavaScript `this` is decided by **how** a function is called, not where it is defined (except arrow functions, which inherit `this` lexically). These three methods let you control it explicitly."},{type:`code`,lang:`javascript`,code:`const logger = { prefix: '[api]' };

function log(level, msg) {
  return this.prefix + ' ' + level + ': ' + msg;
}

log.call(logger, 'info', 'started');        // '[api] info: started'
log.apply(logger, ['warn', 'slow query']);  // '[api] warn: slow query'

const info = log.bind(logger, 'info');      // nothing runs yet
info('listening on 3000');                  // '[api] info: listening on 3000'`},{type:`heading3`,text:`The classic lost-this problem`},{type:`code`,lang:`javascript`,code:`class UserController {
  constructor(service) { this.service = service; }
  async list(req, res) {
    res.json(await this.service.findAll());
  }
}
const ctrl = new UserController(userService);

app.get('/users', ctrl.list);              // \u274C TypeError: Cannot read properties of undefined
app.get('/users', ctrl.list.bind(ctrl));   // \u2705
app.get('/users', (req, res) => ctrl.list(req, res)); // \u2705 arrow wrapper

// Or define as a class field arrow function:
// list = async (req, res) => { ... }`},{type:`heading3`,text:`Practical uses of apply/call`},{type:`code`,lang:`javascript`,code:`Math.max.apply(null, [3, 9, 2]);   // 9 \u2014 today you'd write Math.max(...arr)

// Borrowing a method
Array.prototype.slice.call(arguments); // old way to turn arguments into an array

// Event emitters call listeners with this = emitter
emitter.on('data', function () { console.log(this === emitter); }); // true
emitter.on('data', () => { /* arrow: this is NOT the emitter */ });`},{type:`bullets`,items:[`Memory hook: **C**all = **c**omma-separated args, **A**pply = **a**rray, **B**ind = **b**ound for later.`,"`bind` is permanent: binding a bound function again does not change `this`.","Arrow functions ignore `call`/`apply`/`bind` for `this` (arguments still pass through).","In strict mode (all ES modules and classes), calling a detached method gives `this === undefined` rather than the global object."]},{type:`callout`,variant:`tip`,text:"Interview tip: show the Express/controller example where passing a method as a callback loses `this` — it demonstrates why `bind` matters in real Node code, not just in trivia."}]},"Explain the JavaScript prototype chain":{summary:"Every JavaScript object has an internal link (`[[Prototype]]`) to another object, its prototype. When you read a property that the object does not have, the engine walks up this chain of prototypes until it finds the property or reaches `null`. This is how inheritance works in JavaScript — `class` and `extends` are syntax on top of prototypes.",details:[{type:`paragraph`,text:"Methods are not copied onto each object. A thousand `User` instances share one `User.prototype` object that holds the methods, which saves memory. Writing a property, however, always creates it on the object itself (shadowing the prototype's version) — the chain is only used for lookups."},{type:`code`,lang:`javascript`,code:`class Animal {
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
rex.fly;         // undefined \u2014 reached null without finding it

Object.getPrototypeOf(rex) === Dog.prototype;              // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
Object.getPrototypeOf(Object.prototype);                   // null \u2014 end of chain

Object.hasOwn(rex, 'name');  // true \u2014 own property
Object.hasOwn(rex, 'speak'); // false \u2014 inherited
rex instanceof Animal;       // true \u2014 Animal.prototype is somewhere in the chain`},{type:`flow`,title:`Property lookup for rex.speak()`,code:`flowchart LR
  R["rex<br/>own: name"]:::client -->|"[[Prototype]]"| D["Dog.prototype<br/>bark"]:::server
  D -->|"[[Prototype]]"| A["Animal.prototype<br/>speak \u2713"]:::highlight
  A -->|"[[Prototype]]"| O["Object.prototype<br/>toString, hasOwnProperty"]:::server
  O --> N["null"]:::external`},{type:`heading3`,text:`The same thing without class syntax`},{type:`code`,lang:`javascript`,code:`function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return this.name + ' makes a sound'; };

const base = { greet() { return 'hi from ' + this.name; } };
const obj = Object.create(base); // obj's prototype is base
obj.name = 'Asha';
obj.greet(); // 'hi from Asha'

const dict = Object.create(null); // no prototype at all \u2014 no toString, no __proto__`},{type:`heading3`,text:`Why it matters in Node`},{type:`bullets`,items:["Node core builds on it: `class MyStream extends Readable`, `class Service extends EventEmitter`.",'**Prototype pollution**: if user JSON like `{"__proto__": {"isAdmin": true}}` is deep-merged into an object, it can modify `Object.prototype` and affect every object in the process. Use `Object.create(null)`, `Map`, schema validation, and safe merge libraries.',"Performance: V8 optimises objects with stable shapes; mutating prototypes at runtime (`Object.setPrototypeOf`) deoptimises code.","Do not extend built-in prototypes (`Array.prototype.myFn = ...`) — it leaks into every module and dependency."]},{type:`callout`,variant:`tip`,text:'Interview tip: explain lookup ("walk up until found or null"), say `class` is syntactic sugar, and mention prototype pollution — linking the concept to a real Node security issue stands out.'}]},"What is the difference between deep clone and shallow clone?":{summary:"A shallow clone copies only the top level: primitive values are copied, but nested objects and arrays are **shared by reference** with the original. A deep clone recursively copies every level, so the copy is fully independent. In modern Node, `structuredClone()` is the built-in way to deep clone; spread (`{...obj}`) and `Object.assign` are shallow.",details:[{type:`code`,lang:`javascript`,code:`const original = {
  name: 'order-1',
  items: [{ sku: 'A', qty: 1 }],
  meta: { createdAt: new Date('2026-01-01') },
};

// Shallow
const shallow = { ...original };
shallow.name = 'changed';           // original.name unchanged \u2705
shallow.items[0].qty = 99;          // original.items[0].qty is now 99 \u274C shared!

// Deep
const deep = structuredClone(original);
deep.items[0].qty = 5;              // original untouched \u2705
deep.meta.createdAt instanceof Date; // true \u2014 Dates are preserved`},{type:`heading3`,text:`Ways to clone and their trade-offs`},{type:`bullets`,items:["**Shallow**: `{ ...obj }`, `Object.assign({}, obj)`, `[...arr]`, `arr.slice()`, `Array.from(arr)`.","**structuredClone(obj)** (Node 17+): handles nested objects, arrays, `Date`, `Map`, `Set`, `RegExp`, typed arrays and **circular references**. Throws on functions and DOM nodes; drops class prototypes (instances become plain objects) and getters.","**JSON.parse(JSON.stringify(obj))**: old trick — loses `undefined`, functions, `Date` (becomes string), `Map`/`Set` (become `{}`), `NaN`/`Infinity` (become null), and throws on circular references.","**Library**: `lodash.cloneDeep` for more control (keeps prototypes in some cases)."]},{type:`code`,lang:`javascript`,code:`const data = { when: new Date(), tags: new Set(['a']), skip: undefined };
data.self = data; // circular

JSON.parse(JSON.stringify(data));  // \u274C TypeError: Converting circular structure to JSON
structuredClone(data);             // \u2705 { when: Date, tags: Set, skip: undefined, self: [Circular] }

structuredClone({ fn: () => 1 });  // \u274C DataCloneError: functions cannot be cloned`},{type:`heading3`,text:`Why it matters in a Node service`},{type:`code`,lang:`javascript`,code:`// Shared default config mutated per request \u2014 a real bug
const DEFAULTS = { headers: { 'x-client': 'api' }, retries: 3 };

function buildRequest(userHeaders) {
  const opts = { ...DEFAULTS };              // shallow!
  Object.assign(opts.headers, userHeaders);  // \u274C mutates DEFAULTS.headers for everyone
  return opts;
}

function buildRequestFixed(userHeaders) {
  return { ...DEFAULTS, headers: { ...DEFAULTS.headers, ...userHeaders } }; // \u2705 copy what you change
}`},{type:`callout`,variant:`tip`,text:"Interview tip: say that you rarely need a full deep clone — copying only the path you modify (immutable update) is cheaper. When you do need one, name `structuredClone` and its limits (no functions, loses class prototypes)."}]},"What is the difference between Array.map(), Array.filter(), and Array.reduce()?":{summary:"All three iterate an array without mutating it. `map` transforms each element and returns a new array of the **same length**; `filter` returns a new array with only the elements whose callback returns truthy (**same or shorter**); `reduce` folds all elements into a **single value** of any type — a number, object, Map or even another array — using an accumulator.",details:[{type:`code`,lang:`javascript`,code:`const orders = [
  { id: 1, customer: 'asha', total: 120, status: 'paid' },
  { id: 2, customer: 'ben',  total: 40,  status: 'pending' },
  { id: 3, customer: 'asha', total: 75,  status: 'paid' },
];

// map: 1 \u2192 1 transformation
const ids = orders.map((o) => o.id);                 // [1, 2, 3]

// filter: keep some
const paid = orders.filter((o) => o.status === 'paid'); // orders 1 and 3

// reduce: many \u2192 one
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
  .filter((t) => t > 50);  // [120, 75]`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**map(fn)** → new array, same length; use for transforming/shaping (e.g. DB rows → DTOs).`,`**filter(fn)** → new array, subset; use for selecting.`,`**reduce(fn, initial)** → anything; use for sums, grouping, indexing by id, flattening.`,"All three skip holes in sparse arrays and pass `(element, index, array)` to the callback (reduce gets the accumulator first).","Always pass an initial value to `reduce` — without it, an empty array throws `TypeError: Reduce of empty array with no initial value`."]},{type:`heading3`,text:`Async callbacks are a trap`},{type:`code`,lang:`javascript`,code:`// map with async returns an array of Promises
const users = await Promise.all(ids.map((id) => db.findUser(id))); // \u2705 parallel

// filter with async does NOT work \u2014 a Promise is always truthy
const active = ids.filter(async (id) => (await db.findUser(id)).active); // \u274C keeps everything

// \u2705 resolve first, then filter
const all = await Promise.all(ids.map((id) => db.findUser(id)));
const activeUsers = all.filter((u) => u.active);`},{type:`bullets`,items:["Modern alternatives for grouping: `Object.groupBy(orders, (o) => o.customer)` and `Map.groupBy` (Node 21+).","For very hot paths, a single `for` loop can be faster than a long chain that allocates intermediate arrays — measure before optimising."]},{type:`callout`,variant:`warning`,text:"Pitfall: using `map` just for side effects (ignoring the returned array) — use `forEach` or `for...of` instead. And never pass an async callback to `filter` or `reduce` expecting it to await."}]},"What is Promise.all() vs Promise.allSettled() vs Promise.race() vs Promise.any()?":{summary:"All four take an iterable of promises and run them concurrently. `Promise.all` resolves with all values or **rejects on the first rejection** (fail-fast). `Promise.allSettled` always resolves with every outcome (`{status, value | reason}`). `Promise.race` settles with **whichever settles first**, success or failure. `Promise.any` resolves with the **first success** and rejects with an `AggregateError` only if all fail.",details:[{type:`bullets`,items:[`**all** — need every result; one failure means the whole operation failed. E.g. load user + permissions + settings for a page.`,`**allSettled** — want every outcome, even partial failures. E.g. send notifications to 50 webhooks and report which failed.`,`**race** — first to settle wins. E.g. implement a timeout around an operation.`,`**any** — first success wins. E.g. query several mirrors/replicas and use the fastest healthy one.`]},{type:`code`,lang:`javascript`,code:`const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (e, ms) => new Promise((_, rj) => setTimeout(() => rj(new Error(e)), ms));

await Promise.all([ok('a', 100), ok('b', 50)]);
// ['a', 'b'] \u2014 order matches input, not completion

await Promise.all([ok('a', 100), fail('boom', 50)]);
// rejects with Error('boom') after 50 ms

await Promise.allSettled([ok('a', 100), fail('boom', 50)]);
// [ { status: 'fulfilled', value: 'a' },
//   { status: 'rejected',  reason: Error('boom') } ]

await Promise.race([ok('slow', 100), fail('fast-fail', 50)]);
// rejects with 'fast-fail' \u2014 first to SETTLE

await Promise.any([fail('x', 10), ok('first-success', 50), ok('later', 100)]);
// 'first-success'

await Promise.any([fail('x', 10), fail('y', 20)]);
// AggregateError: All promises were rejected  (err.errors = [x, y])`},{type:`heading3`,text:`Real Node patterns`},{type:`code`,lang:`javascript`,code:`// Parallel independent queries for one response
const [user, orders] = await Promise.all([
  db.users.findById(id),
  db.orders.findByUser(id),
]);

// Batch job that must not stop on the first failure
const results = await Promise.allSettled(webhooks.map((url) => fetch(url, { method: 'POST' })));
const failed = results.filter((r) => r.status === 'rejected');
logger.warn({ failed: failed.length }, 'webhook delivery');

// Timeout \u2014 prefer AbortSignal.timeout so the request is actually cancelled
const res = await fetch(url, { signal: AbortSignal.timeout(2000) });`},{type:`bullets`,items:["`Promise.all` does **not** cancel the other promises when one rejects — they keep running; their later rejections are ignored by `all`.","A `race`-based timeout leaves the losing operation running too; pass an `AbortSignal` when the API supports it.","Empty input: `all([])` and `allSettled([])` resolve to `[]`; `any([])` rejects with `AggregateError`; `race([])` stays pending forever.","To limit concurrency (e.g. 10 at a time out of 10,000), use a pool like `p-limit` rather than one huge `Promise.all`."]},{type:`callout`,variant:`tip`,text:`Interview tip: frame it as "what does failure mean for my use case?" — fail-fast (all), collect everything (allSettled), first settled (race), first success (any) — and give one realistic backend example for each.`}]},"What are generator functions and async generators in JavaScript?":{summary:"A generator (`function*`) is a function that can pause with `yield` and resume later; calling it returns an iterator, and each `next()` runs it to the next `yield`. An async generator (`async function*`) can also `await` inside and yields promises, so you consume it with `for await...of`. In Node they are ideal for lazily producing sequences and for consuming streams, paginated APIs and large files piece by piece.",details:[{type:`paragraph`,text:`Generators are lazy: values are produced only when asked for. That makes them perfect for infinite sequences or large data sets where you do not want everything in memory at once.`},{type:`heading3`,text:`Sync generators`},{type:`code`,lang:`javascript`,code:`function* idGenerator(prefix) {
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

[...chunk([1, 2, 3, 4, 5], 2)]; // [[1, 2], [3, 4], [5]] \u2014 generators are iterable`},{type:`heading3`,text:`Async generators: paginated APIs`},{type:`code`,lang:`javascript`,code:`async function* fetchAllCustomers() {
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
  if (customer.id === stopId) break; // break calls return() \u2192 generator stops fetching
}`},{type:`heading3`,text:`Streams are async iterables`},{type:`code`,lang:`javascript`,code:`import { createReadStream } from 'node:fs';
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
);`},{type:`bullets`,items:["Iterator protocol: `next()`, `return()` (early exit, runs `finally` blocks), `throw()`.","`yield*` delegates to another iterable or generator.","Generators can also receive values: `const x = yield 1;` gets whatever is passed to `next(value)`.",`Async iteration over a stream respects backpressure — the stream pauses while your loop body awaits.`]},{type:`callout`,variant:`tip`,text:`Interview tip: give the paginated-API or stream example — it shows you know generators are a practical tool for memory-efficient data processing in Node, not just a syntax curiosity.`}]},"What is a Proxy object and how is it used?":{summary:'A `Proxy` wraps a target object and lets you intercept fundamental operations on it — property get/set, `in`, delete, function calls, `new` — through "trap" functions in a handler. It is used for validation, logging/observability, default values, access control, lazy loading and reactive systems (Vue 3, MobX, Immer use Proxies). `Reflect` provides the default behaviour for each trap.',details:[{type:`code`,lang:`javascript`,code:`const target = { name: 'Asha' };

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

proxy.name;        // logs: read name \u2192 'Asha'
proxy.age = 30;    // logs: write age 30
target.age;        // 30 \u2014 the target is actually modified`},{type:`heading3`,text:`Use case: validated config object`},{type:`code`,lang:`javascript`,code:`function strictEnv(env) {
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
config.DATABSE_URL;    // \u274C throws immediately \u2014 typo caught at startup, not in production`},{type:`heading3`,text:`Use case: auto-instrumented client`},{type:`code`,lang:`javascript`,code:`function withTiming(client, logger) {
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
await repo.findById(42); // logs { method: 'findById', ms: 3.2 }`},{type:`bullets`,items:["Common traps: `get`, `set`, `has` (for `in`), `deleteProperty`, `ownKeys`, `apply` (function calls), `construct` (`new`).","Always use `Reflect.*` inside traps to preserve correct semantics (getters, `receiver`, return values).",`Proxies add overhead on every intercepted operation — avoid them in very hot code paths.`,"Identity: `proxy !== target`, and some built-ins with internal slots (`Map`, `Date`) need methods bound to the target to work through a proxy.","`Proxy.revocable()` creates a proxy you can disable later — useful for granting temporary access."]},{type:`callout`,variant:`tip`,text:`Interview tip: name a real library that relies on Proxies (Vue 3 reactivity, Immer, MobX) and one practical backend use (validation, instrumentation) — that shows you know where Proxies are worth their cost.`}]},"What are WeakMap and WeakSet, and why do they allow garbage collection?":{summary:'`WeakMap` is a key-value map whose keys must be objects (or non-registered symbols) and are held **weakly**; `WeakSet` is a set of weakly held objects. "Weak" means the collection does not keep its keys alive — if nothing else references a key object, the garbage collector can reclaim it and the entry disappears automatically. Because entries can vanish at any time, they are not iterable and have no `size`.',details:[{type:`paragraph`,text:"A normal `Map` holds a strong reference to its keys. If you use request or socket objects as keys and forget to delete them, those objects (and everything they reference) can never be collected — a classic memory leak in long-running Node processes. A `WeakMap` lets you attach data to an object for exactly as long as that object lives."},{type:`code`,lang:`javascript`,code:`// \u274C Map: leaks \u2014 every request object stays in memory forever
const startTimes = new Map();
app.use((req, res, next) => { startTimes.set(req, Date.now()); next(); });

// \u2705 WeakMap: once req is no longer referenced, its entry can be collected
const startTimesWeak = new WeakMap();
app.use((req, res, next) => {
  startTimesWeak.set(req, Date.now());
  res.on('finish', () => {
    console.log('took', Date.now() - startTimesWeak.get(req), 'ms');
  });
  next();
});`},{type:`heading3`,text:`Typical use cases`},{type:`code`,lang:`javascript`,code:`// 1. Caching computed results per object
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
}`},{type:`heading3`,text:`Map vs WeakMap`},{type:`bullets`,items:[`**Keys**: Map — any value; WeakMap — objects (and non-registered symbols) only. Primitives cannot be weak keys because they have no identity to collect.`,`**References**: Map keeps keys alive; WeakMap does not.`,"**API**: WeakMap has only `get`, `set`, `has`, `delete` — no `size`, `keys()`, `forEach` or iteration, because contents depend on GC timing.",`Values are held strongly **while the key is alive** — but a value that references its own key does not keep the entry alive (ephemeron semantics).`,"Related: `WeakRef` and `FinalizationRegistry` give lower-level weak references and cleanup callbacks; use them sparingly since GC timing is non-deterministic."]},{type:`callout`,variant:`warning`,text:`Pitfall: expecting a WeakMap entry to disappear immediately after you drop the key. Collection happens whenever V8 decides to run GC — never build logic that depends on when an entry vanishes.`}]},"Explain event bubbling and event capturing in JavaScript":{summary:"In the DOM, an event travels in three phases: **capturing** (from `window` down through ancestors to the target), **target**, then **bubbling** (from the target back up to `window`). Listeners run in the bubbling phase by default; pass `{ capture: true }` to run during capturing. `stopPropagation()` halts the journey. Node's `EventEmitter` has no propagation at all — events go only to listeners on that emitter.",details:[{type:`paragraph`,text:"This is a browser DOM concept, but it comes up in Node interviews because full-stack developers use both, and because Node implements the web `EventTarget` API (used by `AbortSignal`, `MessagePort`, workers) — without a DOM tree, so there is nothing to bubble through."},{type:`code`,lang:`html`,code:`<div id="outer">
  <button id="btn">Click</button>
</div>

<script>
  const log = (msg) => () => console.log(msg);
  outer.addEventListener('click', log('outer - capture'), { capture: true });
  outer.addEventListener('click', log('outer - bubble'));
  btn.addEventListener('click', log('button - target'));

  // Clicking the button logs:
  // outer - capture
  // button - target
  // outer - bubble
<\/script>`},{type:`flow`,title:`The three phases of a DOM event`,code:`flowchart LR
  W["window"]:::client -->|"1 capture"| D["document"]:::client
  D -->|"1 capture"| O["div outer"]:::server
  O -->|"2 target"| B["button"]:::highlight
  B -->|"3 bubble"| O2["div outer"]:::server
  O2 -->|"3 bubble"| D2["document"]:::client`},{type:`heading3`,text:`Event delegation — the main practical benefit`},{type:`code`,lang:`javascript`,code:`// One listener on the list instead of one per row (works for rows added later too)
document.querySelector('#orders').addEventListener('click', (e) => {
  const row = e.target.closest('[data-order-id]');
  if (!row) return;
  openOrder(row.dataset.orderId);
});

// stopPropagation vs preventDefault
link.addEventListener('click', (e) => {
  e.preventDefault();    // stop the browser's default action (navigation)
  e.stopPropagation();   // stop the event from reaching ancestors
});`},{type:`heading3`,text:`Contrast with Node`},{type:`code`,lang:`javascript`,code:`import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();
emitter.on('order:created', (order) => console.log('listener 1', order.id));
emitter.on('order:created', (order) => console.log('listener 2', order.id));
emitter.emit('order:created', { id: 7 });
// listeners run synchronously, in registration order \u2014 no capture/bubble phases

// EventTarget in Node (no tree, so no propagation)
const ac = new AbortController();
ac.signal.addEventListener('abort', () => console.log('aborted'));
ac.abort();`},{type:`bullets`,items:["Some events do not bubble (`focus`, `blur`, `mouseenter`); use `focusin`/`focusout` for delegation.","`e.target` is the element that triggered the event; `e.currentTarget` is the element whose listener is running.","`stopImmediatePropagation()` also prevents other listeners on the same element."]},{type:`callout`,variant:`tip`,text:`Interview tip: describe the three phases, then give event delegation as the practical payoff. If the role is backend-heavy, add that Node's EventEmitter has no propagation — a sign you know where the concept does and does not apply.`}]}};export{e as answers};