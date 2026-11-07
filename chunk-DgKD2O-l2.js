var e={"when-to-choose-mongodb":{summary:`MongoDB is a document database that stores data as BSON (binary JSON) documents in collections, with flexible schemas, rich secondary indexes, an aggregation pipeline, replication and built-in sharding. Choose it when data is naturally hierarchical or varies in shape, when entities are usually read and written as a whole aggregate, or when you need easy horizontal scale — and prefer a relational DB when you have many cross-entity relationships, heavy ad-hoc reporting or multi-row transactional workflows.`,details:[{type:`paragraph`,text:`A MongoDB document can contain nested objects and arrays, so an order with its line items and shipping address is stored and fetched as one unit. That maps naturally to JavaScript objects in Node.js — no ORM mapping layer is strictly necessary.`},{type:`code`,lang:`javascript`,code:`import { MongoClient } from 'mongodb';
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
const withMice = await orders.find({ 'items.sku': 'MS-02', status: 'paid' }).toArray();`},{type:`heading3`,text:`Choose MongoDB when`},{type:`bullets`,items:[`Data is document-shaped: product catalogs with varying attributes, CMS content, user profiles, event logs, IoT readings.`,`You read/write whole aggregates and want one round trip per request.`,`Schema evolves quickly (early-stage product, many optional fields).`,`You need horizontal write scaling via sharding.`]},{type:`heading3`,text:`Prefer a relational database when`},{type:`bullets`,items:[`Many-to-many relationships and joins are central (accounting, ERP, bookings).`,`Strong constraints matter: foreign keys, unique across tables, check constraints.`,`Analysts need ad-hoc SQL reporting.`,`Most operations update several entities atomically (MongoDB supports multi-document transactions, but they add overhead and are not the primary design).`]},{type:`callout`,variant:`tip`,text:`Interview tip: anchor the answer on access patterns — "I model MongoDB around how the data is read". Mention that MongoDB has ACID transactions and schema validation, so the old "no transactions, no schema" criticisms are outdated, but relational is still the better fit for highly relational data.`}]},"embedding-vs-referencing":{summary:'Embedding stores related data inside the parent document (e.g. addresses inside a user), giving single-read access and atomic updates. Referencing stores only an ID and keeps the related data in another collection, like a foreign key, avoiding duplication and unbounded growth but requiring a second query or `$lookup`. Embed for "contains", one-to-few and data read together; reference for one-to-many-large, many-to-many, or data that changes independently.',details:[{type:`paragraph`,text:`The guiding principle: "data that is accessed together should be stored together" — but a document has a 16 MB limit and arrays that grow forever hurt performance, so bound what you embed.`},{type:`heading3`,text:`Embedding`},{type:`code`,lang:`javascript`,code:`// users collection \u2014 addresses always shown with the user, few per user
{
  _id: ObjectId('...'),
  name: 'Asha',
  addresses: [
    { label: 'home', city: 'Pune', pin: '411001' },
    { label: 'work', city: 'Mumbai', pin: '400001' },
  ],
}
// One read gets everything; updating user + addresses is atomic (single document)`},{type:`heading3`,text:`Referencing`},{type:`code`,lang:`javascript`,code:`// posts collection \u2014 a user may have thousands of posts
{ _id: ObjectId('p1'), authorId: ObjectId('u1'), title: 'Hello', body: '...' }

// Fetch posts with author via $lookup (or two queries)
db.posts.aggregate([
  { $match: { authorId: ObjectId('u1') } },
  { $lookup: { from: 'users', localField: 'authorId', foreignField: '_id', as: 'author' } },
  { $unwind: '$author' },
]);

// Mongoose: author: { type: Schema.Types.ObjectId, ref: 'User' } + .populate('author')`},{type:`heading3`,text:`Hybrid patterns`},{type:`bullets`,items:["**Extended reference:** reference plus a copy of frequently-read fields — `author: { _id, name, avatar }` — avoids a lookup for lists; accept updating copies when the name changes.","**Subset pattern:** embed the 10 most recent reviews in the product, keep all reviews in a `reviews` collection.",`**Bucket pattern:** group time-series readings into per-hour documents instead of one doc per reading or one giant array.`]},{type:`flow`,title:`Embed or reference?`,code:`flowchart TD
  A{"Read together<br/>most of the time?"} -->|No| REF([Reference]):::db
  A -->|Yes| B{"Bounded size?<br/>one-to-few"}
  B -->|No, grows unbounded| REF
  B -->|Yes| C{"Updated independently<br/>or shared by many parents?"}
  C -->|Yes| HY(["Reference + copy key fields"]):::highlight
  C -->|No| EMB([Embed]):::cache`},{type:`callout`,variant:`warning`,text:`Common pitfall: embedding unbounded arrays (all comments, all log entries) inside one document. It approaches the 16 MB limit, makes every update rewrite a large document and bloats indexes on array fields.`}]},"indexes-and-when-to-create-them":{summary:"MongoDB indexes are B-tree structures on one or more fields that let queries find documents without a full collection scan (COLLSCAN). Create them for fields used in frequent filters, sorts and joins (`$lookup` foreignField), following the ESR rule (Equality, Sort, Range) for compound indexes — but every index costs RAM and slows writes, so index for real query patterns verified with `explain()`.",details:[{type:`paragraph`,text:"Every collection has a unique index on `_id`. Beyond that, nothing is indexed until you create it. A query without a usable index reads every document — fine at 1,000 docs, painful at 50 million."},{type:`heading3`,text:`Creating and checking indexes`},{type:`code`,lang:`javascript`,code:`// Single field + unique constraint
db.users.createIndex({ email: 1 }, { unique: true });

// Compound index following ESR: Equality \u2192 Sort \u2192 Range
// Query: status = 'paid', sorted by createdAt, total > 100
db.orders.createIndex({ status: 1, createdAt: -1, total: 1 });

db.orders.find({ status: 'paid', total: { $gt: 100 } })
  .sort({ createdAt: -1 })
  .explain('executionStats');
// winningPlan.stage: 'IXSCAN'  (good)   vs  'COLLSCAN' (bad)
// totalDocsExamined \u2248 nReturned  \u2192 index is selective`},{type:`heading3`,text:`Index types`},{type:`bullets`,items:[`**Single field / compound** — the workhorses; compound supports left prefixes.`,"**Multikey** — automatically created when indexing an array field (`tags: 1`).",`**Text** and **Atlas Search** — full-text search.`,"**2dsphere** — geospatial queries (`$near`).","**TTL** — `createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })` auto-deletes old docs (sessions, OTPs).","**Partial** — `{ partialFilterExpression: { deleted: false } }` indexes only matching docs.",'**Wildcard** — `{ "attributes.$**": 1 }` for unpredictable field names.']},{type:`heading3`,text:`In Mongoose`},{type:`code`,lang:`typescript`,code:`const orderSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, index: true },
  status: String,
  createdAt: Date,
});
orderSchema.index({ status: 1, createdAt: -1 });
// In production, set autoIndex: false and create indexes via migrations/scripts`},{type:`callout`,variant:`tip`,text:'Interview tip: mention ESR, `explain("executionStats")` (compare totalDocsExamined to nReturned), and the cost side — indexes should fit in RAM (WiredTiger cache) and each one slows inserts. Use the profiler or Atlas Performance Advisor to find slow queries first.'}]},"aggregation-pipeline":{summary:"The aggregation pipeline is MongoDB's data-processing framework: documents flow through an ordered array of stages — `$match`, `$group`, `$project`, `$sort`, `$lookup`, `$unwind`, etc. — where each stage transforms the stream and passes the result to the next, much like Unix pipes or `array.filter().map().reduce()`. It runs on the server, so you compute reports, joins and reshaped data without pulling raw documents into Node.js.",details:[{type:`paragraph`,text:"Order matters: put `$match` (and `$sort` + `$limit` where possible) first so indexes are used and fewer documents reach expensive stages like `$group` or `$lookup`. MongoDB's optimizer reorders some stages automatically, but you should not rely on it."},{type:`heading3`,text:`Common stages`},{type:`bullets`,items:["`$match` — filter (like WHERE).","`$project` / `$addFields` / `$set` — reshape, compute fields.","`$group` — group by key with accumulators (`$sum`, `$avg`, `$max`, `$push`, `$addToSet`).","`$sort`, `$skip`, `$limit` — ordering and paging.","`$unwind` — one output document per array element.","`$lookup` — left outer join with another collection.","`$facet` — run several sub-pipelines on the same input (e.g. results + total count).","`$merge` / `$out` — write results to a collection (materialized views)."]},{type:`heading3`,text:`Example: top-selling products last 30 days`},{type:`code`,lang:`javascript`,code:`const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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
// \u2192 [ { sku: 'MON-27', unitsSold: 120, revenue: 24000 }, ... ]`},{type:`flow`,title:`Documents flowing through the pipeline`,code:`flowchart LR
  C[("orders<br/>1M docs")]:::db --> M["$match<br/>paid, last 30d"]:::highlight
  M -->|"20k docs"| U["$unwind items"]:::server
  U -->|"55k docs"| G["$group by sku"]:::server
  G -->|"800 docs"| S["$sort + $limit 3"]:::server
  S --> P["$project"]:::client`,text:`Filtering first shrinks the stream before the expensive stages.`},{type:`heading3`,text:`Paging with a total count in one query`},{type:`code`,lang:`javascript`,code:`db.products.aggregate([
  { $match: { category: 'laptops' } },
  { $facet: {
      items: [{ $sort: { price: 1 } }, { $skip: 20 }, { $limit: 20 }],
      total: [{ $count: 'count' }],
  } },
]);`},{type:`callout`,variant:`tip`,text:"Interview tip: compare it to SQL (`$match` = WHERE, `$group` = GROUP BY, `$lookup` = LEFT JOIN) and stress stage ordering for performance. Mention `explain()` works on pipelines too."},{type:`divider`},{type:`heading3`,text:`Follow-up: What is the difference between find() and aggregate() in MongoDB?`},{type:`paragraph`,text:"`find()` retrieves documents matching a filter, with optional projection, sort, skip and limit — it returns documents (or projected subsets) as they are stored. `aggregate()` runs a multi-stage pipeline that can filter, reshape, group, compute, join (`$lookup`) and unwind data, producing new result documents. Use find for straightforward reads; use aggregate when you need transformation or computation on the server."},{type:`paragraph`,text:"Anything `find()` can do, a pipeline with `$match`, `$project`, `$sort`, `$skip`, `$limit` can do too — but `find()` is simpler, slightly lighter, and supported by every ODM helper. The moment you need totals, grouping or joins, reach for `aggregate()`."},{type:`code`,lang:`javascript`,code:`// find(): latest 10 paid orders for a customer, only some fields
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
// \u2192 [{ _id: 'c_42', revenue: 1830, orders: 12, customer: [ {...} ] }, ...]`},{type:`bullets`,items:[`**Output:** find returns stored documents; aggregate can return completely new shapes.`,"**Capabilities:** aggregate adds `$group`, `$lookup`, `$unwind`, `$facet`, `$bucket`, `$addFields`, `$merge`/`$out` (write results to a collection).","**Indexes:** both use indexes — in aggregate, only when `$match`/`$sort` appear early in the pipeline.","**Mongoose:** `Model.find()` returns hydrated documents (getters, virtuals, save) unless `.lean()`; `Model.aggregate()` returns plain objects and does not apply schema casting to the pipeline.","**Limits:** each pipeline stage has a 100 MB memory limit unless spilling to disk is allowed (`allowDiskUse`, enabled by default for many operations in recent versions)."]},{type:`callout`,variant:`tip`,text:'Interview tip: say "find for retrieval, aggregate for computation" and give a reporting example. Note that heavy aggregations on the primary can hurt OLTP traffic — run them on a secondary or pre-compute with `$merge`.'}]},"transactions-and-when-to-use-them":{summary:`A MongoDB transaction groups reads and writes across multiple documents, collections or shards into one all-or-nothing ACID unit — supported since 4.0 on replica sets and 4.2 on sharded clusters. Single-document writes are already atomic, so use transactions only when a business invariant spans several documents (e.g. debit one account and credit another, or create an order and decrement stock), not as a default for every write.`,details:[{type:`paragraph`,text:`MongoDB's schema design philosophy is to make most operations single-document (embedding), which is atomic for free. Transactions exist for the cases where that is not possible. They require a replica set (even a single-node one in development) and have a default 60-second runtime limit.`},{type:`heading3`,text:`Single-document atomicity often suffices`},{type:`code`,lang:`javascript`,code:`// Atomic without a transaction: one document, conditional update
const res = await db.collection('products').updateOne(
  { _id: 'MON-27', stock: { $gte: 1 } },   // only if stock available
  { $inc: { stock: -1 }, $push: { reservations: { orderId, at: new Date() } } },
);
if (res.modifiedCount === 0) throw new Error('Out of stock');`},{type:`heading3`,text:`When you need a transaction`},{type:`code`,lang:`javascript`,code:`const session = client.startSession();
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
// Either all three writes are committed, or none are visible`},{type:`bullets`,items:[`**Use for:** money transfers, order + inventory + payment record, maintaining denormalized copies that must agree.`,`**Avoid for:** single-document updates, high-throughput hot paths where a schema redesign would remove the need, long-running batch jobs.`,`**Costs:** extra latency, lock contention, write conflicts that require retries, and pressure on the WiredTiger cache for large transactions.`,`**Alternatives:** embedding, idempotent operations + outbox pattern, or saga with compensating actions in microservices.`]},{type:`divider`},{type:`heading3`,text:`Follow-up: How do you handle transactions in MongoDB?`},{type:`paragraph`,text:"Start a client session, run every operation with `{ session }` inside `session.withTransaction()` (which commits, aborts on error and automatically retries on transient errors), then end the session. Requirements: a replica set or sharded cluster, keeping transactions short, passing the session to every operation, and handling write conflicts. In Mongoose use `connection.transaction()` or `session.withTransaction()` and pass `{ session }` to saves and queries."},{type:`heading3`,text:`Callback API (native driver)`},{type:`code`,lang:`typescript`,code:`import { MongoClient, ReadConcern, WriteConcern } from 'mongodb';
const client = new MongoClient(process.env.MONGO_URL!);  // must be a replica set

async function placeOrder(order: Order) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const db = client.db('shop');
      const stock = await db.collection('inventory').updateOne(
        { sku: order.sku, qty: { $gte: order.qty } },
        { $inc: { qty: -order.qty } },
        { session },                                   // \u2190 every op gets the session
      );
      if (stock.modifiedCount === 0) throw new Error('OUT_OF_STOCK'); // \u2192 abort
      await db.collection('orders').insertOne({ ...order, status: 'placed' }, { session });
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
  } finally {
    await session.endSession();
  }
}`},{type:`heading3`,text:`Core API (manual control)`},{type:`code`,lang:`typescript`,code:`const session = client.startSession();
session.startTransaction({ writeConcern: { w: 'majority' } });
try {
  await orders.insertOne(doc, { session });
  await inventory.updateOne(filter, update, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;            // no automatic retry here \u2014 you handle it
} finally {
  await session.endSession();
}`},{type:`heading3`,text:`Mongoose`},{type:`code`,lang:`typescript`,code:`await mongoose.connection.transaction(async (session) => {
  const [order] = await Order.create([{ userId, items }], { session }); // array form required with options
  await User.updateOne({ _id: userId }, { $push: { orders: order._id } }, { session });
});`},{type:`bullets`,items:["Forgetting `{ session }` on one operation means it runs OUTSIDE the transaction and will not roll back — the most common bug.","Keep transactions short (default limit 60 s via `transactionLifetimeLimitSeconds`); do no HTTP calls inside them.","Do not run operations of one session in parallel (`Promise.all`) — run them sequentially.","Make the callback idempotent, since `withTransaction` may run it more than once.",'Use `w: "majority"` + `readConcern: "snapshot"` for strong guarantees.']},{type:`callout`,variant:`warning`,text:'Local development: transactions fail on a standalone `mongod` ("Transaction numbers are only allowed on a replica set member or mongos"). Run a single-node replica set (`--replSet rs0` + `rs.initiate()`) or use `mongodb-memory-server`\'s `MongoMemoryReplSet` in tests.'},{type:`callout`,variant:`tip`,text:`Interview tip: lead with "single-document operations are already atomic", then show a real multi-document case. That signals you design schemas to minimize transactions instead of reaching for them reflexively.`}]},"roll-back-updates-across-3-collections":{summary:"Wrap all three updates in one multi-document transaction: start a session, pass `{ session }` to all three operations inside `session.withTransaction()`, and throw if the third fails (including when it matches nothing) — the driver aborts and none of the three writes become visible. If the collections live in different databases/services where a single transaction is not possible, use a saga with compensating actions or an outbox pattern instead.",details:[{type:`paragraph`,text:"Inside a transaction, writes are not visible to other clients until commit. If anything throws before commit, `withTransaction` calls `abortTransaction()` and MongoDB discards every write in that transaction — so the first two updates are effectively rolled back. One subtlety: an update that matches zero documents is not an error, so you must check the result and throw yourself."},{type:`heading3`,text:`Solution: one transaction`},{type:`code`,lang:`typescript`,code:`async function checkout(userId: ObjectId, cartId: ObjectId, sku: string, qty: number) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      // 1) create order
      const { insertedId } = await db.collection('orders').insertOne(
        { userId, sku, qty, status: 'confirmed', createdAt: new Date() }, { session });

      // 2) clear cart
      await db.collection('carts').updateOne(
        { _id: cartId }, { $set: { items: [] } }, { session });

      // 3) decrement stock \u2014 may fail
      const res = await db.collection('inventory').updateOne(
        { sku, qty: { $gte: qty } }, { $inc: { qty: -qty } }, { session });

      if (res.modifiedCount === 0) {
        throw new Error('OUT_OF_STOCK');   // \u2192 transaction aborted, 1) and 2) discarded
      }
    }, { writeConcern: { w: 'majority' }, readConcern: { level: 'snapshot' } });
    return { ok: true };
  } catch (err) {
    // Nothing was committed \u2014 safe to return an error to the client
    return { ok: false, reason: (err as Error).message };
  } finally {
    await session.endSession();
  }
}`},{type:`flow`,title:`Transaction outcome`,code:`sequenceDiagram
  participant API as Node.js
  participant DB as MongoDB (replica set)
  API->>DB: startTransaction
  API->>DB: insert orders (session)
  API->>DB: update carts (session)
  API->>DB: update inventory (session)
  DB-->>API: modifiedCount 0
  API->>DB: abortTransaction
  Note over DB: orders + carts writes discarded`},{type:`heading3`,text:`When one transaction is not possible: saga`},{type:`paragraph`,text:`If the three updates belong to different services or databases (microservices), run each step locally and, on failure, execute compensating actions in reverse order. This gives eventual consistency, not isolation — other readers may briefly see intermediate state.`},{type:`code`,lang:`typescript`,code:`const done: Array<() => Promise<void>> = [];
try {
  const order = await orderService.create(data);
  done.push(() => orderService.cancel(order.id));

  await cartService.clear(cartId);
  done.push(() => cartService.restore(cartId, snapshot));

  await inventoryService.reserve(sku, qty);       // fails
} catch (err) {
  for (const undo of done.reverse()) await undo(); // compensate 2 then 1
  throw err;
}`},{type:`bullets`,items:[`Prerequisite: replica set or sharded cluster.`,"Pass `{ session }` to every operation — otherwise that write is not rolled back.","Make the transaction body idempotent; `withTransaction` retries on transient errors.",`Consider redesigning: if the data were embedded in one document, a single atomic update would avoid a transaction entirely.`]},{type:`callout`,variant:`tip`,text:'Interview tip: the two details that impress here are (1) "an update that matches nothing does not throw — check `modifiedCount`" and (2) the saga fallback for cross-service operations.'}]},"replica-sets":{summary:"A replica set is a group of `mongod` nodes holding the same data: one primary that accepts writes and secondaries that replicate the primary's oplog asynchronously. If the primary fails, the remaining members hold an election and promote a secondary automatically (typically within seconds), providing high availability, data redundancy and optionally read scaling. It is the recommended production deployment and is required for transactions and change streams.",details:[{type:`paragraph`,text:`The minimum recommended setup is three data-bearing members (or two plus an arbiter, though arbiters are discouraged) so a majority can still vote when one node is down. Writes go to the primary, which records them in the oplog (operations log); secondaries tail the oplog and apply the same operations.`},{type:`flow`,title:`Replica set with automatic failover`,code:`flowchart LR
  APP["Node.js app<br/>driver"]:::client -->|writes and reads| P[("Primary")]:::db
  P -->|oplog replication| S1[("Secondary 1")]:::db
  P -->|oplog replication| S2[("Secondary 2")]:::db
  APP -.->|"optional reads<br/>readPreference"| S1
  S1 <-->|heartbeats / election| S2`,text:`If the primary stops responding, S1 and S2 elect a new primary; the driver discovers it and retries writes.`},{type:`heading3`,text:`Connecting from Node.js`},{type:`code`,lang:`typescript`,code:`const client = new MongoClient(
  'mongodb://db1:27017,db2:27017,db3:27017/shop?replicaSet=rs0' +
  '&retryWrites=true&w=majority&readPreference=primaryPreferred'
);
// The driver monitors topology and routes writes to the current primary.

// Per-query read preference (e.g. analytics on a secondary)
await db.collection('orders')
  .find({}, { readPreference: 'secondaryPreferred' })
  .toArray();`},{type:`heading3`,text:`Key concepts`},{type:`bullets`,items:['**Write concern** `w: "majority"` — acknowledged only after a majority has the write, so it survives failover (default in modern MongoDB).',`**Read preference** — primary (default), primaryPreferred, secondary, secondaryPreferred, nearest.`,`**Read concern** — local, majority, snapshot, linearizable: controls how "committed" the data you read is.`,`**Replication lag** — secondaries may be behind, so reading from them can return stale data.`,`**Hidden / delayed members** — for backups or protection against accidental deletes.`]},{type:`callout`,variant:`warning`,text:`A replica set is about availability and durability, not write scaling — all writes still go to one primary. For write/data-size scaling you need sharding. And reading from secondaries means accepting possibly stale reads.`}]},"how-sharding-works":{summary:"Sharding is MongoDB's horizontal scaling: a collection's data is partitioned across multiple shards (each a replica set) by a shard key. `mongos` routers send each query to the right shard(s) using metadata held by the config servers, and a balancer moves chunks (ranges of shard-key values) to keep data even. It lets you scale storage and write throughput beyond one server — and the shard key choice is the critical decision.",details:[{type:`paragraph`,text:'Your application connects to `mongos` exactly as it would to a single database. Queries that include the shard key are "targeted" to one shard; queries without it are "scatter-gather" across all shards, which is slower.'},{type:`flow`,title:`Sharded cluster architecture`,code:`flowchart TD
  APP["Node.js app"]:::client --> R["mongos router"]:::network
  R --> CFG[("Config servers<br/>chunk metadata")]:::security
  R --> S1[("Shard A<br/>replica set<br/>userId MinKey..k")]:::db
  R --> S2[("Shard B<br/>replica set<br/>userId k..t")]:::db
  R --> S3[("Shard C<br/>replica set<br/>userId t..MaxKey")]:::db`},{type:`heading3`,text:`Enabling sharding`},{type:`code`,lang:`javascript`,code:`// mongosh connected to mongos
sh.enableSharding('shop');   // optional in recent versions, still common in docs

// Hashed key \u2192 even write distribution, range queries become scatter-gather
sh.shardCollection('shop.events', { deviceId: 'hashed' });

// Ranged compound key \u2192 targeted queries per tenant + time ordering
sh.shardCollection('shop.orders', { tenantId: 1, createdAt: 1 });`},{type:`heading3`,text:`Choosing a shard key`},{type:`bullets`,items:[`**High cardinality** — many distinct values, so data can be split finely.`,`**Even frequency** — no single value holds most of the data ("jumbo chunks").`,"**Non-monotonic writes** — a ranged key on `createdAt` or ObjectId sends all inserts to the last shard (hot shard); use hashed or compound keys.",`**Query isolation** — most queries should include the key so they are targeted.`,"Since MongoDB 5.0 you can reshard a collection (`reshardCollection`), but it is expensive — choose carefully up front."]},{type:`code`,lang:`javascript`,code:`// Targeted: includes the shard key \u2192 hits one shard
db.orders.find({ tenantId: 't_9', createdAt: { $gte: lastWeek } });

// Scatter-gather: no shard key \u2192 every shard is queried, results merged by mongos
db.orders.find({ status: 'refunded' });`},{type:`callout`,variant:`tip`,text:`Interview tip: say "replica sets for availability, sharding for scale", and spend most of the answer on shard-key trade-offs (hashed vs ranged, monotonic keys causing hot shards). Also note sharding adds operational complexity — scale vertically and index well first.`}]},"mongoose-and-its-advantages":{summary:"Mongoose is an ODM (Object Data Modeling) library for MongoDB in Node.js. It adds schemas on top of schemaless collections, giving you type casting, validation, defaults, middleware (pre/post hooks), virtuals, instance/static methods, `populate()` for references and a chainable query API. The trade-off is extra overhead and abstraction compared to the native driver.",details:[{type:`paragraph`,text:"MongoDB itself will store any shape you give it. Mongoose enforces structure at the application layer so a typo like `emial` or a string where a number is expected is caught before it reaches the database."},{type:`code`,lang:`typescript`,code:`import mongoose, { Schema, model, InferSchemaType } from 'mongoose';
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
// stored as: email 'asha@example.com', age 30 (cast from string), password hashed`},{type:`heading3`,text:`Advantages`},{type:`bullets`,items:[`Schema definition and validation (built-in and custom validators).`,'Automatic type casting (`"30"` → 30, string → ObjectId).',`Middleware hooks for save, validate, find, delete, aggregate.`,"`populate()` to resolve references across collections.",`Virtuals, getters/setters, instance and static methods — a clean model layer.`,`Plugins (soft delete, pagination), discriminators (inheritance), TypeScript inference.`]},{type:`heading3`,text:`Disadvantages`},{type:`bullets`,items:["Performance overhead from hydrating full documents (mitigated with `.lean()`).","`populate()` is client-side joining — multiple queries, and can hide N+1 patterns.",`Validation runs only through Mongoose — writes via other tools bypass it (use MongoDB JSON Schema validation if you need DB-level enforcement).`,"Update validators are off by default for `updateOne`/`findOneAndUpdate` (`runValidators: true`)."]},{type:`callout`,variant:`tip`,text:"Interview tip: list schema, validation, middleware and populate, then show awareness of costs — `.lean()` for read-heavy endpoints and `runValidators` for updates. Mention NestJS integrates it via `@nestjs/mongoose`."},{type:`divider`},{type:`heading3`,text:`Follow-up: What is the difference between lean() and regular Mongoose queries?`},{type:`paragraph`,text:"A regular Mongoose query returns hydrated Mongoose documents — full model instances with change tracking, getters/setters, virtuals, `save()` and other methods. Adding `.lean()` returns plain JavaScript objects straight from the driver, skipping hydration, which makes reads noticeably faster and lighter on memory, but you lose document methods, virtuals, getters and defaults unless added via plugins."},{type:`paragraph`,text:`Hydration means wrapping every raw BSON document in a Mongoose Document object with internal state for tracking modifications. For a read-only API endpoint that just serializes to JSON, that work is wasted.`},{type:`code`,lang:`typescript`,code:`// Regular query \u2192 Mongoose documents
const doc = await User.findById(id);
doc instanceof mongoose.Document;   // true
doc.name = 'Ravi';
await doc.save();                   // \u2705 change tracking + validation + hooks
doc.isAdmin;                        // \u2705 virtual works

// Lean query \u2192 plain objects (POJOs)
const plain = await User.findById(id).lean();
plain instanceof mongoose.Document; // false
plain.save;                         // undefined \u2014 no methods
plain.isAdmin;                      // undefined \u2014 virtuals not applied
JSON.stringify(plain);              // fast, no toJSON transform

// Typical read endpoint
app.get('/users', async (_req, res) => {
  const users = await User.find({ active: true })
    .select('name email')
    .limit(50)
    .lean();                        // much less overhead per document
  res.json(users);
});`},{type:`bullets`,items:[`**Use lean()** for read-only lists, API responses, reports, caching to Redis, large result sets.`,"**Use regular queries** when you will modify and `save()` the document, or rely on virtuals, getters, instance methods or document middleware.","`populate()` works with lean — populated docs are also plain objects.","Plugins such as `mongoose-lean-virtuals`, `mongoose-lean-defaults` and `mongoose-lean-getters` add selected features back.","TypeScript: `.lean()` returns a plain type (no Document methods), so the compiler catches calls to `.save()`.","For updates you usually do not need hydration at all — `updateOne()` with operators is faster than find + modify + save."]},{type:`callout`,variant:`warning`,text:"Pitfall: `toJSON` transforms defined on the schema (e.g. removing `password` or renaming `_id` to `id`) do NOT run on lean results. Make sure sensitive fields are excluded with `select` or `select: false` in the schema."}]},"schema-design-patterns":{summary:"Schema design patterns are ways to shape documents around the access patterns instead of around entities. **Bucket** groups many small items (readings, events) into one document per time window. **Computed** stores pre-calculated values such as totals or averages on write. **Subset** embeds only the hot part of a large relation. **Extended reference** copies a few fields of a referenced document to avoid a `$lookup`. **Outlier** handles the rare document that would break the normal design, using an overflow flag. I pick them by starting from the top queries and their read/write ratio.",details:[{type:`paragraph`,text:`The embed vs reference answer covers the basic choice. These patterns are the next step: they are named, repeatable trade-offs that MongoDB itself documents. Each one trades extra work on write (or some duplication) for cheaper, more predictable reads. In an interview, name the pattern, the query it serves and the cost you accept.`},{type:`heading3`,text:`Bucket: group many small items`},{type:`code`,lang:`javascript`,code:`// One document per sensor per hour instead of one per reading
{
  sensorId: 'S-42',
  start: ISODate('2026-11-06T10:00:00Z'),
  count: 3,
  sum: 64.2,
  readings: [
    { t: ISODate('2026-11-06T10:00:05Z'), v: 21.3 },
    { t: ISODate('2026-11-06T10:00:10Z'), v: 21.4 },
    { t: ISODate('2026-11-06T10:00:15Z'), v: 21.5 },
  ],
}

// Append with an upsert; cap the bucket size so it never grows unbounded
db.readings.updateOne(
  { sensorId: 'S-42', start: hourStart, count: { $lt: 200 } },
  { $push: { readings: { t: now, v: 21.6 } }, $inc: { count: 1, sum: 21.6 } },
  { upsert: true },
);`},{type:`bullets`,items:[`**Use for:** IoT readings, metrics, chat messages per conversation per day, audit events.`,`**Wins:** far fewer documents and index entries, and range reads touch a few buckets instead of thousands of documents.`,`**Note:** for pure time-series data, MongoDB **time series collections** (5.0+) apply bucketing internally. Prefer them over hand-rolled buckets unless you need custom bucket shapes.`]},{type:`heading3`,text:`Computed: pay on write, not on every read`},{type:`code`,lang:`javascript`,code:`// When a review is added, update the product's precomputed rating in one atomic update
await products.updateOne(
  { _id: productId },
  { $inc: { 'rating.count': 1, 'rating.sum': stars } },
);
// Read side: avg = rating.sum / rating.count, with no aggregation over millions of reviews`},{type:`paragraph`,text:`Use it when a value is read far more often than its inputs change (rating averages, order totals, follower counts, dashboard numbers). If exactness is not critical, you can also recompute in a scheduled job instead of on every write.`},{type:`heading3`,text:`Subset: embed only the working set`},{type:`code`,lang:`javascript`,code:`// products: embed the 10 most recent reviews for the product page
{ _id: 'p1', name: 'Kettle', recentReviews: [ /* max 10 */ ] }

// reviews: the full history, paginated separately
{ _id: ObjectId(), productId: 'p1', stars: 5, text: '...', createdAt: ISODate() }

// Keep the embedded array bounded with $push + $slice
db.products.updateOne(
  { _id: 'p1' },
  { $push: { recentReviews: { $each: [review], $sort: { createdAt: -1 }, $slice: 10 } } },
);`},{type:`heading3`,text:`Extended reference: copy the fields lists need`},{type:`code`,lang:`javascript`,code:`// orders keep a reference AND a snapshot of what the order list displays
{
  _id: ObjectId(),
  customer: { _id: ObjectId('c1'), name: 'Asha Rao', city: 'Pune' },
  items: [ /* ... */ ],
}`},{type:`paragraph`,text:`Copy only fields that rarely change, or fields whose historical value is actually correct (the shipping address at order time). Decide explicitly how copies get updated: never (a snapshot), in a background job, or through a change stream listener.`},{type:`heading3`,text:`Outlier: design for the 99%, flag the 1%`},{type:`code`,lang:`javascript`,code:`// Most books have a handful of buyers embedded; a bestseller overflows
{ _id: 'book-1', buyers: [ /* up to 1000 ids */ ], hasOverflow: true }

// Overflow documents hold the rest
{ bookId: 'book-1', page: 2, buyers: [ /* next 1000 ids */ ] }

// The app checks hasOverflow and only then reads the extra documents`},{type:`paragraph`,text:`Use it when one celebrity account, viral post or huge tenant would force a worse design on everyone. The cost is extra branching in application code, so keep that logic in one repository function.`},{type:`heading3`,text:`Others worth naming`},{type:`bullets`,items:["**Polymorphic:** different shapes in one collection with a `type` field (products of different categories), queried through shared fields.",'**Attribute:** turn many sparse fields into `attrs: [{ k, v }]` so one compound index `{ "attrs.k": 1, "attrs.v": 1 }` covers all of them.',"**Schema versioning:** a `schemaVersion` field so old and new shapes coexist during migrations.",`**Archive:** move cold data to another collection or to Online Archive / S3 to keep the working set small.`]},{type:`callout`,variant:`tip`,text:`Interview tip: walk through it as "Top queries → pattern → cost." For example: "The product page is 95% of traffic, so I use subset for the latest reviews and computed for the rating. The cost is two writes per review, and I accept that because reviews are rare compared to page views."`},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you keep extended-reference copies in sync when the source changes? (A change stream or background job, or treat the copy as a snapshot by design.)`,`Bucket pattern vs time series collections? (Time series collections bucket automatically and compress well; manual buckets give custom shapes and precomputed aggregates.)`,`What if a computed value drifts from the truth? (A periodic reconciliation job recomputes from source and alerts on differences.)`,"How do you detect that you need the outlier pattern? (Monitor document size and array length percentiles, e.g. with `$bsonSize` in an aggregation.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Choosing patterns before writing down the access patterns and their frequencies.`,`Duplicating data with no plan for keeping the copies in sync.`,`Using the bucket pattern without a size cap, which recreates the unbounded array problem.`,`Applying every pattern at once, which makes simple CRUD needlessly complex.`]},{type:`callout`,variant:`important`,text:`Senior signal: you tie each pattern to a specific query and its read/write ratio, state the cost you accept (duplication, extra writes, app-side branching), and explain how you keep duplicated data correct over time.`}]},"unbounded-arrays-and-the-16-mb-limit":{summary:`An array that grows without limit (all comments, all followers, all log events) keeps making the document bigger. Every read loads it, every update rewrites and replicates more of it, a multikey index gets an entry per element, and eventually the write fails because a BSON document cannot exceed 16 MB. Performance usually degrades long before the limit. I bound arrays by design, using subset, bucket or a separate collection, and I monitor document sizes.`,details:[{type:`heading3`,text:`Why it hurts long before 16 MB`},{type:`bullets`,items:[`**Reads get heavier:** fetching the document pulls the whole array into the WiredTiger cache and over the network unless you project it away, so a "load user" call becomes a multi-megabyte read.`,"**Writes get heavier:** each `$push` modifies a large document. WiredTiger writes new versions of modified data, and the oplog and replication traffic grow too.",`**Index bloat:** an index on an array field is multikey, with one index entry per element. A document with 50,000 tags has 50,000 entries in that index, and a compound index can include at most one array field.`,`**Cache pressure:** large hot documents push other data out of the cache, so latency rises for unrelated queries.`,`**Concurrency:** all writes to that array target one document, so heavy concurrent appends contend on the same document.`]},{type:`heading3`,text:`What happens at the limit`},{type:`paragraph`,text:'The maximum BSON document size is 16 MB. An insert or update that would produce a larger document fails with an error (`BSONObjectTooLarge` or a "document too large" write error) and the write is rejected. Nothing is truncated. In production this tends to show up as one specific user or tenant suddenly getting 500s, often your biggest customer. Aggregation stages that build arrays (`$group` with `$push`, `$lookup` results) have the same limit for each output document.'},{type:`code`,lang:`javascript`,code:`// Find your largest documents before users do
db.posts.aggregate([
  { $project: { size: { $bsonSize: '$$ROOT' }, comments: { $size: { $ifNull: ['$comments', []] } } } },
  { $sort: { size: -1 } },
  { $limit: 10 },
]);

// Collection-level view: average object size
db.posts.stats().avgObjSize;`},{type:`heading3`,text:`Fixes`},{type:`numbered`,items:["**Separate collection (reference):** move comments to their own collection with `{ postId, createdAt }` indexed, and paginate. This is the default fix for one-to-many-large.","**Subset:** keep only the latest N items embedded with `$push` + `$each` + `$slice` for the page that needs them.",`**Bucket:** group items into capped documents (e.g. 500 messages per bucket), creating a new bucket when one fills.`,"**Computed counters:** store `commentCount` instead of calling `$size` on a huge array.",`**GridFS or object storage** for genuinely large blobs (files, big JSON payloads) rather than stuffing them into documents.`]},{type:`code`,lang:`javascript`,code:`// Migrating comments out of posts, in batches
const cursor = db.posts.find({ 'comments.0': { $exists: true } }, { comments: 1 });
for await (const post of cursor) {
  if (post.comments.length) {
    await db.comments.insertMany(
      post.comments.map((c) => ({ ...c, postId: post._id })),
      { ordered: false },
    );
  }
  await db.posts.updateOne(
    { _id: post._id },
    { $unset: { comments: '' }, $set: { commentCount: post.comments.length } },
  );
}`},{type:`callout`,variant:`warning`,text:"Make the migration idempotent and resumable: give each comment a stable `_id`, so re-running after a crash cannot create duplicates (inserts fail with duplicate-key errors, which you ignore with `ordered: false`). Switch reads to the new collection before removing the old field."},{type:`callout`,variant:`tip`,text:`A useful rule: if you cannot name a realistic maximum for an array, it should not be embedded. "Up to 5 addresses" is fine, while "all orders ever" is not.`},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`Does projecting the array away fix read cost? (It reduces network transfer, but the server still loads the full document into cache.)`,"How large can a multikey index get? (One entry per array element per document. Watch index sizes with `$indexStats` and `collStats`.)",`When is a large embedded array acceptable? (When it is bounded, read together, and rarely updated, like a product with 30 images.)`,"How do you detect growth early? (Scheduled `$bsonSize` checks, alerts on document size percentiles, and application-level caps.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Assuming the problem only starts at 16 MB, when latency and cache problems start far earlier.`,"Using `$size` on large arrays in hot queries instead of maintaining a counter.",`Embedding user-generated, time-ordered data (comments, messages, events) without any cap.`,`Migrating data out in one huge script with no batching or resume point.`]},{type:`callout`,variant:`important`,text:`Senior signal: you explain the gradual costs (cache, multikey index size, replication, contention), know that the limit causes a hard write failure for your biggest customers first, and propose bounded designs plus monitoring and a safe, batched migration path.`}]},"model-an-e-commerce-catalog":{summary:`I start from the access patterns: the product page (product + variants + rating + a few reviews), category listing and search, the add-to-cart stock check, and checkout decrementing stock. I embed variants in the product because they are bounded and always read together. Inventory goes in its own collection keyed by SKU because it is write-hot and must be updated atomically at checkout. Reviews get their own collection with a subset of recent reviews and a computed rating on the product. Each choice is driven by a query and its read/write ratio.`,details:[{type:`heading3`,text:`1. Access patterns first`},{type:`bullets`,items:[`**Product page** (highest traffic): product, all variants, price, rating summary, the latest reviews.`,`**Category listing / filters:** by category, price range, attributes (colour, size, brand), sorted by popularity or price.`,`**Cart and checkout:** check stock and reserve or decrement it for a SKU, which must never oversell.`,`**Reviews page:** paginated reviews for one product, newest first.`,`**Admin:** update prices and attributes; imports of thousands of products.`]},{type:`heading3`,text:`2. products: variants embedded`},{type:`code`,lang:`javascript`,code:`// products
{
  _id: ObjectId('...'),
  slug: 'steel-kettle-1-7l',
  name: 'Steel Kettle 1.7L',
  brand: 'Acme',
  categoryIds: [ObjectId('kitchen'), ObjectId('appliances')],
  categoryPath: 'home/kitchen/appliances',     // for prefix queries / breadcrumbs
  attrs: [{ k: 'material', v: 'steel' }, { k: 'capacity', v: '1.7L' }], // attribute pattern
  variants: [                                  // bounded: tens, not thousands
    { sku: 'KET-17-BLK', color: 'black', price: 2499, images: ['...'] },
    { sku: 'KET-17-SLV', color: 'silver', price: 2599, images: ['...'] },
  ],
  priceMin: 2499,                              // computed, for listing filters/sort
  rating: { count: 132, sum: 581 },            // computed
  recentReviews: [ /* last 5, subset pattern */ ],
  status: 'active',
  schemaVersion: 2,
  updatedAt: ISODate(),
}`},{type:`paragraph`,text:`Variants are embedded because the page always shows them all, there are few of them, and they change together with the product. If a catalog had products with thousands of variants (a configurable industrial part), I would move variants to their own collection, which is the outlier pattern for that subset of products.`},{type:`heading3`,text:`3. inventory: separate, per SKU, atomic`},{type:`code`,lang:`javascript`,code:`// inventory: one document per SKU per warehouse
{ _id: 'KET-17-BLK:BLR1', sku: 'KET-17-BLK', warehouse: 'BLR1', available: 40, reserved: 3 }

// Reserve stock atomically: the filter is the guard, so no overselling
const res = await db.collection('inventory').updateOne(
  { sku, warehouse, available: { $gte: qty } },
  { $inc: { available: -qty, reserved: qty } },
);
if (res.modifiedCount === 0) throw new OutOfStockError(sku);`},{type:`bullets`,items:[`Stock changes on every order while product content changes rarely. Keeping them apart means checkout writes do not rewrite large product documents or invalidate product caches.`,`A conditional update on a single document is atomic, so no transaction is needed for one SKU. For a multi-SKU cart, either reserve SKU by SKU and compensate on failure, or use a transaction when all-or-nothing matters.`,"Reservations get an expiry (a `reservations` collection with a TTL index, plus a job that returns stock) so abandoned carts release stock.",'The listing page shows "in stock" from a denormalized `inStock` flag updated asynchronously, not from a live join.']},{type:`heading3`,text:`4. reviews: separate + subset + computed`},{type:`code`,lang:`javascript`,code:`// reviews
{ _id: ObjectId(), productId: ObjectId('...'), userId: ObjectId('...'),
  user: { name: 'Asha R.' },                     // extended reference snapshot
  stars: 4, title: 'Boils fast', body: '...', verifiedPurchase: true,
  createdAt: ISODate() }

db.reviews.createIndex({ productId: 1, createdAt: -1 });              // product reviews page
db.reviews.createIndex({ productId: 1, userId: 1 }, { unique: true }); // one review per user

// On new review: insert, then update product's computed rating + subset
await products.updateOne(
  { _id: productId },
  {
    $inc: { 'rating.count': 1, 'rating.sum': stars },
    $push: { recentReviews: { $each: [summary], $sort: { createdAt: -1 }, $slice: 5 } },
  },
);`},{type:`heading3`,text:`5. Indexes for the listing page`},{type:`code`,lang:`javascript`,code:`db.products.createIndex({ categoryIds: 1, status: 1, priceMin: 1 });   // category + price sort/range
db.products.createIndex({ 'attrs.k': 1, 'attrs.v': 1 });                // attribute filters
db.products.createIndex({ slug: 1 }, { unique: true });                 // product page lookup
db.products.createIndex({ 'variants.sku': 1 }, { unique: true });       // SKU -> product`},{type:`paragraph`,text:`Full-text search with facets and typo tolerance belongs in Atlas Search or Elasticsearch/OpenSearch, kept in sync from MongoDB through change streams. Regex queries over product names do not scale.`},{type:`callout`,variant:`warning`,text:`Orders must snapshot the price, name and variant at purchase time (extended reference as a snapshot). Never reference the live product for historical orders, because prices and names change.`},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How do you prevent overselling under concurrency? (A conditional `$inc` with `available: { $gte: qty }`, which is atomic per document. Add a transaction or compensation for multi-SKU carts.)",`A flash sale sends 50k requests at one SKU. What now? (Hot document contention: pre-split stock across shards or buckets, queue the orders, or keep a Redis counter as the gate.)`,`Why not a transaction for every review write? (The rating is a derived value, so eventual consistency is acceptable. If the second update fails, a reconciliation job repairs it.)`,"How would this change for multi-currency or regional prices? (A `prices` map per region, or a separate price collection when there are many price lists.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Embedding all reviews in the product, which creates an unbounded array.`,`Keeping stock inside the product document, so every order rewrites the catalog document and invalidates caches.`,"Normalizing everything SQL-style and then needing four `$lookup` stages for the product page.",`Reading the live product into historical orders instead of storing a snapshot.`]},{type:`callout`,variant:`important`,text:`Senior signal: you design from access patterns and write rates, separate the write-hot data (inventory) from the read-hot data (catalog), guarantee no overselling with atomic conditional updates, and say clearly which data is strongly consistent and which can be eventually consistent.`}]},"index-types-in-practice":{summary:`Compound indexes, ordered by the ESR rule, cover most real queries. On top of those: **unique** to enforce business rules such as one account per email, **partial** to index only the documents a hot query touches (and for conditional uniqueness), and **TTL** to auto-expire sessions, tokens and logs. Text and wildcard indexes are niche: text for simple keyword search when I do not need Atlas Search, wildcard for genuinely unpredictable fields. I treat sparse as legacy and use partial instead.`,details:[{type:`paragraph`,text:`The general "what is an index and ESR" material is in the indexes answer. This answer is the practical toolbox, with the reasons for picking each type.`},{type:`heading3`,text:`Compound (the workhorse)`},{type:`code`,lang:`javascript`,code:`// Query: open orders for a tenant, newest first, last 30 days
db.orders.find({ tenantId, status: 'open', createdAt: { $gte: since } }).sort({ createdAt: -1 });

// ESR: Equality (tenantId, status), Sort (createdAt), Range (createdAt)
db.orders.createIndex({ tenantId: 1, status: 1, createdAt: -1 });`},{type:`heading3`,text:`Unique: enforce invariants in the database`},{type:`code`,lang:`javascript`,code:`db.users.createIndex({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
// strength 2 = case-insensitive: 'Asha@x.com' and 'asha@x.com' collide
// Queries must specify the same collation to use this index.`},{type:`paragraph`,text:'An application-level "check then insert" is a race condition. Only a unique index guarantees uniqueness, and the app catches duplicate-key error code `11000` and returns a 409.'},{type:`heading3`,text:`Partial: index a subset`},{type:`code`,lang:`javascript`,code:`// Only pending jobs are ever polled; completed ones are 99% of the collection
db.jobs.createIndex({ runAt: 1 }, { partialFilterExpression: { status: 'pending' } });
// The query must include status: 'pending' for the planner to use it

// Conditional uniqueness: one ACTIVE subscription per user
db.subscriptions.createIndex(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
);`},{type:`heading3`,text:`TTL: automatic expiry`},{type:`code`,lang:`javascript`,code:`// Expire 1 hour after createdAt
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Or expire at a per-document time: set expireAfterSeconds to 0 and store the deadline
db.resetTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });`},{type:`bullets`,items:["The TTL monitor runs about every 60 seconds, so deletion is not exact. Code must still check expiry (`expiresAt > now`) for security-sensitive data like tokens.",`TTL works on a single date field (or an array of dates, using the earliest). Documents without a date field never expire.`,`Mass expiry creates delete load. Spread expiry times rather than expiring millions of documents at midnight.`]},{type:`heading3`,text:`Sparse (legacy), text and wildcard`},{type:`bullets`,items:["**Sparse:** only indexes documents where the field exists. Partial indexes do this and more (`{ field: { $exists: true } }`), so I use partial in new code.",'**Text:** `createIndex({ title: "text", body: "text" })` gives stemming and `$text` search with relevance scores. There is only one text index per collection, with no fuzzy matching and limited ranking. It works for small internal search; for product search I use Atlas Search or OpenSearch.','**Wildcard:** `createIndex({ "attributes.$**": 1 })` indexes every field under a path. It helps when fields are user-defined and unpredictable (custom form fields), but it is larger and less efficient than targeted indexes. The attribute pattern with `{ "attrs.k": 1, "attrs.v": 1 }` is often better.',`Also know: **multikey** (any index on an array field, created automatically), **2dsphere** for geo queries, **hashed** for hashed shard keys, and **hidden indexes** for testing the impact of dropping one.`]},{type:`heading3`,text:`Managing indexes in production`},{type:`code`,lang:`javascript`,code:`// Which indexes are actually used (per node, since last restart)
db.orders.aggregate([{ $indexStats: {} }]);

// Safely test removing an index: hide it, watch latency, then drop or unhide
db.orders.hideIndex('status_1_createdAt_-1');`},{type:`callout`,variant:`warning`,text:"Building an index on a large collection consumes I/O and cache even with the modern optimized build process. Build during low traffic, use rolling index builds for very large collections, and define indexes in migration code (not Mongoose `autoIndex` in production) so builds are deliberate."},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:['Why is my partial index not used? (The query predicate must imply the `partialFilterExpression`, e.g. it must include `status: "pending"`.)',`Why does a case-insensitive unique email index not help my query? (The query must use the same collation.)`,`Can a TTL index guarantee a token is unusable after 15 minutes? (No. Deletion is delayed, so check expiry in code too.)`,"How do you find unused indexes safely? (`$indexStats` on every node, then hide before you drop.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Relying on application checks instead of a unique index for uniqueness.`,"Leaving Mongoose `autoIndex` on in production, which triggers unexpected index builds on deploy.",`Treating TTL deletion as precise timing.`,`Adding wildcard or single-field indexes everywhere instead of designing compound indexes from real queries.`]},{type:`callout`,variant:`important`,text:"Senior signal: you map each index type to a concrete problem (invariant, hot subset, expiry), know the caveats (partial query matching, collation, TTL delay, write cost), and manage indexes deliberately with `$indexStats`, hidden indexes and controlled builds."}]},"schema-changes-without-downtime":{summary:"MongoDB does not enforce one schema, so old and new document shapes can coexist. The danger is application code that assumes one shape. I add a `schemaVersion` field and make the code read both versions, write the new one, and then migrate. Migration happens either lazily (upgrade each document when it is next read or written) or with a batched, idempotent backfill. I only remove support for the old shape once metrics show no old documents remain. It is the same expand-and-contract idea as in SQL, applied at the document level.",details:[{type:`heading3`,text:`Why it is still hard in a "schemaless" database`},{type:`bullets`,items:[`During a rolling deploy, old and new app versions run at the same time and read each other's writes.`,"Indexes, `$jsonSchema` validators, aggregation pipelines, reports and other services all depend on field names and types.","A careless `updateMany` over 200 million documents can saturate I/O, grow the oplog and push secondaries into lag."]},{type:`heading3`,text:"Example: split `name` into `firstName` / `lastName`"},{type:`numbered`,items:["**Expand:** deploy code that reads both shapes (v1 `name`, v2 `firstName`/`lastName`) and writes v2 with `schemaVersion: 2`. Optionally keep writing `name` too, so old app instances still work during the rollout.","**Index:** create any new indexes (e.g. `{ lastName: 1 }`) before queries depend on them.",`**Migrate:** lazily, with a backfill, or both. Lazy upgrades hot documents first, and the backfill finishes the cold tail.`,`**Switch:** move queries, reports and validators to the new fields once the count of v1 documents is zero.`,"**Contract:** in a later release, stop writing `name`, remove the v1 read path and drop the old index."]},{type:`heading3`,text:`Read both versions in one place`},{type:`code`,lang:`javascript`,code:`// repository layer: normalize every shape into the current domain model
function toUser(doc) {
  if ((doc.schemaVersion ?? 1) === 1) {
    const [firstName, ...rest] = (doc.name ?? '').split(' ');
    return { id: doc._id, firstName, lastName: rest.join(' '), email: doc.email };
  }
  return { id: doc._id, firstName: doc.firstName, lastName: doc.lastName, email: doc.email };
}`},{type:`heading3`,text:`Lazy migration (on read or write)`},{type:`code`,lang:`javascript`,code:`async function getUser(id) {
  const doc = await users.findOne({ _id: id });
  if (doc && (doc.schemaVersion ?? 1) < 2) {
    const u = toUser(doc);
    // Guard on the version so a concurrent upgrade or newer write is not overwritten
    await users.updateOne(
      { _id: id, schemaVersion: { $in: [null, 1] } },
      { $set: { firstName: u.firstName, lastName: u.lastName, schemaVersion: 2 } },
    );
  }
  return doc && toUser(doc);
}`},{type:`paragraph`,text:`Lazy migration has zero upfront cost and upgrades the documents that matter first. But cold documents may never be read, so you can never delete the v1 code path, and queries on the new fields miss un-migrated documents. That is why lazy migration is usually paired with a backfill.`},{type:`heading3`,text:`Batched, idempotent backfill`},{type:`code`,lang:`javascript`,code:`// Resumable: walk by _id, small batches, pause between batches
let lastId = await loadCheckpoint(); // e.g. stored in a migrations collection
for (;;) {
  const batch = await users
    .find({ _id: { $gt: lastId }, schemaVersion: { $in: [null, 1] } })
    .sort({ _id: 1 })
    .limit(500)
    .toArray();
  if (!batch.length) break;

  await users.bulkWrite(
    batch.map((d) => {
      const u = toUser(d);
      return {
        updateOne: {
          filter: { _id: d._id, schemaVersion: { $in: [null, 1] } }, // idempotent guard
          update: { $set: { firstName: u.firstName, lastName: u.lastName, schemaVersion: 2 } },
        },
      };
    }),
    { ordered: false },
  );
  lastId = batch.at(-1)._id;
  await saveCheckpoint(lastId);
  await sleep(50); // throttle; watch replication lag and cache metrics
}`},{type:`bullets`,items:['Throttle based on replication lag and latency metrics, and use `w: "majority"` writes so the job cannot run ahead of the secondaries.',"Simple renames can be done server-side with an update pipeline (`updateMany` with `[{ $set: ... }, { $unset: ... }]`), but still in batches on large collections.","Track progress with `countDocuments({ schemaVersion: { $in: [null, 1] } })` and only contract once it reaches zero."]},{type:`heading3`,text:`Validators and Mongoose`},{type:`bullets`,items:['With `$jsonSchema` validation, temporarily allow both shapes (`oneOf`) or set `validationLevel: "moderate"`, so existing invalid documents can still be updated. Tighten it after the migration.',`In Mongoose, a strict schema silently drops fields it does not define. Add the new fields to the schema before writing them, and keep the old ones until contract.`]},{type:`callout`,variant:`warning`,text:`Never deploy code that only understands the new shape at the same time as the migration. If the rollout or the backfill is rolled back, old documents break the new code. Old-and-new compatibility comes first, always.`},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you roll back halfway through? (Because both shapes are readable and old fields are still written, rolling back the app is safe. The contract step is the point of no return.)`,`Lazy only or backfill only? (Usually both: lazy for hot documents, backfill for the tail and so the old code path can be deleted.)`,`How do other consumers (analytics, ETL, other services) learn about the change? (Contract versioning, announce deprecation, keep the old fields until the consumers move.)`,`How do you avoid hurting production during the backfill? (Small batches, throttling on lag, off-peak runs, and checkpoints for resume.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["One giant `updateMany` with no batching, throttling or checkpoint.",`Assuming "schemaless" means no migration is needed, then crashing on old documents.`,`Removing the old field in the same release that starts writing the new one.`,`Forgetting indexes, validators, aggregation pipelines and downstream consumers that depend on the old field.`]},{type:`callout`,variant:`important`,text:`Senior signal: you treat the schema as a contract even without enforcement, apply expand-and-contract with explicit versioning, make the backfill idempotent, throttled and resumable, and know which step is irreversible and when it is safe to take it.`}]},"paginate-a-large-collection":{summary:'`skip(n)` does not jump to row n: the server still walks n index entries (or documents) and throws them away, so page 5,000 costs 5,000 pages of work and gets slower as users go deeper. For large or infinite lists I use keyset (range) pagination: sort on a unique, indexed key such as `{ createdAt: -1, _id: -1 }` and ask for "the next 20 after the last item I saw". That makes every page cost the same and stays correct when rows are inserted while the user scrolls.',details:[{type:`heading3`,text:`Why offset pagination degrades`},{type:`paragraph`,text:'With `find(filter).sort({ createdAt: -1 }).skip(100000).limit(20)`, MongoDB uses the index to produce documents in order, but it has to advance past 100,000 keys before returning anything. In `explain("executionStats")` you see a `SKIP` stage with `keysExamined` around 100,020 for 20 returned documents. If the sort is not covered by an index it is worse: an in-memory `SORT` of the whole match, limited to 100 MB per stage before it must spill to disk.'},{type:`bullets`,items:[`**Cost grows with depth.** Latency is O(offset), so deep pages, exports and crawlers hurt the most.`,`**Results shift.** A new document inserted at the top pushes every row down by one, so the user sees a duplicate on the next page (or misses one after a delete).`,'**`countDocuments()` for "page 3 of 9,412" is expensive too.** It scans every match. Use `estimatedDocumentCount()` for whole-collection totals, cap the count ("1,000+"), or drop exact totals.']},{type:`heading3`,text:`Keyset (cursor / range) pagination`},{type:`paragraph`,text:"Pick a sort that is **unique and deterministic**: a business field plus `_id` as the tie-breaker. Index exactly that sort (with any equality filters first, following ESR). The API returns an opaque cursor that encodes the last item's sort values, and the next request turns it into a range filter."},{type:`code`,lang:`javascript`,code:`// Index: equality filter first, then the sort keys (ESR)
await orders.createIndex({ tenantId: 1, createdAt: -1, _id: -1 });

async function listOrders(tenantId, cursor, limit = 20) {
  const filter = { tenantId };
  if (cursor) {
    const { createdAt, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    // "strictly after" the last item, with _id breaking ties on equal timestamps
    filter.$or = [
      { createdAt: { $lt: new Date(createdAt) } },
      { createdAt: new Date(createdAt), _id: { $lt: new ObjectId(id) } },
    ];
  }

  const docs = await orders
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1) // fetch one extra to know if there is a next page
    .toArray();

  const hasMore = docs.length > limit;
  const page = docs.slice(0, limit);
  const last = page.at(-1);
  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last._id })).toString('base64url')
    : null;
  return { items: page, nextCursor };
}`},{type:`paragraph`,text:"When the sort is just `_id` (ObjectIds are roughly time-ordered), the filter is simply `{ _id: { $lt: lastId } }`. Check the plan: you want a single `IXSCAN` with `keysExamined` close to `limit + 1` on every page, whether it is page 2 or page 20,000."},{type:`heading3`,text:`Choosing the approach`},{type:`bullets`,items:['**Offset (`skip`/`limit`)**: fine for small, bounded result sets (admin tables under ~10k rows) and when users really need "jump to page 7".',`**Keyset**: feeds, infinite scroll, mobile apps, public APIs, exports and any large collection. It cannot jump to an arbitrary page, which is usually acceptable.`,"**Batch processing / backfills**: iterate with a range on `_id` (`{ _id: { $gt: lastId } }`, sort `_id`, limit 1,000) instead of one long-lived cursor or `skip`. It is resumable after a crash and plays well with the oplog.","**Aggregation**: put `$match` with the range filter and `$sort` first so they use the index. `$facet` with `$skip`/`$limit` plus `$count` still scans everything; avoid it for deep pages."]},{type:`callout`,variant:`warning`,text:"Sorting only on a non-unique field such as `createdAt` gives unstable pages: documents with equal timestamps can appear on two pages or on none. Always add `_id` (or another unique field) as the last sort key, and include it in the index."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you support "previous page" with cursors? Encode direction in the cursor, flip the comparison and sort, then reverse the results.`,"What if the user can sort by any column? Each sort needs its own `field + _id` index and cursor format. Limit the sortable fields or use Atlas Search for arbitrary sorting.",`How do you show a total count? Show an estimate or a capped count, cache it, or maintain a counter document updated on writes.`,"Why not just use a server-side cursor across requests? Cursors time out (10 minutes idle by default), are tied to one `mongos`/node and do not survive stateless, load-balanced APIs."]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Paginating without a supporting index, so every page does an in-memory sort.`,"Exposing raw `skip` values in a public API, so crawlers request page 100,000 and hammer the database.",`Using a cursor field that is not in the sort, or a sort without a unique tie-breaker.`,"Running an exact `countDocuments()` on every list request."]},{type:`callout`,variant:`important`,text:"Senior signal: you explain *why* `skip` is O(offset) (keys are still examined), prove it with `keysExamined` in the plan, design a stable `field + _id` cursor with a matching ESR index, handle the consistency problem (shifting rows), and push back on exact totals as a product requirement because of their cost."}]},"slow-query-read-explain-output":{summary:'I first confirm which query is slow and how often it runs, using the profiler, the slow query log or Atlas Query Insights, instead of guessing. Then I run it with `explain("executionStats")` and compare three numbers: `nReturned`, `totalKeysExamined` and `totalDocsExamined`. If the work is far larger than the result, or I see `COLLSCAN` or an in-memory `SORT` stage, the index does not match the query shape. I fix it with an ESR compound index (or a better query), check the new plan and measure the write cost of the extra index.',details:[{type:`heading3`,text:`1. Find the query that actually matters`},{type:`bullets`,items:["**Slow query log**: `mongod` logs operations slower than `slowms` (100 ms by default) with the plan summary, `keysExamined`, `docsExamined` and duration.","**Database profiler**: `db.setProfilingLevel(1, { slowms: 50 })`, then query `system.profile`. Keep it at level 1 with sampling in production; level 2 records everything and adds load.",`**Atlas**: Query Insights / Profiler and Performance Advisor group queries by shape and suggest indexes.`,"**`$queryStats` (Atlas) / `$indexStats`**: `$queryStats` aggregates metrics per query shape on Atlas clusters; `$indexStats` shows which indexes are never used.","**Right now**: `db.currentOp({ secs_running: { $gt: 5 } })` shows long-running operations, which you can stop with `db.killOp(opid)`."]},{type:`paragraph`,text:`Rank by total time (duration × frequency), not by the single slowest call. A 40 ms query that runs 2,000 times a second matters more than one 5-second nightly report.`},{type:`heading3`,text:`2. Read the plan`},{type:`code`,lang:`javascript`,code:`db.orders
  .find({ customerId: cid, status: 'paid', createdAt: { $gte: since } })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain('executionStats');`},{type:`code`,lang:`json`,code:`{
  "queryPlanner": {
    "winningPlan": {
      "stage": "SORT",
      "sortPattern": { "createdAt": -1 },
      "inputStage": {
        "stage": "FETCH",
        "filter": { "status": { "$eq": "paid" }, "createdAt": { "$gte": "..." } },
        "inputStage": { "stage": "IXSCAN", "indexName": "customerId_1" }
      }
    },
    "rejectedPlans": [ ... ]
  },
  "executionStats": {
    "nReturned": 20,
    "executionTimeMillis": 1840,
    "totalKeysExamined": 412000,
    "totalDocsExamined": 412000
  }
}`},{type:`paragraph`,text:"Read it bottom-up. Here an index on `customerId` alone finds 412,000 documents, `FETCH` loads every one from disk to apply the `status` and `createdAt` filters, and then a blocking in-memory `SORT` orders them to return 20. The ratio is about 20,000 documents examined per document returned. The ideal is close to 1:1, and `totalDocsExamined: 0` for a covered query."},{type:`bullets`,items:["**`COLLSCAN`**: no usable index at all.","**`SORT` stage (not `SORT_MERGE`)**: the sort is done in memory. It is blocking and limited to 100 MB before spilling (or failing when disk use is disabled).","**`FETCH` with a big `filter`**: the index narrows only partly; the remaining predicates are checked document by document.","**Large `keysExamined` vs `nReturned`**: low selectivity, or a range field placed before an equality field in the index.",'**`rejectedPlans`** and `explain("allPlansExecution")`: show why the planner chose this plan. A cached plan that is bad for other parameter values is a classic cause of sudden slowness.']},{type:`heading3`,text:`3. Fix it`},{type:`code`,lang:`javascript`,code:`// ESR: Equality (customerId, status) \u2192 Sort (createdAt) \u2192 Range (createdAt here too)
db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1 });

// After: IXSCAN \u2192 FETCH \u2192 LIMIT, no SORT stage
// nReturned: 20, totalKeysExamined: 20, totalDocsExamined: 20, executionTimeMillis: 2

// Covered query: project only indexed fields and exclude _id \u2192 totalDocsExamined: 0
db.orders.find({ customerId: cid, status: 'paid' }, { _id: 0, createdAt: 1, status: 1 })
  .sort({ createdAt: -1 }).limit(20);`},{type:`numbered`,items:[`Build the index without blocking writes (all index builds since 4.2 use an optimized process that only locks briefly at start and end). In a big cluster, build it in a quiet period and watch replication lag.`,"Check whether a new index makes an old one redundant: `{ customerId: 1 }` is a prefix of the new index, so drop it after confirming with `$indexStats`. Use `hideIndex()` first so you can unhide instantly if something regresses.","If the query shape is the problem, change the query: anchored regex (`/^abc/`) instead of `/abc/`, avoid `$ne`/`$nin` on most of the collection, avoid huge `$in` lists, and replace `$where` or `$expr` on unindexed computations with stored, indexed fields.","If the plan cache picked a bad plan, `db.orders.getPlanCache().clear()` is a short-term fix; the real fix is an index that makes the right plan obvious. Use `hint()` only as a last resort.",`Re-measure under real load, and watch insert latency, because every extra index adds write work and cache usage.`]},{type:`callout`,variant:`tip`,text:'With Mongoose, call `.explain("executionStats")` on the query object, and turn off `autoIndex` in production so index changes go through migrations instead of being created silently at application start.'},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`The plan looks fine in staging but slow in production. Why? Different data distribution and cardinality, a cold cache, or a cached plan chosen for a different parameter.`,`How do you index a query that sorts on one field and filters a range on another? Put equality first, the sort field next, and the range last (ESR), even though the range seems more selective.`,`When would you not add an index? A write-heavy collection, a rare query, or an index that would not fit in the cache; use a read replica, a precomputed collection or an analytics store instead.`,"How do you know an index is unused? `$indexStats` access counts since restart, combined with checking that no rare but important query (a monthly job) depends on it."]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Running `explain()` without `executionStats` and only reading `winningPlan`.",`Adding a single-field index per filtered field instead of one compound index for the query shape.`,`Putting the range field before the sort field, which brings back the in-memory sort.`,`Never removing indexes, so writes slow down and the indexes no longer fit in RAM.`]},{type:`callout`,variant:`important`,text:`Senior signal: you start from evidence (the profiler, query shapes ranked by total time), read the plan bottom-up, quantify the waste with keys/docs examined vs returned, apply ESR, then validate with a new plan and consider the costs: write amplification, RAM, redundant indexes and safe rollout with hidden indexes.`}]},"optimise-a-slow-aggregation-pipeline":{summary:'I make the pipeline do as little work as possible as early as possible. `$match` and `$sort` go first so they can use an index, `$project` drops unneeded fields early, and `$lookup` runs only on the already-reduced set with an index on the foreign field. I check the plan with `explain("executionStats")`, treat `$facet` as a stage that cannot use indexes inside its sub-pipelines, and see `allowDiskUse` as a safety net for big sorts and groups, not a fix. If the report still scans millions of documents per request, I precompute the result with `$merge` or move it to an analytics store.',details:[{type:`heading3`,text:`Only the start of a pipeline can use indexes`},{type:`paragraph`,text:"Stages operate on a stream of documents. Only stages at the beginning (`$match`, `$sort`, `$geoNear`, `$search`, and a `$group` that can use `DISTINCT_SCAN`) read from indexes. After a `$group`, `$unwind`, `$project` with computed fields, or `$lookup`, the stream is new in-memory documents with no indexes. So the most important optimisation is ordering."},{type:`code`,lang:`javascript`,code:`// \u274C Slow: joins and unwinds every order, then filters
db.orders.aggregate([
  { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'c' } },
  { $unwind: '$c' },
  { $match: { status: 'paid', createdAt: { $gte: since }, 'c.country': 'IN' } },
  { $group: { _id: '$c.segment', revenue: { $sum: '$total' } } },
]);

