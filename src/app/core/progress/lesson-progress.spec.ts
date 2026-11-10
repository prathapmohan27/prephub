import { LessonProgressStore, lessonProgress } from './lesson-progress';

const lessons = [
  { id: 'a', sections: [{ id: 's1' }, { id: 's2' }] },
  { id: 'b', sections: [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }] },
];

describe('lesson progress', () => {
  beforeEach(() => localStorage.clear());

  it('ignores sections that no longer exist, so progress never exceeds 100%', () => {
    const p = lessonProgress(['s1', 's2'], { s1: true, s2: true, removed: true, old: true });
    expect(p).toEqual({ read: 2, total: 2, percent: 100 });
  });

  it('toggles, persists and totals progress', () => {
    const store = new LessonProgressStore('key', lessons);
    store.toggle('a', 's1');
    store.markAllRead(lessons[1]);
    expect(store.isRead('a', 's1')).toBe(true);
    expect(store.of(lessons[0])).toEqual({ read: 1, total: 2, percent: 50 });
    expect(store.overall()).toEqual({ read: 5, total: 6, percent: 83 });

    // A new store reads what the first one saved
    const reloaded = new LessonProgressStore('key', lessons);
    expect(reloaded.overall().read).toBe(5);

    reloaded.reset('b');
    expect(reloaded.overall().read).toBe(1);
  });

  it('starts empty when the saved value is not an object', () => {
    localStorage.setItem('key', '"oops"');
    expect(new LessonProgressStore('key', lessons).overall().read).toBe(0);
  });
});
