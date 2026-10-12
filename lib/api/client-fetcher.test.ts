import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { api, request } from './client-fetcher';
import { ApiError } from './errors';

const reply =
  (status: number, data: unknown): AxiosAdapter =>
  async (config) => {
    const response = {
      data,
      status,
      statusText: '',
      headers: {},
      config,
      request: {},
    };
    if (status >= 200 && status < 300) return response;
    const code =
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      code,
      config,
      {},
      response,
    );
  };

const fail =
  (code: string): AxiosAdapter =>
  async (config) => {
    throw new AxiosError('boom', code, config, {});
  };

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the request to fail');
}

describe('api 클라이언트: 모든 요청 실패를 ApiError로 통일한다', () => {
  it('에러 body가 스펙 형태이면 code와 message를 가져온다', async () => {
    const error = await caught(
      api.get('/todos', {
        adapter: reply(403, {
          code: 'FORBIDDEN',
          message: 'Not allowed',
        }),
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 403,
      code: 'FORBIDDEN',
      message: 'Not allowed',
      httpCategory: 'forbidden',
    });
  });

  it('에러 body가 스펙 형태가 아닌 http 에러도 분류한다', async () => {
    const error = await caught(
      api.get('/todos', { adapter: reply(502, '<html>Bad Gateway</html>') }),
    );
    expect(error).toMatchObject({
      kind: 'http',
      status: 502,
      code: undefined,
      httpCategory: 'other',
    });
  });

  it('응답이 없으면 network로 분류한다', async () => {
    const error = await caught(
      api.get('/todos', { adapter: fail(AxiosError.ERR_NETWORK) }),
    );
    expect(error).toMatchObject({ kind: 'network', status: undefined });
  });

  it('타임아웃을 분류한다', async () => {
    const error = await caught(
      api.get('/todos', { adapter: fail(AxiosError.ECONNABORTED) }),
    );
    expect(error.kind).toBe('timeout');
  });

  it('중단된 요청을 canceled로 분류한다', async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await caught(
      api.get('/todos', { signal: controller.signal, adapter: reply(200, []) }),
    );
    expect(error.kind).toBe('canceled');
  });
});

describe('request 함수', () => {
  it('응답 데이터를 반환한다', async () => {
    const data = await request({
      url: '/todos/1',
      adapter: reply(200, { id: 1, title: 'ship api layer', done: false }),
    });
    expect(data).toEqual({ id: 1, title: 'ship api layer', done: false });
  });

  it('전송 계층 에러는 그대로 전달한다', async () => {
    const error = await caught(
      request({
        url: '/todos/1',
        adapter: reply(404, { code: 'NOT_FOUND', message: 'nope' }),
      }),
    );
    expect(error).toMatchObject({
      kind: 'http',
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('401 refresh', () => {
  const page = { todos: [], nextCursor: null, totalCount: 0 };

  const realAdapter = api.defaults.adapter;
  afterEach(() => {
    api.defaults.adapter = realAdapter;
  });

  function replyWith(
    config: InternalAxiosRequestConfig,
    data: unknown,
    status = 200,
  ) {
    return { data, status, statusText: '', headers: {}, config, request: {} };
  }

  function failWith(config: InternalAxiosRequestConfig, status: number) {
    return new AxiosError(
      'nope',
      AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      {
        data: {
          message: 'nope',
          code: status === 401 ? 'TOKEN_INVALID' : 'OOPS',
        },
        status,
        statusText: '',
        headers: {},
        config,
        request: {},
      },
    );
  }

  const getTodos = () => api.get('/todos').then((res) => res.data);

  // refresh가 일어나기 전까지 모든 데이터 요청은 401을 반환한다. 호출 기록을 반환한다.
  function expiredSession() {
    const calls: string[] = [];
    let refreshed = false;

    const adapter: AxiosAdapter = async (config) => {
      const url = config.url ?? '';
      calls.push(url);
      if (url === '/auth/refresh') {
        refreshed = true;
        return replyWith(config, null, 204);
      }
      if (!refreshed) throw failWith(config, 401);
      return replyWith(config, page);
    };

    api.defaults.adapter = adapter;
    return calls;
  }

  it('동시에 실패한 요청들은 refresh 하나를 공유한다', async () => {
    const calls = expiredSession();

    const results = await Promise.all([getTodos(), getTodos(), getTodos()]);

    expect(results).toEqual([page, page, page]);
    expect(calls.filter((url) => url === '/auth/refresh')).toHaveLength(1);
    expect(calls.filter((url) => url === '/todos')).toHaveLength(6);
  });

  it('refresh 후에도 401이면 한 번만 재시도하고 멈춘다', async () => {
    const calls: string[] = [];
    api.defaults.adapter = async (config) => {
      const url = config.url ?? '';
      calls.push(url);
      if (url === '/auth/refresh') return replyWith(config, null, 204);
      throw failWith(config, 401);
    };

    await expect(getTodos()).rejects.toMatchObject({ status: 401 });
    expect(calls).toEqual(['/todos', '/auth/refresh', '/todos']);
  });

  it('/auth/* 의 401은 refresh하지 않는다 (잘못된 비밀번호 등)', async () => {
    const calls: string[] = [];
    api.defaults.adapter = async (config) => {
      calls.push(config.url ?? '');
      throw failWith(config, 401);
    };

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      kind: 'http',
      status: 401,
    });
    await expect(api.post('/auth/refresh')).rejects.toBeTruthy();
    expect(calls).toEqual(['/auth/login', '/auth/refresh']);
  });
});
