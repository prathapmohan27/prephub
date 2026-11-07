import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'approaching-frontend-system-design': {
    summary:
      'I use a repeatable structure so I never jump straight into code: clarify Requirements, sketch the component Architecture, define the Data model and client state, agree the Interface/API contract with the server, then spend the remaining time on Optimizations — performance, accessibility, offline, i18n and edge cases. I time-box each step, state my assumptions out loud, and keep checking with the interviewer which area they want me to go deep on.',
    details: [
      {
        type: 'paragraph',
        text: 'Frontend system design is not backend system design with a UI bolted on. The interviewer wants to see how you split a UI into components, where state lives, what the client needs from the API, and how you keep it fast, accessible and resilient on real devices and networks. A simple mnemonic many candidates use is RADIO — Requirements, Architecture, Data model, Interface, Optimizations. It is a community convention, not an official standard; the value is that it keeps you from forgetting a whole dimension.',
      },
      { type: 'heading3', text: 'The framework and a time budget (45–60 min)' },
      {
        type: 'numbered',
        items: [
          '**Requirements (5–8 min)** — functional: core user flows, what is in/out of scope. Non-functional: target devices and network (mobile on 3G?), performance budget (LCP, INP), accessibility level (WCAG AA), offline needs, i18n/RTL, SEO (SSR needed?), security/auth, scale (items per list, updates per second).',
          '**Architecture (8–10 min)** — draw the component tree, the services/stores, and the boundary to the server (REST, GraphQL, WebSocket, SSE). Say which parts are smart (container) vs presentational.',
          '**Data model (5–8 min)** — client-side entities, normalized vs nested, what is server cache vs UI state vs URL state vs form state.',
          '**Interface / API (5–8 min)** — TypeScript shapes of requests/responses, pagination style (cursor vs offset), error format, real-time events, component public APIs (inputs/outputs).',
          '**Optimizations & deep dives (15–20 min)** — performance (lazy loading, `@defer`, virtualization, caching, images), accessibility, offline, error/empty/loading states, observability, testing, and how you would scale or extend.',
          '**Wrap-up (2–3 min)** — summarize decisions and trade-offs, and name what you would do next with more time.',
        ],
      },
      {
        type: 'flow',
        title: 'A reusable frontend design skeleton',
        code: `flowchart LR
  U["User / device"]:::client --> SH["App shell<br/>routing, layout, auth"]:::client
  SH --> FC["Feature container<br/>smart component"]:::highlight
  FC --> PC["Presentational components<br/>inputs / outputs"]:::client
  FC --> ST["Store / service<br/>signals, server cache"]:::cache
  ST --> API["API client<br/>HttpClient, interceptors"]:::network
  API --> BE["Backend: REST / GraphQL / WS"]:::server
  ST -.-> LS[("IndexedDB / storage")]:::db`,
      },
      { type: 'heading3', text: 'Make the data contract concrete early' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Writing interfaces on the whiteboard forces precise decisions
interface Page<T> {
  items: T[];
  nextCursor: string | null;   // cursor pagination: stable under inserts
}

interface ApiError {
  code: 'VALIDATION' | 'NOT_FOUND' | 'RATE_LIMITED' | 'INTERNAL';
  message: string;
  fieldErrors?: Record<string, string>;
}

// Classify state before choosing a tool
// server cache  → resource()/httpResource() or a store with TTL
// UI state      → component signals (open/closed, selection)
// URL state     → router query params (filters, page, tab) — shareable
// form state    → Reactive Forms / Signal Forms`,
      },
      { type: 'heading3', text: 'Angular-specific talking points worth dropping in' },
      {
        type: 'bullets',
        items: [
          'Standalone components + lazy routes (`loadComponent`/`loadChildren`) for code splitting per feature.',
          '`@defer (on viewport)` for below-the-fold or heavy widgets; `@for` with `track` for stable list rendering.',
          'Signals for local and derived state (`signal`, `computed`, `linkedSignal`); RxJS where time matters (debounce, cancel, streams).',
          '`OnPush` / zoneless-friendly components so updates are targeted.',
          'SSR + hydration when SEO or first paint on slow devices matters.',
        ],
      },
      {
        type: 'bullets',
        items: [
          'Talk while you draw and state assumptions: "I assume 10k items, so I will virtualize."',
          'Prefer breadth first, then ask: "Would you like me to go deeper into caching or accessibility?"',
          'Always cover loading, empty, error and slow-network states — they are where real UIs fail.',
          'Close every decision with its trade-off (complexity, bundle size, consistency, team cost).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common failure modes: spending 20 minutes on requirements, designing the backend database instead of the client, writing detailed code too early, or never mentioning accessibility and performance.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say your plan in the first minute — "I will clarify requirements, sketch the components and data flow, define the API shapes, then go deep on performance and accessibility" — and glance at the clock at each transition. Interviewers reward a candidate who drives the conversation.',
      },
    ],
  },

  'design-an-autocomplete-component': {
    summary:
      'I build it as a reusable combobox: an input that emits debounced queries, a data source that fetches suggestions with cancellation of stale requests, an in-memory cache keyed by query, and an accessible listbox popup following the ARIA combobox pattern with full keyboard support. The key concerns are request efficiency (debounce, distinct, switchMap, caching), race conditions, and accessibility — not just the dropdown styling.',
    details: [
      { type: 'heading3', text: '1. Requirements' },
      {
        type: 'bullets',
        items: [
          '**Functional**: suggestions as the user types, keyboard and mouse selection, highlight the matched text, recent searches when empty, custom item templates, works for different data sources (users, products, cities).',
          '**Non-functional**: feels instant (<100ms perceived), minimal requests, no out-of-order results, works on mobile/touch, WCAG accessible, i18n (IME composition for CJK input, RTL), handles offline/errors gracefully.',
          '**Clarify**: min characters to search? Client-side filtering of a small list or server search? Max results (e.g. 10)?',
        ],
      },
      {
        type: 'flow',
        title: 'Autocomplete architecture',
        code: `flowchart LR
  IN["Input<br/>role=combobox"]:::client -->|"keystrokes"| Q["Query stream<br/>debounce, distinct"]:::highlight
  Q --> C{"In cache?"}:::cache
  C -->|"hit"| R["Results signal"]:::client
  C -->|"miss"| DS["Data source<br/>switchMap cancels stale"]:::network
  DS --> API["GET /search?q="]:::server
  API --> DS
  DS --> R
  R --> LB["Listbox popup<br/>role=listbox"]:::client
  LB -->|"select"| OUT["selected output"]:::client`,
      },
      { type: 'heading3', text: '2–3. Components and API contract' },
      {
        type: 'paragraph',
        text: 'Split it into `AutocompleteComponent` (owns input, popup, keyboard and ARIA state), an injectable `SuggestionSource` abstraction so each feature plugs in its own fetcher, and an optional `ng-template` for item rendering. The parent passes the source and receives a `selected` output.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// GET /api/search/suggest?q=lon&limit=10
interface SuggestResponse {
  query: string;            // echo — lets the client drop mismatched responses
  items: Suggestion[];
}
interface Suggestion {
  id: string;
  label: string;            // "London"
  secondary?: string;       // "United Kingdom"
  highlight?: [number, number][]; // match ranges computed by the server
}

export abstract class SuggestionSource {
  abstract search(q: string): Observable<Suggestion[]>;
}`,
      },
      { type: 'heading3', text: '4–5. Data flow in Angular' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <input role="combobox" aria-autocomplete="list"
      [attr.aria-expanded]="open()" [attr.aria-controls]="listId"
      [attr.aria-activedescendant]="activeId()"
      (input)="query.set($any($event.target).value)" (keydown)="onKey($event)" />
    @if (open()) {
      <ul role="listbox" [id]="listId">
        @for (s of results(); track s.id; let i = $index) {
          <li role="option" [id]="listId + '-' + i" [attr.aria-selected]="i === active()"
              (mousedown)="pick(s)">{{ s.label }}</li>
        } @empty { <li role="option" aria-disabled="true">No results</li> }
      </ul>
    }
    <span class="sr-only" aria-live="polite">{{ results().length }} suggestions</span>
  \`,
})
export class AutocompleteComponent {
  source = input.required<SuggestionSource>();
  selected = output<Suggestion>();
  listId = \`ac-\${crypto.randomUUID()}\`;

  query = signal('');
  active = signal(-1);
  private cache = new Map<string, Suggestion[]>();

  results = toSignal(
    toObservable(this.query).pipe(
      map(q => q.trim().toLowerCase()),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => q.length < 2 ? of([])
        : this.cache.has(q) ? of(this.cache.get(q)!)
        : this.source().search(q).pipe(
            tap(r => this.cache.set(q, r)),
            catchError(() => of([])))),     // keep the stream alive on errors
    ),
    { initialValue: [] },
  );
  open = computed(() => this.results().length > 0 || this.query().length >= 2);
  activeId = computed(() => this.active() >= 0 ? \`\${this.listId}-\${this.active()}\` : null);
  // onKey: ArrowDown/ArrowUp move active(), Enter picks, Escape closes
}`,
      },
      { type: 'heading3', text: '6. Performance' },
      {
        type: 'bullets',
        items: [
          '`debounceTime` + `distinctUntilChanged` cut requests; `switchMap` cancels in-flight HTTP for stale queries, so results never arrive out of order.',
          'Cache by normalized query with a size cap (LRU) and TTL; optionally prefix-filter cached results for longer queries.',
          'Small static lists (<1–2k items): load once and filter client-side; huge lists: server search, and virtualize the popup if it can grow.',
          'Server side: return only what the row needs, set `Cache-Control` for popular queries.',
        ],
      },
      { type: 'heading3', text: '7. Accessibility (ARIA combobox pattern)' },
      {
        type: 'bullets',
        items: [
          'Input has `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`; popup is `role="listbox"` with `role="option"` children.',
          'Focus stays in the input; the highlighted option is conveyed with `aria-activedescendant` and `aria-selected`.',
          'Keys: Down/Up move, Enter selects, Escape closes (and clears on second press), Tab leaves without hijacking.',
          'A polite live region announces result counts; use `mousedown` (not `click`) on options so blur does not close the list first.',
        ],
      },
      { type: 'heading3', text: '8. Edge cases and trade-offs' },
      {
        type: 'bullets',
        items: [
          'IME composition: ignore input until `compositionend` for Japanese/Chinese keyboards.',
          'Rate limiting (429) → back off and show cached results; offline → recent searches only.',
          'Debounce value is a trade-off: lower feels snappier but costs more requests — 150–300ms is typical.',
          'Extension: grouped results (people / files), "search all" footer, analytics on selected rank.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the three things interviewers listen for are switchMap for race conditions, caching/debouncing for request volume, and the ARIA combobox pattern with aria-activedescendant. Mention all three explicitly even if time is short.',
      },
    ],
  },

  'design-an-infinite-scrolling-feed': {
    summary:
      'A feed is a paginated, append-only list: I fetch pages with cursor-based pagination, trigger the next page with an IntersectionObserver sentinel near the bottom, store posts in a normalized client cache, and render with virtualization once the list gets long. I add optimistic interactions (like, comment), a "new posts" banner instead of jumping content, and make sure keyboard and screen-reader users can still reach the footer and navigate posts.',
    details: [
      { type: 'heading3', text: '1. Requirements' },
      {
        type: 'bullets',
        items: [
          '**Functional**: load posts as you scroll, post types (text, image, video, link preview), like/comment/share, new posts available notice, restore scroll position on back navigation.',
          '**Non-functional**: smooth 60fps scrolling on mid-range phones, fast first paint (SSR or skeletons), low memory with thousands of posts, works on flaky networks, accessible, image-heavy so bandwidth matters.',
        ],
      },
      {
        type: 'flow',
        title: 'Feed architecture',
        code: `flowchart TD
  FP["FeedPage container"]:::highlight --> VL["Virtualized list"]:::client
  VL --> PC["PostCard x N<br/>@defer media"]:::client
  VL --> SN["Sentinel<br/>IntersectionObserver"]:::client
  SN -->|"near bottom"| FS["FeedStore<br/>signals"]:::cache
  PC -->|"like"| FS
  FS -->|"GET /feed?cursor="| API["Feed API"]:::server
  FS -->|"POST /posts/:id/like"| API
  RT["SSE: new post ids"]:::network --> FS
  API --> CDN["Image CDN"]:::external`,
      },
      { type: 'heading3', text: '3. Data model and API' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// GET /api/feed?cursor=abc&limit=20
interface FeedPage {
  posts: Post[];
  nextCursor: string | null;   // null → end of feed
}
interface Post {
  id: string;
  author: { id: string; name: string; avatarUrl: string };
  createdAt: string;           // ISO
  body: string;
  media?: { type: 'image' | 'video'; url: string; width: number; height: number; alt: string }[];
  likeCount: number;
  likedByMe: boolean;
}`,
      },
      {
        type: 'paragraph',
        text: 'Cursor pagination beats offset: when new posts are inserted at the top, `?page=3` would shift and show duplicates, while an opaque cursor ("posts older than X") stays stable. Media includes width/height so the client can reserve space and avoid layout shift.',
      },
      { type: 'heading3', text: '4–5. State and implementation' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class FeedStore {
  private http = inject(HttpClient);
  private byId = signal<Record<string, Post>>({});   // normalized
  private order = signal<string[]>([]);
  private cursor = signal<string | null | undefined>(undefined); // null → end of feed
  readonly loading = signal(false);
  readonly posts = computed(() => this.order().map(id => this.byId()[id]));
  readonly done = computed(() => this.cursor() === null && !this.loading());

  loadMore() {
    const cursor = this.cursor();
    if (this.loading() || cursor === null) return;  // guard double triggers
    this.loading.set(true);
    const params: Record<string, string> = cursor ? { cursor } : {};
    this.http.get<FeedPage>('/api/feed', { params }).subscribe({
      next: page => {
        const fresh = page.posts.filter(p => !(p.id in this.byId()));   // dedupe across pages
        this.byId.update(m => ({ ...m, ...Object.fromEntries(page.posts.map(p => [p.id, p])) }));
        this.order.update(ids => [...ids, ...fresh.map(p => p.id)]);
        this.cursor.set(page.nextCursor);
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),           // show retry button
    });
  }

  toggleLike(id: string) {                           // optimistic update
    const prev = this.byId()[id];
    const next = { ...prev, likedByMe: !prev.likedByMe,
                   likeCount: prev.likeCount + (prev.likedByMe ? -1 : 1) };
    this.byId.update(m => ({ ...m, [id]: next }));
    this.http.post(\`/api/posts/\${id}/like\`, { liked: next.likedByMe })
      .subscribe({ error: () => this.byId.update(m => ({ ...m, [id]: prev })) });
  }
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<section aria-label="News feed" role="feed" [attr.aria-busy]="store.loading()">
  @for (post of store.posts(); track post.id; let i = $index) {
    <app-post-card [post]="post" [attr.aria-posinset]="i + 1" aria-setsize="-1"
                   (like)="store.toggleLike(post.id)" />
  }
  @if (!store.done()) { <div appSentinel (visible)="store.loadMore()"></div> }
  @else { <p>You're all caught up.</p> }
</section>`,
      },
      { type: 'heading3', text: '6. Performance' },
      {
        type: 'bullets',
        items: [
          'Prefetch the next page when the sentinel is ~1 viewport away (IntersectionObserver `rootMargin`), not at the very bottom.',
          'Virtualize after a few hundred posts (e.g. CDK virtual scrolling with `cdk-virtual-scroll-viewport`); variable-height posts make this harder, so alternatively unmount far-off posts and keep placeholders of measured height.',
          'Images: `NgOptimizedImage` with width/height, `loading="lazy"`, responsive `srcset` from the CDN; `@defer (on viewport)` for video players and comment widgets.',
          'Batch "new posts" from the real-time channel into a banner; inserting at the top while the user reads causes jank and lost position.',
        ],
      },
      { type: 'heading3', text: '7. Accessibility' },
      {
        type: 'bullets',
        items: [
          '`role="feed"` with `article` children, `aria-posinset`/`aria-setsize` (-1 when unknown), and `aria-busy` while loading.',
          'Infinite scroll can trap the footer — provide a "Load more" button fallback or place footer links elsewhere.',
          'Keyboard shortcuts (J/K) to move between posts; focus must not jump when new content loads.',
          'Respect `prefers-reduced-motion` for autoplay video and animations.',
        ],
      },
      { type: 'heading3', text: '8. Edge cases and scaling' },
      {
        type: 'bullets',
        items: [
          'Duplicates across pages (dedupe by id), deleted posts (tombstones), failed page loads (inline retry), end of feed.',
          "Scroll restoration on back navigation: keep the store alive at root and use the router's scroll restoration or save the anchor post id.",
          'Memory cap: drop pages far above the viewport and refetch if the user scrolls back.',
          'Trade-off: virtualization improves memory/DOM size but complicates find-in-page, anchors and variable heights.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explicitly justify cursor over offset pagination, mention IntersectionObserver instead of scroll listeners, and bring up the "new posts" banner — it shows you think about the user losing their place, which is the classic feed UX bug.',
      },
    ],
  },

  'design-a-shared-component-library': {
    summary:
      'I separate the design system into layers: design tokens (colors, spacing, typography as CSS custom properties), unstyled or lightly styled accessible primitives, and composed components with a small, stable public API. It ships as a versioned library (or a workspace library in a monorepo) with Storybook-style docs, visual and a11y tests, semantic versioning and a deprecation policy — so apps can theme it and upgrade safely without forking.',
    details: [
      { type: 'heading3', text: '1. Requirements' },
      {
        type: 'bullets',
        items: [
          '**Consumers**: how many apps, same Angular version or not, same repo or separate repos? Do non-Angular apps need the tokens too?',
          '**Functional**: core set (button, input, select, dialog, tabs, table, toast), theming (brands, dark mode), density, RTL, i18n of built-in strings.',
          '**Non-functional**: WCAG AA built in, tree-shakable (apps pay only for what they import), stable APIs, documented, versioned, fast to adopt.',
        ],
      },
      {
        type: 'flow',
        title: 'Design system layers and consumers',
        code: `flowchart TD
  FIG["Design tool<br/>source of truth"]:::external --> TK["Design tokens<br/>JSON to CSS vars"]:::highlight
  TK --> PR["Primitives<br/>a11y behaviour, focus, overlay"]:::client
  PR --> CMP["Components<br/>button, dialog, table"]:::client
  CMP --> DOC["Docs and playground<br/>visual + a11y tests"]:::server
  CMP --> PKG["Versioned package<br/>semver, changelog"]:::queue
  PKG --> A1["App A"]:::client
  PKG --> A2["App B"]:::client
  TK --> NA["Non-Angular apps<br/>tokens only"]:::external`,
      },
      { type: 'heading3', text: '2. Tokens and theming' },
      {
        type: 'code',
        lang: 'scss',
        code: `/* tokens.css — generated from a tokens JSON file */
:root {
  --ds-color-primary: #0e7490;
  --ds-color-on-primary: #ffffff;
  --ds-space-2: 0.5rem;
  --ds-radius-md: 6px;
  --ds-font-body: 'Inter', system-ui, sans-serif;
}
[data-theme='dark'] {
  --ds-color-primary: #22d3ee;
  --ds-color-on-primary: #082f49;
}
/* components only read semantic tokens, never raw hex values */`,
      },
      { type: 'heading3', text: '3. Component API design' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'button[dsButton], a[dsButton]',   // extend native elements → free a11y
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ds-button',
    '[attr.data-variant]': 'variant()',      // styled via .ds-button[data-variant=danger]
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
  },
  template: \`
    @if (loading()) { <span class="ds-spinner" aria-hidden="true"></span> }
    <ng-content />
  \`,
})
export class DsButton {
  variant = input<ButtonVariant>('primary');
  loading = input(false, { transform: booleanAttribute });
}

// Usage: <button dsButton variant="danger" (click)="delete()">Delete</button>`,
      },
      {
        type: 'bullets',
        items: [
          'Prefer attribute selectors on native elements (`button[dsButton]`) over wrapping — keeps native semantics, forms, and events.',
          'Small surface: signal `input()`/`output()`/`model()` with union types; content projection and `ng-template` slots for flexibility instead of dozens of config inputs.',
          'Form controls implement `ControlValueAccessor` so they work with Reactive Forms (and evaluate Signal Forms support as it matures).',
          'Secondary entry points per component (`@acme/ds/button`) so imports are tree-shakable and the build stays fast.',
        ],
      },
      { type: 'heading3', text: '4. Distribution and versioning' },
      {
        type: 'bullets',
        items: [
          '**Same monorepo**: consume as a workspace library — every app always uses the latest, breaking changes are fixed in the same PR.',
          '**Many repos**: publish to a private npm registry with semver; changelog generated from conventional commits; deprecate for at least one major before removal; ship codemods/schematics for migrations where possible.',
          'Pin a supported Angular version range in `peerDependencies` and upgrade the library first in each Angular major.',
        ],
      },
      { type: 'heading3', text: '6–7. Quality, performance and accessibility' },
      {
        type: 'bullets',
        items: [
          "Every component has docs with live examples, do/don't guidance, and an a11y section (keyboard map, ARIA used).",
          'Automated tests: unit tests, visual regression snapshots, and axe-based a11y checks in CI.',
          'Reuse proven behaviour (CDK overlay, focus trap, a11y utilities, virtual scrolling) instead of hand-rolling it.',
          'No global CSS leaks: component styles are encapsulated; only tokens and an optional reset are global.',
        ],
      },
      { type: 'heading3', text: '8. Trade-offs and governance' },
      {
        type: 'bullets',
        items: [
          'Flexible vs consistent: too rigid and teams fork it; too flexible and the UI drifts. Expose slots and tokens, not arbitrary style inputs.',
          'A small core team owns it, with a contribution model (RFC → review → release) so product teams can add components.',
          'Track adoption (which apps use which version) and measure success by fewer custom components and faster feature delivery.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: talk about the library as a product — tokens, accessible primitives, stable API, docs, versioning and governance. Showing a `button[dsButton]` attribute selector and explaining why it preserves native semantics is a strong, concrete detail.',
      },
    ],
  },

  'design-a-real-time-dashboard': {
    summary:
      'I load an initial snapshot over HTTP, then subscribe to a push channel (WebSocket for bidirectional or SSE for server-to-client) through a single connection service with reconnect and backoff. Incoming events are buffered and applied to signal-based stores in batches so the UI updates at a sane rate, widgets are lazy and independent, and changes are announced accessibly without flooding screen readers.',
    details: [
      { type: 'heading3', text: '1. Requirements' },
      {
        type: 'bullets',
        items: [
          '**Functional**: widgets (KPIs, charts, tables, alerts), filters/time range, user-configurable layout, drill-down, connection status indicator.',
          '**Non-functional**: update frequency (1/sec? 100/sec?), acceptable staleness, number of widgets and data points, runs all day on a wall screen (no memory leaks), multiple tabs, works behind corporate proxies, accessible.',
          '**Clarify**: is ordering important? Can we drop intermediate values (latest-wins) or must we show every event?',
        ],
      },
      {
        type: 'flow',
        title: 'Live dashboard data flow',
        code: `flowchart LR
  API["REST snapshot<br/>GET /metrics"]:::server --> ST["Metric store<br/>signals"]:::cache
  WS["WebSocket / SSE<br/>delta events"]:::network --> RC["Realtime service<br/>reconnect, backoff"]:::highlight
  RC -->|"bufferTime / throttle"| ST
  ST --> W1["KPI widget"]:::client
  ST --> W2["Chart widget<br/>@defer on viewport"]:::client
  ST --> W3["Alerts table"]:::client
  W3 --> LR["aria-live region"]:::security
  RC --> CS["Connection status badge"]:::client`,
      },
      { type: 'heading3', text: '2–3. Transport and API contract' },
      {
        type: 'bullets',
        items: [
          '**SSE** (`EventSource`): simple, one-way, auto-reconnects, works over HTTP/2 — great for dashboards.',
          '**WebSocket**: bidirectional (subscribe/unsubscribe to topics, acknowledgements), needs manual reconnect and heartbeats.',
          '**Polling**: fine for minute-level freshness, easiest to cache and scale.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Snapshot: GET /api/metrics?range=1h
interface MetricsSnapshot {
  asOf: string;               // server timestamp
  seq: number;                // last sequence included in the snapshot
  metrics: Record<string, MetricPoint[]>;
}
interface MetricPoint { t: number; value: number }

// Push events (WS or SSE)
type DashboardEvent =
  | { type: 'metric'; seq: number; key: string; point: MetricPoint }
  | { type: 'alert'; seq: number; id: string; severity: 'info' | 'warn' | 'critical'; text: string }
  | { type: 'heartbeat'; seq: number };`,
      },
      {
        type: 'paragraph',
        text: 'The `seq` number lets the client discard events already included in the snapshot and detect gaps after a reconnect — on a gap, refetch the snapshot instead of trusting partial deltas.',
      },
      { type: 'heading3', text: '4–5. Realtime service and store' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class RealtimeService {
  readonly status = signal<'connecting' | 'live' | 'offline'>('connecting');

  events(): Observable<DashboardEvent> {
    return new Observable<DashboardEvent>(sub => {
      const es = new EventSource('/api/stream');          // SSE
      es.onopen = () => this.status.set('live');
      es.onmessage = e => sub.next(JSON.parse(e.data));
      es.onerror = () => this.status.set('offline');     // EventSource retries itself
      return () => es.close();                           // teardown on unsubscribe
    }).pipe(share());                                    // one connection for all widgets
  }
}

@Injectable({ providedIn: 'root' })
export class MetricStore {
  private rt = inject(RealtimeService);
  private series = signal<Record<string, MetricPoint[]>>({});
  readonly latest = (key: string) => computed(() => this.series()[key]?.at(-1)?.value);

  constructor() {
    this.rt.events().pipe(
      filter((e): e is Extract<DashboardEvent, { type: 'metric' }> => e.type === 'metric'),
      bufferTime(500),                                   // batch: max 2 UI updates/sec
      filter(batch => batch.length > 0),
      takeUntilDestroyed(),
    ).subscribe(batch => this.series.update(s => {
      const next = { ...s };
      for (const e of batch) {
        next[e.key] = [...(next[e.key] ?? []), e.point].slice(-300); // cap memory
      }
      return next;
    }));
  }
}`,
      },
      { type: 'heading3', text: '6. Performance' },
      {
        type: 'bullets',
        items: [
          'Batch and throttle on the client; ask the server to aggregate (send 1 point/sec per metric, not every raw event).',
          'Ring buffers for time series so memory stays flat on an all-day screen.',
          'Signals + `OnPush` mean only widgets whose metric changed re-render; use canvas-based charts for thousands of points.',
          '`@defer (on viewport)` for heavy chart libraries; pause or unsubscribe hidden widgets and lower the rate when `document.visibilityState` is hidden.',
          'Share one connection across tabs if needed (e.g. a `BroadcastChannel` leader tab) to protect the server.',
        ],
      },
      { type: 'heading3', text: '7. Accessibility' },
      {
        type: 'bullets',
        items: [
          'Do not put rapidly changing numbers in a live region — it will flood screen readers. Announce only meaningful events (critical alerts) via `aria-live="assertive"`, others `polite`.',
          'Charts need a text alternative: a summary ("CPU 72%, up 5% in 10 min") and a data-table view.',
          'Color is never the only signal for severity; provide icons/text and sufficient contrast.',
          'Let users pause auto-updates (WCAG "pause, stop, hide").',
        ],
      },
      { type: 'heading3', text: '8. Edge cases and scaling' },
      {
        type: 'bullets',
        items: [
          'Reconnect with exponential backoff and jitter; show "last updated 2 min ago" when stale.',
          'Out-of-order or duplicate events → order by `seq`, ignore older ones.',
          'Auth token expiry on long-lived connections → reconnect with a fresh token.',
          'Scaling: topic subscriptions so each client receives only the widgets it shows; server-side fan-out via a pub/sub layer.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: justify SSE vs WebSocket vs polling from the requirements, then show you control update rate (batching, throttling, server aggregation). "Snapshot + sequenced deltas + resync on gap" is the phrase that signals real-time experience.',
      },
    ],
  },

  'design-an-offline-first-app': {
    summary:
      'Offline-first means the UI always reads from a local store (IndexedDB) and the network is a sync mechanism, not a dependency. A service worker caches the app shell and static assets, reads come from local data and refresh in the background, and writes go into a persistent outbox queue that syncs when connectivity returns, with a conflict-resolution strategy agreed with the backend.',
    details: [
      { type: 'heading3', text: '1. Requirements' },
      {
        type: 'bullets',
        items: [
          '**Clarify the scope**: read-only offline (view cached data) or full offline editing? Which entities? How long can a user be offline (minutes vs days)?',
          '**Functional**: app loads with no network, shows cached data with "last synced" time, queued changes visible as pending, sync on reconnect, conflict UI.',
          '**Non-functional**: storage quotas, encryption of sensitive data at rest, device types (field-worker tablets), battery, data consistency rules, app version updates.',
        ],
      },
      {
        type: 'flow',
        title: 'Offline-first architecture',
        code: `flowchart LR
  UI["Components"]:::client --> RP["Repository<br/>signals"]:::highlight
  RP -->|"read / write"| IDB[("IndexedDB<br/>entities + outbox")]:::db
  RP --> SY["Sync engine"]:::queue
  SY -->|"push outbox"| API["REST API"]:::server
  API -->|"changes since cursor"| SY
  SY --> IDB
  SW["Service worker<br/>app shell + assets"]:::cache -.-> UI
  NET["online / offline events"]:::network --> SY`,
      },
      { type: 'heading3', text: '2. Layers' },
      {
        type: 'numbered',
        items: [
          '**App shell caching**: the Angular service worker package (`@angular/service-worker`, added with `ng add @angular/pwa`) precaches the built JS/CSS/HTML via `ngsw-config.json` asset groups and can cache API responses with data groups (freshness or performance strategy). It also exposes an update service so you can prompt "New version available — reload".',
          '**Local database**: IndexedDB (often via a small wrapper library) holds entities and an outbox. `localStorage` is too small and synchronous for this.',
          '**Repository**: components only talk to repositories that expose signals backed by IndexedDB, so they never care whether data came from the network.',
          '**Sync engine**: pushes queued mutations, pulls server changes since a cursor, resolves conflicts.',
        ],
      },
      { type: 'heading3', text: '3. Data model and sync API' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface Inspection {
  id: string;            // client-generated UUID — works offline, no temp ids
  siteId: string;
  notes: string;
  version: number;       // server version for optimistic concurrency
  updatedAt: string;
  syncState: 'synced' | 'pending' | 'conflict';
}

interface OutboxEntry {
  opId: string;          // idempotency key — safe to retry
  entity: 'inspection';
  op: 'upsert' | 'delete';
  payload: Partial<Inspection> & { id: string };
  baseVersion: number;   // version the user edited
  createdAt: number;
}

// POST /api/sync  { ops: OutboxEntry[], since: string }
interface SyncResponse {
  applied: string[];                                       // opIds accepted
  conflicts: { opId: string; server: Inspection }[];
  changes: Inspection[];                                   // server-side updates since cursor
  cursor: string;
}`,
      },
      { type: 'heading3', text: '4–5. Repository and sync in Angular' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class InspectionRepository {
  private db = inject(LocalDb);          // thin IndexedDB wrapper (app-defined)
  private sync = inject(SyncEngine);
  readonly items = signal<Inspection[]>([]);
  readonly pendingCount = computed(() => this.items().filter(i => i.syncState === 'pending').length);

  async init() { this.items.set(await this.db.all('inspections')); }

  async save(change: Partial<Inspection> & { id: string }) {
    const current = this.items().find(i => i.id === change.id);
    const updated = { ...current, ...change, syncState: 'pending' } as Inspection;
    await this.db.transaction(async tx => {           // entity + outbox atomically
      await tx.put('inspections', updated);
      await tx.put('outbox', { opId: crypto.randomUUID(), entity: 'inspection', op: 'upsert',
        payload: change, baseVersion: current?.version ?? 0, createdAt: Date.now() });
    });
    this.items.update(list => [...list.filter(i => i.id !== updated.id), updated]);
    this.sync.schedule();                              // try now if online
  }
}

@Injectable({ providedIn: 'root' })
export class SyncEngine {
  readonly online = toSignal(
    merge(fromEvent(window, 'online'), fromEvent(window, 'offline')).pipe(map(() => navigator.onLine)),
    { initialValue: navigator.onLine },
  );
  private trigger = new Subject<void>();
  constructor() {
    this.trigger.pipe(
      filter(() => this.online()),
      exhaustMap(() => this.runOnce()),               // never two syncs in parallel
      takeUntilDestroyed(),
    ).subscribe();
    effect(() => { if (this.online()) this.schedule(); });
  }
  schedule() { this.trigger.next(); }
  private runOnce(): Observable<void> { /* read outbox → POST /api/sync → apply result */ return EMPTY; }
}`,
      },
      { type: 'heading3', text: '6. Performance' },
      {
        type: 'bullets',
        items: [
          'Instant startup: render from IndexedDB first, then refresh in the background (stale-while-revalidate).',
          'Delta sync with a cursor instead of downloading everything; batch outbox entries per request.',
          'Index IndexedDB stores by the fields you query; paginate large local lists.',
        ],
      },
      { type: 'heading3', text: '7. Accessibility and UX' },
      {
        type: 'bullets',
        items: [
          'A visible, text-based connection/sync indicator ("Offline — 3 changes pending") announced via a polite live region when it changes.',
          'Pending/conflict states shown with text and icons, not only color.',
          'Conflict resolution UI must be keyboard-accessible and explain both versions clearly.',
        ],
      },
      { type: 'heading3', text: '8. Edge cases and trade-offs' },
      {
        type: 'bullets',
        items: [
          'Conflicts: last-write-wins (simple, may lose data), field-level merge, or ask the user; CRDTs only for collaborative editing.',
          'Storage eviction: request persistent storage (`navigator.storage.persist()`) and handle quota errors.',
          'Logout on shared devices must wipe local data; encrypt sensitive data or avoid storing it.',
          'App updates while data is local: version the IndexedDB schema and migrate on upgrade.',
          '`navigator.onLine` only means "has a network interface" — treat failed requests as offline too.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: separate the two halves clearly — the service worker makes the app LOAD offline, while IndexedDB + an outbox + a sync protocol make the DATA work offline. Mention client-generated ids, idempotency keys and a conflict strategy; that is what distinguishes real offline-first from "we added a PWA".',
      },
    ],
  },

  'design-a-large-multi-step-form': {
    summary:
      'I model it as a wizard driven by a configuration of steps, with one form model split into per-step groups, each step a routed, lazily loaded component. State is the single source of truth in a service, saved as a server-side draft so users can resume, with per-step validation, conditional steps derived from earlier answers, and a final review step. Accessibility focuses on focus management between steps, clear error summaries and a progress indicator.',
    details: [
      { type: 'heading3', text: '1. Requirements' },
      {
        type: 'bullets',
        items: [
          '**Functional**: 6–10 steps (applicant, address, income, employment, documents, review), conditional steps (co-applicant only if joint), save & resume across devices, back/forward without data loss, document upload, final submit and confirmation.',
          '**Non-functional**: long sessions (session timeout handling), mobile-first, WCAG AA (regulated industries often require it), i18n (dates, currency), security of PII, analytics on drop-off per step, rules that change often (business-configurable).',
        ],
      },
      {
        type: 'flow',
        title: 'Wizard architecture',
        code: `flowchart TD
  SC["Step config<br/>id, route, visibleWhen"]:::highlight --> WS["WizardStore<br/>signals + form model"]:::cache
  WS --> SH["Wizard shell<br/>progress, nav, error summary"]:::client
  SH --> R["Router outlet<br/>one route per step"]:::client
  R --> S1["Applicant step"]:::client
  R --> S2["Income step"]:::client
  R --> S3["Review step"]:::client
  WS -->|"autosave debounce"| API["Draft API<br/>PUT /applications/:id"]:::server
  WS -->|"submit"| SUB["POST /applications/:id/submit"]:::server
  API --> DB[("Draft storage")]:::db`,
      },
      { type: 'heading3', text: '3. Data model and API' },
      {
        type: 'code',
        lang: 'typescript',
        code: `interface LoanApplication {
  id: string;
  status: 'draft' | 'submitted';
  version: number;                       // optimistic concurrency between devices
  currentStep: StepId;
  applicant: { firstName: string; lastName: string; dob: string; email: string };
  jointApplication: boolean;
  coApplicant?: LoanApplication['applicant'];
  income: { employment: 'employed' | 'self-employed' | 'retired'; annual: number };
  documents: { id: string; kind: 'payslip' | 'id'; fileName: string }[];
}

type StepId = 'applicant' | 'co-applicant' | 'income' | 'documents' | 'review';

interface StepConfig {
  id: StepId;
  title: string;
  visibleWhen?: (app: LoanApplication) => boolean;   // conditional steps
}

// GET /api/applications/:id         → LoanApplication (resume)
// PUT /api/applications/:id         → save draft, 409 on version conflict
// POST /api/applications/:id/submit → server re-validates everything
// Errors: { fieldErrors: Record<string, string> } mapped onto controls`,
      },
      { type: 'heading3', text: '4–5. Store, steps and navigation' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable()   // provided on the wizard route → fresh state per application
export class WizardStore {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApplicationsApi);
  readonly form = this.fb.group({
    applicant: this.fb.group({
      firstName: ['', Validators.required], lastName: ['', Validators.required],
      dob: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    }),
    jointApplication: [false],
    income: this.fb.group({ employment: ['employed'], annual: [0, Validators.min(1)] }),
  });

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly steps = computed(() =>
    STEPS.filter(s => !s.visibleWhen || s.visibleWhen(this.value() as LoanApplication)));
  readonly current = signal<StepId>('applicant');
  readonly index = computed(() => this.steps().findIndex(s => s.id === this.current()));

  constructor() {
    this.form.valueChanges.pipe(
      debounceTime(1500),
      switchMap(v => this.api.saveDraft(v)),   // autosave
      takeUntilDestroyed(),
    ).subscribe();
  }
  stepValid(id: StepId) { return this.form.get(id)?.valid ?? true; }
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Routes — each step is lazy, guards protect skipping ahead and leaving with unsaved work
export const WIZARD_ROUTES: Routes = [{
  path: 'apply/:id',
  providers: [WizardStore],
  component: WizardShell,
  canDeactivate: [(shell: WizardShell) => !shell.dirty() || confirm('Leave the application?')],
  children: [
    { path: 'applicant', loadComponent: () => import('./steps/applicant.step') },
    { path: 'income', loadComponent: () => import('./steps/income.step') },
    { path: 'review', loadComponent: () => import('./steps/review.step') },
    { path: '', pathMatch: 'full', redirectTo: 'applicant' },
  ],
}];`,
      },
      {
        type: 'paragraph',
        text: "One route per step gives deep links, browser back/forward and analytics per step for free. Steps only render their slice of the form; the store owns the whole model so nothing is lost when a step component is destroyed. Angular's newer Signal Forms (`form()` from `@angular/forms/signals`) are an alternative model-first approach — worth mentioning, but check their stability status for your version before committing a regulated product to them.",
      },
      { type: 'heading3', text: '6. Performance' },
      {
        type: 'bullets',
        items: [
          'Lazy-load each step and heavy widgets (address lookup, file uploader) with `loadComponent` / `@defer`.',
          'Autosave is debounced and only sends changed sections; uploads go directly to storage with progress and retry.',
          "Prefetch the next step's chunk when the current step becomes valid.",
        ],
      },
      { type: 'heading3', text: '7. Accessibility' },
      {
        type: 'bullets',
        items: [
          'On step change, move focus to the step heading (`tabindex="-1"`) and update `document.title` ("Step 2 of 5: Income").',
          'Progress indicator as an ordered list with `aria-current="step"`; do not rely on color.',
          'On submit with errors: show an error summary at the top with links to each field, focus it, and tie messages to inputs with `aria-describedby` and `aria-invalid`.',
          'Proper labels, `autocomplete` attributes (`given-name`, `postal-code`), and warn before session timeout with an option to extend.',
        ],
      },
      { type: 'heading3', text: '8. Edge cases and scaling' },
      {
        type: 'bullets',
        items: [
          'Answers that hide a step must clear or ignore its data (do not submit a stale co-applicant).',
          'Two devices editing the same draft → version check and a 409 "this application changed elsewhere" flow.',
          'The server is the authority: re-validate on submit and map server field errors back to controls.',
          'Scaling to many products: move step and field definitions to a schema-driven config (JSON from a CMS) rendered by a dynamic form engine — trade-off: flexibility vs type safety and custom UX.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: emphasise "one model, many views" — the store owns the whole application while steps are just views over slices. Then cover save-and-resume, conditional steps as derived state, and focus management between steps; those three show real-world wizard experience.',
      },
    ],
  },

  'structuring-a-codebase-for-many-teams': {
    summary:
      'I start with a monorepo of workspace libraries organized by domain and layer (feature, data-access, ui, util), enforce module boundaries with tags and lint rules, give each domain a clear owning team via CODEOWNERS, share one design system, and run CI only on affected projects. That gives team autonomy with a single version of Angular and dependencies; micro frontends only become worth it when teams truly need independent deployments or different release cadences.',
    details: [
      { type: 'heading3', text: '1. Requirements to clarify' },
      {
        type: 'bullets',
        items: [
          'How many teams and how are they aligned (by business domain, e.g. Orders, Catalog, Account)?',
          'Do teams need to deploy independently, or is a shared release train acceptable?',
          'One product or several apps (customer app, admin portal) sharing code?',
          'Non-functional: build and test times, onboarding speed, consistency of UX, upgrade cost of Angular majors.',
        ],
      },
      {
        type: 'flow',
        title: 'Monorepo with domain libraries and enforced boundaries',
        code: `flowchart TD
  APP1["apps/shop"]:::client --> FO["orders/feature-*"]:::highlight
  APP1 --> FC["catalog/feature-*"]:::highlight
  APP2["apps/admin"]:::client --> FO
  FO --> DO["orders/data-access"]:::cache
  FC --> DC["catalog/data-access"]:::cache
  FO --> UI["shared/ui<br/>design system"]:::client
  FC --> UI
  DO --> UT["shared/util"]:::external
  DC --> UT
  FO -.->|"blocked by lint"| DC
  CI["CI: affected build/test"]:::queue -.-> APP1`,
      },
      { type: 'heading3', text: '2. Workspace layout' },
      {
        type: 'code',
        lang: 'bash',
        code: `apps/
  shop/                     # thin: routing, shell, config, providers
  admin/
libs/
  orders/
    feature-list/           # routed smart components
    feature-detail/
    data-access/            # services, stores, API clients
    ui/                     # domain-specific presentational components
    util/
  catalog/...
  shared/
    ui/                     # design system (owned by platform team)
    data-access-auth/
    util-formatting/`,
      },
      {
        type: 'bullets',
        items: [
          'Apps are thin composition roots; almost all code lives in libraries.',
          "Each library exposes a public API through an `index.ts` barrel; deep imports into another library's internals are forbidden.",
          'Feature libraries expose routes (`export const ORDER_ROUTES: Routes`) that the app lazy-loads, so domains plug in without the shell knowing their internals.',
        ],
      },
      { type: 'heading3', text: '3. Module boundaries as lint rules' },
      {
        type: 'paragraph',
        text: 'Conventions are not enough with many teams — boundaries must fail the build. Monorepo tools such as Nx let you tag projects (e.g. `scope:orders`, `type:feature`) and enforce allowed dependencies with a lint rule; without such a tool you can approximate it with ESLint import restrictions and TypeScript path aliases. The intended rules look like this:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Conceptual dependency rules (expressed in your tool's lint config)
const rules = [
  { source: 'type:app',         canDependOn: ['type:feature', 'type:data-access', 'type:ui', 'type:util'] },
  { source: 'type:feature',     canDependOn: ['type:data-access', 'type:ui', 'type:util'] },
  { source: 'type:data-access', canDependOn: ['type:data-access', 'type:util'] },
  { source: 'type:ui',          canDependOn: ['type:ui', 'type:util'] },
  { source: 'type:util',        canDependOn: ['type:util'] },
  // domain isolation: orders may use only its own scope + shared
  { source: 'scope:orders',     canDependOn: ['scope:orders', 'scope:shared'] },
];
// Cross-domain needs go through shared contracts or events, not direct imports.`,
      },
      { type: 'heading3', text: '4. Ownership and collaboration' },
      {
        type: 'bullets',
        items: [
          '`CODEOWNERS` maps `libs/orders/**` to the Orders team — their review is required for changes there.',
          'A platform team owns `shared/*`, the design system, build config, and Angular upgrades.',
          "Cross-domain communication goes through explicit contracts: shared interfaces in a `shared/contracts` lib, router navigation, or a small event bus — never reaching into another domain's store.",
          'Architecture decision records (ADRs) document conventions so new teams onboard quickly.',
        ],
      },
      { type: 'heading3', text: '5–6. CI, performance and the build' },
      {
        type: 'bullets',
        items: [
          'Affected-only pipelines: compute which projects a change touches via the dependency graph and run lint/test/build only for those.',
          'Local and remote computation caching so unchanged libraries are not rebuilt.',
          "Lazy-loaded feature routes keep each team's code out of the initial bundle; enforce bundle budgets in `angular.json`.",
          'Single version policy: one `package.json`, one Angular version — upgrades happen once, with automated migrations, for everyone.',
        ],
      },
      { type: 'heading3', text: '7. Consistency and accessibility at scale' },
      {
        type: 'bullets',
        items: [
          'Teams build UI from the shared design system, so accessibility and visual consistency come by default.',
          'Shared lint config (including template a11y rules), shared test setup, and generators/schematics for new libraries keep structure uniform.',
        ],
      },
      { type: 'heading3', text: '8. When are micro frontends worth it?' },
      {
        type: 'bullets',
        items: [
          '**Worth it**: teams must deploy independently on different cadences, the org is very large, apps come from acquisitions/different frameworks, or a legacy app is being migrated incrementally.',
          '**Costs**: runtime integration complexity, shared dependency version alignment, larger total payload, harder end-to-end testing and inconsistent UX risk.',
          'A well-bounded monorepo is often the right first step — and it makes a later split into micro frontends easier because boundaries already exist.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame it as "autonomy with guardrails" — domain libraries, enforced boundaries, clear ownership, affected CI. Then show judgment by saying micro frontends solve a deployment/organisational problem, not a code-organisation problem, and you would reach for them only when independent releases are a real requirement.',
      },
    ],
  },
};
