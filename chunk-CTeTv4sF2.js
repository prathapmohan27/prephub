var e={"what-directives-are":{summary:"Directives are classes that add behaviour to elements in a template. There are three kinds: **components** (directives with their own template), **attribute directives** that change the appearance or behaviour of an existing element (`NgClass`, `NgModel`, a custom `appHighlight`), and **structural directives** that add or remove DOM by working with a template (`*ngIf`, `*ngFor`, and custom ones). In modern Angular, built-in control flow (`@if`, `@for`, `@switch`) replaces the most common structural directives.",details:[{type:`paragraph`,text:"A directive is a class decorated with `@Directive` (or `@Component`, which extends it) and a CSS `selector`. When Angular compiles a template and finds an element matching that selector, it creates the directive instance and attaches it to that element, giving it access to the element, inputs, outputs and host events."},{type:`heading3`,text:`1. Components — directives with a template`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-user-card',
  template: \`<h3>{{ name() }}</h3>\`,
})
export class UserCardComponent {
  name = input.required<string>();
}`},{type:`heading3`,text:`2. Attribute directives — change an existing element`},{type:`code`,lang:`typescript`,code:`@Directive({
  selector: '[appAutofocus]',           // matches <input appAutofocus>
})
export class AutofocusDirective {
  private el = inject(ElementRef<HTMLInputElement>);
  constructor() {
    afterNextRender(() => this.el.nativeElement.focus());
  }
}

// Built-in examples
// <div [ngClass]="{ active: isActive }">   <input [(ngModel)]="name">
// (Plain [class.active] and [style.color] bindings are now preferred over NgClass/NgStyle.)`},{type:`heading3`,text:`3. Structural directives — add/remove DOM`},{type:`code`,lang:`html`,code:`<!-- Legacy structural directives (still supported) -->
<p *ngIf="user; else loading">{{ user.name }}</p>
<li *ngFor="let item of items; trackBy: trackById">{{ item.name }}</li>
<ng-template #loading>Loading\u2026</ng-template>

<!-- Modern built-in control flow (Angular 17+) \u2014 not directives, part of the template syntax -->
@if (user(); as u) {
  <p>{{ u.name }}</p>
} @else {
  <p>Loading\u2026</p>
}
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items</li>
}`},{type:`heading3`,text:`A custom structural directive`},{type:`code`,lang:`typescript`,code:`// <div *appHasRole="'admin'">Admin panel</div>
@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);

  appHasRole = input.required<string>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.auth.roles().includes(this.appHasRole())) {
        this.vcr.createEmbeddedView(this.tpl); // render the template
      }
    });
  }
}`},{type:`flow`,title:`Kinds of directives`,code:`flowchart TD
  D["Directive (@Directive)"]:::highlight --> C["Component<br/>has its own template"]:::client
  D --> A["Attribute directive<br/>changes look / behaviour"]:::server
  D --> S["Structural directive<br/>adds / removes DOM via TemplateRef"]:::server
  A --> A1["NgClass, NgModel,<br/>custom appHighlight"]:::external
  S --> S1["*ngIf, *ngFor,<br/>custom *appHasRole"]:::external
  S1 -.->|"modern replacement"| CF["@if, @for, @switch"]:::db`},{type:`bullets`,items:["Directives are standalone by default in modern Angular — add them to a component's `imports` array (legacy: declare them in an NgModule).","Use `host: { ... }` metadata or `@HostListener`/`@HostBinding` to react to and change the host element.","`hostDirectives` lets a component or directive compose other directives (e.g. reuse a tooltip behaviour) without inheritance.","Only ONE structural directive (`*`) is allowed per element — wrap in `<ng-container>` if you need two.","Use `input()`/`output()` (signal-based) in new directives; `@Input()`/`@Output()` are the legacy equivalents."]},{type:`callout`,variant:`tip`,text:"Interview tip: name the three types with one example each, show a small custom attribute directive, and mention that `@if/@for` built-in control flow has replaced `*ngIf/*ngFor` in new code — interviewers like to hear you know both."}]},hostlistener:{summary:"`@HostListener` is a decorator that subscribes a directive or component method to a DOM event on its **host element** (or on global targets like `window` and `document`). Angular adds the listener when the directive is created and removes it automatically when it is destroyed. The modern recommended alternative is the `host` property in the decorator metadata, e.g. `host: { '(click)': 'onClick($event)' }`.",details:[{type:`paragraph`,text:"The host element is the element the directive is attached to (or the component's own tag). `@HostListener(eventName, args)` binds a method to an event on it, passing values such as `$event` or `$event.target` as arguments — without touching `addEventListener` or cleaning up yourself."},{type:`heading3`,text:`Basic usage`},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appClickLogger]' })
export class ClickLoggerDirective {
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    console.log('Host clicked at', event.clientX, event.clientY);
  }
}

// <button appClickLogger>Save</button> \u2192 every click on THIS button is logged`},{type:`heading3`,text:`Global targets and key events`},{type:`code`,lang:`typescript`,code:`@Component({ selector: 'app-modal', template: '<ng-content />' })
export class ModalComponent {
  close = output<void>();

  // Key filtering built into the event name
  @HostListener('document:keydown.escape')
  onEscape() { this.close.emit(); }

  // Window events \u2014 e.g. responsive logic
  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) { console.log('width', width); }
}`},{type:`heading3`,text:`Example: close a dropdown when clicking outside`},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appClickOutside]' })
export class ClickOutsideDirective {
  private el = inject(ElementRef<HTMLElement>);
  appClickOutside = output<void>();

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: HTMLElement) {
    if (!this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}
// <div class="menu" (appClickOutside)="menuOpen.set(false)">\u2026</div>`},{type:`heading3`,text:`Modern alternative: host metadata`},{type:`code`,lang:`typescript`,code:`@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onDocumentClick($event.target)',
    '(keydown.enter)': 'onEnter()',
  },
})
export class ClickOutsideDirective { /* same methods, no decorators */ }`},{type:`bullets`,items:["Supported global targets: `window:`, `document:` and `body:`.","Listeners are removed automatically on destroy — no memory leak, unlike a manual `addEventListener`.","High-frequency events (`scroll`, `mousemove`, `window:resize`) trigger change detection on every event in Zone-based apps — throttle them or listen outside Angular.","Companion decorator `@HostBinding` binds a host property/class/style (e.g. `@HostBinding('class.active')`); the modern form is `host: { '[class.active]': 'isActive()' }`.","Angular's style guide recommends the `host` object over `@HostListener`/`@HostBinding` for new code; both work."]},{type:`callout`,variant:`tip`,text:'Interview tip: explain "listens to events on the host element, auto-cleanup", show a `document:click` or `window:resize` example, and mention the `host` metadata alternative — that shows you know the current recommendation.'}]},"custom-hover-background-directive":{summary:"Create an attribute directive with a selector like `[appHoverBg]`, take the colour as an input, listen to `mouseenter` and `mouseleave` on the host, and bind the host's `style.backgroundColor` to a signal. In modern Angular this is a standalone directive using `input()`, `signal()` and the `host` metadata; the classic version uses `@Input`, `@HostListener` and `ElementRef`/`Renderer2`.",details:[{type:`paragraph`,text:`This is a classic live-coding question. The interviewer checks that you know how to create an attribute directive, pass configuration with inputs, react to host events, update the host element safely, and use it in a template.`},{type:`heading3`,text:`Solution 1 — modern (signals + host metadata)`},{type:`code`,lang:`typescript`,code:`// hover-bg.directive.ts
import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appHoverBg]',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '[style.backgroundColor]': 'hovered() ? (appHoverBg() || "#FEF3C7") : defaultBg()',
    '[style.transition]': '"background-color 200ms ease"',
  },
})
export class HoverBgDirective {
  // Bare <div appHoverBg> passes '' \u2192 the host binding falls back to yellow
  appHoverBg = input('');              // colour on hover (via the selector name)
  defaultBg = input('transparent');    // colour when not hovered
  protected hovered = signal(false);
}`},{type:`heading3`,text:`Using it`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-products',
  imports: [HoverBgDirective],
  template: \`
    <div appHoverBg>Default yellow on hover</div>
    <div appHoverBg="lightblue">Light blue on hover</div>
    <div [appHoverBg]="theme()" defaultBg="#F1F5F9">Dynamic colour</div>
  \`,
})
export class ProductsComponent {
  theme = signal('#DCFCE7');
}`},{type:`heading3`,text:`Solution 2 — classic (@Input + @HostListener + Renderer2)`},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appHoverBg]' })
export class HoverBgDirective {
  @Input() appHoverBg = '';
  @Input() defaultBg = 'transparent';

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onEnter() { this.setBg(this.appHoverBg || '#FEF3C7'); } // '' when used as a bare attribute

