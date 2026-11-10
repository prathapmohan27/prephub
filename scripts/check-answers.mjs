// Checks that every question in question-bank.ts has a valid, unique id and a model answer, that
// answer files and short titles are keyed only by existing ids, and that the legacy map is intact.
// Usage: node scripts/check-answers.mjs [category-id-filter]
import fs from 'node:fs';
import ts from 'typescript';

const load = async (file) => {
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText; // type-only imports are elided by the transpiler
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
};

const src = fs.readFileSync('src/app/services/question-bank.ts', 'utf8');
const start = src.indexOf('[', src.indexOf('private categories'));
const categories = eval(src.slice(start, src.indexOf('];\n\n  getCategories') + 1));
const filter = process.argv[2] ?? '';

let missing = 0, orphans = 0, invalid = 0, done = 0, total = 0, badIds = 0;

// Ids: kebab-case and unique across every topic (progress and answers are keyed by them)
const seen = new Map();
for (const cat of categories) {
  for (const q of cat.questions) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(q.id)) { badIds++; console.log(`  bad id (use kebab-case): ${q.id}`); }
    if (seen.has(q.id)) { badIds++; console.log(`  duplicate id "${q.id}" in ${seen.get(q.id)} and ${cat.id}`); }
    seen.set(q.id, cat.id);
    if (typeof q.text !== 'string' || q.text.trim().length < 5) { badIds++; console.log(`  missing text: ${q.id}`); }
  }
}

for (const cat of categories.filter((c) => c.id.includes(filter))) {
  const { answers } = await load(`src/app/services/answers/${cat.id}.ts`);
  const keys = new Set(Object.keys(answers));
  const problems = [];
  for (const q of cat.questions) {
    total++;
    const a = answers[q.id];
    if (!a) { missing++; problems.push(`  missing: ${q.id} (${q.text})`); continue; }
    keys.delete(q.id);
    if (typeof a.summary !== 'string' || a.summary.trim().length < 20 || !Array.isArray(a.details) || a.details.length === 0) {
      invalid++; problems.push(`  invalid (needs summary + details): ${q.id}`);
    } else done++;
  }
  for (const k of keys) { orphans++; problems.push(`  orphan key (no question with this id): ${k}`); }
  const status = problems.length ? '✖' : '✔';
  console.log(`${status} ${cat.id} — ${cat.questions.length - problems.filter((p) => !p.includes('orphan')).length}/${cat.questions.length}`);
  problems.forEach((p) => console.log(p));
}

// Short list titles must point at real questions
const { SHORT_TITLES } = await load('src/app/services/short-titles.ts');
const allIds = new Set(categories.flatMap((c) => c.questions.map((q) => q.id)));
const staleTitles = filter ? [] : Object.keys(SHORT_TITLES).filter((id) => !allIds.has(id));
const untitled = filter ? 0 : [...allIds].filter((id) => !(id in SHORT_TITLES)).length;
staleTitles.forEach((id) => console.log(`  stale short title (no question with this id): ${id}`));
if (untitled) console.log(`  ${untitled} question(s) have no short title (the full text is shown)`);
orphans += staleTitles.length;

// The frozen legacy map may only point at ids that still exist
const { LEGACY_QUESTION_IDS } = await load('src/app/services/legacy-question-ids.ts');
const deadLegacy = filter ? [] : [...new Set(Object.values(LEGACY_QUESTION_IDS))].filter((id) => !allIds.has(id));
deadLegacy.forEach((id) => console.log(`  legacy map points at a removed id: ${id}`));
orphans += deadLegacy.length;

console.log(`\n${done}/${total} answered · ${missing} missing · ${invalid} invalid · ${orphans} orphan keys · ${badIds} id problems`);
process.exit(missing || orphans || invalid || badIds ? 1 : 0);
