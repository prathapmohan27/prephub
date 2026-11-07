var e={"uses-of-services-beyond-api-calls":{summary:`Services hold anything that is not view logic, so components stay thin and focused on the template. Beyond HTTP calls they are used for shared state between components (signals/BehaviorSubjects), business logic and calculations, cross-cutting concerns (auth, logging, error handling, feature flags, theming), wrapping browser APIs (localStorage, WebSockets), and utilities like notifications or dialogs. Because they are injected, they are singletons where needed, reusable, and easy to mock in tests.`,details:[{type:`paragraph`,text:"A service is just a class registered with Angular's dependency injection. A `providedIn: 'root'` service is a single shared instance for the whole app, which makes it the natural place for anything several components need, and keeps the logic testable without rendering any UI."},{type:`heading3`,text:`1. Shared state between unrelated components`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);

  readonly items$ = this.items.asReadonly();
  readonly count = computed(() => this.items().length);
  readonly total = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));

  add(item: CartItem) { this.items.update((list) => [...list, item]); }
  clear() { this.items.set([]); }
}

// Header shows the badge, product page adds items, checkout reads total \u2014
// none of them know about each other, they all inject CartService.
export class HeaderComponent { cart = inject(CartService); }`},{type:`heading3`,text:`2. Business logic and cross-cutting concerns`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class PricingService {
  applyDiscount(total: number, coupon?: string): number {
    if (coupon === 'SAVE10') return +(total * 0.9).toFixed(2);
    return total;
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly messages = signal<string[]>([]);
  success(msg: string) {
    this.messages.update((m) => [...m, msg]);
    setTimeout(() => this.messages.update((m) => m.slice(1)), 3000);
  }
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  // Wraps a browser API: one place to handle SSR, JSON parsing and errors
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  get<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
  }
}`},{type:`heading3`,text:`3. Testability`},{type:`code`,lang:`typescript`,code:`TestBed.configureTestingModule({
  providers: [{ provide: PricingService, useValue: { applyDiscount: () => 90 } }],
});
// The component under test gets the fake \u2014 no real logic or HTTP involved`},{type:`bullets`,items:[`**Separation of concerns** — components handle presentation; services handle data, rules and side effects.`,`**Reuse** — the same logic serves many components, guards, interceptors and resolvers.`,`**Single source of truth** — one instance of state instead of duplicated copies.`,`**Other common services:** AuthService (token, current user), LoggerService / global ErrorHandler, ThemeService, FeatureFlagService, WebSocket/real-time service, analytics, i18n.`,"Scope can be narrowed: provide a service in a component's `providers` to get a fresh instance per component (e.g. a form wizard state)."]},{type:`callout`,variant:`tip`,text:`Interview tip: answer with categories (state, business logic, cross-cutting, browser APIs, testability) and give one concrete example from [your project], e.g. "our CartService holds cart state as signals and the header badge and checkout page both read it".`}]},"di-beyond-injecting-services":{summary:"DI is Angular's mechanism for supplying any dependency a class or function needs, not just service classes. You can inject configuration values via `InjectionToken`s, framework objects (`ElementRef`, `Router`, `DestroyRef`, `HttpClient`, `DOCUMENT`), parent components and directives, `TemplateRef`/`ViewContainerRef` in directives, and you can swap implementations with `useClass`, `useValue`, `useFactory` and `useExisting`. DI also controls scope and lifetime through the injector hierarchy, and powers functional guards, interceptors and resolvers via `inject()`.",details:[{type:`paragraph`,text:'Think of DI as a registry of "tokens → how to create the value". A token can be a class, an `InjectionToken`, or an abstract class; the value can be an object, a primitive, a function, or anything else. Consumers ask for the token and never construct dependencies themselves.'},{type:`heading3`,text:`1. Config values with InjectionToken`},{type:`code`,lang:`typescript`,code:`export interface AppConfig { apiUrl: string; retries: number }
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// app.config.ts
providers: [{ provide: APP_CONFIG, useValue: { apiUrl: 'https://api.shop.com', retries: 3 } }];

// anywhere
export class ApiService {
  private config = inject(APP_CONFIG);
}

// A token can even provide its own default via a factory
export const PAGE_SIZE = new InjectionToken<number>('PAGE_SIZE', {
  providedIn: 'root',
  factory: () => 20,
});`},{type:`heading3`,text:`2. Swapping implementations`},{type:`code`,lang:`typescript`,code:`export abstract class Logger { abstract log(msg: string): void; }

providers: [
  // Different class per environment
  { provide: Logger, useClass: environment.production ? RemoteLogger : ConsoleLogger },

  // Factory with its own dependencies
  {
    provide: PaymentGateway,
    useFactory: () => inject(APP_CONFIG).region === 'IN' ? new RazorpayGateway() : new StripeGateway(),
  },

  // Alias: two tokens \u2192 same instance
  { provide: OldAuthService, useExisting: AuthService },
];`},{type:`heading3`,text:`3. Framework objects and the element tree`},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  private el = inject(ElementRef);          // the host element
  private doc = inject(DOCUMENT);           // SSR-safe document
  private destroyRef = inject(DestroyRef);  // lifecycle hook as a dependency
  private tabs = inject(TabsComponent, { optional: true }); // a PARENT component instance
}

// Functional guard \u2014 DI without any class
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/login']);`},{type:`bullets`,items:["Resolution modifiers: `inject(X, { optional: true, self: true, skipSelf: true, host: true })` control where Angular looks.","Multi providers (`multi: true`) collect many values under one token — used by `HTTP_INTERCEPTORS`, `NG_VALIDATORS`, app initializers.","Scopes: `providedIn: 'root'` (app singleton), route `providers` (feature scope), component `providers` (per component instance).","Legacy equivalent of `inject()`: constructor parameters with `@Inject(TOKEN)`, `@Optional()`, `@Self()`, `@SkipSelf()`."]},{type:`callout`,variant:`tip`,text:'Interview tip: show an `InjectionToken` config example and a `useFactory`/`useClass` swap — those prove you see DI as a general dependency system, which is exactly what "apart from services" is asking.'}]},"how-di-works-internally":{summary:"Angular keeps a hierarchy of injectors. Providers register a token plus a recipe (`useClass`, `useValue`, `useFactory`, `useExisting`). When something calls `inject(Token)` (or declares a constructor parameter), Angular first walks the **element injector** tree (component/directive providers, up through parent elements), then the **environment injector** chain (route/lazy injectors → root → platform → NullInjector). The first injector with a provider creates the instance lazily, caches it, and returns it; if none is found it throws `NullInjectorError` unless the dependency is optional.",details:[{type:`paragraph`,text:'At compile time the Angular compiler generates a factory for each injectable class (`ɵfac`) and records provider definitions (e.g. `ɵprov` for `providedIn`). At runtime the injectors use those factories. `inject()` works only during an **injection context** — while a factory, constructor or field initialiser runs — because Angular sets a "current injector" for that moment.'},{type:`flow`,title:`Resolution order for inject(Token)`,code:`flowchart TD
  R["inject(CartService) in a component"]:::client --> E1["Element injector:<br/>this component's providers"]:::server
  E1 -->|not found| E2["Parent element injectors<br/>(up the component tree)"]:::server
  E2 -->|not found| EN1["Environment injector:<br/>lazy route providers"]:::cache
  EN1 -->|not found| EN2["Root environment injector<br/>(providedIn root, app config)"]:::cache
  EN2 -->|not found| P["Platform injector"]:::external
  P -->|not found| N["NullInjector:<br/>throws NullInjectorError"]:::security
  E1 & E2 & EN1 & EN2 -->|found| C["Create once, cache, return"]:::highlight`},{type:`heading3`,text:`A simplified mental model`},{type:`code`,lang:`typescript`,code:`// NOT Angular's real code \u2014 a mini version of the algorithm
class MiniInjector {
  private records = new Map<unknown, { factory: () => unknown; value?: unknown }>();
  constructor(private parent: MiniInjector | null) {}

  provide(token: unknown, factory: () => unknown) {
    this.records.set(token, { factory });
  }

  get<T>(token: unknown): T {
    const rec = this.records.get(token);
    if (rec) {
      if (!('value' in rec) || rec.value === undefined) rec.value = rec.factory(); // lazy + cached
      return rec.value as T;
    }
    if (this.parent) return this.parent.get<T>(token);              // walk up the hierarchy
    throw new Error(\`NullInjectorError: No provider for \${String(token)}\`);
  }
}`},{type:`heading3`,text:`Hierarchy in practice — different instances`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
export class CounterService { count = signal(0); }

@Component({
  selector: 'app-isolated',
  providers: [CounterService],   // new instance for this component AND its children
  template: '{{ counter.count() }}',
})
export class IsolatedComponent { counter = inject(CounterService); }

// Every other component gets the single root instance.

// Resolution modifiers change the walk
inject(CounterService, { self: true });      // only this element's injector
inject(CounterService, { skipSelf: true });  // start from the parent
inject(CounterService, { optional: true });  // null instead of throwing`},{type:`bullets`,items:[`**Lazy & cached:** a provider's instance is created on first request and reused by that injector.`,"**Tree-shakable providers:** with `providedIn: 'root'` the service is referenced only from its consumers, so unused services are removed from the bundle.","**Lazy routes** get their own child environment injector, so route `providers` are scoped to that feature.","**Injection context errors:** calling `inject()` in a method or `setTimeout` throws NG0203 — capture dependencies in fields/constructor, or use `runInInjectionContext()`.","Circular dependencies (A needs B, B needs A) throw NG0200 — break them with a third service or lazy `inject(Injector)` lookups."]},{type:`callout`,variant:`tip`,text:`Interview tip: describe the two hierarchies (element injectors then environment injectors), the "first match wins, created lazily and cached" rule, and the NullInjectorError at the end. Then show how a component-level provider creates a separate instance.`}]},"multi-provider-tokens":{summary:"A multi provider uses `multi: true` so that several providers can contribute values to the SAME token. Instead of the last provider overwriting the previous one, Angular collects them all, and injecting the token returns an **array**. It is how Angular itself implements plug-in points such as `HTTP_INTERCEPTORS`, `NG_VALIDATORS`, `NG_VALUE_ACCESSOR` and app initialisers, and you can use it for your own extension points (e.g. plugins, menu items, analytics trackers).",details:[{type:`paragraph`,text:"Normally, providing the same token twice means the later provider wins. With `multi: true` on every registration, each one appends to a list. Consumers don't need to know how many contributors exist — features can register themselves independently."},{type:`heading3`,text:`Defining and using your own multi token`},{type:`code`,lang:`typescript`,code:`export interface AnalyticsTracker { track(event: string): void }
export const ANALYTICS_TRACKERS = new InjectionToken<AnalyticsTracker[]>('ANALYTICS_TRACKERS');

// app.config.ts \u2014 each line adds one entry
providers: [
  { provide: ANALYTICS_TRACKERS, useClass: GoogleAnalyticsTracker, multi: true },
  { provide: ANALYTICS_TRACKERS, useClass: MixpanelTracker, multi: true },
  { provide: ANALYTICS_TRACKERS, useValue: { track: (e: string) => console.log(e) }, multi: true },
];

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private trackers = inject(ANALYTICS_TRACKERS); // AnalyticsTracker[] (length 3)
  track(event: string) {
    this.trackers.forEach((t) => t.track(event));
  }
}`},{type:`flow`,title:`Single vs multi provider`,code:`flowchart LR
  subgraph SINGLE["Without multi"]
    A1["provide TOKEN: A"]:::server --> T1(("TOKEN")):::highlight
    B1["provide TOKEN: B"]:::server --> T1
    T1 --> R1["inject \u2192 B<br/>(last wins)"]:::client
  end
  subgraph MULTI["With multi: true"]
    A2["provide TOKEN: A"]:::server --> T2(("TOKEN")):::highlight
    B2["provide TOKEN: B"]:::server --> T2
    T2 --> R2["inject \u2192 [A, B]"]:::client
  end`},{type:`heading3`,text:`Where Angular uses it`},{type:`code`,lang:`typescript`,code:`// Legacy class-based HTTP interceptors
{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
{ provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
// (requires provideHttpClient(withInterceptorsFromDi()); modern apps use
//  provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor])))

// Custom form control & validator directives
@Directive({
  selector: '[appNoSpaces]',
  providers: [{ provide: NG_VALIDATORS, useExisting: NoSpacesValidator, multi: true }],
})
export class NoSpacesValidator implements Validator {
  validate(c: AbstractControl) {
    return /\\s/.test(c.value ?? '') ? { noSpaces: true } : null;
  }
}

// Initialisation logic (modern helper registers a multi provider under the hood)
provideAppInitializer(() => inject(ConfigService).load());`},{type:`bullets`,items:["Every provider for that token must use `multi: true` — mixing multi and non-multi providers for one token is an error.",`Order of the array = order of registration; for interceptors this determines the request/response chain order.`,`Multi providers merge within an injector; a child injector that provides the token creates its own collection.`,`Good for open/closed design: new features plug in by adding a provider, without editing the consumer.`]},{type:`callout`,variant:`tip`,text:'Interview tip: say "multi: true makes the token return an array of all registered values" and give `HTTP_INTERCEPTORS` or `NG_VALIDATORS` as the real-world example — then mention a custom plugin use-case.'}]},"injectiontoken-and-the-four-provider-recipes":{summary:"An `InjectionToken` is a typed key for things that are not classes (config objects, functions, primitives, interfaces), because TypeScript interfaces do not exist at runtime and cannot be DI keys. A provider tells an injector how to create the value for a key: `useValue` for a ready-made value, `useClass` to swap in another implementation, `useExisting` to alias one token to an instance that already exists, and `useFactory` when the value must be computed, often from other injected dependencies.",details:[{type:`heading3`,text:`Why tokens exist`},{type:`paragraph`,text:"Classes work as DI keys because they exist at runtime. An interface like `AppConfig` is erased by the compiler, so `inject(AppConfig)` cannot work. `InjectionToken<T>` gives you a runtime key and keeps the type: `inject(APP_CONFIG)` is typed as `AppConfig`."},{type:`code`,lang:`typescript`,code:`export interface AppConfig {
  apiUrl: string;
  featureFlags: Record<string, boolean>;
}

// A token can carry its own default (tree-shakable, no providers entry needed)
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({ apiUrl: '/api', featureFlags: {} }),
});

// Function-valued tokens are great for testability (no global Date.now in code)
export const NOW = new InjectionToken<() => number>('NOW', {
  providedIn: 'root',
  factory: () => () => Date.now(),
});`},{type:`heading3`,text:`The four provider recipes`},{type:`code`,lang:`typescript`,code:`export const appConfig: ApplicationConfig = {
  providers: [
    // useValue: a constant, often from environment config at bootstrap
    { provide: APP_CONFIG, useValue: { apiUrl: 'https://api.example.com', featureFlags: {} } },

    // useClass: same contract, different implementation (Liskov in practice)
    { provide: Logger, useClass: environment.production ? RemoteLogger : ConsoleLogger },

    // useExisting: an alias that resolves to the SAME instance as another token
    RemoteLogger,
    { provide: ErrorReporter, useExisting: RemoteLogger },

    // useFactory: computed value; inject() works inside the factory
    {
      provide: ApiClient,
      useFactory: () => {
        const config = inject(APP_CONFIG);
        return new ApiClient(inject(HttpClient), config.apiUrl);
      },
    },
  ],
};`},{type:`bullets`,items:["**`useValue`**: static config, test doubles, feature flags known at startup. The object is shared as-is, so do not mutate it.","**`useClass`**: swap an implementation behind the same type (mock in tests, environment-specific adapters). Each injector that lists it creates its own instance.","**`useExisting`**: expose one instance under two keys, for example a narrow interface token (`ErrorReporter`) pointing at a richer service. `useClass` here would create a second, separate instance, which is a classic bug.","**`useFactory`**: when creation needs logic or other dependencies, or must read runtime state (platform, feature flag). Since `inject()` works in factories, the old `deps: [...]` array is rarely needed."]},{type:`heading3`,text:`Tokens as extension points`},{type:`paragraph`,text:"Libraries use tokens so apps can plug in behaviour without subclassing: `HTTP_INTERCEPTORS` (multi), `APP_INITIALIZER`-style hooks, `ErrorHandler` replacement, `TitleStrategy`. You can do the same in your own code: define a `PAYMENT_PROVIDERS` multi token and let each feature register its provider."},{type:`code`,lang:`typescript`,code:`export const SEARCH_SOURCES = new InjectionToken<SearchSource[]>('SEARCH_SOURCES');

// in each feature
{ provide: SEARCH_SOURCES, useClass: OrdersSearchSource, multi: true },
{ provide: SEARCH_SOURCES, useClass: CustomersSearchSource, multi: true },

// consumer gets all of them
private readonly sources = inject(SEARCH_SOURCES);`},{type:`callout`,variant:`tip`,text:"Prefer the `providedIn` + `factory` form of `InjectionToken` for defaults. It is tree-shakable, works without any `providers` entry, and can still be overridden by an explicit provider closer to the consumer."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["What happens if you provide the same token twice in one array? (The last one wins, unless `multi: true`.)","How do you override a token in a unit test? (`TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: ... }] })` or `TestBed.overrideProvider`.)","Why is an abstract class sometimes used instead of a token? (It is a runtime value and carries the type, so it can be the key; implementations use `useClass`.)","Where can you call `inject()`? (Only in an injection context: constructors, field initializers, factories, `runInInjectionContext`.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Using `useClass` where `useExisting` was meant, creating two instances with diverging state.",'String tokens (`provide: "config"`): untyped and collision-prone; use `InjectionToken`.',"Mutating a `useValue` object at runtime and surprising every consumer.",`Putting heavy logic in factories that run eagerly at bootstrap.`]},{type:`callout`,variant:`important`,text:`Senior signal: you treat tokens as the seams of the app: interfaces for config and cross-cutting services, multi tokens as extension points, and factories for runtime decisions, so features and tests can swap behaviour without touching consumers.`}]},"inject-options-optional-self-skipself":{summary:"They change where and how the resolution search runs. `optional` returns `null` instead of throwing when nothing is found. `self` only looks at the current element injector. `skipSelf` starts the search at the parent, ignoring the current element. `host` stops the search at the host component of the current template, so a directive cannot accidentally pick up something from far up the tree.",details:[{type:`heading3`,text:`How the search normally runs`},{type:`paragraph`,text:"For `inject(Token)` in a component or directive, Angular first walks the element injector tree (this element, its parent elements, up through component hosts), then the environment injectors (route, root, platform). The options narrow or shift that walk."},{type:`code`,lang:`typescript`,code:`inject(Logger, { optional: true });   // Logger | null
inject(FormField, { self: true });    // only this element
inject(Menu, { skipSelf: true });     // start at the parent
inject(Tabs, { host: true });         // stop at the host component boundary`},{type:`heading3`,text:"`optional`: degrade gracefully"},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appTrack]' })
export class TrackDirective {
  // Analytics may not be configured in every app or test
  private analytics = inject(Analytics, { optional: true });

