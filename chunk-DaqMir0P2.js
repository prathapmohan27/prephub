var e={"What are directives in Angular?":{summary:"Directives are classes that add behaviour to elements in a template. There are three kinds: **components** (directives with their own template), **attribute directives** that change the appearance or behaviour of an existing element (`NgClass`, `NgModel`, a custom `appHighlight`), and **structural directives** that add or remove DOM by working with a template (`*ngIf`, `*ngFor`, and custom ones). In modern Angular, built-in control flow (`@if`, `@for`, `@switch`) replaces the most common structural directives.",details:[{type:`paragraph`,text:"A directive is a class decorated with `@Directive` (or `@Component`, which extends it) and a CSS `selector`. When Angular compiles a template and finds an element matching that selector, it creates the directive instance and attaches it to that element, giving it access to the element, inputs, outputs and host events."},{type:`heading3`,text:`1. Components — directives with a template`},{type:`code`,lang:`typescript`,code:`@Component({
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
  S1 -.->|"modern replacement"| CF["@if, @for, @switch"]:::db`},{type:`bullets`,items:["Directives are standalone by default in modern Angular — add them to a component's `imports` array (legacy: declare them in an NgModule).","Use `host: { ... }` metadata or `@HostListener`/`@HostBinding` to react to and change the host element.","`hostDirectives` lets a component or directive compose other directives (e.g. reuse a tooltip behaviour) without inheritance.","Only ONE structural directive (`*`) is allowed per element — wrap in `<ng-container>` if you need two.","Use `input()`/`output()` (signal-based) in new directives; `@Input()`/`@Output()` are the legacy equivalents."]},{type:`callout`,variant:`tip`,text:"Interview tip: name the three types with one example each, show a small custom attribute directive, and mention that `@if/@for` built-in control flow has replaced `*ngIf/*ngFor` in new code — interviewers like to hear you know both."}]},"What does @HostListener do?":{summary:"`@HostListener` is a decorator that subscribes a directive or component method to a DOM event on its **host element** (or on global targets like `window` and `document`). Angular adds the listener when the directive is created and removes it automatically when it is destroyed. The modern recommended alternative is the `host` property in the decorator metadata, e.g. `host: { '(click)': 'onClick($event)' }`.",details:[{type:`paragraph`,text:"The host element is the element the directive is attached to (or the component's own tag). `@HostListener(eventName, args)` binds a method to an event on it, passing values such as `$event` or `$event.target` as arguments — without touching `addEventListener` or cleaning up yourself."},{type:`heading3`,text:`Basic usage`},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appClickLogger]' })
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
export class ClickOutsideDirective { /* same methods, no decorators */ }`},{type:`bullets`,items:["Supported global targets: `window:`, `document:` and `body:`.","Listeners are removed automatically on destroy — no memory leak, unlike a manual `addEventListener`.","High-frequency events (`scroll`, `mousemove`, `window:resize`) trigger change detection on every event in Zone-based apps — throttle them or listen outside Angular.","Companion decorator `@HostBinding` binds a host property/class/style (e.g. `@HostBinding('class.active')`); the modern form is `host: { '[class.active]': 'isActive()' }`.","Angular's style guide recommends the `host` object over `@HostListener`/`@HostBinding` for new code; both work."]},{type:`callout`,variant:`tip`,text:'Interview tip: explain "listens to events on the host element, auto-cleanup", show a `document:click` or `window:resize` example, and mention the `host` metadata alternative — that shows you know the current recommendation.'}]},"Create a custom directive to change background color on hover/unhover":{summary:"Create an attribute directive with a selector like `[appHoverBg]`, take the colour as an input, listen to `mouseenter` and `mouseleave` on the host, and bind the host's `style.backgroundColor` to a signal. In modern Angular this is a standalone directive using `input()`, `signal()` and the `host` metadata; the classic version uses `@Input`, `@HostListener` and `ElementRef`/`Renderer2`.",details:[{type:`paragraph`,text:`This is a classic live-coding question. The interviewer checks that you know how to create an attribute directive, pass configuration with inputs, react to host events, update the host element safely, and use it in a template.`},{type:`heading3`,text:`Solution 1 — modern (signals + host metadata)`},{type:`code`,lang:`typescript`,code:`// hover-bg.directive.ts
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
  Hovered --> Hovered: appHoverBg input changes, bg updates`},{type:`bullets`,items:['Naming the input the same as the selector (`appHoverBg`) lets you write `appHoverBg="lightblue"`. Note that a bare `<div appHoverBg>` sets the input to an empty string, hence the fallback colour.',"Avoid `el.nativeElement.style.x = ...` directly in reusable code — use host bindings or `Renderer2`.","For pure styling, CSS `:hover` is simpler and faster; a directive is justified when colours are dynamic/configurable or extra logic runs on hover.","Support keyboard users too: also listen to `focusin`/`focusout` if the hover state conveys information."]},{type:`callout`,variant:`tip`,text:'Interview tip: write the modern version, then say "the classic way is `@HostListener` + `Renderer2`" and sketch it. Mentioning that plain CSS `:hover` might be enough shows good judgement.'}]}};export{e as answers};