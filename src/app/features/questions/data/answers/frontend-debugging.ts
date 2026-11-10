import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'memory-grows-the-longer-the-app-is-open': {
    summary:
      'First prove it is a real leak and find the action that causes it: repeat one user flow (open and close a page, a dialog, a route) several times and watch whether the JS heap and DOM node count return to baseline after a forced GC. Then take heap snapshots before and after the repetitions and use the Comparison view to see which objects keep piling up and what retains them. In Angular it is almost always something long-lived holding a reference to a destroyed component: an unfinished subscription, a global event listener, a timer or an ever-growing cache.',
    details: [
      {
        type: 'paragraph',
        text: 'Interviewers want a method, not a list of guesses. Memory growing on its own is not a leak. The heap grows and shrinks with GC. A leak is memory that **stays** after the feature that used it is gone, and it gets worse each time the flow is repeated.',
      },
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'numbered',
        items: [
          'Ask which screens users keep open (dashboards with polling, chat, long sessions) and check RUM data if you collect `performance.memory` or crash reports for "Aw, Snap" out-of-memory tabs.',
          'Pick one flow, for example open a route and navigate away. Do it once to warm up caches, then force GC (trash icon in the Memory panel) and take **snapshot 1**.',
          'Repeat the flow 10 times, force GC, take **snapshot 2**. If a component leaks, you should now see about 10 extra instances of it.',
          'Watch the Performance monitor (JS heap size, DOM nodes, JS event listeners). A sawtooth that keeps rising is the signal you want.',
        ],
      },
      { type: 'heading3', text: '2. Read the evidence in Chrome DevTools' },
      {
        type: 'bullets',
        items: [
          '**Comparison view** between snapshots, sorted by `# Delta`: look for your component class names (`OrderDetailComponent`), `Detached HTMLDivElement` entries, `Subscriber`/`SafeSubscriber` objects and closures.',
          '**Retainers** pane: follow the chain from a leaked component up to a GC root. It usually ends in a singleton service, a `Subject` inside a store, `window`, or a timer.',
          '**Allocation instrumentation on timeline**: blue bars that stay blue after the flow are allocations that were never freed, and you can click them to get the stack trace.',
          'The **Detached elements** view (or filtering a snapshot for "Detached") shows DOM trees removed from the page but still referenced from JS.',
        ],
      },
      { type: 'heading3', text: '3. Likely causes, most common first' },
      {
        type: 'numbered',
        items: [
          'Subscriptions to long-lived observables that never complete, such as store selectors, `router.events`, `interval`, a `Subject` in a root service, or `fromEvent(window, ...)`. `HttpClient` calls complete on their own and are not the usual culprit.',
          'Manual `addEventListener` on `window`/`document`, `setInterval`, `ResizeObserver`/`IntersectionObserver` that are never removed or disconnected.',
          'Third-party widgets (charts, maps, editors) created in `ngAfterViewInit` without calling their `destroy()`.',
          'Unbounded caches in root services (a `Map` keyed by id that only grows), or `shareReplay(1)` without `refCount` keeping a source alive.',
          'Closures or arrays in a singleton that hold component instances or DOM nodes.',
        ],
      },
      { type: 'heading3', text: '4. Fix with modern Angular' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-live-orders', templateUrl: './live-orders.html' })
export class LiveOrdersComponent {
  private store = inject(OrderStore);
  private destroyRef = inject(DestroyRef);

  // Preferred: no manual subscription at all; toSignal cleans up with the component
  orders = toSignal(this.store.orders$, { initialValue: [] });

  constructor() {
    // When you must subscribe, tie it to the component lifetime
    interval(10_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.store.refresh());

    // Non-RxJS resources: clean up explicitly
    const onResize = () => this.store.setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }
}`,
      },
      {
        type: 'paragraph',
        text: '`takeUntilDestroyed()` without arguments must run in an injection context (constructor or field initializer). Outside it, pass `takeUntilDestroyed(this.destroyRef)`. For shared streams use `shareReplay({ bufferSize: 1, refCount: true })`, and give caches a size limit or eviction.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: "just reload the app every hour" or adding `unsubscribe()` calls randomly everywhere. Find the retainer chain first. Otherwise you change a lot of code and may miss the one listener on `window` that actually holds everything. Also keep DevTools console logs in mind: logged objects stay retained while DevTools is open, which can mislead you during the investigation.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Prefer `async` pipe / `toSignal` over manual `subscribe`, and enforce it with lint rules such as `rxjs-x/no-ignored-subscription` or a team rule that every `subscribe` in a component has `takeUntilDestroyed`.',
          'Add a repeatable memory check for key flows, for example a Playwright script that repeats navigation and compares `performance.memory` or uses Chrome DevTools Protocol heap usage, run nightly.',
          'Track memory and long-session crash rates in RUM so a regression shows up after a release, not from user complaints.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say the three words "snapshot, compare, retainers". Describe the leaked object you found, the retainer chain (for example "a root `NotificationService` Subject held 40 detached `ChatComponent`s"), and the one-line fix. That sounds like real experience.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Why does `HttpClient` usually not need unsubscribing, and when does it still matter? (Cancelling in-flight requests on navigation.)',
          'How is `takeUntilDestroyed` different from the old `takeUntil(this.destroy$)` pattern?',
          'How would you find a leak that only happens in production after hours of use?',
        ],
      },
    ],
  },

  expressionchangedafterithasbeenchecked: {
    summary:
      'In development mode Angular runs a second, verification pass after change detection. If a binding now has a different value than the one just rendered, it throws this error. It means the data flow is not unidirectional: something changed state that was already checked, usually a child or a lifecycle hook updating parent state during the same cycle. I find which binding changed (the error names the old and new values) and move the state change to where it belongs, instead of hiding it.',
    details: [
      {
        type: 'paragraph',
        text: 'The error exists only in dev mode, because the extra check (`checkNoChanges`) is skipped in production builds. That does **not** mean production is fine. In production the same code silently shows a stale value until the next change detection cycle. The error is a warning about a real bug.',
      },
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'bullets',
        items: [
          "Read the message: it shows the previous and current value, for example `Previous value: 'false'. Current value: 'true'`, and the stack trace points to the template of the component whose binding failed.",
          'Search for who writes that value. Typical writers are `ngAfterViewInit`, `ngAfterContentInit`, a child component calling a parent service in its `ngOnInit`, or a directive setting a host property.',
          'Use Angular DevTools to inspect the component tree and see which component owns the state that changed.',
        ],
      },
      { type: 'heading3', text: '2. Typical causes' },
      {
        type: 'numbered',
        items: [
          'A child changes state that the parent already rendered, for example a child sets `layout.showSidebar = true` in `ngOnInit` while the parent template binds `showSidebar`. The parent was checked first, so its view is now out of date.',
          'A value is set in `ngAfterViewInit` based on a `@ViewChild` or measurement, but it is bound in the same template.',
          'A getter or template function returns a new primitive every time, such as `Date.now()` or `Math.random()`.',
          'An `@Output` emitted synchronously during the child initialization that updates parent bindings.',
        ],
      },
      { type: 'heading3', text: '3. Fix the data flow' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: child mutates parent-rendered state while the parent is being checked
export class FilterPanelComponent implements OnInit {
  private layout = inject(LayoutService);
  ngOnInit() { this.layout.showSidebar = true; } // parent already rendered "false"
}

// After: the state is derived, owned in one place, and computed before rendering
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly filtersEnabled = signal(false);
  readonly showSidebar = computed(() => this.filtersEnabled());
}

// The decision is made by whoever owns it (route data, a resolver, or the parent),
// not as a side effect of a child rendering.`,
      },
      {
        type: 'bullets',
        items: [
          'Derive instead of push: use `computed()` signals or compute the value in the parent before its template renders.',
          'If the value comes from a `@ViewChild` that is not inside `@if`/`@for`, use `viewChild.required()` signal queries, or `{ static: true }` with the decorator, so it is available earlier.',
          'Move work from `ngAfterViewInit` to `ngOnInit` or the constructor when it does not actually need the rendered view.',
          'For values that change every check (timestamps), store them in a field or signal updated by a timer instead of calling a function in the template.',
          'If a value truly depends on rendered layout (measured width), consider CSS (container queries) or `afterNextRender` to perform DOM work, and keep it out of bindings that were already checked.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: wrapping the update in `setTimeout`, `Promise.resolve().then(...)` or calling `cdRef.detectChanges()` inside `ngAfterViewInit`. The error disappears, but you have only scheduled a second render cycle, made the order of updates harder to reason about, and possibly introduced a visual flicker. Fix who owns the state instead.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Run unit and e2e tests against a dev build so the check runs in CI. Component tests with `fixture.detectChanges()` will throw on the same error.',
          'Follow one rule: parents pass data down via inputs, children send events up via outputs, and shared state lives in a service with signals that derive values rather than being set as side effects of rendering.',
          'Treat any `setTimeout` added "to fix change detection" as a code review red flag.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention explicitly that the check is dev-only and that in production the bug becomes a stale UI. It shows you understand why the error exists, not just how to make it go away.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Why does Angular check parent before child, and how does that relate to this error?',
          'How do signals and OnPush change how you structure shared state?',
          'When is `detectChanges()` a legitimate tool rather than a workaround?',
        ],
      },
    ],
  },

  'table-of-10000-rows-freezes': {
    summary:
      'First I measure where the freeze comes from with the Performance panel and the Angular DevTools profiler: is it the initial render of tens of thousands of DOM nodes, change detection re-checking every row on each event, or expensive work in the template such as function calls, sorting and impure pipes? The usual fix combines rendering only what is visible (CDK virtual scroll or pagination), stable `track` keys, OnPush/signals so rows are not re-checked, and moving heavy computation out of the template.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'bullets',
        items: [
          'Reproduce with production-like data (10k rows with realistic columns) and a production build, with CPU throttling at 4x to match average user laptops.',
          'Find out when it freezes: on first load, on every keystroke in a filter, on scroll, or on hover. Each one points to a different cause.',
        ],
      },
      { type: 'heading3', text: '2. Collect evidence' },
      {
        type: 'bullets',
        items: [
          '**Performance panel**: record the interaction. Long tasks (red corners) split into **Scripting** (Angular templates, change detection, your code) and **Rendering/Layout** (style recalculation, layout of a huge DOM). "Forced reflow" warnings mean layout thrashing.',
          '**Angular DevTools profiler**: shows each change detection cycle, what triggered it and how long each component took. 10k `RowComponent`s checked on every mousemove is a common finding.',
          'Count DOM nodes in the Performance monitor: 10k rows x 8 cells with nested elements easily reaches hundreds of thousands of nodes.',
        ],
      },
      { type: 'heading3', text: '3. Likely causes, ranked' },
      {
        type: 'numbered',
        items: [
          'All rows are rendered at once, so the browser spends seconds on layout and paint.',
          'Template function calls or impure pipes (`{{ formatPrice(row) }}`, a filter pipe) run for every row on every change detection cycle.',
          'Default change detection with Zone.js: every click, scroll or timer checks all rows.',
          'Unstable tracking (`track $index` on a list that gets re-sorted, or a new array of new objects from the server each poll), so Angular destroys and recreates row views instead of reusing them.',
          'Sorting/filtering on the main thread on every keystroke without debounce.',
        ],
      },
      { type: 'heading3', text: '4. Fix' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-orders-table',
  imports: [ScrollingModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders-table.html',
})
export class OrdersTableComponent {
  orders = input.required<Order[]>();
  query = signal('');

