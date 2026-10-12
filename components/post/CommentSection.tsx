'use client';

import { catchError, type ErrorInfo } from 'next/error';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import { QueryErrorFallback } from '@/components/boundaries/QueryErrorBoundary';
import useCommentCount from '@/hooks/post/useCommentCount';
import { ApiError } from '@/lib/api/errors';
import CommentCreateForm from './CommentCreateForm';
import CommentList from './CommentList';
import CommentListSkeleton from './CommentListSkeleton';

const INITIAL_SKELETON_COUNT = 3;

// 게시글이 없으면(404) 본문 영역이 안내하므로 댓글 영역은 비웁니다.
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

  return (
    <section aria-label="댓글" className="flex flex-col gap-6">
      <CommentErrorBoundary>
        <div className="flex flex-col gap-4">
          <h3 className="flex gap-0.5 text-base font-semibold md:gap-1 md:text-lg">
            <span className="text-heading">댓글</span>
            <span className="text-orange-600">{commentCount}</span>
          </h3>
          <CommentCreateForm postId={postId} />
        </div>
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
