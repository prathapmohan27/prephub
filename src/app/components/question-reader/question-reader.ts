import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Highlight } from '@pipes/highlight';
import { Answer } from '../answer/answer';
import { QItem } from '../question-list/question-list';
import { Track, isTrack, trackInfo } from '@services/question';
import { RATINGS, ReviewRating } from '@services/reviews';

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
        @if (senior()) {
          <span class="reader-level" title="Internals, trade-offs, design or production scenario"
            >Senior</span
          >
        }
        <button
          type="button"
          class="reader-practice"
          [class.reader-practice--on]="practice()"
          [attr.aria-pressed]="practice()"
          (click)="togglePractice.emit()"
          [title]="
            practice()
              ? 'Practice mode on: answers stay hidden until you reveal them (P)'
              : 'Practice mode: hide answers until you reveal them (P)'
          "
        >
          <i class="ti" [class.ti-eye-off]="practice()" [class.ti-eye]="!practice()"></i>
          <span class="reader-practice-label">Practice</span>
        </button>
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
        @if (practice() && !revealed()) {
          <div class="reader-recall">
            <i class="ti ti-message-question reader-recall-icon"></i>
            <p class="reader-recall-title">Answer it out loud first</p>
            <p class="reader-recall-text">
              Say your quick answer, then the details you would add. Reveal the model answer to
              compare.
            </p>
            <button type="button" class="reader-recall-btn" (click)="reveal.emit()">
              <i class="ti ti-eye"></i> Reveal answer <kbd>Space</kbd>
            </button>
          </div>
        } @else {
          <app-answer [categoryId]="item().cat.id" [questionId]="item().id" [toc]="true" />
        }
      </div>

      <div class="reader-links">
        <button type="button" (click)="copyQuestion()" class="btn-ghost">
          <i class="ti" [class.ti-copy]="!copied()" [class.ti-check]="copied()"></i>
          {{ copied() ? 'Copied!' : 'Copy question' }}
        </button>
        <a [href]="docsLink()" target="_blank" rel="noopener" class="btn-ghost action-link">
          <i class="ti ti-external-link"></i>
          {{ track().docsLabel }}
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

        <div class="reader-rate" role="group" aria-label="How well did you know it?">
          @for (r of ratings; track r.value) {
            <button
              type="button"
              class="reader-rate-btn"
              [class]="'reader-rate-btn reader-rate-btn--' + r.value"
              [class.reader-rate-btn--on]="rating() === r.value"
              [attr.aria-pressed]="rating() === r.value"
              [title]="r.label + ' (' + r.key + ')' + rateHint[r.value]"
              (click)="rate.emit(r.value)"
            >
              <i [class]="'ti ' + r.icon"></i>
              <span class="reader-rate-label">{{ r.label }}</span>
              <kbd>{{ r.key }}</kbd>
            </button>
          }
        </div>

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
  readonly starred = input(false);
  readonly mode = input<string>('angular');
  /** Practice mode hides the answer until `revealed`. */
  readonly practice = input(false);
  readonly revealed = input(false);
  /** Last self-rating for this question, kept in step with the mastered flag. */
  readonly rating = input<ReviewRating | null>(null);

  readonly prev = output<void>();
  readonly next = output<void>();
  readonly back = output<void>();
  readonly toggleStarred = output<void>();
  readonly showShortcuts = output<void>();
  readonly reveal = output<void>();
  readonly rate = output<ReviewRating>();

  protected readonly ratings = RATINGS;
  protected readonly rateHint: Record<ReviewRating, string> = {
    nailed: ': marks it mastered',
    shaky: ': comes back sooner in Mock Me',
    blanked: ': un-marks it and brings it back first',
  };
  readonly togglePractice = output<void>();

  /** Key of the question last copied, so "Copied!" doesn't carry over to the next question. */
  private readonly copiedKey = signal<string | null>(null);
  protected readonly copied = computed(() => this.copiedKey() === this.item().key);

  protected readonly track = computed(() =>
    trackInfo(isTrack(this.mode()) ? (this.mode() as Track) : 'angular'),
  );

  protected readonly senior = computed(() => this.item().senior);

  protected readonly docsLink = computed(() => {
    const q = encodeURIComponent(this.item().q);
    return `https://www.google.com/search?q=site%3A${this.track().docsSite}+${q}`;
  });

  protected readonly googleLink = computed(() => {
    const query = `${this.track().searchPrefix} ${this.item().q}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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
