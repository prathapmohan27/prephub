import { claimReload, isChunkLoadError } from './chunk-reload';

describe('chunk reload', () => {
  beforeEach(() => sessionStorage.clear());

  it('recognises failed dynamic imports in each browser', () => {
    expect(
      isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: x.js')),
    ).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot match any routes'))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });

  it('reloads a URL once, then not again within the retry window', () => {
    expect(claimReload('/system-design', 1_000)).toBe(true);
    expect(claimReload('/system-design', 5_000)).toBe(false);
    expect(claimReload('/core-concepts', 5_000)).toBe(true);
    expect(claimReload('/core-concepts', 20_000)).toBe(true);
  });
});
