'use client';

import { catchError, type ErrorInfo } from 'next/error';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import { QueryErrorFallback } from '@/components/boundaries/QueryErrorBoundary';
import useCommentCount from '@/hooks/post/useCommentCount';
import usePostNotFound from '@/hooks/post/usePostNotFound';
import { ApiError } from '@/lib/api/errors';
import CommentCreateForm from './CommentCreateForm';
import CommentList from './CommentList';
import CommentListSkeleton from './CommentListSkeleton';

const INITIAL_SKELETON_COUNT = 3;

// 댓글 목록의 404가 상세의 404보다 먼저 오면, 영역을 숨기기 전까지 실패 안내 대신 비워 둡니다.
const CommentErrorBoundary = catchError(
  (_props: object, { error, reset }: ErrorInfo) => {
    if (error instanceof ApiError && error.httpCategory === 'notFound') {
      return null;
    }
    return (
      <QueryErrorFallback message="댓글을 불러오지 못했어요." onReset={reset} />
    );
  },
);

interface CommentSectionProps {
  postId: number;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const commentCount = useCommentCount(postId);
  const isPostNotFound = usePostNotFound(postId);

  // 게시글이 없으면(404) 본문 영역이 안내하므로 댓글 영역을 그리지 않습니다.
  if (isPostNotFound) {
    return null;
  }

  return (
    <section aria-label="댓글" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="flex gap-0.5 text-base font-semibold md:gap-1 md:text-lg">
          <span className="text-heading">댓글</span>
          <span className="text-orange-600">{commentCount}</span>
        </h3>
        <CommentCreateForm postId={postId} />
      </div>
      <CommentErrorBoundary>
        <ClientSuspense
          fallback={<CommentListSkeleton count={INITIAL_SKELETON_COUNT} />}
        >
          <CommentList postId={postId} />
        </ClientSuspense>
      </CommentErrorBoundary>
    </section>
  );
};

export default CommentSection;
