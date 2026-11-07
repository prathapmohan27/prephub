import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'common-node-js-vulnerabilities': {
    summary:
      'Mostly the OWASP Top 10 applied to Node: **injection** (SQL, NoSQL, command, path traversal), **broken authentication/authorization** (weak JWT handling, missing ownership checks — IDOR), **vulnerable dependencies** (npm supply chain), **XSS**, **SSRF**, **insecure configuration** (missing headers, verbose errors, permissive CORS, secrets in code), **prototype pollution**, and **denial of service** — including ReDoS and event-loop blocking, which hit Node especially hard because of its single thread.',
    details: [
      {
        type: 'paragraph',
        text: 'Node apps share the classic web risks, but a few are amplified by the platform: a huge transitive dependency tree, dynamic objects that can be polluted through `__proto__`, and a single event loop where one expensive regex or `JSON.parse` of a 100 MB body stalls every user.',
      },
      { type: 'heading3', text: 'Injection' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ SQL injection
db.query(\`SELECT * FROM users WHERE email = '\${req.body.email}'\`);
// ✅ parameterised
db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);

// ❌ Command injection — shell interprets "; rm -rf /"
exec(\`convert \${req.query.file} out.png\`);
// ✅ no shell, args as array
execFile('convert', [req.query.file, 'out.png']);

// ❌ Path traversal — ?name=../../etc/passwd
res.sendFile(path.join(__dirname, 'files', req.query.name));
// ✅ resolve and verify it stays inside the base dir
const base = path.resolve('files');
const target = path.resolve(base, req.query.name);
if (!target.startsWith(base + path.sep)) return res.sendStatus(400);`,
      },
      { type: 'heading3', text: 'Broken access control (IDOR)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Any logged-in user can read any invoice by changing the id
app.get('/invoices/:id', auth, async (req, res) => res.json(await Invoice.findById(req.params.id)));

// ✅ Scope every query to the caller
app.get('/invoices/:id', auth, async (req, res) => {
  const inv = await Invoice.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!inv) return res.sendStatus(404);
  res.json(inv);
});`,
      },
      { type: 'heading3', text: 'Node-specific: prototype pollution and ReDoS' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Prototype pollution: naive deep merge of user JSON
merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
({}).isAdmin; // true — every object in the process is now "admin"
// ✅ use maintained libs, reject __proto__/constructor/prototype keys,
//    Object.create(null) for maps, or node --disable-proto=delete

// ReDoS: catastrophic backtracking blocks the event loop
/^(a+)+$/.test('a'.repeat(30) + '!'); // takes seconds — the whole server freezes
// ✅ avoid nested quantifiers, limit input length, use a safe-regex linter`,
      },
      { type: 'heading3', text: 'The rest of the list' },
      {
        type: 'bullets',
        items: [
          '**Vulnerable/malicious dependencies** — `npm audit`, Dependabot/Renovate, Snyk/Socket, commit the lockfile, use `npm ci`, review install scripts.',
          '**XSS** — escape output (template engines do by default), sanitise HTML with DOMPurify, set a Content-Security-Policy.',
          '**SSRF** — server fetches a user-supplied URL and hits `169.254.169.254` (cloud metadata) or internal services; allow-list hosts and block private IP ranges.',
          '**Weak auth** — plaintext/fast-hashed passwords, JWT `alg: none` or unverified tokens, no rate limit on login, session fixation.',
          "**Security misconfiguration** — no helmet headers, `cors({ origin: '*', credentials: true })`, stack traces in responses, debug/inspector port exposed.",
          '**Secrets** in source or images — use environment/secret managers and scan repos.',
          "**DoS** — no body size limits (`express.json({ limit: '100kb' })`), no rate limiting, no timeouts, unbounded pagination.",
          '**Insecure deserialization** — never `eval` or use `node-serialize`-style libraries on untrusted input.',
          '**Logging sensitive data** — passwords, tokens, PII in logs.',
        ],
      },
      {
        type: 'flow',
        title: 'Defence in depth for a Node API',
        code: `flowchart LR
  U["Client"]:::client --> E["Edge: WAF,<br/>TLS, rate limit"]:::security
  E --> M["helmet, CORS,<br/>body limits"]:::security
  M --> A["AuthN + AuthZ<br/>ownership checks"]:::security
  A --> V["Input validation<br/>(schemas)"]:::highlight
  V --> S["Service logic"]:::server
  S --> D[("DB with<br/>parameterised queries,<br/>least privilege")]:::db`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Structure your interview answer by layers — input (validation, injection), identity (authN/authZ), dependencies (supply chain), configuration (headers, CORS, secrets) and availability (rate limits, ReDoS, timeouts). It shows a systematic mindset rather than a random list.',
      },
    ],
  },

  'authentication-vs-authorization': {
    summary:
      '**Authentication** (AuthN) verifies **who** you are — password, OAuth/OIDC login, API key, certificate, MFA. **Authorization** (AuthZ) decides **what** an authenticated identity is allowed to do — roles, permissions, resource ownership, policies. Authentication always comes first; failing it is HTTP 401, failing authorization is HTTP 403.',
    details: [
      {
        type: 'paragraph',
        text: 'An airport analogy: showing your passport at security is authentication (proves identity). Your boarding pass deciding which plane and seat you may board is authorization. Having a valid passport does not let you board any plane.',
      },
      { type: 'heading3', text: 'In code: two separate middleware steps' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Authentication: establish identity
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    req.user = await verifyJwt(token); // { id: 7, roles: ['editor'] }
    next();
  } catch {
    res.status(401).json({ error: 'Not authenticated' }); // who are you?
  }
}

// Authorization: role-based (RBAC)
const requireRole = (role) => (req, res, next) =>
  req.user.roles.includes(role) ? next() : res.status(403).json({ error: 'Forbidden' });

// Authorization: resource-based (ownership)
app.put('/posts/:id', authenticate, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.sendStatus(404);
  if (post.authorId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.sendStatus(403); // I know who you are, but it's not your post
  }
  res.json(await post.update(req.body));
});

