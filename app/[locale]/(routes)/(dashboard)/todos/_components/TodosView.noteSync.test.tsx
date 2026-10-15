import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCreateNoteMutation, useDeleteNoteMutation } from '@/queries/notes';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import { mockTodosApi } from '@/test/todoMocks';
import FavoritesView from '../../favorites/_components/FavoritesView';
import TodosView from './TodosView';

/**
 * 통합 검증: 노트 작성·삭제 화면에서 돌아왔을 때 할 일 쪽 캐시의 noteIds가 최신인지 확인합니다.
 * 앱 QueryClient처럼 staleTime을 60초로 두어, 화면을 다시 여는 것만으로는 재조회되지 않게 합니다.
 */
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// mock 서버는 id가 4의 배수인 할 일에 같은 id의 노트를 연결합니다.
const WITH_NOTE = '노트 있는 할 일';
const WITHOUT_NOTE = '노트 없는 할 일';

let restoreApi: () => void = () => {};

beforeEach(() => {
  installRadixDomMocks();
  stubIntersectionObserver();
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  restoreApi();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** 노트 작성·수정 화면에서 쓰는 mutation을 그대로 부르는 대역 화면 */
const NoteScreen = ({ action }: { action: 'create' | 'delete' }) => {
  const createNote = useCreateNoteMutation();
  const deleteNote = useDeleteNoteMutation();
  const isDone = createNote.isSuccess || deleteNote.isSuccess;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          action === 'create'
            ? createNote.mutate({ todoId: 3, title: '새 노트' })
            : deleteNote.mutate(4)
        }
      >
        노트 저장
      </button>
      {isDone && <p>저장 완료</p>}
    </>
  );
};

type Screen = 'todos' | 'favorites' | 'create' | 'delete';

const setup = () => {
  restoreApi = mockTodosApi({
    totalCount: 4,
    delay: 0,
    todoOverrides: {
      3: { title: WITHOUT_NOTE, isFavorite: true },
      4: { title: WITH_NOTE, isFavorite: true },
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  });
  const renderScreen = (screenName: Screen) => (
    <IntlTestProvider>
      <QueryClientProvider client={queryClient}>
        {screenName === 'todos' && <TodosView />}
        {screenName === 'favorites' && <FavoritesView />}
        {(screenName === 'create' || screenName === 'delete') && (
          <NoteScreen action={screenName} />
        )}
      </QueryClientProvider>
    </IntlTestProvider>
  );
  const { rerender } = render(renderScreen('todos'));
  return {
    user: userEvent.setup(),
    show: (screenName: Screen) => rerender(renderScreen(screenName)),
  };
};

const itemOf = async (title: string) =>
  (await screen.findByText(title)).closest('li')!;

const saveNote = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '노트 저장' }));
  await screen.findByText('저장 완료');
};

describe('노트 작성·삭제 후 할 일 쪽 노트 정보', { timeout: 20_000 }, () => {
  it('노트를 작성하고 모든 할 일로 돌아오면 노트 작성 아이콘이 노트 보기로 바뀐다', async () => {
    const { user, show } = setup();
    expect(
      within(await itemOf(WITHOUT_NOTE)).getByRole('button', {
        name: '노트 작성하기',
      }),
    ).toBeInTheDocument();

    show('create');
    await saveNote(user);
    show('todos');

    await waitFor(async () =>
      expect(
        within(await itemOf(WITHOUT_NOTE)).getByRole('button', {
          name: '노트 보기',
        }),
      ).toBeInTheDocument(),
    );
  });

  it('노트를 삭제하고 모든 할 일로 돌아오면 노트 보기가 노트 작성 아이콘으로 바뀐다', async () => {
    const { user, show } = setup();
    expect(
      within(await itemOf(WITH_NOTE)).getByRole('button', {
        name: '노트 보기',
      }),
    ).toBeInTheDocument();

    show('delete');
    await saveNote(user);
    show('todos');

    await waitFor(async () =>
      expect(
        within(await itemOf(WITH_NOTE)).getByRole('button', {
          name: '노트 작성하기',
        }),
      ).toBeInTheDocument(),
    );
  });

  it('노트를 삭제하고 찜한 할 일로 돌아와도 노트 작성 아이콘으로 바뀐다', async () => {
    const { user, show } = setup();
    show('favorites');
    expect(
      within(await itemOf(WITH_NOTE)).getByRole('button', {
        name: '노트 보기',
      }),
    ).toBeInTheDocument();

    show('delete');
    await saveNote(user);
    show('favorites');

    await waitFor(async () =>
      expect(
        within(await itemOf(WITH_NOTE)).getByRole('button', {
          name: '노트 작성하기',
        }),
      ).toBeInTheDocument(),
    );
  });

  it('노트를 삭제한 뒤 할 일 상세를 다시 열면 작성된 노트를 보여 주지 않는다', async () => {
    const { user, show } = setup();
    await user.click(await screen.findByRole('button', { name: WITH_NOTE }));
    const detail = await screen.findByRole('dialog', {
      name: new RegExp(WITH_NOTE),
    });
    expect(await within(detail).findByText('작성된 노트')).toBeInTheDocument();
    await user.click(within(detail).getByRole('button', { name: '닫기' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    show('delete');
    await saveNote(user);
    show('todos');
    await user.click(await screen.findByRole('button', { name: WITH_NOTE }));
    const reopened = await screen.findByRole('dialog', {
      name: new RegExp(WITH_NOTE),
    });

    await within(reopened).findByText('목표', { selector: 'dt' });
    await waitFor(() =>
      expect(
        within(reopened).queryByText('작성된 노트'),
      ).not.toBeInTheDocument(),
    );
  });
});