// \u2705 Fast: filter with an index, keep only needed fields, join the reduced set
db.orders.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: since } } },      // index { status: 1, createdAt: 1 }
  { $project: { customerId: 1, total: 1 } },                         // smaller documents in memory
  { $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',                                           // indexed (_id)
      pipeline: [{ $match: { country: 'IN' } }, { $project: { segment: 1 } }],
      as: 'c',
  } },
  { $unwind: '$c' },                                                 // drops orders whose customer did not match
  { $group: { _id: '$c.segment', revenue: { $sum: '$total' } } },
]);`},{type:`paragraph`,text:"The optimiser already moves some stages (for example, a `$match` that only touches original fields can move before a `$project`, and `$sort` + `$limit` coalesce into a top-k sort). Check what it did in `explain()` instead of assuming. It cannot move a `$match` that depends on a joined or computed field."},{type:`heading3`,text:"`$lookup` cost"},{type:`bullets`,items:["`$lookup` runs once per input document. 500,000 inputs means 500,000 lookups, so reduce the input first.","**Index the `foreignField`.** Without it, each lookup scans the foreign collection, which is effectively a nested loop over two collections.","Use the `pipeline` form (or `localField`/`foreignField` with a `pipeline`, available since 5.0) to filter and project inside the join, so the joined arrays stay small.","Watch the 16 MB document limit: a `$lookup` that joins thousands of documents into one array can fail. `$lookup` followed directly by `$unwind` is coalesced by the optimiser and avoids building the big array.","On sharded clusters `$lookup` into a sharded collection is supported (5.1+), but it fans out across shards. Frequent joins on hot paths usually mean the data should be embedded or denormalized (extended reference pattern)."]},{type:`heading3`,text:"`$facet`"},{type:`paragraph`,text:"`$facet` runs several sub-pipelines over the same input (for example, results, total count and filter counts for a search page). Its sub-pipelines cannot use indexes, its output is one document (so it is bound by 16 MB), and every facet processes the full input. Put a selective `$match` *before* `$facet`, keep facets cheap, and for pagination prefer a separate indexed query plus a cached or estimated count. For search-page facet counts at scale, Atlas Search `$searchMeta` facets are designed for that job."},{type:`heading3`,text:"Memory limits and `allowDiskUse`"},{type:`bullets`,items:["Blocking stages (`$sort` without an index, `$group`, `$bucket`, `$setWindowFields`) have a 100 MB memory limit per stage.","Since MongoDB 6.0, `allowDiskUseByDefault` is on, so big stages spill to temporary files instead of failing. `explain` shows `usedDisk: true` and spill counts.","Spilling keeps the query alive but makes it much slower and adds disk I/O on the primary. If you see spills on a request path, reduce the data (filter, project, `$sort` + `$limit` for top-k) rather than relying on disk.","A `$group` on high-cardinality keys (per user, per session) holds one entry per key in memory; aggregate on a coarser key or pre-bucket the data."]},{type:`heading3`,text:`When the answer is not a faster pipeline`},{type:`bullets`,items:["**Precompute**: a scheduled pipeline ending with `$merge` into a `daily_revenue` collection turns a 10-second dashboard into an indexed point read (computed pattern / materialized view).",'**Run it elsewhere**: send heavy reports to a secondary with `readPreference: "secondaryPreferred"` or an analytics node, accepting slightly stale data.',`**Different store**: ad-hoc analytics over hundreds of millions of events belongs in a column store or data warehouse (Atlas Data Federation, BigQuery, ClickHouse), fed by change streams or a pipeline.`]},{type:`code`,lang:`javascript`,code:`// Nightly: roll up yesterday's orders into a small, indexed summary collection
db.orders.aggregate([
  { $match: { createdAt: { $gte: startOfYesterday, $lt: startOfToday }, status: 'paid' } },
  { $group: {
      _id: { day: { $dateTrunc: { date: '$createdAt', unit: 'day' } }, category: '$category' },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
  } },
  { $merge: { into: 'daily_revenue', on: '_id', whenMatched: 'replace', whenNotMatched: 'insert' } },
]);`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:['How do you see per-stage cost? `explain("executionStats")` on `aggregate` shows `nReturned` and `executionTimeMillisEstimate` per stage, and whether the first stages used `IXSCAN`.',"`$lookup` vs embedding: when do you denormalize? When the join runs on a hot read path and the joined fields change rarely; accept the cost of updating copies.",'How do you make a "top 10 products by revenue" fast? `$match` on an indexed range, `$group`, then `$sort` + `$limit` (a top-k sort that keeps only 10 in memory), or read a precomputed rollup.',"Why did adding `$facet` make the page slow? Every facet scans the full input without indexes; move the `$match` before it or split the queries."]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Putting `$lookup` or `$unwind` before `$match`.","No index on the `foreignField` of a `$lookup`.","Treating `allowDiskUse: true` as the fix for a slow report.",`Running heavy analytics pipelines on the primary during peak traffic.`]},{type:`callout`,variant:`important`,text:'Senior signal: you know only the leading stages can use indexes and reorder accordingly, you quantify `$lookup` as "one lookup per input document", you know the 100 MB / 16 MB limits and what spilling costs, and you recognise when to stop tuning and precompute with `$merge` or move analytics off the operational database.'}]},"working-set-exceeds-ram":{summary:"The working set is the data and indexes that queries touch regularly. When it outgrows the WiredTiger cache, reads that used to be served from memory start going to disk, and p99 latency jumps even though the queries did not change. I confirm it with cache metrics from `serverStatus` (bytes read into the cache, eviction activity, the dirty ratio) together with disk read IOPS and queue depth. Then I either shrink the working set (fix scans, drop unused indexes, archive cold data, make documents smaller) or scale (more RAM, then sharding).",details:[{type:`heading3`,text:`What the working set is`},{type:`paragraph`,text:`WiredTiger keeps an internal cache (by default the larger of 50% of (RAM − 1 GB) or 256 MB) of uncompressed pages; the OS file cache holds compressed pages from disk on top of that. Hot indexes should always be in the cache, plus the documents your common queries read. A single collection scan or a new reporting query can push hot pages out ("cache pollution"), so a working-set problem is often caused by bad queries, not just data growth.`},{type:`heading3`,text:`How to confirm it`},{type:`code`,lang:`javascript`,code:`const s = db.serverStatus().wiredTiger.cache;
({
  configuredMax: s['maximum bytes configured'],
  inCache:       s['bytes currently in the cache'],
  dirty:         s['tracked dirty bytes in the cache'],
  readIntoCache: s['bytes read into cache'],          // rising fast = cache misses \u2192 disk reads
  appEvictions:  s['pages evicted by application threads'], // > 0 = user queries doing eviction work
});

