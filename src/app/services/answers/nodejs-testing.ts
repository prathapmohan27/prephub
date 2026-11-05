import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is the difference between unit, integration, and end-to-end tests?': {
    summary:
      'A unit test checks one small piece of logic (a function or class) in isolation, with dependencies mocked — fast and precise. An integration test checks that several real pieces work together, such as a route + service + real test database. An end-to-end test drives the whole running system the way a user or client would — the most realistic, but slowest and most brittle.',
    details: [
      {
        type: 'paragraph',
        text: 'The three levels trade **speed and precision** against **realism and confidence**. A healthy suite has many unit tests, a solid layer of integration tests, and a few end-to-end tests for critical journeys — the "testing pyramid" (some teams prefer the "testing trophy", which puts more weight on integration tests).',
      },
      { type: 'heading3', text: 'Same feature, three levels' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// UNIT — pure logic, no I/O
test('calculateTotal applies 10% discount over 100', () => {
  expect(calculateTotal([{ price: 60 }, { price: 60 }])).toBe(108);
});

// INTEGRATION — real Express app + real (test) database, no network to outside
test('POST /orders stores the order', async () => {
  const res = await request(app).post('/orders').send({ items: [{ sku: 'A1', qty: 2 }] });
  expect(res.status).toBe(201);
  expect(await db.order.count()).toBe(1);
});

// END-TO-END — deployed stack, real browser/client (Playwright)
test('user can check out', async ({ page }) => {
  await page.goto('https://staging.shop.com');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'Checkout' }).click();
  await expect(page.getByText('Order confirmed')).toBeVisible();
});`,
      },
      {
        type: 'bullets',
        items: [
          '**Unit:** milliseconds each, pinpoints the broken function, but can pass while the pieces fail to fit together.',
          '**Integration:** catches wrong SQL, broken middleware order, serialization bugs. Use Docker/Testcontainers for a real DB; mock only third-party APIs.',
          '**E2E:** proves the system works end to end (UI, API, DB, auth). Slow, flaky if not written carefully, expensive to debug — keep them for critical paths like login and checkout.',
          'Contract tests (e.g. Pact) sit between integration and E2E for microservices: they verify a consumer and provider agree on an API without deploying both.',
        ],
      },
      {
        type: 'flow',
        title: 'The testing pyramid',
        code: `flowchart TB
  E["E2E — few<br/>slow, realistic"]:::highlight --> I["Integration — some<br/>real DB, real HTTP layer"]:::server
  I --> U["Unit — many<br/>fast, isolated, mocked deps"]:::db`,
        text: 'Moving up: more confidence per test, but slower and costlier to maintain.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: give the trade-off, not just definitions — "unit tests tell me where it broke, E2E tests tell me that it broke" — and describe the ratio your team used and why.',
      },
    ],
  },

  'What testing frameworks are commonly used in Node.js?': {
    summary:
      'Jest is the most widely used all-in-one framework (runner, assertions, mocks, coverage). Vitest is a fast Jest-compatible alternative popular with ESM/TypeScript and Vite projects. Mocha + Chai + Sinon is the classic modular stack, and Node now has a built-in runner, `node:test`. Supertest is used for HTTP testing and Playwright/Cypress for end-to-end tests.',
    details: [
      { type: 'heading3', text: 'The main options' },
      {
        type: 'bullets',
        items: [
          '**Jest** — batteries included: `describe/test/expect`, module mocking, fake timers, snapshots, coverage, parallel workers. Needs config (e.g. `ts-jest` or SWC) for TypeScript and native ESM.',
          '**Vitest** — Jest-like API, very fast, native ESM and TypeScript out of the box via Vite/esbuild. Good choice for new projects.',
          '**Mocha** — flexible runner; you add **Chai** (assertions) and **Sinon** (spies/stubs/mocks). Common in older codebases.',
          '**node:test** — built into Node (stable since Node 20) with `node --test`, `assert`, mocking and coverage — zero dependencies.',
          '**Supertest** — sends requests to an Express/Fastify app in-process for route tests.',
          '**Playwright / Cypress** — browser E2E. **Pact** — consumer-driven contract tests. **Testcontainers** — real databases in Docker for integration tests.',
        ],
      },
      { type: 'heading3', text: 'Same test in Jest and node:test' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// Jest / Vitest
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
});`,
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:node": "node --test --experimental-test-coverage"
  }
}`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name what you used and why — e.g. "Jest with Supertest for API tests and Testcontainers for Postgres; we were evaluating Vitest for faster ESM support". A reasoned choice beats a list of names.',
      },
    ],
  },

  'How do you test asynchronous code in Jest?': {
    summary:
      'Make Jest wait for the async work to finish: use an `async` test with `await` (preferred), or return the promise, and use `.resolves` / `.rejects` for promise assertions. For callback APIs use the `done` argument, and for timers use fake timers (`jest.useFakeTimers()`). If Jest does not wait, the test passes before the assertion runs.',
    details: [
      {
        type: 'paragraph',
        text: 'Jest considers a test finished when the test function returns — unless it returns a promise or takes a `done` callback. The classic bug is forgetting `await`/`return`, so the assertion runs after the test already passed (or throws in a later test).',
      },
      { type: 'heading3', text: 'Promises and async/await' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ✅ async/await (preferred)
test('fetchUser returns the user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Asha');
});

// ✅ .resolves / .rejects — remember to await (or return) them
test('fetchUser rejects for unknown id', async () => {
  await expect(fetchUser(999)).rejects.toThrow('Not found');
});

// ✅ return the promise
test('returning a promise also works', () => {
  return fetchUser(1).then((u) => expect(u.id).toBe(1));
});

// ❌ BUG: no await/return — test passes even if fetchUser fails
test('broken', () => {
  fetchUser(1).then((u) => expect(u.name).toBe('WRONG'));
});`,
      },
      { type: 'heading3', text: 'Callbacks and events' },
      {
        type: 'code',
        lang: 'javascript',
        code: `test('readConfig calls back with data', (done) => {
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
});`,
      },
      { type: 'heading3', text: 'Timers' },
      {
        type: 'code',
        lang: 'javascript',
        code: `jest.useFakeTimers();

test('retries after 1s', async () => {
  const fn = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('ok');
  const p = retryWithDelay(fn, 1000);
  await jest.advanceTimersByTimeAsync(1000); // no real waiting
  await expect(p).resolves.toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});`,
      },
      {
        type: 'bullets',
        items: [
          '`expect.assertions(n)` guarantees n assertions ran — useful in try/catch style tests.',
          'Default timeout is 5 s; change per test with `test(name, fn, 10000)` or `jest.setTimeout`.',
          "Don't mix `done` and `async` in the same test.",
          '"Jest did not exit" usually means an open handle (DB connection, server) — close it in `afterAll`, debug with `--detectOpenHandles`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: `expect(promise).rejects.toThrow()` without `await` — the test always passes. Lint rules like `jest/valid-expect` catch this.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: How do you write unit tests for async functions in Jest?',
      },
      {
        type: 'paragraph',
        text: 'Isolate the async function by mocking its I/O dependencies (DB, HTTP, queue) with `jest.fn().mockResolvedValue()` / `mockRejectedValue()`, then `await` the function in an `async` test and assert both the result and how the dependencies were called. Cover the success path, the error path and edge cases like empty results.',
      },
      { type: 'heading3', text: 'Function under test' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// user.service.ts
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
}`,
      },
      { type: 'heading3', text: 'Tests: success, failure, dependency errors' },
      {
        type: 'code',
        lang: 'typescript',
        code: `describe('register', () => {
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
});`,
      },
      {
        type: 'bullets',
        items: [
          'Arrange → Act → Assert: set mock return values, `await` the call, assert result + interactions.',
          '`mockResolvedValueOnce` chains let you simulate "fails once, then succeeds" for retry logic.',
          'Reset mocks between tests (`clearAllMocks` or `clearMocks: true` in config) so state does not leak.',
          'Test parallel logic (`Promise.all`) by checking all calls were made and that one rejection fails the whole call.',
          "Don't over-assert implementation details; assert behaviour that matters (result, side effects).",
        ],
      },
    ],
  },

  'How do you mock modules and dependencies in Jest?': {
    summary:
      'Use `jest.fn()` for standalone mock functions, `jest.spyOn(obj, "method")` to watch or override one method of a real object, and `jest.mock("module")` to replace a whole module (auto-mocked or with a factory). Prefer injecting dependencies so tests can pass fakes without module mocking, and restore mocks between tests.',
    details: [
      { type: 'heading3', text: '1. jest.fn — a fake function' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const sendEmail = jest.fn().mockResolvedValue({ ok: true });

await notify(user, sendEmail);

expect(sendEmail).toHaveBeenCalledTimes(1);
expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));`,
      },
      { type: 'heading3', text: '2. jest.mock — replace a whole module' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// payment.service.js imports: import axios from 'axios';
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
}));`,
      },
      { type: 'heading3', text: '3. jest.spyOn — observe or override a real method' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const spy = jest.spyOn(logger, 'error').mockImplementation(() => {}); // silence + record

await handler(badRequest);

expect(spy).toHaveBeenCalledWith(expect.stringContaining('invalid'));
spy.mockRestore(); // put the original back

// Time and randomness
jest.useFakeTimers().setSystemTime(new Date('2025-01-01'));
jest.spyOn(Math, 'random').mockReturnValue(0.5);`,
      },
      {
        type: 'bullets',
        items: [
          '`mockClear` resets call history; `mockReset` also removes implementations; `mockRestore` restores the original (spies only). Config flags `clearMocks`/`restoreMocks` do this automatically.',
          "`jest.mock` calls are hoisted, so a factory can't use outer variables unless their names start with `mock`.",
          "With native ESM, use `jest.unstable_mockModule` + dynamic `import()`; Vitest's `vi.mock` handles ESM natively.",
          'For HTTP, `nock` or MSW intercept requests at the network level instead of mocking the client library.',
          'Mock at the boundaries (DB, HTTP, clock, filesystem), not your own internal functions — heavy mocking makes tests pass while the real code is broken.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: mocks leaking between tests because they were never reset, causing tests that pass alone but fail in the full suite. Enable `restoreMocks: true` in Jest config.',
      },
    ],
  },

  'How do you test Express routes using Supertest?': {
    summary:
      'Export the Express `app` separately from the `app.listen()` call, then pass it to Supertest: `await request(app).get("/users").expect(200)`. Supertest runs the app on an ephemeral port in-process, so you test real routing, middleware, validation and status codes without starting a server. Mock external services or use a test database.',
    details: [
      { type: 'heading3', text: 'Structure the app for testing' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// app.js — build the app, don't listen
import express from 'express';
import { usersRouter } from './users.router.js';

export const app = express();
app.use(express.json());
app.use('/users', usersRouter);
app.use((err, _req, res, _next) => res.status(err.status ?? 500).json({ error: err.message }));

// server.js — only this file listens
import { app } from './app.js';
app.listen(process.env.PORT ?? 3000);`,
      },
      { type: 'heading3', text: 'Route tests' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import request from 'supertest';
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
});`,
      },
      {
        type: 'bullets',
        items: [
          'Assert status, headers and body; test the unhappy paths — 400 validation, 401/403 auth, 404, 500 from a failing dependency.',
          'For integration tests, skip `jest.mock` and use a real test DB (Docker/Testcontainers), resetting data in `beforeEach` and closing connections in `afterAll`.',
          'Use `request.agent(app)` to keep cookies across requests (login, then call a protected route).',
          'Supertest works with Fastify (`app.server` after `ready()`) and NestJS (`app.getHttpServer()`) as well.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the "separate app from listen" detail is what interviewers look for — it shows you have actually wired this up, and it avoids port conflicts when tests run in parallel.',
      },
    ],
  },

  'What is test coverage and how do you measure it in Node.js?': {
    summary:
      'Test coverage measures which parts of the code ran during tests — statements, branches, functions and lines. In Node you measure it with `jest --coverage` (Istanbul or V8 provider), `vitest --coverage`, `c8`/`nyc`, or `node --test --experimental-test-coverage`, and enforce minimum thresholds in CI. High coverage shows what was executed, not that it was verified correctly.',
    details: [
      { type: 'heading3', text: 'The four metrics' },
      {
        type: 'bullets',
        items: [
          '**Statements** — % of statements executed.',
          '**Branches** — % of `if/else`, ternary, `&&`/`||`, `switch` paths taken. Usually the most revealing metric.',
          '**Functions** — % of functions called at least once.',
          '**Lines** — % of executable lines run.',
        ],
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `function shippingCost(order) {
  if (order.total > 100) return 0;      // branch A
  return order.express ? 15 : 5;        // branches B and C
}

test('free shipping over 100', () => {
  expect(shippingCost({ total: 150 })).toBe(0);
});
// Lines: ~67% · Branches: 1 of 3 paths (33%)
// Express and standard shipping were never tested.`,
      },
      { type: 'heading3', text: 'Measuring and enforcing it' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// jest.config.js
module.exports = {
  collectCoverage: false,            // enable with: jest --coverage
  coverageProvider: 'v8',            // or 'babel' (Istanbul instrumentation)
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.d.ts', '!src/main.ts'],
  coverageReporters: ['text', 'lcov', 'html'], // html report in coverage/lcov-report
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 85, statements: 85 },
  },
};`,
      },
      {
        type: 'code',
        lang: 'bash',
        code: `npx jest --coverage
# ----------------|---------|----------|---------|---------|
# File            | % Stmts | % Branch | % Funcs | % Lines |
# shipping.js     |   66.67 |    33.33 |     100 |   66.67 |
# Jest: "global" coverage threshold for branches (80%) not met: 33.33%

npx c8 node --test           # V8 coverage for any runner
npx vitest run --coverage`,
      },
      {
        type: 'bullets',
        items: [
          'Fail CI when thresholds drop, and upload `lcov` to Codecov/SonarQube to show coverage on pull requests.',
          'Aim for a sensible target (often 70–90%) and focus on critical business logic, not 100% everywhere.',
          '`collectCoverageFrom` matters: without it, files never imported by any test do not appear at all, inflating the number.',
          'Mutation testing (e.g. Stryker) checks whether tests actually catch bugs — a stronger quality signal than coverage.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: treating coverage as quality. A test that calls a function with no assertions gives 100% coverage and zero protection. Say this in the interview.',
      },
    ],
  },
};
