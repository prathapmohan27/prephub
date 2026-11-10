import type { HLJSApi } from 'highlight.js';

const ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  html: 'xml',
  angular: 'xml',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  docker: 'dockerfile',
  text: 'plaintext',
};

let hljsPromise: Promise<HLJSApi> | null = null;

/** Loads highlight.js core with only the languages the answers use (~40 kB, lazy). */
function loadHljs(): Promise<HLJSApi> {
  hljsPromise ??= Promise.all([
    import('highlight.js/lib/core'),
    import('highlight.js/lib/languages/typescript'),
    import('highlight.js/lib/languages/javascript'),
    import('highlight.js/lib/languages/xml'),
    import('highlight.js/lib/languages/css'),
    import('highlight.js/lib/languages/scss'),
    import('highlight.js/lib/languages/json'),
    import('highlight.js/lib/languages/sql'),
    import('highlight.js/lib/languages/bash'),
    import('highlight.js/lib/languages/yaml'),
    import('highlight.js/lib/languages/dockerfile'),
    import('highlight.js/lib/languages/plaintext'),
  ]).then(([core, ts, js, xml, css, scss, json, sql, bash, yaml, dockerfile, plaintext]) => {
    const hljs = core.default;
    hljs.registerLanguage('typescript', ts.default);
    hljs.registerLanguage('javascript', js.default);
    hljs.registerLanguage('xml', xml.default);
    hljs.registerLanguage('css', css.default);
    hljs.registerLanguage('scss', scss.default);
    hljs.registerLanguage('json', json.default);
    hljs.registerLanguage('sql', sql.default);
    hljs.registerLanguage('bash', bash.default);
    hljs.registerLanguage('yaml', yaml.default);
    hljs.registerLanguage('dockerfile', dockerfile.default);
    hljs.registerLanguage('plaintext', plaintext.default);
    return hljs;
  });
  return hljsPromise;
}

/** Returns highlighted, HTML-escaped markup for `code`. */
export async function highlightCode(code: string, lang = 'plaintext'): Promise<string> {
  const hljs = await loadHljs();
  const language = ALIASES[lang] ?? lang;
  return hljs.getLanguage(language)
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : hljs.highlightAuto(code).value;
}
