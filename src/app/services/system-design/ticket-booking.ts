import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM — Ticket Booking & Flash Sales
// ─────────────────────────────────────────────────────────────────────────────
export const ticketBooking: SystemDesignSystem = {
  id: 'ticket-booking',
  title: 'Ticket Booking & Flash Sales',
  icon: 'ti-ticket',
  color: '#e11d48',
  bg: '#ffe4e6',
  accentGlow: 'rgba(225,29,72,0.15)',
  difficulty: 'Advanced',
  tagline:
    'Seat holds with expiry, row locks vs conditional updates, virtual waiting rooms, and never double-selling a seat during a flash sale.',
  tags: ['Concurrency Control', 'Seat Holds', 'Virtual Waiting Room', 'Flash Sales', 'Idempotency'],
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
          text: 'A ticketing platform like Ticketmaster or BookMyShow. Users browse concerts, matches and movie shows, open a seat map, pick seats, get a few minutes to pay, and receive tickets. Most of the year traffic is calm. Then a superstar tour goes on sale and millions of people arrive within minutes for ~50,000 seats. The system must stay up, treat people fairly, and above all never sell the same seat twice.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: picture a theatre box office on the morning a famous band announces a show. A doorman lets people into the lobby a few at a time so the counter is not crushed. At the counter, the clerk puts a "reserved" card on the seats you point at — you have ten minutes to pay or the card is taken off and the seats go back on sale. The clerk\'s seating chart is the only truth: two people can point at the same seat, but only one card can ever be placed on it.',
        },
        {
          type: 'flow',
          title: 'The big picture — from "On sale now" to a ticket in your inbox',
          code: `flowchart LR
  U([Millions of fans]):::client --> WR[Virtual waiting room<br/>admits a few per second]:::security
  WR -->|"signed admission token"| BK[Booking Service]:::server
  BK -->|"hold seats 10 min"| INV[(Seat inventory<br/>source of truth)]:::db
  BK --> PAY[Payment System]:::external
  PAY -->|"paid"| BK
  BK -->|"HELD to SOLD"| INV
  BK -.-> N[[Tickets + email]]:::queue`,
          text: 'Two very different problems hide in one product: a correctness problem (one seat, one buyer) and a traffic problem (a wall of users arriving at the same second). The waiting room solves the second so the database only has to solve the first.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Browse and search events (concerts, sports, movie shows) by city, date and venue.',
            'View an interactive seat map with live-ish availability per section and seat.',
            'Hold one or more seats (max 4–8 per order) for a limited time, e.g. 10 minutes, while the user pays.',
            'Also support "best available" (system picks seats) and general-admission (GA) events that sell a quantity, not specific seats.',
            'Pay for held seats and receive confirmed tickets (email, app wallet).',
            'Released holds (timeout or cancel) return seats to sale automatically.',
            'For high-demand on-sales: a virtual waiting room that admits users in a fair, controlled order.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Correctness first: a seat is never sold twice (oversell = 0), and a user is never charged without getting a ticket (or a refund).',
            'Survive flash crowds: 2M users (up to 10M for the biggest artists) arriving within ~5 minutes of on-sale.',
            'Hold request latency p99 < 500 ms for admitted users; seat map loads < 1 s.',
            'Availability display may be a few seconds stale (eventual consistency), but the hold decision must be strongly consistent.',
            'Fairness: earlier arrivals are generally served earlier; bots and scalpers must not crowd out real fans.',
            'Normal days: thousands of events, modest steady traffic — the design must not cost flash-sale money all year.',
          ],
        },
        { type: 'heading2', text: 'Back-of-the-Envelope Estimates' },
        {
          type: 'code',
          lang: 'text',
          code: `One mega on-sale: 50,000 seats, average 2.5 tickets per order
→ 50,000 / 2.5 = 20,000 successful orders

Arrivals: 2M users in the first 5 minutes (300 s)
→ 2,000,000 / 300 ≈ 6,700 new users/s   (10M users → ≈ 33,000/s)
→ 2M / 20,000 orders = 100 users per order — 99% will go home empty-handed

Waiting-room polling: each waiting user checks status every 15 s
→ 2,000,000 / 15 ≈ 133,000 req/s       (10M users → ≈ 667,000 req/s)
→ must be served from a CDN / edge cache, never from the booking DB

Without a waiting room: 2M users clicking "hold" in the first minute
→ 2,000,000 / 60 ≈ 33,000 hold attempts/s, all fighting over the same front rows

With a waiting room admitting 100 users/s:
→ 6,000 admitted/min; ~50% complete a purchase → 3,000 orders/min
→ 20,000 / 3,000 ≈ 7 minutes to sell out
→ shoppers inside at once = 100/s × 180 s avg checkout = 18,000
→ hold transactions ≈ 100/s × 2 attempts = 200 tx/s  (one PostgreSQL primary is plenty)
→ seat-map refreshes: 18,000 shoppers / 5 s = 3,600 req/s (cache-served)

Storage: 1 seat row ≈ 200 bytes → 50,000 seats ≈ 10 MB per event
Platform: 100,000 events/year × 5,000 seats avg = 500M seat rows ≈ 100 GB/year
Seat availability as a bitmap: 2 bits/seat × 50,000 = 12,500 bytes ≈ 12.5 KB`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'The headline number is not the 2M users — it is the 200 hold transactions per second left after the waiting room. Inventory is tiny (10 MB); the challenge is contention and spike absorption, not data volume. Say this out loud in an interview: it justifies a single relational primary per event instead of an exotic database.',
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'The Seat Inventory Model' },
        {
          type: 'paragraph',
          text: 'Every sellable seat for every event is one row: (event, section, row, seat number, price, status). Status is one of AVAILABLE, HELD or SOLD. A HELD seat also stores who holds it (hold_id, user), and when the hold runs out (hold_expires_at). A version number increases on every change, which makes optimistic concurrency possible. The venue layout (where seat A-12-7 is drawn) is static and shared by all events at that venue; only status is per event.',
        },
        {
          type: 'flow',
          title: 'Life of a seat',
          code: `stateDiagram-v2
  [*] --> AVAILABLE: event published
  AVAILABLE --> HELD: user holds seat (expires in 10 min)
  HELD --> AVAILABLE: user cancels or hold expires
  HELD --> SOLD: payment captured + confirm
  SOLD --> AVAILABLE: refund / exchange (rare, back-office)
  SOLD --> [*]: event over`,
          text: 'Every arrow is a conditional write: "move to HELD only if it is still AVAILABLE (or its hold has expired)". That one rule is what prevents double selling.',
        },
        { type: 'heading2', text: 'Why Double Booking Happens: Check-Then-Act' },
        {
          type: 'paragraph',
          text: 'The naive code reads the seat ("is it available?"), then writes it ("mark it held"). Between the read and the write, another request can do the same read and see the same answer. Both writes succeed, both users are told the seat is theirs. This is a classic race condition, and in a flash sale where thousands of people click the same front-row seat within milliseconds, it is not rare — it is guaranteed.',
        },
        {
          type: 'flow',
          title: 'The race — two users, one seat',
          code: `sequenceDiagram
  participant A as Alice request
  participant B as Bob request
  participant DB as Seats table
  A->>DB: SELECT status of A-12-7
  B->>DB: SELECT status of A-12-7
  DB-->>A: AVAILABLE
  DB-->>B: AVAILABLE
  A->>DB: UPDATE set HELD by Alice
  B->>DB: UPDATE set HELD by Bob
  Note over DB: Bob overwrote Alice - both think they own the seat
  Note over A,B: Fix - make the check and the write ONE atomic step`,
          text: 'Every fix in this lesson is a way to collapse "check" and "act" into one indivisible operation that the database (or Redis) arbitrates.',
        },
        { type: 'heading2', text: 'Hold → Pay → Confirm (a Two-Step Reservation)' },
        {
          type: 'paragraph',
          text: 'Payment takes seconds to minutes (card entry, 3-D Secure, bank latency), far too long to keep a database transaction open. So booking is split into two short transactions with a timed reservation in between. Step 1 (hold): atomically flip seats AVAILABLE → HELD with an expiry. Step 2 (confirm): after the payment succeeds, atomically flip HELD → SOLD, but only if the hold still belongs to this user. If the user walks away, the hold expires and the seats return to sale. This is the same "reserve, then capture" idea used for card pre-authorisations in the Payment System design.',
        },
        { type: 'heading2', text: 'The Virtual Waiting Room' },
        {
          type: 'paragraph',
          text: 'You cannot scale your way out of 33,000 hold attempts per second on the same few hundred rows — the contention is on data, not servers. Instead, put a queue in front: everyone who arrives gets a place in line, and an admission controller lets people into the booking flow at a rate the inventory system can handle (e.g. 100 users/s). Admitted users carry a short-lived signed token that the booking API checks. It turns a stampede into an orderly line, gives users honest feedback ("You are number 48,213 — about 8 minutes"), and is the natural place to stop bots.',
        },
        {
          type: 'flow',
          title: 'Waiting room — turn a spike into a steady stream',
          code: `flowchart LR
  F([2M fans in 5 min]):::client --> Q[Queue position<br/>assigned at the edge]:::security
  Q --> L[(Line<br/>now serving #N)]:::cache
  AC[Admission controller<br/>about 100 users/s]:::highlight -->|"advance #N"| L
  L -->|"your turn: signed token"| BK[Booking flow<br/>18K shoppers inside]:::server
  BK --> DB[(Inventory DB<br/>about 200 tx/s)]:::db`,
          text: 'The waiting room is cheap to scale (mostly static, edge-cached responses). The inventory database is expensive to scale. Shift the load from the second to the first.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Related reading: How Message Queues Work (a queue absorbs a burst and lets consumers work at their own pace — the waiting room is the same idea applied to people), How Scaling Works (why adding servers does not fix contention on a single hot row), and the Rate Limiter design (per-user and per-IP limits that sit in front of all this).',
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
            'CDN / Edge: Serves the web app, venue layouts (seat coordinates, SVG maps) and cached availability snapshots. Also hosts the waiting-room status endpoint so queue polling never reaches origin.',
            'Waiting Room Service: Issues queue positions, runs the admission controller, and mints signed admission tokens. Only switched on for high-demand on-sales.',
            'API Gateway: TLS termination, authentication, rate limiting per user/IP, and admission-token verification for booking endpoints.',
            'Event Catalog Service: Events, venues, prices, search. Read-heavy, cached aggressively (Distributed Cache design), backed by a search index.',
            'Inventory / Booking Service: Owns seat state. Places holds, releases holds, confirms sales. The only component allowed to write seat rows.',
            'Inventory DB (PostgreSQL): Seats, holds, orders, tickets — sharded by event_id, synchronous standby for failover. The source of truth.',
            'Redis: Fast hold pre-check (SET NX with TTL), availability bitmaps, GA counters, waiting-room line.',
            'Order / Checkout Service: Creates the order, calls the Payment System with an idempotency key, drives confirm or refund.',
            'Hold Sweeper: Background job releasing expired holds so seats reappear in the availability view.',
            'Event bus (Kafka) + Notification System: SeatsHeld, OrderConfirmed, HoldExpired events drive ticket issuance, emails, push notifications and analytics.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  U([Web / mobile app]):::client --> CDN[CDN<br/>app, venue maps, snapshots]:::network
  U --> WR[Waiting Room Service]:::security
  U --> GW[API Gateway<br/>auth, rate limit, token check]:::security
  GW --> CAT[Event Catalog]:::server
  CAT --> CC[(Catalog cache)]:::cache
  GW --> INV[Inventory / Booking Service]:::server
  INV --> R[(Redis<br/>holds, bitmaps, GA counters)]:::cache
  INV --> PG[(Inventory DB<br/>PostgreSQL, sharded by event)]:::db
  GW --> ORD[Order / Checkout Service]:::server
  ORD --> INV
  ORD --> PAY[Payment System]:::external
  SW[Hold sweeper]:::queue --> PG
  INV -.-> K[[Kafka]]:::queue
  K -.-> NS[Notification System]:::server
  K -.-> TIX[Ticket issuance]:::server`,
          text: 'Only the Inventory Service writes seat state. Everything else (catalog, maps, availability display) is a read path that can be cached and can lag by a few seconds.',
        },
        { type: 'heading2', text: 'Booking Flow (Happy Path)' },
        {
          type: 'numbered',
          items: [
            'User passes the waiting room (if active) and receives a signed admission token for this event.',
            'App loads the venue layout from the CDN and the current availability snapshot (bitmap).',
            'User picks seats → POST /events/{id}/holds {seatIds} with the admission token.',
            'Inventory Service does a Redis pre-check, then a conditional UPDATE in PostgreSQL: AVAILABLE → HELD, expires in 10 minutes. Returns holdId and expiry.',
            'User enters payment details → POST /orders {holdId} with an Idempotency-Key header.',
            'Checkout Service calls the Payment System (authorise + capture) using the same idempotency key.',
            'On success: confirm — HELD → SOLD only where hold_id still matches; insert tickets; mark order CONFIRMED (one DB transaction).',
            'Publish OrderConfirmed → tickets issued, confirmation email/push via the Notification System.',
          ],
        },
        {
          type: 'flow',
          title: 'Hold, pay, confirm',
          code: `sequenceDiagram
  actor U as User
  participant G as API Gateway
  participant I as Inventory Service
  participant R as Redis
  participant DB as Inventory DB
  participant O as Checkout Service
  participant P as Payment System
  U->>G: POST holds A-12-7, A-12-8 + admission token
  G->>I: token valid
  I->>R: SET NX hold keys, TTL 600 s
  R-->>I: OK
  I->>DB: UPDATE seats to HELD WHERE status = AVAILABLE
  DB-->>I: 2 rows updated
  I-->>U: holdId h1, expires 10:10:00
  U->>O: POST orders holdId h1, Idempotency-Key k1
  O->>P: charge, key k1
  P-->>O: captured
  O->>I: confirm h1
  I->>DB: UPDATE seats to SOLD WHERE hold_id = h1 + insert tickets
  DB-->>I: 2 rows updated
  I--)O: confirmed
  O-->>U: Booking confirmed
  O--)U: tickets by email`,
          text: 'Two short database transactions, separated by an arbitrary-length payment step. Nothing holds a database lock while the user types their card number.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Schema' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE seats (
  event_id        BIGINT      NOT NULL,
  seat_id         BIGINT      NOT NULL,          -- refers to the venue layout
  section         TEXT        NOT NULL,
  row_label       TEXT        NOT NULL,
  seat_number     INT         NOT NULL,
  best_rank       INT         NOT NULL,          -- lower = better view
  price_cents     INT         NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (status IN ('AVAILABLE', 'HELD', 'SOLD')),
  hold_id         UUID,
  held_by         BIGINT,
  hold_expires_at TIMESTAMPTZ,
  order_id        UUID,
  version         INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, seat_id)
);
CREATE INDEX seats_by_section ON seats (event_id, section, status, best_rank);

CREATE TABLE tickets (
  ticket_id  UUID   PRIMARY KEY,
  event_id   BIGINT NOT NULL,
  seat_id    BIGINT NOT NULL,
  order_id   UUID   NOT NULL,
  status     TEXT   NOT NULL DEFAULT 'ISSUED'       -- ISSUED | REFUNDED
);
-- Last line of defence: at most one live ticket per seat, enforced by the DB
CREATE UNIQUE INDEX one_live_ticket_per_seat
  ON tickets (event_id, seat_id) WHERE status = 'ISSUED';`,
        },
        {
          type: 'paragraph',
          text: 'There are three standard ways to make "check and hold" atomic. All three end in the same database; they differ in where the waiting happens and how losers find out they lost.',
        },
        { type: 'heading3', text: 'Option A — Pessimistic Locking: SELECT ... FOR UPDATE' },
        {
          type: 'paragraph',
          text: 'Lock the rows first, then inspect and update them inside one transaction. FOR UPDATE takes a row-level lock; any other transaction that tries to lock or update the same row waits until the first one commits or rolls back. Always lock multiple seats in a consistent order (ORDER BY seat_id) — otherwise Alice locking 7 then 8 while Bob locks 8 then 7 deadlocks (PostgreSQL detects it and aborts one, but that is wasted work). Keep these transactions tiny: never call the payment provider while holding the lock.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `BEGIN;
SELECT seat_id, status, hold_expires_at
FROM seats
WHERE event_id = $1 AND seat_id = ANY($2)
ORDER BY seat_id            -- consistent lock order prevents deadlocks
FOR UPDATE;

-- Application checks: every row is AVAILABLE, or HELD with hold_expires_at < now().
-- If any seat fails the check → ROLLBACK and tell the user which seats are gone.

UPDATE seats
SET status = 'HELD', hold_id = $3, held_by = $4,
    hold_expires_at = now() + interval '10 minutes',
    version = version + 1
WHERE event_id = $1 AND seat_id = ANY($2);
COMMIT;`,
        },
        {
          type: 'paragraph',
          text: 'For "best available", plain FOR UPDATE is a trap: every request targets the same best seats, so they all queue on the same row lock. FOR UPDATE SKIP LOCKED changes the behaviour — rows currently locked by someone else are silently skipped, so each request grabs the next free seats instead of waiting. It is the same trick used to build job queues on PostgreSQL. Caveats: it gives a deliberately inconsistent view (skipped seats may become free a millisecond later), and it does not guarantee seats are adjacent — pick candidate blocks first if the group must sit together.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Best available: claim the $3 best free seats in a section in ONE statement
WITH picked AS (
  SELECT seat_id
  FROM seats
  WHERE event_id = $1
    AND section  = $2
    AND (status = 'AVAILABLE'
         OR (status = 'HELD' AND hold_expires_at < now()))   -- lazily reclaim expired holds
  ORDER BY best_rank
  LIMIT $3
  FOR UPDATE SKIP LOCKED      -- skip seats other buyers are claiming right now
)
UPDATE seats s
SET status = 'HELD', hold_id = $4, held_by = $5,
    hold_expires_at = now() + interval '10 minutes',
    version = s.version + 1
FROM picked
WHERE s.event_id = $1 AND s.seat_id = picked.seat_id
RETURNING s.seat_id, s.row_label, s.seat_number;
-- Fewer rows than $3 returned → section nearly sold out: roll back or offer a partial hold.`,
        },
        { type: 'heading3', text: 'Option B — Optimistic Concurrency: Conditional UPDATE' },
        {
          type: 'paragraph',
          text: "Skip the explicit lock and put the check inside the UPDATE's WHERE clause, then look at how many rows were affected. In PostgreSQL (even at the default READ COMMITTED level) a second UPDATE on the same row waits for the first to commit, then re-evaluates its WHERE clause against the new row version. Bob's condition status = 'AVAILABLE' is now false, so his UPDATE affects 0 rows. No lost update, no explicit lock, one round trip. The version column gives the same guarantee for read-modify-write flows: read version 7, then UPDATE ... WHERE version = 7 — if anyone changed the row in between, 0 rows match and you retry or give up.",
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Hold specific seats: the check lives in the WHERE clause
BEGIN;
UPDATE seats
SET status = 'HELD', hold_id = $3, held_by = $4,
    hold_expires_at = now() + interval '10 minutes',
    version = version + 1
WHERE event_id = $1
  AND seat_id = ANY($2)
  AND (status = 'AVAILABLE'
       OR (status = 'HELD' AND hold_expires_at < now()));
-- Application: affected rows must equal cardinality($2).
--   equal  → COMMIT  (all seats are yours)
--   fewer  → ROLLBACK (all-or-nothing: someone beat you to at least one seat)
COMMIT;

-- Version-based variant (read first, write only if unchanged)
UPDATE seats
SET status = 'HELD', hold_id = $3, held_by = $4,
    hold_expires_at = now() + interval '10 minutes',
    version = version + 1
WHERE event_id = $1 AND seat_id = $2 AND version = $5;   -- $5 = version we read
-- 0 rows → someone changed the seat since we looked`,
        },
        {
          type: 'flow',
          title: 'Conditional UPDATE — the database picks exactly one winner',
          code: `sequenceDiagram
  participant A as Alice
  participant DB as PostgreSQL
  participant B as Bob
  A->>DB: UPDATE A-12-7 to HELD WHERE status = AVAILABLE
  B->>DB: same UPDATE for A-12-7
  Note over DB: Bob waits on Alice's row lock
  DB-->>A: UPDATE 1 - commit
  Note over DB: Bob re-checks WHERE on the new row - status is HELD
  DB-->>B: UPDATE 0 - seat taken
  B->>B: ROLLBACK, show "seat just taken"`,
          text: 'Losers learn they lost from a row count of 0, not from an error. Always check the affected-row count — ignoring it is how double-booking bugs ship.',
        },
        { type: 'heading3', text: 'Option C — Redis Holds as a Fast Pre-Check' },
        {
          type: 'paragraph',
          text: 'In a hot on-sale, most hold attempts for popular seats will lose. Sending every loser to PostgreSQL wastes row-lock waits on the hottest rows. A Redis SET with NX (only set if the key does not exist) and EX (TTL) is an atomic "claim this seat for 600 s" that answers in under a millisecond. Losers are rejected at Redis and never touch the database. Winners then run the conditional UPDATE in PostgreSQL. For multiple seats, use a Lua script so the claim is all-or-nothing.',
        },
        {
          type: 'code',
          lang: 'lua',
          code: `-- KEYS = hold keys, e.g. hold:{evt42}:A-12-7, hold:{evt42}:A-12-8
-- ARGV[1] = holdId, ARGV[2] = ttl seconds
-- The {evt42} hash tag keeps one event's keys in the same Redis Cluster slot
for i = 1, #KEYS do
  if redis.call('EXISTS', KEYS[i]) == 1 then
    return 0                       -- at least one seat already claimed
  end
end
for i = 1, #KEYS do
  redis.call('SET', KEYS[i], ARGV[1], 'EX', tonumber(ARGV[2]))
end
return 1

-- Single seat, no script needed:
--   SET hold:{evt42}:A-12-7 h1 NX EX 600   → OK or nil
-- Release only your own hold (compare-and-delete in Lua):
--   if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end`,
        },
        {
          type: 'flow',
          title: 'Layered defence — Redis filters, the database decides',
          code: `flowchart TD
  REQ([Hold request<br/>admitted user]):::client --> RL{"Rate limit OK?<br/>per user + IP"}:::security
  RL -->|no| R429([429 slow down]):::external
  RL -->|yes| RD{"Redis SET NX<br/>all seats claimed?"}:::cache
  RD -->|"no - most losers stop here"| GONE([Seat just taken]):::external
  RD -->|yes| PG{"PostgreSQL conditional UPDATE<br/>rows = seats requested?"}:::db
  PG -->|no| UNDO[Delete Redis keys,<br/>ROLLBACK]:::server --> GONE
  PG -->|yes| OK([Hold granted, 10 min]):::highlight`,
          text: 'Redis is an optimisation, not the authority. If Redis and PostgreSQL ever disagree, PostgreSQL wins.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Why a Redis lock alone is not enough: (1) Redis replication is asynchronous — if the primary fails after acknowledging your SET but before replicating it, the promoted replica has no key and a second user can claim the same seat. (2) TTLs measure time on the Redis server, while your app server may pause (GC, slow network) and act after its claim has silently expired. (3) Redis does not live in the same transaction as your orders and tickets, so a crash between "Redis says yes" and "order written" leaves them out of sync. Use Redis to shed load; enforce the invariant with the database conditional update and the unique index on tickets.',
        },
        { type: 'heading2', text: 'Hold Expiry: Lazy Checks + a Sweeper' },
        {
          type: 'paragraph',
          text: 'Expiry needs no timer per seat. Lazy expiry: every claim query already treats "HELD and hold_expires_at < now()" as available, so an expired hold is reclaimable the instant it expires, even if nothing has cleaned it up. A sweeper is still useful so the availability view (bitmaps, seat maps) shows expired seats as free again and so the original holder gets a "your hold expired" notification. The sweeper runs every few seconds in small batches, using SKIP LOCKED so it never blocks a buyer.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Sweeper: release up to 1,000 expired holds per run (a little grace for in-flight payments)
WITH expired AS (
  SELECT event_id, seat_id
  FROM seats
  WHERE status = 'HELD'
    AND hold_expires_at < now() - interval '30 seconds'
  LIMIT 1000
  FOR UPDATE SKIP LOCKED
)
UPDATE seats s
SET status = 'AVAILABLE', hold_id = NULL, held_by = NULL,
    hold_expires_at = NULL, version = s.version + 1
FROM expired e
WHERE s.event_id = e.event_id AND s.seat_id = e.seat_id
RETURNING s.event_id, s.seat_id;   -- publish HoldExpired events for these`,
        },
        {
          type: 'flow',
          title: 'Two ways a hold ends',
          code: `flowchart LR
  H[(Seat HELD<br/>expires 10:10:00)]:::db --> T{10:10:00 passes}
  T --> LZ["Lazy: next claim query sees<br/>hold_expires_at older than now<br/>and takes the seat"]:::server
  T --> SW["Sweeper, every few seconds:<br/>flip back to AVAILABLE"]:::queue
  SW --> EV[[HoldExpired event]]:::queue
  EV -.-> BM[Refresh availability bitmap]:::cache
  EV -.-> NT[Notify user: hold expired]:::server`,
          text: 'Correctness comes from the lazy check inside the claim query; the sweeper only keeps the display tidy. The Redis key TTL expires by itself.',
        },
        { type: 'heading2', text: 'Payment and the Timeout Race' },
        {
          type: 'paragraph',
          text: "The nastiest edge case: the user pays at 10:09:58, the bank takes 20 seconds, the hold expired at 10:10:00 and someone else grabbed the seat at 10:10:05. Money was taken for a seat you no longer have. Defences, used together: (1) when the user clicks Pay, extend the hold once by a bounded amount (e.g. +5 min, status stays HELD with the same hold_id), so slow payments are covered; (2) never start a charge on a hold with less than ~60 s left without extending it first; (3) confirm checks ownership — UPDATE ... WHERE hold_id = $holdId AND status = 'HELD' — so a late confirm can never steal a seat from the next buyer; (4) if confirm affects fewer rows than expected, automatically refund (idempotently) and tell the user. A late confirm on an expired-but-unclaimed hold is safe to accept: hold_id still matches, so nobody else owns the seat.",
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Confirm after payment: ownership check, not just status check
BEGIN;
UPDATE seats
SET status = 'SOLD', order_id = $3, hold_expires_at = NULL, version = version + 1
WHERE event_id = $1
  AND hold_id  = $2          -- still MY hold (nobody re-claimed it)
  AND status   = 'HELD';
-- affected rows = seats in the order → insert tickets, mark order CONFIRMED, COMMIT
-- fewer rows                         → ROLLBACK, refund via the Payment System
INSERT INTO tickets (ticket_id, event_id, seat_id, order_id)
SELECT gen_random_uuid(), event_id, seat_id, $3
FROM seats
WHERE event_id = $1 AND order_id = $3;
COMMIT;`,
        },
        {
          type: 'flow',
          title: 'Payment succeeds after the hold expired',
          code: `sequenceDiagram
  actor A as Alice
  participant O as Checkout
  participant P as Payment System
  participant DB as Inventory DB
  actor B as Bob
  A->>O: Pay for hold h1 (expires 10:10:00)
  O->>DB: extend h1 by 5 min if still mine
  alt extension succeeded
    O->>P: charge, key k1
    P-->>O: captured (slow bank)
    O->>DB: confirm WHERE hold_id = h1
    DB-->>O: 2 rows - SOLD
    O-->>A: Tickets confirmed
  else hold already gone
    Note over DB,B: Bob claimed the seats at 10:10:05
    O-->>A: Hold expired - please pick again (no charge made)
  end
  Note over O,P: If confirm ever returns fewer rows - refund with key k1-refund`,
          text: 'Extend before charging, check ownership when confirming, refund automatically as a last resort. The payment idempotency key (Payment System design) ensures a retried charge or refund never happens twice.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'The Waiting Room in Detail' },
        {
          type: 'bullets',
          items: [
            'Joining: when a user opens the on-sale page, the edge assigns a queue number (Redis INCR on a per-event counter) and returns it in a signed cookie. Users who arrive before on-sale time are shuffled randomly at the start, so refreshing at 09:59:59.9 gives no advantage over arriving at 09:55.',
            'Polling: the client asks "what number is being served now?" every 10–15 s. That value is one integer per event, cached at the CDN for 1–2 s — so 133,000 polls/s (667,000/s for 10M users) are almost entirely edge cache hits.',
            'Admission: an admission controller advances "now serving" by N per second. N is tuned to downstream capacity and adapts: slow it if hold latency or DB CPU rises, stop it when inventory hits zero and tell everyone still waiting.',
            'Token: when your number is served, the waiting room mints a signed token (HMAC or JWT) containing userId, eventId, issuedAt and expiry (e.g. 15 min). The API Gateway verifies the signature statelessly — no database lookup per request — and rejects booking calls without a valid token for that event.',
            'Abuse: one queue position per verified account; CAPTCHA or proof-of-work at join time; device and behaviour signals to spot bots; per-account ticket limits (e.g. 4) enforced at hold time; per-user and per-IP rate limits at the gateway (see the Rate Limiter design). Tokens are bound to the account, so sharing one does not help.',
          ],
        },
        {
          type: 'flow',
          title: 'Join, wait, get admitted',
          code: `sequenceDiagram
  actor U as Fan
  participant E as CDN / Edge
  participant W as Waiting Room
  participant R as Redis
  participant G as API Gateway
  U->>W: join queue for event 42 (CAPTCHA passed)
  W->>R: INCR queue:42
  R-->>W: 48213
  W-->>U: position 48213 (signed cookie)
  loop every 15 s
    U->>E: GET now-serving for event 42
    E-->>U: 41000 (edge cached 2 s)
  end
  Note over W,R: admission controller adds 100 per second
  U->>W: my number is served - give me a token
  W-->>U: signed token userId, event 42, exp 15 min
  U->>G: POST holds + token
  G->>G: verify signature and expiry, no DB call`,
          text: 'The only per-user write is one INCR at join time. Everything a waiting user does after that is a cached read.',
        },
        { type: 'heading2', text: 'General Admission: Counters and the Hot-Row Problem' },
        {
          type: 'paragraph',
          text: 'For standing-room or GA events there are no seat numbers — just "5,000 floor tickets". The obvious design is one row with remaining = 5000 and UPDATE ... SET remaining = remaining - 2 WHERE remaining >= 2. It is correct (the conditional update again), but every buyer now serialises on a single row lock: one hot row becomes the ceiling for the whole sale. The fix is to split the counter into buckets (shards): 32 rows of ~156 tickets each. A request picks a random bucket and decrements it; if that bucket is empty, it tries another. Contention drops roughly 32×, and the total can never go below zero because each bucket has its own CHECK.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE ga_buckets (
  event_id  BIGINT   NOT NULL,
  bucket    SMALLINT NOT NULL,
  remaining INT      NOT NULL CHECK (remaining >= 0),
  PRIMARY KEY (event_id, bucket)
);

-- Take $3 tickets from a randomly chosen bucket $2
UPDATE ga_buckets
SET remaining = remaining - $3
WHERE event_id = $1 AND bucket = $2 AND remaining >= $3
RETURNING remaining;
-- 0 rows → bucket too low: try another bucket (or sum all buckets to see if truly sold out)

-- Hold expiry returns tickets to a bucket in the same transaction
-- that marks the hold EXPIRED, so a retried sweeper cannot add them back twice.`,
        },
        {
          type: 'flow',
          title: 'Splitting one hot counter into buckets',
          code: `flowchart LR
  subgraph HOT["One row - every buyer waits in line"]
    ALL[(remaining = 5000)]:::security
  end
  subgraph SPLIT["32 buckets - buyers spread out"]
    B1[(bucket 1: 156)]:::db
    B2[(bucket 2: 156)]:::db
    B3[(bucket ...)]:::db
    B32[(bucket 32: 164)]:::db
  end
  REQ([Buyers]):::client -->|"random bucket"| SPLIT
  B2 -.->|"empty? try another"| B3
  REB[Rebalancer near sell-out:<br/>merge leftovers]:::queue -.-> SPLIT`,
          text: 'Near sell-out, buckets drain unevenly and buyers bounce between empty ones — a rebalancer (or falling back to a single counter for the last few hundred tickets) keeps "sold out" accurate. The same idea in Redis: DECRBY on sharded keys guarded by a Lua check.',
        },
        { type: 'heading2', text: 'Sharding by Event' },
        {
          type: 'bullets',
          items: [
            'Shard key = event_id. All seats, holds, orders and tickets of one event live on one shard, so every hold and confirm is a single-shard ACID transaction — no distributed transactions.',
            'The cost: a mega on-sale is a hot shard. That is fine because the waiting room caps it at ~200 tx/s, far below what one PostgreSQL primary handles. For the biggest on-sales, place the event on a dedicated, pre-provisioned shard ahead of time.',
            'Catalog and search are separate, read-heavy services with their own replicas and caches; they never touch the inventory shards on the hot path.',
            'Redis keys use a per-event hash tag ({evt42}) so multi-seat Lua scripts stay in one slot; for huge venues, tag per section instead to spread the load across Redis nodes.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'The Database Primary Fails Mid-Sale' },
        {
          type: 'paragraph',
          text: 'The inventory primary dies three minutes into the on-sale. What matters: (1) No committed sale may be lost. Use synchronous replication to at least one standby (PostgreSQL synchronous_commit = on with synchronous_standby_names) for inventory shards. With asynchronous replication, the last few commits can vanish on failover — a seat that was SOLD and paid for reappears AVAILABLE and gets sold again. That is an oversell, so pay the extra few milliseconds of commit latency. (2) Failover takes roughly 10–30 s. During it, the admission controller pauses (nobody new enters), hold requests fail fast with "please retry", and the waiting room shows a friendly message. (3) Holds should not expire because of your outage: after failover, extend every active hold by the outage duration. (4) In-flight payments are safe: the confirm step is retried with the same idempotency key, and if confirm ultimately fails the payment is refunded.',
        },
        {
          type: 'flow',
          title: 'Primary failure during an on-sale',
          code: `sequenceDiagram
  participant AC as Admission controller
  participant I as Inventory Service
  participant P1 as Primary
  participant P2 as Sync standby
  I->>P1: UPDATE seats to HELD
  P1->>P2: stream WAL, wait for ack
  P2-->>P1: ack
  P1-->>I: commit OK
  Note over P1: primary crashes
  I->>P1: next UPDATE - connection error
  I->>AC: health degraded - pause admissions
  Note over P2: promoted to primary in about 20 s
  I->>P2: extend active holds by outage time
  I->>AC: healthy - resume at a reduced rate
  Note over I,P2: Every acknowledged hold and sale survived the failover`,
          text: 'Synchronous replication trades a few milliseconds per commit for the guarantee that "committed" means "survives losing the primary" — the right trade when the alternative is selling a seat twice.',
        },
        { type: 'heading2', text: 'Other Failure Modes' },
        {
          type: 'bullets',
          items: [
            'Redis down or failed over: fall back to going straight to PostgreSQL with a lower admission rate. Correctness is unaffected because Redis was never the authority; only load shedding is lost.',
            'Payment provider slow or down: stop admitting new users (they could not pay anyway), extend existing holds, and surface a clear message. Never mark seats SOLD without a confirmed capture.',
            "Duplicate confirm calls (client retries, webhook replays): confirm is idempotent — the WHERE hold_id = ... AND status = 'HELD' clause makes the second call update 0 rows, and the service returns the already-confirmed order.",
            'Lost events between DB and Kafka: write OrderConfirmed to an outbox table in the confirm transaction (the outbox pattern from the Payment System design) so ticket issuance and emails are never silently dropped.',
            'Reconciliation: periodically compare captured payments with confirmed orders and issued tickets. Payment with no ticket → refund; ticket with no payment → page someone.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'The Read Path: Seat Maps Without Hammering the Database' },
        {
          type: 'paragraph',
          text: 'Split the seat map into two parts. The layout (seat positions, section shapes, labels) never changes for an event, so it is a versioned, immutable file on the CDN with a long cache lifetime. Availability changes constantly, but it is tiny: 2 bits per seat (available / held / sold) is ~12.5 KB for 50,000 seats. An availability publisher rebuilds the bitmap from the database (or from the stream of seat changes) every 1–2 s and pushes it to Redis and the CDN with a 1–2 s TTL. 18,000 shoppers refreshing every 5 s is 3,600 req/s and ~45 MB/s of bitmap egress — trivial for a CDN, and zero reads on the inventory database.',
        },
        {
          type: 'flow',
          title: 'Seat map read path',
          code: `flowchart LR
  APP([Seat map in the app]):::client -->|"layout, cached for days"| CDN[CDN]:::network
  APP -->|"availability bitmap, TTL 2 s"| CDN
  APP <-.->|"optional: SSE / WebSocket deltas"| PUSH[Push gateway]:::network
  CDN --> OBJ[(Layout files<br/>versioned)]:::db
  CDN --> RB[(Redis<br/>bitmap per event)]:::cache
  PG[(Inventory DB)]:::db -.->|"seat change stream"| PUB[Availability publisher]:::server
  PUB --> RB
  PUB -.-> PUSH`,
          text: 'The display is eventually consistent (a few seconds stale) on purpose. Staleness only costs a failed click — the hold itself is always checked against the source of truth.',
        },
        { type: 'heading2', text: 'Polling vs. Push for Live Availability' },
        {
          type: 'bullets',
          items: [
            'Polling a CDN-cached bitmap: simplest, scales with the CDN, no long-lived connections. 2–5 s staleness. The default for flash sales.',
            'SSE or WebSocket deltas ("seats 1201, 1202 now HELD"): seats grey out almost instantly, fewer wasted clicks. But 18,000+ open connections per hot event need a push fleet and fan-out (same pattern as the Chat System design). Send full snapshots periodically so clients recover from missed deltas.',
            'Either way, when a hold fails because the seat was taken, return the fresh status of the requested seats in the error response so the UI corrects itself immediately.',
          ],
        },
        { type: 'heading2', text: 'Keeping Hold Latency Low' },
        {
          type: 'bullets',
          items: [
            'One round trip per hold: a single conditional UPDATE (or the SKIP LOCKED CTE) instead of SELECT then UPDATE.',
            'Short transactions only: no network calls inside a transaction, so row locks are held for microseconds.',
            'Connection pooling (PgBouncer) so 18,000 shoppers share a few hundred database connections.',
            'Catalog pages (event details, prices) come from the cache — see How Caching Works and the Distributed Cache design for TTLs and invalidation when a promoter changes a price.',
          ],
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Pessimistic vs. Optimistic vs. Redis Pre-Check' },
        {
          type: 'bullets',
          items: [
            'Pessimistic (SELECT ... FOR UPDATE): easy to reason about, good when the transaction must read several things before deciding. Losers wait for the lock, so under heavy contention latency climbs and connections pile up. Requires consistent lock order.',
            'FOR UPDATE SKIP LOCKED: ideal for "give me any N good seats" — no waiting on contended rows. Not suitable when the user asked for one specific seat (skipping it would silently ignore their choice).',
            'Optimistic (conditional UPDATE / version column): one round trip, no explicit locks, losers learn instantly from a 0-row count. Best for "these exact seats". Under extreme contention many attempts fail — which is fine, because they would have failed anyway.',
            'Redis SET NX pre-check: sub-millisecond rejection of losers, protects the database. Adds a second store to keep in sync and is never sufficient alone.',
            'Recommended: waiting room + Redis pre-check + conditional UPDATE in PostgreSQL + unique index on tickets as the final guard.',
          ],
        },
        {
          type: 'flow',
          title: 'Choosing a concurrency strategy',
          code: `flowchart TD
  Q{What is the user asking for?}
  Q -->|"These exact seats"| OPT["Conditional UPDATE<br/>WHERE status = AVAILABLE"]:::highlight
  Q -->|"Any N best seats"| SKIP["FOR UPDATE SKIP LOCKED"]:::db
  Q -->|"N general-admission tickets"| GA["Bucketed counters<br/>remaining >= n"]:::db
  Q -->|"Complex multi-row decision"| PES["SELECT ... FOR UPDATE<br/>in seat_id order"]:::server
  OPT & SKIP & GA & PES --> HOT{Flash-sale contention?}
  HOT -->|yes| RED["Add Redis SET NX pre-check<br/>+ waiting room"]:::cache
  HOT -->|no| DONE([Database alone is enough]):::client`,
        },
        { type: 'heading2', text: 'Other Key Decisions' },
        {
          type: 'bullets',
          items: [
            'Hold duration: short holds (5 min) recycle abandoned seats quickly but rush real buyers; long holds (15 min) are kinder but let bots park inventory. 8–10 minutes plus one extension at payment time is a common compromise.',
            'Pick-your-seat vs best-available during flash sales: pick-your-seat creates massive contention on the same front rows; best-available with SKIP LOCKED spreads buyers across seats automatically. Many platforms switch to best-available for the first minutes of a mega on-sale.',
            'Waiting room vs open access: a waiting room adds friction and a few minutes of wait, but without it the system either falls over or sells to whoever has the fastest bot. Enable it per event based on predicted demand (pre-registrations, artist popularity).',
            'FIFO vs randomised queue: pure FIFO rewards bots and people refreshing at 09:59:59; randomising everyone who arrives before on-sale time is fairer, with FIFO after on-sale.',
            'Consistency: strong for holds and sales (CP — refuse rather than risk an oversell), eventual for the seat-map display and search.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Before the On-Sale' },
        {
          type: 'bullets',
          items: [
            'Load test the full path at 2–3× the expected peak: synthetic users joining the queue, polling, holding the same hot seats, paying and abandoning. Replay traffic shapes from past on-sales, including bot-like bursts.',
            'Pre-scale, do not rely on autoscaling: traffic goes from near zero to peak in seconds, while new instances take minutes. Scale gateways, booking services and push gateways up 30–60 minutes before on-sale time.',
            'Pre-warm caches and the CDN: event pages, venue layouts and the initial availability bitmap should already be cached before the first user arrives.',
            'Move the event to a dedicated inventory shard if needed, raise connection-pool limits, and confirm payment-provider capacity (tell the provider about the expected spike).',
            'Pre-register fans (verified accounts, presale codes) to forecast demand and set the admission rate.',
          ],
        },
        { type: 'heading2', text: 'Kill Switches and Runtime Controls' },
        {
          type: 'bullets',
          items: [
            'Admission rate dial: raise or lower users per second live; set to zero to pause the sale without taking the site down.',
            'Feature flags: disable pick-your-seat (best-available only), disable live push (fall back to polling), disable non-essential pages (recommendations, reviews) to free capacity.',
            'Per-event kill switch: stop all holds for one event if an invariant check fails, while other events keep selling.',
            'Bot response: tighten CAPTCHA, lower per-account limits, or invalidate suspicious tokens in bulk.',
          ],
        },
        { type: 'heading2', text: 'Monitoring' },
        {
          type: 'paragraph',
          text: 'The one metric that must always be zero is oversell. Check it continuously during an on-sale, alongside queue length, admission rate, hold success rate, hold p99 latency, hold-expiry rate (a spike means checkout or payments are broken), payment failure rate and DB lock-wait time.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Invariant 1: a SOLD seat must have exactly one issued ticket (expect zero rows)
SELECT s.event_id, s.seat_id, count(t.ticket_id) AS live_tickets
FROM seats s
LEFT JOIN tickets t
  ON t.event_id = s.event_id AND t.seat_id = s.seat_id AND t.status = 'ISSUED'
WHERE s.event_id = $1 AND s.status = 'SOLD'
GROUP BY s.event_id, s.seat_id
HAVING count(t.ticket_id) <> 1;

-- Invariant 2: never more tickets than seats (expect sold <= capacity)
SELECT count(*) FILTER (WHERE status = 'SOLD') AS sold, count(*) AS capacity
FROM seats
WHERE event_id = $1;`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The unique index one_live_ticket_per_seat makes a double-issued ticket physically impossible in the database — a bug elsewhere turns into a failed insert (and an alert) instead of two fans at one seat. Defence in depth: waiting room → rate limits → Redis pre-check → conditional UPDATE → unique index → invariant monitoring → reconciliation.',
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
            'Ask: reserved seating, general admission, or both? Do users pick seats or get "best available"? How long is a hold? Max tickets per order?',
            'Ask about the spike explicitly: how many users, how many seats, how fast? This drives the waiting-room discussion and the estimates.',
            'State what you will not design in depth: payments (delegate to the Payment System, with idempotency keys), search, resale marketplace, dynamic pricing.',
            'Name the invariant early: "a seat is never sold twice" — then design everything around protecting it.',
          ],
        },
        { type: 'heading2', text: 'Common Interview Questions' },
        {
          type: 'bullets',
          items: [
            'How do you prevent two users from booking the same seat?',
            'How do held seats get released if the user abandons checkout?',
            'What happens if payment succeeds after the hold expired?',
            'How do you handle 10 million users arriving for 50,000 seats?',
            'Why not just use a Redis lock for seat holds?',
            'How would you implement general-admission inventory without a hot row?',
            'How do you show seat availability to thousands of users in near real time?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Two-step reservation: short hold transaction → payment outside any transaction → short confirm transaction with an ownership check.',
            'Atomic check-and-set in the database: conditional UPDATE with an affected-row check, or FOR UPDATE / SKIP LOCKED — and when each fits.',
            'Redis SET NX as a load-shedding pre-check; the database (plus a unique index) as the source of truth.',
            'Lazy expiry in the claim query plus a sweeper for the display.',
            'The waiting room converts an unbounded spike into a fixed admission rate — with signed tokens, fairness and bot defences.',
            'Shard by event; synchronous replication for inventory so failover never loses a sale.',
          ],
        },
        { type: 'heading2', text: 'Likely Follow-Ups' },
        {
          type: 'bullets',
          items: [
            '"Seats must be adjacent" → search for contiguous free blocks per row, then claim the whole block with one conditional UPDATE (all-or-nothing).',
            '"Make it multi-region" → keep each event\'s inventory in one home region (strong consistency), serve the waiting room and seat maps from the edge everywhere.',
            '"Bots are buying everything" → verified accounts, presale codes, CAPTCHA at queue join, per-account limits, token binding, anomaly detection.',
            '"Notify users when seats free up" → HoldExpired events → waitlist → Notification System push to the next user in line.',
          ],
        },
        { type: 'heading2', text: 'Common Mistakes' },
        {
          type: 'bullets',
          items: [
            'SELECT-then-UPDATE without a lock or a conditional WHERE — the textbook race condition.',
            'Holding a database transaction (and its row locks) open while calling the payment provider.',
            'Treating a Redis lock as the source of truth for seat ownership.',
            'Trying to "scale out" the booking database to absorb the spike instead of controlling admission.',
            'Forgetting the payment-after-expiry race and the refund path.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through this design in an interview',
          code: `flowchart LR
  A[Clarify<br/>seats vs GA, hold time, spike size]:::client --> B[Estimate<br/>2M users, 50K seats, 200 tx/s]:::client
  B --> C[Data model<br/>AVAILABLE, HELD, SOLD]:::db
  C --> D[No double booking<br/>conditional UPDATE]:::highlight
  D --> E[Hold, pay, confirm<br/>expiry + timeout race]:::server
  E --> F[Flash sale<br/>waiting room + Redis]:::security
  F --> G[Read path, sharding,<br/>failover, monitoring]:::network`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Strong candidates separate the two problems cleanly: correctness ("one seat, one buyer" — enforced by an atomic conditional write in the database) and load ("millions at once" — absorbed by a waiting room so the database only sees a few hundred transactions per second). Getting precise about the affected-row check, hold expiry, and the payment-after-expiry race is what sets a senior answer apart.',
        },
      ],
    },
  ],
};
