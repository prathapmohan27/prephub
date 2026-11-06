// Full-stack scenarios: each answer traces one feature or problem across Angular, the API,
// the database and the infrastructure, and links to the single-layer topics for depth.
import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Trace a login end to end in an Angular + Node app: form, API, token or cookie, interceptor, silent refresh and logout everywhere.':
    {
      summary:
        'I walk it hop by hop: the Angular form posts credentials to the API, Node verifies the password hash and issues a short-lived access token plus a rotating refresh token in an `httpOnly`, `Secure`, `SameSite` cookie. A functional interceptor attaches the access token (kept in memory, not localStorage) and, on a 401, runs one shared refresh call while queuing the other failed requests. Logout revokes the refresh token on the server and is broadcast to every open tab with `BroadcastChannel`, so the user is logged out everywhere at once.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**Angular form** → `POST /auth/login` with email + password over HTTPS.',
            '**Node API** → rate-limit by IP and account, look up the user, compare with `argon2`/`bcrypt`, check MFA if enabled.',
            '**Tokens** → sign a 5–15 min access token (JWT) and create a refresh token stored hashed in the DB (MongoDB `sessions` collection with a TTL index), linked to a token family for rotation.',
            '**Response** → refresh token in an `httpOnly; Secure; SameSite=Strict; Path=/auth` cookie; access token + user profile in the JSON body.',
            '**Angular auth service** → keeps the access token in a signal (memory only) and exposes `currentUser`.',
            '**Interceptor** → adds `Authorization: Bearer …` to API calls; on 401 runs a single-flight refresh and retries.',
            '**App start / reload** → memory is empty, so the app calls `POST /auth/refresh` once (the cookie is sent automatically) to restore the session silently.',
            '**Logout** → `POST /auth/logout` revokes the refresh family, clears the cookie, and every tab is told to drop its state.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The trade-offs between sessions and JWTs, refresh token rotation and where an SPA should keep tokens are covered in the **Auth in Depth** topic. This answer is about how the pieces connect and fail together.',
        },
        { type: 'heading3', text: 'Angular: auth state as signals' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private channel = new BroadcastChannel('auth');

  private accessToken = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.user() !== null);

  constructor() {
    // Another tab logged out (or in): mirror it here
    this.channel.onmessage = (e) => {
      if (e.data === 'logout') this.clear(false);
    };
  }

  token() { return this.accessToken(); }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password }, { withCredentials: true })
      .pipe(tap((r) => this.setSession(r)));
  }

  refresh() {
    return this.http
      .post<LoginResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(tap((r) => this.setSession(r)));
  }

  logout() {
    return this.http.post('/api/auth/logout', {}, { withCredentials: true })
      .pipe(finalize(() => this.clear(true)));
  }

  private setSession(r: LoginResponse) {
    this.accessToken.set(r.accessToken);
    this.user.set(r.user);
  }

  private clear(broadcast: boolean) {
    this.accessToken.set(null);
    this.user.set(null);
    if (broadcast) this.channel.postMessage('logout');
    this.router.navigateByUrl('/login');
  }
}`,
        },
        { type: 'heading3', text: 'Angular: interceptor with single-flight refresh' },
        {
          type: 'paragraph',
          text: 'When the access token expires, several requests fail with 401 at the same moment. If each one calls refresh, rotation detects "reuse" of the old refresh token and revokes the whole family, logging the user out. So the interceptor shares one in-flight refresh and makes the others wait for it.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `let refreshInFlight: Observable<LoginResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!req.url.startsWith('/api/') || req.url.startsWith('/api/auth/')) return next(req);

  const withToken = (r: HttpRequest<unknown>) => {
    const token = auth.token();
    return token ? r.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : r;
  };

  return next(withToken(req)).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) return throwError(() => err);

      refreshInFlight ??= auth.refresh().pipe(
        finalize(() => (refreshInFlight = null)),
        shareReplay(1),
      );

      return refreshInFlight.pipe(
        switchMap(() => next(withToken(req))), // retry once with the new token
        catchError((refreshErr) => {
          auth.logout().subscribe();            // refresh failed: session is over
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

// app.config.ts
provideHttpClient(withInterceptors([authInterceptor]), withXsrfConfiguration({}));`,
        },
        { type: 'heading3', text: 'Node: login, refresh with rotation, logout' },
        {
          type: 'code',
          lang: 'typescript',
          code: `const cookieOpts = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/api/auth' };

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await users.findOne({ email: email.toLowerCase() });
  // Same response and similar timing whether the email exists or not
  if (!user || !(await argon2.verify(user.passwordHash, password))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const { refreshToken } = await sessions.create(user._id, req); // stores sha256(token), familyId, expiresAt
  res.cookie('rt', refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ accessToken: signAccessToken(user), user: toPublicUser(user) });
});

app.post('/api/auth/refresh', async (req, res) => {
  const presented = req.cookies.rt;
  const session = presented && (await sessions.findByToken(presented));
  if (!session) throw new UnauthorizedError('No session');
  if (session.usedAt) {
    await sessions.revokeFamily(session.familyId);   // reuse = likely theft
    throw new UnauthorizedError('Session revoked');
  }
  const next = await sessions.rotate(session);        // marks old used, issues new in same family
  res.cookie('rt', next.refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 3600 * 1000 });
  res.json({ accessToken: signAccessToken(next.user), user: toPublicUser(next.user) });
});

