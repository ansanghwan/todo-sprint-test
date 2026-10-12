'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { QueryErrorFallback } from '@/components/boundaries/QueryErrorBoundary';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/errors';

const PostDetailErrorBoundary = catchError(
  (_props: object, { error, reset }: ErrorInfo) => {
    if (error instanceof ApiError && error.httpCategory === 'notFound') {
      return (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-muted">게시글을 찾을 수 없어요.</p>
          <Link
            href="/posts"
            className="text-sm font-semibold text-orange-600 underline underline-offset-4"
          >
            목록으로 돌아가기
          </Link>
        </div>
      );
    }
    return (
      <QueryErrorFallback
        message="게시글을 불러오지 못했어요."
        onReset={reset}
      />
    );
  },
);

export default PostDetailErrorBoundary;
