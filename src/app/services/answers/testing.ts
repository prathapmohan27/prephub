import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Have you used Angular testing frameworks?': {
    summary:
      "Yes — structure the answer around the testing pyramid: unit/component tests with Angular's `TestBed` (run by Vitest in new Angular CLI projects, Jasmine + Karma in older ones, or Jest), HTTP tests with `HttpTestingController`, and end-to-end tests with Playwright or Cypress. Then give one concrete example of what you tested and why it mattered.",
    details: [
      {
        type: 'paragraph',
        text: 'This is partly an experience question, so the interviewer wants to hear (1) which tools you know, (2) that you understand what each layer of testing is for, and (3) a real example. Answer with the toolchain first, then what you actually test, then a short story.',
      },
      { type: 'heading3', text: 'The Angular testing toolchain' },
      {
        type: 'bullets',
        items: [
          '**Test runner**: Vitest is the default for new Angular CLI projects (via the `@angular/build:unit-test` builder). Older projects use **Jasmine + Karma** (Karma is deprecated), and many teams use **Jest**. The `TestBed` API is the same in all of them — only the assertion/mocking syntax differs (`vi.fn()` vs `jasmine.createSpy()` vs `jest.fn()`).',
          "**`TestBed`**: Angular's testing module — configures a mini DI environment, creates components and gives you a `ComponentFixture`.",
          '**`HttpTestingController`** (`provideHttpClientTesting()`): intercepts `HttpClient` calls so you can assert on requests and flush fake responses.',
          '**Component harnesses** (`@angular/cdk/testing`): stable, high-level APIs for interacting with Material/CDK components without relying on DOM structure.',
          '**E2E**: Playwright or Cypress (Protractor is long gone). Optionally Testing Library (`@testing-library/angular`) for user-centric component tests.',
        ],
      },
      { type: 'heading3', text: 'A typical component test (standalone + signals)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// counter.component.spec.ts  (Vitest syntax; Jasmine is nearly identical)
import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],          // standalone component → imports, not declarations
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
});`,
      },
      { type: 'heading3', text: 'Testing an HTTP service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { provideHttpClient } from '@angular/common/http';
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
});`,
      },
      {
        type: 'flow',
        title: 'Where each tool fits (testing pyramid)',
        code: `flowchart TD
  E2E["E2E — Playwright / Cypress<br/>few, slow, full user journeys"]:::client
  INT["Integration / component — TestBed + harnesses<br/>component + template + DI"]:::server
  UNIT["Unit — Vitest / Jasmine / Jest<br/>services, pipes, pure functions"]:::highlight
  E2E --> INT --> UNIT`,
        text: 'Many fast unit tests at the bottom, fewer component tests, and a small set of E2E tests for critical flows.',
      },
      { type: 'heading3', text: 'Sample answer (STAR-style)' },
      {
        type: 'paragraph',
        text: '"Yes. On [your project] we used Jasmine and Karma originally and later moved to [Jest/Vitest] because the test run was faster in CI. I write unit tests for services and pipes, component tests with TestBed and `HttpTestingController`, and our QA team owned Playwright E2E tests for the checkout flow. For example, I added tests around [a feature, e.g. the discount calculation] after a production bug — we got that module to [X]% coverage and the same class of bug never came back."',
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: name the runner your project used, but show that you know the trend — new Angular CLI projects default to Vitest and Karma is deprecated. Mentioning `whenStable()`, signal inputs via `setInput()` and `provideHttpClientTesting()` signals that your knowledge is current.',
      },
    ],
  },

  'How will you mock a service?': {
    summary:
      "Replace the real service in the test's DI container with a fake: `providers: [{ provide: UserService, useValue: mockUserService }]`, where the mock is an object of spies (`vi.fn()`, `jasmine.createSpyObj`, `jest.fn()`) returning controlled data such as `of(users)`. The component under test then gets the mock injected without any code changes.",
    details: [
      {
        type: 'paragraph',
        text: 'Dependency injection is what makes mocking easy in Angular: components never `new` their dependencies, they ask the injector. In a test you configure the injector to hand out a fake instead. That isolates the unit under test from HTTP, storage, timers or other services.',
      },
      { type: 'heading3', text: '1. useValue with spies (most common)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { of, throwError } from 'rxjs';
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
});`,
      },
      { type: 'heading3', text: '2. useClass with a hand-written fake' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// A reusable, typed fake — good when many specs need the same behaviour
class FakeAuthService implements Pick<AuthService, 'isLoggedIn' | 'user'> {
  isLoggedIn = signal(true);
  user = signal<User | null>({ id: 1, name: 'Test', roles: ['admin'] });
}

TestBed.configureTestingModule({
  imports: [HeaderComponent],
  providers: [{ provide: AuthService, useClass: FakeAuthService }],
});`,
      },
      { type: 'heading3', text: '3. Spy on the real service' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// Keep the real service, override just one method
const service = TestBed.inject(CartService);
vi.spyOn(service, 'checkout').mockReturnValue(of({ orderId: 'A1' }));
// Jasmine: spyOn(service, 'checkout').and.returnValue(of({ orderId: 'A1' }));`,
      },
      { type: 'heading3', text: 'Special cases' },
      {
        type: 'bullets',
        items: [
          "**HttpClient**: don't mock it by hand — use `provideHttpClient()` + `provideHttpClientTesting()` and `HttpTestingController`.",
          '**Router / ActivatedRoute**: use `provideRouter([])` or `RouterTestingHarness`; provide `ActivatedRoute` with `useValue: { paramMap: of(convertToParamMap({ id: "7" })) }` for simple cases.',
          '**Component-level providers** (`providers` in `@Component`): override them with `TestBed.overrideComponent(Comp, { set: { providers: [...] } })`, because the module-level provider is shadowed.',
          '**InjectionTokens** (config, `WINDOW`, feature flags): `{ provide: API_URL, useValue: "http://test" }`.',
          'Type your mocks (`Partial<UserService>` or `Pick<…>`) so a renamed method breaks the test at compile time.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Common pitfall: mocking so much that the test only verifies the mock. Mock at the boundary (HTTP, storage, third-party SDKs) and assert on visible behaviour (rendered text, emitted outputs), not on private implementation details.',
      },
    ],
  },

  'Your UI development is complete but backend APIs are still under development and API contracts are available. How will you test the application?':
    {
      summary:
        'Use the API contract (OpenAPI/Swagger or agreed JSON samples) as the source of truth and mock the backend at the network boundary: typed models generated from the contract, `HttpTestingController` in unit tests, a mock server such as MSW (Mock Service Worker) or json-server — or an Angular mock interceptor behind an environment flag — for running the app, and Playwright route mocking for E2E. Then add contract tests so drift is caught when the real API arrives.',
      details: [
        {
          type: 'paragraph',
          text: "The key idea: the frontend shouldn't be blocked by the backend. Because the contract defines URLs, request bodies, response shapes and error codes, you can build a faithful fake of the backend and test every UI state — success, empty, slow, 4xx, 5xx — today. When the real API is ready you swap the fake out with zero component changes.",
        },
        { type: 'heading3', text: 'Step 1 — generate types (or mocks) from the contract' },
        {
          type: 'code',
          lang: 'bash',
          code: `# Generate TypeScript models / API clients from OpenAPI
npx openapi-typescript ./contracts/orders.yaml -o src/app/api/orders.types.ts
# or a full Angular client:
npx @openapitools/openapi-generator-cli generate -i contracts/orders.yaml -g typescript-angular -o src/app/api

# Optional: instant mock server straight from the contract
npx @stoplight/prism-cli mock contracts/orders.yaml   # serves example responses on :4010`,
        },
        { type: 'heading3', text: 'Step 2 — run the app against mocks (dev mode)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// mock-backend.interceptor.ts — only registered when environment.useMocks is true
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
);`,
        },
        {
          type: 'paragraph',
          text: 'Alternatives: **MSW** intercepts `fetch`/XHR in the browser via a service worker and the same handlers can be reused in unit tests; **json-server** or **Prism** give you a real HTTP server; or the Angular dev-server `proxy.conf.json` can point to a mock server.',
        },
        { type: 'heading3', text: 'Step 3 — unit/component tests with HttpTestingController' },
        {
          type: 'code',
          lang: 'typescript',
          code: `it('shows a validation message on 422', async () => {
  const fixture = TestBed.createComponent(CheckoutComponent);
  const http = TestBed.inject(HttpTestingController);

  fixture.nativeElement.querySelector('button.submit').click();
  http.expectOne({ method: 'POST', url: '/api/orders' })
      .flush({ code: 'EMPTY_CART' }, { status: 422, statusText: 'Unprocessable Entity' });
  await fixture.whenStable();

  expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
});`,
        },
        { type: 'heading3', text: 'Step 4 — E2E with mocked network' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// Playwright: stub the API at the browser level
test('order history renders', async ({ page }) => {
  await page.route('**/api/orders', (route) =>
    route.fulfill({ status: 200, json: ordersFixture }),   // fixture taken from the contract examples
  );
  await page.goto('/orders');
  await expect(page.getByRole('row')).toHaveCount(ordersFixture.length + 1);
});`,
        },
        {
          type: 'flow',
          title: 'Contract-first frontend testing',
          code: `flowchart LR
  C["API contract<br/>(OpenAPI)"]:::highlight --> T["Generated TS types"]:::server
  C --> F["Fixtures / mock handlers"]:::cache
  T --> APP["Angular app"]:::client
  F --> U["Unit tests<br/>HttpTestingController"]:::server
  F --> M["Dev mock server<br/>MSW / Prism / interceptor"]:::external
  F --> E["E2E<br/>Playwright route mocks"]:::client
  M --> APP
  C --> CT["Contract tests when<br/>real API is ready"]:::security`,
        },
        { type: 'heading3', text: 'Step 5 — when the real API arrives' },
        {
          type: 'bullets',
          items: [
            "Flip the environment flag / remove the mock interceptor — components and services don't change.",
            'Run a smoke/integration suite against the real dev environment.',
            'Add **contract tests** (e.g. Pact consumer-driven contracts, or schema validation of real responses against the OpenAPI spec) so a backend change that breaks the agreed shape fails CI instead of production.',
            'Test the non-happy paths the contract defines: 401 (redirect to login), 403, 404, 422 validation, 500, timeouts and empty lists.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: stress that mocks live at the **network boundary** and are driven by the **contract**, so nothing in components is "fake-aware". Mentioning error/empty/loading states and contract tests for drift is what separates a senior answer from "I\'d use dummy JSON".',
        },
      ],
    },
};
