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
            <i class="ti ti-circle-check text-success"></i> Mastered
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
            <i class="ti ti-star text-warning"></i> Starred
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
  styleUrl: './header.css',
})
export class Header {
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
