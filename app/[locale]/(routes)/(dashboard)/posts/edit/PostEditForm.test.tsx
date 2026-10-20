import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPost } from '@/lib/api/post';
import { postKeys } from '@/queries/post';
import type { PostFormValues } from '@/components/post/PostForm';
import PostEditForm from './PostEditForm';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api/post', () => ({ getPost: vi.fn() }));
vi.mock('@/components/post/PostForm', () => ({
  default: ({ defaultValues }: { defaultValues: PostFormValues }) => (
    <p>{defaultValues.title}</p>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('게시글 수정 폼', () => {
  it('상세 캐시가 오래됐어도 다시 조회하지 않고 캐시 값으로 채운다', async () => {
    const client = new QueryClient();
    client.setQueryData(
      postKeys.detail(5),
      { id: 5, title: '기존 제목', content: '{}', image: null },
      { updatedAt: 0 },
    );

    render(
      <QueryClientProvider client={client}>
        <PostEditForm postId={5} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('기존 제목')).toBeDefined();
    expect(getPost).not.toHaveBeenCalled();
  });
});
