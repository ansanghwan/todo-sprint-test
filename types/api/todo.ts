/** 할 일 API(GET /{teamId}/todos) 응답 DTO입니다. 서버 스펙을 그대로 따릅니다. */
import type { TodoGoal, TodoTag } from '@/types/todo';

export interface TodoDto {
  id: number;
  teamId: string;
  userId: number;
  goalId: number | null;
  title: string;
  done: boolean;
  fileUrl: string | null;
  linkUrl: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  goal: TodoGoal | null;
  noteIds: number[];
  tags: TodoTag[];
  isFavorite: boolean;
}

export interface TodoPageDto {
  todos: TodoDto[];
  nextCursor: number | null;
  totalCount: number;
}

/** 할 일 생성(POST /{teamId}/todos) 요청 본문입니다. title 외에는 서버에서 선택값입니다. */
export interface CreateTodoRequestDto {
  title: string;
  goalId?: number;
  fileUrl?: string;
  linkUrl?: string;
  /** ISO 8601 */
  dueDate?: string;
  tags?: string[];
}
