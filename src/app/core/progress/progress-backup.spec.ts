import { importProgress } from './progress-backup';

const file = (content: unknown) =>
  new File([typeof content === 'string' ? content : JSON.stringify(content)], 'backup.json');

describe('importProgress', () => {
  beforeEach(() => localStorage.clear());

  it('rejects files that are not PrepHub backups', async () => {
    await expect(importProgress(file('nope'))).rejects.toThrow('not valid JSON');
    await expect(importProgress(file({ data: {} }))).rejects.toThrow('not a PrepHub');
  });

  it('replaces PrepHub keys only, ignoring foreign and non-string entries', async () => {
    localStorage.setItem('prep_old', 'x');
    localStorage.setItem('other_site', 'keep');
    const count = await importProgress(
      file({
        format: 'prephub-progress',
        version: 1,
        exportedAt: '',
        data: { prep_starred: '["a"]', sd_progress: '{}', evil_key: 'x', prep_num: 5 },
      }),
    );
    expect(count).toBe(2);
    expect(localStorage.getItem('prep_old')).toBeNull();
    expect(localStorage.getItem('other_site')).toBe('keep');
    expect(localStorage.getItem('evil_key')).toBeNull();
    expect(localStorage.getItem('prep_starred')).toBe('["a"]');
  });
});
