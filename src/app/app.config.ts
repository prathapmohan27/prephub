import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  signal,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
} from '@angular/router';
import {
  provideTaiga,
  tuiButtonOptionsProvider,
  tuiTextfieldOptionsProvider,
} from '@taiga-ui/core';

import { routes } from './app.routes';
import { migrateProgressToIds } from '@core/progress/progress-migration';
import { provideAppTheme } from '@core/theme/theme.service';
import { reloadOnChunkError } from '@core/router/chunk-reload';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Taiga UI is the component library. Keep the app's own scrollbar styling (styles.css).
    provideTaiga({ scrollbars: 'native' }),
    // Light / dark comes from ThemeService, not Taiga's own storage
    provideAppTheme(),
    // App-wide defaults: compact controls to match the dense layout. Set the appearance per use.
    tuiButtonOptionsProvider({ size: 's' }),
    tuiTextfieldOptionsProvider({ size: signal('m') }),
    // Saved progress used to be keyed by question text; convert it to ids before any screen reads it
    provideAppInitializer(() => migrateProgressToIds()),
    provideRouter(
      routes,
      // Route params / query params (e.g. :systemId, ?section=) bind to component inputs
      withComponentInputBinding(),
      // Scroll to top on navigation, restore position on browser back/forward
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // A page chunk from an older build can't load (tab open across a deploy): load it fresh
      withNavigationErrorHandler(reloadOnChunkError),
    ),
  ],
};
