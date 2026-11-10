import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { Highlight } from '@pipes/highlight';
import { CategoryModel } from '@services/question';

/** One question in the flattened, filtered list; `key` is unique across categories. */
export interface QItem {
  key: string;
  /** Stable question id: progress, ratings and answers are keyed by it. */
  id: string;
  /** Question text, for display. */
  q: string;
  senior: boolean;
  cat: CategoryModel;
  /** 1-based position among the visible questions of its topic. */
  num: number;
}

export interface QGroup {
  cat: CategoryModel;
  items: QItem[];
}

export const questionKey = (categoryId: string, questionId: string) =>
  `${categoryId}::${questionId}`;

/** Compact, always-open list of questions grouped by topic. One click opens a question in the reader. */
@Component({
  selector: 'app-question-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Highlight, TuiBadge, TuiButton],
  template: `
    <nav class="glass-panel ql" aria-label="Questions">
      @for (g of groups(); track g.cat.id) {
        <section class="ql-group">
          <header class="ql-group-head">
            <span
              class="ql-group-icon"
              [style.color]="g.cat.color"
              [style.background]="g.cat.color + '18'"
            >
              <i [class]="'ti ' + g.cat.icon"></i>
            </span>
            <span class="ql-group-title">{{ g.cat.title }}</span>
            <span
              class="ql-group-count"
              [title]="doneCount(g) + ' of ' + g.items.length + ' mastered'"
              [attr.aria-label]="doneCount(g) + ' of ' + g.items.length + ' mastered'"
            >
              @if (doneCount(g) === g.items.length) {
                <i class="ti ti-circle-check"></i>
              }
              {{ doneCount(g) }}/{{ g.items.length }}</span
            >
          </header>

          <ul class="ql-items">
            @for (it of g.items; track it.key) {
              <li
                class="ql-row"
                [class.ql-row--active]="it.key === activeKey()"
                [class.ql-row--done]="preparedSet().has(it.id)"
                [style.--ql-accent]="g.cat.color"
              >
                <button
                  tuiIconButton
                  type="button"
                  size="xs"
                  appearance="flat-grayscale"
                  class="ql-check"
                  [iconStart]="preparedSet().has(it.id) ? '@tui.circle-check' : '@tui.circle'"
                  (click)="togglePrepared.emit(it.id)"
                  [title]="preparedSet().has(it.id) ? 'Mark as unprepared' : 'Mark as mastered'"
                >
                  {{ preparedSet().has(it.id) ? 'Mark as unprepared' : 'Mark as mastered' }}
                </button>

                <button
                  type="button"
                  class="ql-main"
                  (click)="selected.emit(it)"
                  [attr.aria-current]="it.key === activeKey() ? 'true' : null"
                  [title]="it.q"
                >
                  <span class="ql-num">{{ it.num }}</span>
                  <span class="ql-text" [innerHTML]="label(it) | highlight: searchFilter()"></span>
                  @if (showLevel() && it.senior) {
                    <span
                      tuiBadge
                      size="s"
                      appearance="info"
                      class="ql-level"
                      title="Senior-level question"
                      >Senior</span
                    >
                  }
                </button>

                @if (starredSet().has(it.id)) {
                  <i class="ti ti-star-filled ql-star" aria-label="Starred"></i>
                }
              </li>
            }
          </ul>
        </section>
      }
    </nav>
  `,
  styleUrl: './question-list.css',
})
export class QuestionList {
  readonly groups = input.required<QGroup[]>();
  readonly activeKey = input<string | null>(null);
  readonly searchFilter = input('');
  readonly preparedSet = input<Set<string>>(new Set());
  readonly starredSet = input<Set<string>>(new Set());
  /** Hide the Senior badge when the list is already filtered to one level. */
  readonly showLevel = input(true);

  /**
   * Short title for the narrow list; the full question is in the reader and the tooltip.
   * While searching, show the full text so every match can be highlighted.
   */
  protected label(it: QItem): string {
    return this.searchFilter().trim() ? it.q : (this.shortTitles()[it.id] ?? it.q);
  }

  /** Loaded on demand (~60 KB) so it stays out of the initial bundle; full text shows until then. */
  private readonly shortTitles = signal<Record<string, string>>({});

  constructor() {
    import('@services/short-titles').then((m) => this.shortTitles.set(m.SHORT_TITLES));
  }

  readonly selected = output<QItem>();
  readonly togglePrepared = output<string>();

  doneCount(g: QGroup): number {
    const prepared = this.preparedSet();
    return g.items.reduce((n, it) => n + (prepared.has(it.id) ? 1 : 0), 0);
  }
}
