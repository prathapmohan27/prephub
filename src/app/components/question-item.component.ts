import { Component, input, output, signal } from '@angular/core';
import { HighlightPipe } from '../pipes/highlight.pipe';

@Component({
  selector: 'app-question-item',
  imports: [HighlightPipe],
  template: `
    <div class="glass-card question-card" [class.question-card--prepared]="isPrepared()">
      <!-- Question row -->
      <div class="question-row">
        <!-- Prepared toggle -->
        <button
          (click)="togglePrepared.emit()"
          class="btn-icon-bare q-btn-prepare"
          [title]="isPrepared() ? 'Mark as unprepared' : 'Mark as prepared'"
        >
          @if (isPrepared()) {
            <i class="ti ti-circle-check-filled q-check-icon"></i>
          } @else {
            <i class="ti ti-circle q-circle-icon"></i>
          }
        </button>

        <!-- Question text -->
        <div class="q-text-block" (click)="toggleExpand()">
          <span class="q-num">{{ questionNumber() }}.</span>
          <span
            [class.line-through-text]="isPrepared()"
            [class.text-muted]="isPrepared()"
            [class.text-secondary]="!isPrepared()"
            [innerHTML]="questionText() | highlight: searchFilter()"
          ></span>
        </div>

        <!-- Star toggle -->
        <button
          (click)="toggleStarred.emit()"
          class="btn-icon-bare q-btn-star"
          [title]="isStarred() ? 'Remove star' : 'Star question'"
        >
          @if (isStarred()) {
            <i class="ti ti-star-filled q-star-icon"></i>
          } @else {
            <i class="ti ti-star q-unstar-icon"></i>
          }
        </button>

        <!-- Expand chevron -->
        <button (click)="toggleExpand()" class="btn-icon-bare q-btn-expand">
          <i
            class="ti ti-chevron-down q-chevron"
            [style.transform]="isExpanded() ? 'rotate(180deg)' : 'rotate(0deg)'"
          ></i>
        </button>
      </div>

      <!-- Expandable drawer -->
      @if (isExpanded()) {
        <div class="question-drawer">
          <!-- Notes header -->
          <div class="flex-between">
            <span class="section-label flex-row-center notes-label-row">
              <i class="ti ti-edit-circle notes-edit-icon"></i> My Study Notes
            </span>
            <span class="text-subtle text-monospace flex-row-center notes-saved-label">
              <i class="ti ti-cloud-check notes-autosave-icon"></i> Autosaved
            </span>
          </div>

          <!-- Notes textarea -->
          <textarea
            [value]="notes()"
            (input)="onNotesChange($event)"
            class="notes-textarea"
            placeholder="Write your answer, key points, or code snippets here..."
          ></textarea>

          <!-- Action buttons -->
          <div class="flex-between flex-wrap gap-2">
            <div class="flex-row-center flex-wrap gap-2">
              <button (click)="copyQuestion()" class="btn-action">
                <i
                  class="ti btn-action-icon"
                  [class.ti-copy]="!copied()"
                  [class.ti-check]="copied()"
                  [class.copy-done-icon]="copied()"
                ></i>
                {{ copied() ? 'Copied!' : 'Copy' }}
              </button>

              <a [href]="getDocsLink()" target="_blank" class="btn-action">
                <i class="ti ti-external-link btn-action-icon"></i>
                {{ mode() === 'nodejs' ? 'Node.js Docs' : 'Angular Docs' }}
              </a>

              <a [href]="getGoogleLink()" target="_blank" class="btn-action">
                <i class="ti ti-brand-google btn-action-icon"></i> Google
              </a>
            </div>
            <span class="mark-hint">☑ to mark complete</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .question-card {
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      transition: border-color 0.2s;
    }

    .question-card--prepared {
      border-color: var(--color-success-border) !important;
      background: rgba(16, 185, 129, 0.03) !important;
    }

    .question-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    /* Question text block */
    .q-text-block {
      flex: 1;
      font-size: 0.875rem;
      line-height: 1.6;
      cursor: pointer;
    }

    .q-num {
      font-size: 0.72rem;
      color: var(--color-text-subtle);
      font-family: var(--font-mono);
      margin-right: 6px;
    }

    .line-through-text {
      text-decoration: line-through;
    }

    /* Prepare / star / expand icon sizes */
    .q-check-icon {
      font-size: 18px;
      color: var(--color-success);
    }
    .q-circle-icon {
      font-size: 18px;
      color: var(--color-text-faint);
    }
    .q-star-icon {
      font-size: 15px;
      color: var(--color-warning);
    }
    .q-unstar-icon {
      font-size: 15px;
      color: var(--color-text-faint);
    }
    .q-chevron {
      font-size: 14px;
      transition: transform 0.25s ease;
    }

    /* Small spacing per button type */
    .q-btn-prepare {
      margin-top: 2px;
    }
    .q-btn-star {
      padding: 2px 4px;
    }
    .q-btn-expand {
      padding: 2px 4px;
      color: var(--color-text-faint);
    }

    /* Expandable drawer */
    .question-drawer {
      border-top: 1px solid var(--color-border);
      margin-top: 12px;
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Notes section */
    .notes-textarea {
      width: 100%;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid rgba(63, 63, 70, 0.45);
      background: rgba(9, 9, 11, 0.7);
      color: #d4d4d8;
      font-size: 0.8rem;
      font-family: var(--font-sans);
      line-height: 1.6;
      resize: vertical;
      min-height: 88px;
      outline: none;
      transition: border-color 0.15s;
    }

    .notes-label-row {
      gap: 4px;
      font-size: 0.68rem;
    }
    .notes-edit-icon {
      font-size: 12px;
      color: var(--color-text-muted);
    }
    .notes-saved-label {
      font-size: 0.62rem;
      gap: 4px;
    }
    .notes-autosave-icon {
      color: var(--color-success);
      font-size: 11px;
    }

    /* Action buttons row */
    .btn-action {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 7px 12px;
      border-radius: 8px;
      background: rgba(39, 39, 42, 0.6);
      border: 1px solid rgba(63, 63, 70, 0.45);
      color: #d4d4d8;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: background 0.15s;
      text-decoration: none;
    }
    .btn-action:hover {
      background: rgba(63, 63, 70, 0.8);
    }

    .btn-action-icon {
      color: var(--color-text-muted);
      font-size: 11px;
    }
    .copy-done-icon {
      color: var(--color-success);
    }
    .mark-hint {
      font-size: 0.62rem;
      color: var(--color-text-faint);
      font-family: var(--font-mono);
    }
  `,
})
export class QuestionItemComponent {
  questionText = input.required<string>();
  questionNumber = input.required<number>();
  searchFilter = input<string>('');
  isPrepared = input<boolean>(false);
  isStarred = input<boolean>(false);
  notes = input<string>('');
  mode = input<string>('angular');

  togglePrepared = output<void>();
  toggleStarred = output<void>();
  notesChange = output<string>();

  isExpanded = signal<boolean>(false);
  copied = signal<boolean>(false);

  toggleExpand() {
    this.isExpanded.update((v) => !v);
  }

  onNotesChange(event: Event) {
    this.notesChange.emit((event.target as HTMLTextAreaElement).value);
  }

  copyQuestion() {
    navigator.clipboard.writeText(this.questionText()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  getDocsLink() {
    const q = encodeURIComponent(this.questionText());
    return this.mode() === 'nodejs'
      ? `https://www.google.com/search?q=site%3Anodejs.org+${q}`
      : `https://www.google.com/search?q=site%3Aangular.dev+${q}`;
  }

  getGoogleLink() {
    const prefix = this.mode() === 'nodejs' ? 'Node.js' : 'Angular';
    return `https://www.google.com/search?q=${encodeURIComponent(prefix + ' ' + this.questionText())}`;
  }
}
