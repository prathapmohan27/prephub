var e={"http-status-code-ranges":{summary:`Status codes are three-digit numbers in every HTTP response that tell the client the outcome. **2xx** = success (200 OK, 201 Created, 204 No Content), **3xx** = redirection or "use your cache" (301, 302, 304, 307, 308), **4xx** = the client made an error (400, 401, 403, 404, 409, 422, 429), **5xx** = the server failed (500, 502, 503, 504). 1xx are informational (e.g. 101 Switching Protocols).`,details:[{type:`paragraph`,text:'The first digit is the class, and clients, proxies, CDNs, retry logic and monitoring all rely on it. A correct code means a load balancer knows whether to retry, a browser knows whether to cache, and your dashboards can separate "users sent bad input" (4xx) from "we are broken" (5xx). Returning `200 { error: ... }` for failures breaks all of that.'},{type:`heading3`,text:`2xx — Success`},{type:`bullets`,items:[`**200 OK** — generic success with a body (GET, or PUT/PATCH returning the resource).`,"**201 Created** — POST created a resource; include a `Location` header.",`**202 Accepted** — request queued for async processing (return a job/status URL).`,`**204 No Content** — success with no body (DELETE, or PUT without returning data).`,`**206 Partial Content** — range requests (video seeking, resumable downloads).`]},{type:`heading3`,text:`3xx — Redirection`},{type:`bullets`,items:[`**301 Moved Permanently / 308 Permanent Redirect** — resource moved for good; 308 guarantees the method and body are preserved.`,`**302 Found / 307 Temporary Redirect** — temporary move; 307 preserves the method (a POST stays a POST), 302 is often turned into GET by clients.`,`**303 See Other** — after a POST, "go GET this other URL" (Post/Redirect/Get pattern).`,"**304 Not Modified** — conditional GET (`If-None-Match` / `If-Modified-Since`) matched; the client uses its cached copy."]},{type:`heading3`,text:`4xx — Client errors (do not retry unchanged)`},{type:`bullets`,items:[`**400 Bad Request** — malformed syntax or failed validation.`,"**401 Unauthorized** — actually means **unauthenticated**: missing/invalid credentials (send `WWW-Authenticate`).",`**403 Forbidden** — authenticated but not allowed.`,`**404 Not Found** — no such resource (also used to hide existence from unauthorized users).`,`**405 Method Not Allowed**, **406 Not Acceptable**, **415 Unsupported Media Type**.`,`**409 Conflict** — state conflict: duplicate email, version mismatch.`,"**410 Gone**, **412 Precondition Failed** (optimistic locking with `If-Match`).",`**422 Unprocessable Content** — syntactically valid but semantically invalid (common for validation errors).`,"**429 Too Many Requests** — rate limited; include `Retry-After`."]},{type:`heading3`,text:`5xx — Server errors (often retryable)`},{type:`bullets`,items:[`**500 Internal Server Error** — unhandled exception; never leak stack traces in the body.`,`**501 Not Implemented** — method not supported by the server at all.`,`**502 Bad Gateway** — a proxy got an invalid response from upstream (e.g. app crashed).`,"**503 Service Unavailable** — overloaded or in maintenance; `Retry-After` helps clients.",`**504 Gateway Timeout** — the proxy timed out waiting for the upstream.`]},{type:`code`,lang:`javascript`,code:`// Express examples
app.post('/users', async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(422).json({ errors });

  if (await users.existsByEmail(req.body.email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = await users.create(req.body);
  res.status(201).location(\`/users/\${user.id}\`).json(user);
});

app.delete('/users/:id', async (req, res) => {
  const deleted = await users.delete(req.params.id);
  res.sendStatus(deleted ? 204 : 404);
});`},{type:`flow`,title:`Picking an error code`,code:`flowchart TD
  S{"Did the server fail?"} -->|Yes| F{"Upstream problem?"}
  F -->|"bad response"| C502["502"]:::external
  F -->|"timeout"| C504["504"]:::external
  F -->|"overloaded"| C503["503"]:::external
  F -->|"bug"| C500["500"]:::external
  S -->|"No, client issue"| A{"Authenticated?"}
  A -->|No| C401["401"]:::security
  A -->|"Yes, not allowed"| C403["403"]:::security
  A -->|"Yes, allowed"| V{"Input valid?"}
  V -->|No| C400["400 / 422"]:::highlight
  V -->|"conflict"| C409["409"]:::highlight`},{type:`callout`,variant:`tip`,text:'The classic trap: 401 vs 403. 401 = "who are you?" (log in / refresh your token), 403 = "I know who you are, and you can\'t do this." Also mention that retry logic should retry 502/503/504 and 429 (respecting `Retry-After`) but not other 4xx.'}]},"http-1-1-vs-http-2-vs-http-3":{summary:`**HTTP/1.1** is text-based over TCP: one request at a time per connection, so browsers open ~6 connections and suffer head-of-line blocking. **HTTP/2** is binary over a single TCP connection with **multiplexed streams**, HPACK header compression and prioritisation — but a lost TCP packet still stalls every stream. **HTTP/3** runs over **QUIC** (on UDP), with streams independent at the transport level, TLS 1.3 built in, faster 0-/1-RTT handshakes and connection migration across networks.`,details:[{type:`paragraph`,text:`The semantics are the same in all three — methods, headers, status codes, URLs. What changed is how bytes travel over the wire. Each version fixes the main bottleneck of the previous one.`},{type:`heading3`,text:`HTTP/1.1 (1997)`},{type:`bullets`,items:[`Plain-text messages, persistent connections (keep-alive) by default.`,`One outstanding request per connection in practice (pipelining exists but is broken/disabled), so a slow response blocks the ones behind it — **application-level head-of-line blocking**.`,`Workarounds: multiple connections per origin, domain sharding, bundling/spriting, inlining.`,`Headers repeated uncompressed on every request (cookies can be KBs).`]},{type:`heading3`,text:`HTTP/2 (2015)`},{type:`bullets`,items:[`Binary framing; many concurrent **streams** multiplexed over one TCP connection.`,`**HPACK** header compression (static + dynamic tables).`,`Stream prioritisation and flow control.`,`Server push existed but was little used and has been removed from major browsers.`,`Remaining problem: **TCP head-of-line blocking** — one lost packet stalls all streams until it is retransmitted, which hurts on lossy mobile networks.`,"Browsers only use it over TLS (h2); `h2c` (cleartext) is used between internal services, e.g. gRPC."]},{type:`heading3`,text:`HTTP/3 (RFC 9114, 2022)`},{type:`bullets`,items:[`Runs on **QUIC**, a transport over UDP that implements reliability and congestion control per stream — a lost packet only delays its own stream.`,`TLS 1.3 is integrated: new connections in 1 RTT, resumed ones can use 0-RTT (with replay caveats).`,`**Connection migration**: connections are identified by a connection ID, so switching from Wi-Fi to 4G does not drop them.`,`**QPACK** header compression (HPACK adapted for out-of-order delivery).`,"Discovered via the `Alt-Svc` header or DNS HTTPS records; falls back to HTTP/2 if UDP is blocked."]},{type:`flow`,title:`Protocol stacks compared`,code:`flowchart TB
  subgraph H1["HTTP/1.1"]
    A1["HTTP/1.1 text"]:::client --> B1["TLS (optional)"]:::security --> C1["TCP"]:::network
  end
  subgraph H2["HTTP/2"]
    A2["HTTP/2 binary frames<br/>multiplexed streams"]:::client --> B2["TLS 1.2+"]:::security --> C2["TCP"]:::network
  end
  subgraph H3["HTTP/3"]
    A3["HTTP/3 frames"]:::client --> B3["QUIC + TLS 1.3<br/>per-stream delivery"]:::highlight --> C3["UDP"]:::network
  end`},{type:`heading3`,text:`In Node.js`},{type:`code`,lang:`javascript`,code:`import http2 from 'node:http2';
import fs from 'node:fs';

// HTTP/2 server (with HTTP/1.1 fallback for old clients)
const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  allowHTTP1: true,
});

server.on('stream', (stream, headers) => {
  stream.respond({ ':status': 200, 'content-type': 'application/json' });
  stream.end(JSON.stringify({ path: headers[':path'] }));
});
server.listen(8443);

// HTTP/3 / QUIC support in Node core is still experimental \u2014 in production,
// terminate HTTP/3 at a CDN or proxy (Cloudflare, nginx, Caddy, Envoy)
// and speak HTTP/1.1 or HTTP/2 to Node behind it.`},{type:`callout`,variant:`tip`,text:`Practical takeaway: with HTTP/2+ the old HTTP/1.1 tricks (domain sharding, aggressive bundling, sprites) are unnecessary or even harmful. And most Node apps get HTTP/2 and HTTP/3 "for free" by putting a CDN or reverse proxy in front.`}]},"http-keep-alive":{summary:"Keep-Alive (persistent connections) means reusing one TCP (and TLS) connection for multiple HTTP requests instead of opening a new one each time, saving the TCP handshake, TLS handshake and slow-start costs. It is the default in HTTP/1.1. In Node you tune it on the server (`keepAliveTimeout`, `headersTimeout`) and — very important for outbound calls — on the client with a keep-alive `Agent` or undici's pooled dispatcher.",details:[{type:`paragraph`,text:"Opening a connection to a server costs one round trip for TCP and one or two more for TLS. For a service making thousands of calls per second to another API or database proxy, creating a fresh connection per request wastes latency and CPU and can exhaust ephemeral ports (lots of sockets in `TIME_WAIT`). Reusing connections fixes that."},{type:`heading3`,text:`Server side`},{type:`code`,lang:`javascript`,code:`import http from 'node:http';

const server = http.createServer(app);

// How long an idle connection is kept open waiting for the next request (default 5s)
server.keepAliveTimeout = 65_000;
// Must be larger than keepAliveTimeout, or Node may cut connections mid-request
server.headersTimeout = 66_000;

server.listen(3000);`},{type:`callout`,variant:`warning`,text:"Classic production bug: an AWS ALB (idle timeout 60s by default) or nginx keeps a connection open longer than Node's 5s `keepAliveTimeout`. Node closes the socket just as the proxy sends a new request on it → sporadic **502 Bad Gateway**. Fix: Node's `keepAliveTimeout` must be **greater** than the proxy's idle timeout."},{type:`heading3`,text:`Client side (outbound requests)`},{type:`code`,lang:`javascript`,code:`import http from 'node:http';
import https from 'node:https';

// Reuse sockets across requests with a pooled agent
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,        // max concurrent connections per host
  maxFreeSockets: 10,    // idle sockets kept warm
  timeout: 60_000,
});

https.get('https://api.example.com/items', { agent }, (res) => { /* ... */ });

// axios: pass the agent
const client = axios.create({ httpsAgent: agent });

// fetch (undici) in Node 18+ already pools and keeps connections alive.
// Tune it with a custom dispatcher if needed:
import { Agent, setGlobalDispatcher } from 'undici';
setGlobalDispatcher(new Agent({ connections: 100, keepAliveTimeout: 30_000 }));`},{type:`flow`,title:`Without vs with keep-alive`,code:`sequenceDiagram
  participant C as Client
  participant S as Server
  Note over C,S: Without keep-alive (each request)
  C->>S: TCP + TLS handshake
  C->>S: GET /a
  S-->>C: 200 then close
  Note over C,S: With keep-alive
  C->>S: TCP + TLS handshake (once)
  C->>S: GET /a
  S-->>C: 200
  C->>S: GET /b (same socket)
  S-->>C: 200`},{type:`bullets`,items:["HTTP/1.0 needed `Connection: keep-alive`; HTTP/1.1 is persistent unless `Connection: close` is sent.","The `Keep-Alive: timeout=5, max=1000` response header advertises the server's limits.","Since Node 19, the default `http.globalAgent` uses `keepAlive: true`.",`HTTP/2 goes further: one connection carries many concurrent requests (multiplexing).`,`Downsides: idle connections consume file descriptors and memory; set sensible idle timeouts and pool sizes.`,"Not the same as **TCP keepalive** (`socket.setKeepAlive()`), which sends OS-level probes to detect dead peers."]}]},"tls-and-https-in-node-js":{summary:"TLS (the successor to SSL, which is deprecated and insecure) encrypts traffic between client and server, authenticates the server with an X.509 certificate signed by a trusted CA, and guarantees integrity. HTTPS is HTTP over TLS. In Node you can use `https.createServer({ key, cert }, app)`, but in production TLS is usually terminated at a load balancer, reverse proxy or CDN (with automatic certificates, e.g. Let's Encrypt or ACM) and Node serves plain HTTP behind it.",details:[{type:`paragraph`,text:`TLS provides three guarantees: **confidentiality** (symmetric encryption with keys agreed during the handshake), **integrity** (tampering is detected) and **authentication** (the certificate proves you are talking to example.com, not an attacker). Current versions are TLS 1.2 and 1.3; SSLv3, TLS 1.0 and 1.1 are deprecated.`},{type:`heading3`,text:`The TLS 1.3 handshake, simplified`},{type:`flow`,title:`TLS 1.3 handshake (1 round trip)`,code:`sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello (versions, ciphers, key share, SNI)
  S-->>C: ServerHello (key share) + Certificate + Finished
  Note over C: Verify cert chain against trusted CAs and hostname
  C->>S: Finished
  Note over C,S: Both derive session keys (ECDHE) and send encrypted HTTP`},{type:`bullets`,items:[`Key exchange is ephemeral Diffie-Hellman (ECDHE), giving **forward secrecy**: stealing the server's private key later cannot decrypt recorded traffic.`,`The certificate's private key only signs the handshake; bulk data uses fast symmetric ciphers (AES-GCM, ChaCha20-Poly1305).`,`**SNI** lets one IP host many certificates; **ALPN** negotiates h2 vs http/1.1.`]},{type:`heading3`,text:`HTTPS directly in Node`},{type:`code`,lang:`javascript`,code:`import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import express from 'express';

const app = express();
app.get('/', (req, res) => res.send('secure'));

https
  .createServer(
    {
      key: fs.readFileSync('/etc/ssl/private/server.key'),
      cert: fs.readFileSync('/etc/ssl/certs/fullchain.pem'), // include intermediate certs
      minVersion: 'TLSv1.2',
    },
    app,
  )
  .listen(443);

// Redirect plain HTTP \u2192 HTTPS
http.createServer((req, res) => {
  res.writeHead(301, { Location: \`https://\${req.headers.host}\${req.url}\` });
  res.end();
}).listen(80);`},{type:`code`,lang:`bash`,code:`# Self-signed cert for local development only
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \\
  -keyout key.pem -out cert.pem -subj "/CN=localhost"
# (or use mkcert to create a locally-trusted dev CA)`},{type:`heading3`,text:`Production: terminate TLS at the edge`},{type:`code`,lang:`javascript`,code:`// Node behind nginx / ALB / Cloudflare receives HTTP with forwarding headers
app.set('trust proxy', 1); // trust X-Forwarded-Proto/For from ONE proxy hop
app.use((req, res, next) => {
  if (req.secure) return next(); // req.secure reads X-Forwarded-Proto when trusted
  res.redirect(301, \`https://\${req.headers.host}\${req.url}\`);
});
// Plus HSTS so browsers never try plain HTTP again
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));`},{type:`bullets`,items:[`Edge termination centralises certificate renewal (Let's Encrypt/ACME, AWS ACM), cipher config and HTTP/2/3.`,`For zero-trust internal networks, use mTLS between services (often via a service mesh like Istio/Linkerd).`,"Outbound calls: never set `rejectUnauthorized: false` or `NODE_TLS_REJECT_UNAUTHORIZED=0` in production — it disables certificate verification and enables MITM attacks. Use `ca` or `NODE_EXTRA_CA_CERTS` for private CAs."]},{type:`callout`,variant:`tip`,text:'Say "TLS", not "SSL" — and add that the usual production setup is TLS at the load balancer, HSTS enabled, `trust proxy` configured correctly in Express, and automated certificate renewal. That shows real-world experience.'}]},"request-timeouts-in-http-servers":{summary:"Use the built-in server limits — `server.requestTimeout` (whole request received, default 300s), `server.headersTimeout` (headers received, default 60s), `server.timeout` (socket inactivity, default disabled) and `server.keepAliveTimeout` — plus an **application-level** deadline per request (middleware that responds 503/504 after N ms and aborts downstream work via `AbortSignal`). For outbound calls, always set timeouts with `AbortSignal.timeout()` or the client's timeout option.",details:[{type:`paragraph`,text:`Timeouts protect you in two directions. **Inbound**: slow or malicious clients (Slowloris attacks send headers one byte at a time) can tie up sockets forever. **Outbound**: if a dependency hangs and you have no timeout, every request waiting on it piles up, memory grows and the whole service stalls. A good setup has layered timeouts that get shorter the deeper you go.`},{type:`heading3`,text:`1. Server-level limits (Node core)`},{type:`code`,lang:`javascript`,code:`import http from 'node:http';

const server = http.createServer(app);

server.headersTimeout = 20_000;   // client must send all headers within 20s (Slowloris)
server.requestTimeout = 30_000;   // entire request (headers + body) within 30s \u2192 408
server.keepAliveTimeout = 65_000; // idle keep-alive connection lifetime (> proxy idle timeout)
server.setTimeout(120_000, (socket) => socket.destroy()); // socket inactivity

server.listen(3000);`},{type:`paragraph`,text:`Note these limits are about **receiving** the request or socket inactivity — they do not stop your handler if it is slowly waiting on a database. For that you need an application-level deadline.`},{type:`heading3`,text:`2. Per-request deadline middleware (Express)`},{type:`code`,lang:`javascript`,code:`function deadline(ms) {
  return (req, res, next) => {
    const controller = new AbortController();
    req.signal = controller.signal; // pass to DB/HTTP calls so work is cancelled

    const timer = setTimeout(() => {
      controller.abort(new Error('Request deadline exceeded'));
      if (!res.headersSent) res.status(503).json({ error: 'Request timed out' });
    }, ms);

    res.on('close', () => clearTimeout(timer)); // finished or client disconnected
    next();
  };
}

app.use(deadline(10_000));

app.get('/report', async (req, res) => {
  const data = await fetch('http://reports.internal/build', { signal: req.signal });
  if (!res.headersSent) res.json(await data.json());
});`},{type:`heading3`,text:`3. Outbound timeouts`},{type:`code`,lang:`javascript`,code:`// fetch: AbortSignal.timeout (Node 18+)
try {
  const res = await fetch('https://payments.example.com/charge', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3_000),
  });
} catch (err) {
  if (err.name === 'TimeoutError') { /* retry with backoff or fail fast */ }
}

// Combine the request deadline with a per-call timeout
const signal = AbortSignal.any([req.signal, AbortSignal.timeout(2_000)]);

// axios
axios.get(url, { timeout: 3_000 });

// Databases: driver options, e.g. pg statement_timeout, Mongo maxTimeMS`},{type:`heading3`,text:`NestJS: timeout interceptor`},{type:`code`,lang:`typescript`,code:`@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      timeout(10_000),
      catchError((e) => throwError(() => (e instanceof TimeoutError ? new RequestTimeoutException() : e))),
    );
  }
}`},{type:`flow`,title:`Layered timeouts (outer > inner)`,code:`flowchart LR
  C["Client<br/>30s"]:::client --> LB["Load balancer<br/>idle 60s"]:::network
  LB --> N["Node request<br/>deadline 10s"]:::server
  N --> API["Downstream API<br/>3s"]:::external
  N --> DB[("DB query<br/>2s")]:::db`},{type:`callout`,variant:`warning`,text:"Sending a 503 does not stop the work: without passing an `AbortSignal` to downstream calls, the slow query keeps running and still consumes resources. Also make sure the inner timeouts are shorter than the outer ones, otherwise the proxy gives up first and you get confusing 504s."}]},"rest-vs-graphql-vs-grpc":{summary:`**REST** models resources as URLs and uses HTTP methods and status codes, usually with JSON — simple, cacheable, universal. **GraphQL** exposes one endpoint and a typed schema where the client asks for exactly the fields it needs — great for varied frontends, but caching, N+1 queries and cost control are harder. **gRPC** is contract-first RPC with Protocol Buffers over HTTP/2 — compact, fast, strongly typed, with streaming — ideal for service-to-service, less so for browsers.`,details:[{type:`paragraph`,text:`They are different styles for different audiences. A common architecture uses all three: gRPC between internal microservices, a GraphQL or BFF layer aggregating data for web and mobile apps, and REST for public/partner APIs and webhooks.`},{type:`heading3`,text:`REST`},{type:`code`,lang:`bash`,code:`GET    /users/42            \u2192 200 { "id": 42, "name": "Asha", ... all fields }
GET    /users/42/orders     \u2192 second round trip for related data
POST   /users               \u2192 201 Created
PATCH  /users/42            \u2192 200
DELETE /users/42            \u2192 204`},{type:`heading3`,text:`GraphQL`},{type:`code`,lang:`text`,code:`# Schema (SDL)
type User  { id: ID!, name: String!, orders(last: Int): [Order!]! }
type Order { id: ID!, total: Float! }
type Query { user(id: ID!): User }

# One request, exactly the fields the screen needs
query {
  user(id: "42") {
    name
    orders(last: 3) { id total }
  }
}
# \u2192 { "data": { "user": { "name": "Asha", "orders": [ ... ] } } }`},{type:`heading3`,text:`gRPC`},{type:`code`,lang:`text`,code:`// user.proto \u2014 the contract; code is generated for each language
syntax = "proto3";
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc StreamOrders (GetUserRequest) returns (stream Order); // server streaming
}
message GetUserRequest { int64 id = 1; }
message User  { int64 id = 1; string name = 2; }
message Order { int64 id = 1; double total = 2; }`},{type:`code`,lang:`javascript`,code:`// Node client with @grpc/grpc-js + @grpc/proto-loader
const client = new userProto.UserService('users:50051', grpc.credentials.createInsecure());
client.GetUser({ id: 42 }, { deadline: Date.now() + 2000 }, (err, user) => {
  console.log(user); // { id: '42', name: 'Asha' }
});`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:[`**Transport/format**: REST — HTTP/1.1 or 2, JSON. GraphQL — usually HTTP POST, JSON. gRPC — HTTP/2, binary Protobuf.`,"**Contract**: REST — optional (OpenAPI). GraphQL — mandatory schema, introspectable. gRPC — mandatory `.proto` with code generation.",`**Fetching**: REST can over-/under-fetch; GraphQL fetches exactly what is asked; gRPC returns fixed messages.`,`**Caching**: REST uses HTTP caching/CDNs natively; GraphQL needs client caches (Apollo) or persisted queries; gRPC needs app-level caching.`,`**Streaming**: REST — via SSE/WebSockets; GraphQL — subscriptions; gRPC — client, server and bidirectional streaming built in.`,`**Browser support**: REST and GraphQL natively; gRPC needs gRPC-Web or a proxy (Envoy) or a JSON transcoding gateway.`,"**Errors**: REST — HTTP status codes; GraphQL — usually 200 with an `errors` array; gRPC — its own status codes (`NOT_FOUND`, `DEADLINE_EXCEEDED`...)."]},{type:`flow`,title:`Which one where?`,code:`flowchart TD
  Q{"Who is the consumer?"} -->|"Public / partners,<br/>webhooks"| R["REST"]:::server
  Q -->|"Many frontends with<br/>different data needs"| G["GraphQL / BFF"]:::highlight
  Q -->|"Internal services,<br/>low latency, streaming"| P["gRPC"]:::network`},{type:`callout`,variant:`tip`,text:`Show you know the downsides: GraphQL needs DataLoader (batching) to avoid N+1 queries plus query depth/complexity limits to prevent abusive queries; gRPC is hard to debug with curl and needs a proxy for browsers; REST can lead to chatty clients. Pick by consumer, not by hype.`},{type:`divider`},{type:`heading3`,text:`Follow-up: What is gRPC and when should you use it over REST?`},{type:`paragraph`,text:"gRPC is an RPC framework from Google that uses HTTP/2 for transport and Protocol Buffers for a strongly typed, compact binary format. You define services in a `.proto` file and generate clients and servers in many languages. Prefer it for internal, high-throughput or low-latency service-to-service calls and streaming; prefer REST for public APIs, browser clients, and when human-readable, cacheable HTTP is more valuable."},{type:`heading3`,text:`Define the contract`},{type:`code`,lang:`text`,code:`// inventory.proto
syntax = "proto3";
package inventory;

service Inventory {
  rpc GetStock (StockRequest) returns (StockReply);                 // unary
  rpc WatchStock (StockRequest) returns (stream StockReply);        // server streaming
}

message StockRequest { string sku = 1; }
message StockReply   { string sku = 1; int32 available = 2; }`},{type:`heading3`,text:`Server and client in Node (@grpc/grpc-js)`},{type:`code`,lang:`javascript`,code:`import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const def = protoLoader.loadSync('inventory.proto');
const { inventory } = grpc.loadPackageDefinition(def);

// Server
const server = new grpc.Server();
server.addService(inventory.Inventory.service, {
  GetStock: (call, callback) => {
    callback(null, { sku: call.request.sku, available: 42 });
  },
});
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {});

// Client (another service)
const client = new inventory.Inventory('inventory:50051', grpc.credentials.createInsecure());
client.GetStock({ sku: 'sku-123' }, { deadline: Date.now() + 1000 }, (err, reply) => {
  console.log(reply); // { sku: 'sku-123', available: 42 }
});`},{type:`heading3`,text:`gRPC vs REST`},{type:`bullets`,items:[`**Payload:** Protobuf binary — smaller and faster to parse than JSON.`,`**Transport:** HTTP/2 multiplexing over one connection; REST is commonly HTTP/1.1 (can also use HTTP/2).`,"**Contract:** `.proto` is mandatory and generates typed clients; REST relies on OpenAPI if you add it.",`**Streaming:** unary, server, client and bidirectional streaming built in.`,`**Deadlines and cancellation** propagate across calls.`,`**Browser support:** browsers cannot speak native gRPC — you need gRPC-Web or Connect via a proxy. REST works everywhere.`,"**Debuggability:** REST is readable with curl and browser devtools; gRPC needs tools like `grpcurl`.",`**Caching:** REST GETs work with HTTP caches/CDNs; gRPC does not.`]},{type:`flow`,title:`Choosing`,code:`flowchart TD
  Q{Who calls the API?} -->|"Browsers, partners,<br/>public"| R([REST / JSON]):::client
  Q -->|Internal services| P{"High volume, low latency,<br/>streaming or polyglot?"}
  P -->|Yes| G([gRPC]):::highlight
  P -->|No| E([REST is fine]):::server`},{type:`callout`,variant:`tip`,text:`Interview tip: a common real-world answer is "REST at the edge, gRPC between services". Mention Protobuf field numbers for backward-compatible evolution — never reuse or renumber a field.`}]},"websockets-in-node-js":{summary:"WebSocket is a protocol for a persistent, **full-duplex** connection between client and server over a single TCP connection. It starts as an HTTP request with `Upgrade: websocket` (101 Switching Protocols), after which both sides can send messages at any time with low overhead. In Node you typically use the `ws` library (low-level) or Socket.IO (rooms, reconnection, fallbacks); to scale across instances you need a shared pub/sub such as Redis.",details:[{type:`paragraph`,text:`Plain HTTP is request/response: the server cannot speak until asked. Polling wastes requests and adds latency. WebSockets keep one connection open so the server can push instantly — chat, multiplayer games, collaborative editing, live dashboards, trading tickers.`},{type:`flow`,title:`WebSocket lifecycle`,code:`sequenceDiagram
  participant B as Browser
  participant S as Node server
  B->>S: GET /ws with Upgrade websocket + Sec-WebSocket-Key
  S-->>B: 101 Switching Protocols
  B->>S: message: join room 42
  S-->>B: message: welcome
  S-->>B: message: new chat (server push)
  S->>B: ping
  B-->>S: pong
  B->>S: close frame`},{type:`heading3`,text:`Server with the ws library`},{type:`code`,lang:`javascript`,code:`import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

// Authenticate during the HTTP upgrade \u2014 reject before the socket is opened
server.on('upgrade', async (req, socket, head) => {
  const user = await authenticate(req); // e.g. token from cookie or query param
  if (!user) {
    socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
    return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req, user));
});

wss.on('connection', (ws, req, user) => {
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return ws.close(1003, 'Invalid JSON'); }
    // Broadcast to everyone else
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ from: user.name, text: msg.text }));
      }
    }
  });
});

// Heartbeat: drop dead connections (e.g. mobile went offline without closing)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30_000);

server.listen(3000);`},{type:`heading3`,text:`Browser client`},{type:`code`,lang:`javascript`,code:`const ws = new WebSocket('wss://example.com/ws');
ws.onopen = () => ws.send(JSON.stringify({ text: 'hello' }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.onclose = () => setTimeout(connect, backoff()); // reconnect yourself with ws`},{type:`heading3`,text:`Socket.IO for higher-level features`},{type:`code`,lang:`javascript`,code:`import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

const io = new Server(server, { cors: { origin: 'https://app.example.com' } });
io.adapter(createAdapter(pubClient, subClient)); // broadcast across all instances

io.on('connection', (socket) => {
  socket.on('join', (room) => socket.join(room));
  socket.on('chat', (room, text) => io.to(room).emit('chat', { text }));
});
// NestJS: @WebSocketGateway() with @SubscribeMessage('chat') handlers`},{type:`heading3`,text:`Scaling and production concerns`},{type:`bullets`,items:[`**Horizontal scaling**: a client is connected to one instance, so broadcasts must go through Redis pub/sub (or NATS/Kafka) to reach users on other instances.`,`**Load balancers**: must support the Upgrade header and long idle timeouts; Socket.IO's HTTP long-polling fallback needs sticky sessions.`,"**Security**: use `wss://`, authenticate at upgrade, **check the `Origin` header** (browsers don't apply CORS to WebSockets — cross-site WebSocket hijacking), validate every message, limit payload size and message rate.","**Heartbeats** detect half-open connections; **backpressure**: check `ws.bufferedAmount` before sending to slow clients.",`**Deploys**: connections drop on restart; clients must reconnect with backoff and resync state.`]},{type:`callout`,variant:`tip`,text:"Socket.IO is not a plain WebSocket — a native `WebSocket` client cannot talk to a Socket.IO server. Choose `ws` for raw performance and standard clients, Socket.IO for rooms, acknowledgements and auto-reconnect out of the box."}]},"sse-vs-websockets":{summary:"SSE is a standard for the server to push a stream of text events to the browser over a normal long-lived HTTP response (`Content-Type: text/event-stream`), consumed with the built-in `EventSource` API, which reconnects automatically and resumes using `Last-Event-ID`. Use SSE when data flows **one way, server → client** (notifications, live feeds, progress updates, streaming LLM tokens); use WebSockets when you need low-latency **bidirectional** messaging or binary data.",details:[{type:`paragraph`,text:`SSE is "just HTTP": it works through proxies, load balancers and HTTP/2 multiplexing, reuses cookies and normal auth, and requires no special server library. The client sends ordinary HTTP requests (POST/PUT) for anything it needs to tell the server.`},{type:`heading3`,text:`Wire format`},{type:`code`,lang:`text`,code:`HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

id: 101
event: order-status
data: {"orderId":7,"status":"shipped"}

: this is a comment, used as a heartbeat

retry: 5000
data: plain message without an event name
`},{type:`heading3`,text:`Server in Node (Express)`},{type:`code`,lang:`javascript`,code:`app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // tell nginx not to buffer the stream
  });
  res.flushHeaders();

  // Resume after reconnect: browser sends the last id it saw
  const lastId = Number(req.headers['last-event-id'] ?? 0);
  for (const e of eventStore.since(lastId)) send(e);

  function send(e) {
    res.write(\`id: \${e.id}\\nevent: \${e.type}\\ndata: \${JSON.stringify(e.data)}\\n\\n\`);
  }

  const unsubscribe = bus.subscribe(req.user.id, send);
  const heartbeat = setInterval(() => res.write(': ping\\n\\n'), 15_000);

  req.on('close', () => {      // client went away \u2014 clean up to avoid leaks
    clearInterval(heartbeat);
    unsubscribe();
  });
});`},{type:`heading3`,text:`Browser client`},{type:`code`,lang:`javascript`,code:`const es = new EventSource('/events', { withCredentials: true });

es.addEventListener('order-status', (e) => {
  const { orderId, status } = JSON.parse(e.data);
  updateUi(orderId, status);
});
es.onerror = () => console.log('disconnected \u2014 EventSource will retry automatically');`},{type:`flow`,title:`SSE or WebSocket?`,code:`flowchart TD
  Q{"Does the client need to<br/>send frequent messages?"} -->|"No, server to client only"| B{"Binary data?"}
  B -->|No| SSE["SSE"]:::highlight
  B -->|Yes| WS["WebSocket"]:::network
  Q -->|"Yes, low-latency<br/>bidirectional"| WS`},{type:`heading3`,text:`SSE vs WebSockets`},{type:`bullets`,items:[`**Direction**: SSE server → client only; WebSocket both ways.`,`**Data**: SSE is UTF-8 text (JSON); WebSocket supports text and binary.`,"**Reconnection**: SSE built in with `Last-Event-ID` resume; WebSocket you implement yourself (or use Socket.IO).",`**Infrastructure**: SSE is plain HTTP — works with HTTP/2, proxies, auth cookies, compression; WebSocket needs Upgrade support.`,`**Connection limits**: over HTTP/1.1 browsers allow ~6 connections per origin, shared by all tabs — use HTTP/2 to avoid it.`,"**Headers**: native `EventSource` cannot set custom headers (e.g. `Authorization`), so use cookies or a fetch-based SSE client.",`Typical SSE uses: notifications, live scores/prices, CI/job progress logs, streaming AI responses.`]},{type:`callout`,variant:`warning`,text:"Proxies and compression middleware love to buffer: if events arrive in bursts or only when the connection closes, disable buffering (`X-Accel-Buffering: no` for nginx, exclude the route from `compression()` or flush after each write) and send periodic heartbeat comments so idle timeouts do not cut the stream."}]}};export{e as answers};