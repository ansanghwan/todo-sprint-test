import { useSearchParams } from 'next/navigation';

import useAllGoals from '@/hooks/goal/useAllGoals';
import { usePathname, useRouter } from '@/i18n/navigation';
import { parseGoalId } from '../_lib/parseGoalId';

const GOAL_ID_PARAM = 'goalId';

/**
 * 달력의 목표 필터를 URL의 goalId와 맞춥니다. selectedGoalId가 null이면 전체 목표입니다.
 *   const { selectedGoalId, selectGoal } = useGoalFilter();
 */
const useGoalFilter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { goals } = useAllGoals();

  const requestedGoalId = parseGoalId(searchParams.get(GOAL_ID_PARAM));
  // 목표를 다 받기 전에는 URL의 goalId를 그대로 쓰고, 받은 뒤 목록에 없으면 전체 목표로 봅니다.
  const isUnknownGoal =
    goals !== undefined && !goals.some(({ id }) => id === requestedGoalId);

  const selectGoal = (goalId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (goalId === null) params.delete(GOAL_ID_PARAM);
    else params.set(GOAL_ID_PARAM, String(goalId));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return {
    selectedGoalId: isUnknownGoal ? null : requestedGoalId,
    selectGoal,
  };
};

export default useGoalFilter;
