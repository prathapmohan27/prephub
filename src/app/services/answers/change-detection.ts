import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'How does Change Detection work in Angular?': {
    summary:
      'Change detection keeps the DOM in sync with component state. Something notifies Angular that state may have changed (with Zone.js: any async event; zoneless: signals, `markForCheck`, template events), then Angular walks the component tree from the root, re-evaluates each template binding, compares it with the previous value, and updates only the DOM nodes whose values changed.',
    details: [
      {
        type: 'paragraph',
        text: 'Angular does not watch your variables. Instead, the compiler turns each template into an update function that knows every binding (`{{ name }}`, `[disabled]="busy"`). Running change detection means calling those update functions and diffing each binding\'s new value against the value stored from last time.',
      },
      { type: 'heading3', text: 'The two halves: trigger and check' },
      {
        type: 'bullets',
        items: [
          '**Trigger** — with Zone.js, Angular patches async APIs (events, `setTimeout`, `Promise`, XHR/fetch) and runs `ApplicationRef.tick()` when the zone becomes stable. In zoneless apps, the trigger is an explicit notification: a signal read in a template changes, `markForCheck()`, a template event handler, `AsyncPipe`, `setInput()`.',
          '**Check** — `tick()` walks the view tree top-down. For each view that needs checking it runs the template update function, compares bindings with `Object.is`-style identity, and patches changed DOM properties/text.',
        ],
      },
      { type: 'heading3', text: 'What actually happens on a click' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-counter',
  template: \`
    <p>Count: {{ count }}</p>              <!-- binding #1 -->
    <button [disabled]="count >= 3" (click)="inc()">+</button>  <!-- binding #2 -->
  \`,
})
export class CounterComponent {
  count = 0;
  inc() { this.count++; }
}
// 1. click → handler runs → count = 1
// 2. Zone.js sees the event task finish → ApplicationRef.tick()
// 3. Update function: binding #1 '0' → '1' changed → text node updated
//                     binding #2 false → false unchanged → DOM untouched`,
      },
      {
        type: 'flow',
        title: 'One change-detection cycle',
        code: `flowchart LR
  E["Event / timer / HTTP<br/>or signal update"]:::client --> N["Angular notified<br/>(Zone.js or scheduler)"]:::network
  N --> T["ApplicationRef.tick()"]:::server
  T --> W["Walk tree top-down<br/>(skip clean OnPush views)"]:::server
  W --> C["Compare each binding<br/>with previous value"]:::highlight
  C --> D["Patch only changed<br/>DOM nodes"]:::db`,
      },
      {
        type: 'bullets',
        items: [
          "Data flows one way (parent → child) in a single pass; that's why changing parent state from a child during checking causes `ExpressionChangedAfterItHasBeenCheckedError` in dev mode (dev mode runs a second verification pass).",
          'Template expressions run on every check — keep them cheap; use pure pipes or `computed()` for derived values.',
          "`OnPush` lets Angular skip whole subtrees whose inputs didn't change; signals let Angular refresh only the views that read a changed signal.",
        ],
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Explain Angular change detection.' },
      {
        type: 'paragraph',
        text: "Change detection is Angular's process for reflecting component state in the DOM. Angular runs it after anything that might change state, checks every template binding top-down through the component tree, and updates the DOM where a value differs. It is unidirectional and synchronous, can be optimized with `OnPush`, and in modern Angular is increasingly driven by signals instead of Zone.js.",
      },
      { type: 'heading3', text: 'Key ideas to explain' },
      {
        type: 'bullets',
        items: [
          "**Unidirectional data flow** — parents are checked before children; a child must not change the parent's already-checked state in the same pass.",
          '**Dev-mode double check** — in development Angular re-checks bindings and throws `ExpressionChangedAfterItHasBeenCheckedError` if a value changed during the cycle.',
          '**Strategies** — `Default` checks the component every cycle; `OnPush` only when inputs change (by reference), an event fires inside it, `markForCheck()` is called, or a consumed signal changes.',
          '**Triggers** — Zone.js (classic) vs zoneless scheduling (signals, `markForCheck`, events).',
          '**Manual control** — `ChangeDetectorRef` (`markForCheck`, `detectChanges`, `detach`, `reattach`).',
        ],
      },
      { type: 'heading3', text: 'The classic error, explained' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-parent',
  template: \`<p>{{ title }}</p> <app-child (ready)="title = 'Ready'" />\`,
})
export class ParentComponent { title = 'Loading'; }

@Component({ selector: 'app-child', template: \`...\` })
export class ChildComponent implements AfterViewInit {
  ready = output<void>();
  ngAfterViewInit() {
    this.ready.emit(); // ❌ changes parent.title AFTER parent's binding was checked
  }
}
// Dev mode: ExpressionChangedAfterItHasBeenCheckedError:
//   Previous value: 'Loading'. Current value: 'Ready'.
// Fix: derive the state differently (signals/computed), set it earlier (ngOnInit),
// or defer it to the next cycle — not by wrapping it in setTimeout blindly.`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Modern, signal-driven component: Angular knows exactly which view to refresh
@Component({
  selector: 'app-cart-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<span>{{ count() }}</span>\`,
})
export class CartBadgeComponent {
  count = inject(CartStore).count; // Signal<number>
}`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: structure the answer as "who triggers it" (Zone.js vs zoneless) and "what it does" (top-down tree walk, binding comparison, minimal DOM updates). Then mention OnPush and signals as the optimizations.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is Change Detection in Angular and how does the mechanism work across component trees?',
      },
      {
        type: 'paragraph',
        text: 'Change detection syncs state to the DOM. Across the tree, Angular starts at the root view and checks views depth-first: each parent updates its bindings (including child inputs) before its children are checked. Default components are always visited; OnPush components and their subtrees are skipped unless marked dirty; with signals, only views that read a changed signal need refreshing.',
      },
      {
        type: 'paragraph',
        text: 'Every component instance owns a view, and views form a tree that mirrors the component tree. `ApplicationRef.tick()` calls `detectChanges` on the root view, which runs its update function, then recurses into each child view. Embedded views from `@if`/`@for` are part of that tree too.',
      },
      { type: 'heading3', text: 'Traversal rules' },
      {
        type: 'numbered',
        items: [
          'Check the parent view: evaluate its bindings, including `[input]` bindings on child component elements (this is when child `ngOnChanges` runs).',
          'Then descend into each child view, in template order.',
          'For an OnPush child: descend only if it is marked dirty (input reference changed, event inside it, `markForCheck()`, `AsyncPipe` emission, or signal change). Otherwise the whole subtree is skipped.',
          'A view that is detached (`cdRef.detach()`) is always skipped.',
          "After children, run the parent's `ngAfterViewChecked`.",
        ],
      },
      {
        type: 'flow',
        title: 'Tree walk with an OnPush subtree',
        code: `flowchart TD
  R["AppComponent (Default)<br/>checked"]:::server --> H["Header (Default)<br/>checked"]:::server
  R --> L["ProductList (OnPush)<br/>inputs unchanged: SKIPPED"]:::external
  R --> C["Cart (OnPush)<br/>marked dirty: checked"]:::highlight
  L --> I1["ProductItem<br/>skipped with parent"]:::external
  L --> I2["ProductItem<br/>skipped with parent"]:::external
  C --> CI["CartItem (Default)<br/>checked"]:::server`,
      },
      { type: 'heading3', text: 'Marking dirty goes UP, checking goes DOWN' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// markForCheck() marks this view AND all its ancestors up to the root as dirty,
// so the next top-down walk is guaranteed to reach this component.
export class CartItemComponent {
  private cdr = inject(ChangeDetectorRef);
  constructor() {
    inject(PriceSocket).updates$.pipe(takeUntilDestroyed()).subscribe(p => {
      this.price = p;
      this.cdr.markForCheck(); // Cart (OnPush) → App: all marked dirty
    });
  }
  price = 0;
}`,
      },
      { type: 'heading3', text: 'Signals change the picture' },
      {
        type: 'paragraph',
        text: 'A template is a reactive consumer of the signals it reads. When such a signal changes, Angular marks that view for refresh and its ancestors as having a descendant to visit — so the walk can reach the component without re-checking unaffected OnPush ancestors. This is the basis of finer-grained, zoneless change detection.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: How does Angular Change Detection work by default (`ChangeDetectionStrategy.Default`) across component trees?',
      },
      {
        type: 'paragraph',
        text: 'With `Default`, every component is checked on every change-detection cycle, regardless of whether its inputs changed. Any async event anywhere (Zone.js) triggers a top-down pass over the whole tree, evaluating every binding in every Default component. It is simple and always correct for mutable data, but costs grow with the number of bindings.',
      },
      { type: 'heading3', text: 'Example: one click, whole tree checked' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-root',
  template: \`
    <app-header />
    <app-table [rows]="rows" />          <!-- 1000 rows, each with bindings -->
    <button (click)="noop()">Click</button>
  \`,
})
export class AppComponent {
  rows = createRows(1000);
  noop() {}
}
// Clicking the button changes nothing, yet Angular evaluates:
//  - all AppComponent bindings
//  - all HeaderComponent bindings
//  - all TableComponent + 1000 RowComponent bindings
// Even a mousemove listener or setInterval anywhere triggers the same full pass.`,
      },
      { type: 'heading3', text: "Mutation works (and that's the trap)" },
      {
        type: 'code',
        lang: 'typescript',
        code: `this.rows[0].name = 'Updated'; // ✅ Default child shows it — bindings are re-read
this.rows.push(newRow);         // ✅ Default child's @for shows the new row
// Switch the child to OnPush and both updates stop appearing,
// because the [rows] reference never changed.`,
      },
      {
        type: 'bullets',
        items: [
          'Order: root first, then depth-first through children in template order.',
          'Each check is cheap (identity comparison), but many components × many bindings × frequent events add up.',
          'Function calls in templates (`{{ total() }}` on a plain method) run on every pass — a common performance issue with Default.',
          "A Default component inside an OnPush parent is only checked when that parent is checked — the parent's strategy gates the subtree.",
          "Default applies to every component that doesn't specify a strategy. The Angular team is steering new code toward OnPush + signals (and zoneless), so check your version's docs for any change to defaults.",
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Pitfall: a high-frequency event (scroll, mousemove, websocket ticks) in a large Default-strategy app can make the whole UI sluggish. Fixes: OnPush, signals, `runOutsideAngular` for listeners that don't affect the UI, or going zoneless.",
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the phrase "dirty marking goes up, checking goes down" captures the tree mechanics in one line — then explain why OnPush prunes subtrees.',
      },
    ],
  },

  'Difference between Default and OnPush Change Detection Strategy': {
    summary:
      '`Default` checks a component on every change-detection cycle. `OnPush` checks it only when: an input reference changes, an event handler in its template (or a child) fires, `markForCheck()` is called (e.g. by `AsyncPipe`), or a signal it reads changes. Otherwise Angular skips it and its whole subtree, which is much faster but requires immutable data.',
    details: [
      {
        type: 'paragraph',
        text: 'OnPush is a contract: "my view only depends on my inputs and my own events/observables/signals, so don\'t check me otherwise". Angular trusts it and skips the subtree — so if you mutate data in place, the UI will not update.',
      },
      { type: 'heading3', text: 'Side by side' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`@for (u of users; track u.id) { <li>{{ u.name }}</li> }\`,
})
export class UserListComponent {
  @Input() users: User[] = [];
}

// In the parent:
this.users.push({ id: 3, name: 'Ravi' });           // ❌ OnPush: not shown (same reference)
this.users = [...this.users, { id: 3, name: 'Ravi' }]; // ✅ new reference → checked
this.users[0].name = 'X';                            // ❌ not shown
this.users = this.users.map(u => u.id === 1 ? { ...u, name: 'X' } : u); // ✅`,
      },
      { type: 'heading3', text: 'What re-checks an OnPush component' },
      {
        type: 'bullets',
        items: [
          'A bound `@Input()`/`input()` gets a new value (compared with `===`).',
          'A DOM event bound in its template (or in a descendant) fires.',
          '`ChangeDetectorRef.markForCheck()` — `AsyncPipe` calls it on each emission.',
          'A signal read in its template changes.',
          'Explicit `detectChanges()` on it.',
          'NOT: `setTimeout`, a subscription assigning a field, a service mutating shared state.',
        ],
      },
      { type: 'heading3', text: 'Comparison' },
      {
        type: 'bullets',
        items: [
          '**Performance**: Default — O(all bindings) each cycle. OnPush — skips unchanged subtrees.',
          '**Data style**: Default tolerates mutation. OnPush needs immutable updates, observables + `async`, or signals.',
          '**Predictability**: OnPush makes data flow explicit; Default "just works" but hides cost.',
          '**Recommendation**: OnPush for (nearly) all components in new code; it pairs naturally with signals and zoneless.',
        ],
      },
      {
        type: 'flow',
        title: 'Should this OnPush component be checked?',
        code: `flowchart TD
  S["Change detection reaches<br/>OnPush component"]:::server --> D{Marked dirty?}
  D -->|"Input ref changed"| Y([Check it]):::highlight
  D -->|"Template event fired"| Y
  D -->|"markForCheck / async pipe"| Y
  D -->|"Read signal changed"| Y
  D -->|"None of these"| N(["Skip it and its subtree"]):::external`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: "my OnPush component doesn\'t update after the HTTP call" — you subscribed and assigned a field. Use the `async` pipe, `toSignal()`, a signal (`this.data.set(x)`), or call `markForCheck()`.',
      },
    ],
  },

  'Where and how do you implement custom change detection (`ChangeDetectionStrategy.OnPush` and `markForCheck()`) in code?':
    {
      summary:
        'Set `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component` decorator. Then make sure every state change reaches the view through an OnPush-friendly path: new input references, template events, the `async` pipe, signals — or, when you update a field from a subscription/callback yourself, inject `ChangeDetectorRef` and call `markForCheck()`.',
      details: [
        {
          type: 'paragraph',
          text: 'OnPush is configured per component. The work is less in the one-line config and more in how the component receives data: anything that changes state outside an input or a template event needs to tell Angular. `markForCheck()` is that "tell" for imperative code.',
        },
        { type: 'heading3', text: '1. Enable OnPush' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-stock-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush, // 👈
  template: \`<span>{{ symbol() }}: {{ price }}</span>\`,
})
export class StockTickerComponent {
  symbol = input.required<string>();
  price = 0;
  private cdr = inject(ChangeDetectorRef);
  private feed = inject(PriceFeed);

  constructor() {
    this.feed.prices$.pipe(takeUntilDestroyed()).subscribe(p => {
      this.price = p;            // plain field update — OnPush won't notice by itself
      this.cdr.markForCheck();   // 👈 mark this view + ancestors dirty for the next cycle
    });
  }
}`,
        },
        { type: 'heading3', text: '2. Prefer approaches that need no manual call' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// a) async pipe — calls markForCheck internally
//    template: {{ price$ | async }}
price$ = inject(PriceFeed).prices$;

// b) signals — template reads are tracked automatically
price = toSignal(inject(PriceFeed).prices$, { initialValue: 0 });
//    template: {{ price() }}

// c) immutable input updates from the parent
//    this.items = [...this.items, newItem];`,
        },
        { type: 'heading3', text: 'Where markForCheck is typically needed' },
        {
          type: 'bullets',
          items: [
            'Manual `subscribe()` callbacks that assign fields.',
            'Third-party library callbacks (charts, maps, websockets) that update component state.',
            '`setTimeout`/`setInterval` updates inside an OnPush component.',
            'A parent mutates an object that the OnPush child displays (better: stop mutating).',
            'Not needed for: template event handlers, `async` pipe, signals, `setInput()`.',
          ],
        },
        {
          type: 'flow',
          title: 'markForCheck in action',
          code: `sequenceDiagram
  participant WS as Price websocket
  participant C as StockTicker (OnPush)
  participant A as Angular scheduler
  WS->>C: new price 101.5
  C->>C: this.price = 101.5
  C->>A: cdr.markForCheck() marks C and ancestors dirty
  A->>C: next tick checks the path to C
  C-->>WS: view shows 101.5`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: say you make OnPush the default for new components (you can set it in `angular.json` schematics) and that in signal-based code you rarely call `markForCheck()` — reaching for it often is a code smell.',
        },
      ],
    },

  'Difference between markForCheck() and detectChanges()': {
    summary:
      "`markForCheck()` doesn't run change detection — it marks the component and all its ancestors as dirty so the NEXT scheduled cycle checks them (needed for OnPush). `detectChanges()` runs change detection immediately and synchronously on this component and its children only, without touching ancestors. Use markForCheck by default; detectChanges for detached views or when you need the DOM updated right now.",
    details: [
      {
        type: 'paragraph',
        text: 'One is a flag, the other is an action. `markForCheck` says "please include me next time"; `detectChanges` says "check me (and below) now". They walk in opposite directions: markForCheck goes up the tree, detectChanges goes down.',
      },
      { type: 'heading3', text: 'Behaviour compared' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class WidgetComponent {
  private cdr = inject(ChangeDetectorRef);
  value = 0;

  updateLater() {
    this.value = 1;
    this.cdr.markForCheck();
    // DOM still shows 0 here — it updates on the next tick (async, batched)
  }

  updateNow(el: HTMLElement) {
    this.value = 2;
    this.cdr.detectChanges();
    // DOM shows 2 immediately — e.g. so we can measure it
    console.log(el.offsetHeight);
  }
}`,
      },
      { type: 'heading3', text: 'A real use for detectChanges: detached views' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-live-chart', template: \`...\` })
export class LiveChartComponent {
  private cdr = inject(ChangeDetectorRef);
  constructor() {
    this.cdr.detach(); // Angular will never check this view automatically
    inject(DataStream).ticks$.pipe(throttleTime(1000), takeUntilDestroyed())
      .subscribe(() => this.cdr.detectChanges()); // we decide: max once per second
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Direction**: markForCheck → current view up to the root. detectChanges → current view down through its children.',
          '**Timing**: markForCheck — deferred to the next cycle (and batched; calling it 100 times is cheap). detectChanges — synchronous, every call runs a check.',
          '**Parents**: detectChanges does not update parent bindings; markForCheck ensures the path from the root is checked.',
          '**Zoneless**: markForCheck also schedules a change-detection run, so it is the standard way to notify Angular.',
          'Calling `detectChanges()` inside lifecycle hooks or during a running check can cause errors or extra work — avoid it as a "fix" for `ExpressionChangedAfterItHasBeenCheckedError`.',
        ],
      },
      {
        type: 'flow',
        title: 'Opposite directions',
        code: `flowchart TB
  Root[AppComponent]:::server --> P[Parent OnPush]:::server
  P --> W["Widget<br/>(calls the method)"]:::highlight
  W --> K[Child]:::server
  W -.->|"markForCheck: marks up"| P
  P -.->|"marks up"| Root
  W ==>|"detectChanges: checks down now"| K`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: "markForCheck schedules, detectChanges executes" — then give one concrete case for each (OnPush + manual subscription vs detached high-frequency view). There is also `ApplicationRef.tick()`, which checks the whole app.',
      },
    ],
  },

  'Can you configure or trigger change detection strategies at the routing or module level in Angular?':
    {
      summary:
        'Not directly — `ChangeDetectionStrategy` is a per-component setting; there is no option on a route or NgModule. What you can do: make routed/layout components OnPush (which effectively gates their whole subtree), configure how change detection is scheduled app-wide (`provideZoneChangeDetection({ eventCoalescing: true })` or `provideZonelessChangeDetection()`), set OnPush as the CLI schematic default, and trigger checks manually via `ChangeDetectorRef` or `ApplicationRef.tick()`.',
      details: [
        {
          type: 'paragraph',
          text: "Strategy belongs to the component because it describes how that component's view depends on data. But since an OnPush component that is skipped also skips all its descendants, choosing OnPush for a route's top-level component has a route-wide effect.",
        },
        { type: 'heading3', text: 'Route-level effect through the routed component' },
        {
          type: 'code',
          lang: 'typescript',
          code: `export const routes: Routes = [
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports-page.component').then(m => m.ReportsPageComponent),
  },
];

@Component({
  selector: 'app-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush, // gates the whole /reports subtree
  template: \`<app-report-grid [data]="data()" />\`,
})
export class ReportsPageComponent {
  data = toSignal(inject(ReportsApi).load(), { initialValue: [] });
}`,
        },
        { type: 'heading3', text: 'Application-level configuration' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Zone-based app: batch multiple events into one CD run
bootstrapApplication(AppComponent, {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })],
});

// Zoneless app: no Zone.js; CD runs on signals/markForCheck/events
bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});

// Legacy NgModule bootstrap equivalent
platformBrowserDynamic().bootstrapModule(AppModule, { ngZoneEventCoalescing: true });`,
        },
        { type: 'heading3', text: 'Making OnPush the default for generated components' },
        {
          type: 'code',
          lang: 'json',
          code: `// angular.json
"schematics": {
  "@schematics/angular:component": {
    "changeDetection": "OnPush"
  }
}
// ng generate component foo → already has ChangeDetectionStrategy.OnPush`,
        },
        {
          type: 'bullets',
          items: [
            'Manual triggers: `ChangeDetectorRef.markForCheck()/detectChanges()/detach()` per component, `ApplicationRef.tick()` for the whole app.',
            '`NgZone.runOutsideAngular()` keeps noisy listeners from triggering CD at all (zone-based apps).',
            "Router events or resolvers don't change a strategy; they just cause state changes that CD then picks up.",
            'Lint rules (e.g. angular-eslint `prefer-on-push-component-change-detection`) can enforce OnPush project-wide.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: answer "no, it is per component" clearly, then show you know the app-level knobs (event coalescing, zoneless) and the practical trick — OnPush on route/layout components plus a schematic default.',
        },
      ],
    },

  'How does Angular detect changes in a zone-less environment?': {
    summary:
      'Without Zone.js, Angular no longer runs change detection after every async task. Instead, specific notifications schedule a run: a signal read in a template changes, `ChangeDetectorRef.markForCheck()` (including via the `async` pipe), an event listener bound in a template fires, `ComponentRef.setInput()`, or views being attached/removed. You enable it with `provideZonelessChangeDetection()`.',
    details: [
      {
        type: 'paragraph',
        text: 'Zone.js answered "when to check" by guessing: any async task might have changed something. Zoneless replaces the guess with explicit signals of change. The "how to check" part — walking the tree and comparing bindings — stays the same, but runs less often and can target only the affected views.',
      },
      { type: 'heading3', text: 'Setup' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// main.ts / app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // stable since Angular 20.2; default for new apps in recent CLI versions
    provideRouter(routes),
  ],
};
// angular.json: remove "zone.js" from "polyfills" (and "zone.js/testing" from test polyfills)`,
      },
      { type: 'heading3', text: 'What does and does not refresh the UI' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-timer',
  template: \`<p>{{ seconds() }} / {{ legacyCount }}</p> <button (click)="reset()">Reset</button>\`,
})
export class TimerComponent {
  seconds = signal(0);
  legacyCount = 0;
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    setInterval(() => {
      this.seconds.update(s => s + 1); // ✅ signal change → CD scheduled
      this.legacyCount++;              // ❌ alone, nothing is scheduled (no Zone.js to notice)
    }, 1000);
  }

  reset() {                            // ✅ template (click) listener → CD scheduled
    this.legacyCount = 0;
  }

  fromCallback(v: number) {
    this.legacyCount = v;
    this.cdr.markForCheck();           // ✅ explicit notification
  }
}`,
      },
      {
        type: 'flow',
        title: 'Zoneless scheduling',
        code: `flowchart LR
  S["signal.set / update"]:::client --> SCH["Change detection<br/>scheduler"]:::highlight
  M["markForCheck / async pipe"]:::client --> SCH
  E["Template event listener"]:::client --> SCH
  I["setInput / view attach"]:::client --> SCH
  SCH -->|"one batched run"| T["ApplicationRef.tick()"]:::server
  T --> V["Refresh dirty views only"]:::db`,
      },
      { type: 'heading3', text: 'Benefits and migration notes' },
      {
        type: 'bullets',
        items: [
          'Smaller bundles and faster startup (no Zone.js), fewer unnecessary CD runs, cleaner stack traces, native `async/await` (no downlevelling for zone patching).',
          'Components should be OnPush-compatible: state changes must go through signals, `async`, template events or `markForCheck()`.',
          'Libraries that relied on `NgZone.onStable`/`onMicrotaskEmpty` need alternatives such as `afterNextRender`.',
          'SSR: Angular uses `PendingTasks` to know when the app is stable; HTTP via `HttpClient` is tracked automatically, custom async work can register with `PendingTasks`.',
          'Tests: use `await fixture.whenStable()` instead of relying on zone-based `fakeAsync` auto-detection.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain the shift from "check after every async task" to "check when notified", list the notification sources, and say the migration path is OnPush + signals first — once an app works with OnPush everywhere, removing Zone.js is usually straightforward.',
      },
    ],
  },
};
