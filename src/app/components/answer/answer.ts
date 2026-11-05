import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import { AnswerService } from '@services/answer.service';
import { ContentBlocks } from '../content-blocks/content-blocks';
import { RichText } from '../content-blocks/rich-text';

/** Shows the model answer for a question: a short interview answer, then the detailed explanation. */
@Component({
  selector: 'app-answer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContentBlocks, RichText],
  template: `
    @let ready = cached();
    @if (ready === undefined && answer.isLoading()) {
      <div class="ans-loading" aria-live="polite">
        <i class="ti ti-loader-2 ans-spin"></i> Loading answer…
      </div>
    } @else if (ready === undefined && answer.error()) {
      <div class="ans-empty">
        <i class="ti ti-wifi-off"></i>
        <span>Couldn't load the answer.</span>
        <button type="button" class="ans-retry" (click)="answer.reload()">Try again</button>
      </div>
    } @else if (ready !== undefined ? ready : answer.value(); as a) {
      <section class="ans-quick" aria-label="Quick answer">
        <span class="ans-label"><i class="ti ti-bolt"></i> Quick answer</span>
        <p class="ans-summary"><app-rich-text [text]="a.summary" /></p>
      </section>

      @if (a.details.length) {
        <section class="ans-details" aria-label="Detailed explanation">
          <span class="ans-label ans-label--muted"
            ><i class="ti ti-book-2"></i> Detailed explanation</span
          >
          <app-content-blocks [blocks]="a.details" />
        </section>
      }
    } @else {
      <div class="ans-empty">
        <i class="ti ti-hourglass"></i>
        <span>An answer for this question hasn't been written yet.</span>
      </div>
    }
  `,
  styleUrl: './answer.css',
})
export class Answer {
  readonly categoryId = input.required<string>();
  readonly question = input.required<string>();

  private readonly answers = inject(AnswerService);

  /** Already-loaded answer, shown immediately so prev/next doesn't flash "Loading…". */
  protected readonly cached = computed(() => this.answers.peek(this.categoryId(), this.question()));

  protected readonly answer = resource({
    params: () => ({ categoryId: this.categoryId(), question: this.question() }),
    loader: ({ params }) => this.answers.getAnswer(params.categoryId, params.question),
  });
}
