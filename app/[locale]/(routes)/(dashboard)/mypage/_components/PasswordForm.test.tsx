import { render, screen } from '@testing-library/react';
import { AxiosError, type AxiosAdapter } from 'axios';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api/client-fetcher';
import { replyToAuthRequest } from '@/test/authApiMocks';
import TestProviders from '@/test/TestProviders';
import PasswordForm from './PasswordForm';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('현재 비밀번호'), 'old-password');
  await user.type(screen.getByLabelText('새 비밀번호'), 'new-password');
  await user.type(screen.getByLabelText('새 비밀번호 확인'), 'new-password');
  await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
};

describe('PasswordForm', () => {
  it('변경에 성공하면 확인 값 없이 요청하고 입력란을 비운다', async () => {
    const user = userEvent.setup();
    const sent = replyToAuthRequest(200);
    render(<PasswordForm />, { wrapper: TestProviders });

    await fillAndSubmit(user);

    await vi.waitFor(() =>
      expect(screen.getByLabelText('현재 비밀번호')).toHaveValue(''),
    );
    expect(screen.getByLabelText('새 비밀번호')).toHaveValue('');
    expect(sent[0].url).toBe('/users/me/password');
    expect(JSON.parse(sent[0].data)).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
  });

  // refresh 응답(refreshStatus)과 별개로 비밀번호 변경 요청에는 항상 401로 답합니다.
  const rejectPasswordChange = (refreshStatus: number) => {
    const sent: string[] = [];
    const adapter: AxiosAdapter = async (config) => {
      sent.push(config.url ?? '');
      const isRefresh = config.url === '/auth/refresh';
      const status = isRefresh ? refreshStatus : 401;
      const response = {
        data: {
          message: 'failed',
          code: isRefresh ? 'TOKEN_INVALID' : 'UNAUTHORIZED',
        },
        status,
        statusText: '',
        headers: {},
        config,
      };
      if (status >= 300) {
        throw new AxiosError(
          'failed',
          'ERR_BAD_REQUEST',
          config,
          null,
          response,
        );
      }
      return response;
    };
    api.defaults.adapter = adapter;
    return sent;
  };

  it('현재 비밀번호가 틀리면 그 입력란 아래에 안내하고 입력값을 유지한다', async () => {
    const user = userEvent.setup();
    rejectPasswordChange(204);
    render(<PasswordForm />, { wrapper: TestProviders });

    await fillAndSubmit(user);

    await vi.waitFor(() =>
      expect(
        screen.getByLabelText('현재 비밀번호'),
      ).toHaveAccessibleDescription('현재 비밀번호가 올바르지 않습니다.'),
    );
    expect(screen.getByLabelText('새 비밀번호')).toHaveValue('new-password');
  });

  it('세션이 끝나 refresh까지 실패하면 현재 비밀번호 오류로 안내하지 않는다', async () => {
    const user = userEvent.setup();
    const sent = rejectPasswordChange(401);
    render(<PasswordForm />, { wrapper: TestProviders });

    await fillAndSubmit(user);

    await vi.waitFor(() => expect(sent).toContain('/auth/refresh'));
    await vi.waitFor(() =>
      expect(
        screen.getByRole('button', { name: '비밀번호 변경' }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByLabelText('현재 비밀번호'),
    ).not.toHaveAccessibleDescription('현재 비밀번호가 올바르지 않습니다.');
  });
});
