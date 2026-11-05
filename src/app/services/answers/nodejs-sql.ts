import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is the difference between SQL and NoSQL databases?': {
    summary:
      'SQL (relational) databases store data in tables with a fixed schema, relationships enforced by foreign keys, and strong ACID transactions queried with SQL. NoSQL databases (document, key-value, wide-column, graph) use flexible data models designed around access patterns and usually scale horizontally more easily, often trading some consistency or join capability for it. Choose by data shape, consistency needs and query patterns — not hype.',
    details: [
      {
        type: 'paragraph',
        text: 'The real difference is the data model and the guarantees. A relational database models data as normalized tables and lets you ask almost any question later with joins. A NoSQL database asks you to model data around how you will read it, so common reads are a single lookup — but ad-hoc queries across entities are harder.',
      },
      { type: 'heading3', text: 'Same data, two models' },
      {
        type: 'code',
        lang: 'sql',
        code: `-- Relational (PostgreSQL): normalized, joined at read time
CREATE TABLE users  (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE orders (
  id      SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),   -- FK enforced by DB
  total   NUMERIC(10,2) NOT NULL
);

SELECT u.name, o.total
FROM users u JOIN orders o ON o.user_id = u.id
WHERE u.id = 42;`,
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Document (MongoDB): shaped for the read, no join needed
await db.collection('users').insertOne({
  _id: 42,
  name: 'Asha',
  recentOrders: [                 // embedded — read in one query
    { orderId: 9001, total: 59.99 },
    { orderId: 9002, total: 12.5 },
  ],
});

const user = await db.collection('users').findOne({ _id: 42 });
// → whole user + recent orders in a single round trip`,
      },
      { type: 'heading3', text: 'Key differences' },
      {
        type: 'bullets',
        items: [
          '**Schema:** SQL is schema-on-write (DDL, migrations); NoSQL is typically schema-flexible (schema-on-read), though MongoDB supports JSON Schema validation.',
          '**Relationships:** SQL has joins and foreign keys; NoSQL favours embedding/denormalization (MongoDB has `$lookup`, but it is not the primary pattern).',
          '**Transactions:** SQL has mature multi-row ACID transactions; MongoDB supports multi-document ACID transactions since 4.0, but single-document atomicity is the design goal.',
          '**Scaling:** SQL traditionally scales vertically plus read replicas (sharding exists via Citus, Vitess, etc.); many NoSQL stores have built-in sharding.',
          '**Query flexibility:** SQL excels at ad-hoc analytics and reporting; NoSQL excels at predictable, high-volume access patterns.',
          '**Types of NoSQL:** document (MongoDB), key-value (Redis, DynamoDB), wide-column (Cassandra), graph (Neo4j) — "NoSQL" is not one thing.',
        ],
      },
      {
        type: 'flow',
        title: 'Choosing a database',
        code: `flowchart TD
  Q{"Strong relations,<br/>multi-entity transactions,<br/>ad-hoc reporting?"} -->|Yes| SQL([Relational: PostgreSQL / MySQL]):::db
  Q -->|No| R{"Data shape varies or is<br/>read as one aggregate?"}
  R -->|Yes| DOC([Document: MongoDB]):::db
  R -->|No| K{"Simple key lookups<br/>at huge scale or as cache?"}
  K -->|Yes| KV([Key-value: Redis / DynamoDB]):::cache
  K -->|No| SQL`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: avoid "SQL doesn\'t scale, NoSQL is faster". Say that PostgreSQL is a great default, and you pick NoSQL when the access pattern, data shape or scale requirement clearly favours it. Many real systems use both (Postgres for orders, Redis for cache, MongoDB for catalog/content).',
      },
    ],
  },

  'What is database normalization? Explain 1NF, 2NF, 3NF': {
    summary:
      'Normalization organizes tables to remove redundancy and update anomalies by making every non-key column depend on "the key, the whole key, and nothing but the key". 1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependency on part of a composite key. 3NF: 2NF + no transitive dependency (non-key column depending on another non-key column).',
    details: [
      {
        type: 'paragraph',
        text: "Redundant data causes anomalies: change a customer's email in one row but not another (update anomaly), can't store a product until someone orders it (insert anomaly), or lose a product when its last order is deleted (delete anomaly). Normalization splits tables so each fact lives in exactly one place.",
      },
      { type: 'heading3', text: 'Starting point: an unnormalized table' },
      {
        type: 'code',
        lang: 'text',
        code: `orders_raw
order_id | customer | customer_city | products                 | product_prices
---------+----------+---------------+--------------------------+---------------
1        | Asha     | Pune          | Keyboard, Mouse          | 40, 15
2        | Ravi     | Delhi         | Mouse                    | 15
3        | Asha     | Pune          | Monitor                  | 200

Problems: multi-valued cells, customer data repeated, product price repeated`,
      },
      { type: 'heading3', text: '1NF — atomic values, no repeating groups' },
      {
        type: 'code',
        lang: 'text',
        code: `order_items  (PK: order_id + product)
order_id | product  | price | customer | customer_city
---------+----------+-------+----------+--------------
1        | Keyboard | 40    | Asha     | Pune
1        | Mouse    | 15    | Asha     | Pune
2        | Mouse    | 15    | Ravi     | Delhi
-- One value per cell. Still redundant.`,
      },
      { type: 'heading3', text: '2NF — remove partial dependencies' },
      {
        type: 'paragraph',
        text: 'The key is (order_id, product). But `customer` depends only on `order_id`, and `price` depends only on `product` — partial dependencies. Move them to tables keyed by just that part.',
      },
      {
        type: 'code',
        lang: 'sql',
        code: `CREATE TABLE products (product_id INT PRIMARY KEY, name TEXT, price NUMERIC);
CREATE TABLE orders   (order_id INT PRIMARY KEY, customer TEXT, customer_city TEXT);
CREATE TABLE order_items (
  order_id   INT REFERENCES orders(order_id),
  product_id INT REFERENCES products(product_id),
  quantity   INT,
  PRIMARY KEY (order_id, product_id)
);`,
      },
      { type: 'heading3', text: '3NF — remove transitive dependencies' },
      {
        type: 'paragraph',
        text: 'In `orders`, `customer_city` depends on `customer`, not on `order_id` (order_id → customer → city). Move customer data to its own table.',
      },
      {
        type: 'code',
        lang: 'sql',
        code: `CREATE TABLE customers (customer_id INT PRIMARY KEY, name TEXT, city TEXT);
CREATE TABLE orders (
  order_id    INT PRIMARY KEY,
  customer_id INT REFERENCES customers(customer_id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- Now Asha's city is stored once; changing it updates one row.`,
      },
      {
        type: 'bullets',
        items: [
          '**BCNF** is a stricter 3NF: every determinant must be a candidate key. Usually mentioned as a follow-up.',
          '**Denormalization** is deliberate: read-heavy systems copy data (e.g. store `price_at_purchase` on order_items — which is actually correct, since historical price must not change).',
          'OLTP systems are usually normalized to 3NF; analytics/warehouses often use denormalized star schemas.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: walk one table through 1NF → 2NF → 3NF and name the anomaly each step fixes. Then mention when you would denormalize on purpose — that shows practical judgement.',
      },
    ],
  },

  'What are SQL joins and when do you use each type?': {
    summary:
      'A join combines rows from two tables based on a related column. INNER JOIN returns only matching rows; LEFT/RIGHT JOIN keep all rows from one side with NULLs where there is no match; FULL OUTER JOIN keeps all rows from both; CROSS JOIN gives every combination; a SELF JOIN joins a table to itself. Pick based on whether unmatched rows must appear in the result.',
    details: [
      {
        type: 'paragraph',
        text: 'Use these two tables for all examples: `customers` (1 Asha, 2 Ravi, 3 Meera) and `orders` (101 → customer 1, 102 → customer 1, 103 → customer 2, 104 → customer 99 — an orphan).',
      },
      { type: 'heading3', text: 'INNER JOIN — only matches' },
      {
        type: 'code',
        lang: 'sql',
        code: `SELECT c.name, o.id AS order_id
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;
-- Asha 101 | Asha 102 | Ravi 103
-- Meera (no orders) and order 104 (no customer) are excluded`,
      },
      { type: 'heading3', text: 'LEFT JOIN — all from the left, matches from the right' },
      {
        type: 'code',
        lang: 'sql',
        code: `SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
-- Asha 101 | Asha 102 | Ravi 103 | Meera NULL

-- Classic use: find customers with NO orders (anti-join)
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;            -- → Meera`,
      },
      { type: 'heading3', text: 'SELF JOIN and CROSS JOIN' },
      {
        type: 'code',
        lang: 'sql',
        code: `-- SELF JOIN: employees with their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;

-- CROSS JOIN: every size × every colour (cartesian product)
SELECT s.size, c.colour
FROM sizes s CROSS JOIN colours c;   -- 3 sizes × 4 colours = 12 rows`,
      },
      {
        type: 'bullets',
        items: [
          '**INNER** — "give me orders with their customer" (both must exist).',
          '**LEFT** — "all customers, with orders if any" — dashboards, optional relations, anti-joins.',
          '**RIGHT** — mirror of LEFT; most teams rewrite it as LEFT by swapping table order for readability.',
          '**FULL OUTER** — reconciliation: find rows missing on either side (e.g. compare two data sources).',
          '**CROSS** — generate combinations (variants, calendars); dangerous by accident on large tables.',
          '**SELF** — hierarchical data (manager/employee, category/parent).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Common pitfall: putting a filter on the right table in `WHERE` turns a LEFT JOIN into an INNER JOIN (`WHERE o.status = 'paid'` drops customers whose `o.*` is NULL). Put that condition in the `ON` clause instead if you want to keep unmatched rows.",
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?',
      },
      {
        type: 'paragraph',
        text: 'INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table plus matches from the right (NULLs where none). FULL OUTER JOIN returns every row from both tables, matched where possible and NULL-filled on whichever side has no match.',
      },
      {
        type: 'code',
        lang: 'sql',
        code: `-- users:  (1, 'Asha'), (2, 'Ravi'), (3, 'Meera')
-- orders: (101, user 1), (102, user 2), (103, user 99)   -- 99 does not exist

-- INNER JOIN → 2 rows
SELECT u.name, o.id FROM users u
INNER JOIN orders o ON o.user_id = u.id;
-- Asha | 101
-- Ravi | 102

-- LEFT JOIN → 3 rows (all users)
SELECT u.name, o.id FROM users u
LEFT JOIN orders o ON o.user_id = u.id;
-- Asha  | 101
-- Ravi  | 102
-- Meera | NULL

-- FULL OUTER JOIN → 4 rows (everything)
SELECT u.name, o.id FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id;
-- Asha  | 101
-- Ravi  | 102
-- Meera | NULL
-- NULL  | 103     ← orphan order`,
      },
      { type: 'heading3', text: 'When to use which' },
      {
        type: 'bullets',
        items: [
          '**INNER JOIN:** the relationship is required — e.g. invoice lines with their product.',
          '**LEFT JOIN:** the right side is optional — e.g. list all users with their last login, even if they never logged in.',
          '**FULL OUTER JOIN:** data reconciliation — e.g. compare a payment-provider export with your payments table and find records missing on either side.',
          '**MySQL** does not support FULL OUTER JOIN; emulate it with `LEFT JOIN ... UNION ... RIGHT JOIN`.',
        ],
      },
      {
        type: 'code',
        lang: 'sql',
        code: `-- Reconciliation: rows that exist only on one side
SELECT p.id AS ours, s.id AS provider
FROM payments p
FULL OUTER JOIN provider_settlements s ON s.payment_ref = p.ref
WHERE p.id IS NULL OR s.id IS NULL;`,
      },
    ],
  },

  'What are indexes in SQL and how do they work?': {
    summary:
      'An index is a separate data structure — usually a B-tree — that keeps column values sorted with pointers to the rows, so the database can find matching rows in O(log n) instead of scanning the whole table. Indexes speed up reads (WHERE, JOIN, ORDER BY) but cost disk space and slow down writes, because every INSERT/UPDATE/DELETE must also update each index.',
    details: [
      {
        type: 'paragraph',
        text: 'Like the index at the back of a book: instead of reading every page to find "transactions", you look it up alphabetically and jump to page 212. Without an index, `WHERE email = ...` on 10 million rows is a sequential scan; with a B-tree index it is a handful of page reads.',
      },
      { type: 'heading3', text: 'Creating and verifying an index' },
      {
        type: 'code',
        lang: 'sql',
        code: `-- Before: full table scan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'asha@example.com';
-- Seq Scan on users  (rows=10000000)  actual time=0.02..812.4 ms

CREATE INDEX idx_users_email ON users (email);
-- In production PostgreSQL, avoid long write locks:
-- CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'asha@example.com';
-- Index Scan using idx_users_email on users  actual time=0.03..0.05 ms`,
      },
      { type: 'heading3', text: 'Composite indexes and the left-prefix rule' },
      {
        type: 'code',
        lang: 'sql',
        code: `CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- ✅ Uses the index (leftmost column present)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20;

-- ✅ Uses both columns
SELECT * FROM orders WHERE user_id = 42 AND created_at > now() - interval '7 days';

-- ❌ Cannot use it efficiently — skips the leftmost column
SELECT * FROM orders WHERE created_at > now() - interval '7 days';`,
      },
      { type: 'heading3', text: 'Index types worth knowing' },
      {
        type: 'bullets',
        items: [
          "**B-tree** (default): equality, ranges, sorting, prefix `LIKE 'abc%'`.",
          '**Hash**: equality only.',
          '**GIN** (PostgreSQL): JSONB, arrays, full-text search.',
          '**Unique index**: enforces uniqueness as well as speeding lookups.',
          '**Partial index**: `CREATE INDEX ... WHERE deleted_at IS NULL` — smaller, targets hot rows.',
          '**Covering index**: `INCLUDE (col)` lets the DB answer from the index alone (index-only scan).',
        ],
      },
      {
        type: 'flow',
        title: 'B-tree lookup for email = "m..."',
        code: `flowchart TD
  ROOT["Root page<br/>a..f | g..p | q..z"]:::highlight --> B["Branch page<br/>g..k | l..p"]:::server
  B --> L["Leaf page<br/>mary@ → row ptr<br/>meera@ → row ptr"]:::cache
  L --> ROW[("Heap / table row")]:::db`,
        text: 'Each level narrows the search; a table with millions of rows is typically only 3–4 levels deep.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfalls: wrapping an indexed column in a function (`WHERE LOWER(email) = ...`) prevents index use unless you create an expression index; low-selectivity columns (e.g. boolean `is_active`) rarely benefit; and every extra index slows writes. Always confirm with `EXPLAIN ANALYZE`.',
      },
    ],
  },

  'What is the difference between clustered and non-clustered indexes?': {
    summary:
      "A clustered index determines the physical order of the table's rows — the table data itself is stored in the index's leaf pages, so there can be only one per table (usually the primary key). A non-clustered (secondary) index is a separate structure whose leaves hold the key plus a pointer (row id or primary key) back to the row, so a lookup may need an extra hop; a table can have many.",
    details: [
      {
        type: 'paragraph',
        text: 'Analogy: a phone book is clustered by last name — the data itself is in that order. The index at the back of a textbook is non-clustered — it lists topics in order and points to pages elsewhere.',
      },
      { type: 'heading3', text: 'How major databases implement it' },
      {
        type: 'bullets',
        items: [
          '**MySQL InnoDB:** the table IS a clustered B-tree on the primary key. Secondary indexes store the primary key value, so a secondary lookup = secondary index → PK → clustered index (a "double lookup").',
          '**SQL Server:** you choose the clustered index explicitly (`CREATE CLUSTERED INDEX`); defaults to the PK.',
          '**PostgreSQL:** tables are heaps — all indexes are effectively non-clustered. The `CLUSTER` command reorders the table once but the order is not maintained on later writes.',
        ],
      },
      {
        type: 'code',
        lang: 'sql',
        code: `-- SQL Server
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
--   1) search idx_customer → finds PK values
--   2) search clustered PK index → reads full rows`,
      },
      {
        type: 'flow',
        title: 'Lookup via a secondary index (InnoDB)',
        code: `flowchart LR
  Q["WHERE customer_id = 7"]:::client --> NC["Non-clustered index<br/>customer_id → PK"]:::cache
  NC -->|"PK = 1043"| CL["Clustered index<br/>PK → full row"]:::db
  CL --> R["Row data returned"]:::server`,
      },
      {
        type: 'bullets',
        items: [
          'Range scans on the clustered key are very fast (rows are adjacent on disk).',
          'Choose a narrow, ever-increasing clustered key (auto-increment / time-ordered ID). Random UUIDv4 keys cause page splits and fragmentation — prefer UUIDv7 or ULID if you need UUIDs.',
          'A wide primary key bloats every secondary index in InnoDB, because each one stores the PK.',
          'Covering indexes (`INCLUDE` or extra columns) avoid the second hop entirely.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "one clustered, many non-clustered", then show depth by explaining the InnoDB double lookup and noting that PostgreSQL does not maintain clustered tables — interviewers like the database-specific nuance.',
      },
    ],
  },

  'What are database transaction isolation levels?': {
    summary:
      "Isolation levels define how much concurrent transactions can see of each other's uncommitted or newly committed changes. The SQL standard defines four — READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE — each preventing more anomalies (dirty reads, non-repeatable reads, phantom reads) at the cost of more locking, retries or lower concurrency.",
    details: [
      {
        type: 'paragraph',
        text: 'The "I" in ACID. Perfect isolation (running transactions one at a time) is slow, so databases let you choose a trade-off. Defaults: PostgreSQL, SQL Server and Oracle use READ COMMITTED; MySQL InnoDB uses REPEATABLE READ.',
      },
      { type: 'heading3', text: 'The anomalies' },
      {
        type: 'bullets',
        items: [
          "**Dirty read:** you read another transaction's uncommitted change, which may later roll back.",
          '**Non-repeatable read:** you read a row twice and get different values because someone committed an update in between.',
          '**Phantom read:** you run the same range query twice and new rows appear because someone inserted matching rows.',
          '**Lost update / write skew:** two transactions read, then both write based on stale reads — only SERIALIZABLE (or explicit locking) fully prevents write skew.',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `Level              | Dirty read | Non-repeatable | Phantom
-------------------+------------+----------------+---------
READ UNCOMMITTED   | possible   | possible       | possible
READ COMMITTED     | prevented  | possible       | possible
REPEATABLE READ    | prevented  | prevented      | possible*
SERIALIZABLE       | prevented  | prevented      | prevented

* PostgreSQL's REPEATABLE READ (snapshot isolation) also prevents phantoms;
  PostgreSQL treats READ UNCOMMITTED as READ COMMITTED.`,
      },
      { type: 'heading3', text: 'Setting it from Node.js (node-postgres)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Pool } from 'pg';
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
    // SERIALIZABLE may abort with SQLSTATE 40001 — the caller should retry
    if (err.code === '40001') return transfer(from, to, amount);
    throw err;
  } finally {
    client.release();
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          'A common alternative to SERIALIZABLE for counters/balances: `SELECT ... FOR UPDATE` (pessimistic row lock) or an atomic `UPDATE ... SET balance = balance - $1 WHERE balance >= $1`.',
          'Optimistic concurrency: a `version` column checked in the `UPDATE ... WHERE version = $n`.',
          'Higher isolation → more serialization failures/deadlocks → your code must retry.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name the three anomalies, map them to the levels, and give a concrete example (double-spending a balance). Mentioning that SERIALIZABLE requires retry logic shows production experience.',
      },
    ],
  },

  'What is a stored procedure?': {
    summary:
      'A stored procedure is a named block of SQL (plus procedural logic like variables, loops and conditionals) stored and executed inside the database server. It lets you run multi-step logic close to the data in one round trip, encapsulate business rules and grant permission to the procedure instead of the underlying tables — at the cost of logic that is harder to version, test and port.',
    details: [
      {
        type: 'paragraph',
        text: 'Instead of the application sending five SQL statements over the network, it calls one procedure and the database runs them all locally. In PostgreSQL there are both functions (`CREATE FUNCTION`, return a value, usable in SELECT) and procedures (`CREATE PROCEDURE`, invoked with `CALL`, can manage transactions with COMMIT/ROLLBACK inside since PostgreSQL 11).',
      },
      { type: 'heading3', text: 'Example (PostgreSQL PL/pgSQL)' },
      {
        type: 'code',
        lang: 'sql',
        code: `CREATE OR REPLACE PROCEDURE transfer_funds(
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

CALL transfer_funds(1, 2, 100.00);`,
      },
      { type: 'heading3', text: 'Calling it from Node.js' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Pool } from 'pg';
const pool = new Pool();

await pool.query('CALL transfer_funds($1, $2, $3)', [1, 2, 100]);
// Parameters are bound — no SQL injection risk

// MySQL (mysql2): await conn.query('CALL transfer_funds(?, ?, ?)', [1, 2, 100]);`,
      },
      {
        type: 'bullets',
        items: [
          '**Pros:** fewer round trips, logic next to the data, consistent rules for every client app, fine-grained permissions (`GRANT EXECUTE`), plans can be reused.',
          '**Cons:** business logic split between app and DB, harder unit testing and code review, vendor lock-in (PL/pgSQL vs T-SQL vs PL/SQL), harder to scale (DB CPU is the most expensive CPU), deployment needs migrations.',
          '**Good fits:** bulk data processing, complex reporting, enforcing invariants that every client must obey, legacy systems where the DB is the integration point.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give a balanced view — most Node.js teams keep business logic in the service layer and use procedures selectively for data-heavy operations. Mention that procedures should still live in version-controlled migrations.',
      },
    ],
  },

  'What is an ORM? What are the advantages and disadvantages of using one?': {
    summary:
      'An ORM (Object-Relational Mapper) maps database tables to classes/objects so you work with entities and methods instead of raw SQL — e.g. Prisma, TypeORM, Sequelize, MikroORM in Node.js. It speeds up development and adds type safety, migrations and portability, but it can hide inefficient queries (N+1, over-fetching), make complex SQL awkward, and add a learning/abstraction layer.',
    details: [
      {
        type: 'paragraph',
        text: 'There is a spectrum: raw driver (`pg`, `mysql2`) → query builder (Knex, Kysely, Drizzle) → full ORM (Prisma, TypeORM, Sequelize). The further right, the more the tool writes SQL for you.',
      },
      { type: 'heading3', text: 'Same query three ways' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// 1) Raw driver — full control, manual mapping
const { rows } = await pool.query(
  'SELECT id, name FROM users WHERE active = $1 ORDER BY created_at DESC LIMIT 10',
  [true],
);

// 2) Query builder (Kysely) — typed SQL, still SQL-shaped
const users = await db.selectFrom('users')
  .select(['id', 'name'])
  .where('active', '=', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute();

// 3) ORM (Prisma) — entity-shaped, relations included
const users2 = await prisma.user.findMany({
  where: { active: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  select: { id: true, name: true, posts: { select: { title: true } } },
});`,
      },
      { type: 'heading3', text: 'Advantages' },
      {
        type: 'bullets',
        items: [
          'Faster development for CRUD; less boilerplate mapping rows to objects.',
          'Type safety (Prisma/Drizzle generate types from the schema).',
          'Parameterized queries by default — protects against SQL injection.',
          'Migrations, relations, validation and transactions in one tool.',
          'Some portability between databases.',
        ],
      },
      { type: 'heading3', text: 'Disadvantages' },
      {
        type: 'bullets',
        items: [
          'Hidden performance problems: N+1 queries via lazy relations, `SELECT *` over-fetching.',
          'Complex queries (window functions, CTEs, bulk upserts) are awkward — you fall back to raw SQL anyway.',
          'Abstraction leaks: you still need to understand SQL, indexes and transactions.',
          'Runtime overhead and sometimes large dependencies.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Escape hatch when the ORM gets in the way (Prisma, still parameterized)
const top = await prisma.$queryRaw\`
  SELECT user_id, SUM(total) AS spent,
         RANK() OVER (ORDER BY SUM(total) DESC) AS rnk
  FROM orders
  GROUP BY user_id
  LIMIT \${limit}\`;`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a strong answer is "ORM for 80% CRUD, raw SQL/query builder for hot paths and reports, and always log the generated SQL in development". Name a tool you have used and a time it produced a bad query.',
      },
    ],
  },

  'What is the N+1 query problem and how do you fix it?': {
    summary:
      "N+1 happens when you run 1 query to fetch a list of N parent rows and then 1 extra query per row to load a relation — N+1 round trips instead of 1 or 2. Fix it by fetching the related data in bulk: a JOIN, an `IN (...)` query, the ORM's eager loading (`include`/`relations`/`populate`), or batching with DataLoader in GraphQL.",
    details: [
      {
        type: 'paragraph',
        text: 'Each query may only take 2 ms, but 1 + 500 queries = 1 second plus connection-pool pressure. It is easy to miss because the code looks innocent — especially with ORM lazy loading or GraphQL field resolvers.',
      },
      { type: 'heading3', text: 'The problem' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// ❌ 1 query for posts + 1 query PER post for its author
const posts = await db.query('SELECT * FROM posts LIMIT 100');      // 1
for (const post of posts.rows) {
  const author = await db.query(
    'SELECT * FROM users WHERE id = $1', [post.author_id]);           // +100
  post.author = author.rows[0];
}
// Total: 101 queries`,
      },
      { type: 'heading3', text: 'Fix 1 — a JOIN (1 query)' },
      {
        type: 'code',
        lang: 'sql',
        code: `SELECT p.*, u.name AS author_name
FROM posts p
JOIN users u ON u.id = p.author_id
LIMIT 100;`,
      },
      { type: 'heading3', text: 'Fix 2 — batch with IN / ANY (2 queries)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `const { rows: posts } = await db.query('SELECT * FROM posts LIMIT 100');
const ids = [...new Set(posts.map(p => p.author_id))];
const { rows: users } = await db.query(
  'SELECT * FROM users WHERE id = ANY($1)', [ids]);
const byId = new Map(users.map(u => [u.id, u]));
posts.forEach(p => (p.author = byId.get(p.author_id)));
// Total: 2 queries regardless of N`,
      },
      { type: 'heading3', text: 'Fix 3 — ORM eager loading and DataLoader' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Prisma
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
// resolver: author: (post) => authorLoader.load(post.author_id)`,
      },
      {
        type: 'flow',
        title: 'N+1 vs batched loading',
        code: `sequenceDiagram
  participant App
  participant DB
  Note over App,DB: N+1 (101 round trips)
  App->>DB: SELECT posts LIMIT 100
  loop each post
    App->>DB: SELECT user WHERE id = ?
  end
  Note over App,DB: Batched (2 round trips)
  App->>DB: SELECT posts LIMIT 100
  App->>DB: SELECT users WHERE id = ANY(ids)`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain how you would DETECT it — enable query logging in dev, count queries per request in tests or APM traces (many identical queries with different IDs is the signature), then pick JOIN vs batch depending on data size.',
      },
    ],
  },
};
