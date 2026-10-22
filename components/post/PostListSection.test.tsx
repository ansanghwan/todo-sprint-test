import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPosts } from '@/lib/api/post';
import { createMockPosts } from '@/lib/test/fixtures/post';
import { postQueries } from '@/queries/post';
import IntlTestProvider from '@/test/IntlTestProvider';
import PostListSection from './PostListSection';

vi.mock('@/lib/api/post', () => ({
  getPosts: vi.fn(async () => ({ posts: [], nextCursor: null, totalCount: 0 })),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: (props: ComponentProps<'a'>) => <a {...props} />,
}));

afterEach(cleanup);

describe('게시글 정렬', () => {
  it('인기순을 고르면 type=best로 처음부터 다시 조회하고 정렬명을 바꾼다', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <IntlTestProvider>
          <PostListSection />
        </IntlTestProvider>
      </QueryClientProvider>,
    );
    await screen.findByText('아직 등록된 게시물이 없어요');
    expect(getPosts).toHaveBeenLastCalledWith(
      { type: 'all', limit: 10, cursor: undefined },
      expect.anything(),
    );

    fireEvent.keyDown(screen.getByRole('button', { name: /최신순/ }), {
      key: 'Enter',
    });
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: '인기순' }),
    );

    await vi.waitFor(() =>
      expect(getPosts).toHaveBeenLastCalledWith(
        { type: 'best', limit: 10, cursor: undefined },
        expect.anything(),
      ),
    );
    expect(screen.getByRole('button', { name: /인기순/ })).toBeInTheDocument();
  });
});

describe('조건 변경 시 에러 초기화', () => {
  it('목록 조회가 실패한 뒤 정렬을 바꾸면 에러를 지우고 새 목록을 보여 준다', async () => {
    const [post] = createMockPosts(1);
    vi.mocked(getPosts).mockImplementation(({ type }) =>
      type === 'best'
        ? Promise.resolve({ posts: [post], nextCursor: null, totalCount: 1 })
        : Promise.reject(new Error('목록 조회 실패')),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <IntlTestProvider>
          <PostListSection />
        </IntlTestProvider>
      </QueryClientProvider>,
    );
    await screen.findByText('게시글을 불러오지 못했어요.');

    fireEvent.keyDown(screen.getByRole('button', { name: /최신순/ }), {
      key: 'Enter',
    });
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: '인기순' }),
    );

    await screen.findByText(post.title);
    expect(
      screen.queryByText('게시글을 불러오지 못했어요.'),
    ).not.toBeInTheDocument();
    vi.mocked(console.error).mockRestore();
  });
});

describe('조건 변경 중 이전 목록 유지', () => {
  it('새 정렬 목록을 받는 동안 이전 목록을 흐리게 유지한다', async () => {
    const [post] = createMockPosts(1);
    vi.mocked(getPosts).mockImplementation(({ type }) =>
      type === 'best'
        ? new Promise(() => {})
        : Promise.resolve({ posts: [post], nextCursor: null, totalCount: 1 }),
    );
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <IntlTestProvider>
          <PostListSection />
        </IntlTestProvider>
      </QueryClientProvider>,
    );
    await screen.findByText(post.title);

    fireEvent.keyDown(screen.getByRole('button', { name: /최신순/ }), {
      key: 'Enter',
    });
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: '인기순' }),
    );
    await vi.waitFor(() =>
      expect(getPosts).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'best' }),
        expect.anything(),
      ),
    );

    expect(screen.getByRole('button', { name: /인기순/ })).toBeInTheDocument();
    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});

describe('정렬 커서 초기화', () => {
  const selectSort = async (current: RegExp, next: string) => {
    fireEvent.keyDown(screen.getByRole('button', { name: current }), {
      key: 'Enter',
    });
    fireEvent.click(await screen.findByRole('menuitemradio', { name: next }));
  };

  it('봤던 정렬로 돌아오면 1페이지만 다시 조회한다', async () => {
    const nextCursorOf: Record<string, string | null> = {
      start: 'c1',
      c1: 'c2',
      c2: null,
    };
    vi.mocked(getPosts).mockImplementation(async ({ cursor }) => ({
      posts: [],
      nextCursor: nextCursorOf[cursor ?? 'start'],
      totalCount: 0,
    }));
    // 앱과 같은 staleTime. 돌아올 때는 시간을 넘겨 stale 상태로 만듭니다.
    const STALE_TIME = 60 * 1000;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: STALE_TIME } },
    });
    queryClient.setQueryData(
      postQueries.list({ type: 'all', limit: 10 }).queryKey,
      {
        pages: ['c1', 'c2', null].map((nextCursor) => ({
          posts: [],
          nextCursor,
          totalCount: 0,
        })),
        pageParams: [undefined, 'c1', 'c2'],
      },
    );
    render(
      <QueryClientProvider client={queryClient}>
        <IntlTestProvider>
          <PostListSection />
        </IntlTestProvider>
      </QueryClientProvider>,
    );
    await screen.findByText('아직 등록된 게시물이 없어요');

    await selectSort(/최신순/, '인기순');
    await screen.findByRole('button', { name: /인기순/ });
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0));
    vi.mocked(getPosts).mockClear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + STALE_TIME + 1);

    const allSortCalls = () =>
      vi
        .mocked(getPosts)
        .mock.calls.filter(([params]) => params.type === 'all');
    await selectSort(/인기순/, '최신순');
    await vi.waitFor(() => expect(allSortCalls().length).toBeGreaterThan(0));
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0));

    vi.useRealTimers();
    expect(allSortCalls()).toHaveLength(1);
  });
});

describe('게시글 검색', () => {
  const submitSearch = (keyword: string) => {
    const input = screen.getByRole('textbox', { name: '게시글 검색' });
    fireEvent.change(input, { target: { value: keyword } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
  };

  const renderSection = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <IntlTestProvider>
          <PostListSection />
        </IntlTestProvider>
      </QueryClientProvider>,
    );

  it('검색어를 넣고 검색하면 search 파라미터로 처음부터 다시 조회한다', async () => {
    renderSection();
    await screen.findByText('아직 등록된 게시물이 없어요');

    submitSearch('  스터디  ');

    await vi.waitFor(() =>
      expect(getPosts).toHaveBeenLastCalledWith(
        { type: 'all', limit: 10, search: '스터디', cursor: undefined },
        expect.anything(),
      ),
    );
  });

  it('적용된 검색어와 같으면 검색 버튼이 비활성화된다', async () => {
    renderSection();
    await screen.findByText('아직 등록된 게시물이 없어요');
    const searchButton = screen.getByRole('button', { name: '검색' });

    expect(searchButton).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: '게시글 검색' }), {
      target: { value: '   ' },
    });
    expect(searchButton).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: '게시글 검색' }), {
      target: { value: '스터디' },
    });
    expect(searchButton).toBeEnabled();

    fireEvent.click(searchButton);
    expect(searchButton).toBeDisabled();

    // 검색어를 지우면 다시 눌러 검색을 해제할 수 있어야 합니다.
    fireEvent.change(screen.getByRole('textbox', { name: '게시글 검색' }), {
      target: { value: '' },
    });
    expect(searchButton).toBeEnabled();
  });
});
