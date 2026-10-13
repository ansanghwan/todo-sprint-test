import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getGoal, getGoals, type GetGoalsParams } from '@/lib/api/goals';

export type GoalListParams = Omit<GetGoalsParams, 'cursor'>;

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (params: GoalListParams) => [...goalKeys.lists(), params] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (goalId: number) => [...goalKeys.details(), goalId] as const,
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
  detail: (goalId: number) =>
    queryOptions({
      queryKey: goalKeys.detail(goalId),
      queryFn: ({ signal }) => getGoal(goalId, signal),
    }),
};
