import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 9 — How Databases Work
// ─────────────────────────────────────────────────────────────────────────────
export const howDatabasesWork: CoreConcept = {
  id: 'how-databases-work',
  title: 'How Databases Work',
  emoji: '🗄️',
  icon: 'ti-database',
  color: '#0891b2',
  bg: '#e0f2fe',
  accentGlow: 'rgba(8,145,178,0.15)',
  difficulty: 'Foundational',
  tagline:
    'Queries, indexes, B-trees, ACID transactions, and connection pooling — the engine under every app.',
  tags: ['B-Tree Index', 'Query Execution', 'ACID', 'Transactions', 'Connection Pooling'],
  estimatedTime: '50 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'A database is a system for storing, organizing, and retrieving data reliably. It is much more than a file on disk. It gives you: a query language (SQL) to ask questions about your data; ACID guarantees (explained below) so data stays correct; indexes for fast lookups; safe access by many users at the same time without corrupting data; and crash recovery so nothing committed is lost if the power goes out.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: a database is like a well-run library. You ask the librarian (the database engine) for a book instead of searching the shelves yourself. The librarian uses a catalogue (an index) to find it fast, keeps popular books on the front desk (memory cache), writes every loan in a logbook before handing anything out (the write-ahead log), and makes sure two people never walk off with the same copy (transactions and locking).',
        },
        {
          type: 'flow',
          title: 'The big picture — from your app to the disk',
          code: `flowchart LR
  APP([Your app]):::client -->|"SQL query"| POOL[Connection pool]:::network
  POOL --> ENG
  subgraph ENG["Database engine"]
    direction TB
    P[Parse + plan]:::server --> X[Execute]:::server
    X --> BP[Buffer pool<br/>pages in RAM]:::cache
  end
  BP <-->|"read or write pages"| DISK[(Data files<br/>on disk)]:::db
  X -->|"log every change first"| WAL[(Write-ahead log)]:::db
  ENG -->|"result rows"| APP`,
          text: 'Your app sends a question in SQL. The engine works out the fastest way to answer it, reads from memory when it can and from disk when it must, and logs every change for safety.',
        },
        { type: 'heading2', text: 'Relational vs. Non-Relational' },
        {
          type: 'bullets',
          items: [
            'Relational (SQL): PostgreSQL, MySQL, SQLite. Data in tables with rows and columns. Relationships via foreign keys. Strong consistency. ACID transactions. Best for structured, relational data.',
            'Document (NoSQL): MongoDB, Firestore. Data as JSON documents. Flexible schema. Good for hierarchical data.',
            'Key-Value: Redis, DynamoDB. Simple map of key → value. Extremely fast. No complex queries.',
            'Column-Family: Cassandra, HBase. Good for time-series and analytics at massive scale.',
            'Graph: Neo4j. Optimized for relationship-heavy data (social networks, fraud detection).',
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
          text: 'Without databases, every application would need to manage its own files. It would have to stop two users from overwriting each other’s changes, recover cleanly after a crash, and search through gigabytes of data quickly. These are hard problems. Databases solve them once, so application developers can focus on business logic.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'How a Query is Executed' },
        {
          type: 'numbered',
          items: [
            'Parse: SQL string → parse tree (syntax check).',
            'Analyze: Validate that tables, columns exist. Resolve types.',
            'Plan: Query planner generates multiple possible execution plans. Chooses the cheapest plan based on statistics (table sizes, index selectivity).',
            'Execute: Execute the chosen plan. May involve: sequential scan, index scan, hash join, sort, etc.',
            'Return: Results sent back to the client.',
          ],
        },
        {
          type: 'flow',
          title: 'The life of a query',
          code: `flowchart LR
  SQL["SELECT ... WHERE email = ..."]:::client --> PA[Parse<br/>is the syntax valid?]:::server
  PA --> AN[Analyze<br/>do the tables and columns exist?]:::server
  AN --> PL{Plan<br/>which way is cheapest?}:::highlight
  PL -->|"index scan"| EX[Execute]:::server
  PL -.->|"or sequential scan"| EX
  EX --> RES([Rows returned]):::client`,
          text: 'The planner is the clever part: it estimates the cost of several strategies using table statistics and picks the cheapest one.',
        },
        { type: 'heading2', text: 'Indexes — The Secret to Fast Queries' },
        {
          type: 'paragraph',
          text: "An index is a separate, sorted data structure (usually a B-Tree) that maps column values to where the matching rows live — like the index at the back of a book. Without an index, a query like SELECT * FROM users WHERE email = 'john@example.com' has to check every row one by one (a full table scan, O(N): twice the rows means twice the work). With an index on email, the lookup is O(log N): even with 100 million users, the database only needs a handful of steps to find the row.",
        },
        {
          type: 'flow',
          title: 'With and without an index',
          code: `flowchart TD
  Q["WHERE email = 'john@example.com'"]:::client --> D{Index on email?}:::highlight
  D -->|"no"| SEQ["Full table scan<br/>check all 100M rows"]:::db
  D -->|"yes"| IDX["Walk the B-Tree<br/>about 4 steps"]:::cache
  SEQ --> SLOW([Seconds]):::server
  IDX --> PTR["Follow pointer<br/>to the row"]:::db
  PTR --> FAST([Under 1 ms]):::server`,
        },
        { type: 'heading2', text: 'B-Tree Index Structure' },
        {
          type: 'code',
          lang: 'text',
          code: `B-Tree index on users.email:
                  [M]
                /     \\
          [D-H]         [S-Z]
         /  |  \\       /   \\
      [D] [E] [G-H] [S-T] [X-Z]
       │
   Leaf: email → page/row pointer
   
Query: WHERE email = 'e@x.com'
1. Start at root [M] → 'e' < 'M' → go left
2. [D-H] → 'D' < 'e' < 'H' → middle
3. [E] → found 'e@x.com' → follow pointer to row
Result: O(log N), not O(N)`,
        },
        {
          type: 'flow',
          title: 'Walking the B-Tree to find e@x.com',
          code: `flowchart TD
  ROOT["Root: M"]:::highlight -->|"e comes before M, go left"| L["D to H"]:::server
  ROOT -.-> R["S to Z"]
  L -.-> N1["D"]
  L -->|"e is between D and H"| N2["E"]:::server
  L -.-> N3["G to H"]
  N2 -->|"leaf holds row pointer"| ROW[(Row on page 42)]:::db`,
          text: 'Each step discards most of the remaining data. Because each node has many children, even huge tables are only 3–4 levels deep.',
        },
        { type: 'heading2', text: 'ACID Transactions' },
        {
          type: 'bullets',
          items: [
            'Atomicity: A transaction is all-or-nothing. If transferring $100 from Account A to Account B, both the debit and credit succeed or neither does. No partial execution.',
            'Consistency: Database moves from one valid state to another. Constraints (foreign keys, CHECK) are enforced.',
            'Isolation: Concurrent transactions do not interfere. Transaction A sees a consistent snapshot, unaffected by Transaction B running simultaneously.',
            'Durability: Once committed, data is permanent. The database writes to a WAL (Write-Ahead Log) before confirming, so a power failure cannot lose committed data.',
          ],
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'A Bank Transfer Transaction' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Transfer $100 from Alice (id=1) to Bob (id=2)

BEGIN TRANSACTION;

-- Check Alice has enough balance
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; -- Lock row

-- Alice: $500 balance → deduct $100
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

-- Bob: $200 balance → add $100
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- All good → commit (writes to WAL, then to data files)
COMMIT;

-- If anything fails between BEGIN and COMMIT:
ROLLBACK; -- Both changes are undone, as if it never happened`,
        },
        {
          type: 'flow',
          title: 'The transfer, step by step',
          code: `sequenceDiagram
  participant App
  participant DB as Database
  participant WAL as Write-ahead log
  App->>DB: BEGIN
  App->>DB: SELECT balance FOR UPDATE (lock Alice row)
  DB-->>App: 500
  App->>DB: UPDATE Alice minus 100
  App->>DB: UPDATE Bob plus 100
  alt everything succeeded
    App->>DB: COMMIT
    DB->>WAL: append both changes and flush to disk
    DB-->>App: committed, locks released
  else any error
    App->>DB: ROLLBACK
    DB-->>App: both changes undone
  end`,
          text: 'Atomicity in action: either both updates become permanent together, or neither does. COMMIT only returns after the log is safely on disk.',
        },
        { type: 'heading2', text: 'What Happens if the Server Crashes Mid-Transaction?' },
        {
          type: 'paragraph',
          text: 'The WAL (Write-Ahead Log) is an append-only diary of changes. Every change is written to it before the real data files are touched. On restart, PostgreSQL reads the WAL: transactions that had committed are re-applied, and transactions that never committed are thrown away (rolled back). So the data is always left in a correct state, even after a crash.',
        },
        {
          type: 'flow',
          title: 'Crash recovery with the WAL',
          code: `flowchart TD
  CR([Server restarts after crash]):::highlight --> RD[Read the write-ahead log]:::db
  RD --> D{Did this transaction<br/>reach COMMIT?}:::server
  D -->|"yes"| REDO["Re-apply its changes<br/>nothing committed is lost"]:::cache
  D -->|"no"| UNDO["Discard its changes<br/>as if it never happened"]:::security
  REDO --> OK([Database consistent and online]):::client
  UNDO --> OK`,
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Connection Pooling' },
        {
          type: 'paragraph',
          text: 'Opening a database connection is expensive: roughly 50-200ms to set up, and about 5 MB of server memory for each one. Connection poolers (PgBouncer for PostgreSQL, HikariCP for Java) keep a small set of connections open and ready. The application borrows one for a query and hands it back as soon as it is done. Because each query is short, a pool of 20 connections can serve thousands of concurrent application threads.',
        },
        {
          type: 'flow',
          title: 'Many app workers, few database connections',
          code: `flowchart LR
  subgraph Apps["App servers - thousands of requests"]
    A1([Worker 1]):::client
    A2([Worker 2]):::client
    A3([Worker 1000]):::client
  end
  A1 --> P[Connection pool<br/>20 open connections]:::network
  A2 --> P
  A3 --> P
  P -->|"borrow, query, return"| DB[(PostgreSQL)]:::db`,
          text: 'Workers queue briefly for a free connection instead of each opening its own, which would exhaust the database’s memory.',
        },
        { type: 'heading2', text: 'Query Planner and EXPLAIN' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- See how PostgreSQL will execute a query
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Output:
Index Scan using idx_orders_user_id on orders
  (cost=0.56..8.58 rows=3 width=96) (actual time=0.05..0.07 rows=3)
  Index Cond: (user_id = 123)
Planning time: 0.1 ms
Execution time: 0.1 ms  ← Fast because of index

-- Without index:
Seq Scan on orders
  (cost=0.00..19432.00 rows=1000000 width=96) (actual time=0.05..312 ms)
Execution time: 312 ms  ← Scanning all 1 million rows`,
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'The N+1 Query Problem' },
        {
          type: 'paragraph',
          text: 'A very common performance issue that shows up when you understand how databases work:',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// BAD: N+1 problem — 1 query to get orders, N queries to get products
const orders = await db.query('SELECT * FROM orders LIMIT 100');  // 1 query
for (const order of orders) {
  order.product = await db.query(  // 100 additional queries!
    'SELECT * FROM products WHERE id = $1', [order.product_id]
  );
}
// Total: 101 database queries

// GOOD: JOIN to get everything in 1 query
const orders = await db.query(\`
  SELECT orders.*, products.name, products.price
  FROM orders
  JOIN products ON orders.product_id = products.id
  LIMIT 100
\`);
// Total: 1 database query, 100x faster`,
        },
        {
          type: 'flow',
          title: 'N+1 vs JOIN — count the round trips',
          code: `sequenceDiagram
  participant App
  participant DB as Database
  Note over App,DB: N+1 - 101 round trips
  App->>DB: SELECT orders LIMIT 100
  DB-->>App: 100 orders
  loop for each of the 100 orders
    App->>DB: SELECT product WHERE id = ...
    DB-->>App: 1 product
  end
  Note over App,DB: JOIN - 1 round trip
  App->>DB: SELECT orders JOIN products LIMIT 100
  DB-->>App: 100 orders with product details`,
          text: 'Every round trip pays network latency. 101 small queries are far slower than one well-written query.',
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
          title: 'At a glance — inside the database engine',
          code: `flowchart TB
  C([App + connection pool]):::client -->|"1. SQL"| PR[Parser + analyzer]:::server
  PR -->|"2. parse tree"| OPT{Query optimizer<br/>index or full scan?}:::highlight
  OPT -->|"3. plan"| BP[Buffer pool<br/>8KB pages in RAM]:::cache
  BP -->|"4. page miss: load from disk"| BT[(B+ Tree index<br/>+ table data)]:::db
  BP -->|"5. writes logged first"| WAL[(Write-ahead log)]:::db
  BP -->|"rows"| C`,
          text: 'Reads try RAM first and fall back to disk. Writes are recorded in the log before anything else so they survive a crash.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-database-internals',
            title: 'Relational Database Engine Internal Query Execution Flow',
            subtitle:
              'How an application query traverses Parser, Query Optimizer, Buffer Pool, B+ Tree Index, and WAL log',
            nodes: [
              {
                id: 'client-query-dispatch',
                name: 'Client Application & Connection Pool',
                subtitle: 'Pooled Socket Dispatch',
                type: 'client',
                icon: 'ti-app-window',
                badge: 'Client Query',
                protocol: 'SELECT * FROM users...',
                details: [
                  'Application borrows persistent TCP connection from connection pool',
                  'Sends SQL string with parameter bindings: SELECT * FROM users WHERE email = $1',
                ],
              },
              {
                id: 'sql-parser-lexer',
                name: 'SQL Lexer, Parser & Analyzer',
                subtitle: 'Syntax & Semantic Verification',
                type: 'gateway',
                icon: 'ti-terminal',
                badge: 'Parser (AST)',
                protocol: 'Abstract Syntax Tree',
                details: [
                  'Tokenizes SQL query into keywords, literals, and identifiers',
                  'Validates SQL grammar; generates Abstract Syntax Tree (AST)',
                  'Analyzer checks system catalog: verifies table "users" and column "email" actually exist and user has read permissions',
                ],
              },
              {
                id: 'query-optimizer',
                name: 'Cost-Based Query Optimizer & Planner',
                subtitle: 'Execution Plan Selection',
                type: 'server',
                icon: 'ti-cpu',
                badge: 'Query Planner',
                protocol: 'Cost Estimation',
                details: [
                  'Calculates mathematical cost estimates based on table statistics and column histograms',
                  'Compares Sequential Scan (reading all 10M rows) vs Index Scan (reading B+ Tree)',
                  'Selects cheapest execution plan (Index Scan cost: 4.2 vs Seq Scan cost: 84,200)',
                ],
              },
              {
                id: 'buffer-pool-manager',
                name: 'Buffer Pool (Shared Memory Cache)',
                subtitle: 'In-Memory RAM Page Cache',
                type: 'cache',
                icon: 'ti-server-2',
                badge: 'RAM Buffer',
                protocol: '8KB Disk Pages in RAM',
                details: [
                  'Databases read and write data in fixed 8KB pages, never individual rows',
                  'Cache HIT: If required 8KB page is already in RAM, reads it in microseconds with ZERO disk I/O',
                  'Cache MISS: Reads 8KB page from disk SSD, loads into Buffer Pool, evicts old pages via LRU',
                ],
              },
              {
                id: 'btree-storage-engine',
                name: 'B+ Tree Index & Table Heap',
                subtitle: 'Logarithmic O(log N) Search',
                type: 'database',
                icon: 'ti-binary-tree-2',
                badge: 'Storage Engine',
                protocol: 'B+ Tree Index',
                details: [
                  'Traverses root node → branch node → leaf node in 3–4 memory comparisons for 10M rows',
                  'Leaf node holds exact physical pointer (file_id, block_id, offset) to row data in table heap',
                ],
              },
              {
                id: 'wal-durability',
                name: 'Write-Ahead Log (WAL) & Disk',
                subtitle: 'ACID Durability Guarantee',
                type: 'storage',
                icon: 'ti-device-floppy',
                badge: 'Durability (WAL)',
                protocol: 'Sequential Append',
                details: [
                  'For writes: Appends modification record sequentially to Write-Ahead Log on disk BEFORE writing data pages',
                  'If power fails mid-transaction, recovery engine replays WAL on reboot to guarantee zero data loss',
                ],
              },
            ],
            connections: [
              {
                from: 'client-query-dispatch',
                to: 'sql-parser-lexer',
                label: '1. Send SQL Query',
                protocol: 'TCP Socket',
              },
              {
                from: 'sql-parser-lexer',
                to: 'query-optimizer',
                label: '2. Parse Tree (AST)',
                protocol: 'Semantics OK',
              },
              {
                from: 'query-optimizer',
                to: 'buffer-pool-manager',
                label: '3. Execute Plan: Index Scan',
                protocol: 'Physical Plan',
              },
              {
                from: 'buffer-pool-manager',
                to: 'btree-storage-engine',
                label: '4. Read Page / Traverse B+ Tree',
                protocol: 'Page Fetch',
              },
              {
                from: 'btree-storage-engine',
                to: 'wal-durability',
                label: '5. Log to WAL for Writes',
                protocol: 'Sequential Flush',
              },
            ],
            keyTakeaways: [
              'Why B+ Trees: Unlike balanced binary trees (BSTs), B+ Trees have high branching factor (fanout 100+). A tree with 10 million rows is only 3–4 levels deep, requiring at most 3–4 page reads.',
              'Write-Ahead Logging (WAL): Random disk writes are slow; sequential disk appends are fast. Databases append writes to WAL sequentially first for durability, then flush dirty RAM pages to disk lazily in background.',
              'Index Selectivity: An index is useless if it matches 50% of the table (e.g. status: active). The Query Optimizer will ignore the index and choose a Sequential Scan because random index lookups would be slower than sequential disk reads.',
            ],
            rawSpec: `Query: SELECT * FROM users WHERE email = 'john@example.com'

Application → Connection Pool → PostgreSQL Process

PostgreSQL:
┌─────────────────────────────────────────────┐
│ 1. Parser: SQL → Parse Tree                 │
│ 2. Analyzer: Validate tables/columns         │
│ 3. Planner: Choose execution plan            │
│    Options: Seq Scan vs Index Scan           │
│    → Index Scan (cheaper) ✓                 │
│ 4. Executor:                                 │
│    → Lookup in B-Tree index on "email"       │
│    → Find page #42, offset #7               │
│    → Read page from Buffer Pool (RAM)        │
│    → Return row to client                    │
└─────────────────────────────────────────────┘

B+ Tree index on "email":
               [M - P]
              /       \
         [A - L]     [Q - Z]
         /     \
     [A - D]   [E - H]  ← leaf node has pointer to row on disk
               └── "john@example.com" → Page #42, offset #7`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'MVCC — Multi-Version Concurrency Control' },
        {
          type: 'paragraph',
          text: 'PostgreSQL does not overwrite a row in place. Every UPDATE writes a new version of the row and marks the old one as outdated. Each transaction sees a consistent snapshot — the versions that were current when it started. Old versions that nobody needs any more are cleaned up later by a background process called VACUUM. The result: readers never wait for writers and writers never wait for readers — a key reason PostgreSQL handles high concurrency well.',
        },
        {
          type: 'flow',
          title: 'MVCC — readers and writers don’t block each other',
          code: `sequenceDiagram
  participant R as Reader transaction
  participant DB as Row: balance
  participant W as Writer transaction
  R->>DB: start, snapshot taken
  DB-->>R: sees version 1 = 500
  W->>DB: UPDATE balance = 400
  Note over DB: version 2 = 400 created,<br/>version 1 kept for the reader
  W->>DB: COMMIT
  R->>DB: read again
  DB-->>R: still sees version 1 = 500
  Note over DB: VACUUM removes version 1<br/>once no one needs it`,
        },
        { type: 'heading2', text: 'The Buffer Pool / Shared Buffer Cache' },
        {
          type: 'paragraph',
          text: 'Reading from disk is roughly 1,000× slower than reading from RAM. So PostgreSQL keeps a shared buffer pool — an area of memory (typically 25% of RAM) holding recently used data pages (fixed 8KB chunks of a table or index). When a query needs data, it checks the buffer pool first (a cache hit — fast). If the page is not there, it reads it from disk and keeps a copy in the pool (a cache miss — slow). Keeping the hit rate above 99% is critical for performance.',
        },
        {
          type: 'flow',
          title: 'Buffer pool — hit or miss',
          code: `flowchart TD
  Q([Query needs page 42]):::client --> D{Page 42 in<br/>buffer pool?}:::cache
  D -->|"hit"| RAM["Read from RAM<br/>microseconds"]:::highlight
  D -->|"miss"| DISK["Read 8KB page from disk<br/>much slower"]:::db
  DISK --> EV["Store in pool,<br/>evict least recently used page"]:::cache
  EV --> RAM`,
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
            'Myth: "NoSQL is faster than SQL." Reality: It depends on the access pattern. For key-value lookups, DynamoDB is faster. For complex queries on relational data, PostgreSQL with indexes is hard to beat.',
            'Myth: "Indexes always make queries faster." Reality: Indexes speed up reads but slow down writes (index must be updated on every INSERT/UPDATE). Do not index every column — only high-cardinality columns used in WHERE clauses.',
            'Myth: "Transactions are expensive — avoid them." Reality: Short, fast transactions are cheap. Long-running transactions (minutes) lock rows and cause contention. Keep transactions short.',
            'Myth: "The database handles everything — just write SQL." Reality: The application must manage connection pooling, N+1 problems, and query optimization. A bad ORM usage can generate terrible SQL.',
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
            'Read replicas: Primary DB handles writes. Read replicas handle queries. Horizontal read scaling.',
            'Database sharding: Partition data across multiple DB instances by user_id or geographic region.',
            'Caching layer (Redis): Cache hot query results in Redis. Avoid hitting DB for every read.',
            'CQRS: Separate write model (normalized relational DB) from read model (denormalized, optimized for queries).',
            'Database migrations: Schema changes are versioned and deployed incrementally. Flyway, Liquibase, or Prisma Migrate manage this.',
          ],
        },
        {
          type: 'flow',
          title: 'Scaling a database — common building blocks',
          code: `flowchart TB
  APP([App servers]):::client -->|"1. check cache"| RC[(Redis cache)]:::cache
  APP -->|"writes"| PRI[(Primary DB)]:::db
  APP -->|"reads on cache miss"| REP[(Read replicas)]:::db
  PRI -.->|"replication"| REP`,
          text: 'Writes go to one primary, reads are spread over replicas, and hot results are served from a cache so most reads never reach the database at all.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Database performance is the bottleneck in most backend systems. Understanding indexes (B-trees), EXPLAIN ANALYZE, connection pooling, and the N+1 problem will make you a dramatically better backend engineer and system designer.',
        },
      ],
    },
  ],
};
