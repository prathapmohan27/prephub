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
  styles: `
    :host {
      display: block;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      border-radius: var(--radius-xl);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-card-col {
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      align-items: stretch;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .stat-icon-total {
      background: rgba(39, 39, 42, 0.5);
      color: var(--color-text-subtle);
    }

    .stat-icon-starred {
      background: var(--color-warning-bg);
      color: var(--color-warning-light);
      border: 1px solid var(--color-warning-border);
    }

    .stat-val {
      font-size: 1.625rem;
      font-weight: 800;
      line-height: 1;
    }
    .stat-val-total {
      color: var(--color-text-primary);
    }
    .stat-val-starred {
      color: var(--color-warning-light);
    }

    .stat-progress-pct {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-success-light);
      font-family: var(--font-mono);
    }

    .progress-bar-bg {
      width: 100%;
      height: 5px;
      border-radius: var(--radius-pill);
      background: rgba(63, 63, 70, 0.5);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--radius-pill);
      background: linear-gradient(90deg, var(--color-success), var(--color-success-light));
      transition: width 0.5s ease;
      box-shadow: var(--shadow-success-glow);
    }

    .stat-progress-label {
      font-size: 0.65rem;
      margin-top: 6px;
      color: var(--color-text-subtle);
      font-family: var(--font-mono);
    }
  `,
})
export class StatsComponent {
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
