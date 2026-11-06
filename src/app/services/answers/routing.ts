import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What happens if you have `**` (`wildcard route`) as the very first route in the routing configuration file?':
    {
      summary:
        "Every navigation matches it. The router uses a first-match-wins strategy in array order, and `**` matches any URL, so all routes after it become unreachable — the app would show the Not Found page (or perform the wildcard's redirect) for every URL, including the home page. That is why the wildcard must always be last.",
      details: [
        {
          type: 'paragraph',
          text: "Angular does not sort routes by specificity (unlike some frameworks). It walks the configuration top to bottom, and for each segment it takes the first route whose path matches. Order is part of the configuration's meaning.",
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const routes: Routes = [
  { path: '**', component: NotFoundComponent },  // ❌ matches everything
  { path: '', component: HomeComponent },        // never reached
  { path: 'products', component: ProductsComponent }, // never reached
];
// /          → NotFoundComponent
// /products  → NotFoundComponent

// With a redirect it is no better:
// { path: '**', redirectTo: 'home' } as the first route → EVERY URL is redirected to /home,
// and the redirect target itself is matched against the same config again, so a redirect
// to a path that the wildcard also catches can never reach its real route.`,
        },
        {
          type: 'flow',
          title: 'First-match-wins route matching',
          code: `flowchart TD
  U["URL: /products"]:::client --> R1{"Route 1: **"}
  R1 -->|"matches anything"| NF["NotFoundComponent"]:::highlight
  R1 -.->|"never checked"| R2["Route 2: ''"]:::external
  R2 -.-> R3["Route 3: products"]:::external`,
        },
        { type: 'heading3', text: 'Related ordering gotchas' },
        {
          type: 'bullets',
          items: [
            'Order also matters with lazy children: routes in `loadChildren` are merged at that position in the tree, so a parent `**` before the lazy route hides it.',
            'Put specific paths before parameterised ones: `products/new` before `products/:id`, otherwise "new" is captured as an id.',
            'With the old NgModule setup, the order of `RouterModule.forChild` imports affected the final order — a wildcard in `AppRoutingModule` imported before feature modules swallowed their routes.',
            'Guards like `canMatch` let two routes share a path, but the order still decides which is tried first.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: say "first match wins, in array order" and give the `products/new` vs `products/:id` example — it shows you understand the matching algorithm, not just the wildcard rule.',
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: How to implement Page Not Found route?' },
        {
          type: 'paragraph',
          text: "Add a wildcard route `{ path: '**', component: NotFoundComponent }` (or `loadComponent`) as the LAST entry in your routes. The router matches routes in order, so anything that did not match earlier lands there. Optionally add a redirect for the empty path and a dedicated `/404` route you can navigate to programmatically when an API returns 404.",
        },
        { type: 'heading3', text: 'Routes' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// app.routes.ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
  { path: 'products/:id', loadComponent: () => import('./products/detail').then(m => m.ProductDetail) },

  // Explicit route you can navigate to from code
  { path: 'not-found', loadComponent: () => import('./not-found/not-found').then(m => m.NotFoundComponent), title: 'Page not found' },

  // Wildcard — MUST be last
  { path: '**', loadComponent: () => import('./not-found/not-found').then(m => m.NotFoundComponent), title: 'Page not found' },
];`,
        },
        { type: 'heading3', text: 'The component' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: \`
    <h1>404 — Page not found</h1>
    <p>We couldn't find <code>{{ url }}</code>.</p>
    <a routerLink="/home">Go home</a>
  \`,
})
export class NotFoundComponent {
  url = inject(Router).url; // the URL the user typed is preserved
}`,
        },
        { type: 'heading3', text: 'Valid route, missing data' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// /products/999 matches the route, but the product does not exist
export const productResolver: ResolveFn<Product> = route => {
  const router = inject(Router);
  return inject(ProductService).getById(+route.paramMap.get('id')!).pipe(
    catchError(() => {
      // skipLocationChange keeps /products/999 in the address bar
      router.navigate(['/not-found'], { skipLocationChange: true });
      return EMPTY;
    }),
  );
};`,
        },
        {
          type: 'bullets',
          items: [
            "Using `component` keeps the bad URL in the address bar; `redirectTo: 'not-found'` changes the URL to `/not-found`. Keeping the original URL is usually better UX.",
            'Lazy-loaded child route arrays can have their own `**` route for section-specific 404s.',
            'With SSR, set the HTTP response status to 404 for the not-found page so search engines do not index it as a real page.',
            'On static hosting (Nginx, S3, Firebase) configure a fallback to `index.html`, otherwise deep links 404 at the server before Angular runs.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Common pitfall: putting `**` before other routes. Because matching is first-match-wins, every URL would show the 404 page.',
        },
      ],
    },

  'Is it possible to use multiple Router Outlets in Angular? If yes, how?': {
    summary:
      'Yes. Besides the primary `<router-outlet>`, you can add **named (auxiliary) outlets** like `<router-outlet name="sidebar">` and target them with routes that have `outlet: \'sidebar\'`. Their state is encoded in the URL in parentheses, e.g. `/inbox(sidebar:chat)`. You also get multiple outlets naturally through **nested routes**, where each parent component has its own `<router-outlet>` for its children.',
    details: [
      { type: 'heading3', text: 'Named outlets' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- app.html -->
<main><router-outlet /></main>
<aside><router-outlet name="sidebar" /></aside>
<router-outlet name="popup" />`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const routes: Routes = [
  { path: 'inbox', component: InboxComponent },
  { path: 'chat', component: ChatPanelComponent, outlet: 'sidebar' },
  { path: 'compose', component: ComposeDialogComponent, outlet: 'popup' },
];`,
      },
      { type: 'heading3', text: 'Navigating to them' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Opens chat in the sidebar while keeping the primary route -->
<a [routerLink]="[{ outlets: { sidebar: ['chat'] } }]">Open chat</a>
<!-- URL: /inbox(sidebar:chat) -->

<!-- Set primary and secondary together -->
<a [routerLink]="[{ outlets: { primary: ['inbox'], popup: ['compose'] } }]">Compose</a>
<!-- URL: /inbox(popup:compose) -->

<!-- Close an outlet by setting it to null -->
<a [routerLink]="[{ outlets: { popup: null } }]">Close</a>`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `this.router.navigate([{ outlets: { sidebar: ['chat'] } }]);
this.router.navigate([{ outlets: { popup: null } }]); // close`,
      },
      { type: 'heading3', text: 'Nested outlets (the more common case)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `{
  path: 'settings',
  component: SettingsShellComponent,      // its template contains <router-outlet />
  children: [
    { path: 'profile', component: ProfileComponent },   // /settings/profile
    { path: 'security', component: SecurityComponent }, // /settings/security
    { path: '', pathMatch: 'full', redirectTo: 'profile' },
  ],
}`,
      },
      {
        type: 'bullets',
        items: [
          'Named outlets are good for independent panels: chat sidebars, modals that should be deep-linkable, split views.',
          'Each outlet has its own `ActivatedRoute`, guards and resolvers.',
          'A named outlet route can be lazy too (`loadComponent` with `outlet`).',
          'The parenthesised URL syntax looks unusual to users — for simple modals, a dialog service is often simpler.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: distinguish **nested** outlets (parent/child layout, very common) from **named/auxiliary** outlets (sibling views with their own URL segment), and show the `(sidebar:chat)` URL format.',
      },
    ],
  },

  'How would you track every route change to monitor user navigation?': {
    summary:
      'Subscribe to `Router.events`, filter for `NavigationEnd` (plus `NavigationError`/`NavigationCancel` if you want failures), and send `urlAfterRedirects` to your analytics service. Do it once in a root-level service started at bootstrap (e.g. via `provideAppInitializer`), so it covers every route. For timing, pair `NavigationStart` with `NavigationEnd`.',
    details: [
      { type: 'heading3', text: 'Router event sequence' },
      {
        type: 'flow',
        title: 'Main router events',
        code: `flowchart LR
  NS["NavigationStart"]:::client --> RR["RoutesRecognized"]
  RR --> GS["GuardsCheckStart/End"]:::security
  GS --> RS["ResolveStart/End"]:::db
  RS --> NE["NavigationEnd"]:::highlight
  GS -->|"guard false"| NC["NavigationCancel"]:::external
  RS -->|"error"| NER["NavigationError"]:::server`,
      },
      { type: 'heading3', text: 'A tracking service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class RouteTrackingService {
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  private destroyRef = inject(DestroyRef);
  private startedAt = 0;

  start() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.startedAt = performance.now();
      }
      if (event instanceof NavigationEnd) {
        this.analytics.pageView({
          url: event.urlAfterRedirects,                 // final URL after redirects
          title: document.title,                        // set by Route.title / TitleStrategy
          durationMs: Math.round(performance.now() - this.startedAt),
        });
      }
      if (event instanceof NavigationError) {
        this.analytics.error('navigation_failed', { url: event.url, error: String(event.error) });
      }
    });
  }
}

// app.config.ts — start it once at bootstrap
providers: [
  provideRouter(routes),
  provideAppInitializer(() => inject(RouteTrackingService).start()),
]`,
      },
      { type: 'heading3', text: 'Getting the route pattern instead of the raw URL' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// /products/123 and /products/456 should group as "products/:id" in analytics
function routePattern(snapshot: ActivatedRouteSnapshot): string {
  let route = snapshot.root;
  const parts: string[] = [];
  while (route.firstChild) {
    route = route.firstChild;
    if (route.routeConfig?.path) parts.push(route.routeConfig.path);
  }
  return '/' + parts.join('/');
}
// usage inside NavigationEnd: routePattern(this.router.routerState.snapshot) → "/products/:id"`,
      },
      {
        type: 'bullets',
        items: [
          'Use `urlAfterRedirects`, not `url`, so redirects are reported as the page the user actually sees.',
          'Strip personal data (emails, tokens) from query params before sending to analytics.',
          'A custom `TitleStrategy` is another hook that runs after every successful navigation.',
          'With older setups, `APP_INITIALIZER` was used instead of `provideAppInitializer`; or simply inject the service in the root `App` component constructor.',
          'For debugging, `provideRouter(routes, withDebugTracing())` logs every router event to the console.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: subscribing to `router.events` inside a routed component. It only starts after that component loads, misses the first navigation, and leaks if not unsubscribed. Track from a root service instead.',
      },
    ],
  },

  'How do you implement route-level lazy loading of standalone components or feature modules in Angular (`loadChildren` / `loadComponent`)?':
    {
      summary:
        "`loadComponent: () => import('./x').then(m => m.XComponent)` lazy-loads one standalone component. `loadChildren` lazy-loads a set of routes — either a `Routes` array exported from a file (modern) or an NgModule that calls `RouterModule.forChild()` (legacy). Both return a Promise, so the bundler creates a separate chunk downloaded on first navigation.",
      details: [
        { type: 'heading3', text: 'loadComponent — one standalone component' },
        {
          type: 'code',
          lang: 'typescript',
          code: `{
  path: 'profile/:id',
  loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
  canActivate: [authGuard],
  title: 'Profile',
}`,
        },
        { type: 'heading3', text: 'loadChildren — a routes file (standalone, recommended)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// app.routes.ts
{ path: 'orders', loadChildren: () => import('./orders/orders.routes').then(m => m.ORDER_ROUTES) }

// orders/orders.routes.ts
export const ORDER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./order-list').then(m => m.OrderList) },   // /orders
  { path: ':id', loadComponent: () => import('./order-detail').then(m => m.OrderDetail) }, // /orders/42
];`,
        },
        { type: 'heading3', text: 'loadChildren — a feature NgModule (legacy)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// app-routing.module.ts
{ path: 'orders', loadChildren: () => import('./orders/orders.module').then(m => m.OrdersModule) }

// orders/orders.module.ts
@NgModule({
  declarations: [OrderListComponent, OrderDetailComponent],
  imports: [CommonModule, RouterModule.forChild([
    { path: '', component: OrderListComponent },
    { path: ':id', component: OrderDetailComponent },
  ])],
})
export class OrdersModule {}

// Very old syntax (removed): loadChildren: './orders/orders.module#OrdersModule'`,
        },
        {
          type: 'bullets',
          items: [
            '`loadComponent` → one screen; `loadChildren` → a section with several routes, shared providers, or its own guards.',
            'Route-level `providers: [...]` on the parent route of a lazy section create an environment injector for that section — the modern replacement for module-scoped services.',
            'Both can be combined with `canMatch` so the chunk is not even downloaded for users who are not allowed in.',
            'Migration path: an existing NgModule feature can stay lazy-loaded as-is while you convert its components to standalone one by one.',
          ],
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: How to implement lazy loading in Angular?' },
        {
          type: 'paragraph',
          text: 'Use dynamic `import()` in the route config: `loadComponent` for a single standalone component and `loadChildren` for a group of routes (a `routes.ts` file, or a legacy NgModule). The bundler splits that code into a separate chunk that is downloaded only when the user first navigates to the route, shrinking the initial bundle. Beyond routes, `@defer` blocks lazy-load parts of a template.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },                    // eager

  // Lazy single component
  {
    path: 'about',
    loadComponent: () => import('./about/about').then(m => m.AboutComponent),
  },

  // Lazy feature with its own child routes
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
];`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    providers: [AdminApiService],                    // scoped to this lazy section
    children: [
      { path: 'users', loadComponent: () => import('./users/users').then(m => m.UsersComponent) },
      { path: 'reports', loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent) },
    ],
  },
];`,
        },
        { type: 'heading3', text: 'Lazy loading inside a template with @defer' },
        {
          type: 'code',
          lang: 'html',
          code: `@defer (on viewport) {
  <app-heavy-chart [data]="sales()" />
} @placeholder {
  <div class="chart-skeleton"></div>
} @loading (minimum 300ms) {
  <app-spinner />
}`,
        },
        {
          type: 'bullets',
          items: [
            'Verify it worked: `ng build` lists "Lazy chunk files", and the Network tab shows a new `chunk-XXXX.js` on first navigation.',
            "Default exports allow a shorter form: `loadComponent: () => import('./about/about')` if the file does `export default class AboutComponent`.",
            'Combine with a preloading strategy so chunks are fetched in the background after the app starts.',
            'Guards like `canMatch` run before the chunk is downloaded on navigation, so unauthorised users do not fetch the admin code (unless a preloading strategy fetches it in the background).',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: "Common pitfall: importing a lazy component's class (or a barrel `index.ts` that re-exports it) somewhere eager. The bundler then includes it in the main bundle and the lazy route silently becomes eager.",
        },
        { type: 'divider' },
        {
          type: 'heading3',
          text: 'Follow-up: Write the exact routing configuration code (`app.routes.ts` / `router.js`) to implement lazy loading for an Angular component or module.',
        },
        {
          type: 'paragraph',
          text: 'Define `routes` in `app.routes.ts` with `loadComponent` / `loadChildren` using dynamic `import()`, register them with `provideRouter(routes)` in `app.config.ts`, and place `<router-outlet />` in the root component. For a module-based app the same `loadChildren` goes in `AppRoutingModule` with `RouterModule.forRoot(routes)`.',
        },
        { type: 'heading3', text: 'Standalone app — complete setup' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Lazy standalone component
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard',
  },

  // Lazy group of routes (standalone feature)
  {
    path: 'products',
    loadChildren: () => import('./products/products.routes').then(m => m.PRODUCT_ROUTES),
  },

  // Lazy + protected: on navigation the chunk is fetched only if canMatch passes
  // (note: PreloadAllModules below would still preload it — use a selective strategy if that matters)
  {
    path: 'admin',
    canMatch: [authGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },

  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// src/app/products/products.routes.ts
import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./product-detail.component').then(m => m.ProductDetailComponent),
  },
];`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
  ],
};

// src/main.ts
bootstrapApplication(App, appConfig);

// src/app/app.ts
@Component({ selector: 'app-root', imports: [RouterOutlet, RouterLink], template: \`
  <nav><a routerLink="/dashboard">Dashboard</a> <a routerLink="/products">Products</a></nav>
  <router-outlet />
\` })
export class App {}`,
        },
        { type: 'heading3', text: 'NgModule app equivalent' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// app-routing.module.ts
const routes: Routes = [
  { path: 'products', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
  { path: 'about', loadComponent: () => import('./about/about.component').then(m => m.AboutComponent) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}`,
        },
        {
          type: 'bullets',
          items: [
            '`router.js` is not an Angular file — in Angular the file is `app.routes.ts` (standalone) or `app-routing.module.ts` (NgModule). React Router and Vue Router use `lazy()` / `() => import()` with the same idea.',
            'The path inside `import()` must be a static string so the bundler can create the chunk.',
            'Run `ng build` and look for the "Lazy chunk files" section to confirm each route got its own chunk.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: mention that a lazy `Routes` file plus route-level `providers` gives you everything a feature NgModule used to — separate chunk, scoped services, own child routes — without the module boilerplate.',
        },
      ],
    },

  'Explain Lazy Loading and Preloading Strategies': {
    summary:
      "Lazy loading downloads a route's code only when the user navigates there, making the initial load fast. Preloading is the complement: after the app has started, the router downloads lazy chunks in the background so later navigation is instant. Angular ships `NoPreloading` (default) and `PreloadAllModules`; you can write a custom `PreloadingStrategy` (e.g. preload only routes flagged with `data: { preload: true }`, or based on network speed).",
    details: [
      {
        type: 'flow',
        title: 'Timeline with lazy loading + preloading',
        code: `sequenceDiagram
  participant U as User
  participant B as Browser
  participant S as Server
  U->>B: open app
  B->>S: main.js (small)
  S-->>B: app is interactive
  B->>S: preload chunk-orders.js (idle, background)
  U->>B: click Orders
  B-->>U: instant — chunk already cached`,
      },
      { type: 'heading3', text: 'Built-in strategies' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Default: NoPreloading — chunks load only on navigation
provideRouter(routes);

// Preload every lazy route after the initial navigation
provideRouter(routes, withPreloading(PreloadAllModules));

// NgModule equivalent
RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules });`,
      },
      { type: 'heading3', text: 'Custom selective strategy' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const conn = (navigator as any).connection;
    const slowNetwork = conn?.saveData || /2g/.test(conn?.effectiveType ?? '');

    if (route.data?.['preload'] && !slowNetwork) {
      // Optional delay so preloading does not compete with the first render
      return timer(2000).pipe(switchMap(() => load()));
    }
    return of(null); // skip
  }
}

// routes
{ path: 'orders', data: { preload: true }, loadChildren: () => import('./orders/orders.routes').then(m => m.ORDER_ROUTES) },
{ path: 'admin',  loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) }, // not preloaded

provideRouter(routes, withPreloading(SelectivePreloadingStrategy));`,
      },
      { type: 'heading3', text: 'Comparing approaches' },
      {
        type: 'bullets',
        items: [
          '**No preloading**: smallest data usage, but a short delay on first visit to each lazy route.',
          '**PreloadAllModules**: instant navigation everywhere, but downloads code users may never need — bad for large apps and mobile data.',
          '**Selective / custom**: preload likely next pages (e.g. checkout after cart), skip admin areas and slow networks.',
          'Community options such as on-hover/in-viewport preloading (e.g. the `ngx-quicklink` library) preload routes whose links are visible.',
          'Preloading and guards: routes with the deprecated `canLoad` are never preloaded, but `canMatch` does NOT stop the preloader — if a chunk must stay hidden from some users, exclude it in a custom strategy.',
          '`@defer` has its own `prefetch on idle / hover / viewport` triggers for template-level chunks.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: present them as a pair — "lazy loading optimises the first load, preloading optimises the next navigation" — then describe a custom strategy you would use in a real app.',
      },
    ],
  },

  'What are the different Route Guards (`canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`, `resolve`) in Angular?':
    {
      summary:
        '`canMatch` decides whether a route config may even be matched (and its lazy chunk loaded); `canActivate` decides whether a matched route may be entered; `canActivateChild` does the same for every child of a route; `canDeactivate` decides whether the user may leave the current component (unsaved changes); and `resolve` is not a yes/no guard but pre-fetches data before the component activates.',
      details: [
        { type: 'heading3', text: 'All five on one config' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [featureFlagGuard('admin-v2')],     // should this config be considered at all?
    canActivate: [authGuard],                     // may the user enter /admin?
    canActivateChild: [roleGuard('admin')],       // checked for EVERY child navigation
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'profile/edit',
    component: EditProfileComponent,
    canDeactivate: [unsavedChangesGuard],         // may the user leave?
    resolve: { profile: profileResolver },        // fetch data before showing
  },
];`,
        },
        { type: 'heading3', text: 'The guard implementations' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// canMatch — factory with a parameter
export const featureFlagGuard = (flag: string): CanMatchFn => () =>
  inject(FeatureFlags).isEnabled(flag); // false → router tries the next route with this path

// canActivateChild
export const roleGuard = (role: string): CanActivateChildFn => () =>
  inject(AuthService).hasRole(role) || inject(Router).parseUrl('/forbidden');

// canDeactivate — typed to the component
export interface HasUnsavedChanges { hasUnsavedChanges(): boolean }
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component =>
  !component.hasUnsavedChanges() || confirm('You have unsaved changes. Leave anyway?');

// resolve
export const profileResolver: ResolveFn<Profile> = () => inject(ProfileService).getMine();`,
        },
        { type: 'heading3', text: 'Quick comparison' },
        {
          type: 'bullets',
          items: [
            '**canMatch** — runs during route matching, before lazy code loads. `false` = "this route does not match", so another route with the same path can be tried (e.g. different dashboard for admins vs users).',
            '**canActivate** — runs after matching; `false` cancels navigation. Lazy code for that route may already be downloaded.',
            '**canActivateChild** — like canActivate but runs for each child route, including navigations between siblings. Good for protecting a whole section in one place.',
            '**canDeactivate** — runs on the component being left; gets the component instance, current and next state.',
            '**resolve** — returns data, not a decision; navigation waits for it. Data appears in `route.data` or as an input.',
            'Order: canDeactivate (old routes) → canActivateChild/canActivate (top-down) → resolve. canMatch runs earlier, during recognition.',
          ],
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: What are route guards?' },
        {
          type: 'paragraph',
          text: 'Route guards are functions the router runs during navigation to decide whether it may continue: they return `true` to allow, `false` to cancel, or a `UrlTree`/`RedirectCommand` to redirect — synchronously or as an Observable/Promise. They are used for authentication, role checks, unsaved-changes prompts and feature flags. Modern Angular uses functional guards (`CanActivateFn` etc.) with `inject()`.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// auth.guard.ts — functional guard
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// app.routes.ts
{ path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }`,
        },
        {
          type: 'flow',
          title: 'Where guards run in a navigation',
          code: `flowchart LR
  N["Navigation start"]:::client --> M["Match routes<br/>canMatch"]:::security
  M --> D["canDeactivate<br/>(leaving page)"]:::security
  D --> A["canActivateChild<br/>canActivate"]:::security
  A --> R["resolve<br/>(fetch data)"]:::db
  R --> C["Activate components"]:::highlight
  A -->|"false or UrlTree"| X["Cancel or redirect"]:::external`,
        },
        {
          type: 'bullets',
          items: [
            'Types: `canMatch`, `canActivate`, `canActivateChild`, `canDeactivate`, and the deprecated `canLoad`. `resolve` is not a guard but runs in the same pipeline.',
            'Return values: `boolean`, `UrlTree`, `RedirectCommand` (newer versions; lets you pass navigation extras) or an `Observable`/`Promise` of these.',
            'Legacy: classes implementing `CanActivate` etc. Class-based guard interfaces are deprecated; wrap old ones with `mapToCanActivate([OldGuard])` during migration.',
            'Multiple guards in an array all must pass.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Guards are a UX feature, not security. Anyone can bypass client-side JavaScript; the API must still authorise every request on the server.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: give each guard a one-line real use case — feature flag (canMatch), login (canActivate), admin section (canActivateChild), unsaved form (canDeactivate), preload details (resolve). Concrete examples are what interviewers remember.',
        },
      ],
    },

  'Difference between canMatch and canLoad': {
    summary:
      'Both can stop a lazy route\'s code from being downloaded, but `canLoad` is deprecated and limited: it only applies to `loadChildren` routes and only runs until the chunk is loaded once. `canMatch` replaces it — it works on any route (eager or lazy), runs on every navigation, and returning `false` means "this route does not match", so the router keeps looking for another route with the same path instead of cancelling.',
    details: [
      { type: 'heading3', text: 'The behaviour difference' },
      {
        type: 'bullets',
        items: [
          '**canLoad** (deprecated since Angular 15.1): runs before downloading a `loadChildren` chunk. Once the chunk has been loaded in the session it does not run again (e.g. after logging out and in as a different user), so it was never a reliable access check on its own and was usually paired with canActivate. Routes with canLoad are also never preloaded.',
          '**canMatch**: runs every time the router tries to match that route config. Works with `component`, `loadComponent` and `loadChildren`.',
          '`canLoad` returning false cancels the navigation; `canMatch` returning false skips the route and continues matching (often ending at the next same-path route or the `**` wildcard).',
          'Both can return a `UrlTree` to redirect.',
        ],
      },
      { type: 'heading3', text: 'What canMatch enables: same path, different routes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const isAdmin: CanMatchFn = () => inject(AuthService).role() === 'admin';

export const routes: Routes = [
  // Admins get the admin dashboard chunk; everyone else falls through to the next route
  {
    path: 'dashboard',
    canMatch: [isAdmin],
    loadComponent: () => import('./admin-dashboard').then(m => m.AdminDashboard),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./user-dashboard').then(m => m.UserDashboard),
  },
];
// Same URL /dashboard — different component and different chunk based on role.`,
      },
      { type: 'heading3', text: 'Migration' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before (deprecated)
{ path: 'admin', canLoad: [AdminGuard], loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) }

// After
{ path: 'admin', canMatch: [adminGuard], loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) }`,
      },
      {
        type: 'flow',
        title: 'What happens when the guard returns false',
        code: `flowchart TD
  U["Navigate to /dashboard"]:::client --> CM{"canMatch on route 1"}:::security
  CM -->|true| L1["Load and show route 1"]:::highlight
  CM -->|false| R2["Try route 2 with same path"]:::server
  U2["Navigate to /admin"]:::client --> CL{"canLoad"}:::security
  CL -->|false| X["Navigation cancelled"]:::external`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the key phrases are "canLoad is deprecated", "canMatch runs on every navigation", and "false means skip this route, not cancel". The same-path admin/user dashboard example makes it click.',
      },
    ],
  },

  'How do you restrict unauthorized users from accessing specific route URLs or components using Angular Route Guards?':
    {
      summary:
        'Create a functional `CanActivateFn` (or `CanMatchFn`) that checks the auth service and returns `true`, or a `UrlTree` to `/login` (with a `returnUrl`) or `/forbidden`. Attach it with `canActivate: [authGuard]` to individual routes, `canActivateChild` on a parent to cover a whole section, or `canMatch` on lazy routes so the code is not even downloaded. After login, navigate back to `returnUrl`.',
      details: [
        { type: 'heading3', text: 'Guard that waits for async auth state' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // auth.user$ emits undefined while /api/me is loading, then User | null
  return auth.user$.pipe(
    filter(user => user !== undefined),
    take(1),
    map(user =>
      user ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};`,
        },
        { type: 'heading3', text: 'Protecting a whole area' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.LoginComponent) },
  {
    path: '',
    component: AppShellComponent,          // layout with nav + <router-outlet />
    canActivateChild: [authGuard],         // every child page requires login
    children: [
      { path: 'home', loadComponent: () => import('./home/home').then(m => m.Home) },
      { path: 'orders', loadChildren: () => import('./orders/orders.routes').then(m => m.ORDER_ROUTES) },
    ],
  },
];`,
        },
        { type: 'heading3', text: 'Returning to the original URL after login' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  returnUrl = input('/home'); // from ?returnUrl=... via withComponentInputBinding()

  login(credentials: Credentials) {
    this.auth.login(credentials).subscribe(() => this.router.navigateByUrl(this.returnUrl()));
  }
}`,
        },
        {
          type: 'flow',
          title: 'Unauthenticated user opens /orders/42',
          code: `sequenceDiagram
  participant U as User
  participant R as Router
  participant G as authGuard
  participant L as LoginPage
  U->>R: /orders/42
  R->>G: canActivateChild
  G-->>R: UrlTree /login?returnUrl=/orders/42
  R->>L: show login
  L->>R: navigateByUrl(/orders/42) after login
  R->>G: check again
  G-->>R: true, page opens`,
        },
        {
          type: 'bullets',
          items: [
            'Protecting a component that is not routed (e.g. a widget) is done with `@if` and permission checks, not guards.',
            'Validate `returnUrl` is an internal path to avoid open-redirect vulnerabilities.',
            'Also handle token expiry mid-session: a 401 from the API (via an interceptor) should redirect to login even if the guard passed earlier.',
          ],
        },
        { type: 'divider' },
        {
          type: 'heading3',
          text: 'Follow-up: How can you restrict routes based on user in Angular?',
        },
        {
          type: 'paragraph',
          text: 'Store the current user and roles/permissions in an auth service (ideally as signals), and attach guards to routes: `canActivate`/`canActivateChild` with a role check for entering pages, `canMatch` when unauthorised users should not even download the chunk or should see a different route. Put the required roles in `route.data` so one reusable guard covers all routes, and hide links in the UI with the same permission logic — while the backend still enforces authorisation.',
        },
        { type: 'heading3', text: 'Auth state' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export type Role = 'admin' | 'editor' | 'viewer';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<{ id: string; roles: Role[] } | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  hasAnyRole(roles: Role[]) {
    return roles.some(r => this._user()?.roles.includes(r));
  }
}`,
        },
        { type: 'heading3', text: 'One reusable role guard driven by route data' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = (route.data['roles'] ?? []) as Role[];

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (required.length && !auth.hasAnyRole(required)) {
    return router.createUrlTree(['/forbidden']);
  }
  return true;
};

export const routes: Routes = [
  { path: 'reports', component: ReportsComponent, canActivate: [roleGuard], data: { roles: ['admin', 'editor'] } },
  {
    path: 'admin',
    canMatch: [() => inject(AuthService).hasAnyRole(['admin'])], // chunk never loads for others
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
];`,
        },
        { type: 'heading3', text: 'Hide what users cannot open' },
        {
          type: 'code',
          lang: 'html',
          code: `@if (auth.hasAnyRole(['admin'])) {
  <a routerLink="/admin">Admin</a>
}`,
        },
        {
          type: 'bullets',
          items: [
            'If the user is loaded asynchronously (e.g. `/api/me` on startup), make the guard wait: return an Observable that filters until the user is known, or load the user in `provideAppInitializer`.',
            "Permission-based checks (`can('invoice:approve')`) scale better than hard-coded role names in large apps.",
            'When the user logs out or roles change, re-run guards on the current route (e.g. navigate again) or redirect to login.',
            'Return a `UrlTree` instead of calling `router.navigate()` inside a guard — it avoids competing navigations.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Client-side route restrictions only control what the UI shows. Any user can edit local storage or call the API directly, so every protected endpoint must check the token and permissions on the server.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: mention the three improvements most candidates miss — `canActivateChild` for whole sections, `canMatch` so lazy chunks are not downloaded, and `returnUrl` so the user lands where they wanted after login.',
        },
      ],
    },

  'What are Resolvers?': {
    summary:
      "A resolver is a function (`ResolveFn<T>`) attached to a route's `resolve` property that fetches data BEFORE the route activates. The router waits for it to emit, then puts the result in `ActivatedRoute.data` (or a component input), so the component renders with its data already present. If it errors, the navigation fails; if it emits nothing, the navigation is cancelled.",
    details: [
      { type: 'heading3', text: 'Defining and using a resolver' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// product.resolver.ts
export const productResolver: ResolveFn<Product> = (route) => {
  const id = Number(route.paramMap.get('id'));
  return inject(ProductService).getById(id); // Observable, Promise or plain value
};

// app.routes.ts
{
  path: 'products/:id',
  component: ProductDetailComponent,
  resolve: { product: productResolver },     // key "product" → route data
  title: (route) => \`Product \${route.paramMap.get('id')}\`,
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Option A: component input binding — provideRouter(routes, withComponentInputBinding())
export class ProductDetailComponent {
  product = input.required<Product>();   // filled from resolve.product
}

// Option B: ActivatedRoute
export class ProductDetailComponent {
  product = toSignal(inject(ActivatedRoute).data.pipe(map(d => d['product'] as Product)));
}`,
      },
      {
        type: 'flow',
        title: 'Resolver in the navigation pipeline',
        code: `sequenceDiagram
  participant U as User
  participant R as Router
  participant RS as productResolver
  participant API as API
  participant C as ProductDetail
  U->>R: click /products/7
  R->>R: run guards
  R->>RS: resolve
  RS->>API: GET /api/products/7
  API-->>RS: product JSON
  RS-->>R: Product
  R->>C: activate with data ready`,
      },
      {
        type: 'bullets',
        items: [
          'Legacy: classes implementing `Resolve<T>`; class-based resolvers are deprecated in favour of `ResolveFn`.',
          "`runGuardsAndResolvers` controls when it reruns (default: when path params change; options include `'paramsOrQueryParamsChange'` and `'always'`).",
          'Show a global progress bar using router events (`ResolveStart`/`NavigationEnd`), because the old page stays on screen while resolving.',
          'Resolvers suit small, critical data. For slow or large data, render the page immediately and load in the component with skeletons.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: a slow API inside a resolver makes the app feel frozen — the click seems to do nothing. Always pair resolvers with a navigation loading indicator and handle errors (redirect or fallback value).',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: "Follow-up: What is the primary benefit of fetching API data inside a Route Resolver (`ResolveFn`) instead of inside the component's `ngOnInit()`?",
      },
      {
        type: 'paragraph',
        text: 'The component is created only when its data is ready, so it never renders a half-empty state, does not need loading/null checks for that data, and the decision "does this resource exist?" happens before navigation completes (you can redirect to 404 without flashing a broken page). The trade-off is that the user waits on the previous page with no content change, so it suits fast, essential data.',
      },
      { type: 'heading3', text: 'ngOnInit approach' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class OrderComponent implements OnInit {
  private api = inject(OrderService);
  id = input.required<string>();
  order = signal<Order | null>(null);   // must handle null in the template

  ngOnInit() {
    this.api.get(this.id()).subscribe(o => this.order.set(o));
  }
}
// Page shows immediately with a spinner/skeleton → data pops in later.`,
      },
      { type: 'heading3', text: 'Resolver approach' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const orderResolver: ResolveFn<Order> = route => {
  const router = inject(Router);
  return inject(OrderService).get(route.paramMap.get('id')!).pipe(
    catchError(() => of(new RedirectCommand(router.parseUrl('/not-found')))),
    // RedirectCommand is available in recent Angular versions; older code navigated + returned EMPTY
  );
};

export class OrderComponent {
  order = input.required<Order>();   // always defined, no null checks
}`,
      },
      { type: 'heading3', text: 'Benefits vs costs' },
      {
        type: 'bullets',
        items: [
          '**Benefit — complete render**: no flicker, no `?.` everywhere, simpler component and tests (just pass an input).',
          '**Benefit — navigation-level decisions**: missing resource → redirect before showing anything; the URL and page stay consistent.',
          '**Benefit — separation**: data loading is defined in the route config and reusable across components; the component becomes presentational.',
          '**Benefit — SSR/SEO**: the data is in the first render.',
          '**Cost — perceived latency**: nothing changes on screen until the request finishes; you need a global progress bar.',
          '**Cost — all-or-nothing**: one slow call blocks the whole page; parallel or optional data is better loaded in the component (or `@defer`).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: do not claim resolvers are "faster" — the request takes the same time. The benefit is WHEN the component renders and where errors are handled. Saying that clearly shows real understanding.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What happens if you resolve and subscribe to an API inside an Angular Route Resolver (`ResolveFn`) before loading the component?',
      },
      {
        type: 'paragraph',
        text: 'You should return the Observable, not subscribe to it. If you return it, the router subscribes, waits for the first value, puts it in route data, then activates the component. If you `subscribe()` inside the resolver yourself and return nothing (or the Subscription), the router does not wait — the component loads immediately with `undefined` data, and the API result goes nowhere. Also: an error in the returned Observable fails the navigation, and an Observable that completes without emitting cancels it.',
      },
      { type: 'heading3', text: 'Wrong: subscribing inside the resolver' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ Router gets a Subscription (or undefined), not the data
export const userResolver: ResolveFn<User> = route => {
  let result!: User;
  inject(UserService).get(route.paramMap.get('id')!).subscribe(u => (result = u));
  return result; // undefined — the HTTP call hasn't returned yet
};
// Component: route.data.user === undefined. The request still fires and completes later,
// but nobody uses the response.`,
      },
      { type: 'heading3', text: 'Right: return the Observable (or Promise)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ✅ Router subscribes, waits, then activates
export const userResolver: ResolveFn<User> = route =>
  inject(UserService).get(route.paramMap.get('id')!);

// Async/await also works
export const settingsResolver: ResolveFn<Settings> = async () =>
  firstValueFrom(inject(SettingsService).load());`,
      },
      { type: 'heading3', text: 'What the router does with the returned Observable' },
      {
        type: 'bullets',
        items: [
          'Takes the **first** emitted value and proceeds (current Angular). Very old versions waited for completion, so a never-completing stream hung navigation; still, prefer streams that complete, like HttpClient calls.',
          '**Error** → navigation fails with a `NavigationError` event; the user stays on the previous page unless you catch it.',
          '**Completes without emitting** (e.g. `EMPTY`) → navigation is cancelled (`NavigationCancel`).',
          'Multiple resolvers on the same route run in parallel; the component waits for all of them.',
          'The router manages the subscription, so there is nothing to unsubscribe.',
        ],
      },
      {
        type: 'flow',
        title: 'Outcomes of a resolver Observable',
        code: `flowchart TD
  R["Resolver returns Observable"]:::server --> S{"Router subscribes"}
  S -->|"emits value"| OK["Data stored<br/>component activates"]:::highlight
  S -->|"errors"| ERR["NavigationError<br/>stay on old page"]:::external
  S -->|"completes empty"| CAN["NavigationCancel"]:::external
  S -->|"never emits"| HANG["Navigation waits forever"]:::security`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: using a store selector that never emits until data is loaded, without triggering the load. The resolver waits forever and the click appears dead. Dispatch the load, then `filter` + `take(1)` on the selector.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Will you be able to see the API request in the browser Network tab if the request is triggered inside a Route Resolver or Guard?',
      },
      {
        type: 'paragraph',
        text: "Yes. Resolvers and guards are ordinary JavaScript running in the browser, and `HttpClient` uses XHR/fetch, so the request appears in the Network tab (filter by Fetch/XHR) like any other — it just happens before the component's own requests. The exception is server-side rendering: if the resolver runs on the server during SSR, that call happens on the Node server and, with the HTTP transfer cache, the browser reuses the result instead of re-requesting it.",
      },
      {
        type: 'paragraph',
        text: "There is no hidden channel: the router just calls your function, which calls `HttpClient`, which calls the browser's network API. The order is what changes: you will see the resolver/guard request start first, and the lazy chunk and component requests after it completes.",
      },
      { type: 'heading3', text: 'What you would see' },
      {
        type: 'code',
        lang: 'text',
        code: `Network tab (Fetch/XHR + JS), navigating to /orders/42 with a guard + resolver:

GET /api/auth/me          200  (canActivate guard checking session)
GET /api/orders/42        200  (orderResolver)
GET chunk-ORDERS.js       200  (lazy component chunk, if not loaded or preloaded yet)
GET /api/orders/42/items  200  (requested by the component itself after it renders)`,
      },
      { type: 'heading3', text: 'When you might NOT see it' },
      {
        type: 'bullets',
        items: [
          '**SSR / hydration**: the resolver ran on the server; `provideClientHydration()` enables the HTTP transfer cache, so the client reads the cached response embedded in the HTML instead of calling the API again.',
          '**Your own cache**: a `shareReplay` or store returned cached data, so no request was made.',
          '**Browser cache**: the request still shows in the Network tab, but marked "(disk cache)" / "(memory cache)" or 304.',
          '**Guard never reached**: an earlier guard (e.g. `canMatch`) returned false, so later guards and resolvers did not run.',
          '**Service worker**: shown as served "(ServiceWorker)".',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Debugging resolvers/guards: log router events
provideRouter(routes, withDebugTracing());
// Console: GuardsCheckStart, GuardsCheckEnd, ResolveStart, ResolveEnd, NavigationEnd`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "yes, it is a normal browser request" and then show depth with the SSR transfer-cache exception — it is exactly the kind of nuance this trick question is fishing for.',
      },
    ],
  },
};
