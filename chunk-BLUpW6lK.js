var e={"cap-theorem-and-pacelc":{summary:`CAP says that when a network partition happens, a replicated system must choose between **consistency** (every read sees the latest write, i.e. linearizability) and **availability** (every non-failed node still answers). Partitions are not optional, so the real choice is CP or AP during a partition. PACELC adds the part that matters day to day: **else**, when there is no partition, you still trade **latency** against **consistency**, because waiting for replicas to agree costs round trips.`,details:[{type:`paragraph`,text:`CAP is often misquoted as "pick two of three". You cannot opt out of partitions on a real network, so CA is not a meaningful choice for a distributed system. CAP only describes behaviour **during** a partition: a node that cannot reach the others either refuses or delays the request (keeps C, gives up A) or answers with possibly stale data (keeps A, gives up C).`},{type:`paragraph`,text:`The definitions are also narrow. CAP's C is **linearizability**, not the C in ACID, and its A means every non-failed node must respond, not "99.99% uptime". Many real systems are neither strictly CP nor AP; they make choices per operation.`},{type:`heading3`,text:`What PACELC adds`},{type:`paragraph`,text:`PACELC reads: if **P**artition, choose **A** or **C**; **E**lse, choose **L**atency or **C**onsistency. Partitions are rare, but every write pays the normal-case trade-off. A synchronous quorum write to three replicas across availability zones is consistent but slower; acknowledging after one replica is fast but a read from another replica may be stale.`},{type:`bullets`,items:[`**PC/EC** (consistency both times): etcd, ZooKeeper, Spanner-style systems. Consensus on every write; the minority side of a partition stops accepting writes.`,`**PA/EL** (availability and low latency): Cassandra or DynamoDB with default eventually consistent reads. Fast and always writable, but reads can be stale and conflicts need a resolution rule.`,"**Tunable**: DynamoDB lets you request strongly consistent reads per call; Cassandra lets you pick `ONE`, `QUORUM` or `ALL` per query. With `R + W > N` reads overlap the latest write quorum.",`A single-primary Postgres with async replicas: writes are consistent on the primary, but reads from replicas are eventually consistent (replication lag), which is a PACELC "EL" choice you made by routing reads.`]},{type:`heading3`,text:`Applying it to a feature`},{type:`paragraph`,text:`Decide per operation, not per system. In an e-commerce flow, the **inventory decrement** and **payment capture** need consistency (overselling or double charging is worse than an error), so they go to the primary or a consensus-backed store and fail if it is unreachable. The **product catalog**, **reviews** and **"recently viewed"** can be served stale from replicas or a cache, because availability and latency matter more there.`},{type:`code`,lang:`typescript`,code:`import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Catalog page: fast, may be slightly stale (EL)
const product = await ddb.send(new GetCommand({ TableName: 'Products', Key: { id } }));

// Checkout: read-your-write matters, pay the extra latency (EC)
const stock = await ddb.send(
  new GetCommand({ TableName: 'Inventory', Key: { sku }, ConsistentRead: true }),
);`},{type:`callout`,variant:`warning`,text:`Common mistake: saying "we chose CA" or "MongoDB is CP" as a blanket fact. Behaviour depends on configuration (write concern, read preference, consistency level) and on which operation you are talking about.`},{type:`callout`,variant:`tip`,text:"Interview tip: state that CAP only applies during partitions, then pivot quickly to PACELC and to a concrete per-operation decision. Mentioning quorum maths (`R + W > N`) and replica-read lag shows you have operated these systems, not just read about them."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`What happens to writes on the minority side of a Raft cluster during a partition?`,`How do you give a user read-your-writes consistency when reads go to replicas?`,`How do AP systems resolve conflicting writes (last-write-wins, version vectors, CRDTs)?`]}]},"designing-for-eventual-consistency":{summary:`Strong consistency means every read reflects the latest committed write; eventual consistency means replicas or downstream views converge if writes stop, but a read may be stale for a while. To design for it, make the lag explicit in the product (pending states, optimistic UI), keep invariants that must never break inside one consistent boundary, make updates idempotent and order-tolerant, and add reconciliation for when events go missing.`,details:[{type:`paragraph`,text:'Eventual consistency appears the moment you have read replicas, caches, search indexes or event-driven services. Take order placement: the Orders service commits the order and publishes `OrderPlaced`; Payments charges the card; Inventory reserves stock; Notifications sends an email; a search/read model updates the "My orders" page. For a few hundred milliseconds (or minutes during an incident) these views disagree. The design question is how the product and the code behave in that window.'},{type:`heading3`,text:`Design techniques`},{type:`numbered`,items:[`**Keep hard invariants in one place.** "Never sell more than we have" lives in the Inventory service with a conditional update or DB constraint, not spread across services that each hold a copy.`,'**Model the in-between states.** An order is `PENDING` → `CONFIRMED` or `REJECTED`, not instantly "done". The UI shows "Processing your order" instead of pretending it is final.',`**Read your own writes where users notice.** After a user edits their profile, read from the primary for that user for a few seconds, or return the new state in the write response and update the UI optimistically.`,`**Make consumers idempotent and order-tolerant.** Use event IDs for dedup and a version number so an older event cannot overwrite newer state.`,`**Reconcile.** A periodic job compares sources of truth (orders vs payments) and repairs or alerts on drift, because some event will eventually be lost or mishandled.`,`**Expose staleness.** Measure lag (replica lag, consumer lag) and alert on it; it is a key SLO for eventually consistent features.`]},{type:`code`,lang:`typescript`,code:`// Read model update that tolerates duplicates and out-of-order delivery
async function onOrderStatusChanged(evt: { orderId: string; status: string; version: number }) {
  // Only apply if this event is newer than what we already have
  const res = await db.query(
    \`UPDATE order_view
        SET status = $2, version = $3, updated_at = now()
      WHERE order_id = $1 AND version < $3\`,
    [evt.orderId, evt.status, evt.version],
  );
  if (res.rowCount === 0) {
    // Either a duplicate/stale event (ignore) or the row does not exist yet
    await db.query(
      \`INSERT INTO order_view (order_id, status, version) VALUES ($1, $2, $3)
       ON CONFLICT (order_id) DO NOTHING\`,
      [evt.orderId, evt.status, evt.version],
    );
  }
}`},{type:`heading3`,text:`Choosing per feature`},{type:`bullets`,items:[`**Needs strong consistency:** balances, stock reservation, uniqueness (usernames, seat booking), anything where a stale read causes money loss or a broken invariant.`,`**Fine with eventual consistency:** search results, analytics, counters ("1.2k likes"), recommendations, notification fan-out, audit/read models.`,`Ask the business: "what is the cost if this is 5 seconds stale?" If the answer is "a confused user", design the UX; if it is "we lose money", keep it strongly consistent.`]},{type:`callout`,variant:`warning`,text:`Common mistake: redirecting the user to a page that reads from a replica or search index right after a write. They see the old data and click "submit" again. Return the written state, read from the primary, or show a pending state.`},{type:`callout`,variant:`tip`,text:`Interview tip: a strong answer is product-aware. Mention pending states and optimistic UI, read-your-writes for the acting user, versioned idempotent consumers, and a reconciliation job. Cross-service workflows themselves (Saga with compensations) are covered under Microservices.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How would you implement read-your-writes with read replicas behind a load balancer?`,`How do you detect and repair drift between two services?`,`What consistency guarantees does your cache give, and how do you invalidate it?`]}]},"transactional-outbox-pattern":{summary:"It solves the **dual-write problem**: you cannot atomically commit a database change and publish a message to a broker, so a crash between the two leaves them inconsistent. With an outbox, the service writes the business row and an event row into an `outbox` table in the **same local transaction**; a separate relay then reads the outbox and publishes to the broker, marking rows as sent. This gives at-least-once publishing, so consumers must be idempotent.",details:[{type:`paragraph`,text:"Scenario: the Orders service inserts an order and must publish `OrderPlaced` so Payments and Inventory react. If you commit then publish, a crash or broker outage after the commit means the order exists but nobody hears about it. If you publish then commit, a failed commit means downstream services act on an order that does not exist. Distributed transactions (2PC) across DB and broker are rarely available or worth it."},{type:`heading3`,text:`Write side: one local transaction`},{type:`code`,lang:`typescript`,code:`// Schema
// CREATE TABLE outbox (
//   id            bigserial PRIMARY KEY,
//   event_id      uuid NOT NULL UNIQUE,
//   aggregate_id  text NOT NULL,          -- used as Kafka key for ordering
//   type          text NOT NULL,
//   payload       jsonb NOT NULL,
//   created_at    timestamptz NOT NULL DEFAULT now(),
//   published_at  timestamptz
// );

import { randomUUID } from 'node:crypto';

async function placeOrder(input: PlaceOrderInput) {
  return db.transaction(async (tx) => {
    const order = await tx.query(
      'INSERT INTO orders (customer_id, total, status) VALUES ($1, $2, $3) RETURNING *',
      [input.customerId, input.total, 'PENDING'],
    );
    await tx.query(
      'INSERT INTO outbox (event_id, aggregate_id, type, payload) VALUES ($1, $2, $3, $4)',
      [randomUUID(), order.rows[0].id, 'OrderPlaced', order.rows[0]],
    );
    return order.rows[0]; // both rows commit, or neither does
  });
}`},{type:`heading3`,text:`Relay: polling publisher`},{type:`code`,lang:`typescript`,code:`async function relayBatch() {
  await db.transaction(async (tx) => {
    // SKIP LOCKED lets several relay instances run without double-picking rows
    const { rows } = await tx.query(
      \`SELECT * FROM outbox
        WHERE published_at IS NULL
        ORDER BY id
        LIMIT 100
        FOR UPDATE SKIP LOCKED\`,
    );
    if (rows.length === 0) return;

    await producer.send({
      topic: 'orders',
      messages: rows.map((r) => ({
        key: r.aggregate_id,
        value: JSON.stringify(r.payload),
        headers: { 'event-id': r.event_id, 'event-type': r.type },
      })),
    });

    await tx.query('UPDATE outbox SET published_at = now() WHERE id = ANY($1)', [
      rows.map((r) => r.id),
    ]);
  });
}`},{type:`paragraph`,text:"If the relay crashes after `send` but before the update commits, those rows are published again on the next run. That is why the outbox gives **at-least-once**, and why each event carries a stable `event_id` that consumers deduplicate on."},{type:`heading3`,text:`Polling vs change data capture`},{type:`bullets`,items:[`**Polling:** simple, works with any SQL DB, adds a little latency and DB load. Fine for most services.`,`**CDC (e.g. Debezium reading the Postgres WAL / MySQL binlog):** lower latency and no polling queries, but more infrastructure to run and monitor.`,`Clean up published rows with a scheduled delete or partitioned table, otherwise the outbox grows forever.`,`Ordering: if multiple relay workers publish in parallel, events for the same aggregate can be reordered. Keep one relay per partition of aggregates, or rely on consumer-side versioning.`]},{type:`callout`,variant:`warning`,text:`Common mistake: publishing to the broker inside the DB transaction callback and assuming it is atomic. If the commit fails after the publish, the event is already out. The broker call must happen after commit, from the outbox.`},{type:`callout`,variant:`tip`,text:`Interview tip: name the dual-write problem, explain the same-transaction insert, say clearly that delivery becomes at-least-once, and pair it with the **inbox / idempotent consumer** on the receiving side. Mention CDC as the alternative relay. The outbox is how a Saga (see Microservices) publishes its steps reliably.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you keep per-order event ordering when the relay is scaled out?`,`How do you monitor the relay (oldest unpublished row age)?`,`What would you use if the service writes to DynamoDB instead (DynamoDB Streams)?`]}]},"exactly-once-myth-idempotent-consumers":{summary:`Over an unreliable network a sender cannot distinguish "the message was lost" from "the acknowledgement was lost", so it must either retry (risking duplicates, at-least-once) or not (risking loss, at-most-once). What you can build is **exactly-once processing effects**: at-least-once delivery plus an idempotent consumer that records which message IDs it has handled in the same transaction as its side effect. Kafka's "exactly-once semantics" is real but scoped to Kafka-to-Kafka read-process-write with transactions.`,details:[{type:`paragraph`,text:`Duplicates come from many places: a producer retry after a timeout, a consumer that processes a message and crashes before committing the offset or deleting it from SQS, an SQS visibility timeout that expires while work is still running, a rebalance in a Kafka consumer group, or an outbox relay that republishes. You should assume every message can arrive more than once.`},{type:`heading3`,text:`Idempotent consumer with a processed-messages table`},{type:`code`,lang:`typescript`,code:`// CREATE TABLE processed_messages (
//   consumer   text NOT NULL,
//   message_id uuid NOT NULL,
//   processed_at timestamptz NOT NULL DEFAULT now(),
//   PRIMARY KEY (consumer, message_id)
// );

async function handlePaymentCaptured(msg: { eventId: string; orderId: string; amount: number }) {
  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      \`INSERT INTO processed_messages (consumer, message_id)
       VALUES ('orders.payment-captured', $1)
       ON CONFLICT DO NOTHING\`,
      [msg.eventId],
    );
    if (inserted.rowCount === 0) return; // duplicate: already applied

    await tx.query("UPDATE orders SET status = 'PAID' WHERE id = $1", [msg.orderId]);
  });
  // Ack / commit offset only after the transaction commits.
  // A crash before the ack means redelivery, and the dedup row makes it a no-op.
}`},{type:`paragraph`,text:`The key is that the dedup record and the business change commit **atomically**. Checking "have I seen this?" in Redis and then writing to Postgres separately leaves a window where a crash causes either a lost update or a double apply.`},{type:`heading3`,text:`Other ways to be idempotent`},{type:`bullets`,items:["**Natural idempotency:** `SET status = PAID` is idempotent; `balance = balance + 10` is not. Prefer absolute state over increments where you can.","**Unique constraints:** a `UNIQUE (order_id)` on `payments` turns a duplicate into a constraint violation you can treat as success.","**Version checks:** apply only if `event.version > current.version`, which also handles out-of-order arrival.",'**External side effects:** you cannot put an email or a card charge in your DB transaction. Pass an idempotency key to the provider (for example Stripe\'s `Idempotency-Key` header derived from the order ID), or record "email sent for event X" and accept a tiny window where a crash may send twice.']},{type:`heading3`,text:`What Kafka exactly-once actually covers`},{type:`paragraph`,text:"The idempotent producer prevents duplicates from producer retries within a session, and transactions let a consumer read from topic A, write to topic B and commit its offsets atomically. Consumers reading with `read_committed` see only committed output. Once your handler writes to Postgres, calls an HTTP API or sends an email, you are outside that guarantee and back to idempotent consumers."},{type:`callout`,variant:`warning`,text:`Common mistake: claiming "we use exactly-once delivery" because the broker advertises it (SQS FIFO deduplication, Kafka EOS). SQS FIFO dedup works only within a 5-minute window on the send side, and neither protects you from a consumer crashing between its side effect and its ack.`},{type:`callout`,variant:`tip`,text:`Interview tip: explain the two-generals style ambiguity in one sentence, then say "at-least-once delivery plus idempotent processing", show the atomic dedup insert, and scope Kafka EOS precisely. Mention cleaning up old dedup rows after a retention period longer than the maximum redelivery window.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Where does the message ID come from, and why must the producer generate it (not the broker)?`,"How do you make an HTTP `POST /payments` endpoint idempotent for client retries?",`How long do you keep processed-message records?`]}]},"preserve-message-ordering":{summary:"Global ordering does not scale, so you order only what needs ordering: per entity. In Kafka, ordering is guaranteed **within a partition**, so you key messages by the entity ID (e.g. `orderId`) and all events for that order land in the same partition and are consumed by one consumer in sequence. In SQS FIFO, ordering is per **message group ID**. You must also keep ordering on the producer side (no parallel unordered sends) and the consumer side (no concurrent processing of the same key).",details:[{type:`paragraph`,text:"Scenario: `OrderPlaced`, `OrderPaid`, `OrderShipped` for order 42 must be applied in that order, but events for order 42 and order 43 are independent. Keying by order ID gives per-order ordering while letting different orders process in parallel across partitions or groups."},{type:`heading3`,text:`Kafka with kafkajs`},{type:`code`,lang:`typescript`,code:`import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'orders', brokers: ['broker:9092'] });

// Idempotent producer: retries cannot duplicate or reorder within a partition
const producer = kafka.producer({ idempotent: true, maxInFlightRequests: 1 });

await producer.send({
  topic: 'order-events',
  acks: -1,
  messages: [{ key: order.id, value: JSON.stringify({ type: 'OrderPaid', version: 2 }) }],
});

const consumer = kafka.consumer({ groupId: 'shipping' });
await consumer.subscribe({ topic: 'order-events' });
await consumer.run({
  // Different partitions may run concurrently; messages within a partition are sequential
  partitionsConsumedConcurrently: 4,
  eachMessage: async ({ message }) => {
    await applyEvent(JSON.parse(message.value!.toString()));
  },
});`},{type:`bullets`,items:[`The default partitioner hashes the key, so the same key maps to the same partition **as long as the partition count does not change**. Adding partitions remaps keys; plan the count up front or migrate deliberately.`,`Parallelism is capped by partition count: one consumer per partition per group. A hot key (one huge tenant) cannot be spread out without losing its ordering.`,"Do not fan messages out to a worker pool inside `eachMessage` without keeping per-key queues, or you throw the ordering away yourself."]},{type:`heading3`,text:`SQS FIFO`},{type:`code`,lang:`typescript`,code:`import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

await sqs.send(
  new SendMessageCommand({
    QueueUrl: process.env.ORDER_EVENTS_FIFO_URL, // name ends with .fifo
    MessageBody: JSON.stringify(evt),
    MessageGroupId: evt.orderId, // ordering scope
    MessageDeduplicationId: evt.eventId, // dedup within the 5-minute window
  }),
);`},{type:`bullets`,items:[`While a message from a group is in flight, later messages in that group are not delivered. A message that keeps failing blocks its group until it is moved to a DLQ, which is the price of ordering.`,`FIFO queues have lower throughput limits than standard queues; many distinct group IDs plus high-throughput mode help.`,`Standard SQS gives only best-effort ordering, and SNS/EventBridge fan-out does not preserve order unless you use FIFO variants end to end.`]},{type:`heading3`,text:`Defensive ordering on the consumer`},{type:`paragraph`,text:"Even with keyed partitions, upstream bugs, retries through a DLQ or replays can deliver out of order. Put a per-entity `version` or sequence number in each event and apply only newer versions (or buffer until the gap is filled). This also makes consumers idempotent."},{type:`callout`,variant:`warning`,text:`Common mistake: assuming a topic or queue is "ordered" globally. Kafka orders per partition only, SQS FIFO per message group only, and a retry topic or DLQ redrive puts a failed message behind newer ones for the same key.`},{type:`callout`,variant:`tip`,text:`Interview tip: say "order per entity, not globally", pick the key, explain partition-count changes and hot keys, and add consumer-side versioning as a safety net. That shows you know where ordering silently breaks.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`What happens to ordering when one message for a key fails and you retry later?`,`How do you scale beyond the partition count?`,`How does the outbox relay preserve per-aggregate order?`]}]},"dead-letter-queues-and-poison-messages":{summary:`A **poison message** is one that fails every time it is processed (bad schema, a bug, missing reference data), so retrying it forever blocks the queue or burns capacity. A **dead-letter queue (DLQ)** is where such messages go after a bounded number of attempts, so healthy traffic keeps flowing. The real work is around it: classify errors as transient or permanent, alert on DLQ depth, keep enough context to debug, and have a safe redrive process once the fix ships.`,details:[{type:`heading3`,text:`How the major brokers do it`},{type:`bullets`,items:["**SQS:** a redrive policy with `maxReceiveCount`; after that many receives without a delete, SQS moves the message to the DLQ. Set the DLQ retention longer than the source queue, and use DLQ redrive to send messages back once fixed.","**RabbitMQ:** a dead-letter exchange (`x-dead-letter-exchange`) receives messages that are rejected without requeue or expire; quorum queues can enforce a delivery limit.","**Kafka:** there is no built-in DLQ for consumers. You publish failed records to your own `orders.dlq` topic (often after a retry topic) and commit the offset so the partition can move on."]},{type:`heading3`,text:`Classify before you retry`},{type:`code`,lang:`typescript`,code:`class PermanentError extends Error {}

async function handle(record: KafkaMessage) {
  let evt: OrderEvent;
  try {
    evt = OrderEventSchema.parse(JSON.parse(record.value!.toString())); // zod
  } catch (e) {
    throw new PermanentError(\`invalid payload: \${(e as Error).message}\`);
  }
  await applyEvent(evt); // DB / HTTP errors here are usually transient
}

async function eachMessage({ topic, partition, message }: EachMessagePayload) {
  const attempts = Number(message.headers?.['x-attempts']?.toString() ?? '0');
  try {
    await handle(message);
  } catch (err) {
    const permanent = err instanceof PermanentError || attempts >= 5;
    await producer.send({
      topic: permanent ? 'order-events.dlq' : 'order-events.retry',
      messages: [{
        key: message.key,
        value: message.value,
        headers: {
          ...message.headers,
          'x-attempts': String(attempts + 1),
          'x-error': String((err as Error).message).slice(0, 500),
          'x-source': \`\${topic}/\${partition}/\${message.offset}\`,
        },
      }],
    });
    // Returning normally lets kafkajs commit the offset, so the partition is not blocked
  }
}`},{type:`paragraph`,text:`Validation errors and unknown event types are **permanent**: retrying will not help, so dead-letter immediately. Timeouts, 503s and deadlocks are **transient**: retry with backoff (a delayed retry topic, or SQS visibility timeout) before giving up. Retrying a permanent error five times just delays the alert.`},{type:`heading3`,text:`Operating a DLQ`},{type:`numbered`,items:[`**Alert** on DLQ depth > 0 or on the age of the oldest message. A DLQ nobody watches is data loss with extra steps.`,`**Keep context**: original topic/offset or message ID, error message, attempt count, timestamps, trace ID.`,`**Fix, then redrive** in a controlled way (rate-limited, idempotent consumers), never by hand-editing payloads in production without an audit trail.`,`**Decide on ordering**: moving one event for order 42 to the DLQ while later events continue can corrupt state. Either park the whole key (stop processing that key until resolved) or make consumers version-aware.`,`**Set retention** so messages do not expire before someone looks at them.`]},{type:`callout`,variant:`warning`,text:`Common mistake: catching every error and acking it "so the queue does not get stuck". That silently drops messages. Equally bad is requeueing forever, which turns one poison message into a hot loop that starves everything behind it.`},{type:`callout`,variant:`tip`,text:`Interview tip: a strong answer covers bounded retries, transient vs permanent classification, alerting on DLQ depth, a redrive runbook, and the ordering trade-off of dead-lettering one message of a key.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you implement delayed retries in Kafka, which has no per-message delay?`,`How do you redrive 50,000 DLQ messages without overloading the downstream service?`,`What is the risk of a too-short SQS visibility timeout?`]}]},"retries-timeouts-and-retry-storms":{summary:"Every remote call needs a **timeout**, retries should be limited to transient failures on **idempotent** operations, and spaced with **exponential backoff plus jitter** so clients do not retry in lockstep. Retry storms happen when every layer retries and a struggling dependency suddenly receives several times its normal load; you prevent them with a single retrying layer, a retry budget, deadline propagation, honouring `Retry-After`, and a circuit breaker.",details:[{type:`heading3`,text:`How it goes wrong`},{type:`paragraph`,text:`Checkout calls Orders, which calls Inventory, which calls the database. If each layer retries 3 times (4 attempts), one user request can become 4 × 4 × 4 = 64 database calls when the DB is slow. The slowdown triggers timeouts, timeouts trigger retries, retries add load, and the DB never recovers. Without jitter, thousands of clients retry at the same instant after each backoff step, producing synchronized spikes.`},{type:`heading3`,text:`Rules that work together`},{type:`numbered`,items:["**Timeouts are mandatory** and must shrink as you go deeper: if the edge allows 3 s, the inner call cannot have a 5 s timeout. Propagate a deadline and give each call `min(own timeout, remaining budget)`.","**Retry only retryable errors:** network errors, 502/503/504, 429 (respect `Retry-After`). Do not retry 400/401/404/409.","**Retry only idempotent operations**, or make them idempotent with an idempotency key. Retrying a non-idempotent `POST /charge` after a timeout can double charge, because the first attempt may have succeeded.",`**Retry in one layer**, usually the one closest to the caller with the most context, and let inner layers fail fast.`,`**Exponential backoff with jitter**, capped, with a small max attempts count.`,`**Retry budget:** retries may add at most ~10% extra load; beyond that, fail instead of retrying.`,`**Circuit breaker** (covered under Microservices) stops calls entirely when a dependency is clearly down.`]},{type:`code`,lang:`typescript`,code:`// Token-bucket style retry budget: each success earns 0.1 retry tokens
class RetryBudget {
  private tokens = 10;
  onSuccess() { this.tokens = Math.min(100, this.tokens + 0.1); }
  tryConsume() { if (this.tokens < 1) return false; this.tokens -= 1; return true; }
}

const RETRYABLE = new Set([429, 502, 503, 504]);

async function callWithRetry(
  url: string,
  init: RequestInit & { idempotencyKey?: string },
  budget: RetryBudget,
  deadline: number, // epoch ms propagated from the incoming request
  maxAttempts = 3,
): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('deadline exceeded');
    try {
      const res = await fetch(url, {
        ...init,
        headers: { ...init.headers, ...(init.idempotencyKey && { 'Idempotency-Key': init.idempotencyKey }) },
        signal: AbortSignal.timeout(Math.min(1000, remaining)),
      });
      if (!RETRYABLE.has(res.status)) { budget.onSuccess(); return res; }
      if (attempt >= maxAttempts || !budget.tryConsume()) return res;
      const retryAfter = Number(res.headers.get('retry-after')) * 1000 || 0;
      await sleep(Math.max(retryAfter, fullJitter(attempt)));
    } catch (err) {
      if (attempt >= maxAttempts || !budget.tryConsume()) throw err;
      await sleep(fullJitter(attempt));
    }
  }
}

// "Full jitter": random delay between 0 and the exponential cap
const fullJitter = (attempt: number, base = 100, cap = 2000) =>
  Math.random() * Math.min(cap, base * 2 ** attempt);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));`},{type:`paragraph`,text:`Server-side protections matter as much: load shedding (reject early with 503 when queues are deep), rate limiting per client, and bounded connection pools stop a storm from becoming an outage. For queue consumers, the same ideas apply with visibility timeouts or retry topics instead of in-process sleeps.`},{type:`callout`,variant:`warning`,text:`Common mistake: retrying a non-idempotent call on timeout. A timeout means "I do not know whether it happened", not "it failed". Without an idempotency key the retry can create a second order or charge.`},{type:`callout`,variant:`tip`,text:"Interview tip: walk through the multiplication effect across layers, then name the fixes: timeout budgets that shrink with depth, one retrying layer, exponential backoff with jitter, a retry budget, `Retry-After`, idempotency keys, and a circuit breaker."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you pick timeout values (p99 latency of the dependency plus headroom)?`,`Why is jitter needed even with exponential backoff?`,`What does a hedged request do, and when is it dangerous?`]}]},"kafka-vs-rabbitmq-or-sqs":{summary:`Kafka is a **distributed, partitioned log**: messages are appended and retained for a configured time regardless of consumption, and each consumer group tracks its own offset, so many independent consumers can read and **replay** the same data. RabbitMQ and SQS are **queues**: a message is delivered to one consumer and removed once acknowledged, with richer per-message features (routing, priorities, delays, per-message retry). Use Kafka for event streams, fan-out to many consumers and replay; use a queue for task distribution and work that is consumed once.`,details:[{type:`heading3`,text:`Core differences`},{type:`bullets`,items:[`**Storage model:** Kafka keeps messages on disk for a retention period (or forever with log compaction keeping the latest value per key). Queues delete messages after ack; SQS keeps unconsumed messages up to 14 days at most.`,`**Consumption:** Kafka consumers pull and commit an **offset** per partition; acknowledging is "I have processed up to here". Queues track each message individually (ack/nack, visibility timeout).`,`**Fan-out:** in Kafka, every consumer group gets the full stream independently. With queues you fan out via exchanges (RabbitMQ) or SNS → multiple SQS queues.`,`**Ordering and parallelism:** Kafka orders per partition and parallelism is bounded by partition count. Queues allow any number of competing consumers but standard SQS only gives best-effort ordering.`,`**Per-message features:** RabbitMQ and SQS offer per-message delays, priorities (RabbitMQ), TTL, dead-lettering and flexible routing. Kafka has none of these per message; you build retries with extra topics.`,`**Replay:** Kafka lets you reset a group's offset to reprocess history, which is how you rebuild a read model or backfill a new service. A queue cannot replay consumed messages.`,`**Operations:** SQS is fully managed with almost no tuning; Kafka (even managed, e.g. MSK or Confluent Cloud) needs partition planning, retention sizing and consumer-lag monitoring.`]},{type:`heading3`,text:`Same scenario, two designs`},{type:`paragraph`,text:"Order placed → payment → inventory → email. With **Kafka**, Orders publishes `OrderPlaced` to `order-events` keyed by order ID. Payments, Inventory, Notifications and Analytics are separate consumer groups, each reading the full stream at its own pace; a new Fraud service added next year can start from the earliest retained offset. With **SQS**, Orders publishes to an SNS topic that fans out to one queue per consumer; each queue is a work list, messages disappear after processing, and the email worker can use per-message delays and a DLQ out of the box."},{type:`code`,lang:`typescript`,code:`// Kafka: a new consumer group can replay history
const fraud = kafka.consumer({ groupId: 'fraud-v1' });
await fraud.subscribe({ topic: 'order-events', fromBeginning: true });

// SQS: competing workers drain a work queue; each message handled once (at-least-once)
const { Messages = [] } = await sqs.send(
  new ReceiveMessageCommand({ QueueUrl: EMAIL_QUEUE, MaxNumberOfMessages: 10, WaitTimeSeconds: 20 }),
);
for (const m of Messages) {
  await sendEmail(JSON.parse(m.Body!));
  await sqs.send(new DeleteMessageCommand({ QueueUrl: EMAIL_QUEUE, ReceiptHandle: m.ReceiptHandle! }));
}`},{type:`heading3`,text:`How to choose`},{type:`bullets`,items:[`**Kafka:** high-throughput event streams, many consumers of the same events, event sourcing/CDC pipelines, replay and backfills, stream processing.`,`**RabbitMQ:** complex routing (topic/header exchanges), request/reply, priorities, per-message TTL, moderate throughput, low latency.`,`**SQS:** simple background jobs on AWS with zero ops, autoscaling workers, built-in DLQ and delays.`,`The lines blur (RabbitMQ Streams, Kafka share groups being added), so justify by required features, not brand.`]},{type:`callout`,variant:`warning`,text:`Common mistake: using Kafka as a job queue for slow, independent tasks. One slow message blocks its partition, and you cannot add more workers than partitions. A queue with competing consumers fits that workload better.`},{type:`callout`,variant:`tip`,text:`Interview tip: lead with "log vs queue": retention and replay, offsets per consumer group, per-partition ordering vs per-message ack. Then justify a choice for a concrete workload and mention the operational cost.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`What is consumer lag and how do you alert on it?`,`What is log compaction and when would you use it?`,`How would you implement delayed retries in Kafka?`]}]},"leader-election-and-distributed-locks":{summary:`Use a system built for coordination (etcd, ZooKeeper, Consul, Kubernetes Lease objects, or a database lock) and always hold the lock as a **lease with a TTL**, so a crashed holder does not block forever. The hard part is that a lease can expire while the holder is still running (GC pause, network delay, clock jump), so two nodes believe they are leader. The safe fix is a **fencing token**: a monotonically increasing number issued with each lease that the protected resource checks, rejecting writes from older tokens.`,details:[{type:`heading3`,text:`Typical uses`},{type:`bullets`,items:[`Only one instance runs the nightly billing job or the outbox relay for a shard.`,`Only one worker processes a given order at a time.`,`A single leader owns a scarce resource (a WebSocket connection to a vendor, a scheduler).`]},{type:`heading3`,text:`Options`},{type:`bullets`,items:["**Postgres advisory locks** (`pg_try_advisory_lock(key)`): simple if you already have Postgres; the lock is tied to the DB session, so it is released if the connection dies. Watch out for connection poolers in transaction mode, which break session-level locks.",`**etcd / ZooKeeper / Consul:** consensus-backed leases with revisions or sequence numbers you can use as fencing tokens. The right choice when correctness matters.`,`**Kubernetes Lease objects:** standard for leader election among pods (what controllers use).`,"**Redis `SET key value NX PX ttl`:** fast and fine for **efficiency** locks (avoid doing the same work twice) but not a correctness guarantee on its own."]},{type:`heading3`,text:`Redis lock done carefully`},{type:`code`,lang:`typescript`,code:`import { randomUUID } from 'node:crypto';

async function withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
  const owner = randomUUID();
  const ok = await redis.set(key, owner, 'PX', ttlMs, 'NX');
  if (ok !== 'OK') return null; // someone else holds it

  try {
    return await fn();
  } finally {
    // Delete only if we still own it; a plain DEL could remove another holder's lock
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1, key, owner,
    );
  }
}`},{type:`heading3`,text:`What can go wrong, and fencing tokens`},{type:`paragraph`,text:`Worker A takes the lock with a 10 s TTL, then hits a 15 s GC pause. The lease expires, worker B takes the lock and writes. A wakes up, still thinks it holds the lock, and writes stale data. Nothing in the lock service can stop A, because A is not talking to it. The protected resource has to check.`},{type:`code`,lang:`typescript`,code:`// The lock service issues an increasing token with each grant
// (e.g. etcd revision, ZooKeeper zxid, or a DB sequence)
const { token } = await lockService.acquire('invoice-run:2026-11');

// The resource rejects writes from older holders
const res = await db.query(
  \`UPDATE invoice_runs
      SET status = 'DONE', fencing_token = $2
    WHERE id = $1 AND fencing_token < $2\`,
  ['2026-11', token],
);
if (res.rowCount === 0) throw new Error('stale lock holder, aborting');`},{type:`callout`,variant:`warning`,text:`Redlock caveat: acquiring the lock on a majority of independent Redis nodes does not by itself produce fencing tokens and relies on timing assumptions (bounded pauses, clock drift). Use it, or any Redis lock, for efficiency; use a consensus store with fencing, or a DB constraint, when a double execution would corrupt data.`},{type:`paragraph`,text:"Often you can avoid a lock entirely: a unique constraint, a conditional update (`WHERE status = 'PENDING'`), `SELECT ... FOR UPDATE SKIP LOCKED` job claiming, or routing all work for a key to one Kafka partition gives single-writer semantics without a separate lock service."},{type:`callout`,variant:`tip`,text:`Interview tip: distinguish efficiency locks from correctness locks, explain the GC-pause scenario, and name fencing tokens. Bonus points for "first try to remove the need for a lock with a constraint or conditional write".`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you choose the TTL, and should the holder renew it?`,`What happens to your Postgres advisory lock behind PgBouncer in transaction mode?`,`How would you elect a leader among pods in Kubernetes?`]}]},"trace-a-request-across-services":{summary:"Assign a **trace ID** at the edge and propagate it with every hop, using the W3C `traceparent` header for HTTP and message headers for queues; each service creates **spans** for its work under that trace and exports them to a backend (Jaeger, Tempo, Datadog, X-Ray). In Node.js, the OpenTelemetry SDK with auto-instrumentation handles HTTP, Express, Postgres and many clients, and `AsyncLocalStorage` carries the context through async code. Put the trace ID in every log line so logs and traces join up.",details:[{type:`paragraph`,text:"Scenario: a user reports that checkout took 8 seconds. The request crossed the API gateway, Orders, Payments (calling Stripe), an `OrderPlaced` Kafka event, Inventory and Notifications. With tracing you open one trace and see a waterfall: which span was slow, which errored, which retries happened. Without it you grep five log stores by timestamp."},{type:`heading3`,text:`Setting up OpenTelemetry in Node`},{type:`code`,lang:`typescript`,code:`// tracing.ts, loaded before the app (node --import ./tracing.js server.js)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

new NodeSDK({
  serviceName: 'orders-service',
  traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4318/v1/traces' }),
  instrumentations: [getNodeAutoInstrumentations()], // http, express, pg, redis, ...
}).start();`},{type:`paragraph`,text:"Instrumentation must load before the modules it patches, which is why it runs via `--import`/`--require` rather than being imported halfway through `server.ts`. Outgoing HTTP calls then automatically carry a header like `traceparent: 00-<32 hex trace id>-<16 hex parent span id>-01`, and the receiving service continues the same trace."},{type:`heading3`,text:`Propagating through messages`},{type:`code`,lang:`typescript`,code:`import { context, propagation, trace, SpanKind } from '@opentelemetry/api';

const tracer = trace.getTracer('orders');

// Producer: inject the current context into Kafka headers
const headers: Record<string, string> = {};
propagation.inject(context.active(), headers);
await producer.send({ topic: 'order-events', messages: [{ key: order.id, value, headers }] });

// Consumer: extract it and start a span as a child of the producer
await consumer.run({
  eachMessage: async ({ message }) => {
    const carrier = Object.fromEntries(
      Object.entries(message.headers ?? {}).map(([k, v]) => [k, v?.toString() ?? '']),
    );
    const parent = propagation.extract(context.active(), carrier);
    await tracer.startActiveSpan('order-events process', { kind: SpanKind.CONSUMER }, parent, async (span) => {
      try { await handle(message); }
      catch (e) { span.recordException(e as Error); throw e; }
      finally { span.end(); }
    });
  },
});`},{type:`paragraph`,text:"If your outbox relay publishes the event later, store the `traceparent` in the outbox row so the trace survives the hop. For batch consumers processing messages from many traces, use **span links** instead of a single parent."},{type:`heading3`,text:`Making it useful in production`},{type:`bullets`,items:["**Correlate logs:** add `trace_id` and `span_id` to every log line (pino with the OTel log instrumentation), so a trace links to its logs and vice versa.",`**Sampling:** head sampling (e.g. 5% at the edge) keeps cost down; tail sampling in the OpenTelemetry Collector keeps all errors and slow traces, which are the ones you need.`,`**Attributes, not PII:** add order ID, tenant, retry attempt; never card numbers or tokens.`,"**Context loss:** custom callback-based code, some connection pools or manual promise queues can lose `AsyncLocalStorage` context, giving orphan spans; check traces for gaps."]},{type:`callout`,variant:`warning`,text:`Common mistake: generating a new request ID in each service, or propagating it only over HTTP. The trace breaks at the first queue, which is exactly where the hard-to-debug latency usually hides.`},{type:`callout`,variant:`tip`,text:`Interview tip: mention W3C Trace Context, OpenTelemetry auto-instrumentation loaded first, propagation through message headers (and the outbox), log correlation via trace ID, and tail sampling to keep errors and slow requests.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you decide what to sample, and what does it cost?`,`How do you connect a frontend click to the backend trace?`,`What is the difference between traces, metrics and logs, and when do you reach for each?`]}]}};export{e as answers};