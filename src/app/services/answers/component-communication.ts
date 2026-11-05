import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Different ways to share data between components': {
    summary:
      'By relationship: parent/child via inputs, outputs, `model()` and `viewChild`; siblings or unrelated components via a shared service (signals or `BehaviorSubject`); across routes via route/query params, resolvers or navigation state; feature- or app-wide via NgRx/Signal Store; and across reloads via browser storage.',
    details: [
      {
        type: 'paragraph',
        text: 'A good answer organises the techniques rather than listing them. The two questions to ask are: how are the components related, and how long must the data live?',
      },
      {
        type: 'flow',
        title: 'Choosing a technique',
        code: `flowchart TD
  Q{How are the components related?} -->|Parent - child| PC["input / output / model<br/>viewChild"]:::client
  Q -->|Siblings or unrelated| S{Scope of the data?}
  S -->|One feature subtree| CP[Component-level provided service]:::server
  S -->|Whole app| R{Complex, many writers,<br/>needs devtools?}
  R -->|No| RS["Root service with signals"]:::server
  R -->|Yes| NG[NgRx Store / Signal Store]:::highlight
  Q -->|Different routes| RT["Route params, query params,<br/>resolver, navigation state"]:::network
  S -->|Survive reload| LS[(localStorage via service)]:::db`,
      },
      { type: 'heading3', text: 'Summary table' },
      {
        type: 'bullets',
        items: [
          '**@Input / input()** — parent → child, explicit, best for presentational components.',
          '**@Output / output()** — child → parent events.',
          '**model()** — two-way binding `[(value)]` between parent and child.',
          '**viewChild / template ref** — parent calls child methods (use sparingly; tighter coupling).',
          '**Shared service + signals/BehaviorSubject** — siblings and unrelated components; the default for most apps.',
          '**Component-scoped providers** — state per instance of a feature (each tab group, each wizard).',
          '**Router** — params/query params for shareable state; resolvers for preloaded data; `state` for transient payloads.',
          '**NgRx / Signal Store** — centralised, predictable state for large teams and complex flows.',
          '**Storage / BroadcastChannel** — persistence and cross-tab sync.',
        ],
      },
      { type: 'heading3', text: 'Example: BehaviorSubject service (RxJS style)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class SelectedCustomerService {
  private readonly selected$ = new BehaviorSubject<Customer | null>(null);
  readonly selected = this.selected$.asObservable(); // read-only for consumers

  select(c: Customer) { this.selected$.next(c); }
}

// List component:   this.svc.select(customer)
// Detail component: customer$ = inject(SelectedCustomerService).selected;
// Template:         @if (customer$ | async; as c) { {{ c.name }} }`,
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What are the ways to share data between components other than `@Input()` and `@Output()`?',
      },
      {
        type: 'paragraph',
        text: 'Shared services (with signals or a `BehaviorSubject`), the router (route params, query params, resolvers, `history.state`), `viewChild`/`contentChild` and template reference variables, dependency injection through the component tree (a parent providing a service or token to its descendants), content projection, browser storage for persistence, and a state library such as NgRx or Signal Store for app-wide state.',
      },
      { type: 'heading3', text: '1. Shared service with signals' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((n, i) => n + i.qty, 0));

  add(item: CartItem) { this._items.update((list) => [...list, item]); }
}

// Header and ProductList are unrelated, yet both see the same state
export class Header { count = inject(CartStore).count; }`,
      },
      { type: 'heading3', text: '2. Router' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// /orders/42?tab=items  — URL is the shared state (bookmarkable)
provideRouter(routes, withComponentInputBinding());

export class OrderDetail {
  id = input.required<string>();   // bound from :id
  tab = input<string>();           // bound from ?tab=
}

// Transient, non-URL data
this.router.navigate(['/confirm'], { state: { orderId: 42 } });
// in target: inject(Router).getCurrentNavigation()?.extras.state  or history.state`,
      },
      { type: 'heading3', text: '3. Hierarchical DI — parent provides, descendants inject' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-tabs',
  providers: [TabsState], // new instance per <app-tabs>
  template: '<ng-content />',
})
export class Tabs {}

