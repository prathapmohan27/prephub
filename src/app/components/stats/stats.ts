import { Component, input, computed, model } from '@angular/core';

@Component({
  selector: 'app-stats',
  template: `
    @if (collapsed()) {
      <!-- One-line summary; click to see the full cards -->
      <button
        type="button"
        class="glass-panel stats-slim"
        (click)="collapsed.set(false)"
        aria-expanded="false"
        title="Show stats"
      >
        <span class="slim-pct">{{ preparedPercentage() }}%</span>
        <span class="progress-bar-bg slim-bar">
          <span class="progress-fill" [style.width.%]="preparedPercentage()"></span>
        </span>
        <span class="slim-text">
          {{ preparedQuestions() }}/{{ totalQuestions()
          }}<span class="slim-hide-sm"> mastered</span>
        </span>
        <span class="slim-star"><i class="ti ti-star"></i> {{ starredQuestions() }}</span>
        <i class="ti ti-chevron-down slim-chevron"></i>
      </button>
    } @else {
      <div class="stats-wrap">
        <div class="stats-grid">
          <!-- Total Questions -->
          <div class="glass-panel stat-card">
            <div>
              <p class="section-label mb-1.5">Question Pool</p>
              <div class="flex-baseline">
                <span class="stat-val stat-val-total">{{ totalQuestions() }}</span>
                <span class="subtitle-main">total</span>
              </div>
            </div>
            <div class="stat-icon stat-icon-total">
              <i class="ti ti-database"></i>
            </div>
          </div>

          <!-- Progress -->
          <div class="glass-panel stat-card stat-card-col">
            <div class="flex-between">
              <p class="section-label">Preparation</p>
              <span class="stat-progress-pct">{{ preparedPercentage() }}%</span>
            </div>
            <div>
              <div class="progress-bar-bg">
                <div class="progress-fill" [style.width.%]="preparedPercentage()"></div>
              </div>
              <p class="stat-progress-label">
                {{ preparedQuestions() }} of {{ totalQuestions() }} mastered
              </p>
            </div>
          </div>

          <!-- Starred -->
          <div class="glass-panel stat-card">
            <div>
              <p class="section-label mb-1.5">Starred</p>
              <div class="flex-baseline">
                <span class="stat-val stat-val-starred">{{ starredQuestions() }}</span>
                <span class="subtitle-main">saved</span>
              </div>
            </div>
            <div class="stat-icon stat-icon-starred">
              <i class="ti ti-star"></i>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="stats-hide"
          (click)="collapsed.set(true)"
          aria-expanded="true"
          title="Hide stats"
          aria-label="Hide stats"
        >
          <i class="ti ti-chevron-up"></i>
        </button>
      </div>
    }
  `,
  styleUrl: './stats.css',
})
export class Stats {
  totalQuestions = input<number>(0);
  preparedQuestions = input<number>(0);
  starredQuestions = input<number>(0);
  totalCategories = input<number>(0);
  /** Show a single summary line instead of the three cards. */
  collapsed = model(false);

  preparedPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.preparedQuestions() / total) * 100);
  });
}
