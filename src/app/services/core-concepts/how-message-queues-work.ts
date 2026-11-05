import type { CoreConcept } from '../core-concepts-data';

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 14 — How Message Queues Work
// ─────────────────────────────────────────────────────────────────────────────
export const howMessageQueuesWork: CoreConcept = {
  id: 'how-message-queues-work',
  title: 'How Message Queues Work',
  emoji: '📬',
  icon: 'ti-mail-forward',
  color: '#c026d3',
  bg: '#fae8ff',
  accentGlow: 'rgba(192,38,211,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Queues, pub/sub, Kafka logs, acks, retries, dead-letter queues and the outbox — how services talk without waiting on each other.',
  tags: [
    'Async Processing',
    'Pub/Sub',
    'Kafka',
    'Delivery Guarantees',
    'Dead-Letter Queue',
    'Outbox Pattern',
  ],
  estimatedTime: '45 min',
  sections: [
    {
      id: 'what-is-it',
      title: 'What Is It?',
      icon: 'ti-question-mark',
      blocks: [
        {
          type: 'paragraph',
          text: 'A message queue is a piece of infrastructure (a "broker") that sits between the services that produce work and the services that do it. A producer writes a small message — "order 789 was placed", "resize image 42", "send welcome email to user 123" — and moves on immediately. The broker stores the message safely until a consumer picks it up, processes it and confirms it is done. The producer and consumer never talk to each other directly, and they do not even need to be running at the same time.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: a message queue is like the order rail in a busy restaurant kitchen. The waiter (producer) clips an order ticket to the rail and goes back to the customers — they do not stand at the stove waiting. Cooks (consumers) take tickets off the rail one at a time, at whatever pace they can manage. If ten tables order at once, the tickets just pile up on the rail instead of the waiter being stuck. If a cook goes on break, the tickets wait for the next cook.',
        },
        {
          type: 'flow',
          title: 'The big picture — producers, broker, consumers',
          code: `flowchart LR
  P1([Checkout API]):::client -->|"publish OrderPlaced"| B
  P2([Signup API]):::client -->|"publish UserSignedUp"| B
  subgraph B["Message broker"]
    direction TB
    Q1[[orders queue]]:::queue
    Q2[[emails queue]]:::queue
  end
  Q1 -->|"pull, process, ack"| C1[Payment worker]:::server
  Q2 -->|"pull, process, ack"| C2[Email worker]:::server
  C1 --> DB[(Database)]:::db
  C2 --> EXT[Email provider]:::external`,
          text: 'Producers only know the broker. Consumers only know the broker. That single indirection is what makes the whole system loosely coupled.',
        },
        { type: 'heading2', text: 'Three Families of Messaging Systems' },
        {
          type: 'bullets',
          items: [
            'Point-to-point work queues: each message is handled by exactly one consumer, then deleted. Examples: Amazon SQS, RabbitMQ queues, BullMQ (on Redis). Best for background jobs — "do this task once".',
            'Publish/subscribe (pub/sub): one message is copied to every subscriber. Examples: Amazon SNS, Google Pub/Sub, RabbitMQ fanout exchanges, Redis Pub/Sub. Best for broadcasting "this happened" to many interested services.',
            'Log-based streams: messages are appended to a durable, ordered log and kept for days. Consumers read at their own position and can rewind. Examples: Apache Kafka, Amazon Kinesis, Redpanda, Apache Pulsar. Best for high-volume event streams, analytics and replay.',
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
          text: 'Imagine a checkout endpoint that, before responding, charges the card, reserves stock, sends a confirmation email, updates analytics and notifies the warehouse — all synchronously. Each call adds latency (say 100–800ms each), and if any one of them is down, the whole checkout fails. The customer does not care whether the analytics event was recorded before they saw "Order confirmed". A queue lets you do only the essential work on the request path and push everything else to the background.',
        },
        {
          type: 'flow',
          title: 'Synchronous chain vs. publish-and-return',
          code: `sequenceDiagram
  participant U as User
  participant API as Checkout API
  participant Q as Broker
  participant E as Email service
  participant A as Analytics
  Note over U,A: Synchronous - user waits for everything
  U->>API: POST /checkout
  API->>E: send email (600 ms)
  API->>A: record event (200 ms)
  API-->>U: 201 after about 1 second
  Note over U,A: Asynchronous - user waits only for the essentials
  U->>API: POST /checkout
  API->>Q: publish OrderPlaced (about 5 ms)
  API-->>U: 201 after about 60 ms
  Q-)E: deliver later
  Q-)A: deliver later`,
          text: 'The asynchronous version responds roughly 15× faster, and a slow or broken email service no longer affects checkout at all.',
        },
        { type: 'heading2', text: 'The Four Big Wins' },
        {
          type: 'bullets',
          items: [
            'Decoupling: the producer does not know who consumes its messages, how many consumers there are, or where they run. You can add a new consumer (say, a fraud detector) without changing the producer.',
            'Buffering spikes (load levelling): a flash sale might produce 50,000 orders a minute while your workers handle 10,000. The queue absorbs the burst and the workers drain it over the next few minutes instead of falling over.',
            'Reliable retries: if a consumer crashes or a downstream API times out, the message stays in the queue and is delivered again. Work is not lost just because one process died.',
            'Slow work off the request path: video transcoding, PDF generation, sending emails, calling slow third-party APIs — anything that takes seconds should not keep an HTTP request open.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Queues are not free. You trade immediate consistency for eventual consistency, you add a new piece of infrastructure to operate, and debugging becomes harder because one user action now spreads across several services and several seconds. Only go async for work that genuinely does not need to finish before you reply.',
        },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: 'ti-settings',
      blocks: [
        { type: 'heading2', text: 'Point-to-Point: Competing Consumers' },
        {
          type: 'paragraph',
          text: 'In a work queue, several identical workers pull from the same queue. Each message goes to only one of them — they "compete" for messages. To process faster, you simply add more workers. Once a worker confirms the message is done, the broker deletes it.',
        },
        {
          type: 'flow',
          title: 'Competing consumers on one queue',
          code: `flowchart LR
  P([Producer]):::client --> Q[[resize-images queue<br/>m1 m2 m3 m4 m5 m6]]:::queue
  Q -->|"m1, m4"| W1[Worker 1]:::server
  Q -->|"m2, m5"| W2[Worker 2]:::server
  Q -->|"m3, m6"| W3[Worker 3]:::server`,
          text: 'Each message is processed once by one worker. Three workers means roughly three times the throughput.',
        },
        { type: 'heading2', text: 'Pub/Sub: Fan-Out to Every Subscriber' },
        {
          type: 'paragraph',
          text: 'In pub/sub, a producer publishes to a topic, and every subscription on that topic receives its own copy. A common pattern (for example SNS → SQS, or a RabbitMQ fanout exchange) is to give each subscribing service its own queue, so each service still gets competing consumers and retries internally, without affecting the others.',
        },
        {
          type: 'flow',
          title: 'Fan-out — one event, one copy per subscriber',
          code: `flowchart LR
  P([Order service]):::client -->|"OrderPlaced"| T{{orders topic}}:::network
  T --> QP[[payment queue]]:::queue --> SP[Payment service]:::server
  T --> QI[[inventory queue]]:::queue --> SI[Inventory service]:::server
  T --> QE[[email queue]]:::queue --> SE[Email service]:::server`,
        },
        { type: 'heading2', text: 'Log-Based Streams: Kafka' },
        {
          type: 'paragraph',
          text: 'Kafka works differently. A topic is split into partitions, and each partition is an append-only log on disk. Every message gets an increasing number in its partition called an offset. Consumers do not delete messages — they just remember (commit) the offset they have read up to. Messages are kept for a configured retention period (7 days by default), so a new consumer can start from the beginning and replay history, and a buggy consumer can be rewound and re-run.',
        },
        {
          type: 'bullets',
          items: [
            'Partition key: when a producer sends a message with a key (e.g. orderId or userId), Kafka hashes the key to pick the partition. The same key always lands in the same partition.',
            'Ordering: Kafka guarantees order only within a single partition. Messages in different partitions can be processed in any relative order.',
            'Consumer group: a set of consumers sharing a group id. Each partition is assigned to exactly one consumer in the group, so the group splits the work. Different groups (e.g. "email" and "analytics") each read the full topic independently — that is how Kafka does pub/sub.',
            'Parallelism limit: a group can have at most one active consumer per partition. A topic with 12 partitions can be processed by at most 12 consumers in one group; a 13th sits idle.',
          ],
        },
        {
          type: 'flow',
          title: 'Kafka — partitions, offsets and consumer groups',
          code: `flowchart LR
  P([Producer<br/>key = orderId]):::client -->|"hash key"| T
  subgraph T["Topic: orders"]
    direction TB
    P0["Partition 0<br/>offsets 0..1041"]:::queue
    P1["Partition 1<br/>offsets 0..987"]:::queue
    P2["Partition 2<br/>offsets 0..1103"]:::queue
  end
  subgraph G1["Group: email-service"]
    E1[Consumer A]:::server
    E2[Consumer B]:::server
  end
  subgraph G2["Group: analytics"]
    A1[Consumer X]:::server
  end
  P0 --> E1
  P1 --> E1
  P2 --> E2
  P0 -.-> A1
  P1 -.-> A1
  P2 -.-> A1`,
          text: 'Inside a group, partitions are shared out. Across groups, everyone sees everything — each group keeps its own committed offsets.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Choosing a partition key is a design decision. Key by orderId and all events for one order stay in sequence (Created → Paid → Shipped). Key by something with few values (like country) and one partition becomes a "hot" bottleneck while others sit idle. No key at all spreads load evenly but gives up ordering entirely.',
        },
        { type: 'heading2', text: 'Acknowledgements and Visibility Timeouts' },
        {
          type: 'paragraph',
          text: 'How does the broker know a message was actually processed, not just received? The consumer sends an acknowledgement (ack) after finishing. Until then, the message is "in flight". In SQS, a received message becomes invisible to other consumers for a visibility timeout (30 seconds by default). If the consumer deletes it in time, it is gone. If the consumer crashes or takes too long, the timeout expires and the message reappears for another consumer. RabbitMQ does the same thing based on the consumer’s connection: unacked messages are redelivered if the channel closes.',
        },
        {
          type: 'flow',
          title: 'Receive, process, acknowledge — and what a crash looks like',
          code: `sequenceDiagram
  participant Q as Queue (SQS)
  participant W1 as Worker 1
  participant W2 as Worker 2
  W1->>Q: ReceiveMessage
  Q-->>W1: msg 42, hidden for 30 s
  W1->>W1: process
  W1->>Q: DeleteMessage 42 (ack)
  Note over Q: msg 42 gone for good
  W1->>Q: ReceiveMessage
  Q-->>W1: msg 43, hidden for 30 s
  Note over W1: crashes mid-processing
  Note over Q: 30 s pass with no delete
  W2->>Q: ReceiveMessage
  Q-->>W2: msg 43 again
  W2->>Q: DeleteMessage 43 (ack)`,
          text: 'Acknowledge after the work is done, never before. That is what turns a crash into a retry instead of lost work.',
        },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-Step Flow',
      icon: 'ti-list-numbers',
      blocks: [
        { type: 'heading2', text: 'The Life of One Message' },
        {
          type: 'numbered',
          items: [
            'Produce: the checkout service serializes {type: "OrderPlaced", orderId: 789, eventId: "evt_9f2"} to JSON and sends it to the broker.',
            'Persist: the broker writes the message to disk (and, in a cluster, copies it to replicas) before confirming. Kafka with acks=all waits for all in-sync replicas.',
            'Confirm to producer: the broker replies "stored". Only now is the producer allowed to assume the message is safe.',
            'Deliver: a consumer pulls (SQS, Kafka) or is pushed (RabbitMQ) the message. It is marked in-flight.',
            'Process: the consumer does the work — charge a card, write to a database, call an email API.',
            'Acknowledge: on success the consumer acks (SQS DeleteMessage, RabbitMQ basic.ack, Kafka offset commit).',
            'On failure: no ack. The message is redelivered after a delay, and the attempt counter goes up.',
            'Give up: after N attempts (say 5), the broker moves the message to a dead-letter queue (DLQ) so it stops blocking healthy work and a human can inspect it.',
          ],
        },
        { type: 'heading2', text: 'Retries with Exponential Backoff' },
        {
          type: 'paragraph',
          text: 'If a downstream service is struggling, retrying instantly just piles on more load. Exponential backoff waits longer after each failure — 1s, 2s, 4s, 8s, 16s — and jitter adds a little randomness so thousands of failed messages do not all retry in the same millisecond.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// BullMQ (Redis-backed job queue for Node.js)
import { Queue, Worker } from 'bullmq';

const connection = { host: 'localhost', port: 6379 };
const emailQueue = new Queue('emails', { connection });

// Producer: enqueue a job and return immediately
await emailQueue.add(
  'order-confirmation',
  { orderId: 789, to: 'alice@example.com' },
  {
    jobId: 'order-confirmation-789',              // de-duplicates repeat enqueues
    attempts: 5,                                  // try up to 5 times
    backoff: { type: 'exponential', delay: 1000 } // 1s, 2s, 4s, 8s...
  },
);

// Consumer: a worker process (can run many copies)
const worker = new Worker(
  'emails',
  async (job) => {
    await sendEmail(job.data.to, job.data.orderId); // throw = failed attempt
  },
  { connection, concurrency: 10 },
);

worker.on('failed', (job, err) => {
  console.error('email job failed', job?.id, err.message);
});`,
        },
        { type: 'heading2', text: 'Poison Messages and Dead-Letter Queues' },
        {
          type: 'paragraph',
          text: 'A poison message is one that will never succeed no matter how often you retry — malformed JSON, a reference to a deleted user, a bug triggered by one specific input. Without a limit, it would be retried forever, burning capacity and (in an ordered queue) blocking everything behind it. A dead-letter queue is the quarantine area: after the maximum number of attempts, the message is moved aside, an alert fires, and engineers can fix the bug and "redrive" the messages back into the main queue.',
        },
        {
          type: 'flow',
          title: 'Retry, back off, then dead-letter',
          code: `flowchart TD
  M([Message delivered]):::queue --> P[Consumer processes]:::server
  P --> R{Result?}
  R -->|"success"| ACK([Ack - message removed]):::highlight
  R -->|"permanent error<br/>bad payload"| DLQ
  R -->|"temporary error<br/>timeout, 503"| N{Attempts under 5?}
  N -->|"yes"| WAIT["Wait 2^attempt s + jitter"]:::queue --> M
  N -->|"no"| DLQ[[Dead-letter queue<br/>alert + manual review]]:::security
  DLQ -.->|"after the fix: redrive"| M`,
          text: 'Classify errors: retry the ones that might succeed later, dead-letter the ones that never will.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'A DLQ nobody watches is just a slower way of losing data. Alert on DLQ depth > 0, and make redriving messages a routine, tested operation.',
        },
      ],
    },
    {
      id: 'components',
      title: 'Components Involved',
      icon: 'ti-puzzle',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Producer: any service that publishes messages. Responsible for serializing, choosing a topic/queue and (for Kafka) a key.',
            'Broker: the server cluster that stores and routes messages — Kafka brokers, a RabbitMQ node, or a managed service like SQS.',
            'Queue / topic / partition: the named place messages live.',
            'Consumer / worker: the process that reads and handles messages. Usually scaled horizontally.',
            'Dead-letter queue: where messages go after too many failed attempts.',
            'Schema / contract: the agreed shape of each message (JSON Schema, Avro, Protobuf, often in a schema registry). Producers and consumers evolve independently, so the contract must stay backward compatible.',
          ],
        },
        { type: 'heading2', text: 'RabbitMQ: Exchanges Route, Queues Store' },
        {
          type: 'paragraph',
          text: 'In RabbitMQ, producers never publish directly to a queue. They publish to an exchange with a routing key, and bindings decide which queues get a copy. A direct exchange matches the key exactly, a topic exchange matches patterns like "order.*", and a fanout exchange copies to every bound queue. Consumers then read from queues and ack each message.',
        },
        {
          type: 'flow',
          title: 'RabbitMQ topic exchange routing',
          code: `flowchart LR
  P([Producer]):::client -->|"routing key order.placed"| X{{"Topic exchange: events"}}:::network
  X -->|"binding order.*"| Q1[[order-processing]]:::queue
  X -->|"binding #"| Q2[[audit-log]]:::queue
  X -.->|"binding user.* - no match"| Q3[[user-onboarding]]:::queue
  Q1 --> C1[Order worker]:::server
  Q2 --> C2[Audit worker]:::server`,
          text: 'The exchange is the post office sorting room; queues are the mailboxes. The binding pattern "#" matches every key.',
        },
        { type: 'heading2', text: 'Amazon SQS: Standard vs. FIFO' },
        {
          type: 'bullets',
          items: [
            'Standard queues: nearly unlimited throughput, at-least-once delivery (a message can occasionally arrive twice) and best-effort ordering (messages can arrive out of order).',
            'FIFO queues: strict order within a message group (MessageGroupId, e.g. one group per customer) and deduplication of repeated sends within a 5-minute window. Throughput is lower — roughly hundreds to a few thousand messages per second, depending on batching and high-throughput mode.',
            'Different message groups in a FIFO queue are processed in parallel, so the message group is the SQS equivalent of a Kafka partition key.',
          ],
        },
        { type: 'heading2', text: 'Kafka Producer and Consumer' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// kafkajs
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'checkout', brokers: ['kafka-1:9092'] });

// Producer — key by orderId so all events for one order stay in order
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'orders',
  messages: [
    { key: '789', value: JSON.stringify({ type: 'OrderPlaced', orderId: 789, eventId: 'evt_9f2' }) },
  ],
});

// Consumer — every instance with groupId 'email-service' shares the partitions
const consumer = kafka.consumer({ groupId: 'email-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ partition, message }) => {
    const event = JSON.parse(message.value!.toString());
    await handleOrderEvent(event); // offset is committed after this resolves
  },
});`,
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Push vs. pull: RabbitMQ pushes messages to consumers, limited by a prefetch count (how many unacked messages a consumer may hold). SQS and Kafka consumers pull — they ask for the next batch when ready. Either way, the consumer controls its own pace, which is the basis of backpressure.',
        },
      ],
    },
    {
      id: 'real-world-example',
      title: 'Real-World Example',
      icon: 'ti-device-laptop',
      blocks: [
        { type: 'heading2', text: 'Checkout Publishes OrderPlaced' },
        {
          type: 'paragraph',
          text: 'An online store’s checkout service saves the order and publishes one OrderPlaced event. Four independent services react to it: payment charges the card, inventory reserves stock, email sends a confirmation, and analytics updates dashboards. The checkout service does not know any of them exist.',
        },
        {
          type: 'flow',
          title: 'One event, four independent reactions',
          code: `flowchart LR
  U([Customer]):::client -->|"POST /checkout"| CO[Checkout service]:::server
  CO -->|"1. save order"| DB[(Orders DB)]:::db
  CO -->|"2. publish OrderPlaced"| T{{orders topic}}:::queue
  CO -->|"3. 201 Created"| U
  T --> PAY[Payment]:::security
  T --> INV[Inventory]:::server
  T --> EM[Email]:::server
  T --> AN[Analytics]:::server
  EM -.->|"calls"| SG[Email provider]:::external`,
        },
        { type: 'heading2', text: 'What Happens When the Email Service Is Down?' },
        {
          type: 'numbered',
          items: [
            'The email service crashes at 14:00. Checkout keeps working: it only needs the broker to accept the event.',
            'Payment, inventory and analytics keep consuming normally — each has its own queue or consumer group.',
            'OrderPlaced events for email pile up. Consumer lag for the email group grows: 0 → 4,000 → 12,000 messages.',
            'A lag alert fires. On-call engineers fix and redeploy the email service at 14:25.',
            'The email consumers resume from their last committed offset (or the messages still waiting in their queue) and work through the backlog in a few minutes.',
            'Customers get their confirmation emails 25 minutes late — but no order failed and no email was lost.',
          ],
        },
        {
          type: 'flow',
          title: 'Email outage — everyone else carries on',
          code: `sequenceDiagram
  participant CO as Checkout
  participant B as Broker
  participant P as Payment
  participant E as Email service
  CO->>B: OrderPlaced 789
  B-)P: deliver
  P->>B: ack
  B--xE: deliver fails, service is down
  Note over B: email backlog grows, others unaffected
  CO->>B: OrderPlaced 790, 791 ...
  B-)P: deliver
  Note over E: redeployed 25 min later
  E->>B: fetch from last committed position
  B-->>E: 789, 790, 791 ...
  E->>B: ack each after sending`,
          text: 'The broker turns a hard dependency into a soft one: an outage becomes a delay rather than an error.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Notice that the email may now be sent twice — if the service crashed after calling the provider but before acking, that message is redelivered. The email consumer should record "confirmation sent for order 789" and skip it the second time. See idempotent consumers below.',
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
          title: 'At a glance — a message from producer to dead-letter queue',
          code: `flowchart TB
  P([Producer]):::client -->|"1. publish"| B[Broker<br/>persist + replicate]:::queue
  B -->|"2. stored"| P
  B -->|"3. deliver"| C[Consumer group]:::server
  C -->|"4. idempotency check"| DS[(Processed-IDs table)]:::db
  C -->|"5. ack or commit offset"| B
  C -.->|"failure: no ack"| R[Retry with backoff]:::cache
  R -.-> B
  R -.->|"max attempts reached"| DLQ[[Dead-letter queue]]:::security`,
          text: 'The happy path is publish → store → deliver → process → ack. Everything else in this lesson exists to handle the unhappy paths.',
        },
        {
          type: 'diagram',
          diagram: {
            id: 'diagram-message-queue-lifecycle',
            title: 'Message Lifecycle Through a Broker',
            subtitle:
              'Tracing one OrderPlaced event from the producer, through durable storage, to consumers, retries and the dead-letter queue',
            nodes: [
              {
                id: 'producer-publish',
                name: 'Producer (Checkout Service)',
                subtitle: 'Publish & Await Broker Confirmation',
                type: 'client',
                icon: 'ti-send',
                badge: 'Producer',
                protocol: 'key = orderId',
                details: [
                  'Serializes {type: "OrderPlaced", orderId: 789, eventId: "evt_9f2"} to JSON',
                  'Chooses the topic and partition key so all events for one order stay in order',
                  'Treats the message as safe only after the broker confirms it was stored',
                ],
              },
              {
                id: 'broker-persist',
                name: 'Broker Persistence & Replication',
                subtitle: 'Append to Log, Copy to Replicas',
                type: 'storage',
                icon: 'ti-stack-2',
                badge: 'Durable Storage',
                protocol: 'acks = all',
                details: [
                  'Appends the message to the partition log on disk and assigns offset 1042',
                  'Replicates to follower brokers (commonly a replication factor of 3) before acknowledging',
                  'Retains the message for the retention period (e.g. 7 days), whether or not it has been consumed',
                ],
              },
              {
                id: 'consumer-group',
                name: 'Consumer Group (Email Service)',
                subtitle: 'Partition Assignment & Pull',
                type: 'server',
                icon: 'ti-users-group',
                badge: 'Consumers',
                protocol: 'Poll batch',
                details: [
                  'Each partition is owned by one consumer in the group; adding consumers (up to the partition count) adds parallelism',
                  'Consumer polls a batch, processes messages in partition order',
                ],
              },
              {
                id: 'idempotent-handler',
                name: 'Idempotent Handler',
                subtitle: 'Deduplicate Before Side Effects',
                type: 'database',
                icon: 'ti-fingerprint',
                badge: 'Exactly-once effect',
                protocol: 'INSERT ... ON CONFLICT',
                details: [
                  'Records eventId in a processed_events table in the same transaction as the side effect',
                  'If eventId already exists, the duplicate delivery is skipped harmlessly',
                ],
              },
              {
                id: 'ack-commit',
                name: 'Acknowledge / Commit Offset',
                subtitle: 'Mark Progress Only After Success',
                type: 'network',
                icon: 'ti-circle-check',
                badge: 'Ack',
                protocol: 'commit offset 1043',
                details: [
                  'Kafka: commit the next offset to read; SQS: DeleteMessage; RabbitMQ: basic.ack',
                  'A crash before this step means redelivery — at-least-once by design',
                ],
              },
              {
                id: 'retry-dlq',
                name: 'Retry & Dead-Letter Queue',
                subtitle: 'Backoff, Then Quarantine',
                type: 'security',
                icon: 'ti-alert-octagon',
                badge: 'Failure Path',
                protocol: 'max 5 attempts',
                details: [
                  'Temporary failures are retried with exponential backoff plus jitter',
                  'After the maximum attempts, the message moves to a DLQ, an alert fires, and engineers redrive it after a fix',
                ],
              },
            ],
            connections: [
              {
                from: 'producer-publish',
                to: 'broker-persist',
                label: '1. Publish OrderPlaced',
                protocol: 'TCP / TLS',
                type: 'sync',
              },
              {
                from: 'broker-persist',
                to: 'consumer-group',
                label: '2. Deliver batch',
                protocol: 'Pull / Push',
                type: 'async',
              },
              {
                from: 'consumer-group',
                to: 'idempotent-handler',
                label: '3. Dedup + process',
                protocol: 'DB transaction',
              },
              {
                from: 'idempotent-handler',
                to: 'ack-commit',
                label: '4. Success → ack',
                protocol: 'Commit',
              },
              {
                from: 'consumer-group',
                to: 'retry-dlq',
                label: 'Failure → retry or DLQ',
                protocol: 'Backoff',
                type: 'async',
              },
            ],
            keyTakeaways: [
              'Durability first: a message is only safe once the broker has persisted (and ideally replicated) it and confirmed to the producer.',
              'Ack last: acknowledging after processing gives at-least-once delivery. Duplicates are expected, so handlers must be idempotent.',
              'Failure is a first-class path: backoff protects struggling dependencies, and the DLQ stops one poison message from blocking everything else.',
            ],
            rawSpec: `Producer (Checkout)
   │  publish {OrderPlaced, orderId 789, eventId evt_9f2}, key=789
   ▼
Broker — topic "orders", partition = hash(789) % 6 = 3
   │  append at offset 1042, replicate to 2 followers, ack producer
   ▼
Consumer group "email-service" — consumer B owns partition 3
   │  poll → [1040, 1041, 1042]
   ▼
Handler
   │  BEGIN
   │    INSERT INTO processed_events(event_id) VALUES ('evt_9f2')  ← conflict? skip
   │    INSERT INTO email_outbox(...)
   │  COMMIT
   ▼
Commit offset 1043 for partition 3

Failure path:
   attempt 1 fails → wait ~1s → attempt 2 fails → wait ~2s → ...
   attempt 5 fails → move to orders.email.DLQ → alert`,
          },
        },
      ],
    },

    {
      id: 'behind-the-scenes',
      title: 'Behind the Scenes',
      icon: 'ti-eye',
      blocks: [
        { type: 'heading2', text: 'Delivery Guarantees' },
        {
          type: 'bullets',
          items: [
            'At-most-once: ack (or commit) before processing. A crash loses the message, but it is never processed twice. Acceptable for metrics or log lines where a small loss is fine.',
            'At-least-once: process, then ack. A crash after processing but before the ack causes redelivery, so duplicates happen. This is the default for SQS standard queues, RabbitMQ with manual acks, and typical Kafka consumers.',
            '"Exactly-once": the broker cannot guarantee your side effects (an email sent, a card charged) happen exactly once — the network can always fail between doing the work and recording that it was done. Kafka offers exactly-once semantics for read-process-write pipelines that stay inside Kafka (idempotent producers + transactions), but once you touch an external system you are back to at-least-once.',
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The practical answer to "exactly-once" is: at-least-once delivery + idempotent consumers = exactly-once effect. Design every consumer so processing the same message twice gives the same result as processing it once.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Idempotent consumer: dedupe on the event's unique id inside the same DB transaction
async function handleOrderPlaced(event: { eventId: string; orderId: number }) {
  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      'INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [event.eventId],
    );
    if (inserted.rowCount === 0) return; // already handled — duplicate delivery, skip

    await tx.query(
      'UPDATE inventory SET reserved = reserved + 1 WHERE order_id = $1',
      [event.orderId],
    );
  }); // both rows commit together, or neither does
}`,
        },
        { type: 'heading2', text: 'The Dual-Write Problem and the Transactional Outbox' },
        {
          type: 'paragraph',
          text: 'Checkout must do two things: save the order in its database and publish OrderPlaced to the broker. These are two different systems, so there is no single transaction covering both. If the DB commit succeeds and the publish fails (broker unreachable, process killed), the order exists but nobody is ever told. If you publish first and the DB commit fails, consumers charge a card for an order that does not exist.',
        },
        {
          type: 'paragraph',
          text: 'The transactional outbox fixes this. In the same database transaction that writes the order, you also insert the event into an outbox table. A separate relay process reads unpublished rows from the outbox and publishes them, marking each as sent. Either both the order and its event are committed, or neither is. The relay may publish an event twice (crash after publish, before marking), which is fine — consumers are idempotent.',
        },
        {
          type: 'flow',
          title: 'Transactional outbox — one commit, then a relay',
          code: `flowchart LR
  API[Checkout service]:::server -->|"single DB transaction"| TX
  subgraph TX["Orders database"]
    direction TB
    O[(orders row)]:::db
    OB[(outbox row<br/>OrderPlaced, sent = false)]:::db
  end
  RL[Outbox relay<br/>poller or CDC]:::cache -->|"1. read unsent rows"| OB
  RL -->|"2. publish"| BR[[Broker]]:::queue
  RL -->|"3. mark sent"| OB
  BR --> CS[Consumers]:::server`,
          text: 'The relay can poll the table every few hundred milliseconds or use change data capture (CDC, e.g. Debezium reading the database’s write-ahead log).',
        },
        {
          type: 'code',
          lang: 'sql',
          code: `BEGIN;
INSERT INTO orders (id, user_id, total) VALUES (789, 123, 59.98);
INSERT INTO outbox (id, topic, key, payload, sent)
VALUES ('evt_9f2', 'orders', '789', '{"type":"OrderPlaced","orderId":789}', false);
COMMIT;

-- Relay (pseudo-code loop):
-- SELECT * FROM outbox WHERE sent = false ORDER BY created_at LIMIT 100;
-- publish each row to the broker, then
-- UPDATE outbox SET sent = true WHERE id = ANY(:publishedIds);`,
        },
        { type: 'heading2', text: 'Backpressure and Consumer Lag' },
        {
          type: 'paragraph',
          text: 'Consumer lag is how far behind consumers are: in Kafka, the difference between the latest offset in a partition and the group’s committed offset; in SQS, the number of visible messages and the age of the oldest one. Lag is the single most important queue metric. Steady lag near zero is healthy; lag that only grows means consumers cannot keep up. Because consumers pull at their own pace (or set a prefetch limit), the queue naturally provides backpressure — overload becomes a growing backlog instead of crashed services.',
        },
        {
          type: 'flow',
          title: 'Reacting to consumer lag',
          code: `flowchart TD
  M[Monitor lag + oldest message age]:::cache --> D{Lag trend?}:::highlight
  D -->|"near zero, stable"| OK([Healthy]):::client
  D -->|"growing"| W{Why?}
  W -->|"more traffic"| SC["Scale out consumers<br/>up to the partition count"]:::server
  W -->|"slow dependency"| DEP["Fix or throttle the dependency<br/>check retries and DLQ"]:::external
  W -->|"one partition hot"| KEY["Rethink the partition key"]:::queue`,
        },
        { type: 'heading2', text: 'The Ordering vs. Parallelism Trade-off' },
        {
          type: 'paragraph',
          text: 'Strict global ordering means one consumer handling one message at a time — no parallelism at all. Systems get throughput by relaxing ordering to "per key": Kafka orders within a partition, SQS FIFO within a message group. Pick the narrowest scope you actually need. Account balance updates must be ordered per account, not across all accounts. Retries also break ordering: if message 5 fails and is retried later while 6 and 7 succeed, they were applied out of order — so ordered consumers must either block the partition until 5 succeeds or be written to tolerate reordering (for example by ignoring updates with an older version number).',
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
            'Myth: "Kafka keeps my topic in order." Reality: Only within each partition. Two events for the same order are ordered only if they share a key (and so a partition).',
            'Myth: "Our broker has exactly-once delivery, so duplicates cannot happen." Reality: Retries, redeliveries, rebalances and outbox relays all produce duplicates. Make consumers idempotent regardless of what the broker advertises.',
            'Myth: "Adding consumers always increases throughput." Reality: In Kafka, consumers beyond the partition count sit idle. In ordered queues, one slow key still limits its own stream.',
            'Myth: "Once it is in the queue, it is safe forever." Reality: Kafka deletes data after the retention period; SQS deletes messages after its retention period (4 days by default, 14 at most). A consumer that is down longer than that loses messages.',
            'Myth: "A queue makes the system faster." Reality: It makes the request faster. Total work is the same or more, and results become eventually consistent — the user may see "processing" for a while.',
            'Myth: "Publishing after the DB commit is good enough." Reality: That is the dual-write problem. A crash between the two silently drops events. Use the outbox pattern when the event must not be lost.',
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
          type: 'paragraph',
          text: 'Message queues appear in almost every system design interview. Whenever you hear "send", "notify", "process later", "fan out" or "at scale", reach for one — and be ready to explain the delivery guarantee, the partition key and what happens on failure.',
        },
        {
          type: 'bullets',
          items: [
            'How Backend Works: the POST /api/orders walkthrough ends with "publish order_created to Kafka". This lesson is what happens after that line.',
            'Notification System: a classic queue design — accept requests fast, fan out by channel (push, SMS, email), retry with backoff, dead-letter failures, and use idempotency keys so users are not notified twice.',
            'Chat System: messages are partitioned by conversation id so each chat stays ordered while millions of chats are processed in parallel.',
            'News Feed: fan-out-on-write publishes each new post to a queue that workers use to push it into followers’ feed caches.',
            'Payment System: the outbox pattern and idempotency keys are essential — a charge must never be lost or doubled.',
            'Video Streaming: an upload triggers a job queue of transcoding tasks (one per resolution) processed by a pool of workers.',
          ],
        },
        { type: 'heading2', text: 'Event-Driven Architecture: Choreography vs. Orchestration' },
        {
          type: 'paragraph',
          text: 'When many services cooperate on one business flow, there are two styles. In choreography, each service listens for events and publishes its own — nobody is in charge, which keeps services decoupled but makes the overall flow hard to see. In orchestration, a central orchestrator (a saga coordinator or a workflow engine like Temporal or AWS Step Functions) sends commands to each service and tracks progress, which makes the flow explicit and easier to debug and compensate (undo), at the cost of a central component.',
        },
        {
          type: 'flow',
          title: 'Choreography vs. orchestration',
          code: `flowchart LR
  subgraph CH["Choreography - react to events"]
    direction TB
    O1[Order]:::server -->|"OrderPlaced"| P1[Payment]:::server
    P1 -->|"PaymentSucceeded"| I1[Inventory]:::server
    I1 -->|"StockReserved"| S1[Shipping]:::server
  end
  subgraph OR["Orchestration - a coordinator decides"]
    direction TB
    OC{{Order saga orchestrator}}:::highlight -->|"1. charge"| P2[Payment]:::server
    OC -->|"2. reserve"| I2[Inventory]:::server
    OC -->|"3. ship"| S2[Shipping]:::server
  end`,
          text: 'Choreography suits simple, loosely related reactions (send an email, update analytics). Orchestration suits multi-step business transactions that need clear status and rollback.',
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'Interview checklist for any queue in your design: Which kind (work queue, pub/sub, log)? What is the partition key and why? What delivery guarantee, and how are consumers idempotent? What happens on repeated failure (backoff, DLQ)? How do you avoid the dual-write problem (outbox)? Which metric tells you it is falling behind (consumer lag)?',
        },
      ],
    },
  ],
};
