import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'What is your understanding of the DOM? Explain with a real-time example.': {
    summary:
      "The DOM (Document Object Model) is the browser's in-memory, tree-shaped representation of an HTML page, exposed as objects that JavaScript can read and change. The browser parses HTML into DOM nodes, combines them with CSS to render the page, and whenever the DOM changes it updates what you see. Frameworks like Angular update the DOM for you based on component state.",
    details: [
      {
        type: 'paragraph',
        text: "HTML is just text. When the browser loads it, it builds a tree of node objects — `document` at the root, then `<html>`, `<head>`, `<body>` and every element, text node and attribute below. That tree is the DOM. It is a live API: change a node and the screen updates; the user types in an input and the node's `value` changes.",
      },
      { type: 'heading3', text: 'From HTML to the DOM tree' },
      {
        type: 'code',
        lang: 'html',
        code: `<body>
  <header>
    <h1>My Cart</h1>
  </header>
  <ul id="cart">
    <li>Laptop</li>
    <li>Mouse</li>
  </ul>
  <p>Total items: <span id="count">2</span></p>
</body>`,
      },
      {
        type: 'flow',
        title: 'The DOM tree for this page',
        code: `flowchart TD
  D[document]:::highlight --> B[body]:::server
  B --> H[header]:::server
  H --> H1["h1: 'My Cart'"]:::client
  B --> UL["ul#cart"]:::server
  UL --> L1["li: 'Laptop'"]:::client
  UL --> L2["li: 'Mouse'"]:::client
  B --> P[p]:::server
  P --> S["span#count: '2'"]:::client`,
        text: 'Each box is a node object with properties (textContent, classList, children) and methods (append, remove, addEventListener).',
      },
      { type: 'heading3', text: 'Real-time example: "Add to cart" on a shopping site' },
      {
        type: 'paragraph',
        text: 'When you click "Add to cart" on an e-commerce site, the page does not reload. JavaScript handles the click, creates a new `<li>`, appends it to the cart list, and updates the badge count — all by changing the DOM. The browser re-renders just what changed.',
      },
      {
        type: 'code',
        lang: 'javascript',
        code: `const cart = document.getElementById('cart');
const count = document.getElementById('count');

document.querySelector('#add-keyboard').addEventListener('click', () => {
  const item = document.createElement('li');  // 1. create a node
  item.textContent = 'Keyboard';
  cart.append(item);                          // 2. insert it into the tree
  count.textContent = cart.children.length;   // 3. update another node → '3'
});`,
      },
      { type: 'heading3', text: 'The same thing in Angular' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-cart',
  template: \`
    <ul>
      @for (item of items(); track item) { <li>{{ item }}</li> }
    </ul>
    <p>Total items: {{ items().length }}</p>
    <button (click)="add('Keyboard')">Add Keyboard</button>
  \`,
})
export class CartComponent {
  items = signal(['Laptop', 'Mouse']);
  add(name: string) {
    this.items.update((list) => [...list, name]); // Angular updates only the changed DOM nodes
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          'DOM ≠ HTML source: the DOM reflects runtime changes and browser fixes (e.g. auto-inserted `<tbody>`). "View source" shows HTML; DevTools Elements shows the DOM.',
          'The DOM is language-agnostic, defined by a WHATWG standard; JavaScript accesses it through `document` and `window`.',
          'DOM updates can trigger style recalculation, layout and paint — expensive when done repeatedly in loops.',
          'The "virtual DOM" (React) and Angular\'s compiled templates are both strategies to minimise real DOM operations.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: define it as "a live tree of objects representing the page", then give a concrete UI example (cart badge, notification count, live form validation) and mention that frameworks automate the same DOM updates.',
      },
    ],
  },

  'DOM manipulations': {
    summary:
      'DOM manipulation means using JavaScript to select, create, modify, move or remove elements, attributes, classes, styles and event listeners on a page. Core APIs are `querySelector/All`, `createElement`, `append/prepend/before/after`, `remove`, `textContent`, `classList`, `setAttribute`, `style` and `addEventListener`. In Angular you rarely touch the DOM directly — use bindings and control flow, or `Renderer2`/`ElementRef` when you must.',
    details: [
      {
        type: 'paragraph',
        text: 'Every DOM change can cost the browser a style recalculation, layout (reflow) and repaint. Good DOM manipulation means using the right API, batching changes, and avoiding unsafe HTML injection.',
      },
      { type: 'heading3', text: 'Selecting elements' },
      {
        type: 'code',
        lang: 'javascript',
        code: `document.getElementById('title');          // single element by id
document.querySelector('.card > h2');      // first match of any CSS selector
document.querySelectorAll('li.active');    // static NodeList → forEach works
document.getElementsByClassName('item');   // LIVE HTMLCollection (updates automatically)
element.closest('.card');                  // nearest ancestor matching selector`,
      },
      { type: 'heading3', text: 'Creating, inserting and removing' },
      {
        type: 'code',
        lang: 'javascript',
        code: `const li = document.createElement('li');
li.textContent = 'New task';          // safe: treated as text, not HTML
li.dataset.id = '42';                 // → data-id="42"

list.append(li);                      // end of list
list.prepend(li);                     // start (moves the same node)
existing.before(li);                  // sibling insertion
existing.replaceWith(li);
li.remove();

// Batch many inserts with a DocumentFragment → one reflow
const frag = document.createDocumentFragment();
['A', 'B', 'C'].forEach((t) => {
  const el = document.createElement('li');
  el.textContent = t;
  frag.append(el);
});
list.append(frag);`,
      },
      { type: 'heading3', text: 'Changing content, attributes, classes and styles' },
      {
        type: 'code',
        lang: 'javascript',
        code: `el.textContent = 'Hello';                // text only
el.innerHTML = '<b>Hello</b>';           // ⚠️ parses HTML — XSS risk with user data
el.setAttribute('aria-expanded', 'true');
el.getAttribute('href');
el.classList.add('active');
el.classList.toggle('open', isOpen);     // force on/off
el.style.setProperty('--accent', '#4338CA'); // CSS variable
el.hidden = true;

input.value = 'typed';                   // property (current value)
input.getAttribute('value');             // attribute (initial value)`,
      },
      { type: 'heading3', text: 'The Angular way' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-panel',
  template: \`
    <div [class.open]="open()" [style.--accent]="color()" [attr.aria-expanded]="open()">
      @if (open()) { <p>{{ message() }}</p> }
    </div>
    <button (click)="open.set(!open())">Toggle</button>
  \`,
})
export class PanelComponent {
  open = signal(false);
  color = signal('#4338CA');
  message = signal('Safe text — Angular escapes it');

  // Only when you must touch the element directly:
  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  highlight() {
    this.renderer.addClass(this.el.nativeElement, 'highlight'); // works with SSR too
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          '**Performance:** avoid reading layout (`offsetHeight`, `getBoundingClientRect`) between writes in a loop — it forces synchronous reflow ("layout thrashing"). Batch reads, then writes.',
          '**Security:** prefer `textContent` over `innerHTML`; sanitise any HTML from users. Angular sanitises `[innerHTML]` bindings automatically.',
          '**Events:** use event delegation for many similar children, and remove listeners you add manually.',
          'In Angular, direct `document` access breaks on the server (SSR) — use bindings, `Renderer2`, or run browser-only code in `afterNextRender`.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: using `innerHTML +=` inside a loop. It re-parses the whole content each time, destroys existing nodes (and their listeners), and is an XSS risk. Build nodes or a fragment instead.',
      },
    ],
  },

  'What is Event Delegation?': {
    summary:
      'Event delegation means attaching ONE listener to a common parent instead of a listener on every child. Thanks to event bubbling, a click on a child travels up to the parent, where you use `event.target` (usually with `closest()`) to work out which child was clicked. It saves memory and automatically works for children added later.',
    details: [
      {
        type: 'paragraph',
        text: 'Most DOM events propagate in three phases: capture (window → target), target, and bubble (target → window). Delegation uses the bubble phase: the parent "hears" every click inside it, so it can handle clicks for a list of 1,000 items with one function.',
      },
      {
        type: 'flow',
        title: 'A click bubbling up to the delegated listener',
        code: `flowchart BT
  BTN["button.delete (event.target)"]:::client --> LI["li data-id=3"]:::server
  LI --> UL["ul#todos — ONE listener here"]:::highlight
  UL --> BODY[body]:::external
  BODY --> DOC[document]:::external`,
        text: 'The listener on the `ul` checks `event.target.closest(...)` to decide what was clicked.',
      },
      { type: 'heading3', text: 'Without vs with delegation' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// ❌ One listener per item — memory heavy, and new items have no listener
document.querySelectorAll('#todos .delete').forEach((btn) =>
  btn.addEventListener('click', onDelete),
);

// ✅ One listener on the parent
document.getElementById('todos').addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('.delete');
  if (!deleteBtn) return;                          // click was elsewhere in the list
  const li = deleteBtn.closest('li');
  console.log('Delete todo', li.dataset.id);
  li.remove();
});

// Items added later work automatically
todos.insertAdjacentHTML('beforeend',
  '<li data-id="99">New <button class="delete">x</button></li>');`,
      },
      { type: 'heading3', text: 'target vs currentTarget' },
      {
        type: 'code',
        lang: 'javascript',
        code: `list.addEventListener('click', (e) => {
  e.target;        // the innermost element actually clicked (maybe a <span> inside the button)
  e.currentTarget; // the element the listener is attached to (the list)
});
// That's why closest() is used — target might be a child of the button.`,
      },
      { type: 'heading3', text: 'In Angular' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-todos',
  template: \`
    <ul (click)="onListClick($event)">
      @for (todo of todos(); track todo.id) {
        <li [attr.data-id]="todo.id">{{ todo.title }} <button class="delete">x</button></li>
      }
    </ul>
  \`,
})
export class TodosComponent {
  todos = signal([{ id: 1, title: 'Learn delegation' }]);

  onListClick(event: MouseEvent) {
    const li = (event.target as HTMLElement).closest('li');
    if ((event.target as HTMLElement).closest('.delete') && li) {
      const id = Number(li.dataset['id']);
      this.todos.update((t) => t.filter((x) => x.id !== id));
    }
  }
}`,
      },
      {
        type: 'bullets',
        items: [
          "Not all events bubble: `focus`, `blur`, `mouseenter`, `mouseleave` don't — use `focusin`/`focusout` or `mouseover`/`mouseout` instead.",
          '`event.stopPropagation()` in a child breaks delegation for that event.',
          "React attaches its handlers at the root using delegation; jQuery's `.on(event, selector, fn)` was built on it.",
          'In Angular, per-item `(click)` bindings are usually fine; delegation helps for very large lists or third-party HTML.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain bubbling first, then the benefits (fewer listeners, dynamic children), then write the `closest()` example. Mentioning non-bubbling events like `focus` shows depth.',
      },
    ],
  },

  'What is Flexbox?': {
    summary:
      'Flexbox (CSS Flexible Box Layout) is a one-dimensional layout model for arranging items in a row or a column. You set `display: flex` on a container, then control direction (`flex-direction`), alignment on the main axis (`justify-content`) and cross axis (`align-items`), spacing (`gap`), wrapping (`flex-wrap`), and how items grow or shrink (`flex: grow shrink basis`). Use Flexbox for one-dimensional layouts and CSS Grid for two-dimensional ones.',
    details: [
      {
        type: 'paragraph',
        text: 'Flexbox works with two axes. The **main axis** follows `flex-direction` (horizontal for `row`, vertical for `column`); the **cross axis** is perpendicular. `justify-content` aligns along the main axis, `align-items` along the cross axis — once you know this, Flexbox becomes predictable.',
      },
      { type: 'heading3', text: 'Container properties' },
      {
        type: 'code',
        lang: 'css',
        code: `.toolbar {
  display: flex;
  flex-direction: row;            /* row | row-reverse | column | column-reverse */
  justify-content: space-between; /* main axis: flex-start | center | space-around | space-evenly */
  align-items: center;            /* cross axis: stretch (default) | flex-start | baseline */
  flex-wrap: wrap;                /* allow items to move to the next line */
  gap: 1rem;                      /* spacing between items — no margin hacks */
}`,
      },
      { type: 'heading3', text: 'Item properties' },
      {
        type: 'code',
        lang: 'css',
        code: `.sidebar { flex: 0 0 250px; }  /* don't grow, don't shrink, base width 250px */
.content { flex: 1; }           /* = 1 1 0% → take all remaining space */
.logo    { margin-right: auto; }/* push everything after it to the right */
.badge   { align-self: flex-start; order: -1; } /* override alignment / reorder visually */`,
      },
      { type: 'heading3', text: 'Common real-world patterns' },
      {
        type: 'code',
        lang: 'html',
        code: `<!-- 1. Perfect centering -->
<div style="display:flex; justify-content:center; align-items:center; height:100vh">
  <div>Centered</div>
</div>

<!-- 2. Navbar: logo left, links right -->
<nav style="display:flex; align-items:center; gap:1rem">
  <a class="logo" style="margin-right:auto">Brand</a>
  <a>Docs</a><a>Pricing</a><a>Login</a>
</nav>

<!-- 3. Responsive cards that wrap -->
<div style="display:flex; flex-wrap:wrap; gap:16px">
  <article style="flex:1 1 280px">Card 1</article>
  <article style="flex:1 1 280px">Card 2</article>
  <article style="flex:1 1 280px">Card 3</article>
</div>`,
      },
      {
        type: 'bullets',
        items: [
          '`flex: 1` is shorthand for `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`.',
          'Flex items have `min-width: auto` by default, so long text can overflow — add `min-width: 0` to let an item shrink (classic ellipsis bug).',
          '**Flexbox vs Grid:** Flexbox = content-driven, one direction (navbars, toolbars, button groups). Grid = layout-driven, rows AND columns (page layouts, dashboards).',
          '`order` and `row-reverse` change only visual order, not DOM/tab order — be careful for accessibility.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: explain main axis vs cross axis — most Flexbox confusion comes from that. Then show centering and the `flex: 1` "fill remaining space" pattern, and contrast briefly with Grid.',
      },
    ],
  },

  'How does Angular detect the device a user is logged in from?': {
    summary:
      'Angular itself has no built-in "device detection" — you use browser information. Common approaches: responsive checks with media queries or the CDK `BreakpointObserver` (screen size), the CDK `Platform` service or parsing `navigator.userAgent` / `navigator.userAgentData` (browser, OS, mobile), a library such as `ngx-device-detector`, and on the server (SSR/backend) reading the `User-Agent` and Client Hint headers. For security features like "logged in from a new device", the backend records device/session info at login.',
    details: [
      {
        type: 'paragraph',
        text: 'First clarify what "device" means for the use case. For **layout** (mobile vs desktop UI), detect capabilities and screen size, not the device model. For **analytics or security** ("new login from Chrome on Windows"), the server should capture the User-Agent, IP and a device identifier at login — client-side detection can be spoofed.',
      },
      { type: 'heading3', text: '1. Screen size — Angular CDK BreakpointObserver' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private bp = inject(BreakpointObserver);

  // Signal that updates when the viewport crosses the breakpoint
  isHandset = toSignal(
    this.bp.observe(Breakpoints.Handset).pipe(map((r) => r.matches)),
    { initialValue: false },
  );
}

// In a template:
// @if (device.isHandset()) { <app-mobile-nav /> } @else { <app-desktop-nav /> }`,
      },
      { type: 'heading3', text: '2. Platform / user agent' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { Platform } from '@angular/cdk/platform';

export class InfoComponent {
  private platform = inject(Platform);

  info = {
    isBrowser: this.platform.isBrowser,  // false during SSR
    ios: this.platform.IOS,
    android: this.platform.ANDROID,
    safari: this.platform.SAFARI,
  };

  // Plain browser APIs (guard for SSR)
  detectMobile(): boolean {
    const uaData = (navigator as any).userAgentData; // Client Hints (Chromium-based browsers)
    if (uaData) return uaData.mobile;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  // Capability check is often better than device check
  hasTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}`,
      },
      { type: 'heading3', text: '3. Server-side — at login (most reliable for "devices")' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Express / NestJS-style backend
app.post('/auth/login', async (req, res) => {
  const user = await authenticate(req.body);
  await sessions.create({
    userId: user.id,
    userAgent: req.headers['user-agent'],          // 'Mozilla/5.0 (Windows NT 10.0 ...) Chrome/...'
    mobileHint: req.headers['sec-ch-ua-mobile'],   // '?1' on mobile Chromium browsers
    ip: req.ip,
    lastSeen: new Date(),
  });
  // If this device/browser is new for the user → send "new login" email
  res.json({ token: issueToken(user) });
});`,
      },
      {
        type: 'flow',
        title: 'Where device information comes from',
        code: `flowchart LR
  B["Browser"]:::client -->|"User-Agent + Client Hints headers"| S["Backend / SSR server"]:::server
  S --> DB[("Sessions table:<br/>UA, IP, last seen")]:::db
  B --> A["Angular app"]:::highlight
  A -->|"BreakpointObserver<br/>matchMedia"| L["Layout decisions"]:::client
  A -->|"Platform / navigator"| F["Feature tweaks"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          'User-agent strings are unreliable and being reduced ("UA reduction") — prefer feature detection and media queries for UI.',
          'Libraries like `ngx-device-detector` wrap UA parsing (device type, OS, browser) behind a service.',
          "With SSR, `navigator`/`window` don't exist on the server — check `isPlatformBrowser(inject(PLATFORM_ID))` or read the request headers instead.",
          'The "Devices" page in apps like Google or Netflix is built from server-side session records, not Angular detection.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: say clearly that Angular has no built-in device detection, then split the answer: responsive UI → CDK `BreakpointObserver`/CSS; device info → user agent / Client Hints; security → record it server-side at login. That structure shows real-world judgement.',
      },
    ],
  },
};
