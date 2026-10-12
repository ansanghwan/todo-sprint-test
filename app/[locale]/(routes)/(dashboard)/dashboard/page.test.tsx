import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './page';
import TestProviders from '@/test/TestProviders';

const { getGoals, getGoalTodos } = vi.hoisted(() => ({
  getGoals: vi.fn(),
  getGoalTodos: vi.fn(),
}));

vi.mock('@/lib/api/goals', () => ({ getGoals }));
vi.mock('@/lib/api/todos', () => ({
  getGoalTodos,
  getRecentTodos: vi.fn().mockResolvedValue([]),
  getTodoProgress: vi.fn().mockResolvedValue(0),
}));
vi.mock('@/components/todo/todo-create/TodoCreateModal', () => ({
  default: () => null,
}));
vi.mock('@/components/todo/DeleteTodoModal', () => ({ default: () => null }));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/components/dashboard/ProgressChart', () => ({
  default: () => null,
}));
vi.mock('@/components/todo/TodoItem', () => ({
  default: ({ todo }: { todo: { title: string } }) => <li>{todo.title}</li>,
}));

const makeTodos = (done: boolean) =>
  Array.from({ length: 13 }, (_, index) => ({
    id: (done ? 100 : 0) + index,
    title: `${done ? 'DONE' : 'TODO'} 테스트 ${index + 1}`,
    done,
  }));
const page = (done: boolean, cursor?: number) => ({
  todos:
    cursor === undefined
      ? makeTodos(done).slice(0, 10)
      : makeTodos(done).slice(10),
  nextCursor: cursor === undefined ? (done ? 110 : 10) : null,
  totalCount: 13,
});

