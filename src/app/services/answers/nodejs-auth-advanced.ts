import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Sessions vs JWTs: what are the real trade-offs for a web app?': {
    summary:
      'A server-side session is an opaque random id in a cookie that points to state in a store such as Redis: it is tiny, instantly revocable, and needs a lookup on every request. A self-contained JWT carries signed claims, so any service can verify it without a lookup, but it is large and hard to revoke before it expires. For a same-site web app with its own backend I usually choose sessions in an HttpOnly cookie. I use JWTs for service-to-service calls and third-party API access.',
    details: [
      {
        type: 'paragraph',
        text: 'The basics of what a JWT is are covered in the Security topic. Here the question is the trade-off. "Stateless" sounds attractive, but most real apps put state back in later for logout, bans and permission changes, so look at what each option actually costs.',
      },
      { type: 'heading3', text: 'Side by side' },
      {
        type: 'bullets',
        items: [
          '**Revocation:** a session is deleted from the store and is gone at once. A JWT stays valid until `exp` unless you add a denylist or version check, which is a lookup again.',
          '**Size:** a session cookie is about 32 bytes. A JWT with roles and tenant claims is often 800 bytes or more and is sent on every request.',
          '**Scaling:** sessions need a shared store (Redis), which is easy and fast today. JWTs are verified locally with a public key, which is useful when many services or other organisations must trust the token.',
          '**Data freshness:** a session reads current roles from the store. A JWT holds a snapshot of the claims until it expires.',
          '**Exposure:** an opaque id reveals nothing. A JWT payload is only base64url-encoded, so anyone holding it can read the claims.',
        ],
      },
      { type: 'heading3', text: 'Cookies bring CSRF; headers bring XSS exposure' },
      {
        type: 'paragraph',
        text: 'Whatever is inside, the transport decides most of the risk. A cookie is sent by the browser automatically, so you need CSRF defence: `SameSite=Lax` or `Strict`, plus an anti-CSRF token or an `Origin` check for state-changing requests. A token in an `Authorization` header is not exposed to CSRF, but JavaScript must be able to read it, so any XSS can steal it. Putting a JWT in an HttpOnly cookie is possible, but then you have the cookie trade-offs and a large payload as well.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// NestJS + express-session backed by Redis
import session from 'express-session';
import { RedisStore } from 'connect-redis';

app.use(
  session({
    store: new RedisStore({ client: redis, prefix: 'sess:' }),
    name: '__Host-sid',          // __Host- prefix: Secure, Path=/, no Domain
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    rolling: true,               // sliding idle timeout
    cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 60_000 },
  }),
);

// On login: regenerate the id to prevent session fixation
req.session.regenerate(() => { req.session.userId = user.id; res.sendStatus(204); });

// "Log out everywhere": delete every session for the user (keep a set per user)`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A common anti-pattern is a long-lived JWT in `localStorage` "because it is stateless". It is readable by any injected script, cannot be revoked, and usually ends up with a database lookup per request anyway.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say who must verify the credential. If only your backend does, use a session. If several services or external parties must verify it without calling you, use a short-lived signed token. That shows you choose by trust boundaries, not by fashion.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you scale sessions? Use Redis with replication; sticky sessions are not needed.',
          'Can you mix them? Yes: a session at the edge (BFF) and short-lived JWTs between internal services.',
          'What is session fixation? An attacker plants a known session id before login; regenerate the id on every privilege change.',
        ],
      },
    ],
  },

  'How do access tokens and refresh tokens work together, and what is refresh token rotation?': {
    summary:
      'The access token is short-lived (5–15 minutes) and sent to APIs. The refresh token is long-lived, sent only to the token endpoint, and used to get new access tokens. With rotation, every refresh returns a new refresh token and invalidates the old one. If an old token is ever presented again, that is treated as theft and the whole token family is revoked.',
    details: [
      {
        type: 'paragraph',
        text: 'Splitting the two limits the damage. A leaked access token works only for minutes, and the refresh token, which is powerful, travels only to one endpoint, where it can be checked against server-side state.',
      },
      { type: 'heading3', text: 'Rotation with reuse detection' },
      {
        type: 'numbered',
        items: [
          'Login issues access token A1 and refresh token R1, stored server-side as `{ id: R1, familyId: F, used: false }`.',
          'The client calls `POST /auth/refresh` with R1. The server marks R1 as used and issues A2 and R2 in the same family F.',
          'If R1 is presented again (an attacker or a replay), the server sees `used: true` and revokes every token in family F. Both the attacker and the real user must log in again.',
          'Expiry is enforced twice: an **idle (sliding)** timeout, where each refresh extends the life of the new token, and an **absolute** lifetime taken from the family creation time (for example 30 days), after which a full login is required.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `async refresh(presented: string) {
  const hash = sha256(presented);                      // store hashes, never raw tokens
  const rt = await this.repo.findByHash(hash);
  if (!rt) throw new UnauthorizedException();
  if (rt.usedAt || rt.revokedAt) {
    await this.repo.revokeFamily(rt.familyId);         // reuse detected
    throw new UnauthorizedException('refresh token reuse');
  }
  if (rt.familyCreatedAt < Date.now() - ABSOLUTE_TTL) throw new UnauthorizedException();

  await this.repo.markUsed(rt.id);                     // in the same transaction as the insert
  const next = randomBytes(32).toString('base64url');
  await this.repo.insert({ hash: sha256(next), familyId: rt.familyId, userId: rt.userId,
                           expiresAt: Date.now() + IDLE_TTL, familyCreatedAt: rt.familyCreatedAt });
  return { accessToken: await this.signAccess(rt.userId), refreshToken: next };
}`,
      },
      {
        type: 'paragraph',
        text: '**Storage:** for a browser, put the refresh token in an `HttpOnly; Secure; SameSite=Strict` cookie scoped to `Path=/auth/refresh`, or keep it on a BFF. Keep the access token in memory only. On mobile, use the Keychain or Keystore.',
      },
      { type: 'heading3', text: 'Angular: 401 → one refresh → retry, with queueing' },
      {
        type: 'code',
        lang: 'typescript',
        code: `let refresh$: Observable<string> | null = null;   // the single refresh in flight

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const withToken = (r: HttpRequest<unknown>, t: string | null) =>
    t ? r.clone({ setHeaders: { Authorization: 'Bearer ' + t } }) : r;

  if (req.url.endsWith('/auth/refresh')) return next(req);

  return next(withToken(req, auth.accessToken())).pipe(
    catchError((err) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) return throwError(() => err);
      // Every concurrent 401 shares the same refresh call
      refresh$ ??= auth.refresh().pipe(          // POST /auth/refresh, withCredentials
        map((res) => res.accessToken),
        tap((t) => auth.accessToken.set(t)),
        finalize(() => (refresh$ = null)),
        shareReplay(1),
      );
      return refresh$.pipe(
        switchMap((t) => next(withToken(req, t))),
        catchError((e) => { auth.logout(); return throwError(() => e); }),
      );
    }),
  );
};`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Without a single shared refresh, five parallel 401s send five refresh calls with the same token. Under rotation the second call looks like reuse and logs the user out. Many servers also allow a few seconds of grace for the immediately previous token to absorb network races.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain reuse detection as "a refresh token can be used once; a second use means two parties hold it, and we cannot tell which one is the real user, so we revoke both." It is the key point of rotation.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Why not just a long-lived access token? It cannot be revoked cheaply and is sent everywhere.',
          'Why hash refresh tokens at rest? A database leak must not hand out live sessions.',
          'Refresh proactively before expiry or reactively on 401? Both work; reactive is simpler and still needed as a fallback.',
        ],
      },
    ],
  },

  'How do you revoke a JWT or log a user out before the token expires?': {
    summary:
      'You cannot change a signed token, so revocation means adding a check. The options are: very short expiry plus revocable refresh tokens; a denylist of `jti` values in Redis with a TTL equal to the remaining lifetime; a per-user `tokenVersion` claim compared with the database or cache; or opaque tokens with introspection. Every option except short expiry gives up some of the statelessness, and that trade-off is fine.',
    details: [
      { type: 'heading3', text: 'Option 1: short expiry, revoke the refresh token' },
      {
        type: 'paragraph',
        text: 'A 5-minute access token and a revocable refresh token (see rotation) cover most logouts: delete the refresh family and the user is out within minutes. This is often enough, but not for "the account is compromised, cut it off now".',
      },
      { type: 'heading3', text: 'Option 2: jti denylist in Redis' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Logout: deny this exact token until it would have expired anyway
async logout(payload: { jti: string; exp: number }) {
  const ttl = payload.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await this.redis.set('deny:' + payload.jti, '1', 'EX', ttl);
}

// In the JwtStrategy / guard, after signature verification
async validate(payload: JwtPayload) {
  if (await this.redis.exists('deny:' + payload.jti)) throw new UnauthorizedException();
  return payload;
}`,
      },
      {
        type: 'paragraph',
        text: 'The list stays small because entries expire with the tokens. The cost is one Redis call per request, and Redis becomes a dependency of authentication, so decide whether to fail closed or open if it is down.',
      },
      { type: 'heading3', text: 'Option 3: token version per user' },
      {
        type: 'numbered',
        items: [
          'Store `tokenVersion` on the user row and copy it into the token as a claim (for example `tv: 7`).',
          'On "log out everywhere", password change, role change or ban, increment it to 8.',
          'The guard compares `payload.tv` with the current version, cached in Redis or memory for a few seconds, and rejects older tokens.',
        ],
      },
      {
        type: 'paragraph',
        text: 'This revokes all of a user’s tokens with one write and needs no per-token entries. It cannot revoke a single device; for that, combine it with a session id claim (`sid`) or the denylist.',
      },
      { type: 'heading3', text: 'Option 4: opaque tokens and introspection' },
      {
        type: 'code',
        lang: 'http',
        code: `POST /oauth2/introspect
Authorization: Basic <resource-server credentials>
Content-Type: application/x-www-form-urlencoded

token=2YotnFZFEjr1zCsicMWpAA

HTTP/1.1 200 OK
{ "active": true, "sub": "u_42", "scope": "orders:read", "exp": 1767225600 }`,
      },
      {
        type: 'paragraph',
        text: 'The authorization server is the source of truth, and revocation is immediate. APIs usually cache introspection results for a short time to limit load. This is common at gateways, which can also exchange the opaque token for a short internal JWT.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Deleting the token in the browser is not logout. The token still works if it was copied. Always invalidate something on the server: the session, the refresh family, the version, or the `jti`.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: state the requirement first ("how fast must revocation take effect?"). Minutes means short expiry is enough; seconds means a version check or denylist, and you accept a fast lookup per request.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do other services learn about a revocation? A shared Redis, or publish events and keep a local cache.',
          'What about rotating the signing key? That revokes every token at once, so it is an emergency measure, not logout.',
          'Does a denylist defeat the purpose of JWTs? Partly. Verification is still local; only the revocation check is shared.',
        ],
      },
    ],
  },

  'What is OpenID Connect, and how does it differ from OAuth 2.0?': {
    summary:
      'OAuth 2.0 is delegated authorization: it lets a client get an access token to call an API on a user’s behalf, and it says nothing about who the user is. OpenID Connect is an identity layer on top of OAuth that adds authentication: an **ID token** (a signed JWT about the login event), a **UserInfo** endpoint, standard scopes and claims, discovery, and a `nonce` to bind the token to the request. Use the ID token to log the user in, and the access token only to call APIs.',
    details: [
      {
        type: 'paragraph',
        text: 'The OAuth roles and the authorization code flow are covered in the Security topic. OIDC reuses that flow; you add `openid` to the scope and get an `id_token` back from the token endpoint along with the access token.',
      },
      { type: 'heading3', text: 'What OIDC adds' },
      {
        type: 'bullets',
        items: [
          '**ID token:** a JWT for the client (the relying party), with `iss`, `sub`, `aud` (your client id), `exp`, `iat`, `nonce`, and often `auth_time`, `amr` and `acr` about how the user authenticated.',
          '**UserInfo endpoint:** called with the access token to get profile claims.',
          '**Standard scopes:** `openid` (required), `profile`, `email`, `address`, `phone`, mapping to standard claims such as `email` and `email_verified`.',
          '**Discovery:** `https://idp.example.com/.well-known/openid-configuration` lists the endpoints, supported algorithms and the `jwks_uri` holding the signing keys.',
          '**Session features:** `prompt`, `max_age` and RP-initiated logout.',
        ],
      },
      { type: 'heading3', text: 'Validating the ID token' },
      {
        type: 'numbered',
        items: [
          'Verify the signature with the key from the JWKS that matches the `kid`, and only accept the algorithms you expect (never `none`).',
          'Check that `iss` equals the exact issuer from discovery.',
          'Check that `aud` contains your client id (and `azp` if there are several audiences).',
          'Check `exp` and `iat` with a small clock skew.',
          'Check that `nonce` equals the value you stored in the session before the redirect, which blocks replay of a stolen ID token.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://idp.example.com/.well-known/jwks.json'));

async function verifyIdToken(idToken: string, expectedNonce: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: 'https://idp.example.com',
    audience: process.env.OIDC_CLIENT_ID,
    algorithms: ['RS256'],
    clockTolerance: 30,
  });
  if (payload.nonce !== expectedNonce) throw new Error('nonce mismatch');
  return { userId: payload.sub, email: payload.email };
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Never treat "I received an access token" as proof of login. An access token is meant for the API (its audience), the client should treat it as opaque, and a token issued to another app could be replayed to yours. Identify users by the validated ID token, keyed by `iss` + `sub`, not by email, which can change or be reused.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: one line that works well is "OAuth gives the app a key to the API; OIDC tells the app who is holding it." Then name the ID token, discovery and the `nonce` check.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Should the SPA send the ID token to your API? No. The API should get an access token whose audience is the API.',
          'What is `state` vs `nonce`? `state` protects the redirect from CSRF; `nonce` binds the ID token to the request.',
          'How do you handle key rotation? Cache the JWKS and refetch it when you see an unknown `kid`.',
        ],
      },
    ],
  },

  'What is PKCE, and why is it required for single-page and mobile apps?': {
    summary:
      'PKCE (Proof Key for Code Exchange) binds an authorization code to the client that started the flow. The client makes a random `code_verifier`, sends its SHA-256 hash as the `code_challenge` in the authorization request, and must present the original verifier when it exchanges the code. An attacker who intercepts the code cannot use it. Public clients such as SPAs and mobile apps have no client secret, so PKCE is their protection, and current best practice (RFC 9700) recommends it for confidential clients too.',
    details: [
      { type: 'heading3', text: 'The flow' },
      {
        type: 'numbered',
        items: [
          'The client creates a high-entropy `code_verifier` (43–128 characters) and keeps it locally (in `sessionStorage` or memory during the redirect).',
          'It computes `code_challenge = BASE64URL(SHA256(code_verifier))` and redirects to `/authorize` with `code_challenge_method=S256`, plus `state` and, for OIDC, `nonce`.',
          'The authorization server stores the challenge with the code it issues and redirects back with `?code=...&state=...`.',
          'The client posts the code together with the `code_verifier` to `/token`. The server hashes the verifier and compares it with the stored challenge, and only then issues tokens.',
        ],
      },
      {
        type: 'code',
        lang: 'http',
        code: `GET /authorize?response_type=code&client_id=spa-app
  &redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
  &scope=openid%20profile%20orders:read
  &state=af0ifjsldkj&nonce=n-0S6_WzA2Mj
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256

POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
&client_id=spa-app&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`,
      },
      { type: 'heading3', text: 'Generating the pair with Web Crypto' },
      {
        type: 'code',
        lang: 'typescript',
        code: `function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

export async function createPkcePair() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32))); // 43 chars
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}`,
      },
      { type: 'heading3', text: 'What it stops' },
      {
        type: 'paragraph',
        text: 'On mobile, another app can register the same custom URL scheme and receive the redirect. In browsers, codes can leak through logs, the `Referer` header or browser history. A static client secret does not help public clients because anyone can extract it from the bundle. PKCE uses a fresh secret per flow that never leaves the client until the token call, and only the hash travels through the front channel. With confidential clients it also helps against code injection, where a stolen code is inserted into a victim’s session.',
      },
      { type: 'heading3', text: 'Why the implicit flow is deprecated' },
      {
        type: 'bullets',
        items: [
          'It returned the access token in the URL fragment, where it could leak through history, logs and extensions.',
          'There was no sender binding and no refresh tokens, and token injection was hard to detect.',
          'Browsers now support CORS on the token endpoint, so the code flow with PKCE replaces it. Current guidance says not to use implicit or the password grant.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Always use `S256`. The `plain` method sends the verifier itself as the challenge, so it gives no protection if the authorization request is observed. Servers should reject flows that downgrade to `plain`.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: PKCE protects the code exchange, not the tokens after you receive them. An SPA with PKCE still has to keep tokens away from XSS, which is why the BFF question usually comes next.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Is `state` still needed with PKCE? Keep it for CSRF on the redirect and to restore app state.',
          'Should a backend app with a secret use PKCE? Yes, it is recommended for all clients.',
          'Mobile specifics? Use the system browser (ASWebAuthenticationSession or Custom Tabs) and claimed HTTPS redirect links, not embedded web views.',
        ],
      },
    ],
  },

  'Where should an Angular SPA keep its tokens, and how does the BFF pattern help with auth?': {
    summary:
      'Any token JavaScript can read, whether in `localStorage`, `sessionStorage` or memory, can be stolen or misused by an XSS payload. The most secure option for a browser app is a Backend-for-Frontend: a small server-side component does the OAuth flow as a confidential client, keeps the tokens on the server, and gives the browser only an HttpOnly, Secure, SameSite session cookie. Angular then calls the BFF on the same origin, and the BFF attaches the access token when it proxies to the APIs.',
    details: [
      {
        type: 'paragraph',
        text: 'The Angular security topic compares Session Storage and Local Storage. The point here is the threat model: in-memory storage hides the token from persistent theft, but injected code running in the page can still call your APIs, or intercept the token on refresh. Only keeping tokens out of the browser stops exfiltration.',
      },
      { type: 'heading3', text: 'BFF (token handler) flow' },
      {
        type: 'numbered',
        items: [
          'Angular navigates to `/bff/login`. The BFF starts the authorization code flow with PKCE and its own client secret.',
          'The IdP redirects back to `/bff/callback`. The BFF exchanges the code, validates the ID token, and stores the access and refresh tokens in a server-side session (Redis) or an encrypted cookie.',
          'The BFF sets `__Host-session=...; HttpOnly; Secure; SameSite=Strict; Path=/`.',
          'Angular calls `/bff/api/orders`. The BFF looks up the session, refreshes the access token if needed, and forwards the request with `Authorization: Bearer ...`.',
          '`/bff/user` returns the profile claims the UI needs, and `/bff/logout` clears the session and revokes the tokens.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// NestJS BFF proxy (simplified)
@Controller('bff/api')
@UseGuards(SessionGuard, CsrfGuard)
export class ApiProxyController {
  @All('*')
  async proxy(@Req() req: Request, @Res() res: Response) {
    const accessToken = await this.tokens.getFreshAccessToken(req.session); // refreshes if near expiry
    const upstream = await fetch(API_BASE + req.url.replace('/bff/api', ''), {
      method: req.method,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + accessToken },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });
    res.status(upstream.status).send(await upstream.text());
  }
}`,
      },
      { type: 'heading3', text: 'What changes in Angular' },
      {
        type: 'bullets',
        items: [
          'No token code at all: no `Authorization` interceptor, no storage, no refresh logic, no OIDC library in the bundle.',
          'Serve the app and the BFF from the same origin (or a reverse-proxy path) so the cookie is sent automatically. For a different subdomain, use `withCredentials: true` and a CORS policy that allows credentials for that exact origin.',
          'On a 401 from the BFF, redirect to `/bff/login` instead of refreshing.',
          'Use `withXsrfConfiguration()` so `HttpClient` sends the CSRF header the BFF expects.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `provideHttpClient(
  withFetch(),
  withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
);

// auth.service.ts
readonly user = toSignal(this.http.get<User | null>('/bff/user'), { initialValue: null });
login() { location.href = '/bff/login?returnTo=' + encodeURIComponent(location.pathname); }`,
      },
      {
        type: 'paragraph',
        text: '**CSRF defence** is now required because a cookie authenticates the request: `SameSite=Strict` or `Lax`, plus a custom header or double-submit token, and an `Origin` check on state-changing routes.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A BFF does not make XSS harmless. Injected script can still make requests through the BFF while the page is open. What it prevents is the attacker taking the tokens away and using them later from elsewhere. You still need CSP and output encoding.',
      },
      {
        type: 'paragraph',
        text: '**When an in-memory SPA is acceptable:** low-risk internal apps, short-lived access tokens with rotated refresh tokens, a strict CSP, and no backend you control to host a BFF. Keep the token in a service field or signal, never in storage.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: frame it as "the browser is the least trusted place for a credential". The BFF moves tokens to the server and gives the browser a session cookie, which brings you back to well-understood cookie security.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Does the BFF add latency? One extra hop, usually in the same region, and it can also aggregate calls.',
          'How does it scale? Stateless instances with sessions in Redis.',
          'How does this relate to the API-design BFF? Same idea; here its main job is security, not shaping data.',
        ],
      },
    ],
  },

  'How does single sign-on work with SAML or OIDC in an enterprise app?': {
    summary:
      'With SSO, the customer’s identity provider (Okta, Entra ID, Google Workspace) authenticates the user, and your app, the service provider or relying party, trusts a signed statement from it. With SAML that statement is an XML assertion posted to your ACS URL; with OIDC it is an ID token from the code flow. Enterprise SaaS usually supports both, routes users to the right IdP by email domain, provisions accounts just in time or through SCIM, and accepts that single logout is unreliable.',
    details: [
      { type: 'heading3', text: 'Terms' },
      {
        type: 'bullets',
        items: [
          '**IdP:** the identity provider that holds users and does the login (including MFA).',
          '**SP / RP:** your app. SAML calls it the service provider; OIDC calls it the relying party.',
          '**SP-initiated:** the user starts at your app and is redirected to the IdP. **IdP-initiated:** the user clicks your tile in the IdP portal and arrives with an unsolicited assertion.',
        ],
      },
      { type: 'heading3', text: 'SP-initiated SAML flow' },
      {
        type: 'numbered',
        items: [
          'The user enters `jane@acme.com`. You look up the tenant for `acme.com` and its SAML configuration (IdP SSO URL and signing certificate).',
          'You redirect with an `AuthnRequest` (with an id and `RelayState` for the return path).',
          'The IdP authenticates the user and the browser POSTs a `SAMLResponse` to your **ACS URL** (Assertion Consumer Service).',
          'You verify the XML signature against the configured certificate, then check `Issuer`, `Audience` (your entity id), `Destination` or `Recipient` (your ACS URL), the `NotBefore` and `NotOnOrAfter` window, and `InResponseTo` matching your request id. Store assertion ids to reject replays.',
          'You map `NameID` and attributes (email, groups) to a local user and create your own session.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'SAML parsing is where vulnerabilities live: XML signature wrapping, comment injection in `NameID`, and accepting unsigned assertions. Use a well-maintained library, require signed assertions, and read the values from the signed element only. IdP-initiated flows have no `InResponseTo`, so they are easier to replay or inject; support them only if needed and with short validity.',
      },
      { type: 'heading3', text: 'OIDC as the modern choice' },
      {
        type: 'paragraph',
        text: 'OIDC uses JSON and JWTs instead of XML, has discovery for configuration, works for mobile and APIs, and uses the same code flow with PKCE you already have. Many enterprises still require SAML, so a B2B product usually supports both, often through a broker (Auth0, Keycloak, WorkOS, Cognito) that turns either into OIDC for your app.',
      },
      { type: 'heading3', text: 'Multi-tenant "bring your own IdP"' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Post('auth/sso/start')
async start(@Body() { email }: { email: string }) {
  const domain = email.split('@')[1]?.toLowerCase();
  const conn = await this.ssoConnections.findVerifiedByDomain(domain); // domain ownership proven via DNS TXT
  if (!conn) return { method: 'password' };
  return { redirectUrl: await this.sso.buildAuthRequest(conn) };     // SAML or OIDC per tenant
}`,
      },
      { type: 'heading3', text: 'User lifecycle' },
      {
        type: 'bullets',
        items: [
          '**JIT provisioning:** create the user on first successful login from the claims. It is simple but never removes anyone.',
          '**SCIM:** the IdP pushes create, update and deactivate calls to your `/scim/v2/Users` and `/Groups` endpoints, so leavers lose access even if they never log in again.',
          'Map IdP groups to your roles per tenant, and let tenants enforce SSO only (disable passwords).',
        ],
      },
      {
        type: 'paragraph',
        text: '**Single logout** (SAML SLO, OIDC front- or back-channel logout) is unreliable in practice: it depends on every app in the chain responding, and third-party cookie blocking breaks front-channel variants. Keep your own sessions short, support back-channel logout where offered, and rely on SCIM deactivation.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention lifecycle, not just login. "SSO gets people in, SCIM gets them out" shows you have dealt with enterprise customers and their security reviews.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you link an SSO login to an existing password account? Only for a verified domain owned by the tenant, never by matching email alone.',
          'How do you handle IdP certificate rotation? Allow two certificates during the overlap, or read IdP metadata periodically.',
          'Where does MFA happen? At the IdP; check `amr` or `acr` if your policy needs proof of it.',
        ],
      },
    ],
  },

  'RBAC vs ABAC vs ReBAC: how do you model permissions?': {
    summary:
      'RBAC assigns permissions to roles and roles to users; it is simple and auditable but becomes role explosion once rules depend on context. ABAC evaluates policies over attributes of the user, resource, action and environment, which suits rules like "same department, during office hours". ReBAC derives access from relationships in a graph ("editor of the folder that contains this doc"), as in Google Zanzibar and OpenFGA. Most products combine roles for coarse access with object-level checks on the backend for every resource.',
    details: [
      {
        type: 'paragraph',
        text: 'Authentication vs authorization and Angular route guards are covered elsewhere. Authorization is enforced on the server; the UI only mirrors it to hide buttons.',
      },
      { type: 'heading3', text: 'The three models' },
      {
        type: 'bullets',
        items: [
          '**RBAC:** `admin`, `editor`, `viewer` mapped to permissions such as `invoice:approve`. Check permissions, not role names, in code, so roles can change without code changes.',
          '**ABAC:** `allow approve if user.department == invoice.department and invoice.amount < user.approvalLimit`. Very expressive, harder to audit ("who can see X?" is hard to answer).',
          '**ReBAC:** tuples such as `doc:42#parent@folder:7` and `folder:7#editor@user:jane`, plus rules like "editors of a parent folder are editors of the doc". This fits sharing, hierarchies and teams, as in Google Drive or GitHub.',
        ],
      },
      { type: 'heading3', text: 'Where the checks live' },
      {
        type: 'bullets',
        items: [
          '**In the service, with a library** such as CASL: fast and simple for one backend.',
          '**A central policy engine** such as OPA (Rego) or Cedar: policy as code, versioned and tested, shared across services and languages.',
          '**A relationship service** such as OpenFGA or SpiceDB for ReBAC: it stores the tuples and answers `check(user, relation, object)`. You must keep tuples in sync with your data.',
        ],
      },
      { type: 'heading3', text: 'NestJS: permission guard plus object-level check' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export const RequirePermission = (p: string) => SetMetadata('permission', p);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const needed = this.reflector.get<string>('permission', ctx.getHandler());
    if (!needed) return true;
    const user = ctx.switchToHttp().getRequest().user;   // set by the auth guard
    return user.permissions.includes(needed);            // coarse: may this kind of user approve at all?
  }
}

@Post('invoices/:id/approve')
@RequirePermission('invoice:approve')
async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
  const invoice = await this.invoices.findOne({ id, tenantId: user.tenantId });
  if (!invoice) throw new NotFoundException();
  // fine-grained: this specific object (ABAC/ReBAC style)
  if (!(await this.authz.can(user, 'approve', invoice))) throw new ForbiddenException();
  return this.invoices.approve(invoice, user);
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A role check alone does not stop Broken Object Level Authorization, number one in the OWASP API Security Top 10. "Is an editor" is not "may edit invoice 123". Every handler that takes an object id must check the caller’s relationship to that object, and should return 404 rather than 403 if existence itself is sensitive.',
      },
      {
        type: 'paragraph',
        text: 'For lists, push the filter into the query (`WHERE tenant_id = $1 AND (owner_id = $2 OR ...)`). Checking each row after loading breaks pagination and is slow. ReBAC engines provide a "list objects" call for the same reason.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say you start with RBAC on permissions, add attribute conditions when needed, and move to ReBAC when sharing and hierarchies appear. Then stress that object-level checks are required in every model.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you test authorization? A matrix of role × endpoint × ownership in integration tests, including negative cases.',
          'How does the Angular UI know what to show? Return the allowed actions with the resource, for example `_actions: ["approve"]`.',
          'Permissions in the JWT? Coarse ones are fine; per-object permissions do not fit and become stale.',
        ],
      },
    ],
  },

  'How do you enforce tenant isolation in a multi-tenant SaaS API?': {
    summary:
      'The tenant id must come from the verified identity (a token claim or the server session), never from the request body or a header the client controls. Isolation is then enforced as low as possible: in the data layer with Postgres Row-Level Security or repositories that always add the tenant filter. The tenant also has to be part of cache keys, queues, file paths, rate limits, logs and metrics, and automated tests should actively try cross-tenant access.',
    details: [
      { type: 'heading3', text: 'Isolation models' },
      {
        type: 'bullets',
        items: [
          '**Pool (shared tables + `tenant_id`):** cheapest and easiest to operate; isolation depends on correct filtering everywhere.',
          '**Schema or database per tenant:** stronger isolation and easier per-tenant restore, but costly with many tenants and harder to migrate.',
          '**Hybrid:** pooled by default, dedicated for large or regulated customers.',
        ],
      },
      { type: 'heading3', text: 'Request path' },
      {
        type: 'numbered',
        items: [
          'The auth guard verifies the token and reads `tenantId` from the claims. If the user belongs to several tenants, the requested tenant is checked against the user’s memberships.',
          'The tenant is put in request-scoped context (`AsyncLocalStorage`) so lower layers can read it without passing it around.',
          'The data layer applies it: RLS in Postgres or a scoped repository. A missing tenant fails closed.',
        ],
      },
      {
        type: 'code',
        lang: 'sql',
        code: `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;   -- applies to the table owner too

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Run each request's queries in a transaction with the tenant set locally
async withTenant<T>(fn: (tx: EntityManager) => Promise<T>): Promise<T> {
  const tenantId = this.ctx.get().tenantId;          // from AsyncLocalStorage, set by the guard
  if (!tenantId) throw new ForbiddenException('no tenant');
  return this.dataSource.transaction(async (tx) => {
    await tx.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]); // true = local to tx
    return fn(tx);
  });
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'With connection pooling, a session-level `SET` leaks the tenant to the next request that uses the connection. Use transaction-local settings, and make sure the application role does not have `BYPASSRLS` and is not the superuser.',
      },
      { type: 'heading3', text: 'Beyond the database' },
      {
        type: 'bullets',
        items: [
          '**Caches:** `tenant:{id}:invoice:{invoiceId}`. A key without the tenant is a data leak waiting to happen.',
          '**Object storage:** prefix keys with the tenant and generate presigned URLs only after an authorization check.',
          '**Queues and jobs:** carry the tenant id in the message and restore the context in the worker.',
          '**Search indexes:** filter by tenant in every query, or use an index per tenant.',
          '**Rate limits and quotas per tenant**, so one customer’s batch import cannot starve the others (noisy neighbours). Add per-tenant concurrency limits on expensive jobs, and dedicated capacity for the largest tenants.',
          '**Observability:** tag logs, traces and metrics with `tenant_id` so you can see per-tenant errors and usage, without logging customer data.',
        ],
      },
      { type: 'heading3', text: 'Prove it with tests' },
      {
        type: 'code',
        lang: 'typescript',
        code: `it('does not let tenant B read tenant A invoices', async () => {
  const inv = await seedInvoice({ tenantId: tenantA });
  await request(app.getHttpServer())
    .get('/invoices/' + inv.id)
    .set('Authorization', 'Bearer ' + tokenFor(userInTenantB))
    .expect(404);
});`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "defence in depth": the tenant comes from the token, scoped repositories apply it, and RLS is a safety net if a developer forgets a filter. Mention cache keys too; many real leaks happen there.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do support staff access tenants? Through an explicit, audited, time-limited impersonation flow.',
          'How do you run migrations with schema-per-tenant? With a tracked runner that applies them to each schema in batches.',
          'How do you encrypt per tenant? Envelope encryption with a key per tenant in a KMS.',
        ],
      },
    ],
  },

  'How do you add MFA and passkeys (WebAuthn) to a login flow?': {
    summary:
      'MFA combines factors from different categories: something you know, something you have, something you are. TOTP codes are a common second factor but can be phished, because a fake site can relay the code in real time. Passkeys (WebAuthn) are phishing-resistant: the browser binds each credential to the site’s origin and the private key never leaves the authenticator. Implement registration and authentication as challenge–response ceremonies verified on the server with a library such as `@simplewebauthn/server`, and plan recovery and step-up authentication from the start.',
    details: [
      { type: 'heading3', text: 'Factor options, weakest to strongest' },
      {
        type: 'bullets',
        items: [
          '**SMS or email codes:** better than nothing, but open to SIM swaps and phishing.',
          '**TOTP (RFC 6238):** a shared secret plus the current 30-second window generates a 6-digit code in an authenticator app. It works offline, but an attacker-in-the-middle page can ask for the code and replay it immediately. Store the secret encrypted, allow a ±1 step window, and reject a code that was already used.',
          '**Push approval:** convenient, but users approve prompts they did not start ("MFA fatigue"); number matching reduces this.',
          '**WebAuthn and passkeys:** public-key credentials scoped to your RP id (domain). A phishing domain cannot get a valid signature because the browser includes the real origin and only uses credentials registered for that domain.',
        ],
      },
      { type: 'heading3', text: 'Registration ceremony' },
      {
        type: 'numbered',
        items: [
          'The logged-in user clicks "Add a passkey". The server generates options with a random challenge, the RP id and name, the user handle, and the existing credentials to exclude, and stores the challenge in the session.',
          'The browser calls `navigator.credentials.create({ publicKey })`. The authenticator creates a key pair after user verification (biometric or PIN).',
          'The server verifies the response (challenge, origin, RP id hash, attestation if required) and stores the credential id, public key, counter and transports.',
        ],
      },
      { type: 'heading3', text: 'Authentication ceremony' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

@Post('webauthn/login/options')
async options(@Session() s: SessionData) {
  const opts = await generateAuthenticationOptions({ rpID: 'app.example.com', userVerification: 'preferred' });
  s.webauthnChallenge = opts.challenge;               // single use
  return opts;
}

@Post('webauthn/login/verify')
async verify(@Body() body: AuthenticationResponseJSON, @Session() s: SessionData) {
  const cred = await this.creds.findById(body.id);
  if (!cred) throw new UnauthorizedException();
  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: s.webauthnChallenge!,
    expectedOrigin: 'https://app.example.com',
    expectedRPID: 'app.example.com',
    credential: { id: cred.id, publicKey: cred.publicKey, counter: cred.counter },
  });
  delete s.webauthnChallenge;
  if (!verified) throw new UnauthorizedException();
  await this.creds.updateCounter(cred.id, authenticationInfo.newCounter);
  return this.sessions.startFor(cred.userId, { amr: ['webauthn'] });
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Angular side, using @simplewebauthn/browser
import { startAuthentication } from '@simplewebauthn/browser';

async loginWithPasskey() {
  const optionsJSON = await firstValueFrom(this.http.post<any>('/auth/webauthn/login/options', {}));
  const assertion = await startAuthentication({ optionsJSON }); // wraps navigator.credentials.get
  await firstValueFrom(this.http.post('/auth/webauthn/login/verify', assertion));
}`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Recovery is the weak point. If a lost phone can be bypassed by "email me a link", your MFA is only as strong as the email account. Offer one-time recovery codes (stored hashed), encourage a second passkey, and make support-driven resets slow and verified.',
      },
      { type: 'heading3', text: 'Step-up authentication' },
      {
        type: 'paragraph',
        text: 'Record when and how the user last authenticated (`auth_time`, `amr`) in the session. For sensitive actions such as changing the email, adding a payout account or deleting the workspace, require a fresh factor within the last few minutes, and return a specific error that Angular handles by opening a re-authentication dialog and then retrying. With an external IdP, request it with `max_age` or `acr_values`.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain why passkeys resist phishing in one sentence: "the browser signs a challenge that includes the real origin, so a look-alike domain gets nothing usable". That is what separates them from every code-based factor.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Synced vs device-bound passkeys? Synced ones are easier to recover; device-bound ones suit high-assurance needs.',
          'Can passkeys replace passwords entirely? Yes for many users. Keep a fallback during rollout and use conditional UI (autofill) for discovery.',
          'Rate limits? Limit attempts on TOTP and recovery codes, since 6 digits can be brute-forced otherwise.',
        ],
      },
    ],
  },
};
