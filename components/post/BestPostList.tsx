'use client';

import useBestPosts from '@/hooks/post/useBestPosts';
import { Link } from '@/i18n/navigation';
import BestPostCard from './BestPostCard';

const BestPostList = () => {
  const { posts, isEmpty } = useBestPosts();

  if (isEmpty) {
    return null;
  }

  return (
    <section aria-label="인기 게시글">
      <ul className="flex gap-4 overflow-x-auto p-2 md:gap-6 lg:grid lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="flex">
            <Link
              href={`/posts/${post.id}`}
              className="flex shrink-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 md:rounded-4xl lg:w-full"
            >
              <BestPostCard post={post} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default BestPostList;
