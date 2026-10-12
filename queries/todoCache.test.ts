import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import type { TodoPageDto } from '@/types/api/todo';
import { makeTodo } from '@/test/todoMocks';
import { todoKeys } from './todo';
import {
  removeTodoFromLists,
  restoreTodoLists,
  snapshotTodoLists,
  updateTodoInLists,
} from './todoCache';

const ALL_KEY = todoKeys.list({ sort: 'latest', limit: 40 });
const TODO_KEY = todoKeys.list({ sort: 'latest', limit: 40, done: 'false' });

const infinite = (
  pages: TodoPageDto[],
): InfiniteData<TodoPageDto, number | undefined> => ({
  pages,
  pageParams: pages.map((_, i) => (i === 0 ? undefined : i * 40 + 1)),
});

const setup = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    ALL_KEY,
    infinite([
      { todos: [makeTodo(1), makeTodo(2)], nextCursor: 3, totalCount: 3 },
      { todos: [makeTodo(3)], nextCursor: null, totalCount: 3 },
    ]),
  );
  queryClient.setQueryData(
    TODO_KEY,
    infinite([{ todos: [makeTodo(1)], nextCursor: null, totalCount: 1 }]),
  );
  const read = (key: readonly unknown[]) =>
    queryClient.getQueryData<InfiniteData<TodoPageDto>>(key)!;
  return { queryClient, read };
};

describe('todoCache', () => {
  it('updateTodoInLists는 탭별로 캐시된 모든 목록에서 같은 할 일을 바꾼다', () => {
    const { queryClient, read } = setup();

    updateTodoInLists(queryClient, 1, { done: true });

    expect(read(ALL_KEY).pages[0].todos[0].done).toBe(true);
    expect(read(TODO_KEY).pages[0].todos[0].done).toBe(true);
    expect(read(ALL_KEY).pages[0].todos[1].done).toBe(makeTodo(2).done);
  });

  it('removeTodoFromLists는 할 일이 있던 목록에서만 빼고 전체 개수를 1 줄인다', () => {
    const { queryClient, read } = setup();

    removeTodoFromLists(queryClient, 3);

    expect(read(ALL_KEY).pages[1].todos).toEqual([]);
    expect(read(ALL_KEY).pages.map((page) => page.totalCount)).toEqual([2, 2]);
    expect(read(TODO_KEY).pages[0].totalCount).toBe(1);
  });

  it('snapshot으로 바꾸기 전 상태로 되돌린다', () => {
    const { queryClient, read } = setup();
    const snapshot = snapshotTodoLists(queryClient);

    updateTodoInLists(queryClient, 1, { isFavorite: true });
    restoreTodoLists(queryClient, snapshot);

    expect(read(ALL_KEY).pages[0].todos[0].isFavorite).toBe(
      makeTodo(1).isFavorite,
    );
  });
});
