var e={"time-and-space-complexity":{summary:`I count how the number of basic operations grows with the input size n, keep the dominant term and drop constants: one loop is O(n), a nested loop over the same data is O(n²), halving the search space each step is O(log n). Space is the extra memory I allocate, including the recursion stack. I pick the target complexity from the input limits: n ≤ 10^5 usually means O(n log n) or better, n ≤ 20 allows exponential backtracking.`,details:[{type:`heading3`,text:`How to analyse code quickly`},{type:`bullets`,items:[`**Sequential blocks add:** O(n) then O(n log n) is O(n log n). Keep the biggest term.`,`**Nested loops multiply:** a loop inside a loop over the same array is O(n²). Over two different inputs it is O(n · m), not O(n²).`,`**Halving is logarithmic:** binary search, balanced trees and "divide by 2 until 1" are O(log n).`,`**Recursion:** (number of calls) × (work per call). Naive Fibonacci makes ~2^n calls; with memoisation it makes n calls, so O(n).`,`**Sorting** with a comparison sort is O(n log n). If you sort, the whole solution is at least that.`,"**Hidden loops count:** `indexOf`, `includes`, `slice`, `splice`, spread `[...arr]` and `Array.prototype.shift` are all O(n)."]},{type:`heading3`,text:`Rules of thumb: input size → acceptable complexity`},{type:`paragraph`,text:`A judge (or a reasonable interviewer) allows roughly 10^7–10^8 simple operations per second. Read the constraints and work backwards:`},{type:`bullets`,items:[`**n ≤ 10–12** → O(n!) permutations are fine.`,`**n ≤ 20–25** → O(2^n) subsets / backtracking.`,`**n ≤ 500** → O(n³) (e.g. interval DP, Floyd–Warshall).`,`**n ≤ 5,000** → O(n²) (simple DP over pairs).`,`**n ≤ 10^5–10^6** → O(n log n) or O(n): sorting, heaps, hash maps, two pointers, sliding window.`,`**n ≥ 10^9** (or a value range, not an array) → O(log n) or O(1): binary search on the answer, maths.`]},{type:`heading3`,text:`Space complexity`},{type:`bullets`,items:[`Count **extra** memory: hash maps, copies, queues, result arrays (say whether you count the output).`,`**The recursion stack is space.** A DFS that recurses n levels deep is O(n) space even with no arrays allocated. Balanced recursion (merge sort, tree height) is O(log n) stack.`,`In-place algorithms (two pointers, swapping) are O(1) extra space.`]},{type:`heading3`,text:`Amortised cost`},{type:`paragraph`,text:"`push` on a JS array is O(1) **amortised**: occasionally the engine reallocates and copies the backing store (O(n)), but because capacity doubles, the total cost of n pushes is O(n), so O(1) each on average. The same reasoning applies to a sliding window: the inner `while` looks nested, but each element enters and leaves the window once, so the total is O(n), not O(n²)."},{type:`heading3`,text:`JavaScript gotchas that change the Big-O`},{type:`code`,lang:`typescript`,code:`// 1. shift() re-indexes the whole array: O(n) per call, O(n\xB2) for a BFS
const queue = [1, 2, 3];
queue.shift(); // avoid in hot loops; use an index pointer instead
let head = 0;
const next = queue[head++]; // O(1)

// 2. Default sort is lexicographic (compares strings)
[10, 9, 1].sort(); // [1, 10, 9]  wrong for numbers
[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10]

// 3. includes / indexOf on arrays are O(n); use a Set for O(1) lookups
const ids = [3, 7, 9];
const idSet = new Set(ids);
idSet.has(7); // O(1) average

// 4. String concatenation in a loop is fine in V8, but s.split('') / [...s] copies: O(n) space`},{type:`callout`,variant:`warning`,text:'A common bug is calling `arr.includes(x)` or `arr.indexOf(x)` inside a loop and then claiming O(n). That is O(n²). Say "this lookup is linear, so I will build a Set first".'},{type:`heading3`,text:`What to aim for in an interview`},{type:`numbered`,items:[`State the brute force and its complexity first, so you have a baseline.`,`Ask about (or assume) the input size and name the target: "n is up to 10^5, so I want O(n log n) or better".`,`Optimise towards the best reasonable bound. Usually that is O(n) or O(n log n) time, often trading O(n) extra space for it.`,`Finish by stating time **and** space, and say which term dominates and why.`]},{type:`callout`,variant:`tip`,text:`Interview tip: justify the complexity in one sentence tied to the code, e.g. "each index is pushed and popped at most once, so the two loops together are O(n)". That sounds far more senior than just saying "O(n)".`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Explain the complexity of merge sort vs quicksort (average and worst case).`,`Why is building a heap O(n) while n pushes are O(n log n)?`,`Complexity of naive vs memoised Fibonacci.`]}]},"two-sum-with-a-hash-map":{summary:"Two Sum is the **complement lookup** pattern: for each number x, the partner I need is `target - x`, so I keep a Map from value to index of everything seen so far and check it before inserting the current number. One pass, O(n) time and O(n) space, versus O(n²) for checking every pair.",details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`"Find two elements that sum / differ / combine to X" in an **unsorted** array.`,`You need fast "have I seen this before?" or "how many times?" questions.`,`You must return **indices** (so sorting, which loses the original positions, is awkward).`]},{type:`paragraph`,text:`**Brute force:** two nested loops checking every pair: O(n²) time, O(1) space. Sorting plus two pointers gives O(n log n), but loses the original indices unless you sort index pairs.`},{type:`heading3`,text:`Optimal solution`},{type:`code`,lang:`typescript`,code:`function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    const j = seen.get(need);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i); // add AFTER checking so we never pair an element with itself
  }
  return null;
}

twoSum([2, 7, 11, 15], 9); // [0, 1]
twoSum([3, 3], 6); // [0, 1]
twoSum([1, 2], 7); // null`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:["**Time:** O(n). One pass, and each Map `get` / `set` is O(1) on average.",`**Space:** O(n). In the worst case every value is stored before the pair is found.`]},{type:`heading3`,text:`Dry run: nums = [3, 2, 4], target = 6`},{type:`numbered`,items:[`i = 0, x = 3, need 3. Map is empty, so store {3 → 0}.`,`i = 1, x = 2, need 4. Not in the map, so store {3 → 0, 2 → 1}.`,`i = 2, x = 4, need 2. Found at index 1, so return [1, 2].`]},{type:`paragraph`,text:`Note that at i = 0 we did **not** return [0, 0], because 3 was checked before it was inserted.`},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:[`Duplicates such as [3, 3] with target 6: handled because we check before inserting.`,"No answer: return `null` (or throw, as agreed with the interviewer).",`Negative numbers and zero work unchanged.`,"Use `j !== undefined`, not `if (j)`, because index 0 is falsy."]},{type:`callout`,variant:`warning`,text:"Common bug: writing `if (seen.get(need))`. When the partner is at index 0 the check fails silently. Compare against `undefined` or use `seen.has(need)`."},{type:`heading3`,text:`When is a hash map the right tool?`},{type:`bullets`,items:[`**O(1) membership or lookup** replaces an inner O(n) scan: complements, "seen before", deduplication.`,`**Counting frequencies:** anagrams, majority element, top K.`,`**Grouping by a key:** group anagrams by sorted letters, group records by id.`,`**Prefix sums + map:** count subarrays summing to k by storing how often each prefix sum occurred.`,`**Not ideal** when you need order or ranges (use sorting, a heap or a balanced tree), when the array is already sorted (two pointers give O(1) space), or when keys are small integers (a plain array is faster).`]},{type:`callout`,variant:`tip`,text:"Interview tip: mention that a `Map` keeps any key type without string conversion, while a plain object turns keys into strings. Also mention that hash lookups are O(1) **average**, O(n) worst case under heavy collisions."},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Subarray sum equals K (prefix sum + hash map).`,`Group anagrams.`,`Longest consecutive sequence (Set).`,`Two Sum II on a sorted array (two pointers).`]}]},"two-pointers-pair-sum-dedupe-in-place":{summary:`Two pointers uses two indices that move towards each other (pair sum on a sorted array) or in the same direction at different speeds (a slow "write" pointer and a fast "read" pointer for in-place edits). Because the array is sorted, each comparison lets me discard one element for good, so both problems run in O(n) time with O(1) extra space.`,details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`The input is **sorted** (or sorting it is cheap and allowed).`,`You are looking for a pair or triplet with a target sum or difference.`,`The problem says **in place** or **O(1) extra space**: remove, compact, partition, reverse.`,`Palindromes and "compare from both ends" questions.`]},{type:`paragraph`,text:`**Brute force:** check every pair (O(n²)) or copy unique values into a new array (O(n) space). Two pointers removes both costs.`},{type:`heading3`,text:`Pair with a given sum (opposite ends)`},{type:`code`,lang:`typescript`,code:`function hasPairWithSum(sorted: number[], target: number): boolean {
  let left = 0;
  let right = sorted.length - 1;
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return true;
    if (sum < target) left++; // need a bigger sum
    else right--; // need a smaller sum
  }
  return false;
}

