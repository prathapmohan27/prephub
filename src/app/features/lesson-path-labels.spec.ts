import { CONCEPT_PATH_LABELS, CORE_CONCEPTS } from './core-concepts/core-concepts-data';
import { SYSTEM_DESIGN_SYSTEMS, SYSTEM_PATH_LABELS } from './system-design/system-design-data';

describe('learning path labels', () => {
  it('has a short label for every lesson, and none for lessons that no longer exist', () => {
    expect(Object.keys(CONCEPT_PATH_LABELS).sort()).toEqual(CORE_CONCEPTS.map((c) => c.id).sort());
    expect(Object.keys(SYSTEM_PATH_LABELS).sort()).toEqual(
      SYSTEM_DESIGN_SYSTEMS.map((s) => s.id).sort(),
    );
  });
});
