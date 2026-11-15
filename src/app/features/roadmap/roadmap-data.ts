// System Design learning roadmap: phases in dependency order, each with topics that say what to
// learn, why it matters, how deep to go and a real-world example on the Angular / Node.js /
// NestJS / PostgreSQL / MongoDB / Redis / AWS stack. `dependsOn` holds topic ids from this file.

/** must = required before moving on, should = expected at senior level, advanced = differentiator. */
export type TopicDepth = 'must' | 'should' | 'advanced';

export interface StudyLink {
  label: string;
  /** Router link, e.g. ['/core-concepts', 'how-dns-works']. */
  link: string[];
  /** Query params, e.g. { topic: 'nodejs-caching' } for an Interview Q&A topic. */
  query?: Record<string, string>;
}

export interface RoadmapTopic {
  id: string;
  title: string;
  depth: TopicDepth;
  /** One line: why this matters for building or designing systems. */
  why: string;
  /** What you need to understand. */
  learn: string[];
  /** How deep to study it, and what "enough" looks like. */
  howDeep: string;
  /** A concrete scenario on the Angular / Node.js / NestJS / PostgreSQL / MongoDB / Redis / AWS stack. */
  example: string;
  /** Topic ids that should be understood first. */
  dependsOn: string[];
  /** Matching PrepHub lessons. */
  study?: StudyLink[];
}

export interface RoadmapPhase {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  icon: string;
  /** Rough time at 8–10 hours a week. */
  duration: string;
  goal: string;
  /** Phase ids this phase builds on. */
  requires: string[];
  topics: RoadmapTopic[];
  exercise: {
    title: string;
    steps: string[];
    /** What a good result contains, for checking your own work. */
    lookFor: string[];
  };
  /** Case study topic ids whose prerequisites are complete once this phase is done. */
  unlocks?: string[];
  /** Checklist: you are ready for the next phase when you can do all of these. */
  readyWhen: string[];
}

export const DEPTH_LABELS: Record<TopicDepth, string> = {
  must: 'Must know',
  should: 'Should know',
  advanced: 'Advanced',
};

export const DEPTH_HINTS: Record<TopicDepth, string> = {
  must: 'Required before moving on. Expect interview questions on these.',
  should: 'Expected at senior level. Learn well enough to discuss trade-offs.',
  advanced: 'Differentiators for senior and staff roles. Come back after a first pass.',
};

const concept = (label: string, id: string): StudyLink => ({ label, link: ['/core-concepts', id] });
const design = (label: string, id: string): StudyLink => ({ label, link: ['/system-design', id] });
const practice = (label: string, topic: string): StudyLink => ({
  label,
  link: ['/questions'],
  query: { topic },
});

