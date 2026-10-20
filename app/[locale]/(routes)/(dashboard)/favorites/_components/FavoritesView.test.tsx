import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import { getGoals } from '@/lib/api/goals';
import { getNote } from '@/lib/api/notes';
import {
  addTodoFavorite,
  deleteTodo,
  getFavoriteTodos,
  getTodos,
  removeTodoFavorite,
  updateTodo,
} from '@/lib/api/todos';
import { installRadixDomMocks } from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import TestProviders from '@/test/TestProviders';
import { makeGoal, makeNote, makeTodo } from '@/test/todoMocks';
import type { TodoDto } from '@/types/api/todo';
import TodosView from '../../todos/_components/TodosView';
import FavoritesView from './FavoritesView';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/api/todos', () => ({
  getFavoriteTodos: vi.fn(),
  getTodos: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
}));
vi.mock('@/lib/api/goals', () => ({ getGoals: vi.fn() }));
vi.mock('@/lib/api/notes', () => ({ getNote: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const GOAL_A = makeGoal(1, { title: '목표 A' });
const GOAL_B = makeGoal(2, { title: '목표 B' });
const GOAL_EMPTY = makeGoal(3, { title: '찜 없는 목표' });

const favorite = (id: number, overrides: Partial<TodoDto>) =>
  makeTodo(id, {
    title: `찜 ${id}`,
    isFavorite: true,
    noteIds: [],
    linkUrl: null,
    ...overrides,
  });

// 서버에 있는 찜한 할 일. 변경이 성공하면 이 배열을 바꾸고, 재조회는 이 배열을 돌려줍니다.
let serverFavorites: TodoDto[] = [];
// 몇 번째 GET /todos/favorites 요청(0부터)을 실패시킬지
let failFavoritesAt: number | undefined;
let favoritesRequestCount = 0;

const goalRef = (goal: typeof GOAL_A) => ({
  goalId: goal.id,
  goal: { id: goal.id, title: goal.title },
});

beforeEach(() => {
  installRadixDomMocks();
  serverFavorites = [
    favorite(1, { done: false, ...goalRef(GOAL_A) }),
    favorite(2, { done: true, ...goalRef(GOAL_A) }),
    favorite(3, { done: false, ...goalRef(GOAL_B) }),
    favorite(4, { done: false, goalId: null, goal: null }),
  ];
  failFavoritesAt = undefined;
  favoritesRequestCount = 0;
  vi.mocked(getFavoriteTodos).mockImplementation(
    async ({ cursor, limit = 10 }) => {
      const requestIndex = favoritesRequestCount;
      favoritesRequestCount += 1;
      if (requestIndex === failFavoritesAt) {
        throw new Error('network');
      }
      const start = (cursor ?? 1) - 1;
      const end = start + limit;
      return {
        favorites: serverFavorites.slice(start, end).map((todo) => ({
          id: todo.id,
          teamId: 'team',
          userId: 1,
          todoId: todo.id,
          createdAt: todo.createdAt,
          todo: { ...todo },
        })),
        nextCursor: end < serverFavorites.length ? end + 1 : null,
        totalCount: serverFavorites.length,
      };
    },
  );
  vi.mocked(getGoals).mockResolvedValue({
    goals: [GOAL_A, GOAL_B, GOAL_EMPTY],
    nextCursor: null,
    totalCount: 3,
  });
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

const renderFavorites = () => {
  render(
    <TestProviders>
      <FavoritesView />
    </TestProviders>,
  );
  return userEvent.setup({ pointerEventsCheck: 0 });
};

const visibleTitles = () =>
  screen
    .queryAllByRole('listitem')
    .map((item) => within(item).getByRole('button', { name: /^찜 \d+$/ }))
    .map((button) => button.textContent);

const itemOf = (title: string) =>
  screen.getByText(title).closest('li') as HTMLElement;

const expectHeading = (count: number) =>
  expect(
    screen.getByRole('heading', { name: `대표 기록 ${count}` }),
  ).toBeInTheDocument();

// 실패 뒤 재조회가 끝나지 않게 막아, 화면이 되돌아오는 것이 즉시 되돌리기 덕분인지 확인합니다.
const holdRefetch = () =>
  vi.mocked(getFavoriteTodos).mockImplementation(() => new Promise(() => {}));

const chooseGoal = async (user: UserEvent, title: string) => {
  await user.click(screen.getByRole('combobox', { name: '프로젝트 필터' }));
  await user.click(await screen.findByRole('option', { name: title }));
};

describe('찜한 할 일 화면', () => {
  it('노트 보기는 그 할 일의 노트 상세를 연다 (FN-TD-11)', async () => {
    serverFavorites[0] = favorite(1, { noteIds: [11] });
    vi.mocked(getNote).mockResolvedValue(
      makeNote(serverFavorites[0], { id: 11, title: '찜 1 노트' }),
    );
    const user = renderFavorites();
    await screen.findByText('찜 1');

    await user.click(
      within(itemOf('찜 1')).getByRole('button', { name: '작업 기록 보기' }),
    );

    expect(
      await screen.findByRole('dialog', { name: /찜 1 노트/ }),
    ).toBeInTheDocument();
    expect(getNote).toHaveBeenCalledWith(11, expect.anything());
  });

  it('연필 버튼은 해당 할 일 ID로 노트 작성 화면을 연다', async () => {
    const user = renderFavorites();
    await screen.findByText('찜 1');
    await user.click(
      within(itemOf('찜 1')).getByRole('button', { name: '작업 기록 작성' }),
    );
    expect(push).toHaveBeenCalledWith('/notes/write?todoId=1');
  });

  describe('조회 (FN-FV-01, 02)', () => {
    it('limit 100으로 모든 페이지를 차례로 받아 보여 주고, 개수는 서버 totalCount다', async () => {
      serverFavorites = Array.from({ length: 150 }, (_, i) =>
        favorite(i + 1, {}),
      );
      renderFavorites();

      await screen.findByText('찜 150');
      expect(getFavoriteTodos).toHaveBeenCalledTimes(2);
      expect(vi.mocked(getFavoriteTodos).mock.calls.map(([p]) => p)).toEqual([
        { cursor: undefined, limit: 100 },
        { cursor: 101, limit: 100 },
      ]);
      expect(screen.getAllByRole('listitem')).toHaveLength(150);
      expectHeading(150);
    });

    it('중간 페이지가 실패하면 빈 상태 대신 오류와 다시 시도를 보여 주고, 다시 시도로 전부 받는다', async () => {
      serverFavorites = Array.from({ length: 150 }, (_, i) =>
        favorite(i + 1, {}),
      );
      failFavoritesAt = 1;
      const user = renderFavorites();

      await user.click(
        await screen.findByRole('button', { name: '다시 시도' }),
      );

      expect(toast.error).toHaveBeenCalledWith('할 일을 불러오지 못했어요');
      expect(
        screen.queryByText('아직 선택한 대표 기록이 없어요'),
      ).not.toBeInTheDocument();
      expect(await screen.findByText('찜 150')).toBeInTheDocument();
    });

    it('찜한 할 일이 없으면 빈 상태를 보여 준다', async () => {
      serverFavorites = [];
      renderFavorites();

      expect(
        await screen.findByText('아직 선택한 대표 기록이 없어요'),
      ).toBeInTheDocument();
      expectHeading(0);
    });
  });

  describe('필터 (FN-FV-03~05)', () => {
    it('TO DO·DONE 탭은 done으로 거르고, 개수는 그대로다', async () => {
      const user = renderFavorites();
      await screen.findByText('찜 1');

      await user.click(screen.getByRole('tab', { name: 'TO DO' }));
      expect(visibleTitles()).toEqual(['찜 1', '찜 3', '찜 4']);

      await user.click(screen.getByRole('tab', { name: 'DONE' }));
      expect(visibleTitles()).toEqual(['찜 2']);
      expectHeading(4);
    });

    it('목표를 고르면 그 목표의 할 일만 보이고, 탭과 함께 걸린다', async () => {
      const user = renderFavorites();
      await screen.findByText('찜 1');

      await chooseGoal(user, '목표 A');
      expect(visibleTitles()).toEqual(['찜 1', '찜 2']);

      await user.click(screen.getByRole('tab', { name: 'DONE' }));
      expect(visibleTitles()).toEqual(['찜 2']);

      await chooseGoal(user, '전체 프로젝트');
      expect(visibleTitles()).toEqual(['찜 2']);
    });

    it('거른 결과가 없으면 빈 상태를 보여 준다', async () => {
      const user = renderFavorites();
      await screen.findByText('찜 1');

      await chooseGoal(user, '찜 없는 목표');

      expect(
        screen.getByText('아직 선택한 대표 기록이 없어요'),
      ).toBeInTheDocument();
    });
  });

  describe('아이템 동작 (FN-FV-06)', () => {
    it('찜을 해제하면 응답 전에 목록에서 빠지고 개수가 줄어든다', async () => {
      let respond: () => void = () => {};
      vi.mocked(removeTodoFavorite).mockImplementation(
        (todoId) =>
          new Promise<void>((done) => {
            respond = () => {
              serverFavorites = serverFavorites.filter(
                (todo) => todo.id !== todoId,
              );
              done();
            };
          }),
      );
      const user = renderFavorites();
      await screen.findByText('찜 1');

      await user.click(
        within(itemOf('찜 1')).getByRole('button', { name: '대표 기록' }),
      );

      // 응답을 보내기 전입니다.
      expect(removeTodoFavorite).toHaveBeenCalledWith(1);
      expect(visibleTitles()).toEqual(['찜 2', '찜 3', '찜 4']);
      expectHeading(3);

      respond();

      // 응답 후 재조회가 끝나도 그대로입니다.
      await waitFor(() => expect(getFavoriteTodos).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(visibleTitles()).toEqual(['찜 2', '찜 3', '찜 4']),
      );
      expectHeading(3);
    });

    it('찜 해제가 실패하면 목록과 개수를 되돌리고 에러 토스트를 띄운다', async () => {
      vi.mocked(removeTodoFavorite).mockRejectedValue(new Error('network'));
      const user = renderFavorites();
      await screen.findByText('찜 1');
      holdRefetch();

      await user.click(
        within(itemOf('찜 1')).getByRole('button', { name: '대표 기록' }),
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          '대표 기록 상태를 바꾸지 못했어요',
        ),
      );
      expect(visibleTitles()).toEqual(['찜 1', '찜 2', '찜 3', '찜 4']);
      expectHeading(4);
    });

    it('TO DO 탭에서 완료하면 목록에서 빠지고, 실패하면 되돌린다', async () => {
      let fail: () => void = () => {};
      vi.mocked(updateTodo).mockImplementation(
        () =>
          new Promise<void>((_, reject) => {
            fail = () => reject(new Error('network'));
          }),
      );
      const user = renderFavorites();
      await screen.findByText('찜 1');
      await user.click(screen.getByRole('tab', { name: 'TO DO' }));
      holdRefetch();

      await user.click(
        within(itemOf('찜 1')).getByRole('checkbox', { name: '완료' }),
      );
      expect(visibleTitles()).toEqual(['찜 3', '찜 4']);
      expect(updateTodo).toHaveBeenCalledWith(1, { done: true });

      fail();

      await waitFor(() =>
        expect(visibleTitles()).toEqual(['찜 1', '찜 3', '찜 4']),
      );
      expect(toast.error).toHaveBeenCalledWith('완료 상태를 바꾸지 못했어요');
    });

    it('케밥으로 삭제하면 목록에서 빼고 개수를 줄인다', async () => {
      vi.mocked(deleteTodo).mockImplementation(async (todoId) => {
        serverFavorites = serverFavorites.filter((todo) => todo.id !== todoId);
      });
      const user = renderFavorites();
      await screen.findByText('찜 1');

      await user.click(
        within(itemOf('찜 1')).getByRole('button', { name: '더보기' }),
      );
      await user.click(screen.getByRole('menuitem', { name: '삭제하기' }));
      const dialog = await screen.findByRole('dialog', {
        name: '찜 1 할 일을 삭제하시겠습니까?',
      });
      await user.click(within(dialog).getByRole('button', { name: '확인' }));

      await waitFor(() =>
        expect(screen.queryByText('찜 1')).not.toBeInTheDocument(),
      );
      expect(deleteTodo).toHaveBeenCalledWith(1);
      expectHeading(3);
    });
  });

  describe('다른 화면에서 바꾼 찜 상태', () => {
    it('찜 목록 캐시가 있는 상태에서 모든 할 일에서 찜하면, 찜 화면으로 돌아왔을 때 반영된다', async () => {
      const newTodo = makeTodo(9, {
        title: '새로 찜할 할 일',
        isFavorite: false,
        noteIds: [],
        linkUrl: null,
      });
      vi.mocked(getTodos).mockImplementation(async () => ({
        todos: [newTodo],
        nextCursor: null,
        totalCount: 1,
      }));
      vi.mocked(addTodoFavorite).mockImplementation(async () => {
        serverFavorites = [
          { ...newTodo, isFavorite: true },
          ...serverFavorites,
        ];
      });
      // 앱 QueryClient처럼 staleTime을 60초로 두어, 화면을 다시 열기만 해서는 재조회되지 않게 합니다.
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
      });
      const renderScreen = (view: 'favorites' | 'todos') => (
        <IntlTestProvider>
          <QueryClientProvider client={queryClient}>
            {view === 'favorites' ? <FavoritesView /> : <TodosView />}
          </QueryClientProvider>
        </IntlTestProvider>
      );
      const { rerender } = render(renderScreen('favorites'));
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await screen.findByText('찜 1');
      expectHeading(4);

      rerender(renderScreen('todos'));
      await user.click(
        within(await screen.findByRole('listitem')).getByRole('button', {
          name: '대표 기록',
        }),
      );
      await waitFor(() => expect(addTodoFavorite).toHaveBeenCalledWith(9));

      rerender(renderScreen('favorites'));

      expect(await screen.findByText('새로 찜할 할 일')).toBeInTheDocument();
      expectHeading(5);
    });
  });
});
