import { describe, expect, it } from 'vitest';

import { parseGoalId } from './parseGoalId';

describe('parseGoalId', () => {
  it.each([
    ['0', 0],
    ['12', 12],
  ])('0 이상의 정수(%s)는 숫자로 바꾼다', (value, expected) => {
    expect(parseGoalId(value)).toBe(expected);
  });

  it.each([null, '', ' ', 'abc', '-1', '1.5', '1e3'])(
    '그 밖의 값(%s)은 null이다',
    (value) => {
      expect(parseGoalId(value)).toBeNull();
    },
  );
});
