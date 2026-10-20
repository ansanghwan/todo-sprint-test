'use client';

import { useDeferredValue, useState } from 'react';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import QueryErrorBoundary from '@/components/boundaries/QueryErrorBoundary';
import useResetPostListCursor from '@/hooks/post/useResetPostListCursor';
import type { PostSortType } from '@/lib/api/post';
import { cn } from '@/lib/utils';
import PostList from './PostList';
import PostListSkeleton from './PostListSkeleton';
import PostSearchForm from './PostSearchForm';
import PostSortDropdown from './PostSortDropdown';

const POST_LIST_LIMIT = 10;
const POST_LIST_SKELETON_COUNT = 5;

const PostListSection = () => {
  const [sort, setSort] = useState<PostSortType>('all');
  const [search, setSearch] = useState('');
  const deferredSort = useDeferredValue(sort);
  const deferredSearch = useDeferredValue(search);
  const isUpdating = sort !== deferredSort || search !== deferredSearch;
  const { resetCursor } = useResetPostListCursor();

  // 바꿀 조건의 목록을 1페이지로 초기화합니다. 화면의 이전 목록은 새 목록이 올 때까지 그대로 둡니다.
  const changeSort = (nextSort: PostSortType) => {
    if (nextSort === sort) return;
    resetCursor({
      type: nextSort,
      limit: POST_LIST_LIMIT,
      search: search || undefined,
    });
    setSort(nextSort);
  };

  const changeSearch = (nextSearch: string) => {
    if (nextSearch === search) return;
    resetCursor({
      type: sort,
      limit: POST_LIST_LIMIT,
      search: nextSearch || undefined,
    });
    setSearch(nextSearch);
  };

  return (
    <div className="flex flex-col gap-2 md:gap-0">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <PostSearchForm onSearch={changeSearch} />
        <PostSortDropdown value={sort} onChange={changeSort} />
      </div>
      {/* Suspense를 바깥에 두어 조건이 바뀌어도 다시 마운트되지 않게 합니다(이전 목록 유지).
          에러 경계는 조건마다 새로 만들어 이전 조회의 에러 상태를 비웁니다. */}
      <ClientSuspense
        fallback={<PostListSkeleton count={POST_LIST_SKELETON_COUNT} />}
      >
        <QueryErrorBoundary
          key={`${deferredSort}/${deferredSearch}`}
          message="게시글을 불러오지 못했어요."
        >
          <div
            aria-busy={isUpdating}
            className={cn(
              'transition-opacity motion-reduce:transition-none',
              isUpdating && 'opacity-60',
            )}
          >
            <PostList
              params={{
                type: deferredSort,
                limit: POST_LIST_LIMIT,
                search: deferredSearch || undefined,
              }}
            />
          </div>
        </QueryErrorBoundary>
      </ClientSuspense>
    </div>
  );
};

export default PostListSection;
