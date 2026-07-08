import { Component, input, signal, computed, output, effect } from '@angular/core';
import { QuestionItem } from '@components/question-item';
import { CategoryModel } from '@services/question';

@Component({
  selector: 'app-category',
  imports: [QuestionItem],
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
  styleUrl: './category.css',
})
export class Category {
  category = input.required<CategoryModel>();
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
