import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 4 — How HTTP Works
// ─────────────────────────────────────────────────────────────────────────────
export const howHttpWorks: CoreConcept = {
  id: 'how-http-works',
  title: 'How HTTP Works',
  emoji: '🔄',
  icon: 'ti-arrows-exchange',
  color: '#10b981',
  bg: '#d1fae5',
  accentGlow: 'rgba(16,185,129,0.15)',
  difficulty: 'Beginner',
  tagline:
    'The language of the web — request/response lifecycle, methods, headers, status codes, and HTTP/2.',
  tags: ['Request/Response', 'Methods', 'Status Codes', 'Headers', 'HTTP/2'],
  estimatedTime: '35 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'HyperText Transfer Protocol' },
        {
          type: 'paragraph',
          text: 'HTTP (HyperText Transfer Protocol) is the set of rules for how clients (browsers, apps) and servers talk to each other on the web. It works as request and response: the client asks for something, the server answers. Every web page you load and every API call your app makes uses HTTP or its encrypted version, HTTPS.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: HTTP is like ordering at a restaurant counter. You hand over an order slip saying what you want (method + URL), with extra notes like "no onions" (headers). The kitchen hands back your food (the body) with a short note on top: "here you go" (200), "we are out of that" (404), or "kitchen is on fire" (500).',
        },
        {
          type: 'flow',
          title: 'The big picture — one request, one response',
          code: `sequenceDiagram
  participant C as Client (browser / app)
  participant S as Server
  C->>S: Request - GET /api/users/123 + headers
  Note over S: Find the handler, run logic, read the database
  S-->>C: Response - 200 OK + headers + JSON body
  Note over C,S: The server forgets this exchange - next request starts fresh`,
          text: 'Every HTTP interaction is this same shape: one request, one response, with no memory in between.',
        },
        { type: 'heading2', text: 'HTTP is Stateless' },
        {
          type: 'paragraph',
          text: 'Each HTTP request is completely independent. The server has no memory of previous requests from the same client — Request 2 is treated as if Request 1 never happened. This makes HTTP simple and easy to scale (any server can handle any request). The catch: to remember things like "this user is logged in", we need extra tools such as cookies, sessions, and tokens that the client sends along with every request.',
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        {
          type: 'paragraph',
          text: 'Before HTTP, there was no standard way for computers to share documents over a network. HTTP defined a universal language: how to ask for a resource (request), how to describe what you want (headers, methods), and how to communicate the result (status codes, response body). It is the contract between every web client and server.',
        },
        { type: 'heading2', text: 'HTTP Versions Timeline' },
        {
          type: 'bullets',
          items: [
            'HTTP/1.0 (1996): One request per TCP connection. Very inefficient.',
            'HTTP/1.1 (1997): Keep-alive connections (reuse TCP). Pipelining (send multiple requests without waiting). Still the most widely understood.',
            'HTTP/2 (2015): Binary protocol. Multiplexing (multiple requests on one connection, no head-of-line blocking). Header compression (HPACK). Server push.',
            'HTTP/3 (2022): Based on QUIC (UDP) instead of TCP. Eliminates TCP head-of-line blocking. Faster connection establishment. Used by ~30% of the web.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Head-of-line blocking means one slow item at the front of the line holds up everything behind it — like a single checkout lane where one customer with a full cart makes everyone wait.',
        },
        {
          type: 'flow',
          title: 'How each HTTP version improved',
          code: `flowchart LR
  A["HTTP/1.0<br/>new TCP connection<br/>for every request"]:::external --> B["HTTP/1.1<br/>reuse the connection<br/>keep-alive"]:::server
  B --> C["HTTP/2<br/>many requests at once<br/>on one connection"]:::server
  C --> D["HTTP/3<br/>QUIC over UDP<br/>no TCP blocking"]:::highlight`,
          text: 'Each version attacks the same problem: wasted waiting. First fewer handshakes, then less queueing, then no single lost packet stalling everything.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'HTTP Request Structure' },
        {
          type: 'code',
          lang: 'http',
          code: `GET /api/users/123 HTTP/1.1
Host: api.github.com
Authorization: Bearer eyJhbGc...
Accept: application/json
User-Agent: Mozilla/5.0 (Chrome/...)
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

(empty body for GET requests)`,
        },
        { type: 'heading2', text: 'HTTP Response Structure' },
        {
          type: 'code',
          lang: 'http',
          code: `HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 185
Cache-Control: max-age=60
ETag: "33a64df5"
Set-Cookie: session=abc123; HttpOnly; Secure

{
  "id": 123,
  "login": "torvalds",
  "name": "Linus Torvalds",
  "public_repos": 9
}`,
        },
        { type: 'heading2', text: 'HTTP Methods' },
        {
          type: 'bullets',
          items: [
            'GET: Retrieve a resource. No body. Safe (no side effects) and idempotent (same result every time).',
            'POST: Create a resource or submit data. Has a body. Not idempotent (two POSTs may create two resources).',
            'PUT: Replace a resource entirely. Idempotent (putting the same data twice gives the same result).',
            'PATCH: Partially update a resource. More efficient than PUT for partial changes.',
            'DELETE: Remove a resource. Idempotent.',
            'HEAD: Like GET but returns only headers, no body. Used to check if a resource exists or check its size.',
            'OPTIONS: Ask the server what methods are allowed. Used in CORS preflight requests.',
          ],
        },
        { type: 'heading2', text: 'HTTP Status Codes' },
        {
          type: 'bullets',
          items: [
            '2xx Success: 200 OK, 201 Created, 204 No Content.',
            '3xx Redirect: 301 Moved Permanently, 302 Found (temporary), 304 Not Modified (use cache).',
            '4xx Client Errors: 400 Bad Request, 401 Unauthorized (not authenticated), 403 Forbidden (not authorized), 404 Not Found, 409 Conflict, 429 Too Many Requests.',
            '5xx Server Errors: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.',
          ],
        },
        {
          type: 'flow',
          title: 'Reading a status code',
          code: `flowchart TD
  R([Response arrives]):::client --> F{"First digit?"}
  F -->|"2xx"| OK["It worked<br/>200, 201, 204"]:::highlight
  F -->|"3xx"| RE["Look elsewhere<br/>301, 302, 304 use cache"]:::cache
  F -->|"4xx"| CE["You made a mistake<br/>400, 401, 403, 404, 429"]:::security
  F -->|"5xx"| SE["Server broke<br/>500, 502, 503, 504"]:::external`,
          text: 'The first digit tells you who should act: 4xx means fix the request, 5xx means the server side has a problem and retrying later may help.',
        },
        { type: 'heading2', text: 'Important HTTP Headers' },
        {
          type: 'bullets',
          items: [
            'Content-Type: What format is the body? (application/json, text/html, multipart/form-data)',
            'Authorization: Bearer {token} for API auth. Basic {base64} for basic auth.',
            'Cache-Control: max-age=3600 (cache for 1 hour), no-cache, no-store.',
            'ETag: A hash of the response. Client sends If-None-Match: {etag}. Server returns 304 if unchanged.',
            'Cookie / Set-Cookie: State management. Server sets cookies; client sends them on every request.',
            'CORS headers: Access-Control-Allow-Origin tells browsers which domains can make cross-origin requests.',
          ],
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'A Full HTTP Request/Response Cycle' },
        {
          type: 'numbered',
          items: [
            'Client forms a request: method (GET), URL (/api/products), headers (Authorization, Accept), optional body.',
            "Request sent over TCP to server's IP:Port. HTTPS: encrypted. HTTP: plaintext.",
            'Server receives request, decodes it.',
            'Server routes request to the correct handler (based on path and method).',
            'Handler executes business logic (queries database, calls other services).',
            'Handler builds a response: status code, headers (Content-Type, Cache-Control), response body.',
            'Server sends response back over the same TCP connection (keep-alive).',
            'Client receives response, checks status code.',
            '200: process response body. 304: use cached copy. 401: redirect to login. 500: show error.',
          ],
        },
        {
          type: 'flow',
          title: 'A full request/response cycle',
          code: `sequenceDiagram
  participant C as Client
  participant S as Server
  participant H as Route handler
  participant DB as Database
  C->>S: GET /api/products + Authorization header
  S->>S: Decode request
  S->>H: Route by method + path
  H->>DB: Query products
  DB-->>H: Rows
  H-->>S: 200 + headers + JSON body
  S-->>C: Response (same keep-alive connection)
  alt 200
    C->>C: Use the JSON
  else 401
    C->>C: Redirect to login
  else 5xx
    C->>C: Show an error message
  end`,
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'HTTP/2 Multiplexing — The Key Improvement' },
        {
          type: 'paragraph',
          text: 'In HTTP/1.1, a connection handles one request at a time: the next request must wait until the previous response has fully arrived (head-of-line blocking). To work around this, browsers open up to 6 TCP connections per site in parallel. HTTP/2 fixes it properly: many requests can be in flight at the same time over a single TCP connection. Each request/response pair gets its own numbered "stream", and their pieces (frames) are interleaved on the wire. This removes HTTP-level head-of-line blocking and lets the server send the most important responses first.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `HTTP/1.1: 6 parallel TCP connections (workaround)
Conn 1: GET /style.css ──────────────> Response
Conn 2: GET /app.js   ──────────────> Response
Conn 3: GET /logo.png ──────────────> Response

HTTP/2: 1 TCP connection, multiple streams
Stream 1: GET /style.css ──> Response  (interleaved frames)
Stream 3: GET /app.js   ──> Response
Stream 5: GET /logo.png ──> Response`,
        },
        {
          type: 'flow',
          title: 'HTTP/1.1 waits in line, HTTP/2 interleaves',
          code: `sequenceDiagram
  participant B as Browser
  participant S as Server
  Note over B,S: HTTP/1.1 - one connection, one at a time
  B->>S: GET /style.css
  S-->>B: style.css
  B->>S: GET /app.js
  S-->>B: app.js
  Note over B,S: HTTP/2 - one connection, many streams
  B->>S: stream 1 GET /style.css
  B->>S: stream 3 GET /app.js
  B->>S: stream 5 GET /logo.png
  S-->>B: frames for 3, 1, 5, 1, 3 mixed together
  Note over B: Reassemble each stream separately`,
          text: 'With HTTP/2, a slow app.js no longer holds up style.css — their frames simply take turns on the same connection.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'An API Call from a React App' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// React component fetches user data
useEffect(() => {
  fetch('https://api.example.com/users/me', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGc...',  // JWT token
      'Accept': 'application/json',
    }
  })
  .then(res => {
    // Check HTTP status
    if (res.status === 401) redirect('/login');
    if (!res.ok) throw new Error('Server error');
    return res.json();   // Parse JSON body
  })
  .then(user => setUser(user))
  .catch(err => setError(err));
}, []);

// Browser sends:
// GET /users/me HTTP/2
// Host: api.example.com
// Authorization: Bearer eyJhbGc...
// → Response: 200 OK + JSON body`,
        },
        {
          type: 'flow',
          title: 'What the fetch call does',
          code: `flowchart TD
  A["fetch /users/me<br/>with Bearer token"]:::client --> B["GET over HTTP/2"]:::network
  B --> S["api.example.com"]:::server
  S --> C{"Response status?"}
  C -->|"401"| L["Redirect to /login"]:::security
  C -->|"other non-2xx"| E["throw, setError"]:::external
  C -->|"2xx"| J["res.json, setUser"]:::highlight`,
        },
      ],
    },
    {
      id: 'visual-flow',
      title: 'Visual Flow & Architecture Diagram',
      icon: 'ti-topology-star',
      blocks: [
        {
          type: 'flow',
          title: 'HTTP lifecycle at a glance',
          code: `flowchart LR
  C(["Client"]):::client -->|"1. TCP + TLS<br/>handshake"| F["HTTP framing<br/>1.1 text or 2 binary"]:::network
  F -->|"2. request on the wire"| P["Reverse proxy<br/>Nginx, Envoy"]:::security
  P -->|"3. forward"| A["App handler"]:::server
  A <--> DB[("Database<br/>or cache")]:::db
  A -->|"4. status, headers, body"| R["Response"]:::highlight
  R -.->|"connection kept alive"| C`,
          text: 'The connection is set up once and reused. The cards below walk through each stage in detail.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-http-flow',
            title: 'HTTP Request/Response Lifecycle & Protocol Stream Pipeline',
            subtitle:
              'From TCP 3-Way Handshake to Multiplexed HTTP/2 Binary Frames and UDP-based HTTP/3 QUIC',
            nodes: [
              {
                id: 'client-transport',
                name: 'Client Socket & TCP Handshake',
                subtitle: 'Layer 4 Transport Setup',
                type: 'client',
                icon: 'ti-plug-connected',
                badge: 'Transport Init',
                protocol: 'SYN → SYN-ACK → ACK',
                details: [
                  'Browser opens socket, allocates local ephemeral port, sends TCP SYN to server',
                  'Server responds with SYN-ACK; client confirms with ACK (1 RTT total)',
                  'With TLS enabled, TLS handshake executes immediately on top of the established TCP connection',
                ],
              },
              {
                id: 'http-framing',
                name: 'HTTP Serialization & Framing',
                subtitle: 'Message Serialization',
                type: 'gateway',
                icon: 'ti-file-code',
                badge: 'HTTP Framing',
                protocol: 'HTTP/1.1 vs HTTP/2',
                details: [
                  'HTTP/1.1: Formats plain-text Method, Path, CRLF-delimited headers, and body',
                  'HTTP/2: Encodes headers via HPACK compression; splits messages into binary frames',
                  'HTTP/3: Maps streams onto independent UDP datagrams via QUIC protocol',
                ],
              },
              {
                id: 'reverse-proxy-ingress',
                name: 'Reverse Proxy / API Gateway',
                subtitle: 'Nginx / Envoy Ingress',
                type: 'network',
                icon: 'ti-arrows-split',
                badge: 'Reverse Proxy',
                protocol: 'SSL Termination',
                details: [
                  'Terminates TLS connection; inspects Host header and URL path',
                  'Checks request headers (CORS Origin, Content-Type, Authorization)',
                  'Applies gzip/brotli decompression and forwards request to upstream application server',
                ],
              },
              {
                id: 'app-service-handler',
                name: 'Application Service Handler',
                subtitle: 'Node.js / Go / Spring Boot',
                type: 'server',
                icon: 'ti-cpu',
                badge: 'Controller Logic',
                protocol: 'REST / GraphQL',
                details: [
                  'Routes request to matched controller action; parses query parameters and JSON body',
                  'Executes business logic and queries database or Redis cache',
                  'Selects appropriate HTTP status code (200 OK, 201 Created, 400 Bad Request, 404 Not Found)',
                ],
              },
              {
                id: 'response-streamer',
                name: 'HTTP Response Streaming',
                subtitle: 'Chunked Transfer & Caching',
                type: 'database',
                icon: 'ti-arrow-back-up',
                badge: 'Response Headers',
                protocol: 'Content-Length / Chunked',
                details: [
                  'Generates response headers: Content-Type: application/json, Cache-Control: max-age=3600, ETag',
                  'Streams binary/text payload over socket; sets Connection: keep-alive to preserve socket for reuse',
                ],
              },
            ],
            connections: [
              {
                from: 'client-transport',
                to: 'http-framing',
                label: '1. Established Socket',
                protocol: 'TCP/TLS',
              },
              {
                from: 'http-framing',
                to: 'reverse-proxy-ingress',
                label: '2. Wire Transmission',
                protocol: 'HTTP Stream',
              },
              {
                from: 'reverse-proxy-ingress',
                to: 'app-service-handler',
                label: '3. Upstream Proxy Dispatch',
                protocol: 'Internal HTTP',
              },
              {
                from: 'app-service-handler',
                to: 'response-streamer',
                label: '4. Serialized Response Payload',
                protocol: 'JSON / Bytes',
              },
            ],
            keyTakeaways: [
              'HTTP is inherently stateless: every request is completely independent. Session continuity is maintained via HTTP Cookies or Authorization Bearer tokens.',
              'Head-of-Line Blocking: In HTTP/1.1, a slow response on a socket blocks all subsequent requests on that socket. HTTP/2 solves this with multiplexed binary frames over a single TCP socket.',
              'Idempotency: GET, PUT, and DELETE are idempotent (calling them 10 times yields the exact same server state). POST is NOT idempotent (calling it 10 times creates 10 records).',
            ],
            rawSpec: `Client (Browser/App)           Server
       │                              │
       │  TCP Connect (port 443)      │
       │ ──────────────────────────> │
       │ <────────────────────────── │ SYN-ACK
       │                              │
       │  TLS Handshake               │
       │ ◄────────────────────────── │ (encrypted channel)
       │                              │
       │  GET /api/data HTTP/2        │
       │  Authorization: Bearer ...   │
       │ ──────────────────────────> │
       │                              │ Process request
       │                              │ Query DB
       │  HTTP/2 200 OK               │
       │  Content-Type: app/json      │
       │  {"data": [...]}             │
       │ <────────────────────────── │
       │                              │
       │ (connection kept ALIVE)      │
       │                              │
       │  GET /api/user HTTP/2        │ (no new connection needed!)
       │ ──────────────────────────> │`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'HTTP Caching in Depth' },
        {
          type: 'bullets',
          items: [
            'Cache-Control: max-age=3600 → browser caches for 1 hour, no server contact needed.',
            'ETag: Hash of the resource content. Browser sends If-None-Match: "etag" with next request. If unchanged, server sends 304 Not Modified (no body, very fast).',
            'Last-Modified + If-Modified-Since: Same pattern but using timestamps instead of hashes.',
            'no-cache: Always validate with server before using cached version.',
            'no-store: Do not cache at all. For sensitive data like banking pages.',
          ],
        },
        {
          type: 'flow',
          title: 'Browser cache decision',
          code: `flowchart TD
  N([Need /app.js]):::client --> C{"In cache?"}:::cache
  C -->|"no"| FULL["Full GET<br/>200 + body, store it"]:::server
  C -->|"yes"| FR{"Still fresh?<br/>within max-age"}
  FR -->|"yes"| USE["Use cache<br/>no network at all"]:::highlight
  FR -->|"no, stale"| V["Ask server:<br/>If-None-Match etag"]:::network
  V --> CH{"Changed?"}
  CH -->|"no"| NM["304 Not Modified<br/>reuse cached copy"]:::highlight
  CH -->|"yes"| FULL`,
          text: 'max-age avoids the request entirely. ETag turns a full download into a tiny "still the same?" check.',
        },
        { type: 'heading2', text: 'Cookies — How State is Maintained' },
        {
          type: 'paragraph',
          text: 'HTTP is stateless, but websites need to know who you are across requests. Cookies solve this. The server sets a cookie in its response (Set-Cookie: sessionId=abc123). The browser stores it and automatically sends it back on every future request to the same domain (Cookie: sessionId=abc123), so the server can look up who you are. Security flags: HttpOnly (JavaScript cannot read it, so an injected script — an XSS attack — cannot steal it), Secure (only sent over HTTPS), SameSite (not sent on requests triggered by other sites, which blocks CSRF — tricking your browser into making requests you did not intend).',
        },
        {
          type: 'flow',
          title: 'How a cookie keeps you logged in',
          code: `sequenceDiagram
  participant B as Browser
  participant S as Server
  participant ST as Session store
  B->>S: POST /login (username, password)
  S->>ST: Save session abc123 for user 42
  S-->>B: 200 + Set-Cookie sessionId=abc123
  Note over B: Browser stores the cookie
  B->>S: GET /orders + Cookie sessionId=abc123
  S->>ST: Who is abc123?
  ST-->>S: user 42
  S-->>B: 200 + orders for user 42`,
          text: 'The server still has no memory of the connection — the cookie carries the identity on every single request.',
        },
      ],
    },
    {
      id: 'misconceptions',
      title: 'Common Misconceptions',
      icon: 'ti-alert-triangle',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Myth: "POST is more secure than GET." Reality: Both are equally insecure over HTTP, equally secure over HTTPS. The difference is GET puts data in the URL (visible in logs), POST puts it in the body (also visible in logs).',
            'Myth: "404 means the page is broken." Reality: 404 means the resource was not found — which is a valid, expected response. The page is working correctly by telling you what you asked for does not exist.',
            'Myth: "HTTP/2 replaces the need for CDN." Reality: HTTP/2 improves performance within a single connection. CDN reduces latency by physically moving content closer. Both are needed.',
            'Myth: "200 OK means the operation succeeded." Reality: The server could return 200 with an error message in the body. Always design APIs to use correct status codes.',
          ],
        },
      ],
    },
    {
      id: 'system-design-connection',
      title: 'System Design Connection',
      icon: 'ti-sitemap',
      blocks: [
        {
          type: 'bullets',
          items: [
            'REST API Design: HTTP methods and status codes are the grammar of REST. GET=read, POST=create, PUT/PATCH=update, DELETE=delete.',
            'Load Balancer Layer 7: HTTP-aware load balancers can route based on URL path, headers, cookies. "Send /api/payments to payment service, /api/users to user service."',
            'API Gateway: Inspects HTTP requests — validates auth tokens, rate limits, transforms requests, routes to backend services.',
            'Caching Strategy: Cache-Control and ETag headers are the mechanism for CDN and browser caching. Understanding them is essential for cache invalidation design.',
            'GraphQL vs REST: Both use HTTP. GraphQL uses POST for all queries. REST uses GET for reads (better caching) and POST/PUT/DELETE for writes.',
          ],
        },
      ],
    },
  ],
};
