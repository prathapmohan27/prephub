// Checks that every question in question.ts has a model answer, and that answer files
// only contain keys that exactly match a question (a typo would silently orphan an answer).
// Usage: node scripts/check-answers.mjs [category-id-filter]
import fs from 'node:fs';
import ts from 'typescript';

const load = async (file) => {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText; // type-only imports are elided by the transpiler
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
};

const src = fs.readFileSync('src/app/services/question.ts', 'utf8');
const start = src.indexOf('[', src.indexOf('private categories'));
const categories = eval(src.slice(start, src.indexOf('];\n\n  getCategories') + 1));
const filter = process.argv[2] ?? '';

let missing = 0, orphans = 0, invalid = 0, done = 0, total = 0;
for (const cat of categories.filter((c) => c.id.includes(filter))) {
  const { answers } = await load(`src/app/services/answers/${cat.id}.ts`);
  const keys = new Set(Object.keys(answers));
  const problems = [];
  for (const q of cat.questions) {
    total++;
    const a = answers[q];
    if (!a) { missing++; problems.push(`  missing: ${q}`); continue; }
    keys.delete(q);
    if (typeof a.summary !== 'string' || a.summary.trim().length < 20 || !Array.isArray(a.details) || a.details.length === 0) {
      invalid++; problems.push(`  invalid (needs summary + details): ${q}`);
    } else done++;
  }
  for (const k of keys) { orphans++; problems.push(`  orphan key (no matching question): ${k}`); }
  const status = problems.length ? '✖' : '✔';
  console.log(`${status} ${cat.id} — ${cat.questions.length - problems.filter((p) => !p.includes('orphan')).length}/${cat.questions.length}`);
  problems.forEach((p) => console.log(p));
}
// Short list titles must point at real questions (a reworded question would orphan its title)
const { SHORT_TITLES } = await load('src/app/services/short-titles.ts');
const allQuestions = new Set(categories.flatMap((c) => c.questions));
const staleTitles = filter ? [] : Object.keys(SHORT_TITLES).filter((q) => !allQuestions.has(q));
const untitled = filter ? 0 : [...allQuestions].filter((q) => !(q in SHORT_TITLES)).length;
staleTitles.forEach((q) => console.log(`  stale short title (no matching question): ${q}`));
if (untitled) console.log(`  ${untitled} question(s) have no short title (the full text is shown)`);
orphans += staleTitles.length;

console.log(`\n${done}/${total} answered · ${missing} missing · ${invalid} invalid · ${orphans} orphan keys`);
process.exit(missing || orphans || invalid ? 1 : 0);
