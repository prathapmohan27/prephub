import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'ec2-vs-ecs-fargate-vs-lambda': {
    summary:
      'I default to **ECS on Fargate** for a long-running NestJS API: containers, no servers to patch, steady per-second pricing and no request-duration limits. I pick **Lambda** for spiky, event-driven or low-traffic work (S3 triggers, queue consumers, cron jobs, small APIs) where scale-to-zero matters and every invocation finishes well inside 15 minutes. I only reach for **EC2** when I need host-level control: special hardware, very steady high utilisation where reserved capacity is cheapest, or software that cannot run in a container.',
    details: [
      {
        type: 'paragraph',
        text: 'The three options sit on a spectrum of **control versus operational burden**. With EC2 you own the OS, patching, AMIs, scaling groups and capacity. With Fargate you own a container image and a task definition; AWS owns the hosts. With Lambda you own a function and its configuration; AWS owns everything else, including scaling per request. The further right you go, the less you operate, but the more constraints you accept.',
      },
      { type: 'heading3', text: 'How they compare' },
      {
        type: 'bullets',
        items: [
          '**Execution model:** EC2 and Fargate run a long-lived Node.js process that serves many concurrent requests on one event loop. Lambda runs one request per execution environment at a time, so in-process caches, connection pools and WebSockets behave very differently.',
          '**Limits:** Lambda has a hard **15-minute** timeout, bounded payload sizes and ephemeral `/tmp`. Fargate and EC2 have no request-duration limit, which suits WebSockets, SSE, long exports and background workers.',
          '**Scaling:** Lambda scales per request and to zero. Fargate scales by tasks via ECS Service Auto Scaling (CPU, memory or ALB request count) and needs a minimum of one task. EC2 scales by instances, the slowest of the three.',
          '**Cost shape:** Lambda is cheapest for bursty or low traffic and gets expensive at sustained high throughput. Fargate is predictable and can use Compute Savings Plans, Graviton (arm64) and Fargate Spot for interruptible work. EC2 with Savings Plans or Spot is cheapest per vCPU at steady high utilisation, if you can keep it busy.',
          '**Database connections:** many concurrent Lambdas can exhaust Postgres connections; put **RDS Proxy** in front, or use DynamoDB. A Fargate service keeps a bounded pool per task.',
        ],
      },
      { type: 'heading3', text: 'Decision rule' },
      {
        type: 'numbered',
        items: [
          'Event-driven glue, queue consumers, scheduled jobs, spiky or low-traffic APIs: **Lambda**.',
          'A main HTTP API with steady traffic, WebSockets, long requests, or a framework with heavy startup like NestJS: **Fargate** behind an ALB.',
          'GPU, custom kernels, licensed software, or large steady fleets where you have the platform team to run it: **EC2** (often still via ECS or EKS on EC2 capacity).',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: a NestJS API on Fargate behind an ALB, Graviton, autoscaling on CPU
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Api', {
  cluster,
  cpu: 512,
  memoryLimitMiB: 1024,
  desiredCount: 2, // at least 2 tasks so one AZ failure is survivable
  runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.ARM64 },
  taskImageOptions: {
    image: ecs.ContainerImage.fromAsset('./api'),
    containerPort: 3000,
  },
});
service.targetGroup.configureHealthCheck({ path: '/health/ready' });

const scaling = service.service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 20 });
scaling.scaleOnCpuUtilization('Cpu', { targetUtilizationPercent: 60 });`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: wrapping a whole NestJS monolith in a single Lambda "because serverless is cheaper". You pay a large cold start on every new environment, lose connection pooling, and at steady traffic it often costs more than two small Fargate tasks.',
      },
      {
        type: 'paragraph',
        text: 'Mixing is normal: a typical setup is the NestJS API on Fargate, with Lambdas for S3 upload processing, SQS consumers and EventBridge Scheduler jobs, all sharing the same domain code packaged differently.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a strong answer frames the choice by traffic shape, request duration, startup cost and team operations capacity, and mentions the concurrency model difference (one request per Lambda environment) and its impact on DB connections.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'At what traffic level does Lambda become more expensive than Fargate, and how would you estimate it?',
          'Why choose ECS over EKS for a small team?',
          'How do you run the same code as both a container and a Lambda?',
        ],
      },
    ],
  },

  'host-an-angular-spa-on-s3-cloudfront': {
    summary:
      'Build the app, upload it to a **private** S3 bucket, and serve it only through **CloudFront** using **Origin Access Control (OAC)** so the bucket is never public. Deep links like `/orders/42` are rewritten to `/index.html` (a CloudFront Function, or error responses mapping 403/404 to `index.html`). Hashed bundles get `Cache-Control: public, max-age=31536000, immutable`, `index.html` gets `no-cache`, and on deploy I upload assets first, `index.html` last, and invalidate only `/index.html`.',
    details: [
      {
        type: 'paragraph',
        text: 'An Angular production build emits content-hashed files (`main-ABC123.js`, `styles-XYZ.css`) plus an `index.html` that references them. That split drives the whole design: hashed files never change, so they can be cached forever at the edge and in browsers; `index.html` is the only file that must always be fresh.',
      },
      { type: 'heading3', text: 'Architecture' },
      {
        type: 'bullets',
        items: [
          '**S3 bucket:** Block Public Access on, no static website hosting (website endpoints do not work with OAC). Only CloudFront can read it via a bucket policy scoped to the distribution ARN.',
          '**OAC, not OAI:** Origin Access Identity is legacy; OAC signs requests with SigV4 and supports SSE-KMS encrypted buckets.',
          '**Deep links:** S3 has no `/orders/42` object. A viewer-request **CloudFront Function** rewrites any path without a file extension to `/index.html`. The alternative, custom error responses mapping 403/404 to `/index.html` with status 200, is simpler but applies to the whole distribution, so if `/api/*` is a second origin on the same distribution, real API 404s get turned into HTML.',
          '**API:** route `/api/*` as a second behaviour to the ALB or API Gateway with caching disabled. Same origin for the browser means no CORS.',
          '**Security headers:** attach a response headers policy (HSTS, CSP, X-Content-Type-Options).',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: private bucket + CloudFront with OAC + SPA rewrite function
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

const bucket = new s3.Bucket(this, 'Web', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
});

const spaRewrite = new cloudfront.Function(this, 'SpaRewrite', {
  runtime: cloudfront.FunctionRuntime.JS_2_0,
  code: cloudfront.FunctionCode.fromInline(\`
function handler(event) {
  var req = event.request;
  // No file extension => Angular route => serve the app shell
  if (!req.uri.includes('.')) req.uri = '/index.html';
  return req;
}\`),
});

new cloudfront.Distribution(this, 'Cdn', {
  defaultRootObject: 'index.html',
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    functionAssociations: [
      { function: spaRewrite, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
    ],
  },
});`,
      },
      { type: 'heading3', text: 'Deploy order and caching' },
      {
        type: 'code',
        lang: 'bash',
        code: `# 1. Hashed assets first: cache forever
aws s3 sync dist/app/browser s3://$BUCKET \\
  --exclude index.html \\
  --cache-control "public,max-age=31536000,immutable"

# 2. index.html last: always revalidate
aws s3 cp dist/app/browser/index.html s3://$BUCKET/index.html \\
  --cache-control "no-cache"

# 3. Only the shell needs invalidating
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/index.html"`,
      },
      {
        type: 'paragraph',
        text: 'Uploading assets before `index.html` means no user ever receives a shell that points at bundles that do not exist yet. Do not use `--delete` on the same deploy: users with the old `index.html` still open will lazy-load old chunks, and deleting them causes `ChunkLoadError`. Keep previous builds for a while and clean them up with a lifecycle rule or a later job.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: invalidating `/*` on every deploy. It throws away the whole edge cache for files that never changed, and it hides a missing `Cache-Control` strategy. With hashed filenames, invalidating `/index.html` is enough.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention OAC with a private bucket, the deep-link rewrite and why error-response mapping can break API 404s, the two-tier cache headers, and the assets-first, index-last deploy order that avoids broken chunks.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How would you do runtime configuration per environment without rebuilding?',
          'When would you move to SSR (Angular SSR on Lambda or Fargate) instead of a static SPA?',
          'How do you do blue/green or rollback for a static site?',
        ],
      },
    ],
  },

  'iam-roles-and-least-privilege': {
    summary:
      'A **policy** is a JSON document of Allow/Deny statements over actions, resources and conditions; a **role** is an identity with no long-term credentials that a service, workload or person assumes to get short-lived STS credentials. Least privilege means each workload gets its own role, granting only the actions it calls on the specific resource ARNs it touches, with conditions where useful, and no access keys in code. I start narrow, use CDK `grant*` methods, and use IAM Access Analyzer to find and remove unused permissions.',
    details: [
      {
        type: 'paragraph',
        text: 'IAM evaluation is **deny by default**: a request is allowed only if some policy allows it and nothing explicitly denies it. Several layers can be involved: identity policies on the role, resource policies (S3 bucket policy, SQS queue policy, KMS key policy), permission boundaries, session policies, and Organizations SCPs (and RCPs) as guardrails. An explicit Deny anywhere wins.',
      },
      { type: 'heading3', text: 'Roles in practice' },
      {
        type: 'bullets',
        items: [
          '**Lambda:** one execution role per function.',
          '**ECS:** two roles. The **task execution role** lets ECS pull the image, write logs and fetch secrets at startup; the **task role** is what your Node.js code uses at runtime via the SDK. Mixing them up is a classic mistake.',
          '**CI/CD:** GitHub Actions assumes a deploy role through **OIDC federation**, so there are no stored access keys.',
          '**Humans:** IAM Identity Center (SSO) with permission sets, not IAM users with access keys.',
        ],
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "OrdersTableReadWrite",
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"],
      "Resource": [
        "arn:aws:dynamodb:eu-west-1:123456789012:table/orders",
        "arn:aws:dynamodb:eu-west-1:123456789012:table/orders/index/*"
      ]
    },
    {
      "Sid": "UploadsOwnPrefixOnly",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::prephub-uploads/tenants/*"
    },
    {
      "Sid": "PublishOrderEvents",
      "Effect": "Allow",
      "Action": "events:PutEvents",
      "Resource": "arn:aws:events:eu-west-1:123456789012:event-bus/orders"
    }
  ]
}`,
      },
      {
        type: 'paragraph',
        text: 'In CDK, prefer the generated grants. They produce scoped statements, including KMS key permissions when the resource is encrypted, and keep permissions next to the code that needs them:',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `ordersTable.grantReadWriteData(apiTaskDefinition.taskRole);
uploadsBucket.grantPut(apiTaskDefinition.taskRole, 'tenants/*');
ordersBus.grantPutEventsTo(apiTaskDefinition.taskRole);
dbSecret.grantRead(apiTaskDefinition.taskRole);`,
      },
      { type: 'heading3', text: 'How I apply least privilege' },
      {
        type: 'numbered',
        items: [
          'One role per workload, never a shared "app role" across services.',
          'List the SDK calls the code actually makes and grant exactly those actions on exact ARNs; avoid `*` in both `Action` and `Resource`.',
          'Add conditions where they help: `aws:SourceArn` on resource policies, `aws:PrincipalOrgID`, required tags, or S3 key prefixes per tenant.',
          'Use guardrails at the account level (SCPs denying disabling CloudTrail, leaving approved regions, etc.).',
          'Review continuously: IAM Access Analyzer for unused access and external access findings, and policy validation in CI (for example `cdk-nag`).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: attaching `AdministratorAccess` or `AmazonS3FullAccess` "to get it working" and never coming back. A leaked task role then becomes access to every bucket in the account. Grant narrow first and widen with evidence from `AccessDenied` errors.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: distinguish identity vs resource policies, explain explicit Deny wins, name the ECS task role vs execution role split, and mention OIDC for CI and Access Analyzer for trimming. That shows you have actually run this in production.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How does cross-account access work (trust policy plus `sts:AssumeRole`)?',
          'What is a permission boundary and when would you use one?',
          'How would you isolate tenants in S3 or DynamoDB using IAM conditions?',
        ],
      },
    ],
  },

  'rds-aurora-vs-dynamodb': {
    summary:
      'Choose **Aurora/RDS (Postgres)** when the data is relational, access patterns are still evolving, or you need ad-hoc queries, joins, reporting and rich transactions. Choose **DynamoDB** when access patterns are known and key-based, you need predictable single-digit-millisecond latency at any scale, and you want no servers or connection management (great with Lambda). In DynamoDB you model **from access patterns, not entities**: pick partition and sort keys so each query is a single `Query` on a table or GSI, and denormalise accordingly.',
    details: [
      {
        type: 'paragraph',
        text: 'The real trade-off is **flexibility vs predictability**. SQL lets you ask new questions later with a new query and an index. DynamoDB makes every supported query fast and cheap at scale, but a new access pattern can mean a new GSI or a backfill migration. For most product teams building a NestJS API, Postgres on Aurora is the safer default; DynamoDB shines for high-scale, well-understood workloads such as sessions, carts, idempotency keys, feeds and event stores.',
      },
      { type: 'heading3', text: 'Decision rule' },
      {
        type: 'bullets',
        items: [
          '**Aurora/RDS:** relational integrity, many-to-many relationships, reporting and ad-hoc filters, multi-row transactions, an ORM like Prisma or TypeORM, a team fluent in SQL. Aurora Serverless v2 scales capacity in fine-grained ACUs for variable load. Use **RDS Proxy** if Lambdas connect.',
          '**DynamoDB:** known key-value or key-range access, huge or spiky scale, serverless consumers, global tables for multi-region active-active, TTL for expiring data, Streams for change events.',
          '**Both:** common. Postgres as the system of record, DynamoDB for a hot, high-volume slice.',
        ],
      },
      { type: 'heading3', text: 'Modelling in DynamoDB' },
      {
        type: 'numbered',
        items: [
          'Write down the access patterns first: "get order by id", "list a customer\'s orders newest first", "list open orders by status".',
          'Choose a high-cardinality **partition key** so traffic spreads evenly; avoid hot keys like `status=OPEN`.',
          'Use the **sort key** for ranges and hierarchy (`ORDER#2026-11-05#123`) so one `Query` returns related items in order.',
          'Add **GSIs** for alternate access patterns; they are eventually consistent.',
          'Keep items under the 400 KB item limit; put large blobs in S3 and store a pointer.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Single-table layout
// PK              SK                         attributes
// CUSTOMER#c1     PROFILE                    name, email
// CUSTOMER#c1     ORDER#2026-11-05#o123      total, status
// GSI1PK = STATUS#OPEN#<shard>, GSI1SK = createdAt  (sharded to avoid a hot key)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function listRecentOrders(customerId: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: 'app',
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :order)',
      ExpressionAttributeValues: { ':pk': \`CUSTOMER#\${customerId}\`, ':order': 'ORDER#' },
      ScanIndexForward: false, // newest first
      Limit: 20,
    }),
  );
  return res.Items;
}`,
      },
      {
        type: 'paragraph',
        text: '**Single-table design trade-offs:** putting several entity types in one table lets you fetch a customer and their orders in one query and keeps operations simple. The cost is a steeper learning curve, opaque keys, harder analytics, and coupling between entities. Many teams now use single-table design for tightly related entities and separate tables where entities are accessed independently. Both are valid; the access patterns decide.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: designing DynamoDB tables like SQL tables and then using `Scan` with filters for list pages. `Scan` reads (and bills for) the whole table; filter expressions run after the read. If you need ad-hoc filtering, you probably wanted Postgres or a search index.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "access patterns first", mention hot partitions and GSI eventual consistency, and be honest that Postgres is the better default when requirements are still moving. Mention RDS Proxy if Lambda talks to a relational DB.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you do analytics on DynamoDB data (export to S3, Streams into a warehouse)?',
          'How do conditional writes and transactions give you idempotency and invariants?',
          'On-demand vs provisioned capacity: when do you switch?',
        ],
      },
    ],
  },

  'sqs-vs-sns-vs-eventbridge': {
    summary:
      '**SQS** is a queue: one consumer group pulls work, with retries, visibility timeouts and a DLQ; use it to buffer and decouple work. **SNS** is fast push pub/sub: fan one message out to many subscribers, usually SQS queues. **EventBridge** is an event bus with content-based routing rules, many AWS and SaaS sources, schema discovery, archive and replay; use it for domain events between services. A common pattern is EventBridge or SNS for fan-out, with an SQS queue per consumer for durability and backpressure.',
    details: [
      {
        type: 'paragraph',
        text: 'They solve different problems: **work distribution** (SQS), **broadcast** (SNS), and **event routing** (EventBridge). Most real systems use more than one.',
      },
      { type: 'heading3', text: 'SQS' },
      {
        type: 'bullets',
        items: [
          'Pull-based, at-least-once delivery, so consumers must be idempotent.',
          '**Standard** queues: very high throughput, best-effort ordering. **FIFO** queues: ordering per `MessageGroupId` and deduplication, with lower throughput.',
          'Visibility timeout should exceed your processing time; set a **redrive policy** to a DLQ after N receives.',
          'Natural backpressure: messages wait if consumers are slow. Lambda event source mappings support partial batch failures (`ReportBatchItemFailures`) and a maximum concurrency setting to protect downstream DBs.',
        ],
      },
      { type: 'heading3', text: 'SNS' },
      {
        type: 'bullets',
        items: [
          'Push to many subscribers: SQS, Lambda, HTTP, email, SMS, mobile push.',
          'Subscription filter policies route by message attributes or body.',
          'No storage of its own; if a subscriber is down, retries are limited, which is why you subscribe SQS queues rather than calling services directly.',
          'Lowest latency fan-out, and SNS FIFO pairs with SQS FIFO for ordered fan-out.',
        ],
      },
      { type: 'heading3', text: 'EventBridge' },
      {
        type: 'bullets',
        items: [
          'Event buses with rules that match on any field in the event JSON and route to many target types.',
          'Receives AWS service events (for example ECS task state changes) and SaaS partner events.',
          '**Archive and replay** for reprocessing, schema registry for discovery.',
          '**EventBridge Pipes:** point-to-point source to target (for example DynamoDB Streams or SQS) with filtering, optional enrichment and transformation, with no glue Lambda.',
          '**EventBridge Scheduler:** one-off and recurring schedules at scale ("send a reminder at 09:00 in the user\'s time zone"), replacing hand-rolled cron tables.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Publish a domain event from the NestJS API
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const events = new EventBridgeClient({});

await events.send(
  new PutEventsCommand({
    Entries: [
      {
        EventBusName: 'orders',
        Source: 'prephub.orders',
        DetailType: 'OrderPlaced',
        Detail: JSON.stringify({ orderId, customerId, total }),
      },
    ],
  }),
);
// Check res.FailedEntryCount: PutEvents can partially fail without throwing`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: route OrderPlaced to a per-consumer SQS queue with a DLQ
const dlq = new sqs.Queue(this, 'EmailDlq');
const emailQueue = new sqs.Queue(this, 'EmailQueue', {
  visibilityTimeout: Duration.seconds(60),
  deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
});
new events.Rule(this, 'OrderPlacedToEmail', {
  eventBus: ordersBus,
  eventPattern: { source: ['prephub.orders'], detailType: ['OrderPlaced'] },
  targets: [new targets.SqsQueue(emailQueue)],
});`,
      },
      { type: 'heading3', text: 'Decision rule' },
      {
        type: 'bullets',
        items: [
          'One producer, one logical consumer, need buffering or retries: **SQS**.',
          'Same message to many consumers, simple attribute filtering, lowest latency: **SNS to SQS** fan-out.',
          'Domain events between services or teams, content-based routing, AWS service events, replay: **EventBridge**, with SQS behind each consumer that needs durability.',
          'Delayed or scheduled actions: **EventBridge Scheduler**.',
          'High-throughput ordered streams with replay by offset: consider Kinesis or Kafka (MSK) instead.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: putting large payloads in messages. All three have small message size limits. Store the payload in S3 or the database and send an ID (the claim-check pattern), which also keeps events stable as schemas evolve.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention at-least-once delivery and idempotent consumers, DLQs with alarms on them, and the "EventBridge for routing, SQS per consumer for durability" pattern. Bonus: the transactional outbox so the DB write and event publish cannot diverge.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you make an SQS consumer idempotent?',
          'How do you redrive messages from a DLQ safely?',
          'How do you guarantee an event is published if the DB transaction commits?',
        ],
      },
    ],
  },

  'direct-s3-uploads-with-presigned-urls': {
    summary:
      'The browser asks my API for permission, the API authorises the user, picks the object key and returns a **presigned URL** (or presigned POST) valid for a few minutes; the browser then uploads straight to S3, so file bytes never pass through Node.js. For large files I use **multipart upload**: the API creates the upload, presigns each part, the browser uploads parts in parallel, and the API completes it. Processing happens afterwards, triggered by an S3 event, with the record marked "pending" until it is scanned and validated.',
    details: [
      {
        type: 'paragraph',
        text: 'Proxying uploads through a NestJS API ties up memory, bandwidth and connections, and runs into API Gateway or Lambda payload limits. Presigned URLs move the heavy transfer to S3 while the API stays in control of **who** can upload, **where** it goes and **how big** it may be.',
      },
      { type: 'heading3', text: 'Flow' },
      {
        type: 'numbered',
        items: [
          'Angular calls `POST /uploads` with file name, type and size.',
          'API checks auth and quotas, generates the key itself (`tenants/{tenantId}/uploads/{uuid}`), never trusting the client file name as a path, and stores an `upload` row with status `PENDING`.',
          'API returns a short-lived presigned URL (minutes, not days).',
          'Browser uploads directly to S3 with progress events.',
          'An S3 `ObjectCreated` event (via EventBridge or SQS) triggers a worker that validates type and size, scans for malware if required, creates thumbnails, and marks the row `READY`.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// API: presigned POST with a size limit enforced by S3 itself
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'node:crypto';

const s3 = new S3Client({});

export async function createUpload(tenantId: string, contentType: string) {
  const key = \`tenants/\${tenantId}/uploads/\${randomUUID()}\`;
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: process.env.UPLOAD_BUCKET!,
    Key: key,
    Conditions: [
      ['content-length-range', 1, 50 * 1024 * 1024], // 50 MB max
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: 300, // seconds
  });
  return { key, url, fields };
}`,
      },
      {
        type: 'paragraph',
        text: 'A presigned `PUT` (`getSignedUrl` from `@aws-sdk/s3-request-presigner` with `PutObjectCommand`) is simpler, but it cannot enforce a size range the way presigned POST conditions can. Pick POST when size limits matter for a single-request upload.',
      },
      { type: 'heading3', text: 'Large files: multipart' },
      {
        type: 'bullets',
        items: [
          'A single PUT is capped at 5 GB, and one long request is fragile on mobile networks. Multipart lets you retry a single failed part and upload parts in parallel.',
          'API calls `CreateMultipartUpload`, presigns `UploadPart` for each part number, and later calls `CompleteMultipartUpload` with the part numbers and ETags the browser collected.',
          'Bucket CORS must allow `PUT` from your origin and **expose the `ETag` header**, otherwise the browser cannot read it.',
          'Add a lifecycle rule to **abort incomplete multipart uploads** after a few days; abandoned parts are invisible in listings but still billed.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const partUrls = await Promise.all(
  Array.from({ length: partCount }, (_, i) =>
    getSignedUrl(
      s3,
      new UploadPartCommand({ Bucket, Key, UploadId, PartNumber: i + 1 }),
      { expiresIn: 900 },
    ),
  ),
);`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: trusting that the upload is what the client said it was. The presigned URL only proves the user was allowed to upload. Validate the real object (size, magic bytes, malware scan) server-side before serving it to anyone, and serve user files from a separate domain or with `Content-Disposition: attachment`.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: emphasise that the server chooses the key, short expiry, size enforcement, CORS with exposed ETag, the abort-incomplete lifecycle rule, and asynchronous post-processing with a PENDING state. Mention S3 Transfer Acceleration only if users are far from the bucket region.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you serve private files back (presigned GET or CloudFront signed URLs/cookies)?',
          'How do you resume an interrupted multipart upload?',
          "How do you prevent one tenant reading another tenant's files?",
        ],
      },
    ],
  },

  'secrets-manager-vs-parameter-store': {
    summary:
      'I keep non-secret config in **SSM Parameter Store** (cheap, hierarchical, versioned) and credentials that need **rotation**, such as database passwords, in **Secrets Manager**, which has built-in rotation, cross-region replication and native RDS integration. Workloads read them through IAM-scoped roles: ECS injects them as environment variables at task start, Lambda fetches and caches them. Nothing secret lives in Git, Docker images, or plain Lambda environment variables visible in the console.',
    details: [
      {
        type: 'paragraph',
        text: 'Both services store encrypted values with KMS and are access-controlled with IAM, so the choice is mostly about features and cost: Secrets Manager charges per secret per month plus API calls, while Parameter Store standard parameters have no storage charge.',
      },
      { type: 'heading3', text: 'Comparison' },
      {
        type: 'bullets',
        items: [
          '**Secrets Manager:** managed rotation (a rotation Lambda, with templates for RDS/Aurora), RDS can manage the master password in it for you, cross-region replication for DR, resource policies for cross-account sharing. Best for DB credentials, third-party API keys you rotate, OAuth client secrets.',
          '**Parameter Store:** `String`, `StringList` and `SecureString` (KMS-encrypted). Hierarchies like `/prephub/prod/api/featureFlags`, `GetParametersByPath`, version history. Best for feature toggles, URLs, tuning values and low-sensitivity secrets that do not rotate.',
          '**AppConfig** (adjacent): when you need validated, gradually rolled-out runtime config or feature flags with automatic rollback on alarms.',
        ],
      },
      { type: 'heading3', text: 'Getting values into Node.js' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: ECS injects secrets at task start; only the execution role needs read access
const dbSecret = rds.DatabaseSecret.fromSecretNameV2(this, 'DbSecret', 'prephub/prod/db');

taskDefinition.addContainer('api', {
  image,
  environment: { NODE_ENV: 'production', LOG_LEVEL: 'info' },
  secrets: {
    DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
    STRIPE_KEY: ecs.Secret.fromSsmParameter(stripeKeyParam),
  },
});`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Lambda: fetch once per execution environment and cache with a TTL
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const sm = new SecretsManagerClient({});
let cached: { value: DbCreds; expires: number } | undefined;

export async function getDbCreds(): Promise<DbCreds> {
  if (cached && cached.expires > Date.now()) return cached.value;
  const res = await sm.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
  cached = { value: JSON.parse(res.SecretString!), expires: Date.now() + 5 * 60_000 };
  return cached.value;
}`,
      },
      {
        type: 'paragraph',
        text: 'Alternatives for Lambda are Powertools for AWS Lambda (TypeScript) parameters utility, or the AWS Parameters and Secrets Lambda Extension, both of which cache for you.',
      },
      { type: 'heading3', text: 'Rotation and its gotcha' },
      {
        type: 'paragraph',
        text: 'ECS-injected values are read only when the task starts, so after a rotation running tasks keep the old value until they are replaced. Use a rotation strategy that keeps the previous credential valid during the transition (the alternating-users strategy for databases), and either redeploy after rotation or read the secret at runtime with a short cache and reconnect on auth failure.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: committing a `.env` file, baking secrets into the Docker image, or putting raw secrets in Lambda environment variables where anyone with console read access sees them. Also: logging `process.env` on startup.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: separate config from secrets, scope IAM to specific secret ARNs per service and environment, mention rotation and how running workloads pick up rotated values, and validate config at boot (a Zod schema in the NestJS ConfigModule) so a missing value fails fast.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you separate dev, staging and prod secrets (separate accounts, not just prefixes)?',
          'How would you give a third-party CI system access without long-lived keys?',
          'What does the KMS key policy add on top of IAM?',
        ],
      },
    ],
  },

  'vpcs-subnets-and-nat-gateways': {
    summary:
      'A **VPC** is your private network in a region with its own IP range. **Public subnets** have a route to an Internet Gateway and hold internet-facing things like the ALB and NAT gateways; **private subnets** have no inbound route from the internet and hold Fargate tasks, Lambdas and databases. **Security groups** are stateful firewalls on each resource (ALB accepts 443, API accepts traffic only from the ALB SG, DB only from the API SG), and a **NAT gateway** lets private resources make outbound calls without being reachable from outside.',
    details: [
      {
        type: 'paragraph',
        text: 'Think in tiers spread across at least two Availability Zones: a public tier for load balancers, a private application tier, and an isolated data tier with no internet route at all. Each subnet lives in exactly one AZ, so you create one subnet per tier per AZ.',
      },
      { type: 'heading3', text: 'The pieces' },
      {
        type: 'bullets',
        items: [
          '**Route tables** make a subnet public or private: public subnets route `0.0.0.0/0` to the Internet Gateway; private subnets route it to a NAT gateway; isolated subnets have no default route.',
          '**Security groups:** stateful, allow-only rules, attached to ENIs. Reference other security groups instead of CIDRs, so rules follow resources as they scale.',
          '**Network ACLs:** stateless, subnet-level allow and deny rules. Usually left at defaults; useful for coarse blocks.',
          '**NAT gateway:** managed, outbound-only internet access for private subnets. One per AZ for high availability; a single shared one is cheaper but is a cross-AZ dependency and single point of failure.',
          '**VPC endpoints:** private access to AWS services without NAT. **Gateway endpoints** for S3 and DynamoDB have no hourly charge; **interface endpoints** (PrivateLink) cover ECR, Secrets Manager, CloudWatch Logs and more.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: three-tier VPC across 2 AZs with SG chaining
const vpc = new ec2.Vpc(this, 'Vpc', {
  maxAzs: 2,
  natGateways: 2, // one per AZ in prod; 1 (or 0 + endpoints) in dev
  subnetConfiguration: [
    { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
    { name: 'app', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    { name: 'data', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  ],
});
vpc.addGatewayEndpoint('S3', { service: ec2.GatewayVpcEndpointAwsService.S3 });

const albSg = new ec2.SecurityGroup(this, 'AlbSg', { vpc });
const apiSg = new ec2.SecurityGroup(this, 'ApiSg', { vpc });
const dbSg = new ec2.SecurityGroup(this, 'DbSg', { vpc });

albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
apiSg.addIngressRule(albSg, ec2.Port.tcp(3000), 'only the ALB');
dbSg.addIngressRule(apiSg, ec2.Port.tcp(5432), 'only the API');`,
      },
      { type: 'heading3', text: 'Request path' },
      {
        type: 'paragraph',
        text: 'The Angular app calls `https://app.example.com/api` → CloudFront → ALB in the public subnets → NestJS tasks in the private app subnets → Aurora in the isolated subnets. When the API calls Stripe, traffic leaves through the NAT gateway in its AZ; calls to S3 and DynamoDB go through gateway endpoints and never touch NAT.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: sending all AWS service traffic through NAT. NAT gateways bill per hour and per GB processed, and pulling container images from ECR or shipping logs through them can quietly become a top line item. Add S3/DynamoDB gateway endpoints first, and interface endpoints when the traffic justifies them.',
      },
      {
        type: 'paragraph',
        text: 'Plan CIDR ranges up front so they do not overlap with other VPCs or on-premises networks you may later connect via peering or Transit Gateway, and leave room for growth. Lambda in a VPC no longer has the large cold-start penalty it once had (it uses shared Hyperplane ENIs), but it still needs NAT or endpoints to reach AWS APIs.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain that a route table is what makes a subnet public, chain security groups by reference, put databases in isolated subnets, and bring up NAT cost and VPC endpoints unprompted.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'Security group vs NACL: when do you need a NACL?',
          'How do you connect several VPCs or accounts (peering vs Transit Gateway vs PrivateLink)?',
          'How would an engineer reach the private database for debugging (SSM Session Manager, no bastion with open SSH)?',
        ],
      },
    ],
  },

  'high-availability-and-disaster-recovery': {
    summary:
      '**High availability** handles component and AZ failures automatically, so every production tier runs across at least two AZs: ALB, Fargate tasks in each AZ, Aurora with a replica in another AZ. **Disaster recovery** handles losing a region or your data, and is driven by two business numbers: **RPO** (how much data you can lose) and **RTO** (how long you can be down). Those numbers pick the strategy, from backup-and-restore through pilot light and warm standby to active-active, and every step up costs more money and complexity.',
    details: [
      {
        type: 'paragraph',
        text: 'Start with the business, not the architecture. Ask: what does an hour of downtime cost, and how much data loss is acceptable? An internal tool might accept RPO of 24 hours and RTO of a day; a payments API might need RPO near zero and RTO in minutes. Most systems are well served by solid multi-AZ HA plus tested backups; multi-region is a deliberate investment.',
      },
      { type: 'heading3', text: 'Multi-AZ HA (baseline for production)' },
      {
        type: 'bullets',
        items: [
          'Stateless compute in at least two AZs behind an ALB with health checks; ECS replaces failed tasks.',
          'Aurora with at least one replica in another AZ (automatic failover), or RDS Multi-AZ. DynamoDB and S3 are multi-AZ by default.',
          'NAT gateway per AZ so one AZ failing does not cut egress for the others.',
          'Capacity headroom: if one of two AZs disappears, the remaining tasks must absorb the load, so scale limits and minimums must allow it.',
          'App behaviour: retries with backoff and jitter, timeouts, and reconnect logic in the DB pool so a failover is a blip, not an outage.',
        ],
      },
      { type: 'heading3', text: 'DR strategies (cheapest to most resilient)' },
      {
        type: 'numbered',
        items: [
          '**Backup and restore:** AWS Backup with cross-region (and ideally cross-account) copies, infrastructure in CDK so you can rebuild. RPO hours, RTO hours.',
          '**Pilot light:** data continuously replicated to the DR region (Aurora Global Database, DynamoDB global tables, S3 replication), compute not running. RPO seconds to minutes, RTO tens of minutes.',
          '**Warm standby:** a scaled-down full stack running in the DR region, scaled up on failover.',
          '**Multi-site active-active:** both regions serve traffic; needs conflict handling for writes and is the most complex and expensive.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Aurora Global Database: planned switchover / unplanned failover to the DR region
aws rds failover-global-cluster \\
  --global-cluster-identifier prephub-global \\
  --target-db-cluster-identifier arn:aws:rds:eu-central-1:123456789012:cluster:prephub-dr

# Route 53 failover records then point api.example.com at the DR ALB
# (health-check driven, or flipped manually as part of the runbook)`,
      },
      {
        type: 'paragraph',
        text: 'Backups also protect against the most common disaster, which is not a region outage but a bad migration, a deleted table or ransomware. Replication copies a `DROP TABLE` instantly, so you still need point-in-time recovery (Aurora point-in-time restore, DynamoDB PITR), S3 versioning, and backups in a separate account with restricted delete permissions.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: having backups and a DR region on paper but never testing a restore or failover. An untested DR plan has unknown RTO. Run game days, use AWS Fault Injection Service to kill tasks or an AZ, and time the full runbook.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: "Interview tip: define RPO and RTO in your own words, tie the strategy to business cost, and point out that replication is not a backup. Mentioning static stability (the DR region does not depend on the failed region's control plane) and regular game days signals real experience.",
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you handle writes in active-active (conflicts, home region per tenant)?',
          'What happens to in-flight SQS messages and sessions during a regional failover?',
          'How do you fail over the Angular SPA and CloudFront origin (origin groups)?',
        ],
      },
    ],
  },

  'monitoring-and-alarms-in-cloudwatch': {
    summary:
      'I collect the **golden signals** (latency percentiles, traffic, errors, saturation) from ALB, ECS/Lambda, the database and queues into CloudWatch, plus custom business metrics via Embedded Metric Format, structured JSON logs queried with **Logs Insights**, and traces with X-Ray or OpenTelemetry. I alarm on **symptoms users feel**, such as 5xx rate and p99 latency against SLOs, and on a few leading indicators like queue age, DLQ depth and DB connections, and route only actionable alarms to on-call.',
    details: [
      {
        type: 'paragraph',
        text: 'Monitoring has three goals: know that users are hurting (alarms), find out why (dashboards, logs, traces), and see trends before they become incidents. CloudWatch covers metrics, logs and alarms natively; for tracing, X-Ray or OpenTelemetry via the AWS Distro (ADOT), with CloudWatch Application Signals for service-level views and SLOs.',
      },
      { type: 'heading3', text: 'What I alarm on' },
      {
        type: 'bullets',
        items: [
          '**ALB:** `HTTPCode_Target_5XX_Count` as a percentage of `RequestCount` (metric math), `TargetResponseTime` p99, `UnHealthyHostCount`.',
          '**ECS:** CPU and memory utilisation sustained high, running task count below desired.',
          '**Lambda:** `Errors` rate, `Throttles`, `Duration` p99 approaching the timeout, `ConcurrentExecutions` near the account or reserved limit.',
          '**SQS:** `ApproximateAgeOfOldestMessage` (consumers falling behind) and any messages in the DLQ (`ApproximateNumberOfMessagesVisible` > 0).',
          '**Aurora/RDS:** `DatabaseConnections` near max, CPU, `FreeableMemory`, replica lag, free storage where it applies.',
          '**DynamoDB:** throttled requests, system errors.',
          '**Business:** orders per minute dropping to zero, login failures spiking. These catch failures that infrastructure metrics miss.',
          '**Synthetics:** a CloudWatch Synthetics canary hitting the login and a key API flow from outside.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: 5xx error-rate alarm using metric math, routed to on-call via SNS
const errorRate = new cw.MathExpression({
  expression: '100 * errors / MAX([requests, 1])',
  usingMetrics: {
    errors: alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, { statistic: 'Sum' }),
    requests: alb.metrics.requestCount({ statistic: 'Sum' }),
  },
  period: Duration.minutes(1),
});

new cw.Alarm(this, 'Api5xxRate', {
  metric: errorRate,
  threshold: 2, // percent
  evaluationPeriods: 5,
  datapointsToAlarm: 3, // 3 of 5 minutes: avoids paging on a single blip
  treatMissingData: cw.TreatMissingData.NOT_BREACHING,
}).addAlarmAction(new cwActions.SnsAction(onCallTopic));`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Custom business metric via Embedded Metric Format (Powertools for AWS Lambda)
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
const metrics = new Metrics({ namespace: 'PrepHub', serviceName: 'orders' });

metrics.addMetric('OrderPlaced', MetricUnit.Count, 1);
metrics.publishStoredMetrics(); // written as a structured log line, no PutMetricData call`,
      },
      {
        type: 'paragraph',
        text: 'Logs should be JSON (pino in NestJS) with a request or correlation ID, user or tenant ID and route, so Logs Insights can answer "which endpoints produced 5xx in the last 15 minutes" in one query. Set **log retention** on every log group; the default is to keep logs forever.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: alarming on averages and on every CPU spike. Averages hide the slow tail, and noisy alarms train on-call to ignore pages. Alarm on percentiles and error rates tied to SLOs, use M-of-N datapoints and composite alarms, and send non-urgent signals to a ticket queue instead of a pager.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "symptoms over causes", name SQS age of oldest message and DLQ depth (often forgotten), mention high-cardinality data belongs in logs or EMF dimensions with care, and connect alarms to runbooks so each page says what to do first.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you define an SLO and an error budget for this API?',
          'How do you trace a request from the Angular app through the API to the database?',
          'How do you keep CloudWatch costs down (log volume, metric cardinality)?',
        ],
      },
    ],
  },

  'lambda-cold-starts': {
    summary:
      'A **cold start** happens when Lambda has no warm execution environment for a request, so it must create one, download your code, start the Node.js runtime and run your module-level init code before the handler. It hits the first request after deploy, after idle, and every scale-out. I reduce it by shipping a small, tree-shaken ESM bundle, using modular SDK v3 clients, doing init work once outside the handler, choosing enough memory (more memory means more CPU), and using **provisioned concurrency** for latency-sensitive paths.',
    details: [
      {
        type: 'paragraph',
        text: 'Each execution environment handles one request at a time and is reused for later requests. Warm invocations skip init entirely, so cold starts matter most for user-facing synchronous APIs with spiky traffic, and very little for SQS consumers or nightly jobs.',
      },
      { type: 'heading3', text: 'What makes Node.js cold starts slow' },
      {
        type: 'bullets',
        items: [
          '**Package size and module graph:** requiring hundreds of files from `node_modules` is slow. Bundling with esbuild into one minified file is the biggest single win.',
          '**Heavy frameworks:** bootstrapping a full NestJS app (DI container, decorators, all modules) can dominate init time.',
          '**Init work:** fetching secrets, opening DB connections, loading large config.',
          '**Low memory:** CPU scales with configured memory, so a 128 MB function also runs its init on a fraction of a vCPU.',
        ],
      },
      { type: 'heading3', text: 'Techniques, in order of effort' },
      {
        type: 'numbered',
        items: [
          'Bundle with esbuild (CDK `NodejsFunction` does this), output ESM, mark only what you must as external, and minify.',
          'Import only the SDK v3 clients you use (`@aws-sdk/client-dynamodb`), never the whole SDK.',
          'Create clients and connections at module scope so warm invocations reuse them; lazy-load rarely used dependencies inside the code path that needs them.',
          'Tune memory with AWS Lambda Power Tuning; more memory often makes the function both faster and cheaper.',
          'Use arm64 (Graviton) for better price-performance.',
          'For a NestJS app on Lambda, cache the bootstrapped app across invocations, trim modules, or move the main API to Fargate.',
          'For strict latency targets, **provisioned concurrency** keeps pre-initialised environments ready, with Application Auto Scaling on a schedule or utilisation. It costs money even when idle.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// CDK: bundled ESM Node.js function on arm64 with provisioned concurrency on an alias
const fn = new lambdaNode.NodejsFunction(this, 'GetOrder', {
  entry: 'src/handlers/get-order.ts',
  runtime: lambda.Runtime.NODEJS_22_X,
  architecture: lambda.Architecture.ARM_64,
  memorySize: 1024,
  bundling: { format: lambdaNode.OutputFormat.ESM, minify: true, sourceMap: true },
});

const live = new lambda.Alias(this, 'Live', {
  aliasName: 'live',
  version: fn.currentVersion,
  provisionedConcurrentExecutions: 5,
});`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Handler: init once at module scope, reuse on warm invocations
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({})); // runs during init

export const handler = async (event: { pathParameters: { id: string } }) => {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: process.env.TABLE!, Key: { PK: \`ORDER#\${event.pathParameters.id}\` } }),
  );
  return { statusCode: Item ? 200 : 404, body: JSON.stringify(Item ?? {}) };
};`,
      },
      {
        type: 'callout',
        variant: 'info',
        text: 'Lambda SnapStart (snapshotting an initialised environment) is supported for Java, Python and .NET managed runtimes, not for Node.js at the time of writing, so for Node.js the tools are bundle size, init design and provisioned concurrency. Check the current docs before relying on it.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: "warming" functions with scheduled pings. It keeps only one environment warm, does nothing for concurrent scale-out, and adds noise. Measure with the `Init Duration` field in the REPORT log line first, then use provisioned concurrency if the numbers justify it. Also, VPC attachment is no longer a major cold-start cause.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain the init vs invoke phases, show you measure `Init Duration` (and p99 latency, not average), and say when cold starts do not matter (async consumers). Mention that if cold starts dominate a busy API, Fargate may simply be the better fit.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you keep DB connections under control when Lambda scales out (RDS Proxy)?',
          'Provisioned vs reserved concurrency: what is the difference?',
          'How would you run NestJS on Lambda, and would you?',
        ],
      },
    ],
  },

  'keep-the-aws-bill-under-control': {
    summary:
      'Make cost **visible and owned**: tag everything (service, team, environment), activate cost allocation tags, set AWS Budgets and Cost Anomaly Detection alerts, and review Cost Explorer regularly with the teams that own the spend. Then remove waste (idle resources, unbounded log retention, NAT data processing, oversized instances, forgotten dev environments), right-size with Compute Optimizer, move to Graviton and Spot where safe, and commit to **Savings Plans** only for the steady baseline.',
    details: [
      {
        type: 'paragraph',
        text: 'Cost control is an engineering practice, not a one-off clean-up. The goal is unit economics you can explain, such as cost per active user or per 1,000 API requests, and a process that catches regressions within days rather than at month end.',
      },
      { type: 'heading3', text: '1. Visibility and guardrails' },
      {
        type: 'bullets',
        items: [
          'Separate accounts per environment (AWS Organizations) so dev spend is obvious and can be capped by policy.',
          "Consistent tags applied in CDK (`Tags.of(app).add('team', 'orders')`) and activated as cost allocation tags.",
          'AWS Budgets per account and team with forecast alerts; Cost Anomaly Detection to catch sudden spikes such as a runaway Lambda loop.',
          'Cost and Usage Reports (CUR) into Athena or a dashboard for per-service and per-tag drill-down.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Monthly budget with an alert at 80% of forecasted spend
aws budgets create-budget --account-id 123456789012 \\
  --budget '{"BudgetName":"prephub-prod","BudgetLimit":{"Amount":"2000","Unit":"USD"},
             "TimeUnit":"MONTHLY","BudgetType":"COST"}' \\
  --notifications-with-subscribers '[{"Notification":{"NotificationType":"FORECASTED",
      "ComparisonOperator":"GREATER_THAN","Threshold":80,"ThresholdType":"PERCENTAGE"},
      "Subscribers":[{"SubscriptionType":"EMAIL","Address":"platform@example.com"}]}]'`,
      },
      { type: 'heading3', text: '2. Usual sources of waste' },
      {
        type: 'bullets',
        items: [
          '**NAT gateway data processing:** add S3/DynamoDB gateway endpoints and interface endpoints for ECR and CloudWatch Logs when traffic is heavy.',
          '**CloudWatch Logs:** no retention set, debug logging in production, and high-cardinality custom metrics.',
          '**Idle or oversized compute:** dev environments running at night, Fargate tasks sized for peak with no autoscaling, over-provisioned RDS instances.',
          '**Storage:** unattached EBS volumes, old snapshots, S3 without lifecycle rules (use Intelligent-Tiering or transitions), incomplete multipart uploads.',
          '**Data transfer:** cross-AZ chatter and internet egress; serve static assets through CloudFront.',
          '**Lambda:** functions misconfigured with too much or too little memory, and recursive loops between S3 and Lambda.',
        ],
      },
      { type: 'heading3', text: '3. Pay less for what you keep' },
      {
        type: 'numbered',
        items: [
          'Right-size using Compute Optimizer and actual utilisation, then autoscale.',
          'Move Node.js workloads to **Graviton (arm64)**; Node.js usually runs on arm64 without code changes, but check native modules.',
          'Use **Fargate Spot** or EC2 Spot for interruptible work such as queue workers and batch jobs.',
          'Buy **Compute Savings Plans** for the steady baseline only (they apply across EC2, Fargate and Lambda); keep the variable part on demand.',
          'Pick pricing modes deliberately: DynamoDB on-demand vs provisioned with autoscaling, Aurora Serverless v2 vs provisioned instances for steady load.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistake: buying a large Savings Plan or Reserved Instances before right-sizing. You lock in paying for waste for one to three years. Clean up and right-size first, then commit to the stable floor.',
      },
      {
        type: 'paragraph',
        text: 'Make cost part of design reviews: "this feature adds one SQS message and two Lambda invocations per order, roughly X per month at current volume" is the kind of estimate a senior engineer should be able to make with the AWS Pricing Calculator.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: lead with ownership and visibility (tags, budgets, anomaly detection), give two or three concrete savings you have found (NAT, logs, idle dev), and mention unit cost as the metric leadership actually cares about.',
      },
      { type: 'heading3', text: 'Follow-ups they may ask' },
      {
        type: 'bullets',
        items: [
          'How do you automatically shut down non-production environments outside working hours?',
          'Savings Plans vs Reserved Instances: what is the difference?',
          'How would you find out which service caused a 40% bill increase last month?',
        ],
      },
    ],
  },
};