/** Checklist shown between Phase 4 and Phase 5. */
export const SYSTEM_DESIGN_GATE: string[] = [
  'Trace a request from an Angular click to PostgreSQL and back, naming every hop (DNS, TCP, TLS, CDN, load balancer, Node.js, database).',
  'Explain why a CPU-heavy task in one Node.js request slows down every other request.',
  'Design a normalized PostgreSQL schema with the right indexes, and explain which isolation level a checkout needs.',
  'Explain what happens when a network call times out but the server actually processed it, and how idempotency fixes it.',
  'Describe replication lag, eventual consistency and CAP using a real database (RDS read replicas, MongoDB, DynamoDB), not just definitions.',
  'Estimate QPS, storage and bandwidth for a feature from daily active users within a few minutes.',
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'prerequisites',
    number: 1,
    title: 'Prerequisite Fundamentals',
    shortTitle: 'Fundamentals',
    icon: 'ti-cpu',
    duration: '2 weeks',
    goal: 'Understand what actually happens inside one machine: how code runs, waits, shares memory and stores data. Every scaling decision later is a reaction to these limits.',
    requires: [],
    topics: [
      {
        id: 'processes-threads',
        title: 'Processes, threads and the Node.js event loop',
        depth: 'must',
        why: 'Concurrency limits on one machine decide when you need more machines, worker threads or a queue.',
        learn: [
          'Process vs thread, and what a context switch costs',
          'CPU-bound vs I/O-bound work',
          'Event loop phases, the microtask queue and the libuv thread pool',
          'Why blocking the event loop blocks every request on that instance',
          'Cluster mode, worker_threads and child processes: when to use each',
        ],
        howDeep:
          'Deep. You should be able to explain, without notes, why one slow request in Node.js can raise latency for all users, and name three ways to fix it.',
        example:
          'A NestJS endpoint that generates a PDF report with a synchronous library raises P99 latency for the whole API. Fix: move the work to worker_threads, or push a job to a BullMQ queue on Redis and let a separate worker produce the file.',
        dependsOn: [],
        study: [practice('Node.js fundamentals questions', 'nodejs-fundamentals')],
      },
      {
        id: 'memory-storage-latency',
        title: 'Memory, disk and network: latency numbers',
        depth: 'must',
        why: 'Caching, database choice and estimation are all reasoning about orders of magnitude.',
        learn: [
          'Rough latency of L1 cache, RAM, SSD, same-datacenter network round trip and cross-region round trip',
          'Sequential vs random I/O',
          'Why serialization and payload size matter at scale',
          'Memory limits of a Node.js process (heap size, garbage collection pauses)',
        ],
        howDeep:
          'Know the orders of magnitude (nanoseconds, microseconds, milliseconds), not exact numbers. Enough to explain why Redis answers in under a millisecond and a cross-region call takes about 100 ms.',
        example:
          'A product page makes 12 sequential calls from Node.js to PostgreSQL, each about 2 ms, plus one cross-region call to a payment API at 120 ms. The cross-region call dominates, so caching it or moving it off the critical path matters more than tuning SQL.',
        dependsOn: ['processes-threads'],
      },
      {
        id: 'data-structures-systems',
        title: 'Data structures behind real systems',
        depth: 'must',
        why: 'Databases, caches and search engines are data structures with a network in front of them.',
        learn: [
          'Hash tables (Redis keys, hash-based sharding)',
          'B-trees (PostgreSQL and MongoDB indexes)',
          'LSM trees, at a high level (Cassandra, DynamoDB, RocksDB)',
          'Heaps and sorted sets (leaderboards, schedulers, top-K)',
          'Tries (autocomplete) and Bloom filters (cheap "definitely not present" checks)',
          'Big-O for reads and writes on each of these',
        ],
        howDeep:
          'Medium. Know which structure each system uses and its read and write cost. You do not need to implement a B-tree.',
        example:
          'A Redis sorted set (ZADD, ZREVRANGE) gives an O(log n) leaderboard; doing the same with ORDER BY score LIMIT 10 on a busy PostgreSQL table needs an index and still costs more per request.',
        dependsOn: [],
      },
      {
        id: 'concurrency-races',
        title: 'Concurrency, race conditions and locking',
        depth: 'must',
        why: 'Two requests touching the same data at the same time is the root of most production data bugs.',
        learn: [
          'Race conditions and check-then-act bugs',
          'Atomic operations',
          'Pessimistic locking vs optimistic locking (version columns)',
          'Deadlocks and how to avoid them (consistent lock order, short transactions)',
          'Why Node.js being single-threaded does not prevent races across async calls or across instances',
        ],
        howDeep:
          'Deep. You should be able to spot a race in a code review and fix it at the database level, not with an in-memory flag.',
        example:
          'Two users buy the last item at the same time. Reading stock, checking it in Node.js and then writing it oversells. Fix: UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0 and check the affected row count, or use SELECT … FOR UPDATE inside a transaction.',
        dependsOn: ['processes-threads'],
      },
      {
        id: 'solid-separation',
        title: 'SOLID, coupling, cohesion and separation of concerns',
        depth: 'must',
        why: 'Service boundaries in system design are the same idea as module boundaries in code, at a larger scale.',
        learn: [
          'The five SOLID principles with a real example of each',
          'Coupling vs cohesion',
          'Dependency inversion and dependency injection',
          'Layered architecture: controller, service, repository',
        ],
        howDeep:
          'Medium. Be able to explain how NestJS modules and providers or Angular services apply these, and when following a principle strictly adds needless complexity.',
        example:
          'An OrdersService that calls Stripe directly cannot be tested or switched to Razorpay. Introduce a PaymentGateway interface, inject an implementation through NestJS DI, and the service no longer depends on a vendor.',
        dependsOn: [],
      },
      {
        id: 'design-patterns',
        title: 'Core design patterns',
        depth: 'should',
        why: 'Patterns are the shared vocabulary for low-level design rounds and for describing architecture.',
        learn: [
          'Strategy, Factory, Adapter, Decorator',
          'Observer and pub/sub (RxJS, EventEmitter)',
          'Repository and Unit of Work',
          'Middleware / chain of responsibility (Express, NestJS interceptors, Angular HTTP interceptors)',
        ],
        howDeep:
          'Medium. Recognize them in frameworks you already use, and apply them in a 45-minute LLD round.',
        example:
          'An Angular HTTP interceptor chain (auth header, retry, error toast) and NestJS interceptors (logging, caching) are both chain of responsibility. A notification service with EmailSender, SmsSender and PushSender is Strategy plus Factory.',
        dependsOn: ['solid-separation'],
        study: [practice('Design pattern questions', 'nodejs-design-patterns')],
      },
      {
        id: 'estimation-math',
        title: 'Back-of-the-envelope math',
        depth: 'must',
        why: 'Numbers decide architecture. 100 requests a second and 100,000 requests a second need different designs.',
        learn: [
          'Powers of two and 1 KB / 1 MB / 1 GB / 1 TB',
          'Daily active users to requests per second (86,400 seconds a day, peak is 2–5× average)',
          'Storage growth per day and per year',
          'Bandwidth and the read:write ratio',
        ],
        howDeep:
          'Practise until you can estimate QPS and storage for a feature in under three minutes, rounding aggressively.',
        example:
          '1M daily users, each placing 2 orders a day at 2 KB each: about 23 writes/s on average, ~100/s at peak, and roughly 1.5 TB of order data a year. One PostgreSQL primary handles this easily, so sharding would be premature.',
        dependsOn: ['memory-storage-latency'],
        study: [concept('Back-of-the-envelope estimation', 'back-of-the-envelope-estimation')],
      },
      {
        id: 'serialization',
        title: 'Data formats, encoding and compression',
        depth: 'should',
        why: 'Payload format affects latency, bandwidth and how services evolve their contracts.',
        learn: [
          'JSON vs Protocol Buffers vs MessagePack',
          'UTF-8, Base64 and why Base64 grows data by about 33%',
          'Gzip and Brotli compression',
          'Schema evolution: adding fields without breaking old clients',
        ],
        howDeep:
          'Light to medium. Know the trade-offs; you will go deeper when choosing protocols in Phase 7.',
        example:
          'Uploading images as Base64 inside JSON from Angular bloats requests and Node.js memory. Upload directly to S3 with a pre-signed URL instead, and send only the object key to the API.',
        dependsOn: [],
      },
    ],
    exercise: {
      title: 'Measure the event loop',
      steps: [
        'Write an Express or NestJS endpoint that does a CPU-heavy loop for 200 ms.',
        'Load test it with autocannon or k6 and record P50 and P99 latency of a second, cheap endpoint.',
        'Move the heavy work to worker_threads and run the test again.',
        'Write down what changed and why.',
      ],
      lookFor: [
        'P99 of the cheap endpoint rises to roughly the blocking time while the heavy endpoint is under load',
        'After the change, the cheap endpoint stays fast even though the heavy one is still slow',
        'An explanation in terms of the single event loop thread, not "Node.js is slow"',
      ],
    },
    readyWhen: [
      'You can explain the event loop and why blocking it hurts every request.',
      'You can fix a stock oversell race at the database level.',
      'You can estimate QPS and yearly storage from daily users.',
    ],
  },
  {
    id: 'networking',
    number: 2,
    title: 'Networking and Client-Server Architecture',
    shortTitle: 'Networking',
    icon: 'ti-network',
    duration: '2–3 weeks',
    goal: 'Follow a request from the browser to the server and back, and understand every layer it crosses. Most latency, security and caching decisions happen here.',
    requires: ['prerequisites'],
    topics: [
      {
        id: 'ip-tcp-udp',
        title: 'How the internet works: IP, ports, TCP and UDP',
        depth: 'must',
        why: 'Connection setup cost, reliability and ordering come from the transport layer.',
        learn: [
          'IP addresses, ports, private vs public addresses',
          'TCP three-way handshake, reliability, ordering, flow and congestion control',
          'UDP and where it fits (DNS, video, gaming, QUIC)',
          'The TCP/IP layers at a high level (you do not need to memorize OSI)',
        ],
        howDeep:
          'Medium. Explain why opening a new connection per request is slow and why HTTP/3 moved to UDP.',
        example:
          'A Node.js service calling another service without keep-alive opens a new TCP (and TLS) connection per request, adding several round trips. Enabling an HTTP agent with keepAlive: true removes that cost.',
        dependsOn: ['memory-storage-latency'],
        study: [
          concept('How the internet works', 'how-internet-works'),
          practice('Networking questions', 'nodejs-networking'),
        ],
      },
      {
        id: 'dns',
        title: 'DNS resolution',
        depth: 'must',
        why: 'DNS is the first hop of every request, and a common tool for failover and traffic routing.',
        learn: [
          'Recursive resolvers, root, TLD and authoritative servers',
          'Record types: A, AAAA, CNAME, ALIAS, MX, TXT',
          'TTL and caching at each level',
          'DNS-based routing: latency, geolocation, weighted and failover policies',
        ],
        howDeep:
          'Medium. Explain why a DNS change takes time to apply and how Route 53 failover routing works.',
        example:
          'Route 53 points api.example.com to an ALB with an ALIAS record and a health check. If the primary region fails the check, failover routing sends traffic to a standby region. A long TTL slows that switch down.',
        dependsOn: ['ip-tcp-udp'],
        study: [concept('How DNS works', 'how-dns-works')],
      },
      {
        id: 'http',
        title: 'HTTP: methods, status codes, headers and versions',
        depth: 'must',
        why: 'HTTP semantics decide what can be cached, retried safely and debugged.',
        learn: [
          'Methods and which are safe and idempotent (GET, PUT, DELETE vs POST, PATCH)',
          'Status code families and the common ones (200, 201, 204, 301, 304, 400, 401, 403, 404, 409, 429, 500, 502, 503, 504)',
          'Request and response headers, cookies',
          'Keep-alive and connection reuse',
          'HTTP/1.1 vs HTTP/2 (multiplexing) vs HTTP/3 (QUIC)',
        ],
        howDeep:
          'Deep. You should choose the right status code and method by reflex and explain the difference between 502, 503 and 504 when debugging.',
        example:
          'A NestJS endpoint returns 200 with { error: "not found" }. The Angular app cannot tell errors apart, CDN caches the error and monitoring shows zero errors. Returning 404 fixes all three.',
        dependsOn: ['ip-tcp-udp'],
        study: [concept('How HTTP works', 'how-http-works')],
      },
      {
        id: 'tls-https',
        title: 'TLS and HTTPS',
        depth: 'must',
        why: 'Every production request is encrypted; where TLS ends affects architecture and security.',
        learn: [
          'The TLS handshake and what it costs',
          'Certificates, certificate authorities and the chain of trust',
          'TLS termination at a load balancer or CDN',
          'Mutual TLS (mTLS) for service-to-service traffic (advanced)',
        ],
        howDeep:
          'Medium. Explain the handshake at a high level and where TLS should terminate in an AWS setup.',
        example:
          'An ACM certificate on CloudFront and the ALB terminates TLS; traffic from ALB to ECS tasks stays inside the VPC. Regulated workloads may re-encrypt to the tasks or use mTLS between services.',
        dependsOn: ['http'],
        study: [concept('How HTTPS works', 'how-https-works')],
      },
      {
        id: 'cookies-cors',
        title: 'Cookies, same-origin policy and CORS',
        depth: 'must',
        why: 'Most "it works in Postman but not in the browser" bugs come from here.',
        learn: [
          'Same-origin policy',
          'CORS and preflight (OPTIONS) requests',
          'Cookie attributes: HttpOnly, Secure, SameSite, Domain, Path',
          'Credentials mode in fetch and Angular HttpClient (withCredentials)',
        ],
        howDeep:
          'Medium. Configure CORS correctly without using a wildcard origin with credentials.',
        example:
          'An Angular app on app.example.com calls api.example.com with a session cookie. The API needs Access-Control-Allow-Origin set to the exact origin, Allow-Credentials true, and the cookie needs SameSite and Secure set for it to be sent.',
        dependsOn: ['http'],
      },
      {
        id: 'proxies',
        title: 'Forward and reverse proxies',
        depth: 'should',
        why: 'Almost every request passes through a reverse proxy; load balancers, CDNs and API gateways are all specialized versions of one.',
        learn: [
          'Forward proxy vs reverse proxy',
          'What a reverse proxy does: TLS termination, routing, compression, buffering, caching',
          'Nginx in front of Node.js',
          'X-Forwarded-For and X-Forwarded-Proto, and which proxy headers to trust',
        ],
        howDeep:
          'Light to medium. Know what sits between the browser and your Node.js process and what each layer changes.',
        example:
          'A NestJS app behind an ALB sees every request coming from the load balancer’s IP address, so per-IP rate limiting blocks all users at once. Enable trust proxy and read the client IP from X-Forwarded-For.',
        dependsOn: ['http'],
      },
      {
        id: 'request-lifecycle',
        title: 'The full request lifecycle',
        depth: 'must',
        why: 'This is the mental map every later design hangs on.',
        learn: [
          'Browser cache → DNS → TCP → TLS → CDN → load balancer → reverse proxy → app server → cache → database',
          'And the path back: serialization, compression, caching headers, rendering',
          'Where time is spent at each hop, and how to see it (browser DevTools, server timing, tracing)',
        ],
        howDeep: 'Deep. Draw it from memory and say what can fail or be slow at each step.',
        example:
          'Opening a product page in an Angular app: index.html from CloudFront, hashed JS bundles from browser cache, then an XHR to /api/products/42 through ALB to a NestJS task, which checks Redis then PostgreSQL.',
        dependsOn: ['dns', 'tls-https', 'http'],
        study: [
          concept('How a website is served', 'how-website-is-served'),
          concept('How the browser works', 'how-browser-works'),
        ],
      },
      {
        id: 'http-caching-cdn',
        title: 'HTTP caching, CDNs and compression',
        depth: 'must',
        why: 'The cheapest request is the one that never reaches your servers.',
        learn: [
          'Cache-Control (max-age, no-cache, no-store, private, public, immutable)',
          'ETag, Last-Modified and 304 Not Modified',
          'CDN edge caching, cache keys and invalidation',
          'Gzip vs Brotli',
        ],
        howDeep: 'Medium. Set correct cache headers for a single-page app and for an API.',
        example:
          'Angular builds produce hashed file names, so main.abc123.js can be cached for a year with immutable, while index.html uses no-cache so users get new releases. Serve both from S3 through CloudFront.',
        dependsOn: ['request-lifecycle'],
      },
      {
        id: 'realtime-communication',
        title: 'Real-time: polling, long polling, SSE and WebSockets',
        depth: 'must',
        why: 'Choosing the wrong real-time transport is expensive to undo.',
        learn: [
          'Short polling and long polling',
          'Server-Sent Events: one-way, over plain HTTP, automatic reconnect',
          'WebSockets: two-way, stateful connections',
          'Scaling stateful connections: sticky sessions, Redis pub/sub fan-out, connection limits',
          'Client retries and timeouts',
        ],
        howDeep:
          'Medium. Pick one for a given feature and explain how it scales to many server instances.',
        example:
          'Order status updates only flow server → client, so SSE is enough. Chat needs two-way messages, so use a NestJS WebSocket gateway with the Socket.IO Redis adapter so messages reach users connected to other instances.',
        dependsOn: ['http'],
        study: [design('Chat system', 'chat-system')],
      },
    ],
    exercise: {
      title: 'Trace one page load end to end',
      steps: [
        'Open a product page of any site with DevTools open and record the network waterfall.',
        'Name every hop for the HTML document: DNS, TCP, TLS, CDN or load balancer, origin.',
        'For three assets and one API call, read the caching, compression and CORS headers and explain each.',
        'Say which requests would disappear on a second visit, and why.',
      ],
      lookFor: [
        'Connection setup time is separated from server time and download time',
        'Each cache header is explained by what the browser will do on the next visit',
        'You can say where TLS terminates and which requests reuse a connection',
      ],
    },
    readyWhen: [
      'You can trace a page load end to end without notes.',
      'You can choose between SSE, WebSockets and polling for a feature and justify it.',
      'You can set cache headers for an Angular app and its API.',
    ],
  },
  {
    id: 'backend-databases',
    number: 3,
    title: 'Backend and Database Fundamentals',
    shortTitle: 'Backend & DB',
    icon: 'ti-database',
    duration: '4 weeks',
    goal: 'Know how a single backend and a single database work well before splitting them. Most real systems fail on data modeling and queries, not on distributed algorithms.',
    requires: ['prerequisites', 'networking'],
    topics: [
      {
        id: 'backend-architecture',
        title: 'Backend structure: layers, configuration and errors',
        depth: 'must',
        why: 'A clean single service is the unit you later scale, split and deploy.',
        learn: [
          'Controller, service and repository layers',
          'Validation at the edge (DTOs)',
          'Central error handling and consistent error responses',
          'Configuration per environment, and twelve-factor app principles',
          'Background jobs vs request handling',
        ],
        howDeep:
          'Medium. You likely do this already; make sure you can explain why each layer exists.',
        example:
          'A NestJS app with feature modules (users, products, orders), DTOs validated by class-validator, an exception filter that maps errors to a standard JSON shape, and @nestjs/config for environment settings.',
        dependsOn: ['solid-separation', 'request-lifecycle'],
        study: [concept('How the backend works', 'how-backend-works')],
      },
      {
        id: 'rest-api-design',
        title: 'REST API design',
        depth: 'must',
        why: 'The API is the contract between frontend, backend and other teams; it is hard to change later.',
        learn: [
          'Resource naming and HTTP method semantics',
          'Pagination: offset vs cursor, and why cursor scales',
          'Filtering, sorting and partial responses',
          'Versioning strategies (URL, header)',
          'Error format and validation responses',
          'OpenAPI / Swagger contracts',
          'Webhooks: signing, retries and replay protection',
        ],
        howDeep:
          'Deep. Design a clean API for a feature on a whiteboard, including pagination and errors.',
        example:
          'GET /orders?cursor=…&limit=20 using a created_at + id cursor stays fast at page 10,000, while OFFSET 200000 in PostgreSQL scans and discards 200,000 rows. NestJS @nestjs/swagger generates the OpenAPI spec that the Angular client is generated from.',
        dependsOn: ['http', 'backend-architecture'],
        study: [
          concept('How APIs work', 'how-apis-work'),
          practice('API design questions', 'nodejs-api-design'),
        ],
      },
      {
        id: 'relational-modeling',
        title: 'Relational modeling and normalization',
        depth: 'must',
        why: 'The data model outlives the code; a bad schema is the most expensive mistake to fix.',
        learn: [
          'Entities, relationships, primary and foreign keys',
          'Normal forms up to 3NF in practical terms',
          'When to denormalize, and what it costs',
          'Constraints (unique, check, foreign key) as business rules',
        ],
        howDeep: 'Deep. Model an e-commerce schema and justify every table.',
        example:
          'orders, order_items, products and users in PostgreSQL. order_items copies the price at purchase time on purpose: that is intentional denormalization, because the product price can change later.',
        dependsOn: ['data-structures-systems'],
      },
      {
        id: 'database-internals',
        title: 'How a database works inside: WAL, MVCC and the query planner',
        depth: 'should',
        why: 'Isolation levels, replication and crash recovery all follow from a few internal mechanisms.',
        learn: [
          'Pages, the buffer pool and why memory size matters',
          'Write-ahead log (WAL): durability, crash recovery and the basis of replication',
          'MVCC: readers do not block writers; dead rows and VACUUM in PostgreSQL',
          'How the query planner chooses a plan from table statistics',
          'B-tree storage (PostgreSQL, MongoDB WiredTiger) vs LSM storage (Cassandra, RocksDB)',
        ],
        howDeep:
          'Medium. Explain each mechanism in two sentences and what it causes in production. You do not need on-disk formats.',
        example:
          'A background job leaves a transaction open for two hours. PostgreSQL cannot clean up rows that transaction might still see, so tables bloat and queries slow down across the app. Keep transactions short and set idle_in_transaction_session_timeout.',
        dependsOn: ['relational-modeling', 'data-structures-systems'],
      },
      {
        id: 'indexing-queries',
        title: 'Indexes and query optimization',
        depth: 'must',
        why: 'Most performance problems in a normal web app are missing or wrong indexes.',
        learn: [
          'B-tree indexes and how they speed up lookups and ranges',
          'Composite indexes and the leftmost-prefix rule',
          'Covering, partial and unique indexes',
          'Reading EXPLAIN ANALYZE output',
          'The N+1 query problem in ORMs',
          'The write cost of every extra index',
        ],
        howDeep: 'Deep. Given a slow query, you should find the cause with EXPLAIN and fix it.',
        example:
          'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20 does a full scan and sort. A composite index on (user_id, created_at DESC) turns it into an index range scan. In MongoDB the same rule applies to compound indexes.',
        dependsOn: ['relational-modeling'],
        study: [
          concept('How databases work', 'how-databases-work'),
          practice('SQL questions', 'nodejs-sql'),
        ],
      },
      {
        id: 'transactions-isolation',
        title: 'Transactions, ACID and isolation levels',
        depth: 'must',
        why: 'Correctness under concurrency is what separates a toy from a production system.',
        learn: [
          'ACID properties and what each guarantees',
          'Isolation levels: read committed, repeatable read, serializable',
          'Anomalies: dirty read, non-repeatable read, phantom, lost update, write skew',
          'Row locks, SELECT … FOR UPDATE, deadlocks',
          'Optimistic concurrency with version columns',
        ],
        howDeep:
          "Deep. Know PostgreSQL's default (read committed), which anomalies it allows, and how to prevent a lost update.",
        example:
          'Two admins edit the same product. With a version column, UPDATE … SET …, version = version + 1 WHERE id = $1 AND version = $2 affects 0 rows for the slower one, and NestJS returns 409 Conflict so Angular can show "this item was changed".',
        dependsOn: ['concurrency-races', 'relational-modeling'],
      },
      {
        id: 'nosql-families',
        title: 'NoSQL database families',
        depth: 'must',
        why: 'Document, key-value, wide-column and graph stores each fit different access patterns.',
        learn: [
          'Document, key-value, wide-column and graph databases, with one example of each',
          'Designing for access patterns rather than entities',
          'What you give up: joins, ad-hoc queries, transactions across many records',
          'DynamoDB partition keys and sort keys at a high level',
        ],
        howDeep: 'Medium. Know one good use and one bad use for each family.',
        example:
          'Sessions and carts fit a key-value store (Redis, DynamoDB). A social graph with "friends of friends" queries fits a graph database. Reporting across many entities with ad-hoc filters fits neither; keep that relational.',
        dependsOn: ['relational-modeling'],
      },
      {
        id: 'mongodb-schema-design',
        title: 'MongoDB schema design',
        depth: 'should',
        why: 'In a document database the schema decides performance; a relational-style schema in MongoDB gets the downsides of both.',
        learn: [
          'Embedding vs referencing, and the 16 MB document limit',
          'Unbounded arrays as an anti-pattern',
          'Compound indexes and the equality, sort, range (ESR) rule',
          'Aggregation pipelines',
          'Multi-document transactions and their cost',
          'Schema validation',
        ],
        howDeep:
          'Deep if your stack uses MongoDB, light otherwise. Model the same feature in PostgreSQL and MongoDB and compare.',
        example:
          'A product catalog with very different attributes per category (laptops vs shoes) fits MongoDB documents well. Reviews are referenced, not embedded, because a popular product can have unbounded reviews.',
        dependsOn: ['nosql-families', 'indexing-queries'],
        study: [practice('MongoDB questions', 'nodejs-nosql')],
      },
      {
        id: 'redis-fundamentals',
        title: 'Redis data structures',
        depth: 'must',
        why: 'Redis is the default cache, rate limiter, queue and session store in Node.js systems.',
        learn: [
          'Strings, hashes, lists, sets, sorted sets and streams',
          'TTL and key expiry',
          'Atomic commands (INCR, SETNX / SET NX) and Lua scripts',
          'Single-threaded command execution and why one slow command blocks Redis',
          'Persistence (RDB, AOF) and what happens on restart',
        ],
        howDeep: 'Medium. Know which data structure solves which problem.',
        example:
          'INCR plus EXPIRE on rate:{userId}:{minute} is a fixed-window rate limiter. A sorted set keyed by timestamp gives a sliding window. KEYS * on a production ElastiCache cluster blocks every other client; use SCAN.',
        dependsOn: ['data-structures-systems'],
      },
      {
        id: 'connection-pooling',
        title: 'Database connections and pooling',
        depth: 'should',
        why: 'Running out of database connections is a classic scaling outage.',
        learn: [
          'Why connections are expensive in PostgreSQL',
          'Pool sizing per instance × number of instances',
          'External poolers (PgBouncer, RDS Proxy)',
          'Serverless connection storms',
        ],
        howDeep: 'Medium. Be able to calculate total connections for a deployment.',
        example:
          '20 ECS tasks with a pg pool of 20 each open 400 connections, above the limit of a small RDS instance. Lower the pool size, or put RDS Proxy in front, especially for Lambda functions.',
        dependsOn: ['backend-architecture'],
      },
      {
        id: 'choosing-database',
        title: 'Choosing a database',
        depth: 'must',
        why: '"Why this database?" is asked in nearly every system design interview.',
        learn: [
          'Decide from access patterns, consistency needs, query flexibility and scale',
          'Relational as the default for transactional data',
          'When document, key-value, search (Elasticsearch / OpenSearch) or time-series stores fit better',
          'Polyglot persistence and its operational cost',
        ],
        howDeep: 'Deep. Give a reasoned choice in two minutes, including what you are giving up.',
        example:
          'Orders and payments go in PostgreSQL (transactions, constraints). Product search goes in OpenSearch (full-text, facets). Sessions and carts go in Redis (fast, can expire).',
        dependsOn: ['transactions-isolation', 'nosql-families', 'redis-fundamentals'],
      },
      {
        id: 'authentication',
        title: 'Authentication: sessions, JWT, OAuth 2.0 and OpenID Connect',
        depth: 'must',
        why: 'Every system design has an authentication story, and it shapes statelessness and scaling.',
        learn: [
          'Authentication vs authorization',
          'Server-side sessions vs JWT, and the trade-offs of each',
          'Access tokens and refresh tokens, expiry and rotation',
          'OAuth 2.0 authorization code flow with PKCE, and what OpenID Connect adds',
          'Revoking access: session stores, short expiry, deny lists',
        ],
        howDeep:
          'Deep. Explain how you would revoke a JWT, and where tokens should be stored in an Angular app.',
        example:
          'Angular keeps a short-lived access token in memory and the refresh token in an HttpOnly cookie. An HTTP interceptor refreshes on 401 and replays the request once. Sessions kept in Redis can be revoked instantly; a JWT stays valid until it expires unless you add a deny list.',
        dependsOn: ['cookies-cors', 'tls-https', 'redis-fundamentals'],
        study: [practice('Auth questions', 'nodejs-auth-advanced')],
      },
      {
        id: 'authorization',
        title: 'Authorization: RBAC, ABAC and resource-level checks',
        depth: 'should',
        why: 'Most leaks of business data are authorization bugs, not broken logins.',
        learn: [
          'Role-based (RBAC) vs attribute-based (ABAC) access control',
          'Resource-level checks: does this user own this record?',
          'Where to enforce: gateway, service, or database (row-level security)',
          'Permissions inside the token vs looked up on each request',
        ],
        howDeep: 'Medium. Spot a missing ownership check in a code review.',
        example:
          'GET /orders/42 checks that the user is logged in but not that order 42 is theirs, so any customer can read any order by changing the id. A NestJS guard must compare the order’s user_id with the caller, and the query should filter by user_id as well.',
        dependsOn: ['authentication'],
      },
      {
        id: 'web-security',
        title: 'Web security: XSS, CSRF, injection and the OWASP Top 10',
        depth: 'must',
        why: 'Security bugs are design bugs; reviewers expect you to mention them unprompted.',
        learn: [
          'XSS and how Angular sanitizes templates (and how bypassSecurityTrust* breaks that)',
          'CSRF and why SameSite cookies and CSRF tokens prevent it',
          'SQL and NoSQL injection',
          'The OWASP Top 10 at a headline level',
          'Security headers (CSP, HSTS) with helmet',
        ],
        howDeep: 'Medium. Recognize each attack in code and name the fix.',
        example:
          'A Node.js query built with string concatenation is open to SQL injection; use parameterized queries ($1) with pg or an ORM. In MongoDB, passing req.body.email directly lets { "$ne": null } bypass a login check, so validate input with class-validator.',
        dependsOn: ['cookies-cors'],
        study: [practice('Security questions', 'nodejs-security')],
      },
    ],
    exercise: {
      title: 'Model an e-commerce database and trace a login',
      steps: [
        'Design the PostgreSQL schema for users, products, carts, orders, order items and payments.',
        'Seed one million orders, then write the five most common queries.',
        'Use EXPLAIN ANALYZE to find slow ones and add indexes; note the write cost.',
        'Implement checkout in one transaction that cannot oversell stock.',
        'Model the product catalog again in MongoDB and compare.',
        'Explain what happens from clicking Login in Angular until the authenticated response reaches the browser, including cookie attributes and where the token is stored.',
      ],
      lookFor: [
        'Every slow query has an EXPLAIN plan from before and after the index',
        'Checkout cannot oversell when run from 50 concurrent clients',
        'You can say what each index costs on writes',
        'The login walkthrough covers password hashing, cookie attributes, CORS and token storage',
      ],
    },
    readyWhen: [
      'You can design a normalized schema with indexes and defend each one.',
      'You can explain which isolation anomaly a checkout must prevent and how.',
      'You can choose PostgreSQL, MongoDB or Redis for a use case with reasons.',
    ],
  },
  {
    id: 'distributed-fundamentals',
    number: 4,
    title: 'Distributed Systems Fundamentals',
    shortTitle: 'Distributed',
    icon: 'ti-share',
    duration: '3–4 weeks',
    goal: 'Understand what changes once data and work spread over many machines: partial failure, unreliable networks and data that disagrees with itself. This is the theory every design decision relies on.',
    requires: ['backend-databases'],
    topics: [
      {
        id: 'why-distributed-hard',
        title: 'What makes distributed systems hard',
        depth: 'must',
        why: 'Every resilience pattern later exists because of these failure modes.',
        learn: [
          'Partial failure: some parts work, others do not',
          'The fallacies of distributed computing (the network is not reliable, latency is not zero …)',
          'Timeouts: you cannot tell a slow server from a dead one',
          'No shared clock and no shared memory',
        ],
        howDeep:
          'Medium. Explain why "the call timed out" does not mean "the operation did not happen".',
        example:
          'NestJS calls the payment provider, which charges the card and then the response is lost. Your service sees a timeout. Retrying blindly double-charges; not retrying loses an order. This is why idempotency and reconciliation exist.',
        dependsOn: ['ip-tcp-udp'],
        study: [practice('Distributed systems questions', 'nodejs-distributed-systems')],
      },
      {
        id: 'idempotency',
        title: 'Idempotency and safe retries',
        depth: 'must',
        why: 'Retries are everywhere (browsers, load balancers, queues); without idempotency they create duplicates.',
        learn: [
          'Which HTTP methods are idempotent by definition',
          'Idempotency keys for POST requests',
          'Storing and replaying responses for a repeated key',
          'Using unique constraints as a safety net',
        ],
        howDeep: 'Deep. This comes up in payments, orders and every messaging design.',
        example:
          'Angular sends POST /payments with an Idempotency-Key header generated per checkout attempt. NestJS stores the key with the result in PostgreSQL under a unique index; a retried request returns the stored result instead of charging twice.',
        dependsOn: ['rest-api-design', 'concurrency-races', 'why-distributed-hard'],
      },
      {
        id: 'sync-vs-async',
        title: 'Synchronous vs asynchronous communication',
        depth: 'must',
        why: 'Choosing request-response vs messaging sets the coupling and failure behaviour of a system.',
        learn: [
          'Temporal coupling in synchronous calls',
          'Asynchronous messaging and eventual completion',
          'Latency the user sees vs total processing time',
          'When the user needs an answer now vs when work can happen later',
        ],
        howDeep: 'Deep. For each step in a flow, decide whether it must be synchronous.',
        example:
          'Placing an order: reserving stock and authorizing payment are synchronous because the user waits for a result. The confirmation email, invoice PDF and analytics event go to a queue.',
        dependsOn: ['why-distributed-hard'],
      },
      {
        id: 'message-queue-fundamentals',
        title: 'Message queue fundamentals',
        depth: 'must',
        why: 'Queues are how asynchronous work actually happens; later phases assume you know how they behave.',
        learn: [
          'Producer, broker and consumer',
          'Queue (one consumer gets each message) vs topic / pub-sub (every subscriber gets a copy)',
          'Acknowledgements and visibility timeouts',
          'Retries, poison messages and dead-letter queues',
          'Ordering, and why it is limited',
          'Job queues (BullMQ) vs message brokers',
        ],
        howDeep:
          'Medium. Use one queue in a small project. Choosing between brokers comes in Phase 7.',
        example:
          'An image upload endpoint in NestJS returns 202 right after adding a job to a BullMQ queue on Redis. A worker resizes the image; if it throws, the job is retried three times with backoff and then kept in a failed set you can inspect.',
        dependsOn: ['sync-vs-async', 'redis-fundamentals'],
        study: [concept('How message queues work', 'how-message-queues-work')],
      },
      {
        id: 'stateless-services',
        title: 'Stateful vs stateless services',
        depth: 'must',
        why: 'Only stateless services can be scaled out and replaced freely.',
        learn: [
          'Where state lives: memory, local disk, external stores',
          'Externalizing sessions, uploads and caches',
          'Sticky sessions and why they hurt scaling and deploys',
          'Services that are stateful on purpose (databases, WebSocket gateways)',
        ],
        howDeep: 'Medium. Spot hidden state in a Node.js service.',
        example:
          'A Node.js app keeps sessions in memory and saves uploads to local disk. Behind an ALB with three tasks, users get logged out and files disappear. Move sessions to ElastiCache and files to S3.',
        dependsOn: ['backend-architecture'],
      },
      {
        id: 'replication',
        title: 'Replication',
        depth: 'must',
        why: 'Replication gives availability and read scale, at the cost of consistency.',
        learn: [
          'Leader-follower (primary-replica) replication',
          'Synchronous vs asynchronous replication',
          'Replication lag and its effects',
          'Failover and promotion',
          'Multi-leader and leaderless replication at a high level',
        ],
        howDeep: 'Medium. Explain what users see when a read replica lags.',
        example:
          'A user updates their profile (write to the RDS primary) and the next page reads from a replica that is 500 ms behind, showing old data. Fix: read your own recent writes from the primary.',
        dependsOn: ['transactions-isolation', 'why-distributed-hard'],
      },
      {
        id: 'consistency-models',
        title: 'Consistency models',
        depth: 'must',
        why: '"Eventually consistent" is not one thing; you need to say which guarantee a feature needs.',
        learn: [
          'Strong (linearizable) consistency',
          'Eventual consistency',
          'Read-your-writes and monotonic reads',
          'Causal consistency (advanced)',
          'Picking the weakest model a feature can tolerate',
        ],
        howDeep:
          'Medium. Map features to consistency needs: balances need strong, like counts can be eventual.',
        example:
          'A bank balance in PostgreSQL must be strongly consistent. A product view counter can be updated in Redis and written to the database every minute. Users accept a stale count; they do not accept a stale balance.',
        dependsOn: ['replication'],
      },
      {
        id: 'cap-pacelc',
        title: 'CAP and PACELC',
        depth: 'must',
        why: 'These frame the trade-off every distributed datastore makes, and interviewers ask about them.',
        learn: [
          'CAP: during a network partition you choose consistency or availability',
          'Why "CA" systems do not exist once there is a network',
          'PACELC: without a partition you still trade latency for consistency',
          'How real databases expose these choices as settings',
        ],
        howDeep:
          'Medium. Apply it to a real database instead of reciting the definition. Interviewers ask "what happens during a partition?".',
        example:
          'DynamoDB offers eventually consistent reads (faster, cheaper) or strongly consistent reads. MongoDB lets you choose writeConcern and readConcern: w: "majority" survives a primary failure but adds latency.',
        dependsOn: ['consistency-models'],
      },
      {
        id: 'partitioning-sharding',
        title: 'Partitioning and sharding',
        depth: 'must',
        why: 'When one machine cannot hold the data or the writes, you split it, and the split key decides everything.',
        learn: [
          'Partitioning within one database vs sharding across many',
          'Range vs hash partitioning',
          'Choosing a shard key from access patterns',
          'Hot keys and hot shards',
          'Cross-shard queries and resharding',
        ],
        howDeep: 'Medium to deep. Choose a shard key and explain which queries become expensive.',
        example:
          'Sharding orders by user_id makes "my orders" a single-shard query, but "all orders today" for the admin dashboard must hit every shard, so feed it from a separate analytics store. A celebrity seller can still create a hot shard.',
        dependsOn: ['indexing-queries', 'replication'],
      },
      {
        id: 'consistent-hashing',
        title: 'Consistent hashing',
        depth: 'should',
        why: 'It lets caches and datastores add or remove nodes without moving most keys.',
        learn: [
          'Why hash(key) % N breaks when N changes',
          'The hash ring and virtual nodes',
          'Where it is used: Redis Cluster hash slots, DynamoDB, CDNs, load balancers',
        ],
        howDeep: 'Medium. Draw the ring and explain what moves when a node joins.',
        example:
          'With hash % 3 across three Redis nodes, adding a fourth remaps about 75% of keys and floods PostgreSQL with cache misses. Consistent hashing moves only about 25%.',
        dependsOn: ['partitioning-sharding'],
        study: [design('Distributed cache', 'distributed-cache')],
      },
      {
        id: 'delivery-semantics',
        title: 'Delivery semantics and idempotent consumers',
        depth: 'must',
        why: 'Every queue and webhook delivers duplicates or loses messages; you choose which.',
        learn: [
          'At-most-once, at-least-once and "exactly-once"',
          'Why exactly-once delivery is really at-least-once delivery plus idempotent processing',
          'Deduplication with message ids',
          'Ordering guarantees and their limits',
        ],
        howDeep: 'Deep. You will use this in every event-driven design.',
        example:
          'An SQS consumer in Node.js processes "OrderPaid" and crashes before deleting the message, so it is delivered again. Recording the event id in a processed_events table with a unique constraint, in the same transaction as the work, makes the second delivery a no-op.',
        dependsOn: ['idempotency', 'message-queue-fundamentals'],
      },
      {
        id: 'distributed-locks',
        title: 'Distributed locks',
        depth: 'should',
        why: 'Sooner or later two instances must not do the same thing at once: scheduled jobs, seat holds, payouts.',
        learn: [
          'Why an in-process mutex does not work across instances',
          'Database options: row locks, advisory locks, unique constraints',
          'Redis locks: SET NX with a TTL, and releasing only your own lock',
          'Why a TTL lock can end up held by two clients, and how fencing tokens fix it',
          'Preferring idempotency or a constraint over a lock when you can',
        ],
        howDeep: 'Medium. Know one safe approach and the failure mode of the Redis one.',
        example:
          'Two NestJS cron instances must not run the nightly billing job twice. A Redis lock with a TTL can expire during a long garbage-collection pause, letting a second instance start. Use a database row lock or a single scheduled ECS task, and make the job idempotent anyway.',
        dependsOn: ['concurrency-races', 'redis-fundamentals', 'why-distributed-hard'],
      },
      {
        id: 'time-ordering',
        title: 'Time, clocks and ordering',
        depth: 'advanced',
        why: 'Ordering events across machines without a shared clock causes subtle bugs.',
        learn: [
          'Clock skew and why server timestamps disagree',
          'Logical clocks (Lamport) and vector clocks',
          'Time-ordered unique IDs (Snowflake, ULID, UUIDv7)',
        ],
        howDeep: 'Light. Understand the problem and know the common ID schemes.',
        example:
          'Sorting chat messages by each server’s Date.now() can put a reply before the question. Use per-conversation sequence numbers or time-ordered IDs generated in one place.',
        dependsOn: ['why-distributed-hard'],
        study: [design('Unique ID generator', 'unique-id-generator')],
      },
      {
        id: 'consensus-coordination',
        title: 'Consensus, leader election and quorums',
        depth: 'advanced',
        why: 'These keep replicated systems correct; knowing them separates senior from mid-level.',
        learn: [
          'What consensus solves; Raft at a high level',
          'Leader election and split brain',
          'Quorum reads and writes (W + R > N)',
          'Gossip protocols (overview)',
        ],
        howDeep:
          'Light to medium. Explain the idea and the failure modes; you will not implement Raft.',
        example:
          'A three-node MongoDB replica set loses its primary. The two remaining nodes are a majority, so they elect a new primary within seconds. If the network splits one against two, the single node steps down and refuses writes, which prevents split brain. This is why replica sets use an odd number of members.',
        dependsOn: ['replication', 'time-ordering'],
      },
    ],
    exercise: {
      title: 'Break a replicated system on purpose',
      steps: [
        'Run PostgreSQL with one replica (Docker Compose is enough).',
        'Point reads at the replica and writes at the primary in a small NestJS app.',
        'Add replication delay and observe stale reads; fix it with read-your-writes.',
        'Write an SQS or BullMQ consumer that receives each message twice and make it idempotent.',
      ],
      lookFor: [
        'A reproducible stale read, and a fix that does not send every read to the primary',
        'A consumer that produces the same result when a message arrives twice',
        'A short note on what the user would have seen in each failure',
      ],
    },
    readyWhen: [
      'You can explain why a timeout does not tell you whether an operation happened.',
      'You can choose the consistency model a feature needs.',
      'You can pick a shard key and name the queries it makes expensive.',
    ],
  },
  {
    id: 'system-design-fundamentals',
    number: 5,
    title: 'System Design Fundamentals',
    shortTitle: 'SD Basics',
    icon: 'ti-sitemap',
    duration: '2–3 weeks',
    goal: 'Learn the process: turn a vague problem into requirements, numbers, an API, a data model and an architecture, then reason about trade-offs. This is where actual system design starts.',
    requires: ['distributed-fundamentals'],
    topics: [
      {
        id: 'requirements',
        title: 'Functional and non-functional requirements',
        depth: 'must',
        why: 'Most failed designs solve the wrong problem. Requirements drive every later choice.',
        learn: [
          'High-level design (components, data flow, failure) vs low-level design (classes, interfaces): know which one you are being asked for',
          'Functional requirements: what the system does (register, search products, place orders, pay, notify)',
          'Non-functional requirements: availability, scalability, reliability, fault tolerance, performance, durability, consistency, security, maintainability, observability',
          'Clarifying questions and scoping down',
          'Turning vague NFRs into numbers ("fast" → P99 under 300 ms)',
        ],
        howDeep: 'Deep. Practise asking the right questions in the first five minutes of a design.',
        example:
          'For checkout: functional = place order, pay, get confirmation. Non-functional = 99.99% available, no double charges (consistency), P99 under 500 ms, orders never lost (durability), PCI scope minimized (security).',
        dependsOn: [],
      },
      {
        id: 'sla-slo-sli',
        title: 'Availability numbers, SLA, SLO, SLI and latency percentiles',
        depth: 'must',
        why: 'Quality attributes are only useful when they are measurable.',
        learn: [
          'Nines: 99% ≈ 3.65 days, 99.9% ≈ 8.8 hours, 99.99% ≈ 53 minutes, 99.999% ≈ 5 minutes of downtime a year',
          'Serial dependencies multiply: three services at 99.9% give about 99.7%',
          'SLI (what you measure), SLO (your target), SLA (the contract)',
          'Error budgets',
          'Latency vs throughput; P50, P95, P99 and why averages hide problems',
        ],
        howDeep: 'Deep. Do the availability math quickly and explain why P99 matters.',
        example:
          'Your NestJS API depends on RDS, ElastiCache and a payment provider, each 99.95%. Calling all three on every request caps you near 99.85%. Removing Redis from the critical path (fallback to the database) raises it.',
        dependsOn: ['requirements', 'estimation-math'],
      },
      {
        id: 'building-blocks',
        title: 'The building blocks',
        depth: 'must',
        why: 'System design is composing a small set of components; know what each one is for.',
        learn: [
          'DNS, CDN, load balancer, API gateway',
          'Application servers and workers',
          'Cache, message queue, event stream',
          'Relational and NoSQL databases, search index, object storage',
          'What each one solves and what it costs to run',
        ],
        howDeep: 'Medium. One sentence on purpose and one on the main trade-off for each.',
        example:
          'A typical AWS stack: Route 53 → CloudFront (Angular from S3) → ALB → NestJS on ECS → ElastiCache + RDS PostgreSQL, with SQS + Lambda for background work and S3 for files.',
        dependsOn: ['request-lifecycle', 'choosing-database'],
        study: [
          concept('How load balancers work', 'how-load-balancers-work'),
          concept('How caching works', 'how-caching-works'),
          concept('How message queues work', 'how-message-queues-work'),
        ],
      },
      {
        id: 'architecture-styles',
        title: 'Monolith, modular monolith and microservices',
        depth: 'must',
        why: 'The most common senior interview question: "Would you use microservices here?"',
        learn: [
          'Monolith: simple to build, test and deploy, until team and code size grow',
          'Modular monolith: enforced module boundaries, one deployment',
          'Microservices: independent deploys and scaling, at a large operational cost',
          'Client-server, layered and event-driven styles',
        ],
        howDeep: 'Deep. Argue for the modular monolith as a default and say when you would split.',
        example:
          'A NestJS modular monolith with users, catalog, orders and payments modules, each owning its own tables and talking through service interfaces. Later, payments can be extracted because its boundary is already clean.',
        dependsOn: ['solid-separation', 'sync-vs-async'],
      },
      {
        id: 'frontend-architecture',
        title: 'Frontend architecture: rendering, state and performance',
        depth: 'should',
        why: 'In a full-stack role half of the system runs in the browser, and frontend design rounds are common.',
        learn: [
          'Rendering strategies: CSR, SSR, SSG and hydration, and when each fits',
          'Server state vs UI state, and where each lives',
          'Bundle size, lazy loading and code splitting',
          'Core Web Vitals: LCP, INP, CLS',
          'Micro-frontends, and when they are worth the cost (advanced)',
        ],
        howDeep:
          'Medium. Choose a rendering strategy and explain how the app loads fast on a slow phone.',
        example:
          'A public product page needs SEO and a fast first paint, so it uses Angular SSR with hydration and is cached at CloudFront. The logged-in dashboard is client-rendered and lazy-loads each feature route.',
        dependsOn: ['request-lifecycle', 'http-caching-cdn'],
        study: [
          concept('How the browser works', 'how-browser-works'),
          practice('Frontend system design questions', 'frontend-system-design'),
          practice('Web performance questions', 'web-performance'),
        ],
      },
      {
        id: 'ddd',
        title: 'Domain-Driven Design essentials',
        depth: 'must',
        why: 'DDD gives you the tools to find service boundaries before you need microservices.',
        learn: [
          'Ubiquitous language',
          'Bounded contexts and context maps',
          'Entities, value objects and aggregates',
          'Domain events',
        ],
        howDeep:
          'Medium. Strategic DDD (bounded contexts) matters most; tactical patterns are optional.',
        example:
          '"Product" means different things in Catalog (description, images), Inventory (stock per warehouse) and Orders (price at purchase). These are three bounded contexts, each with its own model.',
        dependsOn: ['architecture-styles'],
      },
      {
        id: 'design-framework',
        title: 'The system design interview framework',
        depth: 'must',
        why: 'Structure stops you from jumping to Kafka in minute two.',
        learn: [
          '1. Requirements and scope (5 min)',
          '2. Estimates (5 min)',
          '3. API design (5 min)',
          '4. Data model (5 min)',
          '5. High-level design (10 min)',
          '6. Deep dives, bottlenecks and failure handling (15 min)',
          'Talking through trade-offs and stating assumptions out loud',
        ],
        howDeep: 'Deep. Practise it until the structure is automatic.',
        example:
          'For a URL shortener: clarify read-heavy ratio, estimate 100:1 reads, define POST /urls and GET /:code, choose a key-value model, draw LB + service + cache + DB, then deep-dive into ID generation and cache hit rate.',
        dependsOn: ['requirements', 'sla-slo-sli', 'building-blocks'],
        study: [practice('System design questions', 'nodejs-system-design')],
      },
      {
        id: 'trade-offs',
        title: 'Thinking in trade-offs',
        depth: 'must',
        why: 'Seniority is judged by the trade-offs you name, not the technologies you list.',
        learn: [
          'Consistency vs availability vs latency',
          'Cost vs resilience',
          'Simplicity vs flexibility; build vs buy',
          'Writing an architecture decision record',
        ],
        howDeep: 'Deep. For every choice in a design, say what you are giving up.',
        example:
          '"I am caching product prices in Redis for 60 seconds. The trade-off is that a price change can take a minute to appear; checkout always reads the price from PostgreSQL, so customers are never charged a stale price."',
        dependsOn: ['cap-pacelc', 'architecture-styles'],
      },
      {
        id: 'low-level-design',
        title: 'Low-level design',
        depth: 'should',
        why: 'Many companies run a separate LLD or machine-coding round for senior roles.',
        learn: [
          'Class diagrams and interfaces',
          'Applying SOLID and patterns to a concrete problem',
          'Common LLD problems: parking lot, rate limiter, LRU cache, elevator, splitwise',
        ],
        howDeep: 'Medium. Solve one LLD problem a week in TypeScript.',
        example:
          'A rate limiter in TypeScript: a RateLimiter interface with TokenBucket and SlidingWindow strategies, a storage interface with in-memory and Redis implementations, and a NestJS guard that uses it.',
        dependsOn: ['design-patterns'],
        study: [practice('LLD questions', 'lld-design')],
      },
    ],
    exercise: {
      title: 'Design an e-commerce application from scratch',
      steps: [
        'Write functional and non-functional requirements with numbers.',
        'Estimate users, QPS, storage and peak traffic.',
        'Design the REST API and the data model.',
        'Draw a modular monolith on AWS and explain each component.',
        'List the three biggest risks and how the design handles them.',
      ],
      lookFor: [
        'Requirements have numbers: users, QPS, latency and availability targets',
        'Every component in the diagram has a stated reason to exist',
        'At least three trade-offs, each with what was given up',
        'A modular monolith, with a note on what would make you split it',
      ],
    },
    readyWhen: [
      'You can run the full design framework in 45 minutes.',
      'You can turn "should be fast and reliable" into SLOs with numbers.',
      'You can argue for or against microservices for a given team and product.',
    ],
    unlocks: ['cs-url-shortener'],
  },
  {
    id: 'scale-availability',
    number: 6,
    title: 'Scalability, Availability and Fault Tolerance',
    shortTitle: 'Scale & HA',
    icon: 'ti-shield-check',
    duration: '3–4 weeks',
    goal: 'Make a design survive more traffic and keep working when parts fail. This is where senior candidates are separated: the happy path is easy, the failure path is the interview.',
    requires: ['system-design-fundamentals'],
    topics: [
      {
        id: 'scaling-strategies',
        title: 'Vertical vs horizontal scaling and auto scaling',
        depth: 'must',
        why: 'Knowing when a bigger machine is enough saves a lot of complexity.',
        learn: [
          'Vertical scaling and its limits',
          'Horizontal scaling and the stateless requirement',
          'Auto scaling policies: target tracking on CPU, request count or queue depth',
          'Scaling the stateless tier vs scaling the data tier',
        ],
        howDeep: 'Medium.',
        example:
          'NestJS on ECS Fargate scales on ALB request count per target. Workers that read from SQS scale on queue depth (ApproximateNumberOfMessagesVisible), not CPU.',
        dependsOn: ['stateless-services', 'building-blocks'],
        study: [
          concept('How scaling works', 'how-scaling-works'),
          practice('Clustering and scaling questions', 'nodejs-clustering'),
        ],
      },
      {
        id: 'load-balancing',
        title: 'Load balancing',
        depth: 'must',
        why: 'The load balancer decides who gets traffic and who is taken out when unhealthy.',
        learn: [
          'L4 vs L7 load balancing (NLB vs ALB)',
          'Algorithms: round robin, least connections, weighted, consistent hashing',
          'Health checks and connection draining',
          'Load balancers as a single point of failure, and how managed ones avoid it',
        ],
        howDeep: 'Medium.',
        example:
          'An ALB health check on /health that also queries PostgreSQL marks every task unhealthy during a short database blip and takes the whole API down. Use a shallow liveness check for the load balancer and a deeper readiness check elsewhere.',
        dependsOn: ['scaling-strategies'],
        study: [
          concept('How load balancers work', 'how-load-balancers-work'),
          design('Distributed load balancer', 'load-balancer'),
        ],
      },
      {
        id: 'caching-strategies',
        title: 'Caching strategies',
        depth: 'must',
        why: 'Caching is the biggest single lever for read-heavy systems, and the biggest source of stale data.',
        learn: [
          'Cache layers: browser, CDN, reverse proxy, application, database',
          'Cache-aside, read-through, write-through and write-behind',
          'TTL and invalidation strategies',
          'Eviction policies: LRU, LFU',
          'Measuring hit rate',
        ],
        howDeep: 'Deep. Choose a pattern and invalidation strategy per data type.',
        example:
          'Product details: cache-aside in ElastiCache with a 5-minute TTL, deleted on update. Product price in checkout: never cached. Category pages: cached at CloudFront for 60 seconds.',
        dependsOn: ['redis-fundamentals', 'http-caching-cdn', 'consistency-models'],
        study: [
          concept('How caching works', 'how-caching-works'),
          practice('Caching questions', 'nodejs-caching'),
        ],
      },
      {
        id: 'cache-failure-modes',
        title: 'Cache failure modes',
        depth: 'must',
        why: 'A cache that fails badly can take the database down with it.',
        learn: [
          'Cache stampede (thundering herd): request coalescing, locks, early refresh',
          'Cache penetration: caching misses, Bloom filters',
          'Cache avalanche: TTL jitter',
          'Hot keys: local in-process cache, key replication',
          'Keeping cache and database consistent',
        ],
        howDeep: 'Deep. Expect a follow-up question on each.',
        example:
          'The home page cache key expires at peak and 5,000 concurrent requests all hit PostgreSQL. Fix: a short Redis lock so one request rebuilds the value while others serve the stale copy, plus random jitter on TTLs.',
        dependsOn: ['caching-strategies'],
      },
      {
        id: 'database-scaling',
        title: 'Scaling the database',
        depth: 'must',
        why: 'The database is usually the last bottleneck and the hardest to scale.',
        learn: [
          'Query and index tuning first',
          'Read replicas and read/write splitting',
          'Connection pooling',
          'Partitioning, then sharding',
          'Separate read models (CQRS) and denormalized views',
          'Archiving old data',
        ],
        howDeep: 'Deep. Give the order you would try these in, and why.',
        example:
          'An order history page is slow. Order of attack: add the missing index, cache the first page in Redis, move reads to an RDS replica, partition the orders table by month, and only then consider sharding.',
        dependsOn: ['partitioning-sharding', 'replication'],
      },
      {
        id: 'search-indexes',
        title: 'Search and inverted indexes',
        depth: 'should',
        why: 'Full-text search, filters and autocomplete do not scale on a transactional database.',
        learn: [
          "Why LIKE '%term%' cannot use a B-tree index",
          'Inverted indexes, tokenization and relevance scoring',
          'PostgreSQL full-text search, and when it is enough',
          'Elasticsearch / OpenSearch as a secondary store, kept in sync with the source of truth',
          'Autocomplete: prefix indexes and tries',
        ],
        howDeep: 'Light to medium. Know when to add a search engine and how data gets into it.',
        example:
          'Product search starts with PostgreSQL full-text search and a GIN index. When facets, typo tolerance and ranking are needed, products are indexed into OpenSearch from change events, and PostgreSQL stays the source of truth.',
        dependsOn: ['indexing-queries', 'data-structures-systems'],
        study: [design('Search autocomplete', 'search-autocomplete')],
      },
      {
        id: 'async-load-leveling',
        title: 'Queues for load leveling and backpressure',
        depth: 'must',
        why: 'Queues absorb spikes; backpressure and rate limits stop a spike from becoming an outage.',
        learn: [
          'Queue-based load leveling',
          'Backpressure: refusing or slowing work you cannot handle',
          'Scaling workers on queue depth',
          'Rate limiting at the edge as protection (the algorithms are in the rate limiter case study)',
        ],
        howDeep: 'Medium to deep.',
        example:
          'A flash sale sends 50× normal traffic. Orders are accepted quickly into SQS and processed by workers at a steady rate; the API returns 429 with Retry-After when a user exceeds their limit, enforced with a Redis sliding window.',
        dependsOn: ['message-queue-fundamentals'],
      },
      {
        id: 'resilience-patterns',
        title: 'Timeouts, retries, circuit breakers and bulkheads',
        depth: 'must',
        why: 'These stop one slow dependency from taking down everything that calls it.',
        learn: [
          'Timeouts on every network call',
          'Retries with exponential backoff and jitter, and retry budgets',
          'Circuit breaker states: closed, open, half-open',
          'Bulkheads: separate pools per dependency',
          'Cascading failures and retry storms',
        ],
        howDeep: 'Deep. Configure each one for a real dependency.',
        example:
          'Node.js calls a shipping-rates API with AbortSignal.timeout(800), retries twice with jittered backoff only on 503 and timeouts, and wraps it in an opossum circuit breaker. When the breaker is open, checkout uses a flat shipping rate.',
        dependsOn: ['why-distributed-hard', 'idempotency'],
      },
      {
        id: 'observability',
        title: 'Observability: logs, metrics and traces',
        depth: 'must',
        why: 'You cannot meet an SLO, tune a timeout or debug a failure in a system you cannot see into.',
        learn: [
          'Structured logs, log levels and centralized logging',
          'Metrics: RED (rate, errors, duration) for services, USE for resources',
          'Distributed tracing and correlation IDs',
          'What to alert on: SLO burn, not every metric',
        ],
        howDeep:
          'Deep on the concepts. Explain how you would find which service made one request slow. Tooling comes in Phase 8.',
        example:
          'An Angular interceptor sends an x-request-id header; NestJS logs it with pino in every line and passes it on. OpenTelemetry traces show that 1.8 s of a 2 s checkout was spent waiting on the Inventory service.',
        dependsOn: ['sla-slo-sli', 'why-distributed-hard'],
        study: [practice('Backend operations questions', 'nodejs-backend-operations')],
      },
      {
        id: 'high-availability',
        title: 'High availability: redundancy and failover',
        depth: 'must',
        why: 'Availability targets are met by removing single points of failure.',
        learn: [
          'Finding single points of failure',
          'Redundancy at every tier',
          'Active-active vs active-passive',
          'Health checks, heartbeats and automatic failover',
          'Multi-AZ deployment',
        ],
        howDeep: 'Deep. Walk a diagram and point out every single point of failure.',
        example:
          'ECS tasks spread across three availability zones, RDS Multi-AZ with automatic failover (about a minute), ElastiCache with a replica in another zone. The NestJS app reconnects to the new primary through the same endpoint.',
        dependsOn: ['load-balancing', 'replication'],
      },
      {
        id: 'graceful-degradation',
        title: 'Graceful degradation and fallbacks',
        depth: 'must',
        why: 'A system that does less when something fails beats one that does nothing.',
        learn: [
          'Classifying features as critical and non-critical',
          'Fallbacks: cached data, defaults, hiding features',
          'Feature flags as kill switches',
          'Load shedding',
        ],
        howDeep: 'Deep. For each dependency, say what the user sees when it is down.',
        example:
          'If the recommendation service is down, the Angular product page hides the "You may also like" section instead of showing an error. If Redis is down, the API reads from PostgreSQL with a concurrency limit so it does not overload the database.',
        dependsOn: ['resilience-patterns'],
      },
      {
        id: 'disaster-recovery',
        title: 'Disaster recovery: RTO, RPO and multi-region',
        depth: 'should',
        why: 'Availability covers small failures; disaster recovery covers losing a region or your data.',
        learn: [
          'RTO (how long until you are back) and RPO (how much data you can lose)',
          'Backups, point-in-time recovery and testing restores',
          'Strategies: backup and restore, pilot light, warm standby, active-active',
          'Multi-region data replication and its consistency cost',
        ],
        howDeep: 'Medium. Match a DR strategy to an RTO and RPO and estimate its cost.',
        example:
          'RDS point-in-time recovery gives an RPO of about 5 minutes. An Aurora Global Database replica in a second region with infrastructure ready to scale (warm standby) gives an RTO of minutes, at roughly double the database cost.',
        dependsOn: ['high-availability'],
      },
      {
        id: 'performance-testing',
        title: 'Performance profiling and load testing',
        depth: 'should',
        why: 'Capacity numbers should come from measurements, not guesses.',
        learn: [
          'Load, stress, spike and soak tests',
          'Tools: k6, autocannon, Artillery',
          'Profiling Node.js: clinic.js, flame graphs, --inspect',
          'Finding the bottleneck before adding servers',
        ],
        howDeep: 'Medium. Run one load test against your own project.',
        example:
          'A k6 test shows the API saturating at 800 requests per second with CPU at 30%. The flame graph shows time waiting on the pg pool, so the fix is pool size and queries, not more tasks.',
        dependsOn: ['scaling-strategies'],
        study: [practice('Performance questions', 'nodejs-performance')],
      },
      {
        id: 'chaos-engineering',
        title: 'Chaos engineering',
        depth: 'advanced',
        why: 'The only way to know your fallbacks work is to break things on purpose.',
        learn: [
          'Steady state, hypothesis, experiment, blast radius',
          'Game days',
          'AWS Fault Injection Service',
        ],
        howDeep: 'Light. Know the idea and be able to describe one experiment.',
        example:
          'In staging, stop the ElastiCache primary and check that the API stays up, latency rises within the SLO, and alerts fire.',
        dependsOn: ['graceful-degradation'],
      },
    ],
    exercise: {
      title: 'Payment system at 99.99% and a failure drill',
      steps: [
        'Design a payment flow with a 99.99% availability target and an RTO and RPO.',
        'Design a product listing API for 100,000 requests a minute with Redis; handle stampedes and hot keys.',
        'For each dependency, write what happens when it fails: Redis down, PostgreSQL primary failing over, payment provider timing out.',
        'Do the availability math for the critical path.',
      ],
      lookFor: [
        'Availability math for the critical path, with each dependency named',
        'A stated user experience for each failure, not just "it retries"',
        'Timeouts and retry limits given as numbers',
        'A stampede and hot-key plan for the listing API',
      ],
    },
    readyWhen: [
      'You can find every single point of failure in a diagram.',
      'You can explain stampede, penetration and avalanche, and fix each.',
      'You can say what the user sees when each dependency fails.',
    ],
    unlocks: ['cs-rate-limiter', 'cs-search-autocomplete', 'cs-ticket-booking'],
  },
  {
    id: 'microservices-architecture',
    number: 7,
    title: 'Microservices and Advanced Architecture',
    shortTitle: 'Microservices',
    icon: 'ti-hierarchy-3',
    duration: '3 weeks',
    goal: 'Split a system into services correctly and keep data consistent across them. Learn the patterns, but also when not to use them.',
    requires: ['scale-availability'],
    topics: [
      {
        id: 'microservices-why',
        title: 'Microservices: why, when and when not',
        depth: 'must',
        why: 'Splitting too early is a common and expensive mistake.',
        learn: [
          'Benefits: independent deploy, scale and ownership',
          'Costs: network calls, distributed data, operations, debugging',
          'Conway’s law and team topology',
          'Signs you are ready to split',
        ],
        howDeep: 'Deep. Make the case both ways.',
        example:
          'A five-person team with one NestJS monolith deploying daily should not split. Ten teams blocking each other on releases, with payments needing different scaling and compliance, is a good reason to extract services.',
        dependsOn: ['architecture-styles'],
        study: [practice('Microservices questions', 'nodejs-microservices')],
      },
      {
        id: 'service-boundaries',
        title: 'Service boundaries and database per service',
        depth: 'must',
        why: 'Wrong boundaries create a distributed monolith: all the cost, none of the benefit.',
        learn: [
          'Drawing boundaries around bounded contexts and business capabilities',
          'Database per service and data ownership',
          'Why a shared database couples services',
          'Getting data you do not own: API calls, events, replicated read models',
        ],
        howDeep: 'Deep.',
        example:
          'Order Service needs a product name for the order history page. Instead of querying the Catalog database, it stores the name and price on the order when it is placed, and listens to ProductUpdated events if it needs current data.',
        dependsOn: ['microservices-why', 'ddd'],
      },
      {
        id: 'protocol-selection',
        title: 'Choosing protocols: REST, GraphQL, gRPC, WebSockets, SSE and messaging',
        depth: 'must',
        why: '"When would you choose gRPC over REST, or Kafka over HTTP?" is a standard senior question.',
        learn: [
          'REST: public APIs and CRUD, cacheable, universally supported',
          'GraphQL: client-driven fetching for varied UIs; watch for N+1 and caching',
          'gRPC: fast typed service-to-service calls with streaming; poor browser support',
          'WebSockets and SSE: real-time to clients',
          'AMQP (RabbitMQ), Kafka, SQS: asynchronous messaging',
          'MQTT: only for IoT and constrained devices',
        ],
        howDeep:
          'Deep. For each, name a case where it is the right choice and a case where it is wrong.',
        example:
          'Angular talks to a BFF over REST. Internal NestJS services call each other with gRPC (@nestjs/microservices). Order events go through Kafka or SNS+SQS so new consumers can subscribe without changing the Order Service.',
        dependsOn: ['rest-api-design', 'realtime-communication', 'sync-vs-async'],
      },
      {
        id: 'api-gateway-bff',
        title: 'API gateway, BFF and service discovery',
        depth: 'must',
        why: 'Clients should not know your internal service layout.',
        learn: [
          'API gateway: routing, authentication, rate limiting, request shaping',
          'BFF: an API tailored to one client (web, mobile)',
          'Aggregating several service calls into one response',
          'Avoiding a gateway that holds business logic',
          'Service discovery: DNS-based (Kubernetes services, ECS Service Connect, AWS Cloud Map)',
          'Sidecars and service mesh: mTLS, retries and traffic shifting outside your code (overview)',
        ],
        howDeep: 'Medium.',
        example:
          'The Angular dashboard needs user, orders and recommendations in one call. A NestJS BFF calls three services in parallel and returns one shaped response, with a timeout per call so a slow recommendation does not delay the page.',
        dependsOn: ['service-boundaries', 'protocol-selection', 'load-balancing'],
      },
      {
        id: 'message-brokers',
        title: 'Choosing a message broker: Kafka, RabbitMQ, SQS/SNS, Redis Streams',
        depth: 'must',
        why: 'The right broker depends on ordering, replay, throughput and how much you want to operate.',
        learn: [
          'Queue vs topic vs log, and what replay makes possible',
          'Consumer groups and partitions',
          'Ordering guarantees: Kafka partitions, SQS FIFO message groups',
          'Throughput, retention and operational cost of each',
          'When to choose each: SQS/SNS for simple AWS work queues and fan-out, RabbitMQ for routing, Kafka for high-throughput streams and replay, Redis Streams for lightweight use',
        ],
        howDeep:
          'Medium to deep. Know one well (SQS or Kafka) and the others well enough to compare.',
        example:
          'OrderPlaced is published to SNS and fanned out to SQS queues for Inventory, Notifications and Analytics. Each queue has a DLQ after 5 failed attempts, with a CloudWatch alarm on DLQ depth.',
        dependsOn: ['message-queue-fundamentals', 'delivery-semantics'],
      },
      {
        id: 'event-driven',
        title: 'Event-driven architecture',
        depth: 'must',
        why: 'Events decouple services but make flows harder to see and debug.',
        learn: [
          'Events vs commands',
          'Choreography vs orchestration',
          'Event schema design and versioning',
          'Duplicate and out-of-order events',
        ],
        howDeep: 'Deep.',
        example:
          'OrderPlaced (event, past tense) lets any service react. ReserveStock (command) is sent to Inventory specifically. Adding a loyalty-points feature means adding a new subscriber without touching the Order Service.',
        dependsOn: ['message-brokers'],
      },
      {
        id: 'saga-outbox',
        title: 'Distributed transactions: Saga and Outbox',
        depth: 'must',
        why: 'Without a database transaction across services, you need another way to stay consistent.',
        learn: [
          'Why two-phase commit is avoided in microservices',
          'Saga: a sequence of local transactions with compensating actions',
          'Orchestrated vs choreographed sagas',
          'Transactional outbox: write the event in the same transaction as the data',
          'Inbox / deduplication on the consumer side',
        ],
        howDeep: 'Deep. Walk through a failure in the middle of a saga.',
        example:
          'Checkout saga: create order (pending) → reserve stock → charge payment → confirm order. If payment fails, compensate by releasing stock and cancelling the order. Order Service writes the order and an outbox row in one PostgreSQL transaction; a relay publishes outbox rows to SNS.',
        dependsOn: ['event-driven', 'transactions-isolation'],
        study: [design('Payment system', 'payment-system')],
      },
      {
        id: 'cdc-data-pipelines',
        title: 'OLTP vs OLAP, change data capture and data pipelines',
        depth: 'should',
        why: 'Running reports and analytics on the production database is a common cause of outages.',
        learn: [
          'OLTP (many small transactions) vs OLAP (large scans and aggregates)',
          'Why analytics belongs in a separate store (Redshift, BigQuery, ClickHouse, Athena on S3)',
          'Change data capture from the database log (Debezium, AWS DMS, DynamoDB Streams)',
          'Batch vs stream processing',
          'CDC as another way to publish outbox events',
        ],
        howDeep: 'Light to medium. Know why the split exists and how data moves across it.',
        example:
          'The admin dashboard runs "revenue by category this year" on the orders table and slows down checkout. Stream changes with AWS DMS into S3 or Redshift and run the report there; a few minutes of delay is fine for reporting.',
        dependsOn: ['saga-outbox', 'replication'],
      },
      {
        id: 'cqrs-event-sourcing',
        title: 'CQRS and Event Sourcing',
        depth: 'advanced',
        why: 'Powerful for audit-heavy and read-heavy domains, and overkill for most others.',
        learn: [
          'CQRS: separate write and read models',
          'Projections and eventually consistent read models',
          'Event sourcing: storing events instead of current state',
          'Snapshots, replay and schema evolution',
          'When not to use them',
        ],
        howDeep: 'Medium for CQRS, light for event sourcing.',
        example:
          'Orders are written to PostgreSQL, and an OrderPlaced consumer builds a denormalized MongoDB view for the admin search page. That is CQRS without event sourcing, and is the most common practical use.',
        dependsOn: ['event-driven', 'consistency-models'],
      },
      {
        id: 'strangler-migration',
        title: 'Migration patterns: Strangler Fig',
        depth: 'should',
        why: 'Real work is usually migrating an existing system, not designing a new one.',
        learn: [
          'Strangler Fig: route traffic piece by piece to new services',
          'Anti-corruption layer',
          'Running old and new in parallel and comparing results',
        ],
        howDeep: 'Medium. Be ready to describe a migration plan in steps.',
        example:
          'An Express monolith is migrated by putting an ALB with path-based rules in front: /api/payments/* goes to the new NestJS payments service, everything else still hits the monolith, until it can be removed.',
        dependsOn: ['service-boundaries'],
      },
      {
        id: 'multi-tenancy',
        title: 'Multi-tenancy',
        depth: 'should',
        why: 'Most B2B products are multi-tenant, and isolation mistakes leak one customer’s data to another.',
        learn: [
          'Models: shared tables with a tenant id, schema per tenant, database per tenant',
          'Enforcing isolation: row-level security, tenant-scoped repositories',
          'Noisy neighbours and per-tenant rate limits',
          'Per-tenant configuration, migrations and backups',
        ],
        howDeep: 'Medium if you work on SaaS, light otherwise.',
        example:
          'A NestJS SaaS app keeps all tenants in shared PostgreSQL tables with a tenant_id column. One forgotten WHERE clause would expose another tenant’s rows, so row-level security policies enforce the filter in the database, with the tenant id set per request from the token.',
        dependsOn: ['authorization', 'partitioning-sharding'],
      },
      {
        id: 'microservices-challenges',
        title: 'Microservices failure modes and compatibility',
        depth: 'should',
        why: 'Interviewers probe what goes wrong after the split.',
        learn: [
          'Cascading failures and dependency chains',
          'Backward-compatible API and event changes',
          'Contract testing (Pact)',
          'Debugging across services with traces and correlation IDs',
          'Deployment ordering and version skew',
        ],
        howDeep: 'Medium to deep.',
        example:
          'Renaming a field in an event breaks consumers deployed by other teams. Add the new field alongside the old one, migrate consumers, then remove the old field: expand, migrate, contract.',
        dependsOn: ['event-driven', 'resilience-patterns'],
      },
    ],
    exercise: {
      title: 'E-commerce as services',
      steps: [
        'Split the Phase 5 design into User, Product, Order, Payment, Inventory and Notification services.',
        'Choose the protocol for every arrow on the diagram and justify it.',
        'Design the checkout saga with compensations and an outbox.',
        'Describe what happens when Payment is down, when an event is delivered twice, and when Inventory is slow.',
      ],
      lookFor: [
        'Each service owns its data; no shared tables',
        'A protocol for every arrow, with a one-line reason',
        'A compensation for every saga step that can fail',
        'Consumers that are safe against duplicate and out-of-order events',
      ],
    },
    readyWhen: [
      'You can explain when not to use microservices.',
      'You can choose between REST, gRPC and a message broker for each interaction.',
      'You can walk through a saga failure with compensations.',
    ],
    unlocks: ['cs-ecommerce', 'cs-payment', 'cs-notifications', 'cs-chat'],
  },
  {
    id: 'production-cloud',
    number: 8,
    title: 'Production, Cloud and Infrastructure',
    shortTitle: 'Production',
    icon: 'ti-cloud',
    duration: '3 weeks',
    goal: 'Know how a design actually runs: where it is deployed, how it is secured, how it is released and how you find out it is broken.',
    requires: ['microservices-architecture'],
    topics: [
      {
        id: 'containers',
        title: 'Docker and containers',
        depth: 'must',
        why: 'Containers are the unit of deployment for almost every modern backend.',
        learn: [
          'Images, layers and caching',
          'Multi-stage builds',
          'Container networking and environment configuration',
          'Running as non-root, small base images',
        ],
        howDeep: 'Medium. Write a production Dockerfile for a NestJS app.',
        example:
          'A multi-stage Dockerfile: install and build in node:22, copy dist and production node_modules into a slim image, run as the node user. The Angular app is built once and served from S3 + CloudFront, not from a container.',
        dependsOn: ['backend-architecture'],
      },
      {
        id: 'aws-compute',
        title: 'Choosing compute: EC2, ECS, EKS and Lambda',
        depth: 'should',
        why: 'Where the code runs decides scaling behaviour, cold starts, cost and how you deploy.',
        learn: [
          'EC2: full control, and you manage the servers',
          'ECS on Fargate: containers without servers; a good default for APIs',
          'EKS: Kubernetes, when you need its ecosystem',
          'Lambda: event-driven and spiky work; cold starts, the 15-minute limit, connection limits',
          'Cost model of each: always-on vs per-request',
        ],
        howDeep: 'Medium. Choose one for a workload and defend it.',
        example:
          'Steady API traffic runs well on ECS Fargate. Spiky, short tasks such as image resizing on S3 upload fit Lambda. A key-value lookup at very high scale with simple access patterns fits DynamoDB.',
        dependsOn: ['containers', 'scaling-strategies'],
      },
      {
        id: 'aws-managed-services',
        title: 'AWS managed services map and cost',
        depth: 'should',
        why: 'Every box in a design should map to a real service, and to a line on the bill.',
        learn: [
          'Storage: S3 (storage classes and lifecycle rules), EBS',
          'Databases: RDS / Aurora, DynamoDB',
          'Caching: ElastiCache',
          'Messaging: SQS, SNS, EventBridge',
          'Edge and load balancing: CloudFront, Route 53, ALB, NLB',
          'Main cost drivers: compute, data transfer, NAT gateway, managed databases',
        ],
        howDeep:
          'Light to medium. Purpose and main limits of each; mention cost when you compare options.',
        example:
          'Lambdas in a VPC pulling large files from S3 through a NAT gateway pay data processing on every byte. A VPC gateway endpoint for S3 removes that cost.',
        dependsOn: ['building-blocks'],
        study: [practice('AWS and cloud questions', 'nodejs-aws-cloud')],
      },
      {
        id: 'aws-networking',
        title: 'VPC networking',
        depth: 'should',
        why: 'Network layout is a security and availability decision.',
        learn: [
          'VPC, public and private subnets across availability zones',
          'Internet gateway and NAT gateway',
          'Security groups vs network ACLs',
          'VPC endpoints for S3 and other AWS services',
        ],
        howDeep: 'Medium. Draw a standard three-tier VPC from memory.',
        example:
          'ALB in public subnets, NestJS tasks in private subnets with outbound access through a NAT gateway, RDS and ElastiCache in isolated subnets that only accept traffic from the app security group.',
        dependsOn: ['ip-tcp-udp', 'aws-managed-services'],
      },
      {
        id: 'kubernetes',
        title: 'Kubernetes fundamentals',
        depth: 'should',
        why: 'Many companies run on Kubernetes, and its concepts appear in interviews even if you use ECS.',
        learn: [
          'Pods, deployments, services, ingress',
          'ConfigMaps and secrets',
          'Liveness and readiness probes',
          'Horizontal Pod Autoscaler',
          'Resource requests and limits',
        ],
        howDeep: 'Light to medium unless your target company uses it.',
        example:
          'A NestJS pod with no memory limit leaks and takes down its node. With requests and limits set, Kubernetes restarts only that pod, and the Horizontal Pod Autoscaler adds replicas when CPU stays above 70%.',
        dependsOn: ['containers'],
      },
      {
        id: 'infrastructure-as-code',
        title: 'Infrastructure as Code',
        depth: 'should',
        why: 'Reproducible infrastructure is what makes disaster recovery and multiple environments possible.',
        learn: [
          'Declarative infrastructure and state',
          'Terraform, AWS CDK or CloudFormation',
          'Environments and modules',
          'GitOps (overview)',
        ],
        howDeep: 'Light to medium. Read and change existing IaC confidently.',
        example:
          'An AWS CDK stack in TypeScript defines the VPC, ECS service, RDS and CloudFront distribution, so staging and production are identical except for sizes.',
        dependsOn: ['aws-networking'],
      },
      {
        id: 'cicd-deployments',
        title: 'CI/CD and deployment strategies',
        depth: 'must',
        why: 'How you release decides how often you can ship and how fast you can undo a bad release.',
        learn: [
          'CI pipeline: lint, test, build, scan, publish',
          'Rolling, blue-green and canary deployments',
          'Feature flags',
          'Rollback strategies',
          'Zero-downtime database migrations (expand and contract)',
        ],
        howDeep: 'Medium to deep. Explain how you would rename a column without downtime.',
        example:
          'Renaming users.name to full_name: add full_name, write to both, backfill, switch reads, deploy, stop writing name, then drop it in a later release. Each step works with both the old and new NestJS versions running during a rolling deploy.',
        dependsOn: ['containers'],
        study: [practice('DevOps questions', 'nodejs-devops')],
      },
      {
        id: 'data-protection',
        title: 'Data protection: encryption, secrets and privacy',
        depth: 'must',
        why: 'Leaked credentials and unencrypted personal data are the failures that make the news.',
        learn: [
          'Encryption in transit and at rest; KMS and envelope encryption',
          'Secrets management (Secrets Manager, Parameter Store) instead of .env files in images',
          'Password hashing with bcrypt or Argon2',
          'Personal data: collect less, mask it in logs, support deletion (GDPR)',
          'Reducing PCI scope by never handling card numbers',
          'Audit logging',
        ],
        howDeep: 'Medium. Add a data protection note to every design you practise.',
        example:
          'Card details go straight from the Angular app to the payment provider’s hosted fields, so the NestJS API stores only a token and stays out of most PCI scope. Database credentials are rotated by Secrets Manager, and email addresses are masked in logs.',
        dependsOn: ['authentication', 'tls-https'],
      },
      {
        id: 'infrastructure-security',
        title: 'Infrastructure security: IAM, network and edge',
        depth: 'should',
        why: 'Assume one component will be compromised; the design decides how far the attacker gets.',
        learn: [
          'IAM roles and least privilege',
          'Network segmentation with subnets and security groups',
          'WAF, DDoS protection (Shield) and rate limiting at the edge',
          'Zero trust: authenticate every call, even inside the network',
          'Service-to-service authentication: IAM, mTLS, signed tokens',
        ],
        howDeep: 'Medium.',
        example:
          'The NestJS task role can read only its own secrets and write only to its own S3 prefix, so a compromised service cannot read another service’s data. AWS WAF in front of CloudFront blocks common attacks and rate-limits login attempts per IP.',
        dependsOn: ['aws-networking', 'web-security', 'authorization'],
      },
      {
        id: 'observability-tooling',
        title: 'Observability tooling and alerting',
        depth: 'should',
        why: 'Knowing the concepts is not enough; you need a working stack and alerts people trust.',
        learn: [
          'OpenTelemetry for traces, metrics and logs',
          'AWS: CloudWatch Logs, metrics and alarms, X-Ray',
          'Open source: Prometheus, Grafana, Loki or ELK / OpenSearch, Jaeger',
          'A dashboard per service',
          'Alert fatigue, and routing each alert to an owner',
        ],
        howDeep: 'Light to medium. Set up one stack end to end once.',
        example:
          'A NestJS service exports traces with the OpenTelemetry SDK to X-Ray or Jaeger, pino logs go to CloudWatch with the trace id on every line, and one alarm pages when the checkout error rate is burning the monthly error budget too fast.',
        dependsOn: ['observability'],
      },
      {
        id: 'incident-response',
        title: 'Incident response and on-call',
        depth: 'should',
        why: 'Senior engineers are expected to lead incidents and learn from them.',
        learn: [
          'Error tracking (Sentry) on frontend and backend',
          'Runbooks and dashboards per service',
          'Blameless postmortems',
          'Mitigate first, then find the root cause',
        ],
        howDeep: 'Light to medium. Prepare one real incident story for behavioral rounds.',
        example:
          'A deploy raises 5xx errors. Roll back first (minutes), then compare traces and logs between versions to find the cause, then write a postmortem with an action item such as a canary step.',
        dependsOn: ['observability', 'cicd-deployments'],
      },
    ],
    exercise: {
      title: 'Ship it on AWS',
      steps: [
        'Set a billing alarm first. A NAT gateway, Multi-AZ RDS and ElastiCache are billed by the hour; use the smallest sizes and delete everything when you finish.',
        'Deploy an Angular + NestJS app: Angular on S3 + CloudFront, NestJS on ECS Fargate behind an ALB in private subnets.',
        'Use RDS PostgreSQL (Multi-AZ) and ElastiCache, with credentials in Secrets Manager.',
        'Add a GitHub Actions pipeline with a rolling or blue-green deploy.',
        'Add structured logs, a request ID, OpenTelemetry traces and one SLO-based alarm.',
      ],
      lookFor: [
        'Only CloudFront and the load balancer are reachable from the internet',
        'No secrets in the image or the repository',
        'A deploy and a rollback that need no manual steps',
        'One request can be followed across logs and traces by its id',
      ],
    },
    readyWhen: [
      'You can map every box in a design to an AWS service and a subnet.',
      'You can release a breaking database change with zero downtime.',
      'You can find which service made a request slow.',
    ],
  },
  {
    id: 'case-studies',
    number: 9,
    title: 'Real-World System Design Case Studies',
    shortTitle: 'Case studies',
    icon: 'ti-building-skyscraper',
    duration: 'Ongoing: 2 designs a week',
    goal: 'Apply everything to full designs under time pressure. Each case study is chosen for the concepts it forces you to use. Do each one out loud in 45 minutes before reading a solution.',
    requires: ['system-design-fundamentals', 'scale-availability', 'microservices-architecture'],
    topics: [
      {
        id: 'cs-url-shortener',
        title: 'URL shortener',
        depth: 'must',
        why: 'The best first design: small scope, read-heavy, and every building block appears.',
        learn: [
          'ID generation and collisions',
          'Read-heavy caching',
          'Redirect codes (301 vs 302) and analytics',
        ],
        howDeep:
          'Do it right after Phase 5, then repeat it after Phase 6 with a caching deep dive.',
        example:
          'NestJS + Redis cache-aside + PostgreSQL or DynamoDB, with CloudFront caching popular redirects at the edge.',
        dependsOn: ['design-framework', 'building-blocks'],
        study: [design('URL shortener', 'url-shortener')],
      },
      {
        id: 'cs-rate-limiter',
        title: 'Distributed rate limiter',
        depth: 'must',
        why: 'Tests algorithms, Redis atomicity and failure handling in one problem.',
        learn: [
          'Token bucket, leaky bucket, fixed window and sliding window',
          'Atomic updates with Lua',
          'Failing open vs failing closed',
          'Where to enforce: edge, gateway or service',
        ],
        howDeep: 'Design and implement a small version.',
        example:
          'A NestJS guard calling a Redis Lua script for a sliding window, failing open if Redis is unreachable for non-sensitive endpoints and closed for login.',
        dependsOn: ['async-load-leveling', 'redis-fundamentals'],
        study: [design('Rate limiter', 'rate-limiter')],
      },
      {
        id: 'cs-search-autocomplete',
        title: 'Search autocomplete',
        depth: 'should',
        why: 'Read-heavy and latency-critical, and a good test of data structure choices.',
        learn: [
          'Tries and prefix indexes',
          'Precomputing top suggestions',
          'Updating rankings without slowing reads',
        ],
        howDeep: 'Medium.',
        example:
          'Top suggestions per prefix are precomputed by a batch job into Redis or OpenSearch and served through a CDN-cached API, with debounced requests from the Angular input.',
        dependsOn: ['search-indexes', 'caching-strategies'],
        study: [design('Search autocomplete', 'search-autocomplete')],
      },
      {
        id: 'cs-ecommerce',
        title: 'E-commerce platform with flash sales',
        depth: 'must',
        why: 'Closest to real full-stack work: catalog, cart, checkout, inventory and payments.',
        learn: [
          'Inventory correctness under concurrency',
          'Checkout saga',
          'Catalog search and caching',
          'Flash-sale load leveling',
        ],
        howDeep: 'Deep. This is your signature design; know every part.',
        example:
          'Angular storefront, NestJS services, PostgreSQL for orders and stock, OpenSearch for search, Redis for carts and hot products, SQS for order processing.',
        dependsOn: ['saga-outbox', 'cache-failure-modes'],
      },
      {
        id: 'cs-payment',
        title: 'Payment system',
        depth: 'must',
        why: 'Correctness over speed: idempotency, reconciliation and audit trails.',
        learn: [
          'Idempotency end to end',
          'Double-entry ledger',
          'Webhooks and reconciliation with the provider',
        ],
        howDeep: 'Deep.',
        example:
          'A ledger table in PostgreSQL with immutable entries, idempotency keys, a webhook consumer that deduplicates provider events, and a nightly reconciliation job.',
        dependsOn: ['idempotency', 'saga-outbox', 'high-availability'],
        study: [design('Payment system', 'payment-system')],
      },
      {
        id: 'cs-notifications',
        title: 'Notification system',
        depth: 'should',
        why: 'Fan-out, retries, user preferences and third-party providers.',
        learn: ['Fan-out per channel', 'Retries and DLQs', 'Rate limits per provider'],
        howDeep: 'Medium.',
        example:
          'SNS fans out to email, SMS and push queues, each with its own worker and provider circuit breaker.',
        dependsOn: ['message-brokers', 'resilience-patterns'],
        study: [design('Notification system', 'notification-system')],
      },
      {
        id: 'cs-chat',
        title: 'Chat system',
        depth: 'should',
        why: 'Stateful connections, ordering and presence at scale.',
        learn: ['WebSocket scaling', 'Message ordering and storage', 'Online presence'],
        howDeep: 'Medium to deep.',
        example:
          'NestJS WebSocket gateways behind an NLB, Redis pub/sub between gateways, messages in a partitioned store keyed by conversation.',
        dependsOn: ['realtime-communication', 'partitioning-sharding'],
        study: [design('Chat system', 'chat-system')],
      },
      {
        id: 'cs-news-feed',
        title: 'News feed',
        depth: 'should',
        why: 'Fan-out on write vs fan-out on read, and the celebrity problem.',
        learn: ['Fan-out strategies', 'Feed caching', 'Ranking (overview)'],
        howDeep: 'Medium.',
        example:
          'Precomputed feeds in Redis lists for normal users, merged at read time with posts from accounts that have millions of followers.',
        dependsOn: ['caching-strategies', 'message-brokers'],
        study: [design('News feed', 'news-feed')],
      },
      {
        id: 'cs-ticket-booking',
        title: 'Ticket booking',
        depth: 'should',
        why: 'Contention on a small set of rows, seat holds and fairness.',
        learn: ['Seat holds with expiry', 'Locking strategies', 'Virtual waiting rooms'],
        howDeep: 'Medium.',
        example:
          'Seat holds in Redis with a TTL, confirmed in PostgreSQL with a unique constraint on (event_id, seat_id), and a queue in front during big on-sales.',
        dependsOn: ['transactions-isolation', 'async-load-leveling', 'distributed-locks'],
        study: [design('Ticket booking', 'ticket-booking')],
      },
      {
        id: 'cs-file-video',
        title: 'File storage and video streaming',
        depth: 'should',
        why: 'Large objects, uploads, processing pipelines and CDNs.',
        learn: [
          'Pre-signed and multipart uploads',
          'Processing pipelines',
          'Adaptive bitrate streaming',
        ],
        howDeep: 'Medium.',
        example:
          'Angular uploads directly to S3 with a pre-signed URL; an S3 event triggers transcoding; CloudFront serves HLS segments.',
        dependsOn: ['http-caching-cdn', 'message-brokers'],
        study: [
          design('File storage', 'file-storage'),
          design('Video streaming', 'video-streaming'),
        ],
      },
      {
        id: 'cs-frontend-dashboard',
        title: 'Frontend system design: real-time dashboard',
        depth: 'should',
        why: 'Full-stack interviews increasingly include a frontend architecture round.',
        learn: [
          'Component and state architecture',
          'Data fetching, caching and real-time updates',
          'Rendering performance with large data sets',
          'Accessibility and error states',
        ],
        howDeep: 'Medium. Use the same framework: requirements, API, data flow, then deep dives.',
        example:
          'Angular with signals for state, SSE for live metrics, virtual scrolling for large tables, and a BFF endpoint that returns exactly what each widget needs.',
        dependsOn: ['realtime-communication', 'api-gateway-bff', 'frontend-architecture'],
        study: [practice('Frontend system design questions', 'frontend-system-design')],
      },
      {
        id: 'cs-ai-assistant',
        title: 'AI chat assistant and RAG',
        depth: 'should',
        why: 'LLM features are part of many products now, and their design questions are showing up in senior interviews.',
        learn: [
          'Streaming responses to the client',
          'Retrieval-augmented generation: chunking, embeddings, vector search',
          'Cost, latency and rate limits of model calls',
          'Guardrails and evaluation',
        ],
        howDeep:
          'Medium. Treat the model as a slow, expensive, unreliable dependency and apply everything from Phase 6.',
        example:
          'Angular streams tokens over SSE from a NestJS endpoint, which retrieves context from a vector index (pgvector or OpenSearch), calls the model with a timeout and a fallback, and records token usage per tenant.',
        dependsOn: ['realtime-communication', 'resilience-patterns', 'search-indexes'],
        study: [
          concept('How RAG works', 'how-rag-works'),
          design('AI chat assistant', 'ai-chat-assistant'),
          design('RAG knowledge base', 'rag-knowledge-base'),
          design('AI agent platform', 'ai-agent-platform'),
        ],
      },
      {
        id: 'cs-ride-sharing',
        title: 'Ride sharing',
        depth: 'advanced',
        why: 'Geospatial indexing, high write rates of location updates and matching.',
        learn: [
          'Geohashing and geospatial indexes',
          'High-frequency writes',
          'Matching under contention',
        ],
        howDeep: 'Light to medium.',
        example:
          'Driver locations in Redis GEO sets updated every few seconds, trips in PostgreSQL, matching as a separate service.',
        dependsOn: ['partitioning-sharding', 'realtime-communication'],
        study: [design('Ride sharing', 'ride-sharing')],
      },
      {
        id: 'cs-distributed-infra',
        title: 'Distributed infrastructure: cache, ID generator, load balancer',
        depth: 'advanced',
        why: 'Designing the building blocks themselves tests distributed systems depth.',
        learn: [
          'Consistent hashing and replication',
          'Time-ordered IDs',
          'Health checking and failover',
        ],
        howDeep: 'Light to medium, after the others.',
        example:
          'A Snowflake-style ID service with worker IDs assigned through a coordination store, and a distributed cache with a consistent hash ring.',
        dependsOn: ['consistent-hashing', 'consensus-coordination'],
        study: [
          design('Distributed cache', 'distributed-cache'),
          design('Unique ID generator', 'unique-id-generator'),
          design('Distributed load balancer', 'load-balancer'),
        ],
      },
    ],
    exercise: {
      title: 'Mock design interviews',
      steps: [
        'Pick a case study and set a 45-minute timer.',
        'Run the framework out loud or with a friend, drawing as you go.',
        'Compare with the PrepHub solution and list what you missed.',
        'Repeat the same problem two weeks later.',
      ],
      lookFor: [
        'Requirements and estimates finished in the first ten minutes',
        'Trade-offs stated out loud without being asked',
        'A failure story for every component',
        'Time left for at least one deep dive',
      ],
    },
    readyWhen: [
      'You can complete any must-know case study in 45 minutes with clear trade-offs.',
      'You can handle "what if this component fails?" for every box you draw.',
      'You have one end-to-end design from your own work you can present in depth.',
    ],
  },
];
