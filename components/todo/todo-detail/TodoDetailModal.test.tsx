import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import { getNote } from '@/lib/api/notes';
import { getTodo } from '@/lib/api/todos';
import { installRadixDomMocks } from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import { makeNote, makeTodo } from '@/test/todoMocks';
import type { TodoDto } from '@/types/api/todo';
import TodoDetailModal, { type TodoDetailModalProps } from './TodoDetailModal';

vi.mock('@/lib/api/todos', () => ({ getTodo: vi.fn() }));
vi.mock('@/lib/api/notes', () => ({ getNote: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const mockedGetTodo = vi.mocked(getTodo);

const TODO_ID = 7;
const TODO = makeTodo(TODO_ID, {
  title: '보고서 작성',
  done: false,
  goalId: 1,
  goal: { id: 1, title: '목표 1' },
  // KST 2026-10-10 23:59:59
  dueDate: '2026-10-10T14:59:59.000Z',
  tags: [
    { id: 1, name: '공부' },
    { id: 2, name: '운동' },
  ],
  linkUrl: 'https://example.com',
  fileUrl: 'https://files.test/a.png',
});

beforeEach(() => {
  installRadixDomMocks();
  mockedGetTodo.mockResolvedValue(TODO);
});

afterEach(() => {
  vi.clearAllMocks();
});

const setup = (props: Partial<TodoDetailModalProps> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const handlers = {
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <IntlTestProvider>
      <QueryClientProvider client={queryClient}>
        <TodoDetailModal todoId={TODO_ID} {...handlers} {...props} />
      </QueryClientProvider>
    </IntlTestProvider>,
  );
  return { user: userEvent.setup(), ...handlers };
};

/** 상세 값이 그려질 때까지 기다린 뒤 모달을 돌려줍니다. */
const findDetail = async (title = '보고서 작성') =>
  screen.findByRole('dialog', { name: new RegExp(title) });

const infoValue = (dialog: HTMLElement, label: string) =>
  within(dialog).getByText(label, { selector: 'dt' }).nextElementSibling;

const renderWith = (todo: Partial<TodoDto>) => {
  mockedGetTodo.mockResolvedValue({ ...TODO, ...todo });
  return setup();
};

describe('TodoDetailModal', () => {
  describe('기본 정보 (FN-TD-40, 41)', () => {
    it('조회한 할 일의 제목·상태·목표·마감기한·태그를 보여 준다', async () => {
      setup();
      const dialog = await findDetail();

      expect(mockedGetTodo).toHaveBeenCalledWith(TODO_ID, expect.anything());
      expect(within(dialog).getByText('TO DO')).toBeInTheDocument();
      expect(infoValue(dialog, '목표')).toHaveTextContent('목표 1');
      expect(infoValue(dialog, '마감기한')).toHaveTextContent('2026. 10. 10');
      const tags = within(infoValue(dialog, '태그') as HTMLElement);
      expect(
        tags.getAllByRole('listitem').map((tag) => tag.textContent),
      ).toEqual(['공부', '운동']);
      // 읽기 전용이라 태그 삭제 버튼이 없습니다.
      expect(tags.queryByRole('button')).not.toBeInTheDocument();
    });

    it('완료한 할 일은 DONE으로 보여 준다', async () => {
      renderWith({ done: true });

      expect(within(await findDetail()).getByText('DONE')).toBeInTheDocument();
    });

    it('목표·마감기한·태그가 없으면 값 자리에 -를 보여 준다', async () => {
      renderWith({ goalId: null, goal: null, dueDate: null, tags: [] });
      const dialog = await findDetail();

      expect(infoValue(dialog, '목표')).toHaveTextContent('-');
      expect(infoValue(dialog, '마감기한')).toHaveTextContent('-');
      expect(infoValue(dialog, '태그')).toHaveTextContent('-');
    });
  });

  describe('첨부자료 (FN-TD-42)', () => {
    it('링크와 이미지를 보여 준다', async () => {
      setup();
      const dialog = await findDetail();

      expect(within(dialog).getByText('첨부자료')).toBeInTheDocument();
      const link = within(dialog).getByRole('link', {
        name: /https:\/\/example\.com/,
      });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(
        within(dialog).getByRole('img', { name: '첨부 이미지' }),
      ).toHaveAttribute('src', 'https://files.test/a.png');
    });

    it('링크만 있으면 이미지 없이 링크만 보여 준다', async () => {
      renderWith({ fileUrl: null });
      const dialog = await findDetail();

      expect(within(dialog).getByText('첨부자료')).toBeInTheDocument();
      expect(within(dialog).getByRole('link')).toBeInTheDocument();
      expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    });

    it('링크와 이미지가 둘 다 없으면 첨부자료 영역을 숨긴다', async () => {
      renderWith({ linkUrl: null, fileUrl: null });
      const dialog = await findDetail();

      expect(within(dialog).queryByText('첨부자료')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('link')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('조회 상태', () => {
    it('불러오는 중에는 안내를 보여 준다', () => {
      mockedGetTodo.mockReturnValue(new Promise(() => {}));
      setup();

      expect(screen.getByRole('status')).toHaveTextContent(
        '할 일을 불러오는 중이에요',
      );
    });

    it('조회에 실패하면 토스트를 띄우고, 다시 시도로 상세를 보여 준다', async () => {
      mockedGetTodo.mockRejectedValueOnce(new Error('network'));
      const { user } = setup();

      await user.click(
        await screen.findByRole('button', { name: '다시 시도' }),
      );

      expect(toast.error).toHaveBeenCalledWith('할 일을 불러오지 못했어요');
      expect(await findDetail()).toBeInTheDocument();
      expect(mockedGetTodo).toHaveBeenCalledTimes(2);
    });
  });

  describe('수정·삭제·닫기', () => {
    it('케밥의 수정하기는 이 할 일의 id로 onEdit을 호출한다', async () => {
      const { user, onEdit } = setup();
      const dialog = await findDetail();

      await user.click(within(dialog).getByRole('button', { name: '더보기' }));
      await user.click(
        await screen.findByRole('menuitem', { name: '수정하기' }),
      );

      expect(onEdit).toHaveBeenCalledWith(TODO_ID);
    });

    it('케밥의 삭제하기는 이 할 일의 id·제목으로 onDelete를 호출한다', async () => {
      const { user, onDelete } = setup();
      const dialog = await findDetail();

      await user.click(within(dialog).getByRole('button', { name: '더보기' }));
      await user.click(
        await screen.findByRole('menuitem', { name: '삭제하기' }),
      );

      expect(onDelete).toHaveBeenCalledWith({
        id: TODO_ID,
        title: '보고서 작성',
      });
    });

    it('onDelete를 넘기지 않으면 케밥을 그리지 않는다', async () => {
      setup({ onDelete: undefined });
      const dialog = await findDetail();

      expect(
        within(dialog).queryByRole('button', { name: '더보기' }),
      ).not.toBeInTheDocument();
    });

    it('X를 누르면 onClose를 호출한다', async () => {
      const { user, onClose } = setup();
      const dialog = await findDetail();

      await user.click(within(dialog).getByRole('button', { name: '닫기' }));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });
  });

  describe('작성된 노트 (FN-TD-43)', () => {
    const WITH_NOTE = { ...TODO, noteIds: [21] };

    it('노트 제목을 보여 주고, 누르면 노트 id로 onOpenNote를 호출한다', async () => {
      vi.mocked(getNote).mockResolvedValue(
        makeNote(WITH_NOTE, { id: 21, title: '보고서 메모' }),
      );
      mockedGetTodo.mockResolvedValue(WITH_NOTE);
      const onOpenNote = vi.fn();
      const { user } = setup({ onOpenNote });
      const dialog = await findDetail();

      expect(within(dialog).getByText('작성된 노트')).toBeInTheDocument();
      await user.click(
        await within(dialog).findByRole('button', { name: '보고서 메모' }),
      );

      expect(onOpenNote).toHaveBeenCalledWith(21);
    });

    it('onOpenNote를 넘기지 않으면 작성된 노트를 보여 주지 않는다', async () => {
      mockedGetTodo.mockResolvedValue(WITH_NOTE);
      setup();
      const dialog = await findDetail();

      expect(within(dialog).queryByText('작성된 노트')).not.toBeInTheDocument();
      expect(getNote).not.toHaveBeenCalled();
    });
  });
});
