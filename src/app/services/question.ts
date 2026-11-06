import { Service } from '@angular/core';

export interface CategoryModel {
  id: string;
  icon: string;
  title: string;
  color: string;
  bg: string;
  questions: string[];
}

/** The three Q&A tracks. Foundations is shared by both stacks (JavaScript, TypeScript, the web). */
export type Track = 'foundations' | 'angular' | 'nodejs';

export interface TrackInfo {
  id: Track;
  label: string;
  /** Short label for tight spaces (track switch, chips). */
  short: string;
  icon: string;
  /** Site searched by the "Docs" button, and the prefix for a general web search. */
  docsSite: string;
  docsLabel: string;
  searchPrefix: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    short: 'JS/TS',
    icon: 'ti-brand-javascript',
    docsSite: 'developer.mozilla.org',
    docsLabel: 'MDN Docs',
    searchPrefix: 'JavaScript',
  },
  {
    id: 'angular',
    label: 'Angular',
    short: 'Angular',
    icon: 'ti-brand-angular',
    docsSite: 'angular.dev',
    docsLabel: 'Angular Docs',
    searchPrefix: 'Angular',
  },
  {
    id: 'nodejs',
    label: 'Node.js',
    short: 'Node.js',
    icon: 'ti-brand-nodejs',
    docsSite: 'nodejs.org',
    docsLabel: 'Node.js Docs',
    searchPrefix: 'Node.js',
  },
];

/**
 * Topics shared by both stacks: language, web platform, problem solving and interview skills.
 * Ids are kept stable so links and saved progress keep working.
 */
const FOUNDATION_TOPICS = new Set([
  'javascript-fundamentals',
  'typescript',
  'browser-dom-css',
  'web-accessibility',
  'web-performance',
  'dsa-patterns',
  // Interview rounds that are not specific to one framework
  'experience-behavioral',
  'coding-round',
]);

export function trackOf(categoryId: string): Track {
  if (FOUNDATION_TOPICS.has(categoryId)) return 'foundations';
  return categoryId.startsWith('nodejs-') ? 'nodejs' : 'angular';
}

export function isTrack(value: unknown): value is Track {
  return value === 'foundations' || value === 'angular' || value === 'nodejs';
}

export function trackInfo(track: Track): TrackInfo {
  return TRACKS.find((t) => t.id === track)!;
}

/**
 * Questions that go beyond fundamentals: internals, trade-offs, design and architecture,
 * production debugging, and scenario questions. Everything else is "core".
 * Keyed by exact question text, like progress; update this list when rewording a question.
 */
