import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useInfiniteQuery } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { getTodos } from '@/lib/api/todos';
import { todoQueries } from '@/queries/todo';
import TestProviders from '@/test/TestProviders';
import { makeTodo } from '@/test/todoMocks';
import GoalTodoList from './GoalTodoList';

vi.mock('@/lib/api/todos', () => ({
  getTodos: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
function View() {
  const query = useInfiniteQuery(
    todoQueries.list({ goalId: 683, done: 'false', limit: 10, sort: 'latest' }),
  );
  return <GoalTodoList query={query} goalId={683} />;
}
function setup() {
  render(
    <TestProviders>
      <View />
    </TestProviders>,
  );
  return userEvent.setup();
}
it('처음 10개를 표시하고 더보기로 다음 10개를 추가하며 마지막에는 버튼을 숨긴다', async () => {
  vi.mocked(getTodos).mockImplementation(async (params) => ({
    todos: Array.from({ length: 10 }, (_, i) =>
      makeTodo((params.cursor ? 10 : 0) + i + 1),
    ),
    totalCount: 20,
    nextCursor: params.cursor ? null : 10,
  }));
  const user = setup();
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(10));
  await user.click(screen.getByRole('button', { name: '할 일 더보기' }));
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(20));
  expect(getTodos).toHaveBeenLastCalledWith(
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
  expect(await screen.findByText('등록된 할 일이 없어요')).toBeInTheDocument();
});
it('추가 조회 실패 시 기존 목록을 유지하며 재시도할 수 있다', async () => {
  vi.mocked(getTodos)
    .mockResolvedValueOnce({
      todos: [makeTodo(1)],
      totalCount: 2,
      nextCursor: 1,
    })
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({
      todos: [makeTodo(2)],
      totalCount: 2,
      nextCursor: null,
    });
  const user = setup();
  await screen.findByRole('listitem');
  await user.click(screen.getByRole('button', { name: '할 일 더보기' }));
  await screen.findByRole('alert');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: '목록 다시 시도' }));
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
});
