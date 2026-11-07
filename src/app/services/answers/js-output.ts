// Predict the output: short JavaScript puzzles. Every printed output was produced by running
// the snippet in Node; each answer links back to the concept in JavaScript Fundamentals.
import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'microtasks-vs-macrotasks-order': {
    summary:
      'It prints `1, 5, 7, 3, 4, 6, 2`: all synchronous code first, then every microtask (`then`, `queueMicrotask`, the code after `await`) in the order they were queued, and only then the `setTimeout` callback. Microtasks always drain completely before the event loop takes the next macrotask.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Run as an ES module (`node file.mjs`) or in a browser `<script type="module">`; the order is the same in both.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nconsole.log('1: script start');\n\nsetTimeout(() => console.log('2: timeout'), 0);\n\nPromise.resolve().then(() => console.log('3: then'));\n\nqueueMicrotask(() => console.log('4: microtask'));\n\nasync function run() {\n  console.log('5: run start');\n  await null;\n  console.log('6: after await');\n}\nrun();\n\nconsole.log('7: script end');",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: '1: script start\n5: run start\n7: script end\n3: then\n4: microtask\n6: after await\n2: timeout',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          'Synchronous code runs top to bottom: `1: script start`. `setTimeout` hands its callback to the timer queue (a macrotask). `Promise.resolve().then(...)` queues microtask **M1** (`3`). `queueMicrotask(...)` queues **M2** (`4`).',
          'Calling `run()` executes its body synchronously up to the first `await`, so `5: run start` prints now. `await null` wraps `null` in a resolved promise and queues the rest of `run` as microtask **M3** (`6`).',
          'The script finishes with `7: script end`. The call stack is now empty.',
          'The engine drains the microtask queue in FIFO order: M1 prints `3`, M2 prints `4`, M3 prints `6`.',
          'Only when the microtask queue is empty does the event loop move on to the timers phase and run the `setTimeout` callback: `2`.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'Interviewers then ask what happens when a microtask schedules more work: a nested `then` still runs before any timer, while a `setTimeout` created inside a `then` goes to the back of the timer queue.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "setTimeout(() => console.log('A: timeout'), 0);\n\nPromise.resolve().then(() => {\n  console.log('B: then 1');\n  setTimeout(() => console.log('C: timeout from then'), 0);\n  Promise.resolve().then(() => console.log('D: nested then'));\n});\n\nconsole.log('E: sync');",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'E: sync\nB: then 1\nD: nested then\nA: timeout\nC: timeout from then',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'What if `run()` had two `await`s? (Each `await` is another hop through the microtask queue, so the second part runs after anything queued in between.)',
          'Where does `process.nextTick` fit in Node? (Before promise microtasks: Node drains the nextTick queue first, then the promise queue.)',
          'Can microtasks starve the page? (Yes: a microtask that keeps queuing microtasks blocks timers, rendering and input forever.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Thinking `setTimeout(fn, 0)` runs "immediately" or before promises.',
          'Forgetting that the body of an `async` function runs synchronously until the first `await`.',
          'Treating `queueMicrotask` and `.then` as different priorities; they share one FIFO queue.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you name the two queues, explain that the microtask queue drains completely between macrotasks, and connect it to real consequences: UI updates after `await`, starvation risks, and why `setTimeout(0)` is used to yield to rendering. See the Event Loop answer in JavaScript Fundamentals for the full model.',
      },
    ],
  },
  'var-vs-let-in-a-settimeout-loop': {
    summary:
      'It prints `var: 3` three times, then `let: 0`, `let: 1`, `let: 2`: `var` has one binding for the whole function, so every callback reads its final value, while `let` in a `for` header creates a fresh binding per iteration that each closure captures.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Plain script (`node file.js`); module vs script makes no difference here.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log('var:', i), 0);\n}\n\nfor (let j = 0; j < 3; j++) {\n  setTimeout(() => console.log('let:', j), 0);\n}",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: 'var: 3\nvar: 3\nvar: 3\nlet: 0\nlet: 1\nlet: 2',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          'Both loops run to completion synchronously; the six callbacks only run later, after the loops are done.',
          '`var i` is function-scoped (here: script-scoped), so there is exactly one `i`. All three arrow functions close over that same variable.',
          'When the loop ends, `i` is `3` (the value that failed `i < 3`). Each `var` callback reads `i` at call time and prints `3`.',
          'For `let j` in a `for` header, the spec creates a new copy of `j` for each iteration and copies the value forward. Each callback captured a different binding, holding `0`, `1` and `2`.',
          'Timers with the same delay run in the order they were scheduled, so all `var` lines print before the `let` lines.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'The classic follow-up is "fix it without `let`" (an IIFE that captures the value), and the trap: `let` declared outside the loop behaves like `var`, because there is only one binding again.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "for (var i = 0; i < 3; i++) {\n  setTimeout(((n) => () => console.log('iife:', n))(i), 0);\n}\n\nlet k = 0;\nfor (; k < 3; k++) {\n  setTimeout(() => console.log('outer let:', k), 0);\n}",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'iife: 0\niife: 1\niife: 2\nouter let: 3\nouter let: 3\nouter let: 3',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'How did people fix this before ES2015? (An IIFE or `setTimeout(fn, 0, i)` passing the value as an argument.)',
          'Does `const` work in a classic `for (const i = 0; ...; i++)`? (No: the increment reassigns it and throws; `const` is fine in `for...of`.)',
          'Is this only about `setTimeout`? (No: any closure created in the loop, such as event handlers, shows the same behaviour.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Saying `let` is "faster" or "block-scoped so it is copied"; the key is the per-iteration binding.',
          'Assuming moving `let` outside the loop keeps the fix.',
          'Expecting `var: 0, 1, 2` because "the timeout is 0 ms".',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain closures capture variables (bindings), not values, describe the per-iteration binding rule for `let` in `for` headers, and mention where this bites in real code: handlers attached in loops and async callbacks reading mutable state.',
      },
    ],
  },
  'this-method-detached-arrow-callback': {
    summary:
      'It prints `hi Asha`, `hi undefined`, `hi undefined`, `callback: false`, `arrow callback: Asha`: `this` is decided by how a function is called, except arrow functions, which take `this` from the surrounding scope.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: "Assumes: Run as a CommonJS script in non-strict mode (`node file.js`, no `'use strict'`). The variation shows strict mode.",
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nconst user = {\n  name: 'Asha',\n  greet() {\n    return `hi ${this.name}`;\n  },\n  greetArrow: () => `hi ${this && this.name}`,\n  greetLater() {\n    setTimeout(function () {\n      console.log('callback:', this === user);\n    }, 0);\n    setTimeout(() => {\n      console.log('arrow callback:', this.name);\n    }, 0);\n  },\n};\n\nconst detached = user.greet;\n\nconsole.log(user.greet());\nconsole.log(detached());\nconsole.log(user.greetArrow());\nuser.greetLater();",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: 'hi Asha\nhi undefined\nhi undefined\ncallback: false\narrow callback: Asha',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          '`user.greet()` is a method call, so `this` is `user`: `hi Asha`.',
          '`detached()` is a plain call. In non-strict code `this` falls back to the global object; `globalThis.name` is `undefined`, so it prints `hi undefined`. (In a browser script it would read `window.name`, usually an empty string.)',
          '`greetArrow` is an arrow function defined in an object literal. Object literals do not create a `this` scope, so it uses the module-level `this`: in a CommonJS file that is `module.exports` (`{}`), which has no `name`.',
          'Inside `greetLater`, the regular `function` passed to `setTimeout` is called by the timer, not as a method of `user`, so `this === user` is `false` (in Node it is the `Timeout` object; in a browser, `window`).',
          "The arrow callback has no own `this`; it uses `greetLater`'s `this`, which is `user` because `greetLater` was called as `user.greetLater()`: `arrow callback: Asha`.",
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: "In strict mode (ES modules, classes, `'use strict'`) a detached call gets `this === undefined`, so reading `this.name` throws instead of quietly returning `undefined`. `bind` fixes the receiver permanently.",
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "'use strict';\nconst user = {\n  name: 'Asha',\n  greet() {\n    return this.name;\n  },\n};\nconst detached = user.greet;\nconst bound = user.greet.bind(user);\nconsole.log(bound());\ntry {\n  console.log(detached());\n} catch (e) {\n  console.log(e.constructor.name + ': ' + e.message);\n}",
      },
      {
        type: 'code',
        lang: 'text',
        code: "Asha\nTypeError: Cannot read properties of undefined (reading 'name')",
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'What does `new` do to `this`? (Creates a fresh object and binds `this` to it, overriding `bind` for regular functions.)',
          'Why do Angular or React class handlers lose `this`? (They are passed as detached callbacks; use arrow properties or `bind`.)',
          'Can you `call`/`apply` an arrow function with a different `this`? (No: arrows ignore the `thisArg`.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Using an arrow function as an object method and expecting `this` to be the object.',
          'Thinking `this` is fixed where the function is defined (true only for arrows).',
          'Ignoring strict vs sloppy mode: the same detached call returns `undefined` in one and throws in the other.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you state the four binding rules in priority order (`new`, explicit `call`/`apply`/`bind`, method call, default) plus the arrow exception, and you call out that the result depends on strict mode and the environment. See call/apply/bind in JavaScript Fundamentals.',
      },
    ],
  },
  'hoisting-and-the-temporal-dead-zone': {
    summary:
      'It prints `function`, `undefined`, `declared`, `ReferenceError`, `undefined`: function declarations are hoisted with their body, `var` is hoisted and set to `undefined`, and `let` is hoisted but unusable until its line runs (the temporal dead zone).',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Plain CommonJS script (`node file.js`); strict mode does not change these results.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nconsole.log(typeof hoisted);\nconsole.log(a);\nconsole.log(hoisted());\n\nvar a = 1;\n\nfunction hoisted() {\n  return 'declared';\n}\n\ntry {\n  console.log(b);\n} catch (e) {\n  console.log(e.name);\n}\nlet b = 2;\n\nconsole.log(typeof expr);\nvar expr = function () {};",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: 'function\nundefined\ndeclared\nReferenceError\nundefined',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          'Before any code runs, the engine creates all bindings for the scope. `function hoisted` is created fully initialised, so `typeof hoisted` is `function` and calling it works: `declared`.',
          '`var a` is created and initialised to `undefined`; the assignment `a = 1` happens later, so `console.log(a)` prints `undefined`.',
          '`let b` is also created up front but stays uninitialised until its declaration line executes. Reading it earlier throws `ReferenceError` (caught and printed by name).',
          '`var expr = function () {}` is a variable holding a function expression. Only the `var` is hoisted, so before the assignment `typeof expr` is `undefined`.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'The tricky variation: a local `var` shadows the outer variable for the whole function, even on lines before it is declared, and a local `let` turns the outer variable into a TDZ error instead of falling back to it.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "var x = 'outer';\nfunction show() {\n  console.log(x);\n  var x = 'inner';\n  console.log(x);\n}\nshow();\n\nlet y = 'outer';\nfunction show2() {\n  try {\n    console.log(y);\n  } catch (e) {\n    console.log(e.name);\n  }\n  let y = 'inner';\n}\nshow2();",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'undefined\ninner\nReferenceError',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'Why does the TDZ exist? (To catch use-before-declaration bugs that `var` silently allowed.)',
          'Are `class` declarations hoisted? (Yes, but like `let`: accessing them before the declaration throws.)',
          'Does `typeof` protect you in the TDZ? (No: `typeof b` before `let b` also throws.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Saying `let` is "not hoisted"; it is hoisted, just not initialised.',
          'Expecting a function expression assigned to `var` to be callable before its line.',
          'Assuming the outer variable is used until the inner `var`/`let` line is reached.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain hoisting as the creation phase of a scope (bindings exist before code runs, with different initial states) rather than "moving code up", and you connect the TDZ to shadowing bugs. See the TDZ answer in JavaScript Fundamentals.',
      },
    ],
  },
  'async-return-values-and-uncaught-rejections': {
    summary:
      'It prints `true`, `42`, `plain value`, `after fail()`, and then Node crashes with `Error: boom`: an `async` function always returns a promise, `await` on a plain value just wraps it, and calling an async function that throws without `await` or `.catch` creates an unhandled rejection.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Node 15+ as an ES module (`node file.mjs`); the browser difference is described below.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nasync function getValue() {\n  return 42;\n}\n\nasync function main() {\n  const p = getValue();\n  console.log(p instanceof Promise);\n  console.log(await p);\n  console.log(await 'plain value');\n\n  async function fail() {\n    throw new Error('boom');\n  }\n  fail();\n  console.log('after fail()');\n}\n\nmain();",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: 'true\n42\nplain value\nafter fail()\nError: boom\n# the process then exits with code 1 (unhandled rejection)',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          '`getValue()` returns a promise even though the body returns `42`, so `p instanceof Promise` is `true`.',
          "`await p` unwraps it to `42`. `await 'plain value'` treats the string as an already-resolved promise and gives back the string (after one microtask hop).",
          '`fail()` throws inside an async function, which rejects the promise it returns. Nobody awaits or catches that promise, and `main` keeps going: `after fail()`.',
          'When the microtask queue drains and the rejection still has no handler, Node (version 15 and later) treats it as fatal: it prints the error and exits with code 1. A browser instead logs "Uncaught (in promise) Error: boom" in the console and the page keeps running.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'The follow-up shows that `try/catch` only catches a rejected promise you `await`. Without `await`, the `try` block finishes before the promise rejects, so the error escapes and still crashes the process.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "async function fail() {\n  throw new Error('boom');\n}\n\nasync function main() {\n  try {\n    fail();\n  } catch {\n    console.log('caught without await');\n  }\n  try {\n    await fail();\n  } catch (e) {\n    console.log('caught with await:', e.message);\n  }\n}\nmain();",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'caught with await: boom\nError: boom\n# the process then exits with code 1 (unhandled rejection)',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          "How do you make Node only warn? (`--unhandled-rejections=warn`, but fix the code instead; use a `process.on('unhandledRejection')` handler to log and exit cleanly.)",
          'Why does `return await` matter inside `try`? (Without `await`, the rejection happens after the `try` has exited, so your `catch` never runs.)',
          'How do you catch these in a codebase? (The `@typescript-eslint/no-floating-promises` lint rule.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Thinking `async function f() { return 1 }` returns `1`.',
          'Wrapping a non-awaited async call in `try/catch` and assuming errors are handled.',
          'Assuming browser behaviour (console error) is what happens in Node.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain that an un-awaited rejection is a production crash in Node, not just a console warning, and you name the defences: always await or attach `.catch`, the floating-promise lint rule, and a process-level handler as a last resort. See "async errors get lost" in Node Error Handling.',
      },
    ],
  },
  'references-const-and-shallow-copies': {
    summary:
      "It prints `Ben`, `Delhi`, `[ 'a', 'b' ]`, `false true`, `TypeError`: assignment copies a reference, spread makes a shallow copy (nested objects are still shared), and `const` stops reassignment, not mutation.",
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Any environment; shown as an ES module (`node file.mjs`).',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nconst original = { name: 'Asha', address: { city: 'Pune' }, tags: ['a'] };\n\nconst sameRef = original;\nconst copy = { ...original };\n\nsameRef.name = 'Ben';\ncopy.name = 'Chen';\ncopy.address.city = 'Delhi';\ncopy.tags.push('b');\n\nconsole.log(original.name);\nconsole.log(original.address.city);\nconsole.log(original.tags);\nconsole.log(copy === original, copy.address === original.address);\n\ntry {\n  original = {};\n} catch (e) {\n  console.log(e.name);\n}",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: "Ben\nDelhi\n[ 'a', 'b' ]\nfalse true\nTypeError",
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          "`sameRef = original` copies the reference, so `sameRef.name = 'Ben'` changes the original object: it prints `Ben`.",
          "`{ ...original }` creates a new top-level object, so `copy.name = 'Chen'` does not affect the original.",
          "The spread only copies the first level. `copy.address` and `copy.tags` point at the same nested object and array as `original`, so the city change and the `push` show up in the original: `Delhi` and `[ 'a', 'b' ]`.",
          '`copy === original` is `false` (different objects) while `copy.address === original.address` is `true` (shared).',
          '`original = {}` tries to reassign a `const` binding, which throws `TypeError`, even though mutating the object was fine.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'The fix interviewers expect is `structuredClone` for a real deep copy (it also keeps `Date` objects), and the trap: `Object.freeze` is shallow too.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "const original = { address: { city: 'Pune' }, created: new Date(0) };\nconst deep = structuredClone(original);\ndeep.address.city = 'Delhi';\nconsole.log(original.address.city, deep.address.city);\nconsole.log(deep.created instanceof Date);\n\nconst frozen = Object.freeze({ inner: { n: 1 } });\nfrozen.inner.n = 2;\nconsole.log(frozen.inner.n);",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'Pune Delhi\ntrue\n2',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'When is `JSON.parse(JSON.stringify(x))` wrong? (It loses `Date`, `Map`, `Set`, `undefined` and fails on cycles.)',
          'Why does this matter in Angular `OnPush` or NgRx? (Mutating a nested object keeps the same reference, so change detection or selectors do not see it.)',
          'How do you update nested state immutably? (Spread each level you change, or use a helper such as Immer.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Believing `const` makes an object immutable.',
          'Assuming spread or `Object.assign` copies deeply.',
          'Mutating state that a UI framework compares by reference.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate binding (`const`) from value (mutable object), know exactly which copy methods are shallow, and tie it to immutable updates for change detection. See deep vs shallow copy in JavaScript Fundamentals.',
      },
    ],
  },
  'counter-factory-and-shared-closures': {
    summary:
      'It prints `3 1 3`: each call to `makeCounter` creates its own `count`, both functions returned from one call share that same variable, and destructuring the functions does not copy the state.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Any environment; shown as an ES module.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: '// What does this print?\nfunction makeCounter() {\n  let count = 0;\n  return {\n    inc: () => ++count,\n    get: () => count,\n  };\n}\n\nconst a = makeCounter();\nconst b = makeCounter();\n\na.inc();\na.inc();\nb.inc();\n\nconst { inc, get } = a;\ninc();\n\nconsole.log(a.get(), b.get(), get());',
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: '3 1 3',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          'Each call to `makeCounter()` runs the function again and creates a new `count` variable. `a` and `b` each get their own.',
          "`inc` and `get` from the same call close over the same `count`, so they see each other's changes.",
          "`a.inc()` twice makes a's count `2`; `b.inc()` makes b's count `1`.",
          "`const { inc, get } = a` copies the function references, not the state. The arrow functions do not use `this`, so calling `inc()` detached still increments a's count to `3`.",
          'So `a.get()` is `3`, `b.get()` is `1` and the detached `get()` is `3`.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'If `count` moves outside the factory, every counter shares one variable, which is exactly the module-level singleton behaviour that surprises people in Node.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: 'let count = 0;\nfunction makeCounter() {\n  return {\n    inc: () => ++count,\n    get: () => count,\n  };\n}\nconst a = makeCounter();\nconst b = makeCounter();\na.inc();\na.inc();\nb.inc();\nconsole.log(a.get(), b.get());',
      },
      {
        type: 'code',
        lang: 'text',
        code: '3 3',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'How is this "private state"? (Nothing outside can reach `count` except through the returned functions.)',
          'Can closures leak memory? (Yes: a long-lived closure keeps everything it references alive, such as a large array or a DOM node.)',
          'How would a class version differ when destructured? (Methods using `this` would break when detached; these arrow closures do not.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Thinking each returned function has its own copy of `count`.',
          'Expecting the destructured `inc` to lose its state.',
          'Putting state at module level and being surprised it is shared across callers.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain that a closure keeps a reference to its scope, not a snapshot, use it to justify the module pattern and private state, and mention the memory-retention side effect. See closures in JavaScript Fundamentals.',
      },
    ],
  },
  'predict-type-coercion': {
    summary:
      'It prints `12`, `2`, `33`, `123`, `true`, `true false`, `false`, an empty line, `[object Object]`, `1,23`, `2`: `+` concatenates as soon as one side is a string, other arithmetic operators convert to numbers, and `==` follows a fixed set of conversion rules.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Plain script (`node file.js`); `console.log` prints an empty string as an empty line.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nconsole.log(1 + '2');\nconsole.log('3' - 1);\nconsole.log(1 + 2 + '3');\nconsole.log('1' + 2 + 3);\nconsole.log(0 == '');\nconsole.log(null == undefined, null == 0);\nconsole.log(NaN == NaN);\nconsole.log([] + []);\nconsole.log([] + {});\nconsole.log([1, 2] + [3]);\nconsole.log(true + 1);",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: '12\n2\n33\n123\ntrue\ntrue false\nfalse\n\n[object Object]\n1,23\n2',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          "`1 + '2'`: one operand is a string, so `+` concatenates: `12`. `'3' - 1`: `-` only does maths, so `'3'` becomes `3`: `2`.",
          "`+` evaluates left to right: `1 + 2` is `3`, then `3 + '3'` is `33`. In `'1' + 2 + 3` the string comes first, so everything concatenates: `123`.",
          "`0 == ''`: the string becomes a number (`0`), so `true`. `null == undefined` is a special case that is `true`, but `null == 0` is `false` because `null` only loosely equals `undefined`.",
          '`NaN == NaN` is `false`: `NaN` is not equal to anything, itself included.',
          "Objects convert to primitives with `toString`: `[]` becomes `''`, `{}` becomes `'[object Object]'`, `[1, 2]` becomes `'1,2'`. So `[] + []` is an empty string, `[] + {}` is `[object Object]`, and `[1, 2] + [3]` is `1,23`. `true + 1` is `2`.",
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'The usual follow-ups: `[] == false` (both become `0`) even though `[]` is truthy, and `||` vs `??`.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "console.log([] == false);\nconsole.log(!![]);\nconsole.log('' || 'default', 0 ?? 'default');\nconsole.log(typeof null, typeof NaN);",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'true\ntrue\ndefault 0\nobject number',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'Why does `{} + []` give `0` in a browser console? (At the start of a line `{}` is parsed as an empty block, leaving `+[]`.)',
          'When would you use `==` deliberately? (Only `x == null` to check for `null` or `undefined`; otherwise use `===`.)',
          'How does TypeScript help? (It flags many of these mixed-type operations at compile time.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Assuming `+` always adds numbers.',
          "Using `||` for defaults and losing valid `0` or `''` values; `??` only replaces `null`/`undefined`.",
          'Checking `x === NaN` instead of `Number.isNaN(x)`.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you explain the rules (ToPrimitive, then ToNumber or string concatenation) instead of memorising cases, and you give the team rule: `===` everywhere except `== null`, `??` for defaults, `Number.isNaN`. See `==` vs `===` in JavaScript Fundamentals.',
      },
    ],
  },
  'prototypes-shadowing-class-fields-vs-methods': {
    summary:
      'It prints `Rex makes a woof sound`, `false true`, `false true`, `own patched`: methods live once on the prototype, class fields (including arrow fields) are copied onto every instance, and an own property shadows anything up the prototype chain.',
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: Modern Node or browser (class fields, `Object.hasOwn`); shown as an ES module.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nclass Animal {\n  sound = 'generic';\n  speak() {\n    return `${this.name} makes a ${this.sound} sound`;\n  }\n  describe = () => 'arrow field';\n}\n\nclass Dog extends Animal {\n  sound = 'woof';\n  constructor(name) {\n    super();\n    this.name = name;\n  }\n}\n\nconst rex = new Dog('Rex');\nconsole.log(rex.speak());\nconsole.log(Object.hasOwn(rex, 'speak'), Object.hasOwn(rex, 'describe'));\nconsole.log(Object.hasOwn(Dog.prototype, 'speak'), 'speak' in rex);\n\nAnimal.prototype.speak = function () {\n  return 'patched';\n};\nrex.speak = () => 'own';\nconsole.log(rex.speak(), new Dog('Max').speak());",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: 'Rex makes a woof sound\nfalse true\nfalse true\nown patched',
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          "Field initialisers run per instance: `Animal` sets `sound = 'generic'`, then `Dog`'s field overwrites it with `woof` right after `super()` returns. `speak` reads `this.sound` and `this.name` on the instance: `Rex makes a woof sound`.",
          "`speak` is a method, so it lives on `Animal.prototype`, not on `rex`: `Object.hasOwn(rex, 'speak')` is `false`. `describe` is an arrow **field**, so every instance gets its own copy: `true`.",
          "`speak` is not on `Dog.prototype` either (it is one level higher, on `Animal.prototype`), so `hasOwn` is `false`, but `'speak' in rex` walks the chain and finds it: `true`.",
          'Assigning `rex.speak` creates an own property that shadows the prototype method, so `rex.speak()` is `own`. A new `Dog` has no own `speak` and finds the patched prototype method: `patched`.',
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: "A favourite trap: a parent constructor that reads a field or calls a method sees the parent's field value (child fields are not set yet) but the child's overridden method (methods come from the prototype chain).",
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "class Base {\n  greeting = 'base field';\n  constructor() {\n    console.log('constructor sees:', this.greeting, this.describe());\n  }\n  describe() {\n    return 'base method';\n  }\n}\nclass Child extends Base {\n  greeting = 'child field';\n  describe() {\n    return 'child method';\n  }\n}\nnew Child();",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'constructor sees: base field child method',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'Why prefer methods over arrow fields? (One shared function per class instead of one per instance; arrow fields cost memory but keep `this` bound.)',
          'What does `Object.create(null)` give you? (An object with no prototype, useful for dictionaries.)',
          'How do you find where a property comes from? (`Object.hasOwn` on each object while walking `Object.getPrototypeOf`.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Thinking class methods are copied onto each instance.',
          "Expecting the child's field value inside the parent constructor.",
          'Patching built-in prototypes in application code.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you describe lookup as "own properties first, then up the chain", explain when fields are initialised relative to `super()`, and weigh arrow fields (bound `this`) against prototype methods (shared, overridable, mockable). See the prototype chain answer in JavaScript Fundamentals.',
      },
    ],
  },
  'promise-all-vs-allsettled-with-a-rejection': {
    summary:
      "It prints `all rejected: b-failed` and then `[ 'a', 'x b-failed', 'c' ]`: `Promise.all` rejects as soon as any input rejects, while `Promise.allSettled` always waits for every input and reports each result.",
    details: [
      {
        type: 'callout',
        variant: 'info',
        text: 'Assumes: ES module (`node file.mjs`), which allows top-level `await`.',
      },
      {
        type: 'heading3',
        text: 'The snippet',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "// What does this print?\nconst wait = (ms, value, fail = false) =>\n  new Promise((resolve, reject) =>\n    setTimeout(() => (fail ? reject(new Error(value)) : resolve(value)), ms),\n  );\n\nconst tasks = () => [wait(30, 'a'), wait(10, 'b-failed', true), wait(20, 'c')];\n\ntry {\n  const all = await Promise.all(tasks());\n  console.log('all:', all);\n} catch (e) {\n  console.log('all rejected:', e.message);\n}\n\nconst settled = await Promise.allSettled(tasks());\nconsole.log(settled.map((r) => (r.status === 'fulfilled' ? r.value : `x ${r.reason.message}`)));",
      },
      {
        type: 'heading3',
        text: 'Output',
      },
      {
        type: 'code',
        lang: 'text',
        code: "all rejected: b-failed\n[ 'a', 'x b-failed', 'c' ]",
      },
      {
        type: 'heading3',
        text: 'Why, step by step',
      },
      {
        type: 'numbered',
        items: [
          '`tasks()` starts three timers at once: `a` resolves at 30 ms, `b` rejects at 10 ms, `c` resolves at 20 ms.',
          '`Promise.all` rejects with the first rejection it sees. At 10 ms `b` rejects, so the `catch` prints `all rejected: b-failed`. It does not wait for `a` or `c`.',
          'The other two promises are not cancelled; their timers still fire and their results are ignored.',
          "`Promise.allSettled` gets a fresh set of tasks and waits for all three, then returns objects like `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`, in input order, not completion order.",
        ],
      },
      {
        type: 'heading3',
        text: 'Variation interviewers add',
      },
      {
        type: 'paragraph',
        text: 'The variation shows that the slow task still runs after `Promise.all` has rejected, and compares `race` (first to settle, success or failure) with `any` (first to succeed).',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: "const wait = (ms, value, fail = false) =>\n  new Promise((resolve, reject) =>\n    setTimeout(() => {\n      console.log('settled:', value);\n      fail ? reject(new Error(value)) : resolve(value);\n    }, ms),\n  );\n\ntry {\n  await Promise.all([wait(30, 'slow'), wait(10, 'fast-fail', true)]);\n} catch (e) {\n  console.log('caught:', e.message);\n}\nconsole.log('race:', await Promise.race([wait(5, 'r1'), wait(1, 'r2')]));\nconsole.log('any:', await Promise.any([wait(2, 'bad', true), wait(4, 'good')]));",
      },
      {
        type: 'code',
        lang: 'text',
        code: 'settled: fast-fail\ncaught: fast-fail\nsettled: r2\nrace: r2\nsettled: bad\nsettled: r1\nsettled: good\nany: good\nsettled: slow',
      },
      {
        type: 'heading3',
        text: 'Follow-up questions interviewers ask',
      },
      {
        type: 'bullets',
        items: [
          'How do you cancel the others when one fails? (Pass an `AbortSignal` to each task and abort it in the `catch`.)',
          'Which would you use for a dashboard calling five APIs? (`allSettled`, so one failing widget does not blank the page.)',
          'What does `Promise.any` reject with when everything fails? (An `AggregateError` holding all the reasons.)',
        ],
      },
      {
        type: 'heading3',
        text: 'Common mistakes',
      },
      {
        type: 'bullets',
        items: [
          'Assuming `Promise.all` stops the other operations when one fails.',
          'Expecting `allSettled` results in completion order.',
          'Starting async work in a loop with `await` inside, which runs it one at a time instead of in parallel.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you choose the combinator by failure semantics (fail fast, collect all, first success, first settled), point out that rejection does not cancel in-flight work, and add cancellation with `AbortController` when it matters. See the Promise combinators answer in JavaScript Fundamentals.',
      },
    ],
  },
};