const SENIOR_QUESTIONS = new Set<string>([
  // web-performance + Angular performance (depth)
  'How do you improve Largest Contentful Paint (LCP)?',
  'What is Interaction to Next Paint (INP), and how do you fix a slow interaction?',
  'What causes Cumulative Layout Shift (CLS), and how do you prevent it?',
  'Lab data vs field data: how do you measure performance with Lighthouse, DevTools, CrUX and real-user monitoring?',
  'What are resource hints (`preload`, `preconnect`, `prefetch`, `fetchpriority`), and when do they backfire?',
  'How do you set and enforce a performance budget in CI?',
  'How do you analyse and reduce an Angular bundle (build stats, lazy routes, `@defer`, tree-shaking pitfalls)?',
  'How do `@defer` and incremental hydration improve Core Web Vitals in an Angular app?',
  'How do you find and fix slow change detection with Angular DevTools and the Chrome Performance panel?',
  'When should you move work to a web worker in an Angular app, and how?',
  // nodejs-sql (depth)
  'How do you read an `EXPLAIN ANALYZE` plan to find out why a query is slow?',
  'How do you design a composite index, and why does column order matter?',
  'What causes deadlocks, and how do you prevent and handle them?',
  'How do you change a database schema with zero downtime (expand and contract)?',
  'How do read replicas work, and how do you deal with replication lag?',
  'When and how do you partition or shard a relational table?',
  'PostgreSQL `JSONB` vs a document database: when is each the better choice?',
  'How do you design a multi-tenant database: shared schema, schema per tenant, or database per tenant?',
  // nodejs-devops (depth)
  'Blue-green vs canary vs rolling deployments: how do you choose?',
  'How do feature flags help you release safely, and what are the risks?',
  'What is Infrastructure as Code, and how do Terraform and AWS CDK compare?',
  'How do you build a small, secure production Docker image for Node.js (multi-stage builds, non-root user, scanning)?',
  'What are Kubernetes liveness, readiness and startup probes, and how does autoscaling work?',
  'What are SLIs, SLOs and error budgets, and how do they change how a team works?',
  'What does a good CI/CD pipeline for a full-stack app look like, from pull request to production?',
  // nodejs-api-design (depth)
  'How do you evolve an API without breaking existing clients (versioning and backward compatibility)?',
  'How do you use OpenAPI in a team: contract-first vs code-first, and generated clients?',
  'How do you design and secure webhooks (signatures, retries, idempotency)?',
  'What is the N+1 problem in GraphQL, and how does DataLoader solve it?',
  'What is the Backend-for-Frontend (BFF) pattern, and when is it worth it?',
  'How do you design long-running operations in an API (202 Accepted, polling, callbacks)?',
  // nodejs-auth-advanced (depth)
  'Sessions vs JWTs: what are the real trade-offs for a web app?',
  'How do access tokens and refresh tokens work together, and what is refresh token rotation?',
  'How do you revoke a JWT or log a user out before the token expires?',
  'What is PKCE, and why is it required for single-page and mobile apps?',
  'Where should an Angular SPA keep its tokens, and how does the BFF pattern help with auth?',
  'How does single sign-on work with SAML or OIDC in an enterprise app?',
  'RBAC vs ABAC vs ReBAC: how do you model permissions?',
  'How do you enforce tenant isolation in a multi-tenant SaaS API?',
  'How do you add MFA and passkeys (WebAuthn) to a login flow?',
  // web-accessibility
  'How do you make a custom component such as a dropdown or tabs fully keyboard accessible?',
  'How do you manage focus in a single-page app: on route changes, in modals, and with focus traps?',
  'How do you make dynamic content and form errors announced to screen-reader users?',
  'What does the Angular CDK a11y package provide (`FocusTrap`, `LiveAnnouncer`, `FocusMonitor`, `ListKeyManager`)?',
  // dsa-patterns
  'Sliding window: find the longest substring without repeating characters.',
  'Merge overlapping intervals.',
  'Top K frequent elements: heap vs bucket sort.',
  'BFS vs DFS: count the number of islands in a grid.',
  'Detect a cycle in a dependency graph with topological sort (course schedule).',
  'How do you recognise a dynamic programming problem? Solve climbing stairs and coin change.',
  // frontend-debugging
  'Memory keeps growing the longer a user keeps the Angular app open. How do you find and fix the leak?',
  'You get `ExpressionChangedAfterItHasBeenCheckedError`. What causes it, and how do you fix it properly?',
  'A table with 10,000 rows freezes the page. How do you diagnose and fix it?',
  'A bug happens only in production, never locally. How do you investigate it?',
  'After a deployment, some users see a blank page or a `ChunkLoadError`. Why, and how do you prevent it?',
  'An API call works in Postman but fails from the browser with a CORS error in production. How do you debug it?',
  'The app is slow on first load. How do you measure and improve LCP and bundle size?',
  "A component's view does not update even though the data changed. What are the likely causes?",
  'Users report that a button sometimes does nothing when clicked. How do you reproduce and track it down?',
  // nodejs-aws-cloud
  'How do you host an Angular SPA on S3 and CloudFront, including deep links, caching and invalidation on deploy?',
  'How do you let users upload large files directly to S3 with presigned URLs?',
  'How do you choose between EC2, ECS on Fargate, and Lambda for a Node.js service?',
  'What are IAM roles and policies, and how do you apply least privilege to a service?',
  'RDS/Aurora vs DynamoDB: how do you choose, and how do you model data for DynamoDB?',
  'SQS vs SNS vs EventBridge: when do you use each?',
  'How do you design for high availability and disaster recovery on AWS (multi-AZ, multi-region, RPO and RTO)?',
  'How do you monitor a production service with CloudWatch, and what would you alarm on?',
  'What are Lambda cold starts, and how do you reduce them?',
  'How do you keep an AWS bill under control?',
  // nodejs-distributed-systems
  'What is a dead-letter queue, and how do you handle poison messages?',
  'How do you trace a single request across several services?',
  'What is the CAP theorem, and what does PACELC add?',
  'Strong vs eventual consistency: how do you design a feature that has to live with eventual consistency?',
  'What is the transactional outbox pattern, and what problem does it solve?',
  'Why is exactly-once delivery a myth, and how do you build idempotent consumers?',
  'How do you preserve message ordering in a queue or stream (Kafka partitions, SQS FIFO)?',
  'How do retries, timeouts and backoff interact, and how do you avoid retry storms?',
  'What is the difference between Kafka and a traditional message queue such as RabbitMQ or SQS?',
  'How do you do leader election or distributed locking safely, and what can go wrong?',
  // javascript-fundamentals
  'What are generator functions and async generators in JavaScript?',
  'What is a Proxy object and how is it used?',
  'What are WeakMap and WeakSet, and why do they allow garbage collection?',
  // typescript
  'What are discriminated unions, and how do they help model UI state like loading, success, and error?',
  'What are mapped types and conditional types? Give a practical example.',
  'What does the `satisfies` operator do, and how is it different from a type annotation or `as`?',
  'How do you type HTTP responses with `HttpClient.get<T>()`, and why is that not runtime validation?',
  // angular-cli-build
  'How does the browser load an Angular application?',
  // templates-styling
  'How can you dynamically apply different styles or themes to the same CSS class across multiple component instances in Angular?',
  // pipes
  'Why is calling a method in a template bad for performance, and how do pure pipes or `computed()` fix it?',
  "Why doesn't Angular ship `filter` or `orderBy` pipes, and how should you filter or sort lists instead?",
  // dependency-injection
  'How does Dependency Injection work internally?',
  // change-detection
  'Difference between markForCheck() and detectChanges()',
  'Can you configure or trigger change detection strategies at the routing or module level in Angular?',
  'How does Angular detect changes in a zone-less environment?',
  // signals
  'Difference between Signals and RxJS',
  'Signals vs NgRx',
  // modern-angular
  'What is `linkedSignal()` and when would you use it instead of `computed()`?',
  'What are `resource()` and `httpResource()`, and how do they load async data with signals?',
  'How do you migrate an existing Angular app to zoneless change detection?',
  'What is hydration in Angular? Explain event replay and incremental hydration.',
  'How do you migrate an older Angular codebase to modern APIs (standalone, control flow, signal inputs, `inject()`)?',
  // rxjs
  'Explain the difference between cold and hot observables with examples',
  'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each',
  'Explain the difference between combineLatest, forkJoin, zip, and withLatestFrom',
  'What does shareReplay(1) do and when is it essential?',
  'What are schedulers in RxJS and when would you use asyncScheduler vs queueScheduler?',
  "You're building a type-ahead search — implement it using RxJS operators, handling debounce, cancellation of in-flight requests, and deduplication",
  'A user clicks a button 10 times and 10 API calls are triggered. How would you handle this using RxJS?',
  'You have a payment form where the user clicks Submit. How do you prevent duplicate submissions using RxJS? Which operator do you choose and why?',
  "You need to poll an API every 10 seconds but stop polling when the component is destroyed. Show how you'd implement this",
  'An observable chain emits an error and the entire stream terminates. How do you architect a resilient stream that recovers gracefully?',
  // http-apis
  'How do you design API calling from the UI? When do you use the async pipe, and when should you unsubscribe manually?',
  'Global error handling vs component-level error handling',
  'How do you prevent duplicate API requests in Angular?',
  'An API response is required by multiple components. How would you avoid repeated API calls?',
  // routing
  'How would you track every route change to monitor user navigation?',
  'Difference between canMatch and canLoad',
  // forms
  'How would you build a dynamic form using JSON configuration instead of hardcoding controls?',
  'Your form has more than 50 fields. Will you keep the complete reactive form and template inside one component?',
  'Your application has a stepper and each step is implemented in a different Angular component. How would you share the complete form across all steps?',
  'Suppose a Reactive Form contains a dropdown that gets enabled/disabled from multiple events. A defect is reported where the dropdown behaves incorrectly. How would you debug which event is changing its state?',
  // component-communication
  'Is passing state and parameters through Angular routing preferred over using a shared service? When should each be used?',
  'If admin updates data and changes need to reflect in multiple components simultaneously, how?',
  // ngrx
  'What are Selectors in NgRx? Explain memoization and why it matters for performance',
  'Explain concatLatestFrom (formerly withLatestFrom in effects) and its use case',
  'What is the NgRx Signal Store (introduced in NgRx 17)? How does it differ from the traditional store?',
  'Design the NgRx state shape for a banking dashboard that shows account list, selected account details, and transaction history with pagination',
  'An Effect makes an HTTP call, but you want to cancel the previous request if a new action arrives. Which operator do you use inside the effect and why?',
  'Your selector is being called too frequently causing performance issues. How do you diagnose and fix this?',
  'How would you implement optimistic updates using NgRx?',
  'How would you implement undo/redo functionality using NgRx?',
  // architecture
  'How to implement SOLID principles in an Angular application?',
  'Are you familiar with the facade pattern in Angular? Explain where you have used it.',
  'Have you worked on Micro Frontend architecture?',
  'If multiple applications need to share data, how would you design the communication?',
  'Describe the architecture, tech stack, state management, and key modules of an enterprise Angular application you have worked on.',
  // frontend-system-design
  'How do you approach a frontend system design interview?',
  'How would you design an autocomplete (type-ahead) search component?',
  'How would you design an infinite-scrolling news feed?',
  'How would you design a reusable component library or design system shared by several Angular apps?',
  'How would you design a real-time dashboard that shows live data?',
  'How would you design an offline-first Angular application?',
  'How would you design a large multi-step form, such as a loan or insurance application?',
  'How would you structure a large Angular codebase so that several teams can work on it independently?',
  // performance
  'How do you optimize an Angular application? Consider lazy loading, OnPush change detection, trackBy, and caching.',
  'Handle bulk records using virtual scrolling and pagination, and limit API result per page',
  // security-storage
  'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?',
  'What is a Content Security Policy (CSP) and how do you use it with Angular?',
  'What are Trusted Types and how does Angular support them?',
  'How do the `HttpOnly`, `Secure`, and `SameSite` cookie attributes protect a session?',
  'Why are route guards and hidden buttons not real security?',
  "What is CORS, and why can't you fix a CORS error from the Angular app?",
  // testing
  'Your UI development is complete but backend APIs are still under development and API contracts are available. How will you test the application?',
  'How do you test OnPush and zoneless components, and what does `fixture.whenStable()` do?',
  'What are component harnesses (`ComponentHarness`) and why use them?',
  'What should you cover with unit tests versus end-to-end tests (Playwright or Cypress)?',
  'What makes a test flaky, and how do you avoid flaky Angular tests?',
  // experience-behavioral
  'What is the most challenging technical or performance bug you have solved in an Angular frontend application and how did you resolve it?',
  'Have you worked with teams from different organizations where your module depended on parallel development teams? How did you manage communication and dependencies?',
  'Tell me about a time you disagreed with a teammate or reviewer on a technical decision.',
  'Tell me about a time you missed a deadline or a project went off track.',
  'Tell me about a production bug you caused and how you handled it.',
  'How do you give and receive code review feedback?',
  'Tell me about a time you mentored or helped a junior developer.',
  'How do you estimate a feature, and what do you do when your estimate turns out to be wrong?',
  // coding-round
  // nodejs-fundamentals
  'What are the phases of the Node.js Event Loop?',
  'What is the difference between process.nextTick() and setImmediate()?',
  'What are Worker Threads in Node.js and when should you use them?',
  'What is the difference between child_process.fork(), spawn(), and exec()?',
  // nodejs-error-handling
  'What is the difference between try/catch and process.on("uncaughtException")?',
  'How do you implement graceful shutdown in Node.js?',
  // nodejs-streams
  'What is backpressure and how does Node.js handle it?',
  'What is stream.pipeline() and why is it preferred over .pipe()?',
  'How would you process a large CSV file efficiently in Node.js?',
  // nodejs-memory
  'What are common causes of memory leaks in Node.js applications?',
  'How do you detect and diagnose memory leaks in a production Node.js app?',
  'How do you test for memory leaks in Node.js?',
  // nodejs-express-nestjs
  'What is the difference between Fastify and Express?',
  'What are Guards, Interceptors, and Pipes in NestJS?',
  'How do you implement versioned APIs in NestJS?',
  // nodejs-networking
  'What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?',
  'How do you implement request timeouts in Node.js HTTP servers?',
  'What is the difference between REST, GraphQL, and gRPC?',
  'What is Server-Sent Events (SSE) and when should you use it over WebSockets?',
  // nodejs-security
  // nodejs-sql
  'What is the difference between clustered and non-clustered indexes?',
  'What are database transaction isolation levels?',
  'What is the N+1 query problem and how do you fix it?',
  // nodejs-nosql
  'Why are unbounded arrays an anti-pattern in MongoDB, and what happens when a document approaches the 16 MB limit?',
  'What are the MongoDB schema design patterns (bucket, computed, subset, extended reference, outlier), and when do you use each?',
  'Design the MongoDB data model for an e-commerce catalog with product variants, inventory and reviews.',
  'How do you optimise a slow aggregation pipeline (stage order, `$lookup` cost, `$facet`, `allowDiskUse`)?',
  'How do you paginate a large MongoDB collection, and why does `skip()` get slow?',
  'A MongoDB query became slow as the data grew. How do you use `explain("executionStats")` to find and fix the problem?',
  'Duplicate documents are being created even though the code checks whether one exists before inserting. Why, and how do you fix it?',
  'What are write concern, read concern and read preference, and what can go wrong when you read from secondaries?',
  'What are MongoDB change streams, and how do you use them reliably (resume tokens)?',
  'How do you choose a shard key, and why does a monotonically increasing key create a hot shard?',
  'Mongoose `populate()` on a list endpoint is slow. What is happening, and when should you use `$lookup` instead?',
  'Your serverless functions keep exhausting MongoDB connections. Why, and how do you fix it?',
  'How do you change a MongoDB schema without downtime (schema versioning, lazy migration vs backfill)?',
  'The working set no longer fits in RAM and MongoDB latency spikes. How do you confirm it and what are your options?',
  'What is the difference between embedding and referencing in MongoDB schema design?',
  'What is a transaction in MongoDB, and when would you use it?',
  'Suppose you need to update three MongoDB collections as part of a single business operation. If the third update fails, how would you ensure that the first two updates are rolled back?',
  // nodejs-caching
  'What is cache invalidation and what are the strategies?',
  'How do you implement rate limiting using Redis?',
  'How do you implement distributed locks with Redis?',
  'What is the difference between Redis Pub/Sub and Redis Streams?',
  // nodejs-performance
  'How do you profile and debug Node.js performance issues?',
  'How does connection pooling work in Node.js database connections?',
  'How do you implement pagination — offset vs cursor-based?',
  // nodejs-clustering
  'How does the primary process distribute requests among workers in cluster mode?',
  'How do you share state between cluster workers?',
  // nodejs-devops
  'How do you manage configuration across dev, staging and production without drift?',
  // nodejs-design-patterns
  'What is CQRS (Command Query Responsibility Segregation)?',
  'What is Event Sourcing?',
  // nodejs-microservices
  'What is the difference between synchronous and asynchronous communication in microservices?',
  'What is the Circuit Breaker pattern?',
  'What is the Saga pattern in microservices?',
  'How do you handle distributed transactions in a microservices architecture?',
  'What is the Strangler Fig pattern for migrating from monolith to microservices?',
  // nodejs-system-design
  'How do you design a rate limiter in Node.js?',
  'How do you design a URL shortener service?',
  'How would you design a notification system that sends emails, SMS, and push notifications?',
  // nodejs-backend-operations
  'An API that previously responded quickly is now taking around 30 seconds to complete. How would you debug the issue and identify the root cause?',
  'Walk me through your process of taking a new feature from requirement gathering to production deployment.',
  'A Node.js service is stuck at 100% CPU and requests are timing out. How do you find what is blocking the event loop?',
  'Your API intermittently returns 502 or 504 errors behind Nginx or a load balancer. How do you troubleshoot it?',
  'Requests start hanging because the database connection pool is exhausted. How do you diagnose and fix it?',
  'Customers are charged twice when they retry a payment request. How do you make the API idempotent?',
  'Two requests update the same record at the same time and one update is lost. How do you prevent this race condition?',
  'A deployment went out and the error rate spiked. Walk through your incident response and rollback.',
  'How do you add logging, metrics, and tracing to a Node.js service so production issues are easy to debug?',
  // nodejs-coding-round
  'Implement a retry function with exponential backoff and jitter.',
  'Run a list of async tasks with at most N running at the same time (a promise pool).',
  'Implement an LRU cache with O(1) `get` and `put`.',
  'Implement a token-bucket rate limiter as Express middleware.',
  'Count word frequencies in a very large file using streams.',
]);

