var e={"check-for-a-palindrome":{summary:'A palindrome reads the same forwards and backwards. The clean solution uses two pointers — one at each end moving inward and comparing characters — which is O(n) time and O(1) extra space. The one-liner `str.split("").reverse().join("") === str` also works but allocates extra arrays. Always clarify whether case, spaces and punctuation should be ignored.',details:[{type:`paragraph`,text:`Before coding, ask the clarifying question interviewers expect: is "A man, a plan, a canal: Panama" a palindrome? Usually the answer is yes — so you normalise (lower-case, keep only letters and digits) before comparing.`},{type:`heading3`,text:`Approach 1 — reverse and compare (quick and readable)`},{type:`code`,lang:`typescript`,code:`function isPalindromeSimple(input: string): boolean {
  const clean = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}

isPalindromeSimple('racecar');                          // true
isPalindromeSimple('A man, a plan, a canal: Panama');   // true
isPalindromeSimple('hello');                            // false`},{type:`heading3`,text:`Approach 2 — two pointers (optimal, O(1) extra space)`},{type:`code`,lang:`typescript`,code:`function isAlphaNumeric(ch: string): boolean {
  return /[a-z0-9]/i.test(ch);
}

function isPalindrome(input: string): boolean {
  let left = 0;
  let right = input.length - 1;

  while (left < right) {
    // Skip characters we do not care about (spaces, punctuation)
    if (!isAlphaNumeric(input[left])) { left++; continue; }
    if (!isAlphaNumeric(input[right])) { right--; continue; }

    if (input[left].toLowerCase() !== input[right].toLowerCase()) {
      return false; // early exit on the first mismatch
    }
    left++;
    right--;
  }
  return true;
}

isPalindrome('No lemon, no melon'); // true
isPalindrome('ab');                 // false
isPalindrome('');                   // true  (empty string reads the same both ways)`},{type:`flow`,title:`Two-pointer walk on "racecar"`,code:`flowchart LR
  S["left=0, right=6<br/>r == r"]:::client --> A["left=1, right=5<br/>a == a"]:::server
  A --> B["left=2, right=4<br/>c == c"]:::server
  B --> C["left=3, right=3<br/>pointers meet"]:::highlight
  C --> R([return true]):::db`,text:`Each step compares one pair and moves both pointers inward, so only n/2 comparisons are needed.`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:["**Reverse and compare:** O(n) time, O(n) space — `split`, `reverse` and `join` each create a new array or string.",`**Two pointers:** O(n) time, O(1) extra space, and it exits early on the first mismatch.`]},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:["Empty string and single character → `true`.",`Mixed case ("Madam") and punctuation/spaces — confirm the rules with the interviewer.`,"Numbers: `isPalindrome(String(12321))`, or reverse the number mathematically if strings are not allowed.",'Unicode: `split("")` splits by UTF-16 code units, so emoji or surrogate pairs break. Use `[...str]` or `Array.from(str)` to iterate by code point.',"Null/undefined input — validate or type it as `string` in TypeScript."]},{type:`callout`,variant:`tip`,text:`Interview tip: write the one-liner first to show you know the built-ins, then say "this uses O(n) extra memory — here is the two-pointer version" and code it. Showing the trade-off is what earns the points.`}]},"first-non-repeating-character":{summary:"Do two passes: first count every character in a `Map`, then walk the string again in order and return the first character whose count is 1. That is O(n) time and O(k) space (k = distinct characters). The naive approach with `indexOf === lastIndexOf` is O(n²).",details:[{type:`paragraph`,text:'The key insight is that "first" depends on the order in the original string, so after counting you must iterate the **string** again (or rely on a `Map`, which keeps insertion order). Iterating a plain object is risky because integer-like keys are reordered.'},{type:`heading3`,text:`Optimal — frequency map, two passes`},{type:`code`,lang:`typescript`,code:`function firstNonRepeating(str: string): string | null {
  const counts = new Map<string, number>();

  // Pass 1: count occurrences
  for (const ch of str) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }

  // Pass 2: first character (in original order) with count 1
  for (const ch of str) {
    if (counts.get(ch) === 1) return ch;
  }
  return null; // every character repeats
}

firstNonRepeating('swiss');      // 'w'
firstNonRepeating('aabbcc');     // null
firstNonRepeating('leetcode');   // 'l'
firstNonRepeating('loveleetcode'); // 'v'`},{type:`heading3`,text:`Brute force — indexOf vs lastIndexOf`},{type:`code`,lang:`javascript`,code:`function firstNonRepeatingBrute(str) {
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    // If first and last positions are the same, it occurs once
    if (str.indexOf(ch) === str.lastIndexOf(ch)) return ch;
  }
  return null;
}
// Readable, but indexOf/lastIndexOf are O(n) each \u2192 O(n\xB2) overall`},{type:`heading3`,text:`Variant — return the index, case-insensitive`},{type:`code`,lang:`typescript`,code:`function firstUniqueIndex(str: string): number {
  const lower = str.toLowerCase();
  const counts = new Map<string, number>();
  for (const ch of lower) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  for (let i = 0; i < lower.length; i++) {
    if (counts.get(lower[i]) === 1) return i;
  }
  return -1;
}

firstUniqueIndex('sTreSS'); // 3  ('e' \u2014 's' and 'S' count as the same)`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Map approach:** O(n) time (two linear passes), O(k) space where k is the number of distinct characters — effectively O(1) for a fixed alphabet like lowercase English.`,`**Brute force:** O(n²) time, O(1) space.`]},{type:`heading3`,text:`Edge cases`},{type:`bullets`,items:["Empty string → `null` (or `-1` for the index version).","All characters repeat → `null`.",`Case sensitivity ("a" vs "A") and whether spaces count — ask.`,"Unicode/emoji: `for...of` iterates by code point, so it handles emoji correctly; indexing with `str[i]` does not."]},{type:`callout`,variant:`warning`,text:'Common pitfall: building counts in a plain object and then iterating `Object.keys(counts)` to find the first count of 1. For keys like "1" and "2" the object reorders them numerically, so you can return the wrong character. Iterate the original string instead.'}]},"remove-duplicates-from-an-array":{summary:"Built-in: `[...new Set(arr)]` (or `Array.from(new Set(arr))`) returns `[1, 2, 3, 4, 5]` in O(n), preserving first-occurrence order. With a for loop: iterate once, keep a lookup of values already added, and push only unseen values into a result array. Avoid the `includes`-inside-a-loop version for large arrays — it is O(n²).",details:[{type:`paragraph`,text:`The question explicitly asks for two versions: one that shows you know modern JavaScript, and one that shows you understand what the built-in is doing underneath.`},{type:`heading3`,text:`Built-in methods`},{type:`code`,lang:`javascript`,code:`const arr = [1, 2, 2, 3, 4, 4, 5];

// 1. Set \u2014 the idiomatic answer
const unique1 = [...new Set(arr)];
console.log(unique1); // [1, 2, 3, 4, 5]

// 2. Array.from \u2014 same thing, works where spread is awkward
const unique2 = Array.from(new Set(arr)); // [1, 2, 3, 4, 5]

// 3. filter + indexOf \u2014 keep an element only at its first position
const unique3 = arr.filter((value, index) => arr.indexOf(value) === index);
console.log(unique3); // [1, 2, 3, 4, 5]  (O(n\xB2))

// 4. reduce \u2014 build the result while checking includes
const unique4 = arr.reduce((acc, v) => (acc.includes(v) ? acc : [...acc, v]), []);
// works, but creates a new array on every push \u2192 slow; avoid in real code`},{type:`heading3`,text:`For loop — O(n) with a lookup object`},{type:`code`,lang:`javascript`,code:`function removeDuplicates(arr) {
  const result = [];
  const seen = {}; // or new Map() \u2014 see edge cases

  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    if (!seen[value]) {
      seen[value] = true;
      result.push(value);
    }
  }
  return result;
}

console.log(removeDuplicates([1, 2, 2, 3, 4, 4, 5])); // [1, 2, 3, 4, 5]`},{type:`heading3`,text:`For loop — no helpers at all (nested loop)`},{type:`code`,lang:`javascript`,code:`// Some interviewers say "no Set, no includes, no indexOf"
function removeDuplicatesNested(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    let exists = false;
    for (let j = 0; j < result.length; j++) {
      if (result[j] === arr[i]) { exists = true; break; }
    }
    if (!exists) result[result.length] = arr[i]; // even avoids push()
  }
  return result;
}
// O(n\xB2) time, but uses nothing except loops and comparisons`},{type:`heading3`,text:`Sorted input — in place, two pointers`},{type:`code`,lang:`typescript`,code:`// [1,2,2,3,4,4,5] is already sorted, so duplicates are adjacent
function dedupeSortedInPlace(nums: number[]): number {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write++] = nums[read];
    }
  }
  nums.length = write; // trim the tail
  return write;
}

