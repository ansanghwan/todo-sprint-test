import { useTranslations } from 'next-intl';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import QueryErrorBoundary from '@/components/boundaries/QueryErrorBoundary';
import BestPostList from '@/components/post/BestPostList';
import BestPostListSkeleton from '@/components/post/BestPostListSkeleton';
import PostListSection from '@/components/post/PostListSection';
import PostWriteLink from '@/components/post/PostWriteLink';

export default function PostsPage() {
  const t = useTranslations('Post');

  return (
    <div className="flex flex-col gap-6 md:gap-10 lg:mx-auto lg:w-full lg:max-w-300">
      <h2 className="hidden px-2 text-xl font-semibold text-heading md:block lg:text-2xl">
        {t('title')}
      </h2>
      <QueryErrorBoundary message={t('fetchBestPostsError')}>
        <ClientSuspense fallback={<BestPostListSkeleton />}>
          <BestPostList />
        </ClientSuspense>
      </QueryErrorBoundary>
      <PostListSection />
      <PostWriteLink />
    </div>
  );
}
