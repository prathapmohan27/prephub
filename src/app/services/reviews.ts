// Self-ratings ("how well did I know it?"), shared by Mock Me and the question reader.
// Mock Me uses the last rating per question to bring weak questions back sooner.
// Keyed by stable question id.

export type ReviewRating = 'nailed' | 'shaky' | 'blanked';

export interface Review {
  r: ReviewRating;
  /** When it was rated (ms since epoch). */
  t: number;
}

export const REVIEWS_KEY = 'prep_mock_reviews';

/** Rating buttons, in keyboard order (1, 2, 3). */
export const RATINGS: { value: ReviewRating; label: string; icon: string; key: string }[] = [
  { value: 'nailed', label: 'Nailed it', icon: 'ti-mood-happy', key: '1' },
  { value: 'shaky', label: 'Shaky', icon: 'ti-mood-confuzed', key: '2' },
  { value: 'blanked', label: 'Blanked', icon: 'ti-mood-sad', key: '3' },
];

export function readReviews(): Record<string, Review> {
  try {
    const parsed = JSON.parse(localStorage.getItem(REVIEWS_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Saves one rating and returns the updated map. */
export function recordReview(questionId: string, rating: ReviewRating): Record<string, Review> {
  const all = { ...readReviews(), [questionId]: { r: rating, t: Date.now() } };
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  } catch {
    // Practice history only; ignore blocked storage
  }
  return all;
}
