import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'why-angular-over-react': {
    summary:
      "Frame it as a deliberate engineering choice, not a default: Angular is a complete, opinionated platform — routing, forms, HTTP, DI, testing and a CLI in one consistent package with TypeScript first — which suits large, long-lived enterprise apps and big teams. Then show you are not dogmatic: you know React's strengths and could work in it.",
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer wants to see **reasoned decision-making**, not fandom. A good answer gives concrete reasons tied to the kind of projects you build, acknowledges trade-offs, and shows you understand the wider ecosystem.',
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Context:** how you started (project needs, team stack, company standard).',
          '**Reasons you stayed:** 2–3 technical strengths that matter in your work.',
          '**Balance:** what React does well and that you are comfortable with it.',
          '**Forward-looking:** how modern Angular (signals, standalone) addressed old criticisms.',
        ],
      },
      { type: 'heading3', text: 'Strong technical reasons' },
      {
        type: 'bullets',
        items: [
          '**Batteries included:** router, forms (reactive and template), HttpClient, i18n, animations and testing utilities are first-party and versioned together — no assembling 10 libraries.',
          '**Consistency at scale:** opinionated structure means a developer can move between Angular projects in a company and recognise everything — valuable for teams of 20+.',
          '**Dependency injection:** built-in hierarchical DI makes services, testing with mocks and feature isolation natural.',
          '**TypeScript first:** the framework, templates (strict template type-checking) and CLI are designed around TypeScript.',
          '**Predictable upgrades:** `ng update` with automated migrations and a published release schedule — important for enterprise apps that live 5+ years.',
          '**Modern reactivity:** signals, standalone components and zoneless change detection removed much of the boilerplate React developers used to criticise.',
        ],
      },
      { type: 'heading3', text: 'Fair comparison to show balance' },
      {
        type: 'bullets',
        items: [
          'React is a UI library with a huge ecosystem and job market; great for flexibility and smaller apps, and React Native for mobile.',
          'The flexibility is also the cost: each team picks its own router, state, forms and data-fetching libraries, so codebases differ widely.',
          'Concepts transfer: components, unidirectional data flow, signals vs hooks/state, RxJS vs other async patterns — you could ramp up on React quickly.',
        ],
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"I started with Angular because [my first company built enterprise dashboards on it], but I stayed for technical reasons. In [project], we had [N] developers across [M] feature teams, and Angular\'s conventions — DI, the CLI, typed reactive forms, a single router — meant any developer could open any module and be productive in a day. Upgrades were predictable thanks to `ng update`. I do follow React and have built [a small app / POC] with it; I like its simplicity for UI-only work, and concepts like components and one-way data flow are the same. With signals and standalone components, Angular has become much lighter, so for large, long-lived business applications I still think it is the stronger choice."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: never bash React. Interviewers often use React themselves or plan to. "Right tool for the job, and here is why Angular fits the jobs I do" is the answer that lands.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Do you have exposure working in Vanilla JavaScript?' },
      {
        type: 'paragraph',
        text: 'Say yes and prove it with specifics: the DOM API, events and delegation, closures, promises/async-await and the event loop, `fetch`, and ES modules — and give an example where you used plain JavaScript (a widget, a script, a performance fix, or debugging what Angular does underneath). Frameworks are abstractions over these fundamentals.',
      },
      {
        type: 'paragraph',
        text: 'The real question is "do you understand the platform, or only the framework?". Developers who know vanilla JS debug faster, write less framework-dependent code, and understand why Angular behaves the way it does (zone.js patching `setTimeout`, event binding, change detection).',
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Where you used it:** a project or task without a framework, or framework-agnostic utilities.',
          '**Which fundamentals you are strong in:** list 4–5 concrete areas.',
          '**One example:** short story or code you can walk through.',
          '**Link back:** how that knowledge helps in Angular.',
        ],
      },
      { type: 'heading3', text: 'Areas to name (and be ready to be quizzed on)' },
      {
        type: 'bullets',
        items: [
          'Scope, closures, hoisting, `this` binding, prototypes and classes.',
          'Event loop: call stack, microtasks (promises) vs macrotasks (`setTimeout`).',
          'DOM: `querySelector`, `createElement`, `classList`, event delegation, `IntersectionObserver`.',
          'Async: promises, `async/await`, `fetch`, `AbortController` for cancellation.',
          'Modules (ESM), array/object methods, destructuring, spread, optional chaining.',
          'Browser APIs: `localStorage`, `history.pushState`, Web Workers.',
        ],
      },
      { type: 'heading3', text: 'Example you can talk through: event delegation' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// One listener on the parent instead of one per row —
// works for rows added later and saves memory on large lists.
const list = document.querySelector('#todo-list');

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.closest('li').dataset.id;
  if (button.dataset.action === 'delete') {
    fetch('/api/todos/' + id, { method: 'DELETE' })
      .then(() => button.closest('li').remove());
  }
});`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"Yes — I started with vanilla JavaScript before Angular, and I still use it regularly. At [company] I built [an embeddable widget / a Chrome extension / a landing page] with plain JS because [it had to load on third-party sites without a framework]. I used event delegation, `fetch` with `AbortController`, and `IntersectionObserver` for lazy-loading. In Angular work it helps daily: when [a component re-rendered too often], understanding the event loop and how zone.js patches async APIs let me find that [a setInterval was triggering change detection] and move it outside the zone."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: this question is often followed by a live JS question (closures, `this`, event loop output). Keep your answer specific so the follow-up feels natural rather than like a trap.',
      },
    ],
  },

  'third-party-angular-libraries-you-use': {
    summary:
      'Name the libraries by purpose and give the reason each was chosen — e.g. Angular Material/CDK or PrimeNG for UI components, NgRx (Store or SignalStore) for state, ngx-translate or Transloco for runtime i18n, a charting library, and testing tools. The strongest answers also mention how you evaluate a library (maintenance, bundle size, Angular-version compatibility) and when you chose not to add one.',
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer is checking your **judgement**: do you add libraries thoughtfully, and do you understand the cost (bundle size, upgrade lag, lock-in)? Listing ten names without reasons is weak; three libraries with clear "why" is strong.',
      },
      { type: 'heading3', text: 'Common libraries by category' },
      {
        type: 'bullets',
        items: [
          '**UI components:** Angular Material and the CDK (first-party, accessible, follows Angular releases closely), PrimeNG (rich data tables, many enterprise widgets), ng-bootstrap / ngx-bootstrap (Bootstrap look).',
          '**State management:** NgRx Store/Effects (Redux pattern, devtools, large apps), NgRx SignalStore (signal-based, less boilerplate), NGXS or Akita in older codebases.',
          '**Data grids & charts:** AG Grid (huge datasets, virtualisation), ngx-charts, Chart.js via ng2-charts, ECharts via ngx-echarts.',
          "**i18n:** ngx-translate or Transloco for runtime language switching (Angular's built-in i18n compiles one build per locale).",
          '**Forms & UX:** ngx-mask for input masks, ngx-toastr for notifications, ngx-infinite-scroll.',
          '**Auth:** angular-oauth2-oidc or MSAL Angular for OAuth/OIDC flows.',
          '**Testing & tooling:** Jest or Vitest, Cypress or Playwright, Storybook, Nx for monorepos, ESLint via angular-eslint.',
        ],
      },
      { type: 'heading3', text: 'How you evaluate a library (say this)' },
      {
        type: 'numbered',
        items: [
          'Can we do it with the platform or Angular itself? (CDK overlay, signals, `HttpClient` often suffice.)',
          'Is it maintained and does it support our Angular version? Check release cadence and open issues.',
          'Bundle impact — check with `source-map-explorer` or the build stats; is it tree-shakable?',
          'Licence (AG Grid Enterprise is commercial; MIT for most others).',
          'Accessibility and theming fit with our design system.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Example: NgRx SignalStore — chose it over classic NgRx Store for a
// mid-size feature because it removes actions/reducers boilerplate
export const TodoStore = signalStore(
  { providedIn: 'root' },
  withState({ todos: [] as Todo[], loading: false }),
  withComputed(({ todos }) => ({
    pending: computed(() => todos().filter((t) => !t.done).length),
  })),
  withMethods((store, api = inject(TodoApi)) => ({
    async load() {
      patchState(store, { loading: true });
      patchState(store, { todos: await api.getAll(), loading: false });
    },
  })),
);`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"On [project] we used Angular Material and the CDK as the base of our design system because it is maintained by the Angular team, accessible out of the box and upgrades in lockstep with Angular. For a reporting module with [100k+] rows we added AG Grid for virtualisation and server-side sorting. For state we used [NgRx Store] in the main app for its devtools and predictable flow, and [SignalStore] for newer features to cut boilerplate. For runtime language switching we used [Transloco]. Equally important, we removed [moment.js] in favour of [date-fns / native Intl] and saved [X KB] from the bundle — I always check bundle size and maintenance before adding a dependency."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention one library you removed or decided against. It shows you treat dependencies as a cost, which is exactly the senior mindset interviewers are probing for.',
      },
    ],
  },

  'hardest-angular-bug-you-solved': {
    summary:
      'Use STAR: set the context and impact briefly, then spend most of the time on how you **diagnosed** it (profiling, measurements, narrowing down), the root cause, the fix, and the measurable result. Good Angular examples: excessive change detection, memory leaks from un-unsubscribed observables, huge lists without virtualisation, or a large initial bundle.',
    details: [
      {
        type: 'paragraph',
        text: 'This is the most important behavioral question for a senior frontend role. The interviewer evaluates your **debugging process** — hypotheses, tools, data — far more than the bug itself. A vague "the app was slow so I optimised it" fails; numbers and tools pass.',
      },
      { type: 'heading3', text: 'STAR structure (with time split)' },
      {
        type: 'bullets',
        items: [
          '**Situation (10%):** app, scale, who was affected. "Our trading dashboard with [N] live widgets…"',
          '**Task (10%):** your responsibility and the goal. "I owned fixing the freeze before the [release]."',
          '**Action (60%):** how you investigated, what you found, why the fix works, alternatives you rejected.',
          '**Result (20%):** before/after numbers and what you changed in the process (lint rule, guideline, monitoring).',
        ],
      },
      {
        type: 'flow',
        title: 'A credible debugging process',
        code: `flowchart LR
  R["Reproduce reliably<br/>prod-like data"]:::client --> M["Measure<br/>DevTools, Angular profiler"]:::server
  M --> H["Form hypothesis<br/>CD, leak, bundle, API"]:::highlight
  H --> I["Isolate<br/>disable parts, bisect"]:::server
  I --> F["Fix root cause"]:::db
  F --> V["Verify with numbers<br/>+ add guard rail"]:::security
  V -.->|"not fixed"| H`,
      },
      { type: 'heading3', text: 'Tools to mention' },
      {
        type: 'bullets',
        items: [
          'Chrome DevTools Performance panel (long tasks, scripting time) and Memory panel (heap snapshots, detached DOM nodes).',
          'Angular DevTools profiler — shows which components ran change detection and how long it took.',
          'Lighthouse / Web Vitals (LCP, INP, CLS) and bundle analysis (`source-map-explorer`, build stats).',
          '`git bisect` to find the commit that introduced a regression.',
        ],
      },
      { type: 'heading3', text: 'Typical root causes and fixes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// BEFORE: function call in template runs on every change detection cycle,
// plus a manual subscription that is never cleaned up (memory leak)
@Component({
  template: \`@for (row of rows; track $index) { <td>{{ formatPrice(row) }}</td> }\`,
})
export class GridComponent implements OnInit {
  rows: Row[] = [];
  ngOnInit() {
    this.prices.stream$.subscribe((r) => (this.rows = r)); // leaks on destroy
  }
  formatPrice(r: Row) { /* expensive Intl formatting */ }
}

// AFTER: OnPush + signals + computed (memoised) + stable track key
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`@for (row of formatted(); track row.id) { <td>{{ row.price }}</td> }\`,
})
export class GridComponent {
  private rows = toSignal(inject(PriceService).stream$, { initialValue: [] }); // auto-unsubscribes
  formatted = computed(() => this.rows().map((r) => ({ ...r, price: fmt.format(r.price) })));
}`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"**S:** On [project], a [real-time monitoring dashboard] froze for 2–3 seconds whenever [a filter changed], and memory grew until the tab crashed after [~1 hour]. **T:** I was asked to find the cause before [the client demo]. **A:** I reproduced it with production-size data, then used the Angular DevTools profiler and saw every one of [200] widgets running change detection on each WebSocket message. Heap snapshots showed thousands of detached components — subscriptions created in `ngOnInit` were never unsubscribed. I switched the widgets to OnPush, moved the stream into signals via `toSignal`, replaced template method calls with `computed()`, added `track row.id` to the list, and virtualised the table with CDK virtual scroll. **R:** Interaction time dropped from [~2.5 s] to [under 100 ms], memory stayed flat over [8 hours], and I added a lint rule and a PR checklist item for subscription cleanup so it would not come back."',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: describing a team effort as "we" throughout. Interviewers need to know what **you** did — say "I profiled…", "I proposed…", and credit others specifically where they helped.',
      },
    ],
  },

  'proof-of-concept-you-built': {
    summary:
      'Yes — describe one POC with a clear question it had to answer, the time-box, what you built (deliberately minimal), the success criteria you measured, and the decision it led to. A POC is valuable because it reduces risk before a big investment, so the outcome — even "we decided not to do it" — is the most important part.',
    details: [
      {
        type: 'paragraph',
        text: 'Interviewers ask this to see whether you can **explore uncertainty in a structured way**: frame a hypothesis, build just enough, measure, and communicate a recommendation to stakeholders. It also signals initiative.',
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Problem / question:** what was uncertain? ("Can we migrate to micro-frontends without hurting load time?")',
          '**Scope & time-box:** "2 weeks, one feature, no production hardening."',
          '**What you built:** architecture and key technical choices.',
          '**Success criteria & results:** numbers compared against the criteria.',
          '**Decision & follow-up:** adopted, adapted or dropped — and how the POC turned into the real implementation.',
        ],
      },
      {
        type: 'flow',
        title: 'POC lifecycle',
        code: `flowchart LR
  Q["Question / risk"]:::client --> C["Success criteria<br/>+ time-box"]:::highlight
  C --> B["Build thin slice"]:::server
  B --> M["Measure + demo"]:::db
  M --> D{Decision}:::external
  D -->|Go| P["Plan production build"]:::server
  D -->|No go| X["Document learnings"]:::security`,
      },
      { type: 'heading3', text: 'Good POC topics for an Angular developer' },
      {
        type: 'bullets',
        items: [
          'Micro-frontends with Module Federation / Native Federation.',
          'Migrating a feature from NgRx Store to signals or SignalStore.',
          'Zoneless change detection or SSR/hydration to improve Core Web Vitals.',
          'Replacing a heavy grid or chart library; evaluating Nx for a monorepo.',
          'An AI-assisted feature (chat/search) calling an LLM API through a backend proxy.',
        ],
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"Yes. At [company], [three teams] were blocked on each other\'s releases in one large Angular app. I proposed a two-week POC to test micro-frontends. The success criteria were: independent deployment of one feature, initial load no more than [10%] slower, and shared auth and design system still working. I built a shell app and moved the [reports] feature into a remote using [Native Federation], sharing Angular and our design-system library as singletons. Results: independent deploy worked, initial load was [6%] slower on 3G, but we hit version-alignment issues with shared libraries. I presented it with a recommendation: adopt it only for [two] high-churn domains and enforce a single Angular version via the shell. The architecture group approved that, and the POC code became the template for the first production remote."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: always state the success criteria you set **before** building. It turns "I played with a new tool" into "I ran an experiment and made a data-driven recommendation".',
      },
    ],
  },

  'deployment-activities-you-handled': {
    summary:
      'Walk through the deployment lifecycle you have actually owned: building production artifacts (`ng build`), environment configuration, deploying to [hosting — e.g. S3 + CloudFront, Azure Static Web Apps, Nginx/Docker, Firebase], cache and CDN invalidation, release verification (smoke tests, monitoring) and rollback. Be explicit about which parts you did hands-on versus which a DevOps team owned.',
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer wants to know whether you can take code **all the way to production** safely, not just merge a PR. Concrete steps, environments and one incident you handled make the answer credible.',
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Environments:** dev → QA/staging → production (and how config differs).',
          '**Your activities:** build, deploy, config, release coordination, verification, rollback.',
          '**Tooling:** pipeline, hosting, containers, monitoring.',
          '**One story:** a release you coordinated or a rollback you performed.',
        ],
      },
      { type: 'heading3', text: 'Typical frontend deployment activities' },
      {
        type: 'bullets',
        items: [
          'Production build with hashed file names (`ng build` uses the production configuration by default) and budget checks in `angular.json`.',
          'Runtime configuration: loading a `config.json` at startup so one build artifact can be promoted across environments, instead of rebuilding per environment.',
          'Hosting: static files on S3 + CloudFront / Azure Blob + CDN / Nginx container; SPA fallback so deep links serve `index.html`.',
          'Caching: long cache headers for hashed JS/CSS, `no-cache` for `index.html`, CDN invalidation after deploy.',
          'SSR apps: deploying the Node server (Docker, Kubernetes, serverless) and health checks.',
          'Release management: tagging, release notes, feature flags, change requests, coordinating with backend deploy order.',
          'Post-deploy: smoke tests, watching error rates (Sentry, Datadog, App Insights), and rollback by redeploying the previous artifact.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# Example: static Angular deploy to S3 + CloudFront
ng build                                   # outputs dist/<app>/browser
aws s3 sync dist/my-app/browser s3://my-app-prod \\
  --delete --cache-control "public,max-age=31536000,immutable" --exclude index.html
aws s3 cp dist/my-app/browser/index.html s3://my-app-prod/index.html \\
  --cache-control "no-cache"
aws cloudfront create-invalidation --distribution-id ABC123 --paths "/index.html"`,
      },
      {
        type: 'code',
        lang: 'text',
        code: `# Nginx: SPA fallback so /orders/42 works on refresh
location / {
  try_files $uri $uri/ /index.html;
}`,
      },
      {
        type: 'flow',
        title: 'Build once, promote everywhere',
        code: `flowchart LR
  B["Build artifact<br/>(one per commit)"]:::server --> D["Dev"]:::client
  D --> Q["QA / Staging<br/>smoke + e2e"]:::highlight
  Q --> A{"Approval"}:::security
  A --> P["Production<br/>CDN invalidation"]:::db
  P --> M["Monitor errors<br/>+ Web Vitals"]:::external
  M -.->|"spike"| RB["Rollback to<br/>previous artifact"]:::queue`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"On [project] I owned frontend releases end to end. Our pipeline built the Angular app once, ran tests, and promoted the same artifact through [dev, QA and prod] on [AWS S3 + CloudFront]; environment values came from a runtime `config.json`, so we never rebuilt per environment. I set the cache headers — immutable for hashed bundles, no-cache for `index.html` — after we had an incident where users kept loading an old `index.html` that referenced deleted chunks. On release days I coordinated with the backend team on deploy order, ran smoke tests, and watched [Sentry] for 30 minutes. Once, [a third-party script broke checkout], and I rolled back within [10 minutes] by redeploying the previous artifact."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: "build once, deploy many" and "index.html must not be cached" are two details that instantly show real deployment experience.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Have you worked on CI/CD pipelines?' },
      {
        type: 'paragraph',
        text: 'Explain a pipeline you have worked on stage by stage — install (`npm ci`), lint, unit tests, build, e2e tests, artifact publishing, and deployment with approvals — name the tool (GitHub Actions, GitLab CI, Azure DevOps, Jenkins), and say what you personally added or improved, such as caching, parallel jobs, affected-only builds or quality gates.',
      },
      {
        type: 'paragraph',
        text: '**CI** (continuous integration) means every change is automatically built and tested on push or PR. **CD** means the tested artifact is automatically delivered to environments — continuous delivery (production needs a manual approval) or continuous deployment (fully automatic). The interviewer wants to see you understand the purpose of each stage and have edited a pipeline, not just watched it run.',
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          'Tool and trigger (PR, merge to main, tag).',
          'Stages and why each exists.',
          'Your contribution — something you built or improved, with a number.',
        ],
      },
      { type: 'heading3', text: 'Example: GitHub Actions for an Angular app' },
      {
        type: 'code',
        lang: 'yaml',
        code: `name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm              # caches ~/.npm between runs
      - run: npm ci               # clean, lockfile-exact install
      - run: npm run lint
      - run: npm test -- --watch=false --browsers=ChromeHeadless
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-prod:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    environment: production       # requires reviewer approval
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist }
      - run: ./scripts/deploy.sh`,
      },
      {
        type: 'flow',
        title: 'Typical frontend pipeline',
        code: `flowchart LR
  PR["Push / PR"]:::client --> I["npm ci<br/>(cached)"]:::server
  I --> L["Lint + type check"]:::server
  L --> T["Unit tests<br/>+ coverage"]:::server
  T --> B["Build + budgets"]:::highlight
  B --> E["E2E tests"]:::server
  E --> AR["Publish artifact"]:::db
  AR --> S["Deploy staging"]:::external
  S --> AP{"Approval"}:::security
  AP --> P["Deploy prod"]:::external`,
      },
      { type: 'heading3', text: 'Improvements worth mentioning' },
      {
        type: 'bullets',
        items: [
          'Dependency caching and `npm ci` instead of `npm install` for reproducible installs.',
          'Parallel jobs (lint, test, build) and test sharding to cut time.',
          'Nx/Turborepo "affected" commands so only changed projects are built and tested in a monorepo.',
          'Quality gates: coverage thresholds, bundle budgets, SonarQube, `npm audit` / dependency scanning.',
          'Preview deployments per PR so QA and designers can review before merge.',
          'Secrets stored in the CI secret store, never in the repository.',
        ],
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"Yes. On [project] we used [GitHub Actions / Azure DevOps]. Every PR ran lint, unit tests and a production build with bundle budgets; merges to main ran e2e tests with [Playwright], published the artifact, deployed to staging automatically and to production after approval. I [wrote the pipeline from scratch / took it over] and reduced the PR pipeline from [18] to [7] minutes by adding npm caching, running lint and tests in parallel and using Nx affected commands. I also added per-PR preview environments, which [cut QA feedback time from days to hours]."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: a single improvement with a before/after number ("18 → 7 minutes") is more convincing than listing every tool you have heard of.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Have you worked on resolving issues in CI/CD pipelines?',
      },
      {
        type: 'paragraph',
        text: 'Yes — describe a specific failure, how you diagnosed it from the logs, the root cause, and the permanent fix. Common real examples: "works locally, fails in CI" from Node/dependency version drift, flaky e2e tests, out-of-memory during the build, expired secrets/tokens, or cache corruption. Show a systematic approach: read the first real error, reproduce locally in the same environment, fix the root cause, and prevent recurrence.',
      },
      {
        type: 'paragraph',
        text: 'This question tests **troubleshooting under pressure** — a broken pipeline blocks the whole team. The interviewer looks for a calm, methodical process and fixes that address root causes rather than "I re-ran it until it passed".',
      },
      { type: 'heading3', text: 'Troubleshooting approach' },
      {
        type: 'numbered',
        items: [
          'Read the logs from the **first** error, not the last line — later errors are often consequences.',
          'Check what changed: the commit, the lockfile, the runner image, a dependency release, secrets expiry.',
          'Reproduce in the same environment (same Node version, Docker image, `CI=true`, clean `npm ci`).',
          'Fix the root cause, then add a guard (pin versions, retry policy for known-flaky infra, alert on expiry).',
          'Communicate: tell the team the pipeline is broken and when it is fixed.',
        ],
      },
      { type: 'heading3', text: 'Common issues and fixes' },
      {
        type: 'bullets',
        items: [
          '**Works locally, fails in CI:** different Node version → pin it with `.nvmrc` / `engines` and `setup-node`; lockfile out of sync → `npm ci` fails, regenerate and commit `package-lock.json`.',
          '**Peer dependency conflicts** after an upgrade: resolve versions properly instead of permanently adding `--legacy-peer-deps`.',
          '**JavaScript heap out of memory** on build: increase `NODE_OPTIONS=--max-old-space-size`, and investigate bundle growth.',
          '**Flaky e2e tests:** replace fixed `wait(2000)` with waiting for elements/network, isolate test data, quarantine and track flaky tests.',
          '**Case-sensitive imports:** passes on macOS/Windows, fails on Linux runners (`./UserService` vs `./user.service`).',
          '**Expired tokens / certificates** for registries or cloud deploy → rotate, and move to short-lived OIDC credentials where possible.',
          '**Stale cache** causing odd failures → bust the cache key (include the lockfile hash).',
        ],
      },
      {
        type: 'code',
        lang: 'yaml',
        code: `# Fix for "works on my machine": pin Node and key the cache on the lockfile
- uses: actions/setup-node@v4
  with:
    node-version-file: .nvmrc   # same version as developers use
    cache: npm                  # cache key includes package-lock.json hash
- run: npm ci
- run: npm run build
  env:
    NODE_OPTIONS: --max-old-space-size=4096   # fixed OOM on large builds`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"Yes, several times. One example: on [project] the main pipeline started failing on the build step with a heap out-of-memory error, blocking [15] developers. Reading the log, the build died during optimisation. Locally it passed because my machine had more memory. I reproduced it in the same [Docker image] and found a recent PR had [imported a whole icon library instead of individual icons], growing the bundle by [2 MB]. I unblocked the team by raising `max-old-space-size` temporarily, fixed the import to be tree-shakable, and added a bundle budget in `angular.json` so the build fails with a clear message if it grows again. Another time it was flaky Cypress tests — I replaced fixed waits with `cy.intercept` aliases and the flake rate dropped from [~20%] to near zero."',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: answers like "I just re-ran the job" or "I added --force". Interviewers want the root cause and the guard rail you added so it does not recur.',
      },
    ],
  },

  'working-across-teams-and-dependencies': {
    summary:
      'Yes — explain how you decoupled your work from the other team: agree an API contract early (OpenAPI or shared TypeScript types), build against mocks so you are not blocked, set up a regular sync and a single point of contact, track dependencies and risks visibly, and integrate early and often. Then give a STAR example with a concrete outcome.',
    details: [
      {
        type: 'paragraph',
        text: 'This tests collaboration, ownership and risk management across boundaries — vendors, client teams, or other companies with different time zones, priorities and processes. The interviewer wants proof that you proactively remove blockers instead of waiting and escalating late.',
      },
      { type: 'heading3', text: 'What the interviewer is looking for' },
      {
        type: 'bullets',
        items: [
          'You make dependencies **explicit** (contract, dates, owners) early.',
          'You find ways to keep working in parallel (mocks, feature flags, adapters).',
          'You communicate in writing and over-communicate status and risks.',
          'You escalate constructively with options, not blame.',
        ],
      },
      { type: 'heading3', text: 'Practical techniques' },
      {
        type: 'numbered',
        items: [
          '**Contract first:** agree the API in an OpenAPI/Swagger spec or shared interface definitions, versioned and reviewed by both teams.',
          '**Mock the dependency:** an HTTP interceptor, MSW (Mock Service Worker) or json-server returns contract-shaped data so the UI is built and tested before the real API exists.',
          '**Adapter layer:** map external DTOs to your own models so their changes touch one file.',
          '**Cadence:** a weekly cross-team sync, a shared channel, a dependency/RAID log with owners and dates.',
          '**Integrate early:** connect to their dev environment as soon as any endpoint exists; contract tests to detect breaking changes.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Build against the agreed contract while the partner team is still coding
export interface OrderDto { orderId: string; total_amount: number; status: 'NEW' | 'PAID' }

// Functional interceptor that serves mocks only in the mock environment
export const mockOrdersInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.useMocks && req.url.endsWith('/api/orders')) {
    const body: OrderDto[] = [{ orderId: 'A1', total_amount: 120, status: 'PAID' }];
    return of(new HttpResponse({ status: 200, body }));
  }
  return next(req);
};

// Adapter: their naming stays out of our components
export const toOrder = (d: OrderDto): Order => ({ id: d.orderId, total: d.total_amount, paid: d.status === 'PAID' });`,
      },
      {
        type: 'flow',
        title: 'Working in parallel without blocking',
        code: `sequenceDiagram
  participant FE as Our team (UI)
  participant BE as Partner team (API)
  FE->>BE: Agree OpenAPI contract + dates
  par Parallel work
    FE->>FE: Build UI against mocks
    BE->>BE: Implement API
  end
  BE-->>FE: Dev endpoint ready
  FE->>BE: Integration + contract tests
  BE-->>FE: Fixes / version bump
  FE->>BE: Joint UAT sign-off
`,
      },
      { type: 'heading3', text: 'Sample answer (STAR)' },
      {
        type: 'paragraph',
        text: '"**S:** On [project] my team built the [customer portal] in Angular, while the payments API was built by [a vendor / client\'s internal team] in [another country], [5.5] hours offset. **T:** We had to launch together in [12 weeks], and their API would only be ready in week [8]. **A:** In week one I set up a call to agree an OpenAPI contract and put it in a shared repo where changes required approval from both sides. I built the UI against an interceptor-based mock, wrapped their DTOs in an adapter, and kept a shared dependency tracker with owners and dates. We held a 30-minute weekly sync in our overlapping hours and used a shared Slack channel for everything else. When their auth flow slipped by two weeks, I raised it immediately with two options and we agreed to integrate the non-auth endpoints first. **R:** We integrated in [4 days] instead of the planned [2 weeks], launched on time, and the contract-first process was reused for [the next two vendor integrations]."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention one moment where something slipped and how you handled it. Smooth stories sound rehearsed; a recovered risk shows real ownership.',
      },
    ],
  },

  'ai-tools-you-use': {
    summary:
      'Yes — name the tools you actually use (e.g. GitHub Copilot, ChatGPT, Claude, Cursor) and, more importantly, **how**: for boilerplate, tests, refactoring, explaining unfamiliar code and drafting documentation — while you review every suggestion, never paste secrets or proprietary code into unapproved tools, and verify output against docs and tests. Mention a concrete productivity win.',
    details: [
      {
        type: 'paragraph',
        text: 'Interviewers ask this to gauge two things: are you keeping up with how software is built now, and do you use AI **responsibly**? The ideal answer shows real productivity gains plus healthy scepticism — you are the engineer, the AI is a tool.',
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          'Which tools, and in which contexts (IDE assistant, chat, code review, agents).',
          'Concrete use cases with an example.',
          'How you verify and stay safe (review, tests, company policy).',
          'Limits you have observed.',
        ],
      },
      { type: 'heading3', text: 'Good use cases to mention' },
      {
        type: 'bullets',
        items: [
          'Generating unit test scaffolding and edge cases for a service or component.',
          'Boilerplate: forms, DTO interfaces from a JSON sample, NgRx/SignalStore setup.',
          'Explaining legacy code or a cryptic RxJS chain before refactoring it.',
          'Migration help: converting `*ngIf` to `@if` or `@Input()` to `input()` across files (after running the official schematics).',
          'Writing regexes, SQL, shell scripts, commit messages and documentation drafts.',
          'Building AI features: calling an LLM API from a backend, prompt design, streaming responses to the UI.',
        ],
      },
      {
        type: 'code',
        lang: 'text',
        code: `Example prompt that gets useful output (context + constraints + format):

"Write Jasmine unit tests for this Angular 20 standalone component.
It uses signal inputs and inject(UserService).
Cover: empty list, API error, and the 'Load more' button disabling while loading.
Use TestBed with a mocked UserService. Do not use deprecated APIs."`,
      },
      { type: 'heading3', text: 'Responsible-use points' },
      {
        type: 'bullets',
        items: [
          'Review every line — AI can produce plausible but wrong code, outdated APIs, or invented functions.',
          'Run tests and linters; never merge AI code you could not explain in review.',
          'Follow company policy: approved tools only, no secrets, credentials or customer data in prompts.',
          'Watch for licence and security issues (e.g. insecure patterns, unsanitised HTML).',
        ],
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"Yes, daily. I use [GitHub Copilot] in [VS Code] for completions and its chat/agent modes for multi-file changes, and [ChatGPT / Claude] for explaining unfamiliar code and design discussions. On [project], I used it to generate the first draft of unit tests for [40] legacy services — I wrote the test plan, let the AI scaffold, and then fixed the assertions; coverage went from [35%] to [70%] in [two sprints]. I always review and run everything, and I follow our policy of not pasting [client] code into unapproved tools. I have also seen its limits: it once suggested a [deprecated RxJS operator / non-existent Angular API], which is why I verify against the official docs."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: pair every productivity claim with how you verify the output. "Faster, but I own the result" is exactly the balance hiring managers want to hear.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Difference between Ask, Agent, and Plan mode in GitHub Copilot',
      },
      {
        type: 'paragraph',
        text: '**Ask** mode answers questions and explains code without changing your files. **Agent** mode works autonomously: it decides which files to edit, makes multi-file changes, can run terminal commands and tests, and iterates on errors (with your approval for actions). **Plan** mode researches the task and produces a step-by-step implementation plan for you to review and refine before any code is written — then you hand the plan to Agent mode to implement.',
      },
      {
        type: 'paragraph',
        text: "These are chat modes in GitHub Copilot Chat (VS Code and other supported IDEs). They differ in **how much autonomy** Copilot has and **whether it may change your workspace**. There is also an Edit mode for targeted multi-file edits in files you choose; its role has been shrinking as Agent mode matured. Exact names and availability vary by IDE and Copilot version, so check your editor's mode picker.",
      },
      { type: 'heading3', text: 'Side-by-side' },
      {
        type: 'bullets',
        items: [
          '**Ask:** read-only Q&A. "Explain this interceptor", "What does `switchMap` do here?", "How should I structure this feature?". Output is an answer and code snippets you can copy or apply yourself.',
          '**Plan:** read-only planning. It analyses the codebase and the request, may ask clarifying questions, and outputs a structured plan (steps, files to touch, open questions). You iterate on the plan, then start implementation.',
          '**Agent:** autonomous execution. Given a goal ("add pagination to the orders page with tests"), it finds the relevant files, edits them, runs commands such as builds or tests, reads errors and fixes them, and can use tools/MCP servers. You review and accept or undo the changes.',
        ],
      },
      {
        type: 'flow',
        title: 'Choosing a mode',
        code: `flowchart TD
  Q{"What do you need?"}:::highlight -->|"Understand or ask"| A(["Ask mode<br/>no file changes"]):::client
  Q -->|"Large or unclear change"| P(["Plan mode<br/>review a step-by-step plan"]):::server
  Q -->|"Well-defined task"| G(["Agent mode<br/>edits, runs, iterates"]):::db
  P -->|"Plan approved"| G
  G --> R["You review diffs<br/>+ run tests"]:::security`,
      },
      { type: 'heading3', text: 'Example workflow for one feature' },
      {
        type: 'code',
        lang: 'text',
        code: `1) Ask:   "How is authentication handled in this Angular app?
           Which interceptor adds the token?"
           → explanation, no changes

2) Plan:  "Add refresh-token support so expired access tokens
           are refreshed once and failed requests retried."
           → plan: update auth.interceptor.ts, add refresh() to AuthService,
             queue concurrent requests, add tests, open question: logout on refresh failure?

3) Agent: "Implement the approved plan."
           → edits files, runs ng test, fixes a failing spec,
             shows the diff for review`,
      },
      { type: 'heading3', text: 'Key points' },
      {
        type: 'bullets',
        items: [
          'Autonomy and risk increase from Ask → Plan → Agent; so does the need to review carefully.',
          'Agent mode asks for confirmation before running terminal commands (configurable) — keep that on for anything destructive.',
          'Plan mode is valuable for big refactors: catching a wrong approach in a plan is cheaper than reviewing a wrong 20-file diff.',
          'Good context helps all modes: open relevant files, reference them in the prompt, and use repository custom instructions (e.g. `.github/copilot-instructions.md`) for project conventions.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: describe them by autonomy — "Ask explains, Plan proposes, Agent executes" — and add that you still review every diff and run the tests yourself. That framing shows both understanding and responsible use.',
      },
    ],
  },

  'tell-me-about-yourself': {
    summary:
      'Give a 60–90 second pitch in three parts: **present** (your current role, stack and one result you are proud of), **past** (the two or three experiences that explain how you got here), and **future** (why this role is the logical next step). Tailor every sentence to the job description — this is a pitch for the role, not your life story or a reading of your CV.',
    details: [
      {
        type: 'paragraph',
        text: 'This is almost always the first question, and it sets the frame for the whole interview. The interviewer is judging **communication** (can you be concise and structured?), **relevance** (do you understand what this role needs?) and **self-awareness** (do you know what you are good at?). Whatever you mention here becomes the menu they pick follow-up questions from — so mention the things you want to be asked about.',
      },
      { type: 'heading3', text: 'What the interviewer is looking for' },
      {
        type: 'bullets',
        items: [
          'A clear, confident summary in about 90 seconds — not 5 minutes.',
          'Evidence that matches the job description: the stack, the scale, the type of product.',
          'One or two concrete achievements with numbers, not a list of responsibilities.',
          'A believable reason why this role fits where you are heading.',
        ],
      },
      { type: 'heading3', text: 'Structure: present → past → future' },
      {
        type: 'numbered',
        items: [
          '**Present (~30 s):** "I am a [frontend / full-stack] engineer at [company] with [N] years of experience, currently working on [product] with [Angular, TypeScript, Node.js]." Add one recent achievement with a number.',
          '**Past (~30 s):** 2–3 steps that explain your growth — where you started, a key project, a skill you built. Skip anything irrelevant to this role.',
          '**Future (~20 s):** what you want next and why this company and role fit it. "That is why this role caught my attention — [specific reason from the job description]."',
        ],
      },
      { type: 'heading3', text: 'Tailoring checklist' },
      {
        type: 'bullets',
        items: [
          'Underline the top 3 requirements in the job description and make sure each appears in your pitch.',
          'Applying for a senior role? Mention ownership, mentoring or architecture decisions, not just tickets delivered.',
          'Applying for full-stack? Mention the backend side (Node.js APIs, databases) even if it is a smaller part of your work.',
          'Prepare a 30-second version too — some interviewers say "briefly".',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"I am a frontend engineer with [5] years of experience, currently at [company], where I work on [a B2B analytics platform] used by [20,000] users daily. I own the Angular side of [the reporting module] — recently I led its migration to standalone components and signals, which cut the initial load from [6 s] to [2.5 s]. I started my career at [previous company] building [internal dashboards] in Angular [8], where I learned the fundamentals of RxJS and testing, and over time I took on more full-stack work — I now build the [Node.js / NestJS] endpoints my features need. Recently I have also been mentoring [two] junior developers. What I am looking for next is a product company where frontend performance and architecture really matter, which is why this role stood out — [you are scaling the web app to new markets and the description mentions owning the design system]."',
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"Tell me more about [the migration / achievement] you mentioned." — have the STAR version ready.',
          '"What was your exact role in that?" — be precise about what you did versus the team.',
          '"Why are you looking for a change?" — have a positive answer ready (see that question).',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: reciting your CV line by line, starting with your school or hometown, going past 2 minutes, listing every technology you have touched, or ending without a link to the role. Also avoid a memorised script that sounds robotic — memorise the structure and the key numbers, not the sentences.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: end your pitch with a hook into the role ("…which is why this position stood out"). It gives the conversation a natural next step and shows you prepared for this specific company.',
      },
    ],
  },

  'star-method-for-behavioral-answers': {
    summary:
      'STAR stands for **Situation, Task, Action, Result**: set the context briefly, state what you were responsible for, spend most of the time on what **you** did and why, then give a measurable result — and finish with what you learned. Aim for about 2 minutes, use "I" rather than "we", and prepare a story bank of 5–6 real stories you can adapt to most behavioral questions.',
    details: [
      {
        type: 'paragraph',
        text: 'Behavioral questions ("Tell me about a time…") assume that past behaviour predicts future behaviour. The interviewer is scoring specific competencies — ownership, collaboration, handling conflict, dealing with ambiguity, learning from failure. STAR keeps your answer focused so the evidence for those competencies is easy to hear and write down.',
      },
      { type: 'heading3', text: 'The four parts (with time split)' },
      {
        type: 'bullets',
        items: [
          '**Situation (~15%):** where, when, what product, what was at stake. One or two sentences — just enough context.',
          '**Task (~10%):** your specific responsibility or goal. "I owned…", "I was asked to…".',
          '**Action (~50–60%):** the steps you took, the decisions you made and why, the alternatives you considered, how you worked with others. This is where you are actually scored.',
          '**Result (~15–20%):** the outcome with numbers (time saved, errors reduced, load time, revenue, deadline met) plus the reflection: what you learned or would do differently.',
        ],
      },
      { type: 'heading3', text: 'Rules that make STAR answers strong' },
      {
        type: 'numbered',
        items: [
          '**Use "I", not "we".** "We migrated the app" hides your contribution. Say "I proposed…, I built…, I convinced…", while still crediting the team.',
          '**Be specific.** One real incident with real details beats a generic "I always communicate well".',
          '**Quantify the result.** "Load time from [6 s] to [2 s]", "incidents from [8] to [1] per month", "released [3 days] early". If you have no exact number, give an honest estimate.',
          '**Add the reflection.** "What I would do differently is…" shows maturity, especially in failure and conflict stories.',
          '**Stop after about 2 minutes.** Let the interviewer dig in with follow-ups rather than covering everything.',
        ],
      },
      { type: 'heading3', text: 'Build a story bank' },
      {
        type: 'paragraph',
        text: 'Prepare 5–6 stories in advance and map each to the themes it can cover. Most behavioral questions are variations of the same handful of themes, so one well-prepared story can answer several questions.',
      },
      {
        type: 'bullets',
        items: [
          '**Conflict / disagreement:** a technical disagreement with a reviewer, PM or another team.',
          '**Failure / mistake:** a production bug, a missed estimate, a wrong technical bet.',
          '**Leadership / influence:** leading a migration, mentoring, driving a new practice without formal authority.',
          '**Ambiguity:** vague requirements, a POC with unknowns, a new domain.',
          '**Impact / achievement:** a performance win, a feature that moved a business metric.',
          '**Pressure / deadline:** a critical release, an incident, a last-minute change.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: 'Question: "Tell me about a time you improved performance." — "**S:** On [project], our Angular [order-management] app took [8 s] to become interactive on mid-range laptops, and [support tickets about slowness] were rising. **T:** I was asked to bring it under [3 s] before [the Q3 launch]. **A:** I first measured with Lighthouse and the bundle analyser and found a [4 MB] initial bundle — every feature was eagerly loaded and we imported [all of lodash and moment]. I split the app into lazy-loaded routes, replaced moment with [date-fns], added @defer for [the charts below the fold], and set bundle budgets in CI so it could not regress. I paired with [a teammate] on the routing changes so the knowledge was shared. **R:** Time to interactive dropped from [8 s] to [2.4 s], the bundle shrank by [60%], and [slowness tickets dropped by about half] in the next month. What I learned: measure first — my initial guess was the API, and I would have wasted a week on it."',
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"What would you do differently?" — always have an honest answer.',
          '"What did your teammates do?" — credit others accurately.',
          '"How did you measure that?" — know where your numbers came from.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: a 2-minute Situation and a 20-second Action; using "we" throughout; hypothetical answers ("I would…") when asked for a real example; no result, or a result with no number; and stories where you are a passive spectator.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: write your story bank down as bullet points (not scripts) and rehearse each one out loud once. When a question comes, take two seconds to pick the best-fitting story — a short pause is far better than a rambling answer.',
      },
    ],
  },

  'disagreeing-on-a-technical-decision': {
    summary:
      "Pick a real, professional disagreement about a technical trade-off — not a personality clash — and show that you listened, understood the other person's reasoning, used data or a small experiment instead of opinion, and committed to the final decision even if it was not yours. The result should include both the technical outcome and the working relationship staying healthy.",
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer is assessing **collaboration and maturity**: can you disagree without making it personal, change your mind when the evidence says so, and "disagree and commit" when the team chooses differently? They are also checking that you have opinions at all — a candidate who claims never to disagree sounds passive.',
      },
      { type: 'heading3', text: 'What the interviewer is looking for' },
      {
        type: 'bullets',
        items: [
          'You raised the concern respectfully and early, in the right forum.',
          'You sought to understand the other side before arguing your own.',
          'You moved from opinion to evidence: benchmarks, a spike, docs, user impact.',
          'You accepted the outcome and supported it fully — no "I told you so".',
        ],
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the project and the decision (e.g. NgRx vs a lighter signal-based store, a library choice, an API design).',
          '**Task:** your role and why the decision mattered (cost, timeline, maintainability).',
          '**Action:** how you understood their view, what evidence you gathered, how you discussed it (1:1, design doc, time-boxed spike), who decided.',
          '**Result:** what was decided, the measurable outcome, and the relationship afterwards.',
          '**Reflection:** what you learned about yourself or about handling disagreements.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"**S:** On [project], [a senior teammate] proposed adding NgRx Store to manage state for a new [settings module]. **T:** I was building that module and felt NgRx would add a lot of boilerplate for what was mostly form state with two API calls. **A:** Instead of arguing in PR comments, I asked for a 20-minute call to understand his reasoning — his real concern was consistency, because [the rest of the app] already used NgRx and new joiners would see two patterns. That was a fair point I had not weighed. I suggested a time-boxed spike: I built the same feature both ways in a day and compared lines of code, test effort and readability. The signal-based service was [about 60% less code], but I also wrote a short guideline on when to use each approach to address his consistency concern. We took both to the team\'s architecture sync and agreed: [NgRx for shared, cross-feature state; signal stores for local feature state]. **R:** The module shipped [a week earlier than estimated], the guideline became part of our [frontend handbook], and that teammate and I later co-led [the signals migration]. What I learned: most disagreements are about different priorities, not right vs wrong — finding the underlying concern resolves them faster than defending my solution."',
      },
      { type: 'heading3', text: 'Variations you can adapt' },
      {
        type: 'bullets',
        items: [
          'A reviewer requests a change you disagree with: discuss the why, agree, or escalate only if it is important.',
          'You were the one who was wrong: this can be an excellent story if you show how quickly you updated your view.',
          'Disagreement with a PM or designer about scope or UX: bring user data or an accessibility standard.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"What if the team had chosen the other option?" — "I would have committed to it and made it work."',
          '"Have you ever been wrong in a disagreement?"',
          '"How do you handle a reviewer who blocks your PR on style preferences?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: picking a story where the other person was simply incompetent, describing a heated argument with no resolution, "winning" at the cost of the relationship, or choosing something trivial like tabs vs spaces. Never badmouth the colleague by name or tone.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the strongest version includes a moment where you acknowledged the other person had a valid point. It shows you can be persuaded by evidence — which is exactly what makes someone easy to work with.',
      },
    ],
  },

  'missed-deadline-or-derailed-project': {
    summary:
      'Choose a real slip where you owned part of the cause, then show how you noticed early, communicated with options (cut scope, move the date, add help), recovered as much as possible, and changed your process afterwards. The interviewer cares less about the miss and more about transparency, ownership and what you learned.',
    details: [
      {
        type: 'paragraph',
        text: 'Every engineer misses deadlines. The interviewer is testing **honesty, ownership and judgment**: do you hide problems until the last day or raise them early? Do you blame others or own your part? Do you learn and change how you plan? A polished story with a real lesson scores higher than pretending it never happened.',
      },
      { type: 'heading3', text: 'What the interviewer is looking for' },
      {
        type: 'bullets',
        items: [
          'Early, honest communication — stakeholders heard about the risk from you, with options.',
          'Ownership of your part of the cause, without throwing teammates or other teams under the bus.',
          'Practical recovery: scope trade-offs, prioritisation, asking for help.',
          'A concrete process change that prevented it from happening again.',
        ],
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the project, the deadline and why it mattered.',
          '**Task:** what you were responsible for delivering.',
          '**What went wrong:** the cause, including your part (underestimated complexity, hidden dependency, scope creep).',
          '**Action:** when you noticed, who you told, the options you proposed, what you did to recover.',
          '**Result:** what was delivered and when, the impact, and what you changed afterwards.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"**S:** At [company], I was responsible for [the new checkout flow] in our Angular app, planned for [a 4-week] sprint cycle ahead of [a marketing campaign]. **T:** I had estimated the frontend work and committed to the date. **A:** At the end of week two I realised I had underestimated the [payment-provider integration] — their SDK did not support our [3-D Secure] flow without extra work, and I had not spiked it upfront. That was my mistake. The same day I told my lead and the PM, explained the gap was about [6 days], and offered three options: move the date, launch without [saved cards] and add it a sprint later, or bring in [a teammate] to parallelise the form validation work. They chose to cut saved cards. I split the remaining work into smaller tickets, gave daily status updates in the channel, and paired with the backend developer to unblock the 3-D Secure callback. **R:** The core checkout launched on the original date, saved cards followed [8 days] later, and the campaign was not affected. Since then, I always time-box a short spike on any third-party integration before estimating, and I flag risky assumptions in the estimate itself — on the next [two] integrations my estimates were within [10%]."',
      },
      { type: 'heading3', text: 'Recovery options worth naming' },
      {
        type: 'bullets',
        items: [
          '**Reduce scope:** ship the critical path first, defer nice-to-haves behind a feature flag.',
          '**Move the date:** with a new, realistic estimate and the reason.',
          '**Add capacity:** only if the work can genuinely be split — adding people late often slows things down.',
          '**Remove blockers:** escalate a dependency with a clear ask and deadline.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"How did you notice it was off track?"',
          '"How did the stakeholders react?"',
          '"What do you do now to avoid this?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: blaming the PM, the backend team or "changing requirements" for everything; choosing a story where you were not involved in the cause; claiming you have never missed a deadline; or a story where you stayed silent until the deadline passed.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the key sentence is "I raised it as soon as I knew, with options". If your story has that moment and a process change at the end, a missed deadline becomes evidence of good judgment.',
      },
    ],
  },

  'production-bug-you-caused': {
    summary:
      'Own it clearly ("I shipped a change that…"), then walk through the incident response: immediate mitigation (rollback, feature flag, hotfix), clear communication with the team and stakeholders, root-cause analysis, and the prevention you added — tests, alerts, review checklist. Keep the tone blameless and factual, and finish with what you learned.',
    details: [
      {
        type: 'paragraph',
        text: 'This question tests **ownership, calm under pressure and engineering maturity**. Everyone who ships code ships bugs; the interviewer wants to see that you prioritise users (stop the bleeding first), communicate instead of hiding, fix the cause rather than the symptom, and improve the system so the same class of bug cannot recur.',
      },
      { type: 'heading3', text: 'What the interviewer is looking for' },
      {
        type: 'bullets',
        items: [
          '**Ownership:** you say "I caused it" without excuses or blaming QA for not catching it.',
          '**Mitigation first:** restore service before investigating in depth.',
          '**Communication:** you told the team, support and stakeholders what was happening and when it would be fixed.',
          '**Root cause and prevention:** a test, alert, monitoring or process change — not just "I was more careful".',
          '**Blameless mindset:** focus on why the system allowed the bug, not on guilt.',
        ],
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Situation:** what you shipped and how the bug showed up (alert, user report, error spike).',
          '**Impact:** who was affected, how many, for how long.',
          '**Mitigation:** rollback, feature flag off, hotfix — and how fast.',
          '**Communication:** who you informed and how often.',
          '**Root cause:** why it happened and why it was not caught.',
          '**Prevention and lessons:** tests, alerts, review changes, and what you personally do differently.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: "\"**S:** At [company], I refactored the HTTP interceptor in our Angular app to add [token refresh]. It passed review and tests and went out on [a Thursday release]. **Impact:** about [30 minutes] later, [Sentry] showed a spike of 401 errors — users whose sessions expired were stuck in a loop and logged out, roughly [8%] of active users. **A:** I recognised my change from the stack trace, told the on-call channel 'this is from my interceptor change, I am rolling back', and we redeployed the previous build within [15 minutes]. I posted updates in the incident channel and gave support a short message for affected users. Then I reproduced it locally: when several requests failed at once, each triggered its own refresh, and the later refreshes invalidated the earlier token. Our tests only covered a single request. I fixed it by queueing concurrent requests behind one refresh call, added unit tests for parallel 401s and an e2e test with an expired token, and we added an alert on the 401 rate. **R:** The fix shipped [the next day] with no recurrence, and in the blameless post-mortem we added 'auth and interceptor changes need a concurrency test' to our PR checklist. My lesson: test the failure paths under realistic conditions, not just the happy path — and roll back first, debug second.\"",
      },
      { type: 'heading3', text: 'Prevention ideas worth mentioning' },
      {
        type: 'bullets',
        items: [
          'Feature flags and gradual rollouts (canary, percentage rollout) to limit blast radius.',
          'Error monitoring and alerts (Sentry, Datadog, Application Insights) on error rate and key user journeys.',
          'Tests for edge cases that caused the bug: concurrency, empty data, slow network, expired sessions.',
          'A tested, one-click rollback path.',
          'Post-mortems focused on systems and processes, shared with the team.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"How did you find out about the bug?"',
          '"Why was it not caught in review or testing?"',
          '"What would you do if you could not roll back?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: picking a trivial bug (a typo in a label), blaming QA or the reviewer, describing a heroic all-night fix without mentioning mitigation or prevention, or claiming you have never caused a production bug — that signals either little production experience or a lack of honesty.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "I caused it" in the first sentence. It disarms the question immediately and lets you spend the rest of the time on the part that impresses: fast mitigation, clear communication and lasting prevention.',
      },
    ],
  },

  'giving-and-receiving-code-review-feedback': {
    summary:
      'When giving feedback, be kind and specific: comment on the code, not the person, explain the why, ask questions rather than issue commands, and clearly separate blocking issues from nits. When receiving it, assume good intent, do not get defensive, ask for clarification, and either change the code or explain your reasoning — then take larger debates to a quick call.',
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer is checking whether you raise the quality bar **and** make the team better to work in. Code review is where collaboration happens daily: harsh or vague reviews slow teams down, and defensive authors stop learning. A good answer has a clear personal approach, concrete examples of comments, and an example of feedback you received and acted on.',
      },
      { type: 'heading3', text: 'Giving feedback' },
      {
        type: 'bullets',
        items: [
          '**Review the right things first:** correctness, security, edge cases, design and readability matter more than style (let Prettier and ESLint handle formatting).',
          '**Explain the why:** "This subscription is never unsubscribed, so the component leaks on navigation — could we use takeUntilDestroyed or toSignal here?"',
          '**Label severity:** "blocking:", "suggestion:", "nit:", "question:" — the author knows what must change before merge.',
          '**Ask, do not command:** "What do you think about extracting this into a service?" invites discussion.',
          '**Praise good work:** a short "nice approach to caching here" makes critical comments easier to accept.',
          '**Keep it timely:** review within [a day]; large PRs left for days block the author.',
          '**Move long threads offline:** after 2–3 back-and-forths, a 10-minute call is faster.',
        ],
      },
      { type: 'heading3', text: 'Receiving feedback' },
      {
        type: 'bullets',
        items: [
          'Assume good intent — the reviewer is improving the code, not judging you.',
          'Ask for clarification if a comment is unclear instead of guessing.',
          'Accept good suggestions quickly; if you disagree, explain your reasoning with evidence.',
          'Separate ego from code: "my PR" is the team\'s code once merged.',
          'If the same comment appears repeatedly, turn it into a lint rule or a team guideline.',
          'Make PRs easy to review: small, focused, with a clear description and screenshots for UI changes.',
        ],
      },
      { type: 'heading3', text: 'Structure for the answer' },
      {
        type: 'numbered',
        items: [
          'Your principles for giving feedback (2–3 points).',
          'Your principles for receiving feedback (2–3 points).',
          'One concrete example — ideally feedback you received that changed how you work.',
          'Any process improvement you drove (templates, checklists, automation).',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"When I review, I focus on correctness, edge cases and maintainability first, and I prefix comments with blocking, suggestion or nit so the author knows what actually needs to change. I always try to explain the why — for example, rather than writing \'use OnPush\', I explain that this list re-renders on every keystroke and link our performance guideline. On receiving feedback, one example stands out: early at [company], a senior reviewer pointed out that my [Angular forms] code mixed validation logic into the component, making it hard to test. My first instinct was to defend it, but after a quick call I saw her point, refactored the validators into pure functions and our test coverage on that module went from [40%] to [85%]. Since then I treat review comments as free mentoring. On my current team I also introduced a PR template with a checklist and screenshots section, which [cut review round-trips by roughly a third] because reviewers had the context upfront."',
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"What do you do if a reviewer keeps blocking your PR on preferences?"',
          '"How do you review a very large PR?" — ask to split it, or review in a call.',
          '"How do you give feedback to a more senior developer?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: saying you approve quickly to avoid slowing people down, focusing only on formatting, describing reviews as "finding mistakes", or admitting you get frustrated by comments without showing how you handle it.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: quote an actual comment you would write, including its label and the why. A single realistic example ("nit: …", "blocking: …") shows your review style far better than general statements about being constructive.',
      },
    ],
  },

  'mentoring-a-junior-developer': {
    summary:
      'Describe a specific person and situation, how you understood what they needed, and how you helped them grow rather than doing the work for them — pairing, guided questions, small ownership, regular feedback. End with a measurable outcome for them and the team (they shipped a feature independently, onboarding time dropped) and what mentoring taught you.',
    details: [
      {
        type: 'paragraph',
        text: 'This tests **leadership without authority, communication and patience** — essential for senior roles. The interviewer wants to see that you invest in others, adapt to how they learn, and measure success by their growth rather than by how much you know. Even if you have never been a formal mentor, onboarding a new joiner or helping a teammate through a tough bug counts.',
      },
      { type: 'heading3', text: 'What the interviewer is looking for' },
      {
        type: 'bullets',
        items: [
          'You noticed the need (or were asked) and took initiative.',
          'You taught rather than fixed — the person ended up able to do it alone.',
          'You adapted your approach to their level and learning style.',
          'There was a visible outcome: confidence, speed, quality, independence.',
        ],
      },
      { type: 'heading3', text: 'Structure' },
      {
        type: 'numbered',
        items: [
          '**Situation:** who they were (role, experience) and the challenge (new to Angular, struggling with RxJS, slow PRs).',
          '**Task:** your role — assigned mentor, buddy, or you stepped in.',
          '**Action:** what you did over time — pairing, explaining concepts, gradually increasing ownership, giving feedback.',
          '**Result:** their progress with specifics, and the effect on the team.',
          '**Reflection:** what you learned about teaching or about your own understanding.',
        ],
      },
      { type: 'heading3', text: 'Mentoring techniques worth naming' },
      {
        type: 'bullets',
        items: [
          '**Pair programming** with them driving — you navigate and ask questions.',
          '**Guided questions** instead of answers: "What do you expect this observable to emit? Let\'s log it."',
          '**Right-sized ownership:** start with a small, well-defined ticket, then a full feature.',
          '**Regular 1:1s** (e.g. 30 minutes weekly) to discuss blockers and goals.',
          '**Reviews as teaching:** explain the why, link docs, suggest reading.',
          '**Safe space:** make it normal to ask "stupid" questions.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"**S:** At [company], [a junior developer] joined our team from a [React / backend] background and was struggling with RxJS — her PRs had nested subscriptions and kept coming back with [10+] review comments, which was hurting her confidence. **T:** My lead asked me to be her onboarding buddy for [the first three months]. **A:** I set up a weekly 30-minute session and started with the concepts she found hardest — the difference between switchMap, mergeMap and concatMap — using a small search-box example from our own code. I paired with her on two tickets where she drove and I only asked questions. I then gave her ownership of [the notifications feature], with me as the reviewer, and in reviews I explained the why and linked our internal guide. I also wrote that guide — [a two-page RxJS cheat sheet] — because I realised others had the same gaps. **R:** Within [two months] her PRs were averaging [1–2] comments, she shipped [the notifications feature] on her own, and the cheat sheet is now part of every frontend onboarding. Personally, explaining the operators made my own understanding much sharper, and I learned to hold back from just giving the answer."',
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"How did you balance mentoring with your own deadlines?"',
          '"What did you do when they were not improving?"',
          '"How do you mentor someone who is more senior in another area?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: a story where you simply fixed their bug for them, a condescending tone about the junior, no measurable outcome, or taking credit for their success instead of describing your contribution.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention something that scaled beyond one person — a guide, a checklist, an onboarding doc, a lunch-and-learn. It turns a kind act into evidence of senior-level impact on the whole team.',
      },
    ],
  },

  'estimating-and-when-estimates-are-wrong': {
    summary:
      'Break the feature into small tasks, estimate each with a range (or a three-point optimistic / likely / pessimistic estimate), and explicitly include testing, code review, integration, deployment and a buffer for unknowns — spiking anything risky first. When you discover the estimate is wrong, communicate immediately with a revised estimate and options (cut scope, move the date, add help), then feed what you learned back into the next estimate.',
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer is assessing **planning skill and trustworthiness**. Nobody estimates perfectly; what matters is a systematic method, honesty about uncertainty, and early communication when reality changes. Teams can plan around a developer who says "3–5 days, the risk is the payment API" — they cannot plan around one who says "2 days" and delivers in 8 without warning.',
      },
      { type: 'heading3', text: 'A practical estimation process' },
      {
        type: 'numbered',
        items: [
          '**Clarify scope:** acceptance criteria, designs, edge cases, non-functional needs (performance, accessibility, i18n). Ambiguity is the biggest source of error.',
          '**Break it down:** split into tasks of roughly half a day to two days — UI components, state, API integration, backend endpoint, tests, docs.',
          '**Identify unknowns:** new library, third-party API, legacy code you have not touched. Time-box a spike before committing.',
          '**Estimate each task with a range:** use three-point estimation (optimistic, most likely, pessimistic) for risky items.',
          '**Add the hidden work:** unit and e2e tests, code review cycles, QA fixes, deployment, meetings and context switching.',
          '**Compare with history:** how long did a similar feature actually take last time?',
          '**Communicate the estimate with its assumptions and risks:** "4–6 days, assuming the API contract is ready by [date]".',
        ],
      },
      { type: 'heading3', text: 'Three-point estimation (quick formula)' },
      {
        type: 'paragraph',
        text: 'For a risky task: expected ≈ (optimistic + 4 × likely + pessimistic) / 6. Example: integrating a payment SDK — optimistic 2 days, likely 3, pessimistic 8 → (2 + 12 + 8) / 6 ≈ 3.7 days. The gap between optimistic and pessimistic tells everyone how uncertain the task really is.',
      },
      { type: 'heading3', text: 'When the estimate turns out wrong' },
      {
        type: 'bullets',
        items: [
          '**Notice early:** check progress against the plan daily; if half the time is gone and less than half the work is done, it is already off track.',
          '**Communicate immediately:** tell your lead / PM as soon as you know, not at the deadline.',
          '**Bring options:** reduce scope (ship the core, defer the rest), move the date, or get help on a parallelisable part.',
          '**Re-plan with a new estimate** based on what you now know.',
          '**Learn:** compare estimate vs actual in the retro and adjust how you estimate similar work.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: "\"For a feature like [a bulk-edit table in our Angular app], I start by clarifying the acceptance criteria with the PM and designer, then break it into tasks: the table component with selection, the edit dialog with reactive form validation, the [Node.js] bulk-update endpoint, error handling for partial failures, unit and e2e tests, and review. I estimate each as a range and add a buffer for anything new — here, partial-failure handling was unclear, so I did a half-day spike first. My estimate was [6–8 days]. Midway I found the backend needed [a database migration for audit logs] that nobody had planned, adding about [3 days]. I flagged it in stand-up that day, and proposed shipping bulk edit without the audit history first, behind a feature flag, with audit following in the next sprint. The PM agreed, we released on time, and audit followed [a week] later. Since then I always ask 'does this need data or audit changes?' during breakdown — that question is now on our team's refinement checklist.\"",
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"Do you prefer story points or time?" — explain your team\'s approach and that both need breaking down.',
          '"What if the manager pushes back on your estimate?" — explain the assumptions and offer a smaller scope for the requested date.',
          '"How accurate are your estimates usually?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: giving a single optimistic number, estimating only the coding time, padding secretly instead of stating risks openly, and staying silent when behind because you hope to catch up.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "I estimate in ranges and state my assumptions" — then show the moment you raised a slip early with options. Those two habits are exactly what makes an engineer predictable and trusted.',
      },
    ],
  },

  'why-change-jobs-why-this-company': {
    summary:
      'Frame the move positively as moving **towards** something — bigger technical challenges, a product you care about, more ownership — rather than running **away** from your current employer. Then show you have researched this company: name something specific about its product, engineering practices or challenges, and connect it directly to your experience and to what the role needs.',
    details: [
      {
        type: 'paragraph',
        text: 'The interviewer is checking **motivation and fit**: will you be engaged here, will you stay, and are your reasons healthy? They are also looking for red flags — bitterness about your current company, purely financial motivation, or a generic answer that could apply to any employer.',
      },
      { type: 'heading3', text: 'Part 1: why you are looking for a change' },
      {
        type: 'bullets',
        items: [
          '**Growth:** "I have learned a lot in [N] years, and I want to work on [larger scale / harder problems / architecture]."',
          '**Product or domain:** "I want to work on a product used directly by customers, not internal tools."',
          '**Ownership:** "I want end-to-end ownership of features, including the backend."',
          '**Technology:** "I want to work with modern Angular / signals / a performance-critical app" — only if true.',
          '**Honest circumstances:** a reorganisation, project ending or relocation can be stated plainly and briefly.',
        ],
      },
      { type: 'heading3', text: 'Part 2: why this company' },
      {
        type: 'numbered',
        items: [
          '**Research first:** the product (try it), recent news, funding or launches, the engineering blog, tech stack, Glassdoor and LinkedIn for team size and culture.',
          '**Pick 1–2 specific reasons:** a product you find valuable, a technical challenge (scale, real-time, accessibility), an engineering practice (testing culture, open source, design system).',
          '**Connect to yourself:** "You are [scaling to new markets], and I have [built i18n and performance work for an app with N users]."',
          '**Connect to the role:** show what you will contribute in the first months.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"I have been at [current company] for [3] years and I have grown a lot — I led [the Angular 19 migration] and built [our component library]. The product is now mostly in maintenance mode, though, and I want to work somewhere the frontend is a core part of the product and is still scaling. That is what attracted me here. I have used [your product] and read your engineering blog post about [moving to micro-frontends / improving Core Web Vitals], which is exactly the kind of problem I enjoy — on my current project I [reduced load time from 6 s to 2 s with lazy loading and @defer]. The role also mentions [owning the design system and mentoring], which matches what I have been doing and where I want to grow. So it feels like a place where I can contribute from the start and keep learning."',
      },
      { type: 'heading3', text: 'Reframing negative reasons' },
      {
        type: 'bullets',
        items: [
          '"My manager micromanages" → "I am looking for more ownership and autonomy over technical decisions."',
          '"The codebase is a mess and nobody cares" → "I want a team that invests in engineering quality — testing, reviews, modern practices."',
          '"I am underpaid" → focus on growth and scope; discuss compensation in the salary conversation, not here.',
          '"Layoffs / restructuring" → state it factually in one sentence; it is common and not a red flag.',
        ],
      },
      { type: 'heading3', text: 'Likely follow-ups' },
      {
        type: 'bullets',
        items: [
          '"What do you know about our product?"',
          '"What would make you stay at your current company?"',
          '"Where do you see yourself in [3] years?"',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: badmouthing your current employer, manager or colleagues; "I want more money" as the main reason; a generic answer ("you are a great company with great culture") that shows no research; or confusing the company with a competitor.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: prepare one specific fact about the company that most candidates would not mention — a recent feature, a blog post, a talk by their engineers — and link it to something you have done. Specificity is what makes "why us" sound genuine.',
      },
    ],
  },

  'questions-to-ask-the-interviewer': {
    summary:
      'Always ask 2–3 thoughtful questions — it shows genuine interest and helps you decide whether the job is right for you. Good topics are the team and how it works, engineering practices (reviews, testing, releases), what success looks like in the first 90 days, and the biggest current challenges. Avoid opening with salary, leave or remote-work perks in early rounds; save those for HR or the offer stage.',
    details: [
      {
        type: 'paragraph',
        text: '"Do you have any questions for us?" is part of the evaluation. Saying "no, I think you covered everything" can signal low interest. Thoughtful questions show curiosity, seniority and that you are evaluating them too — and the answers give you real information about whether you would enjoy the job.',
      },
      { type: 'heading3', text: 'About the team and role' },
      {
        type: 'bullets',
        items: [
          '"What does a typical week look like for someone in this role?"',
          '"How is the team structured — how many frontend, backend and QA engineers, and who would I work most closely with?"',
          '"What would success look like for me in the first 90 days?"',
          '"What are the biggest challenges the team is facing right now?"',
        ],
      },
      { type: 'heading3', text: 'About engineering practices' },
      {
        type: 'bullets',
        items: [
          '"How does code review work here, and how long does a PR typically take to merge?"',
          '"How do you approach testing — unit, e2e, and who owns quality?"',
          '"How often do you release, and what does the deployment process look like?"',
          '"Which Angular version are you on, and how do you handle upgrades and technical debt?"',
          '"How are technical decisions made — is there an architecture review or RFC process?"',
        ],
      },
      { type: 'heading3', text: 'About growth and culture' },
      {
        type: 'bullets',
        items: [
          '"How do engineers grow here — is there a career framework, mentoring or learning budget?"',
          '"What do you personally enjoy most about working here?"',
          '"How does the team handle production incidents and on-call?"',
        ],
      },
      { type: 'heading3', text: 'Questions to avoid early on' },
      {
        type: 'bullets',
        items: [
          '**Only salary, bonus, leave or perks** in a first technical round — not wrong to care, but ask HR or wait for the offer stage.',
          '**Things easily found online:** "What does your company do?"',
          '**Yes/no questions** that end the conversation quickly.',
          '**"Did I get the job?"** — instead ask "What are the next steps in the process?"',
        ],
      },
      { type: 'heading3', text: 'Matching questions to the interviewer' },
      {
        type: 'bullets',
        items: [
          '**Engineer:** codebase, tools, reviews, what they like and find hard.',
          '**Engineering manager:** team goals, expectations for the role, how performance is measured.',
          '**HR / recruiter:** process, timeline, compensation and benefits — this is the right place.',
          '**Director / founder:** product direction, priorities for the next year.',
        ],
      },
      { type: 'heading3', text: 'Sample answer (replace the placeholders)' },
      {
        type: 'paragraph',
        text: '"Thanks — I have a few. First, what would success look like for this role in the first 90 days? Second, you mentioned [migrating to signals / the new design system] earlier — what is the biggest challenge the team is facing with that right now? And finally, how does the team handle code review and releases — how often do you ship to production? … And what are the next steps in the process?"',
      },
      { type: 'heading3', text: 'Tips' },
      {
        type: 'bullets',
        items: [
          'Prepare 5–6 questions in advance; some will be answered during the interview.',
          'Reference something from the conversation — it shows you were listening.',
          'Listen to the answer and ask a short follow-up; it becomes a conversation, not a checklist.',
          'Watch for red flags in answers: no testing, constant firefighting, unclear ownership.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common mistakes: having no questions, asking only about salary and leave in an early technical round, asking ten questions when time is up, or asking something the interviewer explicitly covered ten minutes ago.',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: "What would success look like in the first 90 days?" is one of the best questions you can ask — it shows you are already thinking about delivering, and the answer tells you exactly what to emphasise in any remaining rounds.',
      },
    ],
  },

  'tech-debt-vs-new-features': {
    summary:
      'Show that you treat tech debt as a business decision, not a matter of taste. Explain how you make the cost of the debt visible (slower delivery, incidents, onboarding pain), tie the fix to an outcome product cares about, and negotiate a sustainable rhythm instead of a big-bang rewrite. Back it with a real example where you got debt work prioritised.',
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Whether you can **quantify** debt in terms the business understands: lead time, incident count, on-call load, time to onboard.',
          'Whether you balance both sides, rather than always wanting to refactor or always shipping features.',
          'How you **negotiate** with product: trade-offs, options, small increments, not ultimatums.',
          'Whether you can tell harmful debt (in code that changes often or breaks often) from harmless debt (ugly but stable code nobody touches).',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** a codebase where debt was slowing a specific area down, with a concrete symptom.',
          '**Task:** you needed to keep delivering features and fix the root cause.',
          "**Action:** how you measured the cost, which debt you picked (high change frequency × high pain), how you sold it (attached to a roadmap item, a budget such as one engineer-week per sprint, or the 'boy scout rule' within feature work), and how you kept it incremental.",
          '**Result:** a measured improvement (cycle time, bug count, deploy frequency) and what product gained.',
          '**Reflection:** the rule of thumb you now use.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"On our order-management platform (Angular front end, Node/Express API, MongoDB), every change to pricing took about two weeks and caused a regression roughly every other release. The pricing logic was duplicated in three Express services and the Angular checkout, with no tests. Product wanted three new discount types that quarter.',
      },
      {
        type: 'paragraph',
        text: "Instead of asking for a 'refactoring sprint', I pulled the numbers from Jira and our incident log: six pricing incidents in two quarters and an average of nine days of lead time for pricing tickets, against three for the rest of the system. I proposed to product that we build the first new discount type on top of a single, tested pricing module, and migrate the old rules into it as part of that same feature. It added about a week to the first discount and nothing to the next two. We shipped all three discount types that quarter, pricing lead time dropped to about four days, and we had no pricing incidents in the following two releases. Since then I always attach debt work to a feature that touches the same code, and I keep a small debt register with the cost of each item so the conversation with product starts from data.\"",
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "The code was messy, so I convinced the team to rewrite it." **Strong:** "Pricing changes took three times longer than anything else and caused six incidents, so I attached the fix to the next pricing feature."',
          '**Weak:** treating product as the obstacle. **Strong:** giving product options with costs, and letting them choose.',
          '**Weak:** a big-bang rewrite with no checkpoint. **Strong:** incremental migration with something shippable every sprint.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"What if product says no?" — Accept it, record the risk and its cost, revisit with new data after the next incident or slowdown; escalate only when the risk is serious.',
          '"How do you stop debt building up again?" — Definition of done includes tests, lint rules for known anti-patterns, a small budget per sprint, and reviews that flag new shortcuts.',
          '"Which debt do you leave alone?" — Stable code that rarely changes, even if it is ugly.',
          '"How do you track it?" — A visible register with impact and rough cost, reviewed in planning.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Arguing from code aesthetics instead of delivery or reliability impact.',
          'Proposing a full rewrite as the first option.',
          'Framing it as engineering versus product.',
          'No measurable result at the end of the story.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you talk about debt as interest the business is already paying, pick the debt with the highest change frequency and pain, and fold the fix into feature work so product never has to choose between the two.',
      },
    ],
  },
  'pushing-back-on-product': {
    summary:
      'Pick a story where you disagreed with a date or a requirement for a concrete reason (risk, user harm, hidden cost), raised it early, and came with options instead of a flat no. Show that you understood the business goal behind the request and that the outcome served it better. End with how the relationship with product stayed strong.',
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Courage to say no, combined with **business understanding**: why did product want this, and by when?',
          'Whether you bring **options** (cut scope, phase it, add people, accept a risk explicitly) rather than complaints.',
          'Timing: you raised it as soon as you knew, not the day before the deadline.',
          'Whether you commit fully once a decision is made, even if it went against you.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the request, the date and who asked for it.',
          '**Task:** what made it unrealistic or risky, with evidence (estimate, dependency, security or compliance risk).',
          '**Action:** how you found the goal behind the request, the options you proposed with their trade-offs, and how the decision was made.',
          '**Result:** what shipped, when, and the outcome for users or the business.',
          '**Reflection:** what you now do earlier to avoid the situation.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"Our product manager committed to a partner that we would launch a public REST API for order status within three weeks, including API-key management and webhooks. When I broke it down with the team, the full scope was closer to seven weeks, mostly because of webhook delivery with retries and signing, which we had never built.',
      },
      {
        type: 'paragraph',
        text: 'I asked what the partner actually needed on day one. It turned out they only needed to poll order status; webhooks were a nice-to-have for later. I proposed three options in a one-page doc: the full scope in seven weeks; read-only polling endpoints with API keys in three weeks and webhooks four weeks later; or the full scope in three weeks without signed webhooks, which I recommended against because it would expose partners to spoofed events. Product chose the second option and told the partner. We shipped polling on time with rate limiting and keys, and webhooks five weeks later with signatures and retries. The partner integration went live on the original date, and the PM later asked me to review estimates before external commitments. Now I ask to be in the room before dates are promised externally."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I told them the deadline was impossible." **Strong:** "I found what the partner needed on day one and offered three options with costs."',
          '**Weak:** pushing back late, after quietly trying to hit the date. **Strong:** raising the risk within days, with a breakdown.',
          '**Weak:** the story ends with you being right. **Strong:** it ends with the user or business outcome and a better process.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"What if product had insisted on the full scope?" — Make the risk explicit in writing, agree what would be cut if it slipped, then commit and execute.',
          '"Have you ever pushed back and been wrong?" — A good follow-up story: show you updated quickly.',
          '"How do you push back on a senior stakeholder?" — Same approach, with more preparation and data, and in private first.',
          '"How do you avoid this happening again?" — Engineering input before external commitments, and rough sizing early.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Presenting product or management as unreasonable.',
          'Saying no without alternatives.',
          'A story where you simply worked overtime to hit the date; that shows effort, not judgement.',
          'No business outcome in the result.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate the goal from the requested solution, offer phased options with their risks, and make the trade-off a shared decision with product rather than a fight.',
      },
    ],
  },
  'leading-a-migration-or-big-refactor': {
    summary:
      'Pick a migration you owned end to end, such as AngularJS to Angular, a module to standalone components, Express to NestJS, a database move, or a monolith split. Show how you planned it in safe increments, kept shipping features during it, measured progress, and handled what went wrong. The interviewer wants evidence that you can run long, risky technical work without stopping the business.',
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Planning: inventory, sequencing, and a clear definition of done.',
          '**Risk management:** incremental steps, feature flags, dual-running, rollback paths, and tests before changes.',
          'Leadership: how you brought the team along, split the work, and kept momentum over months.',
          'Communication with stakeholders: progress, trade-offs, and what users would notice.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** what was being migrated and why it mattered (support ending, performance, delivery speed).',
          '**Task:** your role and constraints (no feature freeze, a deadline, team size).',
          '**Action:** the plan (strangler approach, codemods, the order of modules), safety nets (characterisation tests, canary releases, metrics), and how you tracked progress.',
          '**Result:** completion, measured improvements, and incidents avoided or handled.',
          '**Reflection:** what you would do differently.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"I led the migration of our admin portal from AngularJS to Angular, about 140 screens, with a team of five, without freezing feature work. We used the hybrid approach with ngUpgrade so both frameworks ran in one app, and migrated route by route, starting with low-traffic leaf screens to prove the pattern and the build pipeline.',
      },
      {
        type: 'paragraph',
        text: 'Before touching a screen, we added Cypress smoke tests for its main flows. Each migrated route shipped behind a feature flag and was enabled for internal users first, then everyone. I kept a dashboard of migrated routes, bundle size and error rate per route, and reviewed it in every sprint review so stakeholders could see progress. Halfway through we found that two shared directives held most of the remaining complexity; I paused new screens for one sprint so two of us could rewrite them properly, which unblocked the rest. The migration took nine months, two fewer than planned. We had one production issue, a date-format regression on a single screen, caught within an hour and fixed by switching its flag back. In hindsight I would have built the shared component library first."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "We rewrote it from scratch over six months." **Strong:** "We migrated route by route behind flags, so users always had a working app."',
          '**Weak:** no measure of progress. **Strong:** a dashboard of routes done, error rate and bundle size.',
          '**Weak:** everything went perfectly. **Strong:** a real problem, how you spotted it, and how you adjusted the plan.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"How did you decide the order?" — Low risk first to prove the pattern, then by business value or dependency.',
          '"How did you keep shipping features?" — New features built in the new stack only; a migration budget each sprint.',
          '"How did you know you were done?" — A clear exit criterion: the old dependency fully removed and its build step deleted.',
          '"What would you do differently?" — Name one real lesson.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Describing a big-bang rewrite with a cut-over date and no fallback.',
          'No tests before the refactor, so no way to prove behaviour stayed the same.',
          'Leaving out the people side: how work was shared and momentum kept.',
          'Ending without removing the old system, so you are left running two stacks indefinitely.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: "Senior signal: you migrate in small, reversible steps with tests first and measurable progress, keep the business shipping throughout, and define 'done' as the old system actually deleted.",
      },
    ],
  },
  'running-an-incident-and-post-mortem': {
    summary:
      "Choose an incident where you were the one coordinating, not only fixing. Walk through how you stabilised first (rollback or mitigation), communicated clearly, found the root cause afterwards, and ran a blameless post-mortem whose action items actually got done. This differs from 'a bug you caused': the focus is how you led the response.",
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Calm prioritisation: **mitigate first, investigate later**.',
          'Clear roles and communication: who leads, who fixes, who updates stakeholders and customers.',
          'Root-cause thinking that goes past the trigger to the contributing factors.',
          'A **blameless** post-mortem with owned, tracked action items.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** what broke, the impact (users, revenue, duration), and how it was detected.',
          '**Task:** your role in the response (incident lead, on-call engineer).',
          '**Action:** triage, mitigation (rollback, feature flag, scaling), communication rhythm, then the investigation and the post-mortem.',
          '**Result:** time to mitigate, time to resolve, and the follow-up changes and their effect.',
          '**Reflection:** what changed in how the team works.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"I was on call when checkout error rates jumped to about 30% on a Friday evening. I declared an incident in Slack, took the lead role, asked a colleague to handle customer-support updates every fifteen minutes, and focused on mitigation. The error spike lined up with a deploy forty minutes earlier, so I rolled it back; errors stayed high, which told us the deploy was not the cause. Our traces showed Node API calls to MongoDB timing out. A scheduled analytics aggregation had been moved to run on the primary instead of a secondary, and it was saturating the database. We stopped the job, and checkout recovered twenty-five minutes after detection.',
      },
      {
        type: 'paragraph',
        text: "On Monday I ran a blameless post-mortem. The trigger was a config change, but the contributing factors were that analytics jobs could target the primary at all, that we had no alert on MongoDB queue length, and that the change skipped review because it was 'just config'. We agreed on three actions with owners and dates: a read-preference guard in the job runner, an alert on operation latency, and config changes going through the same pull-request review as code. All three shipped within two weeks, and the latency alert later caught a similar issue before customers noticed.\"",
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I found the bug and fixed it." **Strong:** "I led the response, mitigated in twenty-five minutes, and ran the post-mortem."',
          '**Weak:** naming the person who made the change. **Strong:** focusing on why the system allowed the change.',
          '**Weak:** action items listed but never followed up. **Strong:** owners, dates, and proof that they worked.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"Why roll back if the deploy was not the cause?" — It is the fastest safe check; ruling it out narrows the search.',
          '"How do you communicate during an incident?" — A single channel, regular updates with status, impact and next update time, even when there is no news.',
          '"What does blameless mean in practice?" — Ask why the system allowed the mistake, not who made it; nobody is punished for honest errors.',
          '"How do you make sure action items happen?" — Track them like product work, with owners and a review date.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Debugging for an hour before trying a rollback or other mitigation.',
          'Everyone fixing at once with nobody coordinating or communicating.',
          "Stopping at the trigger ('someone changed a config') instead of the contributing factors.",
          'Blaming an individual, which teaches people to hide mistakes.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you separate mitigation from root cause, run communication as deliberately as the fix, and judge the post-mortem by whether its action items shipped and prevented the next incident.',
      },
    ],
  },
  'deciding-with-incomplete-information': {
    summary:
      'Pick a real technical or delivery decision where waiting for certainty was not an option. Show how you separated what you knew from what you assumed, judged whether the decision was reversible, limited the risk (a time-boxed spike, a feature flag, an exit plan), and decided on a date. Then explain how it turned out and what signal you watched to confirm or reverse it.',
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Judgement under uncertainty: you neither freeze nor gamble.',
          'Whether you distinguish **reversible** decisions (decide fast) from **one-way doors** (slow down).',
          'How you reduce uncertainty cheaply: spikes, prototypes, asking the right person.',
          'Whether you set checkpoints and accept being wrong.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the decision and why it could not wait.',
          '**Task:** what was unknown and what was at stake.',
          '**Action:** what you did to learn quickly, how you framed the options and assumptions, how you made it reversible, and who you consulted.',
          '**Result:** the outcome, and whether your assumptions held.',
          '**Reflection:** your general approach to similar decisions.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"We had to choose a real-time approach for a live delivery-tracking screen before we knew how many concurrent users to expect: marketing\'s estimate ranged from five hundred to fifty thousand. Building for the high end meant a dedicated WebSocket service with Redis pub/sub; the low end needed only polling.',
      },
      {
        type: 'paragraph',
        text: 'I listed the assumptions and asked which ones we could test cheaply. In two days I prototyped Server-Sent Events from our existing Node API behind a feature flag and load-tested it to about eight thousand connections per instance. I proposed SSE for launch, because it reused our auth and infrastructure, with a written trigger for revisiting: if concurrent connections passed half of our tested capacity, we would add Redis-backed fan-out. I put the connection count on our dashboard. Launch peaked at around three thousand connections, well within limits. Six months later, when a partner integration pushed us past the trigger, we added Redis pub/sub in a sprint, which was easy because the client contract had not changed. I now write down the assumption and the trigger for revisiting next to any decision made with gaps."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I went with my gut and it worked." **Strong:** "I tested the riskiest assumption in two days and set a trigger to revisit."',
          '**Weak:** waiting weeks for perfect data. **Strong:** deciding on a date with a reversible design.',
          '**Weak:** no follow-up. **Strong:** a metric watched after the decision.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"What would have made you choose differently?" — Name the threshold or fact.',
          '"How do you decide when you have enough information?" — When more data would not change the decision, or when the cost of waiting is higher than the cost of being wrong.',
          '"Tell me about a time it turned out wrong." — Show how quickly you noticed and reversed it.',
          '"Who did you involve?" — The people who own the risk or hold the missing knowledge.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'A story with no real uncertainty.',
          'Presenting a lucky guess as a strategy.',
          'Not mentioning reversibility or a fallback.',
          'Making the decision alone when others owned part of the risk.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you sort decisions by reversibility, buy information cheaply with spikes, write down assumptions and the trigger for revisiting, and decide on time.',
      },
    ],
  },
  'influencing-a-team-you-don-t-manage': {
    summary:
      "Show that you influence through understanding, evidence and making adoption easy, not through authority. Explain how you learned the other team's constraints, proved the approach on a small scale, reduced their cost to adopt (a library, docs, pairing), and accepted their feedback. Use a concrete story, such as a shared API contract, a logging standard or a component library.",
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Influence without authority, one of the clearest senior and staff-level signals.',
          'Empathy: do you understand why the other team works the way it does?',
          'Whether you lower the cost of adoption instead of just recommending.',
          'Patience and pragmatism: partial adoption, and changing your proposal based on feedback.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the approach, the other team or teams, and why alignment mattered.',
          '**Task:** what you wanted to change, and the resistance you met.',
          '**Action:** listening sessions, a pilot with one willing team, evidence from the pilot, tooling or docs that made it easy, and changes you made to your proposal.',
          '**Result:** how many teams adopted it, and the measurable effect.',
          '**Reflection:** what you learned about influence.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"Our five product teams each logged differently in their Node services, so tracing a customer issue across services meant hours of grepping. I wanted every service to use structured JSON logs with a shared request ID and OpenTelemetry tracing. I did not manage any of those teams, and two were sceptical because they had just finished their own logging setup.',
      },
      {
        type: 'paragraph',
        text: 'I started by asking each team lead what slowed their debugging and what they would hate to lose. The main worry was migration effort and losing their existing dashboards. So I built a small internal package, an Express and NestJS middleware with a pino logger preconfigured, that could be added in under an hour, and I wrote a mapping so their existing dashboards kept working. I paired with the most interested team to roll it out first, then showed the before and after at the engineering guild: an incident that had taken half a day to trace took fifteen minutes. Within two quarters four of the five teams had adopted it; the fifth adopted only the request-ID part, which was enough for cross-service tracing. That team\'s feedback led us to make log sampling configurable."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I wrote a standard and asked everyone to follow it." **Strong:** "I built a package that took under an hour to adopt and proved it with one team."',
          '**Weak:** escalating to management as the first move. **Strong:** escalating only when there is a real business risk.',
          '**Weak:** all or nothing. **Strong:** accepting partial adoption that delivers most of the value.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"What if a team still refuses?" — Understand the cost they see; accept partial adoption; escalate only if there is a real business or compliance risk.',
          '"How do you keep it from drifting later?" — Templates, lint rules or CI checks, and ownership of the shared package.',
          '"Have you ever changed your proposal because of pushback?" — Give the concrete change.',
          '"Who should own a cross-team standard?" — A named owner or guild with a clear way to propose changes.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          "Relying on a manager's authority instead of persuasion.",
          'Treating sceptics as obstacles rather than a source of requirements.',
          'Making adoption expensive: a long document and no tooling.',
          'Claiming every team adopted it instantly.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you treat other teams as customers: you learn their constraints, make the right path the easy path with tooling, prove value with a pilot, and accept partial adoption.',
      },
    ],
  },
  'teammate-who-keeps-missing-commitments': {
    summary:
      'Show that you start with curiosity and a private conversation, not judgement or escalation. Explain how you found the cause (unclear expectations, skills, personal circumstances, overload), agreed concrete support and expectations, followed up, and involved their manager appropriately if it did not improve. Keep the story respectful; never make the colleague look bad.',
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Empathy combined with accountability: you neither ignore the problem nor blame.',
          'Whether you talk to the person **directly and early**, in private.',
          'Whether you look for causes in the system (unclear tickets, too much work in progress) as well as in the person.',
          'Judgement about when and how to involve their manager.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the pattern you noticed, with facts rather than impressions.',
          '**Task:** your role (peer, tech lead) and why it mattered to the team.',
          '**Action:** the private conversation, what you learned, the agreed changes (smaller tasks, pairing, clearer acceptance criteria), regular check-ins, and escalation if needed.',
          '**Result:** what changed for the person and the team.',
          '**Reflection:** what you learned about giving feedback.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: "\"As tech lead on a team of six, I noticed one engineer had carried over his tickets in four sprints in a row, and his pull requests were large and arrived on the last day. Rather than raising it in the retro, I asked him for a one-to-one coffee and described what I had seen without judging: 'Your last four stories carried over; what's getting in the way?'",
      },
      {
        type: 'paragraph',
        text: 'It turned out he was new to RxJS-heavy Angular code and was spending days stuck without asking, because he did not want to look slow. We agreed on three things: he would split stories into pull requests of a day or less, we would pair for an hour twice a week on the reactive code, and he would flag any blocker that lasted more than half a day in stand-up. I also changed how we wrote tickets, adding acceptance criteria and a technical note, which helped everyone. I kept his manager informed in our regular one-to-one, framed as support rather than complaint. Within six weeks he was finishing his sprint commitments, and a few months later he ran our RxJS brown-bag session."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I told his manager he wasn\'t pulling his weight." **Strong:** "I asked him privately what was getting in the way, and we agreed on concrete changes."',
          '**Weak:** quietly doing his work for him. **Strong:** making the problem visible and fixing its cause.',
          "**Weak:** vague feedback ('be more proactive'). **Strong:** specific, observable behaviour and agreed next steps.",
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"What if it had not improved?" — Involve the manager with documented facts and the support already tried; it is the manager\'s job to handle performance formally.',
          '"How do you give hard feedback?" — In private, soon, about specific behaviour and its impact, then ask for their view.',
          '"What if the reason is personal?" — Respect privacy, adjust workload where possible, and point to the manager or HR support.',
          '"How do you protect the team\'s delivery meanwhile?" — Re-plan transparently; do not hide the gap.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Escalating before ever talking to the person.',
          'Discussing their performance with other teammates.',
          'Rescuing them by silently doing their work.',
          'Telling the story in a way that belittles the colleague.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you look for the cause before the blame, give specific feedback privately and early, fix team processes that contribute, and involve the manager with facts rather than frustration.',
      },
    ],
  },
  'decision-you-would-now-reverse': {
    summary:
      'Pick a real decision that was reasonable at the time but turned out wrong as the context changed: a library, an architecture, a data model. Explain why it made sense then, what signals showed it was wrong, its cost, and what you did about it. The interviewer is looking for self-awareness and learning, not perfection.',
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Honesty and self-awareness: can you own a mistake without excuses or self-blame?',
          'Whether you judge past decisions fairly, given what was known at the time.',
          'How quickly you noticed and what you did about it.',
          'The lesson, and whether it changed how you decide now.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the decision and the context (team, constraints, timeline).',
          '**Task:** why you made it; it should sound reasonable.',
          '**Action:** the signals that it was wrong, the cost, and what you did (reversed it, contained it, or accepted it with a plan).',
          '**Result:** where it ended up.',
          '**Reflection:** what you now do differently, such as decision records, spikes or reversibility checks.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: '"Three years ago I chose to split a small product into four Node microservices from day one: users, catalog, orders and notifications, each with its own MongoDB database. The team expected to grow quickly and I wanted clear boundaries. The growth never came: we stayed at four engineers, and almost every feature touched two or three services. We spent a lot of time on cross-service calls, keeping data consistent with events, and four deployment pipelines.',
      },
      {
        type: 'paragraph',
        text: 'After a year, I measured that about 40% of our pull requests needed coordinated releases across services, and two incidents came from events arriving out of order. I proposed merging catalog and orders back into one service with modules, keeping only notifications separate because it really did scale differently. We merged them over two sprints behind the same API, and coordinated releases became rare. Today I would start with a modular monolith with clear module boundaries and split out services only when a specific scaling or team-ownership need appears. I also write a short decision record for big choices, including what would make us revisit them."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I can\'t think of one." **Strong:** a real decision, with its cost and what you changed.',
          '**Weak:** blaming the team or management for the decision. **Strong:** owning your part.',
          '**Weak:** a trivial choice (variable naming). **Strong:** an architectural or tooling decision with real consequences.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"Why did it make sense at the time?" — Show the reasoning was sound given what you knew.',
          '"How did you convince people to reverse it?" — With data on its cost, and a safe, incremental plan.',
          '"How do you avoid this kind of mistake now?" — Decision records, a check on reversibility, smaller bets.',
          '"Is there anything you would still keep from the original decision?" — Shows balanced judgement.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Choosing a fake weakness or a decision that was actually right.',
          'Excessive self-criticism; the decision should have been reasonable at the time.',
          'No action taken after realising the mistake.',
          "A lesson that is too vague, like 'communicate more'.",
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you judge the decision by what was known at the time, quantify its cost, reverse it safely, and turn the lesson into a lasting practice such as decision records or reversibility checks.',
      },
    ],
  },
  'setting-code-review-standards': {
    summary:
      "Explain how you make review standards explicit, automate everything a machine can check, and keep human review for design, correctness and readability. Show how you agreed the standards with the team instead of imposing them, kept reviews fast, and adjusted them over time. A concrete example of improving a team's review culture makes it convincing.",
    details: [
      { type: 'heading3', text: 'What the interviewer is assessing' },
      {
        type: 'bullets',
        items: [
          'Whether you can turn taste into **written, agreed standards** that the team owns.',
          'Use of automation (formatter, linter, type checks, tests in CI) so humans focus on what matters.',
          'Attention to **speed and tone**: review turnaround, pull request size, kind and specific comments.',
          'How you handle disagreement in reviews and how the standards evolve.',
        ],
      },
      { type: 'heading3', text: 'A strong answer, step by step' },
      {
        type: 'numbered',
        items: [
          '**Situation:** the problem with reviews (slow, inconsistent, nitpicky, rubber-stamped).',
          '**Task:** your role in improving it.',
          '**Action:** a short written guide built with the team, automation in CI, a pull request template, size and turnaround norms, comment conventions (nit, suggestion, blocking), and a regular review of the guide.',
          '**Result:** measurable change: turnaround time, pull request size, escaped defects, how people felt.',
          '**Reflection:** what you would add next.',
        ],
      },
      { type: 'heading3', text: 'Example answer (adapt it to your own story)' },
      {
        type: 'paragraph',
        text: "\"When I joined as tech lead, reviews on our Angular and Node monorepo took on average two days, and most comments were about formatting or import order. People also approved large pull requests without really reading them. I ran a retro on reviews and we agreed a one-page guide together: what reviewers must check (correctness, tests, security, naming, design fit), what is the author's job, and comment prefixes so 'nit' never blocks a merge.",
      },
      {
        type: 'paragraph',
        text: 'Then we automated the rest: Prettier and ESLint in pre-commit hooks and CI, strict TypeScript, Angular template checks, and a pull request template asking for screenshots and a test plan. We set two norms: aim for pull requests under about 400 changed lines, and a first review within one working day, which we made visible on a small dashboard. Within two months the median time to first review fell to around four hours and formatting comments almost disappeared. We review the guide every quarter; the last change added a checklist item for database index changes after an incident."',
      },
      { type: 'heading3', text: 'Weak vs strong' },
      {
        type: 'bullets',
        items: [
          '**Weak:** "I make sure everyone follows my style." **Strong:** "We wrote the guide together and automated everything mechanical."',
          '**Weak:** reviews as gatekeeping. **Strong:** reviews as knowledge sharing, with fast turnaround.',
          '**Weak:** standards set once and forgotten. **Strong:** a short guide that evolves after incidents and retros.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          '"What do you look for first in a review?" — Correctness and design fit, then tests, security and readability; style is the tooling\'s job.',
          '"How do you handle a reviewer who blocks on preferences?" — Point to the guide; non-blocking \'nit\'; discuss recurring disagreements in a retro and update the guide.',
          '"How do you review a 2,000-line pull request?" — Ask for it to be split, or review it together in a call; prevent it next time with smaller tasks.',
          '"Should juniors review seniors\' code?" — Yes; it spreads knowledge and catches real issues.',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Using human review for things a formatter or linter could enforce.',
          "Standards that live only in one person's head.",
          'Slow reviews, which push people towards larger, riskier pull requests.',
          'Harsh or vague comments with no explanation.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you automate the mechanical checks, agree a short written guide with the team, measure review speed and size, and update the standards from real incidents rather than personal taste.',
      },
    ],
  },
};