  // Computed once per change of inputs, not once per row per check
  visible = computed(() => {
    const q = this.query().toLowerCase();
    return this.orders().filter((o) => o.customer.toLowerCase().includes(q));
  });
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<input (input)="query.set($any($event.target).value)" placeholder="Filter" />

<!-- Only the rows in view (+ a buffer) exist in the DOM -->
<cdk-virtual-scroll-viewport itemSize="48" class="viewport">
  <div *cdkVirtualFor="let o of visible(); trackBy: trackById" class="row">
    <span>{{ o.customer }}</span>
    <span>{{ o.total | currency }}</span>
  </div>
</cdk-virtual-scroll-viewport>

<!-- If you render a normal list (e.g. a paginated page), always track a stable key -->
@for (o of page(); track o.id) { <app-order-row [order]="o" /> }`,
      },
      {
        type: 'bullets',
        items: [
          'Virtual scroll (CDK) or **server-side pagination/infinite scroll**. Ask whether the user really needs 10k rows in the browser at all, since often a paginated, server-filtered API is the better product decision.',
          'Precompute display values (formatted dates, totals) when data arrives, or use pure pipes, never methods in the template.',
          'Make rows OnPush with immutable inputs or signals so only changed rows re-render. Debounce the filter input.',
          'Move very heavy sorting/aggregation to a Web Worker or the backend.',
          'Avoid reading layout (`offsetHeight`) inside loops that also write styles.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: rendering rows in batches with `setTimeout` chunks or adding `ChangeDetectorRef.detach()` everywhere. The page stops freezing at first, but the DOM still ends up with 10k rows and scrolling, filtering and memory stay bad. Reduce the number of DOM nodes and checks instead.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Make virtual scroll or pagination the default for any list that can grow without limit, and set a page size in the API contract.',
          'Lint against function calls in templates where practical, and require `track` with an id in code review.',
          'Track INP (Interaction to Next Paint) in RUM with the `web-vitals` library so slow interactions on large data sets are visible after release.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: separate "too much DOM" from "too much change detection". Saying "the profile showed 70% scripting in change detection, so OnPush and computed signals helped, then virtual scroll fixed the layout cost" shows you measured before fixing.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'What are the limitations of virtual scroll (variable row heights, Ctrl+F browser search, accessibility, printing)?',
          'Why is `track $index` risky when rows can be re-ordered?',
          'How would zoneless change detection change this picture?',
        ],
      },
    ],
  },

  'bug-only-in-production': {
    summary:
      'I start by collecting real evidence from production rather than guessing: the exact error and stack trace from Sentry or RUM with source maps, the affected browsers, users, release and time it started. Then I list what is different between local and production (build optimizations, environment config, real data, CDN/caching, CSP, auth, browser and network) and try to reproduce by running the production build locally against production-like config and data. Once reproduced, I bisect and fix, and add a test or monitor so it cannot come back silently.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'numbered',
        items: [
          'Scope it: all users or some? Specific browser, OS, locale, timezone, role, tenant, or data? Since which release? Error tracking tools group by these fields.',
          'Get a reliable trace. With Sentry (or similar) and uploaded source maps you see the original TypeScript line, plus breadcrumbs (clicks, navigations, HTTP calls) leading up to the error. Session replay, if enabled, shows what the user did.',
          'Run the **production build** locally: `ng build` then serve `dist/<app>/browser` with a static server, or `ng serve --configuration production`. Many "prod only" bugs reproduce immediately because dev mode was hiding them.',
          'Point the local build at staging or production APIs (read-only account) to get real data shapes and volumes.',
        ],
      },
      { type: 'heading3', text: '2. What differs between local and production' },
      {
        type: 'bullets',
        items: [
          '**Build**: minification and name mangling (code that relies on `constructor.name` or function names breaks), tree shaking drops a module that was only imported for side effects, dev-mode-only checks are gone, and `environment` file replacements change values.',
          '**Config**: different API URL, missing env variable, feature flags on in prod only, different auth provider settings.',
          '**Infrastructure**: CDN or service worker serving stale files, reverse proxy rewriting paths (deep links returning 404 without a fallback to `index.html`), CORS, Content Security Policy blocking inline scripts or a third-party domain.',
          '**Data**: real users have nulls, very long strings, special characters, thousands of items, or old records missing a field that newer code assumes.',
          '**Client environment**: older Safari, ad blockers or privacy extensions blocking analytics URLs, slow networks causing race conditions, different timezone and locale formats.',
        ],
      },
      { type: 'heading3', text: '3. Tools and evidence' },
      {
        type: 'code',
        lang: 'json',
        code: `// angular.json -> production configuration
"sourceMap": {
  "scripts": true,
  "styles": false,
  "hidden": true
}
// "hidden" generates maps without the sourceMappingURL comment.
// Upload them to Sentry in CI and do not deploy them publicly.`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// main.ts: report errors with the release so you can correlate with deploys
Sentry.init({
  dsn: environment.sentryDsn,
  release: environment.version,
  environment: 'production',
});

bootstrapApplication(AppComponent, {
  providers: [{ provide: ErrorHandler, useValue: Sentry.createErrorHandler() }],
});`,
      },
      {
        type: 'bullets',
        items: [
          'DevTools **Local Overrides** let you edit the production JS or response headers in your own browser to test a hypothesis without deploying.',
          'Network throttling and CPU throttling expose timing races that never appear on a fast dev machine.',
          'Compare request/response headers in the Network panel between local and production (cache headers, CSP, cookies with `SameSite`/`Secure`).',
          'If you know a working and a broken release, `git bisect` with a production build narrows it to one commit.',
        ],
      },
      { type: 'heading3', text: '4. Fix and verify' },
      {
        type: 'paragraph',
        text: 'Write a failing test that captures the cause (for example a unit test with the real data shape, or an e2e test against a production build), fix it, deploy behind a flag if risky, and watch the error rate for that issue drop in Sentry for the new release.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: adding `console.log` to production and redeploying again and again, or wrapping the failing code in a `try/catch` that hides the error. You lose the stack trace and the users still get broken behaviour. Get proper error reporting with source maps first.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Run e2e tests (Playwright/Cypress) against the production build in CI, not against `ng serve`.',
          'Keep a staging environment that mirrors production config, CDN and headers.',
          'Error tracking with releases and alerts on new error types or spikes after a deploy, plus RUM for performance.',
          'Validate API responses at the boundary (for example with a schema library) so unexpected data fails loudly with a clear message.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame your answer as "evidence first, then list the differences, then reproduce". A short real example helps, such as "a Safari-only date parsing bug that Sentry grouped by browser and that we reproduced with BrowserStack".',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Is it safe to publish source maps publicly? What are the alternatives?',
          'How do you debug an issue that only one customer reports?',
          'How do feature flags help you investigate and mitigate production bugs?',
        ],
      },
    ],
  },

  'blank-page-or-chunkloaderror-after-deploy': {
    summary:
      'Angular builds produce hashed file names, so every deploy creates new chunk files and, if old ones are deleted, users who still run the previous version (an open tab, or a cached `index.html`) try to lazy load a chunk that no longer exists. That fails as a `ChunkLoadError` or "Failed to fetch dynamically imported module", and if the main bundle itself fails, the page stays blank. I confirm it with the Network panel (404 or HTML returned for a `.js` file), then fix the deploy: keep old assets for a while, set correct cache headers, handle service worker updates, and add a reload fallback.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'numbered',
        items: [
          'Check that error spikes in Sentry line up with deploy times and come from users whose session started before the deploy.',
          'Reproduce: open the app, deploy a new version, then navigate to a lazy route in the old tab. The Network panel shows the request for `chunk-ABC123.js` returning 404, or 200 with `text/html` because the server falls back to `index.html` for unknown paths, giving a MIME type or syntax error.',
          'For blank pages on first load, check whether `index.html` was served from a cache (CDN, browser, service worker) and references a `main-*.js` that is already gone.',
        ],
      },
      { type: 'heading3', text: '2. Causes' },
      {
        type: 'bullets',
        items: [
          'Deploy replaces the whole folder, deleting the previous hashed files while old clients still reference them.',
          '`index.html` cached by the CDN or browser for a long time, so new visitors get the old HTML pointing to deleted files.',
          'The SPA fallback rewrites missing `.js` requests to `index.html`, which hides the 404 and turns it into a confusing parse error.',
          'With `@angular/service-worker`, the cached version references files that were removed from the server and the worker cannot recover, which it reports through `SwUpdate.unrecoverable`.',
        ],
      },
      { type: 'heading3', text: '3. Fixes' },
      {
        type: 'numbered',
        items: [
          '**Keep previous build assets** for some days (upload new files next to old ones in S3/CDN instead of deleting, and clean up old hashes later).',
          '**Cache headers**: `index.html` (and `ngsw.json` if used) with `Cache-Control: no-cache`, hashed assets with `Cache-Control: public, max-age=31536000, immutable`.',
          '**Do not fall back to `index.html` for asset requests**: only route navigation requests to it, so a missing chunk returns a real 404.',
          '**Handle service worker updates** and unrecoverable states.',
          '**Reload fallback** when a lazy chunk fails, guarded against loops.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Service worker: offer the new version, recover from broken caches
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private swUpdate = inject(SwUpdate);

  constructor() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUserToReload());

    this.swUpdate.unrecoverable.subscribe(() => document.location.reload());
  }

  private promptUserToReload() { /* show a "New version available" banner */ }
}

// Global fallback: a lazy chunk failed to load -> reload once
@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const msg = String((error as Error)?.message ?? error);
    const isChunkError = /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg);

    if (isChunkError && !sessionStorage.getItem('chunk-reload')) {
      sessionStorage.setItem('chunk-reload', '1');
      location.reload();
      return;
    }
    console.error(error);
  }
}`,
      },
      {
        type: 'paragraph',
        text: 'The `sessionStorage` flag stops an infinite reload loop if the chunk is genuinely missing. Clear it once the app has bootstrapped successfully. You can also handle the error at navigation level with the router `withNavigationErrorHandler` feature.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: disabling output hashing or setting `no-cache` on every file. Users then download everything again on each visit and can still mix old and new files during a deploy. The fix is immutable hashed assets plus a fresh `index.html` and keeping old files around.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Make the deploy pipeline upload assets first and switch `index.html` last, with old assets retained and cleaned up later.',
          'Add a smoke test after deploy that loads a lazy route from a tab opened before the deploy.',
          'Alert on a spike of chunk load errors per release in Sentry.',
          "Document the cache header rules in infrastructure as code (CDN behaviours), not in someone's head.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain the mechanism in one sentence ("an old `index.html` or runtime asks for a hashed file we already deleted") before listing fixes. It proves you understand why only some users are affected.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you tell users a new version is available without interrupting a form they are filling in?',
          'Why should `index.html` be `no-cache` rather than `no-store`?',
          'How does a blue-green or atomic deploy on a CDN help here?',
        ],
      },
    ],
  },

  'works-in-postman-cors-error-in-browser': {
    summary:
      'CORS is enforced by the browser, not the server, so Postman and curl never show it: the request may even reach the server, but the browser refuses to give the response to JavaScript unless the server sends the right headers. I open the Network panel, find the failing request and its preflight `OPTIONS` call, read the exact console message, and reproduce the preflight with curl. The fix is always on the server or proxy: correct allowed origin, methods, headers and credentials handling, or serve the API from the same origin.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'numbered',
        items: [
          "Read the console message. Chrome says exactly what is missing, for example \"No 'Access-Control-Allow-Origin' header is present\", \"Response to preflight request doesn't pass access control check\", or \"The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when the request's credentials mode is 'include'\".",
          'In the Network panel, check whether there is an `OPTIONS` preflight. Requests with an `Authorization` header, `Content-Type: application/json`, or methods like `PUT`/`DELETE` trigger one.',
          'Look at the preflight status and response headers. A 401, 404, 405 or redirect on `OPTIONS` fails the whole call.',
          'Ask why it worked locally. Usually `ng serve` used `proxy.conf.json`, so the browser only ever talked to the same origin and CORS never applied.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Simulate the browser's preflight from the command line
curl -i -X OPTIONS https://api.example.com/orders \\
  -H "Origin: https://app.example.com" \\
  -H "Access-Control-Request-Method: POST" \\
  -H "Access-Control-Request-Headers: authorization,content-type"

# You need to see something like:
# HTTP/2 204
# access-control-allow-origin: https://app.example.com
# access-control-allow-methods: GET,POST,PUT,DELETE
# access-control-allow-headers: authorization,content-type
# access-control-allow-credentials: true   (only if cookies are used)
# vary: Origin`,
      },
      { type: 'heading3', text: '2. Likely causes in production' },
      {
        type: 'bullets',
        items: [
          'The allowlist contains `http://localhost:4200` but not the production origin, or it has `https://example.com` but users are on `https://www.example.com`. Origins must match scheme, host and port exactly.',
          'The API gateway, load balancer or WAF does not forward `OPTIONS`, or the auth middleware runs before the CORS middleware and returns 401 to the preflight (which never carries credentials).',
          'Credentials: the frontend sends `withCredentials: true` (cookies), but the server replies with `Access-Control-Allow-Origin: *` or omits `Access-Control-Allow-Credentials: true`.',
          'Error responses have no CORS headers. A 500 or a 502 from the proxy then appears in the browser as a CORS error, hiding the real failure.',
          'A redirect (HTTP to HTTPS, trailing slash) on the preflight.',
          'A CDN caches a response for one origin without `Vary: Origin` and serves it to another.',
        ],
      },
      { type: 'heading3', text: '3. Fix on the server or proxy' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Express example: explicit allowlist, preflight handled before auth
import cors from 'cors';

const allowed = new Set(['https://app.example.com', 'https://www.example.com']);

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 600, // cache the preflight for 10 minutes
}));