beforeEach(() => {
  vi.clearAllMocks();
  getGoals.mockResolvedValue({
    goals: [
      { id: 678, title: '테스트 목표', todoCount: 26, completedCount: 13 },
    ],
    nextCursor: null,
    totalCount: 1,
  });
  getGoalTodos.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('목표별 영역별 더보기', () => {
  it.each([false, true])(
    '완료 여부 %s인 영역만 추가하고 마지막이면 해당 버튼만 숨긴다',
    async (done) => {
      let finish!: (value: ReturnType<typeof page>) => void;
      getGoalTodos.mockImplementation((_id, _signal, cursor, requestedDone) =>
        cursor === undefined
          ? Promise.resolve(page(requestedDone))
          : new Promise((resolve) => {
              finish = resolve;
            }),
      );
      render(<Dashboard />, { wrapper: TestProviders });
      const label = done ? 'DONE' : 'TO DO';
      const prefix = done ? 'DONE' : 'TODO';
      const otherPrefix = done ? 'TODO' : 'DONE';
      const button = await screen.findByRole('button', {
        name: `테스트 목표 ${label} 더보기`,
      });
      expect(screen.getAllByText(/^TODO 테스트 /)).toHaveLength(10);
      expect(screen.getAllByText(/^DONE 테스트 /)).toHaveLength(10);
      expect(getGoalTodos).toHaveBeenCalledWith(
        678,
        expect.any(AbortSignal),
        undefined,
        false,
        undefined,
      );
      expect(getGoalTodos).toHaveBeenCalledWith(
        678,
        expect.any(AbortSignal),
        undefined,
        true,
        undefined,
      );
      fireEvent.click(button);
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(getGoalTodos).toHaveBeenCalledTimes(3);
      expect(getGoalTodos).toHaveBeenLastCalledWith(
        678,
        expect.any(AbortSignal),
        done ? 110 : 10,
        done,
        undefined,
      );
      finish(page(done, 1));
      await waitFor(() =>
        expect(
          screen.getAllByText(new RegExp(`^${prefix} 테스트 `)),
        ).toHaveLength(13),
      );
      expect(
        screen.getAllByText(new RegExp(`^${otherPrefix} 테스트 `)),
      ).toHaveLength(10);
      expect(
        screen.queryByRole('button', { name: `테스트 목표 ${label} 더보기` }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: `테스트 목표 ${done ? 'TO DO' : 'DONE'} 더보기`,
        }),
      ).toBeEnabled();
    },
  );

  it('추가 조회 실패 시 양쪽 목록을 유지하고 같은 커서와 완료 여부로 재시도한다', async () => {
    let fail = true;
    getGoalTodos.mockImplementation((_id, _signal, cursor, done) => {
      if (cursor !== undefined && fail) {
        fail = false;
        return Promise.reject(new Error('network'));
      }
      return Promise.resolve(page(done, cursor));
    });
    render(<Dashboard />, { wrapper: TestProviders });
    fireEvent.click(
      await screen.findByRole('button', { name: '테스트 목표 TO DO 더보기' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '추가 할 일을 불러오지 못했어요',
    );
    expect(screen.getAllByText(/^TODO 테스트 /)).toHaveLength(10);
    expect(screen.getAllByText(/^DONE 테스트 /)).toHaveLength(10);
    fireEvent.click(
      screen.getByRole('button', { name: '테스트 목표 TO DO 더보기' }),
    );
    await waitFor(() =>
      expect(screen.getAllByText(/^TODO 테스트 /)).toHaveLength(13),
    );
    expect(getGoalTodos).toHaveBeenLastCalledWith(
      678,
      expect.any(AbortSignal),
      10,
      false,
      undefined,
    );
  });
});

describe('목표별 검색', () => {
  it('Enter로 해당 목표만 검색하고 더보기에도 실행한 검색어를 유지한다', async () => {
    getGoals.mockResolvedValue({
      goals: [
        { id: 678, title: '테스트 목표', todoCount: 26, completedCount: 13 },
        { id: 679, title: '다른 목표', todoCount: 1, completedCount: 0 },
      ],
    });
    getGoalTodos.mockImplementation((id, _signal, cursor, done, keyword) => {
      if (id === 679)
        return Promise.resolve({
          todos: done
            ? []
            : [{ id: 99, title: '다른 목표 할 일', done: false }],
          nextCursor: null,
        });
      const result = page(done, cursor);
      return Promise.resolve(
        keyword
          ? {
              ...result,
              todos: result.todos.map((todo) => ({
                ...todo,
                title: `검색 ${todo.title}`,
              })),
            }
          : result,
      );
    });
    render(<Dashboard />, { wrapper: TestProviders });
    await screen.findByText('다른 목표 할 일');
    const input = screen.getByRole('searchbox', {
      name: '테스트 목표 할 일 검색',
    });
    fireEvent.change(input, { target: { value: ' 공부 ' } });
    const beforeSearch = getGoalTodos.mock.calls.length;
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByText('검색 TODO 테스트 1');
    expect(getGoalTodos.mock.calls.slice(beforeSearch)).toEqual([
      [678, expect.any(AbortSignal), undefined, false, '공부'],
      [678, expect.any(AbortSignal), undefined, true, '공부'],
    ]);
    expect(screen.getByText('다른 목표 할 일')).toBeInTheDocument();
    expect(screen.getByLabelText('목표 진행률 50%')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '아직 실행하지 않은 검색어' } });
    fireEvent.click(
      screen.getByRole('button', { name: '테스트 목표 TO DO 더보기' }),
    );
    await screen.findByText('검색 TODO 테스트 13');
    expect(getGoalTodos).toHaveBeenLastCalledWith(
      678,
      expect.any(AbortSignal),
      10,
      false,
      '공부',
    );
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByText('TODO 테스트 1');
    expect(screen.queryByText('검색 TODO 테스트 13')).not.toBeInTheDocument();
    expect(getGoalTodos).toHaveBeenLastCalledWith(
      678,
      expect.any(AbortSignal),
      undefined,
      true,
      undefined,
    );
  });

  it('돋보기 검색의 결과가 없으면 양쪽에 검색 결과 없음 안내를 표시한다', async () => {
    getGoalTodos.mockImplementation((_id, _signal, cursor, done, keyword) =>
      Promise.resolve(
        keyword ? { todos: [], nextCursor: null } : page(done, cursor),
      ),
    );
    render(<Dashboard />, { wrapper: TestProviders });
    await screen.findByText('TODO 테스트 1');
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: '없는 제목' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));
    await waitFor(() =>
      expect(screen.getAllByText('검색 결과가 없습니다.')).toHaveLength(1),
    );
    expect(
      screen.queryByRole('button', { name: '테스트 목표 TO DO 더보기' }),
    ).not.toBeInTheDocument();
  });

  it('새 검색 후 늦게 도착한 이전 더보기 응답을 무시한다', async () => {
    let finish!: (value: ReturnType<typeof page>) => void;
    let oldSignal!: AbortSignal;
    getGoalTodos.mockImplementation((_id, signal, cursor, done, keyword) => {
      if (cursor !== undefined) {
        oldSignal = signal;
        return new Promise((resolve) => {
          finish = resolve;
        });
      }
      return Promise.resolve(
        keyword ? { todos: [], nextCursor: null } : page(done),
      );
    });
    render(<Dashboard />, { wrapper: TestProviders });
    fireEvent.click(
      await screen.findByRole('button', { name: '테스트 목표 TO DO 더보기' }),
    );
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '새 검색' },
    });
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    await waitFor(() =>
      expect(screen.getAllByText('검색 결과가 없습니다.')).toHaveLength(1),
    );
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
      finish(page(false, 10));
    });
    expect(screen.queryByText('TODO 테스트 13')).not.toBeInTheDocument();
  });
});

