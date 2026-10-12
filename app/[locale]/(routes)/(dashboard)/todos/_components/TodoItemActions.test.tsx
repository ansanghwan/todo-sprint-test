import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import {
  addTodoFavorite,
  deleteTodo,
  getTodos,
  updateTodo,
} from '@/lib/api/todos';
import TestProviders from '@/test/TestProviders';
import { makeTodo } from '@/test/todoMocks';
import type { TodoDto } from '@/types/api/todo';
import TodosView from './TodosView';

vi.mock('@/lib/api/todos', () => ({
  getTodos: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
}));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// 서버에 있는 할 일. 변경이 성공하면 이 배열을 바꾸고, 목록 재조회는 이 배열을 돌려줍니다.
let serverTodos: TodoDto[] = [];

beforeEach(() => {
  serverTodos = [
    makeTodo(1, {
      title: '할 일 1',
      done: false,
      isFavorite: false,
      linkUrl: 'https://example.com/1',
      noteIds: [],
    }),
    makeTodo(2, {
      title: '할 일 2',
      done: false,
      isFavorite: false,
      linkUrl: null,
      noteIds: [],
    }),
  ];
  vi.mocked(getTodos).mockImplementation(async () => ({
    todos: serverTodos.map((todo) => ({ ...todo })),
    nextCursor: null,
    totalCount: serverTodos.length,
  }));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const renderTodos = async () => {
  render(
    <TestProviders>
      <TodosView />
    </TestProviders>,
  );
  await screen.findByText('할 일 1');
};

const itemOf = (title: string) =>
  screen.getByText(title).closest('li') as HTMLElement;
const doneCheckbox = (title: string) =>
  within(itemOf(title)).getByRole('checkbox', { name: '완료' });
const favoriteButton = (title: string) =>
  within(itemOf(title)).getByRole('button', { name: '찜' });

// 실패 뒤 재조회가 끝나지 않게 막아, 화면이 되돌아오는 것이 즉시 되돌리기 덕분인지 확인합니다.
const holdRefetch = () =>
  vi.mocked(getTodos).mockImplementation(() => new Promise(() => {}));

describe('할 일 아이템 상호작용', () => {
  it('완료 토글은 응답 전에 먼저 체크되고 PATCH로 done을 보낸다', async () => {
    const user = userEvent.setup();
    let resolve: () => void = () => {};
    vi.mocked(updateTodo).mockImplementation(
      () =>
        new Promise<void>((done) => {
          resolve = () => {
            serverTodos[0].done = true;
            done();
          };
        }),
    );
    await renderTodos();

    expect(doneCheckbox('할 일 1')).toHaveAttribute('aria-checked', 'false');

    await user.click(doneCheckbox('할 일 1'));

    expect(doneCheckbox('할 일 1')).toHaveAttribute('aria-checked', 'true');
    expect(updateTodo).toHaveBeenCalledWith(1, { done: true });
    resolve();
  });

  it('완료 토글이 실패하면 이전 상태로 되돌리고 에러 토스트를 띄운다', async () => {
    const user = userEvent.setup();
    vi.mocked(updateTodo).mockRejectedValue(new Error('network'));
    await renderTodos();
    holdRefetch();

    await user.click(doneCheckbox('할 일 1'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('완료 상태를 바꾸지 못했어요'),
    );
    expect(doneCheckbox('할 일 1')).toHaveAttribute('aria-checked', 'false');
  });

  it('찜하기는 먼저 별을 채우고, 실패하면 되돌린다', async () => {
    const user = userEvent.setup();
    let reject: () => void = () => {};
    vi.mocked(addTodoFavorite).mockImplementation(
      () =>
        new Promise<void>((_, fail) => {
          reject = () => fail(new Error('network'));
        }),
    );
    await renderTodos();
    holdRefetch();

    await user.click(favoriteButton('할 일 1'));
    expect(favoriteButton('할 일 1')).toHaveAttribute('aria-pressed', 'true');
    expect(addTodoFavorite).toHaveBeenCalledWith(1);

    reject();

    await waitFor(() =>
      expect(favoriteButton('할 일 1')).toHaveAttribute(
        'aria-pressed',
        'false',
      ),
    );
    expect(toast.error).toHaveBeenCalledWith('찜 상태를 바꾸지 못했어요');
  });

  it('링크 복사는 linkUrl을 클립보드에 넣고 완료 토스트를 띄운다', async () => {
    const user = userEvent.setup();
    await renderTodos();

    await user.click(
      within(itemOf('할 일 1')).getByRole('button', { name: '링크 복사' }),
    );

    expect(await navigator.clipboard.readText()).toBe('https://example.com/1');
    expect(toast.success).toHaveBeenCalledWith('링크를 복사했어요');
  });

  describe('케밥 > 삭제하기', () => {
    // 메뉴·모달이 열려 있는 동안 Radix가 body에 pointer-events: none을 겁니다.
    const openDeleteModal = async (
      user: ReturnType<typeof userEvent.setup>,
    ) => {
      await user.click(
        within(itemOf('할 일 1')).getByRole('button', { name: '더보기' }),
      );
      await user.click(screen.getByRole('menuitem', { name: '삭제하기' }));
      return screen.findByRole('dialog', {
        name: '할 일 1 할 일을 삭제하시겠습니까?',
      });
    };

    it('확인하면 DELETE를 보내고 목록에서 빼고 개수를 줄인다', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      vi.mocked(deleteTodo).mockImplementation(async (todoId) => {
        serverTodos = serverTodos.filter((todo) => todo.id !== todoId);
      });
      await renderTodos();
      expect(
        screen.getByRole('heading', { name: '모든 할 일 2' }),
      ).toBeInTheDocument();

      const dialog = await openDeleteModal(user);
      await user.click(within(dialog).getByRole('button', { name: '확인' }));

      await waitFor(() =>
        expect(screen.queryByText('할 일 1')).not.toBeInTheDocument(),
      );
      expect(deleteTodo).toHaveBeenCalledWith(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: '모든 할 일 1' }),
      ).toBeInTheDocument();
    });

    it('취소하면 모달만 닫히고 삭제하지 않는다', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await renderTodos();

      const dialog = await openDeleteModal(user);
      await user.click(within(dialog).getByRole('button', { name: '취소' }));

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(deleteTodo).not.toHaveBeenCalled();
      expect(screen.getByText('할 일 1')).toBeInTheDocument();
    });

    it('삭제가 실패하면 토스트를 띄우고 모달과 할 일을 그대로 둔다', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      vi.mocked(deleteTodo).mockRejectedValue(new Error('network'));
      await renderTodos();

      const dialog = await openDeleteModal(user);
      await user.click(within(dialog).getByRole('button', { name: '확인' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('할 일을 삭제하지 못했어요'),
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('할 일 1')).toBeInTheDocument();
    });
  });
});
