var e={"angular-testing-frameworks-you-have-used":{summary:"Yes — structure the answer around the testing pyramid: unit/component tests with Angular's `TestBed` (run by Vitest in new Angular CLI projects, Jasmine + Karma in older ones, or Jest), HTTP tests with `HttpTestingController`, and end-to-end tests with Playwright or Cypress. Then give one concrete example of what you tested and why it mattered.",details:[{type:`paragraph`,text:`This is partly an experience question, so the interviewer wants to hear (1) which tools you know, (2) that you understand what each layer of testing is for, and (3) a real example. Answer with the toolchain first, then what you actually test, then a short story.`},{type:`heading3`,text:`The Angular testing toolchain`},{type:`bullets`,items:["**Test runner**: Vitest is the default for new Angular CLI projects (via the `@angular/build:unit-test` builder). Older projects use **Jasmine + Karma** (Karma is deprecated), and many teams use **Jest**. The `TestBed` API is the same in all of them — only the assertion/mocking syntax differs (`vi.fn()` vs `jasmine.createSpy()` vs `jest.fn()`).","**`TestBed`**: Angular's testing module — configures a mini DI environment, creates components and gives you a `ComponentFixture`.","**`HttpTestingController`** (`provideHttpClientTesting()`): intercepts `HttpClient` calls so you can assert on requests and flush fake responses.","**Component harnesses** (`@angular/cdk/testing`): stable, high-level APIs for interacting with Material/CDK components without relying on DOM structure.","**E2E**: Playwright or Cypress (Protractor is long gone). Optionally Testing Library (`@testing-library/angular`) for user-centric component tests."]},{type:`heading3`,text:`A typical component test (standalone + signals)`},{type:`code`,lang:`typescript`,code:`// counter.component.spec.ts  (Vitest syntax; Jasmine is nearly identical)
import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],          // standalone component \u2192 imports, not declarations
    }).compileComponents();
  });

  it('increments when the button is clicked', async () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.componentRef.setInput('start', 5); // set a signal input()
    await fixture.whenStable();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();             // works for zoneless + zone apps

    expect(fixture.nativeElement.querySelector('.count').textContent).toContain('6');
  });
});`},{type:`heading3`,text:`Testing an HTTP service`},{type:`code`,lang:`typescript`,code:`import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

it('loads users', () => {
  TestBed.configureTestingModule({
    providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
  });
  const service = TestBed.inject(UserService);
  const http = TestBed.inject(HttpTestingController);

  let result: User[] = [];
  service.getUsers().subscribe((u) => (result = u));

  const req = http.expectOne('/api/users');   // assert the request was made
  expect(req.request.method).toBe('GET');
  req.flush([{ id: 1, name: 'Asha' }]);       // respond with fake data

  expect(result.length).toBe(1);
  http.verify();                              // no unexpected requests left
});`},{type:`flow`,title:`Where each tool fits (testing pyramid)`,code:`flowchart TD
  E2E["E2E \u2014 Playwright / Cypress<br/>few, slow, full user journeys"]:::client
  INT["Integration / component \u2014 TestBed + harnesses<br/>component + template + DI"]:::server
  UNIT["Unit \u2014 Vitest / Jasmine / Jest<br/>services, pipes, pure functions"]:::highlight
  E2E --> INT --> UNIT`,text:`Many fast unit tests at the bottom, fewer component tests, and a small set of E2E tests for critical flows.`},{type:`heading3`,text:`Sample answer (STAR-style)`},{type:`paragraph`,text:'"Yes. On [your project] we used Jasmine and Karma originally and later moved to [Jest/Vitest] because the test run was faster in CI. I write unit tests for services and pipes, component tests with TestBed and `HttpTestingController`, and our QA team owned Playwright E2E tests for the checkout flow. For example, I added tests around [a feature, e.g. the discount calculation] after a production bug — we got that module to [X]% coverage and the same class of bug never came back."'},{type:`callout`,variant:`tip`,text:"Interview tip: name the runner your project used, but show that you know the trend — new Angular CLI projects default to Vitest and Karma is deprecated. Mentioning `whenStable()`, signal inputs via `setInput()` and `provideHttpClientTesting()` signals that your knowledge is current."}]},"mocking-a-service":{summary:"Replace the real service in the test's DI container with a fake: `providers: [{ provide: UserService, useValue: mockUserService }]`, where the mock is an object of spies (`vi.fn()`, `jasmine.createSpyObj`, `jest.fn()`) returning controlled data such as `of(users)`. The component under test then gets the mock injected without any code changes.",details:[{type:`paragraph`,text:"Dependency injection is what makes mocking easy in Angular: components never `new` their dependencies, they ask the injector. In a test you configure the injector to hand out a fake instead. That isolates the unit under test from HTTP, storage, timers or other services."},{type:`heading3`,text:`1. useValue with spies (most common)`},{type:`code`,lang:`typescript`,code:`import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('UserListComponent', () => {
  const userServiceMock = {
    getUsers: vi.fn(),            // Jasmine: jasmine.createSpyObj('UserService', ['getUsers'])
    deleteUser: vi.fn(),
  };

  beforeEach(async () => {
    userServiceMock.getUsers.mockReturnValue(of([{ id: 1, name: 'Asha' }]));

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    }).compileComponents();
  });

  it('renders users from the service', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Asha');
    expect(userServiceMock.getUsers).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when loading fails', async () => {
    userServiceMock.getUsers.mockReturnValue(throwError(() => new Error('500')));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Could not load users');
  });
});`},{type:`heading3`,text:`2. useClass with a hand-written fake`},{type:`code`,lang:`typescript`,code:`// A reusable, typed fake \u2014 good when many specs need the same behaviour
class FakeAuthService implements Pick<AuthService, 'isLoggedIn' | 'user'> {
  isLoggedIn = signal(true);
  user = signal<User | null>({ id: 1, name: 'Test', roles: ['admin'] });
}

TestBed.configureTestingModule({
  imports: [HeaderComponent],
  providers: [{ provide: AuthService, useClass: FakeAuthService }],
});`},{type:`heading3`,text:`3. Spy on the real service`},{type:`code`,lang:`typescript`,code:`// Keep the real service, override just one method
const service = TestBed.inject(CartService);
vi.spyOn(service, 'checkout').mockReturnValue(of({ orderId: 'A1' }));
// Jasmine: spyOn(service, 'checkout').and.returnValue(of({ orderId: 'A1' }));`},{type:`heading3`,text:`Special cases`},{type:`bullets`,items:["**HttpClient**: don't mock it by hand — use `provideHttpClient()` + `provideHttpClientTesting()` and `HttpTestingController`.",'**Router / ActivatedRoute**: use `provideRouter([])` or `RouterTestingHarness`; provide `ActivatedRoute` with `useValue: { paramMap: of(convertToParamMap({ id: "7" })) }` for simple cases.',"**Component-level providers** (`providers` in `@Component`): override them with `TestBed.overrideComponent(Comp, { set: { providers: [...] } })`, because the module-level provider is shadowed.",'**InjectionTokens** (config, `WINDOW`, feature flags): `{ provide: API_URL, useValue: "http://test" }`.',"Type your mocks (`Partial<UserService>` or `Pick<…>`) so a renamed method breaks the test at compile time."]},{type:`callout`,variant:`warning`,text:`Common pitfall: mocking so much that the test only verifies the mock. Mock at the boundary (HTTP, storage, third-party SDKs) and assert on visible behaviour (rendered text, emitted outputs), not on private implementation details.`}]},"testing-before-the-backend-is-ready":{summary:"Use the API contract (OpenAPI/Swagger or agreed JSON samples) as the source of truth and mock the backend at the network boundary: typed models generated from the contract, `HttpTestingController` in unit tests, a mock server such as MSW (Mock Service Worker) or json-server — or an Angular mock interceptor behind an environment flag — for running the app, and Playwright route mocking for E2E. Then add contract tests so drift is caught when the real API arrives.",details:[{type:`paragraph`,text:`The key idea: the frontend shouldn't be blocked by the backend. Because the contract defines URLs, request bodies, response shapes and error codes, you can build a faithful fake of the backend and test every UI state — success, empty, slow, 4xx, 5xx — today. When the real API is ready you swap the fake out with zero component changes.`},{type:`heading3`,text:`Step 1 — generate types (or mocks) from the contract`},{type:`code`,lang:`bash`,code:`# Generate TypeScript models / API clients from OpenAPI
npx openapi-typescript ./contracts/orders.yaml -o src/app/api/orders.types.ts
# or a full Angular client:
npx @openapitools/openapi-generator-cli generate -i contracts/orders.yaml -g typescript-angular -o src/app/api

# Optional: instant mock server straight from the contract
npx @stoplight/prism-cli mock contracts/orders.yaml   # serves example responses on :4010`},{type:`heading3`,text:`Step 2 — run the app against mocks (dev mode)`},{type:`code`,lang:`typescript`,code:`// mock-backend.interceptor.ts \u2014 only registered when environment.useMocks is true
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET' && req.url.endsWith('/api/orders')) {
    return of(new HttpResponse({ status: 200, body: ORDERS_FIXTURE })).pipe(delay(400));
  }
  if (req.method === 'POST' && req.url.endsWith('/api/orders') && !req.body?.items?.length) {
    return throwError(() => new HttpErrorResponse({ status: 422, error: { code: 'EMPTY_CART' } }));
  }
  return next(req); // anything not mocked goes to the real server
};

// app.config.ts
provideHttpClient(
  withInterceptors(environment.useMocks ? [mockBackendInterceptor, authInterceptor] : [authInterceptor]),
);`},{type:`paragraph`,text:"Alternatives: **MSW** intercepts `fetch`/XHR in the browser via a service worker and the same handlers can be reused in unit tests; **json-server** or **Prism** give you a real HTTP server; or the Angular dev-server `proxy.conf.json` can point to a mock server."},{type:`heading3`,text:`Step 3 — unit/component tests with HttpTestingController`},{type:`code`,lang:`typescript`,code:`it('shows a validation message on 422', async () => {
  const fixture = TestBed.createComponent(CheckoutComponent);
  const http = TestBed.inject(HttpTestingController);

  fixture.nativeElement.querySelector('button.submit').click();
  http.expectOne({ method: 'POST', url: '/api/orders' })
      .flush({ code: 'EMPTY_CART' }, { status: 422, statusText: 'Unprocessable Entity' });
  await fixture.whenStable();

  expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
});`},{type:`heading3`,text:`Step 4 — E2E with mocked network`},{type:`code`,lang:`typescript`,code:`// Playwright: stub the API at the browser level
test('order history renders', async ({ page }) => {
  await page.route('**/api/orders', (route) =>
    route.fulfill({ status: 200, json: ordersFixture }),   // fixture taken from the contract examples
  );
  await page.goto('/orders');
  await expect(page.getByRole('row')).toHaveCount(ordersFixture.length + 1);
});`},{type:`flow`,title:`Contract-first frontend testing`,code:`flowchart LR
  C["API contract<br/>(OpenAPI)"]:::highlight --> T["Generated TS types"]:::server
  C --> F["Fixtures / mock handlers"]:::cache
  T --> APP["Angular app"]:::client
  F --> U["Unit tests<br/>HttpTestingController"]:::server
  F --> M["Dev mock server<br/>MSW / Prism / interceptor"]:::external
  F --> E["E2E<br/>Playwright route mocks"]:::client
  M --> APP
  C --> CT["Contract tests when<br/>real API is ready"]:::security`},{type:`heading3`,text:`Step 5 — when the real API arrives`},{type:`bullets`,items:[`Flip the environment flag / remove the mock interceptor — components and services don't change.`,`Run a smoke/integration suite against the real dev environment.`,`Add **contract tests** (e.g. Pact consumer-driven contracts, or schema validation of real responses against the OpenAPI spec) so a backend change that breaks the agreed shape fails CI instead of production.`,`Test the non-happy paths the contract defines: 401 (redirect to login), 403, 404, 422 validation, 500, timeouts and empty lists.`]},{type:`callout`,variant:`tip`,text:`Interview tip: stress that mocks live at the **network boundary** and are driven by the **contract**, so nothing in components is "fake-aware". Mentioning error/empty/loading states and contract tests for drift is what separates a senior answer from "I'd use dummy JSON".`}]},"testbed-and-componentfixture-setup":{summary:"`TestBed.configureTestingModule()` builds a small DI environment for the test — you import the standalone component and override its dependencies with fakes. `TestBed.createComponent()` returns a `ComponentFixture`, which gives you the component instance, its host DOM (`nativeElement` / `debugElement`) and control over change detection (`await fixture.whenStable()` or `detectChanges()`). Then you act on the DOM and assert on what the user would see.",details:[{type:`paragraph`,text:"Think of `TestBed` as a throwaway mini application: it has its own root injector, is reset before every test, and only contains what you give it. The `ComponentFixture` is the handle to one rendered component inside that application."},{type:`heading3`,text:`Component under test`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-product-list',
  template: \`
    <h2>Products ({{ products().length }})</h2>
    @for (p of products(); track p.id) {
      <li class="product">{{ p.name }} \u2014 {{ p.price }}</li>
    } @empty {
      <p class="empty">No products found</p>
    }
  \`,
})
export class ProductListComponent {
  private productService = inject(ProductService);
  products = toSignal(this.productService.getProducts(), { initialValue: [] });
}`},{type:`heading3`,text:`The spec`},{type:`code`,lang:`typescript`,code:`import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  const productServiceMock = { getProducts: vi.fn() };

  beforeEach(async () => {
    productServiceMock.getProducts.mockReturnValue(
      of([{ id: 1, name: 'Laptop', price: 999 }, { id: 2, name: 'Mouse', price: 25 }]),
    );

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],                       // standalone \u2192 imports
      providers: [{ provide: ProductService, useValue: productServiceMock }],
    }).compileComponents();                                  // not required with the CLI builder (AOT), harmless to keep

    fixture = TestBed.createComponent(ProductListComponent);
    await fixture.whenStable();                              // first render
  });

  it('renders one row per product', () => {
    const rows = fixture.debugElement.queryAll(By.css('li.product'));
    expect(rows.length).toBe(2);
    expect(rows[0].nativeElement.textContent).toContain('Laptop');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Products (2)');
  });

  it('shows the empty state', async () => {
    productServiceMock.getProducts.mockReturnValue(of([]));
    const emptyFixture = TestBed.createComponent(ProductListComponent);
    await emptyFixture.whenStable();
    expect(emptyFixture.nativeElement.querySelector('.empty').textContent).toContain('No products found');
  });
});`},{type:`heading3`,text:`What the ComponentFixture gives you`},{type:`bullets`,items:["`fixture.componentInstance` — the component class instance (read signals, call methods).","`fixture.nativeElement` — the host DOM element; use `querySelector` like a user would see it.","`fixture.debugElement` — Angular wrapper with `query(By.css(...))`, `By.directive(...)`, `triggerEventHandler()` and access to the element injector.","`fixture.componentRef` — `setInput()` for inputs, `injector` for component-level providers.","`fixture.whenStable()` — waits until Angular has no pending work (scheduled change detection and other pending tasks); `fixture.detectChanges()` runs change detection synchronously.","`TestBed.inject(Token)` — grab a service from the test injector (e.g. a mock or `HttpTestingController`)."]},{type:`bullets`,items:["**Override component-level providers** with `TestBed.overrideComponent(Comp, { set: { providers: [...] } })` — module-level providers do not replace them.","**Replace heavy child components** with `TestBed.overrideComponent(Parent, { remove: { imports: [Chart] }, add: { imports: [FakeChart] } })` for shallow tests.",`Prefer asserting on the **rendered DOM** over private fields; test what the user sees.`]},{type:`callout`,variant:`tip`,text:'Interview tip: say the three steps out loud — "configure the testing module, create the fixture, render with `whenStable()` and assert on the DOM" — and mention that standalone components go in `imports`, not `declarations`. That alone shows you have written real modern Angular specs.'}]},"testing-signal-inputs-and-outputs":{summary:"Set signal inputs through the fixture with `fixture.componentRef.setInput('name', value)` — you can't assign to an `input()` signal directly because it is read-only. For outputs, subscribe to the `OutputEmitterRef` (`component.addToCart.subscribe(...)`), trigger the UI action, and assert on what was emitted. For realistic binding tests, render the component inside a small test host component.",details:[{type:`heading3`,text:`Component under test`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <h3>{{ product().name }}</h3>
    @if (onSale()) { <span class="badge">Sale</span> }
    <button (click)="addToCart.emit(product())">Add to cart</button>
  \`,
})
export class ProductCardComponent {
  product = input.required<Product>();
  onSale = input(false);
  addToCart = output<Product>();
}`},{type:`heading3`,text:`Option 1 — setInput() + subscribe to the output`},{type:`code`,lang:`typescript`,code:`const laptop: Product = { id: 1, name: 'Laptop', price: 999 };

it('renders inputs and emits addToCart', async () => {
  const fixture = TestBed.createComponent(ProductCardComponent);
  fixture.componentRef.setInput('product', laptop);   // uses the public (alias) name
  await fixture.whenStable();

  expect(fixture.nativeElement.querySelector('h3').textContent).toBe('Laptop');
  expect(fixture.nativeElement.querySelector('.badge')).toBeNull();

  fixture.componentRef.setInput('onSale', true);      // marks the OnPush view dirty for you
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('.badge')).not.toBeNull();

  const emitted: Product[] = [];
  fixture.componentInstance.addToCart.subscribe((p) => emitted.push(p));
  fixture.nativeElement.querySelector('button').click();
  expect(emitted).toEqual([laptop]);
});

it('fails fast when the required input is missing', () => {
  const fixture = TestBed.createComponent(ProductCardComponent);
  expect(() => fixture.detectChanges()).toThrow(/NG0950/);  // required input read before it was set
});`},{type:`heading3`,text:`Option 2 — a test host component`},{type:`code`,lang:`typescript`,code:`@Component({
  imports: [ProductCardComponent],
  template: \`<app-product-card [product]="product()" [onSale]="sale()" (addToCart)="added = $event" />\`,
})
class HostComponent {
  product = signal<Product>(laptop);
  sale = signal(false);
  added: Product | null = null;
}

it('works through real template bindings', async () => {
  const fixture = TestBed.createComponent(HostComponent);
  await fixture.whenStable();

  fixture.componentInstance.sale.set(true);            // change the parent's signal
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('.badge')).not.toBeNull();

  fixture.nativeElement.querySelector('button').click();
  expect(fixture.componentInstance.added).toEqual(laptop);
});`},{type:`bullets`,items:["`setInput()` is the right API for both signal inputs and classic `@Input()`; it also works with OnPush because it marks the view for check.","Don't try `component.product.set(...)` — `input()` returns a read-only `InputSignal`. Only `model()` signals are writable from inside the component.","Use the host-component approach when you want to verify the template contract (aliases, transforms like `booleanAttribute`, two-way `[(value)]` binding with `model()`).","`output()` returns an `OutputEmitterRef` with `subscribe()`; with Vitest you can also pass a spy: `component.addToCart.subscribe(spy)`."]},{type:`callout`,variant:`tip`,text:'Interview tip: the key phrase is "`fixture.componentRef.setInput()` because signal inputs are read-only". Adding that you use a host component to test real bindings — and that a missing `input.required()` throws NG0950 — shows hands-on experience with the signal APIs.'}]},"testing-http-with-httptestingcontroller":{summary:"Provide the real `HttpClient` with `provideHttpClient()` followed by `provideHttpClientTesting()`, which swaps the backend for an in-memory mock. Call the service, use `HttpTestingController.expectOne()` to assert that exactly one matching request was made (URL, method, params, body, headers), answer it with `req.flush(data)` or an error, and finish with `verify()` to fail on any unexpected or unhandled requests.",details:[{type:`paragraph`,text:"Nothing goes over the network: requests are queued inside the controller until you flush them. That gives you full control over timing, success and failure — and it tests the real `HttpClient` pipeline including interceptors, params and JSON handling."},{type:`heading3`,text:`Service under test`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  getProducts() { return this.http.get<Product[]>('/api/products'); }
  search(term: string) {
    return this.http.get<Product[]>('/api/products', { params: new HttpParams().set('q', term) });
  }
  addToCart(productId: number, qty: number) {
    return this.http.post<{ cartSize: number }>('/api/cart', { productId, qty });
  }
}`},{type:`heading3`,text:`The spec`},{type:`code`,lang:`typescript`,code:`import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()], // order matters: testing last
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());   // fails if any request was not handled

  it('sends the search term as a query param', () => {
    let result: Product[] | undefined;
    service.search('lap').subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === '/api/products' && r.params.get('q') === 'lap');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Laptop', price: 999 }]);

    expect(result?.length).toBe(1);
  });

  it('posts the cart item', () => {
    service.addToCart(1, 2).subscribe();
    const req = http.expectOne({ method: 'POST', url: '/api/cart' });
    expect(req.request.body).toEqual({ productId: 1, qty: 2 });
    req.flush({ cartSize: 3 });
  });

  it('surfaces server errors', () => {
    let status = 0;
    service.getProducts().subscribe({ error: (e: HttpErrorResponse) => (status = e.status) });
    http.expectOne('/api/products')
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    expect(status).toBe(500);
  });

  it('handles several requests at once', () => {
    service.search('a').subscribe();
    service.search('ab').subscribe();
    const reqs = http.match((r) => r.url === '/api/products');
    expect(reqs.length).toBe(2);
    reqs.forEach((r) => r.flush([]));
    http.expectNone('/api/cart');
  });
});`},{type:`heading3`,text:`Matching cheat sheet`},{type:`bullets`,items:["`expectOne('/api/products?q=lap')` — a string is matched against the full URL **including** query params (`urlWithParams`).","`expectOne({ method: 'POST', url: '/api/cart' })` — method + URL.","`expectOne(req => ...)` — predicate for params, headers or body.","`match(...)` returns all matching requests (polling, parallel calls); `expectNone(...)` asserts nothing matched.",'`req.flush(body, { status, statusText, headers })` for responses and HTTP errors; `req.error(new ProgressEvent("error"))` simulates a network failure (`status` 0).',"In component tests, flush first and then `await fixture.whenStable()` to render the result. A request that is still waiting in `HttpTestingController` does not keep `whenStable()` pending — you must flush it yourself."]},{type:`callout`,variant:`warning`,text:"`HttpClientTestingModule` is the older NgModule form. In standalone apps use the provider functions, and always put `provideHttpClientTesting()` after `provideHttpClient(...)` so it overrides the backend while your interceptors stay active."},{type:`callout`,variant:`tip`,text:"Interview tip: walk through the four verbs — **provide** (`provideHttpClient` + `provideHttpClientTesting`), **expect** (`expectOne`), **flush** (data or error) and **verify**. Mentioning error flushing and `verify()` in `afterEach` shows you test failure paths, not just the happy path."}]},"testing-timers-and-debounced-search":{summary:"Control time instead of waiting for it. In zone.js projects the classic tools are `fakeAsync()` with `tick()` / `flush()`. In zoneless projects — the default for new Angular apps — those don't work, so you use the test runner's fake timers: `vi.useFakeTimers()`, then `await vi.advanceTimersByTimeAsync(300)` to move past a debounce, and `await vi.runAllTimersAsync()` to let rendering finish. Promises and observables that resolve immediately can simply be awaited.",details:[{type:`paragraph`,text:"A real `setTimeout(300)` in a test makes it slow and flaky. Fake timers make time deterministic: you decide exactly when 299 ms or 300 ms have passed and assert on the state at each point."},{type:`heading3`,text:`Component under test — debounced search box`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-search-box',
  template: \`
    <input (input)="term$.next($any($event.target).value)" placeholder="Search" />
    @for (p of results(); track p.id) { <li>{{ p.name }}</li> }
  \`,
})
export class SearchBoxComponent {
  private productService = inject(ProductService);
  term$ = new Subject<string>();
  results = toSignal(
    this.term$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((t) => this.productService.search(t)),
    ),
    { initialValue: [] as Product[] },
  );
}`},{type:`heading3`,text:`Zoneless test with Vitest fake timers`},{type:`code`,lang:`typescript`,code:`describe('SearchBoxComponent', () => {
  const search = vi.fn((t: string) => of([{ id: 1, name: \`Result for \${t}\`, price: 1 }]));
  let fixture: ComponentFixture<SearchBoxComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    search.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: ProductService, useValue: { search } }] });
    fixture = TestBed.createComponent(SearchBoxComponent);
    await vi.runAllTimersAsync();          // let the zoneless scheduler do the first render
  });
  afterEach(() => vi.useRealTimers());

  function type(value: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('only searches once the user stops typing for 300 ms', async () => {
    type('l');   await vi.advanceTimersByTimeAsync(100);
    type('la');  await vi.advanceTimersByTimeAsync(100);
    type('lap'); await vi.advanceTimersByTimeAsync(299);
    expect(search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);  // debounce window elapses
    expect(search).toHaveBeenCalledExactlyOnceWith('lap');

    await vi.runAllTimersAsync();          // flush the scheduled change detection
    expect(fixture.nativeElement.textContent).toContain('Result for lap');
  });
});`},{type:`callout`,variant:`warning`,text:"Gotcha: in a zoneless app the change-detection scheduler itself uses timers (`setTimeout` / `requestAnimationFrame`). With fake timers installed, `await fixture.whenStable()` will wait forever if a render is pending, because the clock never moves. Advance the fake clock (`vi.runAllTimersAsync()`), or call `fixture.detectChanges()` synchronously, instead of awaiting `whenStable()` while timers are faked."},{type:`heading3`,text:`Zone.js projects — fakeAsync / tick`},{type:`code`,lang:`typescript`,code:`// requires zone.js + zone.js/testing in the test polyfills
it('debounces (zone-based)', fakeAsync(() => {
  const fixture = TestBed.createComponent(SearchBoxComponent);
  fixture.detectChanges();
  fixture.componentInstance.term$.next('lap');
  tick(299);
  expect(search).not.toHaveBeenCalled();
  tick(1);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('Result for lap');
  flush();                                  // drain any remaining timers
}));`},{type:`bullets`,items:["`fakeAsync` throws in a project without zone.js — check `polyfills` in `angular.json` before reaching for it.","Use the **Async** variants (`advanceTimersByTimeAsync`, `runAllTimersAsync`) so promise callbacks between timers also run.","Plain promises (`async` service calls) don't need fake timers: `await` them, then `await fixture.whenStable()`.","Inject time-based config (e.g. a `SEARCH_DEBOUNCE` token) if you'd rather set it to 0 in tests — but still keep one test that proves the debounce works.","Always restore real timers in `afterEach`, otherwise later tests inherit the fake clock."]},{type:`callout`,variant:`tip`,text:'Interview tip: say "I fake the clock, I don\'t wait for it", then distinguish the two worlds — `fakeAsync`/`tick` with zone.js versus `vi.useFakeTimers()` + `advanceTimersByTimeAsync` for zoneless apps. Mentioning the `whenStable()` + fake-timers deadlock is a strong signal of real experience.'}]},"testing-onpush-and-zoneless-components":{summary:"`fixture.whenStable()` returns a promise that resolves when Angular has no pending work — scheduled change detection and other registered pending tasks — so after `await fixture.whenStable()` the DOM reflects the latest state. In zoneless apps the fixture auto-detects changes, so you change state the Angular way (signals, `setInput()`, DOM events), then `await fixture.whenStable()`. For OnPush, remember that a plain field mutation is not a notification — use signals or `markForCheck()`, exactly as in production.",details:[{type:`paragraph`,text:"With zone.js, tests traditionally called `fixture.detectChanges()` after every change. Zoneless Angular instead schedules change detection when something notifies it (a signal read by a template changes, `setInput()`, a bound event handler runs, `markForCheck()`). In tests, `ComponentFixture` defaults to auto-detect in zoneless mode, so your job is to trigger those notifications and then wait for the scheduler with `whenStable()`."},{type:`heading3`,text:`Example: an OnPush cart badge`},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-cart-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<span class="count">{{ count() }}</span><span class="legacy">{{ legacyCount }}</span>\`,
})
export class CartBadgeComponent {
  count = signal(0);      // reactive
  legacyCount = 0;        // plain field \u2014 Angular is not notified when it changes
}`},{type:`code`,lang:`typescript`,code:`it('updates when a signal changes', async () => {
  const fixture = TestBed.createComponent(CartBadgeComponent);
  await fixture.whenStable();

  fixture.componentInstance.count.set(3);
  expect(fixture.nativeElement.querySelector('.count').textContent).toBe('0'); // not rendered yet
  await fixture.whenStable();                                                 // scheduler ran
  expect(fixture.nativeElement.querySelector('.count').textContent).toBe('3');
});

it('does NOT update for a plain field mutation (OnPush)', async () => {
  const fixture = TestBed.createComponent(CartBadgeComponent);
  await fixture.whenStable();

  fixture.componentInstance.legacyCount = 5;
  fixture.detectChanges();                                    // view is not dirty \u2192 skipped
  expect(fixture.nativeElement.querySelector('.legacy').textContent).toBe('0');

  fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck(); // the component's own CDR
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('.legacy').textContent).toBe('5');
});`},{type:`heading3`,text:`What to know about whenStable() and friends`},{type:`bullets`,items:["`whenStable()` resolves immediately if nothing is pending; otherwise it waits for the app to become stable (in zone apps that also means the NgZone has no pending macrotasks).","It does **not** flush mocked HTTP: requests waiting in `HttpTestingController` must be flushed by you, then `await fixture.whenStable()` renders the result.","`fixture.detectChanges()` runs change detection synchronously. It respects OnPush — it will not refresh a component that was never marked dirty. That is a feature: it catches the same bug your users would hit.","In a zoneless fixture, auto-detect is on by default and `fixture.autoDetectChanges(false)` throws. In zone-based projects, opt in with `fixture.autoDetectChanges()` or the `ComponentFixtureAutoDetect` provider.","`fixture.changeDetectorRef.markForCheck()` targets the fixture host view, not the component — use `componentRef.injector.get(ChangeDetectorRef)` or, better, model state as signals.","Hybrid apps (still on zone.js) can make tests behave like production zoneless by adding `provideZonelessChangeDetection()` to the TestBed providers."]},{type:`callout`,variant:`important`,text:'A test that needs `detectChanges()` after a plain field assignment to "make it work" is usually hiding a real OnPush/zoneless bug. Change state through signals, inputs or events so the test proves the component notifies Angular on its own.'},{type:`callout`,variant:`tip`,text:'Interview tip: define `whenStable()` precisely — "waits until Angular has no pending change detection or pending tasks" — then explain the zoneless pattern: "change state via signals / `setInput()` / events, then `await fixture.whenStable()`". Pointing out that tests should fail when OnPush is not notified shows you treat tests as a guard for change-detection bugs.'}]},"testing-a-functional-guard-or-interceptor":{summary:"Functional guards and interceptors are plain functions that call `inject()`, so run them inside `TestBed.runInInjectionContext(() => authGuard(route, state))` with mocked dependencies and assert on the return value (`true` or a `UrlTree`). For an end-to-end check of the routing config use `RouterTestingHarness`. Test interceptors through the real pipeline: `provideHttpClient(withInterceptors([authTokenInterceptor]))` plus `provideHttpClientTesting()`, then inspect the captured request's headers.",details:[{type:`heading3`,text:`The code under test`},{type:`code`,lang:`typescript`,code:`export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token || !req.url.startsWith('/api')) return next(req);   // don't leak tokens to 3rd parties
  return next(req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }));
};`},{type:`heading3`,text:`Guard — unit test with runInInjectionContext`},{type:`code`,lang:`typescript`,code:`describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin' } as RouterStateSnapshot;

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('allows a logged-in user', () => {
    TestBed.inject(AuthService).isLoggedIn.set(true);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
  });

  it('redirects anonymous users to /login with a returnUrl', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fadmin');
  });
});`},{type:`heading3`,text:`Guard — integration test with RouterTestingHarness`},{type:`code`,lang:`typescript`,code:`beforeEach(() => TestBed.configureTestingModule({
  providers: [provideRouter([
    { path: 'login', component: LoginPage },
    { path: 'admin', component: AdminPage, canActivate: [authGuard] },
  ])],
}));

it('redirects /admin to /login when logged out', async () => {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/admin');
  expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fadmin');
  expect(harness.routeNativeElement?.textContent).toContain('Login');
});

it('renders the admin page when logged in', async () => {
  TestBed.inject(AuthService).isLoggedIn.set(true);
  const harness = await RouterTestingHarness.create();
  const page = await harness.navigateByUrl('/admin', AdminPage);  // asserts the component type
  expect(page).toBeInstanceOf(AdminPage);
});`},{type:`heading3`,text:`Interceptor — through the real HttpClient pipeline`},{type:`code`,lang:`typescript`,code:`beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authTokenInterceptor])),
      provideHttpClientTesting(),
    ],
  });
});

it('adds the bearer token to API calls', () => {
  TestBed.inject(AuthService).token.set('abc123');
  TestBed.inject(HttpClient).get('/api/orders').subscribe();

  const req = TestBed.inject(HttpTestingController).expectOne('/api/orders');
  expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
  req.flush([]);
});

it('does not send the token to third-party URLs', () => {
  TestBed.inject(AuthService).token.set('abc123');
  TestBed.inject(HttpClient).get('https://cdn.example.com/config.json').subscribe();
  const req = TestBed.inject(HttpTestingController).expectOne('https://cdn.example.com/config.json');
  expect(req.request.headers.has('Authorization')).toBe(false);
});`},{type:`bullets`,items:['You can also call an interceptor directly: `TestBed.runInInjectionContext(() => authTokenInterceptor(new HttpRequest("GET", "/api/orders"), nextSpy))` and inspect the request passed to `nextSpy` — useful for pure header logic.','For error-handling interceptors (401 → logout/redirect), flush a 401 with `req.flush(null, { status: 401, statusText: "Unauthorized" })` and assert on the side effect.',"Async guards returning `Observable`/`Promise` — use `await firstValueFrom(...)` on the result."]},{type:`callout`,variant:`tip`,text:"Interview tip: the magic words are `TestBed.runInInjectionContext` (because functional guards call `inject()`) and `withInterceptors` + `HttpTestingController` (so you test the interceptor in the real pipeline). Mention both the unit and the `RouterTestingHarness` level to show you think about routing config too."}]},"component-harnesses":{summary:"A component harness is a test-only class from `@angular/cdk/testing` that exposes a component's behaviour through a high-level API — `button.click()`, `select.open()`, `input.setValue('x')` — instead of raw CSS selectors. Angular Material ships harnesses for its components (`MatButtonHarness`, `MatInputHarness`, …) and you can write your own by extending `ComponentHarness`. They make tests readable, resistant to DOM refactors, and automatically wait for Angular to stabilise.",details:[{type:`paragraph`,text:'The problem harnesses solve: a test that does `querySelector(".mat-mdc-select-trigger")` breaks whenever the library or your template changes internal markup. A harness hides those details behind methods, so the component author owns the selectors and every test uses a stable API. The same harness also works in different environments (TestBed unit tests, and E2E via an environment adapter).'},{type:`heading3`,text:`Using Material harnesses in a TestBed test`},{type:`code`,lang:`typescript`,code:`import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

let loader: HarnessLoader;

beforeEach(async () => {
  const fixture = TestBed.createComponent(CheckoutFormComponent);
  loader = TestbedHarnessEnvironment.loader(fixture);
});

it('enables "Place order" once the address is filled', async () => {
  const placeOrder = await loader.getHarness(MatButtonHarness.with({ text: 'Place order' }));
  expect(await placeOrder.isDisabled()).toBe(true);

  const address = await loader.getHarness(MatInputHarness.with({ placeholder: 'Address' }));
  await address.setValue('221B Baker Street');   // types + dispatches events + waits for stability

  expect(await placeOrder.isDisabled()).toBe(false);
});`},{type:`heading3`,text:`Writing your own harness`},{type:`code`,lang:`typescript`,code:`import { ComponentHarness, BaseHarnessFilters, HarnessPredicate } from '@angular/cdk/testing';

export interface ProductCardHarnessFilters extends BaseHarnessFilters { name?: string; }

export class ProductCardHarness extends ComponentHarness {
  static hostSelector = 'app-product-card';

  private title = this.locatorFor('h3');
  private addButton = this.locatorFor('button');
  private badge = this.locatorForOptional('.badge');

  static with(options: ProductCardHarnessFilters = {}) {
    return new HarnessPredicate(ProductCardHarness, options)
      .addOption('name', options.name, (h, name) => HarnessPredicate.stringMatches(h.getName(), name));
  }

  async getName() { return (await this.title()).text(); }
  async isOnSale() { return (await this.badge()) !== null; }
  async addToCart() { return (await this.addButton()).click(); }
}

// In a product-list spec:
const cards = await loader.getAllHarnesses(ProductCardHarness);
expect(cards.length).toBe(2);
const laptop = await loader.getHarness(ProductCardHarness.with({ name: 'Laptop' }));
await laptop.addToCart();`},{type:`heading3`,text:`Why use them`},{type:`bullets`,items:[`**Stable**: tests survive markup/CSS refactors and library upgrades — only the harness changes.`,"**Readable**: `await card.addToCart()` documents intent better than a chain of selectors and `dispatchEvent`.","**Auto-waiting**: every harness action triggers change detection and waits for stability, removing many manual `whenStable()` calls.",`**Async by design**: all methods return promises, so the same harness works in unit tests and in E2E-style environments.`,`**Reusable**: ship a harness next to a shared/design-system component so every consuming team tests it the same way.`]},{type:`callout`,variant:`info`,text:'Harnesses require `@angular/cdk` (and `@angular/material` for the Material ones). If a project has no CDK, Testing Library (`@testing-library/angular`) is the common alternative for user-centric queries like `getByRole("button", { name: "Add to cart" })`.'},{type:`callout`,variant:`tip`,text:'Interview tip: frame harnesses as the "page object pattern for components". Say you use `TestbedHarnessEnvironment.loader(fixture)` with Material harnesses, and that you write custom `ComponentHarness` classes for shared components so tests do not depend on DOM structure.'}]},"vitest-vs-karma-jasmine-vs-jest":{summary:'New Angular CLI projects use **Vitest** through the `@angular/build:unit-test` builder, running in Node with jsdom by default (a real browser is optional). Karma + Jasmine was the long-time default but Karma is deprecated, though the builder can still run it via `runner: "karma"`. Jest was only ever supported experimentally by the CLI and is usually used via community presets. The `TestBed` API is identical across all of them — what changes is speed, the environment (real browser vs simulated DOM) and the mocking/assertion syntax.',details:[{type:`paragraph`,text:"A modern project looks like this — the builder is the only thing in `angular.json`; no `karma.conf.js`, no `test.ts`, no separate Vitest config is needed:"},{type:`code`,lang:`json`,code:`// angular.json \u2192 projects.<app>.architect
"test": {
  "builder": "@angular/build:unit-test"
  // optional "options": {
  //   "runner": "vitest",            // default; "karma" also supported
  //   "browsers": ["chromium"],      // real browser (needs playwright or webdriverio); omit \u2192 Node + jsdom
  //   "include": ["src/**/*.spec.ts"],
  //   "coverage": true,
  //   "setupFiles": ["src/test-setup.ts"],
  //   "providersFile": "src/test-providers.ts", // default export: Provider[] for every TestBed
  //   "runnerConfig": true             // opt into a custom vitest config file
  // }
}`},{type:`code`,lang:`json`,code:`// tsconfig.spec.json \u2014 gives describe/it/expect/vi as globals
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": ["vitest/globals"] },
  "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
}`},{type:`code`,lang:`bash`,code:`ng test                                   # watch mode in a terminal
ng test --watch=false                     # CI
ng test --include src/app/cart            # only specs in a folder
ng test --filter "CartService"            # only matching suite/test names
ng test --coverage`},{type:`heading3`,text:`Comparison`},{type:`bullets`,items:["**Vitest (default)** — fast startup and watch mode, Jest-compatible API (`vi.fn()`, `vi.spyOn`, `vi.useFakeTimers()`, snapshots), Node + jsdom by default or a real browser via Vitest browser mode. The Angular builder compiles specs with the same esbuild pipeline as the app.","**Karma + Jasmine (legacy)** — runs in a real browser, so DOM/CSS behaviour is authentic, but it is slower and heavier to set up in CI. Jasmine uses `jasmine.createSpyObj`, `spyOn(...).and.returnValue`, `toHaveBeenCalledWith`. Karma is deprecated; existing projects keep working while they migrate.","**Jest** — very popular through `jest-preset-angular`; jsdom environment, huge ecosystem, snapshots. The CLI only had experimental Jest support, so Jest setups are mostly community-maintained.","**What stays the same**: `TestBed`, `ComponentFixture`, `HttpTestingController`, `RouterTestingHarness`, CDK harnesses — your Angular knowledge transfers between runners."]},{type:`heading3`,text:`Syntax differences you will notice when migrating`},{type:`code`,lang:`typescript`,code:`// Jasmine                                     // Vitest
const api = jasmine.createSpyObj('Api', ['get']);  const api = { get: vi.fn() };
api.get.and.returnValue(of([]));                   api.get.mockReturnValue(of([]));
spyOn(cart, 'add').and.callThrough();              vi.spyOn(cart, 'add');
jasmine.clock().install(); jasmine.clock().tick(300);
                                                   vi.useFakeTimers(); await vi.advanceTimersByTimeAsync(300);
expect(x).toBeTrue();                              expect(x).toBe(true);`},{type:`bullets`,items:["jsdom is not a real browser: no layout (`getBoundingClientRect` returns zeros), limited CSS. For layout-sensitive components, enable Vitest's browser mode via the `browsers` option or cover them with E2E tests.","Zoneless apps (the default for new projects) do not load zone.js in tests, so `fakeAsync`/`tick` are replaced by the runner's fake timers.","Migrating? The CLI ships a schematic that rewrites common Jasmine APIs to Vitest: `ng g @schematics/angular:refactor-jasmine-vitest` — review the result, it does not cover every pattern."]},{type:`callout`,variant:`tip`,text:'Interview tip: answer in one line first — "Vitest via `@angular/build:unit-test`; Karma is deprecated" — then compare on three axes: speed, environment (jsdom vs real browser) and syntax. Emphasise that `TestBed` skills transfer, so the runner is a tooling choice, not a rewrite.'}]},"unit-vs-end-to-end-test-coverage":{summary:`Unit and component tests cover logic and every state of a single unit — services, pipes, signals/computed, guards, interceptors, and component rendering with mocked dependencies — because they are fast and pinpoint failures. End-to-end tests with Playwright or Cypress cover a handful of critical user journeys through the real app in a real browser: login, search → add to cart → checkout, permissions. Push each check to the lowest level that can catch the bug.`,details:[{type:`paragraph`,text:`The question is about cost versus confidence. E2E tests give the most realistic signal (routing, real HTTP, CSS, browser APIs all together) but are slow, harder to debug and more prone to flakiness. Unit tests are cheap and precise but cannot prove the pieces fit together. A good strategy uses both deliberately.`},{type:`heading3`,text:`Unit / component tests (TestBed + Vitest)`},{type:`bullets`,items:["**Business logic**: cart totals, discount rules, `computed()` signals, validators, pipes.",`**Every UI state** of a component: loading, empty, error, success, disabled — with mocked services.`,"**Inputs/outputs** contracts (`setInput()`, emitted events).",`**Guards & interceptors**: redirect rules, token headers, 401 handling.`,"**HTTP shape**: URLs, params and bodies via `HttpTestingController`.","**Edge cases**: debounce timing, race conditions with `switchMap`, invalid inputs."]},{type:`heading3`,text:`End-to-end tests (Playwright / Cypress)`},{type:`bullets`,items:[`**Critical journeys** where a break costs money or trust: sign-up/login, search → product → cart → checkout.`,`**Integration seams** unit tests mock away: routing + lazy loading, auth redirects with real cookies/tokens, the real backend (or a contract-faithful mock).`,`**Browser-only behaviour**: real layout, file upload/download, multi-tab, deep links, back/forward navigation.`,`**Smoke tests after deploy** to verify an environment is healthy.`]},{type:`code`,lang:`typescript`,code:`// Playwright \u2014 one journey, user-facing locators, no CSS-class coupling
test('customer can search and add a product to the cart', async ({ page }) => {
  await page.goto('/products');
  await page.getByPlaceholder('Search').fill('laptop');
  await expect(page.getByRole('listitem').filter({ hasText: 'Laptop' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
});`},{type:`heading3`,text:`Rules of thumb`},{type:`bullets`,items:[`Don't E2E-test every validation message or error branch — that belongs in component tests where it takes milliseconds.`,"Don't unit-test framework behaviour (that Angular renders `@for` correctly) — test your logic and your template contract.",`If an E2E failure keeps recurring for the same reason, add a lower-level test that pins down the bug.`,`Keep E2E data deterministic: seed test users/products via API or use route mocking for third-party services.`,`Run unit tests on every commit; run E2E on PRs against a preview environment and on a schedule against staging.`]},{type:`callout`,variant:`tip`,text:`Interview tip: use a concrete split \u2014 "the discount calculation and the cart component's empty/error states are unit tests; 'user can buy a laptop' is one E2E test" \u2014 and state the principle: test at the lowest level that can catch the bug, keep E2E for a few high-value journeys.`}]},"avoiding-flaky-tests":{summary:"A flaky test passes or fails without any code change. The usual causes are timing (real timers, `setTimeout` waits, not awaiting `whenStable()`), shared state leaking between tests (module-level mocks, fake timers or `localStorage` not reset), order dependence, real network or dates, and brittle selectors. Fix them by making the test deterministic: fake the clock, await Angular's stability, reset state in `beforeEach`/`afterEach`, mock the network and `Date`, and query by stable, user-facing attributes.",details:[{type:`paragraph`,text:`Flaky tests are worse than no tests: people learn to hit "re-run", and real failures get ignored. Treat every flaky test as a bug — either in the test or in the code (often a genuine race condition).`},{type:`heading3`,text:`Common causes in Angular specs → fixes`},{type:`bullets`,items:["**Asserting before Angular rendered** → `await fixture.whenStable()` after every state change; in zone apps call `detectChanges()`.","**Real timers** (`await new Promise(r => setTimeout(r, 500))`) → `vi.useFakeTimers()` + `advanceTimersByTimeAsync`; don't race debounces against the wall clock.","**Fake timers left installed** or mocks not reset → `afterEach(() => vi.useRealTimers())`, `vi.restoreAllMocks()`, re-create mock objects in `beforeEach`.","**Shared mutable state** between tests: a fixture array mutated by one test, `localStorage`, a module-level `let user` → build fresh data per test; clear storage in `afterEach`.","**Unflushed/unexpected HTTP** → `HttpTestingController.verify()` in `afterEach` so a leftover request fails the test that caused it.",'**Dates and time zones** ("is today", "expires in 5 days") → set the clock with `vi.setSystemTime(new Date("2026-01-15T10:00:00Z"))` or inject a clock service.',"**Randomness** (`Math.random`, UUIDs) → inject a generator or spy on it.","**Order dependence** → run tests in random order (Vitest `sequence.shuffle`, via a runner config file) to expose hidden coupling.","**Brittle selectors** → query by role, label, text or `data-testid`, or use component harnesses.","**Leaked subscriptions/intervals** from components that never get destroyed → rely on `takeUntilDestroyed()`/`DestroyRef` in code; TestBed tears down fixtures between tests by default."]},{type:`heading3`,text:`Flaky vs deterministic — the same test`},{type:`code`,lang:`typescript`,code:`// \u274C Flaky: depends on machine speed and the real clock
it('shows results', async () => {
  type('lap');
  await new Promise((r) => setTimeout(r, 350));   // sometimes 350 ms isn't enough on CI
  expect(fixture.nativeElement.textContent).toContain('Laptop');
});

// \u2705 Deterministic: the test owns time, then waits for the render
it('shows results', async () => {
  vi.useFakeTimers();
  type('lap');
  await vi.advanceTimersByTimeAsync(300);         // exactly the debounce window
  await vi.runAllTimersAsync();                   // let zoneless change detection run
  expect(fixture.nativeElement.textContent).toContain('Laptop');
  vi.useRealTimers();
});`},{type:`heading3`,text:`E2E-specific flakiness`},{type:`bullets`,items:["Never use fixed sleeps (`waitForTimeout`); use Playwright's auto-waiting assertions (`await expect(locator).toBeVisible()`) or Cypress retries.",`Isolate data: each test creates its own user/cart via API instead of sharing a seeded account.`,`Mock unstable third-party services (payments, maps, analytics) with route interception.`,`Use traces/videos on failure, and quarantine (not delete) a flaky test with a ticket while it is fixed.`]},{type:`callout`,variant:`warning`,text:"Retries (`retry: 2` in CI) hide flakiness — they are a bandage, not a fix. Track which tests needed a retry and fix the root cause."},{type:`callout`,variant:`tip`,text:"Interview tip: group the causes into **time, state, environment and selectors**, give one Angular-specific example for each (unawaited `whenStable()`, leaked fake timers, real `Date`, CSS-class selectors) and say how you would find them — shuffled test order, repeated CI runs, and `verify()` for HTTP."}]}};export{e as answers};