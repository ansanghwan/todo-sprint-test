import { describe, expect, it } from 'vitest';

import { getTagColor } from './tagColors';

describe('getTagColor', () => {
  it('순서대로 초록 → 노랑 → 빨강을 반복한다', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(getTagColor)).toEqual([
      'green',
      'yellow',
      'red',
      'green',
      'yellow',
      'red',
      'green',
    ]);
  });
});