hasPairWithSum([1, 3, 4, 6, 9], 10); // true (1 + 9)
hasPairWithSum([1, 3, 4, 6, 9], 8); // false`},{type:`paragraph`,text:"**Why it is correct:** if `sum < target`, then `sorted[left]` plus anything left of `right` is even smaller, so `sorted[left]` can never be part of the answer and we drop it. The mirror argument applies to `right`."},{type:`heading3`,text:`Remove duplicates in place (slow and fast pointers)`},{type:`code`,lang:`typescript`,code:`function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let write = 1; // nums[0..write-1] holds the unique values so far
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write; // new length; values after it are leftovers
}

const arr = [1, 1, 2, 3, 3, 3, 4];
const k = removeDuplicates(arr); // 4
arr.slice(0, k); // [1, 2, 3, 4]`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Time:** O(n) for both. Every step moves at least one pointer, and pointers never move back.`,`**Space:** O(1) extra. We only keep two indices.`]},{type:`heading3`,text:`Dry run: [1, 3, 4, 6, 9], target 10`},{type:`numbered`,items:[`left = 0 (1), right = 4 (9): sum 10, so return true.`,`With target 8: 1 + 9 = 10 > 8, so right-- → 1 + 6 = 7 < 8, so left++ → 3 + 6 = 9 > 8, so right-- → 3 + 4 = 7 < 8, so left++ → left === right, stop, return false.`]},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:["Empty or single-element array: the `while (left < right)` loop never runs.","Using the same element twice: `left < right` (strict) prevents it.",`All duplicates, e.g. [2, 2, 2]: remove-duplicates returns 1.`,`Unsorted input: pair sum breaks. Either sort first (O(n log n)) or use a hash map.`]},{type:`callout`,variant:`warning`,text:"Do not `splice` duplicates out while looping: each `splice` is O(n), making the whole thing O(n²), and it shifts indices under your loop variable so you skip elements. Overwrite with a write pointer instead."},{type:`callout`,variant:`tip`,text:'Interview tip: state the invariant out loud, e.g. "everything before `write` is unique and in order". Invariants make two-pointer code easy to defend and easy to debug.'},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`3Sum (sort, then two pointers per element).`,`Container with most water.`,`Valid palindrome.`,`Move zeroes to the end in place.`]}]},"sliding-window-longest-unique-substring":{summary:`This is a **variable-size sliding window**: I grow the window with a right pointer and, when a character repeats, move the left pointer just past its previous occurrence. A Map from character to last-seen index lets the left pointer jump in O(1). Each character is visited once, so it is O(n) time and O(k) space, where k is the alphabet size.`,details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`"Longest / shortest / count of **contiguous** substring or subarray" that satisfies a condition.`,`The condition can be maintained incrementally when you add one element on the right and remove one on the left (counts, sums, distinct characters).`,`Fixed-size variants: "maximum sum of any k consecutive elements".`]},{type:`paragraph`,text:`**Brute force:** check every substring for uniqueness: O(n²) substrings × O(n) check = O(n³), or O(n²) with a Set per start index.`},{type:`heading3`,text:`Optimal solution`},{type:`code`,lang:`typescript`,code:`function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>(); // char -> last index
  let start = 0; // left edge of the window
  let best = 0;
  for (let end = 0; end < s.length; end++) {
    const ch = s[end];
    const prev = lastSeen.get(ch);
    if (prev !== undefined && prev >= start) {
      start = prev + 1; // jump past the previous copy
    }
    lastSeen.set(ch, end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}

lengthOfLongestSubstring('abcabcbb'); // 3 ("abc")
lengthOfLongestSubstring('pwwkew'); // 3 ("wke")
lengthOfLongestSubstring('abba'); // 2`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:["**Time:** O(n). `end` visits each character once, and `start` only moves forward.",`**Space:** O(min(n, k)) for the map, where k is the character set size (O(1) for ASCII).`]},{type:`heading3`,text:`Dry run: s = 'abba'`},{type:`numbered`,items:[`end 0 'a': window [0,0] = 'a', best 1.`,`end 1 'b': window [0,1] = 'ab', best 2.`,`end 2 'b': last 'b' at 1 ≥ start 0, so start = 2. Window 'b', best stays 2.`,`end 3 'a': last 'a' at 0, but 0 < start 2, so it is outside the window. Window [2,3] = 'ba', best 2.`]},{type:`callout`,variant:`warning`,text:"The `prev >= start` check is the classic bug. Without it, 'abba' moves `start` **backwards** to 1 at the last step and returns 3. A stale index from before the window must be ignored. An alternative is `start = Math.max(start, prev + 1)`."},{type:`heading3`,text:`The general template`},{type:`code`,lang:`typescript`,code:`// let left = 0;
// for (let right = 0; right < n; right++) {
//   add(items[right]);
//   while (windowIsInvalid()) remove(items[left++]);
//   best = Math.max(best, right - left + 1);
// }`},{type:`paragraph`,text:"The Set-based version of this problem uses that `while` loop: delete `s[left]` and advance until the duplicate is gone. It is still O(n) because each character is added and removed at most once."},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:[`Empty string returns 0.`,`All same characters ("bbbb") returns 1.`,`Spaces and symbols count as characters.`,"Unicode: `s[i]` reads UTF-16 code units, so emoji are split in two. Use `for...of` or `Array.from(s)` if that matters."]},{type:`callout`,variant:`tip`,text:`Interview tip: name the window invariant ("the window never contains a repeat") before coding. Then every line is either restoring the invariant or recording the best answer.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Minimum window substring.`,`Longest repeating character replacement.`,`Maximum sum subarray of size k (fixed window).`,`Permutation in string.`]}]},"binary-search-first-true-position":{summary:"Whenever a condition is false, false, ..., true, true over an ordered range (it is **monotonic**), I can binary search for the boundary. I keep a half-open search on `[lo, hi]` with `while (lo < hi)`: if `mid` is true it might be the answer, so `hi = mid`; otherwise `lo = mid + 1`. When they meet, `lo` is the first true position. O(log n) time and O(1) space.",details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`Sorted data, or a yes/no question whose answer flips **once** as the index grows.`,`"First / last position", "minimum value such that...", "smallest capacity that works".`,`Huge ranges (n up to 10^9) where a linear scan is impossible: **binary search on the answer** (e.g. Koko eating bananas, ship packages within D days).`]},{type:`paragraph`,text:"**Brute force:** check every version from 1 up to n until the first bad one: O(n) calls to the expensive `isBad` API."},{type:`heading3`,text:`Optimal solution: one reusable template`},{type:`code`,lang:`typescript`,code:`// Returns the smallest i in [lo, hi] where isTrue(i) is true.
// Pass hi = "one past the end" if it is possible that nothing is true.
function firstTrue(lo: number, hi: number, isTrue: (i: number) => boolean): number {
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2); // rounds down, so mid < hi
    if (isTrue(mid)) hi = mid; // mid could be the answer, keep it
    else lo = mid + 1; // mid is false, answer is to the right
  }
  return lo;
}

