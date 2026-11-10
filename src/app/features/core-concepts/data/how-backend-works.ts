import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 8 — How a Backend Request is Processed
// ─────────────────────────────────────────────────────────────────────────────
export const howBackendWorks: CoreConcept = {
  id: 'how-backend-works',
  title: 'How a Backend Request is Processed',
  emoji: '⚙️',
  icon: 'ti-code',
  color: '#14b8a6',
  bg: '#ccfbf1',
  accentGlow: 'rgba(20,184,166,0.15)',
  difficulty: 'Foundational',
  tagline:
    'Middleware, routing, controllers, business logic, database — the full journey inside a server.',
  tags: ['Middleware', 'Routing', 'Controllers', 'Business Logic', 'Response'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'When an HTTP request arrives at your application server, it does not go straight to "the code that answers it". It passes through a series of steps — a pipeline — before a response is sent back. The main stops are middleware (shared checks every request goes through), the router (picks the right handler), the controller (coordinates the work), services (the business rules) and repositories (talk to the database). Understanding this pipeline is essential for any backend developer: it is the internal anatomy of a web application.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: think of a restaurant. The door staff check you in (middleware), the host takes you to the right table (router), the waiter takes your order (controller), the chef follows the recipes (service), and the pantry staff fetch ingredients (repository). Each person does one job and hands off to the next.',
        },
        {
          type: 'flow',
          title: 'The big picture — a request’s journey through the server',
          code: `flowchart LR
  C([Client]):::client -->|"HTTP request"| M[Middleware<br/>log, auth, parse]:::security
  M --> R[Router<br/>which handler?]:::network
  R --> CT[Controller<br/>coordinate]:::server
  CT --> S[Service<br/>business rules]:::server
  S --> RP[Repository<br/>data access]:::server
  RP --> DB[(Database)]:::db
  CT -->|"HTTP response"| C`,
          text: 'The request travels inward layer by layer. The answer is built by the controller and travels back out to the client.',
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
          text: 'Without a structured request processing pipeline, every route handler would need to manually parse headers, verify tokens, validate input, log requests, handle errors, and connect to the database. The pipeline pattern separates these concerns so each piece of code has a single responsibility.',
        },
        { type: 'heading2', text: 'The Single Responsibility Principle in Action' },
        {
          type: 'bullets',
          items: [
            'Middleware layer: Cross-cutting concerns (logging, auth, rate limiting, parsing).',
            'Router: Decides which handler processes this request.',
            'Controller: Coordinates the request — validates input, calls services, builds response.',
            'Service layer: Business logic — the rules that define what the application does.',
            'Repository/DAO (Data Access Object): Data access — how to talk to the database.',
          ],
        },
        {
          type: 'flow',
          title: 'One job per layer',
          code: `flowchart TB
  subgraph Edge["Shared for every request"]
    MW["Middleware<br/>logging, auth, rate limits, parsing"]:::security
  end
  subgraph App["Specific to this request"]
    RT["Router<br/>pick the handler"]:::network
    CT["Controller<br/>validate, call service, reply"]:::server
    SV["Service<br/>business rules"]:::server
  end
  subgraph Data["Data access"]
    RP["Repository<br/>SQL and queries"]:::server
    DB[(Database)]:::db
  end
  MW --> RT --> CT --> SV --> RP --> DB`,
          text: 'Each layer only talks to the one below it. If you change the database, only the repository changes. If a business rule changes, only the service changes.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Middleware — The Preprocessing Chain' },
        {
          type: 'paragraph',
          text: 'Middleware are functions that run before (or after) the route handler. Each one receives the request and can add to it (for example, attach the logged-in user). Then it does one of two things: calls next() to hand the request to the next middleware, or "short-circuits" — sends a response itself (like 401 Unauthorized) so the request never reaches the handler.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Express.js middleware chain
app.use(requestLogger);      // 1. Log every request
app.use(cors());             // 2. Add CORS headers
app.use(express.json());     // 3. Parse JSON body
app.use(authenticateJWT);   // 4. Verify auth token
app.use(rateLimiter);        // 5. Check rate limits

// Route: only reached if ALL middleware pass
app.get('/api/products', productController.list);

// Middleware example: auth check
function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // Pass to next middleware
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}`,
        },
        {
          type: 'flow',
          title: 'Middleware chain — pass along or stop early',
          code: `flowchart TD
  IN([Request arrives]):::client --> L[Logger]
  L --> P[Body parser]
  P --> A{Valid token?}:::security
  A -->|"no"| E401["401 Unauthorized<br/>response sent, chain stops"]:::highlight
  A -->|"yes, next()"| RL{Under rate limit?}:::cache
  RL -->|"no"| E429["429 Too Many Requests"]:::highlight
  RL -->|"yes, next()"| H[Route handler]:::server
  H --> OUT([Response]):::client`,
          text: 'Any middleware can end the request early by sending a response. Only requests that pass every check reach your route handler.',
        },
        { type: 'heading2', text: 'Routing — Matching Request to Handler' },
        {
          type: 'paragraph',
          text: 'The router looks at the HTTP method (GET, POST…) and the path (/api/orders/42) and picks the handler function for it. Path parameters like :id are pulled out into req.params. Fast frameworks store routes in a trie — a tree where each branch is one path segment — so finding a match stays quick even with thousands of routes.',
        },
        {
          type: 'flow',
          title: 'How the router picks a handler',
          code: `flowchart LR
  REQ["GET /api/orders/42"]:::client --> RT{Router:<br/>method + path match?}:::network
  RT -->|"GET /api/orders"| H1[OrderController.list]:::server
  RT -->|"GET /api/orders/:id<br/>id = 42"| H2[OrderController.getById]:::highlight
  RT -->|"POST /api/orders"| H3[OrderController.create]:::server
  RT -->|"no match"| NF["404 Not Found"]`,
        },
        { type: 'heading2', text: 'Controller — The Coordinator' },
        {
          type: 'paragraph',
          text: 'The controller handles a specific route. It validates input, calls the appropriate service methods, and builds the HTTP response. Controllers should be thin — they coordinate but do not contain business logic.',
        },
        { type: 'heading2', text: 'Service Layer — Business Logic' },
        {
          type: 'paragraph',
          text: 'Services contain the actual business rules. "A user can only have 5 active orders." "Applying a discount code requires the order total to be over $50." "After a payment, send a confirmation email." These rules live in services, not controllers or database code.',
        },
        { type: 'heading2', text: 'Repository Pattern — Data Access' },
        {
          type: 'paragraph',
          text: 'The repository hides the details of the database behind simple methods. Services call repository.findById(id) and do not know or care whether the data comes from PostgreSQL, MongoDB, or Redis. This makes testing easier (swap in a fake "mock" repository) and lets you change the database without touching business logic.',
        },
        {
          type: 'flow',
          title: 'The repository as a plug-in point',
          code: `flowchart LR
  S[OrderService]:::server -->|"findById(42)"| R[OrderRepository<br/>interface]:::highlight
  R -.-> PG[(PostgreSQL)]:::db
  R -.-> MG[(MongoDB)]:::db
  R -.-> MK[In-memory mock<br/>for tests]:::cache`,
          text: 'The service only knows the repository’s methods. Which storage sits behind it can change without the service noticing.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'POST /api/orders — Complete Request Processing' },
        {
          type: 'numbered',
          items: [
            'HTTP request arrives at port 443. TLS decrypted. TCP data delivered to Node.js process.',
            'Request logging middleware: Log {method: POST, path: /api/orders, ip: 1.2.3.4, timestamp: ...}',
            'CORS middleware: Check Origin header. Add Access-Control-Allow-Origin response header.',
            'Body parser middleware: Read request body bytes, parse JSON → req.body = {productId: 5, qty: 2}.',
            'Auth middleware: Extract JWT from header. Verify signature. Decode. Set req.user = {id: 123}.',
            'Rate limiter middleware: Check Redis counter for user 123. Under limit → increment and proceed.',
            'Input validation middleware: Validate req.body schema. productId must be integer, qty must be 1-100.',
            'Router matches POST /api/orders → OrderController.create.',
            'Controller: Call orderService.createOrder(req.user.id, req.body).',
            'Service: Check inventory (productRepository.findById), calculate price, apply discounts, create order record.',
            'Repository: INSERT INTO orders ... → returns {orderId: 789}.',
            'Service: Publish "order_created" event to Kafka (for async notification).',
            'Controller: Build response {orderId: 789, status: "pending", total: 29.99}.',
            'Response middleware: Add response headers (Content-Type, X-Request-ID).',
            'Response serialized to JSON, sent back via TCP → Client receives 201 Created.',
          ],
        },
        {
          type: 'flow',
          title: 'POST /api/orders — who talks to whom',
          code: `sequenceDiagram
  participant C as Client
  participant MW as Middleware chain
  participant CT as OrderController
  participant SV as OrderService
  participant RP as Repositories
  participant DB as Database
  participant K as Kafka
  C->>MW: POST /api/orders with JWT and JSON body
  Note over MW: log, CORS, parse body,<br/>verify JWT, rate limit, validate
  MW->>CT: router matches OrderController.create
  CT->>SV: createOrder(userId 123, body)
  SV->>RP: productRepository.findById(5)
  RP->>DB: SELECT product
  DB-->>RP: product row, stock OK
  SV->>RP: orderRepository.create(...)
  RP->>DB: INSERT INTO orders
  DB-->>RP: orderId 789
  SV-)K: publish order_created (async)
  SV-->>CT: order 789
  CT-->>MW: 201 with order JSON
  Note over MW: add headers like X-Request-ID
  MW-->>C: 201 Created`,
          text: 'The Kafka event is "fire and forget": the client gets its answer without waiting for emails or notifications to be sent.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Error Handling Middleware' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Global error handler — must be last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, fields: err.fields });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Unexpected errors — don't leak internal details
  res.status(500).json({ error: 'Internal server error' });
});`,
        },
        {
          type: 'flow',
          title: 'How the global error handler picks a status code',
          code: `flowchart TD
  T["Error thrown anywhere<br/>in controller, service or repository"]:::highlight --> H{Global error handler:<br/>what kind of error?}:::server
  H -->|"ValidationError"| E400["400 Bad Request<br/>with field details"]
  H -->|"NotFoundError"| E404["404 Not Found"]
  H -->|"UnauthorizedError"| E401["401 Unauthorized"]:::security
  H -->|"anything else"| E500["500 Internal server error<br/>details logged, not leaked"]`,
          text: 'Code deep in the stack just throws. One central place turns errors into safe, consistent HTTP responses.',
        },
        { type: 'heading2', text: 'Request Context — Thread-Local vs. AsyncLocalStorage' },
        {
          type: 'paragraph',
          text: 'As a request flows through the pipeline, it collects context: the user ID, a request ID used for tracing, maybe a tenant (customer account) ID. Passing these through every function as arguments would be tedious. In Node.js, AsyncLocalStorage lets you store this "per-request" data once and read it from anywhere while that request is being handled (Java and similar languages use thread-local storage for the same job). This is how correlation IDs work: the request ID is stored once and automatically added to every log line, so you can find all logs for one request.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Layered Architecture in Practice' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Controller (thin — coordinates)
class OrderController {
  async create(req: Request, res: Response) {
    const dto = await validateCreateOrderDto(req.body);
    const order = await this.orderService.createOrder(req.user.id, dto);
    res.status(201).json(order);
  }
}

// Service (business logic)
class OrderService {
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const product = await this.productRepo.findById(dto.productId);
    if (!product || product.stock < dto.quantity) throw new OutOfStockError();
    
    const price = product.price * dto.quantity;
    const discount = await this.discountService.calculate(userId, price);
    
    const order = await this.orderRepo.create({
      userId, productId: dto.productId,
      quantity: dto.quantity,
      total: price - discount
    });
    
    await this.eventBus.publish('order.created', { orderId: order.id });
    return order;
  }
}

