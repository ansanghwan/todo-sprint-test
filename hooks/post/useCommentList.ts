import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { commentQueries } from '@/queries/comment';

const useCommentList = (postId: number) => {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useSuspenseInfiniteQuery(commentQueries.list(postId));

  return {
    comments: data.pages.flatMap((page) => page.comments),
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isLoadMoreError: isFetchNextPageError,
    loadMore: fetchNextPage,
  };
};

export default useCommentList;
