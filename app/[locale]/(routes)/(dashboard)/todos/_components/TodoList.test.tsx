import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TodoNoteActions } from '@/components/todo/todoNoteActions';
import { toast } from '@/components/ui/toast/Toaster';
import { getTodos } from '@/lib/api/todos';
import TestProviders from '@/test/TestProviders';
import { makeTodo } from '@/test/todoMocks';
import type { TodoDto, TodoPageDto } from '@/types/api/todo';
import TodoList from './TodoList';
import TodosHeader from './TodosHeader';
import { getTodoListParams } from './todoListParams';

vi.mock('@/lib/api/todos', () => ({ getTodos: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const mockedGetTodos = vi.mocked(getTodos);

const todo = (id: number, overrides: Partial<TodoDto> = {}) =>
  makeTodo(id, {
    title: `할 일 ${id}`,
    noteIds: [],
    linkUrl: null,
    ...overrides,
  });

const page = (
  todos: TodoDto[],
  nextCursor: number | null,
  totalCount = 3,
): TodoPageDto => ({ todos, nextCursor, totalCount });

// 목록 끝 감시 요소가 화면에 들어온 상황을 직접 발생시킵니다.
// 감시 중(observe 후 disconnect 전)인 observer에만 알려, 감시를 멈춘 상태도 검증할 수 있게 합니다.
const activeCallbacks = new Set<IntersectionObserverCallback>();
const triggerIntersect = () =>
  activeCallbacks.forEach((callback) =>
    callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      private callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe() {
        activeCallbacks.add(this.callback);
      }
      disconnect() {
        activeCallbacks.delete(this.callback);
      }
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
  activeCallbacks.clear();
});

const ALL_PARAMS = getTodoListParams('all');

const renderTodos = (noteActions?: TodoNoteActions) => {
  render(
    <TestProviders>
      <TodosHeader params={ALL_PARAMS} />
      <TodoList params={ALL_PARAMS} noteActions={noteActions} />
    </TestProviders>,
  );
};

describe('TodoList', () => {
  it('최신순 40개로 첫 페이지를 요청하고 목록과 전체 개수를 보여준다', async () => {
    mockedGetTodos.mockResolvedValueOnce(page([todo(1), todo(2)], null, 2));
    renderTodos();

    expect(await screen.findByText('할 일 1')).toBeInTheDocument();
    expect(screen.getByText('할 일 2')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '모든 할 일 2' }),
    ).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenCalledWith(
      { sort: 'latest', limit: 40, cursor: undefined },
      expect.any(AbortSignal),
    );
  });

  it('목록 끝이 보이면 nextCursor로 다음 페이지를 이어 붙인다', async () => {
    mockedGetTodos
      .mockResolvedValueOnce(page([todo(1)], 41))
      .mockResolvedValueOnce(page([todo(2)], null));
    renderTodos();
    await screen.findByText('할 일 1');

    await act(async () => triggerIntersect());

    expect(await screen.findByText('할 일 2')).toBeInTheDocument();
    expect(screen.getByText('할 일 1')).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenLastCalledWith(
      { sort: 'latest', limit: 40, cursor: 41 },
      expect.any(AbortSignal),
    );
  });

  it('다음 페이지를 요청하는 동안에는 다시 보여도 중복 요청하지 않는다', async () => {
    let resolveSecondPage: (value: TodoPageDto) => void = () => {};
    mockedGetTodos
      .mockResolvedValueOnce(page([todo(1)], 41))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondPage = resolve;
          }),
      )
      .mockResolvedValueOnce(page([todo(3)], null));
    renderTodos();
    await screen.findByText('할 일 1');

    // 요청 중 상태가 렌더에 반영되기 전에 목록 끝이 연속으로 보인 상황입니다.
    act(() => {
      triggerIntersect();
      triggerIntersect();
    });

    expect(mockedGetTodos).toHaveBeenCalledTimes(2);

    await act(async () => resolveSecondPage(page([todo(2)], 81)));
    expect(await screen.findByText('할 일 2')).toBeInTheDocument();

    // 요청이 끝나면 다시 감시해서 다음 cursor로 이어서 요청합니다.
    await act(async () => triggerIntersect());

    expect(await screen.findByText('할 일 3')).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenCalledTimes(3);
    expect(mockedGetTodos).toHaveBeenLastCalledWith(
      { sort: 'latest', limit: 40, cursor: 81 },
      expect.any(AbortSignal),
    );
  });

  it('nextCursor가 null이면 더 요청하지 않는다', async () => {
    mockedGetTodos.mockResolvedValueOnce(page([todo(1)], null));
    renderTodos();
    await screen.findByText('할 일 1');

    await act(async () => triggerIntersect());

    expect(mockedGetTodos).toHaveBeenCalledTimes(1);
  });

  it('할 일이 없으면 빈 상태를 보여준다', async () => {
    mockedGetTodos.mockResolvedValueOnce(page([], null, 0));
    renderTodos();

    expect(
      await screen.findByText('아직 등록한 할 일이 없어요'),
    ).toBeInTheDocument();
  });

  it('불러온 항목이 없어도 전체 개수가 남아 있으면 빈 상태 대신 다음 페이지를 불러온다', async () => {
    mockedGetTodos
      .mockResolvedValueOnce(page([], 41, 1))
      .mockResolvedValueOnce(page([todo(41)], null, 1));
    renderTodos();
    await screen.findByRole('heading', { name: '모든 할 일 1' });

    expect(
      screen.queryByText('아직 등록한 할 일이 없어요'),
    ).not.toBeInTheDocument();

    await act(async () => triggerIntersect());

    expect(await screen.findByText('할 일 41')).toBeInTheDocument();
  });

  it('첫 요청이 실패하면 에러 토스트를 띄우고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    mockedGetTodos
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page([todo(1)], null));
    renderTodos();

    await user.click(await screen.findByRole('button', { name: '다시 시도' }));

    expect(toast.error).toHaveBeenCalledWith('할 일을 불러오지 못했어요');
    expect(await screen.findByText('할 일 1')).toBeInTheDocument();
  });

  it('다음 페이지가 실패해도 불러온 목록은 유지하고 이어서 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    mockedGetTodos
      .mockResolvedValueOnce(page([todo(1)], 41))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page([todo(2)], 81))
      .mockResolvedValueOnce(page([todo(3)], null));
    renderTodos();
    await screen.findByText('할 일 1');

    await act(async () => triggerIntersect());
    const retryButton = await screen.findByRole('button', {
      name: '다시 시도',
    });

    // 실패 뒤에는 목록 끝이 다시 보여도 저절로 재요청하지 않습니다.
    await act(async () => triggerIntersect());
    expect(mockedGetTodos).toHaveBeenCalledTimes(2);

    await user.click(retryButton);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(screen.getByText('할 일 1')).toBeInTheDocument();
    expect(await screen.findByText('할 일 2')).toBeInTheDocument();

    // 재시도가 성공하고 다음 페이지가 남아 있으면 다시 감시합니다.
    await act(async () => triggerIntersect());

    expect(await screen.findByText('할 일 3')).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenLastCalledWith(
      { sort: 'latest', limit: 40, cursor: 81 },
      expect.any(AbortSignal),
    );
  });

  it('노트 보기·작성은 주입한 콜백으로 요청만 올린다', async () => {
    const user = userEvent.setup();
    const noteActions = { onViewNote: vi.fn(), onCreateNote: vi.fn() };
    mockedGetTodos.mockResolvedValueOnce(
      page([todo(1, { noteIds: [7, 8] }), todo(2)], null),
    );
    renderTodos(noteActions);
    await screen.findByText('할 일 1');

    await user.click(screen.getByRole('button', { name: '노트 보기' }));
    await user.click(screen.getByRole('button', { name: '노트 작성하기' }));

    expect(noteActions.onViewNote).toHaveBeenCalledWith(7);
    expect(noteActions.onCreateNote).toHaveBeenCalledWith(2);
  });
});
