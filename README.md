# PrepHub

**Interview preparation for Angular and Node.js developers.** Questions with model answers, timed mock interviews, a daily practice routine, and visual explainers for core backend concepts and system design.

🌐 **Live:** [prathapmohan27.github.io/prephub](https://prathapmohan27.github.io/prephub/)

---

## What's inside

| Section            | What you get                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interview Q&A**  | **380 questions** in three tracks: **Foundations** (JavaScript, TypeScript, browser: 3 topics, 41 questions), **Angular** (22 topics, 196 questions) and **Node.js** (19 topics, 143 questions), each with a quick answer and a detailed explanation |
| **Mock Me**        | Timed mock interview sessions over any set of questions, with self-rating and a results summary                                                                                                                                                      |
| **Daily Learning** | 10 questions a day from one topic, a mix of topics, or at random, with a daily streak                                                                                                                                                                |
| **Core Concepts**  | 15 explainers with diagrams: how the internet, DNS, HTTP/HTTPS, browsers, APIs, databases, caching, load balancers, message queues and scaling work, plus back-of-the-envelope estimation                                                            |
| **System Design**  | 14 worked designs: URL shortener, rate limiter, chat, news feed, notifications, payments, ride sharing, video streaming, file storage, ticket booking, search autocomplete, unique ID generator, distributed cache and distributed load balancer     |

## Interview Q&A

- **Three tracks.** Foundations (shared JavaScript, TypeScript and browser topics), Angular and Node.js. Switch at the top of the topics sidebar; each track remembers the last question you opened.
- **Core and Senior levels.** About 40% of questions are marked **Senior**: internals, trade-offs, design and production scenarios. Filter by level in the sidebar; topics are grouped into sections such as _Reactivity_ or _Data & state_.
- **Track your progress.** Mark questions as **mastered** and **star** the ones to revisit. Every topic shows mastered/total, and the filter tabs (All · Mastered · Starred · Unprepared) show counts.
- **List + reader.** Pick a question from the list and read the answer beside it. On phones, the reader opens full screen.
- **Search** across all questions in the current track.
- **Shareable links.** The URL holds the topic and question (`?topic=forms&q=…`), so a refresh or a shared link opens the same question.
- **Keyboard first:**

  | Key                  | Action                        |
  | -------------------- | ----------------------------- |
  | `J` / `→`, `K` / `←` | Next / previous question      |
  | `M`                  | Mark as mastered / unprepared |
  | `S`                  | Star / unstar                 |
  | `/`                  | Search                        |
  | `F`                  | Focus mode (collapse topics)  |
  | `Esc`                | Close / back to list          |
  | `?`                  | Show all shortcuts            |

## Mock Me

Click **Mock Me** to practise on the questions currently on screen (the selected topic, filter and search all apply).

1. **Set up.** Choose a 5, 10 or 20 question session, or endless free practice. The thinking timer is 2 minutes per question, or 5 for system design and coding rounds, and can be turned off.
2. **Answer out loud**, then reveal the model answer.
3. **Rate yourself.** _Nailed it_ marks the question mastered, _Blanked_ un-marks it, _Shaky_ leaves it alone. Your ratings shape the order of later sessions: missed and unmastered questions come up sooner, and recently nailed ones come up later.
4. **Review.** See your score, time per question and weakest topics. Retry the missed questions or star them in one click.

Mock Me shortcuts: `Enter` start · `Space` reveal · `1` `2` `3` rate · `N` skip · `T` timer · `R` retry missed · `Esc` end.

All progress (mastered, starred, ratings, streaks, preferences) is saved in your browser's `localStorage`. There's no account and no server.

---

## Tech stack

- **Angular 22**: standalone components, signals, built-in control flow, lazy-loaded routes
- **Tailwind CSS 4** plus hand-written component CSS
- **Mermaid** and **highlight.js** for diagrams and code samples
- **Tabler Icons**, **Inter** and **Plus Jakarta Sans**
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
├── styles.css                  # Design tokens, shared panels and buttons
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
    │   └── flow-diagram/
    └── services/
        ├── question.ts         # Topics and questions for both tracks
        ├── answers/            # One file of model answers per topic
        ├── core-concepts/      # One file per concept
        ├── system-design/      # One file per design
        └── daily-learning.ts
```

## Adding content

- **A question:** add the string to its topic's `questions` array in `src/app/services/question.ts`. The track comes from `trackOf()` in the same file: topics listed in `FOUNDATION_TOPICS` are Foundations, topics whose `id` starts with `nodejs-` are Node.js, and the rest are Angular.
- **Its answer:** add an entry keyed by the exact question text to that topic's file in `src/app/services/answers/`, with a `summary` (the quick answer) and `details` (content blocks such as paragraphs, headings, bullets and code).
- **Senior question?** Add its exact text to `SENIOR_QUESTIONS` in `question.ts`. New topics go into a section in `TOPIC_GROUPS` (otherwise they appear under "More").
- **Renaming a question?** Add the old → new text to `RENAMED_QUESTIONS` in `question.ts` so people's saved progress carries over.

## Contributing

1. Create a branch: `git checkout -b feat/your-change`
2. Commit with a Conventional Commit message, e.g. `feat: add RxJS error-handling questions` (commitlint enforces this)
3. Push and open a pull request

Bugs and ideas: [open an issue](https://github.com/prathapmohan27/prephub/issues).
