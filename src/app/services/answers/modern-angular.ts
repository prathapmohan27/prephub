import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'built-in-control-flow-vs-ngif-ngfor': {
    summary:
      'Built-in control flow (since v17) is template syntax compiled directly by Angular: `@if / @else if / @else`, `@for` with a mandatory `track` and an `@empty` block, and `@switch / @case / @default`. Unlike `*ngIf`/`*ngFor`, it is not a directive, so there is nothing to import, it reads like normal code, it narrows types better, `@for` uses a faster diffing algorithm, and it needs no `<ng-template>` for else branches. The structural directives are deprecated since v20.',
    details: [
      {
        type: 'paragraph',
        text: '`*ngIf` and `*ngFor` are structural directives: classes that live in `CommonModule`, receive a `TemplateRef` and manipulate a `ViewContainerRef` at runtime. The new blocks are part of the template language itself — the compiler turns them into dedicated instructions, so there is no directive to load, match, or import.',
      },
      { type: 'heading3', text: 'Before and after — a product page' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Old: directives, ng-template for else, CommonModule import -->
<div *ngIf="product$ | async as product; else loading">
  <h2>{{ product.name }}</h2>
  <li *ngFor="let review of product.reviews; trackBy: trackById; let i = index">
    {{ i + 1 }}. {{ review.text }}
  </li>
</div>
<ng-template #loading><app-spinner /></ng-template>

<!-- New: built-in blocks, no imports -->
@if (product(); as product) {
  <h2>{{ product.name }}</h2>
  @for (review of product.reviews; track review.id; let i = $index) {
    <li>{{ i + 1 }}. {{ review.text }}</li>
  } @empty {
    <p>No reviews yet — be the first!</p>
  }
} @else {
  <app-spinner />
}

@switch (product()?.stock) {
  @case ('in_stock') { <span class="badge green">In stock</span> }
  @case ('low') { <span class="badge amber">Only a few left</span> }
  @default { <span class="badge grey">Out of stock</span> }
}`,
      },
      { type: 'heading3', text: 'Why it is better' },
      {
        type: 'bullets',
        items: [
          '**No imports**: no `NgIf`/`NgFor`/`CommonModule` in standalone `imports` — one less source of "Can\'t bind to ngForOf" errors.',
          '**Readability**: `@else if` and `@else` are real branches; no `<ng-template #ref>` and `else` micro-syntax.',
          "**Type narrowing**: inside `@if (user.role === 'admin')` or a `@case`, the compiler narrows types like TypeScript does — `*ngIf` narrowing needed special guards.",
          '**Performance**: `@for` uses a new reconciliation algorithm and requires `track`, so lists are diffed efficiently by default instead of relying on developers remembering `trackBy`.',
          '**Built-in `@empty`** and implicit variables: `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.',
          '**Smaller bundles**: no directive code shipped; the logic is compiled into the template function.',
          '**`@switch` has no fallthrough** and uses `===` comparison, matching what people expect.',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Migration is automated: `ng generate @angular/core:control-flow` rewrites `*ngIf`/`*ngFor`/`*ngSwitch` across the project (it accepts `--path` to migrate one folder at a time). Pair it with `@let` for local template variables instead of `*ngIf="x as y"` tricks.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "it moved from runtime directives to compiler-level syntax" — that one sentence explains every benefit (no imports, better typing, faster diffing, smaller bundles). Mention `*ngIf`/`*ngFor` are deprecated since v20 so new code should not use them.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: If I want to toggle an element dynamically without using *ngIf, how?',
      },
      {
        type: 'paragraph',
        text: 'In modern Angular use the built-in `@if` block. Without removing the element from the DOM you can hide it with `[hidden]`, a `[class.x]` / `[style.display]` binding, or CSS. Other options: `[ngSwitch]`/`@switch`, `ng-template` + `ngTemplateOutlet`, a custom structural directive, `@defer`, or `ViewContainerRef` in code.',
      },
      {
        type: 'paragraph',
        text: 'The first decision is: should the element be **removed from the DOM** (destroying its components and state) or just **hidden** (kept alive, still in the DOM)? `*ngIf`/`@if` remove; `[hidden]` and style/class bindings hide.',
      },
      { type: 'heading3', text: 'Remove/add from the DOM' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Built-in control flow (Angular 17+) — the modern replacement for *ngIf -->
@if (isOpen()) {
  <app-details />
} @else {
  <button (click)="isOpen.set(true)">Show details</button>
}

<!-- ng-template rendered conditionally via ngTemplateOutlet -->
<ng-container *ngTemplateOutlet="isOpen() ? detailsTpl : null" />
<ng-template #detailsTpl><app-details /></ng-template>

<!-- @switch for several states -->
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error /> }
  @default { <app-content /> }
}`,
      },
      { type: 'heading3', text: 'Hide but keep in the DOM' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- [hidden] sets the HTML hidden attribute (display: none by default) -->
<div [hidden]="!isOpen()">Panel</div>

<!-- class / style bindings -->
<div [class.is-hidden]="!isOpen()">Panel</div>
<div [style.display]="isOpen() ? 'block' : 'none'">Panel</div>

<!-- visibility keeps the space reserved -->
<div [style.visibility]="isOpen() ? 'visible' : 'hidden'">Panel</div>`,
      },
      { type: 'heading3', text: 'Programmatically / custom directive' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// A tiny custom structural directive: *appShowIf="cond"
@Directive({ selector: '[appShowIf]' })
export class ShowIfDirective {
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  appShowIf = input.required<boolean>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.appShowIf()) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          'Remove (`@if`) when the content is heavy or should reset its state; hide (`[hidden]`) when toggling often and you want to keep state (e.g. form input).',
          '`[hidden]` can be overridden by CSS that sets `display` on the element — add `[hidden] { display: none !important; }` globally if needed.',
          'Hidden components still run change detection and keep their subscriptions alive.',
          '`@defer (when cond)` also lazy-loads the code for the block the first time the condition is true.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: start with "today I\'d use `@if`", then explain the remove-vs-hide trade-off — that is usually what the interviewer is really probing.',
      },
    ],
  },

  'why-track-is-mandatory-in-for': {
    summary:
      "`track` tells Angular how to identify each item so that when the array changes it can move, keep, or remove existing DOM nodes instead of destroying and recreating them. Forgetting `trackBy` was one of the most common Angular performance bugs, so `@for` makes it mandatory. Track by a stable, unique key — usually the entity's `id`; use `$index` only for static lists or lists of primitives without identity.",
    details: [
      {
        type: 'paragraph',
        text: 'Imagine a product list refreshed from the API every 30 seconds. The data is equal but every object is a new reference. Without a key, Angular sees "all new items" and tears down every row — losing focus, input state, scroll position, running animations, and re-instantiating every child component. With `track product.id`, it sees that the same products are still there and only patches what changed.',
      },
      { type: 'heading3', text: 'Good and bad track expressions' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- ✅ Stable unique id from the backend -->
@for (product of products(); track product.id) {
  <app-product-card [product]="product" />
}

<!-- ✅ Composite key when id is only unique per group -->
@for (line of cartLines(); track line.productId + '-' + line.size) { ... }

<!-- ⚠️ Index: fine for static, append-only or primitive lists (e.g. star icons) -->
@for (star of [1, 2, 3, 4, 5]; track $index) { <app-star [filled]="star <= rating()" /> }

<!-- ❌ Object identity: every refetch creates new objects → whole list re-rendered -->
@for (product of products(); track product) { ... }`,
      },
      { type: 'heading3', text: 'What actually happens' },
      {
        type: 'bullets',
        items: [
          'Angular computes the key for each item and compares the old and new key sequences, producing minimal operations: insert, remove, move, or update in place.',
          'Same key → the existing embedded view (and any child components) is **reused**; its bindings are just updated.',
          '`track $index` with a list that gets items inserted/removed at the top or sorted causes rows to be re-bound to different data — component state (e.g. an expanded panel or a half-typed input) "jumps" to the wrong row.',
          'Duplicate keys trigger a dev-mode warning (`NG0955`); a track expression that forces re-creation of the whole collection triggers `NG0956`.',
          'The expression can call a function (`track trackById(item)`) but it should be cheap and pure.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Pitfall: tracking by `$index` in an editable or sortable list. Delete row 1 and the input you were typing into in row 2 now shows row 3's data, because views are matched by position, not identity.",
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: answer with the rule "track by the domain identity — `id`, `sku`, `slug` — never by object reference, and use `$index` only when items have no identity and never reorder". Bonus: mention the NG0956 dev warning that catches re-creating whole collections.',
      },
    ],
  },

  'deferrable-views-and-their-triggers': {
    summary:
      '`@defer` lazy-loads a chunk of a template — and the standalone components, directives and pipes inside it — only when a trigger fires. The compiler splits those dependencies into a separate JS chunk automatically, no router or dynamic `import()` needed. Triggers are `on idle` (default), `on viewport`, `on interaction`, `on hover`, `on immediate`, `on timer(...)` and `when <condition>`, plus `prefetch` variants. `@placeholder` shows before loading starts, `@loading` while the chunk downloads, and `@error` if it fails.',
    details: [
      {
        type: 'paragraph',
        text: 'Classic lazy loading works per route. `@defer` works per template region: a heavy chart below the fold, a comments section, a rich-text editor that only appears after clicking "Edit". This directly reduces the initial bundle and improves LCP/TTI.',
      },
      { type: 'heading3', text: 'Product page example' },
      {
        type: 'code',
        lang: 'html',
        code: `<app-product-hero [product]="product()" />

<!-- Load reviews when the placeholder scrolls into view; prefetch when the browser is idle -->
@defer (on viewport; prefetch on idle) {
  <app-reviews [productId]="product().id" />
} @placeholder (minimum 300ms) {
  <div class="reviews-skeleton">Reviews</div>
} @loading (after 100ms; minimum 500ms) {
  <app-spinner />
} @error {
  <p>Couldn't load reviews. <button (click)="retry()">Retry</button></p>
}

<!-- Load the size-guide modal code only after the user interacts with the button -->
@defer (on interaction(sizeBtn); prefetch on hover(sizeBtn)) {
  <app-size-guide />
}
<button #sizeBtn>Size guide</button>

<!-- Condition-based: load the admin toolbar only for admins -->
@defer (when isAdmin()) {
  <app-admin-toolbar />
}`,
      },
      { type: 'heading3', text: 'Triggers' },
      {
        type: 'bullets',
        items: [
          '`on idle` (default) — when the browser is idle (`requestIdleCallback`).',
          '`on viewport` — when the placeholder (or a referenced element) enters the viewport (IntersectionObserver).',
          '`on interaction` — on click or keydown on the placeholder or a referenced element.',
          '`on hover` — on mouseenter/focus.',
          '`on immediate` — right after the non-deferred content has rendered.',
          '`on timer(2s)` — after a delay.',
          '`when expr` — when a boolean expression becomes truthy (one-way: once loaded, it does not unload).',
          'Combine several with `;` (OR semantics). `prefetch on …` / `prefetch when …` download the chunk early without rendering it.',
        ],
      },
      { type: 'heading3', text: 'The sub-blocks' },
      {
        type: 'bullets',
        items: [
          '`@placeholder (minimum 500ms)` — shown initially, before loading begins. Its content is eagerly loaded. `minimum` avoids a flash if loading is fast. The viewport/interaction/hover triggers attach to it, so it should have a single root element.',
          '`@loading (after 100ms; minimum 1s)` — shown while the chunk downloads. `after` avoids showing a spinner for fast loads; `minimum` prevents flicker.',
          '`@error` — shown if loading the chunk fails (e.g. network error).',
        ],
      },
      {
        type: 'flow',
        title: '@defer lifecycle',
        code: `flowchart LR
  P["@placeholder"]:::client -->|"trigger fires"| L["@loading"]:::network
  P -.->|"prefetch trigger"| C["Download chunk"]:::cache
  L --> C
  C -->|success| M["Main @defer content"]:::highlight
  C -->|failure| E["@error"]:::security`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfalls: (1) deferred dependencies must be standalone and must not be referenced elsewhere in the same component file (e.g. via `viewChild(ReviewsComponent)`) or they get bundled eagerly. (2) During SSR the main content is not rendered — the server outputs the `@placeholder`, so do not defer above-the-fold content that matters for LCP or SEO.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame `@defer` as "component-level code splitting declared in the template". Give a real example (reviews on viewport, editor on interaction) and mention `prefetch` — it shows you think about perceived latency, not just bundle size.',
      },
    ],
  },

  'signal-inputs-vs-input': {
    summary:
      '`input()` declares a component input as a read-only signal: `price = input(0)` or `product = input.required<Product>()`. You read it by calling it, derive from it with `computed()`, and react to it with `effect()` — no `ngOnChanges` or setters. Compared with `@Input()`, signal inputs are read-only inside the component, `required` is enforced at compile time with proper non-undefined types, and they plug directly into signal-based, OnPush and zoneless change detection.',
    details: [
      {
        type: 'paragraph',
        text: 'With decorator inputs, deriving state meant `ngOnChanges(changes: SimpleChanges)` or getter/setter pairs, and `@Input() product!: Product` lied to the type system with `!`. Signal inputs make an input just another signal in the graph.',
      },
      { type: 'heading3', text: 'Old vs new' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before
export class PriceTagComponent implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Input() discountPct = 0;
  finalPrice = 0;

  ngOnChanges() {                       // easy to forget a case
    this.finalPrice = this.product.price * (1 - this.discountPct / 100);
  }
}

// After
export class PriceTagComponent {
  product = input.required<Product>();          // Signal<Product> — never undefined
  discountPct = input(0);                       // Signal<number>
  compact = input(false, { transform: booleanAttribute }); // <app-price-tag compact />
  label = input('', { alias: 'ariaLabel' });

  finalPrice = computed(() => this.product().price * (1 - this.discountPct() / 100));
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Parent template: binding syntax is unchanged -->
<app-price-tag [product]="selected()" [discountPct]="20" compact />`,
      },
      { type: 'heading3', text: 'Key differences' },
      {
        type: 'bullets',
        items: [
          '**Read-only**: `InputSignal` has no `set()`. Inputs flow down; if the component needs local editable state, use `model()` (two-way) or `linkedSignal(() => this.value())` (local copy that resets).',
          '**Type safety**: `input.required<T>()` returns `Signal<T>`, and a missing binding is a compile error — no `!` assertions.',
          '**Derivation**: `computed()` replaces most `ngOnChanges` logic; `effect()` replaces setter side effects.',
          '**Change detection**: reading an input in the template registers a signal dependency, so OnPush/zoneless just works.',
          '**Transforms**: `transform` (e.g. `booleanAttribute`, `numberAttribute`) is available on both, but with signals the transformed type is inferred.',
          'Inputs are not available in the constructor — read them in `computed`, `effect`, templates, or `ngOnInit` onwards. Calling a required input too early throws.',
          'Stable since v19. Migrate with `ng generate @angular/core:signal-input-migration`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the killer comparison is "`ngOnChanges` + manual field vs one `computed()` line". Then add the gotcha: signal inputs are read-only, so a component that used to mutate its `@Input` needs `model()` or `linkedSignal()`.',
      },
    ],
  },

  'model-and-two-way-binding': {
    summary:
      "`model()` declares a **writable** input: the component can read it like an input and also `set()`/`update()` it. Angular automatically creates a matching `<name>Change` output, so the parent can use banana-in-a-box `[(name)]`. When the child writes the model, the change event fires and the parent's bound value updates — and if the parent binds a `WritableSignal`, Angular writes straight into that signal.",
    details: [
      {
        type: 'paragraph',
        text: 'Two-way binding has always been sugar: `[(value)]="x"` is `[value]="x" (valueChange)="x = $event"`. Before signals you wrote `@Input() value` + `@Output() valueChange = new EventEmitter()` and remembered to emit on every change. `model()` packages that contract into one declaration.',
      },
      { type: 'heading3', text: 'A quantity stepper for a cart' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-qty-stepper',
  template: \`
    <button (click)="dec()" [disabled]="qty() <= min()">−</button>
    <span>{{ qty() }}</span>
    <button (click)="qty.update(q => q + 1)">+</button>
  \`,
})
export class QtyStepperComponent {
  qty = model(1);              // ModelSignal<number>: input + 'qtyChange' output
  min = input(1);

  dec() {
    this.qty.update(q => Math.max(this.min(), q - 1)); // emits qtyChange automatically
  }
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  imports: [QtyStepperComponent],
  template: \`
    <!-- Bind a WritableSignal: child writes flow straight into it -->
    <app-qty-stepper [(qty)]="quantity" />
    <p>Total: {{ total() | currency }}</p>

    <!-- Or listen to the generated output only -->
    <app-qty-stepper [qty]="2" (qtyChange)="log($event)" />
  \`,
})
export class CartLineComponent {
  price = input.required<number>();
  quantity = signal(1);
  total = computed(() => this.price() * this.quantity());
}`,
      },
      { type: 'heading3', text: 'Things to know' },
      {
        type: 'bullets',
        items: [
          'Note `[(qty)]="quantity"` — pass the signal itself, **not** `quantity()`. Angular detects a `WritableSignal` and calls `.set()` on it.',
          'Plain properties still work: `[(qty)]="count"` assigns the field.',
          '`model.required<T>()` exists for mandatory two-way inputs; `alias` is supported.',
          "Updates from the parent overwrite local writes, just like an input; writes from the child notify the parent. There is a single source of truth: the parent's value.",
          '`[(ngModel)]` also accepts a writable signal, so `<input [(ngModel)]="search" />` with `search = signal(\'\')` works.',
          'Use `model()` for UI controls (toggle, rating, date picker, tabs). For plain "notify parent" events, use `output()`; for read-only data, `input()`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain the desugaring — `[(x)]` = `[x]` + `(xChange)` — then say `model()` generates both halves. Mention that binding a signal (not its value) is what makes signal-to-signal two-way binding work.',
      },
    ],
  },

  'output-vs-output': {
    summary:
      '`output()` declares a component event: `addToCart = output<Product>()`, then `this.addToCart.emit(p)`. The parent template syntax `(addToCart)="..."` is unchanged. Unlike `@Output() x = new EventEmitter()`, it does not extend RxJS `Subject`, so there is no accidental `.pipe()`/`.next()`/`.error()` usage, subscriptions are cleaned up automatically when the component is destroyed, and it fits the function-based API family (`input`, `model`, `viewChild`). It is **not** a signal — events are not state.',
    details: [
      {
        type: 'paragraph',
        text: '`EventEmitter` is a Subject subclass, which leaked RxJS semantics into every component API: people subscribed in services, forgot to unsubscribe, or called `complete()`. `output()` returns a minimal `OutputEmitterRef<T>` with just `emit()` and `subscribe()`.',
      },
      { type: 'heading3', text: 'Old vs new' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before
export class ProductCardComponent {
  @Output() addToCart = new EventEmitter<Product>();
  @Output('fav') favoriteToggled = new EventEmitter<boolean>();
}

// After
export class ProductCardComponent {
  product = input.required<Product>();
  addToCart = output<Product>();
  favoriteToggled = output<boolean>({ alias: 'fav' });
  closed = output();                       // OutputEmitterRef<void> → this.closed.emit()

  onAdd() {
    this.addToCart.emit(this.product());
  }
}`,
      },
      { type: 'heading3', text: 'RxJS interop' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { outputFromObservable, outputToObservable } from '@angular/core/rxjs-interop';

export class SearchBoxComponent {
  private term$ = new Subject<string>();

  // Expose a debounced stream as an output
  search = outputFromObservable(
    this.term$.pipe(debounceTime(300), distinctUntilChanged()),
  );
}

// Programmatic consumer (e.g. a dynamically created component)
const ref = viewContainerRef.createComponent(ProductCardComponent);
const sub = ref.instance.addToCart.subscribe(p => cart.add(p)); // OutputRefSubscription
// or: outputToObservable(ref.instance.addToCart).pipe(...)`,
      },
      {
        type: 'bullets',
        items: [
          '**API surface**: `emit()` + `subscribe()` only — no `next`, `error`, `complete`, `pipe`.',
          '**Cleanup**: subscriptions made via `subscribe()` are torn down when the owning component is destroyed.',
          '**Not a signal**: there is no current value to read; use `model()` if you need two-way state.',
          '**Type inference**: `output<T>()` with void default, so `emit()` with no arg for void events.',
          'Template usage, `$event`, and aliasing are identical — consumers do not change.',
          'Migrate with `ng generate @angular/core:output-migration`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "outputs are events, not state — that is why `output()` is not a signal". Then mention `outputFromObservable` for streams; it shows you know the interop story.',
      },
    ],
  },

  'signal-queries-vs-viewchild': {
    summary:
      'Signal queries — `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()` — return signals whose value updates whenever the query result changes. You read them inside `computed()`, `effect()`, templates or `afterNextRender()` without waiting for `ngAfterViewInit`, there is no `static` flag to get wrong, `.required()` gives non-undefined types, and `viewChildren` returns a plain readonly array instead of a `QueryList` with a `changes` observable.',
    details: [
      {
        type: 'paragraph',
        text: 'With decorator queries, the result is assigned at some lifecycle point (`static: true` → before `ngOnInit`, otherwise before `ngAfterViewInit`), and lists change via `QueryList.changes`. Code reading them too early got `undefined`. Signal queries make the timing reactive: the signal is `undefined` until the element exists, and anything depending on it re-runs when it appears or changes.',
      },
      { type: 'heading3', text: 'View queries — search page' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-search-page',
  template: \`
    <input #searchBox placeholder="Search products" />
    @if (showFilters()) { <app-filter-panel /> }
    @for (r of results(); track r.id) { <app-result-row [result]="r" /> }
  \`,
})
export class SearchPageComponent {
  searchBox = viewChild.required<ElementRef<HTMLInputElement>>('searchBox');
  filterPanel = viewChild(FilterPanelComponent);         // Signal<FilterPanelComponent | undefined>
  rows = viewChildren(ResultRowComponent);              // Signal<readonly ResultRowComponent[]>

  hasFilters = computed(() => !!this.filterPanel());    // reacts when @if toggles
  rowCount = computed(() => this.rows().length);

  constructor() {
    afterNextRender(() => this.searchBox().nativeElement.focus());
  }
}`,
      },
      { type: 'heading3', text: 'Content queries — tabs component' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-tabs',
  template: \`
    @for (tab of tabs(); track tab.title()) {
      <button (click)="active.set($index)">{{ tab.title() }}</button>
    }
    <ng-content />
  \`,
})
export class TabsComponent {
  tabs = contentChildren(TabComponent, { descendants: true });
  active = signal(0);
  activeTab = computed(() => this.tabs()[this.active()]);
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Reactive timing**: no "is it available yet?" lifecycle reasoning; derive with `computed()`.',
          '**Types**: `viewChild.required()` / `contentChild.required()` return `Signal<T>`; optional ones return `Signal<T | undefined>` honestly.',
          '**No `static` option** and no `QueryList` / `changes` subscription — `viewChildren()` is `Signal<readonly T[]>`.',
          '**Options**: `read` (e.g. `{ read: ElementRef }` or `ViewContainerRef`) and, for content queries, `descendants`.',
          'Use `afterNextRender()` for one-off DOM work (focus, measuring) rather than an `effect()`.',
          'Migrate with `ng generate @angular/core:signal-queries-migration`.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the strongest point is "queries become part of the reactive graph" — e.g. `computed(() => this.rows().length)` updates automatically when items are added, replacing `QueryList.changes.subscribe(...)` and manual unsubscription.',
      },
    ],
  },

  'linkedsignal-vs-computed': {
    summary:
      '`linkedSignal()` creates a **writable** signal whose value is derived from other signals, like `computed()`, but which the user can also `set()` locally. Whenever its source changes, it recomputes and the local override is discarded. Use it for "derived default, user can override" state: a selected item that resets when the list changes, a form field initialised from an input, a page number that resets when filters change. Stable since v20.',
    details: [
      {
        type: 'paragraph',
        text: '`computed()` is read-only — you cannot `set()` it. Before `linkedSignal`, the workaround was a writable signal plus an `effect()` that reset it whenever the source changed: an extra async step, glitchy intermediate states, and hidden coupling. `linkedSignal` expresses that relationship directly and synchronously.',
      },
      { type: 'heading3', text: 'Short form — reset to a derived default' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ProductListComponent {
  category = input.required<string>();
  filters = signal<Filters>({ sort: 'popular' });

  // Page resets to 1 whenever the category or filters change, but the user can paginate
  page = linkedSignal(() => {
    this.category();
    this.filters();
    return 1;
  });

  next() { this.page.update(p => p + 1); }
}`,
      },
      { type: 'heading3', text: 'Long form — keep the selection if it still exists' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class CheckoutComponent {
  shippingOptions = input.required<ShippingOption[]>();

  selectedShipping = linkedSignal<ShippingOption[], ShippingOption>({
    source: this.shippingOptions,
    computation: (options, previous) =>
      // keep the user's choice if it is still offered, otherwise fall back to the first
      options.find(o => o.id === previous?.value.id) ?? options[0],
  });

  choose(option: ShippingOption) {
    this.selectedShipping.set(option);   // local override
  }
}`,
      },
      { type: 'heading3', text: 'computed vs linkedSignal' },
      {
        type: 'bullets',
        items: [
          '**computed**: read-only, pure derivation — totals, filtered lists, flags.',
          '**linkedSignal**: writable; recomputes (dropping local writes) when its source changes.',
          'The `source` / `computation(source, previous)` form gives access to the previous source and value, so you can preserve state across source changes.',
          'Supports `equal` for custom equality, like other signals.',
          'Common use: a local, editable copy of an `input()` (inputs are read-only) — `draft = linkedSignal(() => this.user().name)`.',
          'If nobody ever writes it, it should just be `computed()`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: using `linkedSignal` as a general "editable state" tool. Every time the source changes, user edits are thrown away — great for selection/pagination, surprising for a half-filled form unless that is the intent.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: describe it as "computed with an escape hatch" and give the shipping-option or pagination example. Then contrast with the old effect-that-sets-a-signal anti-pattern it replaces.',
      },
    ],
  },

  'resource-and-httpresource': {
    summary:
      '`resource()` turns async loading into signals: you give it reactive `params` and an async `loader({ params, abortSignal })`, and it exposes `value()`, `status()`, `error()`, `isLoading()` and `hasValue()`. When params change, it aborts the previous request and loads again. `httpResource()` (from `@angular/common/http`) is the HttpClient-based version: you pass a reactive function returning a URL or request object, and interceptors, testing utilities and JSON parsing just work. `rxResource()` is the Observable-based variant.',
    details: [
      {
        type: 'paragraph',
        text: 'Before resources, loading data reactively from signals meant `toObservable(id).pipe(switchMap(...))` plus separate `loading`/`error` signals. A resource bundles the whole "fetch when inputs change, track loading/error, cancel stale requests" pattern into one object.',
      },
      { type: 'heading3', text: 'resource() — generic, Promise-based' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { resource, signal, computed } from '@angular/core';

export class ProductSearchComponent {
  query = signal('');
  page = signal(1);

  results = resource({
    // reactive: re-runs whenever query or page change; returning undefined → 'idle'
    params: () => (this.query().length >= 2 ? { q: this.query(), page: this.page() } : undefined),
    loader: async ({ params, abortSignal }) => {
      const res = await fetch(\`/api/products?q=\${params.q}&page=\${params.page}\`, { signal: abortSignal });
      if (!res.ok) throw new Error(\`Search failed: \${res.status}\`);
      return (await res.json()) as Product[];
    },
    defaultValue: [],
  });

  count = computed(() => this.results.value().length);
}`,
      },
      { type: 'heading3', text: 'httpResource() — HttpClient-backed' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { httpResource } from '@angular/common/http';

export class ProductPageComponent {
  id = input.required<string>();

  // GET /api/products/:id, re-fetched when id changes; goes through interceptors
  product = httpResource<Product>(() => \`/api/products/\${this.id()}\`);

  // Request object form for params/headers
  reviews = httpResource<Review[]>(() => ({
    url: '/api/reviews',
    params: { productId: this.id(), sort: 'recent' },
  }), { defaultValue: [] });
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `@if (product.isLoading()) {
  <app-skeleton />
} @else if (product.error()) {
  <p>Could not load product. <button (click)="product.reload()">Retry</button></p>
} @else if (product.hasValue()) {
  <h1>{{ product.value().name }}</h1>
}`,
      },
      { type: 'heading3', text: 'API essentials' },
      {
        type: 'bullets',
        items: [
          '`status()`: `idle` | `loading` | `reloading` | `resolved` | `error` | `local`.',
          '`value()` holds the data (or `defaultValue`); `hasValue()` narrows the type in templates.',
          '`reload()` re-runs the loader with the same params; `set()`/`update()` write a local value (status `local`) — handy for optimistic UI.',
          'Changing params cancels the in-flight load via `abortSignal` (resource) or by unsubscribing (httpResource/rxResource) — no race conditions.',
          '`httpResource.text()`, `.blob()`, `.arrayBuffer()` for non-JSON; `parse` option to validate responses (e.g. with Zod).',
          '`rxResource({ params, stream: ({ params }) => this.api.get(params) })` from `@angular/core/rxjs-interop` when your service returns Observables.',
          'Older previews used `request` instead of `params` and `loader` for rxResource — expect that in older code and blog posts.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Resources are for **reading** data that depends on state. Do not use them for mutations (POST/PUT/DELETE on button click) — call `HttpClient` directly for those, then `reload()` or `set()` the resource.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention these APIs started as experimental in v19 and evolved (`request` → `params`), so check their status in your version. Then sell the value: declarative loading state, automatic cancellation, and no manual subscriptions.',
      },
    ],
  },

  'inject-vs-constructor-injection': {
    summary:
      '`inject(Token)` retrieves a dependency from the current injector during an **injection context** — field initializers, the constructor, factory functions, and functional guards/resolvers/interceptors. It is preferred because it works where constructors do not exist (functional APIs), avoids long constructor parameter lists and `super(...)` chains in inheritance, infers types from `InjectionToken`s, and lets you build reusable `injectXyz()` helper functions. It is now the default style in Angular docs and schematics.',
    details: [
      {
        type: 'paragraph',
        text: 'Both styles use the same DI system and are equally type-safe. The difference is ergonomics and composability: `inject()` is just a function call, so dependencies can be resolved in places a class constructor cannot reach.',
      },
      { type: 'heading3', text: 'Constructor vs inject()' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before
export class OrdersComponent {
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    @Optional() @Inject(ANALYTICS) private analytics: Analytics | null,
  ) {}
}

// After
export class OrdersComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private analytics = inject(ANALYTICS, { optional: true }); // Analytics | null
  private orderId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));
}`,
      },
      { type: 'heading3', text: 'Where only inject() works' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Functional guard
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/login']);

// Functional interceptor
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }) : req);
};

// Reusable "composable"
export function injectQueryParam(name: string) {
  return toSignal(inject(ActivatedRoute).queryParamMap.pipe(map(p => p.get(name))));
}
// usage: sort = injectQueryParam('sort');`,
      },
      { type: 'heading3', text: 'Benefits and rules' },
      {
        type: 'bullets',
        items: [
          '**Inheritance**: a base class can `inject()` its own deps — subclasses no longer repeat them in `super(...)`.',
          '**Field initialisers** can use injected services directly (e.g. `toSignal`, `httpResource`) since fields are initialised in the injection context.',
          '**Options object**: `{ optional, self, skipSelf, host }` replaces `@Optional()/@Self()/@SkipSelf()/@Host()` decorators.',
          "**Typed tokens**: `inject(API_URL)` returns the token's type — no `@Inject()` and manual typing.",
          '**Rule**: call it only in an injection context. In a method or `setTimeout` it throws `NG0203`; capture deps in fields, or use `runInInjectionContext(injector, fn)`.',
          'Migrate with `ng generate @angular/core:inject` (options include `migrateAbstractClasses`, `backwardsCompatibleConstructors`, `nonNullableOptional`).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: do not say constructor injection is "wrong". Say `inject()` is the same DI with better composition: functional guards/interceptors, helper functions, and cleaner inheritance — and know the injection-context rule and the NG0203 error.',
      },
    ],
  },

  'destroyref-and-takeuntildestroyed': {
    summary:
      '`DestroyRef` is an injectable handle to the current lifecycle scope (component, directive, service or environment injector); `inject(DestroyRef).onDestroy(fn)` registers cleanup without implementing `ngOnDestroy`. `takeUntilDestroyed()` from `@angular/core/rxjs-interop` is an RxJS operator built on it: it completes the observable when that scope is destroyed. Together they replace the `destroy$ = new Subject()` + `takeUntil(this.destroy$)` + `ngOnDestroy` boilerplate.',
    details: [
      {
        type: 'paragraph',
        text: 'The old pattern needed three coordinated pieces in every component, and forgetting `next()`/`complete()` caused leaks. Because `DestroyRef` can be injected, cleanup logic can now live in reusable functions and services rather than in the class that owns the lifecycle hook.',
      },
      { type: 'heading3', text: 'Before and after' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before
export class LivePricesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  ngOnInit() {
    this.prices.stream().pipe(takeUntil(this.destroy$)).subscribe(p => this.update(p));
  }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// After — in an injection context, no lifecycle hooks needed
export class LivePricesComponent {
  private prices = inject(PriceService);

  constructor() {
    this.prices.stream()
      .pipe(takeUntilDestroyed())          // must be last in the pipe
      .subscribe(p => this.update(p));
  }
}`,
      },
      { type: 'heading3', text: 'Outside the constructor and in reusable helpers' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class DashboardComponent {
  private destroyRef = inject(DestroyRef);

  onFilterChange(region: string) {
    // not an injection context → pass the DestroyRef explicitly
    this.api.watchSales(region).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);
  }
}

// Reusable helper: auto-cleans with whichever component calls it
export function injectWindowResize() {
  const width = signal(window.innerWidth);
  const onResize = () => width.set(window.innerWidth);
  window.addEventListener('resize', onResize);
  inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', onResize));
  return width.asReadonly();
}`,
      },
      {
        type: 'bullets',
        items: [
          '`onDestroy(fn)` returns an unregister function; `destroyRef.destroyed` tells you if the scope is already gone.',
          'Scope depends on where it is injected: in a component → component destroy; in a root service → app/injector destroy.',
          'Place `takeUntilDestroyed()` **last** in the pipe — operators after it (e.g. `switchMap` to an inner stream) could keep subscriptions alive.',
          'Often you need neither: the `async` pipe, `toSignal()` and `output()` subscriptions clean up automatically.',
          "`effect()` and `afterRenderEffect()` are also tied to the injector's `DestroyRef`; use `onCleanup` inside them for per-run cleanup.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: show the before/after code and then say the bigger win is composability — because `DestroyRef` is injectable, a helper like `injectWindowResize()` can clean up after itself without the calling component doing anything.',
      },
    ],
  },

  'migrating-to-zoneless': {
    summary:
      'First make the app "OnPush-ready": every state change must notify Angular through signals, the `async` pipe, template event handlers, input changes or `markForCheck()`. Then swap `provideZoneChangeDetection()` for `provideZonelessChangeDetection()`, remove `zone.js` from the `polyfills` in `angular.json` (build and test targets) and uninstall it, replace `NgZone.onStable`/`onMicrotaskEmpty` with `afterNextRender`, switch tests off `fakeAsync`, and fix code that mutated plain fields in `setTimeout`, Promises or third-party callbacks.',
    details: [
      {
        type: 'paragraph',
        text: 'Zone.js used to trigger change detection after *any* async task. Zoneless Angular only re-renders when it is explicitly told something changed (see the change-detection answer for how scheduling works). The migration is therefore less about the provider swap and more about finding the places that silently relied on Zone.js.',
      },
      { type: 'heading3', text: 'Step 1 — make components notify Angular' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ Works with Zone.js, silently stale without it
export class OrderStatusComponent {
  status = 'pending';
  ngOnInit() {
    setTimeout(() => (this.status = 'shipped'), 2000);       // plain field mutation
    this.socket.on('update', s => (this.status = s));         // 3rd-party callback
  }
}

// ✅ Zoneless-safe: signals notify the scheduler
@Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
export class OrderStatusComponent {
  status = signal<'pending' | 'shipped'>('pending');
  ngOnInit() {
    setTimeout(() => this.status.set('shipped'), 2000);
    this.socket.on('update', s => this.status.set(s));
  }
}
// If you can't convert yet: inject(ChangeDetectorRef).markForCheck() after the mutation.`,
      },
      { type: 'heading3', text: 'Step 2 — swap providers and remove zone.js' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),   // replaces provideZoneChangeDetection({ eventCoalescing: true })
    provideRouter(routes),
    provideHttpClient(),
  ],
};

// angular.json → remove "zone.js" (and "zone.js/testing") from the polyfills arrays
// of the "build" and "test" targets, delete any import 'zone.js' lines,
// then: npm uninstall zone.js`,
      },
      { type: 'heading3', text: 'Step 3 — replace Zone-specific APIs' },
      {
        type: 'bullets',
        items: [
          '`NgZone.onStable` / `onMicrotaskEmpty` / `isStable` never emit without Zone — use `afterNextRender()` / `afterEveryRender()` for "after the DOM updated" work.',
          '`NgZone.run()` / `runOutsideAngular()` remain callable and are harmless, but no longer needed for performance tricks.',
          'SSR: the server waits for the app to be stable. Wrap async work that must finish before serialization with `PendingTasks` (`inject(PendingTasks).run(async () => ...)`) or the `pendingUntilEvent()` operator.',
          'Audit third-party libraries (charts, maps, older UI kits) that relied on Zone to refresh your component after their callbacks.',
        ],
      },
      { type: 'heading3', text: 'Step 4 — tests' },
      {
        type: 'code',
        lang: 'typescript',
        code: `TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
});

const fixture = TestBed.createComponent(OrderStatusComponent);
fixture.componentInstance.status.set('shipped');
await fixture.whenStable();                // instead of fakeAsync/tick (they need zone.js)
expect(fixture.nativeElement.textContent).toContain('shipped');`,
      },
      {
        type: 'bullets',
        items: [
          "`fakeAsync`/`tick`/`flush` depend on zone.js — use `await fixture.whenStable()` or your test runner's fake timers.",
          'Prefer letting Angular schedule CD over sprinkling `fixture.detectChanges()`: tests that only pass with manual `detectChanges` reveal components that do not notify.',
          'In dev, `provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })` (developer preview) helps find bindings that changed without notification.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common breakages: values set in `setTimeout`/`setInterval`/`Promise.then` on plain fields, WebSocket or Firebase listeners, `ExpressionChangedAfterItHasBeenChecked` hidden by Zone timing, and code waiting on `NgZone.onStable`. Migrating to OnPush first surfaces almost all of them while Zone.js is still a safety net.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: present it as a phased plan — (1) OnPush + signals everywhere, (2) provider swap behind a branch, (3) remove the polyfill, (4) fix tests and SSR stability. Mention zoneless is the default for new projects since v21, and that earlier versions exposed it as `provideExperimentalZonelessChangeDetection()`.',
      },
    ],
  },

  'hydration-and-event-replay': {
    summary:
      'Hydration is the process where the browser-side Angular app **reuses** the DOM rendered by the server (SSR/prerender) instead of destroying and re-creating it — it attaches listeners and state to existing nodes, avoiding flicker and layout shift. You enable it with `provideClientHydration()`. **Event replay** (`withEventReplay()`) records clicks and other events that happen before hydration finishes and replays them afterwards. **Incremental hydration** uses `@defer` blocks with `hydrate on ...` triggers so parts of the page stay as static HTML and are hydrated — and their code downloaded — only when needed.',
    details: [
      {
        type: 'paragraph',
        text: "Without hydration, SSR gives a fast first paint, but when the client app boots it throws the server DOM away and renders again — flicker, lost scroll position, wasted work. Full hydration fixes that, but the whole app's JS must still download and run before anything is interactive. Event replay and incremental hydration attack that remaining gap.",
      },
      { type: 'heading3', text: 'Setup' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// app.config.ts (with @angular/ssr)
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),            // capture early clicks and replay them after hydration
      // withIncrementalHydration() — needed in earlier versions to enable 'hydrate' triggers
    ),
    provideHttpClient(withFetch()),
  ],
};`,
      },
      { type: 'heading3', text: 'Incremental hydration on a product page' },
      {
        type: 'code',
        lang: 'html',
        code: `<app-product-hero [product]="product()" />   <!-- hydrated normally -->

