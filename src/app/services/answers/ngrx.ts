import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is NgRx and how did you implement it in Angular applications?': {
    summary:
      'NgRx is a set of reactive state-management libraries for Angular inspired by Redux: a single immutable **Store**, state changed only by **Actions** handled in pure **Reducers**, side effects (HTTP, storage) isolated in **Effects**, and data read through memoised **Selectors**. Explain it, then describe how you used it in your project — which features went into the store, how you structured feature state, and why.',
    details: [
      {
        type: 'paragraph',
        text: 'This question has two halves: the concept (what NgRx is) and your experience (how you implemented it). Keep the concept part short and spend most of the time on a concrete feature you built, then mention the trade-off you considered.',
      },
      { type: 'heading3', text: 'The concept in one picture' },
      {
        type: 'flow',
        title: 'NgRx building blocks',
        code: `flowchart LR
  C[Component]:::client -->|dispatch| A[Action]:::highlight
  A --> R[Reducer]:::server
  R --> S[(Store)]:::cache
  S -->|selector| C
  A --> E[Effect]:::server
  E --> API[HTTP API]:::external
  E -->|success / failure action| A`,
      },
      { type: 'heading3', text: 'A typical feature implementation' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// orders.actions.ts
export const OrdersActions = createActionGroup({
  source: 'Orders',
  events: {
    'Load Orders': emptyProps(),
    'Load Orders Success': props<{ orders: Order[] }>(),
    'Load Orders Failure': props<{ error: string }>(),
  },
});

// orders.feature.ts
interface OrdersState { orders: Order[]; loading: boolean; error: string | null }
const initialState: OrdersState = { orders: [], loading: false, error: null };

export const ordersFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialState,
    on(OrdersActions.loadOrders, (s) => ({ ...s, loading: true, error: null })),
    on(OrdersActions.loadOrdersSuccess, (s, { orders }) => ({ ...s, orders, loading: false })),
    on(OrdersActions.loadOrdersFailure, (s, { error }) => ({ ...s, error, loading: false })),
  ),
});
// createFeature generates: selectOrdersState, selectOrders, selectLoading, selectError

// orders.effects.ts (functional effect)
export const loadOrders = createEffect(
  (actions$ = inject(Actions), api = inject(OrdersApi)) =>
    actions$.pipe(
      ofType(OrdersActions.loadOrders),
      switchMap(() =>
        api.getAll().pipe(
          map((orders) => OrdersActions.loadOrdersSuccess({ orders })),
          catchError((e) => of(OrdersActions.loadOrdersFailure({ error: e.message }))),
        ),
      ),
    ),
  { functional: true },
);

