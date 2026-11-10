import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 2 — Rate Limiter
// ─────────────────────────────────────────────────────────────────────────────
export const rateLimiter: SystemDesignSystem = {
  id: 'rate-limiter',
  title: 'Rate Limiter',
  icon: 'ti-gauge',
  color: '#f59e0b',
  bg: '#fef3c7',
  accentGlow: 'rgba(245,158,11,0.15)',
  difficulty: 'Beginner',
  tagline:
    'Learn distributed counters, Redis atomicity, and the algorithms that protect every production API.',
  tags: ['Redis', 'Token Bucket', 'Sliding Window', 'Lua Scripts', 'Distributed'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A rate limiter controls how many requests a client (a user, an IP address, or an API key) can make to a service within a given time window — for example, "100 requests per minute". It protects services from abuse, DDoS attacks (floods of traffic meant to knock a service over), and buggy clients stuck in a retry loop.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it is a bouncer with a clicker counter at a club door. Every time you walk in, the bouncer clicks. Once you hit your limit for the hour, you are politely turned away ("429 — come back later") until the counter resets. Because the club has many doors (servers), all bouncers must share ONE counter.',
        },
        {
          type: 'flow',
          title: 'The big picture — check, count, then allow or reject',
          code: `flowchart LR
  C([Client]):::client -->|"API request"| RL{Rate limiter<br/>under the limit?}:::security
  RL -->|"Yes — count it"| API[Backend service]:::server
  RL -->|"No"| R429([429 Too Many Requests<br/>+ Retry-After]):::highlight
  RL <-.->|"read + increment counter"| RD[(Shared counter store<br/>Redis)]:::cache
  API -->|"200 OK"| C`,
          text: 'Every request pays a tiny tax (one counter check, under 1ms). Requests over the limit are rejected before they ever reach the backend, so the backend stays protected.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Limit requests per user/IP/API key within a time window.',
            'Return HTTP 429 Too Many Requests when limit is exceeded.',
            'Include headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.',
            'Support multiple rate limiting rules simultaneously (per-user AND per-endpoint).',
            'Allow different limits for different API tiers (free: 100/hr, paid: 10,000/hr).',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Ultra-low latency: < 1ms overhead per request (rate limit check must be near-instant).',
            'High availability: rate limiter failure should not block all traffic (fail open vs. fail closed decision).',
            'Accuracy: counts must be accurate across distributed servers.',
            'Must work across multiple instances of the API server (distributed rate limiting).',
          ],
        },
        { type: 'heading2', text: 'Why Not Just Do It in the Application?' },
        {
          type: 'paragraph',
          text: "If you have 10 API server instances, each server only sees about 1/10th of a user's traffic. If each server keeps its own counter, a user can make 10× the intended limit before any single server notices. You need a SHARED counter store (usually Redis) that every server reads and writes, so there is one accurate, global count per user.",
        },
        {
          type: 'flow',
          title: 'Per-server counters vs one shared counter',
          code: `flowchart TB
  subgraph Local["Each server counts alone — broken"]
    U1([User sends 300 req]):::client --> S1[Server 1<br/>count 100 ✅]:::server
    U1 --> S2[Server 2<br/>count 100 ✅]:::server
    U1 --> S3[Server 3<br/>count 100 ✅]:::server
  end
  subgraph Shared["All servers share one counter — correct"]
    U2([User sends 300 req]):::client --> T1[Server 1]:::server
    U2 --> T2[Server 2]:::server
    U2 --> T3[Server 3]:::server
    T1 & T2 & T3 --> R[(Redis<br/>count 300 → blocked after 100)]:::cache
  end`,
          text: 'With a limit of 100/min and 3 servers, local counters let 300 requests through. A shared counter catches the user at request 101 no matter which server they land on.',
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Algorithm 1: Token Bucket' },
        {
          type: 'paragraph',
          text: 'Imagine a bucket that holds tokens. Each request uses up one token. Tokens drip back in at a fixed rate (e.g., 10 tokens/second), but the bucket can never hold more than its maximum capacity. If the bucket is empty when a request arrives, that request is rejected.',
        },
        {
          type: 'flow',
          title: 'Token bucket — one request',
          code: `flowchart TD
  REQ([Request arrives]):::client --> RF["Refill: add tokens for time passed<br/>tokens = min(capacity, tokens + rate × elapsed)"]:::server
  RF --> CHK{At least 1 token?}
  CHK -->|Yes| TAKE[Remove 1 token]:::cache --> OK([Allow]):::highlight
  CHK -->|No| NO([Reject with 429]):::security
  TICK[Refill clock<br/>e.g. 10 tokens per second]:::queue -.-> RF`,
          text: 'A full bucket lets a client burst (spend all saved tokens at once), but over time the average rate can never exceed the refill rate. Refill is calculated lazily on each request — there is no background timer per user.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Allows short bursts (if bucket is full). Smooth average rate over time.',
            'Cons: Requires storing last_refill_time and token_count per user.',
            'Used by: AWS API Gateway, Stripe API.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 2: Leaky Bucket' },
        {
          type: 'paragraph',
          text: 'Requests enter a queue (the bucket) at any rate, but leave it (are processed) at a fixed, steady rate — like water dripping from a small hole in the bottom of a bucket. If the bucket is already full when a new request arrives, that request is dropped.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Produces a very smooth, steady output rate. No bursts.',
            'Cons: Queued requests have added latency. Does not handle sudden legitimate bursts well.',
            'Used by: Traffic shaping in networking equipment.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 3: Fixed Window Counter' },
        {
          type: 'paragraph',
          text: 'Divide time into fixed windows (e.g., every minute from :00 to :60). Count requests within the current window. Reset counter at the start of each new window.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Very simple and fast. Easy to implement with Redis INCR + EXPIRE.',
            'Cons: "Edge burst" problem. If limit is 100/min, a user can make 100 requests at :59 and 100 more at :01 of the next minute — 200 requests in 2 seconds.',
          ],
        },
        {
          type: 'flow',
          title: 'The fixed-window edge burst',
          code: `sequenceDiagram
  participant U as User
  participant RL as Rate limiter (100 per min)
  Note over RL: Window 14:00 — counter = 0
  U->>RL: 100 requests at 14:00:59
  RL-->>U: all allowed (counter = 100)
  Note over RL: 14:01:00 — new window, counter resets to 0
  U->>RL: 100 requests at 14:01:01
  RL-->>U: all allowed (counter = 100)
  Note over U,RL: 200 requests in 2 seconds — double the intended rate`,
          text: 'The counter only knows which calendar minute it is in, not what happened a second ago — so bursts that straddle the boundary slip through.',
        },
        { type: 'heading2', text: 'Algorithm 4: Sliding Window Log' },
        {
          type: 'paragraph',
          text: 'Store a timestamp for every request in a sorted set (a Redis list kept in time order). When a new request arrives, drop timestamps older than the window, then count what is left — those are the requests made in the last [window_size] seconds. If that count is already at the limit, reject.',
        },
        {
          type: 'bullets',
          items: [
            'Pros: Perfectly accurate — no edge burst problem.',
            'Cons: High memory usage. Storing every request timestamp for every user is expensive at scale.',
          ],
        },
        { type: 'heading2', text: 'Algorithm 5: Sliding Window Counter (Best of Both)' },
        {
          type: 'paragraph',
          text: 'Keep just two fixed-window counters — the previous minute and the current minute — and blend them. The idea: if we are 75% of the way through the current minute, then the "last 60 seconds" still overlaps the final 25% of the previous minute, so count 25% of the previous minute\'s requests plus all of the current minute\'s.',
        },
        {
          type: 'flow',
          title: 'Sliding window counter — blending two windows',
          code: `flowchart LR
  P["Previous minute<br/>80 requests"]:::cache --> W["Weight by overlap<br/>80 × (1 − 0.75) = 20"]:::server
  C["Current minute<br/>20 requests so far<br/>75% elapsed"]:::cache --> SUM
  W --> SUM["Estimate<br/>20 + 20 = 40"]:::server
  SUM --> D{40 below limit 100?}
  D -->|Yes| OK([Allow + increment current]):::highlight
  D -->|No| NO([Reject 429]):::security`,
          text: "Two integers per user give you nearly the accuracy of storing every timestamp. The estimate assumes the previous minute's requests were spread evenly — that is the only approximation.",
        },
        {
          type: 'code',
          lang: 'text',
          code: `estimated_count = current_window_count + 
                  previous_window_count × (1 - elapsed_fraction_of_window)

Example: Limit = 100/min
Previous window count: 80
Current window count: 20  
We are 75% through the current window
Estimated = 20 + 80 × (1 - 0.75) = 20 + 20 = 40  → Allow (40 < 100)`,
        },
        {
          type: 'bullets',
          items: [
            'Pros: Very memory efficient (only 2 counters per user). Accurate enough for most use cases.',
            'Cons: Slightly approximate (but within ~0.003% error in practice).',
            'Recommended: This is the algorithm used by Cloudflare for their global rate limiter.',
          ],
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Where Does the Rate Limiter Live?' },
        {
          type: 'bullets',
          items: [
            'Client-side: Never. Clients can bypass it trivially.',
            'API Gateway: Best for platform-wide rate limiting. The gateway intercepts every request before it reaches any service. Central enforcement, single code change.',
            'Application Middleware: Per-service rate limiting with custom rules. More flexible but requires implementation in every service.',
            'Dedicated Rate Limit Service: A separate microservice that all API servers call. High availability concern — it becomes a dependency of every service.',
          ],
        },
        { type: 'heading2', text: 'Architecture Diagram Components' },
        {
          type: 'bullets',
          items: [
            'Client → API Gateway (Rate Limit Middleware) → Backend Services',
            'API Gateway queries Redis for the current count for the client identifier.',
            'If under limit: increment counter, forward request.',
            'If over limit: return 429 immediately, do not forward.',
            'Redis Cluster: Shared counter store for all gateway instances.',
            'Rules Store: Database or config service holding rate limit rules per tier/endpoint.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  C([Clients]):::client --> LB[Load Balancer]:::network
  LB --> G1[API Gateway 1<br/>rate-limit middleware]:::security
  LB --> G2[API Gateway 2<br/>rate-limit middleware]:::security
  G1 & G2 -->|"check + increment<br/>(Lua script)"| RC[(Redis Cluster<br/>shared counters)]:::cache
  RS[(Rules Store<br/>limits per tier and endpoint)]:::db -.->|"loaded + cached in memory"| G1 & G2
  G1 & G2 -->|"only if allowed"| B1[Orders Service]:::server
  G1 & G2 -->|"only if allowed"| B2[Search Service]:::server`,
          text: 'Every gateway instance shares the same Redis counters, so the limit is global. Rules change rarely, so gateways cache them locally instead of fetching them on every request.',
        },
        {
          type: 'flow',
          title: 'One request through the limiter',
          code: `sequenceDiagram
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
  end`,
          text: 'A rejected request costs only one Redis round-trip and never touches the backend service.',
        },
        { type: 'heading2', text: 'Client Identification Strategies' },
        {
          type: 'bullets',
          items: [
            'IP Address: Simple but problematic with NAT (thousands of users sharing one IP).',
            'User ID (JWT): Most accurate for authenticated APIs. Users, not IPs, are rate limited.',
            'API Key: Useful for B2B APIs where each client gets a unique key.',
            'Combination: Rate limit by IP for unauthenticated requests, by User ID once authenticated.',
          ],
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Redis Implementation — Sliding Window Counter' },
        {
          type: 'code',
          lang: 'lua',
          code: `-- Lua script for atomic sliding window counter in Redis
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
return {1, estimated + 1}  -- {allowed=true, new_count}`,
        },
        { type: 'heading2', text: 'Why a Lua Script?' },
        {
          type: 'paragraph',
          text: 'Redis runs a Lua script atomically — start to finish, with no other command allowed to run in between. That prevents a race condition (a bug caused by two operations interleaving). Without it, two requests could both read the counter at 99 (under the limit of 100), both decide "allowed", and both increment — ending at 101 with both requests let through.',
        },
        {
          type: 'flow',
          title: 'The race condition Lua prevents',
          code: `sequenceDiagram
  participant A as Gateway A
  participant R as Redis
  participant B as Gateway B
  Note over A,B: Without Lua — separate GET then INCR
  A->>R: GET count
  B->>R: GET count
  R-->>A: 99 (under 100, allow)
  R-->>B: 99 (under 100, allow)
  A->>R: INCR → 100
  B->>R: INCR → 101 (limit broken)
  Note over A,B: With Lua — check and increment as one step
  A->>R: EVALSHA script
  R-->>A: allowed, now 100
  B->>R: EVALSHA script
  R-->>B: blocked, still 100`,
          text: 'The bug is in the gap between "read" and "write". A Lua script removes that gap, because Redis runs it as one uninterruptible step.',
        },
        { type: 'heading2', text: 'Response Headers' },
        {
          type: 'code',
          lang: 'http',
          code: `HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 750
X-RateLimit-Reset: 1725638400  (Unix timestamp when window resets)
Retry-After: 45               (seconds until next window, only on 429)`,
        },
        { type: 'heading2', text: 'Multi-Level Rate Limiting' },
        { type: 'paragraph', text: 'Production systems enforce multiple simultaneous limits:' },
        {
          type: 'bullets',
          items: [
            'Per-user, per-minute: 100 requests/minute',
            'Per-user, per-day: 10,000 requests/day',
            'Per-endpoint, global: /api/v1/heavy-endpoint: 1,000 requests/minute across all users',
            'Per-IP (unauthenticated): 20 requests/minute',
          ],
        },
        {
          type: 'paragraph',
          text: 'Check all applicable rules in one round-trip using Redis pipelines (batch multiple GET commands in a single network call).',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Redis Cluster Sharding' },
        {
          type: 'paragraph',
          text: 'A single Redis instance can handle ~100K operations/second. For higher throughput, use Redis Cluster which shards keys across multiple nodes using consistent hashing. Rate limit keys are naturally distributed — different users hash to different Redis nodes.',
        },
        { type: 'heading2', text: 'The Race Condition Problem at Scale' },
        {
          type: 'paragraph',
          text: 'Even with Lua scripts (atomic per-node), Redis Cluster does not support multi-key Lua scripts across shards. If you need to check multiple rate limit keys (per-minute AND per-day) that might live on different Redis nodes, you have a challenge.',
        },
        {
          type: 'bullets',
          items: [
            'Solution 1: Use hash tags {userId} to force all keys for the same user onto the same shard. Key: "rate:{userId}:1m" and "rate:{userId}:1d" — the {userId} forces them to the same slot.',
            'Solution 2: Accept slight inaccuracy — check each limit independently. Approximate counts are acceptable for most use cases.',
          ],
        },
        {
          type: 'flow',
          title: "Hash tags keep one user's keys on one shard",
          code: `flowchart TB
  G[Gateway]:::security --> H{"Hash only the part<br/>inside the braces: userId 1234"}
  H --> N2
  subgraph Cluster["Redis Cluster"]
    N1[(Node 1<br/>other users)]:::cache
    N2[(Node 2<br/>rate:1234:1m<br/>rate:1234:1d)]:::highlight
    N3[(Node 3<br/>other users)]:::cache
  end`,
          text: "Wrapping the user ID in braces in the key name tells Redis Cluster to hash only that part, so all of a user's counters land on the same node and one Lua script can check them together.",
        },
        { type: 'heading2', text: 'Local Cache for Hot Paths' },
        {
          type: 'paragraph',
          text: 'For extremely high-traffic APIs, even a Redis call (1–2ms) adds up. Add a small in-memory cache on each API server that remembers "definitely blocked" users. Once a user hits their limit, remember that locally for a few seconds and reject their next requests immediately — no Redis call needed.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Fail Open vs. Fail Closed' },
        {
          type: 'paragraph',
          text: 'What happens if Redis goes down? This is the most important design decision for a rate limiter.',
        },
        {
          type: 'bullets',
          items: [
            'Fail Open: If Redis is unavailable, allow all requests through. Users can exceed their limits temporarily. Safer for the user experience but dangerous during a DDoS when you most need limiting.',
            'Fail Closed: If Redis is unavailable, reject all requests with 429. Guarantees protection but may cause a complete service outage even for legitimate users.',
            'Recommended: Fail open for normal services (availability > protection). Fail closed for high-security or payment APIs (protection > availability). Always set a timeout on Redis calls (< 10ms) so a slow Redis does not block the request path.',
          ],
        },
        {
          type: 'flow',
          title: 'What happens when Redis is unreachable',
          code: `flowchart TD
  R([Request]):::client --> C{Redis answers<br/>within 5–10 ms?}
  C -->|Yes| N[Normal check:<br/>allow or 429]:::cache
  C -->|"No — timeout or down"| T{Which policy<br/>for this API?}
  T -->|"Fail open<br/>(most APIs)"| FO([Allow request<br/>+ log + alert]):::highlight
  T -->|"Fail closed<br/>(login, payments)"| FC([Reject request<br/>protection first]):::security
  FO -.-> LOC[Optional: fall back to rough<br/>per-server local counters]:::server`,
          text: 'The timeout matters as much as the policy: without it, a slow Redis would make every API request slow too.',
        },
        { type: 'heading2', text: 'Redis High Availability' },
        {
          type: 'bullets',
          items: [
            'Use Redis Sentinel: automatic failover when the primary node fails.',
            'Or use Redis Cluster: built-in sharding and replication.',
            'Deploy Redis across multiple AZs for resilience.',
            'Redis data is ephemeral (counters expire). Losing a Redis node means losing rate limit counts for that window — slightly inaccurate but not catastrophic. Unlike a URL database, Redis data is not permanent business data.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Target: < 1ms Overhead' },
        {
          type: 'paragraph',
          text: 'The rate limiter adds latency to every API request. Keep it minimal:',
        },
        {
          type: 'bullets',
          items: [
            'Use Redis pipeline to batch multiple GET/SET commands: ~0.5ms for 3 commands vs. ~1.5ms for 3 separate commands.',
            'Local memory cache for "confirmed blocked" users: 0ms (no network).',
            'Connection pooling: maintain a warm pool of Redis connections. Avoid connection setup overhead per request.',
            'Timeouts: Set a hard 5ms timeout on Redis operations. If exceeded, fail open.',
          ],
        },
        { type: 'heading2', text: 'Memory Efficiency' },
        {
          type: 'bullets',
          items: [
            'Sliding window log stores every timestamp — O(requests per user per window) memory. Problematic at scale.',
            'Sliding window counter stores only 2 integers per user per window — O(1) memory. Highly efficient.',
            'Set short TTLs on all rate limit keys (2× the window size). Expired keys are automatically removed by Redis.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Algorithm Selection Trade-offs' },
        {
          type: 'bullets',
          items: [
            'Token Bucket: Best for APIs that allow bursts (download endpoints, real-time data feeds). A user can burst 100 requests instantly if they have accumulated tokens.',
            'Fixed Window: Simplest to implement, works fine for most APIs. The edge burst problem is usually acceptable in practice.',
            'Sliding Window Counter: Best balance of accuracy and efficiency. Recommended for most production use cases.',
            'Sliding Window Log: Maximum accuracy but too memory-intensive at scale. Avoid unless you have a strong business reason for per-request accuracy.',
          ],
        },
        {
          type: 'flow',
          title: 'Picking an algorithm',
          code: `flowchart TD
  S([What do you need?]):::client --> B{Allow short bursts?}
  B -->|"Yes — e.g. downloads, feeds"| TB[Token Bucket]:::highlight
  B -->|"No — need a smooth,<br/>steady output"| LB[Leaky Bucket]:::queue
  B -->|"Just a cap per window"| A{Exact accuracy<br/>worth the memory?}
  A -->|"Yes, low traffic"| SWL[Sliding Window Log]:::db
  A -->|"No — good enough is fine"| E{Edge bursts acceptable?}
  E -->|Yes| FW[Fixed Window]:::cache
  E -->|No| SWC[Sliding Window Counter<br/>the usual default]:::highlight`,
        },
        { type: 'heading2', text: 'Centralized vs. Distributed Rate Limiting' },
        {
          type: 'bullets',
          items: [
            'Centralized (single Redis): Simple, perfectly accurate. Bottleneck at very high scale.',
            'Distributed (each server has its own counter): Ultra-fast (no network), but inconsistent counts across servers. A user can exceed limits by up to N×limit where N is the number of servers.',
            'Hybrid: Use local counters for rough rate limiting. Sync to Redis periodically for accurate enforcement.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring Rate Limiters' },
        {
          type: 'bullets',
          items: [
            'Track 429 rate by client: A sudden spike in 429s for a specific user/API key may indicate a bug, not abuse.',
            'Track Redis hit rate and latency: If Redis is slow, your API is slow.',
            'Alert on sustained high 429 rates: Could indicate a DDoS in progress.',
          ],
        },
        { type: 'heading2', text: 'Graceful Degradation for Legitimate Users' },
        {
          type: 'bullets',
          items: [
            'Provide clear error messages with retry-after timing.',
            'Implement exponential backoff documentation for SDK users.',
            'For enterprise customers, allow burst quotas or grace periods.',
            'Consider a request queue for slightly-over-limit requests rather than instant rejection.',
          ],
        },
        { type: 'heading2', text: 'Security Considerations' },
        {
          type: 'bullets',
          items: [
            'IP spoofing: Limit by authenticated user ID, not IP, when possible.',
            'Rate limit bypassing via distributed requests: Use per-user limits, not per-IP.',
            'Never reveal internal rate limit keys or algorithms in error messages.',
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
            'Explain the token bucket algorithm and implement it.',
            'What is the difference between fixed window and sliding window rate limiting?',
            'How would you implement a distributed rate limiter across 50 API servers?',
            'What happens to your rate limiter if Redis goes down?',
            'How would you rate limit at the level of an API endpoint, not just a user?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Always mention the distributed nature of the problem — single-server counting is incorrect.',
            'Discuss Lua scripts for Redis atomicity — shows production knowledge.',
            'Bring up fail-open vs. fail-closed as a deliberate design decision.',
            'Mention header standards (X-RateLimit-*) for good API design.',
          ],
        },
        { type: 'heading2', text: 'Common Mistakes' },
        {
          type: 'bullets',
          items: [
            'Designing a rate limiter that only works on a single server.',
            'Forgetting to discuss what happens when the rate limit store (Redis) fails.',
            'Using the sliding window log algorithm without acknowledging its memory cost.',
            'Not considering multiple simultaneous rate limit rules.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through a rate-limiter interview',
          code: `flowchart LR
  A[Clarify<br/>who, what limit, which tiers]:::client --> B[Pick algorithm<br/>+ explain why]:::server
  B --> C[Make it distributed<br/>shared Redis counters]:::cache
  C --> D[Make it atomic<br/>Lua script]:::highlight
  D --> E[Scale it<br/>cluster + hash tags]:::server
  E --> F[Failure plan<br/>fail open vs closed]:::security`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Rate limiters are often a "depth" question — the interviewer wants to see how deep you can go. Bring up Lua atomicity, Redis Cluster sharding with hash tags, and fail-open/closed decisions to demonstrate production depth.',
        },
      ],
    },
  ],
};
