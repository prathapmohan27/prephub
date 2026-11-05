import { Component } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  shortLabel: string;
  icon: string;
  exact: boolean;
}

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="nav-bar">
      <div class="nav-inner">
        <a routerLink="/" class="nav-brand" aria-label="PrepHub home">
          <span class="nav-brand-mark"><i class="ti ti-school"></i></span>
          <span class="nav-brand-text">PrepHub</span>
        </a>

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
      </div>
    </header>
  `,
  styleUrl: './app-nav.css',
})
export class AppNav {
  /** Match the path only, so links stay active with ?topic=&q= or ?section= in the URL. */
  protected readonly exactPath: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  protected readonly subtree: IsActiveMatchOptions = { ...this.exactPath, paths: 'subset' };

  protected readonly items: NavItem[] = [
    { path: '/', label: 'Interview Q&A', shortLabel: 'Q&A', icon: 'ti-list-check', exact: true },
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
