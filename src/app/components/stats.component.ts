import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-stats',
  template: `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">

      <!-- Total Questions -->
      <div class="glass-panel" style="border-radius:14px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="font-size:0.65rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">
            Question Pool
          </p>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span style="font-size:1.625rem;font-weight:800;color:#f4f4f5;line-height:1;">{{ totalQuestions() }}</span>
            <span style="font-size:0.65rem;color:#71717a;font-family:monospace;">total</span>
          </div>
        </div>
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(39,39,42,0.5);display:flex;align-items:center;justify-content:center;color:#71717a;font-size:18px;">
          <i class="ti ti-database"></i>
        </div>
      </div>

      <!-- Progress -->
      <div class="glass-panel" style="border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <p style="font-size:0.65rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;">
            Preparation
          </p>
          <span style="font-size:0.75rem;font-weight:700;color:#34d399;font-family:monospace;">{{ preparedPercentage() }}%</span>
        </div>
        <div>
          <div style="width:100%;height:5px;border-radius:999px;background:rgba(63,63,70,0.5);overflow:hidden;">
            <div
              [style.width.%]="preparedPercentage()"
              style="height:100%;border-radius:999px;background:linear-gradient(90deg,#10b981,#34d399);transition:width 0.5s ease;box-shadow:0 0 8px rgba(16,185,129,0.3);"
            ></div>
          </div>
          <p style="font-size:0.65rem;color:#71717a;margin-top:6px;font-family:monospace;">
            {{ preparedQuestions() }} of {{ totalQuestions() }} mastered
          </p>
        </div>
      </div>

      <!-- Starred -->
      <div class="glass-panel" style="border-radius:14px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="font-size:0.65rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">
            Starred
          </p>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span style="font-size:1.625rem;font-weight:800;color:#fbbf24;line-height:1;">{{ starredQuestions() }}</span>
            <span style="font-size:0.65rem;color:#71717a;font-family:monospace;">saved</span>
          </div>
        </div>
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;color:#fbbf24;font-size:18px;border:1px solid rgba(245,158,11,0.15);">
          <i class="ti ti-star-filled"></i>
        </div>
      </div>

    </div>
  `,
  styles: [`:host { display: block; }`],
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
