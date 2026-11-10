/**
 * Taiga UI status appearance for a lesson's difficulty badge (`<span tuiBadge [appearance]>`).
 * Shared by Core Concepts and System Design so the same level always has the same colour.
 */
const DIFFICULTY_APPEARANCE: Record<string, string> = {
  Beginner: 'positive',
  Foundational: 'info',
  Intermediate: 'warning',
  Advanced: 'negative',
};

export function difficultyAppearance(difficulty: string): string {
  return DIFFICULTY_APPEARANCE[difficulty] ?? 'neutral';
}
