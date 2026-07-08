import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
})
export class Highlight implements PipeTransform {
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  transform(text: string, filter: string): SafeHtml {
    if (!filter || !text) return text;
    const lc = filter.toLowerCase();
    const idx = text.toLowerCase().indexOf(lc);
    if (idx === -1) return text;

    const before = text.slice(0, idx);
    const highlighted = text.slice(idx, idx + lc.length);
    const after = text.slice(idx + lc.length);

    const html = `${before}<mark class="bg-yellow-300 text-gray-900 rounded px-0.5">${highlighted}</mark>${after}`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
