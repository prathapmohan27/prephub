import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { migrateProgressToIds } from './services/progress-migration';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Saved progress used to be keyed by question text; convert it to ids before any screen reads it
    provideAppInitializer(() => migrateProgressToIds()),
    provideRouter(
      routes,
      // Route params / query params (e.g. :systemId, ?section=) bind to component inputs
      withComponentInputBinding(),
      // Scroll to top on navigation, restore position on browser back/forward
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
