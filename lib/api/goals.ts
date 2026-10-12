import type {
  CreateGoalRequest,
  CreatedGoalDto,
  GoalPageDto,
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