// First bad version: versions 1..n, at least one is bad
function firstBadVersion(n: number, isBad: (v: number) => boolean): number {
  return firstTrue(1, n, isBad);
}

firstBadVersion(5, (v) => v >= 4); // 4

// Lower bound: first index with a[i] >= x (returns a.length if none)
const lowerBound = (a: number[], x: number) => firstTrue(0, a.length, (i) => a[i] >= x);
lowerBound([1, 3, 3, 5], 3); // 1
lowerBound([1, 3, 3, 5], 6); // 4`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Time:** O(log n) calls to the predicate. Each iteration halves the range.`,`**Space:** O(1). No recursion, two integers.`]},{type:`heading3`,text:`Dry run: n = 5, first bad = 4`},{type:`numbered`,items:[`lo = 1, hi = 5, mid = 3: not bad, so lo = 4.`,`lo = 4, hi = 5, mid = 4: bad, so hi = 4.`,`lo === hi = 4, the loop ends. Return 4 after only 2 calls.`]},{type:`callout`,variant:`warning`,text:'Off-by-one traps: (1) with `hi = mid` you must use `while (lo < hi)`, not `<=`, or the loop never ends when lo === hi; (2) never write `lo = mid` with a rounded-down mid, because when hi = lo + 1 the range stops shrinking; (3) for lower bound use `hi = a.length`, not `a.length - 1`, so "not found" has a value to return.'},{type:`paragraph`,text:"`lo + Math.floor((hi - lo) / 2)` avoids integer overflow in languages with fixed-width integers. In JS numbers are safe up to 2^53, but interviewers like seeing the habit. `(lo + hi) >>> 1` is also common, but only works below 2^31."},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:[`Only one version (n = 1): loop does not run, returns 1.`,`All versions bad: returns 1. Nothing bad (if allowed): use hi = n + 1 and check for it.`,`Empty array for lower bound: returns 0.`,"Duplicates: this template returns the **first** occurrence; for the last, search for the first index with `a[i] > x` and subtract 1."]},{type:`callout`,variant:`tip`,text:`Interview tip: phrase every binary search as "find the first index where predicate is true" and say the predicate out loud. One template then covers search insert position, first/last occurrence, square root and capacity problems, and you avoid juggling three different loop styles.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Search insert position.`,`Find first and last position of an element in a sorted array.`,`Search in a rotated sorted array.`,`Koko eating bananas (binary search on the answer).`]}]},"balanced-brackets-with-a-stack":{summary:`Brackets close in **last-in, first-out** order, which is exactly a stack: push every opening bracket, and on a closing bracket pop and check that it matches. The string is balanced if no pop fails and the stack is empty at the end. O(n) time, O(n) space in the worst case (all openers).`,details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`Nested structure: brackets, HTML tags, function calls, undo history.`,`"The most recent unmatched thing" must be handled first.`,"Evaluating expressions, simplifying paths (`/a/./b/../c`), decoding nested strings like `3[a2[c]]`.",`A **monotonic stack** variant answers "next greater element" questions.`]},{type:`paragraph`,text:`**Brute force:** repeatedly delete adjacent pairs like "()" until nothing changes: O(n²). A single counter works for one bracket type only; it cannot detect "([)]".`},{type:`heading3`,text:`Optimal solution`},{type:`code`,lang:`typescript`,code:`function isBalanced(s: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (ch in pairs) {
      // closing bracket: the most recent opener must match
      if (stack.pop() !== pairs[ch]) return false; // wrong type, or nothing to close
    }
    // any other character is ignored
  }
  return stack.length === 0; // leftover openers mean unbalanced
}

