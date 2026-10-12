import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { api } from './client-fetcher';
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from './comment';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const replyWith = (data: unknown) => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return { data, status: 200, statusText: '', headers: {}, config };
  };
  api.defaults.adapter = adapter;
  return sent;
};

describe('getComments', () => {
  it('/posts/{postId}/comments로 최상위 댓글만 개수·커서와 함께 요청한다', async () => {
    const sent = replyWith({ comments: [], nextCursor: null, totalCount: 0 });

    await getComments(5, { limit: 10, cursor: 'abc' });

    expect(sent[0].url).toBe('/posts/5/comments');
    expect(sent[0].params).toEqual({
      parentId: 'null',
      limit: 10,
      cursor: 'abc',
    });
  });
});

describe('createComment', () => {
  it('POST /posts/{postId}/comments로 댓글 내용을 보낸다', async () => {
    const sent = replyWith({});

    await createComment(5, { content: '좋은 글이네요!' });

    expect(sent[0].url).toBe('/posts/5/comments');
    expect(sent[0].method).toBe('post');
    expect(JSON.parse(sent[0].data)).toEqual({ content: '좋은 글이네요!' });
  });
});

describe('updateComment', () => {
  it('PATCH /posts/{postId}/comments/{commentId}로 수정할 내용을 보낸다', async () => {
    const sent = replyWith({});

    await updateComment(5, 10, { content: '수정했어요' });

    expect(sent[0].url).toBe('/posts/5/comments/10');
    expect(sent[0].method).toBe('patch');
    expect(JSON.parse(sent[0].data)).toEqual({ content: '수정했어요' });
  });
});

describe('deleteComment', () => {
  it('DELETE /posts/{postId}/comments/{commentId}로 요청한다', async () => {
    const sent = replyWith(undefined);

    await deleteComment(5, 10);

    expect(sent[0].url).toBe('/posts/5/comments/10');
    expect(sent[0].method).toBe('delete');
  });
});
