import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiInput } from '@taiga-ui/core';
import { TuiSegmented } from '@taiga-ui/kit';
import type { Level } from '@services/question';

export interface FilterCounts {
  all: number;
  prepared: number;
  starred: number;
  unprepared: number;
}

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TuiButton, TuiIcon, TuiInput, TuiSegmented],
  template: `
    <div class="hdr">
      <!-- Row 1: Search -->
      <tui-textfield iconStart="@tui.search" class="search-box" [tuiTextfieldCleaner]="false">
        <input
          tuiInput
          type="search"
          class="search-input"
          placeholder="Search questions…"
          aria-label="Search questions"
          [ngModel]="query()"
          (ngModelChange)="searchChange.emit($event)"
        />
        <kbd class="search-kbd" aria-hidden="true">/</kbd>
      </tui-textfield>

      <!-- Row 2: all filters in one place, then Mock Me -->
      <div class="flex-wrap-gap">
        <!-- Level -->
        <tui-segmented
          size="s"
          class="filter-strip"
          role="group"
          aria-label="Question level"
          [class.filter-strip--applied]="level() !== 'all'"
          [activeItemIndex]="levelIndex()"
        >
          @for (l of levels; track l.id) {
            <button
              type="button"
              [attr.aria-pressed]="level() === l.id"
              [title]="l.hint"
              (click)="levelChange.emit(l.id)"
            >
              {{ l.label }}
            </button>
          }
        </tui-segmented>

        <!-- Status -->
        <tui-segmented
          size="s"
          class="filter-strip"
          role="group"
          aria-label="Question status"
          [class.filter-strip--applied]="activeFilter() !== 'all'"
          [activeItemIndex]="filterIndex()"
        >
          @for (f of filters; track f.id) {
            <button
              type="button"
              [attr.aria-pressed]="activeFilter() === f.id"
              (click)="filterChange.emit(f.id)"
            >
              @if (f.icon) {
                <tui-icon class="filter-icon" [icon]="f.icon" [style.color]="f.color" />
              }
              {{ f.label }}
              <span class="filter-count">{{ counts()[f.id] }}</span>
            </button>
          }
        </tui-segmented>

        <!-- Mock Me -->
        <button
          tuiButton
          type="button"
          appearance="primary"
          iconStart="@tui.dices"
          class="btn-mock"
          (click)="randomChallenge.emit()"
        >
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

  readonly filters: { id: keyof FilterCounts; label: string; icon: string; color: string }[] = [
    { id: 'all', label: 'All', icon: '', color: '' },
    {
      id: 'prepared',
      label: 'Mastered',
      icon: '@tui.circle-check',
      color: 'var(--color-success-light)',
    },
    { id: 'starred', label: 'Starred', icon: '@tui.star', color: 'var(--color-warning-light)' },
    {
      id: 'unprepared',
      label: 'Unprepared',
      icon: '@tui.circle',
      color: 'var(--color-text-subtle)',
    },
  ];

  /** Segmented controls track the selection by position. */
  protected readonly levelIndex = computed(() =>
    this.levels.findIndex((l) => l.id === this.level()),
  );
  protected readonly filterIndex = computed(() =>
    this.filters.findIndex((f) => f.id === this.activeFilter()),
  );

  searchChange = output<string>();
  filterChange = output<string>();
  randomChallenge = output<void>();
  levelChange = output<'all' | Level>();
}
