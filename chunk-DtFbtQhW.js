var e={"Why do we use services in Angular apart from API calls?":{summary:`Services hold anything that is not view logic, so components stay thin and focused on the template. Beyond HTTP calls they are used for shared state between components (signals/BehaviorSubjects), business logic and calculations, cross-cutting concerns (auth, logging, error handling, feature flags, theming), wrapping browser APIs (localStorage, WebSockets), and utilities like notifications or dialogs. Because they are injected, they are singletons where needed, reusable, and easy to mock in tests.`,details:[{type:`paragraph`,text:"A service is just a class registered with Angular's dependency injection. A `providedIn: 'root'` service is a single shared instance for the whole app, which makes it the natural place for anything several components need, and keeps the logic testable without rendering any UI."},{type:`heading3`,text:`1. Shared state between unrelated components`},{type:`code`,lang:`typescript`,code:`@Injectable({ providedIn: 'root' })
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
// The component under test gets the fake \u2014 no real logic or HTTP involved`},{type:`bullets`,items:[`**Separation of concerns** — components handle presentation; services handle data, rules and side effects.`,`**Reuse** — the same logic serves many components, guards, interceptors and resolvers.`,`**Single source of truth** — one instance of state instead of duplicated copies.`,`**Other common services:** AuthService (token, current user), LoggerService / global ErrorHandler, ThemeService, FeatureFlagService, WebSocket/real-time service, analytics, i18n.`,"Scope can be narrowed: provide a service in a component's `providers` to get a fresh instance per component (e.g. a form wizard state)."]},{type:`callout`,variant:`tip`,text:`Interview tip: answer with categories (state, business logic, cross-cutting, browser APIs, testability) and give one concrete example from [your project], e.g. "our CartService holds cart state as signals and the header badge and checkout page both read it".`}]},"What is Dependency Injection in Angular apart from injecting services?":{summary:"DI is Angular's mechanism for supplying any dependency a class or function needs, not just service classes. You can inject configuration values via `InjectionToken`s, framework objects (`ElementRef`, `Router`, `DestroyRef`, `HttpClient`, `DOCUMENT`), parent components and directives, `TemplateRef`/`ViewContainerRef` in directives, and you can swap implementations with `useClass`, `useValue`, `useFactory` and `useExisting`. DI also controls scope and lifetime through the injector hierarchy, and powers functional guards, interceptors and resolvers via `inject()`.",details:[{type:`paragraph`,text:'Think of DI as a registry of "tokens → how to create the value". A token can be a class, an `InjectionToken`, or an abstract class; the value can be an object, a primitive, a function, or anything else. Consumers ask for the token and never construct dependencies themselves.'},{type:`heading3`,text:`1. Config values with InjectionToken`},{type:`code`,lang:`typescript`,code:`export interface AppConfig { apiUrl: string; retries: number }
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
  inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/login']);`},{type:`bullets`,items:["Resolution modifiers: `inject(X, { optional: true, self: true, skipSelf: true, host: true })` control where Angular looks.","Multi providers (`multi: true`) collect many values under one token — used by `HTTP_INTERCEPTORS`, `NG_VALIDATORS`, app initializers.","Scopes: `providedIn: 'root'` (app singleton), route `providers` (feature scope), component `providers` (per component instance).","Legacy equivalent of `inject()`: constructor parameters with `@Inject(TOKEN)`, `@Optional()`, `@Self()`, `@SkipSelf()`."]},{type:`callout`,variant:`tip`,text:'Interview tip: show an `InjectionToken` config example and a `useFactory`/`useClass` swap — those prove you see DI as a general dependency system, which is exactly what "apart from services" is asking.'}]},"How does Dependency Injection work internally?":{summary:"Angular keeps a hierarchy of injectors. Providers register a token plus a recipe (`useClass`, `useValue`, `useFactory`, `useExisting`). When something calls `inject(Token)` (or declares a constructor parameter), Angular first walks the **element injector** tree (component/directive providers, up through parent elements), then the **environment injector** chain (route/lazy injectors → root → platform → NullInjector). The first injector with a provider creates the instance lazily, caches it, and returns it; if none is found it throws `NullInjectorError` unless the dependency is optional.",details:[{type:`paragraph`,text:'At compile time the Angular compiler generates a factory for each injectable class (`ɵfac`) and records provider definitions (e.g. `ɵprov` for `providedIn`). At runtime the injectors use those factories. `inject()` works only during an **injection context** — while a factory, constructor or field initialiser runs — because Angular sets a "current injector" for that moment.'},{type:`flow`,title:`Resolution order for inject(Token)`,code:`flowchart TD
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
inject(CounterService, { optional: true });  // null instead of throwing`},{type:`bullets`,items:[`**Lazy & cached:** a provider's instance is created on first request and reused by that injector.`,"**Tree-shakable providers:** with `providedIn: 'root'` the service is referenced only from its consumers, so unused services are removed from the bundle.","**Lazy routes** get their own child environment injector, so route `providers` are scoped to that feature.","**Injection context errors:** calling `inject()` in a method or `setTimeout` throws NG0203 — capture dependencies in fields/constructor, or use `runInInjectionContext()`.","Circular dependencies (A needs B, B needs A) throw NG0200 — break them with a third service or lazy `inject(Injector)` lookups."]},{type:`callout`,variant:`tip`,text:`Interview tip: describe the two hierarchies (element injectors then environment injectors), the "first match wins, created lazily and cached" rule, and the NullInjectorError at the end. Then show how a component-level provider creates a separate instance.`}]},"What is Multi Provider Token?":{summary:"A multi provider uses `multi: true` so that several providers can contribute values to the SAME token. Instead of the last provider overwriting the previous one, Angular collects them all, and injecting the token returns an **array**. It is how Angular itself implements plug-in points such as `HTTP_INTERCEPTORS`, `NG_VALIDATORS`, `NG_VALUE_ACCESSOR` and app initialisers, and you can use it for your own extension points (e.g. plugins, menu items, analytics trackers).",details:[{type:`paragraph`,text:"Normally, providing the same token twice means the later provider wins. With `multi: true` on every registration, each one appends to a list. Consumers don't need to know how many contributors exist — features can register themselves independently."},{type:`heading3`,text:`Defining and using your own multi token`},{type:`code`,lang:`typescript`,code:`export interface AnalyticsTracker { track(event: string): void }
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
provideAppInitializer(() => inject(ConfigService).load());`},{type:`bullets`,items:["Every provider for that token must use `multi: true` — mixing multi and non-multi providers for one token is an error.",`Order of the array = order of registration; for interceptors this determines the request/response chain order.`,`Multi providers merge within an injector; a child injector that provides the token creates its own collection.`,`Good for open/closed design: new features plug in by adding a provider, without editing the consumer.`]},{type:`callout`,variant:`tip`,text:'Interview tip: say "multi: true makes the token return an array of all registered values" and give `HTTP_INTERCEPTORS` or `NG_VALIDATORS` as the real-world example — then mention a custom plugin use-case.'}]}};export{e as answers};