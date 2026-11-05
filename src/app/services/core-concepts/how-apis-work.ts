import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 7 — How APIs Work
// ─────────────────────────────────────────────────────────────────────────────
export const howApisWork: CoreConcept = {
  id: 'how-apis-work',
  title: 'How APIs Work',
  emoji: '🔄',
  icon: 'ti-api',
  color: '#6366f1',
  bg: '#eef2ff',
  accentGlow: 'rgba(99,102,241,0.15)',
  difficulty: 'Foundational',
  tagline:
    'REST, authentication, serialization — how applications talk to each other across the internet.',
  tags: ['REST', 'JSON', 'Authentication', 'Authorization', 'Serialization'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'Application Programming Interface' },
        {
          type: 'paragraph',
          text: 'An API (Application Programming Interface) is an agreed way for two pieces of software to talk to each other. A Web API specifically means a server that accepts HTTP requests and returns structured data (usually JSON). It acts as a contract between a client (browser, mobile app, another server) and a backend service: "send me a request in this shape, and I promise to reply in that shape."',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: an API is like a restaurant menu and waiter. You (the client) do not walk into the kitchen. You pick from the menu (the available endpoints), the waiter (the API) takes your order to the kitchen (the server and database), and brings back exactly what you ordered (the JSON response) — or tells you it is not available (an error code).',
        },
        {
          type: 'flow',
          title: 'The big picture — request in, data out',
          code: `flowchart LR
  subgraph CLIENTS["Clients"]
    W([Web app]):::client
    M([Mobile app]):::client
    O([Another server]):::client
  end
  W -->|"GET /api/orders/456"| API["Web API<br/>the contract"]:::server
  M -->|"POST /api/orders"| API
  O -->|"HTTP + JSON"| API
  API --> DB[(Database)]:::db
  API -->|"JSON response"| W`,
          text: 'Any client that speaks HTTP can use the same API. The client never touches the database directly — only the API does.',
        },
        {
          type: 'paragraph',
          text: "APIs are what make the modern Internet possible. Stripe's API lets you add payments to your app. Twilio's API lets you send SMS. Google Maps API embeds maps. Every app you use is built on dozens of APIs.",
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Without APIs' },
        {
          type: 'paragraph',
          text: 'Without APIs, every application would have to build everything itself. Your food delivery app would need its own mapping system, its own payment processing, its own SMS gateway. APIs let each company specialize: Stripe handles payments (including the heavy legal and security rules), Google handles maps (petabytes of map data), Twilio handles SMS delivery. Your app simply calls each one through its API.',
        },
        {
          type: 'flow',
          title: 'One app, many specialist APIs',
          code: `flowchart TB
  APP["Food delivery app<br/>backend"]:::server
  APP -->|"charge card"| ST["Stripe API<br/>payments"]:::external
  APP -->|"route + ETA"| GM["Google Maps API"]:::external
  APP -->|"Your order is on the way"| TW["Twilio API<br/>SMS"]:::external
  APP --> DB[(Own database<br/>orders, menus)]:::db`,
        },
        { type: 'heading2', text: 'API Types' },
        {
          type: 'bullets',
          items: [
            'REST (Representational State Transfer): Uses HTTP methods (GET, POST, PUT, DELETE) and URLs to identify resources. Returns JSON. The standard for most modern web APIs.',
            'GraphQL: Client specifies exactly what data it needs in a query. Single endpoint. Great for complex, nested data needs. Facebook/GitHub use it.',
            'gRPC: Binary protocol over HTTP/2. Extremely fast. Used for internal microservice communication (not browser-facing). Google, Netflix use it.',
            'WebSocket APIs: A connection stays open and both sides can send messages at any time (bidirectional, real-time), instead of one request getting one response. Used for chat, live feeds, notifications.',
          ],
        },
        {
          type: 'flow',
          title: 'Which API style fits?',
          code: `flowchart TD
  Q1{"Need the server to push<br/>live updates?"} -->|"yes"| WS["WebSocket"]:::highlight
  Q1 -->|"no"| Q2{"Internal service-to-service<br/>where speed matters most?"}
  Q2 -->|"yes"| G["gRPC"]:::highlight
  Q2 -->|"no"| Q3{"Clients need very different<br/>shapes of nested data?"}
  Q3 -->|"yes"| GQ["GraphQL"]:::highlight
  Q3 -->|"no"| R["REST - the safe default"]:::highlight`,
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'REST API Design' },
        {
          type: 'code',
          lang: 'text',
          code: `Resource: /users
GET    /users           → list all users
POST   /users           → create a new user

Resource: /users/{id}
GET    /users/123       → get user 123
PUT    /users/123       → replace user 123 entirely
PATCH  /users/123       → partially update user 123
DELETE /users/123       → delete user 123

Nested resource:
GET    /users/123/posts → get all posts by user 123
POST   /users/123/posts → create a new post for user 123`,
        },
        { type: 'heading2', text: 'Serialization and Deserialization' },
        {
          type: 'bullets',
          items: [
            'Serialization: Converting an in-memory object into a transmittable format (JSON, XML, Protocol Buffers).',
            'Deserialization: Parsing the received format back into an in-memory object.',
            'JSON (JavaScript Object Notation): The standard for REST APIs. Human-readable, simple, language-agnostic.',
            'Protocol Buffers (protobuf): Binary format used by gRPC. 3-10x smaller and faster than JSON. Not human-readable.',
          ],
        },
        {
          type: 'flow',
          title: 'Serialization round trip',
          code: `flowchart LR
  O1["Server object<br/>in memory"]:::server -->|"serialize"| J["JSON text<br/>sent over HTTP"]:::network
  J -->|"deserialize"| O2["Client object<br/>in memory"]:::client`,
          text: 'Objects cannot travel over a network as-is. They are turned into text or bytes, sent, and rebuilt on the other side.',
        },
        { type: 'heading2', text: 'API Authentication' },
        {
          type: 'bullets',
          items: [
            'API Keys: A static secret string. Client includes it in the header: X-API-Key: sk-... or query parameter: ?api_key=... Simple but if compromised, must be rotated.',
            'Bearer Tokens (JWT): Client logs in once (username/password) and receives a short-lived token (a JWT — JSON Web Token). It then sends the token with every request in the header: Authorization: Bearer eyJ... "Bearer" means "whoever holds this token is allowed in". The token expires (e.g., after 1 hour).',
            'OAuth 2.0: "Login with Google" — a third party (Google) vouches for the user without exposing their password to your app.',
            'Basic Auth: Username:password encoded in base64. Only acceptable over HTTPS. Sent on every request.',
          ],
        },
        {
          type: 'flow',
          title: 'Bearer token flow — log in once, reuse the token',
          code: `sequenceDiagram
  participant C as Client
  participant A as Auth endpoint
  participant API as API
  C->>A: POST /login (username + password)
  A-->>C: JWT (expires in 1 hour)
  C->>API: GET /orders + Authorization Bearer JWT
  Note over API: Check signature and expiry - no password needed
  API-->>C: 200 OK + orders
  C->>API: Later request with expired token
  API-->>C: 401 Unauthorized - log in again or refresh`,
        },
        { type: 'heading2', text: 'API Authorization' },
        {
          type: 'paragraph',
          text: 'Authentication = Who are you? Authorization = What are you allowed to do? After authenticating (verifying the token), the server checks permissions: Can this user view this resource? Can they modify it? Two common models: RBAC (Role-Based Access Control) grants permissions by role — admin, editor, viewer. ABAC (Attribute-Based Access Control) is finer-grained and decides using attributes, e.g. "users may edit documents they own, during business hours".',
        },
        {
          type: 'flow',
          title: 'Authentication then authorization',
          code: `flowchart TD
  R["Request arrives"]:::client --> A{"Valid token?<br/>Who are you"}:::security
  A -->|"no"| E401["401 Unauthorized"]:::external
  A -->|"yes"| Z{"Allowed to do this?<br/>role or ownership"}:::security
  Z -->|"no"| E403["403 Forbidden"]:::external
  Z -->|"yes"| OK["200 OK - run the action"]:::highlight`,
          text: '401 means "we do not know who you are". 403 means "we know who you are, but you cannot do this".',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'A Complete API Request Lifecycle' },
        {
          type: 'numbered',
          items: [
            'Client sends: GET /api/v1/orders/456 with Authorization: Bearer eyJ...',
            'API Gateway receives the request. Validates JWT signature and expiry.',
            'JWT decoded: {userId: 123, role: "customer", exp: 1725638400}.',
            'API Gateway checks rate limit for userId 123 — under limit, proceed.',
            'Request forwarded to Order Service.',
            'Order Service deserializes the request, extracts orderId=456.',
            'Authorization check: Does user 123 own order 456? Query database.',
            'Order 456 belongs to user 789, not 123 → Return 403 Forbidden.',
            'Response: {"error": "You do not have permission to view this order"}.',
            'Client receives 403 and shows "Access Denied" to the user.',
          ],
        },
        {
          type: 'flow',
          title: 'Lifecycle of GET /api/v1/orders/456',
          code: `sequenceDiagram
  participant C as Client
  participant G as API Gateway
  participant O as Order Service
  participant D as Database
  C->>G: GET /api/v1/orders/456 + Bearer JWT
  Note over G: Verify JWT signature and expiry, decode userId 123
  Note over G: Rate limit check for user 123 - OK
  G->>O: Forward request (userId 123)
  O->>D: Who owns order 456?
  D-->>O: user 789
  Note over O: 123 is not 789 - not allowed
  O-->>G: 403 Forbidden
  G-->>C: 403 + error JSON
  Note over C: Show Access Denied`,
          text: 'The gateway handles the checks every request needs (identity, rate limits). The service handles checks that need business data (who owns this order).',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'JWT — JSON Web Token' },
        {
          type: 'code',
          lang: 'text',
          code: `A JWT has three parts separated by dots: header.payload.signature

Header (base64): {"alg": "HS256", "typ": "JWT"}
Payload (base64): {
  "userId": 123,
  "email": "user@example.com",
  "role": "admin",
  "iat": 1725634800,  // issued at
  "exp": 1725638400   // expires at (1 hour later)
}
Signature: HMAC_SHA256(header + "." + payload, secret_key)

The server verifies the signature using its secret key.
If the signature is valid and token not expired → trusted.
No database lookup needed — all info is in the token.`,
        },
        {
          type: 'flow',
          title: 'How a server verifies a JWT',
          code: `flowchart TD
  T["Incoming JWT<br/>header.payload.signature"]:::client --> S["Recompute signature from<br/>header + payload + secret key"]:::security
  S --> Q1{"Matches the<br/>signature sent?"}
  Q1 -->|"no - tampered"| X["Reject 401"]:::external
  Q1 -->|"yes"| Q2{"exp in the future?"}
  Q2 -->|"no - expired"| X
  Q2 -->|"yes"| OK["Trust userId and role<br/>from the payload"]:::highlight`,
          text: 'Changing even one character of the payload changes the expected signature, so tampering is detected without a database lookup.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Building a Simple REST API' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Express.js REST API
import express from 'express';
const app = express();

// Middleware: parse JSON body
app.use(express.json());

// Middleware: verify JWT
app.use('/api', authenticateToken);

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  // Authorization
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const user = await db.users.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Serialize (exclude sensitive fields)
  const { password, ...safeUser } = user;
  res.status(200).json(safeUser);
});`,
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
          title: 'An API call at a glance',
          code: `flowchart LR
  C([Client]):::client -->|"HTTP + JWT"| G["API Gateway<br/>auth, rate limit"]:::security
  G -->|"route"| S["Service<br/>business logic"]:::server
  S <-->|"query"| D[(Database)]:::db
  S -->|"serialize to JSON"| C`,
          text: 'The step cards below go through each stage of the pipeline.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-api-flow',
            title: 'API Gateway, JWT Authentication & Serialization Pipeline',
            subtitle:
              'How requests navigate rate limiting, cryptographic token verification, validation, and JSON serialization',
            nodes: [
              {
                id: 'api-consumer',
                name: 'Client API Consumer',
                subtitle: 'Frontend App / Mobile Client / Third Party',
                type: 'client',
                icon: 'ti-device-mobile',
                badge: 'Client Caller',
                protocol: 'POST /api/v1/checkout',
                details: [
                  'Packages payload into JSON: { items: [...], total: 120 }',
                  'Attaches credentials: Authorization: Bearer eyJhbGciOi...',
                  'Includes Idempotency-Key header to guarantee safe retries on network failure',
                ],
              },
              {
                id: 'api-gateway',
                name: 'API Gateway & Rate Limiter',
                subtitle: 'Traffic Controller & Policy Enforcement',
                type: 'gateway',
                icon: 'ti-shield',
                badge: 'API Gateway',
                protocol: 'Token Bucket / Redis',
                details: [
                  'Enforces rate limits (e.g. 100 req/min per API key) using Redis Token Bucket counter',
                  'Validates API Key / CORS origin; routes traffic to target microservice cluster',
                  'Rejects abusers with HTTP 429 Too Many Requests before any application code executes',
                ],
              },
              {
                id: 'auth-validator',
                name: 'JWT Token Cryptographic Verifier',
                subtitle: 'Stateless Authentication',
                type: 'security',
                icon: 'ti-key',
                badge: 'Auth Verifier',
                protocol: 'HMAC-SHA256 / RSA',
                details: [
                  'Decodes Header and Payload; verifies signature using shared secret or public key',
                  'Validates claims: exp (not expired), iss (trusted issuer), and aud (correct audience)',
                  'Zero DB queries: user identity (userId, roles) is cryptographically proven in memory',
                ],
              },
              {
                id: 'schema-validator',
                name: 'Input Deserializer & Validator',
                subtitle: 'Schema Enforcement (Zod / Joi)',
                type: 'server',
                icon: 'ti-checklist',
                badge: 'Data Validation',
                protocol: 'Type Checking',
                details: [
                  'Deserializes JSON string into native language data structures (memory objects)',
                  'Validates field types, mandatory fields, regex patterns, and numeric ranges',
                  'Strips unknown/injected properties (prevents Mass Assignment & Prototype Pollution vulnerabilities)',
                ],
              },
              {
                id: 'service-logic',
                name: 'Controller & Business Service',
                subtitle: 'Domain Logic & Persistence',
                type: 'server',
                icon: 'ti-cpu',
                badge: 'Business Service',
                protocol: 'Transactions',
                details: [
                  'Executes transactional domain rules; queries database within ACID transaction',
                  'Publishes background events (e.g., OrderPlaced to Kafka/RabbitMQ)',
                ],
              },
              {
                id: 'serializer-response',
                name: 'Response Serializer & Cache Formatter',
                subtitle: 'JSON Response Formatting',
                type: 'database',
                icon: 'ti-brackets-contain',
                badge: 'HTTP 201 Created',
                protocol: 'JSON Output',
                details: [
                  'Serializes data model into clean external DTO (Data Transfer Object); strips sensitive fields (password_hash)',
                  'Adds ETag, Content-Type: application/json, and Cache-Control headers',
                ],
              },
            ],
            connections: [
              {
                from: 'api-consumer',
                to: 'api-gateway',
                label: '1. API Call with Bearer JWT',
                protocol: 'HTTPS REST',
              },
              {
                from: 'api-gateway',
                to: 'auth-validator',
                label: '2. Rate Limit OK → Verify Token',
                protocol: 'Gateway Pipeline',
              },
              {
                from: 'auth-validator',
                to: 'schema-validator',
                label: '3. Token Valid → Parse JSON',
                protocol: 'Memory Context',
              },
              {
                from: 'schema-validator',
                to: 'service-logic',
                label: '4. Validated DTO to Service',
                protocol: 'Domain Logic',
              },
              {
                from: 'service-logic',
                to: 'serializer-response',
                label: '5. Serialize Result Object',
                protocol: 'JSON Format',
              },
            ],
            keyTakeaways: [
              'Stateless JWT Architecture: Traditional session auth requires querying a central session database for every request. JWTs verify identity mathematically in memory, eliminating database bottlenecks.',
              'Idempotency Keys: Network requests can fail after server processing but before response reaches client. Using an Idempotency-Key header prevents duplicate charges on network retries.',
              'Boundary Validation: Always sanitize and validate request inputs at the controller boundary. Never allow unvalidated client input into database queries or internal services.',
            ],
            rawSpec: `Client App
  │
  │  POST /api/login  {email, password}
  ▼
API Server
  │  Verify credentials (hash + compare)
  │  Generate JWT (sign with secret key)
  │
  │  Response: 200 OK { token: "eyJ..." }
  ▼
Client stores token (memory/localStorage)

Next request:
Client
  │  GET /api/profile
  │  Authorization: Bearer eyJ...
  ▼
API Gateway / Middleware
  │  Decode JWT → {userId: 123, role: "user"}
  │  Verify signature → Valid ✓
  │  Check expiry → Not expired ✓
  │  Check rate limit → 45/100 remaining ✓
  ▼
Route Controller
  │  Fetch user 123 from database/cache
  ▼
Response: 200 OK { id: 123, name: "Alice", email: "..." }`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'API Versioning' },
        {
          type: 'paragraph',
          text: 'Once clients depend on an API, you cannot break the contract. API versioning allows you to evolve without breaking existing clients. Common strategies:',
        },
        {
          type: 'bullets',
          items: [
            'URL versioning (most common): /api/v1/users → /api/v2/users. Simple, visible.',
            'Header versioning: Accept: application/vnd.api.v2+json. More elegant but less discoverable.',
            'Semantic versioning: Major version for breaking changes. Minor for additions. Patch for bug fixes.',
          ],
        },
        { type: 'heading2', text: 'CORS — Cross-Origin Resource Sharing' },
        {
          type: 'paragraph',
          text: 'By default, browser security (the same-origin policy) stops JavaScript on site-a.com from reading data fetched from api-b.com. An "origin" is the scheme + domain + port, like https://myapp.com. The API server can opt in by sending CORS headers that name the origins it trusts: Access-Control-Allow-Origin: https://myapp.com. For requests that could change data or use custom headers (e.g. POST with JSON, PUT, DELETE), the browser first sends a "preflight" OPTIONS request to ask permission before sending the real one.',
        },
        {
          type: 'flow',
          title: 'CORS preflight',
          code: `sequenceDiagram
  participant B as Browser on myapp.com
  participant A as api-b.com
  B->>A: OPTIONS /orders (Origin myapp.com, method PUT)
  A-->>B: Access-Control-Allow-Origin https://myapp.com
  alt Origin allowed
    B->>A: PUT /orders (the real request)
    A-->>B: 200 OK - JavaScript can read it
  else Origin not allowed
    Note over B: Browser blocks it with a CORS error
  end`,
          text: 'CORS is enforced by the browser, not the server. Tools like curl or other servers ignore it completely.',
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
            'Myth: "REST is a protocol." Reality: REST is an architectural style, not a protocol. It is a set of conventions for using HTTP.',
            'Myth: "JWT is encrypted." Reality: JWT is base64-encoded (anyone can decode it) and signed (cannot be tampered with). Use HTTPS to prevent interception. For truly sensitive data, use JWE (JSON Web Encryption).',
            'Myth: "API keys are safer than JWTs." Reality: API keys are static and have no expiry by default — a leaked key is compromised forever. JWTs expire automatically.',
            'Myth: "GraphQL is always better than REST." Reality: REST has better caching (GET requests are cacheable). GraphQL is better for complex, varied data requirements. Choose based on your use case.',
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
            'API Gateway: Central entry point for all API requests. Handles auth, rate limiting, routing, logging. Products: AWS API Gateway, Kong, Nginx.',
            'Microservices Communication: Services call each other via internal APIs. gRPC for performance; REST for simplicity.',
            "Backend for Frontend (BFF): A dedicated API layer for each client type (mobile BFF, web BFF). Aggregates and tailors responses for each client's needs.",
            'Rate Limiting API: Use sliding window counters (in Redis) to enforce per-user, per-endpoint request limits.',
            'API Design for Scale: Pagination (cursor-based), filtering, field selection, bulk endpoints — all influence how the backend database queries are structured.',
          ],
        },
      ],
    },
  ],
};
