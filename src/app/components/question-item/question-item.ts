import { Component, input, output, signal } from '@angular/core';
import { Highlight } from '@pipes/highlight';

@Component({
  selector: 'app-question-item',
  imports: [Highlight],
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
        <div
          class="q-text-block"
          role="button"
          tabindex="0"
          (click)="toggleExpand()"
          (keydown.enter)="toggleExpand()"
        >
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
  styleUrl: './question-item.css',
})
export class QuestionItem {
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