const a = [1, 2, 2, 3, 4, 4, 5];
dedupeSortedInPlace(a); // 5, a is now [1, 2, 3, 4, 5]  \u2014 O(n) time, O(1) space`},{type:`heading3`,text:`Complexity summary`},{type:`bullets`,items:["`new Set` / loop with lookup object: O(n) time, O(n) space.","`filter + indexOf`, `reduce + includes`, nested loop: O(n²) time.",`Sorted two-pointer: O(n) time, O(1) extra space (mutates input).`]},{type:`heading3`,text:`Edge cases`},{type:`bullets`,items:['A plain object as lookup converts keys to strings, so `1` and `"1"` collide. Use `new Set()` or `new Map()` for mixed types.',"Objects are compared by reference — dedupe by a key (e.g. `id`) instead.","`NaN`: Set removes duplicate NaNs; `indexOf(NaN)` is always -1, so the filter version drops every NaN.",`All these keep the **first** occurrence and preserve order.`]},{type:`callout`,variant:`tip`,text:'Interview tip: say "Set uses SameValueZero equality and keeps insertion order" — that one sentence explains why `[...new Set(arr)]` is both correct and order-preserving.'},{type:`divider`},{type:`heading3`,text:`Follow-up: Find duplicate values in an array`},{type:`paragraph`,text:"Walk the array once with two `Set`s — `seen` for values already visited and `duplicates` for values seen more than once — giving O(n) time and O(n) space. Alternatives are a frequency `Map` (when you also need counts) or `filter` with `indexOf` (short but O(n²))."},{type:`paragraph`,text:"Clarify the expected output first: each duplicate value once (`[2, 4]`), every repeated occurrence, or a count per value? The Set approach returns each duplicate value once, which is what most interviewers mean."},{type:`heading3`,text:`Optimal — Set of seen values`},{type:`code`,lang:`typescript`,code:`function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item); // Set ensures each duplicate is reported once
    } else {
      seen.add(item);
    }
  }
  return [...duplicates];
}

findDuplicates([1, 2, 2, 3, 4, 4, 4, 5]); // [2, 4]
findDuplicates(['a', 'b', 'a']);          // ['a']
findDuplicates([1, 2, 3]);                // []`},{type:`heading3`,text:`With counts — frequency Map`},{type:`code`,lang:`typescript`,code:`function duplicateCounts<T>(arr: T[]): Map<T, number> {
  const freq = new Map<T, number>();
  for (const item of arr) freq.set(item, (freq.get(item) ?? 0) + 1);

  // Keep only entries that occur more than once
  return new Map([...freq].filter(([, count]) => count > 1));
}

duplicateCounts([1, 2, 2, 3, 4, 4, 4]); // Map { 2 => 2, 4 => 3 }`},{type:`heading3`,text:`One-liner — filter + indexOf (small arrays only)`},{type:`code`,lang:`javascript`,code:`const arr = [1, 2, 2, 3, 4, 4, 4, 5];

// Element is a duplicate if it is not at its first index;
// wrap in a Set so 4 is not reported twice
const dups = [...new Set(arr.filter((v, i) => arr.indexOf(v) !== i))];
console.log(dups); // [2, 4]
// indexOf inside filter \u2192 O(n\xB2)`},{type:`heading3`,text:`Duplicate objects by a key`},{type:`code`,lang:`typescript`,code:`interface User { id: number; email: string }

function duplicateEmails(users: User[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const u of users) {
    const key = u.email.toLowerCase(); // compare by a primitive key
    seen.has(key) ? dups.add(key) : seen.add(key);
  }
  return [...dups];
}`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:["**Set / Map:** O(n) time, O(n) space — `has`/`add` are O(1) on average.",`**filter + indexOf:** O(n²) time — fine for 20 items, slow for 100k.`,`**Sort then compare neighbours:** O(n log n) time, O(1) extra space if you may mutate the input (copy first otherwise).`]},{type:`heading3`,text:`Edge cases`},{type:`bullets`,items:["Empty array or no duplicates → `[]`.","Objects are compared by **reference** in a Set — two `{ id: 1 }` literals are different. Use a key (id, email, or `JSON.stringify` for simple shapes).","`NaN`: Set uses SameValueZero, so `NaN` duplicates are detected; `indexOf(NaN)` returns -1, so the filter version misses them.",'Mixed types: `1` and `"1"` are different values in a Set.']},{type:`callout`,variant:`tip`,text:`Interview tip: mention the space/time trade-off — Set is O(n) time and O(n) memory, sorting is O(n log n) with O(1) extra memory. Asking "can I mutate the input?" shows good instincts.`}]},"flatten-a-nested-array":{summary:"Use the built-in `arr.flat(Infinity)` to flatten any depth. To implement it yourself, recurse: for each element, if it is an array, flatten it and spread the result, otherwise push it. For very deep nesting, an iterative stack-based version avoids call-stack overflow.",details:[{type:`paragraph`,text:"Input like `[1, [2, [3, [4]], 5]]` should become `[1, 2, 3, 4, 5]`. Interviewers usually want the recursive version, sometimes with a `depth` parameter to mirror `Array.prototype.flat`."},{type:`heading3`,text:`Built-in`},{type:`code`,lang:`javascript`,code:`const nested = [1, [2, [3, [4]], 5]];

nested.flat();          // [1, 2, [3, [4]], 5]   (default depth = 1)
nested.flat(2);         // [1, 2, 3, [4], 5]
nested.flat(Infinity);  // [1, 2, 3, 4, 5]`},{type:`heading3`,text:`Recursive implementation (with optional depth)`},{type:`code`,lang:`typescript`,code:`type Nested<T> = (T | Nested<T>)[];

function flatten<T>(arr: Nested<T>, depth = Infinity): T[] {
  const result: T[] = [];

  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      // Recurse one level deeper and push the flattened children
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item as T);
    }
  }
  return result;
}

flatten([1, [2, [3, [4]], 5]]);    // [1, 2, 3, 4, 5]
flatten([1, [2, [3, [4]], 5]], 1); // [1, 2, [3, [4]], 5]`},{type:`heading3`,text:`Using reduce (common one-liner)`},{type:`code`,lang:`javascript`,code:`const flattenReduce = (arr) =>
  arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flattenReduce(item) : item),
    []
  );

flattenReduce([1, [2, [3, [4]], 5]]); // [1, 2, 3, 4, 5]
// Note: concat creates a new array each step \u2014 fine for interviews, slower for big data`},{type:`heading3`,text:`Iterative with a stack (no recursion limit)`},{type:`code`,lang:`javascript`,code:`function flattenIterative(arr) {
  const stack = [...arr];
  const result = [];

  while (stack.length) {
    const next = stack.pop();
    if (Array.isArray(next)) {
      stack.push(...next); // unpack and process later
    } else {
      result.push(next);
    }
  }
  return result.reverse(); // pop() reads from the end, so reverse to restore order
}

