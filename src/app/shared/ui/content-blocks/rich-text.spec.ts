import { toSegments } from './rich-text';

describe('toSegments', () => {
  it('splits plain, code and bold text', () => {
    expect(toSegments('a `b` **c** d')).toEqual([
      { kind: 'text', value: 'a ' },
      { kind: 'code', value: 'b' },
      { kind: 'text', value: ' ' },
      { kind: 'bold', value: 'c' },
      { kind: 'text', value: ' d' },
    ]);
  });

  it('keeps markup-looking text as plain text', () => {
    expect(toSegments('<script>x</script>')).toEqual([
      { kind: 'text', value: '<script>x</script>' },
    ]);
  });
});
