import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { UserDto } from '@/types/api/user';
import { authMutations } from './auth';
import { userKeys } from './user';

vi.mock('@/lib/api/auth', () => ({
  login: vi.fn(async () => ({})),
  signup: vi.fn(async () => ({})),
}));

const previousUser = { id: 1, name: '이전 계정' } as UserDto;

describe('authMutations', () => {
  it.each([
    ['login', authMutations.login()],
    ['signup', authMutations.signup()],
  ] as const)(
    '%s에 성공하면 이전 계정의 조회 캐시를 지운다',
    async (_, options) => {
      const client = new QueryClient();
      client.setQueryData(userKeys.me(), previousUser);

      await new MutationObserver(client, options).mutate({
        name: '새 계정',
        email: 'new@b.co',
        password: 'password',
      });

      expect(client.getQueryData(userKeys.me())).toBeUndefined();
    },
  );
});
