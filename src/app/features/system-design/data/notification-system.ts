import type { SystemDesignSystem } from '../system-design-data';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 5 — Notification System
// ─────────────────────────────────────────────────────────────────────────────
export const notificationSystem: SystemDesignSystem = {
  id: 'notification-system',
  title: 'Notification System',
  icon: 'ti-bell',
  color: '#ec4899',
  bg: '#fce7f3',
  accentGlow: 'rgba(236,72,153,0.15)',
  difficulty: 'Intermediate',
  tagline:
    'Async processing, Kafka pipelines, retry with backoff, and idempotency at massive scale.',
  tags: ['Kafka', 'Idempotency', 'APNs/FCM', 'Retry Backoff', 'Async Processing'],
  estimatedTime: '50 min',
  sections: [
    {
      id: 'problem',
      title: 'Problem Understanding',
      icon: 'ti-target',
      blocks: [
        { type: 'heading2', text: 'What Are We Building?' },
        {
          type: 'paragraph',
          text: 'A notification system sends alerts to users over several channels: push notifications (mobile/web), email, and SMS. Other services in the company call it whenever something happens that a user should hear about — a new message, an order update, a promotion, a security alert.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'In simple terms: it is the company\'s mailroom. Any department drops off a note saying "tell user 42 their order shipped". The mailroom checks whether the user wants that kind of mail, writes it up nicely, and hands it to the right courier — Apple, Google, the email provider, or the SMS provider. If a courier is closed, it tries again later, and it keeps a log so the same note is never delivered twice.',
        },
        {
          type: 'flow',
          title: 'The big picture — accept fast, deliver in the background',
          code: `flowchart LR
  SVC([Order Service]):::client -->|"notify user 42:<br/>order shipped"| API[Notification API]:::server
  API -->|"202 Accepted<br/>right away"| SVC
  API --> Q[[Queue]]:::queue
  Q --> W[Channel workers]:::server
  W --> APNS[Apple APNs]:::external
  W --> FCM[Google FCM]:::external
  W --> EM[Email provider]:::external
  W --> SMS[SMS provider]:::external
  APNS & FCM & EM & SMS --> U([User's devices]):::client`,
          text: 'The calling service never waits for Apple, Google, or an email provider. It hands the job to a queue and moves on; workers do the slow, failure-prone delivery work.',
        },
        { type: 'heading2', text: 'Functional Requirements' },
        {
          type: 'bullets',
          items: [
            'Support push notifications (iOS APNs, Android FCM), email (SendGrid/SES), and SMS (Twilio).',
            'Send notifications reliably — no message should be permanently lost.',
            'Support notification preferences — users can opt out of certain notification types.',
            'Deduplication — the same notification should not be delivered twice.',
            'Rate limiting — do not spam users with too many notifications in a short period.',
            'Scheduling — support delayed notifications.',
            'Analytics — track delivery, open, and click rates.',
          ],
        },
        { type: 'heading2', text: 'Non-Functional Requirements' },
        {
          type: 'bullets',
          items: [
            '10 million mobile push notifications per day.',
            '1 million SMS per day.',
            '5 million emails per day.',
            'Soft real-time — most notifications should arrive within 10 seconds.',
            'High availability — the system must be operational 99.9% of the time.',
            'Scalable — can add more throughput without redesign.',
          ],
        },
      ],
    },
    {
      id: 'concepts',
      title: 'Core Concepts',
      icon: 'ti-bulb',
      blocks: [
        { type: 'heading2', text: 'Push Notification Delivery (APNs & FCM)' },
        {
          type: 'bullets',
          items: [
            'Apple Push Notification Service (APNs): Apple\'s server that delivers push notifications to iOS devices. Your backend sends a notification payload to APNs; Apple handles the "last mile" to the device.',
            "Firebase Cloud Messaging (FCM): Google's equivalent for Android and web. Your backend sends to FCM; Google delivers to the device.",
            'Device Token: A unique identifier for each app installation on a device. Your backend stores this token and uses it to address notifications.',
            'Token expiry: Tokens can change (app reinstall, OS upgrade). Always handle invalid token errors from APNs/FCM and remove stale tokens.',
          ],
        },
        {
          type: 'flow',
          title: 'Where device tokens come from and how they are used',
          code: `sequenceDiagram
  participant App as Mobile app
  participant OS as Apple or Google
  participant BE as Your backend
  participant W as Push worker
  App->>OS: Register for push
  OS-->>App: device token
  App->>BE: Save token for user 42
  Note over BE: Later, an event happens
  W->>OS: Send payload to token
  alt token valid
    OS->>App: Notification shown on device
  else token invalid (app uninstalled)
    OS-->>W: error: unregistered token
    W->>BE: delete stale token
  end`,
          text: 'You never talk to the phone directly. Apple and Google own the "last mile"; your backend only needs the token, which acts like the phone\'s mailing address.',
        },
        { type: 'heading2', text: 'Idempotency' },
        {
          type: 'paragraph',
          text: 'An operation is idempotent if doing it twice has the same effect as doing it once — like pressing a lift button again: the lift still comes only once. For notifications, this means that if our system accidentally processes the same notification twice (which happens with retries), the user still receives it only once.',
        },
        {
          type: 'bullets',
          items: [
            'Generate a unique notification_id for every notification event.',
            'Before processing, check if notification_id is in a "processed" store (Redis or DB).',
            'If already processed, skip and acknowledge the queue message.',
            'If new, process it and add notification_id to the processed store.',
          ],
        },
        {
          type: 'flow',
          title: 'Idempotency check before sending',
          code: `flowchart TD
  M([Message from queue<br/>notification_id n-123]):::queue --> C{"SET notif:sent:n-123<br/>only if not exists"}:::cache
  C -->|"Set — first time"| SEND[Send via provider]:::server
  SEND --> ACK([Acknowledge message]):::highlight
  C -->|"Already exists — duplicate"| SKIP[Skip sending]:::external --> ACK`,
          text: 'The check and the "mark as seen" happen in one atomic Redis command, so two workers racing on the same message cannot both send it.',
        },
        { type: 'heading2', text: 'Retry with Exponential Backoff' },
        {
          type: 'paragraph',
          text: 'When a third-party service (APNs, SendGrid) is temporarily unavailable, you must retry — but without hammering a service that is already struggling. Exponential backoff means each wait is double the last: 1s, then 2s, then 4s, then 8s… up to a maximum (e.g., 5 minutes). Also add jitter (a small random amount) to each wait. Otherwise thousands of failed messages would all retry at the exact same moment and knock the service over again (a "thundering herd").',
        },
        {
          type: 'flow',
          title: 'Retry loop with backoff and a dead letter queue',
          code: `flowchart TD
  S([Send attempt]):::server --> R{Provider response}
  R -->|"Success"| DONE([Log as sent]):::highlight
  R -->|"Permanent error<br/>e.g. invalid token"| DROP([Do not retry,<br/>clean up]):::external
  R -->|"Temporary error<br/>e.g. timeout, 503"| N{Attempts under 5?}
  N -->|Yes| WAIT["Wait 2^attempt s + jitter<br/>in retry queue"]:::queue --> S
  N -->|No| DLQ[[Dead Letter Queue<br/>for humans to inspect]]:::security`,
          text: 'Only retry errors that might succeed later. Retrying a permanently bad request just wastes capacity.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `function retryDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 300000; // 5 minutes
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add ±25% jitter
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponential + jitter);
}
// attempt=0: ~1000ms, attempt=3: ~8000ms, attempt=7: ~128000ms`,
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
            'Notification API: REST endpoint called by other services to trigger notifications. Validates, enriches (user preferences, device tokens), and publishes to message queue.',
            'Message Queue (Kafka): Decouples notification production from consumption. Topics: notifications-push, notifications-email, notifications-sms.',
            'Notification Workers: Consumers for each Kafka topic. Handles retry logic and third-party API calls.',
            'Third-Party Services: APNs (iOS push), FCM (Android push), SendGrid/AWS SES (email), Twilio (SMS).',
            'User Preferences Service: Stores user notification preferences. Called before sending to respect opt-outs.',
            'Device Token Store: Maps user_id → [device_tokens]. Stored in a key-value store (Redis or DynamoDB).',
            'Notification Log Store: Records every notification with its status for analytics and debugging.',
            'Retry Queue: Failed notifications are placed here with a scheduled retry time.',
          ],
        },
        {
          type: 'flow',
          title: 'High-level architecture',
          code: `flowchart TB
  SVC([Internal services]):::client --> API[Notification API<br/>validate + enrich]:::server
  API --> PREF[(User preferences<br/>cached in Redis)]:::cache
  API --> TOK[(Device token store)]:::db
  API --> K[[Kafka topics<br/>push / email / sms]]:::queue
  K --> PW[Push workers]:::server --> APNS[APNs / FCM]:::external
  K --> EW[Email workers]:::server --> SES[SendGrid / SES]:::external
  K --> SW[SMS workers]:::server --> TW[Twilio]:::external
  PW & EW & SW -.->|"failed"| RQ[[Retry queue]]:::queue
  RQ -.-> K
  PW & EW & SW --> LOG[(Notification log<br/>+ analytics)]:::db`,
          text: 'One topic and worker pool per channel, so a problem with SMS cannot block push or email.',
        },
        { type: 'heading2', text: 'Notification Flow' },
        {
          type: 'numbered',
          items: [
            'Application Service (e.g., Order Service) calls POST /api/notifications with {userId, type: "push", template: "order_confirmed", data: {...}}',
            'Notification API checks user preferences — does the user allow this notification type?',
            'Fetch device tokens for the user from the Device Token Store.',
            'Publish to Kafka topic: notifications-push with notification_id, userId, tokens, payload.',
            'Push Notification Worker consumes from Kafka, calls APNs/FCM API.',
            'On success: log delivery status. On failure: publish to retry queue with backoff delay.',
            'Analytics service consumes all notification events for tracking.',
          ],
        },
        {
          type: 'flow',
          title: 'Sending one push notification',
          code: `sequenceDiagram
  participant OS as Order Service
  participant API as Notification API
  participant P as Preferences
  participant K as Kafka
  participant W as Push Worker
  participant A as APNs
  OS->>API: POST /notifications (user 42, order_confirmed)
  API->>P: Does user 42 allow order updates?
  alt opted out
    P-->>API: no
    API-->>OS: 200 skipped
  else allowed
    P-->>API: yes + device tokens
    API->>K: publish to notifications-push
    API-->>OS: 202 Accepted
    K->>W: consume
    W->>A: send payload
    alt delivered
      A-->>W: 200
      W->>W: log status = sent
    else temporary failure
      A-->>W: 503
      W->>K: publish to retry queue with delay
    end
  end`,
          text: 'The Order Service gets its answer before APNs is ever called — slow or failing providers never slow down the business flow.',
        },
      ],
    },
    {
      id: 'detailed-design',
      title: 'Detailed Design',
      icon: 'ti-puzzle',
      blocks: [
        { type: 'heading2', text: 'Notification Data Model' },
        {
          type: 'code',
          lang: 'sql',
          code: `CREATE TABLE notifications (
  notification_id  UUID PRIMARY KEY,
  user_id          UUID NOT NULL,
  channel          VARCHAR(10) NOT NULL,  -- 'push', 'email', 'sms'
  template_id      VARCHAR(50),
  payload          JSONB,
  status           VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  retry_count      INT DEFAULT 0,
  scheduled_at     TIMESTAMP,
  sent_at          TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);`,
        },
        { type: 'heading2', text: 'Template Engine' },
        {
          type: 'paragraph',
          text: 'Notifications use templates with placeholders (like {userName}) that are filled in at send time, instead of hard-coded text. This lets you translate messages and A/B test different wordings (send version A to some users and version B to others, then compare) without changing code.',
        },
        {
          type: 'code',
          lang: 'json',
          code: `// Template: order_confirmed
{
  "en": {
    "title": "Order #{orderId} Confirmed!",
    "body": "Hi {userName}, your order totaling \${amount} is confirmed.",
    "action": "view_order"
  },
  "es": {
    "title": "¡Pedido #{orderId} Confirmado!",
    "body": "Hola {userName}, tu pedido de \${amount} está confirmado."
  }
}`,
        },
        { type: 'heading2', text: 'Deduplication Store' },
        {
          type: 'paragraph',
          text: 'Use Redis with a short TTL (e.g., 24 hours) as the deduplication store.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `async function processNotification(notifId: string, payload: any) {
  const dedupeKey = \`notif:sent:\${notifId}\`;
  const alreadySent = await redis.set(dedupeKey, '1', 'NX', 'EX', 86400);
  if (!alreadySent) {
    console.log('Duplicate notification, skipping:', notifId);
    return; // Already processed
  }
  // Process the notification...
  await sendPushNotification(payload);
}`,
        },
      ],
    },
    {
      id: 'scalability',
      title: 'Scalability',
      icon: 'ti-trending-up',
      blocks: [
        { type: 'heading2', text: 'Kafka Partitioning' },
        {
          type: 'paragraph',
          text: 'Partition Kafka topics by notification channel or user_id. With 10M notifications/day = ~116/second, a few Kafka partitions suffice. For 1B/day = 11,600/second, use more partitions and worker instances.',
        },
        { type: 'heading2', text: 'Worker Auto-scaling' },
        {
          type: 'paragraph',
          text: 'Monitor Kafka consumer lag — the number of messages waiting in the queue that workers have not processed yet. If lag grows, add more notification workers (more pod replicas in Kubernetes); when lag is low, remove some. This gives you capacity when you need it without paying for idle machines.',
        },
        {
          type: 'flow',
          title: 'Scaling workers on queue lag',
          code: `flowchart LR
  K[[Kafka topic<br/>12 partitions]]:::queue -->|"lag metric"| M[Autoscaler]:::network
  M --> D{Lag trend?}
  D -->|"Growing"| UP[Add worker pods<br/>up to 12 — one per partition]:::server
  D -->|"Near zero"| DOWN[Remove worker pods]:::server
  UP & DOWN --> K
  W[Workers] -.-> RL{{Per-provider<br/>token-bucket limiter}}:::security
  RL -.-> EXT[APNs / FCM / Twilio]:::external`,
          text: 'Two limits matter: Kafka partitions cap how many workers can share a topic, and provider rate limits cap how fast all workers together may send.',
        },
        { type: 'heading2', text: 'Third-Party API Rate Limits' },
        {
          type: 'bullets',
          items: [
            'APNs: No published rate limit but throttles under sustained high load.',
            'FCM: 600,000 messages per minute per project.',
            'Twilio SMS: Varies by account tier (typically 1 msg/sec for short codes).',
            'SendGrid Email: Varies by plan (typically 100 emails/second on paid plans).',
            'Use token bucket rate limiters per channel to stay within third-party limits.',
          ],
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability & Distributed Systems',
      icon: 'ti-shield-check',
      blocks: [
        { type: 'heading2', text: 'At-Least-Once Delivery with Kafka' },
        {
          type: 'paragraph',
          text: 'A Kafka consumer records its progress by committing an offset (a bookmark saying "I have handled everything up to here"). Workers commit only after a message is fully processed. If a worker crashes after sending but before committing, the message will be delivered again to another worker. The idempotency check then turns that second attempt into a harmless no-op.',
        },
        {
          type: 'flow',
          title: 'Crash between send and commit',
          code: `sequenceDiagram
  participant K as Kafka
  participant W1 as Worker 1
  participant R as Redis dedup
  participant A as APNs
  participant W2 as Worker 2
  K->>W1: message n-123 (offset 500)
  W1->>R: mark n-123 as sent
  W1->>A: send
  Note over W1: crashes before committing offset 500
  K->>W2: message n-123 again (offset 500)
  W2->>R: mark n-123 as sent?
  R-->>W2: already exists
  W2->>K: commit offset 500 (skip send)`,
          text: 'At-least-once delivery from Kafka + idempotent workers = the user sees the notification exactly once.',
        },
        { type: 'heading2', text: 'Dead Letter Queue (DLQ)' },
        {
          type: 'paragraph',
          text: 'After N failed retries (e.g., 5), move the message to a Dead Letter Queue. DLQ messages are not automatically retried — they require manual investigation. Monitor DLQ size; a growing DLQ indicates a systemic problem with a channel (e.g., APNs is rejecting all messages).',
        },
        { type: 'heading2', text: 'Graceful Handling of Third-Party Outages' },
        {
          type: 'bullets',
          items: [
            'APNs/FCM outage: Notifications accumulate in the retry queue. Deliver when the service recovers.',
            'Kafka outage: Notification API writes fail. Use a local fallback queue (database table) to buffer events until Kafka recovers.',
            'Circuit breaker: After 50% of APNs calls fail in 1 minute, open the circuit — stop calling APNs for 30 seconds, let all messages accumulate in the retry queue.',
          ],
        },
        {
          type: 'flow',
          title: 'Circuit breaker states for a provider',
          code: `stateDiagram-v2
  [*] --> Closed
  Closed --> Open: 50% of calls fail in 1 min
  Open --> HalfOpen: after 30 s cool-down
  HalfOpen --> Closed: trial calls succeed
  HalfOpen --> Open: trial calls fail
  note right of Open
    No calls to the provider.
    Messages wait in the retry queue.
  end note`,
          text: 'Closed = normal traffic. Open = stop calling a provider that is clearly down. Half-open = send a few test calls to see if it has recovered.',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      icon: 'ti-bolt',
      blocks: [
        { type: 'heading2', text: 'Batching Notifications' },
        {
          type: 'bullets',
          items: [
            'FCM and APNs support batch sending (up to 500 notifications per API call).',
            'Accumulate notifications in a 100ms window, then batch-send. Dramatically reduces API calls and improves throughput.',
            'Trade-off: Slight increase in notification latency (up to 100ms delay).',
          ],
        },
        { type: 'heading2', text: 'Priority Queues' },
        {
          type: 'paragraph',
          text: 'Not all notifications are equally urgent. Use separate Kafka topics (or queue priorities):',
        },
        {
          type: 'bullets',
          items: [
            'Critical (security alerts, OTP codes): Immediate, no batching.',
            'High (new messages, order updates): < 5 second delivery.',
            'Normal (promotions, recommendations): < 60 second delivery.',
            'Low (weekly digest, reports): Batch and send at scheduled times.',
          ],
        },
        {
          type: 'flow',
          title: 'Priority lanes',
          code: `flowchart LR
  IN([New notification]):::client --> P{Priority?}
  P -->|"Critical: OTP, security"| T1[[critical topic]]:::security --> W1[Dedicated workers<br/>no batching]:::server
  P -->|"High: messages, orders"| T2[[high topic]]:::queue --> W2[Workers<br/>under 5 s]:::server
  P -->|"Normal: promotions"| T3[[normal topic]]:::queue --> W3[Batched workers<br/>under 60 s]:::server
  P -->|"Low: digests"| T4[[low topic]]:::queue --> W4[Scheduled batch jobs]:::server`,
          text: "Separate lanes mean a marketing blast of millions of promotions can never delay someone's login code.",
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs',
      icon: 'ti-scale',
      blocks: [
        { type: 'heading2', text: 'Synchronous vs. Asynchronous Notification Sending' },
        {
          type: 'bullets',
          items: [
            "Synchronous: Caller waits for notification to be delivered. Simple, but the caller's request is blocked by third-party latency (APNs: 50-200ms). Not scalable.",
            'Asynchronous (recommended): Caller triggers notification by publishing to a queue and returns immediately. Workers process asynchronously. Caller sees fast response; notification delivered shortly after.',
          ],
        },
        {
          type: 'flow',
          title: 'Synchronous vs asynchronous sending',
          code: `sequenceDiagram
  participant C as Checkout
  participant N as Notification Service
  participant Q as Queue
  participant A as APNs
  Note over C,A: Synchronous — checkout waits on Apple
  C->>N: notify
  N->>A: send (50 to 200 ms, or a timeout)
  A-->>N: ok
  N-->>C: done
  Note over C,A: Asynchronous — checkout returns immediately
  C->>N: notify
  N->>Q: enqueue
  N-->>C: 202 Accepted (few ms)
  Q->>A: worker sends shortly after`,
        },
        { type: 'heading2', text: 'Single Notification Service vs. Per-Channel Services' },
        {
          type: 'bullets',
          items: [
            'Single service: Simpler to deploy and monitor. Shared code. But: an APNs outage could affect email sending if not carefully isolated.',
            'Per-channel microservices (PushService, EmailService, SmsService): Better isolation. Can scale independently. But: more services to manage.',
            'Recommendation: Start with a single service with internal channel isolation. Split to microservices when channel-specific scale demands it.',
          ],
        },
      ],
    },
    {
      id: 'production',
      title: 'Production Considerations',
      icon: 'ti-server',
      blocks: [
        { type: 'heading2', text: 'Analytics & Observability' },
        {
          type: 'bullets',
          items: [
            'Track: notification volume by channel, delivery success rate, delivery latency, open rate, click rate, unsubscribe rate.',
            'A/B test notification templates — send different messages to subsets of users and measure engagement.',
            'Spam detection: Flag users who unsubscribe frequently after notifications from a specific source.',
          ],
        },
        { type: 'heading2', text: 'User Preference Management' },
        {
          type: 'bullets',
          items: [
            'Store preferences in a database (user_id → notification_type → enabled/disabled).',
            'Cache preferences in Redis (short TTL) for fast lookup during the notification flow.',
            'Support global opt-out (no notifications at all) and per-type opt-out.',
            "Respect quiet hours (e.g., do not send push notifications between 10pm and 8am in the user's timezone).",
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
            'How do you ensure a notification is delivered exactly once?',
            'How would you design the retry mechanism for failed notifications?',
            'How would you handle the scenario where APNs is down for 2 hours?',
            'How do you handle user notification preferences at scale?',
            'How would you scale the system from 1M to 1B notifications per day?',
          ],
        },
        { type: 'heading2', text: 'Key Talking Points' },
        {
          type: 'bullets',
          items: [
            'Kafka as the backbone for decoupling and reliability.',
            'Idempotency with notification_id and Redis deduplication.',
            'Retry with exponential backoff + jitter.',
            'Dead Letter Queue for permanently failed notifications.',
            'Priority queues for time-sensitive vs. bulk notifications.',
            'Template engine for localization and A/B testing.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interviewers love depth on the reliability side of notification systems. Always bring up: idempotency, DLQ, exponential backoff, and third-party API rate limits. These show production engineering maturity.',
        },
      ],
    },
  ],
};
