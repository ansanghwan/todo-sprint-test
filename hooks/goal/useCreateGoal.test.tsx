import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { createGoal } from '@/lib/api/goals';
import { goalKeys } from '@/queries/goal';
import useCreateGoal from './useCreateGoal';

vi.mock('@/lib/api/goals', () => ({ createGoal: vi.fn() }));

it('생성 후 모든 목표 목록 캐시를 무효화해 선택 목록이 다시 조회되게 한다', async () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const key = goalKeys.list({});
  client.setQueryData(key, {
    pages: [{ goals: [], nextCursor: null, totalCount: 0 }],
    pageParams: [undefined],
  });
  vi.mocked(createGoal).mockResolvedValue({
    id: 3,
    teamId: 'team',
    userId: 1,
    title: '목표',
    createdAt: '',
    updatedAt: '',
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateGoal(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ title: '목표' });
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  client.clear();
});
