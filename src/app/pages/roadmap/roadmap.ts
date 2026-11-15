import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiProgress } from '@taiga-ui/kit';
import { RoadmapService } from '@features/roadmap/roadmap.service';
import {
  DEPTH_HINTS,
  DEPTH_LABELS,
  RoadmapPhase,
  RoadmapTopic,
  SYSTEM_DESIGN_GATE,
  TopicDepth,
} from '@features/roadmap/roadmap-data';

type DepthFilter = 'all' | TopicDepth;

/** The phase the "ready to start system design" checkpoint is shown before. */
const GATE_PHASE_ID = 'system-design-fundamentals';

@Component({
  selector: 'app-roadmap',
  imports: [RouterLink, TuiProgress],
  template: `
    <div class="rm-shell">
      <div class="rm-glow"></div>

      <div class="rm-wrapper">
        <!-- ── Header ─────────────────────────────────────────────────── -->
        <header class="rm-header">
          <div class="rm-header-text">
            <div class="rm-page-icon"><i class="ti ti-route"></i></div>
            <h1 class="rm-title">System Design Roadmap</h1>
            <p class="rm-sub">
              A dependency-ordered path for Senior Full Stack roles: the fundamentals to learn
              before system design, the design process itself, then scale, microservices, production
              and case studies. Each topic says what to learn, why it matters, how deep to go and
              what it looks like with Angular, Node.js, NestJS, PostgreSQL, MongoDB, Redis and AWS.
            </p>
          </div>

          <div class="rm-overall" aria-label="Overall progress">
            <span class="rm-overall-num">{{ rm.overall().read }}/{{ rm.overall().total }}</span>
            <span class="rm-overall-label">topics learned</span>
            <progress
              tuiProgressBar
              size="xs"
              class="rm-overall-bar"
              aria-label="Topics learned"
              [max]="100"
              [value]="rm.overall().percent"
            ></progress>
          </div>
        </header>

        <!-- ── Phase flow ─────────────────────────────────────────────── -->
        <nav class="phase-flow" aria-label="Phases">
          @for (phase of rm.phases; track phase.id; let last = $last) {
            <button
              type="button"
              class="phase-flow-step"
              [class.phase-flow-step--active]="activePhase() === phase.id"
              [class.phase-flow-step--done]="rm.phaseProgress(phase).percent === 100"
              (click)="goToPhase(phase.id)"
            >
              <span class="phase-flow-num">{{ phase.number }}</span>
              {{ phase.shortTitle }}
            </button>
            @if (phase.id === gatePhaseId) {
              <span class="phase-flow-gate" title="Start actual system design here">
                <i class="ti ti-flag-3" aria-hidden="true"></i>
              </span>
            }
            @if (!last) {
              <i class="ti ti-chevron-right phase-flow-arrow" aria-hidden="true"></i>
            }
          }
        </nav>

        <!-- ── How to use + filters ───────────────────────────────────── -->
        <div class="rm-toolbar">
          <div class="depth-filter" role="group" aria-label="Filter by depth">
            @for (f of filters; track f.value) {
              <button
                type="button"
                class="depth-chip"
                [attr.data-depth]="f.value"
                [class.depth-chip--active]="depthFilter() === f.value"
                [attr.aria-pressed]="depthFilter() === f.value"
                [title]="f.hint"
                (click)="depthFilter.set(f.value)"
              >
                {{ f.label }} <span class="depth-chip-count">{{ depthCounts()[f.value] }}</span>
              </button>
            }
          </div>
          <div class="rm-toolbar-actions">
            <button type="button" class="link-btn" (click)="expandAll()">Expand all</button>
            <span class="link-sep" aria-hidden="true">·</span>
            <button type="button" class="link-btn" (click)="expanded.set(emptySet)">
              Collapse all
            </button>
          </div>
        </div>
        <p class="depth-hint">
          {{ currentHint() }} Durations are rough estimates at 8–10 hours a week, assuming many
          topics are revision for you.
        </p>

        <div class="rm-layout">
          <!-- ── Sticky phase list ────────────────────────────────────── -->
          <aside class="rm-sidebar" aria-label="Roadmap phases">
            <div class="rm-sidebar-panel">
              <div class="rm-sidebar-title">Phases</div>
              <ol class="rm-sidebar-list">
                @for (phase of rm.phases; track phase.id) {
                  @let p = rm.phaseProgress(phase);
                  <li>
                    <button
                      type="button"
                      class="rm-side-btn"
                      [class.rm-side-btn--active]="activePhase() === phase.id"
                      (click)="goToPhase(phase.id)"
                    >
                      <span class="rm-side-num" [class.rm-side-num--done]="p.percent === 100">
                        @if (p.percent === 100) {
                          <i class="ti ti-check" aria-hidden="true"></i>
                        } @else {
                          {{ phase.number }}
                        }
                      </span>
                      <span class="rm-side-text">
                        <span class="rm-side-title">{{ phase.title }}</span>
                        <span class="rm-side-meta"
                          >{{ p.read }}/{{ p.total }} · {{ phase.duration }}</span
                        >
                      </span>
                    </button>
                  </li>
                }
              </ol>
            </div>
          </aside>

          <!-- ── Phases ───────────────────────────────────────────────── -->
          <main class="rm-main">
            @for (phase of rm.phases; track phase.id) {
              @if (phase.id === gatePhaseId) {
                <section class="gate" aria-labelledby="gate-title">
                  <div class="gate-head">
                    <i class="ti ti-flag-3 gate-icon" aria-hidden="true"></i>
                    <div>
                      <h2 id="gate-title" class="gate-title">
                        Checkpoint: are you ready to start system design?
                      </h2>
                      <p class="gate-sub">
                        Phases 1–4 are prerequisites. Start Phase 5 when you can do all of these
                        without notes. If two or more feel shaky, go back first; system design built
                        on weak fundamentals turns into memorized diagrams.
                      </p>
                    </div>
                  </div>
                  <ul class="check-list">
                    @for (item of gate; track $index) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </section>
              }

              @let p = rm.phaseProgress(phase);
              @let topics = visibleTopics(phase);
              <section class="phase" [id]="'phase-' + phase.id" [attr.data-phase]="phase.id">
                <div class="phase-head">
                  <div class="phase-icon"><i [class]="'ti ' + phase.icon"></i></div>
                  <div class="phase-head-text">
                    <div class="phase-kicker">
                      Phase {{ phase.number }}
                      @if (phase.number <= 4) {
                        <span class="phase-tag">Prerequisite</span>
                      }
                    </div>
                    <h2 class="phase-title">{{ phase.title }}</h2>
                    <div class="phase-meta">
                      <span
                        ><i class="ti ti-clock" aria-hidden="true"></i> {{ phase.duration }}</span
                      >
                      <span>{{ p.read }}/{{ p.total }} topics learned</span>
                    </div>
                  </div>
                </div>

                <p class="phase-goal">{{ phase.goal }}</p>

                @if (phase.requires.length) {
                  <div class="builds-on">
                    <span class="builds-on-label">Builds on</span>
                    @for (req of phase.requires; track req) {
                      @let rp = phaseById(req);
                      @if (rp) {
                        <button type="button" class="dep-chip" (click)="goToPhase(rp.id)">
                          Phase {{ rp.number }}: {{ rp.shortTitle }}
                        </button>
                      }
                    }
                  </div>
                }

                <div class="topic-list">
                  @for (topic of topics; track topic.id; let i = $index) {
                    @let done = rm.isDone(phase.id, topic.id);
                    <article class="topic" [id]="'topic-' + topic.id" [class.topic--done]="done">
                      <button
                        type="button"
                        class="topic-check"
                        [class.topic-check--on]="done"
                        [attr.aria-pressed]="done"
                        [attr.aria-label]="(done ? 'Unmark ' : 'Mark as learned: ') + topic.title"
                        (click)="rm.toggle(phase.id, topic.id)"
                      >
                        <i class="ti ti-check" aria-hidden="true"></i>
                      </button>

                      <details
                        [open]="expanded().has(topic.id)"
                        (toggle)="onToggle(topic.id, $event)"
                      >
                        <summary class="topic-summary">
                          <span class="topic-summary-main">
                            <span class="topic-title-row">
                              <span class="topic-title">{{ topic.title }}</span>
                              <span class="depth-badge" [attr.data-depth]="topic.depth">
                                {{ depthLabels[topic.depth] }}
                              </span>
                            </span>
                            <span class="topic-why">{{ topic.why }}</span>
                          </span>
                          <i class="ti ti-chevron-down topic-chevron" aria-hidden="true"></i>
                        </summary>

                        <div class="topic-body">
                          <div class="topic-block">
                            <h3 class="topic-block-title">
                              <i class="ti ti-list-details" aria-hidden="true"></i> What to
                              understand
                            </h3>
                            <ul class="learn-list">
                              @for (item of topic.learn; track $index) {
                                <li>{{ item }}</li>
                              }
                            </ul>
                          </div>

                          <div class="topic-block">
                            <h3 class="topic-block-title">
                              <i class="ti ti-ruler-measure" aria-hidden="true"></i> How deep to go
                            </h3>
                            <p class="topic-text">{{ topic.howDeep }}</p>
                          </div>

                          <div class="topic-block topic-example">
                            <h3 class="topic-block-title">
                              <i class="ti ti-code" aria-hidden="true"></i> Real-world example
                            </h3>
                            <p class="topic-text">{{ topic.example }}</p>
                          </div>

                          @if (topic.dependsOn.length) {
                            <div class="topic-deps">
                              <span class="builds-on-label">Learn first</span>
                              @for (dep of topic.dependsOn; track dep) {
                                @let d = rm.findTopic(dep);
                                @if (d) {
                                  <button
                                    type="button"
                                    class="dep-chip"
                                    [class.dep-chip--done]="rm.isDone(d.phase.id, d.topic.id)"
                                    (click)="goToTopic(dep)"
                                  >
                                    @if (rm.isDone(d.phase.id, d.topic.id)) {
                                      <i class="ti ti-check" aria-hidden="true"></i>
                                    }
                                    {{ d.topic.title }}
                                    @if (d.phase.id !== phase.id) {
                                      <span class="dep-chip-phase">P{{ d.phase.number }}</span>
                                    }
                                  </button>
                                }
                              }
                            </div>
                          }

                          @if (topic.study?.length) {
                            <div class="topic-deps">
                              <span class="builds-on-label">Study in PrepHub</span>
                              @for (s of topic.study; track s.label) {
                                <a
                                  class="study-link"
                                  [class.study-link--practice]="s.query"
                                  [routerLink]="s.link"
                                  [queryParams]="s.query"
                                >
                                  <i
                                    [class]="'ti ' + (s.query ? 'ti-list-check' : 'ti-book-2')"
                                    aria-hidden="true"
                                  ></i>
                                  {{ s.label }}
                                </a>
                              }
                            </div>
                          }
                        </div>
                      </details>
                    </article>
                  } @empty {
                    <p class="topic-empty">No {{ currentLabel() }} topics in this phase.</p>
                  }
                </div>

                <div class="phase-footer">
                  <div class="exercise">
                    <h3 class="footer-title">
                      <i class="ti ti-tools" aria-hidden="true"></i> Practical exercise:
                      {{ phase.exercise.title }}
                    </h3>
                    <ol class="exercise-steps">
                      @for (step of phase.exercise.steps; track $index) {
                        <li>{{ step }}</li>
                      }
                    </ol>
                    <h4 class="footer-subtitle">A good result includes</h4>
                    <ul class="check-list">
                      @for (item of phase.exercise.lookFor; track $index) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  </div>
                  <div class="ready">
                    <h3 class="footer-title">
                      <i class="ti ti-circle-check" aria-hidden="true"></i> Move on when you can
                    </h3>
                    <ul class="check-list">
                      @for (item of phase.readyWhen; track $index) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  </div>
                </div>

                @if (phase.unlocks?.length) {
                  <div class="unlocks">
                    <span class="builds-on-label">
                      <i class="ti ti-lock-open" aria-hidden="true"></i> Case studies you can
                      attempt now
                    </span>
                    @for (id of phase.unlocks; track id) {
                      @let u = rm.findTopic(id);
                      @if (u) {
                        <button type="button" class="dep-chip" (click)="goToTopic(id)">
                          {{ u.topic.title }}
                        </button>
                      }
                    }
                  </div>
                }
              </section>
            }
          </main>
        </div>
      </div>
    </div>
  `,
  styleUrl: './roadmap.css',
})
export class Roadmap {
  protected readonly rm = inject(RoadmapService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly gate = SYSTEM_DESIGN_GATE;
  protected readonly gatePhaseId = GATE_PHASE_ID;
  protected readonly depthLabels = DEPTH_LABELS;
  protected readonly emptySet = new Set<string>();

  protected readonly filters: { value: DepthFilter; label: string; hint: string }[] = [
    { value: 'all', label: 'All topics', hint: 'Every topic in learning order.' },
    ...(['must', 'should', 'advanced'] as const).map((d) => ({
      value: d,
      label: DEPTH_LABELS[d],
      hint: DEPTH_HINTS[d],
    })),
  ];

  protected readonly depthFilter = signal<DepthFilter>('all');
  protected readonly expanded = signal<Set<string>>(new Set());
  protected readonly activePhase = signal(this.rm.phases[0].id);

  protected readonly depthCounts = computed(() => {
    const counts: Record<DepthFilter, number> = { all: 0, must: 0, should: 0, advanced: 0 };
    for (const t of this.rm.phases.flatMap((p) => p.topics)) {
      counts.all++;
      counts[t.depth]++;
    }
    return counts;
  });

  protected readonly currentHint = computed(
    () => this.filters.find((f) => f.value === this.depthFilter())?.hint ?? '',
  );
  protected readonly currentLabel = computed(() => {
    const f = this.depthFilter();
    return f === 'all' ? '' : DEPTH_LABELS[f].toLowerCase();
  });

  constructor() {
    // Highlight the phase currently in view in the sidebar and the phase strip
    afterNextRender(() => {
      const sections = this.host.nativeElement.querySelectorAll<HTMLElement>('section.phase');
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.find((e) => e.isIntersecting);
          const id = visible?.target.getAttribute('data-phase');
          if (id) this.activePhase.set(id);
        },
        { rootMargin: '-30% 0px -60% 0px' },
      );
      sections.forEach((s) => observer.observe(s));
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected visibleTopics(phase: RoadmapPhase): RoadmapTopic[] {
    const f = this.depthFilter();
    return f === 'all' ? phase.topics : phase.topics.filter((t) => t.depth === f);
  }

  protected phaseById(id: string): RoadmapPhase | undefined {
    return this.rm.phases.find((p) => p.id === id);
  }

  protected onToggle(topicId: string, event: Event) {
    const open = (event.target as HTMLDetailsElement).open;
    if (open === this.expanded().has(topicId)) return;
    this.expanded.update((set) => {
      const next = new Set(set);
      if (open) next.add(topicId);
      else next.delete(topicId);
      return next;
    });
  }

  protected expandAll() {
    this.expanded.set(
      new Set(this.rm.phases.flatMap((p) => this.visibleTopics(p).map((t) => t.id))),
    );
  }

  protected goToPhase(phaseId: string) {
    this.scrollTo('phase-' + phaseId);
  }

  /** Opens a prerequisite topic and scrolls to it, clearing the depth filter if it hides it. */
  protected goToTopic(topicId: string) {
    const found = this.rm.findTopic(topicId);
    if (!found) return;
    const f = this.depthFilter();
    if (f !== 'all' && f !== found.topic.depth) this.depthFilter.set('all');
    this.expanded.update((set) => new Set(set).add(topicId));
    afterNextRender(() => this.scrollTo('topic-' + topicId, true), { injector: this.injector });
  }

  private scrollTo(elementId: string, focus = false) {
    const el = this.host.nativeElement.querySelector<HTMLElement>('#' + elementId);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (focus) el.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
  }
}
