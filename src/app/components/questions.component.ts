import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { HeaderComponent } from './header.component';
import { StatsComponent } from './stats.component';
import { CategoryComponent } from './category.component';
import { QuestionService, Category } from '../services/question.service';

type AppMode = 'angular' | 'nodejs';

@Component({
  selector: 'app-questions',
  imports: [HeaderComponent, StatsComponent, CategoryComponent],
  template: `
    <div class="page-shell">
      <div class="radial-glow radial-glow-overlay"></div>

      <div class="page-wrapper">
        <!-- Top header strip -->
        <div class="header-strip">
          <!-- Logo + title -->
          <div class="flex-row-center logo-gap">
            <div
              class="logo-box"
              [class.logo-box--angular]="mode() === 'angular'"
              [class.logo-box--node]="mode() === 'nodejs'"
            >
              <i [class]="mode() === 'angular' ? 'ti ti-brand-angular' : 'ti ti-brand-nodejs'"></i>
            </div>
            <div>
              <h1 class="title-main">PrepHub</h1>
              <span class="subtitle-main">
                {{
                  mode() === 'angular'
                    ? 'Angular Interview Companion'
                    : 'Node.js Interview Companion'
                }}
              </span>
            </div>
          </div>

          <!-- Mode Switcher Pill -->
          <div class="mode-pill">
            <button
              (click)="switchMode('angular')"
              class="btn-mode-tab"
              [class.btn-mode-tab--active-angular]="mode() === 'angular'"
              [class.btn-mode-tab--inactive]="mode() !== 'angular'"
            >
              <i class="ti ti-brand-angular text-[16px]"></i> Angular
            </button>
            <div class="divider-vt"></div>
            <button
              (click)="switchMode('nodejs')"
              class="btn-mode-tab"
              [class.btn-mode-tab--active-node]="mode() === 'nodejs'"
              [class.btn-mode-tab--inactive]="mode() !== 'nodejs'"
            >
              <i class="ti ti-brand-nodejs text-[16px]"></i> Node.js
            </button>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="grid-sidebar-main">
          <!-- LEFT SIDEBAR -->
          <aside class="sidebar">
            <div class="glass-panel sidebar-panel">
              <p class="section-label sidebar-label">
                {{ mode() === 'angular' ? 'Angular Topics' : 'Node.js Topics' }}
              </p>

              <!-- All Topics -->
              <button
                (click)="selectCategory(null)"
                class="btn-tab"
                [class.btn-tab--active]="selectedCategory() === null"
              >
                <span class="flex-row-center gap-2">
                  <span class="icon-box icon-box-default">
                    <i class="ti ti-apps"></i>
                  </span>
                  All Topics
                </span>
                <span class="cat-badge">{{ totalDatabaseQuestions() }}</span>
              </button>

              <div class="divider-hz"></div>

              <!-- Category list -->
              <div class="sidebar-list">
                @for (cat of modeCategories(); track cat.id) {
                  <button
                    (click)="selectCategory(cat)"
                    class="btn-tab"
                    [class.btn-tab--active]="selectedCategory()?.id === cat.id"
                  >
                    <span class="flex-row-center overflow-hidden-nowrap gap-2 flex-1 min-w-0">
                      <span
                        class="icon-box"
                        [style.color]="cat.color"
                        [style.background]="cat.color + '18'"
                      >
                        <i [class]="'ti ' + cat.icon"></i>
                      </span>
                      <span class="text-ellipsis">{{ cat.title }}</span>
                    </span>
                    <span class="cat-badge shrink-0">{{ cat.questions.length }}</span>
                  </button>
                }
              </div>
            </div>
          </aside>

          <!-- RIGHT MAIN PANEL -->
          <main class="main-content">
            <app-header
              [isExpanded]="allOpen()"
              [activeFilter]="activeFilter()"
              (searchChange)="onSearch($event)"
              (expandAll)="toggleExpandAll()"
              (filterChange)="onFilterChange($event)"
              (randomChallenge)="triggerSpotlight()"
            />

            <app-stats
              [totalQuestions]="totalDatabaseQuestions()"
              [preparedQuestions]="preparedSet().size"
              [starredQuestions]="starredSet().size"
              [totalCategories]="modeCategories().length"
            />

            <!-- Spotlight card -->
            @if (spotlightQuestion()) {
              <div class="glass-panel animate-fade-in spotlight-card">
                <div class="flex-between">
                  <span class="spotlight-label">
                    <i class="ti ti-dice-5 text-[14px]"></i>
                    Mock Interview Challenge
                  </span>
                  <button (click)="clearSpotlight()" class="btn-icon-small">
                    <i class="ti ti-x"></i>
                  </button>
                </div>

                <div class="spotlight-q-box">
                  <p class="spotlight-q-text">"{{ spotlightQuestion() }}"</p>
                  <span
                    class="spotlight-cat-tag"
                    [style.color]="spotlightCategory()?.color"
                    [style.background]="spotlightCategory()?.color + '18'"
                    >{{ spotlightCategory()?.title }}</span
                  >
                </div>

                <div class="flex-wrap-gap">
                  <button (click)="togglePreparedSpotlight()" class="btn-mastered">
                    <i
                      class="ti"
                      [class.ti-circle-check-filled]="isSpotlightPrepared()"
                      [class.ti-circle]="!isSpotlightPrepared()"
                    ></i>
                    {{ isSpotlightPrepared() ? 'Mastered ✓' : 'Mark as Mastered' }}
                  </button>
                  <button (click)="triggerSpotlight()" class="btn-ghost">
                    <i class="ti ti-refresh-dot"></i> Try Another
                  </button>
                  <a
                    [href]="studyDocsUrl(spotlightQuestion() || '')"
                    target="_blank"
                    class="btn-ghost action-link"
                  >
                    <i class="ti ti-external-link"></i>
                    {{ mode() === 'angular' ? 'Angular Docs' : 'Node.js Docs' }}
                  </a>
                </div>
              </div>
            }

            <!-- Category list -->
            <div class="categories-list">
              @if (visibleCategories().length === 0) {
                <div class="glass-panel empty-state-panel">
                  <div class="empty-state-icon">
                    <i class="ti ti-search-off"></i>
                  </div>
                  <p class="empty-headline">No questions match your current filters</p>
                  <p class="empty-sub">Try resetting the search or switching category tabs.</p>
                </div>
              } @else {
                @for (cat of visibleCategories(); track cat.id) {
                  <app-category
                    [category]="cat"
                    [searchFilter]="searchFilter()"
                    [forceOpen]="allOpen()"
                    [preparedSet]="preparedSet()"
                    [starredSet]="starredSet()"
                    [notesMap]="notesMap()"
                    [mode]="mode()"
                    (togglePrepared)="togglePrepared($event)"
                    (toggleStarred)="toggleStarred($event)"
                    (notesChange)="onNotesChange($event)"
                  />
                }
              }
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .page-shell {
      min-height: 100vh;
      background: var(--color-page-bg);
      color: var(--color-text-primary);
      position: relative;
    }

    .radial-glow-overlay {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    .page-wrapper {
      position: relative;
      z-index: 1;
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* ---- Header Strip ---- */
    .header-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .logo-gap {
      gap: 14px;
    }

    .logo-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 22px;
      flex-shrink: 0;
      box-shadow: var(--shadow-logo);
      transition: background 0.3s;
    }
    .logo-box--angular {
      background: linear-gradient(135deg, var(--color-angular), var(--color-angular-dark));
    }
    .logo-box--node {
      background: linear-gradient(135deg, var(--color-node), var(--color-node-dark));
    }

    .title-main {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(90deg, #fff, #a1a1aa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-transform: uppercase;
      line-height: 1.2;
    }

    /* ---- Mode Switcher Pill ---- */
    .mode-pill {
      display: flex;
      align-items: center;
      background: rgba(24, 24, 27, 0.8);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-xl);
      padding: 4px;
      gap: 3px;
      backdrop-filter: blur(8px);
    }

    .btn-mode-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      font-family: var(--font-display);
      transition: all 0.2s ease;
    }
    .btn-mode-tab--active-angular {
      background: linear-gradient(135deg, var(--color-angular-glow), rgba(225, 29, 72, 0.1));
      color: var(--color-angular-text);
      box-shadow: 0 0 0 1px var(--color-angular-ring);
    }
    .btn-mode-tab--active-node {
      background: linear-gradient(135deg, var(--color-node-glow), rgba(21, 128, 61, 0.1));
      color: var(--color-node-text);
      box-shadow: 0 0 0 1px var(--color-node-ring);
    }
    .btn-mode-tab--inactive {
      background: transparent;
      color: var(--color-text-subtle);
    }

    .divider-vt {
      width: 1px;
      height: 20px;
      background: var(--color-border-strong);
    }

    /* ---- Two-column Layout ---- */
    .grid-sidebar-main {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    /* ---- Sidebar ---- */
    .sidebar {
      width: 264px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 24px;
    }

    .sidebar-panel {
      border-radius: var(--radius-2xl);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sidebar-label {
      padding: 0 8px;
      margin-bottom: 6px;
    }

    .divider-hz {
      height: 1px;
      background: rgba(63, 63, 70, 0.35);
      margin: 6px 0;
    }

    .sidebar-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: calc(100vh - 260px);
      overflow-y: auto;
      padding-right: 2px;
    }

    .btn-tab {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 10px;
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition:
        background 0.15s,
        color 0.15s;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      background: transparent;
    }
    .btn-tab--active {
      background: rgba(63, 63, 70, 0.6);
      color: var(--color-text-primary);
    }

    .icon-box {
      width: 22px;
      height: 22px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .icon-box-default {
      background: rgba(63, 63, 70, 0.5);
      color: var(--color-text-muted);
    }

    /* ---- Main Content ---- */
    .main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ---- Spotlight Card ---- */
    .spotlight-card {
      border-radius: var(--radius-2xl);
      padding: 24px;
      border-color: rgba(244, 63, 94, 0.2);
      background: rgba(120, 10, 30, 0.06);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .spotlight-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-danger-text);
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      display: flex;
      align-items: center;
    }

    .spotlight-q-box {
      padding: 16px;
      border-radius: var(--radius-lg);
      background: rgba(9, 9, 11, 0.7);
      border: 1px solid var(--color-border);
    }

    .spotlight-q-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.6;
      font-family: var(--font-display);
    }

    .spotlight-cat-tag {
      display: inline-block;
      margin-top: 10px;
      padding: 2px 10px;
      border-radius: var(--radius-sm);
      font-size: var(--text-xs, 0.65rem);
      font-family: var(--font-mono);
    }

    .btn-mastered {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--color-success-bg);
      color: var(--color-success-light);
      border: 1px solid var(--color-success-border);
      cursor: pointer;
      transition: background 0.15s;
    }

    /* ---- Category list gap ---- */
    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ---- Empty State ---- */
    .empty-state-panel {
      border-radius: var(--radius-2xl);
      padding: 48px 24px;
      text-align: center;
    }
    .empty-state-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(39, 39, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-size: 20px;
      color: var(--color-text-faint);
    }
    .empty-headline {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .empty-sub {
      font-size: 0.75rem;
      color: var(--color-text-subtle);
      margin-top: 4px;
    }
  `,
})
export class QuestionsComponent implements OnInit {
  categories = signal<Category[]>([]);
  searchFilter = signal<string>('');
  allOpen = signal<boolean>(false);

