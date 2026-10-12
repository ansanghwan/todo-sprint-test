import useAllPages from '@/hooks/useAllPages';
import { goalQueries } from '@/queries/goal';

const GOAL_PAGE_LIMIT = 100;

/** 내 목표 전체. 다 받기 전에는 goals가 undefined입니다. */
const useAllGoals = () => {
  const { pages, ...state } = useAllPages(
    goalQueries.list({ limit: GOAL_PAGE_LIMIT }),
  );

  return { goals: pages?.flatMap((page) => page.goals), ...state };
};

export default useAllGoals;
