# 🅰️ Angular Interview PrepHub

> **A premium, interactive Angular interview preparation dashboard** — built with Angular 22, featuring progress tracking, personal study notes, smart filtering, and a mock interview mode.

🌐 **Live Demo:** [https://prathapmohan27.github.io/angular-interview/](https://prathapmohan27.github.io/angular-interview/)

---

## 📸 Overview

**Angular Interview PrepHub** is a fully-featured study companion for developers preparing for Angular technical interviews. It organises 200+ carefully curated interview questions across 14 topic categories — from core fundamentals to advanced architectural patterns.

---

## ✨ Features

### 🎯 Smart Study Tracking
- **Mark as Mastered** — Check off questions you've confidently prepared, with visual strikethrough and green indicator
- **Star Questions** — Bookmark tricky or high-priority questions for focused review
- **Preparation Progress** — Per-category progress bars and a global completion percentage tracker
- All state is **automatically persisted** to `localStorage` — your progress survives page refreshes

### 📝 Personal Study Notes
- Expand any question to reveal a **private notes drawer**
- Write your own answer, key talking points, or code snippets
- Notes auto-save silently to `localStorage`

### 🔍 Smart Filtering & Search
- **Live keyword search** across all questions
- **Filter tabs**: All · Mastered · Starred · Unprepared
- **Category sidebar** — jump to a specific topic or browse all at once
- **Expand / Collapse All** categories with a single click

### 🎲 Mock Interview Mode
- Hit **Mock Me** to get a randomly selected question from the current view
- Instantly mark it as mastered or shuffle to the next one
- Links directly to Angular docs search for that topic

### 🔗 Quick Actions on Every Question
- **Copy** question text to clipboard
- **Angular Docs** — Google search scoped to `angular.dev`
- **Search Google** — full web search with "Angular" prefixed

---

## 📚 Question Categories

| # | Category | Topics Covered |
|---|----------|----------------|
| 1 | **TypeScript** | Types, Interfaces, Generics, ES6+ |
| 2 | **JavaScript Fundamentals** | Event Loop, Closures, Debounce, Throttle |
| 3 | **Signals & Reactivity** | Signals, Computed, Effect, BehaviorSubject |
| 4 | **Change Detection** | Default vs OnPush, Zone-less, markForCheck |
| 5 | **RxJS & Observables** | Operators, switchMap, shareReplay, Schedulers |
| 6 | **Scenario-Based** | Real-world problem solving with RxJS |
| 7 | **Components & Templates** | Lifecycle hooks, ViewChild, ng-content |
| 8 | **Directives & Decorators** | Custom directives, HostListener |
| 9 | **Forms** | Reactive Forms, FormArray, Dynamic Forms |
| 10 | **Routing & Guards** | Lazy Loading, Guards, Resolvers |
| 11 | **State Management & Architecture** | NgRx, Interceptors, DI, Micro Frontends |
| 12 | **Performance, Testing & Tooling** | SSR/CSR, Virtual Scrolling, CI/CD, AI Tools |
| 13 | **Interview Round: Live Q&A** | Real interview session questions |
| 14 | **Coding Round** | Palindrome, Debounce, Flatten, Duplicates |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 22 | Core framework (Standalone components, Signals) |
| **TypeScript** | ~6.0 | Type safety |
| **Tailwind CSS** | 4.x | Utility classes + PostCSS |
| **RxJS** | ~7.8 | Reactive utilities |
| **Vitest** | 4.x | Unit testing |
| **Tabler Icons** | Latest | Icon set (CDN) |
| **Google Fonts** | — | Inter + Plus Jakarta Sans typography |
| **angular-cli-ghpages** | 3.x | GitHub Pages deployment |

### Angular Patterns Used
- ✅ **Standalone Components** — no NgModules
- ✅ **Signals** (`signal`, `computed`, `effect`) — reactive state
- ✅ **Input/Output signals** — modern component API
- ✅ **`@for` / `@if` control flow** — Angular 17+ template syntax
- ✅ **`inject()`** — functional dependency injection
- ✅ **Custom Pipe** — `HighlightPipe` for search term highlighting

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) `v20+`
- [npm](https://www.npmjs.com/) `v11+`
- Angular CLI `v22`

```bash
npm install -g @angular/cli
```

### Installation

```bash
# Clone the repository
git clone https://github.com/prathapmohan27/angular-interview.git
cd angular-interview

# Install dependencies
npm install
```

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The app hot-reloads on any file save.

### Production Build

```bash
npm run build
# Output: dist/angular-interview/
```

### Run Tests

```bash
npm test
# or
ng test
```

---

## 🌐 Deployment (GitHub Pages)

This project is configured to deploy automatically to GitHub Pages using [`angular-cli-ghpages`](https://github.com/angular-schule/angular-cli-ghpages).

```bash
ng deploy
```

This builds the app in production mode and pushes it to the `gh-pages` branch of the repository.

**Live URL:** `https://prathapmohan27.github.io/angular-interview/`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── questions.component.ts    # Main dashboard layout (sidebar + main panel)
│   │   ├── header.component.ts       # Search bar, filters, Mock Me button
│   │   ├── stats.component.ts        # Progress metric cards
│   │   ├── category.component.ts     # Accordion category card with progress bar
│   │   └── question-item.component.ts # Question card with notes, star, mastery toggle
│   ├── pipes/
│   │   └── highlight.pipe.ts         # Search term highlighting
│   ├── services/
│   │   └── question.service.ts       # All interview questions data
│   ├── app.ts                        # Root component
│   ├── app.config.ts                 # App bootstrap configuration
│   └── app.routes.ts                 # Router configuration
├── styles.css                        # Global styles, glassmorphism, animations
└── index.html                        # Fonts & Tabler Icons CDN
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add more questions, fix bugs, or improve the UI:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/add-questions`
3. Commit your changes: `git commit -m "feat: add more NgRx questions"`
4. Push to the branch: `git push origin feat/add-questions`
5. Open a Pull Request

### Adding Questions

All questions live in [`src/app/services/question.service.ts`](./src/app/services/question.service.ts). Simply add new strings to the relevant category's `questions` array.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <p>Built with ❤️ for Angular developers preparing for their next interview.</p>
  <p>
    <a href="https://prathapmohan27.github.io/angular-interview/">🌐 Live Demo</a> •
    <a href="https://github.com/prathapmohan27/angular-interview/issues">🐛 Report Bug</a> •
    <a href="https://github.com/prathapmohan27/angular-interview/issues">💡 Request Feature</a>
  </p>
</div>