app.delete('/users/:id', authenticate, requireRole('admin'), deleteUser);`,
      },
      {
        type: 'flow',
        title: 'Request checks in order',
        code: `flowchart LR
  R["Request"]:::client --> AN{"Authentication<br/>valid credentials?"}:::security
  AN -->|No| E401["401 Unauthorized"]:::external
  AN -->|Yes| AZ{"Authorization<br/>allowed on this resource?"}:::security
  AZ -->|No| E403["403 Forbidden"]:::external
  AZ -->|Yes| H["Handler"]:::server`,
      },
      { type: 'heading3', text: 'Common models' },
      {
        type: 'bullets',
        items: [
          '**AuthN methods**: session cookies, JWT bearer tokens, OAuth 2.0 + OpenID Connect (Google/Okta/Auth0/Cognito), API keys, mTLS, passkeys/WebAuthn, MFA/TOTP.',
          '**RBAC** — role-based: users get roles, roles grant permissions (`admin`, `editor`).',
          '**ABAC / policy-based** — decisions on attributes: department, resource owner, time, region (e.g. CASL, Casbin, OPA).',
          '**ReBAC** — relationship-based (Google Zanzibar style: "can view if member of the folder\'s team"), e.g. OpenFGA.',
          'OAuth 2.0 itself is a **delegated authorization** protocol; OpenID Connect adds the **authentication** layer (ID token).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'The most common real bug is checking authentication but forgetting authorization on a specific resource (IDOR — Broken Object Level Authorization, #1 in the OWASP API Top 10). Enforce authorization on the server for every request; hiding a button in the UI is not authorization.',
      },
    ],
  },

  'how-jwt-authentication-works': {
    summary:
      'A JSON Web Token is a compact, URL-safe token of three base64url parts — `header.payload.signature`. The server signs claims (user id `sub`, roles, `exp`) with a secret (HS256) or private key (RS256/ES256); later, any service holding the key can verify the signature and expiry **without a database lookup**, making auth stateless. The payload is only encoded, not encrypted, so never put secrets in it.',
    details: [
      {
        type: 'paragraph',
        text: 'Typical flow: the user logs in with credentials; the server verifies them and returns a short-lived access token (and usually a refresh token). The client sends `Authorization: Bearer <token>` on each request; the API verifies the signature and claims and trusts the identity inside. Because verification needs only the key, it scales well across microservices.',
      },
      { type: 'heading3', text: 'Anatomy of a token' },
      {
        type: 'code',
        lang: 'json',
        code: `// Header
{ "alg": "HS256", "typ": "JWT" }

