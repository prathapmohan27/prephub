import { CORE_CONCEPTS } from '@features/core-concepts/core-concepts-data';
import { Question } from '@features/questions/data/question-bank';
import { SYSTEM_DESIGN_SYSTEMS } from '@features/system-design/system-design-data';
import { ROADMAP_PHASES, TopicDepth } from './roadmap-data';

describe('roadmap data', () => {
  const topics = ROADMAP_PHASES.flatMap((p) => p.topics);
  const byId = new Map(topics.map((t) => [t.id, t]));
  const phaseIndexOf = new Map(
    ROADMAP_PHASES.flatMap((p, i) => p.topics.map((t) => [t.id, i] as const)),
  );

  it('has unique topic and phase ids', () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const phaseIds = ROADMAP_PHASES.map((p) => p.id);
    expect(new Set(phaseIds).size).toBe(phaseIds.length);
  });

  it('only depends on topics that come earlier, so the order is a valid learning path', () => {
    const seen = new Set<string>();
    for (const topic of topics) {
      for (const dep of topic.dependsOn) {
        expect(seen.has(dep), `${topic.id} depends on ${dep}, which is not earlier`).toBe(true);
      }
      seen.add(topic.id);
    }
  });

  it('never makes a topic depend on a lower-priority one, so "Must know" alone is a complete path', () => {
    const rank: Record<TopicDepth, number> = { must: 0, should: 1, advanced: 2 };
    for (const topic of topics) {
      for (const dep of topic.dependsOn) {
        const depDepth = byId.get(dep)!.depth;
        expect(
          rank[depDepth],
          `${topic.id} (${topic.depth}) depends on ${dep} (${depDepth})`,
        ).toBeLessThanOrEqual(rank[topic.depth]);
      }
    }
  });

  it('only requires earlier phases', () => {
    ROADMAP_PHASES.forEach((phase, i) => {
      const earlier = ROADMAP_PHASES.slice(0, i).map((p) => p.id);
      for (const req of phase.requires) expect(earlier).toContain(req);
    });
  });

  it('only unlocks case studies whose prerequisites are covered by then', () => {
    ROADMAP_PHASES.forEach((phase, i) => {
      for (const id of phase.unlocks ?? []) {
        const topic = byId.get(id);
        expect(topic, `${phase.id} unlocks unknown topic ${id}`).toBeDefined();
        for (const dep of topic!.dependsOn) {
          expect(phaseIndexOf.get(dep)!, `${id} needs ${dep}`).toBeLessThanOrEqual(i);
        }
      }
    });
  });

  it('gives every exercise a self-check list', () => {
    for (const phase of ROADMAP_PHASES) expect(phase.exercise.lookFor.length).toBeGreaterThan(0);
  });

  it('links only to lessons and question topics that exist', () => {
    const known: Record<string, Set<string>> = {
      '/core-concepts': new Set(CORE_CONCEPTS.map((c) => c.id)),
      '/system-design': new Set(SYSTEM_DESIGN_SYSTEMS.map((s) => s.id)),
      '/questions': new Set(new Question().getCategories().map((c) => c.id)),
    };
    for (const s of topics.flatMap((t) => t.study ?? [])) {
      const id = s.link[0] === '/questions' ? s.query?.['topic'] : s.link[1];
      expect(known[s.link[0]]?.has(id ?? ''), `${s.link[0]} → ${id}`).toBe(true);
    }
  });
});
