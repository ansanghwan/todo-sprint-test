import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TestProviders from '@/test/TestProviders';
import { makeGoal, makeTodo } from '@/test/todoMocks';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import { getGoals } from '@/lib/api/goals';
import {
  getGoalTodos,
  getRecentTodos,
  getTodoProgress,
  updateTodo,
  addTodoFavorite,
  deleteTodo,
} from '@/lib/api/todos';
import { toast } from '@/components/ui/toast/Toaster';
import type { TodoCreateModalProps } from '@/components/todo/todo-create/TodoCreateModal';
import Dashboard from './page';

vi.mock('@/lib/api/user', () => ({
  getMe: vi.fn().mockResolvedValue({ name: '상환', email: 'test@example.com' }),
}));

vi.mock('@/lib/api/goals', () => ({ getGoals: vi.fn() }));
vi.mock('@/lib/api/todos', () => ({
  getGoalTodos: vi.fn(),
  getRecentTodos: vi.fn(),
  getTodoProgress: vi.fn(),
  updateTodo: vi.fn(),
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
  deleteTodo: vi.fn(),
}));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
// 모달 자체 입력/API는 공용 컴포넌트 테스트에서 검증합니다.
// 여기서는 초기 목표 전달과 생성 성공 후 대시보드 갱신을 검증합니다.
vi.mock('@/components/todo/todo-create/TodoCreateModal', () => ({
  default: ({
    isOpen,
    initialGoal,
    onCreated,
    onOpenChange,
  }: TodoCreateModalProps) =>
    isOpen ? (
      <div role="dialog" aria-label="생성 모달">
        <span>{initialGoal?.title}</span>
        <button
          onClick={() => {
            onCreated?.(makeTodo(2, { goalId: initialGoal?.id }));
            onOpenChange(false);
          }}
        >
          생성 성공
        </button>
      </div>
    ) : null,
}));

const todo = makeTodo(1, {
  title: '대시보드 테스트 할 일',
  goalId: 7,
  done: false,
  isFavorite: false,
  linkUrl: 'https://example.com/test',
});
let storedTodo = { ...todo };
let deleted = false;

