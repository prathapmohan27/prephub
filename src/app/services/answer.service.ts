import { Injectable } from '@angular/core';
import { ANSWER_LOADERS } from './answers';
import type { AnswerMap, QuestionAnswer } from './answers/answer.model';

export type { QuestionAnswer } from './answers/answer.model';

/** Lazy-loads and caches model answers per question category. */
@Injectable({ providedIn: 'root' })
export class AnswerService {
  private cache = new Map<string, Promise<AnswerMap>>();

  /** Resolves to the answer, or `null` if this question has no answer yet. */
  async getAnswer(categoryId: string, question: string): Promise<QuestionAnswer | null> {
    const answers = await this.loadCategory(categoryId);
    return answers[question] ?? null;
  }

  private loadCategory(categoryId: string): Promise<AnswerMap> {
    let pending = this.cache.get(categoryId);
    if (!pending) {
      const loader = ANSWER_LOADERS[categoryId];
      pending = loader ? loader() : Promise.resolve({});
      // Don't cache failures (e.g. a flaky network) so the next open can retry
      pending.catch(() => this.cache.delete(categoryId));
      this.cache.set(categoryId, pending);
    }
    return pending;
  }
}
