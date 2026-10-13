import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import {
  getFavoriteTodos,
  getTodo,
  getTodos,
  type GetTodosParams,
} from '@/lib/api/todos';
import type { TodoDto } from '@/types/api/todo';

export type TodoListParams = Omit<GetTodosParams, 'cursor'>;

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (params: TodoListParams) => [...todoKeys.lists(), params] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (todoId: number) => [...todoKeys.details(), todoId] as const,
  // 응답 모양이 일반 목록과 달라 lists() 아래에 두지 않습니다.
  favorites: () => [...todoKeys.all, 'favorites'] as const,
};

/** 찜한 할 일 전체. 화면에서 상태·목표로 거르므로 모든 페이지를 받아 둡니다. */
export interface FavoriteTodosData {
  todos: TodoDto[];
  totalCount: number;
}

/** 서버가 허용하는 최대 limit */
const FAVORITES_PAGE_LIMIT = 100;

/**
 * nextCursor가 없을 때까지 차례로 받습니다.
 * 한 페이지라도 실패하면 전체를 실패로 보아, 덜 받은 목록을 "없음"으로 보여 주지 않습니다.
 */
const getAllFavoriteTodos = async (
  signal?: AbortSignal,
): Promise<FavoriteTodosData> => {
  const todos: TodoDto[] = [];
  let cursor: number | undefined;
  let totalCount = 0;

  do {
    const page = await getFavoriteTodos(
      { cursor, limit: FAVORITES_PAGE_LIMIT },
      signal,
    );
    todos.push(...page.favorites.map((favorite) => favorite.todo));
    totalCount = page.totalCount;
    cursor = page.nextCursor ?? undefined;
  } while (cursor !== undefined);

  return { todos, totalCount };
};

export const todoQueries = {
  list: (params: TodoListParams) =>
    infiniteQueryOptions({
      queryKey: todoKeys.list(params),
      queryFn: ({ pageParam, signal }) =>
        getTodos({ ...params, cursor: pageParam }, signal),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  detail: (todoId: number) =>
    queryOptions({
      queryKey: todoKeys.detail(todoId),
      queryFn: ({ signal }) => getTodo(todoId, signal),
    }),
  favorites: () =>
    queryOptions({
      queryKey: todoKeys.favorites(),
      queryFn: ({ signal }) => getAllFavoriteTodos(signal),
    }),
};
