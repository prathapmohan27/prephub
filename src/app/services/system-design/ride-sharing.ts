import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 9 — Ride-Sharing / Location Tracking (Uber-like)
// ─────────────────────────────────────────────────────────────────────────────
export const rideSharing: SystemDesignSystem = {
  id: 'ride-sharing',
  title: 'Ride-Sharing / Location Tracking',
  icon: 'ti-map-pin',
  color: '#0891b2',
  bg: '#e0f2fe',
  accentGlow: 'rgba(8,145,178,0.15)',
  difficulty: 'Advanced',
  tagline:
    'Geospatial indexing, real-time matching, WebSockets, and CQRS for high-throughput location updates.',
  tags: ['Geohash', 'Quadtree', 'CQRS', 'WebSockets', 'Real-time Matching'],
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
          text: "A ride-sharing platform like Uber or Lyft. Riders request rides and are matched with nearby available drivers. Drivers and riders see each other's real-time location. The system handles trip lifecycle from request through payment.",
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: picture a taxi dispatcher with a giant city map covered in pins, one per driver. Every few seconds each driver radios in "I am here now" and their pin moves. When a rider calls, the dispatcher looks only at the pins in the rider\'s neighbourhood, offers the job to the closest few drivers, and the first to say yes gets it — and is taken off the map so nobody else can book them.',
        },
        {
          type: 'flow',
          title: 'The big picture — a live map plus a matchmaker',
          code: `flowchart LR
  D([Drivers]):::client -->|"GPS every 4 s"| LS[Location Service]:::server
  LS --> MAP[(Live driver map<br/>Redis Geo)]:::cache
  R([Rider]):::client -->|"request ride"| MS[Matching Service]:::server
  MS -->|"who is near the pickup?"| MAP
  MS -->|"ride offer"| D
  D -->|"accept"| TS[Trip Service]:::server
  TS --> DB[(Trips DB)]:::db
  TS -->|"live updates"| R`,
          text: 'Two very different workloads: a firehose of tiny location writes (50K per second) and a smaller number of "find drivers near me" reads that must answer in under 2 seconds.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Riders can request a ride, specifying pickup and dropoff locations.',
            'The system matches the rider with the nearest available driver.',
            "Drivers and riders see each other's real-time location during matching and the trip.",
            'Trip fare is estimated before booking and charged after trip.',
            'Trip history is accessible to both drivers and riders.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1 million drivers, 5 million riders globally.',
            '200,000 concurrent trips at peak.',
            'Driver location updates: every 4 seconds while active.',
            'Matching latency: < 2 seconds (find nearest driver).',
            'Location update throughput: 200K drivers × 1 update/4sec = 50K location updates/second.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Geospatial Indexing — Geohash' },
        {
          type: 'paragraph',
          text: 'A geohash turns a map coordinate (latitude, longitude) into a short string like "dr5ru7". It works by repeatedly cutting the world map into a grid and noting which cell the point is in — each extra character zooms into a smaller cell. So nearby places usually share the same starting characters (prefix). Precision depends on length: 4 chars = ~40km × 20km, 6 chars = ~1.2km × 0.6km, 8 chars = ~38m × 19m.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `Location: Manhattan, NYC (40.7580° N, 73.9855° W)
Geohash 4 chars: "dr5r"     → ~40km × 20km cell
Geohash 6 chars: "dr5ru7"   → ~1.2km × 0.6km cell (good for driver search)
Geohash 8 chars: "dr5ru77s" → ~38m × 19m cell (very precise)

Nearby search: Find all drivers with geohash starting with "dr5ru7"
→ All drivers within ~600m of the user
→ Also check 8 neighboring geohash cells (to avoid border effects)`,
        },
        {
          type: 'flow',
          title: 'Geohash — zooming in one character at a time',
          code: `flowchart LR
  W["World"]:::client --> A["d<br/>eastern N. America"]:::server
  A --> B["dr5r<br/>~40 x 20 km"]:::server
  B --> C["dr5ru7<br/>~1.2 x 0.6 km"]:::highlight
  C --> D["dr5ru77s<br/>~38 x 19 m"]:::server
  C -.->|"search: same prefix<br/>+ 8 neighbour cells"| N[Drivers near the rider]:::cache`,
          text: 'Finding nearby drivers becomes a simple prefix lookup. The neighbour cells matter because a driver 50 m away can sit just across a cell border with a different prefix.',
        },
        { type: 'heading2', text: 'Geospatial Indexing — Quadtree' },
        {
          type: 'paragraph',
          text: 'A quadtree splits a map into four squares, then splits any square that is too crowded into four smaller squares, and so on. Each final (leaf) square holds a manageable number of drivers. Busy areas end up with many small squares and empty areas keep a few big ones, so it adapts to density. That makes it a better fit than geohash when density varies a lot (many drivers downtown, few in the suburbs).',
        },
        {
          type: 'flow',
          title: 'Quadtree — split only where it is crowded',
          code: `flowchart TB
  ROOT["Whole city<br/>too many drivers - split"]:::server --> NW["NW: suburbs<br/>12 drivers - leaf"]:::cache
  ROOT --> NE["NE: downtown<br/>3,000 drivers - split"]:::highlight
  ROOT --> SW["SW: park<br/>2 drivers - leaf"]:::cache
  ROOT --> SE["SE: suburbs<br/>40 drivers - leaf"]:::cache
  NE --> NE1["block A<br/>80 - leaf"]:::cache
  NE --> NE2["block B<br/>95 - leaf"]:::cache
  NE --> NE3["block C, D ...<br/>split further"]:::server`,
          text: 'Every leaf ends up holding roughly the same number of drivers, so a search always scans a small, predictable amount of data.',
        },
        { type: 'heading2', text: 'CQRS (Command Query Responsibility Segregation)' },
        {
          type: 'paragraph',
          text: 'CQRS means using separate paths for writing and reading. The write side handles commands ("driver 42 is now here") and is tuned for raw throughput — 50K updates per second. The read side answers queries ("which drivers are near this rider?") from its own data structure, a geospatial index built for fast proximity search. The read side is updated from the write side asynchronously, so it may be a second or two behind.',
        },
        {
          type: 'flow',
          title: 'CQRS — separate roads for writes and reads',
          code: `flowchart LR
  subgraph WRITE["Command side - many tiny writes"]
    D([Driver apps]):::client -->|"50K updates/s"| LS[Location Service]:::server
  end
  LS --> GEO[(Geo index<br/>Redis)]:::cache
  LS -.->|"location events"| K[[Kafka]]:::queue
  subgraph READ["Query side - fast lookups"]
    MS[Matching Service]:::server -->|"drivers near X?"| GEO
    K -.-> WS[WebSocket push<br/>to riders]:::network
    K -.-> AN[(Analytics<br/>driver paths)]:::db
  end`,
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
            'Location Service: Receives high-frequency driver location updates (50K/sec). Writes to Location Store and publishes to Kafka.',
            "Location Store: Redis geospatial index holding every driver's current location. A radius search costs O(N + log M), where N = drivers returned and M = total drivers — so it stays fast as the fleet grows.",
            'Matching Service: When a rider requests a ride, queries Location Store for nearby available drivers, applies matching algorithm, sends trip offer.',
            'Trip Service: Manages trip lifecycle (requested, matched, in-progress, completed). Stored in PostgreSQL.',
            'WebSocket Gateway: Keeps an always-open connection to every driver and rider app, so the server can push location updates and trip status changes instantly instead of the apps repeatedly asking.',
            'Driver App / Rider App: Mobile clients communicating via WebSocket for real-time and REST for non-real-time operations.',
            'Pricing Service: Calculates fare estimate and surge pricing based on supply/demand in each geographic area.',
            'Kafka: Event bus decoupling location updates from consumers (matching service, WebSocket gateway, analytics).',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
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
  TS --> WSG`,
          text: 'Apps talk over a persistent WebSocket for anything live and use plain REST for one-off actions such as requesting a ride.',
        },
        { type: 'heading2', text: 'Ride Request Flow' },
        {
          type: 'numbered',
          items: [
            'Rider opens app, sees nearby drivers on map (Location Service + WebSocket push).',
            'Rider requests ride: POST /api/trips {pickupLocation, dropoffLocation}',
            'Matching Service finds N nearest available drivers using Redis geo-search.',
            'Sends ride offer (via WebSocket) to top 3 candidates simultaneously (drivers have 15s to accept).',
            'First driver to accept is matched. Others are notified of cancellation.',
            "Both driver and rider see each other's real-time location via WebSocket.",
            'Trip completes → Fare calculated → Payment charged → Trip stored in DB.',
          ],
        },
        {
          type: 'flow',
          title: 'Ride request and matching',
          code: `sequenceDiagram
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
  end`,
          text: 'Offering to three drivers at once cuts waiting time. The atomic removal from the pool is what guarantees only one acceptance wins.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Redis Geospatial Index' },
        {
          type: 'code',
          lang: 'text',
          code: `# Store driver location
GEOADD drivers_available {lng} {lat} {driver_id}

# Find available drivers within 5km of rider
GEOSEARCH drivers_available FROMLONLAT {rider_lng} {rider_lat} BYRADIUS 5 km ASC COUNT 10
# (older Redis versions: GEORADIUS drivers_available {rider_lng} {rider_lat} 5 km ASC COUNT 10)

# Response: [driverId1 (0.8km), driverId2 (1.2km), ...]
# O(N+log M) — very fast even with 100K drivers`,
        },
        { type: 'heading2', text: 'Driver Location Update Flow (CQRS Write Side)' },
        {
          type: 'numbered',
          items: [
            'Driver app sends GPS coordinates every 4 seconds via WebSocket.',
            'WebSocket Gateway forwards to Location Service.',
            'Location Service writes to Redis (GEOADD — overwrites previous location).',
            'Location Service publishes event to Kafka: {driverId, lat, lng, timestamp}.',
            'Kafka consumers: (1) WebSocket Gateway pushes location to matched rider. (2) Analytics records driver path.',
          ],
        },
        {
          type: 'flow',
          title: 'One location update, end to end',
          code: `sequenceDiagram
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
  end`,
          text: 'Redis only ever holds the latest position per driver — the history lives in the analytics pipeline, not in the hot path.',
        },
        { type: 'heading2', text: 'Surge Pricing (Dynamic Pricing)' },
        {
          type: 'paragraph',
          text: "Surge pricing raises fares when there are more ride requests than drivers in an area. How it works: for each geohash cell, count ride requests and available drivers over the last 5 minutes (a sliding window). The surge multiplier is a function of demand ÷ supply. Each cell's multiplier is cached in Redis and recalculated every 30 seconds.",
        },
        {
          type: 'flow',
          title: 'Computing surge per area',
          code: `flowchart LR
  RQ[Ride requests<br/>per geohash cell]:::client --> W[5-min sliding<br/>window counts]:::server
  AV[Available drivers<br/>per geohash cell]:::client --> W
  W --> RATIO{demand / supply}
  RATIO -->|"at or below 1"| N1["1.0x - normal"]:::cache
  RATIO -->|"about 2"| N2["1.5x"]:::highlight
  RATIO -->|"3 or more"| N3["2.0x+"]:::security
  N1 & N2 & N3 --> RC[(Redis: surge per cell<br/>refreshed every 30 s)]:::cache`,
          text: 'Higher prices both reduce demand and attract nearby drivers into the busy cell, pulling supply and demand back into balance. (Thresholds shown are illustrative.)',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Location Update Scaling (50K/sec)' },
        {
          type: 'bullets',
          items: [
            'Redis handles 100K+ operations/second on a single node. 50K GEOADD operations/second is within capacity.',
            "Redis Cluster: Shard by geographic region (North America, Europe, Asia). Each region's drivers are a separate Redis cluster.",
            'Location Service scales horizontally — stateless workers consuming location updates via WebSocket.',
          ],
        },
        { type: 'heading2', text: 'WebSocket Connection Scaling' },
        {
          type: 'bullets',
          items: [
            '200K active trips × 2 connections (driver + rider) = 400K concurrent WebSocket connections.',
            'Plus offline drivers waiting for rides: 1M total connections.',
            'Each WebSocket server: ~50K connections. Need 20 servers.',
            'Service registry (like in chat system): Track which WebSocket server each driver/rider is connected to.',
          ],
        },
        {
          type: 'flow',
          title: 'Scaled-out architecture',
          code: `flowchart TB
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
  MS -->|"which server holds driver 42?"| REG`,
          text: 'Rides never cross regions, so each region gets its own Redis cluster. The registry lets any service find the right WebSocket server to push a message to a specific user.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Driver Availability Consistency' },
        {
          type: 'paragraph',
          text: 'Redis is the source of truth for which drivers are available. The moment a driver accepts a ride, they must be removed from the available pool (ZREM from the geo index — geo sets are sorted sets underneath). Otherwise a second rider could be matched to the same driver. The check "is this driver still available?" and the removal must happen as one atomic step, so wrap them (plus any ZADD to a busy set) in a Lua script — Redis runs a script start-to-finish without letting any other command in between, which prevents race conditions.',
        },
        {
          type: 'flow',
          title: 'Preventing double-booking',
          code: `sequenceDiagram
  participant M1 as Matcher for Rider 1
  participant M2 as Matcher for Rider 2
  participant R as Redis
  Note over M1,M2: Both want Driver A at the same moment
  M1->>R: Lua script: if A is available, remove A
  R-->>M1: OK - A is yours
  M2->>R: Lua script: if A is available, remove A
  R-->>M2: FAIL - A no longer available
  M2->>M2: Offer next-nearest driver`,
          text: 'Redis runs one script at a time, so the second matcher always sees the result of the first. No locks, no double-booking.',
        },
        { type: 'heading2', text: 'Trip State Machine' },
        {
          type: 'paragraph',
          text: 'Trips go through well-defined states: REQUESTED → MATCHED → DRIVER_EN_ROUTE → TRIP_IN_PROGRESS → COMPLETED (or CANCELLED at various stages). Each state change is saved to PostgreSQL before the app is told about it. If the system crashes mid-change, it simply resumes from the last saved state.',
        },
        {
          type: 'flow',
          title: 'Trip state machine',
          code: `stateDiagram-v2
  [*] --> REQUESTED: rider requests
  REQUESTED --> MATCHED: driver accepts
  REQUESTED --> CANCELLED: no driver found or rider cancels
  MATCHED --> DRIVER_EN_ROUTE: driver starts driving
  MATCHED --> CANCELLED: rider or driver cancels
  DRIVER_EN_ROUTE --> TRIP_IN_PROGRESS: rider picked up
  DRIVER_EN_ROUTE --> CANCELLED: cancel with fee
  TRIP_IN_PROGRESS --> COMPLETED: dropoff, fare charged
  COMPLETED --> [*]
  CANCELLED --> [*]`,
          text: 'Only these arrows are legal. Rejecting any other transition (for example COMPLETED back to MATCHED) protects against buggy or duplicated requests.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Matching Optimization' },
        {
          type: 'paragraph',
          text: 'Finding the nearest driver must complete in < 500ms. A Redis radius search (GEOSEARCH / GEORADIUS) with COUNT 10 returns the 10 nearest drivers in ~1ms. The matching algorithm then ranks those candidates by distance, driver rating, driver type (UberX, UberXL), and estimated time of arrival (ETA). For speed, the ETA here uses precomputed routing data rather than live traffic.',
        },
        {
          type: 'flow',
          title: 'Matching pipeline — under 500 ms',
          code: `flowchart LR
  REQ([Ride request]):::client --> GS[Redis geo search<br/>10 nearest, ~1 ms]:::cache
  GS --> F[Filter<br/>right car type]:::server
  F --> S[Score each candidate<br/>distance, rating, ETA]:::server
  S --> TOP[Top 3]:::highlight
  TOP --> OFF[Send offers<br/>via WebSocket]:::network`,
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Geohash vs. Quadtree vs. Redis Geo' },
        {
          type: 'bullets',
          items: [
            'Geohash: Simple prefix-based search. Known edge effects at cell boundaries (need to check 9 cells). Fixed cell size.',
            'Quadtree: Variable cell size adapts to density. More complex implementation.',
            'Redis Geo: Built-in geospatial commands using geohash internally. Easiest to use, production-ready. Best choice for most use cases.',
            'Google S2 / Uber H3: Advanced geospatial indexing for complex routing. Used when you need hierarchical spatial analytics.',
          ],
        },
        {
          type: 'flow',
          title: 'Choosing a geospatial index',
          code: `flowchart TD
  Q{What do you need?}
  Q -->|"Fast nearby search,<br/>minimal code"| RG[Redis Geo<br/>default choice]:::highlight
  Q -->|"Very uneven density,<br/>custom in-memory index"| QT[Quadtree]:::server
  Q -->|"Simple prefix keys<br/>in any database"| GH[Geohash]:::db
  Q -->|"Area analytics, surge zones,<br/>equal-size cells"| H3[Uber H3 / Google S2]:::external`,
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Privacy' },
        {
          type: 'bullets',
          items: [
            'Anonymize driver location when not on a trip (show approximate area, not exact position).',
            'Delete precise location history after trip completion (keep only start/end points for support).',
            'Comply with local regulations (GDPR, CCPA) for location data storage and retention.',
          ],
        },
        { type: 'heading2', text: 'ETA and Routing' },
        {
          type: 'paragraph',
          text: "Real-time ETA requires live traffic data, road conditions, and route optimization. For a full implementation, integrate with a routing engine (OSRM, Google Maps API, or Uber's own routing infrastructure). Pre-compute ETA for common routes and update based on real-time traffic events.",
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
            'How would you store and query driver locations efficiently?',
            'How do you match a rider to the nearest available driver?',
            'How do you handle the case where a driver is matched to multiple riders simultaneously?',
            'How do you push real-time location updates to both driver and rider apps?',
            'How would you implement surge pricing?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Redis Geo for location storage and radius search — O(N+log M).',
            'CQRS: separate high-throughput write path (location updates) from read path (proximity queries).',
            'Atomic driver state change: a Lua script that checks availability and removes the driver from the geo index in one step prevents double-booking.',
            'WebSocket for real-time location push — same pattern as chat system.',
            'Event sourcing for trip state — every state change is a persistent event.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through this design in an interview',
          code: `flowchart LR
  A[Clarify<br/>drivers, trips, update rate]:::client --> B[Estimate<br/>50K writes/s]:::client
  B --> C[Location store<br/>Redis Geo + CQRS]:::cache
  C --> D[Matching<br/>offers + atomic claim]:::highlight
  D --> E[Real-time push<br/>WebSockets]:::network
  E --> F[Trip states,<br/>surge, scaling]:::db`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The key insight in ride-sharing is the geospatial challenge. Knowing Redis GEO commands, geohash edge effects, and how to prevent double-matching (atomic Redis operations) sets you apart from candidates who only discuss high-level concepts.',
        },
      ],
    },
  ],
};