  track(event: string) {
    this.analytics?.send(event);
  }
}`},{type:`heading3`,text:"`self`: only this element"},{type:`paragraph`,text:"A form-field directive should talk to the `NgControl` on the same element, never one from an ancestor. Combined with `optional`, it works with or without a form control."},{type:`code`,lang:`typescript`,code:`@Directive({ selector: 'input[appErrorState]' })
export class ErrorStateDirective {
  private control = inject(NgControl, { self: true, optional: true });
}`},{type:`heading3`,text:"`skipSelf`: find the parent of the same type"},{type:`paragraph`,text:"Recursive structures (nested menus, tree nodes, nested forms) need their parent instance of the same type. Without `skipSelf`, a component that provides itself would just get itself back."},{type:`code`,lang:`typescript`,code:`@Component({
  selector: 'app-menu',
  providers: [{ provide: MenuParent, useExisting: MenuComponent }],
  template: '<ng-content />',
})
export class MenuComponent {
  // the enclosing menu, or null at the top level
  readonly parent = inject(MenuParent, { skipSelf: true, optional: true });
  readonly depth: number = this.parent ? this.parent.depth + 1 : 0;
}`},{type:`heading3`,text:"`host`: stay inside the host component"},{type:`paragraph`,text:"A `tab` directive should only register with the `Tabs` component it is projected into or rendered by, not some other `Tabs` higher in the page. `host` limits the search to the current host component view, so a misplaced tab fails loudly (or returns null with `optional`) instead of silently attaching to the wrong parent."},{type:`code`,lang:`typescript`,code:`@Directive({ selector: '[appTab]' })
export class TabDirective {
  private tabs = inject(TabsComponent, { host: true });
  constructor() {
    this.tabs.register(this);
  }
}`},{type:`callout`,variant:`info`,text:"These map one-to-one to the legacy parameter decorators `@Optional()`, `@Self()`, `@SkipSelf()` and `@Host()`, which you will still see in older code using constructor injection."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["What does `inject()` return with `optional` when nothing is found? (`null`, typed as `T | null`.)","Can you combine options? (Yes, e.g. `{ self: true, optional: true }` or `{ skipSelf: true, optional: true }`.)","Do these options affect environment injectors? (`self` and `host` restrict the search to element injectors, so root services are not found; `skipSelf` and `optional` still reach them.)","How would you test a directive that uses `host`? (Render it inside a small test host component that provides the expected parent.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Using `optional` everywhere to hide wiring bugs; reserve it for genuinely optional collaborators.","Forgetting `skipSelf` in recursive components and getting the component itself as its own parent.","Using `self` for a root service and then wondering why it is never found."]},{type:`callout`,variant:`important`,text:`Senior signal: you explain resolution as a walk over element then environment injectors, and you use these options deliberately to make component contracts strict (fail if misplaced) or tolerant (work without an optional collaborator).`}]},"singleton-has-several-instances-debug-it":{summary:"I find out which injectors provide the service, because every injector that has a provider creates its own instance. Extra instances almost always come from the service being listed again in a component, route or lazy module `providers` array; unexpected sharing comes from a `providedIn: root` service used where a component-level provider was intended. I confirm with a quick instance id log and Angular DevTools injector tree, then fix the provider location.",details:[{type:`heading3`,text:`The rule behind both bugs`},{type:`paragraph`,text:`An injector creates at most one instance per provider it owns. So the number of instances equals the number of injectors that resolve the token through their own provider. Find every place the token is provided and you have found the bug.`},{type:`heading3`,text:`Step 1: prove how many instances exist`},{type:`code`,lang:`typescript`,code:`let nextId = 0;