app.use(authMiddleware); // after CORS, so OPTIONS is not rejected`,
      },
      {
        type: 'paragraph',
        text: 'Often the cleanest fix is to avoid cross-origin calls entirely: serve the API under the same origin (`https://app.example.com/api`) through a reverse proxy or CDN path rule. No CORS, no preflight latency, and simpler cookie handling.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Tempting wrong fixes: `mode: 'no-cors'` in fetch (you get an opaque response you cannot read), a browser extension that disables CORS, `Access-Control-Allow-Origin: *` with credentials (the browser rejects it), or reflecting any incoming `Origin` with credentials enabled, which lets any website make authenticated calls on behalf of your users.",
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Keep allowed origins in per-environment config, reviewed with each new domain.',
          'Add a post-deploy smoke test that runs the curl preflight against each environment.',
          'Make sure error handlers and the gateway add CORS headers to error responses too, so real errors are visible.',
          'Test the frontend in staging on its real domain, not only through the dev proxy.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: start with "CORS is a browser policy, so Postman proving the API works tells us nothing about CORS". Then walk through the preflight. That one sentence separates candidates who understand CORS from those who just add headers until it works.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'What is a "simple request" and why does it skip the preflight?',
          "Does CORS protect the server from attacks? (No, it protects users' data in the browser; it is not authentication and does not stop CSRF on its own.)",
          'How do `SameSite` cookies interact with cross-origin API calls?',
        ],
      },
    ],
  },

  'slow-first-load-lcp-and-bundle-size': {
    summary:
      'I measure with field data first (RUM via the `web-vitals` library or CrUX) to know how slow it is for real users, then use Lighthouse and the Performance panel to break LCP into its parts: server response time, resource load delay, load duration and render delay. For bundle size I run `ng build --stats-json` and inspect the output with the esbuild bundle analyzer or source-map-explorer. Fixes are usually lazy-loading routes and heavy widgets with `@defer`, prioritising the LCP image with `NgOptimizedImage`, removing large dependencies, and SSR or prerendering for content pages, protected by budgets in `angular.json`.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'bullets',
        items: [
          'Field data tells you the real p75 LCP per page and device class. Lab data (Lighthouse with mobile throttling) gives a reproducible profile to work on.',
          'Identify the **LCP element**: the Performance panel marks it, and it is often a hero image or a large heading that only appears after the app boots and an API call returns.',
          'Split LCP time: slow TTFB points to server/CDN, a big resource load delay means the image is discovered late, and a long render delay usually means JavaScript must download, parse and bootstrap before anything renders.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Send Core Web Vitals from real users to your analytics/RUM endpoint
import { onCLS, onINP, onLCP } from 'web-vitals';

function report(metric: { name: string; value: number; id: string }) {
  navigator.sendBeacon('/rum', JSON.stringify(metric));
}
onLCP(report);
onINP(report);
onCLS(report);`,
      },
      { type: 'heading3', text: '2. Inspect the bundle' },
      {
        type: 'code',
        lang: 'bash',
        code: `ng build --stats-json
# Upload dist/<app>/stats.json to https://esbuild.github.io/analyze/

# Or, with source maps enabled for the build:
npx source-map-explorer dist/<app>/browser/*.js`,
      },
      {
        type: 'paragraph',
        text: 'Look for large libraries in the **initial** chunk: a chart or editor library imported by the root component, a full `lodash` or `moment` with all locales, an icon set imported entirely, or a feature module accidentally imported eagerly through a shared barrel file.',
      },
      { type: 'heading3', text: '3. Fixes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Lazy routes and background preloading after first render
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent) },
  { path: 'reports', loadChildren: () => import('./reports/routes').then((m) => m.REPORT_ROUTES) },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))],
});`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- LCP image: priority sets fetchpriority=high, eager loading and a preload hint in SSR -->
<img ngSrc="/assets/hero.webp" width="1200" height="600" priority alt="Product dashboard" />

<!-- Heavy widget below the fold: its code is split out and loaded only when visible -->
@defer (on viewport) {
  <app-sales-chart [data]="sales()" />
} @placeholder {
  <div class="chart-skeleton"></div>
}`,
      },
      {
        type: 'bullets',
        items: [
          'Replace or trim heavy dependencies (native `Intl` instead of `moment`, per-function imports, smaller chart libraries).',
          'Use SSR or prerendering with hydration (`provideClientHydration()`) for public, content-heavy pages so the LCP element is in the HTML.',
          'Do not block the first render on several sequential API calls; show the shell and the hero immediately.',
          '`preconnect` to the API and image CDN origins, serve modern image formats at the right size, and use `font-display: swap` for web fonts.',
          'Audit third-party scripts (tag managers, chat widgets) and load them after the app is interactive.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: chasing a Lighthouse score of 100 on a fast desktop, or lazy-loading the hero image. Lazy-loading the LCP image makes LCP worse. Optimise what real users experience on mid-range mobile devices, and verify with field data after release.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'code',
        lang: 'json',
        code: `// angular.json -> configurations.production
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
]`,
      },
      {
        type: 'bullets',
        items: [
          'Budgets fail the CI build when the initial bundle grows past the limit.',
          'Run Lighthouse CI on key pages in pull requests and track LCP/INP/CLS from RUM per release.',
          'Review new dependencies for size before adding them.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give before and after numbers, for example "initial bundle 1.4 MB to 520 kB, p75 LCP 4.1 s to 2.3 s on mobile". Numbers show you measured, and naming the LCP sub-part you improved shows you understood the metric.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'What is the difference between lab and field data, and which one do you trust?',
          'When is SSR worth the extra complexity for an Angular app?',
          'How do `@defer` triggers (`on idle`, `on viewport`, `on interaction`) differ?',
        ],
      },
    ],
  },

  'view-doesn-t-update-after-data-changes': {
    summary:
      'Angular only re-renders a component when change detection runs for it and sees a new value, so I check two things: did Angular get notified, and is the binding actually reading the changed value. The common causes are mutating objects or arrays with OnPush, mutating a signal value in place, code running outside the Angular zone, manual subscriptions in OnPush components without marking for check, the component using a different service instance, and unstable `track` keys. I confirm with Angular DevTools before changing anything.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'numbered',
        items: [
          'Confirm the data really changed where the template reads it: inspect the component in Angular DevTools and look at its inputs, properties and signal values.',
          'If the property has the new value but the view is old, Angular was not notified or the component was skipped (OnPush). If the property has the old value, the data never reached this component.',
          'Use the Angular DevTools profiler to see whether a change detection cycle ran after the change and whether this component was checked.',
          'Check the console. An error thrown during rendering can stop the rest of the view from updating.',
        ],
      },
      { type: 'heading3', text: '2. Likely causes and fixes' },
      {
        type: 'paragraph',
        text: '**Mutation with OnPush.** An OnPush component re-renders when an input reference changes, an event fires in its template, the `async` pipe emits, or a signal it reads changes. Pushing into an existing array keeps the same reference.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Parent
this.items.push(newItem);               // same reference, OnPush child is skipped
this.items = [...this.items, newItem];  // new reference, child updates

// Signals: same rule, update immutably
items = signal<Item[]>([]);
this.items().push(newItem);                         // no notification
this.items.update((list) => [...list, newItem]);    // notifies all readers`,
      },
      {
        type: 'paragraph',
        text: '**Manual subscribe in an OnPush component.** Assigning a field inside `subscribe` does not mark the component dirty. Prefer `toSignal` or the `async` pipe, which both handle notification and cleanup.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Before: view stays stale under OnPush
this.api.getUser().subscribe((u) => (this.user = u));

// After
user = toSignal(inject(UserApi).getUser());
// template: {{ user()?.name }}`,
      },
      {
        type: 'paragraph',
        text: '**Code running outside the zone (zone-based apps).** Callbacks from some third-party SDKs, WebSocket libraries, or code started in `ngZone.runOutsideAngular()` do not trigger change detection. Writing the result into a signal fixes it, because signals schedule a refresh of the views that read them. Wrapping the callback in `ngZone.run()` also works.',
      },
      {
        type: 'bullets',
        items: [
          "**Different service instance**: the service is listed in a component's `providers`, so the component that updates it and the one that displays it have separate instances. Check with Angular DevTools injector tree.",
          '**Copied instead of derived**: the component copied an input in `ngOnInit` (`this.total = this.order.total`) and never updates it when the input changes. Use `computed(() => this.order().total)` with signal inputs.',
          '**Unstable or duplicate `track` keys**: `@for` reuses views by key. Tracking by a non-unique field makes Angular reuse the wrong views, and tracking `$index` on a re-ordered list shows content in the wrong rows. Track a stable unique id.',
          '**Nested object mutated for an OnPush child**: the parent passes `order` and changes `order.status`; the child input reference is unchanged.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: calling `cdRef.detectChanges()` or switching the component back to Default change detection. It hides the real problem (mutation or a missing notification) and costs performance. Make the data flow immutable or signal-based so Angular knows when something changed.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'Make OnPush the default for new components (a schematic default or lint rule such as `@angular-eslint/prefer-on-push-component-change-detection`).',
          'Use signals and `computed` for component state, with immutable updates via `update`/`set`. Moving towards zoneless change detection forces this discipline.',
          'Write component tests that change data and assert on the rendered DOM, not on the class properties.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: structure the answer as two questions: "Was Angular notified?" and "Does the binding see a new value?". Then map each cause to one of them. It sounds systematic and covers zone, OnPush and signals in one model.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'What exactly marks an OnPush component for check?',
          'How does change detection work in a zoneless application?',
          'When would you use `runOutsideAngular` deliberately?',
        ],
      },
    ],
  },

  'button-sometimes-does-nothing': {
    summary:
      '"Sometimes" means timing or state, so I first gather context: which button, which browser and device, what the user did before, and whether a request was sent at all. Session replay, Sentry breadcrumbs and network logs usually show whether the click reached the handler. Then I check the usual suspects in order: the button was disabled by stale state, an overlay intercepted the click, an `exhaustMap` or guard ignored it, or an earlier error killed the observable chain or was swallowed. The fix is explicit loading/disabled state, correct error handling, and a proper double-submit guard.',
    details: [
      { type: 'heading3', text: '1. Reproduce and narrow down' },
      {
        type: 'numbered',
        items: [
          'Collect context: browser, device (touch vs mouse), network speed, and the steps before the click. Session replay or Sentry breadcrumbs ("ui.click" followed by no XHR) are very valuable here.',
          'Decide which of three cases it is: the click never reached the element, the handler ran but returned early, or the request was sent but the UI did not show the result.',
          'Reproduce with network throttling (Slow 3G), CPU throttling, and fast double clicks. Also try clicking right after the page loads or right after a previous action.',
        ],
      },
      { type: 'heading3', text: '2. Tools and evidence' },
      {
        type: 'bullets',
        items: [
          'In the console, run `document.elementFromPoint(x, y)` at the button position, or use the Elements panel to inspect what is on top. A transparent overlay, a toast container, or a closing dialog backdrop often sits above the button.',
          'Event Listener Breakpoints (Mouse > click) in the Sources panel show whether any click handler runs at all.',
          'Network panel with "Preserve log" shows whether a request left the browser and what came back.',
          'Angular DevTools shows the current `saving`/`disabled` state of the component at the moment it fails.',
        ],
      },
      { type: 'heading3', text: '3. Likely causes, ranked' },
      {
        type: 'numbered',
        items: [
          '**Disabled-state race**: `saving` is set to `true` but never reset when the request fails, so the button looks enabled briefly or stays disabled until refresh.',
          '**Errors swallowed or killing the stream**: a `Subject` of clicks piped through `switchMap` without inner `catchError`; after one failed request the whole stream errors and later clicks do nothing. Or `subscribe()` with no error handler, so the failure is invisible.',
          '**`exhaustMap` by design**: clicks are ignored while the previous request is in flight; on a slow network that feels like "nothing happens" without a loading indicator.',
          '**Overlays or `pointer-events`** intercepting the click, or a layout shift moving the button between mousedown and mouseup (for example a validation message appearing on blur).',
          '**Form semantics**: a `<button>` inside a `<form>` defaults to `type="submit"`, or the form is invalid and the submit handler returns early without showing errors.',
        ],
      },
      { type: 'heading3', text: '4. Fix' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.html',
})
export class CheckoutComponent {
  private api = inject(OrderApi);
  private toast = inject(ToastService);

  saving = signal(false);
  private submit$ = new Subject<OrderDraft>();

  constructor() {
    this.submit$
      .pipe(
        // ignore extra clicks while one request is in flight (double-submit guard)
        exhaustMap((draft) => {
          this.saving.set(true);
          return this.api.placeOrder(draft).pipe(
            // handle errors INSIDE so the outer stream survives
            catchError((err) => {
              this.toast.error('Could not place the order. Please try again.');
              reportError(err);
              return EMPTY;
            }),
            finalize(() => this.saving.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((order) => this.toast.success('Order ' + order.id + ' placed'));
  }

  submit(draft: OrderDraft) { this.submit$.next(draft); }
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<button type="button" (click)="submit(form.value)" [disabled]="saving()" [attr.aria-busy]="saving()">
  @if (saving()) { Placing order... } @else { Place order }
</button>`,
      },
      {
        type: 'paragraph',
        text: 'Visible loading state turns "nothing happens" into "it is working". For payments and other critical writes, also send an idempotency key so a retried or duplicated request cannot create two orders on the backend.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Tempting wrong fix: adding a `setTimeout` or a debounce on the click "to make it more reliable", or removing `[disabled]` entirely. Debounce delays every click and does not fix a dead stream or an overlay, and removing the guard brings back double submissions.',
      },
      { type: 'heading3', text: 'Prevent it next time' },
      {
        type: 'bullets',
        items: [
          'A shared pattern (or small helper) for submit actions: loading signal, inner `catchError`, `finalize`, user-visible error.',
          'Global `ErrorHandler` and HTTP interceptor that report to Sentry, so swallowed errors become visible.',
          'E2E tests that click while the API is slow or returns 500, then click again and assert it works.',
          'Lint rule against empty `catchError(() => EMPTY)` without reporting, and review overlay z-index and `pointer-events` in shared layout components.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention that an error inside `switchMap` without an inner `catchError` terminates the outer stream. It is a very common real cause of "works once, then never again", and interviewers recognise it as hands-on RxJS experience.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'When would you choose `exhaustMap`, `concatMap` or `switchMap` for a button action?',
          'How do you make the backend safe against duplicate submissions?',
          'How would you track this with RUM if you cannot reproduce it at all?',
        ],
      },
    ],
  },
};
