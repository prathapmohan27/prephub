var e={"unit-vs-integration-vs-end-to-end-tests":{summary:`A unit test checks one small piece of logic (a function or class) in isolation, with dependencies mocked — fast and precise. An integration test checks that several real pieces work together, such as a route + service + real test database. An end-to-end test drives the whole running system the way a user or client would — the most realistic, but slowest and most brittle.`,details:[{type:`paragraph`,text:`The three levels trade **speed and precision** against **realism and confidence**. A healthy suite has many unit tests, a solid layer of integration tests, and a few end-to-end tests for critical journeys — the "testing pyramid" (some teams prefer the "testing trophy", which puts more weight on integration tests).`},{type:`heading3`,text:`Same feature, three levels`},{type:`code`,lang:`javascript`,code:`// UNIT \u2014 pure logic, no I/O
test('calculateTotal applies 10% discount over 100', () => {
  expect(calculateTotal([{ price: 60 }, { price: 60 }])).toBe(108);
});

// INTEGRATION \u2014 real Express app + real (test) database, no network to outside
test('POST /orders stores the order', async () => {
  const res = await request(app).post('/orders').send({ items: [{ sku: 'A1', qty: 2 }] });
  expect(res.status).toBe(201);
  expect(await db.order.count()).toBe(1);
});

// END-TO-END \u2014 deployed stack, real browser/client (Playwright)
test('user can check out', async ({ page }) => {
  await page.goto('https://staging.shop.com');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'Checkout' }).click();
  await expect(page.getByText('Order confirmed')).toBeVisible();
});`},{type:`bullets`,items:[`**Unit:** milliseconds each, pinpoints the broken function, but can pass while the pieces fail to fit together.`,`**Integration:** catches wrong SQL, broken middleware order, serialization bugs. Use Docker/Testcontainers for a real DB; mock only third-party APIs.`,`**E2E:** proves the system works end to end (UI, API, DB, auth). Slow, flaky if not written carefully, expensive to debug — keep them for critical paths like login and checkout.`,`Contract tests (e.g. Pact) sit between integration and E2E for microservices: they verify a consumer and provider agree on an API without deploying both.`]},{type:`flow`,title:`The testing pyramid`,code:`flowchart TB
  E["E2E \u2014 few<br/>slow, realistic"]:::highlight --> I["Integration \u2014 some<br/>real DB, real HTTP layer"]:::server
  I --> U["Unit \u2014 many<br/>fast, isolated, mocked deps"]:::db`,text:`Moving up: more confidence per test, but slower and costlier to maintain.`},{type:`callout`,variant:`tip`,text:`Interview tip: give the trade-off, not just definitions — "unit tests tell me where it broke, E2E tests tell me that it broke" — and describe the ratio your team used and why.`}]},"node-js-testing-frameworks":{summary:"Jest is the most widely used all-in-one framework (runner, assertions, mocks, coverage). Vitest is a fast Jest-compatible alternative popular with ESM/TypeScript and Vite projects. Mocha + Chai + Sinon is the classic modular stack, and Node now has a built-in runner, `node:test`. Supertest is used for HTTP testing and Playwright/Cypress for end-to-end tests.",details:[{type:`heading3`,text:`The main options`},{type:`bullets`,items:["**Jest** — batteries included: `describe/test/expect`, module mocking, fake timers, snapshots, coverage, parallel workers. Needs config (e.g. `ts-jest` or SWC) for TypeScript and native ESM.",`**Vitest** — Jest-like API, very fast, native ESM and TypeScript out of the box via Vite/esbuild. Good choice for new projects.`,`**Mocha** — flexible runner; you add **Chai** (assertions) and **Sinon** (spies/stubs/mocks). Common in older codebases.`,"**node:test** — built into Node (stable since Node 20) with `node --test`, `assert`, mocking and coverage — zero dependencies.",`**Supertest** — sends requests to an Express/Fastify app in-process for route tests.`,`**Playwright / Cypress** — browser E2E. **Pact** — consumer-driven contract tests. **Testcontainers** — real databases in Docker for integration tests.`]},{type:`heading3`,text:`Same test in Jest and node:test`},{type:`code`,lang:`javascript`,code:`// Jest / Vitest
import { sum } from './math.js';
describe('sum', () => {
  test('adds numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});

// Built-in node:test  (run with: node --test)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sum } from './math.js';
describe('sum', () => {
  it('adds numbers', () => {
    assert.equal(sum(2, 3), 5);
  });
});`},{type:`code`,lang:`json`,code:`{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:node": "node --test --experimental-test-coverage"
  }
}`},{type:`callout`,variant:`tip`,text:`Interview tip: name what you used and why — e.g. "Jest with Supertest for API tests and Testcontainers for Postgres; we were evaluating Vitest for faster ESM support". A reasoned choice beats a list of names.`}]},"test-async-code-in-jest":{summary:"Make Jest wait for the async work to finish: use an `async` test with `await` (preferred), or return the promise, and use `.resolves` / `.rejects` for promise assertions. For callback APIs use the `done` argument, and for timers use fake timers (`jest.useFakeTimers()`). If Jest does not wait, the test passes before the assertion runs.",details:[{type:`paragraph`,text:"Jest considers a test finished when the test function returns — unless it returns a promise or takes a `done` callback. The classic bug is forgetting `await`/`return`, so the assertion runs after the test already passed (or throws in a later test)."},{type:`heading3`,text:`Promises and async/await`},{type:`code`,lang:`javascript`,code:`// \u2705 async/await (preferred)
test('fetchUser returns the user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Asha');
});

// \u2705 .resolves / .rejects \u2014 remember to await (or return) them
test('fetchUser rejects for unknown id', async () => {
  await expect(fetchUser(999)).rejects.toThrow('Not found');
});

// \u2705 return the promise
test('returning a promise also works', () => {
  return fetchUser(1).then((u) => expect(u.id).toBe(1));
});

// \u274C BUG: no await/return \u2014 test passes even if fetchUser fails
test('broken', () => {
  fetchUser(1).then((u) => expect(u.name).toBe('WRONG'));
});`},{type:`heading3`,text:`Callbacks and events`},{type:`code`,lang:`javascript`,code:`test('readConfig calls back with data', (done) => {
  readConfig('app.json', (err, data) => {
    try {
      expect(err).toBeNull();
      expect(data.port).toBe(3000);
      done();
    } catch (e) {
      done(e); // report assertion failure instead of a timeout
    }
  });
});

// Simpler: wrap events in a promise
import { once } from 'node:events';
test('emits ready', async () => {
  const server = startServer();
  await once(server, 'ready');
});`},{type:`heading3`,text:`Timers`},{type:`code`,lang:`javascript`,code:`jest.useFakeTimers();

test('retries after 1s', async () => {
  const fn = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');
  const p = retryWithDelay(fn, 1000);
  await jest.advanceTimersByTimeAsync(1000); // no real waiting
  await expect(p).resolves.toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});`},{type:`bullets`,items:["`expect.assertions(n)` guarantees n assertions ran — useful in try/catch style tests.","Default timeout is 5 s; change per test with `test(name, fn, 10000)` or `jest.setTimeout`.","Don't mix `done` and `async` in the same test.",'"Jest did not exit" usually means an open handle (DB connection, server) — close it in `afterAll`, debug with `--detectOpenHandles`.']},{type:`callout`,variant:`warning`,text:"Common pitfall: `expect(promise).rejects.toThrow()` without `await` — the test always passes. Lint rules like `jest/valid-expect` catch this."},{type:`divider`},{type:`heading3`,text:`Follow-up: How do you write unit tests for async functions in Jest?`},{type:`paragraph`,text:"Isolate the async function by mocking its I/O dependencies (DB, HTTP, queue) with `jest.fn().mockResolvedValue()` / `mockRejectedValue()`, then `await` the function in an `async` test and assert both the result and how the dependencies were called. Cover the success path, the error path and edge cases like empty results."},{type:`heading3`,text:`Function under test`},{type:`code`,lang:`typescript`,code:`// user.service.ts
export function createUserService(deps: { repo: UserRepo; mailer: Mailer }) {
  return {
    async register(email: string) {
      if (await deps.repo.findByEmail(email)) {
        throw new Error('Email already registered');
      }
      const user = await deps.repo.create({ email });
      await deps.mailer.sendWelcome(user.email);
      return user;
    },
  };
}`},{type:`heading3`,text:`Tests: success, failure, dependency errors`},{type:`code`,lang:`typescript`,code:`describe('register', () => {
  const repo = { findByEmail: jest.fn(), create: jest.fn() };
  const mailer = { sendWelcome: jest.fn() };
  const service = createUserService({ repo, mailer } as any);

  beforeEach(() => jest.clearAllMocks());

  it('creates the user and sends a welcome mail', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 1, email: 'a@x.com' });
    mailer.sendWelcome.mockResolvedValue(undefined);

    const user = await service.register('a@x.com');

    expect(user).toEqual({ id: 1, email: 'a@x.com' });
    expect(repo.create).toHaveBeenCalledWith({ email: 'a@x.com' });
    expect(mailer.sendWelcome).toHaveBeenCalledWith('a@x.com');
  });

  it('rejects duplicate emails and never creates', async () => {
    repo.findByEmail.mockResolvedValue({ id: 9 });

    await expect(service.register('a@x.com')).rejects.toThrow('already registered');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('propagates database errors', async () => {
    repo.findByEmail.mockRejectedValue(new Error('DB down'));
    await expect(service.register('a@x.com')).rejects.toThrow('DB down');
  });
});`},{type:`bullets`,items:["Arrange → Act → Assert: set mock return values, `await` the call, assert result + interactions.",'`mockResolvedValueOnce` chains let you simulate "fails once, then succeeds" for retry logic.',"Reset mocks between tests (`clearAllMocks` or `clearMocks: true` in config) so state does not leak.","Test parallel logic (`Promise.all`) by checking all calls were made and that one rejection fails the whole call.",`Don't over-assert implementation details; assert behaviour that matters (result, side effects).`]}]},"mock-modules-in-jest":{summary:'Use `jest.fn()` for standalone mock functions, `jest.spyOn(obj, "method")` to watch or override one method of a real object, and `jest.mock("module")` to replace a whole module (auto-mocked or with a factory). Prefer injecting dependencies so tests can pass fakes without module mocking, and restore mocks between tests.',details:[{type:`heading3`,text:`1. jest.fn — a fake function`},{type:`code`,lang:`javascript`,code:`const sendEmail = jest.fn().mockResolvedValue({ ok: true });

await notify(user, sendEmail);

expect(sendEmail).toHaveBeenCalledTimes(1);
expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));`},{type:`heading3`,text:`2. jest.mock — replace a whole module`},{type:`code`,lang:`javascript`,code:`// payment.service.js imports: import axios from 'axios';
import axios from 'axios';
import { charge } from './payment.service.js';

jest.mock('axios'); // hoisted above imports; every export becomes a jest.fn()

test('charge posts to the gateway', async () => {
  axios.post.mockResolvedValue({ data: { id: 'ch_1', status: 'paid' } });

  const result = await charge(500);

  expect(result.status).toBe('paid');
  expect(axios.post).toHaveBeenCalledWith('/charges', { amount: 500 });
});

// Factory: control exactly what the module exports
jest.mock('./db.js', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

// Partial mock: keep the real module, override one export
jest.mock('./utils.js', () => ({
  ...jest.requireActual('./utils.js'),
  now: jest.fn(() => new Date('2025-01-01')),
}));`},{type:`heading3`,text:`3. jest.spyOn — observe or override a real method`},{type:`code`,lang:`javascript`,code:`const spy = jest.spyOn(logger, 'error').mockImplementation(() => {}); // silence + record

await handler(badRequest);

expect(spy).toHaveBeenCalledWith(expect.stringContaining('invalid'));
spy.mockRestore(); // put the original back

// Time and randomness
jest.useFakeTimers().setSystemTime(new Date('2025-01-01'));
jest.spyOn(Math, 'random').mockReturnValue(0.5);`},{type:`bullets`,items:["`mockClear` resets call history; `mockReset` also removes implementations; `mockRestore` restores the original (spies only). Config flags `clearMocks`/`restoreMocks` do this automatically.","`jest.mock` calls are hoisted, so a factory can't use outer variables unless their names start with `mock`.","With native ESM, use `jest.unstable_mockModule` + dynamic `import()`; Vitest's `vi.mock` handles ESM natively.","For HTTP, `nock` or MSW intercept requests at the network level instead of mocking the client library.",`Mock at the boundaries (DB, HTTP, clock, filesystem), not your own internal functions — heavy mocking makes tests pass while the real code is broken.`]},{type:`callout`,variant:`warning`,text:"Common pitfall: mocks leaking between tests because they were never reset, causing tests that pass alone but fail in the full suite. Enable `restoreMocks: true` in Jest config."}]},"test-express-routes-with-supertest":{summary:'Export the Express `app` separately from the `app.listen()` call, then pass it to Supertest: `await request(app).get("/users").expect(200)`. Supertest runs the app on an ephemeral port in-process, so you test real routing, middleware, validation and status codes without starting a server. Mock external services or use a test database.',details:[{type:`heading3`,text:`Structure the app for testing`},{type:`code`,lang:`javascript`,code:`// app.js \u2014 build the app, don't listen
import express from 'express';
import { usersRouter } from './users.router.js';

export const app = express();
app.use(express.json());
app.use('/users', usersRouter);
app.use((err, _req, res, _next) => res.status(err.status ?? 500).json({ error: err.message }));

// server.js \u2014 only this file listens
import { app } from './app.js';
app.listen(process.env.PORT ?? 3000);`},{type:`heading3`,text:`Route tests`},{type:`code`,lang:`javascript`,code:`import request from 'supertest';
import { app } from '../app.js';
import * as userRepo from '../user.repo.js';

jest.mock('../user.repo.js');

describe('GET /users/:id', () => {
  it('returns 200 with the user', async () => {
    userRepo.findById.mockResolvedValue({ id: 1, name: 'Asha' });

    const res = await request(app).get('/users/1').expect('Content-Type', /json/).expect(200);

    expect(res.body).toEqual({ id: 1, name: 'Asha' });
  });

  it('returns 404 when missing', async () => {
    userRepo.findById.mockResolvedValue(null);
    await request(app).get('/users/42').expect(404);
  });
});

describe('POST /users', () => {
  it('validates the body', async () => {
    const res = await request(app).post('/users').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
  });

  it('requires auth', async () => {
    await request(app)
      .post('/users')
      .set('Authorization', 'Bearer invalid')
      .send({ name: 'Ravi' })
      .expect(401);
  });
});`},{type:`bullets`,items:[`Assert status, headers and body; test the unhappy paths — 400 validation, 401/403 auth, 404, 500 from a failing dependency.`,"For integration tests, skip `jest.mock` and use a real test DB (Docker/Testcontainers), resetting data in `beforeEach` and closing connections in `afterAll`.","Use `request.agent(app)` to keep cookies across requests (login, then call a protected route).","Supertest works with Fastify (`app.server` after `ready()`) and NestJS (`app.getHttpServer()`) as well."]},{type:`callout`,variant:`tip`,text:`Interview tip: the "separate app from listen" detail is what interviewers look for — it shows you have actually wired this up, and it avoids port conflicts when tests run in parallel.`}]},"measure-test-coverage":{summary:"Test coverage measures which parts of the code ran during tests — statements, branches, functions and lines. In Node you measure it with `jest --coverage` (Istanbul or V8 provider), `vitest --coverage`, `c8`/`nyc`, or `node --test --experimental-test-coverage`, and enforce minimum thresholds in CI. High coverage shows what was executed, not that it was verified correctly.",details:[{type:`heading3`,text:`The four metrics`},{type:`bullets`,items:[`**Statements** — % of statements executed.`,"**Branches** — % of `if/else`, ternary, `&&`/`||`, `switch` paths taken. Usually the most revealing metric.",`**Functions** — % of functions called at least once.`,`**Lines** — % of executable lines run.`]},{type:`code`,lang:`javascript`,code:`function shippingCost(order) {
  if (order.total > 100) return 0;      // branch A
  return order.express ? 15 : 5;        // branches B and C
}

test('free shipping over 100', () => {
  expect(shippingCost({ total: 150 })).toBe(0);
});
// Lines: ~67% \xB7 Branches: 1 of 3 paths (33%)
// Express and standard shipping were never tested.`},{type:`heading3`,text:`Measuring and enforcing it`},{type:`code`,lang:`javascript`,code:`// jest.config.js
module.exports = {
  collectCoverage: false,            // enable with: jest --coverage
  coverageProvider: 'v8',            // or 'babel' (Istanbul instrumentation)
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.d.ts', '!src/main.ts'],
  coverageReporters: ['text', 'lcov', 'html'], // html report in coverage/lcov-report
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 85, statements: 85 },
  },
};`},{type:`code`,lang:`bash`,code:`npx jest --coverage
# ----------------|---------|----------|---------|---------|
# File            | % Stmts | % Branch | % Funcs | % Lines |
# shipping.js     |   66.67 |    33.33 |     100 |   66.67 |
# Jest: "global" coverage threshold for branches (80%) not met: 33.33%

npx c8 node --test           # V8 coverage for any runner
npx vitest run --coverage`},{type:`bullets`,items:["Fail CI when thresholds drop, and upload `lcov` to Codecov/SonarQube to show coverage on pull requests.",`Aim for a sensible target (often 70–90%) and focus on critical business logic, not 100% everywhere.`,"`collectCoverageFrom` matters: without it, files never imported by any test do not appear at all, inflating the number.",`Mutation testing (e.g. Stryker) checks whether tests actually catch bugs — a stronger quality signal than coverage.`]},{type:`callout`,variant:`warning`,text:`Common pitfall: treating coverage as quality. A test that calls a function with no assertions gives 100% coverage and zero protection. Say this in the interview.`}]},"testing-strategy-for-a-node-api":{summary:`I put pure business rules (pricing, validation, state transitions) in fast unit tests with no I/O. Most of my confidence comes from integration tests that send real HTTP requests through the app to a real database in a container, because that is where Node services actually break. Contract tests pin the API shape between the service and its consumers, and a few end-to-end smoke tests run after deploy. I decide by risk and cost, not by a fixed pyramid ratio.`,details:[{type:`heading3`,text:`Where each kind of test earns its place`},{type:`bullets`,items:[`**Unit**: pure functions and domain classes: price calculation, permission rules, retry policy, mapping errors to status codes. No database, no HTTP, no mocks needed if the code is designed with a pure core. Milliseconds each.`,`**Integration (the bulk for an API)**: route → middleware → validation → service → repository → real MongoDB/Postgres in a container. Catches wrong queries, missing indexes for unique constraints, transaction bugs, serialization and auth middleware order.`,`**Contract**: the request/response shapes consumers depend on (the Angular app, other services, webhook receivers). Fails the build when a field is renamed or a status code changes.`,`**End-to-end / smoke**: a handful of critical journeys (login, checkout) against a deployed environment, run after deploy. Few, because they are slow and flaky.`]},{type:`paragraph`,text:`For a typical CRUD-heavy API the shape is closer to a "testing trophy" than a pyramid: a modest unit layer, a thick integration layer, thin contract and end-to-end layers. For a service with heavy domain logic (pricing engine, scheduling) the unit layer grows.`},{type:`heading3`,text:`An integration test that tests behaviour, not wiring`},{type:`code`,lang:`typescript`,code:`import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/app';
import { testDb, resetDb, seedUser } from './helpers/db';

describe('POST /orders', () => {
  const app = buildApp({ db: testDb() });

  beforeEach(resetDb);

  it('creates an order and returns 201 with a Location header', async () => {
    const { token } = await seedUser({ role: 'customer' });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer ' + token)
      .send({ items: [{ sku: 'KB-01', qty: 2 }] })
      .expect(201);

    expect(res.headers.location).toMatch(/^\\/orders\\//);
    expect(res.body.total).toBe(8000); // minor units
  });

  it('rejects an unknown SKU with a Problem Details 422', async () => {
    const { token } = await seedUser({ role: 'customer' });
    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer ' + token)
      .send({ items: [{ sku: 'NOPE', qty: 1 }] })
      .expect(422);
    expect(res.body.type).toBe('/problems/unknown-sku');
  });
});`},{type:`heading3`,text:`Rules I apply to the whole suite`},{type:`numbered`,items:[`Test through public interfaces (HTTP, the service API), not private methods, so refactors do not break tests.`,"Mock only what I do not own and cannot run locally: payment providers, email, third-party APIs. Use a fake server (e.g. `msw` or `nock`) at the HTTP boundary rather than mocking my own modules.",`Every test sets up its own data and does not depend on order. Parallel runs must be safe.`,`Each bug fix gets a regression test at the lowest level that reproduces it.`,`Coverage is a smell detector, not a target: I look at uncovered branches in risky code, not the overall percentage.`]},{type:`callout`,variant:`tip`,text:`A quick health check for a suite: if a harmless refactor (renaming a private function, splitting a service) breaks many tests, the tests are coupled to implementation details. If a real bug in a query ships with a green build, the integration layer is too thin.`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`What do you mock and what do you never mock? (Mock third parties at the network boundary; never mock your own database layer in integration tests.)`,`How do you keep integration tests fast? (One container per worker, truncate between tests, run in parallel, no sleeps.)`,`Where do authorization rules get tested? (Unit tests for the policy, plus integration tests for "user A cannot read user B's order".)`,`How many end-to-end tests is enough? (Only the journeys whose failure costs money or trust; everything else lower down.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Unit-testing controllers with every dependency mocked: lots of tests, little confidence.`,`Treating 90% coverage as the goal and writing assertion-free tests to reach it.`,`No negative cases: no tests for 401/403/404/409/422 paths, which is where APIs leak data.`,`Shared fixtures that tests mutate, so results depend on execution order.`]},{type:`callout`,variant:`important`,text:`Senior signal: you choose test types by risk and feedback speed, explain why integration tests carry most of the weight for an I/O-heavy Node service, test authorization and error paths explicitly, and treat brittle, implementation-coupled tests as a cost, not as safety.`}]},"real-database-vs-mocks-in-tests":{summary:"Yes, for anything that touches queries I use the real database engine, ideally the same major version as production, started with Testcontainers. In-memory substitutes such as `mongodb-memory-server` are a reasonable compromise when Docker is not available, and SQLite pretending to be Postgres is a trap. Mocking the repository is fine for unit-testing business rules, but it cannot catch a wrong query, a missing unique index or a transaction bug.",details:[{type:`heading3`,text:`The three options`},{type:`bullets`,items:[`**Testcontainers (real engine in Docker)**: same database and version as production, real indexes, transactions, constraints and query planner behaviour. Cost: Docker in CI, a few seconds of startup per run (not per test).`,"**In-memory / embedded**: `mongodb-memory-server` downloads and runs a real `mongod` binary, so query semantics are real; it is fast and needs no Docker. Replica-set features (transactions, change streams) need its replica-set mode. SQLite as a stand-in for Postgres is different: different SQL dialect, types, locking and constraints, so tests pass on behaviour production does not have.",`**Mocks / fakes of the repository**: fastest and fully deterministic, ideal for unit tests of services. They only prove that the service calls the repository the way you assumed.`]},{type:`heading3`,text:`Testcontainers with Vitest (MongoDB)`},{type:`code`,lang:`typescript`,code:`// test/global-setup.ts \u2014 one container for the whole run
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';

let container: StartedMongoDBContainer;

export async function setup() {
  container = await new MongoDBContainer('mongo:7').start(); // single-node replica set
  process.env.MONGO_URL = container.getConnectionString() + '?directConnection=true';
}

export async function teardown() {
  await container.stop();
}`},{type:`code`,lang:`typescript`,code:`// test/helpers/db.ts \u2014 isolate tests without restarting the container
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL!);
// A database per Vitest worker, so parallel workers never share data
const dbName = 'test_' + (process.env.VITEST_POOL_ID ?? '0');

export const testDb = () => client.db(dbName);

export async function resetDb() {
  const db = testDb();
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}`},{type:`paragraph`,text:"The Postgres equivalent uses `@testcontainers/postgresql` with `new PostgreSqlContainer('postgres:16').start()` and runs the real migrations once in global setup. Between tests I truncate tables (`TRUNCATE ... RESTART IDENTITY CASCADE`) or wrap each test in a transaction that is rolled back, which is the fastest option when the code under test does not open its own transactions."},{type:`heading3`,text:`mongodb-memory-server when Docker is not an option`},{type:`code`,lang:`typescript`,code:`import { MongoMemoryReplSet } from 'mongodb-memory-server';

// Replica set mode, so multi-document transactions and change streams work
const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGO_URL = replSet.getUri();
// ... run tests ...
await replSet.stop();`},{type:`heading3`,text:`How I choose`},{type:`numbered`,items:[`Repository and query code, migrations, transactions, unique constraints: real engine (Testcontainers, or the memory server for MongoDB).`,`Service-level business rules: an in-memory fake repository (a small class backed by a Map), not a mocking library, so tests read like behaviour.`,`Pin the image version to production's major version and upgrade both together.`,`Never mix: a test either uses the real database or a fake, so failures are easy to interpret.`]},{type:`callout`,variant:`warning`,text:`Startup cost is per run, not per test. If the suite is slow, the usual culprit is restarting containers or reconnecting in every test file, not the database itself.`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you isolate parallel tests? (A database or schema per worker, or a transaction rolled back per test.)`,`How do you run Testcontainers in CI? (A runner with Docker available; cache images; consider Testcontainers Cloud or a service container if Docker-in-Docker is not allowed.)`,`How do you test migrations? (Run them up from empty in global setup, and test the down path or the expand-and-contract steps separately.)`,`When is a mock of the database acceptable? (Unit tests of rules that do not depend on query behaviour.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Using SQLite in tests for a Postgres app and discovering type and constraint differences in production.`,`Starting a fresh container in every test file, turning a 30-second suite into 5 minutes.`,`Forgetting replica-set mode, so MongoDB transaction code is never really tested.`,`Mocking the repository in "integration" tests, which then test nothing that can break in production.`]},{type:`callout`,variant:`important`,text:`Senior signal: you match the test database to production's engine and version, explain exactly what each substitute cannot catch, and make real-database tests fast through one container per run, per-worker isolation and cheap resets.`}]},"testing-time-retries-and-timers":{summary:'I make time an explicit dependency: code asks an injected clock for "now" and uses timers the test can control, so tests never sleep. For timer-driven code I use fake timers and advance them with the async variants (`advanceTimersByTimeAsync`) so promises between ticks resolve. For retries I inject the delay function or a seeded random source, so backoff and jitter are deterministic and I can assert the exact schedule.',details:[{type:`heading3`,text:`1. Inject a clock instead of calling Date.now()`},{type:`code`,lang:`typescript`,code:`export interface Clock {
  now(): Date;
}
export const systemClock: Clock = { now: () => new Date() };

export class TokenService {
  constructor(private clock: Clock = systemClock) {}

  isExpired(token: { expiresAt: Date }) {
    return token.expiresAt.getTime() <= this.clock.now().getTime();
  }
}

// Test: no fake timers needed, time is just data
it('treats a token as expired at its exact expiry instant', () => {
  const clock = { now: () => new Date('2026-01-01T10:00:00Z') };
  const svc = new TokenService(clock);
  expect(svc.isExpired({ expiresAt: new Date('2026-01-01T10:00:00Z') })).toBe(true);
});`},{type:`paragraph`,text:`For business rules ("trial ends after 14 days", "cut-off at 17:00 in the user's time zone") an injected clock is clearer than fake timers, and it lets me test boundaries, daylight-saving changes and month ends directly.`},{type:`heading3`,text:`2. Fake timers for setTimeout/setInterval code`},{type:`code`,lang:`typescript`,code:`import { vi, it, expect, afterEach } from 'vitest';
import { retry } from '../src/retry';

afterEach(() => {
  vi.useRealTimers();
});

it('retries with exponential backoff and succeeds on the third attempt', async () => {
  vi.useFakeTimers();
  const op = vi
    .fn()
    .mockRejectedValueOnce(new Error('ECONNRESET'))
    .mockRejectedValueOnce(new Error('ECONNRESET'))
    .mockResolvedValue('ok');

  const promise = retry(op, { retries: 3, baseMs: 100, jitter: () => 0 });

  await vi.advanceTimersByTimeAsync(100); // first backoff
  await vi.advanceTimersByTimeAsync(200); // second backoff

  await expect(promise).resolves.toBe('ok');
  expect(op).toHaveBeenCalledTimes(3);
});`},{type:`bullets`,items:["Use the **async** advance (`vi.advanceTimersByTimeAsync`, `jest.advanceTimersByTimeAsync`): it flushes promise callbacks between timers. The sync version often leaves the code stuck at an `await` and the test hangs or fails confusingly.","Jest has the same API: `jest.useFakeTimers()`, `jest.advanceTimersByTimeAsync(ms)`, `jest.runOnlyPendingTimersAsync()`.","`vi.setSystemTime(date)` / `jest.setSystemTime(date)` moves `Date.now()` without firing timers, which is handy for expiry logic in code you cannot refactor yet.","Always restore real timers in `afterEach`, or the next test file inherits a frozen clock."]},{type:`heading3`,text:`3. Make randomness deterministic`},{type:`paragraph`,text:"Backoff with jitter uses `Math.random()`. I pass the jitter function in (as above, `jitter: () => 0`) or a seeded generator, so the test can assert the exact delays and still cover the jitter path with a fixed value such as `() => 0.5`."},{type:`heading3`,text:`4. Assert the policy, not just the outcome`},{type:`bullets`,items:["Gives up after N attempts and rethrows the last error (or wraps it with `cause`).",`Does not retry non-retryable errors (4xx, validation errors).`,"Respects a `Retry-After` header when present.","Stops when an `AbortSignal` fires, without leaving a pending timer behind."]},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`Why did my fake-timer test hang? (A promise was awaited between timers and the sync advance did not flush it; use the async variant.)`,`How do you test a cron or scheduled job? (Separate "when" from "what": test the job function directly, and test the schedule expression separately.)`,"How do you test time zones? (Pass the zone explicitly and set `TZ=UTC` for the test process so CI and laptops agree.)",`Do fake timers affect database drivers or HTTP clients? (They can, because those also use timers; scope fake timers to unit tests, not integration tests.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Real `setTimeout` sleeps in tests, making the suite slow and flaky under CI load.","Calling `new Date()` deep inside business logic, so behaviour depends on when CI runs (tests that fail on the 31st or near midnight).",`Forgetting to restore real timers, which breaks unrelated tests later in the same worker.`,`Only testing the happy retry path, never the "gives up" and "non-retryable" paths.`]},{type:`callout`,variant:`important`,text:`Senior signal: you treat time and randomness as injected dependencies, know why the async timer advance matters, and test the whole retry policy (limits, non-retryable errors, cancellation) deterministically with zero real sleeps.`}]},"testing-queue-consumers-and-jobs":{summary:`I split each consumer into a thin adapter that reads the message and a plain handler function that does the work, then unit-test the handler directly with message objects. The properties that matter most are idempotency, retries and poison messages, so I test "the same message twice", "the handler throws" and "the payload is malformed" explicitly. A smaller set of integration tests runs the real broker in a container (Redis for BullMQ, LocalStack for SQS, Kafka/Redpanda) to prove the wiring.`,details:[{type:`heading3`,text:`Separate the handler from the transport`},{type:`code`,lang:`typescript`,code:`// The handler knows nothing about BullMQ, SQS or Kafka
export interface OrderPaid {
  eventId: string;
  orderId: string;
  amount: number;
}

export function makeOrderPaidHandler(deps: { orders: OrdersRepo; email: EmailPort }) {
  return async function handle(event: OrderPaid) {
    // Idempotency: processing the same event twice must be a no-op
    const firstTime = await deps.orders.markPaidOnce(event.orderId, event.eventId);
    if (!firstTime) return;
    await deps.email.sendReceipt(event.orderId);
  };
}

// The BullMQ adapter is a few lines and gets a couple of integration tests
new Worker('orders', async (job) => handle(job.data as OrderPaid), { connection });`},{type:`heading3`,text:`Unit tests for the behaviour that matters`},{type:`code`,lang:`typescript`,code:`it('is idempotent: the same event twice sends one receipt', async () => {
  const orders = new InMemoryOrdersRepo([{ id: 'o1', status: 'pending' }]);
  const email = { sendReceipt: vi.fn().mockResolvedValue(undefined) };
  const handle = makeOrderPaidHandler({ orders, email });

  const event = { eventId: 'e1', orderId: 'o1', amount: 500 };
  await handle(event);
  await handle(event); // redelivery

  expect(email.sendReceipt).toHaveBeenCalledTimes(1);
});

it('lets errors propagate so the broker retries the message', async () => {
  const orders = new InMemoryOrdersRepo([{ id: 'o1', status: 'pending' }]);
  const email = { sendReceipt: vi.fn().mockRejectedValue(new Error('SMTP down')) };
  const handle = makeOrderPaidHandler({ orders, email });

  await expect(handle({ eventId: 'e2', orderId: 'o1', amount: 500 })).rejects.toThrow('SMTP down');
});`},{type:`paragraph`,text:`The second test exposes a real design question: the order is already marked paid, but the email failed. On retry, the idempotency check would skip the email. The fix is to make each side effect idempotent separately (an outbox or a per-effect "done" flag), and this is exactly the kind of bug these tests find.`},{type:`heading3`,text:`Integration tests with a real broker`},{type:`bullets`,items:["**BullMQ**: start Redis with Testcontainers (`GenericContainer('redis:7')`), add a job, run a real `Worker`, and wait for its `completed`/`failed` event. Test retry settings (`attempts`, `backoff`) and that a job ends up failed after the last attempt.","**SQS**: LocalStack in a container; send a message, run the consumer once, and assert it was deleted, or that it lands in the dead-letter queue after `maxReceiveCount`.",`**Kafka**: a Kafka or Redpanda container; produce, consume, and assert offsets are committed only after successful processing.`,`Keep these few: they prove configuration and wiring, while the handler unit tests carry the logic.`]},{type:`code`,lang:`typescript`,code:`import { Queue, Worker, QueueEvents } from 'bullmq';

it('moves a job to failed after 3 attempts', async () => {
  const connection = { host: redisHost, port: redisPort };
  const queue = new Queue('t', { connection });
  const events = new QueueEvents('t', { connection });
  const worker = new Worker('t', async () => { throw new Error('boom'); }, { connection });

  const job = await queue.add('x', {}, { attempts: 3, backoff: { type: 'fixed', delay: 10 } });
  await expect(job.waitUntilFinished(events)).rejects.toThrow('boom');

  const failed = await queue.getJob(job.id!);
  expect(failed?.attemptsMade).toBe(3);

  await Promise.all([worker.close(), queue.close(), events.close()]);
});`},{type:`heading3`,text:`Cases I always cover`},{type:`numbered`,items:[`Duplicate delivery (at-least-once): same message twice.`,`Out-of-order delivery, if ordering is not guaranteed for that queue.`,`Malformed or old-version payload: validate with a schema and send it to a dead-letter queue instead of retrying forever.`,`Partial failure: the first side effect succeeds, the second fails.`,`Graceful shutdown: the worker finishes or releases in-flight jobs when the process receives SIGTERM.`]},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you test the producer side? (Assert the event is written to an outbox in the same transaction as the state change.)`,"How do you avoid flaky waits in broker tests? (Wait on events such as `waitUntilFinished`, never fixed sleeps.)",`How do you test a scheduled/repeatable job? (Test the handler directly; check the repeat options separately.)`,`How do you test schema evolution of messages? (Contract tests or fixture payloads from each supported version.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Business logic inside the worker callback, so it can only be tested with a running broker.`,`Never testing redelivery, then double-charging or double-emailing in production.`,`Catching and logging every error inside the handler, so the broker thinks the job succeeded and never retries.`,`Leaving queues and workers open after tests, which keeps the test process alive.`]},{type:`callout`,variant:`important`,text:`Senior signal: you design consumers so the logic is testable without a broker, test at-least-once delivery explicitly (duplicates, partial failure, poison messages), and keep a small number of real-broker tests that prove retry and dead-letter configuration.`}]},"contract-testing-pact-or-openapi":{summary:`Contract tests catch the bug where the API and the Angular app each pass their own tests but disagree about the shape of a response. With OpenAPI, the spec is the contract: the Node API is tested against it (every response validated against the schema) and the Angular client is generated from it. With Pact, the Angular side records the interactions it actually uses and the Node provider replays them in CI, which tells you exactly which consumer a change would break.`,details:[{type:`heading3`,text:`Two styles`},{type:`bullets`,items:[`**Schema-based (OpenAPI)**: one spec describes the whole API. The provider is validated against it; consumers generate types or clients from it. Simple, works well when one team owns both sides or the API is public.`,`**Consumer-driven (Pact)**: each consumer declares only the requests and response fields it relies on. The provider verifies all consumer pacts before deploying. Best when several independent teams consume the API and you need to know who breaks.`]},{type:`heading3`,text:`OpenAPI: validate every response in provider tests`},{type:`code`,lang:`typescript`,code:`// jest-openapi adds a matcher that validates a response against the spec
import path from 'node:path';
import request from 'supertest';
import jestOpenAPI from 'jest-openapi';
import { buildApp } from '../src/app';

jestOpenAPI(path.join(__dirname, '../openapi.yaml'));

it('GET /orders/:id matches the contract', async () => {
  const res = await request(buildApp()).get('/orders/o1').set(authHeader);
  expect(res.status).toBe(200);
  expect(res).toSatisfyApiSpec(); // status, headers and body schema
});`},{type:`bullets`,items:["On the Angular side, generate types or services from the same spec (e.g. `openapi-typescript` or `openapi-generator`) so a removed field becomes a compile error.","While the API is still being built, the Angular team can run a mock server from the spec (Prism: `prism mock openapi.yaml`).",`Add a breaking-change check on the spec itself in CI (diff the spec against the main branch) so a renamed field is flagged in review, before any test runs.`]},{type:`heading3`,text:`Pact: consumer test in Angular, verification in Node`},{type:`code`,lang:`typescript`,code:`// Consumer side (runs in the Angular repo's unit tests)
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, string } = MatchersV3;

const provider = new PactV3({ consumer: 'web-app', provider: 'orders-api' });

it('gets an order', async () => {
  provider
    .given('order o1 exists')
    .uponReceiving('a request for order o1')
    .withRequest({ method: 'GET', path: '/orders/o1' })
    .willRespondWith({
      status: 200,
      body: like({ id: 'o1', status: string('paid'), total: 8000 }),
    });

  await provider.executeTest(async (mock) => {
    const order = await fetchOrder(mock.url, 'o1'); // the real client code
    expect(order.status).toBe('paid');
  });
});`},{type:`code`,lang:`typescript`,code:`// Provider side (runs in the Node repo's CI)
import { Verifier } from '@pact-foundation/pact';

it('honours all consumer pacts', () =>
  new Verifier({
    provider: 'orders-api',
    providerBaseUrl: 'http://localhost:3000',
    pactBrokerUrl: process.env.PACT_BROKER_URL,
    stateHandlers: {
      'order o1 exists': () => seedOrder({ id: 'o1', status: 'paid', total: 8000 }),
    },
  }).verifyProvider());`},{type:`paragraph`,text:`Pacts are published to a broker (Pact Broker or PactFlow). The provider verifies the latest pacts of every consumer, and a "can I deploy" check gates releases so a provider change that breaks a deployed consumer version is blocked.`},{type:`heading3`,text:`How I choose`},{type:`bullets`,items:[`One team, one Angular app, one API: OpenAPI, generated client and response validation in provider tests. Low ceremony, high value.`,`Several consuming teams or mobile apps with old versions in the wild: Pact, because it records what each consumer really uses.`,`Either way, contract tests check shape and semantics of the interface, not business logic; they complement integration tests, not replace them.`]},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`Why not just end-to-end tests? (Slow, flaky and they do not tell you which side broke or which consumer depends on what.)`,`How do you handle provider states? (State handlers that seed exactly the data each interaction needs.)`,`How do contracts interact with API versioning? (Additive changes pass; removals fail until every consumer has moved.)`,`What about old mobile clients? (Keep verifying pacts of every version still in use, tagged by deployment.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`An OpenAPI spec written by hand once and never checked against real responses, so it drifts.`,`Pact consumer tests with exact values everywhere instead of matchers, making them brittle.`,`Putting business-logic assertions in contract tests.`,`Verifying pacts but never gating deploys on the result.`]},{type:`callout`,variant:`important`,text:`Senior signal: you explain the gap contract tests close (each side green, together broken), pick schema-based or consumer-driven by team topology, and wire the result into CI gates and spec-diff checks so breaking changes are caught before deployment.`}]},"load-testing-with-k6-reading-p95-p99":{summary:`I write k6 scenarios that model real traffic (an arrival rate, a realistic mix of endpoints, think time and test data) against a production-like environment, and I encode the pass criteria as thresholds such as "p95 under 300 ms and errors under 1%". I read percentiles, not averages: p95 is what 1 in 20 requests is slower than, and p99 is the tail that users with many requests per page will hit. A good run also watches the server side (CPU, event loop lag, database, pool waits) to find what saturates first.`,details:[{type:`heading3`,text:`A k6 script with scenarios and thresholds`},{type:`code`,lang:`javascript`,code:`import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    browse: {
      executor: 'constant-arrival-rate', // requests per second, independent of latency
      rate: 200,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
      maxVUs: 400,
      exec: 'browse',
    },
    checkout: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      stages: [
        { target: 20, duration: '5m' },
        { target: 20, duration: '5m' },
      ],
      exec: 'checkout',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{scenario:browse}': ['p(95)<300', 'p(99)<800'],
    'http_req_duration{scenario:checkout}': ['p(95)<600'],
  },
};

