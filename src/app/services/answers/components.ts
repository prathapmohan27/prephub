import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'standalone-components': {
    summary:
      'A standalone component declares its own dependencies in its `imports` array instead of being declared in an NgModule. Since Angular 19 components are standalone by default, so you no longer need NgModules at all: less boilerplate, clearer dependencies, easier lazy loading and better tree-shaking.',
    details: [
      {
        type: 'paragraph',
        text: 'Before standalone, every component had to belong to exactly one NgModule, and the module decided what the template could use. That made it hard to see where a dependency came from and forced "shared modules" that pulled in more code than needed. A standalone component is self-describing: everything its template uses is listed right on the component.',
      },
      { type: 'heading3', text: 'Modern standalone component' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { AvatarComponent } from './avatar.component';

@Component({
  selector: 'app-user-card',
  // standalone: true is the default since Angular 19 — no need to write it
  imports: [RouterLink, CurrencyPipe, AvatarComponent], // exactly what the template uses
  template: \`
    <app-avatar [src]="user().photo" />
    <a [routerLink]="['/users', user().id]">{{ user().name }}</a>
    <span>{{ user().balance | currency }}</span>
  \`,
})
export class UserCardComponent {
  user = input.required<User>();
}`,
      },
      { type: 'heading3', text: 'Bootstrapping and lazy loading without modules' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// main.ts — replaces platformBrowserDynamic().bootstrapModule(AppModule)
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});

// app.routes.ts — lazy-load a single component, no feature module needed
export const routes: Routes = [
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) },
  { path: 'shop', loadChildren: () => import('./shop/shop.routes').then(m => m.SHOP_ROUTES) },
];`,
      },
      { type: 'heading3', text: 'Advantages' },
      {
        type: 'bullets',
        items: [
          '**Less boilerplate** — no NgModule declarations/exports to keep in sync.',
          '**Explicit dependencies** — reading one file tells you what the template can use.',
          '**Finer lazy loading** — `loadComponent` lazy-loads one component; no wrapper module.',
          '**Better tree-shaking** — no shared module importing everything "just in case".',
          '**Simpler testing** — `TestBed.configureTestingModule({ imports: [MyComponent] })`.',
          "**Interop** — standalone components can be imported into NgModules, and NgModules (e.g. a library module) can be added to a standalone component's `imports`.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention the migration path — `ng generate @angular/core:standalone-migration` converts an existing app step by step — and that modules still work, so teams can migrate incrementally.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: How to use BComponent inside AComponent?' },
      {
        type: 'paragraph',
        text: "Add `BComponent` to `AComponent`'s `imports` array (standalone) and use B's selector, e.g. `<app-b />`, in A's template. In the legacy NgModule setup, both must be declared in (or B exported from) a module that A's module can see. Data flows down via inputs and up via outputs.",
      },
      {
        type: 'paragraph',
        text: "Angular resolves a selector in a template only if the component is in that template's compilation scope. For standalone components, the scope is the component's own `imports`. For module-based components, it is the declaring NgModule's declarations plus whatever its imported modules export.",
      },
      { type: 'heading3', text: 'Standalone (modern)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// b.component.ts
@Component({
  selector: 'app-b',
  template: \`<p>Hello {{ name() }}</p> <button (click)="greet.emit(name())">Greet</button>\`,
})
export class BComponent {
  name = input('guest');          // data in
  greet = output<string>();       // event out
}

// a.component.ts
@Component({
  selector: 'app-a',
  imports: [BComponent],          // 👈 makes <app-b> known in this template
  template: \`
    <app-b [name]="user" (greet)="onGreet($event)" />
  \`,
})
export class AComponent {
  user = 'Asha';
  onGreet(n: string) { console.log('greeted', n); } // logs: greeted Asha
}`,
      },
      { type: 'heading3', text: 'Legacy NgModule' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Same module: declare both
@NgModule({ declarations: [AComponent, BComponent] })
export class FeatureModule {}

// Different modules: B's module must EXPORT it, A's module must IMPORT that module
@NgModule({ declarations: [BComponent], exports: [BComponent] })
export class SharedModule {}

@NgModule({ declarations: [AComponent], imports: [SharedModule] })
export class FeatureModule {}`,
      },
      { type: 'heading3', text: 'Other ways to render B inside A' },
      {
        type: 'bullets',
        items: [
          'Dynamically: `<ng-container *ngComponentOutlet="BComponent; inputs: { name: \'x\' }" />` or `viewContainerRef.createComponent(BComponent)`.',
          'Lazily with `@defer`: `@defer (on viewport) { <app-b /> }` — B is split into its own chunk.',
          "Through the router: B as a child route rendered in A's `<router-outlet>`.",
          'A can get a reference to B with `viewChild(BComponent)` to call its public methods.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common error: "\'app-b\' is not a known element" — you forgot to add B to `imports` (standalone) or to export/import it via the module. Also watch for circular imports if B also imports A; use `forwardRef` or restructure.',
      },
    ],
  },

  'lifecycle-hooks-order-and-purpose': {
    summary:
      'Order: constructor → `ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked`; then on every change detection `ngOnChanges` (if inputs changed) → `ngDoCheck` → `ngAfterContentChecked` → `ngAfterViewChecked`; finally `ngOnDestroy`. The "Init" hooks run once, the "Checked" hooks run every cycle.',
    details: [
      {
        type: 'paragraph',
        text: "The order follows what Angular is doing: it first sets inputs (OnChanges), lets the component initialize (OnInit), then processes projected content that came from the parent (AfterContent*), then renders and checks the component's own view including child components (AfterView*). Parent and child hooks interleave because child views are checked during the parent's view check.",
      },
      { type: 'heading3', text: 'Purpose of each hook' },
      {
        type: 'bullets',
        items: [
          '`ngOnChanges(changes: SimpleChanges)` — whenever a template-bound input gets a new reference/value. Gets `previousValue`, `currentValue`, `firstChange`. Not called if the component has no inputs.',
          '`ngOnInit()` — once. Fetch data, set up subscriptions that depend on inputs.',
          "`ngDoCheck()` — every CD run on this component. Detect changes Angular can't (e.g. a mutated array) using `KeyValueDiffers`/`IterableDiffers`.",
          '`ngAfterContentInit()` — once, after `<ng-content>` children are projected. `@ContentChild` results are available.',
          '`ngAfterContentChecked()` — after every check of projected content.',
          '`ngAfterViewInit()` — once, after the view and all child views are created. `@ViewChild` results are available; safe to touch the DOM.',
          '`ngAfterViewChecked()` — after every check of the view. Avoid changing bound state here (causes `ExpressionChangedAfterItHasBeenCheckedError`).',
          '`ngOnDestroy()` — once, before the instance is removed. Cleanup.',
        ],
      },
      { type: 'heading3', text: 'Seeing the order: parent with a child' },
      {
        type: 'code',
        lang: 'text',
        code: `// Parent template: <app-child [value]="x" />   (all hooks log their name)
Parent constructor
Child  constructor          // child created while parent's view is being created
Parent ngOnChanges          // only if Parent has bound inputs
Parent ngOnInit
Parent ngDoCheck
Parent ngAfterContentInit
Parent ngAfterContentChecked
Child  ngOnChanges          // child inputs set while parent's view is checked
Child  ngOnInit
Child  ngDoCheck
Child  ngAfterContentInit
Child  ngAfterContentChecked
Child  ngAfterViewInit
Child  ngAfterViewChecked
Parent ngAfterViewInit      // parent's view is "done" only after its children
Parent ngAfterViewChecked

// On a later change detection where x changed:
Parent ngDoCheck → Parent ngAfterContentChecked → Child ngOnChanges → Child ngDoCheck
→ Child ngAfterContentChecked → Child ngAfterViewChecked → Parent ngAfterViewChecked

// When removed: Child ngOnDestroy, Parent ngOnDestroy (children are destroyed first)`,
      },
      {
        type: 'flow',
        title: 'Once vs every cycle',
        code: `flowchart LR
  subgraph Once
    I1[ngOnInit]:::server
    I2[ngAfterContentInit]:::server
    I3[ngAfterViewInit]:::server
    D[ngOnDestroy]:::security
  end
  subgraph Every["Every change detection"]
    E1["ngOnChanges (if inputs changed)"]:::highlight
    E2[ngDoCheck]
    E3[ngAfterContentChecked]
    E4[ngAfterViewChecked]
  end`,
      },
      { type: 'heading3', text: 'Render hooks (modern)' },
      {
        type: 'paragraph',
        text: '`afterNextRender()` and `afterEveryRender()` (named `afterRender` before Angular 20) are functions you call in an injection context. They run after Angular has updated the DOM for the whole app, only in the browser, which makes them the preferred place for DOM measurement or third-party DOM libraries, especially with SSR.',
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfalls: `ngOnChanges` does not fire when you mutate an input object in place (same reference) or when you set an input programmatically on an instance — only on template binding changes (or `setInput()`). Heavy logic in `ngDoCheck`/`*Checked` hooks runs on every cycle and hurts performance.',
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Explain Angular lifecycle hooks' },
      {
        type: 'paragraph',
        text: "Lifecycle hooks are methods Angular calls at key moments of a component or directive's life: `ngOnChanges` (inputs changed), `ngOnInit` (once, after first inputs), `ngDoCheck`, the content/view init and checked hooks, and `ngOnDestroy` (cleanup). Modern Angular adds `afterNextRender`/`afterEveryRender` and `DestroyRef`, and signals reduce the need for many hooks.",
      },
      { type: 'heading3', text: 'The hooks at a glance' },
      {
        type: 'bullets',
        items: [
          '`constructor` — not a hook; DI only. Inputs are not set yet.',
          '`ngOnChanges(changes)` — when a bound input changes (before `ngOnInit` the first time).',
          '`ngOnInit` — once, after the first `ngOnChanges`. Initialization that needs inputs.',
          '`ngDoCheck` — every change-detection run; for custom change detection. Use sparingly.',
          '`ngAfterContentInit` / `ngAfterContentChecked` — projected content (`<ng-content>`) is ready / checked.',
          "`ngAfterViewInit` / `ngAfterViewChecked` — the component's own view and child views are ready / checked; `@ViewChild` queries are set.",
          '`ngOnDestroy` — just before removal: unsubscribe, clear timers, detach listeners.',
        ],
      },
      { type: 'heading3', text: 'Example' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-chart', template: \`<canvas #canvas></canvas>\` })
export class ChartComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @Input() data: number[] = [];
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private timer?: ReturnType<typeof setInterval>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) this.chart?.update(this.data);
  }
  ngOnInit() {
    this.timer = setInterval(() => this.refresh(), 30_000); // inputs available here
  }
  ngAfterViewInit() {
    this.chart = new Chart(this.canvas.nativeElement, this.data); // DOM ready here
  }
  ngOnDestroy() {
    clearInterval(this.timer);
    this.chart?.destroy();
  }
}`,
      },
      { type: 'heading3', text: 'Modern equivalents' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ChartComponent {
  data = input<number[]>([]);
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    // Runs once after the first render — browser only (skipped on the server in SSR)
    afterNextRender(() => { /* create the chart with this.canvas().nativeElement */ });

    // Reacts to input changes — replaces most ngOnChanges logic
    effect(() => console.log('data changed', this.data()));

    // Cleanup without ngOnDestroy
    inject(DestroyRef).onDestroy(() => console.log('destroyed'));
  }
}`,
      },
      {
        type: 'flow',
        title: 'Component lifecycle',
        code: `flowchart TD
  C[constructor]:::external --> OC[ngOnChanges]:::highlight
  OC --> OI[ngOnInit]:::server
  OI --> DC[ngDoCheck]
  DC --> ACI["ngAfterContentInit (once)"]:::server
  ACI --> ACC[ngAfterContentChecked]
  ACC --> AVI["ngAfterViewInit (once)"]:::server
  AVI --> AVC[ngAfterViewChecked]
  AVC -->|"next change detection"| OC2["ngOnChanges (if inputs changed)"]:::highlight
  OC2 --> DC
  AVC -->|"removed from DOM"| OD[ngOnDestroy]:::security`,
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the purpose of ngOnInit() in Angular components?',
      },
      {
        type: 'paragraph',
        text: "`ngOnInit` runs once, after Angular has set the component's inputs for the first time (after the first `ngOnChanges`). It is the place for initialization logic that depends on inputs — like loading data — keeping the constructor limited to dependency injection.",
      },
      {
        type: 'paragraph',
        text: 'When the constructor runs, Angular has only created the class instance; bound inputs such as `[userId]` have not been assigned yet. By the time `ngOnInit` runs, they have. That ordering is the whole reason the hook exists.',
      },
      { type: 'heading3', text: 'Constructor vs ngOnInit' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-profile', template: \`{{ user?.name }}\` })
export class ProfileComponent implements OnInit {
  @Input() userId!: string;
  private api = inject(UserApi); // DI belongs in the constructor / field initializers
  user?: User;

  constructor() {
    console.log(this.userId); // undefined — input not set yet
  }

  ngOnInit() {
    console.log(this.userId); // '42' — input available
    this.api.getUser(this.userId).subscribe(u => (this.user = u));
  }
}
// <app-profile userId="42" />`,
      },
      { type: 'heading3', text: 'Typical uses' },
      {
        type: 'bullets',
        items: [
          'Fetching initial data based on inputs or route params.',
          'Setting up subscriptions or form controls that depend on input values.',
          'Testability: logic in `ngOnInit` runs on the first `fixture.detectChanges()`, so tests can set inputs first.',
          'It runs only once — if an input changes later, `ngOnInit` will not re-run; use `ngOnChanges`, a setter, or a signal input with `computed`/`effect`.',
          '`@ViewChild` elements are not ready yet in `ngOnInit` (unless `{ static: true }`) — use `ngAfterViewInit`.',
        ],
      },
      { type: 'heading3', text: 'Modern alternative with signals' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ProfileComponent {
  userId = input.required<string>();
  private api = inject(UserApi);

  // Re-fetches automatically when userId changes — no ngOnInit/ngOnChanges needed
  user = rxResource({
    params: () => this.userId(),
    stream: ({ params: id }) => this.api.getUser(id),
  });
}`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say "constructor for DI, ngOnInit for initialization that needs inputs", then add that it runs only once — which is why data that must react to input changes needs a different approach. (`rxResource`/`resource` are newer APIs — check their status in your Angular version.)',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Does `ngOnChanges` execute every time or only when `@Input()` properties change? Does it execute before `ngOnInit()`?',
      },
      {
        type: 'paragraph',
        text: 'Only when a template-bound `@Input()` receives a new value (compared by reference with `===`) — not on every change detection. Yes, the first call happens before `ngOnInit()` (with `firstChange: true`), and only if the component has at least one bound input. Mutating an object input in place does not trigger it.',
      },
      {
        type: 'paragraph',
        text: 'During change detection, Angular evaluates each input binding in the parent template and compares the new value with the previous one. If they differ by identity, it updates the input and collects the change in a `SimpleChanges` object; after processing the bindings it calls `ngOnChanges` once with all changes for that cycle.',
      },
      { type: 'heading3', text: 'When it fires and when it does not' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({ selector: 'app-child', template: \`{{ user.name }}\` })
export class ChildComponent implements OnChanges, OnInit {
  @Input() user!: { name: string };
  @Input() count = 0;

  ngOnChanges(changes: SimpleChanges) {
    for (const [key, c] of Object.entries(changes)) {
      console.log(key, c.previousValue, '→', c.currentValue, 'first?', c.firstChange);
    }
  }
  ngOnInit() { console.log('init'); }
}

// Parent: <app-child [user]="user" [count]="count" />
// First render logs:
//   user undefined → {name:'A'} first? true
//   count undefined → 0 first? true      (default value is NOT the "previous" for bindings)
//   init                                  ← ngOnChanges ran BEFORE ngOnInit

this.count++;                    // ✅ ngOnChanges: count 0 → 1
this.user = { name: 'B' };       // ✅ new reference → fires
this.user.name = 'C';            // ❌ same reference → no ngOnChanges (but view still updates in Default CD)`,
      },
      { type: 'heading3', text: 'Rules to remember' },
      {
        type: 'bullets',
        items: [
          'Called only for inputs that are **bound in a template** (or set via `ComponentRef.setInput()`). Assigning `componentRef.instance.x = 1` directly does not call it.',
          'Not called at all if the component has no inputs — so `ngOnInit` is then the first hook.',
          'Several inputs changing in one cycle → a single `ngOnChanges` call with multiple keys.',
          'Change check is by reference (`===`): to react to deep mutations use immutable updates, or `ngDoCheck` with a differ.',
          'An input setter (`@Input() set user(v) {...}`) runs per input and also only on value changes.',
        ],
      },
      { type: 'heading3', text: 'With signal inputs' },
      {
        type: 'code',
        lang: 'typescript',
        code: `export class ChildComponent {
  user = input.required<User>();
  count = input(0);

  // Derived values replace most ngOnChanges logic
  label = computed(() => \`\${this.user().name} (\${this.count()})\`);

  constructor() {
    effect(() => console.log('count is now', this.count())); // side-effect on change
  }
}
// ngOnChanges still works with signal inputs, but computed/effect are the idiomatic replacement.`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: "Classic bug: pushing into an array input (`items.push(x)`) and expecting the child's `ngOnChanges` (or an OnPush child) to react. Create a new array instead: `items = [...items, x]`.",
      },
    ],
  },

  'content-projection-and-viewchild': {
    summary:
      "Content projection lets a parent pass markup into a child, which renders it where it places `<ng-content>` (optionally with `select` slots). `ViewChild`/`viewChild()` queries elements or components in a component's OWN template, while `ContentChild`/`contentChild()` queries the projected content. View queries resolve in `ngAfterViewInit`, content queries in `ngAfterContentInit`.",
    details: [
      {
        type: 'paragraph',
        text: 'Think of a card component: the card owns its frame (header, border), but the user of the card decides what goes inside. The card\'s own template is its "view"; whatever the parent places between `<app-card>` tags is its "content". Angular has separate query APIs for each.',
      },
      { type: 'heading3', text: 'Single and multi-slot projection' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-card',
  template: \`
    <header><ng-content select="[card-title]" /></header>
    <section><ng-content /></section>          <!-- default slot: everything else -->
    <footer><ng-content select="app-card-actions" /></footer>
  \`,
})
export class CardComponent {}

// Usage
// <app-card>
//   <h2 card-title>Invoice #42</h2>
//   <p>Total: ₹1,200</p>
//   <app-card-actions><button>Pay</button></app-card-actions>
// </app-card>`,
      },
      { type: 'heading3', text: 'ViewChild vs ContentChild' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-tabs',
  template: \`
    <input #search placeholder="Filter tabs" />
    <ng-content />
  \`,
})
export class TabsComponent {
  // Modern signal queries
  search = viewChild.required<ElementRef<HTMLInputElement>>('search'); // own template
  tabs = contentChildren(TabComponent);                                 // projected <app-tab>s

  constructor() {
    afterNextRender(() => this.search().nativeElement.focus());
    effect(() => console.log('tab count', this.tabs().length)); // updates if tabs are added
  }
}

// Legacy decorator equivalents
// @ViewChild('search') search!: ElementRef;           → available in ngAfterViewInit
// @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>; → ngAfterContentInit`,
      },
      {
        type: 'flow',
        title: 'Which query sees what',
        code: `flowchart LR
  P["Parent template<br/>app-tabs + app-tab children"]:::client -->|"projected content"| C["contentChild / contentChildren"]:::highlight
  T["app-tabs own template<br/>input #search"]:::server -->|"view"| V["viewChild / viewChildren"]:::highlight
  C --> CI["ready in ngAfterContentInit"]
  V --> VI["ready in ngAfterViewInit"]`,
      },
      {
        type: 'bullets',
        items: [
          "Projected content is created and owned by the parent — it is change-detected with the parent and its bindings use the parent's context.",
          '`<ng-content>` always instantiates the content, even if wrapped in `@if (false)`; for conditional/lazy content, project an `<ng-template>` instead.',
          '`{ static: true }` (decorator only) resolves a ViewChild before `ngOnInit`, if it is not inside `@if`/`@for`.',
          "`read` option: `viewChild('ref', { read: ViewContainerRef })` gets a different token from the same element.",
          'Use `ngProjectAs` to make an element match a `select` slot it otherwise would not.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the key sentence is "ViewChild = my template, ContentChild = what my parent passed in". Then mention timing (AfterViewInit vs AfterContentInit) and the signal-based `viewChild()`/`contentChildren()` APIs.',
      },
    ],
  },

  'ng-content-vs-ng-template': {
    summary:
      '`<ng-content>` is a placeholder that projects content the parent passes in — it is always rendered once, eagerly, and the child cannot repeat or delay it. `<ng-template>` defines a block of markup that is NOT rendered until code (`*ngTemplateOutlet`, `ViewContainerRef`, a structural directive) instantiates it — zero, one or many times, optionally with context data.',
    details: [
      {
        type: 'paragraph',
        text: 'ng-content answers "where does the parent\'s content go?". ng-template answers "here is a reusable blueprint — render it when and where I decide". Many advanced components combine them: the parent projects an `<ng-template>`, and the child renders it with its own data.',
      },
      { type: 'heading3', text: 'ng-content — static projection' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- panel.component.html -->
<div class="panel">
  <ng-content select="[title]" />
  <ng-content />
</div>

<!-- usage -->
<app-panel>
  <h3 title>Settings</h3>
  <p>Rendered once, exactly here.</p>
</app-panel>`,
      },
      { type: 'heading3', text: 'ng-template — render on demand, with context' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-list',
  imports: [NgTemplateOutlet],
  template: \`
    @for (item of items(); track item.id) {
      <!-- render the caller's template once per item, passing data in -->
      <ng-container *ngTemplateOutlet="itemTpl() ?? defaultTpl; context: { $implicit: item, index: $index }" />
    } @empty {
      <p>No items</p>
    }
    <ng-template #defaultTpl let-item>{{ item.name }}</ng-template>
  \`,
})
export class ListComponent<T extends { id: number; name: string }> {
  items = input<T[]>([]);
  itemTpl = contentChild<TemplateRef<unknown>>('item');
}

// usage — the parent decides HOW each row looks; the list decides WHEN/how many
// <app-list [items]="users">
//   <ng-template #item let-user let-i="index">{{ i + 1 }}. <b>{{ user.name }}</b></ng-template>
// </app-list>`,
      },
      { type: 'heading3', text: 'Comparison' },
      {
        type: 'bullets',
        items: [
          '**Rendering**: ng-content — always, once. ng-template — only when instantiated, any number of times.',
          '**Lifecycle**: projected content is created even if the child hides the slot (e.g. inside `@if (false)`), so its components initialize anyway. A template is created lazily.',
          "**Data**: ng-content uses the parent's context only. ng-template can receive context (`let-x`, `$implicit`) from whoever renders it.",
          '**Use cases**: ng-content for layout wrappers (cards, dialogs, panels). ng-template for customizable rows/cells, empty/loading states, tooltips, lazy tab bodies.',
          'Structural directives (`*ngIf`, `*ngFor`) desugar into `<ng-template>`; `@if`/`@for` blocks compile to templates too.',
          '`<ng-container>` is a third, related element: a grouping wrapper that renders no DOM node.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: wrapping `<ng-content>` in `@if` to "lazy load" heavy content does not work — the parent already instantiated it. Accept an `<ng-template>` (or use `@defer`) when content must be lazy or repeated.',
      },
    ],
  },

  'creating-components-dynamically': {
    summary:
      'When the component type is only known at runtime, I render it with `NgComponentOutlet` in the template if possible, or `ViewContainerRef.createComponent()` in code when I need the `ComponentRef` to set inputs, subscribe to outputs or control its lifetime. Combined with a lazy `import()`, it is worth it for plugin-style UIs: dashboard widgets from config, CMS blocks, dialogs. For a small fixed set of variants, a plain `@switch` is simpler and fully type-checked.',
    details: [
      { type: 'heading3', text: 'Option 1: `NgComponentOutlet` in the template' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-widget-host',
  imports: [NgComponentOutlet],
  template: \`
    @if (component.value(); as cmp) {
      <ng-container *ngComponentOutlet="cmp; inputs: widgetInputs()" />
    } @else {
      <app-skeleton />
    }
  \`,
})
export class WidgetHost {
  readonly widget = input.required<WidgetConfig>();
  readonly widgetInputs = computed(() => ({ settings: this.widget().settings }));

  private registry = inject(WIDGET_REGISTRY); // Record<string, () => Promise<Type<unknown>>>

  // Loads the widget code lazily; a newer type cancels a stale load
  readonly component = resource({
    params: () => this.widget().type,
    loader: ({ params }) => this.registry[params]?.() ?? Promise.resolve(null),
  });
}`,
      },
      {
        type: 'paragraph',
        text: 'The `inputs` object is passed through `setInput`, so signal inputs and `OnPush` work. The outlet also accepts a custom `injector` and projected `content`. It cannot listen to outputs, so use a shared service or a callback input when the widget needs to talk back.',
      },
      { type: 'heading3', text: 'Option 2: `ViewContainerRef.createComponent()` in code' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Directive({ selector: '[appPluginSlot]' })
export class PluginSlot {
  private vcr = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private ref: ComponentRef<PluginComponent> | null = null;

  async render(type: () => Promise<Type<PluginComponent>>, data: PluginData) {
    this.vcr.clear();
    const cmp = await type();
    this.ref = this.vcr.createComponent(cmp);
    this.ref.setInput('data', data); // works with input() and @Input
    const sub = this.ref.instance.closed.subscribe(() => this.vcr.clear()); // OutputEmitterRef
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          'Always use `setInput()`, not `ref.instance.x = y`: it marks the component for check and is the only way to set signal inputs.',
          'Components created in a `ViewContainerRef` are destroyed with it; anything created with the standalone `createComponent()` function and attached to `ApplicationRef` must be destroyed by you.',
          'Pass an `injector` (or `environmentInjector`) option when the dynamic component needs providers from a specific context, such as a dialog that must see the caller route services.',
        ],
      },
      { type: 'heading3', text: 'When it is worth it' },
      {
        type: 'bullets',
        items: [
          '**Configuration-driven UIs**: dashboards, form builders, CMS pages where the layout comes from the server.',
          '**Plugins and micro frontends**: types loaded at runtime from separately built bundles.',
          '**Overlays**: dialogs, toasts and popovers rendered outside the caller template (CDK Overlay and Material Dialog do this internally).',
        ],
      },
      { type: 'heading3', text: 'When it is not' },
      {
        type: 'paragraph',
        text: 'If you know the possible components at build time, `@switch (widget.type)` with each component in the template is type-safe, easier to read, and with `@defer` around each case you still get lazy loading. Dynamic creation gives up template type checking of inputs and makes the code harder to follow.',
      },
      {
        type: 'code',
        lang: 'html',
        code: `@switch (widget().type) {
  @case ('chart') { @defer { <app-chart-widget [settings]="widget().settings" /> } }
  @case ('table') { @defer { <app-table-widget [settings]="widget().settings" /> } }
  @default { <app-unknown-widget /> }
}`,
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'How do you lazy load the component code? (A registry of `() => import(...)` loaders; only the selected widget chunk downloads.)',
          'How do inputs get type-checked? (They do not with dynamic creation; define a shared interface for widgets and validate config at the boundary.)',
          'How do you render a component into `document.body`? (`createComponent(type, { environmentInjector })`, attach with `appRef.attachView`, append `hostView` nodes, and destroy it yourself.)',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Setting inputs by assigning to the instance, so `OnPush` components never update.',
          'Leaking components created outside a view container.',
          'Reaching for dynamic creation when a `@switch` would do.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you choose the simplest tool (`@switch` with `@defer`, then `NgComponentOutlet`, then `createComponent`), use `setInput`, manage lifetime and injectors explicitly, and name the trade-off of losing template type checking.',
      },
    ],
  },

  'designing-a-reusable-component-api': {
    summary:
      'I design from the consumer side: the smallest set of typed inputs for data and configuration, outputs that describe user intent rather than internal events, `model()` only for genuine two-way state, content projection for markup the consumer owns, and template slots (`TemplateRef` with a typed context) when the consumer must render per-item content. Everything else stays private, so the component can change inside without breaking callers.',
    details: [
      { type: 'heading3', text: 'Inputs: data and configuration' },
      {
        type: 'bullets',
        items: [
          'Use `input.required<T>()` for what the component cannot work without, `input<T>(default)` for options.',
          'Prefer a few meaningful inputs over many booleans: `variant: "primary" | "danger"` instead of `primary`, `danger`, `outlined`.',
          'Use `transform: booleanAttribute` / `numberAttribute` so `<app-x disabled>` works like native HTML.',
          'Do not pass services or stores as inputs; inject them.',
        ],
      },
      { type: 'heading3', text: 'Outputs and two-way binding' },
      {
        type: 'bullets',
        items: [
          'Name outputs after intent: `selectionChange`, `retry`, `closed`, not `buttonClicked`.',
          'Emit domain values (the selected item or its id), not DOM events.',
          'Use `model()` when the parent and child genuinely share a value (`[(value)]`, `[(open)]`), and keep it to one or two models.',
        ],
      },
      { type: 'heading3', text: 'Content projection vs template slots' },
      {
        type: 'paragraph',
        text: 'Projection (`<ng-content select="...">`) is for static markup the consumer provides once: a card header, dialog actions. Template slots are for content rendered repeatedly or with data from the component, such as how each row or option looks. Projected content is created by the parent even if you never show it; templates are only instantiated when you render them.',
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `export interface OptionContext<T> {
  $implicit: T;
  selected: boolean;
}

@Directive({ selector: 'ng-template[appOption]' })
export class OptionTemplate<T> {
  readonly template = inject<TemplateRef<OptionContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(_d: OptionTemplate<T>, ctx: unknown): ctx is OptionContext<T> {
    return true;
  }
}

@Component({
  selector: 'app-select-list',
  imports: [NgTemplateOutlet],
  template: \`
    <ng-content select="[listHeader]" />
    <ul role="listbox">
      @for (item of items(); track trackBy()(item)) {
        <li role="option" [attr.aria-selected]="item === value()" (click)="value.set(item)">
          @if (optionTemplate(); as t) {
            <ng-container
              *ngTemplateOutlet="t.template; context: { $implicit: item, selected: item === value() }"
            />
          } @else {
            {{ item }}
          }
        </li>
      } @empty {
        <ng-content select="[listEmpty]" />
      }
    </ul>
  \`,
})
export class SelectList<T> {
  readonly items = input.required<T[]>();
  readonly trackBy = input<(item: T) => unknown>((item) => item);
  readonly value = model<T | null>(null);
  protected readonly optionTemplate = contentChild(OptionTemplate);
}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<app-select-list [items]="users()" [trackBy]="byId" [(value)]="assignee">
  <h3 listHeader>Assign to</h3>
  <ng-template appOption let-user let-selected="selected">
    <app-avatar [user]="user" /> {{ user.name }} @if (selected) { ✓ }
  </ng-template>
  <p listEmpty>No team members yet</p>
</app-select-list>`,
      },
      { type: 'heading3', text: 'Make the API hard to misuse' },
      {
        type: 'bullets',
        items: [
          'Keep accessibility inside the component (roles, keyboard handling, `aria-*`), so every consumer gets it for free.',
          'Expose styling through CSS custom properties or a `variant` input, not by asking consumers to pierce encapsulation.',
          'Version the public API: document inputs and outputs, deprecate before removing, and keep internals in non-exported files.',
          'Write component harnesses for the library, so consumer tests do not depend on internal DOM.',
        ],
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Why not expose the internal `FormControl` as an input? (Implement `ControlValueAccessor` or `model()` so it works with any form approach.)',
          'When does an input explosion signal a design problem? (When many inputs only exist to tweak internal markup; switch to projection or template slots.)',
          'How do you handle generics in templates? (Generic component class plus a typed context guard on the template directive.)',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Dozens of boolean inputs for every visual tweak.',
          'Outputs that leak implementation (`innerButtonClick`).',
          'Using `<ng-content>` inside `@if` or `@for` and expecting it to render several times; projected content renders once.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you design the API from the consumer, choose projection vs template slots by whether content needs data or repetition, type the slot context, and keep accessibility and internals encapsulated so the component can evolve without breaking callers.',
      },
    ],
  },

  'smart-vs-presentational-with-signals': {
    summary:
      'Smart (container) components know where data comes from: they inject stores and services, read route params, and turn user intent into actions. Presentational components only receive data through `input()`, emit intent through `output()`, and hold at most local UI state, so they are easy to reuse and test. Signals make the boundary cleaner: the container passes signal values down, uses `computed()` for view models, and presentational components stay `OnPush` with no subscriptions.',
    details: [
      { type: 'heading3', text: 'Responsibilities' },
      {
        type: 'bullets',
        items: [
          '**Smart / container**: inject the store or `httpResource`, read route params (`input()` with component input binding), map state to a view model, handle outputs by calling store methods, own loading and error decisions.',
          '**Presentational**: inputs in, outputs out, no injected data services, local UI state only (expanded, hover, sort direction shown), no knowledge of routes or APIs.',
        ],
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Smart: knows about data, routes and actions
@Component({
  selector: 'app-orders-page',
  imports: [OrderTable, ErrorBanner],
  template: \`
    @if (vm().error) {
      <app-error-banner [message]="vm().error!" (retry)="store.reload()" />
    }
    <app-order-table
      [orders]="vm().orders"
      [loading]="vm().loading"
      [selectedId]="selectedId()"
      (select)="open($event)"
      (refund)="store.refund($event)"
    />
  \`,
})
export class OrdersPage {
  protected readonly store = inject(OrdersStore);
  private router = inject(Router);
  readonly selectedId = input<string>(); // from the route via withComponentInputBinding()

  protected readonly vm = computed(() => ({
    orders: this.store.orders(),
    loading: this.store.loading(),
    error: this.store.error(),
  }));

  open(id: string) {
    this.router.navigate(['/orders', id]);
  }
}`,
      },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Presentational: data in, intent out
@Component({
  selector: 'app-order-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-table.html',
})
export class OrderTable {
  readonly orders = input.required<Order[]>();
  readonly loading = input(false);
  readonly selectedId = input<string>();
  readonly select = output<string>();
  readonly refund = output<string>();

  // local UI state only
  protected readonly sortBy = signal<'date' | 'total'>('date');
  protected readonly sorted = computed(() =>
    [...this.orders()].sort((a, b) =>
      this.sortBy() === 'date' ? b.date.localeCompare(a.date) : b.total - a.total,
    ),
  );
}`,
      },
      { type: 'heading3', text: 'How signals change the pattern' },
      {
        type: 'bullets',
        items: [
          'No `async` pipes or manual subscriptions in presentational components; they read input signals.',
          'The container builds a view model with `computed()`, so the template reads one object and derived values are memoized.',
          'Presentational components can derive with `computed()` from inputs and use `linkedSignal()` for local state that resets when an input changes (for example, the selected tab when the list changes).',
          'With zoneless change detection, signal reads are what schedule updates, so this split keeps rendering predictable.',
        ],
      },
      { type: 'heading3', text: 'Do not over-apply it' },
      {
        type: 'paragraph',
        text: 'Splitting every small widget into two components adds files and prop drilling. Apply the split at feature boundaries (pages, panels) and for components you intend to reuse. If inputs are drilled through many levels, inject a feature store at the right level instead.',
      },
      { type: 'heading3', text: 'Follow-up questions interviewers ask' },
      {
        type: 'bullets',
        items: [
          'Where does form state live? (Usually in the container or a feature store; presentational form components implement `ControlValueAccessor` or expose `model()`.)',
          'How do you test each kind? (Presentational: set inputs, assert outputs, no mocks. Container: mock the store and check it is called with the right intent.)',
          'Is a facade the same as a container? (No: a facade is a service hiding the store; the container component uses it.)',
        ],
      },
      { type: 'heading3', text: 'Common mistakes' },
      {
        type: 'bullets',
        items: [
          'Presentational components that inject `HttpClient` "just this once".',
          'Containers with large templates full of markup that belongs in presentational components.',
          'Mutating input arrays inside presentational components instead of emitting intent.',
        ],
      },
      {
        type: 'callout',
        variant: 'important',
        text: 'Senior signal: you place data access, routing and side effects in containers or stores, keep presentational components pure with signal inputs and intent outputs, and apply the split pragmatically at feature boundaries rather than everywhere.',
      },
    ],
  },
};