flattenIterative([1, [2, [3, [4]], 5]]); // [1, 2, 3, 4, 5]`},{type:`flow`,title:`Recursive flatten of [1, [2, [3]]]`,code:`flowchart TD
  A["flatten([1, [2, [3]]])"]:::client --> B["1 is a value \u2192 push 1"]:::server
  A --> C["[2, [3]] is an array \u2192 recurse"]:::highlight
  C --> D["2 \u2192 push 2"]:::server
  C --> E["[3] \u2192 recurse"]:::highlight
  E --> F["3 \u2192 push 3"]:::server
  F --> R(["result: [1, 2, 3]"]):::db`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`O(n) time where n is the total number of elements across all levels (each visited once).`,`O(n) space for the output, plus O(d) call stack for recursion depth d (the iterative version uses a heap-allocated stack instead).`,"Spreading huge arrays with `push(...items)` can hit the argument-count limit; loop and push individually for very large inputs."]},{type:`heading3`,text:`Edge cases`},{type:`bullets`,items:["Empty arrays inside: `[1, [], [2]]` → `[1, 2]`.","Sparse arrays: `flat()` removes holes (`[1, , 3].flat()` → `[1, 3]`).",'Strings are not arrays — `Array.isArray("abc")` is false, so they are kept as values.',`Very deep nesting (thousands of levels) can cause "Maximum call stack size exceeded" in the recursive version.`]},{type:`callout`,variant:`tip`,text:"Interview tip: mention `flat(Infinity)` first, then implement recursively, then offer the stack-based version and explain why (stack overflow on deep input). Supporting a `depth` parameter shows you know how the real API behaves."}]},"group-objects-by-property":{summary:"Loop once and push each item into a bucket keyed by the property: `(groups[key] ??= []).push(item)`. `reduce` is the classic one-liner, and modern runtimes (ES2024, Node 21+, current browsers) provide `Object.groupBy(arr, fn)` and `Map.groupBy(arr, fn)`. All are O(n).",details:[{type:`paragraph`,text:"Typical input: a list of employees, group them by `department`. Expected output: `{ Engineering: [...], Sales: [...] }`. Interviewers like to see a reusable, typed helper that accepts either a property name or a key function."},{type:`heading3`,text:`Classic reduce`},{type:`code`,lang:`javascript`,code:`const people = [
  { name: 'Asha',  dept: 'Engineering' },
  { name: 'Ravi',  dept: 'Sales' },
  { name: 'Meena', dept: 'Engineering' },
];

const byDept = people.reduce((acc, person) => {
  const key = person.dept;
  if (!acc[key]) acc[key] = [];
  acc[key].push(person);
  return acc;
}, {});

console.log(byDept);
// {
//   Engineering: [{ name: 'Asha', ... }, { name: 'Meena', ... }],
//   Sales:       [{ name: 'Ravi', ... }]
// }`},{type:`heading3`,text:`Reusable, typed helper`},{type:`code`,lang:`typescript`,code:`function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: keyof T | ((item: T) => K),
): Record<K, T[]> {
  const getKey =
    typeof keyOf === 'function' ? keyOf : (item: T) => item[keyOf] as unknown as K;

  const groups = {} as Record<K, T[]>;
  for (const item of items) {
    const key = getKey(item);
    (groups[key] ??= []).push(item); // create bucket on first use
  }
  return groups;
}

groupBy(people, 'dept');                                  // by property name
groupBy(people, (p) => p.name[0]);                        // by first letter
groupBy([1, 5, 12, 18], (n) => (n < 10 ? 'small' : 'big')); // { small: [1, 5], big: [12, 18] }`},{type:`heading3`,text:`Built-in: Object.groupBy and Map.groupBy`},{type:`code`,lang:`javascript`,code:`// ES2024 \u2014 available in Node 21+ and current browsers
const grouped = Object.groupBy(people, (p) => p.dept);
// { Engineering: [...], Sales: [...] }   (null-prototype object)

// Map.groupBy \u2014 when keys are not strings (objects, numbers, dates)
const byLength = Map.groupBy(people, (p) => p.name.length);
byLength.get(4); // [{ name: 'Asha', ... }, { name: 'Ravi', ... }]`},{type:`heading3`,text:`Variation: group and count / aggregate`},{type:`code`,lang:`typescript`,code:`const orders = [
  { customer: 'A', total: 100 },
  { customer: 'B', total: 50 },
  { customer: 'A', total: 25 },
];

const totals = orders.reduce<Record<string, number>>((acc, o) => {
  acc[o.customer] = (acc[o.customer] ?? 0) + o.total;
  return acc;
}, {});
// { A: 125, B: 50 }`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`O(n) time — one pass, O(1) average insert per item.`,`O(n) space — every item is referenced once in the output (items are not copied).`,"Avoid `{ ...acc, [key]: [...(acc[key] || []), item] }` inside reduce — copying on every step makes it O(n²)."]},{type:`heading3`,text:`Edge cases`},{type:`bullets`,items:[`Missing/undefined property → items land under the key "undefined"; decide whether to skip or use a fallback like "Unknown".`,'Object keys are strings — grouping by numbers or booleans converts them ("1", "true"). Use `Map` to keep the original key type or object keys.','Keys like "__proto__" or "constructor" can misbehave on a normal `{}`; `Object.groupBy` returns a null-prototype object, or use `Object.create(null)` / `Map`.',"Empty array → `{}`."]},{type:`callout`,variant:`tip`,text:"Interview tip: write the reduce/loop version (it is what they are testing), then mention `Object.groupBy` and `Map.groupBy` exist natively now. Knowing both the fundamentals and the modern API is the ideal answer."}]},"implement-debounce":{summary:"Debounce delays calling a function until it has not been called again for `wait` ms. Implementation: keep a timer in a closure; every call clears the previous timer and sets a new one; when the timer finally fires, call the original function with the latest arguments and the correct `this`. Typical use: search-as-you-type, resize and autosave handlers.",details:[{type:`paragraph`,text:`Picture a lift door: every time someone walks in, the close timer restarts. The door only closes once nobody has entered for a few seconds. Debounce does the same for events — 10 keystrokes in quick succession produce **one** API call, after the user stops typing.`},{type:`heading3`,text:`Core implementation`},{type:`code`,lang:`javascript`,code:`function debounce(fn, wait = 300) {
  let timerId; // lives in the closure, shared across calls

  return function (...args) {
    clearTimeout(timerId); // cancel the previous pending call
    timerId = setTimeout(() => {
      fn.apply(this, args); // arrow fn keeps 'this' of the wrapper call
    }, wait);
  };
}

// Usage
const search = debounce((q) => console.log('API call for', q), 300);
search('a');
search('an');
search('ang'); // only this one logs, 300ms after the last call: "API call for ang"`},{type:`heading3`,text:`Production version — typed, with cancel, flush and leading option`},{type:`code`,lang:`typescript`,code:`interface DebounceOptions { leading?: boolean }

function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
  { leading = false }: DebounceOptions = {},
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: A | undefined;

  const debounced = (...args: A) => {
    const callNow = leading && timer === undefined;
    lastArgs = args;
    clearTimeout(timer);

    timer = setTimeout(() => {
      timer = undefined;
      // trailing call (skip it if the leading call already ran with these args)
      if (!leading && lastArgs) fn(...lastArgs);
      lastArgs = undefined;
    }, wait);

    if (callNow) {
      fn(...args);        // fire immediately on the first call of a burst
      lastArgs = undefined;
    }
  };

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = lastArgs = undefined;
  };

  debounced.flush = () => {
    if (timer !== undefined && lastArgs) {
      clearTimeout(timer);
      timer = undefined;
      fn(...lastArgs);
      lastArgs = undefined;
    }
  };

  return debounced;
}

const save = debounce((text: string) => api.save(text), 1000);
input.addEventListener('input', (e) => save((e.target as HTMLInputElement).value));
window.addEventListener('beforeunload', () => save.flush()); // don't lose the last edit`},{type:`flow`,title:`Timer resets on every call`,code:`sequenceDiagram
  participant U as User typing
  participant D as debounce wrapper
  participant F as fn (API call)
  U->>D: "a" (t=0)
  Note over D: start 300ms timer
  U->>D: "an" (t=100)
  Note over D: clear + restart timer
  U->>D: "ang" (t=200)
  Note over D: clear + restart timer
  D->>F: fn("ang") at t=500
