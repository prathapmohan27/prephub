import type { AnswerMap } from './answer.model';

export const answers: AnswerMap = {
  'Why do we need Node.js and npm before working with Angular?': {
    summary:
      'Angular apps run in the browser, but the tooling around them runs on Node.js. The Angular CLI, the TypeScript compiler, the build system (esbuild/Vite), the dev server, test runners and linters are all Node.js programs. npm (or pnpm/yarn) installs Angular and its dependencies from the registry into `node_modules` and runs project scripts from `package.json`. Node.js is NOT needed to run the built app in production — the output is static HTML, JS and CSS (unless you use SSR).',
    details: [
      {
        type: 'paragraph',
        text: 'A common misconception is that Angular "runs on Node". It doesn\'t — the browser runs the compiled JavaScript. Node.js is the development-time runtime for the toolchain that turns your TypeScript and templates into that JavaScript.',
      },
      { type: 'heading3', text: 'What Node.js is used for' },
      {
        type: 'bullets',
        items: [
          '**Angular CLI (`ng`)** — a Node program: `ng new`, `ng generate`, `ng serve`, `ng build`, `ng test`, `ng update`.',
          '**Compilation** — the TypeScript compiler and Angular compiler (ngtsc) turn TS + templates into JavaScript.',
          '**Bundling** — esbuild bundles, tree-shakes and minifies; the dev server (Vite-based) serves with live reload.',
          '**Testing & linting** — test runners (Vitest/Karma/Jest), ESLint, Prettier.',
          '**SSR** — with `@angular/ssr`, Node also runs the server that renders pages (this one IS used in production).',
        ],
      },
      { type: 'heading3', text: 'What npm is used for' },
      {
        type: 'code',
        lang: 'bash',
        code: `node -v            # check Node version (use an LTS version supported by your Angular release)
npm -v

npm install -g @angular/cli   # install the CLI globally
ng new shop-app               # scaffolds the project and runs npm install

cd shop-app
npm install                   # installs everything in package.json → node_modules
npm start                     # runs the "start" script → ng serve
npm run build                 # → ng build → static files in dist/`,
      },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test"
  },
  "dependencies": {
    "@angular/core": "^21.0.0",
    "@angular/router": "^21.0.0",
    "rxjs": "~7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^21.0.0",
    "@angular/build": "^21.0.0",
    "typescript": "~5.9.0"
  }
}`,
      },
      {
        type: 'flow',
        title: 'Node in development vs the browser in production',
        code: `flowchart LR
  subgraph DEV["Development machine (Node.js)"]
    SRC["TS + templates + SCSS"]:::client --> CLI["Angular CLI<br/>compiler + esbuild"]:::server
  end
  NPM[("npm registry")]:::external -->|npm install| CLI
  CLI --> DIST["dist/: index.html,<br/>main.js, styles.css"]:::highlight
  DIST -->|"deploy to any static host / CDN"| BR["User's browser runs the app"]:::client`,
      },
      {
        type: 'bullets',
        items: [
          'Each Angular major version supports specific Node.js LTS versions — check the version compatibility table on angular.dev before upgrading.',
          '`package-lock.json` pins exact dependency versions so every developer and CI build installs the same tree; use `npm ci` in CI.',
          "The production server (Nginx, S3, Firebase Hosting…) doesn't need Node unless you use SSR.",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: the key sentence is "Node is the runtime for the build tooling, npm is the package manager — the final app runs in the browser without Node (except with SSR)." That distinction is what the question is really testing.',
      },
    ],
  },

  'What CLI command is used to run and serve a project in Angular?': {
    summary:
      '`ng serve` (or `npm start`, which usually calls it) builds the app in development mode, starts a local dev server on `http://localhost:4200`, watches files and reloads the browser on changes. Add `--open` (`-o`) to open the browser, `--port` to change the port, and `--configuration production` to serve a production build locally.',
    details: [
      {
        type: 'paragraph',
        text: '`ng serve` is for local development only — it builds in memory and serves from a dev server. For deployment you use `ng build`, which writes optimised static files to `dist/`.',
      },
      { type: 'heading3', text: 'Common commands and flags' },
      {
        type: 'code',
        lang: 'bash',
        code: `ng serve                       # dev build + server at http://localhost:4200
ng serve -o                    # also open the browser
ng serve --port 4300           # different port
ng serve --host 0.0.0.0        # make it reachable from other devices on the network
ng serve --configuration production   # serve with production optimisations
ng serve --ssl                 # serve over HTTPS with a generated certificate
ng serve --proxy-config proxy.conf.json  # forward /api calls to a backend (avoid CORS)
ng serve my-admin-app          # pick a project in a multi-project workspace

npm start                      # usually the same as ng serve (see package.json scripts)`,
      },
      { type: 'heading3', text: 'Proxying API calls during development' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}`,
      },
      { type: 'heading3', text: 'Related CLI commands' },
      {
        type: 'bullets',
        items: [
          '`ng build` — production build into `dist/` (production is the default configuration for new projects).',
          '`ng test` — run unit tests; `ng e2e` — run end-to-end tests if configured.',
          '`ng generate component users` (`ng g c users`) — scaffold code.',
          '`ng update @angular/core @angular/cli` — upgrade with automatic migrations.',
          '`ng add @angular/material` — install a library and run its setup schematic.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: "Interview tip: answer `ng serve`, then add one or two useful flags (`--port`, `--open`, `--proxy-config`) and mention that `ng build` is what you deploy. It shows you've used the CLI beyond the basics.",
      },
    ],
  },

  'What happens when we run `ng serve`?': {
    summary:
      "`ng serve` reads `angular.json` to find the project's `serve` target and its build options, compiles TypeScript and templates with the Angular compiler, bundles them with esbuild (the modern `application` builder), keeps the output in memory, and starts a Vite-based dev server on localhost:4200. It then watches files: on save it rebuilds only what changed and live-reloads the browser (or hot-replaces styles/templates where supported).",
    details: [
      {
        type: 'paragraph',
        text: 'Since Angular 17, new projects use the esbuild-based `application` builder and a Vite-powered dev server, which made rebuilds much faster than the older webpack-based `browser` builder. The overall steps are the same either way.',
      },
      {
        type: 'flow',
        title: 'What ng serve does, step by step',
        code: `flowchart TD
  A["ng serve"]:::client --> B["Read angular.json<br/>serve target + buildTarget"]:::server
  B --> C["Compile TS + templates<br/>(Angular compiler)"]:::server
  C --> D["Bundle with esbuild<br/>main.js, polyfills, styles"]:::server
  D --> E["Keep output in memory<br/>(nothing written to dist/)"]:::cache
  E --> F["Dev server on<br/>localhost:4200"]:::network
  F --> G["Browser loads index.html"]:::client
  H["File saved"]:::highlight --> I["Incremental rebuild"]:::server
  I --> J["Live reload / HMR<br/>pushed over WebSocket"]:::network
  J --> G`,
      },
      { type: 'heading3', text: 'The configuration it reads' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "projects": {
    "shop-app": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "index": "src/index.html",
            "tsConfig": "tsconfig.app.json",
            "styles": ["src/styles.css"]
          },
          "configurations": { "production": {}, "development": { "optimization": false, "sourceMap": true } },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "development": { "buildTarget": "shop-app:build:development" }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}`,
      },
      { type: 'heading3', text: 'Typical terminal output' },
      {
        type: 'code',
        lang: 'text',
        code: `Initial chunk files | Names         |  Raw size
main.js             | main          | 210.31 kB
polyfills.js        | polyfills     |  89.77 kB
styles.css          | styles        |   1.20 kB

Application bundle generation complete. [1.8 seconds]
Watch mode enabled. Watching for file changes...
  ➜  Local:   http://localhost:4200/`,
      },
      {
        type: 'bullets',
        items: [
          'Development configuration: no minification, source maps on, faster builds, better error messages.',
          'Compile errors (type errors, unknown template elements) are shown in the terminal and as a browser overlay.',
          "Files are served from memory — that's why `dist/` stays empty until you run `ng build`.",
          'The dev server also handles SPA fallback (unknown URLs return `index.html` so the router works) and optional API proxying.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: walk through "angular.json → compile → bundle in memory → dev server → watch & reload". Naming the modern esbuild/Vite toolchain shows you\'re current; contrast with `ng build` writing to `dist/`.',
      },
    ],
  },

  'How do you change the default port of an Angular application when running locally (`ng serve`) or in `angular.json`?':
    {
      summary:
        'For a one-off run use the flag: `ng serve --port 4300`. To make it permanent for the project, set `"port": 4300` under `projects.<name>.architect.serve.options` in `angular.json` (or bake the flag into the `start` script in `package.json`). The command-line flag overrides the `angular.json` value.',
      details: [
        { type: 'heading3', text: 'Option 1 — command-line flag (temporary)' },
        {
          type: 'code',
          lang: 'bash',
          code: `ng serve --port 4300
ng serve --port 4300 --open      # and open the browser
ng serve --port 4300 --host 0.0.0.0  # reachable from phone/other PCs on the LAN`,
        },
        { type: 'heading3', text: 'Option 2 — angular.json (permanent, per project)' },
        {
          type: 'code',
          lang: 'json',
          code: `{
  "projects": {
    "shop-app": {
      "architect": {
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": {
            "port": 4300,
            "host": "localhost",
            "open": true
          },
          "configurations": {
            "development": { "buildTarget": "shop-app:build:development" }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}`,
        },
        { type: 'heading3', text: 'Option 3 — npm script' },
        {
          type: 'code',
          lang: 'json',
          code: `{
  "scripts": {
    "start": "ng serve --port 4300",
    "start:admin": "ng serve admin --port 4400"
  }
}`,
        },
        {
          type: 'bullets',
          items: [
            'Priority: CLI flag > `angular.json` options > default 4200.',
            'In multi-project workspaces (e.g. a shell app and micro-frontends) give each project its own port in `angular.json` so they can run side by side.',
            'If the chosen port is in use, the CLI offers to use another free port.',
            'Older webpack-based projects use `"builder": "@angular-devkit/build-angular:dev-server"` — the `port` option goes in the same place.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Common pitfall: putting `port` under the `build` target instead of `serve`. The port is a dev-server option, so it belongs in `architect.serve.options`.',
        },
        { type: 'divider' },
        { type: 'heading3', text: 'Follow-up: What is the default port of Angular?' },
        {
          type: 'paragraph',
          text: 'The Angular CLI dev server (`ng serve`) runs on port **4200** by default, so the app is available at `http://localhost:4200`. This is only for local development — in production the built files are served by whatever web server you deploy to, on its own port (usually 80/443).',
        },
        {
          type: 'code',
          lang: 'bash',
          code: `ng serve
# ➜  Local:   http://localhost:4200/

ng serve --port 4300     # override for this run
# If 4200 is busy, the CLI asks whether to use a different port instead.`,
        },
        {
          type: 'bullets',
          items: [
            'Other defaults worth knowing: host `localhost` (use `--host 0.0.0.0` to expose it on your network).',
            '`ng test` with Karma uses port 9876 by default.',
            'SSR apps run their Node server on the port from the `PORT` environment variable when deployed (the generated `server.ts` falls back to 4000).',
          ],
        },
      ],
    },

  'How does the browser load an Angular application?': {
    summary:
      'The server returns `index.html`, which contains the root selector (e.g. `<app-root>`) and script/style tags injected by the build. The browser downloads `styles.css`, `polyfills.js` (if any) and `main.js`. `main.js` runs `bootstrapApplication(App, appConfig)`, which creates the platform and root environment injector from the providers, finds the `<app-root>` element, creates the root component, renders its template, and then the router loads the component (and lazy chunks) for the current URL.',
    details: [
      {
        type: 'paragraph',
        text: 'It helps to separate two phases: the **browser phase** (download and parse HTML, CSS, JS — nothing Angular-specific yet) and the **Angular bootstrap phase** (create injectors, render the root component, start change detection and routing).',
      },
      {
        type: 'flow',
        title: 'From URL to rendered Angular app',
        code: `sequenceDiagram
  participant B as Browser
  participant S as Server / CDN
  participant A as Angular runtime
  B->>S: GET /products
  S-->>B: index.html (contains app-root)
  B->>S: GET styles.css, polyfills.js, main.js
  S-->>B: bundles
  B->>A: run main.js
  A->>A: bootstrapApplication(App, appConfig)
  A->>A: create root injector from providers
  A->>B: find app-root, render App template
  A->>S: router lazy-loads products chunk
  A->>B: render route component, start reacting to events`,
      },
      { type: 'heading3', text: '1. index.html (after build)' },
      {
        type: 'code',
        lang: 'html',
        code: `<!doctype html>
<html lang="en">
<head>
  <base href="/">                       <!-- router resolves URLs relative to this -->
  <link rel="stylesheet" href="styles-ABC123.css">
</head>
<body>
  <app-root></app-root>                 <!-- placeholder: empty until Angular renders -->
  <script src="polyfills-XYZ.js" type="module"></script>
  <script src="main-DEF456.js" type="module"></script>
</body>
</html>`,
      },
      { type: 'heading3', text: '2. main.ts — the entry point' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// app.config.ts — app-wide providers
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
  ],
};`,
      },
      { type: 'heading3', text: '3. The root component' },
      {
        type: 'code',
        lang: 'typescript',
        code: `@Component({
  selector: 'app-root',          // must match the tag in index.html
  imports: [RouterOutlet],
  template: \`<app-header /> <router-outlet />\`,
})
export class App {}`,
      },
      {
        type: 'bullets',
        items: [
          'Legacy NgModule apps do the same via `platformBrowserDynamic().bootstrapModule(AppModule)` and `bootstrap: [AppComponent]` in the module.',
          'Lazy routes (`loadComponent`/`loadChildren`) are separate chunks downloaded only when navigated to — keeping `main.js` small.',
          'With SSR, the server sends fully rendered HTML first; the client then **hydrates** it (reuses the DOM) instead of re-rendering — faster first paint.',
          'Hashed filenames (`main-DEF456.js`) allow long-term caching; `index.html` itself should not be cached aggressively.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        text: 'Interview tip: tell it as a story — "index.html → bundles → main.ts → bootstrapApplication → root injector → app-root rendered → router". Mentioning lazy chunks and hydration lifts the answer to senior level.',
      },
    ],
  },

  'Is `AppComponent` mandatory? Can we build and bootstrap an Angular project without `AppComponent`?':
    {
      summary:
        "No. `AppComponent` is just the CLI's default name. You can bootstrap any standalone component with `bootstrapApplication(AnyComponent)`, as long as its selector is in `index.html`. You can even start Angular with no root component at all using `createApplication()` — for example to expose components as Angular Elements (custom elements) — or with `ngDoBootstrap()` in a legacy NgModule app.",
      details: [
        {
          type: 'paragraph',
          text: 'This question focuses on alternatives. There are three practical ways to start an Angular app, and only the first two use a root component of any name.',
        },
        { type: 'heading3', text: '1. Any component as root (standalone)' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@Component({
  selector: 'dashboard-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class DashboardShell {}

bootstrapApplication(DashboardShell, {
  providers: [provideRouter(routes)],
});
// index.html: <dashboard-root></dashboard-root>`,
        },
        { type: 'heading3', text: '2. No root component — Angular Elements via createApplication' },
        {
          type: 'code',
          lang: 'typescript',
          code: `import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';

// Starts Angular (platform + root injector) without rendering any root component
const appRef = await createApplication({ providers: [provideHttpClient()] });

// Register components as native web components usable in ANY HTML page
customElements.define(
  'price-widget',
  createCustomElement(PriceWidgetComponent, { injector: appRef.injector }),
);
// <price-widget currency="INR"></price-widget> can now be used in a CMS or another framework`,
        },
        { type: 'heading3', text: '3. Legacy NgModule — manual bootstrap' },
        {
          type: 'code',
          lang: 'typescript',
          code: `@NgModule({
  imports: [BrowserModule],
  // no bootstrap: [...] array
})
export class AppModule implements DoBootstrap {
  ngDoBootstrap(appRef: ApplicationRef) {
    // Decide at runtime what to bootstrap
    const isAdmin = document.querySelector('admin-root');
    appRef.bootstrap(isAdmin ? AdminRootComponent : PublicRootComponent);
  }
}

platformBrowserDynamic().bootstrapModule(AppModule);`,
        },
        {
          type: 'bullets',
          items: [
            'Use cases for no root component: embedding widgets in non-Angular sites, micro-frontends, gradual migration from AngularJS/other frameworks.',
            'Building (`ng build`) only needs an entry file (`main.ts`); the component tree is whatever that file bootstraps.',
            "Recent CLI versions generate the root as `App` in `app.ts`, so many new projects don't have an `AppComponent` at all.",
          ],
        },
        { type: 'divider' },
        {
          type: 'heading3',
          text: "Follow-up: What happens if we don't have `AppComponent` in an Angular project?",
        },
        {
          type: 'paragraph',
          text: "`AppComponent` is only a naming convention from the CLI — Angular doesn't look for that name. What Angular needs is **a root component to bootstrap**: whatever class you pass to `bootstrapApplication()` (or list in an NgModule's `bootstrap` array), whose selector exists in `index.html`. If you rename it, the app works. If you delete it without bootstrapping anything else, the build fails on the broken import, and with no bootstrapped component nothing renders.",
        },
        { type: 'heading3', text: 'Scenario 1 — renamed root component: works fine' },
        {
          type: 'code',
          lang: 'typescript',
          code: `// shell.component.ts
@Component({ selector: 'app-shell', template: '<h1>Hello</h1>' })
export class ShellComponent {}

// main.ts
bootstrapApplication(ShellComponent, appConfig);

// index.html must contain: <app-shell></app-shell>`,
        },
        { type: 'heading3', text: 'Scenario 2 — the selector is missing from index.html' },
        {
          type: 'code',
          lang: 'text',
          code: `index.html has <app-root>, but the bootstrapped component's selector is 'app-shell'

→ Runtime error in the console, roughly:
  The selector "app-shell" did not match any elements
→ Blank page`,
        },
        { type: 'heading3', text: 'Scenario 3 — AppComponent deleted, nothing replaces it' },
        {
          type: 'code',
          lang: 'text',
          code: `main.ts still imports './app/app.component'
→ Build error: Could not resolve "./app/app.component"

Legacy NgModule app with an empty bootstrap array and no ngDoBootstrap():
→ Runtime error: the module was bootstrapped but declares no
  "bootstrap" components nor an "ngDoBootstrap" method`,
        },
        {
          type: 'bullets',
          items: [
            'The root component is the top of the component tree and the host for `<router-outlet>`, layout (header/footer) and app-level setup.',
            'Without a root component you can still start Angular in special cases — e.g. `createApplication()` to register Angular Elements (web components), or `ngDoBootstrap()` in an NgModule to bootstrap manually.',
            'You can even bootstrap several root components (multiple `bootstrapApplication` calls, or several entries in an NgModule `bootstrap` array) — rare, but valid.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Interview tip: "Not mandatory" + one alternative (`createApplication` with Angular Elements) is a strong, memorable answer — it shows you understand bootstrapping, not just the CLI template.',
        },
      ],
    },

  'What are new features of Angular 21?': {
    summary:
      'Angular 21 (released November 2025) continued the move to a signal-first, zoneless framework. Headline changes: new projects are **zoneless by default** (no zone.js), **Vitest** replaces Karma as the default unit-test runner, experimental **Signal Forms** (a signal-based forms API), **Angular Aria** in developer preview (headless, accessible UI primitives), and expanded AI tooling through the Angular CLI **MCP server**. Always confirm details against the official release notes for your exact version.',
    details: [
      {
        type: 'paragraph',
        text: 'For "what\'s new in version X" questions, interviewers want to see that you follow the ecosystem and understand the direction — signals, zoneless change detection, better tooling — rather than a memorised changelog. Mention the features, why they matter, and whether they are stable, developer preview or experimental.',
      },
      { type: 'heading3', text: '1. Zoneless by default for new apps' },
      {
        type: 'code',
        lang: 'typescript',
        code: `// New projects no longer include zone.js. Change detection is driven by
// signals, template events, async pipe, and explicit markForCheck().
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Existing apps that still want Zone.js-based detection can opt in:
    // provideZoneChangeDetection({ eventCoalescing: true }),
  ],
};`,
      },
      {
        type: 'paragraph',
        text: 'Benefits: smaller bundles, no monkey-patched browser APIs, cleaner stack traces, and predictable change detection. Code that mutates plain fields inside `setTimeout` or third-party callbacks without signals may no longer refresh the view.',
      },
      { type: 'heading3', text: '2. Signal Forms (experimental)' },
      {
        type: 'code',
        lang: 'typescript',
        code: `import { form, required, email } from '@angular/forms/signals';

export class SignupComponent {
  // The model is a plain signal…
  model = signal({ name: '', email: '' });

  // …and form() builds a field tree with validation on top of it
  signupForm = form(this.model, (path) => {
    required(path.name);
    email(path.email);
  });
  // Each field exposes signals such as value(), valid(), errors(), touched().
  // The template binds inputs to fields with a field directive (the exact
  // directive name has changed between pre-release versions — check the docs).
}`,
      },
      { type: 'heading3', text: '3. Vitest as the default test runner' },
      {
        type: 'code',
        lang: 'bash',
        code: `ng new my-app        # new projects are set up with Vitest
ng test              # runs Vitest through the Angular CLI builder

# Existing Karma/Jasmine projects keep working; the CLI provides
# a migration path (schematic) when you decide to switch.`,
      },
      { type: 'heading3', text: 'Other notable items' },
      {
        type: 'bullets',
        items: [
          '**Angular Aria** (developer preview) — headless directives for accessible patterns (e.g. tabs, menus, listbox, combobox) that you style yourself.',
          '**MCP server in the Angular CLI** — lets AI coding assistants query Angular docs/best practices and run CLI-aware tasks.',
          '**HttpClient provided by default** — basic HTTP usage no longer requires adding `provideHttpClient()` (you still call it to configure interceptors or `withFetch()`).',
          'Continued migrations/schematics toward modern APIs (standalone, signal inputs, `@if/@for` control flow) and away from `NgClass`/`NgStyle` in favour of class/style bindings.',
          'Context from v20, which v21 builds on: stable signal APIs (`effect`, `linkedSignal`, `toSignal`), stable zoneless APIs, and incremental hydration for SSR.',
        ],
      },
      {
        type: 'flow',
        title: 'Direction of recent Angular releases',
        code: `flowchart LR
  A["v16-17<br/>Signals, standalone default,<br/>@if / @for, esbuild"]:::client --> B["v18-19<br/>Zoneless preview,<br/>signal inputs, linkedSignal,<br/>incremental hydration"]:::server
  B --> C["v20<br/>Stable signal APIs,<br/>zoneless stable"]:::server
  C --> D["v21<br/>Zoneless default, Vitest,<br/>Signal Forms, Angular Aria"]:::highlight`,
      },
      {
        type: 'callout',
        variant: 'warning',
        text: 'Be precise about status: Signal Forms were experimental and Angular Aria was in developer preview at launch. Saying "I would not use experimental APIs in production without a fallback plan" is a good, mature point. Always double-check version specifics in the official changelog before an interview.',
      },
    ],
  },
};
