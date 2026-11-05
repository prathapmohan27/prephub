import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is MongoDB and when would you choose it over a relational database?': {
    summary:
      'MongoDB is a document database that stores data as BSON (binary JSON) documents in collections, with flexible schemas, rich secondary indexes, an aggregation pipeline, replication and built-in sharding. Choose it when data is naturally hierarchical or varies in shape, when entities are usually read and written as a whole aggregate, or when you need easy horizontal scale — and prefer a relational DB when you have many cross-entity relationships, heavy ad-hoc reporting or multi-row transactional workflows.',
    details: [
      {
        type: 'paragraph',
        text: 'A MongoDB document can contain nested objects and arrays, so an order with its line items and shipping address is stored and fetched as one unit. That maps naturally to JavaScript objects in Node.js — no ORM mapping layer is strictly necessary.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGO_URL);
const orders = client.db('shop').collection('orders');

await orders.insertOne({
  customerId: 'c_42',
  status: 'paid',
  items: [
    { sku: 'KB-01', name: 'Keyboard', qty: 1, price: 40 },
    { sku: 'MS-02', name: 'Mouse', qty: 2, price: 15 },
  ],
  shipping: { city: 'Pune', pin: '411001' },
  createdAt: new Date(),
});

// Query into nested arrays without a join
const withMice = await orders.find({ 'items.sku': 'MS-02', status: 'paid' }).toArray();`,
      },
      { type: 'heading3', text: 'Choose MongoDB when' },
      {
        type: 'bullets',
        items: [
          'Data is document-shaped: product catalogs with varying attributes, CMS content, user profiles, event logs, IoT readings.',
          'You read/write whole aggregates and want one round trip per request.',
          'Schema evolves quickly (early-stage product, many optional fields).',
          'You need horizontal write scaling via sharding.',
        ],
      },
      { type: 'heading3', text: 'Prefer a relational database when' },
      {
        type: 'bullets',
        items: [
          'Many-to-many relationships and joins are central (accounting, ERP, bookings).',
          'Strong constraints matter: foreign keys, unique across tables, check constraints.',
          'Analysts need ad-hoc SQL reporting.',
          'Most operations update several entities atomically (MongoDB supports multi-document transactions, but they add overhead and are not the primary design).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: anchor the answer on access patterns — "I model MongoDB around how the data is read". Mention that MongoDB has ACID transactions and schema validation, so the old "no transactions, no schema" criticisms are outdated, but relational is still the better fit for highly relational data.',
      },
    ],
  },

  'What is the difference between embedding and referencing in MongoDB schema design?': {
    summary:
      'Embedding stores related data inside the parent document (e.g. addresses inside a user), giving single-read access and atomic updates. Referencing stores only an ID and keeps the related data in another collection, like a foreign key, avoiding duplication and unbounded growth but requiring a second query or `$lookup`. Embed for "contains", one-to-few and data read together; reference for one-to-many-large, many-to-many, or data that changes independently.',
    details: [
      {
        type: 'paragraph',
        text: 'The guiding principle: "data that is accessed together should be stored together" — but a document has a 16 MB limit and arrays that grow forever hurt performance, so bound what you embed.',
      },
      { type: 'heading3', text: 'Embedding' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// users collection — addresses always shown with the user, few per user
{
  _id: ObjectId('...'),
  name: 'Asha',
  addresses: [
    { label: 'home', city: 'Pune', pin: '411001' },
    { label: 'work', city: 'Mumbai', pin: '400001' },
  ],
}
// One read gets everything; updating user + addresses is atomic (single document)`,
      },
      { type: 'heading3', text: 'Referencing' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// posts collection — a user may have thousands of posts
{ _id: ObjectId('p1'), authorId: ObjectId('u1'), title: 'Hello', body: '...' }

// Fetch posts with author via $lookup (or two queries)
db.posts.aggregate([
  { $match: { authorId: ObjectId('u1') } },
  { $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'author' } },
  { $unwind: '$author' },
]);

// Mongoose: author: { type: Schema.Types.ObjectId, ref: 'User' } + .populate('author')`,
      },
      { type: 'heading3', text: 'Hybrid patterns' },
      {
        type: 'bullets',
        items: [
          '**Extended reference:** reference plus a copy of frequently-read fields — `author: { _id, name, avatar }` — avoids a lookup for lists; accept updating copies when the name changes.',
          '**Subset pattern:** embed the 10 most recent reviews in the product, keep all reviews in a `reviews` collection.',
          '**Bucket pattern:** group time-series readings into per-hour documents instead of one doc per reading or one giant array.',
        ],
      },
      {
        type: 'flow',
        title: 'Embed or reference?',
        code: `flowchart TD
  A{"Read together<br/>most of the time?"} -->|No| REF([Reference]):::db
  A -->|Yes| B{"Bounded size?<br/>one-to-few"}
  B -->|No, grows unbounded| REF
  B -->|Yes| C{"Updated independently<br/>or shared by many parents?"}
  C -->|Yes| HY(["Reference + copy key fields"]):::highlight
  C -->|No| EMB([Embed]):::cache`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: embedding unbounded arrays (all comments, all log entries) inside one document. It approaches the 16 MB limit, makes every update rewrite a large document and bloats indexes on array fields.',
      },
    ],
  },

  'What are indexes in MongoDB and when should you create them?': {
    summary:
      'MongoDB indexes are B-tree structures on one or more fields that let queries find documents without a full collection scan (COLLSCAN). Create them for fields used in frequent filters, sorts and joins (`$lookup` foreignField), following the ESR rule (Equality, Sort, Range) for compound indexes — but every index costs RAM and slows writes, so index for real query patterns verified with `explain()`.',
    details: [
      {
        type: 'paragraph',
        text: 'Every collection has a unique index on `_id`. Beyond that, nothing is indexed until you create it. A query without a usable index reads every document — fine at 1,000 docs, painful at 50 million.',
      },
      { type: 'heading3', text: 'Creating and checking indexes' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Single field + unique constraint
db.users.createIndex({ email: 1 }, { unique: true });

// Compound index following ESR: Equality → Sort → Range
// Query: status = 'paid', sorted by createdAt, total > 100
db.orders.createIndex({ status: 1, createdAt: -1, total: 1 });

db.orders.find({ status: 'paid', total: { $gt: 100 } })
  .sort({ createdAt: -1 })
  .explain('executionStats');
// winningPlan.stage: 'IXSCAN'  (good)   vs  'COLLSCAN' (bad)
// totalDocsExamined ≈ nReturned  → index is selective`,
      },
      { type: 'heading3', text: 'Index types' },
      {
        type: 'bullets',
        items: [
          '**Single field / compound** — the workhorses; compound supports left prefixes.',
          '**Multikey** — automatically created when indexing an array field (`tags: 1`).',
          '**Text** and **Atlas Search** — full-text search.',
          '**2dsphere** — geospatial queries (`$near`).',
          '**TTL** — `createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })` auto-deletes old docs (sessions, OTPs).',
          '**Partial** — `{ partialFilterExpression: { deleted: false } }` indexes only matching docs.',
          '**Wildcard** — `{ "attributes.$**": 1 }` for unpredictable field names.',
        ],
      },
      { type: 'heading3', text: 'In Mongoose' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const orderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, index: true },
  status: String,
  createdAt: Date,
});
orderSchema.index({ status: 1, createdAt: -1 });
// In production, set autoIndex: false and create indexes via migrations/scripts`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention ESR, `explain("executionStats")` (compare totalDocsExamined to nReturned), and the cost side — indexes should fit in RAM (WiredTiger cache) and each one slows inserts. Use the profiler or Atlas Performance Advisor to find slow queries first.',
      },
    ],
  },

  'What is the difference between find() and aggregate() in MongoDB?': {
    summary:
      '`find()` retrieves documents matching a filter, with optional projection, sort, skip and limit — it returns documents (or projected subsets) as they are stored. `aggregate()` runs a multi-stage pipeline that can filter, reshape, group, compute, join (`$lookup`) and unwind data, producing new result documents. Use find for straightforward reads; use aggregate when you need transformation or computation on the server.',
    details: [
      {
        type: 'paragraph',
        text: 'Anything `find()` can do, a pipeline with `$match`, `$project`, `$sort`, `$skip`, `$limit` can do too — but `find()` is simpler, slightly lighter, and supported by every ODM helper. The moment you need totals, grouping or joins, reach for `aggregate()`.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// find(): latest 10 paid orders for a customer, only some fields
const recent = await db.collection('orders')
  .find({ customerId: 'c_42', status: 'paid' })
  .project({ total: 1, createdAt: 1 })
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();

// aggregate(): revenue per customer this month, top 5
const top = await db.collection('orders').aggregate([
  { $match: { status: 'paid', createdAt: { $gte: new Date('2026-11-01') } } },
  { $group: { _id: '$customerId', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
  { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
]).toArray();
// → [{ _id: 'c_42', revenue: 1830, orders: 12, customer: [ {...} ] }, ...]`,
      },
      {
        type: 'bullets',
        items: [
          '**Output:** find returns stored documents; aggregate can return completely new shapes.',
          '**Capabilities:** aggregate adds `$group`, `$lookup`, `$unwind`, `$facet`, `$bucket`, `$addFields`, `$merge`/`$out` (write results to a collection).',
          '**Indexes:** both use indexes — in aggregate, only when `$match`/`$sort` appear early in the pipeline.',
          '**Mongoose:** `Model.find()` returns hydrated documents (getters, virtuals, save) unless `.lean()`; `Model.aggregate()` returns plain objects and does not apply schema casting to the pipeline.',
          '**Limits:** each pipeline stage has a 100 MB memory limit unless spilling to disk is allowed (`allowDiskUse`, enabled by default for many operations in recent versions).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "find for retrieval, aggregate for computation" and give a reporting example. Note that heavy aggregations on the primary can hurt OLTP traffic — run them on a secondary or pre-compute with `$merge`.',
      },
    ],
  },

  'What is the MongoDB aggregation pipeline?': {
    summary:
      "The aggregation pipeline is MongoDB's data-processing framework: documents flow through an ordered array of stages — `$match`, `$group`, `$project`, `$sort`, `$lookup`, `$unwind`, etc. — where each stage transforms the stream and passes the result to the next, much like Unix pipes or `array.filter().map().reduce()`. It runs on the server, so you compute reports, joins and reshaped data without pulling raw documents into Node.js.",
    details: [
      {
        type: 'paragraph',
        text: "Order matters: put `$match` (and `$sort` + `$limit` where possible) first so indexes are used and fewer documents reach expensive stages like `$group` or `$lookup`. MongoDB's optimizer reorders some stages automatically, but you should not rely on it.",
      },
      { type: 'heading3', text: 'Common stages' },
      {
        type: 'bullets',
        items: [
          '`$match` — filter (like WHERE).',
          '`$project` / `$addFields` / `$set` — reshape, compute fields.',
          '`$group` — group by key with accumulators (`$sum`, `$avg`, `$max`, `$push`, `$addToSet`).',
          '`$sort`, `$skip`, `$limit` — ordering and paging.',
          '`$unwind` — one output document per array element.',
          '`$lookup` — left outer join with another collection.',
          '`$facet` — run several sub-pipelines on the same input (e.g. results + total count).',
          '`$merge` / `$out` — write results to a collection (materialized views).',
        ],
      },
      { type: 'heading3', text: 'Example: top-selling products last 30 days' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const result = await db.collection('orders').aggregate([
  { $match: { status: 'paid', createdAt: { $gte: since } } },  // uses index
  { $unwind: '$items' },                                        // 1 doc per line item
  { $group: {
      _id: '$items.sku',
      unitsSold: { $sum: '$items.qty' },
      revenue:   { $sum: { $multiply: ['$items.qty', '$items.price'] } },
  } },
  { $sort: { revenue: -1 } },
  { $limit: 3 },
  { $project: { _id: 0, sku: '$_id', unitsSold: 1, revenue: 1 } },
]).toArray();
// → [ { sku: 'MON-27', unitsSold: 120, revenue: 24000 }, ... ]`,
      },
      {
        type: 'flow',
        title: 'Documents flowing through the pipeline',
        code: `flowchart LR
  C[("orders<br/>1M docs")]:::db --> M["$match<br/>paid, last 30d"]:::highlight
  M -->|"20k docs"| U["$unwind items"]:::server
  U -->|"55k docs"| G["$group by sku"]:::server
  G -->|"800 docs"| S["$sort + $limit 3"]:::server
  S --> P["$project"]:::client`,
        text: 'Filtering first shrinks the stream before the expensive stages.',
      },
      { type: 'heading3', text: 'Paging with a total count in one query' },
      {
        type: 'code',
        lang: 'javascript',
        code: `db.products.aggregate([
  { $match: { category: 'laptops' } },
  { $facet: {
      items: [{ $sort: { price: 1 } }, { $skip: 20 }, { $limit: 20 }],
      total: [{ $count: 'count' }],
  } },
]);`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: compare it to SQL (`$match` = WHERE, `$group` = GROUP BY, `$lookup` = LEFT JOIN) and stress stage ordering for performance. Mention `explain()` works on pipelines too.',
      },
    ],
  },

  'What is a transaction in MongoDB, and when would you use it?': {
    summary:
      'A MongoDB transaction groups reads and writes across multiple documents, collections or shards into one all-or-nothing ACID unit — supported since 4.0 on replica sets and 4.2 on sharded clusters. Single-document writes are already atomic, so use transactions only when a business invariant spans several documents (e.g. debit one account and credit another, or create an order and decrement stock), not as a default for every write.',
    details: [
      {
        type: 'paragraph',
        text: "MongoDB's schema design philosophy is to make most operations single-document (embedding), which is atomic for free. Transactions exist for the cases where that is not possible. They require a replica set (even a single-node one in development) and have a default 60-second runtime limit.",
      },
      { type: 'heading3', text: 'Single-document atomicity often suffices' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Atomic without a transaction: one document, conditional update
const res = await db.collection('products').updateOne(
  { _id: 'MON-27', stock: { $gte: 1 } },   // only if stock available
  { $inc: { stock: -1 }, $push: { reservations: { orderId, at: new Date() } } },
);
if (res.modifiedCount === 0) throw new Error('Out of stock');`,
      },
      { type: 'heading3', text: 'When you need a transaction' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await accounts.updateOne({ _id: 'A', balance: { $gte: 100 } },
                             { $inc: { balance: -100 } }, { session });
    await accounts.updateOne({ _id: 'B' }, { $inc: { balance: 100 } }, { session });
    await ledger.insertOne({ from: 'A', to: 'B', amount: 100 }, { session });
  });
} finally {
  await session.endSession();
}
// Either all three writes are committed, or none are visible`,
      },
      {
        type: 'bullets',
        items: [
          '**Use for:** money transfers, order + inventory + payment record, maintaining denormalized copies that must agree.',
          '**Avoid for:** single-document updates, high-throughput hot paths where a schema redesign would remove the need, long-running batch jobs.',
          '**Costs:** extra latency, lock contention, write conflicts that require retries, and pressure on the WiredTiger cache for large transactions.',
          '**Alternatives:** embedding, idempotent operations + outbox pattern, or saga with compensating actions in microservices.',
        ],
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: How do you handle transactions in MongoDB?' },
      {
        type: 'paragraph',
        text: 'Start a client session, run every operation with `{ session }` inside `session.withTransaction()` (which commits, aborts on error and automatically retries on transient errors), then end the session. Requirements: a replica set or sharded cluster, keeping transactions short, passing the session to every operation, and handling write conflicts. In Mongoose use `connection.transaction()` or `session.withTransaction()` and pass `{ session }` to saves and queries.',
      },
      { type: 'heading3', text: 'Callback API (native driver)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { MongoClient, ReadConcern, WriteConcern } from 'mongodb';
const client = new MongoClient(process.env.MONGO_URL!);  // must be a replica set

async function placeOrder(order: Order) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const db = client.db('shop');
      const stock = await db.collection('inventory').updateOne(
        { sku: order.sku, qty: { $gte: order.qty } },
        { $inc: { qty: -order.qty } },
        { session },                                   // ← every op gets the session
      );
      if (stock.modifiedCount === 0) throw new Error('OUT_OF_STOCK'); // → abort
      await db.collection('orders').insertOne({ ...order, status: 'placed' }, { session });
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
  } finally {
    await session.endSession();
  }
}`,
      },
      { type: 'heading3', text: 'Core API (manual control)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const session = client.startSession();
session.startTransaction({ writeConcern: { w: 'majority' } });
try {
  await orders.insertOne(doc, { session });
  await inventory.updateOne(filter, update, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;            // no automatic retry here — you handle it
} finally {
  await session.endSession();
}`,
      },
      { type: 'heading3', text: 'Mongoose' },
      {
        type: 'code',
        lang: 'typescript',
        code: `await mongoose.connection.transaction(async (session) => {
  const [order] = await Order.create([{ userId, items }], { session }); // array form required with options
  await User.updateOne({ _id: userId }, { $push: { orders: order._id } }, { session });
});`,
      },
      {
        type: 'bullets',
        items: [
          'Forgetting `{ session }` on one operation means it runs OUTSIDE the transaction and will not roll back — the most common bug.',
          'Keep transactions short (default limit 60 s via `transactionLifetimeLimitSeconds`); do no HTTP calls inside them.',
          'Do not run operations of one session in parallel (`Promise.all`) — run them sequentially.',
          'Make the callback idempotent, since `withTransaction` may run it more than once.',
          'Use `w: "majority"` + `readConcern: "snapshot"` for strong guarantees.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Local development: transactions fail on a standalone `mongod` ("Transaction numbers are only allowed on a replica set member or mongos"). Run a single-node replica set (`--replSet rs0` + `rs.initiate()`) or use `mongodb-memory-server`\'s `MongoMemoryReplSet` in tests.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: lead with "single-document operations are already atomic", then show a real multi-document case. That signals you design schemas to minimize transactions instead of reaching for them reflexively.',
      },
    ],
  },

  'Suppose you need to update three MongoDB collections as part of a single business operation. If the third update fails, how would you ensure that the first two updates are rolled back?':
    {
      summary:
        'Wrap all three updates in one multi-document transaction: start a session, pass `{ session }` to all three operations inside `session.withTransaction()`, and throw if the third fails (including when it matches nothing) — the driver aborts and none of the three writes become visible. If the collections live in different databases/services where a single transaction is not possible, use a saga with compensating actions or an outbox pattern instead.',
      details: [
        {
          type: 'paragraph',
          text: 'Inside a transaction, writes are not visible to other clients until commit. If anything throws before commit, `withTransaction` calls `abortTransaction()` and MongoDB discards every write in that transaction — so the first two updates are effectively rolled back. One subtlety: an update that matches zero documents is not an error, so you must check the result and throw yourself.',
        },
        { type: 'heading3', text: 'Solution: one transaction' },
        {
          type: 'code',
          lang: 'typescript',
          code: `async function checkout(userId: ObjectId, cartId: ObjectId, sku: string, qty: number) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      // 1) create order
      const { insertedId } = await db.collection('orders').insertOne(
        { userId, sku, qty, status: 'confirmed', createdAt: new Date() }, { session });

      // 2) clear cart
      await db.collection('carts').updateOne(
        { _id: cartId }, { $set: { items: [] } }, { session });

      // 3) decrement stock — may fail
      const res = await db.collection('inventory').updateOne(
        { sku, qty: { $gte: qty } }, { $inc: { qty: -qty } }, { session });

      if (res.modifiedCount === 0) {
        throw new Error('OUT_OF_STOCK');   // → transaction aborted, 1) and 2) discarded
      }
    }, { writeConcern: { w: 'majority' }, readConcern: { level: 'snapshot' } });
    return { ok: true };
  } catch (err) {
    // Nothing was committed — safe to return an error to the client
    return { ok: false, reason: (err as Error).message };
  } finally {
    await session.endSession();
  }
}`,
        },
        {
          type: 'flow',
          title: 'Transaction outcome',
          code: `sequenceDiagram
  participant API as Node.js
  participant DB as MongoDB (replica set)
  API->>DB: startTransaction
  API->>DB: insert orders (session)
  API->>DB: update carts (session)
  API->>DB: update inventory (session)
  DB-->>API: modifiedCount 0
  API->>DB: abortTransaction
  Note over DB: orders + carts writes discarded`,
        },
        { type: 'heading3', text: 'When one transaction is not possible: saga' },
        {
          type: 'paragraph',
          text: 'If the three updates belong to different services or databases (microservices), run each step locally and, on failure, execute compensating actions in reverse order. This gives eventual consistency, not isolation — other readers may briefly see intermediate state.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `const done: Array<() => Promise<void>> = [];
try {
  const order = await orderService.create(data);
  done.push(() => orderService.cancel(order.id));

  await cartService.clear(cartId);
  done.push(() => cartService.restore(cartId, snapshot));

  await inventoryService.reserve(sku, qty);       // fails
} catch (err) {
  for (const undo of done.reverse()) await undo(); // compensate 2 then 1
  throw err;
}`,
        },
        {
          type: 'bullets',
          items: [
            'Prerequisite: replica set or sharded cluster.',
            'Pass `{ session }` to every operation — otherwise that write is not rolled back.',
            'Make the transaction body idempotent; `withTransaction` retries on transient errors.',
            'Consider redesigning: if the data were embedded in one document, a single atomic update would avoid a transaction entirely.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: the two details that impress here are (1) "an update that matches nothing does not throw — check `modifiedCount`" and (2) the saga fallback for cross-service operations.',
        },
      ],
    },

  'What is a replica set in MongoDB?': {
    summary:
      "A replica set is a group of `mongod` nodes holding the same data: one primary that accepts writes and secondaries that replicate the primary's oplog asynchronously. If the primary fails, the remaining members hold an election and promote a secondary automatically (typically within seconds), providing high availability, data redundancy and optionally read scaling. It is the recommended production deployment and is required for transactions and change streams.",
    details: [
      {
        type: 'paragraph',
        text: 'The minimum recommended setup is three data-bearing members (or two plus an arbiter, though arbiters are discouraged) so a majority can still vote when one node is down. Writes go to the primary, which records them in the oplog (operations log); secondaries tail the oplog and apply the same operations.',
      },
      {
        type: 'flow',
        title: 'Replica set with automatic failover',
        code: `flowchart LR
  APP["Node.js app<br/>driver"]:::client -->|writes and reads| P[("Primary")]:::db
  P -->|oplog replication| S1[("Secondary 1")]:::db
  P -->|oplog replication| S2[("Secondary 2")]:::db
  APP -.->|"optional reads<br/>readPreference"| S1
  S1 <-->|heartbeats / election| S2`,
        text: 'If the primary stops responding, S1 and S2 elect a new primary; the driver discovers it and retries writes.',
      },
      { type: 'heading3', text: 'Connecting from Node.js' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const client = new MongoClient(
  'mongodb://db1:27017,db2:27017,db3:27017/shop?replicaSet=rs0' +
  '&retryWrites=true&w=majority&readPreference=primaryPreferred'
);
// The driver monitors topology and routes writes to the current primary.

// Per-query read preference (e.g. analytics on a secondary)
await db.collection('orders')
  .find({}, { readPreference: 'secondaryPreferred' })
  .toArray();`,
      },
      { type: 'heading3', text: 'Key concepts' },
      {
        type: 'bullets',
        items: [
          '**Write concern** `w: "majority"` — acknowledged only after a majority has the write, so it survives failover (default in modern MongoDB).',
          '**Read preference** — primary (default), primaryPreferred, secondary, secondaryPreferred, nearest.',
          '**Read concern** — local, majority, snapshot, linearizable: controls how "committed" the data you read is.',
          '**Replication lag** — secondaries may be behind, so reading from them can return stale data.',
          '**Hidden / delayed members** — for backups or protection against accidental deletes.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'A replica set is about availability and durability, not write scaling — all writes still go to one primary. For write/data-size scaling you need sharding. And reading from secondaries means accepting possibly stale reads.',
      },
    ],
  },

  'What is sharding in MongoDB?': {
    summary:
      "Sharding is MongoDB's horizontal scaling: a collection's data is partitioned across multiple shards (each a replica set) by a shard key. `mongos` routers send each query to the right shard(s) using metadata held by the config servers, and a balancer moves chunks (ranges of shard-key values) to keep data even. It lets you scale storage and write throughput beyond one server — and the shard key choice is the critical decision.",
    details: [
      {
        type: 'paragraph',
        text: 'Your application connects to `mongos` exactly as it would to a single database. Queries that include the shard key are "targeted" to one shard; queries without it are "scatter-gather" across all shards, which is slower.',
      },
      {
        type: 'flow',
        title: 'Sharded cluster architecture',
        code: `flowchart TD
  APP["Node.js app"]:::client --> R["mongos router"]:::network
  R --> CFG[("Config servers<br/>chunk metadata")]:::security
  R --> S1[("Shard A<br/>replica set<br/>userId MinKey..k")]:::db
  R --> S2[("Shard B<br/>replica set<br/>userId k..t")]:::db
  R --> S3[("Shard C<br/>replica set<br/>userId t..MaxKey")]:::db`,
      },
      { type: 'heading3', text: 'Enabling sharding' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// mongosh connected to mongos
sh.enableSharding('shop');   // optional in recent versions, still common in docs

// Hashed key → even write distribution, range queries become scatter-gather
sh.shardCollection('shop.events', { deviceId: 'hashed' });

// Ranged compound key → targeted queries per tenant + time ordering
sh.shardCollection('shop.orders', { tenantId: 1, createdAt: 1 });`,
      },
      { type: 'heading3', text: 'Choosing a shard key' },
      {
        type: 'bullets',
        items: [
          '**High cardinality** — many distinct values, so data can be split finely.',
          '**Even frequency** — no single value holds most of the data ("jumbo chunks").',
          '**Non-monotonic writes** — a ranged key on `createdAt` or ObjectId sends all inserts to the last shard (hot shard); use hashed or compound keys.',
          '**Query isolation** — most queries should include the key so they are targeted.',
          'Since MongoDB 5.0 you can reshard a collection (`reshardCollection`), but it is expensive — choose carefully up front.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Targeted: includes the shard key → hits one shard
db.orders.find({ tenantId: 't_9', createdAt: { $gte: lastWeek } });

// Scatter-gather: no shard key → every shard is queried, results merged by mongos
db.orders.find({ status: 'refunded' });`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "replica sets for availability, sharding for scale", and spend most of the answer on shard-key trade-offs (hashed vs ranged, monotonic keys causing hot shards). Also note sharding adds operational complexity — scale vertically and index well first.',
      },
    ],
  },

  'What is Mongoose and what are its advantages?': {
    summary:
      'Mongoose is an ODM (Object Data Modeling) library for MongoDB in Node.js. It adds schemas on top of schemaless collections, giving you type casting, validation, defaults, middleware (pre/post hooks), virtuals, instance/static methods, `populate()` for references and a chainable query API. The trade-off is extra overhead and abstraction compared to the native driver.',
    details: [
      {
        type: 'paragraph',
        text: 'MongoDB itself will store any shape you give it. Mongoose enforces structure at the application layer so a typo like `emial` or a string where a number is expected is caught before it reaches the database.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `import mongoose, { Schema, model, InferSchemaType } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:     { type: String, required: true, maxlength: 100 },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  password: { type: String, required: true, select: false },  // excluded by default
  age:      { type: Number, min: 13 },
}, { timestamps: true });                                       // createdAt / updatedAt

// Middleware: hash password before save
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

// Virtual: computed, not stored
userSchema.virtual('isAdmin').get(function () { return this.role === 'admin'; });

// Static method
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

type User = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);

await mongoose.connect(process.env.MONGO_URL!);
await UserModel.create({ email: ' Asha@Example.com ', name: 'Asha', password: 'secret', age: '30' });
// stored as: email 'asha@example.com', age 30 (cast from string), password hashed`,
      },
      { type: 'heading3', text: 'Advantages' },
      {
        type: 'bullets',
        items: [
          'Schema definition and validation (built-in and custom validators).',
          'Automatic type casting (`"30"` → 30, string → ObjectId).',
          'Middleware hooks for save, validate, find, delete, aggregate.',
          '`populate()` to resolve references across collections.',
          'Virtuals, getters/setters, instance and static methods — a clean model layer.',
          'Plugins (soft delete, pagination), discriminators (inheritance), TypeScript inference.',
        ],
      },
      { type: 'heading3', text: 'Disadvantages' },
      {
        type: 'bullets',
        items: [
          'Performance overhead from hydrating full documents (mitigated with `.lean()`).',
          '`populate()` is client-side joining — multiple queries, and can hide N+1 patterns.',
          'Validation runs only through Mongoose — writes via other tools bypass it (use MongoDB JSON Schema validation if you need DB-level enforcement).',
          'Update validators are off by default for `updateOne`/`findOneAndUpdate` (`runValidators: true`).',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: list schema, validation, middleware and populate, then show awareness of costs — `.lean()` for read-heavy endpoints and `runValidators` for updates. Mention NestJS integrates it via `@nestjs/mongoose`.',
      },
    ],
  },

  'What is the difference between lean() and regular Mongoose queries?': {
    summary:
      'A regular Mongoose query returns hydrated Mongoose documents — full model instances with change tracking, getters/setters, virtuals, `save()` and other methods. Adding `.lean()` returns plain JavaScript objects straight from the driver, skipping hydration, which makes reads noticeably faster and lighter on memory, but you lose document methods, virtuals, getters and defaults unless added via plugins.',
    details: [
      {
        type: 'paragraph',
        text: 'Hydration means wrapping every raw BSON document in a Mongoose Document object with internal state for tracking modifications. For a read-only API endpoint that just serializes to JSON, that work is wasted.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Regular query → Mongoose documents
const doc = await User.findById(id);
doc instanceof mongoose.Document;   // true
doc.name = 'Ravi';
await doc.save();                   // ✅ change tracking + validation + hooks
doc.isAdmin;                        // ✅ virtual works

// Lean query → plain objects (POJOs)
const plain = await User.findById(id).lean();
plain instanceof mongoose.Document; // false
plain.save;                         // undefined — no methods
plain.isAdmin;                      // undefined — virtuals not applied
JSON.stringify(plain);              // fast, no toJSON transform

// Typical read endpoint
app.get('/users', async (_req, res) => {
  const users = await User.find({ active: true })
    .select('name email')
    .limit(50)
    .lean();                        // much less overhead per document
  res.json(users);
});`,
      },
      {
        type: 'bullets',
        items: [
          '**Use lean()** for read-only lists, API responses, reports, caching to Redis, large result sets.',
          '**Use regular queries** when you will modify and `save()` the document, or rely on virtuals, getters, instance methods or document middleware.',
          '`populate()` works with lean — populated docs are also plain objects.',
          'Plugins such as `mongoose-lean-virtuals`, `mongoose-lean-defaults` and `mongoose-lean-getters` add selected features back.',
          'TypeScript: `.lean()` returns a plain type (no Document methods), so the compiler catches calls to `.save()`.',
          'For updates you usually do not need hydration at all — `updateOne()` with operators is faster than find + modify + save.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: `toJSON` transforms defined on the schema (e.g. removing `password` or renaming `_id` to `id`) do NOT run on lean results. Make sure sensitive fields are excluded with `select` or `select: false` in the schema.',
      },
    ],
  },
};
