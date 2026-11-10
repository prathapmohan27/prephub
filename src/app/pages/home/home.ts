import { Component, computed, inject, injectAsync, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TuiButton, TuiDialogService } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiProgress, type TuiConfirmData } from '@taiga-ui/kit';
import { firstValueFrom } from 'rxjs';
import { CategoryModel, TRACKS, Track, isTrack, trackOf } from '@features/questions/question';
import { DailyLearningService } from '@features/daily-learning/daily-learning.service';
import { exportProgress, importProgress } from '@core/progress/progress-backup';
import {
  Progress,
  SectionProgress,
  lessonProgress,
  percentOf,
  readSectionProgress,
} from '@core/progress/lesson-progress';
import { readJson, readString, readStringList } from '@core/storage/storage';

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

/** Same counting rule as CoreConceptsService / SystemDesignService. */
const progressOf = (lesson: LessonLite, progress: SectionProgress): Progress =>
  lessonProgress(lesson.sectionIds, progress[lesson.id]);

function overall(lessons: LessonLite[] | null, progress: SectionProgress): Progress {
  let read = 0,
    total = 0;
  for (const l of lessons ?? []) {
    const p = progressOf(l, progress);
    read += p.read;
    total += p.total;
  }
  return { read, total, percent: pct(read, total) };
}

const pct = percentOf;

/** Landing page: overall progress, today's questions, and where to continue in each section. */

