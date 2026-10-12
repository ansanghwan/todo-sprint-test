import axios, {
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';

import { api } from '@/lib/api/client-fetcher';
import type { GoalDto, GoalPageDto } from '@/types/api/goal';
import type {
  CreateTodoRequestDto,
  TodoDto,
  TodoPageDto,
} from '@/types/api/todo';

const TITLES = [
  '사용자 데이터 렌더링 구현',
  '자바스크립트 기초 챕터4 듣기',
  '개발 폴더 구조 세팅 (src, public, components)',
  '실제 디자인 시스템 사례 조사 (예: Polaris, Carbon 등)',
  '로그인/회원가입 폼 만들기',
];

const GOAL_TITLES = [
  '자바스크립트로 웹 서비스 만들기',
  '디자인 시스템 강의 수강하기',
  '프론트엔드 면접 준비하기',
];

export const makeTodo = (
  id: number,
  overrides: Partial<TodoDto> = {},
): TodoDto => ({
  id,
  teamId: 'team',
  userId: 1,
  goalId: null,
  title: TITLES[(id - 1) % TITLES.length],
  done: id % 3 === 0,
  fileUrl: null,
  linkUrl: id % 2 === 0 ? 'https://example.com' : null,
  dueDate: null,
  createdAt: '2026-09-28T09:00:00.000Z',
  updatedAt: '2026-09-28T09:00:00.000Z',
  goal: null,
  noteIds: id % 4 === 0 ? [id] : [],
  tags: [],
  isFavorite: id % 5 === 0,
  ...overrides,
});

export const makeGoal = (
  id: number,
  overrides: Partial<GoalDto> = {},
): GoalDto => ({
  id,
  teamId: 'team',
  userId: 1,
  title: `${GOAL_TITLES[(id - 1) % GOAL_TITLES.length]} ${id}`,
  createdAt: '2026-09-28T09:00:00.000Z',
  updatedAt: '2026-09-28T09:00:00.000Z',
  todoCount: 0,
  completedCount: 0,
  ...overrides,
});

/** mock 업로드 주소. 이 주소로 가는 PUT만 가로챕니다. */
const MOCK_UPLOAD_ORIGIN = 'https://mock-upload.invalid';

interface MockTodosApiOptions {
  totalCount: number;
  /** false면 완료된 할 일이 없어 DONE 탭이 비어 있습니다. */
  hasDone?: boolean;
  /** 몇 번째 GET /todos 요청(0부터)을 실패시킬지 */
  failAt?: number;
  /** 응답을 보내지 않고 로딩 상태로 둡니다. */
  isPending?: boolean;
  delay?: number;
  /** 목표 개수. 서버 기본값처럼 10개씩 나눠 줍니다. */
  goalCount?: number;
  /** GET /goals를 실패시킵니다. */
  failGoals?: boolean;
  /** POST /todos를 실패시킵니다. */
  failCreate?: boolean;
  /** 이미지 업로드(PUT)를 실패시킵니다. */
  failUpload?: boolean;
  /** 수정·삭제·찜 요청을 모두 실패시킵니다. */
  failMutations?: boolean;
}

/** 배열을 cursor(다음에 줄 항목의 1부터 센 위치)로 잘라 줍니다. */
const paginate = <T>(items: T[], cursor: number | undefined, limit: number) => {
  const start = (cursor ?? 1) - 1;
  const end = start + limit;

  return {
    page: items.slice(start, end),
    nextCursor: end < items.length ? end + 1 : null,
  };
};

const ok = (data: unknown, config: InternalAxiosRequestConfig, status = 200) =>
  ({ data, status, statusText: '', headers: {}, config }) as const;

const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

/**
 * axios adapter를 바꿔 할 일 화면이 쓰는 API를 흉내 냅니다.
 * - GET /todos: done으로 거르고 최신순(만든 순서의 반대)으로 돌려줍니다.
 * - GET /goals: 10개씩 돌려줍니다.
 * - POST /images, 업로드 PUT, POST /todos: 생성한 할 일을 목록 맨 앞에 넣습니다.
 * - PATCH·DELETE /todos/{id}, POST·DELETE /todos/{id}/favorites: 메모리의 할 일을 바꿉니다.
 * 브라우저 Network 탭에는 잡히지 않으므로 요청마다 콘솔에 [mock ...]으로 남깁니다.
 * 되돌리는 함수를 반환합니다.
 */
export const mockTodosApi = ({
  totalCount,
  hasDone = true,
  failAt,
  isPending = false,
  delay = 400,
  goalCount = 25,
  failGoals = false,
  failCreate = false,
  failUpload = false,
  failMutations = false,
}: MockTodosApiOptions) => {
  const originalAdapter = api.defaults.adapter;
  const originalUploadAdapter = axios.defaults.adapter;
  let todoRequestCount = 0;
  let nextTodoId = totalCount + 1;
  const todos = Array.from({ length: totalCount }, (_, i) =>
    makeTodo(i + 1, hasDone ? {} : { done: false }),
  );
  const goals = Array.from({ length: goalCount }, (_, i) => makeGoal(i + 1));

  const getTodosResponse = async (config: InternalAxiosRequestConfig) => {
    const requestIndex = todoRequestCount;
    todoRequestCount += 1;
    const done: string | undefined = config.params?.done;
    const label = `[mock GET /todos] 요청 #${requestIndex + 1} done=${done ?? '없음'} cursor=${config.params?.cursor ?? '없음'}`;

    if (isPending) {
      console.info(`${label} → 응답 없음(로딩 유지)`);
      return new Promise<never>(() => {});
    }
    await wait(delay);
    if (requestIndex === failAt) {
      console.info(`${label} → 실패`);
      throw new Error('mock network error');
    }

    const filtered = done
      ? todos.filter((todo) => String(todo.done) === done)
      : todos;
    const { page, nextCursor } = paginate(
      filtered,
      config.params?.cursor,
      config.params?.limit ?? 40,
    );
    const data: TodoPageDto = {
      todos: page,
      nextCursor,
      totalCount: filtered.length,
    };
    console.info(`${label} → ${page.length}개, nextCursor=${nextCursor}`);
    return ok(data, config);
  };

  const getGoalsResponse = async (config: InternalAxiosRequestConfig) => {
    const label = `[mock GET /goals] cursor=${config.params?.cursor ?? '없음'}`;
    await wait(delay);
    if (failGoals) {
      console.info(`${label} → 실패`);
      throw new Error('mock network error');
    }
    const { page, nextCursor } = paginate(
      goals,
      config.params?.cursor,
      config.params?.limit ?? 10,
    );
    const data: GoalPageDto = {
      goals: page,
      nextCursor,
      totalCount: goals.length,
    };
    console.info(`${label} → ${page.length}개, nextCursor=${nextCursor}`);
    return ok(data, config);
  };

  const createImageUrlResponse = async (config: InternalAxiosRequestConfig) => {
    const { fileName } = JSON.parse(config.data) as { fileName: string };
    await wait(delay);
    console.info(`[mock POST /images] fileName=${fileName}`);
    return ok(
      {
        uploadUrl: `${MOCK_UPLOAD_ORIGIN}/upload/${fileName}`,
        url: `${MOCK_UPLOAD_ORIGIN}/files/${fileName}`,
      },
      config,
    );
  };

  const createTodoResponse = async (config: InternalAxiosRequestConfig) => {
    const body = JSON.parse(config.data) as CreateTodoRequestDto;
    await wait(delay);
    if (failCreate) {
      console.info('[mock POST /todos] → 실패');
      throw new Error('mock network error');
    }
    const goal = goals.find(({ id }) => id === body.goalId);
    const todo = makeTodo(nextTodoId, {
      title: body.title,
      done: false,
      isFavorite: false,
      noteIds: [],
      goalId: body.goalId ?? null,
      goal: goal ? { id: goal.id, title: goal.title } : null,
      dueDate: body.dueDate ?? null,
      linkUrl: body.linkUrl ?? null,
      fileUrl: body.fileUrl ?? null,
      tags: (body.tags ?? []).map((name, index) => ({ id: index + 1, name })),
    });
    nextTodoId += 1;
    // 최신순 목록이라 맨 앞에 넣습니다.
    todos.unshift(todo);
    console.info(`[mock POST /todos] → id=${todo.id}`, body);
    return ok(todo, config, 201);
  };

  // /todos/{id} 또는 /todos/{id}/favorites
  const mutateTodoResponse = async (
    config: InternalAxiosRequestConfig,
    method: string,
  ) => {
    const label = `[mock ${method} ${config.url}]`;
    await wait(delay);
    if (failMutations) {
      console.info(`${label} → 실패`);
      throw new Error('mock network error');
    }

    const [, , id, sub] = config.url?.split('/') ?? [];
    const index = todos.findIndex((todo) => todo.id === Number(id));
    if (sub === 'favorites') {
      todos[index].isFavorite = method === 'POST';
    } else if (method === 'PATCH') {
      Object.assign(todos[index], JSON.parse(config.data ?? '{}'));
    } else if (method === 'DELETE') {
      todos.splice(index, 1);
    }
    console.info(`${label} ${config.data ?? ''} → 성공`);
    return ok('', config, 204);
  };

  const adapter: AxiosAdapter = (config) => {
    const method = config.method?.toUpperCase() ?? 'GET';

    if (config.url === '/todos' && method === 'GET') {
      return getTodosResponse(config);
    }
    if (config.url === '/todos' && method === 'POST') {
      return createTodoResponse(config);
    }
    if (config.url === '/goals' && method === 'GET') {
      return getGoalsResponse(config);
    }
    if (config.url === '/images' && method === 'POST') {
      return createImageUrlResponse(config);
    }
    if (config.url?.startsWith('/todos/')) {
      return mutateTodoResponse(config, method);
    }
    return Promise.reject(
      new Error(`mock에 없는 요청입니다: ${method} ${config.url}`),
    );
  };

  // presigned URL 업로드는 api 인스턴스가 아닌 기본 axios로 나가므로 따로 가로챕니다.
  const uploadAdapter: AxiosAdapter = async (config) => {
    if (!config.url?.startsWith(MOCK_UPLOAD_ORIGIN)) {
      return Promise.reject(
        new Error(`mock에 없는 요청입니다: ${config.method} ${config.url}`),
      );
    }
    await wait(delay);
    if (failUpload) {
      console.info('[mock PUT upload] → 실패');
      throw new Error('mock upload error');
    }
    console.info(`[mock PUT upload] ${config.url}`);
    return ok(null, config);
  };

  api.defaults.adapter = adapter;
  axios.defaults.adapter = uploadAdapter;
  return () => {
    api.defaults.adapter = originalAdapter;
    axios.defaults.adapter = originalUploadAdapter;
  };
};