@Injectable({ providedIn: 'root' })
export class CartStore {
  readonly instanceId = ++nextId;
  constructor() {
    console.debug('CartStore created', this.instanceId, new Error().stack);
  }
}`},{type:`paragraph`,text:`The stack trace at construction shows which component or route triggered creation. Angular DevTools (Injector Tree tab) shows element and environment injectors and which providers each one owns.`},{type:`heading3`,text:`Step 2: search for every provider of the token`},{type:`code`,lang:`bash`,code:`git grep -n "CartStore" -- "*.ts" | grep -E "providers|provide:"`},{type:`bullets`,items:["**`providers: [CartStore]` on a component**: every instance of that component (and its subtree) gets a new store. Common copy-paste bug.","**Route `providers`**: a route environment injector creates its own instance for that route subtree, separate from root.","**Lazy `NgModule` providers (legacy)**: a lazy module gets its own child injector, so a service listed there is a second instance.","**`importProvidersFrom(SomeModule)` in two places**: each call can register providers again.",`**Tests and micro frontends**: separate apps or bootstraps have separate root injectors, so "singletons" are per app.`]},{type:`heading3`,text:`The opposite bug: shared when it should be per component`},{type:`paragraph`,text:"A form state or wizard store marked `providedIn: root` is shared by every screen, so opening two editors makes them overwrite each other. Fix it by providing it on the component that owns the state; the component and its children then share one instance, and the next component instance gets a fresh one."},{type:`code`,lang:`typescript`,code:`@Injectable() // no providedIn: must be provided explicitly
export class EditorStore {}

