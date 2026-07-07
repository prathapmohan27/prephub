import { Component, output, input } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <div class="flex-col" style="gap: 12px;">
      <!-- Row 1: Search -->
      <div class="search-box">
        <i class="ti ti-search text-muted text-[15px] shrink-0"></i>
        <input
          type="text"
          class="search-input"
          placeholder="Search topics or keywords (e.g. RxJS, OnPush, signals)..."
          (input)="onSearch($event)"
        />
      </div>

      <!-- Row 2: Filters + Actions -->
      <div class="flex-wrap-gap">
        <!-- Filter Tabs -->
        <div class="filter-strip">
          <button
            (click)="onFilterChange('all')"
            class="btn-filter-tab"
            [style.background]="activeFilter() === 'all' ? 'rgba(63,63,70,0.8)' : 'transparent'"
            [style.color]="
              activeFilter() === 'all' ? 'var(--color-text-primary)' : 'var(--color-text-subtle)'
            "
          >
            All
          </button>

          <button
            (click)="onFilterChange('prepared')"
            class="btn-filter-tab"
            [style.background]="
              activeFilter() === 'prepared' ? 'rgba(63,63,70,0.8)' : 'transparent'
            "
            [style.color]="
              activeFilter() === 'prepared'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-subtle)'
            "
          >
            <i class="ti ti-circle-check-filled text-success"></i> Mastered
          </button>

          <button
            (click)="onFilterChange('starred')"
            class="btn-filter-tab"
            [style.background]="activeFilter() === 'starred' ? 'rgba(63,63,70,0.8)' : 'transparent'"
            [style.color]="
              activeFilter() === 'starred'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-subtle)'
            "
          >
            <i class="ti ti-star-filled text-warning"></i> Starred
          </button>

          <button
            (click)="onFilterChange('unprepared')"
            class="btn-filter-tab"
            [style.background]="
              activeFilter() === 'unprepared' ? 'rgba(63,63,70,0.8)' : 'transparent'
            "
            [style.color]="
              activeFilter() === 'unprepared'
                ? 'var(--color-text-primary)'
                : 'var(--color-text-subtle)'
            "
          >
            Unprepared
          </button>
        </div>

        <!-- Expand/Collapse -->
        <button
          (click)="toggleExpandAll()"
          [title]="isExpanded() ? 'Collapse all' : 'Expand all'"
          class="btn-icon"
        >
          <i [class]="'ti ' + (isExpanded() ? 'ti-arrows-minimize' : 'ti-arrows-maximize')"></i>
        </button>

        <!-- Mock Me -->
        <button (click)="randomChallenge.emit()" class="btn-primary-gradient">
          <i class="ti ti-dice-5 text-[14px]"></i>
          Mock Me
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-strong);
      background: rgba(24, 24, 27, 0.6);
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      color: var(--color-text-primary);
      font-family: var(--font-sans);
    }

    .filter-strip {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px;
      border-radius: var(--radius-md);
      background: rgba(24, 24, 27, 0.7);
      border: 1px solid var(--color-border);
    }

    .btn-filter-tab {
      padding: 7px 14px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      transition:
        background 0.15s,
        color 0.15s;
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: var(--font-sans);
    }

    .btn-primary-gradient {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: var(--radius-md);
      border: none;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, var(--color-angular), var(--color-angular-dark));
      cursor: pointer;
      box-shadow: var(--shadow-btn-danger);
      flex-shrink: 0;
      font-family: var(--font-sans);
    }

    .btn-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(63, 63, 70, 0.45);
      background: rgba(24, 24, 27, 0.6);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 15px;
      flex-shrink: 0;
    }

    .text-success {
      color: var(--color-success-light);
    }
    .text-warning {
      color: var(--color-warning-light);
    }
  `,
})
export class HeaderComponent {
  isExpanded = input<boolean>(false);
  activeFilter = input<string>('all');

  searchChange = output<string>();
  expandAll = output<void>();
  filterChange = output<string>();
  randomChallenge = output<void>();

  onSearch(event: Event) {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
  onFilterChange(filter: string) {
    this.filterChange.emit(filter);
  }
  toggleExpandAll() {
    this.expandAll.emit();
  }
}
