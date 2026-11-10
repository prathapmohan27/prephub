import { isRecord, readJson, readString, readStringList, writeJson, writeString } from './storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('round-trips JSON', () => {
    expect(writeJson('k', { a: 1 })).toBe(true);
    expect(readJson('k', {})).toEqual({ a: 1 });
  });

  it('falls back on missing, corrupt, null or invalid values', () => {
    expect(readJson('missing', 'fb')).toBe('fb');
    localStorage.setItem('bad', '{not json');
    expect(readJson('bad', 'fb')).toBe('fb');
    localStorage.setItem('null', 'null');
    expect(readJson('null', { x: 1 })).toEqual({ x: 1 });
    localStorage.setItem('arr', '[1]');
    expect(readJson('arr', {}, isRecord)).toEqual({});
  });

  it('keeps only strings in a string list', () => {
    localStorage.setItem('list', JSON.stringify(['a', 1, null, 'b']));
    expect(readStringList('list')).toEqual(['a', 'b']);
    localStorage.setItem('list', '{"a":1}');
    expect(readStringList('list')).toEqual([]);
  });

  it('never throws when storage is blocked or full', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(readString('k')).toBeNull();
    expect(readJson('k', 7)).toBe(7);
    expect(writeString('k', 'v')).toBe(false);
    expect(writeJson('k', {})).toBe(false);
  });
});