const BASE = __ENV.BASE_URL;

export function browse() {
  const res = http.get(BASE + '/products?limit=20');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

export function checkout() {
  const res = http.post(BASE + '/orders', JSON.stringify({ items: [{ sku: 'KB-01', qty: 1 }] }), {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + __ENV.TOKEN },
  });
  check(res, { 'status 201': (r) => r.status === 201 });
}`},{type:`bullets`,items:[`**Arrival-rate executors** model real users who keep arriving even when the server slows down. Closed-model executors (a fixed number of VUs looping) slow down with the server and hide queueing, which flatters results.`,`**Thresholds** turn the run into a pass/fail check, so it can gate a release or a nightly job.`,`**Tags per scenario** let you set different budgets per endpoint; one global p95 hides a slow critical endpoint behind fast cheap ones.`]},{type:`heading3`,text:`Reading percentiles`},{type:`bullets`,items:[`**p50 (median)**: the typical request. Useful, but it hides the slow ones.`,`**p95**: 5% of requests are slower. A page that makes 20 API calls will usually include at least one p95-or-slower request, so p95 is close to what users feel.`,`**p99**: the tail, often caused by garbage collection pauses, cold caches, lock contention, connection-pool waits or a slow downstream. Tails grow first as you approach saturation.`,`**Average**: misleading; a few 5-second requests and many 20 ms ones average to a number nobody experienced.`,`Read latency together with throughput and error rate. "p95 200 ms at 50 rps" says nothing about 500 rps; find the knee where latency starts climbing as you raise the rate.`]},{type:`heading3`,text:`Making the test meaningful`},{type:`numbered`,items:[`Production-like environment: same instance sizes, database size and indexes, cache warm-up policy. Never load test production without agreement and a kill switch.`,"Realistic data: many users and IDs (from a CSV via `SharedArray`), not one ID that is always cached.","Watch the server: CPU, memory, event loop delay (`perf_hooks.monitorEventLoopDelay`), database CPU and slow queries, pool wait time, downstream latency. The first resource to saturate is the bottleneck.",`Test types: load (expected peak), stress (find the breaking point), soak (hours, to find leaks), spike (sudden burst, autoscaling and cold starts).`,`Run the client from a machine that is not itself the bottleneck; check k6's own CPU.`]},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`p99 is bad but p95 is fine. What do you look at? (GC pauses, pool waits, lock contention, slow downstream calls, uneven load across instances.)`,`How do you pick the target rate? (From production metrics: peak rps times a growth and safety margin.)`,`What is coordinated omission? (A closed-loop tester waits for slow responses and sends fewer requests, under-reporting latency; arrival-rate executors avoid it.)`,`How do you run load tests in CI? (A short smoke-level load test with thresholds on each release, full runs nightly or before big launches.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Reporting the average response time.`,`Testing one cached endpoint with the same ID and declaring the system fast.`,`Load testing a tiny staging database with production-sized traffic, or the reverse.`,`Looking only at client metrics and never finding which server resource saturated.`]},{type:`callout`,variant:`important`,text:`Senior signal: you model open-arrival traffic with realistic data, encode SLO-based thresholds per endpoint, explain what drives tail latency, and correlate client percentiles with server saturation signals to name the actual bottleneck.`}]},"slow-flaky-backend-suite-in-ci":{summary:`I start by measuring instead of guessing: per-file durations and a list of tests that failed and then passed on rerun over the last few weeks. Most backend flakiness comes from shared state between tests, real time and sleeps, test-order dependence, and leaked connections or timers. I quarantine the known flaky tests with an owner, fix the root causes, then speed up the suite with one container per run, parallel workers with isolated data, and sharding in CI.`,details:[{type:`heading3`,text:`1. Measure`},{type:`bullets`,items:[`Collect timings per file and per test (both Vitest and Jest reporters can output them; a JUnit report fed into the CI dashboard works too).`,`Track flaky tests: a test that fails and passes on rerun on the same commit is flaky by definition. Count them over time rather than relying on memory.`,`Look at setup cost separately: often the tests are fast and the per-file setup (app boot, database connection, migrations) is slow.`]},{type:`heading3`,text:`2. Fix the usual causes of flakiness`},{type:`bullets`,items:[`**Shared mutable state**: tests that use the same database rows, the same Redis keys or module-level singletons. Give each test its own data (unique IDs, per-worker database) and reset between tests.`,`**Order dependence**: run with a random order or a single file in isolation to expose tests that rely on data created by earlier tests.`,'**Real time**: `setTimeout` sleeps, "wait 500 ms for the job", dates near midnight or month end. Replace with fake timers, injected clocks and waiting on events.','**Async leaks**: un-awaited promises, open servers, intervals and database pools that outlive the test. Close everything in `afterAll`; investigate "did not exit" or open-handle warnings instead of forcing an exit.',`**External services**: real calls to third-party APIs or the network. Stub them at the HTTP boundary.`,`**Port and resource collisions in parallel runs**: listen on port 0 (or test the app without listening, as Supertest does) and use per-worker resource names.`]},{type:`code`,lang:`typescript`,code:`// Before: flaky, slow
await queue.add('send-email', payload);
await new Promise((r) => setTimeout(r, 500)); // "should be done by now"
expect(await emails.count()).toBe(1);

