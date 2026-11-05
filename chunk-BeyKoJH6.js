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
// Or: inject(PLATFORM_ID) + isPlatformBrowser(), inject(DOCUMENT) instead of global document.`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**First paint / LCP**: SSR faster; CSR waits for JS.`,`**SEO & link previews**: SSR/SSG deliver real HTML; CSR relies on crawlers executing JS.`,"**Time to interactive**: both need JS; SSR content is visible earlier but interactive only after hydration (incremental hydration with `@defer` triggers can hydrate parts lazily).",`**Infrastructure**: CSR = static hosting/CDN. SSR = Node/edge server, higher server cost. SSG = static files, but only for content known at build time.`,"**Complexity**: SSR requires platform-safe code, care with auth/cookies, and avoiding duplicate HTTP calls (HTTP transfer cache handles this for `HttpClient`).",`Good fits: SSR/SSG for public, content-heavy pages (e-commerce, blogs, marketing); CSR for authenticated dashboards and internal tools.`]},{type:`callout`,variant:`warning`,text:"Pitfall: hydration mismatch errors happen when the DOM is modified outside Angular (direct DOM manipulation, invalid HTML nesting like a `<div>` inside a `<p>`) — Angular then cannot match server and client DOM. Use `ngSkipHydration` only as a temporary escape hatch."}]}};export{e as answers};