@Component({
  selector: 'app-order-editor',
  providers: [EditorStore], // one store per editor instance
  templateUrl: './order-editor.html',
})
export class OrderEditor {
  private store = inject(EditorStore);
}`},{type:`callout`,variant:`tip`,text:"Make intent explicit in the class: root singletons use `providedIn: root` and are never listed in `providers`; scoped services have no `providedIn`, so forgetting to provide them fails loudly with NullInjectorError instead of silently becoming a global."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["How do `providers` and `viewProviders` differ? (`viewProviders` are visible to the component view but not to projected content.)",`Why might a service be instantiated twice with SSR? (Server and browser are separate app instances; state must be transferred, not shared.)`,"How do you enforce one instance in a library? (`providedIn: root`, no `forRoot` duplication, and a guard that throws if constructed twice.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:['Adding a root service to a component `providers` array "to make it available", creating a hidden second instance.',`Storing per-screen state in a root service.`,`Debugging by reading code only; a one-line instance id log answers the question in seconds.`]},{type:`callout`,variant:`important`,text:`Senior signal: you reason from the rule "one instance per providing injector", locate every provider of the token, and encode the intended scope in the service declaration so the mistake cannot recur.`}]},"providedin-and-route-level-providers":{summary:"`providedIn: 'root'` registers a tree-shakable singleton in the application root injector, which is the right default. `'platform'` shares one instance across several apps on the same page, and `'any'` (deprecated) gave each lazy injector its own copy. Route-level `providers` create an environment injector for that route subtree, so services there are created when the route first loads and are shared only by that feature, which is the standalone replacement for lazy-module providers.",details:[{type:`heading3`,text:`The options`},{type:`bullets`,items:["**`'root'`**: one instance for the whole app, created on first use, removed from the bundle if never injected. Use for almost every shared service.","**`'platform'`**: one instance shared by all applications bootstrapped on the page (micro frontends sharing one platform). Rarely needed.","**`'any'`**: deprecated; it gave each lazy-loaded module injector its own instance. Use route-level providers instead.","**No `providedIn`**: the class must be listed in some `providers` array; best for scoped services (per component or per feature)."]},{type:`paragraph`,text:"Recent Angular versions also offer `@Service()` as a shorter way to declare a root singleton, with an option to opt out of automatic providing when you want explicit scoping. The scoping rules below are the same."},{type:`heading3`,text:`Route-level providers`},{type:`code`,lang:`typescript`,code:`export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
];

// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      AdminStore, // one instance for everything under /admin
      { provide: API_BASE, useValue: '/api/admin' }, // feature-specific config
      provideState(adminFeature), // libraries expose provideX() functions
    ],
    children: [
      { path: 'users', loadComponent: () => import('./users').then((m) => m.Users) },
      { path: 'audit', loadComponent: () => import('./audit').then((m) => m.Audit) },
    ],
  },
];`},{type:`bullets`,items:[`The router creates an **environment injector** for the route the first time it is activated; it is a child of the root (or parent route) injector.`,"Every component under that route resolves `AdminStore` from it, so the feature shares one instance.",`The code for those providers ships in the lazy chunk, keeping the initial bundle smaller.`,`The instance lives as long as the route injector, which in practice is the app lifetime after first load; navigating away does not destroy it, so do not rely on it for per-visit state.`]},{type:`heading3`,text:`Choosing where to provide`},{type:`bullets`,items:["Global, stateless or app-wide state: `providedIn: root`.","Feature-wide state or config used only in one lazy area: route `providers`.","State tied to one component instance (an editor, a wizard): component `providers`.",`Overriding a root default for one feature: provide the same token again at the route; the closer provider wins for that subtree.`]},{type:`callout`,variant:`warning`,text:"A service that is `providedIn: root` and also listed in route `providers` gets two instances: root code sees one, the feature sees another. Pick one place."},{type:`heading3`,text:`Follow-up questions interviewers ask`},{type:`bullets`,items:["Why is `providedIn: root` tree-shakable while `providers: [X]` in app config is not? (The provider is declared on the class, so if nothing injects it, nothing references it.)",`How do you reset feature state when the user leaves a route? (Provide it on the routed component instead, or clear it explicitly on navigation.)`,"What is `EnvironmentInjector` and how is it different from an element injector? (Environment injectors hold app, route and platform providers; element injectors come from components and directives.)"]},{type:`heading3`,text:`Common mistakes`},{type:`bullets`,items:["Still using `providedIn: 'any'` in new code.",`Expecting route providers to be destroyed and recreated on every visit.`,`Putting feature-only services in root, bloating the initial bundle and coupling features.`]},{type:`callout`,variant:`important`,text:`Senior signal: you pick the scope from the lifetime and visibility the state needs (app, feature, component), know that route providers create an environment injector with app-like lifetime, and avoid providing one token in two scopes by accident.`}]}};export{e as answers};