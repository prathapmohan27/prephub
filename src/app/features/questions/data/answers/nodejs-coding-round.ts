import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'implement-promise-all': {
    summary:
      "I return a new Promise, wrap every input in `Promise.resolve` so plain values and thenables work too, and store each result at its original index so the output keeps input order, not finish order. I keep a counter of pending inputs and resolve when it hits zero; the first rejection rejects the whole thing. An empty input resolves immediately with `[]`. That's O(n) time and O(n) space.",
    details: [
      {
        type: 'paragraph',
        text: 'Start by saying out loud what `Promise.all` guarantees, because each guarantee becomes a line of code: (1) it accepts any iterable, not just arrays; (2) items can be plain values, promises or thenables; (3) results come back in **input order**; (4) it rejects with the **first** rejection reason and ignores everything after it; (5) an empty iterable resolves immediately with `[]`.',
      },
      { type: 'heading3', text: 'Solution' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function promiseAll<T>(values: Iterable<T>): Promise<Awaited<T>[]> {
  return new Promise((resolve, reject) => {
    const items = Array.from(values);
    const results: Awaited<T>[] = new Array(items.length);
    let remaining = items.length;

    if (remaining === 0) {
      resolve(results); // Promise.all([]) resolves immediately with []
      return;
    }

    items.forEach((item, index) => {
      // Promise.resolve handles plain values, native promises and thenables
      Promise.resolve(item).then(
        (value) => {
          results[index] = value as Awaited<T>; // keep input order, not completion order
          remaining -= 1;
          if (remaining === 0) resolve(results);
        },
        reject, // first rejection wins; later settles are ignored by the promise
      );
    });
  });
}`,
      },
      { type: 'heading3', text: 'Why each line is there' },
      {
        type: 'bullets',
        items: [
          '**`Array.from(values)`** — supports any iterable (Set, generator) and gives us `length` up front.',
          '**`results[index] = value`** — the most common bug is `results.push(value)`, which stores results in completion order. Writing by index keeps input order.',
          '**A counter, not `results.length`** — a sparse array with a value at index 5 already has length 6, so length cannot tell you how many have finished.',
          '**`Promise.resolve(item)`** — turns plain values (`42`) and foreign thenables into real promises, so one code path handles all of them.',
          '**Passing `reject` directly** — a promise can only settle once, so later rejections (or resolves) are silently ignored. No extra "done" flag needed.',
          '**Empty input** — without the early check the counter never reaches zero and the promise hangs forever.',
        ],
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const delay = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const results = await promiseAll([delay(30, 'slow'), delay(10, 'fast'), 42]);
console.log(results); // ['slow', 'fast', 42] — input order, not finish order

console.log(await promiseAll([])); // [] — resolves immediately

await promiseAll([delay(10, 'a'), Promise.reject(new Error('boom'))]).catch((error: Error) => {
  console.log(error.message); // 'boom' — rejects as soon as any input rejects
});`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Time:** O(n) to attach handlers, plus O(1) work per settled input. Wall-clock time is the slowest input (they all run concurrently) — or the first rejection.',
          '**Space:** O(n) for the copied input and the results array.',
        ],
      },
      { type: 'heading3', text: 'Edge cases to mention' },
      {
        type: 'bullets',
        items: [
          'Empty iterable → resolves with `[]` (handled explicitly).',
          'Non-promise values → passed through as-is via `Promise.resolve`.',
          'A rejection does **not** cancel the other work — promises are not cancellable. If you need cancellation, pass an `AbortSignal` into the tasks and abort it in the rejection handler.',
          'Multiple rejections → only the first one is reported; the others are handled (no "unhandled rejection" warning) because we attached a handler to every input.',
          'Input order vs completion order → covered by writing by index.',
        ],
      },
      { type: 'heading3', text: 'Follow-up: allSettled, race and any' },
      {
        type: 'paragraph',
        text: 'Interviewers almost always ask for a sibling next. `allSettled` can reuse `promiseAll` by mapping every input to a promise that never rejects:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `function promiseAllSettled<T>(values: Iterable<T>): Promise<PromiseSettledResult<Awaited<T>>[]> {
  return promiseAll(
    Array.from(values, (item) =>
      Promise.resolve(item).then(
        (value) => ({ status: 'fulfilled', value }) as const,
        (reason: unknown) => ({ status: 'rejected', reason }) as const,
      ),
    ),
  );
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `function promiseRace<T>(values: Iterable<T>): Promise<Awaited<T>> {
  return new Promise((resolve, reject) => {
    for (const item of values) Promise.resolve(item).then(resolve, reject);
  });
}

function promiseAny<T>(values: Iterable<T>): Promise<Awaited<T>> {
  return new Promise((resolve, reject) => {
    const items = Array.from(values);
    const errors: unknown[] = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return reject(new AggregateError([], 'All promises were rejected'));
    items.forEach((item, index) => {
      Promise.resolve(item).then(resolve, (reason: unknown) => {
        errors[index] = reason;
        if (--remaining === 0) reject(new AggregateError(errors, 'All promises were rejected'));
      });
    });
  });
}`,
      },
      {
        type: 'bullets',
        items: [
          '**`all`** — all fulfil → array of values; any rejects → reject fast. Use when every result is required.',
          '**`allSettled`** — never rejects; returns `{ status, value | reason }` per input. Use for "fire N requests and report which failed".',
          '**`race`** — settles like the first input to settle (fulfil **or** reject). Classic use: a timeout race. Note `race([])` stays pending forever.',
          '**`any`** — first **fulfilment** wins; rejects with an `AggregateError` only if all reject (or the input is empty). Use for "fastest healthy replica".',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: list the guarantees before you type (iterable, values, input order, first rejection, empty input), then point at the line that handles each one. Calling out "push would break ordering" and "empty input would hang" is what separates a memorised answer from an understood one.',
      },
    ],
  },

  'implement-retry-with-backoff-and-jitter': {
    summary:
      "I wrap the async function in a loop: try it, and on failure check whether the error is retryable and whether attempts remain; if so, wait and try again, otherwise rethrow the last error. The wait doubles each time — `base * 2^attempt`, capped at a maximum — and I add full jitter by picking a random delay between 0 and that cap so many clients don't retry in lockstep. I also accept an `AbortSignal` so the caller can cancel both the attempts and the waits.",
    details: [
      {
        type: 'paragraph',
        text: 'Clarify first: how many attempts? Which errors are worth retrying? Is the operation idempotent (safe to run twice)? Is there an overall deadline? Those answers become the options object. Retrying a non-idempotent `POST /payments` without an idempotency key can charge a customer twice — say that out loud.',
      },
      { type: 'heading3', text: 'Solution' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { setTimeout as sleep } from 'node:timers/promises';

interface RetryOptions {
  retries?: number; // extra attempts after the first one
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

async function retry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 100,
    maxDelayMs = 10_000,
    signal,
    shouldRetry = () => true,
    onRetry,
  } = options;

  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (error) {
      const isLastAttempt = attempt >= retries;
      if (isLastAttempt || !shouldRetry(error, attempt)) throw error;

      // Exponential backoff capped at maxDelayMs, then "full jitter":
      // pick a random delay in [0, cap] so many clients don't retry in lockstep.
      const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delayMs = Math.round(Math.random() * cap);
      onRetry?.(error, attempt + 1, delayMs);

      await sleep(delayMs, undefined, { signal }); // rejects with AbortError if aborted while waiting
    }
  }
}`,
      },
      { type: 'heading3', text: 'Which errors are retryable?' },
      {
        type: 'paragraph',
        text: 'Retry **transient** failures only. A 400 or 404 will fail the same way every time, so retrying just adds latency and load.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Typical "is this retryable?" policy for HTTP calls
class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_SOCKET']);

function isRetryable(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 408 || error.status === 429 || error.status >= 500; // never retry other 4xx
  }
  if (!(error instanceof Error)) return false;
  if (error.name === 'TimeoutError') return true; // a per-attempt AbortSignal.timeout() fired
  // Socket-level errors; fetch() wraps them as TypeError('fetch failed') with the real error in .cause
  const code = (error as NodeJS.ErrnoException).code ?? (error.cause as NodeJS.ErrnoException | undefined)?.code;
  return code !== undefined && RETRYABLE_CODES.has(code);
}`,
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const user = await retry(
  async () => {
    // Per-attempt timeout so one hung request can't eat the whole budget
    const res = await fetch('https://api.example.com/users/42', { signal: AbortSignal.timeout(2_000) });
    if (!res.ok) throw new HttpError(res.status, \`GET /users/42 failed with \${res.status}\`);
    return res.json();
  },
  {
    retries: 4,
    baseDelayMs: 200,
    shouldRetry: isRetryable,
    signal: AbortSignal.timeout(10_000), // overall budget across all attempts
    onRetry: (error, attempt, delayMs) => console.warn(\`attempt \${attempt} failed, retrying in \${delayMs}ms\`, error),
  },
);`,
      },
      { type: 'heading3', text: 'Why jitter matters' },
      {
        type: 'paragraph',
        text: 'If a database blips and 1,000 clients all fail at the same moment, plain exponential backoff makes them all retry at exactly 100 ms, then 200 ms, then 400 ms — synchronised waves that knock the recovering service over again (a "thundering herd"). Full jitter spreads those retries randomly across the whole window, so load arrives smoothly.',
      },
      {
        type: 'bullets',
        items: [
          '**No jitter:** `delay = min(max, base * 2^n)` — predictable, but clients stay in sync.',
          "**Full jitter (used above):** `delay = random(0, min(max, base * 2^n))` — AWS's well-known backoff study found it gives the lowest total load.",
          '**Equal jitter:** `delay = cap/2 + random(0, cap/2)` — guarantees some minimum wait.',
          '**Respect `Retry-After`:** if a 429/503 response tells you when to come back, use that instead of your own delay.',
        ],
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Time:** at most `retries + 1` calls; worst-case total wait is the sum of the caps, about `base * (2^(retries+1) - 1)` (bounded by `maxDelayMs` per wait).',
          '**Space:** O(1) — the loop keeps no history.',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          '`retries: 0` → runs once and rethrows; the loop handles it without a special case.',
          'Non-retryable error → rethrown immediately, after one call.',
          'Exhausted retries → the **last** error is rethrown (keep the original error; do not wrap it in a generic "retry failed" and lose the stack).',
          'Already-aborted signal → `throwIfAborted()` throws before the first call.',
          'Abort during a wait → `setTimeout` from `node:timers/promises` rejects with `AbortError` immediately, so cancellation is not delayed by a 10-second backoff.',
          'Synchronous throw inside `fn` → still caught, because `await fn()` sits inside the `try`.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '**Per-attempt vs overall timeout:** use `AbortSignal.timeout()` per attempt inside `fn`, and pass an overall signal to `retry` (combine them with `AbortSignal.any([a, b])`).',
          '**Retry budgets / circuit breakers:** if 50% of calls are failing, retrying everything doubles load. A circuit breaker stops calling a dead dependency for a while.',
          '**Where to retry:** retry at one layer only. If the client, the gateway and the service each retry 3 times, one failure becomes 64 calls.',
          '**Observability:** `onRetry` is where you log or emit a metric — silent retries hide real incidents.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: before writing the loop, ask "is the operation idempotent?" and "which errors are transient?". Then mention thundering herd as the reason for jitter. Those two questions show production experience more than the backoff formula does.',
      },
    ],
  },

  'implement-a-promise-pool': {
    summary:
      'I take an array of task functions — not promises, because a promise is already running once it exists — and start N workers. Each worker loops: grab the next unclaimed index, await that task, store the result at that index, repeat until none are left. `Promise.all` over the workers tells me when everything is done, results stay in input order because I write by index, and the first failure rejects the whole pool. O(n) time overhead and O(n + N) space.',
    details: [
      {
        type: 'paragraph',
        text: 'Real use cases: call an API that allows 5 concurrent requests, resize 10,000 images without opening 10,000 file handles, or migrate rows without exhausting the database pool. Clarify: should results keep input order? Should one failure stop everything (fail fast) or should we collect all outcomes?',
      },
      { type: 'heading3', text: 'Solution — worker loop' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Task<T> = () => Promise<T>;

async function promisePool<T>(tasks: readonly Task<T>[], concurrency: number): Promise<T[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError('concurrency must be a positive integer');
  }
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  // Each worker pulls the next task index until none are left.
  // JS is single-threaded, so \`nextIndex++\` cannot race between workers.
  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index](); // store by index → input order preserved
    }
  }

  const workerCount = Math.min(concurrency, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, worker)); // rejects on first failure
  return results;
}`,
      },
      {
        type: 'paragraph',
        text: "Why the shared `nextIndex` is safe: JavaScript runs one piece of code at a time. Between reading `nextIndex` and incrementing it there's no `await`, so no other worker can run in between. Workers only interleave at the `await`.",
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const ids = Array.from({ length: 100 }, (_, i) => i + 1);

// Build task FUNCTIONS, not promises — a promise starts running the moment it's created
const tasks = ids.map((id) => () => fetch(\`https://api.example.com/items/\${id}\`).then((res) => res.json()));

const items = await promisePool(tasks, 5); // at most 5 requests in flight
console.log(items.length); // 100, in the same order as ids`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Time:** O(n) bookkeeping. Wall-clock time is roughly `total work / N` when tasks are similar in length.',
          '**Space:** O(n) for results + O(N) for in-flight workers.',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Empty task list → zero workers, resolves with `[]`.',
          '`concurrency` larger than the task count → capped with `Math.min`, no idle workers.',
          '`concurrency` of 0, negative or a fraction → throw a `RangeError`; with 0 the pool would "finish" without running anything.',
          'A task that throws synchronously → it is called inside an `async` function, so the throw becomes a rejection like any other.',
          'Fail fast caveat: after the first rejection, `Promise.all` rejects, but the **other workers keep pulling tasks** in the background. That is the follow-up below.',
        ],
      },
      { type: 'heading3', text: 'Follow-up: collect every result instead of failing' },
      {
        type: 'code',
        lang: 'typescript',
        code: `async function promisePoolSettled<T>(tasks: readonly Task<T>[], concurrency: number): Promise<PromiseSettledResult<T>[]> {
  return promisePool(
    tasks.map((task) => () =>
      task().then(
        (value): PromiseSettledResult<T> => ({ status: 'fulfilled', value }),
        (reason: unknown): PromiseSettledResult<T> => ({ status: 'rejected', reason }),
      ),
    ),
    concurrency,
  );
}`,
      },
      { type: 'heading3', text: 'Follow-up: truly fail fast, with cancellation' },
      {
        type: 'paragraph',
        text: 'To stop new tasks from starting after a failure — and cancel the ones in flight — share an `AbortController`. Workers check it before taking the next task, and each task receives the signal so it can pass it to `fetch` or a stream.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `async function promisePoolFailFast<T>(
  tasks: readonly ((signal: AbortSignal) => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const controller = new AbortController();
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length && !controller.signal.aborted) {
      const index = nextIndex++;
      try {
        results[index] = await tasks[index](controller.signal);
      } catch (error) {
        controller.abort(error); // stop other workers from starting new tasks + cancel in-flight ones
        throw error;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}`,
      },
      { type: 'heading3', text: 'Other follow-ups' },
      {
        type: 'bullets',
        items: [
          '**"Why not chunk into batches of N with `Promise.all`?"** — batching waits for the slowest task in each batch before starting the next one, so slots sit idle. The worker loop refills a slot the moment it frees up.',
          '**Streaming / unknown length:** accept an async iterable instead of an array; workers pull with `await iterator.next()`. Node streams give you this for free with `readable.map(fn, { concurrency: N })`.',
          '**Libraries:** `p-limit` and `p-map` do exactly this in production code.',
          '**Rate vs concurrency:** a pool limits how many run **at once**; it does not limit requests per second. For that you need a rate limiter (token bucket).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say early that the input must be functions, not promises, because `[fetch(a), fetch(b)]` has already started every request. Then explain why the worker loop beats batching. Interviewers listen for both points.',
      },
    ],
  },

  'implement-an-lru-cache': {
    summary:
      "An LRU cache needs two things in O(1): look up a key, and know which key was used least recently. In JavaScript a `Map` gives both, because it remembers insertion order — on every `get` or `put` I delete the key and re-insert it to move it to the newest end, and when I'm over capacity I evict `map.keys().next().value`, the oldest. The classic language-neutral answer is a hash map pointing into a doubly linked list, and I can write that too.",
    details: [
      {
        type: 'paragraph',
        text: '"Least recently used" means the entry that has gone longest without being read **or** written. Both `get` and `put` count as a use. Clarify: what should `get` return on a miss (`undefined` vs `-1` on LeetCode)? Does updating an existing key count as a use? (Yes, normally.)',
      },
      { type: 'heading3', text: 'Solution 1 — Map (idiomatic JavaScript)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `class LRUCache<K, V> {
  private readonly cache = new Map<K, V>();
  private readonly capacity: number;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be >= 1');
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key) as V;
    // Re-insert to move the key to the "most recently used" end
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      // A Map iterates in insertion order, so the first key is the least recently used
      const oldestKey = this.cache.keys().next().value as K;
      this.cache.delete(oldestKey);
    }
  }

  get size(): number {
    return this.cache.size;
  }
}`,
      },
      {
        type: 'paragraph',
        text: '`Map` iteration order is guaranteed by the spec to be insertion order, and deleting then re-setting a key moves it to the end. `delete`, `set` and `keys().next()` are all O(1) on average. The `has` check before reading matters: a stored value could itself be `undefined` or `0`, so `if (!value)` would be a bug.',
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const cache = new LRUCache<string, number>(2);
cache.put('a', 1);
cache.put('b', 2);
cache.get('a');                    // 1 — 'a' is now the most recently used
cache.put('c', 3);                 // over capacity → evicts 'b' (least recently used)
console.log(cache.get('b'));       // undefined
console.log(cache.get('a'), cache.get('c')); // 1 3`,
      },
      { type: 'heading3', text: 'Solution 2 — hash map + doubly linked list (the classic answer)' },
      {
        type: 'paragraph',
        text: 'Many interviewers will say "nice, now do it without relying on Map ordering", because that is the answer in Java, C++ or Go. The idea: a doubly linked list keeps entries ordered from most to least recently used, and a hash map points from key to list node. With the node in hand, unlinking it and moving it to the front is O(1) because it knows its own `prev` and `next`.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface ListNode<K, V> {
  key: K;
  value: V;
  prev: ListNode<K, V> | null;
  next: ListNode<K, V> | null;
}

