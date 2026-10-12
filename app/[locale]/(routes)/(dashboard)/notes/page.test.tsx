import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/ko.json';
import { getNotes } from '@/lib/api/notes';
import Page from './page';
import type { NoteList } from '@/types/api/note';

const replace = vi.fn();
let currentSearch = '';

vi.mock('@/lib/api/notes', () => ({ getNotes: vi.fn() }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/notes',
}));

const firstPage: NoteList = {
  notes: [
    {
      id: 7,
      teamId: 'team-abc',
      userId: 1,
      todoId: 12,
      title: 'API 설계 메모',
      content: null,
      linkUrl: 'https://docs.example.com',
      createdAt: '2026-02-16T09:00:00.000Z',
      updatedAt: '2026-02-16T09:00:00.000Z',
      todo: { id: 12, title: 'API 문서 작성', done: false },
    },
  ],
  nextCursor: null,
  totalCount: 1,
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe('NotesPage', () => {
  beforeEach(() => {
    currentSearch = '';
    replace.mockReset();
    vi.mocked(getNotes).mockReset();
    vi.mocked(getNotes).mockResolvedValue(firstPage);
  });

  it('페이지 제목과 목표 정보를 렌더링한다', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 2, name: '노트 모아보기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: '자바스크립트로 웹 서비스 만들기',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '목표 아이콘' }),
    ).toBeInTheDocument();
  });

  it('노트 검색 입력창을 렌더링한다', () => {
    renderPage();

    expect(screen.getByPlaceholderText('노트를 검색해주세요')).toHaveAttribute(
      'type',
      'search',
    );
  });

  it('API로 조회한 노트를 렌더링한다', async () => {
    renderPage();

    const list = await screen.findByRole('list');
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText('API 설계 메모')).toBeInTheDocument();
    expect(within(items[0]).getByText('API 문서 작성')).toBeInTheDocument();
    expect(within(items[0]).getByText('TO DO')).toBeInTheDocument();
  });

  it('노트가 없으면 빈 상태를 보여준다', async () => {
    vi.mocked(getNotes).mockResolvedValue({
      notes: [],
      nextCursor: null,
      totalCount: 0,
    });
    renderPage();

    expect(
      await screen.findByText('아직 등록된 노트가 없어요'),
    ).toBeInTheDocument();
  });

  it('조회에 실패하면 다시 시도 버튼을 보여준다', async () => {
    vi.mocked(getNotes).mockRejectedValue(new Error('boom'));
    renderPage();

    expect(
      await screen.findByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });

  it('URL의 검색어와 정렬 기준으로 노트를 조회한다', async () => {
    currentSearch = 'search=API&sort=oldest';
    renderPage();

    await screen.findByRole('list');
    expect(getNotes).toHaveBeenCalledWith(
      { search: 'API', sort: 'oldest', cursor: undefined },
      expect.any(AbortSignal),
    );
    // 새로고침해도 검색창에 검색어가 채워져 있는지
    expect(screen.getByPlaceholderText('노트를 검색해주세요')).toHaveValue(
      'API',
    );
  });

  it('URL의 정렬 값이 잘못되면 최신순으로 조회한다', async () => {
    currentSearch = 'sort=abc';
    renderPage();

    await screen.findByRole('list');
    expect(getNotes).toHaveBeenCalledWith(
      { sort: 'latest', cursor: undefined, search: undefined },
      expect.any(AbortSignal),
    );
  });

  it('검색어를 입력하고 Enter를 누르면 URL에 검색어를 넣는다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText('노트를 검색해주세요'),
      'API{Enter}',
    );

    expect(replace).toHaveBeenLastCalledWith('/notes?search=API', {
      scroll: false,
    });
  });

  it('정렬을 바꾸면 URL에 정렬 기준을 넣는다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '최신순' }));
    await user.click(screen.getByRole('menuitemradio', { name: '오래된 순' }));

    expect(replace).toHaveBeenCalledWith('/notes?sort=oldest', {
      scroll: false,
    });
  });
});
