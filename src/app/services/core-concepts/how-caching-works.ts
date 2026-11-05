import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 12 — How Caching Works
// ─────────────────────────────────────────────────────────────────────────────
export const howCachingWorks: CoreConcept = {
  id: 'how-caching-works',
  title: 'How Caching Works',
  emoji: '🧊',
  icon: 'ti-bolt',
  color: '#ef4444',
  bg: '#fee2e2',
  accentGlow: 'rgba(239,68,68,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Browser, CDN, Redis and buffer pool — how keeping copies close makes systems fast, and why invalidation is the hard part.',
  tags: ['HTTP Caching', 'CDN', 'Redis', 'Cache-Aside', 'Eviction', 'Invalidation'],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'A cache is a small, fast store that keeps copies of data you are likely to need again, so you do not have to fetch or compute it from the slow, authoritative source (the "source of truth", usually a database or an origin server) every time. Reading a cached copy is a cache hit. Not finding it — and having to go to the source — is a cache miss.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: caching is like keeping a water bottle on your desk instead of walking to the kitchen every time you are thirsty. The kitchen (the database) always has water, but the walk is slow. The bottle (the cache) is small and right next to you. The catch: the bottle can run empty (a miss), and if someone changes what comes out of the tap, the water in your bottle is now stale.',
        },
        {
          type: 'flow',
          title: 'The big picture — copies at every layer',
          code: `flowchart LR
  U([User]):::client --> BR["Browser cache<br/>0 ms"]:::cache
  BR -->|"miss"| CDN["CDN edge<br/>~10-30 ms"]:::cache
  CDN -->|"miss"| RP["Reverse proxy cache"]:::network
  RP -->|"miss"| APP["App server<br/>in-process cache"]:::server
  APP -->|"miss"| R[("Redis<br/>~0.5-1 ms")]:::cache
  R -->|"miss"| DB[("Database<br/>buffer pool + disk")]:::db`,
          text: 'A request walks inward only as far as it has to. Every layer that answers saves all the work behind it.',
        },
        { type: 'heading2', text: 'Why Caches Work at All: Locality' },
        {
          type: 'bullets',
          items: [
            'Temporal locality: something used now is likely to be used again soon (today’s trending product, your own profile).',
            'Skewed popularity: in most real systems a small fraction of items gets most of the traffic — often roughly 20% of keys serve 80% or more of reads. Caching just the hot set gives most of the benefit.',
            'Expensive to produce, cheap to copy: a page that takes 200 ms to render from 15 queries can be stored as one 40 KB blob and served in a millisecond.',
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
          text: 'Every layer of storage trades size for speed. Memory is tiny and fast, disks and networks are big and slow, and the gaps are enormous. Caching lets you serve most requests from the fast end while keeping the full data set on the slow end.',
        },
        { type: 'heading2', text: 'Latency Numbers Worth Remembering (rough orders of magnitude)' },
        {
          type: 'bullets',
          items: [
            'L1 CPU cache reference: ~1 ns.',
            'Main memory (RAM) reference: ~100 ns.',
            'Lookup in an in-process hash map: well under 1 µs.',
            'Redis GET inside the same data centre: roughly 0.2–1 ms (mostly network round trip).',
            'Random read from an SSD: roughly 0.1 ms (100 µs).',
            'Indexed database query over the network: roughly 1–10 ms; a heavy join or aggregate: 50 ms to seconds.',
            'Round trip from a user to a nearby CDN edge: roughly 10–30 ms.',
            'Round trip across an ocean to a far-away origin: roughly 100–250 ms.',
          ],
        },
        { type: 'heading2', text: 'Four Things a Cache Buys You' },
        {
          type: 'numbered',
          items: [
            'Lower latency: a 2 ms Redis hit instead of a 40 ms database query, or a 15 ms CDN hit instead of a 200 ms trip to the origin.',
            'Higher throughput at lower cost: one Redis node can handle on the order of 100,000+ simple operations per second; the same reads on a relational database would need several replicas.',
            'Protection for the backend: with a 95% hit ratio, the database sees only 1 in 20 reads. Traffic can grow 10x while the database barely notices.',
            'Resilience: some caches can keep serving slightly stale content when the origin is down (stale-if-error), turning an outage into a minor degradation.',
          ],
        },
        {
          type: 'flow',
          title: 'What a 95% hit ratio does to the database',
          code: `flowchart LR
  T(["10,000 reads/s"]):::client --> C{"Cache<br/>95% hit ratio"}:::cache
  C -->|"9,500 hits/s<br/>~1 ms each"| FAST([Fast responses]):::highlight
  C -->|"500 misses/s"| DB[("Database<br/>~20 ms each")]:::db
  DB -->|"fill cache"| C`,
          text: 'The database only has to handle the 5% of reads that miss. Average latency ≈ 0.95 × 1 ms + 0.05 × 21 ms ≈ 2 ms.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Every Cache Answers the Same Four Questions' },
        {
          type: 'numbered',
          items: [
            'Key: how do I name an entry? (a URL plus some headers, "product:42", a SQL page number)',
            'Fill: when does data get into the cache? (on a miss, on every write, or ahead of time)',
            'Freshness: how long is a copy trusted? (a TTL — time to live — or an explicit invalidation)',
            'Eviction: when the cache is full, what gets thrown out? (LRU, LFU, FIFO …)',
          ],
        },
        { type: 'heading2', text: 'HTTP Caching — Browser and CDN' },
        {
          type: 'paragraph',
          text: 'Browsers, CDNs and reverse proxies all follow the same HTTP caching rules (RFC 9111). The server attaches headers to a response saying who may store it and for how long. Within that time the copy is "fresh" and can be reused without asking the server. After that it is "stale" and must be revalidated — the cache asks the server "has this changed?" and gets back either a tiny 304 Not Modified or the new content.',
        },
        {
          type: 'bullets',
          items: [
            'Cache-Control: max-age=3600 → any cache may reuse this for 3600 seconds (1 hour).',
            'Cache-Control: s-maxage=600 → overrides max-age for shared caches only (CDNs, proxies). Lets the CDN keep it 10 minutes while browsers use max-age.',
            'Cache-Control: no-cache → you MAY store it, but must revalidate with the server before every reuse. It does NOT mean "do not cache".',
            'Cache-Control: no-store → do not store this anywhere, at all. Use for truly sensitive responses (bank statements, one-time tokens).',
            'Cache-Control: private → only the user’s own browser may store it; CDNs and shared proxies must not. public → shared caches may store it, even for requests that normally would not be cacheable (for example ones with an Authorization header).',
            'Cache-Control: immutable → this exact URL will never change, so do not even revalidate while fresh. Used with fingerprinted files like app.3f9a2c.js and max-age=31536000 (one year).',
            'stale-while-revalidate=60 → after expiry, a cache may serve the stale copy for up to 60 more seconds while it refreshes in the background.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'The most common HTTP caching mistake in interviews and in production: saying no-cache when you mean no-store. no-cache = "store it, but check with me before using it". no-store = "never write it down".',
        },
        { type: 'heading2', text: 'Validators: ETag and Last-Modified' },
        {
          type: 'paragraph',
          text: 'A validator lets a cache cheaply check whether its stale copy is still good. The server sends ETag: "v42-abc" (an opaque version fingerprint) and/or Last-Modified: a date. When the copy goes stale, the cache sends If-None-Match: "v42-abc" (or If-Modified-Since: that date). If nothing changed the server answers 304 Not Modified with no body — a few hundred bytes instead of the whole resource — and the cache marks its copy fresh again.',
        },
        {
          type: 'flow',
          title: 'Fresh, stale, and revalidation with ETag',
          code: `sequenceDiagram
  participant B as Browser cache
  participant S as Server
  B->>S: GET /api/product/42
  S-->>B: 200 OK, Cache-Control max-age=60, ETag "v7", 40 KB body
  Note over B: For 60 s the copy is fresh, reused with no request at all
  Note over B: After 60 s the copy is stale
  B->>S: GET /api/product/42, If-None-Match "v7"
  alt unchanged
    S-->>B: 304 Not Modified, no body
    Note over B: Copy is fresh again for 60 s
  else changed
    S-->>B: 200 OK, ETag "v8", new body
  end`,
          text: 'Revalidation still costs a round trip, but saves the bandwidth and the server work of producing the full response.',
        },
        { type: 'heading2', text: 'Application Caching — Cache-Aside' },
        {
          type: 'paragraph',
          text: 'Inside the backend, the most common pattern is cache-aside (also called lazy loading): the application checks the cache first; on a miss it reads the database, stores the result in the cache with a TTL, and returns it. On a write, it updates the database and then deletes the cache key so the next read reloads fresh data.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `async function getProduct(id: string): Promise<Product> {
  const key = \`product:v3:\${id}\`;

  // 1. Try the cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached); // HIT (~1 ms)

  // 2. MISS → go to the source of truth
  const product = await db.query('SELECT * FROM products WHERE id = $1', [id]);

  // 3. Fill the cache with a TTL (+ jitter so keys don't all expire together)
  const ttl = 300 + Math.floor(Math.random() * 60);
  await redis.set(key, JSON.stringify(product), 'EX', ttl);
  return product;
}

async function updatePrice(id: string, price: number) {
  await db.query('UPDATE products SET price = $1 WHERE id = $2', [price, id]);
  await redis.del(\`product:v3:\${id}\`); // invalidate — don't try to patch the cached copy
}`,
        },
        {
          type: 'flow',
          title: 'Cache-aside read and write paths',
          code: `flowchart TD
  R([Read product 42]):::client --> G{"GET product:42<br/>in Redis?"}:::cache
  G -->|"hit"| RET([Return cached value]):::highlight
  G -->|"miss"| Q[("SELECT from database")]:::db
  Q --> SET["SET product:42 with TTL"]:::cache
  SET --> RET
  W([Update price]):::client --> U[("UPDATE database")]:::db
  U --> DEL["DEL product:42"]:::cache`,
          text: 'Delete, don’t update: deleting the key after the database write is simpler and avoids writing a stale value back into the cache if two updates race.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'The Five Caching Patterns' },
        {
          type: 'bullets',
          items: [
            'Cache-aside (lazy loading): the app talks to both cache and database and fills the cache on a miss. Only requested data is cached; a cache outage just makes things slower. Downside: the first request for each key is slow, and there is a small window where cache and DB disagree.',
            'Read-through: the app only talks to the cache; the cache library itself loads from the database on a miss (e.g. a Caffeine LoadingCache, or a CDN pulling from origin). Same behaviour as cache-aside, but the loading logic lives in one place.',
            'Write-through: every write goes to the cache and the database in the same request. The cache is always warm and consistent for those keys, but writes are slower and you cache data nobody may ever read.',
            'Write-behind (write-back): the write lands in the cache and is acknowledged immediately; the cache flushes to the database later, often in batches. Fastest writes, absorbs bursts — but if the cache node dies before flushing, those writes are lost. Used for counters, metrics, view counts; rarely for money.',
            'Refresh-ahead: the cache reloads hot entries shortly before they expire (e.g. when 80% of the TTL has passed and the key is still being read), so popular keys never miss. Costs extra loads for keys that turn out not to be needed.',
          ],
        },
        {
          type: 'flow',
          title: 'Write-through vs write-behind',
          code: `sequenceDiagram
  participant App
  participant C as Cache
  participant DB as Database
  Note over App,DB: Write-through
  App->>C: SET price = 19.99
  C->>DB: UPDATE price = 19.99
  DB-->>C: OK
  C-->>App: OK (after both writes)
  Note over App,DB: Write-behind
  App->>C: INCR views
  C-->>App: OK (immediately)
  Note over C: buffer many updates
  C->>DB: flush batch every few seconds`,
          text: 'Write-through pays the database latency on every write. Write-behind hides it — at the price of a durability gap.',
        },
        {
          type: 'flow',
          title: 'Refresh-ahead keeps hot keys from ever missing',
          code: `flowchart LR
  REQ([Read hot key]):::client --> C{"Key age vs TTL"}:::cache
  C -->|"under 80% of TTL"| SERVE([Serve from cache]):::highlight
  C -->|"over 80% of TTL"| BOTH["Serve cached value<br/>and trigger async reload"]:::cache
  BOTH -.->|"background"| DB[("Database")]:::db
  DB -.->|"new value, new TTL"| C`,
        },
        { type: 'heading2', text: 'Eviction — What Gets Thrown Out When Memory Is Full' },
        {
          type: 'bullets',
          items: [
            'LRU (Least Recently Used): drop the entry not touched for the longest time. The default almost everywhere; implemented with a hash map plus a doubly linked list for O(1) get and put. Redis uses an approximated LRU (allkeys-lru) by sampling a few keys rather than keeping a perfect list.',
            'LFU (Least Frequently Used): drop the entry with the fewest hits. Better when popularity is stable over long periods; resists one-off scans that would flush an LRU cache. Redis offers allkeys-lfu with decaying counters so old popularity fades.',
            'FIFO: drop the oldest inserted entry regardless of use. Simple and cheap, usually a worse hit ratio.',
            'TTL-based expiry: every entry has a deadline and is removed (or treated as stale) after it. Not really an eviction policy — it is about freshness — but in practice most caches combine a TTL with LRU or LFU.',
            'Modern hybrids (W-TinyLFU in Caffeine, ARC, 2Q) mix recency and frequency and typically beat plain LRU on real workloads.',
          ],
        },
        {
          type: 'flow',
          title: 'LRU in action — capacity 3',
          code: `flowchart LR
  S1["get A, B, C<br/>order: C B A"]:::cache --> S2["get A<br/>order: A C B"]:::cache
  S2 --> S3["put D, cache full<br/>evict B (least recent)"]:::highlight
  S3 --> S4["order: D A C"]:::cache`,
          text: 'Reading A moved it to the front, so B — untouched the longest — is the one evicted when D arrives.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'The Cache Layers, Outside In' },
        {
          type: 'bullets',
          items: [
            'Browser HTTP cache: memory and disk cache inside each user’s browser, controlled by Cache-Control, ETag and Last-Modified. Private to one user. Fastest possible hit — no network at all.',
            'Service worker cache: a script the site installs in the browser that intercepts requests and answers from the Cache Storage API. The app decides the strategy (cache-first, network-first, stale-while-revalidate). Powers offline support in PWAs.',
            'CDN edge cache: hundreds of shared caches near users (Cloudflare, CloudFront, Fastly, Akamai). Honours s-maxage and public/private, and supports purging by URL or tag.',
            'Reverse proxy cache: Nginx proxy_cache, Varnish, or the gateway in front of your app servers. A shared cache inside your own data centre, often for rendered HTML or API responses.',
            'In-process (local) cache: a hash map with eviction inside each app server process (Caffeine, Guava, node-lru-cache). Nanoseconds to read, but each server has its own copy, so they can disagree and memory is duplicated.',
            'Distributed cache: a separate cluster shared by all app servers — Redis (rich data types, persistence options, replication) or Memcached (simple, multi-threaded key-value). ~1 ms over the network, one shared copy.',
            'Database caches: the buffer pool keeps hot 8 KB pages in RAM (see How Databases Work); the OS page cache sits below it. MySQL’s old query cache was removed in 8.0 because invalidating it on every write hurt more than it helped — a lesson in itself.',
          ],
        },
        {
          type: 'flow',
          title: 'Local cache vs distributed cache',
          code: `flowchart TB
  subgraph LOCAL["In-process caches - one per server"]
    A1["App 1<br/>local map"]:::server
    A2["App 2<br/>local map"]:::server
    A3["App 3<br/>local map"]:::server
  end
  subgraph SHARED["Distributed cache - one shared copy"]
    R[("Redis cluster")]:::cache
  end
  A1 --> R
  A2 --> R
  A3 --> R
  R -->|"miss"| DB[("Database")]:::db`,
          text: 'Many systems use both: a tiny local cache with a few seconds of TTL for the hottest keys (L1), backed by Redis (L2), backed by the database.',
        },
        { type: 'heading2', text: 'Redis vs Memcached at a Glance' },
        {
          type: 'bullets',
          items: [
            'Data model: Redis — strings, hashes, lists, sets, sorted sets, streams. Memcached — strings only.',
            'Threads: Redis executes commands on a single main thread (with I/O threads in newer versions). Memcached is multi-threaded and scales across cores on one box.',
            'Durability: Redis can snapshot (RDB) or log (AOF) to disk and replicate. Memcached is purely in-memory.',
            'Typical choice: Redis by default; Memcached when you need a dead-simple, very large, multi-threaded blob cache.',
          ],
        },
        { type: 'heading2', text: 'Cache Keys' },
        {
          type: 'paragraph',
          text: 'The cache key decides what counts as "the same request". A CDN’s default key is usually host + path + query string. If a response differs by language or encoding, the server must say so with the Vary header (Vary: Accept-Encoding, Accept-Language) or the CDN may serve German HTML to a French user. Too many key variations (for example including a tracking query parameter like utm_source) fragments the cache and kills the hit ratio; good CDNs let you normalise or strip those.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Put a version in application cache keys — product:v3:42. When the cached shape changes in a deploy, bump to v4 and old entries simply age out instead of crashing the new code.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'An E-commerce Product Page, Layer by Layer' },
        {
          type: 'paragraph',
          text: 'A shopper in Berlin opens shop.example.com/p/42 (a pair of running shoes). The origin runs in us-east. The page is built from: static JS/CSS/images, an HTML shell, a product JSON API (name, description, price, stock), and a personalised part (cart count, "recommended for you"). Each part gets a different caching policy.',
        },
        {
          type: 'numbered',
          items: [
            'Static assets (app.8d1f.js, shoe-42.webp): fingerprinted filenames, Cache-Control: public, max-age=31536000, immutable. On a repeat visit the browser uses its own copy — 0 ms, no request. On a first visit the Frankfurt CDN edge serves them in roughly 15–25 ms.',
            'HTML shell: Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=60. Browsers always revalidate, the CDN keeps it 5 minutes. A CDN hit costs roughly 20 ms instead of a roughly 120 ms trip to us-east plus render time.',
            'Product API GET /api/products/42: s-maxage=60 at the CDN. On a CDN miss the request crosses the Atlantic (~90–120 ms round trip) to the API.',
            'The API checks Redis (key product:v3:42). A hit costs roughly 1 ms. A miss runs 3 SQL queries (product, variants, reviews summary) — roughly 25–40 ms — then stores the result with a 5-minute TTL.',
            'Stock level is cached for only 10 seconds, because overselling is expensive. The final "add to cart" and checkout always read the database directly, inside a transaction.',
            'Cart count and recommendations: Cache-Control: private, no-cache (or fetched client-side), never stored at the CDN. Recommendations are cached per user in Redis for a few minutes.',
          ],
        },
        {
          type: 'flow',
          title: 'Product page — where each part is served from',
          code: `flowchart LR
  B([Browser in Berlin]):::client -->|"assets: 0 ms, own cache"| BC["Browser cache"]:::cache
  B -->|"HTML + product API"| E["CDN edge Frankfurt<br/>~20 ms"]:::cache
  E -->|"miss only, ~100 ms"| API["API in us-east"]:::server
  API -->|"~1 ms"| R[("Redis")]:::cache
  R -.->|"miss, ~30 ms"| DB[("PostgreSQL")]:::db
  B -->|"cart: private, never at CDN"| API`,
        },
        { type: 'heading2', text: 'What the Numbers Add Up To' },
        {
          type: 'bullets',
          items: [
            'Best case (everything hit at the edge, repeat visitor): roughly 20–40 ms for HTML and API, assets free.',
            'CDN miss, Redis hit: roughly 20 ms + 100 ms trans-Atlantic + 1 ms Redis + a few ms app time ≈ 130 ms.',
            'CDN miss, Redis miss: ≈ 160 ms+ and three database queries.',
            'With a 90% CDN hit ratio and a 95% Redis hit ratio, only 0.1 × 0.05 = 0.5% of product reads ever reach PostgreSQL.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'When the merchant changes the price, the system writes to PostgreSQL, deletes product:v3:42 in Redis, and sends a CDN purge for the tag product-42. Without that purge the CDN could show the old price for up to s-maxage (60 s) — so decide per field how much staleness the business can tolerate.',
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
          title: 'At a glance — a read falling through the cache layers',
          code: `flowchart TB
  C([Client]):::client -->|"1. fresh copy?"| BC["Browser cache"]:::cache
  BC -->|"2. miss or stale"| CDN["CDN edge"]:::cache
  CDN -->|"3. miss"| APP["App server + local cache"]:::server
  APP -->|"4. miss"| RD[("Redis")]:::cache
  RD -->|"5. miss"| DB[("Database + buffer pool")]:::db
  DB -->|"6. fill every layer on the way back"| C`,
          text: 'The step cards below describe what each layer stores, for how long, and how it is invalidated.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-caching-layers',
            title: 'Multi-Layer Caching Architecture for a Product Page',
            subtitle:
              'How a read traverses browser cache, CDN edge, application cache, Redis and the database — and how each layer is kept fresh',
            nodes: [
              {
                id: 'browser-cache',
                name: 'Browser HTTP Cache & Service Worker',
                subtitle: 'Private, Per-User Cache',
                type: 'client',
                icon: 'ti-browser',
                badge: 'L0: Browser',
                protocol: 'Cache-Control / ETag',
                details: [
                  'Fingerprinted assets cached for a year with immutable — zero requests on repeat visits',
                  'Stale entries revalidated with If-None-Match → 304 Not Modified (no body)',
                  'Holds private responses (cart, profile) that shared caches must never store',
                ],
              },
              {
                id: 'cdn-edge',
                name: 'CDN Edge Point of Presence',
                subtitle: 'Shared Cache Close to Users',
                type: 'network',
                icon: 'ti-cloud',
                badge: 'L1: Edge',
                protocol: 's-maxage / purge',
                details: [
                  'Cache key = host + path + normalised query + Vary headers',
                  'Serves HTML shell and public API responses in roughly 10–30 ms',
                  'Invalidated by TTL expiry or an explicit purge by URL or surrogate tag',
                ],
              },
              {
                id: 'app-local-cache',
                name: 'Application Server In-Process Cache',
                subtitle: 'Per-Instance Memory Map',
                type: 'server',
                icon: 'ti-server',
                badge: 'L2: Local',
                protocol: 'Caffeine / LRU map',
                details: [
                  'Sub-microsecond reads for the very hottest keys (config, feature flags, top products)',
                  'Short TTL (a few seconds) because each instance can drift from the others',
                  'Request coalescing ensures one database load per key per instance',
                ],
              },
              {
                id: 'redis-cluster',
                name: 'Distributed Cache (Redis Cluster)',
                subtitle: 'Shared Across All App Servers',
                type: 'cache',
                icon: 'ti-bolt',
                badge: 'L3: Redis',
                protocol: 'GET / SET EX',
                details: [
                  'Cache-aside: GET, on miss load from DB, SET with jittered TTL',
                  'Writes delete the key after the database commit',
                  'allkeys-lru or allkeys-lfu eviction when maxmemory is reached',
                ],
              },
              {
                id: 'database-layer',
                name: 'Database with Buffer Pool',
                subtitle: 'Source of Truth',
                type: 'database',
                icon: 'ti-database',
                badge: 'Origin',
                protocol: 'SQL',
                details: [
                  'Only sees the small fraction of reads that missed every layer above',
                  'Its own buffer pool caches hot pages in RAM — the last cache before disk',
                  'All writes land here first; caches are copies, never the authority',
                ],
              },
            ],
            connections: [
              {
                from: 'browser-cache',
                to: 'cdn-edge',
                label: '1. Miss or Stale → Request',
                protocol: 'HTTPS',
              },
              {
                from: 'cdn-edge',
                to: 'app-local-cache',
                label: '2. Edge Miss → Origin Fetch',
                protocol: 'HTTPS',
              },
              {
                from: 'app-local-cache',
                to: 'redis-cluster',
                label: '3. Local Miss → Shared Cache',
                protocol: 'RESP over TCP',
              },
              {
                from: 'redis-cluster',
                to: 'database-layer',
                label: '4. Redis Miss → Query + Fill',
                protocol: 'SQL',
              },
            ],
            keyTakeaways: [
              'Each layer trades freshness for speed differently: the closer to the user, the faster the hit but the harder it is to invalidate.',
              'Hit ratios multiply: 90% at the CDN and 95% in Redis means only 0.5% of reads reach the database.',
              'Writes always go to the source of truth first; caches are then invalidated (delete key, purge CDN), never treated as the authority.',
            ],
            rawSpec: `GET /p/42 from Berlin

[Browser cache]  assets: immutable, 1 year   → hit: 0 ms
      │ miss / stale
      ▼
[CDN edge FRA]   HTML s-maxage=300, API s-maxage=60 → hit: ~20 ms
      │ miss (~100 ms trans-Atlantic)
      ▼
[App server]     local LRU, TTL 5 s           → hit: < 1 µs
      │ miss
      ▼
[Redis]          product:v3:42, TTL 300 ± 60 s → hit: ~1 ms
      │ miss
      ▼
[PostgreSQL]     3 queries, buffer pool        → ~30 ms

Write path: UPDATE DB → DEL product:v3:42 → CDN purge tag product-42`,
          },
        },
      ],
    },
    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Why Invalidation Is Hard' },
        {
          type: 'paragraph',
          text: '"There are only two hard things in computer science: cache invalidation and naming things." A cache is a copy, and the moment the original changes, every copy is wrong until something fixes it. The difficulty comes from: copies in many places (thousands of browsers you cannot reach), derived data (one product change affects the product page, category listing and search results), and races between concurrent reads and writes.',
        },
        {
          type: 'bullets',
          items: [
            'TTL expiry: simplest. Accept up to TTL seconds of staleness. Pick the TTL per data type based on how wrong you can afford to be.',
            'Explicit delete on write: after the database write, delete the cache key. Fast convergence for keys you can name.',
            'Event-driven invalidation: the database change stream (CDC, e.g. Debezium reading the write-ahead log) publishes events and a consumer deletes affected keys. Catches writes from every service, not just one code path.',
            'Versioned keys or URLs: never change data under an existing key — write to a new key (app.8d1f.js, product:v3:42@rev17). Old copies become unreachable rather than wrong.',
            'Tag-based purge at the CDN: label responses with surrogate keys (product-42, category-shoes) and purge everything carrying a tag in one call.',
          ],
        },
        {
          type: 'flow',
          title: 'The race that leaves a stale value in cache-aside',
          code: `sequenceDiagram
  participant R as Reader
  participant C as Redis
  participant DB as Database
  participant W as Writer
  R->>C: GET product:42
  C-->>R: miss
  R->>DB: SELECT price
  DB-->>R: 10 (old)
  W->>DB: UPDATE price = 12
  W->>C: DEL product:42
  R->>C: SET product:42 = 10
  Note over C: stale 10 stays until the TTL expires`,
          text: 'The reader loaded the old value just before the write and stored it just after the delete. Short TTLs bound the damage; some teams delete twice (once more a moment later) or use versioned values to reject older writes.',
        },
        { type: 'heading2', text: 'Cache Stampede (Thundering Herd)' },
        {
          type: 'paragraph',
          text: 'A very hot key expires — say the homepage feed, read 20,000 times a second. In the next 50 ms, a thousand requests all miss at once and all run the same expensive query against the database, which can tip it over. Defences:',
        },
        {
          type: 'bullets',
          items: [
            'Request coalescing (single-flight): within a process, only the first miss for a key actually loads it; the others wait for and share that one result. CDNs do the same ("collapsed forwarding").',
            'Distributed lock: SET lock:key NX EX 5 in Redis — whoever gets the lock rebuilds the value; everyone else briefly waits or serves the old value.',
            'Stale-while-revalidate: keep serving the expired value while one background task refreshes it. Users see slightly stale data instead of a slow page.',
            'Jittered TTLs: add randomness (300 s ± 60 s) so keys written together do not all expire together.',
            'Probabilistic early refresh: each reader has a small, increasing chance of refreshing the key as it nears expiry, so one request refreshes it early.',
          ],
        },
        {
          type: 'flow',
          title: 'Stampede vs single-flight',
          code: `flowchart LR
  subgraph NO["Without protection"]
    direction TB
    M1(["1,000 misses"]):::client --> D1[("1,000 identical queries")]:::db
  end
  subgraph YES["With single-flight"]
    direction TB
    M2(["1,000 misses"]):::client --> SF{"First caller loads,<br/>others wait"}:::highlight
    SF -->|"1 query"| D2[("Database")]:::db
    D2 --> SHARE(["Result shared with all 1,000"]):::cache
  end`,
        },
        { type: 'heading2', text: 'Hot Keys, Penetration, and Avalanche' },
        {
          type: 'bullets',
          items: [
            'Hot key: one key (a celebrity profile, a flash-sale item) gets so much traffic that the single Redis shard holding it saturates, even though the cluster is idle. Fixes: a short-TTL local cache in front of Redis, or replicate the key under several names (item:42#1 … item:42#8) and read a random copy.',
            'Cache penetration: requests for keys that do not exist (id=-1, random IDs from a bot) always miss and always hit the database. Fixes: negative caching — store "not found" with a short TTL (e.g. 60 s) — and a Bloom filter of valid IDs that rejects impossible keys before any lookup.',
            'Cache avalanche: a large fraction of the cache disappears at once — a Redis node restarts empty, or a bulk load set the same TTL on a million keys. The database receives the full read load it was never sized for. Fixes: jittered TTLs, replicas and persistence for the cache, warming the cache before taking traffic, and rate limiting or circuit breakers in front of the database.',
          ],
        },
        {
          type: 'flow',
          title: 'Stopping cache penetration',
          code: `flowchart TD
  Q([GET product 99999999]):::client --> BF{"Bloom filter:<br/>could this ID exist?"}:::security
  BF -->|"definitely not"| NF([404 immediately, no DB]):::highlight
  BF -->|"maybe"| C{"In cache?"}:::cache
  C -->|"hit, incl. cached not-found"| RET([Return]):::client
  C -->|"miss"| DB[("Database")]:::db
  DB -->|"found: cache 5 min<br/>not found: cache 60 s"| C`,
          text: 'A Bloom filter can say "definitely not" or "maybe", never a false "no", so it never wrongly blocks a real product.',
        },
        { type: 'heading2', text: 'Hit Ratio and Sizing' },
        {
          type: 'paragraph',
          text: 'Hit ratio = hits ÷ (hits + misses). Redis exposes keyspace_hits and keyspace_misses in INFO stats; CDNs report it per URL pattern. Track it alongside eviction rate and p99 latency. A falling hit ratio with rising evictions means the cache is too small for the working set (the data actually being read in a period). To size: estimate the hot set (e.g. 2 million active products × 4 KB ≈ 8 GB), add room for overhead and growth (×1.5–2), and confirm with real hit-ratio curves — going from 8 GB to 16 GB may only lift hit ratio from 94% to 96%.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Measure hit ratio by request volume, not by key count, and per key prefix. A 99% overall hit ratio can hide a 40% hit ratio on the one endpoint that is hammering the database.',
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
            'Myth: "Cache-Control: no-cache disables caching." Reality: no-cache allows storing but requires revalidation before every use. no-store is the one that forbids storing.',
            'Myth: "Adding a cache always makes things faster." Reality: a cache with a low hit ratio adds a network hop to every request and makes misses slower. Caching data that is read once, or changes on every read, is pure overhead.',
            'Myth: "The cache can be the source of truth." Reality: caches evict, restart and lose data. Unless it is designed as a durable store, always be able to rebuild every key from the database.',
            'Myth: "Just update the cache on write." Reality: updating (rather than deleting) the cached copy invites races where an older write lands last. Deleting the key and letting the next read reload it is safer.',
            'Myth: "Personalised pages can’t use a CDN." Reality: split the page — cache the shared shell and public data at the edge, and fetch the personalised fragment separately with Cache-Control: private.',
            'Myth: "A longer TTL is always better." Reality: TTL is a business decision about how stale data may be. A year is perfect for a fingerprinted JS file and dangerous for a stock count.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'What not to cache in shared caches: anything personalised or sensitive — account pages, carts, auth tokens, responses that depend on cookies — unless marked private and kept in the user’s own browser. A misconfigured CDN serving one user’s account page to another is a real, recurring class of data leak. Mark such responses Cache-Control: private (or no-store for truly sensitive data).',
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
            'In interviews, place caches deliberately and name the pattern: "CDN for static assets and public HTML, Redis cache-aside in front of the product DB with a 5-minute jittered TTL, invalidate on write." Then state the staleness you are accepting.',
            'Distributed Cache system design: covers how a Redis/Memcached-style cluster itself is built — consistent hashing, replication, quorum, gossip. This lesson is about using caches; that one is about building one.',
            'News Feed system design: precomputed timelines stored in a cache (fan-out on write) are a cache of an expensive query; celebrity accounts are the classic hot-key problem.',
            'URL Shortener system design: an extremely read-heavy key → URL lookup where a cache-aside layer with LRU absorbs nearly all redirects.',
            'How Databases Work: the buffer pool is the database’s own cache, and read replicas are the other way to scale reads when caching is not enough.',
            'How a Website is Served: shows where the CDN and reverse proxy sit in the serving path; this lesson explains what they keep and for how long.',
          ],
        },
        {
          type: 'flow',
          title: 'Choosing a caching strategy',
          code: `flowchart TD
  Q1{"Same for every user?"} -->|"no, personalised"| P["Cache-Control private<br/>or per-user Redis key"]:::security
  Q1 -->|"yes"| Q2{"Does the content ever change<br/>at the same URL?"}
  Q2 -->|"never, fingerprinted"| IM["max-age 1 year + immutable<br/>browser + CDN"]:::highlight
  Q2 -->|"yes"| Q3{"How stale may it be?"}
  Q3 -->|"seconds to minutes"| CDN["CDN s-maxage + Redis TTL<br/>+ purge on write"]:::cache
  Q3 -->|"must be exact"| DB[("Read from the database<br/>e.g. checkout, balances")]:::db`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'A strong interview answer on caching always covers four things: what is cached and where, how it gets filled, how it is invalidated (and the staleness you accept), and what happens on failure — stampedes, hot keys, and a cold or empty cache.',
        },
      ],
    },
  ],
};