`,text:`Three calls within the window collapse into a single call with the latest arguments.`},{type:`heading3`,text:`In Angular you often use RxJS instead`},{type:`code`,lang:`typescript`,code:`// Reactive form control \u2192 debounced search
this.searchControl.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => this.api.search(q)), // cancels the stale request
    takeUntilDestroyed(this.destroyRef),
  )
  .subscribe((results) => this.results.set(results));`},{type:`heading3`,text:`Debounce vs throttle`},{type:`bullets`,items:[`**Debounce:** run once after activity stops — search input, form autosave, window resize end.`,`**Throttle:** run at most once every N ms during activity — scroll position, mousemove, infinite scroll checks.`]},{type:`heading3`,text:`Complexity & edge cases`},{type:`bullets`,items:[`O(1) time per call and O(1) space — just one timer id and the last arguments.`,"Preserve `this` and arguments — a common bug is calling `fn()` without them, breaking methods.",`Return values: a debounced function cannot return the result synchronously; return a Promise if the caller needs it.`,"Clean up: call `cancel()` when a component is destroyed, otherwise the timer may fire after teardown.",`Create the debounced function **once** (e.g. as a class field), not inside the event handler — otherwise every call gets a fresh timer and nothing is debounced.`]},{type:`callout`,variant:`warning`,text:"Common pitfall: using a regular `function` inside `setTimeout` loses `this`. Use an arrow function inside the returned wrapper (as above), or capture `const ctx = this` first."}]},"implement-deep-clone-with-cycles":{summary:"I recurse through the value and copy each container by its real type (Date, RegExp, Map, Set, array, plain object), returning primitives and functions as they are. A `WeakMap` from original to copy handles circular and shared references: I register each copy before recursing, so a cycle finds the copy instead of looping forever. In production I would first check whether `structuredClone` already does the job.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:["Which types must be supported? Plain data only, or also `Date`, `Map`, `Set`, class instances?",`Can the input contain cycles or the same object referenced twice, and should shared references stay shared in the copy?`,`What should happen to functions, DOM nodes and symbols: copy by reference, skip, or throw?`,`Should class instances keep their prototype (so methods still work)?`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  // Primitives and functions are returned as they are (functions are shared, not copied)
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T; // circular or shared reference

  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T;

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy); // register BEFORE recursing, so cycles find it
    value.forEach((v, k) => copy.set(deepClone(k, seen), deepClone(v, seen)));
    return copy as T;
  }

  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((v) => copy.add(deepClone(v, seen)));
    return copy as T;
  }

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    value.forEach((item, i) => (copy[i] = deepClone(item, seen)));
    return copy as T;
  }

  // Plain objects and class instances: keep the prototype, copy own enumerable keys
  const copy = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
  seen.set(value, copy);
  const source = value as Record<PropertyKey, unknown>;
  for (const key of [...Object.keys(source), ...Object.getOwnPropertySymbols(source)]) {
    copy[key] = deepClone(source[key], seen);
  }
  return copy as T;
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:[`Primitives (and functions) are immutable from our point of view, so they are returned directly.`,"The `seen` WeakMap maps each original object to its copy. If we meet an object again (a cycle or a shared child), we return the existing copy.","Each container type is rebuilt with its own constructor, and the copy is registered in `seen` **before** its children are cloned. That ordering is what makes cycles terminate.","Plain objects and class instances are created with `Object.create(prototype)` so methods keep working, then own enumerable string and symbol keys are copied recursively."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`Time O(n) and extra space O(n) for n reachable values; recursion depth equals nesting depth, so a very deep structure could hit the stack limit (an explicit stack fixes that).`,"**`structuredClone(value)`** is built into browsers and Node 17+ and handles Date, Map, Set, RegExp, typed arrays and cycles natively. It is the right answer for plain data. It throws on functions and DOM nodes and drops prototypes, so class instances come back as plain objects.","`JSON.parse(JSON.stringify(x))` is not a deep clone: it loses `Date` (becomes a string), `Map`/`Set` (become `{}`), `undefined`, and throws on cycles.",`Getters/setters are evaluated and copied as values, non-enumerable properties are skipped, and functions are shared, not copied. Say so rather than pretend they are handled.`]},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

const original: Record<string, any> = {
  n: 1,
  when: new Date('2024-01-01'),
  list: [1, { x: 2 }],
  byId: new Map([['a', { y: 3 }]]),
  tags: new Set(['x', 'y']),
};
original.self = original; // circular reference

const copy = deepClone(original);
assert.notEqual(copy, original);
assert.equal(copy.self, copy); // the cycle points at the copy, not the original
assert.notEqual(copy.list[1], original.list[1]); // nested objects are new
assert.deepEqual(copy.list, original.list);
assert.ok(copy.when instanceof Date && copy.when.getTime() === original.when.getTime());
assert.notEqual(copy.byId.get('a'), original.byId.get('a'));
assert.deepEqual([...copy.tags], ['x', 'y']);
assert.equal(deepClone(42), 42);
console.log('deepClone: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["When is `structuredClone` not enough? (Class instances lose their prototype; functions and DOM nodes throw.)",`How would you avoid a stack overflow on deeply nested input? (Iterate with an explicit stack of [source, target] pairs.)`,"Why a `WeakMap` and not a `Map` for `seen`? (Keys are objects and the map is short-lived; WeakMap also cannot leak if the function is reused.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Registering the copy in `seen` after recursing, so cycles still recurse forever.",'Using `typeof value === "object"` and forgetting that `null` is also `"object"`.',"Copying a `Date` or `Map` as a plain object, which silently produces `{}`.","Reaching for `JSON.parse(JSON.stringify())` without stating what it loses."]},{type:`callout`,variant:`important`,text:'Senior signal: you start with "can we use `structuredClone`?", then show you know exactly where it falls short, handle cycles with a WeakMap registered before recursion, and name the remaining trade-offs (prototypes, functions, getters, stack depth) instead of claiming a perfect clone.'}]},"implement-deep-equality":{summary:"I compare with `Object.is` first, then require both sides to be objects with the same prototype, and recurse by type: arrays by length and index, Maps and Sets by size and membership, plain objects by the same set of own keys. A `WeakMap` of pairs already being compared lets it terminate on circular structures.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:["Should `NaN` equal `NaN`, and should `0` equal `-0`? (`Object.is` says yes and no.)","Is `{ a: undefined }` equal to `{}`? Most test libraries say no; some loose comparisons say yes.",`Does key order matter? (Usually not for objects; it does for arrays.)`,`Which types are in scope: plain data only, or also Date, Map, Set and class instances?`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`function deepEqual(a: unknown, b: unknown, seen = new WeakMap<object, object>()): boolean {
  if (Object.is(a, b)) return true; // same reference, equal primitives, NaN === NaN
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false; // [] vs {}, Date vs {}

  // Cycles: if this pair is already being compared higher up, don't recurse forever
  if (seen.get(a) === b) return true;
  seen.set(a, b);

  if (a instanceof Date) return a.getTime() === (b as Date).getTime();
  if (a instanceof RegExp) return String(a) === String(b);

  if (Array.isArray(a)) {
    const other = b as unknown[];
    return a.length === other.length && a.every((item, i) => deepEqual(item, other[i], seen));
  }

  if (a instanceof Map) {
    const other = b as Map<unknown, unknown>;
    if (a.size !== other.size) return false;
    for (const [key, value] of a) {
      if (!other.has(key) || !deepEqual(value, other.get(key), seen)) return false;
    }
    return true;
  }

  if (a instanceof Set) {
    const other = b as Set<unknown>;
    return a.size === other.size && [...a].every((value) => other.has(value));
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) return false;
  return keysA.every(
    (key) => Object.prototype.hasOwnProperty.call(objB, key) && deepEqual(objA[key], objB[key], seen),
  );
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:["`Object.is(a, b)` covers identical references and equal primitives, including `NaN`.",`If either side is not an object, or the prototypes differ (an array vs an object, a Date vs a plain object), they are not equal.`,'The `seen` map records "a is being compared with b". If the same pair comes back through a cycle, we treat that branch as equal instead of recursing forever.',`Each type is compared on its meaningful content: time for Dates, source and flags for RegExps, index by index for arrays, key by key for Maps and objects.`]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:["O(n) time over all nested values, O(d) stack for depth d plus the `seen` map.","Set comparison uses `has`, which is reference equality for objects inside Sets; deep-comparing Set members needs an O(n²) search. Mention it rather than hide it.","Only own enumerable string keys are compared; symbols and non-enumerable properties are ignored. Node's `assert.deepStrictEqual` and Vitest's `toEqual` make slightly different choices, which is worth knowing.",`Comparing prototypes means two different classes with the same fields are not equal, which is usually what you want.`]},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

