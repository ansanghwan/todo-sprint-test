import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { api } from './client-fetcher';
import { deletePost, getPost, getPosts } from './post';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const post = {
  id: 1,
  teamId: 'team',
  userId: 1,
  title: '제목',
  content: '본문',
  image: null,
  viewCount: 3,
  createdAt: '2026-02-16T09:00:00.000Z',
  updatedAt: '2026-02-16T09:00:00.000Z',
  writer: { id: 1, name: '체다치즈', image: null },
  commentCount: 2,
};

const replyWith = (data: unknown) => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    return { data, status: 200, statusText: '', headers: {}, config };
  };
  api.defaults.adapter = adapter;
  return sent;
};

describe('getPosts', () => {
  it('/posts로 정렬·개수·커서 파라미터를 보낸다', async () => {
    const sent = replyWith({ posts: [post], nextCursor: 'abc', totalCount: 1 });

    const page = await getPosts({ type: 'all', limit: 10, cursor: 'xyz' });

    expect(sent[0].url).toBe('/posts');
    expect(sent[0].params).toEqual({ type: 'all', limit: 10, cursor: 'xyz' });
    expect(page.nextCursor).toBe('abc');
  });
});

describe('getPost', () => {
  it('/posts/{postId}로 상세를 조회한다', async () => {
    const sent = replyWith(post);

    const detail = await getPost(1);

    expect(sent[0].url).toBe('/posts/1');
    expect(detail.title).toBe('제목');
  });
});

describe('deletePost', () => {
  it('/posts/{postId}로 DELETE를 보낸다', async () => {
    const sent = replyWith(undefined);

    await deletePost(1);

    expect(sent[0].url).toBe('/posts/1');
    expect(sent[0].method).toBe('delete');
  });
});