// Index + data sizes vs the cache
db.orders.stats({ scale: 1024 * 1024 });  // size, storageSize, totalIndexSize (MB)
db.orders.aggregate([{ $indexStats: {} }]); // which indexes are actually used`},{type:`bullets`,items:["**Cache usage sits near the configured maximum** (WiredTiger targets about 80% and starts eviction above that) and `bytes read into cache` per second climbs.",`**Application threads are evicting pages.** When background eviction cannot keep up, user operations help with eviction, which shows up directly as latency. The dirty ratio above about 20% is a strong warning sign.`,`**Disk tells the same story**: rising read IOPS, queue depth and I/O wait on the data volume (or hitting provisioned IOPS limits on EBS or Atlas).`,"**Queries are unchanged but slower**: the slow query log shows the same plans with higher durations and larger `storage.data.bytesRead` per operation.",'In Atlas, check the Cache Activity, Disk IOPS and "Disk Queue Depth" charts and the Real-Time Performance Panel; in self-hosted setups, use the same `serverStatus` fields in Prometheus/Grafana or Ops Manager.']},{type:`callout`,variant:`info`,text:"Rule of thumb: the total size of frequently used indexes should fit comfortably in the WiredTiger cache, with room left for hot documents. If `totalIndexSize` across collections is already bigger than the cache, almost every query will touch disk."},{type:`heading3`,text:`Options, cheapest first`},{type:`numbered`,items:["**Stop the scans.** Find `COLLSCAN`s and low-selectivity queries in the profiler; one unindexed admin report can evict the hot set every few minutes. Move analytics to a secondary or an analytics node.","**Drop unused and redundant indexes.** Every index competes for cache; prefix indexes (`{a:1}` when `{a:1, b:1}` exists) are usually redundant.",`**Shrink documents.** Use projections so less is fetched, remove large rarely-read fields to a separate collection (subset pattern), cap growing arrays, and use shorter field names only when the collection is huge.`,`**Archive cold data.** TTL indexes for expiring data, moving old orders to an archive collection or Atlas Online Archive, or time series collections for metrics. The working set is about *hot* data, not total size.`,`**Make writes cheaper.** Bulk writes and fewer indexes reduce dirty pages and eviction pressure.`,`**Scale vertically.** More RAM (and faster disks with more IOPS) is often the quickest relief; it buys time for the real fixes.`,`**Shard.** When the hot set is still larger than one server can hold in memory, sharding splits it across machines, each with its own cache. It needs a good shard key and adds operational complexity, so it comes last.`]},{type:`callout`,variant:`warning`,text:"Do not just raise `wiredTigerCacheSizeGB` to most of the RAM. The OS file cache, connections (about 1 MB each), aggregation memory and in-memory sorts also need memory; starving them causes swapping or OOM kills that are far worse than cache misses."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`Latency spikes every night at 2 a.m. What do you suspect? A batch job or backup reading cold data, which evicts the hot set; move it to a hidden secondary or throttle it.`,`How does compression affect this? Data is compressed on disk and in the OS cache but uncompressed in the WiredTiger cache, so storage size underestimates cache needs.`,`Would a read replica help? Only for reads you can route to it with acceptable staleness; it has its own cache, but writes still hit every member.`,`How do you plan capacity ahead of this? Track index size and the hot data set growth per month and alert when the cache-to-working-set ratio drops below a threshold.`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Jumping straight to sharding without checking for scans and unused indexes.`,`Comparing total data size to RAM instead of the hot set and index sizes.`,`Setting the WiredTiger cache to nearly all of the RAM.`,`Running analytics and backups against the primary.`]},{type:`callout`,variant:`important`,text:`Senior signal: you define the working set precisely, confirm the diagnosis with specific cache and disk metrics instead of intuition, look for the query that is polluting the cache before buying hardware, and order the fixes by cost and risk, with sharding as a deliberate last step.`}]},"choose-a-shard-key-avoid-hot-shards":{summary:"A good shard key has high cardinality, an even spread of values, writes that do not all go to the same place, and appears in most queries, so they target one shard instead of all of them. A ranged key that only increases, such as `createdAt` or the default ObjectId `_id`, sends every insert to the chunk holding the maximum value, which lives on one shard. That shard takes all the writes while the others sit idle, and the balancer keeps moving chunks behind it. I usually pick a compound key such as `{ tenantId: 1, _id: 1 }`, or a hashed key when queries do not need ranges.",details:[{type:`heading3`,text:`How data is placed`},{type:`paragraph`,text:`MongoDB splits a sharded collection into chunks (contiguous ranges of shard-key values, about 128 MB by default in recent versions), and the balancer spreads chunks across shards. Every insert goes to the chunk whose range contains its key value. So the distribution of *new* key values decides where the write load lands.`},{type:`heading3`,text:`Why a monotonic key creates a hot shard`},{type:`bullets`,items:["With a ranged key on `createdAt` or ObjectId `_id`, every new value is bigger than all previous ones, so it falls into the last chunk, `[current max, MaxKey)`.",`That chunk lives on one shard, so all inserts go there: one shard at 100% write load, the others idle. Adding shards does not increase write throughput at all.`,`The chunk keeps growing and splitting, and the balancer constantly migrates chunks away from the hot shard, adding I/O on top of the write load.`,`Monotonic keys are fine for *reads* by time range, which is why they are tempting. The problem is purely about writes.`]},{type:`heading3`,text:`The criteria`},{type:`bullets`,items:["**Cardinality**: many distinct values. `country` or `status` can only produce a handful of chunks, which become jumbo chunks that cannot be split or moved.","**Frequency**: no value dominates. If one tenant has 40% of the data, `tenantId` alone makes that tenant's chunk jumbo; add a second field.",`**Write distribution**: new values spread across the key space (not monotonic).`,"**Query isolation**: the most frequent and latency-critical queries include the shard key (or its prefix), so `mongos` targets one shard instead of scatter-gather to all of them.",`**Immutability in practice**: shard key values can be updated since 4.2, but it moves the document between shards in a transaction. Choose fields that rarely change.`]},{type:`heading3`,text:`Common strategies`},{type:`code`,lang:`javascript`,code:`// 1. Hashed: even writes, but range queries on deviceId become scatter-gather
sh.shardCollection('iot.events', { deviceId: 'hashed' });

