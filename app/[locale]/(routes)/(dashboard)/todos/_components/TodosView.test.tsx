import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTodos, type GetTodosParams } from '@/lib/api/todos';
import TestProviders from '@/test/TestProviders';
import { makeTodo } from '@/test/todoMocks';
import TodosView from './TodosView';

vi.mock('@/lib/api/todos', () => ({ getTodos: vi.fn(), createTodo: vi.fn() }));
vi.mock('@/lib/api/goals', () => ({
  getGoals: vi.fn(() =>
    Promise.resolve({ goals: [], nextCursor: null, totalCount: 0 }),
  ),
}));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const mockedGetTodos = vi.mocked(getTodos);

// done 조건에 맞춰 할 일을 돌려주는 가짜 서버. id 1은 미완료, 2는 완료입니다.
const TODOS = [
  makeTodo(1, { title: '미완료 할 일', done: false }),
  makeTodo(2, { title: '완료한 할 일', done: true }),
];

const respondByDone = ({ done }: GetTodosParams) => {
  const todos = done
    ? TODOS.filter((todo) => String(todo.done) === done)
    : TODOS;
  return Promise.resolve({ todos, nextCursor: 40, totalCount: todos.length });
};

// 탭마다 1·2페이지를 따로 가진 가짜 서버. 제목에 탭과 페이지가 드러납니다.
const LABELS = { all: 'ALL', false: 'TODO', true: 'DONE' } as const;
const respondByPage = ({ done, cursor }: GetTodosParams) => {
  const label = LABELS[done ?? 'all'];
  const pageNo = cursor ? 2 : 1;
  return Promise.resolve({
    todos: [makeTodo(pageNo, { title: `${label} ${pageNo}페이지` })],
    nextCursor: pageNo === 1 ? 41 : null,
    totalCount: 2,
  });
};

// 목록 끝 감시 요소가 화면에 들어온 상황을 직접 발생시킵니다.
let triggerIntersect: () => void = () => {};

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        triggerIntersect = () =>
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  mockedGetTodos.mockImplementation(respondByDone);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  triggerIntersect = () => {};
});

const renderView = () => {
  render(
    <TestProviders>
      <TodosView />
    </TestProviders>,
  );
};

