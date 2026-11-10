import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { Highlight } from './highlight';

describe('Highlight pipe', () => {
  const render = (text: string, filter = '') => {
    const pipe = TestBed.runInInjectionContext(() => new Highlight());
    const sanitizer = TestBed.inject(DomSanitizer);
    // Unwrap the trusted value to inspect the produced markup
    const out = pipe.transform(text, filter);
    return typeof out === 'string' ? out : (sanitizer.sanitize(1, out) ?? '');
  };

  it('escapes HTML in question text and search terms', () => {
    const html = render('<img src=x onerror=alert(1)> `<b>`', '<img');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;img');
  });

  it('turns backtick spans into inline code and marks matches', () => {
    const html = render('Use `ngOnInit` here', 'init');
    expect(html).toContain('<code class="q-code">ngOn<mark');
    expect(html).toContain('>Init</mark></code>');
  });

  it('keeps an unmatched backtick as text', () => {
    expect(render('a ` b')).toBe('a ` b');
  });
});
