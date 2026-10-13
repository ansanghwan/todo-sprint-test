import type {
  CreateGoalRequest,
  CreatedGoalDto,
  GoalPageDto,
  GoalDetailDto,
} from '@/types/api/goal';
import { request, requestVoid } from './client-fetcher';

export type GetGoalsParams = {
  cursor?: number;
  limit?: number;
};

export const getGoals = (params: GetGoalsParams, signal?: AbortSignal) =>
  request<GoalPageDto>({ url: '/goals', params, signal });

export const createGoal = (data: CreateGoalRequest) =>
  request<CreatedGoalDto>({ url: '/goals', method: 'POST', data });

// 목표상세
export const getGoal = (goalId: number, signal?: AbortSignal) =>
  request<GoalDetailDto>({
    url: `/goals/${goalId}`,
    signal,
  });

// 각 부분의 의미는 다음과 같습니다.
// - goalId: 조회할 목표 ID
// - url: ID가 3이면 /goals/3에 요청
// - request<GoalDetailDto>: 응답이 앞서 정의한 목표 상세 타입임을 표시
// - signal: 페이지 이동 등으로 필요 없어진 요청을 취소할 때 사용
// 기존 getGoals처럼 GET 요청이 기본값이어서 method는 생략했습니다.
// 여기까지는 요청 함수를 정의한 단계입니다. 다음으로 이 함수를 React Query에 연결한 뒤 화면에서 호출하겠습니다. 작성 후 코드를 공유해주세요.

/** 목표명만 수정합니다. 응답에는 todos가 포함되지 않습니다. */
export const updateGoal = (goalId: number, data: CreateGoalRequest) =>
  request<CreatedGoalDto>({ url: `/goals/${goalId}`, method: 'PATCH', data });

/** 목표만 삭제하며 연결된 할 일은 서버에서 유지합니다. */
export const deleteGoal = (goalId: number) =>
  requestVoid({ url: `/goals/${goalId}`, method: 'DELETE' });
