import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast/Toaster';
import { ApiError } from '@/lib/api/errors';
import { createComment } from '@/lib/api/comment';
import CommentCreateForm from './CommentCreateForm';

vi.mock('@/lib/api/comment', () => ({
  createComment: vi.fn(async () => ({})),
}));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CommentCreateForm postId={5} />
    </QueryClientProvider>,
  );

describe('댓글 작성', () => {
  it('공백만 입력하면 등록할 수 없다', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('댓글 입력'), '   ');

    expect(screen.getByRole('button', { name: '등록' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('등록하면 앞뒤 공백을 뺀 내용을 보내고 입력창을 비운다', async () => {
    renderForm();
    const input = screen.getByLabelText('댓글 입력');

    await userEvent.type(input, '  좋은 글이네요!  ');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(createComment).toHaveBeenCalledWith(5, {
      content: '좋은 글이네요!',
    });
    await vi.waitFor(() => expect(input).toHaveProperty('value', ''));
  });

  it('실패하면 에러를 알리고 입력한 내용을 유지한다', async () => {
    vi.mocked(createComment).mockRejectedValueOnce(
      new ApiError('http', 'Server error', { status: 500 }),
    );
    renderForm();
    const input = screen.getByLabelText('댓글 입력');

    await userEvent.type(input, '좋은 글이네요!');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(input).toHaveProperty('value', '좋은 글이네요!');
  });
});
