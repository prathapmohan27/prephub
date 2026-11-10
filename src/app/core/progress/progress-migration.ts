// One-time migration of saved progress from question-text keys to stable question ids.
//
// Before ids existed, everything was keyed by the exact question text: mastered and starred
// lists, Mock Me ratings, the last question opened per track, and Daily Learning sessions.
// This runs once at startup (and again after restoring an old backup) and rewrites those keys.
// The text -> id table is a separate chunk that is only downloaded when old data is found.

const VERSION_KEY = 'prep_ids_version';
const VERSION = '1';

const LIST_KEYS = ['prep_prepared', 'prep_starred'];
const REVIEWS_KEY = 'prep_mock_reviews';
const LAST_VIEWED_PREFIX = 'prep_last_';
const DAILY_PREFIX = 'daily_session_';

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ownKeys(prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

/** True when there is anything saved that could still be keyed by question text. */
function hasSavedProgress(): boolean {
  const list = (key: string) => {
    const v = readJson(key);
    return Array.isArray(v) && v.length > 0;
  };
  const reviews = readJson(REVIEWS_KEY);
  return (
    LIST_KEYS.some(list) ||
    (!!reviews && typeof reviews === 'object' && Object.keys(reviews).length > 0) ||
    ownKeys(LAST_VIEWED_PREFIX).length > 0 ||
    ownKeys(DAILY_PREFIX).length > 0
  );
}

/** Looks up a question id for a saved value: old text, or already an id. */
function resolver(legacy: Record<string, string>) {
  const ids = new Set(Object.values(legacy));
  return (value: string): string | null => (ids.has(value) ? value : (legacy[value] ?? null));
}

export async function migrateProgressToIds(): Promise<void> {
  try {
    if (localStorage.getItem(VERSION_KEY) === VERSION) return;
    if (!hasSavedProgress()) {
      localStorage.setItem(VERSION_KEY, VERSION);
      return;
    }

    const { LEGACY_QUESTION_IDS } = await import('./legacy-question-ids');
    const toId = resolver(LEGACY_QUESTION_IDS);

    // Mastered and starred: arrays of question text -> arrays of ids
    for (const key of LIST_KEYS) {
      const list = readJson(key);
      if (!Array.isArray(list)) continue;
      const ids = list.map((v) => (typeof v === 'string' ? toId(v) : null)).filter(Boolean);
      writeJson(key, [...new Set(ids)]);
    }

    // Mock Me ratings: { [question text]: review } -> { [id]: review }
    const reviews = readJson(REVIEWS_KEY);
    if (reviews && typeof reviews === 'object') {
      const out: Record<string, unknown> = {};
      for (const [q, review] of Object.entries(reviews)) {
        const id = toId(q);
        if (id) out[id] = review;
      }
      writeJson(REVIEWS_KEY, out);
    }

    // Last question per track: { topic, key: "<category>::<question text>" }
    for (const key of ownKeys(LAST_VIEWED_PREFIX)) {
      const saved = readJson(key) as { topic?: unknown; key?: unknown } | null;
      if (!saved || typeof saved.key !== 'string') continue;
      const sep = saved.key.indexOf('::');
      const id = sep >= 0 ? toId(saved.key.slice(sep + 2)) : null;
      if (id) writeJson(key, { ...saved, key: `${saved.key.slice(0, sep)}::${id}` });
      else localStorage.removeItem(key);
    }

    // Daily Learning sessions: add the id next to each stored question text
    for (const key of ownKeys(DAILY_PREFIX)) {
      const session = readJson(key) as { questions?: { text?: string; id?: string }[] } | null;
      if (!session || !Array.isArray(session.questions)) continue;
      session.questions = session.questions.map((q) => ({
        ...q,
        id: q.id ?? (typeof q.text === 'string' ? (toId(q.text) ?? undefined) : undefined),
      }));
      writeJson(key, session);
    }

    localStorage.setItem(VERSION_KEY, VERSION);
  } catch (e) {
    // Never block the app on a migration problem; progress stays as it was
    console.error('Progress migration failed', e);
  }
}

/** Resolves a `?q=` value from an old shared link (question text) to an id. */
export async function legacyQuestionId(text: string): Promise<string | null> {
  const { LEGACY_QUESTION_IDS } = await import('./legacy-question-ids');
  return LEGACY_QUESTION_IDS[text] ?? null;
}