  @HostListener('mouseleave')
  onLeave() { this.setBg(this.defaultBg); }

  private setBg(color: string) {
    // Renderer2 instead of el.nativeElement.style \u2192 works with SSR / non-DOM renderers
    this.renderer.setStyle(this.el.nativeElement, 'background-color', color);
  }
}
// Legacy NgModule apps: add it to declarations[] (or imports[] if standalone)`},{type:`heading3`,text:`Unit test`},{type:`code`,lang:`typescript`,code:`@Component({
  imports: [HoverBgDirective],
  template: '<p appHoverBg="red">Hover me</p>',
})
class HostComponent {}

it('changes background on hover', async () => {
  const fixture = TestBed.createComponent(HostComponent);
  const p: HTMLElement = fixture.nativeElement.querySelector('p');

  p.dispatchEvent(new MouseEvent('mouseenter'));
  await fixture.whenStable();
  expect(p.style.backgroundColor).toBe('red');

  p.dispatchEvent(new MouseEvent('mouseleave'));
  await fixture.whenStable();
  expect(p.style.backgroundColor).toBe('transparent');
});`},{type:`flow`,title:`How the directive reacts`,code:`stateDiagram-v2
  [*] --> Idle: directive created, bg = defaultBg
  Idle --> Hovered: mouseenter
  Hovered --> Idle: mouseleave
  Hovered --> Hovered: appHoverBg input changes, bg updates`},{type:`bullets`,items:['Naming the input the same as the selector (`appHoverBg`) lets you write `appHoverBg="lightblue"`. Note that a bare `<div appHoverBg>` sets the input to an empty string, hence the fallback colour.',"Avoid `el.nativeElement.style.x = ...` directly in reusable code — use host bindings or `Renderer2`.","For pure styling, CSS `:hover` is simpler and faster; a directive is justified when colours are dynamic/configurable or extra logic runs on hover.","Support keyboard users too: also listen to `focusin`/`focusout` if the hover state conveys information."]},{type:`callout`,variant:`tip`,text:'Interview tip: write the modern version, then say "the classic way is `@HostListener` + `Renderer2`" and sketch it. Mentioning that plain CSS `:hover` might be enough shows good judgement.'}]},"custom-structural-directive-typed-context":{summary:"A structural directive gets the `<ng-template>` it sits on as a `TemplateRef` and an anchor in the DOM as a `ViewContainerRef`, then decides when to call `createEmbeddedView(template, context)` and `clear()`. With signal inputs the logic lives in an `effect()`, and a static `ngTemplateContextGuard` tells the template type checker what the context contains, so `let-` variables are typed.",details:[{type:`heading3`,text:`The pieces`},{type:`bullets`,items:['`*appX="expr"` is sugar for `<ng-template [appX]="expr">`. The directive sits on that template.',"`TemplateRef<C>`: the blueprint of the content; nothing is rendered until you create a view from it.","`ViewContainerRef`: the place to insert views; `createEmbeddedView`, `clear`, `move`, `remove`.","The **context** object becomes the template variables: `$implicit` maps to `let x`, named keys map to `let y = key`."]},{type:`heading3`,text:`Example: render content only for users with a permission`},{type:`code`,lang:`typescript`,code:`interface CanContext {
  $implicit: User; // let user
  role: Role; // let role = role
}

