var K=[{id:`url-shortener`,title:`URL Shortener`,icon:`ti-link`,color:`#6366f1`,bg:`#eef2ff`,accentGlow:`rgba(99,102,241,0.15)`,difficulty:`Beginner`,tagline:`Your journey begins here — master REST APIs, hashing, databases, and basic scaling.`,tags:[`REST API`,`Hashing`,`SQL/NoSQL`,`Caching`,`Redirects`],estimatedTime:`45 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A URL shortening service like bit.ly or TinyURL. Users paste a long URL and get a short alias (e.g., short.ly/xK9pQ). When anyone visits the short URL, they are redirected to the original.`},{type:`callout`,variant:`info`,text:`In simple terms: it works like a coat-check counter. You hand over something big (the long URL), get a small ticket back (the short code), and anyone holding the ticket can collect the original. The whole system is just a giant, very fast "ticket → coat" lookup table.`},{type:`flow`,title:`The big picture — two jobs, one lookup table`,code:`flowchart LR
  U1([User shortens a link]):::client -->|"POST long URL"| S[URL Shortener Service]:::server
  S -->|"save xK9pQ \u2192 long URL"| DB[(Lookup table)]:::db
  S -->|"returns short.ly/xK9pQ"| U1
  U2([Visitor clicks short.ly/xK9pQ]):::client -->|"GET /xK9pQ"| S
  DB -.->|"find long URL"| S
  S -->|"302 redirect"| SITE[Original website]:::external`,text:`Job 1 (rare): turn a long URL into a short code and remember it. Job 2 (very frequent, ~100× more): look up a short code and send the visitor on to the original page.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Given a long URL, generate a unique short URL.`,`When the short URL is accessed, redirect the user to the original long URL.`,`Users should optionally be able to choose a custom alias.`,`Short URLs should expire after a configurable TTL (default: 5 years).`,`Users can optionally track click analytics (how many times the link was visited).`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`High availability — the redirection service must be extremely reliable (99.99% uptime).`,`Low latency — redirection must happen in <10ms ideally.`,`Scalability — the system should handle 100M URLs created per day and 10B redirections per day.`,`Short URLs should be unpredictable (not sequential) to prevent enumeration attacks.`,`The system should be durable — no URL should be lost.`]},{type:`heading2`,text:`Assumptions & Constraints`},{type:`bullets`,items:[`Short URL length: 7 characters from [a-zA-Z0-9] gives 62^7 ≈ 3.5 trillion combinations — more than enough.`,`Read-heavy workload: reads (redirections) outnumber writes (URL creation) by ~100:1.`,`Writes: ~100M/day = ~1,160 writes/second. Reads: ~10B/day = ~115,000 reads/second.`,`Storage: average long URL = 200 bytes. 100M/day × 365 × 5 years = ~182.5B URLs, ~36.5 TB of URL data (~7.3 TB per year, before replication).`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Base62 Encoding`},{type:`paragraph`,text:`Base62 uses 62 characters: [a-z, A-Z, 0-9]. It is used to convert a large number (like a database auto-increment ID or a hash) into a compact alphanumeric string suitable for URLs.`},{type:`code`,lang:`typescript`,code:`const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function toBase62(num: number): string {
  let result = '';
  while (num > 0) {
    result = BASE62_CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, 'a'); // Ensure minimum length
}

// Example: 123456789 \u2192 "8M0kX"`},{type:`flow`,title:`From a number to a short code`,code:`flowchart LR
  A["Unique number<br/>e.g. 123456789"]:::server --> B["Divide by 62 repeatedly,<br/>keep each remainder"]
  B --> C["Map remainders to characters<br/>0\u2192a \u2026 61\u21929"]
  C --> D["Short code<br/>8M0kX"]:::highlight`,text:`Base62 is just counting with 62 "digits" instead of 10. Bigger base → fewer characters needed for the same number.`},{type:`heading2`,text:`Hashing vs. Counter-Based Generation`},{type:`bullets`,items:[`Hash-based: Apply MD5/SHA256 to the long URL, take first 7 chars of base62 output. Risk: collisions. You must handle cases where two URLs produce the same hash prefix.`,`Counter-based: Use a global counter (auto-increment ID in DB). Convert the ID to base62. Simple but requires a single point for ID generation.`,`Random generation: Generate a random 7-char string. Check DB for collision. Works well but requires collision checking.`]},{type:`heading2`,text:`HTTP Redirect Types`},{type:`bullets`,items:[`301 (Permanent Redirect): Browser caches the redirect permanently. Future requests go directly to the destination without hitting your server. Bad for analytics — you lose click tracking.`,`302 (Temporary Redirect): Browser always hits your server first. Every click is tracked. Slightly higher latency but you keep full analytics control.`,`Best practice: Use 302 if you need analytics. Use 301 only if you want to offload server traffic and do not need tracking.`]},{type:`flow`,title:`301 vs 302 — what happens on the second click`,code:`sequenceDiagram
  participant B as Browser
  participant S as short.ly
  participant D as Destination site
  Note over B,D: 301 Permanent
  B->>S: GET /xK9pQ (1st click)
  S-->>B: 301 \u2192 long URL (browser caches it)
  B->>D: GET long URL
  B->>D: 2nd click goes straight here \u2014 short.ly never sees it \u274C no analytics
  Note over B,D: 302 Temporary
  B->>S: GET /xK9pQ (every click)
  S-->>B: 302 \u2192 long URL (click counted \u2705)
  B->>D: GET long URL`},{type:`heading2`,text:`SQL vs. NoSQL for This Use Case`},{type:`bullets`,items:[`SQL (e.g., PostgreSQL): ACID guarantees, easy uniqueness constraints, familiar JOIN support. Good for < few billion rows.`,`NoSQL (e.g., DynamoDB, Cassandra): Better horizontal scalability, fast key-value lookups, eventual consistency is acceptable for redirects. Short URL → Long URL is a pure key-value lookup — NoSQL is a natural fit.`,`For this system at scale, a NoSQL or wide-column store (Cassandra) is preferable for the redirect store. Keep analytics in a separate data store.`]}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components Overview`},{type:`bullets`,items:[`Client: Browser or API consumer creating/following short URLs.`,`Load Balancer: Distributes traffic across multiple API servers.`,`API Servers (Write Service): Handles URL creation — validation, uniqueness check, ID generation, DB write.`,`API Servers (Read/Redirect Service): Accepts short URL, looks up original, sends HTTP redirect.`,`Cache (Redis): Stores hot short-URL-to-long-URL mappings. Most redirects hit cache, not the database.`,`Primary Database: Stores the canonical URL mapping table.`,`Analytics Store: Asynchronously receives click events from the redirect service.`,`ID Generator Service (optional): Provides unique IDs using techniques like Snowflake or Zookeeper-based counters.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  C([Client / Browser]):::client --> LB[Load Balancer]:::network
  LB --> W[Write Service<br/>create short URLs]:::server
  LB --> R[Redirect Service<br/>follow short URLs]:::server
  W --> IDG[ID Generator]:::server
  W --> DB[(URL Database)]:::db
  R -->|"1. check first"| RC[(Redis Cache)]:::cache
  R -->|"2. only on miss"| DB
  R -.->|"click event, async"| Q[[Message Queue]]:::queue
  Q -.-> AN[(Analytics Store)]:::db`,text:`Writes and reads are split into separate services because reads are ~100× more frequent and must be scaled independently. Dotted lines are asynchronous — they never slow down the user.`},{type:`heading2`,text:`Data Flow — URL Creation`},{type:`numbered`,items:[`User sends POST /api/shorten with {longUrl, customAlias?, ttl?}`,`API Server validates the URL (format, length, blocklist check).`,`If custom alias: check if already taken. If yes, return error.`,`Generate a unique short code (via ID generator or hash).`,`Store mapping: {shortCode → longUrl, createdAt, expiry, userId} in the database.`,`Return the short URL to the user.`]},{type:`flow`,title:`Creating a short URL`,code:`sequenceDiagram
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
    W->>W: Base62 encode \u2192 xK9pQ
  end
  W->>DB: INSERT xK9pQ \u2192 longUrl
  W-->>U: 201 { shortUrl: short.ly/xK9pQ }`},{type:`heading2`,text:`Data Flow — Redirection`},{type:`numbered`,items:[`User visits short.ly/xK9pQ`,`Redirect Service checks Redis cache for key "xK9pQ".`,`Cache HIT: Return HTTP 302 redirect to long URL immediately.`,`Cache MISS: Query database for the mapping. Cache the result with TTL. Return HTTP 302 redirect.`,`Asynchronously fire a click event to the Analytics Service.`]},{type:`flow`,title:`Following a short URL (cache hit vs miss)`,code:`sequenceDiagram
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
  R--)Q: click event (fire-and-forget)`,text:`The analytics event is sent after the response, so tracking clicks adds zero latency for the visitor.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`API Design`},{type:`code`,lang:`text`,code:`POST /api/v1/shorten
Body: { "longUrl": "https://...", "customAlias": "mylink", "ttlDays": 365 }
Response 201: { "shortUrl": "https://short.ly/xK9pQ", "expiresAt": "2027-09-06" }
Response 400: { "error": "Invalid URL" }
Response 409: { "error": "Alias already taken" }

GET /{shortCode}               \u2192 HTTP 302 redirect to long URL
GET /api/v1/stats/{shortCode}  \u2192 { "clicks": 4821, "countries": {...} }
DELETE /api/v1/urls/{shortCode} \u2192 HTTP 204 (auth required)`},{type:`heading2`,text:`Database Schema`},{type:`code`,lang:`sql`,code:`-- SQL approach
CREATE TABLE urls (
  short_code   VARCHAR(10)  PRIMARY KEY,
  long_url     TEXT         NOT NULL,
  user_id      UUID,
  created_at   TIMESTAMP    DEFAULT NOW(),
  expires_at   TIMESTAMP,
  click_count  BIGINT       DEFAULT 0
);

CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_expires_at ON urls(expires_at);`},{type:`heading2`,text:`ID Generation — Snowflake-inspired`},{type:`paragraph`,text:`A distributed ID generator creates globally unique IDs without a central database lock. The ID is composed of: 41 bits timestamp + 10 bits machine ID + 12 bits sequence number. This guarantees uniqueness across distributed servers and is time-sortable.`},{type:`callout`,variant:`warning`,text:`Mind the length: a full 64-bit Snowflake ID encodes to up to 11 base62 characters, not 7 (62^7 ≈ 3.5 trillion, which is less than 2^42). If you want 7-character codes, use a compact counter instead — e.g. each server leases a range of IDs (1,000,000–1,999,999, …) from a central counter and base62-encodes them. See the Unique ID Generator design for the full comparison.`},{type:`heading2`,text:`Cache Design`},{type:`bullets`,items:[`Use Redis with the Least Recently Used (LRU) eviction policy.`,`Key: shortCode → Value: {longUrl, expiresAt}`,`Set TTL on cache entries to match URL expiry.`,`Cache size: ~20% of URLs account for 80% of traffic (Pareto principle). Cache the hot 20% and you serve 80% of reads from cache.`,`Estimated cache size: assume ~1B distinct URLs are read per day. Caching the hottest 20% = ~200M entries × ~300 bytes ≈ ~60 GB — a small Redis cluster (or one large node) is enough.`]},{type:`heading2`,text:`Handling Collision (Hash-Based Approach)`},{type:`bullets`,items:[`Append a salt or user-specific data to the URL before hashing.`,`If the generated short code is taken, append +1 to the salt and retry.`,`Use database unique constraint to ensure atomicity — only one writer wins.`,`Limit retries to 5; if all fail, fall back to random generation.`]},{type:`flow`,title:`Collision handling loop`,code:`flowchart TD
  A[Hash long URL + salt]:::server --> B[Take first 7 Base62 chars]
  B --> C{INSERT succeeds?<br/>unique constraint}
  C -->|Yes| D([Return short code]):::highlight
  C -->|No \u2014 code taken| E{Retries < 5?}
  E -->|Yes| F[Change salt, e.g. +1] --> A
  E -->|No| G[Fall back to random code]:::external --> C`,text:`The database unique constraint is the real referee: whichever insert lands first wins, so two users can never end up with the same code.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Horizontal Scaling`},{type:`paragraph`,text:`API servers are stateless — add more instances behind the load balancer as traffic grows. Use consistent hashing or round-robin in the load balancer.`},{type:`heading2`,text:`Database Scaling`},{type:`bullets`,items:[`Read Replicas: The redirect service does heavy reads. Route all reads to read replicas. Only writes go to the primary.`,`Sharding: Partition the URL table by short_code. Use consistent hashing to assign short codes to shards. Each shard handles a fraction of the total URL space.`,`NoSQL Alternative: DynamoDB or Cassandra scale horizontally by design. short_code is the partition key for O(1) lookups.`]},{type:`heading2`,text:`Cache Scaling`},{type:`bullets`,items:[`Use a Redis Cluster with multiple nodes. Consistent hashing distributes keys across nodes.`,`Implement cache warming on startup by pre-loading frequently accessed URLs.`,`Consider a two-tier cache: local in-process cache (e.g., LRU map) on each API server + Redis cluster. Eliminates network round-trip for the hottest URLs.`]},{type:`heading2`,text:`URL Expiry Cleanup`},{type:`bullets`,items:[`Do NOT delete URLs synchronously on expiry — this is expensive.`,`Use a background job that runs periodically (every hour) and deletes expired rows in batches.`,`The redirect service checks expiry on cache hit/miss and returns 410 Gone if expired.`]},{type:`flow`,title:`Scaled-out architecture`,code:`flowchart TB
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
  J[Hourly cleanup job]:::queue -. deletes expired rows .-> P`,text:`Each layer absorbs traffic before it reaches the next: CDN → in-memory cache → read replicas. Only writes ever touch the primary database.`},{type:`callout`,variant:`tip`,text:`At 100M URLs/day and 99.9% cache hit rate, you only query the database for ~115 requests/second. A single replicated PostgreSQL instance can handle this. Start simple, add complexity only when metrics demand it.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`High Availability`},{type:`bullets`,items:[`Deploy across multiple Availability Zones (AZs). If one AZ fails, the others continue serving traffic.`,`Database: Use a primary + 2 replica setup with automatic failover. Tools: AWS RDS Multi-AZ, PostgreSQL Patroni.`,`Redis: Use Redis Sentinel or Redis Cluster for automatic failover.`,`Avoid Single Points of Failure (SPOF): every component must have redundancy.`]},{type:`heading2`,text:`Consistency Considerations`},{type:`bullets`,items:[`URL creation: Requires strong consistency. A short URL must be unique. Use a single primary for writes.`,`URL redirection: Eventual consistency is acceptable. A newly created URL may not be in all read replicas instantly, but within a few seconds it will be. The user who just created the URL can be redirected via the primary or via cache warming.`,`Analytics: Eventual consistency is fine. Click counts being slightly delayed by seconds is acceptable.`]},{type:`heading2`,text:`Fault Tolerance Patterns`},{type:`bullets`,items:[`Circuit Breaker: If the database is slow, the circuit breaker opens and the redirect service returns cached data (or a graceful error) instead of queueing requests.`,`Retry with Exponential Backoff: For transient failures (network blip), retry with delays of 100ms, 200ms, 400ms... before giving up.`,`Graceful Degradation: If analytics service is down, still serve redirects. Lose click data temporarily rather than breaking the core flow.`]},{type:`flow`,title:`What happens when something breaks`,code:`flowchart TD
  REQ([Redirect request]):::client --> C{Redis up?}
  C -->|Yes| HIT{Key in cache?}
  C -->|No| CB{DB circuit<br/>breaker closed?}
  HIT -->|Yes| OK([302 redirect]):::highlight
  HIT -->|No| CB
  CB -->|Yes| DB[(Read replica)]:::db --> OK
  CB -->|"No \u2014 DB struggling"| ERR([Friendly 503,<br/>retry later]):::cache
  OK -.-> AQ{Analytics up?}
  AQ -->|Yes| LOG[Record click]:::queue
  AQ -->|No| DROP[Skip \u2014 never block<br/>the redirect]:::external`},{type:`heading2`,text:`Data Durability`},{type:`bullets`,items:[`Database: Enable WAL (Write-Ahead Log) for point-in-time recovery.`,`Automated daily backups with 30-day retention.`,`Cross-region replication for disaster recovery with RPO < 1 hour.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Latency Targets`},{type:`bullets`,items:[`URL Creation (P99): < 200ms`,`URL Redirection with cache hit (P99): < 10ms`,`URL Redirection with cache miss (P99): < 50ms`]},{type:`heading2`,text:`Bottleneck Analysis`},{type:`bullets`,items:[`Database reads at scale: solved by caching (Redis) and read replicas.`,`ID generation: a single counter is a bottleneck. Solution: use a distributed ID generator (Snowflake) or pre-generate ID ranges per server.`,`Hash collision checking: at scale, frequent DB reads to check uniqueness slow down writes. Solution: use a Bloom filter in memory to quickly reject definitely-taken aliases without a DB hit.`]},{type:`heading2`,text:`Bloom Filter for Collision Detection`},{type:`paragraph`,text:`A Bloom filter is a probabilistic data structure that answers "Is this short code definitely NOT taken?" with 100% accuracy, or "Probably taken" with a small false-positive rate. Load all existing short codes into the Bloom filter at startup. On new URL creation, check the filter first — if it says "not taken," skip the DB uniqueness check entirely (fast path).`},{type:`flow`,title:`Bloom filter as a fast pre-check`,code:`flowchart LR
  N[New short code]:::server --> BF{Bloom filter<br/>in memory}
  BF -->|"Definitely NOT taken<br/>(no DB call)"| SAVE([Save it]):::highlight
  BF -->|"Maybe taken"| DB[(Check database)]:::db
  DB -->|Free after all| SAVE
  DB -->|Really taken| RETRY[Generate another code]:::external`,text:`Think of it as a bouncer with a perfect memory for "no": it never wrongly says a code is free, so most checks never reach the database.`},{type:`heading2`,text:`Async Analytics`},{type:`paragraph`,text:`Never process analytics synchronously in the redirect request path. This would add 10–50ms of latency. Instead, publish a click event to a message queue (Kafka or SQS) in a fire-and-forget manner. A separate Analytics Consumer service processes events in batches and updates counters in the analytics store.`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Hash-Based vs. Counter-Based Short Code Generation`},{type:`bullets`,items:[`Hash-Based: No central dependency, easy to distribute. But: collision handling is complex; the same long URL always produces the same short code (which may or may not be desired).`,`Counter-Based: Simple, collision-free, predictable. But: requires a central or distributed ID generator; sequential IDs are guessable (security concern — mitigate by adding a random component or keeping IDs non-sequential).`,`Winner for most cases: counter-based IDs from pre-allocated ranges per server (or a Snowflake-style generator if 11-character codes are acceptable). Predictable, fast, no collision handling needed.`]},{type:`heading2`,text:`301 vs. 302 Redirect`},{type:`bullets`,items:[`301: Fewer server hits, lower infrastructure cost, better perceived performance for repeat visitors. But: lose analytics, cannot change the destination later (browser ignores your server).`,`302: Full analytics control, can change destination. But: every redirect hits your server.`,`If analytics is a core product requirement (it usually is for URL shorteners), choose 302.`]},{type:`heading2`,text:`SQL vs. NoSQL`},{type:`bullets`,items:[`SQL gives ACID guarantees and is easier to query flexibly. Great up to ~1B rows with proper indexing.`,`NoSQL (Cassandra/DynamoDB) scales to virtually unlimited rows with consistent performance but at the cost of flexible querying and strong consistency.`,`For a URL shortener: the primary access pattern is a simple key lookup — NoSQL is ideal for the redirect store.`]},{type:`heading2`,text:`Custom Alias — Consistency Challenge`},{type:`paragraph`,text:`Allowing custom aliases means two users might try to claim the same alias simultaneously. You need a uniqueness check + insert to be atomic. In SQL, use a unique constraint and handle the constraint violation error. In NoSQL (like DynamoDB), use conditional writes ("put if not exists"). Without atomicity, two users could both "win" and overwrite each other.`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Monitoring & Observability`},{type:`bullets`,items:[`Key metrics: redirect latency (P50, P95, P99), cache hit ratio, URL creation rate, error rate, database query time.`,`Tools: Prometheus + Grafana for metrics, Jaeger/Zipkin for distributed tracing, ELK Stack or Datadog for logs.`,`Alerts: Page on-call if P99 latency > 100ms, error rate > 0.1%, or cache hit ratio drops below 80%.`]},{type:`heading2`,text:`Security`},{type:`bullets`,items:[`Rate limiting on URL creation: max 100 URLs/min per IP or authenticated user. Prevents abuse/spam.`,`URL validation: Blocklist known malware/phishing domains. Use a third-party URL reputation API (e.g., Google Safe Browsing).`,`Authentication: Require login to create URLs (prevents anonymous spam). Use JWT for API auth.`,`Short code unpredictability: Avoid purely sequential codes. Add randomness so codes cannot be enumerated.`,`HTTPS only: Redirect over HTTPS. HSTS (HTTP Strict Transport Security) prevents downgrade attacks.`]},{type:`heading2`,text:`Deployment`},{type:`bullets`,items:[`Containerize services with Docker. Orchestrate with Kubernetes.`,`Use a CDN (e.g., Cloudflare) in front of the redirect service. CDN edge nodes can handle redirects for the hottest URLs without ever reaching your origin servers.`,`Blue-green deployments: Deploy new versions alongside old. Switch traffic over gradually. Roll back instantly if errors spike.`]},{type:`heading2`,text:`Disaster Recovery`},{type:`bullets`,items:[`RTO (Recovery Time Objective): < 1 hour. Time to restore service after failure.`,`RPO (Recovery Point Objective): < 1 hour. Maximum data loss tolerable.`,`Automated database backup + cross-region replication achieves these targets.`,`Run chaos engineering exercises quarterly to validate failover procedures.`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How would you generate a unique short code for every URL?`,`What happens if two users create a URL simultaneously and get the same short code?`,`How would you handle 301 vs 302 redirects and why does the choice matter?`,`How would you scale this system to handle 10 billion redirects per day?`,`How would you implement URL expiration?`,`How would you track click analytics without slowing down redirects?`]},{type:`heading2`,text:`Follow-Up Questions an Interviewer Might Ask`},{type:`bullets`,items:[`"What if your Redis cache goes down?" → Graceful fallback to DB with circuit breaker.`,`"How would you prevent the same long URL from creating thousands of duplicate short URLs?" → Store a longUrl→shortCode reverse mapping, or hash-based generation.`,`"How would you implement a URL preview feature (instead of direct redirect)?" → Intermediate "preview" page before redirect.`,`"What if a user wants to delete their URL?" → Soft delete with a deleted_at timestamp. Cache eviction on delete.`]},{type:`heading2`,text:`How to Explain Clearly in an Interview`},{type:`numbered`,items:[`Start with requirements clarification (5 min) — ask about scale, analytics, custom aliases.`,`Estimate scale (2 min) — writes/reads per second, storage size.`,`Propose the simplest possible design first (single server, one DB).`,`Identify bottlenecks as you scale up: database reads → add cache. Write throughput → add replicas.`,`Discuss trade-offs explicitly: "I chose 302 over 301 because analytics is a requirement."`]},{type:`flow`,title:`A 45-minute interview, step by step`,code:`flowchart LR
  A[Clarify requirements<br/>~5 min]:::client --> B[Estimate scale<br/>~2 min]:::client
  B --> C[Simplest design<br/>1 server + 1 DB]:::server
  C --> D[Find the bottleneck<br/>reads? writes?]:::highlight
  D --> E[Fix it<br/>cache, replicas, sharding]:::server
  E -->|repeat| D
  E --> F[Wrap up with<br/>trade-offs]:::db`},{type:`heading2`,text:`Common Mistakes Candidates Make`},{type:`bullets`,items:[`Jumping to complex distributed solutions without first establishing requirements.`,`Ignoring cache — mentioning "just query the database" for 115K reads/second shows lack of production experience.`,`Forgetting URL expiration and cleanup.`,`Not discussing collision handling for hash-based generation.`,`Treating 301 and 302 as interchangeable without knowing the implications.`]},{type:`callout`,variant:`important`,text:`The URL Shortener is a gateway system design interview topic. Mastering it thoroughly — especially the cache layering, ID generation, and redirect mechanics — builds the foundation for every more complex system in this course.`}]}]},{id:`rate-limiter`,title:`Rate Limiter`,icon:`ti-gauge`,color:`#f59e0b`,bg:`#fef3c7`,accentGlow:`rgba(245,158,11,0.15)`,difficulty:`Beginner`,tagline:`Learn distributed counters, Redis atomicity, and the algorithms that protect every production API.`,tags:[`Redis`,`Token Bucket`,`Sliding Window`,`Lua Scripts`,`Distributed`],estimatedTime:`40 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A rate limiter controls how many requests a client (a user, an IP address, or an API key) can make to a service within a given time window — for example, "100 requests per minute". It protects services from abuse, DDoS attacks (floods of traffic meant to knock a service over), and buggy clients stuck in a retry loop.`},{type:`callout`,variant:`info`,text:`In simple terms: it is a bouncer with a clicker counter at a club door. Every time you walk in, the bouncer clicks. Once you hit your limit for the hour, you are politely turned away ("429 — come back later") until the counter resets. Because the club has many doors (servers), all bouncers must share ONE counter.`},{type:`flow`,title:`The big picture — check, count, then allow or reject`,code:`flowchart LR
  C([Client]):::client -->|"API request"| RL{Rate limiter<br/>under the limit?}:::security
  RL -->|"Yes \u2014 count it"| API[Backend service]:::server
  RL -->|"No"| R429([429 Too Many Requests<br/>+ Retry-After]):::highlight
  RL <-.->|"read + increment counter"| RD[(Shared counter store<br/>Redis)]:::cache
  API -->|"200 OK"| C`,text:`Every request pays a tiny tax (one counter check, under 1ms). Requests over the limit are rejected before they ever reach the backend, so the backend stays protected.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Limit requests per user/IP/API key within a time window.`,`Return HTTP 429 Too Many Requests when limit is exceeded.`,`Include headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.`,`Support multiple rate limiting rules simultaneously (per-user AND per-endpoint).`,`Allow different limits for different API tiers (free: 100/hr, paid: 10,000/hr).`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`Ultra-low latency: < 1ms overhead per request (rate limit check must be near-instant).`,`High availability: rate limiter failure should not block all traffic (fail open vs. fail closed decision).`,`Accuracy: counts must be accurate across distributed servers.`,`Must work across multiple instances of the API server (distributed rate limiting).`]},{type:`heading2`,text:`Why Not Just Do It in the Application?`},{type:`paragraph`,text:`If you have 10 API server instances, each server only sees about 1/10th of a user's traffic. If each server keeps its own counter, a user can make 10× the intended limit before any single server notices. You need a SHARED counter store (usually Redis) that every server reads and writes, so there is one accurate, global count per user.`},{type:`flow`,title:`Per-server counters vs one shared counter`,code:`flowchart TB
  subgraph Local["Each server counts alone \u2014 broken"]
    U1([User sends 300 req]):::client --> S1[Server 1<br/>count 100 \u2705]:::server
    U1 --> S2[Server 2<br/>count 100 \u2705]:::server
    U1 --> S3[Server 3<br/>count 100 \u2705]:::server
  end
  subgraph Shared["All servers share one counter \u2014 correct"]
    U2([User sends 300 req]):::client --> T1[Server 1]:::server
    U2 --> T2[Server 2]:::server
    U2 --> T3[Server 3]:::server
    T1 & T2 & T3 --> R[(Redis<br/>count 300 \u2192 blocked after 100)]:::cache
  end`,text:`With a limit of 100/min and 3 servers, local counters let 300 requests through. A shared counter catches the user at request 101 no matter which server they land on.`}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Algorithm 1: Token Bucket`},{type:`paragraph`,text:`Imagine a bucket that holds tokens. Each request uses up one token. Tokens drip back in at a fixed rate (e.g., 10 tokens/second), but the bucket can never hold more than its maximum capacity. If the bucket is empty when a request arrives, that request is rejected.`},{type:`flow`,title:`Token bucket — one request`,code:`flowchart TD
  REQ([Request arrives]):::client --> RF["Refill: add tokens for time passed<br/>tokens = min(capacity, tokens + rate \xD7 elapsed)"]:::server
  RF --> CHK{At least 1 token?}
  CHK -->|Yes| TAKE[Remove 1 token]:::cache --> OK([Allow]):::highlight
  CHK -->|No| NO([Reject with 429]):::security
  TICK[Refill clock<br/>e.g. 10 tokens per second]:::queue -.-> RF`,text:`A full bucket lets a client burst (spend all saved tokens at once), but over time the average rate can never exceed the refill rate. Refill is calculated lazily on each request — there is no background timer per user.`},{type:`bullets`,items:[`Pros: Allows short bursts (if bucket is full). Smooth average rate over time.`,`Cons: Requires storing last_refill_time and token_count per user.`,`Used by: AWS API Gateway, Stripe API.`]},{type:`heading2`,text:`Algorithm 2: Leaky Bucket`},{type:`paragraph`,text:`Requests enter a queue (the bucket) at any rate, but leave it (are processed) at a fixed, steady rate — like water dripping from a small hole in the bottom of a bucket. If the bucket is already full when a new request arrives, that request is dropped.`},{type:`bullets`,items:[`Pros: Produces a very smooth, steady output rate. No bursts.`,`Cons: Queued requests have added latency. Does not handle sudden legitimate bursts well.`,`Used by: Traffic shaping in networking equipment.`]},{type:`heading2`,text:`Algorithm 3: Fixed Window Counter`},{type:`paragraph`,text:`Divide time into fixed windows (e.g., every minute from :00 to :60). Count requests within the current window. Reset counter at the start of each new window.`},{type:`bullets`,items:[`Pros: Very simple and fast. Easy to implement with Redis INCR + EXPIRE.`,`Cons: "Edge burst" problem. If limit is 100/min, a user can make 100 requests at :59 and 100 more at :01 of the next minute — 200 requests in 2 seconds.`]},{type:`flow`,title:`The fixed-window edge burst`,code:`sequenceDiagram
  participant U as User
  participant RL as Rate limiter (100 per min)
  Note over RL: Window 14:00 \u2014 counter = 0
  U->>RL: 100 requests at 14:00:59
  RL-->>U: all allowed (counter = 100)
  Note over RL: 14:01:00 \u2014 new window, counter resets to 0
  U->>RL: 100 requests at 14:01:01
  RL-->>U: all allowed (counter = 100)
  Note over U,RL: 200 requests in 2 seconds \u2014 double the intended rate`,text:`The counter only knows which calendar minute it is in, not what happened a second ago — so bursts that straddle the boundary slip through.`},{type:`heading2`,text:`Algorithm 4: Sliding Window Log`},{type:`paragraph`,text:`Store a timestamp for every request in a sorted set (a Redis list kept in time order). When a new request arrives, drop timestamps older than the window, then count what is left — those are the requests made in the last [window_size] seconds. If that count is already at the limit, reject.`},{type:`bullets`,items:[`Pros: Perfectly accurate — no edge burst problem.`,`Cons: High memory usage. Storing every request timestamp for every user is expensive at scale.`]},{type:`heading2`,text:`Algorithm 5: Sliding Window Counter (Best of Both)`},{type:`paragraph`,text:`Keep just two fixed-window counters \u2014 the previous minute and the current minute \u2014 and blend them. The idea: if we are 75% of the way through the current minute, then the "last 60 seconds" still overlaps the final 25% of the previous minute, so count 25% of the previous minute's requests plus all of the current minute's.`},{type:`flow`,title:`Sliding window counter — blending two windows`,code:`flowchart LR
  P["Previous minute<br/>80 requests"]:::cache --> W["Weight by overlap<br/>80 \xD7 (1 \u2212 0.75) = 20"]:::server
  C["Current minute<br/>20 requests so far<br/>75% elapsed"]:::cache --> SUM
  W --> SUM["Estimate<br/>20 + 20 = 40"]:::server
  SUM --> D{40 below limit 100?}
  D -->|Yes| OK([Allow + increment current]):::highlight
  D -->|No| NO([Reject 429]):::security`,text:`Two integers per user give you nearly the accuracy of storing every timestamp. The estimate assumes the previous minute's requests were spread evenly — that is the only approximation.`},{type:`code`,lang:`text`,code:`estimated_count = current_window_count + 
                  previous_window_count \xD7 (1 - elapsed_fraction_of_window)

Example: Limit = 100/min
Previous window count: 80
Current window count: 20  
We are 75% through the current window
Estimated = 20 + 80 \xD7 (1 - 0.75) = 20 + 20 = 40  \u2192 Allow (40 < 100)`},{type:`bullets`,items:[`Pros: Very memory efficient (only 2 counters per user). Accurate enough for most use cases.`,`Cons: Slightly approximate (but within ~0.003% error in practice).`,`Recommended: This is the algorithm used by Cloudflare for their global rate limiter.`]}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Where Does the Rate Limiter Live?`},{type:`bullets`,items:[`Client-side: Never. Clients can bypass it trivially.`,`API Gateway: Best for platform-wide rate limiting. The gateway intercepts every request before it reaches any service. Central enforcement, single code change.`,`Application Middleware: Per-service rate limiting with custom rules. More flexible but requires implementation in every service.`,`Dedicated Rate Limit Service: A separate microservice that all API servers call. High availability concern — it becomes a dependency of every service.`]},{type:`heading2`,text:`Architecture Diagram Components`},{type:`bullets`,items:[`Client → API Gateway (Rate Limit Middleware) → Backend Services`,`API Gateway queries Redis for the current count for the client identifier.`,`If under limit: increment counter, forward request.`,`If over limit: return 429 immediately, do not forward.`,`Redis Cluster: Shared counter store for all gateway instances.`,`Rules Store: Database or config service holding rate limit rules per tier/endpoint.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  C([Clients]):::client --> LB[Load Balancer]:::network
  LB --> G1[API Gateway 1<br/>rate-limit middleware]:::security
  LB --> G2[API Gateway 2<br/>rate-limit middleware]:::security
  G1 & G2 -->|"check + increment<br/>(Lua script)"| RC[(Redis Cluster<br/>shared counters)]:::cache
  RS[(Rules Store<br/>limits per tier and endpoint)]:::db -.->|"loaded + cached in memory"| G1 & G2
  G1 & G2 -->|"only if allowed"| B1[Orders Service]:::server
  G1 & G2 -->|"only if allowed"| B2[Search Service]:::server`,text:`Every gateway instance shares the same Redis counters, so the limit is global. Rules change rarely, so gateways cache them locally instead of fetching them on every request.`},{type:`flow`,title:`One request through the limiter`,code:`sequenceDiagram
  actor U as Client
  participant G as API Gateway
  participant R as Redis
  participant S as Backend Service
  U->>G: GET /api/orders (API key abc)
  G->>G: Identify client + look up rule (100 per min)
  G->>R: EVALSHA sliding-window script
  alt under the limit
    R-->>G: allowed, count 41
    G->>S: forward request
    S-->>G: 200 data
    G-->>U: 200 + X-RateLimit-Remaining 59
  else over the limit
    R-->>G: blocked, count 100
    G-->>U: 429 + Retry-After 45
  end`,text:`A rejected request costs only one Redis round-trip and never touches the backend service.`},{type:`heading2`,text:`Client Identification Strategies`},{type:`bullets`,items:[`IP Address: Simple but problematic with NAT (thousands of users sharing one IP).`,`User ID (JWT): Most accurate for authenticated APIs. Users, not IPs, are rate limited.`,`API Key: Useful for B2B APIs where each client gets a unique key.`,`Combination: Rate limit by IP for unauthenticated requests, by User ID once authenticated.`]}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Redis Implementation — Sliding Window Counter`},{type:`code`,lang:`lua`,code:`-- Lua script for atomic sliding window counter in Redis
-- Executed atomically on a single Redis node

local key_current = KEYS[1]   -- e.g., "rate:userId:1234:2026-09-06-14-05"  (current minute)
local key_previous = KEYS[2]  -- e.g., "rate:userId:1234:2026-09-06-14-04"  (previous minute)
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local elapsed_ms = tonumber(ARGV[3])  -- ms elapsed in current window

local current = tonumber(redis.call('GET', key_current) or '0')
local previous = tonumber(redis.call('GET', key_previous) or '0')

local fraction = 1 - (elapsed_ms / window_ms)
local estimated = current + math.floor(previous * fraction)

if estimated >= limit then
    return {0, estimated}  -- {allowed=false, current_count}
end

redis.call('INCR', key_current)
redis.call('PEXPIRE', key_current, window_ms * 2)  -- expire after 2 windows
return {1, estimated + 1}  -- {allowed=true, new_count}`},{type:`heading2`,text:`Why a Lua Script?`},{type:`paragraph`,text:`Redis runs a Lua script atomically — start to finish, with no other command allowed to run in between. That prevents a race condition (a bug caused by two operations interleaving). Without it, two requests could both read the counter at 99 (under the limit of 100), both decide "allowed", and both increment — ending at 101 with both requests let through.`},{type:`flow`,title:`The race condition Lua prevents`,code:`sequenceDiagram
  participant A as Gateway A
  participant R as Redis
  participant B as Gateway B
  Note over A,B: Without Lua \u2014 separate GET then INCR
  A->>R: GET count
  B->>R: GET count
  R-->>A: 99 (under 100, allow)
  R-->>B: 99 (under 100, allow)
  A->>R: INCR \u2192 100
  B->>R: INCR \u2192 101 (limit broken)
  Note over A,B: With Lua \u2014 check and increment as one step
  A->>R: EVALSHA script
  R-->>A: allowed, now 100
  B->>R: EVALSHA script
  R-->>B: blocked, still 100`,text:`The bug is in the gap between "read" and "write". A Lua script removes that gap, because Redis runs it as one uninterruptible step.`},{type:`heading2`,text:`Response Headers`},{type:`code`,lang:`http`,code:`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 750
X-RateLimit-Reset: 1725638400  (Unix timestamp when window resets)
Retry-After: 45               (seconds until next window, only on 429)`},{type:`heading2`,text:`Multi-Level Rate Limiting`},{type:`paragraph`,text:`Production systems enforce multiple simultaneous limits:`},{type:`bullets`,items:[`Per-user, per-minute: 100 requests/minute`,`Per-user, per-day: 10,000 requests/day`,`Per-endpoint, global: /api/v1/heavy-endpoint: 1,000 requests/minute across all users`,`Per-IP (unauthenticated): 20 requests/minute`]},{type:`paragraph`,text:`Check all applicable rules in one round-trip using Redis pipelines (batch multiple GET commands in a single network call).`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Redis Cluster Sharding`},{type:`paragraph`,text:`A single Redis instance can handle ~100K operations/second. For higher throughput, use Redis Cluster which shards keys across multiple nodes using consistent hashing. Rate limit keys are naturally distributed — different users hash to different Redis nodes.`},{type:`heading2`,text:`The Race Condition Problem at Scale`},{type:`paragraph`,text:`Even with Lua scripts (atomic per-node), Redis Cluster does not support multi-key Lua scripts across shards. If you need to check multiple rate limit keys (per-minute AND per-day) that might live on different Redis nodes, you have a challenge.`},{type:`bullets`,items:[`Solution 1: Use hash tags {userId} to force all keys for the same user onto the same shard. Key: "rate:{userId}:1m" and "rate:{userId}:1d" — the {userId} forces them to the same slot.`,`Solution 2: Accept slight inaccuracy — check each limit independently. Approximate counts are acceptable for most use cases.`]},{type:`flow`,title:`Hash tags keep one user's keys on one shard`,code:`flowchart TB
  G[Gateway]:::security --> H{"Hash only the part<br/>inside the braces: userId 1234"}
  H --> N2
  subgraph Cluster["Redis Cluster"]
    N1[(Node 1<br/>other users)]:::cache
    N2[(Node 2<br/>rate:1234:1m<br/>rate:1234:1d)]:::highlight
    N3[(Node 3<br/>other users)]:::cache
  end`,text:`Wrapping the user ID in braces in the key name tells Redis Cluster to hash only that part, so all of a user's counters land on the same node and one Lua script can check them together.`},{type:`heading2`,text:`Local Cache for Hot Paths`},{type:`paragraph`,text:`For extremely high-traffic APIs, even a Redis call (1–2ms) adds up. Add a small in-memory cache on each API server that remembers "definitely blocked" users. Once a user hits their limit, remember that locally for a few seconds and reject their next requests immediately — no Redis call needed.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Fail Open vs. Fail Closed`},{type:`paragraph`,text:`What happens if Redis goes down? This is the most important design decision for a rate limiter.`},{type:`bullets`,items:[`Fail Open: If Redis is unavailable, allow all requests through. Users can exceed their limits temporarily. Safer for the user experience but dangerous during a DDoS when you most need limiting.`,`Fail Closed: If Redis is unavailable, reject all requests with 429. Guarantees protection but may cause a complete service outage even for legitimate users.`,`Recommended: Fail open for normal services (availability > protection). Fail closed for high-security or payment APIs (protection > availability). Always set a timeout on Redis calls (< 10ms) so a slow Redis does not block the request path.`]},{type:`flow`,title:`What happens when Redis is unreachable`,code:`flowchart TD
  R([Request]):::client --> C{Redis answers<br/>within 5\u201310 ms?}
  C -->|Yes| N[Normal check:<br/>allow or 429]:::cache
  C -->|"No \u2014 timeout or down"| T{Which policy<br/>for this API?}
  T -->|"Fail open<br/>(most APIs)"| FO([Allow request<br/>+ log + alert]):::highlight
  T -->|"Fail closed<br/>(login, payments)"| FC([Reject request<br/>protection first]):::security
  FO -.-> LOC[Optional: fall back to rough<br/>per-server local counters]:::server`,text:`The timeout matters as much as the policy: without it, a slow Redis would make every API request slow too.`},{type:`heading2`,text:`Redis High Availability`},{type:`bullets`,items:[`Use Redis Sentinel: automatic failover when the primary node fails.`,`Or use Redis Cluster: built-in sharding and replication.`,`Deploy Redis across multiple AZs for resilience.`,`Redis data is ephemeral (counters expire). Losing a Redis node means losing rate limit counts for that window — slightly inaccurate but not catastrophic. Unlike a URL database, Redis data is not permanent business data.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Target: < 1ms Overhead`},{type:`paragraph`,text:`The rate limiter adds latency to every API request. Keep it minimal:`},{type:`bullets`,items:[`Use Redis pipeline to batch multiple GET/SET commands: ~0.5ms for 3 commands vs. ~1.5ms for 3 separate commands.`,`Local memory cache for "confirmed blocked" users: 0ms (no network).`,`Connection pooling: maintain a warm pool of Redis connections. Avoid connection setup overhead per request.`,`Timeouts: Set a hard 5ms timeout on Redis operations. If exceeded, fail open.`]},{type:`heading2`,text:`Memory Efficiency`},{type:`bullets`,items:[`Sliding window log stores every timestamp — O(requests per user per window) memory. Problematic at scale.`,`Sliding window counter stores only 2 integers per user per window — O(1) memory. Highly efficient.`,`Set short TTLs on all rate limit keys (2× the window size). Expired keys are automatically removed by Redis.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Algorithm Selection Trade-offs`},{type:`bullets`,items:[`Token Bucket: Best for APIs that allow bursts (download endpoints, real-time data feeds). A user can burst 100 requests instantly if they have accumulated tokens.`,`Fixed Window: Simplest to implement, works fine for most APIs. The edge burst problem is usually acceptable in practice.`,`Sliding Window Counter: Best balance of accuracy and efficiency. Recommended for most production use cases.`,`Sliding Window Log: Maximum accuracy but too memory-intensive at scale. Avoid unless you have a strong business reason for per-request accuracy.`]},{type:`flow`,title:`Picking an algorithm`,code:`flowchart TD
  S([What do you need?]):::client --> B{Allow short bursts?}
  B -->|"Yes \u2014 e.g. downloads, feeds"| TB[Token Bucket]:::highlight
  B -->|"No \u2014 need a smooth,<br/>steady output"| LB[Leaky Bucket]:::queue
  B -->|"Just a cap per window"| A{Exact accuracy<br/>worth the memory?}
  A -->|"Yes, low traffic"| SWL[Sliding Window Log]:::db
  A -->|"No \u2014 good enough is fine"| E{Edge bursts acceptable?}
  E -->|Yes| FW[Fixed Window]:::cache
  E -->|No| SWC[Sliding Window Counter<br/>the usual default]:::highlight`},{type:`heading2`,text:`Centralized vs. Distributed Rate Limiting`},{type:`bullets`,items:[`Centralized (single Redis): Simple, perfectly accurate. Bottleneck at very high scale.`,`Distributed (each server has its own counter): Ultra-fast (no network), but inconsistent counts across servers. A user can exceed limits by up to N×limit where N is the number of servers.`,`Hybrid: Use local counters for rough rate limiting. Sync to Redis periodically for accurate enforcement.`]}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Monitoring Rate Limiters`},{type:`bullets`,items:[`Track 429 rate by client: A sudden spike in 429s for a specific user/API key may indicate a bug, not abuse.`,`Track Redis hit rate and latency: If Redis is slow, your API is slow.`,`Alert on sustained high 429 rates: Could indicate a DDoS in progress.`]},{type:`heading2`,text:`Graceful Degradation for Legitimate Users`},{type:`bullets`,items:[`Provide clear error messages with retry-after timing.`,`Implement exponential backoff documentation for SDK users.`,`For enterprise customers, allow burst quotas or grace periods.`,`Consider a request queue for slightly-over-limit requests rather than instant rejection.`]},{type:`heading2`,text:`Security Considerations`},{type:`bullets`,items:[`IP spoofing: Limit by authenticated user ID, not IP, when possible.`,`Rate limit bypassing via distributed requests: Use per-user limits, not per-IP.`,`Never reveal internal rate limit keys or algorithms in error messages.`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`Explain the token bucket algorithm and implement it.`,`What is the difference between fixed window and sliding window rate limiting?`,`How would you implement a distributed rate limiter across 50 API servers?`,`What happens to your rate limiter if Redis goes down?`,`How would you rate limit at the level of an API endpoint, not just a user?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Always mention the distributed nature of the problem — single-server counting is incorrect.`,`Discuss Lua scripts for Redis atomicity — shows production knowledge.`,`Bring up fail-open vs. fail-closed as a deliberate design decision.`,`Mention header standards (X-RateLimit-*) for good API design.`]},{type:`heading2`,text:`Common Mistakes`},{type:`bullets`,items:[`Designing a rate limiter that only works on a single server.`,`Forgetting to discuss what happens when the rate limit store (Redis) fails.`,`Using the sliding window log algorithm without acknowledging its memory cost.`,`Not considering multiple simultaneous rate limit rules.`]},{type:`flow`,title:`How to walk through a rate-limiter interview`,code:`flowchart LR
  A[Clarify<br/>who, what limit, which tiers]:::client --> B[Pick algorithm<br/>+ explain why]:::server
  B --> C[Make it distributed<br/>shared Redis counters]:::cache
  C --> D[Make it atomic<br/>Lua script]:::highlight
  D --> E[Scale it<br/>cluster + hash tags]:::server
  E --> F[Failure plan<br/>fail open vs closed]:::security`},{type:`callout`,variant:`tip`,text:`Rate limiters are often a "depth" question — the interviewer wants to see how deep you can go. Bring up Lua atomicity, Redis Cluster sharding with hash tags, and fail-open/closed decisions to demonstrate production depth.`}]}]},{id:`unique-id-generator`,title:`Unique ID Generator`,icon:`ti-fingerprint`,color:`#0284c7`,bg:`#e0f2fe`,accentGlow:`rgba(2,132,199,0.15)`,difficulty:`Beginner`,tagline:`Mint millions of unique, roughly time-sortable 64-bit IDs per second with no central bottleneck — the Snowflake way.`,tags:[`Snowflake`,`UUID`,`Clock Skew`,`Bit Layout`,`Distributed Systems`],estimatedTime:`40 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A service (or library) that hands out unique identifiers for things like orders, tweets, chat messages and payments. In a single database you get this for free with AUTO_INCREMENT. Once you have hundreds of servers across several data centers writing to many database shards, "just use the next number" stops working — there is no single "next number" anymore.`},{type:`callout`,variant:`info`,text:`In simple terms: it works like the ticket machine at a deli counter, except there are a thousand counters in a hundred shops, and no two customers anywhere may ever get the same ticket. The trick is to print the shop number and the time on every ticket, so each machine can work alone and still never clash with another one.`},{type:`flow`,title:`The big picture — many writers, one rule: never repeat`,code:`flowchart LR
  O[Order service]:::server -->|"next ID?"| G1["ID generator<br/>worker 1"]:::highlight
  M[Chat service]:::server -->|"next ID?"| G2["ID generator<br/>worker 2"]:::highlight
  P[Payment service]:::server -->|"next ID?"| G3["ID generator<br/>worker 3"]:::highlight
  G1 -->|"IDs stamped worker 1"| DB1[(Shard A)]:::db
  G2 -->|"IDs stamped worker 2"| DB2[(Shard B)]:::db
  G3 -->|"IDs stamped worker 3"| DB3[(Shard C)]:::db`,text:`Every generator works independently — no network call to a central counter — yet the IDs never collide because each one embeds a different worker number.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Every ID is unique across all machines, all data centers and all time.`,`IDs are numeric and fit in 64 bits (a BIGINT column, 8 bytes).`,`IDs are roughly sortable by creation time — an ID created a second later is (almost always) bigger.`,`IDs can be generated without a database round-trip on the hot path.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`High throughput — at least 10,000 IDs/second per node, with headroom for bursts.`,`Low latency — generating an ID should take microseconds, not milliseconds.`,`High availability — no single point of failure. If one generator dies, the others keep issuing IDs.`,`Correctness over availability — producing a duplicate is far worse than briefly refusing to produce an ID.`]},{type:`heading2`,text:`Quick Estimation`},{type:`bullets`,items:[`Assume 1 billion new objects per day → 1,000,000,000 / 86,400 ≈ 11,600 IDs/second on average, ~35,000/second at a 3× peak (see Back-of-the-Envelope Estimation in Core Concepts).`,`A Snowflake worker can issue up to 4,096 IDs per millisecond = ~4.1 million per second, so even the peak needs a tiny fraction of one worker. We run several workers for availability, not throughput.`,`Storage: a 64-bit ID is 8 bytes vs 16 bytes for a UUID. Over 10 billion rows that is 80 GB vs 160 GB for the key alone — and every secondary index repeats the primary key.`,`Lifetime: 41 bits of milliseconds = 2^41 ms ≈ 69.7 years from the chosen epoch.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Approach 1: Database Auto-Increment`},{type:`paragraph`,text:`One database with an AUTO_INCREMENT (or SEQUENCE) column. Perfectly unique, perfectly ordered, and dead simple. The problem: every insert in the company must go through that one database — it is both a throughput ceiling and a single point of failure.`},{type:`paragraph`,text:`Multi-master variant: run N databases, each counting with a step of N and a different starting offset. With two servers, server 1 issues 1, 3, 5… and server 2 issues 2, 4, 6…. MySQL supports this with auto_increment_increment and auto_increment_offset.`},{type:`heading2`,text:`Approach 2: UUID v4 and UUID v7`},{type:`bullets`,items:[`UUID v4: 128 bits, 122 of them random. Every server generates them locally with zero coordination. You would need ~2.7 × 10^18 of them before the chance of a single collision reaches 50%.`,`Downsides of v4: 128 bits (does not fit our 64-bit requirement), not sortable, and random keys scatter inserts across a B-tree index (see below).`,`UUID v7 (standardised in RFC 9562, 2024): the first 48 bits are a Unix millisecond timestamp, the rest is mostly random (74 random bits). Still 128 bits, but time-ordered — it fixes the index problem and is a great default when 128 bits is acceptable.`]},{type:`heading2`,text:`Approach 3: Ticket Server (Flickr-Style)`},{type:`paragraph`,text:`A dedicated tiny database whose only job is to hand out numbers. Flickr ran two of them (odd and even, using the step/offset trick) and generated an ID with a single-row REPLACE INTO plus LAST_INSERT_ID(). Simple and numeric, but every ID still costs a network round-trip to the ticket server, and the ticket servers are a bottleneck you have to keep alive.`},{type:`code`,lang:`sql`,code:`-- Flickr-style ticket server (MySQL)
CREATE TABLE tickets64 (
  id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  stub CHAR(1)         NOT NULL UNIQUE
) ENGINE=InnoDB;

-- One row, replaced on every call \u2014 the table never grows
REPLACE INTO tickets64 (stub) VALUES ('a');
SELECT LAST_INSERT_ID();`},{type:`heading2`,text:`Approach 4: Range / Segment Allocation`},{type:`paragraph`,text:`Instead of asking the database for one ID at a time, each app server leases a whole block (for example 1,000 IDs) with a single atomic UPDATE, then hands them out from memory. One DB write now pays for 1,000 IDs. This is how Meituan Leaf "segment mode" works and is a common way to produce the short, compact counters that the URL Shortener base62-encodes.`},{type:`flow`,title:`Leasing a block of IDs`,code:`sequenceDiagram
  participant A as App server A
  participant DB as ID table
  participant B as App server B
  A->>DB: UPDATE max_id = max_id + 1000 (returns 1000)
  Note over A: owns 1\u20131000, serves from memory
  B->>DB: UPDATE max_id = max_id + 1000 (returns 2000)
  Note over B: owns 1001\u20132000
  A->>A: issues 1, 2, 3 \u2026 900
  A-)DB: 90% used \u2014 prefetch next block in background (returns 3000)
  Note over A: switches to 2001\u20133000 with no pause`,text:`The UPDATE is atomic, so two servers can never lease the same block. Prefetching the next block (a "double buffer") hides the database round-trip completely.`},{type:`heading2`,text:`Approach 5: Snowflake`},{type:`paragraph`,text:`Twitter's Snowflake packs three things into one 64-bit integer: the current time in milliseconds, the ID of the machine that made it, and a counter for IDs made in the same millisecond on that machine. Each piece makes collisions impossible along one dimension — time separates IDs made at different moments, worker ID separates machines, and the sequence separates IDs within one millisecond on one machine.`},{type:`flow`,title:`Snowflake 64-bit layout`,code:`flowchart LR
  S["1 bit<br/>sign, always 0"]:::external --- T["41 bits<br/>ms since custom epoch<br/>\u2248 69.7 years"]:::highlight
  T --- W["10 bits<br/>worker ID<br/>0\u20131023"]:::server
  W --- Q["12 bits<br/>sequence<br/>0\u20134095 per ms"]:::cache`,text:`1 + 41 + 10 + 12 = 64. The sign bit stays 0 so the ID is positive in signed BIGINT columns and in languages without unsigned 64-bit integers (Java long).`},{type:`bullets`,items:[`Timestamp: 2^41 = 2,199,023,255,552 ms ≈ 69.7 years. Using a custom epoch (e.g. 2024-01-01) instead of 1970 means those 69 years start when your system launches, lasting until ~2093.`,`Worker ID: 2^10 = 1,024 distinct generators. Twitter originally split this as 5 bits data center + 5 bits machine.`,`Sequence: 2^12 = 4,096 IDs per millisecond per worker = ~4.1 million IDs/second per worker, ~4.2 billion/second across all 1,024 workers.`]},{type:`heading2`,text:`Why Time-Ordered IDs Matter: B-Tree Locality`},{type:`paragraph`,text:`Most databases store the primary key in a B-tree (in MySQL InnoDB the whole table is ordered by it). Time-ordered IDs always land at the right-most leaf page, which stays hot in memory. Random UUID v4 keys land on a random page every time — the database must read cold pages from disk, split full pages, and ends up with half-empty pages and a bigger, slower index.`},{type:`flow`,title:`Random vs time-ordered inserts into a B-tree index`,code:`flowchart TB
  subgraph Random["UUID v4 \u2014 random keys"]
    R1([New rows]):::client --> RP1[Page 3]:::cache
    R1 --> RP2[Page 71]:::cache
    R1 --> RP3[Page 512]:::cache
    RP1 & RP2 & RP3 --> RX["Cold pages read from disk,<br/>page splits everywhere"]:::external
  end
  subgraph Ordered["Snowflake / UUID v7 \u2014 time-ordered keys"]
    O1([New rows]):::client --> OP["Right-most page<br/>always in memory"]:::highlight
    OP --> OX["Sequential appends,<br/>full, compact pages"]:::server
  end`,text:`Teams that switch a large table from UUID v4 to a time-ordered key often see insert throughput improve dramatically and the index shrink, purely because of locality.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Two Deployment Shapes`},{type:`bullets`,items:[`Embedded library (preferred): every application process runs the Snowflake algorithm in-process. Generating an ID is a function call — no network, no extra service to keep alive. Each process needs its own worker ID.`,`Standalone ID service: a small fleet of ID servers behind a load balancer, called over HTTP/gRPC. Useful when many languages must share one implementation, but every ID now costs a network hop (clients usually fetch IDs in batches to soften this).`,`Either way, the only shared state is the worker-ID registry (ZooKeeper, etcd, or static config) — and it is only consulted at startup and for lease renewals, never per ID.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  subgraph Pod1["App instance 1"]
    A1[Order handler]:::server --> L1["Snowflake lib<br/>worker 17"]:::highlight
  end
  subgraph Pod2["App instance 2"]
    A2[Order handler]:::server --> L2["Snowflake lib<br/>worker 18"]:::highlight
  end
  REG[("Worker-ID registry<br/>etcd / ZooKeeper")]:::security -.->|"lease at startup,<br/>renew every few s"| L1 & L2
  NTP[NTP / chrony time source]:::network -.->|"keeps clocks in sync"| L1 & L2
  L1 --> DB[(Sharded database)]:::db
  L2 --> DB
  MON[Monitoring]:::queue -.->|"clock drift, sequence waits"| L1 & L2`,text:`Dotted lines are off the hot path. Generating an ID touches only local memory and the local clock.`},{type:`heading2`,text:`Data Flow — Generating One ID`},{type:`numbered`,items:[`Read the current time in milliseconds.`,`If the clock went backwards compared to the last ID, wait (small jump) or refuse (big jump).`,`If we are still in the same millisecond as the last ID, increment the sequence. If it overflows past 4,095, spin until the next millisecond.`,`If it is a new millisecond, reset the sequence to 0.`,`Shift and OR the three parts together: (time − epoch) << 22 | workerId << 12 | sequence.`]},{type:`flow`,title:`Startup and steady state`,code:`sequenceDiagram
  participant P as App process
  participant R as etcd
  participant C as Local clock
  P->>R: Claim a free worker ID with a 10s lease
  R-->>P: worker 17 (lease 7f3a)
  loop every 3 seconds
    P->>R: keep-alive lease 7f3a
  end
  P->>C: now()
  C-->>P: 1730808866432
  P->>P: build ID from time, worker 17, sequence 0
  Note over P: No network call per ID \u2014 microseconds each`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Snowflake Generator in TypeScript`},{type:`paragraph`,text:`JavaScript numbers are 64-bit floats and can only represent integers exactly up to 2^53 − 1, so we use bigint for every bit operation. This implementation was run on Node 22: 100,000 IDs on one worker, all unique and strictly increasing.`},{type:`code`,lang:`typescript`,code:`// Layout: 1 sign bit (0) | 41-bit ms timestamp | 10-bit worker | 12-bit sequence
const EPOCH = 1704067200000n; // custom epoch: 2024-01-01T00:00:00Z
const WORKER_BITS = 10n;
const SEQUENCE_BITS = 12n;
const MAX_WORKER_ID = (1n << WORKER_BITS) - 1n; // 1023
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n; // 4095
const MAX_TIMESTAMP = (1n << 41n) - 1n; // ~69.7 years of ms
const WORKER_SHIFT = SEQUENCE_BITS; // 12
const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_BITS; // 22
const MAX_BACKWARD_MS = 5n; // tolerate tiny NTP corrections by waiting

export class Snowflake {
  private readonly workerId: bigint;
  private readonly now: () => bigint;
  private lastMs = -1n;
  private sequence = 0n;

  constructor(workerId: number, now: () => bigint = () => BigInt(Date.now())) {
    if (!Number.isInteger(workerId) || workerId < 0 || BigInt(workerId) > MAX_WORKER_ID) {
      throw new RangeError(\`workerId must be 0..\${MAX_WORKER_ID}\`);
    }
    this.workerId = BigInt(workerId);
    this.now = now;
  }

  nextId(): bigint {
    let ms = this.now();

    if (ms < this.lastMs) {
      const drift = this.lastMs - ms;
      if (drift > MAX_BACKWARD_MS) {
        // Never risk a duplicate: refuse and let the caller retry / fail over
        throw new Error(\`Clock moved backwards by \${drift}ms \u2014 refusing to generate IDs\`);
      }
      ms = this.waitUntil(this.lastMs); // small skew: just wait it out
    }

    if (ms === this.lastMs) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // 4096 IDs already issued this millisecond \u2014 spin until the next one
        ms = this.waitUntil(this.lastMs + 1n);
      }
    } else {
      this.sequence = 0n;
    }

    const elapsed = ms - EPOCH;
    if (elapsed < 0n || elapsed > MAX_TIMESTAMP) throw new Error('Timestamp outside 41-bit range');
    this.lastMs = ms;

    return (elapsed << TIMESTAMP_SHIFT) | (this.workerId << WORKER_SHIFT) | this.sequence;
  }

  private waitUntil(targetMs: bigint): bigint {
    let ms = this.now();
    while (ms < targetMs) ms = this.now();
    return ms;
  }
}

export function decode(id: bigint) {
  return {
    createdAt: new Date(Number((id >> TIMESTAMP_SHIFT) + EPOCH)),
    workerId: Number((id >> WORKER_SHIFT) & MAX_WORKER_ID),
    sequence: Number(id & MAX_SEQUENCE),
  };
}`},{type:`heading2`,text:`Testing It`},{type:`code`,lang:`typescript`,code:`// Run with: node --experimental-strip-types snowflake.ts
const gen = new Snowflake(42);
const ids: bigint[] = [];
for (let i = 0; i < 100_000; i++) ids.push(gen.nextId());

const unique = new Set(ids).size === ids.length;
const increasing = ids.every((id, i) => i === 0 || id > ids[i - 1]);
console.log({ unique, increasing, decoded: decode(ids[0]) });
// \u2192 { unique: true, increasing: true,
//     decoded: { createdAt: 2026-11-05T12:14:26.432Z, workerId: 42, sequence: 0 } }

// Send IDs to browsers as strings \u2014 Number(id) would silently lose precision
console.log(JSON.stringify({ id: ids[0].toString() }));
// \u2192 {"id":"376705820370575360"}`},{type:`callout`,variant:`tip`,text:`Inject the clock (the now parameter) so you can unit-test the hard cases: freeze it to force a sequence overflow (ID 4,097 in one millisecond must move to the next millisecond with sequence 0), and move it back 100 ms to check that the generator throws instead of repeating IDs.`},{type:`heading2`,text:`The Generation Algorithm as a Flowchart`},{type:`flow`,title:`nextId() step by step`,code:`flowchart TD
  A([nextId called]):::client --> B[Read clock: now ms]:::server
  B --> C{"Clock earlier<br/>than lastMs?"}
  C -->|"Yes, \u2264 5 ms"| W1[Wait until clock<br/>reaches lastMs]:::cache --> D
  C -->|"Yes, > 5 ms"| X(["Throw \u2014 refuse<br/>rather than duplicate"]):::security
  C -->|No| D{"Same ms<br/>as lastMs?"}
  D -->|"Yes"| E[sequence + 1]:::server --> F{sequence > 4095?}
  F -->|Yes| W2[Spin until next ms,<br/>sequence = 0]:::cache --> G
  F -->|No| G
  D -->|"No \u2014 new ms"| R[sequence = 0]:::server --> G
  G["Combine: time shifted 22 bits,<br/>worker shifted 12 bits, OR sequence"]:::highlight --> H([Return id])`},{type:`heading2`,text:`Worker-ID Assignment`},{type:`paragraph`,text:`The whole scheme rests on one promise: no two live processes ever share a worker ID. Pick a method that keeps that promise even during deploys and crashes.`},{type:`bullets`,items:[`Static config / environment variable: simplest. Fine for a handful of fixed servers, error-prone with autoscaling (two copies of the same config = duplicate IDs).`,`Kubernetes StatefulSet ordinal: pod id-gen-7 uses worker 7. Stable names and at most one pod per ordinal; combine with a region prefix for multi-cluster setups.`,`ZooKeeper ephemeral sequential node or etcd lease: on startup, claim a free worker ID with a TTL lease and keep renewing it. If the process dies, the lease expires and the ID becomes reusable. If the process cannot renew, it must stop generating IDs before the lease expires.`,`Database row with a lease column: the same idea using a table you already have, e.g. UPDATE workers SET owner = ?, expires_at = now() + 30s WHERE id = ? AND expires_at < now().`]},{type:`flow`,title:`Claiming a worker ID with an etcd lease`,code:`sequenceDiagram
  participant P as New process
  participant E as etcd
  P->>E: Grant lease, TTL 10s
  E-->>P: lease 7f3a
  P->>E: Txn: if workers/17 missing, put workers/17 with lease 7f3a
  E-->>P: success \u2014 worker 17 is mine
  loop every 3s
    P->>E: KeepAlive 7f3a
  end
  Note over P,E: Process crashes \u2014 keep-alives stop
  E->>E: 10s later lease expires, workers/17 deleted
  Note over E: worker 17 is free for the next process`,text:`The atomic transaction ("only if the key does not exist") guarantees two processes cannot claim the same worker ID at the same moment.`},{type:`heading2`,text:`Storing and Transporting IDs`},{type:`bullets`,items:[`Database: BIGINT (signed is fine because the sign bit is always 0).`,`JSON APIs: send IDs as strings. JavaScript's Number is exact only up to 2^53 − 1 (9,007,199,254,740,991). A Snowflake ID passes that limit about 25 days after the epoch, so JSON.parse turns 376705820370575361 into 376705820370575360 — a different object! Twitter returns both id and id_str for exactly this reason.`,`In code: bigint in JavaScript/TypeScript, long in Java, int64 in Go.`]}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Horizontal Scaling Is (Almost) Free`},{type:`paragraph`,text:`Workers never talk to each other, so adding a worker adds ~4.1M IDs/second of capacity with zero coordination cost. The real limit is the 10-bit worker space: 1,024 concurrent generators. That is plenty for an ID service, but tight if every pod of every microservice embeds its own generator — which is when you widen the worker field or run a dedicated ID service (see How Scaling Works in Core Concepts for the stateless-scaling pattern).`},{type:`heading2`,text:`Re-Balancing the Bits`},{type:`bullets`,items:[`More machines, fewer IDs each: 13 worker bits (8,192 workers) + 9 sequence bits (512 per ms = 512K/s per worker).`,`Longer lifetime: Sonyflake uses 39 bits of 10 ms units (~174 years), 8 bits of sequence and 16 bits of machine ID — fewer IDs per second per machine, many more machines.`,`Decide the layout on day one: changing it later breaks decoding and can break ordering between old and new IDs.`]},{type:`heading2`,text:`Multi-Region Worker-ID Ranges`},{type:`paragraph`,text:`Each region must draw worker IDs from a range no other region uses, otherwise two regions could hand out the same worker ID. Either reserve leading bits for the region, or assign fixed ranges in config. Each region then runs its own etcd/ZooKeeper for leasing — no cross-region coordination on the hot path or at startup.`},{type:`flow`,title:`Splitting the 10 worker bits across regions`,code:`flowchart TB
  W["10-bit worker ID<br/>= 3-bit region + 7-bit worker"]:::highlight
  W --> US["us-east = region 0<br/>workers 0\u2013127"]:::server
  W --> EU["eu-west = region 1<br/>workers 128\u2013255"]:::server
  W --> AP["ap-south = region 2<br/>workers 256\u2013383"]:::server
  W --> FREE["regions 3\u20137<br/>reserved for growth"]:::external
  US --> E1[(etcd us-east)]:::security
  EU --> E2[(etcd eu-west)]:::security
  AP --> E3[(etcd ap-south)]:::security`,text:`3 region bits = 8 regions × 128 workers each. Regions can generate IDs even when cut off from each other, because their ranges can never overlap.`},{type:`heading2`,text:`Scaling the Alternatives`},{type:`bullets`,items:[`Segment allocation: increase the block size (1,000 → 100,000) so the DB is hit less often. Cost: a crash throws away the unused part of the block, leaving gaps.`,`Ticket server: add servers with step/offset — but each one is still a network hop per ID.`,`UUID: scales infinitely with no coordination at all — its cost is size and (for v4) index locality, not throughput.`]}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Clock Skew and NTP`},{type:`paragraph`,text:`Every server has its own quartz clock that drifts by a few milliseconds per hour. NTP (Network Time Protocol) — usually run via chrony — corrects it. A correction can either slew (speed up or slow down the clock gradually, never going backwards) or step (jump the clock instantly, possibly backwards). For ID generators you want slewing only, plus leap-second smearing so a leap second does not repeat a timestamp.`},{type:`heading2`,text:`When the Clock Moves Backwards`},{type:`paragraph`,text:`If the clock jumps back 20 ms, the generator would revisit timestamps it has already used — and could repeat (timestamp, sequence) pairs it already issued. That is the one bug a Snowflake generator must never have.`},{type:`flow`,title:`Handling a backwards clock`,code:`flowchart TD
  T([Clock reads earlier<br/>than lastMs]):::client --> S{How far back?}
  S -->|"A few ms"| W[Wait until the clock<br/>catches up to lastMs]:::cache --> OK([Continue safely]):::highlight
  S -->|"Larger jump"| P{Policy}
  P -->|"Refuse"| R["Throw + alert<br/>callers retry on another worker"]:::security
  P -->|"Logical clock"| L["Keep using lastMs + 1 as time,<br/>borrowing from the future"]:::server
  L --> OK
  R --> OPS[On-call checks NTP]:::queue`,text:`Refusing is the safe default. A logical clock (keep advancing lastMs and ignore the wall clock until it catches up) keeps serving, at the price of IDs whose timestamps run slightly ahead of real time.`},{type:`bullets`,items:[`Restarts are the sneaky case: a fresh process has lastMs = −1, so it cannot detect that the clock went back while it was down. Mitigate by persisting the last timestamp periodically (or storing it in the lease), and refusing to start until the clock is past it.`,`Holding a worker ID lease for longer than the maximum expected clock jump also helps: a replacement process with the same worker ID only starts after the old one's timestamps are in the past.`]},{type:`heading2`,text:`Sequence Overflow Within a Millisecond`},{type:`paragraph`,text:`If one worker is asked for more than 4,096 IDs in the same millisecond, the 12-bit sequence wraps to 0. Reusing sequence 0 in the same millisecond would duplicate an ID, so the generator spins until the next millisecond. The cost is at most ~1 ms of latency for the unlucky callers — and it is visible in metrics, so you know when a worker is saturated.`},{type:`heading2`,text:`What Ordering Do You Actually Get?`},{type:`bullets`,items:[`On one worker: strictly increasing (as long as the clock never goes backwards).`,`Across workers: only roughly sorted ("k-sorted"). Two IDs made in the same millisecond on different workers are ordered by worker ID, not by which happened first, and a few ms of clock skew between servers can put a later event before an earlier one.`,`If you need exact order inside one entity (messages in one chat), assign a per-conversation sequence number in the database — the Chat System lesson orders messages by a time-based ID, which is fine for display but not a causal guarantee.`]},{type:`flow`,title:`Cross-node ordering is only approximate`,code:`sequenceDiagram
  participant A as Worker 5 (clock 3 ms fast)
  participant B as Worker 9 (clock accurate)
  Note over A,B: Real time 10:00:00.000
  A->>A: Event Y happens first, stamped .003
  Note over A,B: Real time 10:00:00.002
  B->>B: Event X happens later, stamped .002
  Note over A,B: X happened 2 ms after Y but gets the smaller ID`},{type:`heading2`,text:`Failure Modes Summary`},{type:`bullets`,items:[`Generator process dies: callers use another worker; the lease frees its worker ID. No data is lost because there is no state worth keeping beyond lastMs.`,`Registry (etcd/ZooKeeper) down: running workers keep generating IDs; only new processes cannot start. Workers whose lease cannot be renewed must stop before it expires.`,`Duplicate worker ID (misconfiguration): the most dangerous failure — produces real duplicates. Guard with leases plus a unique constraint on the primary key, which turns a silent duplicate into a loud insert error.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Latency Targets`},{type:`bullets`,items:[`Embedded Snowflake: well under 1 µs per ID — a clock read and a few bit operations.`,`Remote ID service: one network round-trip, ~0.5–2 ms inside a data center. Batch requests (ask for 100 IDs at once) to amortise it.`,`Segment allocation: in-memory most of the time; one DB write per block, hidden by prefetching.`,`Database auto-increment / ticket server: one DB round-trip per ID, typically 1–5 ms, and every ID competes for the same row lock.`]},{type:`heading2`,text:`Measured Throughput`},{type:`paragraph`,text:`Running the generator above in a tight loop on a laptop produced 1 million IDs at ~4.1 million IDs/second — which is exactly the 4,096-per-millisecond ceiling. The CPU was not the limit; the 12-bit sequence was. That is the design working as intended: the generator waits instead of overflowing.`},{type:`flow`,title:`Where the time goes per ID`,code:`flowchart LR
  subgraph Embedded["Embedded library"]
    E1[Read clock]:::server --> E2[Bit shifts]:::server --> E3(["~0.2 \xB5s"]):::highlight
  end
  subgraph Remote["Remote ID service"]
    R1[Serialize request]:::client --> R2[Network hop]:::network --> R3[Generate]:::server --> R4[Network hop back]:::network --> R5(["~1 ms"]):::cache
  end
  subgraph Ticket["Ticket server / DB"]
    T1[Network hop]:::network --> T2[Row lock + write]:::db --> T3(["~1\u20135 ms"]):::cache
  end`,text:`The embedded approach is three to four orders of magnitude faster — which is why most large systems generate IDs in-process.`},{type:`heading2`,text:`Index and Storage Performance`},{type:`bullets`,items:[`8-byte keys mean smaller indexes, more keys per page and more of the index in RAM than 16-byte UUIDs.`,`Time-ordered keys insert at the right edge of the B-tree, keeping writes sequential and pages full.`,`Hot-spot caveat: in range-sharded stores (HBase, Bigtable, Spanner), time-ordered keys all land on the newest range and overload one node. Use hash-based sharding on the ID, or prefix the key with a hash/shard number.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Comparing the Approaches`},{type:`bullets`,items:[`DB auto-increment: tiny, perfectly ordered, trivial. But a single point of failure and a throughput ceiling; multi-master step/offset loses global ordering and is painful to resize.`,`UUID v4: zero coordination, never a bottleneck. But 128 bits, unsortable, and hurts B-tree indexes.`,`UUID v7: zero coordination and time-ordered. Still 128 bits — great default when you do not need 64-bit IDs.`,`Ticket server: numeric and simple. But a network hop per ID and a central service to keep alive.`,`Segment allocation: compact, dense numbers with very few DB writes. But gaps after crashes, ordering only within a server, and a DB dependency for new blocks.`,`Snowflake: 64-bit, time-sortable, millions per second, no hot-path coordination. But depends on clocks being sane and worker IDs being unique, and leaks creation time.`]},{type:`flow`,title:`Picking an ID strategy`,code:`flowchart TD
  S([What do you need?]):::client --> A{Single database,<br/>modest scale?}
  A -->|Yes| AI[DB auto-increment]:::db
  A -->|No| B{Must fit in 64 bits?}
  B -->|"No \u2014 128 is fine"| C{Need time ordering?}
  C -->|Yes| V7[UUID v7]:::highlight
  C -->|No| V4[UUID v4]:::external
  B -->|Yes| D{Need short, dense numbers?<br/>e.g. 7-char codes}
  D -->|Yes| SEG[Segment / range allocation]:::server
  D -->|No| SF[Snowflake]:::highlight`},{type:`heading2`,text:`Exposing IDs Publicly`},{type:`bullets`,items:[`Sequential IDs invite enumeration: if your order is /orders/1042, an attacker tries /orders/1041. Always enforce authorization — but also do not make guessing easy.`,`IDs leak business data: auto-increment reveals your total count, and two IDs a day apart reveal daily volume (the "German tank problem"). A Snowflake ID reveals its exact creation time, worker and per-ms sequence.`,`Fix: keep the Snowflake as the internal primary key, and expose a separate opaque public ID (a random token or UUID v4) or an encrypted form of the internal ID. Base62 encoding or Hashids-style obfuscation is cosmetic, not security.`,`For the URL Shortener this is why the short codes should not be purely sequential — and note that base62-encoding a full 64-bit Snowflake takes up to 11 characters, not 7, so 7-char codes usually come from a compact counter or range allocation instead.`]},{type:`heading2`,text:`Coordination vs. Dependence on Clocks`},{type:`paragraph`,text:`Every approach pays for uniqueness somewhere. Auto-increment and ticket servers pay with a central coordinator on every call. Segment allocation pays occasionally (once per block). UUIDs pay with size and probability. Snowflake pays by trusting the local clock and a one-time worker-ID assignment — the cheapest at runtime, but it moves the risk into operations: clock monitoring and worker-ID hygiene.`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Monitoring & Alerting`},{type:`bullets`,items:[`Clock drift: export chrony/NTP offset per host. Alert if any host drifts more than ~10 ms, and page if it exceeds your backwards-tolerance (5 ms in the code above).`,`Backwards clock events: count every "waited for clock" and every refusal. Any refusal is a page.`,`Sequence exhaustion: count how often a worker had to wait for the next millisecond. A steady rise means the worker is saturated — add workers or rebalance traffic before latency suffers.`,`Worker-ID leases: alert on lease renewal failures and on the pool of free worker IDs dropping below ~20%.`,`Duplicate-key errors on insert: should be zero. A non-zero count usually means two processes share a worker ID.`]},{type:`heading2`,text:`Operational Rules`},{type:`bullets`,items:[`Configure chrony to slew, not step, after boot, and use leap-second smearing (e.g. Google/AWS time sources).`,`Never hand-edit the system clock on a generator host.`,`Choose the custom epoch once, store it in shared config, and never change it — changing it reinterprets every existing ID.`,`Document the bit layout next to the code; downstream teams will decode IDs for debugging and sharding.`,`Keep a unique constraint on the ID column as a last line of defence.`]},{type:`heading2`,text:`Security`},{type:`bullets`,items:[`Do not use Snowflake or sequential IDs as secrets (password-reset tokens, invite links). Use a cryptographically random token.`,`Use opaque public IDs where creation time or volume is sensitive.`,`Protect the worker-ID registry: anyone who can write to it can create duplicate workers.`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`Design a distributed unique ID generator.`,`Why not just use the database auto-increment? Why not UUIDs?`,`Walk me through the bit layout of a Snowflake ID and how long it lasts.`,`How are worker IDs assigned, and what happens if two machines get the same one?`,`What happens when the clock moves backwards?`]},{type:`heading2`,text:`Follow-Up Questions an Interviewer Might Ask`},{type:`bullets`,items:[`"What if one node needs more than 4,096 IDs in a millisecond?" → Wait for the next ms; if sustained, add workers or move bits from worker to sequence.`,`"Are the IDs globally sorted?" → Only roughly. Strictly increasing per worker; across workers, skew of a few ms can reorder events.`,`"How do you send these IDs to a browser?" → As strings — JavaScript loses precision above 2^53.`,`"What happens in 2093?" → The 41-bit timestamp runs out ~69.7 years after the custom epoch; plan a migration or a new layout long before.`,`"Can I put these IDs in public URLs?" → They leak creation time and volume; expose an opaque public ID.`,`"How would you run this in three regions?" → Reserve region bits or fixed worker ranges per region, with a local registry in each.`]},{type:`heading2`,text:`How to Present It in 30–40 Minutes`},{type:`numbered`,items:[`Clarify requirements (3–5 min): numeric or string? 64-bit? sortable? IDs per second? Multi-region?`,`Quick estimate (2 min): 1B objects/day ≈ 11.6K/s average — show that throughput is easy and the real problem is coordination.`,`Compare approaches (8–10 min): auto-increment → multi-master → UUID → ticket server → segments → Snowflake, one sentence of pros/cons each.`,`Deep dive on Snowflake (10 min): draw the 1 + 41 + 10 + 12 layout, compute 69 years / 1,024 workers / 4,096 per ms, write nextId().`,`Edge cases (5–8 min): worker-ID assignment, clock going backwards, sequence overflow, ordering guarantees.`,`Wrap up (3 min): monitoring, public IDs, JSON precision.`]},{type:`flow`,title:`A 40-minute interview, step by step`,code:`flowchart LR
  A[Clarify<br/>64-bit? sortable? rate?]:::client --> B[Estimate<br/>~12K IDs/s]:::client
  B --> C[Compare approaches<br/>DB, UUID, ticket, segment]:::server
  C --> D[Snowflake layout<br/>1 + 41 + 10 + 12]:::highlight
  D --> E[Edge cases<br/>clock, overflow, worker IDs]:::security
  E --> F[Production<br/>monitoring, public IDs]:::db`},{type:`heading2`,text:`Common Mistakes Candidates Make`},{type:`bullets`,items:[`Getting the arithmetic wrong — 41 bits of ms is ~69 years, not 139 (that would be 42 bits); 12 bits is 4,096, not 4,095 IDs per ms.`,`Saying "IDs are sorted" without qualifying that it is only per-worker / roughly across workers.`,`Ignoring clocks entirely — the clock-backwards question is almost guaranteed.`,`Hand-waving worker-ID assignment ("each server has an ID") without explaining how duplicates are prevented during deploys.`,`Returning 64-bit IDs as JSON numbers to a JavaScript client.`]},{type:`callout`,variant:`important`,text:`This is a small system with deep edge cases. Interviewers are less interested in the happy path (shift and OR three numbers) than in what you do when the assumptions break: clocks that jump, workers that share an ID, and a millisecond that runs out of sequence numbers.`}]}]},{id:`load-balancer`,title:`Distributed Load Balancer`,icon:`ti-scale`,color:`#06b6d4`,bg:`#cffafe`,accentGlow:`rgba(6,182,212,0.15)`,difficulty:`Intermediate`,tagline:`Design a high-throughput, fault-tolerant Layer 4 and Layer 7 distributed load balancing infrastructure handling 10 million concurrent connections.`,tags:[`L4 vs L7`,`Anycast BGP`,`Consistent Hashing`,`Health Checks`,`Maglev / Envoy`],estimatedTime:`45 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`The Core Challenge`},{type:`paragraph`,text:`A load balancer is a front door for a group of servers. Clients send traffic to one public address — a Virtual IP (VIP), an IP address that is not tied to any single machine. The balancer picks a healthy backend server and forwards the traffic to it. At small scale this can be one reverse-proxy process. At internet scale, the front door itself must also be spread across many machines and locations, or it becomes the bottleneck.`},{type:`callout`,variant:`info`,text:`In simple terms: it is the host at a busy restaurant. Guests all come through one entrance (the VIP), and the host seats each party at a table that is open and has a working waiter (a healthy server). When the restaurant becomes a global chain, you need many entrances and many hosts — and no single host can be allowed to bring the whole place to a halt.`},{type:`flow`,title:`The big picture — one address, many servers`,code:`flowchart LR
  B([Browser]):::client -->|"1. shop.example.com?"| DNS[DNS]:::network
  DNS -->|"2. VIP 203.0.113.10"| B
  B -->|"3. GET /products"| LB{Load Balancer<br/>VIP}:::network
  LB -->|"4. forward"| SB[App Server B]:::server
  LB -.-> SA[App Server A]:::server
  LB -.-x SC[App Server C<br/>failed health check]:::security
  SB -->|"5. product list"| LB
  LB -->|"6. response"| B`,text:`The client only ever knows the VIP. Which server actually answers is the balancer's decision, and unhealthy servers (C) are simply skipped.`},{type:`heading2`,text:`Start With a Small Example`},{type:`numbered`,items:[`A browser requests GET /products from shop.example.com.`,`DNS returns the load balancer VIP. The browser connects to that VIP.`,`The load balancer removes unhealthy servers from its candidate list.`,`It chooses App Server B and forwards the request over the private network.`,`App Server B returns the product list through the load balancer to the browser.`,`If B fails a health check, new requests go to A or C instead. The load balancer is a traffic director, not the application that owns the product data.`]},{type:`callout`,variant:`info`,text:`Keep this distinction in mind. An L4 (Layer 4, transport-level) balancer decides using only connection details — IP addresses and ports — like a mail sorter reading just the envelope. An L7 (Layer 7, application-level) balancer opens the envelope and reads HTTP details such as the path /products, cookies, and headers. The rest of this design explains how to scale both kinds — and how that same single request multiplies into a 10-million-connection problem.`},{type:`flow`,title:`L4 vs L7 — what each one can see`,code:`flowchart TB
  P([Incoming connection]):::client --> L4[L4 balancer<br/>sees: IPs, ports, protocol]:::network
  L4 -->|"hash of connection details"| L7[L7 proxy<br/>sees: URL path, host, headers, cookies]:::server
  L7 -->|"/checkout"| PAY[Payments service]:::server
  L7 -->|"/products"| CAT[Catalog service]:::server
  L7 -->|"/images"| AST[Assets service]:::server`,text:`L4 is fast but blind to content. L7 is slower but smart enough to send different URLs to different services.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Traffic Distribution: Distribute incoming TCP, UDP, and HTTP/HTTPS connections across a dynamic pool of backend application instances.`,`Health Probing & Automatic Failover: Continuously monitor backend health; isolate failing nodes in < 3 seconds with zero manual intervention.`,`Content-Based Routing: Support Layer 7 URL path, host header, and method-based routing rules.`,`TLS Termination & Offloading: Terminate TLS at the edge to offload cryptographic CPU overhead from backend workers.`,`Graceful Connection Draining: Drain connections gracefully during backend deployments without severing active transactions.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`High Availability: 99.999% uptime (less than 5.26 minutes of downtime per year). No single point of failure anywhere in the data path.`,`Ultra-Low Latency: Layer 4 packet forwarding overhead < 1ms; Layer 7 proxy routing overhead < 4ms.`,`Massive Throughput: Scalable to 10M+ concurrent TCP connections and 100+ Gbps bandwidth per cluster.`,`Stateless Scaling: The load balancing tier itself must be horizontally scalable across standard commodity hardware without inter-node synchronization bottlenecks.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Foundational Distributed Networking Concepts`},{type:`bullets`,items:[`Anycast BGP: BGP is the protocol internet routers use to share "how to reach this address". With Anycast, many edge locations all announce the SAME VIP, and internet routing naturally sends each client to a nearby one. This shortens the distance and spreads load around the world.`,`Equal-Cost Multi-Path (ECMP): A network switch that has several equally good next hops (here, several L4 balancers) picks one per connection by hashing its 5-tuple — source IP, destination IP, source port, destination port, and protocol. The same connection always hashes the same way, so all its packets stay on the same path.`,`Consistent Hashing & Maglev: A lookup table that every machine can compute on its own and that always gives the same answer for the same connection. Maglev is Google's version. When a server is added or removed, only a small share of connections move, instead of everyone being reshuffled.`,`eBPF & XDP (eXpress Data Path): eBPF lets you load small, safety-checked programs into the Linux kernel. XDP runs such a program inside the network card driver, so a packet can be forwarded or dropped before the kernel does its normal (expensive) packet bookkeeping. Result: millions more packets per second per server.`,`Direct Server Return (DSR): The request goes through the balancer, but the backend sends the response straight back to the client. Responses are usually much bigger than requests, so this saves a lot of balancer bandwidth — at the cost of the balancer no longer seeing (or modifying) responses.`]}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Two-Tier Load Balancing Architecture`},{type:`paragraph`,text:`At large scale, split the front door into two jobs. L4 handles fast connection distribution; L7 understands HTTP and makes service-level routing decisions. This separation keeps expensive TLS and HTTP work away from the packet-forwarding path.`},{type:`bullets`,items:[`Tier 1 — Anycast Edge & ECMP Switches: Send a client to a nearby location, then spread each connection across the L4 fleet.`,`Tier 2 — Stateless L4 Balancer Fleet (Maglev / Katran): Uses connection metadata to forward packets to an L7 proxy. "Stateless" means it does not need a shared per-connection database with every peer; the same hash leads packets consistently to the same destination.`,`Tier 3 — L7 Proxy Fleet (Envoy / Nginx): Terminates TLS, reads HTTP, applies rate limits, and routes /checkout to Payments while /images goes to Assets.`,`Tier 4 — Application Service Pool: Stateless application workers handling business logic.`,`Health Checking & Service Discovery Daemon: Continuously inspects node health and distributes updated server lists via a lightweight gossip protocol or ZooKeeper/Consul.`]},{type:`flow`,title:`Two-tier load balancing architecture`,code:`flowchart TB
  C([Clients worldwide]):::client -->|"Anycast: nearest PoP"| SW[Edge router / switch<br/>ECMP hashing]:::network
  subgraph L4["L4 fleet \u2014 fast, stateless"]
    A1[L4 node 1<br/>Maglev + XDP]:::network
    A2[L4 node 2<br/>Maglev + XDP]:::network
  end
  SW --> A1 & A2
  subgraph L7["L7 fleet \u2014 smart, HTTP-aware"]
    E1[Envoy 1<br/>TLS + routing]:::security
    E2[Envoy 2<br/>TLS + routing]:::security
  end
  A1 & A2 --> E1 & E2
  E1 & E2 --> PAY[Payments pool]:::server
  E1 & E2 --> CAT[Catalog pool]:::server
  HC[Health checker +<br/>service discovery]:::db -.->|"healthy server lists"| L4 & L7`,text:`Each tier does one job: get close to the user, spread connections cheaply, then do the expensive HTTP work. The health checker keeps every tier's list of "who is alive" up to date.`}]},{id:`worked-example`,title:`Worked Example: Tracing 10 Million Connections`,icon:`ti-route`,blocks:[{type:`heading2`,text:`From One Request to Ten Million, Tier by Tier`},{type:`paragraph`,text:`The requirements above describe each tier in isolation. It is easier to hold onto the design if you trace what actually happens to the full 10 million concurrent connections as they spread out across the fleet, tier by tier, with real numbers.`},{type:`numbered`,items:[`Global demand: 10,000,000 concurrent connections arrive from clients worldwide, all addressed to one Anycast VIP.`,`Anycast edge split: BGP routes each client to its nearest of 60 edge PoPs based on network topology, not a central dispatcher. Assuming roughly even geographic demand, each PoP now sees about 166,000 concurrent connections — small enough for a modest local cluster to absorb.`,`ECMP hand-off inside a PoP: The local switch hashes each connection's 5-tuple and spreads the 166,000 connections across, say, 8 L4 balancer nodes. Each L4 node now handles about 20,000 connections — using no shared state with its 7 siblings.`,`Maglev lookup on the L4 node: For each incoming packet, the node computes hash(5-tuple) % M against its local Maglev table and gets back one of, say, 4 local L7 proxies — instantly and without asking any other machine.`,`L7 proxy load: Each of those 4 Envoy proxies ends up holding roughly 5,000 concurrent connections. This is comfortably inside a single 16-core proxy's capacity, leaving headroom for TLS termination and HTTP parsing.`,`Backend fan-out: The L7 proxy reads the HTTP path and sends /checkout requests to the Payments pool and /products requests to the Catalog pool — so within those 5,000 connections, only the relevant slice ever reaches any one backend service.`]},{type:`flow`,title:`10 million connections, divided tier by tier`,code:`flowchart TD
  G([10,000,000 connections<br/>to one Anycast VIP]):::client -->|"BGP: split across 60 PoPs"| P[~166,000 per PoP]:::network
  P -->|"ECMP: split across 8 L4 nodes"| L4[~20,000 per L4 node]:::network
  L4 -->|"Maglev: split across 4 L7 proxies"| L7[~5,000 per Envoy proxy]:::security
  L7 -->|"route by URL path"| B1[Payments pool<br/>only /checkout]:::server
  L7 -->|"route by URL path"| B2[Catalog pool<br/>only /products]:::server`,text:`Each arrow is one cheap, local decision. Multiply them together and a huge number becomes a comfortable load per machine.`},{type:`callout`,variant:`tip`,text:`Notice that no single number in this chain is large. The system's scale comes from repeating a small, cheap decision (one hash lookup) at every tier, in parallel, across thousands of independent nodes — not from any one component being individually massive.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`1. eBPF / XDP Packet Processing Engine`},{type:`paragraph`,text:`In normal Linux networking, every arriving packet gets wrapped in a kernel bookkeeping structure (an sk_buff) and walks up the full network stack. That overhead caps a server at roughly one to two million packets per second. An eBPF program attached at the XDP (eXpress Data Path) hook runs inside the network card driver itself, before any of that work happens. It looks at the packet, decides where it goes, and sends it back out in place — reaching roughly 10× more packets per second per server.`},{type:`flow`,title:`Normal kernel path vs XDP fast path`,code:`flowchart LR
  NIC[Network card<br/>receives packet]:::network --> X{XDP program<br/>in the driver}:::highlight
  X -->|"XDP_TX: rewrite + send out<br/>(fast path)"| OUT([Forwarded to L7 proxy]):::server
  X -->|"XDP_DROP: attack traffic"| DROP([Dropped instantly]):::security
  X -->|"XDP_PASS: not for us"| SKB[Allocate sk_buff]:::db
  SKB --> STK[Full kernel network stack<br/>slow path]:::db --> APP[User-space app]:::server`,text:`The fast path skips memory allocation and the whole kernel stack. That is why XDP is also a great first line of DDoS defence — bad packets die at the driver.`},{type:`heading2`,text:`2. The Maglev Consistent Hashing Table`},{type:`paragraph`,text:`L4 nodes need to agree on where each connection goes — without constantly talking to each other or sharing a connection database. Maglev solves this with a lookup table that every node builds independently and identically. The table has M slots (M is a prime number, e.g. 65,537). Each backend gets its own pseudo-random "preference order" of slots, and backends take turns claiming their next preferred free slot until the table is full — so each backend owns roughly the same number of slots. When a packet arrives, hash(5-tuple) % M picks a slot, and the slot names the backend. No inter-server communication is needed — this is exactly the lookup traced in step 4 of the worked example above.`},{type:`flow`,title:`Maglev — building the table, then using it`,code:`flowchart TD
  subgraph Build["Build \u2014 same result on every L4 node"]
    BL[Backend list from<br/>service discovery]:::db --> PERM[Each backend gets a<br/>pseudo-random slot order]:::server
    PERM --> FILL[Backends take turns claiming<br/>their next free slot]:::server
    FILL --> T[(Lookup table<br/>M = 65,537 slots)]:::cache
  end
  subgraph Use["Use \u2014 per packet"]
    PK([Packet arrives]):::client --> H["hash(5-tuple) % M"]:::network
    H --> T
    T --> BE([Send to backend in that slot]):::highlight
  end`,text:`Because every node runs the same algorithm on the same backend list, they all build the same table — agreement without coordination. Removing one backend only reassigns that backend's slots.`},{type:`heading2`,text:`3. Direct Server Return (DSR) Implementation`},{type:`paragraph`,text:`In DSR, the load balancer changes only the packet's destination MAC address (the hardware address of the next machine on the local network) to the chosen backend. The destination IP stays the VIP. Each backend also has the VIP configured on a dummy loopback interface, so it accepts packets addressed to the VIP. When the backend replies, the kernel uses the VIP as the source IP and sends the response straight to the gateway router — the load balancer never sees it. To the client, the reply looks like it came from the VIP.`},{type:`flow`,title:`Direct Server Return — request in, response around`,code:`sequenceDiagram
  actor C as Client
  participant LB as L4 Balancer
  participant B as Backend (VIP on loopback)
  participant R as Gateway Router
  C->>LB: Request to VIP (small)
  LB->>B: Same packet, only MAC rewritten
  Note over B: Accepts it - the VIP is on its loopback
  B->>R: Response, source IP = VIP (large)
  R->>C: Response delivered
  Note over LB: Never touches the response bytes`,text:`Requests are small and responses are large (think video). Letting responses skip the balancer frees most of its bandwidth.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Handling 10 Million Concurrent Connections`},{type:`bullets`,items:[`Horizontally Scaling L4: Because L4 nodes use stateless Maglev hashing, adding a 10th or 20th L4 server to the ECMP switch requires zero state migration. The fleet scales linearly with hardware.`,`Epoll & Event-Driven L7: Each Envoy proxy process uses non-blocking asynchronous epoll/kqueue event loops. A single 16-core Envoy instance can maintain around 200,000 concurrent idle keep-alive TCP connections using roughly 2 GB of RAM.`,`Anycast Geo-Distribution: Announcing the VIP from 60 global edge PoPs splits the 10 million global connections into roughly 166,000 connections per PoP — the same split traced step by step in the worked example above.`]}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Zero Single Points of Failure`},{type:`bullets`,items:[`L4 Node Failure: If an L4 balancer server burns out, the hardware switch detects BGP session loss in < 500ms and redirects ECMP routes to surviving L4 nodes. Maglev hashing guarantees that surviving nodes map established flows to the exact same L7 proxies.`,`L7 Proxy Failure: If an Envoy proxy crashes, L4 health checkers detect the TCP reset and remove it from the Maglev backend list. Connections are re-established to peer Envoy nodes.`,`Backend Server Crash: For idempotent requests (GET, HEAD), the L7 proxy detects socket closure and transparently replays the request to an alternate healthy server without returning an error to the end user.`,`Active-Passive VRRP Failover (for smaller on-premise clusters): When Anycast/BGP is unavailable, two balancers share one VIP using Keepalived and VRRP (Virtual Router Redundancy Protocol). The active one sends regular heartbeats. If the backup misses 3 heartbeats in a row, it takes over the VIP and broadcasts a Gratuitous ARP — a "this IP now lives at my MAC address" announcement — so the local network starts sending traffic to it.`]},{type:`flow`,title:`Which tier failed, and who notices`,code:`flowchart TD
  F([Something fails]):::client --> W{Which tier?}
  W -->|"L4 node"| L4[Switch loses its BGP session<br/>in under 500 ms]:::network
  L4 --> L4R[ECMP stops sending to it.<br/>Maglev keeps flows on same L7]:::highlight
  W -->|"L7 proxy"| L7[L4 health check sees<br/>TCP resets]:::security
  L7 --> L7R[Removed from Maglev table.<br/>Clients reconnect to peers]:::highlight
  W -->|"Backend server"| BE[L7 proxy sees<br/>socket closed]:::server
  BE --> I{Request idempotent?<br/>GET or HEAD}
  I -->|Yes| RT[Retry on another server \u2014<br/>user sees no error]:::highlight
  I -->|No| ER[Return error \u2014<br/>replaying could double-charge]:::security`,text:`Every tier is watched by the tier in front of it. Only safe-to-repeat requests are retried automatically.`},{type:`flow`,title:`Health checks with hysteresis`,code:`stateDiagram-v2
  [*] --> Healthy
  Healthy --> Suspect: 1 failed probe
  Suspect --> Healthy: probe OK
  Suspect --> Unhealthy: 3 failures in a row
  Unhealthy --> Recovering: 1 probe OK
  Recovering --> Unhealthy: probe fails
  Recovering --> Healthy: 3 successes in a row`,text:`Hysteresis means requiring several results in a row before changing state. It stops a server that is briefly slow from "flapping" in and out of rotation.`}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Sub-Millisecond Routing Optimizations`},{type:`bullets`,items:[`Direct Server Return (DSR): Offloads the majority of network bandwidth from the load balancer tier, preventing return-traffic network interface saturation.`,`TLS Session Ticket Resumption: Caches TLS session tickets in a distributed Redis cluster. Returning clients resume encrypted sessions in 0-RTT without a full cryptographic handshake.`,`HTTP/2 Multiplexing to Backends: L7 proxies maintain persistent connection pools to backend servers, multiplexing hundreds of client requests over a few long-lived TCP sockets to eliminate handshake latency.`,`Zero-Copy Socket Transfers: Using the splice() and sendfile() Linux system calls moves data directly between socket buffers without copying bytes into userspace memory.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Critical Architectural Decisions`},{type:`bullets`,items:[`Layer 4 vs. Layer 7: L4 delivers substantially higher packet throughput and lower latency, but cannot inspect HTTP paths or cookies. L7 enables intelligent routing and SSL offloading, but requires significantly more CPU and memory per connection.`,`Direct Server Return (DSR) vs. Full Proxy: DSR can multiply outbound throughput several times over, but prevents the load balancer from inspecting, caching, or compressing outbound HTTP responses.`,`Hardware Appliances (F5 / NetScaler) vs. Software Balancers (Envoy / Katran): Hardware appliances offer dedicated ASIC speed, but are expensive and lack programmatic API agility. Software balancers running on commodity Linux servers scale horizontally at cloud economics.`,`Least Connections vs. Consistent Hashing: Least Connections balances server CPU load evenly. Consistent Hashing routes the same user to the same node (maximizing cache hit ratios), but risks hotspots if a few users generate massive traffic.`]},{type:`flow`,title:`Choosing L4, L7, or both`,code:`flowchart TD
  Q([What does the traffic need?]):::client --> H{Route by URL, header,<br/>or cookie?}
  H -->|No| T{Raw TCP or UDP,<br/>very high volume?}
  T -->|Yes| L4[L4 only<br/>e.g. NLB, Maglev, Katran]:::network
  T -->|No| L7S[Single L7 proxy tier<br/>is usually enough]:::security
  H -->|Yes| S{Internet scale,<br/>millions of connections?}
  S -->|No| L7S
  S -->|Yes| BOTH[L4 fleet in front of<br/>an L7 fleet]:::highlight
  BOTH --> D{Huge responses,<br/>e.g. video?}
  D -->|Yes| DSR[Add DSR on the L4 tier]:::network`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Operational Resilience & Observability`},{type:`bullets`,items:[`SYN Cookies (DDoS Protection): When receiving thousands of malicious incomplete TCP handshakes (SYN flood), the load balancer encodes connection state into the TCP sequence number, allocating zero RAM until the client sends the final ACK.`,`Connection Draining: When a server is deregistered for upgrade, it enters DRAINING state for 300 seconds. Existing user requests finish cleanly while all new requests go to updated nodes.`,`Canary & Traffic Splitting: L7 proxies route 95% of traffic to v1 and 5% to v2 based on HTTP headers or percentage weights, monitoring error rates before promoting new releases.`,`Key Metrics: p50/p90/p99 routing latency, active TCP connections, backend 5xx error spikes, health check flap rate, and bytes in vs. bytes out.`]},{type:`flow`,title:`Connection draining during a deploy`,code:`sequenceDiagram
  participant D as Deploy tool
  participant LB as L7 Proxy
  participant V1 as Server v1
  participant V2 as Server v2
  D->>LB: Mark v1 as DRAINING
  Note over LB,V1: New requests stop going to v1
  LB->>V2: All new requests
  LB->>V1: Existing in-flight requests only
  V1-->>LB: Last responses finish
  Note over V1: Idle, or 300 s timeout reached
  D->>V1: Safe to shut down`,text:`Draining turns a hard cut-off into a gentle hand-over, so no user's checkout is chopped in half by a deployment.`}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`How to Ace the Load Balancer Interview`},{type:`bullets`,items:[`Start by clarifying scope: Ask whether the interviewer wants a high-throughput Layer 4 packet router (like AWS NLB / Maglev) or an application-layer Layer 7 reverse proxy (like AWS ALB / Envoy). Propose a two-tier architecture that covers both.`,`Address the single-point-of-failure trap immediately: State clearly that the load balancer itself cannot be a single machine. Explain how Anycast BGP + ECMP or VRRP/Keepalived makes the LB tier fully redundant.`,`Differentiate yourself with Direct Server Return (DSR) and Maglev consistent hashing. Explaining why outbound response traffic should bypass the load balancer shows true distributed systems depth.`,`Discuss health check hysteresis: Never flip a server state on a single failed probe. Require 2–3 consecutive failures to mark dead, and 3 consecutive successes to restore.`,`Walk through the numbers, not just the names: Being able to trace how a global connection count actually shrinks tier by tier (Anycast → ECMP → Maglev → L7) shows you understand the architecture rather than having memorized its component names.`]},{type:`flow`,title:`A strong answer, step by step`,code:`flowchart LR
  A[Clarify<br/>L4, L7, or both]:::client --> B[Simple design<br/>one LB + server pool]:::server
  B --> C[Remove the SPOF<br/>Anycast + ECMP or VRRP]:::network
  C --> D[Scale the LB tier<br/>Maglev, stateless L4]:::highlight
  D --> E[Trace the numbers<br/>10M to 5K per proxy]:::server
  E --> F[Failures + health checks<br/>+ draining]:::security`},{type:`callout`,variant:`important`,text:`Many candidates treat load balancers as magical black boxes with an icon in their diagram. Being able to explain how the load balancer itself handles 10M connections using Anycast, ECMP, Maglev hashing, and eBPF/XDP — and trace the actual numbers tier by tier — will instantly put you in the top 1% of system design interview candidates.`}]}]},{id:`distributed-cache`,title:`Distributed Cache / Key-Value Store`,icon:`ti-database-import`,color:`#10b981`,bg:`#d1fae5`,accentGlow:`rgba(16,185,129,0.15)`,difficulty:`Intermediate`,tagline:`The cornerstone of distributed systems — master CAP theorem, consistent hashing, and replication.`,tags:[`CAP Theorem`,`Consistent Hashing`,`Replication`,`LRU/LFU`,`Gossip Protocol`],estimatedTime:`55 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A distributed key-value store like Redis, Memcached, or DynamoDB. It stores data as key → value pairs (like a giant dictionary), spreads that data across many machines (nodes), and keeps extra copies so reads and writes stay fast and keep working even when some machines fail.`},{type:`callout`,variant:`info`,text:`In simple terms: think of a library too big for one building. Books (values) are split across several branches (nodes) using a fixed rule based on the title (the key), so you always know which branch to visit. Each book is also kept at 2–3 branches, so if one branch closes for the day, you can still borrow it elsewhere.`},{type:`flow`,title:`The big picture — split the data, copy the data`,code:`flowchart TB
  C([App calls get user:42]):::client --> L[Client library<br/>hash the key to find its nodes]:::server
  L --> A[(Node A<br/>primary copy of user:42)]:::cache
  L -.-> B[(Node B<br/>replica of user:42)]:::cache
  L -.-> D[(Node C<br/>replica of user:42)]:::cache
  E[(Node D<br/>holds other keys)]:::cache
  A -->|"value in about 1 ms"| C`,text:`Two ideas carry the whole design: partitioning (each key lives on a small, predictable set of nodes) and replication (each key is stored on several nodes so one failure loses nothing).`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`put(key, value) — store or update a key-value pair.`,`get(key) → value — retrieve a value by key.`,`delete(key) — remove a key-value pair.`,`TTL support — keys expire after a configurable duration.`,`Data is distributed across multiple nodes for scalability.`,`Data is replicated across nodes for fault tolerance.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`Highly available (reads and writes continue even if some nodes fail).`,`Horizontally scalable (adding nodes increases capacity linearly).`,`Low latency — P99 < 5ms for reads and writes.`,`Consistency model: Tunable — support both strong and eventual consistency.`,`Fault tolerant — no data loss when a node fails (with proper replication).`]},{type:`heading2`,text:`Scale Estimates`},{type:`bullets`,items:[`1 million QPS (queries per second) at peak.`,`100 TB of data total.`,`1 KB average value size → 100 billion keys.`,`Average latency target: P50 < 1ms, P99 < 5ms.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`CAP Theorem`},{type:`paragraph`,text:`CAP theorem states that a distributed system can guarantee at most 2 of the following 3 properties simultaneously:`},{type:`bullets`,items:[`Consistency (C): Every read returns the most recent write or an error. All nodes see the same data at the same time.`,`Availability (A): Every request gets a response (success or failure), but it might not be the most recent data.`,`Partition Tolerance (P): The system keeps operating even when a network partition happens — the network splits and some nodes cannot talk to others (sometimes called split-brain).`]},{type:`flow`,title:`CAP — the choice you face during a partition`,code:`flowchart TD
  W([Client writes x = 2 on side 1]):::client --> S1[(Side 1 nodes<br/>have x = 2)]:::cache
  S1 -.-x|"network cut \u2014 cannot sync"| S2[(Side 2 nodes<br/>still have x = 1)]:::cache
  R([Another client reads x on side 2]):::client --> S2
  S2 --> Q{Side 2 cannot confirm<br/>it has the latest value}
  Q -->|"Choose C \u2014 CP"| CP([Return an error<br/>correct but unavailable]):::security
  Q -->|"Choose A \u2014 AP"| AP([Return x = 1<br/>available but stale]):::highlight`,text:`When the network is healthy you can have both C and A. The trade-off only bites during a partition — and then you must pick one. Most caches pick A.`},{type:`callout`,variant:`important`,text:`Network partitions are unavoidable in distributed systems. Therefore, every distributed system must choose between Consistency (CP) and Availability (AP). You cannot have all three. A distributed cache typically chooses AP (available + partition tolerant) with eventual consistency.`},{type:`heading2`,text:`Consistent Hashing`},{type:`paragraph`,text:`In a simple hash partitioning scheme, mapping a key to a node is: node = hash(key) % N. The problem: when N changes (add/remove a node), almost ALL keys need to be remapped.`},{type:`paragraph`,text:`Consistent hashing fixes this by placing both nodes and keys on a "hash ring" \u2014 imagine the numbers 0 to 2^32-1 bent into a clock face. Each node is hashed to a position on the ring, and so is each key. A key belongs to the first node you reach walking clockwise from the key's position. When a node is added or removed, only the keys in the arc between it and the previous node change owner \u2014 about 1/N of all keys.`},{type:`flow`,title:`Adding a node: modulo vs hash ring`,code:`flowchart TB
  subgraph Mod["hash(key) % N \u2014 going from 3 to 4 nodes"]
    M1["key k1: 10 % 3 = 1 \u2192 10 % 4 = 2"]:::security
    M2["key k2: 11 % 3 = 2 \u2192 11 % 4 = 3"]:::security
    M3["~75% of keys change node<br/>= mass cache misses"]:::security
  end
  subgraph Ring["Hash ring \u2014 walk clockwise to the next node"]
    NA((Node A)):::cache --> NB((Node B)):::cache
    NB --> NN((New node D)):::highlight
    NN --> NC((Node C)):::cache
    NC --> NA
    K["Only keys between B and D<br/>move \u2014 from C to D"]:::server
  end`,text:`With modulo, changing N reshuffles almost everything. On the ring, the new node just takes over one arc from its clockwise neighbour; every other key stays put.`},{type:`heading2`,text:`Virtual Nodes (VNodes)`},{type:`paragraph`,text:`With only a few points on the ring, the arcs between nodes are uneven, so some nodes get far more keys than others. Virtual nodes fix this: each physical machine is placed on the ring many times (e.g., 150 positions). Lots of small arcs average out, so load spreads evenly. It also lets you give a more powerful machine more positions, and therefore a bigger share of keys.`},{type:`heading2`,text:`Replication Factor & Quorum`},{type:`bullets`,items:[`Replication factor (RF): How many nodes store a copy of each key. RF=3 means each key is stored on 3 nodes.`,`Write quorum (W): How many nodes must acknowledge a write for it to succeed. W=2 means 2 out of 3 replicas must confirm.`,`Read quorum (R): How many nodes must respond to a read. R=2 means read from 2 replicas.`,`Strong consistency: W + R > N (e.g., W=2, R=2, N=3). A read always overlaps with the most recent write.`,`Eventual consistency: W=1, R=1. Maximum performance but reads might return stale data briefly.`]},{type:`flow`,title:`Why W + R > N guarantees a fresh read`,code:`flowchart LR
  WR([Write v2 with W = 2]):::client --> R1[(Replica 1<br/>v2)]:::highlight
  WR --> R2[(Replica 2<br/>v2)]:::highlight
  WR -.->|"not yet"| R3[(Replica 3<br/>v1 \u2014 stale)]:::cache
  RD([Read with R = 2]):::client --> R2
  RD --> R3
  R2 & R3 --> PICK[Compare versions<br/>newest wins \u2192 v2]:::server`,text:`N = 3, W = 2, R = 2. Any 2 replicas you read must include at least one of the 2 that took the write — the groups always overlap, so the newest value is always in the answer.`},{type:`heading2`,text:`Gossip Protocol`},{type:`paragraph`,text:`How do nodes know about each other's state? With a gossip protocol: every second or so, each node picks a random peer and they swap what they know (which nodes are up or down, who owns which part of the ring). News spreads like an office rumour — each round roughly doubles the number of nodes that have heard it, so it reaches all N nodes in about log(N) rounds. No central coordinator is needed.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components`},{type:`bullets`,items:[`Client Library: SDK that clients use to interact with the cache. Handles hashing, routing to correct node, retry on failure.`,`Coordinator Node: Receives client requests and routes them to the appropriate storage nodes based on consistent hashing.`,`Storage Nodes: Actual data stores. Each node stores a portion of the keyspace. Multiple nodes hold replicas of each key.`,`Gossip Protocol Layer: Background process on each node for cluster membership and failure detection.`,`Merkle Trees: Used to detect inconsistencies between replicas during anti-entropy repair.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  APP([Application]):::client --> LIB[Client library<br/>hashing, routing, retries]:::server
  LIB --> CO[Coordinator node<br/>any node can play this role]:::network
  subgraph Ring["Storage nodes on the hash ring"]
    N1[(Node 1)]:::cache
    N2[(Node 2)]:::cache
    N3[(Node 3)]:::cache
    N4[(Node 4)]:::cache
  end
  CO --> N1 & N2 & N3
  N1 <-.->|"gossip: who is alive"| N2
  N3 <-.->|"gossip"| N4
  N2 <-.->|"Merkle-tree repair"| N3`,text:`The coordinator fans each request out to the replicas for that key. Dotted lines are background chatter that keeps the cluster healthy without slowing requests.`},{type:`heading2`,text:`Read Path`},{type:`numbered`,items:[`Client sends GET(key) to the coordinator.`,`Coordinator hashes the key, finds the N responsible nodes on the ring.`,`Coordinator sends GET to R of the N replicas in parallel.`,`First R responses returned. If values differ (stale replicas), return the newest (by vector clock/timestamp).`,`Background process schedules read repair — updates stale replicas with the latest value.`,`Return value to client.`]},{type:`flow`,title:`Read path with read repair (N = 3, R = 2)`,code:`sequenceDiagram
  actor C as Client
  participant CO as Coordinator
  participant A as Replica A
  participant B as Replica B
  participant D as Replica C
  C->>CO: GET user:42
  par ask R replicas at once
    CO->>A: GET user:42
    CO->>B: GET user:42
  end
  A-->>CO: v2 (newer)
  B-->>CO: v1 (stale)
  CO-->>C: v2
  CO--)B: read repair: set user:42 = v2
  Note over D: Not asked this time - it will be fixed by later reads or repair`,text:`The client gets the newest value immediately. Fixing the stale replica happens afterwards, off the critical path.`},{type:`heading2`,text:`Write Path`},{type:`numbered`,items:[`Client sends PUT(key, value) to the coordinator.`,`Coordinator hashes the key, identifies the N responsible nodes.`,`Coordinator sends PUT to all N replicas concurrently.`,`Wait for W acknowledgements.`,`Return success to client. The remaining (N-W) replicas will catch up asynchronously.`]},{type:`flow`,title:`Write path (N = 3, W = 2)`,code:`sequenceDiagram
  actor C as Client
  participant CO as Coordinator
  participant A as Replica A
  participant B as Replica B
  participant D as Replica C
  C->>CO: PUT user:42 = v3
  par send to all N replicas
    CO->>A: PUT v3
    CO->>B: PUT v3
    CO->>D: PUT v3
  end
  A-->>CO: ack
  B-->>CO: ack
  Note over CO: W = 2 acks reached
  CO-->>C: 200 OK
  D-->>CO: ack (arrives later, ignored for latency)`,text:`The write is sent everywhere but the client only waits for the fastest W replicas. A slow replica never slows down the caller.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Storage Engine — LSM Tree`},{type:`paragraph`,text:`Most distributed KV stores that persist to disk use a Log-Structured Merge Tree (LSM Tree) storage engine. Each write goes into a sorted in-memory buffer called the MemTable (plus an append-only log on disk, so it survives a crash). When the MemTable fills up, it is written to disk in one go as an immutable sorted file called an SSTable (Sorted String Table). In the background, small SSTables are merged into bigger ones (compaction), dropping overwritten and deleted values.`},{type:`flow`,title:`LSM tree — how writes and reads flow`,code:`flowchart TD
  W([PUT key]):::client --> WAL[[Append to commit log<br/>for crash safety]]:::queue
  W --> MT[MemTable<br/>sorted, in memory]:::cache
  MT -->|"when full: flush"| SS1[(SSTable new)]:::db
  SS1 -.->|"background compaction"| SS2[(SSTable older, merged)]:::db
  R([GET key]):::client --> MT
  MT -->|"not found"| BF1{Bloom filter:<br/>maybe in new SSTable?}
  BF1 -->|maybe| SS1
  BF1 -->|"definitely not"| BF2{Bloom filter:<br/>maybe in older SSTable?}
  BF2 -->|maybe| SS2`,text:`Writes only ever append or touch memory, which is why they are so fast. Reads check newest data first, and Bloom filters skip files that cannot contain the key.`},{type:`bullets`,items:[`Write performance: O(1) — always an in-memory write first. Much faster than B-Tree (which requires random disk I/O).`,`Read performance: Slightly slower — may need to check multiple SSTables. Bloom filters on each SSTable allow quick "definitely not here" checks.`,`Used by: RocksDB, Cassandra, LevelDB.`]},{type:`heading2`,text:`Eviction Policies`},{type:`bullets`,items:[`LRU (Least Recently Used): Evict the key that was accessed longest ago. Most common. Good hit rate for temporal access patterns.`,`LFU (Least Frequently Used): Evict the key accessed least often. Better for items with long-term popularity. More complex to implement.`,`FIFO: Evict the oldest key. Simple but poor cache efficiency.`,`Random: Evict a random key. Surprisingly decent performance and very simple.`,`Practical advice: LRU with O(1) implementation using a doubly-linked list + hash map. LFU when access frequency matters more than recency.`]},{type:`heading2`,text:`Write-Through vs. Write-Back vs. Cache-Aside`},{type:`bullets`,items:[`Cache-Aside (Lazy Loading): Application reads from cache. On miss, reads from DB and populates cache. On write, updates DB and invalidates cache. Most common pattern.`,`Write-Through: Every write goes to cache AND DB synchronously. Cache is always warm. But: writes are slower.`,`Write-Back: Write to cache only. Flush to DB asynchronously. Fastest writes, but risk of data loss if cache node fails before flushing.`]},{type:`flow`,title:`Three caching patterns side by side`,code:`flowchart TB
  subgraph CA["Cache-aside \u2014 app manages the cache"]
    A1([App]):::client -->|"1. read"| C1[(Cache)]:::cache
    A1 -->|"2. on miss, read"| D1[(DB)]:::db
    A1 -->|"3. fill cache"| C1
  end
  subgraph WT["Write-through \u2014 both, synchronously"]
    A2([App]):::client -->|"write"| C2[(Cache)]:::cache
    C2 -->|"same request"| D2[(DB)]:::db
  end
  subgraph WB["Write-back \u2014 cache now, DB later"]
    A3([App]):::client -->|"write"| C3[(Cache)]:::cache
    C3 -.->|"later, in batches"| D3[(DB)]:::db
  end`,text:`Moving down the list, writes get faster but the risk grows: write-back can lose data if the cache dies before the dotted flush happens.`},{type:`heading2`,text:`Conflict Resolution — Vector Clocks`},{type:`paragraph`,text:`When two clients write to the same key at the same time on different replicas (for example, during a partition), the replicas end up with conflicting values. Vector clocks help decide which write came "after" which. Each value carries a small counter per node, such as {nodeA: 3, nodeB: 1}. If every counter in one version is greater than or equal to the other's, it is simply newer and wins. If each version is ahead on a different node, the writes happened independently (concurrently), so the conflict is handed to the application to resolve \u2014 for example last-writer-wins, or merging the two (like combining two shopping carts).`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Horizontal Scaling with Consistent Hashing`},{type:`paragraph`,text:`Adding a new storage node requires moving only ~1/N of total keys. With 10 nodes and 100TB, adding an 11th node requires moving ~9TB. During migration, the new node fetches data from its neighboring nodes, which continue serving traffic. No downtime.`},{type:`heading2`,text:`Read Scaling`},{type:`bullets`,items:[`Increase replication factor. With RF=5, you can serve reads from any 5 nodes (2 for quorum), doubling read throughput.`,`Lower R (read quorum). R=1 gives maximum read throughput but risks stale reads.`,`Add more nodes. With consistent hashing, each new node reduces the load on existing nodes proportionally.`]},{type:`heading2`,text:`Write Scaling`},{type:`bullets`,items:[`Lower W (write quorum). W=1 gives maximum write throughput but risks data loss.`,`Add more nodes — writes are distributed across more nodes.`,`Use the LSM tree for high write throughput — all writes are sequential memory writes.`]}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Failure Detection — Gossip + Heartbeats`},{type:`paragraph`,text:`Each node sends a heartbeat (an "I am alive" message) every second. If a node misses 3 heartbeats in a row (3 seconds), it is marked as suspected down, and that suspicion is gossiped to the rest of the cluster within about log(N) seconds. If it stays silent past a configurable timeout, it is marked DOWN.`},{type:`heading2`,text:`Hinted Handoff`},{type:`paragraph`,text:`What if a replica node is temporarily down during a write? The coordinator gives the write to another healthy node to hold on its behalf, together with a "hint" saying who it really belongs to. When the downed node comes back, the stand-in node replays those hinted writes to it. This way writes still collect W acknowledgements during short outages, and nothing is lost.`},{type:`flow`,title:`Hinted handoff`,code:`sequenceDiagram
  participant CO as Coordinator
  participant A as Replica A
  participant B as Replica B (down)
  participant H as Stand-in node H
  CO->>A: PUT k = v
  A-->>CO: ack
  CO-xB: PUT k = v (no response)
  CO->>H: PUT k = v + hint (belongs to B)
  H-->>CO: ack
  Note over CO: W = 2 reached, client gets OK
  Note over B: B recovers
  H->>B: replay hinted write k = v
  B-->>H: ack, hint deleted`,text:`Like a neighbour signing for your parcel while you are out and handing it over when you return.`},{type:`heading2`,text:`Anti-Entropy Repair with Merkle Trees`},{type:`paragraph`,text:`Over time, replicas can drift apart (missed writes, network issues). Anti-entropy repair is the background job that finds and fixes these differences. Merkle trees make it cheap: each leaf is a hash of a range of key-value pairs, and each parent is a hash of its children, all the way up to one root hash. If two replicas have the same root hash, they are identical — done. If not, compare the children and only follow the branches whose hashes differ, until you reach the exact keys that differ — without sending all the data over the network.`},{type:`flow`,title:`Merkle tree comparison — follow only the mismatches`,code:`flowchart TD
  ROOT{Root hashes equal?}:::highlight -->|Yes| DONE([Replicas identical \u2014 stop]):::server
  ROOT -->|No| L{Left child equal?}
  ROOT -->|No| RT{Right child equal?}
  L -->|Yes| SKIP1([Skip left half]):::server
  RT -->|No| RL{Right-left leaf equal?}
  RT -->|No| RR{Right-right leaf equal?}
  RL -->|Yes| SKIP2([Skip]):::server
  RR -->|No| SYNC([Sync only these keys]):::cache`,text:`Comparing one hash per level means finding a handful of bad keys among billions takes only a few dozen hash comparisons.`},{type:`heading2`,text:`Handling Network Partitions`},{type:`paragraph`,text:`During a partition, two groups of nodes cannot communicate. AP systems (like Cassandra) continue accepting reads and writes on both sides. When the partition heals, conflict resolution (vector clocks, last-writer-wins) merges the diverged state. CP systems (like etcd, ZooKeeper) refuse writes on the minority partition to prevent inconsistency.`}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Memory Management`},{type:`bullets`,items:[`Allocate a fixed amount of memory to the cache. When full, evict according to policy.`,`Slab allocator (Memcached approach): Pre-allocate fixed-size memory chunks. Eliminates heap fragmentation. Keys and values are stored in power-of-2 sized slabs.`,`Off-heap storage: Store data outside the JVM heap (for Java-based stores) to reduce GC pressure.`]},{type:`heading2`,text:`Bloom Filters for Read Optimization`},{type:`paragraph`,text:`Before reading from SSTables, check a Bloom filter. If the Bloom filter says the key is "definitely not present," skip the SSTable read entirely. This eliminates unnecessary disk I/O for non-existent keys — a very common case in cache miss scenarios.`},{type:`heading2`,text:`Connection Pooling & Pipelining`},{type:`bullets`,items:[`Maintain a pool of persistent connections between client and cache nodes.`,`Redis pipelining: batch multiple commands in a single TCP packet. Reduces round-trips from N to 1 for N commands.`,`Use binary protocol (Memcached binary, Redis RESP3) for efficient serialization.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Tunable Consistency (W + R vs. Latency)`},{type:`bullets`,items:[`W=3, R=2 (N=3): Strong consistency. Every read sees every write. Slower — must wait for 3 writes and 2 reads.`,`W=1, R=1: Eventual consistency. Maximum speed. May read stale data for a brief period.`,`W=2, R=2: Good balance for most use cases. Tolerates 1 node failure.`,`Let the application choose consistency level per-request — Cassandra supports this as a first-class feature.`]},{type:`heading2`,text:`Single Leader vs. Multi-Leader vs. Leaderless`},{type:`bullets`,items:[`Single Leader (Redis): One primary accepts all writes. Simple consistency. Leader is a bottleneck. Failover takes seconds.`,`Multi-Leader: Multiple nodes accept writes. Better write throughput. Complex conflict resolution.`,`Leaderless (Cassandra, DynamoDB): Any node accepts writes. Maximum availability. Quorum determines consistency. More complex client logic.`]}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Capacity Planning`},{type:`bullets`,items:[`Estimate peak QPS, average key/value size, total data size, and desired cache hit ratio.`,`Over-provision by 30% to handle traffic spikes without performance degradation.`,`Monitor memory usage continuously — approaching 100% memory causes thrashing.`]},{type:`heading2`,text:`Cache Stampede Prevention`},{type:`paragraph`,text:`A cache stampede (thundering herd) happens when a popular key expires and thousands of requests simultaneously hit the database. Solutions:`},{type:`bullets`,items:[`Probabilistic early expiration: Before the key expires, probabilistically refresh it. The probability of refresh increases as expiry approaches.`,`Mutex locking: Only one request is allowed to compute the new value. Others wait and receive the new value when it is ready.`,`Background refresh: Serve slightly stale data while a background thread recomputes the fresh value.`]},{type:`flow`,title:`Stopping a stampede with a lock`,code:`flowchart TD
  R([Many requests for hot key]):::client --> H{In cache?}
  H -->|Yes| OK([Return value]):::highlight
  H -->|"No \u2014 just expired"| L{Got the rebuild lock?<br/>SET lock NX with short TTL}
  L -->|"Yes \u2014 only one request"| DB[(Query database once)]:::db
  DB --> FILL[Write value to cache<br/>+ release lock]:::cache --> OK
  L -->|"No \u2014 everyone else"| W[Wait briefly or serve<br/>stale copy]:::server
  W --> H`,text:`Instead of thousands of identical database queries, exactly one request rebuilds the value and the rest reuse it.`}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`Explain the CAP theorem and where a distributed cache falls.`,`How does consistent hashing work and why is it better than simple modulo hashing?`,`How would you implement LRU cache in O(1) time?`,`What is eventual consistency and when is it acceptable?`,`How do you handle a node failure in your distributed cache?`,`Explain the difference between write-through and write-back caching.`]},{type:`heading2`,text:`Coding: LRU Cache in O(1)`},{type:`code`,lang:`typescript`,code:`class LRUCache {
  private capacity: number;
  private map = new Map<number, number>(); // key \u2192 value (maintains insertion order)

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    // Move to end (most recently used)
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      // Delete the first (least recently used) entry
      this.map.delete(this.map.keys().next().value);
    }
    this.map.set(key, value);  // Add to end
  }
}`},{type:`callout`,variant:`tip`,text:`JavaScript Maps maintain insertion order, making them ideal for LRU implementation. Move accessed keys to the end; the first key is always the LRU. This is a very common coding interview question paired with the system design.`}]}]},{id:`search-autocomplete`,title:`Search Autocomplete`,icon:`ti-search`,color:`#0d9488`,bg:`#ccfbf1`,accentGlow:`rgba(13,148,136,0.15)`,difficulty:`Intermediate`,tagline:`Tries with precomputed top-K, offline index builds, and millisecond read paths.`,tags:[`Trie`,`Top-K`,`Data Pipeline`,`Edge Caching`,`Read-Heavy`],estimatedTime:`55 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`The backend behind a search box that suggests completions as you type, like Google, Amazon or YouTube search. After every few keystrokes the client sends the current prefix (e.g. "how to b") and gets back the 5–10 most popular full queries that start with it ("how to boil eggs", "how to buy bitcoin", ...).`},{type:`callout`,variant:`info`,text:`In simple terms: imagine a librarian who, every night, reads yesterday's list of everything people searched for and writes a cheat sheet: for every possible beginning of a question, the 10 most common ways people finished it. During the day she never thinks — she just reads the right line off the cheat sheet. All the hard work happens offline; answering is a lookup.`},{type:`flow`,title:`The big picture — answer from a precomputed index, rebuild it offline`,code:`flowchart LR
  U([User types 'how to b']):::client -->|"GET /suggest?q=how to b"| S[Suggestion Service]:::server
  S -->|"lookup prefix"| IDX[("In-memory index<br/>prefix \u2192 top 10")]:::cache
  S -->|"top 10 completions"| U
  U -.->|"final search is logged"| LOG[[Query logs]]:::queue
  LOG -.-> AGG[Aggregate + rank<br/>offline]:::server
  AGG -.->|"new index snapshot"| IDX`,text:`Two loops at very different speeds: the read path answers in a few milliseconds from memory; the build path turns search logs into a fresh index every hour or so.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Given a prefix, return the top-K (K = 5–10) suggested queries that start with it.`,`Rank suggestions by popularity (how often the query is searched), with a boost for fresh/trending queries.`,`Suggestions must never include offensive, illegal or blocked terms.`,`Support multiple languages and Unicode input (accents, CJK, emoji-free normalisation).`,`Optional: personalised suggestions (your own recent searches), light typo tolerance.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`Very low latency — suggestions should appear in under ~100 ms end-to-end, otherwise they arrive after the user has typed the next letter. After network and rendering, the server budget is only ~10–20 ms at P99.`,`Very high read QPS — every search produces several suggestion requests.`,`High availability, but suggestions are a nice-to-have: failing quietly is better than blocking typing.`,`Eventual consistency is fine — a new popular query can take minutes to hours to show up.`,`Relevance — results should be useful, safe and not stale for days.`]},{type:`heading2`,text:`Back-of-the-Envelope Estimates`},{type:`bullets`,items:[`Users: 10M DAU, each doing ~10 searches/day → 100M searches/day.`,`Requests per search: an average query is ~20 characters, but the client debounces and skips repeats, so assume ~6 suggestion requests per search → 600M requests/day.`,`Average QPS: 600M ÷ 86,400 s ≈ 6,900 QPS (call it ~7K).`,`Peak QPS: assume 3× average → ~21K QPS. Without debouncing (one request per keystroke) it would be 2B/day ≈ 23K average and ~70K peak — debouncing alone cuts load by ~3×.`,`Log volume: 100M searches × ~100 bytes per log record ≈ 10 GB/day (~3.6 TB/year raw, before compression).`,`Index size: keep only queries searched at least a few times — say 10M distinct queries of ~20 characters. Worst case 10M × 20 = 200M trie nodes; prefix sharing typically brings it to ~50M. At ~100 bytes per node (children map + top-10 list of 4-byte query IDs) that is ~5 GB typical, ~20 GB worst case.`,`Conclusion: the whole index fits in RAM on one machine, so we can replicate it rather than shard it at first. ~21K peak QPS ÷ ~5K QPS per server (with headroom) ≈ 5 servers, plus spares per region.`]},{type:`callout`,variant:`tip`,text:`See the Back-of-the-Envelope Estimation core concept for the method. The key insight to say out loud: "the index fits in memory, so the read path is a pure in-memory lookup and the real problem is building the index, not storing it."`}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`The Trie (Prefix Tree)`},{type:`paragraph`,text:`A trie stores strings character by character: each node is one character, and the path from the root to a node spells a prefix. All queries starting with "tr" live under the same node, so finding the prefix node costs O(L) where L is the prefix length — independent of how many queries exist.`},{type:`flow`,title:`A small trie with top-3 cached at every node`,code:`flowchart TD
  R(("root")):::server --> T(("t")):::server
  R --> W(("w")):::server
  T --> TR(("tr")):::server
  T --> TO(("to")):::server
  TR --> TRU(("tru")):::server
  TR --> TRE(("tre")):::server
  TR --> TRY(("try: 29")):::highlight
  TRU --> TRUE(("true: 35")):::highlight
  TRE --> TREE(("tree: 10")):::highlight
  TO --> TOY(("toy: 14")):::highlight
  W --> WI(("wi")):::server
  WI --> WIN(("win: 50")):::highlight
  WI --> WIS(("wish: 25")):::highlight
  T -.- KT["top-3 for 't':<br/>true, try, toy"]:::cache
  TR -.- KTR["top-3 for 'tr':<br/>true, try, tree"]:::cache`,text:`Highlighted nodes are complete queries with their search counts. The dotted notes show the precomputed top-K list stored on each node, which is what makes reads fast.`},{type:`heading2`,text:`Why Naive DFS Per Request Is Too Slow`},{type:`paragraph`,text:`The textbook approach is: walk to the prefix node, then DFS the whole subtree to collect every complete query, sort by count and return the top K. For a long prefix that is fine, but for a one- or two-letter prefix like "s" the subtree contains millions of queries. Visiting millions of nodes per keystroke at 21K QPS is impossible within a 10 ms budget — and short prefixes are exactly the most frequent requests.`},{type:`flow`,title:`Naive DFS vs precomputed top-K`,code:`flowchart TB
  subgraph NAIVE["Naive - work at read time"]
    N1([prefix 's']):::client --> N2[Walk to node 's'<br/>O of L]:::server
    N2 --> N3[DFS millions of<br/>descendant queries]:::security
    N3 --> N4[Sort, take top 10]:::server
  end
  subgraph CACHED["Top-K at every node - work at build time"]
    C1([prefix 's']):::client --> C2[Walk to node 's'<br/>O of L]:::server
    C2 --> C3([Return stored top-10<br/>O of K]):::highlight
  end`,text:`Precomputing moves the cost from every request (millions per second) to the offline build (once an hour). Reads become O(L + K) — a few microseconds.`},{type:`heading2`,text:`Ranking: Popularity, Freshness and Trending`},{type:`bullets`,items:[`Popularity: how many times a query was searched over a window (e.g. the last 30 days).`,`Freshness via time decay: older searches count less. A common form is score = Σ count_in_bucket × 0.5^(age / half_life), e.g. half-life of 7 days. Last week's spike fades instead of dominating for a month.`,`Trending: a query whose last-hour rate is far above its normal baseline (e.g. 10× its 7-day hourly average) gets a temporary boost — this is how breaking news shows up within minutes.`,`Optional personalisation: blend in the user's own recent searches or signals like location and language at serve time (see Interview Perspective).`,`The ranking ideas are similar to the News Feed design: start with a hand-tuned formula, move to a learned model once you have click-through data.`]},{type:`code`,lang:`typescript`,code:`// Time-decayed popularity: recent searches weigh more than old ones
const HALF_LIFE_HOURS = 24 * 7;

function decayedScore(hourlyCounts: { hoursAgo: number; count: number }[]): number {
  return hourlyCounts.reduce(
    (sum, b) => sum + b.count * Math.pow(0.5, b.hoursAgo / HALF_LIFE_HOURS),
    0,
  );
}

// Trending: last hour vs the usual hourly rate over the past week
function isTrending(lastHour: number, avgHourlyLastWeek: number): boolean {
  return lastHour >= 100 && lastHour > 10 * Math.max(avgHourlyLastWeek, 1);
}`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components Overview`},{type:`bullets`,items:[`Client: debounces keystrokes, caches responses and cancels stale requests (see the frontend autocomplete answer).`,`CDN / edge cache: caches responses for popular short prefixes for a few minutes.`,`Load Balancer + API Gateway: routes /suggest requests, applies rate limiting.`,`Suggestion Service: stateless-looking but holds a read-only, in-memory copy of the index; answers a prefix lookup in microseconds.`,`Query Log pipeline: the search service emits one event per completed search to Kafka.`,`Aggregators: a batch job (hourly/daily) computes popularity counts; a streaming job (Flink/Kafka Streams) detects trending queries.`,`Index Builder: filters, ranks and builds a new trie/prefix table snapshot, then publishes it to object storage.`,`Snapshot Store (S3/GCS) + Index Registry: versioned snapshots and a pointer to the current one.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  C([Browser / App]):::client --> CDN[CDN edge cache]:::network
  CDN -->|"miss"| LB[Load Balancer]:::network
  LB --> S1[Suggestion Service 1<br/>index in RAM]:::server
  LB --> S2[Suggestion Service N<br/>index in RAM]:::server
  C -->|"search submitted"| SS[Search Service]:::external
  SS -.->|"query event"| K[[Kafka query-log]]:::queue
  K -.-> BATCH[Batch aggregator<br/>hourly / daily]:::server
  K -.-> STREAM[Stream aggregator<br/>trending]:::server
  BATCH --> BUILD[Index Builder]:::server
  STREAM --> BUILD
  BL[(Blocklist)]:::security --> BUILD
  BUILD -->|"snapshot v42"| OBJ[(Snapshot store)]:::db
  OBJ -.->|"load + swap"| S1 & S2`,text:`The read path (top) never touches a database. The write path (bottom) is fully asynchronous — Suggestion Services just pick up a new snapshot when one is ready.`},{type:`heading2`,text:`Read Path — Serving a Suggestion`},{type:`numbered`,items:[`User types; the client waits for a short pause (debounce) and sends GET /v1/suggest?q=how%20to%20b&lang=en&k=10.`,`The CDN answers directly if this prefix is cached (common for 1–3 character prefixes).`,`On a miss, the load balancer forwards to any Suggestion Service replica.`,`The service normalises the prefix (lowercase, Unicode NFKC, collapse spaces), walks the in-memory trie and reads the stored top-K.`,`Optionally it merges personal recent searches and re-checks the blocklist, then returns JSON with a short Cache-Control max-age.`]},{type:`flow`,title:`Read path — one keystroke`,code:`sequenceDiagram
  actor U as User
  participant C as Client
  participant E as CDN edge
  participant S as Suggestion Service
  U->>C: types 'how to b'
  C->>C: debounce, check local cache
  C->>E: GET /v1/suggest?q=how+to+b
  alt edge HIT - popular prefix
    E-->>C: cached top 10
  else edge MISS
    E->>S: forward request
    S->>S: normalise, walk trie, read top-K
    S-->>E: top 10 + Cache-Control max-age=300
    E-->>C: top 10
  end
  C-->>U: render dropdown`,text:`No database, no network hop beyond the service itself: the server-side work is microseconds, so latency is dominated by the network.`},{type:`heading2`,text:`Write Path — Building the Index`},{type:`numbered`,items:[`Every completed search (not every keystroke) is logged as {query, timestamp, lang, region, userId-hash}.`,`Batch job aggregates counts per (query, lang) per hour; daily it rolls up into a decayed popularity score.`,`Stream job keeps sliding-window counts and flags trending queries within minutes.`,`Index Builder merges both, drops rare queries (count below a threshold) and blocked terms, then builds the trie with top-K at each node.`,`The snapshot is written to object storage with a version number; the registry pointer is flipped after validation.`,`Suggestion Services download the new snapshot, load it beside the old one, and atomically swap.`]},{type:`flow`,title:`Data pipeline — logs to snapshot`,code:`flowchart LR
  L[[Query logs<br/>Kafka]]:::queue --> H[Hourly counts<br/>per query + lang]:::server
  H --> D[Daily rollup<br/>time-decayed score]:::db
  L --> T[Streaming window<br/>last 5-60 min]:::server
  T --> TR[Trending boosts]:::highlight
  D --> M[Merge scores]:::server
  TR --> M
  M --> F[Filter: rare queries,<br/>blocklist, PII]:::security
  F --> B[Build trie with<br/>top-K per node]:::server
  B --> V{Validation<br/>checks pass?}
  V -->|Yes| P[(Publish snapshot v42)]:::db
  V -->|No| KEEP[Keep serving v41]:::external`,text:`Building is the expensive part, and it runs off the critical path. If anything looks wrong, the old snapshot simply keeps serving.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`API Design`},{type:`code`,lang:`text`,code:`GET /v1/suggest?q=how%20to%20b&lang=en&k=10
Response 200 (Cache-Control: public, max-age=300):
{
  "prefix": "how to b",
  "suggestions": [
    { "text": "how to boil eggs", "type": "popular" },
    { "text": "how to buy bitcoin", "type": "trending" },
    { "text": "how to be happy", "type": "popular" }
  ],
  "indexVersion": 42
}

Personalised variant (not CDN-cacheable, Cache-Control: private):
GET /v1/suggest?q=how%20to%20b&lang=en&k=10   (with auth cookie)

POST /v1/search-events  { "query": "how to boil eggs", "selectedSuggestion": true }`},{type:`heading2`,text:`Trie with Top-K at Every Node`},{type:`paragraph`,text:`The implementation below builds the trie offline from (query, count) pairs, fills each node's top-K bottom-up with one post-order DFS, and serves a prefix in O(L + K). An add() method shows incremental updates for counts that only increase; anything that lowers a count (decay, removal) is handled by the next full rebuild.`},{type:`code`,lang:`typescript`,code:`type Suggestion = { query: string; count: number };

class TrieNode {
  children = new Map<string, TrieNode>();
  count = 0; // > 0 only if a full query ends here
  topK: Suggestion[] = []; // best K completions of this prefix, precomputed
}

// Higher count first; ties broken alphabetically so results are stable
const better = (a: Suggestion, b: Suggestion) =>
  b.count - a.count || (a.query < b.query ? -1 : a.query > b.query ? 1 : 0);

export class AutocompleteTrie {
  private root = new TrieNode();
  private readonly k: number;
  constructor(k = 5) {
    this.k = k;
  }

  // Normalise once, at build time AND at query time
  static normalise(s: string): string {
    return s.normalize('NFKC').toLowerCase().trim().replace(/\\s+/g, ' ');
  }

  // Offline build: insert every (query, count) pair, then fill topK bottom-up
  static build(entries: Iterable<[string, number]>, k = 5): AutocompleteTrie {
    const trie = new AutocompleteTrie(k);
    for (const [q, c] of entries) trie.insertRaw(AutocompleteTrie.normalise(q), c);
    trie.fillTopK(trie.root, '');
    return trie;
  }

  private insertRaw(query: string, count: number): void {
    let node = this.root;
    for (const ch of query) {
      let next = node.children.get(ch);
      if (!next) node.children.set(ch, (next = new TrieNode()));
      node = next;
    }
    node.count += count;
  }

  // Post-order DFS: a node's top-K = best K of (itself + children's top-K lists)
  private fillTopK(node: TrieNode, prefix: string): Suggestion[] {
    const candidates: Suggestion[] = [];
    if (node.count > 0) candidates.push({ query: prefix, count: node.count });
    for (const [ch, child] of node.children) {
      candidates.push(...this.fillTopK(child, prefix + ch));
    }
    node.topK = candidates.sort(better).slice(0, this.k);
    return node.topK;
  }

  // Online increment (counts only go UP): update topK along the path, O(L \xB7 K)
  add(rawQuery: string, delta = 1): void {
    const query = AutocompleteTrie.normalise(rawQuery);
    this.insertRaw(query, delta);
    let node: TrieNode | undefined = this.root;
    const path: TrieNode[] = [this.root];
    for (const ch of query) {
      node = node.children.get(ch)!;
      path.push(node);
    }
    const total = node.count;
    for (const n of path) {
      const hit = n.topK.find((s) => s.query === query);
      if (hit) hit.count = total;
      else n.topK.push({ query, count: total });
      n.topK = n.topK.sort(better).slice(0, this.k);
    }
  }

  // Serving path: walk the prefix (O(L)), return the precomputed list (O(K))
  suggest(rawPrefix: string): string[] {
    let node: TrieNode | undefined = this.root;
    for (const ch of AutocompleteTrie.normalise(rawPrefix)) {
      node = node.children.get(ch);
      if (!node) return [];
    }
    return node.topK.map((s) => s.query);
  }
}

// \u2500\u2500 Usage \u2500\u2500
const trie = AutocompleteTrie.build(
  [['tree', 10], ['try', 29], ['true', 35], ['toy', 14], ['win', 50], ['wish', 25]],
  3,
);
trie.suggest('t');   // ['true', 'try', 'toy']
trie.suggest('TR');  // ['true', 'try', 'tree']   (normalised)
trie.suggest('x');   // []
trie.add('toy', 30); // toy is now 44
trie.suggest('t');   // ['toy', 'true', 'try']`},{type:`callout`,variant:`tip`,text:`Why the bottom-up build is cheap: each node only merges its children's already-trimmed top-K lists, so building is roughly O(nodes × K) instead of re-scanning every subtree. Production builders store 4-byte query IDs instead of strings in each top-K list to save memory.`},{type:`heading2`,text:`Alternative: Prefix Hash Table`},{type:`paragraph`,text:`Since every node stores its full answer anyway, you can flatten the trie into a plain key-value map: prefix → top-K list. "t" → [true, try, toy], "tr" → [true, try, tree], and so on. Lookup is a single hash get, and it drops straight into Redis, DynamoDB or a static file per shard. The cost is storage: every prefix of every query is a key (~200M keys in our estimate), and the top-K lists are duplicated rather than shared. Cap the prefix length (e.g. 20 characters) to bound it.`},{type:`heading2`,text:`Other Options`},{type:`bullets`,items:[`Sorted array + binary search: sort all queries alphabetically; the completions of a prefix form one contiguous range found by two binary searches. Very compact, but you still need the top-K of that range — so combine with a precomputed top-K for short prefixes, or a range-max structure.`,`Search engine: Elasticsearch/OpenSearch offer an edge n-gram analyzer (index "t", "tr", "tre"... as tokens) and a completion suggester (an in-memory FST). Great when you also need fuzziness, filters per category and you already run a cluster; less control over latency than a purpose-built in-process trie.`,`Hybrid: a trie or prefix table for the global top-K, plus a small per-user store for personalised recent searches merged at serve time.`]},{type:`heading2`,text:`Snapshot Build and Atomic Swap (Blue/Green)`},{type:`paragraph`,text:`The serving index is immutable. Instead of mutating a live trie under concurrent reads (locks, partial states), each server loads the new snapshot into a second buffer while the old one keeps serving, validates it, then flips a single reference. In-flight requests finish on the old index; new requests see the new one. Rolling back is flipping the pointer back.`},{type:`flow`,title:`Blue/green index swap on a server`,code:`sequenceDiagram
  participant B as Index Builder
  participant O as Snapshot store
  participant R as Index Registry
  participant S as Suggestion Service
  B->>O: upload snapshot v42 + checksum
  B->>R: mark v42 ready
  R--)S: notify new version
  S->>O: download v42 in background
  S->>S: load into standby buffer, still serving v41
  S->>S: sanity checks - size, golden prefixes
  alt checks pass
    S->>S: atomically swap pointer to v42
    S->>S: free v41 after in-flight requests drain
  else checks fail
    S->>S: discard v42, keep v41, alert
  end`,text:`Roll out to a canary group first. "Golden prefix" checks compare a few hundred known prefixes against expected results to catch broken builds.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Replicate First, Shard Later`},{type:`paragraph`,text:`At ~5–20 GB the index fits on one machine, so the simplest scalable design is full replication: every Suggestion Service holds the whole index and any replica can answer any prefix. Read QPS scales linearly by adding replicas. Shard only when the index outgrows a machine — many languages, regional indexes, or much larger vocabularies.`},{type:`heading2`,text:`Sharding by Prefix`},{type:`bullets`,items:[`Naive range sharding by first letter (a–f, g–m, ...) is badly unbalanced: far more queries start with "s" or "c" than with "x" or "q", in both data size and traffic.`,`Better: compute split points from the real distribution of queries and traffic, e.g. one shard for "sa–sh", another for "si–sz", while "u–z" share a shard. Store the range map in the registry and rebalance at each build.`,`For a prefix hash table, hash sharding on the full prefix key spreads keys evenly, but very hot single keys ("a", "s") still need replication or edge caching.`,`A request router (or the gateway) looks up the shard for the prefix; each shard has several replicas for throughput and availability.`]},{type:`flow`,title:`Sharding by prefix ranges sized by traffic`,code:`flowchart TB
  RQ([GET suggest q='sho']):::client --> RT[Shard router<br/>range map from registry]:::network
  RT -->|"'a'-'c'"| S1[Shard 1]:::server
  RT -->|"'sa'-'sh'"| S2[Shard 2 - hot]:::highlight
  RT -->|"'si'-'sz'"| S3[Shard 3 - hot]:::highlight
  RT -->|"'t'-'z'"| S4[Shard 4]:::server
  S2 --- R2A[(replica)]:::cache
  S2 --- R2B[(replica)]:::cache
  S3 --- R3A[(replica)]:::cache`,text:`Splitting by traffic, not by alphabet, keeps each shard equally busy. Hot ranges also get extra replicas.`},{type:`heading2`,text:`Caching Layers`},{type:`bullets`,items:[`Browser/app cache: the client keeps responses keyed by prefix for the session; backspacing to "ho" never hits the network again.`,`CDN edge: short prefixes are few and extremely hot — there are only 26³ ≈ 17.6K three-letter Latin prefixes. Caching them with max-age of a few minutes absorbs a large share of global traffic.`,`Redis (optional): when the index lives in a separate store (prefix hash table), a Redis cluster in front absorbs the hot keys — see the Distributed Cache design.`,`Personalised responses must be marked Cache-Control: private, or the CDN will show one user's history to another.`,`Short TTLs are acceptable because suggestions tolerate staleness; trending queries just appear a few minutes later at the edge.`]},{type:`flow`,title:`Each layer absorbs traffic before the next`,code:`flowchart LR
  K([21K peak req/s]):::client --> BC[Browser cache<br/>repeat prefixes]:::cache
  BC -->|"remaining"| CDN[CDN edge<br/>hot short prefixes]:::network
  CDN -->|"long-tail prefixes"| SVC[Suggestion replicas<br/>in-memory trie]:::server
  SVC -.->|"only for personalised"| P[(Per-user<br/>recent searches)]:::db`,text:`How much each layer absorbs depends on your traffic shape — measure hit ratios per layer rather than assuming. See How Caching Works for TTL and invalidation basics.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Fail Fast, Fail Silent`},{type:`paragraph`,text:`Autocomplete is an enhancement: the user can always press Enter and search. So the worst outcome is not "no suggestions" — it is a slow suggestion service that makes typing feel laggy or blocks the search box. Every layer should time out quickly and return an empty list rather than wait.`},{type:`bullets`,items:[`Tight timeouts: gateway → service timeout of ~50 ms; client ignores responses that arrive after the user typed more.`,`Return empty or partial results on error with HTTP 200, so the client just hides the dropdown.`,`Circuit breaker for optional dependencies (personalisation store): if it is slow, serve global suggestions only.`,`Serve stale over nothing: the CDN can use stale-while-revalidate / stale-if-error to keep serving cached prefixes during an outage.`,`Load shedding: under overload, drop requests for long prefixes first (rarely cached, lower value) and keep short prefixes flowing.`]},{type:`flow`,title:`Degrading gracefully`,code:`flowchart TD
  REQ([Suggest request]):::client --> E{CDN has it?<br/>even stale}
  E -->|Yes| OK([Return suggestions]):::highlight
  E -->|No| S{Service answers<br/>within 50 ms?}
  S -->|Yes| P{Personalisation<br/>store healthy?}
  P -->|Yes| OK
  P -->|"No - breaker open"| G[Global top-K only]:::server --> OK
  S -->|"No - slow or down"| EMPTY([Empty list, hide dropdown<br/>user keeps typing]):::external`,text:`Every failure path ends in a fast response. Users rarely notice missing suggestions; they always notice a laggy text box.`},{type:`heading2`,text:`Stale Data Is Acceptable`},{type:`bullets`,items:[`If the pipeline fails, servers keep the last good snapshot. Suggestions an hour or a day old are still useful.`,`Alert when the snapshot age exceeds a threshold (e.g. > 6 hours), but do not page for a single failed build.`,`Keep the last N snapshots in object storage so a bad build can be rolled back in seconds.`,`New replicas boot by downloading the current snapshot; mark them ready only after it is loaded (readiness probe).`]},{type:`heading2`,text:`Pipeline Reliability`},{type:`bullets`,items:[`Kafka retains query logs for several days, so a crashed aggregator can replay and recompute.`,`Batch jobs are idempotent: recomputing an hour's counts overwrites the same output partition.`,`Builds are validated before publish (size within ±20% of the last build, golden prefixes, no blocked terms) so a corrupt input never reaches users.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Latency Budget`},{type:`paragraph`,text:`The ~100 ms target is for the whole round trip as the user perceives it. Most of it is spent outside our servers, which is why the server must be very fast and why edge caching matters so much.`},{type:`flow`,title:`Where the 100 ms goes`,code:`flowchart LR
  A["Debounce wait<br/>~50-150 ms, by design"]:::client --> B["Network RTT<br/>~20-60 ms"]:::network
  B --> C["LB + routing<br/>~1-2 ms"]:::network
  C --> D["Trie lookup<br/>microseconds"]:::highlight
  D --> E["Serialise + send<br/>~1 ms"]:::server
  E --> F["Render dropdown<br/>~5-10 ms"]:::client`,text:`Server P99 target: under ~10 ms. Edge caching removes most of the network leg for popular prefixes; serving from the nearest region removes the rest.`},{type:`heading2`,text:`Making the Read Path Fast`},{type:`bullets`,items:[`Keep the index in process memory — no network hop to a database or even Redis on the hot path.`,`Compact representation: store query IDs instead of strings in top-K lists, use arrays instead of hash maps for children, or a compressed trie (radix tree) that merges single-child chains.`,`Pre-serialise: store each node's top-K as ready-to-send JSON bytes to skip serialisation work.`,`Limit the indexed prefix length (e.g. 20–30 characters): longer prefixes are rare and can fall back to a slower search.`,`Serve from multiple regions so users are close to a replica.`]},{type:`heading2`,text:`Client Side (Briefly)`},{type:`paragraph`,text:`The frontend owns a big share of the load and the perceived speed: debouncing, dropping repeated queries, cancelling stale requests, caching by prefix and accessible keyboard navigation. Those details are covered in the Frontend System Design answer "How would you design an autocomplete (type-ahead) search component?" — here we only assume the client sends a debounced prefix and tolerates empty responses.`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Trie vs Prefix Hash Table vs Search Engine`},{type:`bullets`,items:[`In-memory trie: smallest memory thanks to shared prefixes, microsecond reads, full control. But: custom code, the index must fit in one process (or you shard), and it is rebuilt rather than updated.`,`Prefix hash table (prefix → top-K): dead simple, works with any KV store, easy to shard by hash. But: more storage (every prefix is a key with its own list) and still needs an offline builder.`,`Search engine (edge n-grams, completion suggester): fuzzy matching, filters and multi-field ranking out of the box. But: another cluster to run, higher and less predictable latency, less control over ranking.`,`Reasonable default for an interview: trie or prefix table built offline, served from memory, with a search engine mentioned for fuzzy/typo-tolerant needs.`]},{type:`heading2`,text:`Batch Rebuild vs Real-Time Updates`},{type:`bullets`,items:[`Batch (hourly/daily snapshots): simple, consistent, easy to validate and roll back, no write locks on the serving path. But: new queries appear with a delay.`,`Real-time (update counts in place): freshest results. But: concurrent writes on a hot read structure, lock contention, and decay or removals are hard to do incrementally.`,`Hybrid (recommended): batch snapshot for the long-term popular set plus a small streaming "trending" overlay that is merged at serve time and refreshed every minute.`]},{type:`flow`,title:`Hybrid freshness — merge a small fast layer at serve time`,code:`flowchart LR
  BS[("Base snapshot<br/>rebuilt hourly")]:::db --> M[Merge + re-rank<br/>top-K]:::server
  TL[("Trending overlay<br/>refreshed every minute")]:::cache --> M
  PU[("Personal recent searches<br/>optional")]:::cache --> M
  M --> OUT([Final top 10]):::highlight`,text:`The big structure changes slowly and safely; the small overlays carry everything that must be fresh.`},{type:`heading2`,text:`Precomputing Top-K vs Computing on Read`},{type:`paragraph`,text:`Precomputing top-K at every node costs memory (K entries per node) and makes K a build-time constant — asking for 20 results when you built with 10 is not possible without a rebuild. Computing on read keeps memory small but is too slow for short prefixes. Build with a slightly larger K than the UI shows (e.g. 15 for a 10-item dropdown) so serve-time filtering and personal merging still leave enough results.`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Filtering Offensive and Blocked Terms`},{type:`bullets`,items:[`Filter at build time: drop queries that match a blocklist, a toxicity classifier, or legal takedown lists, so they never enter the index.`,`Filter again at serve time with a small, hot-reloadable blocklist, so an urgent removal takes effect in seconds without waiting for the next build.`,`Suggestions are a product statement: a search engine "suggesting" something defamatory or harmful is far worse than the user typing it. Be conservative on short prefixes and names of people.`,`Never suggest queries containing personal data (emails, phone numbers, addresses) — strip them in the pipeline.`,`Require a minimum number of distinct users per query (not just raw count) so one person or a bot cannot push a phrase into everyone's suggestions.`]},{type:`flow`,title:`Two filters — slow and thorough, fast and urgent`,code:`flowchart LR
  Q[Candidate queries]:::server --> F1{"Build-time filter<br/>blocklist, classifier,<br/>PII, min distinct users"}:::security
  F1 -->|"pass"| IDX[(Snapshot)]:::db
  F1 -->|"drop"| X1[Excluded]:::external
  IDX --> F2{"Serve-time filter<br/>hot blocklist"}:::security
  F2 -->|"pass"| U([Shown to user]):::highlight
  F2 -->|"drop"| X2[Hidden immediately]:::external`,text:`The serve-time list is tiny and reloads in seconds; the build-time filter does the heavy, careful work.`},{type:`heading2`,text:`Multi-Language and Unicode`},{type:`bullets`,items:[`Normalise consistently at build and query time: Unicode NFKC, case folding, collapse whitespace. Decide whether accents fold ("cafe" matches "café").`,`Keep separate indexes per language/locale (or a language field in the key) — "pain" means bread in French.`,`CJK languages have no spaces and use input methods (IME); index by character and consider pinyin/romanised variants. The client should not send requests mid-composition.`,`Trie children keyed by Unicode code point (not UTF-16 unit) avoid splitting characters.`]},{type:`heading2`,text:`Typo Tolerance (Briefly)`},{type:`paragraph`,text:`A plain prefix trie only matches exact prefixes. Options: map common misspellings to the correct prefix at build time, search a bounded edit distance (1 typo) in the trie for longer prefixes only, or delegate to a search engine's fuzzy completion suggester. Keep it out of the hot path for 1–3 character prefixes, where it adds cost and little value.`},{type:`heading2`,text:`Abuse and Rate Limiting`},{type:`bullets`,items:[`Rate limit /suggest per IP or per session at the gateway (see the Rate Limiter design) — it is a cheap endpoint, so scrapers love it.`,`Bots trying to poison suggestions: count distinct users, discount repeated identical searches, and exclude traffic flagged as automated from the pipeline.`]},{type:`heading2`,text:`Monitoring`},{type:`bullets`,items:[`Serving: P50/P99 latency, QPS, error and timeout rate, empty-result rate, CDN hit ratio.`,`Quality: suggestion click-through rate, keystrokes saved per search, share of searches that used a suggestion.`,`Pipeline: snapshot age, build duration, build size delta, number of blocked terms filtered.`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`How to Scope It`},{type:`bullets`,items:[`Clarify: global suggestions only, or personalised too? How many results (K)? Languages? How fresh must trending queries be?`,`Clarify the split: "I'll focus on the backend \u2014 the index, ranking pipeline and serving. I'll assume the client debounces and caches."`,`State the core insight early: reads are huge and latency-critical, writes can be offline and delayed — so precompute everything.`]},{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`What data structure would you use, and what is the lookup complexity?`,`Why not just DFS the trie on every request?`,`How do you keep suggestions up to date with new and trending queries?`,`How do you update the index without affecting live traffic?`,`How would you shard the index, and what happens with hot prefixes like "s"?`,`How do you stop offensive or harmful suggestions?`]},{type:`heading2`,text:`Likely Follow-Ups`},{type:`bullets`,items:[`"Add personalisation." → Keep a small per-user store of recent searches (Redis, TTL of a few weeks); merge with global top-K at serve time; mark responses private so the CDN never caches them.`,`"Show breaking news within minutes." → Streaming aggregation with sliding windows and a trending overlay merged at serve time, rather than rebuilding the whole trie.`,`"Support 20 languages." → Per-locale indexes, consistent Unicode normalisation, possibly shard by language first, then by prefix.`,`"What about privacy of query logs?" → Hash or drop user IDs early, strip PII from queries, only index queries searched by many distinct users (k-anonymity style threshold), set a retention period on raw logs, and honour deletion requests.`,`"The suggestion service is down — what does the user see?" → Nothing breaks: the dropdown stays empty and search still works.`,`"Typo tolerance?" → Misspelling map at build time or a fuzzy completion suggester for longer prefixes.`]},{type:`flow`,title:`A 45-minute walkthrough`,code:`flowchart LR
  A[Scope<br/>K, freshness, languages]:::client --> B[Estimate<br/>~7K avg, ~21K peak QPS]:::client
  B --> C[Trie + top-K<br/>per node]:::highlight
  C --> D[Offline pipeline<br/>logs to snapshot]:::queue
  D --> E[Serve from memory<br/>replicas + CDN]:::server
  E --> F[Hot prefixes, filters,<br/>fallbacks, trade-offs]:::db`},{type:`heading2`,text:`Common Mistakes Candidates Make`},{type:`bullets`,items:[`Querying a database with LIKE 'prefix%' on every keystroke — too slow and wasteful at this QPS.`,`Describing a trie without precomputed top-K, then being unable to explain the latency for one-letter prefixes.`,`Updating the live index on every search instead of building snapshots offline.`,`Logging every keystroke as a "search" — only completed searches should feed popularity.`,`Forgetting filtering of offensive terms and privacy of query logs.`,`Making the search box wait for suggestions instead of failing silently.`]},{type:`callout`,variant:`important`,text:`The winning story is short: "Precompute top-K per prefix offline from query logs, ship it as an immutable snapshot, serve it from memory behind a CDN, and fail silently." Related designs worth reviewing: Distributed Cache (hot keys), News Feed (ranking), Rate Limiter (protecting the endpoint), plus the How Caching Works and Back-of-the-Envelope Estimation core concepts.`}]}]},{id:`chat-system`,title:`Chat / Messaging System`,icon:`ti-messages`,color:`#3b82f6`,bg:`#dbeafe`,accentGlow:`rgba(59,130,246,0.15)`,difficulty:`Intermediate`,tagline:`Real-time communication at scale — WebSockets, fan-out, message ordering, and offline delivery.`,tags:[`WebSockets`,`Fan-out`,`Message Ordering`,`Push Notifications`,`Long-polling`],estimatedTime:`60 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A real-time chat system like WhatsApp, Slack, or Facebook Messenger. It supports 1-on-1 messaging, group chats, online presence ("online" / "last seen"), message history, and push notifications for users who are offline.`},{type:`callout`,variant:`info`,text:`In simple terms: it is a postal service where every online user has a phone line held open to the post office. When a letter arrives for you, the post office reads it to you down that line instantly. If your line is down (you are offline), it files the letter in your mailbox and sends a text saying "you have mail". The hard part: there are thousands of post offices, and the sender and receiver are usually connected to different ones.`},{type:`flow`,title:`The big picture — keep a line open, route between servers`,code:`flowchart LR
  A([Alice's phone]):::client <-->|"WebSocket<br/>always open"| CS1[Chat Server 1]:::server
  CS1 -->|"1. save"| DB[(Message store)]:::db
  CS1 -->|"2. publish for Bob"| PS[[Pub-Sub / Queue]]:::queue
  PS -->|"3. Bob's server picks it up"| CS2[Chat Server 2]:::server
  CS2 <-->|"WebSocket"| B([Bob's phone]):::client
  PS -.->|"Bob offline?"| PN[Push notification<br/>APNs / FCM]:::external
  PN -.-> B`,text:`Alice and Bob are connected to different servers. Saving first means the message is never lost; the pub-sub layer carries it across to whichever server Bob is on.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`1-on-1 messaging with real-time delivery.`,`Group messaging (up to 500 members).`,`Message history — retrieve past messages paginated.`,`Online presence — know who is online.`,`Message delivery status: sent → delivered → read receipts.`,`Push notifications when the user is offline.`,`Media sharing (images, videos) — out of scope for core design, handled separately.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`500 million daily active users (DAU).`,`40 messages per user per day = 20 billion messages per day.`,`Message latency: < 100ms for online delivery.`,`Message persistence: stored for 5 years.`,`High availability (99.99%) — chat must work even during partial failures.`,`Message ordering must be maintained within a conversation.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`WebSockets`},{type:`paragraph`,text:`Plain HTTP is request-response: the server can only answer when the client asks, so it cannot push a new message on its own. A WebSocket is a connection that stays open and lets both sides send at any time. It starts as a normal HTTP request with an "Upgrade: websocket" header; once the server agrees, the same TCP connection becomes a two-way (full-duplex) channel.`},{type:`bullets`,items:[`The server can push messages to the client at any time.`,`Much lower overhead than repeated HTTP polling.`,`Maintains a persistent connection — requires connection management at scale.`,`Not supported in all network environments (firewalls may block WebSocket upgrades).`]},{type:`heading2`,text:`Long-Polling (Fallback)`},{type:`paragraph`,text:`The client sends an HTTP request. The server holds the request open until a message arrives (or a timeout of ~30 seconds). When a message arrives, the server responds and the client immediately sends another request. Simulates real-time without persistent connections. Higher latency and overhead than WebSockets but works everywhere.`},{type:`heading2`,text:`Server-Sent Events (SSE)`},{type:`paragraph`,text:`Server-to-client only. The server can push events over a single HTTP connection. Works through most firewalls. Ideal for notification feeds, live scoreboards, and other one-directional real-time streams. For bidirectional chat, use WebSockets.`},{type:`flow`,title:`Long-polling vs WebSocket`,code:`sequenceDiagram
  participant C as Client
  participant S as Server
  Note over C,S: Long-polling \u2014 a new request after every message
  C->>S: GET /messages (server holds it open)
  Note over S: waits up to 30 s...
  S-->>C: new message arrives \u2192 respond
  C->>S: GET /messages again (new request)
  Note over C,S: WebSocket \u2014 one handshake, then free-flowing
  C->>S: GET /chat with Upgrade websocket
  S-->>C: 101 Switching Protocols
  S-)C: message
  C-)S: message
  S-)C: typing indicator`,text:`Long-polling pays for a full HTTP request per message. A WebSocket pays once, then both sides talk freely over the same connection.`},{type:`heading2`,text:`Message Delivery Guarantees`},{type:`bullets`,items:[`At-most-once: Message sent once. If delivery fails, it is lost. Simplest, but messages can be dropped.`,`At-least-once: Message retried until acknowledged. Recipient may receive duplicates. Requires deduplication (idempotency).`,`Exactly-once: Message delivered exactly once, never duplicated. Most complex. Requires distributed transactions or idempotent consumers.`,`For chat: At-least-once with client-side deduplication (using message IDs) is standard (WhatsApp approach).`]},{type:`flow`,title:`At-least-once delivery + dedup by message ID`,code:`sequenceDiagram
  participant S as Chat Server
  participant B as Bob's app
  S->>B: msg id 901 "hi"
  B-->>S: ack 901 (lost on the network)
  Note over S: No ack within timeout - retry
  S->>B: msg id 901 "hi" (again)
  B->>B: Already have 901 - show once
  B-->>S: ack 901
  Note over S: Ack received - stop retrying`,text:`Retrying guarantees nothing is lost; the unique message ID guarantees the user never sees the same message twice.`},{type:`heading2`,text:`Message Ordering`},{type:`paragraph`,text:`In distributed systems, messages may arrive out of order. Solutions:`},{type:`bullets`,items:[`Sequence numbers: Each message in a conversation gets a monotonically increasing sequence number. Client reorders based on sequence.`,`Lamport timestamps: Logical clocks that capture causality. Message B that was sent after message A will always have a higher timestamp.`,`Snowflake IDs: Time-based unique IDs are sortable — messages with higher IDs were created later.`]},{type:`flow`,title:`Message status lifecycle`,code:`stateDiagram-v2
  [*] --> Sending: user taps send
  Sending --> Sent: server saved it (one tick)
  Sending --> Failed: no server ack
  Failed --> Sending: auto retry
  Sent --> Delivered: recipient device acked (two ticks)
  Delivered --> Read: recipient opened chat (blue ticks)
  Read --> [*]`,text:`Each tick is just an acknowledgement travelling back to the sender: from the server, then from the recipient's device, then from the recipient opening the conversation.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Core Components`},{type:`bullets`,items:[`Chat Servers: Handle WebSocket connections. Stateful — each server holds N persistent connections. Users connected to different chat servers need a way to exchange messages.`,`Message Queue / Pub-Sub (Kafka/Redis Pub-Sub): Decouples chat servers. Server A publishes a message to the queue. Server B (where recipient is connected) subscribes and delivers to recipient.`,`Message Store (Cassandra): Stores all messages persistently. Optimized for time-series data and high write throughput.`,`Presence Service: Tracks online/offline status for all users using a distributed cache.`,`Push Notification Service: Delivers notifications to offline users via APNs (iOS) / FCM (Android).`,`User Service / API Gateway: Authentication, user profiles, REST API for non-real-time operations.`,`Media Service: Handles image/video uploads separately via object storage (S3).`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  C([Mobile and web clients]):::client --> LB[Load Balancer]:::network
  LB -->|"WebSocket"| CS[Chat Servers<br/>stateful connections]:::server
  LB -->|"REST: login, profile, history"| API[API Gateway +<br/>User Service]:::server
  C -->|"upload media"| MS[Media Service]:::server --> S3[(Object storage S3)]:::db
  CS --> MQ[[Kafka / Redis Pub-Sub]]:::queue
  MQ --> CS
  CS --> MDB[(Cassandra<br/>messages)]:::db
  CS --> PR[Presence Service]:::server --> RC[(Redis<br/>last seen)]:::cache
  MQ -.->|"recipient offline"| PNS[Push Notification<br/>Service]:::external`,text:`Chat servers only hold connections. Everything that must outlive a connection — messages, presence, offline alerts — lives in separate services behind them.`},{type:`heading2`,text:`1-on-1 Message Flow`},{type:`numbered`,items:[`User A sends a message to User B via WebSocket connection to Chat Server 1.`,`Chat Server 1 stores the message in Cassandra and publishes it to Message Queue.`,`Chat Server 2 (where User B is connected) subscribes to User B's channel and receives the message.`,`Chat Server 2 delivers the message to User B via their WebSocket connection.`,`If User B is offline: Chat Server 2 sees no active connection; routes to Push Notification Service.`,`Delivery receipt flows back via the same path in reverse.`]},{type:`flow`,title:`1-on-1 message delivery (online vs offline)`,code:`sequenceDiagram
  actor A as Alice
  participant S1 as Chat Server 1
  participant DB as Cassandra
  participant Q as Pub-Sub
  participant S2 as Chat Server 2
  participant P as Push Service
  actor B as Bob
  A->>S1: send "hi" (client msg id)
  S1->>DB: store message
  S1-->>A: sent \u2713
  S1->>Q: publish to channel user:bob
  alt Bob online
    Q->>S2: deliver (S2 subscribes for Bob)
    S2->>B: push over WebSocket
    B-->>S2: delivered ack
    S2->>Q: receipt for Alice
    Q->>S1: receipt
    S1-->>A: delivered \u2713\u2713
  else Bob offline
    Q->>P: no live connection
    P->>B: "New message from Alice" notification
  end`,text:`Alice gets her first tick only after the message is safely stored. The second tick is a receipt that travels back the same way the message came.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Message Data Model (Cassandra)`},{type:`code`,lang:`sql`,code:`-- Cassandra table optimized for chat message retrieval
CREATE TABLE messages (
  conversation_id  UUID,
  message_id       TIMEUUID,   -- time-based UUID for ordering
  sender_id        UUID,
  content          TEXT,
  message_type     TEXT,       -- 'text', 'image', 'video'
  status           TEXT,       -- 'sent', 'delivered', 'read'
  created_at       TIMESTAMP,
  PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
-- Partition by conversation, cluster by time \u2192 
-- fast retrieval of latest messages in a conversation`},{type:`heading2`,text:`Fan-Out for Group Messages`},{type:`paragraph`,text:`When User A sends a message to a group of 100 members, how do all 100 members receive it?`},{type:`bullets`,items:[`Fan-out on Write (Push model): When A sends a message, immediately copy it to each member's message inbox. 100 writes immediately. Recipients just read their own inbox (1 read). Best for small groups.`,`Fan-out on Read (Pull model): Store the message once. Each recipient fetches the group's messages. 1 write. 100 reads per fetch. Best for large groups (celebrity problem solution).`,`Hybrid: Fan-out on write for small groups (<= 100). Fan-out on read for large groups. This is what Twitter, WeChat use.`]},{type:`flow`,title:`Group fan-out — push or pull?`,code:`flowchart TD
  M([Alice posts to a group]):::client --> SAVE[(Store message once<br/>in group conversation)]:::db
  SAVE --> D{Group size?}
  D -->|"Small, 100 or fewer"| W[Fan-out on write:<br/>copy into each member's inbox]:::server
  W --> I1[(Inbox Bob)]:::cache
  W --> I2[(Inbox Carol)]:::cache
  W --> I3[(Inbox ...)]:::cache
  D -->|"Large, over 100"| R[Fan-out on read:<br/>members fetch when they open it]:::server
  R --> NOTIFY[[Light notify event:<br/>group has new messages]]:::queue`,text:`Small groups: pay with extra writes so every read is cheap. Huge groups: write once and let members pull, so one message does not cause thousands of writes.`},{type:`heading2`,text:`Presence Service Design`},{type:`bullets`,items:[`Each client sends a heartbeat to the Presence Service every 5 seconds.`,`Presence data stored in Redis: {userId → lastSeen timestamp}.`,`If lastSeen > 30 seconds ago → OFFLINE. Within 30s → ONLINE.`,`When a user connects/disconnects, publish a presence event to subscribers (friends/contacts).`,`Presence data is soft-state — it is acceptable to lose it on failure and rebuild via heartbeats.`]},{type:`flow`,title:`Presence from heartbeats`,code:`flowchart LR
  C([Bob's app]):::client -->|"heartbeat every 5 s"| PS[Presence Service]:::server
  PS -->|"SET lastSeen bob = now"| R[(Redis)]:::cache
  Q([Alice opens chat]):::client -->|"is Bob online?"| PS
  PS --> T{now \u2212 lastSeen<br/>under 30 s?}
  T -->|Yes| ON([Online]):::highlight
  T -->|No| OFF(["Last seen 10:42"]):::external
  PS -.->|"status changed"| SUB[[Notify Bob's contacts]]:::queue`,text:`Nobody has to announce going offline — silence is the signal. That also handles phones that lose signal or crash without saying goodbye.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`WebSocket Connection Scaling`},{type:`paragraph`,text:`A single chat server can maintain ~50,000 concurrent WebSocket connections. For 500M DAU with ~10% online simultaneously = 50M connections → 50M / 50K = 1,000 chat servers.`},{type:`bullets`,items:[`A load balancer routes each user's initial WebSocket handshake to a chat server (sticky sessions based on user ID or consistent hashing).`,`The load balancer keeps track of which server each user is on. When a message arrives, route it to the correct server.`,`Or: Use a Service Registry (e.g., etcd). Chat servers register their connected users. Other servers can look up "which server is User B connected to?"`]},{type:`flow`,title:`Scaled-out connection layer`,code:`flowchart TB
  U([~50M online users]):::client --> LB[Load Balancer<br/>sticky by user ID]:::network
  subgraph Chat["~1,000 chat servers, ~50K connections each"]
    C1[Chat Server 1]:::server
    C2[Chat Server 2]:::server
    C3[Chat Server N]:::server
  end
  LB --> C1 & C2 & C3
  C1 & C2 & C3 -->|"register: bob is on server 2"| REG[(Service registry<br/>etcd or Redis)]:::cache
  C1 & C2 & C3 <--> MQ[[Kafka / Pub-Sub cluster]]:::queue
  MQ --> CAS[(Cassandra cluster<br/>partitioned by conversation_id)]:::db`,text:`Connections are spread across many servers; the registry answers "where is Bob right now?", and pub-sub carries messages between servers.`},{type:`heading2`,text:`Cassandra Scaling`},{type:`bullets`,items:[`20 billion messages/day = ~230K writes/second.`,`Cassandra is designed for this. Write path is a sequential log (CommitLog + MemTable).`,`Partition by conversation_id. A conversation's messages always go to the same Cassandra partition (good for hot conversations — but with replication, distributed across nodes).`,`Add more Cassandra nodes to scale linearly.`]}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Message Durability`},{type:`bullets`,items:[`Messages are written to Cassandra BEFORE delivery is confirmed. Never confirm delivery before persistence.`,`Cassandra replication factor = 3. Message survives loss of up to 2 nodes.`,`Message queue (Kafka) provides durability during transit: messages are persisted on Kafka brokers before being delivered to consumers.`]},{type:`heading2`,text:`Handling Chat Server Failure`},{type:`bullets`,items:[`When a chat server goes down, all its WebSocket connections are lost.`,`Clients detect the connection drop and automatically reconnect to a new chat server.`,`The new server re-registers the user in the Service Registry.`,`Missed messages: On reconnection, the client sends its last received message_id. The server fetches and delivers all messages with higher IDs.`]},{type:`flow`,title:`Chat server crash — reconnect and catch up`,code:`sequenceDiagram
  participant B as Bob's app
  participant S2 as Chat Server 2
  participant S7 as Chat Server 7
  participant REG as Registry
  participant DB as Cassandra
  S2-xB: connection drops (server crashed)
  B->>B: wait with backoff, then reconnect
  B->>S7: WebSocket connect + last id 901
  S7->>REG: bob is now on server 7
  S7->>DB: messages after 901
  DB-->>S7: 902, 903, 904
  S7->>B: deliver 902 to 904
  Note over B: Back in sync \u2014 nothing lost`,text:`Because every message is stored before delivery, a crashed server only loses connections, never messages. The client's "last id I saw" is all that is needed to catch up.`},{type:`heading2`,text:`Offline Message Delivery`},{type:`bullets`,items:[`Messages are stored in Cassandra regardless of recipient status.`,`When the recipient comes online, the client fetches all unread messages (those with status ≠ "delivered") from their conversation history.`,`Push notifications serve as the signal that a message is waiting — not as the message delivery mechanism itself.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Message Throughput Optimization`},{type:`bullets`,items:[`Batching: Accumulate multiple messages in a 50ms window and write to Cassandra in a batch. Reduces write amplification.`,`Async writes: Write to message queue (Kafka) synchronously (fast). Write to Cassandra asynchronously. Trade: slight risk of message loss if Kafka fails before Cassandra write. Mitigate with Kafka replication.`,`Read optimization: Cache the last 20 messages of each active conversation in Redis. 80% of reads are for recent messages.`]},{type:`heading2`,text:`Pagination for Message History`},{type:`paragraph`,text:`Use cursor-based pagination for message history. The client receives a cursor (last message_id received). Next request: GET /messages?conversationId=X&before=<cursor>&limit=20. The server fetches 20 messages with message_id < cursor. This is efficient — no OFFSET scans, no out-of-range issues.`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`WebSockets vs. Long-Polling`},{type:`bullets`,items:[`WebSockets: Lower latency, lower server resource usage (persistent connection). Requires WebSocket support (most firewalls OK now). Connection state is more complex.`,`Long-Polling: Universal compatibility. Higher latency (~1-2s). Each poll creates a new HTTP request — more overhead. Easier to implement and debug.`,`Recommendation: WebSockets as default, Long-Polling as fallback.`]},{type:`heading2`,text:`Fan-Out on Write vs. Read`},{type:`bullets`,items:[`Fan-out on write: Recipient always reads from their own pre-populated inbox (fast reads). But: sending to a 1000-person group requires 1000 writes — expensive for large groups.`,`Fan-out on read: One write regardless of group size. But: reading the group timeline requires aggregating across all members.`,`The hybrid approach is the industry standard. Define the threshold (e.g., 100 members) empirically based on your read-to-write ratio.`]}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Monitoring`},{type:`bullets`,items:[`Track: message delivery latency (P50, P95, P99), WebSocket connection count per server, message queue lag, push notification delivery rate.`,`Alert: If message delivery P99 > 500ms, queue consumer lag > 10 seconds, or push notification failure rate > 1%.`]},{type:`heading2`,text:`Regulatory Compliance`},{type:`bullets`,items:[`End-to-end encryption (E2EE): Messages encrypted on sender's device, decrypted only on recipient's device. Even the server cannot read content.`,`Message retention policies: Legal requirements vary by country. Allow configurable retention (e.g., delete after 30 days).`,`Right to deletion: GDPR compliance — users can request deletion of all their messages.`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How would you deliver a message to a user who is connected to a different server than the sender?`,`How do you handle message ordering in a distributed chat system?`,`Design the fan-out mechanism for group messages in a group of 10,000 users.`,`How do you show online presence for 500M users without querying the database on every check?`,`How would you implement message read receipts?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`WebSockets for real-time, but mention Long-Polling as fallback.`,`Message queue (Kafka/Redis Pub-Sub) for cross-server delivery — this is the non-obvious part that distinguishes good answers.`,`Cassandra for message storage because of its write throughput and time-series query pattern.`,`Fan-out on write for small groups, fan-out on read for large groups (hybrid).`,`At-least-once delivery with client-side deduplication by message_id.`]},{type:`flow`,title:`A strong answer, step by step`,code:`flowchart LR
  A[Clarify<br/>1-on-1, groups, scale]:::client --> B[Real-time channel<br/>WebSocket + fallback]:::network
  B --> C[Cross-server delivery<br/>pub-sub]:::highlight
  C --> D[Storage<br/>Cassandra by conversation]:::db
  D --> E[Groups, presence,<br/>offline push]:::server
  E --> F[Failures, ordering,<br/>dedup]:::security`},{type:`callout`,variant:`important`,text:`The hardest part of a chat system interview is explaining how messages cross server boundaries. The answer: a message queue (or pub-sub). Users subscribe to their own channel. When a message arrives for them, any subscriber (chat server they are connected to) delivers it. This is the insight that separates good answers from great ones.`}]}]},{id:`notification-system`,title:`Notification System`,icon:`ti-bell`,color:`#ec4899`,bg:`#fce7f3`,accentGlow:`rgba(236,72,153,0.15)`,difficulty:`Intermediate`,tagline:`Async processing, Kafka pipelines, retry with backoff, and idempotency at massive scale.`,tags:[`Kafka`,`Idempotency`,`APNs/FCM`,`Retry Backoff`,`Async Processing`],estimatedTime:`50 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A notification system sends alerts to users over several channels: push notifications (mobile/web), email, and SMS. Other services in the company call it whenever something happens that a user should hear about — a new message, an order update, a promotion, a security alert.`},{type:`callout`,variant:`info`,text:`In simple terms: it is the company's mailroom. Any department drops off a note saying "tell user 42 their order shipped". The mailroom checks whether the user wants that kind of mail, writes it up nicely, and hands it to the right courier \u2014 Apple, Google, the email provider, or the SMS provider. If a courier is closed, it tries again later, and it keeps a log so the same note is never delivered twice.`},{type:`flow`,title:`The big picture — accept fast, deliver in the background`,code:`flowchart LR
  SVC([Order Service]):::client -->|"notify user 42:<br/>order shipped"| API[Notification API]:::server
  API -->|"202 Accepted<br/>right away"| SVC
  API --> Q[[Queue]]:::queue
  Q --> W[Channel workers]:::server
  W --> APNS[Apple APNs]:::external
  W --> FCM[Google FCM]:::external
  W --> EM[Email provider]:::external
  W --> SMS[SMS provider]:::external
  APNS & FCM & EM & SMS --> U([User's devices]):::client`,text:`The calling service never waits for Apple, Google, or an email provider. It hands the job to a queue and moves on; workers do the slow, failure-prone delivery work.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Support push notifications (iOS APNs, Android FCM), email (SendGrid/SES), and SMS (Twilio).`,`Send notifications reliably — no message should be permanently lost.`,`Support notification preferences — users can opt out of certain notification types.`,`Deduplication — the same notification should not be delivered twice.`,`Rate limiting — do not spam users with too many notifications in a short period.`,`Scheduling — support delayed notifications.`,`Analytics — track delivery, open, and click rates.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`10 million mobile push notifications per day.`,`1 million SMS per day.`,`5 million emails per day.`,`Soft real-time — most notifications should arrive within 10 seconds.`,`High availability — the system must be operational 99.9% of the time.`,`Scalable — can add more throughput without redesign.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Push Notification Delivery (APNs & FCM)`},{type:`bullets`,items:[`Apple Push Notification Service (APNs): Apple's server that delivers push notifications to iOS devices. Your backend sends a notification payload to APNs; Apple handles the "last mile" to the device.`,`Firebase Cloud Messaging (FCM): Google's equivalent for Android and web. Your backend sends to FCM; Google delivers to the device.`,`Device Token: A unique identifier for each app installation on a device. Your backend stores this token and uses it to address notifications.`,`Token expiry: Tokens can change (app reinstall, OS upgrade). Always handle invalid token errors from APNs/FCM and remove stale tokens.`]},{type:`flow`,title:`Where device tokens come from and how they are used`,code:`sequenceDiagram
  participant App as Mobile app
  participant OS as Apple or Google
  participant BE as Your backend
  participant W as Push worker
  App->>OS: Register for push
  OS-->>App: device token
  App->>BE: Save token for user 42
  Note over BE: Later, an event happens
  W->>OS: Send payload to token
  alt token valid
    OS->>App: Notification shown on device
  else token invalid (app uninstalled)
    OS-->>W: error: unregistered token
    W->>BE: delete stale token
  end`,text:`You never talk to the phone directly. Apple and Google own the "last mile"; your backend only needs the token, which acts like the phone's mailing address.`},{type:`heading2`,text:`Idempotency`},{type:`paragraph`,text:`An operation is idempotent if doing it twice has the same effect as doing it once — like pressing a lift button again: the lift still comes only once. For notifications, this means that if our system accidentally processes the same notification twice (which happens with retries), the user still receives it only once.`},{type:`bullets`,items:[`Generate a unique notification_id for every notification event.`,`Before processing, check if notification_id is in a "processed" store (Redis or DB).`,`If already processed, skip and acknowledge the queue message.`,`If new, process it and add notification_id to the processed store.`]},{type:`flow`,title:`Idempotency check before sending`,code:`flowchart TD
  M([Message from queue<br/>notification_id n-123]):::queue --> C{"SET notif:sent:n-123<br/>only if not exists"}:::cache
  C -->|"Set \u2014 first time"| SEND[Send via provider]:::server
  SEND --> ACK([Acknowledge message]):::highlight
  C -->|"Already exists \u2014 duplicate"| SKIP[Skip sending]:::external --> ACK`,text:`The check and the "mark as seen" happen in one atomic Redis command, so two workers racing on the same message cannot both send it.`},{type:`heading2`,text:`Retry with Exponential Backoff`},{type:`paragraph`,text:`When a third-party service (APNs, SendGrid) is temporarily unavailable, you must retry — but without hammering a service that is already struggling. Exponential backoff means each wait is double the last: 1s, then 2s, then 4s, then 8s… up to a maximum (e.g., 5 minutes). Also add jitter (a small random amount) to each wait. Otherwise thousands of failed messages would all retry at the exact same moment and knock the service over again (a "thundering herd").`},{type:`flow`,title:`Retry loop with backoff and a dead letter queue`,code:`flowchart TD
  S([Send attempt]):::server --> R{Provider response}
  R -->|"Success"| DONE([Log as sent]):::highlight
  R -->|"Permanent error<br/>e.g. invalid token"| DROP([Do not retry,<br/>clean up]):::external
  R -->|"Temporary error<br/>e.g. timeout, 503"| N{Attempts under 5?}
  N -->|Yes| WAIT["Wait 2^attempt s + jitter<br/>in retry queue"]:::queue --> S
  N -->|No| DLQ[[Dead Letter Queue<br/>for humans to inspect]]:::security`,text:`Only retry errors that might succeed later. Retrying a permanently bad request just wastes capacity.`},{type:`code`,lang:`typescript`,code:`function retryDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 300000; // 5 minutes
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add \xB125% jitter
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponential + jitter);
}
// attempt=0: ~1000ms, attempt=3: ~8000ms, attempt=7: ~128000ms`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components`},{type:`bullets`,items:[`Notification API: REST endpoint called by other services to trigger notifications. Validates, enriches (user preferences, device tokens), and publishes to message queue.`,`Message Queue (Kafka): Decouples notification production from consumption. Topics: notifications-push, notifications-email, notifications-sms.`,`Notification Workers: Consumers for each Kafka topic. Handles retry logic and third-party API calls.`,`Third-Party Services: APNs (iOS push), FCM (Android push), SendGrid/AWS SES (email), Twilio (SMS).`,`User Preferences Service: Stores user notification preferences. Called before sending to respect opt-outs.`,`Device Token Store: Maps user_id → [device_tokens]. Stored in a key-value store (Redis or DynamoDB).`,`Notification Log Store: Records every notification with its status for analytics and debugging.`,`Retry Queue: Failed notifications are placed here with a scheduled retry time.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  SVC([Internal services]):::client --> API[Notification API<br/>validate + enrich]:::server
  API --> PREF[(User preferences<br/>cached in Redis)]:::cache
  API --> TOK[(Device token store)]:::db
  API --> K[[Kafka topics<br/>push / email / sms]]:::queue
  K --> PW[Push workers]:::server --> APNS[APNs / FCM]:::external
  K --> EW[Email workers]:::server --> SES[SendGrid / SES]:::external
  K --> SW[SMS workers]:::server --> TW[Twilio]:::external
  PW & EW & SW -.->|"failed"| RQ[[Retry queue]]:::queue
  RQ -.-> K
  PW & EW & SW --> LOG[(Notification log<br/>+ analytics)]:::db`,text:`One topic and worker pool per channel, so a problem with SMS cannot block push or email.`},{type:`heading2`,text:`Notification Flow`},{type:`numbered`,items:[`Application Service (e.g., Order Service) calls POST /api/notifications with {userId, type: "push", template: "order_confirmed", data: {...}}`,`Notification API checks user preferences — does the user allow this notification type?`,`Fetch device tokens for the user from the Device Token Store.`,`Publish to Kafka topic: notifications-push with notification_id, userId, tokens, payload.`,`Push Notification Worker consumes from Kafka, calls APNs/FCM API.`,`On success: log delivery status. On failure: publish to retry queue with backoff delay.`,`Analytics service consumes all notification events for tracking.`]},{type:`flow`,title:`Sending one push notification`,code:`sequenceDiagram
  participant OS as Order Service
  participant API as Notification API
  participant P as Preferences
  participant K as Kafka
  participant W as Push Worker
  participant A as APNs
  OS->>API: POST /notifications (user 42, order_confirmed)
  API->>P: Does user 42 allow order updates?
  alt opted out
    P-->>API: no
    API-->>OS: 200 skipped
  else allowed
    P-->>API: yes + device tokens
    API->>K: publish to notifications-push
    API-->>OS: 202 Accepted
    K->>W: consume
    W->>A: send payload
    alt delivered
      A-->>W: 200
      W->>W: log status = sent
    else temporary failure
      A-->>W: 503
      W->>K: publish to retry queue with delay
    end
  end`,text:`The Order Service gets its answer before APNs is ever called — slow or failing providers never slow down the business flow.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Notification Data Model`},{type:`code`,lang:`sql`,code:`CREATE TABLE notifications (
  notification_id  UUID PRIMARY KEY,
  user_id          UUID NOT NULL,
  channel          VARCHAR(10) NOT NULL,  -- 'push', 'email', 'sms'
  template_id      VARCHAR(50),
  payload          JSONB,
  status           VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  retry_count      INT DEFAULT 0,
  scheduled_at     TIMESTAMP,
  sent_at          TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);`},{type:`heading2`,text:`Template Engine`},{type:`paragraph`,text:`Notifications use templates with placeholders (like {userName}) that are filled in at send time, instead of hard-coded text. This lets you translate messages and A/B test different wordings (send version A to some users and version B to others, then compare) without changing code.`},{type:`code`,lang:`json`,code:`// Template: order_confirmed
{
  "en": {
    "title": "Order #{orderId} Confirmed!",
    "body": "Hi {userName}, your order totaling \${amount} is confirmed.",
    "action": "view_order"
  },
  "es": {
    "title": "\xA1Pedido #{orderId} Confirmado!",
    "body": "Hola {userName}, tu pedido de \${amount} est\xE1 confirmado."
  }
}`},{type:`heading2`,text:`Deduplication Store`},{type:`paragraph`,text:`Use Redis with a short TTL (e.g., 24 hours) as the deduplication store.`},{type:`code`,lang:`typescript`,code:`async function processNotification(notifId: string, payload: any) {
  const dedupeKey = \`notif:sent:\${notifId}\`;
  const alreadySent = await redis.set(dedupeKey, '1', 'NX', 'EX', 86400);
  if (!alreadySent) {
    console.log('Duplicate notification, skipping:', notifId);
    return; // Already processed
  }
  // Process the notification...
  await sendPushNotification(payload);
}`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Kafka Partitioning`},{type:`paragraph`,text:`Partition Kafka topics by notification channel or user_id. With 10M notifications/day = ~116/second, a few Kafka partitions suffice. For 1B/day = 11,600/second, use more partitions and worker instances.`},{type:`heading2`,text:`Worker Auto-scaling`},{type:`paragraph`,text:`Monitor Kafka consumer lag — the number of messages waiting in the queue that workers have not processed yet. If lag grows, add more notification workers (more pod replicas in Kubernetes); when lag is low, remove some. This gives you capacity when you need it without paying for idle machines.`},{type:`flow`,title:`Scaling workers on queue lag`,code:`flowchart LR
  K[[Kafka topic<br/>12 partitions]]:::queue -->|"lag metric"| M[Autoscaler]:::network
  M --> D{Lag trend?}
  D -->|"Growing"| UP[Add worker pods<br/>up to 12 \u2014 one per partition]:::server
  D -->|"Near zero"| DOWN[Remove worker pods]:::server
  UP & DOWN --> K
  W[Workers] -.-> RL{{Per-provider<br/>token-bucket limiter}}:::security
  RL -.-> EXT[APNs / FCM / Twilio]:::external`,text:`Two limits matter: Kafka partitions cap how many workers can share a topic, and provider rate limits cap how fast all workers together may send.`},{type:`heading2`,text:`Third-Party API Rate Limits`},{type:`bullets`,items:[`APNs: No published rate limit but throttles under sustained high load.`,`FCM: 600,000 messages per minute per project.`,`Twilio SMS: Varies by account tier (typically 1 msg/sec for short codes).`,`SendGrid Email: Varies by plan (typically 100 emails/second on paid plans).`,`Use token bucket rate limiters per channel to stay within third-party limits.`]}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`At-Least-Once Delivery with Kafka`},{type:`paragraph`,text:`A Kafka consumer records its progress by committing an offset (a bookmark saying "I have handled everything up to here"). Workers commit only after a message is fully processed. If a worker crashes after sending but before committing, the message will be delivered again to another worker. The idempotency check then turns that second attempt into a harmless no-op.`},{type:`flow`,title:`Crash between send and commit`,code:`sequenceDiagram
  participant K as Kafka
  participant W1 as Worker 1
  participant R as Redis dedup
  participant A as APNs
  participant W2 as Worker 2
  K->>W1: message n-123 (offset 500)
  W1->>R: mark n-123 as sent
  W1->>A: send
  Note over W1: crashes before committing offset 500
  K->>W2: message n-123 again (offset 500)
  W2->>R: mark n-123 as sent?
  R-->>W2: already exists
  W2->>K: commit offset 500 (skip send)`,text:`At-least-once delivery from Kafka + idempotent workers = the user sees the notification exactly once.`},{type:`heading2`,text:`Dead Letter Queue (DLQ)`},{type:`paragraph`,text:`After N failed retries (e.g., 5), move the message to a Dead Letter Queue. DLQ messages are not automatically retried — they require manual investigation. Monitor DLQ size; a growing DLQ indicates a systemic problem with a channel (e.g., APNs is rejecting all messages).`},{type:`heading2`,text:`Graceful Handling of Third-Party Outages`},{type:`bullets`,items:[`APNs/FCM outage: Notifications accumulate in the retry queue. Deliver when the service recovers.`,`Kafka outage: Notification API writes fail. Use a local fallback queue (database table) to buffer events until Kafka recovers.`,`Circuit breaker: After 50% of APNs calls fail in 1 minute, open the circuit — stop calling APNs for 30 seconds, let all messages accumulate in the retry queue.`]},{type:`flow`,title:`Circuit breaker states for a provider`,code:`stateDiagram-v2
  [*] --> Closed
  Closed --> Open: 50% of calls fail in 1 min
  Open --> HalfOpen: after 30 s cool-down
  HalfOpen --> Closed: trial calls succeed
  HalfOpen --> Open: trial calls fail
  note right of Open
    No calls to the provider.
    Messages wait in the retry queue.
  end note`,text:`Closed = normal traffic. Open = stop calling a provider that is clearly down. Half-open = send a few test calls to see if it has recovered.`}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Batching Notifications`},{type:`bullets`,items:[`FCM and APNs support batch sending (up to 500 notifications per API call).`,`Accumulate notifications in a 100ms window, then batch-send. Dramatically reduces API calls and improves throughput.`,`Trade-off: Slight increase in notification latency (up to 100ms delay).`]},{type:`heading2`,text:`Priority Queues`},{type:`paragraph`,text:`Not all notifications are equally urgent. Use separate Kafka topics (or queue priorities):`},{type:`bullets`,items:[`Critical (security alerts, OTP codes): Immediate, no batching.`,`High (new messages, order updates): < 5 second delivery.`,`Normal (promotions, recommendations): < 60 second delivery.`,`Low (weekly digest, reports): Batch and send at scheduled times.`]},{type:`flow`,title:`Priority lanes`,code:`flowchart LR
  IN([New notification]):::client --> P{Priority?}
  P -->|"Critical: OTP, security"| T1[[critical topic]]:::security --> W1[Dedicated workers<br/>no batching]:::server
  P -->|"High: messages, orders"| T2[[high topic]]:::queue --> W2[Workers<br/>under 5 s]:::server
  P -->|"Normal: promotions"| T3[[normal topic]]:::queue --> W3[Batched workers<br/>under 60 s]:::server
  P -->|"Low: digests"| T4[[low topic]]:::queue --> W4[Scheduled batch jobs]:::server`,text:`Separate lanes mean a marketing blast of millions of promotions can never delay someone's login code.`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Synchronous vs. Asynchronous Notification Sending`},{type:`bullets`,items:[`Synchronous: Caller waits for notification to be delivered. Simple, but the caller's request is blocked by third-party latency (APNs: 50-200ms). Not scalable.`,`Asynchronous (recommended): Caller triggers notification by publishing to a queue and returns immediately. Workers process asynchronously. Caller sees fast response; notification delivered shortly after.`]},{type:`flow`,title:`Synchronous vs asynchronous sending`,code:`sequenceDiagram
  participant C as Checkout
  participant N as Notification Service
  participant Q as Queue
  participant A as APNs
  Note over C,A: Synchronous \u2014 checkout waits on Apple
  C->>N: notify
  N->>A: send (50 to 200 ms, or a timeout)
  A-->>N: ok
  N-->>C: done
  Note over C,A: Asynchronous \u2014 checkout returns immediately
  C->>N: notify
  N->>Q: enqueue
  N-->>C: 202 Accepted (few ms)
  Q->>A: worker sends shortly after`},{type:`heading2`,text:`Single Notification Service vs. Per-Channel Services`},{type:`bullets`,items:[`Single service: Simpler to deploy and monitor. Shared code. But: an APNs outage could affect email sending if not carefully isolated.`,`Per-channel microservices (PushService, EmailService, SmsService): Better isolation. Can scale independently. But: more services to manage.`,`Recommendation: Start with a single service with internal channel isolation. Split to microservices when channel-specific scale demands it.`]}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Analytics & Observability`},{type:`bullets`,items:[`Track: notification volume by channel, delivery success rate, delivery latency, open rate, click rate, unsubscribe rate.`,`A/B test notification templates — send different messages to subsets of users and measure engagement.`,`Spam detection: Flag users who unsubscribe frequently after notifications from a specific source.`]},{type:`heading2`,text:`User Preference Management`},{type:`bullets`,items:[`Store preferences in a database (user_id → notification_type → enabled/disabled).`,`Cache preferences in Redis (short TTL) for fast lookup during the notification flow.`,`Support global opt-out (no notifications at all) and per-type opt-out.`,`Respect quiet hours (e.g., do not send push notifications between 10pm and 8am in the user's timezone).`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How do you ensure a notification is delivered exactly once?`,`How would you design the retry mechanism for failed notifications?`,`How would you handle the scenario where APNs is down for 2 hours?`,`How do you handle user notification preferences at scale?`,`How would you scale the system from 1M to 1B notifications per day?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Kafka as the backbone for decoupling and reliability.`,`Idempotency with notification_id and Redis deduplication.`,`Retry with exponential backoff + jitter.`,`Dead Letter Queue for permanently failed notifications.`,`Priority queues for time-sensitive vs. bulk notifications.`,`Template engine for localization and A/B testing.`]},{type:`callout`,variant:`tip`,text:`Interviewers love depth on the reliability side of notification systems. Always bring up: idempotency, DLQ, exponential backoff, and third-party API rate limits. These show production engineering maturity.`}]}]},{id:`file-storage`,title:`File & Object Storage`,icon:`ti-cloud-upload`,color:`#f97316`,bg:`#ffedd5`,accentGlow:`rgba(249,115,22,0.15)`,difficulty:`Intermediate`,tagline:`CDN, chunked uploads, metadata databases, and eventual consistency — the building blocks of S3.`,tags:[`CDN`,`Chunked Upload`,`Presigned URLs`,`Object Storage`,`Eventual Consistency`],estimatedTime:`55 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A distributed object storage system like Amazon S3, Google Cloud Storage, or Dropbox. Users can upload, download, share, and manage files of any size. The system stores billions of objects reliably on cheap, ordinary ("commodity") servers.`},{type:`callout`,variant:`info`,text:`In simple terms: it works like a huge self-storage warehouse. The front desk (the API) checks your ID, writes your box into a ledger (the metadata database), and hands you a key card (a presigned URL). You then carry the box to the shelves yourself — the front desk never touches your stuff. Copies of every box are kept in other buildings so nothing is ever lost.`},{type:`flow`,title:`The big picture — a ledger plus a warehouse`,code:`flowchart LR
  U([User]):::client -->|"1. I want to upload"| API[API Service<br/>front desk]:::server
  API -->|"record name, owner, size"| META[(Metadata DB<br/>the ledger)]:::db
  API -->|"2. presigned URL"| U
  U ==>|"3. file bytes go direct"| ST[(Storage nodes<br/>the warehouse)]:::db
  ST -.->|"4. upload done event"| API
  V([Viewer]):::client -->|"download"| CDN[CDN edge]:::network
  CDN -->|"cache miss only"| ST`,text:`Two separate stores: a small, fast database that knows where every file is, and a giant, cheap store that holds the actual bytes. The API only ever touches the small one.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Upload files (any size, up to 5 GB per file).`,`Download files by key/URL.`,`Delete files.`,`List files in a namespace (bucket/folder).`,`File versioning — keep previous versions of a file.`,`Access control — public or private files, shared with specific users.`,`Presigned URLs — generate time-limited URLs for accessing private files.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`1 billion total objects stored.`,`10 PB of total data.`,`99.999999999% (11 nines) data durability — if you store 10 million files, you would expect to lose one roughly every 10,000 years.`,`99.99% availability.`,`Files must be retrievable within seconds.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Object Storage vs. Block Storage vs. File Storage`},{type:`bullets`,items:[`Object Storage: Each file is stored as a flat "object" — the bytes, some metadata, and a unique key. There are no real folders. Highly scalable and cheap. Examples: S3, Azure Blob. Best for images, videos, backups, large data.`,`Block Storage: Data stored in fixed-size blocks, just like a hard drive. Used by databases and operating systems. Low latency but expensive at scale. Examples: AWS EBS.`,`File Storage: A classic folder tree (directories, subdirectories). Familiar but harder to scale. Examples: NFS, AWS EFS.`]},{type:`flow`,title:`Three ways to store data`,code:`flowchart TB
  subgraph OBJ["Object storage - S3"]
    K1["photos/cat.jpg"]:::highlight --> O1[(bytes + metadata)]:::db
    K2["backups/2024.zip"]:::highlight --> O2[(bytes + metadata)]:::db
  end
  subgraph BLK["Block storage - EBS"]
    B1[Block 1]:::server --- B2[Block 2]:::server --- B3[Block 3]:::server
  end
  subgraph FS["File storage - NFS"]
    R["/home"]:::client --> D1["/home/docs"]:::client --> F1["report.pdf"]:::client
  end`,text:`Object storage is a flat key → object map (the "/" in a key is just part of the name). Block storage is a raw disk. File storage is the folder tree you know from your laptop.`},{type:`heading2`,text:`Chunked (Multipart) Upload`},{type:`paragraph`,text:`Uploading a 5 GB file as one HTTP request is risky — a single network hiccup means starting over from zero. Multipart upload cuts the file into chunks (e.g., 8 MB each) and uploads each chunk on its own, often several at once. If one chunk fails, only that chunk is retried. Once every part has arrived, the server stitches them back together.`},{type:`flow`,title:`Multipart upload — only the failed piece is retried`,code:`sequenceDiagram
  participant C as Client
  participant S as Storage Service
  C->>S: Start multipart upload
  S-->>C: uploadId
  par upload parts in parallel
    C->>S: PUT part 1 (8 MB)
    S-->>C: OK, etag 1
  and
    C->>S: PUT part 2 (8 MB)
    S--xC: network error
    C->>S: Retry part 2 only
    S-->>C: OK, etag 2
  and
    C->>S: PUT part 3 (8 MB)
    S-->>C: OK, etag 3
  end
  C->>S: Complete upload (list of etags)
  S->>S: Stitch parts into one object
  S-->>C: 200 object created`,text:`A failure costs you one 8 MB chunk, not the whole 5 GB file. The final "complete" call tells storage which parts to join and in what order.`},{type:`heading2`,text:`Content Delivery Network (CDN)`},{type:`paragraph`,text:`A CDN is a worldwide network of "edge" servers that keep copies of popular content close to users. Instead of a user in Tokyo downloading a file from a data center in Virginia (slow — the data crosses the planet), they download it from a CDN edge server in Tokyo (fast). CDNs are essential for serving static files, images, and videos at global scale.`},{type:`flow`,title:`How a CDN serves a file`,code:`flowchart LR
  T([User in Tokyo]):::client --> E{Tokyo edge<br/>has the file?}:::network
  E -->|"Yes - cache hit, ~10 ms"| T2([File delivered]):::highlight
  E -->|"No - cache miss"| O[(Origin storage<br/>Virginia)]:::db
  O -->|"~200 ms, once"| E2[Edge stores a copy]:::network
  E2 --> T2`,text:`Only the first request in a region travels to the origin. Everyone after that is served from the nearby edge copy.`},{type:`heading2`,text:`Presigned URLs`},{type:`paragraph`,text:`A presigned URL is a temporary, single-purpose link to a private object. It carries a cryptographic signature (proof that your backend approved it) and an expiry time. The storage service checks the signature and only allows access until the link expires — no permanent passwords or keys are ever handed to the client. Because clients upload and download directly with these links, the application backend never has to carry the file bytes itself.`},{type:`flow`,title:`Presigned URL — a signed, expiring permission slip`,code:`sequenceDiagram
  participant C as Client
  participant A as API Service
  participant S as Storage
  C->>A: Can I upload cat.jpg?
  A->>A: Check login and permissions
  A->>A: Sign (bucket, key, PUT, expires in 15 min) with secret key
  A-->>C: https://storage/cat.jpg?expires=...&signature=...
  C->>S: PUT file bytes to that URL
  S->>S: Recompute signature with the same secret
  alt signature valid and not expired
    S-->>C: 200 stored
  else tampered or expired
    S-->>C: 403 Forbidden
  end`,text:`Storage and the API share a secret key, so storage can verify the link on its own. Change any part of the URL (key, action, expiry) and the signature no longer matches.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Upload Flow`},{type:`numbered`,items:[`Client requests a presigned upload URL from the API Service: POST /api/files/upload-url`,`API Service validates auth, creates a file metadata record (status: pending), returns a presigned URL pointing to the Storage Service.`,`Client uploads the file bytes directly to the Storage Service using the presigned URL (bypassing the API Service).`,`Storage Service stores the file, notifies the API Service via an event (Kafka/SNS).`,`API Service updates the file metadata (status: active, size, checksum).`,`Client receives the file_id and can construct the CDN URL.`]},{type:`flow`,title:`Upload flow`,code:`sequenceDiagram
  actor C as Client
  participant A as API Service
  participant M as Metadata DB
  participant S as Storage Service
  participant Q as Event Queue
  C->>A: POST /api/files/upload-url
  A->>M: INSERT file (status = pending)
  A-->>C: presigned URL + file_id
  C->>S: PUT bytes via presigned URL
  S-->>C: 200 OK
  S--)Q: event: file uploaded (size, checksum)
  Q--)A: deliver event
  A->>M: UPDATE status = active, size, checksum
  C->>A: GET /api/files/file_id
  A-->>C: status active + CDN URL`,text:`The heavy part (the bytes) goes straight to storage. The API only does small, fast bookkeeping before and after.`},{type:`heading2`,text:`Download Flow`},{type:`numbered`,items:[`Client requests the file URL via GET /api/files/{fileId}.`,`API Service validates access permissions.`,`If public: Return the CDN URL. CDN serves from edge cache if present; otherwise fetches from origin (Storage Service).`,`If private: Generate and return a time-limited presigned CDN URL (e.g., valid for 1 hour).`]},{type:`flow`,title:`Download flow — public vs private`,code:`sequenceDiagram
  actor C as Client
  participant A as API Service
  participant CDN as CDN Edge
  participant S as Storage (origin)
  C->>A: GET /api/files/file_id
  A->>A: Check permissions
  alt public file
    A-->>C: plain CDN URL
  else private file
    A-->>C: presigned CDN URL (valid 1 hour)
  end
  C->>CDN: GET file
  alt cached at edge
    CDN-->>C: file bytes
  else not cached
    CDN->>S: fetch from origin
    S-->>CDN: file bytes
    CDN-->>C: file bytes (and keeps a copy)
  end`},{type:`heading2`,text:`Components`},{type:`bullets`,items:[`API Service: Handles auth, metadata, presigned URL generation. Stateless (keeps no per-user data in memory, so any instance can serve any request).`,`Storage Service (Data Nodes): Stores the actual file bytes across many ordinary servers, protected by erasure coding or replication.`,`Metadata Database: Stores facts about each file (name, size, owner, storage location, checksum). PostgreSQL or DynamoDB.`,`CDN: Cloudflare or AWS CloudFront for global file distribution.`,`Message Queue: Carries events between components (e.g., "file uploaded" → update metadata).`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  C([Clients]):::client --> LB[Load Balancer]:::network
  LB --> API[API Service<br/>auth, metadata, signing]:::server
  API --> MDB[(Metadata DB)]:::db
  API --> RC[(Redis<br/>metadata cache)]:::cache
  C ==>|"bytes via presigned URL"| SS[Storage Service<br/>data nodes]:::server
  C -->|"downloads"| CDN[CDN]:::network
  CDN -->|"miss"| SS
  SS -.->|"file uploaded event"| Q[[Message Queue]]:::queue
  Q -.-> API
  Q -.-> AV[Virus scan /<br/>thumbnails]:::external`,text:`Thick arrows carry file bytes and never pass through the API. Dotted arrows are asynchronous events that trigger follow-up work.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Erasure Coding for Durability (vs. Replication)`},{type:`paragraph`,text:`Simple replication keeps 3 full copies, so it needs 3× the storage. Erasure coding is smarter: Reed-Solomon 10+4, for example, splits the data into 10 data pieces ("shards") and computes 4 extra parity shards from them — a bit like the checksum digit on a credit card, but able to rebuild missing data. Any 10 of the 14 shards are enough to reconstruct the original, so up to 4 can be lost. That costs only 1.4× storage (vs. 3×) while giving equal or better durability.`},{type:`flow`,title:`Erasure coding 10 + 4`,code:`flowchart TB
  F[Original object]:::client --> SPLIT[Split into 10 data shards]:::server
  SPLIT --> ENC[Compute 4 parity shards<br/>Reed-Solomon]:::server
  ENC --> AZ1[(Zone A<br/>shards 1-5)]:::db
  ENC --> AZ2[(Zone B<br/>shards 6-10)]:::db
  ENC --> AZ3[(Zone C<br/>parity 1-4)]:::db
  AZ1 -.->|"any 10 of 14"| REB[Rebuild original<br/>even if 4 shards are lost]:::highlight
  AZ2 -.-> REB
  AZ3 -.-> REB`,text:`14 shards stored for 10 shards of data = 1.4× overhead. Spreading shards across zones means a whole disk, server, or even rack can fail without losing the file.`},{type:`bullets`,items:[`S3 uses Reed-Solomon erasure coding to achieve 11 nines of durability.`,`Data and parity shards are spread across different servers and availability zones.`,`Higher compute cost for encode/decode vs. simple replication.`]},{type:`heading2`,text:`Metadata Database Schema`},{type:`code`,lang:`sql`,code:`CREATE TABLE files (
  file_id       UUID PRIMARY KEY,
  bucket_id     UUID NOT NULL,
  owner_id      UUID NOT NULL,
  name          VARCHAR(1024),
  size_bytes    BIGINT,
  content_type  VARCHAR(255),
  checksum_md5  CHAR(32),
  storage_path  TEXT,          -- Internal path on storage nodes
  version       INT DEFAULT 1,
  status        VARCHAR(20) DEFAULT 'active', -- active, deleted, pending
  is_public     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);`},{type:`heading2`,text:`File Deduplication`},{type:`paragraph`,text:`If two users upload the same file, store only one copy. The trick is content-addressed storage: compute a hash (SHA-256) of the file content and use that hash as the storage key. Identical files always produce the same hash. If the hash already exists in storage, skip the upload and just create a new metadata record pointing to the existing bytes. This can dramatically reduce storage costs in consumer applications.`},{type:`flow`,title:`Deduplication with content hashes`,code:`flowchart TD
  UP[New upload]:::client --> H[Compute SHA-256<br/>of the content]:::server
  H --> Q{Hash already<br/>in storage?}
  Q -->|"Yes - same bytes exist"| LINK[Create metadata row<br/>pointing to existing blob]:::highlight
  Q -->|No| STORE[Store bytes<br/>under key = hash]:::db
  STORE --> LINK2[Create metadata row]:::server`,text:`Many metadata rows (one per user) can point at one stored blob. Delete the blob only when no metadata row references it any more.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Metadata Scaling`},{type:`bullets`,items:[`Shard (split) the metadata database by bucket_id or owner_id, so each database server holds only part of the data.`,`Use a dedicated metadata cluster — metadata is read and written far more often than the file bytes themselves.`,`Cache frequently accessed metadata in Redis.`]},{type:`heading2`,text:`Data Storage Scaling`},{type:`bullets`,items:[`Add storage nodes horizontally. Consistent hashing decides which node owns each object, and adding a node only moves a small slice of objects.`,`Use a distributed block storage layer (e.g., Ceph) under the hood.`,`Tiered storage: hot data on SSDs (expensive, fast), cold data on HDDs or archive storage (cheap, slow, high latency).`]},{type:`heading2`,text:`CDN Scaling`},{type:`paragraph`,text:`CDNs scale automatically by adding edge nodes globally. No action needed from the application side. Ensure cache-control headers are set correctly (max-age) to maximize CDN cache hit rates.`},{type:`flow`,title:`Scaled-out architecture`,code:`flowchart TB
  U([Users worldwide]):::client --> CDN[Global CDN edges]:::network
  U --> LB[Load Balancer]:::network
  LB --> A1[API 1]:::server & A2[API N]:::server
  A1 & A2 --> RC[(Redis metadata cache)]:::cache
  subgraph META["Metadata cluster - sharded by bucket_id"]
    M1[(Shard 1)]:::db
    M2[(Shard 2)]:::db
    M3[(Shard N)]:::db
  end
  RC -->|"miss"| META
  subgraph DATA["Storage nodes - consistent hashing"]
    HOT[(Hot tier<br/>SSD)]:::db
    COLD[(Cold tier<br/>HDD / archive)]:::db
  end
  CDN -->|"miss"| DATA
  U ==>|"presigned upload"| DATA
  HOT -. "lifecycle: ages out" .-> COLD`,text:`Metadata and data scale separately: metadata by sharding plus a cache, data by simply adding more storage nodes. Old files drift to cheaper storage over time.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Data Integrity — Checksums`},{type:`paragraph`,text:`A checksum is a short fingerprint of a file (MD5 or SHA-256). The client computes it before uploading. After storing the file, the storage service computes it again and rejects the upload if the two do not match — this catches bits that got flipped in transit. Storage nodes also re-check stored files periodically to catch disks that slowly corrupt data over time ("bit rot").`},{type:`flow`,title:`Checksums at upload time and at rest`,code:`flowchart TD
  C[Client computes checksum]:::client --> UP[Upload bytes + checksum]:::network
  UP --> S[Storage recomputes checksum]:::server
  S --> M{Match?}
  M -->|Yes| OK[(Stored)]:::db
  M -->|No| ERR[Reject - client retries]:::security
  OK --> SCRUB[Background scrubber<br/>re-checks periodically]:::queue
  SCRUB --> BAD{Corrupted?}
  BAD -->|Yes| FIX[Rebuild from other<br/>replicas or shards]:::highlight
  BAD -->|No| OK`},{type:`heading2`,text:`Consistency Model`},{type:`bullets`,items:[`S3 offers strong read-after-write consistency since 2020: after a successful PUT, any GET will return the new version.`,`Before 2020, S3 was eventually consistent: a GET immediately after PUT might return the old version (or 404 if the object was new).`,`For your design: use a relational database (RDBMS) for metadata so it is always correct (strong consistency), and accept eventual consistency for the CDN — changed content can take seconds to minutes to reach every edge node.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Byte-Range Requests`},{type:`paragraph`,text:`HTTP lets you ask for just part of a file: GET /file with the header Range: bytes=0-1048576 fetches only the first 1 MB. This enables resumable downloads (continue from where you left off), video streaming (jump to a specific timestamp), and parallel downloading (fetch several parts at the same time).`},{type:`flow`,title:`Parallel download with byte ranges`,code:`sequenceDiagram
  participant C as Client
  participant S as Storage / CDN
  par fetch 3 ranges at once
    C->>S: GET Range bytes=0-99MB
    S-->>C: 206 Partial Content
  and
    C->>S: GET Range bytes=100-199MB
    S-->>C: 206 Partial Content
  and
    C->>S: GET Range bytes=200-299MB
    S--xC: connection dropped
    C->>S: GET Range bytes=200-299MB (resume)
    S-->>C: 206 Partial Content
  end
  C->>C: Join ranges into the full file`},{type:`heading2`,text:`Transfer Acceleration`},{type:`paragraph`,text:`Clients upload to the nearest CDN edge node, which then forwards the data to the storage origin over AWS's fast private backbone network instead of the public internet. This cuts upload latency for far-away clients by 50-80%.`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Replication vs. Erasure Coding`},{type:`bullets`,items:[`Replication: Simpler to implement, faster reads (read from nearest replica), higher storage cost (3× for a replication factor of 3).`,`Erasure Coding: Complex to implement, slower reads/writes (encode/decode CPU cost), much lower storage cost (1.4× for Reed-Solomon 10+4).`,`Use replication for frequently accessed, latency-sensitive data. Use erasure coding for cold or archival data where storage cost dominates.`]},{type:`flow`,title:`Choosing a durability strategy`,code:`flowchart TD
  Q{How is the data used?}
  Q -->|"Hot - read often,<br/>latency matters"| R[Replication x3<br/>fast reads, 3x storage]:::cache
  Q -->|"Cold - rarely read,<br/>cost matters"| E[Erasure coding 10+4<br/>1.4x storage, more CPU]:::db
  R -. "file ages, lifecycle policy" .-> E`},{type:`heading2`,text:`Upload via API vs. Direct to Storage`},{type:`bullets`,items:[`API proxy upload: Simple client code, API has full control. But: every byte flows through the API, so its bandwidth becomes a bottleneck and a cost.`,`Direct upload via presigned URL: Client uploads to storage directly, no API bandwidth cost. But: harder to validate files before storage.`,`Recommended: Direct upload with post-upload processing (metadata update, virus scan) triggered asynchronously.`]},{type:`flow`,title:`Proxy upload vs direct upload`,code:`flowchart LR
  subgraph PROXY["Proxy - API carries the bytes"]
    C1([Client]):::client ==>|"5 GB"| A1[API]:::server ==>|"5 GB"| S1[(Storage)]:::db
  end
  subgraph DIRECT["Direct - presigned URL"]
    C2([Client]):::client -->|"tiny request"| A2[API]:::server
    C2 ==>|"5 GB"| S2[(Storage)]:::db
    S2 -.->|"event: scan + update metadata"| A2
  end`,text:`With direct upload the API handles only small JSON requests, so a few API servers can support huge upload volumes.`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Security`},{type:`bullets`,items:[`Encrypt data at rest (AES-256).`,`Encrypt data in transit (TLS 1.2+).`,`Server-side encryption with customer-managed keys (BYOK — "bring your own key") for compliance.`,`Access logging: Record every download for audit trails.`,`Malware scanning: Run uploaded files through a virus scanner before making them accessible.`]},{type:`heading2`,text:`Cost Optimization`},{type:`bullets`,items:[`Lifecycle policies: Automatically move files from hot → warm → cold → archive storage as they age.`,`Intelligent tiering: Automatically move objects between tiers based on access frequency.`,`CDN caching: Reduce origin egress costs (the fee for data leaving your storage) — CDN-served requests are cheaper than origin-served.`]},{type:`flow`,title:`Lifecycle policy — data gets cheaper as it ages`,code:`flowchart LR
  H[Hot - SSD<br/>0-30 days]:::cache -->|"30 days"| W[Warm - infrequent access<br/>30-90 days]:::server
  W -->|"90 days"| CO[Cold - HDD<br/>90-365 days]:::db
  CO -->|"1 year"| AR[Archive - Glacier<br/>minutes to hours to read]:::external`}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How would you design a system that stores 1 billion files with 11 nines of durability?`,`How do you implement resumable uploads for large files?`,`How do you secure access to private files?`,`Explain erasure coding vs. replication.`,`How does a CDN work and where does it fit in your design?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Presigned URLs: upload directly from client to storage, bypass API layer.`,`Chunked upload for reliability (resume on failure).`,`Erasure coding for durability without 3× storage cost.`,`Content-addressed storage for deduplication.`,`Separate metadata and data stores — different access patterns, different scaling needs.`]},{type:`flow`,title:`How to walk through this design in an interview`,code:`flowchart LR
  A[Clarify<br/>file sizes, scale, durability]:::client --> B[Split metadata<br/>from file bytes]:::server
  B --> C[Upload path<br/>presigned + multipart]:::server
  C --> D[Download path<br/>CDN + presigned]:::network
  D --> E[Durability<br/>replication vs erasure coding]:::highlight
  E --> F[Scale + cost<br/>sharding, tiers, dedup]:::db`},{type:`callout`,variant:`tip`,text:`Emphasize that the API Service never handles actual file bytes — presigned URLs route uploads/downloads directly to/from the storage layer. This is a key insight that shows you understand how production object storage works.`}]}]},{id:`news-feed`,title:`News Feed / Social Media Feed`,icon:`ti-layout-list`,color:`#8b5cf6`,bg:`#ede9fe`,accentGlow:`rgba(139,92,246,0.15)`,difficulty:`Advanced`,tagline:`Fan-out strategies, graph data, ranking algorithms, and infinite scroll pagination.`,tags:[`Fan-out on Write`,`Graph Database`,`Redis Sorted Sets`,`Ranking`,`Cursor Pagination`],estimatedTime:`65 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A social media news feed like Facebook's News Feed or Twitter's Home Timeline. When you open the app, you see a ranked, personalized list of recent posts from people and pages you follow. New posts appear in near real-time.`},{type:`callout`,variant:`info`,text:`In simple terms: think of every user having a personal mailbox. When someone you follow posts, the post office drops a note ("post #123 is new") into your mailbox ahead of time, so when you open the app your feed is already waiting. The one exception is celebrities — copying their posts into 50 million mailboxes is too much work, so you go and pick up their posts yourself when you open the app.`},{type:`flow`,title:`The big picture — write once, deliver to many mailboxes`,code:`flowchart LR
  A([Alice posts]):::client --> PS[Post Service]:::server
  PS --> DB[(Post Store<br/>full post saved once)]:::db
  PS -.->|"new post event"| FO[Fan-out workers]:::queue
  FO -->|"post ID"| F1[(Bob's feed)]:::cache
  FO -->|"post ID"| F2[(Carol's feed)]:::cache
  FO -->|"post ID"| F3[(Dan's feed)]:::cache
  B([Bob opens app]):::client --> FS[Feed Service]:::server
  F1 --> FS
  DB -->|"fill in post content"| FS`,text:`Writing a post happens rarely; reading feeds happens ~100× more often. So we do the extra work at write time to make every read cheap.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Users can post content (text, images, links).`,`Users can follow/unfollow other users.`,`Home timeline shows posts from followed users, ranked by relevance/time.`,`New posts appear in the feed within seconds.`,`Support infinite scroll pagination.`,`Posts can be liked, commented on, and shared.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`300 million DAU — daily active users (like Twitter).`,`Each user follows ~300 accounts on average.`,`1 million posts published per day.`,`Feed reads are 100× more frequent than writes.`,`Feed load time: < 200ms.`,`High availability — feeds must be readable even during partial outages.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Fan-out on Write (Push Model)`},{type:`paragraph`,text:`"Fan-out" means spreading one post out to many followers. With fan-out on write, the moment a user publishes a post, we copy the post ID into the feed list (the "inbox") of every follower. When a follower opens the app, their inbox is already filled in.`},{type:`bullets`,items:[`Reads are extremely fast — O(1): just read the ready-made feed.`,`Writes are expensive — 1 post from a user with 1M followers = 1M write operations.`,`Celebrity problem: A user with 1M followers causes 1M writes per post — can overwhelm the system.`,`Best for users with few followers.`]},{type:`heading2`,text:`Fan-out on Read (Pull Model)`},{type:`paragraph`,text:`With fan-out on read, nothing is prepared in advance. When a user opens their feed, we look up the recent posts of every account they follow, then merge and rank them on the spot.`},{type:`bullets`,items:[`Writes are cheap — just store the post once.`,`Reads are expensive — must query all followed accounts, merge, rank. If user follows 300 accounts, that is 300 queries.`,`Adding caching helps but the underlying approach is expensive at scale.`,`Best for celebrities (many followers) since write fan-out is impractical.`]},{type:`flow`,title:`Push vs pull — where the work happens`,code:`flowchart TB
  subgraph PUSH["Fan-out on write - push"]
    P1([Post]):::client --> W1[Copy post ID to<br/>every follower inbox]:::queue
    W1 --> I1[(Inbox 1)]:::cache & I2[(Inbox 2)]:::cache & I3[(Inbox N)]:::cache
    I1 --> R1([Read = 1 lookup]):::highlight
  end
  subgraph PULL["Fan-out on read - pull"]
    P2([Post]):::client --> S2[(Stored once)]:::db
    R2([Read feed]):::client --> Q2[Query all 300<br/>followed accounts]:::server
    Q2 --> S2
    Q2 --> M2[Merge + rank]:::server
  end`,text:`Push pays at write time (cheap reads). Pull pays at read time (cheap writes). Since reads outnumber writes 100 to 1, push wins for most users.`},{type:`heading2`,text:`Hybrid Approach (Industry Standard)`},{type:`paragraph`,text:`Use fan-out on write for regular users and fan-out on read for celebrities (e.g., users with > 10K followers). Regular users' posts are pushed into every follower's inbox. Celebrity posts are not pushed — they are fetched when a follower opens their feed and merged with the pre-built inbox.`},{type:`flow`,title:`Hybrid fan-out decision`,code:`flowchart TD
  P([New post]):::client --> Q{Author has more<br/>than 10K followers?}
  Q -->|"No - regular user"| PUSH[Push post ID into<br/>each follower inbox]:::queue
  Q -->|"Yes - celebrity"| SKIP[Skip fan-out<br/>store in author timeline only]:::db
  PUSH --> READ[Feed read]:::server
  SKIP -.->|"pulled at read time"| READ
  READ --> OUT([Merged, ranked feed]):::highlight`},{type:`callout`,variant:`tip`,text:`This is what Facebook, Twitter, and Instagram use. The threshold (10K followers) is tunable based on your system's performance characteristics.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components`},{type:`bullets`,items:[`Post Service: Accepts new posts, validates, stores in Post DB, triggers fan-out.`,`Fan-out Service: Reads new-post events from Kafka and writes the post IDs into each follower's feed inbox in Redis.`,`Graph Service: Stores who follows whom (the "social graph"). Kept as an adjacency list — for each user, a list of their followers — in Redis or a graph DB.`,`Feed Service: When a user asks for their feed, it reads their Redis inbox, fetches the full post for each post ID, ranks them, and returns one page.`,`Post Store (Cassandra): Stores post content, metadata. Partitioned by post_id.`,`Feed Store (Redis): Each user has a sorted set: {user_id} → [{post_id, score (timestamp)}]. Stores the most recent 1000 posts.`,`Ranking Service: Computes feed ranking scores based on recency, engagement, and user relationships.`,`Kafka: Event bus for decoupling post creation from fan-out — the Post Service drops an event and moves on, without waiting for the fan-out to finish.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  C([Mobile / Web]):::client --> LB[Load Balancer]:::network
  LB --> PS[Post Service]:::server
  LB --> FS[Feed Service]:::server
  PS --> PDB[(Post Store<br/>Cassandra)]:::db
  PS -.->|"new-posts topic"| K[[Kafka]]:::queue
  K -.-> FO[Fan-out Service]:::server
  FO --> GS[Graph Service<br/>who follows whom]:::server
  FO --> FD[(Feed Store<br/>Redis sorted sets)]:::cache
  FS --> FD
  FS --> PDB
  FS --> RK[Ranking Service]:::server
  FS --> GS`,text:`The write path (left) and read path (right) only meet at the Feed Store. Kafka means posting never waits for fan-out to finish.`},{type:`heading2`,text:`Post Creation Flow`},{type:`numbered`,items:[`User submits a post via POST /api/posts.`,`Post Service validates, stores post in Cassandra, publishes {postId, userId, timestamp} to Kafka topic "new-posts".`,`Fan-out Service consumes the event. Fetches the user's follower list from Graph Service.`,`For regular users: Write postId to each follower's Redis sorted set (score = timestamp).`,`Trim each user's sorted set to 1000 entries (remove oldest).`,`For celebrity users: Skip fan-out. Post is fetched at read time.`]},{type:`flow`,title:`Post creation flow`,code:`sequenceDiagram
  actor U as User
  participant PS as Post Service
  participant DB as Cassandra
  participant K as Kafka
  participant FO as Fan-out Service
  participant G as Graph Service
  participant R as Redis feeds
  U->>PS: POST /api/posts
  PS->>DB: INSERT post
  PS--)K: publish postId, userId, timestamp
  PS-->>U: 201 Created (poster sees it now)
  K--)FO: new-posts event
  FO->>G: Get followers of userId
  G-->>FO: follower IDs, follower count
  alt regular user (10K followers or fewer)
    loop each follower
      FO->>R: ZADD feed:follower timestamp postId
      FO->>R: Trim to newest 1000
    end
  else celebrity
    FO->>FO: Skip - pulled at read time
  end`,text:`The user gets their 201 response before fan-out even starts. Followers see the post a few seconds later.`},{type:`heading2`,text:`Feed Read Flow`},{type:`numbered`,items:[`User requests their feed: GET /api/feed?cursor=<lastPostId>`,`Feed Service reads the user's sorted set from Redis: get 20 post IDs from the sorted set after the cursor.`,`If user follows celebrities: additionally fetch their latest post IDs from the Graph Service.`,`Merge all post IDs, apply ranking score.`,`Batch-fetch full post data from Cassandra for the top 20 posts.`,`Return posts with next_cursor for pagination.`]},{type:`flow`,title:`Feed read flow`,code:`sequenceDiagram
  actor U as User
  participant FS as Feed Service
  participant R as Redis feed
  participant G as Graph Service
  participant RK as Ranking
  participant DB as Cassandra
  U->>FS: GET /api/feed?cursor=X
  FS->>R: 20 post IDs older than cursor
  R-->>FS: pushed post IDs
  opt user follows celebrities
    FS->>G: Latest post IDs of followed celebrities
    G-->>FS: celebrity post IDs
  end
  FS->>RK: Merge and score all IDs
  RK-->>FS: top 20 in ranked order
  FS->>DB: Batch get 20 posts
  DB-->>FS: full posts
  FS-->>U: 20 posts + next_cursor`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Redis Sorted Set for Feed Storage`},{type:`paragraph`,text:`A Redis sorted set is a list where every item has a number (its "score") and Redis keeps the list sorted by that score automatically. Using the post timestamp as the score gives each user a feed that is always in time order.`},{type:`code`,lang:`text`,code:`Key: "feed:{userId}"
Type: Sorted Set
Members: post IDs
Score: Unix timestamp of the post

Commands:
ZADD feed:{userId} {timestamp} {postId}  \u2192 Add post to feed
ZRANGE feed:{userId} 0 19 REV            \u2192 Get 20 most recent posts
ZRANGEBYSCORE feed:{userId} -{cursor} -inf REV LIMIT 0 20  \u2192 Cursor pagination
ZREMRANGEBYRANK feed:{userId} 0 -1001    \u2192 Trim to 1000 newest`},{type:`flow`,title:`What a feed sorted set looks like`,code:`flowchart LR
  K["feed:bob"]:::highlight --> E1["post 981<br/>score 1700000300"]:::cache
  E1 --> E2["post 975<br/>score 1700000200"]:::cache
  E2 --> E3["post 960<br/>score 1700000100"]:::cache
  E3 --> E4["... up to 1000 entries"]:::cache
  E4 -.->|"older ones trimmed"| X["dropped"]:::external`,text:`Newest first, capped at 1000 IDs. Each entry is just an ID plus a timestamp, so even 300M feeds fit in a Redis cluster.`},{type:`heading2`,text:`Ranking Algorithm`},{type:`paragraph`,text:`Pure chronological feeds are simple but users engage with them less. A ranking algorithm gives each post a score based on:`},{type:`bullets`,items:[`Recency: More recent posts scored higher.`,`Engagement: Posts with many likes/comments from your connections score higher.`,`Relationship strength: Posts from users you interact with frequently score higher.`,`Content type preference: If you always engage with videos, video posts score higher.`,`Practical: Use a simple scoring formula initially. Add ML-based ranking as the product matures.`]},{type:`flow`,title:`Turning signals into a ranking score`,code:`flowchart LR
  R[Recency]:::client --> S[Weighted score<br/>per post]:::server
  E[Engagement<br/>likes, comments]:::client --> S
  REL[Relationship<br/>strength]:::client --> S
  CT[Content type<br/>preference]:::client --> S
  S --> SORT[Sort candidates<br/>by score]:::server
  SORT --> TOP([Top 20 shown]):::highlight`,text:`Start with hand-tuned weights (e.g. score = engagement × relationship ÷ age). Later, an ML model can learn the weights from what users actually click.`},{type:`heading2`,text:`Post Data Schema (Cassandra)`},{type:`code`,lang:`sql`,code:`CREATE TABLE posts (
  post_id     TIMEUUID PRIMARY KEY,
  user_id     UUID,
  content     TEXT,
  media_urls  LIST<TEXT>,
  like_count  COUNTER,
  comment_count COUNTER,
  share_count COUNTER,
  created_at  TIMESTAMP
);`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Feed Store Scaling`},{type:`bullets`,items:[`Redis Cluster shards feed sorted sets by user_id. Each user's feed is on one Redis node — no cross-shard operations needed.`,`Store only post IDs (not full post content) in the feed. Post content fetched from Cassandra.`,`Limit feed inbox to 1000 posts. Older posts fetched directly from the Post Store when needed.`]},{type:`heading2`,text:`Fan-out Scaling`},{type:`bullets`,items:[`Fan-out Service scales horizontally. Add more Kafka consumers to handle higher post volume.`,`For high-follower users (100K+): fan-out is slow. Use a dedicated "high-follower fan-out" queue with more workers.`,`Asynchronous fan-out: The post is immediately visible to the poster. Followers see it within seconds as the fan-out completes.`]},{type:`flow`,title:`Scaled-out architecture`,code:`flowchart TB
  PS[Post Service]:::server -.-> K[[Kafka new-posts]]:::queue
  K -.-> NQ[[Normal fan-out queue]]:::queue
  K -.-> HQ[[High-follower queue<br/>100K+ followers]]:::queue
  subgraph Workers["Fan-out workers - auto-scaled on lag"]
    W1[Worker 1]:::server
    W2[Worker N]:::server
    WH[Extra workers<br/>for big accounts]:::server
  end
  NQ -.-> W1 & W2
  HQ -.-> WH
  subgraph Redis["Redis Cluster - sharded by user_id"]
    R1[(Feeds A-H)]:::cache
    R2[(Feeds I-P)]:::cache
    R3[(Feeds Q-Z)]:::cache
  end
  W1 & W2 & WH --> Redis
  FS[Feed Service x N]:::server --> Redis
  FS --> C[(Cassandra<br/>post content)]:::db`,text:`Each user feed lives on exactly one Redis shard, so a feed read is a single-node lookup. Big accounts get their own queue so they cannot delay everyone else.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Feed Reconstruction`},{type:`paragraph`,text:`Redis is a cache, so a user's feed can be lost (for example, when a Redis node fails). We can always rebuild it: ask the Graph Service who the user follows, fetch those accounts' recent posts from Cassandra, and re-create the sorted set. This is slow (seconds) but only happens after failures.`},{type:`heading2`,text:`Handling Kafka Fan-out Lag`},{type:`paragraph`,text:`"Consumer lag" is how far the fan-out workers are behind the newest Kafka events. If lag grows, followers see new posts late. Solutions:`},{type:`bullets`,items:[`Auto-scale fan-out workers based on Kafka consumer lag.`,`Fall back to on-demand fan-out: if the user's feed is more than 5 minutes stale, fetch from Post Store at read time.`,`Prioritize fan-out for users who are currently online (likely to view feed immediately).`]},{type:`flow`,title:`Serving a feed when things go wrong`,code:`flowchart TD
  REQ([Feed request]):::client --> H{Redis feed<br/>exists?}
  H -->|"No - node lost"| RB[Rebuild: followed users<br/>+ recent posts from Cassandra]:::db
  RB --> SAVE[Write new sorted set]:::cache --> OUT
  H -->|Yes| ST{Fan-out lag<br/>more than 5 min?}
  ST -->|No| OUT([Serve feed]):::highlight
  ST -->|"Yes - stale"| PULL[Pull recent posts at read time<br/>and merge]:::server --> OUT
  LAG[Kafka lag alarm]:::queue -.-> SCALE[Auto-scale<br/>fan-out workers]:::server`,text:`The pre-built feed is an optimisation, not the source of truth. Cassandra and the Graph Service can always produce a correct feed, just more slowly.`}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Infinite Scroll with Cursor Pagination`},{type:`paragraph`,text:`Do NOT use offset-based pagination (LIMIT 20 OFFSET 200). To skip 200 rows, the database still has to walk past all 200 of them, so every page is slower than the last. Use cursor-based pagination instead: the cursor is the score (timestamp) of the last post you saw, and the next page is simply "posts with score < cursor". With a sorted set that costs O(log N) no matter how deep you scroll. It also avoids duplicates or skipped posts when new posts arrive while you scroll.`},{type:`flow`,title:`Offset vs cursor pagination`,code:`sequenceDiagram
  participant C as Client
  participant F as Feed Service
  Note over C,F: Offset - gets slower page by page
  C->>F: page 11: LIMIT 20 OFFSET 200
  F->>F: walk past 200 rows, then return 20
  Note over C,F: Cursor - same speed on every page
  C->>F: GET /feed (first page)
  F-->>C: 20 posts + next_cursor = 1700000100
  C->>F: GET /feed?cursor=1700000100
  F->>F: jump straight to score below cursor
  F-->>C: next 20 posts + new cursor`},{type:`heading2`,text:`Multi-Level Caching`},{type:`bullets`,items:[`L1 Cache: Pre-computed feed in Redis (post IDs only). Serves 95% of feed requests.`,`L2 Cache: Cassandra serves full post data with post_id lookups. Hot posts also cached in Redis.`,`CDN: Static media (images, videos in posts) served from CDN edge nodes.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Chronological vs. Ranked Feed`},{type:`bullets`,items:[`Chronological: Predictable, fair, no algorithmic filtering. Users see everything from followed accounts in order. Simple to implement.`,`Ranked: Higher engagement (users see most relevant content first). But: users may miss important posts. Requires complex ranking infrastructure. Creates concerns about algorithmic bias.`,`Product decision: Many platforms are reverting to chronological feeds due to user preference.`]},{type:`heading2`,text:`Storing Post IDs vs. Full Posts in Feed`},{type:`bullets`,items:[`Post IDs only (indirection): Feed is small (post IDs are ~16 bytes). Post content fetched on demand. Feed does not go stale when post is edited.`,`Full post snapshots: No additional DB lookup for feed render. But: feed can contain stale content if post is edited. Storage cost is much higher.`]},{type:`flow`,title:`Post IDs vs full posts in the feed`,code:`flowchart LR
  subgraph IDS["Store IDs - recommended"]
    F1[(Feed: 981, 975, 960)]:::cache --> P1[(Post Store)]:::db
    ED1[Post edited]:::client --> P1
    P1 --> V1([Reader sees latest text]):::highlight
  end
  subgraph FULL["Store full copies"]
    F2[(Feed: full post text<br/>x every follower)]:::cache --> V2([Reader may see old text]):::security
    ED2[Post edited]:::client -.->|"must update millions of copies"| F2
  end`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Content Moderation`},{type:`bullets`,items:[`Filter prohibited content before publishing (image/text classification).`,`Shadowbanning: Keep content in the poster's view but exclude from other users' feeds.`,`Report + review workflow: Users report content, human moderators review flagged posts.`]},{type:`heading2`,text:`Privacy & Feed Integrity`},{type:`bullets`,items:[`When a user blocks another, remove blocked user's posts from the requester's feed.`,`When a post is deleted, remove post ID from all feed inboxes (fan-out deletion — expensive for popular posts).`,`When a user unfollows, remove their posts from the follower's feed (fan-out on unfollow).`]},{type:`flow`,title:`Keeping feeds clean after deletes, blocks and unfollows`,code:`flowchart TD
  D[Post deleted]:::client --> T[Mark post as deleted<br/>in Post Store]:::db
  T --> FD[Feed Service skips it<br/>immediately on read]:::server
  T -.-> BG[Background fan-out delete<br/>remove ID from inboxes]:::queue
  B[User blocks or unfollows]:::client --> FL[Filter by author<br/>at read time]:::server
  B -.-> BG2[Background cleanup<br/>of that inbox]:::queue`,text:`Filtering at read time makes the change visible instantly. The slow cleanup of millions of inboxes can then happen in the background.`}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`Explain fan-out on write vs. fan-out on read.`,`How do you handle celebrities with millions of followers in your fan-out design?`,`How would you implement infinite scroll pagination efficiently?`,`How do you rank posts in the feed?`,`How do you keep the feed fresh when posts are deleted or edited?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Hybrid fan-out is the industry answer for celebrity problem — know the threshold.`,`Redis sorted sets for feed storage — very specific and shows depth.`,`Cursor-based pagination is non-negotiable at scale — explain why offset pagination fails.`,`Feed reconstruction on cache miss — shows you thought about failure scenarios.`]},{type:`flow`,title:`How to walk through this design in an interview`,code:`flowchart LR
  A[Clarify<br/>DAU, follows, ranked?]:::client --> B[Estimate<br/>reads 100x writes]:::client
  B --> C[Push model<br/>Redis inboxes]:::server
  C --> D[Celebrity problem<br/>switch to hybrid]:::highlight
  D --> E[Pagination + ranking]:::server
  E --> F[Failures<br/>rebuild, lag]:::db`},{type:`callout`,variant:`important`,text:`The news feed is one of the most common system design interview questions. Knowing the hybrid fan-out approach, Redis sorted sets, and cursor pagination puts you in the top 10% of candidates. Practice explaining the celebrity problem and its solution clearly.`}]}]},{id:`video-streaming`,title:`Video Streaming Platform`,icon:`ti-player-play`,color:`#ef4444`,bg:`#fee2e2`,accentGlow:`rgba(239,68,68,0.15)`,difficulty:`Advanced`,tagline:`Video encoding pipelines, adaptive bitrate streaming, CDN delivery, and billion-scale view counts.`,tags:[`HLS/DASH`,`Adaptive Bitrate`,`Transcoding`,`CDN`,`Blob Storage`],estimatedTime:`70 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A video streaming platform like YouTube or Netflix. Users can upload videos, which are processed and made available for streaming at different quality levels. Other users can search, discover, and stream videos with adaptive quality based on their network speed.`},{type:`callout`,variant:`info`,text:`In simple terms: it is like a publisher turning one manuscript into many editions \u2014 large print, paperback, pocket size \u2014 and stocking every local bookshop with them. The upload is converted once into several qualities and cut into small pieces, copies are kept in shops (CDN servers) near every viewer, and the video player keeps choosing the edition that fits through the viewer's internet "door" right now.`},{type:`flow`,title:`The big picture — process once, watch everywhere`,code:`flowchart LR
  CR([Creator uploads]):::client ==>|"raw video"| OS[(Object Storage)]:::db
  OS --> TC[Transcoding workers<br/>360p ... 4K, cut into segments]:::server
  TC --> OS2[(Encoded segments)]:::db
  OS2 --> CDN[CDN edges<br/>near viewers]:::network
  V([Viewers]):::client -->|"small segments,<br/>best quality that fits"| CDN`,text:`Uploading and processing happen once per video. Watching happens billions of times a day, almost entirely from CDN servers close to the viewer.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Video upload (up to 4K, up to 10 GB).`,`Video processing: transcode to multiple resolutions (360p, 480p, 720p, 1080p, 4K).`,`Adaptive bitrate streaming — quality adjusts to network speed automatically.`,`Video search and discovery.`,`View count, likes, comments.`,`Video recommendations.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`5 million videos uploaded per day.`,`5 billion video views per day.`,`Processing SLA: video available for streaming within 5 minutes of upload.`,`Video start latency: < 2 seconds.`,`No buffering for users on 5 Mbps+ connections.`,`Global availability.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Video Codec and Container Formats`},{type:`bullets`,items:[`Codec: The algorithm that compresses video (to make it small) and decompresses it (to play it). H.264 (AVC): plays almost everywhere. H.265 (HEVC): files ~50% smaller than H.264 at the same quality, but requires licensing. AV1: open source, smallest files, slowest to encode.`,`Container: The file "envelope" that holds the encoded video + audio + metadata together. MP4: most compatible. WebM: open source, Chrome-native. TS (MPEG-TS): used for live streaming segments.`,`For streaming: Transcode (convert) to H.264 video in an MP4/TS container for maximum compatibility.`]},{type:`flow`,title:`Codec vs container`,code:`flowchart LR
  RAW[Raw camera footage<br/>huge]:::client --> COD[Codec compresses<br/>H.264 / H.265 / AV1]:::server
  AUD[Audio track]:::client --> AC[Audio codec<br/>AAC]:::server
  COD --> CON[Container wraps it all<br/>MP4 / WebM / TS]:::highlight
  AC --> CON
  META[Subtitles, metadata]:::client --> CON
  CON --> PLAY([Playable file]):::network`,text:`The codec decides how small the video gets. The container is just the box that keeps video, audio and extras together.`},{type:`heading2`,text:`Adaptive Bitrate Streaming (ABR)`},{type:`paragraph`,text:`Bitrate is how many bits per second a video needs — higher quality means a higher bitrate. Instead of streaming one fixed-quality file, ABR cuts the video into short segments (2-10 seconds each) and stores every segment at several quality levels. The player keeps measuring the viewer's download speed and picks the quality for each next segment. If the connection slows down, it switches to a lower quality (smaller files). When the connection improves, it switches back up.`},{type:`flow`,title:`Adaptive bitrate — quality follows the network`,code:`sequenceDiagram
  participant P as Player
  participant C as CDN
  P->>C: segment 1 at 360p (start fast)
  C-->>P: downloaded quickly - bandwidth looks good
  P->>C: segment 2 at 1080p
  C-->>P: OK
  Note over P,C: Viewer walks into a weak Wi-Fi area
  P->>C: segment 3 at 1080p
  C-->>P: arrived too slowly - buffer shrinking
  P->>C: segment 4 at 480p
  C-->>P: OK, no stall
  Note over P,C: Network recovers
  P->>C: segment 5 at 720p, then 1080p`,text:`Each segment is a fresh decision. Viewers see quality change for a moment instead of a frozen spinner.`},{type:`heading2`,text:`HLS (HTTP Live Streaming)`},{type:`paragraph`,text:`HLS is Apple's streaming protocol and now the industry standard. It uses plain text playlist files called manifests (.m3u8). A master manifest lists every quality level. Each quality level has its own playlist listing its segment URLs in order. The player downloads the master manifest, picks a quality, and then downloads segments one by one as it plays.`},{type:`code`,lang:`text`,code:`# Master Playlist (index.m3u8)
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=640x360
360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8

# Per-quality playlist (720p/playlist.m3u8)
#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-VERSION:3
#EXTINF:6.0,
seg_001.ts
#EXTINF:6.0,
seg_002.ts ...`},{type:`flow`,title:`How HLS files fit together`,code:`flowchart TB
  M["index.m3u8<br/>master manifest"]:::highlight --> P1["360p/playlist.m3u8"]:::server
  M --> P2["720p/playlist.m3u8"]:::server
  M --> P3["1080p/playlist.m3u8"]:::server
  P2 --> S1["seg_001.ts<br/>0-6 s"]:::db
  P2 --> S2["seg_002.ts<br/>6-12 s"]:::db
  P2 --> S3["seg_003.ts<br/>12-18 s"]:::db`,text:`Master manifest → one playlist per quality → many small segment files. Switching quality just means reading the next segment from a different playlist.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Upload & Processing Pipeline`},{type:`numbered`,items:[`Creator uploads raw video file to Upload Service (chunked, presigned URL to Object Storage).`,`Upload Service publishes "video_uploaded" event to Kafka.`,`Transcoding Orchestrator consumes event, creates transcoding jobs for each resolution.`,`Transcoding Workers (FFmpeg-based, GPU-accelerated) encode the video into segments at each quality level.`,`Encoded segments uploaded to Object Storage (S3 equivalent).`,`CDN automatically caches segments as they are requested.`,`Metadata Service updates video status to "ready" in Video DB.`,`Creator notified via push notification.`]},{type:`flow`,title:`Upload and processing pipeline`,code:`sequenceDiagram
  actor CR as Creator
  participant U as Upload Service
  participant OS as Object Storage
  participant K as Kafka
  participant O as Transcode Orchestrator
  participant W as Transcode Workers
  participant M as Metadata Service
  CR->>U: Start upload
  U-->>CR: presigned URL
  CR->>OS: PUT raw video (chunked)
  U--)K: video_uploaded
  K--)O: event
  O->>W: one job per resolution and chunk
  W->>OS: read raw video
  W->>OS: write HLS segments + playlists
  W-->>O: all jobs done
  O->>M: status = ready
  M--)CR: push notification: your video is live`,text:`Every step after the upload is asynchronous, so the creator is never stuck waiting on a spinning progress bar for transcoding.`},{type:`heading2`,text:`Streaming Architecture`},{type:`bullets`,items:[`Viewer requests video page → Metadata Service returns video info + master playlist URL (pointing to CDN).`,`Player fetches master playlist from CDN → gets list of quality variants.`,`Player selects quality based on network speed, downloads segments from CDN.`,`CDN serves segments from edge cache. Cache miss: CDN fetches from Object Storage (origin).`,`Player monitors download speed. If segment takes too long, next segment is fetched at lower quality.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  CR([Creator]):::client ==>|"raw upload"| OS[(Object Storage)]:::db
  CR --> US[Upload Service]:::server
  US -.-> K[[Kafka]]:::queue
  K -.-> TO[Transcode Orchestrator]:::server
  TO --> TW[GPU Transcode Workers]:::server
  TW <--> OS
  TO --> MS[Metadata Service]:::server
  MS --> VDB[(Video DB)]:::db
  V([Viewer]):::client -->|"video page"| MS
  V ==>|"manifest + segments"| CDN[CDN]:::network
  CDN -->|"miss"| OS`,text:`Two separate paths: the write path (top) turns uploads into segments; the read path (bottom) is almost entirely CDN. They share only Object Storage and the Metadata Service.`},{type:`flow`,title:`Pressing play`,code:`sequenceDiagram
  actor V as Viewer
  participant MS as Metadata Service
  participant C as CDN Edge
  participant OS as Object Storage
  V->>MS: GET /watch/video_id
  MS-->>V: title, thumbnail, master playlist URL
  V->>C: GET index.m3u8
  C-->>V: list of qualities
  V->>V: Measure bandwidth, choose 720p
  loop every segment
    V->>C: GET 720p/seg_N.ts
    alt cached at edge
      C-->>V: segment
    else cache miss
      C->>OS: fetch segment
      OS-->>C: segment
      C-->>V: segment (and keep a copy)
    end
  end`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Transcoding at Scale`},{type:`paragraph`,text:`Transcoding (converting a video into other formats and resolutions) is very CPU-intensive. Doing it for 5M videos a day — some of them hour-long 4K files — needs massive parallel processing.`},{type:`bullets`,items:[`Parallelism at the video level: Multiple workers each transcoding a different video.`,`Parallelism within a video: Split the raw video into independent chunks and transcode each chunk on a different worker, then join the results. Chunks must be cut on GOP boundaries (a GOP, or Group of Pictures, is a run of frames that can be decoded without looking at earlier frames). A 1-hour video can be transcoded in 10 minutes instead of 1 hour.`,`Resolution parallelism: Transcode 360p, 720p, 1080p simultaneously on different workers.`,`Hardware acceleration: Use GPU-accelerated transcoding (NVENC on NVIDIA GPUs) for 10-40× speedup vs. CPU-only.`]},{type:`flow`,title:`Split, transcode in parallel, stitch`,code:`flowchart TB
  RAW[1-hour raw video]:::client --> SPLIT[Split on GOP boundaries<br/>into 6 x 10-min chunks]:::server
  SPLIT --> C1[Chunk 1]:::queue & C2[Chunk 2]:::queue & C6[Chunk 6]:::queue
  C1 --> W1[Worker: 360p, 720p, 1080p]:::server
  C2 --> W2[Worker: 360p, 720p, 1080p]:::server
  C6 --> W6[Worker: 360p, 720p, 1080p]:::server
  W1 & W2 & W6 --> JOIN[Stitch + write playlists]:::server
  JOIN --> OUT([Ready in ~10 min<br/>instead of ~1 hour]):::highlight`,text:`Cutting on GOP boundaries is what makes chunks independent — each one can be encoded without knowing anything about its neighbours.`},{type:`heading2`,text:`Video Metadata Schema`},{type:`code`,lang:`sql`,code:`CREATE TABLE videos (
  video_id       UUID PRIMARY KEY,
  uploader_id    UUID NOT NULL,
  title          VARCHAR(100),
  description    TEXT,
  duration_secs  INT,
  status         VARCHAR(20), -- uploading, processing, ready, failed
  visibility     VARCHAR(10), -- public, unlisted, private
  view_count     BIGINT DEFAULT 0,
  like_count     INT DEFAULT 0,
  master_playlist_url TEXT,
  thumbnail_url  TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);`},{type:`heading2`,text:`View Count at Scale`},{type:`paragraph`,text:`5 billion views/day = 58K increments/second. Updating the database row on every view would overwhelm it. Instead, count views in Redis first (one INCR per view, per video), then write the totals to the database in batches every 60 seconds. View counts that lag by a minute or so are perfectly acceptable.`},{type:`flow`,title:`Buffered view counting`,code:`flowchart LR
  V1([View]):::client --> R[(Redis<br/>INCR views:video_id)]:::cache
  V2([View]):::client --> R
  V3([58K views per sec]):::client --> R
  R -->|"every 60 s:<br/>read and reset counters"| F[Flush job]:::queue
  F -->|"1 UPDATE per video<br/>view_count += N"| DB[(Video DB)]:::db`,text:`Thousands of views of the same video turn into a single database write per minute.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`CDN as the Primary Scaling Mechanism`},{type:`paragraph`,text:`A video segment is typically 2-8 MB and is watched by many viewers. For popular content, the CDN already has ~99% of requested segments cached. So almost all video bytes come from CDN edges — your own servers only handle cache misses and brand-new content. The CDN does the heavy lifting at scale.`},{type:`heading2`,text:`Object Storage Scaling`},{type:`bullets`,items:[`Object storage (S3-equivalent) scales infinitely — no capacity planning needed.`,`5M videos × 1 GB average processed size = 5 PB/day. Budget accordingly.`,`Tiered storage: Videos not watched in 90 days moved to cheaper "cold" storage tier (e.g., S3 Glacier).`]},{type:`heading2`,text:`Transcoding Elastic Scaling`},{type:`bullets`,items:[`Use a job queue (SQS/Kafka) for transcoding tasks.`,`Scale workers based on queue depth (how many jobs are waiting). The Kubernetes Horizontal Pod Autoscaler can add workers when the queue grows.`,`Spot/preemptible instances (spare cloud capacity sold cheaply, but can be taken back at any time) reduce GPU cost by 60-80% for non-time-critical transcoding.`]},{type:`flow`,title:`Scaled-out architecture`,code:`flowchart TB
  V([Viewers worldwide]):::client --> CDN
  subgraph CDN["CDN - about 99 percent of bytes"]
    E1[Edge: Tokyo]:::network
    E2[Edge: London]:::network
    E3[Edge: New York]:::network
  end
  CDN -->|"misses only"| SH[Origin shield]:::network
  SH --> OS[(Object Storage<br/>hot + cold tiers)]:::db
  Q[[Transcode job queue]]:::queue --> AS{Autoscaler<br/>watches queue depth}
  AS --> W1[GPU workers<br/>on-demand]:::server
  AS --> W2[GPU workers<br/>spot - cheap]:::server
  W1 & W2 --> OS`,text:`An origin shield is one extra cache layer in front of storage, so a miss in many edges at once becomes a single fetch from origin.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Transcoding Fault Tolerance`},{type:`bullets`,items:[`Each transcoding job is idempotent: running it again for the same video produces exactly the same output (fixed encoding settings), so retries are always safe.`,`Failed jobs automatically retried up to 3 times with backoff.`,`If all retries fail: video stays in "processing_failed" status, alert engineering, notify uploader.`,`Progress checkpointing: for long videos, save progress periodically. On failure, resume from last checkpoint instead of restarting.`]},{type:`flow`,title:`What happens when a transcoding job fails`,code:`flowchart TD
  J[Transcode job]:::queue --> RUN[Worker runs from<br/>last checkpoint]:::server
  RUN --> OK{Succeeded?}
  OK -->|Yes| DONE([Segments saved,<br/>status ready]):::highlight
  OK -->|No| R{Retries less than 3?}
  R -->|Yes| WAIT[Back off, then requeue<br/>on another worker]:::queue --> RUN
  R -->|No| FAIL[status = processing_failed]:::security
  FAIL --> AL[Alert engineers +<br/>notify uploader]:::external`,text:`Because jobs are idempotent and checkpointed, a crashed worker costs only the work since its last checkpoint.`},{type:`heading2`,text:`Content Integrity`},{type:`bullets`,items:[`Verify checksums at each step: raw upload → after transcoding → after CDN delivery.`,`Play-test sampled videos automatically after transcoding (automated QA pipeline).`,`A/B test encoding quality settings to balance quality vs. file size.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Startup Latency Optimization`},{type:`bullets`,items:[`Pre-load the first few segments to CDN edge closest to the viewer as soon as the video page is loaded.`,`Start playback at the lowest quality level immediately, then switch to higher quality as bandwidth is confirmed.`,`Pre-fetch the next segment before the current one finishes playing — player always has a buffer.`]},{type:`flow`,title:`Getting to first frame in under 2 seconds`,code:`flowchart LR
  A[Page opens]:::client --> B[Warm edge:<br/>first segments pre-loaded]:::network
  B --> C[Play first segment<br/>at low quality]:::highlight
  C --> D[Measure bandwidth]:::server
  D --> E[Step up quality]:::server
  E --> F[Keep 2-3 segments<br/>buffered ahead]:::cache
  F --> D`},{type:`heading2`,text:`Thumbnail Optimization`},{type:`bullets`,items:[`Generate multiple thumbnail candidates from different time points during transcoding.`,`Store thumbnails as WebP format (30% smaller than JPEG with same quality).`,`Serve thumbnails via CDN with long cache TTL (thumbnails rarely change).`,`Implement lazy loading — thumbnails outside the viewport are not loaded until scrolled into view.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`HLS vs. DASH`},{type:`bullets`,items:[`HLS: Developed by Apple, native support on iOS/Safari. Segment size default: 6 seconds. More widely supported.`,`DASH (MPEG-DASH): Open standard, supported by most browsers (except Safari). More flexible (different segment sizes, better adaptation algorithms).`,`Industry practice: Support both. Use HLS for Apple devices, DASH for others.`]},{type:`flow`,title:`Serving HLS and DASH from one set of segments`,code:`flowchart TD
  T[Transcoder]:::server --> SEG[(Shared CMAF / fMP4<br/>segments)]:::db
  SEG --> H[HLS manifest .m3u8]:::highlight
  SEG --> D[DASH manifest .mpd]:::highlight
  H --> APPLE([iPhone, Safari]):::client
  D --> OTHER([Android, Chrome, smart TVs]):::client`,text:`Modern pipelines encode once into a shared segment format (CMAF) and only write two small manifests, so supporting both protocols costs almost no extra storage.`},{type:`heading2`,text:`Upload to Server vs. Direct Upload to Storage`},{type:`bullets`,items:[`Upload via server: Server can validate content (virus scan, format check) before storing. But: server bandwidth is a bottleneck for large video files.`,`Direct upload to storage: Bypasses server bandwidth. But: harder to intercept for validation. Post-upload validation via async job.`,`For video uploads: direct upload is necessary for performance. Post-upload validation in the processing pipeline.`]}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Content Moderation`},{type:`bullets`,items:[`Run automated content classifiers during transcoding pipeline (violence, adult content, copyright).`,`Hash-based detection: compute a perceptual hash of video frames (a fingerprint that stays the same even if the video is resized or re-encoded) and compare it against a database of prohibited content.`,`Human review queue for flagged content.`,`Copyright: Content ID system fingerprints videos and matches against a database of copyrighted content.`]},{type:`flow`,title:`Moderation inside the processing pipeline`,code:`flowchart TD
  UP[Uploaded video]:::client --> TC[Transcoding]:::server
  TC --> CL[ML classifiers<br/>violence, adult]:::security
  TC --> PH[Perceptual hash +<br/>Content ID match]:::security
  CL & PH --> D{Flagged?}
  D -->|No| PUB([Publish]):::highlight
  D -->|"Clear violation"| BLK[Block automatically]:::external
  D -->|Unsure| HR[[Human review queue]]:::queue
  HR --> PUB
  HR --> BLK`},{type:`heading2`,text:`Cost Management`},{type:`bullets`,items:[`Egress cost: CDN egress (paying for data sent out to viewers) is the largest cost. Negotiate CDN contracts carefully.`,`Transcoding cost: GPU instances are expensive. Use spot instances and optimize encoding settings.`,`Storage cost: Delete original raw uploads after successful transcoding. Tier old video storage.`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How would you design the video upload and processing pipeline?`,`Explain adaptive bitrate streaming.`,`How would you scale to serve 5 billion video views per day?`,`How do you handle view count at scale?`,`How do you reduce video start latency to < 2 seconds?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Processing pipeline: upload → Kafka → transcoding workers → object storage → CDN.`,`Parallel transcoding within a single video (GOP-aligned chunks) for fast processing.`,`CDN is the scalability answer for video delivery — almost all bytes served from edge.`,`Approximate view counts with Redis buffering + batch DB updates.`,`Adaptive bitrate ensures good experience for all network conditions.`]},{type:`flow`,title:`How to walk through this design in an interview`,code:`flowchart LR
  A[Clarify scope<br/>upload + playback only]:::client --> B[Estimate<br/>uploads, views, storage]:::client
  B --> C[Upload pipeline<br/>Kafka + transcoding]:::server
  C --> D[Playback<br/>ABR + HLS + CDN]:::network
  D --> E[Hot spots<br/>view counts, start time]:::highlight
  E --> F[Failures + cost]:::db`},{type:`callout`,variant:`tip`,text:`Video systems are complex. Scope carefully in interviews — focus on upload flow and streaming architecture. Do not try to cover recommendations, comments, and social features in the same interview session.`}]}]},{id:`ride-sharing`,title:`Ride-Sharing / Location Tracking`,icon:`ti-map-pin`,color:`#0891b2`,bg:`#e0f2fe`,accentGlow:`rgba(8,145,178,0.15)`,difficulty:`Advanced`,tagline:`Geospatial indexing, real-time matching, WebSockets, and CQRS for high-throughput location updates.`,tags:[`Geohash`,`Quadtree`,`CQRS`,`WebSockets`,`Real-time Matching`],estimatedTime:`65 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A ride-sharing platform like Uber or Lyft. Riders request rides and are matched with nearby available drivers. Drivers and riders see each other's real-time location. The system handles trip lifecycle from request through payment.`},{type:`callout`,variant:`info`,text:`In simple terms: picture a taxi dispatcher with a giant city map covered in pins, one per driver. Every few seconds each driver radios in "I am here now" and their pin moves. When a rider calls, the dispatcher looks only at the pins in the rider's neighbourhood, offers the job to the closest few drivers, and the first to say yes gets it \u2014 and is taken off the map so nobody else can book them.`},{type:`flow`,title:`The big picture — a live map plus a matchmaker`,code:`flowchart LR
  D([Drivers]):::client -->|"GPS every 4 s"| LS[Location Service]:::server
  LS --> MAP[(Live driver map<br/>Redis Geo)]:::cache
  R([Rider]):::client -->|"request ride"| MS[Matching Service]:::server
  MS -->|"who is near the pickup?"| MAP
  MS -->|"ride offer"| D
  D -->|"accept"| TS[Trip Service]:::server
  TS --> DB[(Trips DB)]:::db
  TS -->|"live updates"| R`,text:`Two very different workloads: a firehose of tiny location writes (50K per second) and a smaller number of "find drivers near me" reads that must answer in under 2 seconds.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Riders can request a ride, specifying pickup and dropoff locations.`,`The system matches the rider with the nearest available driver.`,`Drivers and riders see each other's real-time location during matching and the trip.`,`Trip fare is estimated before booking and charged after trip.`,`Trip history is accessible to both drivers and riders.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`1 million drivers, 5 million riders globally.`,`200,000 concurrent trips at peak.`,`Driver location updates: every 4 seconds while active.`,`Matching latency: < 2 seconds (find nearest driver).`,`Location update throughput: 200K drivers × 1 update/4sec = 50K location updates/second.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`Geospatial Indexing — Geohash`},{type:`paragraph`,text:`A geohash turns a map coordinate (latitude, longitude) into a short string like "dr5ru7". It works by repeatedly cutting the world map into a grid and noting which cell the point is in — each extra character zooms into a smaller cell. So nearby places usually share the same starting characters (prefix). Precision depends on length: 4 chars = ~40km × 20km, 6 chars = ~1.2km × 0.6km, 8 chars = ~38m × 19m.`},{type:`code`,lang:`text`,code:`Location: Manhattan, NYC (40.7580\xB0 N, 73.9855\xB0 W)
Geohash 4 chars: "dr5r"     \u2192 ~40km \xD7 20km cell
Geohash 6 chars: "dr5ru7"   \u2192 ~1.2km \xD7 0.6km cell (good for driver search)
Geohash 8 chars: "dr5ru77s" \u2192 ~38m \xD7 19m cell (very precise)

Nearby search: Find all drivers with geohash starting with "dr5ru7"
\u2192 All drivers within ~600m of the user
\u2192 Also check 8 neighboring geohash cells (to avoid border effects)`},{type:`flow`,title:`Geohash — zooming in one character at a time`,code:`flowchart LR
  W["World"]:::client --> A["d<br/>eastern N. America"]:::server
  A --> B["dr5r<br/>~40 x 20 km"]:::server
  B --> C["dr5ru7<br/>~1.2 x 0.6 km"]:::highlight
  C --> D["dr5ru77s<br/>~38 x 19 m"]:::server
  C -.->|"search: same prefix<br/>+ 8 neighbour cells"| N[Drivers near the rider]:::cache`,text:`Finding nearby drivers becomes a simple prefix lookup. The neighbour cells matter because a driver 50 m away can sit just across a cell border with a different prefix.`},{type:`heading2`,text:`Geospatial Indexing — Quadtree`},{type:`paragraph`,text:`A quadtree splits a map into four squares, then splits any square that is too crowded into four smaller squares, and so on. Each final (leaf) square holds a manageable number of drivers. Busy areas end up with many small squares and empty areas keep a few big ones, so it adapts to density. That makes it a better fit than geohash when density varies a lot (many drivers downtown, few in the suburbs).`},{type:`flow`,title:`Quadtree — split only where it is crowded`,code:`flowchart TB
  ROOT["Whole city<br/>too many drivers - split"]:::server --> NW["NW: suburbs<br/>12 drivers - leaf"]:::cache
  ROOT --> NE["NE: downtown<br/>3,000 drivers - split"]:::highlight
  ROOT --> SW["SW: park<br/>2 drivers - leaf"]:::cache
  ROOT --> SE["SE: suburbs<br/>40 drivers - leaf"]:::cache
  NE --> NE1["block A<br/>80 - leaf"]:::cache
  NE --> NE2["block B<br/>95 - leaf"]:::cache
  NE --> NE3["block C, D ...<br/>split further"]:::server`,text:`Every leaf ends up holding roughly the same number of drivers, so a search always scans a small, predictable amount of data.`},{type:`heading2`,text:`CQRS (Command Query Responsibility Segregation)`},{type:`paragraph`,text:`CQRS means using separate paths for writing and reading. The write side handles commands ("driver 42 is now here") and is tuned for raw throughput — 50K updates per second. The read side answers queries ("which drivers are near this rider?") from its own data structure, a geospatial index built for fast proximity search. The read side is updated from the write side asynchronously, so it may be a second or two behind.`},{type:`flow`,title:`CQRS — separate roads for writes and reads`,code:`flowchart LR
  subgraph WRITE["Command side - many tiny writes"]
    D([Driver apps]):::client -->|"50K updates/s"| LS[Location Service]:::server
  end
  LS --> GEO[(Geo index<br/>Redis)]:::cache
  LS -.->|"location events"| K[[Kafka]]:::queue
  subgraph READ["Query side - fast lookups"]
    MS[Matching Service]:::server -->|"drivers near X?"| GEO
    K -.-> WS[WebSocket push<br/>to riders]:::network
    K -.-> AN[(Analytics<br/>driver paths)]:::db
  end`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components`},{type:`bullets`,items:[`Location Service: Receives high-frequency driver location updates (50K/sec). Writes to Location Store and publishes to Kafka.`,`Location Store: Redis geospatial index holding every driver's current location. A radius search costs O(N + log M), where N = drivers returned and M = total drivers — so it stays fast as the fleet grows.`,`Matching Service: When a rider requests a ride, queries Location Store for nearby available drivers, applies matching algorithm, sends trip offer.`,`Trip Service: Manages trip lifecycle (requested, matched, in-progress, completed). Stored in PostgreSQL.`,`WebSocket Gateway: Keeps an always-open connection to every driver and rider app, so the server can push location updates and trip status changes instantly instead of the apps repeatedly asking.`,`Driver App / Rider App: Mobile clients communicating via WebSocket for real-time and REST for non-real-time operations.`,`Pricing Service: Calculates fare estimate and surge pricing based on supply/demand in each geographic area.`,`Kafka: Event bus decoupling location updates from consumers (matching service, WebSocket gateway, analytics).`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  DA([Driver app]):::client <-->|"WebSocket"| WSG[WebSocket Gateway]:::network
  RA([Rider app]):::client <-->|"WebSocket"| WSG
  RA -->|"REST: request ride"| MS[Matching Service]:::server
  WSG --> LS[Location Service]:::server
  LS --> GEO[(Redis Geo<br/>live locations)]:::cache
  LS -.-> K[[Kafka]]:::queue
  K -.-> WSG
  MS --> GEO
  MS --> PR[Pricing Service]:::server
  MS --> TS[Trip Service]:::server
  TS --> PG[(PostgreSQL<br/>trips)]:::db
  TS --> WSG`,text:`Apps talk over a persistent WebSocket for anything live and use plain REST for one-off actions such as requesting a ride.`},{type:`heading2`,text:`Ride Request Flow`},{type:`numbered`,items:[`Rider opens app, sees nearby drivers on map (Location Service + WebSocket push).`,`Rider requests ride: POST /api/trips {pickupLocation, dropoffLocation}`,`Matching Service finds N nearest available drivers using Redis geo-search.`,`Sends ride offer (via WebSocket) to top 3 candidates simultaneously (drivers have 15s to accept).`,`First driver to accept is matched. Others are notified of cancellation.`,`Both driver and rider see each other's real-time location via WebSocket.`,`Trip completes → Fare calculated → Payment charged → Trip stored in DB.`]},{type:`flow`,title:`Ride request and matching`,code:`sequenceDiagram
  actor R as Rider
  participant M as Matching Service
  participant G as Redis Geo
  participant W as WebSocket Gateway
  participant D1 as Driver A
  participant D2 as Driver B
  participant T as Trip Service
  R->>M: POST /api/trips (pickup, dropoff)
  M->>G: 10 nearest available drivers
  G-->>M: A 0.8 km, B 1.2 km, C 1.5 km
  M->>W: offer to A, B, C (15 s to accept)
  W->>D1: ride offer
  W->>D2: ride offer
  D1->>M: accept
  M->>G: atomically remove A from available pool
  M->>T: create trip (MATCHED)
  M->>W: cancel offer for B and C
  W->>D2: offer withdrawn
  T-->>R: Driver A is on the way
  loop every 4 s during the trip
    D1->>W: GPS position
    W->>R: driver position
  end`,text:`Offering to three drivers at once cuts waiting time. The atomic removal from the pool is what guarantees only one acceptance wins.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Redis Geospatial Index`},{type:`code`,lang:`text`,code:`# Store driver location
GEOADD drivers_available {lng} {lat} {driver_id}

# Find available drivers within 5km of rider
GEOSEARCH drivers_available FROMLONLAT {rider_lng} {rider_lat} BYRADIUS 5 km ASC COUNT 10
# (older Redis versions: GEORADIUS drivers_available {rider_lng} {rider_lat} 5 km ASC COUNT 10)

# Response: [driverId1 (0.8km), driverId2 (1.2km), ...]
# O(N+log M) \u2014 very fast even with 100K drivers`},{type:`heading2`,text:`Driver Location Update Flow (CQRS Write Side)`},{type:`numbered`,items:[`Driver app sends GPS coordinates every 4 seconds via WebSocket.`,`WebSocket Gateway forwards to Location Service.`,`Location Service writes to Redis (GEOADD — overwrites previous location).`,`Location Service publishes event to Kafka: {driverId, lat, lng, timestamp}.`,`Kafka consumers: (1) WebSocket Gateway pushes location to matched rider. (2) Analytics records driver path.`]},{type:`flow`,title:`One location update, end to end`,code:`sequenceDiagram
  participant D as Driver app
  participant W as WebSocket Gateway
  participant L as Location Service
  participant G as Redis Geo
  participant K as Kafka
  participant R as Rider app
  D->>W: lat, lng (every 4 s)
  W->>L: forward
  L->>G: GEOADD - overwrite old position
  L--)K: driverId, lat, lng, timestamp
  par consumers
    K--)W: push to the matched rider
    W->>R: driver moved
  and
    K--)K: analytics stores the path
  end`,text:`Redis only ever holds the latest position per driver — the history lives in the analytics pipeline, not in the hot path.`},{type:`heading2`,text:`Surge Pricing (Dynamic Pricing)`},{type:`paragraph`,text:`Surge pricing raises fares when there are more ride requests than drivers in an area. How it works: for each geohash cell, count ride requests and available drivers over the last 5 minutes (a sliding window). The surge multiplier is a function of demand ÷ supply. Each cell's multiplier is cached in Redis and recalculated every 30 seconds.`},{type:`flow`,title:`Computing surge per area`,code:`flowchart LR
  RQ[Ride requests<br/>per geohash cell]:::client --> W[5-min sliding<br/>window counts]:::server
  AV[Available drivers<br/>per geohash cell]:::client --> W
  W --> RATIO{demand / supply}
  RATIO -->|"at or below 1"| N1["1.0x - normal"]:::cache
  RATIO -->|"about 2"| N2["1.5x"]:::highlight
  RATIO -->|"3 or more"| N3["2.0x+"]:::security
  N1 & N2 & N3 --> RC[(Redis: surge per cell<br/>refreshed every 30 s)]:::cache`,text:`Higher prices both reduce demand and attract nearby drivers into the busy cell, pulling supply and demand back into balance. (Thresholds shown are illustrative.)`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Location Update Scaling (50K/sec)`},{type:`bullets`,items:[`Redis handles 100K+ operations/second on a single node. 50K GEOADD operations/second is within capacity.`,`Redis Cluster: Shard by geographic region (North America, Europe, Asia). Each region's drivers are a separate Redis cluster.`,`Location Service scales horizontally — stateless workers consuming location updates via WebSocket.`]},{type:`heading2`,text:`WebSocket Connection Scaling`},{type:`bullets`,items:[`200K active trips × 2 connections (driver + rider) = 400K concurrent WebSocket connections.`,`Plus offline drivers waiting for rides: 1M total connections.`,`Each WebSocket server: ~50K connections. Need 20 servers.`,`Service registry (like in chat system): Track which WebSocket server each driver/rider is connected to.`]},{type:`flow`,title:`Scaled-out architecture`,code:`flowchart TB
  APPS([1M driver + rider apps]):::client --> LB[Load Balancer]:::network
  subgraph WSF["WebSocket fleet - about 50K connections each"]
    WS1[WS server 1]:::network
    WS2[WS server 2]:::network
    WS3[WS server 20]:::network
  end
  LB --> WSF
  WSF --> REG[(Service registry<br/>user to WS server)]:::cache
  WSF --> LS[Location Service x N]:::server
  subgraph GEO["Redis Geo - sharded by region"]
    NA[(North America)]:::cache
    EU[(Europe)]:::cache
    AS[(Asia)]:::cache
  end
  LS --> GEO
  MS[Matching Service x N]:::server --> GEO
  MS -->|"which server holds driver 42?"| REG`,text:`Rides never cross regions, so each region gets its own Redis cluster. The registry lets any service find the right WebSocket server to push a message to a specific user.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Driver Availability Consistency`},{type:`paragraph`,text:`Redis is the source of truth for which drivers are available. The moment a driver accepts a ride, they must be removed from the available pool (ZREM from the geo index — geo sets are sorted sets underneath). Otherwise a second rider could be matched to the same driver. The check "is this driver still available?" and the removal must happen as one atomic step, so wrap them (plus any ZADD to a busy set) in a Lua script — Redis runs a script start-to-finish without letting any other command in between, which prevents race conditions.`},{type:`flow`,title:`Preventing double-booking`,code:`sequenceDiagram
  participant M1 as Matcher for Rider 1
  participant M2 as Matcher for Rider 2
  participant R as Redis
  Note over M1,M2: Both want Driver A at the same moment
  M1->>R: Lua script: if A is available, remove A
  R-->>M1: OK - A is yours
  M2->>R: Lua script: if A is available, remove A
  R-->>M2: FAIL - A no longer available
  M2->>M2: Offer next-nearest driver`,text:`Redis runs one script at a time, so the second matcher always sees the result of the first. No locks, no double-booking.`},{type:`heading2`,text:`Trip State Machine`},{type:`paragraph`,text:`Trips go through well-defined states: REQUESTED → MATCHED → DRIVER_EN_ROUTE → TRIP_IN_PROGRESS → COMPLETED (or CANCELLED at various stages). Each state change is saved to PostgreSQL before the app is told about it. If the system crashes mid-change, it simply resumes from the last saved state.`},{type:`flow`,title:`Trip state machine`,code:`stateDiagram-v2
  [*] --> REQUESTED: rider requests
  REQUESTED --> MATCHED: driver accepts
  REQUESTED --> CANCELLED: no driver found or rider cancels
  MATCHED --> DRIVER_EN_ROUTE: driver starts driving
  MATCHED --> CANCELLED: rider or driver cancels
  DRIVER_EN_ROUTE --> TRIP_IN_PROGRESS: rider picked up
  DRIVER_EN_ROUTE --> CANCELLED: cancel with fee
  TRIP_IN_PROGRESS --> COMPLETED: dropoff, fare charged
  COMPLETED --> [*]
  CANCELLED --> [*]`,text:`Only these arrows are legal. Rejecting any other transition (for example COMPLETED back to MATCHED) protects against buggy or duplicated requests.`}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Matching Optimization`},{type:`paragraph`,text:`Finding the nearest driver must complete in < 500ms. A Redis radius search (GEOSEARCH / GEORADIUS) with COUNT 10 returns the 10 nearest drivers in ~1ms. The matching algorithm then ranks those candidates by distance, driver rating, driver type (UberX, UberXL), and estimated time of arrival (ETA). For speed, the ETA here uses precomputed routing data rather than live traffic.`},{type:`flow`,title:`Matching pipeline — under 500 ms`,code:`flowchart LR
  REQ([Ride request]):::client --> GS[Redis geo search<br/>10 nearest, ~1 ms]:::cache
  GS --> F[Filter<br/>right car type]:::server
  F --> S[Score each candidate<br/>distance, rating, ETA]:::server
  S --> TOP[Top 3]:::highlight
  TOP --> OFF[Send offers<br/>via WebSocket]:::network`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Geohash vs. Quadtree vs. Redis Geo`},{type:`bullets`,items:[`Geohash: Simple prefix-based search. Known edge effects at cell boundaries (need to check 9 cells). Fixed cell size.`,`Quadtree: Variable cell size adapts to density. More complex implementation.`,`Redis Geo: Built-in geospatial commands using geohash internally. Easiest to use, production-ready. Best choice for most use cases.`,`Google S2 / Uber H3: Advanced geospatial indexing for complex routing. Used when you need hierarchical spatial analytics.`]},{type:`flow`,title:`Choosing a geospatial index`,code:`flowchart TD
  Q{What do you need?}
  Q -->|"Fast nearby search,<br/>minimal code"| RG[Redis Geo<br/>default choice]:::highlight
  Q -->|"Very uneven density,<br/>custom in-memory index"| QT[Quadtree]:::server
  Q -->|"Simple prefix keys<br/>in any database"| GH[Geohash]:::db
  Q -->|"Area analytics, surge zones,<br/>equal-size cells"| H3[Uber H3 / Google S2]:::external`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Privacy`},{type:`bullets`,items:[`Anonymize driver location when not on a trip (show approximate area, not exact position).`,`Delete precise location history after trip completion (keep only start/end points for support).`,`Comply with local regulations (GDPR, CCPA) for location data storage and retention.`]},{type:`heading2`,text:`ETA and Routing`},{type:`paragraph`,text:`Real-time ETA requires live traffic data, road conditions, and route optimization. For a full implementation, integrate with a routing engine (OSRM, Google Maps API, or Uber's own routing infrastructure). Pre-compute ETA for common routes and update based on real-time traffic events.`}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How would you store and query driver locations efficiently?`,`How do you match a rider to the nearest available driver?`,`How do you handle the case where a driver is matched to multiple riders simultaneously?`,`How do you push real-time location updates to both driver and rider apps?`,`How would you implement surge pricing?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Redis Geo for location storage and radius search — O(N+log M).`,`CQRS: separate high-throughput write path (location updates) from read path (proximity queries).`,`Atomic driver state change: a Lua script that checks availability and removes the driver from the geo index in one step prevents double-booking.`,`WebSocket for real-time location push — same pattern as chat system.`,`Event sourcing for trip state — every state change is a persistent event.`]},{type:`flow`,title:`How to walk through this design in an interview`,code:`flowchart LR
  A[Clarify<br/>drivers, trips, update rate]:::client --> B[Estimate<br/>50K writes/s]:::client
  B --> C[Location store<br/>Redis Geo + CQRS]:::cache
  C --> D[Matching<br/>offers + atomic claim]:::highlight
  D --> E[Real-time push<br/>WebSockets]:::network
  E --> F[Trip states,<br/>surge, scaling]:::db`},{type:`callout`,variant:`important`,text:`The key insight in ride-sharing is the geospatial challenge. Knowing Redis GEO commands, geohash edge effects, and how to prevent double-matching (atomic Redis operations) sets you apart from candidates who only discuss high-level concepts.`}]}]},{id:`ticket-booking`,title:`Ticket Booking & Flash Sales`,icon:`ti-ticket`,color:`#e11d48`,bg:`#ffe4e6`,accentGlow:`rgba(225,29,72,0.15)`,difficulty:`Advanced`,tagline:`Seat holds with expiry, row locks vs conditional updates, virtual waiting rooms, and never double-selling a seat during a flash sale.`,tags:[`Concurrency Control`,`Seat Holds`,`Virtual Waiting Room`,`Flash Sales`,`Idempotency`],estimatedTime:`65 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A ticketing platform like Ticketmaster or BookMyShow. Users browse concerts, matches and movie shows, open a seat map, pick seats, get a few minutes to pay, and receive tickets. Most of the year traffic is calm. Then a superstar tour goes on sale and millions of people arrive within minutes for ~50,000 seats. The system must stay up, treat people fairly, and above all never sell the same seat twice.`},{type:`callout`,variant:`info`,text:`In simple terms: picture a theatre box office on the morning a famous band announces a show. A doorman lets people into the lobby a few at a time so the counter is not crushed. At the counter, the clerk puts a "reserved" card on the seats you point at \u2014 you have ten minutes to pay or the card is taken off and the seats go back on sale. The clerk's seating chart is the only truth: two people can point at the same seat, but only one card can ever be placed on it.`},{type:`flow`,title:`The big picture — from "On sale now" to a ticket in your inbox`,code:`flowchart LR
  U([Millions of fans]):::client --> WR[Virtual waiting room<br/>admits a few per second]:::security
  WR -->|"signed admission token"| BK[Booking Service]:::server
  BK -->|"hold seats 10 min"| INV[(Seat inventory<br/>source of truth)]:::db
  BK --> PAY[Payment System]:::external
  PAY -->|"paid"| BK
  BK -->|"HELD to SOLD"| INV
  BK -.-> N[[Tickets + email]]:::queue`,text:`Two very different problems hide in one product: a correctness problem (one seat, one buyer) and a traffic problem (a wall of users arriving at the same second). The waiting room solves the second so the database only has to solve the first.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Browse and search events (concerts, sports, movie shows) by city, date and venue.`,`View an interactive seat map with live-ish availability per section and seat.`,`Hold one or more seats (max 4–8 per order) for a limited time, e.g. 10 minutes, while the user pays.`,`Also support "best available" (system picks seats) and general-admission (GA) events that sell a quantity, not specific seats.`,`Pay for held seats and receive confirmed tickets (email, app wallet).`,`Released holds (timeout or cancel) return seats to sale automatically.`,`For high-demand on-sales: a virtual waiting room that admits users in a fair, controlled order.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`Correctness first: a seat is never sold twice (oversell = 0), and a user is never charged without getting a ticket (or a refund).`,`Survive flash crowds: 2M users (up to 10M for the biggest artists) arriving within ~5 minutes of on-sale.`,`Hold request latency p99 < 500 ms for admitted users; seat map loads < 1 s.`,`Availability display may be a few seconds stale (eventual consistency), but the hold decision must be strongly consistent.`,`Fairness: earlier arrivals are generally served earlier; bots and scalpers must not crowd out real fans.`,`Normal days: thousands of events, modest steady traffic — the design must not cost flash-sale money all year.`]},{type:`heading2`,text:`Back-of-the-Envelope Estimates`},{type:`code`,lang:`text`,code:`One mega on-sale: 50,000 seats, average 2.5 tickets per order
\u2192 50,000 / 2.5 = 20,000 successful orders

Arrivals: 2M users in the first 5 minutes (300 s)
\u2192 2,000,000 / 300 \u2248 6,700 new users/s   (10M users \u2192 \u2248 33,000/s)
\u2192 2M / 20,000 orders = 100 users per order \u2014 99% will go home empty-handed

Waiting-room polling: each waiting user checks status every 15 s
\u2192 2,000,000 / 15 \u2248 133,000 req/s       (10M users \u2192 \u2248 667,000 req/s)
\u2192 must be served from a CDN / edge cache, never from the booking DB

Without a waiting room: 2M users clicking "hold" in the first minute
\u2192 2,000,000 / 60 \u2248 33,000 hold attempts/s, all fighting over the same front rows

With a waiting room admitting 100 users/s:
\u2192 6,000 admitted/min; ~50% complete a purchase \u2192 3,000 orders/min
\u2192 20,000 / 3,000 \u2248 7 minutes to sell out
\u2192 shoppers inside at once = 100/s \xD7 180 s avg checkout = 18,000
\u2192 hold transactions \u2248 100/s \xD7 2 attempts = 200 tx/s  (one PostgreSQL primary is plenty)
\u2192 seat-map refreshes: 18,000 shoppers / 5 s = 3,600 req/s (cache-served)

Storage: 1 seat row \u2248 200 bytes \u2192 50,000 seats \u2248 10 MB per event
Platform: 100,000 events/year \xD7 5,000 seats avg = 500M seat rows \u2248 100 GB/year
Seat availability as a bitmap: 2 bits/seat \xD7 50,000 = 12,500 bytes \u2248 12.5 KB`},{type:`callout`,variant:`tip`,text:`The headline number is not the 2M users — it is the 200 hold transactions per second left after the waiting room. Inventory is tiny (10 MB); the challenge is contention and spike absorption, not data volume. Say this out loud in an interview: it justifies a single relational primary per event instead of an exotic database.`}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`The Seat Inventory Model`},{type:`paragraph`,text:`Every sellable seat for every event is one row: (event, section, row, seat number, price, status). Status is one of AVAILABLE, HELD or SOLD. A HELD seat also stores who holds it (hold_id, user), and when the hold runs out (hold_expires_at). A version number increases on every change, which makes optimistic concurrency possible. The venue layout (where seat A-12-7 is drawn) is static and shared by all events at that venue; only status is per event.`},{type:`flow`,title:`Life of a seat`,code:`stateDiagram-v2
  [*] --> AVAILABLE: event published
  AVAILABLE --> HELD: user holds seat (expires in 10 min)
  HELD --> AVAILABLE: user cancels or hold expires
  HELD --> SOLD: payment captured + confirm
  SOLD --> AVAILABLE: refund / exchange (rare, back-office)
  SOLD --> [*]: event over`,text:`Every arrow is a conditional write: "move to HELD only if it is still AVAILABLE (or its hold has expired)". That one rule is what prevents double selling.`},{type:`heading2`,text:`Why Double Booking Happens: Check-Then-Act`},{type:`paragraph`,text:`The naive code reads the seat ("is it available?"), then writes it ("mark it held"). Between the read and the write, another request can do the same read and see the same answer. Both writes succeed, both users are told the seat is theirs. This is a classic race condition, and in a flash sale where thousands of people click the same front-row seat within milliseconds, it is not rare — it is guaranteed.`},{type:`flow`,title:`The race — two users, one seat`,code:`sequenceDiagram
  participant A as Alice request
  participant B as Bob request
  participant DB as Seats table
  A->>DB: SELECT status of A-12-7
  B->>DB: SELECT status of A-12-7
  DB-->>A: AVAILABLE
  DB-->>B: AVAILABLE
  A->>DB: UPDATE set HELD by Alice
  B->>DB: UPDATE set HELD by Bob
  Note over DB: Bob overwrote Alice - both think they own the seat
  Note over A,B: Fix - make the check and the write ONE atomic step`,text:`Every fix in this lesson is a way to collapse "check" and "act" into one indivisible operation that the database (or Redis) arbitrates.`},{type:`heading2`,text:`Hold → Pay → Confirm (a Two-Step Reservation)`},{type:`paragraph`,text:`Payment takes seconds to minutes (card entry, 3-D Secure, bank latency), far too long to keep a database transaction open. So booking is split into two short transactions with a timed reservation in between. Step 1 (hold): atomically flip seats AVAILABLE → HELD with an expiry. Step 2 (confirm): after the payment succeeds, atomically flip HELD → SOLD, but only if the hold still belongs to this user. If the user walks away, the hold expires and the seats return to sale. This is the same "reserve, then capture" idea used for card pre-authorisations in the Payment System design.`},{type:`heading2`,text:`The Virtual Waiting Room`},{type:`paragraph`,text:`You cannot scale your way out of 33,000 hold attempts per second on the same few hundred rows — the contention is on data, not servers. Instead, put a queue in front: everyone who arrives gets a place in line, and an admission controller lets people into the booking flow at a rate the inventory system can handle (e.g. 100 users/s). Admitted users carry a short-lived signed token that the booking API checks. It turns a stampede into an orderly line, gives users honest feedback ("You are number 48,213 — about 8 minutes"), and is the natural place to stop bots.`},{type:`flow`,title:`Waiting room — turn a spike into a steady stream`,code:`flowchart LR
  F([2M fans in 5 min]):::client --> Q[Queue position<br/>assigned at the edge]:::security
  Q --> L[(Line<br/>now serving #N)]:::cache
  AC[Admission controller<br/>about 100 users/s]:::highlight -->|"advance #N"| L
  L -->|"your turn: signed token"| BK[Booking flow<br/>18K shoppers inside]:::server
  BK --> DB[(Inventory DB<br/>about 200 tx/s)]:::db`,text:`The waiting room is cheap to scale (mostly static, edge-cached responses). The inventory database is expensive to scale. Shift the load from the second to the first.`},{type:`callout`,variant:`tip`,text:`Related reading: How Message Queues Work (a queue absorbs a burst and lets consumers work at their own pace — the waiting room is the same idea applied to people), How Scaling Works (why adding servers does not fix contention on a single hot row), and the Rate Limiter design (per-user and per-IP limits that sit in front of all this).`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components`},{type:`bullets`,items:[`CDN / Edge: Serves the web app, venue layouts (seat coordinates, SVG maps) and cached availability snapshots. Also hosts the waiting-room status endpoint so queue polling never reaches origin.`,`Waiting Room Service: Issues queue positions, runs the admission controller, and mints signed admission tokens. Only switched on for high-demand on-sales.`,`API Gateway: TLS termination, authentication, rate limiting per user/IP, and admission-token verification for booking endpoints.`,`Event Catalog Service: Events, venues, prices, search. Read-heavy, cached aggressively (Distributed Cache design), backed by a search index.`,`Inventory / Booking Service: Owns seat state. Places holds, releases holds, confirms sales. The only component allowed to write seat rows.`,`Inventory DB (PostgreSQL): Seats, holds, orders, tickets — sharded by event_id, synchronous standby for failover. The source of truth.`,`Redis: Fast hold pre-check (SET NX with TTL), availability bitmaps, GA counters, waiting-room line.`,`Order / Checkout Service: Creates the order, calls the Payment System with an idempotency key, drives confirm or refund.`,`Hold Sweeper: Background job releasing expired holds so seats reappear in the availability view.`,`Event bus (Kafka) + Notification System: SeatsHeld, OrderConfirmed, HoldExpired events drive ticket issuance, emails, push notifications and analytics.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  U([Web / mobile app]):::client --> CDN[CDN<br/>app, venue maps, snapshots]:::network
  U --> WR[Waiting Room Service]:::security
  U --> GW[API Gateway<br/>auth, rate limit, token check]:::security
  GW --> CAT[Event Catalog]:::server
  CAT --> CC[(Catalog cache)]:::cache
  GW --> INV[Inventory / Booking Service]:::server
  INV --> R[(Redis<br/>holds, bitmaps, GA counters)]:::cache
  INV --> PG[(Inventory DB<br/>PostgreSQL, sharded by event)]:::db
  GW --> ORD[Order / Checkout Service]:::server
  ORD --> INV
  ORD --> PAY[Payment System]:::external
  SW[Hold sweeper]:::queue --> PG
  INV -.-> K[[Kafka]]:::queue
  K -.-> NS[Notification System]:::server
  K -.-> TIX[Ticket issuance]:::server`,text:`Only the Inventory Service writes seat state. Everything else (catalog, maps, availability display) is a read path that can be cached and can lag by a few seconds.`},{type:`heading2`,text:`Booking Flow (Happy Path)`},{type:`numbered`,items:[`User passes the waiting room (if active) and receives a signed admission token for this event.`,`App loads the venue layout from the CDN and the current availability snapshot (bitmap).`,`User picks seats → POST /events/{id}/holds {seatIds} with the admission token.`,`Inventory Service does a Redis pre-check, then a conditional UPDATE in PostgreSQL: AVAILABLE → HELD, expires in 10 minutes. Returns holdId and expiry.`,`User enters payment details → POST /orders {holdId} with an Idempotency-Key header.`,`Checkout Service calls the Payment System (authorise + capture) using the same idempotency key.`,`On success: confirm — HELD → SOLD only where hold_id still matches; insert tickets; mark order CONFIRMED (one DB transaction).`,`Publish OrderConfirmed → tickets issued, confirmation email/push via the Notification System.`]},{type:`flow`,title:`Hold, pay, confirm`,code:`sequenceDiagram
  actor U as User
  participant G as API Gateway
  participant I as Inventory Service
  participant R as Redis
  participant DB as Inventory DB
  participant O as Checkout Service
  participant P as Payment System
  U->>G: POST holds A-12-7, A-12-8 + admission token
  G->>I: token valid
  I->>R: SET NX hold keys, TTL 600 s
  R-->>I: OK
  I->>DB: UPDATE seats to HELD WHERE status = AVAILABLE
  DB-->>I: 2 rows updated
  I-->>U: holdId h1, expires 10:10:00
  U->>O: POST orders holdId h1, Idempotency-Key k1
  O->>P: charge, key k1
  P-->>O: captured
  O->>I: confirm h1
  I->>DB: UPDATE seats to SOLD WHERE hold_id = h1 + insert tickets
  DB-->>I: 2 rows updated
  I--)O: confirmed
  O-->>U: Booking confirmed
  O--)U: tickets by email`,text:`Two short database transactions, separated by an arbitrary-length payment step. Nothing holds a database lock while the user types their card number.`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Schema`},{type:`code`,lang:`sql`,code:`CREATE TABLE seats (
  event_id        BIGINT      NOT NULL,
  seat_id         BIGINT      NOT NULL,          -- refers to the venue layout
  section         TEXT        NOT NULL,
  row_label       TEXT        NOT NULL,
  seat_number     INT         NOT NULL,
  best_rank       INT         NOT NULL,          -- lower = better view
  price_cents     INT         NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (status IN ('AVAILABLE', 'HELD', 'SOLD')),
  hold_id         UUID,
  held_by         BIGINT,
  hold_expires_at TIMESTAMPTZ,
  order_id        UUID,
  version         INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, seat_id)
);
CREATE INDEX seats_by_section ON seats (event_id, section, status, best_rank);

CREATE TABLE tickets (
  ticket_id  UUID   PRIMARY KEY,
  event_id   BIGINT NOT NULL,
  seat_id    BIGINT NOT NULL,
  order_id   UUID   NOT NULL,
  status     TEXT   NOT NULL DEFAULT 'ISSUED'       -- ISSUED | REFUNDED
);
-- Last line of defence: at most one live ticket per seat, enforced by the DB
CREATE UNIQUE INDEX one_live_ticket_per_seat
  ON tickets (event_id, seat_id) WHERE status = 'ISSUED';`},{type:`paragraph`,text:`There are three standard ways to make "check and hold" atomic. All three end in the same database; they differ in where the waiting happens and how losers find out they lost.`},{type:`heading3`,text:`Option A — Pessimistic Locking: SELECT ... FOR UPDATE`},{type:`paragraph`,text:`Lock the rows first, then inspect and update them inside one transaction. FOR UPDATE takes a row-level lock; any other transaction that tries to lock or update the same row waits until the first one commits or rolls back. Always lock multiple seats in a consistent order (ORDER BY seat_id) — otherwise Alice locking 7 then 8 while Bob locks 8 then 7 deadlocks (PostgreSQL detects it and aborts one, but that is wasted work). Keep these transactions tiny: never call the payment provider while holding the lock.`},{type:`code`,lang:`sql`,code:`BEGIN;
SELECT seat_id, status, hold_expires_at
FROM seats
WHERE event_id = $1 AND seat_id = ANY($2)
ORDER BY seat_id            -- consistent lock order prevents deadlocks
FOR UPDATE;

-- Application checks: every row is AVAILABLE, or HELD with hold_expires_at < now().
-- If any seat fails the check \u2192 ROLLBACK and tell the user which seats are gone.

UPDATE seats
SET status = 'HELD', hold_id = $3, held_by = $4,
    hold_expires_at = now() + interval '10 minutes',
    version = version + 1
WHERE event_id = $1 AND seat_id = ANY($2);
COMMIT;`},{type:`paragraph`,text:`For "best available", plain FOR UPDATE is a trap: every request targets the same best seats, so they all queue on the same row lock. FOR UPDATE SKIP LOCKED changes the behaviour — rows currently locked by someone else are silently skipped, so each request grabs the next free seats instead of waiting. It is the same trick used to build job queues on PostgreSQL. Caveats: it gives a deliberately inconsistent view (skipped seats may become free a millisecond later), and it does not guarantee seats are adjacent — pick candidate blocks first if the group must sit together.`},{type:`code`,lang:`sql`,code:`-- Best available: claim the $3 best free seats in a section in ONE statement
WITH picked AS (
  SELECT seat_id
  FROM seats
  WHERE event_id = $1
    AND section  = $2
    AND (status = 'AVAILABLE'
         OR (status = 'HELD' AND hold_expires_at < now()))   -- lazily reclaim expired holds
  ORDER BY best_rank
  LIMIT $3
  FOR UPDATE SKIP LOCKED      -- skip seats other buyers are claiming right now
)
UPDATE seats s
SET status = 'HELD', hold_id = $4, held_by = $5,
    hold_expires_at = now() + interval '10 minutes',
    version = s.version + 1
FROM picked
WHERE s.event_id = $1 AND s.seat_id = picked.seat_id
RETURNING s.seat_id, s.row_label, s.seat_number;
-- Fewer rows than $3 returned \u2192 section nearly sold out: roll back or offer a partial hold.`},{type:`heading3`,text:`Option B — Optimistic Concurrency: Conditional UPDATE`},{type:`paragraph`,text:`Skip the explicit lock and put the check inside the UPDATE's WHERE clause, then look at how many rows were affected. In PostgreSQL (even at the default READ COMMITTED level) a second UPDATE on the same row waits for the first to commit, then re-evaluates its WHERE clause against the new row version. Bob's condition status = 'AVAILABLE' is now false, so his UPDATE affects 0 rows. No lost update, no explicit lock, one round trip. The version column gives the same guarantee for read-modify-write flows: read version 7, then UPDATE ... WHERE version = 7 — if anyone changed the row in between, 0 rows match and you retry or give up.`},{type:`code`,lang:`sql`,code:`-- Hold specific seats: the check lives in the WHERE clause
BEGIN;
UPDATE seats
SET status = 'HELD', hold_id = $3, held_by = $4,
    hold_expires_at = now() + interval '10 minutes',
    version = version + 1
WHERE event_id = $1
  AND seat_id = ANY($2)
  AND (status = 'AVAILABLE'
       OR (status = 'HELD' AND hold_expires_at < now()));
-- Application: affected rows must equal cardinality($2).
--   equal  \u2192 COMMIT  (all seats are yours)
--   fewer  \u2192 ROLLBACK (all-or-nothing: someone beat you to at least one seat)
COMMIT;

-- Version-based variant (read first, write only if unchanged)
UPDATE seats
SET status = 'HELD', hold_id = $3, held_by = $4,
    hold_expires_at = now() + interval '10 minutes',
    version = version + 1
WHERE event_id = $1 AND seat_id = $2 AND version = $5;   -- $5 = version we read
-- 0 rows \u2192 someone changed the seat since we looked`},{type:`flow`,title:`Conditional UPDATE — the database picks exactly one winner`,code:`sequenceDiagram
  participant A as Alice
  participant DB as PostgreSQL
  participant B as Bob
  A->>DB: UPDATE A-12-7 to HELD WHERE status = AVAILABLE
  B->>DB: same UPDATE for A-12-7
  Note over DB: Bob waits on Alice's row lock
  DB-->>A: UPDATE 1 - commit
  Note over DB: Bob re-checks WHERE on the new row - status is HELD
  DB-->>B: UPDATE 0 - seat taken
  B->>B: ROLLBACK, show "seat just taken"`,text:`Losers learn they lost from a row count of 0, not from an error. Always check the affected-row count — ignoring it is how double-booking bugs ship.`},{type:`heading3`,text:`Option C — Redis Holds as a Fast Pre-Check`},{type:`paragraph`,text:`In a hot on-sale, most hold attempts for popular seats will lose. Sending every loser to PostgreSQL wastes row-lock waits on the hottest rows. A Redis SET with NX (only set if the key does not exist) and EX (TTL) is an atomic "claim this seat for 600 s" that answers in under a millisecond. Losers are rejected at Redis and never touch the database. Winners then run the conditional UPDATE in PostgreSQL. For multiple seats, use a Lua script so the claim is all-or-nothing.`},{type:`code`,lang:`lua`,code:`-- KEYS = hold keys, e.g. hold:{evt42}:A-12-7, hold:{evt42}:A-12-8
-- ARGV[1] = holdId, ARGV[2] = ttl seconds
-- The {evt42} hash tag keeps one event's keys in the same Redis Cluster slot
for i = 1, #KEYS do
  if redis.call('EXISTS', KEYS[i]) == 1 then
    return 0                       -- at least one seat already claimed
  end
end
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[1], 'EX', tonumber(ARGV[2]))
end
return 1

-- Single seat, no script needed:
--   SET hold:{evt42}:A-12-7 h1 NX EX 600   \u2192 OK or nil
-- Release only your own hold (compare-and-delete in Lua):
--   if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end`},{type:`flow`,title:`Layered defence — Redis filters, the database decides`,code:`flowchart TD
  REQ([Hold request<br/>admitted user]):::client --> RL{"Rate limit OK?<br/>per user + IP"}:::security
  RL -->|no| R429([429 slow down]):::external
  RL -->|yes| RD{"Redis SET NX<br/>all seats claimed?"}:::cache
  RD -->|"no - most losers stop here"| GONE([Seat just taken]):::external
  RD -->|yes| PG{"PostgreSQL conditional UPDATE<br/>rows = seats requested?"}:::db
  PG -->|no| UNDO[Delete Redis keys,<br/>ROLLBACK]:::server --> GONE
  PG -->|yes| OK([Hold granted, 10 min]):::highlight`,text:`Redis is an optimisation, not the authority. If Redis and PostgreSQL ever disagree, PostgreSQL wins.`},{type:`callout`,variant:`warning`,text:`Why a Redis lock alone is not enough: (1) Redis replication is asynchronous — if the primary fails after acknowledging your SET but before replicating it, the promoted replica has no key and a second user can claim the same seat. (2) TTLs measure time on the Redis server, while your app server may pause (GC, slow network) and act after its claim has silently expired. (3) Redis does not live in the same transaction as your orders and tickets, so a crash between "Redis says yes" and "order written" leaves them out of sync. Use Redis to shed load; enforce the invariant with the database conditional update and the unique index on tickets.`},{type:`heading2`,text:`Hold Expiry: Lazy Checks + a Sweeper`},{type:`paragraph`,text:`Expiry needs no timer per seat. Lazy expiry: every claim query already treats "HELD and hold_expires_at < now()" as available, so an expired hold is reclaimable the instant it expires, even if nothing has cleaned it up. A sweeper is still useful so the availability view (bitmaps, seat maps) shows expired seats as free again and so the original holder gets a "your hold expired" notification. The sweeper runs every few seconds in small batches, using SKIP LOCKED so it never blocks a buyer.`},{type:`code`,lang:`sql`,code:`-- Sweeper: release up to 1,000 expired holds per run (a little grace for in-flight payments)
WITH expired AS (
  SELECT event_id, seat_id
  FROM seats
  WHERE status = 'HELD'
    AND hold_expires_at < now() - interval '30 seconds'
  LIMIT 1000
  FOR UPDATE SKIP LOCKED
)
UPDATE seats s
SET status = 'AVAILABLE', hold_id = NULL, held_by = NULL,
    hold_expires_at = NULL, version = s.version + 1
FROM expired e
WHERE s.event_id = e.event_id AND s.seat_id = e.seat_id
RETURNING s.event_id, s.seat_id;   -- publish HoldExpired events for these`},{type:`flow`,title:`Two ways a hold ends`,code:`flowchart LR
  H[(Seat HELD<br/>expires 10:10:00)]:::db --> T{10:10:00 passes}
  T --> LZ["Lazy: next claim query sees<br/>hold_expires_at older than now<br/>and takes the seat"]:::server
  T --> SW["Sweeper, every few seconds:<br/>flip back to AVAILABLE"]:::queue
  SW --> EV[[HoldExpired event]]:::queue
  EV -.-> BM[Refresh availability bitmap]:::cache
  EV -.-> NT[Notify user: hold expired]:::server`,text:`Correctness comes from the lazy check inside the claim query; the sweeper only keeps the display tidy. The Redis key TTL expires by itself.`},{type:`heading2`,text:`Payment and the Timeout Race`},{type:`paragraph`,text:`The nastiest edge case: the user pays at 10:09:58, the bank takes 20 seconds, the hold expired at 10:10:00 and someone else grabbed the seat at 10:10:05. Money was taken for a seat you no longer have. Defences, used together: (1) when the user clicks Pay, extend the hold once by a bounded amount (e.g. +5 min, status stays HELD with the same hold_id), so slow payments are covered; (2) never start a charge on a hold with less than ~60 s left without extending it first; (3) confirm checks ownership — UPDATE ... WHERE hold_id = $holdId AND status = 'HELD' — so a late confirm can never steal a seat from the next buyer; (4) if confirm affects fewer rows than expected, automatically refund (idempotently) and tell the user. A late confirm on an expired-but-unclaimed hold is safe to accept: hold_id still matches, so nobody else owns the seat.`},{type:`code`,lang:`sql`,code:`-- Confirm after payment: ownership check, not just status check
BEGIN;
UPDATE seats
SET status = 'SOLD', order_id = $3, hold_expires_at = NULL, version = version + 1
WHERE event_id = $1
  AND hold_id  = $2          -- still MY hold (nobody re-claimed it)
  AND status   = 'HELD';
-- affected rows = seats in the order \u2192 insert tickets, mark order CONFIRMED, COMMIT
-- fewer rows                         \u2192 ROLLBACK, refund via the Payment System
INSERT INTO tickets (ticket_id, event_id, seat_id, order_id)
SELECT gen_random_uuid(), event_id, seat_id, $3
FROM seats
WHERE event_id = $1 AND order_id = $3;
COMMIT;`},{type:`flow`,title:`Payment succeeds after the hold expired`,code:`sequenceDiagram
  actor A as Alice
  participant O as Checkout
  participant P as Payment System
  participant DB as Inventory DB
  actor B as Bob
  A->>O: Pay for hold h1 (expires 10:10:00)
  O->>DB: extend h1 by 5 min if still mine
  alt extension succeeded
    O->>P: charge, key k1
    P-->>O: captured (slow bank)
    O->>DB: confirm WHERE hold_id = h1
    DB-->>O: 2 rows - SOLD
    O-->>A: Tickets confirmed
  else hold already gone
    Note over DB,B: Bob claimed the seats at 10:10:05
    O-->>A: Hold expired - please pick again (no charge made)
  end
  Note over O,P: If confirm ever returns fewer rows - refund with key k1-refund`,text:`Extend before charging, check ownership when confirming, refund automatically as a last resort. The payment idempotency key (Payment System design) ensures a retried charge or refund never happens twice.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`The Waiting Room in Detail`},{type:`bullets`,items:[`Joining: when a user opens the on-sale page, the edge assigns a queue number (Redis INCR on a per-event counter) and returns it in a signed cookie. Users who arrive before on-sale time are shuffled randomly at the start, so refreshing at 09:59:59.9 gives no advantage over arriving at 09:55.`,`Polling: the client asks "what number is being served now?" every 10–15 s. That value is one integer per event, cached at the CDN for 1–2 s — so 133,000 polls/s (667,000/s for 10M users) are almost entirely edge cache hits.`,`Admission: an admission controller advances "now serving" by N per second. N is tuned to downstream capacity and adapts: slow it if hold latency or DB CPU rises, stop it when inventory hits zero and tell everyone still waiting.`,`Token: when your number is served, the waiting room mints a signed token (HMAC or JWT) containing userId, eventId, issuedAt and expiry (e.g. 15 min). The API Gateway verifies the signature statelessly — no database lookup per request — and rejects booking calls without a valid token for that event.`,`Abuse: one queue position per verified account; CAPTCHA or proof-of-work at join time; device and behaviour signals to spot bots; per-account ticket limits (e.g. 4) enforced at hold time; per-user and per-IP rate limits at the gateway (see the Rate Limiter design). Tokens are bound to the account, so sharing one does not help.`]},{type:`flow`,title:`Join, wait, get admitted`,code:`sequenceDiagram
  actor U as Fan
  participant E as CDN / Edge
  participant W as Waiting Room
  participant R as Redis
  participant G as API Gateway
  U->>W: join queue for event 42 (CAPTCHA passed)
  W->>R: INCR queue:42
  R-->>W: 48213
  W-->>U: position 48213 (signed cookie)
  loop every 15 s
    U->>E: GET now-serving for event 42
    E-->>U: 41000 (edge cached 2 s)
  end
  Note over W,R: admission controller adds 100 per second
  U->>W: my number is served - give me a token
  W-->>U: signed token userId, event 42, exp 15 min
  U->>G: POST holds + token
  G->>G: verify signature and expiry, no DB call`,text:`The only per-user write is one INCR at join time. Everything a waiting user does after that is a cached read.`},{type:`heading2`,text:`General Admission: Counters and the Hot-Row Problem`},{type:`paragraph`,text:`For standing-room or GA events there are no seat numbers — just "5,000 floor tickets". The obvious design is one row with remaining = 5000 and UPDATE ... SET remaining = remaining - 2 WHERE remaining >= 2. It is correct (the conditional update again), but every buyer now serialises on a single row lock: one hot row becomes the ceiling for the whole sale. The fix is to split the counter into buckets (shards): 32 rows of ~156 tickets each. A request picks a random bucket and decrements it; if that bucket is empty, it tries another. Contention drops roughly 32×, and the total can never go below zero because each bucket has its own CHECK.`},{type:`code`,lang:`sql`,code:`CREATE TABLE ga_buckets (
  event_id  BIGINT   NOT NULL,
  bucket    SMALLINT NOT NULL,
  remaining INT      NOT NULL CHECK (remaining >= 0),
  PRIMARY KEY (event_id, bucket)
);

-- Take $3 tickets from a randomly chosen bucket $2
UPDATE ga_buckets
SET remaining = remaining - $3
WHERE event_id = $1 AND bucket = $2 AND remaining >= $3
RETURNING remaining;
-- 0 rows \u2192 bucket too low: try another bucket (or sum all buckets to see if truly sold out)

-- Hold expiry returns tickets to a bucket in the same transaction
-- that marks the hold EXPIRED, so a retried sweeper cannot add them back twice.`},{type:`flow`,title:`Splitting one hot counter into buckets`,code:`flowchart LR
  subgraph HOT["One row - every buyer waits in line"]
    ALL[(remaining = 5000)]:::security
  end
  subgraph SPLIT["32 buckets - buyers spread out"]
    B1[(bucket 1: 156)]:::db
    B2[(bucket 2: 156)]:::db
    B3[(bucket ...)]:::db
    B32[(bucket 32: 164)]:::db
  end
  REQ([Buyers]):::client -->|"random bucket"| SPLIT
  B2 -.->|"empty? try another"| B3
  REB[Rebalancer near sell-out:<br/>merge leftovers]:::queue -.-> SPLIT`,text:`Near sell-out, buckets drain unevenly and buyers bounce between empty ones — a rebalancer (or falling back to a single counter for the last few hundred tickets) keeps "sold out" accurate. The same idea in Redis: DECRBY on sharded keys guarded by a Lua check.`},{type:`heading2`,text:`Sharding by Event`},{type:`bullets`,items:[`Shard key = event_id. All seats, holds, orders and tickets of one event live on one shard, so every hold and confirm is a single-shard ACID transaction — no distributed transactions.`,`The cost: a mega on-sale is a hot shard. That is fine because the waiting room caps it at ~200 tx/s, far below what one PostgreSQL primary handles. For the biggest on-sales, place the event on a dedicated, pre-provisioned shard ahead of time.`,`Catalog and search are separate, read-heavy services with their own replicas and caches; they never touch the inventory shards on the hot path.`,`Redis keys use a per-event hash tag ({evt42}) so multi-seat Lua scripts stay in one slot; for huge venues, tag per section instead to spread the load across Redis nodes.`]}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`The Database Primary Fails Mid-Sale`},{type:`paragraph`,text:`The inventory primary dies three minutes into the on-sale. What matters: (1) No committed sale may be lost. Use synchronous replication to at least one standby (PostgreSQL synchronous_commit = on with synchronous_standby_names) for inventory shards. With asynchronous replication, the last few commits can vanish on failover — a seat that was SOLD and paid for reappears AVAILABLE and gets sold again. That is an oversell, so pay the extra few milliseconds of commit latency. (2) Failover takes roughly 10–30 s. During it, the admission controller pauses (nobody new enters), hold requests fail fast with "please retry", and the waiting room shows a friendly message. (3) Holds should not expire because of your outage: after failover, extend every active hold by the outage duration. (4) In-flight payments are safe: the confirm step is retried with the same idempotency key, and if confirm ultimately fails the payment is refunded.`},{type:`flow`,title:`Primary failure during an on-sale`,code:`sequenceDiagram
  participant AC as Admission controller
  participant I as Inventory Service
  participant P1 as Primary
  participant P2 as Sync standby
  I->>P1: UPDATE seats to HELD
  P1->>P2: stream WAL, wait for ack
  P2-->>P1: ack
  P1-->>I: commit OK
  Note over P1: primary crashes
  I->>P1: next UPDATE - connection error
  I->>AC: health degraded - pause admissions
  Note over P2: promoted to primary in about 20 s
  I->>P2: extend active holds by outage time
  I->>AC: healthy - resume at a reduced rate
  Note over I,P2: Every acknowledged hold and sale survived the failover`,text:`Synchronous replication trades a few milliseconds per commit for the guarantee that "committed" means "survives losing the primary" — the right trade when the alternative is selling a seat twice.`},{type:`heading2`,text:`Other Failure Modes`},{type:`bullets`,items:[`Redis down or failed over: fall back to going straight to PostgreSQL with a lower admission rate. Correctness is unaffected because Redis was never the authority; only load shedding is lost.`,`Payment provider slow or down: stop admitting new users (they could not pay anyway), extend existing holds, and surface a clear message. Never mark seats SOLD without a confirmed capture.`,`Duplicate confirm calls (client retries, webhook replays): confirm is idempotent — the WHERE hold_id = ... AND status = 'HELD' clause makes the second call update 0 rows, and the service returns the already-confirmed order.`,`Lost events between DB and Kafka: write OrderConfirmed to an outbox table in the confirm transaction (the outbox pattern from the Payment System design) so ticket issuance and emails are never silently dropped.`,`Reconciliation: periodically compare captured payments with confirmed orders and issued tickets. Payment with no ticket → refund; ticket with no payment → page someone.`]}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`The Read Path: Seat Maps Without Hammering the Database`},{type:`paragraph`,text:`Split the seat map into two parts. The layout (seat positions, section shapes, labels) never changes for an event, so it is a versioned, immutable file on the CDN with a long cache lifetime. Availability changes constantly, but it is tiny: 2 bits per seat (available / held / sold) is ~12.5 KB for 50,000 seats. An availability publisher rebuilds the bitmap from the database (or from the stream of seat changes) every 1–2 s and pushes it to Redis and the CDN with a 1–2 s TTL. 18,000 shoppers refreshing every 5 s is 3,600 req/s and ~45 MB/s of bitmap egress — trivial for a CDN, and zero reads on the inventory database.`},{type:`flow`,title:`Seat map read path`,code:`flowchart LR
  APP([Seat map in the app]):::client -->|"layout, cached for days"| CDN[CDN]:::network
  APP -->|"availability bitmap, TTL 2 s"| CDN
  APP <-.->|"optional: SSE / WebSocket deltas"| PUSH[Push gateway]:::network
  CDN --> OBJ[(Layout files<br/>versioned)]:::db
  CDN --> RB[(Redis<br/>bitmap per event)]:::cache
  PG[(Inventory DB)]:::db -.->|"seat change stream"| PUB[Availability publisher]:::server
  PUB --> RB
  PUB -.-> PUSH`,text:`The display is eventually consistent (a few seconds stale) on purpose. Staleness only costs a failed click — the hold itself is always checked against the source of truth.`},{type:`heading2`,text:`Polling vs. Push for Live Availability`},{type:`bullets`,items:[`Polling a CDN-cached bitmap: simplest, scales with the CDN, no long-lived connections. 2–5 s staleness. The default for flash sales.`,`SSE or WebSocket deltas ("seats 1201, 1202 now HELD"): seats grey out almost instantly, fewer wasted clicks. But 18,000+ open connections per hot event need a push fleet and fan-out (same pattern as the Chat System design). Send full snapshots periodically so clients recover from missed deltas.`,`Either way, when a hold fails because the seat was taken, return the fresh status of the requested seats in the error response so the UI corrects itself immediately.`]},{type:`heading2`,text:`Keeping Hold Latency Low`},{type:`bullets`,items:[`One round trip per hold: a single conditional UPDATE (or the SKIP LOCKED CTE) instead of SELECT then UPDATE.`,`Short transactions only: no network calls inside a transaction, so row locks are held for microseconds.`,`Connection pooling (PgBouncer) so 18,000 shoppers share a few hundred database connections.`,`Catalog pages (event details, prices) come from the cache — see How Caching Works and the Distributed Cache design for TTLs and invalidation when a promoter changes a price.`]}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Pessimistic vs. Optimistic vs. Redis Pre-Check`},{type:`bullets`,items:[`Pessimistic (SELECT ... FOR UPDATE): easy to reason about, good when the transaction must read several things before deciding. Losers wait for the lock, so under heavy contention latency climbs and connections pile up. Requires consistent lock order.`,`FOR UPDATE SKIP LOCKED: ideal for "give me any N good seats" — no waiting on contended rows. Not suitable when the user asked for one specific seat (skipping it would silently ignore their choice).`,`Optimistic (conditional UPDATE / version column): one round trip, no explicit locks, losers learn instantly from a 0-row count. Best for "these exact seats". Under extreme contention many attempts fail — which is fine, because they would have failed anyway.`,`Redis SET NX pre-check: sub-millisecond rejection of losers, protects the database. Adds a second store to keep in sync and is never sufficient alone.`,`Recommended: waiting room + Redis pre-check + conditional UPDATE in PostgreSQL + unique index on tickets as the final guard.`]},{type:`flow`,title:`Choosing a concurrency strategy`,code:`flowchart TD
  Q{What is the user asking for?}
  Q -->|"These exact seats"| OPT["Conditional UPDATE<br/>WHERE status = AVAILABLE"]:::highlight
  Q -->|"Any N best seats"| SKIP["FOR UPDATE SKIP LOCKED"]:::db
  Q -->|"N general-admission tickets"| GA["Bucketed counters<br/>remaining >= n"]:::db
  Q -->|"Complex multi-row decision"| PES["SELECT ... FOR UPDATE<br/>in seat_id order"]:::server
  OPT & SKIP & GA & PES --> HOT{Flash-sale contention?}
  HOT -->|yes| RED["Add Redis SET NX pre-check<br/>+ waiting room"]:::cache
  HOT -->|no| DONE([Database alone is enough]):::client`},{type:`heading2`,text:`Other Key Decisions`},{type:`bullets`,items:[`Hold duration: short holds (5 min) recycle abandoned seats quickly but rush real buyers; long holds (15 min) are kinder but let bots park inventory. 8–10 minutes plus one extension at payment time is a common compromise.`,`Pick-your-seat vs best-available during flash sales: pick-your-seat creates massive contention on the same front rows; best-available with SKIP LOCKED spreads buyers across seats automatically. Many platforms switch to best-available for the first minutes of a mega on-sale.`,`Waiting room vs open access: a waiting room adds friction and a few minutes of wait, but without it the system either falls over or sells to whoever has the fastest bot. Enable it per event based on predicted demand (pre-registrations, artist popularity).`,`FIFO vs randomised queue: pure FIFO rewards bots and people refreshing at 09:59:59; randomising everyone who arrives before on-sale time is fairer, with FIFO after on-sale.`,`Consistency: strong for holds and sales (CP — refuse rather than risk an oversell), eventual for the seat-map display and search.`]}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`Before the On-Sale`},{type:`bullets`,items:[`Load test the full path at 2–3× the expected peak: synthetic users joining the queue, polling, holding the same hot seats, paying and abandoning. Replay traffic shapes from past on-sales, including bot-like bursts.`,`Pre-scale, do not rely on autoscaling: traffic goes from near zero to peak in seconds, while new instances take minutes. Scale gateways, booking services and push gateways up 30–60 minutes before on-sale time.`,`Pre-warm caches and the CDN: event pages, venue layouts and the initial availability bitmap should already be cached before the first user arrives.`,`Move the event to a dedicated inventory shard if needed, raise connection-pool limits, and confirm payment-provider capacity (tell the provider about the expected spike).`,`Pre-register fans (verified accounts, presale codes) to forecast demand and set the admission rate.`]},{type:`heading2`,text:`Kill Switches and Runtime Controls`},{type:`bullets`,items:[`Admission rate dial: raise or lower users per second live; set to zero to pause the sale without taking the site down.`,`Feature flags: disable pick-your-seat (best-available only), disable live push (fall back to polling), disable non-essential pages (recommendations, reviews) to free capacity.`,`Per-event kill switch: stop all holds for one event if an invariant check fails, while other events keep selling.`,`Bot response: tighten CAPTCHA, lower per-account limits, or invalidate suspicious tokens in bulk.`]},{type:`heading2`,text:`Monitoring`},{type:`paragraph`,text:`The one metric that must always be zero is oversell. Check it continuously during an on-sale, alongside queue length, admission rate, hold success rate, hold p99 latency, hold-expiry rate (a spike means checkout or payments are broken), payment failure rate and DB lock-wait time.`},{type:`code`,lang:`sql`,code:`-- Invariant 1: a SOLD seat must have exactly one issued ticket (expect zero rows)
SELECT s.event_id, s.seat_id, count(t.ticket_id) AS live_tickets
FROM seats s
LEFT JOIN tickets t
  ON t.event_id = s.event_id AND t.seat_id = s.seat_id AND t.status = 'ISSUED'
WHERE s.event_id = $1 AND s.status = 'SOLD'
GROUP BY s.event_id, s.seat_id
HAVING count(t.ticket_id) <> 1;

-- Invariant 2: never more tickets than seats (expect sold <= capacity)
SELECT count(*) FILTER (WHERE status = 'SOLD') AS sold, count(*) AS capacity
FROM seats
WHERE event_id = $1;`},{type:`callout`,variant:`important`,text:`The unique index one_live_ticket_per_seat makes a double-issued ticket physically impossible in the database — a bug elsewhere turns into a failed insert (and an alert) instead of two fans at one seat. Defence in depth: waiting room → rate limits → Redis pre-check → conditional UPDATE → unique index → invariant monitoring → reconciliation.`}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`How to Scope It`},{type:`bullets`,items:[`Ask: reserved seating, general admission, or both? Do users pick seats or get "best available"? How long is a hold? Max tickets per order?`,`Ask about the spike explicitly: how many users, how many seats, how fast? This drives the waiting-room discussion and the estimates.`,`State what you will not design in depth: payments (delegate to the Payment System, with idempotency keys), search, resale marketplace, dynamic pricing.`,`Name the invariant early: "a seat is never sold twice" — then design everything around protecting it.`]},{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How do you prevent two users from booking the same seat?`,`How do held seats get released if the user abandons checkout?`,`What happens if payment succeeds after the hold expired?`,`How do you handle 10 million users arriving for 50,000 seats?`,`Why not just use a Redis lock for seat holds?`,`How would you implement general-admission inventory without a hot row?`,`How do you show seat availability to thousands of users in near real time?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Two-step reservation: short hold transaction → payment outside any transaction → short confirm transaction with an ownership check.`,`Atomic check-and-set in the database: conditional UPDATE with an affected-row check, or FOR UPDATE / SKIP LOCKED — and when each fits.`,`Redis SET NX as a load-shedding pre-check; the database (plus a unique index) as the source of truth.`,`Lazy expiry in the claim query plus a sweeper for the display.`,`The waiting room converts an unbounded spike into a fixed admission rate — with signed tokens, fairness and bot defences.`,`Shard by event; synchronous replication for inventory so failover never loses a sale.`]},{type:`heading2`,text:`Likely Follow-Ups`},{type:`bullets`,items:[`"Seats must be adjacent" → search for contiguous free blocks per row, then claim the whole block with one conditional UPDATE (all-or-nothing).`,`"Make it multi-region" \u2192 keep each event's inventory in one home region (strong consistency), serve the waiting room and seat maps from the edge everywhere.`,`"Bots are buying everything" → verified accounts, presale codes, CAPTCHA at queue join, per-account limits, token binding, anomaly detection.`,`"Notify users when seats free up" → HoldExpired events → waitlist → Notification System push to the next user in line.`]},{type:`heading2`,text:`Common Mistakes`},{type:`bullets`,items:[`SELECT-then-UPDATE without a lock or a conditional WHERE — the textbook race condition.`,`Holding a database transaction (and its row locks) open while calling the payment provider.`,`Treating a Redis lock as the source of truth for seat ownership.`,`Trying to "scale out" the booking database to absorb the spike instead of controlling admission.`,`Forgetting the payment-after-expiry race and the refund path.`]},{type:`flow`,title:`How to walk through this design in an interview`,code:`flowchart LR
  A[Clarify<br/>seats vs GA, hold time, spike size]:::client --> B[Estimate<br/>2M users, 50K seats, 200 tx/s]:::client
  B --> C[Data model<br/>AVAILABLE, HELD, SOLD]:::db
  C --> D[No double booking<br/>conditional UPDATE]:::highlight
  D --> E[Hold, pay, confirm<br/>expiry + timeout race]:::server
  E --> F[Flash sale<br/>waiting room + Redis]:::security
  F --> G[Read path, sharding,<br/>failover, monitoring]:::network`},{type:`callout`,variant:`important`,text:`Strong candidates separate the two problems cleanly: correctness ("one seat, one buyer" — enforced by an atomic conditional write in the database) and load ("millions at once" — absorbed by a waiting room so the database only sees a few hundred transactions per second). Getting precise about the affected-row check, hold expiry, and the payment-after-expiry race is what sets a senior answer apart.`}]}]},{id:`payment-system`,title:`Payment Processing System`,icon:`ti-credit-card`,color:`#7c3aed`,bg:`#ede9fe`,accentGlow:`rgba(124,58,237,0.15)`,difficulty:`Advanced`,tagline:`ACID transactions, Saga pattern, distributed locks, idempotency keys, and PCI DSS compliance.`,tags:[`ACID`,`Saga Pattern`,`Idempotency`,`Distributed Transactions`,`PCI DSS`],estimatedTime:`70 min`,sections:[{id:`problem`,title:`Problem Understanding`,icon:`ti-target`,blocks:[{type:`heading2`,text:`What Are We Building?`},{type:`paragraph`,text:`A payment processing system like Stripe or PayPal. Handles charge processing, refunds, payouts, and transaction history. Integrates with payment networks (Visa, Mastercard), banks, and external payment providers. Correctness is paramount — financial data must be exactly right.`},{type:`callout`,variant:`info`,text:`In simple terms: it is a very careful cashier with a receipt book. Every order comes with a unique order number, so if a customer repeats themselves ("did my payment go through?") the cashier checks the book instead of charging again. Every coin that moves is written down twice — where it left and where it arrived — and each night the cashier checks the book against the bank statement. Being slow is acceptable; being wrong is not.`},{type:`flow`,title:`The big picture — from "Pay" button to money moved`,code:`flowchart LR
  C([Customer clicks Pay]):::client --> API[Payment API<br/>idempotency check]:::security
  API --> PS[Payment Service]:::server
  PS --> FR[Fraud check]:::security
  PS --> PSP[Payment provider /<br/>card network]:::external
  PSP --> BANK[Customer bank]:::external
  PS --> LED[(Ledger<br/>debit + credit)]:::db
  PS -.-> N[Receipt]:::queue
  REC[Nightly reconciliation]:::queue -.->|"compare"| LED
  REC -.-> BANK`,text:`The hard part is not moving money — the provider does that. It is making sure every payment happens exactly once and is recorded correctly, even when networks time out and servers crash.`},{type:`heading2`,text:`Functional Requirements`},{type:`bullets`,items:[`Process payments (charge a card or bank account).`,`Support refunds (full and partial).`,`Payout to sellers/merchants.`,`Transaction history and reporting.`,`Support multiple payment methods: credit card, bank transfer, digital wallets.`,`Multi-currency support.`]},{type:`heading2`,text:`Non-Functional Requirements`},{type:`bullets`,items:[`1 million transactions per day.`,`P99 payment latency < 3 seconds (dependent on bank/network response).`,`Zero data loss — every transaction must be recorded, even if processing fails.`,`Exactly-once payment processing — a user must never be charged twice for the same intent.`,`Compliance: PCI DSS (Payment Card Industry Data Security Standard).`,`Audit log: every action on every transaction must be logged immutably.`]}]},{id:`concepts`,title:`Core Concepts`,icon:`ti-bulb`,blocks:[{type:`heading2`,text:`ACID Transactions`},{type:`bullets`,items:[`Atomicity: A transaction either fully succeeds or fully fails. No partial state. "All or nothing."`,`Consistency: The database moves from one valid state to another. Business rules are never violated.`,`Isolation: Concurrent transactions do not see each other's intermediate state. As if they ran sequentially.`,`Durability: Once committed, the transaction is permanent. A power failure cannot undo a committed payment.`,`ACID is guaranteed by traditional RDBMS (PostgreSQL, MySQL). NoSQL databases typically sacrifice some ACID properties for scalability.`]},{type:`heading2`,text:`Idempotency Keys`},{type:`paragraph`,text:`This is the most critical concept in payment systems. Imagine a payment request times out. Was the card charged or not? The client cannot tell. If it simply retries, the customer might be charged twice.`},{type:`paragraph`,text:`The fix is an idempotency key — a unique ID the client creates once per payment intent (one "I want to pay for this order") and sends with every attempt. "Idempotent" means doing it twice has the same effect as doing it once. The first request with a given key is processed normally. Any repeat with the same key just gets the saved result back, without charging again. The key must be stored durably in the database alongside the transaction.`},{type:`code`,lang:`typescript`,code:`// Client generates a unique key per payment attempt
const idempotencyKey = crypto.randomUUID();

// First attempt
await stripe.charges.create({
  amount: 2000,        // $20.00
  currency: 'usd',
  source: 'tok_xxxx',
  idempotency_key: idempotencyKey
});

// Network timeout \u2014 retry with SAME key
await stripe.charges.create({
  amount: 2000,
  currency: 'usd',
  source: 'tok_xxxx',
  idempotency_key: idempotencyKey  // Server returns cached result, no double charge
});`},{type:`flow`,title:`A timeout and a safe retry`,code:`sequenceDiagram
  participant C as Client
  participant P as Payment API
  participant DB as Database
  C->>P: Pay $20, key = abc-123
  P->>DB: Save key abc-123 + charge card
  DB-->>P: charged, tx_001
  P--xC: response lost (timeout)
  Note over C: Did it work? Unknown - retry with the SAME key
  C->>P: Pay $20, key = abc-123
  P->>DB: Key abc-123 seen before?
  DB-->>P: yes - result was tx_001
  P-->>C: 200 tx_001 (no second charge)`,text:`Without the key, the retry looks like a brand-new payment. With it, the server recognises the repeat and replays the original answer.`},{type:`heading2`,text:`Distributed Transactions — The 2-Phase Commit (2PC) Problem`},{type:`paragraph`,text:`In a distributed system, one payment touches several services (Payment Service, Ledger Service, Notification Service), each with its own database. 2-Phase Commit is the classic way to make them all commit together. A coordinator runs two rounds. Phase 1 (Prepare): it asks every participant "can you commit?" and each one locks its data and says yes or no. Phase 2 (Commit): if all said yes, it tells everyone to commit. The problem: if the coordinator crashes between the two phases, participants are stuck holding locks, not knowing whether to commit or abort. 2PC is blocking and slow.`},{type:`flow`,title:`2-Phase Commit and where it gets stuck`,code:`sequenceDiagram
  participant CO as Coordinator
  participant PAY as Payment DB
  participant LED as Ledger DB
  Note over CO,LED: Phase 1 - Prepare
  CO->>PAY: Prepare?
  PAY-->>CO: Yes (rows locked)
  CO->>LED: Prepare?
  LED-->>CO: Yes (rows locked)
  Note over CO: Coordinator crashes here
  Note over PAY,LED: Both wait with locks held - commit or abort? Nobody knows
  Note over CO,LED: Phase 2 - Commit (only if coordinator survives)
  CO->>PAY: Commit
  CO->>LED: Commit`},{type:`heading2`,text:`The Saga Pattern (Solution to 2PC)`},{type:`paragraph`,text:`A Saga splits one big transaction into a series of small local transactions, one per service. Each step commits straight away in its own database, so no locks are held across services. Every step also has a compensating transaction — an "undo" action (e.g., release a card hold, issue a refund). If a later step fails, the saga runs the undo actions for the steps that already succeeded, in reverse order.`},{type:`bullets`,items:[`Choreography Saga: Each service publishes events; other services react. Decoupled but hard to track the overall flow.`,`Orchestration Saga: A central Saga Orchestrator tells each service what to do, tracks state, and triggers compensating transactions on failure. Easier to debug and monitor.`]},{type:`flow`,title:`Saga — do, do, do … or undo in reverse`,code:`flowchart LR
  S1[1. Reserve funds<br/>card hold]:::server --> S2[2. Record in ledger]:::server
  S2 --> S3[3. Capture funds]:::server
  S3 --> OK([Payment done]):::highlight
  S3 -.->|"fails"| U2[Undo 2:<br/>reverse ledger entry]:::security
  U2 -.-> U1[Undo 1:<br/>release card hold]:::security
  U1 -.-> FAIL([Payment declined,<br/>nothing charged]):::external`,text:`Each step commits on its own. Consistency is restored by running compensations, not by holding locks — so a crash never leaves services frozen.`},{type:`flow`,title:`Choreography vs orchestration`,code:`flowchart TB
  subgraph CHOREO["Choreography - services react to events"]
    A1[Payment]:::server -.->|"PaymentReserved"| B1[Ledger]:::server
    B1 -.->|"LedgerRecorded"| C1[Capture]:::server
    C1 -.->|"Captured"| D1[Notification]:::server
  end
  subgraph ORCH["Orchestration - one conductor"]
    O[Saga Orchestrator<br/>tracks state]:::highlight --> A2[Payment]:::server
    O --> B2[Ledger]:::server
    O --> C2[Capture]:::server
    O --> D2[Notification]:::server
  end`,text:`Choreography has no central brain, so the full flow is hard to see. Orchestration puts the whole flow (and every undo) in one place — the usual choice for payments.`}]},{id:`architecture`,title:`High-Level Architecture`,icon:`ti-topology-star`,blocks:[{type:`heading2`,text:`Components`},{type:`bullets`,items:[`Payment API Gateway: Entry point. Validates requests, checks idempotency keys, authenticates merchants.`,`Payment Service: Core business logic. Orchestrates the payment saga.`,`Ledger Service: Maintains double-entry bookkeeping ledger. Every debit has a matching credit.`,`Payment Provider Integration Service: Connects to Stripe, Adyen, or directly to card networks (Visa/Mastercard via the acquiring bank — the merchant's bank, which accepts card payments on its behalf).`,`Fraud Detection Service: Real-time ML-based fraud scoring. Blocks suspicious transactions.`,`Idempotency Store: PostgreSQL table + Redis cache for idempotency key lookup.`,`Notification Service: Sends payment receipts, failure alerts.`,`Reconciliation Service: Nightly batch job reconciles internal ledger against bank statements.`,`Audit Log: Append-only event store recording every action.`]},{type:`flow`,title:`High-level architecture`,code:`flowchart TB
  M([Merchant / Checkout]):::client --> GW[Payment API Gateway<br/>auth + idempotency]:::security
  GW --> IS[(Idempotency store<br/>Redis + PostgreSQL)]:::cache
  GW --> PS[Payment Service<br/>saga orchestrator]:::server
  PS --> FD[Fraud Detection]:::security
  PS --> PI[Provider Integration]:::server
  PI --> EXT[Stripe / Adyen /<br/>card networks]:::external
  PS --> LS[Ledger Service]:::server
  LS --> LDB[(Ledger DB<br/>PostgreSQL)]:::db
  PS -.-> K[[Event bus]]:::queue
  K -.-> NS[Notification Service]:::server
  K -.-> AUD[(Audit Log<br/>append-only)]:::db
  RS[Reconciliation<br/>nightly]:::queue -.-> LDB`,text:`Everything on the money path (solid lines) is synchronous and strongly consistent. Receipts and audit records follow asynchronously through the event bus.`},{type:`heading2`,text:`Payment Saga Flow (Success Path)`},{type:`numbered`,items:[`POST /api/payments {amount, currency, paymentMethod, idempotency_key}`,`Check idempotency key — if already processed, return cached result.`,`Fraud Detection: score the transaction. If high fraud risk, decline immediately.`,`Reserve funds: call Payment Provider to pre-authorize (hold) the amount.`,`Record in Ledger: debit customer account, credit escrow.`,`Capture funds: call Payment Provider to capture the pre-authorized charge.`,`Update Ledger: move from escrow to merchant account.`,`Send receipt notification.`,`Return success response with transaction_id.`]},{type:`callout`,variant:`tip`,text:`Pre-authorize vs capture: a pre-authorization puts a hold on the money (like a hotel holding a deposit on your card) without moving it yet. Capture is the moment the money is actually taken. Escrow is a holding account where funds sit between those two steps.`},{type:`flow`,title:`Payment saga — success path`,code:`sequenceDiagram
  actor C as Client
  participant G as API Gateway
  participant P as Payment Service
  participant F as Fraud
  participant X as Provider
  participant L as Ledger
  participant N as Notifications
  C->>G: POST /api/payments + idempotency_key
  G->>G: Key seen before?
  alt already processed
    G-->>C: cached result
  else new key
    G->>P: process payment
    P->>F: score transaction
    F-->>P: low risk
    P->>X: pre-authorize (hold) $20
    X-->>P: auth_id
    P->>L: debit customer, credit escrow
    P->>X: capture auth_id
    X-->>P: captured
    P->>L: move escrow to merchant
    P--)N: send receipt
    P-->>C: 200 transaction_id
  end`}]},{id:`detailed-design`,title:`Detailed Design`,icon:`ti-puzzle`,blocks:[{type:`heading2`,text:`Double-Entry Ledger`},{type:`paragraph`,text:`Every financial system uses double-entry bookkeeping: each transaction writes two ledger entries — a debit (money leaving an account) and a credit (money arriving in another). So the total of all debits always equals the total of all credits. Because that rule must always hold, any mismatch is an instant red flag, which makes errors and fraud easy to spot and reconciliation possible.`},{type:`code`,lang:`sql`,code:`CREATE TABLE ledger_entries (
  entry_id       UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  account_id     UUID NOT NULL,
  entry_type     VARCHAR(6) NOT NULL,  -- 'DEBIT' or 'CREDIT'
  amount         NUMERIC(15, 2) NOT NULL,
  currency       CHAR(3) NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Example: $20 payment from customer to merchant
INSERT INTO ledger_entries VALUES
  (uuid(), 'tx_001', 'customer_acct', 'DEBIT',  20.00, 'USD', NOW()),
  (uuid(), 'tx_001', 'merchant_acct', 'CREDIT', 20.00, 'USD', NOW());
  -- Sum of debits == Sum of credits \u2192 Balanced \u2713`},{type:`flow`,title:`A $20 payment in the ledger`,code:`flowchart LR
  CU[(customer_acct)]:::client -->|"DEBIT 20.00"| TX{{tx_001}}:::highlight
  TX -->|"CREDIT 20.00"| ES[(escrow)]:::cache
  ES -->|"DEBIT 20.00 / CREDIT 20.00<br/>on capture"| ME[(merchant_acct)]:::db
  TX -.-> CHK["Check: total debits = total credits"]:::security`,text:`Money is never created or destroyed — it only moves between accounts, and every move is written on both sides. Entries are never edited; a correction is a new pair of entries.`},{type:`heading2`,text:`Idempotency Implementation`},{type:`code`,lang:`sql`,code:`CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  status          VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress | done
  response_status INT,
  response_body   JSONB,
  transaction_id  UUID,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP  -- typically 24 hours
);

-- On request:
-- 1. Claim the key atomically (the PRIMARY KEY makes only one request win):
INSERT INTO idempotency_keys (idempotency_key) VALUES ($1)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING idempotency_key;

-- 2. Row returned \u2192 first request: process the payment, then
UPDATE idempotency_keys
SET status = 'done', response_status = $2, response_body = $3, transaction_id = $4
WHERE idempotency_key = $1;

-- 3. No row returned \u2192 duplicate: read the existing row.
--    status = 'done'        \u2192 return the stored response (no second charge)
--    status = 'in_progress' \u2192 409, ask the client to retry shortly
--
-- Avoid SELECT-then-INSERT: two simultaneous retries could both see
-- "not found" and both charge the customer.`},{type:`flow`,title:`Idempotency check, including two retries arriving at once`,code:`flowchart TD
  R([Request with key]):::client --> INS{"Claim the key:<br/>INSERT key, status = in_progress"}:::db
  INS -->|"Inserted - first time"| PROC[Process payment]:::server
  PROC --> SAVE[Store response<br/>status = done]:::db
  SAVE --> RESP([Return response]):::highlight
  INS -->|"Key already exists"| ST{Status?}
  ST -->|done| CACHED([Return stored response]):::cache
  ST -->|in_progress| WAIT([409 - still processing,<br/>retry shortly]):::external`,text:`In production, claim the key with an INSERT first (the primary key makes it atomic) rather than SELECT-then-INSERT, so two simultaneous retries can never both start processing.`},{type:`heading2`,text:`Outbox Pattern for Reliable Event Publishing`},{type:`paragraph`,text:`The payment service has to do two things: save to its database AND publish an event to Kafka. What if it saves to the database and then crashes before publishing? The event is lost, and the rest of the system never hears about the payment. The Outbox Pattern fixes this. In the SAME database transaction as the payment, also write the event into an "outbox" table — so both are saved together or not at all. A separate outbox processor then reads new rows from that table, publishes them to Kafka, and marks them as sent. If it crashes, it simply re-sends unsent rows, so consumers must tolerate the occasional duplicate.`},{type:`flow`,title:`Outbox pattern`,code:`flowchart LR
  PS[Payment Service]:::server -->|"ONE transaction"| DB
  subgraph DB["PostgreSQL"]
    PAY[(payments row)]:::db
    OUT[(outbox row:<br/>PaymentSucceeded)]:::db
  end
  OP[Outbox processor<br/>polls or reads the WAL]:::queue -->|"read unsent rows"| OUT
  OP -->|"publish"| K[[Kafka]]:::queue
  OP -->|"mark sent"| OUT
  K -.-> N[Notifications,<br/>analytics, ...]:::server`,text:`The database write and the "I need to publish this" note are saved atomically. Publishing can be retried later as many times as needed.`}]},{id:`scalability`,title:`Scalability`,icon:`ti-trending-up`,blocks:[{type:`heading2`,text:`Database Scaling`},{type:`bullets`,items:[`1M transactions/day = ~12 transactions/second. A single PostgreSQL instance handles this easily (up to 10K TPS).`,`Shard by merchant_id for multi-tenant systems. Each shard handles a subset of merchants.`,`Read replicas for reporting queries. Never run heavy analytics on the primary.`,`Archive old transactions (> 7 years) to cheaper storage for compliance — but keep ledger entries immutable and accessible.`]},{type:`heading2`,text:`Throughput Scaling`},{type:`bullets`,items:[`The bottleneck is usually the external payment provider API (Stripe/bank), not your infrastructure.`,`Use connection pooling (PgBouncer) to maximize database throughput.`,`Async payment processing: Return a pending status immediately, process asynchronously, webhook/notify when complete.`]},{type:`flow`,title:`Scaled-out architecture`,code:`flowchart TB
  C([Checkouts]):::client --> LB[Load Balancer]:::network
  LB --> P1[Payment Service 1]:::server & P2[Payment Service N]:::server
  P1 & P2 --> PB[PgBouncer<br/>connection pool]:::network
  subgraph SH["Ledger DB - sharded by merchant_id"]
    S1[(Shard 1 primary)]:::db
    S2[(Shard 2 primary)]:::db
  end
  PB --> SH
  S1 -. replication .-> R1[(Read replica<br/>reports)]:::db
  S2 -. replication .-> R2[(Read replica<br/>reports)]:::db
  P1 & P2 --> Q[[Async payout queue]]:::queue
  Q --> W[Payout workers]:::server --> PSP[Providers / banks]:::external
  OLD[(Archive<br/>older than 7 years)]:::db
  S1 -. "archive" .-> OLD`,text:`At ~12 payments per second one database is plenty — sharding and async queues are for growth and for bulk payouts, which can wait for slow banks.`}]},{id:`reliability`,title:`Reliability & Distributed Systems`,icon:`ti-shield-check`,blocks:[{type:`heading2`,text:`Saga Compensation on Failure`},{type:`bullets`,items:[`If Capture fails after Reserve: Saga orchestrator triggers compensating transaction — release the pre-authorization.`,`If Ledger update fails after Capture: This is critical — money has left the customer's account but not reached the merchant. Saga must retry the ledger update (idempotent) or flag for manual intervention.`,`Every compensating transaction must itself be idempotent — the saga may retry it multiple times.`]},{type:`flow`,title:`Saga failure handling`,code:`flowchart TD
  R[Reserve funds]:::server --> RC{Capture OK?}
  RC -->|Yes| LU{Ledger update OK?}
  RC -->|No| REL[Compensate:<br/>release the hold]:::security
  REL --> DEC([Payment failed,<br/>customer not charged]):::external
  LU -->|Yes| DONE([Payment complete]):::highlight
  LU -->|No - money already moved| RETRY{Retry idempotent<br/>ledger update}
  RETRY -->|Succeeds| DONE
  RETRY -->|Still failing| MAN[[Flag for manual<br/>investigation]]:::queue`,text:`Before money moves, failures are simply undone. After money moves, you cannot undo silently — you must push forward with retries until the books are correct.`},{type:`heading2`,text:`Reconciliation`},{type:`paragraph`,text:`Every night, reconciliation compares your internal ledger line-by-line against the bank's or provider's statement. Any difference triggers an alert for manual investigation. It catches bugs, fraud, and infrastructure failures that slipped through everything else — the safety net that guarantees long-term financial integrity.`},{type:`flow`,title:`Nightly reconciliation`,code:`flowchart LR
  L[(Internal ledger)]:::db --> M[Match transactions<br/>by ID + amount]:::server
  B[Provider / bank<br/>settlement file]:::external --> M
  M --> Q{Everything matches?}
  Q -->|Yes| OK([Day closed]):::highlight
  Q -->|No| AL[Alert + discrepancy<br/>report]:::security
  AL --> INV[[Finance ops<br/>investigates]]:::queue`}]},{id:`performance`,title:`Performance`,icon:`ti-bolt`,blocks:[{type:`heading2`,text:`Fraud Detection Latency`},{type:`paragraph`,text:`Fraud scoring must finish in < 100ms so it does not noticeably slow the payment. Use a lightweight ML model (gradient boosted trees rather than neural networks) for real-time scoring. Do the heavy work ahead of time: compute each user's risk profile in a batch job. At payment time, the scorer only combines those ready-made features with a few details from the current transaction.`},{type:`heading2`,text:`Caching Idempotency Keys`},{type:`paragraph`,text:`Store idempotency keys in both Redis (fast lookup) and PostgreSQL (durable). First check Redis — O(1) lookup in < 1ms. If not in Redis, check PostgreSQL. This two-tier approach handles the common case (no duplicate) with minimal overhead.`},{type:`flow`,title:`Two-tier idempotency lookup`,code:`flowchart LR
  K([Incoming key]):::client --> R{In Redis?}:::cache
  R -->|"Yes, under 1 ms"| HIT([Return stored result]):::highlight
  R -->|No| PG{In PostgreSQL?}:::db
  PG -->|Yes| FILL[Refill Redis]:::cache --> HIT
  PG -->|"No - new payment"| NEW([Process payment]):::server`}]},{id:`tradeoffs`,title:`Trade-offs`,icon:`ti-scale`,blocks:[{type:`heading2`,text:`Synchronous vs. Asynchronous Payment Processing`},{type:`bullets`,items:[`Synchronous: User waits for the full payment confirmation (charge + ledger + notification). Simple UX ("Payment confirmed" immediately). Latency depends on external providers (~2-5 seconds).`,`Asynchronous: Return "payment pending" immediately. Process in background. Webhook/notification when complete. Better throughput, handles provider slowness. More complex UX.`,`Recommendation: Synchronous for user-facing payments (e-commerce). Asynchronous for bulk payouts and B2B payments.`]},{type:`flow`,title:`Sync vs async payments`,code:`sequenceDiagram
  actor U as User
  participant P as Payment Service
  participant X as Provider
  Note over U,X: Synchronous - checkout
  U->>P: Pay
  P->>X: charge
  X-->>P: OK (2-5 s)
  P-->>U: Payment confirmed
  Note over U,X: Asynchronous - bulk payouts
  U->>P: Pay out to 10,000 sellers
  P-->>U: 202 pending
  P->>X: process in background
  X-->>P: done
  P--)U: webhook: payouts complete`},{type:`heading2`,text:`Consistency vs. Availability`},{type:`paragraph`,text:`By the CAP theorem, when the network splits (a "partition"), a system must choose between staying consistent and staying available. Payment systems must be CP (Consistent + Partition Tolerant): during a partition it is better to reject payments with an error than to risk double-charging or a ledger that does not add up. Never sacrifice consistency for availability in financial systems.`}]},{id:`production`,title:`Production Considerations`,icon:`ti-server`,blocks:[{type:`heading2`,text:`PCI DSS Compliance`},{type:`bullets`,items:[`Never store raw card numbers (PANs — Primary Account Numbers) in your database. Use tokenization — store a token that references the card in a PCI-compliant vault.`,`Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.2+).`,`Access control: Only authorized services can access payment data. Strict RBAC (role-based access control).`,`Annual PCI DSS audit by a Qualified Security Assessor (QSA).`,`Network segmentation: Payment systems in isolated network segment, separate from application servers.`]},{type:`flow`,title:`Tokenization keeps card numbers out of your systems`,code:`sequenceDiagram
  participant B as Browser
  participant V as Card vault (PCI zone)
  participant A as Your backend
  participant X as Provider
  B->>V: card number entered in vault-hosted field
  V-->>B: token tok_9f2
  B->>A: pay with tok_9f2
  A->>X: charge tok_9f2
  X->>V: resolve token to real card
  X-->>A: charged
  Note over A: Your backend never sees the real card number`,text:`Because raw card numbers never reach your servers, most of your system stays out of PCI audit scope.`},{type:`heading2`,text:`Audit Logging`},{type:`bullets`,items:[`Every action on every transaction must be logged: who did what, when, from which IP.`,`Audit logs are append-only — never modified or deleted.`,`Stored in a separate system from the main database, with separate access controls.`,`Retained for 7+ years (regulatory requirement in most jurisdictions).`]}]},{id:`interview`,title:`Interview Perspective`,icon:`ti-message-2-question`,blocks:[{type:`heading2`,text:`Common Interview Questions`},{type:`bullets`,items:[`How do you prevent a user from being charged twice for the same payment?`,`How do you handle a timeout from the payment provider — do you retry?`,`Explain the Saga pattern and when you would use it over 2-Phase Commit.`,`How do you handle a partial failure in a distributed payment flow?`,`How do you ensure the integrity of financial data across services?`]},{type:`heading2`,text:`Key Talking Points`},{type:`bullets`,items:[`Idempotency keys are the most important concept — explain them clearly and concisely.`,`Double-entry ledger: every debit has a credit — mathematical invariant for integrity.`,`Saga pattern over 2PC: no distributed lock, compensating transactions on failure.`,`Outbox pattern: atomic event publishing with database transaction.`,`CP over AP: always choose consistency for financial data.`,`Reconciliation: the safety net that catches everything else.`]},{type:`flow`,title:`How to walk through this design in an interview`,code:`flowchart LR
  A[Clarify<br/>methods, volume, currencies]:::client --> B[Happy path<br/>auth, capture, ledger]:::server
  B --> C[Exactly once<br/>idempotency keys]:::highlight
  C --> D[Partial failures<br/>saga + outbox]:::server
  D --> E[Integrity<br/>double entry + reconciliation]:::db
  E --> F[Security<br/>PCI, tokens, audit]:::security`},{type:`callout`,variant:`important`,text:`Payment systems are the most nuanced system design topic. Interviewers at FAANG and fintech companies expect you to know idempotency keys, double-entry ledger, and the Saga pattern. These three concepts, explained clearly, will set you apart in any senior/staff engineer payment system interview.`}]}]}];export{K as t};