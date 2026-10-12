// @vitest-environment node
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { backend } from './backend';
import { forward } from './forward';

vi.mock('./session', () => ({ readAccessToken: async () => 'token' }));

const originalAdapter = backend.defaults.adapter;
afterEach(() => {
  backend.defaults.adapter = originalAdapter;
});

function captureRequest() {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return {
      data: '{}',
      status: 200,
      statusText: '',
      headers: { 'content-type': 'application/json' },
      config,
    };
  };
  backend.defaults.adapter = adapter;
  return sent;
}

describe('forward', () => {
  it('/api를 뗀 경로와 쿼리, Authorization을 백엔드로 전달한다', async () => {
    const sent = captureRequest();
    await forward(new NextRequest('http://localhost/api/goals/12?x=1'));

    expect(sent[0].url).toBe('/goals/12?x=1');
    expect(sent[0].method).toBe('get');
    expect(sent[0].headers.Authorization).toBe('Bearer token');
    expect(sent[0].data).toBeUndefined();
  });

  it('body가 있는 메서드는 body를 그대로 전달한다', async () => {
    const sent = captureRequest();
    const body = '{"title":"목표"}';
    await forward(
      new NextRequest('http://localhost/api/goals', { method: 'POST', body }),
    );

    expect(sent[0].url).toBe('/goals');
    expect(sent[0].data).toBe(body);
  });

  it('인코딩된 슬래시는 풀지 않아 다른 경로로 벗어나지 않는다', async () => {
    const sent = captureRequest();
    await forward(
      new NextRequest('http://localhost/api/goals/..%2Fauth%2Flogin', {
        method: 'POST',
      }),
    );

    expect(sent[0].url).toBe('/goals/..%2Fauth%2Flogin');
  });
});
