// Backup and restore for everything PrepHub keeps in localStorage.
// Progress has no server copy, so clearing site data would otherwise lose it.

/** Keys owned by PrepHub. The origin (github.io) is shared with other sites, so never export everything. */
const PREFIXES = ['prep_', 'daily_'];
const EXACT = new Set(['core_concepts_progress', 'sd_progress']);
const FORMAT = 'prephub-progress';

const isOwnKey = (key: string) => EXACT.has(key) || PREFIXES.some((p) => key.startsWith(p));

interface BackupFile {
  format: typeof FORMAT;
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
}

/** Downloads a JSON file with all PrepHub progress and preferences. */
export function exportProgress(): void {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isOwnKey(key)) data[key] = localStorage.getItem(key) ?? '';
  }
  const backup: BackupFile = {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prephub-progress-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  // Revoking synchronously can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Restores a backup made by `exportProgress()`, replacing current PrepHub data.
 * Returns the number of keys restored; throws with a readable message on an invalid file.
 */
export async function importProgress(file: File): Promise<number> {
  let parsed: Partial<BackupFile>;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (parsed?.format !== FORMAT || typeof parsed.data !== 'object' || parsed.data === null) {
    throw new Error('That file is not a PrepHub progress backup.');
  }
  const entries = Object.entries(parsed.data).filter(
    ([key, value]) => isOwnKey(key) && typeof value === 'string',
  );
  // Replace rather than merge, so the restored state matches the backup exactly
  const existing: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isOwnKey(key)) existing.push(key);
  }
  existing.forEach((key) => localStorage.removeItem(key));
  entries.forEach(([key, value]) => localStorage.setItem(key, value as string));
  return entries.length;
}