describe('TodosView', () => {
  it('처음에는 ALL 탭이 선택되고 done 없이 조회한다', async () => {
    renderView();

    expect(screen.getByRole('tab', { name: 'ALL' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('미완료 할 일')).toBeInTheDocument();
    expect(screen.getByText('완료한 할 일')).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenCalledWith(
      { sort: 'latest', limit: 40, cursor: undefined },
      expect.any(AbortSignal),
    );
  });

  it.each([
    ['TO DO', 'false', '미완료 할 일', '완료한 할 일'],
    ['DONE', 'true', '완료한 할 일', '미완료 할 일'],
  ])(
    '%s 탭을 처음 열면 done=%s로 첫 페이지부터 조회한다',
    async (tabName, done, shown, hidden) => {
      const user = userEvent.setup();
      renderView();
      await screen.findByText('미완료 할 일');

      await user.click(screen.getByRole('tab', { name: tabName }));

      expect(await screen.findByText(shown)).toBeInTheDocument();
      expect(screen.queryByText(hidden)).not.toBeInTheDocument();
      expect(mockedGetTodos).toHaveBeenLastCalledWith(
        { sort: 'latest', limit: 40, done, cursor: undefined },
        expect.any(AbortSignal),
      );
      expect(
        screen.getByRole('heading', { name: '모든 할 일 1' }),
      ).toBeInTheDocument();
    },
  );

  it('탭을 바꾼 뒤 다음 페이지도 같은 done으로 요청하고 다른 탭 할 일은 섞이지 않는다', async () => {
    const user = userEvent.setup();
    mockedGetTodos.mockImplementation(respondByPage);
    renderView();
    await screen.findByText('ALL 1페이지');

    await user.click(screen.getByRole('tab', { name: 'TO DO' }));
    await screen.findByText('TODO 1페이지');
    await act(async () => triggerIntersect());

    expect(await screen.findByText('TODO 2페이지')).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenLastCalledWith(
      { sort: 'latest', limit: 40, done: 'false', cursor: 41 },
      expect.any(AbortSignal),
    );
    expect(screen.queryByText(/^ALL /)).not.toBeInTheDocument();
    expect(screen.queryByText(/^DONE /)).not.toBeInTheDocument();
  });

  it('이미 연 탭으로 돌아오면 이전 페이지를 복원하지 않고 첫 페이지부터 다시 조회한다', async () => {
    const user = userEvent.setup();
    mockedGetTodos.mockImplementation(respondByPage);
    renderView();
    await screen.findByText('ALL 1페이지');
    await act(async () => triggerIntersect());
    await screen.findByText('ALL 2페이지');
    await user.click(screen.getByRole('tab', { name: 'TO DO' }));
    await screen.findByText('TODO 1페이지');

    // 돌아온 뒤의 응답은 제목과 nextCursor를 바꿔 새 응답인지 구분합니다.
    mockedGetTodos.mockClear();
    mockedGetTodos.mockImplementation(({ done, cursor }) =>
      Promise.resolve({
        todos: [
          makeTodo(cursor ? 20 : 10, {
            title: `${LABELS[done ?? 'all']} ${cursor ? '다음' : '새 첫'} 페이지`,
          }),
        ],
        nextCursor: cursor ? null : 77,
        totalCount: 2,
      }),
    );

    await user.click(screen.getByRole('tab', { name: 'ALL' }));

    expect(await screen.findByText('ALL 새 첫 페이지')).toBeInTheDocument();
    expect(screen.queryByText('ALL 1페이지')).not.toBeInTheDocument();
    expect(screen.queryByText('ALL 2페이지')).not.toBeInTheDocument();
    expect(screen.queryByText(/^TODO /)).not.toBeInTheDocument();
    expect(mockedGetTodos.mock.calls.map(([params]) => params)).toEqual([
      { sort: 'latest', limit: 40, cursor: undefined },
    ]);

    await act(async () => triggerIntersect());

    expect(await screen.findByText('ALL 다음 페이지')).toBeInTheDocument();
    expect(mockedGetTodos).toHaveBeenLastCalledWith(
      { sort: 'latest', limit: 40, cursor: 77 },
      expect.any(AbortSignal),
    );
    expect(screen.queryByText(/^TODO /)).not.toBeInTheDocument();
    expect(screen.queryByText(/^DONE /)).not.toBeInTheDocument();
  });

  it('빈 상태는 탭별 조회 결과로 판단한다', async () => {
    const user = userEvent.setup();
    mockedGetTodos.mockImplementation(({ done }) =>
      Promise.resolve(
        done === 'true'
          ? { todos: [], nextCursor: null, totalCount: 0 }
          : { todos: TODOS, nextCursor: null, totalCount: TODOS.length },
      ),
    );
    renderView();
    await screen.findByText('미완료 할 일');
    expect(
      screen.queryByText('아직 등록한 할 일이 없어요'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'DONE' }));

    expect(
      await screen.findByText('아직 등록한 할 일이 없어요'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '모든 할 일 0' }),
    ).toBeInTheDocument();
  });

  it('방향키로 탭을 옮길 수 있다', async () => {
    const user = userEvent.setup();
    renderView();
    const tablist = screen.getByRole('tablist', { name: '완료 상태' });

    await user.click(within(tablist).getByRole('tab', { name: 'ALL' }));
    await user.keyboard('{ArrowRight}');

    expect(within(tablist).getByRole('tab', { name: 'TO DO' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('할 일 추가 버튼을 누르면 목표를 고르지 않은 생성 모달이 열린다', async () => {
    const user = userEvent.setup();
    renderView();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '할 일 추가' }));

    const modal = await screen.findByRole('dialog', { name: '할 일 생성' });
    expect(
      within(modal).getByRole('combobox', { name: '목표' }),
    ).toHaveTextContent('목표를 선택해주세요');
  });

  it('작성하지 않은 생성 모달은 취소를 누르면 바로 닫힌다', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: '할 일 추가' }));
    const modal = await screen.findByRole('dialog', { name: '할 일 생성' });

    await user.click(within(modal).getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