// component
export class OrdersPage {
  private store = inject(Store);
  orders = this.store.selectSignal(ordersFeature.selectOrders);
  loading = this.store.selectSignal(ordersFeature.selectLoading);
  constructor() { this.store.dispatch(OrdersActions.loadOrders()); }
}`,
      },
      { type: 'heading3', text: 'Sample experience answer (replace placeholders)' },
      {
        type: 'paragraph',
        text: '"In [your project], a [domain] app with [N] feature modules, we used NgRx for shared, long-lived state: the authenticated user and permissions, [entity A] and [entity B] which several screens edit. Each feature had its own `createFeature` slice registered lazily with `provideState` on its route, actions defined with `createActionGroup`, and functional effects for API calls. We used `@ngrx/entity` for collections and Store DevTools for debugging. Purely local UI state stayed in component signals. The main benefit was predictable data flow across [N] developers; the cost was boilerplate, which we reduced with `createFeature` and action groups."',
      },
      {
        type: 'bullets',
        items: [
          'Packages: `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`, `@ngrx/store-devtools`, `@ngrx/router-store`, `@ngrx/signals` (Signal Store), `@ngrx/operators`.',
          'Why NgRx: single source of truth, unidirectional flow, time-travel debugging, easy testing (pure reducers/selectors).',
          'Why not everywhere: boilerplate and indirection — overkill for small apps or purely local state.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: interviewers often follow up with "what would you NOT put in the store?" — have an answer ready: form drafts, UI toggles, one-screen data.',
      },
    ],
  },

  'What is NgRx and how does its Redux-pattern architecture (`Store, Actions, Reducers, Effects, Selectors`) work in Angular?':
    {
      summary:
        'NgRx implements the Redux pattern with RxJS: the **Store** holds one immutable state tree; **Actions** are plain objects describing events; **Reducers** are pure functions `(state, action) => newState`; **Selectors** are memoised queries that derive data from state; **Effects** listen to the action stream, perform side effects such as HTTP, and dispatch new actions. Data flows in one direction.',
      details: [
        {
          type: 'paragraph',
          text: 'The three Redux principles apply: single source of truth, state is read-only (only actions describe changes), and changes are made by pure functions. NgRx adds Angular-specific pieces: DI, RxJS streams, Effects as the side-effect model, and signal-based selection.',
        },
        { type: 'heading3', text: 'Each piece' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// ACTION — "what happened" (an event, not a command)
export const addToCart = createAction('[Product Page] Add To Cart', props<{ productId: string }>());
// { type: '[Product Page] Add To Cart', productId: 'p1' }

// REDUCER — pure, synchronous, immutable
export const cartReducer = createReducer(
  { items: [] as string[] },
  on(addToCart, (state, { productId }) => ({ ...state, items: [...state.items, productId] })),
);

// SELECTOR — memoised query over state
export const selectCart = createFeatureSelector<{ items: string[] }>('cart');
export const selectCartCount = createSelector(selectCart, (cart) => cart.items.length);

// EFFECT — side effects; listens to actions, emits actions
export const persistCart = createEffect(
  (actions$ = inject(Actions), store = inject(Store)) =>
    actions$.pipe(
      ofType(addToCart),
      concatLatestFrom(() => store.select(selectCart)),
      tap(([, cart]) => localStorage.setItem('cart', JSON.stringify(cart))),
    ),
  { functional: true, dispatch: false },
);

// STORE — inject, dispatch, select
const store = inject(Store);
store.dispatch(addToCart({ productId: 'p1' }));
const count = store.selectSignal(selectCartCount); // Signal<number>`,
        },
        {
          type: 'flow',
          title: 'Unidirectional data flow',
          code: `sequenceDiagram
  participant C as Component
  participant S as Store
  participant R as Reducer
  participant E as Effect
  participant API as Backend
  C->>S: dispatch(loadUsers)
  S->>R: (state, action)
  R-->>S: new state with loading true
  S->>E: action stream
  E->>API: GET /users
  API-->>E: users
  E->>S: dispatch(loadUsersSuccess)
  S->>R: (state, action)
  R-->>S: new state with users
  S-->>C: selector emits new value`,
        },
        {
          type: 'bullets',
          items: [
            '**Store** — an observable of state + `dispatch()`; also `selectSignal()` for signals.',
            '**Actions** — name them as events with a source: `[Login Page] Submit`, not `setUser`.',
            '**Reducers** — no HTTP, no `Date.now()`, no mutation; always return a new object for changes.',
            '**Selectors** — memoised; recompute only when inputs change; composeable.',
            '**Effects** — the only place for async/side effects; can be `dispatch: false` for fire-and-forget.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: stress that reducers run **before** effects receive the action, and that effects never mutate state directly — they can only dispatch more actions.',
        },
      ],
    },

  'What are the steps to set up NgRx in an Angular application?': {
    summary:
      'Install packages (`ng add @ngrx/store`, plus effects, devtools, entity as needed), register the root store with `provideStore()` in `app.config.ts`, add `provideStoreDevtools()` and `provideEffects()`, then for each feature define actions, a reducer (ideally via `createFeature`), selectors and effects, register them with `provideState()`/`provideEffects()` (often on a lazy route), and use `Store` in components to `dispatch` and `select`.',
    details: [
      {
        type: 'paragraph',
        text: 'In standalone Angular there are no `StoreModule.forRoot/forFeature` imports needed — the provider functions replace them. The legacy NgModule API still works and is worth mentioning.',
      },
      { type: 'heading3', text: '1. Install' },
      {
        type: 'code',
        lang: 'bash',
        code: `ng add @ngrx/store@latest
ng add @ngrx/effects@latest
ng add @ngrx/store-devtools@latest
npm i @ngrx/entity @ngrx/operators   # optional`,
      },
      { type: 'heading3', text: '2. Root providers' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideStore(),                    // root store (add root reducers here if any)
    provideEffects(),                  // root effects (optional)
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};`,
      },
      { type: 'heading3', text: '3. Feature: actions, reducer/selectors, effects' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// products.actions.ts
export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ products: Product[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});

// products.feature.ts
export const productsFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    { products: [] as Product[], loading: false, error: null as string | null },
    on(ProductsActions.load, (s) => ({ ...s, loading: true })),
    on(ProductsActions.loadSuccess, (s, { products }) => ({ ...s, products, loading: false })),
    on(ProductsActions.loadFailure, (s, { error }) => ({ ...s, error, loading: false })),
  ),
});

// products.effects.ts
export const loadProducts = createEffect(
  (actions$ = inject(Actions), api = inject(ProductsApi)) =>
    actions$.pipe(
      ofType(ProductsActions.load),
      switchMap(() => api.list().pipe(
        map((products) => ProductsActions.loadSuccess({ products })),
        catchError((e) => of(ProductsActions.loadFailure({ error: e.message }))),
      )),
    ),
  { functional: true },
);`,
      },
      { type: 'heading3', text: '4. Register the feature (lazily)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// app.routes.ts
{
  path: 'products',
  providers: [provideState(productsFeature), provideEffects({ loadProducts })],
  loadComponent: () => import('./products/products-page'),
}`,
      },
      { type: 'heading3', text: '5. Use it in a component' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export default class ProductsPage {
  private store = inject(Store);
  products = this.store.selectSignal(productsFeature.selectProducts);
  loading = this.store.selectSignal(productsFeature.selectLoading);
  ngOnInit() { this.store.dispatch(ProductsActions.load()); }
}

// Legacy NgModule equivalent:
// StoreModule.forRoot({}), EffectsModule.forRoot([]), StoreDevtoolsModule.instrument()
// StoreModule.forFeature(productsFeature), EffectsModule.forFeature([ProductsEffects])`,
      },
      {
        type: 'bullets',
        items: [
          'Optional: `provideRouterStore()` to put router state in the store; runtime checks (immutability, serializability) are on by default in dev mode.',
          'Folder per feature: `*.actions.ts`, `*.feature.ts` (reducer + selectors), `*.effects.ts`, `*.selectors.ts` for derived selectors.',
          'Write unit tests for reducers and selectors first — they are pure functions.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention lazy feature registration with `provideState` on routes — it shows you know the store can grow with lazy loading instead of loading every reducer at startup.',
      },
    ],
  },

  'Explain the NgRx data flow: Action → Reducer → Store → Selector → Component → Effect → Action': {
    summary:
      'A component dispatches an **action**; the store passes it with the current state to the **reducers**, which synchronously return new state; the **store** emits that state; **selectors** derive and memoise the slices the **component** needs, so its view updates. After the reducers run, **effects** also receive the action, perform side effects (e.g. HTTP) and dispatch a new success/failure **action**, which starts the loop again.',
    details: [
      {
        type: 'paragraph',
        text: 'The loop is strictly one-way: nothing writes to state except reducers, and reducers only react to actions. That is what makes NgRx apps predictable and replayable in DevTools.',
      },
      {
        type: 'flow',
        title: 'The full loop',
        code: `flowchart LR
  C[Component]:::client -->|"1 dispatch"| A[Action]:::highlight
  A -->|"2 state + action"| R[Reducer]:::server
  R -->|"3 new state"| S[(Store)]:::cache
  S -->|"4 state$"| SE[Selector]:::server
  SE -->|"5 derived data"| C
  A -->|"6 actions$"| E[Effect]:::server
  E -->|"7 HTTP"| API[Backend]:::external
  API --> E
  E -->|"8 new action"| A`,
      },
      { type: 'heading3', text: 'Walk-through: searching products' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// 1. Component dispatches
this.store.dispatch(SearchActions.search({ term: 'shoes' }));

// 2–3. Reducer runs synchronously → new state { term: 'shoes', loading: true }
on(SearchActions.search, (s, { term }) => ({ ...s, term, loading: true })),

// 4–5. Selectors recompute; component updates (spinner shows)
loading = this.store.selectSignal(searchFeature.selectLoading);

// 6–7. Effect receives the same action AFTER reducers, calls API
search$ = createEffect(() => this.actions$.pipe(
  ofType(SearchActions.search),
  switchMap(({ term }) => this.api.search(term).pipe(
    // 8. New action back into the loop
    map((results) => SearchActions.searchSuccess({ results })),
    catchError((e) => of(SearchActions.searchFailure({ error: e.message }))),
  )),
));

// Loop again: reducer stores results, loading=false → selectors → component shows results`,
      },
      {
        type: 'bullets',
        items: [
          'Reducers are synchronous; by the time an effect sees the action, state already reflects it.',
          "Selectors only emit when their output changes (memoisation + `distinctUntilChanged`), so unrelated state changes don't re-render the component.",
          'An effect may dispatch zero (`dispatch: false`), one, or many actions.',
          'The component never knows about HTTP — it only dispatches events and reads selectors.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: an effect that listens to the same action it dispatches creates an infinite loop. Always map to a different action type.',
      },
    ],
  },

  'What is the difference between createAction, createReducer, and createEffect?': {
    summary:
      '`createAction` defines a typed action creator — the "event" with a type string and optional payload (`props`). `createReducer` defines a pure function that maps the current state plus an action to the next state, using `on(action, handler)`. `createEffect` defines a side-effect stream that listens to actions (`ofType`), does async work, and usually returns new actions.',
    details: [
      {
        type: 'paragraph',
        text: 'They are the three "write-side" building blocks. Actions describe what happened, reducers decide how state changes synchronously, and effects handle everything that is not a pure state change.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// createAction — returns a function that builds { type, ...payload }
export const login = createAction('[Login Page] Login', props<{ email: string; password: string }>());
export const loginSuccess = createAction('[Auth API] Login Success', props<{ user: User }>());
export const loginFailure = createAction('[Auth API] Login Failure', props<{ error: string }>());

login({ email: 'a@b.com', password: 'x' });
// → { type: '[Login Page] Login', email: 'a@b.com', password: 'x' }

// createReducer — pure, synchronous: (state, action) => newState
export const authReducer = createReducer(
  { user: null as User | null, pending: false, error: null as string | null },
  on(login, (s) => ({ ...s, pending: true, error: null })),
  on(loginSuccess, (s, { user }) => ({ ...s, user, pending: false })),
  on(loginFailure, (s, { error }) => ({ ...s, error, pending: false })),
);

// createEffect — Observable of actions in, Observable of actions out
export const login$ = createEffect(
  (actions$ = inject(Actions), auth = inject(AuthApi)) =>
    actions$.pipe(
      ofType(login),
      exhaustMap(({ email, password }) =>        // ignore double-clicks while pending
        auth.login(email, password).pipe(
          map((user) => loginSuccess({ user })),
          catchError((e) => of(loginFailure({ error: e.message }))),
        ),
      ),
    ),
  { functional: true },
);

export const redirectAfterLogin$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(ofType(loginSuccess), tap(() => router.navigate(['/home']))),
  { functional: true, dispatch: false },       // side effect only, no new action
);`,
      },
      {
        type: 'bullets',
        items: [
          '**createAction** — what: event definition. Pure data. Also `createActionGroup` to define several with one `source`.',
          '**createReducer** — how state changes. Pure, synchronous, immutable, no DI.',
          '**createEffect** — side effects: HTTP, routing, storage, analytics, timers. Asynchronous, uses DI and RxJS.',
          'Effects can be class-based (`@Injectable` class with `createEffect` properties) or functional (`{ functional: true }`).',
          'Selectors (`createSelector`) are the read-side counterpart.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a crisp one-liner per piece — "action = what happened, reducer = how state changes, effect = what else should happen" — then show the choice of flattening operator in the effect.',
      },
    ],
  },

  'What is the difference between dispatch and select in NgRx? How do you avoid unnecessary re-renders via selectors?':
    {
      summary:
        '`dispatch(action)` is the write path — it sends an action into the store so reducers and effects can react. `select(selector)` (or `selectSignal`) is the read path — it returns an observable/signal of a slice of state that emits when that slice changes. To avoid needless re-renders, select the smallest derived value with memoised `createSelector`s, keep references stable through immutable updates, and combine with OnPush/signals and `track` in `@for`.',
      details: [
        {
          type: 'code',
          lang: 'typescript',
          code: `export class CartBadge {
  private store = inject(Store);

  // READ: only the number — badge re-renders only when the count changes
  count = this.store.selectSignal(selectCartCount);
  // RxJS form: count$ = this.store.select(selectCartCount);

  // WRITE
  clear() { this.store.dispatch(CartActions.clear()); }
}`,
        },
        { type: 'heading3', text: 'Why selecting too much causes re-renders' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// ❌ Selecting the whole feature: any change in 'cart' (even unrelated fields) emits
cart = this.store.selectSignal(selectCartState);
// template: {{ cart().items.length }}

// ❌ Deriving in the component/pipe: new array every emission → downstream sees a "change"
items$ = this.store.select(selectCartState).pipe(map((s) => s.items.filter((i) => i.qty > 0)));

// ✅ Memoised selector: recomputes only when items change, returns same reference otherwise
export const selectActiveItems = createSelector(selectItems, (items) => items.filter((i) => i.qty > 0));
export const selectCartCount = createSelector(selectActiveItems, (items) => items.length);`,
        },
        { type: 'heading3', text: 'Checklist' },
        {
          type: 'bullets',
          items: [
            '**Select narrowly** — the exact primitive or object the view needs.',
            "**Derive in selectors, not components** — `createSelector` memoises on input references, so the output reference is stable when inputs don't change.",
            '**Immutable reducers** — only replace objects that actually changed (`map` returning the same item for unchanged ids) so memoisation works.',
            '**`store.select` already applies `distinctUntilChanged`**; `selectSignal` uses equality too — but both compare by reference, so new arrays mean a new emission.',
            '**OnPush / zoneless + signals** — components re-render only when their bound signals change.',
            '**`track item.id` in `@for`** — when the list does change, only changed rows re-render.',
            '**Avoid calling methods in templates** that recompute on every change detection.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Pitfall: a selector that does `state.items.map(...)` returns a new array whenever ANY of its inputs change — and if its input is the whole feature state, that is every action in the feature. Make inputs as narrow as the result needs.',
        },
      ],
    },

  'What are Selectors in NgRx? Explain memoization and why it matters for performance': {
    summary:
      "Selectors are pure functions that read and derive data from the store (`createSelector(inputSelectors..., projector)`). They are **memoised**: the selector remembers its last inputs and result, and if the input references haven't changed it returns the cached result without re-running the projector. That avoids recomputing expensive derivations and — because the same reference is returned — prevents downstream emissions and re-renders.",
    details: [
      {
        type: 'paragraph',
        text: 'Every dispatched action produces a new root state object, and every active selector is re-evaluated against it. Without memoisation a filter/sort over 10,000 rows would run on every action in the app, and each run would return a new array that makes components re-render. Memoisation turns that into a cheap reference check.',
      },
      { type: 'heading3', text: 'Composing selectors' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const selectProductsState = createFeatureSelector<ProductsState>('products');

// Simple "input" selectors — cheap property access
export const selectAll = createSelector(selectProductsState, (s) => s.products);
export const selectQuery = createSelector(selectProductsState, (s) => s.query);

// Derived selector — the projector runs ONLY when products or query references change
export const selectFiltered = createSelector(selectAll, selectQuery, (products, query) => {
  console.log('filtering…');
  return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
});

// Composes further — recomputes only when selectFiltered returns a new reference
export const selectFilteredCount = createSelector(selectFiltered, (list) => list.length);`,
      },
      { type: 'heading3', text: 'Memoisation in action' },
      {
        type: 'code',
        lang: 'typescript',
        code: `store.dispatch(setQuery({ query: 'pho' })); // "filtering…" (query changed)
store.dispatch(toggleSidebar());            // no log — products & query references unchanged
store.dispatch(setQuery({ query: 'pho' })); // reducer returns same string → no log

// Only the LAST arguments are cached (cache size 1):
// alternating between two different inputs recomputes every time.

// Testing: call the projector directly — no store needed
expect(selectFiltered.projector([{ name: 'Phone' }, { name: 'Laptop' }], 'ph')).toEqual([{ name: 'Phone' }]);`,
      },
      {
        type: 'flow',
        title: 'How a memoised selector decides',
        code: `flowchart TD
  S[New state after action]:::cache --> I[Run input selectors]
  I --> Q{"Inputs same references<br/>as last time?"}
  Q -->|Yes| C[Return cached result]:::highlight
  Q -->|No| P[Run projector]:::server
  P --> N[Cache and return new result]
  C --> D[No emission downstream]:::client
  N --> E[Component re-renders]:::client`,
      },
      {
        type: 'bullets',
        items: [
          'Memoisation compares **references** (`===`), which is why reducers must be immutable and return the same object for unchanged branches.',
          'Parameterised selectors: use a factory `selectById = (id: string) => createSelector(selectEntities, (e) => e[id])` and create it once per component, not per change-detection cycle. Selectors with `props` are deprecated.',
          '`selector.release()` clears the memoised value; `resetMemoizeFn` / `createSelectorFactory` allow custom memoisation.',
          "Selectors also give encapsulation: components don't know the state shape, so refactoring state only touches selectors.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: state the cache size explicitly — "only the last arguments are memoised" — and explain why returning the same reference matters for OnPush/signals, not just for CPU time.',
      },
    ],
  },

  'What is createFeatureSelector and when do you use it?': {
    summary:
      "`createFeatureSelector<FeatureState>('featureKey')` creates a typed selector that returns the top-level slice of state registered under that key (e.g. via `provideState('orders', reducer)`). You use it as the base input for the `createSelector`s of that feature. With `createFeature`, it's generated for you as `selectOrdersState`, so you rarely write it by hand anymore.",
    details: [
      {
        type: 'paragraph',
        text: "The root state is an object whose keys are feature names. `createFeatureSelector` is essentially `(state) => state[featureKey]` with proper typing and memoisation, and it lets feature code stay ignorant of the shape of the rest of the app's state.",
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Root state at runtime:
// { auth: {...}, orders: { list: [...], selectedId: '42', loading: false } }

export interface OrdersState { list: Order[]; selectedId: string | null; loading: boolean }

// Manual style
export const selectOrdersState = createFeatureSelector<OrdersState>('orders');
export const selectOrderList = createSelector(selectOrdersState, (s) => s.list);
export const selectSelectedId = createSelector(selectOrdersState, (s) => s.selectedId);
export const selectSelectedOrder = createSelector(selectOrderList, selectSelectedId,
  (list, id) => list.find((o) => o.id === id) ?? null);

// Registration must use the same key
provideState('orders', ordersReducer);`,
      },
      { type: 'heading3', text: 'Modern alternative: createFeature' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const ordersFeature = createFeature({
  name: 'orders',
  reducer: ordersReducer,
  // optional: add derived selectors that can use the generated ones
  extraSelectors: ({ selectList, selectSelectedId }) => ({
    selectSelectedOrder: createSelector(selectList, selectSelectedId,
      (list, id) => list.find((o) => o.id === id) ?? null),
  }),
});

// Generated automatically:
// ordersFeature.selectOrdersState  ← the feature selector
// ordersFeature.selectList, .selectSelectedId, .selectLoading
// plus your ordersFeature.selectSelectedOrder
provideState(ordersFeature); // key comes from 'name' — no string duplication`,
      },
      {
        type: 'bullets',
        items: [
          'Use it when you write selectors manually for a lazily registered feature slice.',
          "Don't use it for nested properties — it is only for top-level keys; use `createSelector` for anything deeper.",
          'The string key must match the registration key exactly; `createFeature` removes that duplication.',
          '`createSelector(selectFeature, …)` from a feature selector keeps memoisation working per feature.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention that `createFeature` generates the feature selector and one selector per state property — it shows you know current NgRx, not just the older pattern.',
      },
    ],
  },

  'How do Effects work in NgRx? Explain ofType, switchMap, and error handling inside effects': {
    summary:
      'An effect is an observable that subscribes to the `Actions` stream (after reducers run). `ofType(...)` filters it to the actions you care about; a flattening operator like `switchMap` maps each action to an inner observable (e.g. an HTTP call) and cancels the previous inner one when a new action arrives; the result is mapped to success/failure actions that are dispatched back to the store. Errors must be caught **inside** the inner observable, otherwise the effect stream dies.',
    details: [
      {
        type: 'paragraph',
        text: 'NgRx subscribes to every registered effect when it is provided. If an error propagates to the outer stream, the effect completes — NgRx does resubscribe once by default (`useEffectsErrorHandler`), but relying on that is poor practice. The idiomatic pattern is: `catchError` on the inner observable, returning a failure action.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const loadUser = createEffect(
  (actions$ = inject(Actions), api = inject(UserApi)) =>
    actions$.pipe(
      ofType(UserActions.load),                      // 1. filter by action type (typed payload)
      switchMap(({ id }) =>                          // 2. one request at a time; cancel stale
        api.getUser(id).pipe(
          map((user) => UserActions.loadSuccess({ user })),            // 3. success action
          catchError((err: HttpErrorResponse) =>                       // 4. INNER catchError
            of(UserActions.loadFailure({ error: err.message })),
          ),
        ),
      ),
    ),
  { functional: true },
);`,
      },
      { type: 'heading3', text: 'The classic bug: catchError in the wrong place' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ catchError on the OUTER stream: first error → stream completes → effect stops
actions$.pipe(
  ofType(UserActions.load),
  switchMap(({ id }) => api.getUser(id)),
  map((user) => UserActions.loadSuccess({ user })),
  catchError((e) => of(UserActions.loadFailure({ error: e.message }))), // emits once, then done
);

// ✅ Where you don't return actions (Signal Store rxMethod, ComponentStore),
// tapResponse from @ngrx/operators handles next/error on the inner stream and keeps it alive
switchMap((id: string) => api.getUser(id).pipe(
  tapResponse({
    next: (user) => patchState(store, { user }),
    error: (e: HttpErrorResponse) => patchState(store, { error: e.message }),
  }),
))`,
      },
      { type: 'heading3', text: 'Choosing the flattening operator' },
      {
        type: 'bullets',
        items: [
          '**switchMap** — cancel previous: search/type-ahead, load details for the latest selection. Avoid for writes (a cancelled request may still have hit the server).',
          '**concatMap** — queue in order: saves/updates where order matters.',
          '**mergeMap** — run in parallel: independent deletes, per-item uploads.',
          '**exhaustMap** — ignore new while busy: login, submit, refresh buttons.',
          '`{ dispatch: false }` for effects that only navigate, log or write to storage.',
          'Retry transient errors inside the inner observable: `api.get().pipe(retry({ count: 2, delay: 500 }), map(...), catchError(...))`.',
        ],
      },
      {
        type: 'flow',
        title: 'Inside an effect',
        code: `flowchart LR
  A[actions$]:::highlight --> O[ofType]
  O --> SM[switchMap]
  SM --> H[HTTP call]:::external
  H -->|ok| S[success action]:::server
  H -->|error| CE["inner catchError<br/>failure action"]:::security
  S --> ST[(Store)]:::cache
  CE --> ST`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: putting `catchError` after `switchMap` instead of inside it. The first failed request kills the effect, and later dispatches silently do nothing.',
      },
    ],
  },

  'Explain concatLatestFrom (formerly withLatestFrom in effects) and its use case': {
    summary:
      "`concatLatestFrom(() => store.select(selector))` lets an effect read the latest value of one or more selectors when an action arrives, emitting `[action, value]`. Unlike `withLatestFrom`, it subscribes **lazily** — only after the action passes `ofType` — so the selector isn't evaluated for every action and it sees state that already includes the reducer changes. It now lives in `@ngrx/operators` (it was previously exported from `@ngrx/effects`).",
    details: [
      {
        type: 'paragraph',
        text: 'Effects often need state as well as the action payload: "load the next page" needs the current page number, "save" needs the current draft. `withLatestFrom(store.select(...))` works, but it subscribes to the selector eagerly when the effect is created and keeps evaluating it for the lifetime of the app. `concatLatestFrom` takes a factory function, so the selection happens per action and only when needed.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { concatLatestFrom } from '@ngrx/operators';

export const loadNextPage = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(TxApi)) =>
    actions$.pipe(
      ofType(TxActions.nextPage),
      // Factory receives the action → can build a selector from its payload
      concatLatestFrom((action) => [
        store.select(selectCurrentPage),
        store.select(selectAccountFilter(action.accountId)),
      ]),
      switchMap(([action, page, filter]) =>
        api.list({ accountId: action.accountId, page: page + 1, ...filter }).pipe(
          map((res) => TxActions.pageLoaded({ res })),
          catchError((e) => of(TxActions.pageFailed({ error: e.message }))),
        ),
      ),
    ),
  { functional: true },
);`,
      },
      { type: 'heading3', text: 'Cache check: skip the API when data exists' },
      {
        type: 'code',
        lang: 'typescript',
        code: `actions$.pipe(
  ofType(ProductActions.open),
  concatLatestFrom(() => store.select(selectProductEntities)),
  filter(([{ id }, entities]) => !entities[id]),   // already loaded → do nothing
  mergeMap(([{ id }]) => api.get(id).pipe(map((p) => ProductActions.loaded({ p })))),
)`,
      },
      {
        type: 'bullets',
        items: [
          "**withLatestFrom**: eager subscription, selector argument fixed at effect creation, can't use action data to pick a selector.",
          '**concatLatestFrom**: lazy (per action), factory can use the action, returns a single observable or an array of observables.',
          'It reads the latest value once (`take(1)` semantics) — it does not keep listening.',
          "In effects it's better than `store.select(...).pipe(take(1))` nested in `switchMap` because it keeps the pipe flat and readable.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the key word is **lazy** — explain that `withLatestFrom` evaluates the selector from app start, while `concatLatestFrom` only does so after `ofType` lets the action through.',
      },
    ],
  },

  'What is NgRx Entity and what problem does it solve?': {
    summary:
      '`@ngrx/entity` manages collections in a normalised shape — `{ ids: string[], entities: Record<id, T> }` — and gives you an `EntityAdapter` with ready-made, immutable CRUD reducers helpers (`addOne`, `upsertMany`, `updateOne`, `removeOne`, `setAll`…) and selectors (`selectAll`, `selectEntities`, `selectIds`, `selectTotal`). It removes repetitive array-manipulation code and gives O(1) lookups by id.',
    details: [
      {
        type: 'paragraph',
        text: 'Storing collections as plain arrays means every update is `map` + `find` (O(n)), lookups by id are linear, and the same boilerplate is copy-pasted for every entity type. Normalising into a dictionary plus an ordered id list solves that, and the adapter writes the immutable update code for you.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

export interface Account { id: string; name: string; balance: number }

// State = { ids, entities } + your extra fields
export interface AccountsState extends EntityState<Account> {
  selectedId: string | null;
  loading: boolean;
}

export const adapter: EntityAdapter<Account> = createEntityAdapter<Account>({
  selectId: (a) => a.id,                              // default is 'id'
  sortComparer: (a, b) => a.name.localeCompare(b.name), // keeps ids sorted (optional)
});

const initialState: AccountsState = adapter.getInitialState({ selectedId: null, loading: false });

export const accountsFeature = createFeature({
  name: 'accounts',
  reducer: createReducer(
    initialState,
    on(AccountsActions.loadSuccess, (s, { accounts }) => adapter.setAll(accounts, { ...s, loading: false })),
    on(AccountsActions.added, (s, { account }) => adapter.addOne(account, s)),
    on(AccountsActions.renamed, (s, { id, name }) => adapter.updateOne({ id, changes: { name } }, s)),
    on(AccountsActions.closed, (s, { id }) => adapter.removeOne(id, s)),
    on(AccountsActions.synced, (s, { accounts }) => adapter.upsertMany(accounts, s)),
  ),
  extraSelectors: ({ selectAccountsState, selectEntities, selectSelectedId }) => ({
    ...adapter.getSelectors(selectAccountsState),          // selectAll, selectTotal, ...
    selectSelected: createSelector(selectEntities, selectSelectedId, (e, id) => (id ? e[id] : null)),
  }),
});`,
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "ids": ["a2", "a1"],
  "entities": {
    "a1": { "id": "a1", "name": "Savings", "balance": 5000 },
    "a2": { "id": "a2", "name": "Current", "balance": 1200 }
  },
  "selectedId": "a1",
  "loading": false
}`,
      },
      {
        type: 'bullets',
        items: [
          'Problems solved: boilerplate CRUD reducers, O(n) lookups, accidental mutation, duplicate items, inconsistent sorting.',
          'Adapter methods: `addOne/Many`, `setOne/Many/All`, `updateOne/Many`, `upsertOne/Many`, `removeOne/Many`, `removeAll`, `mapOne`, `map`.',
          'Normalisation also helps related data: store transactions by id and keep `accountId` references instead of nesting.',
          'Signal Store equivalent: `withEntities()` from `@ngrx/signals/entities` with `addEntity`, `updateEntity`, `removeEntity` updaters.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention `updateOne` takes `{ id, changes }` (a partial), while `upsertOne` takes the full entity — a detail that shows hands-on use.',
      },
    ],
  },

  'What is the NgRx Signal Store (introduced in NgRx 17)? How does it differ from the traditional store?':
    {
      summary:
        '`@ngrx/signals` `signalStore()` is a lightweight, signal-based state container built from composable features — `withState`, `withComputed`, `withMethods`, `withHooks`, `withEntities` — and updated with `patchState`. It was introduced in NgRx 17 (stable since v18). Unlike the global Redux store, it has no actions/reducers/effects boilerplate, is usually scoped to a feature or component via DI, and exposes state directly as signals.',
      details: [
        {
          type: 'paragraph',
          text: "The classic store is one global, event-driven state tree with strict separation of actions, reducers, effects and selectors. Signal Store is closer to a well-structured service: state, derived state and methods live together, and RxJS is optional (via `rxMethod`). It fits Angular's move to signals and zoneless change detection.",
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

type TodosState = { todos: Todo[]; filter: 'all' | 'done' | 'open'; loading: boolean };

export const TodosStore = signalStore(
  // { providedIn: 'root' },   // omit to provide per component/route
  withState<TodosState>({ todos: [], filter: 'all', loading: false }),
  withComputed(({ todos, filter }) => ({
    visible: computed(() =>
      filter() === 'all' ? todos() : todos().filter((t) => (filter() === 'done') === t.done)),
    remaining: computed(() => todos().filter((t) => !t.done).length),
  })),
  withMethods((store, api = inject(TodosApi)) => ({
    setFilter(filter: TodosState['filter']) { patchState(store, { filter }); },
    toggle(id: string) {
      patchState(store, (s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
    },
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => api.list().pipe(
          tapResponse({
            next: (todos) => patchState(store, { todos, loading: false }),
            error: () => patchState(store, { loading: false }),
          }),
        )),
      ),
    ),
  })),
  withHooks({ onInit: (store) => store.load() }),
);

@Component({ providers: [TodosStore], template: '{{ store.remaining() }} left' })
export class TodosPage { store = inject(TodosStore); }`,
        },
        { type: 'heading3', text: 'Key differences' },
        {
          type: 'bullets',
          items: [
            '**Reactivity model** — Signal Store: signals (sync, fine-grained). Classic: RxJS observables (`select`, plus `selectSignal`).',
            '**Boilerplate** — Signal Store: state + methods in one place. Classic: actions, reducers, effects, selectors in separate files.',
            '**Scope** — Signal Store: often local/feature-scoped (`providers: [Store]`), can be root. Classic: one global store with feature slices.',
            '**Updates** — `patchState` from methods vs dispatching actions handled by reducers.',
            '**Side effects** — `rxMethod` or plain async methods vs Effects on the action stream.',
            '**Indirection & tooling** — classic store has event-driven decoupling, time-travel and Redux DevTools by default; Signal Store devtools need a community add-on (e.g. ngrx-toolkit). Recent NgRx versions also add an Events plugin (`@ngrx/signals/events`, initially experimental) for event-driven Signal Stores.',
            '**Extensibility** — `signalStoreFeature()` lets you build reusable features (e.g. `withRequestStatus()`, `withEntities()`).',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: don\'t present it as a replacement — say "Signal Store for feature/local state with less ceremony; classic Store when you need global event-driven state, cross-feature reactions and time-travel debugging." Many apps use both.',
        },
      ],
    },

  'Design the NgRx state shape for a banking dashboard that shows account list, selected account details, and transaction history with pagination':
    {
      summary:
        'Normalise: an `accounts` entity slice (`ids` + `entities`) with `selectedAccountId` and load status; a `transactions` entity slice keyed by transaction id plus a **pagination index per account** (`pagesByAccount[accountId] = { pageIds, page, pageSize, total, status }`). Selected account details and the current page of transactions are derived by selectors, not stored twice. Put the selected account id and page in the URL so the view is refresh-safe.',
      details: [
        {
          type: 'paragraph',
          text: "Design principles: store each entity once (normalised), keep UI/derived data out of state, track loading/error per request, and model pagination as a cache of page → ids so going back to page 1 is instant and switching accounts doesn't wipe other accounts' pages.",
        },
        { type: 'heading3', text: 'State interfaces' },
        {
          type: 'code',
          lang: 'typescript',
          code: `type RequestStatus = 'idle' | 'loading' | 'loaded' | { error: string };

// ---- accounts feature ----
export interface Account { id: string; name: string; type: 'SAVINGS' | 'CURRENT' | 'CARD'; balance: number; currency: string }
export interface AccountDetails { id: string; ifsc: string; openedOn: string; limits: { daily: number } }

export interface AccountsState extends EntityState<Account> {
  selectedAccountId: string | null;
  listStatus: RequestStatus;
  details: Record<string, AccountDetails>;        // loaded lazily per account
  detailsStatus: Record<string, RequestStatus>;
}

// ---- transactions feature ----
export interface Transaction { id: string; accountId: string; date: string; amount: number; description: string }

export interface PageState {
  pageIds: Record<number, string[]>;  // page number → transaction ids (cache)
  currentPage: number;
  pageSize: number;
  total: number;
  status: RequestStatus;
}

export interface TransactionsState extends EntityState<Transaction> {
  byAccount: Record<string, PageState>;   // pagination per account
  filters: { from?: string; to?: string; type?: 'CREDIT' | 'DEBIT' };
}`,
        },
        { type: 'heading3', text: 'Example state at runtime' },
        {
          type: 'code',
          lang: 'json',
          code: `{
  "accounts": {
    "ids": ["ac1", "ac2"],
    "entities": { "ac1": { "id": "ac1", "name": "Salary", "balance": 82000 }, "ac2": { "id": "ac2", "name": "Card", "balance": -4500 } },
    "selectedAccountId": "ac1",
    "listStatus": "loaded",
    "details": { "ac1": { "id": "ac1", "ifsc": "HDFC0001", "openedOn": "2019-04-01" } },
    "detailsStatus": { "ac1": "loaded" }
  },
  "transactions": {
    "ids": ["t1", "t2", "t3"],
    "entities": { "t1": { "id": "t1", "accountId": "ac1", "amount": -500 } },
    "byAccount": {
      "ac1": { "pageIds": { "1": ["t1", "t2", "t3"] }, "currentPage": 1, "pageSize": 20, "total": 134, "status": "loaded" }
    },
    "filters": {}
  }
}`,
        },
        { type: 'heading3', text: 'Selectors derive the view' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const selectSelectedAccount = createSelector(
  selectAccountEntities, selectSelectedAccountId,
  (entities, id) => (id ? entities[id] ?? null : null),
);

export const selectSelectedPageState = createSelector(
  selectByAccount, selectSelectedAccountId,
  (byAccount, id) => (id ? byAccount[id] : undefined),
);

export const selectCurrentTransactions = createSelector(
  selectTransactionEntities, selectSelectedPageState,
  (entities, page) => (page?.pageIds[page.currentPage] ?? []).map((id) => entities[id]!),
);

export const selectPagination = createSelector(selectSelectedPageState, (p) =>
  p ? { page: p.currentPage, totalPages: Math.ceil(p.total / p.pageSize) } : null);`,
        },
        {
          type: 'flow',
          title: 'Selecting an account',
          code: `sequenceDiagram
  participant U as Dashboard
  participant S as Store
  participant E as Effects
  participant API as Bank API
  U->>S: accountSelected(ac1)
  S->>S: selectedAccountId = ac1
  E->>S: page 1 cached for ac1?
  alt not cached
    E->>API: GET /accounts/ac1/transactions?page=1
    API-->>E: items + total
    E->>S: transactionsPageLoaded
  end
  S-->>U: selectors emit details + page`,
        },
        {
          type: 'bullets',
          items: [
            "Don't store `selectedAccount` as an object — store the id and derive it, so balance updates show everywhere.",
            'Pagination cached per account and page; invalidate (`byAccount[id] = undefined`) when a new transaction arrives or filters change.',
            'Keep `selectedAccountId` and page in route/query params and sync via `@ngrx/router-store` or a route-driven action.',
            'Sensitive data: avoid persisting this state to localStorage; clear the store on logout with a meta-reducer.',
            'For infinite scroll instead of numbered pages, store a single ordered `ids` list plus a `cursor`.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: say the words **normalised**, **derived via selectors** and **per-request status**. Then explain how page caching and invalidation work — that is where design questions are usually won.',
        },
      ],
    },

  'An Effect makes an HTTP call, but you want to cancel the previous request if a new action arrives. Which operator do you use inside the effect and why?':
    {
      summary:
        "`switchMap`. When a new action arrives it unsubscribes from the previous inner observable — and for `HttpClient` unsubscribing aborts the in-flight XHR/fetch — then switches to the new request. So only the latest request's result is dispatched, avoiding stale or out-of-order responses (e.g. type-ahead search).",
      details: [
        {
          type: 'paragraph',
          text: 'Without cancellation, responses can arrive out of order: the user types "ph", then "phone"; if the "ph" request is slower it overwrites the "phone" results. `switchMap` guarantees that only the most recent action\'s response reaches the reducer.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const search = createEffect(
  (actions$ = inject(Actions), api = inject(ProductApi)) =>
    actions$.pipe(
      ofType(SearchActions.termChanged),
      debounceTime(300),                       // wait for typing to pause
      distinctUntilChanged((a, b) => a.term === b.term),
      switchMap(({ term }) =>                  // cancel the previous HTTP request
        api.search(term).pipe(
          map((results) => SearchActions.searchSuccess({ results })),
          catchError((e) => of(SearchActions.searchFailure({ error: e.message }))),
        ),
      ),
    ),
  { functional: true },
);

// Timeline:
// termChanged('ph')     → GET ?q=ph   (in flight)
// termChanged('phone')  → GET ?q=ph   CANCELLED (shown as "canceled" in Network tab)
//                        → GET ?q=phone
// only searchSuccess(phone results) is dispatched`,
        },
        { type: 'heading3', text: 'Comparing flattening operators' },
        {
          type: 'bullets',
          items: [
            '**switchMap** — cancel previous, keep latest. Reads: search, filters, load selected item.',
            '**concatMap** — queue, preserve order. Writes where order matters (sequential saves).',
            '**mergeMap** — run all in parallel. Independent operations (delete several items).',
            '**exhaustMap** — ignore new until current completes. Login, submit, "refresh" button.',
            'Cancelling per key (e.g. one request per row id): `groupBy(a => a.id)` then `mergeMap(group => group.pipe(switchMap(...)))`.',
          ],
        },
        {
          type: 'flow',
          title: 'switchMap vs out-of-order responses',
          code: `sequenceDiagram
  participant E as Effect
  participant API as Server
  E->>API: search ph
  E->>API: search phone
  Note over E: switchMap unsubscribes from ph request
  API--xE: ph response ignored and aborted
  API-->>E: phone response
  E->>E: dispatch searchSuccess for phone`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: "Pitfall: using `switchMap` for writes (POST/PUT/DELETE). Cancelling the client side doesn't guarantee the server didn't process it, so the UI can miss a change that actually happened. Use `concatMap`/`mergeMap`/`exhaustMap` for mutations.",
        },
      ],
    },

  'Your selector is being called too frequently causing performance issues. How do you diagnose and fix this?':
    {
      summary:
        "Diagnose with the Angular DevTools profiler and Redux DevTools (which actions fire, how often), plus a temporary log/counter in the projector to see whether it's the selector or the component re-running. Typical fixes: compose selectors from narrow inputs so memoisation hits, keep reducers immutable but reference-stable, create parameterised selectors once instead of per change detection, avoid calling selector factories or methods from templates, and reduce action noise (debounce high-frequency actions).",
      details: [
        {
          type: 'paragraph',
          text: 'Note that selectors are *evaluated* on every state change by design — a cheap reference check. The problem is when the **projector** re-runs (memoisation miss) or the **output reference** changes and triggers re-renders. Diagnosis is about finding which of these is happening and why.',
        },
        { type: 'heading3', text: 'Diagnose' },
        {
          type: 'numbered',
          items: [
            'Redux DevTools: look at action frequency — e.g. a `mouseMoved` or websocket `tick` action dispatched 50×/s.',
            'Add a counter/log inside the projector to confirm it is recomputing, and log its inputs to see which one has a new reference.',
            'Angular DevTools profiler: find components that re-render on every cycle and the bindings that changed.',
            'Look for selector factories called in templates or getters: `store.select(selectById(id))` inside a method runs every change detection and creates a new selector (with an empty cache) each time.',
            'Check reducers that return new objects for no reason (`{ ...state }` on unrelated actions, `map` that recreates every item).',
          ],
        },
        { type: 'heading3', text: 'Common causes and fixes' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// ❌ 1. Input is too broad: any change in 'orders' recomputes the expensive filter
const selectOpen = createSelector(selectOrdersState, (s) => s.list.filter(isOpen).sort(byDate));
// ✅ depend only on what you use
const selectOpen = createSelector(selectOrderList, (list) => list.filter(isOpen).sort(byDate));

// ❌ 2. Reducer recreates every item → list reference always new
on(tick, (s) => ({ ...s, list: s.list.map((o) => ({ ...o })) }))
// ✅ only replace what changed; return the same state if nothing changed
on(priceUpdated, (s, { id, price }) => ({
  ...s,
  list: s.list.map((o) => (o.id === id ? { ...o, price } : o)),
}))

// ❌ 3. New selector instance every change detection
getRow(id: string) { return this.store.selectSignal(selectOrderById(id)); } // in template!
// ✅ create once per component
id = input.required<string>();
row = computed(() => this.entities()[this.id()]); // entities = store.selectSignal(selectEntities)

// ❌ 4. Inputs change often, but the RESULT is usually equal (e.g. a summary object)
//    → projector returns a new object each time → consumers re-render
// ✅ memoise on the result with createSelectorFactory + resultMemoize (from @ngrx/store)
const selectSummary = createSelectorFactory((projector) => resultMemoize(projector, isEqual))(
  selectOrderList,
  summarize, // returns the previous reference when isEqual(prev, next), e.g. lodash isEqual
);`,
        },
        {
          type: 'bullets',
          items: [
            'Throttle/debounce high-frequency sources before dispatching, or batch updates into one action.',
            'Move very hot, local state (drag position, hover) out of the global store into component signals.',
            'Use `@ngrx/entity` for O(1) lookups instead of `find` in projectors.',
            'OnPush/zoneless + signals and `track` in `@for` limit the render cost when data does change.',
            'For very heavy computations, precompute in the reducer (store an index) or move to a web worker.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: distinguish **evaluated** (cheap, every action) from **recomputed** (projector runs — should be rare). Showing you know where memoisation breaks — broad inputs, unstable references, per-call selector factories — is what this question tests.',
        },
      ],
    },

  'How would you implement optimistic updates using NgRx?': {
    summary:
      'Update the store immediately when the user acts (the reducer applies the change on the request action), then let an effect call the API. On success, optionally reconcile with the server response; on failure, dispatch a failure action carrying enough data (the previous value or a snapshot) for the reducer to roll back, and notify the user.',
    details: [
      {
        type: 'paragraph',
        text: 'Optimistic UI makes actions feel instant (likes, toggles, reordering, renames). The trade-off is that you must handle failure explicitly and be careful with concurrent edits to the same item.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const TodoActions = createActionGroup({
  source: 'Todos',
  events: {
    'Toggle': props<{ id: string; previous: boolean }>(),           // carries rollback info
    'Toggle Success': props<{ todo: Todo }>(),
    'Toggle Failure': props<{ id: string; previous: boolean; error: string }>(),
  },
});

// Reducer: apply immediately, roll back on failure
on(TodoActions.toggle, (s, { id, previous }) =>
  adapter.updateOne({ id, changes: { done: !previous } }, s)),
on(TodoActions.toggleSuccess, (s, { todo }) =>
  adapter.upsertOne(todo, s)),                                     // reconcile with server
on(TodoActions.toggleFailure, (s, { id, previous }) =>
  adapter.updateOne({ id, changes: { done: previous } }, s)),       // rollback

// Effect: talk to the server; concatMap keeps writes in order
export const toggleTodo = createEffect(
  (actions$ = inject(Actions), api = inject(TodoApi)) =>
    actions$.pipe(
      ofType(TodoActions.toggle),
      concatMap(({ id, previous }) =>
        api.update(id, { done: !previous }).pipe(
          map((todo) => TodoActions.toggleSuccess({ todo })),
          catchError((e) => of(TodoActions.toggleFailure({ id, previous, error: e.message }))),
        ),
      ),
    ),
  { functional: true },
);

// Notify on failure
export const toggleFailedToast = createEffect(
  (actions$ = inject(Actions), toast = inject(ToastService)) =>
    actions$.pipe(ofType(TodoActions.toggleFailure), tap(() => toast.error('Could not save, change reverted'))),
  { functional: true, dispatch: false },
);

// Component
toggle(todo: Todo) { this.store.dispatch(TodoActions.toggle({ id: todo.id, previous: todo.done })); }`,
      },
      {
        type: 'flow',
        title: 'Optimistic update with rollback',
        code: `sequenceDiagram
  participant C as Component
  participant R as Reducer
  participant E as Effect
  participant API as Server
  C->>R: toggle(id, previous false)
  R-->>C: UI shows done immediately
  R->>E: action stream
  E->>API: PATCH /todos/id
  alt success
    API-->>E: 200 todo
    E->>R: toggleSuccess(todo)
  else failure
    API-->>E: 500
    E->>R: toggleFailure(id, previous false)
    R-->>C: UI reverts and toast shown
  end`,
      },
      {
        type: 'bullets',
        items: [
          'Carry rollback data in the action (previous value) or keep a `pending` map `{ [id]: snapshot }` in state — never rely on "re-fetch everything".',
          'Creating items: use a temporary client id, then replace it with the server id on success.',
          'Deleting: hide immediately, or soft-delete (`deleting: true`) and remove on success — allows "Undo" toasts.',
          'Concurrency: `concatMap` serialises writes; for per-item ordering use `groupBy(id)` + `concatMap`. Consider version numbers/ETags to detect conflicts.',
          'Only be optimistic where failure is rare and reversible — not for payments or irreversible operations.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: rolling back to a stale snapshot. If the user toggles twice quickly and the first request fails, restoring "the state before request 1" can overwrite request 2\'s change. Roll back per field/item, and serialise writes per item.',
      },
    ],
  },

  'How would you implement undo/redo functionality using NgRx?': {
    summary:
      'Wrap the feature reducer in a **meta-reducer** (higher-order reducer) that keeps `{ past: State[], present: State, future: State[] }`. Normal actions push `present` onto `past` and compute a new `present`; an `undo` action moves `present` to `future` and pops `past`; `redo` does the reverse; any new action clears `future`. Because NgRx state is immutable, snapshots are cheap (structural sharing).',
    details: [
      {
        type: 'paragraph',
        text: 'Undo/redo is a natural fit for Redux-style state: every state is an immutable snapshot, so history is just a list of references. The meta-reducer pattern keeps the history logic out of your feature reducer — the feature reducer stays unaware of undo.',
      },
      { type: 'heading3', text: 'Generic undoable meta-reducer' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const undo = createAction('[History] Undo');
export const redo = createAction('[History] Redo');
export const clearHistory = createAction('[History] Clear');

export interface History<T> { past: T[]; present: T; future: T[] }

export function undoable<T>(
  reducer: ActionReducer<T>,
  { limit = 50, filter = (_: Action) => true } = {},
): ActionReducer<History<T>> {
  const initialPresent = reducer(undefined, { type: '@@undoable/INIT' });
  const initial: History<T> = { past: [], present: initialPresent, future: [] };

  return (state = initial, action) => {
    const { past, present, future } = state;

    switch (action.type) {
      case undo.type:
        if (!past.length) return state;
        return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };
      case redo.type:
        if (!future.length) return state;
        return { past: [...past, present], present: future[0], future: future.slice(1) };
      case clearHistory.type:
        return { past: [], present, future: [] };
      default: {
        const next = reducer(present, action);
        if (next === present) return state;                 // action didn't change anything
        if (!filter(action)) return { ...state, present: next }; // e.g. loading flags: not undoable
        return { past: [...past, present].slice(-limit), present: next, future: [] };
      }
    }
  };
}`,
      },
      { type: 'heading3', text: 'Wiring it up' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Only editor actions are undoable
const undoableEditor = undoable(editorReducer, {
  limit: 100,
  filter: (a) => a.type.startsWith('[Editor]'),
});

provideState('editor', undoableEditor);

// Selectors
const selectHistory = createFeatureSelector<History<EditorState>>('editor');
export const selectEditor = createSelector(selectHistory, (h) => h.present);
export const selectCanUndo = createSelector(selectHistory, (h) => h.past.length > 0);
export const selectCanRedo = createSelector(selectHistory, (h) => h.future.length > 0);

// Component / keyboard shortcuts
@HostListener('document:keydown.control.z') onUndo() { this.store.dispatch(undo()); }
@HostListener('document:keydown.control.y') onRedo() { this.store.dispatch(redo()); }`,
      },
      {
        type: 'flow',
        title: 'History transitions',
        code: `stateDiagram-v2
  [*] --> Present
  Present --> Present: edit action, push to past, clear future
  Present --> Undone: undo, move present to future
  Undone --> Present: redo, move future head to present
  Undone --> Present: new edit, future cleared`,
      },
      {
        type: 'bullets',
        items: [
          'Scope it: wrap only the feature that needs undo (an editor, a canvas), not the whole store.',
          'Filter non-user actions (load success, loading flags) so undo doesn\'t "undo" a server fetch.',
          'Cap history (`limit`) to bound memory; structural sharing keeps snapshots cheap but not free.',
          'Group rapid edits (typing) into one history entry by debouncing or by merging consecutive actions of the same type.',
          'Server sync: undo changes local state — either re-save via an effect listening to `undo`/`redo`, or implement command-based undo (store inverse operations) when each step must hit the API.',
          'Store DevTools time-travel is for debugging only — not a user-facing undo.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name the pattern (meta-reducer / higher-order reducer with past-present-future), mention clearing `future` on a new action, and discuss filtering which actions are undoable — those details distinguish a real implementation from a buzzword answer.',
      },
    ],
  },
};
