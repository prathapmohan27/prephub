import { Component, input, output, signal } from '@angular/core';
import { HighlightPipe } from '../pipes/highlight.pipe';

@Component({
  selector: 'app-question-item',
  imports: [HighlightPipe],
  template: `
    <div
      class="glass-card"
      style="border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:0;transition:border-color 0.2s;"
      [style.borderColor]="isPrepared() ? 'rgba(16,185,129,0.3)' : 'rgba(63,63,70,0.22)'"
      [style.background]="isPrepared() ? 'rgba(16,185,129,0.03)' : 'rgba(39,39,42,0.35)'"
    >
      <!-- Question row -->
      <div style="display:flex;align-items:flex-start;gap:10px;">

        <!-- Prepared toggle -->
        <button
          (click)="togglePrepared.emit()"
          style="margin-top:2px;flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;line-height:1;"
          [title]="isPrepared() ? 'Mark as unprepared' : 'Mark as prepared'"
        >
          @if (isPrepared()) {
            <i class="ti ti-circle-check-filled" style="font-size:18px;color:#10b981;"></i>
          } @else {
            <i class="ti ti-circle" style="font-size:18px;color:#52525b;"></i>
          }
        </button>

        <!-- Question text -->
        <div
          style="flex:1;font-size:0.875rem;line-height:1.6;cursor:pointer;"
          (click)="toggleExpand()"
        >
          <span style="font-size:0.72rem;color:#71717a;font-family:monospace;margin-right:6px;">{{ questionNumber() }}.</span>
          <span
            [class.line-through-text]="isPrepared()"
            [style.color]="isPrepared() ? '#71717a' : '#e4e4e7'"
            [innerHTML]="questionText() | highlight: searchFilter()"
          ></span>
        </div>

        <!-- Star toggle -->
        <button
          (click)="toggleStarred.emit()"
          style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1;"
          [title]="isStarred() ? 'Remove star' : 'Star question'"
        >
          @if (isStarred()) {
            <i class="ti ti-star-filled" style="font-size:15px;color:#f59e0b;"></i>
          } @else {
            <i class="ti ti-star" style="font-size:15px;color:#52525b;"></i>
          }
        </button>

        <!-- Expand chevron -->
        <button
          (click)="toggleExpand()"
          style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1;color:#52525b;"
        >
          <i
            class="ti ti-chevron-down"
            style="font-size:14px;transition:transform 0.25s ease;"
            [style.transform]="isExpanded() ? 'rotate(180deg)' : 'rotate(0deg)'"
          ></i>
        </button>
      </div>

      <!-- Expandable drawer -->
      @if (isExpanded()) {
        <div style="border-top:1px solid rgba(63,63,70,0.3);margin-top:12px;padding-top:14px;display:flex;flex-direction:column;gap:12px;">

          <!-- Notes label -->
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.68rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;display:flex;align-items:center;gap:4px;">
              <i class="ti ti-edit-circle" style="font-size:12px;color:#a1a1aa;"></i> My Study Notes
            </span>
            <span style="font-size:0.62rem;color:#52525b;display:flex;align-items:center;gap:4px;font-family:monospace;">
              <i class="ti ti-cloud-check" style="color:#10b981;font-size:11px;"></i> Autosaved
            </span>
          </div>

          <!-- Notes textarea -->
          <textarea
            [value]="notes()"
            (input)="onNotesChange($event)"
            placeholder="Write your answer, key points, or code snippets here..."
            style="width:100%;padding:12px 14px;border-radius:8px;border:1px solid rgba(63,63,70,0.45);background:rgba(9,9,11,0.7);color:#d4d4d8;font-size:0.8rem;font-family:'Inter',sans-serif;line-height:1.6;resize:vertical;min-height:88px;outline:none;transition:border-color 0.15s;"
          ></textarea>

          <!-- Action buttons -->
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button
                (click)="copyQuestion()"
                style="display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;background:rgba(39,39,42,0.6);border:1px solid rgba(63,63,70,0.45);color:#d4d4d8;font-size:0.72rem;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:background 0.15s;"
              >
                <i class="ti" [class.ti-copy]="!copied()" [class.ti-check]="copied()" [style.color]="copied() ? '#10b981' : 'inherit'"></i>
                {{ copied() ? 'Copied!' : 'Copy' }}
              </button>

              <a
                [href]="getAngularDocsLink()"
                target="_blank"
                style="display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;background:rgba(39,39,42,0.6);border:1px solid rgba(63,63,70,0.45);color:#d4d4d8;font-size:0.72rem;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;text-decoration:none;"
              >
                <i class="ti ti-external-link" style="color:#a1a1aa;font-size:11px;"></i> Angular Docs
              </a>

              <a
                [href]="getGoogleLink()"
                target="_blank"
                style="display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;background:rgba(39,39,42,0.6);border:1px solid rgba(63,63,70,0.45);color:#d4d4d8;font-size:0.72rem;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;text-decoration:none;"
              >
                <i class="ti ti-brand-google" style="color:#a1a1aa;font-size:11px;"></i> Google
              </a>
            </div>
            <span style="font-size:0.62rem;color:#52525b;font-family:monospace;">☑ to mark complete</span>
          </div>

        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .line-through-text { text-decoration: line-through; }
    `,
  ],
})
export class QuestionItemComponent {
  questionText = input.required<string>();
  questionNumber = input.required<number>();
  searchFilter = input<string>('');
  isPrepared = input<boolean>(false);
  isStarred = input<boolean>(false);
  notes = input<string>('');

  togglePrepared = output<void>();
  toggleStarred = output<void>();
  notesChange = output<string>();

  isExpanded = signal<boolean>(false);
  copied = signal<boolean>(false);

  toggleExpand() { this.isExpanded.update((v) => !v); }

  onNotesChange(event: Event) {
    this.notesChange.emit((event.target as HTMLTextAreaElement).value);
  }

  copyQuestion() {
    navigator.clipboard.writeText(this.questionText()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  getAngularDocsLink() {
    return `https://www.google.com/search?q=site%3Aangular.dev+${encodeURIComponent(this.questionText())}`;
  }

  getGoogleLink() {
    return `https://www.google.com/search?q=${encodeURIComponent('Angular ' + this.questionText())}`;
  }
}
