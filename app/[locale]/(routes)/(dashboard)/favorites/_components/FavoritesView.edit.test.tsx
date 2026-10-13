import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import { mockTodosApi } from '@/test/todoMocks';
import TodosView from '../../todos/_components/TodosView';
import FavoritesView from './FavoritesView';

/**
 * 통합 검증: mock 서버(mockTodosApi)에 모든 할 일·찜한 할 일 화면을 차례로 붙여
 * 찜 목록 캐시가 있는 상태에서 수정 저장이 찜 화면에도 반영되는지 확인합니다.
 */
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const TODO_ID = 3;
const TITLE = '찜한 수정 대상';

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
  vi.clearAllMocks();
});

describe('수정 저장 후 찜한 할 일', { timeout: 20_000 }, () => {
  it('찜 목록 캐시가 있는 상태에서 모든 할 일에서 수정하면, 찜 화면으로 돌아왔을 때 바뀐 제목이 보인다', async () => {
    restoreApi = mockTodosApi({
      totalCount: 3,
      delay: 0,
      todoOverrides: {
        // 수정 폼의 필수값(목표·마감기한)을 채워 둡니다.
        [TODO_ID]: {
          title: TITLE,
          done: false,
          isFavorite: true,
          goalId: 1,
          goal: { id: 1, title: '자바스크립트로 웹 서비스 만들기 1' },
          dueDate: '2026-10-10T14:59:59.000Z',
        },
      },
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
    const user = userEvent.setup();
    const { rerender } = render(renderScreen('favorites'));
    expect(await screen.findByText(TITLE)).toBeInTheDocument();

    rerender(renderScreen('todos'));
    const item = (await screen.findByText(TITLE)).closest<HTMLElement>('li')!;
    await user.click(within(item).getByRole('button', { name: '더보기' }));
    await user.click(await screen.findByRole('menuitem', { name: '수정하기' }));
    const modal = screen.getByRole('dialog', { name: '할 일 수정' });
    const titleInput = await within(modal).findByRole('textbox', {
      name: '제목',
    });
    await user.clear(titleInput);
    await user.click(titleInput);
    await user.paste('바뀐 찜 제목');
    await user.click(within(modal).getByRole('button', { name: '수정하기' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '할 일 수정' }),
      ).not.toBeInTheDocument(),
    );

    rerender(renderScreen('favorites'));

    expect(await screen.findByText('바뀐 찜 제목')).toBeInTheDocument();
    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
  });
});
