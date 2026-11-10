import { Service } from '@angular/core';
import type { CategoryModel, QuestionModel } from './question';

/**
 * Question bank, grouped by topic and ordered roughly from fundamentals to advanced.
 *
 * Kept apart from `question.ts` (types and track helpers) so pages can load it on demand with
 * `injectAsync(() => import('@services/question-bank'))` and keep ~110 KB of questions out of
 * the initial bundle.
 *
 * - The track comes from `trackOf()`: Foundations topics are listed in FOUNDATION_TOPICS,
 *   `nodejs-` topics are Node.js, everything else is Angular.
 * - Each question's answer lives in `answers/<topic id>.ts` under the question's id, and its
 *   short list title in `short-titles.ts`. Run `node scripts/check-answers.mjs` after edits.
 * - To add a question, give it a new kebab-case id that is unique across all topics.
 */
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
        { id: 'es6-features', text: 'What are ES6 features?' },
        { id: 'var-vs-let-vs-const', text: 'Difference between var, let, and const' },
        {
          id: 'temporal-dead-zone-and-hoisting',
          text: 'What is the Temporal Dead Zone (TDZ) in JavaScript and how does it affect hoisting with let and const?',
        },
        { id: 'loose-vs-strict-equality', text: 'Difference between == and ===' },
        {
          id: 'closures-with-practical-examples',
          text: 'Explain closures with practical examples',
        },
        { id: 'currying', text: 'What is currying in JavaScript?' },
        {
          id: 'arrow-functions-vs-regular-functions',
          text: 'What are ES6 Arrow Functions (`() => {}`) in JavaScript/TypeScript and how do they differ from regular functions?',
        },
        { id: 'prototype-vs-proto', text: 'Difference between prototype and __proto__' },
        { id: 'implementing-inheritance', text: 'How to implement inheritance in JavaScript?' },
        { id: 'deep-copy-vs-shallow-copy', text: 'Deep copy vs shallow copy' },
        { id: 'how-the-event-loop-works', text: 'Explain how the JavaScript Event Loop works' },
        { id: 'what-a-promise-is', text: 'What is a Promise in JavaScript?' },
        { id: 'debounce-vs-throttle', text: 'Debounce vs Throttle' },
        {
          id: 'null-vs-undefined',
          text: 'What is the difference between null and undefined in JavaScript?',
        },
        {
          id: 'call-vs-apply-vs-bind',
          text: 'What is the difference between call(), apply(), and bind()?',
        },
        { id: 'prototype-chain', text: 'Explain the JavaScript prototype chain' },
        {
          id: 'map-vs-filter-vs-reduce',
          text: 'What is the difference between Array.map(), Array.filter(), and Array.reduce()?',
        },
        {
          id: 'promise-all-vs-allsettled-vs-race-vs-any',
          text: 'What is Promise.all() vs Promise.allSettled() vs Promise.race() vs Promise.any()?',
        },
        {
          id: 'generators-and-async-generators',
          text: 'What are generator functions and async generators in JavaScript?',
          senior: true,
        },
        {
          id: 'proxy-objects-and-their-uses',
          text: 'What is a Proxy object and how is it used?',
          senior: true,
        },
        {
          id: 'weakmap-weakset-and-garbage-collection',
          text: 'What are WeakMap and WeakSet, and why do they allow garbage collection?',
          senior: true,
        },
      ],
    },
    {
      id: 'typescript',
      icon: 'ti-brand-typescript',
      title: 'TypeScript',
      color: '#185FA5',
      bg: '#E6F1FB',
      questions: [
        { id: 'type-vs-interface', text: 'Difference between Type and Interface' },
        { id: 'generics', text: 'What are Generics in TypeScript?' },
        {
          id: 'any-vs-unknown-vs-never',
          text: 'What is the difference between `any`, `unknown`, and `never`?',
        },
        {
          id: 'utility-types-and-where-to-use-them',
          text: 'What are utility types (`Partial`, `Pick`, `Omit`, `Record`, `Readonly`) and where do you use them in Angular?',
        },
        {
          id: 'type-guards-and-narrowing',
          text: 'What are type guards and type narrowing? Explain `typeof`, `instanceof`, `in`, and custom `is` predicates.',
        },
        {
          id: 'discriminated-unions-for-ui-state',
          text: 'What are discriminated unions, and how do they help model UI state like loading, success, and error?',
          senior: true,
        },
        {
          id: 'enums-vs-string-literal-unions',
          text: 'Should you use enums or string literal union types? Explain the trade-offs.',
        },
        {
          id: 'keyof-and-typeof-in-type-position',
          text: 'What do `keyof` and `typeof` do when used in a type position?',
        },
        {
          id: 'mapped-and-conditional-types',
          text: 'What are mapped types and conditional types? Give a practical example.',
          senior: true,
        },
        {
          id: 'satisfies-vs-annotation-vs-as',
          text: 'What does the `satisfies` operator do, and how is it different from a type annotation or `as`?',
          senior: true,
        },
        {
          id: 'strict-mode-and-stricttemplates',
          text: 'What does `strict` mode enable in `tsconfig.json`, and what does Angular add with `strictTemplates`?',
        },
        {
          id: 'optional-chaining-nullish-non-null',
          text: 'When should you use optional chaining (`?.`), nullish coalescing (`??`), and the non-null assertion (`!`)?',
        },
        {
          id: 'typing-httpclient-get-t-responses',
          text: 'How do you type HTTP responses with `HttpClient.get<T>()`, and why is that not runtime validation?',
          senior: true,
        },
        {
          id: 'typing-async-functions-and-promises',
          text: 'How do you type async functions and Promises in TypeScript?',
        },
        { id: 'decorators', text: 'What are TypeScript decorators and how are they used?' },
      ],
    },
    {
      id: 'js-output',
      icon: 'ti-zoom-question',
      title: 'Predict the Output',
      color: '#B45309',
      bg: '#FEF3C7',
      questions: [
        {
          id: 'microtasks-vs-macrotasks-order',
          text: 'Predict the output: `setTimeout`, `Promise.then`, `queueMicrotask` and `await` in one script.',
          senior: true,
        },
        {
          id: 'var-vs-let-in-a-settimeout-loop',
          text: 'Predict the output: `var` vs `let` in a loop that schedules `setTimeout` callbacks.',
        },
        {
          id: 'this-method-detached-arrow-callback',
          text: 'Predict the output: `this` in a method, a detached method, an arrow function and a callback.',
        },
        {
          id: 'hoisting-and-the-temporal-dead-zone',
          text: 'Predict the output: hoisting of `var`, function declarations and `let` (the temporal dead zone).',
        },
        {
          id: 'async-return-values-and-uncaught-rejections',
          text: 'Predict the output: what an `async` function returns, `await` on a non-promise, and a rejection nobody catches.',
          senior: true,
        },
        {
          id: 'references-const-and-shallow-copies',
          text: 'Predict the output: object references, `const`, spread copies and nested mutation.',
        },
        {
          id: 'counter-factory-and-shared-closures',
          text: 'Predict the output: closures that share state (a counter factory called twice).',
        },
        {
          id: 'predict-type-coercion',
          text: 'Predict the output: type coercion with `==`, `+` and `[] + {}`.',
        },
        {
          id: 'prototypes-shadowing-class-fields-vs-methods',
          text: 'Predict the output: prototype lookup, shadowing, and class fields vs methods.',
          senior: true,
        },
        {
          id: 'promise-all-vs-allsettled-with-a-rejection',
          text: 'Predict the output: `Promise.all` vs `Promise.allSettled` when one promise rejects.',
        },
      ],
    },
    {
      id: 'browser-dom-css',
      icon: 'ti-browser',
      title: 'Browser, DOM & CSS',
      color: '#0369A1',
      bg: '#E0F2FE',
      questions: [
        {
          id: 'dom-with-a-real-example',
          text: 'What is your understanding of the DOM? Explain with a real-time example.',
        },
        { id: 'event-delegation', text: 'What is Event Delegation?' },
        {
          id: 'event-bubbling-vs-capturing',
          text: 'Explain event bubbling and event capturing in JavaScript',
        },
      ],
    },
    {
      id: 'web-accessibility',
      icon: 'ti-accessible',
      title: 'Accessibility',
      color: '#0369A1',
      bg: '#E0F2FE',
      questions: [
        {
          id: 'web-accessibility-and-wcag-levels',
          text: 'What does accessibility mean for a web app, and what do WCAG levels A, AA and AAA require?',
        },
        {
          id: 'semantic-html-first-aria-when-needed',
          text: 'Why should you start with semantic HTML, and when do you actually need ARIA?',
        },
        {
          id: 'keyboard-accessible-custom-components',
          text: 'How do you make a custom component such as a dropdown or tabs fully keyboard accessible?',
          senior: true,
        },
        {
          id: 'focus-management-in-an-spa',
          text: 'How do you manage focus in a single-page app: on route changes, in modals, and with focus traps?',
          senior: true,
        },
        {
          id: 'announcing-dynamic-content-and-errors',
          text: 'How do you make dynamic content and form errors announced to screen-reader users?',
          senior: true,
        },
        {
          id: 'contrast-motion-and-zoom-requirements',
          text: 'What are the colour contrast, motion and zoom requirements, and how do you check them?',
        },
        {
          id: 'angular-cdk-a11y-tools',
          text: 'What does the Angular CDK a11y package provide (`FocusTrap`, `LiveAnnouncer`, `FocusMonitor`, `ListKeyManager`)?',
          senior: true,
        },
        {
          id: 'testing-accessibility',
          text: 'How do you test accessibility: automated tools, keyboard-only checks and screen readers?',
        },
      ],
    },
    {
      id: 'web-performance',
      icon: 'ti-gauge',
      title: 'Web Performance',
      color: '#059669',
      bg: '#D1FAE5',
      questions: [
        {
          id: 'core-web-vitals-and-thresholds',
          text: 'What are Core Web Vitals (LCP, INP, CLS), what are the thresholds, and why do they matter?',
        },
        {
          id: 'improving-lcp',
          text: 'How do you improve Largest Contentful Paint (LCP)?',
          senior: true,
        },
        {
          id: 'inp-and-fixing-slow-interactions',
          text: 'What is Interaction to Next Paint (INP), and how do you fix a slow interaction?',
          senior: true,
        },
        {
          id: 'causes-of-cls-and-how-to-prevent-it',
          text: 'What causes Cumulative Layout Shift (CLS), and how do you prevent it?',
          senior: true,
        },
        {
          id: 'lab-data-vs-field-data',
          text: 'Lab data vs field data: how do you measure performance with Lighthouse, DevTools, CrUX and real-user monitoring?',
          senior: true,
        },
        {
          id: 'critical-rendering-path',
          text: 'How does the critical rendering path work, and what blocks rendering?',
        },
        {
          id: 'loading-images-and-fonts-efficiently',
          text: 'How do you load images and fonts efficiently (modern formats, responsive images, lazy loading, `font-display`)?',
        },
        {
          id: 'http-caching-headers-with-a-cdn',
          text: 'How do HTTP caching headers and a CDN work together for a web app (`Cache-Control`, `ETag`, immutable assets)?',
        },
        {
          id: 'resource-hints-and-when-they-backfire',
          text: 'What are resource hints (`preload`, `preconnect`, `prefetch`, `fetchpriority`), and when do they backfire?',
          senior: true,
        },
        {
          id: 'enforcing-a-performance-budget-in-ci',
          text: 'How do you set and enforce a performance budget in CI?',
          senior: true,
        },
      ],
    },
    {
      id: 'dsa-patterns',
      icon: 'ti-binary-tree',
      title: 'Data Structures & Algorithms',
      color: '#7C3AED',
      bg: '#EDE9FE',
      questions: [
        {
          id: 'time-and-space-complexity',
          text: 'How do you analyse time and space complexity, and what Big-O should you aim for in an interview?',
        },
        {
          id: 'two-sum-with-a-hash-map',
          text: 'Two Sum: solve it in O(n) with a hash map. When is a hash map the right tool?',
        },
        {
          id: 'two-pointers-pair-sum-dedupe-in-place',
          text: 'Two pointers: check whether a sorted array has a pair with a given sum, and remove duplicates in place.',
        },
        {
          id: 'sliding-window-longest-unique-substring',
          text: 'Sliding window: find the longest substring without repeating characters.',
          senior: true,
        },
        {
          id: 'binary-search-first-true-position',
          text: 'Binary search: find the first position where a condition becomes true (e.g. first bad version).',
        },
        {
          id: 'balanced-brackets-with-a-stack',
          text: 'Use a stack to check whether a string of brackets is balanced.',
        },
        { id: 'merge-overlapping-intervals', text: 'Merge overlapping intervals.', senior: true },
        {
          id: 'top-k-frequent-heap-vs-bucket-sort',
          text: 'Top K frequent elements: heap vs bucket sort.',
          senior: true,
        },
        {
          id: 'bfs-vs-dfs-number-of-islands',
          text: 'BFS vs DFS: count the number of islands in a grid.',
          senior: true,
        },
        {
          id: 'cycle-detection-with-topological-sort',
          text: 'Detect a cycle in a dependency graph with topological sort (course schedule).',
          senior: true,
        },
        {
          id: 'spotting-dp-climbing-stairs-coin-change',
          text: 'How do you recognise a dynamic programming problem? Solve climbing stairs and coin change.',
          senior: true,
        },
        {
          id: 'tackling-an-unseen-coding-problem',
          text: 'How do you approach a coding problem you have not seen before in a live interview?',
        },
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
        { id: 'what-happens-on-ng-serve', text: 'What happens when we run `ng serve`?' },
        {
          id: 'how-the-browser-loads-an-angular-app',
          text: 'How does the browser load an Angular application?',
          senior: true,
        },
        {
          id: 'recent-angular-releases-v19-v21',
          text: 'What changed in recent Angular releases (v19–v21)?',
        },
      ],
    },
    {
      id: 'components',
      icon: 'ti-layout-2',
      title: 'Components & Lifecycle',
      color: '#0F6E56',
      bg: '#E1F5EE',
      questions: [
        {
          id: 'standalone-components',
          text: 'What are Standalone Components and their advantages?',
        },
        {
          id: 'lifecycle-hooks-order-and-purpose',
          text: 'Explain the execution order and purpose of all Angular component lifecycle hooks (`ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngOnDestroy`, etc.).',
        },
        { id: 'content-projection-and-viewchild', text: 'Content projection and ViewChild' },
        { id: 'ng-content-vs-ng-template', text: 'Difference between ng-content and ng-template' },
        {
          id: 'creating-components-dynamically',
          text: 'How do you create components dynamically (`ViewContainerRef.createComponent`, `NgComponentOutlet`), and when is it worth it?',
          senior: true,
        },
        {
          id: 'designing-a-reusable-component-api',
          text: 'How do you design the API of a reusable component: inputs, outputs, content projection and template slots?',
          senior: true,
        },
        {
          id: 'smart-vs-presentational-with-signals',
          text: 'Smart vs presentational components with signals: how do you split responsibilities?',
        },
      ],
    },
    {
      id: 'templates-styling',
      icon: 'ti-palette',
      title: 'Templates & Styling',
      color: '#BE185D',
      bg: '#FCE7F3',
      questions: [
        { id: 'changing-css-dynamically', text: 'If I want to change CSS dynamically, how?' },
        { id: 'viewencapsulation', text: 'What is ViewEncapsulation?' },
        {
          id: 'passing-styles-down-to-child-components',
          text: 'How can you apply global styles or pass specific parent component styles down to child components in Angular (`:host-context()`, CSS variables)?',
        },
        {
          id: 'theming-the-same-class-per-instance',
          text: 'How can you dynamically apply different styles or themes to the same CSS class across multiple component instances in Angular?',
          senior: true,
        },
      ],
    },
    {
      id: 'pipes',
      icon: 'ti-filter',
      title: 'Pipes',
      color: '#C026D3',
      bg: '#FAE8FF',
      questions: [
        {
          id: 'built-in-pipes-you-use-most',
          text: 'What are pipes in Angular? Name the built-in pipes you use most.',
        },
        {
          id: 'pure-vs-impure-pipes',
          text: 'What is the difference between pure and impure pipes?',
        },
        {
          id: 'writing-a-custom-pipe-with-parameters',
          text: 'How do you create a custom pipe? Write one with parameters.',
        },
        {
          id: 'how-the-async-pipe-works',
          text: 'How does the `async` pipe work, and why is it preferred over subscribing manually?',
        },
        {
          id: 'template-method-calls-vs-pipes-and-computed',
          text: 'Why is calling a method in a template bad for performance, and how do pure pipes or `computed()` fix it?',
          senior: true,
        },
        {
          id: 'why-no-filter-or-orderby-pipes',
          text: "Why doesn't Angular ship `filter` or `orderBy` pipes, and how should you filter or sort lists instead?",
          senior: true,
        },
        {
          id: 'using-a-pipe-in-a-class',
          text: 'How do you use a pipe inside a component or service class instead of a template?',
        },
      ],
    },
    {
      id: 'directives',
      icon: 'ti-code',
      title: 'Directives & Decorators',
      color: '#993C1D',
      bg: '#FAECE7',
      questions: [
        { id: 'what-directives-are', text: 'What are directives in Angular?' },
        { id: 'hostlistener', text: 'What does @HostListener do?' },
        {
          id: 'custom-hover-background-directive',
          text: 'Create a custom directive to change background color on hover/unhover',
        },
        {
          id: 'custom-structural-directive-typed-context',
          text: 'How do you write a custom structural directive with `TemplateRef`, `ViewContainerRef` and a typed context?',
          senior: true,
        },
        {
          id: 'host-directives-composition-over-inheritance',
          text: 'What are host directives (`hostDirectives`), and how do they compose behaviour without inheritance?',
          senior: true,
        },
        {
          id: 'directive-or-component',
          text: 'When should a piece of UI be a directive rather than a component?',
        },
      ],
    },
    {
      id: 'dependency-injection',
      icon: 'ti-plug-connected',
      title: 'Dependency Injection & Services',
      color: '#4338CA',
      bg: '#E0E7FF',
      questions: [
        {
          id: 'uses-of-services-beyond-api-calls',
          text: 'Why do we use services in Angular apart from API calls?',
        },
        {
          id: 'di-beyond-injecting-services',
          text: 'What is Dependency Injection in Angular apart from injecting services?',
        },
        {
          id: 'how-di-works-internally',
          text: 'How does Dependency Injection work internally?',
          senior: true,
        },
        { id: 'multi-provider-tokens', text: 'What is Multi Provider Token?' },
        {
          id: 'injectiontoken-and-the-four-provider-recipes',
          text: 'What are `InjectionToken`s and factory providers, and when do you use `useValue`, `useClass`, `useExisting` and `useFactory`?',
        },
        {
          id: 'inject-options-optional-self-skipself',
          text: 'What do the `inject()` options `optional`, `self`, `skipSelf` and `host` do? Give a real use case for each.',
          senior: true,
        },
        {
          id: 'singleton-has-several-instances-debug-it',
          text: 'A service you expected to be a singleton has several instances, or one you expected per component is shared. How do you debug it?',
          senior: true,
        },
        {
          id: 'providedin-and-route-level-providers',
          text: 'What can `providedIn` be set to, and how do route-level providers work with lazy-loaded routes?',
          senior: true,
        },
      ],
    },
    {
      id: 'change-detection',
      icon: 'ti-refresh',
      title: 'Change Detection',
      color: '#854F0B',
      bg: '#FAEEDA',
      questions: [
        { id: 'how-change-detection-works', text: 'How does Change Detection work in Angular?' },
        {
          id: 'default-vs-onpush',
          text: 'Difference between Default and OnPush Change Detection Strategy',
        },
        {
          id: 'implementing-onpush-with-markforcheck',
          text: 'Where and how do you implement custom change detection (`ChangeDetectionStrategy.OnPush` and `markForCheck()`) in code?',
        },
        {
          id: 'markforcheck-vs-detectchanges',
          text: 'Difference between markForCheck() and detectChanges()',
          senior: true,
        },
        {
          id: 'change-detection-at-route-or-module-level',
          text: 'Can you configure or trigger change detection strategies at the routing or module level in Angular?',
          senior: true,
        },
        {
          id: 'change-detection-without-zone-js',
          text: 'How does Angular detect changes in a zone-less environment?',
          senior: true,
        },
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
        { id: 'what-signals-are', text: 'What are Signals in Angular?' },
        {
          id: 'signal-types-and-computed',
          text: 'Explain different types of Signals and the use case of computed().',
        },
        { id: 'computed-vs-effect', text: 'Difference between Computed Signal and Effect' },
        { id: 'signals-vs-rxjs', text: 'Difference between Signals and RxJS', senior: true },
        { id: 'signals-vs-ngrx', text: 'Signals vs NgRx', senior: true },
      ],
    },
    {
      id: 'modern-angular',
      icon: 'ti-sparkles',
      title: 'Modern Angular (v17+)',
      color: '#E11D48',
      bg: '#FFE4E6',
      questions: [
        {
          id: 'built-in-control-flow-vs-ngif-ngfor',
          text: 'What is the built-in control flow (`@if`, `@for`, `@switch`) and how is it better than `*ngIf` / `*ngFor`?',
        },
        {
          id: 'why-track-is-mandatory-in-for',
          text: 'Why is `track` mandatory in `@for`, and what should you track by?',
        },
        {
          id: 'deferrable-views-and-their-triggers',
          text: 'What are deferrable views (`@defer`)? Explain its triggers and the `@placeholder`, `@loading`, and `@error` blocks.',
        },
        {
          id: 'signal-inputs-vs-input',
          text: 'What are signal inputs (`input()`, `input.required()`) and how do they differ from `@Input()`?',
        },
        {
          id: 'model-and-two-way-binding',
          text: 'What is `model()` and how does two-way binding work with signals?',
        },
        {
          id: 'output-vs-output',
          text: 'What is the `output()` function and how does it differ from `@Output()` with `EventEmitter`?',
        },
        {
          id: 'signal-queries-vs-viewchild',
          text: 'What are signal queries (`viewChild()`, `contentChildren()`) and why use them instead of `@ViewChild`?',
        },
        {
          id: 'linkedsignal-vs-computed',
          text: 'What is `linkedSignal()` and when would you use it instead of `computed()`?',
          senior: true,
        },
        {
          id: 'resource-and-httpresource',
          text: 'What are `resource()` and `httpResource()`, and how do they load async data with signals?',
          senior: true,
        },
        {
          id: 'inject-vs-constructor-injection',
          text: 'What is the `inject()` function and why is it preferred over constructor injection?',
        },
        {
          id: 'destroyref-and-takeuntildestroyed',
          text: 'How do `DestroyRef` and `takeUntilDestroyed()` simplify cleanup and unsubscribing?',
        },
        {
          id: 'migrating-to-zoneless',
          text: 'How do you migrate an existing Angular app to zoneless change detection?',
          senior: true,
        },
        {
          id: 'hydration-and-event-replay',
          text: 'What is hydration in Angular? Explain event replay and incremental hydration.',
          senior: true,
        },
        {
          id: 'signal-forms-vs-reactive-forms',
          text: 'What are Signal Forms and how do they differ from Reactive Forms?',
        },
        {
          id: 'migrating-to-modern-angular-apis',
          text: 'How do you migrate an older Angular codebase to modern APIs (standalone, control flow, signal inputs, `inject()`)?',
          senior: true,
        },
      ],
    },
    {
      id: 'rxjs',
      icon: 'ti-wave-sine',
      title: 'RxJS & Observables',
      color: '#534AB7',
      bg: '#EEEDFE',
      questions: [
        { id: 'what-an-observable-is', text: 'What is an Observable in RxJS?' },
        { id: 'why-angular-uses-observables', text: 'Why do we use Observables in Angular?' },
        {
          id: 'promise-vs-observable',
          text: 'What are the key differences between a Promise and an Observable (`eager vs lazy, single vs multiple values, cancellation`)?',
        },
        {
          id: 'cold-vs-hot-observables',
          text: 'Explain the difference between cold and hot observables with examples',
          senior: true,
        },
        {
          id: 'subject-vs-observable',
          text: 'What is the core difference between a Subject and an Observable in RxJS?',
        },
        {
          id: 'subject-vs-behavior-replay-asyncsubject',
          text: 'What is the difference between Subject, BehaviorSubject, ReplaySubject, and AsyncSubject?',
        },
        { id: 'rxjs-operators-you-have-used', text: 'Which RxJS operators have you used?' },
        {
          id: 'switchmap-vs-mergemap-vs-concatmap',
          text: 'When would you use switchMap vs mergeMap vs concatMap vs exhaustMap? Give a real-world scenario for each',
          senior: true,
        },
        {
          id: 'combinelatest-vs-forkjoin-vs-zip',
          text: 'Explain the difference between combineLatest, forkJoin, zip, and withLatestFrom',
          senior: true,
        },
        {
          id: 'sharereplay-1-and-when-it-matters',
          text: 'What does shareReplay(1) do and when is it essential?',
          senior: true,
        },
        {
          id: 'debouncetime-vs-throttletime',
          text: 'What is the difference between debounceTime and throttleTime?',
        },
        {
          id: 'scan-vs-reduce',
          text: 'How does scan differ from reduce? Where would you use scan in an Angular app?',
        },
        {
          id: 'takeuntil-and-modern-alternatives',
          text: 'What is takeUntil and how is it used for subscription management? What are modern alternatives?',
        },
        {
          id: 'asyncscheduler-vs-queuescheduler',
          text: 'What are schedulers in RxJS and when would you use asyncScheduler vs queueScheduler?',
          senior: true,
        },
        {
          id: 'error-handling-catcherror-and-retry',
          text: 'How do you handle errors in RxJS streams? Explain catchError, retry, and retryWhen',
        },
        {
          id: 'full-rxjs-flow-api-to-error-handling',
          text: 'Explain the complete RxJS flow: API response, subscribe, and error handling',
        },
        {
          id: 'build-a-type-ahead-search-with-rxjs',
          text: "You're building a type-ahead search — implement it using RxJS operators, handling debounce, cancellation of in-flight requests, and deduplication",
          senior: true,
        },
        {
          id: 'repeated-clicks-fire-duplicate-calls',
          text: 'A user clicks a button 10 times and 10 API calls are triggered. How would you handle this using RxJS?',
          senior: true,
        },
        {
          id: 'prevent-duplicate-payment-submits',
          text: 'You have a payment form where the user clicks Submit. How do you prevent duplicate submissions using RxJS? Which operator do you choose and why?',
          senior: true,
        },
        {
          id: 'poll-an-api-until-destroy',
          text: "You need to poll an API every 10 seconds but stop polling when the component is destroyed. Show how you'd implement this",
          senior: true,
        },
        {
          id: 'resilient-stream-that-survives-errors',
          text: 'An observable chain emits an error and the entire stream terminates. How do you architect a resilient stream that recovers gracefully?',
          senior: true,
        },
      ],
    },
    {
      id: 'http-apis',
      icon: 'ti-api',
      title: 'HTTP, APIs & Interceptors',
      color: '#0E7490',
      bg: '#E0F7FA',
      questions: [
        {
          id: 'http-methods-and-when-to-use-each',
          text: 'What are the most common HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and when should each be used?',
        },
        {
          id: 'ways-to-send-data-to-an-api',
          text: 'In what different ways can client data be transmitted to an HTTP API endpoint (`Path Params`, `Query Params`, `Headers`, `Request Body/Payload`)?',
        },
        {
          id: 'body-in-a-get-request',
          text: 'Can you include a request body/payload inside an HTTP GET API request (`HttpClient.get()`)?',
        },
        {
          id: 'making-an-api-call-with-httpclient',
          text: 'How do you make an HTTP API call in Angular using `HttpClient`?',
        },
        {
          id: 'async-pipe-vs-manual-unsubscribe',
          text: 'How do you design API calling from the UI? When do you use the async pipe, and when should you unsubscribe manually?',
          senior: true,
        },
        {
          id: 'how-an-http-interceptor-works',
          text: 'What is an HTTP Interceptor (`HttpInterceptorFn`) in Angular and how does it intercept outgoing requests and incoming responses?',
        },
        {
          id: 'interceptor-for-common-error-responses',
          text: 'How to write an HTTP interceptor to handle common error responses?',
        },
        {
          id: 'global-vs-component-level-error-handling',
          text: 'Global error handling vs component-level error handling',
          senior: true,
        },
        {
          id: 'preventing-duplicate-api-requests',
          text: 'How do you prevent duplicate API requests in Angular?',
          senior: true,
        },
        {
          id: 'sharing-one-api-response-across-components',
          text: 'An API response is required by multiple components. How would you avoid repeated API calls?',
          senior: true,
        },
      ],
    },
    {
      id: 'routing',
      icon: 'ti-route',
      title: 'Routing & Guards',
      color: '#185FA5',
      bg: '#E6F1FB',
      questions: [
        {
          id: 'wildcard-as-the-first-route',
          text: 'What happens if you have `**` (`wildcard route`) as the very first route in the routing configuration file?',
        },
        {
          id: 'multiple-router-outlets',
          text: 'Is it possible to use multiple Router Outlets in Angular? If yes, how?',
        },
        {
          id: 'tracking-every-route-change',
          text: 'How would you track every route change to monitor user navigation?',
          senior: true,
        },
        {
          id: 'lazy-loading-with-loadcomponent',
          text: 'How do you implement route-level lazy loading of standalone components or feature modules in Angular (`loadChildren` / `loadComponent`)?',
        },
        {
          id: 'lazy-loading-and-preloading-strategies',
          text: 'Explain Lazy Loading and Preloading Strategies',
        },
        {
          id: 'route-guard-types',
          text: 'What are the different Route Guards (`canActivate`, `canActivateChild`, `canDeactivate`, `canMatch`, `resolve`) in Angular?',
        },
        {
          id: 'canmatch-vs-canload',
          text: 'Difference between canMatch and canLoad',
          senior: true,
        },
        {
          id: 'restricting-routes-with-guards',
          text: 'How do you restrict unauthorized users from accessing specific route URLs or components using Angular Route Guards?',
        },
        { id: 'resolvers', text: 'What are Resolvers?' },
      ],
    },
    {
      id: 'forms',
      icon: 'ti-forms',
      title: 'Forms',
      color: '#993556',
      bg: '#FBEAF0',
      questions: [
        {
          id: 'reactive-forms-in-real-apps',
          text: 'What can Reactive Forms do in a real-time application?',
        },
        { id: 'setvalue-vs-patchvalue', text: 'Difference between setValue and patchValue' },
        {
          id: 'dynamic-forms-with-formarray',
          text: 'How to implement Dynamic Forms in Angular using FormArray?',
        },
        {
          id: 'show-or-hide-fields-based-on-a-selection',
          text: 'How to implement a dynamic form where input fields are shown/hidden based on selection?',
        },
        {
          id: 'forms-from-json-configuration',
          text: 'How would you build a dynamic form using JSON configuration instead of hardcoding controls?',
          senior: true,
        },
        {
          id: 'splitting-a-50-field-form',
          text: 'Your form has more than 50 fields. Will you keep the complete reactive form and template inside one component?',
          senior: true,
        },
        {
          id: 'sharing-one-form-across-stepper-steps',
          text: 'Your application has a stepper and each step is implemented in a different Angular component. How would you share the complete form across all steps?',
          senior: true,
        },
        {
          id: 'debug-a-dropdown-toggled-by-many-events',
          text: 'Suppose a Reactive Form contains a dropdown that gets enabled/disabled from multiple events. A defect is reported where the dropdown behaves incorrectly. How would you debug which event is changing its state?',
          senior: true,
        },
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
        {
          id: 'ways-to-share-data-between-components',
          text: 'Different ways to share data between components',
        },
        {
          id: 'router-state-vs-a-shared-service',
          text: 'Is passing state and parameters through Angular routing preferred over using a shared service? When should each be used?',
          senior: true,
        },
        {
          id: 'value-shared-across-all-components',
          text: 'You have a value that has to be shared across all components. How do you implement this cleanly in Angular?',
        },
        {
          id: 'shared-state-service-with-behaviorsubject',
          text: 'Write the TypeScript syntax and code to implement a shared state service (`using BehaviorSubject or Signals`) across all components.',
        },
        {
          id: 'admin-update-reflected-everywhere-at-once',
          text: 'If admin updates data and changes need to reflect in multiple components simultaneously, how?',
          senior: true,
        },
      ],
    },
    {
      id: 'ngrx',
      icon: 'ti-stack-2',
      title: 'NgRx State Management',
      color: '#7E22CE',
      bg: '#F3E8FF',
      questions: [
        {
          id: 'ngrx-and-how-you-used-it',
          text: 'What is NgRx and how did you implement it in Angular applications?',
        },
        {
          id: 'setting-up-ngrx',
          text: 'What are the steps to set up NgRx in an Angular application?',
        },
        {
          id: 'ngrx-data-flow',
          text: 'Explain the NgRx data flow: Action → Reducer → Store → Selector → Component → Effect → Action',
        },
        {
          id: 'createaction-vs-createreducer',
          text: 'What is the difference between createAction, createReducer, and createEffect?',
        },
        {
          id: 'dispatch-vs-select',
          text: 'What is the difference between dispatch and select in NgRx? How do you avoid unnecessary re-renders via selectors?',
        },
        {
          id: 'selectors-and-memoization',
          text: 'What are Selectors in NgRx? Explain memoization and why it matters for performance',
          senior: true,
        },
        {
          id: 'createfeatureselector',
          text: 'What is createFeatureSelector and when do you use it?',
        },
        {
          id: 'how-effects-work',
          text: 'How do Effects work in NgRx? Explain ofType, switchMap, and error handling inside effects',
        },
        {
          id: 'concatlatestfrom-and-its-use-case',
          text: 'Explain concatLatestFrom (formerly withLatestFrom in effects) and its use case',
          senior: true,
        },
        { id: 'ngrx-entity', text: 'What is NgRx Entity and what problem does it solve?' },
        {
          id: 'ngrx-signal-store-vs-classic-store',
          text: 'What is the NgRx Signal Store (introduced in NgRx 17)? How does it differ from the traditional store?',
          senior: true,
        },
        {
          id: 'state-shape-for-a-banking-dashboard',
          text: 'Design the NgRx state shape for a banking dashboard that shows account list, selected account details, and transaction history with pagination',
          senior: true,
        },
        {
          id: 'cancel-a-stale-request-in-an-effect',
          text: 'An Effect makes an HTTP call, but you want to cancel the previous request if a new action arrives. Which operator do you use inside the effect and why?',
          senior: true,
        },
        {
          id: 'selector-runs-too-often-diagnose-it',
          text: 'Your selector is being called too frequently causing performance issues. How do you diagnose and fix this?',
          senior: true,
        },
        {
          id: 'optimistic-updates-with-ngrx',
          text: 'How would you implement optimistic updates using NgRx?',
          senior: true,
        },
        {
          id: 'undo-redo-with-ngrx',
          text: 'How would you implement undo/redo functionality using NgRx?',
          senior: true,
        },
      ],
    },
    {
      id: 'architecture',
      icon: 'ti-building',
      title: 'Architecture & Design',
      color: '#1E40AF',
      bg: '#DBEAFE',
      questions: [
        {
          id: 'solid-in-an-angular-app',
          text: 'How to implement SOLID principles in an Angular application?',
          senior: true,
        },
        {
          id: 'facade-pattern',
          text: 'Are you familiar with the facade pattern in Angular? Explain where you have used it.',
          senior: true,
        },
        {
          id: 'micro-frontend-architecture',
          text: 'Have you worked on Micro Frontend architecture?',
          senior: true,
        },
        {
          id: 'sharing-data-between-applications',
          text: 'If multiple applications need to share data, how would you design the communication?',
          senior: true,
        },
        {
          id: 'writing-hld-and-lld-documents',
          text: 'Do you create HLD or LLD documents while implementing new features?',
        },
        {
          id: 'an-enterprise-app-you-worked-on',
          text: 'Describe the architecture, tech stack, state management, and key modules of an enterprise Angular application you have worked on.',
          senior: true,
        },
      ],
    },
    {
      id: 'frontend-system-design',
      icon: 'ti-layout-dashboard',
      title: 'Frontend System Design',
      color: '#0E7490',
      bg: '#CFFAFE',
      questions: [
        {
          id: 'approaching-frontend-system-design',
          text: 'How do you approach a frontend system design interview?',
          senior: true,
        },
        {
          id: 'design-an-autocomplete-component',
          text: 'How would you design an autocomplete (type-ahead) search component?',
          senior: true,
        },
        {
          id: 'design-an-infinite-scrolling-feed',
          text: 'How would you design an infinite-scrolling news feed?',
          senior: true,
        },
        {
          id: 'design-a-shared-component-library',
          text: 'How would you design a reusable component library or design system shared by several Angular apps?',
          senior: true,
        },
        {
          id: 'design-a-real-time-dashboard',
          text: 'How would you design a real-time dashboard that shows live data?',
          senior: true,
        },
        {
          id: 'design-an-offline-first-app',
          text: 'How would you design an offline-first Angular application?',
          senior: true,
        },
        {
          id: 'design-a-large-multi-step-form',
          text: 'How would you design a large multi-step form, such as a loan or insurance application?',
          senior: true,
        },
        {
          id: 'structuring-a-codebase-for-many-teams',
          text: 'How would you structure a large Angular codebase so that several teams can work on it independently?',
          senior: true,
        },
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
        {
          id: 'optimizing-an-angular-app',
          text: 'How do you optimize an Angular application? Consider lazy loading, OnPush change detection, trackBy, and caching.',
          senior: true,
        },
        {
          id: 'virtual-scrolling-and-pagination',
          text: 'Handle bulk records using virtual scrolling and pagination, and limit API result per page',
          senior: true,
        },
        {
          id: 'ssr-vs-csr',
          text: 'What is Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?',
        },
        {
          id: 'analysing-and-reducing-the-bundle',
          text: 'How do you analyse and reduce an Angular bundle (build stats, lazy routes, `@defer`, tree-shaking pitfalls)?',
          senior: true,
        },
        {
          id: 'defer-and-incremental-hydration-for-cwv',
          text: 'How do `@defer` and incremental hydration improve Core Web Vitals in an Angular app?',
          senior: true,
        },
        {
          id: 'how-ngoptimizedimage-helps-lcp-and-cls',
          text: 'How does `NgOptimizedImage` improve LCP and CLS?',
        },
        {
          id: 'finding-slow-change-detection',
          text: 'How do you find and fix slow change detection with Angular DevTools and the Chrome Performance panel?',
          senior: true,
        },
        {
          id: 'moving-work-to-a-web-worker',
          text: 'When should you move work to a web worker in an Angular app, and how?',
          senior: true,
        },
      ],
    },
    {
      id: 'security-storage',
      icon: 'ti-shield-lock',
      title: 'Security & Browser Storage',
      color: '#B91C1C',
      bg: '#FEE2E2',
      questions: [
        { id: 'securing-an-angular-app', text: 'How are you securing your Angular application?' },
        {
          id: 'role-based-access-control',
          text: 'How to implement role-based access control in Angular?',
        },
        {
          id: 'where-to-store-auth-tokens',
          text: 'Where do you store authentication tokens? Session Storage vs Local Storage, and can tokens be stored in a service using RxJS Observables?',
          senior: true,
        },
        {
          id: 'xss-and-angular-s-built-in-protection',
          text: 'What is XSS (Cross-Site Scripting) and how does Angular protect against it by default?',
        },
        {
          id: 'domsanitizer-and-bypasssecuritytrust',
          text: 'What does `DomSanitizer` do, and when should you use `bypassSecurityTrustHtml`?',
        },
        {
          id: 'csrf-xsrf-and-httpclient',
          text: 'What is CSRF/XSRF and how does Angular `HttpClient` help prevent it?',
        },
        {
          id: 'content-security-policy-with-angular',
          text: 'What is a Content Security Policy (CSP) and how do you use it with Angular?',
          senior: true,
        },
        {
          id: 'trusted-types',
          text: 'What are Trusted Types and how does Angular support them?',
          senior: true,
        },
        {
          id: 'httponly-secure-and-samesite-cookies',
          text: 'How do the `HttpOnly`, `Secure`, and `SameSite` cookie attributes protect a session?',
          senior: true,
        },
        {
          id: 'why-guards-and-hidden-buttons-aren-t-security',
          text: 'Why are route guards and hidden buttons not real security?',
          senior: true,
        },
        {
          id: 'why-the-angular-app-can-t-fix-cors',
          text: "What is CORS, and why can't you fix a CORS error from the Angular app?",
          senior: true,
        },
      ],
    },
    {
      id: 'testing',
      icon: 'ti-test-pipe',
      title: 'Testing',
      color: '#059669',
      bg: '#D1FAE5',
      questions: [
        {
          id: 'angular-testing-frameworks-you-have-used',
          text: 'Have you used Angular testing frameworks?',
        },
        { id: 'mocking-a-service', text: 'How will you mock a service?' },
        {
          id: 'testing-before-the-backend-is-ready',
          text: 'Your UI development is complete but backend APIs are still under development and API contracts are available. How will you test the application?',
          senior: true,
        },
        {
          id: 'testbed-and-componentfixture-setup',
          text: 'How do you set up a component test with `TestBed` and `ComponentFixture`?',
        },
        {
          id: 'testing-signal-inputs-and-outputs',
          text: 'How do you test a component that uses signal inputs (`input()`) and outputs (`output()`)?',
        },
        {
          id: 'testing-http-with-httptestingcontroller',
          text: 'How do you test HTTP calls with `HttpTestingController`?',
        },
        {
          id: 'testing-timers-and-debounced-search',
          text: 'How do you test asynchronous code such as timers and debounced search in Angular tests?',
        },
        {
          id: 'testing-onpush-and-zoneless-components',
          text: 'How do you test OnPush and zoneless components, and what does `fixture.whenStable()` do?',
          senior: true,
        },
        {
          id: 'testing-a-functional-guard-or-interceptor',
          text: 'How do you test a functional route guard or HTTP interceptor?',
        },
        {
          id: 'component-harnesses',
          text: 'What are component harnesses (`ComponentHarness`) and why use them?',
          senior: true,
        },
        {
          id: 'vitest-vs-karma-jasmine-vs-jest',
          text: 'What is the default test runner in modern Angular, and how does Vitest compare with Karma/Jasmine and Jest?',
        },
        {
          id: 'unit-vs-end-to-end-test-coverage',
          text: 'What should you cover with unit tests versus end-to-end tests (Playwright or Cypress)?',
          senior: true,
        },
        {
          id: 'avoiding-flaky-tests',
          text: 'What makes a test flaky, and how do you avoid flaky Angular tests?',
          senior: true,
        },
      ],
    },
    {
      id: 'frontend-debugging',
      icon: 'ti-bug',
      title: 'Debugging & Real-World Scenarios',
      color: '#DC2626',
      bg: '#FEE2E2',
      questions: [
        {
          id: 'memory-grows-the-longer-the-app-is-open',
          text: 'Memory keeps growing the longer a user keeps the Angular app open. How do you find and fix the leak?',
          senior: true,
        },
        {
          id: 'expressionchangedafterithasbeenchecked',
          text: 'You get `ExpressionChangedAfterItHasBeenCheckedError`. What causes it, and how do you fix it properly?',
          senior: true,
        },
        {
          id: 'table-of-10000-rows-freezes',
          text: 'A table with 10,000 rows freezes the page. How do you diagnose and fix it?',
          senior: true,
        },
        {
          id: 'bug-only-in-production',
          text: 'A bug happens only in production, never locally. How do you investigate it?',
          senior: true,
        },
        {
          id: 'blank-page-or-chunkloaderror-after-deploy',
          text: 'After a deployment, some users see a blank page or a `ChunkLoadError`. Why, and how do you prevent it?',
          senior: true,
        },
        {
          id: 'works-in-postman-cors-error-in-browser',
          text: 'An API call works in Postman but fails from the browser with a CORS error in production. How do you debug it?',
          senior: true,
        },
        {
          id: 'slow-first-load-lcp-and-bundle-size',
          text: 'The app is slow on first load. How do you measure and improve LCP and bundle size?',
          senior: true,
        },
        {
          id: 'view-doesn-t-update-after-data-changes',
          text: "A component's view does not update even though the data changed. What are the likely causes?",
          senior: true,
        },
        {
          id: 'button-sometimes-does-nothing',
          text: 'Users report that a button sometimes does nothing when clicked. How do you reproduce and track it down?',
          senior: true,
        },
      ],
    },
    {
      id: 'lld-design',
      icon: 'ti-hierarchy',
      title: 'Low-Level Design & OOP',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        {
          id: 'approaching-a-low-level-design-interview',
          text: 'How do you approach a low-level design interview, and what are interviewers looking for?',
        },
        {
          id: 'solid-with-typescript-examples',
          text: 'Explain SOLID with Node.js/TypeScript examples. Which principle do you see violated most often in real code?',
        },
        {
          id: 'composition-vs-inheritance',
          text: 'Composition vs inheritance: when is inheritance the right tool, and how do you refactor a deep class hierarchy?',
        },
        {
          id: 'coupling-and-cohesion',
          text: 'What are coupling and cohesion, and how do you spot and reduce bad coupling in a codebase?',
        },
        {
          id: 'designing-code-for-testability',
          text: 'How do you design code for testability (dependency inversion, ports and adapters, a pure core)?',
          senior: true,
        },
        {
          id: 'refactor-a-provider-switch-to-strategy',
          text: 'A service has a growing `switch` over payment providers. Refactor it with the Strategy pattern and explain the trade-offs.',
        },
        {
          id: 'factory-vs-abstract-factory',
          text: 'When do you use a Factory or Abstract Factory, and when is it over-engineering?',
        },
        {
          id: 'adapter-and-facade-around-a-third-party-sdk',
          text: 'How do the Adapter and Facade patterns help you integrate a third-party SDK you might replace later?',
        },
        {
          id: 'cross-cutting-concerns-with-decorator',
          text: 'How do you add cross-cutting behaviour (caching, retries, logging) with the Decorator pattern without changing the original class?',
          senior: true,
        },
        {
          id: 'refactoring-a-600-line-god-service',
          text: 'You inherit a 600-line "god service". How do you refactor it safely, and what do you extract first?',
          senior: true,
        },
        {
          id: 'design-a-parking-lot',
          text: 'Design a parking lot system (LLD): entities, classes, relationships and how it handles concurrency.',
          senior: true,
        },
        {
          id: 'design-a-rate-limiter-library',
          text: 'Design a rate-limiter library with pluggable algorithms (LLD): interfaces, classes and how you test it.',
          senior: true,
        },
        {
          id: 'design-a-notification-service',
          text: 'Design a notification service (LLD) that supports email, SMS and push, with retries, templates and user preferences.',
          senior: true,
        },
        {
          id: 'design-a-cache-with-pluggable-eviction',
          text: 'Design an in-memory cache with pluggable eviction policies (LRU, LFU, TTL) (LLD).',
          senior: true,
        },
        {
          id: 'design-a-splitwise-style-expense-app',
          text: 'Design an expense-sharing app like Splitwise (LLD): groups, split types and settling balances.',
          senior: true,
        },
      ],
    },
    {
      id: 'fullstack-scenarios',
      icon: 'ti-layers-linked',
      title: 'Full-Stack Scenarios',
      color: '#4338CA',
      bg: '#E0E7FF',
      questions: [
        {
          id: 'login-flow-end-to-end',
          text: 'Trace a login end to end in an Angular + Node app: form, API, token or cookie, interceptor, silent refresh and logout everywhere.',
          senior: true,
        },
        {
          id: 'upload-a-2-gb-file-from-angular',
          text: 'How do you let users upload a 2 GB file from Angular: presigned URLs, progress, resume, scanning, background processing and notifying the UI?',
          senior: true,
        },
        {
          id: 'live-order-status-websocket-vs-sse-vs-polling',
          text: 'Design live order-status updates from Node to Angular: WebSocket vs SSE vs polling, reconnection, and scaling across several server instances.',
          senior: true,
        },
        {
          id: 'paginated-filterable-table-end-to-end',
          text: 'Design a paginated, filterable, sortable table end to end: the API contract, MongoDB indexes, Angular state and URL-synced filters.',
          senior: true,
        },
        {
          id: 'share-types-between-angular-and-node',
          text: 'How do you share types and validation between Angular and Node (OpenAPI codegen, a shared package in a monorepo, or Zod schemas)?',
        },
        {
          id: 'errors-end-to-end-message-to-trace',
          text: 'How do you handle errors end to end so the user sees a useful message and support can trace it (Problem Details, interceptor, correlation ID, logging)?',
        },
        {
          id: 'concurrent-edits-and-optimistic-updates',
          text: 'Two users edit the same record. How do you handle optimistic UI updates and server-side conflicts (version field, ETag, 409) end to end?',
          senior: true,
        },
        {
          id: 'saved-but-still-stale-find-the-layer',
          text: 'A user saves a change but still sees old data. How do you find which layer is stale: browser cache, CDN, Redis, or a read replica?',
          senior: true,
        },
        {
          id: 'slow-page-angular-network-api-or-db',
          text: 'A page is slow. How do you work out whether the problem is in Angular, the network, the API or the database, and which tools do you use?',
          senior: true,
        },
        {
          id: 'breaking-api-change-vs-cached-old-bundles',
          text: 'How do you roll out a breaking API change while users still have old Angular bundles cached in their browsers?',
          senior: true,
        },
      ],
    },
    {
      id: 'experience-behavioral',
      icon: 'ti-user-star',
      title: 'Experience & Behavioral',
      color: '#A8300B',
      bg: '#FCE9E1',
      questions: [
        {
          id: 'why-angular-over-react',
          text: 'Why did you choose Angular when most developers are learning React?',
        },
        {
          id: 'third-party-angular-libraries-you-use',
          text: 'Which third-party Angular libraries have you used in your projects, and why?',
        },
        {
          id: 'hardest-angular-bug-you-solved',
          text: 'What is the most challenging technical or performance bug you have solved in an Angular frontend application and how did you resolve it?',
          senior: true,
        },
        {
          id: 'proof-of-concept-you-built',
          text: 'Have you created any proof of concept (POC)? Explain one.',
        },
        {
          id: 'deployment-activities-you-handled',
          text: 'What deployment activities have you handled?',
        },
        {
          id: 'working-across-teams-and-dependencies',
          text: 'Have you worked with teams from different organizations where your module depended on parallel development teams? How did you manage communication and dependencies?',
          senior: true,
        },
        { id: 'ai-tools-you-use', text: 'Have you used any AI tools?' },
        { id: 'tell-me-about-yourself', text: 'Tell me about yourself.' },
        {
          id: 'star-method-for-behavioral-answers',
          text: 'How do you structure answers to behavioral questions using the STAR method?',
        },
        {
          id: 'disagreeing-on-a-technical-decision',
          text: 'Tell me about a time you disagreed with a teammate or reviewer on a technical decision.',
          senior: true,
        },
        {
          id: 'missed-deadline-or-derailed-project',
          text: 'Tell me about a time you missed a deadline or a project went off track.',
          senior: true,
        },
        {
          id: 'production-bug-you-caused',
          text: 'Tell me about a production bug you caused and how you handled it.',
          senior: true,
        },
        {
          id: 'giving-and-receiving-code-review-feedback',
          text: 'How do you give and receive code review feedback?',
          senior: true,
        },
        {
          id: 'mentoring-a-junior-developer',
          text: 'Tell me about a time you mentored or helped a junior developer.',
          senior: true,
        },
        {
          id: 'estimating-and-when-estimates-are-wrong',
          text: 'How do you estimate a feature, and what do you do when your estimate turns out to be wrong?',
          senior: true,
        },
        {
          id: 'tech-debt-vs-new-features',
          text: 'How do you decide between paying down technical debt and shipping new features?',
          senior: true,
        },
        {
          id: 'pushing-back-on-product',
          text: 'Tell me about a time you pushed back on a deadline or a requirement from product.',
          senior: true,
        },
        {
          id: 'leading-a-migration-or-big-refactor',
          text: 'Tell me about a migration or large refactor you led. How did you plan and de-risk it?',
          senior: true,
        },
        {
          id: 'running-an-incident-and-post-mortem',
          text: 'Tell me about a production incident you owned. How did you run the response and the post-mortem?',
          senior: true,
        },
        {
          id: 'deciding-with-incomplete-information',
          text: 'Tell me about a decision you had to make with incomplete information.',
          senior: true,
        },
        {
          id: 'influencing-a-team-you-don-t-manage',
          text: 'How do you get a team you do not manage to adopt your technical approach?',
          senior: true,
        },
        {
          id: 'teammate-who-keeps-missing-commitments',
          text: 'How do you handle a teammate who keeps missing commitments or underperforming?',
          senior: true,
        },
        {
          id: 'decision-you-would-now-reverse',
          text: 'Tell me about a technical decision you made that you would now reverse.',
          senior: true,
        },
        {
          id: 'setting-code-review-standards',
          text: 'How do you set and keep code review standards across a team?',
          senior: true,
        },
        {
          id: 'why-change-jobs-why-this-company',
          text: 'Why are you looking for a change, and why do you want to join this company?',
        },
        {
          id: 'questions-to-ask-the-interviewer',
          text: 'What questions should you ask the interviewer at the end of an interview?',
        },
      ],
    },
    {
      id: 'coding-round',
      icon: 'ti-terminal-2',
      title: 'JavaScript Coding',
      color: '#6B21A8',
      bg: '#F3E8FF',
      questions: [
        { id: 'check-for-a-palindrome', text: 'Check if a string is a palindrome' },
        {
          id: 'first-non-repeating-character',
          text: 'Find the first non-repeating character in a string',
        },
        {
          id: 'remove-duplicates-from-an-array',
          text: 'Remove duplicate elements from an array [1,2,2,3,4,4,5] using built-in method and for loop',
        },
        { id: 'flatten-a-nested-array', text: 'Flatten a nested array' },
        { id: 'group-objects-by-property', text: 'Group an array of objects by property' },
        { id: 'implement-debounce', text: 'Implement a debounce() function' },
        {
          id: 'implement-deep-clone-with-cycles',
          text: 'Implement a deep clone that handles nested objects, arrays, `Date`, `Map`, `Set` and circular references.',
          senior: true,
        },
        { id: 'implement-deep-equality', text: 'Implement deep equality for objects and arrays.' },
        {
          id: 'implement-memoize-with-an-lru-limit',
          text: 'Implement `memoize` with a cache-key strategy and an optional size limit.',
        },
        {
          id: 'implement-throttle-leading-and-trailing',
          text: 'Implement `throttle` with leading and trailing options.',
        },
        {
          id: 'implement-curry',
          text: 'Implement `curry` for a function with any number of arguments.',
        },
        {
          id: 'implement-promise-allsettled-and-race',
          text: 'Implement `Promise.allSettled` and `Promise.race` from scratch.',
        },
        {
          id: 'implement-flatten-and-unflatten-dot-keys',
          text: 'Flatten a nested object into dot-notation keys, and unflatten it back.',
        },
        {
          id: 'implement-sync-and-async-pipe-compose',
          text: 'Implement `pipe` and `compose` for both sync and async functions.',
        },
        {
          id: 'implement-a-type-safe-event-bus',
          text: 'Implement a type-safe event bus in TypeScript with `on`, `off` and `emit`.',
          senior: true,
        },
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
        {
          id: 'node-js-vs-browser-javascript',
          text: 'What is Node.js and how does it differ from browser JavaScript?',
        },
        { id: 'what-libuv-does', text: 'What is libuv and what role does it play in Node.js?' },
        {
          id: 'synchronous-vs-asynchronous-code',
          text: 'What is the difference between synchronous and asynchronous code in Node.js?',
        },
        {
          id: 'node-fundamentals-how-the-event-loop-works',
          text: 'What is the Event Loop in Node.js and how does it work?',
        },
        {
          id: 'phases-of-the-event-loop',
          text: 'What are the phases of the Node.js Event Loop?',
          senior: true,
        },
        {
          id: 'process-nexttick-vs-setimmediate',
          text: 'What is the difference between process.nextTick() and setImmediate()?',
          senior: true,
        },
        {
          id: 'settimeout-vs-setimmediate',
          text: 'What is the difference between setTimeout() and setImmediate() in the context of the event loop?',
        },
        {
          id: 'commonjs-vs-es-modules',
          text: 'What is the difference between CommonJS (require) and ES Modules (import) in Node.js?',
        },
        { id: 'module-caching', text: 'What is module caching in Node.js?' },
        {
          id: 'worker-threads-and-when-to-use-them',
          text: 'What are Worker Threads in Node.js and when should you use them?',
          senior: true,
        },
        {
          id: 'fork-vs-spawn-vs-exec',
          text: 'What is the difference between child_process.fork(), spawn(), and exec()?',
          senior: true,
        },
        {
          id: 'set-up-typescript-in-node-js',
          text: 'How do you set up TypeScript in a Node.js project?',
        },
      ],
    },
    {
      id: 'nodejs-error-handling',
      icon: 'ti-shield-exclamation',
      title: 'Error Handling',
      color: '#DC2626',
      bg: '#FEE2E2',
      questions: [
        {
          id: 'operational-vs-programmer-errors',
          text: 'What is the difference between operational errors and programmer errors?',
        },
        {
          id: 'custom-error-hierarchy-and-http-mapping',
          text: 'How do you design a custom error hierarchy for a Node.js API, and where should errors be translated into HTTP responses?',
          senior: true,
        },
        {
          id: 'how-async-errors-get-lost',
          text: 'What are the common ways async errors get lost in Node.js (floating promises, missing `await`, async callbacks in `forEach`, emitters and streams), and how do you catch them?',
          senior: true,
        },
        {
          id: 'handling-uncaught-exceptions',
          text: 'How do you handle uncaught exceptions in Node.js?',
        },
        {
          id: 'try-catch-vs-uncaughtexception',
          text: 'What is the difference between try/catch and process.on("uncaughtException")?',
          senior: true,
        },
        {
          id: 'asynclocalstorage-for-request-context',
          text: 'What is `AsyncLocalStorage`, and how do you use it to carry request context such as a request ID? What are its pitfalls?',
          senior: true,
        },
        {
          id: 'surviving-a-failing-dependency',
          text: 'How should a Node.js service handle failures of a dependency (database, Redis, third-party API) without taking the whole service down?',
          senior: true,
        },
        {
          id: 'graceful-shutdown',
          text: 'How do you implement graceful shutdown in Node.js?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-streams',
      icon: 'ti-wave-sine',
      title: 'Streams & Buffers',
      color: '#0284C7',
      bg: '#E0F2FE',
      questions: [
        {
          id: 'buffers-and-when-to-use-them',
          text: 'What is a Buffer in Node.js and when would you use it?',
        },
        { id: 'four-stream-types', text: 'What are the four types of streams in Node.js?' },
        {
          id: 'backpressure',
          text: 'What is backpressure and how does Node.js handle it?',
          senior: true,
        },
        {
          id: 'stream-pipeline-vs-pipe',
          text: 'What is stream.pipeline() and why is it preferred over .pipe()?',
          senior: true,
        },
        {
          id: 'write-a-custom-transform-stream',
          text: 'How do you create a custom Transform stream?',
        },
        {
          id: 'process-a-large-csv-efficiently',
          text: 'How would you process a large CSV file efficiently in Node.js?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-memory',
      icon: 'ti-cpu',
      title: 'Memory Management',
      color: '#D97706',
      bg: '#FEF3C7',
      questions: [
        {
          id: 'how-garbage-collection-works',
          text: 'How does garbage collection work in Node.js?',
        },
        {
          id: 'common-causes-of-memory-leaks',
          text: 'What are common causes of memory leaks in Node.js applications?',
          senior: true,
        },
        {
          id: 'diagnose-a-leak-in-production',
          text: 'How do you detect and diagnose memory leaks in a production Node.js app?',
          senior: true,
        },
        {
          id: 'test-for-memory-leaks',
          text: 'How do you test for memory leaks in Node.js?',
          senior: true,
        },
        {
          id: 'tools-to-monitor-memory-usage',
          text: 'What tools can you use to monitor Node.js memory usage?',
        },
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
        { id: 'how-express-middleware-works', text: 'How does Express middleware work?' },
        {
          id: 'app-use-vs-app-get',
          text: 'What is the difference between app.use() and app.get() in Express?',
        },
        {
          id: 'validate-requests-with-zod',
          text: 'How do you validate requests in Express with a schema library such as Zod, and why validate at the edge?',
        },
        {
          id: 'structure-a-production-express-app',
          text: 'How do you structure a production Express app (routes, controllers, services, repositories), and where do validation, auth and transactions belong?',
          senior: true,
        },
        {
          id: 'express-5-changes-and-upgrade-breaks',
          text: 'What changed in Express 5, and what breaks when you upgrade from Express 4?',
          senior: true,
        },
        {
          id: 'request-never-responds-no-logs',
          text: 'A request in Express never gets a response and nothing appears in the logs. What are the likely causes, and how do you find it?',
          senior: true,
        },
        {
          id: 'cancel-work-on-disconnect-or-timeout',
          text: 'How do you stop downstream work when the client disconnects or a request times out (`AbortController`)?',
          senior: true,
        },
        {
          id: 'fastify-vs-express',
          text: 'What is the difference between Fastify and Express?',
          senior: true,
        },
        { id: 'nestjs-vs-express', text: 'What is NestJS and how does it differ from Express?' },
        {
          id: 'nest-modules-and-provider-scopes',
          text: 'How do NestJS modules and provider scopes work, and why can request-scoped providers hurt performance?',
          senior: true,
        },
        {
          id: 'nest-guards-interceptors-and-pipes',
          text: 'What are Guards, Interceptors, and Pipes in NestJS?',
          senior: true,
        },
        {
          id: 'nest-validation-with-class-validator',
          text: 'How do you implement request validation in NestJS using class-validator?',
        },
        {
          id: 'jwt-authentication-in-nestjs',
          text: 'How do you implement JWT authentication in NestJS?',
        },
        {
          id: 'versioned-apis-in-nestjs',
          text: 'How do you implement versioned APIs in NestJS?',
          senior: true,
        },
        {
          id: 'nest-circular-dependencies-forwardref',
          text: 'How do you deal with circular dependencies in NestJS (`forwardRef`), and what do they tell you about your design?',
          senior: true,
        },
        {
          id: 'test-nest-services-and-controllers',
          text: 'How do you test a NestJS service and controller (`Test.createTestingModule`, overriding providers)?',
        },
        {
          id: 'file-uploads-in-express-and-nestjs',
          text: 'How do you handle file uploads in Express/NestJS?',
        },
      ],
    },
    {
      id: 'nodejs-api-design',
      icon: 'ti-api',
      title: 'API Design',
      color: '#1D4ED8',
      bg: '#DBEAFE',
      questions: [
        {
          id: 'what-makes-a-rest-api-well-designed',
          text: 'What makes a REST API well designed: resources, naming, status codes and consistency?',
        },
        {
          id: 'evolve-an-api-without-breaking-clients',
          text: 'How do you evolve an API without breaking existing clients (versioning and backward compatibility)?',
          senior: true,
        },
        {
          id: 'api-errors-with-problem-details',
          text: 'How should an API return errors? Explain Problem Details (RFC 9457).',
        },
        {
          id: 'openapi-contract-first-vs-code-first',
          text: 'How do you use OpenAPI in a team: contract-first vs code-first, and generated clients?',
          senior: true,
        },
        {
          id: 'design-and-secure-webhooks',
          text: 'How do you design and secure webhooks (signatures, retries, idempotency)?',
          senior: true,
        },
        {
          id: 'graphql-n-plus-1-dataloader',
          text: 'What is the N+1 problem in GraphQL, and how does DataLoader solve it?',
          senior: true,
        },
        {
          id: 'backend-for-frontend-bff-pattern',
          text: 'What is the Backend-for-Frontend (BFF) pattern, and when is it worth it?',
          senior: true,
        },
        {
          id: 'filtering-sorting-and-field-selection',
          text: 'How do you design filtering, sorting and field selection for a list endpoint?',
        },
        {
          id: 'long-running-operations-202-accepted',
          text: 'How do you design long-running operations in an API (202 Accepted, polling, callbacks)?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-networking',
      icon: 'ti-wifi',
      title: 'Networking & HTTP',
      color: '#7C3AED',
      bg: '#EDE9FE',
      questions: [
        {
          id: 'http-status-code-ranges',
          text: 'What are HTTP status codes? Explain 2xx, 3xx, 4xx, 5xx ranges.',
        },
        {
          id: 'http-1-1-vs-http-2-vs-http-3',
          text: 'What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?',
          senior: true,
        },
        { id: 'http-keep-alive', text: 'What is Keep-Alive in HTTP connections?' },
        {
          id: 'tls-and-https-in-node-js',
          text: 'What is TLS/SSL and how do you enable HTTPS in Node.js?',
        },
        {
          id: 'request-timeouts-in-http-servers',
          text: 'How do you implement request timeouts in Node.js HTTP servers?',
          senior: true,
        },
        {
          id: 'rest-vs-graphql-vs-grpc',
          text: 'What is the difference between REST, GraphQL, and gRPC?',
          senior: true,
        },
        {
          id: 'websockets-in-node-js',
          text: 'What are WebSockets and how do you implement them in Node.js?',
        },
        {
          id: 'sse-vs-websockets',
          text: 'What is Server-Sent Events (SSE) and when should you use it over WebSockets?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-security',
      icon: 'ti-lock',
      title: 'Security & Auth',
      color: '#B91C1C',
      bg: '#FEE2E2',
      questions: [
        {
          id: 'common-node-js-vulnerabilities',
          text: 'What are the most common security vulnerabilities in Node.js applications?',
        },
        {
          id: 'authentication-vs-authorization',
          text: 'What is the difference between authentication and authorization?',
        },
        {
          id: 'how-jwt-authentication-works',
          text: 'What is JWT and how does authentication work with it?',
        },
        { id: 'how-oauth-2-0-works', text: 'What is OAuth 2.0 and how does it work?' },
        { id: 'store-passwords-securely', text: 'How do you store passwords securely in Node.js?' },
        { id: 'prevent-sql-injection', text: 'What is SQL injection and how do you prevent it?' },
        {
          id: 'prevent-nosql-injection-in-mongodb',
          text: 'How do you prevent NoSQL injection in MongoDB?',
        },
        {
          id: 'configure-cors-in-node-js',
          text: 'What is CORS and how do you configure it in Node.js?',
        },
        {
          id: 'helmet-js-and-security-headers',
          text: 'What is helmet.js and what security headers does it set?',
        },
      ],
    },
    {
      id: 'nodejs-auth-advanced',
      icon: 'ti-key',
      title: 'Auth in Depth',
      color: '#B45309',
      bg: '#FEF3C7',
      questions: [
        {
          id: 'sessions-vs-jwts',
          text: 'Sessions vs JWTs: what are the real trade-offs for a web app?',
          senior: true,
        },
        {
          id: 'access-and-refresh-tokens-rotation',
          text: 'How do access tokens and refresh tokens work together, and what is refresh token rotation?',
          senior: true,
        },
        {
          id: 'revoke-a-jwt-before-it-expires',
          text: 'How do you revoke a JWT or log a user out before the token expires?',
          senior: true,
        },
        {
          id: 'openid-connect-vs-oauth-2-0',
          text: 'What is OpenID Connect, and how does it differ from OAuth 2.0?',
        },
        {
          id: 'pkce-for-spas-and-mobile-apps',
          text: 'What is PKCE, and why is it required for single-page and mobile apps?',
          senior: true,
        },
        {
          id: 'where-an-angular-spa-keeps-tokens',
          text: 'Where should an Angular SPA keep its tokens, and how does the BFF pattern help with auth?',
          senior: true,
        },
        {
          id: 'enterprise-sso-with-saml-or-oidc',
          text: 'How does single sign-on work with SAML or OIDC in an enterprise app?',
          senior: true,
        },
        {
          id: 'rbac-vs-abac-vs-rebac',
          text: 'RBAC vs ABAC vs ReBAC: how do you model permissions?',
          senior: true,
        },
        {
          id: 'tenant-isolation-in-a-saas-api',
          text: 'How do you enforce tenant isolation in a multi-tenant SaaS API?',
          senior: true,
        },
        {
          id: 'add-mfa-and-passkeys-to-login',
          text: 'How do you add MFA and passkeys (WebAuthn) to a login flow?',
          senior: true,
        },
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
        { id: 'sql-vs-nosql', text: 'What is the difference between SQL and NoSQL databases?' },
        {
          id: 'normalization-1nf-2nf-3nf',
          text: 'What is database normalization? Explain 1NF, 2NF, 3NF',
        },
        {
          id: 'sql-joins-and-when-to-use-each',
          text: 'What are SQL joins and when do you use each type?',
        },
        { id: 'how-sql-indexes-work', text: 'What are indexes in SQL and how do they work?' },
        {
          id: 'clustered-vs-non-clustered-indexes',
          text: 'What is the difference between clustered and non-clustered indexes?',
          senior: true,
        },
        {
          id: 'transaction-isolation-levels',
          text: 'What are database transaction isolation levels?',
          senior: true,
        },
        { id: 'stored-procedures', text: 'What is a stored procedure?' },
        {
          id: 'orms-pros-and-cons',
          text: 'What is an ORM? What are the advantages and disadvantages of using one?',
        },
        {
          id: 'sql-n-plus-1-problem',
          text: 'What is the N+1 query problem and how do you fix it?',
          senior: true,
        },
        {
          id: 'read-an-explain-analyze-plan',
          text: 'How do you read an `EXPLAIN ANALYZE` plan to find out why a query is slow?',
          senior: true,
        },
        {
          id: 'composite-index-column-order',
          text: 'How do you design a composite index, and why does column order matter?',
          senior: true,
        },
        {
          id: 'prevent-and-handle-deadlocks',
          text: 'What causes deadlocks, and how do you prevent and handle them?',
          senior: true,
        },
        {
          id: 'zero-downtime-schema-changes',
          text: 'How do you change a database schema with zero downtime (expand and contract)?',
          senior: true,
        },
        {
          id: 'read-replicas-and-replication-lag',
          text: 'How do read replicas work, and how do you deal with replication lag?',
          senior: true,
        },
        {
          id: 'partition-or-shard-a-table',
          text: 'When and how do you partition or shard a relational table?',
          senior: true,
        },
        {
          id: 'postgres-jsonb-vs-a-document-db',
          text: 'PostgreSQL `JSONB` vs a document database: when is each the better choice?',
          senior: true,
        },
        {
          id: 'multi-tenant-database-models',
          text: 'How do you design a multi-tenant database: shared schema, schema per tenant, or database per tenant?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-nosql',
      icon: 'ti-database',
      title: 'NoSQL Databases (MongoDB)',
      color: '#166534',
      bg: '#DCFCE7',
      questions: [
        {
          id: 'when-to-choose-mongodb',
          text: 'What is MongoDB and when would you choose it over a relational database?',
        },
        {
          id: 'embedding-vs-referencing',
          text: 'What is the difference between embedding and referencing in MongoDB schema design?',
          senior: true,
        },
        {
          id: 'unbounded-arrays-and-the-16-mb-limit',
          text: 'Why are unbounded arrays an anti-pattern in MongoDB, and what happens when a document approaches the 16 MB limit?',
          senior: true,
        },
        {
          id: 'schema-design-patterns',
          text: 'What are the MongoDB schema design patterns (bucket, computed, subset, extended reference, outlier), and when do you use each?',
          senior: true,
        },
        {
          id: 'model-an-e-commerce-catalog',
          text: 'Design the MongoDB data model for an e-commerce catalog with product variants, inventory and reviews.',
          senior: true,
        },
        {
          id: 'indexes-and-when-to-create-them',
          text: 'What are indexes in MongoDB and when should you create them?',
        },
        {
          id: 'index-types-in-practice',
          text: 'Which MongoDB index types do you use in practice (compound, partial, TTL, sparse, wildcard, text, unique), and for what?',
        },
        { id: 'aggregation-pipeline', text: 'What is the MongoDB aggregation pipeline?' },
        {
          id: 'optimise-a-slow-aggregation-pipeline',
          text: 'How do you optimise a slow aggregation pipeline (stage order, `$lookup` cost, `$facet`, `allowDiskUse`)?',
          senior: true,
        },
        {
          id: 'paginate-a-large-collection',
          text: 'How do you paginate a large MongoDB collection, and why does `skip()` get slow?',
          senior: true,
        },
        {
          id: 'slow-query-read-explain-output',
          text: 'A MongoDB query became slow as the data grew. How do you use `explain("executionStats")` to find and fix the problem?',
          senior: true,
        },
        {
          id: 'transactions-and-when-to-use-them',
          text: 'What is a transaction in MongoDB, and when would you use it?',
          senior: true,
        },
        {
          id: 'roll-back-updates-across-3-collections',
          text: 'Suppose you need to update three MongoDB collections as part of a single business operation. If the third update fails, how would you ensure that the first two updates are rolled back?',
          senior: true,
        },
        {
          id: 'duplicate-inserts-despite-an-exists-check',
          text: 'Duplicate documents are being created even though the code checks whether one exists before inserting. Why, and how do you fix it?',
          senior: true,
        },
        { id: 'replica-sets', text: 'What is a replica set in MongoDB?' },
        {
          id: 'write-concern-read-concern-read-preference',
          text: 'What are write concern, read concern and read preference, and what can go wrong when you read from secondaries?',
          senior: true,
        },
        {
          id: 'change-streams-and-resume-tokens',
          text: 'What are MongoDB change streams, and how do you use them reliably (resume tokens)?',
          senior: true,
        },
        { id: 'how-sharding-works', text: 'What is sharding in MongoDB?' },
        {
          id: 'choose-a-shard-key-avoid-hot-shards',
          text: 'How do you choose a shard key, and why does a monotonically increasing key create a hot shard?',
          senior: true,
        },
        {
          id: 'mongoose-and-its-advantages',
          text: 'What is Mongoose and what are its advantages?',
        },
        {
          id: 'slow-populate-vs-lookup',
          text: 'Mongoose `populate()` on a list endpoint is slow. What is happening, and when should you use `$lookup` instead?',
          senior: true,
        },
        {
          id: 'serverless-exhausting-connections',
          text: 'Your serverless functions keep exhausting MongoDB connections. Why, and how do you fix it?',
          senior: true,
        },
        {
          id: 'schema-changes-without-downtime',
          text: 'How do you change a MongoDB schema without downtime (schema versioning, lazy migration vs backfill)?',
          senior: true,
        },
        {
          id: 'working-set-exceeds-ram',
          text: 'The working set no longer fits in RAM and MongoDB latency spikes. How do you confirm it and what are your options?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-caching',
      icon: 'ti-database-import',
      title: 'Caching, Redis & Queues',
      color: '#DC2626',
      bg: '#FEE2E2',
      questions: [
        {
          id: 'caching-strategies',
          text: 'What are common caching strategies? (Cache-Aside, Write-Through, Write-Behind)',
        },
        {
          id: 'cache-invalidation-strategies',
          text: 'What is cache invalidation and what are the strategies?',
          senior: true,
        },
        {
          id: 'redis-and-its-use-cases',
          text: 'What is Redis and what are its use cases in Node.js?',
        },
        {
          id: 'implement-a-redis-cache',
          text: 'How do you implement a Redis cache in a Node.js application?',
        },
        {
          id: 'rate-limiting-with-redis',
          text: 'How do you implement rate limiting using Redis?',
          senior: true,
        },
        {
          id: 'distributed-locks-with-redis',
          text: 'How do you implement distributed locks with Redis?',
          senior: true,
        },
        {
          id: 'redis-pub-sub-vs-streams',
          text: 'What is the difference between Redis Pub/Sub and Redis Streams?',
          senior: true,
        },
        {
          id: 'bullmq-job-queues-on-redis',
          text: 'What is BullMQ and how does it use Redis for job queues?',
        },
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
        {
          id: 'profile-and-debug-performance-issues',
          text: 'How do you profile and debug Node.js performance issues?',
          senior: true,
        },
        {
          id: 'performance-optimization-techniques',
          text: 'What techniques do you use to optimize Node.js application performance?',
        },
        {
          id: 'database-connection-pooling',
          text: 'How does connection pooling work in Node.js database connections?',
          senior: true,
        },
        {
          id: 'offset-vs-cursor-pagination',
          text: 'How do you implement pagination — offset vs cursor-based?',
          senior: true,
        },
        {
          id: 'http-response-compression',
          text: 'What is HTTP response compression and how do you enable it?',
        },
      ],
    },
    {
      id: 'nodejs-clustering',
      icon: 'ti-network',
      title: 'Clustering & Scaling',
      color: '#0891B2',
      bg: '#E0F2FE',
      questions: [
        {
          id: 'clustering-and-why-it-is-needed',
          text: 'What is clustering in Node.js and why is it needed?',
        },
        {
          id: 'implement-the-cluster-module',
          text: 'How do you implement clustering in Node.js using the cluster module?',
        },
        {
          id: 'how-cluster-distributes-requests',
          text: 'How does the primary process distribute requests among workers in cluster mode?',
          senior: true,
        },
        {
          id: 'share-state-between-workers',
          text: 'How do you share state between cluster workers?',
          senior: true,
        },
        {
          id: 'pm2-process-management',
          text: 'What is PM2 and how does it manage Node.js processes?',
        },
      ],
    },
    {
      id: 'nodejs-testing',
      icon: 'ti-test-pipe',
      title: 'Testing',
      color: '#059669',
      bg: '#D1FAE5',
      questions: [
        {
          id: 'unit-vs-integration-vs-end-to-end-tests',
          text: 'What is the difference between unit, integration, and end-to-end tests?',
        },
        {
          id: 'node-js-testing-frameworks',
          text: 'What testing frameworks are commonly used in Node.js?',
        },
        { id: 'test-async-code-in-jest', text: 'How do you test asynchronous code in Jest?' },
        { id: 'mock-modules-in-jest', text: 'How do you mock modules and dependencies in Jest?' },
        {
          id: 'test-express-routes-with-supertest',
          text: 'How do you test Express routes using Supertest?',
        },
        {
          id: 'measure-test-coverage',
          text: 'What is test coverage and how do you measure it in Node.js?',
        },
        {
          id: 'testing-strategy-for-a-node-api',
          text: 'What is your testing strategy for a Node.js API service: what belongs in unit, integration and contract tests?',
          senior: true,
        },
        {
          id: 'real-database-vs-mocks-in-tests',
          text: 'Should integration tests use a real database? Compare Testcontainers, in-memory databases and mocks.',
          senior: true,
        },
        {
          id: 'testing-time-retries-and-timers',
          text: 'How do you test code that depends on time, retries and timers?',
        },
        {
          id: 'testing-queue-consumers-and-jobs',
          text: 'How do you test message-queue consumers and background jobs (BullMQ, SQS, Kafka)?',
          senior: true,
        },
        {
          id: 'contract-testing-pact-or-openapi',
          text: 'How do you use contract testing (Pact or OpenAPI) between an Angular app and a Node API?',
          senior: true,
        },
        {
          id: 'load-testing-with-k6-reading-p95-p99',
          text: 'How do you load test an API with k6, and how do you read p95 and p99 latency results?',
          senior: true,
        },
        {
          id: 'slow-flaky-backend-suite-in-ci',
          text: 'Your backend test suite is slow and flaky in CI. How do you fix it?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-devops',
      icon: 'ti-brand-docker',
      title: 'CI/CD & DevOps',
      color: '#0369A1',
      bg: '#E0F2FE',
      questions: [
        { id: 'ci-cd-and-the-tools-you-used', text: 'What is CI/CD and what tools have you used?' },
        { id: 'docker-with-node-js', text: 'What is Docker and how is it used with Node.js?' },
        {
          id: 'write-a-dockerfile-for-node-js',
          text: 'What is a Dockerfile and how do you write one for Node.js?',
        },
        {
          id: 'what-kubernetes-solves',
          text: 'What is Kubernetes and what problem does it solve?',
        },
        {
          id: 'reverse-proxies-and-nginx',
          text: 'What is a reverse proxy and why is Nginx used with Node.js?',
        },
        {
          id: 'manage-environment-variables-securely',
          text: 'How do you manage environment variables securely in Node.js?',
        },
        {
          id: 'health-checks',
          text: 'What are health checks and how do you implement them in Node.js?',
        },
        {
          id: 'blue-green-vs-canary-vs-rolling',
          text: 'Blue-green vs canary vs rolling deployments: how do you choose?',
          senior: true,
        },
        {
          id: 'feature-flags-benefits-and-risks',
          text: 'How do feature flags help you release safely, and what are the risks?',
          senior: true,
        },
        {
          id: 'infrastructure-as-code-terraform-vs-cdk',
          text: 'What is Infrastructure as Code, and how do Terraform and AWS CDK compare?',
          senior: true,
        },
        {
          id: 'small-secure-production-docker-image',
          text: 'How do you build a small, secure production Docker image for Node.js (multi-stage builds, non-root user, scanning)?',
          senior: true,
        },
        {
          id: 'kubernetes-probes-and-autoscaling',
          text: 'What are Kubernetes liveness, readiness and startup probes, and how does autoscaling work?',
          senior: true,
        },
        {
          id: 'slis-slos-and-error-budgets',
          text: 'What are SLIs, SLOs and error budgets, and how do they change how a team works?',
          senior: true,
        },
        {
          id: 'full-stack-ci-cd-pipeline-pr-to-prod',
          text: 'What does a good CI/CD pipeline for a full-stack app look like, from pull request to production?',
          senior: true,
        },
        {
          id: 'config-across-environments-without-drift',
          text: 'How do you manage configuration across dev, staging and production without drift?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-aws-cloud',
      icon: 'ti-cloud',
      title: 'AWS & Cloud',
      color: '#D97706',
      bg: '#FEF3C7',
      questions: [
        {
          id: 'ec2-vs-ecs-fargate-vs-lambda',
          text: 'How do you choose between EC2, ECS on Fargate, and Lambda for a Node.js service?',
          senior: true,
        },
        {
          id: 'host-an-angular-spa-on-s3-cloudfront',
          text: 'How do you host an Angular SPA on S3 and CloudFront, including deep links, caching and invalidation on deploy?',
          senior: true,
        },
        {
          id: 'iam-roles-and-least-privilege',
          text: 'What are IAM roles and policies, and how do you apply least privilege to a service?',
          senior: true,
        },
        {
          id: 'rds-aurora-vs-dynamodb',
          text: 'RDS/Aurora vs DynamoDB: how do you choose, and how do you model data for DynamoDB?',
          senior: true,
        },
        {
          id: 'sqs-vs-sns-vs-eventbridge',
          text: 'SQS vs SNS vs EventBridge: when do you use each?',
          senior: true,
        },
        {
          id: 'direct-s3-uploads-with-presigned-urls',
          text: 'How do you let users upload large files directly to S3 with presigned URLs?',
          senior: true,
        },
        {
          id: 'secrets-manager-vs-parameter-store',
          text: 'How do you manage secrets and configuration on AWS (Secrets Manager vs Parameter Store)?',
        },
        {
          id: 'vpcs-subnets-and-nat-gateways',
          text: 'What is a VPC, and how do public and private subnets, security groups and NAT gateways fit together?',
        },
        {
          id: 'high-availability-and-disaster-recovery',
          text: 'How do you design for high availability and disaster recovery on AWS (multi-AZ, multi-region, RPO and RTO)?',
          senior: true,
        },
        {
          id: 'monitoring-and-alarms-in-cloudwatch',
          text: 'How do you monitor a production service with CloudWatch, and what would you alarm on?',
          senior: true,
        },
        {
          id: 'lambda-cold-starts',
          text: 'What are Lambda cold starts, and how do you reduce them?',
          senior: true,
        },
        {
          id: 'keep-the-aws-bill-under-control',
          text: 'How do you keep an AWS bill under control?',
          senior: true,
        },
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
        {
          id: 'common-design-patterns-in-node-js',
          text: 'What are design patterns and which ones are commonly used in Node.js?',
        },
        {
          id: 'observer-pattern',
          text: 'What is the Observer pattern and how is it implemented in Node.js?',
        },
        {
          id: 'dependency-injection',
          text: 'What is Dependency Injection and how is it used in Node.js?',
        },
        { id: 'repository-pattern', text: 'What is the Repository Pattern?' },
        {
          id: 'cqrs',
          text: 'What is CQRS (Command Query Responsibility Segregation)?',
          senior: true,
        },
        { id: 'event-sourcing', text: 'What is Event Sourcing?', senior: true },
      ],
    },
    {
      id: 'nodejs-microservices',
      icon: 'ti-topology-star',
      title: 'Microservices & Architecture',
      color: '#7C3AED',
      bg: '#EDE9FE',
      questions: [
        {
          id: 'microservices-vs-monolith',
          text: 'What are microservices and how do they differ from a monolithic architecture?',
        },
        {
          id: 'pros-and-cons-of-microservices',
          text: 'What are the main advantages and disadvantages of microservices?',
        },
        {
          id: 'how-microservices-communicate',
          text: 'How do microservices communicate with each other?',
        },
        {
          id: 'sync-vs-async-communication',
          text: 'What is the difference between synchronous and asynchronous communication in microservices?',
          senior: true,
        },
        { id: 'api-gateways', text: 'What is an API Gateway and what problems does it solve?' },
        {
          id: 'circuit-breaker-pattern',
          text: 'What is the Circuit Breaker pattern?',
          senior: true,
        },
        { id: 'saga-pattern', text: 'What is the Saga pattern in microservices?', senior: true },
        {
          id: 'distributed-transactions',
          text: 'How do you handle distributed transactions in a microservices architecture?',
          senior: true,
        },
        {
          id: 'strangler-fig-migration',
          text: 'What is the Strangler Fig pattern for migrating from monolith to microservices?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-distributed-systems',
      icon: 'ti-affiliate',
      title: 'Distributed Systems',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        {
          id: 'cap-theorem-and-pacelc',
          text: 'What is the CAP theorem, and what does PACELC add?',
          senior: true,
        },
        {
          id: 'designing-for-eventual-consistency',
          text: 'Strong vs eventual consistency: how do you design a feature that has to live with eventual consistency?',
          senior: true,
        },
        {
          id: 'transactional-outbox-pattern',
          text: 'What is the transactional outbox pattern, and what problem does it solve?',
          senior: true,
        },
        {
          id: 'exactly-once-myth-idempotent-consumers',
          text: 'Why is exactly-once delivery a myth, and how do you build idempotent consumers?',
          senior: true,
        },
        {
          id: 'preserve-message-ordering',
          text: 'How do you preserve message ordering in a queue or stream (Kafka partitions, SQS FIFO)?',
          senior: true,
        },
        {
          id: 'dead-letter-queues-and-poison-messages',
          text: 'What is a dead-letter queue, and how do you handle poison messages?',
          senior: true,
        },
        {
          id: 'retries-timeouts-and-retry-storms',
          text: 'How do retries, timeouts and backoff interact, and how do you avoid retry storms?',
          senior: true,
        },
        {
          id: 'kafka-vs-rabbitmq-or-sqs',
          text: 'What is the difference between Kafka and a traditional message queue such as RabbitMQ or SQS?',
          senior: true,
        },
        {
          id: 'leader-election-and-distributed-locks',
          text: 'How do you do leader election or distributed locking safely, and what can go wrong?',
          senior: true,
        },
        {
          id: 'trace-a-request-across-services',
          text: 'How do you trace a single request across several services?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-system-design',
      icon: 'ti-sitemap',
      title: 'System Design',
      color: '#9333EA',
      bg: '#F3E8FF',
      questions: [
        {
          id: 'design-a-rate-limiter',
          text: 'How do you design a rate limiter in Node.js?',
          senior: true,
        },
        {
          id: 'design-a-url-shortener',
          text: 'How do you design a URL shortener service?',
          senior: true,
        },
        {
          id: 'design-a-notification-system',
          text: 'How would you design a notification system that sends emails, SMS, and push notifications?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-backend-operations',
      icon: 'ti-bug',
      title: 'Debugging & Real-World Scenarios',
      color: '#0F766E',
      bg: '#CCFBF1',
      questions: [
        {
          id: 'api-slowed-to-30-s-find-the-cause',
          text: 'An API that previously responded quickly is now taking around 30 seconds to complete. How would you debug the issue and identify the root cause?',
          senior: true,
        },
        {
          id: 'feature-from-requirements-to-production',
          text: 'Walk me through your process of taking a new feature from requirement gathering to production deployment.',
          senior: true,
        },
        {
          id: 'cpu-at-100-find-the-blocker',
          text: 'A Node.js service is stuck at 100% CPU and requests are timing out. How do you find what is blocking the event loop?',
          senior: true,
        },
        {
          id: 'intermittent-502-504-behind-a-proxy',
          text: 'Your API intermittently returns 502 or 504 errors behind Nginx or a load balancer. How do you troubleshoot it?',
          senior: true,
        },
        {
          id: 'connection-pool-exhausted',
          text: 'Requests start hanging because the database connection pool is exhausted. How do you diagnose and fix it?',
          senior: true,
        },
        {
          id: 'double-charges-on-retry-idempotency',
          text: 'Customers are charged twice when they retry a payment request. How do you make the API idempotent?',
          senior: true,
        },
        {
          id: 'lost-update-from-concurrent-writes',
          text: 'Two requests update the same record at the same time and one update is lost. How do you prevent this race condition?',
          senior: true,
        },
        {
          id: 'error-spike-after-deploy-respond',
          text: 'A deployment went out and the error rate spiked. Walk through your incident response and rollback.',
          senior: true,
        },
        {
          id: 'logging-metrics-and-tracing',
          text: 'How do you add logging, metrics, and tracing to a Node.js service so production issues are easy to debug?',
          senior: true,
        },
      ],
    },
    {
      id: 'nodejs-coding-round',
      icon: 'ti-terminal-2',
      title: 'Coding Round',
      color: '#6B21A8',
      bg: '#F3E8FF',
      questions: [
        { id: 'implement-promise-all', text: 'Implement `Promise.all` from scratch.' },
        {
          id: 'implement-retry-with-backoff-and-jitter',
          text: 'Implement a retry function with exponential backoff and jitter.',
          senior: true,
        },
        {
          id: 'implement-a-promise-pool',
          text: 'Run a list of async tasks with at most N running at the same time (a promise pool).',
          senior: true,
        },
        {
          id: 'implement-an-lru-cache',
          text: 'Implement an LRU cache with O(1) `get` and `put`.',
          senior: true,
        },
        {
          id: 'implement-an-eventemitter',
          text: 'Implement a simple EventEmitter with `on`, `off`, `once`, and `emit`.',
        },
        {
          id: 'implement-promisify',
          text: 'Implement `promisify` for callback-style (error-first) functions.',
        },
        {
          id: 'implement-token-bucket-middleware',
          text: 'Implement a token-bucket rate limiter as Express middleware.',
          senior: true,
        },
        {
          id: 'write-problem-details-error-middleware',
          text: 'Write Express error-handling middleware that maps domain errors to Problem Details responses and hides internal details in production.',
        },
        {
          id: 'count-word-frequencies-with-streams',
          text: 'Count word frequencies in a very large file using streams.',
          senior: true,
        },
      ],
    },
  ];

  getCategories(): CategoryModel[] {
    return this.categories;
  }

  getTotalQuestions(): number {
    return this.categories.reduce((acc, cat) => acc + cat.questions.length, 0);
  }

  private byId = new Map(
    this.categories.flatMap((cat) =>
      cat.questions.map((q) => [q.id, { question: q, cat }] as const),
    ),
  );

  /** Looks a question up by its stable id. */
  find(id: string): { question: QuestionModel; cat: CategoryModel } | undefined {
    return this.byId.get(id);
  }
}