// 2. Compound ranged: tenant queries are targeted, writes spread across tenants,
//    _id keeps cardinality high inside a large tenant
sh.shardCollection('saas.orders', { tenantId: 1, _id: 1 });

// 3. Compound with a hashed field (4.4+): range on tenant prefix + even spread
sh.shardCollection('saas.events', { tenantId: 1, eventId: 'hashed' });`},{type:`bullets`,items:[`**Hashed key**: best write distribution and easy to get right; ranges on that field fan out to every shard. Good for IDs looked up by equality (user, device, session).`,"**Compound ranged key** (`{ tenantId: 1, createdAt: 1 }`): targeted queries for one tenant and time-ordered data inside it. Writes spread as long as many tenants are active at once; a single huge tenant still needs the second field to split.","**Time series**: shard on `{ metaField, time }` (sensor ID plus timestamp), never on time alone.",`**Zone sharding**: map key ranges to specific shards, for example tenants in the EU to EU shards for data residency, or premium tenants to bigger hardware.`]},{type:`heading3`,text:`Validating and fixing the choice`},{type:`numbered`,items:["Before sharding, use `analyzeShardKey` (7.0+) on the candidate key to estimate cardinality, frequency, monotonicity and how many queries would be targeted, based on sampled real queries (`configureQueryAnalyzer`).","After sharding, check `sh.status()` and `db.collection.getShardDistribution()` for data balance, and per-shard opcounters/CPU for *load* balance, which can differ from data balance.","If the key turns out wrong, `reshardCollection` (5.0+) rewrites the collection online under a new key. It needs extra disk space and time and adds load, so it is a fix, not a design strategy. `refineCollectionShardKey` (4.4+) can add suffix fields to increase cardinality cheaply."]},{type:`callout`,variant:`warning`,text:"Sharding does not fix bad indexes or unbounded documents, and it adds config servers, `mongos` routers, balancer windows and harder backups. Shard when one replica set genuinely cannot hold the working set or the write throughput, not as a first scaling step."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`What is a jumbo chunk and how does it happen? A chunk above the size limit that cannot be split because all its documents share one shard-key value; caused by low cardinality or high frequency.`,"Your main query does not include the shard key. What happens? `mongos` sends it to every shard and merges the results; latency follows the slowest shard and load grows with the shard count.","How would you shard a multi-tenant SaaS with a few huge tenants? `{ tenantId: 1, _id: 1 }` or a hashed suffix, plus zones to isolate the largest tenants if needed.",`Hashed vs ranged: how do you choose? Hashed when access is by equality and writes must spread; ranged/compound when queries need ranges or locality.`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Sharding on ObjectId `_id` or a timestamp with a ranged key.","Choosing a low-cardinality key such as `status`, `country` or `type`.",`Choosing a key that the main queries never filter on, so everything is scatter-gather.`,`Ignoring a dominant value (one giant tenant) until it becomes a jumbo chunk.`]},{type:`callout`,variant:`important`,text:"Senior signal: you reason from the write and query patterns, explain the hot-shard mechanism through chunk ranges, weigh hashed vs compound keys against targeted vs scatter-gather queries, validate with `analyzeShardKey` and distribution metrics, and know the escape hatches (`refineCollectionShardKey`, `reshardCollection`) and their costs."}]},"write-concern-read-concern-read-preference":{summary:'Write concern says how many replica-set members must acknowledge a write before the driver reports success (`w: 1`, `w: "majority"`, plus `j: true` for the journal). Read concern says how durable the data you read must be (`local`, `majority`, `snapshot`, `linearizable`). Read preference says which member serves the read (`primary`, `secondaryPreferred`, `nearest`, and so on). Reading from secondaries scales reads but gives you stale data, breaks read-your-writes unless you use causally consistent sessions, and can even return writes that are later rolled back.',details:[{type:`paragraph`,text:'These three settings are independent knobs, and the interesting interview answers are about how they combine. The default for most deployments since MongoDB 5.0 is `w: "majority"` for writes, `local` read concern and `primary` read preference. That is safe and consistent, and it is the right default for most apps.'},{type:`heading3`,text:`Write concern: when is a write "done"?`},{type:`bullets`,items:["`w: 1`: only the primary acknowledged it. Fast, but if the primary crashes before the write replicates, the new primary never saw it and the old one **rolls it back** when it rejoins. Your API already returned 201.",'`w: "majority"`: a majority of voting members have it. It survives any failover, so it is the right choice for money, orders and anything a user was told succeeded.',"`j: true`: the write is in the on-disk journal, not just in memory. With `majority`, journaling is implied by default (`writeConcernMajorityJournalDefault`).","`wtimeout`: stop waiting after N ms. Careful: a timeout error does **not** mean the write failed. It may still replicate, so the retry must be idempotent."]},{type:`heading3`,text:`Read concern: how durable is what I read?`},{type:`bullets`,items:["`local` (default): the newest data on the node you hit, even if it might still be rolled back.","`available`: like `local`, but on sharded clusters it can return orphaned documents during chunk migrations.","`majority`: only data acknowledged by a majority, so it can never be rolled back. It may be slightly older than `local`.","`snapshot`: a consistent point-in-time view, used in multi-document transactions and (since 5.0) for reads with `atClusterTime`.","`linearizable`: primary only, single-document reads. It guarantees you see every majority write that completed before the read started. It is slow, so use it rarely, for example when reading a lock or leader record."]},{type:`heading3`,text:`Read preference: which node answers?`},{type:`bullets`,items:["`primary` (default): always consistent with your own writes.","`primaryPreferred`: primary, but falls back to a secondary during an election. Useful for read-mostly pages that should stay up during failover.","`secondary` / `secondaryPreferred`: offload reads such as reports, exports and analytics.","`nearest`: lowest network latency, for multi-region deployments. Combine it with tag sets to pin reads to a region.","`maxStalenessSeconds` (minimum 90): skip secondaries that lag too far behind."]},{type:`code`,lang:`javascript`,code:`// Per operation, not just in the connection string
await orders.insertOne(order, { writeConcern: { w: 'majority', wtimeoutMS: 5000 } });

