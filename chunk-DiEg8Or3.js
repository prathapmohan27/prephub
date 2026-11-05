var e={"What does accessibility mean for a web app, and what do WCAG levels A, AA and AAA require?":{summary:`Accessibility means people with disabilities (visual, motor, hearing, cognitive), whether permanent, temporary or situational, can perceive, operate and understand the app with whatever they use: keyboard, screen reader, zoom, voice control or switch devices. WCAG organises this under four principles (Perceivable, Operable, Understandable, Robust) and grades success criteria as A (the minimum), AA (the level laws and contracts ask for) and AAA (the strictest, used for specific content rather than whole sites). The current version is WCAG 2.2, and in practice the target is **WCAG 2.2 AA**.`,details:[{type:`paragraph`,text:`WCAG (Web Content Accessibility Guidelines) is a W3C standard. Each guideline has testable **success criteria**, and each criterion has a level. Conformance is cumulative: AA means every A and every AA criterion is met on every page, for full processes (you cannot be "AA except checkout").`},{type:`heading3`,text:`POUR in one line each`},{type:`bullets`,items:[`**Perceivable**: text alternatives for images, captions for video, enough contrast, content that survives zoom and reflow.`,`**Operable**: everything works by keyboard, focus is visible and never trapped, no time limits that cannot be extended, no seizure-inducing flashes.`,`**Understandable**: clear labels and instructions, predictable navigation, errors identified and explained.`,`**Robust**: valid semantics so assistive technology can read the name, role, state and value of every control.`]},{type:`heading3`,text:`What the levels look like in practice`},{type:`bullets`,items:[`**A**: non-text content has alternatives (1.1.1), info and relationships are in markup (1.3.1), keyboard access (2.1.1), no keyboard trap (2.1.2), page titles (2.4.2), labels or instructions (3.3.2), name/role/value (4.1.2).`,`**AA**: contrast 4.5:1 for normal text and 3:1 for large text (1.4.3), 3:1 for UI components and focus indicators (1.4.11), resize text to 200% (1.4.4), reflow at 320 CSS px (1.4.10), focus visible (2.4.7), status messages announced (4.1.3).`,`**AAA**: contrast 7:1, sign language for video, no timing at all, larger focus appearance. Rarely required for a whole product.`]},{type:`heading3`,text:`What WCAG 2.2 added (October 2023)`},{type:`bullets`,items:[`**2.4.11 Focus Not Obscured (Minimum), AA**: the focused element must not be fully hidden by sticky headers, cookie banners or chat widgets.`,`**2.5.7 Dragging Movements, AA**: anything done by dragging (sortable lists, sliders, maps) needs a single-pointer alternative such as buttons.`,`**2.5.8 Target Size (Minimum), AA**: pointer targets at least **24×24 CSS px**, or enough spacing around them.`,`**3.3.8 Accessible Authentication (Minimum), AA**: no cognitive tests to log in; allow paste and password managers, support passkeys or email links.`,`**3.2.6 Consistent Help** and **3.3.7 Redundant Entry** at level A. WCAG 2.2 also removed 4.1.1 Parsing as obsolete.`]},{type:`heading3`,text:`Why it matters beyond ethics`},{type:`paragraph`,text:`Legal exposure is real. In the EU, the **European Accessibility Act** has applied since **28 June 2025** to e-commerce, banking, transport and other consumer services, using EN 301 549 (which maps to WCAG AA). In the US, the **ADA** is routinely used for lawsuits against inaccessible websites, and public-sector procurement (Section 508) asks for a conformance report (VPAT/ACR). Accessible apps also have better SEO, better keyboard UX for power users, and work better on mobile and in bright sunlight.`},{type:`callout`,variant:`tip`,text:`Interview tip: do not just recite levels. Say "we target WCAG 2.2 AA", name two or three of the new 2.2 criteria, and explain how you build it into the process: design tokens with checked contrast, accessible component library, lint rules and axe in CI, and a manual keyboard and screen-reader pass before release.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`What is the difference between WCAG 2.1 and 2.2?`,`Who in the team owns accessibility: design, dev or QA?`,`How would you bring an existing inaccessible app up to AA?`]}]},"Why should you start with semantic HTML, and when do you actually need ARIA?":{summary:"Native elements like `<button>`, `<a href>`, `<label>`, `<nav>` and `<h1>`–`<h6>` give you role, accessible name, keyboard behaviour, focus and states for free, and browsers and screen readers have supported them for decades. ARIA only changes what assistive technology is told; it adds no behaviour. So the first rule of ARIA is: if a native element does the job, use it. Reach for ARIA when there is no native equivalent (tabs, combobox, tree), to expose state (`aria-expanded`, `aria-current`), to connect things (`aria-describedby`, `aria-controls`) or for live regions.",details:[{type:`paragraph`,text:'Compare what you get with a real button versus a styled `div`. The `<button>` is in the tab order, activates on Enter and Space, announces as "button", supports `disabled`, and submits forms. The `div` needs all of that rebuilt by hand, and people usually forget half of it.'},{type:`code`,lang:`html`,code:`<!-- Bad: looks like a button, but is not one -->
<div class="btn" (click)="save()">Save</div>

<!-- "Fixed" with ARIA: still needs tabindex, Enter AND Space handling -->
<div class="btn" role="button" tabindex="0"
     (click)="save()" (keydown.enter)="save()" (keydown.space)="$event.preventDefault(); save()">Save</div>

<!-- Right: zero extra code -->
<button type="button" class="btn" (click)="save()">Save</button>`},{type:`callout`,variant:`warning`,text:'No ARIA is better than bad ARIA. `role="button"` on a div without keyboard handling, `aria-hidden="true"` on something that can still receive focus, or `role="menu"` on a site navigation (which tells screen readers to expect application-style arrow-key menus) all make the experience worse than plain HTML would.'},{type:`heading3`,text:`Semantic structure screen-reader users rely on`},{type:`bullets`,items:['**Landmarks**: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. Users jump between them. If there are two navs, label them: `<nav aria-label="Breadcrumb">`.',"**Headings**: one `<h1>` per view and no skipped levels. Many screen-reader users navigate by headings first.",'**Lists and tables**: `<ul>` announces "list, 5 items"; `<table>` with `<th scope="col">` lets users hear column headers as they move.',"**Forms**: `<label for>` gives the input its name and a bigger click target; `<fieldset>` + `<legend>` groups radios.","**Links vs buttons**: links navigate (`<a routerLink>`), buttons perform actions. Never use `<a>` without `href` as a button."]},{type:`heading3`,text:`When ARIA is the right tool`},{type:`bullets`,items:['**State**: `aria-expanded` on a disclosure button, `aria-pressed` on a toggle, `aria-selected` on tabs, `aria-current="page"` on the active nav link.',"**Relationships**: `aria-describedby` for hints and errors, `aria-labelledby` to name a dialog by its heading, `aria-controls`.",`**Composite widgets with no native element**: tabs, tree, grid, combobox, following the WAI-ARIA Authoring Practices Guide (APG).`,'**Live regions**: `role="status"` / `aria-live` for async updates.','**Names for icon-only controls**: `aria-label="Close"` on a button that only shows an X icon.']},{type:`paragraph`,text:`In Angular, put ARIA state on the host element with host bindings so it always matches the component state:`},{type:`code`,lang:`typescript`,code:`@Directive({
  selector: 'button[appDisclosure]',
  host: {
    type: 'button',
    '[attr.aria-expanded]': 'open()',
    '[attr.aria-controls]': 'panelId()',
    '(click)': 'open.set(!open())',
  },
})
export class DisclosureDirective {
  readonly panelId = input.required<string>({ alias: 'appDisclosure' });
  readonly open = model(false);
}

// Active nav link: Angular sets aria-current for you
// <a routerLink="/orders" routerLinkActive="active" ariaCurrentWhenActive="page">Orders</a>`},{type:`callout`,variant:`tip`,text:"Interview tip: quote the first rule of ARIA and then show you know where ARIA is genuinely needed: state (`aria-expanded`), relationships (`aria-describedby`) and widget patterns from the APG. That shows judgement, not just knowledge of attributes."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["What is the accessible name, and how is it computed (`aria-labelledby` > `aria-label` > label/content > `title`)?","What is the difference between `aria-hidden`, `hidden`, `inert` and `display: none`?","Why might `aria-label` on a plain `div` be ignored?"]}]},"How do you make a custom component such as a dropdown or tabs fully keyboard accessible?":{summary:"Follow the matching WAI-ARIA Authoring Practices pattern: correct roles and states, one Tab stop for the whole widget, arrow keys to move inside it (roving `tabindex` or `aria-activedescendant`), Home/End, Escape to close popups, and focus returning to the trigger. For tabs that means `tablist`/`tab`/`tabpanel` with `aria-selected` and `aria-controls`; for a dropdown it means a menu button or combobox/listbox with `aria-expanded`. Before building it, check whether a native element or a CDK primitive (CDK Menu, CDK Listbox, `FocusKeyManager`) already does it.",details:[{type:`paragraph`,text:`Keyboard users expect composite widgets to behave like desktop controls: **Tab moves into and out of the widget**, arrows move within it. If every tab is a separate Tab stop, a list of 20 options costs 20 key presses to get past.`},{type:`heading3`,text:`Tabs with roving tabindex (signals + @for)`},{type:`code`,lang:`typescript`,code:`export interface Tab { id: string; label: string; content: TemplateRef<unknown>; }

@Component({
  selector: 'app-tabs',
  imports: [NgTemplateOutlet],
  template: \`
    <div role="tablist" [attr.aria-label]="label()" (keydown)="onKeydown($event)">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button #tabBtn type="button" role="tab"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="i === selected()"
          [attr.aria-controls]="'panel-' + tab.id"
          [tabIndex]="i === selected() ? 0 : -1"
          (click)="select(i)">{{ tab.label }}</button>
      }
    </div>
    @for (tab of tabs(); track tab.id; let i = $index) {
      <div role="tabpanel" tabindex="0"
        [id]="'panel-' + tab.id"
        [attr.aria-labelledby]="'tab-' + tab.id"
        [hidden]="i !== selected()">
        <ng-container [ngTemplateOutlet]="tab.content" />
      </div>
    }
  \`,
})
export class TabsComponent {
  readonly label = input.required<string>();
  readonly tabs = input.required<Tab[]>();
  readonly selected = model(0);
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  select(i: number) {
    this.selected.set(i);
    this.buttons()[i].nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent) {
    const last = this.tabs().length - 1;
    const current = this.selected();
    const next: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    if (event.key in next) {
      event.preventDefault();
      this.select(next[event.key]); // automatic activation: focus = select
    }
  }
}`},{type:`bullets`,items:['Only the selected tab has `tabindex="0"`; the rest have `-1`, so Tab goes from the tablist straight into the panel.','`[attr.aria-selected]` renders `"true"`/`"false"`; `false` must be present, not removed.','The panel gets `tabindex="0"` so it is reachable when it has no focusable content.',`Use manual activation (arrows move focus, Enter/Space selects) if loading a panel is expensive.`]},{type:`heading3`,text:`Dropdowns: pick the right pattern first`},{type:`bullets`,items:["**Choosing a value in a form**: a native `<select>` is the most robust option. Style it rather than replace it if you can.",'**Actions menu** ("Edit, Duplicate, Delete"): menu button pattern, `aria-haspopup="menu"` + `aria-expanded` on the trigger, `role="menu"` / `menuitem`, arrows, Escape closes and returns focus. CDK Menu (`cdkMenuTriggerFor`) implements this.','**Searchable select / autocomplete**: combobox pattern. Focus stays in the input; `aria-activedescendant` points at the highlighted `role="option"` in a `role="listbox"`; `aria-expanded` and `aria-controls` on the input.',"**Show/hide content** (FAQ, filters): just a disclosure button with `aria-expanded`. Not a menu."]},{type:`code`,lang:`html`,code:`<input role="combobox" aria-autocomplete="list"
  [attr.aria-expanded]="open()" aria-controls="city-list"
  [attr.aria-activedescendant]="activeId()" (keydown)="onKeydown($event)" />
<ul id="city-list" role="listbox" [hidden]="!open()">
  @for (city of results(); track city.id) {
    <li role="option" [id]="'city-' + city.id"
        [attr.aria-selected]="city.id === activeCity()?.id">{{ city.name }}</li>
  }
</ul>`},{type:`callout`,variant:`warning`,text:'Never use a positive `tabindex` (1, 2, 3...) to "fix" order. It overrides the DOM order for the whole page and is almost impossible to maintain. Fix the DOM order instead, and use only `0` and `-1`. Also never remove the focus outline without a visible replacement.'},{type:`callout`,variant:`tip`,text:"Interview tip: name the APG pattern, then the three keyboard rules (one Tab stop, arrows inside, Escape returns focus). Mentioning roving `tabindex` vs `aria-activedescendant`, and when you would use each (focus must stay in an input for a combobox), signals real experience."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Automatic vs manual tab activation: when do you choose each?`,`How do you add type-ahead to a listbox?`,`How would you test this component (harness tests, Playwright keyboard tests, screen reader)?`]}]},"How do you manage focus in a single-page app: on route changes, in modals, and with focus traps?":{summary:"In an SPA the browser no longer resets focus on navigation, so you do it yourself: after a route change, move focus to the new main heading (or a skip target) and update the page title, so screen-reader users hear where they are. Modals must move focus inside on open, keep Tab cycling within the dialog, close on Escape, make the background inert, and return focus to the trigger on close. Use the CDK Dialog or `cdkTrapFocus`, or the native `<dialog>` with `showModal()`, rather than hand-rolling a trap.",details:[{type:`paragraph`,text:"Without focus management, clicking a link in a client-side router leaves focus on the clicked link (or on `body` if it was removed). A sighted mouse user sees new content; a screen-reader user hears nothing and a keyboard user has to Tab from the top of the page again."},{type:`heading3`,text:`Route changes: focus the main heading`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: \`
    <a class="skip-link" href="#main" (click)="focusMain($event)">Skip to main content</a>
    <app-header />
    <main id="main" tabindex="-1"><router-outlet /></main>
  \`,
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), skip(1), takeUntilDestroyed())
      .subscribe(() =>
        // wait until the new view has rendered
        afterNextRender(() => this.focusHeading(), { injector: this.injector }),
      );
  }

  private focusHeading() {
    const target =
      this.doc.querySelector<HTMLElement>('main h1') ??
      this.doc.querySelector<HTMLElement>('main');
    if (!target) return;
    target.setAttribute('tabindex', '-1'); // focusable by script, not in Tab order
    target.focus({ preventScroll: false });
  }

  focusMain(event: Event) {
    event.preventDefault();
    this.doc.getElementById('main')?.focus();
  }
}`},{type:`bullets`,items:["`skip(1)` avoids stealing focus on the initial page load.","Set route `title`s (or a custom `TitleStrategy`) so the document title changes too; screen readers and browser history use it.",`Do not move focus for in-page changes like filters or query-param updates; announce them with a live region instead.`,"Style `h1:focus` subtly (or not at all) since it is not interactive, but keep visible focus on real controls."]},{type:`heading3`,text:`Modals: the full checklist`},{type:`numbered`,items:[`On open, move focus into the dialog: the first field, or the heading/close button for informational dialogs.`,'Name it: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at the title.',"Trap Tab and Shift+Tab inside, and make the rest of the page `inert` so screen-reader virtual cursors cannot wander out.",`Escape closes it (unless it is a destructive confirmation that needs an explicit choice).`,`On close, restore focus to the element that opened it, or to a sensible place if that element is gone.`]},{type:`code`,lang:`typescript`,code:`// Option 1: CDK Dialog does all five steps (focus trap, aria-modal, restore focus)
private readonly dialog = inject(Dialog);
openEdit(user: User) {
  this.dialog.open(EditUserDialog, { data: user, ariaLabelledBy: 'edit-user-title' });
}

// Option 2: your own overlay with the cdkTrapFocus directive (A11yModule)
// <div role="dialog" aria-modal="true" aria-labelledby="t" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
//   <h2 id="t">Delete project?</h2> ...
// </div>
// AutoCapture focuses the first tabbable element and restores focus on destroy.`},{type:`paragraph`,text:"The native `<dialog>` element opened with `showModal()` is also a good option today: it renders in the top layer, makes the rest of the page inert, closes on Escape and returns focus to the previously focused element in current browsers."},{type:`callout`,variant:`warning`,text:'A focus trap is only correct for modal content. Trapping focus in a non-modal panel, a cookie banner or a chat widget violates "no keyboard trap" (2.1.2). And with sticky headers, make sure the newly focused element is not hidden under them (2.4.11 Focus Not Obscured), for example with `scroll-padding-top`.'},{type:`callout`,variant:`tip`,text:`Interview tip: structure the answer as "route changes, modals, everything else" and mention that you restore focus on close. Forgetting focus restoration is the most common modal bug, and naming it shows you have tested with a keyboard.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`Where does focus go when the item a user just deleted disappears from a list?`,`Heading focus vs announcing the new page title with a live region: trade-offs?`,'How does `inert` differ from `aria-hidden="true"`?']}]},"How do you make dynamic content and form errors announced to screen-reader users?":{summary:'Screen readers only read what has focus or what changes inside a live region, so async updates ("3 results found", "Saved") go into a polite live region (`role="status"`) that already exists in the DOM, or through the CDK `LiveAnnouncer`. Urgent messages use `role="alert"` (assertive), sparingly. For forms, each error is linked to its field with `aria-describedby`, the field gets `aria-invalid="true"`, and on submit you focus the first invalid field or an error summary, so errors are both announced and discoverable.',details:[{type:`heading3`,text:`Live regions: the rules that make them work`},{type:`bullets`,items:["The live region must be in the DOM **before** its content changes. Inserting an element that already has `aria-live` with text in it is often not announced.",'`role="status"` = `aria-live="polite"`: announced when the user is idle. Use for search results, "saved", loading done.','`role="alert"` = `aria-live="assertive"`: interrupts. Use only for time-critical errors, never for routine messages.',`Keep messages short and meaningful ("12 results for laptop"), and do not announce every keystroke; debounce.`,`This is WCAG **4.1.3 Status Messages** (AA): status changes must be announced without moving focus.`]},{type:`heading3`,text:`Async results with LiveAnnouncer`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-product-search',
  template: \`
    <label for="q">Search products</label>
    <input id="q" type="search" [value]="query()" (input)="query.set($any($event.target).value)" />
    <ul>
      @for (p of results.value() ?? []; track p.id) { <li>{{ p.name }}</li> }
    </ul>
  \`,
})
export class ProductSearch {
  private readonly api = inject(ProductApi);
  private readonly announcer = inject(LiveAnnouncer);
  readonly query = signal('');
  readonly results = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.api.search(params).pipe(debounceTime(300)),
  });

  constructor() {
    effect(() => {
      if (!this.query() || this.results.isLoading()) return;
      if (this.results.error()) {
        this.announcer.announce('Search failed. Please try again.', 'assertive');
        return;
      }
      const count = this.results.value()?.length ?? 0;
      this.announcer.announce(count ? \`\${count} products found\` : 'No products found', 'polite');
    });
  }
}`},{type:`paragraph`,text:'`LiveAnnouncer` keeps one visually hidden live element at the end of `body`, so you avoid the "region added too late" problem. A declarative alternative is a persistent `<p role="status" class="cdk-visually-hidden">{{ statusMessage() }}</p>` in the template.'},{type:`heading3`,text:`Form errors wired correctly`},{type:`code`,lang:`html`,code:`<form [formGroup]="form" (ngSubmit)="submit()" novalidate>
  <label for="email">Email address</label>
  <input id="email" type="email" formControlName="email" autocomplete="email"
    aria-required="true"
    [attr.aria-invalid]="showError('email')"
    [attr.aria-describedby]="showError('email') ? 'email-hint email-error' : 'email-hint'" />
  <p id="email-hint">We send the receipt here.</p>
  @if (showError('email')) {
    <p id="email-error" class="error">
      <span aria-hidden="true">\u26A0</span> Enter an email like name&#64;example.com
    </p>
  }
  <button type="submit">Pay now</button>
</form>`},{type:`code`,lang:`typescript`,code:`showError(name: string) {
  const c = this.form.get(name)!;
  return c.invalid && (c.touched || this.submitted());
}

submit() {
  this.submitted.set(true);
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
    return;
  }
  // ...save
}`},{type:`bullets`,items:['Focusing the invalid field reads its label, its "invalid" state and the `aria-describedby` text in one go.','For long forms, render an error summary (`role="alert"` or focused heading) with links to each field.',`Error text must say how to fix it (3.3.3 Error Suggestion), and must not rely on red colour alone (1.4.1).`,`Validate on blur or submit, not on every keystroke, so users are not interrupted while typing.`,"Note the `&#64;`: a literal `@` in Angular templates is parsed as a block start."]},{type:`callout`,variant:`warning`,text:'Do not put `role="alert"` on every inline field error. When several fields fail at once the screen reader fires a burst of interruptions and the user hears a jumble. Prefer `aria-describedby` plus moving focus, and keep `alert` for one summary message.'},{type:`callout`,variant:`tip`,text:'Interview tip: mention the "live region must exist before content changes" rule and the polite vs assertive choice. Then describe the form trio: `aria-invalid`, `aria-describedby`, focus the first error. That covers both halves of the question.'},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["Why is `aria-describedby` preferred over `aria-errormessage` today?",`How do you announce a toast that disappears after a few seconds (2.2.1 Timing Adjustable)?`,`How do you announce a loading state without spamming the user?`]}]},"What are the colour contrast, motion and zoom requirements, and how do you check them?":{summary:"Contrast at AA is **4.5:1** for normal text and **3:1** for large text (24px, or about 18.66px bold), and **3:1** for UI component boundaries, icons and focus indicators against adjacent colours. Motion must respect `prefers-reduced-motion`, anything that auto-moves for more than five seconds needs pause/stop, and nothing should flash more than three times a second. For zoom, text must resize to 200% and content must reflow at **320 CSS px** width (400% zoom on a 1280px screen) without two-dimensional scrolling. I check with DevTools, axe, a contrast analyser and by actually zooming the app.",details:[{type:`heading3`,text:`Contrast`},{type:`bullets`,items:[`**1.4.3 Contrast (Minimum), AA**: 4.5:1 for body text, 3:1 for large text. Placeholder text counts too, and disabled controls are exempt.`,`**1.4.11 Non-text Contrast, AA**: 3:1 for input borders, checkbox outlines, icons that convey meaning, chart lines, and focus rings.`,`**1.4.1 Use of Colour, A**: never use colour alone; add an icon, text or underline (red error text gets an icon and a message; links in body text get underlines).`,`AAA raises text to 7:1. Text over images needs an overlay or scrim; check the worst spot.`]},{type:`paragraph`,text:"The best fix is upstream: define colour tokens in the design system as checked pairs (for example `--text-on-surface`, `--text-on-primary`), and verify both light and dark themes. Then components cannot pick a failing combination by accident."},{type:`code`,lang:`scss`,code:`:root {
  --focus-ring: #1d4ed8; /* 3:1+ against the surfaces it sits on */
}

/* Visible focus for keyboard users, not on mouse click */
:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}

/* Windows High Contrast / forced colours: let the system colours win */
@media (forced-colors: active) {
  .btn { border: 1px solid ButtonText; }
}

/* Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Target size (2.5.8): at least 24x24 CSS px */
.icon-btn { min-inline-size: 24px; min-block-size: 24px; }`},{type:`callout`,variant:`warning`,text:"`outline: none` (often in a CSS reset) without a replacement removes the only cue keyboard users have, failing 2.4.7 Focus Visible. Use `:focus-visible` to style keyboard focus instead of deleting it."},{type:`heading3`,text:`Motion in Angular code`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class MotionPreference {
  private readonly query = inject(DOCUMENT).defaultView?.matchMedia('(prefers-reduced-motion: reduce)');
  readonly reduced = signal(this.query?.matches ?? false);

  constructor() {
    this.query?.addEventListener('change', (e) => this.reduced.set(e.matches));
  }
}

// usage: skip parallax, auto-playing carousels and smooth scrolling
// window.scrollTo({ top: 0, behavior: this.motion.reduced() ? 'auto' : 'smooth' });`},{type:`paragraph`,text:`**2.2.2 Pause, Stop, Hide** (A) requires a pause control for carousels and auto-updating content that runs longer than five seconds, and **2.3.1** forbids more than three flashes per second. Reduced motion does not mean no feedback: keep simple fades, remove large movement, zooming and parallax.`},{type:`heading3`,text:`Zoom, reflow and text spacing`},{type:`bullets`,items:["**1.4.4 Resize Text**: browser zoom to 200% with no loss of content. Use `rem` for font sizes and avoid fixed heights on text containers.",`**1.4.10 Reflow**: at 320 CSS px wide, no horizontal scrolling for normal content (data tables, maps and code are exempt). Responsive layouts with flex/grid usually pass.`,`**1.4.12 Text Spacing**: content still works when users increase line height, letter and word spacing; clipped text in fixed-height buttons is the usual failure.`,"Never disable pinch zoom (`user-scalable=no` or `maximum-scale=1` in the viewport meta)."]},{type:`heading3`,text:`How to check`},{type:`bullets`,items:["Chrome DevTools colour picker shows the contrast ratio; the Rendering panel emulates `prefers-reduced-motion`, `forced-colors` and vision deficiencies.",`axe DevTools / Lighthouse catch text contrast on solid backgrounds, but not over gradients or images, and not focus-ring contrast.`,`A desktop contrast analyser for sampling any pixel, plus design-time plugins in Figma.`,`Manually: zoom to 400% on a 1280px window (or set the viewport to 320px) and walk the main flows; turn on reduced motion at the OS level.`]},{type:`callout`,variant:`tip`,text:"Interview tip: quote the numbers precisely (4.5:1, 3:1, 320 CSS px, 24×24 px) and then move to process: checked colour tokens, a global `:focus-visible` style and a reduced-motion rule in the base stylesheet, so individual teams cannot get it wrong."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you handle dark mode contrast?`,`What counts as "large text" in CSS pixels?`,`How do you make a data table usable at 320px?`]}]},"What does the Angular CDK a11y package provide (`FocusTrap`, `LiveAnnouncer`, `FocusMonitor`, `ListKeyManager`)?":{summary:"`@angular/cdk/a11y` is a set of unstyled, tested accessibility primitives that Angular Material is built on. `FocusTrap` / `cdkTrapFocus` keeps Tab inside a region such as a dialog; `LiveAnnouncer` announces messages through a shared live region; `FocusMonitor` tells you how an element got focus (keyboard, mouse, touch or program) so you can show focus styles only for keyboard; and `ListKeyManager` with its `FocusKeyManager` and `ActiveDescendantKeyManager` subclasses implements arrow-key navigation, wrapping, Home/End and type-ahead for lists, menus and listboxes. It also includes `InteractivityChecker`, `AriaDescriber`, high-contrast detection and a visually-hidden utility.",details:[{type:`paragraph`,text:"The value for a senior engineer is consistency: instead of every team writing its own focus trap or arrow-key handler (each with different bugs), you build your design-system components on these primitives. Import the directives from `A11yModule` (or the standalone directives) and inject the services."},{type:`heading3`,text:`FocusTrap`},{type:`code`,lang:`html`,code:`<!-- Declarative: traps Tab, focuses first tabbable, restores focus when destroyed -->
<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="filters-title"
       cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
  <h2 id="filters-title">Filters</h2>
  <button cdkFocusInitial type="button">Apply</button>
</aside>`},{type:`paragraph`,text:"For programmatic control, inject `FocusTrapFactory` and call `create(element)`, then `focusInitialElementWhenReady()` and `destroy()`. `cdkFocusInitial`, `cdkFocusRegionStart` and `cdkFocusRegionEnd` mark where focus starts and the trap boundaries. CDK `Dialog` and Material `MatDialog` already use this internally."},{type:`heading3`,text:`LiveAnnouncer`},{type:`code`,lang:`typescript`,code:`private readonly announcer = inject(LiveAnnouncer);

async onSaved() {
  await this.announcer.announce('Profile saved', 'polite'); // or 'assertive'
}
// announcer.clear() empties the region, e.g. before navigating away`},{type:`heading3`,text:`FocusMonitor`},{type:`code`,lang:`typescript`,code:`@Directive({
  selector: '[appFocusOrigin]',
  host: { '[class.keyboard-focused]': "origin() === 'keyboard'" },
})
export class FocusOriginDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fm = inject(FocusMonitor);
  readonly origin = signal<FocusOrigin>(null);

  constructor() {
    this.fm.monitor(this.el, true)                 // true = also track children
      .pipe(takeUntilDestroyed())
      .subscribe((origin) => this.origin.set(origin));
    inject(DestroyRef).onDestroy(() => this.fm.stopMonitoring(this.el));
  }
}
// focusVia(el, 'keyboard') focuses programmatically with a chosen origin.
// The cdkMonitorElementFocus directive adds cdk-keyboard-focused / cdk-mouse-focused classes.`},{type:`heading3`,text:`ListKeyManager family`},{type:`bullets`,items:["`FocusKeyManager`: moves real DOM focus between items (roving tabindex). Items implement `FocusableOption` (`focus()`, optional `disabled`, `getLabel()` for type-ahead).","`ActiveDescendantKeyManager`: focus stays on the host (e.g. a combobox input); items implement `Highlightable` (`setActiveStyles()` / `setInactiveStyles()`) and you bind `aria-activedescendant`.","Configuration is fluent: `.withWrap()`, `.withVerticalOrientation()`, `.withHorizontalOrientation('ltr')`, `.withHomeAndEnd()`, `.withTypeAhead()`, and it skips disabled items."]},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-toolbar',
  host: { role: 'toolbar', '(keydown)': 'keyManager.onKeydown($event)' },
  template: \`<ng-content />\`,
})
export class Toolbar implements AfterContentInit {
  @ContentChildren(ToolbarButton) private buttons!: QueryList<ToolbarButton>;
  keyManager!: FocusKeyManager<ToolbarButton>;

  ngAfterContentInit() {
    this.keyManager = new FocusKeyManager(this.buttons)
      .withHorizontalOrientation('ltr')
      .withWrap()
      .withHomeAndEnd();
  }
}`},{type:`heading3`,text:`Other useful pieces`},{type:`bullets`,items:["`InteractivityChecker`: `isFocusable`, `isTabbable`, `isVisible` checks for an element.","`AriaDescriber`: adds `aria-describedby` text without you managing hidden elements (tooltips use it).","`HighContrastModeDetector` and the `cdk-visually-hidden` class (from the `cdk.a11y-visually-hidden()` mixin).",`Higher-level CDK packages build on this: CDK Menu, CDK Listbox, CDK Dialog, and Material components.`]},{type:`callout`,variant:`tip`,text:"Interview tip: for each primitive, give the problem it solves in one sentence, then say you would build design-system components on top of it. Mentioning `FocusKeyManager` vs `ActiveDescendantKeyManager` and when each fits (focus must stay in an input) is a strong senior signal."},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:["Why does `MatDialog` restore focus, and how do you change where it goes?","How would you build a listbox with `ActiveDescendantKeyManager`?",`When would you use CDK primitives instead of Angular Material?`]}]},"How do you test accessibility: automated tools, keyboard-only checks and screen readers?":{summary:`Use layers. Automated tools (Angular ESLint template accessibility rules, axe-core in unit and Playwright tests, Lighthouse) are cheap and run in CI, but they only catch part of the issues, mostly missing names, contrast and invalid ARIA. Then a manual keyboard-only pass on every new flow checks order, visible focus, traps and Escape. Finally a screen-reader check with NVDA and VoiceOver on key journeys confirms names, states and announcements make sense. Real users with disabilities, or an external audit, close the gap.`,details:[{type:`heading3`,text:`1. Static checks in the editor and CI`},{type:`code`,lang:`javascript`,code:`// eslint.config.js (angular-eslint flat config)
module.exports = tseslint.config(
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },
);
// Catches: missing alt text, labels not associated with controls, invalid ARIA attributes,
// click handlers without key handlers, interactive elements that are not focusable, autofocus.`},{type:`heading3`,text:`2. axe-core in end-to-end tests`},{type:`code`,lang:`typescript`,code:`import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('checkout has no detectable a11y violations', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Pay now' }).click(); // show error state too

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('#third-party-chat')
    .analyze();

  expect(results.violations).toEqual([]);
});

test('dialog is keyboard operable', async ({ page }) => {
  await page.goto('/projects');
  const trigger = page.getByRole('button', { name: 'Delete project' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Delete project?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused(); // focus restored
});`},{type:`bullets`,items:[`Scan states, not just pages: open menus, dialogs, validation errors, empty and loading states.`,'Role-based locators (`getByRole`, `getByLabel`) double as accessibility checks: if the test cannot find "Pay now" as a button, neither can a screen reader.',`Lighthouse gives a quick score in CI or DevTools, but it runs a subset of axe on one page state; do not treat 100 as "accessible".`]},{type:`callout`,variant:`warning`,text:`A clean axe run does not mean the app is accessible. Tools cannot judge whether alt text is meaningful, whether focus order is logical, whether a custom widget actually responds to arrow keys, or whether announcements make sense. Use automation as a floor, not as sign-off.`},{type:`heading3`,text:`3. Manual keyboard pass (five minutes per flow)`},{type:`numbered`,items:[`Put the mouse away. Tab through from the address bar: is there a skip link, and is every interactive element reachable?`,`Is focus always visible and never hidden behind a sticky header (2.4.11)?`,`Does the order follow the visual layout? Can you operate widgets with Enter, Space, arrows and Escape?`,`Open and close dialogs and menus: does focus go in, stay in, and come back?`,`After route changes, deletes and submits, where does focus land?`,`Zoom to 400% and repeat the main flow; enable reduced motion.`]},{type:`heading3`,text:`4. Screen readers`},{type:`bullets`,items:[`**NVDA** (free) with Firefox or Chrome on Windows; **JAWS** with Chrome is common among enterprise users.`,`**VoiceOver** with Safari on macOS and iOS; **TalkBack** with Chrome on Android for mobile web.`,`Navigate by headings, landmarks and form fields, not only by Tab; that is how users actually move around.`,`Listen for: every control has a name, role and state ("Filters, button, collapsed"), errors and status messages are announced, nothing decorative is read out.`]},{type:`paragraph`,text:`Make it part of the definition of done: lint and axe block the PR, the developer does a keyboard pass, QA or an accessibility champion does a screen-reader pass on new components, and periodic external audits or sessions with disabled users find what the team missed.`},{type:`callout`,variant:`tip`,text:`Interview tip: describe the layers and what each one catches, then admit the limitation of automation. Concrete details, like scanning the error state, asserting focus restoration in Playwright and naming NVDA + Firefox / VoiceOver + Safari pairings, show you have done it rather than read about it.`},{type:`heading3`,text:`Follow-ups they may ask`},{type:`bullets`,items:[`How do you stop accessibility regressions in a large team?`,`How do you prioritise a backlog of 300 axe violations?`,`How would you test a component library with Storybook and its a11y addon?`]}]}};export{e as answers};