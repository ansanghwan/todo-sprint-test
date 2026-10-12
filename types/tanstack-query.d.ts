import type { ApiError } from '@/lib/api/errors';

// 요청 실패는 client-fetcher의 인터셉터가 모두 ApiError로 바꾸므로
// 쿼리·뮤테이션 에러 타입을 ApiError로 지정합니다.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
