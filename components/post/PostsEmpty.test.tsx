import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IntlTestProvider from '@/test/IntlTestProvider';
import BestPostList from './BestPostList';
import PostList from './PostList';

vi.mock('@/lib/api/post', () => ({
  getPosts: vi.fn(async () => ({ posts: [], nextCursor: null, totalCount: 0 })),
}));

afterEach(cleanup);

const renderWithClient = (ui: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <IntlTestProvider>{ui}</IntlTestProvider>
    </QueryClientProvider>,
  );

describe('게시글이 없을 때', () => {
  it('목록은 빈 상태 안내를 표시한다', async () => {
    renderWithClient(<PostList params={{ type: 'all', limit: 10 }} />);
    expect(
      await screen.findByText('아직 등록된 게시물이 없어요'),
    ).toBeInTheDocument();
  });

  it('인기 게시글 영역은 표시하지 않는다', async () => {
    renderWithClient(<BestPostList />);
    await vi.waitFor(() =>
      expect(screen.queryByText(/인기 게시글을/)).toBeNull(),
    );
    expect(screen.queryByRole('region', { name: '인기 게시글' })).toBeNull();
  });
});