// A reporting query that can tolerate a few seconds of lag
const report = await orders
  .aggregate(pipeline, {
    readPreference: new ReadPreference('secondaryPreferred', [{ workload: 'analytics' }], {
      maxStalenessSeconds: 120,
    }),
  })
  .toArray();

// Read-your-writes even when reading from a secondary: a causally consistent session
const session = client.startSession({ causalConsistency: true });
try {
  await users.updateOne({ _id }, { $set: { name } }, { session, writeConcern: { w: 'majority' } });
  const fresh = await users.findOne(
    { _id },
    { session, readPreference: 'secondary', readConcern: { level: 'majority' } },
  );
} finally {
  await session.endSession();
}`},{type:`heading3`,text:`What goes wrong with secondary reads`},{type:`numbered`,items:[`**Stale reads / broken read-your-writes.** The user saves a profile, the next request reads from a lagging secondary, and the old name comes back. It looks like a bug that "fixes itself".`,`**Non-monotonic reads.** Two requests hit two secondaries with different lag, so data appears to go back in time between page loads.`,'**Rollback exposure.** With `local` read concern you can read a `w: 1` write that is later rolled back, so you displayed something that never "happened".',`**Lag spikes under load.** Heavy writes, a big index build or an overloaded secondary push lag from milliseconds to minutes. Analytics queries on the same secondary make it worse.`,`**No real capacity gain for writes.** Every secondary still applies every write, so secondary reads only help read-heavy workloads, and they reduce failover headroom if the cluster depends on them.`]},{type:`callout`,variant:`tip`,text:"Measure replication lag with `rs.printSecondaryReplicationInfo()` or `rs.status()` (compare `optimeDate` across members) and alert on it. If you route reads to secondaries, lag is a user-facing metric."},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:['Your `w: "majority"` write timed out. Did it fail? Not necessarily: it may still commit, so make the operation idempotent and check before retrying.',`Why not always read from secondaries to scale? Consistency costs, plus every secondary still replays every write; shard or cache instead for real scale.`,"How do you get read-your-writes across a load-balanced API? Read from the primary for that user flow, or pass the session's `operationTime`/`clusterTime` and use a causally consistent session.","What does a transaction use? `snapshot` read concern and `majority` write concern; transaction reads must use `primary` read preference."]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:['Putting `readPreference=secondaryPreferred` in the global connection string "for performance" and then chasing stale-data bugs.',"Using `w: 1` for critical writes to save a few milliseconds.","Treating `wtimeout` errors as definite failures and retrying non-idempotent inserts.",`Mixing up read concern (how durable) with read preference (which node).`]},{type:`callout`,variant:`important`,text:`Senior signal: you set these per operation based on business impact (payments use majority and primary, a dashboard uses secondaryPreferred with max staleness), you name rollback and read-your-writes explicitly, and you treat replication lag as a monitored SLO rather than a theoretical concern.`}]},"change-streams-and-resume-tokens":{summary:"Change streams let an application subscribe to inserts, updates, deletes and other changes on a collection, database or whole deployment. They are built on the oplog, so they need a replica set or sharded cluster. Every event carries a resume token (`_id`), and reliability comes from persisting that token after you process the event, resuming with `startAfter`, making processing idempotent (delivery is at-least-once), and handling the case where the token has fallen off the oplog and you must do a full resync.",details:[{type:`paragraph`,text:`Typical uses: invalidating a Redis cache when a product changes, syncing documents to Elasticsearch or a search index, pushing real-time updates to WebSocket clients, and feeding downstream services without polling. They replace the old pattern of tailing the oplog directly, and unlike polling they respect permissions and work across shards with a global order.`},{type:`code`,lang:`javascript`,code:`const tokens = db.collection('stream_checkpoints');
const checkpoint = await tokens.findOne({ _id: 'products-to-search' });

