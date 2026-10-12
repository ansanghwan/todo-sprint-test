import {
  useInfiniteQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * 커서 기반 목록을 마지막 페이지까지 이어서 받습니다. 달력·select 옵션처럼 전체가 있어야 그릴 수 있는 곳에 씁니다.
 * 일부만 받은 상태를 전체로 오해하지 않도록, 다 받기 전에는 pages가 undefined입니다.
 *   const { pages, isLoading, isError, retry } = useAllPages(todoQueries.list(params));
 */
const useAllPages = <TPage, TQueryKey extends QueryKey, TPageParam>(
  options: UseInfiniteQueryOptions<
    TPage,
    DefaultError,
    InfiniteData<TPage>,
    TQueryKey,
    TPageParam
  >,
) => {
  const { data, isError, isFetching, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery(options);

  // 재조회 중에 요청한 다음 페이지는 무시되므로, 모든 요청이 끝난 뒤(isFetching)에 이어 받습니다.
  // 실패하면 retry 전까지 멈춥니다.
  useEffect(() => {
    if (hasNextPage && !isFetching && !isError) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  const hasAllPages = data !== undefined && !hasNextPage;
  // 다시 시도하는 동안에는 에러 대신 로딩으로 보여줍니다.
  const hasFailed = isError && !isFetching;
  const hasStarted = isFetching || data !== undefined;

  return {
    pages: hasAllPages ? data.pages : undefined,
    isLoading: hasStarted && !hasAllPages && !hasFailed,
    isError: hasFailed,
    retry: () => {
      void refetch();
    },
  };
};

export default useAllPages;
