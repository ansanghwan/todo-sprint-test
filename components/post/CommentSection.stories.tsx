import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { ApiError } from '@/lib/api/errors';
import { createMockPosts } from '@/lib/test/fixtures/post';
import { commentKeys } from '@/queries/comment';
import { postKeys } from '@/queries/post';
import { userKeys } from '@/queries/user';
import type { CommentDto, CommentPageDto } from '@/types/api/comment';
import type { UserDto } from '@/types/api/user';
import CommentListSkeleton from './CommentListSkeleton';
import CommentSection from './CommentSection';

const MY_ID = 1;

const WRITERS = [
  { id: MY_ID, name: '체다치즈', image: null },
  { id: 2, name: '고양이', image: 'https://picsum.photos/seed/cat/40' },
  // 작성자 이름은 API 기준 최대 20자입니다.
  { id: 3, name: '이름이아주아주아주긴작성자닉네임입니다요', image: null },
];

const CONTENTS = [
  '좋은 글이네요! 저도 타이머 써봐야겠어요.',
  '저는 아침에 할 일 세 개만 정하고 시작해요.',
  '댓글이 길어지는 경우를 확인하기 위한 댓글입니다. 여러 줄로 넘어가면 줄바꿈이 어떻게 되는지 보려고 일부러 길게 적어 봤어요.\n줄바꿈도\n그대로 보여야 합니다.',
  '띄어쓰기없이아주길게이어지는댓글도영역을넘치지않고잘줄바꿈되는지확인합니다띄어쓰기없이아주길게이어지는댓글',
];

const createMockComments = (postId: number, count: number): CommentDto[] =>
  Array.from({ length: count }, (_, index) => {
    const createdAt = new Date(Date.UTC(2026, 8, 29 - index)).toISOString();
    return {
      id: index + 1,
      teamId: 'team',
      userId: WRITERS[index % WRITERS.length].id,
      postId,
      parentId: null,
      content: CONTENTS[index % CONTENTS.length],
      likeCount: 0,
      isLiked: false,
      createdAt,
      updatedAt: createdAt,
      writer: WRITERS[index % WRITERS.length],
    };
  });

type CommentState = 'list' | 'empty' | 'error' | 'notFound';

const [post] = createMockPosts(1);
const COMMENT_COUNTS: Record<'list' | 'empty', number> = { list: 8, empty: 0 };

// 네트워크 없이 보여주도록 캐시에 더미 데이터를 미리 넣습니다.
const createSeededClient = (commentState: CommentState) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(userKeys.me(), { id: MY_ID } as UserDto);

  if (commentState === 'error' || commentState === 'notFound') {
    client
      .getQueryCache()
      .build(client, { queryKey: commentKeys.list(post.id) })
      .setState({
        status: 'error',
        error:
          commentState === 'notFound'
            ? new ApiError('http', 'Not found', { status: 404 })
            : new ApiError('http', 'Server error', { status: 500 }),
      });
    return client;
  }

  const count = COMMENT_COUNTS[commentState];
  client.setQueryData(postKeys.detail(post.id), {
    ...post,
    commentCount: count,
  });
  // 다음 페이지가 없도록 nextCursor를 비워 무한 스크롤 요청을 막습니다.
  const page: CommentPageDto = {
    comments: createMockComments(post.id, count),
    nextCursor: null,
    totalCount: count,
  };
  client.setQueryData(commentKeys.list(post.id), {
    pages: [page],
    pageParams: [undefined],
  });
  return client;
};

interface CommentSectionPreviewProps {
  commentState: CommentState;
  isLoading?: boolean;
}

// 상세 page.tsx 카드 안에서 게시글 아래에 놓이는 모습 그대로 그립니다.
const CommentSectionPreview = ({
  commentState,
  isLoading = false,
}: CommentSectionPreviewProps) => (
  <NextIntlClientProvider locale="ko" messages={{}}>
    <QueryClientProvider client={createSeededClient(commentState)}>
      <div className="min-h-dvh bg-background p-4 md:p-6">
        <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white-section px-5 py-6 md:rounded-4xl md:p-10 lg:p-14">
          {isLoading ? (
            <CommentListSkeleton count={3} />
          ) : (
            <CommentSection postId={post.id} />
          )}
        </div>
      </div>
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const meta = {
  title: 'Posts/CommentSection',
  component: CommentSectionPreview,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { commentState: 'list' },
  argTypes: {
    commentState: {
      control: 'inline-radio',
      options: ['list', 'empty', 'error', 'notFound'],
    },
  },
} satisfies Meta<typeof CommentSectionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = { name: '댓글 목록 (내 댓글 포함)' };

export const Empty: Story = {
  name: '댓글 없음',
  args: { commentState: 'empty' },
};

export const LoadError: Story = {
  name: '불러오기 실패',
  args: { commentState: 'error' },
};

export const NotFound: Story = {
  name: '없는 게시글 (404, 빈 영역)',
  args: { commentState: 'notFound' },
};

export const Loading: Story = {
  name: '로딩',
  args: { commentState: 'list', isLoading: true },
};
