var e={"built-in-pipes-you-use-most":{summary:"A pipe is a small, reusable function you apply in a template with the `|` operator to transform a value for display, without changing the underlying data — `{{ price | currency }}`, `{{ createdAt | date }}`. The ones I use most are `date`, `currency`, `number` (DecimalPipe), `percent`, `async`, `uppercase`/`lowercase`/`titlecase`, `slice`, `keyvalue` and `json` for debugging. They are standalone, so you add them to the component's `imports`, and most are pure, so Angular only re-runs them when the input changes.",details:[{type:`paragraph`,text:"Pipes keep formatting logic out of components. The component holds raw data (a number, a `Date`, an observable) and the template decides how to show it. Pipes accept parameters after a colon and can be chained left to right."},{type:`heading3`,text:`Built-ins in one template`},{type:`code`,lang:`typescript`,code:`import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, JsonPipe,
         KeyValuePipe, PercentPipe, SlicePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-order-summary',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, JsonPipe,
            KeyValuePipe, PercentPipe, SlicePipe, TitleCasePipe],
  template: \`
    <h2>{{ order().customer | titlecase }}</h2>          <!-- "jane doe" \u2192 "Jane Doe" -->
    <p>Placed {{ order().placedAt | date: 'mediumDate' }}</p>   <!-- Nov 5, 2026 -->
    <p>Total {{ order().total | currency: 'EUR' }}</p>        <!-- \u20AC1,234.50 -->
    <p>Weight {{ order().weightKg | number: '1.1-2' }} kg</p> <!-- 2.5 \u2192 2.5, 2.456 \u2192 2.46 -->
    <p>Discount {{ order().discount | percent }}</p>          <!-- 0.15 \u2192 15% -->
    <p>{{ order().note | slice: 0 : 40 }}\u2026</p>                <!-- first 40 chars -->

    @for (entry of order().meta | keyvalue; track entry.key) {
      <dt>{{ entry.key }}</dt><dd>{{ entry.value }}</dd>
    }

    @if (status$ | async; as status) { <span>{{ status | uppercase }}</span> }
    <pre>{{ order() | json }}</pre>                            <!-- debug only -->
  \`,
})
export class OrderSummaryComponent { /* ... */ }`},{type:`bullets`,items:["`date` — format strings like `'short'`, `'mediumDate'`, `'dd/MM/yyyy HH:mm'`, optional timezone and locale arguments.","`currency` — currency code, display (`'symbol'`, `'code'`, `'symbol-narrow'`), digits info; default code comes from `DEFAULT_CURRENCY_CODE`.","`number` (DecimalPipe) and `percent` — digits info `'minInt.minFrac-maxFrac'`, e.g. `'1.0-2'`.","`uppercase`, `lowercase`, `titlecase` — text casing.",'`slice` — works on strings and arrays (`items | slice: 0 : 5` for "top 5").',"`keyvalue` — iterate an object or Map in a template; sorted by key by default, pass a compare function to change order.","`json` — `JSON.stringify` for quick debugging.","`async` — unwraps an Observable or Promise and handles subscription for you.","`i18nPlural` / `i18nSelect` — pick a string by count (`{ '=0': 'No items', '=1': 'One item', other: '# items' }`) or by a key such as gender."]},{type:`heading3`,text:`Locale matters`},{type:`code`,lang:`typescript`,code:`// main.ts \u2014 date/currency/number pipes format using LOCALE_ID
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

registerLocaleData(localeDe);

bootstrapApplication(App, {
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
  ],
});
// {{ 1234.5 | currency }} \u2192 "1.234,50 \u20AC"`},{type:`callout`,variant:`tip`,text:`Interview tip: give a one-line definition ("a pure display transformation applied with |"), list 5–6 built-ins with a real example each, then mention parameters, chaining, standalone imports and LOCALE_ID. That shows you have actually used them in a production app.`}]},"pure-vs-impure-pipes":{summary:"A pure pipe (the default) only re-runs when Angular detects a change in its input or parameters by reference — a new primitive value or a new object/array reference — so its result is effectively memoized. An impure pipe (`pure: false`) runs on every change-detection cycle, which lets it react to mutations inside objects but can be expensive. The classic impure built-in is `async`; for your own pipes, prefer pure and pass new references.",details:[{type:`paragraph`,text:"Angular treats a pure pipe like a pure function: same inputs, same output. On each change-detection pass it compares the current arguments with the previous ones using identity (`===`). If nothing changed, it reuses the last result without calling `transform()` at all."},{type:`heading3`,text:`The mutation trap`},{type:`code`,lang:`typescript`,code:`@Pipe({ name: 'inStock' })
export class InStockPipe implements PipeTransform {
  transform(products: Product[]): Product[] {
    return products.filter(p => p.stock > 0);
  }
}

// component
products = signal<Product[]>([]);

addBad(p: Product) {
  this.products().push(p);                 // \u274C same array reference \u2192 pure pipe does NOT re-run
}

addGood(p: Product) {
  this.products.update(list => [...list, p]); // \u2705 new reference \u2192 pipe re-runs
}`},{type:`heading3`,text:`Making a pipe impure`},{type:`code`,lang:`typescript`,code:`@Pipe({ name: 'timeAgo', pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' h ago';
    return Math.floor(seconds / 86400) + ' days ago';
  }
}
// Impure because the OUTPUT changes over time even though the input Date doesn't.
// Cost: transform() runs on every change-detection pass for every usage in the page.`},{type:`bullets`,items:[`**Pure**: runs when an argument changes by reference; one shared instance per usage; cheap and predictable. Default and recommended.`,`**Impure**: runs every change-detection cycle (every click, timer, HTTP response in a zone-based app); a separate instance per usage, so it can keep internal state.`,"`async` is impure on purpose: it holds a subscription and must return the latest emitted value even though the Observable reference never changes.",`Impure pipes must be very fast — no sorting large arrays, no allocations you can avoid. Mutating data and relying on an impure pipe is usually a design smell; switch to immutable updates.`,`With signals and OnPush, change detection runs less often, which reduces (but does not remove) the cost of impure pipes.`]},{type:`callout`,variant:`warning`,text:"A pure pipe that receives an object will not notice `user.name = 'x'`. Either replace the object (`{ ...user, name: 'x' }`) or pass the primitive you actually need (`user.name | myPipe`)."},{type:`callout`,variant:`tip`,text:'Interview tip: say "pure = memoized by input reference, impure = runs every CD cycle", show the `push()` vs spread example, and name `async` as the built-in impure pipe. Ending with "I keep pipes pure and use immutable updates" is the answer interviewers want.'}]},"writing-a-custom-pipe-with-parameters":{summary:"Create a class decorated with `@Pipe({ name: 'truncate' })` that implements `PipeTransform`; the `transform(value, ...args)` method receives the piped value first and each colon-separated parameter after it. Pipes are standalone by default, so you just add the class to a component's `imports` and use `{{ text | truncate: 50 : '…' }}`. Keep it pure and side-effect free, and generate it with `ng generate pipe truncate`.",details:[{type:`heading3`,text:`A truncate pipe with two parameters`},{type:`code`,lang:`typescript`,code:`import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 100, suffix = '\u2026'): string {
    if (!value) return '';
    if (value.length <= limit) return value;
    // cut on a word boundary so we don't end mid-word
    const cut = value.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut) + suffix;
  }
}`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-product-card',
  imports: [TruncatePipe, CurrencyPipe],
  template: \`
    <h3>{{ product().name | truncate: 30 }}</h3>
    <p>{{ product().description | truncate: 120 : ' [more]' }}</p>
    <strong>{{ product().price | currency: 'USD' }}</strong>
  \`,
})
export class ProductCardComponent {
  product = input.required<Product>();
}`},{type:`heading3`,text:`A pipe that uses DI: price with local tax`},{type:`code`,lang:`typescript`,code:`@Pipe({ name: 'priceWithTax' })
export class PriceWithTaxPipe implements PipeTransform {
  private locale = inject(LOCALE_ID);
  private tax = inject(TaxConfig);           // e.g. { rate: 0.2 }

  transform(amount: number, currency = 'USD', includeTax = true): string {
    const total = includeTax ? amount * (1 + this.tax.rate) : amount;
    return formatCurrency(total, this.locale, getCurrencySymbol(currency, 'narrow'), currency);
  }
}

// {{ item.price | priceWithTax: 'EUR' }}
// {{ item.price | priceWithTax: 'EUR' : false }}`},{type:`bullets`,items:["The first argument of `transform` is the value on the left of `|`; every `: arg` maps to the next parameter, in order.","Type the input to include `null | undefined` — values from `async` or optional fields often start empty.",`Use default parameter values so the pipe works without arguments.`,"Pipes can use `inject()` (locale, config, services), but should not do HTTP or mutate state — a pipe is a display transform.","Older NgModule apps declared pipes in `declarations`; today the pipe is standalone and imported where it is used.","Pipes are easy to unit test: `expect(new TruncatePipe().transform('hello world', 5)).toBe('hello…')`."]},{type:`callout`,variant:`tip`,text:"Interview tip: write the decorator, `PipeTransform`, the `transform(value, ...params)` signature, and the template usage with colon-separated arguments. Then mention null handling, keeping it pure, and how you would test it — that covers everything they are looking for."}]},"how-the-async-pipe-works":{summary:"The `async` pipe subscribes to an Observable (or waits on a Promise), returns the latest emitted value to the template, and calls `markForCheck()` on each emission so it works with OnPush. It automatically unsubscribes when the component is destroyed or when the source reference changes. That removes manual `subscribe`/`unsubscribe` boilerplate and the memory leaks that come with forgetting it; in signal-based code, `toSignal()` is the equivalent.",details:[{type:`paragraph`,text:"Manual subscription means storing the value in a field, remembering to unsubscribe (or using `takeUntilDestroyed`), and calling `markForCheck` for OnPush components. The async pipe does all three for you, and keeps the stream declarative: the component exposes an Observable, the template consumes it."},{type:`flow`,title:`Lifecycle of the async pipe`,code:`flowchart TD
  A["Template evaluates products$ | async"]:::client --> B{"Same source as last time?"}:::highlight
  B -- "No (first run or new reference)" --> C["Unsubscribe old source, subscribe new one"]:::server
  B -- Yes --> D["Return latest stored value"]:::cache
  C --> D
  E["Observable emits / Promise resolves"]:::external --> F["Store value + markForCheck()"]:::server
  F --> A
  G["Component destroyed"]:::security --> H["ngOnDestroy: unsubscribe"]:::db`},{type:`heading3`,text:`Manual vs async pipe`},{type:`code`,lang:`typescript`,code:`// \u274C Manual: field + subscribe + cleanup + markForCheck
export class ProductsManualComponent implements OnInit {
  products: Product[] = [];
  private api = inject(ProductApi);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.api.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
      this.products = p;
      this.cdr.markForCheck();
    });
  }
}

// \u2705 async pipe: declarative, no leaks, OnPush-friendly
@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, CurrencyPipe],
  template: \`
    @if (products$ | async; as products) {
      @for (p of products; track p.id) {
        <li>{{ p.name }} \u2014 {{ p.price | currency }}</li>
      } @empty { <li>No products</li> }
    } @else {
      <app-spinner />
    }
  \`,
})
export class ProductsComponent {
  products$ = inject(ProductApi).list();
}`},{type:`heading3`,text:`Pitfall: multiple async pipes on a cold HTTP observable`},{type:`code`,lang:`html`,code:`<!-- \u274C Each | async is a separate subscription \u2192 2 HTTP requests -->
<h2>{{ (user$ | async)?.name }}</h2>
<img [src]="(user$ | async)?.avatarUrl" />

<!-- \u2705 Subscribe once and alias the value -->
@if (user$ | async; as user) {
  <h2>{{ user.name }}</h2>
  <img [src]="user.avatarUrl" />
}`},{type:`code`,lang:`typescript`,code:`// Or share the stream if it must be used in several places
user$ = this.api.getUser(id).pipe(shareReplay({ bufferSize: 1, refCount: true }));

// Signal-era alternative: subscribe once in the class, read as a signal
user = toSignal(this.api.getUser(id));      // Signal<User | undefined>, auto-unsubscribes
// template: {{ user()?.name }}`},{type:`bullets`,items:["Works with Promises too: `{{ greetingPromise | async }}`.","Returns `null` until the first emission — handle it with `@if ... as` or `?.`.","Never write `obs$ | async` where `obs$` is a getter or method returning a new Observable each time — the pipe sees a new reference every pass and resubscribes endlessly.","`@if (x$ | async; as x)` hides the block for falsy values like `0` or `''`; wrap in an object (`{ count: n }`) or use `toSignal` if those are valid values."]},{type:`callout`,variant:`tip`,text:'Interview tip: list the three jobs — subscribe, markForCheck, unsubscribe — then mention the double-HTTP-request pitfall and its fix. Finish with "in new code I often use `toSignal()` instead", which shows you know where Angular is heading.'}]},"template-method-calls-vs-pipes-and-computed":{summary:"Angular cannot know whether a method's result changed, so `{{ getTotal() }}` is called on every change-detection pass for that view — every click, keystroke or timer anywhere in a zone-based app. If the method filters, sorts or formats a large list, that work is repeated constantly. A pure pipe fixes it by re-running only when its input reference changes, and `computed()` fixes it by caching the result and recalculating only when the signals it reads change.",details:[{type:`paragraph`,text:"Template expressions are re-evaluated during change detection to see whether the DOM needs updating. A field read is trivial; a method call runs the whole method body. With 200 rows each calling `formatPrice(row)` and a parent that re-renders on every keystroke in a search box, you get thousands of calls per second for values that did not change."},{type:`heading3`,text:`The problem`},{type:`code`,lang:`typescript`,code:`@Component({
  template: \`
    <input (input)="query = $any($event.target).value" />
    <p>Total: {{ getCartTotal() }}</p>             <!-- runs on every keystroke -->
    @for (item of items; track item.id) {
      <span>{{ formatPrice(item.price) }}</span>    <!-- runs N times per CD pass -->
    }
  \`,
})
export class CartComponent {
  query = '';
  items: CartItem[] = [];
  getCartTotal() {
    console.log('recalculating');                   // you will see this a LOT
    return this.items.reduce((s, i) => s + i.price * i.qty, 0);
  }
  formatPrice(p: number) { return '$' + p.toFixed(2); }
}`},{type:`heading3`,text:`Fix 1: computed() for derived state`},{type:`code`,lang:`typescript`,code:`export class CartComponent {
  query = signal('');
  items = signal<CartItem[]>([]);
  total = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  // template: {{ total() | currency }}
  // total() is a cached getter \u2014 the reduce runs only when items changes
}`},{type:`heading3`,text:`Fix 2: a pure pipe for per-item formatting`},{type:`code`,lang:`html`,code:`@for (item of items(); track item.id) {
  <span>{{ item.price | currency: 'USD' }}</span>   <!-- re-runs only if item.price changes -->
  <small>{{ item.addedAt | timeAgo }}</small>
}`},{type:`bullets`,items:[`**computed()**: best for component-level derived values (totals, filtered lists, flags). Memoized and lazy.`,`**Pure pipe**: best for reusable formatting applied per item, or across many components.`,"**Precompute**: map data once when it arrives (e.g. add `displayPrice` in the service or a `map` operator).","Reading a signal in a template (`{{ total() }}`) looks like a method call but is not the same problem — it is a cheap getter returning a cached value, and it lets Angular track exactly which views depend on it.","A trivial method (`isActive()` returning a boolean field) is not a real performance issue; the concern is methods that do work or allocate new objects/arrays (which can also break child `@Input` identity checks).",`OnPush and zoneless change detection reduce how often templates are checked, but do not make an expensive method cheap.`]},{type:`callout`,variant:`tip`,text:"Interview tip: explain WHY (Angular can't memoize an arbitrary method, so it re-runs on every CD pass), show the console.log demo, then give the fixes in order: `computed()` for derived state, pure pipe for formatting, precomputing data. Clarify that signal reads in templates are fine."}]},"why-no-filter-or-orderby-pipes":{summary:"AngularJS had `filter` and `orderBy`, but Angular deliberately dropped them. To notice items being added or edited in place they would have to be impure, so they would filter and sort the whole list on every change-detection cycle — a big performance cost — and `orderBy: 'name'` style string property access also breaks under aggressive minification. Instead, filter and sort in the component, ideally with `computed()` over signals, or with a pure pipe that receives a new array reference.",details:[{type:`paragraph`,text:`The Angular team documented this decision explicitly: the convenience was not worth the hidden cost. Moving the logic into the component makes it explicit, testable, and computed only when the inputs actually change.`},{type:`bullets`,items:[`**Performance**: filtering/sorting is O(n) / O(n log n). An impure pipe would do it on every CD pass, even when nothing about the list changed.`,"**Correctness with a pure version**: a pure filter would miss in-place mutations (`push`, editing an item), leading to stale UI and confusion.","**Minification**: string-based property paths (`orderBy: 'customer.name'`) are fragile when property names are mangled and are not type-checked.",`**Separation of concerns**: what the list contains is business/view logic, better placed in TypeScript than buried in templates.`]},{type:`heading3`,text:`Search + sort with signals`},{type:`code`,lang:`typescript`,code:`type SortKey = 'name' | 'price';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe],
  template: \`
    <input placeholder="Search" [value]="query()" (input)="query.set($any($event.target).value)" />
    <select (change)="sortBy.set($any($event.target).value)">
      <option value="name">Name</option>
      <option value="price">Price</option>
    </select>

    <p>{{ visible().length }} of {{ products().length }} products</p>
    @for (p of visible(); track p.id) {
      <li>{{ p.name }} \u2014 {{ p.price | currency }}</li>
    } @empty {
      <li>No products match "{{ query() }}"</li>
    }
  \`,
})
export class ProductListComponent {
  products = input.required<Product[]>();
  query = signal('');
  sortBy = signal<SortKey>('name');

  visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const key = this.sortBy();
    return this.products()
      .filter(p => p.name.toLowerCase().includes(q))
      .sort((a, b) => key === 'price' ? a.price - b.price : a.name.localeCompare(b.name));
  });
  // filter() returns a new array, so sort() never mutates the input
}`},{type:`heading3`,text:`Reusable alternative: a typed pure pipe`},{type:`code`,lang:`typescript`,code:`@Pipe({ name: 'search' })
export class SearchPipe implements PipeTransform {
  transform<T>(items: readonly T[] | null, query: string, field: (item: T) => string): T[] {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return q ? items.filter(i => field(i).toLowerCase().includes(q)) : [...items];
  }
}
// {{ products() | search: query() : byName }}  \u2014 byName = (p: Product) => p.name
// Pure: re-runs only when products(), query() or byName change by reference.
// Works as long as the list is updated immutably.`},{type:`callout`,variant:`info`,text:`For large lists or server-side data, push filtering and sorting to the API (query params) and debounce the search input — the client should not hold 50,000 rows just to filter them.`},{type:`callout`,variant:`tip`,text:"Interview tip: mention the AngularJS history, give the two reasons (impure = slow, string paths = minification/type-safety issues), then show the `computed()` search + sort. Bonus points for noting server-side filtering with debounce for big datasets."}]},"using-a-pipe-in-a-class":{summary:"There are three options. You can inject a built-in pipe like `DatePipe`, but it is not provided by default, so you must add it to `providers` first. Better, call the underlying functions Angular exports from `@angular/common` — `formatDate`, `formatCurrency`, `formatNumber`, `formatPercent` — passing the locale from `LOCALE_ID`. For a simple custom pure pipe with no dependencies, you can just `new TruncatePipe().transform(...)`, though extracting the logic into a plain function shared by the pipe and the class is cleanest.",details:[{type:`heading3`,text:`Option 1: inject the pipe (must be provided)`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-report',
  providers: [DatePipe, CurrencyPipe],     // without this: NullInjectorError: No provider for DatePipe
  template: \`<p>{{ title }}</p>\`,
})
export class ReportComponent {
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  title = 'Report generated ' + this.datePipe.transform(new Date(), 'medium');
  totalLabel = this.currencyPipe.transform(1234.5, 'USD');   // "$1,234.50" (string | null)
}`},{type:`heading3`,text:`Option 2: the formatting functions (preferred)`},{type:`code`,lang:`typescript`,code:`import { formatCurrency, formatDate, formatNumber, formatPercent } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private locale = inject(LOCALE_ID);

  toCsvRow(order: Order): string {
    return [
      formatDate(order.placedAt, 'yyyy-MM-dd', this.locale),
      formatCurrency(order.total, this.locale, '$', 'USD'),     // value, locale, symbol, code
      formatNumber(order.weightKg, this.locale, '1.0-2'),
      formatPercent(order.discount, this.locale, '1.0-1'),
    ].join(',');
  }
}`},{type:`heading3`,text:`Option 3: custom pipes — share the logic`},{type:`code`,lang:`typescript`,code:`// truncate.ts \u2014 plain function, usable anywhere
export function truncate(value: string, limit = 100, suffix = '\u2026'): string {
  return value.length <= limit ? value : value.slice(0, limit) + suffix;
}

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit?: number, suffix?: string) {
    return truncate(value, limit, suffix);
  }
}

// In a class: call truncate(...) directly,
// or new TruncatePipe().transform(text, 50) if the pipe has no injected dependencies.`},{type:`bullets`,items:["`formatCurrency` takes the currency **symbol** and optional code separately; use `getCurrencySymbol('EUR', 'narrow')` to get the symbol from a code.","Always pass the locale from `inject(LOCALE_ID)` rather than hard-coding `'en-US'`, so formatting matches the template pipes.","`new SomePipe()` breaks if the pipe uses `inject()` — `inject()` only works in an injection context. Use `providers` + `inject` for those, or extract the logic.","Formatting in a class is useful for CSV/PDF export, `document.title`, toast messages, chart labels and `aria-label` strings.",`If you only need a formatted value in a template, keep using the pipe there — do not precompute strings just to avoid pipes.`]},{type:`callout`,variant:`tip`,text:'Interview tip: mention the `NullInjectorError` gotcha with `inject(DatePipe)`, then recommend `formatDate`/`formatCurrency` with `LOCALE_ID` as the clean solution. Saying "I move custom pipe logic into a pure function and reuse it" shows good design sense.'}]}};export{e as answers};