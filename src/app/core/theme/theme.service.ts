import {
  DestroyRef,
  Injectable,
  Provider,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { TUI_DARK_MODE } from '@taiga-ui/core';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'prep_theme';
/** Browser UI colour (address bar on mobile) per theme; matches --color-page-bg. */
const META_COLORS: Record<Theme, string> = { dark: '#09090b', light: '#f5f5f7' };

/**
 * Light / dark theme. Follows the OS setting until the user picks one, then remembers it.
 * index.html sets <html data-theme> before the app boots, so there is no flash on load.
 *
 * It also drives Taiga UI's dark mode (see `provideAppTheme`), so this service stays the only
 * place the theme is stored: Taiga's own `tuiDark` storage key is never used.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = window.matchMedia('(prefers-color-scheme: light)');
  private readonly systemTheme = signal<Theme>(this.media.matches ? 'light' : 'dark');

  readonly preference = signal<ThemePreference>(readPreference());
  readonly theme = computed<Theme>(() => {
    const pref = this.preference();
    return pref === 'system' ? this.systemTheme() : pref;
  });

  /**
   * Taiga UI's `TUI_DARK_MODE` signal, backed by this service. Taiga reads it to put
   * `tuiTheme="dark"` on <body> and on its portals (dropdowns, hints, dialogs).
   */
  readonly darkMode = Object.assign(
    linkedSignal(() => this.theme() === 'dark'),
    {
      set: (dark: boolean) => this.set(dark ? 'dark' : 'light'),
      update: (fn: (dark: boolean) => boolean) =>
        this.set(fn(this.theme() === 'dark') ? 'dark' : 'light'),
      reset: () => this.set('system'),
    },
  );

  constructor() {
    const onSystemChange = (e: MediaQueryListEvent) => {
      this.systemTheme.set(e.matches ? 'light' : 'dark');
      this.apply();
    };
    this.media.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() => this.media.removeEventListener('change', onSystemChange));
    this.apply(false);
  }

  /** Switch to the other theme and remember the choice. */
  toggle() {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(preference: ThemePreference) {
    this.preference.set(preference);
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Preference only; ignore blocked storage
    }
    this.apply();
  }

  private apply(animate = true) {
    const root = document.documentElement;
    const theme = this.theme();
    if (root.dataset['theme'] === theme) return;

    // Fade colours only for a deliberate switch, never on page load
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-switching');
      setTimeout(() => root.classList.remove('theme-switching'), 250);
    }
    root.dataset['theme'] = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[theme]);
  }
}

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Makes Taiga UI follow ThemeService instead of keeping its own dark-mode state. */
export function provideAppTheme(): Provider {
  return { provide: TUI_DARK_MODE, useFactory: () => inject(ThemeService).darkMode };
}
