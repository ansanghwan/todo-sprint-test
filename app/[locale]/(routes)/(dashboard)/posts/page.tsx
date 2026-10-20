import ClientSuspense from '@/components/boundaries/ClientSuspense';
import QueryErrorBoundary from '@/components/boundaries/QueryErrorBoundary';
import BestPostList from '@/components/post/BestPostList';
import BestPostListSkeleton from '@/components/post/BestPostListSkeleton';
import PostListSection from '@/components/post/PostListSection';
import PostWriteLink from '@/components/post/PostWriteLink';

export default function PostsPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-10 lg:mx-auto lg:w-full lg:max-w-300">
      <h2 className="hidden px-2 text-xl font-semibold text-heading md:block lg:text-2xl">
        소통 게시판
      </h2>
      <QueryErrorBoundary message="인기 게시글을 불러오지 못했어요.">
        <ClientSuspense fallback={<BestPostListSkeleton />}>
          <BestPostList />
        </ClientSuspense>
      </QueryErrorBoundary>
      <PostListSection />
      <PostWriteLink />
    </div>
  );
}
