import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What are Signals in Angular?': {
    summary:
      'A signal is a reactive wrapper around a value that notifies its consumers when the value changes. You read it by calling it (`count()`), write with `set()`/`update()`, derive values with `computed()`, and run side effects with `effect()`. Angular tracks which signals a template reads, so it knows exactly which views to update — the foundation of fine-grained, zoneless change detection.',
    details: [
      {
        type: 'paragraph',
        text: 'Think of a spreadsheet: cell A1 holds a value, B1 has a formula `=A1*2`. Change A1 and B1 updates automatically, and only the cells that depend on A1 recalculate. Signals bring that model to Angular: writable signals are the input cells, `computed` are formulas, and templates/effects are the things that display or react to them.',
      },
      { type: 'heading3', text: 'Basic API' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { signal, computed, effect } from '@angular/core';

const count = signal(0);               // WritableSignal<number>
const double = computed(() => count() * 2); // Signal<number>, read-only

console.log(count(), double());        // 0 0
count.set(5);
console.log(double());                 // 10 — recomputed lazily on read
count.update(c => c + 1);              // 6

effect(() => console.log('count changed to', count())); // must run in an injection context`,
      },
      { type: 'heading3', text: 'In a component' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <p>{{ items().length }} items — total {{ total() | currency }}</p>
    <button (click)="add({ name: 'Pen', price: 20 })">Add pen</button>
  \`,
})
export class CartComponent {
  items = signal<Item[]>([]);
  total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

  add(item: Item) {
    this.items.update(list => [...list, item]); // new array → consumers notified
  }
}`,
      },
      {
        type: 'flow',
        title: 'Signal dependency graph',
        code: `flowchart LR
  I["items (writable signal)"]:::client --> T["total = computed(...)"]:::highlight
  I --> V["Template view"]:::server
  T --> V
  I --> E["effect: save to localStorage"]:::external
  V --> D["DOM update for this view only"]:::db`,
      },
      {
        type: 'bullets',
        items: [
          'Signals are synchronous and always have a current value — no subscribe/unsubscribe.',
          'Dependency tracking is automatic: whatever signals a `computed`/`effect`/template reads during execution become its dependencies.',
          'Equality check: setting the same value (by `Object.is`) does not notify. Mutating an object in place does not notify either — produce a new reference.',
          'Signal-based APIs across Angular: `input()`, `model()`, `output()`, `viewChild()`, `contentChildren()`, `toSignal()`, `linkedSignal()`, `resource()`.',
          'Expose read-only state from services with `asReadonly()`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: define signals, show `signal/computed/effect`, then explain WHY Angular added them — precise change detection (only affected views update), enabling zoneless apps, and simpler state than RxJS for synchronous UI state.',
      },
    ],
  },

  'Explain different types of Signals and the use case of computed().': {
    summary:
      'Main kinds: writable signals (`signal()` — state you set), computed signals (`computed()` — read-only values derived from other signals, lazy and memoized), and effects (`effect()` — side effects, not signals themselves). Plus specialised ones: `input()`/`model()` for component inputs, `linkedSignal()` for writable state that resets from a source, `toSignal()` from observables, query signals (`viewChild()`), and `resource()` for async data. Use `computed()` for any value that can be calculated from other state.',
    details: [
      {
        type: 'paragraph',
        text: '`computed()` is the workhorse: instead of storing a value AND keeping it in sync manually, you describe how to calculate it and Angular keeps it correct. It only recalculates when a dependency changes and someone reads it, and it caches the result between reads.',
      },
      { type: 'heading3', text: 'The signal family' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ProductPageComponent {
  // 1. Writable — local state
  quantity = signal(1);

  // 2. Inputs — read-only signals set by the parent; model() is two-way
  product = input.required<Product>();
  favorite = model(false);                 // <app-product [(favorite)]="isFav" />

  // 3. Computed — derived, read-only, memoized
  total = computed(() => this.product().price * this.quantity());

  // 4. Linked — writable, but resets when its source changes
  selectedSize = linkedSignal(() => this.product().sizes[0]);

  // 5. From RxJS
  stock = toSignal(inject(StockApi).watch(), { initialValue: 0 });

  // 6. Queries
  qtyInput = viewChild<ElementRef<HTMLInputElement>>('qty');

  // Effect — not a signal; runs side effects when dependencies change
  private log = effect(() => console.log('total is', this.total()));
}`,
      },
      { type: 'heading3', text: 'Why computed() and not a method or an effect?' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ Method in the template: runs on every change-detection pass
getTotal() { return this.items().reduce((s, i) => s + i.price, 0); }

// ❌ Effect that writes another signal: extra step, glitchy intermediate states
constructor() { effect(() => this.totalSig.set(this.items().reduce(...))); }

// ✅ computed: recalculated only when items changes, cached otherwise
total = computed(() => this.items().reduce((s, i) => s + i.price, 0));

// Dynamic dependencies: only signals actually read are tracked
label = computed(() => this.showDiscount() ? \`\${this.discounted()} (sale)\` : \`\${this.total()}\`);
// while showDiscount() is false, changes to discounted() don't trigger recomputation`,
      },
      {
        type: 'bullets',
        items: [
          '`computed` use cases: totals, filtered/sorted lists, form validity, view flags (`isEmpty`, `canSubmit`), formatting.',
          'It is **lazy**: never read → never computed. **Memoized**: repeated reads return the cached value.',
          'It must be pure — no side effects, no writing to other signals inside.',
          'Custom equality: `computed(fn, { equal: (a, b) => a.id === b.id })` to avoid notifying for equivalent results.',
          '`linkedSignal` covers the "derived but user can override" case (e.g. a selection that resets when the list changes) that `computed` can\'t, since computed is read-only.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a strong rule to quote — "if it can be derived, make it `computed`; use `effect` only to sync with the outside world (DOM APIs, storage, logging)". `resource()`/`rxResource()` are newer APIs; mention them as async signals but note their status may be experimental depending on version.',
      },
    ],
  },

  'Difference between Computed Signal and Effect': {
    summary:
      '`computed()` produces a new read-only signal whose value is derived purely from other signals — lazy, memoized, no side effects. `effect()` produces no value; it runs a function for its side effects (DOM, storage, logging, calling non-signal APIs) whenever the signals it reads change, scheduled asynchronously. Use computed for derivation, effect for syncing with the outside world.',
    details: [
      {
        type: 'paragraph',
        text: 'Both track dependencies automatically, which is why they are confused. The difference is intent: computed answers "what is the value?", effect answers "what should happen when this changes?". Using an effect to compute and `set` another signal is the most common anti-pattern.',
      },
      { type: 'heading3', text: 'Side by side' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class SearchComponent {
  query = signal('');
  results = signal<Item[]>([]);

  // computed: pure derivation
  resultCount = computed(() => this.results().length);
  hasQuery = computed(() => this.query().trim().length > 0);

  constructor() {
    // effect: side effects only
    effect(() => {
      localStorage.setItem('lastQuery', this.query()); // persist
    });

    effect((onCleanup) => {
      const id = setTimeout(() => analytics.track('search', this.query()), 500);
      onCleanup(() => clearTimeout(id)); // runs before the next execution / on destroy
    });
  }
}`,
      },
      { type: 'heading3', text: 'Anti-pattern' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ Deriving with an effect
fullName = signal('');
constructor() {
  effect(() => this.fullName.set(\`\${this.first()} \${this.last()}\`));
}
// Problems: an extra async step (stale value briefly), harder to follow, risk of loops.

// ✅ Derive with computed
fullName = computed(() => \`\${this.first()} \${this.last()}\`);`,
      },
      { type: 'heading3', text: 'Comparison' },
      {
        type: 'bullets',
        items: [
          '**Returns**: computed → `Signal<T>`. effect → `EffectRef` (to `destroy()` it), no value.',
          '**Execution**: computed is lazy (on read) and synchronous. effect is eager and scheduled — it runs at least once, then after dependencies change, as part of change detection.',
          '**Purity**: computed must be pure. effect exists for impurity.',
          '**Context**: effect needs an injection context (constructor/field) or an explicit `injector`; it is destroyed with its component/service. computed can be created anywhere.',
          "**Writes**: computed can't write signals. Effects may write signals (allowed in current Angular) but it usually indicates a missing computed/linkedSignal.",
          '`untracked(() => x())` reads a signal inside either without making it a dependency.',
        ],
      },
      {
        type: 'flow',
        title: 'Which one?',
        code: `flowchart TD
  Q{"Do you need a VALUE<br/>derived from signals?"} -->|Yes| C["computed()"]:::highlight
  Q -->|No| S{"Do you need to touch the<br/>outside world when they change?"}
  S -->|"Yes: DOM, storage, logging, 3rd-party lib"| E["effect()"]:::server
  S -->|"Derived but user-editable"| L["linkedSignal()"]:::client`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Pitfall: reading a signal you don't want as a dependency inside an effect (e.g. a user object while logging) makes the effect re-run unexpectedly — wrap that read in `untracked()`.",
      },
    ],
  },

  'Difference between Signals and BehaviorSubject': {
    summary:
      'Both hold a current value and notify on change. A signal is read synchronously by calling it, tracks dependents automatically, needs no subscription or unsubscribe, and integrates with Angular change detection. A BehaviorSubject is an RxJS stream: you subscribe (and must unsubscribe), can compose it with operators like `debounceTime` or `switchMap`, and every `next()` emits — even the same value. Signals are for state; BehaviorSubject for state that is part of an async event pipeline.',
    details: [
      {
        type: 'paragraph',
        text: 'For years the "state service" pattern in Angular was a private `BehaviorSubject` plus a public `asObservable()`. Signals now cover that pattern with less code, and with `computed()` replacing `combineLatest` + `map` for derived state.',
      },
      { type: 'heading3', text: 'Same store, two ways' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// BehaviorSubject version
@Injectable({ providedIn: 'root' })
export class CartStoreRx {
  private items$$ = new BehaviorSubject<Item[]>([]);
  items$ = this.items$$.asObservable();
  total$ = this.items$.pipe(map(items => items.reduce((s, i) => s + i.price, 0)));
  add(i: Item) { this.items$$.next([...this.items$$.value, i]); }
}
// template: {{ total$ | async }}  — or subscribe + unsubscribe in code

// Signal version
@Injectable({ providedIn: 'root' })
export class CartStore {
  private _items = signal<Item[]>([]);
  items = this._items.asReadonly();
  total = computed(() => this._items().reduce((s, i) => s + i.price, 0));
  add(i: Item) { this._items.update(list => [...list, i]); }
}
// template: {{ total() }}  — no pipe, no subscription`,
      },
      { type: 'heading3', text: 'Behavioural differences' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const s = signal(1);
s.set(1);              // no notification — equal value (Object.is)

const b = new BehaviorSubject(1);
b.subscribe(v => console.log('emit', v)); // emit 1 (replays current value)
b.next(1);             // emit 1 — emits again, unless you add distinctUntilChanged()

// Glitches: signals are glitch-free
const a = signal(1);
const sum = computed(() => a() + a() * 10);
a.set(2);              // sum() → 22, never an intermediate mixed value
// combineLatest on two derived observables of the same source can emit an intermediate value.`,
      },
      {
        type: 'bullets',
        items: [
          '**Reading**: `sig()` anywhere, synchronously vs `.value` (imperative) or `subscribe`.',
          '**Cleanup**: signals — none needed. BehaviorSubject — unsubscribe, `async` pipe or `takeUntilDestroyed()`.',
          '**Derivation**: `computed()` vs `pipe(map, combineLatest...)`.',
          '**Time/async operators**: only RxJS (debounce, retry, switchMap, buffering).',
          '**Change detection**: signals notify Angular precisely (OnPush/zoneless-friendly); a BehaviorSubject needs the `async` pipe or `toSignal()` to do so.',
          '**Interop**: `toSignal(subject$)` and `toObservable(signal)` from `@angular/core/rxjs-interop`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: "Interview tip: say you'd now use a signal for a simple state service, and keep BehaviorSubject (or any observable) where state feeds operators like `switchMap`/`debounceTime` — then mention `toSignal` to bridge at the edge.",
      },
    ],
  },

  'Difference between Signals and RxJS': {
    summary:
      'Signals model **values that change over time** — synchronous, always have a current value, automatically tracked, no subscriptions. RxJS models **streams of events** — push-based, can be async, may have no current value, with powerful operators for timing, cancellation and composition. Signals are best for UI/application state; RxJS for async workflows (HTTP races, debouncing, websockets). They complement each other via `toSignal`/`toObservable`.',
    details: [
      {
        type: 'paragraph',
        text: 'A useful mental model: a signal is like a variable you can watch; an observable is like a pipe that events flow through. "What is the current search term?" is a signal question. "When the user stops typing for 300ms, cancel the previous request and fetch new results" is an RxJS question.',
      },
      { type: 'heading3', text: 'Using both together — typeahead' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-typeahead',
  template: \`
    <input [value]="query()" (input)="query.set($any($event.target).value)" />
    @for (r of results(); track r.id) { <li>{{ r.name }}</li> }
    <small>{{ resultCount() }} results</small>
  \`,
})
export class TypeaheadComponent {
  private api = inject(SearchApi);

  query = signal('');                                  // state → signal

  results = toSignal(
    toObservable(this.query).pipe(                     // signal → stream
      debounceTime(300),                               // timing: RxJS
      distinctUntilChanged(),
      switchMap(q => (q ? this.api.search(q) : of([]))), // cancellation: RxJS
    ),
    { initialValue: [] },                              // stream → signal
  );

  resultCount = computed(() => this.results().length); // derivation: signal
}`,
      },
      { type: 'heading3', text: 'Key differences' },
      {
        type: 'bullets',
        items: [
          '**Value vs events**: a signal always has a value; an observable may emit 0..n values, then complete or error.',
          '**Sync vs async**: signals are synchronous; observables can be either.',
          '**Subscription**: signals have none (tracking is implicit); observables are lazy until subscribed and need cleanup.',
          '**Operators**: RxJS has 100+ operators for time, combination, error handling and retries; signals have `computed`/`effect`/`linkedSignal`.',
          '**Glitch-free**: signal graphs never show inconsistent intermediate state; combined observables can.',
          "**Change detection**: signals integrate natively with Angular's fine-grained/zoneless CD.",
          "**Errors/completion**: observables have error and complete channels; signals don't (use `resource()` for async state with loading/error).",
        ],
      },
      {
        type: 'flow',
        title: 'Typical split of responsibilities',
        code: `flowchart LR
  U["User input"]:::client --> S1["query signal"]:::highlight
  S1 -->|toObservable| R["RxJS pipeline<br/>debounce + switchMap"]:::network
  R --> H["HTTP"]:::server
  H --> R
  R -->|toSignal| S2["results signal"]:::highlight
  S2 --> V["Template + computed"]:::db`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: avoid "signals replace RxJS". Say "signals for state, RxJS for events and async orchestration, interop at the boundaries" — that is the Angular team\'s own guidance.',
      },
    ],
  },

  'When would you choose Signals over Observables?': {
    summary:
      'Choose signals for synchronous state that the UI reads: component state, derived view values, simple shared services, inputs/queries, and anything that should drive OnPush/zoneless change detection. Choose observables when the problem is about events over time: debouncing, cancellation (`switchMap`), retries, websockets, combining multiple async sources. At the boundary, convert with `toSignal()`.',
    details: [
      {
        type: 'paragraph',
        text: 'The deciding question: "Do I care about the current value, or about the sequence and timing of events?" Current value → signal. Sequence/timing → observable.',
      },
      { type: 'heading3', text: 'Pick signals for' },
      {
        type: 'bullets',
        items: [
          'Local component state: open/closed, selected tab, form-ish UI flags.',
          'Derived values: totals, filtered lists, `canSubmit` — via `computed()`.',
          'Shared state services that used to be BehaviorSubject stores.',
          'Component APIs: `input()`, `model()`, `viewChild()` are signals already.',
          'Templates: `{{ count() }}` instead of `async` pipes; works perfectly with OnPush and zoneless.',
        ],
      },
      { type: 'heading3', text: 'Keep observables for' },
      {
        type: 'bullets',
        items: [
          'User-input streams needing `debounceTime`, `throttleTime`, `distinctUntilChanged`.',
          'Request orchestration: `switchMap` (cancel previous), `concatMap` (queue), `exhaustMap` (ignore while busy), `retry`, `timeout`.',
          'Event sources: websockets, `fromEvent`, router events, NgRx actions/effects.',
          'Anything where "no value yet", completion, or error channels matter.',
        ],
      },
      { type: 'heading3', text: 'Refactor example' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: observable state + async pipe + combineLatest
filter$ = new BehaviorSubject<'all' | 'done'>('all');
visible$ = combineLatest([this.todos$, this.filter$]).pipe(
  map(([todos, f]) => (f === 'all' ? todos : todos.filter(t => t.done))),
);

// After: signal state; HTTP stays an observable, converted once
todos = toSignal(inject(TodoApi).list(), { initialValue: [] });
filter = signal<'all' | 'done'>('all');
visible = computed(() =>
  this.filter() === 'all' ? this.todos() : this.todos().filter(t => t.done),
);`,
      },
      {
        type: 'flow',
        title: 'Decision guide',
        code: `flowchart TD
  Q{"What matters?"} -->|"Current value for the UI"| S["Signal"]:::highlight
  Q -->|"Timing, cancellation, retries"| O["Observable"]:::network
  Q -->|"Async fetch keyed by state"| R["resource / rxResource<br/>or toSignal + switchMap"]:::server
  O -->|"show in template"| T["toSignal()"]:::highlight`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Pitfall: `toSignal()` subscribes immediately and stays subscribed for the lifetime of its injection context — don't create it inside methods called repeatedly, and give an `initialValue` (or handle `undefined`) for async sources.",
      },
    ],
  },

  'Signals vs NgRx': {
    summary:
      'Not really either/or: signals are a reactive primitive; NgRx is a state-management library with conventions. Plain signals in services are enough for local and modest shared state. NgRx Store adds a single global store, actions, reducers, effects and DevTools time-travel — useful for large teams and complex flows. NgRx itself now embraces signals: `store.selectSignal()` and the lightweight `@ngrx/signals` SignalStore.',
    details: [
      {
        type: 'paragraph',
        text: "The real question is how much structure your state needs. Signals give reactivity; they don't prescribe where state lives, how it changes, or how side effects are organized. NgRx provides that structure, at the cost of boilerplate and a learning curve.",
      },
      { type: 'heading3', text: 'Plain signal service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class TodosStore {
  private api = inject(TodoApi);
  private _todos = signal<Todo[]>([]);
  readonly todos = this._todos.asReadonly();
  readonly remaining = computed(() => this._todos().filter(t => !t.done).length);

  load() { this.api.list().subscribe(t => this._todos.set(t)); }
  toggle(id: number) {
    this._todos.update(list => list.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }
}`,
      },
      { type: 'heading3', text: 'NgRx SignalStore (signals + structure)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

export const TodosStore = signalStore(
  { providedIn: 'root' },
  withState({ todos: [] as Todo[], loading: false }),
  withComputed(({ todos }) => ({
    remaining: computed(() => todos().filter(t => !t.done).length),
  })),
  withMethods((store, api = inject(TodoApi)) => ({
    async load() {
      patchState(store, { loading: true });
      const todos = await firstValueFrom(api.list());
      patchState(store, { todos, loading: false });
    },
  })),
);`,
      },
      { type: 'heading3', text: 'Classic NgRx Store, read as signals' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class TodoPageComponent {
  private store = inject(Store);
  todos = this.store.selectSignal(selectTodos);   // Signal<Todo[]>
  toggle(id: number) { this.store.dispatch(TodoActions.toggle({ id })); }
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Plain signals**: least code; ideal for component and feature state. Risk: in large apps every team invents its own patterns.',
          '**NgRx SignalStore**: small API, consistent structure, plugins (entities, DevTools via community add-ons), good middle ground.',
          '**NgRx Store**: action log, Redux DevTools time travel, strict unidirectional flow, effects for complex async — best when many features share state and auditability matters.',
          'All of them can expose signals to templates, so change detection benefits are the same.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame it as "signals are the reactivity; NgRx is architecture". Then justify a choice by app size and team size — e.g. "signal services for most features, NgRx Store where we need cross-feature state and action traceability".',
      },
    ],
  },
};
