// Recovers from lazy-route chunks that can no longer be loaded.
//
// Every build gives the lazy chunks new file names. A tab opened before a deploy (or a dev
// rebuild) still asks for the old names, the import fails, and the router silently cancels the
// navigation: the click "does nothing". Loading the target URL as a full page fetches the
// current index.html and chunk names. If that load fails too (really offline), don't loop.

import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { NavigationError } from '@angular/router';

const RETRY_KEY = 'prep_chunk_reload';
/** A second failure for the same URL within this window is a real outage: stop reloading. */
const RETRY_WINDOW_MS = 10_000;

/** Chrome, Safari and Firefox word a failed dynamic import differently. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    message,
  );
}

/** True when `url` wasn't already reloaded for a chunk failure within the retry window. */
export function claimReload(url: string, now = Date.now()): boolean {
  try {
    const last = JSON.parse(sessionStorage.getItem(RETRY_KEY) ?? 'null') as {
      url?: string;
      at?: number;
    } | null;
    if (last?.url === url && typeof last.at === 'number' && now - last.at < RETRY_WINDOW_MS) {
      return false;
    }
    sessionStorage.setItem(RETRY_KEY, JSON.stringify({ url, at: now }));
    return true;
  } catch {
    // Without storage there is no loop guard, so don't risk reloading
    return false;
  }
}

/** For `withNavigationErrorHandler`: runs in an injection context. */
export function reloadOnChunkError(event: NavigationError): void {
  if (!isChunkLoadError(event.error) || !claimReload(event.url)) return;
  // prepareExternalUrl adds the base href (e.g. /prephub/ on GitHub Pages)
  location.assign(inject(Location).prepareExternalUrl(event.url));
}
