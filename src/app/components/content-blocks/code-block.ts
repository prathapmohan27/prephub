import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { highlightCode } from './code-highlight';

@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cb">
      <div class="cb-head">
        <span class="cb-lang">{{ lang() || 'code' }}</span>
        <button type="button" class="cb-copy" (click)="copy()" [attr.aria-label]="'Copy code'">
          <i class="ti" [class.ti-copy]="!copied()" [class.ti-check]="copied()"></i>
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <!-- Plain text first; replaced with highlighted markup once highlight.js loads -->
      <pre class="cb-pre"><code #codeEl class="hljs">{{ code() }}</code></pre>
    </div>
  `,
  styleUrl: './code-block.css',
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly lang = input<string>();

  protected readonly copied = signal(false);
  private readonly codeEl = viewChild.required<ElementRef<HTMLElement>>('codeEl');

  constructor() {
    effect(() => {
      const code = this.code();
      const el = this.codeEl().nativeElement;
      highlightCode(code, this.lang())
        .then((html) => {
          // highlight.js escapes the source, so this markup is safe to inject
          if (code === this.code()) el.innerHTML = html;
        })
        .catch(() => {
          /* keep the plain-text fallback */
        });
    });
  }

  protected copy() {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
