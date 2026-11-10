# PrepHub

**Interview preparation for Angular and Node.js developers.** Questions with model answers, timed mock interviews, a daily practice routine, and visual explainers for core backend concepts and system design.

🌐 **Live:** [prathapmohan27.github.io/prephub](https://prathapmohan27.github.io/prephub/)

---

## What's inside

| Section            | What you get                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interview Q&A**  | **559 questions** in three tracks: **Foundations** (JavaScript, TypeScript, predict-the-output puzzles, browser, accessibility, web performance, data structures & algorithms, JavaScript coding, low-level design & OOP, full-stack scenarios and behavioral & leadership: 11 topics, 145 questions), **Angular** (21 topics, 185 questions) and **Node.js** (23 topics, 229 questions, including MongoDB in depth, Express & error handling in depth, API Design, Auth in Depth, AWS & Cloud and Distributed Systems), each with a quick answer and a detailed explanation |
| **Mock Me**        | Timed mock interview sessions over any set of questions, with self-rating and a results summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Daily Learning** | 10 questions a day from one topic, a mix of topics, or at random, with a daily streak                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Core Concepts**  | 15 explainers with diagrams: how the internet, DNS, HTTP/HTTPS, browsers, APIs, databases, caching, load balancers, message queues and scaling work, plus back-of-the-envelope estimation                                                                                                                                                                                                                                                                                                                                                                                    |
| **System Design**  | 14 worked designs: URL shortener, rate limiter, chat, news feed, notifications, payments, ride sharing, video streaming, file storage, ticket booking, search autocomplete, unique ID generator, distributed cache and distributed load balancer                                                                                                                                                                                                                                                                                                                             |

## Interview Q&A

- **Three tracks.** Foundations (shared JavaScript, TypeScript and browser topics), Angular and Node.js. Switch at the top of the topics sidebar; each track remembers the last question you opened.
- **Core and Senior levels.** About half of the questions are marked **Senior**: internals, trade-offs, design and production scenarios. Filter by level next to the status tabs; topics are grouped into sections such as _Reactivity_ or _Data & state_.
- **Track your progress.** Rate each answer **Nailed it / Shaky / Blanked** (the same scale as Mock Me, which uses it to bring weak questions back sooner), mark questions **mastered** and **star** the ones to revisit. Every count follows the active level, topic and search filters.
- **Practice mode.** Hide answers until you reveal them, so you answer out loud first instead of just reading.
- **List + reader.** The list shows short titles that lead with what sets each question apart; the reader shows the full question and answer, with a table of contents for long answers. On phones, the reader opens full screen.
- **Search** across all questions in the current track.
- **Shareable links.** The URL holds the topic and question (`?topic=forms&q=…`), so a refresh or a shared link opens the same question.
- **Keyboard first:**

  | Key                  | Action                           |
  | -------------------- | -------------------------------- |
  | `J` / `→`, `K` / `←` | Next / previous question         |
  | `1` `2` `3`          | Rate Nailed it / Shaky / Blanked |
  | `M`                  | Mark as mastered / unprepared    |
  | `P`                  | Practice mode (hide answers)     |
  | `Space`              | Reveal the answer in practice    |
  | `S`                  | Star / unstar                    |
  | `/`                  | Search                           |
  | `F`                  | Focus mode (collapse topics)     |
  | `Esc`                | Close / back to list             |
  | `?`                  | Show all shortcuts               |

## Mock Me

Click **Mock Me** to practise on the questions currently on screen (the selected topic, filter and search all apply).

1. **Set up.** Choose a 5, 10 or 20 question session, or endless free practice. The thinking timer is 2 minutes per question, or 5 for system design and coding rounds, and can be turned off.
2. **Answer out loud**, then reveal the model answer.
3. **Rate yourself.** _Nailed it_ marks the question mastered, _Blanked_ un-marks it, _Shaky_ leaves it alone. Your ratings shape the order of later sessions: missed and unmastered questions come up sooner, and recently nailed ones come up later.
4. **Review.** See your score, time per question and weakest topics. Retry the missed questions or star them in one click.

Mock Me shortcuts: `Enter` start · `Space` reveal · `1` `2` `3` rate · `N` skip · `T` timer · `R` retry missed · `Esc` end.

All progress (mastered, starred, ratings, streaks, preferences) is saved in your browser's `localStorage`. There's no account and no server. Use **Back up** / **Restore** on the home page to save your progress to a JSON file or move it to another device.

---

## Tech stack

- **Angular 22**: standalone components, signals, built-in control flow, lazy-loaded routes
- **Taiga UI 5** as the component library (buttons, inputs, select, segmented controls, chips, badges, switches, progress, dialogs). See [UI components](#ui-components-taiga-ui)
- **Tailwind CSS 4** plus hand-written layout CSS
- **Mermaid** and **highlight.js** for diagrams and code samples
- **Taiga UI icons** (`@tui.*`, Lucide) inside Taiga components; **Tabler Icons** for content icons (topics, sections); **Inter** and **Plus Jakarta Sans**
- **ESLint** (angular-eslint), **Prettier**, **Husky** + **lint-staged** + **commitlint** (Conventional Commits)
- **Vitest** via `ng test`
- **GitHub Pages** via `angular-cli-ghpages`

## Getting started

Requires a recent Node.js LTS (the project uses npm 11).

```bash
git clone https://github.com/prathapmohan27/prephub.git
cd prephub
npm install
npm start          # http://localhost:4200
```

| Command          | What it does                            |
| ---------------- | --------------------------------------- |
| `npm start`      | Dev server with live reload             |
| `npm run build`  | Production build into `dist/prephup/`   |
| `npm run lint`   | ESLint over `src/**/*.ts` and templates |
| `npm run format` | Prettier over the whole project         |
| `npm test`       | Unit tests (Vitest)                     |

The Angular CLI is a local dependency, so use `npx ng …` (or `npm run ng -- …`) unless you've installed it globally.

## Deployment

The `deploy` target in `angular.json` builds the app and publishes it to the `gh-pages` branch, with the base href set for `/prephub/`:

```bash
npx ng deploy
```

## Project structure

```
src/
├── index.html                  # Fonts, icon font, favicons
├── styles.css                  # Design tokens (colours, radii, fonts), shared panels
├── taiga-theme.css             # Maps Taiga UI's --tui-* variables onto the tokens above
└── app/
    ├── app.routes.ts           # Home, Q&A, Daily, Core Concepts, System Design
    ├── components/
    │   ├── app-nav/            # Top nav (bottom tab bar on phones)
    │   ├── home/
    │   ├── questions/          # Q&A page: topics sidebar, list + reader, shortcuts
    │   ├── header/             # Search, filter tabs, Mock Me button
    │   ├── question-list/
    │   ├── question-reader/
    │   ├── answer/             # Quick answer + detailed explanation
    │   ├── mock-interview/     # Mock Me sessions, timer, rating, summary
    │   ├── daily-learning/
    │   ├── core-concepts/
    │   ├── system-design/
    │   ├── content-blocks/     # Renders rich content (text, lists, code, callouts, flows)
    │   ├── flow-diagram/
    │   └── shared/             # Small helpers shared by pages (e.g. difficulty badge colours)
    └── services/
        ├── question.ts         # Topics and questions for both tracks
        ├── answers/            # One file of model answers per topic
        ├── core-concepts/      # One file per concept
        ├── system-design/      # One file per design
        ├── daily-learning.ts
        └── theme.service.ts    # Light / dark; also drives Taiga UI's dark mode
```

## UI components (Taiga UI)

[Taiga UI](https://taiga-ui.dev) is the standard component library. Use its components for every control instead of writing new button or input CSS. The full docs are in `.agents/skills/taiga-ui/llms-full.txt`; check the import map at the top of that file, since importing from the wrong package is the most common mistake.

**Setup (already done):** `provideTaiga()` and `provideAppTheme()` in `app.config.ts`, `<tui-root>` in `app.ts`, the theme stylesheet and icon assets in `angular.json`.

**Which component for what:**

| Need                             | Use                                                                                                           | Package |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------- |
| Button / link styled as a button | `<button tuiButton appearance="…">`, `<a tuiButton>`                                                          | core    |
| Icon-only button                 | `<button tuiIconButton iconStart="@tui.x">Label for screen readers</button>`                                  | core    |
| On/off toggle button             | `appearance="outline-grayscale"` + `[tuiAppearanceMode]="on ? 'checked' : null"`                              | core    |
| Text input                       | `<tui-textfield><input tuiInput [(ngModel)] /></tui-textfield>`                                               | core    |
| Dropdown select                  | `<tui-textfield tuiChevron><input tuiSelect /><tui-data-list-wrapper *tuiDropdown [items] /></tui-textfield>` | kit     |
| One-of-N choice                  | `<tui-segmented [activeItemIndex]>` with `<button>` children                                                  | kit     |
| Removable / selectable pill      | `<button tuiChip>`                                                                                            | kit     |
| Status label                     | `<span tuiBadge appearance="positive \| warning \| negative \| info \| neutral">`                             | kit     |
| Switch                           | `<input tuiSwitch type="checkbox">`                                                                           | kit     |
| Progress                         | `<progress tuiProgressBar>`, `<tui-progress-circle>`                                                          | kit     |
| Modal                            | `<ng-template [(tuiDialog)]="open">`, or `TuiDialogService`                                                   | core    |
| Confirm                          | `TuiDialogService.open(TUI_CONFIRM, …)`                                                                       | kit     |
| Spinner                          | `<tui-loader>`                                                                                                | core    |

**Conventions:**

- **Appearances:** `primary` for the main action (violet), `secondary-grayscale` for ordinary buttons, `flat-grayscale` for quiet ones, and status appearances (`positive` / `warning` / `negative` / `info`) for ratings and states. `info` is the app's violet.
- **Sizes:** buttons default to `s` and textfields to `m` (set in `app.config.ts`). Pass `size` only to deviate, such as `xs` in dense rows. Prefer `s` / `m`; larger sizes switch to Taiga's 16 px+ type.
- **Icons:** inside Taiga components, use Taiga icons via `iconStart` / `iconEnd` (`@tui.<lucide-name>`; browse `node_modules/@taiga-ui/icons/src`). Data-driven icons (topic and section icons in `services/`) stay Tabler `<i class="ti …">`.
- **Colours and type:** don't hard-code colours on Taiga components. Change the token in `styles.css`, or the mapping in `src/taiga-theme.css`, and every component follows. Light / dark is set by `ThemeService` only; it feeds Taiga's `TUI_DARK_MODE`, so don't inject and set `TUI_DARK_MODE` directly.
- **Always-dark areas** (code blocks, diagrams) put `tuiTheme: 'dark'` on their host so the Taiga controls inside them use the dark palette.
- **No wrappers:** use Taiga components directly in templates. Shared defaults belong in providers (`tui*OptionsProvider`) or in `taiga-theme.css`, not in wrapper components.

**Upgrading Taiga UI:** keep all `@taiga-ui/*` packages on the same version, then run `ng update @taiga-ui/cdk`, which runs Taiga's migrations. Review the `// TODO: (Taiga UI migration)` comments it leaves. This repo uses `legacy-peer-deps`, so after an upgrade, check that every Taiga peer dependency is still installed (see "Troubleshooting" in the docs file). If `ng serve` then shows `NG0201: No provider found for TuiTextfieldComponent` or similar while `ng build` works, delete `.angular/cache` and restart. It's a stale pre-bundled dependency cache.

## Adding content

- **A question:** add `{ id, text }` to its topic's `questions` array in `src/app/services/question.ts`. The `id` is a kebab-case name that is unique across all topics and **never changes**: progress, ratings, answers, short titles and shared links are keyed by it. Add `senior: true` for questions about internals, trade-offs, design or production scenarios. The track comes from `trackOf()` in the same file: topics listed in `FOUNDATION_TOPICS` are Foundations, topics whose `id` starts with `nodejs-` are Node.js, and the rest are Angular. New topics go into a section in `TOPIC_GROUPS` (otherwise they appear under "More").
- **Its answer:** add an entry keyed by the question's `id` to that topic's file in `src/app/services/answers/`, with a `summary` (the quick answer) and `details` (content blocks such as paragraphs, headings, bullets and code).
- **Its list title:** add a short title (48 characters or fewer) under the same `id` in `src/app/services/short-titles.ts`.
- **Rewording a question:** just edit its `text`. The `id` stays, so nobody loses progress.
- **Check your work:** `node scripts/check-answers.mjs` verifies ids, answers and short titles; `node scripts/check-diagrams.mjs` validates Mermaid diagrams.

## Contributing

1. Create a branch: `git checkout -b feat/your-change`
2. Commit with a Conventional Commit message, e.g. `feat: add RxJS error-handling questions` (commitlint enforces this)
3. Push and open a pull request

Bugs and ideas: [open an issue](https://github.com/prathapmohan27/prephub/issues).
