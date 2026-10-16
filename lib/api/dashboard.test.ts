import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, expect, it } from 'vitest';
import { api } from './client-fetcher';
import { getDashboardTodoData } from './dashboard';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

function installAdapter(
  respond: (config: InternalAxiosRequestConfig) => Promise<number>,
) {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    const totalCount = await respond(config);
    return {
      data: { todos: [], nextCursor: null, totalCount },
      status: 200,
      statusText: '',
      headers: {},
      config,
    };
  };
  api.defaults.adapter = adapter;
  return sent;
}

it.each([
  [3, 1, 33],
  [0, 0, 0],
  [2, 3, 100],
])(
  'reuses recent total %s with done %s to calculate %s using two requests',
  async (total, done, expected) => {
    const sent = installAdapter(async (config) =>
      config.params.done ? done : total,
    );
    const signal = new AbortController().signal;
    const data = getDashboardTodoData(signal);
    expect(await data.recentTodos).toEqual([]);
    expect(await data.progress).toBe(expected);
    expect(sent.map((config) => config.params)).toEqual([
      { sort: 'latest', limit: 4 },
      { limit: 1, done: 'true' },
    ]);
    expect(sent.every((config) => config.signal === signal)).toBe(true);
  },
);

it('starts both requests concurrently and renders recent data before progress finishes', async () => {
  let finishDone!: (value: number) => void;
  const sent = installAdapter((config) =>
    config.params.done
      ? new Promise((resolve) => {
          finishDone = resolve;
        })
      : Promise.resolve(4),
  );
  const data = getDashboardTodoData();
  expect(await data.recentTodos).toEqual([]);
  expect(sent).toHaveLength(2);
  finishDone(1);
  expect(await data.progress).toBe(25);
});

it('keeps recent data when the done-count request fails', async () => {
  installAdapter(async (config) => {
    if (config.params.done) throw new Error('done failed');
    return 3;
  });
  const data = getDashboardTodoData();
  const result = await Promise.allSettled([data.recentTodos, data.progress]);
  expect(result[0]).toEqual({ status: 'fulfilled', value: [] });
  expect(result[1].status).toBe('rejected');
});

it('falls back to total-only lookup when recent data fails', async () => {
  const sent = installAdapter(async (config) => {
    if (config.params.sort) throw new Error('recent failed');
    return config.params.done ? 1 : 4;
  });
  const data = getDashboardTodoData();
  const result = await Promise.allSettled([data.recentTodos, data.progress]);
  expect(result[0].status).toBe('rejected');
  expect(result[1]).toEqual({ status: 'fulfilled', value: 25 });
  expect(sent).toHaveLength(3);
});

it('does not send a fallback request after cancellation', async () => {
  const controller = new AbortController();
  const sent = installAdapter(async (config) => {
    if (config.params.sort) {
      controller.abort();
      throw new Error('cancelled');
    }
    return 0;
  });
  const data = getDashboardTodoData(controller.signal);
  const result = await Promise.allSettled([data.recentTodos, data.progress]);
  expect(result.every((entry) => entry.status === 'rejected')).toBe(true);
  expect(
    sent.some((config) => !config.params.sort && !config.params.done),
  ).toBe(false);
});
