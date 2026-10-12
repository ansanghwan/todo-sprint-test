import {
  infiniteQueryOptions,
  mutationOptions,
  type QueryClient,
} from '@tanstack/react-query';
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from '@/lib/api/comment';
import type { ApiError } from '@/lib/api/errors';
import type { CommentDto, CommentPageDto } from '@/types/api/comment';
import { postQueries } from './post';
import { retryUnlessNotFound } from './retry';

const COMMENT_LIST_LIMIT = 10;

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (postId: number) => [...commentKeys.lists(), postId] as const,
};

export const commentQueries = {
  list: (postId: number) =>
    infiniteQueryOptions({
      queryKey: commentKeys.list(postId),
      queryFn: ({ pageParam, signal }) =>
        getComments(
          postId,
          { limit: COMMENT_LIST_LIMIT, cursor: pageParam },
          signal,
        ),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      retry: retryUnlessNotFound,
    }),
};

// 게시글 상세를 다시 받으면 서버가 조회수를 올리므로, 댓글 수는 캐시에서 직접 바꿉니다.
const changeCommentCount = (
  client: QueryClient,
  postId: number,
  delta: number,
) =>
  client.setQueryData(
    postQueries.detail(postId).queryKey,
    (post) => post && { ...post, commentCount: post.commentCount + delta },
  );

const invalidateCommentList = (client: QueryClient, postId: number) =>
  client.invalidateQueries({ queryKey: commentKeys.list(postId) });

// 이미 삭제된 댓글(404)은 삭제 성공과 똑같이 댓글 수를 줄이고 목록에서 지웁니다.
const removeIfAlreadyDeleted = (
  client: QueryClient,
  postId: number,
  error: ApiError,
) => {
  if (error.httpCategory === 'notFound') {
    changeCommentCount(client, postId, -1);
    return invalidateCommentList(client, postId);
  }
};

const replaceCommentInPage = (
  page: CommentPageDto,
  updated: CommentDto,
): CommentPageDto => ({
  ...page,
  comments: page.comments.map((comment) =>
    comment.id === updated.id ? updated : comment,
  ),
});

type UpdateCommentVariables = { commentId: number; content: string };

export const commentMutations = {
  create: (postId: number) =>
    mutationOptions({
      mutationFn: (content: string) => createComment(postId, { content }),
      onSuccess: (_data, _content, _onMutateResult, context) => {
        changeCommentCount(context.client, postId, 1);
        return invalidateCommentList(context.client, postId);
      },
    }),
  update: (postId: number) =>
    mutationOptions({
      mutationFn: ({ commentId, content }: UpdateCommentVariables) =>
        updateComment(postId, commentId, { content }),
      // 수정은 순서가 바뀌지 않으므로, 불러온 페이지를 전부 다시 받지 않고 응답으로 바꿔 넣습니다.
      onSuccess: (updated, _variables, _onMutateResult, context) =>
        context.client.setQueryData(
          commentQueries.list(postId).queryKey,
          (data) =>
            data && {
              ...data,
              pages: data.pages.map((page) =>
                replaceCommentInPage(page, updated),
              ),
            },
        ),
      onError: (error, _variables, _onMutateResult, context) =>
        removeIfAlreadyDeleted(context.client, postId, error),
    }),
  delete: (postId: number) =>
    mutationOptions({
      mutationFn: (commentId: number) => deleteComment(postId, commentId),
      onSuccess: (_data, _commentId, _onMutateResult, context) => {
        changeCommentCount(context.client, postId, -1);
        return invalidateCommentList(context.client, postId);
      },
      onError: (error, _commentId, _onMutateResult, context) =>
        removeIfAlreadyDeleted(context.client, postId, error),
    }),
};
