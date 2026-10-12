'use client';

import Image from 'next/image';
import ErrorRetry from '@/components/common/ErrorRetry';
import usePostList from '@/hooks/post/usePostList';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { Link } from '@/i18n/navigation';
import type { PostListParams } from '@/queries/post';
import PostListItem from './PostListItem';
import PostListSkeleton from './PostListSkeleton';

const NEXT_PAGE_SKELETON_COUNT = 2;

interface PostListProps {
  params: PostListParams;
}

const PostList = ({ params }: PostListProps) => {
  const { posts, isEmpty, hasMore, isLoadingMore, isLoadMoreError, loadMore } =
    usePostList(params);
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: hasMore && !isLoadingMore && !isLoadMoreError,
    onIntersect: loadMore,
  });

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-2.5 py-60 md:gap-4.5">
        <Image
          src="/images/posts/img_empty.svg"
          alt=""
          width={130}
          height={140}
          className="w-20 md:w-32.5"
        />
        <p className="text-sm font-medium text-muted md:text-base">
          아직 등록된 게시물이 없어요.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="게시글 목록">
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.id}`}
              className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-600"
            >
              <PostListItem post={post} />
            </Link>
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} />
      {isLoadingMore && <PostListSkeleton count={NEXT_PAGE_SKELETON_COUNT} />}
      {isLoadMoreError && (
        <ErrorRetry
          message="다음 게시글을 불러오지 못했어요."
          onRetry={() => loadMore()}
        />
      )}
    </section>
  );
};

export default PostList;
