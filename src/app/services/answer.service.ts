import { Injectable } from '@angular/core';
import { ANSWER_LOADERS } from './answers';
import type { AnswerMap, QuestionAnswer } from './answers/answer.model';

export type { QuestionAnswer } from './answers/answer.model';

/** Lazy-loads and caches model answers per question category. */
@Injectable({ providedIn: 'root' })
export class AnswerService {
  private cache = new Map<string, Promise<AnswerMap>>();
  /** Categories that finished loading, for synchronous lookups. */
  private loaded = new Map<string, AnswerMap>();

  /** Resolves to the answer, or `null` if this question has no answer yet. */
  async getAnswer(categoryId: string, questionId: string): Promise<QuestionAnswer | null> {
    const answers = await this.loadCategory(categoryId);
    return answers[questionId] ?? null;
  }

  /**
   * Answer from an already-loaded category without waiting: `undefined` means the
   * category isn't loaded yet, `null` means the question has no answer.
   */
  peek(categoryId: string, questionId: string): QuestionAnswer | null | undefined {
    const answers = this.loaded.get(categoryId);
    return answers ? (answers[questionId] ?? null) : undefined;
  }

  /** Starts loading a category in the background (e.g. the next question's). */
  prefetch(categoryId: string): void {
    this.loadCategory(categoryId).catch(() => undefined);
  }

  private loadCategory(categoryId: string): Promise<AnswerMap> {
    let pending = this.cache.get(categoryId);
    if (!pending) {
      const loader = ANSWER_LOADERS[categoryId];
      pending = (loader ? loader() : Promise.resolve({})).then((answers) => {
        this.loaded.set(categoryId, answers);
        return answers;
      });
      // Don't cache failures (e.g. a flaky network) so the next open can retry
      pending.catch(() => this.cache.delete(categoryId));
      this.cache.set(categoryId, pending);
    }
    return pending;
  }
}