app.post('/api/auth/logout', async (req, res) => {
  if (req.cookies.rt) await sessions.revokeByToken(req.cookies.rt);
  res.clearCookie('rt', cookieOpts);
  res.status(204).end();
});`,
        },
        {
          type: 'bullets',
          items: [
            '**CSRF:** the refresh endpoint is driven by a cookie, so it needs protection. `SameSite=Strict` plus a narrow cookie `Path` covers most cases; add a CSRF token (Angular sends `X-XSRF-TOKEN` automatically from the `XSRF-TOKEN` cookie) if the API and app are on different sites or you need defence in depth.',
            '**Access token in memory:** XSS can still use it while the page is open, but cannot steal a long-lived credential. A strict CSP is the real XSS defence.',
            '**Logout everywhere (all devices):** revoke all session families for the user and keep access tokens short, or add a `tokenVersion` claim checked on sensitive routes.',
            '**BFF alternative:** for high-risk apps, a backend-for-frontend keeps all tokens server-side and the browser only holds a session cookie.',
          ],
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            '**Refresh storm:** many tabs or parallel requests refresh at once and trip reuse detection. Fix: single-flight per tab, and a short grace window on the server where the just-rotated token is still accepted.',
            '**Cookie not sent:** missing `withCredentials`, wrong `Path`, `SameSite=Strict` across different sites, or CORS without `credentials: true` and an explicit origin.',
            '**Clock skew:** access tokens rejected right after issue on one instance. Allow a few seconds of leeway when verifying `exp`/`nbf`.',
            '**Infinite 401 loop:** the interceptor retries the refresh request itself. Always exclude `/auth/*` from the retry logic.',
            '**Stale UI after logout in another tab:** fixed by `BroadcastChannel` (or the `storage` event as a fallback).',
            '**Account enumeration and brute force:** different errors for "no user" vs "wrong password", and no rate limit per account.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'Why not store the JWT in localStorage? — Any XSS can read and exfiltrate it; an `httpOnly` cookie or memory limits what an attacker can take.',
            'How do you log a user out of all devices immediately? — Revoke every session family server-side and rely on short access-token lifetimes, or check a token version.',
            'What happens on a hard reload? — Memory is empty, so the app calls `/auth/refresh` once at start (e.g. in an `APP_INITIALIZER`/`provideAppInitializer`) before routing.',
            'How would SSO change this? — The login form is replaced by an OIDC Authorization Code + PKCE redirect, ideally handled by a BFF.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Long-lived JWTs with no way to revoke them.',
            'Each failed request calling refresh on its own.',
            'Treating a route guard as security instead of enforcing auth on every API route.',
            'Forgetting CSRF once the refresh token lives in a cookie.',
            'Clearing local state on logout but never revoking the refresh token on the server.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you describe the flow across every hop, explain why concurrent 401s need a single-flight refresh, pair cookie storage with CSRF and CSP, and cover multi-tab and multi-device logout as explicit requirements instead of afterthoughts.',
        },
      ],
    },

  'How do you let users upload a 2 GB file from Angular: presigned URLs, progress, resume, scanning, background processing and notifying the UI?':
    {
      summary:
        'I never stream a 2 GB file through the Node API. Angular asks the API to start an S3 multipart upload, uploads the parts directly to S3 with presigned part URLs (a few in parallel, each retried on its own), shows progress, and can resume by asking which parts already exist. When S3 reports the object is complete, an event goes to a queue, a worker scans and processes the file, updates its status in MongoDB, and the UI learns about it through SSE or polling.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**Angular** validates size and type locally, then calls `POST /uploads` with name, size and content type.',
            '**Node API** checks auth, quota and allowed types, creates an `uploads` document (`status: "uploading"`), calls `CreateMultipartUpload`, and returns `uploadId`, the object key and the part size.',
            '**Angular** splits the `File` with `file.slice()` into parts (for example 16 MB) and asks for presigned URLs in batches: `POST /uploads/:id/parts { partNumbers }`.',
            '**Browser → S3** uploads each part with `PUT` to its presigned URL, 3–4 at a time, and records the `ETag` returned for each part.',
            '**Angular** calls `POST /uploads/:id/complete` with the part list; Node calls `CompleteMultipartUpload`.',
            '**S3 event** (`ObjectCreated`) → SQS (or EventBridge) → **worker** scans for malware, checks the real file type, then transcodes or extracts as needed.',
            '**Worker** updates MongoDB (`status: "ready"` or `"rejected"`) and publishes an event; the **API** pushes it to the user over SSE (or the UI polls `GET /uploads/:id`).',
          ],
        },
        {
          type: 'paragraph',
          text: 'Presigned single-part uploads are covered in the **AWS & Cloud** topic. A 2 GB file needs multipart: a single `PUT` is limited to 5 GB, cannot resume, and one network hiccup restarts everything.',
        },
        { type: 'heading3', text: 'Node: start, sign parts, complete' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { S3Client, CreateMultipartUploadCommand, UploadPartCommand,
  CompleteMultipartUploadCommand, ListPartsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PART_SIZE = 16 * 1024 * 1024;         // S3 minimum is 5 MB (except the last part)
const MAX_SIZE = 5 * 1024 * 1024 * 1024;

app.post('/api/uploads', requireAuth, async (req, res) => {
  const { name, size, contentType } = startSchema.parse(req.body);
  if (size > MAX_SIZE || !ALLOWED_TYPES.has(contentType)) throw new ValidationError('File not allowed');

  const key = 'incoming/' + req.user.id + '/' + crypto.randomUUID();  // never the client filename
  const { UploadId } = await s3.send(new CreateMultipartUploadCommand({
    Bucket: BUCKET, Key: key, ContentType: contentType,
  }));
  const doc = await uploads.insertOne({
    userId: req.user.id, key, uploadId: UploadId, name, size, status: 'uploading', createdAt: new Date(),
  });
  res.status(201).json({ id: doc.insertedId, partSize: PART_SIZE });
});

app.post('/api/uploads/:id/parts', requireAuth, async (req, res) => {
  const up = await ownUpload(req);                       // 404 if not this user's upload
  const urls = await Promise.all(req.body.partNumbers.map((n: number) =>
    getSignedUrl(s3, new UploadPartCommand({
      Bucket: BUCKET, Key: up.key, UploadId: up.uploadId, PartNumber: n,
    }), { expiresIn: 900 })));
  res.json({ urls });
});

app.get('/api/uploads/:id/parts', requireAuth, async (req, res) => {
  const up = await ownUpload(req);                       // used to resume
  const out = await s3.send(new ListPartsCommand({ Bucket: BUCKET, Key: up.key, UploadId: up.uploadId }));
  res.json({ parts: (out.Parts ?? []).map((p) => ({ partNumber: p.PartNumber, etag: p.ETag })) });
});

app.post('/api/uploads/:id/complete', requireAuth, async (req, res) => {
  const up = await ownUpload(req);
  await s3.send(new CompleteMultipartUploadCommand({
    Bucket: BUCKET, Key: up.key, UploadId: up.uploadId,
    MultipartUpload: { Parts: req.body.parts.map((p: Part) => ({ PartNumber: p.partNumber, ETag: p.etag })) },
  }));
  await uploads.updateOne({ _id: up._id }, { $set: { status: 'processing' } });
  res.status(202).json({ status: 'processing' });
});`,
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'The bucket CORS rule must expose the `ETag` header (`ExposeHeaders: ["ETag"]`), otherwise the browser cannot read it and the upload cannot be completed. Also add a lifecycle rule `AbortIncompleteMultipartUpload` (for example after 3 days), because abandoned parts are stored and billed until aborted.',
        },
        { type: 'heading3', text: 'Angular: parallel parts with progress and resume' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  upload(file: File, uploadId: string, partSize: number, done: Map<number, string>) {
    const total = Math.ceil(file.size / partSize);
    const loaded = signal(0);                         // bytes confirmed, drives the progress bar
    const pending = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !done.has(n));

    const uploadPart = (n: number) => {
      const blob = file.slice((n - 1) * partSize, n * partSize);
      return this.http.post<{ urls: string[] }>('/api/uploads/' + uploadId + '/parts', { partNumbers: [n] }).pipe(
        switchMap(({ urls }) =>
          // Presigned URL: plain PUT, no auth interceptor header
          this.http.put(urls[0], blob, { observe: 'response', context: skipAuth() })),
        retry({ count: 3, delay: (_, i) => timer(2 ** i * 1000) }),
        tap((r) => {
          done.set(n, r.headers.get('ETag')!);
          loaded.update((b) => b + blob.size);
        }),
      );
    };

    const run$ = from(pending).pipe(
      mergeMap(uploadPart, 4),                        // at most 4 parts in flight
      last(null, null),
      switchMap(() => this.http.post('/api/uploads/' + uploadId + '/complete', {
        parts: [...done].sort((a, b) => a[0] - b[0]).map(([partNumber, etag]) => ({ partNumber, etag })),
      })),
    );
    return { loaded, run$ };
  }
}`,
        },
        {
          type: 'bullets',
          items: [
            'For byte-level progress inside a part, use `reportProgress: true, observe: "events"` and sum `HttpEventType.UploadProgress` events; per-part completion is often smooth enough at 16 MB.',
            'Resume: persist `uploadId` (for example in IndexedDB with the file name and size). After a reload the user re-selects the file, the app calls `GET /uploads/:id/parts`, and only missing parts are sent.',
            'Cancel: unsubscribe (which aborts the XHRs) and call an endpoint that runs `AbortMultipartUpload`.',
          ],
        },
        { type: 'heading3', text: 'Background processing and notifying the UI' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Worker consuming S3 ObjectCreated events from SQS
for await (const msg of sqsMessages(queueUrl)) {
  const key = msg.body.Records[0].s3.object.key;
  const up = await uploads.findOne({ key });
  if (!up || up.status === 'ready') { await ack(msg); continue; }    // idempotent: events can repeat

  const verdict = await scanAndInspect(key);   // malware scan + magic-byte type check
  if (!verdict.clean) {
    await uploads.updateOne({ _id: up._id }, { $set: { status: 'rejected', reason: verdict.reason } });
  } else {
    const finalKey = await moveToClean(key);    // incoming/ → files/ ; app serves only files/
    await uploads.updateOne({ _id: up._id }, { $set: { status: 'ready', key: finalKey } });
  }
  await events.publish('user:' + up.userId, { type: 'upload', id: up._id, status: verdict.clean ? 'ready' : 'rejected' });
  await ack(msg);
}`,
        },
        {
          type: 'paragraph',
          text: 'The API forwards `user:<id>` events to that user over SSE (see the live-updates scenario). If real-time is not needed, polling `GET /uploads/:id` every few seconds with backoff is simpler and fine for a status that changes a few times.',
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            '**Reading the ETag fails** because the bucket CORS does not expose it.',
            '**Auth interceptor adds a Bearer header** to the S3 request and breaks the signature. Skip it with an `HttpContext` token.',
            '**Presigned URLs expire** during a slow upload. Sign parts in small batches just before they are needed.',
            '**Duplicate S3 events** run the worker twice. Make processing idempotent by checking the status first.',
            '**Serving files before the scan finishes.** Keep uploads in a quarantine prefix the app never serves.',
            '**Orphaned multipart uploads** cost money. Use the lifecycle abort rule and a cleanup job for `uploading` records older than a day.',
            '**Trusting `contentType` and the file name from the client.** Check the real type in the worker and generate your own key.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'Why not upload through the Node server? — It ties up memory, sockets and bandwidth for minutes per upload and makes horizontal scaling expensive.',
            'How do you choose the part size? — At least 5 MB, at most 10,000 parts; larger parts mean fewer requests but more to retry on failure.',
            'How would you limit storage per user? — Check the quota at `POST /uploads` and again on complete, using the size S3 reports, not the client value.',
            'How do you serve the file later? — Short-lived presigned GET URLs or CloudFront signed URLs, never a public bucket.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Single `PUT` for huge files with no resume.',
            'No lifecycle rule for incomplete multipart uploads.',
            'Treating "upload finished" as "file ready" and skipping the scan.',
            'Unbounded parallelism that saturates the user connection.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you keep large bytes off the API, design for resume and partial failure, separate quarantine from served storage, make the event-driven worker idempotent, and remember the operational details (CORS `ETag`, lifecycle abort rule, quotas) that break real uploads.',
        },
      ],
    },

  'Design live order-status updates from Node to Angular: WebSocket vs SSE vs polling, reconnection, and scaling across several server instances.':
    {
      summary:
        'Order status flows one way, from server to browser, so I use Server-Sent Events: plain HTTP, automatic reconnection and `Last-Event-ID` replay built in. Status changes are written to MongoDB and published to Redis; every Node instance subscribes and forwards events to its own connected users, so it does not matter which instance a browser is connected to. In Angular a service wraps `EventSource` and exposes the latest status as a signal, with a REST fetch on reconnect so nothing is missed.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**Order service** changes the status (`paid → packed → shipped`) in MongoDB and, in the same transaction, writes an outbox event with an increasing `seq` per order.',
            '**Publisher** reads the outbox and publishes to Redis channel `order:<orderId>` (or a stream).',
            '**Every API instance** subscribes to Redis and keeps a map of open SSE connections by order or user.',
            '**Angular** opens `GET /api/orders/:id/events` with `EventSource`; the server checks that the user owns the order.',
            '**Instance** receives the Redis message and writes `id: <seq>` + `data: …` to the matching connections.',
            '**On reconnect** the browser sends `Last-Event-ID`; the server replays missed events from MongoDB, then continues live.',
          ],
        },
        { type: 'heading3', text: 'Choosing the transport' },
        {
          type: 'bullets',
          items: [
            '**Polling** (every 10–30 s): simplest, works everywhere, cacheable. Fine when a few seconds of delay is acceptable and users are few. Wasteful at scale.',
            '**SSE**: one-way server → client over HTTP, auto-reconnect, event ids for replay, works through most proxies and with HTTP/2 multiplexing. Ideal for status, notifications and feeds.',
            '**WebSocket**: two-way, binary-capable, lower per-message overhead. Choose it when the client also sends frequent messages (chat, collaboration, games). It needs its own heartbeat, reconnection and replay logic.',
          ],
        },
        {
          type: 'paragraph',
          text: 'The protocol details are in the **Networking & HTTP** topic (WebSockets and SSE). The interview point here is matching the transport to the data direction and frequency, then designing delivery guarantees around it.',
        },
        { type: 'heading3', text: 'Node: SSE endpoint with replay and fan-out via Redis' },
        {
          type: 'code',
          lang: 'typescript',
          code: `const subscribers = new Map<string, Set<Response>>();   // orderId → open connections on THIS instance

redisSub.pSubscribe('order:*', (message, channel) => {
  const orderId = channel.slice('order:'.length);
  const evt = JSON.parse(message) as { seq: number; status: string };
  for (const res of subscribers.get(orderId) ?? []) writeEvent(res, evt);
});

function writeEvent(res: Response, evt: { seq: number; status: string }) {
  res.write('id: ' + evt.seq + '\\nevent: status\\ndata: ' + JSON.stringify(evt) + '\\n\\n');
}

app.get('/api/orders/:id/events', requireAuth, async (req, res) => {
  const order = await orders.findOne({ _id: req.params.id, userId: req.user.id });
  if (!order) throw new NotFoundError('order');

  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();

  // Replay anything missed since the last id the browser saw
  const lastSeq = Number(req.get('Last-Event-ID') ?? 0);
  const missed = await orderEvents.find({ orderId: order._id, seq: { $gt: lastSeq } }).sort({ seq: 1 }).toArray();
  missed.forEach((e) => writeEvent(res, e));

  const set = subscribers.get(req.params.id) ?? new Set();
  set.add(res);
  subscribers.set(req.params.id, set);

  const heartbeat = setInterval(() => res.write(': ping\\n\\n'), 25_000);  // keeps proxies from closing idle streams
  res.on('close', () => {
    clearInterval(heartbeat);
    set.delete(res);
    if (set.size === 0) subscribers.delete(req.params.id);
  });
});`,
        },
        {
          type: 'bullets',
          items: [
            '**Ordering and gaps:** the per-order `seq` lets the client ignore duplicates and lets the server replay. Redis Pub/Sub is fire-and-forget, so MongoDB (or a Redis Stream) is the replay source.',
            '**Sticky sessions are not needed:** any instance can serve the stream because every instance hears every event. Stickiness only becomes relevant with Socket.IO long-polling fallback.',
            '**Proxies and load balancers:** disable response buffering (`X-Accel-Buffering: no` for Nginx), raise idle timeouts above the heartbeat interval, and never compress the stream with a buffering middleware.',
            '**Connection limits:** each open stream holds a socket. Under HTTP/1.1 browsers allow about 6 connections per origin, so use HTTP/2 or one multiplexed stream per user rather than one per order.',
          ],
        },
        { type: 'heading3', text: 'Angular: a service that exposes a signal' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })
export class OrderStatusService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);

  watch(orderId: string, destroyRef: DestroyRef) {
    const status = signal<OrderStatus | null>(null);
    let lastSeq = 0;

    // Initial state from REST, so the page renders even if the stream is slow
    this.http.get<OrderStatus>('/api/orders/' + orderId + '/status')
      .subscribe((s) => { status.set(s); lastSeq = s.seq; });

    // EventSource reconnects by itself and sends Last-Event-ID automatically
    const es = new EventSource('/api/orders/' + orderId + '/events', { withCredentials: true });
    es.addEventListener('status', (e) => {
      const evt = JSON.parse((e as MessageEvent).data) as OrderStatus;
      if (evt.seq <= lastSeq) return;                  // duplicate after replay
      lastSeq = evt.seq;
      this.zone.run(() => status.set(evt));            // harmless when zoneless
    });
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        // Server refused (e.g. 401/404): EventSource will not retry. Fall back or re-auth.
      }
    };
    destroyRef.onDestroy(() => es.close());
    return status.asReadonly();
  }
}`,
        },
        {
          type: 'paragraph',
          text: '`EventSource` cannot set an `Authorization` header, so authenticate the stream with the session cookie (same site, `withCredentials`) or a short-lived, single-purpose stream token in the URL. For custom headers or backoff control, use `fetch` with a streaming reader (or a small library) instead.',
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            '**Missed events during a deploy:** connections drop when an instance stops. Replay by `Last-Event-ID` fixes it; graceful shutdown should end streams so clients reconnect elsewhere quickly.',
            '**Thundering herd on reconnect:** thousands of clients reconnect at once after a restart. Send `retry:` with jitter or add client-side randomized backoff.',
            '**Leaking connections:** forgetting to remove closed responses from the map grows memory and writes to dead sockets.',
            '**Buffered streams:** a proxy or compression middleware buffers output and events arrive in bursts minutes later.',
            '**Authorization drift:** a user loses access to an order but the open stream keeps sending. Re-check on long-lived streams or cap stream lifetime (for example 1 hour) to force re-auth.',
            '**Redis outage:** live updates stop. The REST fallback and replay on reconnect keep the UI correct, just less timely.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'When would you switch to WebSockets? — When the client sends frequent messages too, or needs binary data or very high message rates.',
            'How many connections can one Node instance hold? — Tens of thousands of idle SSE connections is realistic; memory per socket and file-descriptor limits are the constraints, so measure.',
            'Why not just Redis Pub/Sub without MongoDB? — Pub/Sub keeps nothing, so a disconnected client cannot catch up.',
            'How do you test it? — Integration test with a real Redis, kill the connection mid-stream and assert replay from `Last-Event-ID`.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Choosing WebSockets by default for one-way data.',
            'Keeping subscribers only in one instance memory without a shared bus.',
            'No event ids, so reconnects silently lose updates.',
            'No heartbeat, so idle proxies close streams.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you pick the transport from the data direction and rate, separate live delivery (Redis fan-out) from durable history (MongoDB replay), design for reconnects, deploys and proxies, and keep the UI correct even when the real-time path is down.',
        },
      ],
    },

  'Design a paginated, filterable, sortable table end to end: the API contract, MongoDB indexes, Angular state and URL-synced filters.':
    {
      summary:
        'I make the URL the single source of truth for the table state, so filters survive refresh and can be shared. Angular reads query params as a signal, debounces typing, and fetches with `switchMap` so stale responses are cancelled. The API accepts only allow-listed filter and sort fields and uses cursor pagination with a stable sort (the chosen field plus `_id` as a tiebreaker), backed by compound MongoDB indexes designed with the ESR rule. Exact totals are optional because counting is often the slowest part.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**User** changes a filter or sort → Angular updates the URL query params (`?status=paid&sort=-createdAt`).',
            '**Angular** reads the query params as a signal, debounces text search, and requests `GET /api/orders?status=paid&sort=-createdAt&limit=50&cursor=…`.',
            '**Node API** validates every parameter against an allow-list, builds the MongoDB filter and sort, and applies the cursor.',
            '**MongoDB** answers from a compound index (equality fields, then the sort field, then ranges), reading only `limit + 1` documents.',
            '**API** returns `{ items, nextCursor, hasMore }` and optionally an approximate or capped `total`.',
            '**Angular** renders rows with `@for … track row.id` and shows "Load more" or next/previous controls.',
          ],
        },
        { type: 'heading3', text: 'API contract' },
        {
          type: 'code',
          lang: 'json',
          code: `GET /api/orders?status=paid&customerId=c_42&q=keyboard&sort=-createdAt&limit=50&cursor=eyJ2Ij...

200 OK
{
  "items": [ { "id": "6650...", "status": "paid", "total": 129.5, "createdAt": "2026-11-01T09:12:00Z" } ],
  "nextCursor": "eyJ2IjoiMjAyNi0xMS0wMVQwOToxMjowMFoiLCJpZCI6IjY2NTAuLi4ifQ",
  "hasMore": true
}`,
        },
        {
          type: 'bullets',
          items: [
            'The cursor is opaque (base64 of the last row sort value + `_id`). Clients never build it, so you can change the implementation later.',
            'A cursor is only valid with the same filters and sort. Encode a hash of them in the cursor and reject a mismatch with 400.',
            '`sort` accepts a fixed list (`createdAt`, `total`, `status`), with `-` for descending. Anything else is 400.',
            'Offset pagination (`page=3`) is acceptable for small, admin-style tables where users need to jump to page N. The cost grows with the offset (see the MongoDB pagination question).',
          ],
        },
        { type: 'heading3', text: 'Node: allow-listed filters and cursor query' },
        {
          type: 'code',
          lang: 'typescript',
          code: `const SORTABLE = { createdAt: 'createdAt', total: 'total' } as const;
const querySchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']).optional(),
  customerId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['createdAt', '-createdAt', 'total', '-total']).default('-createdAt'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

app.get('/api/orders', requireAuth, async (req, res) => {
  const p = querySchema.parse(req.query);
  const dir = p.sort.startsWith('-') ? -1 : 1;
  const field = SORTABLE[p.sort.replace('-', '') as keyof typeof SORTABLE];

  const filter: Filter<Order> = { tenantId: req.user.tenantId };   // tenant scope first, always
  if (p.status) filter.status = p.status;
  if (p.customerId) filter.customerId = p.customerId;
  if (p.q) filter.$text = { $search: p.q };                        // or Atlas Search for real search

  if (p.cursor) {
    const c = decodeCursor(p.cursor, p);                           // throws 400 if filters changed
    const op = dir === -1 ? '$lt' : '$gt';
    filter.$or = [
      { [field]: { [op]: c.value } },
      { [field]: c.value, _id: { [op]: c.id } },                   // tiebreaker for equal values
    ];
  }

  const rows = await orders.find(filter)
    .sort({ [field]: dir, _id: dir })
    .limit(p.limit + 1)                                            // one extra row tells us hasMore
    .project({ status: 1, total: 1, createdAt: 1, customerId: 1 })
    .toArray();

  const hasMore = rows.length > p.limit;
  const items = rows.slice(0, p.limit);
  const last = items.at(-1);
  res.json({
    items: items.map(toDto),
    hasMore,
    nextCursor: hasMore && last ? encodeCursor({ value: last[field], id: last._id }, p) : null,
  });
});`,
        },
        { type: 'heading3', text: 'MongoDB indexes (ESR)' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// Equality fields first, then the sort, then _id so the tiebreaker is in the index too
db.orders.createIndex({ tenantId: 1, status: 1, createdAt: -1, _id: -1 });
db.orders.createIndex({ tenantId: 1, customerId: 1, createdAt: -1, _id: -1 });
db.orders.createIndex({ tenantId: 1, status: 1, total: -1, _id: -1 });

// Verify: IXSCAN, no in-memory SORT stage, totalDocsExamined close to limit + 1
db.orders.find({ tenantId: 't1', status: 'paid' })
  .sort({ createdAt: -1, _id: -1 }).limit(51).explain('executionStats');`,
        },
        {
          type: 'paragraph',
          text: 'You cannot index every combination of filters and sorts. Support the combinations the product actually uses, measure the rest, and say no to arbitrary sort-by-any-column on a large collection, or move that use case to a search engine.',
        },
        { type: 'heading3', text: 'Angular: URL as the source of truth' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-orders-table',
  template: \`
    <input [value]="searchText()" (input)="search($any($event.target).value)" placeholder="Search" />
    <select [value]="status() ?? ''" (change)="setParam('status', $any($event.target).value)"> … </select>
    <table>
      @for (row of rows(); track row.id) {
        <tr><td>{{ row.createdAt | date }}</td><td>{{ row.status }}</td><td>{{ row.total | currency }}</td></tr>
      } @empty { <tr><td colspan="3">No orders match these filters.</td></tr> }
    </table>
    @if (hasMore()) { <button (click)="loadMore()" [disabled]="loading()">Load more</button> }
  \`,
})
export class OrdersTable {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  private params = toSignal(this.route.queryParamMap, { requireSync: true });
  status = computed(() => this.params().get('status'));
  searchText = signal(this.params().get('q') ?? '');

  rows = signal<OrderRow[]>([]);
  hasMore = signal(false);
  loading = signal(false);
  private cursor: string | null = null;
  private search$ = new Subject<string>();

  constructor() {
    // Debounced text search writes to the URL, not straight to the API
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.setParam('q', q));

    // Any URL change → fresh first page; switchMap cancels the in-flight request
    toObservable(this.params).pipe(
      tap(() => { this.loading.set(true); this.cursor = null; }),
      switchMap((p) => this.fetch(p, null)),
      takeUntilDestroyed(),
    ).subscribe((page) => this.applyPage(page, true));
  }

  search(q: string) { this.searchText.set(q); this.search$.next(q); }

  setParam(key: string, value: string) {
    this.router.navigate([], {
      queryParams: { [key]: value || null },     // null removes the param
      queryParamsHandling: 'merge',
      replaceUrl: key === 'q',                   // typing should not flood history
    });
  }

  loadMore() {
    this.loading.set(true);
    this.fetch(this.params(), this.cursor).subscribe((page) => this.applyPage(page, false));
  }

  private fetch(p: ParamMap, cursor: string | null) {
    let params = new HttpParams();
    for (const k of ['status', 'customerId', 'q', 'sort']) if (p.get(k)) params = params.set(k, p.get(k)!);
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<Page<OrderRow>>('/api/orders', { params });
  }

  private applyPage(page: Page<OrderRow>, reset: boolean) {
    this.rows.update((r) => (reset ? page.items : [...r, ...page.items]));
    this.cursor = page.nextCursor;
    this.hasMore.set(page.hasMore);
    this.loading.set(false);
  }
}`,
        },
        {
          type: 'bullets',
          items: [
            'With `withComponentInputBinding()` you can receive query params as signal inputs instead of reading `ActivatedRoute`; the principle (URL drives state) is the same.',
            'For very large lists, combine this with CDK virtual scrolling so the DOM stays small while pages are appended.',
            'Cache recent pages per URL (a small in-memory map or HTTP caching with `ETag`) so Back navigation is instant.',
          ],
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            '**Duplicate or skipped rows** between pages: sorting on a non-unique field without the `_id` tiebreaker.',
            '**Out-of-order responses:** a slow request for old filters overwrites newer results. `switchMap` (or `httpResource`) cancels it.',
            '**Slow counts:** `countDocuments` on a broad filter scans many index entries on every request. Show "1,000+" with a capped count, cache totals, or drop them.',
            '**Injection via query params:** passing `req.query` straight into `find()` allows operators like `{"$ne": null}`. Allow-list and type every field.',
            '**In-memory sorts:** a sort with no matching index hits the 100 MB sort limit or spills to disk at high cost.',
            '**Inconsistent pages during writes:** new rows appear while paging. Cursors handle this well; offsets show duplicates.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'How do you support "jump to page 40"? — Offset for small datasets, or approximate jumps via a date/range filter; true random access and cursors do not mix.',
            'How do you add free-text search? — A text index for simple cases, Atlas Search or Elasticsearch for relevance, typo tolerance and facets.',
            'How do you export all matching rows? — A background job that streams the cursor to a file, not a giant API page.',
            'How do you keep the table fresh? — Poll the first page or push "new rows available" and let the user refresh, rather than inserting rows under their cursor.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Keeping filter state only in a component, so refresh and shared links lose it.',
            'Allowing sort on any field with no index plan.',
            'Offset pagination on a growing, large collection.',
            'Debouncing in the wrong place, so every keystroke still hits the API or the URL history.',
            'Always returning an exact total.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you treat the URL as state, define a strict and opaque API contract, design indexes from the supported filter/sort combinations, use a stable cursor with a tiebreaker, and call out the cost of totals and the race between stale and fresh responses.',
        },
      ],
    },

  'How do you share types and validation between Angular and Node (OpenAPI codegen, a shared package in a monorepo, or Zod schemas)?':
    {
      summary:
        'I pick one source of truth for the API contract and generate or derive everything else from it, so the Angular client and the Node API cannot drift apart silently. In a monorepo where both apps are TypeScript, I share Zod schemas in a library and use `z.infer` for the types; when the API has other consumers or lives in a separate repo, I make an OpenAPI document the contract and generate the Angular client from it. Either way, types alone are not enough: the server validates every request at runtime, and the client validates responses where a wrong shape would be costly.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**Contract**: one definition of `CreateOrderRequest` and `OrderResponse` (a Zod schema or an OpenAPI component).',
            '**Angular**: the form model, the service method signature and the response type all come from that contract (imported or generated).',
            '**HTTP**: JSON crosses the wire. At this point every type is gone; only runtime checks protect you.',
            '**Node API**: the request body is parsed with the same schema at the edge, before it reaches the service layer.',
            '**Database**: the persistence model is separate. It contains server-only fields (`internalNotes`, `costPrice`, `passwordHash`) that must never appear in the shared contract.',
            '**CI**: a check fails the build when the contract changes in a breaking way or the generated client is out of date.',
          ],
        },
        { type: 'heading3', text: 'The three options' },
        {
          type: 'bullets',
          items: [
            '**Shared TypeScript interfaces in a monorepo (Nx or pnpm workspaces)**: the cheapest start, with types only. Nothing validates at runtime, so a backend change that compiles on both sides can still send a shape the client does not expect. I treat this as a stepping stone, not the destination.',
            '**Shared Zod schemas in a monorepo (`libs/contracts`)**: one schema gives both the runtime validator and the static type through `z.infer`. Both apps import it, so a rename breaks the compile on both sides immediately. It works best when every consumer is TypeScript and deploys from the same repo. If you also need OpenAPI docs, generate them from the schemas with `zod-to-openapi` (`@asteasolutions/zod-to-openapi`).',
            '**OpenAPI as the contract, with a generated client**: language-neutral, works across repos and teams, and gives you documentation, mock servers and contract tests. Generate the Angular side with `openapi-generator` (typescript-angular, which emits injectable services), `orval` (Angular client, plus optional Zod validators) or `openapi-typescript` (types only, very lightweight). Contract-first versus code-first is covered in the API Design topic.',
          ],
        },
        {
          type: 'paragraph',
          text: '**How I decide:** same repo, TypeScript only, one team → shared Zod schemas. Separate repos, mobile apps or third-party consumers, or a backend in another language → OpenAPI with codegen. Very small app with a deadline → shared interfaces for now, plus server-side validation, with a plan to move to schemas.',
        },
        { type: 'heading3', text: 'Shared Zod library' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// libs/contracts/src/order.ts — imported by apps/web (Angular) and apps/api (Node)
import { z } from 'zod';

export const CreateOrderRequest = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
  couponCode: z.string().trim().toUpperCase().optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequest>;

export const OrderResponse = z.object({
  id: z.string(),
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']),
  total: z.number(),
  version: z.number().int(),
  createdAt: z.string().datetime(),
});
export type OrderResponse = z.infer<typeof OrderResponse>;`,
        },
        {
          type: 'heading3',
          text: 'Node: validate at the edge, map on the way out',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// apps/api/src/orders/orders.routes.ts (Express 5)
import { CreateOrderRequest, OrderResponse } from '@acme/contracts';

router.post('/orders', async (req, res) => {
  const input = CreateOrderRequest.parse(req.body); // ZodError → 400 via the error middleware
  const order = await orders.create(req.user.id, input);
  // Map the DB document to the public contract: server-only fields never leak
  res.status(201).json(OrderResponse.parse(toOrderResponse(order)));
});`,
        },
        {
          type: 'paragraph',
          text: 'Parsing the outgoing response is optional, but on important endpoints it catches the classic leak where someone returns the raw Mongoose document and ships `costPrice` to the browser. Keep the DB model (`OrderDocument`) and the contract type as two separate types with an explicit mapper between them.',
        },
        {
          type: 'heading3',
          text: 'Angular: typed calls, runtime checks where it matters',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// apps/web/src/app/orders/order-api.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { CreateOrderRequest, OrderResponse } from '@acme/contracts';

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private http = inject(HttpClient);

  create(body: CreateOrderRequest) {
    return this.http
      .post<unknown>('/api/orders', body)
      .pipe(map((json) => OrderResponse.parse(json))); // fails loudly if the backend drifted
  }
}`,
        },
        {
          type: 'paragraph',
          text: '`HttpClient.post<T>()` is only a type assertion (see the TypeScript topic), so the `parse` is what actually checks the response. Because the same `CreateOrderRequest` schema can validate the form value before submit, client and server agree on rules such as `max(100)`. The server still validates, because the client can always be bypassed.',
        },
        {
          type: 'heading3',
          text: 'Versioning and keeping the contract honest',
        },
        {
          type: 'bullets',
          items: [
            'Additive changes (new optional fields, new endpoints) are safe. Renames, removals and type changes are breaking changes: they need a new version or an expand-and-contract rollout, because old Angular bundles stay cached in browsers.',
            'In CI, regenerate the client and fail if `git diff` is not empty. Run an OpenAPI diff tool (for example `oasdiff`) to flag breaking changes in pull requests.',
            'Do not use `.strict()` on response schemas in the client. An unknown extra field should not break old clients; that is what makes additive changes safe.',
            'Put only wire contracts in the shared library: no DB models, no NestJS decorators, no Node-only imports. Otherwise server code ends up in the Angular bundle.',
          ],
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            'Dates: JSON has no `Date`, so the contract says `string` and the client converts it. Sharing a type that claims `Date` is a lie at runtime.',
            'Server-only libraries leak into the browser bundle through the shared package, and the bundle grows or the build breaks.',
            'Generated code is edited by hand, then overwritten on the next generation.',
            'Both apps share a schema but deploy at different times, so for a few minutes the old client talks to the new API. The shared library does not remove the need for backward compatibility.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'Why not just share interfaces? — They vanish at runtime; JSON from the network is unchecked.',
            'How do you handle a field the client must not see? — Separate DB model and contract types, an explicit mapper, and optionally parse the response on the server.',
            'Who owns the contract when frontend and backend are different teams? — The API team owns the OpenAPI spec; changes go through pull-request review with a breaking-change check.',
            'Does validating responses in the client cost performance? — Usually negligible; I apply it to critical or third-party endpoints, not every list of 5,000 rows.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Returning ORM or Mongoose documents directly as API responses.',
            'Validating only on the client.',
            'Putting NestJS DTO classes with decorators in the shared library, which drags server code into Angular.',
            'Treating "it compiles on both sides" as proof that a deploy is safe.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you name a single source of truth, explain why types are not validation, keep the DB model separate from the wire contract, and plan for old clients still running during a deploy, with CI checks that catch breaking changes.',
        },
      ],
    },

  'Two users edit the same record. How do you handle optimistic UI updates and server-side conflicts (version field, ETag, 409) end to end?':
    {
      summary:
        'I use optimistic concurrency: every record carries a version, the client sends the version it edited, and the server applies the update only if that version is still current, in one atomic database operation. If someone else saved first, the server rejects the write with 409 Conflict (or 412 when I use `If-Match` with ETags), and the Angular app rolls back its optimistic change and shows the user what changed instead of silently overwriting it. Last-write-wins looks simpler but quietly destroys the other user’s work.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**GET**: the API returns the record with `version: 7` in the body and `ETag: "7"` in a header.',
            '**Angular**: the user edits; on save the store updates the UI immediately (optimistic) and keeps a snapshot for rollback.',
            '**PATCH**: the request carries the base version, as `If-Match: "7"` or `version: 7` in the body.',
            '**Node**: the service runs one conditional update: match `_id` AND `version: 7`, set the fields, increment the version.',
            '**MongoDB**: either one document matches (success, now version 8) or none (someone else changed it, or it was deleted).',
            '**Response**: 200 with the new record and `ETag: "8"`, or 409/412 with the current server state.',
            '**Angular**: on success, replace the optimistic copy with the server copy; on conflict, roll back and show a resolve dialog.',
          ],
        },
        { type: 'heading3', text: 'Why last-write-wins loses data' },
        {
          type: 'paragraph',
          text: 'Alice and Bob both load version 7. Alice changes the price and saves. Bob changes the description and saves a full document he loaded before Alice’s save, so Alice’s price is reverted, nobody gets an error, and nobody notices until a customer does. The lost-update race in the backend Debugging topic is the same bug at the database level; here the "transaction" spans minutes of a human editing a form, so database locks are not an option. Optimistic concurrency is the standard answer.',
        },
        {
          type: 'heading3',
          text: 'Node + MongoDB: one atomic conditional update',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Express 5 route
router.patch('/products/:id', async (req, res) => {
  const ifMatch = req.get('If-Match');
  if (!ifMatch) throw new PreconditionRequiredError(); // 428: require clients to send a version
  const baseVersion = Number(ifMatch.replace(/"/g, ''));
  const changes = UpdateProduct.parse(req.body);

  const updated = await products.findOneAndUpdate(
    { _id: new ObjectId(req.params.id), version: baseVersion },
    { $set: { ...changes, updatedBy: req.user.id, updatedAt: new Date() }, $inc: { version: 1 } },
    { returnDocument: 'after' },
  );

  if (!updated) {
    const current = await products.findOne({ _id: new ObjectId(req.params.id) });
    if (!current) throw new NotFoundError('product');
    // Return the current state so the client can show a diff
    return res.status(412).set('ETag', \`"\${current.version}"\`).json({
      type: 'https://api.acme.dev/problems/version-conflict',
      title: 'The product was changed by someone else',
      status: 412,
      current: toProductResponse(current),
    });
  }
  res.set('ETag', \`"\${updated.version}"\`).json(toProductResponse(updated));
});`,
        },
        {
          type: 'bullets',
          items: [
            'The check and the write are one operation. "Read, compare in JavaScript, then save" is a race of its own.',
            'Mongoose has a built-in version key (`__v`), but by default it only guards array changes. Enable `optimisticConcurrency: true` on the schema if you rely on `doc.save()`, or use an explicit `version` field as above.',
            'Use a numeric version, not `updatedAt`. Two writes in the same millisecond, or clock differences between servers, make timestamps unreliable.',
          ],
        },
        { type: 'heading3', text: '412 versus 409' },
        {
          type: 'bullets',
          items: [
            '**412 Precondition Failed**: the HTTP-level answer when an `If-Match` header no longer matches the current ETag. It is the standard pairing with conditional requests and works with generic HTTP tooling.',
            '**428 Precondition Required**: returned when the client did not send `If-Match` at all, so clients cannot skip the check.',
            '**409 Conflict**: an application-level conflict, for example when the version travels in the JSON body or the change clashes with a business rule ("order already shipped").',
            'Pick one convention per API, document it, and return Problem Details in both cases, including the current server state.',
          ],
        },
        {
          type: 'heading3',
          text: 'Angular: optimistic update with rollback in a signal store',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable({ providedIn: 'root' })
export class ProductStore {
  private api = inject(ProductApi);
  private readonly _products = signal<Record<string, Product>>({});
  readonly conflict = signal<{ mine: Product; theirs: Product } | null>(null);

  save(id: string, changes: Partial<Product>) {
    const before = this._products()[id];
    const optimistic = { ...before, ...changes };
    this._products.update((all) => ({ ...all, [id]: optimistic })); // UI updates instantly

    this.api.update(id, changes, before.version).subscribe({
      next: (saved) => this._products.update((all) => ({ ...all, [id]: saved })),
      error: (err: HttpErrorResponse) => {
        this._products.update((all) => ({ ...all, [id]: before })); // roll back
        if (err.status === 412 || err.status === 409) {
          this.conflict.set({ mine: optimistic, theirs: err.error.current });
        }
      },
    });
  }
}

// ProductApi.update sends the base version
update(id: string, changes: Partial<Product>, version: number) {
  return this.http.patch<Product>(\`/api/products/\${id}\`, changes, {
    headers: { 'If-Match': \`"\${version}"\` },
  });
}`,
        },
        { type: 'heading3', text: 'Resolving the conflict in the UI' },
        {
          type: 'bullets',
          items: [
            'Show a field-by-field diff: "Price was changed to $24 by Alice at 10:42. Your change: description."',
            'If the two edits touch different fields, offer "Apply my changes on top": re-send only the user’s changed fields with the new version. Automatic field-level merge is fine for independent fields, but never for the same field.',
            'Keep the user’s unsaved input; never throw away what they typed.',
            'For high-contention screens, add presence ("Bob is editing this") or a soft lock, so conflicts are rarer, while keeping the version check as the real guarantee.',
          ],
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            'PUT with the full document from a stale form overwrites fields the user never touched. Send PATCH with only the changed fields, and still check the version.',
            'Rapid double saves from the same user: the second request carries the old version and conflicts with itself. Queue saves (`concatMap`) or disable the button until the first one returns.',
            'Caches and CDNs serving stale ETags. Mark mutable API responses `Cache-Control: no-store` or `private, no-cache`.',
            'The optimistic UI shows success, then rolls back seconds later. Make the pending state visible (a subtle "Saving…") so the rollback is not a surprise.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'Why not pessimistic locking? — Holding a DB lock for minutes of human editing kills concurrency; soft locks with timeouts at most, plus the version check.',
            'How would you do this for real-time collaboration (Google Docs style)? — That needs operational transforms or CRDTs; version checks are for form-style editing.',
            'What about deletes? — Same rule: delete only if the version matches, otherwise return the conflict.',
            'Where else does this pattern apply? — Any read-modify-write: inventory counts, settings pages, workflow states.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Comparing versions in application code and then saving in a second query.',
            'Using `updatedAt` as the version.',
            'Rolling back the UI without telling the user why.',
            'Assuming Mongoose `__v` protects every field by default.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you explain why last-write-wins silently loses data, make the server check atomic, choose and document 412 or 409, return the current state so the UI can show a diff, and handle rollback and the user’s unsaved input in the client.',
        },
      ],
    },

  'How do you handle errors end to end so the user sees a useful message and support can trace it (Problem Details, interceptor, correlation ID, logging)?':
    {
      summary:
        'I give every request a correlation ID at the edge, carry it through the Node service in request context and logs, and return it in every error response together with a consistent Problem Details body. In Angular, one interceptor turns errors into the right UX (field errors on the form, a toast, a sign-in redirect or a retry) and a global `ErrorHandler` reports client-side bugs with the same ID. That way the user sees a clear message with a reference code, and support can paste that code into the log search and find the exact request on both sides.',
      details: [
        { type: 'heading3', text: 'End-to-end flow' },
        {
          type: 'numbered',
          items: [
            '**Edge** (load balancer, API gateway or the first middleware): reuse an incoming `X-Request-Id` or generate one; also propagate the W3C `traceparent` if you use tracing.',
            '**Node**: store the ID in `AsyncLocalStorage`, so every log line and outgoing call carries it.',
            '**Error**: the service throws a typed domain error; one error middleware maps it to status plus Problem Details, logs the full error, and sets the `X-Request-Id` response header.',
            '**Browser**: the Angular interceptor reads the status and the Problem Details body and decides how to show it.',
            '**Client bugs**: anything thrown in components goes to a global `ErrorHandler` and to error reporting (for example Sentry), tagged with the last request ID.',
            '**Support**: a user reports "reference 7f3a…", and one search finds the browser event, the API log and the trace.',
          ],
        },
        { type: 'heading3', text: 'Node: request ID and one error boundary' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Express 5
import { randomUUID } from 'node:crypto';

app.use((req, res, next) => {
  const id = req.get('X-Request-Id') ?? randomUUID();
  res.set('X-Request-Id', id);
  requestContext.run({ requestId: id, userId: undefined }, next); // AsyncLocalStorage
});

// ...routes...

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const requestId = res.get('X-Request-Id');
  const problem = toProblem(err); // AppError → 4xx with safe detail; unknown → generic 500

  logger.error({ err, requestId, status: problem.status, path: req.path }, 'request failed');
  res
    .status(problem.status)
    .type('application/problem+json')
    .json({ ...problem, instance: \`urn:request:\${requestId}\` });
});`,
        },
        {
          type: 'paragraph',
          text: 'The error hierarchy and the full middleware are covered in the Error Handling topic and the coding exercise; Problem Details itself is in API Design. What matters end to end: a stable `type` URI the client can switch on, a safe human `detail`, field errors in an `errors` extension for 400/422, and `instance` (or a `requestId` extension) that carries the correlation ID. Stack traces and SQL or Mongo error text stay in the logs, never in the response.',
        },
        {
          type: 'code',
          lang: 'json',
          code: `{
  "type": "https://api.acme.dev/problems/validation",
  "title": "Your request has invalid fields",
  "status": 422,
  "errors": [{ "field": "email", "message": "Email is already registered" }],
  "instance": "urn:request:7f3a9c2e-1b4d-4e8a-9f61-2c5d8e0b7a13"
}`,
        },
        { type: 'heading3', text: 'Angular: one interceptor decides the UX' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const router = inject(Router);
  const errors = inject(ErrorReporter);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const requestId = err.headers?.get('X-Request-Id') ?? undefined;
      const problem = isProblem(err.error) ? err.error : undefined;
      errors.setLastRequestId(requestId);

      if (err.status === 0) notify.error('You appear to be offline. Check your connection.');
      else if (err.status === 401) router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      else if (err.status === 403) notify.error('You do not have permission to do that.');
      else if (err.status === 400 || err.status === 422) {
        // Leave it to the form: the component maps problem.errors onto controls
      } else if (err.status >= 500) {
        notify.error(\`Something went wrong on our side. Reference: \${requestId?.slice(0, 8) ?? 'n/a'}\`);
      }
      return throwError(() => err); // callers can still react (stop spinners, roll back)
    }),
  );
};`,
        },
        {
          type: 'bullets',
          items: [
            'Validation errors belong next to the field: the form component maps `problem.errors` onto controls (`control.setErrors({ server: message })`) instead of showing a generic toast.',
            'Retry only idempotent requests (GET, or writes with an idempotency key), only for network errors, 502/503/504 or 429, with backoff, and respect `Retry-After`. Never automatically retry a POST that creates a payment.',
            'Register the interceptor once with `provideHttpClient(withInterceptors([requestIdInterceptor, errorInterceptor]))`. A request ID interceptor can also generate an ID in the browser and send it, so client-side reports and server logs share it from the first hop.',
          ],
        },
        { type: 'heading3', text: 'Angular: client-side bugs' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private reporter = inject(ErrorReporter);
  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) return; // already handled by the interceptor
    this.reporter.capture(error, { lastRequestId: this.reporter.lastRequestId, url: location.href });
    console.error(error);
  }
}
// app.config.ts
providers: [{ provide: ErrorHandler, useClass: AppErrorHandler }]`,
        },
        {
          type: 'paragraph',
          text: 'Upload source maps to the error-reporting tool privately, as part of the release, so production stack traces are readable without serving maps publicly. Tag every report with the release version, so you can tell whether a bug is from the new deploy or from users on an old cached bundle.',
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            'CORS hides custom headers: the browser will not expose `X-Request-Id` to Angular unless the API sends `Access-Control-Expose-Headers: X-Request-Id`. Putting the ID in the Problem Details body too avoids this.',
            'The proxy or gateway returns its own HTML 502 page, so the client gets no Problem Details. The interceptor must handle a non-JSON body.',
            'Error messages leak internals ("E11000 duplicate key on users.email_1") or confirm that an account exists. Map them to safe messages.',
            'Two layers both show a toast for the same error. Decide once that the interceptor owns generic errors and components own form errors.',
            'Request IDs are lost across a queue or background job because nobody copied them into the message headers.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'Request ID versus trace ID? — The request ID is a simple correlation key; OpenTelemetry `traceparent` also gives spans and timing across services. I log both.',
            'How do you avoid alert noise from 4xx errors? — Log them at info or warn level, alert on 5xx rate and latency against the SLO.',
            'Should the client show the server’s `detail` text directly? — Only for errors marked safe; otherwise map the `type` to a localised message.',
            'How do you handle errors in a `resource()` or `httpResource()`? — Read the `error()` signal in the template; the interceptor still runs for the HTTP call.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Returning `{ message: err.message }` with a stack trace in production.',
            'Swallowing errors with `catchError(() => of(null))` so the UI shows empty data instead of an error.',
            'Generating a new request ID in every service instead of propagating the incoming one.',
            'Using one generic "Something went wrong" for validation, auth and server failures alike.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you design the error path as one system across browser, API and logs, with a correlation ID from edge to UI, a single translation point on the server, clear ownership of UX between the interceptor and the forms, safe messages, and retries limited to idempotent requests.',
        },
      ],
    },

  'A user saves a change but still sees old data. How do you find which layer is stale: browser cache, CDN, Redis, or a read replica?':
    {
      summary:
        "I treat it as a bisection problem: the write succeeded somewhere, and one layer between the database primary and the screen is serving an older copy. I reproduce it, then walk the read path from the outside in — Angular state, browser HTTP cache, CDN, the API's Redis cache, and finally which MongoDB member served the read — checking response headers, cache keys and timestamps at each hop until I find the first layer that has the old value. Then I fix that layer's invalidation or consistency rule, not just that one record.",
      details: [
        {
          type: 'paragraph',
          text: 'Stale-after-save bugs are rarely in the write path. The `PUT` returned 200, the primary has the new value, and something on the **read** path is answering from a copy. Every caching layer you add is another place that can be correct-but-old. The skill an interviewer is looking for is a systematic method, not a guess.',
        },
        { type: 'heading3', text: 'The read path, and what can be stale at each hop' },
        {
          type: 'bullets',
          items: [
            '**Angular in-memory state**: a signal store, NgRx state, a `shareReplay(1)` observable or an `httpResource` that was never refreshed after the save.',
            '**Service worker**: `@angular/service-worker` data groups with a `performance` (cache-first) strategy can serve API responses from Cache Storage.',
            '**Browser HTTP cache**: the API sent `Cache-Control: max-age=...` (or no header and the browser applied heuristic caching to a response with `Last-Modified`).',
            '**CDN / reverse proxy**: CloudFront, Nginx or Varnish caching an API path it was never meant to cache, or a cache key that ignores the `Authorization` header or query string.',
            '**Redis (application cache)**: cache-aside entry not invalidated on write, invalidated under the wrong key, or re-populated by a concurrent read with the old value (the classic race).',
            '**MongoDB read replica**: the read used `readPreference: secondary`/`secondaryPreferred` and replication lag means the secondary has not applied the write yet.',
          ],
        },
        { type: 'heading3', text: 'My investigation, step by step' },
        {
          type: 'numbered',
          items: [
            '**Pin down the symptom**: which screen, which user, how long does it stay stale (a second? five minutes? until a hard refresh?). The duration is a strong clue: it often matches a TTL or `max-age`.',
            '**Check the source of truth**: query the primary directly (`readPreference: primary`) for the record and its `updatedAt`. If the primary is old, it is a write bug, not a cache bug.',
            '**Hard refresh / disable cache in DevTools**: if a reload with "Disable cache" shows the new value, the problem is client side (Angular state, service worker or browser HTTP cache).',
            '**Call the API directly** with `curl` and the same auth, bypassing the browser. Compare it with the response through the CDN hostname and through the origin hostname.',
            '**Bypass the app cache**: hit the endpoint with a debug flag or check Redis for the key and its TTL. If the DB is new and Redis is old, invalidation is broken.',
            '**Check which DB member served the read**: look at the read preference in the code path, and replication lag on the replica set.',
          ],
        },
        { type: 'heading3', text: 'Client side: Angular, service worker, browser cache' },
        {
          type: 'paragraph',
          text: 'In DevTools Network, look at the GET that loads the record after the save. The **Size** column says `(memory cache)`, `(disk cache)` or `(ServiceWorker)` when no network request was made. Check the response headers the API actually sent.',
        },
        {
          type: 'code',
          lang: 'javascript',
          code: `// Typical bug: the list is cached in a service and never refreshed after save
private orders$ = this.http.get<Order[]>('/api/orders').pipe(shareReplay(1));

save(order: Order) {
  return this.http.put(\`/api/orders/\${order.id}\`, order).pipe(
    // fix: update local state from the response, or trigger a reload
    tap((saved) => this.store.upsert(saved)),
  );
}`,
        },
        {
          type: 'bullets',
          items: [
            'Personal API data should usually be `Cache-Control: private, no-cache` (revalidate every time) or `no-store`; set it explicitly in Node instead of relying on defaults.',
            'For the service worker, API data groups should use the `freshness` strategy for data that changes; check `ngsw-config.json`.',
            'Prefer updating local state from the write response (the server returns the saved entity) over a second read that might hit a stale layer.',
          ],
        },
        { type: 'heading3', text: 'CDN and proxies' },
        {
          type: 'code',
          lang: 'bash',
          code: `# Through the CDN
curl -s -D - -o /dev/null -H "Authorization: Bearer $T" https://app.example.com/api/orders/42
# HTTP/2 200
# cache-control: public, max-age=300     <- someone made API responses cacheable
# age: 187                               <- served from cache, 187 s old
# x-cache: Hit from cloudfront

# Straight to the origin / load balancer
curl -s -D - -o /dev/null -H "Authorization: Bearer $T" https://origin.example.com/api/orders/42`,
        },
        {
          type: 'paragraph',
          text: 'A non-zero `Age` or `X-Cache: Hit` on an API response is the smoking gun. Fix the cache behaviour for `/api/*` (forward auth headers and query strings and honour origin `Cache-Control`, or disable caching for that path). For genuinely shared, cacheable data, use short TTLs plus targeted invalidation, as covered in the CDN caching answer in Web Performance.',
        },
        { type: 'heading3', text: 'Redis application cache' },
        {
          type: 'code',
          lang: 'bash',
          code: `redis-cli GET order:42          # cached copy
redis-cli TTL order:42          # seconds left; -1 means no expiry (a bug for cache entries)
redis-cli --scan --pattern 'order:42*'   # are there other keys for the same entity (list pages, per-user views)?`,
        },
        {
          type: 'bullets',
          items: [
            '**Wrong or missing key**: the write path deletes `order:42`, but the screen reads `orders:user:7:page:1`. Derived caches need their own invalidation (tags, versioned keys) — see the cache invalidation answer.',
            '**Race**: request A reads the old row (cache miss), the write updates the DB and deletes the key, then A writes its old value into the cache. Mitigate with delete-after-commit plus a short TTL, versioned values, or a delayed second delete.',
            '**Multi-instance in-process caches**: an LRU inside each Node instance is invalidated only on the instance that handled the write. Move it to Redis or broadcast invalidations (pub/sub).',
          ],
        },
        { type: 'heading3', text: 'MongoDB replica reads' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// mongosh: how far behind are the secondaries?
rs.printSecondaryReplicationInfo();

// Node: read-your-writes for this user's flow
const session = client.startSession({ causalConsistency: true });
await orders.updateOne({ _id }, { $set: patch }, { session, writeConcern: { w: 'majority' } });
const fresh = await orders.findOne(
  { _id },
  { session, readPreference: 'secondaryPreferred', readConcern: { level: 'majority' } },
);`,
        },
        {
          type: 'paragraph',
          text: 'If the read path uses secondaries, either read from the primary right after a write (a simple rule for "just saved" screens), use causally consistent sessions with majority read and write concerns, or return the updated document from the write (`findOneAndUpdate` with `returnDocument: "after"`) so no second read is needed. The same reasoning applies to PostgreSQL replicas, covered in the replica-lag answer in SQL.',
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            'Several layers are stale at once: fixing the CDN reveals the Redis bug. Keep bisecting until the direct-to-primary read and the screen agree.',
            'The bug is intermittent because load balancing sends some requests to an instance with an old in-memory cache, or reads to a lagging secondary.',
            '"Fixing" it with `?nocache=timestamp` on the client hides the cause and destroys cache efficiency for everyone.',
            'Over-correcting by disabling every cache can overload MongoDB; the fix should be correct invalidation and explicit consistency rules per screen.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'How would you prevent this class of bug? — An explicit cache policy per endpoint, write responses that return the entity, read-your-writes rules, and a test that saves then reads through the real stack.',
            'What headers do you set on API responses by default? — `Cache-Control: private, no-cache` (or `no-store` for sensitive data) and an `ETag` for cheap revalidation.',
            'When is eventual consistency acceptable? — Feeds, counters and dashboards; not the screen the user just edited.',
            'How do you invalidate a list page when one item changes? — Tag or version keys (e.g. `orders:v{n}`), or short TTLs for lists plus event-driven invalidation.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Guessing a layer and clearing caches until it "works", without proving which one was stale.',
            'Forgetting the service worker and the browser cache when testing with DevTools open (Disable cache hides the bug).',
            'Letting a CDN cache authenticated API responses because the behaviour for `/api/*` inherited the static-asset settings.',
            'Using `secondaryPreferred` globally for "performance" without deciding which screens need read-your-writes.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you bisect the read path layer by layer with evidence (headers, `Age`, TTLs, replica lag) instead of guessing, you explain why the write succeeded but a copy is old, and you finish with a policy — per-endpoint cache rules and read-your-writes guarantees — so the whole class of bug goes away.',
        },
      ],
    },

  'A page is slow. How do you work out whether the problem is in Angular, the network, the API or the database, and which tools do you use?':
    {
      summary:
        'I first measure where the time goes before touching code: is it slow for everyone or some users, on first load or on every interaction, and is the time spent waiting for the network or running JavaScript? DevTools Network and Performance panels split the browser side from the server side, `Server-Timing` headers and a distributed trace split the API into its own work, Redis and MongoDB, and `explain()` tells me why a query is slow. I fix the biggest measured slice first and confirm with field data.',
      details: [
        {
          type: 'paragraph',
          text: 'Slowness is a budget spread across layers: download and render in the browser, network latency and TLS, load balancer and Node, then cache and database. The interviewer wants to hear how you **attribute** the time, not a list of optimisations.',
        },
        { type: 'heading3', text: 'Step by step' },
        {
          type: 'numbered',
          items: [
            '**Define "slow"**: first load (LCP), interaction (INP), or a specific data view? For everyone, a region, a device class or a single tenant? Check RUM / CrUX field data before trusting one laptop.',
            '**Record it in DevTools Performance** with CPU throttling, then look at the Network panel for the same action.',
            '**Split client vs server time**: long main-thread tasks mean Angular / JavaScript; long "Waiting for server response" (TTFB) means the API or something before it.',
            '**Break down server time** with `Server-Timing` and the distributed trace (OpenTelemetry from browser to DB).',
            '**Drill into the slowest span**: query plans for MongoDB, Redis latency, external calls, event-loop blocking.',
            '**Fix, then verify** in the same tools and in field metrics after deploy.',
          ],
        },
        { type: 'heading3', text: 'Browser and Angular' },
        {
          type: 'bullets',
          items: [
            '**Network panel → Timing tab** for each request: *Queueing/Stalled* (too many parallel requests on HTTP/1.1, or low priority), *DNS / Initial connection / SSL* (new connections, missing `preconnect`), *Waiting for server response* (TTFB, server side), *Content Download* (payload too big, no compression).',
            "**Waterfall shape**: requests in a chain (component loads, then calls API A, then B using A's result) are a design problem — parallelise, use a resolver or a BFF endpoint that aggregates.",
            '**Performance panel**: long tasks in `ApplicationRef.tick` / change detection, large `@for` lists without virtualisation, heavy pipes or template method calls. Angular DevTools Profiler shows which components check and how long.',
            '**Bundle**: a large initial chunk delays everything; see the bundle analysis and LCP answers in Performance and Web Performance.',
          ],
        },
        { type: 'heading3', text: 'Network and edge' },
        {
          type: 'bullets',
          items: [
            'High TTFB for static assets only from some regions → CDN miss or no CDN in front; check `X-Cache` and `Age` headers.',
            "TTFB high on the load balancer but low in Node's own timing → queuing before the app: saturated instances, too few tasks, slow TLS termination, or a proxy buffering.",
            'Missing `Content-Encoding: br/gzip` on large JSON, or responses of several MB because the API over-fetches.',
          ],
        },
        { type: 'heading3', text: 'API: make the server tell you where time goes' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Express middleware: expose a per-request breakdown in DevTools (Timing tab shows Server-Timing)
app.use((req, res, next) => {
  const marks: string[] = [];
  res.locals.time = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try { return await fn(); }
    finally { marks.push(\`\${name};dur=\${(performance.now() - start).toFixed(1)}\`); }
  };
  const writeHead = res.writeHead;
  res.writeHead = function (...args: any[]) {
    if (marks.length) res.setHeader('Server-Timing', marks.join(', '));
    return writeHead.apply(this, args as any);
  } as typeof res.writeHead;
  next();
});

// In a handler
const user = await res.locals.time('redis', () => cache.get(key));
const orders = await res.locals.time('mongo', () => Orders.find(q).lean());`,
        },
        {
          type: 'paragraph',
          text: 'Expose `Server-Timing` only to internal users or strip detail in production if it leaks too much. For the full picture, use OpenTelemetry: instrument the Angular app (fetch/XHR) to start a trace and propagate `traceparent`, and auto-instrument Express/NestJS, the MongoDB driver and ioredis. One trace then shows browser request → API handler → each query, and you can see if time is in a query, in waiting for a connection from the pool, or in Node itself (event-loop lag).',
        },
        { type: 'heading3', text: 'Database and cache' },
        {
          type: 'code',
          lang: 'javascript',
          code: `// The slow span is a MongoDB query: why?
db.orders.find({ tenantId: 't1', status: 'open' }).sort({ createdAt: -1 }).limit(50)
  .explain('executionStats');
// Look for: COLLSCAN or an in-memory SORT stage,
// totalDocsExamined >> nReturned, executionTimeMillis

// Redis: is the cache slow or just missing?
// redis-cli --latency ; INFO stats -> keyspace_hits / keyspace_misses`,
        },
        {
          type: 'bullets',
          items: [
            'N+1 patterns (one query per row, or `populate()` in a loop) show up as dozens of short identical spans in the trace.',
            'Waiting to *get* a connection is different from a slow query: check pool wait metrics (see the connection pool exhaustion scenario).',
            'A low cache hit rate means the cache is not helping; a slow Redis usually means big values, `KEYS`, or network distance.',
          ],
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            'Optimising what is easy to see (bundle size) while 80% of the time is one unindexed query.',
            'Testing on a fast laptop and local API: the problem only appears on mid-range phones or far from the region.',
            'Averages hide it: always look at p95/p99 and slice by tenant, endpoint and region.',
            'Adding tracing with 100% sampling and high-cardinality attributes in production, which adds cost and latency itself.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'How do you know it is the event loop and not the DB? — Event-loop lag/utilisation metrics rise and all endpoints slow down together; DB spans stay short.',
            'The API is fast but the page is still slow — what next? — Main-thread long tasks, request chaining, render-blocking resources, change detection cost.',
            'How do you stop it regressing? — Performance budgets in CI, SLOs on p95 latency per endpoint, alerts on query time and RUM regression.',
            'Would you add a cache? — Only after measuring; caching hides a bad query and adds invalidation work.',
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Jumping to a fix ("add Redis", "use OnPush") before measuring which layer owns the time.',
            'Reading only total load time instead of the per-request Timing breakdown.',
            'Ignoring request waterfalls caused by component design.',
            'Not correlating frontend and backend data — no shared trace or request ID.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you attribute time with evidence across every layer (RUM → Network timing → `Server-Timing`/trace → `explain()`), you name the specific tool for each hop, you prioritise by the largest measured slice at p95, and you close the loop with budgets and SLOs so it does not come back.',
        },
      ],
    },

  'How do you roll out a breaking API change while users still have old Angular bundles cached in their browsers?':
    {
      summary:
        'I avoid a hard cut: a SPA is a client I do not control, and some users keep a tab open for days. I make the change additive first (expand), ship an Angular release that uses the new shape, measure until traffic from old clients is near zero, and only then remove the old path (contract). To shorten that tail I make sure new bundles are picked up quickly (`index.html` not cached, hashed immutable assets, a version check that prompts "please reload"), and I keep a minimum-supported-client-version check as a safety valve.',
      details: [
        {
          type: 'paragraph',
          text: 'With a SPA, the deployed frontend is not the running frontend. The browser keeps the JavaScript it loaded until the user reloads, and a service worker may keep serving an old version even after a reload. So for some time, **old and new clients call the same API**. The API has to stay compatible with both, exactly like a database schema during a rolling deploy (the expand-and-contract answer in SQL).',
        },
        { type: 'heading3', text: 'Rollout plan' },
        {
          type: 'numbered',
          items: [
            '**Expand the API**: add the new field, endpoint or behaviour alongside the old one. Old clients keep working; nothing is removed.',
            '**Ship the new Angular version** that uses only the new contract. Include the client version on every request (`X-Client-Version` header).',
            '**Speed up adoption**: version check plus "a new version is available" prompt; `SwUpdate` if you use the service worker.',
            '**Measure**: dashboard of requests per client version and per old endpoint/field usage.',
            '**Contract**: once old-client traffic is below an agreed threshold (or older than your support window), remove the old path. Optionally first return a typed Problem Details error (for example with `type` set to `/problems/client-outdated`) that triggers a forced reload for the stragglers. Avoid `426 Upgrade Required` for this: it is defined for protocol upgrades and requires an `Upgrade` header.',
          ],
        },
        { type: 'heading3', text: 'Make the API change additive' },
        {
          type: 'bullets',
          items: [
            "**Add, don't rename**: need `fullName` instead of `name`? Return both for a while; accept both on input, preferring the new one.",
            '**Tolerant reader** on both sides: clients ignore unknown fields; the server ignores unknown optional input and fills defaults for missing new fields.',
            '**New enum values** break old clients that switch exhaustively — make clients handle "unknown" safely before the server starts sending new values.',
            '**Genuinely incompatible semantics** → a new endpoint or version (`/v2/orders`, or a versioned media type), as covered in the API versioning answer. Run both until v1 traffic dies.',
          ],
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Express: serve old and new shape during the transition
app.get('/api/users/:id', async (req, res) => {
  const user = await users.get(req.params.id);
  res.json({
    id: user.id,
    fullName: user.fullName,
    name: user.fullName, // @deprecated: remove when clients < 5.2.0 are gone
  });
});

// Count who still needs the old field
app.use((req, _res, next) => {
  metrics.increment('api.requests', { clientVersion: req.get('X-Client-Version') ?? 'unknown' });
  next();
});`,
        },
        { type: 'heading3', text: 'Get users onto the new bundle quickly' },
        {
          type: 'bullets',
          items: [
            '**Caching rules**: `index.html` (and `ngsw.json`) with `Cache-Control: no-cache`; hashed JS/CSS with `public, max-age=31536000, immutable`. Then a reload always gets the new app. On S3 + CloudFront, set these per object and invalidate `/index.html` on deploy (see the S3/CloudFront hosting answer).',
            '**Keep old chunks available** for a while after deploy, so an old tab can still lazy-load its routes instead of hitting a `ChunkLoadError` (see the ChunkLoadError answer).',
            '**Version polling**: the build writes `version.json`; the app polls it (on an interval and on `visibilitychange`) and shows a non-blocking "Update available — reload" banner. Reload automatically on the next route change if the user has no unsaved form.',
            '**Service worker**: with `@angular/service-worker`, listen to `SwUpdate.versionUpdates` for `VERSION_READY`, then `activateUpdate()` and reload; handle `unrecoverable` by reloading.',
          ],
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Angular: react to a server-side "client too old" signal
export const clientVersionInterceptor: HttpInterceptorFn = (req, next) => {
  const updates = inject(AppUpdateService);
  return next(req.clone({ setHeaders: { 'X-Client-Version': APP_VERSION } })).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.error?.type === '/problems/client-outdated') {
        updates.promptReload(); // save drafts, then location.reload()
      }
      return throwError(() => err);
    }),
  );
};`,
        },
        {
          type: 'paragraph',
          text: 'On the server, a small middleware compares `X-Client-Version` with a configured minimum and returns that Problem Details response only for endpoints whose contract was actually removed. It is a safety valve for stragglers, not the main migration mechanism.',
        },
        { type: 'heading3', text: 'What can go wrong' },
        {
          type: 'bullets',
          items: [
            'Removing the old field the same day: users with open tabs get broken screens or silent data loss on save (an old client PUTs without the new required field).',
            'Mobile apps or third-party integrations use the same API and update far slower than the SPA — check all consumers, not only Angular.',
            'Forced reload while a user is filling a long form; always preserve drafts or wait for a safe moment.',
            'A cached `index.html` at the CDN or a stuck service worker keeps serving the old app even after reload, so old-client traffic never drops.',
            'Missing version header (`unknown`) makes it impossible to know when it is safe to contract.',
          ],
        },
        { type: 'heading3', text: 'Follow-up questions interviewers ask' },
        {
          type: 'bullets',
          items: [
            'How long do you keep the old path? — Until old-client traffic is negligible, bounded by a support window (e.g. two releases or 30 days); decided with data.',
            "How do you handle writes during the transition? — The server accepts both shapes and writes the new model; old clients' missing fields get defaults, never rejections.",
            'What about the database? — Same pattern underneath: expand schema, dual-write or backfill, switch reads, contract later.',
            "How do you test compatibility? — Contract tests that run the previous client version's expectations against the new API.",
          ],
        },
        { type: 'heading3', text: 'Common mistakes' },
        {
          type: 'bullets',
          items: [
            'Assuming deploying the frontend and backend together means clients are in sync.',
            'Caching `index.html` long-term, so users need a hard refresh to get new releases.',
            'Using API versioning for every small change instead of additive evolution.',
            'Removing the old contract based on a date rather than measured traffic.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Senior signal: you recognise that a deployed SPA is an old client you cannot update instantly, apply expand-and-contract at the API boundary, actively shorten the old-client tail (cache headers, version polling, `SwUpdate`), and contract only when per-version traffic metrics say it is safe.',
        },
      ],
    },
};
