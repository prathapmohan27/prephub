import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import type { ContentBlock } from '@services/content-model';
import { AnswerService } from '@services/answer.service';
import { ContentBlocks } from '../content-blocks/content-blocks';
import { RichText } from '../content-blocks/rich-text';

/** Section headings worth a highlighted, shorter chip in the table of contents. */
const KEY_SECTIONS: Record<string, string> = {
  'Follow-up questions interviewers ask': 'Interviewer follow-ups',
  'Common mistakes': 'Common mistakes',
};

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
          @let sections = toc() ? outline(a.details) : [];
          @if (sections.length >= 3) {
            <nav class="ans-toc" aria-label="Sections in this answer">
              @for (sec of sections; track sec.index) {
                <button
                  type="button"
                  class="ans-toc-chip"
                  [class.ans-toc-chip--key]="sec.key"
                  [title]="sec.label"
                  (click)="jumpTo(sec.index)"
                >
                  {{ sec.label }}
                </button>
              }
            </nav>
          }
          <app-content-blocks [blocks]="a.details" [anchors]="toc()" />
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
  /** Stable question id (answers are keyed by id). */
  readonly questionId = input.required<string>();
  /** Show a table of contents built from the answer's headings (used by the reader). */
  readonly toc = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly answers = inject(AnswerService);

  /** Already-loaded answer, shown immediately so prev/next doesn't flash "Loading…". */
  protected readonly cached = computed(() =>
    this.answers.peek(this.categoryId(), this.questionId()),
  );

  /** Headings of the detailed answer, for the table of contents. */
  protected outline(blocks: ContentBlock[]): { index: number; label: string; key: boolean }[] {
    return blocks.flatMap((b, index) => {
      if ((b.type !== 'heading3' && b.type !== 'heading2') || !b.text) return [];
      const label = b.text.replace(/[`*]/g, '').replace(/^\d+\.\s+/, '');
      // The interviewer drill-down sections are the most useful: short labels and a distinct chip
      const short = KEY_SECTIONS[label];
      return [{ index, label: short ?? label, key: !!short }];
    });
  }

  protected jumpTo(index: number) {
    this.host.nativeElement
      .querySelector(`[data-anchor="${index}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected readonly answer = resource({
    params: () => ({ categoryId: this.categoryId(), questionId: this.questionId() }),
    loader: ({ params }) => this.answers.getAnswer(params.categoryId, params.questionId),
  });
}
