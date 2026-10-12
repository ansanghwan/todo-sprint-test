import useAllPages from '@/hooks/useAllPages';
import { todoQueries } from '@/queries/todo';

const CALENDAR_PAGE_LIMIT = 100;

interface UseCalendarTodosParams {
  /** YYYY-MM-DD (KST) */
  from: string;
  /** YYYY-MM-DD (KST) */
  to: string;
  goalId?: number;
}

/** 기간 안에 마감일이 있는 할 일 전체. 다 받기 전에는 todos가 undefined입니다. */
const useCalendarTodos = ({ from, to, goalId }: UseCalendarTodosParams) => {
  const { pages, ...state } = useAllPages(
    todoQueries.list({ from, to, goalId, limit: CALENDAR_PAGE_LIMIT }),
  );

  return { todos: pages?.flatMap((page) => page.todos), ...state };
};

export default useCalendarTodos;
