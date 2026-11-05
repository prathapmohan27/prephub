import { Component, output, input } from '@angular/core';

export interface FilterCounts {
  all: number;
  prepared: number;
  starred: number;
  unprepared: number;
}

@Component({
  selector: 'app-header',
  template: `
    <div class="hdr">
      <!-- Row 1: Search -->
      <div class="search-box">
        <i class="ti ti-search text-muted text-[15px] shrink-0"></i>
        <input
          type="text"
          class="search-input"
          placeholder="Search questions…"
          (input)="onSearch($event)"
        />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>

      <!-- Row 2: Filters + Actions -->
      <div class="flex-wrap-gap">
        <!-- Filter Tabs -->
        <div class="filter-strip">
          @for (f of filters; track f.id) {
            <button
              type="button"
              (click)="onFilterChange(f.id)"
              class="btn-filter-tab"
              [class.btn-filter-tab--active]="activeFilter() === f.id"
              [attr.aria-pressed]="activeFilter() === f.id"
            >
              @if (f.icon) {
                <i [class]="'ti ' + f.icon"></i>
              }
              {{ f.label }}
              <span class="filter-count">{{ counts()[f.id] }}</span>
            </button>
          }
        </div>

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
  activeFilter = input<string>('all');
  counts = input<FilterCounts>({ all: 0, prepared: 0, starred: 0, unprepared: 0 });

  readonly filters: { id: keyof FilterCounts; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '' },
    { id: 'prepared', label: 'Mastered', icon: 'ti-circle-check text-success' },
    { id: 'starred', label: 'Starred', icon: 'ti-star text-warning' },
    { id: 'unprepared', label: 'Unprepared', icon: 'ti-circle text-muted' },
  ];

  searchChange = output<string>();
  filterChange = output<string>();
  randomChallenge = output<void>();

  onSearch(event: Event) {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
  onFilterChange(filter: string) {
    this.filterChange.emit(filter);
  }
}
