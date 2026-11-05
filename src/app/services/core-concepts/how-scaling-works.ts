import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 13 — How Scaling Works
// ─────────────────────────────────────────────────────────────────────────────
export const howScalingWorks: CoreConcept = {
  id: 'how-scaling-works',
  title: 'How Scaling Works',
  emoji: '📈',
  icon: 'ti-chart-arrows-vertical',
  color: '#65a30d',
  bg: '#ecfccb',
  accentGlow: 'rgba(101,163,13,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Vertical vs horizontal, stateless services, replicas, sharding, and consistent hashing — how systems grow from one server to millions of users.',
  tags: [
    'Horizontal Scaling',
    'Stateless Services',
    'Read Replicas',
    'Sharding',
    'Consistent Hashing',
    'Quorums',
  ],
  estimatedTime: '50 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'Scaling is the ability of a system to handle more work — more users, more requests per second, more data — by adding resources, without the experience getting slower or less reliable. A system that served 100 requests per second yesterday and must serve 10,000 tomorrow needs a plan for where that extra capacity comes from.',
        },
        {
          type: 'paragraph',
          text: 'There are only two basic moves. Vertical scaling (scaling up) means giving one machine more CPU, RAM, or faster disks. Horizontal scaling (scaling out) means adding more machines and spreading the work across them. Almost everything else in this lesson — stateless services, load balancers, replicas, sharding, consistent hashing — exists to make scaling out possible.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: imagine a coffee shop with one barista. When the queue grows, you can hire a faster barista and buy a bigger espresso machine (vertical scaling) — but there is a limit to how fast one person can work. Or you can hire more baristas and open more counters (horizontal scaling) — which works almost without limit, as long as every barista can make every drink and nobody keeps the order book in their own pocket.',
        },
        {
          type: 'flow',
          title: 'Scale up vs scale out',
          code: `flowchart LR
  subgraph V["Vertical - scale up"]
    direction TB
    S1["Server<br/>4 CPU, 16 GB"]:::server -->|"upgrade"| S2["Bigger server<br/>64 CPU, 512 GB"]:::highlight
  end
  subgraph H["Horizontal - scale out"]
    direction TB
    LB["Load balancer"]:::network --> A["Server 1"]:::server
    LB --> B["Server 2"]:::server
    LB --> C["Server 3"]:::server
    LB --> D["Server N"]:::highlight
  end`,
          text: 'Scaling up makes one box bigger. Scaling out adds more boxes behind a load balancer.',
        },
        { type: 'heading2', text: 'Vertical vs Horizontal at a Glance' },
        {
          type: 'bullets',
          items: [
            'Vertical — simplicity: no code changes, no distributed-systems problems. One machine, one copy of the data.',
            'Vertical — limits: the biggest cloud machines top out at a few hundred CPU cores and a few TB of RAM. Price grows faster than capacity near the top, and it is still a single point of failure.',
            'Horizontal — limits: practically unlimited for stateless work. Cost grows roughly linearly with commodity machines, and losing one machine only removes a fraction of capacity.',
            'Horizontal — cost: you now have a distributed system. You need load balancing, shared state, data partitioning, and you must handle partial failures and network delays.',
          ],
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
          text: 'Every machine has a ceiling. A typical web server might handle roughly 1,000–5,000 simple requests per second; a single PostgreSQL primary might handle roughly 10,000–50,000 simple queries per second before CPU, disk, or locks become the limit. When traffic exceeds that ceiling, requests queue up, latency spikes, timeouts cascade, and eventually the service falls over.',
        },
        {
          type: 'bullets',
          items: [
            'Growth: user counts and data volumes keep increasing; what fits on one box today will not in a year.',
            'Spikes: traffic is not flat. A product launch, a sale, or a viral post can bring 10–100× normal load within minutes.',
            'Availability: one machine is one point of failure. Multiple machines let the system survive the loss of any single one.',
            'Latency: users far away suffer. Scaling out across regions puts servers closer to users.',
            'Cost: paying for peak capacity 24/7 is wasteful. Elastic scaling lets you pay for capacity roughly in proportion to demand.',
          ],
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Step 1 — Make the App Tier Stateless' },
        {
          type: 'paragraph',
          text: 'Horizontal scaling only works if any server can handle any request. That is only true when servers are stateless: they keep nothing about a user in their own memory or local disk between requests. If Server A stores your login session in memory, then the next request that lands on Server B does not know who you are.',
        },
        {
          type: 'bullets',
          items: [
            'Move sessions to a shared store: keep session data in Redis (or a database) keyed by a session id cookie. Every server reads the same store, typically in about 1 ms.',
            'Or make sessions self-contained: a signed JWT carries the user id and expiry inside the token itself, so servers only need to verify the signature. The trade-off: a JWT cannot easily be revoked before it expires, so keep lifetimes short (e.g. 15 minutes) with refresh tokens.',
            'Move uploaded files to object storage (S3) instead of the local disk.',
            'Move background work to a queue (SQS, Kafka, RabbitMQ) so any worker can pick it up.',
          ],
        },
        {
          type: 'flow',
          title: 'Stateful vs stateless servers',
          code: `flowchart TB
  subgraph BAD["Stateful - sessions in server memory"]
    direction LR
    U1([User]):::client --> LB1["Load balancer"]:::network
    LB1 -->|"request 1"| SA["Server A<br/>holds session"]:::server
    LB1 -.->|"request 2: who are you?"| SB["Server B<br/>no session"]:::external
  end
  subgraph GOOD["Stateless - shared session store"]
    direction LR
    U2([User]):::client --> LB2["Load balancer"]:::network
    LB2 --> SC["Server A"]:::server
    LB2 --> SD["Server B"]:::server
    SC --> R[("Redis sessions")]:::cache
    SD --> R
  end`,
          text: 'Once state lives outside the servers, servers become interchangeable. You can add, remove, or replace them at any time.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Sticky sessions (always routing a user to the same server) are a workaround, not a fix. They create uneven load and lose the session when that server dies. Prefer stateless servers plus a shared store.',
        },
        { type: 'heading2', text: 'Step 2 — Put a Load Balancer in Front' },
        {
          type: 'paragraph',
          text: 'With stateless servers, a load balancer spreads traffic across them, health-checks them, and stops sending traffic to broken ones. Algorithms, L4 vs L7, and health checks are covered in depth in the How Load Balancers Work lesson — here, just remember that the load balancer is what turns "many servers" into "one service".',
        },
        { type: 'heading2', text: 'Step 3 — Autoscale the Fleet' },
        {
          type: 'paragraph',
          text: 'Autoscaling adds and removes servers automatically based on a metric. A typical rule: keep average CPU around 60%. If it rises above the target, add servers; if it falls well below, remove some.',
        },
        {
          type: 'bullets',
          items: [
            'Metrics: CPU is the most common. Requests per server, queue depth (for workers), or p99 latency are often better signals of real load.',
            'Warm-up: a new instance takes time — roughly 1–5 minutes to boot, start the app, and warm caches. Scale before you are at 100%, not after.',
            'Cooldown: after a scaling action, wait (e.g. 3–5 minutes) before acting again, so the new capacity can take effect. Without it the fleet oscillates up and down ("flapping").',
            'Min and max: always set a minimum (for availability, e.g. 2+ instances across zones) and a maximum (to cap cost and protect the database behind you).',
            'Scheduled scaling: if you know the 9 AM spike is coming, scale up at 8:45 instead of reacting at 9:02.',
          ],
        },
        {
          type: 'flow',
          title: 'The autoscaling control loop',
          code: `flowchart TD
  M["Collect metric every 60s<br/>average CPU, req per server"]:::network --> D{"CPU vs target 60%?"}:::highlight
  D -->|"above 70%"| UP["Add instances"]:::server
  D -->|"below 40%"| DOWN["Remove instances<br/>drain connections first"]:::server
  D -->|"in range"| M
  UP --> W["Warm-up: boot, health check,<br/>slow-start traffic"]:::cache
  W --> CD["Cooldown 3-5 min"]:::queue
  DOWN --> CD
  CD --> M`,
          text: 'Warm-up and cooldown keep the loop from overreacting to its own actions.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Autoscaling the app tier can move the bottleneck straight to the database. Going from 10 to 100 app servers, each with a pool of 20 connections, means 2,000 database connections — enough to exhaust many databases. Cap the maximum fleet size and use a connection pooler like PgBouncer.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        {
          type: 'heading2',
          text: 'The Database Scaling Path — In the Order Teams Actually Take It',
        },
        {
          type: 'paragraph',
          text: 'Stateless app servers are easy to scale out. The database is hard, because it holds the state. Teams climb this ladder one rung at a time, and only move up when the previous rung is exhausted — each rung adds complexity.',
        },
        {
          type: 'flow',
          title: 'The database scaling ladder',
          code: `flowchart TD
  A["1. Tune queries and add indexes<br/>cheapest, often a 10-100x win"]:::db -->|"still slow"| B["2. Add a cache - Redis"]:::cache
  B -->|"reads still too high"| C["3. Add read replicas"]:::db
  C -->|"primary saturated"| D["4. Scale the primary vertically"]:::server
  D -->|"writes or data outgrow one box"| E["5. Partition and shard<br/>most complex, last resort"]:::highlight`,
          text: 'Climb only as far as you need. Many successful products never reach sharding.',
        },
        { type: 'heading3', text: '1. Query and index tuning' },
        {
          type: 'paragraph',
          text: 'Before buying hardware, find slow queries (pg_stat_statements, the slow query log) and run EXPLAIN ANALYZE on them. A missing index can turn a 300 ms full table scan into a 1 ms index lookup — a bigger win than any server upgrade. Fix N+1 queries, add connection pooling, and select only the columns you need.',
        },
        { type: 'heading3', text: '2. Caching' },
        {
          type: 'paragraph',
          text: 'Most apps are read-heavy — often 10–100 reads for every write. Putting Redis or Memcached in front of the database (cache-aside: check the cache, on a miss read the database and store the result with a TTL) can absorb roughly 80–95% of reads. The hard part is invalidation: deciding when cached data is stale.',
        },
        { type: 'heading3', text: '3. Read replicas' },
        {
          type: 'paragraph',
          text: 'A replica is a copy of the primary database that continuously applies the primary’s write log. All writes go to the primary; reads are spread across replicas. Five replicas give roughly five times the read capacity — but write capacity does not change at all.',
        },
        {
          type: 'bullets',
          items: [
            'Asynchronous replication: the primary confirms the write immediately and ships the change to replicas afterwards. Fast, but replicas lag behind — usually milliseconds, sometimes seconds under load. If the primary dies, writes not yet shipped are lost when a replica is promoted.',
            'Synchronous replication: the primary waits until at least one replica confirms before acknowledging the write. No data loss on failover, but every write pays an extra network round trip, and if the synchronous replica is down, writes stall.',
            'Semi-synchronous (a common middle ground): wait for one replica, replicate to the rest asynchronously.',
          ],
        },
        {
          type: 'flow',
          title: 'Replication lag breaks read-your-writes',
          code: `sequenceDiagram
  participant U as User
  participant App
  participant P as Primary
  participant R as Replica
  U->>App: Update my profile name to Sam
  App->>P: UPDATE users SET name = Sam
  P-->>App: OK, committed
  App-->>U: Saved
  U->>App: Reload profile page
  App->>R: SELECT name FROM users
  Note over R: change not applied yet, 200 ms lag
  R-->>App: old name Alex
  App-->>U: Shows Alex - user thinks the save failed
  P-->>R: replication catches up`,
          text: 'The write succeeded, but the read went to a replica that had not caught up yet.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Read-your-writes fixes: (1) route a user’s reads to the primary for a few seconds after they write; (2) always read the user’s own data from the primary and everyone else’s from replicas; (3) track the write’s log position and only read from a replica that has reached it.',
        },
        { type: 'heading3', text: '4. Vertical scaling of the database' },
        {
          type: 'paragraph',
          text: 'Before sharding, move the primary to a much bigger machine: more RAM so the whole working set fits in the buffer pool, faster NVMe disks, more cores. This is boring and expensive — and usually far cheaper than the engineering cost of sharding. A single large primary can often carry a product to tens of millions of users.',
        },
        { type: 'heading3', text: '5. Partitioning and sharding' },
        {
          type: 'paragraph',
          text: 'When writes or total data size outgrow the biggest machine, split the data. This is the only rung that scales writes, and the most complex one. The next sections explain how.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Vertical vs Horizontal Partitioning' },
        {
          type: 'bullets',
          items: [
            'Vertical partitioning: split by columns or by feature. Move the large, rarely read bio and settings columns into a separate table, or move the whole payments domain into its own database. Each piece is smaller, but one table can still outgrow one machine.',
            'Horizontal partitioning (sharding): split by rows. Users 1–1M live on shard 1, users 1M–2M on shard 2. Every shard has the same schema but holds a different subset of rows. This is what lets a single giant table scale across many machines.',
          ],
        },
        {
          type: 'flow',
          title: 'Splitting a users table two ways',
          code: `flowchart TB
  T[("users table<br/>id, name, email, bio, settings")]:::db
  T -->|"vertical: split columns"| VA[("users_core<br/>id, name, email")]:::db
  T -->|"vertical: split columns"| VB[("users_profile<br/>id, bio, settings")]:::db
  T -->|"horizontal: split rows"| H1[("Shard 1<br/>ids 1 to 1M")]:::highlight
  T -->|"horizontal: split rows"| H2[("Shard 2<br/>ids 1M to 2M")]:::highlight
  T -->|"horizontal: split rows"| H3[("Shard 3<br/>ids 2M to 3M")]:::highlight`,
        },
        { type: 'heading2', text: 'Three Ways to Decide Which Shard Owns a Row' },
        {
          type: 'bullets',
          items: [
            'Range-based: each shard owns a range of the key (A–F, G–M, …, or dates by month). Range scans are efficient because neighbours live together. Risk: hot spots — if the key is a timestamp, every new write hits the newest shard.',
            'Hash-based: shard = hash(key) mod N. Spreads keys evenly and avoids hot ranges. Cost: range queries must ask every shard, and changing N moves almost every key (fixed by consistent hashing, below).',
            'Directory / lookup-based: a lookup table maps each key (or tenant) to a shard. Fully flexible — you can move one big customer to its own shard. Cost: the directory is an extra hop, must be cached, and must be highly available.',
          ],
        },
        {
          type: 'flow',
          title: 'Range vs hash vs directory routing',
          code: `flowchart LR
  K(["user_id = 4821"]):::client --> RG{"Range<br/>which range contains 4821?"}:::network
  K --> HS{"Hash<br/>hash 4821 mod 4"}:::network
  K --> DR{"Directory<br/>look up 4821"}:::network
  RG --> S1[("Shard 1: ids 1 to 10,000")]:::db
  HS --> S3[("Shard 3")]:::db
  DR --> LK[("Lookup table<br/>4821 to Shard 2")]:::cache
  LK --> S2[("Shard 2")]:::db`,
        },
        { type: 'heading2', text: 'Choosing a Shard Key' },
        {
          type: 'paragraph',
          text: 'The shard key is the most important and least reversible decision in sharding. A good key has high cardinality (many distinct values), spreads both data and traffic evenly, and matches the most common query — so most queries hit exactly one shard.',
        },
        {
          type: 'bullets',
          items: [
            'Good: user_id for a social app — almost every query is about one user, and users are numerous.',
            'Good: tenant_id for a B2B SaaS app — each customer’s data stays together, so joins inside a tenant still work.',
            'Bad: country — low cardinality, wildly uneven (one country may hold 40% of users).',
            'Bad: created_at — every new write lands on the same latest shard.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Hot partitions (the celebrity problem): even with a good key, one key can be far hotter than the rest. A celebrity with 100M followers makes their shard melt while others sit idle. Fixes: cache hot keys aggressively, split a hot key by adding a suffix (celeb_123#0 … celeb_123#9) and fan reads across the pieces, or give very large tenants a dedicated shard via the directory.',
        },
        { type: 'heading2', text: 'Cross-Shard Queries and Joins' },
        {
          type: 'paragraph',
          text: 'Once rows live on different machines, anything that spans shards gets expensive. "Top 10 posts across all users" must scatter the query to every shard and gather the results. A JOIN between users on shard 1 and orders on shard 4 cannot be done by the database — the application must fetch both and join them in code. Transactions across shards need two-phase commit or sagas, which are slower and more fragile.',
        },
        {
          type: 'flow',
          title: 'Single-shard vs scatter-gather',
          code: `flowchart LR
  subgraph ONE["Query includes shard key - fast"]
    Q1(["posts WHERE user_id = 42"]):::client --> R1["Router"]:::network --> SH2[("Shard 2 only")]:::db
  end
  subgraph ALL["Query lacks shard key - slow"]
    Q2(["top posts this hour"]):::client --> R2["Router"]:::network
    R2 --> A1[("Shard 1")]:::db
    R2 --> A2[("Shard 2")]:::db
    R2 --> A3[("Shard 3")]:::db
    A1 --> M["Merge and sort<br/>in the app"]:::server
    A2 --> M
    A3 --> M
  end`,
          text: 'Design the schema so the hot paths always include the shard key. Precompute cross-shard views (counters, leaderboards) asynchronously.',
        },
        { type: 'heading2', text: 'Resharding' },
        {
          type: 'paragraph',
          text: 'Eventually a shard fills up and you must split it or add shards. With hash mod N, going from 4 to 5 shards changes the owner of roughly 80% of all keys — a massive, risky data migration. Common approaches: start with many logical shards (e.g. 1,024) mapped onto a few physical machines and move whole logical shards later; or use consistent hashing so only a small fraction of keys move. Migrations usually double-write to old and new locations, backfill, verify, then cut over.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Growing an App from 1,000 to 10 Million Users' },
        {
          type: 'paragraph',
          text: 'Imagine a photo-sharing app. The numbers below are rough, but the order of changes is what real teams go through. Notice that each stage fixes the current bottleneck — nobody starts with sharding.',
        },
        {
          type: 'numbered',
          items: [
            '1,000 users (~1 request/sec at peak): one small VM runs the web app and PostgreSQL together. Cost: roughly $20–50/month. Anything more is premature.',
            '10,000 users (~10–50 req/s): the database and app fight over CPU and RAM. Move the database to its own managed instance. Add daily backups. Put images in object storage (S3) behind a CDN.',
            '100,000 users (~200–500 req/s): one app server is at 80% CPU and every deploy causes downtime. Make the app stateless (sessions to Redis), run 3+ app servers behind a load balancer across availability zones, add slow-query monitoring and missing indexes.',
            '1 million users (~2,000–5,000 req/s): the database is the bottleneck — 90% of queries are reads (feeds, profiles). Add a Redis cache for hot reads (~90% hit rate) and 2–3 read replicas. Turn on autoscaling for app servers. Move thumbnail generation and email to a queue with workers.',
            '10 million users (~20,000–50,000 req/s): the primary is on the biggest sensible instance and write volume (likes, comments) plus a multi-TB photos-metadata table are pushing it. Shard the hot tables by user_id, use consistent hashing for the cache cluster, add multiple regions behind GeoDNS, and split write-heavy features (notifications, chat) into their own services and data stores.',
          ],
        },
        {
          type: 'flow',
          title: 'The 10M-user architecture',
          code: `flowchart TB
  U([Users worldwide]):::client --> DNS["GeoDNS + CDN"]:::network
  DNS --> LB["Regional load balancer"]:::network
  LB --> APP["Autoscaled stateless app fleet"]:::server
  APP --> C[("Redis cluster<br/>consistent hashing")]:::cache
  APP --> RT["Shard router"]:::network
  RT --> SA[("Shard A<br/>primary + replicas")]:::db
  RT --> SB[("Shard B<br/>primary + replicas")]:::db
  RT --> SC[("Shard C<br/>primary + replicas")]:::db
  APP --> Q[["Queue"]]:::queue
  Q --> W["Workers: thumbnails, email, fan-out"]:::server
  APP --> S3[("Object storage")]:::external`,
          text: 'Every box here was added to remove a specific, measured bottleneck — not because it appears in architecture diagrams.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The most expensive scaling mistake is scaling too early. Sharding at 10,000 users adds months of complexity for a problem you do not have. Measure first, then fix the bottleneck that actually exists.',
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
          title: 'At a glance — a request through a scaled system',
          code: `flowchart LR
  C([Client]):::client -->|"1"| LB["Load balancer"]:::network
  LB -->|"2"| APP["Stateless app server"]:::server
  APP -->|"3. cache hit?"| CA[("Cache")]:::cache
  APP -->|"4. route by shard key"| RT["Shard router"]:::network
  RT -->|"5a. write"| P[("Shard primary")]:::db
  RT -->|"5b. read"| R[("Shard replica")]:::db
  P -.->|"replicate"| R`,
          text: 'The step cards below expand each hop.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-scaling-request-path',
            title: 'Horizontally Scaled Request Path',
            subtitle:
              'How one request flows through a load balancer, a stateless autoscaled fleet, a cache, a shard router, and replicated shards',
            nodes: [
              {
                id: 'scaling-client',
                name: 'Client',
                subtitle: 'Browser or Mobile App',
                type: 'client',
                icon: 'ti-device-mobile',
                badge: 'Request',
                protocol: 'GET /users/4821/feed',
                details: [
                  'Sends an HTTPS request with a session cookie or JWT',
                  'Has no idea how many servers or shards exist behind the address',
                ],
              },
              {
                id: 'scaling-lb',
                name: 'Load Balancer',
                subtitle: 'Spreads Traffic Across Healthy Servers',
                type: 'network',
                icon: 'ti-arrows-split-2',
                badge: 'L7 Balancer',
                protocol: 'Least Connections',
                details: [
                  'Picks a healthy app server; no sticky sessions needed',
                  'Newly autoscaled servers join after passing health checks, with slow-start',
                ],
              },
              {
                id: 'scaling-app',
                name: 'Stateless App Server',
                subtitle: 'One of 2–200 Interchangeable Instances',
                type: 'server',
                icon: 'ti-server',
                badge: 'Autoscaled',
                protocol: 'Target CPU 60%',
                details: [
                  'Verifies the JWT signature or loads the session from Redis — nothing stored locally',
                  'Any instance can serve any request, so the fleet can grow or shrink freely',
                ],
              },
              {
                id: 'scaling-cache',
                name: 'Distributed Cache',
                subtitle: 'Redis Cluster on a Hash Ring',
                type: 'cache',
                icon: 'ti-bolt',
                badge: 'Cache-Aside',
                protocol: '~1 ms lookup',
                details: [
                  'Key feed:4821 hashes to one cache node via consistent hashing',
                  'Roughly 90% of reads end here and never touch the database',
                ],
              },
              {
                id: 'scaling-router',
                name: 'Shard Router',
                subtitle: 'Maps Shard Key to a Database',
                type: 'gateway',
                icon: 'ti-route',
                badge: 'Routing',
                protocol: 'hash(user_id) on ring',
                details: [
                  'Computes the shard from user_id = 4821, or checks a cached directory',
                  'Sends writes to the shard primary and reads to its replicas',
                ],
              },
              {
                id: 'scaling-shard',
                name: 'Shard Primary + Replicas',
                subtitle: 'One Slice of the Data, Replicated',
                type: 'database',
                icon: 'ti-database',
                badge: 'Shard B',
                protocol: 'Async Replication',
                details: [
                  'Holds only the users whose key hashes to this shard',
                  'Replicas add read capacity and a failover target; async replicas may lag slightly',
                ],
              },
            ],
            connections: [
              {
                from: 'scaling-client',
                to: 'scaling-lb',
                label: '1. HTTPS request',
                protocol: 'TLS',
              },
              {
                from: 'scaling-lb',
                to: 'scaling-app',
                label: '2. Pick healthy server',
                protocol: 'HTTP',
              },
              {
                from: 'scaling-app',
                to: 'scaling-cache',
                label: '3. Check cache',
                protocol: 'RESP',
              },
              {
                from: 'scaling-app',
                to: 'scaling-router',
                label: '4. On miss, route by key',
                protocol: 'SQL',
              },
              {
                from: 'scaling-router',
                to: 'scaling-shard',
                label: '5. Query one shard',
                protocol: 'SQL',
              },
            ],
            keyTakeaways: [
              'Statelessness is the foundation: once no server holds user state, the app tier scales by simply adding instances.',
              'Caches and replicas scale reads; only sharding scales writes and total data size.',
              'Every query that includes the shard key touches exactly one shard. Queries without it fan out to all shards and get slower as you add shards.',
            ],
            rawSpec: `Client
  │  GET /users/4821/feed
  ▼
Load Balancer ──► picks 1 of N healthy, stateless app servers
  │
  ▼
App Server (autoscaled, CPU target 60%)
  │ 1. GET feed:4821 from Redis ── hit (~90%) ──► return
  │ 2. miss ──► Shard Router
  ▼
Shard Router: hash(4821) → position on ring → Shard B
  │
  ├── writes ──► Shard B primary
  └── reads  ──► Shard B replica (may lag ~ms)`,
          },
        },
      ],
    },
    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Consistent Hashing — Why Only ~1/N of Keys Move' },
        {
          type: 'paragraph',
          text: 'With simple hash(key) mod N, the shard depends on N. Change N from 4 to 5 and a key that was on shard hash mod 4 is now on shard hash mod 5 — different for roughly 80% of keys. For a cache that means a sudden flood of misses; for a database it means moving most of the data.',
        },
        {
          type: 'paragraph',
          text: 'Consistent hashing removes N from the formula. Picture the hash space (say 0 to 2^32 − 1) bent into a ring. Each node is hashed to a position on the ring, and so is each key. A key belongs to the first node found walking clockwise from the key’s position. When a new node joins, it takes over only the keys in the arc between itself and the previous node — on average about 1/N of all keys. Every other key stays exactly where it was. Removing a node likewise only moves that node’s keys, to its clockwise neighbour.',
        },
        {
          type: 'flow',
          title: 'The ring — adding Node D moves only one arc',
          code: `flowchart LR
  subgraph BEFORE["Before: 3 nodes"]
    direction TB
    A1["Node A at 0"]:::server --> B1["Node B at 120"]:::server
    B1 --> C1["Node C at 240"]:::server
    C1 -->|"wraps around"| A1
    K1(["key at 150 goes to C"]):::client -.-> C1
    K2(["key at 200 goes to C"]):::client -.-> C1
  end
  subgraph AFTER["After: Node D added at 180"]
    direction TB
    A2["Node A at 0"]:::server --> B2["Node B at 120"]:::server
    B2 --> D2["Node D at 180"]:::highlight
    D2 --> C2["Node C at 240"]:::server
    C2 -->|"wraps around"| A2
    K3(["key at 150 now goes to D"]):::client -.-> D2
    K4(["key at 200 stays on C"]):::client -.-> C2
  end`,
          text: 'Only keys between 120 and 180 change owner (from C to D). Keys owned by A and B never move.',
        },
        { type: 'heading3', text: 'Virtual nodes' },
        {
          type: 'paragraph',
          text: 'With only a few points on the ring, arcs are uneven — one node might own 50% of the ring by bad luck. And when a node leaves, all its keys land on a single neighbour. Virtual nodes fix both: each physical machine is placed at many positions (e.g. 100–200). Lots of small arcs average out to an even share, a departing node’s load spreads across many machines, and a bigger machine can simply get more virtual nodes. The Distributed Cache lesson walks through this in a full design.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Minimal consistent hash ring with virtual nodes
class HashRing {
  private ring: { pos: number; node: string }[] = [];

  constructor(nodes: string[], private vnodes = 150) {
    nodes.forEach((n) => this.add(n));
  }

  add(node: string) {
    for (let i = 0; i < this.vnodes; i++) {
      this.ring.push({ pos: hash(\`\${node}#\${i}\`), node });
    }
    this.ring.sort((a, b) => a.pos - b.pos);
  }

  remove(node: string) {
    this.ring = this.ring.filter((p) => p.node !== node);
  }

  // First virtual node clockwise from the key (wraps to index 0)
  get(key: string): string {
    const h = hash(key);
    let lo = 0, hi = this.ring.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].pos < h) lo = mid + 1; else hi = mid;
    }
    return this.ring[lo % this.ring.length].node;
  }
}

declare function hash(s: string): number; // e.g. 32-bit murmur3`,
        },
        { type: 'heading2', text: 'Replication Topologies' },
        {
          type: 'bullets',
          items: [
            'Leader–follower (single leader): one node accepts writes and streams them to followers. Simple, no write conflicts. Used by PostgreSQL, MySQL, MongoDB replica sets. Write capacity is limited to one node per shard.',
            'Multi-leader: several nodes (often one per region) accept writes and replicate to each other. Low write latency in every region and survives a region outage, but two leaders can change the same row concurrently, so you need conflict resolution (last-write-wins, merge rules, CRDTs).',
            'Leaderless: any replica accepts reads and writes (Dynamo-style: Cassandra, Riak, DynamoDB internally). The client or a coordinator sends each write to N replicas and waits for W acknowledgements; reads ask R replicas and take the newest version.',
          ],
        },
        {
          type: 'flow',
          title: 'Three replication topologies',
          code: `flowchart TB
  subgraph LF["Leader-follower"]
    direction LR
    L1[("Leader")]:::highlight --> F1[("Follower")]:::db
    L1 --> F2[("Follower")]:::db
  end
  subgraph ML["Multi-leader"]
    direction LR
    M1[("Leader US")]:::highlight <-->|"sync changes,<br/>resolve conflicts"| M2[("Leader EU")]:::highlight
  end
  subgraph LL["Leaderless"]
    direction LR
    CL(["Client"]):::client --> N1[("Replica 1")]:::db
    CL --> N2[("Replica 2")]:::db
    CL --> N3[("Replica 3")]:::db
  end`,
        },
        { type: 'heading3', text: 'Quorums: R + W > N' },
        {
          type: 'paragraph',
          text: 'In a leaderless system with N replicas, if every write is acknowledged by W replicas and every read asks R replicas, then whenever R + W > N the read set and write set must overlap in at least one replica — so a read always sees the latest acknowledged write. A common choice is N = 3, W = 2, R = 2. Tuning shifts the trade-off: W = 1 gives fast writes but weaker guarantees; R = 1, W = N gives fast reads but writes fail if any replica is down.',
        },
        {
          type: 'flow',
          title: 'Quorum overlap with N=3, W=2, R=2',
          code: `flowchart LR
  W(["Write v2"]):::client -->|"ack"| R1[("Replica 1: v2")]:::highlight
  W -->|"ack"| R2[("Replica 2: v2")]:::highlight
  W -.->|"slow, still v1"| R3[("Replica 3: v1")]:::db
  RD(["Read"]):::client --> R2
  RD --> R3
  R2 -->|"newest version wins"| OUT(["Returns v2"]):::cache`,
          text: 'Any 2 replicas read must include at least 1 of the 2 that were written, because 2 + 2 > 3.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Async replication and failover: if the leader acknowledges a write, then crashes before shipping it, the promoted follower never received it. That write is gone. If losing even one acknowledged write is unacceptable (payments), use synchronous or semi-synchronous replication to at least one replica, or a consensus-based database (Raft/Paxos).',
        },
        { type: 'heading2', text: 'CAP and PACELC — The Trade-off Behind It All' },
        {
          type: 'paragraph',
          text: 'Once data lives on several machines, the network between them can fail. CAP says that during a network partition (P) you must choose: keep answering and risk returning stale or conflicting data (Availability), or refuse some requests until the partition heals (Consistency). PACELC adds the everyday case: Else, when there is no partition, you still trade Latency against Consistency — waiting for more replicas is safer but slower.',
        },
        {
          type: 'bullets',
          items: [
            'CP-leaning: bank balances, inventory counts, leader election. Better to return an error than a wrong answer.',
            'AP-leaning: social feeds, like counts, shopping carts, view counters. Slightly stale is fine; being down is not.',
            'Most real systems choose per feature, not per company — the same app may use a strongly consistent database for orders and an eventually consistent store for the activity feed.',
          ],
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
            'Myth: "Horizontal scaling is always better than vertical." Reality: vertical scaling is simpler, avoids distributed-systems bugs, and modern machines are huge. Scale up first when you can; scale out when you hit the ceiling or need redundancy.',
            'Myth: "Add more app servers and it will be faster." Reality: if the database is the bottleneck, more app servers just send it more concurrent queries and make things worse.',
            'Myth: "Read replicas scale writes." Reality: every replica must apply every write. Replicas scale reads only; writes need sharding.',
            'Myth: "Sharding is the first step to scale a database." Reality: it is the last. Indexes, caching, replicas, and a bigger primary are far cheaper and usually enough.',
            'Myth: "Consistent hashing means no data moves when nodes change." Reality: roughly 1/N of keys still move — just far fewer than the ~(N−1)/N that move with mod N.',
            'Myth: "Autoscaling handles any spike." Reality: new instances take minutes to become useful. A spike that arrives in seconds needs headroom, queues, or rate limiting, not just autoscaling.',
          ],
        },
        { type: 'heading2', text: 'The Bottleneck-Hunting Mindset' },
        {
          type: 'paragraph',
          text: 'Scaling is not a single design; it is a loop. At any moment, one resource limits the whole system — CPU on the app tier, connections on the database, a single hot key, network bandwidth, a lock. Scaling anything else does nothing. Measure (latency percentiles, saturation, error rates), find the tightest constraint, relieve it, and repeat — the bottleneck will move somewhere new.',
        },
        {
          type: 'flow',
          title: 'Find it, fix it, repeat',
          code: `flowchart LR
  M["Measure<br/>p99 latency, CPU,<br/>DB connections, queue depth"]:::network --> F{"What is saturated?"}:::highlight
  F --> X["Scale or fix<br/>only that component"]:::server
  X --> V["Verify with load test<br/>and production metrics"]:::cache
  V -->|"bottleneck moved"| M`,
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
            'How Load Balancers Work: the mechanics behind spreading traffic over the stateless fleet — algorithms, health checks, connection draining and slow-start for newly autoscaled servers.',
            'How Databases Work: indexes, EXPLAIN ANALYZE and connection pooling are rung 1 of the database scaling ladder — always start there.',
            'Distributed Cache: a full design of a sharded cache using consistent hashing with virtual nodes, replication, and eviction — the caching rung at scale.',
            'Distributed Load Balancer: how the load balancer itself scales out and avoids being a single point of failure.',
            'URL Shortener: an extremely read-heavy system — a textbook case for caching plus read replicas, with short codes as a natural hash-shard key.',
            'News Feed: the celebrity problem in practice — fan-out on write for normal users, fan-out on read for celebrities to avoid hot partitions.',
            'Chat System: sharding messages by conversation id, stateful WebSocket servers that still need shared presence and routing state outside the server.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'In interviews, start with estimates (users, requests per second, read/write ratio, data size), then scale in order: stateless app tier and load balancer → cache → read replicas → shard with an explicit shard key. Say out loud what each step costs (consistency, complexity) — that trade-off talk is what interviewers listen for.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Scaling is the art of removing bottlenecks one at a time. Stateless services make compute easy to scale; caches and replicas scale reads; sharding scales writes; consistent hashing makes adding capacity cheap; and every step trades some simplicity or consistency for headroom.',
        },
      ],
    },
  ],
};
