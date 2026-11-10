import { Component, signal, computed, inject, input, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FlowDiagram } from '@shared/ui/flow-diagram/flow-diagram';
import { SystemDesignService } from '@features/system-design/system-design.service';
import { CalloutVariant } from '@shared/models/content-model';
import { SystemDesignSystem, SYSTEM_PATH_LABELS } from '@features/system-design/system-design-data';

const CALLOUT_ICONS: Record<CalloutVariant, string> = {
  info: 'ti-info-circle',
  tip: 'ti-bulb',
  warning: 'ti-alert-triangle',
  important: 'ti-flame',
};

import { TuiButton } from '@taiga-ui/core';
import { TuiBadge, TuiProgress } from '@taiga-ui/kit';
import { difficultyAppearance } from '@shared/utils/difficulty';

@Component({
  selector: 'app-system-design',
  imports: [RouterLink, FlowDiagram, TuiBadge, TuiButton, TuiProgress],
  template: `
    <div class="sd-shell">
      <div class="sd-glow"></div>

      <div class="sd-wrapper">
        <!-- ── Top bar ────────────────────────────────────────────────── -->
        <div class="sd-topbar">
          @if (sdService.overallRead().total > 0) {
            <div class="overall-badge">
              <i class="ti ti-checklist" style="font-size:13px"></i>
              {{ sdService.overallRead().read }} / {{ sdService.overallRead().total }} sections read
              &nbsp;·&nbsp; {{ sdService.overallRead().percent }}%
            </div>
          }
        </div>

        <!-- ════════════════ LIST VIEW ════════════════ -->
        @if (view() === 'list') {
          <div class="animate-in">
            <!-- Page header -->
            <div class="sd-page-header">
              <div class="sd-page-icon"><i class="ti ti-school"></i></div>
              <h1 class="sd-page-title">System Design</h1>
              <p class="sd-page-sub">
                {{ sdService.systems.length }} carefully chosen systems — from your first
                single-server URL shortener and ID generator to flash-sale ticketing and a
                production-grade payment processor. Each system builds on the last, taking you from
                zero to confident in real system design interviews.
              </p>
            </div>

            <!-- Learning path -->
            <div class="learning-path">
              @for (step of learningPath; track step.id; let i = $index) {
                <span class="path-step" [class.path-step--done]="isMilestoneComplete(step.id)">{{
                  step.label
                }}</span>
                @if (i < learningPath.length - 1) {
                  <i class="ti ti-chevron-right path-arrow"></i>
                }
              }
            </div>

            <!-- Systems grid -->
            <div class="systems-grid">
              @for (sys of sdService.systems; track sys.id; let i = $index) {
                <button
                  class="sys-card"
                  [style.--card-glow]="sys.accentGlow"
                  (click)="openSystem(sys)"
                  [id]="'sys-card-' + sys.id"
                >
                  <div class="sys-card-top">
                    <div
                      class="sys-icon-lg"
                      [style.background]="sys.color + '20'"
                      [style.color]="sys.color"
                    >
                      <i [class]="'ti ' + sys.icon"></i>
                    </div>
                    <span class="sys-number">System {{ i + 1 }}</span>
                  </div>

                  <div>
                    <p class="sys-title">{{ sys.title }}</p>
                    <p class="sys-tagline">{{ sys.tagline }}</p>
                  </div>

                  <div class="sys-tags">
                    @for (tag of sys.tags.slice(0, 4); track tag) {
                      <span tuiBadge size="s" appearance="neutral" class="sys-tag">{{ tag }}</span>
                    }
                  </div>

                  <div class="sys-footer">
                    <span
                      tuiBadge
                      size="m"
                      class="sys-difficulty"
                      [appearance]="difficultyAppearance(sys.difficulty)"
                      >{{ sys.difficulty }}</span
                    >

                    <span class="sys-time">
                      <i class="ti ti-clock" style="font-size:11px"></i>
                      {{ sys.estimatedTime }}
                    </span>

                    <!-- Progress ring -->
                    <div class="sys-progress-ring" aria-hidden="true">
                      <span class="sys-progress-label">{{ systemProgressPct(sys.id) }}%</span>
                      <tui-progress-circle
                        size="s"
                        [color]="sys.color"
                        [max]="100"
                        [value]="systemProgressPct(sys.id)"
                      />
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- ════════════════ DETAIL VIEW ════════════════ -->
        @if (view() === 'detail' && activeSystem()) {
          <div class="animate-in">
            <!-- Detail header -->
            <div class="detail-header">
              <div class="detail-breadcrumb">
                <a
                  tuiButton
                  size="xs"
                  appearance="flat-grayscale"
                  iconStart="@tui.chevron-left"
                  routerLink="/system-design"
                  class="btn-breadcrumb-back"
                >
                  All Systems
                </a>
                <i class="ti ti-slash" style="font-size:9px"></i>
                <span [style.color]="activeSystem()!.color">{{ activeSystem()!.title }}</span>
              </div>

              <h2 class="detail-sys-title">{{ activeSystem()!.title }}</h2>

              <div class="detail-meta">
                <span
                  tuiBadge
                  size="m"
                  class="sys-difficulty"
                  [appearance]="difficultyAppearance(activeSystem()!.difficulty)"
                  >{{ activeSystem()!.difficulty }}</span
                >

                <span class="sys-time">
                  <i class="ti ti-clock" style="font-size:11px"></i>
                  {{ activeSystem()!.estimatedTime }}
                </span>

                <span style="font:600 0.7rem var(--font-mono); color:var(--color-text-faint);">
                  {{ systemProgress().read }}/{{ systemProgress().total }} sections read
                </span>
              </div>
            </div>

            <!-- Two-column layout -->
            <div class="detail-layout">
              <!-- LEFT: section navigator -->
              <aside class="detail-sidebar" [class.detail-sidebar--open]="sectionsOpen()">
                <!-- Phones: the section list folds into this row so the lesson starts on screen -->
                <button
                  type="button"
                  class="sections-toggle"
                  aria-controls="lesson-sections"
                  [attr.aria-expanded]="sectionsOpen()"
                  (click)="sectionsOpen.set(!sectionsOpen())"
                >
                  <span class="sections-toggle-count"
                    >Section {{ activeSectionIdx() + 1 }} of
                    {{ activeSystem()!.sections.length }}</span
                  >
                  <span class="sections-toggle-title">{{ activeSection()?.title }}</span>
                  <i class="ti ti-chevron-down sections-toggle-chevron" aria-hidden="true"></i>
                </button>
                <div class="detail-sidebar-panel">
                  <div class="sidebar-sys-header">
                    <div
                      class="sidebar-sys-icon"
                      [style.background]="activeSystem()!.color + '20'"
                      [style.color]="activeSystem()!.color"
                    >
                      <i [class]="'ti ' + activeSystem()!.icon"></i>
                    </div>
                    <span class="sidebar-sys-title">Sections</span>
                  </div>

                  <progress
                    tuiProgressBar
                    size="xs"
                    class="sidebar-progress-bar"
                    aria-label="Sections read"
                    [max]="100"
                    [value]="systemProgress().percent"
                  ></progress>

                  <nav id="lesson-sections" class="section-nav-list" aria-label="Sections">
                    @for (sec of activeSystem()!.sections; track sec.id; let i = $index) {
                      <button
                        class="section-nav-btn"
                        [class.section-nav-btn--active]="activeSectionIdx() === i"
                        [class.section-nav-btn--read]="
                          isSectionRead(sec.id) && activeSectionIdx() !== i
                        "
                        (click)="goToSection(i)"
                        [id]="'sec-nav-' + sec.id"
                      >
                        <i [class]="'ti ' + sec.icon + ' section-nav-icon'"></i>
                        <span
                          style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                        >
                          {{ i + 1 }}. {{ sec.title }}
                        </span>
                        @if (isSectionRead(sec.id)) {
                          <i class="ti ti-check section-nav-check"></i>
                        }
                      </button>
                    }
                  </nav>
                </div>

                <!-- Mark all read -->
                <button
                  tuiButton
                  type="button"
                  appearance="secondary-grayscale"
                  iconStart="@tui.check-check"
                  class="btn-mark-all"
                  id="btn-mark-all-read"
                  (click)="markAllRead()"
                >
                  Mark All Read
                </button>
              </aside>

              <!-- RIGHT: section content -->
              <main class="detail-main">
                @if (activeSection(); as sec) {
                  <div class="section-view animate-in" [attr.key]="sec.id">
                    <!-- Section top bar -->
                    <div class="section-top-bar">
                      <div class="section-title-group">
                        <div class="section-icon-sm">
                          <i [class]="'ti ' + sec.icon"></i>
                        </div>
                        <span class="section-title">{{ sec.title }}</span>
                        <span class="section-counter">
                          {{ activeSectionIdx() + 1 }} / {{ activeSystem()!.sections.length }}
                        </span>
                      </div>

                      <div class="section-actions">
                        <button
                          tuiButton
                          type="button"
                          [appearance]="isSectionRead(sec.id) ? 'positive' : 'secondary-grayscale'"
                          [iconStart]="
                            isSectionRead(sec.id) ? '@tui.circle-check' : '@tui.book-open'
                          "
                          [attr.aria-pressed]="isSectionRead(sec.id)"
                          [id]="'btn-toggle-' + sec.id"
                          (click)="toggleRead(sec.id)"
                        >
                          {{ isSectionRead(sec.id) ? 'Marked as Read' : 'Mark as Read' }}
                        </button>
                      </div>
                    </div>

                    <!-- Content blocks -->
                    <div class="section-body">
                      @for (block of sec.blocks; track $index) {
                        <div class="content-block">
                          @if (block.type === 'heading2') {
                            <h3 class="block-h2">{{ block.text }}</h3>
                          }

                          @if (block.type === 'heading3') {
                            <h4 class="block-h3">{{ block.text }}</h4>
                          }

                          @if (block.type === 'paragraph') {
                            <p class="block-p">{{ block.text }}</p>
                          }

                          @if (block.type === 'bullets' && block.items) {
                            <ul class="block-bullets">
                              @for (item of block.items; track item) {
                                <li>{{ item }}</li>
                              }
                            </ul>
                          }

                          @if (block.type === 'numbered' && block.items) {
                            <ol class="block-numbered">
                              @for (item of block.items; track item) {
                                <li>{{ item }}</li>
                              }
                            </ol>
                          }

                          @if (block.type === 'code' && block.code) {
                            <div class="block-code">
                              <code>{{ block.code }}</code>
                            </div>
                          }

                          @if (block.type === 'flow' && block.code) {
                            @defer (on viewport; prefetch on idle) {
                              <app-flow-diagram
                                [code]="block.code"
                                [title]="block.title"
                                [caption]="block.text"
                              />
                            } @placeholder {
                              <div class="defer-diagram" aria-hidden="true"></div>
                            }
                          }

                          @if (block.type === 'divider') {
                            <div class="block-divider"></div>
                          }

                          @if (block.type === 'callout') {
                            <div
                              class="block-callout"
                              [class.callout-info]="block.variant === 'info'"
                              [class.callout-tip]="block.variant === 'tip'"
                              [class.callout-warning]="block.variant === 'warning'"
                              [class.callout-important]="block.variant === 'important'"
                            >
                              <i
                                class="ti section-nav-icon callout-icon"
                                [class]="'ti ' + calloutIcon(block.variant)"
                              ></i>
                              <span class="callout-text">{{ block.text }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Prev / Next navigation -->
                    <div class="section-nav-row">
                      <button
                        tuiButton
                        type="button"
                        appearance="secondary-grayscale"
                        iconStart="@tui.chevron-left"
                        [disabled]="activeSectionIdx() === 0"
                        (click)="prevSection()"
                        id="btn-prev-section"
                      >
                        Previous
                      </button>

                      <span class="section-nav-center">
                        {{ activeSectionIdx() + 1 }} / {{ activeSystem()!.sections.length }}
                      </span>

                      <button
                        tuiButton
                        type="button"
                        appearance="secondary-grayscale"
                        iconEnd="@tui.chevron-right"
                        [disabled]="activeSectionIdx() === activeSystem()!.sections.length - 1"
                        (click)="nextSection()"
                        id="btn-next-section"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                }
              </main>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './system-design.css',
})
export class SystemDesign {
  protected readonly difficultyAppearance = difficultyAppearance;

  protected sdService = inject(SystemDesignService);

  // ── Signals ──────────────────────────────────────────────────────────────
  private router = inject(Router);

  // ── Route state (bound from URL via withComponentInputBinding) ───────────
  /** Route param: /system-design/:systemId */
  readonly systemId = input<string>();
  /** Query param: ?section=<sectionId> */
  readonly section = input<string>();

  activeSystem = computed(() => {
    const id = this.systemId();
    return id ? (this.sdService.getSystem(id) ?? null) : null;
  });

  /** Phones only: whether the folded section list is open. */
  sectionsOpen = signal(false);

  view = computed(() => (this.activeSystem() ? 'detail' : 'list'));

  activeSectionIdx = computed(() => {
    const item = this.activeSystem();
    const secId = this.section();
    if (!item || !secId) return 0;
    return Math.max(
      0,
      item.sections.findIndex((s) => s.id === secId),
    );
  });

  constructor() {
    // Unknown id in the URL → fall back to the list instead of a blank page
    effect(() => {
      if (this.systemId() && !this.activeSystem()) {
        this.router.navigate(['/system-design'], { replaceUrl: true });
      }
    });
  }

  activeSection = computed(() => {
    const sys = this.activeSystem();
    const idx = this.activeSectionIdx();
    return sys?.sections[idx] ?? null;
  });

  systemProgress = computed(() => {
    const sys = this.activeSystem();
    return sys ? this.sdService.systemProgress(sys.id) : { total: 0, read: 0, percent: 0 };
  });

  // ── Static data ───────────────────────────────────────────────────────────
  /** One step per lesson, in lesson order. */
  learningPath = this.sdService.systems.map((l) => ({
    id: l.id,
    label: SYSTEM_PATH_LABELS[l.id] ?? l.title,
  }));

  calloutIconMap = CALLOUT_ICONS;

  // ── Navigation (URL-driven so back/forward, refresh and deep links work) ─
  openSystem(sys: SystemDesignSystem) {
    this.router.navigate(['/system-design', sys.id]);
  }

  goToSection(idx: number) {
    this.sectionsOpen.set(false);
    const sec = this.activeSystem()?.sections[idx];
    if (!sec) return;
    // replaceUrl: stepping through sections shouldn't flood browser history
    this.router.navigate([], { queryParams: { section: sec.id }, replaceUrl: true });
  }

  prevSection() {
    this.goToSection(this.activeSectionIdx() - 1);
  }

  nextSection() {
    const item = this.activeSystem();
    const sec = this.activeSection();
    // Auto-mark current section as read on Next
    if (item && sec && !this.isSectionRead(sec.id)) {
      this.sdService.toggleSection(item.id, sec.id);
    }
    this.goToSection(this.activeSectionIdx() + 1);
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  isSectionRead(sectionId: string): boolean {
    const sys = this.activeSystem();
    return sys ? this.sdService.isSectionRead(sys.id, sectionId) : false;
  }

  toggleRead(sectionId: string) {
    const sys = this.activeSystem();
    if (sys) this.sdService.toggleSection(sys.id, sectionId);
  }

  markAllRead() {
    const sys = this.activeSystem();
    if (sys) this.sdService.markAllRead(sys.id);
  }

  // ── Grid helpers ──────────────────────────────────────────────────────────
  systemProgressPct(systemId: string): number {
    return this.sdService.systemProgress(systemId).percent;
  }

  /** SVG circle circumference = 2π × 14 ≈ 87.96; offset controls filled arc */

  isMilestoneComplete(id: string): boolean {
    return this.sdService.systemProgress(id).percent === 100;
  }

  calloutIcon(variant: CalloutVariant | undefined): string {
    return variant ? CALLOUT_ICONS[variant] : 'ti-info-circle';
  }
}