export type Level = 'core' | 'senior';

export function levelOf(question: string): Level {
  return SENIOR_QUESTIONS.has(question) ? 'senior' : 'core';
}

/** Sidebar sections per track. Every topic belongs to exactly one group, in topic order. */
export const TOPIC_GROUPS: { track: Track; title: string; topics: string[] }[] = [
  { track: 'foundations', title: 'Language', topics: ['javascript-fundamentals', 'typescript'] },
  {
    track: 'foundations',
    title: 'Web platform',
    topics: ['browser-dom-css', 'web-accessibility', 'web-performance'],
  },
  { track: 'foundations', title: 'Problem solving', topics: ['dsa-patterns', 'coding-round'] },
  { track: 'foundations', title: 'Interview skills', topics: ['experience-behavioral'] },
  {
    track: 'angular',
    title: 'Angular core',
    topics: [
      'angular-cli-build',
      'components',
      'templates-styling',
      'pipes',
      'directives',
      'dependency-injection',
      'change-detection',
    ],
  },
  { track: 'angular', title: 'Reactivity', topics: ['signals', 'modern-angular', 'rxjs'] },
  {
    track: 'angular',
    title: 'Data & state',
    topics: ['http-apis', 'routing', 'forms', 'component-communication', 'ngrx'],
  },
  {
    track: 'angular',
    title: 'Architecture & quality',
    topics: [
      'architecture',
      'frontend-system-design',
      'performance',
      'security-storage',
      'testing',
      'frontend-debugging',
    ],
  },
  {
    track: 'nodejs',
    title: 'Runtime',
    topics: ['nodejs-fundamentals', 'nodejs-error-handling', 'nodejs-streams', 'nodejs-memory'],
  },
  {
    track: 'nodejs',
    title: 'APIs & security',
    topics: [
      'nodejs-express-nestjs',
      'nodejs-api-design',
      'nodejs-networking',
      'nodejs-security',
      'nodejs-auth-advanced',
    ],
  },
  { track: 'nodejs', title: 'Data', topics: ['nodejs-sql', 'nodejs-nosql', 'nodejs-caching'] },
  {
    track: 'nodejs',
    title: 'Performance & scale',
    topics: ['nodejs-performance', 'nodejs-clustering'],
  },
  {
    track: 'nodejs',
    title: 'Cloud & delivery',
    topics: ['nodejs-testing', 'nodejs-devops', 'nodejs-aws-cloud'],
  },
  {
    track: 'nodejs',
    title: 'Architecture',
    topics: [
      'nodejs-design-patterns',
      'nodejs-microservices',
      'nodejs-distributed-systems',
      'nodejs-system-design',
    ],
  },
  {
    track: 'nodejs',
    title: 'Interview rounds',
    topics: ['nodejs-backend-operations', 'nodejs-coding-round'],
  },
];

/**
 * Question bank, grouped by topic and ordered roughly from fundamentals → advanced.
 *
 * - The track comes from `trackOf()`: Foundations topics are listed in FOUNDATION_TOPICS,
 *   `nodejs-` topics are Node.js, everything else is Angular.
 * - Progress (mastered / starred / notes) is keyed by the exact question text, so moving a
 *   question between categories is safe, but rewording it resets that question's progress.
 */
/**
 * Questions whose wording was corrected. Progress is keyed by question text, so saved
 * mastered/starred state is moved from the old text to the new text on load.
 */
