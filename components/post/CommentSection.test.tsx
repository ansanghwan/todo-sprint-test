import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { getComments } from '@/lib/api/comment';
import { getPost } from '@/lib/api/post';
import { commentKeys } from '@/queries/comment';
import type { PostDto } from '@/types/api/post';
import IntlTestProvider from '@/test/IntlTestProvider';
import CommentSection from './CommentSection';

vi.mock('@/lib/api/post', () => ({ getPost: vi.fn() }));
vi.mock('@/lib/api/comment', () => ({ getComments: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderSection = () => {
  const client = new QueryClient();
  // 댓글 목록은 404가 아니면 재시도하므로 테스트에서는 기다리지 않게 합니다.
  client.setQueryDefaults(commentKeys.all, { retryDelay: 0 });
  return render(
    <QueryClientProvider client={client}>
      <IntlTestProvider>
        <CommentSection postId={5} />
      </IntlTestProvider>
    </QueryClientProvider>,
  );
};

describe('댓글 영역', () => {
  it('댓글 목록을 불러오지 못해도 작성 폼은 남긴다', async () => {
    vi.mocked(getPost).mockResolvedValue({
      id: 5,
      commentCount: 2,
    } as PostDto);
    vi.mocked(getComments).mockRejectedValue(
      new ApiError('http', 'Server Error', { status: 500 }),
    );

    renderSection();

    expect(await screen.findByText('댓글을 불러오지 못했어요.')).toBeDefined();
    expect(screen.getByLabelText('댓글 입력')).toBeDefined();
  });

  it('게시글이 없으면(404) 댓글 영역을 그리지 않는다', async () => {
    const notFound = new ApiError('http', 'Not Found', { status: 404 });
    vi.mocked(getPost).mockRejectedValue(notFound);
    vi.mocked(getComments).mockRejectedValue(notFound);

    renderSection();

    await vi.waitFor(() =>
      expect(screen.queryByRole('region', { name: '댓글' })).toBeNull(),
    );
  });
});
