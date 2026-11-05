import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Header } from '@components/header';
import { MockInterview, MockItem } from '../mock-interview/mock-interview';
import { QGroup, QItem, QuestionList, questionKey } from '../question-list/question-list';
import { QuestionReader } from '../question-reader/question-reader';
import {
  Question,
  CategoryModel,
  RENAMED_QUESTIONS,
  TRACKS,
  Track,
  isTrack,
  trackOf,
} from '@services/question';
import { AnswerService } from '@services/answer.service';

type AppMode = Track;

/** Last question opened in a mode, saved to resume the next visit. */
interface LastViewed {
  topic: string | null;
  key: string;
}

const lastViewedKey = (mode: AppMode) => `prep_last_${mode}`;

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // Layout preference only; ignore blocked storage
  }
}

/** Below this width the list and reader share one pane (see questions.css). */
const SINGLE_PANE_QUERY = '(max-width: 760px)';

@Component({
  selector: 'app-questions',
  imports: [Header, QuestionList, QuestionReader, MockInterview],
  host: {
    '(document:keydown)': 'onKeydown($event)',
    '(window:popstate)': 'onPopState()',
  },
  template: `
    <div class="page-shell">
      <div class="radial-glow radial-glow-overlay"></div>

      <div class="page-wrapper">
        <!-- Two-column layout -->
        <div class="grid-sidebar-main">
          <!-- LEFT SIDEBAR -->
          <aside class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed()">
            <div class="glass-panel sidebar-panel">
              <div class="sidebar-head">
                <div class="mode-pill" role="group" aria-label="Interview track">
                  @for (t of tracks; track t.id) {
                    <button
                      type="button"
                      (click)="switchMode(t.id)"
                      class="btn-mode-tab"
                      [class]="'btn-mode-tab btn-mode-tab--' + t.id"
                      [class.btn-mode-tab--active]="mode() === t.id"
                      [attr.aria-pressed]="mode() === t.id"
                      [title]="
                        t.id === 'foundations'
                          ? 'Foundations: JavaScript, TypeScript & the web'
                          : t.label
                      "
                    >
                      <i [class]="'ti ' + t.icon"></i><span class="mode-label">{{ t.short }}</span>
                    </button>
                  }
                </div>
                <button
                  type="button"
                  class="sidebar-toggle"
                  (click)="toggleSidebar()"
                  [attr.aria-expanded]="!sidebarCollapsed()"
                  [title]="
                    sidebarCollapsed() ? 'Show topic names' : 'Collapse topics (F for focus mode)'
                  "
                  [attr.aria-label]="sidebarCollapsed() ? 'Expand topics' : 'Collapse topics'"
                >
                  <i
                    class="ti"
                    [class.ti-layout-sidebar-left-collapse]="!sidebarCollapsed()"
                    [class.ti-layout-sidebar-left-expand]="sidebarCollapsed()"
                  ></i>
                </button>
              </div>

              <!-- All Topics -->
              <button
                (click)="selectCategory(null)"
                class="btn-tab"
                [class.btn-tab--active]="selectedCategory() === null"
                title="All Topics"
              >
                <span class="flex-row-center gap-2">
                  <span class="icon-box icon-box-default">
                    <i class="ti ti-apps"></i>
                  </span>
                  <span class="tab-text">All Topics</span>
                </span>
                <span
                  class="cat-badge"
                  [title]="masteredInMode() + ' of ' + totalDatabaseQuestions() + ' mastered'"
                  >{{ masteredInMode() }}/{{ totalDatabaseQuestions() }}</span
                >
              </button>
              <div
                class="overall-progress"
                role="progressbar"
                aria-label="Mastered"
                [attr.aria-valuenow]="masteredInMode()"
                aria-valuemin="0"
                [attr.aria-valuemax]="totalDatabaseQuestions()"
              >
                <div class="overall-progress-fill" [style.width.%]="masteredPercent()"></div>
              </div>

              <div class="divider-hz"></div>

              <!-- Category list -->
              <div class="sidebar-list">
                @for (cat of modeCategories(); track cat.id) {
                  <button
                    (click)="selectCategory(cat)"
                    class="btn-tab"
                    [class.btn-tab--active]="selectedCategory()?.id === cat.id"
                    [title]="cat.title"
                  >
                    <span class="flex-row-center overflow-hidden-nowrap gap-2 flex-1 min-w-0">
                      <span
                        class="icon-box"
                        [style.color]="cat.color"
                        [style.background]="cat.color + '18'"
                      >
                        <i [class]="'ti ' + cat.icon"></i>
                      </span>
                      <span class="text-ellipsis tab-text">{{ cat.title }}</span>
                    </span>
                    <span
                      class="cat-badge shrink-0"
                      [class.cat-badge--done]="categoryDone(cat) === cat.questions.length"
                      [title]="categoryDone(cat) + ' of ' + cat.questions.length + ' mastered'"
                      >{{ categoryDone(cat) }}/{{ cat.questions.length }}</span
                    >
                  </button>
                }
              </div>
            </div>
          </aside>

          <!-- RIGHT MAIN PANEL -->
          <main class="main-content">
            <app-header
              [activeFilter]="activeFilter()"
              [counts]="filterCounts()"
              (searchChange)="onSearch($event)"
              (filterChange)="onFilterChange($event)"
              (randomChallenge)="mockOpen.set(true)"
            />

            <!-- Mock Me -->
            @if (mockOpen()) {
              <app-mock-interview
                [pool]="mockPool()"
                [prepared]="preparedSet()"
                [starred]="starredSet()"
                [mode]="mode()"
                [scopeLabel]="mockScopeLabel()"
                (preparedChange)="setPrepared($event.q, $event.prepared)"
                (starQuestions)="starAll($event)"
                (closed)="mockOpen.set(false)"
              />
            }

            <!-- Question list + answer reader -->
            @if (active(); as item) {
              <!-- Phones only: the list hides the reader, so offer a way back in -->
              @if (resumed() && !readerOpen()) {
                <button
                  type="button"
                  class="resume-chip"
                  [class.resume-chip--node]="mode() === 'nodejs'"
                  (click)="select(item)"
                >
                  <i class="ti ti-player-play"></i>
                  <span class="resume-text">
                    <span class="resume-label">Continue where you left off</span>
                    <span class="resume-q">{{ item.q }}</span>
                  </span>
                  <i class="ti ti-chevron-right"></i>
                </button>
              }
              <div class="split" [class.split--reading]="readerOpen()">
                <app-question-list
                  class="split-list"
                  [groups]="groups()"
                  [activeKey]="item.key"
                  [searchFilter]="searchFilter()"
                  [preparedSet]="preparedSet()"
                  [starredSet]="starredSet()"
                  (selected)="select($event)"
                  (togglePrepared)="togglePrepared($event)"
                />
                <app-question-reader
                  class="split-reader"
                  [item]="item"
                  [position]="activeIndex() + 1"
                  [total]="items().length"
                  [prepared]="preparedSet().has(item.q)"
                  [starred]="starredSet().has(item.q)"
                  [mode]="mode()"
                  (prev)="go(-1)"
                  (next)="go(1)"
                  (back)="closeReader()"
                  (togglePrepared)="toggleActivePrepared()"
                  (toggleStarred)="toggleActiveStarred()"
                  (showShortcuts)="openShortcuts()"
                />
              </div>
            } @else {
              <div class="glass-panel empty-state-panel">
                <div class="empty-state-icon">
                  <i class="ti ti-search-off"></i>
                </div>
                <p class="empty-headline">No questions match your current filters</p>
                <p class="empty-sub">Try resetting the search or switching category tabs.</p>
              </div>
            }
          </main>
        </div>
      </div>

      @if (shortcutsOpen()) {
        <div class="kbd-overlay">
          <button
            type="button"
            class="kbd-backdrop"
            tabindex="-1"
            aria-label="Close shortcuts"
            (click)="shortcutsOpen.set(false)"
          ></button>
          <div
            class="glass-panel kbd-dialog animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kbd-title"
          >
            <div class="flex-between">
              <h2 id="kbd-title" class="kbd-title">Keyboard shortcuts</h2>
              <button
                type="button"
                class="btn-icon-small kbd-close"
                (click)="shortcutsOpen.set(false)"
                aria-label="Close"
              >
                <i class="ti ti-x"></i>
              </button>
            </div>
            <dl class="kbd-list">
              @for (s of shortcuts; track s.label) {
                <div class="kbd-row">
                  <dt>
                    @for (k of s.keys; track k) {
                      <kbd>{{ k }}</kbd>
                    }
                  </dt>
                  <dd>{{ s.label }}</dd>
                </div>
              }
            </dl>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  categories = signal<CategoryModel[]>([]);
  searchFilter = signal<string>('');

  preparedSet = signal<Set<string>>(new Set());
  starredSet = signal<Set<string>>(new Set());

  activeFilter = signal<string>('all');
  selectedCategory = signal<CategoryModel | null>(null);
  mode = signal<AppMode>('angular');
  readonly tracks = TRACKS;

  mockOpen = signal(false);
  private mockCard = viewChild(MockInterview);

  /** Question the user explicitly picked; null means "first in the list". */
  selectedKey = signal<string | null>(null);
  /** Last selected position, used when the selected question drops out of the filtered list. */
  private anchorIndex = signal(0);
  /** Single-pane (mobile) layout: show the reader instead of the list. */
  readerOpen = signal(false);
  private urlReady = signal(false);
  private urlSync = signal(0);
  /** The selection was restored from the last visit and not yet opened. */
  resumed = signal(false);
  shortcutsOpen = signal(false);
  /** Layout density, remembered across visits: topics as an icon rail, stats as one line. */
  sidebarCollapsed = signal(readFlag('prep_sidebar_collapsed', false));

  /** True while a history entry we pushed for the mobile reader is on top of the stack. */
  private readerHistoryEntry = false;
  /** Page scroll of the list when the mobile reader opened, restored on close. */
  private listScrollY = 0;
  /** Waiting for the router to finish its own handling of a Back that closed the reader. */
  private pendingPop = false;

  readonly shortcuts = [
    { keys: ['J', '→'], label: 'Next question' },
    { keys: ['K', '←'], label: 'Previous question' },
    { keys: ['M'], label: 'Mark as mastered / unprepared' },
    { keys: ['S'], label: 'Star / unstar' },
    { keys: ['/'], label: 'Search questions' },
    { keys: ['F'], label: 'Focus mode (collapse topics)' },
    { keys: ['Esc'], label: 'Close / back to list' },
    { keys: ['?'], label: 'Show this help' },
    { keys: ['Enter'], label: 'Mock Me: start session' },
    { keys: ['Space'], label: 'Mock Me: reveal / hide answer' },
    { keys: ['1', '2', '3'], label: 'Mock Me: rate Nailed it / Shaky / Blanked' },
    { keys: ['N'], label: 'Mock Me: skip question' },
    { keys: ['T'], label: 'Mock Me: timer on / off' },
    { keys: ['R'], label: 'Mock Me: retry missed (on results)' },
    { keys: ['Esc'], label: 'Mock Me: end session / close' },
  ];

  private questionService: Question = inject(Question);
  private answerService = inject(AnswerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private injector = inject(Injector);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // Keep ?topic=&q= in the URL so a question can be shared or survive a refresh
    effect(() => {
      const topic = this.selectedCategory()?.id;
      const q = this.selectedKey() ? this.active()?.q : undefined;
      this.urlSync(); // re-run after Back pops to an entry holding an older URL
      if (!this.urlReady()) return;
      const tree = this.router.createUrlTree(['/questions'], { queryParams: { topic, q } });
      // Keep the router's history state (navigationId) so its scroll restoration still works
      this.location.replaceState(this.router.serializeUrl(tree), '', this.location.getState());
    });

    // The router scrolls after its own popstate handling; restore our position after it
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof Scroll && this.pendingPop) {
        this.pendingPop = false;
        setTimeout(() => this.finishPop());
      }
    });

    effect(() => writeFlag('prep_sidebar_collapsed', this.sidebarCollapsed()));

    // Remember the last opened question per mode, to resume on the next visit
    effect(() => {
      const key = this.selectedKey();
      if (!key || this.active()?.key !== key) return;
      const saved: LastViewed = { topic: this.selectedCategory()?.id ?? null, key };
      try {
        localStorage.setItem(lastViewedKey(this.mode()), JSON.stringify(saved));
      } catch {
        // Storage can be full or blocked; resuming is only a convenience
      }
    });

    // Start loading the neighbours' answers so prev/next feels instant
    effect(() => {
      const list = this.items();
      const i = this.activeIndex();
      for (const n of [list[i + 1], list[i - 1]]) {
        if (n) this.answerService.prefetch(n.cat.id);
      }
    });
  }

  modeCategories = computed(() => {
    const m = this.mode();
    return this.categories().filter((cat) => trackOf(cat.id) === m);
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

  /** Visible questions grouped by topic, pointing at the original (unfiltered) category. */
  groups = computed<QGroup[]>(() => {
    const byId = new Map(this.modeCategories().map((c) => [c.id, c]));
    return this.visibleCategories().map((vc) => {
      const cat = byId.get(vc.id) ?? vc;
      return {
        cat,
        items: vc.questions.map((q) => ({
          key: questionKey(cat.id, q),
          q,
          cat,
          num: cat.questions.indexOf(q) + 1,
        })),
      };
    });
  });

  items = computed<QItem[]>(() => this.groups().flatMap((g) => g.items));

  activeIndex = computed(() => {
    const list = this.items();
    if (!list.length) return -1;
    const key = this.selectedKey();
    const i = key ? list.findIndex((it) => it.key === key) : -1;
    return i >= 0 ? i : Math.min(this.anchorIndex(), list.length - 1);
  });

  active = computed<QItem | null>(() => this.items()[this.activeIndex()] ?? null);

  /** Mastered / starred counts for the current track (the sets hold both tracks). */
  masteredInMode = computed(() => {
    const prepared = this.preparedSet();
    return this.modeCategories().reduce(
      (n, c) => n + c.questions.filter((q) => prepared.has(q)).length,
      0,
    );
  });

  masteredPercent = computed(() => {
    const total = this.totalDatabaseQuestions();
    return total ? Math.round((this.masteredInMode() / total) * 100) : 0;
  });

  filterCounts = computed(() => {
    const starred = this.starredSet();
    const all = this.totalDatabaseQuestions();
    const prepared = this.masteredInMode();
    return {
      all,
      prepared,
      starred: this.modeCategories().reduce(
        (n, c) => n + c.questions.filter((q) => starred.has(q)).length,
        0,
      ),
      unprepared: all - prepared,
    };
  });

  categoryDone(cat: CategoryModel): number {
    const prepared = this.preparedSet();
    return cat.questions.filter((q) => prepared.has(q)).length;
  }

  /** Visible questions for Mock Me, paired with their original (unfiltered) category. */
  mockPool = computed<MockItem[]>(() => {
    const byId = new Map(this.modeCategories().map((c) => [c.id, c]));
    return this.visibleCategories().flatMap((vc) => {
      const cat = byId.get(vc.id);
      return cat ? vc.questions.map((q) => ({ q, cat })) : [];
    });
  });

  mockScopeLabel = computed(() => {
    const parts = [this.selectedCategory()?.title ?? 'all topics'];
    const filter = this.activeFilter();
    if (filter !== 'all') parts.push(filter[0].toUpperCase() + filter.slice(1));
    const search = this.searchFilter().trim();
    if (search) parts.push(`"${search}"`);
    return parts.join(' · ');
  });

  ngOnInit() {
    const all = this.questionService.getCategories();
    this.categories.set(all);
    this.loadState();

    const params = this.route.snapshot.queryParamMap;
    const topic = all.find((c) => c.id === params.get('topic'));
    const rawQ = params.get('q');
    const q = rawQ ? (RENAMED_QUESTIONS[rawQ] ?? rawQ) : null;
    const qCat = q
      ? topic?.questions.includes(q)
        ? topic
        : all.find((c) => c.questions.includes(q))
      : undefined;

    const linked = topic ?? qCat;
    const savedMode = localStorage.getItem('prep_mode');
    if (linked) {
      this.mode.set(trackOf(linked.id));
    } else if (isTrack(savedMode)) {
      this.mode.set(savedMode);
    }
    if (topic) this.selectedCategory.set(topic);
    if (q && qCat) {
      this.selectedKey.set(questionKey(qCat.id, q));
      this.readerOpen.set(true);
    } else if (!topic) {
      this.restoreLastViewed();
    }
    this.urlReady.set(true);
    afterNextRender(() => this.revealActive(false), { injector: this.injector });
  }

  /** Re-selects the question the user last opened in the current mode. */
  private restoreLastViewed() {
    let saved: LastViewed | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(lastViewedKey(this.mode())) || 'null');
    } catch {
      return;
    }
    if (!saved?.key) return;
    const sep = saved.key.indexOf('::');
    const cat = this.modeCategories().find((c) => c.id === saved.key.slice(0, sep));
    const rawQ = saved.key.slice(sep + 2);
    const q = RENAMED_QUESTIONS[rawQ] ?? rawQ;
    if (!cat || !cat.questions.includes(q)) return;

    const topic = saved.topic ? this.modeCategories().find((c) => c.id === saved.topic) : null;
    this.selectedCategory.set(topic ?? null);
    this.selectedKey.set(questionKey(cat.id, q));
    this.resumed.set(true);
  }

  switchMode(m: AppMode) {
    this.mode.set(m);
    this.selectedCategory.set(null);
    this.searchFilter.set('');
    this.resetSelection();
    this.mockOpen.set(false);
    localStorage.setItem('prep_mode', m);
    this.restoreLastViewed();
    afterNextRender(() => this.revealActive(false), { injector: this.injector });
  }

  onSearch(filter: string) {
    this.searchFilter.set(filter);
    this.anchorIndex.set(0);
  }
  onFilterChange(filter: string) {
    this.activeFilter.set(filter);
    this.anchorIndex.set(0);
  }
  selectCategory(cat: CategoryModel | null) {
    this.selectedCategory.set(cat);
    this.resetSelection();
  }

  private resetSelection() {
    this.selectedKey.set(null);
    this.anchorIndex.set(0);
    this.resumed.set(false);
    this.closeReader();
  }

  select(item: QItem) {
    this.selectedKey.set(item.key);
    this.anchorIndex.set(this.items().indexOf(item));
    this.resumed.set(false);
    this.openReader();
    afterNextRender(() => this.revealActive(), { injector: this.injector });
  }

  /**
   * On phones the reader replaces the list, so it gets its own history entry:
   * the browser/phone Back button then returns to the list instead of leaving the page.
   */
  private openReader() {
    if (!this.readerOpen() && window.matchMedia(SINGLE_PANE_QUERY).matches) {
      this.listScrollY = window.scrollY;
      history.pushState(history.state, '', location.href);
      this.readerHistoryEntry = true;
    }
    this.readerOpen.set(true);
  }

  closeReader() {
    if (this.readerHistoryEntry) {
      history.back(); // onPopState finishes closing
      return;
    }
    this.readerOpen.set(false);
  }

  onPopState() {
    if (!this.readerHistoryEntry) return;
    this.readerHistoryEntry = false;
    this.readerOpen.set(false);
    this.pendingPop = true;
    // The router may also handle this Back (resetting scroll and URL); if it doesn't, stop waiting
    setTimeout(() => (this.pendingPop = false), 1000);
    afterNextRender(() => this.finishPop(), { injector: this.injector });
  }

  /** Puts the list back where it was and re-syncs the URL to the current question. */
  private finishPop() {
    window.scrollTo({ top: this.listScrollY });
    this.urlSync.update((n) => n + 1);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  /** Focus mode: collapse topics and stats together, or bring both back. */
  toggleFocus() {
    this.sidebarCollapsed.update((v) => !v);
  }

  openShortcuts() {
    this.shortcutsOpen.set(true);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.kbd-close')?.focus(),
      { injector: this.injector },
    );
  }

  /** Moves to the previous (-1) or next (+1) question in the visible list. */
  go(delta: number) {
    const list = this.items();
    const i = this.activeIndex();
    const target = list[i + delta];
    if (i < 0 || !target) return;
    this.select(target);
  }

  toggleActivePrepared() {
    const item = this.active();
    if (!item) return;
    // If the filter hides it now (e.g. "Unprepared"), the next question takes its place
    this.anchorIndex.set(this.activeIndex());
    this.togglePrepared(item.q);
  }

  toggleActiveStarred() {
    const item = this.active();
    if (!item) return;
    this.anchorIndex.set(this.activeIndex());
    this.toggleStarred(item.q);
  }

  /** Keyboard shortcuts — the full list is in `shortcuts` and the "?" dialog. */
  onKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;

    if (this.shortcutsOpen()) {
      if (e.key === 'Escape' || e.key === '?') {
        this.shortcutsOpen.set(false);
        e.preventDefault();
      }
      return;
    }
    // Mock Me covers the page: its keys only, nothing reaches the hidden list
    if (this.mockOpen()) {
      if (this.mockCard()?.handleKey(e)) e.preventDefault();
      return;
    }
    if (e.key === '?') {
      this.openShortcuts();
      e.preventDefault();
      return;
    }
    if (e.key === '/') {
      const search = this.host.nativeElement.querySelector<HTMLInputElement>('.search-input');
      search?.focus();
      search?.select();
      e.preventDefault();
      return;
    }
    if (e.key === 'f') {
      this.toggleFocus();
      e.preventDefault();
      return;
    }
    if (!this.active()) return;

    switch (e.key) {
      case 'j':
      case 'ArrowRight':
        this.go(1);
        break;
      case 'k':
      case 'ArrowLeft':
        this.go(-1);
        break;
      case 'm':
        this.toggleActivePrepared();
        break;
      case 's':
        this.toggleActiveStarred();
        break;
      case 'Escape':
        if (!this.readerOpen()) return;
        this.closeReader();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  /** Keeps the active row visible in the list and brings the reader's top into view. */
  private revealActive(scrollPage = true) {
    const root = this.host.nativeElement;
    const reader = root.querySelector<HTMLElement>('.split-reader');
    if (!reader) return;
    const navOffset =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 16 || 76;

    if (window.matchMedia(SINGLE_PANE_QUERY).matches) {
      if (!scrollPage) return;
      window.scrollTo({ top: window.scrollY + reader.getBoundingClientRect().top - navOffset });
      return;
    }

    const row = root.querySelector<HTMLElement>('.ql-row--active');
    const list = root.querySelector<HTMLElement>('.split-list');
    if (row && list) {
      // Scroll only the list's own scroller, never the page
      const r = row.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      if (r.top < l.top + 44) list.scrollTop -= l.top + 44 - r.top;
      else if (r.bottom > l.bottom) list.scrollTop += r.bottom - l.bottom + 8;
    }

    const top = reader.getBoundingClientRect().top;
    if (scrollPage && top < navOffset) window.scrollTo({ top: window.scrollY + top - navOffset });
  }

  private loadState() {
    try {
      const prepared = JSON.parse(localStorage.getItem('prep_prepared') || '[]');
      const starred = JSON.parse(localStorage.getItem('prep_starred') || '[]');
      this.preparedSet.set(this.migrateRenamed(prepared, 'prep_prepared'));
      this.starredSet.set(this.migrateRenamed(starred, 'prep_starred'));
    } catch (e) {
      console.error('Failed to load storage state', e);
    }
  }

  /** Moves saved progress from corrected question wording to the new wording. */
  private migrateRenamed(saved: string[], storageKey: string): Set<string> {
    const set = new Set<string>(saved.map((q) => RENAMED_QUESTIONS[q] ?? q));
    if (saved.some((q) => q in RENAMED_QUESTIONS)) {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    }
    return set;
  }

  togglePrepared(q: string) {
    const updated = new Set(this.preparedSet());
    if (updated.has(q)) {
      updated.delete(q);
    } else {
      updated.add(q);
    }
    this.preparedSet.set(updated);
    localStorage.setItem('prep_prepared', JSON.stringify(Array.from(updated)));
  }

  toggleStarred(q: string) {
    const updated = new Set(this.starredSet());
    if (updated.has(q)) {
      updated.delete(q);
    } else {
      updated.add(q);
    }
    this.starredSet.set(updated);
    localStorage.setItem('prep_starred', JSON.stringify(Array.from(updated)));
  }

  setPrepared(q: string, prepared: boolean) {
    if (this.preparedSet().has(q) !== prepared) this.togglePrepared(q);
  }

  starAll(questions: string[]) {
    const updated = new Set(this.starredSet());
    questions.forEach((q) => updated.add(q));
    this.starredSet.set(updated);
    localStorage.setItem('prep_starred', JSON.stringify(Array.from(updated)));
  }

  /** Close icon button for spotlight */
  readonly btn_icon_small_classes = 'btn-icon-small';
}
