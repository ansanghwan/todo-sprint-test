'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { useTranslations } from 'next-intl';
import { QueryErrorFallback } from '@/components/boundaries/QueryErrorBoundary';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/errors';

const PostDetailNotFound = () => {
  const t = useTranslations('Post');

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-muted">{t('postNotFound')}</p>
      <Link
        href="/posts"
        className="text-sm font-semibold text-orange-600 underline underline-offset-4"
      >
        {t('backToList')}
      </Link>
    </div>
  );
};

const PostDetailLoadError = ({ onReset }: { onReset: () => void }) => {
  const t = useTranslations('Post');

  return (
    <QueryErrorFallback message={t('fetchPostsError')} onReset={onReset} />
  );
};

const PostDetailErrorBoundary = catchError(
  (_props: object, { error, reset }: ErrorInfo) => {
    if (error instanceof ApiError && error.httpCategory === 'notFound') {
      return <PostDetailNotFound />;
    }
    return <PostDetailLoadError onReset={reset} />;
  },
);

export default PostDetailErrorBoundary;
