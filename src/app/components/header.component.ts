import { Component, output, input } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <div style="display:flex;flex-direction:column;gap:12px;">

      <!-- Row 1: Search -->
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;border:1px solid rgba(63,63,70,0.5);background:rgba(24,24,27,0.6);">
        <i class="ti ti-search" style="color:#71717a;font-size:15px;flex-shrink:0;"></i>
        <input
          type="text"
          placeholder="Search topics or keywords (e.g. RxJS, OnPush, signals)..."
          (input)="onSearch($event)"
          style="flex:1;background:transparent;border:none;outline:none;font-size:0.875rem;color:#f4f4f5;font-family:'Inter',sans-serif;"
        />
      </div>

      <!-- Row 2: Filters + Actions -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">

        <!-- Filter Tabs -->
        <div style="display:flex;align-items:center;gap:2px;padding:4px;border-radius:10px;background:rgba(24,24,27,0.7);border:1px solid rgba(63,63,70,0.4);">
          <button
            (click)="onFilterChange('all')"
            style="padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-size:0.75rem;font-weight:600;transition:background 0.15s,color 0.15s;font-family:'Inter',sans-serif;"
            [style.background]="activeFilter() === 'all' ? 'rgba(63,63,70,0.8)' : 'transparent'"
            [style.color]="activeFilter() === 'all' ? '#f4f4f5' : '#71717a'"
          >
            All
          </button>
          <button
            (click)="onFilterChange('prepared')"
            style="padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-size:0.75rem;font-weight:600;transition:background 0.15s,color 0.15s;display:flex;align-items:center;gap:5px;font-family:'Inter',sans-serif;"
            [style.background]="activeFilter() === 'prepared' ? 'rgba(63,63,70,0.8)' : 'transparent'"
            [style.color]="activeFilter() === 'prepared' ? '#f4f4f5' : '#71717a'"
          >
            <i class="ti ti-circle-check-filled" style="color:#10b981;font-size:12px;"></i> Mastered
          </button>
          <button
            (click)="onFilterChange('starred')"
            style="padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-size:0.75rem;font-weight:600;transition:background 0.15s,color 0.15s;display:flex;align-items:center;gap:5px;font-family:'Inter',sans-serif;"
            [style.background]="activeFilter() === 'starred' ? 'rgba(63,63,70,0.8)' : 'transparent'"
            [style.color]="activeFilter() === 'starred' ? '#f4f4f5' : '#71717a'"
          >
            <i class="ti ti-star-filled" style="color:#f59e0b;font-size:12px;"></i> Starred
          </button>
          <button
            (click)="onFilterChange('unprepared')"
            style="padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-size:0.75rem;font-weight:600;transition:background 0.15s,color 0.15s;font-family:'Inter',sans-serif;"
            [style.background]="activeFilter() === 'unprepared' ? 'rgba(63,63,70,0.8)' : 'transparent'"
            [style.color]="activeFilter() === 'unprepared' ? '#f4f4f5' : '#71717a'"
          >
            Unprepared
          </button>
        </div>

        <!-- Expand/Collapse toggle -->
        <button
          (click)="toggleExpandAll()"
          [title]="isExpanded() ? 'Collapse all' : 'Expand all'"
          style="width:38px;height:38px;border-radius:10px;border:1px solid rgba(63,63,70,0.45);background:rgba(24,24,27,0.6);color:#a1a1aa;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;flex-shrink:0;"
        >
          <i [class]="'ti ' + (isExpanded() ? 'ti-arrows-minimize' : 'ti-arrows-maximize')"></i>
        </button>

        <!-- Mock Me Button -->
        <button
          (click)="randomChallenge.emit()"
          style="display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:none;font-size:0.75rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#f43f5e,#e11d48);cursor:pointer;box-shadow:0 4px 14px rgba(244,63,94,0.2);flex-shrink:0;font-family:'Inter',sans-serif;"
        >
          <i class="ti ti-dice-5" style="font-size:14px;"></i>
          Mock Me
        </button>

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
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
