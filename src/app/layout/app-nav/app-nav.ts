import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';
import { ThemeService } from '@core/theme/theme.service';

interface NavItem {
  path: string;
  label: string;
  shortLabel: string;
  icon: string;
  exact: boolean;
}

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, TuiButton],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="nav-bar">
      <div class="nav-inner">
        <a routerLink="/" class="nav-brand" aria-label="PrepHub home">
          <span class="nav-brand-mark"><i class="ti ti-school"></i></span>
          <span class="nav-brand-text">PrepHub</span>
        </a>

        <div class="nav-end">
          <nav class="nav-links" aria-label="Main">
            @for (item of items; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="nav-link--active"
                [routerLinkActiveOptions]="item.exact ? exactPath : subtree"
                ariaCurrentWhenActive="page"
                class="nav-link"
              >
                <i [class]="'ti ' + item.icon"></i>
                <span class="nav-link-label">{{ item.label }}</span>
                <span class="nav-link-short">{{ item.shortLabel }}</span>
              </a>
            }
          </nav>

          <button
            tuiIconButton
            type="button"
            appearance="outline-grayscale"
            class="theme-toggle"
            [iconStart]="theme.theme() === 'dark' ? '@tui.sun' : '@tui.moon'"
            (click)="theme.toggle()"
            [title]="theme.theme() === 'dark' ? 'Light theme' : 'Dark theme'"
          >
            {{ theme.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme' }}
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrl: './app-nav.css',
})
export class AppNav {
  protected readonly theme = inject(ThemeService);

  /** Match the path only, so links stay active with ?topic=&q= or ?section= in the URL. */
  protected readonly exactPath: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  protected readonly subtree: IsActiveMatchOptions = { ...this.exactPath, paths: 'subset' };

  protected readonly items: NavItem[] = [
    { path: '/', label: 'Home', shortLabel: 'Home', icon: 'ti-home', exact: true },
    {
      path: '/questions',
      label: 'Interview Q&A',
      shortLabel: 'Q&A',
      icon: 'ti-list-check',
      exact: false,
    },
    {
      path: '/daily',
      label: 'Daily Learning',
      shortLabel: 'Daily',
      icon: 'ti-calendar-stats',
      exact: false,
    },
    {
      path: '/core-concepts',
      label: 'Core Concepts',
      shortLabel: 'Concepts',
      icon: 'ti-bulb',
      exact: false,
    },
    {
      path: '/system-design',
      label: 'System Design',
      shortLabel: 'Design',
      icon: 'ti-topology-star',
      exact: false,
    },
  ];
}
