var e={"What is the difference between SQL and NoSQL databases?":{summary:`SQL (relational) databases store data in tables with a fixed schema, relationships enforced by foreign keys, and strong ACID transactions queried with SQL. NoSQL databases (document, key-value, wide-column, graph) use flexible data models designed around access patterns and usually scale horizontally more easily, often trading some consistency or join capability for it. Choose by data shape, consistency needs and query patterns — not hype.`,details:[{type:`paragraph`,text:`The real difference is the data model and the guarantees. A relational database models data as normalized tables and lets you ask almost any question later with joins. A NoSQL database asks you to model data around how you will read it, so common reads are a single lookup — but ad-hoc queries across entities are harder.`},{type:`heading3`,text:`Same data, two models`},{type:`code`,lang:`sql`,code:`-- Relational (PostgreSQL): normalized, joined at read time
CREATE TABLE users  (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE orders (
  id      SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),   -- FK enforced by DB
  total   NUMERIC(10,2) NOT NULL
);

SELECT u.name, o.total
FROM users u JOIN orders o ON o.user_id = u.id
WHERE u.id = 42;`},{type:`code`,lang:`javascript`,code:`// Document (MongoDB): shaped for the read, no join needed
await db.collection('users').insertOne({
  _id: 42,
  name: 'Asha',
  recentOrders: [                 // embedded \u2014 read in one query
    { orderId: 9001, total: 59.99 },
    { orderId: 9002, total: 12.5 },
  ],
});

const user = await db.collection('users').findOne({ _id: 42 });
// \u2192 whole user + recent orders in a single round trip`},{type:`heading3`,text:`Key differences`},{type:`bullets`,items:[`**Schema:** SQL is schema-on-write (DDL, migrations); NoSQL is typically schema-flexible (schema-on-read), though MongoDB supports JSON Schema validation.`,"**Relationships:** SQL has joins and foreign keys; NoSQL favours embedding/denormalization (MongoDB has `$lookup`, but it is not the primary pattern).",`**Transactions:** SQL has mature multi-row ACID transactions; MongoDB supports multi-document ACID transactions since 4.0, but single-document atomicity is the design goal.`,`**Scaling:** SQL traditionally scales vertically plus read replicas (sharding exists via Citus, Vitess, etc.); many NoSQL stores have built-in sharding.`,`**Query flexibility:** SQL excels at ad-hoc analytics and reporting; NoSQL excels at predictable, high-volume access patterns.`,`**Types of NoSQL:** document (MongoDB), key-value (Redis, DynamoDB), wide-column (Cassandra), graph (Neo4j) — "NoSQL" is not one thing.`]},{type:`flow`,title:`Choosing a database`,code:`flowchart TD
  Q{"Strong relations,<br/>multi-entity transactions,<br/>ad-hoc reporting?"} -->|Yes| SQL([Relational: PostgreSQL / MySQL]):::db
  Q -->|No| R{"Data shape varies or is<br/>read as one aggregate?"}
  R -->|Yes| DOC([Document: MongoDB]):::db
  R -->|No| K{"Simple key lookups<br/>at huge scale or as cache?"}
  K -->|Yes| KV([Key-value: Redis / DynamoDB]):::cache
  K -->|No| SQL`},{type:`callout`,variant:`tip`,text:`Interview tip: avoid "SQL doesn't scale, NoSQL is faster". Say that PostgreSQL is a great default, and you pick NoSQL when the access pattern, data shape or scale requirement clearly favours it. Many real systems use both (Postgres for orders, Redis for cache, MongoDB for catalog/content).`}]},"What is database normalization? Explain 1NF, 2NF, 3NF":{summary:`Normalization organizes tables to remove redundancy and update anomalies by making every non-key column depend on "the key, the whole key, and nothing but the key". 1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependency on part of a composite key. 3NF: 2NF + no transitive dependency (non-key column depending on another non-key column).`,details:[{type:`paragraph`,text:`Redundant data causes anomalies: change a customer's email in one row but not another (update anomaly), can't store a product until someone orders it (insert anomaly), or lose a product when its last order is deleted (delete anomaly). Normalization splits tables so each fact lives in exactly one place.`},{type:`heading3`,text:`Starting point: an unnormalized table`},{type:`code`,lang:`text`,code:`orders_raw
order_id | customer | customer_city | products                 | product_prices
---------+----------+---------------+--------------------------+---------------
1        | Asha     | Pune          | Keyboard, Mouse          | 40, 15
2        | Ravi     | Delhi         | Mouse                    | 15
3        | Asha     | Pune          | Monitor                  | 200

Problems: multi-valued cells, customer data repeated, product price repeated`},{type:`heading3`,text:`1NF — atomic values, no repeating groups`},{type:`code`,lang:`text`,code:`order_items  (PK: order_id + product)
order_id | product  | price | customer | customer_city
---------+----------+-------+----------+--------------
1        | Keyboard | 40    | Asha     | Pune
1        | Mouse    | 15    | Asha     | Pune
2        | Mouse    | 15    | Ravi     | Delhi
-- One value per cell. Still redundant.`},{type:`heading3`,text:`2NF — remove partial dependencies`},{type:`paragraph`,text:"The key is (order_id, product). But `customer` depends only on `order_id`, and `price` depends only on `product` — partial dependencies. Move them to tables keyed by just that part."},{type:`code`,lang:`sql`,code:`CREATE TABLE products (product_id INT PRIMARY KEY, name TEXT, price NUMERIC);
CREATE TABLE orders   (order_id INT PRIMARY KEY, customer TEXT, customer_city TEXT);
CREATE TABLE order_items (
  order_id   INT REFERENCES orders(order_id),
  product_id INT REFERENCES products(product_id),
  quantity   INT,
  PRIMARY KEY (order_id, product_id)
);`},{type:`heading3`,text:`3NF — remove transitive dependencies`},{type:`paragraph`,text:"In `orders`, `customer_city` depends on `customer`, not on `order_id` (order_id → customer → city). Move customer data to its own table."},{type:`code`,lang:`sql`,code:`CREATE TABLE customers (customer_id INT PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (
  order_id    INT PRIMARY KEY,
  customer_id INT REFERENCES customers(customer_id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- Now Asha's city is stored once; changing it updates one row.`},{type:`bullets`,items:[`**BCNF** is a stricter 3NF: every determinant must be a candidate key. Usually mentioned as a follow-up.`,"**Denormalization** is deliberate: read-heavy systems copy data (e.g. store `price_at_purchase` on order_items — which is actually correct, since historical price must not change).",`OLTP systems are usually normalized to 3NF; analytics/warehouses often use denormalized star schemas.`]},{type:`callout`,variant:`tip`,text:`Interview tip: walk one table through 1NF → 2NF → 3NF and name the anomaly each step fixes. Then mention when you would denormalize on purpose — that shows practical judgement.`}]},"What are SQL joins and when do you use each type?":{summary:`A join combines rows from two tables based on a related column. INNER JOIN returns only matching rows; LEFT/RIGHT JOIN keep all rows from one side with NULLs where there is no match; FULL OUTER JOIN keeps all rows from both; CROSS JOIN gives every combination; a SELF JOIN joins a table to itself. Pick based on whether unmatched rows must appear in the result.`,details:[{type:`paragraph`,text:"Use these two tables for all examples: `customers` (1 Asha, 2 Ravi, 3 Meera) and `orders` (101 → customer 1, 102 → customer 1, 103 → customer 2, 104 → customer 99 — an orphan)."},{type:`heading3`,text:`INNER JOIN — only matches`},{type:`code`,lang:`sql`,code:`SELECT c.name, o.id AS order_id
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;
-- Asha 101 | Asha 102 | Ravi 103
-- Meera (no orders) and order 104 (no customer) are excluded`},{type:`heading3`,text:`LEFT JOIN — all from the left, matches from the right`},{type:`code`,lang:`sql`,code:`SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
-- Asha 101 | Asha 102 | Ravi 103 | Meera NULL

-- Classic use: find customers with NO orders (anti-join)
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;            -- \u2192 Meera`},{type:`heading3`,text:`SELF JOIN and CROSS JOIN`},{type:`code`,lang:`sql`,code:`-- SELF JOIN: employees with their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;

-- CROSS JOIN: every size \xD7 every colour (cartesian product)
SELECT s.size, c.colour
FROM sizes s CROSS JOIN colours c;   -- 3 sizes \xD7 4 colours = 12 rows`},{type:`bullets`,items:[`**INNER** — "give me orders with their customer" (both must exist).`,`**LEFT** — "all customers, with orders if any" — dashboards, optional relations, anti-joins.`,`**RIGHT** — mirror of LEFT; most teams rewrite it as LEFT by swapping table order for readability.`,`**FULL OUTER** — reconciliation: find rows missing on either side (e.g. compare two data sources).`,`**CROSS** — generate combinations (variants, calendars); dangerous by accident on large tables.`,`**SELF** — hierarchical data (manager/employee, category/parent).`]},{type:`callout`,variant:`warning`,text:"Common pitfall: putting a filter on the right table in `WHERE` turns a LEFT JOIN into an INNER JOIN (`WHERE o.status = 'paid'` drops customers whose `o.*` is NULL). Put that condition in the `ON` clause instead if you want to keep unmatched rows."},{type:`divider`},{type:`heading3`,text:`Follow-up: What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?`},{type:`paragraph`,text:`INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table plus matches from the right (NULLs where none). FULL OUTER JOIN returns every row from both tables, matched where possible and NULL-filled on whichever side has no match.`},{type:`code`,lang:`sql`,code:`-- users:  (1, 'Asha'), (2, 'Ravi'), (3, 'Meera')
-- orders: (101, user 1), (102, user 2), (103, user 99)   -- 99 does not exist

-- INNER JOIN \u2192 2 rows
SELECT u.name, o.id FROM users u
INNER JOIN orders o ON o.user_id = u.id;
-- Asha | 101
-- Ravi | 102

-- LEFT JOIN \u2192 3 rows (all users)
SELECT u.name, o.id FROM users u
LEFT JOIN orders o ON o.user_id = u.id;
-- Asha  | 101
-- Ravi  | 102
-- Meera | NULL

-- FULL OUTER JOIN \u2192 4 rows (everything)
SELECT u.name, o.id FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id;
-- Asha  | 101
-- Ravi  | 102
-- Meera | NULL
-- NULL  | 103     \u2190 orphan order`},{type:`heading3`,text:`When to use which`},{type:`bullets`,items:[`**INNER JOIN:** the relationship is required — e.g. invoice lines with their product.`,`**LEFT JOIN:** the right side is optional — e.g. list all users with their last login, even if they never logged in.`,`**FULL OUTER JOIN:** data reconciliation — e.g. compare a payment-provider export with your payments table and find records missing on either side.`,"**MySQL** does not support FULL OUTER JOIN; emulate it with `LEFT JOIN ... UNION ... RIGHT JOIN`."]},{type:`code`,lang:`sql`,code:`-- Reconciliation: rows that exist only on one side
SELECT p.id AS ours, s.id AS provider
FROM payments p
FULL OUTER JOIN provider_settlements s ON s.payment_ref = p.ref
WHERE p.id IS NULL OR s.id IS NULL;`}]},"What are indexes in SQL and how do they work?":{summary:`An index is a separate data structure — usually a B-tree — that keeps column values sorted with pointers to the rows, so the database can find matching rows in O(log n) instead of scanning the whole table. Indexes speed up reads (WHERE, JOIN, ORDER BY) but cost disk space and slow down writes, because every INSERT/UPDATE/DELETE must also update each index.`,details:[{type:`paragraph`,text:'Like the index at the back of a book: instead of reading every page to find "transactions", you look it up alphabetically and jump to page 212. Without an index, `WHERE email = ...` on 10 million rows is a sequential scan; with a B-tree index it is a handful of page reads.'},{type:`heading3`,text:`Creating and verifying an index`},{type:`code`,lang:`sql`,code:`-- Before: full table scan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'asha@example.com';
-- Seq Scan on users  (rows=10000000)  actual time=0.02..812.4 ms

CREATE INDEX idx_users_email ON users (email);
-- In production PostgreSQL, avoid long write locks:
-- CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'asha@example.com';
-- Index Scan using idx_users_email on users  actual time=0.03..0.05 ms`},{type:`heading3`,text:`Composite indexes and the left-prefix rule`},{type:`code`,lang:`sql`,code:`CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- \u2705 Uses the index (leftmost column present)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;

-- \u2705 Uses both columns
SELECT * FROM orders WHERE user_id = 42 AND created_at > now() - interval '7 days';

-- \u274C Cannot use it efficiently \u2014 skips the leftmost column
SELECT * FROM orders WHERE created_at > now() - interval '7 days';`},{type:`heading3`,text:`Index types worth knowing`},{type:`bullets`,items:["**B-tree** (default): equality, ranges, sorting, prefix `LIKE 'abc%'`.",`**Hash**: equality only.`,`**GIN** (PostgreSQL): JSONB, arrays, full-text search.`,`**Unique index**: enforces uniqueness as well as speeding lookups.`,"**Partial index**: `CREATE INDEX ... WHERE deleted_at IS NULL` — smaller, targets hot rows.","**Covering index**: `INCLUDE (col)` lets the DB answer from the index alone (index-only scan)."]},{type:`flow`,title:`B-tree lookup for email = "m..."`,code:`flowchart TD
  ROOT["Root page<br/>a..f | g..p | q..z"]:::highlight --> B["Branch page<br/>g..k | l..p"]:::server
  B --> L["Leaf page<br/>mary@ \u2192 row ptr<br/>meera@ \u2192 row ptr"]:::cache
  L --> ROW[("Heap / table row")]:::db`,text:`Each level narrows the search; a table with millions of rows is typically only 3–4 levels deep.`},{type:`callout`,variant:`warning`,text:"Pitfalls: wrapping an indexed column in a function (`WHERE LOWER(email) = ...`) prevents index use unless you create an expression index; low-selectivity columns (e.g. boolean `is_active`) rarely benefit; and every extra index slows writes. Always confirm with `EXPLAIN ANALYZE`."}]},"What is the difference between clustered and non-clustered indexes?":{summary:`A clustered index determines the physical order of the table's rows — the table data itself is stored in the index's leaf pages, so there can be only one per table (usually the primary key). A non-clustered (secondary) index is a separate structure whose leaves hold the key plus a pointer (row id or primary key) back to the row, so a lookup may need an extra hop; a table can have many.`,details:[{type:`paragraph`,text:`Analogy: a phone book is clustered by last name — the data itself is in that order. The index at the back of a textbook is non-clustered — it lists topics in order and points to pages elsewhere.`},{type:`heading3`,text:`How major databases implement it`},{type:`bullets`,items:[`**MySQL InnoDB:** the table IS a clustered B-tree on the primary key. Secondary indexes store the primary key value, so a secondary lookup = secondary index → PK → clustered index (a "double lookup").`,"**SQL Server:** you choose the clustered index explicitly (`CREATE CLUSTERED INDEX`); defaults to the PK.","**PostgreSQL:** tables are heaps — all indexes are effectively non-clustered. The `CLUSTER` command reorders the table once but the order is not maintained on later writes."]},{type:`code`,lang:`sql`,code:`-- SQL Server
CREATE TABLE orders (
  id         BIGINT IDENTITY PRIMARY KEY CLUSTERED,  -- rows physically ordered by id
  customer_id INT NOT NULL,
  created_at DATETIME2 NOT NULL
);
CREATE NONCLUSTERED INDEX ix_orders_customer
  ON orders (customer_id) INCLUDE (created_at);     -- covering: no extra hop for created_at

-- MySQL InnoDB: secondary index implicitly stores the PK
CREATE INDEX idx_customer ON orders (customer_id);
-- SELECT * ... WHERE customer_id = 7
--   1) search idx_customer \u2192 finds PK values
--   2) search clustered PK index \u2192 reads full rows`},{type:`flow`,title:`Lookup via a secondary index (InnoDB)`,code:`flowchart LR
  Q["WHERE customer_id = 7"]:::client --> NC["Non-clustered index<br/>customer_id \u2192 PK"]:::cache
  NC -->|"PK = 1043"| CL["Clustered index<br/>PK \u2192 full row"]:::db
  CL --> R["Row data returned"]:::server`},{type:`bullets`,items:[`Range scans on the clustered key are very fast (rows are adjacent on disk).`,`Choose a narrow, ever-increasing clustered key (auto-increment / time-ordered ID). Random UUIDv4 keys cause page splits and fragmentation — prefer UUIDv7 or ULID if you need UUIDs.`,`A wide primary key bloats every secondary index in InnoDB, because each one stores the PK.`,"Covering indexes (`INCLUDE` or extra columns) avoid the second hop entirely."]},{type:`callout`,variant:`tip`,text:`Interview tip: say "one clustered, many non-clustered", then show depth by explaining the InnoDB double lookup and noting that PostgreSQL does not maintain clustered tables — interviewers like the database-specific nuance.`}]},"What are database transaction isolation levels?":{summary:`Isolation levels define how much concurrent transactions can see of each other's uncommitted or newly committed changes. The SQL standard defines four — READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE — each preventing more anomalies (dirty reads, non-repeatable reads, phantom reads) at the cost of more locking, retries or lower concurrency.`,details:[{type:`paragraph`,text:`The "I" in ACID. Perfect isolation (running transactions one at a time) is slow, so databases let you choose a trade-off. Defaults: PostgreSQL, SQL Server and Oracle use READ COMMITTED; MySQL InnoDB uses REPEATABLE READ.`},{type:`heading3`,text:`The anomalies`},{type:`bullets`,items:[`**Dirty read:** you read another transaction's uncommitted change, which may later roll back.`,`**Non-repeatable read:** you read a row twice and get different values because someone committed an update in between.`,`**Phantom read:** you run the same range query twice and new rows appear because someone inserted matching rows.`,`**Lost update / write skew:** two transactions read, then both write based on stale reads — only SERIALIZABLE (or explicit locking) fully prevents write skew.`]},{type:`code`,lang:`text`,code:`Level              | Dirty read | Non-repeatable | Phantom
-------------------+------------+----------------+---------
READ UNCOMMITTED   | possible   | possible       | possible
READ COMMITTED     | prevented  | possible       | possible
REPEATABLE READ    | prevented  | prevented      | possible*
SERIALIZABLE       | prevented  | prevented      | prevented

* PostgreSQL's REPEATABLE READ (snapshot isolation) also prevents phantoms;
  PostgreSQL treats READ UNCOMMITTED as READ COMMITTED.`},{type:`heading3`,text:`Setting it from Node.js (node-postgres)`},{type:`code`,lang:`typescript`,code:`import { Pool } from 'pg';
const pool = new Pool();

async function transfer(from: number, to: number, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const { rows } = await client.query(
      'SELECT balance FROM accounts WHERE id = $1', [from]);
    if (rows[0].balance < amount) throw new Error('Insufficient funds');
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, from]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, to]);
    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    // SERIALIZABLE may abort with SQLSTATE 40001 \u2014 the caller should retry
    if (err.code === '40001') return transfer(from, to, amount);
    throw err;
  } finally {
    client.release();
  }
}`},{type:`bullets`,items:["A common alternative to SERIALIZABLE for counters/balances: `SELECT ... FOR UPDATE` (pessimistic row lock) or an atomic `UPDATE ... SET balance = balance - $1 WHERE balance >= $1`.","Optimistic concurrency: a `version` column checked in the `UPDATE ... WHERE version = $n`.",`Higher isolation → more serialization failures/deadlocks → your code must retry.`]},{type:`callout`,variant:`tip`,text:`Interview tip: name the three anomalies, map them to the levels, and give a concrete example (double-spending a balance). Mentioning that SERIALIZABLE requires retry logic shows production experience.`}]},"What is a stored procedure?":{summary:`A stored procedure is a named block of SQL (plus procedural logic like variables, loops and conditionals) stored and executed inside the database server. It lets you run multi-step logic close to the data in one round trip, encapsulate business rules and grant permission to the procedure instead of the underlying tables — at the cost of logic that is harder to version, test and port.`,details:[{type:`paragraph`,text:"Instead of the application sending five SQL statements over the network, it calls one procedure and the database runs them all locally. In PostgreSQL there are both functions (`CREATE FUNCTION`, return a value, usable in SELECT) and procedures (`CREATE PROCEDURE`, invoked with `CALL`, can manage transactions with COMMIT/ROLLBACK inside since PostgreSQL 11)."},{type:`heading3`,text:`Example (PostgreSQL PL/pgSQL)`},{type:`code`,lang:`sql`,code:`CREATE OR REPLACE PROCEDURE transfer_funds(
  p_from INT, p_to INT, p_amount NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE accounts SET balance = balance - p_amount
   WHERE id = p_from AND balance >= p_amount;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient funds or account % missing', p_from;
  END IF;

  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to;
  INSERT INTO ledger (from_id, to_id, amount) VALUES (p_from, p_to, p_amount);
END;
$$;

CALL transfer_funds(1, 2, 100.00);`},{type:`heading3`,text:`Calling it from Node.js`},{type:`code`,lang:`typescript`,code:`import { Pool } from 'pg';
const pool = new Pool();

await pool.query('CALL transfer_funds($1, $2, $3)', [1, 2, 100]);
// Parameters are bound \u2014 no SQL injection risk

// MySQL (mysql2): await conn.query('CALL transfer_funds(?, ?, ?)', [1, 2, 100]);`},{type:`bullets`,items:["**Pros:** fewer round trips, logic next to the data, consistent rules for every client app, fine-grained permissions (`GRANT EXECUTE`), plans can be reused.",`**Cons:** business logic split between app and DB, harder unit testing and code review, vendor lock-in (PL/pgSQL vs T-SQL vs PL/SQL), harder to scale (DB CPU is the most expensive CPU), deployment needs migrations.`,`**Good fits:** bulk data processing, complex reporting, enforcing invariants that every client must obey, legacy systems where the DB is the integration point.`]},{type:`callout`,variant:`tip`,text:`Interview tip: give a balanced view — most Node.js teams keep business logic in the service layer and use procedures selectively for data-heavy operations. Mention that procedures should still live in version-controlled migrations.`}]},"What is an ORM? What are the advantages and disadvantages of using one?":{summary:`An ORM (Object-Relational Mapper) maps database tables to classes/objects so you work with entities and methods instead of raw SQL — e.g. Prisma, TypeORM, Sequelize, MikroORM in Node.js. It speeds up development and adds type safety, migrations and portability, but it can hide inefficient queries (N+1, over-fetching), make complex SQL awkward, and add a learning/abstraction layer.`,details:[{type:`paragraph`,text:"There is a spectrum: raw driver (`pg`, `mysql2`) → query builder (Knex, Kysely, Drizzle) → full ORM (Prisma, TypeORM, Sequelize). The further right, the more the tool writes SQL for you."},{type:`heading3`,text:`Same query three ways`},{type:`code`,lang:`typescript`,code:`// 1) Raw driver \u2014 full control, manual mapping
const { rows } = await pool.query(
  'SELECT id, name FROM users WHERE active = $1 ORDER BY created_at DESC LIMIT 10',
  [true],
);

// 2) Query builder (Kysely) \u2014 typed SQL, still SQL-shaped
const users = await db.selectFrom('users')
  .select(['id', 'name'])
  .where('active', '=', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute();

// 3) ORM (Prisma) \u2014 entity-shaped, relations included
const users2 = await prisma.user.findMany({
  where: { active: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  select: { id: true, name: true, posts: { select: { title: true } } },
});`},{type:`heading3`,text:`Advantages`},{type:`bullets`,items:[`Faster development for CRUD; less boilerplate mapping rows to objects.`,`Type safety (Prisma/Drizzle generate types from the schema).`,`Parameterized queries by default — protects against SQL injection.`,`Migrations, relations, validation and transactions in one tool.`,`Some portability between databases.`]},{type:`heading3`,text:`Disadvantages`},{type:`bullets`,items:["Hidden performance problems: N+1 queries via lazy relations, `SELECT *` over-fetching.",`Complex queries (window functions, CTEs, bulk upserts) are awkward — you fall back to raw SQL anyway.`,`Abstraction leaks: you still need to understand SQL, indexes and transactions.`,`Runtime overhead and sometimes large dependencies.`]},{type:`code`,lang:`typescript`,code:`// Escape hatch when the ORM gets in the way (Prisma, still parameterized)
const top = await prisma.$queryRaw\`
  SELECT user_id, SUM(total) AS spent,
         RANK() OVER (ORDER BY SUM(total) DESC) AS rnk
  FROM orders
  GROUP BY user_id
  LIMIT \${limit}\`;`},{type:`callout`,variant:`tip`,text:`Interview tip: a strong answer is "ORM for 80% CRUD, raw SQL/query builder for hot paths and reports, and always log the generated SQL in development". Name a tool you have used and a time it produced a bad query.`}]},"What is the N+1 query problem and how do you fix it?":{summary:"N+1 happens when you run 1 query to fetch a list of N parent rows and then 1 extra query per row to load a relation — N+1 round trips instead of 1 or 2. Fix it by fetching the related data in bulk: a JOIN, an `IN (...)` query, the ORM's eager loading (`include`/`relations`/`populate`), or batching with DataLoader in GraphQL.",details:[{type:`paragraph`,text:`Each query may only take 2 ms, but 1 + 500 queries = 1 second plus connection-pool pressure. It is easy to miss because the code looks innocent — especially with ORM lazy loading or GraphQL field resolvers.`},{type:`heading3`,text:`The problem`},{type:`code`,lang:`typescript`,code:`// \u274C 1 query for posts + 1 query PER post for its author
const posts = await db.query('SELECT * FROM posts LIMIT 100');      // 1
for (const post of posts.rows) {
  const author = await db.query(
    'SELECT * FROM users WHERE id = $1', [post.author_id]);           // +100
  post.author = author.rows[0];
}
// Total: 101 queries`},{type:`heading3`,text:`Fix 1 — a JOIN (1 query)`},{type:`code`,lang:`sql`,code:`SELECT p.*, u.name AS author_name
FROM posts p
JOIN users u ON u.id = p.author_id
LIMIT 100;`},{type:`heading3`,text:`Fix 2 — batch with IN / ANY (2 queries)`},{type:`code`,lang:`typescript`,code:`const { rows: posts } = await db.query('SELECT * FROM posts LIMIT 100');
const ids = [...new Set(posts.map(p => p.author_id))];
const { rows: users } = await db.query(
  'SELECT * FROM users WHERE id = ANY($1)', [ids]);
const byId = new Map(users.map(u => [u.id, u]));
posts.forEach(p => (p.author = byId.get(p.author_id)));
// Total: 2 queries regardless of N`},{type:`heading3`,text:`Fix 3 — ORM eager loading and DataLoader`},{type:`code`,lang:`typescript`,code:`// Prisma
const posts = await prisma.post.findMany({ take: 100, include: { author: true } });

// TypeORM
const posts2 = await repo.find({ take: 100, relations: { author: true } });

// GraphQL: DataLoader collects all author IDs requested in one tick
import DataLoader from 'dataloader';
const authorLoader = new DataLoader(async (ids: readonly number[]) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = ANY($1)', [ids]);
  const map = new Map(rows.map(u => [u.id, u]));
  return ids.map(id => map.get(id) ?? null);   // same order as ids
});
// resolver: author: (post) => authorLoader.load(post.author_id)`},{type:`flow`,title:`N+1 vs batched loading`,code:`sequenceDiagram
  participant App
  participant DB
  Note over App,DB: N+1 (101 round trips)
  App->>DB: SELECT posts LIMIT 100
  loop each post
    App->>DB: SELECT user WHERE id = ?
  end
  Note over App,DB: Batched (2 round trips)
  App->>DB: SELECT posts LIMIT 100
  App->>DB: SELECT users WHERE id = ANY(ids)`},{type:`callout`,variant:`tip`,text:`Interview tip: explain how you would DETECT it — enable query logging in dev, count queries per request in tests or APM traces (many identical queries with different IDs is the signature), then pick JOIN vs batch depending on data size.`}]},"How do you read an `EXPLAIN ANALYZE` plan to find out why a query is slow?":{summary:"First find the queries worth fixing with `pg_stat_statements` (highest total time, not just slowest single call). Then run `EXPLAIN (ANALYZE, BUFFERS)` and read the plan bottom-up: inner nodes run first and feed their parents. I look for the node where most of the time goes, for big gaps between estimated and actual rows (stale or missing statistics), for scans that read far more rows than they return, and for many buffer reads from disk.",details:[{type:`paragraph`,text:"`EXPLAIN` shows the plan the optimizer chose with its estimates. `EXPLAIN ANALYZE` also **runs** the query and adds actual timings and row counts per node. `BUFFERS` adds how many 8 kB pages came from shared buffers (`hit`) versus the OS or disk (`read`). Together they tell you where the time goes and why the planner picked that path."},{type:`heading3`,text:`Step 1: find the slow queries first`},{type:`code`,lang:`sql`,code:`-- Needs shared_preload_libraries = 'pg_stat_statements' + CREATE EXTENSION
SELECT query,
       calls,
       round(total_exec_time) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;`},{type:`paragraph`,text:"Sort by **total** time: a 5 ms query called 2 million times a day usually matters more than one 3 s report. `auto_explain` (with `log_min_duration`) can log the plans of slow queries in production so you see the real plan, with real parameters."},{type:`heading3`,text:`Step 2: a worked example`},{type:`code`,lang:`sql`,code:`EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.total, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 20;

Limit  (cost=98012.4..98012.5 rows=20) (actual time=1843.1..1843.2 rows=20 loops=1)
  Buffers: shared hit=1204 read=88412
  ->  Sort  (cost=98012.4..98012.7 rows=120) (actual time=1843.1..1843.1 rows=20 loops=1)
        Sort Key: o.created_at DESC
        Sort Method: top-N heapsort  Memory: 27kB
        ->  Hash Join  (cost=310.0..98009.2 rows=120) (actual time=4.1..1821.7 rows=48210 loops=1)
              Hash Cond: (o.customer_id = c.id)
              ->  Seq Scan on orders o  (cost=0..97650.0 rows=120) (actual time=0.03..1790.5 rows=48210 loops=1)
                    Filter: (status = 'pending')
                    Rows Removed by Filter: 4951790
              ->  Hash  (actual time=4.0..4.0 rows=10000 loops=1)
                    ->  Seq Scan on customers c  (actual time=0.01..2.1 rows=10000 loops=1)
Planning Time: 0.4 ms
Execution Time: 1843.4 ms`},{type:`numbered`,items:["**Start at the deepest nodes.** The `Seq Scan on orders` takes ~1790 ms of the 1843 ms total. That is the problem; the join, sort and limit are cheap.","**Rows Removed by Filter: 4,951,790.** It read 5 million rows to keep 48 thousand. That is a missing index on `status`.","**Estimate vs actual: 120 vs 48,210.** A 400x miss means the statistics are stale or the value distribution is skewed. Run `ANALYZE orders;` and check autovacuum. Bad estimates are the root cause of most bad join choices.",`**Buffers read=88412** means about 690 MB came from outside shared buffers. That is real I/O, not just CPU.`,"**Fix:** `CREATE INDEX CONCURRENTLY ON orders (status, created_at DESC);` lets Postgres walk the index in order and stop after 20 rows. The Sort node disappears and the query drops to about a millisecond."]},{type:`heading3`,text:`Node types to recognise`},{type:`bullets`,items:[`**Seq Scan:** reads the whole table. Fine for small tables or when most rows match.`,`**Index Scan:** walks the index, then fetches each row from the heap. Best for few rows.`,"**Index Only Scan:** answered from the index alone. Watch `Heap Fetches`: high values mean the visibility map is stale and the table needs VACUUM.","**Bitmap Index Scan + Bitmap Heap Scan:** collects matching row locations first, then reads heap pages in physical order. Used for medium selectivity or to combine several indexes. `Recheck Cond` and `lossy` blocks mean `work_mem` was too small for an exact bitmap.",`**Nested Loop:** for each outer row, probe the inner side. Great when the outer side is small and the inner side is indexed; terrible when the estimate said 10 rows and it was really 100 thousand.`,"**Hash Join:** builds a hash table on the smaller input. Good for large unsorted inputs; `Batches: > 1` means it spilled to disk.",`**Merge Join:** both inputs sorted on the join key. Good for large inputs that are already sorted (for example, from indexes).`]},{type:`callout`,variant:`warning`,text:"`EXPLAIN ANALYZE` really executes the statement. For `UPDATE`/`DELETE`/`INSERT`, wrap it in `BEGIN; ... ROLLBACK;`. Also remember that `actual time` and `rows` are **per loop**: multiply by `loops` (common under a Nested Loop) to get the real total."},{type:`callout`,variant:`tip`,text:"Interview tip: describe a routine, not a single trick: pg_stat_statements to pick the target, `EXPLAIN (ANALYZE, BUFFERS)` with production-like data and parameters, find the most expensive node, compare estimated vs actual rows, then fix with an index, a query rewrite or fresh statistics, and measure again."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Why might the same query be fast in staging and slow in production? (Data volume, distribution, statistics, cache state, generic vs custom plans for prepared statements.)`,`What is the difference between cost and actual time? (Cost is in abstract planner units; time is measured.)`,"How do you get a plan for a query an ORM generated? (Log it, or use `auto_explain`.)","When would you raise `default_statistics_target` or create extended statistics with `CREATE STATISTICS`?"]}]},"How do you design a composite index, and why does column order matter?":{summary:"A composite B-tree index is sorted by the first column, then by the second within each value of the first, and so on, so it can only be used efficiently from the left. My rule: equality-filter columns first, then the one range or sort column, then optionally `INCLUDE` extra columns so the query becomes an index-only scan. I design indexes from the real queries, and I keep the count low because every index slows every write.",details:[{type:`paragraph`,text:`The basic left-prefix rule is covered in the indexes answer. At senior level the question is how to choose the order for a real query, and when to stop adding indexes. Think of a phone book sorted by (last name, first name): finding "Kumar, Asha" is fast, finding everyone named "Asha" means reading the whole book.`},{type:`heading3`,text:`Equality first, then range or sort`},{type:`code`,lang:`sql`,code:`-- The hot query
SELECT id, total
FROM orders
WHERE tenant_id = $1
  AND status = 'paid'
  AND created_at >= now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 50;

-- Good: equality columns, then the range/sort column
CREATE INDEX CONCURRENTLY orders_tenant_status_created_idx
  ON orders (tenant_id, status, created_at DESC)
  INCLUDE (total);   -- covering: id/total come from the index, no heap fetch

-- Worse: range column in the middle
CREATE INDEX orders_bad_idx ON orders (tenant_id, created_at, status);
-- Postgres scans every row of the tenant in the date range and
-- checks status for each one, and cannot return rows already sorted
-- for "WHERE status = 'paid' ORDER BY created_at".`},{type:`bullets`,items:["**Equality columns first.** With `=` on the leading columns, all matching entries sit next to each other in the index, so one range of the B-tree covers them.",`**One range or sort column next.** After a range condition, later columns cannot narrow the scan; they can only be checked as filters on each entry.`,"**Match the sort.** If the index order matches `ORDER BY`, Postgres reads in order and stops at `LIMIT`, with no Sort node. Mixed directions (`ORDER BY a ASC, b DESC`) need an index declared the same way.",`**"Most selective first" is a weaker rule** than "equality before range". With only equality filters, order matters less for that query; choose the order that also serves your other queries.`,`In PostgreSQL 17 and earlier, a query that skips the leading column usually cannot use the index well (PostgreSQL 18 adds a limited skip scan, which helps when the leading column has few distinct values).`]},{type:`heading3`,text:`Covering and partial indexes`},{type:`code`,lang:`sql`,code:`-- Partial: only index the rows the hot query touches
CREATE INDEX CONCURRENTLY jobs_pending_idx
  ON jobs (run_at)
  WHERE status = 'pending';
-- Used only when the query also says WHERE status = 'pending'

-- Partial unique: one active subscription per user
CREATE UNIQUE INDEX one_active_sub
  ON subscriptions (user_id)
  WHERE cancelled_at IS NULL;`},{type:`paragraph`,text:"`INCLUDE` columns are stored only in the leaf pages; they are not part of the sort key, so they make the index cover the query without changing what it can search on. An index-only scan still checks the visibility map, so it works best on tables that VACUUM keeps up with."},{type:`heading3`,text:`The cost of too many indexes`},{type:`bullets`,items:["Every `INSERT` and `DELETE` updates every index; every `UPDATE` of an indexed column does too.",`Updating an indexed column prevents a HOT (heap-only tuple) update, so even untouched indexes get new entries.`,`More indexes means more WAL, bigger backups, slower replicas and less of the hot data fitting in memory.`,"An index on `(a, b)` usually makes a separate index on `(a)` redundant."]},{type:`code`,lang:`sql`,code:`-- Indexes never used since stats were last reset
SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
-- Check replicas too before dropping: stats are per server.`},{type:`callout`,variant:`warning`,text:'Do not create an index for every column the team filters on "just in case". Start from `pg_stat_statements`, design one composite index per hot access pattern, and remove the unused ones. Unique and primary key indexes are never "unused": they enforce constraints.'},{type:`callout`,variant:`tip`,text:`Interview tip: write the query on the whiteboard first, then derive the index from it out loud: "tenant_id and status are equality, created_at is the range and the sort, total is only selected, so (tenant_id, status, created_at DESC) INCLUDE (total)." Then mention the write cost.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Can Postgres combine two single-column indexes? (Yes, with a BitmapAnd, but usually slower than one good composite index.)`,`Why is my index not used? (Function on the column, type mismatch, low selectivity, stale stats, leading column missing.)`,"How do you add an index to a big table in production? (`CREATE INDEX CONCURRENTLY`.)",`When is a GIN or BRIN index a better fit than a B-tree?`]}]},"What causes deadlocks, and how do you prevent and handle them?":{summary:"A deadlock happens when two transactions each hold a lock the other one needs, so neither can continue. PostgreSQL detects the cycle and aborts one of them with SQLSTATE `40P01`, so the application must retry that transaction. I prevent most deadlocks by always locking rows in the same order, keeping transactions short, and using `lock_timeout` so nothing waits forever.",details:[{type:`paragraph`,text:`Deadlocks are not the same as the lost-update race (covered in the backend operations answers). A lost update silently loses data; a deadlock is loud: the database kills one transaction. The classic cause is two transactions touching the same rows in **opposite orders**.`},{type:`heading3`,text:`How it happens`},{type:`code`,lang:`sql`,code:`-- Tx A: transfer 1 -> 2            -- Tx B: transfer 2 -> 1
BEGIN;                                BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;   -- A locks row 1
                                      UPDATE accounts SET balance = balance - 5 WHERE id = 2;  -- B locks row 2
UPDATE accounts SET balance = balance + 10 WHERE id = 2;   -- A waits for B
                                      UPDATE accounts SET balance = balance + 5 WHERE id = 1;  -- B waits for A: cycle

-- After deadlock_timeout (default 1s) Postgres checks for a cycle:
-- ERROR:  deadlock detected   (SQLSTATE 40P01)
-- DETAIL: Process 4211 waits for ShareLock on transaction 9912; blocked by process 4207 ...`},{type:`paragraph`,text:"Postgres aborts one transaction and the other continues. The server log contains both statements, which is how you find the pair of code paths involved. Other common sources: bulk updates whose rows arrive in different orders, foreign key checks (inserting a child takes a `FOR KEY SHARE` lock on the parent row), and upserts on the same keys from parallel workers."},{type:`heading3`,text:`Prevention`},{type:`numbered`,items:[`**Consistent lock order.** Lock rows in a fixed order, for example by primary key, in every code path.`,"**Lock up front.** Take all the row locks you need at the start with one `SELECT ... FOR UPDATE`, instead of locking more rows as the transaction goes along.",`**Keep transactions short.** No HTTP calls, emails or user think-time inside a transaction. Less time holding locks means fewer chances for a cycle.`,`**Batch in sorted order.** For bulk updates, sort the keys before updating.`,"**Set `lock_timeout`** so a request fails fast with `55P03` instead of piling up behind a long lock."]},{type:`code`,lang:`sql`,code:`BEGIN;
SET LOCAL lock_timeout = '2s';

-- Lock both accounts in id order, whichever direction the transfer goes
SELECT id, balance
FROM accounts
WHERE id = ANY(ARRAY[2, 1])
ORDER BY id
FOR UPDATE;

UPDATE accounts SET balance = balance - 10 WHERE id = 1;
UPDATE accounts SET balance = balance + 10 WHERE id = 2;
COMMIT;`},{type:`heading3`,text:`Handling: retry the whole transaction`},{type:`code`,lang:`typescript`,code:`import { Pool } from 'pg';
const pool = new Pool();

const RETRYABLE = new Set(['40P01', '40001']); // deadlock, serialization failure

export async function withTx<T>(fn: (c: any) => Promise<T>, attempts = 4): Promise<T> {
  for (let i = 1; ; i++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => {});
      if (!RETRYABLE.has(err.code) || i >= attempts) throw err;
      const delay = 2 ** i * 20 + Math.random() * 50; // backoff + jitter
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      client.release();
    }
  }
}`},{type:`callout`,variant:`warning`,text:"Retry the **whole** transaction from `BEGIN`, never just the failed statement: the aborted transaction has already rolled back everything. And only retry if the work inside is safe to repeat; side effects such as sending an email must happen after `COMMIT`."},{type:`callout`,variant:`tip`,text:"Interview tip: say clearly that deadlocks cannot be fully eliminated in a busy system, so you design for both sides: lock ordering and short transactions to make them rare, and a retry wrapper plus monitoring (`log_lock_waits`, the deadlocks counter in `pg_stat_database`) to handle the rest."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["What is the difference between `lock_timeout` and `statement_timeout`?","When would you use `FOR UPDATE SKIP LOCKED` or `NOWAIT`? (Job queues; fail fast instead of waiting.)","How do you find who is blocking whom right now? (`pg_stat_activity` with `pg_blocking_pids(pid)`.)","Can a single `UPDATE` statement deadlock with another? (Yes, if both touch several rows in different orders.)"]}]},"How do you change a database schema with zero downtime (expand and contract)?":{summary:"During a rolling deploy, old and new versions of the app run against the same database at the same time, so every schema change must work with both. Expand and contract splits a breaking change into safe steps: add the new structure (nullable), backfill in batches, dual-write, switch reads, and only then drop the old structure in a later release. On the database side, I avoid long `ACCESS EXCLUSIVE` locks: `CREATE INDEX CONCURRENTLY`, `NOT VALID` constraints that are validated later, and a short `lock_timeout` on every migration.",details:[{type:`paragraph`,text:"Two things cause downtime. **Compatibility:** renaming `name` to `full_name` in one step breaks every old pod still running during the rollout, and makes rollback impossible. **Locking:** many `ALTER TABLE` forms take an `ACCESS EXCLUSIVE` lock, and some rewrite the whole table while holding it, blocking even reads."},{type:`heading3`,text:`Expand and contract: renaming a column`},{type:`numbered`,items:["**Expand:** `ALTER TABLE users ADD COLUMN full_name text;` (nullable, no default: metadata-only, instant).","**Dual-write:** deploy app v2 that writes both `name` and `full_name`, still reading `name`.",`**Backfill** old rows in small batches.`,"**Switch reads:** deploy v3 that reads `full_name` (still writing both, so a rollback to v2 is safe).","**Stop writing** the old column (v4), then add any `NOT NULL` constraint safely.","**Contract:** in a later release, `ALTER TABLE users DROP COLUMN name;`."]},{type:`code`,lang:`typescript`,code:`// Backfill in batches: short transactions, small locks, replicas keep up
async function backfill(pool: import('pg').Pool) {
  for (;;) {
    const { rowCount } = await pool.query(
      'UPDATE users SET full_name = name ' +
      'WHERE id IN (SELECT id FROM users WHERE full_name IS NULL LIMIT 5000)'
    );
    if (rowCount === 0) break;
    await new Promise((r) => setTimeout(r, 100)); // throttle
  }
}`},{type:`heading3`,text:`Lock-safe DDL in PostgreSQL`},{type:`code`,lang:`sql`,code:`-- Never wait long for a lock: a queued ALTER blocks everyone behind it
SET lock_timeout = '3s';

-- Indexes without blocking writes (cannot run inside a transaction block)
CREATE INDEX CONCURRENTLY orders_customer_idx ON orders (customer_id);
-- If it fails it leaves an INVALID index: DROP INDEX CONCURRENTLY and retry

-- Foreign key without a long scan under a strong lock
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id)
  REFERENCES customers (id) NOT VALID;          -- new rows checked from now on
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;  -- weaker lock, writes continue

-- NOT NULL without a full-table scan under ACCESS EXCLUSIVE
ALTER TABLE users ADD CONSTRAINT users_full_name_nn
  CHECK (full_name IS NOT NULL) NOT VALID;
ALTER TABLE users VALIDATE CONSTRAINT users_full_name_nn;
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;  -- uses the valid CHECK, no scan
ALTER TABLE users DROP CONSTRAINT users_full_name_nn;`},{type:`bullets`,items:[`**Safe and fast:** adding a nullable column; adding a column with a constant default (no rewrite since PostgreSQL 11).`,"**Dangerous on big tables:** changing a column type (usually a full rewrite), adding a column with a volatile default such as `random()`, plain `CREATE INDEX` (blocks writes), `VACUUM FULL`.","**The lock queue trap:** even a quick `ALTER` must wait for long-running queries to finish, and every new query queues behind it. `lock_timeout` plus a retry turns an outage into a failed, retryable migration.","**Tooling:** most migration tools run each file in a transaction. For `CONCURRENTLY`, turn that off (for example, Knex: `exports.config = { transaction: false }`), and keep such statements in their own migration file."]},{type:`callout`,variant:`warning`,text:`Run migrations as a separate step before the new code rolls out, and make each migration compatible with the code that is already running. A migration that only works with the new code is a coupled deploy, and a rollback becomes a data-loss incident.`},{type:`callout`,variant:`tip`,text:'Interview tip: walk through one concrete example (a column rename or a type change) across 3 to 4 deploys, and name the lock each step takes. Interviewers listen for "backward compatible with the running version" and "never hold `ACCESS EXCLUSIVE` for long".'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["How would you change a column from `int` to `bigint` on a billion-row table? (New column, trigger or dual-write, batched backfill, swap.)",`How do you roll back a migration? (Prefer forward fixes; contract steps are not reversible.)`,`How do you test migrations? (Against a production-sized copy, measuring lock time and duration.)`,`What do tools like pgroll or Reshape automate here?`]}]},"How do read replicas work, and how do you deal with replication lag?":{summary:`The primary streams its write-ahead log (WAL) to replicas, which replay it and serve read-only queries. By default this is asynchronous, so replicas are slightly behind: usually milliseconds, sometimes seconds under heavy load. The main problem is read-your-writes: after a user saves something, read from the primary (or wait until the replica has replayed that write), and monitor lag so you can stop sending traffic to a replica that falls too far behind.`,details:[{type:`paragraph`,text:`Every change in PostgreSQL is first written to the WAL. With streaming replication, a WAL sender on the primary sends those records to each replica (a hot standby), which applies them in order. Replicas scale reads (reports, search pages, dashboards) and are failover candidates, but they do not scale writes.`},{type:`heading3`,text:`Asynchronous vs synchronous`},{type:`bullets`,items:[`**Asynchronous (default):** the primary commits without waiting for replicas. Fast, but replicas lag, and a crash can lose the last commits that were not yet shipped.`,"**Synchronous** (`synchronous_standby_names`): the commit waits for the chosen standbys. `synchronous_commit = on` waits for the WAL to be flushed on the standby; `remote_apply` waits until it is replayed and visible to queries there. Safer, but every write pays a network round trip, and writes stall if the synchronous standby is down."]},{type:`heading3`,text:`Read-your-writes strategies`},{type:`numbered`,items:[`**Route after write:** for a short window (for example, 5 s) after a user writes, send that user’s reads to the primary. Easy and common; store the timestamp in the session or a cookie.`,`**Stickiness per request:** inside a request that wrote, all later reads use the primary connection.`,"**Wait for the LSN:** after the write, read `pg_current_wal_lsn()` on the primary; before reading from a replica, check that `pg_last_wal_replay_lsn()` has reached it, otherwise fall back to the primary.",`**Accept staleness** where it is fine: analytics, public listings, search results.`]},{type:`code`,lang:`typescript`,code:`import { Pool } from 'pg';
const primary = new Pool({ connectionString: process.env.PRIMARY_URL });
const replica = new Pool({ connectionString: process.env.REPLICA_URL });

// After a write: remember the primary position for this user
async function afterWrite(session: { lsn?: string }) {
  const { rows } = await primary.query('SELECT pg_current_wal_lsn() AS lsn');
  session.lsn = rows[0].lsn;
}

// For a read: use the replica only if it has caught up
async function poolForRead(session: { lsn?: string }) {
  if (!session.lsn) return replica;
  const { rows } = await replica.query(
    'SELECT pg_last_wal_replay_lsn() >= $1::pg_lsn AS ok', [session.lsn]);
  return rows[0].ok ? replica : primary;
}`},{type:`paragraph`,text:"With Prisma, the `@prisma/extension-read-replicas` extension routes reads to replicas and lets you force the primary with `$primary()`. With TypeORM, `replication: { master, slaves }` sends `find` queries to replicas and writes to the master."},{type:`heading3`,text:`Monitoring lag`},{type:`code`,lang:`sql`,code:`-- On the primary: per replica
SELECT application_name, state, write_lag, flush_lag, replay_lag
FROM pg_stat_replication;

-- On a replica: how old is the last replayed transaction?
SELECT now() - pg_last_xact_replay_timestamp() AS replay_delay;
-- (This grows on an idle primary too, so alert on it together with write activity.)`},{type:`heading3`,text:`Failover and in-flight writes`},{type:`bullets`,items:[`When the primary dies, a replica is promoted (by Patroni, RDS/Aurora or similar). Open connections and in-flight transactions on the old primary fail; the app must reconnect, usually via a DNS name or proxy that now points at the new primary.`,`With asynchronous replication, commits acknowledged to the client but not yet shipped are **lost**. If that is unacceptable for some data, use synchronous replication for it.`,`Clients that retry after a connection error do not know whether their last commit succeeded. Idempotency keys make those retries safe.`,"Long queries on a replica can be cancelled when they conflict with replayed changes (`max_standby_streaming_delay`, `hot_standby_feedback`)."]},{type:`callout`,variant:`warning`,text:`Never read from a replica and then write based on that read (for example, check stock, then decrement). The value may be stale. Reads that lead to writes belong on the primary, inside the same transaction.`},{type:`callout`,variant:`tip`,text:`Interview tip: start with "replicas are eventually consistent", then give a concrete user-facing bug (user edits their profile, page reloads, old name appears) and your fix for it. That shows you have run replicas in production, not just drawn them.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Streaming vs logical replication: when would you use logical? (Selected tables, upgrades across major versions, feeding other systems.)`,`How does Aurora replication differ? (Shared storage, typically lower lag.)`,`How many replicas would you add, and how do you load-balance across them?`,`What happens to sequences and caches after a failover?`]}]},"When and how do you partition or shard a relational table?":{summary:`Partitioning splits one large table into smaller tables on the same server, and Postgres routes queries to the right ones; I use it when a table is huge, queries filter on a natural key such as time, and I need cheap retention by dropping old partitions. Sharding spreads data across several servers, which is needed only when one machine can no longer handle the writes or the data size. Partition first, shard last: sharding brings shard-key design, cross-shard queries and much more operational work.`,details:[{type:`paragraph`,text:`Partitioning is not mainly a speed feature. A well-indexed 500 GB table can be fast. The big wins are **maintenance** (vacuum and indexes per partition), **retention** (dropping a month is instant, deleting 200 million rows is not) and **pruning** for queries that always filter on the partition key.`},{type:`heading3`,text:`Declarative partitioning in PostgreSQL`},{type:`code`,lang:`sql`,code:`CREATE TABLE events (
  id          bigint GENERATED ALWAYS AS IDENTITY,
  tenant_id   uuid        NOT NULL,
  created_at  timestamptz NOT NULL,
  payload     jsonb,
  PRIMARY KEY (id, created_at)          -- must include the partition key
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_10 PARTITION OF events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE events_2026_11 PARTITION OF events
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

-- Created on the parent, copied to every partition
CREATE INDEX ON events (tenant_id, created_at);

-- Other strategies
-- PARTITION BY LIST (region)        -> FOR VALUES IN ('eu', 'uk')
-- PARTITION BY HASH (tenant_id)     -> FOR VALUES WITH (MODULUS 8, REMAINDER 0)`},{type:`bullets`,items:[`**Range:** time series, logs, orders by month. The most common choice.`,`**List:** a small, known set of values such as region or country.`,`**Hash:** spread rows evenly when no natural range exists.`,"**Partition pruning:** `WHERE created_at >= now() - interval '7 days'` scans only the recent partitions. Pruning happens at planning time and also at execution time for parameters. If the query does not filter on the partition key, it touches every partition and can be slower than one big table.",`**Constraints:** primary keys and unique indexes must include the partition key.`,"**Keep the count sensible:** hundreds of partitions are fine, many thousands slow down planning. Tools like `pg_partman` create future partitions automatically."]},{type:`heading3`,text:`Retention by dropping partitions`},{type:`code`,lang:`sql`,code:`-- Instant, no table bloat, no huge DELETE in the WAL
ALTER TABLE events DETACH PARTITION events_2025_10 CONCURRENTLY;  -- PG 14+
DROP TABLE events_2025_10;   -- or archive it to S3 first`},{type:`heading3`,text:`Sharding: across servers`},{type:`paragraph`,text:`Sharding is a different decision. Each shard is a separate database holding a subset of rows, and the app (or a layer such as **Citus**) routes queries by a **shard key**. Before sharding, check the cheaper options: query and index tuning, a bigger instance, read replicas, caching, archiving cold data, partitioning.`},{type:`bullets`,items:["**Choosing the shard key:** it should appear in almost every query, spread load evenly, and keep related data together. In B2B SaaS, `tenant_id` is the usual choice; a single huge tenant can still become a hot shard.",`**Cross-shard queries:** queries without the shard key fan out to every shard and merge the results. Joins and aggregates across shards are slow and complex.`,`**Cross-shard transactions:** need two-phase commit or a saga; most designs avoid them by keeping one business transaction inside one shard.`,`**Resharding:** moving data when you add shards is the hardest operational part. Use many logical shards mapped to fewer physical servers so you move whole shards, not rows.`,"**Citus:** a Postgres extension that distributes tables by a column, `SELECT create_distributed_table('events', 'tenant_id');`, and routes or parallelises queries for you."]},{type:`callout`,variant:`warning`,text:`Choose the partition key from your query patterns. If most queries filter by tenant but you partition by month, every query scans all months. Also, converting an existing large table into a partitioned one is itself a migration project, so plan it before the table gets huge.`},{type:`callout`,variant:`tip`,text:`Interview tip: say "partitioning is one server, sharding is many", then justify each with a trigger: retention and maintenance for partitioning, write throughput or data size beyond one machine for sharding. Mention that you would exhaust vertical scaling and replicas first.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you migrate a live unpartitioned table to a partitioned one?`,`What is a default partition, and why can it be a problem?`,"How would you pick between `tenant_id` and `created_at` as the key?",`How do IDs work across shards? (UUIDs, UUIDv7, or ID ranges per shard.)`]}]},"PostgreSQL `JSONB` vs a document database: when is each the better choice?":{summary:"PostgreSQL `JSONB` stores parsed, binary JSON that you can index with GIN and query with operators like `@>`, inside the same ACID transactions and joins as your relational data. That makes a hybrid model, with relational columns for the core fields and `JSONB` for the variable attributes, a strong default. A document database like MongoDB is the better fit when almost everything is document-shaped, the schema changes per document, and you need built-in horizontal sharding at large scale.",details:[{type:`paragraph`,text:"`json` stores the raw text; `jsonb` stores a decomposed binary form (keys deduplicated, no whitespace) that is slightly slower to write and much faster to query and index. In practice you almost always want `jsonb`."},{type:`heading3`,text:`Hybrid model: relational core, JSONB for the variable part`},{type:`code`,lang:`sql`,code:`CREATE TABLE products (
  id          bigint PRIMARY KEY,
  sku         text UNIQUE NOT NULL,
  price_cents int  NOT NULL CHECK (price_cents >= 0),
  category_id int  NOT NULL REFERENCES categories(id),
  attrs       jsonb NOT NULL DEFAULT '{}'   -- {"color":"red","size":"M","voltage":220}
);

-- GIN index: supports containment (@>) and key-exists (?) queries
CREATE INDEX products_attrs_gin ON products USING gin (attrs);
-- Smaller and faster if you only need @>:
-- CREATE INDEX ... USING gin (attrs jsonb_path_ops);

SELECT id, sku FROM products
WHERE category_id = 7
  AND attrs @> '{"color": "red", "size": "M"}';

-- Expression B-tree index for one hot key (equality, ranges, sorting)
CREATE INDEX products_brand_idx ON products ((attrs ->> 'brand'));
SELECT * FROM products WHERE attrs ->> 'brand' = 'Acme';`},{type:`code`,lang:`typescript`,code:`// Prisma: Json field filters on PostgreSQL
const red = await prisma.product.findMany({
  where: { categoryId: 7, attrs: { path: ['color'], equals: 'red' } },
});

// node-postgres: pass an object, pg serialises it
await pool.query('SELECT id FROM products WHERE attrs @> $1', [{ color: 'red' }]);`},{type:`heading3`,text:`When JSONB in Postgres wins`},{type:`bullets`,items:[`Most data is relational (users, orders, payments) and only some parts vary: product attributes, settings, form answers, webhook payloads.`,`You need ACID transactions and joins across the JSON data and the relational data.`,`You want one database to run, back up and secure instead of two.`,"You can promote a hot key to a real column later, for example with a stored generated column: `ADD COLUMN brand text GENERATED ALWAYS AS (attrs ->> 'brand') STORED`."]},{type:`heading3`,text:`When a document database is the better fit`},{type:`bullets`,items:[`The whole domain is aggregate-shaped (a content item, a catalog entry, a user profile with nested lists) and is read and written as one document.`,`Schemas evolve quickly and differ between documents, and teams want to ship without migrations.`,`You need built-in sharding and high write throughput across many nodes. MongoDB was designed around this; Postgres needs Citus or custom sharding.`,`Features like change streams, flexible secondary indexes on nested arrays and a document-native query language fit the team.`]},{type:`callout`,variant:`warning`,text:"JSONB pitfalls: the planner has no per-key statistics, so estimates on JSON filters are often poor; updating one key rewrites the whole value, so large, frequently updated documents are expensive; and there are no foreign keys or types inside the JSON unless you add `CHECK` constraints. Do not put the fields you join, sort or filter on most often inside JSONB."},{type:`callout`,variant:`tip`,text:`Interview tip: avoid "Postgres can do everything". Say the hybrid model is your default for a mostly relational product, then name the concrete signals (document-shaped domain, per-document schema, horizontal write scale) that would make you pick MongoDB.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["What is the difference between `->` and `->>`? (JSON value vs text.)","How do you validate the shape of a JSONB column? (`CHECK` with `jsonb_typeof`, or validate in the app with Zod.)","What are SQL/JSON path queries (`@?`, `jsonb_path_query`)?",`How would you migrate a JSONB key into a real column without downtime?`]}]},"How do you design a multi-tenant database: shared schema, schema per tenant, or database per tenant?":{summary:"There are three main models. Shared schema with a `tenant_id` column on every table is the cheapest and simplest to operate, and Row-Level Security makes the database enforce isolation. Schema per tenant gives some separation but makes migrations and catalog size painful at thousands of tenants. Database per tenant gives the strongest isolation and per-tenant backup and restore, at the highest cost. Many SaaS products use shared schema for most tenants and a dedicated database for large or regulated customers.",details:[{type:`paragraph`,text:`The choice is a trade-off between isolation, cost, operational effort and noisy neighbours (one tenant’s heavy workload slowing everyone else). The number of tenants matters a lot: 20 enterprise customers and 50,000 self-serve sign-ups lead to different answers.`},{type:`heading3`,text:`Shared schema + Row-Level Security`},{type:`code`,lang:`sql`,code:`ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;   -- applies to the table owner too

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Every index starts with tenant_id
CREATE INDEX invoices_tenant_created_idx ON invoices (tenant_id, created_at DESC);`},{type:`paragraph`,text:"`USING` filters the rows a query can see, update or delete; `WITH CHECK` stops inserts or updates that would write another tenant’s `tenant_id`. With `missing_ok = true`, an unset `app.tenant_id` gives NULL, so the query returns no rows instead of all rows."},{type:`code`,lang:`typescript`,code:`// Set the tenant per transaction, so pooled connections never leak it
export async function withTenant<T>(tenantId: string, fn: (c: any) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // third argument true = local to this transaction
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Even a query that forgets "WHERE tenant_id = ..." only sees this tenant
await withTenant(req.user.tenantId, (c) => c.query('SELECT * FROM invoices'));`},{type:`callout`,variant:`warning`,text:"RLS is bypassed by superusers and roles with `BYPASSRLS`, and by the table owner unless you use `FORCE ROW LEVEL SECURITY`. Connect the app as a separate, non-owner role. Use `set_config(..., true)` or `SET LOCAL` inside a transaction; a session-level `SET` on a pooled connection can leak one tenant’s ID to the next request."},{type:`heading3`,text:`Comparing the three models`},{type:`bullets`,items:["**Shared schema (`tenant_id`):** cheapest, one migration run, easy cross-tenant analytics, scales to many thousands of tenants. Weakest isolation (a bug or missing policy leaks data), noisy neighbours, and per-tenant restore means filtering rows out of a full backup.","**Schema per tenant:** the app sets `search_path` per tenant; data is separated by name, and dropping a tenant is `DROP SCHEMA`. But migrations must run across N schemas (and can fail halfway), and thousands of schemas bloat the system catalog and slow tooling. Same server, so still noisy neighbours.",`**Database per tenant:** strongest isolation, per-tenant backup, restore, region and encryption keys, and easy to move one big tenant to its own hardware. Highest cost, many connection pools, and migrations, monitoring and upgrades across a fleet need automation.`,`**Hybrid ("pool" and "silo"):** shared schema for small tenants, dedicated database for enterprise or regulated tenants. A tenant catalog maps each tenant to its database, so the app routes per request.`]},{type:`paragraph`,text:"Shared schema also sets you up for growth: with `tenant_id` in every table and key, you can later shard by tenant (for example with Citus) without redesigning the data model."},{type:`callout`,variant:`tip`,text:'Interview tip: ask about the number of tenants, compliance needs and tenant size first, then choose. A strong default answer is "shared schema with `tenant_id` everywhere, enforced by RLS as a safety net behind the app checks, plus a path to move big tenants to their own database".'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you test that tenant isolation cannot be bypassed? (Integration tests that query as tenant A and assert no tenant B rows.)`,`How do you handle noisy neighbours? (Per-tenant rate limits, query timeouts, moving heavy tenants out.)`,"Does RLS hurt performance? (Small cost if policies are simple and `tenant_id` leads the indexes.)",`How do you delete all data for a tenant on request (GDPR)?`]}]}};export{e as answers};