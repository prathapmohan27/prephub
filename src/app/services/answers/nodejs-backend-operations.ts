import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'An API that previously responded quickly is now taking around 30 seconds to complete. How would you debug the issue and identify the root cause?':
    {
      summary:
        'Work systematically from symptoms to cause: confirm and scope the problem (which endpoints, all users or some, since when), correlate with recent changes (deploys, config, data growth, traffic), then use traces, logs and metrics to find where the 30 seconds is spent — database, a downstream service, the Node event loop, or resource exhaustion. A suspiciously round 30 s usually points to a timeout somewhere. Mitigate first (rollback, scale, cache), then fix the root cause and add monitoring so it is caught earlier next time.',
      details: [
        {
          type: 'paragraph',
          text: 'Interviewers want to see a calm, structured process — not a guess. Talk through each step and the evidence you would look for, and mention that during a real incident you would stabilize production before deep-diving.',
        },
        {
          type: 'flow',
          title: 'Debugging flow',
          code: `flowchart TD
  A["Confirm + scope<br/>which endpoints, since when"]:::client --> B{"Recent change?<br/>deploy, config, traffic"}
  B -->|Yes| RB["Roll back / disable flag<br/>to confirm"]:::highlight
  B -->|No| T["Trace one slow request<br/>(APM / OpenTelemetry)"]:::server
  T --> D{Where is the time?}
  D -->|DB span| DB["EXPLAIN ANALYZE, indexes,<br/>locks, pool exhaustion"]:::db
  D -->|HTTP span| EX["Downstream slow,<br/>timeouts, retries"]:::external
  D -->|"Gaps, no spans"| EL["Event loop blocked,<br/>CPU, GC, memory"]:::security
  DB & EX & EL --> F["Fix, verify with metrics,<br/>add alert + postmortem"]:::highlight`,
        },
        { type: 'heading3', text: '1. Confirm and scope' },
        {
          type: 'bullets',
          items: [
            'Reproduce it: `curl -w` timing, or check p50/p95/p99 latency dashboards. Is it every request or only some (specific users, tenants, payload sizes, regions, instances)?',
            'When did it start? Line that up with deploys, config changes, migrations, traffic spikes, data growth, dependency incidents.',
            'Is it one endpoint or everything? Everything slow points to shared resources (event loop, DB, pool, CPU, network); one endpoint points to its query or dependency.',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          code: `# Where does the time go at the network level?
curl -o /dev/null -s -w 'dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\\n' \\
  https://api.example.com/orders?user=42
# dns:0.01 connect:0.03 tls:0.08 ttfb:30.02 total:30.03  -> server-side wait

kubectl top pods                 # CPU / memory per instance
kubectl logs deploy/api --since=30m | grep -i -E 'timeout|ECONNRESET|pool'`,
        },
        { type: 'heading3', text: '2. Find where the time is spent' },
        {
          type: 'paragraph',
          text: 'Distributed tracing (OpenTelemetry, Datadog, New Relic) shows a waterfall of spans for one slow request — the fastest way to see whether 29 s is in a SQL query, an HTTP call, or unaccounted time inside Node. Without APM, add timing logs around each step with a request ID.',
        },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Quick instrumentation when there is no APM
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';

async function timed<T>(label: string, fn: () => Promise<T>, reqId: string) {
  const t0 = performance.now();
  try { return await fn(); }
  finally { logger.info({ reqId, label, ms: Math.round(performance.now() - t0) }); }
}

const user = await timed('db.user', () => repo.findUser(id), req.id);          // 12 ms
const orders = await timed('db.orders', () => repo.findOrders(id), req.id);    // 29,850 ms  <- here
const recs = await timed('http.recs', () => recsClient.get(id), req.id);       // 40 ms

// Is the event loop blocked?
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => logger.info({ p99LoopDelayMs: h.percentile(99) / 1e6 }), 10_000);`,
        },
        { type: 'heading3', text: '3. Common root causes and how to confirm them' },
        {
          type: 'bullets',
          items: [
            '**Slow query** — data grew, missing index, plan changed. Check slow query log / `pg_stat_statements`, run `EXPLAIN ANALYZE` (look for Seq Scan on a big table). Fix with an index, pagination, or query rewrite.',
            '**Lock contention** — a long transaction or migration holding locks. Check `pg_locks` / `pg_stat_activity` for waiting queries.',
            "**Connection pool exhaustion** — requests wait for a free DB connection (pool size 10, slow queries holding them, or leaked connections never released). The 30 s often equals the pool's acquire timeout.",
            '**Downstream dependency** — a third-party API is slow; no timeout set, so we wait for a default 30 s, possibly with retries multiplying it.',
            '**Event loop blocked** — synchronous CPU work (big `JSON.parse`, sync crypto, regex backtracking, `fs.readFileSync`) blocks every request on that instance. Profile with `node --cpu-prof` or `clinic flame`.',
            '**Memory pressure / GC** — a leak makes the heap grow and GC pauses dominate; check heap metrics and take heap snapshots.',
            '**N+1 queries** — a code change now issues 1,000 queries per request.',
            '**Infrastructure** — DNS resolution issues, exhausted sockets, CPU throttling from container limits, noisy neighbours, cross-region calls after a config change.',
          ],
        },
        {
          type: 'code',
          lang: 'sql',
          code: `-- Postgres: what is running and what is waiting?
SELECT pid, now() - query_start AS running_for, wait_event_type, state, left(query, 80)
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY running_for DESC;

-- Why is this query slow?
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
-- Seq Scan on orders (rows=12,000,000) ... Execution Time: 29714 ms
-- Fix: CREATE INDEX CONCURRENTLY idx_orders_customer_created ON orders (customer_id, created_at DESC);
-- After: Index Scan ... Execution Time: 1.8 ms`,
        },
        { type: 'heading3', text: '4. Mitigate, fix, prevent' },
        {
          type: 'numbered',
          items: [
            '**Mitigate:** roll back the suspect deploy, disable a feature flag, scale out, add a cache, or shed load — restore service first.',
            '**Fix the root cause:** index, query rewrite, add timeouts and circuit breakers to dependencies, move CPU work to worker threads/queues, fix the leak.',
            '**Verify:** p95/p99 latency back to baseline on dashboards.',
            '**Prevent:** latency SLO alerts, slow-query alerts, explicit timeouts on every outbound call, load tests in CI for critical endpoints, blameless postmortem with action items.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Sample answer framing: "In [your project], [endpoint] went from [200 ms] to [30 s]. Tracing showed [the orders query] taking the time; `EXPLAIN ANALYZE` revealed [a sequential scan after the table grew]. We [added a composite index concurrently], latency dropped to [x ms], and we added [a slow-query alert]." Replace the brackets with a real incident you handled.',
        },
      ],
    },

  'Walk me through your process of taking a new feature from requirement gathering to production deployment.':
    {
      summary:
        'Describe an end-to-end lifecycle: clarify requirements and acceptance criteria with product and stakeholders; write a short technical design covering API, data model, risks and rollout; break it into small tasks; implement behind a feature flag with tests; go through code review and CI; deploy to staging for QA; release to production gradually with monitoring and a rollback plan; then measure the outcome against the original goal.',
      details: [
        {
          type: 'paragraph',
          text: 'This is a process and experience question. The interviewer is checking whether you think beyond writing code: do you clarify ambiguity, consider edge cases and non-functional requirements, communicate, test, ship safely, and follow up after release? Use a real feature as the thread through your answer — a STAR-style story with the process steps in the middle.',
        },
        {
          type: 'flow',
          title: 'Feature lifecycle',
          code: `flowchart LR
  R["Requirements<br/>+ acceptance criteria"]:::client --> D["Technical design<br/>+ review"]:::server
  D --> P["Plan + estimate<br/>small tasks"]:::server
  P --> I["Build behind flag<br/>+ tests"]:::server
  I --> CR["PR review + CI"]:::security
  CR --> S["Staging + QA / UAT"]:::network
  S --> PR["Gradual rollout<br/>monitor"]:::highlight
  PR --> M["Measure + iterate"]:::db`,
        },
        { type: 'heading3', text: '1. Requirements' },
        {
          type: 'bullets',
          items: [
            'Understand the **why**: the user problem and the success metric (e.g. reduce checkout drop-off by 5%).',
            'Clarify scope, edge cases and non-functional needs: expected load, latency, security/permissions, data retention, accessibility, backward compatibility.',
            'Agree on **acceptance criteria** (Given/When/Then) and what is explicitly out of scope.',
          ],
        },
        { type: 'heading3', text: '2. Design' },
        {
          type: 'bullets',
          items: [
            'Short design doc or RFC: API contract, data model and migrations, sequence of calls, failure handling, alternatives considered.',
            'Identify risks early: migrations on large tables, third-party limits, performance hot spots, security review.',
            'Get feedback from peers and dependent teams (frontend, mobile, other services) before building.',
          ],
        },
        {
          type: 'code',
          lang: 'text',
          code: `RFC: Saved payment methods
- Goal: 1-click checkout for returning users (metric: checkout conversion)
- API:  POST /payment-methods, GET /payment-methods, DELETE /payment-methods/:id
- Data: payment_methods(id, user_id, provider_token, last4, brand, created_at)  -- no raw card data (PCI)
- Flow: tokenise via provider -> store token -> charge with token
- Risks: PCI scope, duplicate cards, provider outage -> fall back to manual entry
- Rollout: flag 'saved-cards', internal users -> 5% -> 50% -> 100%
- Metrics/alerts: save success rate, charge failure rate, p95 latency`,
        },
        { type: 'heading3', text: '3. Build and test' },
        {
          type: 'bullets',
          items: [
            'Split into small, independently mergeable PRs (migration first, then API, then UI), all behind a **feature flag** so incomplete work can ship safely.',
            'Tests at each level: unit tests for logic, integration tests for API + DB, a few E2E tests for the critical path; update API docs (OpenAPI).',
            'Backward-compatible database migrations (expand → migrate → contract) so old and new code can run side by side during deploys.',
            'Add logging, metrics and tracing as part of the feature, not afterwards.',
          ],
        },
        { type: 'heading3', text: '4. Review, CI and staging' },
        {
          type: 'bullets',
          items: [
            'Code review focused on correctness, security, readability; CI runs lint, type-check, tests, security scans.',
            'Deploy to staging; QA and product verify against acceptance criteria (UAT); run performance tests if load-sensitive.',
          ],
        },
        { type: 'heading3', text: '5. Release and follow-up' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Gradual release: deploy is separate from release
app.post('/checkout', async (req, res) => {
  if (await flags.isEnabled('saved-cards', { userId: req.user.id })) {
    return checkoutWithSavedCard(req, res);   // new path: 5% of users first
  }
  return legacyCheckout(req, res);            // instant rollback = turn flag off
});`,
        },
        {
          type: 'bullets',
          items: [
            'Roll out gradually (internal → canary → percentage → 100%) while watching error rates, latency and business metrics; have a documented rollback.',
            'Communicate: release notes, support team briefing, documentation.',
            'After launch: compare the metric with the goal, gather feedback, fix issues, and remove the feature flag and dead code.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Sample answer structure: "Recently I built [feature] for [your project]. I started by [clarifying X with the PM], wrote a short design covering [API/data model], and we flagged [risk]. I shipped it in [N] small PRs behind a flag with [tests], validated it on staging with QA, then rolled it out [5% → 100%] while monitoring [metric]. Result: [outcome]. What I\'d do differently: [lesson]." The reflection at the end is what makes it sound senior.',
        },
      ],
    },
};
