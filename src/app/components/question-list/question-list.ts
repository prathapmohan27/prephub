import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Highlight } from '@pipes/highlight';
import { CategoryModel, levelOf } from '@services/question';

/** One question in the flattened, filtered list; `key` is unique across categories. */
export interface QItem {
  key: string;
  q: string;
  cat: CategoryModel;
  /** 1-based position among the visible questions of its topic. */
  num: number;
}

export interface QGroup {
  cat: CategoryModel;
  items: QItem[];
}

export const questionKey = (categoryId: string, question: string) => `${categoryId}::${question}`;

/** Compact, always-open list of questions grouped by topic. One click opens a question in the reader. */
@Component({
  selector: 'app-question-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Highlight],
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
                [class.ql-row--done]="preparedSet().has(it.q)"
                [style.--ql-accent]="g.cat.color"
              >
                <button
                  type="button"
                  class="ql-check"
                  (click)="togglePrepared.emit(it.q)"
                  [attr.aria-label]="
                    preparedSet().has(it.q) ? 'Mark as unprepared' : 'Mark as mastered'
                  "
                  [title]="preparedSet().has(it.q) ? 'Mark as unprepared' : 'Mark as mastered'"
                >
                  <i
                    class="ti"
                    [class.ti-circle-check]="preparedSet().has(it.q)"
                    [class.ti-circle]="!preparedSet().has(it.q)"
                  ></i>
                </button>

                <button
                  type="button"
                  class="ql-main"
                  (click)="selected.emit(it)"
                  [attr.aria-current]="it.key === activeKey() ? 'true' : null"
                  [title]="it.q"
                >
                  <span class="ql-num">{{ it.num }}</span>
                  <span
                    class="ql-text"
                    [innerHTML]="label(it.q) | highlight: searchFilter()"
                  ></span>
                  @if (showLevel() && isSenior(it.q)) {
                    <span class="ql-level" title="Senior-level question">Senior</span>
                  }
                </button>

                @if (starredSet().has(it.q)) {
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
  protected isSenior(q: string): boolean {
    return levelOf(q) === 'senior';
  }

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
  protected label(q: string): string {
    return this.searchFilter().trim() ? q : (this.shortTitles()[q] ?? q);
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
    return g.items.reduce((n, it) => n + (prepared.has(it.q) ? 1 : 0), 0);
  }
}
