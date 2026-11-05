import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Segment {
  kind: 'text' | 'code' | 'bold';
  value: string;
}

/** Splits text into plain, `inline code` and **bold** segments. No HTML is ever injected. */
export function toSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) segments.push({ kind: 'text', value: text.slice(last, match.index) });
    segments.push(
      match[1] !== undefined
        ? { kind: 'code', value: match[1] }
        : { kind: 'bold', value: match[2] },
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ kind: 'text', value: text.slice(last) });
  return segments;
}

@Component({
  selector: 'app-rich-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (s of segments(); track $index) {
    @switch (s.kind) {
      @case ('code') {
        <code class="rt-code">{{ s.value }}</code>
      }
      @case ('bold') {
        <strong class="rt-bold">{{ s.value }}</strong>
      }
      @default {
        {{ s.value }}
      }
    }
  }`,
  styles: `
    :host {
      display: contents;
    }
    .rt-code {
      padding: 1px 5px;
      border-radius: 4px;
      background: rgb(var(--n-700) / 0.55);
      border: 1px solid rgb(var(--n-600) / 0.5);
      font: 500 0.88em var(--font-mono);
      color: var(--t-purple-200);
      white-space: break-spaces;
    }
    .rt-bold {
      font-weight: 700;
      color: var(--color-text-primary);
    }
  `,
})
export class RichText {
  readonly text = input.required<string>();
  protected readonly segments = computed(() => toSegments(this.text()));
}
