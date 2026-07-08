# 🅰️ InterviewPrepHub

> **A premium, interactive interview preparation dashboard** — built with a modern web framework, featuring progress tracking, personal study notes, smart filtering, and a mock interview mode.

🌐 **Live Demo:** [https://prathapmohan27.github.io/prephub/](https://prathapmohan27.github.io/prephub/)

---

## 📸 Overview

**InterviewPrepHub** is a fully-featured study companion for developers preparing for technical interviews in **any language, framework, or domain**. It organises a curated bank of interview questions across topic categories you define — from core fundamentals to advanced architectural patterns. Swap in questions for JavaScript, Python, Java, system design, data structures & algorithms, DevOps, SQL, or any other subject — the dashboard itself doesn't care what it's teaching you.

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
- Links directly to official docs (or a reference site of your choice) for that topic

### 🔗 Quick Actions on Every Question
- **Copy** question text to clipboard
- **Docs Search** — Google search scoped to a documentation domain you configure
- **Search Google** — full web search with your subject prefixed

---

## 📚 Question Categories

The categories below are just a starting template — replace them with whatever subject you're studying. Each category is simply a label plus an array of question strings, so it works equally well for a language, a framework, or a general CS topic.

| # | Category | Example Topics Covered |
|---|----------|----------------|
| 1 | **Language Fundamentals** | Types, syntax, core language features |
| 2 | **Core Concepts** | Runtime behavior, memory model, execution flow |
| 3 | **State & Reactivity** | State management patterns, reactive primitives |
| 4 | **Performance & Optimization** | Rendering/compute efficiency, profiling |
| 5 | **Asynchronous Programming** | Promises, streams, concurrency patterns |
| 6 | **Scenario-Based** | Real-world problem solving |
| 7 | **Components / Modules** | Lifecycle, composition, encapsulation |
| 8 | **Extensibility Patterns** | Plugins, decorators, custom extensions |
| 9 | **Data Handling** | Forms, validation, data structures |
| 10 | **Navigation & Access Control** | Routing, guards, permissions |
| 11 | **Architecture** | Design patterns, dependency injection, scaling |
| 12 | **Testing & Tooling** | Unit/integration testing, CI/CD, tooling |
| 13 | **Live Interview Q&A** | Real interview session questions |
| 14 | **Coding Round** | Algorithms, data structure challenges |

---

## 🛠️ Tech Stack

The dashboard shell can be built with any modern frontend stack. A typical setup looks like this — substitute your framework of choice:

| Technology | Purpose |
|------------|---------|
| **Frontend Framework** | React, Vue, Angular, Svelte, or plain JS — your choice |
| **TypeScript** | Type safety (optional but recommended) |
| **Tailwind CSS** (or similar) | Utility classes for styling |
| **State/Reactive Library** | RxJS, Signals, Redux, Zustand, Pinia, etc. |
| **Test Runner** | Vitest, Jest, Jasmine, or your preferred framework |
| **Icon Set** | Tabler Icons, Lucide, Font Awesome, etc. |
| **Web Fonts** | Any Google Fonts pairing |
| **Static Hosting / Deploy Tool** | GitHub Pages, Netlify, Vercel, etc. |

### Design Patterns Used
- ✅ **Component-based architecture** — modular, composable UI
- ✅ **Reactive state primitives** — signals, observables, or store-based state
- ✅ **Declarative rendering / control flow** — whatever your framework's modern syntax offers
- ✅ **Dependency injection or equivalent composition pattern**
- ✅ **Custom highlight/formatting utility** — for search term highlighting

---

## 🚀 Getting Started

### Prerequisites
- A recent Node.js LTS release
- npm, pnpm, or yarn
- The CLI for whichever framework you choose (if any)

```bash
# Example: install a framework CLI
npm install -g <your-framework-cli>
```

### Installation

```bash
# Clone the repository
git clone https://github.com/prathapmohan27/prephub.git
cd prephub

# Install dependencies
npm install
```

### Development Server

```bash
npm start
# or your framework's dev-server command
```

Navigate to `http://localhost:4200/` (or whatever port your dev server uses). The app hot-reloads on any file save.

### Production Build

```bash
npm run build
# Output: dist/ (path varies by framework)
```

### Run Tests

```bash
npm test
```

---

## 🌐 Deployment

This project can be deployed to any static host — GitHub Pages, Netlify, Vercel, Cloudflare Pages, or an S3 bucket. A GitHub Pages example:

```bash
npm run build
npx gh-pages -d dist
```

**Live URL:** `https://prathapmohan27.github.io/prephub/`

---

## 📁 Project Structure

```
src/
├── app/ (or src/)
│   ├── components/
│   │   ├── questions/           # Main dashboard layout (sidebar + main panel)
│   │   ├── header/              # Search bar, filters, Mock Me button
│   │   ├── stats/                # Progress metric cards
│   │   ├── category/             # Accordion category card with progress bar
│   │   └── question-item/        # Question card with notes, star, mastery toggle
│   ├── utils/
│   │   └── highlight.ts          # Search term highlighting helper
│   ├── data/
│   │   └── questions.ts          # All interview questions data — this is the file you edit to change subjects
│   ├── app entry point
│   └── routing configuration
├── styles/                       # Global styles, glassmorphism, animations
└── index.html                    # Fonts & icon set CDN links
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add more questions (for any subject), fix bugs, or improve the UI:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/add-questions`
3. Commit your changes: `git commit -m "feat: add more questions"`
4. Push to the branch: `git push origin feat/add-questions`
5. Open a Pull Request

### Adding Questions

All questions live in `src/app/data/questions.ts` (or equivalent). Simply add new strings to the relevant category's `questions` array — the dashboard doesn't need any code changes to support a new subject, only new data.

### Adapting to a New Subject

To repurpose this dashboard for a different technology or topic:
1. Replace the category list with your own topic breakdown
2. Populate each category's question array
3. Update the "docs search" link to point at the relevant documentation domain
4. (Optional) Update branding, colors, and the emoji in the title

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

---

Built with ❤️ for developers preparing for their next interview — in any language or framework.

[🌐 Live Demo](https://prathapmohan27.github.io/prephub/) • [🐛 Report Bug](https://github.com/prathapmohan27/prephub/issues) • [💡 Request Feature](https://github.com/prathapmohan27/prephub/issues)