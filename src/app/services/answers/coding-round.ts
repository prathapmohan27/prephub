import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Check if a string is a palindrome': {
    summary:
      'A palindrome reads the same forwards and backwards. The clean solution uses two pointers — one at each end moving inward and comparing characters — which is O(n) time and O(1) extra space. The one-liner `str.split("").reverse().join("") === str` also works but allocates extra arrays. Always clarify whether case, spaces and punctuation should be ignored.',
    details: [
      {
        type: 'paragraph',
        text: 'Before coding, ask the clarifying question interviewers expect: is "A man, a plan, a canal: Panama" a palindrome? Usually the answer is yes — so you normalise (lower-case, keep only letters and digits) before comparing.',
      },
      { type: 'heading3', text: 'Approach 1 — reverse and compare (quick and readable)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function isPalindromeSimple(input: string): boolean {
  const clean = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}

isPalindromeSimple('racecar');                          // true
isPalindromeSimple('A man, a plan, a canal: Panama');   // true
isPalindromeSimple('hello');                            // false`,
      },
      { type: 'heading3', text: 'Approach 2 — two pointers (optimal, O(1) extra space)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function isAlphaNumeric(ch: string): boolean {
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
isPalindrome('');                   // true  (empty string reads the same both ways)`,
      },
      {
        type: 'flow',
        title: 'Two-pointer walk on "racecar"',
        code: `flowchart LR
  S["left=0, right=6<br/>r == r"]:::client --> A["left=1, right=5<br/>a == a"]:::server
  A --> B["left=2, right=4<br/>c == c"]:::server
  B --> C["left=3, right=3<br/>pointers meet"]:::highlight
  C --> R([return true]):::db`,
        text: 'Each step compares one pair and moves both pointers inward, so only n/2 comparisons are needed.',
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Reverse and compare:** O(n) time, O(n) space — `split`, `reverse` and `join` each create a new array or string.',
          '**Two pointers:** O(n) time, O(1) extra space, and it exits early on the first mismatch.',
        ],
      },
      { type: 'heading3', text: 'Edge cases to mention' },
      {
        type: 'bullets',
        items: [
          'Empty string and single character → `true`.',
          'Mixed case ("Madam") and punctuation/spaces — confirm the rules with the interviewer.',
          'Numbers: `isPalindrome(String(12321))`, or reverse the number mathematically if strings are not allowed.',
          'Unicode: `split("")` splits by UTF-16 code units, so emoji or surrogate pairs break. Use `[...str]` or `Array.from(str)` to iterate by code point.',
          'Null/undefined input — validate or type it as `string` in TypeScript.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: write the one-liner first to show you know the built-ins, then say "this uses O(n) extra memory — here is the two-pointer version" and code it. Showing the trade-off is what earns the points.',
      },
    ],
  },

  'Find the first non-repeating character in a string': {
    summary:
      'Do two passes: first count every character in a `Map`, then walk the string again in order and return the first character whose count is 1. That is O(n) time and O(k) space (k = distinct characters). The naive approach with `indexOf === lastIndexOf` is O(n²).',
    details: [
      {
        type: 'paragraph',
        text: 'The key insight is that "first" depends on the order in the original string, so after counting you must iterate the **string** again (or rely on a `Map`, which keeps insertion order). Iterating a plain object is risky because integer-like keys are reordered.',
      },
      { type: 'heading3', text: 'Optimal — frequency map, two passes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function firstNonRepeating(str: string): string | null {
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
firstNonRepeating('loveleetcode'); // 'v'`,
      },
      { type: 'heading3', text: 'Brute force — indexOf vs lastIndexOf' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function firstNonRepeatingBrute(str) {
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    // If first and last positions are the same, it occurs once
    if (str.indexOf(ch) === str.lastIndexOf(ch)) return ch;
  }
  return null;
}
// Readable, but indexOf/lastIndexOf are O(n) each → O(n²) overall`,
      },
      { type: 'heading3', text: 'Variant — return the index, case-insensitive' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function firstUniqueIndex(str: string): number {
  const lower = str.toLowerCase();
  const counts = new Map<string, number>();
  for (const ch of lower) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  for (let i = 0; i < lower.length; i++) {
    if (counts.get(lower[i]) === 1) return i;
  }
  return -1;
}

firstUniqueIndex('sTreSS'); // 3  ('e' — 's' and 'S' count as the same)`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Map approach:** O(n) time (two linear passes), O(k) space where k is the number of distinct characters — effectively O(1) for a fixed alphabet like lowercase English.',
          '**Brute force:** O(n²) time, O(1) space.',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Empty string → `null` (or `-1` for the index version).',
          'All characters repeat → `null`.',
          'Case sensitivity ("a" vs "A") and whether spaces count — ask.',
          'Unicode/emoji: `for...of` iterates by code point, so it handles emoji correctly; indexing with `str[i]` does not.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: building counts in a plain object and then iterating `Object.keys(counts)` to find the first count of 1. For keys like "1" and "2" the object reorders them numerically, so you can return the wrong character. Iterate the original string instead.',
      },
    ],
  },

  'Remove duplicate elements from an array [1,2,2,3,4,4,5] using built-in method and for loop': {
    summary:
      'Built-in: `[...new Set(arr)]` (or `Array.from(new Set(arr))`) returns `[1, 2, 3, 4, 5]` in O(n), preserving first-occurrence order. With a for loop: iterate once, keep a lookup of values already added, and push only unseen values into a result array. Avoid the `includes`-inside-a-loop version for large arrays — it is O(n²).',
    details: [
      {
        type: 'paragraph',
        text: 'The question explicitly asks for two versions: one that shows you know modern JavaScript, and one that shows you understand what the built-in is doing underneath.',
      },
      { type: 'heading3', text: 'Built-in methods' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const arr = [1, 2, 2, 3, 4, 4, 5];

// 1. Set — the idiomatic answer
const unique1 = [...new Set(arr)];
console.log(unique1); // [1, 2, 3, 4, 5]

// 2. Array.from — same thing, works where spread is awkward
const unique2 = Array.from(new Set(arr)); // [1, 2, 3, 4, 5]

// 3. filter + indexOf — keep an element only at its first position
const unique3 = arr.filter((value, index) => arr.indexOf(value) === index);
console.log(unique3); // [1, 2, 3, 4, 5]  (O(n²))

// 4. reduce — build the result while checking includes
const unique4 = arr.reduce((acc, v) => (acc.includes(v) ? acc : [...acc, v]), []);
// works, but creates a new array on every push → slow; avoid in real code`,
      },
      { type: 'heading3', text: 'For loop — O(n) with a lookup object' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function removeDuplicates(arr) {
  const result = [];
  const seen = {}; // or new Map() — see edge cases

  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];
    if (!seen[value]) {
      seen[value] = true;
      result.push(value);
    }
  }
  return result;
}

console.log(removeDuplicates([1, 2, 2, 3, 4, 4, 5])); // [1, 2, 3, 4, 5]`,
      },
      { type: 'heading3', text: 'For loop — no helpers at all (nested loop)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Some interviewers say "no Set, no includes, no indexOf"
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
// O(n²) time, but uses nothing except loops and comparisons`,
      },
      { type: 'heading3', text: 'Sorted input — in place, two pointers' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// [1,2,2,3,4,4,5] is already sorted, so duplicates are adjacent
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
dedupeSortedInPlace(a); // 5, a is now [1, 2, 3, 4, 5]  — O(n) time, O(1) space`,
      },
      { type: 'heading3', text: 'Complexity summary' },
      {
        type: 'bullets',
        items: [
          '`new Set` / loop with lookup object: O(n) time, O(n) space.',
          '`filter + indexOf`, `reduce + includes`, nested loop: O(n²) time.',
          'Sorted two-pointer: O(n) time, O(1) extra space (mutates input).',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'A plain object as lookup converts keys to strings, so `1` and `"1"` collide. Use `new Set()` or `new Map()` for mixed types.',
          'Objects are compared by reference — dedupe by a key (e.g. `id`) instead.',
          '`NaN`: Set removes duplicate NaNs; `indexOf(NaN)` is always -1, so the filter version drops every NaN.',
          'All these keep the **first** occurrence and preserve order.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "Set uses SameValueZero equality and keeps insertion order" — that one sentence explains why `[...new Set(arr)]` is both correct and order-preserving.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Find duplicate values in an array' },
      {
        type: 'paragraph',
        text: 'Walk the array once with two `Set`s — `seen` for values already visited and `duplicates` for values seen more than once — giving O(n) time and O(n) space. Alternatives are a frequency `Map` (when you also need counts) or `filter` with `indexOf` (short but O(n²)).',
      },
      {
        type: 'paragraph',
        text: 'Clarify the expected output first: each duplicate value once (`[2, 4]`), every repeated occurrence, or a count per value? The Set approach returns each duplicate value once, which is what most interviewers mean.',
      },
      { type: 'heading3', text: 'Optimal — Set of seen values' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function findDuplicates<T>(arr: T[]): T[] {
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
findDuplicates([1, 2, 3]);                // []`,
      },
      { type: 'heading3', text: 'With counts — frequency Map' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function duplicateCounts<T>(arr: T[]): Map<T, number> {
  const freq = new Map<T, number>();
  for (const item of arr) freq.set(item, (freq.get(item) ?? 0) + 1);

  // Keep only entries that occur more than once
  return new Map([...freq].filter(([, count]) => count > 1));
}

duplicateCounts([1, 2, 2, 3, 4, 4, 4]); // Map { 2 => 2, 4 => 3 }`,
      },
      { type: 'heading3', text: 'One-liner — filter + indexOf (small arrays only)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const arr = [1, 2, 2, 3, 4, 4, 4, 5];

// Element is a duplicate if it is not at its first index;
// wrap in a Set so 4 is not reported twice
const dups = [...new Set(arr.filter((v, i) => arr.indexOf(v) !== i))];
console.log(dups); // [2, 4]
// indexOf inside filter → O(n²)`,
      },
      { type: 'heading3', text: 'Duplicate objects by a key' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface User { id: number; email: string }

function duplicateEmails(users: User[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const u of users) {
    const key = u.email.toLowerCase(); // compare by a primitive key
    seen.has(key) ? dups.add(key) : seen.add(key);
  }
  return [...dups];
}`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Set / Map:** O(n) time, O(n) space — `has`/`add` are O(1) on average.',
          '**filter + indexOf:** O(n²) time — fine for 20 items, slow for 100k.',
          '**Sort then compare neighbours:** O(n log n) time, O(1) extra space if you may mutate the input (copy first otherwise).',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Empty array or no duplicates → `[]`.',
          'Objects are compared by **reference** in a Set — two `{ id: 1 }` literals are different. Use a key (id, email, or `JSON.stringify` for simple shapes).',
          '`NaN`: Set uses SameValueZero, so `NaN` duplicates are detected; `indexOf(NaN)` returns -1, so the filter version misses them.',
          'Mixed types: `1` and `"1"` are different values in a Set.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention the space/time trade-off — Set is O(n) time and O(n) memory, sorting is O(n log n) with O(1) extra memory. Asking "can I mutate the input?" shows good instincts.',
      },
    ],
  },

  'Flatten a nested array': {
    summary:
      'Use the built-in `arr.flat(Infinity)` to flatten any depth. To implement it yourself, recurse: for each element, if it is an array, flatten it and spread the result, otherwise push it. For very deep nesting, an iterative stack-based version avoids call-stack overflow.',
    details: [
      {
        type: 'paragraph',
        text: 'Input like `[1, [2, [3, [4]], 5]]` should become `[1, 2, 3, 4, 5]`. Interviewers usually want the recursive version, sometimes with a `depth` parameter to mirror `Array.prototype.flat`.',
      },
      { type: 'heading3', text: 'Built-in' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const nested = [1, [2, [3, [4]], 5]];

nested.flat();          // [1, 2, [3, [4]], 5]   (default depth = 1)
nested.flat(2);         // [1, 2, 3, [4], 5]
nested.flat(Infinity);  // [1, 2, 3, 4, 5]`,
      },
      { type: 'heading3', text: 'Recursive implementation (with optional depth)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Nested<T> = (T | Nested<T>)[];

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
flatten([1, [2, [3, [4]], 5]], 1); // [1, 2, [3, [4]], 5]`,
      },
      { type: 'heading3', text: 'Using reduce (common one-liner)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const flattenReduce = (arr) =>
  arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flattenReduce(item) : item),
    []
  );

flattenReduce([1, [2, [3, [4]], 5]]); // [1, 2, 3, 4, 5]
// Note: concat creates a new array each step — fine for interviews, slower for big data`,
      },
      { type: 'heading3', text: 'Iterative with a stack (no recursion limit)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function flattenIterative(arr) {
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

flattenIterative([1, [2, [3, [4]], 5]]); // [1, 2, 3, 4, 5]`,
      },
      {
        type: 'flow',
        title: 'Recursive flatten of [1, [2, [3]]]',
        code: `flowchart TD
  A["flatten([1, [2, [3]]])"]:::client --> B["1 is a value → push 1"]:::server
  A --> C["[2, [3]] is an array → recurse"]:::highlight
  C --> D["2 → push 2"]:::server
  C --> E["[3] → recurse"]:::highlight
  E --> F["3 → push 3"]:::server
  F --> R(["result: [1, 2, 3]"]):::db`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          'O(n) time where n is the total number of elements across all levels (each visited once).',
          'O(n) space for the output, plus O(d) call stack for recursion depth d (the iterative version uses a heap-allocated stack instead).',
          'Spreading huge arrays with `push(...items)` can hit the argument-count limit; loop and push individually for very large inputs.',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Empty arrays inside: `[1, [], [2]]` → `[1, 2]`.',
          'Sparse arrays: `flat()` removes holes (`[1, , 3].flat()` → `[1, 3]`).',
          'Strings are not arrays — `Array.isArray("abc")` is false, so they are kept as values.',
          'Very deep nesting (thousands of levels) can cause "Maximum call stack size exceeded" in the recursive version.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention `flat(Infinity)` first, then implement recursively, then offer the stack-based version and explain why (stack overflow on deep input). Supporting a `depth` parameter shows you know how the real API behaves.',
      },
    ],
  },

  'Group an array of objects by property': {
    summary:
      'Loop once and push each item into a bucket keyed by the property: `(groups[key] ??= []).push(item)`. `reduce` is the classic one-liner, and modern runtimes (ES2024, Node 21+, current browsers) provide `Object.groupBy(arr, fn)` and `Map.groupBy(arr, fn)`. All are O(n).',
    details: [
      {
        type: 'paragraph',
        text: 'Typical input: a list of employees, group them by `department`. Expected output: `{ Engineering: [...], Sales: [...] }`. Interviewers like to see a reusable, typed helper that accepts either a property name or a key function.',
      },
      { type: 'heading3', text: 'Classic reduce' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const people = [
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
// }`,
      },
      { type: 'heading3', text: 'Reusable, typed helper' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function groupBy<T, K extends PropertyKey>(
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
groupBy([1, 5, 12, 18], (n) => (n < 10 ? 'small' : 'big')); // { small: [1, 5], big: [12, 18] }`,
      },
      { type: 'heading3', text: 'Built-in: Object.groupBy and Map.groupBy' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ES2024 — available in Node 21+ and current browsers
const grouped = Object.groupBy(people, (p) => p.dept);
// { Engineering: [...], Sales: [...] }   (null-prototype object)

// Map.groupBy — when keys are not strings (objects, numbers, dates)
const byLength = Map.groupBy(people, (p) => p.name.length);
byLength.get(4); // [{ name: 'Asha', ... }, { name: 'Ravi', ... }]`,
      },
      { type: 'heading3', text: 'Variation: group and count / aggregate' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const orders = [
  { customer: 'A', total: 100 },
  { customer: 'B', total: 50 },
  { customer: 'A', total: 25 },
];

const totals = orders.reduce<Record<string, number>>((acc, o) => {
  acc[o.customer] = (acc[o.customer] ?? 0) + o.total;
  return acc;
}, {});
// { A: 125, B: 50 }`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          'O(n) time — one pass, O(1) average insert per item.',
          'O(n) space — every item is referenced once in the output (items are not copied).',
          'Avoid `{ ...acc, [key]: [...(acc[key] || []), item] }` inside reduce — copying on every step makes it O(n²).',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Missing/undefined property → items land under the key "undefined"; decide whether to skip or use a fallback like "Unknown".',
          'Object keys are strings — grouping by numbers or booleans converts them ("1", "true"). Use `Map` to keep the original key type or object keys.',
          'Keys like "__proto__" or "constructor" can misbehave on a normal `{}`; `Object.groupBy` returns a null-prototype object, or use `Object.create(null)` / `Map`.',
          'Empty array → `{}`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: write the reduce/loop version (it is what they are testing), then mention `Object.groupBy` and `Map.groupBy` exist natively now. Knowing both the fundamentals and the modern API is the ideal answer.',
      },
    ],
  },

  'Implement a debounce() function': {
    summary:
      'Debounce delays calling a function until it has not been called again for `wait` ms. Implementation: keep a timer in a closure; every call clears the previous timer and sets a new one; when the timer finally fires, call the original function with the latest arguments and the correct `this`. Typical use: search-as-you-type, resize and autosave handlers.',
    details: [
      {
        type: 'paragraph',
        text: 'Picture a lift door: every time someone walks in, the close timer restarts. The door only closes once nobody has entered for a few seconds. Debounce does the same for events — 10 keystrokes in quick succession produce **one** API call, after the user stops typing.',
      },
      { type: 'heading3', text: 'Core implementation' },
      {
        type: 'code',
        lang: 'javascript',
        code: `function debounce(fn, wait = 300) {
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
search('ang'); // only this one logs, 300ms after the last call: "API call for ang"`,
      },
      {
        type: 'heading3',
        text: 'Production version — typed, with cancel, flush and leading option',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface DebounceOptions { leading?: boolean }

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
window.addEventListener('beforeunload', () => save.flush()); // don't lose the last edit`,
      },
      {
        type: 'flow',
        title: 'Timer resets on every call',
        code: `sequenceDiagram
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
`,
        text: 'Three calls within the window collapse into a single call with the latest arguments.',
      },
      { type: 'heading3', text: 'In Angular you often use RxJS instead' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Reactive form control → debounced search
this.searchControl.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => this.api.search(q)), // cancels the stale request
    takeUntilDestroyed(this.destroyRef),
  )
  .subscribe((results) => this.results.set(results));`,
      },
      { type: 'heading3', text: 'Debounce vs throttle' },
      {
        type: 'bullets',
        items: [
          '**Debounce:** run once after activity stops — search input, form autosave, window resize end.',
          '**Throttle:** run at most once every N ms during activity — scroll position, mousemove, infinite scroll checks.',
        ],
      },
      { type: 'heading3', text: 'Complexity & edge cases' },
      {
        type: 'bullets',
        items: [
          'O(1) time per call and O(1) space — just one timer id and the last arguments.',
          'Preserve `this` and arguments — a common bug is calling `fn()` without them, breaking methods.',
          'Return values: a debounced function cannot return the result synchronously; return a Promise if the caller needs it.',
          'Clean up: call `cancel()` when a component is destroyed, otherwise the timer may fire after teardown.',
          'Create the debounced function **once** (e.g. as a class field), not inside the event handler — otherwise every call gets a fresh timer and nothing is debounced.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: using a regular `function` inside `setTimeout` loses `this`. Use an arrow function inside the returned wrapper (as above), or capture `const ctx = this` first.',
      },
    ],
  },
};