@Directive({ selector: '[appCan]' })
export class CanDirective {
  private template = inject<TemplateRef<CanContext>>(TemplateRef);
  private container = inject(ViewContainerRef);
  private auth = inject(AuthStore);

  readonly appCan = input.required<Permission>();
  readonly appCanElse = input<TemplateRef<unknown> | null>(null);

  constructor() {
    effect(() => {
      const user = this.auth.user(); // signal
      const allowed = !!user && user.permissions.includes(this.appCan());
      this.container.clear();
      if (allowed) {
        this.container.createEmbeddedView(this.template, { $implicit: user, role: user.role });
      } else if (this.appCanElse()) {
        this.container.createEmbeddedView(this.appCanElse()!);
      }
    });
  }

  // Lets strictTemplates type "let user" and "let role"
  static ngTemplateContextGuard(_dir: CanDirective, ctx: unknown): ctx is CanContext {
    return true;
  }
}`},{type:`code`,lang:`html`,code:`<button *appCan="'orders:refund'; else noAccess; let user; let role = role">
  Refund (as {{ user.name }}, {{ role }})
</button>

<ng-template #noAccess>
  <span class="muted">Ask an admin for refund access</span>
</ng-template>`},{type:`paragraph`,text:"The microsyntax maps `else noAccess` to the input `appCanElse` (directive name plus capitalised key), which is why the input is named that way."},{type:`heading3`,text:`Avoid needless re-rendering`},{type:`paragraph`,text:`Clearing and recreating on every change destroys component state inside the template (form input, scroll position). Track whether the view exists and only create or clear when the condition flips; update the context in place when only data changes.`},{type:`code`,lang:`typescript`,code:`private view: EmbeddedViewRef<CanContext> | null = null;

