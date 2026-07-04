import { Component, input, signal, computed, output, effect } from '@angular/core';
import { QuestionItemComponent } from './question-item.component';
import { Category } from '../services/question.service';

@Component({
  selector: 'app-category',
  imports: [QuestionItemComponent],
  template: `
    <div
      class="glass-panel"
      style="border-radius:16px;overflow:hidden;border:1px solid rgba(63,63,70,0.3);transition:border-color 0.2s;"
    >
      <!-- Category Header -->
      <button
        (click)="isOpen.update((v) => !v)"
        [style.borderLeft]="'4px solid ' + category().color"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;background:rgba(24,24,27,0.5);border:none;cursor:pointer;text-align:left;transition:background 0.15s;"
      >
        <!-- Icon + Title + Progress -->
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
          <div
            [style.color]="category().color"
            [style.background]="category().color + '18'"
            style="width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"
          >
            <i [class]="'ti ' + category().icon"></i>
          </div>

          <div style="flex:1;min-width:0;">
            <p style="font-size:0.875rem;font-weight:600;color:#f4f4f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;">
              {{ category().title }}
            </p>
            <!-- Inline progress -->
            <div style="display:flex;align-items:center;gap:8px;margin-top:5px;">
              <div style="width:60px;height:3px;border-radius:999px;background:rgba(63,63,70,0.5);overflow:hidden;flex-shrink:0;">
                <div
                  [style.width.%]="categoryPreparedPercentage()"
                  [style.background]="category().color"
                  style="height:100%;border-radius:999px;transition:width 0.4s ease;"
                ></div>
              </div>
              <span style="font-size:0.62rem;color:#71717a;font-family:monospace;white-space:nowrap;">
                {{ preparedCount() }}/{{ filteredQuestions().length }} done
              </span>
            </div>
          </div>
        </div>

        <!-- Right: count badge + chevron -->
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          <span
            [style.color]="category().color"
            [style.background]="category().color + '18'"
            style="padding:3px 10px;border-radius:999px;font-size:0.68rem;font-weight:700;font-family:monospace;"
          >
            {{ filteredQuestions().length }}
          </span>
          <i
            class="ti ti-chevron-down"
            style="font-size:14px;color:#71717a;transition:transform 0.25s ease;"
            [style.transform]="isOpen() ? 'rotate(180deg)' : 'rotate(0deg)'"
          ></i>
        </div>
      </button>

      <!-- Questions list (expanded) -->
      @if (isOpen()) {
        <div style="border-top:1px solid rgba(63,63,70,0.3);background:rgba(9,9,11,0.25);padding:16px 20px;display:flex;flex-direction:column;gap:10px;max-height:480px;overflow-y:auto;">
          @if (filteredQuestions().length === 0) {
            <p style="text-align:center;font-size:0.75rem;color:#71717a;padding:24px 0;">
              No questions match your filter in this category.
            </p>
          } @else {
            @for (q of filteredQuestions(); track q; let i = $index) {
              <app-question-item
                [questionText]="q"
                [questionNumber]="i + 1"
                [searchFilter]="searchFilter()"
                [isPrepared]="isQuestionPrepared(q)"
                [isStarred]="isQuestionStarred(q)"
                [notes]="getQuestionNotes(q)"
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
  styles: [`:host { display: block; }`],
})
export class CategoryComponent {
  category = input.required<Category>();
  searchFilter = input<string>('');
  forceOpen = input<boolean>(false);
  preparedSet = input<Set<string>>(new Set());
  starredSet = input<Set<string>>(new Set());
  notesMap = input<Record<string, string>>({});

  togglePrepared = output<string>();
  toggleStarred = output<string>();
  notesChange = output<{ question: string; notes: string }>();

  isOpen = signal(false);

  constructor() {
    effect(() => { this.isOpen.set(this.forceOpen()); });
  }

  filteredQuestions = computed(() => {
    const filter = this.searchFilter().toLowerCase();
    if (!filter) return this.category().questions;
    return this.category().questions.filter((q) => q.toLowerCase().includes(filter));
  });

  preparedCount = computed(() =>
    this.filteredQuestions().filter((q) => this.preparedSet().has(q)).length
  );

  categoryPreparedPercentage = computed(() => {
    const total = this.filteredQuestions().length;
    return total === 0 ? 0 : Math.round((this.preparedCount() / total) * 100);
  });

  isQuestionPrepared(q: string) { return this.preparedSet().has(q); }
  isQuestionStarred(q: string) { return this.starredSet().has(q); }
  getQuestionNotes(q: string) { return this.notesMap()[q] || ''; }
  onNotesChange(q: string, notes: string) { this.notesChange.emit({ question: q, notes }); }
}