assert.ok(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }));
assert.ok(deepEqual({ x: 1, y: 2 }, { y: 2, x: 1 })); // key order does not matter
assert.ok(!deepEqual([1, 2], { 0: 1, 1: 2 })); // array vs object
assert.ok(!deepEqual({ a: undefined }, {})); // missing key is not the same as undefined
assert.ok(deepEqual(NaN, NaN));
assert.ok(deepEqual(new Date(0), new Date(0)));
assert.ok(deepEqual(new Map([['k', [1]]]), new Map([['k', [1]]])));
assert.ok(!deepEqual(new Set([1, 2]), new Set([1, 3])));

const left: Record<string, unknown> = { name: 'a' };
left.self = left;
const right: Record<string, unknown> = { name: 'a' };
right.self = right;
assert.ok(deepEqual(left, right)); // terminates on cycles
console.log('deepEqual: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How does this differ from React's shallow equality? (One level only, by reference; much cheaper, used for memoization.)`,`How would you make it report *where* the values differ? (Track the path and return it on the first mismatch.)`,"Why can't you just compare `JSON.stringify` output? (Key order, `undefined`, Dates and cycles break it.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Comparing only `Object.keys(a)` against `b`, so extra keys in `b` are missed.","Treating `[1, 2]` and `{ 0: 1, 1: 2 }` as equal because their keys match.","Using `===` first, which makes `NaN` unequal to itself.",`No cycle handling, so self-referencing objects crash with a stack overflow.`]},{type:`callout`,variant:`important`,text:"Senior signal: you ask about the semantic choices (NaN, -0, undefined keys, prototypes) before coding, make them explicit in the implementation, and can compare your choices with what `assert.deepStrictEqual` or a test framework does."}]},"implement-memoize-with-an-lru-limit":{summary:"I wrap the function with a `Map` keyed by a string built from the arguments, using `JSON.stringify(args)` by default and a caller-supplied `key` function when that is wrong or slow. A `maxSize` option turns the Map into a small LRU: a hit is moved to the end, and when the cache is too big the oldest entry (the first key) is evicted.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:[`Is the function pure? Memoizing something that reads time, randomness or external state gives stale answers.`,`What do the arguments look like? Primitives, objects, functions? That decides the key strategy.`,`Is memory bounded? An unbounded cache on user input is a memory leak.`,`Does it return promises? Then I need to decide what happens to rejected results.`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`interface MemoizeOptions<A extends unknown[]> {
  /** Builds the cache key from the arguments. Default: JSON of the arguments. */
  key?: (...args: A) => string;
  /** Keep at most this many results; the least recently used is evicted first. */
  maxSize?: number;
}

function memoize<A extends unknown[], R>(
  fn: (...args: A) => R,
  { key = (...args: A) => JSON.stringify(args), maxSize = Infinity }: MemoizeOptions<A> = {},
) {
  const cache = new Map<string, R>(); // Map keeps insertion order, which gives us LRU cheaply

  function memoized(this: unknown, ...args: A): R {
    const k = key(...args);
    if (cache.has(k)) {
      const hit = cache.get(k) as R;
      cache.delete(k); // move to the "most recently used" end
      cache.set(k, hit);
      return hit;
    }
    const result = fn.apply(this, args);
    cache.set(k, result);
    if (cache.size > maxSize) {
      cache.delete(cache.keys().next().value as string); // oldest entry
    }
    return result;
  }

  memoized.clear = () => cache.clear();
  memoized.size = () => cache.size;
  return memoized;
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:[`Build a key from the arguments. JSON works for plain data; objects with identity (DOM nodes, class instances) need a custom key such as an id.`,`On a hit, delete and re-insert the entry so the Map's insertion order becomes "least recently used first".`,"On a miss, call the original with the same `this` and arguments, store the result, and evict the first key if the cache is over `maxSize`.","Expose `clear()` so callers can invalidate after the underlying data changes."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:["O(1) average per lookup and eviction (Map operations), plus the cost of building the key. `JSON.stringify` on large arguments can cost more than the function you are caching.","JSON keys treat `{a:1,b:2}` and `{b:2,a:1}` as different, and turn `undefined`, functions and Dates into lossy strings.","**Promises:** the cache stores the promise, which nicely dedupes concurrent calls, but a rejected promise stays cached. Delete the key in a `.catch` so failures can be retried.","For a single object argument, a `WeakMap` keyed by the object avoids both key building and leaks."]},{type:`code`,lang:`typescript`,code:`// Don't cache failures: remove the entry when the promise rejects
const getUser = memoize(async (id: string) => {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
});
// inside memoized(): if (result instanceof Promise) result.catch(() => cache.delete(k));`},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

let calls = 0;
const slowSquare = (n: number) => {
  calls++;
  return n * n;
};
const square = memoize(slowSquare, { maxSize: 2 });

assert.equal(square(3), 9);
assert.equal(square(3), 9);
assert.equal(calls, 1); // second call came from the cache

square(4);
square(5); // cache holds at most 2: 3 is evicted (least recently used)
assert.equal(square.size(), 2);
square(3);
assert.equal(calls, 4); // 3 had to be computed again

// Custom key: only the id matters, not the whole object
let fetches = 0;
const loadUser = memoize((user: { id: number; name: string }) => ++fetches, {
  key: (user) => String(user.id),
});
loadUser({ id: 1, name: 'a' });
loadUser({ id: 1, name: 'renamed' });
assert.equal(fetches, 1);
console.log('memoize: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How would you add a TTL? (Store `{ value, expiresAt }` and treat expired entries as misses.)","How is this different from `computed()` or a pure pipe in Angular? (Those cache only the last input; this caches many.)",`How would you share the cache across server instances? (Move it to Redis; then you need invalidation and serialization.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Using only the first argument as the key, so `f(1, 2)` and `f(1, 3)` collide.",`An unbounded Map on user-controlled input: a slow memory leak.`,`Caching rejected promises forever.`,`Memoizing impure functions and getting stale results.`]},{type:`callout`,variant:`important`,text:`Senior signal: you treat the key strategy and memory bound as the real design decisions, handle promise rejection, and say when memoization is not worth it (cheap functions, rarely repeated inputs, impure functions).`}]},"implement-throttle-leading-and-trailing":{summary:"I model it as a time window: the first call opens a window and runs immediately if `leading` is on; calls inside the window only remember the latest arguments; when the window ends I run once more with those arguments if `trailing` is on, and that trailing call opens a new window. A `cancel()` clears the timer and any pending call.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:[`Default behaviour: lodash runs on both the leading and trailing edge. Is that what we want?`,`Should the trailing call use the latest arguments or the first ones? (Usually the latest.)`,"Do we need `cancel()` (component destroyed) or `flush()` (run the pending call now)?","Throttle or debounce? Throttle guarantees a call at most every `wait` ms during continuous activity; debounce waits for a pause."]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`interface ThrottleOptions {
  /** Call on the first invocation of a window. Default true. */
  leading?: boolean;
  /** Call once more at the end of the window with the latest arguments. Default true. */
  trailing?: boolean;
}

function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
  { leading = true, trailing = true }: ThrottleOptions = {},
) {
  let timer: ReturnType<typeof setTimeout> | null = null; // non-null = inside a window
  let pending: { self: unknown; args: A } | null = null; // latest call made during the window

  const startWindow = () => {
    timer = setTimeout(endWindow, wait);
  };

  const endWindow = () => {
    timer = null;
    if (trailing && pending) {
      const { self, args } = pending;
      pending = null;
      fn.apply(self, args);
      startWindow(); // a trailing call opens a new window, so calls stay spaced out
    } else {
      pending = null;
    }
  };

  function throttled(this: unknown, ...args: A) {
    if (timer === null) {
      if (leading) fn.apply(this, args);
      else pending = { self: this, args };
      startWindow();
    } else {
      pending = { self: this, args }; // remember only the latest
    }
  }

  throttled.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending = null;
  };

  return throttled;
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:['`timer === null` means "not in a window". The first call either runs (`leading`) or is stored as pending, and starts a `wait` timer.',"Calls during the window overwrite `pending`, so only the newest arguments and `this` are kept.","When the timer fires, a pending call runs if `trailing` is on, and a new window starts so the next burst is still spaced out.",`If nothing is pending, the window simply closes, and the next call is a leading call again.`]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`O(1) per call, one timer at a time.`,"`{ leading: false, trailing: false }` never calls the function, same as lodash. Validate or document it.",'Uses `setTimeout`, so the gap is "at least `wait`", never exact; under heavy load it drifts.',"For scroll or resize visual updates, `requestAnimationFrame` throttling is usually better than a time-based throttle."]},{type:`callout`,variant:`tip`,text:"Tests use `node:test` mock timers (`mock.timers.tick`) so they are instant and deterministic. In Vitest the equivalent is `vi.useFakeTimers()` and `vi.advanceTimersByTime(100)`."},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';
import { mock } from 'node:test';