export const RENAMED_QUESTIONS: Record<string, string> = {
  // Duplicates merged into one question (their answers live on as "Follow-up" sections)
  'Explain Angular change detection.': 'How does Change Detection work in Angular?',
  'How does Angular Change Detection work by default (`ChangeDetectionStrategy.Default`) across component trees?':
    'How does Change Detection work in Angular?',
  'Explain Angular lifecycle hooks':
    'Explain the execution order and purpose of all Angular component lifecycle hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngOnDestroy`, etc.).',
  'Difference between Subject, BehaviorSubject, and ReplaySubject in RxJS':
    'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?',
  'Difference between switchMap and mergeMap':
    'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each',
  'Explain the use cases of switchMap, concatMap, and mergeMap.':
    'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each',
  'How to implement lazy loading in Angular?':
    'How do you implement route-level lazy loading of standalone components or feature modules in Angular (`loadChildren` / `loadComponent`)?',
  'Write the exact routing configuration code (`app.routes.ts` / `router.js`) to implement lazy loading for an Angular component or module.':
    'How do you implement route-level lazy loading of standalone components or feature modules in Angular (`loadChildren` / `loadComponent`)?',
  'What are route guards?':
    'What are the different Route Guards (`canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`, `resolve`) in Angular?',
  'How can you restrict routes based on user in Angular?':
    'How do you restrict unauthorized users from accessing specific route URLs or components using Angular Route Guards?',
  'What are Interceptors?':
    'What is an HTTP Interceptor (`HttpInterceptorFn`) in Angular and how does it intercept outgoing requests and incoming responses?',
  'Is it recommended according to HTTP specifications (`RFC 7231`) to send a request body/payload inside an HTTP GET request? What are the standard alternatives (`POST/PUT or query parameters`)?':
    'Can you include a request body/payload inside an HTTP GET API request (`HttpClient.get()`)?',
  'What are the ways to share data between components other than `@Input()` and `@Output()`?':
    'Different ways to share data between components',
  'What types of data (`strings vs objects`) can you store in browser Session Storage?':
    'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?',
  'Is it secure or recommended to store sensitive or personal data (`PII/tokens`) in browser Session Storage?':
    'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?',
  'What is NgRx and how does its Redux-pattern architecture (`Store, Actions, Reducers, Effects, Selectors`) work in Angular?':
    'What is NgRx and how did you implement it in Angular applications?',
  'Why does Angular use View Encapsulation (`ViewEncapsulation.Emulated`) for components by default?':
    'What is ViewEncapsulation?',
  'Is ngClass the only way to change CSS dynamically?': 'If I want to change CSS dynamically, how?',
  'What is the default port of Angular?': 'What happens when we run `ng serve`?',
  "What happens if we don't have `AppComponent` in an Angular project?":
    'How does the browser load an Angular application?',
  'Why do we need Arrow Functions when regular function declarations already exist (`lexical this binding`)?':
    'What are ES6 Arrow Functions (`() => {}`) in JavaScript/TypeScript and how do they differ from regular functions?',
  'What are ways to optimize an Angular application?':
    'How do you optimize an Angular application? Consider lazy loading, OnPush change detection, trackBy, and caching.',
  'When would you choose Signals over Observables?': 'Difference between Signals and RxJS',
  'How do you handle transactions in MongoDB?':
    'What is a transaction in MongoDB, and when would you use it?',
  'How do you write unit tests for async functions in Jest?':
    'How do you test asynchronous code in Jest?',
  'What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?':
    'What are SQL joins and when do you use each type?',
  'What is the primary benefit of fetching API data inside a Route Resolver (`ResolveFn`) instead of inside the component`s `ngOnInit()`?':
    'What are Resolvers?',
  // Foundations track (2026-11): duplicates across tracks and trivia merged into one question
  'What is the difference between == and === in JavaScript?': 'Difference between == and ===',
  'What is the Temporal Dead Zone (TDZ) in JavaScript and why does accessing let and const before declaration throw a ReferenceError?':
    'What is the Temporal Dead Zone (TDZ) in JavaScript and how does it affect hoisting with let and const?',
  'What are closures and how are they used in Node.js?': 'Explain closures with practical examples',
  'What is the difference between deep clone and shallow clone?': 'Deep copy vs shallow copy',
  'What is the latest JavaScript version you have used?': 'What are ES6 features?',
  'What is the difference between interface and type alias in TypeScript?':
    'Difference between Type and Interface',
  'What is the difference between unknown and any in TypeScript?':
    'What is the difference between `any`, `unknown`, and `never`?',
  'What are generics in TypeScript and how do they improve type safety?':
    'What are Generics in TypeScript?',
  'What are TypeScript utility types? (Partial, Pick, Omit, Record, Readonly)':
    'What are utility types (`Partial`, `Pick`, `Omit`, `Record`, `Readonly`) and where do you use them in Angular?',
  'What is the difference between namespace and module in TypeScript?':
    'What is the difference between CommonJS (require) and ES Modules (import) in Node.js?',
  'DOM manipulations': 'What is your understanding of the DOM? Explain with a real-time example.',
  'What CLI command is used to run and serve a project in Angular?':
    'What happens when we run `ng serve`?',
  'How do you change the default port of an Angular application when running locally (`ng serve`) or in `angular.json`?':
    'What happens when we run `ng serve`?',
  'Why do we need Node.js and npm before working with Angular?':
    'What happens when we run `ng serve`?',
  'What is the purpose of ngOnInit() in Angular components?':
    'Explain the execution order and purpose of all Angular component lifecycle hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngOnDestroy`, etc.).',
  'Does `ngOnChanges` execute every time or only when `@Input()` properties change? Does it execute before `ngOnInit()`?':
    'Explain the execution order and purpose of all Angular component lifecycle hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngOnDestroy`, etc.).',
  'How to use BComponent inside AComponent?':
    'What are Standalone Components and their advantages?',
  'What is the default `ViewEncapsulation` mode (`Emulated`) in Angular and how does it scope component styles via unique attributes (`_ngcontent-xxx`)?':
    'What is ViewEncapsulation?',
  'What happens to CSS styles when component encapsulation (`ViewEncapsulation.None`) is set to None?':
    'What is ViewEncapsulation?',
  'What is Change Detection in Angular and how does the mechanism work across component trees?':
    'How does Change Detection work in Angular?',
  'Difference between Signals and BehaviorSubject': 'Difference between Signals and RxJS',
  'What does the map operator do?': 'Which RxJS operators have you used?',
  'What does the filter operator do?': 'Which RxJS operators have you used?',
  'Why do we use pipe() before subscribing?': 'Which RxJS operators have you used?',
  'Should error handling happen before or after subscribing?':
    'How do you handle errors in RxJS streams? Explain catchError, retry, and retryWhen',
  'What is the difference between `PUT` (`full replacement`) and `PATCH` (`partial update`) HTTP methods when updating resource data?':
    'What are the most common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and when should each be used?',
  'How do you send a request body/payload in an HTTP POST or PUT request using Angular `HttpClient`?':
    'How do you make an HTTP API call in Angular using `HttpClient`?',
  'Write the TypeScript code to make an HTTP POST API call sending a JSON request payload and custom headers using Angular `HttpClient`.':
    'How do you make an HTTP API call in Angular using `HttpClient`?',
  'Write a function to fetch data from an API such as JsonPlaceholder.':
    'How do you make an HTTP API call in Angular using `HttpClient`?',
  'How to implement Page Not Found route?':
    'What happens if you have `**` (`wildcard route`) as the very first route in the routing configuration file?',
  'How to set query parameters?':
    'Is passing state and parameters through Angular routing preferred over using a shared service? When should each be used?',
  "What is the primary benefit of fetching API data inside a Route Resolver (`ResolveFn`) instead of inside the component's `ngOnInit()`?":
    'What are Resolvers?',
  'What happens if you resolve and subscribe to an API inside an Angular Route Resolver (`ResolveFn`) before loading the component?':
    'What are Resolvers?',
  'How do you communicate and pass data between parent and child components in Angular?':
    'Different ways to share data between components',
  'In a large Angular application, how do you pass data between components?':
    'Different ways to share data between components',
  'How is your application managing state and sharing data between components?':
    'Different ways to share data between components',
  'What is browser Session Storage?':
    'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?',
  'Difference between Ask, Agent, and Plan mode in GitHub Copilot': 'Have you used any AI tools?',
  'How does Node.js handle asynchronous operations if it is single-threaded?':
    'What is the Event Loop in Node.js and how does it work?',
  'What is the domain module and is it still recommended?':
    'How do you handle uncaught exceptions in Node.js?',
  'What are new features of Angular 21?': 'What changed in recent Angular releases (v19–v21)?',
  // Content review (2026-11): trivia and cross-topic duplicates merged as "Follow-up" sections
  'Which Angular versions have you worked on?':
    'What changed in recent Angular releases (v19–v21)?',
  'Do you have exposure working in Vanilla JavaScript?':
    'Why did you choose Angular when most developers are learning React?',
  'Have you worked on CI/CD pipelines?': 'What deployment activities have you handled?',
  'Have you worked on resolving issues in CI/CD pipelines?':
    'What deployment activities have you handled?',
  'Is `AppComponent` mandatory? Can we build and bootstrap an Angular project without `AppComponent`?':
    'How does the browser load an Angular application?',
  'If I want to toggle an element dynamically without using *ngIf, how?':
    'What is the built-in control flow (`@if`, `@for`, `@switch`) and how is it better than `*ngIf` / `*ngFor`?',
  'What is setControl in FormArray?': 'How to implement Dynamic Forms in Angular using FormArray?',
  'Will you be able to see the API request in the browser Network tab if the request is triggered inside a Route Resolver or Guard?':
    'What are Resolvers?',
  'Have you used BehaviorSubject in any real scenario?':
    'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?',
  'How do you declare a `BehaviorSubject` and emit/share values to all subscribed components?':
    'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?',
  'How to handle errors and retry an API call up to 3 times using RxJS?':
    'How do you handle errors in RxJS streams? Explain catchError, retry, and retryWhen',
  'Find duplicate values in an array':
    'Remove duplicate elements from an array [1,2,2,3,4,4,5] using built-in method and for loop',
  'How do you use worker threads for CPU-intensive tasks?':
    'What are Worker Threads in Node.js and when should you use them?',
  'What is lazy loading and how do you implement it?':
    'What techniques do you use to optimize Node.js application performance?',
  'What is gRPC and when should you use it over REST?':
    'What is the difference between REST, GraphQL, and gRPC?',
  'How do you implement rate limiting in Node.js?':
    'How do you implement rate limiting using Redis?',
  'What is the difference between find() and aggregate() in MongoDB?':
    'What is the MongoDB aggregation pipeline?',
  'What is the difference between lean() and regular Mongoose queries?':
    'What is Mongoose and what are its advantages?',
};