class LinkedLRUCache<K, V> {
  private readonly map = new Map<K, ListNode<K, V>>();
  // Sentinel head/tail nodes remove all the null checks at the ends
  private readonly head: ListNode<K, V>;
  private readonly tail: ListNode<K, V>;
  private readonly capacity: number;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be >= 1');
    this.capacity = capacity;
    this.head = { key: undefined as K, value: undefined as V, prev: null, next: null };
    this.tail = { key: undefined as K, value: undefined as V, prev: this.head, next: null };
    this.head.next = this.tail;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.unlink(node);
    this.addToFront(node); // most recently used lives right after head
    return node.value;
  }

  put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.unlink(existing);
      this.addToFront(existing);
      return;
    }
    const node: ListNode<K, V> = { key, value, prev: null, next: null };
    this.map.set(key, node);
    this.addToFront(node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev as ListNode<K, V>; // least recently used lives right before tail
      this.unlink(lru);
      this.map.delete(lru.key); // this is why the node stores its key
    }
  }

  private unlink(node: ListNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private addToFront(node: ListNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Why doubly linked?** To unlink a node in O(1) you need its predecessor. A singly linked list would need an O(n) walk to find it.',
          '**Why sentinels?** Dummy `head` and `tail` nodes mean the list is never empty, so `unlink` and `addToFront` have no special cases for the first or last element.',
          '**Why store the key in the node?** When you evict the tail node you must also delete it from the hash map, and the node is all you have.',
        ],
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Time:** `get` and `put` are O(1) on average in both versions (hash lookup + constant pointer or Map updates).',
          '**Space:** O(capacity). The linked-list version uses more memory per entry (two pointers + a node object).',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Capacity 0 or negative → reject in the constructor (or make every `put` a no-op — ask).',
          'Capacity 1 → every new key evicts the previous one.',
          '`put` on an existing key → update the value **and** mark it as most recent; it must not trigger an eviction.',
          'Falsy values (`0`, `""`, `undefined`) → use `has`, never truthiness, to detect a hit.',
          'Object keys → `Map` compares by reference, so two equal-looking objects are different keys.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '**TTL:** store `expiresAt` with each value and treat expired entries as misses on `get` (lazy expiry), plus an occasional sweep.',
          '**Size by bytes, not count:** track a running `totalSize` and evict in a loop until it is under the limit — this is what `lru-cache` on npm offers with `maxSize`.',
          '**Multiple Node processes:** each process has its own in-memory cache. For a shared cache use Redis, which has `maxmemory-policy allkeys-lru` (an approximate LRU).',
          '**Thread safety:** not an issue in single-threaded Node; in Java you would need locks or `ConcurrentHashMap`.',
          '**LFU:** evict the least **frequently** used instead — needs frequency buckets, a common harder follow-up.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: lead with the Map version and explain why it is O(1) — insertion order is a spec guarantee — then offer the linked-list version before they ask. Showing you know both, and why the list must be doubly linked, covers every way this question is graded.',
      },
    ],
  },

  'implement-an-eventemitter': {
    summary:
      "I keep a `Map` from event name to an array of listener records. `on` pushes a record, `once` pushes one flagged `once`, `off` removes the matching listener, and `emit` calls each listener with the arguments in order. The two details that matter are: `emit` iterates over a **copy** of the array so listeners added or removed during an emit don't break the loop, and a `once` listener is removed **before** it is called. Like Node, emitting `error` with no listener throws.",
    details: [
      {
        type: 'paragraph',
        text: "Clarify the contract: should methods be chainable (Node's are)? Does `emit` return anything (Node returns `true` if there were listeners)? Can the same function be registered twice (Node allows it, and calls it twice)? What about the special `error` event?",
      },
      { type: 'heading3', text: 'Solution' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Listener = (...args: any[]) => void;

interface Registration {
  listener: Listener;
  once: boolean;
}

class MyEventEmitter {
  private readonly events = new Map<string | symbol, Registration[]>();

  on(event: string | symbol, listener: Listener): this {
    const list = this.events.get(event) ?? [];
    list.push({ listener, once: false });
    this.events.set(event, list);
    return this; // chainable, like Node's emitter
  }

  once(event: string | symbol, listener: Listener): this {
    const list = this.events.get(event) ?? [];
    list.push({ listener, once: true });
    this.events.set(event, list);
    return this;
  }

  off(event: string | symbol, listener: Listener): this {
    const list = this.events.get(event);
    if (!list) return this;
    // Remove only the most recently added match, like Node does
    this.removeAt(event, list, list.findLastIndex((r) => r.listener === listener));
    return this;
  }

  emit(event: string | symbol, ...args: unknown[]): boolean {
    const list = this.events.get(event);

    if (!list || list.length === 0) {
      // Node's convention: an unhandled 'error' event throws
      if (event === 'error') {
        throw args[0] instanceof Error ? args[0] : new Error(\`Unhandled error: \${String(args[0])}\`);
      }
      return false;
    }

    // Snapshot: listeners added or removed during this emit don't affect this round
    for (const registration of [...list]) {
      // Remove a once-listener BEFORE calling it, so a re-entrant emit can't fire it twice
      if (registration.once) this.removeAt(event, list, list.indexOf(registration));
      registration.listener.apply(this, args);
    }
    return true;
  }

  private removeAt(event: string | symbol, list: Registration[], index: number): void {
    if (index === -1) return;
    list.splice(index, 1);
    if (list.length === 0) this.events.delete(event);
  }

  listenerCount(event: string | symbol): number {
    return this.events.get(event)?.length ?? 0;
  }
}`,
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const orders = new MyEventEmitter();

const logOrder = (id: string, total: number) => console.log(\`order \${id}: \${total}\`);
orders.on('created', logOrder);
orders.once('created', () => console.log('first order ever!'));

orders.emit('created', 'A1', 250); // order A1: 250, first order ever!
orders.emit('created', 'A2', 99);  // order A2: 99   (once listener is gone)

orders.off('created', logOrder);
console.log(orders.emit('created', 'A3', 10)); // false — nobody is listening

orders.on('error', (err: Error) => console.error('handled:', err.message));
orders.emit('error', new Error('payment failed')); // handled: payment failed (no throw)`,
      },
      { type: 'heading3', text: 'The tricky parts' },
      {
        type: 'bullets',
        items: [
          '**Removing during emit:** if listener A calls `off` on itself while we loop over the live array, `splice` shifts everything left and listener B is skipped. Looping over `[...list]` (a snapshot) fixes it. Node does the same thing.',
          '**`once` removal order:** remove first, then call. If the listener emits the same event again (re-entrancy), it must not fire a second time.',
          '**`once` + `off`:** storing records `{ listener, once }` instead of wrapper functions means `off(event, originalFn)` can remove a `once` listener before it fires. (Node wraps it and keeps a `.listener` property on the wrapper for the same reason.)',
          '**`error` event:** Node throws if `error` is emitted with no listener, which crashes the process. That is deliberate — an ignored error is worse than a crash. Always attach `error` handlers to streams, sockets and emitters.',
          '**Synchronous calls:** listeners run synchronously, in registration order, inside `emit`. A slow listener blocks the emitter and everything after it.',
        ],
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**`on` / `once`:** O(1) amortised.',
          '**`off`:** O(k), where k is the number of listeners for that event.',
          '**`emit`:** O(k) to copy and call the listeners (plus O(k) per `once` removal, which is fine for small k).',
          '**Space:** O(total listeners).',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Emitting an event with no listeners → returns `false`, no error (except `error`).',
          '`off` with a listener that was never added → no-op.',
          'Same function added twice → called twice; `off` removes one registration (the last one, matching Node).',
          'Removing the last listener → delete the map key so empty arrays do not pile up.',
          'A listener that throws → the exception propagates out of `emit` and later listeners do not run (same as Node).',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '**Memory leaks:** Node warns when more than 10 listeners are added to one event (`setMaxListeners`). Forgetting `off` in a long-lived emitter is a classic leak.',
          '**Awaiting an event:** `await once(emitter, "ready")` from `node:events` returns a promise; `on(emitter, "data")` gives an async iterator.',
          '**Typed events:** a generic `Emitter<{ created: [id: string, total: number] }>` lets TypeScript check event names and argument types.',
          '**`prependListener`, `removeAllListeners`, `listenerCount`:** easy extensions of the same Map.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: once the basic version works, ask "what if a listener removes itself during emit?" yourself and fix it with the snapshot. Raising the re-entrancy bug before the interviewer does is the strongest signal in this question.',
      },
    ],
  },

  'implement-promisify': {
    summary:
      "`promisify` takes a function whose last argument is an error-first callback `(err, result)` and returns a new function that returns a Promise. Inside, I call the original with the caller's arguments plus my own callback, and that callback rejects if `err` is set or resolves with `result`. I forward `this` so methods still work, and I honour the `util.promisify.custom` symbol so a function can supply its own promise version, like Node does.",
    details: [
      {
        type: 'paragraph',
        text: 'The Node callback convention: the callback is the **last** argument, its **first** parameter is an error (or `null`), and the result comes second. `promisify` only works for functions that follow it exactly — `setTimeout(cb, ms)` (callback first) and event-based APIs do not.',
      },
      { type: 'heading3', text: 'Solution' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Callback<T> = (error: unknown, result?: T) => void;

const kCustomPromisify = Symbol.for('nodejs.util.promisify.custom'); // same symbol as util.promisify.custom

function promisify<Args extends unknown[], T>(
  fn: (...args: [...Args, Callback<T>]) => void,
): (...args: Args) => Promise<T> {
  // Respect a hand-written promise version if the function provides one
  const custom = (fn as unknown as Record<symbol, unknown>)[kCustomPromisify];
  if (typeof custom === 'function') return custom as (...args: Args) => Promise<T>;

  return function (this: unknown, ...args: Args): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Append our own error-first callback as the last argument
      fn.call(this, ...args, (error: unknown, result?: T) => {
        if (error) reject(error);
        else resolve(result as T);
      });
    });
  };
}`,
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { readFile } from 'node:fs';

function divide(a: number, b: number, callback: Callback<number>): void {
  setImmediate(() => (b === 0 ? callback(new Error('Division by zero')) : callback(null, a / b)));
}

const divideAsync = promisify(divide);
console.log(await divideAsync(10, 2)); // 5
await divideAsync(1, 0).catch((error: Error) => console.log(error.message)); // 'Division by zero'

const readFileAsync = promisify<[string, BufferEncoding], string>(readFile);
const text = await readFileAsync(import.meta.filename, 'utf8');
console.log(text.length > 0); // true`,
      },
      { type: 'heading3', text: 'Details worth explaining' },
      {
        type: 'bullets',
        items: [
          '**`function`, not an arrow:** an arrow would capture `this` from `promisify` itself. A regular function lets `promisified.call(obj, ...)` or `obj.method = promisify(obj.method)` keep the right receiver.',
          '**A sync throw becomes a rejection:** because `fn.call` runs inside the Promise executor, a function that throws instead of calling back still rejects the promise rather than crashing the caller.',
          '**Callback called twice:** a buggy function might call back twice; the second call is ignored because a promise can only settle once.',
          '**`if (error)`:** matches Node — a falsy error (`null`/`undefined`) means success.',
        ],
      },
      { type: 'heading3', text: 'The built-in: util.promisify and the custom symbol' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { promisify } from 'node:util';
import { lookup } from 'node:dns';

const sleep = promisify(setTimeout); // works because setTimeout has a [promisify.custom] version
await sleep(100);

const lookupAsync = promisify(lookup); // custom version resolves { address, family }, not just address
console.log(await lookupAsync('localhost')); // e.g. { address: '::1', family: 6 }

function legacyGreet(name: string, callback: (error: Error | null, message?: string) => void): void {
  callback(null, \`hello \${name}\`);
}
// Provide your own promise version; promisify() returns it as-is
Object.defineProperty(legacyGreet, promisify.custom, {
  value: async (name: string) => \`hello \${name} (custom)\`,
});
console.log(await promisify(legacyGreet)('Ana')); // 'hello Ana (custom)'`,
      },
      {
        type: 'bullets',
        items: [
          '**`util.promisify.custom`:** some functions do not fit the pattern, so they attach a ready-made promise version under this symbol and `util.promisify` returns it instead. `setTimeout` does this — that is why `promisify(setTimeout)(100)` works even though its callback is the first argument. My version checks the same symbol (`Symbol.for("nodejs.util.promisify.custom")` is the identical, globally registered symbol).',
          '**Multiple result values:** callbacks like `dns.lookup(host, (err, address, family) => ...)` pass more than one result. A naive promisify keeps only the first; Node uses `custom` to resolve `{ address, family }` instead.',
          '**Prefer native promise APIs today:** `node:fs/promises`, `node:timers/promises`, `node:stream/promises`, `node:dns/promises`. Reach for `promisify` only for old libraries.',
          '**`util.callbackify`** goes the other way: turns an async function back into a callback-style one.',
        ],
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'paragraph',
        text: 'O(1) per call on top of the wrapped function (one Promise and one closure). Space is O(1) apart from the arguments array.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: write the core in five lines first, then add the two upgrades interviewers look for — preserving `this` with a regular function, and the `util.promisify.custom` escape hatch (with `setTimeout` as the example). Mention that new code should just use the `/promises` modules.',
      },
    ],
  },

  'implement-token-bucket-middleware': {
    summary:
      "Each client — usually keyed by IP or user ID — gets a bucket that holds up to `capacity` tokens and refills at a steady rate. Every request costs one token: if one is available I take it and call `next()`, otherwise I respond 429 with a `Retry-After` header. I don't need a timer per bucket — I refill lazily on each request from the time since the last refill. Buckets live in a `Map` for one process; with several instances the state moves to Redis with an atomic Lua script.",
    details: [
      {
        type: 'paragraph',
        text: 'Token bucket allows short **bursts** (up to `capacity`) while enforcing an average **rate** (`refillPerSecond`). Clarify: what is the key (IP, API key, user ID)? What are the burst size and sustained rate? One server or many? Should limited requests get 429 or be queued?',
      },
      { type: 'heading3', text: 'Solution' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import type { Request, Response, NextFunction, RequestHandler } from 'express';

interface TokenBucketOptions {
  capacity: number; // max burst size
  refillPerSecond: number; // sustained rate
  keyFn?: (req: Request) => string; // who is being limited
  now?: () => number; // injectable clock for tests
}

interface Bucket {
  tokens: number;
  lastRefill: number; // ms timestamp
}

function tokenBucketLimiter(options: TokenBucketOptions): RequestHandler {
  const { capacity, refillPerSecond, keyFn = (req) => req.ip ?? 'unknown', now = Date.now } = options;
  const buckets = new Map<string, Bucket>();

  // Evict idle buckets so memory doesn't grow with every IP ever seen.
  // A bucket idle long enough to be full again is identical to a fresh one.
  const fullAfterMs = (capacity / refillPerSecond) * 1000;
  const sweeper = setInterval(() => {
    const t = now();
    for (const [key, bucket] of buckets) {
      if (t - bucket.lastRefill > fullAfterMs) buckets.delete(key);
    }
  }, 60_000);
  sweeper.unref(); // don't keep the process alive just for cleanup

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);
    const t = now();
    const bucket = buckets.get(key) ?? { tokens: capacity, lastRefill: t };

    // Lazy refill: add tokens for the time elapsed since we last looked
    const elapsedSeconds = (t - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillPerSecond);
    bucket.lastRefill = t;
    buckets.set(key, bucket);

    res.setHeader('RateLimit-Limit', String(capacity));

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      res.setHeader('RateLimit-Remaining', String(Math.floor(bucket.tokens)));
      return next();
    }

    const retryAfterSeconds = Math.ceil((1 - bucket.tokens) / refillPerSecond);
    res.setHeader('RateLimit-Remaining', '0');
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({ error: 'Too Many Requests', retryAfterSeconds });
  };
}`,
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import express from 'express';

const app = express();
app.set('trust proxy', 1); // behind one load balancer: req.ip is the real client IP
app.use(express.json());

// Global: bursts of up to 100 requests, 10 req/s sustained, per IP
app.use(tokenBucketLimiter({ capacity: 100, refillPerSecond: 10 }));

// Login: 5 attempts per account, then one more every 12 seconds
const loginLimiter = tokenBucketLimiter({
  capacity: 5,
  refillPerSecond: 1 / 12,
  keyFn: (req) => \`login:\${String(req.body?.email ?? req.ip)}\`,
});
app.post('/login', loginLimiter, (_req, res) => {
  res.json({ ok: true });
});

app.listen(3000);`,
      },
      { type: 'heading3', text: 'How the lazy refill works' },
      {
        type: 'paragraph',
        text: 'With capacity 3 and 1 token/second: a client fires 3 requests instantly (bucket 3 → 0), the 4th gets 429 with `Retry-After: 1`. Half a second later the bucket holds 0.5 tokens — still 429. After one full second it holds 1 token and the next request passes. After an idle minute the bucket is capped at 3, not 60. All of that comes from one line: `tokens = min(capacity, tokens + elapsed * rate)`.',
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Time:** O(1) per request (one Map lookup and some arithmetic). The sweep is O(buckets) once a minute.',
          '**Space:** O(active clients). Without the sweep, the Map grows with every IP ever seen — a memory leak an attacker can trigger by spoofing many IPs.',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          '**First request** from a new key → starts with a full bucket.',
          '**Clock:** uses `Date.now()`; injecting `now` makes tests deterministic. `performance.now()` avoids problems if the system clock jumps.',
          '**`req.ip` behind a proxy:** without `app.set("trust proxy", ...)`, every request looks like it comes from the load balancer and all users share one bucket. Trusting `X-Forwarded-For` blindly lets clients spoof it — trust only your known proxy hops.',
          '**Fractional tokens:** kept as a float so slow refill rates (1 per 12 s) work correctly.',
          '**Headers:** `Retry-After` tells well-behaved clients when to retry; `RateLimit-Limit`/`RateLimit-Remaining` follow the IETF draft that `express-rate-limit` also uses.',
        ],
      },
      { type: 'heading3', text: 'Follow-up: several server instances' },
      {
        type: 'paragraph',
        text: 'An in-memory Map is per process. With 4 instances behind a load balancer (or Node cluster workers) each one has its own buckets, so a client effectively gets 4× the limit. Move the state to a shared store:',
      },
      {
        type: 'bullets',
        items: [
          '**Redis hash per key** storing `tokens` and `lastRefill`, with a TTL so idle keys expire on their own (this replaces the sweep).',
          '**Atomicity:** read-refill-decrement must be one step, or two instances can both read "1 token left" and both allow the request. Do it in a Lua script run with `EVAL`/`EVALSHA` — Redis runs a script atomically.',
          "**Use the Redis clock** (`TIME` inside the script) rather than each app server's clock, so clock drift between servers does not matter.",
          '**Fail open or closed?** If Redis is down, decide whether to allow all traffic (availability) or reject it (protection) — and say which you would choose for this API.',
          '**In practice:** `express-rate-limit` with `rate-limit-redis`, or limit at the edge (Nginx `limit_req`, API gateway, Cloudflare) before traffic reaches Node.',
        ],
      },
      { type: 'heading3', text: 'Other algorithms interviewers compare' },
      {
        type: 'bullets',
        items: [
          '**Fixed window counter:** simplest (`INCR` + `EXPIRE`), but allows 2× the limit across a window boundary.',
          '**Sliding window log:** exact, but stores a timestamp per request — expensive.',
          '**Sliding window counter:** weighted mix of the current and previous window — a good approximation with O(1) memory.',
          '**Leaky bucket:** processes requests at a constant rate (smooths output); token bucket allows bursts.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain lazy refill ("no timers — compute tokens from elapsed time") before coding, then raise the multi-instance problem yourself: per-process Maps multiply the limit, so the state goes to Redis with an atomic Lua script. That is the system-design half of the question, and it is usually where the senior-level marks are.',
      },
    ],
  },

  'count-word-frequencies-with-streams': {
    summary:
      "I never load the whole file — I stream it. `fs.createReadStream` feeds `readline`, and I `for await` over the lines, splitting each line into words with a Unicode-aware regex and counting them in a `Map`. Memory is O(distinct words) instead of O(file size), and `for await` gives me backpressure for free because the stream pauses while I'm processing. At the end I sort the Map entries to get the top N.",
    details: [
      {
        type: 'paragraph',
        text: "Clarify: what counts as a word (case-insensitive? apostrophes? numbers? non-English letters)? Do we need all counts or just the top N? How big is the file — and how many **distinct** words, since that is what ends up in memory? `fs.readFileSync` on a 20 GB log would crash (or exceed V8's maximum string length) long before counting starts.",
      },
      { type: 'heading3', text: 'Solution — readline over a read stream' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const WORD = /[\\p{L}\\p{N}']+/gu; // letters, digits, apostrophes — Unicode aware

async function countWords(filePath: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const lines = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity, // treat \\r\\n as a single line break
  });

  // for await pulls one line at a time; the stream pauses while we're busy → backpressure
  for await (const line of lines) {
    for (const match of line.toLowerCase().matchAll(WORD)) {
      const word = match[0];
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return counts;
}

function topN(counts: Map<string, number>, n: number): [string, number][] {
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}`,
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const counts = await countWords(process.argv[2] ?? 'access.log');
console.log(\`\${counts.size} distinct words\`);
console.table(topN(counts, 10)); // [[word, count], ...] highest count first`,
      },
      { type: 'heading3', text: 'How the memory stays flat' },
      {
        type: 'bullets',
        items: [
          '`createReadStream` reads the file in chunks (64 KB by default) — only a few chunks are in memory at once.',
          '`readline` splits chunks into lines, handling lines that are cut in half across chunk boundaries.',
          '**Backpressure:** `for await` pulls one line at a time. While the loop body runs, no more is pulled, the internal buffer fills to its `highWaterMark`, and the stream stops reading from disk. Reading never outruns processing.',
          '`encoding: "utf8"` makes the stream decode bytes safely, so a multi-byte character like "é" split across two chunks is not corrupted.',
        ],
      },
      { type: 'heading3', text: 'Follow-up: what if the file has no newlines?' },
      {
        type: 'paragraph',
        text: 'A minified JSON file or a single 10 GB line would make `readline` buffer the whole thing as one "line". The fix is to process raw chunks and carry the partial word at the end of each chunk over to the next one. A `Writable` inside `pipeline` handles backpressure (calling `callback()` asks for the next chunk) and error propagation:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';

// Chunk-based version: works even if the file has no newlines (one giant line).
async function countWordsByChunk(filePath: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const decoder = new StringDecoder('utf8'); // never splits a multi-byte character
  let carry = ''; // partial word left at the end of the previous chunk

  const add = (text: string) => {
    for (const match of text.toLowerCase().matchAll(WORD)) {
      counts.set(match[0], (counts.get(match[0]) ?? 0) + 1);
    }
  };

  await pipeline(
    createReadStream(filePath, { highWaterMark: 64 * 1024 }),
    new Writable({
      write(chunk: Buffer, _encoding, callback) {
        const text = carry + decoder.write(chunk);
        // Keep the trailing (possibly incomplete) word for the next chunk
        const lastBreak = text.search(/[^\\p{L}\\p{N}']+[\\p{L}\\p{N}']*$/u);
        if (lastBreak === -1) {
          carry = text; // no separator yet — whole chunk is one partial word
        } else {
          add(text.slice(0, lastBreak));
          carry = text.slice(lastBreak);
        }
        callback(); // signal "ready for more" → this is what drives backpressure
      },
      final(callback) {
        add(carry + decoder.end());
        callback();
      },
    }),
  );
  return counts;
}`,
      },
      { type: 'heading3', text: 'Complexity' },
      {
        type: 'bullets',
        items: [
          '**Time:** O(n) over the characters of the file to count, plus O(d log d) to sort d distinct words. For top-k only, a min-heap of size k gives O(d log k).',
          '**Space:** O(d) for the Map plus a constant number of buffered chunks — independent of file size.',
        ],
      },
      { type: 'heading3', text: 'Edge cases' },
      {
        type: 'bullets',
        items: [
          'Empty file → empty Map.',
          'Missing file / permission error → the stream emits `error`; with `for await` and `pipeline` it becomes a rejected promise the caller can catch (`ENOENT`, `EACCES`).',
          'Windows line endings → `crlfDelay: Infinity` treats `\\r\\n` as one break.',
          'Case and punctuation → lower-case and a regex that keeps letters, digits and apostrophes, so "The" and "the," count together.',
          'Non-English text → `\\p{L}` with the `u` flag matches "café" and "naïve"; `\\w` would split them.',
          'Words split across chunks → `readline` handles it for lines; the chunk version carries the partial word forward.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '**Too many distinct words for memory:** shard by hash of the word into N temporary files in one pass, then count each shard separately (a manual map-reduce). Or use an approximate structure like Count-Min Sketch for heavy hitters.',
          '**Faster on many cores:** split the file into byte ranges (`createReadStream(path, { start, end })`), count each range in a `worker_thread`, adjust the boundaries to the next whitespace, then merge the Maps.',
          '**Why not `readFile`?** It needs the entire file in memory, and strings in V8 have a maximum length (~512 MB–1 GB), so it fails outright on big files.',
          '**`pipeline` vs `.pipe()`:** `pipeline` forwards errors and destroys every stream on failure; `.pipe()` leaks file descriptors when something errors.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "memory should be proportional to distinct words, not file size" in your first sentence, then use the word backpressure and explain who pauses whom. Mentioning the one-giant-line case and how to handle it is the follow-up that usually decides a strong hire.',
      },
    ],
  },

  'write-problem-details-error-middleware': {
    summary:
      "I define a small error hierarchy (`AppError` with `status`, `type` and `title`, plus subclasses like `NotFoundError` and `ConflictError`), throw those from services, and register one 4-argument middleware last. It maps known errors and `ZodError` to `application/problem+json` with the right status, adds `instance` and a request id, logs the full error server-side, and turns anything unknown into a generic 500 with no stack or message in production. If headers were already sent, it delegates to Express's default handler with `next(err)`.",
    details: [
      { type: 'heading3', text: 'Requirements to state first' },
      {
        type: 'bullets',
        items: [
          'One response format for every error (RFC 9457 Problem Details, see the API Design answer for the members).',
          'Expected (operational) errors keep their status and a safe message; unexpected errors become 500 and leak nothing.',
          'Validation errors return field-level details.',
          'Every response carries a request id that matches the server log line.',
          'Works for async handlers (Express 5 forwards rejected promises; on Express 4 wrap handlers).',
        ],
      },
      { type: 'heading3', text: '1. Error hierarchy' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// errors.ts
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly type: string; // stable URI clients can switch on
  abstract readonly title: string;
  readonly expose = true; // message is safe to show to clients

  constructor(message: string, readonly extras: Record<string, unknown> = {}, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

const base = 'https://api.example.com/problems';

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly type = base + '/not-found';
  readonly title = 'Resource not found';
}

export class ConflictError extends AppError {
  readonly status = 409;
  readonly type = base + '/conflict';
  readonly title = 'Request conflicts with the current state';
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly type = base + '/forbidden';
  readonly title = 'Not allowed';
}`,
      },
      { type: 'heading3', text: '2. The middleware' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// error-handler.ts
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { logger } from './logger';

const isProd = process.env.NODE_ENV === 'production';

export const problemDetails: ErrorRequestHandler = (err, req, res, next) => {
  // Response already streaming: we cannot change status or headers.
  // Express's default handler will close the connection.
  if (res.headersSent) return next(err);

  const requestId = String(req.id ?? req.headers['x-request-id'] ?? '');
  let status = 500;
  let body: Record<string, unknown>;

  if (err instanceof ZodError) {
    status = 400;
    body = {
      type: 'https://api.example.com/problems/validation-error',
      title: 'Your request is not valid',
      detail: err.issues.length + ' field(s) failed validation',
      errors: err.issues.map((i) => ({ pointer: '/' + i.path.join('/'), detail: i.message })),
    };
  } else if (err instanceof AppError) {
    status = err.status;
    body = { type: err.type, title: err.title, detail: err.message, ...err.extras };
  } else if (isBodyParserError(err)) {
    status = err.status; // e.g. 400 malformed JSON, 413 payload too large
    body = { type: 'about:blank', title: err.status === 413 ? 'Payload too large' : 'Bad request' };
  } else {
    body = {
      type: 'about:blank',
      title: 'Internal Server Error',
      // Never leak internals in production
      ...(isProd ? {} : { detail: String(err?.message ?? err), stack: err?.stack }),
    };
  }

  const log = status >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
  log({ err, requestId, method: req.method, path: req.originalUrl, status }, 'request failed');

  res
    .status(status)
    .type('application/problem+json')
    .json({ ...body, status, instance: req.originalUrl, requestId });
};

function isBodyParserError(err: any): err is { status: number; type: string } {
  return typeof err?.status === 'number' && typeof err?.type === 'string' && err.status < 500;
}`,
      },
      { type: 'heading3', text: '3. Wiring' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const app = express();
app.use(requestId());          // sets req.id and the X-Request-Id response header
app.use(express.json({ limit: '1mb' }));
app.use('/orders', ordersRouter);

// 404 for unmatched routes, in the same format
app.use((req, _res, next) => next(new NotFoundError('No route for ' + req.method + ' ' + req.path)));

app.use(problemDetails);        // must be last, and must have 4 parameters

// Express 4 only: forward async errors (Express 5 does this automatically)
export const ah = (fn: RequestHandler): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);`,
      },
      {
        type: 'paragraph',
        text: "Inside a route the service just throws: `if (!order) throw new NotFoundError('Order ' + id + ' not found');`. Validation is `Schema.parse(req.body)`, which throws a `ZodError` that the middleware maps. No route needs its own try/catch.",
      },
      { type: 'heading3', text: '4. Tests with supertest' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/missing', () => { throw new NotFoundError('Order 42 not found'); });
  app.post('/orders', (req, res) => {
    z.object({ qty: z.number().int().min(1) }).parse(req.body);
    res.status(201).end();
  });
  app.get('/boom', async () => { throw new Error('db password is hunter2'); });
  app.use(problemDetails);
  return app;
}

it('maps a domain error', async () => {
  const res = await request(buildApp()).get('/missing').expect(404);
  expect(res.headers['content-type']).toMatch(/application\\/problem\\+json/);
  expect(res.body).toMatchObject({ status: 404, title: 'Resource not found', instance: '/missing' });
});

it('returns field errors for invalid input', async () => {
  const res = await request(buildApp()).post('/orders').send({ qty: 0 }).expect(400);
  expect(res.body.errors[0].pointer).toBe('/qty');
});

it('hides internal details in production', async () => {
  process.env.NODE_ENV = 'production'; // or inject isProd as an option for cleaner tests
  const res = await request(buildApp()).get('/boom').expect(500);
  expect(JSON.stringify(res.body)).not.toContain('hunter2');
  expect(res.body.stack).toBeUndefined();
});`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Reading `NODE_ENV` at module load makes the production test order-dependent. A cleaner design is a factory, `problemDetails({ exposeInternals: false, logger })`, so tests pass options instead of mutating globals.',
      },
      { type: 'heading3', text: 'Design decisions worth saying out loud' },
      {
        type: 'bullets',
        items: [
          '**Domain errors do not know HTTP**: an alternative is to keep `status` out of the domain classes and map them in the middleware with a lookup table. That keeps services reusable from queue consumers and CLIs.',
          '**Stable `type` URIs** are the contract; `detail` is for humans and may change.',
          '**4xx are warnings, 5xx are errors** in logs and alerts, so a spike of bad client input does not page anyone.',
          '**Do not echo user input** into `detail` without care; it can end up in logs and error UIs.',
          '**Programmer errors** (a `TypeError` from a bug) still get a 500 here, and the process keeps running because the request is isolated. Errors outside the request path still go to the process-level handlers.',
        ],
      },
      { type: 'heading3', text: 'Complexity and edge cases' },
      {
        type: 'bullets',
        items: [
          'O(1) per error, plus O(n) over validation issues.',
          'Errors thrown after streaming started (`res.headersSent`).',
          'Non-`Error` values thrown (`throw "oops"`): handled by the generic branch via `String(err)`.',
          'Errors from `express.json()` (malformed JSON, 413) are client errors and should not become 500.',
          'Error middleware registered before the routes never runs for them.',
        ],
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Why must the handler have exactly four parameters? Hint: Express detects error middleware by `fn.length === 4`; dropping `next` turns it into normal middleware.',
          'What changes in Express 5? Hint: rejected promises from handlers are passed to `next(err)` automatically, so the `ah()` wrapper is no longer needed.',
          'How do you correlate the response with logs and traces? Hint: request id via `AsyncLocalStorage` in every log line, plus the OpenTelemetry trace id in the body.',
          'How would you translate database errors such as a duplicate key? Hint: map driver codes (Postgres `23505`, MongoDB `11000`) to `ConflictError` in the repository layer.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Returning `err.message` or `err.stack` for every error, leaking SQL, file paths or secrets.',
          'Every route having its own try/catch with a slightly different JSON shape.',
          'Turning malformed JSON or validation failures into 500s, which pollutes error rates and alerts.',
          'Calling `res.status()` after headers were sent, which throws `ERR_HTTP_HEADERS_SENT`.',
          'Forgetting async errors in Express 4, so requests hang instead of reaching the handler.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: one central boundary, a clear split between safe operational errors and hidden internal ones, request ids that tie responses to logs, correct handling of `headersSent` and body-parser errors, and tests proving that nothing sensitive leaks.',
      },
    ],
  },
};
