import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 4 — Distributed Cache
// ─────────────────────────────────────────────────────────────────────────────
export const distributedCache: SystemDesignSystem = {
  id: 'distributed-cache',
  title: 'Distributed Cache / Key-Value Store',
  icon: 'ti-database-import',
  color: '#10b981',
  bg: '#d1fae5',
  accentGlow: 'rgba(16,185,129,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'The cornerstone of distributed systems — master CAP theorem, consistent hashing, and replication.',
  tags: ['CAP Theorem', 'Consistent Hashing', 'Replication', 'LRU/LFU', 'Gossip Protocol'],
  estimatedTime: '55 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A distributed key-value store like Redis, Memcached, or DynamoDB. It stores data as key → value pairs (like a giant dictionary), spreads that data across many machines (nodes), and keeps extra copies so reads and writes stay fast and keep working even when some machines fail.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: think of a library too big for one building. Books (values) are split across several branches (nodes) using a fixed rule based on the title (the key), so you always know which branch to visit. Each book is also kept at 2–3 branches, so if one branch closes for the day, you can still borrow it elsewhere.',
        },
        {
          type: 'flow',
          title: 'The big picture — split the data, copy the data',
          code: `flowchart TB
  C([App calls get user:42]):::client --> L[Client library<br/>hash the key to find its nodes]:::server
  L --> A[(Node A<br/>primary copy of user:42)]:::cache
  L -.-> B[(Node B<br/>replica of user:42)]:::cache
  L -.-> D[(Node C<br/>replica of user:42)]:::cache
  E[(Node D<br/>holds other keys)]:::cache
  A -->|"value in about 1 ms"| C`,
          text: 'Two ideas carry the whole design: partitioning (each key lives on a small, predictable set of nodes) and replication (each key is stored on several nodes so one failure loses nothing).',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'put(key, value) — store or update a key-value pair.',
            'get(key) → value — retrieve a value by key.',
            'delete(key) — remove a key-value pair.',
            'TTL support — keys expire after a configurable duration.',
            'Data is distributed across multiple nodes for scalability.',
            'Data is replicated across nodes for fault tolerance.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Highly available (reads and writes continue even if some nodes fail).',
            'Horizontally scalable (adding nodes increases capacity linearly).',
            'Low latency — P99 < 5ms for reads and writes.',
            'Consistency model: Tunable — support both strong and eventual consistency.',
            'Fault tolerant — no data loss when a node fails (with proper replication).',
          ],
        },
        { type: 'heading2', text: 'Scale Estimates' },
        {
          type: 'bullets',
          items: [
            '1 million QPS (queries per second) at peak.',
            '100 TB of data total.',
            '1 KB average value size → 100 billion keys.',
            'Average latency target: P50 < 1ms, P99 < 5ms.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'CAP Theorem' },
        {
          type: 'paragraph',
          text: 'CAP theorem states that a distributed system can guarantee at most 2 of the following 3 properties simultaneously:',
        },
        {
          type: 'bullets',
          items: [
            'Consistency (C): Every read returns the most recent write or an error. All nodes see the same data at the same time.',
            'Availability (A): Every request gets a response (success or failure), but it might not be the most recent data.',
            'Partition Tolerance (P): The system keeps operating even when a network partition happens — the network splits and some nodes cannot talk to others (sometimes called split-brain).',
          ],
        },
        {
          type: 'flow',
          title: 'CAP — the choice you face during a partition',
          code: `flowchart TD
  W([Client writes x = 2 on side 1]):::client --> S1[(Side 1 nodes<br/>have x = 2)]:::cache
  S1 -.-x|"network cut — cannot sync"| S2[(Side 2 nodes<br/>still have x = 1)]:::cache
  R([Another client reads x on side 2]):::client --> S2
  S2 --> Q{Side 2 cannot confirm<br/>it has the latest value}
  Q -->|"Choose C — CP"| CP([Return an error<br/>correct but unavailable]):::security
  Q -->|"Choose A — AP"| AP([Return x = 1<br/>available but stale]):::highlight`,
          text: 'When the network is healthy you can have both C and A. The trade-off only bites during a partition — and then you must pick one. Most caches pick A.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Network partitions are unavoidable in distributed systems. Therefore, every distributed system must choose between Consistency (CP) and Availability (AP). You cannot have all three. A distributed cache typically chooses AP (available + partition tolerant) with eventual consistency.',
        },
        { type: 'heading2', text: 'Consistent Hashing' },
        {
          type: 'paragraph',
          text: 'In a simple hash partitioning scheme, mapping a key to a node is: node = hash(key) % N. The problem: when N changes (add/remove a node), almost ALL keys need to be remapped.',
        },
        {
          type: 'paragraph',
          text: 'Consistent hashing fixes this by placing both nodes and keys on a "hash ring" — imagine the numbers 0 to 2^32-1 bent into a clock face. Each node is hashed to a position on the ring, and so is each key. A key belongs to the first node you reach walking clockwise from the key\'s position. When a node is added or removed, only the keys in the arc between it and the previous node change owner — about 1/N of all keys.',
        },
        {
          type: 'flow',
          title: 'Adding a node: modulo vs hash ring',
          code: `flowchart TB
  subgraph Mod["hash(key) % N — going from 3 to 4 nodes"]
    M1["key k1: 10 % 3 = 1 → 10 % 4 = 2"]:::security
    M2["key k2: 11 % 3 = 2 → 11 % 4 = 3"]:::security
    M3["~75% of keys change node<br/>= mass cache misses"]:::security
  end
  subgraph Ring["Hash ring — walk clockwise to the next node"]
    NA((Node A)):::cache --> NB((Node B)):::cache
    NB --> NN((New node D)):::highlight
    NN --> NC((Node C)):::cache
    NC --> NA
    K["Only keys between B and D<br/>move — from C to D"]:::server
  end`,
          text: 'With modulo, changing N reshuffles almost everything. On the ring, the new node just takes over one arc from its clockwise neighbour; every other key stays put.',
        },
        { type: 'heading2', text: 'Virtual Nodes (VNodes)' },
        {
          type: 'paragraph',
          text: 'With only a few points on the ring, the arcs between nodes are uneven, so some nodes get far more keys than others. Virtual nodes fix this: each physical machine is placed on the ring many times (e.g., 150 positions). Lots of small arcs average out, so load spreads evenly. It also lets you give a more powerful machine more positions, and therefore a bigger share of keys.',
        },
        { type: 'heading2', text: 'Replication Factor & Quorum' },
        {
          type: 'bullets',
          items: [
            'Replication factor (RF): How many nodes store a copy of each key. RF=3 means each key is stored on 3 nodes.',
            'Write quorum (W): How many nodes must acknowledge a write for it to succeed. W=2 means 2 out of 3 replicas must confirm.',
            'Read quorum (R): How many nodes must respond to a read. R=2 means read from 2 replicas.',
            'Strong consistency: W + R > N (e.g., W=2, R=2, N=3). A read always overlaps with the most recent write.',
            'Eventual consistency: W=1, R=1. Maximum performance but reads might return stale data briefly.',
          ],
        },
        {
          type: 'flow',
          title: 'Why W + R > N guarantees a fresh read',
          code: `flowchart LR
  WR([Write v2 with W = 2]):::client --> R1[(Replica 1<br/>v2)]:::highlight
  WR --> R2[(Replica 2<br/>v2)]:::highlight
  WR -.->|"not yet"| R3[(Replica 3<br/>v1 — stale)]:::cache
  RD([Read with R = 2]):::client --> R2
  RD --> R3
  R2 & R3 --> PICK[Compare versions<br/>newest wins → v2]:::server`,
          text: 'N = 3, W = 2, R = 2. Any 2 replicas you read must include at least one of the 2 that took the write — the groups always overlap, so the newest value is always in the answer.',
        },
        { type: 'heading2', text: 'Gossip Protocol' },
        {
          type: 'paragraph',
          text: "How do nodes know about each other's state? With a gossip protocol: every second or so, each node picks a random peer and they swap what they know (which nodes are up or down, who owns which part of the ring). News spreads like an office rumour — each round roughly doubles the number of nodes that have heard it, so it reaches all N nodes in about log(N) rounds. No central coordinator is needed.",
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
            'Client Library: SDK that clients use to interact with the cache. Handles hashing, routing to correct node, retry on failure.',
            'Coordinator Node: Receives client requests and routes them to the appropriate storage nodes based on consistent hashing.',
            'Storage Nodes: Actual data stores. Each node stores a portion of the keyspace. Multiple nodes hold replicas of each key.',
            'Gossip Protocol Layer: Background process on each node for cluster membership and failure detection.',
            'Merkle Trees: Used to detect inconsistencies between replicas during anti-entropy repair.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
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
  N2 <-.->|"Merkle-tree repair"| N3`,
          text: 'The coordinator fans each request out to the replicas for that key. Dotted lines are background chatter that keeps the cluster healthy without slowing requests.',
        },
        { type: 'heading2', text: 'Read Path' },
        {
          type: 'numbered',
          items: [
            'Client sends GET(key) to the coordinator.',
            'Coordinator hashes the key, finds the N responsible nodes on the ring.',
            'Coordinator sends GET to R of the N replicas in parallel.',
            'First R responses returned. If values differ (stale replicas), return the newest (by vector clock/timestamp).',
            'Background process schedules read repair — updates stale replicas with the latest value.',
            'Return value to client.',
          ],
        },
        {
          type: 'flow',
          title: 'Read path with read repair (N = 3, R = 2)',
          code: `sequenceDiagram
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
  Note over D: Not asked this time - it will be fixed by later reads or repair`,
          text: 'The client gets the newest value immediately. Fixing the stale replica happens afterwards, off the critical path.',
        },
        { type: 'heading2', text: 'Write Path' },
        {
          type: 'numbered',
          items: [
            'Client sends PUT(key, value) to the coordinator.',
            'Coordinator hashes the key, identifies the N responsible nodes.',
            'Coordinator sends PUT to all N replicas concurrently.',
            'Wait for W acknowledgements.',
            'Return success to client. The remaining (N-W) replicas will catch up asynchronously.',
          ],
        },
        {
          type: 'flow',
          title: 'Write path (N = 3, W = 2)',
          code: `sequenceDiagram
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
  D-->>CO: ack (arrives later, ignored for latency)`,
          text: 'The write is sent everywhere but the client only waits for the fastest W replicas. A slow replica never slows down the caller.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Storage Engine — LSM Tree' },
        {
          type: 'paragraph',
          text: 'Most distributed KV stores that persist to disk use a Log-Structured Merge Tree (LSM Tree) storage engine. Each write goes into a sorted in-memory buffer called the MemTable (plus an append-only log on disk, so it survives a crash). When the MemTable fills up, it is written to disk in one go as an immutable sorted file called an SSTable (Sorted String Table). In the background, small SSTables are merged into bigger ones (compaction), dropping overwritten and deleted values.',
        },
        {
          type: 'flow',
          title: 'LSM tree — how writes and reads flow',
          code: `flowchart TD
  W([PUT key]):::client --> WAL[[Append to commit log<br/>for crash safety]]:::queue
  W --> MT[MemTable<br/>sorted, in memory]:::cache
  MT -->|"when full: flush"| SS1[(SSTable new)]:::db
  SS1 -.->|"background compaction"| SS2[(SSTable older, merged)]:::db
  R([GET key]):::client --> MT
  MT -->|"not found"| BF1{Bloom filter:<br/>maybe in new SSTable?}
  BF1 -->|maybe| SS1
  BF1 -->|"definitely not"| BF2{Bloom filter:<br/>maybe in older SSTable?}
  BF2 -->|maybe| SS2`,
          text: 'Writes only ever append or touch memory, which is why they are so fast. Reads check newest data first, and Bloom filters skip files that cannot contain the key.',
        },
        {
          type: 'bullets',
          items: [
            'Write performance: O(1) — always an in-memory write first. Much faster than B-Tree (which requires random disk I/O).',
            'Read performance: Slightly slower — may need to check multiple SSTables. Bloom filters on each SSTable allow quick "definitely not here" checks.',
            'Used by: RocksDB, Cassandra, LevelDB.',
          ],
        },
        { type: 'heading2', text: 'Eviction Policies' },
        {
          type: 'bullets',
          items: [
            'LRU (Least Recently Used): Evict the key that was accessed longest ago. Most common. Good hit rate for temporal access patterns.',
            'LFU (Least Frequently Used): Evict the key accessed least often. Better for items with long-term popularity. More complex to implement.',
            'FIFO: Evict the oldest key. Simple but poor cache efficiency.',
            'Random: Evict a random key. Surprisingly decent performance and very simple.',
            'Practical advice: LRU with O(1) implementation using a doubly-linked list + hash map. LFU when access frequency matters more than recency.',
          ],
        },
        { type: 'heading2', text: 'Write-Through vs. Write-Back vs. Cache-Aside' },
        {
          type: 'bullets',
          items: [
            'Cache-Aside (Lazy Loading): Application reads from cache. On miss, reads from DB and populates cache. On write, updates DB and invalidates cache. Most common pattern.',
            'Write-Through: Every write goes to cache AND DB synchronously. Cache is always warm. But: writes are slower.',
            'Write-Back: Write to cache only. Flush to DB asynchronously. Fastest writes, but risk of data loss if cache node fails before flushing.',
          ],
        },
        {
          type: 'flow',
          title: 'Three caching patterns side by side',
          code: `flowchart TB
  subgraph CA["Cache-aside — app manages the cache"]
    A1([App]):::client -->|"1. read"| C1[(Cache)]:::cache
    A1 -->|"2. on miss, read"| D1[(DB)]:::db
    A1 -->|"3. fill cache"| C1
  end
  subgraph WT["Write-through — both, synchronously"]
    A2([App]):::client -->|"write"| C2[(Cache)]:::cache
    C2 -->|"same request"| D2[(DB)]:::db
  end
  subgraph WB["Write-back — cache now, DB later"]
    A3([App]):::client -->|"write"| C3[(Cache)]:::cache
    C3 -.->|"later, in batches"| D3[(DB)]:::db
  end`,
          text: 'Moving down the list, writes get faster but the risk grows: write-back can lose data if the cache dies before the dotted flush happens.',
        },
        { type: 'heading2', text: 'Conflict Resolution — Vector Clocks' },
        {
          type: 'paragraph',
          text: 'When two clients write to the same key at the same time on different replicas (for example, during a partition), the replicas end up with conflicting values. Vector clocks help decide which write came "after" which. Each value carries a small counter per node, such as {nodeA: 3, nodeB: 1}. If every counter in one version is greater than or equal to the other\'s, it is simply newer and wins. If each version is ahead on a different node, the writes happened independently (concurrently), so the conflict is handed to the application to resolve — for example last-writer-wins, or merging the two (like combining two shopping carts).',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Horizontal Scaling with Consistent Hashing' },
        {
          type: 'paragraph',
          text: 'Adding a new storage node requires moving only ~1/N of total keys. With 10 nodes and 100TB, adding an 11th node requires moving ~9TB. During migration, the new node fetches data from its neighboring nodes, which continue serving traffic. No downtime.',
        },
        { type: 'heading2', text: 'Read Scaling' },
        {
          type: 'bullets',
          items: [
            'Increase replication factor. With RF=5, you can serve reads from any 5 nodes (2 for quorum), doubling read throughput.',
            'Lower R (read quorum). R=1 gives maximum read throughput but risks stale reads.',
            'Add more nodes. With consistent hashing, each new node reduces the load on existing nodes proportionally.',
          ],
        },
        { type: 'heading2', text: 'Write Scaling' },
        {
          type: 'bullets',
          items: [
            'Lower W (write quorum). W=1 gives maximum write throughput but risks data loss.',
            'Add more nodes — writes are distributed across more nodes.',
            'Use the LSM tree for high write throughput — all writes are sequential memory writes.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Failure Detection — Gossip + Heartbeats' },
        {
          type: 'paragraph',
          text: 'Each node sends a heartbeat (an "I am alive" message) every second. If a node misses 3 heartbeats in a row (3 seconds), it is marked as suspected down, and that suspicion is gossiped to the rest of the cluster within about log(N) seconds. If it stays silent past a configurable timeout, it is marked DOWN.',
        },
        { type: 'heading2', text: 'Hinted Handoff' },
        {
          type: 'paragraph',
          text: 'What if a replica node is temporarily down during a write? The coordinator gives the write to another healthy node to hold on its behalf, together with a "hint" saying who it really belongs to. When the downed node comes back, the stand-in node replays those hinted writes to it. This way writes still collect W acknowledgements during short outages, and nothing is lost.',
        },
        {
          type: 'flow',
          title: 'Hinted handoff',
          code: `sequenceDiagram
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
  B-->>H: ack, hint deleted`,
          text: 'Like a neighbour signing for your parcel while you are out and handing it over when you return.',
        },
        { type: 'heading2', text: 'Anti-Entropy Repair with Merkle Trees' },
        {
          type: 'paragraph',
          text: 'Over time, replicas can drift apart (missed writes, network issues). Anti-entropy repair is the background job that finds and fixes these differences. Merkle trees make it cheap: each leaf is a hash of a range of key-value pairs, and each parent is a hash of its children, all the way up to one root hash. If two replicas have the same root hash, they are identical — done. If not, compare the children and only follow the branches whose hashes differ, until you reach the exact keys that differ — without sending all the data over the network.',
        },
        {
          type: 'flow',
          title: 'Merkle tree comparison — follow only the mismatches',
          code: `flowchart TD
  ROOT{Root hashes equal?}:::highlight -->|Yes| DONE([Replicas identical — stop]):::server
  ROOT -->|No| L{Left child equal?}
  ROOT -->|No| RT{Right child equal?}
  L -->|Yes| SKIP1([Skip left half]):::server
  RT -->|No| RL{Right-left leaf equal?}
  RT -->|No| RR{Right-right leaf equal?}
  RL -->|Yes| SKIP2([Skip]):::server
  RR -->|No| SYNC([Sync only these keys]):::cache`,
          text: 'Comparing one hash per level means finding a handful of bad keys among billions takes only a few dozen hash comparisons.',
        },
        { type: 'heading2', text: 'Handling Network Partitions' },
        {
          type: 'paragraph',
          text: 'During a partition, two groups of nodes cannot communicate. AP systems (like Cassandra) continue accepting reads and writes on both sides. When the partition heals, conflict resolution (vector clocks, last-writer-wins) merges the diverged state. CP systems (like etcd, ZooKeeper) refuse writes on the minority partition to prevent inconsistency.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Memory Management' },
        {
          type: 'bullets',
          items: [
            'Allocate a fixed amount of memory to the cache. When full, evict according to policy.',
            'Slab allocator (Memcached approach): Pre-allocate fixed-size memory chunks. Eliminates heap fragmentation. Keys and values are stored in power-of-2 sized slabs.',
            'Off-heap storage: Store data outside the JVM heap (for Java-based stores) to reduce GC pressure.',
          ],
        },
        { type: 'heading2', text: 'Bloom Filters for Read Optimization' },
        {
          type: 'paragraph',
          text: 'Before reading from SSTables, check a Bloom filter. If the Bloom filter says the key is "definitely not present," skip the SSTable read entirely. This eliminates unnecessary disk I/O for non-existent keys — a very common case in cache miss scenarios.',
        },
        { type: 'heading2', text: 'Connection Pooling & Pipelining' },
        {
          type: 'bullets',
          items: [
            'Maintain a pool of persistent connections between client and cache nodes.',
            'Redis pipelining: batch multiple commands in a single TCP packet. Reduces round-trips from N to 1 for N commands.',
            'Use binary protocol (Memcached binary, Redis RESP3) for efficient serialization.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Tunable Consistency (W + R vs. Latency)' },
        {
          type: 'bullets',
          items: [
            'W=3, R=2 (N=3): Strong consistency. Every read sees every write. Slower — must wait for 3 writes and 2 reads.',
            'W=1, R=1: Eventual consistency. Maximum speed. May read stale data for a brief period.',
            'W=2, R=2: Good balance for most use cases. Tolerates 1 node failure.',
            'Let the application choose consistency level per-request — Cassandra supports this as a first-class feature.',
          ],
        },
        { type: 'heading2', text: 'Single Leader vs. Multi-Leader vs. Leaderless' },
        {
          type: 'bullets',
          items: [
            'Single Leader (Redis): One primary accepts all writes. Simple consistency. Leader is a bottleneck. Failover takes seconds.',
            'Multi-Leader: Multiple nodes accept writes. Better write throughput. Complex conflict resolution.',
            'Leaderless (Cassandra, DynamoDB): Any node accepts writes. Maximum availability. Quorum determines consistency. More complex client logic.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Capacity Planning' },
        {
          type: 'bullets',
          items: [
            'Estimate peak QPS, average key/value size, total data size, and desired cache hit ratio.',
            'Over-provision by 30% to handle traffic spikes without performance degradation.',
            'Monitor memory usage continuously — approaching 100% memory causes thrashing.',
          ],
        },
        { type: 'heading2', text: 'Cache Stampede Prevention' },
        {
          type: 'paragraph',
          text: 'A cache stampede (thundering herd) happens when a popular key expires and thousands of requests simultaneously hit the database. Solutions:',
        },
        {
          type: 'bullets',
          items: [
            'Probabilistic early expiration: Before the key expires, probabilistically refresh it. The probability of refresh increases as expiry approaches.',
            'Mutex locking: Only one request is allowed to compute the new value. Others wait and receive the new value when it is ready.',
            'Background refresh: Serve slightly stale data while a background thread recomputes the fresh value.',
          ],
        },
        {
          type: 'flow',
          title: 'Stopping a stampede with a lock',
          code: `flowchart TD
  R([Many requests for hot key]):::client --> H{In cache?}
  H -->|Yes| OK([Return value]):::highlight
  H -->|"No — just expired"| L{Got the rebuild lock?<br/>SET lock NX with short TTL}
  L -->|"Yes — only one request"| DB[(Query database once)]:::db
  DB --> FILL[Write value to cache<br/>+ release lock]:::cache --> OK
  L -->|"No — everyone else"| W[Wait briefly or serve<br/>stale copy]:::server
  W --> H`,
          text: 'Instead of thousands of identical database queries, exactly one request rebuilds the value and the rest reuse it.',
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
            'Explain the CAP theorem and where a distributed cache falls.',
            'How does consistent hashing work and why is it better than simple modulo hashing?',
            'How would you implement LRU cache in O(1) time?',
            'What is eventual consistency and when is it acceptable?',
            'How do you handle a node failure in your distributed cache?',
            'Explain the difference between write-through and write-back caching.',
          ],
        },
        { type: 'heading2', text: 'Coding: LRU Cache in O(1)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `class LRUCache {
  private capacity: number;
  private map = new Map<number, number>(); // key → value (maintains insertion order)

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
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'JavaScript Maps maintain insertion order, making them ideal for LRU implementation. Move accessed keys to the end; the first key is always the LRU. This is a very common coding interview question paired with the system design.',
        },
      ],
    },
  ],
};
