import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';

import { api } from './client-fetcher';
import {
  addTodoFavorite,
  createTodo,
  deleteTodo,
  getTodos,
  getGoalTodos,
  getRecentTodos,
  getTodoProgress,
  removeTodoFavorite,
  updateTodo,
} from './todos';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const todo = {
  id: 1,
  teamId: 'team',
  userId: 1,
  goalId: null,
  title: '할 일',
  done: false,
  fileUrl: null,
  linkUrl: null,
  dueDate: null,
  createdAt: '2026-09-28T09:00:00.000Z',
  updatedAt: '2026-09-28T09:00:00.000Z',
  goal: null,
  noteIds: [],
  tags: [],
  isFavorite: false,
};

const replyWith = (data: unknown) => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return { data, status: 200, statusText: '', headers: {}, config };
  };
  api.defaults.adapter = adapter;
  return sent;
};

describe('getTodos', () => {
  it('/todos로 정렬·개수·커서 파라미터를 보낸다', async () => {
    const sent = replyWith({ todos: [todo], nextCursor: 41, totalCount: 90 });

    const page = await getTodos({ sort: 'latest', limit: 40, cursor: 1 });

    expect(sent[0].url).toBe('/todos');
    expect(sent[0].params).toEqual({ sort: 'latest', limit: 40, cursor: 1 });
    expect(page.nextCursor).toBe(41);
    expect(page.totalCount).toBe(90);
  });
});

describe('대시보드 할 일 조회', () => {
  it('최근 목록은 최신순 4개로 요청하고 목록만 반환한다', async () => {
    const sent = replyWith({ todos: [todo], nextCursor: null, totalCount: 1 });
    const signal = new AbortController().signal;
    expect(await getRecentTodos(signal)).toEqual([todo]);
    expect(sent[0].params).toEqual({ sort: 'latest', limit: 4 });
    expect(sent[0].signal).toBe(signal);
  });

  it('목표 검색의 미완료 필터와 커서, 요청 취소 신호를 유지한다', async () => {
    const response = { todos: [todo], nextCursor: 42, totalCount: 20 };
    const sent = replyWith(response);
    const signal = new AbortController().signal;
    expect(await getGoalTodos(7, signal, 12, false, '  검색  ')).toEqual(
      response,
    );
    expect(sent[0].params).toEqual({
      goalId: 7,
      keyword: '검색',
      sort: 'latest',
      limit: 10,
      cursor: 12,
      done: 'false',
    });
    expect(sent[0].signal).toBe(signal);
  });

  it.each([
    [3, 1, 33],
    [0, 0, 0],
    [2, 3, 100],
  ])(
    '전체 %s개, 완료 %s개의 진행률은 %s이다',
    async (total, done, expected) => {
      api.defaults.adapter = async (config) => ({
        data: {
          todos: [],
          nextCursor: null,
          totalCount: config.params.done === 'true' ? done : total,
        },
        status: 200,
        statusText: '',
        headers: {},
        config,
      });
      expect(await getTodoProgress()).toBe(expected);
    },
  );
});

describe('createTodo', () => {
  it('POST /todos로 요청 본문을 보내고 생성된 할 일을 돌려준다', async () => {
    const sent = replyWith({ ...todo, id: 7, title: '새 할 일' });
    const body = {
      title: '새 할 일',
      goalId: 3,
      dueDate: '2026-10-10T23:59:59+09:00',
      tags: ['공부'],
    };

    const created = await createTodo(body);

    expect(sent[0].url).toBe('/todos');
    expect(sent[0].method).toBe('post');
    expect(JSON.parse(sent[0].data)).toEqual(body);
    expect(created.id).toBe(7);
  });
});

describe('할 일 변경 요청', () => {
  it('updateTodo는 보낸 필드만 PATCH /todos/{id}로 보낸다', async () => {
    const sent = replyWith(todo);

    await updateTodo(7, { done: true });

    expect(sent[0].method).toBe('patch');
    expect(sent[0].url).toBe('/todos/7');
    expect(JSON.parse(sent[0].data)).toEqual({ done: true });
  });

  it.each([
    ['deleteTodo', () => deleteTodo(7), 'delete', '/todos/7'],
    ['addTodoFavorite', () => addTodoFavorite(7), 'post', '/todos/7/favorites'],
    [
      'removeTodoFavorite',
      () => removeTodoFavorite(7),
      'delete',
      '/todos/7/favorites',
    ],
  ])('%s는 %s %s로 보낸다', async (_name, call, method, url) => {
    const sent = replyWith('');

    await call();

    expect(sent[0].method).toBe(method);
    expect(sent[0].url).toBe(url);
  });
});
