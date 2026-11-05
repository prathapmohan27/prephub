// Validates every Mermaid `flow` block in the learning content.
// Usage: node scripts/check-diagrams.mjs [path-substring-filter]
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
for (const k of [
  'window',
  'document',
  'navigator',
  'Element',
  'HTMLElement',
  'SVGElement',
  'DOMParser',
]) {
  if (!(k in globalThis))
    Object.defineProperty(globalThis, k, {
      value: dom.window[k] ?? dom.window,
      configurable: true,
    });
}
const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false });

const roots = ['src/app/services/core-concepts', 'src/app/services/system-design'];
const filter = process.argv[2] ?? '';
const files = roots
  .flatMap((r) => (fs.existsSync(r) ? fs.readdirSync(r).map((f) => path.join(r, f)) : []))
  .filter((f) => f.endsWith('.ts') && f.includes(filter));

let total = 0,
  failed = 0;
for (const file of files) {
  const src = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const prop = (n) =>
        node.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === n);
      const type = prop('type'),
        code = prop('code');
      if (type && /'flow'/.test(type.initializer.getText()) && code) {
        const init = code.initializer;
        const text = ts.isStringLiteralLike(init) ? init.text : null;
        const line = src.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        total++;
        if (text === null) {
          failed++;
          console.log(`✖ ${file}:${line} code must be a plain string/template literal`);
        } else
          checks.push(
            mermaid.parse(text).catch((e) => {
              failed++;
              console.log(
                `✖ ${file}:${line}\n   ${String(e.message ?? e)
                  .split('\n')
                  .slice(0, 4)
                  .join('\n   ')}`,
              );
            }),
          );
      }
    }
    ts.forEachChild(node, visit);
  };
  const checks = [];
  visit(src);
  await Promise.all(checks);
}
console.log(`\n${total - failed}/${total} diagrams valid across ${files.length} files`);
process.exit(failed ? 1 : 0);
