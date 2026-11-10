// Section read-progress for lesson pages (Core Concepts, System Design) and the Home summary.
// Stored per lesson as { [lessonId]: { [sectionId]: true } }.

import { computed, signal } from '@angular/core';
import { isRecord, readJson, writeJson } from '@core/storage/storage';

export type SectionProgress = Record<string, Record<string, boolean>>;

export interface Progress {
  read: number;
  total: number;
  percent: number;
}

/** The part of a lesson that progress needs. */
export interface ProgressLesson {
  id: string;
  sections: readonly { id: string }[];
}

export const percentOf = (read: number, total: number) =>
  total ? Math.round((read / total) * 100) : 0;

export function readSectionProgress(key: string): SectionProgress {
  return readJson<SectionProgress>(key, {}, isRecord);
}

/**
 * Read sections of one lesson. Only sections the lesson still has are counted, so a renamed or
 * removed section left in storage can't push progress past 100%.
 */
export function lessonProgress(
  sectionIds: readonly string[],
  read: Record<string, boolean> | undefined,
): Progress {
  const total = sectionIds.length;
  const done = read ? sectionIds.filter((id) => read[id] === true).length : 0;
  return { read: done, total, percent: percentOf(done, total) };
}

/** Signal-backed progress for a list of lessons, persisted under `storageKey`. */
export class LessonProgressStore {
  private readonly progress;

  readonly overall = computed<Progress>(() => {
    let read = 0;
    let total = 0;
    for (const lesson of this.lessons) {
      const p = this.of(lesson);
      read += p.read;
      total += p.total;
    }
    return { read, total, percent: percentOf(read, total) };
  });

  constructor(
    private readonly storageKey: string,
    private readonly lessons: readonly ProgressLesson[],
  ) {
    this.progress = signal<SectionProgress>(readSectionProgress(storageKey));
  }

  of(lesson: ProgressLesson): Progress {
    return lessonProgress(
      lesson.sections.map((s) => s.id),
      this.progress()[lesson.id],
    );
  }

  isRead(lessonId: string, sectionId: string): boolean {
    return this.progress()[lessonId]?.[sectionId] === true;
  }

  toggle(lessonId: string, sectionId: string) {
    const current = this.progress()[lessonId] ?? {};
    this.save(lessonId, { ...current, [sectionId]: !current[sectionId] });
  }

  markAllRead(lesson: ProgressLesson) {
    this.save(lesson.id, Object.fromEntries(lesson.sections.map((s) => [s.id, true])));
  }

  reset(lessonId: string) {
    const updated = { ...this.progress() };
    delete updated[lessonId];
    this.progress.set(updated);
    writeJson(this.storageKey, updated);
  }

  private save(lessonId: string, sections: Record<string, boolean>) {
    const updated = { ...this.progress(), [lessonId]: sections };
    this.progress.set(updated);
    writeJson(this.storageKey, updated);
  }
}