const TRACK_ACCENT: Record<Track, string> = {
  foundations: 'var(--color-track-foundations)',
  angular: 'var(--color-track-angular)',
  nodejs: 'var(--color-track-nodejs)',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, TuiButton, TuiProgress],
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
              <progress
                tuiProgressBar
                size="s"
                class="bar"
                aria-hidden="true"
                color="var(--gradient-brand-bar)"
                [max]="100"
                [value]="todayPercent()"
              ></progress>
            } @else {
              <p class="today-text">10 fresh questions a day keep your streak alive.</p>
            }
          </div>
          <a
            tuiButton
            appearance="primary"
            iconEnd="@tui.arrow-right"
            routerLink="/daily"
            class="btn-cta"
          >
            @if (todayTotal() === 0) {
              Start today
            } @else if (todayDone() < todayTotal()) {
              Continue
            } @else {
              Review
            }
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
                  <progress
                    tuiProgressBar
                    size="s"
                    class="bar"
                    aria-hidden="true"
                    [max]="100"
                    [value]="step.percent"
                  ></progress>
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
                <progress
                  tuiProgressBar
                  size="s"
                  class="bar"
                  aria-hidden="true"
                  [max]="100"
                  [value]="s.progress.percent"
                ></progress>
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
          <div class="backup-row">
            <span class="backup-text">
              Progress is saved only in this browser. Keep a backup or move it to another device.
            </span>
            <span class="backup-actions">
              <button
                tuiButton
                type="button"
                appearance="secondary-grayscale"
                iconStart="@tui.download"
                (click)="backup()"
              >
                Back up
              </button>
              <button
                tuiButton
                type="button"
                appearance="secondary-grayscale"
                iconStart="@tui.upload"
                (click)="restoreInput.click()"
              >
                Restore
              </button>
              <input
                #restoreInput
                type="file"
                accept="application/json,.json"
                hidden
                (change)="restore(restoreInput)"
              />
            </span>
          </div>
          @if (backupMessage()) {
            <p class="backup-message" role="status">{{ backupMessage() }}</p>
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
  // The question bank (~110 KB) is fetched after first paint, like the lesson lists below
  private readonly questionBank = injectAsync(() =>
    import('@features/questions/data/question-bank').then((m) => m.Question),
  );

  // Lesson lists load after first paint so ~800 KB of lesson content stays out of the initial bundle
  private readonly conceptList = signal<LessonLite[] | null>(null);
  private readonly systemList = signal<LessonLite[] | null>(null);
  private readonly conceptProgress = readSectionProgress('core_concepts_progress');
  private readonly systemProgress = readSectionProgress('sd_progress');
  private daily = inject(DailyLearningService);

  private readonly categories = signal<CategoryModel[]>([]);
  private readonly prepared = new Set(readStringList('prep_prepared'));
  readonly starredCount = signal(readStringList('prep_starred').length).asReadonly();

  readonly streak = this.daily.streak;
  readonly todayDone = this.daily.completedCount;
  readonly todayTotal = computed(() => this.daily.session()?.questions.length ?? 0);
  readonly todayPercent = computed(() => pct(this.todayDone(), this.todayTotal()));

  private qaProgress(track: Track): Progress {
    const cats = this.categories().filter((c) => trackOf(c.id) === track);
    const all = cats.flatMap((c) => c.questions);
    const read = all.filter((q) => this.prepared.has(q.id)).length;
    return { read, total: all.length, percent: pct(read, all.length) };
  }

  readonly stats = computed(() => [
    {
      label: 'Foundations',
      icon: 'ti-brand-javascript',
      accent: 'var(--color-track-foundations)',
      unit: 'mastered',
      link: '/questions',
      progress: this.qaProgress('foundations'),
    },
    {
      label: 'Angular Q&A',
      icon: 'ti-brand-angular',
      accent: 'var(--color-track-angular)',
      unit: 'mastered',
      link: '/questions',
      progress: this.qaProgress('angular'),
    },
    {
      label: 'Node.js Q&A',
      icon: 'ti-brand-nodejs',
      accent: 'var(--color-track-nodejs)',
      unit: 'mastered',
      link: '/questions',
      progress: this.qaProgress('nodejs'),
    },
    {
      label: 'Core Concepts',
      icon: 'ti-bulb',
      accent: 'var(--color-track-foundations)',
      unit: 'sections read',
      link: '/core-concepts',
      progress: overall(this.conceptList(), this.conceptProgress),
    },
    {
      label: 'System Design',
      icon: 'ti-topology-star',
      accent: 'var(--color-track-system-design)',
      unit: 'sections read',
      link: '/system-design',
      progress: overall(this.systemList(), this.systemProgress),
    },
  ]);

  readonly backupMessage = signal('');
  private readonly dialogs = inject(TuiDialogService);

  private confirmRestore(): Promise<boolean> {
    const data: TuiConfirmData = {
      content: 'Restoring replaces your current progress in this browser.',
      yes: 'Restore',
      no: 'Cancel',
    };
    return firstValueFrom(
      this.dialogs.open<boolean>(TUI_CONFIRM, { label: 'Restore progress?', size: 's', data }),
      { defaultValue: false },
    );
  }

  backup() {
    exportProgress();
    this.backupMessage.set('Backup downloaded.');
  }

  async restore(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!(await this.confirmRestore())) return;
    try {
      const count = await importProgress(file);
      this.backupMessage.set(`Restored ${count} saved items. Reloading…`);
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      this.backupMessage.set(e instanceof Error ? e.message : 'Could not restore that file.');
    }
  }

  readonly hasProgress = computed(
    () =>
      this.prepared.size > 0 ||
      this.todayTotal() > 0 ||
      this.stats().some((s) => s.progress.read > 0) ||
      this.lastQuestion() !== null,
  );

  /** Last question opened in Interview Q&A (saved per mode by the Q&A page). */
  private readonly lastQuestion = computed(() => {
    const savedMode = readString('prep_mode');
    const saved: Track = isTrack(savedMode) ? savedMode : 'angular';
    // The track used last first, then the others
    for (const mode of [saved, ...TRACKS.map((t) => t.id).filter((t) => t !== saved)]) {
      const last = readJson<{ key?: unknown; topic?: unknown } | null>(`prep_last_${mode}`, null);
      const key = last?.key;
      if (typeof key !== 'string') continue;
      const sep = key.indexOf('::');
      const id = key.slice(sep + 2);
      const catId = key.slice(0, sep);
      const cat = this.categories().find((c) => c.id === catId);
      const question = cat?.questions.find((q) => q.id === id);
      if (cat && question)
        return { question, cat, topic: typeof last?.topic === 'string' ? last.topic : null };
    }
    return null;
  });

  readonly nextSteps = computed<NextStep[]>(() => {
    const steps: NextStep[] = [];

    const last = this.lastQuestion();
    const firstCat = this.categories()[0];
    steps.push(
      last
        ? {
            kind: 'qa',
            label: 'Interview Q&A',
            icon: 'ti-list-check',
            accent: TRACK_ACCENT[trackOf(last.cat.id)],
            title: last.question.text.replace(/`/g, ''),
            meta: last.cat.title,
            percent: 0,
            started: true,
            link: ['/questions'],
            queryParams: { ...(last.topic ? { topic: last.topic } : {}), q: last.question.id },
          }
        : {
            kind: 'qa',
            label: 'Interview Q&A',
            icon: 'ti-list-check',
            accent: 'var(--color-track-angular)',
            title: firstCat?.title ?? 'Browse the question bank',
            meta: firstCat ? `${firstCat.questions.length} questions to start with` : '',
            percent: 0,
            started: false,
            link: ['/questions'],
            queryParams: firstCat ? { topic: firstCat.id } : {},
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
      progress: progressOf(item, progress),
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

    this.questionBank().then((bank) => this.categories.set(bank.getCategories()));
    import('@features/core-concepts/core-concepts-data').then((m) =>
      this.conceptList.set(m.CORE_CONCEPTS.map(toLite)),
    );
    import('@features/system-design/system-design-data').then((m) =>
      this.systemList.set(m.SYSTEM_DESIGN_SYSTEMS.map(toLite)),
    );
  }
}