// Repository (data access)
class OrderRepository {
  async create(data: CreateOrderData): Promise<Order> {
    const result = await this.db.query(
      'INSERT INTO orders (user_id, product_id, quantity, total) VALUES ($1,$2,$3,$4) RETURNING *',
      [data.userId, data.productId, data.quantity, data.total]
    );
    return result.rows[0];
  }
}`,
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
          title: 'At a glance — the onion: in through the layers, back out again',
          code: `flowchart TB
  SOCK["OS socket + event loop<br/>bytes arrive on port 443"]:::network --> L1
  subgraph Onion["Middleware layers"]
    L1["1. Logger + request ID"]:::server --> L2["2. Security + CORS"]:::security
    L2 --> L3["3. Body parser + auth"]:::security
    L3 --> CT["4. Router + controller"]:::highlight
    CT --> POOL["5. Borrow DB connection<br/>from pool"]:::db
    POOL -->|"result"| UNW["6. Unwind outward<br/>log duration, set headers"]:::server
  end
  UNW --> RESP([HTTP response to client]):::client`,
          text: 'Middleware wraps the controller like layers of an onion: the request passes through each layer going in, and the response passes back through them coming out.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-backend-pipeline',
            title: 'The Onion Middleware & Request Processing Pipeline',
            subtitle:
              'Tracing a request through non-blocking event loops, ordered middleware layers, router, and controller',
            nodes: [
              {
                id: 'socket-event-loop',
                name: 'OS Socket & Non-Blocking Event Loop',
                subtitle: 'epoll / kqueue Kernel Listener',
                type: 'network',
                icon: 'ti-bolt',
                badge: 'I/O Listener',
                protocol: 'Event Loop',
                details: [
                  'Kernel triggers epoll read event when network packet arrives on TCP port 443',
                  'Runtime reads raw byte chunks into memory buffer without blocking other concurrent connections',
                ],
              },
              {
                id: 'request-logger-context',
                name: '1. Request Context & Correlation ID',
                subtitle: 'Observability & Tracing',
                type: 'gateway',
                icon: 'ti-file-text',
                badge: 'Middleware 1',
                protocol: 'X-Request-ID',
                details: [
                  'Generates unique UUID (trace_id) and attaches it to request context',
                  'Logs incoming method, URL, and timestamp; passes trace_id to downstream database calls',
                ],
              },
              {
                id: 'security-cors-middleware',
                name: '2. Security & CORS Enforcement',
                subtitle: 'Helmet & CORS Headers',
                type: 'security',
                icon: 'ti-shield-check',
                badge: 'Middleware 2',
                protocol: 'CORS & CSP',
                details: [
                  'Validates Origin header against permitted domain whitelist; handles OPTIONS preflight',
                  'Appends security headers: X-Content-Type-Options: nosniff, Strict-Transport-Security',
                ],
              },
              {
                id: 'body-parser-middleware',
                name: '3. Streaming Body Parser & Auth',
                subtitle: 'Stream Accumulation & Authentication',
                type: 'server',
                icon: 'ti-binary',
                badge: 'Middleware 3 & 4',
                protocol: 'JSON Buffer',
                details: [
                  'Accumulates incoming stream chunks until completed; enforces 1MB payload limit',
                  'Parses JSON into req.body; validates auth token and populates req.user',
                ],
              },
              {
                id: 'router-controller',
                name: '4. Router & Controller Execution',
                subtitle: 'Pattern Matching & Business Logic',
                type: 'server',
                icon: 'ti-code',
                badge: 'Controller Action',
                protocol: 'Trie Route Match',
                details: [
                  'Matches URL path against routing tree (e.g. /users/:id); extracts params',
                  'Calls business controller action: validates inputs, orchestrates domain logic',
                ],
              },
              {
                id: 'db-connection-pool',
                name: '5. Database Connection Pool & Query',
                subtitle: 'Pooled TCP Client Reuse',
                type: 'database',
                icon: 'ti-database',
                badge: 'DB Pool',
                protocol: 'Parameterized SQL',
                details: [
                  'Borrows pre-established TCP client from pool (avoids expensive 3-way handshake)',
                  'Executes parameterized SQL query; releases client back to pool immediately',
                ],
              },
              {
                id: 'reverse-middleware-unwind',
                name: '6. Onion Outward Unwinding & Response',
                subtitle: 'Post-Processing & Socket Flush',
                type: 'client',
                icon: 'ti-arrow-back-up',
                badge: 'Response Flush',
                protocol: 'HTTP Response',
                details: [
                  'Execution flows backward through middleware: logs total request duration (e.g. 24ms)',
                  'Sets Content-Type, writes HTTP status 200, flushes response buffers to client socket',
                ],
              },
            ],
            connections: [
              {
                from: 'socket-event-loop',
                to: 'request-logger-context',
                label: '1. I/O Event → Enter Onion',
                protocol: 'Inward Flow',
              },
              {
                from: 'request-logger-context',
                to: 'security-cors-middleware',
                label: '2. Next() with Trace ID',
                protocol: 'Pipeline',
              },
              {
                from: 'security-cors-middleware',
                to: 'body-parser-middleware',
                label: '3. Next() CORS verified',
                protocol: 'Pipeline',
              },
              {
                from: 'body-parser-middleware',
                to: 'router-controller',
                label: '4. Next() Body parsed & Auth verified',
                protocol: 'Pipeline',
              },
              {
                from: 'router-controller',
                to: 'db-connection-pool',
                label: '5. Borrow pooled DB client',
                protocol: 'SQL Query',
              },
              {
                from: 'db-connection-pool',
                to: 'reverse-middleware-unwind',
                label: '6. Results return; Outward unwind',
                protocol: 'Outward Flow',
              },
            ],
            keyTakeaways: [
              'The Onion Pattern: Middleware wraps your controller like layers of an onion. A request travels inward through each layer, and response travels outward in reverse order through post-processing.',
              'Non-blocking Event Loop: A single-threaded event loop (like Node.js) can handle 10,000+ concurrent requests because it delegates database queries and network I/O to OS threads and resumes via callbacks.',
              'Connection Pooling: Opening a database TCP connection takes 30–50ms. Maintaining a pool of 20 reusable connections drops query dispatch time to < 1ms.',
            ],
            rawSpec: `Incoming HTTP Request
        │
        ▼ Middleware Chain (in order)
   ┌──────────────────────────┐
   │ 1. Request Logger        │ ← log every request
   │ 2. CORS Handler          │ ← add CORS headers
   │ 3. Body Parser           │ ← parse JSON body
   │ 4. Auth Middleware       │ ← verify JWT, set req.user
   │ 5. Rate Limiter          │ ← check Redis counter
   │ 6. Input Validator       │ ← validate schema
   └──────────────────────────┘
        │
        ▼ Router
   Match: GET /api/users/:id → UserController.getUserById()
        │
        ▼ Controller
   Call UserService.getUser(id)
        │
        ▼ Service / Business Logic
   Check Redis cache first (HIT? return)
   If MISS: Query database
        │
        ▼ Database Query
   SELECT * FROM users WHERE id = $1  (parameterized)
        │
        ▼ Response Formatter
   Strip sensitive fields (password_hash)
   Format JSON response
        │
        ▼ Outward Middleware
   Log duration: "GET /api/users/123 completed in 23ms"
        │
        ▼