// After: deterministic \u2014 wait on the event that proves completion
const job = await queue.add('send-email', payload);
await job.waitUntilFinished(queueEvents);
expect(await emails.count()).toBe(1);`},{type:`heading3`,text:`3. Make it fast`},{type:`numbered`,items:[`Start containers once per run in global setup, not per file; reset data with truncate or transaction rollback.`,"Run files in parallel with a per-worker database (`VITEST_POOL_ID` / `JEST_WORKER_ID` in the database name).","Shard across CI machines (`vitest --shard=1/4`, `jest --shard=1/4`) and cache dependencies and Docker images.",`Move pure logic tests out of the integration layer so they do not boot the app.`,`Run only affected tests on pull requests where the tooling supports it, and the full suite on main.`]},{type:`heading3`,text:`4. Process, so it stays fixed`},{type:`bullets`,items:[`Quarantine a flaky test (skip it in the blocking job, keep running it in a non-blocking job) only with an owner and a deadline; deleting it hides the bug.`,`Automatic retries are a short-term bandage. They keep the pipeline moving but must be reported, or flakiness silently grows.`,`Set a time budget for the suite (for example, under 10 minutes on a pull request) and treat regressions like any other performance bug.`]},{type:`callout`,variant:`warning`,text:`Some "flaky tests" are real race conditions in the product: two requests updating the same record, a missing unique index, an event processed twice. Before quarantining, check whether the test is right and the code is wrong.`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How do you prove a test is flaky and not broken? (Rerun it many times on the same commit, in isolation and in the full suite.)`,`Should CI retry failed tests? (As a temporary measure with reporting, never as the fix.)`,`How do you find what keeps the test process alive? (Open-handle detection in the runner, closing servers, pools, queues and timers in teardown.)`,`How do you keep the suite fast as it grows? (Budgets, sharding, keeping logic in unit tests, and not booting the app for pure code.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Increasing timeouts until the test passes.`,`Running tests serially to "fix" flakiness, which hides shared-state bugs and makes the suite slower.`,`Forcing the process to exit instead of closing leaked handles.`,`Deleting flaky tests without understanding them.`]},{type:`callout`,variant:`important`,text:`Senior signal: you measure before fixing, name the concrete causes of backend flakiness (shared state, order, time, leaks, external calls), fix speed structurally (one container per run, per-worker isolation, sharding), and put process around quarantine and retries so the problem does not come back.`}]}};export{e as answers};