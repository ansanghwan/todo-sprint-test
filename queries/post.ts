import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from '@tanstack/react-query';
import {
  deletePost,
  getPost,
  getPosts,
  type GetPostsParams,
} from '@/lib/api/post';
import { retryUnlessNotFound } from './retry';

const BEST_POSTS_PARAMS = { type: 'best', limit: 3 } as const;

export type PostListParams = Omit<GetPostsParams, 'cursor'>;

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params: PostListParams) => [...postKeys.lists(), params] as const,
  best: () => [...postKeys.all, 'best', BEST_POSTS_PARAMS] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (postId: number) => [...postKeys.details(), postId] as const,
};

export const postQueries = {
  best: () =>
    queryOptions({
      queryKey: postKeys.best(),
      queryFn: ({ signal }) => getPosts(BEST_POSTS_PARAMS, signal),
    }),
  list: (params: PostListParams) =>
    infiniteQueryOptions({
      queryKey: postKeys.list(params),
      queryFn: ({ pageParam, signal }) =>
        getPosts({ ...params, cursor: pageParam }, signal),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),
  detail: (postId: number) =>
    queryOptions({
      queryKey: postKeys.detail(postId),
      queryFn: ({ signal }) => getPost(postId, signal),
      retry: retryUnlessNotFound,
      // 상세 조회마다 서버가 조회수를 올리므로, 포커스·재연결 때 다시 받지 않습니다.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
};

export const postMutations = {
  delete: () =>
    mutationOptions({
      mutationFn: deletePost,
      // 삭제한 게시글 상세는 캐시에서 지웁니다. 무효화만 하면 다시 열 때 캐시된 글이 보이고,
      // 상세 화면이 떠 있는 동안 재조회하면 404가 납니다.
      onSuccess: (_data, postId, _onMutateResult, context) => {
        context.client.removeQueries({ queryKey: postKeys.detail(postId) });
        return context.client.invalidateQueries({ queryKey: postKeys.all });
      },
    }),
};
