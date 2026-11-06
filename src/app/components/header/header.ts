import { Component, output, input } from '@angular/core';
import type { Level } from '@services/question';

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
          [value]="query()"
          (input)="onSearch($event)"
        />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </div>

      <!-- Row 2: all filters in one place, then Mock Me -->
      <div class="flex-wrap-gap">
        <!-- Level -->
        <div class="filter-strip" role="group" aria-label="Question level">
          @for (l of levels; track l.id) {
            <button
              type="button"
              class="btn-filter-tab"
              [class.btn-filter-tab--active]="level() === l.id"
              [class.btn-filter-tab--applied]="level() === l.id && l.id !== 'all'"
              [attr.aria-pressed]="level() === l.id"
              [title]="l.hint"
              (click)="levelChange.emit(l.id)"
            >
              {{ l.label }}
            </button>
          }
        </div>

        <!-- Status -->
        <div class="filter-strip">
          @for (f of filters; track f.id) {
            <button
              type="button"
              (click)="onFilterChange(f.id)"
              class="btn-filter-tab"
              [class.btn-filter-tab--active]="activeFilter() === f.id"
              [class.btn-filter-tab--applied]="activeFilter() === f.id && f.id !== 'all'"
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
        <button (click)="randomChallenge.emit()" class="btn-mock">
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
  level = input<'all' | Level>('all');
  /** Current search text, so clearing it elsewhere (the filter bar) empties the box too. */
  query = input('');

  /** Core = fundamentals; Senior = internals, trade-offs, design and production scenarios. */
  readonly levels: { id: 'all' | Level; label: string; hint: string }[] = [
    { id: 'all', label: 'All levels', hint: 'Show every question' },
    { id: 'core', label: 'Core', hint: 'Fundamentals every candidate is expected to know' },
    {
      id: 'senior',
      label: 'Senior',
      hint: 'Internals, trade-offs, design and production scenarios',
    },
  ];

  readonly filters: { id: keyof FilterCounts; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '' },
    { id: 'prepared', label: 'Mastered', icon: 'ti-circle-check text-success' },
    { id: 'starred', label: 'Starred', icon: 'ti-star text-warning' },
    { id: 'unprepared', label: 'Unprepared', icon: 'ti-circle text-muted' },
  ];

  searchChange = output<string>();
  filterChange = output<string>();
  randomChallenge = output<void>();
  levelChange = output<'all' | Level>();

  onSearch(event: Event) {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
  onFilterChange(filter: string) {
    this.filterChange.emit(filter);
  }
}
