import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGoals } from '@/lib/api/goals';
import { getNote } from '@/lib/api/notes';
import {
  getGoalTodos,
  getRecentTodos,
  getTodo,
  getTodoProgress,
} from '@/lib/api/todos';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import TestProviders from '@/test/TestProviders';
import { makeGoal, makeNote, makeTodo } from '@/test/todoMocks';
import type { TodoDto } from '@/types/api/todo';
import Dashboard from './page';

/**
 * 대시보드의 노트 연결 (FN-TD-11·12·43, FN-DB-14·15).
 * 최근 등록한 할 일과 목표별 할 일에 같은 할 일 하나를 보여 줍니다.
 */
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('@/i18n/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/i18n/navigation')>()),
  useRouter: () => ({ push }),
}));
vi.mock('@/lib/api/user', () => ({
  getMe: vi.fn().mockResolvedValue({ name: '상환', email: 'test@example.com' }),
}));
vi.mock('@/lib/api/goals', () => ({ getGoals: vi.fn() }));
vi.mock('@/lib/api/todos', () => ({
  getGoalTodos: vi.fn(),
  getRecentTodos: vi.fn(),
  getTodoProgress: vi.fn(),
  getTodo: vi.fn(),
  updateTodo: vi.fn(),
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
  deleteTodo: vi.fn(),
}));
vi.mock('@/lib/api/notes', () => ({ getNote: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const TITLE = '대시보드 노트 할 일';
// 서버에 있는 할 일. 노트를 작성하면 noteIds가 바뀝니다.
let serverTodo: TodoDto;

beforeEach(() => {
  vi.clearAllMocks();
  installRadixDomMocks();
  stubIntersectionObserver();
  serverTodo = makeTodo(1, {
    title: TITLE,
    goalId: 7,
    goal: { id: 7, title: '테스트 목표' },
    done: false,
    noteIds: [],
    linkUrl: null,
  });
  vi.mocked(getGoals).mockResolvedValue({
    goals: [makeGoal(7, { title: '테스트 목표', todoCount: 1 })],
    nextCursor: null,
    totalCount: 1,
  });
  vi.mocked(getRecentTodos).mockImplementation(async () => [{ ...serverTodo }]);
  vi.mocked(getTodoProgress).mockResolvedValue(0);
  vi.mocked(getGoalTodos).mockImplementation(
    async (_id, _signal, _cursor, done) => ({
      todos: serverTodo.done === done ? [{ ...serverTodo }] : [],
      nextCursor: null,
      totalCount: 1,
    }),
  );
  vi.mocked(getTodo).mockImplementation(async () => ({ ...serverTodo }));
  vi.mocked(getNote).mockImplementation(async (noteId) =>
    makeNote(serverTodo, { id: noteId, title: '대시보드 노트' }),
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderDashboard = () => {
  render(
    <TestProviders>
      <Dashboard />
    </TestProviders>,
  );
  return userEvent.setup({ pointerEventsCheck: 0 });
};

/** 최근 등록한 할 일과 목표별 할 일 두 곳에 같은 할 일이 보일 때까지 기다립니다. */
const findItems = async () => {
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: TITLE })).toHaveLength(2),
  );
  return screen
    .getAllByRole('button', { name: TITLE })
    .map((button) => button.closest('li') as HTMLElement);
};

describe('대시보드 노트 연결', () => {
  it('노트가 없으면 두 목록 모두 노트 작성 아이콘을 보여 주고, 할 일 ID로 작성 화면을 연다', async () => {
    const user = renderDashboard();
    const items = await findItems();

    items.forEach((item) =>
      expect(
        within(item).getByRole('button', { name: '노트 작성하기' }),
      ).toBeInTheDocument(),
    );
    await user.click(
      within(items[0]).getByRole('button', { name: '노트 작성하기' }),
    );

    expect(push).toHaveBeenCalledWith('/notes/write?todoId=1');
  });

  it('노트가 있으면 노트 보기로 그 노트의 상세를 연다', async () => {
    serverTodo.noteIds = [31];
    const user = renderDashboard();
    const items = await findItems();

    await user.click(
      within(items[1]).getByRole('button', { name: '노트 보기' }),
    );

    expect(
      await screen.findByRole('dialog', { name: /대시보드 노트/ }),
    ).toBeInTheDocument();
    expect(getNote).toHaveBeenCalledWith(31, expect.anything());
  });

  it('할 일 상세의 작성된 노트를 누르면 상세를 닫고 노트 상세만 연다', async () => {
    serverTodo.noteIds = [31];
    const user = renderDashboard();
    await findItems();

    await user.click(screen.getAllByRole('button', { name: TITLE })[0]);
    const detail = await screen.findByRole('dialog', {
      name: new RegExp(TITLE),
    });
    await user.click(
      await within(detail).findByRole('button', { name: '대시보드 노트' }),
    );

    await screen.findByRole('dialog', { name: /대시보드 노트/ });
    // 뒤에 깔린 모달도 세기 위해 숨겨진 dialog까지 셉니다.
    await waitFor(() =>
      expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1),
    );
  });

  // 실제 노트 작성·저장 후 페이지 이동으로 돌아오는 흐름은 앱 화면에서 확인합니다.
  // 여기서는 대시보드를 다시 마운트했을 때 서버의 최신 noteIds로 그리는지만 봅니다.
  it('서버의 noteIds가 바뀐 뒤 다시 마운트하면 노트 보기 아이콘으로 그린다', async () => {
    renderDashboard();
    await findItems();
    cleanup();

    // 다른 화면에서 이 할 일에 노트가 생긴 상황
    serverTodo.noteIds = [31];
    renderDashboard();
    const items = await findItems();

    items.forEach((item) => {
      expect(
        within(item).getByRole('button', { name: '노트 보기' }),
      ).toBeInTheDocument();
      expect(
        within(item).queryByRole('button', { name: '노트 작성하기' }),
      ).not.toBeInTheDocument();
    });
  });
});
