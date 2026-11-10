import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 15 — Back-of-the-Envelope Estimation
// ─────────────────────────────────────────────────────────────────────────────
export const backOfTheEnvelopeEstimation: CoreConcept = {
  id: 'back-of-the-envelope-estimation',
  title: 'Back-of-the-Envelope Estimation',
  emoji: '🧮',
  icon: 'ti-calculator',
  color: '#ca8a04',
  bg: '#fef9c3',
  accentGlow: 'rgba(202,138,4,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Turn "100 million users" into QPS, storage, bandwidth, cache size and server counts in five minutes — and let those numbers drive your design.',
  tags: ['QPS', 'Storage Math', 'Latency Numbers', 'Availability Nines', 'Capacity Planning'],
  estimatedTime: '40 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        { type: 'heading2', text: 'Quick Math That Is "Right Enough" to Decide' },
        {
          type: 'paragraph',
          text: 'Back-of-the-envelope estimation is rough, fast arithmetic that tells you how big a system has to be. You start from a few stated assumptions (how many users, how often they act, how big each item is) and work out requests per second, storage, network bandwidth, cache memory and the number of servers. The goal is not a precise answer — it is the correct order of magnitude: is this 10 requests per second or 100,000? Gigabytes or petabytes?',
        },
        {
          type: 'paragraph',
          text: 'The name comes from doing the sums on the back of an envelope: no spreadsheet, no benchmarks, just round numbers. Being within 2–3× of reality is good enough, because the design decisions you make (one database or a sharded cluster, a CDN or no CDN) only change when a number moves by 10× or more.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: before planning a wedding you do not count every guest’s exact meal — you ask "about 50 people or about 500?" That one rough number decides whether you book a restaurant or a stadium. Estimation does the same for software: one rough number decides whether you need one server or a fleet.',
        },
        {
          type: 'flow',
          title: 'The big picture — assumptions in, decisions out',
          code: `flowchart LR
  A["Assumptions<br/>users, actions, sizes"]:::client --> M["Quick math<br/>round aggressively"]:::server
  M --> Q["QPS<br/>average + peak"]:::highlight
  M --> S["Storage<br/>per day, per year"]:::db
  M --> B["Bandwidth<br/>in + out"]:::network
  M --> C["Cache memory<br/>hot set"]:::cache
  Q --> D["Design decisions<br/>servers, sharding, CDN, cache"]:::highlight
  S --> D
  B --> D
  C --> D`,
          text: 'Every estimate exists to feed a decision. If a number does not change your design, you do not need to compute it.',
        },
      ],
    },
    {
      id: 'why-we-need-it',
      title: 'Why Do We Need It?',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Why Interviewers Ask for Estimates' },
        {
          type: 'paragraph',
          text: 'In a system design interview, the estimate is not a maths test. The interviewer wants to see that your architecture is sized for the problem. A design for 50 requests per second and one for 500,000 requests per second look completely different, and you can only justify the difference with numbers.',
        },
        {
          type: 'numbered',
          items: [
            'Do we need sharding? If the data will reach 100+ TB, it will not fit on one database machine, so you must partition it. If it is 50 GB, a single primary with replicas is simpler and better.',
            'Do we need a CDN? If outgoing traffic is tens of Gbps of images or video, serving it from your own servers is expensive and slow for far-away users. A CDN becomes mandatory.',
            'How many servers? Peak QPS divided by what one server can handle gives the size of the application fleet — and tells you a load balancer is needed.',
            'Do we need a cache, and how big? If reads outnumber writes 100:1 and the hot data is 100 GB, a few Redis nodes can absorb most of the read traffic.',
            'Is the design even possible? Estimates catch impossible ideas early, e.g. "store every keystroke for 1 billion users forever" or "one database handling 1M writes per second".',
          ],
        },
        {
          type: 'flow',
          title: 'Each number drives a decision',
          code: `flowchart TD
  Q{"Peak QPS above<br/>what one server handles?"} -->|"yes"| LB["Many app servers<br/>behind a load balancer"]:::server
  Q -->|"no"| ONE["A couple of servers<br/>for redundancy"]:::server
  S{"Data larger than<br/>one DB machine ~ few TB?"} -->|"yes"| SH["Shard or partition<br/>the database"]:::db
  S -->|"no"| REP["Single primary<br/>+ read replicas"]:::db
  B{"Egress in tens of Gbps<br/>of media?"} -->|"yes"| CDN["Put a CDN in front"]:::network
  R{"Reads far above writes?"} -->|"yes"| CA["Add a cache layer"]:::cache`,
          text: 'Say the decision out loud right after each number: "~180K peak reads per second, so we need a cache and a fleet of stateless servers."',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'From Users to Requests per Second' },
        {
          type: 'paragraph',
          text: 'Almost every estimate starts with daily active users (DAU). Multiply DAU by how many times each user does something per day to get requests per day. Divide by the number of seconds in a day (86,400) to get the average requests per second (QPS — queries per second). Traffic is never flat, so multiply by a peak factor to get the number you actually design for.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `requests/day = DAU × actions per user per day
average QPS  = requests/day ÷ 86,400        (≈ ÷ 100,000 for quick math)
peak QPS     = average QPS × peak factor    (usually ×2 to ×10)

Shortcuts worth memorising:
  1 million requests/day  ≈ 12 QPS          (1,000,000 ÷ 86,400 = 11.57)
  100 million / day       ≈ 1,160 QPS
  1 billion / day         ≈ 11,600 QPS      (≈ 12K)
  10 billion / day        ≈ 116,000 QPS`,
        },
        {
          type: 'flow',
          title: 'The QPS funnel',
          code: `flowchart LR
  DAU["DAU<br/>100M users"]:::client -->|"× 10 actions each"| RPD["Requests per day<br/>1 billion"]:::server
  RPD -->|"÷ 86,400 s"| AVG["Average QPS<br/>~11,600"]:::server
  AVG -->|"× 3 peak factor"| PEAK["Peak QPS<br/>~35,000"]:::highlight`,
          text: 'Design for the peak, not the average. The average tells you the daily cost; the peak tells you whether the system falls over.',
        },
        { type: 'heading2', text: 'Choosing the Peak Factor' },
        {
          type: 'bullets',
          items: [
            '×2: Global, steady traffic spread across time zones (URL redirects, background APIs).',
            '×3 to ×5: Consumer apps used mostly in the evening in a few time zones (social feeds, photo apps).',
            '×10 or more: Spiky, event-driven traffic (ticket drops, flash sales, live sports, New Year’s Eve messages). Always justify the factor in one sentence.',
          ],
        },
        { type: 'heading2', text: 'From Items to Storage' },
        {
          type: 'paragraph',
          text: 'Storage is items per day × size per item × days of retention, then × replication factor (usually 3 copies for durability). Separate small metadata (rows in a database) from large blobs (photos, videos in object storage) — they differ by 1,000× and end up in different systems.',
        },
        {
          type: 'flow',
          title: 'The storage pipeline',
          code: `flowchart LR
  N["New items per day"]:::client -->|"× bytes per item"| D["Bytes per day"]:::server
  D -->|"× 365 × years kept"| T["Raw total"]:::db
  T -->|"× 3 replicas"| R["Provisioned storage"]:::highlight
  R --> DEC{"Fits on one<br/>machine?"}
  DEC -->|"no"| SH["Shard / object storage"]:::db
  DEC -->|"yes"| ONE["Single primary + replicas"]:::db`,
        },
        { type: 'heading2', text: 'Bandwidth, Cache and Servers' },
        {
          type: 'bullets',
          items: [
            'Bandwidth = QPS × bytes per request (or response). Multiply bytes by 8 to get bits — network links are sold in Gbps, storage in GB.',
            'Cache memory = hot items × bytes per item. The 80/20 rule: roughly 20% of the data receives 80% of the reads, so caching that 20% absorbs most of the traffic.',
            'Servers = peak QPS ÷ QPS one server can handle, then add headroom (run servers at ~50–70% so a failure or a spike does not tip them over).',
          ],
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'The Estimation Method' },
        {
          type: 'numbered',
          items: [
            'State assumptions: write them on the board — DAU, actions per user per day, item sizes, retention, read/write ratio. Ask the interviewer to confirm or adjust them.',
            'Requests per day: DAU × actions per user. Do it separately for writes (posts, uploads) and reads (views, redirects).',
            'Average QPS: requests per day ÷ 86,400 (use ÷ 10^5 when speed matters, then remember it underestimates by ~14%).',
            'Peak QPS: average × 2–10, with a one-line justification ("evening spike in one region, so ×3").',
            'Read/write ratio: tells you whether to optimise reads (caches, replicas, CDN) or writes (queues, sharded write paths, append-only storage).',
            'Storage: size per item × items per day × retention days, + replication factor. Separate metadata from blobs.',
            'Bandwidth: ingress = write QPS × upload size; egress = read QPS × response size. Convert bytes/s to bits/s (× 8).',
            'Cache memory: hot set (e.g. 20% of daily distinct items) × size per item.',
            'Number of servers: peak QPS ÷ per-server capacity, rounded up, plus headroom and redundancy.',
            'Sanity check and decide: compare against known systems, then say which design choice each number drives.',
          ],
        },
        {
          type: 'flow',
          title: 'The method as a pipeline',
          code: `flowchart TD
  A["1. State assumptions"]:::client --> B["2. Requests per day"]:::server
  B --> C["3. Average QPS<br/>÷ 86,400"]:::server
  C --> D["4. Peak QPS<br/>× 2 to × 10"]:::highlight
  D --> E["5. Read/write ratio"]:::server
  E --> F["6. Storage<br/>size × items × retention × replicas"]:::db
  F --> G["7. Bandwidth<br/>QPS × bytes × 8"]:::network
  G --> H["8. Cache memory<br/>hot set × size"]:::cache
  H --> I["9. Servers<br/>peak ÷ per-server capacity"]:::server
  I --> J{"10. Sanity check:<br/>plausible?"}
  J -->|"no - revisit an assumption"| A
  J -->|"yes"| K["Drive design decisions"]:::highlight`,
          text: 'Keep the loop back to step 1: if a result looks absurd, an assumption is usually wrong, not the arithmetic.',
        },
        { type: 'heading2', text: 'A Tiny Calculator' },
        {
          type: 'code',
          lang: 'typescript',
          code: `const SECONDS_PER_DAY = 86_400;

function estimate(dau: number, actionsPerUser: number, peakFactor: number, bytesPerItem: number) {
  const perDay = dau * actionsPerUser;
  const avgQps = perDay / SECONDS_PER_DAY;
  const peakQps = avgQps * peakFactor;
  const bytesPerDay = perDay * bytesPerItem;
  return { perDay, avgQps, peakQps, bytesPerDay };
}

// 100M DAU, 10 actions/day, ×3 peak, 1 KB per item
estimate(100e6, 10, 3, 1_000);
// → perDay 1e9, avgQps ≈ 11,574, peakQps ≈ 34,722, bytesPerDay = 1 TB`,
        },
        { type: 'heading2', text: 'How to Present It in an Interview' },
        {
          type: 'bullets',
          items: [
            'Write the assumptions first, in a corner of the board, so the interviewer can challenge them early.',
            'Round aggressively: 86,400 → 100,000; 365 → 400 if it helps; 2.5 MB → "a few MB". Say "≈" and move on.',
            'Use powers of ten and units: "10^8 writes a day × 500 bytes = 5 × 10^10 bytes = 50 GB a day."',
            'After each number, state the decision it drives: "50 GB/day × 5 years ≈ 90 TB raw — too big for one machine, so we shard."',
            'Spend about 3–5 minutes. Estimation supports the design; it is not the design.',
          ],
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Building Block 1 — Powers of Two and Data Sizes' },
        {
          type: 'code',
          lang: 'text',
          code: `Power   Exact value             ≈ Decimal        Unit
2^10    1,024                   1 thousand        1 KB
2^20    1,048,576               1 million         1 MB
2^30    1,073,741,824           1 billion         1 GB
2^40    ~1.1 × 10^12            1 trillion        1 TB
2^50    ~1.13 × 10^15           1 quadrillion     1 PB

Typical object sizes (rough):
  ASCII character / small int     1 byte / 4 bytes
  64-bit ID or timestamp          8 bytes
  Tweet-sized text post           ~300 bytes text, ~1 KB with metadata
  Chat message                    ~100 bytes text, a few hundred with metadata
  Database row (user, URL)        ~0.5–1 KB including indexes
  Compressed photo (phone)        ~200 KB (feed size) to ~2–3 MB (original)
  1 minute of video               ~10 MB (480p) to ~40 MB (1080p) to 100+ MB (4K)`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Treat 1 KB = 1,000 bytes in estimates. The 2.4% difference from 1,024 is far smaller than the error in your assumptions. Watch bits vs bytes instead: 1 Gbps link ≈ 125 MB/s.',
        },
        { type: 'heading2', text: 'Building Block 2 — Time Conversions' },
        {
          type: 'bullets',
          items: [
            'Seconds per day: 24 × 60 × 60 = 86,400 ≈ 10^5.',
            'Seconds per month (30 days): 2,592,000 ≈ 2.5 × 10^6.',
            'Seconds per year: 31,536,000 ≈ 3 × 10^7 (a cute mnemonic: about π × 10^7).',
            'So: X per day ÷ 10^5 ≈ X per second; X per second × 10^5 ≈ X per day.',
          ],
        },
        { type: 'heading2', text: 'Building Block 3 — Latency Numbers Every Engineer Should Know' },
        {
          type: 'paragraph',
          text: 'These figures are approximate orders of magnitude, popularised by Jeff Dean and Peter Norvig and updated over the years. Exact values depend on hardware generation, so memorise the ladder (each rung is roughly 10–100× slower than the one before), not the decimals.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `Operation                                   Approx. latency     Order
L1 cache reference                          ~1 ns               10^0 ns
L2 cache reference                          ~5 ns               10^1 ns
Main memory (RAM) reference                 ~100 ns             10^2 ns
Read 1 MB sequentially from RAM             ~10–50 µs           10^4 ns
SSD random read (4 KB)                      ~100 µs             10^5 ns
Round trip within the same datacenter       ~0.5 ms             10^5–10^6 ns
Read 1 MB sequentially from SSD             ~0.2–1 ms           10^6 ns
HDD disk seek                               ~10 ms              10^7 ns
Read 1 MB sequentially from HDD             ~5–20 ms            10^7 ns
Round trip cross-continent (US ↔ Europe)    ~150 ms             10^8 ns`,
        },
        {
          type: 'flow',
          title: 'The latency ladder — each step is roughly 10–100× slower',
          code: `flowchart LR
  L1["L1 cache<br/>~1 ns"]:::cache --> RAM["RAM<br/>~100 ns"]:::cache
  RAM --> SSD["SSD random read<br/>~100 µs"]:::db
  SSD --> DC["Same-DC round trip<br/>~0.5 ms"]:::network
  DC --> HDD["HDD seek<br/>~10 ms"]:::db
  HDD --> WAN["Cross-continent round trip<br/>~150 ms"]:::external`,
          text: 'Lessons: memory is ~1,000× faster than SSD random reads, a network hop inside a datacenter is cheap compared with a cross-continent one, and avoiding disk seeks and long-distance round trips is where most latency wins come from.',
        },
        { type: 'heading2', text: 'Building Block 4 — Availability Nines' },
        {
          type: 'paragraph',
          text: 'Availability is the fraction of time a service works. Allowed downtime = (1 − availability) × period. Using a 365-day year (525,600 minutes) and a 30-day month (43,200 minutes):',
        },
        {
          type: 'code',
          lang: 'text',
          code: `Availability   Downtime / year        Downtime / month (30d)   Downtime / day
99%            3.65 days (87.6 h)     7.2 hours                14.4 minutes
99.9%          8.76 hours             43.2 minutes             86.4 seconds
99.99%         52.56 minutes          4.32 minutes             8.64 seconds
99.999%        5.26 minutes (315 s)   25.9 seconds             0.86 seconds`,
        },
        {
          type: 'flow',
          title: 'Each extra nine cuts downtime by 10×',
          code: `flowchart LR
  N2["99%<br/>3.65 days/yr"]:::external --> N3["99.9%<br/>8.76 h/yr"]:::server
  N3 --> N4["99.99%<br/>52.6 min/yr"]:::highlight
  N4 --> N5["99.999%<br/>5.26 min/yr"]:::security`,
          text: 'Components in series multiply: two services at 99.9% that both must work give 99.9% × 99.9% ≈ 99.8%. Redundant copies in parallel push availability up.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Example 1 — URL Shortener (Read-Heavy, 5-Year Storage)' },
        {
          type: 'paragraph',
          text: 'Same assumptions as the URL Shortener design lesson: 100 million new short URLs per day, a 100:1 read-to-write ratio (10 billion redirects per day), and records kept for 5 years. We assume ~500 bytes per stored record — the ~200-byte long URL plus short code, owner ID, timestamps, expiry and index overhead.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `WRITES
  100M / day ÷ 86,400          ≈ 1,157 QPS        → ~1,160 avg, ~2,300 peak (×2, global traffic)
READS
  10B / day ÷ 86,400           ≈ 115,741 QPS      → ~116K avg, ~230K peak (×2)

STORAGE (5 years)
  URLs: 100M × 365 × 5         = 182.5 billion records   (1 year = 36.5 billion)
  Raw:  182.5B × 500 bytes     = 91.25 TB
  × 3 replicas                 ≈ 274 TB                  → must shard
  (URL bytes alone: 182.5B × 200 B = 36.5 TB raw)

KEY SPACE
  62^6 ≈ 56.8 billion  < 182.5B  → 6 characters are NOT enough
  62^7 ≈ 3.52 trillion > 182.5B  → 7 characters, with ~19× room

BANDWIDTH
  Ingress: 1,157 × 500 B       ≈ 0.58 MB/s       (tiny)
  Egress:  115,741 × 500 B     ≈ 57.9 MB/s       ≈ 463 Mbps average

CACHE (80/20 rule)
  Assume ~1B distinct URLs are read per day; hot 20% = 200M
  200M × 500 B                 = 100 GB          → a few Redis nodes
  (Naive "20% of all 10B daily reads × 500 B" = 1 TB over-counts repeats)

SERVERS
  Assume ~10K redirects/s per server (cache hits, tiny responses)
  230K peak ÷ 10K              = 23  → ~30 servers with headroom`,
        },
        {
          type: 'flow',
          title: 'URL shortener — numbers and the decisions they drive',
          code: `flowchart TB
  A["100M writes/day<br/>10B reads/day"]:::client --> W["~1,160 write QPS<br/>peak ~2,300"]:::server
  A --> R["~116K read QPS<br/>peak ~230K"]:::server
  R --> D1["Read-heavy:<br/>cache + ~30 stateless servers"]:::cache
  W --> S["182.5B records × 500 B<br/>≈ 91 TB raw, ~274 TB with 3 replicas"]:::db
  S --> D2["Shard the key-value store<br/>by short code"]:::db
  S --> D3["7-char Base62 codes<br/>62^7 ≈ 3.5 trillion"]:::highlight`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Notice the asymmetry: writes are only ~1,160 per second (one well-indexed database could almost take them), but storage over 5 years and 230K peak reads are what force sharding and caching. The estimate tells you which problem is actually hard.',
        },
        { type: 'divider' },
        { type: 'heading2', text: 'Example 2 — Photo-Sharing App with a News Feed' },
        {
          type: 'paragraph',
          text: 'Assumptions: 100M DAU. 10M photos uploaded per day (on average 1 in 10 users posts one). Each user views ~50 photos per day, in feed pages of 10 photos (5 feed requests per user). Originals average 2 MB; we also store resized versions totalling ~0.5 MB, so 2.5 MB per photo. A feed-size image served to viewers is ~200 KB. Metadata ~1 KB per photo. Evening peak ×3. Photos are kept forever.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `TRAFFIC
  Uploads: 10M / 86,400              ≈ 116 QPS       → peak ~350
  Feed requests: 100M × 5 = 500M/day ≈ 5,787 QPS     → peak ~17,400
  Image views: 100M × 50 = 5B/day    ≈ 57,870 QPS    → peak ~174,000
  Read:write (views:uploads)         = 500 : 1

STORAGE
  Blobs/day: 10M × 2.5 MB            = 25 TB per day
  Per year:  25 TB × 365             = 9.125 PB
  × 3 replicas                       ≈ 27.4 PB per year   (~137 PB over 5 years)
  Metadata: 10M × 1 KB               = 10 GB per day (~3.65 TB per year)

BANDWIDTH
  Ingress: 10M × 2 MB ÷ 86,400       ≈ 231 MB/s  ≈ 1.85 Gbps
  Egress:  5B × 200 KB               = 1 PB per day
           ÷ 86,400                  ≈ 11.6 GB/s ≈ 92.6 Gbps average, ~278 Gbps peak

CACHE MEMORY
  Pre-built feeds: 100M users × 200 post IDs × 8 B  = 160 GB
  Hot metadata: last 30 days = 300M photos, hot 20% = 60M × 1 KB = 60 GB
  Total ≈ 220 GB  → ~4 nodes of 64 GB, ×2 for replicas ≈ 8 cache nodes

SERVERS
  Feed API at ~1,000 QPS per server: 17,400 ÷ 1,000 ≈ 18 → ~25 with headroom
  Image bytes are NOT served by these servers — they come from the CDN`,
        },
        {
          type: 'flow',
          title: 'Photo app — where each number lands',
          code: `flowchart LR
  U(["100M DAU"]):::client -->|"10M uploads/day<br/>~1.85 Gbps in"| UP["Upload service"]:::server
  UP --> OBJ[("Object storage<br/>25 TB/day, ~27 PB/yr with replicas")]:::db
  UP --> META[("Metadata DB<br/>10 GB/day")]:::db
  U -->|"~17K peak feed QPS"| FEED["Feed API<br/>~25 servers"]:::server
  FEED --> RC[("Redis<br/>~220 GB feeds + metadata")]:::cache
  U -->|"~93 Gbps avg images"| CDN["CDN edge caches"]:::network
  CDN -.->|"cache miss"| OBJ`,
          text: 'Egress of ~93 Gbps on average (and ~278 Gbps at peak) is the number that makes a CDN non-negotiable; 25 TB of new blobs per day is what pushes photos into object storage instead of a database.',
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
          title: 'At a glance — from assumptions to architecture',
          code: `flowchart LR
  A["1. Assumptions"]:::client --> T["2. Traffic<br/>avg + peak QPS"]:::server
  T --> S["3. Storage<br/>+ replication"]:::db
  S --> B["4. Bandwidth"]:::network
  B --> C["5. Cache memory"]:::cache
  C --> V["6. Servers +<br/>sanity check"]:::highlight`,
          text: 'The step cards below walk through each stage with the formula and the decision it informs.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-estimation-pipeline',
            title: 'Back-of-the-Envelope Estimation Pipeline',
            subtitle:
              'How a handful of stated assumptions turn into QPS, storage, bandwidth, cache size and server counts',
            nodes: [
              {
                id: 'assumptions',
                name: 'State Assumptions',
                subtitle: 'DAU, Actions, Sizes, Retention',
                type: 'client',
                icon: 'ti-clipboard-list',
                badge: 'Inputs',
                protocol: 'Write them down first',
                details: [
                  'Daily active users and actions per user per day (split reads and writes)',
                  'Item sizes: ~1 KB metadata row, ~200 KB–2 MB photo, ~10–40 MB per video minute',
                  'Retention period and replication factor (usually 3)',
                ],
              },
              {
                id: 'traffic',
                name: 'Traffic Estimate',
                subtitle: 'Average and Peak QPS',
                type: 'server',
                icon: 'ti-activity',
                badge: 'QPS',
                protocol: '÷ 86,400 then × peak',
                details: [
                  '1M requests/day ≈ 12 QPS; 1B/day ≈ 11,600 QPS',
                  'Peak factor ×2 (global, steady) to ×10+ (flash sales, live events)',
                  'Read/write ratio decides whether to optimise reads or writes',
                ],
              },
              {
                id: 'storage',
                name: 'Storage Estimate',
                subtitle: 'Items × Size × Retention × Replicas',
                type: 'database',
                icon: 'ti-database',
                badge: 'Storage',
                protocol: 'Bytes per day → per year',
                details: [
                  'Separate small metadata (database) from large blobs (object storage)',
                  'Multiply by 3 for replication; tens of TB or more means sharding',
                ],
              },
              {
                id: 'bandwidth',
                name: 'Bandwidth Estimate',
                subtitle: 'Ingress and Egress',
                type: 'network',
                icon: 'ti-arrows-exchange',
                badge: 'Network',
                protocol: 'QPS × bytes × 8',
                details: [
                  'Ingress = write QPS × upload size; egress = read QPS × response size',
                  '1 Gbps ≈ 125 MB/s; tens of Gbps of media egress means a CDN',
                ],
              },
              {
                id: 'cache',
                name: 'Cache Memory Estimate',
                subtitle: '80/20 Hot Set',
                type: 'cache',
                icon: 'ti-bolt',
                badge: 'Memory',
                protocol: 'Hot items × size',
                details: [
                  'Cache ~20% of the distinct daily items to absorb ~80% of reads',
                  'Count distinct items, not raw requests, or you will over-provision',
                ],
              },
              {
                id: 'servers',
                name: 'Server Count & Sanity Check',
                subtitle: 'Peak ÷ Per-Server Capacity',
                type: 'gateway',
                icon: 'ti-server',
                badge: 'Fleet',
                protocol: 'Round up + headroom',
                details: [
                  'Run servers at ~50–70% utilisation so failures and spikes are absorbed',
                  'Compare with known systems: does the answer feel plausible?',
                ],
              },
            ],
            connections: [
              {
                from: 'assumptions',
                to: 'traffic',
                label: '1. Requests per day',
                protocol: 'DAU × actions',
              },
              { from: 'traffic', to: 'storage', label: '2. Writes per day', protocol: 'Items/day' },
              {
                from: 'storage',
                to: 'bandwidth',
                label: '3. Bytes per request',
                protocol: 'Item size',
              },
              { from: 'bandwidth', to: 'cache', label: '4. Hot read set', protocol: '80/20 rule' },
              { from: 'cache', to: 'servers', label: '5. Remaining load', protocol: 'Peak QPS' },
            ],
            keyTakeaways: [
              'Order of magnitude is the goal: being within 2–3× is fine because design decisions only change at ~10× boundaries.',
              'Design for peak QPS, store with replication, and always separate metadata from blobs — they land in different systems.',
              'Every number should end with a decision: shard or not, CDN or not, cache size, number of servers.',
            ],
            rawSpec: `ASSUMPTIONS: 100M DAU, 10 actions/user/day, 1 KB/item, keep 5 years, ×3 replicas
   │
   ▼  requests/day = 100M × 10 = 1B
[ TRAFFIC ]   avg = 1B ÷ 86,400 ≈ 11,600 QPS   peak (×3) ≈ 35,000 QPS
   │
   ▼  writes/day × size
[ STORAGE ]   1B × 1 KB = 1 TB/day → ×365×5 ≈ 1.8 PB → ×3 ≈ 5.5 PB
   │
   ▼  QPS × bytes × 8
[ BANDWIDTH ] 11,600 × 1 KB ≈ 11.6 MB/s ≈ 93 Mbps average
   │
   ▼  hot 20% of distinct daily items
[ CACHE ]     e.g. 200M items × 1 KB = 200 GB
   │
   ▼  peak ÷ per-server capacity
[ SERVERS ]   35,000 ÷ 2,000 ≈ 18 → ~25 with headroom`,
          },
        },
      ],
    },
    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Where the Numbers Come From' },
        {
          type: 'bullets',
          items: [
            'Latency numbers: measured on real hardware and published as a teaching list (Jeff Dean’s "numbers everyone should know"). CPU caches and RAM have changed little in a decade; SSDs and networks improved a lot, so treat older figures as upper bounds.',
            'Object sizes: averages from real products — a compressed phone photo is a few MB at full size but ~100–300 KB at feed resolution; video size is bitrate × duration (5 Mbps × 60 s = 300 Mb ≈ 37.5 MB per minute at 1080p).',
            'Per-server capacity: depends entirely on the work per request. A cache-hit redirect may do 10K+ QPS per server; a feed that fans out to several services may do a few hundred to ~1,000. A single Redis node handles ~100K simple operations per second.',
            'Peak factors: come from traffic graphs — daily curves usually peak at 2–3× the average, while events like a product launch can hit 10–100× for minutes.',
          ],
        },
        { type: 'heading2', text: 'Why They Are Only Approximations' },
        {
          type: 'paragraph',
          text: 'Every input is a guess, and errors multiply. If DAU is off by 2× and size per item is off by 2×, storage is off by 4×. That is acceptable because architecture choices are coarse: whether data is 70 TB or 280 TB, the answer is still "shard it". What is not acceptable is a 1,000× error from a unit slip (bits vs bytes, KB vs MB, per day vs per second).',
        },
        {
          type: 'flow',
          title: 'Sanity-check loop',
          code: `flowchart TD
  R["Result: e.g. 274 TB, 230K peak QPS"]:::server --> U{"Units consistent?<br/>bits vs bytes, day vs second"}
  U -->|"no"| FIX["Fix the unit slip"]:::external
  FIX --> R
  U -->|"yes"| K{"Plausible vs a known system?"}
  K -->|"no"| A["Revisit the assumption<br/>that dominates the product"]:::external
  A --> R
  K -->|"yes"| OK["Use it to make the decision"]:::highlight`,
          text: 'Known anchors help: Twitter-scale systems see hundreds of thousands of reads per second; a single commodity server holds a few TB on SSD; a 10 Gbps NIC moves ~1.25 GB/s.',
        },
        { type: 'heading2', text: 'Rounding Rules' },
        {
          type: 'bullets',
          items: [
            'Keep one or two significant figures: 115,741 → "~116K" or even "~100K".',
            'Round in the direction that keeps you safe: round traffic and storage up, per-server capacity down.',
            'Use powers of ten: 10^8 × 5 × 10^2 = 5 × 10^10 bytes = 50 GB. Adding exponents is faster than multiplying long numbers.',
            'Don’t round twice in the same direction on every step, or a 10% tweak per step becomes a 2× drift by the end.',
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
            'Myth: "The interviewer wants the exact answer." Reality: they want reasonable assumptions, clean arithmetic and a decision. Saying "≈ 100K QPS, so we need a cache" beats computing 115,740.74 precisely.',
            'Myth: "Average QPS is what you design for." Reality: systems fail at the peak. State a peak factor and size servers, databases and connection pools for it.',
            'Myth: "Storage is just items × size." Reality: add retention, replication (×3), indexes and metadata overhead, and growth. Forgetting replication alone hides a 3× cost.',
            'Myth: "Cache 20% of all requests." Reality: the 80/20 rule applies to distinct items. 10 billion reads of the same hot links do not need 10 billion cache entries.',
            'Myth: "Latency numbers are fixed constants." Reality: they are hardware-dependent orders of magnitude. The ratios (RAM ≪ SSD ≪ cross-continent network) matter far more than the digits.',
            'Myth: "More estimates are better." Reality: compute only the numbers that change a design decision, then move on — the interview clock is ticking.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'The most expensive estimation mistake is a unit slip: mixing bits and bytes (8×), KB and MB (1,000×), or per day and per second (86,400×). Write units next to every number.',
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
            'URL Shortener: 100M writes and 10B redirects per day → ~1,160 write QPS and ~116K read QPS; 5 years = 182.5B records, which is why 7-character Base62 codes and a sharded store with a cache in front are chosen.',
            'News Feed: 300M DAU and reads ~100× writes → feed reads dominate, which justifies pre-computed feeds (fan-out on write) and a large feed cache.',
            'Video Streaming: 5B views per day ≈ 58K views per second, and multi-PB of processed video → view counters batched in Redis, a CDN for delivery and object storage for segments.',
            'Chat System: 500M DAU × 40 messages = 20B messages per day ≈ 230K writes per second, and ~50M concurrent connections ÷ ~50K per server ≈ 1,000 chat servers.',
            'Rate Limiter: the number of checks per second (one per API request) decides whether a single Redis (~100K operations per second) is enough or Redis Cluster is needed.',
          ],
        },
        {
          type: 'flow',
          title: 'Where estimates shape the designs in this app',
          code: `flowchart TB
  E["Back-of-the-envelope<br/>estimate"]:::highlight --> URL["URL Shortener<br/>~116K read QPS, 182.5B rows"]:::server
  E --> NF["News Feed<br/>reads ~100× writes"]:::server
  E --> VS["Video Streaming<br/>~58K views/s, PB storage"]:::server
  E --> CH["Chat System<br/>~230K msgs/s, ~1,000 servers"]:::server
  E --> RL["Rate Limiter<br/>checks/s vs ~100K ops per Redis"]:::server
  URL --> D1["Shard + cache"]:::db
  NF --> D2["Fan-out + feed cache"]:::cache
  VS --> D3["CDN + object storage"]:::network
  CH --> D4["WebSocket fleet"]:::network
  RL --> D5["Redis Cluster"]:::cache`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Interview recipe: spend ~3–5 minutes after clarifying requirements. Write assumptions, compute peak QPS, storage with replication, egress bandwidth and cache size, round aggressively, and finish every number with the design decision it drives.',
        },
      ],
    },
  ],
};
