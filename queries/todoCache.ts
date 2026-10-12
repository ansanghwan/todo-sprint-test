import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query';

import type { TodoDto, TodoPageDto } from '@/types/api/todo';
import { todoKeys } from './todo';

type TodoListData = InfiniteData<TodoPageDto, number | undefined>;

/** 되돌릴 때 쓰는 목록 캐시 사본 */
export type TodoListSnapshot = [QueryKey, TodoListData | undefined][];

/** 캐시된 모든 할 일 목록(탭별 포함)의 현재 상태를 저장합니다. */
export const snapshotTodoLists = (queryClient: QueryClient): TodoListSnapshot =>
  queryClient.getQueriesData<TodoListData>({ queryKey: todoKeys.lists() });

export const restoreTodoLists = (
  queryClient: QueryClient,
  snapshot: TodoListSnapshot,
) => {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

/** 캐시된 모든 할 일 목록에서 해당 할 일의 필드를 바꿉니다. */
export const updateTodoInLists = (
  queryClient: QueryClient,
  todoId: number,
  patch: Partial<TodoDto>,
) => {
  queryClient.setQueriesData<TodoListData>(
    { queryKey: todoKeys.lists() },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          todos: page.todos.map((todo) =>
            todo.id === todoId ? { ...todo, ...patch } : todo,
          ),
        })),
      },
  );
};

/** 캐시된 목록에서 할 일을 빼고, 그 할 일이 있던 목록의 전체 개수를 1 줄입니다. */
export const removeTodoFromLists = (
  queryClient: QueryClient,
  todoId: number,
) => {
  queryClient.setQueriesData<TodoListData>(
    { queryKey: todoKeys.lists() },
    (data) => {
      const hasTodo = data?.pages.some((page) =>
        page.todos.some((todo) => todo.id === todoId),
      );
      if (!data || !hasTodo) {
        return data;
      }
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          todos: page.todos.filter((todo) => todo.id !== todoId),
          totalCount: Math.max(page.totalCount - 1, 0),
        })),
      };
    },
  );
};
