import type { PostDto, PostPageDto } from '@/types/api/post';
import { request, requestVoid } from './client-fetcher';

export type PostSortType = 'all' | 'best';

export type GetPostsParams = {
  type?: PostSortType;
  limit?: number;
  cursor?: string;
  search?: string;
};

export const getPosts = (params: GetPostsParams, signal?: AbortSignal) =>
  request<PostPageDto>({ url: '/posts', params, signal });

export const getPost = (postId: number, signal?: AbortSignal) =>
  request<PostDto>({ url: `/posts/${postId}`, signal });

export const deletePost = (postId: number) =>
  requestVoid({ url: `/posts/${postId}`, method: 'DELETE' });
