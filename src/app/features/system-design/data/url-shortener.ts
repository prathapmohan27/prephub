import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 1 — URL Shortener
// ─────────────────────────────────────────────────────────────────────────────
export const urlShortener: SystemDesignSystem = {
  id: 'url-shortener',
  title: 'URL Shortener',
  icon: 'ti-link',
  color: '#6366f1',
  bg: '#eef2ff',
  accentGlow: 'rgba(99,102,241,0.15)',
  difficulty: 'Beginner',
  tagline: 'Your journey begins here — master REST APIs, hashing, databases, and basic scaling.',
  tags: ['REST API', 'Hashing', 'SQL/NoSQL', 'Caching', 'Redirects'],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A URL shortening service like bit.ly or TinyURL. Users paste a long URL and get a short alias (e.g., short.ly/xK9pQ). When anyone visits the short URL, they are redirected to the original.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it works like a coat-check counter. You hand over something big (the long URL), get a small ticket back (the short code), and anyone holding the ticket can collect the original. The whole system is just a giant, very fast "ticket → coat" lookup table.',
        },
        {
          type: 'flow',
          title: 'The big picture — two jobs, one lookup table',
          code: `flowchart LR
  U1([User shortens a link]):::client -->|"POST long URL"| S[URL Shortener Service]:::server
  S -->|"save xK9pQ → long URL"| DB[(Lookup table)]:::db
  S -->|"returns short.ly/xK9pQ"| U1
  U2([Visitor clicks short.ly/xK9pQ]):::client -->|"GET /xK9pQ"| S
  DB -.->|"find long URL"| S
  S -->|"302 redirect"| SITE[Original website]:::external`,
          text: 'Job 1 (rare): turn a long URL into a short code and remember it. Job 2 (very frequent, ~100× more): look up a short code and send the visitor on to the original page.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Given a long URL, generate a unique short URL.',
            'When the short URL is accessed, redirect the user to the original long URL.',
            'Users should optionally be able to choose a custom alias.',
            'Short URLs should expire after a configurable TTL (default: 5 years).',
            'Users can optionally track click analytics (how many times the link was visited).',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'High availability — the redirection service must be extremely reliable (99.99% uptime).',
            'Low latency — redirection must happen in <10ms ideally.',
            'Scalability — the system should handle 100M URLs created per day and 10B redirections per day.',
            'Short URLs should be unpredictable (not sequential) to prevent enumeration attacks.',
            'The system should be durable — no URL should be lost.',
          ],
        },
        { type: 'heading2', text: 'Assumptions & Constraints' },
        {
          type: 'bullets',
          items: [
            'Short URL length: 7 characters from [a-zA-Z0-9] gives 62^7 ≈ 3.5 trillion combinations — more than enough.',
            'Read-heavy workload: reads (redirections) outnumber writes (URL creation) by ~100:1.',
            'Writes: ~100M/day = ~1,160 writes/second. Reads: ~10B/day = ~115,000 reads/second.',
            'Storage: average long URL = 200 bytes. 100M/day × 365 × 5 years = ~182.5B URLs, ~36.5 TB of URL data (~7.3 TB per year, before replication).',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Base62 Encoding' },
        {
          type: 'paragraph',
          text: 'Base62 uses 62 characters: [a-z, A-Z, 0-9]. It is used to convert a large number (like a database auto-increment ID or a hash) into a compact alphanumeric string suitable for URLs.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function toBase62(num: number): string {
  let result = '';
  while (num > 0) {
    result = BASE62_CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, 'a'); // Ensure minimum length
}

// Example: 123456789 → "8M0kX"`,
        },
        {
          type: 'flow',
          title: 'From a number to a short code',
          code: `flowchart LR
  A["Unique number<br/>e.g. 123456789"]:::server --> B["Divide by 62 repeatedly,<br/>keep each remainder"]
  B --> C["Map remainders to characters<br/>0→a … 61→9"]
  C --> D["Short code<br/>8M0kX"]:::highlight`,
          text: 'Base62 is just counting with 62 "digits" instead of 10. Bigger base → fewer characters needed for the same number.',
        },
        { type: 'heading2', text: 'Hashing vs. Counter-Based Generation' },
        {
          type: 'bullets',
          items: [
            'Hash-based: Apply MD5/SHA256 to the long URL, take first 7 chars of base62 output. Risk: collisions. You must handle cases where two URLs produce the same hash prefix.',
            'Counter-based: Use a global counter (auto-increment ID in DB). Convert the ID to base62. Simple but requires a single point for ID generation.',
            'Random generation: Generate a random 7-char string. Check DB for collision. Works well but requires collision checking.',
          ],
        },
        { type: 'heading2', text: 'HTTP Redirect Types' },
        {
          type: 'bullets',
          items: [
            '301 (Permanent Redirect): Browser caches the redirect permanently. Future requests go directly to the destination without hitting your server. Bad for analytics — you lose click tracking.',
            '302 (Temporary Redirect): Browser always hits your server first. Every click is tracked. Slightly higher latency but you keep full analytics control.',
            'Best practice: Use 302 if you need analytics. Use 301 only if you want to offload server traffic and do not need tracking.',
          ],
        },
        {
          type: 'flow',
          title: '301 vs 302 — what happens on the second click',
          code: `sequenceDiagram
  participant B as Browser
  participant S as short.ly
  participant D as Destination site
  Note over B,D: 301 Permanent
  B->>S: GET /xK9pQ (1st click)
  S-->>B: 301 → long URL (browser caches it)
  B->>D: GET long URL
  B->>D: 2nd click goes straight here — short.ly never sees it ❌ no analytics
  Note over B,D: 302 Temporary
  B->>S: GET /xK9pQ (every click)
  S-->>B: 302 → long URL (click counted ✅)
  B->>D: GET long URL`,
        },
        { type: 'heading2', text: 'SQL vs. NoSQL for This Use Case' },
        {
          type: 'bullets',
          items: [
            'SQL (e.g., PostgreSQL): ACID guarantees, easy uniqueness constraints, familiar JOIN support. Good for < few billion rows.',
            'NoSQL (e.g., DynamoDB, Cassandra): Better horizontal scalability, fast key-value lookups, eventual consistency is acceptable for redirects. Short URL → Long URL is a pure key-value lookup — NoSQL is a natural fit.',
            'For this system at scale, a NoSQL or wide-column store (Cassandra) is preferable for the redirect store. Keep analytics in a separate data store.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components Overview' },
        {
          type: 'bullets',
          items: [
            'Client: Browser or API consumer creating/following short URLs.',
            'Load Balancer: Distributes traffic across multiple API servers.',
            'API Servers (Write Service): Handles URL creation — validation, uniqueness check, ID generation, DB write.',
            'API Servers (Read/Redirect Service): Accepts short URL, looks up original, sends HTTP redirect.',
            'Cache (Redis): Stores hot short-URL-to-long-URL mappings. Most redirects hit cache, not the database.',
            'Primary Database: Stores the canonical URL mapping table.',
            'Analytics Store: Asynchronously receives click events from the redirect service.',
            'ID Generator Service (optional): Provides unique IDs using techniques like Snowflake or Zookeeper-based counters.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  C([Client / Browser]):::client --> LB[Load Balancer]:::network
  LB --> W[Write Service<br/>create short URLs]:::server
  LB --> R[Redirect Service<br/>follow short URLs]:::server
  W --> IDG[ID Generator]:::server
  W --> DB[(URL Database)]:::db
  R -->|"1. check first"| RC[(Redis Cache)]:::cache
  R -->|"2. only on miss"| DB
  R -.->|"click event, async"| Q[[Message Queue]]:::queue
  Q -.-> AN[(Analytics Store)]:::db`,
          text: 'Writes and reads are split into separate services because reads are ~100× more frequent and must be scaled independently. Dotted lines are asynchronous — they never slow down the user.',
        },
        { type: 'heading2', text: 'Data Flow — URL Creation' },
        {
          type: 'numbered',
          items: [
            'User sends POST /api/shorten with {longUrl, customAlias?, ttl?}',
            'API Server validates the URL (format, length, blocklist check).',
            'If custom alias: check if already taken. If yes, return error.',
            'Generate a unique short code (via ID generator or hash).',
            'Store mapping: {shortCode → longUrl, createdAt, expiry, userId} in the database.',
            'Return the short URL to the user.',
          ],
        },
        {
          type: 'flow',
          title: 'Creating a short URL',
          code: `sequenceDiagram
  actor U as User
  participant W as Write Service
  participant ID as ID Generator
  participant DB as Database
  U->>W: POST /api/shorten { longUrl }
  W->>W: Validate URL (format, blocklist)
  alt custom alias requested
    W->>DB: Is alias taken?
    DB-->>W: free / taken (409 if taken)
  else no alias
    W->>ID: Next unique ID
    ID-->>W: 123456789
    W->>W: Base62 encode → xK9pQ
  end
  W->>DB: INSERT xK9pQ → longUrl
  W-->>U: 201 { shortUrl: short.ly/xK9pQ }`,
        },
        { type: 'heading2', text: 'Data Flow — Redirection' },
        {
          type: 'numbered',
          items: [
            'User visits short.ly/xK9pQ',
            'Redirect Service checks Redis cache for key "xK9pQ".',
            'Cache HIT: Return HTTP 302 redirect to long URL immediately.',
            'Cache MISS: Query database for the mapping. Cache the result with TTL. Return HTTP 302 redirect.',
            'Asynchronously fire a click event to the Analytics Service.',
          ],
        },
        {
          type: 'flow',
          title: 'Following a short URL (cache hit vs miss)',
          code: `sequenceDiagram
  actor V as Visitor
  participant R as Redirect Service
  participant C as Redis Cache
  participant DB as Database
  participant Q as Analytics Queue
  V->>R: GET /xK9pQ
  R->>C: GET xK9pQ
  alt Cache HIT (~99% of requests)
    C-->>R: long URL
  else Cache MISS
    C-->>R: (empty)
    R->>DB: SELECT long_url WHERE short_code = xK9pQ
    DB-->>R: long URL
    R->>C: SET xK9pQ (with TTL)
  end
  R-->>V: 302 Location: long URL
  R--)Q: click event (fire-and-forget)`,
          text: 'The analytics event is sent after the response, so tracking clicks adds zero latency for the visitor.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'API Design' },
        {
          type: 'code',
          lang: 'text',
          code: `POST /api/v1/shorten
Body: { "longUrl": "https://...", "customAlias": "mylink", "ttlDays": 365 }
Response 201: { "shortUrl": "https://short.ly/xK9pQ", "expiresAt": "2027-09-06" }
Response 400: { "error": "Invalid URL" }
Response 409: { "error": "Alias already taken" }

GET /{shortCode}               → HTTP 302 redirect to long URL
GET /api/v1/stats/{shortCode}  → { "clicks": 4821, "countries": {...} }
DELETE /api/v1/urls/{shortCode} → HTTP 204 (auth required)`,
        },
        { type: 'heading2', text: 'Database Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- SQL approach
CREATE TABLE urls (
  short_code   VARCHAR(10)  PRIMARY KEY,
  long_url     TEXT         NOT NULL,
  user_id      UUID,
  created_at   TIMESTAMP    DEFAULT NOW(),
  expires_at   TIMESTAMP,
  click_count  BIGINT       DEFAULT 0
);

CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_expires_at ON urls(expires_at);`,
        },
        { type: 'heading2', text: 'ID Generation — Snowflake-inspired' },
        {
          type: 'paragraph',
          text: 'A distributed ID generator creates globally unique IDs without a central database lock. The ID is composed of: 41 bits timestamp + 10 bits machine ID + 12 bits sequence number. This guarantees uniqueness across distributed servers and is time-sortable.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Mind the length: a full 64-bit Snowflake ID encodes to up to 11 base62 characters, not 7 (62^7 ≈ 3.5 trillion, which is less than 2^42). If you want 7-character codes, use a compact counter instead — e.g. each server leases a range of IDs (1,000,000–1,999,999, …) from a central counter and base62-encodes them. See the Unique ID Generator design for the full comparison.',
        },
        { type: 'heading2', text: 'Cache Design' },
        {
          type: 'bullets',
          items: [
            'Use Redis with the Least Recently Used (LRU) eviction policy.',
            'Key: shortCode → Value: {longUrl, expiresAt}',
            'Set TTL on cache entries to match URL expiry.',
            'Cache size: ~20% of URLs account for 80% of traffic (Pareto principle). Cache the hot 20% and you serve 80% of reads from cache.',
            'Estimated cache size: assume ~1B distinct URLs are read per day. Caching the hottest 20% = ~200M entries × ~300 bytes ≈ ~60 GB — a small Redis cluster (or one large node) is enough.',
          ],
        },
        { type: 'heading2', text: 'Handling Collision (Hash-Based Approach)' },
        {
          type: 'bullets',
          items: [
            'Append a salt or user-specific data to the URL before hashing.',
            'If the generated short code is taken, append +1 to the salt and retry.',
            'Use database unique constraint to ensure atomicity — only one writer wins.',
            'Limit retries to 5; if all fail, fall back to random generation.',
          ],
        },
        {
          type: 'flow',
          title: 'Collision handling loop',
          code: `flowchart TD
  A[Hash long URL + salt]:::server --> B[Take first 7 Base62 chars]
  B --> C{INSERT succeeds?<br/>unique constraint}
  C -->|Yes| D([Return short code]):::highlight
  C -->|No — code taken| E{Retries < 5?}
  E -->|Yes| F[Change salt, e.g. +1] --> A
  E -->|No| G[Fall back to random code]:::external --> C`,
          text: 'The database unique constraint is the real referee: whichever insert lands first wins, so two users can never end up with the same code.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Horizontal Scaling' },
        {
          type: 'paragraph',
          text: 'API servers are stateless — add more instances behind the load balancer as traffic grows. Use consistent hashing or round-robin in the load balancer.',
        },
        { type: 'heading2', text: 'Database Scaling' },
        {
          type: 'bullets',
          items: [
            'Read Replicas: The redirect service does heavy reads. Route all reads to read replicas. Only writes go to the primary.',
            'Sharding: Partition the URL table by short_code. Use consistent hashing to assign short codes to shards. Each shard handles a fraction of the total URL space.',
            'NoSQL Alternative: DynamoDB or Cassandra scale horizontally by design. short_code is the partition key for O(1) lookups.',
          ],
        },
        { type: 'heading2', text: 'Cache Scaling' },
        {
          type: 'bullets',
          items: [
            'Use a Redis Cluster with multiple nodes. Consistent hashing distributes keys across nodes.',
            'Implement cache warming on startup by pre-loading frequently accessed URLs.',
            'Consider a two-tier cache: local in-process cache (e.g., LRU map) on each API server + Redis cluster. Eliminates network round-trip for the hottest URLs.',
          ],
        },
        { type: 'heading2', text: 'URL Expiry Cleanup' },
        {
          type: 'bullets',
          items: [
            'Do NOT delete URLs synchronously on expiry — this is expensive.',
            'Use a background job that runs periodically (every hour) and deletes expired rows in batches.',
            'The redirect service checks expiry on cache hit/miss and returns 410 Gone if expired.',
          ],
        },
        {
          type: 'flow',
          title: 'Scaled-out architecture',
          code: `flowchart TB
  V([Visitors]):::client --> CDN[CDN edge<br/>caches hottest redirects]:::network
  CDN --> LB[Load Balancer]:::network
  LB --> R1[Redirect API 1]:::server
  LB --> R2[Redirect API 2]:::server
  LB --> R3[Redirect API N]:::server
  subgraph Cache["Redis Cluster"]
    C1[(Node 1)]:::cache
    C2[(Node 2)]:::cache
    C3[(Node 3)]:::cache
  end
  R1 & R2 & R3 --> Cache
  subgraph Data["Database"]
    P[(Primary<br/>writes)]:::db
    RR1[(Read replica)]:::db
    RR2[(Read replica)]:::db
  end
  Cache -->|"miss"| RR1 & RR2
  P -. replication .-> RR1 & RR2
  J[Hourly cleanup job]:::queue -. deletes expired rows .-> P`,
          text: 'Each layer absorbs traffic before it reaches the next: CDN → in-memory cache → read replicas. Only writes ever touch the primary database.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'At 100M URLs/day and 99.9% cache hit rate, you only query the database for ~115 requests/second. A single replicated PostgreSQL instance can handle this. Start simple, add complexity only when metrics demand it.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'High Availability' },
        {
          type: 'bullets',
          items: [
            'Deploy across multiple Availability Zones (AZs). If one AZ fails, the others continue serving traffic.',
            'Database: Use a primary + 2 replica setup with automatic failover. Tools: AWS RDS Multi-AZ, PostgreSQL Patroni.',
            'Redis: Use Redis Sentinel or Redis Cluster for automatic failover.',
            'Avoid Single Points of Failure (SPOF): every component must have redundancy.',
          ],
        },
        { type: 'heading2', text: 'Consistency Considerations' },
        {
          type: 'bullets',
          items: [
            'URL creation: Requires strong consistency. A short URL must be unique. Use a single primary for writes.',
            'URL redirection: Eventual consistency is acceptable. A newly created URL may not be in all read replicas instantly, but within a few seconds it will be. The user who just created the URL can be redirected via the primary or via cache warming.',
            'Analytics: Eventual consistency is fine. Click counts being slightly delayed by seconds is acceptable.',
          ],
        },
        { type: 'heading2', text: 'Fault Tolerance Patterns' },
        {
          type: 'bullets',
          items: [
            'Circuit Breaker: If the database is slow, the circuit breaker opens and the redirect service returns cached data (or a graceful error) instead of queueing requests.',
            'Retry with Exponential Backoff: For transient failures (network blip), retry with delays of 100ms, 200ms, 400ms... before giving up.',
            'Graceful Degradation: If analytics service is down, still serve redirects. Lose click data temporarily rather than breaking the core flow.',
          ],
        },
        {
          type: 'flow',
          title: 'What happens when something breaks',
          code: `flowchart TD
  REQ([Redirect request]):::client --> C{Redis up?}
  C -->|Yes| HIT{Key in cache?}
  C -->|No| CB{DB circuit<br/>breaker closed?}
  HIT -->|Yes| OK([302 redirect]):::highlight
  HIT -->|No| CB
  CB -->|Yes| DB[(Read replica)]:::db --> OK
  CB -->|"No — DB struggling"| ERR([Friendly 503,<br/>retry later]):::cache
  OK -.-> AQ{Analytics up?}
  AQ -->|Yes| LOG[Record click]:::queue
  AQ -->|No| DROP[Skip — never block<br/>the redirect]:::external`,
        },
        { type: 'heading2', text: 'Data Durability' },
        {
          type: 'bullets',
          items: [
            'Database: Enable WAL (Write-Ahead Log) for point-in-time recovery.',
            'Automated daily backups with 30-day retention.',
            'Cross-region replication for disaster recovery with RPO < 1 hour.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Latency Targets' },
        {
          type: 'bullets',
          items: [
            'URL Creation (P99): < 200ms',
            'URL Redirection with cache hit (P99): < 10ms',
            'URL Redirection with cache miss (P99): < 50ms',
          ],
        },
        { type: 'heading2', text: 'Bottleneck Analysis' },
        {
          type: 'bullets',
          items: [
            'Database reads at scale: solved by caching (Redis) and read replicas.',
            'ID generation: a single counter is a bottleneck. Solution: use a distributed ID generator (Snowflake) or pre-generate ID ranges per server.',
            'Hash collision checking: at scale, frequent DB reads to check uniqueness slow down writes. Solution: use a Bloom filter in memory to quickly reject definitely-taken aliases without a DB hit.',
          ],
        },
        { type: 'heading2', text: 'Bloom Filter for Collision Detection' },
        {
          type: 'paragraph',
          text: 'A Bloom filter is a probabilistic data structure that answers "Is this short code definitely NOT taken?" with 100% accuracy, or "Probably taken" with a small false-positive rate. Load all existing short codes into the Bloom filter at startup. On new URL creation, check the filter first — if it says "not taken," skip the DB uniqueness check entirely (fast path).',
        },
        {
          type: 'flow',
          title: 'Bloom filter as a fast pre-check',
          code: `flowchart LR
  N[New short code]:::server --> BF{Bloom filter<br/>in memory}
  BF -->|"Definitely NOT taken<br/>(no DB call)"| SAVE([Save it]):::highlight
  BF -->|"Maybe taken"| DB[(Check database)]:::db
  DB -->|Free after all| SAVE
  DB -->|Really taken| RETRY[Generate another code]:::external`,
          text: 'Think of it as a bouncer with a perfect memory for "no": it never wrongly says a code is free, so most checks never reach the database.',
        },
        { type: 'heading2', text: 'Async Analytics' },
        {
          type: 'paragraph',
          text: 'Never process analytics synchronously in the redirect request path. This would add 10–50ms of latency. Instead, publish a click event to a message queue (Kafka or SQS) in a fire-and-forget manner. A separate Analytics Consumer service processes events in batches and updates counters in the analytics store.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Hash-Based vs. Counter-Based Short Code Generation' },
        {
          type: 'bullets',
          items: [
            'Hash-Based: No central dependency, easy to distribute. But: collision handling is complex; the same long URL always produces the same short code (which may or may not be desired).',
            'Counter-Based: Simple, collision-free, predictable. But: requires a central or distributed ID generator; sequential IDs are guessable (security concern — mitigate by adding a random component or keeping IDs non-sequential).',
            'Winner for most cases: counter-based IDs from pre-allocated ranges per server (or a Snowflake-style generator if 11-character codes are acceptable). Predictable, fast, no collision handling needed.',
          ],
        },
        { type: 'heading2', text: '301 vs. 302 Redirect' },
        {
          type: 'bullets',
          items: [
            '301: Fewer server hits, lower infrastructure cost, better perceived performance for repeat visitors. But: lose analytics, cannot change the destination later (browser ignores your server).',
            '302: Full analytics control, can change destination. But: every redirect hits your server.',
            'If analytics is a core product requirement (it usually is for URL shorteners), choose 302.',
          ],
        },
        { type: 'heading2', text: 'SQL vs. NoSQL' },
        {
          type: 'bullets',
          items: [
            'SQL gives ACID guarantees and is easier to query flexibly. Great up to ~1B rows with proper indexing.',
            'NoSQL (Cassandra/DynamoDB) scales to virtually unlimited rows with consistent performance but at the cost of flexible querying and strong consistency.',
            'For a URL shortener: the primary access pattern is a simple key lookup — NoSQL is ideal for the redirect store.',
          ],
        },
        { type: 'heading2', text: 'Custom Alias — Consistency Challenge' },
        {
          type: 'paragraph',
          text: 'Allowing custom aliases means two users might try to claim the same alias simultaneously. You need a uniqueness check + insert to be atomic. In SQL, use a unique constraint and handle the constraint violation error. In NoSQL (like DynamoDB), use conditional writes ("put if not exists"). Without atomicity, two users could both "win" and overwrite each other.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring & Observability' },
        {
          type: 'bullets',
          items: [
            'Key metrics: redirect latency (P50, P95, P99), cache hit ratio, URL creation rate, error rate, database query time.',
            'Tools: Prometheus + Grafana for metrics, Jaeger/Zipkin for distributed tracing, ELK Stack or Datadog for logs.',
            'Alerts: Page on-call if P99 latency > 100ms, error rate > 0.1%, or cache hit ratio drops below 80%.',
          ],
        },
        { type: 'heading2', text: 'Security' },
        {
          type: 'bullets',
          items: [
            'Rate limiting on URL creation: max 100 URLs/min per IP or authenticated user. Prevents abuse/spam.',
            'URL validation: Blocklist known malware/phishing domains. Use a third-party URL reputation API (e.g., Google Safe Browsing).',
            'Authentication: Require login to create URLs (prevents anonymous spam). Use JWT for API auth.',
            'Short code unpredictability: Avoid purely sequential codes. Add randomness so codes cannot be enumerated.',
            'HTTPS only: Redirect over HTTPS. HSTS (HTTP Strict Transport Security) prevents downgrade attacks.',
          ],
        },
        { type: 'heading2', text: 'Deployment' },
        {
          type: 'bullets',
          items: [
            'Containerize services with Docker. Orchestrate with Kubernetes.',
            'Use a CDN (e.g., Cloudflare) in front of the redirect service. CDN edge nodes can handle redirects for the hottest URLs without ever reaching your origin servers.',
            'Blue-green deployments: Deploy new versions alongside old. Switch traffic over gradually. Roll back instantly if errors spike.',
          ],
        },
        { type: 'heading2', text: 'Disaster Recovery' },
        {
          type: 'bullets',
          items: [
            'RTO (Recovery Time Objective): < 1 hour. Time to restore service after failure.',
            'RPO (Recovery Point Objective): < 1 hour. Maximum data loss tolerable.',
            'Automated database backup + cross-region replication achieves these targets.',
            'Run chaos engineering exercises quarterly to validate failover procedures.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How would you generate a unique short code for every URL?',
            'What happens if two users create a URL simultaneously and get the same short code?',
            'How would you handle 301 vs 302 redirects and why does the choice matter?',
            'How would you scale this system to handle 10 billion redirects per day?',
            'How would you implement URL expiration?',
            'How would you track click analytics without slowing down redirects?',
          ],
        },
        { type: 'heading2', text: 'Follow-Up Questions an Interviewer Might Ask' },
        {
          type: 'bullets',
          items: [
            '"What if your Redis cache goes down?" → Graceful fallback to DB with circuit breaker.',
            '"How would you prevent the same long URL from creating thousands of duplicate short URLs?" → Store a longUrl→shortCode reverse mapping, or hash-based generation.',
            '"How would you implement a URL preview feature (instead of direct redirect)?" → Intermediate "preview" page before redirect.',
            '"What if a user wants to delete their URL?" → Soft delete with a deleted_at timestamp. Cache eviction on delete.',
          ],
        },
        { type: 'heading2', text: 'How to Explain Clearly in an Interview' },
        {
          type: 'numbered',
          items: [
            'Start with requirements clarification (5 min) — ask about scale, analytics, custom aliases.',
            'Estimate scale (2 min) — writes/reads per second, storage size.',
            'Propose the simplest possible design first (single server, one DB).',
            'Identify bottlenecks as you scale up: database reads → add cache. Write throughput → add replicas.',
            'Discuss trade-offs explicitly: "I chose 302 over 301 because analytics is a requirement."',
          ],
        },
        {
          type: 'flow',
          title: 'A 45-minute interview, step by step',
          code: `flowchart LR
  A[Clarify requirements<br/>~5 min]:::client --> B[Estimate scale<br/>~2 min]:::client
  B --> C[Simplest design<br/>1 server + 1 DB]:::server
  C --> D[Find the bottleneck<br/>reads? writes?]:::highlight
  D --> E[Fix it<br/>cache, replicas, sharding]:::server
  E -->|repeat| D
  E --> F[Wrap up with<br/>trade-offs]:::db`,
        },
        { type: 'heading2', text: 'Common Mistakes Candidates Make' },
        {
          type: 'bullets',
          items: [
            'Jumping to complex distributed solutions without first establishing requirements.',
            'Ignoring cache — mentioning "just query the database" for 115K reads/second shows lack of production experience.',
            'Forgetting URL expiration and cleanup.',
            'Not discussing collision handling for hash-based generation.',
            'Treating 301 and 302 as interchangeable without knowing the implications.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The URL Shortener is a gateway system design interview topic. Mastering it thoroughly — especially the cache layering, ID generation, and redirect mechanics — builds the foundation for every more complex system in this course.',
        },
      ],
    },
  ],
};
