import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import TodosView from './TodosView';

/**
 * 통합 검증: mock 서버(mockTodosApi)에 모든 할 일 화면을 붙여
 * 노트 보기(FN-TD-11)·노트 작성(FN-TD-12)·상세의 작성된 노트(FN-TD-43) 흐름을 확인합니다.
 */
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
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
  vi.clearAllMocks();
});

const setup = () => {
  restoreApi = mockTodosApi({
    totalCount: 4,
    delay: 0,
    todoOverrides: {
      3: { title: WITHOUT_NOTE },
      4: { title: WITH_NOTE },
    },
  });
  render(
    <TestProviders>
      <TodosView />
    </TestProviders>,
  );
  return userEvent.setup();
};

const itemOf = async (title: string) =>
  (await screen.findByRole('button', { name: title })).closest('li')!;

const findNoteDrawer = () =>
  screen.findByRole('dialog', { name: `${WITH_NOTE} 정리` });

describe(
  '모든 할 일에서 노트 연결 (mock 서버 통합)',
  { timeout: 20_000 },
  () => {
    it('노트 보기는 그 할 일의 노트 상세를 연다', async () => {
      const user = setup();

      await user.click(
        within(await itemOf(WITH_NOTE)).getByRole('button', {
          name: '노트 보기',
        }),
      );

      const drawer = await findNoteDrawer();
      expect(
        await within(drawer).findByRole('link', { name: '강의 노트' }),
      ).toBeInTheDocument();
    });

    it('노트 작성은 할 일 id를 넘겨 노트 작성 화면으로 이동한다', async () => {
      const user = setup();

      await user.click(
        within(await itemOf(WITHOUT_NOTE)).getByRole('button', {
          name: '노트 작성하기',
        }),
      );

      expect(push).toHaveBeenCalledWith('/notes/write?todoId=3');
    });

    it('할 일 상세의 작성된 노트를 누르면 상세를 닫고 노트 상세만 연다', async () => {
      const user = setup();
      await user.click(await screen.findByRole('button', { name: WITH_NOTE }));
      const detail = await screen.findByRole('dialog', {
        name: new RegExp(WITH_NOTE),
      });

      await user.click(
        await within(detail).findByRole('button', {
          name: `${WITH_NOTE} 정리`,
        }),
      );

      await findNoteDrawer();
      // 뒤에 깔린 모달도 세기 위해 숨겨진 dialog까지 셉니다.
      await waitFor(() =>
        expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1),
      );
    });

    it('노트가 없는 할 일의 상세에는 작성된 노트를 보여 주지 않는다', async () => {
      const user = setup();
      await user.click(
        await screen.findByRole('button', { name: WITHOUT_NOTE }),
      );
      const detail = await screen.findByRole('dialog', {
        name: new RegExp(WITHOUT_NOTE),
      });
      await within(detail).findByText('목표', { selector: 'dt' });

      expect(within(detail).queryByText('작성된 노트')).not.toBeInTheDocument();
    });
  },
);
