'use client';

import { useState } from 'react';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import QueryErrorBoundary from '@/components/boundaries/QueryErrorBoundary';
import type { PostSortType } from '@/lib/api/post';
import PostList from './PostList';
import PostListSkeleton from './PostListSkeleton';
import PostSearchForm from './PostSearchForm';
import PostSortDropdown from './PostSortDropdown';

const POST_LIST_LIMIT = 10;
const POST_LIST_SKELETON_COUNT = 5;

const PostListSection = () => {
  const [sort, setSort] = useState<PostSortType>('all');
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col gap-2 md:gap-0">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <PostSearchForm onSearch={setSearch} />
        <PostSortDropdown value={sort} onChange={setSort} />
      </div>
      {/* 정렬·검색어를 바꾸면 이전 조회의 에러 상태를 비우고 새로 조회합니다. */}
      <QueryErrorBoundary
        key={`${sort}/${search}`}
        message="게시글을 불러오지 못했어요."
      >
        <ClientSuspense
          fallback={<PostListSkeleton count={POST_LIST_SKELETON_COUNT} />}
        >
          <PostList
            params={{
              type: sort,
              limit: POST_LIST_LIMIT,
              search: search || undefined,
            }}
          />
        </ClientSuspense>
      </QueryErrorBoundary>
    </div>
  );
};

export default PostListSection;