describe('목표 없음 안내', () => {
  it('목표가 없으면 섹션 제목과 빈 상태를 표시하고 할 일 조회는 하지 않는다', async () => {
    getGoals.mockResolvedValue({ goals: [], nextCursor: null, totalCount: 0 });
    render(<Dashboard />, { wrapper: TestProviders });
    expect(
      await screen.findByText('최근에 등록한 목표가 없어요'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '목표별 할일' }),
    ).toBeInTheDocument();
    expect(getGoalTodos).not.toHaveBeenCalled();
  });

  it('목표 조회 실패를 목표 없음으로 표시하지 않는다', async () => {
    getGoals.mockRejectedValue(new Error('network'));
    render(<Dashboard />, { wrapper: TestProviders });
    expect(
      await screen.findByText('목표를 불러오지 못했어요'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('최근에 등록한 목표가 없어요'),
    ).not.toBeInTheDocument();
  });
});

describe('목표 목록 무한 스크롤', () => {
  const goalPage = (start: number) => ({
    goals: [start, start + 1].map((id) => ({
      id,
      title: `스크롤 목표 ${id}`,
      todoCount: 0,
      completedCount: 0,
    })),
    nextCursor: start === 5 ? null : start + 2,
    totalCount: 6,
  });

  const observeVisibleEnd = () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        disconnect() {}
      },
    );
  };

  it('스크롤 없이 끝이 보이면 2개씩 6개까지 채우고 종료한다', async () => {
    observeVisibleEnd();
    getGoals.mockImplementation(({ cursor }) =>
      Promise.resolve(goalPage(cursor ?? 1)),
    );
    getGoalTodos.mockResolvedValue({ todos: [], nextCursor: null });
    render(<Dashboard />, { wrapper: TestProviders });
    await screen.findByRole('heading', { name: '스크롤 목표 6' });
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
    expect(getGoals).toHaveBeenCalledTimes(3);
    expect(getGoals).toHaveBeenNthCalledWith(
      2,
      { limit: 2, cursor: 3 },
      expect.any(AbortSignal),
    );
    expect(getGoals).toHaveBeenNthCalledWith(
      3,
      { limit: 2, cursor: 5 },
      expect.any(AbortSignal),
    );
    // 기존 목표를 다시 요청하지 않고 목표마다 두 영역을 한 번씩 조회합니다.
    await waitFor(() => expect(getGoalTodos).toHaveBeenCalledTimes(12));
  });

  it('추가 목표 조회 실패 시 기존 카드를 유지하며 버튼으로 재시도한다', async () => {
    observeVisibleEnd();
    getGoals
      .mockResolvedValueOnce(goalPage(1))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ...goalPage(3), nextCursor: null });
    getGoalTodos.mockResolvedValue({ todos: [], nextCursor: null });
    render(<Dashboard />, { wrapper: TestProviders });
    const retry = await screen.findByRole('button', { name: '다시 시도' });
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(getGoals).toHaveBeenCalledTimes(2);
    fireEvent.click(retry);
    await screen.findByRole('heading', { name: '스크롤 목표 4' });
    expect(getGoals).toHaveBeenLastCalledWith(
      { limit: 2, cursor: 3 },
      expect.any(AbortSignal),
    );
    expect(
      screen.queryByRole('button', { name: '다시 시도' }),
    ).not.toBeInTheDocument();
  });
});

it('한쪽 빈 결과가 먼저 와도 양쪽 조회 완료 전까지 빈 안내를 노출하지 않는다', async () => {
  let finish!: (value: { todos: never[]; nextCursor: null }) => void;
  getGoalTodos.mockImplementation((_id, _signal, _cursor, done) =>
    done
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : Promise.resolve({ todos: [], nextCursor: null }),
  );
  render(<Dashboard />, { wrapper: TestProviders });
  await screen.findByRole('heading', { name: '테스트 목표' });
  await waitFor(() => expect(getGoalTodos).toHaveBeenCalledTimes(2));
  expect(screen.getByText('할 일을 불러오는 중입니다.')).toBeInTheDocument();
  expect(screen.queryByText('등록된 할 일이 없어요')).not.toBeInTheDocument();
  expect(screen.queryByText('완료한 할 일이 없어요')).not.toBeInTheDocument();
  await act(async () => {
    finish({ todos: [], nextCursor: null });
  });
  expect(screen.getAllByText('등록된 할 일이 없어요')).toHaveLength(1);
  expect(
    screen.queryByText('할 일을 불러오는 중입니다.'),
  ).not.toBeInTheDocument();
});