const stream = db.collection('products').watch(
  [{ $match: { operationType: { $in: ['insert', 'update', 'replace', 'delete'] } } }],
  {
    fullDocument: 'updateLookup', // fetch the current doc for updates
    ...(checkpoint ? { startAfter: checkpoint.token } : {}),
  },
);

for await (const change of stream) {
  await applyToSearchIndex(change); // must be idempotent: events can be redelivered
  await tokens.updateOne(
    { _id: 'products-to-search' },
    { $set: { token: change._id, at: new Date() } },
    { upsert: true },
  );
}`},{type:`heading3`,text:`How resuming works`},{type:`bullets`,items:["Each event's `_id` is an opaque resume token pointing at a position in the oplog.",`The driver automatically resumes once after transient errors such as a failover or network blip, using the last token it saw.`,"After a process restart, **you** must supply the token: `resumeAfter` (fails after an `invalidate` event) or `startAfter` (can continue past an `invalidate`). `startAtOperationTime` starts from a cluster timestamp.",`Save the token **after** the side effect succeeds. Saving before gives at-most-once (lost events); saving after gives at-least-once (duplicates), and duplicates are what you design for.`]},{type:`heading3`,text:`Failure modes to plan for`},{type:`numbered`,items:["**Oplog window exceeded.** If the consumer is down longer than the oplog retains history, resuming fails with `ChangeStreamHistoryLost`. Size the oplog for your worst outage (check `rs.printReplicationInfo()`), alert on consumer lag, and have a full-resync path (re-scan the collection, then start a new stream).","**Invalidate events.** Dropping or renaming the watched collection closes the stream with `invalidate`. Use `startAfter` or recreate the stream deliberately.","**`updateLookup` is not a snapshot.** It fetches the document as it is *now*, which may already include later changes, or it may be `null` if the document was deleted since. Use `updateDescription` for exact deltas, or enable `changeStreamPreAndPostImages` on the collection (6.0+) for `fullDocumentBeforeChange` and point-in-time post-images.","**Event size.** An event over 16 MB fails; on 7.0+ use the `$changeStreamSplitLargeEvent` stage, or project fewer fields.","**Ordering and parallelism.** Events arrive in order, but one stream is one consumer. To scale out, run several streams with a `$match` that partitions the key space (for example by a hash bucket field), keeping per-document order within a partition."]},{type:`callout`,variant:`warning`,text:`Do not open a change stream per WebSocket client. Each stream is a server-side cursor plus a connection. Open one stream per process, then fan events out in memory or through Redis pub/sub.`},{type:`heading3`,text:`Change streams vs a transactional outbox`},{type:`paragraph`,text:`A change stream reflects database-level changes (field X changed), not business intent (OrderPlaced). For integration events other teams depend on, an outbox collection written in the same transaction, then published by a change stream or poller, gives you a stable event contract. Raw change streams fit internal projections such as caches and search indexes.`},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How do you make the consumer idempotent? Upsert by document `_id` with a version or `clusterTime` check, so replays are no-ops.",`What happens during a primary election? The driver resumes automatically from the last token; your code should only see a short pause.`,"How do you watch only certain fields? Use a `$match` on `updateDescription.updatedFields` and `$project` to trim the event.","How do you monitor it? Track the lag between `clusterTime` in the event and now, plus checkpoint age."]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Keeping the resume token only in memory, so a restart either replays everything or silently skips events.`,`Assuming exactly-once delivery.`,"Treating `fullDocument` from `updateLookup` as the state at the time of the change.",`No plan for when the token falls off the oplog.`]},{type:`callout`,variant:`important`,text:`Senior signal: you describe the stream as at-least-once with durable checkpoints, size the oplog window against real outage scenarios, have a documented resync procedure, and know when an outbox is the better contract.`}]},"duplicate-inserts-despite-an-exists-check":{summary:"It is a check-then-act race: two requests run `findOne` at the same moment, both see nothing, and both insert. Application checks can never prevent this under concurrency. I fix it by letting the database enforce uniqueness with a unique index, then either catching duplicate-key error `11000` or using an atomic upsert with `$setOnInsert`. If the duplicates come from client retries, I also add an idempotency key.",details:[{type:`heading3`,text:`Why the check does not work`},{type:`code`,lang:`javascript`,code:`// Request A and Request B, a few milliseconds apart
const existing = await users.findOne({ email });   // A: null   B: null
if (!existing) await users.insertOne({ email });   // A: inserts B: inserts -> duplicate`},{type:`paragraph`,text:`The window between the read and the write is small but real, and it gets wider under load, with double-clicks, client or gateway retries, or several consumers processing the same message. Wrapping it in a transaction does not reliably help either, because neither transaction wrote to a document the other read.`},{type:`heading3`,text:`Fix 1: a unique index plus duplicate-key handling`},{type:`code`,lang:`javascript`,code:`await users.createIndex({ email: 1 }, { unique: true });

try {
  await users.insertOne({ email: email.toLowerCase(), name });
} catch (err) {
  if (err.code === 11000) {
    throw new ConflictError('Email already registered'); // map to HTTP 409
  }
  throw err;
}`},{type:`heading3`,text:`Fix 2: an atomic upsert when "get or create" is the intent`},{type:`code`,lang:`javascript`,code:`// Exactly one document per (tenantId, externalId), created on first sight
const result = await customers.findOneAndUpdate(
  { tenantId, externalId },
  { $setOnInsert: { tenantId, externalId, createdAt: new Date() }, $set: { lastSeenAt: new Date() } },
  { upsert: true, returnDocument: 'after' },
);`},{type:`callout`,variant:`warning`,text:"An upsert alone is not enough. Two concurrent upserts that both match nothing can both insert. Back the upsert with a unique index on the filter fields; then MongoDB (4.2+) retries the upsert internally on a duplicate-key conflict when the filter is an equality match on that index, and otherwise you get `11000` to retry once yourself."},{type:`heading3`,text:`Rolling out the unique index on a live collection`},{type:`numbered`,items:["Find existing duplicates: `$group` by the key, keep groups with `count > 1`.",`Decide which document wins (oldest, most complete), merge references and delete the rest, in batches.`,"Build the unique index. It fails if any duplicates remain, so deploy the code that handles `11000` first, then build the index.","For soft-deleted rows use a **partial** unique index (for example `partialFilterExpression: { isDeleted: false }`, with `isDeleted` always set) so a deleted email can be registered again. Queries must include the same condition to use the index.",`For case-insensitive uniqueness, normalise the value (store lowercase) or create the index with a collation of strength 2 and query with the same collation.`]},{type:`code`,lang:`javascript`,code:`// Find duplicates before creating the index
db.users.aggregate([
  { $group: { _id: { $toLower: '$email' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
], { allowDiskUse: true });`},{type:`heading3`,text:`Other sources of duplicates`},{type:`bullets`,items:["**Retries that generate a new `_id` each time** (client, API gateway, queue redelivery). Use an idempotency key: store it with a unique index, and return the original result on replay.","**Mongoose `unique: true`** is not a validator. It only declares an index, and with `autoIndex` disabled in production that index may never have been built. Check with `db.users.getIndexes()`.",`**Sharded collections:** a unique index must include the shard key as a prefix, so uniqueness on a non-shard-key field needs a separate lookup collection or a different shard key.`]},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`Could you use a transaction instead? Not reliably for "does not exist yet"; the unique index is the enforcement point.`,"How do you return a friendly error? Catch `11000`, read `err.keyValue` to see which field conflicted, and return 409.","What about uniqueness across two fields? Use a compound unique index, for example `{ tenantId: 1, email: 1 }`.",`How do you handle queue redelivery? Make the consumer upsert by a message ID or business key with a unique index.`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Adding a mutex or in-memory lock, which only works inside one process.`,`Creating the unique index without cleaning existing duplicates, so the build fails in production.`,"Swallowing every insert error instead of checking for code `11000`.","Relying on Mongoose `unique` as validation."]},{type:`callout`,variant:`important`,text:`Senior signal: you name the race (check-then-act) immediately, push the invariant into the database, plan a safe migration for existing duplicates, and separate concurrency duplicates from retry duplicates, which need idempotency keys.`}]},"slow-populate-vs-lookup":{summary:"`populate()` is a client-side join: Mongoose runs the main query, collects the referenced IDs, then sends one extra `find({ _id: { $in: ids } })` per populated path, hydrates full Mongoose documents and stitches them together. It gets slow with nested or many populated paths, large `$in` lists, fetching whole documents instead of a few fields, missing indexes for virtual populate, hydration overhead, or populate called per document in a loop (a true N+1). I first measure the queries, then add `select`, `lean()`, pagination and indexes; I move to `$lookup` when I need one round trip, filtering or sorting on the joined data, or a heavy read path.",details:[{type:`heading3`,text:`What actually runs`},{type:`code`,lang:`javascript`,code:`mongoose.set('debug', true); // logs every query Mongoose sends

const orders = await Order.find({ status: 'open' })
  .populate('customer')                       // query 2: customers where _id in [...]
  .populate({ path: 'items.product',          // query 3: products where _id in [...]
              populate: { path: 'vendor' } }); // query 4: vendors where _id in [...]
// 4 round trips, full documents, all hydrated into Mongoose models`},{type:`paragraph`,text:"For a list, populate batches per path, so it is not usually N+1 by itself. The real costs are the number of round trips (one per path and per nesting level), the payload size (whole referenced documents), and hydration CPU in Node. It becomes a genuine N+1 when someone calls `doc.populate()` inside a `map` or loop."},{type:`heading3`,text:`Fixes before switching approach`},{type:`code`,lang:`javascript`,code:`const orders = await Order.find({ status: 'open' })
  .select('number total customer createdAt')
  .sort({ createdAt: -1 })
  .limit(50)                                   // never populate an unbounded list
  .populate({ path: 'customer', select: 'name email' })
  .lean();                                     // plain objects, no hydration`},{type:`bullets`,items:["`select` on both the parent and the populated path: often the biggest win.","`lean()` skips document hydration; populated results are plain objects too.","Paginate: populating 5,000 parents means a 5,000-element `$in`.","For virtual populate (`localField` / `foreignField`), make sure `foreignField` is indexed, otherwise each populate is a collection scan.","Denormalise stable fields: store `customer: { _id, name }` on the order (the extended reference pattern) so the list needs no join at all."]},{type:`heading3`,text:"The same read with `$lookup`"},{type:`code`,lang:`javascript`,code:`const orders = await Order.aggregate([
  { $match: { status: 'open' } },
  { $sort: { createdAt: -1 } },
  { $limit: 50 },                              // limit BEFORE the join
  { $lookup: {
      from: 'customers',
      localField: 'customer',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1, email: 1 } }],
      as: 'customer',
  } },
  { $unwind: '$customer' },
  { $project: { number: 1, total: 1, createdAt: 1, customer: 1 } },
]);`},{type:`heading3`,text:`When to choose which`},{type:`bullets`,items:[`**Keep populate** for simple admin or detail pages, when you need Mongoose features (getters, virtuals, middleware) on the joined data, and when the extra round trip is not measurable.`,'**Use `$lookup`** when you must filter, sort or paginate on the joined fields ("orders where customer.country = DE"), which populate cannot do server-side; for hot list endpoints that need one round trip; and for reports that group across collections.',`**Use neither** for very hot paths: denormalise, or precompute a read model.`]},{type:`callout`,variant:`info`,text:'`$lookup` is not free. It runs an indexed query on the foreign collection for each input document, so place `$match` and `$limit` before it and index `foreignField`. Results are plain objects without Mongoose middleware. Check the plan with `explain("executionStats")` on the aggregation.'},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How would you prove populate is the problem? Mongoose debug logging, the database profiler, or APM spans per query, comparing time in MongoDB with time in Node.`,"Can `$lookup` work across sharded collections? Since 5.1 the `from` collection can be sharded, though cross-shard lookups are more expensive.",`What if the referenced data changes often? Denormalisation needs an update path (background job or change stream); keep a reference for fast-changing fields.`,`How do you keep the API response shape stable when switching? Wrap the query in a repository function so callers do not care how it joins.`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Populating every path "just in case" in a shared query helper.`,"Running `$lookup` before `$match`/`$limit`, which joins the whole collection.","No index on the virtual-populate `foreignField`.","Calling `populate` inside a loop over documents."]},{type:`callout`,variant:`important`,text:"Senior signal: you explain populate's real mechanics (one query per path, not per document), measure before changing, apply the cheap fixes first, and choose between populate, `$lookup` and denormalisation by access pattern rather than by habit."}]},"serverless-exhausting-connections":{summary:"Each function instance runs its own MongoClient with its own pool and monitoring connections, and platforms scale to hundreds of concurrent instances, so connections multiply as instances times pool size. It gets far worse if the code creates a new client inside the handler on every invocation. I fix it by creating the client once at module scope and reusing it across warm invocations, shrinking `maxPoolSize`, setting `maxIdleTimeMS`, and capping function concurrency. If that is still not enough, I put a long-lived service in front of the database instead of connecting from every function.",details:[{type:`heading3`,text:`Where the connections come from`},{type:`bullets`,items:[`**Concurrency.** Lambda runs one request per instance at a time, so 300 concurrent requests means about 300 instances, each with its own client.`,"**Pool size.** The driver default `maxPoolSize` is 100. Under load an instance usually uses only a few, but sockets accumulate.",`**Monitoring connections.** Each client also keeps monitoring sockets to every replica-set member (on 4.4+, typically two per member). A 3-node replica set costs about 6 sockets per instance before any query runs.`,"**Client per invocation.** `new MongoClient()` inside the handler opens fresh connections on every call. Frozen instances keep the old ones open until the server times them out."]},{type:`heading3`,text:`Fix 1: reuse one client per instance`},{type:`code`,lang:`javascript`,code:`import { MongoClient } from 'mongodb';