isBalanced('({[]})'); // true
isBalanced('([)]'); // false
isBalanced('(('); // false
isBalanced(')('); // false`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:["**Time:** O(n). Each character is pushed and popped at most once; `push` / `pop` are O(1).",`**Space:** O(n) in the worst case, e.g. "((((((".`]},{type:`heading3`,text:`Dry run: '([)]'`},{type:`numbered`,items:[`'(' → push. Stack: ['('].`,`'[' → push. Stack: ['(', '['].`,`')' → pop '[', but ')' needs '(', so return false.`]},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:[`Empty string: balanced (true).`,"Starts with a closer: `pop()` on an empty array returns `undefined`, which never matches, so false.","Only openers: the final `stack.length === 0` check catches it.",`Odd length: can return false immediately as a quick optimisation.`,`Non-bracket characters: decide with the interviewer whether to ignore or reject them.`]},{type:`callout`,variant:`warning`,text:'Two common bugs: forgetting the final `stack.length === 0` check (so "((" passes), and using `shift`/`unshift` instead of `push`/`pop`. The front of a JS array is O(n) to modify; always use the end of the array as the top of the stack.'},{type:`callout`,variant:`tip`,text:"Interview tip: keep the closer → opener mapping in a lookup object instead of a chain of if/else. It is shorter, it is easy to extend to `<>`, and it shows you separate data from logic."},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Minimum add to make parentheses valid.`,`Daily temperatures (monotonic stack).`,`Evaluate reverse Polish notation.`,`Simplify a Unix path.`]}]},"merge-overlapping-intervals":{summary:"Sort the intervals by start time; then overlaps can only happen between neighbours. I walk the sorted list keeping the last merged interval: if the next one starts at or before its end, I extend the end with `Math.max`; otherwise I start a new interval. O(n log n) time for the sort, O(n) space for the output.",details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`Input is a list of ranges: meetings, bookings, time slots, IP ranges.`,`"Merge", "insert", "do any overlap?", "how many rooms are needed?", "free time".`,`Sorting by start (or by end for greedy scheduling) turns an all-pairs problem into one linear sweep.`]},{type:`paragraph`,text:`**Brute force:** compare every pair and merge until nothing changes: O(n²) or worse.`},{type:`heading3`,text:`Optimal solution`},{type:`code`,lang:`typescript`,code:`function merge(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]); // numeric sort by start, no mutation
  const result: [number, number][] = [[sorted[0][0], sorted[0][1]]];

  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = result[result.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end); // overlap: extend the current interval
    } else {
      result.push([start, end]); // gap: start a new interval
    }
  }
  return result;
}