beforeEach(() => {
  vi.clearAllMocks();
  storedTodo = { ...todo };
  deleted = false;
  installRadixDomMocks();
  stubIntersectionObserver();
  vi.mocked(getGoals).mockImplementation(async () => ({
    goals: [
      makeGoal(7, {
        title: '테스트 목표',
        todoCount: deleted ? 0 : 1,
        completedCount: storedTodo.done ? 1 : 0,
      }),
    ],
    nextCursor: null,
    totalCount: 1,
  }));
  vi.mocked(getRecentTodos).mockImplementation(async () =>
    deleted ? [] : [{ ...storedTodo }],
  );
  vi.mocked(getTodoProgress).mockImplementation(async () =>
    storedTodo.done && !deleted ? 100 : 0,
  );
  vi.mocked(getGoalTodos).mockImplementation(
    async (_id, _signal, _cursor, done) => ({
      todos: !deleted && storedTodo.done === done ? [{ ...storedTodo }] : [],
      nextCursor: null,
      totalCount: deleted ? 0 : 1,
    }),
  );
  vi.mocked(updateTodo).mockImplementation(async (_id, patch) => {
    if (patch.done !== undefined) storedTodo.done = patch.done;
  });
  vi.mocked(addTodoFavorite).mockImplementation(async () => {
    storedTodo.isFavorite = true;
  });
  vi.mocked(deleteTodo).mockImplementation(async () => {
    deleted = true;
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function setup() {
  const user = userEvent.setup();
  render(
    <TestProviders>
      <Dashboard />
    </TestProviders>,
  );
  await screen.findByRole('button', { name: '할 일 추가' });
  await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(2));
  return user;
}

describe('대시보드 공용 기능 연결', () => {
  it('링크 복사 버튼에 저장된 URL을 전달한다', async () => {
    const user = await setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await user.click(screen.getAllByRole('button', { name: '링크 복사' })[0]);
    expect(writeText).toHaveBeenCalledWith(todo.linkUrl);
    expect(toast.success).toHaveBeenCalled();
    writeText.mockRestore();
  });
  it('생성 후에도 무한 스크롤로 펼친 목표 카드 수를 유지한다', async () => {
    const revealEnd = stubIntersectionObserver();
    vi.mocked(getGoals).mockImplementation(async ({ cursor } = {}) => ({
      goals: [cursor ?? 7, (cursor ?? 7) + 1].map((id) =>
        makeGoal(id, { title: `목표 ${id}` }),
      ),
      nextCursor: cursor ? null : 9,
      totalCount: 4,
    }));
    const user = userEvent.setup();
    render(
      <TestProviders>
        <Dashboard />
      </TestProviders>,
    );
    await screen.findByRole('heading', { name: '목표 8' });
    act(() => revealEnd());
    await screen.findByRole('heading', { name: '목표 10' });
    vi.mocked(getGoals).mockClear();
    await user.click(screen.getAllByRole('button', { name: '할 일 추가' })[3]);
    await user.click(screen.getByRole('button', { name: '생성 성공' }));
    await waitFor(() => expect(getGoals).toHaveBeenCalledTimes(2));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(
      screen.getByRole('heading', { name: '목표 10' }),
    ).toBeInTheDocument();
  });
  it('목표를 미리 선택해 모달을 열고 생성 후 검색어를 유지하며 목록·통계를 갱신한다', async () => {
    const user = await setup();
    await user.type(
      screen.getByRole('searchbox', { name: '테스트 목표 할 일 검색' }),
      '테스트{Enter}',
    );
    await waitFor(() =>
      expect(getGoalTodos).toHaveBeenCalledWith(
        7,
        expect.any(AbortSignal),
        undefined,
        false,
        '테스트',
      ),
    );
    await user.click(screen.getByRole('button', { name: '할 일 추가' }));
    expect(
      within(screen.getByRole('dialog')).getByText('테스트 목표'),
    ).toBeInTheDocument();
    vi.mocked(getGoalTodos).mockClear();
    await user.click(screen.getByRole('button', { name: '생성 성공' }));
    await waitFor(() =>
      expect(getGoalTodos).toHaveBeenCalledWith(
        7,
        expect.any(AbortSignal),
        undefined,
        true,
        '테스트',
      ),
    );
    await waitFor(() => expect(getTodoProgress).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /모두 보기/ })).toHaveAttribute(
      'href',
      '/ko/todos',
    );
  });
  it('최근 목록의 완료 버튼을 서버에 저장하고 두 위치와 진행률에 반영한다', async () => {
    const user = await setup();
    await user.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() =>
      expect(updateTodo).toHaveBeenCalledWith(1, { done: true }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole('checkbox')).toHaveLength(2),
    );
    await waitFor(() =>
      screen
        .getAllByRole('checkbox')
        .forEach((box) => expect(box).toBeChecked()),
    );
    expect(getTodoProgress).toHaveBeenCalledTimes(2);
  });
  it('완료 저장 실패 시 기존 상태를 유지하고 오류를 안내한다', async () => {
    vi.mocked(updateTodo).mockRejectedValueOnce(new Error('failed'));
    const user = await setup();
    await user.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    screen
      .getAllByRole('checkbox')
      .forEach((box) => expect(box).not.toBeChecked());
  });
  it('찜 버튼은 서버에 저장하고 중복 표시된 항목도 갱신한다', async () => {
    const user = await setup();
    await user.click(screen.getAllByRole('button', { name: /찜/ })[0]);
    await waitFor(() => expect(addTodoFavorite).toHaveBeenCalledWith(1));
    await waitFor(() =>
      screen
        .getAllByRole('button', { name: /찜/ })
        .forEach((button) =>
          expect(button).toHaveAttribute('aria-pressed', 'true'),
        ),
    );
  });
  it('케밥 삭제 메뉴에서 확인 후 모든 목록에서 항목을 제거한다', async () => {
    const user = await setup();
    await user.click(screen.getAllByRole('button', { name: '더보기' })[0]);
    await user.click(await screen.findByRole('menuitem', { name: '삭제하기' }));
    await user.click(screen.getByRole('button', { name: '확인' }));
    await waitFor(() => expect(deleteTodo).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(screen.queryAllByText(todo.title)).toHaveLength(0),
    );
    expect(getTodoProgress).toHaveBeenCalledTimes(2);
  });
});

it('실제 사용자명을 PC 제목과 진행률 카드에 표시한다', async () => {
  render(
    <TestProviders>
      <Dashboard />
    </TestProviders>,
  );
  expect(
    await screen.findByRole('heading', { name: '상환님의 대시보드' }),
  ).toBeInTheDocument();
  expect(await screen.findByText('상환님의 진행도는')).toBeInTheDocument();
});

it('GNB에서 등록하면 대시보드 최근 목록·목표 목록·진행률을 다시 조회한다', async () => {
  await setup();
  vi.mocked(getRecentTodos).mockClear();
  vi.mocked(getGoalTodos).mockClear();
  vi.mocked(getTodoProgress).mockClear();
  act(() => {
    window.dispatchEvent(new Event('gnb:todo-created'));
  });
  await waitFor(() => {
    expect(getRecentTodos).toHaveBeenCalled();
    expect(getGoalTodos).toHaveBeenCalled();
    expect(getTodoProgress).toHaveBeenCalled();
  });
});

it('목표 생성 알림을 받으면 목표 목록을 다시 조회한다', async () => {
  await setup();
  vi.mocked(getGoals).mockClear();
  act(() => {
    window.dispatchEvent(new Event('gnb:goal-created'));
  });
  await waitFor(() => expect(getGoals).toHaveBeenCalled());
});