// Module scope: created once per instance, reused by every warm invocation
const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 5,            // one request at a time per instance; small is enough
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,     // close idle sockets on frozen/idle instances
  serverSelectionTimeoutMS: 5_000, // fail fast instead of hanging the function
});
const clientPromise = client.connect(); // cache the promise, not just the client

export const handler = async (event) => {
  const db = (await clientPromise).db('shop');
  return db.collection('orders').findOne({ _id: event.pathParameters.id });
};`},{type:`code`,lang:`javascript`,code:`// Mongoose version: cache the connection promise across invocations
let conn = null;
export async function getConnection() {
  if (!conn) {
    conn = mongoose
      .connect(process.env.MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 })
      .catch((err) => { conn = null; throw err; }); // allow a retry after failure
  }
  return conn;
}`},{type:`heading3`,text:`Fix 2: bound the total`},{type:`bullets`,items:[`Do the arithmetic: max concurrency × (pool size + monitoring sockets) must stay well under the cluster's connection limit, which on Atlas depends on the tier. Leave room for other services and deployments.`,`Cap concurrency with reserved concurrency on the function, or put a queue (SQS) in front of write-heavy work so the database sees a steady rate.`,`Watch out for deploys: old and new versions run side by side and briefly double the connection count.`]},{type:`heading3`,text:`Fix 3: change the architecture when the math does not work`},{type:`bullets`,items:[`Run the data-access layer as a long-lived container service (ECS/Fargate, Cloud Run with high per-instance concurrency) with one shared pool, and have functions call it over HTTP.`,`Keep functions for event processing in batches (SQS batch size) rather than one connection per tiny event.`,`Avoid relying on the Atlas Data API as the escape hatch: MongoDB has deprecated it, so plan for your own HTTP layer instead.`]},{type:`heading3`,text:`How I confirm the diagnosis`},{type:`code`,lang:`javascript`,code:`// mongosh: current vs available connections
db.serverStatus().connections   // { current, available, totalCreated, ... }

