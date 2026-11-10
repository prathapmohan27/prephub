import { Injectable } from '@angular/core';
import { LessonProgressStore, Progress } from '@core/progress/lesson-progress';
import { CORE_CONCEPTS, CoreConcept } from './core-concepts-data';

const PROGRESS_KEY = 'core_concepts_progress';

@Injectable({ providedIn: 'root' })
export class CoreConceptsService {
  readonly concepts = CORE_CONCEPTS;
  private readonly store = new LessonProgressStore(PROGRESS_KEY, this.concepts);

  readonly overallRead = this.store.overall;

  getConcept(id: string): CoreConcept | undefined {
    return this.concepts.find((c) => c.id === id);
  }

  conceptProgress(conceptId: string): Progress {
    const concept = this.getConcept(conceptId);
    return concept ? this.store.of(concept) : { total: 0, read: 0, percent: 0 };
  }

  isSectionRead(conceptId: string, sectionId: string): boolean {
    return this.store.isRead(conceptId, sectionId);
  }

  toggleSection(conceptId: string, sectionId: string) {
    this.store.toggle(conceptId, sectionId);
  }

  markAllRead(conceptId: string) {
    const concept = this.getConcept(conceptId);
    if (concept) this.store.markAllRead(concept);
  }

  resetConcept(conceptId: string) {
    this.store.reset(conceptId);
  }
}
