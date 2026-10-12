import { notFound } from 'next/navigation';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import CommentSection from '@/components/post/CommentSection';
import PostDetail from '@/components/post/PostDetail';
import PostDetailErrorBoundary from '@/components/post/PostDetailErrorBoundary';
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton';

export default async function PostDetailPage({
  params,
}: PageProps<'/[locale]/posts/[postId]'>) {
  const postId = Number((await params).postId);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 rounded-3xl bg-white-section px-5 py-6 md:gap-14 md:rounded-4xl md:p-10 lg:p-14">
      <PostDetailErrorBoundary>
        <ClientSuspense fallback={<PostDetailSkeleton />}>
          <PostDetail postId={postId} />
        </ClientSuspense>
      </PostDetailErrorBoundary>
      <CommentSection postId={postId} />
    </div>
  );
}