@Service()
export class Question {
  private categories: CategoryModel[] = [
    // ─── ANGULAR MODE ──────────────────────────────────────────────────────────

    // ── Language foundations ──
    {
      id: 'javascript-fundamentals',
      icon: 'ti-brand-javascript',
      title: 'JavaScript Fundamentals',
      color: '#B45309',
      bg: '#FEF3E2',
      questions: [
        'What are ES6 features?',
        'Difference between var, let, and const',
        'What is the Temporal Dead Zone (TDZ) in JavaScript and how does it affect hoisting with let and const?',
        'Difference between == and ===',
        'Explain closures with practical examples',
        'What is currying in JavaScript?',
        'What are ES6 Arrow Functions (`() => {}`) in JavaScript/TypeScript and how do they differ from regular functions?',
        'Difference between prototype and __proto__',
        'How to implement inheritance in JavaScript?',
        'Deep copy vs shallow copy',
        'Explain how the JavaScript Event Loop works',
        'What is a Promise in JavaScript?',
        'Debounce vs Throttle',
        'What is the difference between null and undefined in JavaScript?',
        'What is the difference between call(), apply(), and bind()?',
        'Explain the JavaScript prototype chain',
        'What is the difference between Array.map(), Array.filter(), and Array.reduce()?',
        'What is Promise.all() vs Promise.allSettled() vs Promise.race() vs Promise.any()?',
        'What are generator functions and async generators in JavaScript?',
        'What is a Proxy object and how is it used?',
        'What are WeakMap and WeakSet, and why do they allow garbage collection?',
      ],
    },
    {
      id: 'typescript',
      icon: 'ti-brand-typescript',
      title: 'TypeScript',
      color: '#185FA5',
      bg: '#E6F1FB',
      questions: [
        'Difference between Type and Interface',
        'What are Generics in TypeScript?',
        'What is the difference between `any`, `unknown`, and `never`?',
        'What are utility types (`Partial`, `Pick`, `Omit`, `Record`, `Readonly`) and where do you use them in Angular?',
        'What are type guards and type narrowing? Explain `typeof`, `instanceof`, `in`, and custom `is` predicates.',
        'What are discriminated unions, and how do they help model UI state like loading, success, and error?',
        'Should you use enums or string literal union types? Explain the trade-offs.',
        'What do `keyof` and `typeof` do when used in a type position?',
        'What are mapped types and conditional types? Give a practical example.',
        'What does the `satisfies` operator do, and how is it different from a type annotation or `as`?',
        'What does `strict` mode enable in `tsconfig.json`, and what does Angular add with `strictTemplates`?',
        'When should you use optional chaining (`?.`), nullish coalescing (`??`), and the non-null assertion (`!`)?',
        'How do you type HTTP responses with `HttpClient.get<T>()`, and why is that not runtime validation?',
        'How do you type async functions and Promises in TypeScript?',
        'What are TypeScript decorators and how are they used?',
      ],
    },
    {
      id: 'browser-dom-css',
      icon: 'ti-browser',
      title: 'Browser, DOM & CSS',
      color: '#0369A1',
      bg: '#E0F2FE',
      questions: [
        'What is your understanding of the DOM? Explain with a real-time example.',
        'What is Event Delegation?',
        'Explain event bubbling and event capturing in JavaScript',
      ],
    },
    {
      id: 'web-accessibility',
      icon: 'ti-accessible',
      title: 'Accessibility',
      color: '#0369A1',
      bg: '#E0F2FE',
      questions: [
        'What does accessibility mean for a web app, and what do WCAG levels A, AA and AAA require?',
        'Why should you start with semantic HTML, and when do you actually need ARIA?',
        'How do you make a custom component such as a dropdown or tabs fully keyboard accessible?',
        'How do you manage focus in a single-page app: on route changes, in modals, and with focus traps?',
        'How do you make dynamic content and form errors announced to screen-reader users?',
        'What are the colour contrast, motion and zoom requirements, and how do you check them?',
        'What does the Angular CDK a11y package provide (`FocusTrap`, `LiveAnnouncer`, `FocusMonitor`, `ListKeyManager`)?',
        'How do you test accessibility: automated tools, keyboard-only checks and screen readers?',
      ],
    },
    {
      id: 'web-performance',
      icon: 'ti-gauge',
      title: 'Web Performance',
      color: '#059669',
      bg: '#D1FAE5',
      questions: [
        'What are Core Web Vitals (LCP, INP, CLS), what are the thresholds, and why do they matter?',
        'How do you improve Largest Contentful Paint (LCP)?',
        'What is Interaction to Next Paint (INP), and how do you fix a slow interaction?',
        'What causes Cumulative Layout Shift (CLS), and how do you prevent it?',
        'Lab data vs field data: how do you measure performance with Lighthouse, DevTools, CrUX and real-user monitoring?',
        'How does the critical rendering path work, and what blocks rendering?',
        'How do you load images and fonts efficiently (modern formats, responsive images, lazy loading, `font-display`)?',
        'How do HTTP caching headers and a CDN work together for a web app (`Cache-Control`, `ETag`, immutable assets)?',
        'What are resource hints (`preload`, `preconnect`, `prefetch`, `fetchpriority`), and when do they backfire?',
        'How do you set and enforce a performance budget in CI?',
      ],
    },
    {
      id: 'dsa-patterns',
      icon: 'ti-binary-tree',
      title: 'Data Structures & Algorithms',
      color: '#7C3AED',
      bg: '#EDE9FE',
      questions: [
        'How do you analyse time and space complexity, and what Big-O should you aim for in an interview?',
        'Two Sum: solve it in O(n) with a hash map. When is a hash map the right tool?',
        'Two pointers: check whether a sorted array has a pair with a given sum, and remove duplicates in place.',
        'Sliding window: find the longest substring without repeating characters.',
        'Binary search: find the first position where a condition becomes true (e.g. first bad version).',
        'Use a stack to check whether a string of brackets is balanced.',
        'Merge overlapping intervals.',
        'Top K frequent elements: heap vs bucket sort.',
        'BFS vs DFS: count the number of islands in a grid.',
        'Detect a cycle in a dependency graph with topological sort (course schedule).',
        'How do you recognise a dynamic programming problem? Solve climbing stairs and coin change.',
        'How do you approach a coding problem you have not seen before in a live interview?',
      ],
    },

    // ── Angular core ──
    {
      id: 'angular-cli-build',
      icon: 'ti-terminal',
      title: 'CLI, Build & Bootstrapping',
      color: '#475569',
      bg: '#F1F5F9',
      questions: [
        'What happens when we run `ng serve`?',
        'How does the browser load an Angular application?',
        'What changed in recent Angular releases (v19–v21)?',
      ],
    },
    {
      id: 'components',
      icon: 'ti-layout-2',
      title: 'Components & Lifecycle',
      color: '#0F6E56',
      bg: '#E1F5EE',
      questions: [
        'What are Standalone Components and their advantages?',
        'Explain the execution order and purpose of all Angular component lifecycle hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngOnDestroy`, etc.).',
        'Content projection and ViewChild',
        'Difference between ng-content and ng-template',
      ],
    },
    {
      id: 'templates-styling',
      icon: 'ti-palette',
      title: 'Templates & Styling',
      color: '#BE185D',
      bg: '#FCE7F3',
      questions: [
        'If I want to change CSS dynamically, how?',
        'What is ViewEncapsulation?',
        'How can you apply global styles or pass specific parent component styles down to child components in Angular (`:host-context()`, CSS variables)?',
        'How can you dynamically apply different styles or themes to the same CSS class across multiple component instances in Angular?',
      ],
    },
    {
      id: 'pipes',
      icon: 'ti-filter',
      title: 'Pipes',
      color: '#C026D3',
      bg: '#FAE8FF',
      questions: [
        'What are pipes in Angular? Name the built-in pipes you use most.',
        'What is the difference between pure and impure pipes?',
        'How do you create a custom pipe? Write one with parameters.',
        'How does the `async` pipe work, and why is it preferred over subscribing manually?',
        'Why is calling a method in a template bad for performance, and how do pure pipes or `computed()` fix it?',
        "Why doesn't Angular ship `filter` or `orderBy` pipes, and how should you filter or sort lists instead?",
        'How do you use a pipe inside a component or service class instead of a template?',
      ],
    },
    {
      id: 'directives',
      icon: 'ti-code',
      title: 'Directives & Decorators',
      color: '#993C1D',
      bg: '#FAECE7',
      questions: [
        'What are directives in Angular?',
        'What does @HostListener do?',
        'Create a custom directive to change background color on hover/unhover',
      ],
    },
    {
      id: 'dependency-injection',
      icon: 'ti-plug-connected',
      title: 'Dependency Injection & Services',
      color: '#4338CA',
      bg: '#E0E7FF',
      questions: [
        'Why do we use services in Angular apart from API calls?',
        'What is Dependency Injection in Angular apart from injecting services?',
        'How does Dependency Injection work internally?',
        'What is Multi Provider Token?',
      ],
    },
    {
      id: 'change-detection',
      icon: 'ti-refresh',
      title: 'Change Detection',
      color: '#854F0B',
      bg: '#FAEEDA',
      questions: [
        'How does Change Detection work in Angular?',
        'Difference between Default and OnPush Change Detection Strategy',
        'Where and how do you implement custom change detection (`ChangeDetectionStrategy.OnPush` and `markForCheck()`) in code?',
        'Difference between markForCheck() and detectChanges()',
        'Can you configure or trigger change detection strategies at the routing or module level in Angular?',
        'How does Angular detect changes in a zone-less environment?',
      ],
    },

    // ── Reactivity & data ──
    {
      id: 'signals',
      icon: 'ti-bolt',
      title: 'Signals',
      color: '#3B6D11',
      bg: '#EAF3DE',
      questions: [
        'What are Signals in Angular?',
        'Explain different types of Signals and the use case of computed().',
        'Difference between Computed Signal and Effect',
        'Difference between Signals and RxJS',
        'Signals vs NgRx',
      ],
    },
    {
      id: 'modern-angular',
      icon: 'ti-sparkles',
      title: 'Modern Angular (v17+)',
      color: '#E11D48',
      bg: '#FFE4E6',
      questions: [
        'What is the built-in control flow (`@if`, `@for`, `@switch`) and how is it better than `*ngIf` / `*ngFor`?',
        'Why is `track` mandatory in `@for`, and what should you track by?',
        'What are deferrable views (`@defer`)? Explain its triggers and the `@placeholder`, `@loading`, and `@error` blocks.',
        'What are signal inputs (`input()`, `input.required()`) and how do they differ from `@Input()`?',
        'What is `model()` and how does two-way binding work with signals?',
        'What is the `output()` function and how does it differ from `@Output()` with `EventEmitter`?',
        'What are signal queries (`viewChild()`, `contentChildren()`) and why use them instead of `@ViewChild`?',
        'What is `linkedSignal()` and when would you use it instead of `computed()`?',
        'What are `resource()` and `httpResource()`, and how do they load async data with signals?',
        'What is the `inject()` function and why is it preferred over constructor injection?',
        'How do `DestroyRef` and `takeUntilDestroyed()` simplify cleanup and unsubscribing?',
        'How do you migrate an existing Angular app to zoneless change detection?',
        'What is hydration in Angular? Explain event replay and incremental hydration.',
        'What are Signal Forms and how do they differ from Reactive Forms?',
        'How do you migrate an older Angular codebase to modern APIs (standalone, control flow, signal inputs, `inject()`)?',
      ],
    },
    {
      id: 'rxjs',
      icon: 'ti-wave-sine',
      title: 'RxJS & Observables',
      color: '#534AB7',
      bg: '#EEEDFE',
      questions: [
        'What is an Observable in RxJS?',
        'Why do we use Observables in Angular?',
        'What are the key differences between a Promise and an Observable (`eager vs lazy, single vs multiple values, cancellation`)?',
        'Explain the difference between cold and hot observables with examples',
        'What is the core difference between a Subject and an Observable in RxJS?',
        'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?',
        'Which RxJS operators have you used?',
        'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each',
        'Explain the difference between combineLatest, forkJoin, zip, and withLatestFrom',
        'What does shareReplay(1) do and when is it essential?',
        'What is the difference between debounceTime and throttleTime?',
        'How does scan differ from reduce? Where would you use scan in an Angular app?',
        'What is takeUntil and how is it used for subscription management? What are modern alternatives?',
        'What are schedulers in RxJS and when would you use asyncScheduler vs queueScheduler?',
        'How do you handle errors in RxJS streams? Explain catchError, retry, and retryWhen',
        'Explain the complete RxJS flow: API response, subscribe, and error handling',
        "You're building a type-ahead search — implement it using RxJS operators, handling debounce, cancellation of in-flight requests, and deduplication",
        'A user clicks a button 10 times and 10 API calls are triggered. How would you handle this using RxJS?',
        'You have a payment form where the user clicks Submit. How do you prevent duplicate submissions using RxJS? Which operator do you choose and why?',
        "You need to poll an API every 10 seconds but stop polling when the component is destroyed. Show how you'd implement this",
        'An observable chain emits an error and the entire stream terminates. How do you architect a resilient stream that recovers gracefully?',
      ],
    },
    {
      id: 'http-apis',
      icon: 'ti-api',
      title: 'HTTP, APIs & Interceptors',
      color: '#0E7490',
      bg: '#E0F7FA',
      questions: [
        'What are the most common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and when should each be used?',
        'In what different ways can client data be transmitted to an HTTP API endpoint (`Path Params`, `Query Params`, `Headers`, `Request Body/Payload`)?',
        'Can you include a request body/payload inside an HTTP GET API request (`HttpClient.get()`)?',
        'How do you make an HTTP API call in Angular using `HttpClient`?',
        'How do you design API calling from the UI? When do you use the async pipe, and when should you unsubscribe manually?',
        'What is an HTTP Interceptor (`HttpInterceptorFn`) in Angular and how does it intercept outgoing requests and incoming responses?',
        'How to write an HTTP interceptor to handle common error responses?',
        'Global error handling vs component-level error handling',
        'How do you prevent duplicate API requests in Angular?',
        'An API response is required by multiple components. How would you avoid repeated API calls?',
      ],
    },
    {
      id: 'routing',
      icon: 'ti-route',
      title: 'Routing & Guards',
      color: '#185FA5',
      bg: '#E6F1FB',
      questions: [
        'What happens if you have `**` (`wildcard route`) as the very first route in the routing configuration file?',
        'Is it possible to use multiple Router Outlets in Angular? If yes, how?',
        'How would you track every route change to monitor user navigation?',
        'How do you implement route-level lazy loading of standalone components or feature modules in Angular (`loadChildren` / `loadComponent`)?',
        'Explain Lazy Loading and Preloading Strategies',
        'What are the different Route Guards (`canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`, `resolve`) in Angular?',
        'Difference between canMatch and canLoad',
        'How do you restrict unauthorized users from accessing specific route URLs or components using Angular Route Guards?',
        'What are Resolvers?',
      ],
    },
    {
      id: 'forms',
      icon: 'ti-forms',
      title: 'Forms',
      color: '#993556',
      bg: '#FBEAF0',
      questions: [
        'What can Reactive Forms do in a real-time application?',
        'Difference between setValue and patchValue',
        'How to implement Dynamic Forms in Angular using FormArray?',
        'How to implement a dynamic form where input fields are shown/hidden based on selection?',
        'How would you build a dynamic form using JSON configuration instead of hardcoding controls?',
        'Your form has more than 50 fields. Will you keep the complete reactive form and template inside one component?',
        'Your application has a stepper and each step is implemented in a different Angular component. How would you share the complete form across all steps?',
        'Suppose a Reactive Form contains a dropdown that gets enabled/disabled from multiple events. A defect is reported where the dropdown behaves incorrectly. How would you debug which event is changing its state?',
      ],
    },

    // ── State & architecture ──
    {
      id: 'component-communication',
      icon: 'ti-arrows-exchange',
      title: 'Component Communication & Shared State',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        'Different ways to share data between components',
        'Is passing state and parameters through Angular routing preferred over using a shared service? When should each be used?',
        'You have a value that has to be shared across all components. How do you implement this cleanly in Angular?',
        'Write the TypeScript syntax and code to implement a shared state service (`using BehaviorSubject or Signals`) across all components.',
        'If admin updates data and changes need to reflect in multiple components simultaneously, how?',
      ],
    },
    {
      id: 'ngrx',
      icon: 'ti-stack-2',
      title: 'NgRx State Management',
      color: '#7E22CE',
      bg: '#F3E8FF',
      questions: [
        'What is NgRx and how did you implement it in Angular applications?',
        'What are the steps to set up NgRx in an Angular application?',
        'Explain the NgRx data flow: Action → Reducer → Store → Selector → Component → Effect → Action',
        'What is the difference between createAction, createReducer, and createEffect?',
        'What is the difference between dispatch and select in NgRx? How do you avoid unnecessary re-renders via selectors?',
        'What are Selectors in NgRx? Explain memoization and why it matters for performance',
        'What is createFeatureSelector and when do you use it?',
        'How do Effects work in NgRx? Explain ofType, switchMap, and error handling inside effects',
        'Explain concatLatestFrom (formerly withLatestFrom in effects) and its use case',
        'What is NgRx Entity and what problem does it solve?',
        'What is the NgRx Signal Store (introduced in NgRx 17)? How does it differ from the traditional store?',
        'Design the NgRx state shape for a banking dashboard that shows account list, selected account details, and transaction history with pagination',
        'An Effect makes an HTTP call, but you want to cancel the previous request if a new action arrives. Which operator do you use inside the effect and why?',
        'Your selector is being called too frequently causing performance issues. How do you diagnose and fix this?',
        'How would you implement optimistic updates using NgRx?',
        'How would you implement undo/redo functionality using NgRx?',
      ],
    },
    {
      id: 'architecture',
      icon: 'ti-building',
      title: 'Architecture & Design',
      color: '#1E40AF',
      bg: '#DBEAFE',
      questions: [
        'How to implement SOLID principles in an Angular application?',
        'Are you familiar with the facade pattern in Angular? Explain where you have used it.',
        'Have you worked on Micro Frontend architecture?',
        'If multiple applications need to share data, how would you design the communication?',
        'Do you create HLD or LLD documents while implementing new features?',
        'Describe the architecture, tech stack, state management, and key modules of an enterprise Angular application you have worked on.',
      ],
    },
    {
      id: 'frontend-system-design',
      icon: 'ti-layout-dashboard',
      title: 'Frontend System Design',
      color: '#0E7490',
      bg: '#CFFAFE',
      questions: [
        'How do you approach a frontend system design interview?',
        'How would you design an autocomplete (type-ahead) search component?',
        'How would you design an infinite-scrolling news feed?',
        'How would you design a reusable component library or design system shared by several Angular apps?',
        'How would you design a real-time dashboard that shows live data?',
        'How would you design an offline-first Angular application?',
        'How would you design a large multi-step form, such as a loan or insurance application?',
        'How would you structure a large Angular codebase so that several teams can work on it independently?',
      ],
    },

