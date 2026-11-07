import type { ContentBlock } from '../content-model';

/**
 * A model answer for one interview question.
 *
 * - `summary`: the 1–3 sentence answer you'd say first in an interview.
 * - `details`: the full explanation, using the same blocks as lessons
 *   (paragraph, heading3, bullets, numbered, code, callout, flow, divider).
 */
export interface QuestionAnswer {
  summary: string;
  details: ContentBlock[];
}

/** Answers for one category, keyed by the question's stable id from `question.ts`. */
export type AnswerMap = Record<string, QuestionAnswer>;
