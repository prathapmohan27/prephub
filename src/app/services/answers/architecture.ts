import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'solid-in-an-angular-app': {
    summary:
      'Map each principle to Angular building blocks: **S** — small components and services with one job (presentational vs container, API service vs state service); **O** — extend via DI, content projection, injection tokens and multi-providers instead of editing existing code; **L** — implementations of an abstract class/token must be swappable; **I** — small focused interfaces and narrow inputs; **D** — depend on abstractions via DI tokens and abstract classes, not concrete implementations.',
    details: [
      {
        type: 'paragraph',
        text: "Angular's dependency injection makes SOLID very natural. The goal is not academic purity — it is code that is easy to test, change and reuse. Use one concrete example per principle.",
      },
      { type: 'heading3', text: 'S — Single Responsibility' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ One component fetches, maps, validates, formats and renders
// ✅ Split by responsibility:
@Injectable({ providedIn: 'root' })
export class OrderApi { /* only HTTP calls */ }

@Injectable({ providedIn: 'root' })
export class OrderStore { /* only state: signals, computed totals */ }

@Component({ selector: 'app-order-table', template: '...' })
export class OrderTable {          // presentational: inputs in, outputs out
  orders = input.required<Order[]>();
  selected = output<Order>();
}

@Component({ selector: 'app-orders-page', template: '<app-order-table [orders]="store.orders()" (selected)="open($event)" />' })
export class OrdersPage {          // container: wires store to UI
  store = inject(OrderStore);
  open(o: Order) { /* navigate */ }
}`,
      },
      { type: 'heading3', text: 'O — Open/Closed' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Add new export formats without modifying the exporter
export interface Exporter { format: string; export(rows: Row[]): Blob }
export const EXPORTERS = new InjectionToken<Exporter[]>('EXPORTERS');

providers: [
  { provide: EXPORTERS, useClass: CsvExporter, multi: true },
  { provide: EXPORTERS, useClass: ExcelExporter, multi: true },
  // new format = new provider line, ExportService stays untouched
]

@Injectable({ providedIn: 'root' })
export class ExportService {
  private exporters = inject(EXPORTERS);
  export(format: string, rows: Row[]) {
    return this.exporters.find(e => e.format === format)?.export(rows);
  }
}
// Same idea in templates: content projection (<ng-content>) and ng-template inputs let
// consumers customise a component without editing it.`,
      },
      { type: 'heading3', text: 'L — Liskov Substitution' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export abstract class StorageService {
  abstract get(key: string): string | null;
  abstract set(key: string, value: string): void;
}
export class LocalStorageService extends StorageService { /* localStorage */ }
export class MemoryStorageService extends StorageService { /* Map — for SSR and tests */ }

// Any subclass must honour the contract: same inputs, same kind of outputs, no surprise exceptions.
// A subclass whose set() throws "not supported" would violate LSP.`,
      },
      { type: 'heading3', text: 'I — Interface Segregation' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ One fat interface forces every component to implement everything
// interface CrudPage { load(); save(); delete(); export(); print(); }

// ✅ Small, opt-in contracts
export interface HasUnsavedChanges { hasUnsavedChanges(): boolean }
export interface Refreshable { refresh(): void }

export const unsavedGuard: CanDeactivateFn<HasUnsavedChanges> = c => !c.hasUnsavedChanges() || confirm('Leave?');
// Components also expose narrow inputs (the 3 fields they need), not a whole domain object.`,
      },
      { type: 'heading3', text: 'D — Dependency Inversion' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// High-level code depends on the abstraction
export abstract class Logger { abstract log(msg: string, data?: unknown): void }

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private logger = inject(Logger); // does not know which implementation
}

// Wiring decides the concrete class per environment
providers: [{ provide: Logger, useClass: environment.production ? SentryLogger : ConsoleLogger }]
// In tests: { provide: Logger, useValue: { log: jasmine.createSpy() } }`,
      },
      {
        type: 'bullets',
        items: [
          'Signs you are violating SOLID: 800-line components, services injected into 30 places with unrelated methods, `if (type === ...)` chains growing with every feature, tests that need the whole app.',
          'Do not over-engineer: an abstraction with exactly one implementation and no test seam may be unnecessary.',
          'Enforce boundaries with lint rules (e.g. Nx module boundaries) so features depend only on public APIs.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: interviewers want Angular-specific examples, not textbook definitions. "Multi-provider tokens for Open/Closed" and "abstract class as DI token for Dependency Inversion" are the two that impress most.',
      },
    ],
  },

  'facade-pattern': {
    summary:
      'A facade is a service that gives components one simple API for a feature — exposing state as signals/observables and actions as methods — while hiding how that is implemented (NgRx store, HTTP services, caching, multiple APIs). Components depend on the facade, not on the store or endpoints, so you can change state management without touching the UI. A typical use: an `OrdersFacade` that wraps NgRx actions/selectors and several API calls for an orders feature.',
    details: [
      {
        type: 'paragraph',
        text: 'The facade pattern comes from the Gang of Four: provide a simplified interface to a complex subsystem. In Angular it usually sits between container components and the state/data layer.',
      },
      {
        type: 'flow',
        title: 'Facade between UI and data layer',
        code: `flowchart LR
  C1["OrdersPage"]:::client --> F["OrdersFacade<br/>orders, loading<br/>load(), cancel()"]:::highlight
  C2["OrderDetail"]:::client --> F
  F --> ST["NgRx Store or<br/>SignalStore"]:::cache
  F --> API["OrdersApi"]:::server
  F --> N["NotificationService"]:::external
  API --> BE[("Backend")]:::db`,
      },
      { type: 'heading3', text: 'Facade over NgRx' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Injectable({ providedIn: 'root' })
export class OrdersFacade {
  private store = inject(Store);

  // State — components never see selectors
  readonly orders = this.store.selectSignal(selectOrders);
  readonly loading = this.store.selectSignal(selectOrdersLoading);
  readonly totalValue = computed(() => this.orders().reduce((s, o) => s + o.total, 0));

  // Actions — components never dispatch directly
  load(filter: OrderFilter) { this.store.dispatch(OrdersActions.load({ filter })); }
  cancel(id: string)        { this.store.dispatch(OrdersActions.cancel({ id })); }
}

@Component({
  selector: 'app-orders-page',
  template: \`
    @if (facade.loading()) { <app-spinner /> }
    <app-order-table [orders]="facade.orders()" (cancel)="facade.cancel($event)" />
    <p>Total: {{ facade.totalValue() | currency }}</p>
  \`,
})
export class OrdersPage {
  facade = inject(OrdersFacade);
  constructor() { this.facade.load({ status: 'open' }); }
}`,
      },
      { type: 'heading3', text: 'Benefits and trade-offs' },
      {
        type: 'bullets',
        items: [
          '**Decoupling**: we could migrate from NgRx to SignalStore by rewriting only the facade.',
          '**Testability**: components are tested with a mock facade (`{ orders: signal([...]), load: jasmine.createSpy() }`).',
          '**Simpler components**: no knowledge of actions, selectors or endpoints.',
          '**Orchestration**: one method can coordinate several calls (save → refresh → toast).',
          '**Risk**: a facade that grows into a "god service" for the whole app. Keep one per feature.',
          '**Risk**: with NgRx, a facade method per action can hide the event-driven nature ("dispatching events, not commands"); some teams prefer direct store use for that reason.',
        ],
      },
      { type: 'heading3', text: 'How to describe where you used it (structure)' },
      {
        type: 'paragraph',
        text: 'Use a short STAR answer: the **Situation** (feature and why the components were messy), the **Task**, the **Action** (what the facade exposed and wrapped), and the **Result** (measurable effect).',
      },
      {
        type: 'code',
        lang: 'text',
        code: `Sample answer (replace the brackets with your real details):

"In [project — e.g. a B2B ordering portal], our order screens were injecting the NgRx Store,
three API services and a notification service directly, so every component knew about
actions and selectors. I introduced a feature-level OrdersFacade that exposed orders,
loading and error as signals and methods like load(), cancel() and reorder().
Components only talked to the facade. As a result, component tests no longer needed a
mock store, and when we later [moved part of the state to SignalStore / changed an API],
we only changed the facade — [N] components were untouched."`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: also mention the downside and how you limited it ("one facade per feature, no business logic in it — it delegates"). Showing you know when NOT to use a pattern is a strong senior signal.',
      },
    ],
  },

  'micro-frontend-architecture': {
    summary:
      'Answer honestly, then show you understand the architecture: micro frontends split a large UI into independently developed and deployed apps owned by different teams, composed at runtime by a shell (host). In Angular this is usually done with Module Federation or Native Federation, sometimes Web Components (Angular Elements) or iframes. The key concerns are shared dependencies, routing, cross-app communication, a shared design system and versioning.',
    details: [
      { type: 'heading3', text: 'How to structure your answer' },
      {
        type: 'numbered',
        items: [
          'Yes/no in one line — if not hands-on, say what you know and how you would approach it.',
          'Why micro frontends were chosen (team autonomy, independent deployments, legacy migration) — or why not.',
          'The technical setup: shell, remotes, how they load, shared libs.',
          'A real problem you solved (shared state, version conflicts, styling) and the result.',
          'Trade-offs — this is what interviewers really test.',
        ],
      },
      {
        type: 'flow',
        title: 'Typical Module/Native Federation setup',
        code: `flowchart TD
  U["Browser"]:::client --> SH["Shell / Host app<br/>layout, auth, routing"]:::highlight
  SH -->|"/orders → load remoteEntry"| R1["Orders MFE<br/>Team A"]:::server
  SH -->|"/catalog"| R2["Catalog MFE<br/>Team B"]:::server
  SH -->|"/account"| R3["Account MFE<br/>Team C"]:::server
  SH -.->|"shared singletons"| LIB["@angular/core, rxjs,<br/>design system"]:::cache`,
      },
      { type: 'heading3', text: 'Loading a remote via the router' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// shell app.routes.ts — using @angular-architects/native-federation (similar API for module-federation)
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'orders',
    loadChildren: () => loadRemoteModule('orders', './routes').then(m => m.ORDER_ROUTES),
  },
];

// federation.manifest.json — remotes can be deployed independently, URLs resolved at runtime
// { "orders": "https://orders.example.com/remoteEntry.json" }`,
      },
      { type: 'heading3', text: 'Key design decisions' },
      {
        type: 'bullets',
        items: [
          '**Composition**: Module/Native Federation (best for Angular-to-Angular, shares one Angular instance), Web Components via Angular Elements (framework-agnostic), iframes (strong isolation, poor UX), or build-time composition (simple, but loses independent deploys).',
          '**Shared dependencies**: mark Angular, RxJS and the design system as singletons; keep versions aligned or mismatches cause runtime errors.',
          '**Communication**: URL/route params first, then custom DOM events or a tiny shared event bus; avoid sharing a global store between teams.',
          '**Auth**: the shell owns login and token; remotes read it from a shared library or an injected service.',
          '**Consistency**: a shared component library and design tokens so the product looks like one app.',
          '**Ops**: independent CI/CD per remote, contract tests, and fallback UI if a remote fails to load.',
        ],
      },
      { type: 'heading3', text: 'Sample answers' },
      {
        type: 'code',
        lang: 'text',
        code: `If you have experience (fill in your details):
"Yes — at [company] we had [N] teams working on [product]. We used [Module Federation /
Native Federation] with an Angular shell that handled auth, layout and top-level routing,
and each team owned a remote for [orders / catalog / ...]. The hardest part was
[shared dependency versions / cross-app state]; we solved it by [making Angular and the
design system shared singletons and upgrading all remotes together / communicating via
URL and custom events]. Deployments went from [weekly, all teams] to [independent, daily]."

If you have not:
"Not in production, but I understand the approach and its trade-offs. I'd only choose
it when several teams need independent releases — for a single team a well-structured
monorepo with lazy-loaded features (e.g. Nx with module boundaries) gives most of the
benefits without the runtime complexity. If I had to, I'd start with Native Federation..."`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Do not claim experience you do not have — follow-up questions about shared dependencies and versioning will expose it quickly. A clear "not in production, but here is how I would do it and when I would not" is a strong answer.',
      },
    ],
  },

  'sharing-data-between-applications': {
    summary:
      'First clarify the context: separate apps on different domains, micro frontends in one page, or tabs of the same app. The source of truth should almost always be a backend API (with push via WebSockets/SSE when real-time updates matter). On the client, use the URL for navigation context, custom events or a small typed event bus for micro frontends in one page, `BroadcastChannel`/`storage` events across tabs of the same origin, and `postMessage` with origin checks for iframes or cross-origin windows.',
    details: [
      {
        type: 'paragraph',
        text: 'The design depends on three questions: Are the apps in the same browser page, the same origin, or completely separate? Does the data need to be persistent and authoritative, or just a UI signal? And how fresh must it be — on next load, near-real-time, or instantly?',
      },
      {
        type: 'flow',
        title: 'Choosing a communication mechanism',
        code: `flowchart TD
  Q{"Where do the apps run?"} -->|"Different devices or users"| API["Backend API + DB<br/>WebSocket / SSE for push"]:::server
  Q -->|"Same page (micro frontends)"| MF["Custom DOM events or<br/>shared typed event bus"]:::highlight
  Q -->|"Same origin, other tabs"| BC["BroadcastChannel<br/>or storage event"]:::cache
  Q -->|"iframe or other origin"| PM["window.postMessage<br/>with origin check"]:::security
  MF --> URL["Plus URL params for<br/>shareable context"]:::client`,
      },
      { type: 'heading3', text: '1. Backend as the source of truth' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// App A updates the cart; App B (another app/device) receives a push
@Injectable({ providedIn: 'root' })
export class CartSync {
  private socket = webSocket<CartEvent>('wss://api.example.com/cart-events');
  readonly events = toSignal(this.socket.pipe(retry({ delay: 3000 })));
}
// Both apps read/write via REST; WebSocket/SSE only notifies "cart changed" so others refetch.`,
      },
      { type: 'heading3', text: '2. Micro frontends in the same page: custom events' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Shared contract library (versioned, owned by the platform team)
export interface CartUpdated { count: number }
export const CART_UPDATED = 'shop:cart-updated';

// Catalog MFE publishes
window.dispatchEvent(new CustomEvent<CartUpdated>(CART_UPDATED, { detail: { count: 3 } }));

// Header in the shell subscribes
fromEvent<CustomEvent<CartUpdated>>(window, CART_UPDATED)
  .pipe(takeUntilDestroyed())
  .subscribe(e => this.cartCount.set(e.detail.count));`,
      },
      { type: 'heading3', text: '3. Tabs of the same origin: BroadcastChannel' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const channel = new BroadcastChannel('auth');

// Tab 1 logs out
channel.postMessage({ type: 'logout' });

// Every other tab (e.g. inside a root service)
private router = inject(Router);
constructor() {
  channel.onmessage = ({ data }) => {
    if (data.type === 'logout') this.router.navigateByUrl('/login');
  };
}`,
      },
      { type: 'heading3', text: '4. Iframes / different origins: postMessage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Parent → iframe (always specify the target origin, never '*')
iframe.contentWindow?.postMessage({ type: 'theme', value: 'dark' }, 'https://widget.example.com');

// Inside the iframe — ALWAYS validate the sender
window.addEventListener('message', event => {
  if (event.origin !== 'https://app.example.com') return;
  if (event.data?.type === 'theme') applyTheme(event.data.value);
});`,
      },
      {
        type: 'bullets',
        items: [
          'Define message contracts in a shared, versioned package — event name, payload type, version — so teams do not break each other.',
          'Prefer events (loose coupling) over a shared global store between independently deployed apps.',
          'Keep shared state minimal: IDs and "something changed" signals; each app fetches the details it needs.',
          'For SSO/session sharing across apps use the identity provider (OIDC) and cookies on a parent domain, not local storage copying.',
          'Server-to-server sharing (backend apps) is a different topic: REST/gRPC for queries, a message broker (Kafka, RabbitMQ) for events.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: start by asking clarifying questions (same page? same origin? real-time?). Then propose "backend as source of truth + a lightweight client-side event mechanism". That structure is exactly what system-design interviewers look for.',
      },
    ],
  },

  'writing-hld-and-lld-documents': {
    summary:
      "Yes, proportionate to the feature's size and risk. An **HLD** (high-level design) explains the what and why at system level — components, data flow, integrations, non-functional requirements and trade-offs — and is reviewed with architects and other teams. An **LLD** (low-level design) explains the how — component/service structure, state, API contracts, models, error handling, edge cases — and guides the implementing developers. Small changes may only need a short ticket description or an ADR.",
    details: [
      { type: 'heading3', text: 'HLD vs LLD' },
      {
        type: 'bullets',
        items: [
          '**HLD audience**: architects, product, other teams. **Content**: context and goals, architecture diagram, main components/services, data flow, external integrations, technology choices, security, scalability, performance targets, risks and alternatives considered.',
          '**LLD audience**: developers and reviewers. **Content**: module/component tree, routes, state shape (store/signals), service and API contracts (endpoints, DTOs), validation rules, error and loading states, sequence diagrams, test plan, feature flags and rollout.',
          '**ADR** (Architecture Decision Record): a one-page record of a single decision ("we chose SignalStore over NgRx for feature X because...").',
        ],
      },
      { type: 'heading3', text: 'A frontend LLD outline you can describe' },
      {
        type: 'code',
        lang: 'text',
        code: `Feature: Bulk order import (LLD)
1. Scope & assumptions — max 5,000 rows, CSV/XLSX, admin role only
2. Routes            — /orders/import (lazy, canMatch: adminGuard)
3. Components        — ImportPage (container), FileDropzone, PreviewTable (virtual scroll),
                       ValidationSummary (presentational)
4. State             — ImportStore (SignalStore): file, rows, errors, status
5. API contracts     — POST /api/orders/import (multipart) → { jobId }
                       GET  /api/orders/import/{jobId} → { status, processed, failed[] }
6. Flow              — upload → poll every 3s (stop on done/destroy) → show result
7. Errors & edge     — 413 too large, partial failures, duplicate upload (exhaustMap)
8. Non-functional    — parse in a Web Worker, a11y for dropzone, i18n messages
9. Testing           — unit (store), component (preview), e2e (happy + failure path)
10. Rollout          — feature flag, metrics: import success rate`,
      },
      {
        type: 'flow',
        title: 'Where design docs fit in delivery',
        code: `flowchart LR
  RQ["Requirement"]:::client --> HLD["HLD<br/>architecture review"]:::highlight
  HLD --> LLD["LLD<br/>team design review"]:::server
  LLD --> DEV["Implement + PRs"]:::cache
  DEV --> DOC["Update docs / ADR<br/>if design changed"]:::db
  RQ -.->|"small change"| DEV`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'code',
        lang: 'text',
        code: `"Yes, depending on size. For [a recent large feature — e.g. a multi-step checkout],
I wrote [the LLD / contributed to the HLD]: it covered [routes, state management, API
contracts with the backend team, error handling and the rollout plan behind a feature
flag]. We reviewed it with [the backend lead / architect] before coding, which caught
[an issue — e.g. a missing pagination contract] early. For small features we skip a
formal document and capture the decision in the ticket or an ADR."`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: "documentation proportional to risk" is the senior answer. Mention that the doc was reviewed BEFORE coding and that it caught a real problem — that shows the document had value, not just that it existed.',
      },
    ],
  },

  'an-enterprise-app-you-worked-on': {
    summary:
      'Structure the answer top-down in about two minutes: the business context and scale, the high-level architecture (frontend structure, backend/APIs, auth, deployment), the tech stack, how state is managed and why, the key feature areas, and one or two hard problems you solved with measurable results. Use your real project — the interviewer is checking whether you understand the WHY behind the decisions, not just the list of libraries.',
    details: [
      { type: 'heading3', text: 'A structure that works' },
      {
        type: 'numbered',
        items: [
          '**Context**: domain, users, scale (e.g. "internal claims platform, ~2,000 daily users, 6 frontend devs").',
          '**Architecture**: monorepo or multi-repo, standalone/feature-based structure, lazy-loaded features, shared libraries, micro frontends if any, SSR or SPA.',
          '**Tech stack**: Angular version, UI library, RxJS/signals, state library, testing, build/CI, hosting, backend APIs.',
          '**State management**: what lives where (server cache vs UI state vs global state) and why you chose that tool.',
          '**Key modules/features**: 3–5 main areas and how they are separated.',
          '**Cross-cutting concerns**: auth, interceptors, error handling, i18n, accessibility, performance, monitoring.',
          '**Your contribution and a challenge**: a problem, what you did, and the result with numbers.',
        ],
      },
      {
        type: 'flow',
        title: 'Example architecture to describe',
        code: `flowchart TD
  U["Users"]:::client --> CDN["CDN + Angular SPA"]:::network
  CDN --> SH["App shell<br/>layout, auth, routing"]:::highlight
  SH --> F1["Feature: Claims<br/>lazy"]:::server
  SH --> F2["Feature: Payments<br/>lazy"]:::server
  SH --> F3["Feature: Reports<br/>lazy"]:::server
  F1 --> GW["API Gateway"]:::security
  F2 --> GW
  F3 --> GW
  GW --> MS[("Microservices + DB")]:::db
  SH -.-> IDP["OIDC provider"]:::external`,
      },
      { type: 'heading3', text: 'Example folder structure' },
      {
        type: 'code',
        lang: 'text',
        code: `apps/claims-portal/src/app/
  core/            → auth (OIDC), interceptors, ErrorHandler, layout shell, app-wide services
  shared/          → UI kit wrappers, pipes, directives, utilities (no feature logic)
  features/
    claims/        → claims.routes.ts, data-access/ (api + store), ui/, pages/
    payments/
    reports/
  app.routes.ts    → lazy loadChildren for each feature, guards
libs/              → design-system, shared models, api-client (generated from OpenAPI)`,
      },
      { type: 'heading3', text: 'Sample answer template' },
      {
        type: 'code',
        lang: 'text',
        code: `"I worked on [product], a [domain] application used by [who / how many]. It's an
Angular [version] SPA in an [Nx monorepo / single repo], fully standalone with
lazy-loaded features for [feature A, B, C]. The UI uses [Angular Material / PrimeNG +
our design system], and we talk to [N] backend services through an API gateway using
[REST / GraphQL], with clients generated from OpenAPI.

For state, server data lives in [NgRx / SignalStore / service-with-signals] per feature,
and purely local UI state stays in component signals — we avoided one global store for
everything. Auth is [OIDC with Azure AD / Keycloak], handled by an interceptor and
functional guards.

Testing is [Jest / Vitest] for units and [Playwright / Cypress] for e2e, built and
deployed via [GitHub Actions / Azure DevOps] to [hosting].

One challenge I owned was [e.g. slow initial load of 6s]. I [split features into lazy
routes, added @defer for heavy charts, and fixed a shared module that pulled in a large
library], which brought it down to [2s LCP]."`,
      },
      {
        type: 'bullets',
        items: [
          'Explain WHY: "we chose SignalStore because most state was feature-local and NgRx boilerplate slowed the team".',
          'Mention a decision you would change today — it shows reflection.',
          'Keep NDA-sensitive details generic (domain and scale, not client names or internals).',
          'Be ready for follow-ups on each layer: "how did the token refresh work?", "how did you share code between features?".',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: reciting a list of libraries ("Angular, RxJS, NgRx, Material, Jest...") with no structure or reasons. Interviewers use this question to judge architectural thinking — always attach a reason and a trade-off to each choice.',
      },
    ],
  },
};
