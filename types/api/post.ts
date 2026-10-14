export interface WriterDto {
  id: number;
  name: string;
  image: string | null;
}

export interface PostDto {
  id: number;
  teamId: string;
  userId: number;
  title: string;
  content: string;
  image: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  writer: WriterDto;
  commentCount: number;
}

export interface PostPageDto {
  posts: PostDto[];
  nextCursor: string | null;
  totalCount: number;
}

/** POST /posts 요청 body */
export interface CreatePostRequest {
  title: string;
  content: string;
  image?: string;
}

/** PATCH /posts/{postId} 요청 body. 보낸 필드만 수정됩니다. */
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  image?: string | null;
}
