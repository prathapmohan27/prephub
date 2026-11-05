import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryModel, Question, RENAMED_QUESTIONS } from '@services/question';
import { DailyLearningService } from '@services/daily-learning';

type Mode = 'angular' | 'nodejs';

interface Progress {
  read: number;
  total: number;
  percent: number;
}

/** A "continue" card: where to go next in one section of the app. */
interface NextStep {
  kind: 'qa' | 'concept' | 'system';
  label: string;
  icon: string;
  accent: string;
  title: string;
  meta: string;
  percent: number;
  started: boolean;
  link: string[];
  queryParams?: Record<string, string>;
}

/** Just what Home needs from a lesson — the full lesson content is loaded lazily. */
interface LessonLite {
  id: string;
  title: string;
  color: string;
  difficulty: string;
  estimatedTime: string;
  sectionIds: string[];
}

type SectionProgress = Record<string, Record<string, boolean>>;

const toLite = (
  l: Omit<LessonLite, 'sectionIds'> & { sections: { id: string }[] },
): LessonLite => ({
  id: l.id,
  title: l.title,
  color: l.color,
  difficulty: l.difficulty,
  estimatedTime: l.estimatedTime,
  sectionIds: l.sections.map((s) => s.id),
});

function readProgress(key: string): SectionProgress {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') ?? {};
  } catch {
    return {};
  }
}

/** Same counting rule as CoreConceptsService / SystemDesignService. */
function lessonProgress(lesson: LessonLite, progress: SectionProgress): Progress {
  const total = lesson.sectionIds.length;
  const read = Object.values(progress[lesson.id] ?? {}).filter(Boolean).length;
  return { read, total, percent: pct(read, total) };
}

function overall(lessons: LessonLite[] | null, progress: SectionProgress): Progress {
  let read = 0,
    total = 0;
  for (const l of lessons ?? []) {
    const p = lessonProgress(l, progress);
    read += p.read;
    total += p.total;
  }
  return { read, total, percent: pct(read, total) };
}

const pct = (read: number, total: number) => (total ? Math.round((read / total) * 100) : 0);

function readList(key: string): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(list) ? list.map((q: string) => RENAMED_QUESTIONS[q] ?? q) : [];
  } catch {
    return [];
  }
}

