import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { TuiButton, TuiDropdown, TuiInput, TuiLink } from '@taiga-ui/core';
import {
  TuiBadge,
  TuiChevron,
  TuiDataListWrapper,
  TuiProgress,
  TuiSegmented,
  TuiSelect,
  TuiSwitch,
} from '@taiga-ui/kit';
import { CategoryModel, Level, Track, trackInfo } from '@services/question';
import { Answer } from '../answer/answer';
import { RichText } from '../content-blocks/rich-text';
import { RATINGS, REVIEWS_KEY } from '@services/reviews';

export interface MockItem {
  /** Stable question id: mastered, starred and ratings are keyed by it. */
  id: string;
  /** Question text, for display. */
  q: string;
  cat: CategoryModel;
}

type Rating = 'nailed' | 'shaky' | 'blanked' | 'skipped';
type Phase = 'setup' | 'question' | 'summary';

interface MockResult {
  item: MockItem;
  rating: Rating;
  seconds: number;
}

/** Last self-rating per question, used to bring weak questions back sooner. */
interface Review {
  r: Exclude<Rating, 'skipped'>;
  t: number;
}

/** Topics answered as a longer whiteboard-style discussion get more thinking time. */
const LONG_FORM_TOPICS = new Set([
  'frontend-system-design',
  'coding-round',
  'nodejs-system-design',
  'nodejs-coding-round',
  'fullstack-scenarios',
  'lld-design',
]);
const SECONDS_SHORT = 120;
const SECONDS_LONG = 300;
const SESSION_SIZES = [5, 10, 20];
/** Stored session size meaning "every question in the pool". */
const ALL = 1000;
/** Offer "All" only when the pool is small enough for one sitting. */
const ALL_LIMIT = 30;

/** Which questions a session draws from; matches the page's status filter. */
export type MockFocus = 'all' | 'unprepared' | 'starred';
const SIZE_KEY = 'prep_mock_size';
const TIMER_KEY = 'prep_mock_timer';
const DAY_MS = 24 * 60 * 60 * 1000;

const RATING_LABEL: Record<Rating, string> = {
  nailed: 'Nailed it',
  shaky: 'Shaky',
  blanked: 'Blanked',
  skipped: 'Skipped',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Practice history only; ignore blocked storage
  }
}

/**
 * Weighted shuffle (Efraimidis–Spirakis): every item appears exactly once, but
 * heavier items tend to come earlier in the order.
 */