  preparedSet = signal<Set<string>>(new Set());
  starredSet = signal<Set<string>>(new Set());
  notesMap = signal<Record<string, string>>({});

  activeFilter = signal<string>('all');
  selectedCategory = signal<Category | null>(null);
  mode = signal<AppMode>('angular');

  spotlightQuestion = signal<string | null>(null);
  spotlightCategory = signal<Category | null>(null);

  private questionService: QuestionService = inject(QuestionService);

  modeCategories = computed(() => {
    const m = this.mode();
    return this.categories().filter((cat) =>
      m === 'nodejs' ? cat.id.startsWith('nodejs-') : !cat.id.startsWith('nodejs-'),
    );
  });

  totalDatabaseQuestions = computed(() =>
    this.modeCategories().reduce((acc, cat) => acc + cat.questions.length, 0),
  );

  visibleCategories = computed(() => {
    const filter = this.searchFilter().toLowerCase();
    const activeF = this.activeFilter();
    const selectedCat = this.selectedCategory();
    const targetCats = selectedCat ? [selectedCat] : this.modeCategories();

    return targetCats
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter((q) => {
          if (filter && !q.toLowerCase().includes(filter)) return false;
          if (activeF === 'prepared') return this.preparedSet().has(q);
          if (activeF === 'starred') return this.starredSet().has(q);
          if (activeF === 'unprepared') return !this.preparedSet().has(q);
          return true;
        }),
      }))
      .filter((cat) => cat.questions.length > 0);
  });

  isSpotlightPrepared = computed(() => {
    const q = this.spotlightQuestion();
    return q ? this.preparedSet().has(q) : false;
  });

  ngOnInit() {
    this.categories.set(this.questionService.getCategories());
    this.loadState();
    const savedMode = localStorage.getItem('prep_mode') as AppMode | null;
    if (savedMode === 'angular' || savedMode === 'nodejs') {
      this.mode.set(savedMode);
    }
  }

  switchMode(m: AppMode) {
    this.mode.set(m);
    this.selectedCategory.set(null);
    this.searchFilter.set('');
    this.clearSpotlight();
    localStorage.setItem('prep_mode', m);
  }

  onSearch(filter: string) {
    this.searchFilter.set(filter);
  }
  toggleExpandAll() {
    this.allOpen.update((v) => !v);
  }
  onFilterChange(filter: string) {
    this.activeFilter.set(filter);
  }
  selectCategory(cat: Category | null) {
    this.selectedCategory.set(cat);
  }

  private loadState() {
    try {
      const prepared = JSON.parse(localStorage.getItem('prep_prepared') || '[]');
      const starred = JSON.parse(localStorage.getItem('prep_starred') || '[]');
      const notes = JSON.parse(localStorage.getItem('prep_notes') || '{}');
      this.preparedSet.set(new Set<string>(prepared));
      this.starredSet.set(new Set<string>(starred));
      this.notesMap.set(notes);
    } catch (e) {
      console.error('Failed to load storage state', e);
    }
  }

  togglePrepared(q: string) {
    const updated = new Set(this.preparedSet());
    updated.has(q) ? updated.delete(q) : updated.add(q);
    this.preparedSet.set(updated);
    localStorage.setItem('prep_prepared', JSON.stringify(Array.from(updated)));
  }

  toggleStarred(q: string) {
    const updated = new Set(this.starredSet());
    updated.has(q) ? updated.delete(q) : updated.add(q);
    this.starredSet.set(updated);
    localStorage.setItem('prep_starred', JSON.stringify(Array.from(updated)));
  }

  onNotesChange(event: { question: string; notes: string }) {
    const updated = { ...this.notesMap(), [event.question]: event.notes };
    this.notesMap.set(updated);
    localStorage.setItem('prep_notes', JSON.stringify(updated));
  }

  triggerSpotlight() {
    const pool = this.visibleCategories().reduce<Array<{ q: string; cat: Category }>>(
      (acc, cat) => {
        const origCat = this.modeCategories().find((c) => c.id === cat.id);
        if (origCat) cat.questions.forEach((q) => acc.push({ q, cat: origCat }));
        return acc;
      },
      [],
    );
    if (!pool.length) {
      this.clearSpotlight();
      return;
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    this.spotlightQuestion.set(item.q);
    this.spotlightCategory.set(item.cat);
  }

  clearSpotlight() {
    this.spotlightQuestion.set(null);
    this.spotlightCategory.set(null);
  }

  togglePreparedSpotlight() {
    const q = this.spotlightQuestion();
    if (q) this.togglePrepared(q);
  }

  studyDocsUrl(question: string): string {
    const q = encodeURIComponent(question);
    return this.mode() === 'nodejs'
      ? `https://www.google.com/search?q=site%3Anodejs.org+${q}`
      : `https://www.google.com/search?q=site%3Aangular.dev+${q}`;
  }

  /** Close icon button for spotlight */
  get btn_icon_small_classes() {
    return 'btn-icon-small';
  }
}
