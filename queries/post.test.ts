import { describe, expect, it } from 'vitest';
import type { PostPageDto } from '@/types/api/post';
import { ApiError } from '@/lib/api/errors';
import { postQueries } from './post';

const page = (nextCursor: string | null): PostPageDto => ({
  posts: [],
  nextCursor,
  totalCount: 0,
});

describe('postQueries', () => {
  it('인기 게시글 key에 type=best, limit=3이 들어간다', () => {
    expect(postQueries.best().queryKey).toContainEqual({
      type: 'best',
      limit: 3,
    });
  });

  it('목록 key에 필터가 들어간다', () => {
    const params = { type: 'all', limit: 10, search: '루틴' } as const;
    expect(postQueries.list(params).queryKey).toContainEqual(params);
  });

  it('nextCursor가 null이면 다음 페이지를 요청하지 않는다', () => {
    const { getNextPageParam } = postQueries.list({ type: 'all', limit: 10 });
    expect(getNextPageParam(page('abc'), [], undefined, [])).toBe('abc');
    expect(getNextPageParam(page(null), [], undefined, [])).toBeUndefined();
  });

  it('상세 key에 게시글 ID가 들어간다', () => {
    expect(postQueries.detail(7).queryKey).toContain(7);
  });

  it('상세 조회는 404면 재시도하지 않는다', () => {
    const retry = postQueries.detail(7).retry as (
      failureCount: number,
      error: ApiError,
    ) => boolean;
    const notFound = new ApiError('http', 'Not found', { status: 404 });
    const serverError = new ApiError('http', 'Server error', { status: 500 });

    expect(retry(0, notFound)).toBe(false);
    expect(retry(0, serverError)).toBe(true);
  });
});