merge([[8, 10], [1, 3], [2, 6], [15, 18]]); // [[1, 6], [8, 10], [15, 18]]
merge([[1, 4], [4, 5]]); // [[1, 5]]
merge([[1, 10], [2, 3]]); // [[1, 10]]`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Time:** O(n log n). The sort dominates; the sweep is O(n).`,`**Space:** O(n) for the sorted copy and the result (sort itself uses O(log n) to O(n) internally).`]},{type:`heading3`,text:`Dry run: [[8,10],[1,3],[2,6],[15,18]]`},{type:`numbered`,items:[`Sort by start: [1,3], [2,6], [8,10], [15,18]. Result = [[1,3]].`,`[2,6]: 2 ≤ 3, overlap, so end = max(3, 6) = 6. Result [[1,6]].`,`[8,10]: 8 > 6, gap, so push. Result [[1,6],[8,10]].`,`[15,18]: 15 > 10, push. Final [[1,6],[8,10],[15,18]].`]},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:["Touching intervals like [1,4] and [4,5]: `<=` merges them. Ask whether touching counts as overlapping (for meetings it often does not).","One interval contains another, e.g. [1,10] and [2,3]: `Math.max` keeps 10. Writing `last[1] = end` is a classic bug.",`Empty input and a single interval.`,`Unsorted input and negative numbers.`]},{type:`callout`,variant:`warning`,text:"Two JS-specific bugs: (1) `intervals.sort()` with no comparator sorts arrays as strings, so [10, 12] comes before [9, 11]; always pass `(a, b) => a[0] - b[0]`. (2) `sort` mutates the caller's array, and pushing `sorted[0]` itself means later merges mutate the input objects. Copy first."},{type:`callout`,variant:`tip`,text:`Interview tip: explain **why** sorting is enough. After sorting, if interval i does not overlap the merged block before it, no later interval can either, because they all start even later. That one sentence proves the greedy sweep is correct.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Insert interval.`,`Meeting rooms II (minimum rooms, using a min-heap of end times or a sweep line).`,`Non-overlapping intervals (greedy by end time).`,`Employee free time.`]}]},"top-k-frequent-heap-vs-bucket-sort":{summary:`First count frequencies with a Map. Then either keep a **min-heap of size k** ordered by frequency, evicting the smallest whenever it grows past k (O(n log k)), or use **bucket sort**: a frequency can be at most n, so I put values into an array indexed by frequency and read it from the top until I have k (O(n)). Both use O(n) space; bucket sort is faster, the heap also works for streams.`,details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`"Top K", "K most frequent", "K closest", "Kth largest".`,`You need the best k items, **not** a fully sorted list, so a full O(n log n) sort is more work than needed.`,`Values (frequencies, distances) are bounded small integers → bucket sort becomes possible.`]},{type:`paragraph`,text:`**Brute force:** count, then sort all distinct values by frequency and take the first k: O(n log n). That is often acceptable, so mention it as the baseline.`},{type:`heading3`,text:`Optimal: bucket sort, O(n)`},{type:`code`,lang:`typescript`,code:`function topKFrequent(nums: number[], k: number): number[] {
  const count = new Map<number, number>();
  for (const n of nums) count.set(n, (count.get(n) ?? 0) + 1);

  // buckets[f] = values that appear exactly f times (f is at most nums.length)
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, freq] of count) buckets[freq].push(value);

  const result: number[] = [];
  for (let f = buckets.length - 1; f > 0 && result.length < k; f--) {
    for (const value of buckets[f]) {
      result.push(value);
      if (result.length === k) break;
    }
  }
  return result;
}

topKFrequent([1, 1, 1, 2, 2, 3], 2); // [1, 2]`},{type:`heading3`,text:`Heap approach, O(n log k)`},{type:`paragraph`,text:`JavaScript has no built-in priority queue, so write a small binary heap. A **min**-heap of size k keeps the k best seen so far; its root is the weakest of them, so any new element that beats the root replaces it.`},{type:`code`,lang:`typescript`,code:`class MinHeap<T> {
  private items: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare; // negative when a should sit above b
  }
  get size(): number {
    return this.items.length;
  }
  push(item: T): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1; // sift up
      if (this.compare(this.items[i], this.items[parent]) >= 0) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }
  pop(): T | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last !== undefined) {
      this.items[0] = last; // move the last leaf to the root, then sift down
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < this.items.length && this.compare(this.items[left], this.items[smallest]) < 0) smallest = left;
        if (right < this.items.length && this.compare(this.items[right], this.items[smallest]) < 0) smallest = right;
        if (smallest === i) break;
        [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
        i = smallest;
      }
    }
    return top;
  }
}

function topKFrequentHeap(nums: number[], k: number): number[] {
  const count = new Map<number, number>();
  for (const n of nums) count.set(n, (count.get(n) ?? 0) + 1);

  const heap = new MinHeap<[number, number]>((a, b) => a[1] - b[1]); // by frequency
  for (const entry of count) {
    heap.push(entry);
    if (heap.size > k) heap.pop(); // evict the least frequent
  }
  const result: number[] = [];
  while (heap.size > 0) result.push(heap.pop()![0]);
  return result.reverse(); // most frequent first
}

topKFrequentHeap([1, 1, 1, 2, 2, 3], 2); // [1, 2]`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Bucket sort:** O(n) time (count, fill buckets, one scan of n + 1 buckets); O(n) space.`,`**Heap:** O(n + m log k) time, where m ≤ n is the number of distinct values, because each push/pop is O(log k); O(m + k) space.`]},{type:`heading3`,text:`Dry run (bucket sort): [1,1,1,2,2,3], k = 2`},{type:`numbered`,items:[`Counts: {1 → 3, 2 → 2, 3 → 1}.`,`Buckets: [3] holds [1], [2] holds [2], [1] holds [3].`,`Scan from f = 6 down: empty until f = 3 → [1]; f = 2 → [1, 2]. k reached, return [1, 2].`]},{type:`heading3`,text:`Edge cases and trade-offs`},{type:`bullets`,items:[`k equals the number of distinct values: return all of them.`,`Ties: order among equal frequencies is unspecified; ask if a tie-break is needed.`,`**Streams / unbounded data:** use the heap. Bucket sort needs the maximum frequency in advance.`,`**k much smaller than n:** the heap uses only O(k) extra memory beyond the counts.`,`Quickselect is a third option: O(n) average, O(n²) worst case.`]},{type:`callout`,variant:`warning`,text:`Common heap bug: using a **max**-heap of all elements and popping k times. It works but costs O(n log n) and O(n) heap space, which defeats the purpose. For "top k largest" use a **min**-heap capped at size k.`},{type:`callout`,variant:`tip`,text:`Interview tip: ask whether you may assume a priority queue exists. Many interviewers say yes; if not, say "I will write a minimal heap with push and pop" and keep it to these two methods.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Kth largest element in an array.`,`K closest points to origin.`,`Top K frequent words (heap with a tie-break).`,`Find median from a data stream (two heaps).`]}]},"bfs-vs-dfs-number-of-islands":{summary:`Treat the grid as a graph where each land cell connects to its four neighbours. Scan every cell; when I find unvisited land I increment the count and flood-fill the whole island with BFS or DFS, marking cells as visited (sinking them to '0') so they are never counted again. Each cell is processed a constant number of times, so O(rows × cols) time; space is O(rows × cols) worst case for the queue, stack or recursion.`,details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`A 2D grid or matrix where cells connect to neighbours: "connected components", "regions", "flood fill".`,`Count, size or perimeter of groups of connected cells.`,`Use **BFS** when you need the **shortest path** in steps (rotting oranges, shortest path in a maze). Use **DFS** (or either) when you only need to visit everything reachable.`]},{type:`paragraph`,text:`**Brute force:** there is not much worse; the naive mistake is recounting cells or using union-find without needing it. The core idea is "count how many times we start a new flood fill".`},{type:`heading3`,text:`BFS with an index-pointer queue`},{type:`code`,lang:`typescript`,code:`function numIslandsBfs(grid: string[][]): number {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let islands = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '1') continue;
      islands++;
      grid[r][c] = '0'; // mark visited when ENQUEUED, not when dequeued
      const queue: [number, number][] = [[r, c]];
      let head = 0; // index pointer instead of queue.shift(), which is O(n)
      while (head < queue.length) {
        const [cr, cc] = queue[head++];
        for (const [dr, dc] of dirs) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === '1') {
            grid[nr][nc] = '0';
            queue.push([nr, nc]);
          }
        }
      }
    }
  }
  return islands;
}`},{type:`heading3`,text:`DFS (recursive)`},{type:`code`,lang:`typescript`,code:`function numIslandsDfs(grid: string[][]): number {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;

  const sink = (r: number, c: number): void => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
    grid[r][c] = '0'; // mark visited before recursing
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  };

  let islands = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        islands++;
        sink(r, c);
      }
    }
  }
  return islands;
}

