import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { CalloutVariant, ContentBlock } from '@shared/models/content-model';
import { FlowDiagram } from '../flow-diagram/flow-diagram';
import { CodeBlock } from './code-block';
import { RichText } from './rich-text';

const CALLOUT_ICONS: Record<CalloutVariant, string> = {
  info: 'ti-info-circle',
  tip: 'ti-bulb',
  warning: 'ti-alert-triangle',
  important: 'ti-flame',
};

/** Renders a list of content blocks (paragraphs, lists, code, callouts, diagrams). */
@Component({
  selector: 'app-content-blocks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlowDiagram, CodeBlock, RichText],
  template: `
    @for (block of blocks(); track $index) {
      <div class="cbk">
        @switch (block.type) {
          @case ('heading2') {
            <h4 class="cbk-h2" [attr.data-anchor]="anchors() ? $index : null">{{ block.text }}</h4>
          }
          @case ('heading3') {
            <h5 class="cbk-h3" [attr.data-anchor]="anchors() ? $index : null">
              <app-rich-text [text]="block.text ?? ''" />
            </h5>
          }
          @case ('paragraph') {
            <p class="cbk-p"><app-rich-text [text]="block.text ?? ''" /></p>
          }
          @case ('bullets') {
            <ul class="cbk-bullets">
              @for (item of block.items; track $index) {
                <li><app-rich-text [text]="item" /></li>
              }
            </ul>
          }
          @case ('numbered') {
            <ol class="cbk-numbered">
              @for (item of block.items; track $index) {
                <li><app-rich-text [text]="item" /></li>
              }
            </ol>
          }
          @case ('code') {
            @if (block.code) {
              <app-code-block [code]="block.code" [lang]="block.lang" />
            }
          }
          @case ('callout') {
            <div class="cbk-callout" [attr.data-variant]="block.variant ?? 'info'">
              <i [class]="'ti ' + calloutIcon(block.variant) + ' cbk-callout-icon'"></i>
              <span><app-rich-text [text]="block.text ?? ''" /></span>
            </div>
          }
          @case ('flow') {
            @if (block.code) {
              @defer (on viewport; prefetch on idle) {
                <app-flow-diagram
                  [code]="block.code"
                  [title]="block.title"
                  [caption]="block.text"
                />
              } @placeholder {
                <div class="defer-diagram" aria-hidden="true"></div>
              }
            }
          }
          @case ('divider') {
            <hr class="cbk-divider" />
          }
        }
      </div>
    }
  `,
  styleUrl: './content-blocks.css',
})
export class ContentBlocks {
  readonly blocks = input.required<ContentBlock[]>();
  /** Mark headings with `data-anchor="<block index>"` so a table of contents can jump to them. */
  readonly anchors = input(false);

  protected calloutIcon(variant: CalloutVariant | undefined): string {
    return CALLOUT_ICONS[variant ?? 'info'];
  }
}
