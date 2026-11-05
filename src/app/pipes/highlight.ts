import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Wraps every case-insensitive occurrence of `filter` in <mark>; input must be plain text. */
function markMatches(text: string, filter: string): string {
  if (!filter) return escapeHtml(text);
  const lowerText = text.toLowerCase();
  const lowerFilter = filter.toLowerCase();
  let out = '';
  let from = 0;
  for (
    let idx = lowerText.indexOf(lowerFilter);
    idx !== -1;
    idx = lowerText.indexOf(lowerFilter, from)
  ) {
    out += escapeHtml(text.slice(from, idx));
    out += `<mark class="bg-yellow-300 text-gray-900 rounded px-0.5">${escapeHtml(text.slice(idx, idx + filter.length))}</mark>`;
    from = idx + filter.length;
  }
  return out + escapeHtml(text.slice(from));
}

/**
 * Renders question text as safe HTML: `backtick` spans become inline code and
 * matches of the search filter are highlighted. All text is HTML-escaped first.
 */
@Pipe({
  name: 'highlight',
})
export class Highlight implements PipeTransform {
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  transform(text: string, filter: string): SafeHtml {
    if (!text) return '';
    const filterText = filter?.trim() ?? '';
    const parts = text.split('`');
    // An unmatched trailing backtick is kept as a literal character
    if (parts.length % 2 === 0) parts.push(`\`${parts.pop()}`);
    // Odd indexes are the parts that were inside backticks
    const html = parts
      .map((part, i) =>
        i % 2 === 1
          ? `<code class="q-code">${markMatches(part, filterText)}</code>`
          : markMatches(part, filterText),
      )
      .join('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
