import type { TodoDto } from '@/types/api/todo';
import type { TodoStatus } from '../../todos/_components/todoListParams';

/** 목표 필터 값. 'all'은 전체 목표입니다. */
export type FavoriteGoalFilterValue = 'all' | number;

/**
 * 찜한 할 일을 화면에서 거릅니다.
 * FN-FV-03: 완료 상태는 todo.done, FN-FV-04: 목표는 todo.goal.id 기준입니다.
 */
export const filterFavoriteTodos = (
  todos: TodoDto[],
  status: TodoStatus,
  goalId: FavoriteGoalFilterValue,
) =>
  todos.filter((todo) => {
    if (status === 'todo' && todo.done) return false;
    if (status === 'done' && !todo.done) return false;
    if (goalId !== 'all' && todo.goal?.id !== goalId) return false;
    return true;
  });
