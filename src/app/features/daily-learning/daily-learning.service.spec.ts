import { TestBed } from '@angular/core/testing';
import type { CategoryModel } from '@features/questions/question';
import { DailyLearningService } from './daily-learning.service';

const category = (id: string, n: number): CategoryModel => ({
  id,
  icon: 'ti-x',
  title: id,
  color: '#000',
  bg: '#fff',
  questions: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i}`, text: `${id} q${i}` })),
});

describe('DailyLearningService', () => {
  let service: DailyLearningService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(DailyLearningService);
  });

  it('picks the same 10 distinct questions for the same day', () => {
    const cats = [category('a', 30), category('b', 30)];
    const first = service.generateSession('random', cats).questions.map((q) => q.id);
    const second = service.generateSession('random', cats).questions.map((q) => q.id);
    expect(first).toHaveLength(10);
    expect(new Set(first).size).toBe(10);
    expect(first.every(Boolean)).toBe(true);
    expect(second).toEqual(first);
  });

  it('tops up small topics in mixed mode', () => {
    const cats = [category('small', 2), category('big', 20)];
    const s = service.generateSession('mixed', cats, ['small', 'big']);
    expect(s.questions).toHaveLength(10);
    expect(s.questions.filter((q) => q.categoryId === 'small')).toHaveLength(2);
  });

  it('ignores a corrupt saved session', () => {
    localStorage.setItem(`daily_session_${service.today()}`, '{"date":"x"}');
    expect(service.loadTodaySession()).toBeNull();
    expect(service.session()).toBeNull();
  });

  it('starts a streak when every question is done', () => {
    service.generateSession('single', [category('a', 3)], ['a']);
    [0, 1, 2].forEach((i) => service.toggleComplete(i));
    expect(service.isComplete()).toBe(true);
    expect(service.streak()).toBe(1);
  });
});