const grid = [
  ['1', '1', '0', '0', '0'],
  ['1', '1', '0', '0', '0'],
  ['0', '0', '1', '0', '0'],
  ['0', '0', '0', '1', '1'],
];
numIslandsDfs(grid); // 3`},{type:`heading3`,text:`Iterative DFS for large grids`},{type:`code`,lang:`typescript`,code:`function sinkIterative(grid: string[][], startR: number, startC: number): void {
  const stack: [number, number][] = [[startR, startC]];
  grid[startR][startC] = '0';
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      if (grid[nr]?.[nc] === '1') { // optional chaining handles out-of-bounds rows
        grid[nr][nc] = '0';
        stack.push([nr, nc]);
      }
    }
  }
}`},{type:`callout`,variant:`warning`,text:`Recursion depth: a 1000 × 1000 grid of all land makes the recursive DFS go up to a million calls deep and throws "Maximum call stack size exceeded" in Node. For large grids use BFS or the explicit-stack DFS above. Also mark cells visited when you **push** them; marking on pop lets the same cell enter the queue several times.`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Time:** O(R × C). Each cell is visited by the outer scan once and sunk at most once, checking 4 neighbours.`,`**Space:** O(R × C) worst case (all land) for the queue, the explicit stack or the call stack. The difference is where it lives: BFS and iterative DFS use heap memory, while recursive DFS uses the limited call stack.`]},{type:`heading3`,text:`Dry run on the grid above`},{type:`numbered`,items:[`(0,0) is land: count = 1, flood fill sinks (0,0), (0,1), (1,0), (1,1).`,`Scan continues; (2,2) is land: count = 2, sinks just that cell.`,`(3,3) is land: count = 3, sinks (3,3) and (3,4).`,`No land left, return 3.`]},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:["Empty grid or `[[]]`: return 0 (the `rows ? grid[0].length : 0` guard).",`Diagonals do not connect unless the problem says so (then use 8 directions).`,"Mutating the input: if not allowed, keep a separate `visited` boolean grid or a Set of `r * cols + c` keys."]},{type:`callout`,variant:`tip`,text:`Interview tip: say up front whether you will modify the input grid, and why it is acceptable. Then mention the trade-off: BFS gives shortest paths and avoids stack overflow, DFS is shorter to write.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Max area of island.`,`Rotting oranges (multi-source BFS).`,`Surrounded regions.`,`Number of connected components in an undirected graph (also union-find).`]}]},"cycle-detection-with-topological-sort":{summary:`Model prerequisites as a directed graph (prerequisite → course) and run **Kahn's algorithm**: compute in-degrees, queue every node with in-degree 0, and repeatedly remove a node and decrement its neighbours, queueing any that reach 0. If the number of processed nodes is less than the total, the leftover nodes are on or behind a cycle, so the courses cannot all be finished. O(V + E) time and space.`,details:[{type:`heading3`,text:`How to recognise this pattern`},{type:`bullets`,items:[`Tasks with "must happen before" relations: course prerequisites, build steps, package dependencies, spreadsheet formulas.`,`"Is there a valid order?", "find an order", "detect a circular dependency".`,`The graph is **directed**; a valid order exists only if it is a DAG.`]},{type:`paragraph`,text:`**Brute force:** try every permutation of courses and check constraints: O(V!). Or run a DFS from each node looking for a path back to itself: O(V × (V + E)).`},{type:`heading3`,text:`Optimal: Kahn's algorithm (BFS topological sort)`},{type:`code`,lang:`typescript`,code:`// prerequisites[i] = [course, prereq] means "take prereq before course"
function topoOrder(numCourses: number, prerequisites: [number, number][]): number[] | null {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array<number>(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course); // edge prereq -> course
    inDegree[course]++;
  }

  // start with every course that has no prerequisites
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) if (inDegree[i] === 0) queue.push(i);

  const order: number[] = [];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    order.push(node);
    for (const next of graph[node]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next); // all its prerequisites are done
    }
  }
  // nodes that never reached in-degree 0 sit on (or behind) a cycle
  return order.length === numCourses ? order : null;
}

function canFinish(numCourses: number, prerequisites: [number, number][]): boolean {
  return topoOrder(numCourses, prerequisites) !== null;
}

canFinish(2, [[1, 0]]); // true
canFinish(2, [[1, 0], [0, 1]]); // false (0 needs 1, 1 needs 0)
topoOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]]); // [0, 1, 2, 3]`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Time:** O(V + E). Each node is enqueued once and each edge is relaxed once.`,`**Space:** O(V + E) for the adjacency list, plus O(V) for in-degrees and the queue.`]},{type:`heading3`,text:`Dry run: 3 courses, [[1,0],[2,1],[1,2]]`},{type:`numbered`,items:[`Edges: 0 → 1, 1 → 2, 2 → 1. In-degrees: [0, 2, 1].`,`Queue starts with [0]. Process 0: in-degree of 1 drops to 1, not 0.`,`Queue is empty. Processed 1 of 3 nodes, so return null: 1 and 2 form a cycle.`]},{type:`heading3`,text:`Alternative: DFS with three colours`},{type:`paragraph`,text:`Mark nodes white (unvisited), grey (on the current DFS path) and black (finished). Reaching a **grey** node means a back edge, so a cycle. Reverse post-order gives a topological order. It is equally O(V + E), but recursive, so deep chains risk stack overflow; Kahn's is iterative and easier to explain.`},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:[`No prerequisites: every course has in-degree 0, so true.`,`Self-loop like [0, 0]: in-degree of 0 never reaches 0, so false.`,`Duplicate edges: still correct, because both the edge and the in-degree are counted twice.`,`Disconnected components: handled because we seed the queue with **all** zero-in-degree nodes.`]},{type:`callout`,variant:`warning`,text:'The most common bug is reversing the edge direction: `[course, prereq]` must become `prereq → course` with `inDegree[course]++`. Getting it backwards still detects cycles but returns the order upside down, which fails "find an order" variants.'},{type:`callout`,variant:`tip`,text:`Interview tip: connect it to real work: "this is what npm, Nx, or a build system does to order tasks, and how a bundler reports circular imports". It shows you understand why the algorithm matters.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Course schedule II (return the order).`,`Alien dictionary.`,`Parallel courses (minimum semesters = number of BFS levels).`,`Find eventual safe states.`]}]},"spotting-dp-climbing-stairs-coin-change":{summary:`A problem is a DP problem when it asks for an optimum or a count, can be broken into smaller versions of itself (**optimal substructure**), and the same subproblems repeat (**overlapping subproblems**). I first write the recurrence, then memoise it top-down, then convert to a bottom-up table and shrink the state if I can. Climbing stairs becomes O(n) time and O(1) space; coin change is O(amount × coins) time and O(amount) space.`,details:[{type:`heading3`,text:`Recognition checklist`},{type:`bullets`,items:[`The question asks for **"minimum / maximum"**, **"number of ways"**, or **"is it possible"**.`,`Each step is a **choice** (take or skip, which coin, which step size) and later choices depend on earlier ones.`,`Greedy fails on a small counter-example (coins [1, 3, 4], amount 6: greedy picks 4 + 1 + 1 = 3 coins, best is 3 + 3 = 2).`,`A brute-force recursion exists, but it recomputes the same arguments many times.`,`The state can be described by a few integers: an index, a remaining amount, a capacity.`]},{type:`numbered`,items:[`Define the state in words: "ways(i) = number of ways to reach step i".`,`Write the recurrence and base cases.`,`Memoise (top-down) to remove repeated work.`,`Convert to bottom-up by filling states in dependency order.`,`Optimise space if each state depends only on the last few.`]},{type:`heading3`,text:`Climbing stairs (1 or 2 steps at a time)`},{type:`paragraph`,text:"**Recurrence:** to stand on step n you came from n − 1 or n − 2, so `ways(n) = ways(n − 1) + ways(n − 2)`, with `ways(0) = ways(1) = 1`. Plain recursion is O(2^n) because ways(n − 2) is computed by both branches."},{type:`code`,lang:`typescript`,code:`// Top-down: recursion + memo, O(n) time, O(n) space (map + call stack)
function climbStairsMemo(n: number, memo = new Map<number, number>()): number {
  if (n <= 1) return 1;
  const cached = memo.get(n);
  if (cached !== undefined) return cached;
  const ways = climbStairsMemo(n - 1, memo) + climbStairsMemo(n - 2, memo);
  memo.set(n, ways);
  return ways;
}

// Bottom-up with two variables: O(n) time, O(1) space
function climbStairs(n: number): number {
  let prev = 1; // ways(0)
  let curr = 1; // ways(1)
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}

climbStairs(5); // 8
climbStairs(10); // 89`},{type:`paragraph`,text:`**Dry run, n = 4:** (prev, curr) starts (1, 1) → i=2: (1, 2) → i=3: (2, 3) → i=4: (3, 5). Answer 5: 1111, 112, 121, 211, 22.`},{type:`heading3`,text:`Coin change (minimum number of coins)`},{type:`paragraph`,text:"**State:** `dp[a]` = fewest coins that make amount a. **Recurrence:** `dp[a] = 1 + min(dp[a − coin])` over coins ≤ a, with `dp[0] = 0`. Unreachable amounts stay `Infinity`."},{type:`code`,lang:`typescript`,code:`function coinChange(coins: number[], amount: number): number {
  // dp[a] = fewest coins that make amount a (Infinity = impossible)
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && dp[a - coin] + 1 < dp[a]) {
        dp[a] = dp[a - coin] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

coinChange([1, 2, 5], 11); // 3 (5 + 5 + 1)
coinChange([2], 3); // -1
coinChange([1, 3, 4], 6); // 2 (3 + 3), greedy would say 3`},{type:`paragraph`,text:`**Dry run, coins [1, 3, 4], amount 6:** dp[0..6] = 0, 1, 2, 1, 1, 2, 2. For a = 6: via 1 → dp[5] + 1 = 3, via 3 → dp[3] + 1 = 2, via 4 → dp[2] + 1 = 3, so dp[6] = 2.`},{type:`heading3`,text:`Complexity`},{type:`bullets`,items:[`**Climbing stairs:** O(n) time; O(1) space bottom-up (O(n) memoised, because of the map and the call stack).`,`**Coin change:** O(amount × number of coins) time, since each amount tries every coin; O(amount) space for the table.`]},{type:`heading3`,text:`Edge cases to mention`},{type:`bullets`,items:[`amount = 0 → 0 coins; n = 0 or 1 → 1 way.`,"Impossible amount → -1 (check for `Infinity`, do not return it).","Large n for climbing stairs: results exceed 2^53 around n = 78; use `BigInt` if exact values matter.",`Coin change "number of ways" is a different DP: loop coins in the outer loop to count combinations, not permutations.`]},{type:`callout`,variant:`warning`,text:`Memoised recursion in JS can overflow the call stack for large inputs (roughly 10^4 frames, depending on the engine). If n can be large, use the bottom-up version. Also pass the same memo down every recursive call, as above; creating a new Map per call makes the memo useless.`},{type:`callout`,variant:`tip`,text:`Interview tip: say the state definition in plain English before writing any code. If you can say "dp[a] is the fewest coins for amount a", the recurrence and base case usually follow, and the interviewer can check your reasoning before you type.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`House robber.`,`Coin change II (number of combinations).`,`Longest increasing subsequence.`,`Word break.`]}]},"tackling-an-unseen-coding-problem":{summary:`I follow a fixed framework so I never freeze: clarify the problem and constraints, work through small examples by hand, state a brute force with its complexity, look for the pattern that removes the bottleneck, agree on the approach, code it while narrating, then test with my examples and edge cases and state time and space. Interviewers grade the process and communication as much as the final code.`,details:[{type:`heading3`,text:`The step-by-step framework`},{type:`numbered`,items:[`**Clarify (2–3 min).** Restate the problem in your own words. Ask about input size, value ranges, duplicates, negatives, empty input, sorted or not, and the expected output when there is no answer. Constraints tell you the target complexity.`,`**Examples (2–3 min).** Write a normal case and one or two edge cases. Solve them by hand; how you solved them is often the algorithm.`,`**Brute force (1–2 min).** Say the simplest correct solution and its Big-O. It proves you understand the problem and gives you a fallback.`,`**Optimise (5–10 min).** Find the bottleneck ("the inner loop is a search") and match it to a pattern (see the table below). Agree on the approach with the interviewer **before** coding.`,`**Code (15–20 min).** Write clean code with good names and small helpers. Narrate what each block does.`,`**Test (3–5 min).** Trace your example through the code line by line, then edge cases. Fix bugs calmly and explain them.`,`**Complexity and follow-ups.** State time and space with a one-line reason, and mention what you would change for bigger inputs or streaming data.`]},{type:`heading3`,text:`Cue → pattern cheat sheet`},{type:`bullets`,items:[`"Have I seen it / find a complement" → **hash map or Set**.`,`Sorted input, pairs, in-place → **two pointers**.`,`Contiguous substring or subarray → **sliding window** or **prefix sums**.`,`Sorted data or a monotonic yes/no → **binary search** (also on the answer).`,`Nesting, "most recent", next greater → **stack** / monotonic stack.`,`Ranges, meetings → **sort by start, then sweep**.`,`Top K, running median, merge K lists → **heap**.`,`Grids, components, shortest steps → **BFS / DFS**; dependencies → **topological sort**.`,`Min/max/count over choices with repeated subproblems → **dynamic programming**.`,`All combinations / permutations, n ≤ 20 → **backtracking**.`]},{type:`heading3`,text:`How to communicate while coding`},{type:`bullets`,items:[`**Think aloud, but in headlines:** "Now I build the frequency map", not every keystroke.`,'**Say the invariant** of each loop: "everything left of `write` is unique".',`**Flag shortcuts openly:** "I will assume the input is valid and add validation later if we have time".`,"**Stub helpers** (`isValid(r, c)`) to keep the main flow readable and fill them in afterwards.",`**When stuck, say what you are trying:** "a hash map gives O(n) but I still need the order... maybe sort first". Interviewers can only give hints if they know where you are.`,`**Accept hints gracefully** and build on them; arguing costs more than a missed idea.`]},{type:`paragraph`,text:'A good test pass is concrete. For example, for Two Sum with `[3, 2, 4]`, target 6: "i = 0 stores 3; i = 1 stores 2; i = 2 needs 2, found at index 1, returns [1, 2]. For [3, 3] the check happens before insert, so we do not pair index 0 with itself."'},{type:`heading3`,text:`Edge cases to always consider`},{type:`bullets`,items:[`Empty input, a single element, two elements.`,`All duplicates, all the same, already sorted, reverse sorted.`,"Negative numbers, zero, very large values (overflow, `Number.MAX_SAFE_INTEGER`).",`No valid answer: what do we return?`]},{type:`callout`,variant:`warning`,text:`The most common failure is starting to code in the first two minutes. You end up rewriting halfway through, under time pressure, with no agreed plan. Five minutes of clarifying and planning almost always saves ten minutes of debugging.`},{type:`callout`,variant:`tip`,text:`Interview tip: if time is running out, finish a working brute force rather than leaving an optimal solution half-written. Then explain in words how you would optimise it. Working code plus a clear plan scores better than broken clever code.`},{type:`heading3`,text:`Similar problems`},{type:`bullets`,items:[`Practise the framework on Two Sum, Valid Parentheses and Merge Intervals until it is automatic.`,`Then try unseen mediums under a 35-minute timer, saying every step out loud.`,`Review: after each problem, write down which cue pointed to the pattern.`]}]}};export{e as answers};