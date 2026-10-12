import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { deleteComment, updateComment } from '@/lib/api/comment';
import { ApiError } from '@/lib/api/errors';
import type { CommentDto, CommentPageDto } from '@/types/api/comment';
import type { PostDto } from '@/types/api/post';
import { commentKeys, commentMutations, commentQueries } from './comment';
import { postKeys } from './post';

vi.mock('@/lib/api/comment', () => ({
  getComments: vi.fn(),
  createComment: vi.fn(async () => ({})),
  updateComment: vi.fn(async () => ({ id: 10, content: '수정' })),
  deleteComment: vi.fn(async () => {}),
}));

const page = (nextCursor: string | null): CommentPageDto => ({
  comments: [],
  nextCursor,
  totalCount: 0,
});

describe('commentQueries', () => {
  it('목록 key에 게시글 ID가 들어간다', () => {
    expect(commentQueries.list(7).queryKey).toContain(7);
  });

  it('nextCursor가 null이면 다음 페이지를 요청하지 않는다', () => {
    const { getNextPageParam } = commentQueries.list(7);
    expect(getNextPageParam(page('abc'), [], undefined, [])).toBe('abc');
    expect(getNextPageParam(page(null), [], undefined, [])).toBeUndefined();
  });
});

describe('commentMutations.create', () => {
  it('성공하면 게시글의 댓글 수를 1 늘리고 댓글 목록을 무효화한다', async () => {
    const client = new QueryClient();
    client.setQueryData(postKeys.detail(7), { commentCount: 3 } as PostDto);
    client.setQueryData(commentKeys.list(7), { pages: [], pageParams: [] });

    await new MutationObserver(client, commentMutations.create(7)).mutate(
      '댓글',
    );

    expect(client.getQueryData<PostDto>(postKeys.detail(7))?.commentCount).toBe(
      4,
    );
    expect(client.getQueryState(commentKeys.list(7))?.isInvalidated).toBe(true);
  });
});

const seedClient = () => {
  const client = new QueryClient();
  client.setQueryData(postKeys.detail(7), { commentCount: 3 } as PostDto);
  client.setQueryData(commentKeys.list(7), { pages: [], pageParams: [] });
  return client;
};

describe('commentMutations.delete', () => {
  it('성공하면 게시글의 댓글 수를 1 줄이고 댓글 목록을 무효화한다', async () => {
    const client = seedClient();

    await new MutationObserver(client, commentMutations.delete(7)).mutate(10);

    expect(client.getQueryData<PostDto>(postKeys.detail(7))?.commentCount).toBe(
      2,
    );
    expect(client.getQueryState(commentKeys.list(7))?.isInvalidated).toBe(true);
  });

  it('이미 삭제된 댓글(404)이면 댓글 수를 1 줄이고 목록을 무효화한다', async () => {
    vi.mocked(deleteComment).mockRejectedValueOnce(
      new ApiError('http', 'Not found', { status: 404 }),
    );
    const client = seedClient();

    await expect(
      new MutationObserver(client, commentMutations.delete(7)).mutate(10),
    ).rejects.toThrow();

    expect(client.getQueryData<PostDto>(postKeys.detail(7))?.commentCount).toBe(
      2,
    );
    expect(client.getQueryState(commentKeys.list(7))?.isInvalidated).toBe(true);
  });
});

describe('commentMutations.update', () => {
  it('성공하면 불러온 목록의 해당 댓글만 응답으로 바꾼다', async () => {
    const client = new QueryClient();
    const other = { id: 11, content: '다른 댓글' } as CommentDto;
    client.setQueryData(commentKeys.list(7), {
      pages: [
        {
          comments: [{ id: 10, content: '원래' } as CommentDto, other],
          nextCursor: null,
          totalCount: 2,
        },
      ],
      pageParams: [undefined],
    });

    await new MutationObserver(client, commentMutations.update(7)).mutate({
      commentId: 10,
      content: '수정',
    });

    expect(
      client.getQueryData(commentQueries.list(7).queryKey)?.pages[0].comments,
    ).toEqual([{ id: 10, content: '수정' }, other]);
  });

  it('이미 삭제된 댓글(404)이면 댓글 목록을 무효화한다', async () => {
    vi.mocked(updateComment).mockRejectedValueOnce(
      new ApiError('http', 'Not found', { status: 404 }),
    );
    const client = seedClient();

    await expect(
      new MutationObserver(client, commentMutations.update(7)).mutate({
        commentId: 10,
        content: '수정',
      }),
    ).rejects.toThrow();

    expect(client.getQueryState(commentKeys.list(7))?.isInvalidated).toBe(true);
  });
});
