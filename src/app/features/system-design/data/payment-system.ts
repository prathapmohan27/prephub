import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 10 — Payment Processing System
// ─────────────────────────────────────────────────────────────────────────────
export const paymentSystem: SystemDesignSystem = {
  id: 'payment-system',
  title: 'Payment Processing System',
  icon: 'ti-credit-card',
  color: '#7c3aed',
  bg: '#ede9fe',
  accentGlow: 'rgba(124,58,237,0.15)',
  difficulty: 'Advanced',
  tagline:
    'ACID transactions, Saga pattern, distributed locks, idempotency keys, and PCI DSS compliance.',
  tags: ['ACID', 'Saga Pattern', 'Idempotency', 'Distributed Transactions', 'PCI DSS'],
  estimatedTime: '70 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A payment processing system like Stripe or PayPal. Handles charge processing, refunds, payouts, and transaction history. Integrates with payment networks (Visa, Mastercard), banks, and external payment providers. Correctness is paramount — financial data must be exactly right.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it is a very careful cashier with a receipt book. Every order comes with a unique order number, so if a customer repeats themselves ("did my payment go through?") the cashier checks the book instead of charging again. Every coin that moves is written down twice — where it left and where it arrived — and each night the cashier checks the book against the bank statement. Being slow is acceptable; being wrong is not.',
        },
        {
          type: 'flow',
          title: 'The big picture — from "Pay" button to money moved',
          code: `flowchart LR
  C([Customer clicks Pay]):::client --> API[Payment API<br/>idempotency check]:::security
  API --> PS[Payment Service]:::server
  PS --> FR[Fraud check]:::security
  PS --> PSP[Payment provider /<br/>card network]:::external
  PSP --> BANK[Customer bank]:::external
  PS --> LED[(Ledger<br/>debit + credit)]:::db
  PS -.-> N[Receipt]:::queue
  REC[Nightly reconciliation]:::queue -.->|"compare"| LED
  REC -.-> BANK`,
          text: 'The hard part is not moving money — the provider does that. It is making sure every payment happens exactly once and is recorded correctly, even when networks time out and servers crash.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Process payments (charge a card or bank account).',
            'Support refunds (full and partial).',
            'Payout to sellers/merchants.',
            'Transaction history and reporting.',
            'Support multiple payment methods: credit card, bank transfer, digital wallets.',
            'Multi-currency support.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1 million transactions per day.',
            'P99 payment latency < 3 seconds (dependent on bank/network response).',
            'Zero data loss — every transaction must be recorded, even if processing fails.',
            'Exactly-once payment processing — a user must never be charged twice for the same intent.',
            'Compliance: PCI DSS (Payment Card Industry Data Security Standard).',
            'Audit log: every action on every transaction must be logged immutably.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'ACID Transactions' },
        {
          type: 'bullets',
          items: [
            'Atomicity: A transaction either fully succeeds or fully fails. No partial state. "All or nothing."',
            'Consistency: The database moves from one valid state to another. Business rules are never violated.',
            "Isolation: Concurrent transactions do not see each other's intermediate state. As if they ran sequentially.",
            'Durability: Once committed, the transaction is permanent. A power failure cannot undo a committed payment.',
            'ACID is guaranteed by traditional RDBMS (PostgreSQL, MySQL). NoSQL databases typically sacrifice some ACID properties for scalability.',
          ],
        },
        { type: 'heading2', text: 'Idempotency Keys' },
        {
          type: 'paragraph',
          text: 'This is the most critical concept in payment systems. Imagine a payment request times out. Was the card charged or not? The client cannot tell. If it simply retries, the customer might be charged twice.',
        },
        {
          type: 'paragraph',
          text: 'The fix is an idempotency key — a unique ID the client creates once per payment intent (one "I want to pay for this order") and sends with every attempt. "Idempotent" means doing it twice has the same effect as doing it once. The first request with a given key is processed normally. Any repeat with the same key just gets the saved result back, without charging again. The key must be stored durably in the database alongside the transaction.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Client generates a unique key per payment attempt
const idempotencyKey = crypto.randomUUID();

// First attempt
await stripe.charges.create({
  amount: 2000,        // $20.00
  currency: 'usd',
  source: 'tok_xxxx',
  idempotency_key: idempotencyKey
});

// Network timeout — retry with SAME key
await stripe.charges.create({
  amount: 2000,
  currency: 'usd',
  source: 'tok_xxxx',
  idempotency_key: idempotencyKey  // Server returns cached result, no double charge
});`,
        },
        {
          type: 'flow',
          title: 'A timeout and a safe retry',
          code: `sequenceDiagram
  participant C as Client
  participant P as Payment API
  participant DB as Database
  C->>P: Pay $20, key = abc-123
  P->>DB: Save key abc-123 + charge card
  DB-->>P: charged, tx_001
  P--xC: response lost (timeout)
  Note over C: Did it work? Unknown - retry with the SAME key
  C->>P: Pay $20, key = abc-123
  P->>DB: Key abc-123 seen before?
  DB-->>P: yes - result was tx_001
  P-->>C: 200 tx_001 (no second charge)`,
          text: 'Without the key, the retry looks like a brand-new payment. With it, the server recognises the repeat and replays the original answer.',
        },
        { type: 'heading2', text: 'Distributed Transactions — The 2-Phase Commit (2PC) Problem' },
        {
          type: 'paragraph',
          text: 'In a distributed system, one payment touches several services (Payment Service, Ledger Service, Notification Service), each with its own database. 2-Phase Commit is the classic way to make them all commit together. A coordinator runs two rounds. Phase 1 (Prepare): it asks every participant "can you commit?" and each one locks its data and says yes or no. Phase 2 (Commit): if all said yes, it tells everyone to commit. The problem: if the coordinator crashes between the two phases, participants are stuck holding locks, not knowing whether to commit or abort. 2PC is blocking and slow.',
        },
        {
          type: 'flow',
          title: '2-Phase Commit and where it gets stuck',
          code: `sequenceDiagram
  participant CO as Coordinator
  participant PAY as Payment DB
  participant LED as Ledger DB
  Note over CO,LED: Phase 1 - Prepare
  CO->>PAY: Prepare?
  PAY-->>CO: Yes (rows locked)
  CO->>LED: Prepare?
  LED-->>CO: Yes (rows locked)
  Note over CO: Coordinator crashes here
  Note over PAY,LED: Both wait with locks held - commit or abort? Nobody knows
  Note over CO,LED: Phase 2 - Commit (only if coordinator survives)
  CO->>PAY: Commit
  CO->>LED: Commit`,
        },
        { type: 'heading2', text: 'The Saga Pattern (Solution to 2PC)' },
        {
          type: 'paragraph',
          text: 'A Saga splits one big transaction into a series of small local transactions, one per service. Each step commits straight away in its own database, so no locks are held across services. Every step also has a compensating transaction — an "undo" action (e.g., release a card hold, issue a refund). If a later step fails, the saga runs the undo actions for the steps that already succeeded, in reverse order.',
        },
        {
          type: 'bullets',
          items: [
            'Choreography Saga: Each service publishes events; other services react. Decoupled but hard to track the overall flow.',
            'Orchestration Saga: A central Saga Orchestrator tells each service what to do, tracks state, and triggers compensating transactions on failure. Easier to debug and monitor.',
          ],
        },
        {
          type: 'flow',
          title: 'Saga — do, do, do … or undo in reverse',
          code: `flowchart LR
  S1[1. Reserve funds<br/>card hold]:::server --> S2[2. Record in ledger]:::server
  S2 --> S3[3. Capture funds]:::server
  S3 --> OK([Payment done]):::highlight
  S3 -.->|"fails"| U2[Undo 2:<br/>reverse ledger entry]:::security
  U2 -.-> U1[Undo 1:<br/>release card hold]:::security
  U1 -.-> FAIL([Payment declined,<br/>nothing charged]):::external`,
          text: 'Each step commits on its own. Consistency is restored by running compensations, not by holding locks — so a crash never leaves services frozen.',
        },
        {
          type: 'flow',
          title: 'Choreography vs orchestration',
          code: `flowchart TB
  subgraph CHOREO["Choreography - services react to events"]
    A1[Payment]:::server -.->|"PaymentReserved"| B1[Ledger]:::server
    B1 -.->|"LedgerRecorded"| C1[Capture]:::server
    C1 -.->|"Captured"| D1[Notification]:::server
  end
  subgraph ORCH["Orchestration - one conductor"]
    O[Saga Orchestrator<br/>tracks state]:::highlight --> A2[Payment]:::server
    O --> B2[Ledger]:::server
    O --> C2[Capture]:::server
    O --> D2[Notification]:::server
  end`,
          text: 'Choreography has no central brain, so the full flow is hard to see. Orchestration puts the whole flow (and every undo) in one place — the usual choice for payments.',
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
            'Payment API Gateway: Entry point. Validates requests, checks idempotency keys, authenticates merchants.',
            'Payment Service: Core business logic. Orchestrates the payment saga.',
            'Ledger Service: Maintains double-entry bookkeeping ledger. Every debit has a matching credit.',
            "Payment Provider Integration Service: Connects to Stripe, Adyen, or directly to card networks (Visa/Mastercard via the acquiring bank — the merchant's bank, which accepts card payments on its behalf).",
            'Fraud Detection Service: Real-time ML-based fraud scoring. Blocks suspicious transactions.',
            'Idempotency Store: PostgreSQL table + Redis cache for idempotency key lookup.',
            'Notification Service: Sends payment receipts, failure alerts.',
            'Reconciliation Service: Nightly batch job reconciles internal ledger against bank statements.',
            'Audit Log: Append-only event store recording every action.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  M([Merchant / Checkout]):::client --> GW[Payment API Gateway<br/>auth + idempotency]:::security
  GW --> IS[(Idempotency store<br/>Redis + PostgreSQL)]:::cache
  GW --> PS[Payment Service<br/>saga orchestrator]:::server
  PS --> FD[Fraud Detection]:::security
  PS --> PI[Provider Integration]:::server
  PI --> EXT[Stripe / Adyen /<br/>card networks]:::external
  PS --> LS[Ledger Service]:::server
  LS --> LDB[(Ledger DB<br/>PostgreSQL)]:::db
  PS -.-> K[[Event bus]]:::queue
  K -.-> NS[Notification Service]:::server
  K -.-> AUD[(Audit Log<br/>append-only)]:::db
  RS[Reconciliation<br/>nightly]:::queue -.-> LDB`,
          text: 'Everything on the money path (solid lines) is synchronous and strongly consistent. Receipts and audit records follow asynchronously through the event bus.',
        },
        { type: 'heading2', text: 'Payment Saga Flow (Success Path)' },
        {
          type: 'numbered',
          items: [
            'POST /api/payments {amount, currency, paymentMethod, idempotency_key}',
            'Check idempotency key — if already processed, return cached result.',
            'Fraud Detection: score the transaction. If high fraud risk, decline immediately.',
            'Reserve funds: call Payment Provider to pre-authorize (hold) the amount.',
            'Record in Ledger: debit customer account, credit escrow.',
            'Capture funds: call Payment Provider to capture the pre-authorized charge.',
            'Update Ledger: move from escrow to merchant account.',
            'Send receipt notification.',
            'Return success response with transaction_id.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Pre-authorize vs capture: a pre-authorization puts a hold on the money (like a hotel holding a deposit on your card) without moving it yet. Capture is the moment the money is actually taken. Escrow is a holding account where funds sit between those two steps.',
        },
        {
          type: 'flow',
          title: 'Payment saga — success path',
          code: `sequenceDiagram
  actor C as Client
  participant G as API Gateway
  participant P as Payment Service
  participant F as Fraud
  participant X as Provider
  participant L as Ledger
  participant N as Notifications
  C->>G: POST /api/payments + idempotency_key
  G->>G: Key seen before?
  alt already processed
    G-->>C: cached result
  else new key
    G->>P: process payment
    P->>F: score transaction
    F-->>P: low risk
    P->>X: pre-authorize (hold) $20
    X-->>P: auth_id
    P->>L: debit customer, credit escrow
    P->>X: capture auth_id
    X-->>P: captured
    P->>L: move escrow to merchant
    P--)N: send receipt
    P-->>C: 200 transaction_id
  end`,
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Double-Entry Ledger' },
        {
          type: 'paragraph',
          text: 'Every financial system uses double-entry bookkeeping: each transaction writes two ledger entries — a debit (money leaving an account) and a credit (money arriving in another). So the total of all debits always equals the total of all credits. Because that rule must always hold, any mismatch is an instant red flag, which makes errors and fraud easy to spot and reconciliation possible.',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE ledger_entries (
  entry_id       UUID PRIMARY KEY,
  transaction_id UUID NOT NULL,
  account_id     UUID NOT NULL,
  entry_type     VARCHAR(6) NOT NULL,  -- 'DEBIT' or 'CREDIT'
  amount         NUMERIC(15, 2) NOT NULL,
  currency       CHAR(3) NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Example: $20 payment from customer to merchant
INSERT INTO ledger_entries VALUES
  (uuid(), 'tx_001', 'customer_acct', 'DEBIT',  20.00, 'USD', NOW()),
  (uuid(), 'tx_001', 'merchant_acct', 'CREDIT', 20.00, 'USD', NOW());
  -- Sum of debits == Sum of credits → Balanced ✓`,
        },
        {
          type: 'flow',
          title: 'A $20 payment in the ledger',
          code: `flowchart LR
  CU[(customer_acct)]:::client -->|"DEBIT 20.00"| TX{{tx_001}}:::highlight
  TX -->|"CREDIT 20.00"| ES[(escrow)]:::cache
  ES -->|"DEBIT 20.00 / CREDIT 20.00<br/>on capture"| ME[(merchant_acct)]:::db
  TX -.-> CHK["Check: total debits = total credits"]:::security`,
          text: 'Money is never created or destroyed — it only moves between accounts, and every move is written on both sides. Entries are never edited; a correction is a new pair of entries.',
        },
        { type: 'heading2', text: 'Idempotency Implementation' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  status          VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress | done
  response_status INT,
  response_body   JSONB,
  transaction_id  UUID,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP  -- typically 24 hours
);

-- On request:
-- 1. Claim the key atomically (the PRIMARY KEY makes only one request win):
INSERT INTO idempotency_keys (idempotency_key) VALUES ($1)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING idempotency_key;

-- 2. Row returned → first request: process the payment, then
UPDATE idempotency_keys
SET status = 'done', response_status = $2, response_body = $3, transaction_id = $4
WHERE idempotency_key = $1;

-- 3. No row returned → duplicate: read the existing row.
--    status = 'done'        → return the stored response (no second charge)
--    status = 'in_progress' → 409, ask the client to retry shortly
--
-- Avoid SELECT-then-INSERT: two simultaneous retries could both see
-- "not found" and both charge the customer.`,
        },
        {
          type: 'flow',
          title: 'Idempotency check, including two retries arriving at once',
          code: `flowchart TD
  R([Request with key]):::client --> INS{"Claim the key:<br/>INSERT key, status = in_progress"}:::db
  INS -->|"Inserted - first time"| PROC[Process payment]:::server
  PROC --> SAVE[Store response<br/>status = done]:::db
  SAVE --> RESP([Return response]):::highlight
  INS -->|"Key already exists"| ST{Status?}
  ST -->|done| CACHED([Return stored response]):::cache
  ST -->|in_progress| WAIT([409 - still processing,<br/>retry shortly]):::external`,
          text: 'In production, claim the key with an INSERT first (the primary key makes it atomic) rather than SELECT-then-INSERT, so two simultaneous retries can never both start processing.',
        },
        { type: 'heading2', text: 'Outbox Pattern for Reliable Event Publishing' },
        {
          type: 'paragraph',
          text: 'The payment service has to do two things: save to its database AND publish an event to Kafka. What if it saves to the database and then crashes before publishing? The event is lost, and the rest of the system never hears about the payment. The Outbox Pattern fixes this. In the SAME database transaction as the payment, also write the event into an "outbox" table — so both are saved together or not at all. A separate outbox processor then reads new rows from that table, publishes them to Kafka, and marks them as sent. If it crashes, it simply re-sends unsent rows, so consumers must tolerate the occasional duplicate.',
        },
        {
          type: 'flow',
          title: 'Outbox pattern',
          code: `flowchart LR
  PS[Payment Service]:::server -->|"ONE transaction"| DB
  subgraph DB["PostgreSQL"]
    PAY[(payments row)]:::db
    OUT[(outbox row:<br/>PaymentSucceeded)]:::db
  end
  OP[Outbox processor<br/>polls or reads the WAL]:::queue -->|"read unsent rows"| OUT
  OP -->|"publish"| K[[Kafka]]:::queue
  OP -->|"mark sent"| OUT
  K -.-> N[Notifications,<br/>analytics, ...]:::server`,
          text: 'The database write and the "I need to publish this" note are saved atomically. Publishing can be retried later as many times as needed.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Database Scaling' },
        {
          type: 'bullets',
          items: [
            '1M transactions/day = ~12 transactions/second. A single PostgreSQL instance handles this easily (up to 10K TPS).',
            'Shard by merchant_id for multi-tenant systems. Each shard handles a subset of merchants.',
            'Read replicas for reporting queries. Never run heavy analytics on the primary.',
            'Archive old transactions (> 7 years) to cheaper storage for compliance — but keep ledger entries immutable and accessible.',
          ],
        },
        { type: 'heading2', text: 'Throughput Scaling' },
        {
          type: 'bullets',
          items: [
            'The bottleneck is usually the external payment provider API (Stripe/bank), not your infrastructure.',
            'Use connection pooling (PgBouncer) to maximize database throughput.',
            'Async payment processing: Return a pending status immediately, process asynchronously, webhook/notify when complete.',
          ],
        },
        {
          type: 'flow',
          title: 'Scaled-out architecture',
          code: `flowchart TB
  C([Checkouts]):::client --> LB[Load Balancer]:::network
  LB --> P1[Payment Service 1]:::server & P2[Payment Service N]:::server
  P1 & P2 --> PB[PgBouncer<br/>connection pool]:::network
  subgraph SH["Ledger DB - sharded by merchant_id"]
    S1[(Shard 1 primary)]:::db
    S2[(Shard 2 primary)]:::db
  end
  PB --> SH
  S1 -. replication .-> R1[(Read replica<br/>reports)]:::db
  S2 -. replication .-> R2[(Read replica<br/>reports)]:::db
  P1 & P2 --> Q[[Async payout queue]]:::queue
  Q --> W[Payout workers]:::server --> PSP[Providers / banks]:::external
  OLD[(Archive<br/>older than 7 years)]:::db
  S1 -. "archive" .-> OLD`,
          text: 'At ~12 payments per second one database is plenty — sharding and async queues are for growth and for bulk payouts, which can wait for slow banks.',
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Saga Compensation on Failure' },
        {
          type: 'bullets',
          items: [
            'If Capture fails after Reserve: Saga orchestrator triggers compensating transaction — release the pre-authorization.',
            "If Ledger update fails after Capture: This is critical — money has left the customer's account but not reached the merchant. Saga must retry the ledger update (idempotent) or flag for manual intervention.",
            'Every compensating transaction must itself be idempotent — the saga may retry it multiple times.',
          ],
        },
        {
          type: 'flow',
          title: 'Saga failure handling',
          code: `flowchart TD
  R[Reserve funds]:::server --> RC{Capture OK?}
  RC -->|Yes| LU{Ledger update OK?}
  RC -->|No| REL[Compensate:<br/>release the hold]:::security
  REL --> DEC([Payment failed,<br/>customer not charged]):::external
  LU -->|Yes| DONE([Payment complete]):::highlight
  LU -->|No - money already moved| RETRY{Retry idempotent<br/>ledger update}
  RETRY -->|Succeeds| DONE
  RETRY -->|Still failing| MAN[[Flag for manual<br/>investigation]]:::queue`,
          text: 'Before money moves, failures are simply undone. After money moves, you cannot undo silently — you must push forward with retries until the books are correct.',
        },
        { type: 'heading2', text: 'Reconciliation' },
        {
          type: 'paragraph',
          text: "Every night, reconciliation compares your internal ledger line-by-line against the bank's or provider's statement. Any difference triggers an alert for manual investigation. It catches bugs, fraud, and infrastructure failures that slipped through everything else — the safety net that guarantees long-term financial integrity.",
        },
        {
          type: 'flow',
          title: 'Nightly reconciliation',
          code: `flowchart LR
  L[(Internal ledger)]:::db --> M[Match transactions<br/>by ID + amount]:::server
  B[Provider / bank<br/>settlement file]:::external --> M
  M --> Q{Everything matches?}
  Q -->|Yes| OK([Day closed]):::highlight
  Q -->|No| AL[Alert + discrepancy<br/>report]:::security
  AL --> INV[[Finance ops<br/>investigates]]:::queue`,
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Fraud Detection Latency' },
        {
          type: 'paragraph',
          text: "Fraud scoring must finish in < 100ms so it does not noticeably slow the payment. Use a lightweight ML model (gradient boosted trees rather than neural networks) for real-time scoring. Do the heavy work ahead of time: compute each user's risk profile in a batch job. At payment time, the scorer only combines those ready-made features with a few details from the current transaction.",
        },
        { type: 'heading2', text: 'Caching Idempotency Keys' },
        {
          type: 'paragraph',
          text: 'Store idempotency keys in both Redis (fast lookup) and PostgreSQL (durable). First check Redis — O(1) lookup in < 1ms. If not in Redis, check PostgreSQL. This two-tier approach handles the common case (no duplicate) with minimal overhead.',
        },
        {
          type: 'flow',
          title: 'Two-tier idempotency lookup',
          code: `flowchart LR
  K([Incoming key]):::client --> R{In Redis?}:::cache
  R -->|"Yes, under 1 ms"| HIT([Return stored result]):::highlight
  R -->|No| PG{In PostgreSQL?}:::db
  PG -->|Yes| FILL[Refill Redis]:::cache --> HIT
  PG -->|"No - new payment"| NEW([Process payment]):::server`,
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Synchronous vs. Asynchronous Payment Processing' },
        {
          type: 'bullets',
          items: [
            'Synchronous: User waits for the full payment confirmation (charge + ledger + notification). Simple UX ("Payment confirmed" immediately). Latency depends on external providers (~2-5 seconds).',
            'Asynchronous: Return "payment pending" immediately. Process in background. Webhook/notification when complete. Better throughput, handles provider slowness. More complex UX.',
            'Recommendation: Synchronous for user-facing payments (e-commerce). Asynchronous for bulk payouts and B2B payments.',
          ],
        },
        {
          type: 'flow',
          title: 'Sync vs async payments',
          code: `sequenceDiagram
  actor U as User
  participant P as Payment Service
  participant X as Provider
  Note over U,X: Synchronous - checkout
  U->>P: Pay
  P->>X: charge
  X-->>P: OK (2-5 s)
  P-->>U: Payment confirmed
  Note over U,X: Asynchronous - bulk payouts
  U->>P: Pay out to 10,000 sellers
  P-->>U: 202 pending
  P->>X: process in background
  X-->>P: done
  P--)U: webhook: payouts complete`,
        },
        { type: 'heading2', text: 'Consistency vs. Availability' },
        {
          type: 'paragraph',
          text: 'By the CAP theorem, when the network splits (a "partition"), a system must choose between staying consistent and staying available. Payment systems must be CP (Consistent + Partition Tolerant): during a partition it is better to reject payments with an error than to risk double-charging or a ledger that does not add up. Never sacrifice consistency for availability in financial systems.',
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'PCI DSS Compliance' },
        {
          type: 'bullets',
          items: [
            'Never store raw card numbers (PANs — Primary Account Numbers) in your database. Use tokenization — store a token that references the card in a PCI-compliant vault.',
            'Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.2+).',
            'Access control: Only authorized services can access payment data. Strict RBAC (role-based access control).',
            'Annual PCI DSS audit by a Qualified Security Assessor (QSA).',
            'Network segmentation: Payment systems in isolated network segment, separate from application servers.',
          ],
        },
        {
          type: 'flow',
          title: 'Tokenization keeps card numbers out of your systems',
          code: `sequenceDiagram
  participant B as Browser
  participant V as Card vault (PCI zone)
  participant A as Your backend
  participant X as Provider
  B->>V: card number entered in vault-hosted field
  V-->>B: token tok_9f2
  B->>A: pay with tok_9f2
  A->>X: charge tok_9f2
  X->>V: resolve token to real card
  X-->>A: charged
  Note over A: Your backend never sees the real card number`,
          text: 'Because raw card numbers never reach your servers, most of your system stays out of PCI audit scope.',
        },
        { type: 'heading2', text: 'Audit Logging' },
        {
          type: 'bullets',
          items: [
            'Every action on every transaction must be logged: who did what, when, from which IP.',
            'Audit logs are append-only — never modified or deleted.',
            'Stored in a separate system from the main database, with separate access controls.',
            'Retained for 7+ years (regulatory requirement in most jurisdictions).',
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
            'How do you prevent a user from being charged twice for the same payment?',
            'How do you handle a timeout from the payment provider — do you retry?',
            'Explain the Saga pattern and when you would use it over 2-Phase Commit.',
            'How do you handle a partial failure in a distributed payment flow?',
            'How do you ensure the integrity of financial data across services?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Idempotency keys are the most important concept — explain them clearly and concisely.',
            'Double-entry ledger: every debit has a credit — mathematical invariant for integrity.',
            'Saga pattern over 2PC: no distributed lock, compensating transactions on failure.',
            'Outbox pattern: atomic event publishing with database transaction.',
            'CP over AP: always choose consistency for financial data.',
            'Reconciliation: the safety net that catches everything else.',
          ],
        },
        {
          type: 'flow',
          title: 'How to walk through this design in an interview',
          code: `flowchart LR
  A[Clarify<br/>methods, volume, currencies]:::client --> B[Happy path<br/>auth, capture, ledger]:::server
  B --> C[Exactly once<br/>idempotency keys]:::highlight
  C --> D[Partial failures<br/>saga + outbox]:::server
  D --> E[Integrity<br/>double entry + reconciliation]:::db
  E --> F[Security<br/>PCI, tokens, audit]:::security`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Payment systems are the most nuanced system design topic. Interviewers at FAANG and fintech companies expect you to know idempotency keys, double-entry ledger, and the Saga pattern. These three concepts, explained clearly, will set you apart in any senior/staff engineer payment system interview.',
        },
      ],
    },
  ],
};
