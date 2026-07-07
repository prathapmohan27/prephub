import { Component, input, signal, computed, output, effect } from '@angular/core';
import { QuestionItemComponent } from './question-item.component';
import { Category } from '../services/question.service';

@Component({
  selector: 'app-category',
  imports: [QuestionItemComponent],
  template: `
    <div class="glass-panel cat-panel">
      <!-- Category Header -->
      <button
        (click)="isOpen.update((v) => !v)"
        class="category-header-btn"
        [style.borderLeft]="'4px solid ' + category().color"
      >
        <!-- Icon + Title + Progress -->
        <div class="flex-row-center flex-1-min0" style="gap: 12px;">
          <div
            class="cat-icon-md"
            [style.color]="category().color"
            [style.background]="category().color + '18'"
          >
            <i [class]="'ti ' + category().icon"></i>
          </div>

          <div class="flex-1-min0">
            <p class="cat-title">{{ category().title }}</p>
            <!-- Progress row -->
            <div class="flex-row-center" style="gap: 8px; margin-top: 5px;">
              <div class="progress-bar-sm">
                <div
                  class="progress-fill-sm"
                  [style.width.%]="categoryPreparedPercentage()"
                  [style.background]="category().color"
                ></div>
              </div>
              <span class="text-muted text-monospace text-xxs">
                {{ preparedCount() }}/{{ filteredQuestions().length }} done
              </span>
            </div>
          </div>
        </div>

        <!-- Right: count badge + chevron -->
        <div class="flex-row-center shrink-0 gap-2.5">
          <span
            class="cat-count-badge"
            [style.color]="category().color"
            [style.background]="category().color + '18'"
          >
            {{ filteredQuestions().length }}
          </span>
          <i
            class="ti ti-chevron-down cat-chevron"
            [style.transform]="isOpen() ? 'rotate(180deg)' : 'rotate(0deg)'"
          ></i>
        </div>
      </button>

      <!-- Questions list (expanded) -->
      @if (isOpen()) {
        <div class="category-body">
          @if (filteredQuestions().length === 0) {
            <p class="cat-no-match">No questions match your filter in this category.</p>
          } @else {
            @for (q of filteredQuestions(); track q; let i = $index) {
              <app-question-item
                [questionText]="q"
                [questionNumber]="i + 1"
                [searchFilter]="searchFilter()"
                [isPrepared]="isQuestionPrepared(q)"
                [isStarred]="isQuestionStarred(q)"
                [notes]="getQuestionNotes(q)"
                [mode]="mode()"
                (togglePrepared)="togglePrepared.emit(q)"
                (toggleStarred)="toggleStarred.emit(q)"
                (notesChange)="onNotesChange(q, $event)"
              />
            }
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .cat-panel {
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .category-header-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      background: rgba(24, 24, 27, 0.5);
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }
    .category-header-btn:hover {
      background: rgba(24, 24, 27, 0.7);
    }

    .cat-icon-md {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .cat-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cat-count-badge {
      padding: 3px 10px;
      border-radius: var(--radius-pill);
      font-size: 0.68rem;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .cat-chevron {
      font-size: 14px;
      transition: transform 0.25s ease;
      color: var(--color-text-subtle);
    }

    .progress-bar-sm {
      width: 60px;
      height: 3px;
      border-radius: var(--radius-pill);
      background: rgba(63, 63, 70, 0.5);
      overflow: hidden;
      flex-shrink: 0;
    }

    .progress-fill-sm {
      height: 100%;
      border-radius: var(--radius-pill);
      transition: width 0.4s ease;
    }

    .category-body {
      border-top: 1px solid var(--color-border);
      background: rgba(9, 9, 11, 0.25);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 480px;
      overflow-y: auto;
    }

    .cat-no-match {
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-subtle);
      padding: 24px 0;
    }
  `,
})
export class CategoryComponent {
  category = input.required<Category>();
  searchFilter = input<string>('');
  forceOpen = input<boolean>(false);
  preparedSet = input<Set<string>>(new Set());
  starredSet = input<Set<string>>(new Set());
  notesMap = input<Record<string, string>>({});
  mode = input<string>('angular');

  togglePrepared = output<string>();
  toggleStarred = output<string>();
  notesChange = output<{ question: string; notes: string }>();

  isOpen = signal(false);

  constructor() {
    effect(() => {
      this.isOpen.set(this.forceOpen());
    });
  }

  filteredQuestions = computed(() => {
    const f = this.searchFilter().toLowerCase().trim();
    if (!f) return this.category().questions;
    return this.category().questions.filter((q) => q.toLowerCase().includes(f));
  });

  preparedCount = computed(
    () => this.filteredQuestions().filter((q) => this.preparedSet().has(q)).length,
  );

  categoryPreparedPercentage = computed(() => {
    const total = this.filteredQuestions().length;
    if (total === 0) return 0;
    return Math.round((this.preparedCount() / total) * 100);
  });

  isQuestionPrepared(q: string) {
    return this.preparedSet().has(q);
  }
  isQuestionStarred(q: string) {
    return this.starredSet().has(q);
  }
  getQuestionNotes(q: string) {
    return this.notesMap()[q] ?? '';
  }

  onNotesChange(question: string, notes: string) {
    this.notesChange.emit({ question, notes });
  }
}
