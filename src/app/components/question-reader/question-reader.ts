import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Highlight } from '@pipes/highlight';
import { Answer } from '../answer/answer';
import { QItem } from '../question-list/question-list';

/** Reading pane for the selected question: answer, mastered/star toggles and prev/next navigation. */
@Component({
  selector: 'app-question-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Highlight, Answer],
  template: `
    <article class="glass-panel reader" [style.--reader-accent]="item().cat.color">
      <div class="reader-top">
        <button type="button" class="btn-ghost reader-back" (click)="back.emit()">
          <i class="ti ti-arrow-left"></i> Questions
        </button>
        <span
          class="reader-cat"
          [style.color]="item().cat.color"
          [style.background]="item().cat.color + '18'"
        >
          <i [class]="'ti ' + item().cat.icon"></i>
          {{ item().cat.title }}
        </span>
        <span class="reader-pos">{{ position() }} / {{ total() }}</span>
      </div>

      <div class="reader-head">
        <h2 class="reader-q">
          <span [innerHTML]="item().q | highlight: ''"></span>
        </h2>
        <button
          type="button"
          class="reader-star"
          [class.reader-star--on]="starred()"
          (click)="toggleStarred.emit()"
          [title]="starred() ? 'Remove star (S)' : 'Star question (S)'"
          [attr.aria-pressed]="starred()"
        >
          <i class="ti" [class.ti-star-filled]="starred()" [class.ti-star]="!starred()"></i>
        </button>
      </div>

      <div class="reader-body">
        <app-answer [categoryId]="item().cat.id" [question]="item().q" />
      </div>

      <div class="reader-links">
        <button type="button" (click)="copyQuestion()" class="btn-ghost">
          <i class="ti" [class.ti-copy]="!copied()" [class.ti-check]="copied()"></i>
          {{ copied() ? 'Copied!' : 'Copy question' }}
        </button>
        <a [href]="docsLink()" target="_blank" rel="noopener" class="btn-ghost action-link">
          <i class="ti ti-external-link"></i>
          {{ mode() === 'nodejs' ? 'Node.js Docs' : 'Angular Docs' }}
        </a>
        <a [href]="googleLink()" target="_blank" rel="noopener" class="btn-ghost action-link">
          <i class="ti ti-brand-google"></i> Google
        </a>
        <button
          type="button"
          class="btn-ghost reader-shortcuts"
          (click)="showShortcuts.emit()"
          title="Keyboard shortcuts (?)"
        >
          <i class="ti ti-keyboard"></i> Shortcuts <kbd>?</kbd>
        </button>
      </div>

      <!-- Sticky footer: move through questions without scrolling back up -->
      <div class="reader-nav">
        <button
          type="button"
          class="reader-nav-btn"
          [disabled]="position() <= 1"
          (click)="prev.emit()"
          title="Previous question (K or ←)"
        >
          <i class="ti ti-chevron-left"></i>
          <span class="reader-nav-label">Prev</span>
          <kbd>K</kbd>
        </button>

        <button
          type="button"
          class="reader-done"
          [class.reader-done--on]="prepared()"
          (click)="togglePrepared.emit()"
          title="Toggle mastered (M)"
          [attr.aria-pressed]="prepared()"
        >
          <i class="ti" [class.ti-circle-check]="prepared()" [class.ti-circle]="!prepared()"></i>
          {{ prepared() ? 'Mastered' : 'Mark mastered' }}
          <kbd>M</kbd>
        </button>

        <button
          type="button"
          class="reader-nav-btn reader-nav-btn--next"
          [disabled]="position() >= total()"
          (click)="next.emit()"
          title="Next question (J or →)"
        >
          <kbd>J</kbd>
          <span class="reader-nav-label">Next</span>
          <i class="ti ti-chevron-right"></i>
        </button>
      </div>
    </article>
  `,
  styleUrl: './question-reader.css',
})
export class QuestionReader {
  readonly item = input.required<QItem>();
  readonly position = input.required<number>();
  readonly total = input.required<number>();
  readonly prepared = input(false);
  readonly starred = input(false);
  readonly mode = input<string>('angular');

  readonly prev = output<void>();
  readonly next = output<void>();
  readonly back = output<void>();
  readonly togglePrepared = output<void>();
  readonly toggleStarred = output<void>();
  readonly showShortcuts = output<void>();

  /** Key of the question last copied, so "Copied!" doesn't carry over to the next question. */
  private readonly copiedKey = signal<string | null>(null);
  protected readonly copied = computed(() => this.copiedKey() === this.item().key);

  protected readonly docsLink = computed(() => {
    const q = encodeURIComponent(this.item().q);
    return this.mode() === 'nodejs'
      ? `https://www.google.com/search?q=site%3Anodejs.org+${q}`
      : `https://www.google.com/search?q=site%3Aangular.dev+${q}`;
  });

  protected readonly googleLink = computed(() => {
    const prefix = this.mode() === 'nodejs' ? 'Node.js' : 'Angular';
    return `https://www.google.com/search?q=${encodeURIComponent(prefix + ' ' + this.item().q)}`;
  });

  copyQuestion() {
    const key = this.item().key;
    navigator.clipboard.writeText(this.item().q).then(() => {
      this.copiedKey.set(key);
      setTimeout(() => {
        if (this.copiedKey() === key) this.copiedKey.set(null);
      }, 2000);
    });
  }
}
