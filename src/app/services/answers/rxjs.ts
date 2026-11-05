import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is an Observable in RxJS?': {
    summary:
      'An Observable is a lazy stream of values over time. It does nothing until someone subscribes; then it can emit zero or more values with `next`, and finish with either `error` or `complete`. Subscribing returns a `Subscription` you can `unsubscribe()` from to stop it and run its teardown logic.',
    details: [
      {
        type: 'paragraph',
        text: 'Think of an Observable as a function that, when called (subscribed to), pushes values to an observer. A Promise gives you one future value; an Observable can give you many — clicks, WebSocket messages, timer ticks or a single HTTP response — and can be cancelled.',
      },
      { type: 'heading3', text: 'Creating and subscribing' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Observable } from 'rxjs';

const numbers$ = new Observable<number>((subscriber) => {
  console.log('producer started');      // runs only on subscribe (lazy)
  subscriber.next(1);
  subscriber.next(2);
  const id = setTimeout(() => {
    subscriber.next(3);
    subscriber.complete();               // no more values after this
  }, 1000);

  return () => clearTimeout(id);         // teardown: runs on unsubscribe / complete / error
});

const sub = numbers$.subscribe({
  next: (v) => console.log('value', v),
  error: (e) => console.error('error', e),
  complete: () => console.log('done'),
});
// producer started → value 1 → value 2 → (1s) value 3 → done

// sub.unsubscribe();  // would cancel before 3 is emitted`,
      },
      { type: 'heading3', text: 'The Observable contract' },
      {
        type: 'bullets',
        items: [
          '`next*` then optionally one `error` **or** one `complete` — after that, nothing more is delivered.',
          '**Lazy**: each subscription runs the producer function again (for cold observables).',
          'Can be **sync or async** — `of(1, 2, 3)` emits synchronously during `subscribe()`.',
          '**Cancellable**: `unsubscribe()` runs teardown (clears timers, aborts the HTTP request, removes event listeners).',
          'Composable with **operators** via `.pipe()` — `map`, `filter`, `switchMap`, …',
        ],
      },
      { type: 'heading3', text: 'Common creation functions' },
      {
        type: 'code',
        lang: 'typescript',
        code: `of(1, 2, 3);                          // emits the arguments, then completes
from([10, 20]);                       // from array / Promise / iterable
fromEvent(document, 'click');         // DOM events (never completes)
interval(1000);                       // 0, 1, 2 … every second
timer(500);                           // one value after 500ms
this.http.get<User[]>('/api/users');  // Angular HttpClient → one value, then complete`,
      },
      {
        type: 'flow',
        title: 'Observable lifecycle',
        code: `stateDiagram-v2
  [*] --> Idle: created (nothing runs)
  Idle --> Active: subscribe()
  Active --> Active: next(value)
  Active --> Completed: complete()
  Active --> Errored: error(err)
  Active --> Unsubscribed: unsubscribe()
  Completed --> [*]
  Errored --> [*]
  Unsubscribed --> [*]`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the three words to hit are **lazy**, **multiple values over time** and **cancellable**. Then mention the `next/error/complete` contract and that operators are applied with `pipe()`.',
      },
    ],
  },

  'Why do we use Observables in Angular?': {
    summary:
      'Because much of Angular is built on them: `HttpClient` returns Observables, as do the Router (`events`, `paramMap`), reactive forms (`valueChanges`) and `@angular/core` APIs like `outputToObservable`. They model async events over time, are cancellable (switching routes aborts HTTP calls), and RxJS operators make complex async flows — debouncing, retrying, combining requests — declarative. Since Angular 16+, signals handle synchronous UI state, and RxJS remains the tool for async event streams.',
    details: [
      {
        type: 'paragraph',
        text: 'Web apps are full of asynchronous things that happen more than once: keystrokes, route changes, WebSocket messages, polling. Observables give a single, composable abstraction for all of them, with built-in cancellation and error handling.',
      },
      { type: 'heading3', text: 'Where Angular uses Observables' },
      {
        type: 'bullets',
        items: [
          '**HttpClient**: `http.get()` returns a cold Observable — nothing is sent until you subscribe; unsubscribing cancels the request.',
          '**Router**: `router.events`, `ActivatedRoute.paramMap`, `queryParamMap`, `data`.',
          '**Reactive forms**: `control.valueChanges`, `statusChanges`.',
          '**Interceptors**: `HttpInterceptorFn` returns `Observable<HttpEvent>` so you can retry, transform or catch errors.',
          '**EventEmitter** (legacy `@Output()`) extends `Subject`; modern `output()` can be converted with `outputToObservable()`.',
        ],
      },
      { type: 'heading3', text: 'What you gain over callbacks/Promises' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Search box: debounce, ignore duplicates, cancel stale requests, handle errors — declaratively
results$ = this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap((term) =>
    this.http.get<Product[]>('/api/products', { params: { q: term } }).pipe(
      catchError(() => of([])),
    ),
  ),
);
// Template: @for (p of results$ | async; track p.id) { ... }  — async pipe unsubscribes for you`,
      },
      { type: 'heading3', text: 'Observables and signals together (modern Angular)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class ProductPage {
  private route = inject(ActivatedRoute);
  private api = inject(ProductApi);

  // RxJS for the async part, signal for the template
  product = toSignal(
    this.route.paramMap.pipe(switchMap((p) => this.api.get(p.get('id')!))),
    { initialValue: null },
  );
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Cancellation**: leaving a page unsubscribes → in-flight HTTP is aborted.',
          '**Composition**: combine several sources (`combineLatest`, `forkJoin`) without nested callbacks.',
          '**Error handling & retry** inside the stream (`catchError`, `retry`).',
          '**Signals** are great for synchronous state read in templates; **Observables** for events and async workflows. Interop helpers bridge the two.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give a concrete example (type-ahead search or route-param → HTTP) rather than listing features. Mentioning `toSignal()` and `takeUntilDestroyed()` shows you know how RxJS fits into signal-based Angular.',
      },
    ],
  },

  'What are the key differences between a Promise and an Observable (`eager vs lazy, single vs multiple values, cancellation`)?':
    {
      summary:
        "A Promise is **eager** (starts immediately when created), resolves **one value** once, can't be cancelled, and always delivers asynchronously. An Observable is **lazy** (runs only on subscribe, and again for each subscriber), can emit **many values** over time, is **cancellable** via `unsubscribe()`, can be sync or async, and has a rich operator library.",
      details: [
        { type: 'heading3', text: 'Eager vs lazy' },
        {
          type: 'code',
          lang: 'typescript',
          code: `const p = new Promise((resolve) => {
  console.log('promise executor runs');   // logs IMMEDIATELY, even with no .then()
  resolve(42);
});

const o = new Observable((sub) => {
  console.log('observable producer runs'); // logs only when subscribed
  sub.next(42);
  sub.complete();
});
// nothing logged for o yet…
o.subscribe();  // "observable producer runs"
o.subscribe();  // runs AGAIN — each subscriber gets its own execution (cold)`,
        },
        { type: 'heading3', text: 'Single vs multiple values' },
        {
          type: 'code',
          lang: 'typescript',
          code: `new Promise((resolve) => { resolve(1); resolve(2); })
  .then(console.log);                     // 1  — later resolves are ignored

new Observable<number>((sub) => { sub.next(1); sub.next(2); sub.next(3); })
  .subscribe(console.log);                // 1, 2, 3`,
        },
        { type: 'heading3', text: 'Cancellation' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Observable: unsubscribe runs teardown → HttpClient aborts the XHR/fetch
const sub = this.http.get('/api/report').subscribe();
sub.unsubscribe();                        // request cancelled (visible as "canceled" in DevTools)

// Promise: no built-in cancel — you need an AbortController wired in manually
const ctrl = new AbortController();
fetch('/api/report', { signal: ctrl.signal });
ctrl.abort();`,
        },
        { type: 'heading3', text: 'Side-by-side' },
        {
          type: 'bullets',
          items: [
            '**Execution**: Promise eager · Observable lazy.',
            '**Values**: Promise one · Observable zero to many (then complete or error).',
            '**Cancel**: Promise no (needs AbortController) · Observable `unsubscribe()`.',
            '**Timing**: Promise `.then` always async (microtask) · Observable may emit synchronously (`of(1)`).',
            '**Sharing**: a Promise caches its result for all `.then` callers · a cold Observable re-executes per subscriber unless you `share()`/`shareReplay()`.',
            '**Operators**: Promise has `then/catch/finally` + `Promise.all/race` · Observable has 100+ operators (`map`, `retry`, `debounceTime`, `switchMap`…).',
            '**Errors**: both propagate errors; RxJS can `retry` by re-subscribing, which a Promise cannot do.',
          ],
        },
        { type: 'heading3', text: 'Converting between them' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { from, firstValueFrom, lastValueFrom } from 'rxjs';

const obs$ = from(fetch('/api/x'));                     // Promise → Observable
const user = await firstValueFrom(this.http.get<User>('/api/me')); // Observable → Promise
// toPromise() is deprecated in RxJS 7 — use firstValueFrom / lastValueFrom`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "Interview tip: back each difference with a one-line example (the console.log in the Promise executor is the classic proof of eagerness). Also say when a Promise is fine: a one-shot async value you'll `await` and never cancel.",
        },
      ],
    },

  'Explain the difference between cold and hot observables with examples': {
    summary:
      'A **cold** observable creates its producer per subscriber — each subscription gets its own independent execution from the start (e.g. `HttpClient.get` sends a new request per subscribe, `interval` starts a new timer). A **hot** observable has a producer that exists independently and is shared — subscribers receive only values emitted after they subscribe (e.g. DOM events, a `Subject`, WebSocket messages). You turn cold into hot (multicast) with `share()` or `shareReplay()`.',
    details: [
      {
        type: 'paragraph',
        text: 'Analogy: a cold observable is a movie on Netflix — everyone who presses play gets their own playback from the beginning. A hot observable is a live TV broadcast — you see whatever is airing when you tune in, and everyone watches the same stream.',
      },
      { type: 'heading3', text: 'Cold: independent executions' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const cold$ = interval(1000).pipe(take(3));

cold$.subscribe((v) => console.log('A', v));
setTimeout(() => cold$.subscribe((v) => console.log('B', v)), 1500);
// A 0, A 1, B 0, A 2, B 1, B 2   ← B starts from 0 with its own timer

// Angular: two subscribers = TWO HTTP requests
const users$ = this.http.get<User[]>('/api/users');
users$.subscribe();
users$.subscribe();  // second network call!`,
      },
      { type: 'heading3', text: 'Hot: one shared producer' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const clicks$ = fromEvent(document, 'click');      // the DOM produces clicks regardless

const subject = new Subject<number>();
subject.next(1);                                   // nobody listening → lost
subject.subscribe((v) => console.log('A', v));
subject.next(2);                                   // A 2
subject.subscribe((v) => console.log('B', v));
subject.next(3);                                   // A 3, B 3   ← B missed 1 and 2`,
      },
      { type: 'heading3', text: 'Making a cold observable hot (multicasting)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// share(): one execution shared while there are subscribers; late subscribers miss past values
const ticks$ = interval(1000).pipe(take(3), share());

// shareReplay(1): shared AND the latest value is replayed to late subscribers
const users$ = this.http.get<User[]>('/api/users').pipe(shareReplay(1));
users$.subscribe();   // 1 request
users$.subscribe();   // no new request — gets the cached response`,
      },
      {
        type: 'flow',
        title: 'Cold vs hot',
        code: `flowchart LR
  subgraph Cold
    S1["Subscriber A"]:::client --> P1["Producer #1"]:::server
    S2["Subscriber B"]:::client --> P2["Producer #2"]:::server
  end
  subgraph Hot
    P3["Shared producer<br/>(Subject / share)"]:::highlight --> S3["Subscriber A"]:::client
    P3 --> S4["Subscriber B"]:::client
  end`,
      },
      {
        type: 'bullets',
        items: [
          'Cold examples: `of`, `from`, `interval`, `timer`, `HttpClient` calls, `defer`.',
          'Hot examples: `fromEvent` on the DOM, `Subject`/`BehaviorSubject`, router events, WebSocket streams, anything piped through `share()`.',
          '"Warm": `shareReplay` / `BehaviorSubject` — shared, but late subscribers still get the last value(s).',
          'Bug pattern: using `users$ | async` twice in a template on a cold HTTP observable sends two requests.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the precise definition is "where is the producer created?" — inside the subscription (cold) or outside and shared (hot). Then show the duplicate-HTTP-request bug and the `shareReplay(1)` fix.',
      },
    ],
  },

  'What is the core difference between a Subject and an Observable in RxJS?': {
    summary:
      'A plain Observable is **unicast** and passive: each subscriber triggers its own execution, and only the producer inside can emit. A Subject is **both an Observable and an Observer** — it is **multicast** (one execution shared by all subscribers, like an event emitter) and you can push values into it from outside with `next()`, `error()` and `complete()`.',
    details: [
      {
        type: 'paragraph',
        text: 'A Subject keeps a list of observers. When you call `subject.next(v)` it loops over them and delivers `v` to each. That makes it a bridge between imperative code ("something happened, call next") and the reactive world.',
      },
      { type: 'heading3', text: 'Unicast Observable' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const random$ = new Observable<number>((sub) => sub.next(Math.random()));

random$.subscribe((v) => console.log('A', v));  // A 0.42
random$.subscribe((v) => console.log('B', v));  // B 0.87  ← different value: separate execution
// random$.next(1)  ❌ no such method — only the producer function can emit`,
      },
      { type: 'heading3', text: 'Multicast Subject' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const subject = new Subject<number>();

subject.subscribe((v) => console.log('A', v));
subject.subscribe((v) => console.log('B', v));
subject.next(Math.random());   // A 0.42, B 0.42   ← same value to everyone

// A Subject is also an Observer, so it can subscribe to an Observable and multicast it
random$.subscribe(subject);`,
      },
      { type: 'heading3', text: 'Typical Angular use: an event bus in a service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class CartEvents {
  private readonly itemAdded = new Subject<Product>();
  readonly itemAdded$ = this.itemAdded.asObservable();   // expose read-only

  add(p: Product) { this.itemAdded.next(p); }             // only the service can emit
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Observable**: lazy, unicast, values come only from its producer.',
          '**Subject**: hot, multicast, values pushed via `next()`; late subscribers miss earlier values (use `BehaviorSubject`/`ReplaySubject` to fix that).',
          "Once a Subject completes or errors, it can't emit again — new subscribers just get the complete/error.",
          "Expose `asObservable()` so consumers can't call `next()` and break encapsulation.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the one-liner is "Observable is unicast, Subject is multicast and is also an Observer." Then show the `Math.random()` example — it makes the difference obvious.',
      },
    ],
  },

  'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?': {
    summary:
      'All four are multicast Subjects; they differ in what they deliver and when. `Subject`: only future values. `BehaviorSubject`: needs an initial value and replays the current value to each new subscriber. `ReplaySubject(n, windowTime?)`: replays the last n values. `AsyncSubject`: emits **only the last value, and only when it completes** — to all current and future subscribers, much like a Promise.',
    details: [
      {
        type: 'paragraph',
        text: 'This version of the question adds `AsyncSubject`, which is the odd one out: it stays silent while values are pushed and delivers just the final value on `complete()`.',
      },
      { type: 'heading3', text: 'All four with the same timeline' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const subjects = {
  subject: new Subject<number>(),
  behavior: new BehaviorSubject<number>(0),
  replay: new ReplaySubject<number>(2),
  async: new AsyncSubject<number>(),
};

Object.values(subjects).forEach((s) => { s.next(1); s.next(2); });

Object.entries(subjects).forEach(([name, s]) =>
  s.subscribe({ next: (v) => console.log(name, v), complete: () => console.log(name, 'done') }),
);
// behavior 2
// replay 1, replay 2
// (subject and async print nothing yet)

Object.values(subjects).forEach((s) => { s.next(3); s.complete(); });
// subject 3, subject done
// behavior 3, behavior done
// replay 3, replay done
// async 3, async done        ← AsyncSubject's first and only emission`,
      },
      { type: 'heading3', text: 'Quick reference' },
      {
        type: 'bullets',
        items: [
          '**Subject** — no initial value, no replay. Use for events.',
          '**BehaviorSubject(initial)** — always has a value, replays 1 (current), `.value` getter. Use for state.',
          '**ReplaySubject(bufferSize, windowTime)** — replays last n (within time window). Use for history/caching.',
          '**AsyncSubject** — emits last value only on complete; late subscribers after completion still get it. Use for one-shot results computed once and shared (rare in practice; `shareReplay(1)` on a completing source or a Promise often replaces it).',
        ],
      },
      {
        type: 'flow',
        title: 'Choosing a Subject',
        code: `flowchart TD
  Q{"Do late subscribers<br/>need past values?"} -->|No| S["Subject"]:::external
  Q -->|"Yes, the current state"| B["BehaviorSubject"]:::server
  Q -->|"Yes, last N values"| R["ReplaySubject(n)"]:::cache
  Q -->|"Only the final result<br/>after completion"| A["AsyncSubject"]:::highlight`,
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Difference between Subject, BehaviorSubject, and ReplaySubject in RxJS',
      },
      {
        type: 'paragraph',
        text: 'They differ in what a **late subscriber** receives. `Subject` has no memory — you only get values emitted after you subscribe. `BehaviorSubject` requires an initial value and always holds the **current** value, which it emits immediately to new subscribers (and exposes via `.value`). `ReplaySubject(n)` buffers the **last n** values (optionally within a time window) and replays them all to new subscribers.',
      },
      { type: 'heading3', text: 'Same sequence, three behaviours' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const s = new Subject<number>();
const b = new BehaviorSubject<number>(0);   // initial value required
const r = new ReplaySubject<number>(2);     // remember last 2

for (const subj of [s, b, r]) { subj.next(1); subj.next(2); subj.next(3); }

s.subscribe((v) => console.log('Subject', v));        // (nothing yet)
b.subscribe((v) => console.log('Behavior', v));       // Behavior 3
r.subscribe((v) => console.log('Replay', v));         // Replay 2, Replay 3

s.next(4); b.next(4); r.next(4);
// Subject 4, Behavior 4, Replay 4`,
      },
      { type: 'heading3', text: 'When to use which' },
      {
        type: 'bullets',
        items: [
          '**Subject** — events/notifications where the past doesn\'t matter: "save clicked", "logout happened", a `destroy$` notifier.',
          '**BehaviorSubject** — state: there is always a current value (current user, selected theme, cart items). Read synchronously with `.value`.',
          "**ReplaySubject** — when late subscribers need history: last N chat messages, or caching when there's no sensible initial value (`ReplaySubject(1)` emits nothing until the first value arrives — unlike `BehaviorSubject` which would emit a placeholder).",
        ],
      },
      { type: 'heading3', text: 'BehaviorSubject as a mini state store' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly theme = new BehaviorSubject<'light' | 'dark'>('light');
  readonly theme$ = this.theme.asObservable();

  toggle() {
    this.theme.next(this.theme.value === 'light' ? 'dark' : 'light');
  }
}
// Modern Angular alternative for synchronous state: signal<'light' | 'dark'>('light')`,
      },
      {
        type: 'flow',
        title: 'What does a late subscriber get?',
        code: `flowchart LR
  E["Emitted so far: 1, 2, 3"]:::highlight --> S["Subject<br/>nothing"]:::external
  E --> B["BehaviorSubject<br/>3 (current value)"]:::server
  E --> R["ReplaySubject(2)<br/>2, 3"]:::cache`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: `ReplaySubject()` with no buffer size replays **everything** forever — a memory leak for long-lived streams. Always pass a buffer size (and optionally a window time).',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a crisp way to remember — Subject = live, Behavior = current, Replay = history, Async = final. Note that if an `AsyncSubject` errors, subscribers get the error and no value.',
      },
    ],
  },

  'How do you declare a `BehaviorSubject` and emit/share values to all subscribed components?': {
    summary:
      'Put a private `BehaviorSubject` with an initial value in a root-provided (singleton) service, expose it read-only with `asObservable()`, and provide methods that call `next()` with the new value. Every component that injects the service and subscribes (preferably with the `async` pipe or `toSignal`) immediately gets the current value and every future update.',
    details: [
      { type: 'heading3', text: '1. The service (single source of truth)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface CartItem { id: number; name: string; qty: number }

@Injectable({ providedIn: 'root' })        // one instance shared app-wide
export class CartService {
  private readonly items = new BehaviorSubject<CartItem[]>([]);   // initial value

  readonly items$ = this.items.asObservable();                    // read-only stream
  readonly count$ = this.items$.pipe(map((list) => list.reduce((n, i) => n + i.qty, 0)));

  add(item: CartItem) {
    // emit a NEW array (immutable update) so change detection & distinctUntilChanged work
    this.items.next([...this.items.value, item]);
  }

  remove(id: number) {
    this.items.next(this.items.value.filter((i) => i.id !== id));
  }
}`,
      },
      { type: 'heading3', text: '2. Components that emit and consume' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Emits
@Component({
  selector: 'app-product-card',
  template: \`<button (click)="addToCart()">Add</button>\`,
})
export class ProductCardComponent {
  private cart = inject(CartService);
  product = input.required<Product>();
  addToCart() {
    const p = this.product();
    this.cart.add({ id: p.id, name: p.name, qty: 1 });
  }
}

// Consumes with the async pipe (auto-unsubscribes)
@Component({
  selector: 'app-header',
  imports: [AsyncPipe],
  template: \`<span class="badge">{{ count$ | async }}</span>\`,
})
export class HeaderComponent {
  count$ = inject(CartService).count$;
}

// Consumes as a signal
@Component({
  selector: 'app-cart-page',
  template: \`@for (i of items(); track i.id) { <p>{{ i.name }} × {{ i.qty }}</p> }\`,
})
export class CartPageComponent {
  items = toSignal(inject(CartService).items$, { requireSync: true }); // BehaviorSubject emits synchronously
}`,
      },
      {
        type: 'flow',
        title: 'Sharing state through a service',
        code: `flowchart LR
  P["ProductCard<br/>cart.add()"]:::client -->|"next([...items, item])"| BS["CartService<br/>BehaviorSubject"]:::highlight
  BS -->|"items$ / count$"| H["Header<br/>async pipe"]:::client
  BS -->|"toSignal(items$)"| C["CartPage"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          'Keep the subject **private**; expose `asObservable()` so only the service can change state.',
          "Never mutate the current array/object (`this.items.value.push(x)`) — subscribers won't be notified and OnPush views won't update.",
          "Provide the service in `root` for app-wide sharing, or in a component's `providers` to scope one instance per feature.",
          'Modern alternative: the same pattern with `signal()` + `computed()` in the service; use the BehaviorSubject version when you need RxJS operators on the stream.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: manual `subscribe()` in components without unsubscribing leaks memory because the service outlives the component. Use the `async` pipe, `toSignal()` or `takeUntilDestroyed()`.',
      },
    ],
  },

  'Have you used BehaviorSubject in any real scenario?': {
    summary:
      'Answer with a concrete scenario: what state needed sharing, why a BehaviorSubject (it holds a current value and replays it to late subscribers), how you exposed it, and the result. Typical real examples: the logged-in user/auth state, cart contents, a selected filter shared between a sidebar and a list, or a loading indicator driven by an interceptor.',
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer wants evidence that you understand **why** BehaviorSubject fits (state with a current value that late-loading components must see immediately) and that you used it cleanly (private subject, `asObservable()`, immutable updates, no leaks). Structure it with STAR: Situation, Task, Action, Result.',
      },
      { type: 'heading3', text: 'Sample answer (adapt to your project)' },
      {
        type: 'paragraph',
        text: '"In [your project — e.g. an insurance claims portal], the header, sidebar menu and several lazy-loaded pages all needed the logged-in user and their roles. Initially each one called `/api/me`, which caused [duplicate requests / flicker]. I created an `AuthStateService` with a private `BehaviorSubject<User | null>(null)`, populated it once after login, and exposed `user$` and `isAdmin$`. Because it\'s a BehaviorSubject, a lazy route loaded later still got the current user instantly. The result was [one request instead of N, no menu flicker], and logout became a single `next(null)` that updated the whole UI."',
      },
      { type: 'heading3', text: 'What the code looked like' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private http = inject(HttpClient);
  private readonly user = new BehaviorSubject<User | null>(null);

  readonly user$ = this.user.asObservable();
  readonly isLoggedIn$ = this.user$.pipe(map(Boolean), distinctUntilChanged());
  readonly isAdmin$ = this.user$.pipe(map((u) => !!u?.roles.includes('admin')), distinctUntilChanged());

  loadCurrentUser() {
    return this.http.get<User>('/api/me').pipe(tap((u) => this.user.next(u)));
  }
  logout() {
    this.user.next(null);
  }
  get snapshot() { return this.user.value; }   // sync access for guards/interceptors
}`,
      },
      { type: 'heading3', text: 'Other realistic scenarios you can mention' },
      {
        type: 'bullets',
        items: [
          "**Global loading spinner**: an interceptor increments/decrements a counter in a `BehaviorSubject<number>`; the shell shows the spinner when it's > 0.",
          '**Filters shared between components**: a sidebar sets filters, a results grid and a URL-sync effect react to them.',
          '**Theme / language** preference with an initial default.',
          '**Wizard / multi-step form** state shared across step components.',
          'Today you might implement the same with signals; say so — "for new code I\'d use a signal, but BehaviorSubject was the standard pattern before Angular 16 and is still useful when you need RxJS operators."',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: include one lesson learned, e.g. "we initially mutated the array inside the subject and OnPush components didn\'t update — switching to immutable `next([...items, x])` fixed it." It makes the story credible.',
      },
    ],
  },

  'Which RxJS operators have you used?': {
    summary:
      'Group them by purpose rather than listing names: transformation (`map`, `scan`), filtering (`filter`, `distinctUntilChanged`, `debounceTime`, `take`, `takeUntil`), higher-order mapping (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`), combination (`combineLatest`, `forkJoin`, `withLatestFrom`), multicasting (`shareReplay`), error handling (`catchError`, `retry`) and utility (`tap`, `finalize`). Then give a real example for the ones you use most.',
    details: [
      {
        type: 'paragraph',
        text: 'This is an experience question. A strong answer shows categories, the "why" behind your favourite operators, and one realistic chain from a project. Avoid reciting 30 operator names without context.',
      },
      { type: 'heading3', text: 'Operators by category' },
      {
        type: 'bullets',
        items: [
          '**Transform**: `map` (reshape API data), `scan` (running state), `pluck` is deprecated → use `map`.',
          '**Filter**: `filter`, `distinctUntilChanged`, `debounceTime`, `throttleTime`, `take(1)`, `first`, `skip`, `takeUntil`, `takeUntilDestroyed` (Angular).',
          '**Higher-order (flattening)**: `switchMap` (search/route params), `concatMap` (ordered saves), `mergeMap` (parallel uploads), `exhaustMap` (submit/login button).',
          '**Combine**: `combineLatest` (filters + data), `forkJoin` (parallel requests on page load), `withLatestFrom` (action + current state), `merge`, `startWith`.',
          '**Multicast / cache**: `shareReplay({ bufferSize: 1, refCount: true })`, `share`.',
          '**Errors**: `catchError`, `retry({ count, delay })`, `timeout`.',
          '**Side effects / lifecycle**: `tap` (logging, setting loading flags), `finalize` (hide spinner), `delay`.',
        ],
      },
      { type: 'heading3', text: 'A real-world chain that uses many of them' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Order list page: filters from a form + route param, with loading state and error handling
readonly vm$ = combineLatest([
  this.route.paramMap.pipe(map((p) => p.get('customerId')!)),
  this.filters.valueChanges.pipe(startWith(this.filters.value), debounceTime(300), distinctUntilChanged(isEqual)),
]).pipe(
  tap(() => this.loading.set(true)),
  switchMap(([customerId, filters]) =>
    this.api.getOrders(customerId, filters).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(() => {
        this.toast.error('Could not load orders');
        return of([] as Order[]);
      }),
      finalize(() => this.loading.set(false)),
    ),
  ),
  map((orders) => ({ orders, total: orders.reduce((s, o) => s + o.amount, 0) })),
  shareReplay({ bufferSize: 1, refCount: true }),
);`,
      },
      {
        type: 'paragraph',
        text: 'Sample phrasing: "Day to day I use `map`, `filter`, `tap` and `switchMap` most. On [your project] I used `exhaustMap` on the payment button to prevent double submits, `forkJoin` to load dashboard widgets in parallel, and `shareReplay(1)` to cache reference data like country lists."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: expect a follow-up like "switchMap vs mergeMap?" — pick operators you can explain confidently. Mentioning `takeUntilDestroyed` and the `retry({ count, delay })` config (RxJS 7) shows current knowledge.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: What does the map operator do?' },
      {
        type: 'paragraph',
        text: "`map` applies a projection function to every value emitted by the source and emits the result — a one-to-one transformation, just like `Array.prototype.map` but over time. It doesn't filter, flatten or change timing; errors and completion pass straight through.",
      },
      { type: 'heading3', text: 'Basic usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `of(1, 2, 3).pipe(map((x) => x * 10)).subscribe(console.log);
// 10, 20, 30

// The projection also receives the index
of('a', 'b').pipe(map((v, i) => \`\${i}:\${v}\`)).subscribe(console.log);
// 0:a, 1:b`,
      },
      { type: 'heading3', text: 'Angular: shaping API responses' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface ApiUser { id: number; first_name: string; last_name: string; created_at: string }
interface User { id: number; fullName: string; createdAt: Date }

getUsers(): Observable<User[]> {
  return this.http.get<{ data: ApiUser[] }>('/api/users').pipe(
    map((res) => res.data),                                  // unwrap the envelope
    map((users) =>
      users.map((u) => ({                                   // Array.map INSIDE rxjs map
        id: u.id,
        fullName: \`\${u.first_name} \${u.last_name}\`,
        createdAt: new Date(u.created_at),
      })),
    ),
  );
}`,
      },
      { type: 'heading3', text: 'map vs similar operators' },
      {
        type: 'bullets',
        items: [
          '`map` — transform each value (1 in → 1 out).',
          '`filter` — decide whether a value passes (1 in → 0 or 1 out).',
          "`tap` — side effect, value passes through unchanged (don't do side effects in `map`).",
          '`switchMap`/`mergeMap` — when the projection returns an **Observable** (e.g. an HTTP call). Using `map` there gives you `Observable<Observable<T>>`.',
          '`scan` — transform with access to accumulated state.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Common mistake: map returning an Observable
this.route.paramMap.pipe(
  map((p) => this.api.getProduct(p.get('id')!)),   // ❌ Observable<Observable<Product>>
);
this.route.paramMap.pipe(
  switchMap((p) => this.api.getProduct(p.get('id')!)), // ✅ Observable<Product>
);`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: keep `map` pure (no HTTP calls, no state mutation). If the interviewer asks "what if the transformation is async?", the answer is a flattening operator like `switchMap`.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: What does the filter operator do?' },
      {
        type: 'paragraph',
        text: '`filter` evaluates a predicate for each emitted value and only lets through the values for which it returns `true`; others are silently dropped. Like `Array.filter`, but over time. It can also narrow TypeScript types when given a type-guard predicate.',
      },
      { type: 'heading3', text: 'Basic usage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `of(1, 2, 3, 4, 5, 6).pipe(filter((n) => n % 2 === 0)).subscribe(console.log);
// 2, 4, 6`,
      },
      { type: 'heading3', text: 'Angular examples' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// 1. React only to NavigationEnd router events (type guard narrows the type)
this.router.events.pipe(
  filter((e): e is NavigationEnd => e instanceof NavigationEnd),
  takeUntilDestroyed(),
).subscribe((e) => this.analytics.pageView(e.urlAfterRedirects));   // e: NavigationEnd

// 2. Ignore short search terms
this.search.valueChanges.pipe(
  filter((term): term is string => !!term && term.length >= 3),
  debounceTime(300),
  switchMap((term) => this.api.search(term)),
);

// 3. Drop null/undefined (e.g. from a BehaviorSubject<User | null>)
this.auth.user$.pipe(filter((u): u is User => u !== null));`,
      },
      { type: 'heading3', text: 'Related operators' },
      {
        type: 'bullets',
        items: [
          '`distinctUntilChanged()` — filter out consecutive duplicates.',
          '`first(predicate)` / `take(1)` — the first matching value, then complete.',
          '`skip(n)`, `takeWhile(pred)`, `skipWhile(pred)` — position or condition based.',
          '`debounceTime`/`throttleTime` — time-based filtering.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: if the predicate never passes, the subscriber gets nothing — no error. In a stream feeding `forkJoin` or `firstValueFrom`, a filtered-out source that completes without emitting causes `forkJoin` to complete empty or `firstValueFrom` to reject with `EmptyError`.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Why do we use pipe() before subscribing?' },
      {
        type: 'paragraph',
        text: "`pipe()` composes operators into a new Observable that transforms the stream — filtering, mapping, combining, handling errors — **before** values reach the subscriber. It keeps the subscribe callback simple, makes the logic declarative and reusable, keeps the result lazy (nothing runs until subscribe), and with RxJS's pipeable operators allows tree-shaking. Note that `pipe()` doesn't mutate the source; it returns a new Observable.",
      },
      {
        type: 'paragraph',
        text: 'Think of `pipe()` as an assembly line: the source emits raw values, each operator does one job, and the subscriber receives the finished product. Without `pipe()` you would end up with all the logic — and nested subscriptions — inside `subscribe()`.',
      },
      { type: 'heading3', text: 'Without pipe vs with pipe' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ Logic crammed into subscribe, nested subscription, no cancellation of stale requests
this.searchControl.valueChanges.subscribe((term) => {
  if (term.length < 2) return;
  this.http.get<Product[]>(\`/api/search?q=\${term}\`).subscribe((items) => {
    this.results = items.filter((i) => i.inStock);
  });
});

// ✅ Declarative pipeline; subscriber only receives the final value
this.searchControl.valueChanges.pipe(
  filter((term) => term.length >= 2),
  debounceTime(300),
  switchMap((term) => this.http.get<Product[]>(\`/api/search?q=\${term}\`)),
  map((items) => items.filter((i) => i.inStock)),
  takeUntilDestroyed(this.destroyRef),
).subscribe((items) => (this.results = items));`,
      },
      { type: 'heading3', text: 'pipe returns a new Observable (immutability)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const source$ = of(1, 2, 3);
const doubled$ = source$.pipe(map((x) => x * 2));

source$.subscribe(console.log);   // 1 2 3   — untouched
doubled$.subscribe(console.log);  // 2 4 6`,
      },
      { type: 'heading3', text: 'Reusable custom operators' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { pipe } from 'rxjs';

// A standalone pipe() creates a reusable operator
export const searchTerm = (minLength = 2) =>
  pipe(
    map((v: string) => v.trim()),
    filter((v) => v.length >= minLength),
    debounceTime(300),
    distinctUntilChanged(),
  );

this.searchControl.valueChanges.pipe(searchTerm(3), switchMap(search));`,
      },
      {
        type: 'flow',
        title: 'Values flowing through pipe()',
        code: `flowchart LR
  S["Source<br/>valueChanges"]:::client --> F["filter"]:::server --> D["debounceTime"]:::server --> SW["switchMap<br/>HTTP"]:::network --> M["map"]:::server --> SUB["subscribe()"]:::highlight`,
      },
      {
        type: 'bullets',
        items: [
          'Order matters — operators run top to bottom on each value.',
          'Since RxJS 6, operators are standalone functions used in `pipe()` instead of prototype methods (`obs.map(...)`), which enables tree-shaking.',
          'Error handling (`catchError`) and cleanup (`takeUntilDestroyed`, `finalize`) belong in the pipe so they apply to the whole chain.',
          "You don't always need `subscribe()` at all in Angular — the `async` pipe or `toSignal()` subscribe for you.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: "pipe transforms, subscribe consumes." Mention that subscribe should contain as little logic as possible, and that nested subscribes are an anti-pattern solved by flattening operators inside the pipe.',
      },
    ],
  },

  'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each':
    {
      summary:
        'Decide by what should happen when a new value arrives while the previous inner request is still running: **switchMap** cancels it (search box, route params); **mergeMap** runs both in parallel (uploading multiple files, independent deletes); **concatMap** queues the new one until the previous finishes (ordered auto-save, chat messages sent in order); **exhaustMap** ignores the new one until the current finishes (login/payment submit button, pull-to-refresh).',
      details: [
        {
          type: 'paragraph',
          text: 'All four are "higher-order mapping" operators: they map a value to an Observable and subscribe to it for you. The only difference is their overlap strategy.',
        },
        { type: 'heading3', text: 'Scenarios side by side' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// 1) switchMap — product search: only the latest term's results matter
results$ = this.term$.pipe(debounceTime(300), distinctUntilChanged(),
  switchMap((t) => this.api.search(t)));

// 2) mergeMap — photo gallery upload: send files in parallel (max 3)
uploads$ = from(files).pipe(mergeMap((f) => this.api.upload(f), 3));

// 3) concatMap — chat: messages must arrive in the order the user sent them
this.send$.pipe(concatMap((msg) => this.api.postMessage(msg))).subscribe();

// 4) exhaustMap — payment "Pay now": extra clicks while the request runs are ignored
this.payClick$.pipe(exhaustMap(() => this.api.charge(this.order()))).subscribe();`,
        },
        {
          type: 'heading3',
          text: 'What happens with clicks at t=0, 100ms, 200ms (each request takes 1s)',
        },
        {
          type: 'bullets',
          items: [
            '**switchMap**: requests 1 and 2 cancelled, only request 3 completes → 1 result.',
            '**mergeMap**: 3 concurrent requests → 3 results, possibly out of order.',
            '**concatMap**: request 1 runs, then 2, then 3 → 3 results, in order, ~3s total.',
            '**exhaustMap**: request 1 runs; clicks 2 and 3 are dropped → 1 result (from the first click).',
          ],
        },
        {
          type: 'flow',
          title: 'Overlap strategies',
          code: `flowchart LR
  N["New value while<br/>inner is busy"]:::highlight --> A["switchMap:<br/>cancel old, start new"]:::client
  N --> B["mergeMap:<br/>start new in parallel"]:::network
  N --> C["concatMap:<br/>queue new"]:::server
  N --> D["exhaustMap:<br/>drop new"]:::security`,
        },
        {
          type: 'bullets',
          items: [
            'Reads that can be superseded → **switchMap**.',
            'Independent writes, throughput matters → **mergeMap** (with a concurrency limit).',
            'Writes where order/consistency matters → **concatMap**.',
            'Non-idempotent actions that must not be duplicated → **exhaustMap** (plus disable the button and use idempotency keys on the server).',
          ],
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: Difference between switchMap and mergeMap' },
        {
          type: 'paragraph',
          text: 'Both map each source value to an inner Observable and flatten the results. `switchMap` **cancels** the previous inner Observable when a new value arrives — only the latest one matters (search, route params). `mergeMap` keeps **all** inner Observables running **concurrently** and emits results as they arrive, in any order (parallel uploads, independent saves).',
        },
        { type: 'heading3', text: 'Same input, different behaviour' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Fake API that takes 1s to respond
const fakeApi = (id: string) => timer(1000).pipe(map(() => \`result \${id}\`));

// User triggers a, b, c quickly (within 1s)
const clicks$ = of('a', 'b', 'c');

clicks$.pipe(switchMap(fakeApi)).subscribe(console.log);
// result c                       ← a and b were cancelled (unsubscribed)

clicks$.pipe(mergeMap(fakeApi)).subscribe(console.log);
// result a, result b, result c   ← all three ran in parallel`,
        },
        { type: 'heading3', text: 'Real-world use' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// switchMap: product detail page — new route param makes the old request irrelevant
product$ = this.route.paramMap.pipe(
  switchMap((p) => this.api.getProduct(p.get('id')!)),
);

// mergeMap: upload several files at once, max 3 at a time
upload$ = from(files).pipe(
  mergeMap((file) => this.api.upload(file), 3),   // concurrency limit
);`,
        },
        {
          type: 'flow',
          title: 'switchMap vs mergeMap timeline',
          code: `sequenceDiagram
  participant S as Source
  participant SW as switchMap
  participant MM as mergeMap
  S->>SW: a (start request a)
  S->>SW: b (cancel a, start b)
  SW-->>S: result b only
  S->>MM: a (start a)
  S->>MM: b (start b in parallel)
  MM-->>S: result b (whichever finishes first)
  MM-->>S: result a`,
        },
        {
          type: 'bullets',
          items: [
            '**switchMap**: cancel previous → latest wins. Risky for writes (a cancelled POST may still have reached the server).',
            '**mergeMap** (alias `flatMap`): no cancellation, concurrent, unordered results; optional `concurrent` argument.',
            'Use `concatMap` if you need sequential, ordered processing; `exhaustMap` to ignore new values while busy.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Pitfall: using `switchMap` for save/delete requests. Cancelling the HTTP observable only aborts the client side — the server may already have processed it, and you lose the response. Use `concatMap` or `mergeMap` for writes.',
        },
        { type: 'divider' },
        {
          type: 'heading3',
          text: 'Follow-up: Explain the use cases of switchMap, concatMap, and mergeMap.',
        },
        {
          type: 'paragraph',
          text: 'All three flatten inner Observables; they differ in how they handle overlap. `switchMap` — cancel the previous, keep the latest: type-ahead search, route-param driven loads, refresh triggers. `concatMap` — queue and run one at a time in order: sequential saves, ordered API calls, processing a queue. `mergeMap` — run all in parallel: bulk uploads, independent fire-and-forget requests, handling WebSocket messages concurrently.',
        },
        { type: 'heading3', text: 'switchMap — "only the latest matters"' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Type-ahead: when the user types again, the old request is aborted
results$ = this.query.valueChanges.pipe(
  debounceTime(300),
  switchMap((q) => this.api.search(q)),
);

// Dashboard refresh: a new tick or click restarts loading
data$ = merge(interval(30_000), this.refreshClick$).pipe(switchMap(() => this.api.load()));`,
        },
        { type: 'heading3', text: 'concatMap — "one at a time, in order"' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Auto-save each edit; saves must hit the server in the same order the user made them
this.form.valueChanges.pipe(
  debounceTime(500),
  concatMap((value) => this.api.saveDraft(value)),   // next save waits for the previous to finish
).subscribe();

// Dependent sequential steps
from(['step1', 'step2', 'step3']).pipe(concatMap((s) => this.api.runStep(s)));`,
        },
        { type: 'heading3', text: 'mergeMap — "all at once"' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Delete selected rows in parallel (limit to 4 concurrent requests)
from(selectedIds).pipe(
  mergeMap((id) => this.api.delete(id), 4),
  toArray(),                                   // wait for all to finish
).subscribe(() => this.reload());

// Each incoming socket message triggers an independent lookup
this.socket.messages$.pipe(mergeMap((m) => this.api.enrich(m)));`,
        },
        {
          type: 'flow',
          title: 'Pick the right flattening operator',
          code: `flowchart TD
  Q{"New value arrives while<br/>previous inner is still running"} -->|"Old one is obsolete"| SW["switchMap<br/>cancel previous"]:::highlight
  Q -->|"Order matters, keep all"| CM["concatMap<br/>queue"]:::server
  Q -->|"Independent, speed matters"| MM["mergeMap<br/>parallel"]:::network
  Q -->|"Ignore until finished"| EM["exhaustMap<br/>drop new"]:::security`,
        },
        {
          type: 'bullets',
          items: [
            '`switchMap` is ideal for **reads**; avoid it for writes.',
            '`concatMap` can build up a backlog if the source is faster than the inner work.',
            '`mergeMap` gives no ordering guarantees; pass a concurrency limit to avoid flooding the server.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: frame it as "what to do with overlap: cancel, parallel, queue or ignore." That one sentence shows you understand the model, not just memorised examples.',
        },
      ],
    },

  'Explain the difference between combineLatest, forkJoin, zip, and withLatestFrom': {
    summary:
      '`combineLatest` emits the latest value of every source whenever **any** source emits (after each has emitted once) — great for filters + data. `forkJoin` waits for **all sources to complete** and emits their last values once — like `Promise.all` for parallel HTTP calls. `zip` pairs values **by index** (1st with 1st, 2nd with 2nd). `withLatestFrom` is an operator: when the **primary** source emits, it grabs the latest value from the others — the secondary sources never trigger emissions.',
    details: [
      { type: 'heading3', text: 'Same two sources, four results' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// a$: emits A1 at 100ms, A2 at 300ms, then completes
// b$: emits B1 at 200ms, B2 at 400ms, then completes

combineLatest([a$, b$]);       // [A1,B1]@200 [A2,B1]@300 [A2,B2]@400
forkJoin([a$, b$]);            // [A2,B2]@400 — once, after BOTH complete
zip([a$, b$]);                 // [A1,B1]@200 [A2,B2]@400 — paired by index
a$.pipe(withLatestFrom(b$));   // [A2,B1]@300 — A1 dropped (b$ had no value yet);
                               // B2 alone doesn't trigger anything`,
      },
      { type: 'heading3', text: 'Typical Angular uses' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// combineLatest — recompute whenever filters OR sort change
vm$ = combineLatest({ filters: this.filters$, sort: this.sort$ }).pipe(
  switchMap(({ filters, sort }) => this.api.list(filters, sort)),
);

// forkJoin — load independent data for a page in parallel, render once all arrive
pageData$ = forkJoin({
  user: this.api.getUser(id),
  orders: this.api.getOrders(id),
  countries: this.api.getCountries(),
}); // emits { user, orders, countries } once

// withLatestFrom — on Save click, take the current form state (form changes alone don't save)
this.saveClick$.pipe(
  withLatestFrom(this.form.valueChanges.pipe(startWith(this.form.value))),
  concatMap(([, value]) => this.api.save(value)),
);

// zip — pair each request with its response in lock-step (less common in apps)
zip(this.questions$, this.answers$).pipe(map(([q, a]) => ({ q, a })));`,
      },
      {
        type: 'flow',
        title: 'Which combination operator?',
        code: `flowchart TD
  Q{"What do you need?"} -->|"Latest of all,<br/>update on any change"| CL["combineLatest"]:::highlight
  Q -->|"Final values once,<br/>all sources complete"| FJ["forkJoin"]:::server
  Q -->|"Pair values by index"| Z["zip"]:::cache
  Q -->|"Primary event + current<br/>value of others"| WL["withLatestFrom"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          "**combineLatest** won't emit until every source has emitted once — add `startWith()` to sources that may be silent.",
          '**forkJoin** never emits if any source never completes (e.g. `valueChanges`, a `BehaviorSubject`); if any source completes **without emitting**, forkJoin completes with no value; if one errors, the whole result errors.',
          '**zip** buffers unmatched values — a fast source paired with a slow one can grow memory.',
          '**withLatestFrom** silently drops primary values until each secondary has emitted.',
          'All accept an object (dictionary) form in RxJS 7: `forkJoin({ a, b })` → `{ a, b }`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: using `forkJoin` with a store selector or `BehaviorSubject` — it never completes, so nothing ever renders. Use `combineLatest` there, or `take(1)` on the long-lived source.',
      },
    ],
  },

  'What does shareReplay(1) do and when is it essential?': {
    summary:
      '`shareReplay(1)` multicasts a source — all subscribers share a single subscription to it — and caches the **last emitted value**, replaying it immediately to anyone who subscribes later. It is essential when a cold, expensive source (usually an HTTP call) is subscribed to multiple times, e.g. several `async` pipes or components, and you want one request plus a cached result.',
    details: [
      { type: 'heading3', text: 'The problem it solves' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Cold HTTP observable used twice → TWO requests
user$ = this.http.get<User>('/api/me');

// template
// {{ (user$ | async)?.name }}
// <img [src]="(user$ | async)?.avatar">     ← second subscription, second GET`,
      },
      { type: 'heading3', text: 'With shareReplay' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  // One request for the whole app lifetime; later subscribers get the cached value instantly
  readonly config$ = this.http.get<AppConfig>('/api/config').pipe(shareReplay(1));
}

// Equivalent explicit form (RxJS 7):
// shareReplay({ bufferSize: 1, refCount: false })`,
      },
      { type: 'heading3', text: 'refCount: true vs false' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// refCount: false (default for shareReplay(1))
//   The inner subscription stays alive even when all subscribers leave.
//   Fine for HTTP (it completes anyway). LEAKS for infinite sources like interval/websocket.

// refCount: true
//   When the subscriber count drops to 0, unsubscribe from the source.
//   Use this for long-lived/infinite sources:
prices$ = this.socket.prices$.pipe(shareReplay({ bufferSize: 1, refCount: true }));`,
      },
      {
        type: 'flow',
        title: 'One source, many subscribers',
        code: `flowchart LR
  API["HTTP GET /api/config"]:::server --> SR["shareReplay(1)<br/>cache: last value"]:::cache
  SR --> A["Header"]:::client
  SR --> B["Sidebar"]:::client
  SR --> C["Late lazy route<br/>(gets cached value)"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          '**Essential**: app-wide reference data (config, countries, feature flags, current user), and the same observable bound in several places in a template.',
          "`share()` multicasts but **doesn't replay** — late subscribers miss the value.",
          'Errors are not cached — a failed request is retried on the next subscription (often desirable).',
          'There is no built-in expiry; to refresh, rebuild the observable or use a trigger `Subject` + `switchMap` before `shareReplay`.',
          'In signal-based code, `toSignal(http$)` in a service is another way to "subscribe once and share".',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: `shareReplay(1)` on an infinite source (interval, WebSocket, store selector) with the default `refCount: false` keeps it running forever after components are destroyed. Use `{ bufferSize: 1, refCount: true }` for those.',
      },
    ],
  },

  'What is the difference between debounceTime and throttleTime?': {
    summary:
      '`debounceTime(ms)` waits for a **pause**: it emits the latest value only after the source has been silent for `ms` — every new value restarts the timer. `throttleTime(ms)` emits a value and then **ignores** values for the next `ms` — it guarantees at most one emission per window, even during continuous activity. Debounce = "after the user stops"; throttle = "at most once every X".',
    details: [
      { type: 'heading3', text: 'Timeline' },
      {
        type: 'code',
        lang: 'text',
        code: `Source (keystrokes):   a-b-c-d---------e-f------
debounceTime(300):     ----------d-----------f--   (only after 300ms of silence)
throttleTime(300):     a-----c-----    e-----f--   (first value, then ignore for 300ms; exact output depends on timing)`,
      },
      { type: 'heading3', text: 'debounceTime — search input, auto-save, resize end' },
      {
        type: 'code',
        lang: 'typescript',
        code: `this.search.valueChanges.pipe(
  debounceTime(300),            // wait until the user stops typing for 300ms
  distinctUntilChanged(),
  switchMap((q) => this.api.search(q)),
);
// Typing "angular" quickly → ONE request for "angular" instead of 7`,
      },
      { type: 'heading3', text: 'throttleTime — scroll, mousemove, rapid clicks' },
      {
        type: 'code',
        lang: 'typescript',
        code: `fromEvent(window, 'scroll').pipe(
  throttleTime(200, undefined, { leading: true, trailing: true }), // at most every 200ms, plus the final position
  map(() => window.scrollY),
).subscribe((y) => this.showBackToTop.set(y > 600));

// Analytics: record at most one "like" click per second
this.likeClick$.pipe(throttleTime(1000)).subscribe(() => this.api.like());`,
      },
      {
        type: 'bullets',
        items: [
          '**debounceTime**: emits the **last** value after silence; a continuous stream (e.g. holding a key) may never emit.',
          '**throttleTime**: emits the **first** value (leading by default), then mutes; set `trailing: true` to also get the last value of the window.',
          '`auditTime(ms)` is like throttle but emits the **latest** value at the end of each window.',
          '`sampleTime(ms)` emits the latest value at fixed intervals.',
          'Both use `asyncScheduler` by default; in tests, use `TestScheduler` or fake timers.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the elevator analogy works well — debounce is an elevator door that waits until nobody has entered for a few seconds; throttle is a turnstile that lets one person through per interval.',
      },
    ],
  },

  'How does scan differ from reduce? Where would you use scan in an Angular app?': {
    summary:
      "Both accumulate values with an accumulator function and seed. `reduce` emits **only the final** accumulated value when the source **completes** (so it never emits for infinite streams). `scan` emits the **running** accumulated value after **every** source emission — it's the RxJS way to keep state over time, e.g. a Redux-style reducer, running totals, infinite-scroll lists or undo stacks.",
    details: [
      { type: 'heading3', text: 'Side by side' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const nums$ = of(1, 2, 3, 4);

nums$.pipe(reduce((acc, n) => acc + n, 0)).subscribe(console.log);
// 10                      ← once, on completion

nums$.pipe(scan((acc, n) => acc + n, 0)).subscribe(console.log);
// 1, 3, 6, 10             ← every step

interval(1000).pipe(reduce((a, n) => a + n, 0));   // ⚠️ never emits — interval never completes
interval(1000).pipe(scan((a, n) => a + n, 0));     // 0, 1, 3, 6, …`,
      },
      { type: 'heading3', text: 'Angular use 1: a tiny reducer-based store' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type Action =
  | { type: 'add'; todo: Todo }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number };

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private actions = new Subject<Action>();

  readonly todos$ = this.actions.pipe(
    scan((state: Todo[], action) => {
      switch (action.type) {
        case 'add':    return [...state, action.todo];
        case 'toggle': return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
        case 'remove': return state.filter((t) => t.id !== action.id);
      }
    }, []),
    startWith([] as Todo[]),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  dispatch(a: Action) { this.actions.next(a); }
}`,
      },
      { type: 'heading3', text: 'Angular use 2: infinite scroll / "load more"' },
      {
        type: 'code',
        lang: 'typescript',
        code: `items$ = this.loadMore$.pipe(
  startWith(undefined),
  scan((page) => page + 1, 0),                         // 1, 2, 3, …
  concatMap((page) => this.api.getPage(page)),         // keep page order
  scan((all, pageItems) => [...all, ...pageItems], [] as Item[]),  // accumulate list
);`,
      },
      {
        type: 'bullets',
        items: [
          'Other uses: running cart total, counting clicks, keeping the last N notifications, computing deltas between values.',
          'Always provide a seed for clarity and correct typing; without one, the first value becomes the initial accumulator.',
          'Return new objects/arrays from the accumulator (immutability) so OnPush and signals see the change.',
          'Signal world equivalent: `signal.update(prev => …)` — but `scan` keeps the state inside the stream.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "`scan` is `reduce` that emits intermediate results" and point out that `reduce` on an infinite stream never emits. The reducer-store example shows you understand how NgRx works under the hood.',
      },
    ],
  },

  'What is takeUntil and how is it used for subscription management? What are modern alternatives?':
    {
      summary:
        '`takeUntil(notifier$)` mirrors the source until `notifier$` emits, then completes — which unsubscribes from the source. The classic Angular pattern is a `destroy$` Subject that emits in `ngOnDestroy`, with `takeUntil(this.destroy$)` as the **last** operator. Modern alternatives: `takeUntilDestroyed()` from `@angular/core/rxjs-interop` (uses `DestroyRef`, no boilerplate), the `async` pipe, and `toSignal()` — all clean up automatically.',
      details: [
        { type: 'heading3', text: 'Classic pattern (pre-Angular 16)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export class PriceTickerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.prices.stream$.pipe(
      map((p) => p.toFixed(2)),
      takeUntil(this.destroy$),          // keep it LAST
    ).subscribe((p) => (this.price = p));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}`,
        },
        { type: 'heading3', text: 'Modern: takeUntilDestroyed()' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class PriceTickerComponent {
  private prices = inject(PriceService);
  private destroyRef = inject(DestroyRef);
  price = signal('');

  constructor() {
    // In an injection context (constructor/field initializer) no argument is needed
    this.prices.stream$.pipe(takeUntilDestroyed()).subscribe((p) => this.price.set(p.toFixed(2)));
  }

  startPolling() {
    // Outside an injection context, pass the DestroyRef explicitly
    interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh());
  }
}`,
        },
        { type: 'heading3', text: "Often best: don't subscribe manually at all" },
        {
          type: 'code',
          lang: 'typescript',
          code: `// async pipe — subscribes on render, unsubscribes on destroy
// template: {{ price$ | async }}
price$ = this.prices.stream$.pipe(map((p) => p.toFixed(2)));

// toSignal — subscribes immediately, unsubscribes when the injector is destroyed
price = toSignal(this.prices.stream$.pipe(map((p) => p.toFixed(2))), { initialValue: '' });`,
        },
        {
          type: 'bullets',
          items: [
            'Place `takeUntil` **last**: operators after it (e.g. a `switchMap`) can keep inner subscriptions alive — there is even an ESLint rule (`rxjs/no-unsafe-takeuntil`).',
            'HTTP observables complete on their own, but unsubscribing still matters to cancel in-flight requests when leaving a page.',
            'Other completion operators: `take(1)`, `first()`, `takeWhile()`.',
            '`DestroyRef.onDestroy(cb)` is the general-purpose cleanup hook behind `takeUntilDestroyed`.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: rank the options — "prefer `async` pipe or `toSignal`; if I must subscribe, `takeUntilDestroyed`; `takeUntil(destroy$)` is the legacy pattern I still see in older code." That ordering shows modern judgement.',
        },
      ],
    },

  'What are schedulers in RxJS and when would you use asyncScheduler vs queueScheduler?': {
    summary:
      'A scheduler controls **when** (and in what execution context) an Observable delivers values. `queueScheduler` runs work synchronously but queues nested/recursive tasks (trampolining) to avoid stack overflows. `asyncScheduler` schedules work as a macrotask with `setTimeout`/`setInterval` — it is what time-based operators (`delay`, `debounceTime`, `interval`) use by default. There are also `asapScheduler` (microtask, like a resolved Promise) and `animationFrameScheduler` (before the next repaint).',
    details: [
      {
        type: 'paragraph',
        text: 'Most application code never touches schedulers directly — operators pick sensible defaults. You reach for them to change timing (`observeOn`), to make recursion safe, to align with animation frames, or to control virtual time in tests (`TestScheduler`).',
      },
      { type: 'heading3', text: 'The built-in schedulers' },
      {
        type: 'bullets',
        items: [
          '**null / no scheduler** (default for `of`, `from`): values delivered synchronously and recursively.',
          '**queueScheduler**: synchronous, but if a scheduled task schedules another, it is queued and run after the current one (trampoline). With a delay > 0 it behaves like `asyncScheduler`.',
          '**asapScheduler**: microtask queue — after current sync code, before `setTimeout`.',
          '**asyncScheduler**: macrotask via `setInterval` — like `setTimeout(fn, 0)` or with a delay.',
          '**animationFrameScheduler**: `requestAnimationFrame` — smooth animations.',
        ],
      },
      { type: 'heading3', text: 'Execution order demo' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { of, scheduled, asyncScheduler, asapScheduler, queueScheduler, observeOn } from 'rxjs';

console.log('start');
scheduled([1], asyncScheduler).subscribe((v) => console.log('async', v));
scheduled([1], asapScheduler).subscribe((v) => console.log('asap', v));
scheduled([1], queueScheduler).subscribe((v) => console.log('queue', v));
of(1).subscribe((v) => console.log('sync', v));
console.log('end');

// start, queue 1, sync 1, end, asap 1, async 1
// (passing a scheduler as the last argument of of()/from() is deprecated — use scheduled())`,
      },
      { type: 'heading3', text: 'queueScheduler: safe recursion' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Recursive scheduling runs iteratively (no deep call stack)
queueScheduler.schedule(function (n = 0) {
  if (n < 100_000) this.schedule(n + 1);   // queued, not nested
});`,
      },
      { type: 'heading3', text: 'asyncScheduler: defer work / time operators' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Deliver values on a later macrotask, e.g. to let the browser paint first
bigList$.pipe(observeOn(asyncScheduler)).subscribe(render);

// Time-based operators accept a scheduler — useful for tests
debounceTime(300, asyncScheduler); // explicit default

// Smooth animation
interval(0, animationFrameScheduler).pipe(takeWhile(() => !done)).subscribe(step);`,
      },
      { type: 'heading3', text: 'Testing with virtual time' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

testScheduler.run(({ cold, expectObservable }) => {
  const input = cold('a-b-c----|');
  expectObservable(input.pipe(debounceTime(3))).toBe('-------c-|'); // no real waiting
});`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "queue = synchronous but trampolined, async = setTimeout macrotask," give the execution-order example, and mention that schedulers matter most in practice for `TestScheduler` marble tests.',
      },
    ],
  },

  'How do you handle errors in RxJS streams? Explain catchError, retry, and retryWhen': {
    summary:
      '`catchError` intercepts an error and returns a replacement Observable — a fallback value (`of([])`), `EMPTY`, or a rethrow with `throwError(() => err)`. `retry(n)` resubscribes to the source up to n times on error. `retryWhen` was the old way to customise retries (delays, conditions) and is **deprecated in RxJS 7** in favour of `retry({ count, delay })`, where `delay` can be a number or a function returning a notifier Observable.',
    details: [
      { type: 'heading3', text: 'catchError — recover or rethrow' },
      {
        type: 'code',
        lang: 'typescript',
        code: `getProducts() {
  return this.http.get<Product[]>('/api/products').pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 404) return of([]);                 // fallback value → stream completes normally
      if (err.status === 0) return EMPTY;                     // offline → complete without a value
      return throwError(() => new AppError('Load failed', err)); // rethrow a domain error
    }),
  );
}`,
      },
      { type: 'heading3', text: 'retry — resubscribe on failure' },
      {
        type: 'code',
        lang: 'typescript',
        code: `this.http.get('/api/data').pipe(
  retry(3),                                 // up to 3 extra attempts immediately
  catchError(() => of(null)),               // give up gracefully after that
);

// RxJS 7 config form: delay, exponential backoff, conditional retry
this.http.get('/api/data').pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => {
      if (error.status && error.status < 500) return throwError(() => error); // don't retry 4xx
      return timer(2 ** retryCount * 500);                                    // 1s, 2s, 4s
    },
    resetOnSuccess: true,
  }),
);`,
      },
      { type: 'heading3', text: 'retryWhen (legacy, deprecated)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// RxJS 6 style — still seen in older code
source$.pipe(
  retryWhen((errors) =>
    errors.pipe(
      scan((count, err) => {
        if (count >= 3) throw err;          // stop retrying → error propagates
        return count + 1;
      }, 0),
      delayWhen((count) => timer(count * 1000)),
    ),
  ),
);
// Modern equivalent: retry({ count: 3, delay: (_, i) => timer(i * 1000) })`,
      },
      {
        type: 'flow',
        title: 'retry then catchError',
        code: `flowchart TD
  S["Subscribe to HTTP"]:::client --> R{"Success?"}
  R -->|Yes| OK["Emit value"]:::server
  R -->|No| C{"Attempts left?<br/>retry"}
  C -->|Yes| W["Wait (delay / backoff)"]:::cache --> S
  C -->|No| CE["catchError:<br/>fallback or rethrow"]:::highlight`,
      },
      {
        type: 'bullets',
        items: [
          'Order matters: `retry` must come **before** `catchError`, otherwise the error is already swallowed.',
          'Retrying works because HTTP observables are cold — resubscribing sends a new request.',
          'Only retry idempotent or safe operations (GET); be careful retrying POSTs.',
          '`finalize()` runs on complete, error or unsubscribe — good for hiding spinners regardless of outcome.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: `catchError` placed on the outer stream of a long-lived chain (e.g. after `switchMap` on `valueChanges`) replaces the whole stream with the fallback and completes it — later events are ignored. Put it on the inner observable.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Should error handling happen before or after subscribing?',
      },
      {
        type: 'paragraph',
        text: 'Mostly **before** — inside `pipe()` with `catchError`/`retry`, placed close to where the error can occur (usually around the inner HTTP call), so you can recover with a fallback and keep the stream alive. The `error` callback in `subscribe()` is a last resort: by the time it runs the stream has already terminated, so it can only report the failure. A global `ErrorHandler`/HTTP interceptor handles cross-cutting concerns like logging and 401s.',
      },
      {
        type: 'paragraph',
        text: 'An Observable that errors is finished. Handling the error in the pipe lets you replace it with a value (or retry) before it reaches the subscriber; handling it in `subscribe` only lets you react after the stream is dead.',
      },
      { type: 'heading3', text: 'In subscribe — stream terminates' },
      {
        type: 'code',
        lang: 'typescript',
        code: `this.search.valueChanges.pipe(
  switchMap((q) => this.api.search(q)),
).subscribe({
  next: (r) => (this.results = r),
  error: (e) => this.toast.error('Search failed'),   // runs once…
});
// …and then the search box is DEAD: valueChanges is unsubscribed, typing does nothing.`,
      },
      { type: 'heading3', text: 'In the pipe, on the inner observable — stream survives' },
      {
        type: 'code',
        lang: 'typescript',
        code: `results$ = this.search.valueChanges.pipe(
  switchMap((q) =>
    this.api.search(q).pipe(
      retry({ count: 2, delay: 500 }),
      catchError((e) => {
        this.toast.error('Search failed');
        return of([]);                 // replace the error with a fallback value
      }),
    ),
  ),
);
// One failed request → empty results; the next keystroke still triggers a new search.`,
      },
      {
        type: 'flow',
        title: 'Where errors are handled',
        code: `flowchart LR
  API["HTTP call"]:::server -->|error| INT["Interceptor<br/>401, logging"]:::security
  INT --> CE["catchError in pipe<br/>fallback / retry"]:::highlight
  CE -->|value| SUB["subscribe next"]:::client
  CE -.->|"rethrown"| ERR["subscribe error<br/>last resort"]:::external
  ERR -.-> GEH["Global ErrorHandler"]:::external`,
      },
      {
        type: 'bullets',
        items: [
          '**Pipe (`catchError`)**: recover, map to a user-friendly state, retry — the right place for most logic.',
          '**Inner vs outer**: put `catchError` inside `switchMap`/`mergeMap` to protect long-lived outer streams.',
          '**subscribe error callback**: final notification (e.g. show a toast) when you deliberately let the error through.',
          '**Interceptor / `ErrorHandler`**: app-wide concerns — auth redirects, logging to Sentry, generic messages.',
          'An unhandled error in an Observable with no error callback is reported asynchronously (RxJS 7 rethrows it on a timeout) and ends up in the global error handler.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "before, in the pipe — because an error terminates the stream" and show the dead-search-box example. That cause-and-effect explanation is what interviewers want.',
      },
    ],
  },

  'How to handle errors and retry an API call up to 3 times using RxJS?': {
    summary:
      "Pipe the HTTP call through `retry({ count: 3, delay: … })` and then `catchError` to handle the final failure. Because `HttpClient` observables are cold, each retry resubscribes and sends a fresh request — so you get 1 original attempt + up to 3 retries. Add a delay or exponential backoff, and skip retries for errors that won't succeed (4xx).",
    details: [
      { type: 'heading3', text: 'Simplest version' },
      {
        type: 'code',
        lang: 'typescript',
        code: `getOrders(): Observable<Order[]> {
  return this.http.get<Order[]>('/api/orders').pipe(
    retry(3),                                     // up to 3 retries, immediately
    catchError((err) => {
      console.error('Failed after 4 attempts', err);
      return of([]);                              // fallback so the UI still renders
    }),
  );
}`,
      },
      { type: 'heading3', text: 'Production version: backoff + only transient errors' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { retry, timer, throwError, catchError } from 'rxjs';

const isTransient = (e: unknown) =>
  e instanceof HttpErrorResponse && (e.status === 0 || e.status === 429 || e.status >= 500);

getOrders(): Observable<Order[]> {
  return this.http.get<Order[]>('/api/orders').pipe(
    retry({
      count: 3,
      delay: (error, attempt) =>
        isTransient(error)
          ? timer(Math.min(1000 * 2 ** (attempt - 1), 8000))  // 1s, 2s, 4s
          : throwError(() => error),                           // 400/401/403/404 → fail fast
    }),
    catchError((error: HttpErrorResponse) => {
      this.notify.error('Could not load orders. Please try again.');
      return throwError(() => error);                          // or return of([]) for a fallback
    }),
  );
}`,
      },
      { type: 'heading3', text: 'As a reusable interceptor' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  req.method === 'GET'                                   // only retry idempotent requests
    ? next(req).pipe(retry({ count: 3, delay: (e, i) => (isTransient(e) ? timer(i * 1000) : throwError(() => e)) }))
    : next(req);

// app.config.ts → provideHttpClient(withInterceptors([retryInterceptor]))`,
      },
      {
        type: 'flow',
        title: 'Attempts timeline',
        code: `sequenceDiagram
  participant C as Component
  participant A as API
  C->>A: attempt 1
  A-->>C: 503
  Note over C: wait 1s
  C->>A: retry 1
  A-->>C: 503
  Note over C: wait 2s
  C->>A: retry 2
  A-->>C: 200 OK
  Note over C: value emitted, no catchError`,
      },
      {
        type: 'bullets',
        items: [
          '`retry(3)` means 3 **re**-tries → up to 4 requests total.',
          'Put `retry` before `catchError`.',
          'Retry only GETs or idempotent writes (with idempotency keys) to avoid duplicate side effects.',
          'Test with `HttpTestingController`: `expectOne` + `flush(…, { status: 500 })` four times, or fake timers for the delays.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: write the `retry({ count, delay })` form — `retryWhen` is deprecated in RxJS 7 — and mention not retrying 4xx errors. That shows production thinking beyond `retry(3)`.',
      },
    ],
  },

  'Explain the complete RxJS flow: API response, subscribe, and error handling': {
    summary:
      "A service method returns a cold `HttpClient` Observable (nothing sent yet). The component composes it with operators — `map` to shape data, `retry`/`catchError` for failures, `finalize` for cleanup — and something subscribes (the `async` pipe, `toSignal()`, or `subscribe()`), which sends the request. The interceptor chain runs, the response flows back through the operators to `next`, followed by `complete`; on failure the error travels down until a `catchError` handles it or it reaches the subscriber's `error` callback. Unsubscribing early cancels the request.",
    details: [
      { type: 'heading3', text: "1. Service — returns the stream, doesn't subscribe" },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class UserApi {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<UserDto[]>>('/api/users').pipe(
      map((res) => res.data.map(toUser)),             // shape the data
      retry({ count: 2, delay: 1000 }),               // transient failures
    );
  }
}`,
      },
      { type: 'heading3', text: '2. Interceptor — cross-cutting concerns' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(['/login']);
      inject(Logger).log(err);
      return throwError(() => err);                   // let the caller decide what the UI shows
    }),
  );`,
      },
      { type: 'heading3', text: '3. Component — UI state, subscription' },
      {
        type: 'code',
        lang: 'typescript',
        code: `type State = { status: 'loading' } | { status: 'ok'; users: User[] } | { status: 'error'; message: string };

@Component({
  selector: 'app-users',
  template: \`
    @switch (state().status) {
      @case ('loading') { <app-spinner /> }
      @case ('error')   { <p class="error">Could not load users.</p> }
      @case ('ok')      { @for (u of $any(state()).users; track u.id) { <p>{{ u.fullName }}</p> } }
    }
  \`,
})
export class UsersComponent {
  private api = inject(UserApi);

  state = toSignal(
    this.api.getUsers().pipe(
      map((users): State => ({ status: 'ok', users })),
      catchError(() => of<State>({ status: 'error', message: 'Load failed' })),
      startWith<State>({ status: 'loading' }),
    ),
    { requireSync: true },                // startWith emits synchronously
  );
}
// Subscription starts when toSignal runs; it is cleaned up when the component is destroyed.`,
      },
      {
        type: 'flow',
        title: 'End-to-end flow',
        code: `sequenceDiagram
  participant C as Component (toSignal / async)
  participant S as UserApi pipe
  participant I as Interceptors
  participant B as Backend
  C->>S: subscribe
  S->>I: request
  I->>B: GET /api/users
  alt 200 OK
    B-->>I: JSON
    I-->>S: HttpResponse
    S-->>C: next(users) then complete
  else 500 / network error
    B-->>I: error
    I-->>S: error (logged, rethrown)
    S->>B: retry up to 2x
    S-->>C: catchError gives error state
  end`,
      },
      {
        type: 'bullets',
        items: [
          '**Cold & lazy**: no request until subscription; each subscription = new request (use `shareReplay` to share).',
          '**HttpClient emits once and completes** — no manual unsubscribe needed for completion, but unsubscribing early aborts the request.',
          '**Error path**: error skips `map`/`next` and travels to the nearest `catchError`; if none, to `subscribe({ error })`; if none, to the global `ErrorHandler`.',
          '**Responsibilities**: interceptor = global (auth, logging), service = data shaping/retries, component = UI state.',
          'Legacy equivalent: `ngOnInit() { this.api.getUsers().subscribe({ next, error, complete }) }` with manual loading flags.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: walk through it in order — cold observable → subscribe → interceptors → response → operators → next/complete — then trace the error path separately. Mentioning cancellation on unsubscribe rounds it out.',
      },
    ],
  },

  "You're building a type-ahead search — implement it using RxJS operators, handling debounce, cancellation of in-flight requests, and deduplication":
    {
      summary:
        "Pipe the input's value stream through `map(trim)` → `filter(min length)` → `debounceTime(300)` (wait for typing to pause) → `distinctUntilChanged()` (skip repeated terms) → `switchMap` to the HTTP call (cancels the previous in-flight request when a new term arrives), with `catchError` **inside** the `switchMap` so one failed request doesn't kill the search, and render via `async` pipe or `toSignal`.",
      details: [
        { type: 'heading3', text: 'Full implementation (standalone component + signals)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule],
  template: \`
    <input [formControl]="query" placeholder="Search products" aria-label="Search products" />
    @if (vm().loading) { <span class="spinner">Searching…</span> }
    @if (vm().error) { <p class="error">{{ vm().error }}</p> }
    <ul>
      @for (p of vm().results; track p.id) { <li>{{ p.name }}</li> }
      @empty { @if (vm().term) { <li>No results for "{{ vm().term }}"</li> } }
    </ul>
  \`,
})
export class ProductSearchComponent {
  private api = inject(ProductApi);
  query = new FormControl('', { nonNullable: true });

  private vm$ = this.query.valueChanges.pipe(
    map((v) => v.trim().toLowerCase()),
    debounceTime(300),                         // 1. wait until typing pauses
    distinctUntilChanged(),                    // 2. dedupe: "abc" → "abcd" → "abc" within the window = 1 call
    switchMap((term) => {
      if (term.length < 2) return of({ term, results: [], loading: false, error: null });
      return this.api.search(term).pipe(       // 3. switchMap cancels the previous request
        map((results) => ({ term, results, loading: false, error: null })),
        catchError(() => of({ term, results: [], loading: false, error: 'Search failed, try again' })),
        startWith({ term, results: [], loading: true, error: null }),
      );
    }),
  );

  vm = toSignal(this.vm$, {
    initialValue: { term: '', results: [] as Product[], loading: false, error: null as string | null },
  });
}`,
        },
        { type: 'heading3', text: 'Optional: cache results to avoid repeat calls' },
        {
          type: 'code',
          lang: 'typescript',
          code: `private cache = new Map<string, Product[]>();

search(term: string): Observable<Product[]> {
  const hit = this.cache.get(term);
  if (hit) return of(hit);
  return this.http.get<Product[]>('/api/products', { params: { q: term } }).pipe(
    tap((res) => this.cache.set(term, res)),
  );
}`,
        },
        {
          type: 'flow',
          title: 'Type-ahead pipeline',
          code: `flowchart LR
  K["keystrokes"]:::client --> D["debounceTime 300"]:::server --> DC["distinctUntilChanged"]:::server --> F{"length >= 2?"}
  F -->|no| E["empty results"]:::external
  F -->|yes| SW["switchMap<br/>cancel old request"]:::highlight --> API["GET /api/products?q="]:::network
  API --> CE["catchError inside<br/>keeps stream alive"]:::security --> UI["toSignal / template"]:::client`,
        },
        {
          type: 'bullets',
          items: [
            '**Debounce** → fewer requests while typing.',
            "**distinctUntilChanged** → no request if the term didn't really change (e.g. typing then deleting a char, or trailing spaces after `trim`).",
            '**switchMap** → stale responses can\'t overwrite newer results (no race conditions); aborted requests show as "canceled" in DevTools.',
            '**catchError inside** → the outer `valueChanges` stream survives errors.',
            'Accessibility: announce result counts with `aria-live`; consider a minimum length and server-side rate limiting.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Common mistake: `mergeMap` instead of `switchMap` — responses can arrive out of order, so results for "an" might overwrite results for "angular". `switchMap` eliminates that race.',
        },
      ],
    },

  'A user clicks a button 10 times and 10 API calls are triggered. How would you handle this using RxJS?':
    {
      summary:
        'Turn the clicks into a stream and pick the operator that matches the intent: `exhaustMap` to ignore clicks while a request is running (submit/save — usually the right answer), `switchMap` if only the latest click matters (refresh), `throttleTime`/`debounceTime` to rate-limit, or `concatMap` if every click must be processed in order. Combine with disabling the button for UX and idempotency on the server.',
      details: [
        { type: 'heading3', text: 'Option 1 — exhaustMap: ignore clicks while busy' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-save',
  template: \`<button (click)="clicks.next()" [disabled]="saving()">Save</button>\`,
})
export class SaveComponent {
  private api = inject(Api);
  clicks = new Subject<void>();
  saving = signal(false);

  constructor() {
    this.clicks.pipe(
      exhaustMap(() => {
        this.saving.set(true);
        return this.api.save().pipe(
          catchError(() => EMPTY),
          finalize(() => this.saving.set(false)),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }
}
// 10 rapid clicks → 1 request; clicks after it finishes start a new one.`,
        },
        { type: 'heading3', text: 'Option 2 — switchMap: only the latest click matters' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// "Refresh" button: a newer click cancels the in-flight request
data$ = this.refresh$.pipe(switchMap(() => this.api.load()));
// 10 clicks → up to 10 requests started, 9 cancelled client-side, 1 result used`,
        },
        { type: 'heading3', text: 'Option 3 — time-based rate limiting' },
        {
          type: 'code',
          lang: 'typescript',
          code: `this.clicks.pipe(throttleTime(1000)).subscribe(() => this.api.like());   // at most 1/second, first click wins
this.clicks.pipe(debounceTime(500)).subscribe(() => this.api.save());    // fire once after clicking stops`,
        },
        {
          type: 'bullets',
          items: [
            '**exhaustMap** — submit, login, payment, "create" actions (no duplicates).',
            '**switchMap** — refresh/reload where the newest request supersedes older ones (reads only).',
            '**concatMap** — every click is meaningful and order matters (e.g. "add one item" × 10 should add 10 items, sequentially).',
            '**throttleTime / debounceTime** — rate limiting regardless of request duration.',
            'Defense in depth: disable the button while pending and make the backend idempotent (idempotency key).',
          ],
        },
        {
          type: 'flow',
          title: '10 clicks, different strategies',
          code: `flowchart LR
  C["10 rapid clicks"]:::client --> EX["exhaustMap<br/>1 request"]:::highlight
  C --> SW["switchMap<br/>9 cancelled, 1 result"]:::network
  C --> CM["concatMap<br/>10 sequential"]:::server
  C --> TH["throttleTime 1s<br/>1 per second"]:::cache`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: ask (or state) the intent first — "should extra clicks be ignored, replace the previous one, or all be processed?" — then pick the operator. For a save button, `exhaustMap` + disabled button is the expected answer.',
        },
      ],
    },

  'You have a payment form where the user clicks Submit. How do you prevent duplicate submissions using RxJS? Which operator do you choose and why?':
    {
      summary:
        "`exhaustMap`. While the payment request is in flight it **ignores** further submit events, so double-clicks or Enter-key repeats can't create a second charge, and it doesn't cancel the request that's already running. `switchMap` is wrong (it would cancel a payment that may already have reached the server), `mergeMap` would send duplicates, and `concatMap` would queue a second payment. Back it up with a disabled button and a server-side idempotency key.",
      details: [
        { type: 'heading3', text: 'Implementation' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-payment',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="form" (ngSubmit)="submit$.next()">
      <!-- card fields via the payment provider's hosted fields -->
      <button type="submit" [disabled]="form.invalid || status() === 'pending'">
        {{ status() === 'pending' ? 'Processing…' : 'Pay now' }}
      </button>
    </form>
  \`,
})
export class PaymentComponent {
  private api = inject(PaymentApi);
  private router = inject(Router);
  form = inject(FormBuilder).nonNullable.group({ amount: [0, Validators.min(1)] });
  submit$ = new Subject<void>();
  status = signal<'idle' | 'pending' | 'error'>('idle');

  constructor() {
    this.submit$.pipe(
      filter(() => this.form.valid),
      exhaustMap(() => {
        this.status.set('pending');
        const idempotencyKey = crypto.randomUUID();       // same key if the client retries
        return this.api.pay(this.form.getRawValue(), idempotencyKey).pipe(
          tap((res) => this.router.navigate(['/receipt', res.id])),
          catchError(() => {
            this.status.set('error');
            return EMPTY;                                  // keep submit$ alive for a manual retry
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();
  }
}`,
        },
        { type: 'heading3', text: 'Why not the others?' },
        {
          type: 'bullets',
          items: [
            '**switchMap**: a second click cancels the first HTTP call client-side — but the server may already have charged the card. You lose the response and may charge again.',
            '**mergeMap**: every click starts a parallel payment → duplicate charges.',
            '**concatMap**: clicks are queued → the second payment runs after the first.',
            '**debounceTime/throttleTime**: time-based guesses; a slow request (> window) still allows duplicates.',
            '**exhaustMap**: exactly "one at a time, ignore extras until done" ✅.',
          ],
        },
        {
          type: 'flow',
          title: 'exhaustMap on a payment button',
          code: `sequenceDiagram
  participant U as User
  participant E as exhaustMap
  participant API as Payment API
  U->>E: click 1
  E->>API: POST /pay (key K1)
  U->>E: click 2 (ignored)
  U->>E: click 3 (ignored)
  API-->>E: 200 OK
  E-->>U: navigate to receipt`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Frontend prevention is not enough for money: the server must enforce idempotency (an `Idempotency-Key` header, as payment providers like Stripe support) so retries, refreshes or a second tab can never double-charge.',
        },
      ],
    },

  "You need to poll an API every 10 seconds but stop polling when the component is destroyed. Show how you'd implement this":
    {
      summary:
        "Use `timer(0, 10_000)` (immediate first call, then every 10s) and `switchMap` to the HTTP call, so a slow response is cancelled when the next tick fires — or `exhaustMap` to skip a tick while a request is still running. Stop it automatically with `takeUntilDestroyed()` (or consume it via `toSignal`/`async` pipe, which unsubscribe on destroy). Add `catchError` inside the inner call so one failure doesn't stop polling.",
      details: [
        { type: 'heading3', text: 'Modern implementation' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-order-status',
  template: \`
    @if (status(); as s) { <p>Order {{ s.id }}: {{ s.state }}</p> }
  \`,
})
export class OrderStatusComponent {
  private api = inject(OrderApi);
  orderId = input.required<string>();

  private status$ = toObservable(this.orderId).pipe(
    switchMap((id) =>
      timer(0, 10_000).pipe(                              // tick now, then every 10s
        exhaustMap(() =>                                   // don't overlap requests
          this.api.getStatus(id).pipe(catchError(() => EMPTY)), // a failed poll is skipped
        ),
        takeWhile((s) => s.state !== 'DELIVERED', true),   // optional: stop when done (inclusive)
      ),
    ),
  );

  // toSignal unsubscribes when the component is destroyed → polling stops
  status = toSignal(this.status$);
}`,
        },
        { type: 'heading3', text: 'With explicit subscribe + takeUntilDestroyed' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export class DashboardComponent {
  private api = inject(MetricsApi);
  metrics = signal<Metrics | null>(null);

  constructor() {
    timer(0, 10_000).pipe(
      switchMap(() => this.api.getMetrics().pipe(catchError(() => EMPTY))),
      takeUntilDestroyed(),                       // completes when the component is destroyed
    ).subscribe((m) => this.metrics.set(m));
  }
}`,
        },
        { type: 'heading3', text: 'Legacy version (pre-Angular 16)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  ngOnInit() {
    interval(10_000).pipe(
      startWith(0),
      switchMap(() => this.api.getMetrics()),
      takeUntil(this.destroy$),
    ).subscribe((m) => (this.metrics = m));
  }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}`,
        },
        {
          type: 'flow',
          title: 'Polling lifecycle',
          code: `stateDiagram-v2
  [*] --> Polling: component created, timer(0, 10s)
  Polling --> Requesting: tick
  Requesting --> Polling: response or error swallowed
  Polling --> Stopped: component destroyed (takeUntilDestroyed)
  Polling --> Stopped: status DELIVERED (takeWhile)
  Stopped --> [*]`,
        },
        {
          type: 'bullets',
          items: [
            '`interval(10000)` waits 10s before the first call; `timer(0, 10000)` fires immediately.',
            '`switchMap` vs `exhaustMap`: switch cancels a slow request at the next tick; exhaust skips ticks while busy (no overlap, no cancellation).',
            'For back-off when the server is unhealthy, use `retry({ delay })` or adjust the interval dynamically.',
            'Pause when the tab is hidden: combine with `fromEvent(document, "visibilitychange")` to save requests.',
            'Consider server push (WebSocket/SSE) if polling frequency must be high.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Pitfall: forgetting to unsubscribe — `interval` never completes, so polling continues after navigation, multiplying with each visit. `takeUntilDestroyed`, `toSignal` or the `async` pipe prevent this.',
        },
      ],
    },

  'An observable chain emits an error and the entire stream terminates. How do you architect a resilient stream that recovers gracefully?':
    {
      summary:
        'Isolate failures in the **inner** observable: wrap each unit of work (each HTTP call inside `switchMap`/`concatMap`) with `retry` and `catchError` that returns a fallback or an error-state value, so the long-lived **outer** stream never sees the error. Model errors as data (`{ status: "error" }`) instead of terminating, use `retry({ delay })` with backoff for transient failures, and for infinite sources (WebSocket) resubscribe with `retry` after a delay. Log centrally, show a recoverable UI state.',
      details: [
        {
          type: 'paragraph',
          text: "The rule of the Observable contract — after `error`, nothing more is delivered — is not a bug; it's why the design matters. You decide **where** an error is allowed to stop things: usually only the single request, never the event stream that drives the feature.",
        },
        { type: 'heading3', text: 'Anti-pattern: catchError on the outer stream' },
        {
          type: 'code',
          lang: 'typescript',
          code: `this.refresh$.pipe(
  switchMap(() => this.api.load()),
  catchError(() => of([])),       // ❌ outer stream replaced by of([]) → completes; refresh$ is dead
).subscribe(render);`,
        },
        { type: 'heading3', text: 'Pattern 1: catch inside the flattening operator' },
        {
          type: 'code',
          lang: 'typescript',
          code: `this.refresh$.pipe(
  switchMap(() =>
    this.api.load().pipe(
      retry({ count: 2, delay: (_, i) => timer(i * 1000) }),  // transient failures
      catchError((err) => {
        this.logger.error(err);
        return of([]);                                        // fallback for THIS request only
      }),
    ),
  ),
).subscribe(render);   // ✅ next refresh still works`,
        },
        { type: 'heading3', text: 'Pattern 2: errors as values (state machine)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `type Result<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown };

export function toResult<T>() {
  return (source: Observable<T>): Observable<Result<T>> =>
    source.pipe(
      map((data) => ({ status: 'success', data }) as const),
      catchError((error) => of({ status: 'error', error } as const)),
      startWith({ status: 'loading' } as const),
    );
}

vm$ = this.filters$.pipe(switchMap((f) => this.api.search(f).pipe(toResult())));
// Template renders spinner / data / "Retry" button from vm.status — the stream never dies.`,
        },
        { type: 'heading3', text: 'Pattern 3: self-healing infinite sources' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// WebSocket that reconnects with exponential backoff (capped at 30s)
prices$ = defer(() => webSocket<Price>('wss://example.com/prices')).pipe(
  retry({
    delay: (_, attempt) => timer(Math.min(1000 * 2 ** attempt, 30_000)),
    resetOnSuccess: true,             // reset the backoff after a successful message
  }),
  shareReplay({ bufferSize: 1, refCount: true }),
);`,
        },
        {
          type: 'flow',
          title: 'Resilient stream architecture',
          code: `flowchart LR
  T["Trigger stream<br/>(clicks, filters, timer)"]:::client --> SW["switchMap / concatMap"]:::server
  SW --> IN["Inner request"]:::network
  IN --> R["retry with backoff"]:::cache
  R --> CE["catchError: fallback<br/>or error-state value"]:::highlight
  CE --> SW
  SW --> UI["UI renders<br/>loading / data / error"]:::client
  CE -.->|log| LOG["Logger / Sentry"]:::external`,
        },
        {
          type: 'bullets',
          items: [
            '**Boundary**: one failure should affect one request, not the feature.',
            '**Retry only transient errors** (network, 5xx, 429); fail fast on 4xx.',
            '**Fallbacks**: cached last-good value, empty list, or an error state with a "Try again" action that pushes into the trigger Subject.',
            '**Observability**: log in `catchError` or `tap({ error })` so swallowed errors are still visible.',
            "**Cleanup**: `finalize` for spinners; `takeUntilDestroyed` so recovery loops don't outlive the component.",
            'Global safety net: an HTTP error interceptor + custom `ErrorHandler`.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: the key phrase is "handle errors on the inner observable and treat errors as data." Draw the outer/inner distinction — it\'s the architectural insight interviewers are testing.',
        },
      ],
    },
};
