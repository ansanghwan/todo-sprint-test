const GOAL_ID_PATTERN = /^\d+$/;

/** URL의 goalId 값을 숫자로 바꿉니다. 0 이상의 정수가 아니면 null입니다. */
export const parseGoalId = (value: string | null) =>
  value !== null && GOAL_ID_PATTERN.test(value) ? Number(value) : null;