    // ── Quality & production ──
    {
      id: 'performance',
      icon: 'ti-speedboat',
      title: 'Performance & Optimization',
      color: '#3B6D11',
      bg: '#EAF3DE',
      questions: [
        'How do you optimize an Angular application? Consider lazy loading, OnPush change detection, trackBy, and caching.',
        'Handle bulk records using virtual scrolling and pagination, and limit API result per page',
        'What is Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?',
        'How do you analyse and reduce an Angular bundle (build stats, lazy routes, `@defer`, tree-shaking pitfalls)?',
        'How do `@defer` and incremental hydration improve Core Web Vitals in an Angular app?',
        'How does `NgOptimizedImage` improve LCP and CLS?',
        'How do you find and fix slow change detection with Angular DevTools and the Chrome Performance panel?',
        'When should you move work to a web worker in an Angular app, and how?',
      ],
    },
    {
      id: 'security-storage',
      icon: 'ti-shield-lock',
      title: 'Security & Browser Storage',
      color: '#B91C1C',
      bg: '#FEE2E2',
      questions: [
        'How are you securing your Angular application?',
        'How to implement role-based access control in Angular?',
        'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?',
        'What is XSS (Cross-Site Scripting) and how does Angular protect against it by default?',
        'What does `DomSanitizer` do, and when should you use `bypassSecurityTrustHtml`?',
        'What is CSRF/XSRF and how does Angular `HttpClient` help prevent it?',
        'What is a Content Security Policy (CSP) and how do you use it with Angular?',
        'What are Trusted Types and how does Angular support them?',
        'How do the `HttpOnly`, `Secure`, and `SameSite` cookie attributes protect a session?',
        'Why are route guards and hidden buttons not real security?',
        "What is CORS, and why can't you fix a CORS error from the Angular app?",
      ],
    },
    {
      id: 'testing',
      icon: 'ti-test-pipe',
      title: 'Testing',
      color: '#059669',
      bg: '#D1FAE5',
      questions: [
        'Have you used Angular testing frameworks?',
        'How will you mock a service?',
        'Your UI development is complete but backend APIs are still under development and API contracts are available. How will you test the application?',
        'How do you set up a component test with `TestBed` and `ComponentFixture`?',
        'How do you test a component that uses signal inputs (`input()`) and outputs (`output()`)?',
        'How do you test HTTP calls with `HttpTestingController`?',
        'How do you test asynchronous code such as timers and debounced search in Angular tests?',
        'How do you test OnPush and zoneless components, and what does `fixture.whenStable()` do?',
        'How do you test a functional route guard or HTTP interceptor?',
        'What are component harnesses (`ComponentHarness`) and why use them?',
        'What is the default test runner in modern Angular, and how does Vitest compare with Karma/Jasmine and Jest?',
        'What should you cover with unit tests versus end-to-end tests (Playwright or Cypress)?',
        'What makes a test flaky, and how do you avoid flaky Angular tests?',
      ],
    },
    {
      id: 'frontend-debugging',
      icon: 'ti-bug',
      title: 'Debugging & Real-World Scenarios',
      color: '#DC2626',
      bg: '#FEE2E2',
      questions: [
        'Memory keeps growing the longer a user keeps the Angular app open. How do you find and fix the leak?',
        'You get `ExpressionChangedAfterItHasBeenCheckedError`. What causes it, and how do you fix it properly?',
        'A table with 10,000 rows freezes the page. How do you diagnose and fix it?',
        'A bug happens only in production, never locally. How do you investigate it?',
        'After a deployment, some users see a blank page or a `ChunkLoadError`. Why, and how do you prevent it?',
        'An API call works in Postman but fails from the browser with a CORS error in production. How do you debug it?',
        'The app is slow on first load. How do you measure and improve LCP and bundle size?',
        "A component's view does not update even though the data changed. What are the likely causes?",
        'Users report that a button sometimes does nothing when clicked. How do you reproduce and track it down?',
      ],
    },
    {
      id: 'experience-behavioral',
      icon: 'ti-user-star',
      title: 'Experience & Behavioral',
      color: '#A8300B',
      bg: '#FCE9E1',
      questions: [
        'Why did you choose Angular when most developers are learning React?',
        'Which third-party Angular libraries have you used in your projects, and why?',
        'What is the most challenging technical or performance bug you have solved in an Angular frontend application and how did you resolve it?',
        'Have you created any proof of concept (POC)? Explain one.',
        'What deployment activities have you handled?',
        'Have you worked with teams from different organizations where your module depended on parallel development teams? How did you manage communication and dependencies?',
        'Have you used any AI tools?',
        'Tell me about yourself.',
        'How do you structure answers to behavioral questions using the STAR method?',
        'Tell me about a time you disagreed with a teammate or reviewer on a technical decision.',
        'Tell me about a time you missed a deadline or a project went off track.',
        'Tell me about a production bug you caused and how you handled it.',
        'How do you give and receive code review feedback?',
        'Tell me about a time you mentored or helped a junior developer.',
        'How do you estimate a feature, and what do you do when your estimate turns out to be wrong?',
        'Why are you looking for a change, and why do you want to join this company?',
        'What questions should you ask the interviewer at the end of an interview?',
      ],
    },
    {
      id: 'coding-round',
      icon: 'ti-terminal-2',
      title: 'JavaScript Coding',
      color: '#6B21A8',
      bg: '#F3E8FF',
      questions: [
        'Check if a string is a palindrome',
        'Find the first non-repeating character in a string',
        'Remove duplicate elements from an array [1,2,2,3,4,4,5] using built-in method and for loop',
        'Flatten a nested array',
        'Group an array of objects by property',
        'Implement a debounce() function',
      ],
    },

