import { Injectable } from '@angular/core';
import { LessonProgressStore, Progress } from '@core/progress/lesson-progress';
import { ROADMAP_PHASES, RoadmapPhase, RoadmapTopic } from './roadmap-data';

/** `prep_` prefix so progress is included in Back up / Restore. */
const PROGRESS_KEY = 'prep_roadmap_progress';

// Phases map to lessons and topics to sections, so the shared progress store fits as-is.
const asLessons = ROADMAP_PHASES.map((p) => ({ id: p.id, sections: p.topics }));

@Injectable({ providedIn: 'root' })
export class RoadmapService {
  readonly phases = ROADMAP_PHASES;
  private readonly store = new LessonProgressStore(PROGRESS_KEY, asLessons);
  private readonly topicIndex = new Map<string, { topic: RoadmapTopic; phase: RoadmapPhase }>(
    ROADMAP_PHASES.flatMap((phase) => phase.topics.map((topic) => [topic.id, { topic, phase }])),
  );

  readonly overall = this.store.overall;

  findTopic(id: string) {
    return this.topicIndex.get(id);
  }

  phaseProgress(phase: RoadmapPhase): Progress {
    return this.store.of({ id: phase.id, sections: phase.topics });
  }

  isDone(phaseId: string, topicId: string): boolean {
    return this.store.isRead(phaseId, topicId);
  }

  toggle(phaseId: string, topicId: string) {
    this.store.toggle(phaseId, topicId);
  }
}
