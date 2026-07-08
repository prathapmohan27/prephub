import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-stats',
  template: `
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
          <i class="ti ti-star-filled"></i>
        </div>
      </div>
    </div>
  `,
  styleUrl: './stats.css',
})
export class Stats {
  totalQuestions = input<number>(0);
  preparedQuestions = input<number>(0);
  starredQuestions = input<number>(0);
  totalCategories = input<number>(0);

  preparedPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.preparedQuestions() / total) * 100);
  });
}
