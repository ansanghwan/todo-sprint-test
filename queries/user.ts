import { queryOptions } from '@tanstack/react-query';
import { getMe } from '@/lib/api/user';

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export const userQueries = {
  me: () =>
    queryOptions({
      queryKey: userKeys.me(),
      queryFn: ({ signal }) => getMe(signal),
      // 내 정보는 세션 중 거의 바뀌지 않으므로 마운트마다 다시 받지 않습니다. 수정·로그아웃 시 무효화하세요.
      staleTime: Infinity,
    }),
};
