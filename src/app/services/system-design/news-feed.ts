import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 7 — News Feed / Social Media Feed
// ─────────────────────────────────────────────────────────────────────────────
export const newsFeed: SystemDesignSystem = {
  id: 'news-feed',
  title: 'News Feed / Social Media Feed',
  icon: 'ti-layout-list',
  color: '#8b5cf6',
  bg: '#ede9fe',
  accentGlow: 'rgba(139,92,246,0.15)',
  difficulty: 'Advanced',
  tagline: 'Fan-out strategies, graph data, ranking algorithms, and infinite scroll pagination.',
  tags: ['Fan-out on Write', 'Graph Database', 'Redis Sorted Sets', 'Ranking', 'Cursor Pagination'],
  estimatedTime: '65 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: "A social media news feed like Facebook's News Feed or Twitter's Home Timeline. When you open the app, you see a ranked, personalized list of recent posts from people and pages you follow. New posts appear in near real-time.",
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: think of every user having a personal mailbox. When someone you follow posts, the post office drops a note ("post #123 is new") into your mailbox ahead of time, so when you open the app your feed is already waiting. The one exception is celebrities — copying their posts into 50 million mailboxes is too much work, so you go and pick up their posts yourself when you open the app.',
        },
        {
          type: 'flow',
          title: 'The big picture — write once, deliver to many mailboxes',
          code: `flowchart LR
  A([Alice posts]):::client --> PS[Post Service]:::server
  PS --> DB[(Post Store<br/>full post saved once)]:::db
  PS -.->|"new post event"| FO[Fan-out workers]:::queue
  FO -->|"post ID"| F1[(Bob's feed)]:::cache
  FO -->|"post ID"| F2[(Carol's feed)]:::cache
  FO -->|"post ID"| F3[(Dan's feed)]:::cache
  B([Bob opens app]):::client --> FS[Feed Service]:::server
  F1 --> FS
  DB -->|"fill in post content"| FS`,
          text: 'Writing a post happens rarely; reading feeds happens ~100× more often. So we do the extra work at write time to make every read cheap.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Users can post content (text, images, links).',
            'Users can follow/unfollow other users.',
            'Home timeline shows posts from followed users, ranked by relevance/time.',
            'New posts appear in the feed within seconds.',
            'Support infinite scroll pagination.',
            'Posts can be liked, commented on, and shared.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '300 million DAU — daily active users (like Twitter).',
            'Each user follows ~300 accounts on average.',
            '1 million posts published per day.',
            'Feed reads are 100× more frequent than writes.',
            'Feed load time: < 200ms.',
            'High availability — feeds must be readable even during partial outages.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Fan-out on Write (Push Model)' },
        {
          type: 'paragraph',
          text: '"Fan-out" means spreading one post out to many followers. With fan-out on write, the moment a user publishes a post, we copy the post ID into the feed list (the "inbox") of every follower. When a follower opens the app, their inbox is already filled in.',
        },
        {
          type: 'bullets',
          items: [
            'Reads are extremely fast — O(1): just read the ready-made feed.',
            'Writes are expensive — 1 post from a user with 1M followers = 1M write operations.',
            'Celebrity problem: A user with 1M followers causes 1M writes per post — can overwhelm the system.',
            'Best for users with few followers.',
          ],
        },
        { type: 'heading2', text: 'Fan-out on Read (Pull Model)' },
        {
          type: 'paragraph',
          text: 'With fan-out on read, nothing is prepared in advance. When a user opens their feed, we look up the recent posts of every account they follow, then merge and rank them on the spot.',
        },
        {
          type: 'bullets',
          items: [
            'Writes are cheap — just store the post once.',
            'Reads are expensive — must query all followed accounts, merge, rank. If user follows 300 accounts, that is 300 queries.',
            'Adding caching helps but the underlying approach is expensive at scale.',
            'Best for celebrities (many followers) since write fan-out is impractical.',
          ],
        },
        {
          type: 'flow',
          title: 'Push vs pull — where the work happens',
          code: `flowchart TB
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
  end`,
          text: 'Push pays at write time (cheap reads). Pull pays at read time (cheap writes). Since reads outnumber writes 100 to 1, push wins for most users.',
        },
        { type: 'heading2', text: 'Hybrid Approach (Industry Standard)' },
        {
          type: 'paragraph',
          text: "Use fan-out on write for regular users and fan-out on read for celebrities (e.g., users with > 10K followers). Regular users' posts are pushed into every follower's inbox. Celebrity posts are not pushed — they are fetched when a follower opens their feed and merged with the pre-built inbox.",
        },
        {
          type: 'flow',
          title: 'Hybrid fan-out decision',
          code: `flowchart TD
  P([New post]):::client --> Q{Author has more<br/>than 10K followers?}
  Q -->|"No - regular user"| PUSH[Push post ID into<br/>each follower inbox]:::queue
  Q -->|"Yes - celebrity"| SKIP[Skip fan-out<br/>store in author timeline only]:::db
  PUSH --> READ[Feed read]:::server
  SKIP -.->|"pulled at read time"| READ
  READ --> OUT([Merged, ranked feed]):::highlight`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "This is what Facebook, Twitter, and Instagram use. The threshold (10K followers) is tunable based on your system's performance characteristics.",
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Components' },
        {
          type: 'bullets',
          items: [
            'Post Service: Accepts new posts, validates, stores in Post DB, triggers fan-out.',
            "Fan-out Service: Reads new-post events from Kafka and writes the post IDs into each follower's feed inbox in Redis.",
            'Graph Service: Stores who follows whom (the "social graph"). Kept as an adjacency list — for each user, a list of their followers — in Redis or a graph DB.',
            'Feed Service: When a user asks for their feed, it reads their Redis inbox, fetches the full post for each post ID, ranks them, and returns one page.',
            'Post Store (Cassandra): Stores post content, metadata. Partitioned by post_id.',
            'Feed Store (Redis): Each user has a sorted set: {user_id} → [{post_id, score (timestamp)}]. Stores the most recent 1000 posts.',
            'Ranking Service: Computes feed ranking scores based on recency, engagement, and user relationships.',
            'Kafka: Event bus for decoupling post creation from fan-out — the Post Service drops an event and moves on, without waiting for the fan-out to finish.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
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
  FS --> GS`,
          text: 'The write path (left) and read path (right) only meet at the Feed Store. Kafka means posting never waits for fan-out to finish.',
        },
        { type: 'heading2', text: 'Post Creation Flow' },
        {
          type: 'numbered',
          items: [
            'User submits a post via POST /api/posts.',
            'Post Service validates, stores post in Cassandra, publishes {postId, userId, timestamp} to Kafka topic "new-posts".',
            "Fan-out Service consumes the event. Fetches the user's follower list from Graph Service.",
            "For regular users: Write postId to each follower's Redis sorted set (score = timestamp).",
            "Trim each user's sorted set to 1000 entries (remove oldest).",
            'For celebrity users: Skip fan-out. Post is fetched at read time.',
          ],
        },
        {
          type: 'flow',
          title: 'Post creation flow',
          code: `sequenceDiagram
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
  end`,
          text: 'The user gets their 201 response before fan-out even starts. Followers see the post a few seconds later.',
        },
        { type: 'heading2', text: 'Feed Read Flow' },
        {
          type: 'numbered',
          items: [
            'User requests their feed: GET /api/feed?cursor=<lastPostId>',
            "Feed Service reads the user's sorted set from Redis: get 20 post IDs from the sorted set after the cursor.",
            'If user follows celebrities: additionally fetch their latest post IDs from the Graph Service.',
            'Merge all post IDs, apply ranking score.',
            'Batch-fetch full post data from Cassandra for the top 20 posts.',
            'Return posts with next_cursor for pagination.',
          ],
        },
        {
          type: 'flow',
          title: 'Feed read flow',
          code: `sequenceDiagram
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
  FS-->>U: 20 posts + next_cursor`,
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Redis Sorted Set for Feed Storage' },
        {
          type: 'paragraph',
          text: 'A Redis sorted set is a list where every item has a number (its "score") and Redis keeps the list sorted by that score automatically. Using the post timestamp as the score gives each user a feed that is always in time order.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `Key: "feed:{userId}"
Type: Sorted Set
Members: post IDs
Score: Unix timestamp of the post

Commands:
ZADD feed:{userId} {timestamp} {postId}  → Add post to feed
ZRANGE feed:{userId} 0 19 REV            → Get 20 most recent posts
ZRANGEBYSCORE feed:{userId} -{cursor} -inf REV LIMIT 0 20  → Cursor pagination
ZREMRANGEBYRANK feed:{userId} 0 -1001    → Trim to 1000 newest`,
        },
        {
          type: 'flow',
          title: 'What a feed sorted set looks like',
          code: `flowchart LR
  K["feed:bob"]:::highlight --> E1["post 981<br/>score 1700000300"]:::cache
  E1 --> E2["post 975<br/>score 1700000200"]:::cache
  E2 --> E3["post 960<br/>score 1700000100"]:::cache
  E3 --> E4["... up to 1000 entries"]:::cache
  E4 -.->|"older ones trimmed"| X["dropped"]:::external`,
          text: 'Newest first, capped at 1000 IDs. Each entry is just an ID plus a timestamp, so even 300M feeds fit in a Redis cluster.',
        },
        { type: 'heading2', text: 'Ranking Algorithm' },
        {
          type: 'paragraph',
          text: 'Pure chronological feeds are simple but users engage with them less. A ranking algorithm gives each post a score based on:',
        },
        {
          type: 'bullets',
          items: [
            'Recency: More recent posts scored higher.',
            'Engagement: Posts with many likes/comments from your connections score higher.',
            'Relationship strength: Posts from users you interact with frequently score higher.',
            'Content type preference: If you always engage with videos, video posts score higher.',
            'Practical: Use a simple scoring formula initially. Add ML-based ranking as the product matures.',
          ],
        },
        {
          type: 'flow',
          title: 'Turning signals into a ranking score',
          code: `flowchart LR
  R[Recency]:::client --> S[Weighted score<br/>per post]:::server
  E[Engagement<br/>likes, comments]:::client --> S
  REL[Relationship<br/>strength]:::client --> S
  CT[Content type<br/>preference]:::client --> S
  S --> SORT[Sort candidates<br/>by score]:::server
  SORT --> TOP([Top 20 shown]):::highlight`,
          text: 'Start with hand-tuned weights (e.g. score = engagement × relationship ÷ age). Later, an ML model can learn the weights from what users actually click.',
        },
        { type: 'heading2', text: 'Post Data Schema (Cassandra)' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE posts (
  post_id     TIMEUUID PRIMARY KEY,
  user_id     UUID,
  content     TEXT,
  media_urls  LIST<TEXT>,
  like_count  COUNTER,
  comment_count COUNTER,
  share_count COUNTER,
  created_at  TIMESTAMP
);`,
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Feed Store Scaling' },
        {
          type: 'bullets',
          items: [
            "Redis Cluster shards feed sorted sets by user_id. Each user's feed is on one Redis node — no cross-shard operations needed.",
            'Store only post IDs (not full post content) in the feed. Post content fetched from Cassandra.',
            'Limit feed inbox to 1000 posts. Older posts fetched directly from the Post Store when needed.',
          ],
        },
        { type: 'heading2', text: 'Fan-out Scaling' },
        {
          type: 'bullets',
          items: [
            'Fan-out Service scales horizontally. Add more Kafka consumers to handle higher post volume.',
            'For high-follower users (100K+): fan-out is slow. Use a dedicated "high-follower fan-out" queue with more workers.',
            'Asynchronous fan-out: The post is immediately visible to the poster. Followers see it within seconds as the fan-out completes.',
          ],
        },
        {
          type: 'flow',
          title: 'Scaled-out architecture',
          code: `flowchart TB
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
  FS --> C[(Cassandra<br/>post content)]:::db`,
          text: 'Each user feed lives on exactly one Redis shard, so a feed read is a single-node lookup. Big accounts get their own queue so they cannot delay everyone else.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Feed Reconstruction' },
        {
          type: 'paragraph',
          text: "Redis is a cache, so a user's feed can be lost (for example, when a Redis node fails). We can always rebuild it: ask the Graph Service who the user follows, fetch those accounts' recent posts from Cassandra, and re-create the sorted set. This is slow (seconds) but only happens after failures.",
        },
        { type: 'heading2', text: 'Handling Kafka Fan-out Lag' },
        {
          type: 'paragraph',
          text: '"Consumer lag" is how far the fan-out workers are behind the newest Kafka events. If lag grows, followers see new posts late. Solutions:',
        },
        {
          type: 'bullets',
          items: [
            'Auto-scale fan-out workers based on Kafka consumer lag.',
            "Fall back to on-demand fan-out: if the user's feed is more than 5 minutes stale, fetch from Post Store at read time.",
            'Prioritize fan-out for users who are currently online (likely to view feed immediately).',
          ],
        },
        {
          type: 'flow',
          title: 'Serving a feed when things go wrong',
          code: `flowchart TD
  REQ([Feed request]):::client --> H{Redis feed<br/>exists?}
  H -->|"No - node lost"| RB[Rebuild: followed users<br/>+ recent posts from Cassandra]:::db
  RB --> SAVE[Write new sorted set]:::cache --> OUT
  H -->|Yes| ST{Fan-out lag<br/>more than 5 min?}
  ST -->|No| OUT([Serve feed]):::highlight
  ST -->|"Yes - stale"| PULL[Pull recent posts at read time<br/>and merge]:::server --> OUT
  LAG[Kafka lag alarm]:::queue -.-> SCALE[Auto-scale<br/>fan-out workers]:::server`,
          text: 'The pre-built feed is an optimisation, not the source of truth. Cassandra and the Graph Service can always produce a correct feed, just more slowly.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Infinite Scroll with Cursor Pagination' },
        {
          type: 'paragraph',
          text: 'Do NOT use offset-based pagination (LIMIT 20 OFFSET 200). To skip 200 rows, the database still has to walk past all 200 of them, so every page is slower than the last. Use cursor-based pagination instead: the cursor is the score (timestamp) of the last post you saw, and the next page is simply "posts with score < cursor". With a sorted set that costs O(log N) no matter how deep you scroll. It also avoids duplicates or skipped posts when new posts arrive while you scroll.',
        },
        {
          type: 'flow',
          title: 'Offset vs cursor pagination',
          code: `sequenceDiagram
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
  F-->>C: next 20 posts + new cursor`,
        },
        { type: 'heading2', text: 'Multi-Level Caching' },
        {
          type: 'bullets',
          items: [
            'L1 Cache: Pre-computed feed in Redis (post IDs only). Serves 95% of feed requests.',
            'L2 Cache: Cassandra serves full post data with post_id lookups. Hot posts also cached in Redis.',
            'CDN: Static media (images, videos in posts) served from CDN edge nodes.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Chronological vs. Ranked Feed' },
        {
          type: 'bullets',
          items: [
            'Chronological: Predictable, fair, no algorithmic filtering. Users see everything from followed accounts in order. Simple to implement.',
            'Ranked: Higher engagement (users see most relevant content first). But: users may miss important posts. Requires complex ranking infrastructure. Creates concerns about algorithmic bias.',
            'Product decision: Many platforms are reverting to chronological feeds due to user preference.',
          ],
        },
        { type: 'heading2', text: 'Storing Post IDs vs. Full Posts in Feed' },
        {
          type: 'bullets',
          items: [
            'Post IDs only (indirection): Feed is small (post IDs are ~16 bytes). Post content fetched on demand. Feed does not go stale when post is edited.',
            'Full post snapshots: No additional DB lookup for feed render. But: feed can contain stale content if post is edited. Storage cost is much higher.',
          ],
        },
        {
          type: 'flow',
          title: 'Post IDs vs full posts in the feed',
          code: `flowchart LR
  subgraph IDS["Store IDs - recommended"]
    F1[(Feed: 981, 975, 960)]:::cache --> P1[(Post Store)]:::db
    ED1[Post edited]:::client --> P1
    P1 --> V1([Reader sees latest text]):::highlight
  end
  subgraph FULL["Store full copies"]
    F2[(Feed: full post text<br/>x every follower)]:::cache --> V2([Reader may see old text]):::security
    ED2[Post edited]:::client -.->|"must update millions of copies"| F2
  end`,
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Content Moderation' },
        {
          type: 'bullets',
          items: [
            'Filter prohibited content before publishing (image/text classification).',
            "Shadowbanning: Keep content in the poster's view but exclude from other users' feeds.",
            'Report + review workflow: Users report content, human moderators review flagged posts.',
          ],
        },
        { type: 'heading2', text: 'Privacy & Feed Integrity' },
        {
          type: 'bullets',
          items: [
            "When a user blocks another, remove blocked user's posts from the requester's feed.",
            'When a post is deleted, remove post ID from all feed inboxes (fan-out deletion — expensive for popular posts).',
            "When a user unfollows, remove their posts from the follower's feed (fan-out on unfollow).",
          ],
        },
        {
          type: 'flow',
          title: 'Keeping feeds clean after deletes, blocks and unfollows',
          code: `flowchart TD
  D[Post deleted]:::client --> T[Mark post as deleted<br/>in Post Store]:::db
  T --> FD[Feed Service skips it<br/>immediately on read]:::server
  T -.-> BG[Background fan-out delete<br/>remove ID from inboxes]:::queue
  B[User blocks or unfollows]:::client --> FL[Filter by author<br/>at read time]:::server
  B -.-> BG2[Background cleanup<br/>of that inbox]:::queue`,
          text: 'Filtering at read time makes the change visible instantly. The slow cleanup of millions of inboxes can then happen in the background.',
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
            'Explain fan-out on write vs. fan-out on read.',
            'How do you handle celebrities with millions of followers in your fan-out design?',
            'How would you implement infinite scroll pagination efficiently?',
            'How do you rank posts in the feed?',
            'How do you keep the feed fresh when posts are deleted or edited?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Hybrid fan-out is the industry answer for celebrity problem — know the threshold.',
            'Redis sorted sets for feed storage — very specific and shows depth.',
            'Cursor-based pagination is non-negotiable at scale — explain why offset pagination fails.',
            'Feed reconstruction on cache miss — shows you thought about failure scenarios.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through this design in an interview',
          code: `flowchart LR
  A[Clarify<br/>DAU, follows, ranked?]:::client --> B[Estimate<br/>reads 100x writes]:::client
  B --> C[Push model<br/>Redis inboxes]:::server
  C --> D[Celebrity problem<br/>switch to hybrid]:::highlight
  D --> E[Pagination + ranking]:::server
  E --> F[Failures<br/>rebuild, lag]:::db`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The news feed is one of the most common system design interview questions. Knowing the hybrid fan-out approach, Redis sorted sets, and cursor pagination puts you in the top 10% of candidates. Practice explaining the celebrity problem and its solution clearly.',
        },
      ],
    },
  ],
};
