import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast/Toaster';
import { deleteComment, updateComment } from '@/lib/api/comment';
import { ApiError } from '@/lib/api/errors';
import { userKeys } from '@/queries/user';
import type { UserDto } from '@/types/api/user';
import CommentItem from './CommentItem';

vi.mock('@/lib/api/comment', () => ({
  updateComment: vi.fn(async () => ({})),
  deleteComment: vi.fn(async () => {}),
}));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const MY_ID = 1;
const CONTENT = '좋은 글이네요!';

const renderComment = (writerId: number) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(userKeys.me(), { id: MY_ID } as UserDto);
  render(
    <QueryClientProvider client={client}>
      <CommentItem
        postId={5}
        comment={{
          id: 10,
          content: CONTENT,
          createdAt: '2026-02-16T10:00:00.000Z',
          writer: { id: writerId, name: '고양이', image: null },
        }}
      />
    </QueryClientProvider>,
  );
};

const selectMenu = async (label: string) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '댓글 메뉴' }));
  await user.click(screen.getByRole('menuitem', { name: label }));
  return user;
};

describe('댓글 아이템', () => {
  it('내 댓글이면 뱃지와 케밥을 표시한다', () => {
    renderComment(MY_ID);

    expect(screen.getByText('내 댓글')).toBeTruthy();
    expect(screen.getByRole('button', { name: '댓글 메뉴' })).toBeTruthy();
  });

  it('다른 사람 댓글이면 뱃지와 케밥을 표시하지 않는다', () => {
    renderComment(MY_ID + 1);

    expect(screen.queryByText('내 댓글')).toBeNull();
    expect(screen.queryByRole('button', { name: '댓글 메뉴' })).toBeNull();
  });
});

describe('댓글 수정', () => {
  it('수정하기를 고르면 기존 내용이 채워진 입력창을 보여주고, 취소하면 원래 내용으로 돌아간다', async () => {
    renderComment(MY_ID);

    const user = await selectMenu('수정하기');
    const input = screen.getByLabelText('댓글 수정');
    expect(input).toHaveProperty('value', CONTENT);

    await user.type(input, ' 추가');
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByLabelText('댓글 수정')).toBeNull();
    expect(screen.getByText(CONTENT)).toBeTruthy();
  });

  it('수정하면 앞뒤 공백을 뺀 내용을 보내고 입력창을 닫는다', async () => {
    renderComment(MY_ID);

    const user = await selectMenu('수정하기');
    const input = screen.getByLabelText('댓글 수정');
    await user.clear(input);
    await user.type(input, '  수정했어요  ');
    await user.click(screen.getByRole('button', { name: '수정' }));

    expect(updateComment).toHaveBeenCalledWith(5, 10, {
      content: '수정했어요',
    });
    await vi.waitFor(() =>
      expect(screen.queryByLabelText('댓글 수정')).toBeNull(),
    );
  });

  it('권한이 없으면(403) 에러를 알리고 입력창을 유지한다', async () => {
    vi.mocked(updateComment).mockRejectedValueOnce(
      new ApiError('http', 'Forbidden', { status: 403 }),
    );
    renderComment(MY_ID);

    const user = await selectMenu('수정하기');
    await user.click(screen.getByRole('button', { name: '수정' }));

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('댓글을 수정할 권한이 없어요.'),
    );
    expect(screen.getByLabelText('댓글 수정')).toBeTruthy();
  });
});

describe('댓글 삭제', () => {
  it('삭제를 확인하면 DELETE 요청을 보낸다', async () => {
    renderComment(MY_ID);

    const user = await selectMenu('삭제하기');
    await user.click(screen.getByRole('button', { name: '삭제' }));

    await vi.waitFor(() => expect(deleteComment).toHaveBeenCalledWith(5, 10));
  });

  it('이미 삭제된 댓글이면(404) 에러를 알린다', async () => {
    vi.mocked(deleteComment).mockRejectedValueOnce(
      new ApiError('http', 'Not found', { status: 404 }),
    );
    renderComment(MY_ID);

    const user = await selectMenu('삭제하기');
    await user.click(screen.getByRole('button', { name: '삭제' }));

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('이미 삭제된 댓글이에요.'),
    );
  });
});