/** Landing page: overall progress, today's questions, and where to continue in each section. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <div class="home">
      <div class="home-glow"></div>

      <div class="home-wrapper">
        <!-- Hero -->
        <header class="home-hero">
          <div>
            <h1 class="home-title">{{ hasProgress() ? 'Welcome back' : 'Welcome to PrepHub' }}</h1>
            <p class="home-sub">
              {{
                hasProgress()
                  ? 'Pick up where you left off, or knock out today’s 10 questions.'
                  : 'Angular & Node.js interview questions, core concepts and system design — all in one place.'
              }}
            </p>
          </div>
          <div class="streak-pill" [class.streak-pill--on]="streak() > 0">
            <i class="ti ti-flame"></i>
            @if (streak() > 0) {
              {{ streak() }}-day streak
            } @else {
              No streak yet
            }
          </div>
        </header>

        <!-- Today -->
        <section class="glass-panel today" aria-labelledby="today-title">
          <div class="today-icon"><i class="ti ti-calendar-stats"></i></div>
          <div class="today-body">
            <h2 id="today-title" class="today-title">Today’s questions</h2>
            @if (todayTotal() > 0) {
              <p class="today-text">{{ todayDone() }} of {{ todayTotal() }} done</p>
              <div class="bar" aria-hidden="true">
                <span class="bar-fill bar-fill--violet" [style.width.%]="todayPercent()"></span>
              </div>
            } @else {
              <p class="today-text">10 fresh questions a day keep your streak alive.</p>
            }
          </div>
          <a routerLink="/daily" class="btn-cta">
            @if (todayTotal() === 0) {
              Start today
            } @else if (todayDone() < todayTotal()) {
              Continue
            } @else {
              Review
            }
            <i class="ti ti-arrow-right"></i>
          </a>
        </section>

        <!-- Continue -->
        <section aria-labelledby="continue-title">
          <h2 id="continue-title" class="section-label home-label">
            {{ hasProgress() ? 'Continue where you left off' : 'Good places to start' }}
          </h2>
          <div class="next-grid">
            @for (step of nextSteps(); track step.kind) {
              <a
                class="glass-panel next-card"
                [routerLink]="step.link"
                [queryParams]="step.queryParams"
                [style.--accent]="step.accent"
              >
                <span class="next-kind">
                  <i [class]="'ti ' + step.icon"></i>
                  {{ step.label }}
                </span>
                <span class="next-title">{{ step.title }}</span>
                <span class="next-meta">{{ step.meta }}</span>
                @if (step.started && step.kind !== 'qa') {
                  <span class="bar" aria-hidden="true">
                    <span class="bar-fill" [style.width.%]="step.percent"></span>
                  </span>
                }
                <span class="next-go">
                  {{ step.started ? 'Continue' : 'Start' }} <i class="ti ti-arrow-right"></i>
                </span>
              </a>
            }
          </div>
        </section>

        <!-- Overall progress -->
        <section aria-labelledby="progress-title">
          <h2 id="progress-title" class="section-label home-label">Your progress</h2>
          <div class="stats-grid">
            @for (s of stats(); track s.label) {
              <a class="glass-panel stat" [routerLink]="s.link" [style.--accent]="s.accent">
                <span class="stat-head">
                  <i [class]="'ti ' + s.icon"></i>
                  {{ s.label }}
                </span>
                <span class="stat-value"> {{ s.progress.percent }}<small>%</small> </span>
                <span class="bar" aria-hidden="true">
                  <span class="bar-fill" [style.width.%]="s.progress.percent"></span>
                </span>
                <span class="stat-meta"
                  >{{ s.progress.read }} / {{ s.progress.total }} {{ s.unit }}</span
                >
              </a>
            }
          </div>
          @if (starredCount() > 0) {
            <p class="starred-note">
              <i class="ti ti-star"></i>
              {{ starredCount() }} starred question{{ starredCount() === 1 ? '' : 's' }} — use the
              <a routerLink="/questions">Starred filter</a> in Interview Q&amp;A to review them.
            </p>
          }
        </section>
      </div>
    </div>
  `,
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questions = inject(Question);

  // Lesson lists load after first paint so ~800 KB of lesson content stays out of the initial bundle
  private readonly conceptList = signal<LessonLite[] | null>(null);
  private readonly systemList = signal<LessonLite[] | null>(null);
  private readonly conceptProgress = readProgress('core_concepts_progress');
  private readonly systemProgress = readProgress('sd_progress');
  private daily = inject(DailyLearningService);

  private readonly categories: CategoryModel[] = this.questions.getCategories();
  private readonly prepared = new Set(readList('prep_prepared'));
  readonly starredCount = computed(() => readList('prep_starred').length);

  readonly streak = this.daily.streak;
  readonly todayDone = this.daily.completedCount;
  readonly todayTotal = computed(() => this.daily.session()?.questions.length ?? 0);
  readonly todayPercent = computed(() => pct(this.todayDone(), this.todayTotal()));

  private qaProgress(mode: Mode): Progress {
    const cats = this.categories.filter((c) => c.id.startsWith('nodejs-') === (mode === 'nodejs'));
    const all = cats.flatMap((c) => c.questions);
    const read = all.filter((q) => this.prepared.has(q)).length;
    return { read, total: all.length, percent: pct(read, all.length) };
  }

  readonly stats = computed(() => [
    {
      label: 'Angular Q&A',
      icon: 'ti-brand-angular',
      accent: '#f43f5e',
      unit: 'mastered',
      link: '/questions',
      progress: this.qaProgress('angular'),
    },
    {
      label: 'Node.js Q&A',
      icon: 'ti-brand-nodejs',
      accent: '#22c55e',
      unit: 'mastered',
      link: '/questions',
      progress: this.qaProgress('nodejs'),
    },
    {
      label: 'Core Concepts',
      icon: 'ti-bulb',
      accent: '#f59e0b',
      unit: 'sections read',
      link: '/core-concepts',
      progress: overall(this.conceptList(), this.conceptProgress),
    },
    {
      label: 'System Design',
      icon: 'ti-topology-star',
      accent: '#14b8a6',
      unit: 'sections read',
      link: '/system-design',
      progress: overall(this.systemList(), this.systemProgress),
    },
  ]);

  readonly hasProgress = computed(
    () =>
      this.prepared.size > 0 ||
      this.todayTotal() > 0 ||
      this.stats().some((s) => s.progress.read > 0) ||
      this.lastQuestion() !== null,
  );

  /** Last question opened in Interview Q&A (saved per mode by the Q&A page). */
  private readonly lastQuestion = computed(() => {
    const saved = localStorage.getItem('prep_mode') === 'nodejs' ? 'nodejs' : 'angular';
    for (const mode of [saved, saved === 'angular' ? 'nodejs' : 'angular']) {
      try {
        const last = JSON.parse(localStorage.getItem(`prep_last_${mode}`) || 'null');
        if (!last?.key) continue;
        const sep = last.key.indexOf('::');
        const rawQ: string = last.key.slice(sep + 2);
        const q = RENAMED_QUESTIONS[rawQ] ?? rawQ;
        const cat = this.categories.find((c) => c.id === last.key.slice(0, sep));
        if (cat?.questions.includes(q)) return { q, cat, topic: last.topic as string | null };
      } catch {
        // ignore corrupt entries
      }
    }
    return null;
  });

  readonly nextSteps = computed<NextStep[]>(() => {
    const steps: NextStep[] = [];

    const last = this.lastQuestion();
    const firstCat = this.categories[0];
    steps.push(
      last
        ? {
            kind: 'qa',
            label: 'Interview Q&A',
            icon: 'ti-list-check',
            accent: last.cat.id.startsWith('nodejs-') ? '#22c55e' : '#f43f5e',
            title: last.q.replace(/`/g, ''),
            meta: last.cat.title,
            percent: 0,
            started: true,
            link: ['/questions'],
            queryParams: { ...(last.topic ? { topic: last.topic } : {}), q: last.q },
          }
        : {
            kind: 'qa',
            label: 'Interview Q&A',
            icon: 'ti-list-check',
            accent: '#f43f5e',
            title: firstCat.title,
            meta: `${firstCat.questions.length} questions to start with`,
            percent: 0,
            started: false,
            link: ['/questions'],
            queryParams: { topic: firstCat.id },
          },
    );

    const concept = this.pickNext(this.conceptList(), this.conceptProgress);
    if (concept) {
      steps.push({
        kind: 'concept',
        label: 'Core Concepts',
        icon: 'ti-bulb',
        accent: concept.item.color,
        title: concept.item.title,
        meta: concept.started
          ? `${concept.progress.read} of ${concept.progress.total} sections read`
          : `${concept.item.estimatedTime} · ${concept.item.difficulty}`,
        percent: concept.progress.percent,
        started: concept.started,
        link: ['/core-concepts', concept.item.id],
      });
    }

    const system = this.pickNext(this.systemList(), this.systemProgress);
    if (system) {
      steps.push({
        kind: 'system',
        label: 'System Design',
        icon: 'ti-topology-star',
        accent: system.item.color,
        title: system.item.title,
        meta: system.started
          ? `${system.progress.read} of ${system.progress.total} sections read`
          : `${system.item.estimatedTime} · ${system.item.difficulty}`,
        percent: system.progress.percent,
        started: system.started,
        link: ['/system-design', system.item.id],
      });
    }

    return steps;
  });

  /** The first lesson in progress, otherwise the first one not finished yet. */
  private pickNext(items: LessonLite[] | null, progress: SectionProgress) {
    const withProgress = (items ?? []).map((item) => ({
      item,
      progress: lessonProgress(item, progress),
    }));
    const inProgress = withProgress.find(
      (x) => x.progress.read > 0 && x.progress.read < x.progress.total,
    );
    const next = inProgress ?? withProgress.find((x) => x.progress.read < x.progress.total);
    return next ? { ...next, started: next.progress.read > 0 } : null;
  }

  ngOnInit() {
    // Q&A used to live at "/": forward old shared links like /?topic=…&q=… to /questions
    const params = this.route.snapshot.queryParams;
    if (params['q'] || params['topic']) {
      this.router.navigate(['/questions'], { queryParams: params, replaceUrl: true });
      return;
    }
    this.daily.loadTodaySession();
    this.daily.refreshStreak();

    import('@services/core-concepts-data').then((m) =>
      this.conceptList.set(m.CORE_CONCEPTS.map(toLite)),
    );
    import('@services/system-design-data').then((m) =>
      this.systemList.set(m.SYSTEM_DESIGN_SYSTEMS.map(toLite)),
    );
  }
}
