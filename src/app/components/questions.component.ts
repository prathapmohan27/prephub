import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { HeaderComponent } from './header.component';
import { StatsComponent } from './stats.component';
import { CategoryComponent } from './category.component';
import { QuestionService, Category } from '../services/question.service';

@Component({
  selector: 'app-questions',
  imports: [HeaderComponent, StatsComponent, CategoryComponent],
  template: `
    <div style="min-height:100vh; background:#09090b; color:#f4f4f5; position:relative; font-family:'Inter',sans-serif;">
      <!-- Ambient glow -->
      <div class="radial-glow" style="position:absolute;inset:0;z-index:0;pointer-events:none;"></div>

      <!-- Page wrapper -->
      <div style="position:relative;z-index:1; max-width:1280px; margin:0 auto; padding:32px 24px; display:flex; flex-direction:column; gap:0;">

        <!-- ── Top header strip ── -->
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:32px;">
          <!-- Logo -->
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f43f5e,#e11d48);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;flex-shrink:0;box-shadow:0 4px 16px rgba(244,63,94,0.25);">
            <i class="ti ti-brand-angular"></i>
          </div>
          <div>
            <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.125rem;font-weight:800;letter-spacing:-0.03em;background:linear-gradient(90deg,#fff,#a1a1aa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-transform:uppercase;line-height:1.2;">
              PrepHub
            </h1>
            <span style="font-size:0.65rem;color:#71717a;font-family:'Inter',monospace;letter-spacing:0.05em;">
              Angular Interview Companion
            </span>
          </div>
        </div>

        <!-- ── Two-column layout ── -->
        <div style="display:flex; flex-direction:row; gap:24px; align-items:flex-start;">

          <!-- LEFT SIDEBAR -->
          <aside style="width:264px;flex-shrink:0;display:flex;flex-direction:column;gap:16px;position:sticky;top:24px;">
            <!-- Category nav card -->
            <div class="glass-panel" style="border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px;">
              <p style="font-size:0.65rem;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;padding:0 8px;margin-bottom:6px;">
                Categories
              </p>

              <!-- All Categories -->
              <button
                (click)="selectCategory(null)"
                style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;border-radius:10px;border:none;cursor:pointer;transition:background 0.15s;text-align:left;font-size:0.75rem;font-weight:600;"
                [style.background]="selectedCategory() === null ? 'rgba(63,63,70,0.6)' : 'transparent'"
                [style.color]="selectedCategory() === null ? '#f4f4f5' : '#a1a1aa'"
              >
                <span style="display:flex;align-items:center;gap:8px;">
                  <span style="width:22px;height:22px;border-radius:6px;background:rgba(63,63,70,0.5);display:flex;align-items:center;justify-content:center;font-size:12px;color:#a1a1aa;">
                    <i class="ti ti-apps"></i>
                  </span>
                  All Categories
                </span>
                <span class="cat-badge">{{ totalDatabaseQuestions() }}</span>
              </button>

              <div style="height:1px;background:rgba(63,63,70,0.35);margin:6px 0;"></div>

              <!-- Per-category list -->
              <div style="display:flex;flex-direction:column;gap:2px;max-height:480px;overflow-y:auto;padding-right:2px;">
                @for (cat of categories(); track cat.id) {
                  <button
                    (click)="selectCategory(cat)"
                    style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;border-radius:10px;border:none;cursor:pointer;transition:background 0.15s;text-align:left;font-size:0.75rem;font-weight:600;"
                    [style.background]="selectedCategory()?.id === cat.id ? 'rgba(63,63,70,0.6)' : 'transparent'"
                    [style.color]="selectedCategory()?.id === cat.id ? '#f4f4f5' : '#a1a1aa'"
                  >
                    <span style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden;">
                      <span
                        [style.color]="cat.color"
                        [style.background]="cat.color + '18'"
                        style="width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;"
                      >
                        <i [class]="'ti ' + cat.icon"></i>
                      </span>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ cat.title }}</span>
                    </span>
                    <span class="cat-badge" style="flex-shrink:0;">{{ cat.questions.length }}</span>
                  </button>
                }
              </div>
            </div>
          </aside>

          <!-- RIGHT MAIN PANEL -->
          <main style="flex:1;min-width:0;display:flex;flex-direction:column;gap:20px;">

            <!-- Header / Search / Filters -->
            <app-header
              [isExpanded]="allOpen()"
              [activeFilter]="activeFilter()"
              (searchChange)="onSearch($event)"
              (expandAll)="toggleExpandAll()"
              (filterChange)="onFilterChange($event)"
              (randomChallenge)="triggerSpotlight()"
            />

            <!-- Stats Cards -->
            <app-stats
              [totalQuestions]="totalDatabaseQuestions()"
              [preparedQuestions]="preparedSet().size"
              [starredQuestions]="starredSet().size"
              [totalCategories]="categories().length"
            />

            <!-- Spotlight / Mock Challenge -->
            @if (spotlightQuestion()) {
              <div class="glass-panel animate-fade-in" style="border-radius:16px;padding:24px;border-color:rgba(244,63,94,0.2);background:rgba(120,10,30,0.06);display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-size:0.7rem;font-weight:700;color:#fb7185;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:0.07em;">
                    <i class="ti ti-dice-5" style="font-size:14px;"></i> Mock Interview Challenge
                  </span>
                  <button
                    (click)="clearSpotlight()"
                    style="width:28px;height:28px;border-radius:50%;background:rgba(39,39,42,0.6);border:1px solid rgba(63,63,70,0.4);display:flex;align-items:center;justify-content:center;color:#a1a1aa;cursor:pointer;font-size:11px;"
                  >
                    <i class="ti ti-x"></i>
                  </button>
                </div>

                <div style="padding:16px;border-radius:12px;background:rgba(9,9,11,0.7);border:1px solid rgba(63,63,70,0.4);">
                  <p style="font-size:0.9rem;font-weight:600;color:#f4f4f5;line-height:1.6;font-family:'Plus Jakarta Sans',sans-serif;">
                    "{{ spotlightQuestion() }}"
                  </p>
                  <span
                    [style.color]="spotlightCategory()?.color"
                    [style.background]="spotlightCategory()?.color + '18'"
                    style="display:inline-block;margin-top:10px;padding:2px 10px;border-radius:6px;font-size:0.65rem;font-family:monospace;"
                  >
                    {{ spotlightCategory()?.title }}
                  </span>
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                  <button
                    (click)="togglePreparedSpotlight()"
                    style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;font-size:0.75rem;font-weight:600;background:rgba(16,185,129,0.1);color:#34d399;border:1px solid rgba(16,185,129,0.2);cursor:pointer;transition:background 0.15s;"
                  >
                    <i class="ti" [class.ti-circle-check-filled]="isSpotlightPrepared()" [class.ti-circle]="!isSpotlightPrepared()"></i>
                    {{ isSpotlightPrepared() ? 'Mastered ✓' : 'Mark as Mastered' }}
                  </button>
                  <button
                    (click)="triggerSpotlight()"
                    class="btn-ghost"
                  >
                    <i class="ti ti-refresh-dot"></i> Try Another
                  </button>
                  <a
                    [href]="'https://www.google.com/search?q=site%3Aangular.dev+' + encodeUri(spotlightQuestion() || '')"
                    target="_blank"
                    class="btn-ghost action-link"
                  >
                    <i class="ti ti-external-link"></i> Study Resources
                  </a>
                </div>
              </div>
            }

            <!-- Category accordion list -->
            <div style="display:flex;flex-direction:column;gap:12px;">
              @if (visibleCategories().length === 0) {
                <div class="glass-panel" style="border-radius:16px;padding:48px 24px;text-align:center;">
                  <div style="width:48px;height:48px;border-radius:50%;background:rgba(39,39,42,0.6);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:20px;color:#52525b;">
                    <i class="ti ti-search-off"></i>
                  </div>
                  <p style="font-size:0.875rem;font-weight:600;color:#a1a1aa;">No questions match your current filters</p>
                  <p style="font-size:0.75rem;color:#71717a;margin-top:4px;">Try resetting the search or switching category tabs.</p>
                </div>
              } @else {
                @for (cat of visibleCategories(); track cat.id) {
                  <app-category
                    [category]="cat"
                    [searchFilter]="searchFilter()"
                    [forceOpen]="allOpen()"
                    [preparedSet]="preparedSet()"
                    [starredSet]="starredSet()"
                    [notesMap]="notesMap()"
                    (togglePrepared)="togglePrepared($event)"
                    (toggleStarred)="toggleStarred($event)"
                    (notesChange)="onNotesChange($event)"
                  />
                }
              }
            </div>

          </main>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class QuestionsComponent implements OnInit {
  categories = signal<Category[]>([]);
  searchFilter = signal<string>('');
  allOpen = signal<boolean>(false);

  preparedSet = signal<Set<string>>(new Set());
  starredSet = signal<Set<string>>(new Set());
  notesMap = signal<Record<string, string>>({});

  activeFilter = signal<string>('all');
  selectedCategory = signal<Category | null>(null);

  spotlightQuestion = signal<string | null>(null);
  spotlightCategory = signal<Category | null>(null);

  private questionService: QuestionService = inject(QuestionService);

  totalDatabaseQuestions = computed(() =>
    this.categories().reduce((acc, cat) => acc + cat.questions.length, 0)
  );

  visibleCategories = computed(() => {
    const filter = this.searchFilter().toLowerCase();
    const activeF = this.activeFilter();
    const selectedCat = this.selectedCategory();
    const targetCats = selectedCat ? [selectedCat] : this.categories();

    return targetCats
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter((q) => {
          if (filter && !q.toLowerCase().includes(filter)) return false;
          if (activeF === 'prepared') return this.preparedSet().has(q);
          if (activeF === 'starred') return this.starredSet().has(q);
          if (activeF === 'unprepared') return !this.preparedSet().has(q);
          return true;
        }),
      }))
      .filter((cat) => cat.questions.length > 0);
  });

  isSpotlightPrepared = computed(() => {
    const q = this.spotlightQuestion();
    return q ? this.preparedSet().has(q) : false;
  });

  ngOnInit() {
    this.categories.set(this.questionService.getCategories());
    this.loadState();
  }

  onSearch(filter: string) { this.searchFilter.set(filter); }
  toggleExpandAll() { this.allOpen.update((v) => !v); }
  onFilterChange(filter: string) { this.activeFilter.set(filter); }
  selectCategory(cat: Category | null) { this.selectedCategory.set(cat); }

  private loadState() {
    try {
      const prepared = JSON.parse(localStorage.getItem('prep_prepared') || '[]');
      const starred = JSON.parse(localStorage.getItem('prep_starred') || '[]');
      const notes = JSON.parse(localStorage.getItem('prep_notes') || '{}');
      this.preparedSet.set(new Set<string>(prepared));
      this.starredSet.set(new Set<string>(starred));
      this.notesMap.set(notes);
    } catch (e) {
      console.error('Failed to load storage state', e);
    }
  }

  togglePrepared(q: string) {
    const updated = new Set(this.preparedSet());
    updated.has(q) ? updated.delete(q) : updated.add(q);
    this.preparedSet.set(updated);
    localStorage.setItem('prep_prepared', JSON.stringify(Array.from(updated)));
  }

  toggleStarred(q: string) {
    const updated = new Set(this.starredSet());
    updated.has(q) ? updated.delete(q) : updated.add(q);
    this.starredSet.set(updated);
    localStorage.setItem('prep_starred', JSON.stringify(Array.from(updated)));
  }

  onNotesChange(event: { question: string; notes: string }) {
    const updated = { ...this.notesMap(), [event.question]: event.notes };
    this.notesMap.set(updated);
    localStorage.setItem('prep_notes', JSON.stringify(updated));
  }

  triggerSpotlight() {
    const pool = this.visibleCategories().reduce<Array<{ q: string; cat: Category }>>((acc, cat) => {
      const origCat = this.categories().find((c) => c.id === cat.id);
      if (origCat) cat.questions.forEach((q) => acc.push({ q, cat: origCat }));
      return acc;
    }, []);
    if (!pool.length) { this.clearSpotlight(); return; }
    const item = pool[Math.floor(Math.random() * pool.length)];
    this.spotlightQuestion.set(item.q);
    this.spotlightCategory.set(item.cat);
  }

  clearSpotlight() {
    this.spotlightQuestion.set(null);
    this.spotlightCategory.set(null);
  }

  togglePreparedSpotlight() {
    const q = this.spotlightQuestion();
    if (q) this.togglePrepared(q);
  }

  encodeUri(val: string): string { return encodeURIComponent(val); }
}
