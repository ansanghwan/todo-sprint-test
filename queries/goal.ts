import { infiniteQueryOptions } from '@tanstack/react-query';

import { getGoals, type GetGoalsParams } from '@/lib/api/goals';

export type GoalListParams = Omit<GetGoalsParams, 'cursor'>;

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (params: GoalListParams) => [...goalKeys.lists(), params] as const,
};

export const goalQueries = {
  list: (params: GoalListParams) =>
    infiniteQueryOptions({
      queryKey: goalKeys.list(params),
      queryFn: ({ pageParam, signal }) =>
        getGoals({ ...params, cursor: pageParam }, signal),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
};
