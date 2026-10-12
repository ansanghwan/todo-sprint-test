import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast/Toaster';
import { ApiError } from '@/lib/api/errors';
import { deletePost } from '@/lib/api/post';
import { userKeys } from '@/queries/user';
import type { UserDto } from '@/types/api/user';
import PostActions from './PostActions';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock('@/i18n/navigation', () => ({ useRouter: () => router }));
vi.mock('@/lib/api/user', () => ({
  getMe: vi.fn(async () => ({ id: 1, name: '체다치즈' })),
}));
vi.mock('@/lib/api/post', () => ({ deletePost: vi.fn(async () => {}) }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderActions = (writerId: number) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PostActions postId={5} writerId={writerId} />
    </QueryClientProvider>,
  );

const confirmDelete = async () => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '게시글 메뉴' }));
  await user.click(screen.getByRole('menuitem', { name: '삭제하기' }));
  await user.click(screen.getByRole('button', { name: '삭제' }));
};

describe('게시글 케밥 메뉴', () => {
  it('작성자 본인이 아니면 케밥을 표시하지 않는다', async () => {
    const client = new QueryClient();
    client.setQueryData(userKeys.me(), { id: 1 } as UserDto);
    render(
      <QueryClientProvider client={client}>
        <PostActions postId={5} writerId={2} />
      </QueryClientProvider>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('삭제를 확인하면 DELETE 요청 후 목록으로 이동한다', async () => {
    renderActions(1);

    await confirmDelete();

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/posts'),
    );
    expect(vi.mocked(deletePost).mock.calls[0][0]).toBe(5);
  });

  it('권한이 없으면(403) 에러 토스트를 띄우고 이동하지 않는다', async () => {
    vi.mocked(deletePost).mockRejectedValueOnce(
      new ApiError('http', 'Forbidden', { status: 403 }),
    );
    renderActions(1);

    await confirmDelete();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        '게시글을 삭제할 권한이 없어요.',
      ),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});
