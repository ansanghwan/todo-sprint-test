import type {
  CreateGoalRequest,
  CreatedGoalDto,
  GoalPageDto,
  GoalDetailDto,
} from '@/types/api/goal';
import { request } from './client-fetcher';

export type GetGoalsParams = {
  cursor?: number;
  limit?: number;
};

export const getGoals = (params: GetGoalsParams, signal?: AbortSignal) =>
  request<GoalPageDto>({ url: '/goals', params, signal });

export const createGoal = (data: CreateGoalRequest) =>
  request<CreatedGoalDto>({ url: '/goals', method: 'POST', data });

export const getGoal = (goalId: number, signal?: AbortSignal) =>
  request<GoalDetailDto>({ url: `/goals/${goalId}`, signal });
