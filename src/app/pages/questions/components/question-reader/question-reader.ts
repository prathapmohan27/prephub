import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { Highlight } from '@shared/pipes/highlight';
import { Answer } from '@features/questions/components/answer/answer';
import { QItem } from '../question-list/question-list';
import { Track, isTrack, trackInfo } from '@features/questions/question';
import { RATINGS, ReviewRating } from '@features/questions/reviews';

/** Reading pane for the selected question: answer, mastered/star toggles and prev/next navigation. */
@Component({
  selector: 'app-question-reader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Highlight, Answer, TuiBadge, TuiButton],
  template: `
    <article class="glass-panel reader" [style.--reader-accent]="item().cat.color">
      <div class="reader-top">
        <button
          tuiButton
          type="button"
          appearance="secondary-grayscale"
          iconStart="@tui.arrow-left"
          class="reader-back"
          (click)="back.emit()"
        >
          Questions
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
          <span
            tuiBadge
            appearance="info"
            class="reader-level"
            title="Internals, trade-offs, design or production scenario"
            >Senior</span
          >
        }
        <button
          tuiButton
          type="button"
          size="xs"
          appearance="outline-grayscale"
          class="reader-practice"
          [iconStart]="practice() ? '@tui.eye-off' : '@tui.eye'"
          [tuiAppearanceMode]="practice() ? 'checked' : null"
          [attr.aria-pressed]="practice()"
          (click)="togglePractice.emit()"
          [title]="
            practice()
              ? 'Practice mode on: answers stay hidden until you reveal them (P)'
              : 'Practice mode: hide answers until you reveal them (P)'
          "
        >
          <span class="reader-practice-label">Practice</span>
        </button>
        <span class="reader-pos">{{ position() }} / {{ total() }}</span>
      </div>

      <div class="reader-head">
        <h2 class="reader-q">
          <span [innerHTML]="item().q | highlight: ''"></span>
        </h2>
        <button
          tuiIconButton
          type="button"
          class="reader-star"
          [appearance]="starred() ? 'warning' : 'outline-grayscale'"
          [iconStart]="starred() ? '@tui.star-filled' : '@tui.star'"
          (click)="toggleStarred.emit()"
          [title]="starred() ? 'Remove star (S)' : 'Star question (S)'"
          [attr.aria-pressed]="starred()"
        >
          {{ starred() ? 'Remove star' : 'Star question' }}
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
            <button
              tuiButton
              type="button"
              appearance="primary"
              iconStart="@tui.eye"
              (click)="reveal.emit()"
            >
              Reveal answer <kbd>Space</kbd>
            </button>
          </div>
        } @else {
          <app-answer [categoryId]="item().cat.id" [questionId]="item().id" [toc]="true" />
        }
      </div>

      <div class="reader-links">
        <button
          tuiButton
          type="button"
          appearance="secondary-grayscale"
          [iconStart]="copied() ? '@tui.check' : '@tui.copy'"
          (click)="copyQuestion()"
        >
          {{ copied() ? 'Copied!' : 'Copy question' }}
        </button>
        <a
          tuiButton
          appearance="secondary-grayscale"
          iconStart="@tui.external-link"
          target="_blank"
          rel="noopener"
          [href]="docsLink()"
        >
          {{ track().docsLabel }}
        </a>
        <a
          tuiButton
          appearance="secondary-grayscale"
          iconStart="@tui.search"
          target="_blank"
          rel="noopener"
          [href]="googleLink()"
        >
          Google
        </a>
        <button
          tuiButton
          type="button"
          appearance="secondary-grayscale"
          iconStart="@tui.keyboard"
          class="reader-shortcuts"
          (click)="showShortcuts.emit()"
          title="Keyboard shortcuts (?)"
        >
          Shortcuts <kbd>?</kbd>
        </button>
      </div>

      <!-- Sticky footer: move through questions without scrolling back up -->
      <div class="reader-nav">
        <button
          tuiButton
          type="button"
          appearance="secondary-grayscale"
          iconStart="@tui.chevron-left"
          [disabled]="position() <= 1"
          (click)="prev.emit()"
          title="Previous question (K or ←)"
        >
          <span class="reader-nav-label">Prev</span>
          <kbd>K</kbd>
        </button>

        <div class="reader-rate" role="group" aria-label="How well did you know it?">
          @for (r of ratings; track r.value) {
            <button
              tuiButton
              type="button"
              [appearance]="rating() === r.value ? rateAppearance[r.value] : 'outline-grayscale'"
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
          tuiButton
          type="button"
          appearance="secondary-grayscale"
          iconEnd="@tui.chevron-right"
          [disabled]="position() >= total()"
          (click)="next.emit()"
          title="Next question (J or →)"
        >
          <kbd>J</kbd>
          <span class="reader-nav-label">Next</span>
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
  /** Taiga status appearance for the selected rating (same colours as Mock Me). */
  protected readonly rateAppearance: Record<ReviewRating, string> = {
    nailed: 'positive',
    shaky: 'warning',
    blanked: 'negative',
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
    // Clipboard is missing on insecure origins and rejects without permission or focus
    navigator.clipboard
      ?.writeText(this.item().q)
      .then(() => {
        this.copiedKey.set(key);
        setTimeout(() => {
          if (this.copiedKey() === key) this.copiedKey.set(null);
        }, 2000);
      })
      .catch(() => undefined);
  }
}
