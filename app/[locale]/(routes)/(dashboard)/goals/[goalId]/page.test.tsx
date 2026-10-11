import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { getTodos } from '@/lib/api/todos';
import TestProviders from '@/test/TestProviders';
import { makeTodo } from '@/test/todoMocks';
import GoalDetailPage from './page';
import { getGoal } from '@/lib/api/goals';

vi.mock('@/lib/api/todos', () => ({
  getTodos: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ goalId: '683' }) }));
vi.mock('@/hooks/useCurrentUser', () => ({
  default: () => ({ userName: '테스트' }),
}));
vi.mock('@/lib/api/goals', () => ({ getGoal: vi.fn() }));
vi.mock('@/components/goal/GoalTitleCard', () => ({ default: () => null }));
vi.mock('@/components/todo/todo-create/TodoCreateModal', () => ({
  default: () => null,
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getGoal).mockResolvedValue({
    id: 683,
    title: '테스트 목표',
    teamId: 'test',
    userId: 1,
    createdAt: '',
    updatedAt: '',
    todos: [],
  });
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
function setup() {
  render(
    <TestProviders>
      <GoalDetailPage />
    </TestProviders>,
  );
  return userEvent.setup();
}
it('처음 10개를 표시하고 더보기로 다음 10개를 추가하며 마지막에는 버튼을 숨긴다', async () => {
  vi.mocked(getTodos).mockImplementation(async (params) =>
    params.done === 'true'
      ? { todos: [], totalCount: 0, nextCursor: null }
      : {
          todos: Array.from({ length: 10 }, (_, i) =>
            makeTodo((params.cursor ? 10 : 0) + i + 1),
          ),
          totalCount: 20,
          nextCursor: params.cursor ? null : 10,
        },
  );
  const user = setup();
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(10));
  await user.click(screen.getByRole('button', { name: '할 일 더보기' }));
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(20));
  expect(getTodos).toHaveBeenCalledWith(
    expect.objectContaining({
      goalId: 683,
      done: 'false',
      limit: 10,
      cursor: 10,
    }),
    expect.anything(),
  );
  expect(
    screen.queryByRole('button', { name: '할 일 더보기' }),
  ).not.toBeInTheDocument();
});
it('빈 목록 안내를 표시한다', async () => {
  vi.mocked(getTodos).mockResolvedValue({
    todos: [],
    totalCount: 0,
    nextCursor: null,
  });
  setup();
  expect(
    await screen.findByText('해야할 일이 아직 없어요'),
  ).toBeInTheDocument();
  expect(screen.getByText('완료한 일이 아직 없어요')).toBeInTheDocument();
});
it('추가 조회 실패 시 기존 목록을 유지하며 재시도할 수 있다', async () => {
  let requestCount = 0;
  vi.mocked(getTodos).mockImplementation(async (params) => {
    if (params.done === 'true')
      return { todos: [], totalCount: 0, nextCursor: null };
    requestCount++;
    if (requestCount === 2) throw new Error('Offline');
    return {
      todos: [makeTodo(requestCount === 1 ? 1 : 2)],
      totalCount: 2,
      nextCursor: requestCount === 1 ? 1 : null,
    };
  });
  const user = setup();
  await screen.findByRole('listitem');
  await user.click(screen.getByRole('button', { name: '할 일 더보기' }));
  await screen.findByText(
    '추가 목록을 불러오지 못했습니다. 다시 시도해주세요.',
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: '목록 다시 시도' }));
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
});
