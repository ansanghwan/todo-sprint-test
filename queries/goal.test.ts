import { describe, expect, it } from 'vitest';

import type { GoalPageDto } from '@/types/api/goal';
import { goalKeys, goalQueries } from './goal';

const page = (nextCursor: number | null): GoalPageDto => ({
  goals: [],
  nextCursor,
  totalCount: 0,
});

describe('goalQueries', () => {
  it('목록 key는 goalKeys.lists() 아래에 묶이고 조회 조건이 들어간다', () => {
    const { queryKey } = goalQueries.list({ limit: 20 });
    expect(queryKey.slice(0, 2)).toEqual([...goalKeys.lists()]);
    expect(queryKey).toContainEqual({ limit: 20 });
  });

  it('nextCursor가 null이면 다음 페이지를 요청하지 않는다', () => {
    const { getNextPageParam } = goalQueries.list({ limit: 20 });
    expect(getNextPageParam(page(21), [], undefined, [])).toBe(21);
    expect(getNextPageParam(page(null), [], undefined, [])).toBeUndefined();
  });
});
