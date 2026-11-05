import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Which Angular versions have you worked on?': {
    summary:
      'Give the honest range you have used in production (e.g. "Angular [X] through [Y]"), then prove depth by naming what changed between those versions and what you migrated — standalone components, signals, the new `@if/@for` control flow, the esbuild application builder, and zoneless change detection. The version number alone means little; the upgrades you drove are what impress.',
    details: [
      {
        type: 'paragraph',
        text: 'This looks like a trivia question, but the interviewer is checking whether your knowledge is current and whether you have **lived through upgrades**. A candidate who says "Angular 8 to 19, and I led the migration to standalone and signals" is far stronger than one who says "Angular 17".',
      },
      { type: 'heading3', text: 'How to structure the answer' },
      {
        type: 'numbered',
        items: [
          '**Range:** the versions you used in real projects (be honest — "[Angular 12] on [legacy app], [Angular 19/20] on [current app]").',
          '**Milestones you used:** 2–3 features that mark modern Angular, in your own words.',
          '**Migration story:** one upgrade you performed and how (ng update, schematics, fixing breaking changes).',
          '**What you are following now:** the current version and what you are evaluating (zoneless, signal forms, etc.).',
        ],
      },
      { type: 'heading3', text: 'Version landmarks worth knowing' },
      {
        type: 'bullets',
        items: [
          '**v9:** Ivy compiler and runtime became the default (smaller bundles, better debugging).',
          '**v14:** strictly typed reactive forms; standalone components in developer preview; `inject()` usable in more places.',
          '**v15:** standalone APIs stable; functional router guards and HTTP interceptors; `NgOptimizedImage`.',
          '**v16:** signals introduced (developer preview); required inputs; `takeUntilDestroyed`; `DestroyRef`.',
          '**v17:** built-in control flow (`@if`, `@for`, `@switch`), `@defer` blocks, the esbuild/Vite-based application builder by default; signal `input()` arrived in the 17.x line.',
          '**v18–v19:** experimental zoneless change detection, `output()`, `model()`, signal queries; standalone became the default; `linkedSignal` and `resource` introduced as experimental APIs.',
          '**v20+:** core signal APIs (`effect`, `linkedSignal`, `toSignal`) stabilised, zoneless matured toward the default, structural directives like `*ngIf` deprecated in favour of control flow. Check the official changelog for the exact status in the newest release.',
        ],
      },
      {
        type: 'code',
        lang: 'bash',
        code: `# The upgrade path you can describe (one major version at a time)
ng update @angular/core@18 @angular/cli@18
ng update @angular/core@19 @angular/cli@19

# Optional migrations Angular ships as schematics
ng generate @angular/core:standalone-migration    # NgModules → standalone
ng generate @angular/core:control-flow-migration  # *ngIf/*ngFor → @if/@for
ng generate @angular/core:signal-input-migration   # @Input() → input()
ng generate @angular/core:inject-migration        # constructor DI → inject()`,
      },
      { type: 'heading3', text: 'Sample answer' },
      {
        type: 'paragraph',
        text: '"I have worked with Angular from version [11] up to [20]. On [company / project A] I maintained an Angular [11] app built with NgModules and RxJS-heavy state. On [project B] I led the upgrade from [15] to [19] — we went one major at a time with `ng update`, fixed breaking changes in [Material / RxJS / a third-party library], then ran the standalone and control-flow schematics module by module. After that we moved new features to signals with `input()`, `computed()` and `toSignal()`, which cut our change-detection work noticeably — [our dashboard went from X to Y ms per interaction]. Right now I am following [Angular 21/22] and experimenting with zoneless change detection on [a side project / POC]."',
      },
      {
        type: 'flow',
        title: 'A safe major-version upgrade',
        code: `flowchart LR
  A["Read update.angular.dev<br/>for from → to"]:::external --> B["ng update core + cli<br/>one major at a time"]:::server
  B --> C["Update 3rd-party libs<br/>Material, NgRx, etc."]:::server
  C --> D["Run tests + e2e<br/>fix breaking changes"]:::highlight
  D --> E["Optional schematics<br/>standalone, control flow"]:::client
  E --> F([Release behind<br/>monitoring]):::db`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: claiming the latest version without being able to name what is new in it. If you have only used older versions in production, say so and add what you have learned about recent features on your own — honesty plus curiosity beats a stretched claim.',
      },
    ],
  },

  'Why did you choose Angular when most developers are learning React?': {
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
    ],
  },

  'Do you have exposure working in Vanilla JavaScript?': {
    summary:
      'Say yes and prove it with specifics: the DOM API, events and delegation, closures, promises/async-await and the event loop, `fetch`, and ES modules — and give an example where you used plain JavaScript (a widget, a script, a performance fix, or debugging what Angular does underneath). Frameworks are abstractions over these fundamentals.',
    details: [
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

  'Which third-party Angular libraries have you used in your projects, and why?': {
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

  'What is the most challenging technical or performance bug you have solved in an Angular frontend application and how did you resolve it?':
    {
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

  'Have you created any proof of concept (POC)? Explain one.': {
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

  'What deployment activities have you handled?': {
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
    ],
  },

  'Have you worked on CI/CD pipelines?': {
    summary:
      'Explain a pipeline you have worked on stage by stage — install (`npm ci`), lint, unit tests, build, e2e tests, artifact publishing, and deployment with approvals — name the tool (GitHub Actions, GitLab CI, Azure DevOps, Jenkins), and say what you personally added or improved, such as caching, parallel jobs, affected-only builds or quality gates.',
    details: [
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
    ],
  },

  'Have you worked on resolving issues in CI/CD pipelines?': {
    summary:
      'Yes — describe a specific failure, how you diagnosed it from the logs, the root cause, and the permanent fix. Common real examples: "works locally, fails in CI" from Node/dependency version drift, flaky e2e tests, out-of-memory during the build, expired secrets/tokens, or cache corruption. Show a systematic approach: read the first real error, reproduce locally in the same environment, fix the root cause, and prevent recurrence.',
    details: [
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

  'Have you worked with teams from different organizations where your module depended on parallel development teams? How did you manage communication and dependencies?':
    {
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

  'Have you used any AI tools?': {
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
    ],
  },

  'Difference between Ask, Agent, and Plan mode in GitHub Copilot': {
    summary:
      '**Ask** mode answers questions and explains code without changing your files. **Agent** mode works autonomously: it decides which files to edit, makes multi-file changes, can run terminal commands and tests, and iterates on errors (with your approval for actions). **Plan** mode researches the task and produces a step-by-step implementation plan for you to review and refine before any code is written — then you hand the plan to Agent mode to implement.',
    details: [
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
};