// Payload (claims)
{
  "sub": "user_42",          // subject: who
  "roles": ["editor"],
  "iss": "https://auth.example.com",  // issuer
  "aud": "orders-api",       // intended audience
  "iat": 1730800000,         // issued at
  "exp": 1730800900          // expires in 15 minutes
}

// Signature = HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)
// Token: eyJhbGciOi...  .  eyJzdWIiOi...  .  SflKxwRJSM...`,
      },
      { type: 'heading3', text: 'Issuing and verifying in Node (jsonwebtoken)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET; // long random value from a secret manager

// Login
app.post('/login', async (req, res) => {
  const user = await verifyCredentials(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = jwt.sign({ sub: user.id, roles: user.roles }, SECRET, {
    expiresIn: '15m', issuer: 'auth.example.com', audience: 'orders-api',
  });
  res.json({ accessToken });
});

// Verify middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET, {
      algorithms: ['HS256'],          // pin the algorithm!
      issuer: 'auth.example.com',
      audience: 'orders-api',
    });
    next();
  } catch (err) {
    res.status(401).json({ error: err.name }); // TokenExpiredError, JsonWebTokenError
  }
}`,
      },
      {
        type: 'flow',
        title: 'Access + refresh token flow',
        code: `sequenceDiagram
  participant C as Client
  participant A as Auth server
  participant API as Resource API
  C->>A: POST /login (credentials)
  A-->>C: access token (15m) + refresh token (HttpOnly cookie)
  C->>API: GET /orders with Bearer access token
  API->>API: verify signature, exp, aud
  API-->>C: 200 orders
  C->>API: later: request with expired token
  API-->>C: 401 TokenExpired
  C->>A: POST /refresh (cookie)
  A-->>C: new access token + rotated refresh token`,
      },
      { type: 'heading3', text: 'Pros, cons and best practices' },
      {
        type: 'bullets',
        items: [
          '**Pros**: stateless and fast to verify, works across services/domains, self-contained claims, standard (RFC 7519).',
          '**Cons**: hard to revoke before expiry, can grow large (sent on every request), stale claims (role changes take effect only on refresh).',
          '**HS256 vs RS256**: HS256 uses one shared secret (everyone who verifies can also sign); RS256/ES256 sign with a private key and verify with a public key published via JWKS — better for multiple services.',
          '**Storage on the web**: an `HttpOnly; Secure; SameSite` cookie protects against XSS token theft (then add CSRF protection); `localStorage` is readable by any injected script.',
          '**Revocation**: short expiry + refresh-token rotation; for immediate logout, a denylist by `jti` or a per-user token version.',
          '**Validate** `exp`, `iss`, `aud` and the algorithm; reject `alg: none`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Anyone can read a JWT payload — paste one into jwt.io. Never put passwords, PII or secrets in it. And `jwt.decode()` does NOT verify anything; always use `jwt.verify()` with pinned algorithms on the server.',
      },
    ],
  },

  'how-oauth-2-0-works': {
    summary:
      "OAuth 2.0 is a **delegated authorization** framework: it lets an application obtain a limited-scope **access token** to act on a user's behalf at another service, without ever seeing the user's password. The user authenticates with the **authorization server** and consents; the app gets a code that it exchanges for tokens. The recommended flow for web, SPA and mobile apps is **Authorization Code with PKCE**; **Client Credentials** is for machine-to-machine. For login (identity) you use **OpenID Connect**, built on top of OAuth.",
    details: [
      {
        type: 'paragraph',
        text: 'Before OAuth, apps asked for your Gmail password to import contacts — giving them full access forever. OAuth replaces that with scoped, revocable, expiring tokens. Four roles: **Resource Owner** (the user), **Client** (the app), **Authorization Server** (e.g. Google, Auth0, Keycloak — issues tokens) and **Resource Server** (the API that accepts tokens).',
      },
      {
        type: 'flow',
        title: 'Authorization Code flow with PKCE',
        code: `sequenceDiagram
  participant U as User (browser)
  participant App as Client app
  participant AS as Authorization server
  participant API as Resource server
  App->>App: create code_verifier + code_challenge
  App->>U: redirect to /authorize (client_id, scope, state, code_challenge)
  U->>AS: log in + consent
  AS->>U: redirect to callback with code + state
  U->>App: code + state
  App->>AS: POST /token (code, code_verifier, client secret if confidential)
  AS-->>App: access_token + refresh_token (+ id_token with OIDC)
  App->>API: request with Bearer access_token
  API-->>App: protected data`,
      },
      { type: 'heading3', text: 'Implementing the callback in Node (Express)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import crypto from 'node:crypto';

const b64url = (buf) => buf.toString('base64url');

app.get('/login', (req, res) => {
  const state = b64url(crypto.randomBytes(16));          // CSRF protection
  const verifier = b64url(crypto.randomBytes(32));       // PKCE
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  req.session.oauth = { state, verifier };

  const url = new URL('https://auth.example.com/authorize');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.CLIENT_ID,
    redirect_uri: 'https://app.example.com/callback',
    scope: 'openid profile email orders:read',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  res.redirect(url.toString());
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (state !== req.session.oauth?.state) return res.status(400).send('Invalid state');

  const tokenRes = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://app.example.com/callback',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET, // confidential (server-side) client
      code_verifier: req.session.oauth.verifier,
    }),
  });
  const { access_token, refresh_token, id_token } = await tokenRes.json();
  // Validate id_token (signature, iss, aud, nonce) → create your own session
  req.session.tokens = { access_token, refresh_token };
  res.redirect('/');
});
// In practice use a certified library: openid-client, Passport strategies, Auth.js`,
      },
      { type: 'heading3', text: 'Grant types' },
      {
        type: 'bullets',
        items: [
          '**Authorization Code + PKCE** — the default for web apps, SPAs and mobile apps.',
          '**Client Credentials** — service-to-service, no user involved (`grant_type=client_credentials`).',
          '**Refresh Token** — get a new access token without user interaction.',
          '**Device Authorization** — TVs/CLIs: show a code, user approves on their phone.',
          '**Implicit** and **Resource Owner Password** — deprecated (OAuth 2.1 drops them); do not use.',
        ],
      },
      { type: 'heading3', text: 'OAuth vs OpenID Connect' },
      {
        type: 'bullets',
        items: [
          'OAuth answers "may this app access this API?" — the access token is meant for the API, not for the app to learn who the user is.',
          'OIDC adds the `openid` scope, an **ID token** (a JWT with `sub`, `email`, `name`), a `/userinfo` endpoint and discovery — that is "Sign in with Google".',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: "Key security points interviewers look for: always validate `state` (CSRF), use PKCE even for confidential clients, register exact redirect URIs, request minimal scopes, keep tokens server-side (BFF pattern) for SPAs where possible, and validate tokens' `aud` at the resource server.",
      },
    ],
  },

  'store-passwords-securely': {
    summary:
      "Never store passwords or reversible encryptions of them — store a **slow, salted, one-way hash** made with a password hashing function: **Argon2id** (preferred), **scrypt** (built into `node:crypto`) or **bcrypt** (cost ≥ 10–12). Each hash includes a unique random salt; verify with the library's compare function, which is constant-time. Never use fast hashes like MD5, SHA-1 or plain SHA-256.",
    details: [
      {
        type: 'paragraph',
        text: 'Assume the database will leak one day. Fast hashes can be brute-forced at billions of guesses per second on GPUs, and unsalted hashes fall to precomputed rainbow tables. Password hashing functions are deliberately slow and (for Argon2/scrypt) memory-hard, so each guess costs the attacker real time and RAM, and the per-user salt means identical passwords produce different hashes.',
      },
      { type: 'heading3', text: 'Option 1: Argon2id (npm argon2)' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import argon2 from 'argon2';

// Register
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19456, // KiB (~19 MiB) — OWASP baseline
  timeCost: 2,
  parallelism: 1,
});
// '$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>' — params + salt stored inside

// Login
const ok = await argon2.verify(user.passwordHash, password);`,
      },
      { type: 'heading3', text: 'Option 2: bcrypt' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import bcrypt from 'bcrypt'; // or bcryptjs (pure JS, slower)

const hash = await bcrypt.hash(password, 12); // cost 12 → 2^12 rounds, ~250ms
// '$2b$12$<22-char salt><31-char hash>'

const ok = await bcrypt.compare(password, user.passwordHash);

// Note: bcrypt only uses the first 72 bytes of the password.`,
      },
      { type: 'heading3', text: 'Option 3: scrypt, no dependency' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64, { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return \`scrypt$\${salt.toString('hex')}$\${key.toString('hex')}\`;
}

export async function verifyPassword(password, stored) {
  const [, saltHex, keyHex] = stored.split('$');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length, {
    N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected); // constant-time comparison
}`,
      },
      {
        type: 'flow',
        title: 'Register and login',
        code: `flowchart LR
  P["Plain password"]:::client --> H["Argon2id / bcrypt<br/>+ random salt"]:::security
  H --> DB[("Store only<br/>hash string")]:::db
  L["Login attempt"]:::client --> V["verify(hash, attempt)<br/>constant-time"]:::security
  DB --> V
  V -->|match| OK["Create session"]:::server
  V -->|no match| NO["401 generic error"]:::external`,
      },
      { type: 'heading3', text: 'Around the hash' },
      {
        type: 'bullets',
        items: [
          '**Tune cost** so hashing takes roughly 100–500 ms on your hardware; re-hash on login when you raise parameters (`argon2.needsRehash`).',
          '**Hashing is CPU-heavy** — the native libraries run it on the libuv thread pool, so use the async APIs; never the `Sync` variants in a server.',
          '**Rate-limit login** and lock/slow down after failures; add MFA.',
          '**Generic errors** ("Invalid email or password") to avoid account enumeration.',
          '**Password policy**: length over complexity (NIST: min 8, allow 64+), check against breached-password lists (e.g. HIBP k-anonymity API).',
          'Optional **pepper**: a secret kept outside the DB (e.g. HMAC the password with a key in a KMS) so a DB-only leak is useless.',
          'Never log request bodies containing passwords.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Encryption is not hashing: if you can decrypt passwords, so can an attacker who steals the key. And "SHA-256 with a salt" is still too fast — the answer interviewers want is an adaptive function such as Argon2id or bcrypt.',
      },
    ],
  },

  'prevent-sql-injection': {
    summary:
      'SQL injection happens when user input is concatenated into a SQL string, so the input is executed as SQL — letting an attacker read or modify any data, bypass login, or even run commands. The fix is to never build SQL from strings: use **parameterised queries / prepared statements** (or an ORM/query builder that does it for you), **allow-list** anything that cannot be a parameter (column names, sort direction), validate input, and run the app with a **least-privilege** DB user.',
    details: [
      {
        type: 'paragraph',
        text: "With parameterised queries, the SQL text and the values travel to the database separately. The database parses the query structure first, then binds the values as pure data — so `' OR 1=1 --` is just a strange string, never SQL syntax.",
      },
      { type: 'heading3', text: 'The attack' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Vulnerable login
const sql = \`SELECT * FROM users
             WHERE email = '\${email}' AND password_hash = '\${hash}'\`;

// Attacker sends email:  admin@example.com' --
// Query becomes:
//   SELECT * FROM users WHERE email = 'admin@example.com' --' AND password_hash = '...'
// Everything after -- is a comment → logged in as admin without a password.

// Or:  ' UNION SELECT card_number, cvv, null FROM payments --  → data exfiltration`,
      },
      { type: 'heading3', text: 'Fix 1: parameterised queries' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// node-postgres — $1, $2 placeholders
const { rows } = await pool.query(
  'SELECT id, email FROM users WHERE email = $1 AND tenant_id = $2',
  [email, tenantId],
);

// mysql2 — ? placeholders with execute() (server-side prepared statement)
const [users] = await conn.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);

// Tagged-template libraries parameterise automatically (e.g. postgres.js)
const users2 = await sql\`SELECT * FROM users WHERE email = \${email}\`; // safe: becomes $1`,
      },
      { type: 'heading3', text: 'Fix 2: ORMs and query builders (mind the raw escape hatches)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Prisma — safe
await prisma.user.findUnique({ where: { email } });
await prisma.$queryRaw\`SELECT * FROM users WHERE email = \${email}\`;      // ✅ parameterised
await prisma.$queryRawUnsafe(\`SELECT * FROM users WHERE email = '\${email}'\`); // ❌ injectable

// TypeORM / Knex
await repo.createQueryBuilder('u').where('u.email = :email', { email }).getOne(); // ✅
await knex('users').where({ email });                                              // ✅
await knex.raw(\`SELECT * FROM users WHERE email = '\${email}'\`);                 // ❌`,
      },
      { type: 'heading3', text: 'Fix 3: allow-list identifiers' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Placeholders work for VALUES only — not for column names, table names, ASC/DESC
const SORTABLE = new Set(['created_at', 'price', 'name']);
const column = SORTABLE.has(req.query.sort) ? req.query.sort : 'created_at';
const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC';

await pool.query(\`SELECT * FROM products ORDER BY \${column} \${dir} LIMIT $1\`, [limit]);`,
      },
      {
        type: 'bullets',
        items: [
          "**Least privilege**: the app's DB user should not own the schema, drop tables or read other tenants' data (consider row-level security).",
          '**Validate** types and formats at the edge (Zod, class-validator) — defence in depth, not the primary fix.',
          "**Don't leak DB errors** to clients; they help attackers map your schema.",
          'Second-order injection: data stored safely can be injected later if another query concatenates it — parameterise everywhere.',
          'Test with tools like sqlmap / DAST scanners and lint for string-built queries.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Manual escaping or stripping quotes is not a fix — encodings, numeric contexts and edge cases defeat it. And remember the template-literal trap: a tagged template (the `sql` tag written directly before the template literal) is safe, but the same template literal without the tag is plain string concatenation.',
      },
    ],
  },

  'prevent-nosql-injection-in-mongodb': {
    summary:
      'NoSQL injection in MongoDB usually means **operator injection**: a client sends an object such as `{"$ne": null}` or `{"$gt": ""}` where you expected a string, changing the meaning of the query (e.g. bypassing login). Prevent it by **validating types with a schema** (Zod/Joi/class-validator) so fields are plain strings, casting values (`String(x)`), stripping keys starting with `$` or containing `.`, enabling Mongoose\'s `sanitizeFilter`, and never using `$where`/`$function`/`$accumulator` with user input.',
    details: [
      {
        type: 'paragraph',
        text: 'Because MongoDB queries are objects, and `express.json()` (or the `qs` query parser for `?user[$ne]=x`) turns client input into nested objects, an attacker can supply operators instead of values. No string concatenation is needed for this to go wrong.',
      },
      { type: 'heading3', text: 'The attack' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ Vulnerable login
app.post('/login', async (req, res) => {
  const user = await db.collection('users').findOne({
    username: req.body.username,
    password: req.body.password,   // (also: never store plaintext passwords!)
  });
  if (user) return res.json(createSession(user));
  res.sendStatus(401);
});

// Attacker posts JSON:
// { "username": "admin", "password": { "$ne": null } }
// Query: { username: 'admin', password: { $ne: null } } → matches → logged in as admin

// Same via query string with Express's extended parser:
// GET /users?email[$regex]=.*   → returns every user`,
      },
      { type: 'heading3', text: 'Fix 1: validate the shape and types' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
}).strict();

app.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.sendStatus(400);   // { $ne: null } is not a string
  const { username, password } = parsed.data;

  const user = await User.findOne({ username });      // look up by username only
  if (!user || !(await argon2.verify(user.passwordHash, password))) return res.sendStatus(401);
  res.json(createSession(user));
});`,
      },
      { type: 'heading3', text: 'Fix 2: sanitise operators' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Mongoose: wrap filter values containing $-keys in $eq automatically
mongoose.set('sanitizeFilter', true);
// or per query
await User.find({ email: req.query.email }).setOptions({ sanitizeFilter: true });
// Explicitly trust a filter you built yourself:
await User.find({ age: mongoose.trusted({ $gte: 18 }) });

// Cast to a primitive when you expect one
await User.findOne({ email: String(req.body.email) });

// Explicit $eq also neutralises operator objects
await db.collection('users').findOne({ email: { $eq: req.body.email } });

// Generic helper: reject $-prefixed or dotted keys anywhere in input
function hasOperators(value) {
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([k, v]) => k.startsWith('$') || k.includes('.') || hasOperators(v),
    );
  }
  return false;
}`,
      },
      { type: 'heading3', text: 'More defences' },
      {
        type: 'bullets',
        items: [
          "**Never** pass user input to `$where`, `$function`, `$accumulator` or `mapReduce` — they run JavaScript on the server. Disable server-side JS (`security.javascriptEnabled: false`) if you don't need it.",
          '**Regex input**: escape user strings before building `$regex` (and limit length) to avoid both injection and ReDoS.',
          'Don\'t pass `req.body` directly into `create()`/`updateOne()` — use DTOs/allow-lists to prevent mass assignment (`role: "admin"`) and `$set`/`$unset` injection in updates.',
          "Use the simple query parser (`app.set('query parser', 'simple')` — the default in Express 5) if you don't need nested query objects.",
          'Middleware like `express-mongo-sanitize` strips `$` keys, but check compatibility with your Express version (Express 5 made `req.query` a getter); schema validation is the more robust fix.',
          'Least-privilege database users and authentication enabled on MongoDB.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Point out that "MongoDB has no SQL so no injection" is a myth. The core lesson is the same as for SQL: never let untrusted input decide the **structure** of a query — only its values, and only after type validation.',
      },
    ],
  },

  'configure-cors-in-node-js': {
    summary:
      'CORS (Cross-Origin Resource Sharing) is a browser mechanism that relaxes the **Same-Origin Policy**: by default, JavaScript on `https://app.com` cannot read responses from `https://api.com`. The API opts in by sending headers such as `Access-Control-Allow-Origin`, and for "non-simple" requests the browser first sends a **preflight** `OPTIONS` request. In Node, use the `cors` middleware (or `app.enableCors()` in NestJS) with an explicit allow-list of origins.',
    details: [
      {
        type: 'paragraph',
        text: "An origin is scheme + host + port. CORS is enforced **by the browser**, not the server: the server still receives and processes the request, the browser just refuses to hand the response to the page's JavaScript. That means CORS is not an access-control mechanism for your API — curl, Postman and other servers ignore it. It exists to protect users' browsers and their cookies.",
      },
      {
        type: 'flow',
        title: 'Preflighted request',
        code: `sequenceDiagram
  participant B as Browser (app.example.com)
  participant API as api.example.com
  B->>API: OPTIONS /orders (Origin, Access-Control-Request-Method PUT, Request-Headers authorization)
  API-->>B: 204 with Allow-Origin, Allow-Methods, Allow-Headers, Max-Age
  Note over B: Preflight OK, cached for Max-Age
  B->>API: PUT /orders/7 (Origin, Authorization)
  API-->>B: 200 with Access-Control-Allow-Origin
  Note over B: JS can read the response`,
      },
      { type: 'heading3', text: 'Simple vs preflighted requests' },
      {
        type: 'bullets',
        items: [
          '**Simple**: GET/HEAD/POST with only safelisted headers and `Content-Type` of `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded` — sent directly, the response is checked.',
          '**Preflighted**: anything else — PUT/PATCH/DELETE, `Content-Type: application/json`, an `Authorization` header or custom headers.',
          "Cookies are only sent cross-origin with `credentials: 'include'` (fetch) and only accepted if the server returns `Access-Control-Allow-Credentials: true` with a **specific** origin — never `*`.",
        ],
      },
      { type: 'heading3', text: 'Express with the cors package' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import cors from 'cors';

const allowList = new Set([
  'https://app.example.com',
  'https://admin.example.com',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:4200'] : []),
]);

app.use(cors({
  origin(origin, cb) {
    // Requests without Origin (curl, server-to-server, same-origin) are allowed through
    if (!origin || allowList.has(origin)) return cb(null, true);
    cb(null, false); // no CORS headers → browser blocks the response
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],  // response headers JS may read
  credentials: true,                  // allow cookies
  maxAge: 600,                        // cache preflight for 10 minutes
}));`,
      },
      { type: 'heading3', text: 'What the middleware does under the hood' },
      {
        type: 'code',
        lang: 'javascript',
        code: `app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowList.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin'); // caches must key on Origin
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    return res.sendStatus(204);
  }
  next();
});`,
      },
      { type: 'heading3', text: 'NestJS' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const app = await NestFactory.create(AppModule);
app.enableCors({
  origin: ['https://app.example.com', /\\.example\\.com$/],
  credentials: true,
});`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Dangerous patterns: reflecting any `Origin` back with `credentials: true` (any website can then make authenticated calls as your users), sloppy regexes like `/example\\.com/` that also match `example.com.evil.io`, and trusting the `null` origin. Also, CORS is not CSRF protection for simple requests — those are still sent; use SameSite cookies and CSRF tokens.',
      },
    ],
  },

  'helmet-js-and-security-headers': {
    summary:
      'Helmet is Express middleware (also usable in NestJS, and as `@fastify/helmet`) that sets a collection of HTTP **security response headers** with sensible defaults in one line, `app.use(helmet())`. By default it sets `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Origin-Agent-Cluster` and a few legacy headers, and removes `X-Powered-By`.',
    details: [
      {
        type: 'paragraph',
        text: 'Security headers instruct the browser to enable protections — against clickjacking, MIME sniffing, protocol downgrade, leaking URLs via referrers and XSS. They are cheap defence in depth: they do not fix vulnerable code but reduce how exploitable it is. Helmet just sets headers; you could set them manually or at the reverse proxy/CDN.',
      },
      { type: 'heading3', text: 'Usage' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import express from 'express';
import helmet from 'helmet';

const app = express();
app.use(helmet()); // all defaults

// Customised
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.example.com'],
        imgSrc: ["'self'", 'data:', 'https://images.example.com'],
        connectSrc: ["'self'", 'https://api.example.com'],
        frameAncestors: ["'none'"],
      },
    },
    strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// NestJS: app.use(helmet()) in main.ts`,
      },
      { type: 'heading3', text: 'Headers set by default (current Helmet versions)' },
      {
        type: 'bullets',
        items: [
          "**Content-Security-Policy** — allow-list of sources for scripts, styles, images, frames, etc.; the strongest XSS mitigation. Default is fairly strict (`default-src 'self'`...).",
          '**Strict-Transport-Security** — HSTS: browser uses HTTPS only for this domain for `max-age` (default about one year, `includeSubDomains`).',
          '**X-Content-Type-Options: nosniff** — stops browsers guessing a MIME type (e.g. running an uploaded "image" as script).',
          '**X-Frame-Options: SAMEORIGIN** — legacy clickjacking protection (CSP `frame-ancestors` is the modern equivalent).',
          "**Referrer-Policy: no-referrer** — don't leak full URLs (which may contain tokens) to other sites.",
          '**Cross-Origin-Opener-Policy: same-origin** — isolates your window from cross-origin popups (Spectre-style and tab-nabbing attacks).',
          '**Cross-Origin-Resource-Policy: same-origin** — other sites cannot embed your resources.',
          '**Origin-Agent-Cluster: ?1** — requests origin-keyed process isolation.',
          '**X-DNS-Prefetch-Control: off**, **X-Download-Options: noopen** (old IE), **X-Permitted-Cross-Domain-Policies: none** (Flash/PDF).',
          '**X-XSS-Protection: 0** — deliberately disables the buggy legacy browser XSS auditor.',
          "**Removes `X-Powered-By: Express`** — less fingerprinting (`app.disable('x-powered-by')` does the same).",
          '`Cross-Origin-Embedder-Policy` is available but no longer on by default because it breaks many embeds.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `curl -sI https://api.example.com | grep -iE 'content-security|strict-transport|x-content|x-frame|referrer'
# content-security-policy: default-src 'self';base-uri 'self';...
# strict-transport-security: max-age=31536000; includeSubDomains
# x-content-type-options: nosniff
# x-frame-options: SAMEORIGIN
# referrer-policy: no-referrer`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'For a pure JSON API many headers matter less (CSP mainly protects HTML pages), but they are still cheap insurance. Mention that the default CSP often breaks SPAs with inline scripts or third-party CDNs, so you tune directives (or use nonces) rather than disabling CSP — start with `Content-Security-Policy-Report-Only` to find violations safely.',
      },
    ],
  },
};