// inside the effect
if (allowed && !this.view) {
  this.view = this.container.createEmbeddedView(this.template, { $implicit: user, role: user.role });
} else if (allowed && this.view) {
  this.view.context.$implicit = user; // update in place
  this.view.context.role = user.role;
} else if (!allowed && this.view) {
  this.container.clear();
  this.view = null;
}`},{type:`callout`,variant:`warning`,text:`A permission directive only hides UI. The API must still enforce the permission; hidden buttons are not security.`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Why can an element only have one structural directive? (Each `*` desugars to its own `<ng-template>`; wrap with `<ng-container>` to combine.)","When would you still write one now that `@if` and `@for` exist? (Reusable conditions with domain meaning: permissions, feature flags, breakpoints, lazy rendering when visible.)","What does `ngTemplateGuard_appCan` do? (Narrows the type of the bound expression inside the template, like `@if` does.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Recreating the view on every input change and losing child state.`,"No context guard, so `let` variables are `any` and template errors slip through.","Doing DOM work with `document` instead of `ViewContainerRef`, which breaks SSR and change detection."]},{type:`callout`,variant:`important`,text:"Senior signal: you explain the desugaring, keep view creation idempotent, type the context with `ngTemplateContextGuard`, and only build a structural directive when it encodes a reusable domain rule that built-in control flow does not express."}]},"host-directives-composition-over-inheritance":{summary:"`hostDirectives` lets a component or directive apply other standalone directives to its own host element, as if they were written in the template. You choose which of their inputs and outputs to expose, optionally renamed. It is composition instead of inheritance: a `Button` can be focusable, ripple and tooltip-enabled by composing three small directives, without a base class chain.",details:[{type:`heading3`,text:`The problem it solves`},{type:`paragraph`,text:"Shared behaviour in component libraries used to be done with base classes (`class MyButton extends FocusableBase`). Inheritance couples everything, only allows one parent, and makes constructors and lifecycle hooks fragile. Asking every consumer to add `appFocusable appRipple` attributes is error-prone. Host directives move that composition into the component definition."},{type:`code`,lang:`typescript`,code:`@Directive({
  selector: '[appDisableable]',
  host: { '[attr.aria-disabled]': 'disabled()', '[class.is-disabled]': 'disabled()' },
})
export class Disableable {
  readonly disabled = input(false);
}

@Directive({
  selector: '[appTooltip]',
  host: { '(mouseenter)': 'show()', '(mouseleave)': 'hide()' },
})
export class Tooltip {
  readonly text = input('');
  readonly shown = output<void>();
  show() { /* ... */ this.shown.emit(); }
  hide() { /* ... */ }
}

@Component({
  selector: 'app-icon-button',
  template: '<ng-content />',
  hostDirectives: [
    { directive: Disableable, inputs: ['disabled'] },
    { directive: Tooltip, inputs: ['text: tooltip'], outputs: ['shown: tooltipShown'] },
  ],
})
export class IconButton {
  // The composed directives are injectable like any directive on the same element
  private disableable = inject(Disableable);
}`},{type:`code`,lang:`html`,code:`<app-icon-button [disabled]="saving()" tooltip="Save" (tooltipShown)="log()">
  <i class="ti ti-device-floppy"></i>
</app-icon-button>`},{type:`heading3`,text:`Rules worth knowing`},{type:`bullets`,items:[`Host directives must be **standalone**, and their selectors are ignored (they are always applied).`,`Inputs and outputs are **not exposed by default**; you list the ones consumers may use, which keeps the public API deliberate.`,`Host directives run **before** the host component: they are created first and their host bindings apply first, so the component can override.`,"They can be nested: a host directive can have its own `hostDirectives`.","The host can `inject()` them, and they can inject the host, so they can cooperate without inheritance."]},{type:`heading3`,text:`When to use it`},{type:`bullets`,items:[`Design-system behaviours shared by many components: focus ring, disabled state, ripple, tooltip, keyboard navigation item.`,`Accessibility patterns where forgetting an attribute directive would be a bug.`,`Prefer plain composition with services when the behaviour does not touch the host element.`]},{type:`callout`,variant:`info`,text:`Angular CDK builds on the same idea; for example, aria patterns are directives you can compose onto your own components as host directives.`},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:[`How is this different from a base class? (Multiple behaviours, no shared constructor chain, explicit API, each piece testable alone.)`,`Can consumers still add the directive manually as well? (Applying the same directive twice on one element is an error, so document that it is built in.)`,`What is the performance cost? (Each host directive is a real directive instance; fine for a handful, avoid composing many on large lists.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Forgetting to expose an input and wondering why the binding does nothing.`,`Composing non-standalone directives (not allowed).`,`Recreating inheritance trees with deeply nested host directives that are hard to follow.`]},{type:`callout`,variant:`important`,text:`Senior signal: you reach for host directives to share host-element behaviour across a component library, expose a minimal renamed API, and explain why composition beats a base-class hierarchy for this.`}]},"directive-or-component":{summary:"If it adds behaviour or styling to an element that already exists, it is a directive; if it owns its own markup, it is a component. Directives keep the consumer in control of the element (a native `button` stays a button, with its semantics and attributes), so they are the better fit for things like tooltips, autofocus, permissions, drag handles and input masks.",details:[{type:`heading3`,text:`A quick test`},{type:`bullets`,items:[`**Does it render its own DOM structure?** Component.`,`**Does it decorate an element the consumer writes?** Attribute directive.`,`**Does it decide whether or how many times content renders?** Structural directive (or built-in control flow).`,`**Must the consumer keep the native element** (for accessibility, forms, styling)? Strong hint for a directive.`]},{type:`heading3`,text:`Example: a button`},{type:`paragraph`,text:"A component `<app-button>` wraps a real `<button>` inside its template, so consumers lose direct access to native attributes (`type`, `form`, `aria-*`) unless you re-expose every one. An attribute directive on the native element keeps everything native and only adds styling and behaviour."},{type:`code`,lang:`typescript`,code:`@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'btn',
    '[class.btn--primary]': "variant() === 'primary'",
    '[class.btn--loading]': 'loading()',
    '[attr.aria-busy]': 'loading()',
  },
})
export class ButtonDirective {
  readonly variant = input<'primary' | 'secondary'>('secondary');
  readonly loading = input(false);
}`},{type:`code`,lang:`html`,code:`<button appButton variant="primary" type="submit" [loading]="saving()">Save</button>
<a appButton routerLink="/orders">Orders</a>`},{type:`paragraph`,text:"Angular Material made this choice for its buttons (`<button mat-button>`), while a date picker or data table, which own complex markup, are components."},{type:`heading3`,text:`Typical directives`},{type:`bullets`,items:[`Tooltip, autofocus, click-outside, copy-to-clipboard.`,"Input masks and formatters on `<input>`, which keeps forms integration (`ControlValueAccessor` stays on the native input).",`Permission or feature-flag show/hide (structural).`,`Drag handle, resize, intersection-observer "visible" events.`]},{type:`heading3`,text:`Typical components`},{type:`bullets`,items:[`Anything with its own layout: cards, dialogs, data tables, date pickers.`,`Things that need encapsulated styles or their own change detection boundary.`,`Composite widgets made of several elements (a combobox with input, list and options).`]},{type:`callout`,variant:`tip`,text:"A good hybrid: build behaviour as directives, then compose them onto components with `hostDirectives`, so the same behaviour is available both ways."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Why do component wrappers around inputs often break accessibility? (Labels, `id` and `aria-*` end up on the wrong element.)",`Can a directive have styles? (Not encapsulated ones; use host classes plus global or design-token CSS.)`,`How would you test a directive? (A tiny test host component that uses it, then assert on the host element.)`]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:[`Wrapping native controls in components and re-implementing every native attribute as an input.`,"Building a directive that injects `Renderer2` to create lots of DOM: that is a component in disguise.","Selectors that are too broad (`[disabled]`) and match elements unintentionally."]},{type:`callout`,variant:`important`,text:`Senior signal: you decide by DOM ownership and by what the consumer needs to keep control of, and you mention accessibility and forms integration as reasons to prefer directives on native elements.`}]}};export{e as answers};