@Component({ selector: 'app-tab', template: '...' })
export class Tab {
  private state = inject(TabsState); // gets the nearest Tabs' instance
}`,
      },
      {
        type: 'bullets',
        items: [
          '**viewChild / contentChild / template ref (`#ref`)** — parent reads or calls the child directly.',
          '**Content projection** — pass markup/components into a child via `<ng-content>` or `ngTemplateOutlet` with a context.',
          '**Resolvers** — preload data for a route and receive it as an input.',
          '**Browser storage** (`localStorage`, `sessionStorage`, IndexedDB) — persistence across reloads/tabs; wrap in a service.',
          '**State management library** — NgRx Store / Signal Store, for large apps with complex shared state and devtools.',
          '**BroadcastChannel / storage event** — sync between browser tabs.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: finish with a trade-off — "inputs/outputs are explicit but cause prop-drilling; services remove drilling but hide dependencies; NgRx adds structure and tooling at the cost of boilerplate."',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: How do you communicate and pass data between parent and child components in Angular?',
      },
      {
        type: 'paragraph',
        text: 'Parent → child with inputs (`input()` signal inputs, or legacy `@Input()`); child → parent with outputs (`output()`, or legacy `@Output()` + `EventEmitter`). For two-way binding use `model()`. When the parent needs to call into the child directly it can use `viewChild()`; for deeper or sibling communication use a shared service.',
      },
      {
        type: 'paragraph',
        text: "Inputs and outputs are the default because they make the data flow explicit in the template: data goes down, events go up. The child stays reusable and doesn't know who its parent is.",
      },
      { type: 'heading3', text: 'Modern (signal-based) API' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// child
@Component({
  selector: 'app-product-card',
  template: \`
    <h3>{{ product().name }}</h3>
    <p>{{ product().price | currency }}</p>
    <button (click)="addToCart.emit(product().id)">Add</button>
    <input type="number" [value]="qty()" (input)="qty.set(+$any($event.target).value)" />
  \`,
  imports: [CurrencyPipe],
})
export class ProductCard {
  product = input.required<Product>();          // parent → child (readonly signal)
  compact = input(false, { transform: booleanAttribute });
  addToCart = output<number>();                 // child → parent
  qty = model(1);                               // two-way: [(qty)]
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- parent template -->
@for (p of products(); track p.id) {
  <app-product-card
    [product]="p"
    compact
    [(qty)]="quantities[p.id]"
    (addToCart)="onAdd($event)" />
}`,
      },
      { type: 'heading3', text: 'Legacy decorator API (still common in existing code)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ProductCardLegacy implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Output() addToCart = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product']) { /* react to new input */ }
  }
}
// With signal inputs you use computed()/effect() instead of ngOnChanges`,
      },
      { type: 'heading3', text: 'Parent calling the child: viewChild' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class CheckoutPage {
  private player = viewChild.required(VideoPlayer); // Signal<VideoPlayer>
  replay() { this.player().seek(0); }
}
// Legacy: @ViewChild(VideoPlayer) player!: VideoPlayer; (available from ngAfterViewInit)
// Template reference: <app-video-player #p /> <button (click)="p.seek(0)">`,
      },
      {
        type: 'flow',
        title: 'Parent ↔ child data flow',
        code: `flowchart TD
  P[Parent component]:::server -->|"[input] data down"| C[Child component]:::client
  C -->|"(output) events up"| P
  P <-->|"[(model)] two-way"| C
  P -.->|"viewChild() direct call"| C`,
      },
      {
        type: 'bullets',
        items: [
          'Signal inputs are read-only; never mutate an input object in the child — emit an event and let the parent change it.',
          "`output()` returns an `OutputEmitterRef`; it's not an RxJS Subject. Use `outputFromObservable()` to expose a stream.",
          'Use `transform` (e.g. `booleanAttribute`, `numberAttribute`) to coerce attribute inputs.',
          'Content projection (`<ng-content>`) is another way to "pass" UI from parent to child.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "data down, events up", show both the signal API and the decorator API, and mention that beyond one or two levels you switch to a shared service rather than prop-drilling.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: In a large Angular application, how do you pass data between components?',
      },
      {
        type: 'paragraph',
        text: 'Layered: presentational components get data only through inputs/outputs; smart (container) components read from **feature-scoped stores** (signal-based services or NgRx Signal Store) and dispatch commands; truly global state (auth user, settings) lives in root-level stores or NgRx Store; and anything that should be shareable or survive refresh goes in the URL.',
      },
      {
        type: 'paragraph',
        text: 'In a large app the problem isn\'t "how do I move a value" but "how do I keep data flow predictable for 20 developers". That means clear ownership: every piece of state has exactly one owner, and components either own nothing (presentational) or talk to a store (containers).',
      },
      { type: 'heading3', text: 'Container / presentational split' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Container: knows about the store, no styling logic
@Component({
  selector: 'app-orders-page',
  imports: [OrdersTable, OrderFilters],
  template: \`
    <app-order-filters [filters]="store.filters()" (changed)="store.setFilters($event)" />
    <app-orders-table [orders]="store.visibleOrders()" [loading]="store.loading()"
                      (cancel)="store.cancel($event)" />
  \`,
})
export class OrdersPage {
  protected store = inject(OrdersStore); // feature-scoped
}

// Presentational: only inputs/outputs — reusable and trivially testable
@Component({ selector: 'app-orders-table', template: '...', changeDetection: ChangeDetectionStrategy.OnPush })
export class OrdersTable {
  orders = input.required<Order[]>();
  loading = input(false);
  cancel = output<string>();
}`,
      },
      { type: 'heading3', text: 'Feature store scoped to a route' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// routes: one OrdersStore instance for the whole orders feature, destroyed on leave
export const routes: Routes = [
  {
    path: 'orders',
    providers: [OrdersStore],
    loadChildren: () => import('./orders/orders.routes'),
  },
];

@Injectable()
export class OrdersStore {
  private api = inject(OrdersApi);
  private readonly state = signal({ orders: [] as Order[], filters: {} as Filters, loading: false });
  readonly orders = computed(() => this.state().orders);
  readonly filters = computed(() => this.state().filters);
  readonly loading = computed(() => this.state().loading);
  readonly visibleOrders = computed(() => applyFilters(this.orders(), this.filters()));

  setFilters(filters: Filters) { this.state.update((s) => ({ ...s, filters })); }
  cancel(id: string) { /* call API, then update state */ }
}`,
      },
      {
        type: 'flow',
        title: 'Layers of state in a large app',
        code: `flowchart TD
  URL["URL: route + query params"]:::network --> C[Container components]:::server
  G[("Global store<br/>auth, settings")]:::cache --> C
  F[("Feature store<br/>per route")]:::cache --> C
  C -->|inputs| P[Presentational components]:::client
  P -->|outputs| C
  C -->|commands| F
  F --> API[HTTP API]:::external`,
      },
      {
        type: 'bullets',
        items: [
          '**Global** (root): current user, permissions, theme, feature flags.',
          '**Feature** (route-level providers): data of one area; reset automatically when you leave it.',
          '**Local** (component signals): UI state like "is the panel open".',
          '**URL**: filters, pagination, selected id — shareable and refresh-safe.',
          'Use NgRx Store when you need strict unidirectional flow, devtools/time-travel, and many teams touching the same state; otherwise signal services or Signal Store are lighter.',
          "Enforce boundaries (lint rules / Nx module boundaries) so features don't reach into each other's stores.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: talk about **ownership and scope** — global vs feature vs local vs URL — plus the smart/dumb split. That signals architectural thinking more than naming APIs.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: How is your application managing state and sharing data between components?',
      },
      {
        type: 'paragraph',
        text: 'Answer with your real architecture, organised by scope: local UI state in component signals; feature state in route-scoped signal services or Signal Store; global state (auth, settings) in root services or NgRx Store; server data cached in the store; and shareable state in the URL — plus why that choice fit the app. Use the structure below and fill in your own project details.',
      },
      {
        type: 'paragraph',
        text: 'This is an experience question. The interviewer wants to hear a coherent, justified design — not every API you know. Describe the layers, give one concrete example flow, mention a trade-off or something you would change, and be honest about what you actually used.',
      },
      { type: 'heading3', text: 'A structure for your answer' },
      {
        type: 'numbered',
        items: [
          '**Context** — app type and size: "[your project] is an Angular [version] app with [N] feature areas used by [users]."',
          '**Layers of state** — local, feature, global, URL, server cache — and which tool you used for each.',
          '**Data flow** — container components read from stores and pass data to presentational components via inputs; events go back up via outputs and call store methods/dispatch actions.',
          '**One concrete example** — e.g. "when a user updates an order, …".',
          '**Why** — the trade-off that drove the choice (team size, complexity, devtools, boilerplate).',
          "**Reflection** — what you'd improve (e.g. migrating BehaviorSubject services to signals).",
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"In [your project], a [domain] portal with about [N] modules, we split state by scope. UI-only state like open panels or selected tabs lives in component signals. Each feature — orders, customers, reports — has a store service provided on its route, built with signals (`signal` + `computed`) [or NgRx Signal Store], so it\'s created when you enter the feature and destroyed when you leave. Cross-cutting state like the logged-in user, permissions and tenant settings is in root-level services [or NgRx Store, because several teams contribute to it and we wanted Redux DevTools]. Filters and pagination go in query params so links are shareable. Containers inject the store and pass data to presentational OnPush components through inputs. For example, when an agent updates an order, the editor calls `ordersStore.update()`, which calls the API and upserts the result, and the list, the summary card and the header badge all update from the same signal. If I started again I would [your improvement]."',
      },
      {
        type: 'code',
        lang: 'text',
        code: `Scope          | Where it lives                       | Example
---------------|--------------------------------------|---------------------------
Local UI       | component signal()                   | isPanelOpen, selectedTab
Feature        | route-provided store (signals/Signal Store) | orders list, filters
Global         | root service / NgRx Store            | user, permissions, theme
URL            | route + query params                 | /orders/42?page=2
Server cache   | store + HTTP (or TanStack Query)     | product catalogue
Real-time      | WebSocket/SSE → store                | order status updates`,
      },
      {
        type: 'bullets',
        items: [
          'What interviewers look for: clear ownership, unidirectional flow, justified tool choice, awareness of trade-offs.',
          'If you used NgRx, be ready for follow-ups on effects, selectors/memoisation and entity adapters.',
          'If you used services, be ready to explain how you avoid exposing writable state and how you handle loading/error states.',
          "Don't claim tools you haven't used in production — say \"I've evaluated X\" instead.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: draw the layers quickly (local / feature / global / URL) and walk through one real user action end-to-end. A concrete flow is far more convincing than a list of libraries.',
      },
    ],
  },

  'Is passing state and parameters through Angular routing preferred over using a shared service? When should each be used?':
    {
      summary:
        "Neither is universally preferred — they solve different problems. Use the **router** (path params, query params) for state that identifies what the page shows and must survive refresh, deep links, back/forward and sharing. Use a **shared service** for in-memory application state: large objects, data shared by components on the same screen, or state that shouldn't be in the URL.",
      details: [
        {
          type: 'paragraph',
          text: 'A good rule: if a user would expect to copy the URL and get the same screen, the state belongs in the URL. Typically you pass the **id** through the route and let a service/store fetch or cache the **entity**.',
        },
        { type: 'heading3', text: 'Router: ids, filters, pagination' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// /products?category=shoes&page=2&sort=price
this.router.navigate([], {
  queryParams: { category: 'shoes', page: 2 },
  queryParamsHandling: 'merge',
});

// With withComponentInputBinding(), params arrive as inputs
export class ProductList {
  category = input<string>();
  page = input(1, { transform: numberAttribute });
  private store = inject(ProductStore);
  constructor() {
    effect(() => this.store.load({ category: this.category(), page: this.page() }));
  }
}`,
        },
        { type: 'heading3', text: 'Service: objects and cross-component state' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// List → detail: pass only the id in the route; the store may already have the entity
this.router.navigate(['/products', product.id]);

export class ProductDetail {
  id = input.required<string>();
  private store = inject(ProductStore);
  product = computed(() => this.store.byId(this.id())); // cached, or loaded on demand
}`,
        },
        { type: 'heading3', text: 'Navigation state (history.state)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// OK for transient UI hints that can be lost safely
this.router.navigate(['/checkout/success'], { state: { orderNo: 'A-1001' } });
// ⚠️ Lost on refresh / deep link — always have a fallback`,
        },
        {
          type: 'bullets',
          items: [
            '**Router — use for**: ids, search/filter/sort, pagination, active tab; anything bookmarkable, shareable, refresh-safe.',
            '**Router — avoid for**: large objects, sensitive data (URLs are logged and visible), frequently changing values.',
            '**Service — use for**: entities and caches, data shared by several components on screen, user session, wizard drafts.',
            '**Service — avoid for**: the only copy of "which item is shown" — a refresh loses it unless persisted.',
            'Combine both: URL holds the key, service holds the data.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Pitfall: passing a whole object via `history.state` or a service and having the detail page break on refresh or when opened in a new tab. Always be able to rebuild the page from the URL alone.',
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: How to set query parameters?' },
        {
          type: 'paragraph',
          text: "In the template use `[queryParams]` on a `routerLink`; in code use `router.navigate([path], { queryParams: {...} })` or `router.navigateByUrl` with a `UrlTree` from `router.createUrlTree`. Add `queryParamsHandling: 'merge'` to keep existing params, and read them with `ActivatedRoute.queryParamMap` or, with `withComponentInputBinding()`, directly as component inputs.",
        },
        {
          type: 'paragraph',
          text: 'Query parameters (`/products?category=shoes&page=2`) are optional, shareable state: filters, sorting, pagination, search terms. Unlike path params they do not change which route matches.',
        },
        { type: 'heading3', text: 'Setting them' },
        {
          type: 'code',
          lang: 'html',
          code: `<!-- Template: /products?category=shoes&page=1 -->
<a routerLink="/products" [queryParams]="{ category: 'shoes', page: 1 }">Shoes</a>

<!-- Keep current params and only change page -->
<a [routerLink]="[]" [queryParams]="{ page: 2 }" queryParamsHandling="merge">Next</a>`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `private router = inject(Router);
private route = inject(ActivatedRoute);

applyFilter(category: string) {
  this.router.navigate([], {                // [] = stay on the current route
    relativeTo: this.route,
    queryParams: { category, page: 1 },
    queryParamsHandling: 'merge',           // keep e.g. ?sort=price
    replaceUrl: true,                       // don't spam browser history on each filter change
  });
}

clearCategory() {
  // null removes a param when merging
  this.router.navigate([], { queryParams: { category: null }, queryParamsHandling: 'merge' });
}`,
        },
        { type: 'heading3', text: 'Reading them' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Option A: ActivatedRoute (reacts to changes on the same component instance)
category$ = inject(ActivatedRoute).queryParamMap.pipe(map(p => p.get('category') ?? 'all'));

// Option B: component input binding — provideRouter(routes, withComponentInputBinding())
export class ProductListComponent {
  category = input<string>();               // filled from ?category=...
  page = input(1, { transform: numberAttribute });
}`,
        },
        {
          type: 'bullets',
          items: [
            'Query param values are always strings in the URL — convert numbers/booleans yourself.',
            "`queryParamsHandling`: `'merge'` (combine), `'preserve'` (keep current, ignore new), default replaces them all.",
            "Arrays: `{ tag: ['a', 'b'] }` → `?tag=a&tag=b`; read with `paramMap.getAll('tag')`.",
            'Use `snapshot.queryParamMap` only if the component is recreated on every navigation; otherwise subscribe or use inputs.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: mention keeping filter state in query params so the page is bookmarkable and survives refresh — and `replaceUrl: true` so the back button is not flooded with every keystroke.',
        },
      ],
    },

  'You have a value that has to be shared across all components. How do you implement this cleanly in Angular?':
    {
      summary:
        "Create a root-provided service (`@Injectable({ providedIn: 'root' })`) that owns the value in a private writable `signal` and exposes it read-only (`asReadonly()` / `computed`) plus intent-revealing methods to change it. Any component injects it with `inject()`. If the value is static configuration rather than state, use an `InjectionToken` instead.",
      details: [
        {
          type: 'paragraph',
          text: '"Clean" means: a single source of truth, encapsulated writes, read-only access for consumers, reactive updates everywhere, and no globals. A root service is a singleton for the whole app, so every component sees the same value.',
        },
        { type: 'heading3', text: 'Mutable shared state: signal service' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly _currency = signal<'INR' | 'USD' | 'EUR'>(
    (localStorage.getItem('currency') as 'INR' | 'USD' | 'EUR') ?? 'INR',
  );
  readonly currency = this._currency.asReadonly(); // consumers can read, not set

  constructor() {
    effect(() => localStorage.setItem('currency', this._currency())); // persist
  }

  setCurrency(c: 'INR' | 'USD' | 'EUR') {
    this._currency.set(c);
  }
}

// Anywhere:
export class PriceTag {
  amount = input.required<number>();
  currency = inject(CurrencyService).currency;
}
// template: {{ amount() | currency: currency() }}  — updates everywhere instantly`,
        },
        { type: 'heading3', text: 'Static value: InjectionToken' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export interface AppConfig { apiUrl: string; featureFlags: Record<string, boolean> }
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// app.config.ts
providers: [{ provide: APP_CONFIG, useValue: { apiUrl: '/api', featureFlags: { beta: true } } }];

// consumer
private config = inject(APP_CONFIG);`,
        },
        {
          type: 'bullets',
          items: [
            'Keep the writable signal/subject **private**; expose read-only views. Otherwise any component can set it and debugging becomes hard.',
            'RxJS alternative: private `BehaviorSubject`, public `asObservable()` — same encapsulation idea.',
            'Avoid: global variables, `window` properties, static class fields, or putting the value in `AppComponent` and passing it down through every input.',
            "Avoid re-providing the service in a component's `providers` by accident — that creates a separate instance for that subtree.",
            'For SSR, guard `localStorage` access (`isPlatformBrowser`) or use an abstraction.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: explicitly mention the **private writable / public read-only** pattern and the difference between state (service with signal) and configuration (InjectionToken). That is what "cleanly" is testing.',
        },
      ],
    },

  'Write the TypeScript syntax and code to implement a shared state service (`using BehaviorSubject or Signals`) across all components.':
    {
      summary:
        'A root-provided service holding state in a private `BehaviorSubject` (exposed with `asObservable()`) or a private `signal` (exposed with `asReadonly()`/`computed()`), with methods that update state immutably. Components inject it and read via the `async` pipe or by calling the signal.',
      details: [
        {
          type: 'paragraph',
          text: 'Below is the same todo-style shared state written both ways, then a component that uses it. Both versions follow the same rules: one private writable source, read-only public API, immutable updates, derived values computed from state.',
        },
        { type: 'heading3', text: 'Version 1: Signals (recommended for new code)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { Injectable, computed, signal } from '@angular/core';

export interface Task { id: number; title: string; done: boolean }
interface TaskState { tasks: Task[]; filter: 'all' | 'open' | 'done' }

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly state = signal<TaskState>({ tasks: [], filter: 'all' });

  // Read-only selectors
  readonly tasks = computed(() => this.state().tasks);
  readonly filter = computed(() => this.state().filter);
  readonly visible = computed(() => {
    const { tasks, filter } = this.state();
    return filter === 'all' ? tasks : tasks.filter((t) => (filter === 'done' ? t.done : !t.done));
  });
  readonly remaining = computed(() => this.tasks().filter((t) => !t.done).length);

  // Mutations — always create new objects/arrays
  add(title: string) {
    this.state.update((s) => ({ ...s, tasks: [...s.tasks, { id: Date.now(), title, done: false }] }));
  }
  toggle(id: number) {
    this.state.update((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }
  setFilter(filter: TaskState['filter']) {
    this.state.update((s) => ({ ...s, filter }));
  }
}`,
        },
        { type: 'heading3', text: 'Version 2: BehaviorSubject' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { Injectable } from '@angular/core';
import { BehaviorSubject, map, distinctUntilChanged } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskStoreRx {
  private readonly state$ = new BehaviorSubject<TaskState>({ tasks: [], filter: 'all' });

  readonly tasks$ = this.state$.pipe(map((s) => s.tasks), distinctUntilChanged());
  readonly remaining$ = this.tasks$.pipe(map((ts) => ts.filter((t) => !t.done).length));

  private get state() { return this.state$.getValue(); } // synchronous snapshot

  add(title: string) {
    const s = this.state;
    this.state$.next({ ...s, tasks: [...s.tasks, { id: Date.now(), title, done: false }] });
  }
  toggle(id: number) {
    const s = this.state;
    this.state$.next({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  }
}`,
        },
        { type: 'heading3', text: 'Consuming it from any component' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-task-list',
  imports: [AsyncPipe],
  template: \`
    <!-- Signal version -->
    <p>{{ store.remaining() }} remaining</p>
    @for (t of store.visible(); track t.id) {
      <label><input type="checkbox" [checked]="t.done" (change)="store.toggle(t.id)" /> {{ t.title }}</label>
    }

    <!-- BehaviorSubject version -->
    <p>{{ rx.remaining$ | async }} remaining</p>
  \`,
})
export class TaskList {
  protected store = inject(TaskStore);
  protected rx = inject(TaskStoreRx);
}

// Another, unrelated component sees the same state:
@Component({ selector: 'app-header', template: '<span class="badge">{{ store.remaining() }}</span>' })
export class Header { protected store = inject(TaskStore); }`,
        },
        {
          type: 'bullets',
          items: [
            '**Signals**: synchronous, no subscriptions, fine-grained change detection (works great zoneless/OnPush), `computed` is memoised.',
            '**BehaviorSubject**: always has a current value, replays it to late subscribers; best when you need RxJS operators (debounce, switchMap, websockets).',
            'Interop: `toSignal(obs$)` and `toObservable(signal)` from `@angular/core/rxjs-interop`.',
            'Immutable updates matter: mutating the array in place (`tasks.push`) would not notify signal consumers because the reference is unchanged.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Pitfall: exposing the `BehaviorSubject` or `WritableSignal` publicly. Any component can then call `.next()`/`.set()` and you lose the single place where state changes — the whole point of the service.',
        },
      ],
    },

  'If admin updates data and changes need to reflect in multiple components simultaneously, how?': {
    summary:
      'Route all reads through a single shared store (signal service, BehaviorSubject service or NgRx). When the admin saves, the store updates its state (optimistically or from the API response), and every component bound to that state re-renders automatically. If other users/tabs must see it too, push the change from the server via WebSocket/SSE (or BroadcastChannel across tabs) into the same store.',
    details: [
      {
        type: 'paragraph',
        text: 'There are two scopes to this question: components inside the **same browser session** (solved by a shared reactive store), and **other users or tabs** (solved by a server push or cross-tab channel feeding that store). Either way, components never hold their own copy of the data — they read from the store.',
      },
      { type: 'heading3', text: 'Same session: shared store' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class ProductStore {
  private http = inject(HttpClient);
  private readonly _products = signal<Product[]>([]);
  readonly products = this._products.asReadonly();
  readonly featured = computed(() => this._products().filter((p) => p.featured));

  load() {
    this.http.get<Product[]>('/api/products').subscribe((list) => this._products.set(list));
  }

  // Admin edit: one update, every consumer re-renders
  update(changes: Product) {
    return this.http.put<Product>(\`/api/products/\${changes.id}\`, changes).pipe(
      tap((saved) => this.upsert(saved)),
    );
  }

  upsert(p: Product) {
    this._products.update((list) =>
      list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p],
    );
  }
}

// AdminEditor calls store.update(...)
// ProductGrid, FeaturedBanner, CartSummary all read store.products()/featured() → update together`,
      },
      { type: 'heading3', text: 'Other users / tabs: server push into the same store' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class ProductRealtime {
  private store = inject(ProductStore);

  connect() {
    const source = new EventSource('/api/products/stream'); // or WebSocket / SignalR / socket.io
    source.addEventListener('product-updated', (e) => {
      this.store.upsert(JSON.parse((e as MessageEvent).data));
    });
    return () => source.close();
  }
}`,
      },
      {
        type: 'flow',
        title: 'Admin update propagation',
        code: `sequenceDiagram
  participant A as Admin editor
  participant S as ProductStore
  participant API as Server
  participant O as Other users
  A->>S: update(product)
  S->>API: PUT /products/42
  API-->>S: saved product
  S-->>A: signal changes, UI re-renders
  Note over S: Grid, banner, cart update together
  API--)O: SSE or WebSocket push
  O->>O: their store.upsert(product)`,
      },
      {
        type: 'bullets',
        items: [
          'Never copy store data into local component fields (`this.list = store.products()` once) — bind to the signal/observable so updates flow.',
          'Optimistic update: change the store first, roll back on error (better UX for admins).',
          'Same user, multiple tabs: `BroadcastChannel` to relay the change between tabs.',
          'With NgRx: dispatch `updateProductSuccess`; the reducer updates the entity; every selector consumer re-renders. A WebSocket effect can dispatch the same action for remote changes.',
          "Polling is an acceptable fallback when push isn't available.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: clarify scope first — "same screen/session, or other users too?" — then answer both: a single reactive store for in-app propagation, and server push feeding that store for multi-user propagation.',
      },
    ],
  },
};