function weightedShuffle<T>(items: T[], weight: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(Math.random(), 1 / weight(item)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.item);
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Mock Me: a timed mock interview over the questions currently on screen.
 * Runs either a fixed-length session that ends in a summary, or endless free practice.
 */
@Component({
  selector: 'app-mock-interview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Answer,
    FormField,
    RichText,
    TuiBadge,
    TuiButton,
    TuiChevron,
    TuiDataListWrapper,
    TuiDropdown,
    TuiInput,
    TuiLink,
    TuiProgress,
    TuiSegmented,
    TuiSelect,
    TuiSwitch,
  ],
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Mock interview',
    tabindex: '-1',
  },
  template: `
    <div class="mock-stage">
      <div class="glass-panel animate-fade-in spotlight-card">
        <!-- Header -->
        <div class="flex-between">
          <span class="spotlight-label">
            <i class="ti ti-dice-5 text-[14px]"></i>
            Mock Interview
            @if (phase() === 'question') {
              <span class="mock-count">
                @if (isSession()) {
                  Question {{ position() }} of {{ deckSize() }}
                } @else {
                  Free practice · {{ position() }} / {{ deckSize() }}
                }
              </span>
            }
          </span>
          <div class="mock-top-actions">
            @if (phase() === 'question') {
              <button
                tuiButton
                type="button"
                size="xs"
                class="mock-clock"
                [appearance]="timeUp() && !revealed() ? 'warning' : 'outline-grayscale'"
                [iconStart]="timerEnabled() ? '@tui.timer' : '@tui.timer-off'"
                [attr.aria-pressed]="timerEnabled()"
                [attr.aria-label]="timerEnabled() ? null : 'Timer off'"
                [title]="timerEnabled() ? 'Turn timer off (T)' : 'Turn timer on (T)'"
                (click)="toggleTimer()"
              >
                @if (timerEnabled()) {
                  {{ timeUp() ? "Time's up" : clock() }}
                }
              </button>
            }
            <button
              tuiIconButton
              type="button"
              size="xs"
              appearance="secondary-grayscale"
              iconStart="@tui.x"
              [style.border-radius.%]="100"
              (click)="phase() === 'question' ? end() : closed.emit()"
              [title]="
                phase() === 'question' && results().length ? 'End session (Esc)' : 'Close (Esc)'
              "
            >
              Close mock interview
            </button>
          </div>
        </div>

        @switch (phase()) {
          <!-- Setup -->
          @case ('setup') {
            @if (pool().length) {
              <div class="mock-setup">
                @if (scopeEditable()) {
                  <!-- Scope: these change the page's own filters, so the list behind follows -->
                  <div class="mock-field">
                    <label class="mock-field-label" for="mock-topic">Topic</label>
                    <tui-textfield
                      tuiChevron
                      tuiTextfieldSize="s"
                      class="mock-select"
                      [stringify]="topicName"
                      [tuiTextfieldCleaner]="false"
                    >
                      <input id="mock-topic" tuiSelect [formField]="scopeForm.topic" />
                      <tui-data-list-wrapper *tuiDropdown [items]="topicIds()" />
                    </tui-textfield>
                  </div>

                  <div class="mock-field">
                    <span class="mock-field-label">Level</span>
                    <tui-segmented
                      size="s"
                      role="group"
                      aria-label="Question level"
                      [activeItemIndex]="levelIndex()"
                    >
                      @for (l of levelOptions; track l.id) {
                        <button
                          type="button"
                          [attr.aria-pressed]="level() === l.id"
                          (click)="levelChange.emit(l.id)"
                        >
                          {{ l.label }}
                        </button>
                      }
                    </tui-segmented>
                  </div>

                  <div class="mock-field">
                    <span class="mock-field-label">Focus</span>
                    <tui-segmented
                      size="s"
                      role="group"
                      aria-label="Which questions"
                      [activeItemIndex]="focusIndex()"
                    >
                      @for (f of focusOptions; track f.id) {
                        <button
                          type="button"
                          [attr.aria-pressed]="focus() === f.id"
                          [title]="f.hint"
                          (click)="focusChange.emit(f.id)"
                        >
                          {{ f.label }}
                        </button>
                      }
                    </tui-segmented>
                  </div>
                }

                <p class="mock-scope">
                  <strong>{{ pool().length }}</strong>
                  question{{ pool().length === 1 ? '' : 's' }} available
                  @if (search()) {
                    · matching "{{ search() }}"
                  }
                  @if (!scopeEditable()) {
                    · {{ scopeLabel() }}
                  }
                </p>

                <div class="mock-field">
                  <span class="mock-field-label">Questions</span>
                  <tui-segmented
                    size="s"
                    role="group"
                    aria-label="Number of questions"
                    [activeItemIndex]="sizeIndex()"
                  >
                    @for (c of sizeChips(); track c.value) {
                      <button
                        type="button"
                        [attr.aria-pressed]="effectiveSize() === c.count"
                        (click)="setSize(c.value)"
                      >
                        {{ c.label }}
                      </button>
                    }
                  </tui-segmented>
                </div>

                <div class="mock-field">
                  <span class="mock-field-label">Timer</span>
                  <input
                    tuiSwitch
                    type="checkbox"
                    size="s"
                    aria-label="Thinking timer"
                    [showIcons]="false"
                    [checked]="timerEnabled()"
                    (change)="toggleTimer()"
                  />
                  <span class="mock-switch-text">
                    {{ timerEnabled() ? 'Thinking timer on' : 'Thinking timer off' }}
                    <span class="mock-switch-help">2 min per question · 5 for design & coding</span>
                  </span>
                </div>

                <p class="mock-hint">
                  Answer out loud, reveal the model answer, then rate yourself. Weak and unmastered
                  questions come up first.
                </p>

                <div class="flex-wrap-gap">
                  <button
                    tuiButton
                    type="button"
                    appearance="primary"
                    iconStart="@tui.play"
                    (click)="startSession()"
                  >
                    Start {{ effectiveSize() }}-question session
                    <kbd class="mock-kbd-inline">Enter</kbd>
                  </button>
                  <button
                    tuiButton
                    type="button"
                    appearance="secondary-grayscale"
                    iconStart="@tui.infinity"
                    (click)="startFree()"
                  >
                    Free practice
                  </button>
                </div>
              </div>
            } @else {
              <p class="mock-scope">
                No questions match the current filters.
                @if (scopeEditable() && (topicId() || level() !== 'all' || focus() !== 'all')) {
                  <button tuiLink type="button" (click)="resetScope()">
                    Show all {{ trackLabel() }} questions
                  </button>
                } @else {
                  Clear the search or pick another filter, then try again.
                }
              </p>
            }
          }

          <!-- Question -->
          @case ('question') {
            @if (current(); as item) {
              @if (timerEnabled()) {
                <progress
                  tuiProgressBar
                  size="xs"
                  class="mock-timer"
                  aria-hidden="true"
                  [class.mock-timer--low]="secondsLeft() <= 30"
                  [max]="secondsTotal() || 1"
                  [value]="secondsLeft()"
                ></progress>
              }

              <div class="spotlight-q-box">
                <p class="spotlight-q-text">"<app-rich-text [text]="item.q" />"</p>
                <div class="mock-tags">
                  <span
                    class="spotlight-cat-tag"
                    [style.color]="item.cat.color"
                    [style.background]="item.cat.color + '18'"
                    >{{ item.cat.title }}</span
                  >
                  @if (prepared().has(item.id)) {
                    <span tuiBadge appearance="positive" iconStart="@tui.circle-check"
                      >Mastered</span
                    >
                  }
                  @if (lastReview(item.id); as r) {
                    <span tuiBadge [appearance]="ratingAppearance[r]">
                      Last time: {{ ratingLabel[r] }}
                    </span>
                  }
                </div>
              </div>

              @if (revealed()) {
                <div class="spotlight-answer animate-fade-in">
                  <app-answer [categoryId]="item.cat.id" [questionId]="item.id" />
                </div>

                <div class="mock-rate">
                  <span class="mock-field-label">How did you do?</span>
                  <div class="flex-wrap-gap">
                    @for (r of ratings; track r.value) {
                      <button
                        tuiButton
                        type="button"
                        [appearance]="ratingAppearance[r.value]"
                        [title]="r.key"
                        (click)="rate(r.value)"
                      >
                        <i [class]="'ti ' + r.icon"></i>
                        {{ r.label }}
                        <kbd class="mock-kbd">{{ r.key }}</kbd>
                      </button>
                    }
                  </div>
                </div>
              }

              <div class="flex-wrap-gap">
                <button
                  tuiButton
                  type="button"
                  [appearance]="timeUp() && !revealed() ? 'warning' : 'secondary-grayscale'"
                  [iconStart]="revealed() ? '@tui.eye-off' : '@tui.eye'"
                  title="Space"
                  (click)="toggleReveal()"
                >
                  {{ revealed() ? 'Hide Answer' : 'Reveal Answer' }}
                </button>
                <button
                  tuiButton
                  type="button"
                  appearance="secondary-grayscale"
                  iconStart="@tui.skip-forward"
                  title="N"
                  (click)="rate('skipped')"
                >
                  Skip
                </button>
                <a
                  tuiButton
                  appearance="secondary-grayscale"
                  iconStart="@tui.external-link"
                  target="_blank"
                  rel="noopener"
                  [href]="docsUrl(item.q)"
                >
                  {{ docsLabel() }}
                </a>
                @if (results().length) {
                  <button
                    tuiButton
                    type="button"
                    appearance="secondary-grayscale"
                    iconStart="@tui.flag"
                    class="mock-end"
                    (click)="end()"
                  >
                    End & see results
                  </button>
                }
              </div>
            }
          }

          <!-- Summary -->
          @case ('summary') {
            @let s = summary();
            <div class="mock-summary">
              <div class="mock-score">
                <div>
                  <span class="mock-score-val">{{ s.score }}%</span>
                  <span class="mock-score-label">score</span>
                </div>
                <div class="mock-score-stats">
                  <span class="mock-stat mock-stat--nailed">{{ s.counts.nailed }} nailed</span>
                  <span class="mock-stat mock-stat--shaky">{{ s.counts.shaky }} shaky</span>
                  <span class="mock-stat mock-stat--blanked">{{ s.counts.blanked }} blanked</span>
                  @if (s.counts.skipped) {
                    <span class="mock-stat">{{ s.counts.skipped }} skipped</span>
                  }
                  <span class="mock-stat">
                    <i class="ti ti-clock"></i> {{ s.totalTime }} total · {{ s.avgTime }} avg
                  </span>
                </div>
              </div>

              @if (s.weakTopics.length) {
                <div class="mock-field mock-field--col">
                  <span class="mock-field-label">Work on next</span>
                  <div class="mock-tags">
                    @for (t of s.weakTopics; track t.cat.id) {
                      <span
                        class="spotlight-cat-tag mock-weak"
                        [style.color]="t.cat.color"
                        [style.background]="t.cat.color + '18'"
                        >{{ t.cat.title }} · {{ t.missed }} missed</span
                      >
                    }
                  </div>
                </div>
              }

              <ol class="mock-results">
                @for (r of results(); track $index) {
                  <li class="mock-result">
                    <span class="mock-result-q"><app-rich-text [text]="r.item.q" /></span>
                    <span class="mock-result-meta">
                      <span tuiBadge [appearance]="ratingAppearance[r.rating]">{{
                        ratingLabel[r.rating]
                      }}</span>
                      <span class="mock-result-time">{{ fmt(r.seconds) }}</span>
                    </span>
                  </li>
                }
              </ol>

              <div class="flex-wrap-gap">
                @if (s.missed.length) {
                  <button
                    tuiButton
                    type="button"
                    appearance="primary"
                    iconStart="@tui.repeat"
                    title="R"
                    (click)="retryMissed()"
                  >
                    Retry {{ s.missed.length }} missed
                  </button>
                  @if (s.unstarredMissed.length) {
                    <button
                      tuiButton
                      type="button"
                      appearance="secondary-grayscale"
                      iconStart="@tui.star"
                      (click)="starMissed()"
                    >
                      Star {{ s.unstarredMissed.length }} missed
                    </button>
                  }
                }
                <button
                  tuiButton
                  type="button"
                  iconStart="@tui.play"
                  title="Enter"
                  [appearance]="s.missed.length ? 'secondary-grayscale' : 'primary'"
                  (click)="phase.set('setup')"
                >
                  New session
                </button>
                <button
                  tuiButton
                  type="button"
                  appearance="secondary-grayscale"
                  (click)="closed.emit()"
                >
                  Done
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './mock-interview.css',
})
export class MockInterview {
  /** Questions currently visible (search, filter and topic applied). */
  pool = input.required<MockItem[]>();
  prepared = input.required<Set<string>>();
  starred = input.required<Set<string>>();
  mode = input<Track>('angular');
  protected readonly docsLabel = computed(() => trackInfo(this.mode()).docsLabel);
  /** Human-readable description of the pool, e.g. "Signals · Unprepared". */
  scopeLabel = input('all topics');

  /** Scope controls. When `topics` is given, the dialog can change the page's filters. */
  topics = input<{ id: string; title: string }[]>([]);
  topicId = input<string | null>(null);
  level = input<'all' | Level>('all');
  focus = input<MockFocus>('all');
  search = input('');
  protected readonly scopeEditable = computed(() => this.topics().length > 0);
  protected readonly trackLabel = computed(() => trackInfo(this.mode()).label);

  topicChange = output<string | null>();

  /** Topic picker model ('' = all topics): follows `topicId`, reports edits through `topicChange`. */
  private readonly scopeModel = linkedSignal(() => ({ topic: this.topicId() ?? '' }));
  protected readonly scopeForm = form(this.scopeModel);
  private readonly emitTopic = effect(() => {
    const topic = this.scopeForm.topic().value() || null;
    if (topic !== untracked(this.topicId)) this.topicChange.emit(topic);
  });
  levelChange = output<'all' | Level>();
  focusChange = output<MockFocus>();

  protected readonly levelOptions: { id: 'all' | Level; label: string }[] = [
    { id: 'all', label: 'All levels' },
    { id: 'core', label: 'Core' },
    { id: 'senior', label: 'Senior' },
  ];
  /** Topic picker values: '' is "all topics"; ids map to titles through `topicName`. */
  protected readonly topicIds = computed(() => ['', ...this.topics().map((t) => t.id)]);
  protected readonly topicName = (id: string): string =>
    id ? (this.topics().find((t) => t.id === id)?.title ?? id) : `All ${this.trackLabel()} topics`;

  /** Segmented controls track the selection by position. */
  protected readonly levelIndex = computed(() =>
    this.levelOptions.findIndex((l) => l.id === this.level()),
  );
  protected readonly focusIndex = computed(() =>
    this.focusOptions.findIndex((f) => f.id === this.focus()),
  );
  protected readonly sizeIndex = computed(() =>
    this.sizeChips().findIndex((c) => c.count === this.effectiveSize()),
  );

  protected readonly focusOptions: { id: MockFocus; label: string; hint: string }[] = [
    { id: 'all', label: 'Everything', hint: 'All questions; weak and unmastered ones come first' },
    { id: 'unprepared', label: 'Unmastered', hint: 'Only questions you have not mastered' },
    { id: 'starred', label: 'Starred', hint: 'Only questions you starred' },
  ];

  /**
   * Session sizes that make sense for this pool: the fixed sizes smaller than the pool,
   * plus "All" when the pool is small enough to go through in one sitting.
   */
  protected readonly sizeChips = computed(() => {
    const n = this.pool().length;
    const chips = SESSION_SIZES.filter((s) => s < n).map((s) => ({
      value: s,
      count: s,
      label: String(s),
    }));
    if (n <= ALL_LIMIT) chips.push({ value: ALL, count: n, label: `All (${n})` });
    return chips;
  });

  resetScope() {
    this.topicChange.emit(null);
    this.levelChange.emit('all');
    this.focusChange.emit('all');
  }

  preparedChange = output<{ id: string; prepared: boolean }>();
  starQuestions = output<string[]>();
  closed = output<void>();

  readonly sizes = SESSION_SIZES;
  readonly ratings = RATINGS;
  readonly ratingLabel = RATING_LABEL;
  /** Taiga status appearance per rating, for buttons and badges. */
  protected readonly ratingAppearance: Record<Rating, string> = {
    nailed: 'positive',
    shaky: 'warning',
    blanked: 'negative',
    skipped: 'neutral',
  };
  readonly fmt = formatClock;

  phase = signal<Phase>('setup');
  isSession = signal(false);
  sessionSize = signal(readJson<number>(SIZE_KEY, SESSION_SIZES[0]));
  effectiveSize = computed(() => Math.min(this.sessionSize(), this.pool().length));

  current = signal<MockItem | null>(null);
  revealed = signal(false);
  position = signal(0);
  deckSize = signal(0);
  results = signal<MockResult[]>([]);

  timerEnabled = signal(Boolean(readJson<boolean>(TIMER_KEY, true)));
  secondsLeft = signal(0);
  secondsTotal = signal(0);
  timeUp = computed(() => this.timerEnabled() && this.secondsLeft() <= 0);
  clock = computed(() => formatClock(this.secondsLeft()));

  private reviews = signal<Record<string, Review>>(readJson(REVIEWS_KEY, {}));
  private deck: MockItem[] = [];
  /** Free practice: identifies the pool the deck came from, so filter changes reshuffle. */
  private deckSignature = '';
  private questionStartedAt = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  summary = computed(() => {
    const results = this.results();
    const counts = { nailed: 0, shaky: 0, blanked: 0, skipped: 0 };
    for (const r of results) counts[r.rating]++;
    const rated = counts.nailed + counts.shaky + counts.blanked;
    const score = rated ? Math.round(((counts.nailed + counts.shaky * 0.5) / rated) * 100) : 0;
    const totalSeconds = results.reduce((sum, r) => sum + r.seconds, 0);

    const missed = results.filter((r) => r.rating !== 'nailed').map((r) => r.item);
    const starred = this.starred();
    const byTopic = new Map<string, { cat: CategoryModel; missed: number }>();
    for (const item of missed) {
      const t = byTopic.get(item.cat.id) ?? { cat: item.cat, missed: 0 };
      t.missed++;
      byTopic.set(item.cat.id, t);
    }

    return {
      counts,
      score,
      totalTime: formatClock(totalSeconds),
      avgTime: formatClock(results.length ? totalSeconds / results.length : 0),
      missed,
      unstarredMissed: missed.filter((m) => !starred.has(m.id)),
      weakTopics: [...byTopic.values()].sort((a, b) => b.missed - a.missed).slice(0, 3),
    };
  });

  constructor() {
    // Modal over the whole app: freeze the page behind, take keyboard focus, and
    // hand focus back to whatever opened it (the Mock Me button) on close.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const opener = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    afterNextRender(() => {
      // Move to <body> so page wrappers (z-index layers, fade-in transforms)
      // can't trap the fixed overlay under the nav or pin it to the top.
      document.body.appendChild(host);
      host.focus();
    });

    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      host.remove();
      document.body.style.overflow = bodyOverflow;
      opener?.focus?.();
    });
  }

  setSize(n: number) {
    this.sessionSize.set(n);
    writeJson(SIZE_KEY, n);
  }

  startSession() {
    const deck = this.shuffle(this.pool()).slice(0, this.effectiveSize());
    this.begin(deck, true);
  }

  startFree() {
    this.begin(this.shuffle(this.pool()), false);
    this.deckSignature = this.signatureOf(this.pool());
  }

  retryMissed() {
    const missed = this.summary().missed;
    if (missed.length)
      this.begin(
        weightedShuffle(missed, () => 1),
        true,
      );
  }

  starMissed() {
    this.starQuestions.emit(this.summary().unstarredMissed.map((m) => m.id));
  }

  toggleReveal() {
    const revealed = !this.revealed();
    this.revealed.set(revealed);
    // Stop the clock once the answer is out; it stays stopped if hidden again
    if (revealed) this.stopTimer();
  }

  toggleTimer() {
    const enabled = !this.timerEnabled();
    this.timerEnabled.set(enabled);
    writeJson(TIMER_KEY, enabled);
    const item = this.current();
    if (this.phase() !== 'question' || !item) return;
    if (enabled && !this.revealed()) this.startTimer(item.cat.id);
    else this.stopTimer();
  }

  /** Records how the answer went, updates mastery, and moves on. */
  rate(rating: Rating) {
    const item = this.current();
    if (!item) return;

    const seconds = (Date.now() - this.questionStartedAt) / 1000;
    this.results.update((list) => [...list, { item, rating, seconds }]);

    if (rating !== 'skipped') {
      this.reviews.update((all) => ({ ...all, [item.id]: { r: rating, t: Date.now() } }));
      writeJson(REVIEWS_KEY, this.reviews());

      const isPrepared = this.prepared().has(item.id);
      if (rating === 'nailed' && !isPrepared)
        this.preparedChange.emit({ id: item.id, prepared: true });
      if (rating === 'blanked' && isPrepared)
        this.preparedChange.emit({ id: item.id, prepared: false });
    }

    if (this.isSession() && this.position() >= this.deck.length) {
      this.finish();
    } else {
      this.next();
    }
  }

  /** Ends the run: summary if anything was answered, otherwise just close. */
  end() {
    if (this.results().length) this.finish();
    else this.closed.emit();
  }

  lastReview(id: string): Review['r'] | null {
    return this.reviews()[id]?.r ?? null;
  }

  docsUrl(question: string): string {
    const q = encodeURIComponent(question);
    return `https://www.google.com/search?q=site%3A${trackInfo(this.mode()).docsSite}+${q}`;
  }

  /** Keyboard shortcuts while the card is open. Returns true if the key was handled. */
  handleKey(e: KeyboardEvent): boolean {
    const onControl = !!(e.target as HTMLElement | null)?.closest('button, a');
    const phase = this.phase();

    if (e.key === 'Escape') {
      if (phase === 'question') this.end();
      else this.closed.emit();
      return true;
    }

    if (phase === 'setup') {
      if (e.key === 'Enter' && !onControl && this.pool().length) {
        this.startSession();
        return true;
      }
      return false;
    }

    if (phase === 'summary') {
      if (e.key === 'r' && this.summary().missed.length) {
        this.retryMissed();
        return true;
      }
      if (e.key === 'Enter' && !onControl) {
        this.phase.set('setup');
        return true;
      }
      return false;
    }

    switch (e.key) {
      case ' ':
        // Let Space activate a focused button or link as usual
        if (onControl) return false;
        this.toggleReveal();
        return true;
      case '1':
      case '2':
      case '3':
        if (!this.revealed()) return false;
        this.rate(RATINGS[Number(e.key) - 1].value);
        return true;
      case 'n':
        this.rate('skipped');
        return true;
      case 't':
        this.toggleTimer();
        return true;
      default:
        return false;
    }
  }

  private begin(deck: MockItem[], session: boolean) {
    if (!deck.length) return;
    this.deck = deck;
    this.deckSignature = '';
    this.isSession.set(session);
    this.results.set([]);
    this.position.set(0);
    this.deckSize.set(deck.length);
    this.phase.set('question');
    this.next();
  }

  private next() {
    if (!this.isSession()) {
      // Free practice: reshuffle when the deck runs out or the filters changed
      const pool = this.pool();
      if (!pool.length) {
        this.end();
        return;
      }
      const signature = this.signatureOf(pool);
      if (signature !== this.deckSignature && this.position() < this.deck.length) {
        // Filters changed (or a rating moved a question out of the filter): keep the
        // remaining order, drop questions no longer visible, and add newly visible ones.
        const visible = new Set(pool.map((p) => p.id));
        const inDeck = new Set(this.deck.map((d) => d.id));
        const remaining = this.deck.slice(this.position()).filter((d) => visible.has(d.id));
        const added = this.shuffle(pool.filter((p) => !inDeck.has(p.id)));
        const done = this.deck.slice(0, this.position()).filter((d) => visible.has(d.id));
        this.deck = [...done, ...remaining, ...added];
        this.position.set(done.length);
        this.deckSize.set(this.deck.length);
        this.deckSignature = signature;
      }
      if (this.position() >= this.deck.length) {
        const deck = this.shuffle(pool);
        // Don't open a new round with the question that was just on screen
        const last = this.current()?.id;
        if (deck.length > 1 && deck[0].id === last) deck.push(deck.shift()!);
        this.deck = deck;
        this.deckSignature = signature;
        this.position.set(0);
        this.deckSize.set(deck.length);
      }
    }

    const item = this.deck[this.position()];
    this.position.update((n) => n + 1);
    this.current.set(item);
    this.revealed.set(false);
    this.questionStartedAt = Date.now();
    this.startTimer(item.cat.id);
  }

  private finish() {
    this.stopTimer();
    this.current.set(null);
    this.phase.set('summary');
  }

  /**
   * Unmastered, starred and recently missed questions tend to come up first;
   * questions nailed in the last few days come up later.
   */
  private shuffle(items: MockItem[]): MockItem[] {
    const prepared = this.prepared();
    const starred = this.starred();
    const reviews = this.reviews();
    const now = Date.now();
    return weightedShuffle(items, ({ id }) => {
      let w = prepared.has(id) ? 1 : 4;
      if (starred.has(id)) w += 2;
      const review = reviews[id];
      if (review?.r === 'blanked') w *= 3;
      else if (review?.r === 'shaky') w *= 2;
      else if (review?.r === 'nailed' && now - review.t < 3 * DAY_MS) w *= 0.5;
      return w;
    });
  }

  private signatureOf(pool: MockItem[]): string {
    return pool.map((p) => p.id).join('\u0000');
  }

  private startTimer(categoryId: string) {
    this.stopTimer();
    const total = LONG_FORM_TOPICS.has(categoryId) ? SECONDS_LONG : SECONDS_SHORT;
    this.secondsTotal.set(total);
    this.secondsLeft.set(total);
    if (!this.timerEnabled()) return;
    this.timerId = setInterval(() => {
      const left = this.secondsLeft() - 1;
      this.secondsLeft.set(left);
      if (left <= 0) this.stopTimer();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