mock.timers.enable({ apis: ['setTimeout'] });

const seen: number[] = [];
const log = throttle((n: number) => seen.push(n), 100);
log(1); // leading: runs now
log(2);
log(3); // replaces 2 as the pending call
assert.deepEqual(seen, [1]);
mock.timers.tick(100); // window ends: trailing call with the latest args
assert.deepEqual(seen, [1, 3]);
mock.timers.tick(100); // nothing pending, window closes quietly
log(4); // new window, leading again
assert.deepEqual(seen, [1, 3, 4]);

const trailingOnly: number[] = [];
const t = throttle((n: number) => trailingOnly.push(n), 100, { leading: false });
t(1);
t(2);
assert.deepEqual(trailingOnly, []);
mock.timers.tick(100);
assert.deepEqual(trailingOnly, [2]);

const leadingOnly: number[] = [];
const l = throttle((n: number) => leadingOnly.push(n), 100, { trailing: false });
l(1);
l(2);
mock.timers.tick(100);
assert.deepEqual(leadingOnly, [1]);

mock.timers.reset();
console.log('throttle: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`When do you pick throttle over debounce? (Scroll position, drag, rate-limiting a stream of events: throttle. Search box: debounce.)`,"How would you implement this with RxJS? (`throttleTime(100, undefined, { leading: true, trailing: true })`.)","How do you test timer code without real waiting? (Fake timers; never `await sleep` in unit tests.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Dropping the trailing call, so the final value (the last scroll position) is never handled.`,`Running the trailing call with the first arguments instead of the latest.`,"Losing `this` by calling `fn(...args)` instead of `fn.apply(this, args)`.","No `cancel()`, so a destroyed component still receives a delayed call."]},{type:`callout`,variant:`important`,text:"Senior signal: you define the edge semantics precisely before coding, keep the state machine small (window open or closed, latest pending call), test it with fake timers, and know when `requestAnimationFrame` or RxJS is the better tool."}]},"implement-curry":{summary:"For fixed-arity functions I collect arguments across calls until I have `fn.length` of them (or an explicit `arity`), then call the original. For truly variadic functions there is no length to wait for, so I use a terminating call instead: keep collecting until the function is called with no arguments.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:["Fixed arity or variadic? `fn.length` is 0 for rest parameters and stops counting at the first default parameter.","Should one call accept several arguments at once (`f(1, 2)(3)`) or exactly one per call?","Do we need placeholders (`f(_, 2)(1)`) like lodash? That is a bigger feature; ask before building it.","Does `this` matter? (Usually not for curried utilities, but preserving it is cheap.)"]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`/** Curry a fixed-arity function. Pass \`arity\` when fn.length is wrong (defaults, rest params). */
function curry(fn: (...args: any[]) => unknown, arity = fn.length) {
  return function curried(this: unknown, ...args: unknown[]): unknown {
    if (args.length >= arity) return fn.apply(this, args);
    return (...more: unknown[]) => curried.apply(this, [...args, ...more]);
  };
}

/** Curry a variadic function: keep collecting arguments until it is called with none. */
function curryVariadic<T, R>(fn: (...args: T[]) => R) {
  const collect =
    (collected: T[]) =>
    (...more: T[]): any =>
      more.length === 0 ? fn(...collected) : collect([...collected, ...more]);
  return collect([]);
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:["`curried` checks whether enough arguments have arrived. If yes, it calls `fn` with all of them.","If not, it returns a new function that appends the next arguments and calls `curried` again, so partial applications can be reused independently.","An explicit `arity` parameter fixes the `fn.length` cases (default parameters, rest parameters).","The variadic version accumulates arguments in a closure and finishes on an empty call `()`."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`Each step copies the collected arguments: O(k) per call, O(k²) for k one-at-a-time calls, which is irrelevant for normal arities.`,`Extra arguments beyond the arity are passed through on the final call.`,"Typing a fully generic `curry` in TypeScript needs recursive conditional types; most codebases type a few overloads or avoid curry entirely."]},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

const add3 = (a: number, b: number, c: number) => a + b + c;
const curriedAdd: any = curry(add3);
assert.equal(curriedAdd(1)(2)(3), 6);
assert.equal(curriedAdd(1, 2)(3), 6);
assert.equal(curriedAdd(1)(2, 3), 6);
assert.equal(curriedAdd(1, 2, 3), 6);

// fn.length stops at the first default parameter, so pass the arity explicitly
const greet = (greeting: string, name = 'there') => \`\${greeting}, \${name}\`;
assert.equal(greet.length, 1);
const curriedGreet: any = curry(greet, 2);
assert.equal(curriedGreet('Hi')('Asha'), 'Hi, Asha');

const sum = curryVariadic((...nums: number[]) => nums.reduce((a, b) => a + b, 0));
assert.equal(sum(1)(2, 3)(4)(), 10);
console.log('curry: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Currying vs partial application? (Curry transforms an n-ary function into a chain; `fn.bind(null, a)` is partial application.)","Where is currying actually useful? (Config-first helpers like `formatCurrency(locale)(amount)`, point-free pipelines.)",`How would you support placeholders? (A sentinel value and filling holes from later calls.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Relying on `fn.length` without handling default and rest parameters.","Mutating one shared `args` array, so two partial applications interfere with each other.","Building an infinite curry with no way to finish, or relying on `valueOf` tricks that confuse readers."]},{type:`callout`,variant:`important`,text:"Senior signal: you know exactly when `fn.length` lies, keep partial applications independent (no shared mutable arguments), and can say honestly that in application code a small named helper is often clearer than a curried chain."}]},"implement-promise-allsettled-and-race":{summary:'`allSettled` waits for every input, records `{ status: "fulfilled", value }` or `{ status: "rejected", reason }` at the input\'s index, and resolves once a counter reaches zero; it never rejects. `race` subscribes to every input and settles with whichever settles first, using the fact that a promise ignores later `resolve`/`reject` calls.',details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:[`Should inputs be any iterable (as in the spec) or only arrays?`,"Plain values in the input: wrap them with `Promise.resolve`, which also adopts thenables.","Empty input: `allSettled([])` resolves to `[]` immediately; `race([])` stays pending forever, as the built-in does.",`Is ordering by input position required? (Yes for allSettled.)`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`function allSettled<T>(
  values: Iterable<T | PromiseLike<T>>,
): Promise<PromiseSettledResult<Awaited<T>>[]> {
  const items = Array.from(values);
  return new Promise((resolve) => {
    const results: PromiseSettledResult<Awaited<T>>[] = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) {
      resolve(results); // empty input settles immediately
      return;
    }
    items.forEach((item, i) => {
      // Promise.resolve wraps plain values and adopts thenables
      Promise.resolve(item)
        .then(
          (value) => {
            results[i] = { status: 'fulfilled', value }; // keep input order, not finish order
          },
          (reason: unknown) => {
            results[i] = { status: 'rejected', reason };
          },
        )
        .then(() => {
          if (--remaining === 0) resolve(results);
        });
    });
  });
}

