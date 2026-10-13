import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { api } from './client-fetcher';
import { changePassword, checkNickname, updateMe } from './user';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const replyWith = (data: unknown) => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return { data, status: 200, statusText: '', headers: {}, config };
  };
  api.defaults.adapter = adapter;
  return sent;
};

describe('user endpoints', () => {
  it('updateMe는 /users/me로 바뀐 값만 PATCH한다', async () => {
    const sent = replyWith({ id: 1, name: '새이름' });

    await updateMe({ name: '새이름', image: undefined });

    expect(sent[0].url).toBe('/users/me');
    expect(sent[0].method).toBe('patch');
    expect(JSON.parse(sent[0].data)).toEqual({ name: '새이름' });
  });

  it('changePassword는 /users/me/password로 현재·새 비밀번호를 PATCH한다', async () => {
    const sent = replyWith({ message: 'ok' });
    const body = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    };

    await changePassword(body);

    expect(sent[0].url).toBe('/users/me/password');
    expect(sent[0].method).toBe('patch');
    expect(JSON.parse(sent[0].data)).toEqual(body);
  });

  it('checkNickname은 이름을 query로 보내고 사용 가능 여부를 돌려준다', async () => {
    const sent = replyWith({ available: true });

    const result = await checkNickname('새이름');

    expect(sent[0].url).toBe('/users/check-nickname');
    expect(sent[0].params).toEqual({ name: '새이름' });
    expect(result.available).toBe(true);
  });
});