    // ─── NODE.JS MODE ──────────────────────────────────────────────────────────

    // ── Runtime & language ──
    {
      id: 'nodejs-fundamentals',
      icon: 'ti-brand-nodejs',
      title: 'Node.js Fundamentals',
      color: '#16A34A',
      bg: '#DCFCE7',
      questions: [
        'What is Node.js and how does it differ from browser JavaScript?',
        'What is libuv and what role does it play in Node.js?',
        'What is the difference between synchronous and asynchronous code in Node.js?',
        'What is the Event Loop in Node.js and how does it work?',
        'What are the phases of the Node.js Event Loop?',
        'What is the difference between process.nextTick() and setImmediate()?',
        'What is the difference between setTimeout() and setImmediate() in the context of the event loop?',
        'What is the difference between CommonJS (require) and ES Modules (import) in Node.js?',
        'What is module caching in Node.js?',
        'What are Worker Threads in Node.js and when should you use them?',
        'What is the difference between child_process.fork(), spawn(), and exec()?',
        'How do you set up TypeScript in a Node.js project?',
      ],
    },
    {
      id: 'nodejs-error-handling',
      icon: 'ti-shield-exclamation',
      title: 'Error Handling',
      color: '#DC2626',
      bg: '#FEE2E2',
      questions: [
        'What is the difference between operational errors and programmer errors?',
        'How do you handle uncaught exceptions in Node.js?',
        'What is the difference between try/catch and process.on("uncaughtException")?',
        'How do you implement graceful shutdown in Node.js?',
      ],
    },
    {
      id: 'nodejs-streams',
      icon: 'ti-wave-sine',
      title: 'Streams & Buffers',
      color: '#0284C7',
      bg: '#E0F2FE',
      questions: [
        'What is a Buffer in Node.js and when would you use it?',
        'What are the four types of streams in Node.js?',
        'What is backpressure and how does Node.js handle it?',
        'What is stream.pipeline() and why is it preferred over .pipe()?',
        'How do you create a custom Transform stream?',
        'How would you process a large CSV file efficiently in Node.js?',
      ],
    },
    {
      id: 'nodejs-memory',
      icon: 'ti-cpu',
      title: 'Memory Management',
      color: '#D97706',
      bg: '#FEF3C7',
      questions: [
        'How does garbage collection work in Node.js?',
        'What are common causes of memory leaks in Node.js applications?',
        'How do you detect and diagnose memory leaks in a production Node.js app?',
        'How do you test for memory leaks in Node.js?',
        'What tools can you use to monitor Node.js memory usage?',
      ],
    },

