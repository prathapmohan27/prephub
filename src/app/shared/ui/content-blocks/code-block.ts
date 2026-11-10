import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { highlightCode } from './code-highlight';

@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton],
  // Code stays dark in both themes, so Taiga components inside use the dark palette too
  host: { tuiTheme: 'dark' },
  template: `
    <div class="cb">
      <div class="cb-head">
        <span class="cb-lang">{{ lang() || 'code' }}</span>
        <button
          tuiButton
          type="button"
          size="xs"
          appearance="flat-grayscale"
          class="cb-copy"
          [iconStart]="copied() ? '@tui.check' : '@tui.copy'"
          (click)="copy()"
          aria-label="Copy code"
        >
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
    // Clipboard is missing on insecure origins and rejects without permission or focus
    navigator.clipboard
      ?.writeText(this.code())
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(() => undefined);
  }
}
