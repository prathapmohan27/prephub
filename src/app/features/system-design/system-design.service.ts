import { Injectable } from '@angular/core';
import { LessonProgressStore, Progress } from '@core/progress/lesson-progress';
import { SYSTEM_DESIGN_SYSTEMS, SystemDesignSystem } from './system-design-data';

const PROGRESS_KEY = 'sd_progress';

@Injectable({ providedIn: 'root' })
export class SystemDesignService {
  readonly systems = SYSTEM_DESIGN_SYSTEMS;
  private readonly store = new LessonProgressStore(PROGRESS_KEY, this.systems);

  readonly overallRead = this.store.overall;

  getSystem(id: string): SystemDesignSystem | undefined {
    return this.systems.find((s) => s.id === id);
  }

  systemProgress(systemId: string): Progress {
    const sys = this.getSystem(systemId);
    return sys ? this.store.of(sys) : { total: 0, read: 0, percent: 0 };
  }

  isSectionRead(systemId: string, sectionId: string): boolean {
    return this.store.isRead(systemId, sectionId);
  }

  toggleSection(systemId: string, sectionId: string) {
    this.store.toggle(systemId, sectionId);
  }

  markAllRead(systemId: string) {
    const sys = this.getSystem(systemId);
    if (sys) this.store.markAllRead(sys);
  }

  resetSystem(systemId: string) {
    this.store.reset(systemId);
  }
}
