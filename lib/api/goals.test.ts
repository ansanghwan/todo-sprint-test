import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';

import { api } from './client-fetcher';
import { createGoal, getGoals } from './goals';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('getGoals', () => {
  it('/goals로 개수·커서 파라미터를 보낸다', async () => {
    const sent: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      sent.push(config);
      return {
        data: { goals: [], nextCursor: 21, totalCount: 30 },
        status: 200,
        statusText: '',
        headers: {},
        config,
      };
    };
    api.defaults.adapter = adapter;

    const page = await getGoals({ limit: 20, cursor: 1 });

    expect(sent[0].url).toBe('/goals');
    expect(sent[0].params).toEqual({ limit: 20, cursor: 1 });
    expect(page.nextCursor).toBe(21);
  });
});

it('목표 생성은 POST /goals에 제목을 보내고 집계 없는 생성 응답을 반환한다', async () => {
  const created = {
    id: 3,
    teamId: 'team-abc',
    userId: 1,
    title: '프로젝트 완성',
    createdAt: '',
    updatedAt: '',
  };
  let sent: InternalAxiosRequestConfig | undefined;
  api.defaults.adapter = async (config) => {
    sent = config;
    return { data: created, status: 201, statusText: '', headers: {}, config };
  };
  expect(await createGoal({ title: created.title })).toEqual(created);
  expect(sent?.url).toBe('/goals');
  expect(sent?.method).toBe('post');
  expect(JSON.parse(sent!.data)).toEqual({ title: created.title });
});
