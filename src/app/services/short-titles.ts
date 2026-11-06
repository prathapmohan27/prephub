// Short titles for the question list, keyed by the exact question text (like progress).
// The list column is narrow, and many questions share an opening such as "What is the
// difference between…", so these lead with the part that tells questions apart. The full
// question is still shown in the reader. A question without an entry shows its full text;
// `node scripts/check-answers.mjs` flags entries whose question no longer exists.
export const SHORT_TITLES: Record<string, string> = {
  'What are ES6 features?': 'ES6 features',
  'Difference between var, let, and const': '`var` vs `let` vs `const`',
  'What is the Temporal Dead Zone (TDZ) in JavaScript and how does it affect hoisting with let and const?':
    'Temporal Dead Zone and hoisting',
  'Difference between == and ===': '`==` vs `===`',
  'Explain closures with practical examples': 'Closures with practical examples',
  'What is currying in JavaScript?': 'Currying',
  'What are ES6 Arrow Functions (`() => {}`) in JavaScript/TypeScript and how do they differ from regular functions?':
    'Arrow functions vs regular functions',
  'Difference between prototype and __proto__': '`prototype` vs `__proto__`',
  'How to implement inheritance in JavaScript?': 'Implementing inheritance',
  'Deep copy vs shallow copy': 'Deep copy vs shallow copy',
  'Explain how the JavaScript Event Loop works': 'How the event loop works',
  'What is a Promise in JavaScript?': 'What a Promise is',
  'Debounce vs Throttle': 'Debounce vs throttle',
  'What is the difference between null and undefined in JavaScript?': '`null` vs `undefined`',
  'What is the difference between call(), apply(), and bind()?': '`call` vs `apply` vs `bind`',
  'Explain the JavaScript prototype chain': 'The prototype chain',
  'What is the difference between Array.map(), Array.filter(), and Array.reduce()?':
    '`map` vs `filter` vs `reduce`',
  'What is Promise.all() vs Promise.allSettled() vs Promise.race() vs Promise.any()?':
    '`Promise.all` vs `allSettled` vs `race` vs `any`',
  'What are generator functions and async generators in JavaScript?':
    'Generators and async generators',
  'What is a Proxy object and how is it used?': 'Proxy objects and their uses',
  'What are WeakMap and WeakSet, and why do they allow garbage collection?':
    'WeakMap, WeakSet and garbage collection',
  'Difference between Type and Interface': '`type` vs `interface`',
  'What are Generics in TypeScript?': 'Generics',
  'What is the difference between `any`, `unknown`, and `never`?': '`any` vs `unknown` vs `never`',
  'What are utility types (`Partial`, `Pick`, `Omit`, `Record`, `Readonly`) and where do you use them in Angular?':
    'Utility types and where to use them',
  'What are type guards and type narrowing? Explain `typeof`, `instanceof`, `in`, and custom `is` predicates.':
    'Type guards and narrowing',
  'What are discriminated unions, and how do they help model UI state like loading, success, and error?':
    'Discriminated unions for UI state',
  'Should you use enums or string literal union types? Explain the trade-offs.':
    'Enums vs string literal unions',
  'What do `keyof` and `typeof` do when used in a type position?':
    '`keyof` and `typeof` in type position',
  'What are mapped types and conditional types? Give a practical example.':
    'Mapped and conditional types',
  'What does the `satisfies` operator do, and how is it different from a type annotation or `as`?':
    '`satisfies` vs annotation vs `as`',
  'What does `strict` mode enable in `tsconfig.json`, and what does Angular add with `strictTemplates`?':
    '`strict` mode and `strictTemplates`',
  'When should you use optional chaining (`?.`), nullish coalescing (`??`), and the non-null assertion (`!`)?':
    '`?.`, `??` and the `!` assertion',
  'How do you type HTTP responses with `HttpClient.get<T>()`, and why is that not runtime validation?':
    'Typing `HttpClient.get<T>()` responses',
  'How do you type async functions and Promises in TypeScript?':
    'Typing async functions and Promises',
  'What are TypeScript decorators and how are they used?': 'Decorators',
  'What is your understanding of the DOM? Explain with a real-time example.':
    'The DOM, with a real example',
  'What is Event Delegation?': 'Event delegation',
  'Explain event bubbling and event capturing in JavaScript': 'Event bubbling vs capturing',
  'What does accessibility mean for a web app, and what do WCAG levels A, AA and AAA require?':
    'Web accessibility and WCAG levels',
  'Why should you start with semantic HTML, and when do you actually need ARIA?':
    'Semantic HTML first, ARIA when needed',
  'How do you make a custom component such as a dropdown or tabs fully keyboard accessible?':
    'Keyboard-accessible custom components',
  'How do you manage focus in a single-page app: on route changes, in modals, and with focus traps?':
    'Focus management in an SPA',
  'How do you make dynamic content and form errors announced to screen-reader users?':
    'Announcing dynamic content and errors',
  'What are the colour contrast, motion and zoom requirements, and how do you check them?':
    'Contrast, motion and zoom requirements',
  'What does the Angular CDK a11y package provide (`FocusTrap`, `LiveAnnouncer`, `FocusMonitor`, `ListKeyManager`)?':
    'Angular CDK a11y tools',
  'How do you test accessibility: automated tools, keyboard-only checks and screen readers?':
    'Testing accessibility',
  'What are Core Web Vitals (LCP, INP, CLS), what are the thresholds, and why do they matter?':
    'Core Web Vitals and thresholds',
  'How do you improve Largest Contentful Paint (LCP)?': 'Improving LCP',
  'What is Interaction to Next Paint (INP), and how do you fix a slow interaction?':
    'INP and fixing slow interactions',
  'What causes Cumulative Layout Shift (CLS), and how do you prevent it?':
    'Causes of CLS and how to prevent it',
  'Lab data vs field data: how do you measure performance with Lighthouse, DevTools, CrUX and real-user monitoring?':
    'Lab data vs field data',
  'How does the critical rendering path work, and what blocks rendering?':
    'The critical rendering path',
  'How do you load images and fonts efficiently (modern formats, responsive images, lazy loading, `font-display`)?':
    'Loading images and fonts efficiently',
  'How do HTTP caching headers and a CDN work together for a web app (`Cache-Control`, `ETag`, immutable assets)?':
    'HTTP caching headers with a CDN',
  'What are resource hints (`preload`, `preconnect`, `prefetch`, `fetchpriority`), and when do they backfire?':
    'Resource hints and when they backfire',
  'How do you set and enforce a performance budget in CI?': 'Enforcing a performance budget in CI',
  'How do you analyse time and space complexity, and what Big-O should you aim for in an interview?':
    'Time and space complexity',
  'Two Sum: solve it in O(n) with a hash map. When is a hash map the right tool?':
    'Two Sum with a hash map',
  'Two pointers: check whether a sorted array has a pair with a given sum, and remove duplicates in place.':
    'Two pointers: pair sum, dedupe in place',
  'Sliding window: find the longest substring without repeating characters.':
    'Sliding window: longest unique substring',
  'Binary search: find the first position where a condition becomes true (e.g. first bad version).':
    'Binary search: first true position',
  'Use a stack to check whether a string of brackets is balanced.':
    'Balanced brackets with a stack',
  'Merge overlapping intervals.': 'Merge overlapping intervals',
  'Top K frequent elements: heap vs bucket sort.': 'Top K frequent: heap vs bucket sort',
  'BFS vs DFS: count the number of islands in a grid.': 'BFS vs DFS: number of islands',
  'Detect a cycle in a dependency graph with topological sort (course schedule).':
    'Cycle detection with topological sort',
  'How do you recognise a dynamic programming problem? Solve climbing stairs and coin change.':
    'Spotting DP: climbing stairs, coin change',
  'How do you approach a coding problem you have not seen before in a live interview?':
    'Tackling an unseen coding problem',
  'What happens when we run `ng serve`?': 'What happens on `ng serve`',
  'How does the browser load an Angular application?': 'How the browser loads an Angular app',
  'What changed in recent Angular releases (v19\u2013v21)?':
    'Recent Angular releases (v19\u2013v21)',
  'What are Standalone Components and their advantages?': 'Standalone components',
  'Explain the execution order and purpose of all Angular component lifecycle hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngOnDestroy`, etc.).':
    'Lifecycle hooks: order and purpose',
  'Content projection and ViewChild': 'Content projection and ViewChild',
  'Difference between ng-content and ng-template': '`ng-content` vs `ng-template`',
  'If I want to change CSS dynamically, how?': 'Changing CSS dynamically',
  'What is ViewEncapsulation?': 'ViewEncapsulation',
  'How can you apply global styles or pass specific parent component styles down to child components in Angular (`:host-context()`, CSS variables)?':
    'Passing styles down to child components',
  'How can you dynamically apply different styles or themes to the same CSS class across multiple component instances in Angular?':
    'Theming the same class per instance',
  'What are pipes in Angular? Name the built-in pipes you use most.': 'Built-in pipes you use most',
  'What is the difference between pure and impure pipes?': 'Pure vs impure pipes',
  'How do you create a custom pipe? Write one with parameters.':
    'Writing a custom pipe with parameters',
  'How does the `async` pipe work, and why is it preferred over subscribing manually?':
    'How the `async` pipe works',
  'Why is calling a method in a template bad for performance, and how do pure pipes or `computed()` fix it?':
    'Template method calls vs pipes and `computed`',
  "Why doesn't Angular ship `filter` or `orderBy` pipes, and how should you filter or sort lists instead?":
    'Why no `filter` or `orderBy` pipes',
  'How do you use a pipe inside a component or service class instead of a template?':
    'Using a pipe in a class',
  'What are directives in Angular?': 'What directives are',
  'What does @HostListener do?': '`@HostListener`',
  'Create a custom directive to change background color on hover/unhover':
    'Custom hover background directive',
  'Why do we use services in Angular apart from API calls?': 'Uses of services beyond API calls',
  'What is Dependency Injection in Angular apart from injecting services?':
    'DI beyond injecting services',
  'How does Dependency Injection work internally?': 'How DI works internally',
  'What is Multi Provider Token?': 'Multi provider tokens',
  'How does Change Detection work in Angular?': 'How change detection works',
  'Difference between Default and OnPush Change Detection Strategy': 'Default vs OnPush',
  'Where and how do you implement custom change detection (`ChangeDetectionStrategy.OnPush` and `markForCheck()`) in code?':
    'Implementing OnPush with `markForCheck`',
  'Difference between markForCheck() and detectChanges()': '`markForCheck()` vs `detectChanges()`',
  'Can you configure or trigger change detection strategies at the routing or module level in Angular?':
    'Change detection at route or module level',
  'How does Angular detect changes in a zone-less environment?': 'Change detection without zone.js',
  'What are Signals in Angular?': 'What signals are',
  'Explain different types of Signals and the use case of computed().':
    'Signal types and `computed()`',
  'Difference between Computed Signal and Effect': '`computed` vs `effect`',
  'Difference between Signals and RxJS': 'Signals vs RxJS',
  'Signals vs NgRx': 'Signals vs NgRx',
  'What is the built-in control flow (`@if`, `@for`, `@switch`) and how is it better than `*ngIf` / `*ngFor`?':
    'Built-in control flow vs `*ngIf`/`*ngFor`',
  'Why is `track` mandatory in `@for`, and what should you track by?':
    'Why `track` is mandatory in `@for`',
  'What are deferrable views (`@defer`)? Explain its triggers and the `@placeholder`, `@loading`, and `@error` blocks.':
    'Deferrable views and their triggers',
  'What are signal inputs (`input()`, `input.required()`) and how do they differ from `@Input()`?':
    'Signal inputs vs `@Input()`',
  'What is `model()` and how does two-way binding work with signals?':
    '`model()` and two-way binding',
  'What is the `output()` function and how does it differ from `@Output()` with `EventEmitter`?':
    '`output()` vs `@Output()`',
  'What are signal queries (`viewChild()`, `contentChildren()`) and why use them instead of `@ViewChild`?':
    'Signal queries vs `@ViewChild`',
  'What is `linkedSignal()` and when would you use it instead of `computed()`?':
    '`linkedSignal()` vs `computed()`',
  'What are `resource()` and `httpResource()`, and how do they load async data with signals?':
    '`resource()` and `httpResource()`',
  'What is the `inject()` function and why is it preferred over constructor injection?':
    '`inject()` vs constructor injection',
  'How do `DestroyRef` and `takeUntilDestroyed()` simplify cleanup and unsubscribing?':
    '`DestroyRef` and `takeUntilDestroyed()`',
  'How do you migrate an existing Angular app to zoneless change detection?':
    'Migrating to zoneless',
  'What is hydration in Angular? Explain event replay and incremental hydration.':
    'Hydration and event replay',
  'What are Signal Forms and how do they differ from Reactive Forms?':
    'Signal Forms vs Reactive Forms',
  'How do you migrate an older Angular codebase to modern APIs (standalone, control flow, signal inputs, `inject()`)?':
    'Migrating to modern Angular APIs',
  'What is an Observable in RxJS?': 'What an Observable is',
  'Why do we use Observables in Angular?': 'Why Angular uses Observables',
  'What are the key differences between a Promise and an Observable (`eager vs lazy, single vs multiple values, cancellation`)?':
    'Promise vs Observable',
  'Explain the difference between cold and hot observables with examples':
    'Cold vs hot observables',
  'What is the core difference between a Subject and an Observable in RxJS?':
    'Subject vs Observable',
  'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?':
    'Subject vs Behavior, Replay, AsyncSubject',
  'Which RxJS operators have you used?': 'RxJS operators you have used',
  'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each':
    '`switchMap` vs `mergeMap` vs `concatMap`\u2026',
  'Explain the difference between combineLatest, forkJoin, zip, and withLatestFrom':
    '`combineLatest` vs `forkJoin` vs `zip`\u2026',
  'What does shareReplay(1) do and when is it essential?': '`shareReplay(1)` and when it matters',
  'What is the difference between debounceTime and throttleTime?':
    '`debounceTime` vs `throttleTime`',
  'How does scan differ from reduce? Where would you use scan in an Angular app?':
    '`scan` vs `reduce`',
  'What is takeUntil and how is it used for subscription management? What are modern alternatives?':
    '`takeUntil` and modern alternatives',
  'What are schedulers in RxJS and when would you use asyncScheduler vs queueScheduler?':
    '`asyncScheduler` vs `queueScheduler`',
  'How do you handle errors in RxJS streams? Explain catchError, retry, and retryWhen':
    'Error handling: `catchError` and `retry`',
  'Explain the complete RxJS flow: API response, subscribe, and error handling':
    'The full RxJS flow: API to error handling',
  "You're building a type-ahead search \u2014 implement it using RxJS operators, handling debounce, cancellation of in-flight requests, and deduplication":
    'Build a type-ahead search with RxJS',
  'A user clicks a button 10 times and 10 API calls are triggered. How would you handle this using RxJS?':
    '10 clicks fire 10 API calls',
  'You have a payment form where the user clicks Submit. How do you prevent duplicate submissions using RxJS? Which operator do you choose and why?':
    'Prevent duplicate payment submits',
  "You need to poll an API every 10 seconds but stop polling when the component is destroyed. Show how you'd implement this":
    'Poll an API until destroy',
  'An observable chain emits an error and the entire stream terminates. How do you architect a resilient stream that recovers gracefully?':
    'Resilient stream that survives errors',
  'What are the most common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and when should each be used?':
    'HTTP methods and when to use each',
  'In what different ways can client data be transmitted to an HTTP API endpoint (`Path Params`, `Query Params`, `Headers`, `Request Body/Payload`)?':
    'Ways to send data to an API',
  'Can you include a request body/payload inside an HTTP GET API request (`HttpClient.get()`)?':
    'Body in a GET request',
  'How do you make an HTTP API call in Angular using `HttpClient`?':
    'Making an API call with `HttpClient`',
  'How do you design API calling from the UI? When do you use the async pipe, and when should you unsubscribe manually?':
    '`async` pipe vs manual unsubscribe',
  'What is an HTTP Interceptor (`HttpInterceptorFn`) in Angular and how does it intercept outgoing requests and incoming responses?':
    'How an HTTP interceptor works',
  'How to write an HTTP interceptor to handle common error responses?':
    'Interceptor for common error responses',
  'Global error handling vs component-level error handling':
    'Global vs component-level error handling',
  'How do you prevent duplicate API requests in Angular?': 'Preventing duplicate API requests',
  'An API response is required by multiple components. How would you avoid repeated API calls?':
    'Sharing one API response across components',
  'What happens if you have `**` (`wildcard route`) as the very first route in the routing configuration file?':
    'Wildcard `**` as the first route',
  'Is it possible to use multiple Router Outlets in Angular? If yes, how?':
    'Multiple router outlets',
  'How would you track every route change to monitor user navigation?':
    'Tracking every route change',
  'How do you implement route-level lazy loading of standalone components or feature modules in Angular (`loadChildren` / `loadComponent`)?':
    'Lazy loading with `loadComponent`',
  'Explain Lazy Loading and Preloading Strategies': 'Lazy loading and preloading strategies',
  'What are the different Route Guards (`canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`, `resolve`) in Angular?':
    'The route guard types',
  'Difference between canMatch and canLoad': '`canMatch` vs `canLoad`',
  'How do you restrict unauthorized users from accessing specific route URLs or components using Angular Route Guards?':
    'Restricting routes with guards',
  'What are Resolvers?': 'Resolvers',
  'What can Reactive Forms do in a real-time application?': 'Reactive Forms in real apps',
  'Difference between setValue and patchValue': '`setValue` vs `patchValue`',
  'How to implement Dynamic Forms in Angular using FormArray?': 'Dynamic forms with `FormArray`',
  'How to implement a dynamic form where input fields are shown/hidden based on selection?':
    'Show or hide fields based on a selection',
  'How would you build a dynamic form using JSON configuration instead of hardcoding controls?':
    'Forms from JSON configuration',
  'Your form has more than 50 fields. Will you keep the complete reactive form and template inside one component?':
    'Splitting a 50-field form',
  'Your application has a stepper and each step is implemented in a different Angular component. How would you share the complete form across all steps?':
    'Sharing one form across stepper steps',
  'Suppose a Reactive Form contains a dropdown that gets enabled/disabled from multiple events. A defect is reported where the dropdown behaves incorrectly. How would you debug which event is changing its state?':
    'Debug a dropdown toggled by many events',
  'Different ways to share data between components': 'Ways to share data between components',
  'Is passing state and parameters through Angular routing preferred over using a shared service? When should each be used?':
    'Router state vs a shared service',
  'You have a value that has to be shared across all components. How do you implement this cleanly in Angular?':
    'A value shared across all components',
  'Write the TypeScript syntax and code to implement a shared state service (`using BehaviorSubject or Signals`) across all components.':
    'Shared state service with BehaviorSubject',
  'If admin updates data and changes need to reflect in multiple components simultaneously, how?':
    'Admin update reflected everywhere at once',
  'What is NgRx and how did you implement it in Angular applications?': 'NgRx and how you used it',
  'What are the steps to set up NgRx in an Angular application?': 'Setting up NgRx',
  'Explain the NgRx data flow: Action \u2192 Reducer \u2192 Store \u2192 Selector \u2192 Component \u2192 Effect \u2192 Action':
    'The NgRx data flow',
  'What is the difference between createAction, createReducer, and createEffect?':
    '`createAction` vs `createReducer`\u2026',
  'What is the difference between dispatch and select in NgRx? How do you avoid unnecessary re-renders via selectors?':
    '`dispatch` vs `select`',
  'What are Selectors in NgRx? Explain memoization and why it matters for performance':
    'Selectors and memoization',
  'What is createFeatureSelector and when do you use it?': '`createFeatureSelector`',
  'How do Effects work in NgRx? Explain ofType, switchMap, and error handling inside effects':
    'How effects work',
  'Explain concatLatestFrom (formerly withLatestFrom in effects) and its use case':
    '`concatLatestFrom` and its use case',
  'What is NgRx Entity and what problem does it solve?': 'NgRx Entity',
  'What is the NgRx Signal Store (introduced in NgRx 17)? How does it differ from the traditional store?':
    'NgRx Signal Store vs classic store',
  'Design the NgRx state shape for a banking dashboard that shows account list, selected account details, and transaction history with pagination':
    'State shape for a banking dashboard',
  'An Effect makes an HTTP call, but you want to cancel the previous request if a new action arrives. Which operator do you use inside the effect and why?':
    'Cancel a stale request in an effect',
  'Your selector is being called too frequently causing performance issues. How do you diagnose and fix this?':
    'Selector runs too often: diagnose it',
  'How would you implement optimistic updates using NgRx?': 'Optimistic updates with NgRx',
  'How would you implement undo/redo functionality using NgRx?': 'Undo/redo with NgRx',
  'How to implement SOLID principles in an Angular application?': 'SOLID in an Angular app',
  'Are you familiar with the facade pattern in Angular? Explain where you have used it.':
    'The facade pattern',
  'Have you worked on Micro Frontend architecture?': 'Micro frontend architecture',
  'If multiple applications need to share data, how would you design the communication?':
    'Sharing data between applications',
  'Do you create HLD or LLD documents while implementing new features?':
    'Writing HLD and LLD documents',
  'Describe the architecture, tech stack, state management, and key modules of an enterprise Angular application you have worked on.':
    'An enterprise app you worked on',
  'How do you approach a frontend system design interview?': 'Approaching frontend system design',
  'How would you design an autocomplete (type-ahead) search component?':
    'Design an autocomplete component',
  'How would you design an infinite-scrolling news feed?': 'Design an infinite-scrolling feed',
  'How would you design a reusable component library or design system shared by several Angular apps?':
    'Design a shared component library',
  'How would you design a real-time dashboard that shows live data?':
    'Design a real-time dashboard',
  'How would you design an offline-first Angular application?': 'Design an offline-first app',
  'How would you design a large multi-step form, such as a loan or insurance application?':
    'Design a large multi-step form',
  'How would you structure a large Angular codebase so that several teams can work on it independently?':
    'Structuring a codebase for many teams',
  'How do you optimize an Angular application? Consider lazy loading, OnPush change detection, trackBy, and caching.':
    'Optimizing an Angular app',
  'Handle bulk records using virtual scrolling and pagination, and limit API result per page':
    'Virtual scrolling and pagination',
  'What is Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?': 'SSR vs CSR',
  'How do you analyse and reduce an Angular bundle (build stats, lazy routes, `@defer`, tree-shaking pitfalls)?':
    'Analysing and reducing the bundle',
  'How do `@defer` and incremental hydration improve Core Web Vitals in an Angular app?':
    '`@defer` and incremental hydration for CWV',
  'How does `NgOptimizedImage` improve LCP and CLS?': 'How `NgOptimizedImage` helps LCP and CLS',
  'How do you find and fix slow change detection with Angular DevTools and the Chrome Performance panel?':
    'Finding slow change detection',
  'When should you move work to a web worker in an Angular app, and how?':
    'Moving work to a web worker',
  'How are you securing your Angular application?': 'Securing an Angular app',
  'How to implement role-based access control in Angular?': 'Role-based access control',
  'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?':
    'Where to store auth tokens',
  'What is XSS (Cross-Site Scripting) and how does Angular protect against it by default?':
    "XSS and Angular's built-in protection",
  'What does `DomSanitizer` do, and when should you use `bypassSecurityTrustHtml`?':
    '`DomSanitizer` and `bypassSecurityTrust\u2026`',
  'What is CSRF/XSRF and how does Angular `HttpClient` help prevent it?':
    'CSRF/XSRF and `HttpClient`',
  'What is a Content Security Policy (CSP) and how do you use it with Angular?':
    'Content Security Policy with Angular',
  'What are Trusted Types and how does Angular support them?': 'Trusted Types',
  'How do the `HttpOnly`, `Secure`, and `SameSite` cookie attributes protect a session?':
    '`HttpOnly`, `Secure` and `SameSite` cookies',
  'Why are route guards and hidden buttons not real security?':
    "Why guards and hidden buttons aren't security",
  "What is CORS, and why can't you fix a CORS error from the Angular app?":
    "Why the Angular app can't fix CORS",
  'Have you used Angular testing frameworks?': 'Angular testing frameworks you have used',
  'How will you mock a service?': 'Mocking a service',
  'Your UI development is complete but backend APIs are still under development and API contracts are available. How will you test the application?':
    'Testing before the backend is ready',
  'How do you set up a component test with `TestBed` and `ComponentFixture`?':
    '`TestBed` and `ComponentFixture` setup',
  'How do you test a component that uses signal inputs (`input()`) and outputs (`output()`)?':
    'Testing signal inputs and outputs',
  'How do you test HTTP calls with `HttpTestingController`?':
    'Testing HTTP with `HttpTestingController`',
  'How do you test asynchronous code such as timers and debounced search in Angular tests?':
    'Testing timers and debounced search',
  'How do you test OnPush and zoneless components, and what does `fixture.whenStable()` do?':
    'Testing OnPush and zoneless components',
  'How do you test a functional route guard or HTTP interceptor?':
    'Testing a functional guard or interceptor',
  'What are component harnesses (`ComponentHarness`) and why use them?': 'Component harnesses',
  'What is the default test runner in modern Angular, and how does Vitest compare with Karma/Jasmine and Jest?':
    'Vitest vs Karma/Jasmine vs Jest',
  'What should you cover with unit tests versus end-to-end tests (Playwright or Cypress)?':
    'Unit vs end-to-end test coverage',
  'What makes a test flaky, and how do you avoid flaky Angular tests?': 'Avoiding flaky tests',
  'Memory keeps growing the longer a user keeps the Angular app open. How do you find and fix the leak?':
    'Memory grows the longer the app is open',
  'You get `ExpressionChangedAfterItHasBeenCheckedError`. What causes it, and how do you fix it properly?':
    '`ExpressionChangedAfterItHasBeenChecked`',
  'A table with 10,000 rows freezes the page. How do you diagnose and fix it?':
    '10,000-row table freezes the page',
  'A bug happens only in production, never locally. How do you investigate it?':
    'Bug only in production',
  'After a deployment, some users see a blank page or a `ChunkLoadError`. Why, and how do you prevent it?':
    'Blank page or `ChunkLoadError` after deploy',
  'An API call works in Postman but fails from the browser with a CORS error in production. How do you debug it?':
    'Works in Postman, CORS error in browser',
  'The app is slow on first load. How do you measure and improve LCP and bundle size?':
    'Slow first load: LCP and bundle size',
  "A component's view does not update even though the data changed. What are the likely causes?":
    "View doesn't update after data changes",
  'Users report that a button sometimes does nothing when clicked. How do you reproduce and track it down?':
    'Button sometimes does nothing',
  'How do you approach a low-level design interview, and what are interviewers looking for?':
    'Approaching a low-level design interview',
  'Explain SOLID with Node.js/TypeScript examples. Which principle do you see violated most often in real code?':
    'SOLID with TypeScript examples',
  'Composition vs inheritance: when is inheritance the right tool, and how do you refactor a deep class hierarchy?':
    'Composition vs inheritance',
  'What are coupling and cohesion, and how do you spot and reduce bad coupling in a codebase?':
    'Coupling and cohesion',
  'How do you design code for testability (dependency inversion, ports and adapters, a pure core)?':
    'Designing code for testability',
  'A service has a growing `switch` over payment providers. Refactor it with the Strategy pattern and explain the trade-offs.':
    'Refactor a provider `switch` to Strategy',
  'When do you use a Factory or Abstract Factory, and when is it over-engineering?':
    'Factory vs Abstract Factory',
  'How do the Adapter and Facade patterns help you integrate a third-party SDK you might replace later?':
    'Adapter and Facade around a third-party SDK',
  'How do you add cross-cutting behaviour (caching, retries, logging) with the Decorator pattern without changing the original class?':
    'Cross-cutting concerns with Decorator',
  'You inherit a 600-line "god service". How do you refactor it safely, and what do you extract first?':
    'Refactoring a 600-line god service',
  'Design a parking lot system (LLD): entities, classes, relationships and how it handles concurrency.':
    'Design a parking lot',
  'Design a rate-limiter library with pluggable algorithms (LLD): interfaces, classes and how you test it.':
    'Design a rate-limiter library',
  'Design a notification service (LLD) that supports email, SMS and push, with retries, templates and user preferences.':
    'Design a notification service',
  'Design an in-memory cache with pluggable eviction policies (LRU, LFU, TTL) (LLD).':
    'Design a cache with pluggable eviction',
  'Design an expense-sharing app like Splitwise (LLD): groups, split types and settling balances.':
    'Design a Splitwise-style expense app',
  'Trace a login end to end in an Angular + Node app: form, API, token or cookie, interceptor, silent refresh and logout everywhere.':
    'Login flow end to end',
  'How do you let users upload a 2 GB file from Angular: presigned URLs, progress, resume, scanning, background processing and notifying the UI?':
    'Upload a 2 GB file from Angular',
  'Design live order-status updates from Node to Angular: WebSocket vs SSE vs polling, reconnection, and scaling across several server instances.':
    'Live order status: WebSocket vs SSE vs polling',
  'Design a paginated, filterable, sortable table end to end: the API contract, MongoDB indexes, Angular state and URL-synced filters.':
    'Paginated, filterable table end to end',
  'How do you share types and validation between Angular and Node (OpenAPI codegen, a shared package in a monorepo, or Zod schemas)?':
    'Share types between Angular and Node',
  'How do you handle errors end to end so the user sees a useful message and support can trace it (Problem Details, interceptor, correlation ID, logging)?':
    'Errors end to end: message to trace',
  'Two users edit the same record. How do you handle optimistic UI updates and server-side conflicts (version field, ETag, 409) end to end?':
    'Concurrent edits and optimistic updates',
  'A user saves a change but still sees old data. How do you find which layer is stale: browser cache, CDN, Redis, or a read replica?':
    'Saved but still stale: find the layer',
  'A page is slow. How do you work out whether the problem is in Angular, the network, the API or the database, and which tools do you use?':
    'Slow page: Angular, network, API or DB',
  'How do you roll out a breaking API change while users still have old Angular bundles cached in their browsers?':
    'Breaking API change vs cached old bundles',
  'Why did you choose Angular when most developers are learning React?': 'Why Angular over React',
  'Which third-party Angular libraries have you used in your projects, and why?':
    'Third-party Angular libraries you use',
  'What is the most challenging technical or performance bug you have solved in an Angular frontend application and how did you resolve it?':
    'Hardest Angular bug you solved',
  'Have you created any proof of concept (POC)? Explain one.': 'A proof of concept you built',
  'What deployment activities have you handled?': 'Deployment activities you handled',
  'Have you worked with teams from different organizations where your module depended on parallel development teams? How did you manage communication and dependencies?':
    'Working across teams and dependencies',
  'Have you used any AI tools?': 'AI tools you use',
  'Tell me about yourself.': 'Tell me about yourself',
  'How do you structure answers to behavioral questions using the STAR method?':
    'The STAR method for behavioral answers',
  'Tell me about a time you disagreed with a teammate or reviewer on a technical decision.':
    'Disagreeing on a technical decision',
  'Tell me about a time you missed a deadline or a project went off track.':
    'A missed deadline or derailed project',
  'Tell me about a production bug you caused and how you handled it.':
    'A production bug you caused',
  'How do you give and receive code review feedback?': 'Giving and receiving code review feedback',
  'Tell me about a time you mentored or helped a junior developer.': 'Mentoring a junior developer',
  'How do you estimate a feature, and what do you do when your estimate turns out to be wrong?':
    'Estimating, and when estimates are wrong',
  'Why are you looking for a change, and why do you want to join this company?':
    'Why change jobs, why this company',
  'What questions should you ask the interviewer at the end of an interview?':
    'Questions to ask the interviewer',
  'Check if a string is a palindrome': 'Check for a palindrome',
  'Find the first non-repeating character in a string': 'First non-repeating character',
  'Remove duplicate elements from an array [1,2,2,3,4,4,5] using built-in method and for loop':
    'Remove duplicates from an array',
  'Flatten a nested array': 'Flatten a nested array',
  'Group an array of objects by property': 'Group objects by property',
  'Implement a debounce() function': 'Implement `debounce()`',
  'What is Node.js and how does it differ from browser JavaScript?':
    'Node.js vs browser JavaScript',
  'What is libuv and what role does it play in Node.js?': 'What libuv does',
  'What is the difference between synchronous and asynchronous code in Node.js?':
    'Synchronous vs asynchronous code',
  'What is the Event Loop in Node.js and how does it work?': 'How the event loop works',
  'What are the phases of the Node.js Event Loop?': 'Phases of the event loop',
  'What is the difference between process.nextTick() and setImmediate()?':
    '`process.nextTick()` vs `setImmediate()`',
  'What is the difference between setTimeout() and setImmediate() in the context of the event loop?':
    '`setTimeout()` vs `setImmediate()`',
  'What is the difference between CommonJS (require) and ES Modules (import) in Node.js?':
    'CommonJS vs ES Modules',
  'What is module caching in Node.js?': 'Module caching',
  'What are Worker Threads in Node.js and when should you use them?':
    'Worker threads and when to use them',
  'What is the difference between child_process.fork(), spawn(), and exec()?':
    '`fork()` vs `spawn()` vs `exec()`',
  'How do you set up TypeScript in a Node.js project?': 'Set up TypeScript in Node.js',
  'What is the difference between operational errors and programmer errors?':
    'Operational vs programmer errors',
  'How do you design a custom error hierarchy for a Node.js API, and where should errors be translated into HTTP responses?':
    'Custom error hierarchy and HTTP mapping',
  'What are the common ways async errors get lost in Node.js (floating promises, missing `await`, async callbacks in `forEach`, emitters and streams), and how do you catch them?':
    'How async errors get lost',
  'How do you handle uncaught exceptions in Node.js?': 'Handling uncaught exceptions',
  'What is the difference between try/catch and process.on("uncaughtException")?':
    'try/catch vs `uncaughtException`',
  'What is `AsyncLocalStorage`, and how do you use it to carry request context such as a request ID? What are its pitfalls?':
    '`AsyncLocalStorage` for request context',
  'How should a Node.js service handle failures of a dependency (database, Redis, third-party API) without taking the whole service down?':
    'Surviving a failing dependency',
  'How do you implement graceful shutdown in Node.js?': 'Graceful shutdown',
  'What is a Buffer in Node.js and when would you use it?': 'Buffers and when to use them',
  'What are the four types of streams in Node.js?': 'The four stream types',
  'What is backpressure and how does Node.js handle it?': 'Backpressure',
  'What is stream.pipeline() and why is it preferred over .pipe()?':
    '`stream.pipeline()` vs `.pipe()`',
  'How do you create a custom Transform stream?': 'Write a custom Transform stream',
  'How would you process a large CSV file efficiently in Node.js?':
    'Process a large CSV efficiently',
  'How does garbage collection work in Node.js?': 'How garbage collection works',
  'What are common causes of memory leaks in Node.js applications?':
    'Common causes of memory leaks',
  'How do you detect and diagnose memory leaks in a production Node.js app?':
    'Diagnose a leak in production',
  'How do you test for memory leaks in Node.js?': 'Test for memory leaks',
  'What tools can you use to monitor Node.js memory usage?': 'Tools to monitor memory usage',
  'How does Express middleware work?': 'How Express middleware works',
  'What is the difference between app.use() and app.get() in Express?':
    '`app.use()` vs `app.get()`',
  'How do you validate requests in Express with a schema library such as Zod, and why validate at the edge?':
    'Validate requests with Zod',
  'How do you structure a production Express app (routes, controllers, services, repositories), and where do validation, auth and transactions belong?':
    'Structure a production Express app',
  'What changed in Express 5, and what breaks when you upgrade from Express 4?':
    'Express 5 changes and upgrade breaks',
  'A request in Express never gets a response and nothing appears in the logs. What are the likely causes, and how do you find it?':
    'Request never responds, no logs',
  'How do you stop downstream work when the client disconnects or a request times out (`AbortController`)?':
    'Cancel work on disconnect or timeout',
  'What is the difference between Fastify and Express?': 'Fastify vs Express',
  'What is NestJS and how does it differ from Express?': 'NestJS vs Express',
  'How do NestJS modules and provider scopes work, and why can request-scoped providers hurt performance?':
    'Nest modules and provider scopes',
  'What are Guards, Interceptors, and Pipes in NestJS?': 'Nest guards, interceptors and pipes',
  'How do you implement request validation in NestJS using class-validator?':
    'Nest validation with class-validator',
  'How do you implement JWT authentication in NestJS?': 'JWT authentication in NestJS',
  'How do you implement versioned APIs in NestJS?': 'Versioned APIs in NestJS',
  'How do you deal with circular dependencies in NestJS (`forwardRef`), and what do they tell you about your design?':
    'Nest circular dependencies (`forwardRef`)',
  'How do you test a NestJS service and controller (`Test.createTestingModule`, overriding providers)?':
    'Test Nest services and controllers',
  'How do you handle file uploads in Express/NestJS?': 'File uploads in Express and NestJS',
  'What makes a REST API well designed: resources, naming, status codes and consistency?':
    'What makes a REST API well designed',
  'How do you evolve an API without breaking existing clients (versioning and backward compatibility)?':
    'Evolve an API without breaking clients',
  'How should an API return errors? Explain Problem Details (RFC 9457).':
    'API errors with Problem Details',
  'How do you use OpenAPI in a team: contract-first vs code-first, and generated clients?':
    'OpenAPI: contract-first vs code-first',
  'How do you design and secure webhooks (signatures, retries, idempotency)?':
    'Design and secure webhooks',
  'What is the N+1 problem in GraphQL, and how does DataLoader solve it?':
    'GraphQL N+1 and DataLoader',
  'What is the Backend-for-Frontend (BFF) pattern, and when is it worth it?':
    'Backend-for-Frontend (BFF) pattern',
  'How do you design filtering, sorting and field selection for a list endpoint?':
    'Filtering, sorting and field selection',
  'How do you design long-running operations in an API (202 Accepted, polling, callbacks)?':
    'Long-running operations (202 Accepted)',
  'What are HTTP status codes? Explain 2xx, 3xx, 4xx, 5xx ranges.': 'HTTP status code ranges',
  'What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?': 'HTTP/1.1 vs HTTP/2 vs HTTP/3',
  'What is Keep-Alive in HTTP connections?': 'HTTP Keep-Alive',
  'What is TLS/SSL and how do you enable HTTPS in Node.js?': 'TLS and HTTPS in Node.js',
  'How do you implement request timeouts in Node.js HTTP servers?':
    'Request timeouts in HTTP servers',
  'What is the difference between REST, GraphQL, and gRPC?': 'REST vs GraphQL vs gRPC',
  'What are WebSockets and how do you implement them in Node.js?': 'WebSockets in Node.js',
  'What is Server-Sent Events (SSE) and when should you use it over WebSockets?':
    'SSE vs WebSockets',
  'What are the most common security vulnerabilities in Node.js applications?':
    'Common Node.js vulnerabilities',
  'What is the difference between authentication and authorization?':
    'Authentication vs authorization',
  'What is JWT and how does authentication work with it?': 'How JWT authentication works',
  'What is OAuth 2.0 and how does it work?': 'How OAuth 2.0 works',
  'How do you store passwords securely in Node.js?': 'Store passwords securely',
  'What is SQL injection and how do you prevent it?': 'Prevent SQL injection',
  'How do you prevent NoSQL injection in MongoDB?': 'Prevent NoSQL injection in MongoDB',
  'What is CORS and how do you configure it in Node.js?': 'Configure CORS in Node.js',
  'What is helmet.js and what security headers does it set?': 'helmet.js and security headers',
  'Sessions vs JWTs: what are the real trade-offs for a web app?': 'Sessions vs JWTs',
  'How do access tokens and refresh tokens work together, and what is refresh token rotation?':
    'Access and refresh tokens, rotation',
  'How do you revoke a JWT or log a user out before the token expires?':
    'Revoke a JWT before it expires',
  'What is OpenID Connect, and how does it differ from OAuth 2.0?': 'OpenID Connect vs OAuth 2.0',
  'What is PKCE, and why is it required for single-page and mobile apps?':
    'PKCE for SPAs and mobile apps',
  'Where should an Angular SPA keep its tokens, and how does the BFF pattern help with auth?':
    'Where an Angular SPA keeps tokens',
  'How does single sign-on work with SAML or OIDC in an enterprise app?':
    'Enterprise SSO with SAML or OIDC',
  'RBAC vs ABAC vs ReBAC: how do you model permissions?': 'RBAC vs ABAC vs ReBAC',
  'How do you enforce tenant isolation in a multi-tenant SaaS API?':
    'Tenant isolation in a SaaS API',
  'How do you add MFA and passkeys (WebAuthn) to a login flow?': 'Add MFA and passkeys to login',
  'What is the difference between SQL and NoSQL databases?': 'SQL vs NoSQL',
  'What is database normalization? Explain 1NF, 2NF, 3NF': 'Normalization: 1NF, 2NF, 3NF',
  'What are SQL joins and when do you use each type?': 'SQL joins and when to use each',
  'What are indexes in SQL and how do they work?': 'How SQL indexes work',
  'What is the difference between clustered and non-clustered indexes?':
    'Clustered vs non-clustered indexes',
  'What are database transaction isolation levels?': 'Transaction isolation levels',
  'What is a stored procedure?': 'Stored procedures',
  'What is an ORM? What are the advantages and disadvantages of using one?': 'ORMs: pros and cons',
  'What is the N+1 query problem and how do you fix it?': 'The N+1 query problem',
  'How do you read an `EXPLAIN ANALYZE` plan to find out why a query is slow?':
    'Read an `EXPLAIN ANALYZE` plan',
  'How do you design a composite index, and why does column order matter?':
    'Composite index column order',
  'What causes deadlocks, and how do you prevent and handle them?': 'Prevent and handle deadlocks',
  'How do you change a database schema with zero downtime (expand and contract)?':
    'Zero-downtime schema changes',
  'How do read replicas work, and how do you deal with replication lag?':
    'Read replicas and replication lag',
  'When and how do you partition or shard a relational table?': 'Partition or shard a table',
  'PostgreSQL `JSONB` vs a document database: when is each the better choice?':
    'Postgres `JSONB` vs a document DB',
  'How do you design a multi-tenant database: shared schema, schema per tenant, or database per tenant?':
    'Multi-tenant database models',
  'What is MongoDB and when would you choose it over a relational database?':
    'When to choose MongoDB',
  'What is the difference between embedding and referencing in MongoDB schema design?':
    'Embedding vs referencing',
  'Why are unbounded arrays an anti-pattern in MongoDB, and what happens when a document approaches the 16 MB limit?':
    'Unbounded arrays and the 16 MB limit',
  'What are the MongoDB schema design patterns (bucket, computed, subset, extended reference, outlier), and when do you use each?':
    'Schema design patterns',
  'Design the MongoDB data model for an e-commerce catalog with product variants, inventory and reviews.':
    'Model an e-commerce catalog',
  'What are indexes in MongoDB and when should you create them?': 'Indexes and when to create them',
  'Which MongoDB index types do you use in practice (compound, partial, TTL, sparse, wildcard, text, unique), and for what?':
    'Index types in practice',
  'What is the MongoDB aggregation pipeline?': 'The aggregation pipeline',
  'How do you optimise a slow aggregation pipeline (stage order, `$lookup` cost, `$facet`, `allowDiskUse`)?':
    'Optimise a slow aggregation pipeline',
  'How do you paginate a large MongoDB collection, and why does `skip()` get slow?':
    'Paginate a large collection',
  'A MongoDB query became slow as the data grew. How do you use `explain("executionStats")` to find and fix the problem?':
    'Slow query: read `explain()` output',
  'What is a transaction in MongoDB, and when would you use it?':
    'Transactions and when to use them',
  'Suppose you need to update three MongoDB collections as part of a single business operation. If the third update fails, how would you ensure that the first two updates are rolled back?':
    'Roll back updates across 3 collections',
  'Duplicate documents are being created even though the code checks whether one exists before inserting. Why, and how do you fix it?':
    'Duplicate inserts despite an exists check',
  'What is a replica set in MongoDB?': 'Replica sets',
  'What are write concern, read concern and read preference, and what can go wrong when you read from secondaries?':
    'Write concern, read concern, read preference',
  'What are MongoDB change streams, and how do you use them reliably (resume tokens)?':
    'Change streams and resume tokens',
  'What is sharding in MongoDB?': 'How sharding works',
  'How do you choose a shard key, and why does a monotonically increasing key create a hot shard?':
    'Choose a shard key, avoid hot shards',
  'What is Mongoose and what are its advantages?': 'Mongoose and its advantages',
  'Mongoose `populate()` on a list endpoint is slow. What is happening, and when should you use `$lookup` instead?':
    'Slow `populate()` vs `$lookup`',
  'Your serverless functions keep exhausting MongoDB connections. Why, and how do you fix it?':
    'Serverless exhausting connections',
  'How do you change a MongoDB schema without downtime (schema versioning, lazy migration vs backfill)?':
    'Schema changes without downtime',
  'The working set no longer fits in RAM and MongoDB latency spikes. How do you confirm it and what are your options?':
    'Working set exceeds RAM',
  'What are common caching strategies? (Cache-Aside, Write-Through, Write-Behind)':
    'Caching strategies',
  'What is cache invalidation and what are the strategies?': 'Cache invalidation strategies',
  'What is Redis and what are its use cases in Node.js?': 'Redis and its use cases',
  'How do you implement a Redis cache in a Node.js application?': 'Implement a Redis cache',
  'How do you implement rate limiting using Redis?': 'Rate limiting with Redis',
  'How do you implement distributed locks with Redis?': 'Distributed locks with Redis',
  'What is the difference between Redis Pub/Sub and Redis Streams?': 'Redis Pub/Sub vs Streams',
  'What is BullMQ and how does it use Redis for job queues?': 'BullMQ job queues on Redis',
  'How do you profile and debug Node.js performance issues?':
    'Profile and debug performance issues',
  'What techniques do you use to optimize Node.js application performance?':
    'Performance optimization techniques',
  'How does connection pooling work in Node.js database connections?':
    'Database connection pooling',
  'How do you implement pagination \u2014 offset vs cursor-based?': 'Offset vs cursor pagination',
  'What is HTTP response compression and how do you enable it?': 'HTTP response compression',
  'What is clustering in Node.js and why is it needed?': 'Clustering and why it is needed',
  'How do you implement clustering in Node.js using the cluster module?':
    'Implement the cluster module',
  'How does the primary process distribute requests among workers in cluster mode?':
    'How cluster distributes requests',
  'How do you share state between cluster workers?': 'Share state between workers',
  'What is PM2 and how does it manage Node.js processes?': 'PM2 process management',
  'What is the difference between unit, integration, and end-to-end tests?':
    'Unit vs integration vs end-to-end tests',
  'What testing frameworks are commonly used in Node.js?': 'Node.js testing frameworks',
  'How do you test asynchronous code in Jest?': 'Test async code in Jest',
  'How do you mock modules and dependencies in Jest?': 'Mock modules in Jest',
  'How do you test Express routes using Supertest?': 'Test Express routes with Supertest',
  'What is test coverage and how do you measure it in Node.js?': 'Measure test coverage',
  'What is CI/CD and what tools have you used?': 'CI/CD and the tools you used',
  'What is Docker and how is it used with Node.js?': 'Docker with Node.js',
  'What is a Dockerfile and how do you write one for Node.js?': 'Write a Dockerfile for Node.js',
  'What is Kubernetes and what problem does it solve?': 'What Kubernetes solves',
  'What is a reverse proxy and why is Nginx used with Node.js?': 'Reverse proxies and Nginx',
  'How do you manage environment variables securely in Node.js?':
    'Manage environment variables securely',
  'What are health checks and how do you implement them in Node.js?': 'Health checks',
  'Blue-green vs canary vs rolling deployments: how do you choose?':
    'Blue-green vs canary vs rolling',
  'How do feature flags help you release safely, and what are the risks?':
    'Feature flags: benefits and risks',
  'What is Infrastructure as Code, and how do Terraform and AWS CDK compare?':
    'Infrastructure as Code: Terraform vs CDK',
  'How do you build a small, secure production Docker image for Node.js (multi-stage builds, non-root user, scanning)?':
    'Small, secure production Docker image',
  'What are Kubernetes liveness, readiness and startup probes, and how does autoscaling work?':
    'Kubernetes probes and autoscaling',
  'What are SLIs, SLOs and error budgets, and how do they change how a team works?':
    'SLIs, SLOs and error budgets',
  'What does a good CI/CD pipeline for a full-stack app look like, from pull request to production?':
    'Full-stack CI/CD pipeline, PR to prod',
  'How do you manage configuration across dev, staging and production without drift?':
    'Config across environments without drift',
  'How do you choose between EC2, ECS on Fargate, and Lambda for a Node.js service?':
    'EC2 vs ECS Fargate vs Lambda',
  'How do you host an Angular SPA on S3 and CloudFront, including deep links, caching and invalidation on deploy?':
    'Host an Angular SPA on S3 + CloudFront',
  'What are IAM roles and policies, and how do you apply least privilege to a service?':
    'IAM roles and least privilege',
  'RDS/Aurora vs DynamoDB: how do you choose, and how do you model data for DynamoDB?':
    'RDS/Aurora vs DynamoDB',
  'SQS vs SNS vs EventBridge: when do you use each?': 'SQS vs SNS vs EventBridge',
  'How do you let users upload large files directly to S3 with presigned URLs?':
    'Direct S3 uploads with presigned URLs',
  'How do you manage secrets and configuration on AWS (Secrets Manager vs Parameter Store)?':
    'Secrets Manager vs Parameter Store',
  'What is a VPC, and how do public and private subnets, security groups and NAT gateways fit together?':
    'VPCs, subnets and NAT gateways',
  'How do you design for high availability and disaster recovery on AWS (multi-AZ, multi-region, RPO and RTO)?':
    'High availability and disaster recovery',
  'How do you monitor a production service with CloudWatch, and what would you alarm on?':
    'Monitoring and alarms in CloudWatch',
  'What are Lambda cold starts, and how do you reduce them?': 'Lambda cold starts',
  'How do you keep an AWS bill under control?': 'Keep the AWS bill under control',
  'What are design patterns and which ones are commonly used in Node.js?':
    'Common design patterns in Node.js',
  'What is the Observer pattern and how is it implemented in Node.js?': 'Observer pattern',
  'What is Dependency Injection and how is it used in Node.js?': 'Dependency injection',
  'What is the Repository Pattern?': 'Repository pattern',
  'What is CQRS (Command Query Responsibility Segregation)?': 'CQRS',
  'What is Event Sourcing?': 'Event sourcing',
  'What are microservices and how do they differ from a monolithic architecture?':
    'Microservices vs monolith',
  'What are the main advantages and disadvantages of microservices?':
    'Pros and cons of microservices',
  'How do microservices communicate with each other?': 'How microservices communicate',
  'What is the difference between synchronous and asynchronous communication in microservices?':
    'Sync vs async communication',
  'What is an API Gateway and what problems does it solve?': 'API gateways',
  'What is the Circuit Breaker pattern?': 'Circuit breaker pattern',
  'What is the Saga pattern in microservices?': 'Saga pattern',
  'How do you handle distributed transactions in a microservices architecture?':
    'Distributed transactions',
  'What is the Strangler Fig pattern for migrating from monolith to microservices?':
    'Strangler Fig migration',
  'What is the CAP theorem, and what does PACELC add?': 'CAP theorem and PACELC',
  'Strong vs eventual consistency: how do you design a feature that has to live with eventual consistency?':
    'Designing for eventual consistency',
  'What is the transactional outbox pattern, and what problem does it solve?':
    'Transactional outbox pattern',
  'Why is exactly-once delivery a myth, and how do you build idempotent consumers?':
    'Exactly-once myth, idempotent consumers',
  'How do you preserve message ordering in a queue or stream (Kafka partitions, SQS FIFO)?':
    'Preserve message ordering',
  'What is a dead-letter queue, and how do you handle poison messages?':
    'Dead-letter queues and poison messages',
  'How do retries, timeouts and backoff interact, and how do you avoid retry storms?':
    'Retries, timeouts and retry storms',
  'What is the difference between Kafka and a traditional message queue such as RabbitMQ or SQS?':
    'Kafka vs RabbitMQ or SQS',
  'How do you do leader election or distributed locking safely, and what can go wrong?':
    'Leader election and distributed locks',
  'How do you trace a single request across several services?': 'Trace a request across services',
  'How do you design a rate limiter in Node.js?': 'Design a rate limiter',
  'How do you design a URL shortener service?': 'Design a URL shortener',
  'How would you design a notification system that sends emails, SMS, and push notifications?':
    'Design a notification system',
  'An API that previously responded quickly is now taking around 30 seconds to complete. How would you debug the issue and identify the root cause?':
    'API slowed to 30 s: find the cause',
  'Walk me through your process of taking a new feature from requirement gathering to production deployment.':
    'Feature from requirements to production',
  'A Node.js service is stuck at 100% CPU and requests are timing out. How do you find what is blocking the event loop?':
    '100% CPU: find the event-loop blocker',
  'Your API intermittently returns 502 or 504 errors behind Nginx or a load balancer. How do you troubleshoot it?':
    'Intermittent 502/504 behind a proxy',
  'Requests start hanging because the database connection pool is exhausted. How do you diagnose and fix it?':
    'Connection pool exhausted',
  'Customers are charged twice when they retry a payment request. How do you make the API idempotent?':
    'Double charges on retry: idempotency',
  'Two requests update the same record at the same time and one update is lost. How do you prevent this race condition?':
    'Lost update from concurrent writes',
  'A deployment went out and the error rate spiked. Walk through your incident response and rollback.':
    'Error spike after deploy: respond',
  'How do you add logging, metrics, and tracing to a Node.js service so production issues are easy to debug?':
    'Logging, metrics and tracing',
  'Implement `Promise.all` from scratch.': 'Implement `Promise.all`',
  'Implement a retry function with exponential backoff and jitter.':
    'Implement retry with backoff and jitter',
  'Run a list of async tasks with at most N running at the same time (a promise pool).':
    'Implement a promise pool',
  'Implement an LRU cache with O(1) `get` and `put`.': 'Implement an LRU cache',
  'Implement a simple EventEmitter with `on`, `off`, `once`, and `emit`.':
    'Implement an EventEmitter',
  'Implement `promisify` for callback-style (error-first) functions.': 'Implement `promisify`',
  'Implement a token-bucket rate limiter as Express middleware.':
    'Implement token-bucket middleware',
  'Write Express error-handling middleware that maps domain errors to Problem Details responses and hides internal details in production.':
    'Write Problem Details error middleware',
  'Count word frequencies in a very large file using streams.':
    'Count word frequencies with streams',
};
