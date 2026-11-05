import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'If I want to toggle an element dynamically without using *ngIf, how?': {
    summary:
      'In modern Angular use the built-in `@if` block. Without removing the element from the DOM you can hide it with `[hidden]`, a `[class.x]` / `[style.display]` binding, or CSS. Other options: `[ngSwitch]`/`@switch`, `ng-template` + `ngTemplateOutlet`, a custom structural directive, `@defer`, or `ViewContainerRef` in code.',
    details: [
      {
        type: 'paragraph',
        text: 'The first decision is: should the element be **removed from the DOM** (destroying its components and state) or just **hidden** (kept alive, still in the DOM)? `*ngIf`/`@if` remove; `[hidden]` and style/class bindings hide.',
      },
      { type: 'heading3', text: 'Remove/add from the DOM' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Built-in control flow (Angular 17+) — the modern replacement for *ngIf -->
@if (isOpen()) {
  <app-details />
} @else {
  <button (click)="isOpen.set(true)">Show details</button>
}

<!-- ng-template rendered conditionally via ngTemplateOutlet -->
<ng-container *ngTemplateOutlet="isOpen() ? detailsTpl : null" />
<ng-template #detailsTpl><app-details /></ng-template>

<!-- @switch for several states -->
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error /> }
  @default { <app-content /> }
}`,
      },
      { type: 'heading3', text: 'Hide but keep in the DOM' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- [hidden] sets the HTML hidden attribute (display: none by default) -->
<div [hidden]="!isOpen()">Panel</div>

<!-- class / style bindings -->
<div [class.is-hidden]="!isOpen()">Panel</div>
<div [style.display]="isOpen() ? 'block' : 'none'">Panel</div>

<!-- visibility keeps the space reserved -->
<div [style.visibility]="isOpen() ? 'visible' : 'hidden'">Panel</div>`,
      },
      { type: 'heading3', text: 'Programmatically / custom directive' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// A tiny custom structural directive: *appShowIf="cond"
@Directive({ selector: '[appShowIf]' })
export class ShowIfDirective {
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  appShowIf = input.required<boolean>();

  constructor() {
    effect(() => {
      this.vcr.clear();
      if (this.appShowIf()) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          'Remove (`@if`) when the content is heavy or should reset its state; hide (`[hidden]`) when toggling often and you want to keep state (e.g. form input).',
          '`[hidden]` can be overridden by CSS that sets `display` on the element — add `[hidden] { display: none !important; }` globally if needed.',
          'Hidden components still run change detection and keep their subscriptions alive.',
          '`@defer (when cond)` also lazy-loads the code for the block the first time the condition is true.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: start with "today I\'d use `@if`", then explain the remove-vs-hide trade-off — that is usually what the interviewer is really probing.',
      },
    ],
  },

  'If I want to change CSS dynamically, how?': {
    summary:
      'Bind classes or styles from the template: `[class.active]="isActive"`, `[class]="{...}"`, `[style.width.px]="w"`, `[style]="{...}"`, or `ngClass`/`ngStyle`. Prefer toggling classes over inline styles, use CSS custom properties for themeable values, and `host` bindings to style the component\'s own element. `Renderer2` is for imperative cases.',
    details: [
      {
        type: 'paragraph',
        text: "Angular's property bindings write straight to the element's `class` and `style`. Since Ivy (Angular 9+), the native `[class]` and `[style]` bindings accept objects too, so `ngClass`/`ngStyle` are optional.",
      },
      { type: 'heading3', text: 'Class bindings' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- single class -->
<li [class.active]="item.id === selectedId()">{{ item.name }}</li>

<!-- many classes: object, array or string -->
<button [class]="{ primary: isPrimary, disabled: isDisabled(), 'btn-lg': size === 'lg' }">Save</button>
<div [class]="['card', theme()]"></div>

<!-- legacy directive, same result -->
<button [ngClass]="{ primary: isPrimary, disabled: isDisabled() }">Save</button>`,
      },
      { type: 'heading3', text: 'Style bindings (with units)' },
      {
        type: 'code',
        lang: 'html',
        code: `<div [style.width.px]="progress() * 3"></div>         <!-- width: 150px -->
<div [style.background-color]="color()"></div>
<div [style]="{ 'font-size.rem': 1.25, color: textColor }"></div>
<div [style.--accent]="brandColor()"></div>         <!-- sets a CSS variable -->`,
      },
      { type: 'heading3', text: 'Styling the host element and imperative changes' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-badge',
  template: \`<ng-content />\`,
  host: {
    '[class.badge--error]': 'type() === "error"',  // preferred over @HostBinding
    '[style.--badge-color]': 'color()',
  },
  styles: \`:host { background: var(--badge-color, gray); }\`,
})
export class BadgeComponent {
  type = input<'info' | 'error'>('info');
  color = input<string>();
}

// Imperative (e.g. inside a directive) — use Renderer2, not el.nativeElement.style directly
export class HighlightDirective {
  private el = inject(ElementRef);
  private r = inject(Renderer2);
  highlight(on: boolean) {
    on ? this.r.addClass(this.el.nativeElement, 'hl') : this.r.removeClass(this.el.nativeElement, 'hl');
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          'Classes keep styling in CSS files (themeable, cacheable); inline styles are for truly dynamic values like a computed width.',
          'Values from users must not be put into styles unsanitized — Angular sanitizes style bindings, but avoid `bypassSecurityTrustStyle` on untrusted input.',
          'CSS variables let one binding drive many rules: set `--accent` once, use `var(--accent)` everywhere.',
          'Animations: toggle a class and use CSS transitions (Angular also has `animate.enter`/`animate.leave` in newer versions, and the older `@angular/animations`).',
        ],
      },
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: Is ngClass the only way to change CSS dynamically?' },
      {
        type: 'paragraph',
        text: 'No. `[class.name]`, `[class]` (accepting string/array/object), `[style.prop]`, `[style]`, `ngStyle`, `host` bindings, CSS custom properties, attribute bindings for attribute selectors, and `Renderer2` all change styling dynamically. The Angular team now recommends native `[class]`/`[style]` bindings over `ngClass`/`ngStyle`.',
      },
      { type: 'heading3', text: 'Same result, five ways' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- 1. ngClass (needs NgClass import) -->
<div [ngClass]="{ active: isActive }"></div>

<!-- 2. single class binding -->
<div [class.active]="isActive"></div>

<!-- 3. class binding with object -->
<div [class]="{ active: isActive }"></div>

<!-- 4. attribute + CSS attribute selector: [data-state="active"] { ... } -->
<div [attr.data-state]="isActive ? 'active' : 'idle'"></div>

<!-- 5. CSS variable consumed by the stylesheet -->
<div [style.--opacity]="isActive ? 1 : 0.4"></div>`,
      },
      { type: 'heading3', text: 'From the component class' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-row',
  host: { '[class.selected]': 'selected()' },     // style the host element
  template: \`...\`,
})
export class RowComponent {
  selected = input(false);
}

// Global theme switch without any binding in child components
document.documentElement.setAttribute('data-theme', 'dark'); // CSS: [data-theme='dark'] { --bg: #111 }`,
      },
      {
        type: 'bullets',
        items: [
          '`[class.x]` is the cheapest and clearest for one class.',
          'A `[class]` binding merges with static `class="..."` on the same element — static classes are not wiped.',
          '`ngStyle` / `[style]` for multiple inline styles; units via `[style.width.px]`.',
          '`Renderer2.addClass`/`setStyle` for directives that react to events imperatively.',
          'Pure CSS options: `:hover`, `:focus-within`, `:has()`, media/container queries — no Angular code at all.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name at least three options (class binding, style binding, CSS variables/host binding) and say when you pick each — that shows judgment rather than API recall.',
      },
    ],
  },

  'What is ViewEncapsulation?': {
    summary:
      "ViewEncapsulation controls whether a component's styles stay scoped to that component. `Emulated` (default) rewrites the CSS with unique attributes so styles only match this component's template; `ShadowDom` uses the browser's native Shadow DOM; `None` makes the styles global. It is set per component with `encapsulation: ViewEncapsulation.X`.",
    details: [
      {
        type: 'paragraph',
        text: "Plain CSS is global: a `.title` rule anywhere affects every `.title` on the page. Encapsulation lets you write simple selectors in a component's stylesheet without worrying about collisions with other components.",
      },
      { type: 'heading3', text: 'The three modes' },
      {
        type: 'bullets',
        items: [
          "**Emulated** (default) — Angular adds attributes like `_ngcontent-abc-c12` to the template's elements and rewrites selectors to `.title[_ngcontent-abc-c12]`. Styles go into `<head>` but only match this component.",
          "**ShadowDom** — the component's host gets a real shadow root; styles live inside it. True isolation: outer styles don't leak in (except inherited properties and CSS variables), inner styles don't leak out.",
          '**None** — no scoping. The styles are added to `<head>` as-is and apply globally once the component is loaded.',
          '(`Native` was an older Shadow DOM v0 mode and has been removed.)',
        ],
      },
      { type: 'heading3', text: 'Setting it' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: \`<p class="title">Saved!</p>\`,
  styles: \`.title { color: green; }\`,
  encapsulation: ViewEncapsulation.Emulated, // default — can be omitted
})
export class AlertComponent {}`,
      },
      {
        type: 'flow',
        title: 'How each mode scopes .title',
        code: `flowchart LR
  CSS[".title { color: green }"]:::client --> E["Emulated<br/>.title[_ngcontent-x]"]:::server
  CSS --> S["ShadowDom<br/>inside #shadow-root"]:::security
  CSS --> N["None<br/>.title applies globally"]:::highlight
  E --> R1["Only this component"]
  S --> R2["Only this component,<br/>outer CSS blocked"]
  N --> R3["Every .title on the page"]`,
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: Why does Angular use View Encapsulation (`ViewEncapsulation.Emulated`) for components by default?',
      },
      {
        type: 'paragraph',
        text: "Because it gives component-scoped styles that work in every browser while still letting global styles (resets, typography, theme) apply. Real Shadow DOM isolates too strongly — global styles and many third-party libraries can't reach inside — so Emulated is the pragmatic default: no leaks out, but the global stylesheet still cascades in.",
      },
      { type: 'heading3', text: 'Why not ShadowDom by default?' },
      {
        type: 'bullets',
        items: [
          'Global styles (Bootstrap, Tailwind, a company design system, `styles.css`) would not reach into components — every component would need to re-import them.',
          'Many UI libraries and tools (overlays, analytics, tests using `document.querySelector`) expect a normal DOM.',
          'Forms, focus handling and accessibility tooling have Shadow DOM quirks.',
          'Emulated output is ordinary CSS, so it is predictable and fast.',
        ],
      },
      { type: 'heading3', text: 'Why not None by default?' },
      {
        type: 'code',
        lang: 'css',
        code: `/* product-card.component.css with ViewEncapsulation.None */
.title { font-size: 2rem; }
/* 💥 Once ProductCard loads, EVERY .title in the app (headers, dialogs…) becomes 2rem.
   And the result depends on load order — styles from lazy chunks appear later. */`,
      },
      { type: 'heading3', text: 'What Emulated gives you' },
      {
        type: 'code',
        lang: 'css',
        code: `/* You write */
.title { font-size: 2rem; }

/* Angular emits (attribute names are generated) */
.title[_ngcontent-ng-c123] { font-size: 2rem; }
/* Matches only elements in THIS component's template.
   Global rules like body { font-family: ... } still cascade in. */`,
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: mention that the default can be changed app-wide (`defaultEncapsulation` in compiler options), and that `:host`, `:host-context()` and CSS variables are the tools for styling across the boundary.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What is the default `ViewEncapsulation` mode (`Emulated`) in Angular and how does it scope component styles via unique attributes (`_ngcontent-xxx`)?',
      },
      {
        type: 'paragraph',
        text: "With `Emulated`, the compiler gives each component type a unique id. Every element in its template gets an `_ngcontent-<id>` attribute, the host element gets `_nghost-<id>`, and every selector in the component's CSS is rewritten to require that attribute (`.btn` → `.btn[_ngcontent-<id>]`, `:host` → `[_nghost-<id>]`). So the rules can only match that component's own elements.",
      },
      {
        type: 'paragraph',
        text: 'The scoping is purely selector rewriting — the styles are still injected into a `<style>` tag in `<head>`, once per component type (not per instance). Because all instances share the same id, all instances get the styles.',
      },
      { type: 'heading3', text: 'Before and after' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-card',
  template: \`<h2 class="title">Hi</h2><ng-content />\`,
  styles: \`
    :host { display: block; border: 1px solid #ddd; }
    .title { color: teal; }
    :host(.featured) .title { color: gold; }
  \`,
})
export class CardComponent {}`,
      },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- Rendered DOM (ids are generated, e.g. ng-c1234) -->
<app-card _nghost-ng-c1234 class="featured">
  <h2 _ngcontent-ng-c1234 class="title">Hi</h2>
  <p _ngcontent-ng-c999>Projected paragraph</p>  <!-- carries the PARENT's id -->
</app-card>

<style>
  [_nghost-ng-c1234] { display: block; border: 1px solid #ddd; }
  .title[_ngcontent-ng-c1234] { color: teal; }
  .featured[_nghost-ng-c1234] .title[_ngcontent-ng-c1234] { color: gold; }
</style>`,
      },
      { type: 'heading3', text: 'Consequences' },
      {
        type: 'bullets',
        items: [
          "Child components' internal elements have a different id, so a parent's `.title` rule does not reach them.",
          "Projected content keeps the attribute of the component that declared it (the parent), so the child's styles don't apply to it — style it from the parent or with `::ng-deep`.",
          "Elements created outside Angular's template (e.g. `innerHTML`, a jQuery plugin) have no `_ngcontent` attribute, so scoped rules don't match them.",
          'The attribute raises selector specificity slightly (+1 attribute), which can matter when overriding global styles.',
          "`::ng-deep` removes the attribute requirement for the rest of the selector — deprecated but still supported; scope it under `:host` so it doesn't become global.",
        ],
      },
      {
        type: 'flow',
        title: 'What the compiler does',
        code: `flowchart LR
  A["Component CSS<br/>.title"]:::client --> B["Compiler assigns id<br/>ng-c1234"]:::server
  B --> C["Template elements get<br/>_ngcontent-ng-c1234"]
  B --> D["Host gets<br/>_nghost-ng-c1234"]
  B --> E["Selector rewritten<br/>.title[_ngcontent-ng-c1234]"]:::highlight
  E --> F["style tag in head,<br/>once per component type"]:::db`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: styling `innerHTML` content or a third-party widget from your component CSS "doesn\'t work" because those nodes lack the `_ngcontent` attribute. Use `:host ::ng-deep .x`, a global stylesheet, or `ViewEncapsulation.None` with a unique wrapper class.',
      },
      { type: 'divider' },
      {
        type: 'heading3',
        text: 'Follow-up: What happens to CSS styles when component encapsulation (`ViewEncapsulation.None`) is set to None?',
      },
      {
        type: 'paragraph',
        text: "Angular skips the selector rewriting, so the component's CSS is injected into `<head>` exactly as written and becomes global: it affects every matching element in the app, including other components, once this component has been loaded. It stays applied even after the component is destroyed.",
      },
      {
        type: 'paragraph',
        text: "With None, the component's stylesheet behaves like a global stylesheet that is added lazily — at the moment the component is first rendered. That timing makes styling depend on navigation order, which is the main source of bugs.",
      },
      { type: 'heading3', text: 'Example of leakage' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-promo',
  template: \`<button class="btn">Buy now</button>\`,
  styles: \`.btn { background: red; }\`,
  encapsulation: ViewEncapsulation.None,
})
export class PromoComponent {}

// User visits /home  → buttons look normal
// User visits /promo → PromoComponent loads, <style>.btn{background:red}</style> added to <head>
// User goes back to /home → ALL .btn buttons are now red 😬 (styles are not removed)`,
      },
      { type: 'heading3', text: 'Using None safely' },
      {
        type: 'code',
        lang: 'scss',
        code: `/* Prefix every rule with the component's selector so it can't leak */
app-promo .btn { background: red; }

/* Legit use: styling content you don't control, e.g. a rich-text editor or innerHTML */
app-article-body h2 { margin-top: 2rem; }
app-article-body img { max-width: 100%; }`,
      },
      {
        type: 'bullets',
        items: [
          '`:host` has no meaning without encapsulation — use the element selector instead.',
          'Good uses: theming third-party components, styling `innerHTML`/markdown output, defining design-system styles in one component.',
          'Specificity and source order now decide conflicts with your global styles.',
          'Alternatives that keep scoping: CSS custom properties, `:host ::ng-deep`, or putting the rules in `styles.css`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Pitfall: "the style only breaks after I open a certain page" is the classic symptom of a `ViewEncapsulation.None` component with unprefixed selectors.',
      },
    ],
  },

  'How can you apply global styles or pass specific parent component styles down to child components in Angular (`:host-context()`, CSS variables)?':
    {
      summary:
        'Global styles go in `styles.css`/`styles.scss` (listed in `angular.json`) and apply everywhere. To influence a child from a parent, the cleanest tool is CSS custom properties — they inherit through encapsulation boundaries, so the parent sets `--x` and the child uses `var(--x)`. `:host-context(.theme-dark)` lets a child style itself based on an ancestor class; `::ng-deep` forces styles into children but is deprecated, so use it only as a last resort.',
      details: [
        {
          type: 'paragraph',
          text: 'Emulated encapsulation blocks a parent\'s selectors from matching a child\'s internal elements. But inheritance still works: inherited properties (color, font) and CSS variables flow down the DOM tree regardless of `_ngcontent` attributes. That makes variables the "public styling API" of a component.',
        },
        { type: 'heading3', text: '1. Global stylesheet' },
        {
          type: 'code',
          lang: 'json',
          code: `// angular.json → projects.app.architect.build.options
"styles": ["src/styles.scss", "node_modules/some-lib/theme.css"]`,
        },
        { type: 'heading3', text: '2. CSS variables — the recommended way' },
        {
          type: 'code',
          lang: 'scss',
          code: `/* child: button.component.scss — exposes knobs with defaults */
:host { display: inline-block; }
button {
  background: var(--btn-bg, #2563eb);
  color: var(--btn-fg, white);
  border-radius: var(--btn-radius, 6px);
}

/* parent: checkout.component.scss — sets the knobs */
.danger-zone app-button {
  --btn-bg: #dc2626;
  --btn-radius: 0;
}`,
        },
        { type: 'heading3', text: '3. :host-context() — react to an ancestor' },
        {
          type: 'code',
          lang: 'scss',
          code: `/* card.component.scss */
:host { background: white; color: #111; }

/* If ANY ancestor (e.g. <body> or a wrapper) has .theme-dark */
:host-context(.theme-dark) { background: #1f2937; color: #f9fafb; }

/* Compiles to something like:
   .theme-dark[_nghost-ng-c1], .theme-dark [_nghost-ng-c1] { ... } */`,
        },
        { type: 'heading3', text: '4. ::ng-deep (last resort)' },
        {
          type: 'code',
          lang: 'scss',
          code: `/* parent.component.scss — reaches into a third-party child */
:host ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
/* Always prefix with :host so it doesn't become a global rule */`,
        },
        {
          type: 'bullets',
          items: [
            'CSS variables: keep encapsulation, work with ShadowDom too, can be changed at runtime with `[style.--btn-bg]`.',
            '`:host-context()` is good for theme/RTL classes on `<body>` or `<html>`; note it is not supported for native Shadow DOM in all browsers, but works fine with Emulated.',
            '`::ng-deep` is deprecated (no removal date announced) because it breaks encapsulation — prefer variables or library theming APIs.',
            'Inherited properties like `font-family` and `color` already flow from parent to child without any special syntax.',
          ],
        },
        {
          type: 'flow',
          title: 'Choosing a technique',
          code: `flowchart TD
  Q{What do you need?} -->|"App-wide base styles"| G["styles.scss"]:::server
  Q -->|"Parent customizes child"| V["CSS custom properties"]:::highlight
  Q -->|"Child reacts to ancestor class"| H[":host-context()"]:::server
  Q -->|"Override 3rd-party internals"| D[":host ::ng-deep"]:::security`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: say "I design components with CSS variables as their styling API" — that is the modern answer, and it also explains how Angular Material\'s token-based theming works.',
        },
      ],
    },

  'How can you dynamically apply different styles or themes to the same CSS class across multiple component instances in Angular?':
    {
      summary:
        'Keep one CSS class whose rules read CSS custom properties, and give each instance different variable values — via an input bound to `[style.--var]` on the host, a modifier class/attribute on the host, or an ancestor theme class. The CSS is shared; only the variables differ per instance, so no duplicated stylesheets or inline style soup.',
      details: [
        {
          type: 'paragraph',
          text: "A component's styles are compiled once per component type, not per instance. To make instance #1 blue and instance #2 green, you vary data, not CSS: the class reads `var(--accent)`, and each instance supplies its own `--accent`.",
        },
        { type: 'heading3', text: 'Per-instance theme via input + host binding' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'app-tile',
  template: \`<div class="tile"><ng-content /></div>\`,
  styles: \`
    .tile {
      background: var(--tile-bg, #f3f4f6);
      border-left: 4px solid var(--tile-accent, #6b7280);
      padding: var(--tile-pad, 1rem);
    }
  \`,
  host: {
    '[style.--tile-accent]': 'accent()',
    '[style.--tile-bg]': 'background()',
    '[attr.data-variant]': 'variant()',
  },
})
export class TileComponent {
  accent = input<string>();
  background = input<string>();
  variant = input<'default' | 'compact'>('default');
}

// <app-tile accent="#16a34a">Revenue</app-tile>
// <app-tile accent="#dc2626" background="#fef2f2">Errors</app-tile>
// Same .tile class, different look per instance.`,
        },
        { type: 'heading3', text: 'Named variants via host attribute/class' },
        {
          type: 'code',
          lang: 'scss',
          code: `:host([data-variant='compact']) { --tile-pad: 0.25rem; }
:host(.danger) { --tile-accent: #dc2626; }

/* <app-tile variant="compact" class="danger">…</app-tile> */`,
        },
        { type: 'heading3', text: 'App-wide theme switching' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// styles.scss
// :root            { --surface: #fff;    --text: #111; }
// [data-theme=dark] { --surface: #111827; --text: #f9fafb; }

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private doc = inject(DOCUMENT);
  theme = signal<'light' | 'dark'>('light');
  constructor() {
    effect(() => this.doc.documentElement.setAttribute('data-theme', this.theme()));
  }
}
// Every component using var(--surface) updates instantly — no re-render needed.`,
        },
        {
          type: 'bullets',
          items: [
            'CSS variables cascade, so a wrapper can theme a whole subtree: `<section style="--tile-accent: purple">`.',
            'Changing a variable is a pure CSS update — very cheap compared to swapping classes on many elements.',
            'For a small fixed set of themes, modifier classes (`.tile--warning`) are fine; for arbitrary values (user-chosen brand colors) use variables.',
            'Avoid `ViewEncapsulation.None` + per-instance generated CSS — it leaks and grows.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: point out that styles are per component type, not per instance — so per-instance theming must come from bindings (variables/classes), which is exactly why CSS custom properties are the right tool.',
        },
      ],
    },
};
