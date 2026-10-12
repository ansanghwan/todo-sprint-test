'use client';

import ErrorRetry from '@/components/common/ErrorRetry';
import useCommentList from '@/hooks/post/useCommentList';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import CommentItem from './CommentItem';
import CommentListSkeleton from './CommentListSkeleton';

const NEXT_PAGE_SKELETON_COUNT = 2;

interface CommentListProps {
  postId: number;
}

const CommentList = ({ postId }: CommentListProps) => {
  const { comments, hasMore, isLoadingMore, isLoadMoreError, loadMore } =
    useCommentList(postId);
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: hasMore && !isLoadingMore && !isLoadMoreError,
    onIntersect: loadMore,
  });

  return (
    <div>
      <ul className="flex flex-col gap-8 md:gap-10">
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommentItem postId={postId} comment={comment} />
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} />
      {isLoadingMore && (
        <div className="mt-8 md:mt-10">
          <CommentListSkeleton count={NEXT_PAGE_SKELETON_COUNT} />
        </div>
      )}
      {isLoadMoreError && (
        <ErrorRetry
          message="다음 댓글을 불러오지 못했어요."
          onRetry={() => loadMore()}
        />
      )}
    </div>
  );
};

export default CommentList;
