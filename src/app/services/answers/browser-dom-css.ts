import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'dom-with-a-real-example': {
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
      { type: 'divider' },
      { type: 'heading3', text: 'Follow-up: DOM manipulations' },
      {
        type: 'paragraph',
        text: 'DOM manipulation means using JavaScript to select, create, modify, move or remove elements, attributes, classes, styles and event listeners on a page. Core APIs are `querySelector/All`, `createElement`, `append/prepend/before/after`, `remove`, `textContent`, `classList`, `setAttribute`, `style` and `addEventListener`. In Angular you rarely touch the DOM directly — use bindings and control flow, or `Renderer2`/`ElementRef` when you must.',
      },
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

  'event-delegation': {
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

  'event-bubbling-vs-capturing': {
    summary:
      "In the DOM, an event travels in three phases: **capturing** (from `window` down through ancestors to the target), **target**, then **bubbling** (from the target back up to `window`). Listeners run in the bubbling phase by default; pass `{ capture: true }` to run during capturing. `stopPropagation()` halts the journey. Node's `EventEmitter` has no propagation at all — events go only to listeners on that emitter.",
    details: [
      {
        type: 'paragraph',
        text: 'This is a browser DOM concept, but it comes up in Node interviews because full-stack developers use both, and because Node implements the web `EventTarget` API (used by `AbortSignal`, `MessagePort`, workers) — without a DOM tree, so there is nothing to bubble through.',
      },
      {
        type: 'code',
        lang: 'html',
        code: `<div id="outer">
  <button id="btn">Click</button>
</div>

<script>
  const log = (msg) => () => console.log(msg);
  outer.addEventListener('click', log('outer - capture'), { capture: true });
  outer.addEventListener('click', log('outer - bubble'));
  btn.addEventListener('click', log('button - target'));

  // Clicking the button logs:
  // outer - capture
  // button - target
  // outer - bubble
</script>`,
      },
      {
        type: 'flow',
        title: 'The three phases of a DOM event',
        code: `flowchart LR
  W["window"]:::client -->|"1 capture"| D["document"]:::client
  D -->|"1 capture"| O["div outer"]:::server
  O -->|"2 target"| B["button"]:::highlight
  B -->|"3 bubble"| O2["div outer"]:::server
  O2 -->|"3 bubble"| D2["document"]:::client`,
      },
      { type: 'heading3', text: 'Event delegation — the main practical benefit' },
      {
        type: 'code',
        lang: 'javascript',
        code: `// One listener on the list instead of one per row (works for rows added later too)
document.querySelector('#orders').addEventListener('click', (e) => {
  const row = e.target.closest('[data-order-id]');
  if (!row) return;
  openOrder(row.dataset.orderId);
});

// stopPropagation vs preventDefault
link.addEventListener('click', (e) => {
  e.preventDefault();    // stop the browser's default action (navigation)
  e.stopPropagation();   // stop the event from reaching ancestors
});`,
      },
      { type: 'heading3', text: 'Contrast with Node' },
      {
        type: 'code',
        lang: 'javascript',
        code: `import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();
emitter.on('order:created', (order) => console.log('listener 1', order.id));
emitter.on('order:created', (order) => console.log('listener 2', order.id));
emitter.emit('order:created', { id: 7 });
// listeners run synchronously, in registration order — no capture/bubble phases

// EventTarget in Node (no tree, so no propagation)
const ac = new AbortController();
ac.signal.addEventListener('abort', () => console.log('aborted'));
ac.abort();`,
      },
      {
        type: 'bullets',
        items: [
          'Some events do not bubble (`focus`, `blur`, `mouseenter`); use `focusin`/`focusout` for delegation.',
          '`e.target` is the element that triggered the event; `e.currentTarget` is the element whose listener is running.',
          '`stopImmediatePropagation()` also prevents other listeners on the same element.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: "Interview tip: describe the three phases, then give event delegation as the practical payoff. If the role is backend-heavy, add that Node's EventEmitter has no propagation — a sign you know where the concept does and does not apply.",
      },
    ],
  },
};
