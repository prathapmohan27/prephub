import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM — Search Autocomplete
// ─────────────────────────────────────────────────────────────────────────────
export const searchAutocomplete: SystemDesignSystem = {
  id: 'search-autocomplete',
  title: 'Search Autocomplete',
  icon: 'ti-search',
  color: '#0d9488',
  bg: '#ccfbf1',
  accentGlow: 'rgba(13,148,136,0.15)',
  difficulty: 'Intermediate',
  tagline: 'Tries with precomputed top-K, offline index builds, and millisecond read paths.',
  tags: ['Trie', 'Top-K', 'Data Pipeline', 'Edge Caching', 'Read-Heavy'],
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
          text: 'The backend behind a search box that suggests completions as you type, like Google, Amazon or YouTube search. After every few keystrokes the client sends the current prefix (e.g. "how to b") and gets back the 5–10 most popular full queries that start with it ("how to boil eggs", "how to buy bitcoin", ...).',
        },
        {
          type: 'callout',
          variant: 'info',
          text: "In simple terms: imagine a librarian who, every night, reads yesterday's list of everything people searched for and writes a cheat sheet: for every possible beginning of a question, the 10 most common ways people finished it. During the day she never thinks — she just reads the right line off the cheat sheet. All the hard work happens offline; answering is a lookup.",
        },
        {
          type: 'flow',
          title: 'The big picture — answer from a precomputed index, rebuild it offline',
          code: `flowchart LR
  U([User types 'how to b']):::client -->|"GET /suggest?q=how to b"| S[Suggestion Service]:::server
  S -->|"lookup prefix"| IDX[("In-memory index<br/>prefix → top 10")]:::cache
  S -->|"top 10 completions"| U
  U -.->|"final search is logged"| LOG[[Query logs]]:::queue
  LOG -.-> AGG[Aggregate + rank<br/>offline]:::server
  AGG -.->|"new index snapshot"| IDX`,
          text: 'Two loops at very different speeds: the read path answers in a few milliseconds from memory; the build path turns search logs into a fresh index every hour or so.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Given a prefix, return the top-K (K = 5–10) suggested queries that start with it.',
            'Rank suggestions by popularity (how often the query is searched), with a boost for fresh/trending queries.',
            'Suggestions must never include offensive, illegal or blocked terms.',
            'Support multiple languages and Unicode input (accents, CJK, emoji-free normalisation).',
            'Optional: personalised suggestions (your own recent searches), light typo tolerance.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Very low latency — suggestions should appear in under ~100 ms end-to-end, otherwise they arrive after the user has typed the next letter. After network and rendering, the server budget is only ~10–20 ms at P99.',
            'Very high read QPS — every search produces several suggestion requests.',
            'High availability, but suggestions are a nice-to-have: failing quietly is better than blocking typing.',
            'Eventual consistency is fine — a new popular query can take minutes to hours to show up.',
            'Relevance — results should be useful, safe and not stale for days.',
          ],
        },
        { type: 'heading2', text: 'Back-of-the-Envelope Estimates' },
        {
          type: 'bullets',
          items: [
            'Users: 10M DAU, each doing ~10 searches/day → 100M searches/day.',
            'Requests per search: an average query is ~20 characters, but the client debounces and skips repeats, so assume ~6 suggestion requests per search → 600M requests/day.',
            'Average QPS: 600M ÷ 86,400 s ≈ 6,900 QPS (call it ~7K).',
            'Peak QPS: assume 3× average → ~21K QPS. Without debouncing (one request per keystroke) it would be 2B/day ≈ 23K average and ~70K peak — debouncing alone cuts load by ~3×.',
            'Log volume: 100M searches × ~100 bytes per log record ≈ 10 GB/day (~3.6 TB/year raw, before compression).',
            'Index size: keep only queries searched at least a few times — say 10M distinct queries of ~20 characters. Worst case 10M × 20 = 200M trie nodes; prefix sharing typically brings it to ~50M. At ~100 bytes per node (children map + top-10 list of 4-byte query IDs) that is ~5 GB typical, ~20 GB worst case.',
            'Conclusion: the whole index fits in RAM on one machine, so we can replicate it rather than shard it at first. ~21K peak QPS ÷ ~5K QPS per server (with headroom) ≈ 5 servers, plus spares per region.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'See the Back-of-the-Envelope Estimation core concept for the method. The key insight to say out loud: "the index fits in memory, so the read path is a pure in-memory lookup and the real problem is building the index, not storing it."',
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'The Trie (Prefix Tree)' },
        {
          type: 'paragraph',
          text: 'A trie stores strings character by character: each node is one character, and the path from the root to a node spells a prefix. All queries starting with "tr" live under the same node, so finding the prefix node costs O(L) where L is the prefix length — independent of how many queries exist.',
        },
        {
          type: 'flow',
          title: 'A small trie with top-3 cached at every node',
          code: `flowchart TD
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
  TR -.- KTR["top-3 for 'tr':<br/>true, try, tree"]:::cache`,
          text: 'Highlighted nodes are complete queries with their search counts. The dotted notes show the precomputed top-K list stored on each node, which is what makes reads fast.',
        },
        { type: 'heading2', text: 'Why Naive DFS Per Request Is Too Slow' },
        {
          type: 'paragraph',
          text: 'The textbook approach is: walk to the prefix node, then DFS the whole subtree to collect every complete query, sort by count and return the top K. For a long prefix that is fine, but for a one- or two-letter prefix like "s" the subtree contains millions of queries. Visiting millions of nodes per keystroke at 21K QPS is impossible within a 10 ms budget — and short prefixes are exactly the most frequent requests.',
        },
        {
          type: 'flow',
          title: 'Naive DFS vs precomputed top-K',
          code: `flowchart TB
  subgraph NAIVE["Naive - work at read time"]
    N1([prefix 's']):::client --> N2[Walk to node 's'<br/>O of L]:::server
    N2 --> N3[DFS millions of<br/>descendant queries]:::security
    N3 --> N4[Sort, take top 10]:::server
  end
  subgraph CACHED["Top-K at every node - work at build time"]
    C1([prefix 's']):::client --> C2[Walk to node 's'<br/>O of L]:::server
    C2 --> C3([Return stored top-10<br/>O of K]):::highlight
  end`,
          text: 'Precomputing moves the cost from every request (millions per second) to the offline build (once an hour). Reads become O(L + K) — a few microseconds.',
        },
        { type: 'heading2', text: 'Ranking: Popularity, Freshness and Trending' },
        {
          type: 'bullets',
          items: [
            'Popularity: how many times a query was searched over a window (e.g. the last 30 days).',
            "Freshness via time decay: older searches count less. A common form is score = Σ count_in_bucket × 0.5^(age / half_life), e.g. half-life of 7 days. Last week's spike fades instead of dominating for a month.",
            'Trending: a query whose last-hour rate is far above its normal baseline (e.g. 10× its 7-day hourly average) gets a temporary boost — this is how breaking news shows up within minutes.',
            "Optional personalisation: blend in the user's own recent searches or signals like location and language at serve time (see Interview Perspective).",
            'The ranking ideas are similar to the News Feed design: start with a hand-tuned formula, move to a learned model once you have click-through data.',
          ],
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Time-decayed popularity: recent searches weigh more than old ones
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
}`,
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
            'Client: debounces keystrokes, caches responses and cancels stale requests (see the frontend autocomplete answer).',
            'CDN / edge cache: caches responses for popular short prefixes for a few minutes.',
            'Load Balancer + API Gateway: routes /suggest requests, applies rate limiting.',
            'Suggestion Service: stateless-looking but holds a read-only, in-memory copy of the index; answers a prefix lookup in microseconds.',
            'Query Log pipeline: the search service emits one event per completed search to Kafka.',
            'Aggregators: a batch job (hourly/daily) computes popularity counts; a streaming job (Flink/Kafka Streams) detects trending queries.',
            'Index Builder: filters, ranks and builds a new trie/prefix table snapshot, then publishes it to object storage.',
            'Snapshot Store (S3/GCS) + Index Registry: versioned snapshots and a pointer to the current one.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
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
  OBJ -.->|"load + swap"| S1 & S2`,
          text: 'The read path (top) never touches a database. The write path (bottom) is fully asynchronous — Suggestion Services just pick up a new snapshot when one is ready.',
        },
        { type: 'heading2', text: 'Read Path — Serving a Suggestion' },
        {
          type: 'numbered',
          items: [
            'User types; the client waits for a short pause (debounce) and sends GET /v1/suggest?q=how%20to%20b&lang=en&k=10.',
            'The CDN answers directly if this prefix is cached (common for 1–3 character prefixes).',
            'On a miss, the load balancer forwards to any Suggestion Service replica.',
            'The service normalises the prefix (lowercase, Unicode NFKC, collapse spaces), walks the in-memory trie and reads the stored top-K.',
            'Optionally it merges personal recent searches and re-checks the blocklist, then returns JSON with a short Cache-Control max-age.',
          ],
        },
        {
          type: 'flow',
          title: 'Read path — one keystroke',
          code: `sequenceDiagram
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
  C-->>U: render dropdown`,
          text: 'No database, no network hop beyond the service itself: the server-side work is microseconds, so latency is dominated by the network.',
        },
        { type: 'heading2', text: 'Write Path — Building the Index' },
        {
          type: 'numbered',
          items: [
            'Every completed search (not every keystroke) is logged as {query, timestamp, lang, region, userId-hash}.',
            'Batch job aggregates counts per (query, lang) per hour; daily it rolls up into a decayed popularity score.',
            'Stream job keeps sliding-window counts and flags trending queries within minutes.',
            'Index Builder merges both, drops rare queries (count below a threshold) and blocked terms, then builds the trie with top-K at each node.',
            'The snapshot is written to object storage with a version number; the registry pointer is flipped after validation.',
            'Suggestion Services download the new snapshot, load it beside the old one, and atomically swap.',
          ],
        },
        {
          type: 'flow',
          title: 'Data pipeline — logs to snapshot',
          code: `flowchart LR
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
  V -->|No| KEEP[Keep serving v41]:::external`,
          text: 'Building is the expensive part, and it runs off the critical path. If anything looks wrong, the old snapshot simply keeps serving.',
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
          code: `GET /v1/suggest?q=how%20to%20b&lang=en&k=10
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

POST /v1/search-events  { "query": "how to boil eggs", "selectedSuggestion": true }`,
        },
        { type: 'heading2', text: 'Trie with Top-K at Every Node' },
        {
          type: 'paragraph',
          text: "The implementation below builds the trie offline from (query, count) pairs, fills each node's top-K bottom-up with one post-order DFS, and serves a prefix in O(L + K). An add() method shows incremental updates for counts that only increase; anything that lowers a count (decay, removal) is handled by the next full rebuild.",
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `type Suggestion = { query: string; count: number };

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

  // Online increment (counts only go UP): update topK along the path, O(L · K)
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

// ── Usage ──
const trie = AutocompleteTrie.build(
  [['tree', 10], ['try', 29], ['true', 35], ['toy', 14], ['win', 50], ['wish', 25]],
  3,
);
trie.suggest('t');   // ['true', 'try', 'toy']
trie.suggest('TR');  // ['true', 'try', 'tree']   (normalised)
trie.suggest('x');   // []
trie.add('toy', 30); // toy is now 44
trie.suggest('t');   // ['toy', 'true', 'try']`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "Why the bottom-up build is cheap: each node only merges its children's already-trimmed top-K lists, so building is roughly O(nodes × K) instead of re-scanning every subtree. Production builders store 4-byte query IDs instead of strings in each top-K list to save memory.",
        },
        { type: 'heading2', text: 'Alternative: Prefix Hash Table' },
        {
          type: 'paragraph',
          text: 'Since every node stores its full answer anyway, you can flatten the trie into a plain key-value map: prefix → top-K list. "t" → [true, try, toy], "tr" → [true, try, tree], and so on. Lookup is a single hash get, and it drops straight into Redis, DynamoDB or a static file per shard. The cost is storage: every prefix of every query is a key (~200M keys in our estimate), and the top-K lists are duplicated rather than shared. Cap the prefix length (e.g. 20 characters) to bound it.',
        },
        { type: 'heading2', text: 'Other Options' },
        {
          type: 'bullets',
          items: [
            'Sorted array + binary search: sort all queries alphabetically; the completions of a prefix form one contiguous range found by two binary searches. Very compact, but you still need the top-K of that range — so combine with a precomputed top-K for short prefixes, or a range-max structure.',
            'Search engine: Elasticsearch/OpenSearch offer an edge n-gram analyzer (index "t", "tr", "tre"... as tokens) and a completion suggester (an in-memory FST). Great when you also need fuzziness, filters per category and you already run a cluster; less control over latency than a purpose-built in-process trie.',
            'Hybrid: a trie or prefix table for the global top-K, plus a small per-user store for personalised recent searches merged at serve time.',
          ],
        },
        { type: 'heading2', text: 'Snapshot Build and Atomic Swap (Blue/Green)' },
        {
          type: 'paragraph',
          text: 'The serving index is immutable. Instead of mutating a live trie under concurrent reads (locks, partial states), each server loads the new snapshot into a second buffer while the old one keeps serving, validates it, then flips a single reference. In-flight requests finish on the old index; new requests see the new one. Rolling back is flipping the pointer back.',
        },
        {
          type: 'flow',
          title: 'Blue/green index swap on a server',
          code: `sequenceDiagram
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
  end`,
          text: 'Roll out to a canary group first. "Golden prefix" checks compare a few hundred known prefixes against expected results to catch broken builds.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Replicate First, Shard Later' },
        {
          type: 'paragraph',
          text: 'At ~5–20 GB the index fits on one machine, so the simplest scalable design is full replication: every Suggestion Service holds the whole index and any replica can answer any prefix. Read QPS scales linearly by adding replicas. Shard only when the index outgrows a machine — many languages, regional indexes, or much larger vocabularies.',
        },
        { type: 'heading2', text: 'Sharding by Prefix' },
        {
          type: 'bullets',
          items: [
            'Naive range sharding by first letter (a–f, g–m, ...) is badly unbalanced: far more queries start with "s" or "c" than with "x" or "q", in both data size and traffic.',
            'Better: compute split points from the real distribution of queries and traffic, e.g. one shard for "sa–sh", another for "si–sz", while "u–z" share a shard. Store the range map in the registry and rebalance at each build.',
            'For a prefix hash table, hash sharding on the full prefix key spreads keys evenly, but very hot single keys ("a", "s") still need replication or edge caching.',
            'A request router (or the gateway) looks up the shard for the prefix; each shard has several replicas for throughput and availability.',
          ],
        },
        {
          type: 'flow',
          title: 'Sharding by prefix ranges sized by traffic',
          code: `flowchart TB
  RQ([GET suggest q='sho']):::client --> RT[Shard router<br/>range map from registry]:::network
  RT -->|"'a'-'c'"| S1[Shard 1]:::server
  RT -->|"'sa'-'sh'"| S2[Shard 2 - hot]:::highlight
  RT -->|"'si'-'sz'"| S3[Shard 3 - hot]:::highlight
  RT -->|"'t'-'z'"| S4[Shard 4]:::server
  S2 --- R2A[(replica)]:::cache
  S2 --- R2B[(replica)]:::cache
  S3 --- R3A[(replica)]:::cache`,
          text: 'Splitting by traffic, not by alphabet, keeps each shard equally busy. Hot ranges also get extra replicas.',
        },
        { type: 'heading2', text: 'Caching Layers' },
        {
          type: 'bullets',
          items: [
            'Browser/app cache: the client keeps responses keyed by prefix for the session; backspacing to "ho" never hits the network again.',
            'CDN edge: short prefixes are few and extremely hot — there are only 26³ ≈ 17.6K three-letter Latin prefixes. Caching them with max-age of a few minutes absorbs a large share of global traffic.',
            'Redis (optional): when the index lives in a separate store (prefix hash table), a Redis cluster in front absorbs the hot keys — see the Distributed Cache design.',
            "Personalised responses must be marked Cache-Control: private, or the CDN will show one user's history to another.",
            'Short TTLs are acceptable because suggestions tolerate staleness; trending queries just appear a few minutes later at the edge.',
          ],
        },
        {
          type: 'flow',
          title: 'Each layer absorbs traffic before the next',
          code: `flowchart LR
  K([21K peak req/s]):::client --> BC[Browser cache<br/>repeat prefixes]:::cache
  BC -->|"remaining"| CDN[CDN edge<br/>hot short prefixes]:::network
  CDN -->|"long-tail prefixes"| SVC[Suggestion replicas<br/>in-memory trie]:::server
  SVC -.->|"only for personalised"| P[(Per-user<br/>recent searches)]:::db`,
          text: 'How much each layer absorbs depends on your traffic shape — measure hit ratios per layer rather than assuming. See How Caching Works for TTL and invalidation basics.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Fail Fast, Fail Silent' },
        {
          type: 'paragraph',
          text: 'Autocomplete is an enhancement: the user can always press Enter and search. So the worst outcome is not "no suggestions" — it is a slow suggestion service that makes typing feel laggy or blocks the search box. Every layer should time out quickly and return an empty list rather than wait.',
        },
        {
          type: 'bullets',
          items: [
            'Tight timeouts: gateway → service timeout of ~50 ms; client ignores responses that arrive after the user typed more.',
            'Return empty or partial results on error with HTTP 200, so the client just hides the dropdown.',
            'Circuit breaker for optional dependencies (personalisation store): if it is slow, serve global suggestions only.',
            'Serve stale over nothing: the CDN can use stale-while-revalidate / stale-if-error to keep serving cached prefixes during an outage.',
            'Load shedding: under overload, drop requests for long prefixes first (rarely cached, lower value) and keep short prefixes flowing.',
          ],
        },
        {
          type: 'flow',
          title: 'Degrading gracefully',
          code: `flowchart TD
  REQ([Suggest request]):::client --> E{CDN has it?<br/>even stale}
  E -->|Yes| OK([Return suggestions]):::highlight
  E -->|No| S{Service answers<br/>within 50 ms?}
  S -->|Yes| P{Personalisation<br/>store healthy?}
  P -->|Yes| OK
  P -->|"No - breaker open"| G[Global top-K only]:::server --> OK
  S -->|"No - slow or down"| EMPTY([Empty list, hide dropdown<br/>user keeps typing]):::external`,
          text: 'Every failure path ends in a fast response. Users rarely notice missing suggestions; they always notice a laggy text box.',
        },
        { type: 'heading2', text: 'Stale Data Is Acceptable' },
        {
          type: 'bullets',
          items: [
            'If the pipeline fails, servers keep the last good snapshot. Suggestions an hour or a day old are still useful.',
            'Alert when the snapshot age exceeds a threshold (e.g. > 6 hours), but do not page for a single failed build.',
            'Keep the last N snapshots in object storage so a bad build can be rolled back in seconds.',
            'New replicas boot by downloading the current snapshot; mark them ready only after it is loaded (readiness probe).',
          ],
        },
        { type: 'heading2', text: 'Pipeline Reliability' },
        {
          type: 'bullets',
          items: [
            'Kafka retains query logs for several days, so a crashed aggregator can replay and recompute.',
            "Batch jobs are idempotent: recomputing an hour's counts overwrites the same output partition.",
            'Builds are validated before publish (size within ±20% of the last build, golden prefixes, no blocked terms) so a corrupt input never reaches users.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Latency Budget' },
        {
          type: 'paragraph',
          text: 'The ~100 ms target is for the whole round trip as the user perceives it. Most of it is spent outside our servers, which is why the server must be very fast and why edge caching matters so much.',
        },
        {
          type: 'flow',
          title: 'Where the 100 ms goes',
          code: `flowchart LR
  A["Debounce wait<br/>~50-150 ms, by design"]:::client --> B["Network RTT<br/>~20-60 ms"]:::network
  B --> C["LB + routing<br/>~1-2 ms"]:::network
  C --> D["Trie lookup<br/>microseconds"]:::highlight
  D --> E["Serialise + send<br/>~1 ms"]:::server
  E --> F["Render dropdown<br/>~5-10 ms"]:::client`,
          text: 'Server P99 target: under ~10 ms. Edge caching removes most of the network leg for popular prefixes; serving from the nearest region removes the rest.',
        },
        { type: 'heading2', text: 'Making the Read Path Fast' },
        {
          type: 'bullets',
          items: [
            'Keep the index in process memory — no network hop to a database or even Redis on the hot path.',
            'Compact representation: store query IDs instead of strings in top-K lists, use arrays instead of hash maps for children, or a compressed trie (radix tree) that merges single-child chains.',
            "Pre-serialise: store each node's top-K as ready-to-send JSON bytes to skip serialisation work.",
            'Limit the indexed prefix length (e.g. 20–30 characters): longer prefixes are rare and can fall back to a slower search.',
            'Serve from multiple regions so users are close to a replica.',
          ],
        },
        { type: 'heading2', text: 'Client Side (Briefly)' },
        {
          type: 'paragraph',
          text: 'The frontend owns a big share of the load and the perceived speed: debouncing, dropping repeated queries, cancelling stale requests, caching by prefix and accessible keyboard navigation. Those details are covered in the Frontend System Design answer "How would you design an autocomplete (type-ahead) search component?" — here we only assume the client sends a debounced prefix and tolerates empty responses.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Trie vs Prefix Hash Table vs Search Engine' },
        {
          type: 'bullets',
          items: [
            'In-memory trie: smallest memory thanks to shared prefixes, microsecond reads, full control. But: custom code, the index must fit in one process (or you shard), and it is rebuilt rather than updated.',
            'Prefix hash table (prefix → top-K): dead simple, works with any KV store, easy to shard by hash. But: more storage (every prefix is a key with its own list) and still needs an offline builder.',
            'Search engine (edge n-grams, completion suggester): fuzzy matching, filters and multi-field ranking out of the box. But: another cluster to run, higher and less predictable latency, less control over ranking.',
            'Reasonable default for an interview: trie or prefix table built offline, served from memory, with a search engine mentioned for fuzzy/typo-tolerant needs.',
          ],
        },
        { type: 'heading2', text: 'Batch Rebuild vs Real-Time Updates' },
        {
          type: 'bullets',
          items: [
            'Batch (hourly/daily snapshots): simple, consistent, easy to validate and roll back, no write locks on the serving path. But: new queries appear with a delay.',
            'Real-time (update counts in place): freshest results. But: concurrent writes on a hot read structure, lock contention, and decay or removals are hard to do incrementally.',
            'Hybrid (recommended): batch snapshot for the long-term popular set plus a small streaming "trending" overlay that is merged at serve time and refreshed every minute.',
          ],
        },
        {
          type: 'flow',
          title: 'Hybrid freshness — merge a small fast layer at serve time',
          code: `flowchart LR
  BS[("Base snapshot<br/>rebuilt hourly")]:::db --> M[Merge + re-rank<br/>top-K]:::server
  TL[("Trending overlay<br/>refreshed every minute")]:::cache --> M
  PU[("Personal recent searches<br/>optional")]:::cache --> M
  M --> OUT([Final top 10]):::highlight`,
          text: 'The big structure changes slowly and safely; the small overlays carry everything that must be fresh.',
        },
        { type: 'heading2', text: 'Precomputing Top-K vs Computing on Read' },
        {
          type: 'paragraph',
          text: 'Precomputing top-K at every node costs memory (K entries per node) and makes K a build-time constant — asking for 20 results when you built with 10 is not possible without a rebuild. Computing on read keeps memory small but is too slow for short prefixes. Build with a slightly larger K than the UI shows (e.g. 15 for a 10-item dropdown) so serve-time filtering and personal merging still leave enough results.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Filtering Offensive and Blocked Terms' },
        {
          type: 'bullets',
          items: [
            'Filter at build time: drop queries that match a blocklist, a toxicity classifier, or legal takedown lists, so they never enter the index.',
            'Filter again at serve time with a small, hot-reloadable blocklist, so an urgent removal takes effect in seconds without waiting for the next build.',
            'Suggestions are a product statement: a search engine "suggesting" something defamatory or harmful is far worse than the user typing it. Be conservative on short prefixes and names of people.',
            'Never suggest queries containing personal data (emails, phone numbers, addresses) — strip them in the pipeline.',
            "Require a minimum number of distinct users per query (not just raw count) so one person or a bot cannot push a phrase into everyone's suggestions.",
          ],
        },
        {
          type: 'flow',
          title: 'Two filters — slow and thorough, fast and urgent',
          code: `flowchart LR
  Q[Candidate queries]:::server --> F1{"Build-time filter<br/>blocklist, classifier,<br/>PII, min distinct users"}:::security
  F1 -->|"pass"| IDX[(Snapshot)]:::db
  F1 -->|"drop"| X1[Excluded]:::external
  IDX --> F2{"Serve-time filter<br/>hot blocklist"}:::security
  F2 -->|"pass"| U([Shown to user]):::highlight
  F2 -->|"drop"| X2[Hidden immediately]:::external`,
          text: 'The serve-time list is tiny and reloads in seconds; the build-time filter does the heavy, careful work.',
        },
        { type: 'heading2', text: 'Multi-Language and Unicode' },
        {
          type: 'bullets',
          items: [
            'Normalise consistently at build and query time: Unicode NFKC, case folding, collapse whitespace. Decide whether accents fold ("cafe" matches "café").',
            'Keep separate indexes per language/locale (or a language field in the key) — "pain" means bread in French.',
            'CJK languages have no spaces and use input methods (IME); index by character and consider pinyin/romanised variants. The client should not send requests mid-composition.',
            'Trie children keyed by Unicode code point (not UTF-16 unit) avoid splitting characters.',
          ],
        },
        { type: 'heading2', text: 'Typo Tolerance (Briefly)' },
        {
          type: 'paragraph',
          text: "A plain prefix trie only matches exact prefixes. Options: map common misspellings to the correct prefix at build time, search a bounded edit distance (1 typo) in the trie for longer prefixes only, or delegate to a search engine's fuzzy completion suggester. Keep it out of the hot path for 1–3 character prefixes, where it adds cost and little value.",
        },
        { type: 'heading2', text: 'Abuse and Rate Limiting' },
        {
          type: 'bullets',
          items: [
            'Rate limit /suggest per IP or per session at the gateway (see the Rate Limiter design) — it is a cheap endpoint, so scrapers love it.',
            'Bots trying to poison suggestions: count distinct users, discount repeated identical searches, and exclude traffic flagged as automated from the pipeline.',
          ],
        },
        { type: 'heading2', text: 'Monitoring' },
        {
          type: 'bullets',
          items: [
            'Serving: P50/P99 latency, QPS, error and timeout rate, empty-result rate, CDN hit ratio.',
            'Quality: suggestion click-through rate, keystrokes saved per search, share of searches that used a suggestion.',
            'Pipeline: snapshot age, build duration, build size delta, number of blocked terms filtered.',
          ],
        },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Perspective',
      icon: 'ti-message-2-question',
      blocks: [
        { type: 'heading2', text: 'How to Scope It' },
        {
          type: 'bullets',
          items: [
            'Clarify: global suggestions only, or personalised too? How many results (K)? Languages? How fresh must trending queries be?',
            'Clarify the split: "I\'ll focus on the backend — the index, ranking pipeline and serving. I\'ll assume the client debounces and caches."',
            'State the core insight early: reads are huge and latency-critical, writes can be offline and delayed — so precompute everything.',
          ],
        },
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'What data structure would you use, and what is the lookup complexity?',
            'Why not just DFS the trie on every request?',
            'How do you keep suggestions up to date with new and trending queries?',
            'How do you update the index without affecting live traffic?',
            'How would you shard the index, and what happens with hot prefixes like "s"?',
            'How do you stop offensive or harmful suggestions?',
          ],
        },
        { type: 'heading2', text: 'Likely Follow-Ups' },
        {
          type: 'bullets',
          items: [
            '"Add personalisation." → Keep a small per-user store of recent searches (Redis, TTL of a few weeks); merge with global top-K at serve time; mark responses private so the CDN never caches them.',
            '"Show breaking news within minutes." → Streaming aggregation with sliding windows and a trending overlay merged at serve time, rather than rebuilding the whole trie.',
            '"Support 20 languages." → Per-locale indexes, consistent Unicode normalisation, possibly shard by language first, then by prefix.',
            '"What about privacy of query logs?" → Hash or drop user IDs early, strip PII from queries, only index queries searched by many distinct users (k-anonymity style threshold), set a retention period on raw logs, and honour deletion requests.',
            '"The suggestion service is down — what does the user see?" → Nothing breaks: the dropdown stays empty and search still works.',
            '"Typo tolerance?" → Misspelling map at build time or a fuzzy completion suggester for longer prefixes.',
          ],
        },
        {
          type: 'flow',
          title: 'A 45-minute walkthrough',
          code: `flowchart LR
  A[Scope<br/>K, freshness, languages]:::client --> B[Estimate<br/>~7K avg, ~21K peak QPS]:::client
  B --> C[Trie + top-K<br/>per node]:::highlight
  C --> D[Offline pipeline<br/>logs to snapshot]:::queue
  D --> E[Serve from memory<br/>replicas + CDN]:::server
  E --> F[Hot prefixes, filters,<br/>fallbacks, trade-offs]:::db`,
        },
        { type: 'heading2', text: 'Common Mistakes Candidates Make' },
        {
          type: 'bullets',
          items: [
            "Querying a database with LIKE 'prefix%' on every keystroke — too slow and wasteful at this QPS.",
            'Describing a trie without precomputed top-K, then being unable to explain the latency for one-letter prefixes.',
            'Updating the live index on every search instead of building snapshots offline.',
            'Logging every keystroke as a "search" — only completed searches should feed popularity.',
            'Forgetting filtering of offensive terms and privacy of query logs.',
            'Making the search box wait for suggestions instead of failing silently.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The winning story is short: "Precompute top-K per prefix offline from query logs, ship it as an immutable snapshot, serve it from memory behind a CDN, and fail silently." Related designs worth reviewing: Distributed Cache (hot keys), News Feed (ranking), Rate Limiter (protecting the endpoint), plus the How Caching Works and Back-of-the-Envelope Estimation core concepts.',
        },
      ],
    },
  ],
};