function race<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>> {
  return new Promise((resolve, reject) => {
    // The first one to settle wins; later resolve/reject calls are ignored by the promise
    for (const item of values) {
      Promise.resolve(item).then(resolve, reject);
    }
    // An empty iterable never settles, exactly like the built-in Promise.race
  });
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:[`Convert the iterable to an array once so it can be counted and indexed.`,"For each item, `Promise.resolve(item)` normalizes values, promises and thenables.","allSettled writes each outcome into `results[i]` (input order, not completion order), and decrements `remaining`; at zero it resolves the whole array.","race passes the outer `resolve` and `reject` straight to every input. The first call wins and later ones are no-ops."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`O(n) time and space; all inputs run concurrently because the promises already exist when passed in.`,"`race` does not cancel the losers: their work continues. Real cancellation needs `AbortController`.","A plain value in `race` wins against any pending promise because it resolves in the next microtask.","See the existing `Promise.all` answer in the Node.js coding round for the fail-fast variant; `Promise.any` is the mirror image of `all` (first fulfilment wins, `AggregateError` if all reject)."]},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

const delay = <T>(ms: number, value: T, fail = false) =>
  new Promise<T>((resolve, reject) => setTimeout(() => (fail ? reject(value) : resolve(value)), ms));

const settled = await allSettled<string | number>([delay(20, 'a'), delay(5, 'boom', true), 42]);
assert.deepEqual(settled, [
  { status: 'fulfilled', value: 'a' },
  { status: 'rejected', reason: 'boom' },
  { status: 'fulfilled', value: 42 },
]);
assert.deepEqual(await allSettled([]), []);

assert.equal(await race([delay(30, 'slow'), delay(5, 'fast')]), 'fast');
await assert.rejects(race([delay(30, 'slow'), delay(5, 'nope', true)]));
assert.equal(await race([delay(10, 'later'), 'now']), 'now'); // a plain value wins next tick
console.log('allSettled / race: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How would you implement a timeout with `race`? (Race the work against a promise that rejects after N ms, then abort the work.)","Why does `allSettled` never reject? (It reports outcomes; the caller decides what a failure means.)","What does `Promise.any` do on empty input? (Rejects immediately with an `AggregateError`.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Pushing results in completion order instead of writing by index.`,"Resolving when `results.length === items.length` (sparse arrays make `length` wrong early).","Forgetting the empty-input case, so `allSettled([])` never resolves.","Assuming `race` stops the slower promises."]},{type:`callout`,variant:`important`,text:"Senior signal: you handle iterables, plain values, thenables and empty input like the spec does, and you point out that racing does not cancel work, then show how `AbortController` fixes that in real code."}]},"implement-flatten-and-unflatten-dot-keys":{summary:"Flatten walks plain objects and arrays recursively, joining keys with dots, and stores everything else (including empty objects and arrays, Dates and class instances) as a leaf so the round trip is lossless. Unflatten splits each path and creates objects or arrays on the way, choosing an array when the next segment is numeric, and refuses `__proto__`-style keys to prevent prototype pollution.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:["How should arrays be represented: `tags.0` or `tags[0]`?",`What about empty objects and arrays: keep them as leaves (lossless) or drop them?`,`Can keys contain dots? Then the format is ambiguous and we need escaping or a different separator.`,`Is the input trusted? Unflatten on user input (query strings, form data) must guard against prototype pollution.`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainContainer(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype)
  );
}

function flatten(
  obj: Record<string, unknown>,
  prefix = '',
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? \`\${prefix}.\${key}\` : key;
    // Recurse into non-empty plain objects and arrays; everything else is a leaf
    if (isPlainContainer(value) && Object.keys(value).length > 0) {
      flatten(value, path, out);
    } else {
      out[path] = value; // includes {}, [], Dates and class instances as-is
    }
  }
  return out;
}

function unflatten(flat: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split('.');
    if (keys.some((k) => UNSAFE_KEYS.has(k))) {
      throw new Error(\`Refusing unsafe key in "\${path}"\`); // prototype pollution guard
    }
    let node: Record<string, unknown> = result;
    keys.forEach((key, i) => {
      if (i === keys.length - 1) {
        node[key] = value;
        return;
      }
      if (!isPlainContainer(node[key])) {
        // Numeric next segment means this level was an array
        node[key] = /^\\d+$/.test(keys[i + 1]) ? [] : {};
      }
      node = node[key] as Record<string, unknown>;
    });
  }
  return result;
}`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:["Flatten builds the path as it recurses (`user` → `user.address` → `user.address.city`) and writes leaves into one output object.","Only non-empty plain objects and arrays are walked; anything else is copied as a value, so Dates and `{}` survive.",`Unflatten creates each missing intermediate container. A numeric next segment means the container is an array.`,"Any path containing `__proto__`, `constructor` or `prototype` is rejected before touching the object."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`O(total number of keys × path length) for both directions.`,'**Prototype pollution:** without the guard, `unflatten({ "__proto__.isAdmin": true })` would set `isAdmin` on every object in the process. This is a real class of CVEs in query-string and merge libraries.',`Keys containing dots are ambiguous; escape them or use a separator that cannot appear in keys.`,`Deep recursion is bounded by nesting depth; for untrusted input also cap depth and total keys.`]},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