// Who holds them? Group active connections by client app/driver metadata
db.aggregate([
  { $currentOp: { allUsers: true, idleConnections: true } },
  { $group: { _id: '$appName', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

// In the app: driver connection pool (CMAP) events
client.on('connectionCreated', () => metrics.increment('mongo.conn.created'));`},{type:`callout`,variant:`tip`,text:"Set `appName` in the connection string for every service. When connections spike, `$currentOp` grouped by `appName` tells you immediately which service is responsible."},{type:`divider`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`Why not close the client at the end of each invocation? Every call then pays the TCP, TLS and auth handshake, adding latency, and connection churn still loads the server.`,"What is `totalCreated` climbing fast telling you? Connection churn: clients are being created per request or pools are cycling.","Does `maxPoolSize: 1` work? It can for strictly sequential handlers, but parallel queries inside one invocation will queue.",`How would this look with PostgreSQL? Same root cause; there you would use RDS Proxy or PgBouncer.`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Creating `new MongoClient()` or calling `mongoose.connect()` inside the handler.",`Keeping the default pool size of 100 per function instance.`,`Raising the cluster tier to buy connections instead of fixing reuse.`,`Forgetting monitoring sockets and deploy overlap in the capacity math.`]},{type:`callout`,variant:`important`,text:"Senior signal: you do the capacity arithmetic (instances × sockets vs the cluster limit), fix reuse and pool size first, prove it with `serverStatus` and `$currentOp` by `appName`, and know when serverless-to-database is the wrong architecture."}]}};export{e as answers};