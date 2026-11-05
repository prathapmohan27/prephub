import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 4 — Chat / Messaging System
// ─────────────────────────────────────────────────────────────────────────────
export const chatSystem: SystemDesignSystem = {
  id: 'chat-system',
  title: 'Chat / Messaging System',
  icon: 'ti-messages',
  color: '#3b82f6',
  bg: '#dbeafe',
  accentGlow: 'rgba(59,130,246,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Real-time communication at scale — WebSockets, fan-out, message ordering, and offline delivery.',
  tags: ['WebSockets', 'Fan-out', 'Message Ordering', 'Push Notifications', 'Long-polling'],
  estimatedTime: '60 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A real-time chat system like WhatsApp, Slack, or Facebook Messenger. It supports 1-on-1 messaging, group chats, online presence ("online" / "last seen"), message history, and push notifications for users who are offline.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it is a postal service where every online user has a phone line held open to the post office. When a letter arrives for you, the post office reads it to you down that line instantly. If your line is down (you are offline), it files the letter in your mailbox and sends a text saying "you have mail". The hard part: there are thousands of post offices, and the sender and receiver are usually connected to different ones.',
        },
        {
          type: 'flow',
          title: 'The big picture — keep a line open, route between servers',
          code: `flowchart LR
  A([Alice's phone]):::client <-->|"WebSocket<br/>always open"| CS1[Chat Server 1]:::server
  CS1 -->|"1. save"| DB[(Message store)]:::db
  CS1 -->|"2. publish for Bob"| PS[[Pub-Sub / Queue]]:::queue
  PS -->|"3. Bob's server picks it up"| CS2[Chat Server 2]:::server
  CS2 <-->|"WebSocket"| B([Bob's phone]):::client
  PS -.->|"Bob offline?"| PN[Push notification<br/>APNs / FCM]:::external
  PN -.-> B`,
          text: 'Alice and Bob are connected to different servers. Saving first means the message is never lost; the pub-sub layer carries it across to whichever server Bob is on.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '1-on-1 messaging with real-time delivery.',
            'Group messaging (up to 500 members).',
            'Message history — retrieve past messages paginated.',
            'Online presence — know who is online.',
            'Message delivery status: sent → delivered → read receipts.',
            'Push notifications when the user is offline.',
            'Media sharing (images, videos) — out of scope for core design, handled separately.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '500 million daily active users (DAU).',
            '40 messages per user per day = 20 billion messages per day.',
            'Message latency: < 100ms for online delivery.',
            'Message persistence: stored for 5 years.',
            'High availability (99.99%) — chat must work even during partial failures.',
            'Message ordering must be maintained within a conversation.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'WebSockets' },
        {
          type: 'paragraph',
          text: 'Plain HTTP is request-response: the server can only answer when the client asks, so it cannot push a new message on its own. A WebSocket is a connection that stays open and lets both sides send at any time. It starts as a normal HTTP request with an "Upgrade: websocket" header; once the server agrees, the same TCP connection becomes a two-way (full-duplex) channel.',
        },
        {
          type: 'bullets',
          items: [
            'The server can push messages to the client at any time.',
            'Much lower overhead than repeated HTTP polling.',
            'Maintains a persistent connection — requires connection management at scale.',
            'Not supported in all network environments (firewalls may block WebSocket upgrades).',
          ],
        },
        { type: 'heading2', text: 'Long-Polling (Fallback)' },
        {
          type: 'paragraph',
          text: 'The client sends an HTTP request. The server holds the request open until a message arrives (or a timeout of ~30 seconds). When a message arrives, the server responds and the client immediately sends another request. Simulates real-time without persistent connections. Higher latency and overhead than WebSockets but works everywhere.',
        },
        { type: 'heading2', text: 'Server-Sent Events (SSE)' },
        {
          type: 'paragraph',
          text: 'Server-to-client only. The server can push events over a single HTTP connection. Works through most firewalls. Ideal for notification feeds, live scoreboards, and other one-directional real-time streams. For bidirectional chat, use WebSockets.',
        },
        {
          type: 'flow',
          title: 'Long-polling vs WebSocket',
          code: `sequenceDiagram
  participant C as Client
  participant S as Server
  Note over C,S: Long-polling — a new request after every message
  C->>S: GET /messages (server holds it open)
  Note over S: waits up to 30 s...
  S-->>C: new message arrives → respond
  C->>S: GET /messages again (new request)
  Note over C,S: WebSocket — one handshake, then free-flowing
  C->>S: GET /chat with Upgrade websocket
  S-->>C: 101 Switching Protocols
  S-)C: message
  C-)S: message
  S-)C: typing indicator`,
          text: 'Long-polling pays for a full HTTP request per message. A WebSocket pays once, then both sides talk freely over the same connection.',
        },
        { type: 'heading2', text: 'Message Delivery Guarantees' },
        {
          type: 'bullets',
          items: [
            'At-most-once: Message sent once. If delivery fails, it is lost. Simplest, but messages can be dropped.',
            'At-least-once: Message retried until acknowledged. Recipient may receive duplicates. Requires deduplication (idempotency).',
            'Exactly-once: Message delivered exactly once, never duplicated. Most complex. Requires distributed transactions or idempotent consumers.',
            'For chat: At-least-once with client-side deduplication (using message IDs) is standard (WhatsApp approach).',
          ],
        },
        {
          type: 'flow',
          title: 'At-least-once delivery + dedup by message ID',
          code: `sequenceDiagram
  participant S as Chat Server
  participant B as Bob's app
  S->>B: msg id 901 "hi"
  B-->>S: ack 901 (lost on the network)
  Note over S: No ack within timeout - retry
  S->>B: msg id 901 "hi" (again)
  B->>B: Already have 901 - show once
  B-->>S: ack 901
  Note over S: Ack received - stop retrying`,
          text: 'Retrying guarantees nothing is lost; the unique message ID guarantees the user never sees the same message twice.',
        },
        { type: 'heading2', text: 'Message Ordering' },
        {
          type: 'paragraph',
          text: 'In distributed systems, messages may arrive out of order. Solutions:',
        },
        {
          type: 'bullets',
          items: [
            'Sequence numbers: Each message in a conversation gets a monotonically increasing sequence number. Client reorders based on sequence.',
            'Lamport timestamps: Logical clocks that capture causality. Message B that was sent after message A will always have a higher timestamp.',
            'Snowflake IDs: Time-based unique IDs are sortable — messages with higher IDs were created later.',
          ],
        },
        {
          type: 'flow',
          title: 'Message status lifecycle',
          code: `stateDiagram-v2
  [*] --> Sending: user taps send
  Sending --> Sent: server saved it (one tick)
  Sending --> Failed: no server ack
  Failed --> Sending: auto retry
  Sent --> Delivered: recipient device acked (two ticks)
  Delivered --> Read: recipient opened chat (blue ticks)
  Read --> [*]`,
          text: "Each tick is just an acknowledgement travelling back to the sender: from the server, then from the recipient's device, then from the recipient opening the conversation.",
        },
      ],
    },
    {
      id: 'architecture',
      title: 'High-Level Architecture',
      icon: 'ti-topology-star',
      blocks: [
        { type: 'heading2', text: 'Core Components' },
        {
          type: 'bullets',
          items: [
            'Chat Servers: Handle WebSocket connections. Stateful — each server holds N persistent connections. Users connected to different chat servers need a way to exchange messages.',
            'Message Queue / Pub-Sub (Kafka/Redis Pub-Sub): Decouples chat servers. Server A publishes a message to the queue. Server B (where recipient is connected) subscribes and delivers to recipient.',
            'Message Store (Cassandra): Stores all messages persistently. Optimized for time-series data and high write throughput.',
            'Presence Service: Tracks online/offline status for all users using a distributed cache.',
            'Push Notification Service: Delivers notifications to offline users via APNs (iOS) / FCM (Android).',
            'User Service / API Gateway: Authentication, user profiles, REST API for non-real-time operations.',
            'Media Service: Handles image/video uploads separately via object storage (S3).',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  C([Mobile and web clients]):::client --> LB[Load Balancer]:::network
  LB -->|"WebSocket"| CS[Chat Servers<br/>stateful connections]:::server
  LB -->|"REST: login, profile, history"| API[API Gateway +<br/>User Service]:::server
  C -->|"upload media"| MS[Media Service]:::server --> S3[(Object storage S3)]:::db
  CS --> MQ[[Kafka / Redis Pub-Sub]]:::queue
  MQ --> CS
  CS --> MDB[(Cassandra<br/>messages)]:::db
  CS --> PR[Presence Service]:::server --> RC[(Redis<br/>last seen)]:::cache
  MQ -.->|"recipient offline"| PNS[Push Notification<br/>Service]:::external`,
          text: 'Chat servers only hold connections. Everything that must outlive a connection — messages, presence, offline alerts — lives in separate services behind them.',
        },
        { type: 'heading2', text: '1-on-1 Message Flow' },
        {
          type: 'numbered',
          items: [
            'User A sends a message to User B via WebSocket connection to Chat Server 1.',
            'Chat Server 1 stores the message in Cassandra and publishes it to Message Queue.',
            "Chat Server 2 (where User B is connected) subscribes to User B's channel and receives the message.",
            'Chat Server 2 delivers the message to User B via their WebSocket connection.',
            'If User B is offline: Chat Server 2 sees no active connection; routes to Push Notification Service.',
            'Delivery receipt flows back via the same path in reverse.',
          ],
        },
        {
          type: 'flow',
          title: '1-on-1 message delivery (online vs offline)',
          code: `sequenceDiagram
  actor A as Alice
  participant S1 as Chat Server 1
  participant DB as Cassandra
  participant Q as Pub-Sub
  participant S2 as Chat Server 2
  participant P as Push Service
  actor B as Bob
  A->>S1: send "hi" (client msg id)
  S1->>DB: store message
  S1-->>A: sent ✓
  S1->>Q: publish to channel user:bob
  alt Bob online
    Q->>S2: deliver (S2 subscribes for Bob)
    S2->>B: push over WebSocket
    B-->>S2: delivered ack
    S2->>Q: receipt for Alice
    Q->>S1: receipt
    S1-->>A: delivered ✓✓
  else Bob offline
    Q->>P: no live connection
    P->>B: "New message from Alice" notification
  end`,
          text: 'Alice gets her first tick only after the message is safely stored. The second tick is a receipt that travels back the same way the message came.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Message Data Model (Cassandra)' },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Cassandra table optimized for chat message retrieval
CREATE TABLE messages (
  conversation_id  UUID,
  message_id       TIMEUUID,   -- time-based UUID for ordering
  sender_id        UUID,
  content          TEXT,
  message_type     TEXT,       -- 'text', 'image', 'video'
  status           TEXT,       -- 'sent', 'delivered', 'read'
  created_at       TIMESTAMP,
  PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
-- Partition by conversation, cluster by time → 
-- fast retrieval of latest messages in a conversation`,
        },
        { type: 'heading2', text: 'Fan-Out for Group Messages' },
        {
          type: 'paragraph',
          text: 'When User A sends a message to a group of 100 members, how do all 100 members receive it?',
        },
        {
          type: 'bullets',
          items: [
            "Fan-out on Write (Push model): When A sends a message, immediately copy it to each member's message inbox. 100 writes immediately. Recipients just read their own inbox (1 read). Best for small groups.",
            "Fan-out on Read (Pull model): Store the message once. Each recipient fetches the group's messages. 1 write. 100 reads per fetch. Best for large groups (celebrity problem solution).",
            'Hybrid: Fan-out on write for small groups (<= 100). Fan-out on read for large groups. This is what Twitter, WeChat use.',
          ],
        },
        {
          type: 'flow',
          title: 'Group fan-out — push or pull?',
          code: `flowchart TD
  M([Alice posts to a group]):::client --> SAVE[(Store message once<br/>in group conversation)]:::db
  SAVE --> D{Group size?}
  D -->|"Small, 100 or fewer"| W[Fan-out on write:<br/>copy into each member's inbox]:::server
  W --> I1[(Inbox Bob)]:::cache
  W --> I2[(Inbox Carol)]:::cache
  W --> I3[(Inbox ...)]:::cache
  D -->|"Large, over 100"| R[Fan-out on read:<br/>members fetch when they open it]:::server
  R --> NOTIFY[[Light notify event:<br/>group has new messages]]:::queue`,
          text: 'Small groups: pay with extra writes so every read is cheap. Huge groups: write once and let members pull, so one message does not cause thousands of writes.',
        },
        { type: 'heading2', text: 'Presence Service Design' },
        {
          type: 'bullets',
          items: [
            'Each client sends a heartbeat to the Presence Service every 5 seconds.',
            'Presence data stored in Redis: {userId → lastSeen timestamp}.',
            'If lastSeen > 30 seconds ago → OFFLINE. Within 30s → ONLINE.',
            'When a user connects/disconnects, publish a presence event to subscribers (friends/contacts).',
            'Presence data is soft-state — it is acceptable to lose it on failure and rebuild via heartbeats.',
          ],
        },
        {
          type: 'flow',
          title: 'Presence from heartbeats',
          code: `flowchart LR
  C([Bob's app]):::client -->|"heartbeat every 5 s"| PS[Presence Service]:::server
  PS -->|"SET lastSeen bob = now"| R[(Redis)]:::cache
  Q([Alice opens chat]):::client -->|"is Bob online?"| PS
  PS --> T{now − lastSeen<br/>under 30 s?}
  T -->|Yes| ON([Online]):::highlight
  T -->|No| OFF(["Last seen 10:42"]):::external
  PS -.->|"status changed"| SUB[[Notify Bob's contacts]]:::queue`,
          text: 'Nobody has to announce going offline — silence is the signal. That also handles phones that lose signal or crash without saying goodbye.',
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'WebSocket Connection Scaling' },
        {
          type: 'paragraph',
          text: 'A single chat server can maintain ~50,000 concurrent WebSocket connections. For 500M DAU with ~10% online simultaneously = 50M connections → 50M / 50K = 1,000 chat servers.',
        },
        {
          type: 'bullets',
          items: [
            "A load balancer routes each user's initial WebSocket handshake to a chat server (sticky sessions based on user ID or consistent hashing).",
            'The load balancer keeps track of which server each user is on. When a message arrives, route it to the correct server.',
            'Or: Use a Service Registry (e.g., etcd). Chat servers register their connected users. Other servers can look up "which server is User B connected to?"',
          ],
        },
        {
          type: 'flow',
          title: 'Scaled-out connection layer',
          code: `flowchart TB
  U([~50M online users]):::client --> LB[Load Balancer<br/>sticky by user ID]:::network
  subgraph Chat["~1,000 chat servers, ~50K connections each"]
    C1[Chat Server 1]:::server
    C2[Chat Server 2]:::server
    C3[Chat Server N]:::server
  end
  LB --> C1 & C2 & C3
  C1 & C2 & C3 -->|"register: bob is on server 2"| REG[(Service registry<br/>etcd or Redis)]:::cache
  C1 & C2 & C3 <--> MQ[[Kafka / Pub-Sub cluster]]:::queue
  MQ --> CAS[(Cassandra cluster<br/>partitioned by conversation_id)]:::db`,
          text: 'Connections are spread across many servers; the registry answers "where is Bob right now?", and pub-sub carries messages between servers.',
        },
        { type: 'heading2', text: 'Cassandra Scaling' },
        {
          type: 'bullets',
          items: [
            '20 billion messages/day = ~230K writes/second.',
            'Cassandra is designed for this. Write path is a sequential log (CommitLog + MemTable).',
            "Partition by conversation_id. A conversation's messages always go to the same Cassandra partition (good for hot conversations — but with replication, distributed across nodes).",
            'Add more Cassandra nodes to scale linearly.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'Message Durability' },
        {
          type: 'bullets',
          items: [
            'Messages are written to Cassandra BEFORE delivery is confirmed. Never confirm delivery before persistence.',
            'Cassandra replication factor = 3. Message survives loss of up to 2 nodes.',
            'Message queue (Kafka) provides durability during transit: messages are persisted on Kafka brokers before being delivered to consumers.',
          ],
        },
        { type: 'heading2', text: 'Handling Chat Server Failure' },
        {
          type: 'bullets',
          items: [
            'When a chat server goes down, all its WebSocket connections are lost.',
            'Clients detect the connection drop and automatically reconnect to a new chat server.',
            'The new server re-registers the user in the Service Registry.',
            'Missed messages: On reconnection, the client sends its last received message_id. The server fetches and delivers all messages with higher IDs.',
          ],
        },
        {
          type: 'flow',
          title: 'Chat server crash — reconnect and catch up',
          code: `sequenceDiagram
  participant B as Bob's app
  participant S2 as Chat Server 2
  participant S7 as Chat Server 7
  participant REG as Registry
  participant DB as Cassandra
  S2-xB: connection drops (server crashed)
  B->>B: wait with backoff, then reconnect
  B->>S7: WebSocket connect + last id 901
  S7->>REG: bob is now on server 7
  S7->>DB: messages after 901
  DB-->>S7: 902, 903, 904
  S7->>B: deliver 902 to 904
  Note over B: Back in sync — nothing lost`,
          text: 'Because every message is stored before delivery, a crashed server only loses connections, never messages. The client\'s "last id I saw" is all that is needed to catch up.',
        },
        { type: 'heading2', text: 'Offline Message Delivery' },
        {
          type: 'bullets',
          items: [
            'Messages are stored in Cassandra regardless of recipient status.',
            'When the recipient comes online, the client fetches all unread messages (those with status ≠ "delivered") from their conversation history.',
            'Push notifications serve as the signal that a message is waiting — not as the message delivery mechanism itself.',
          ],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Message Throughput Optimization' },
        {
          type: 'bullets',
          items: [
            'Batching: Accumulate multiple messages in a 50ms window and write to Cassandra in a batch. Reduces write amplification.',
            'Async writes: Write to message queue (Kafka) synchronously (fast). Write to Cassandra asynchronously. Trade: slight risk of message loss if Kafka fails before Cassandra write. Mitigate with Kafka replication.',
            'Read optimization: Cache the last 20 messages of each active conversation in Redis. 80% of reads are for recent messages.',
          ],
        },
        { type: 'heading2', text: 'Pagination for Message History' },
        {
          type: 'paragraph',
          text: 'Use cursor-based pagination for message history. The client receives a cursor (last message_id received). Next request: GET /messages?conversationId=X&before=<cursor>&limit=20. The server fetches 20 messages with message_id < cursor. This is efficient — no OFFSET scans, no out-of-range issues.',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'WebSockets vs. Long-Polling' },
        {
          type: 'bullets',
          items: [
            'WebSockets: Lower latency, lower server resource usage (persistent connection). Requires WebSocket support (most firewalls OK now). Connection state is more complex.',
            'Long-Polling: Universal compatibility. Higher latency (~1-2s). Each poll creates a new HTTP request — more overhead. Easier to implement and debug.',
            'Recommendation: WebSockets as default, Long-Polling as fallback.',
          ],
        },
        { type: 'heading2', text: 'Fan-Out on Write vs. Read' },
        {
          type: 'bullets',
          items: [
            'Fan-out on write: Recipient always reads from their own pre-populated inbox (fast reads). But: sending to a 1000-person group requires 1000 writes — expensive for large groups.',
            'Fan-out on read: One write regardless of group size. But: reading the group timeline requires aggregating across all members.',
            'The hybrid approach is the industry standard. Define the threshold (e.g., 100 members) empirically based on your read-to-write ratio.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Monitoring' },
        {
          type: 'bullets',
          items: [
            'Track: message delivery latency (P50, P95, P99), WebSocket connection count per server, message queue lag, push notification delivery rate.',
            'Alert: If message delivery P99 > 500ms, queue consumer lag > 10 seconds, or push notification failure rate > 1%.',
          ],
        },
        { type: 'heading2', text: 'Regulatory Compliance' },
        {
          type: 'bullets',
          items: [
            "End-to-end encryption (E2EE): Messages encrypted on sender's device, decrypted only on recipient's device. Even the server cannot read content.",
            'Message retention policies: Legal requirements vary by country. Allow configurable retention (e.g., delete after 30 days).',
            'Right to deletion: GDPR compliance — users can request deletion of all their messages.',
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
            'How would you deliver a message to a user who is connected to a different server than the sender?',
            'How do you handle message ordering in a distributed chat system?',
            'Design the fan-out mechanism for group messages in a group of 10,000 users.',
            'How do you show online presence for 500M users without querying the database on every check?',
            'How would you implement message read receipts?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'WebSockets for real-time, but mention Long-Polling as fallback.',
            'Message queue (Kafka/Redis Pub-Sub) for cross-server delivery — this is the non-obvious part that distinguishes good answers.',
            'Cassandra for message storage because of its write throughput and time-series query pattern.',
            'Fan-out on write for small groups, fan-out on read for large groups (hybrid).',
            'At-least-once delivery with client-side deduplication by message_id.',
          ],
        },
        {
          type: 'flow',
          title: 'A strong answer, step by step',
          code: `flowchart LR
  A[Clarify<br/>1-on-1, groups, scale]:::client --> B[Real-time channel<br/>WebSocket + fallback]:::network
  B --> C[Cross-server delivery<br/>pub-sub]:::highlight
  C --> D[Storage<br/>Cassandra by conversation]:::db
  D --> E[Groups, presence,<br/>offline push]:::server
  E --> F[Failures, ordering,<br/>dedup]:::security`,
        },
        {
          type: 'callout',
          variant: 'important',
          text: 'The hardest part of a chat system interview is explaining how messages cross server boundaries. The answer: a message queue (or pub-sub). Users subscribe to their own channel. When a message arrives for them, any subscriber (chat server they are connected to) delivers it. This is the insight that separates good answers from great ones.',
        },
      ],
    },
  ],
};
