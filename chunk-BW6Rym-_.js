var e={"How do you optimize an Angular application? Consider lazy loading, OnPush change detection, trackBy, and caching.":{summary:"**Lazy loading** splits features into chunks loaded on demand (`loadComponent`/`loadChildren`, `@defer`). **OnPush** makes Angular skip components whose inputs didn't change. **trackBy** (now `track` in `@for`) lets Angular reuse DOM rows instead of recreating them when a list updates. **Caching** avoids repeating identical HTTP calls — in a service, with `shareReplay`, or with an HTTP interceptor — plus browser/CDN caching of assets.",details:[{type:`paragraph`,text:`Each technique targets a different cost: lazy loading reduces JavaScript downloaded, OnPush reduces change-detection work, trackBy reduces DOM work, caching reduces network work. Together they cover most real-world issues.`},{type:`heading3`,text:`1. Lazy loading`},{type:`code`,lang:`typescript`,code:`export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent) },
  { path: 'admin', canMatch: [isAdmin], loadChildren: () => import('./admin/routes').then(m => m.ADMIN_ROUTES) },
];
// Legacy: loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
// canMatch prevents even downloading the chunk for non-admins.`},{type:`heading3`,text:`2. OnPush`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`{{ product().name }} \u2014 {{ product().price | currency }}\`,
})
export class ProductCardComponent {
  product = input.required<Product>();
}
// 500 cards on the page: a click elsewhere no longer re-checks all 500.
// Requirement: parent updates with new references (immutable), or signals.`},{type:`heading3`,text:`3. trackBy / track`},{type:`code`,lang:`html`,code:`<!-- Modern control flow: track is REQUIRED -->
@for (p of products(); track p.id) {
  <app-product-card [product]="p" />
}

<!-- Legacy -->
<app-product-card *ngFor="let p of products; trackBy: trackById" [product]="p" />
<!-- trackById(index: number, p: Product) { return p.id; } -->

<!-- Without tracking by id, refreshing the list from the API (new object references)
     destroys and recreates every card and its DOM. With it, only changed rows are touched. -->`},{type:`heading3`,text:`4. Caching`},{type:`code`,lang:`typescript`,code:`// a) Service-level cache with shareReplay \u2014 one request, shared by all subscribers
@Injectable({ providedIn: 'root' })
export class CountryService {
  private http = inject(HttpClient);
  readonly countries$ = this.http.get<Country[]>('/api/countries').pipe(shareReplay(1));
}

// b) Interceptor cache for GETs with a TTL
const cache = new Map<string, { at: number; res: HttpResponse<unknown> }>();
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  const hit = cache.get(req.urlWithParams);
  if (hit && Date.now() - hit.at < 60_000) return of(hit.res.clone());
  return next(req).pipe(
    tap(ev => { if (ev instanceof HttpResponse) cache.set(req.urlWithParams, { at: Date.now(), res: ev }); }),
  );
};

// c) SSR: provideClientHydration(withHttpTransferCacheOptions({...})) reuses server responses on the client
// d) Static assets: hashed filenames from ng build \u2192 long-lived Cache-Control on the CDN`},{type:`bullets`,items:[`Lazy loading → smaller initial bundle, faster LCP/TTI.`,`OnPush → fewer components checked per cycle, faster interactions.`,`track → fewer DOM creations, preserves focus/scroll/component state inside rows.`,`Caching → fewer network round-trips; remember invalidation (TTL, clear on mutation, per-user keys).`]},{type:`callout`,variant:`warning`,text:"Pitfalls: `track $index` on lists that get reordered/filtered gives little benefit; OnPush with mutated arrays shows stale UI; caching user-specific responses in a shared interceptor cache can leak data between users after logout — clear it on logout."},{type:`divider`},{type:`heading3`,text:`Follow-up: What are ways to optimize an Angular application?`},{type:`paragraph`,text:"Work on three fronts. **Load less**: lazy-loaded routes, `@defer` blocks, tree-shakable standalone code, optimized images (`NgOptimizedImage`), budgets. **Render less**: OnPush + signals (or zoneless), `track` in `@for`, pure pipes/computed instead of template method calls, virtual scrolling. **Fetch smarter**: caching, pagination, SSR/hydration for first paint. Always measure first (Lighthouse, Angular DevTools profiler)."},{type:`heading3`,text:`Initial load`},{type:`code`,lang:`typescript`,code:`// Lazy routes \u2014 code for /admin is downloaded only when visited
export const routes: Routes = [
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
];

// Preload lazy chunks in the background after the app is idle
provideRouter(routes, withPreloading(PreloadAllModules));`},{type:`code`,lang:`html`,code:`<!-- @defer: split a heavy component into its own chunk, load when visible -->
@defer (on viewport) {
  <app-comments [postId]="id()" />
} @placeholder {
  <div class="skeleton"></div>
}

<!-- NgOptimizedImage: lazy loading, srcset, priority hints, warnings for oversized images -->
<img ngSrc="/hero.jpg" width="1200" height="600" priority />`},{type:`heading3`,text:`Runtime rendering`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @for (o of visibleOrders(); track o.id) {     <!-- track: reuse DOM rows by id -->
      <app-order-row [order]="o" />
    }
    <p>Total: {{ total() }}</p>                      <!-- computed, not a method call -->
  \`,
})
export class OrdersComponent {
  orders = input.required<Order[]>();
  filter = signal('');
  visibleOrders = computed(() => this.orders().filter(o => o.ref.includes(this.filter())));
  total = computed(() => this.visibleOrders().reduce((s, o) => s + o.amount, 0));
}`},{type:`heading3`,text:`Checklist`},{type:`bullets`,items:["**Bundle**: production build, budgets in `angular.json`, analyze with `source-map-explorer`/esbuild metafile, remove heavy libraries (moment → date-fns/Intl), import only what you use.","**Change detection**: OnPush everywhere, signals, `runOutsideAngular` for noisy listeners, consider zoneless.","**Lists**: `track` by id, virtual scroll (`cdk-virtual-scroll-viewport`), pagination.","**Templates**: no expensive method calls; pure pipes or `computed`.","**Data**: HTTP caching (interceptor/`shareReplay`/service cache), avoid duplicate requests, debounce search, `switchMap` to cancel stale calls.","**Memory**: unsubscribe (`takeUntilDestroyed`, `async` pipe), remove listeners and timers.","**First paint**: SSR/SSG with hydration (incremental hydration with `@defer` triggers), critical CSS inlining, font/image optimization.",`**Tooling**: Lighthouse/Core Web Vitals, Chrome Performance panel, Angular DevTools profiler.`]},{type:`flow`,title:`Where to look first`,code:`flowchart TD
  M["Measure: Lighthouse,<br/>DevTools profiler"]:::highlight --> Q{Slow load or slow interaction?}
  Q -->|"Load / LCP"| L["Lazy routes, @defer,<br/>bundle analysis, images, SSR"]:::network
  Q -->|"Interaction / INP"| R["OnPush + signals, track,<br/>virtual scroll, fewer CD runs"]:::server
  Q -->|"Waiting on data"| D["Caching, pagination,<br/>parallel requests"]:::db`}]},"Handle bulk records using virtual scrolling and pagination, and limit API result per page":{summary:"Never load or render everything. On the API, paginate (`?page=2&size=50` or cursor-based `?after=<id>&limit=50`) with a server-enforced max page size. In the UI, either show pages (paginator, or infinite scroll that fetches the next page near the end) and/or render only visible rows with CDK virtual scrolling (`cdk-virtual-scroll-viewport` + `*cdkVirtualFor`), so 100k records cost the same DOM as ~20.",details:[{type:`paragraph`,text:`There are two separate limits: how much data travels over the network (solved by pagination) and how many DOM nodes exist (solved by virtual scrolling). Large tables usually need both — fetch in pages, render virtually.`},{type:`heading3`,text:`API: limit per page`},{type:`code`,lang:`typescript`,code:`// Node/Express example \u2014 offset pagination with a hard cap
app.get('/api/orders', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const size = Math.min(100, Number(req.query.size) || 50); // never trust the client for size
  const [items, total] = await Promise.all([
    db.order.findMany({ skip: (page - 1) * size, take: size, orderBy: { id: 'asc' } }),
    db.order.count(),
  ]);
  res.json({ items, page, size, total });
});

// Cursor pagination scales better for huge/changing tables:
// GET /api/orders?after=10450&limit=50  \u2192  WHERE id > 10450 ORDER BY id LIMIT 50`},{type:`heading3`,text:`Angular: paginated table`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @for (o of data().items; track o.id) { <app-order-row [order]="o" /> }
    <button [disabled]="page() === 1" (click)="page.set(page() - 1)">Prev</button>
    <span>Page {{ page() }} of {{ pages() }}</span>
    <button [disabled]="page() >= pages()" (click)="page.set(page() + 1)">Next</button>
  \`,
})
export class OrdersComponent {
  private api = inject(OrdersApi);
  page = signal(1);
  size = 50;
  data = toSignal(
    toObservable(this.page).pipe(switchMap(p => this.api.list(p, this.size))), // cancels stale pages
    { initialValue: { items: [], total: 0 } as Page<Order> },
  );
  pages = computed(() => Math.max(1, Math.ceil(this.data().total / this.size)));
}`},{type:`heading3`,text:`Angular: virtual scroll + infinite loading`},{type:`code`,lang:`typescript`,code:`import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-log-viewer',
  imports: [ScrollingModule],
  template: \`
    <cdk-virtual-scroll-viewport itemSize="40" class="viewport" (scrolledIndexChange)="onScroll($event)">
      <div *cdkVirtualFor="let row of rows(); trackBy: trackById" class="row">{{ row.message }}</div>
    </cdk-virtual-scroll-viewport>
  \`,
  styles: \`.viewport { height: 600px; } .row { height: 40px; }\`,
})
export class LogViewerComponent {
  private api = inject(LogsApi);
  rows = signal<LogRow[]>([]);
  private loading = false;
  private cursor: string | null = null;
  trackById = (_: number, r: LogRow) => r.id;

  constructor() { this.loadMore(); }

  onScroll(firstVisible: number) {
    // fetch next page when within 20 rows of the end
    if (!this.loading && firstVisible > this.rows().length - 20) this.loadMore();
  }

  private loadMore() {
    this.loading = true;
    this.api.list({ after: this.cursor, limit: 100 }).subscribe(res => {
      this.rows.update(r => [...r, ...res.items]);
      this.cursor = res.nextCursor;
      this.loading = false;
    });
  }
}
// Only ~15 visible rows (+ buffer) exist in the DOM, whether rows() has 100 or 100,000 items.`},{type:`flow`,title:`Infinite virtual scroll`,code:`sequenceDiagram
  participant U as User
  participant V as Virtual viewport
  participant C as Component
  participant A as API
  U->>V: scrolls
  V->>C: scrolledIndexChange(index)
  C->>C: near end and not loading?
  C->>A: GET /logs?after=cursor and limit=100
  A-->>C: 100 items + nextCursor
  C->>V: rows.update(append)
  V-->>U: renders only visible rows`},{type:`bullets`,items:[`Offset pagination: simple, supports "jump to page 40", but slow on huge tables and can skip/duplicate rows if data changes. Cursor (keyset): fast and stable, but no random page access.`,"Fixed `itemSize` is most efficient; variable heights need the experimental autosize strategy or a third-party solution.",`Do filtering, sorting and search on the server when data is large — the client only has one page.`,"Combine with OnPush, `trackBy`, and debounced filters; show skeleton rows while loading.","Accessibility: virtual lists drop off-screen rows from the DOM, so Ctrl+F and screen-reader counts are affected — provide search and `aria-rowcount` where relevant."]},{type:`callout`,variant:`tip`,text:`Interview tip: separate the problems clearly — "pagination limits data over the wire; virtual scrolling limits DOM nodes" — and mention the server-side cap on page size as a security/stability measure, not just a UI choice.`}]},"What is Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?":{summary:"With **CSR**, the server sends a nearly empty HTML shell plus JavaScript; the browser downloads and runs the app to build the page. With **SSR**, the server runs the Angular app per request and sends fully rendered HTML, so content appears fast and is crawlable; the browser then **hydrates** it (reuses the DOM and attaches event listeners). Angular supports SSR, prerendering (SSG) and per-route render modes via `@angular/ssr`.",details:[{type:`paragraph`,text:`The trade-off is where the first render happens. CSR puts it on the user's device — simple hosting, but a blank screen until JS loads and runs. SSR puts it on the server — faster first contentful paint and better SEO/social previews, but you need a Node server (or edge runtime) and your code must work without browser globals.`},{type:`flow`,title:`CSR vs SSR timeline`,code:`sequenceDiagram
  participant B as Browser
  participant S as Server
  Note over B,S: CSR
  B->>S: GET /products
  S-->>B: index.html with empty app-root
  B->>S: GET main.js
  B->>B: run app, fetch data, render
  Note over B,S: SSR
  B->>S: GET /products
  S->>S: render Angular app to HTML
  S-->>B: full HTML (content visible now)
  B->>S: GET main.js
  B->>B: hydrate: reuse DOM, attach listeners`},{type:`heading3`,text:`Enabling SSR in Angular`},{type:`code`,lang:`bash`,code:`# New project
ng new shop --ssr

# Existing project
ng add @angular/ssr`},{type:`code`,lang:`typescript`,code:`// app.config.ts \u2014 hydration (reuse server DOM instead of re-rendering)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()), // replays clicks made before hydration finished
  ],
};

// app.routes.server.ts \u2014 choose a render mode per route
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },        // SSG at build time
  { path: 'products/:id', renderMode: RenderMode.Server }, // SSR per request
  { path: 'account/**', renderMode: RenderMode.Client },   // CSR only
];`},{type:`heading3`,text:`Writing SSR-safe code`},{type:`code`,lang:`typescript`,code:`export class MapComponent {
  constructor() {
    // \u274C window/document/localStorage don't exist on the server
    // const w = window.innerWidth;

    // \u2705 Browser-only work after render
    afterNextRender(() => {
      const map = new MapLib(document.getElementById('map')!);
    });
  }
}
// Or: inject(PLATFORM_ID) + isPlatformBrowser(), inject(DOCUMENT) instead of global document.`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**First paint / LCP**: SSR faster; CSR waits for JS.`,`**SEO & link previews**: SSR/SSG deliver real HTML; CSR relies on crawlers executing JS.`,"**Time to interactive**: both need JS; SSR content is visible earlier but interactive only after hydration (incremental hydration with `@defer` triggers can hydrate parts lazily).",`**Infrastructure**: CSR = static hosting/CDN. SSR = Node/edge server, higher server cost. SSG = static files, but only for content known at build time.`,"**Complexity**: SSR requires platform-safe code, care with auth/cookies, and avoiding duplicate HTTP calls (HTTP transfer cache handles this for `HttpClient`).",`Good fits: SSR/SSG for public, content-heavy pages (e-commerce, blogs, marketing); CSR for authenticated dashboards and internal tools.`]},{type:`callout`,variant:`warning`,text:"Pitfall: hydration mismatch errors happen when the DOM is modified outside Angular (direct DOM manipulation, invalid HTML nesting like a `<div>` inside a `<p>`) — Angular then cannot match server and client DOM. Use `ngSkipHydration` only as a temporary escape hatch."}]},"How do you analyse and reduce an Angular bundle (build stats, lazy routes, `@defer`, tree-shaking pitfalls)?":{summary:"I start from the build output: `ng build` prints initial vs lazy chunks with estimated transfer sizes, and `ng build --stats-json` gives a metafile I load into the esbuild bundle analyzer to see which packages sit in the initial chunk and why. Then I move code out of the initial chunk (lazy routes with `loadComponent`/`loadChildren`, `@defer` for heavy below-the-fold UI), fix tree-shaking blockers (CommonJS deps, side-effectful barrels, whole-library imports) and lock the result in with `budgets` in `angular.json`.",details:[{type:`paragraph`,text:`The first-load measurement story (LCP, RUM, Lighthouse) is covered in the "slow on first load" debugging answer. This one goes deeper on the bundle itself: how to read it, what typically bloats it in Angular apps, and how to stop it regressing.`},{type:`heading3`,text:`1. Read the build output`},{type:`code`,lang:`bash`,code:`ng build --stats-json
# Initial chunk files | Names    | Raw size | Estimated transfer size
# main-XYZ.js         | main     | 612 kB   | 158 kB
# Lazy chunk files    | Names    | Raw size | Estimated transfer size
# chunk-ABC.js        | reports  | 240 kB   | 61 kB

# dist/<app>/browser/stats.json -> drop it into https://esbuild.github.io/analyze/
# Alternative: enable sourceMap in the production config, then
npx source-map-explorer dist/<app>/browser/main-*.js`},{type:`bullets`,items:["**Initial chunks** (`main`, `polyfills`, `styles` and shared chunks they import) block first render. That is where every kilobyte matters.","**Lazy chunks** load on navigation or a `@defer` trigger. Big lazy chunks are acceptable; big initial chunks are not.",'In the analyzer, use the "why is this file included" import chain to find the one eager import that dragged a library into `main`.']},{type:`heading3`,text:`2. Move code out of the initial chunk`},{type:`code`,lang:`typescript`,code:`export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent) },
  { path: 'admin', canMatch: [isAdmin], loadChildren: () => import('./admin/admin.routes') },
];
// loadChildren can import a default export directly (export default [...] as Routes).`},{type:`code`,lang:`html`,code:`<!-- The chart library is only referenced inside the defer block, so it gets its own chunk -->
@defer (on viewport; prefetch on idle) {
  <app-revenue-chart [data]="revenue()" />
} @placeholder {
  <div class="chart-skeleton" style="height: 320px"></div>
}`},{type:`callout`,variant:`warning`,text:"A deferred component is only split out if nothing else imports it eagerly. If the same component (or its library) is also used outside the `@defer` block, or exported through a barrel the root imports, it stays in the initial chunk and `@defer` only delays rendering."},{type:`heading3`,text:`3. Tree-shaking pitfalls`},{type:`bullets`,items:['**CommonJS dependencies** cannot be tree-shaken well. The CLI warns ("module ... is not ESM"); prefer an ESM alternative (`lodash-es` per-function imports over `lodash`). `allowedCommonJsDependencies` only silences the warning, it does not fix the size.',"**Barrel files with side effects**: an `index.ts` that re-exports everything is fine when modules are pure, but top-level code (registering things, global config) in any re-exported file keeps it in the bundle.","**Locale and data bloat**: `moment` pulls in every locale. Use native `Intl`/`date-fns` and import only the Angular locale data you register.","**Whole-library imports**: `import * as icons from ...` or registering a full icon set ships every icon. Import individual icons or use an SVG sprite.","**Providers**: services with `@Injectable({ providedIn: 'root' })` are tree-shakable (dropped if never injected); services listed in a `providers` array always ship.","**Replace heavy deps**: a rich text editor or chart library for one screen belongs behind a lazy route or `@defer`, or should be swapped for something smaller."]},{type:`heading3`,text:`4. Stop regressions with budgets`},{type:`code`,lang:`json`,code:`// angular.json -> projects.<app>.architect.build.configurations.production
"budgets": [
  { "type": "initial", "maximumWarning": "450kB", "maximumError": "600kB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" },
  { "type": "bundle", "name": "polyfills", "maximumError": "60kB" }
]`},{type:`callout`,variant:`tip`,text:'Interview tip: walk through one concrete find, for example "the analyzer showed `moment` with all locales in `main` because a shared date pipe was imported by the root; switching to `Intl.DateTimeFormat` cut 70 kB gzipped and a budget now fails CI if it creeps back."'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["Why does a component used inside `@defer` sometimes still end up in `main`?",`What is the difference between raw size and estimated transfer size, and which one do budgets check?`,`When would you use a preloading strategy instead of pure lazy loading?`]}]},"How do `@defer` and incremental hydration improve Core Web Vitals in an Angular app?":{summary:"Both reduce the JavaScript that must download, parse and execute before the page is usable. `@defer` splits non-critical UI into lazy chunks, so the main thread is free sooner (better LCP render delay, Total Blocking Time and INP). Incremental hydration (`hydrate on ...` triggers) goes further with SSR: the server renders the full HTML, but each block's code is only fetched and hydrated when its trigger fires. The rules are: never defer the LCP element, and give placeholders a reserved size so they do not cause CLS.",details:[{type:`paragraph`,text:"The `@defer` syntax and the hydration basics are covered in the Modern Angular topic. This answer maps them to the metrics: **LCP** (when the main content appears), **INP** (how fast the page responds to input) and **CLS** (how much the layout jumps)."},{type:`heading3`,text:`How each metric benefits`},{type:`bullets`,items:[`**LCP**: a smaller initial bundle means the app bootstraps and renders the hero sooner on CSR, and with SSR there is less JS competing for bandwidth with the LCP image.`,`**TBT / INP**: hydrating and running fewer components at startup means fewer long tasks, so early clicks are handled quickly instead of waiting behind bootstrap work.`,`**CLS**: only improves if placeholders reserve the final size. A 0-height placeholder that becomes a 400px widget is a layout shift you created.`]},{type:`heading3`,text:`Choosing triggers (CSR or SSR without hydration triggers)`},{type:`code`,lang:`html`,code:`<!-- Below the fold: load when visible, but fetch the chunk early while the browser is idle -->
@defer (on viewport; prefetch on idle) {
  <app-reviews [productId]="id()" />
} @placeholder {
  <div class="reviews-skeleton" style="min-height: 480px"></div>
}

<!-- Only needed on user intent: a chat or filter panel -->
@defer (on interaction) {
  <app-support-chat />
} @placeholder {
  <button type="button">Chat with us</button>
}

<!-- Non-critical but always shown: render after the main work is done -->
@defer (on idle) {
  <app-recently-viewed />
}`},{type:`bullets`,items:["`on viewport` for below-the-fold content; `on interaction` / `on hover` for UI behind user intent; `on idle` for low-priority content that should appear anyway.","`prefetch on idle` (or `prefetch on hover`) hides the network delay so the content appears instantly when the main trigger fires.","Use `@loading (after 100ms; minimum 500ms)` to avoid a flash of spinner for fast loads."]},{type:`heading3`,text:`Incremental hydration with SSR`},{type:`code`,lang:`typescript`,code:`// app.config.ts
providers: [
  provideClientHydration(withEventReplay()),
  // On older versions you also add withIncrementalHydration().
  // In current versions it is enabled by default with provideClientHydration().
]`},{type:`code`,lang:`html`,code:`<app-product-hero [product]="product()" />  <!-- LCP area: never deferred -->

@defer (hydrate on viewport) {
  <app-reviews [productId]="product().id" />
}
@defer (hydrate on interaction) {
  <app-size-picker [sizes]="product().sizes" />
}
@defer (hydrate never) {
  <app-seo-footer />
}`},{type:`paragraph`,text:"With `hydrate` triggers the server renders the real content (not the placeholder), so the user sees the full page and there is no layout shift. The block's code is only downloaded when it hydrates, and event replay re-dispatches a click on a dehydrated block after it hydrates, so no input is lost."},{type:`callout`,variant:`warning`,text:"Do not defer above-the-fold content or the LCP element. Deferring the hero turns it into a placeholder first and a lazy chunk second, which makes LCP worse and often adds CLS. Also avoid `on immediate` on everything; it just recreates the eager bundle with extra requests."},{type:`callout`,variant:`tip`,text:'Interview tip: tie each decision to a metric: "the reviews widget moved to `hydrate on viewport`, which removed 120 kB from initial JS and cut TBT; its skeleton has a fixed min-height so CLS stayed at 0." That shows you think in outcomes, not features.'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["What is the difference between `on viewport` and `hydrate on viewport`?",`How do you verify a deferred chunk is really split out and loaded late?`,`What happens if a user clicks a button inside a block that has not hydrated yet?`]}]},"How does `NgOptimizedImage` improve LCP and CLS?":{summary:'`NgOptimizedImage` (the `ngSrc` directive) enforces image best practices. For **CLS** it requires `width`/`height` (or `fill`), so the browser reserves space before the image loads. For **LCP** the `priority` attribute marks the hero image as high priority (`fetchpriority="high"`, eager loading, and a preload hint when rendered with SSR), while every other image is lazy-loaded by default. With an image loader it also generates a responsive `srcset`, so the browser downloads the right size, and in dev mode it warns about common mistakes.',details:[{type:`heading3`,text:`Basic usage`},{type:`code`,lang:`typescript`,code:`import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-page',
  imports: [NgOptimizedImage],
  template: \`
    <!-- LCP image: high priority, not lazy -->
    <img ngSrc="products/{{ product().slug }}/hero.jpg" width="1200" height="800"
         priority sizes="(max-width: 768px) 100vw, 50vw" alt="{{ product().name }}" />

    <!-- Every other image: lazy-loaded by default, space reserved by width/height -->
    @for (t of product().thumbnails; track t.id) {
      <img [ngSrc]="t.path" width="160" height="160" [alt]="t.alt" />
    }
  \`,
})
export class ProductPageComponent { product = input.required<Product>(); }`},{type:`heading3`,text:`What it does for each metric`},{type:`bullets`,items:["**CLS**: `width` and `height` are required (they describe the intrinsic aspect ratio, CSS can still resize the image). The browser reserves the box, so text below does not jump when the image arrives.","**`fill` mode**: for images whose size comes from the container (cards, banners). The image fills its parent, which must be positioned (`relative`, `absolute` or `fixed`) and sized. Use `object-fit: cover` to crop.",'**LCP**: `priority` sets `fetchpriority="high"` and `loading="eager"`, and during SSR Angular adds a `<link rel="preload">` for it, so the browser discovers the image from the HTML head instead of after the app boots.','**Lazy by default**: non-priority images get `loading="lazy"`, so they stop competing for bandwidth with the LCP image.',"**Right-sized downloads**: with `sizes` it generates a width-based `srcset`; without `sizes` it generates density descriptors (1x, 2x). A phone no longer downloads a 2400px desktop image."]},{type:`heading3`,text:`Image loaders (CDN)`},{type:`code`,lang:`typescript`,code:`// app.config.ts: ngSrc values become paths on the CDN, srcset URLs carry width params
import { provideImgixLoader } from '@angular/common';

providers: [provideImgixLoader('https://my-shop.imgix.net/')]
// Built-in: provideCloudinaryLoader, provideImageKitLoader, provideCloudflareLoader,
// provideNetlifyLoader, or a custom IMAGE_LOADER that maps { src, width } to a URL.`},{type:`paragraph`,text:"Without a loader the directive still adds priority, lazy loading and size checks, but it cannot generate a responsive `srcset` because it has no way to request other widths. Placeholders are supported too: the `placeholder` attribute shows a blurred low-resolution version (from the loader, or a small base64 data URL) while the full image loads."},{type:`heading3`,text:`Dev-mode warnings worth knowing`},{type:`bullets`,items:["The LCP element is an `ngSrc` image without `priority` (it observes the real LCP entry).","The rendered aspect ratio does not match `width`/`height`, so the image looks distorted.",`The downloaded image is much larger than its rendered size (oversized image).`,"Missing `preconnect` for the image origin, and `fill` images inside a parent with no height."]},{type:`callout`,variant:`warning`,text:"Common mistakes: putting `priority` on many images (if everything is high priority, nothing is; keep it to the one or two above-the-fold images), and lazy-loading the hero manually. Also note that CSS background images are not covered by the directive; use a real `<img>` for an LCP hero."},{type:`callout`,variant:`tip`,text:"Interview tip: say how you found the LCP element first (Performance panel or the dev-mode warning), then explain the three changes: `priority`, correct `sizes` with a CDN loader, and explicit dimensions. That shows a measured fix, not a checklist."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["Why do `width` and `height` still matter when CSS makes the image responsive?",`How would you write a custom image loader for your own CDN?`,"Does `NgOptimizedImage` convert images to WebP or AVIF itself? (No, the CDN/loader does.)"]}]},"How do you find and fix slow change detection with Angular DevTools and the Chrome Performance panel?":{summary:"I record the slow interaction in the Angular DevTools **Profiler**, which shows each change-detection cycle as a bar and which components took the time and what triggered it. Then I confirm in the Chrome **Performance** panel, where Angular adds its own track so long tasks can be traced to component templates. The usual culprits are function calls or impure pipes in templates, big `@for` lists with a bad `track`, and noisy zone triggers like `mousemove` or `setInterval`; the fixes are OnPush, signals with `computed()`, pure pipes, a stable `track`, and keeping noisy events outside Angular or going zoneless.",details:[{type:`paragraph`,text:`How change detection and OnPush work is explained in the Change Detection topic; this answer is the profiling workflow. Always profile a production-like build: dev mode runs an extra checking pass, so absolute timings are inflated.`},{type:`heading3`,text:`1. Angular DevTools profiler`},{type:`numbered`,items:[`Open the **Angular** tab in Chrome DevTools, go to **Profiler**, press record, perform the slow interaction (typing in a filter, scrolling, clicking a tab), stop.`,`The bar chart shows one bar per change-detection cycle. Tall bars are expensive cycles; many bars for one keystroke means too many triggers.`,`Select a bar to see the flame graph or tree map: each component with its time, and the source that triggered the cycle (an event listener, a timer, an HTTP response).`,`Look for components that appear in every cycle although nothing they show changed. These are OnPush candidates.`]},{type:`heading3`,text:`2. Chrome Performance panel`},{type:`bullets`,items:[`Record the same interaction with CPU throttling. Long tasks (over 50 ms, red corner) hurt INP.`,"In recent Angular versions, run `ng.enableProfiling()` in the console (dev mode) before recording: an Angular custom track then shows bootstrap, change detection and component template execution in the timeline, next to the normal JS flame chart.","In the bottom-up view, frequently called template functions and pipe `transform` methods show up as hot spots."]},{type:`heading3`,text:`3. Common culprits and fixes`},{type:`code`,lang:`typescript`,code:`// \u274C Runs on every CD cycle for every row
// <td>{{ formatTotal(order) }}</td>
// <li *ngFor="let o of orders | filterBy: query">   (impure pipe)

// \u2705 Derived state computed once per change
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @for (o of visibleOrders(); track o.id) {
      <tr><td>{{ o.total | currency }}</td></tr>
    }
  \`,
})
export class OrdersComponent {
  orders = input.required<Order[]>();
  query = signal('');
  visibleOrders = computed(() =>
    this.orders().filter((o) => o.customer.includes(this.query())),
  );
}`},{type:`bullets`,items:["**Template function calls / getters** doing real work: move them into `computed()` or a pure pipe, which re-run only when inputs change.","**Impure pipes** (`pure: false`) run every cycle; make them pure and pass new references.","**`@for` with `track $index` or a new object identity** on refresh: rows are destroyed and recreated; track a stable id.","**`ChangeDetectionStrategy.Default` everywhere**: one event re-checks the whole tree. Adopt OnPush (or signals) from leaf components upward.","**Noisy zone triggers**: `setInterval`, `scroll`, `mousemove`, `resize` and third-party libraries each trigger app-wide CD in a Zone.js app."]},{type:`code`,lang:`typescript`,code:`// Zone.js app: keep high-frequency events out of Angular, re-enter only when state changes
private zone = inject(NgZone);
constructor() {
  afterNextRender(() => {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', () => {
        const pastHeader = window.scrollY > 200;
        if (pastHeader !== this.sticky()) this.sticky.set(pastHeader); // signal update schedules CD
      }, { passive: true });
    });
  });
}

// Coalesce multiple events in one turn into a single CD (Zone.js apps)
provideZoneChangeDetection({ eventCoalescing: true });
// Or go zoneless (provideZonelessChangeDetection()): CD runs only on signal/markForCheck/input changes.`},{type:`callout`,variant:`warning`,text:'Do not "fix" slow CD with `ChangeDetectorRef.detach()` or `setTimeout` hacks: they hide bugs and leave stale views. And if the profiler shows a cheap CD but a slow frame, the cost is DOM/layout (too many rows), which needs virtual scrolling, not CD tuning.'},{type:`callout`,variant:`tip`,text:'Interview tip: describe the loop "record, find the hottest component, fix one cause, record again" with numbers, for example "typing in the search box went from 45 ms to 6 ms per keystroke after replacing a template method with `computed()` and making the row component OnPush".'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Why are timings in dev mode higher than in production?`,`How does zoneless change detection change what you see in the profiler?`,`When is a slow page a DOM problem rather than a change-detection problem?`]}]},"When should you move work to a web worker in an Angular app, and how?":{summary:"Move work to a web worker when it is CPU-heavy and long enough to block the main thread (parsing a large CSV/JSON, sorting or filtering tens of thousands of rows, image processing, crypto, diffing), because a long task freezes input and hurts INP. Do not use one for DOM work (workers have no DOM) or small tasks, where `postMessage` serialisation costs more than it saves. In Angular, `ng generate web-worker` sets up the build, you create it with `new Worker(new URL('./x.worker', import.meta.url), { type: 'module' })`, and wrap it in a service that exposes a signal or Observable.",details:[{type:`heading3`,text:`When it helps (and when it does not)`},{type:`bullets`,items:[`**Good fits**: parsing/validating a large file upload, client-side search index building, sorting and aggregating a big dataset, image resizing/compression, hashing or encryption, Markdown or syntax-highlight rendering to a string.`,`**Poor fits**: anything that touches the DOM or Angular components, work under roughly 16–50 ms, and work dominated by network I/O (fetch is already asynchronous).`,"**Hidden cost**: data passed with `postMessage` is copied with the structured clone algorithm. Copying 50 MB of objects each way can cost as much as the computation. Send compact data, or transfer `ArrayBuffer`s.","Check first with the Performance panel: if the long task is your code, a worker can help; if it is rendering or layout, fix the rendering instead (virtual scrolling, `@defer`)."]},{type:`heading3`,text:`Setup`},{type:`code`,lang:`bash`,code:`ng generate web-worker reports/csv-parser
# creates src/app/reports/csv-parser.worker.ts
# adds tsconfig.worker.json and "webWorkerTsConfig" to angular.json`},{type:`code`,lang:`typescript`,code:`// csv-parser.worker.ts
/// <reference lib="webworker" />
import { parseCsv } from './csv';   // plain TS, no Angular or DOM imports

addEventListener('message', ({ data }: MessageEvent<ArrayBuffer>) => {
  const text = new TextDecoder().decode(data);
  const rows = parseCsv(text);
  postMessage({ rows, count: rows.length });
});`},{type:`heading3`,text:`Wrap it in a service`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class CsvParserService {
  private worker?: Worker;
  readonly result = signal<ParsedCsv | null>(null);
  readonly busy = signal(false);

  constructor() {
    // SSR guard: Worker does not exist on the server
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./csv-parser.worker', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }) => {
        this.result.set(data);
        this.busy.set(false);
      };
    }
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
  }

  async parse(file: File) {
    const buffer = await file.arrayBuffer();
    if (!this.worker) {
      this.result.set(parseCsvSync(buffer)); // fallback: server or old browsers
      return;
    }
    this.busy.set(true);
    this.worker.postMessage(buffer, [buffer]); // transfer, not copy: buffer is now detached here
  }
}`},{type:`paragraph`,text:"The `new URL(..., import.meta.url)` form is what the CLI recognises to bundle the worker as its own file. Components just read `result()` and `busy()`. For request/response pairs (several calls in flight) add a message id, or return an Observable per call."},{type:`bullets`,items:["**Comlink** (`expose()` in the worker, `wrap()` in the service) turns the message protocol into async function calls, which is much cleaner when the worker has several methods.",`Keep a single long-lived worker (or a small pool) rather than creating one per call; startup has a cost.`,"Errors in the worker arrive via `onerror`/`onmessageerror`; surface them to the UI state instead of leaving `busy` stuck."]},{type:`callout`,variant:`warning`,text:"Workers are not free parallelism: they cannot touch the DOM, `localStorage` or Angular DI, and anything you send is cloned. A worker that receives the full dataset on every keystroke can make INP worse. Keep the data inside the worker and send only queries and small results."},{type:`callout`,variant:`tip`,text:`Interview tip: justify the worker with a measurement, for example "parsing a 40 MB export blocked the main thread for 1.8 s; in a worker the UI stayed responsive and we showed progress", and mention the SSR guard and transferables to show production experience.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["What is the difference between copying and transferring data with `postMessage`?",`How would you cancel a long-running worker job when the user changes the input?`,"When would you choose chunking work with `requestIdleCallback` or `scheduler.yield()` instead of a worker?"]}]}};export{e as answers};