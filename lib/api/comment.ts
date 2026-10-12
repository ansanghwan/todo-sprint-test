import type {
  CommentDto,
  CommentPageDto,
  CreateCommentBodyDto,
  UpdateCommentBodyDto,
} from '@/types/api/comment';
import { request, requestVoid } from './client-fetcher';

export type GetCommentsParams = {
  limit?: number;
  cursor?: string;
};

// 백엔드는 문자열 'null'을 받아야 대댓글을 빼고 최상위 댓글만 돌려줍니다.
const TOP_LEVEL_PARENT_ID = 'null';

export const getComments = (
  postId: number,
  params: GetCommentsParams,
  signal?: AbortSignal,
) =>
  request<CommentPageDto>({
    url: `/posts/${postId}/comments`,
    params: { parentId: TOP_LEVEL_PARENT_ID, ...params },
    signal,
  });

export const createComment = (postId: number, body: CreateCommentBodyDto) =>
  request<CommentDto>({
    url: `/posts/${postId}/comments`,
    method: 'POST',
    data: body,
  });

export const updateComment = (
  postId: number,
  commentId: number,
  body: UpdateCommentBodyDto,
) =>
  request<CommentDto>({
    url: `/posts/${postId}/comments/${commentId}`,
    method: 'PATCH',
    data: body,
  });

export const deleteComment = (postId: number, commentId: number) =>
  requestVoid({
    url: `/posts/${postId}/comments/${commentId}`,
    method: 'DELETE',
  });