HTTP/2 200 OK sent to browser`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Concurrency in Node.js' },
        {
          type: 'paragraph',
          text: 'Node.js runs your JavaScript on a single thread, yet it handles thousands of requests at once. The trick is the event loop and non-blocking I/O (input/output such as network or disk calls). When your handler awaits a database query, Node.js does not sit and wait — it parks that request and serves other requests. When the database replies, Node.js picks up where it left off. This is why Node.js scales well for I/O-bound workloads (apps that mostly wait on databases and APIs rather than doing heavy calculations).',
        },
        {
          type: 'flow',
          title: 'One thread, many requests — the event loop at work',
          code: `sequenceDiagram
  participant A as Request A
  participant EL as Event loop (1 thread)
  participant DB as Database
  participant B as Request B
  A->>EL: handler runs
  EL->>DB: send query for A (non-blocking)
  Note over EL: free while A waits
  B->>EL: handler runs
  EL-->>B: response for B sent
  DB-->>EL: rows for A ready
  EL-->>A: A resumes after await, response sent`,
          text: 'While request A waits on the database, the single thread is free to fully serve request B.',
        },
        { type: 'heading2', text: 'Database Connection Pooling' },
        {
          type: 'paragraph',
          text: 'Opening a new database connection is slow — roughly 50-200ms for the network handshake, login and setup. So instead of opening one per request, the app keeps a pool of already-open connections (libraries like pg-pool or HikariCP do this). When a request needs the database, it borrows a connection from the pool and gives it back when done. Pool size is typically 10-50 connections. Too many, and PostgreSQL runs out of memory and resources. Too few, and requests queue up waiting for a free connection.',
        },
        {
          type: 'flow',
          title: 'Borrowing from the connection pool',
          code: `flowchart TD
  REQ([Request needs the DB]):::client --> Q{Free connection<br/>in the pool?}:::cache
  Q -->|"yes"| USE["Borrow it, run query<br/>under 1ms to start"]:::db
  Q -->|"no"| WAIT["Wait in line<br/>until one is returned"]:::queue
  WAIT --> USE
  USE --> RET["Return connection to pool<br/>stays open for the next request"]:::server`,
          text: 'The expensive step — opening a connection — happens once at startup, not on every request.',
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
            'Myth: "Thicker controllers are fine for small projects." Reality: Even for small projects, thin controllers are worth the discipline. Fat controllers are the #1 source of unmaintainable backend code.',
            'Myth: "Services should directly query the database." Reality: Direct DB access in services tightly couples business logic to the data layer. Repository pattern allows mocking in tests and changing DB without rewriting logic.',
            'Myth: "Node.js is slow because it is single-threaded." Reality: Node.js single thread handles I/O concurrently via the event loop. It is slow for CPU-intensive tasks (e.g., video encoding) but excellent for I/O-heavy APIs.',
            'Myth: "Error handling is optional for prototypes." Reality: Without global error handling, any unhandled error crashes the process in production. Always add a global catch-all error handler.',
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
            'Observability: Request logging with correlation IDs, structured logging (JSON), distributed tracing (OpenTelemetry) — all implemented as middleware.',
            'Feature Flags: Middleware can check feature flags and modify behavior before the request reaches the controller.',
            'Multi-tenancy: Middleware extracts the tenant ID from the JWT or subdomain and makes it available to all downstream handlers.',
            'Circuit Breaker: Middleware or service layer wraps external calls in circuit breakers — stop calling a failing service and return a cached/fallback response.',
            'CQRS: Separate command handlers (writes) from query handlers (reads). Each follows the same middleware → controller → service → repository pipeline but with optimized implementations.',
          ],
        },
      ],
    },
  ],
};
