import type {
  CreateTodoRequestDto,
  TodoDto,
  TodoPageDto,
} from '@/types/api/todo';
import { request, requestVoid } from './client-fetcher';

export type TodoSortType = 'latest' | 'dueSoon';

export type GetTodosParams = {
  cursor?: number;
  limit?: number;
  sort?: TodoSortType;
  goalId?: number;
  keyword?: string;
  /** 서버가 문자열 'true' | 'false'로 받습니다. */
  done?: 'true' | 'false';
  /** 마감일 범위 시작 (KST, 해당일 포함, YYYY-MM-DD) */
  from?: string;
  /** 마감일 범위 끝 (KST, 해당일 포함, YYYY-MM-DD) */
  to?: string;
};

export const getTodos = (params: GetTodosParams, signal?: AbortSignal) =>
  request<TodoPageDto>({ url: '/todos', params, signal });

export const getTodo = (todoId: number, signal?: AbortSignal) =>
  request<TodoDto>({ url: `/todos/${todoId}`, signal });

/** 최근 등록한 할 일을 서버에서 최신순으로 최대 4개 조회합니다. */
export async function getRecentTodos(signal?: AbortSignal): Promise<TodoDto[]> {
  const data = await getTodos({ sort: 'latest', limit: 4 }, signal);
  return data.todos;
}

/**
 * 특정 목표의 할 일을 최신순으로 10개씩 조회합니다.
 * signal: 요청 취소, cursor: 다음 조회 위치(첫 조회에서는 생략)
 * done: 완료 여부 필터, keyword: 제목 검색어(생략하면 기본 목록)
 */
export async function getGoalTodos(
  goalId: number,
  signal?: AbortSignal,
  cursor?: number,
  done?: boolean,
  keyword?: string,
): Promise<TodoPageDto> {
  const data = await getTodos(
    {
      goalId,
      keyword: keyword?.trim() || undefined,
      sort: 'latest',
      limit: 10,
      cursor,
      done: done === undefined ? undefined : done ? 'true' : 'false',
    },
    signal,
  );

  // 추가 조회에 필요한 nextCursor를 함께 반환합니다.
  return data;
}

/** 전체 할 일 중 완료한 할 일의 비율을 정수 퍼센트로 반환합니다. */
export async function getTodoProgress(signal?: AbortSignal): Promise<number> {
  // 개수(totalCount)만 필요하므로 목록은 각 요청에서 최소 1개만 받습니다.
  const [allResponse, doneResponse] = await Promise.all([
    getTodos({ limit: 1 }, signal),
    getTodos({ limit: 1, done: 'true' }, signal),
  ]);

  const totalCount = allResponse.totalCount;
  const doneCount = doneResponse.totalCount;
  if (totalCount === 0) return 0;

  // 두 요청 사이에 데이터가 변경되더라도 차트 범위(0~100)를 벗어나지 않게 합니다.
  return Math.min(100, Math.max(0, Math.round((doneCount / totalCount) * 100)));
}

export const createTodo = (body: CreateTodoRequestDto) =>
  request<TodoDto>({ url: '/todos', method: 'POST', data: body });

/** PATCH /todos/{todoId} 본문. 보낸 필드만 수정되고 tags는 전체 교체됩니다. */
export type UpdateTodoBody = Partial<{
  title: string;
  done: boolean;
  goalId: number | null;
  fileUrl: string | null;
  linkUrl: string | null;
  dueDate: string | null;
  tags: string[];
}>;

// 수정·삭제·찜 응답 본문은 쓰지 않고, 성공 후 목록을 다시 받아 맞춥니다.
export const updateTodo = (todoId: number, body: UpdateTodoBody) =>
  requestVoid({ method: 'PATCH', url: `/todos/${todoId}`, data: body });

export const deleteTodo = (todoId: number) =>
  requestVoid({ method: 'DELETE', url: `/todos/${todoId}` });

export const addTodoFavorite = (todoId: number) =>
  requestVoid({ method: 'POST', url: `/todos/${todoId}/favorites` });

export const removeTodoFavorite = (todoId: number) =>
  requestVoid({ method: 'DELETE', url: `/todos/${todoId}/favorites` });
