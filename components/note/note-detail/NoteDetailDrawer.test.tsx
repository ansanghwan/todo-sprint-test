import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import { getNote } from '@/lib/api/notes';
import { installRadixDomMocks } from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import { makeNote, makeTodo } from '@/test/todoMocks';
import NoteDetailDrawer from './NoteDetailDrawer';

vi.mock('@/lib/api/notes', () => ({ getNote: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const mockedGetNote = vi.mocked(getNote);

const NOTE = makeNote(
  makeTodo(4, {
    title: '자바스크립트 기초 듣기',
    done: false,
    goal: { id: 1, title: '웹 서비스 만들기' },
    tags: [
      { id: 1, name: '코딩' },
      { id: 2, name: '공부' },
    ],
  }),
  {
    id: 4,
    title: '프로그래밍과 데이터',
    createdAt: '2026-10-01T09:00:00.000Z',
  },
);

beforeEach(() => {
  installRadixDomMocks();
  mockedGetNote.mockResolvedValue(NOTE);
});

afterEach(() => {
  vi.clearAllMocks();
});

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onClose = vi.fn();
  render(
    <IntlTestProvider>
      <QueryClientProvider client={queryClient}>
        <NoteDetailDrawer noteId={4} onClose={onClose} />
      </QueryClientProvider>
    </IntlTestProvider>,
  );
  return { user: userEvent.setup(), onClose };
};

const findDrawer = () =>
  screen.findByRole('dialog', { name: /프로그래밍과 데이터/ });

const metaValue = (dialog: HTMLElement, label: string) =>
  within(dialog).getByText(label, { selector: 'dt' }).nextElementSibling;

describe('NoteDetailDrawer', () => {
  it('노트 제목·메타 정보·본문을 보여 준다', async () => {
    setup();
    const dialog = await findDrawer();

    expect(mockedGetNote).toHaveBeenCalledWith(4, expect.anything());
    expect(metaValue(dialog, '프로젝트')).toHaveTextContent('웹 서비스 만들기');
    expect(metaValue(dialog, '작성일')).toHaveTextContent('2026.10.01');
    expect(metaValue(dialog, '할 일')).toHaveTextContent(
      '자바스크립트 기초 듣기',
    );
    expect(metaValue(dialog, '할 일')).toHaveTextContent('TO DO');
    expect(metaValue(dialog, '태그')).toHaveTextContent('코딩, 공부');
    expect(
      await within(dialog).findByText('핵심 개념 정리하기'),
    ).toBeInTheDocument();
  });

  it('본문의 링크는 새 탭으로 여는 일반 링크로 보여 준다', async () => {
    setup();
    const dialog = await findDrawer();

    const link = await within(dialog).findByRole('link', { name: '강의 노트' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('불러오는 중에는 안내를 보여 준다', () => {
    mockedGetNote.mockReturnValue(new Promise(() => {}));
    setup();

    expect(screen.getByRole('status')).toHaveTextContent(
      '작업 기록을 불러오는 중이에요',
    );
  });

  it('조회에 실패하면 토스트를 띄우고, 다시 시도로 노트를 보여 준다', async () => {
    mockedGetNote.mockRejectedValueOnce(new Error('network'));
    const { user } = setup();

    await user.click(await screen.findByRole('button', { name: '다시 시도' }));

    expect(toast.error).toHaveBeenCalledWith('작업 기록을 불러오지 못했어요');
    expect(await findDrawer()).toBeInTheDocument();
    expect(mockedGetNote).toHaveBeenCalledTimes(2);
  });

  it('X를 누르면 onClose를 호출한다', async () => {
    const { user, onClose } = setup();
    const dialog = await findDrawer();

    await user.click(within(dialog).getByRole('button', { name: '닫기' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