    // ── Building APIs ──
    {
      id: 'nodejs-express-nestjs',
      icon: 'ti-server',
      title: 'Express & NestJS',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        'How does Express middleware work?',
        'What is the difference between app.use() and app.get() in Express?',
        'What is the difference between Fastify and Express?',
        'What is NestJS and how does it differ from Express?',
        'What are Guards, Interceptors, and Pipes in NestJS?',
        'How do you implement request validation in NestJS using class-validator?',
        'How do you implement JWT authentication in NestJS?',
        'How do you implement versioned APIs in NestJS?',
        'How do you handle file uploads in Express/NestJS?',
      ],
    },
    {
      id: 'nodejs-api-design',
      icon: 'ti-api',
      title: 'API Design',
      color: '#1D4ED8',
      bg: '#DBEAFE',
      questions: [
        'What makes a REST API well designed: resources, naming, status codes and consistency?',
        'How do you evolve an API without breaking existing clients (versioning and backward compatibility)?',
        'How should an API return errors? Explain Problem Details (RFC 9457).',
        'How do you use OpenAPI in a team: contract-first vs code-first, and generated clients?',
        'How do you design and secure webhooks (signatures, retries, idempotency)?',
        'What is the N+1 problem in GraphQL, and how does DataLoader solve it?',
        'What is the Backend-for-Frontend (BFF) pattern, and when is it worth it?',
        'How do you design filtering, sorting and field selection for a list endpoint?',
        'How do you design long-running operations in an API (202 Accepted, polling, callbacks)?',
      ],
    },
    {
      id: 'nodejs-networking',
      icon: 'ti-wifi',
      title: 'Networking & HTTP',
      color: '#7C3AED',
      bg: '#EDE9FE',
      questions: [
        'What are HTTP status codes? Explain 2xx, 3xx, 4xx, 5xx ranges.',
        'What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?',
        'What is Keep-Alive in HTTP connections?',
        'What is TLS/SSL and how do you enable HTTPS in Node.js?',
        'How do you implement request timeouts in Node.js HTTP servers?',
        'What is the difference between REST, GraphQL, and gRPC?',
        'What are WebSockets and how do you implement them in Node.js?',
        'What is Server-Sent Events (SSE) and when should you use it over WebSockets?',
      ],
    },
    {
      id: 'nodejs-security',
      icon: 'ti-lock',
      title: 'Security & Auth',
      color: '#B91C1C',
      bg: '#FEE2E2',
      questions: [
        'What are the most common security vulnerabilities in Node.js applications?',
        'What is the difference between authentication and authorization?',
        'What is JWT and how does authentication work with it?',
        'What is OAuth 2.0 and how does it work?',
        'How do you store passwords securely in Node.js?',
        'What is SQL injection and how do you prevent it?',
        'How do you prevent NoSQL injection in MongoDB?',
        'What is CORS and how do you configure it in Node.js?',
        'What is helmet.js and what security headers does it set?',
      ],
    },
    {
      id: 'nodejs-auth-advanced',
      icon: 'ti-key',
      title: 'Auth in Depth',
      color: '#B45309',
      bg: '#FEF3C7',
      questions: [
        'Sessions vs JWTs: what are the real trade-offs for a web app?',
        'How do access tokens and refresh tokens work together, and what is refresh token rotation?',
        'How do you revoke a JWT or log a user out before the token expires?',
        'What is OpenID Connect, and how does it differ from OAuth 2.0?',
        'What is PKCE, and why is it required for single-page and mobile apps?',
        'Where should an Angular SPA keep its tokens, and how does the BFF pattern help with auth?',
        'How does single sign-on work with SAML or OIDC in an enterprise app?',
        'RBAC vs ABAC vs ReBAC: how do you model permissions?',
        'How do you enforce tenant isolation in a multi-tenant SaaS API?',
        'How do you add MFA and passkeys (WebAuthn) to a login flow?',
      ],
    },

    // ── Data ──
    {
      id: 'nodejs-sql',
      icon: 'ti-table',
      title: 'Relational Databases & SQL',
      color: '#1D4ED8',
      bg: '#DBEAFE',
      questions: [
        'What is the difference between SQL and NoSQL databases?',
        'What is database normalization? Explain 1NF, 2NF, 3NF',
        'What are SQL joins and when do you use each type?',
        'What are indexes in SQL and how do they work?',
        'What is the difference between clustered and non-clustered indexes?',
        'What are database transaction isolation levels?',
        'What is a stored procedure?',
        'What is an ORM? What are the advantages and disadvantages of using one?',
        'What is the N+1 query problem and how do you fix it?',
        'How do you read an `EXPLAIN ANALYZE` plan to find out why a query is slow?',
        'How do you design a composite index, and why does column order matter?',
        'What causes deadlocks, and how do you prevent and handle them?',
        'How do you change a database schema with zero downtime (expand and contract)?',
        'How do read replicas work, and how do you deal with replication lag?',
        'When and how do you partition or shard a relational table?',
        'PostgreSQL `JSONB` vs a document database: when is each the better choice?',
        'How do you design a multi-tenant database: shared schema, schema per tenant, or database per tenant?',
      ],
    },
    {
      id: 'nodejs-nosql',
      icon: 'ti-database',
      title: 'NoSQL Databases (MongoDB)',
      color: '#166534',
      bg: '#DCFCE7',
      questions: [
        'What is MongoDB and when would you choose it over a relational database?',
        'What is the difference between embedding and referencing in MongoDB schema design?',
        'Why are unbounded arrays an anti-pattern in MongoDB, and what happens when a document approaches the 16 MB limit?',
        'What are the MongoDB schema design patterns (bucket, computed, subset, extended reference, outlier), and when do you use each?',
        'Design the MongoDB data model for an e-commerce catalog with product variants, inventory and reviews.',
        'What are indexes in MongoDB and when should you create them?',
        'Which MongoDB index types do you use in practice (compound, partial, TTL, sparse, wildcard, text, unique), and for what?',
        'What is the MongoDB aggregation pipeline?',
        'How do you optimise a slow aggregation pipeline (stage order, `$lookup` cost, `$facet`, `allowDiskUse`)?',
        'How do you paginate a large MongoDB collection, and why does `skip()` get slow?',
        'A MongoDB query became slow as the data grew. How do you use `explain("executionStats")` to find and fix the problem?',
        'What is a transaction in MongoDB, and when would you use it?',
        'Suppose you need to update three MongoDB collections as part of a single business operation. If the third update fails, how would you ensure that the first two updates are rolled back?',
        'Duplicate documents are being created even though the code checks whether one exists before inserting. Why, and how do you fix it?',
        'What is a replica set in MongoDB?',
        'What are write concern, read concern and read preference, and what can go wrong when you read from secondaries?',
        'What are MongoDB change streams, and how do you use them reliably (resume tokens)?',
        'What is sharding in MongoDB?',
        'How do you choose a shard key, and why does a monotonically increasing key create a hot shard?',
        'What is Mongoose and what are its advantages?',
        'Mongoose `populate()` on a list endpoint is slow. What is happening, and when should you use `$lookup` instead?',
        'Your serverless functions keep exhausting MongoDB connections. Why, and how do you fix it?',
        'How do you change a MongoDB schema without downtime (schema versioning, lazy migration vs backfill)?',
        'The working set no longer fits in RAM and MongoDB latency spikes. How do you confirm it and what are your options?',
      ],
    },
    {
      id: 'nodejs-caching',
      icon: 'ti-database-import',
      title: 'Caching, Redis & Queues',
      color: '#DC2626',
      bg: '#FEE2E2',
      questions: [
        'What are common caching strategies? (Cache-Aside, Write-Through, Write-Behind)',
        'What is cache invalidation and what are the strategies?',
        'What is Redis and what are its use cases in Node.js?',
        'How do you implement a Redis cache in a Node.js application?',
        'How do you implement rate limiting using Redis?',
        'How do you implement distributed locks with Redis?',
        'What is the difference between Redis Pub/Sub and Redis Streams?',
        'What is BullMQ and how does it use Redis for job queues?',
      ],
    },

    // ── Production ──
    {
      id: 'nodejs-performance',
      icon: 'ti-bolt',
      title: 'Performance & Optimization',
      color: '#B45309',
      bg: '#FEF3E2',
      questions: [
        'How do you profile and debug Node.js performance issues?',
        'What techniques do you use to optimize Node.js application performance?',
        'How does connection pooling work in Node.js database connections?',
        'How do you implement pagination — offset vs cursor-based?',
        'What is HTTP response compression and how do you enable it?',
      ],
    },
    {
      id: 'nodejs-clustering',
      icon: 'ti-network',
      title: 'Clustering & Scaling',
      color: '#0891B2',
      bg: '#E0F2FE',
      questions: [
        'What is clustering in Node.js and why is it needed?',
        'How do you implement clustering in Node.js using the cluster module?',
        'How does the primary process distribute requests among workers in cluster mode?',
        'How do you share state between cluster workers?',
        'What is PM2 and how does it manage Node.js processes?',
      ],
    },
    {
      id: 'nodejs-testing',
      icon: 'ti-test-pipe',
      title: 'Testing',
      color: '#059669',
      bg: '#D1FAE5',
      questions: [
        'What is the difference between unit, integration, and end-to-end tests?',
        'What testing frameworks are commonly used in Node.js?',
        'How do you test asynchronous code in Jest?',
        'How do you mock modules and dependencies in Jest?',
        'How do you test Express routes using Supertest?',
        'What is test coverage and how do you measure it in Node.js?',
      ],
    },
    {
      id: 'nodejs-devops',
      icon: 'ti-brand-docker',
      title: 'CI/CD & DevOps',
      color: '#0369A1',
      bg: '#E0F2FE',
      questions: [
        'What is CI/CD and what tools have you used?',
        'What is Docker and how is it used with Node.js?',
        'What is a Dockerfile and how do you write one for Node.js?',
        'What is Kubernetes and what problem does it solve?',
        'What is a reverse proxy and why is Nginx used with Node.js?',
        'How do you manage environment variables securely in Node.js?',
        'What are health checks and how do you implement them in Node.js?',
        'Blue-green vs canary vs rolling deployments: how do you choose?',
        'How do feature flags help you release safely, and what are the risks?',
        'What is Infrastructure as Code, and how do Terraform and AWS CDK compare?',
        'How do you build a small, secure production Docker image for Node.js (multi-stage builds, non-root user, scanning)?',
        'What are Kubernetes liveness, readiness and startup probes, and how does autoscaling work?',
        'What are SLIs, SLOs and error budgets, and how do they change how a team works?',
        'What does a good CI/CD pipeline for a full-stack app look like, from pull request to production?',
        'How do you manage configuration across dev, staging and production without drift?',
      ],
    },
    {
      id: 'nodejs-aws-cloud',
      icon: 'ti-cloud',
      title: 'AWS & Cloud',
      color: '#D97706',
      bg: '#FEF3C7',
      questions: [
        'How do you choose between EC2, ECS on Fargate, and Lambda for a Node.js service?',
        'How do you host an Angular SPA on S3 and CloudFront, including deep links, caching and invalidation on deploy?',
        'What are IAM roles and policies, and how do you apply least privilege to a service?',
        'RDS/Aurora vs DynamoDB: how do you choose, and how do you model data for DynamoDB?',
        'SQS vs SNS vs EventBridge: when do you use each?',
        'How do you let users upload large files directly to S3 with presigned URLs?',
        'How do you manage secrets and configuration on AWS (Secrets Manager vs Parameter Store)?',
        'What is a VPC, and how do public and private subnets, security groups and NAT gateways fit together?',
        'How do you design for high availability and disaster recovery on AWS (multi-AZ, multi-region, RPO and RTO)?',
        'How do you monitor a production service with CloudWatch, and what would you alarm on?',
        'What are Lambda cold starts, and how do you reduce them?',
        'How do you keep an AWS bill under control?',
      ],
    },

    // ── Architecture & design ──
    {
      id: 'nodejs-design-patterns',
      icon: 'ti-puzzle',
      title: 'Design Patterns',
      color: '#D97706',
      bg: '#FEF3C7',
      questions: [
        'What are design patterns and which ones are commonly used in Node.js?',
        'What is the Observer pattern and how is it implemented in Node.js?',
        'What is Dependency Injection and how is it used in Node.js?',
        'What is the Repository Pattern?',
        'What is CQRS (Command Query Responsibility Segregation)?',
        'What is Event Sourcing?',
      ],
    },
    {
      id: 'nodejs-microservices',
      icon: 'ti-topology-star',
      title: 'Microservices & Architecture',
      color: '#7C3AED',
      bg: '#EDE9FE',
      questions: [
        'What are microservices and how do they differ from a monolithic architecture?',
        'What are the main advantages and disadvantages of microservices?',
        'How do microservices communicate with each other?',
        'What is the difference between synchronous and asynchronous communication in microservices?',
        'What is an API Gateway and what problems does it solve?',
        'What is the Circuit Breaker pattern?',
        'What is the Saga pattern in microservices?',
        'How do you handle distributed transactions in a microservices architecture?',
        'What is the Strangler Fig pattern for migrating from monolith to microservices?',
      ],
    },
    {
      id: 'nodejs-distributed-systems',
      icon: 'ti-affiliate',
      title: 'Distributed Systems',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        'What is the CAP theorem, and what does PACELC add?',
        'Strong vs eventual consistency: how do you design a feature that has to live with eventual consistency?',
        'What is the transactional outbox pattern, and what problem does it solve?',
        'Why is exactly-once delivery a myth, and how do you build idempotent consumers?',
        'How do you preserve message ordering in a queue or stream (Kafka partitions, SQS FIFO)?',
        'What is a dead-letter queue, and how do you handle poison messages?',
        'How do retries, timeouts and backoff interact, and how do you avoid retry storms?',
        'What is the difference between Kafka and a traditional message queue such as RabbitMQ or SQS?',
        'How do you do leader election or distributed locking safely, and what can go wrong?',
        'How do you trace a single request across several services?',
      ],
    },
    {
      id: 'nodejs-system-design',
      icon: 'ti-sitemap',
      title: 'System Design',
      color: '#9333EA',
      bg: '#F3E8FF',
      questions: [
        'How do you design a rate limiter in Node.js?',
        'How do you design a URL shortener service?',
        'How would you design a notification system that sends emails, SMS, and push notifications?',
      ],
    },
    {
      id: 'nodejs-backend-operations',
      icon: 'ti-bug',
      title: 'Debugging & Real-World Scenarios',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        'An API that previously responded quickly is now taking around 30 seconds to complete. How would you debug the issue and identify the root cause?',
        'Walk me through your process of taking a new feature from requirement gathering to production deployment.',
        'A Node.js service is stuck at 100% CPU and requests are timing out. How do you find what is blocking the event loop?',
        'Your API intermittently returns 502 or 504 errors behind Nginx or a load balancer. How do you troubleshoot it?',
        'Requests start hanging because the database connection pool is exhausted. How do you diagnose and fix it?',
        'Customers are charged twice when they retry a payment request. How do you make the API idempotent?',
        'Two requests update the same record at the same time and one update is lost. How do you prevent this race condition?',
        'A deployment went out and the error rate spiked. Walk through your incident response and rollback.',
        'How do you add logging, metrics, and tracing to a Node.js service so production issues are easy to debug?',
      ],
    },
    {
      id: 'nodejs-coding-round',
      icon: 'ti-terminal-2',
      title: 'Coding Round',
      color: '#6B21A8',
      bg: '#F3E8FF',
      questions: [
        'Implement `Promise.all` from scratch.',
        'Implement a retry function with exponential backoff and jitter.',
        'Run a list of async tasks with at most N running at the same time (a promise pool).',
        'Implement an LRU cache with O(1) `get` and `put`.',
        'Implement a simple EventEmitter with `on`, `off`, `once`, and `emit`.',
        'Implement `promisify` for callback-style (error-first) functions.',
        'Implement a token-bucket rate limiter as Express middleware.',
        'Count word frequencies in a very large file using streams.',
      ],
    },
  ];

  getCategories(): CategoryModel[] {
    return this.categories;
  }

  getTotalQuestions(): number {
    return this.categories.reduce((acc, cat) => acc + cat.questions.length, 0);
  }
}