<!-- Server renders the reviews HTML; client hydrates it only when scrolled into view -->
@defer (hydrate on viewport) {
  <app-reviews [productId]="product().id" />
} @placeholder {
  <div class="reviews-skeleton"></div>
}

<!-- Hydrate the recommendation carousel when the user interacts with it -->
@defer (hydrate on interaction) {
  <app-recommendations />
}

<!-- Static footer content that never needs JS -->
@defer (hydrate never) {
  <app-legal-footer />
}`,
      },
      {
        type: 'flow',
        title: 'From server HTML to interactive page',
        code: `flowchart LR
  S["Server renders full HTML"]:::server --> B["Browser paints HTML"]:::client
  B --> R["Event replay captures early clicks"]:::queue
  B --> H["Hydrate eager parts: reuse DOM"]:::highlight
  B --> D["@defer (hydrate on viewport): stays static"]:::cache
  D -->|"trigger fires"| L["Load chunk and hydrate block"]:::network
  R -->|"after hydration"| P["Replay events to handlers"]:::highlight`,
      },
      { type: 'heading3', text: 'Key points' },
      {
        type: 'bullets',
        items: [
          '**Hydration** needs identical DOM on server and client: avoid direct DOM manipulation (`innerHTML`, `appendChild`) and invalid HTML nesting; opt out a misbehaving subtree with the `ngSkipHydration` attribute.',
          '`provideClientHydration()` also enables the **HTTP transfer cache**, so `HttpClient` GETs made on the server are not repeated on the client (`withNoHttpTransferCache()` to disable).',
          '**Event replay** uses a tiny inline event-dispatch script that queues events from page load; new SSR projects from the CLI include `withEventReplay()`.',
          '**Incremental hydration** triggers mirror defer triggers: `hydrate on idle | viewport | interaction | hover | immediate | timer(...)`, `hydrate when expr`, and `hydrate never`. Unlike plain `@defer`, the server renders the real content, not the placeholder.',
          'Hydrating a nested block hydrates its parent blocks first; events on a dehydrated block trigger its hydration and are then replayed.',
          'In the installed Angular version, `withIncrementalHydration()` is deprecated because incremental hydration is on by default with `provideClientHydration()` (`withNoIncrementalHydration()` opts out). Older versions require adding it explicitly.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: tell it as a progression — SSR (fast paint) → hydration (no re-render) → event replay (no lost clicks) → incremental hydration (no JS until needed). That narrative shows you understand why each feature exists.',
      },
    ],
  },

  'signal-forms-vs-reactive-forms': {
    summary:
      "Signal Forms (`@angular/forms/signals`) build a form on top of a `WritableSignal` model: `form(model, schema)` returns a field tree that mirrors the model's shape, each field exposes signal state (`value`, `valid`, `errors`, `touched`, `dirty`, `pending`, `disabled`), validation is declared in a schema function (`required`, `email`, `minLength`, `validate`…), and inputs bind with a single directive. Unlike Reactive Forms, there is no parallel `FormGroup`/`FormControl` tree to keep in sync — the signal model is the source of truth, types come from the model, and everything is read reactively instead of via `valueChanges` observables. The API was introduced as experimental and names have changed between releases.",
    details: [
      {
        type: 'paragraph',
        text: 'Reactive Forms model the form as a tree of control objects separate from your data; you build it, patch values in, read `form.value` out, and subscribe to `valueChanges`/`statusChanges`. Signal Forms flip that: your data is a signal, the form is a reactive view over it, and every piece of form state is a signal you can use in `computed()` and templates.',
      },
      { type: 'heading3', text: 'Sign-up form' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { form, FormField, required, email, minLength, validate, submit } from '@angular/forms/signals';

interface SignUp { name: string; email: string; password: string; confirm: string; }

@Component({
  selector: 'app-sign-up',
  imports: [FormField],
  templateUrl: './sign-up.html',
})
export class SignUpComponent {
  private auth = inject(AuthService);

  model = signal<SignUp>({ name: '', email: '', password: '', confirm: '' });

  signUpForm = form(this.model, (f) => {
    required(f.name, { message: 'Name is required' });
    required(f.email);
    email(f.email, { message: 'Enter a valid email' });
    minLength(f.password, 8);
    validate(f.confirm, ({ value, valueOf }) =>
      value() === valueOf(f.password) ? null : { kind: 'mismatch', message: 'Passwords differ' });
  });

  async onSubmit(event: Event) {
    event.preventDefault();
    await submit(this.signUpForm, async (f) => {
      await this.auth.register(f().value());
      return undefined;              // or return server-side validation errors
    });
  }
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<form (submit)="onSubmit($event)">
  <input [formField]="signUpForm.email" type="email" />
  @if (signUpForm.email().touched() && signUpForm.email().invalid()) {
    @for (err of signUpForm.email().errors(); track err.kind) {
      <small class="error">{{ err.message }}</small>
    }
  }
  <input [formField]="signUpForm.password" type="password" />
  <button [disabled]="signUpForm().invalid() || signUpForm().submitting()">Create account</button>
</form>`,
      },
      { type: 'heading3', text: 'Signal Forms vs Reactive Forms' },
      {
        type: 'bullets',
        items: [
          '**Source of truth**: Reactive — the `FormGroup` holds its own copy of the data. Signal — your `signal()` model; editing a field writes to the model directly.',
          '**Typing**: Reactive typed forms infer from control definitions; Signal Forms infer the whole field tree from the model interface.',
          '**Reactivity**: Reactive uses `valueChanges`/`statusChanges` observables and subscriptions. Signal — `field().value()`, `valid()`, `errors()` are signals usable in `computed()` and OnPush/zoneless templates.',
          '**Validation**: Reactive attaches validator functions to controls. Signal declares rules in a schema (`required`, `email`, `min`, `pattern`, `validate`, `validateAsync`/`validateHttp`, `debounce`), plus logic like `disabled()`/`hidden()`, which can be reused across forms.',
          '**Binding**: Reactive — `[formGroup]` + `formControlName`. Signal — one directive per input bound to the field path.',
          '**Maturity**: Reactive Forms are stable and battle-tested with a huge ecosystem; Signal Forms are newer — evaluate them for greenfield forms, keep Reactive Forms for existing large forms.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'API churn: Signal Forms launched as experimental and the binding directive was renamed — earlier releases used `Field` / `[field]`, the installed version exports `FormField` / `[formField]` (with `Field` remaining only as a type). Check `@angular/forms/signals` in your version before copying examples.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: lead with the mental-model shift — "Reactive Forms: form owns the data; Signal Forms: the data is a signal and the form is derived from it". Then be honest about maturity and say you would choose based on team version and risk tolerance.',
      },
    ],
  },

  'migrating-to-modern-angular-apis': {
    summary:
      'Do it incrementally with the official schematics, one migration per commit, tests green between each: `ng update` to a current version, then `ng generate @angular/core:standalone` (convert → prune NgModules → standalone bootstrap), `@angular/core:control-flow`, `@angular/core:inject`, then the signal migrations (`signal-input-migration`, `output-migration`, `signal-queries-migration`, or the combined `signals`), and finally `cleanup-unused-imports`. Then do the manual, higher-value work: replace `ngOnChanges` with `computed`, subscriptions with `toSignal`/`takeUntilDestroyed`, adopt OnPush, and eventually zoneless.',
    details: [
      {
        type: 'paragraph',
        text: 'Big-bang rewrites stall. Each migration is independent and mechanical, so treat them as separate low-risk PRs. Scope them with `--path` to a feature folder when the codebase is large or several teams own it.',
      },
      { type: 'heading3', text: 'Recommended order' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// 0. Upgrade one major at a time (runs automatic migrations from migrations.json)
ng update @angular/core @angular/cli

// 1. Standalone — run the three modes in order, building/testing after each
ng generate @angular/core:standalone   // mode: convert-to-standalone
ng generate @angular/core:standalone   // mode: prune-ng-modules
ng generate @angular/core:standalone   // mode: standalone-bootstrap

// 2. Template control flow (*ngIf/*ngFor/*ngSwitch → @if/@for/@switch)
ng generate @angular/core:control-flow --path=src/app/catalog

// 3. Constructor injection → inject()
ng generate @angular/core:inject

// 4. Signals: inputs, outputs, queries (individually or combined)
ng generate @angular/core:signal-input-migration --path=src/app/catalog
ng generate @angular/core:output-migration
ng generate @angular/core:signal-queries-migration
ng generate @angular/core:signals        // all signal migrations together

// 5. Tidy up
ng generate @angular/core:cleanup-unused-imports
ng generate @angular/core:self-closing-tag
ng generate @angular/core:route-lazy-loading   // eager route components → loadComponent`,
      },
      { type: 'heading3', text: 'What the schematics will not do for you' },
      {
        type: 'bullets',
        items: [
          'Signal input migration skips inputs it cannot migrate safely (e.g. inputs written to inside the component). `--best-effort-mode` migrates more aggressively; `--insert-todos` leaves TODO comments explaining skipped cases.',
          'Rewrite `ngOnChanges`/setter logic into `computed()` — schematics convert declarations and reads, not your design.',
          'Replace `subscribe` + manual fields with `toSignal()`, `resource()`/`httpResource()`, and `takeUntilDestroyed()`.',
          'Move components to `ChangeDetectionStrategy.OnPush` and verify they still update — the prerequisite for zoneless.',
          'Convert class-based guards/resolvers/interceptors to functional ones (`CanActivateFn`, `HttpInterceptorFn`).',
          'Review the `track` expressions the control-flow migration generates: `trackBy: fn` becomes `track fn($index, item)`, but loops without `trackBy` get `track item` (object identity) — replace those with a real id.',
        ],
      },
      { type: 'heading3', text: 'Making it safe' },
      {
        type: 'bullets',
        items: [
          'One schematic per PR, with build + unit + e2e tests in CI; easy to review and revert.',
          'Migrate leaf/shared components first, then features, then the app shell.',
          'Add lint rules or code-review guidelines so new code uses the modern APIs and the old ones stop spreading.',
          'Track progress with a simple grep metric (e.g. count of `@Input(` and `*ngFor`) on a dashboard.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: interviewers want to hear a strategy, not a list of commands — "incremental, schematic-driven, one concern per PR, tests as the safety net, then manual refactors where the real value is (computed instead of ngOnChanges, OnPush, zoneless)". Name two or three schematics accurately to show hands-on experience.',
      },
    ],
  },
};
