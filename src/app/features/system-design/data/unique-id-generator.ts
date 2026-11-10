import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM — Unique ID Generator
// ─────────────────────────────────────────────────────────────────────────────
export const uniqueIdGenerator: SystemDesignSystem = {
  id: 'unique-id-generator',
  title: 'Unique ID Generator',
  icon: 'ti-fingerprint',
  color: '#0284c7',
  bg: '#e0f2fe',
  accentGlow: 'rgba(2,132,199,0.15)',
  difficulty: 'Beginner',
  tagline:
    'Mint millions of unique, roughly time-sortable 64-bit IDs per second with no central bottleneck — the Snowflake way.',
  tags: ['Snowflake', 'UUID', 'Clock Skew', 'Bit Layout', 'Distributed Systems'],
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
          text: 'A service (or library) that hands out unique identifiers for things like orders, tweets, chat messages and payments. In a single database you get this for free with AUTO_INCREMENT. Once you have hundreds of servers across several data centers writing to many database shards, "just use the next number" stops working — there is no single "next number" anymore.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it works like the ticket machine at a deli counter, except there are a thousand counters in a hundred shops, and no two customers anywhere may ever get the same ticket. The trick is to print the shop number and the time on every ticket, so each machine can work alone and still never clash with another one.',
        },
        {
          type: 'flow',
          title: 'The big picture — many writers, one rule: never repeat',
          code: `flowchart LR
  O[Order service]:::server -->|"next ID?"| G1["ID generator<br/>worker 1"]:::highlight
  M[Chat service]:::server -->|"next ID?"| G2["ID generator<br/>worker 2"]:::highlight
  P[Payment service]:::server -->|"next ID?"| G3["ID generator<br/>worker 3"]:::highlight
  G1 -->|"IDs stamped worker 1"| DB1[(Shard A)]:::db
  G2 -->|"IDs stamped worker 2"| DB2[(Shard B)]:::db
  G3 -->|"IDs stamped worker 3"| DB3[(Shard C)]:::db`,
          text: 'Every generator works independently — no network call to a central counter — yet the IDs never collide because each one embeds a different worker number.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Every ID is unique across all machines, all data centers and all time.',
            'IDs are numeric and fit in 64 bits (a BIGINT column, 8 bytes).',
            'IDs are roughly sortable by creation time — an ID created a second later is (almost always) bigger.',
            'IDs can be generated without a database round-trip on the hot path.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'High throughput — at least 10,000 IDs/second per node, with headroom for bursts.',
            'Low latency — generating an ID should take microseconds, not milliseconds.',
            'High availability — no single point of failure. If one generator dies, the others keep issuing IDs.',
            'Correctness over availability — producing a duplicate is far worse than briefly refusing to produce an ID.',
          ],
        },
        { type: 'heading2', text: 'Quick Estimation' },
        {
          type: 'bullets',
          items: [
            'Assume 1 billion new objects per day → 1,000,000,000 / 86,400 ≈ 11,600 IDs/second on average, ~35,000/second at a 3× peak (see Back-of-the-Envelope Estimation in Core Concepts).',
            'A Snowflake worker can issue up to 4,096 IDs per millisecond = ~4.1 million per second, so even the peak needs a tiny fraction of one worker. We run several workers for availability, not throughput.',
            'Storage: a 64-bit ID is 8 bytes vs 16 bytes for a UUID. Over 10 billion rows that is 80 GB vs 160 GB for the key alone — and every secondary index repeats the primary key.',
            'Lifetime: 41 bits of milliseconds = 2^41 ms ≈ 69.7 years from the chosen epoch.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Approach 1: Database Auto-Increment' },
        {
          type: 'paragraph',
          text: 'One database with an AUTO_INCREMENT (or SEQUENCE) column. Perfectly unique, perfectly ordered, and dead simple. The problem: every insert in the company must go through that one database — it is both a throughput ceiling and a single point of failure.',
        },
        {
          type: 'paragraph',
          text: 'Multi-master variant: run N databases, each counting with a step of N and a different starting offset. With two servers, server 1 issues 1, 3, 5… and server 2 issues 2, 4, 6…. MySQL supports this with auto_increment_increment and auto_increment_offset.',
        },
        { type: 'heading2', text: 'Approach 2: UUID v4 and UUID v7' },
        {
          type: 'bullets',
          items: [
            'UUID v4: 128 bits, 122 of them random. Every server generates them locally with zero coordination. You would need ~2.7 × 10^18 of them before the chance of a single collision reaches 50%.',
            'Downsides of v4: 128 bits (does not fit our 64-bit requirement), not sortable, and random keys scatter inserts across a B-tree index (see below).',
            'UUID v7 (standardised in RFC 9562, 2024): the first 48 bits are a Unix millisecond timestamp, the rest is mostly random (74 random bits). Still 128 bits, but time-ordered — it fixes the index problem and is a great default when 128 bits is acceptable.',
          ],
        },
        { type: 'heading2', text: 'Approach 3: Ticket Server (Flickr-Style)' },
        {
          type: 'paragraph',
          text: 'A dedicated tiny database whose only job is to hand out numbers. Flickr ran two of them (odd and even, using the step/offset trick) and generated an ID with a single-row REPLACE INTO plus LAST_INSERT_ID(). Simple and numeric, but every ID still costs a network round-trip to the ticket server, and the ticket servers are a bottleneck you have to keep alive.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Flickr-style ticket server (MySQL)
CREATE TABLE tickets64 (
  id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  stub CHAR(1)         NOT NULL UNIQUE
) ENGINE=InnoDB;

-- One row, replaced on every call — the table never grows
REPLACE INTO tickets64 (stub) VALUES ('a');
SELECT LAST_INSERT_ID();`,
        },
        { type: 'heading2', text: 'Approach 4: Range / Segment Allocation' },
        {
          type: 'paragraph',
          text: 'Instead of asking the database for one ID at a time, each app server leases a whole block (for example 1,000 IDs) with a single atomic UPDATE, then hands them out from memory. One DB write now pays for 1,000 IDs. This is how Meituan Leaf "segment mode" works and is a common way to produce the short, compact counters that the URL Shortener base62-encodes.',
        },
        {
          type: 'flow',
          title: 'Leasing a block of IDs',
          code: `sequenceDiagram
  participant A as App server A
  participant DB as ID table
  participant B as App server B
  A->>DB: UPDATE max_id = max_id + 1000 (returns 1000)
  Note over A: owns 1–1000, serves from memory
  B->>DB: UPDATE max_id = max_id + 1000 (returns 2000)
  Note over B: owns 1001–2000
  A->>A: issues 1, 2, 3 … 900
  A-)DB: 90% used — prefetch next block in background (returns 3000)
  Note over A: switches to 2001–3000 with no pause`,
          text: 'The UPDATE is atomic, so two servers can never lease the same block. Prefetching the next block (a "double buffer") hides the database round-trip completely.',
        },
        { type: 'heading2', text: 'Approach 5: Snowflake' },
        {
          type: 'paragraph',
          text: "Twitter's Snowflake packs three things into one 64-bit integer: the current time in milliseconds, the ID of the machine that made it, and a counter for IDs made in the same millisecond on that machine. Each piece makes collisions impossible along one dimension — time separates IDs made at different moments, worker ID separates machines, and the sequence separates IDs within one millisecond on one machine.",
        },
        {
          type: 'flow',
          title: 'Snowflake 64-bit layout',
          code: `flowchart LR
  S["1 bit<br/>sign, always 0"]:::external --- T["41 bits<br/>ms since custom epoch<br/>≈ 69.7 years"]:::highlight
  T --- W["10 bits<br/>worker ID<br/>0–1023"]:::server
  W --- Q["12 bits<br/>sequence<br/>0–4095 per ms"]:::cache`,
          text: '1 + 41 + 10 + 12 = 64. The sign bit stays 0 so the ID is positive in signed BIGINT columns and in languages without unsigned 64-bit integers (Java long).',
        },
        {
          type: 'bullets',
          items: [
            'Timestamp: 2^41 = 2,199,023,255,552 ms ≈ 69.7 years. Using a custom epoch (e.g. 2024-01-01) instead of 1970 means those 69 years start when your system launches, lasting until ~2093.',
            'Worker ID: 2^10 = 1,024 distinct generators. Twitter originally split this as 5 bits data center + 5 bits machine.',
            'Sequence: 2^12 = 4,096 IDs per millisecond per worker = ~4.1 million IDs/second per worker, ~4.2 billion/second across all 1,024 workers.',
          ],
        },
        { type: 'heading2', text: 'Why Time-Ordered IDs Matter: B-Tree Locality' },
        {
          type: 'paragraph',
          text: 'Most databases store the primary key in a B-tree (in MySQL InnoDB the whole table is ordered by it). Time-ordered IDs always land at the right-most leaf page, which stays hot in memory. Random UUID v4 keys land on a random page every time — the database must read cold pages from disk, split full pages, and ends up with half-empty pages and a bigger, slower index.',
        },
        {
          type: 'flow',
          title: 'Random vs time-ordered inserts into a B-tree index',
          code: `flowchart TB
  subgraph Random["UUID v4 — random keys"]
    R1([New rows]):::client --> RP1[Page 3]:::cache
    R1 --> RP2[Page 71]:::cache
    R1 --> RP3[Page 512]:::cache
    RP1 & RP2 & RP3 --> RX["Cold pages read from disk,<br/>page splits everywhere"]:::external
  end
  subgraph Ordered["Snowflake / UUID v7 — time-ordered keys"]
    O1([New rows]):::client --> OP["Right-most page<br/>always in memory"]:::highlight
    OP --> OX["Sequential appends,<br/>full, compact pages"]:::server
  end`,
          text: 'Teams that switch a large table from UUID v4 to a time-ordered key often see insert throughput improve dramatically and the index shrink, purely because of locality.',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Two Deployment Shapes' },
        {
          type: 'bullets',
          items: [
            'Embedded library (preferred): every application process runs the Snowflake algorithm in-process. Generating an ID is a function call — no network, no extra service to keep alive. Each process needs its own worker ID.',
            'Standalone ID service: a small fleet of ID servers behind a load balancer, called over HTTP/gRPC. Useful when many languages must share one implementation, but every ID now costs a network hop (clients usually fetch IDs in batches to soften this).',
            'Either way, the only shared state is the worker-ID registry (ZooKeeper, etcd, or static config) — and it is only consulted at startup and for lease renewals, never per ID.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
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
  MON[Monitoring]:::queue -.->|"clock drift, sequence waits"| L1 & L2`,
          text: 'Dotted lines are off the hot path. Generating an ID touches only local memory and the local clock.',
        },
        { type: 'heading2', text: 'Data Flow — Generating One ID' },
        {
          type: 'numbered',
          items: [
            'Read the current time in milliseconds.',
            'If the clock went backwards compared to the last ID, wait (small jump) or refuse (big jump).',
            'If we are still in the same millisecond as the last ID, increment the sequence. If it overflows past 4,095, spin until the next millisecond.',
            'If it is a new millisecond, reset the sequence to 0.',
            'Shift and OR the three parts together: (time − epoch) << 22 | workerId << 12 | sequence.',
          ],
        },
        {
          type: 'flow',
          title: 'Startup and steady state',
          code: `sequenceDiagram
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
  Note over P: No network call per ID — microseconds each`,
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Snowflake Generator in TypeScript' },
        {
          type: 'paragraph',
          text: 'JavaScript numbers are 64-bit floats and can only represent integers exactly up to 2^53 − 1, so we use bigint for every bit operation. This implementation was run on Node 22: 100,000 IDs on one worker, all unique and strictly increasing.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Layout: 1 sign bit (0) | 41-bit ms timestamp | 10-bit worker | 12-bit sequence
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
        throw new Error(\`Clock moved backwards by \${drift}ms — refusing to generate IDs\`);
      }
      ms = this.waitUntil(this.lastMs); // small skew: just wait it out
    }

    if (ms === this.lastMs) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // 4096 IDs already issued this millisecond — spin until the next one
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
}`,
        },
        { type: 'heading2', text: 'Testing It' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Run with: node --experimental-strip-types snowflake.ts
const gen = new Snowflake(42);
const ids: bigint[] = [];
for (let i = 0; i < 100_000; i++) ids.push(gen.nextId());

const unique = new Set(ids).size === ids.length;
const increasing = ids.every((id, i) => i === 0 || id > ids[i - 1]);
console.log({ unique, increasing, decoded: decode(ids[0]) });
// → { unique: true, increasing: true,
//     decoded: { createdAt: 2026-11-05T12:14:26.432Z, workerId: 42, sequence: 0 } }

// Send IDs to browsers as strings — Number(id) would silently lose precision
console.log(JSON.stringify({ id: ids[0].toString() }));
// → {"id":"376705820370575360"}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Inject the clock (the now parameter) so you can unit-test the hard cases: freeze it to force a sequence overflow (ID 4,097 in one millisecond must move to the next millisecond with sequence 0), and move it back 100 ms to check that the generator throws instead of repeating IDs.',
        },
        { type: 'heading2', text: 'The Generation Algorithm as a Flowchart' },
        {
          type: 'flow',
          title: 'nextId() step by step',
          code: `flowchart TD
  A([nextId called]):::client --> B[Read clock: now ms]:::server
  B --> C{"Clock earlier<br/>than lastMs?"}
  C -->|"Yes, ≤ 5 ms"| W1[Wait until clock<br/>reaches lastMs]:::cache --> D
  C -->|"Yes, > 5 ms"| X(["Throw — refuse<br/>rather than duplicate"]):::security
  C -->|No| D{"Same ms<br/>as lastMs?"}
  D -->|"Yes"| E[sequence + 1]:::server --> F{sequence > 4095?}
  F -->|Yes| W2[Spin until next ms,<br/>sequence = 0]:::cache --> G
  F -->|No| G
  D -->|"No — new ms"| R[sequence = 0]:::server --> G
  G["Combine: time shifted 22 bits,<br/>worker shifted 12 bits, OR sequence"]:::highlight --> H([Return id])`,
        },
        { type: 'heading2', text: 'Worker-ID Assignment' },
        {
          type: 'paragraph',
          text: 'The whole scheme rests on one promise: no two live processes ever share a worker ID. Pick a method that keeps that promise even during deploys and crashes.',
        },
        {
          type: 'bullets',
          items: [
            'Static config / environment variable: simplest. Fine for a handful of fixed servers, error-prone with autoscaling (two copies of the same config = duplicate IDs).',
            'Kubernetes StatefulSet ordinal: pod id-gen-7 uses worker 7. Stable names and at most one pod per ordinal; combine with a region prefix for multi-cluster setups.',
            'ZooKeeper ephemeral sequential node or etcd lease: on startup, claim a free worker ID with a TTL lease and keep renewing it. If the process dies, the lease expires and the ID becomes reusable. If the process cannot renew, it must stop generating IDs before the lease expires.',
            'Database row with a lease column: the same idea using a table you already have, e.g. UPDATE workers SET owner = ?, expires_at = now() + 30s WHERE id = ? AND expires_at < now().',
          ],
        },
        {
          type: 'flow',
          title: 'Claiming a worker ID with an etcd lease',
          code: `sequenceDiagram
  participant P as New process
  participant E as etcd
  P->>E: Grant lease, TTL 10s
  E-->>P: lease 7f3a
  P->>E: Txn: if workers/17 missing, put workers/17 with lease 7f3a
  E-->>P: success — worker 17 is mine
  loop every 3s
    P->>E: KeepAlive 7f3a
  end
  Note over P,E: Process crashes — keep-alives stop
  E->>E: 10s later lease expires, workers/17 deleted
  Note over E: worker 17 is free for the next process`,
          text: 'The atomic transaction ("only if the key does not exist") guarantees two processes cannot claim the same worker ID at the same moment.',
        },
        { type: 'heading2', text: 'Storing and Transporting IDs' },
        {
          type: 'bullets',
          items: [
            'Database: BIGINT (signed is fine because the sign bit is always 0).',
            "JSON APIs: send IDs as strings. JavaScript's Number is exact only up to 2^53 − 1 (9,007,199,254,740,991). A Snowflake ID passes that limit about 25 days after the epoch, so JSON.parse turns 376705820370575361 into 376705820370575360 — a different object! Twitter returns both id and id_str for exactly this reason.",
            'In code: bigint in JavaScript/TypeScript, long in Java, int64 in Go.',
          ],
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Horizontal Scaling Is (Almost) Free' },
        {
          type: 'paragraph',
          text: 'Workers never talk to each other, so adding a worker adds ~4.1M IDs/second of capacity with zero coordination cost. The real limit is the 10-bit worker space: 1,024 concurrent generators. That is plenty for an ID service, but tight if every pod of every microservice embeds its own generator — which is when you widen the worker field or run a dedicated ID service (see How Scaling Works in Core Concepts for the stateless-scaling pattern).',
        },
        { type: 'heading2', text: 'Re-Balancing the Bits' },
        {
          type: 'bullets',
          items: [
            'More machines, fewer IDs each: 13 worker bits (8,192 workers) + 9 sequence bits (512 per ms = 512K/s per worker).',
            'Longer lifetime: Sonyflake uses 39 bits of 10 ms units (~174 years), 8 bits of sequence and 16 bits of machine ID — fewer IDs per second per machine, many more machines.',
            'Decide the layout on day one: changing it later breaks decoding and can break ordering between old and new IDs.',
          ],
        },
        { type: 'heading2', text: 'Multi-Region Worker-ID Ranges' },
        {
          type: 'paragraph',
          text: 'Each region must draw worker IDs from a range no other region uses, otherwise two regions could hand out the same worker ID. Either reserve leading bits for the region, or assign fixed ranges in config. Each region then runs its own etcd/ZooKeeper for leasing — no cross-region coordination on the hot path or at startup.',
        },
        {
          type: 'flow',
          title: 'Splitting the 10 worker bits across regions',
          code: `flowchart TB
  W["10-bit worker ID<br/>= 3-bit region + 7-bit worker"]:::highlight
  W --> US["us-east = region 0<br/>workers 0–127"]:::server
  W --> EU["eu-west = region 1<br/>workers 128–255"]:::server
  W --> AP["ap-south = region 2<br/>workers 256–383"]:::server
  W --> FREE["regions 3–7<br/>reserved for growth"]:::external
  US --> E1[(etcd us-east)]:::security
  EU --> E2[(etcd eu-west)]:::security
  AP --> E3[(etcd ap-south)]:::security`,
          text: '3 region bits = 8 regions × 128 workers each. Regions can generate IDs even when cut off from each other, because their ranges can never overlap.',
        },
        { type: 'heading2', text: 'Scaling the Alternatives' },
        {
          type: 'bullets',
          items: [
            'Segment allocation: increase the block size (1,000 → 100,000) so the DB is hit less often. Cost: a crash throws away the unused part of the block, leaving gaps.',
            'Ticket server: add servers with step/offset — but each one is still a network hop per ID.',
            'UUID: scales infinitely with no coordination at all — its cost is size and (for v4) index locality, not throughput.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Clock Skew and NTP' },
        {
          type: 'paragraph',
          text: 'Every server has its own quartz clock that drifts by a few milliseconds per hour. NTP (Network Time Protocol) — usually run via chrony — corrects it. A correction can either slew (speed up or slow down the clock gradually, never going backwards) or step (jump the clock instantly, possibly backwards). For ID generators you want slewing only, plus leap-second smearing so a leap second does not repeat a timestamp.',
        },
        { type: 'heading2', text: 'When the Clock Moves Backwards' },
        {
          type: 'paragraph',
          text: 'If the clock jumps back 20 ms, the generator would revisit timestamps it has already used — and could repeat (timestamp, sequence) pairs it already issued. That is the one bug a Snowflake generator must never have.',
        },
        {
          type: 'flow',
          title: 'Handling a backwards clock',
          code: `flowchart TD
  T([Clock reads earlier<br/>than lastMs]):::client --> S{How far back?}
  S -->|"A few ms"| W[Wait until the clock<br/>catches up to lastMs]:::cache --> OK([Continue safely]):::highlight
  S -->|"Larger jump"| P{Policy}
  P -->|"Refuse"| R["Throw + alert<br/>callers retry on another worker"]:::security
  P -->|"Logical clock"| L["Keep using lastMs + 1 as time,<br/>borrowing from the future"]:::server
  L --> OK
  R --> OPS[On-call checks NTP]:::queue`,
          text: 'Refusing is the safe default. A logical clock (keep advancing lastMs and ignore the wall clock until it catches up) keeps serving, at the price of IDs whose timestamps run slightly ahead of real time.',
        },
        {
          type: 'bullets',
          items: [
            'Restarts are the sneaky case: a fresh process has lastMs = −1, so it cannot detect that the clock went back while it was down. Mitigate by persisting the last timestamp periodically (or storing it in the lease), and refusing to start until the clock is past it.',
            "Holding a worker ID lease for longer than the maximum expected clock jump also helps: a replacement process with the same worker ID only starts after the old one's timestamps are in the past.",
          ],
        },
        { type: 'heading2', text: 'Sequence Overflow Within a Millisecond' },
        {
          type: 'paragraph',
          text: 'If one worker is asked for more than 4,096 IDs in the same millisecond, the 12-bit sequence wraps to 0. Reusing sequence 0 in the same millisecond would duplicate an ID, so the generator spins until the next millisecond. The cost is at most ~1 ms of latency for the unlucky callers — and it is visible in metrics, so you know when a worker is saturated.',
        },
        { type: 'heading2', text: 'What Ordering Do You Actually Get?' },
        {
          type: 'bullets',
          items: [
            'On one worker: strictly increasing (as long as the clock never goes backwards).',
            'Across workers: only roughly sorted ("k-sorted"). Two IDs made in the same millisecond on different workers are ordered by worker ID, not by which happened first, and a few ms of clock skew between servers can put a later event before an earlier one.',
            'If you need exact order inside one entity (messages in one chat), assign a per-conversation sequence number in the database — the Chat System lesson orders messages by a time-based ID, which is fine for display but not a causal guarantee.',
          ],
        },
        {
          type: 'flow',
          title: 'Cross-node ordering is only approximate',
          code: `sequenceDiagram
  participant A as Worker 5 (clock 3 ms fast)
  participant B as Worker 9 (clock accurate)
  Note over A,B: Real time 10:00:00.000
  A->>A: Event Y happens first, stamped .003
  Note over A,B: Real time 10:00:00.002
  B->>B: Event X happens later, stamped .002
  Note over A,B: X happened 2 ms after Y but gets the smaller ID`,
        },
        { type: 'heading2', text: 'Failure Modes Summary' },
        {
          type: 'bullets',
          items: [
            'Generator process dies: callers use another worker; the lease frees its worker ID. No data is lost because there is no state worth keeping beyond lastMs.',
            'Registry (etcd/ZooKeeper) down: running workers keep generating IDs; only new processes cannot start. Workers whose lease cannot be renewed must stop before it expires.',
            'Duplicate worker ID (misconfiguration): the most dangerous failure — produces real duplicates. Guard with leases plus a unique constraint on the primary key, which turns a silent duplicate into a loud insert error.',
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
            'Embedded Snowflake: well under 1 µs per ID — a clock read and a few bit operations.',
            'Remote ID service: one network round-trip, ~0.5–2 ms inside a data center. Batch requests (ask for 100 IDs at once) to amortise it.',
            'Segment allocation: in-memory most of the time; one DB write per block, hidden by prefetching.',
            'Database auto-increment / ticket server: one DB round-trip per ID, typically 1–5 ms, and every ID competes for the same row lock.',
          ],
        },
        { type: 'heading2', text: 'Measured Throughput' },
        {
          type: 'paragraph',
          text: 'Running the generator above in a tight loop on a laptop produced 1 million IDs at ~4.1 million IDs/second — which is exactly the 4,096-per-millisecond ceiling. The CPU was not the limit; the 12-bit sequence was. That is the design working as intended: the generator waits instead of overflowing.',
        },
        {
          type: 'flow',
          title: 'Where the time goes per ID',
          code: `flowchart LR
  subgraph Embedded["Embedded library"]
    E1[Read clock]:::server --> E2[Bit shifts]:::server --> E3(["~0.2 µs"]):::highlight
  end
  subgraph Remote["Remote ID service"]
    R1[Serialize request]:::client --> R2[Network hop]:::network --> R3[Generate]:::server --> R4[Network hop back]:::network --> R5(["~1 ms"]):::cache
  end
  subgraph Ticket["Ticket server / DB"]
    T1[Network hop]:::network --> T2[Row lock + write]:::db --> T3(["~1–5 ms"]):::cache
  end`,
          text: 'The embedded approach is three to four orders of magnitude faster — which is why most large systems generate IDs in-process.',
        },
        { type: 'heading2', text: 'Index and Storage Performance' },
        {
          type: 'bullets',
          items: [
            '8-byte keys mean smaller indexes, more keys per page and more of the index in RAM than 16-byte UUIDs.',
            'Time-ordered keys insert at the right edge of the B-tree, keeping writes sequential and pages full.',
            'Hot-spot caveat: in range-sharded stores (HBase, Bigtable, Spanner), time-ordered keys all land on the newest range and overload one node. Use hash-based sharding on the ID, or prefix the key with a hash/shard number.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Comparing the Approaches' },
        {
          type: 'bullets',
          items: [
            'DB auto-increment: tiny, perfectly ordered, trivial. But a single point of failure and a throughput ceiling; multi-master step/offset loses global ordering and is painful to resize.',
            'UUID v4: zero coordination, never a bottleneck. But 128 bits, unsortable, and hurts B-tree indexes.',
            'UUID v7: zero coordination and time-ordered. Still 128 bits — great default when you do not need 64-bit IDs.',
            'Ticket server: numeric and simple. But a network hop per ID and a central service to keep alive.',
            'Segment allocation: compact, dense numbers with very few DB writes. But gaps after crashes, ordering only within a server, and a DB dependency for new blocks.',
            'Snowflake: 64-bit, time-sortable, millions per second, no hot-path coordination. But depends on clocks being sane and worker IDs being unique, and leaks creation time.',
          ],
        },
        {
          type: 'flow',
          title: 'Picking an ID strategy',
          code: `flowchart TD
  S([What do you need?]):::client --> A{Single database,<br/>modest scale?}
  A -->|Yes| AI[DB auto-increment]:::db
  A -->|No| B{Must fit in 64 bits?}
  B -->|"No — 128 is fine"| C{Need time ordering?}
  C -->|Yes| V7[UUID v7]:::highlight
  C -->|No| V4[UUID v4]:::external
  B -->|Yes| D{Need short, dense numbers?<br/>e.g. 7-char codes}
  D -->|Yes| SEG[Segment / range allocation]:::server
  D -->|No| SF[Snowflake]:::highlight`,
        },
        { type: 'heading2', text: 'Exposing IDs Publicly' },
        {
          type: 'bullets',
          items: [
            'Sequential IDs invite enumeration: if your order is /orders/1042, an attacker tries /orders/1041. Always enforce authorization — but also do not make guessing easy.',
            'IDs leak business data: auto-increment reveals your total count, and two IDs a day apart reveal daily volume (the "German tank problem"). A Snowflake ID reveals its exact creation time, worker and per-ms sequence.',
            'Fix: keep the Snowflake as the internal primary key, and expose a separate opaque public ID (a random token or UUID v4) or an encrypted form of the internal ID. Base62 encoding or Hashids-style obfuscation is cosmetic, not security.',
            'For the URL Shortener this is why the short codes should not be purely sequential — and note that base62-encoding a full 64-bit Snowflake takes up to 11 characters, not 7, so 7-char codes usually come from a compact counter or range allocation instead.',
          ],
        },
        { type: 'heading2', text: 'Coordination vs. Dependence on Clocks' },
        {
          type: 'paragraph',
          text: 'Every approach pays for uniqueness somewhere. Auto-increment and ticket servers pay with a central coordinator on every call. Segment allocation pays occasionally (once per block). UUIDs pay with size and probability. Snowflake pays by trusting the local clock and a one-time worker-ID assignment — the cheapest at runtime, but it moves the risk into operations: clock monitoring and worker-ID hygiene.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring & Alerting' },
        {
          type: 'bullets',
          items: [
            'Clock drift: export chrony/NTP offset per host. Alert if any host drifts more than ~10 ms, and page if it exceeds your backwards-tolerance (5 ms in the code above).',
            'Backwards clock events: count every "waited for clock" and every refusal. Any refusal is a page.',
            'Sequence exhaustion: count how often a worker had to wait for the next millisecond. A steady rise means the worker is saturated — add workers or rebalance traffic before latency suffers.',
            'Worker-ID leases: alert on lease renewal failures and on the pool of free worker IDs dropping below ~20%.',
            'Duplicate-key errors on insert: should be zero. A non-zero count usually means two processes share a worker ID.',
          ],
        },
        { type: 'heading2', text: 'Operational Rules' },
        {
          type: 'bullets',
          items: [
            'Configure chrony to slew, not step, after boot, and use leap-second smearing (e.g. Google/AWS time sources).',
            'Never hand-edit the system clock on a generator host.',
            'Choose the custom epoch once, store it in shared config, and never change it — changing it reinterprets every existing ID.',
            'Document the bit layout next to the code; downstream teams will decode IDs for debugging and sharding.',
            'Keep a unique constraint on the ID column as a last line of defence.',
          ],
        },
        { type: 'heading2', text: 'Security' },
        {
          type: 'bullets',
          items: [
            'Do not use Snowflake or sequential IDs as secrets (password-reset tokens, invite links). Use a cryptographically random token.',
            'Use opaque public IDs where creation time or volume is sensitive.',
            'Protect the worker-ID registry: anyone who can write to it can create duplicate workers.',
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
            'Design a distributed unique ID generator.',
            'Why not just use the database auto-increment? Why not UUIDs?',
            'Walk me through the bit layout of a Snowflake ID and how long it lasts.',
            'How are worker IDs assigned, and what happens if two machines get the same one?',
            'What happens when the clock moves backwards?',
          ],
        },
        { type: 'heading2', text: 'Follow-Up Questions an Interviewer Might Ask' },
        {
          type: 'bullets',
          items: [
            '"What if one node needs more than 4,096 IDs in a millisecond?" → Wait for the next ms; if sustained, add workers or move bits from worker to sequence.',
            '"Are the IDs globally sorted?" → Only roughly. Strictly increasing per worker; across workers, skew of a few ms can reorder events.',
            '"How do you send these IDs to a browser?" → As strings — JavaScript loses precision above 2^53.',
            '"What happens in 2093?" → The 41-bit timestamp runs out ~69.7 years after the custom epoch; plan a migration or a new layout long before.',
            '"Can I put these IDs in public URLs?" → They leak creation time and volume; expose an opaque public ID.',
            '"How would you run this in three regions?" → Reserve region bits or fixed worker ranges per region, with a local registry in each.',
          ],
        },
        { type: 'heading2', text: 'How to Present It in 30–40 Minutes' },
        {
          type: 'numbered',
          items: [
            'Clarify requirements (3–5 min): numeric or string? 64-bit? sortable? IDs per second? Multi-region?',
            'Quick estimate (2 min): 1B objects/day ≈ 11.6K/s average — show that throughput is easy and the real problem is coordination.',
            'Compare approaches (8–10 min): auto-increment → multi-master → UUID → ticket server → segments → Snowflake, one sentence of pros/cons each.',
            'Deep dive on Snowflake (10 min): draw the 1 + 41 + 10 + 12 layout, compute 69 years / 1,024 workers / 4,096 per ms, write nextId().',
            'Edge cases (5–8 min): worker-ID assignment, clock going backwards, sequence overflow, ordering guarantees.',
            'Wrap up (3 min): monitoring, public IDs, JSON precision.',
          ],
        },
        {
          type: 'flow',
          title: 'A 40-minute interview, step by step',
          code: `flowchart LR
  A[Clarify<br/>64-bit? sortable? rate?]:::client --> B[Estimate<br/>~12K IDs/s]:::client
  B --> C[Compare approaches<br/>DB, UUID, ticket, segment]:::server
  C --> D[Snowflake layout<br/>1 + 41 + 10 + 12]:::highlight
  D --> E[Edge cases<br/>clock, overflow, worker IDs]:::security
  E --> F[Production<br/>monitoring, public IDs]:::db`,
        },
        { type: 'heading2', text: 'Common Mistakes Candidates Make' },
        {
          type: 'bullets',
          items: [
            'Getting the arithmetic wrong — 41 bits of ms is ~69 years, not 139 (that would be 42 bits); 12 bits is 4,096, not 4,095 IDs per ms.',
            'Saying "IDs are sorted" without qualifying that it is only per-worker / roughly across workers.',
            'Ignoring clocks entirely — the clock-backwards question is almost guaranteed.',
            'Hand-waving worker-ID assignment ("each server has an ID") without explaining how duplicates are prevented during deploys.',
            'Returning 64-bit IDs as JSON numbers to a JavaScript client.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'This is a small system with deep edge cases. Interviewers are less interested in the happy path (shift and OR three numbers) than in what you do when the assumptions break: clocks that jump, workers that share an ID, and a millisecond that runs out of sequence numbers.',
        },
      ],
    },
  ],
};
