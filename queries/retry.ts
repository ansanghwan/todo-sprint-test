import type { ApiError } from '@/lib/api/errors';

// TanStack Query 기본 재시도 횟수와 같습니다.
const MAX_RETRY_COUNT = 3;

/** 없는 리소스(404)는 다시 요청해도 결과가 같으므로 재시도하지 않습니다. */
export const retryUnlessNotFound = (failureCount: number, error: ApiError) =>
  error.httpCategory !== 'notFound' && failureCount < MAX_RETRY_COUNT;