const nested = {
  user: { name: 'Asha', address: { city: 'Pune' } },
  tags: ['a', 'b'],
  empty: {},
  active: true,
};
const flat = flatten(nested);
assert.deepEqual(flat, {
  'user.name': 'Asha',
  'user.address.city': 'Pune',
  'tags.0': 'a',
  'tags.1': 'b',
  empty: {},
  active: true,
});
assert.deepEqual(unflatten(flat), nested); // round trip
assert.throws(() => unflatten({ '__proto__.polluted': true }));
assert.equal(({} as Record<string, unknown>).polluted, undefined);
console.log('flatten / unflatten: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Where is this used in practice? (Form libraries, translation files, MongoDB `$set` with dotted paths, env-var config.)",`How would you diff two objects with this? (Flatten both and compare key sets and values.)`,"How would you type `flatten` in TypeScript? (Template literal types can produce the key union for known shapes.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Dropping empty objects and arrays, so the round trip is lossy.`,'Always creating objects in unflatten, turning arrays into `{ "0": ..., "1": ... }`.',`Recursing into Dates or class instances and producing nonsense keys.`,`No prototype-pollution guard on input that may come from users.`]},{type:`callout`,variant:`important`,text:`Senior signal: you make the round trip lossless on purpose, spot the prototype-pollution risk in unflatten without being prompted, and mention the ambiguity of dotted keys.`}]},"implement-sync-and-async-pipe-compose":{summary:"`pipe` runs functions left to right and `compose` right to left; both are a single `reduce` (or `reduceRight`) that feeds each result into the next function. The async versions start from `Promise.resolve(input)` and chain with `.then`, so each step may return a value or a promise and a rejection skips the remaining steps.",details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:["Left-to-right (`pipe`) or right-to-left (`compose`)? Teams usually prefer `pipe` because it reads in execution order.",`Can steps be async? Then the result is always a promise.`,`Single argument per step, or should the first step accept several?`,`How strict should the TypeScript types be?`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`type Fn = (arg: any) => any;

/** Left to right: pipe(f, g)(x) === g(f(x)) */
const pipe =
  (...fns: Fn[]) =>
  (input: unknown) =>
    fns.reduce((acc, fn) => fn(acc), input);

/** Right to left: compose(f, g)(x) === f(g(x)) */
const compose =
  (...fns: Fn[]) =>
  (input: unknown) =>
    fns.reduceRight((acc, fn) => fn(acc), input);

/** Async-aware: each step may return a value or a promise; the result is always a promise. */
const pipeAsync =
  (...fns: Fn[]) =>
  (input: unknown): Promise<unknown> =>
    fns.reduce<Promise<unknown>>((acc, fn) => acc.then(fn), Promise.resolve(input));

const composeAsync =
  (...fns: Fn[]) =>
  (input: unknown): Promise<unknown> =>
    fns.reduceRight<Promise<unknown>>((acc, fn) => acc.then(fn), Promise.resolve(input));`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:["`pipe(f, g, h)(x)` is `h(g(f(x)))`: `reduce` starts with `x` and applies each function in turn.","`compose` is the same with `reduceRight`, matching mathematical composition.","The async versions start from a resolved promise and use `.then(fn)`, which accepts both plain values and promises from each step.","A thrown error or rejected promise short-circuits: later `.then` callbacks are skipped and the returned promise rejects."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`O(n) for n functions; no extra allocation beyond the promise chain in the async case.`,`With no functions, both return the input (identity), which keeps composition safe for empty lists.`,"Typing: a variadic `pipe` cannot infer a chain of different types without overloads. Libraries like fp-ts and RxJS declare overloads for up to about nine steps."]},{type:`code`,lang:`typescript`,code:`// Typed overloads for the common lengths
function pipeTyped<A, B>(ab: (a: A) => B): (a: A) => B;
function pipeTyped<A, B, C>(ab: (a: A) => B, bc: (b: B) => C): (a: A) => C;
function pipeTyped<A, B, C, D>(ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): (a: A) => D;
function pipeTyped(...fns: Fn[]) {
  return (input: unknown) => fns.reduce((acc, fn) => fn(acc), input);
}`},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

const add1 = (n: number) => n + 1;
const double = (n: number) => n * 2;

assert.equal(pipe(add1, double)(3), 8); // (3 + 1) * 2
assert.equal(compose(add1, double)(3), 7); // (3 * 2) + 1
assert.equal(pipe()(5), 5); // no functions: identity

const fetchUser = async (id: number) => ({ id, name: 'Asha' });
const toName = (user: { name: string }) => user.name;
const shout = async (s: string) => s.toUpperCase();

assert.equal(await pipeAsync(fetchUser, toName, shout)(1), 'ASHA');
assert.equal(await composeAsync(shout, toName, fetchUser)(1), 'ASHA');

const fail = async () => {
  throw new Error('step failed');
};
await assert.rejects(pipeAsync(add1, fail, double)(1), /step failed/); // later steps are skipped
console.log('pipe / compose: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Where have you seen `pipe` in Angular? (RxJS `observable.pipe(map(...), filter(...))`, same idea over streams.)","How would you add logging between steps? (Wrap each function in a `tap`-style decorator.)","How do you run independent async steps in parallel instead? (`Promise.all`, not a pipe.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Mixing up the order: `compose` applies the last function first.","Using `async` inside a sync `reduce` and accidentally passing a promise into the next sync step.","Catching errors inside the pipe and continuing with `undefined`.","Typing everything as `any` without saying why typed overloads are needed."]},{type:`callout`,variant:`important`,text:`Senior signal: you keep the implementation to one reduce, explain error propagation in the async chain, and are honest about the TypeScript limits (overloads) and readability (a pipe of anonymous lambdas is worse than named steps).`}]},"implement-a-type-safe-event-bus":{summary:'I make the bus generic over an event map type (`{ "user:login": { userId: string } }`) and use `K extends keyof Events` on every method, so the event name picks the payload type and a wrong name or payload is a compile error. Handlers are stored in a `Set` per event, `on` returns an unsubscribe function, and `emit` iterates over a copy so handlers can unsubscribe safely.',details:[{type:`heading3`,text:`Clarify first`},{type:`bullets`,items:[`Is it in-process only (one app or one Node process), or must it cross tabs or services?`,`Synchronous or asynchronous delivery? (Sync is simpler and keeps ordering obvious.)`,`What happens when a handler throws: stop, or keep notifying the others?`,`Do some events have no payload?`]},{type:`heading3`,text:`Solution`},{type:`code`,lang:`typescript`,code:`type Handler<P> = (payload: P) => void;

/** Events with an \`undefined\` payload are emitted without one. */
type EmitArgs<P> = [P] extends [undefined] ? [] : [payload: P];

class EventBus<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {};

  /** Subscribe; returns an unsubscribe function so callers can't forget to clean up. */
  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const set = this.handlers[event] ?? new Set<Handler<Events[K]>>();
    set.add(handler);
    this.handlers[event] = set;
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers[event]?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, ...args: EmitArgs<Events[K]>): void {
    const payload = args[0] as Events[K];
    // Copy first: a handler may unsubscribe itself while we are iterating
    for (const handler of [...(this.handlers[event] ?? [])]) {
      handler(payload);
    }
  }
}

// A \`type\`, not an \`interface\`: interfaces don't satisfy the Record index signature
type AppEvents = {
  'user:login': { userId: string };
  'cart:updated': { items: number };
  'app:ready': undefined;
};`},{type:`heading3`,text:`How it works`},{type:`numbered`,items:["The `Events` type parameter maps each event name to its payload type. `on`, `off` and `emit` are generic in `K extends keyof Events`, so the payload type is looked up per call.","`EmitArgs` uses a conditional tuple type so events whose payload is `undefined` are emitted with no argument.","Handlers live in a `Set` per event: no duplicates, O(1) removal.","`on` returns an unsubscribe function, which is easier to use correctly than remembering to call `off` with the same reference."]},{type:`heading3`,text:`Complexity and edge cases`},{type:`bullets`,items:[`O(1) to subscribe and unsubscribe, O(h) to emit to h handlers.`,'Iterating over a copy (`[...set]`) makes "unsubscribe during emit" safe; otherwise a handler removing itself can make the loop skip or repeat.',`One throwing handler stops the rest. For a production bus, wrap each call in try/catch and report the error.`,"The event map must be a `type`, not an `interface`, because interfaces do not satisfy `Record<string, unknown>`."]},{type:`callout`,variant:`tip`,text:"The `// @ts-expect-error` lines in the tests are part of the test: the file only compiles if each of those calls is rejected by the type checker."},{type:`paragraph`,text:"See the existing EventEmitter answer in the Node.js coding round for an untyped version with `once`; this one focuses on compile-time safety."},{type:`heading3`,text:`Tests`},{type:`code`,lang:`typescript`,code:`import assert from 'node:assert/strict';

const bus = new EventBus<AppEvents>();
const logins: string[] = [];
const offLogin = bus.on('user:login', ({ userId }) => logins.push(userId)); // payload is typed
let ready = 0;
bus.on('app:ready', () => ready++);

bus.emit('user:login', { userId: 'u1' });
bus.emit('app:ready'); // no payload needed
offLogin();
bus.emit('user:login', { userId: 'u2' }); // no longer listening
assert.deepEqual(logins, ['u1']);
assert.equal(ready, 1);

// @ts-expect-error: items must be a number
bus.emit('cart:updated', { items: '3' });
// @ts-expect-error: unknown event name
bus.emit('user:logout', {});
// @ts-expect-error: missing payload
bus.emit('user:login');

const once = bus.on('cart:updated', () => once()); // unsubscribing during emit is safe
bus.emit('cart:updated', { items: 1 });
console.log('EventBus: all tests passed');`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How would you add `once`? (Wrap the handler in a function that unsubscribes itself before calling it.)",`When is a global event bus a bad idea in Angular? (Hidden coupling; prefer a service with typed signals or a store.)`,"How would you make it work across browser tabs? (`BroadcastChannel`; payloads must be structured-cloneable.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Typing the payload as `any` or `unknown`, which loses the whole point.",`Mutating the handler set while iterating over it.`,"No unsubscribe, so components that subscribe in `ngOnInit` leak handlers.","Using an `interface` for the event map and fighting a confusing constraint error."]},{type:`callout`,variant:`important`,text:"Senior signal: you design the types first (event map, generic keys, payload-less events), prove the type safety with `@ts-expect-error` tests, and discuss the operational edges (unsubscribing during emit, throwing handlers, leaks) and when a typed service is better than a bus."}]}};export{e as answers};