import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import TodosView from './TodosView';

// 할 일 목록의 노트 작성(FN-TD-12)이 라우터로 이동하므로 테스트에서는 라우터를 대신합니다.
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

/**
 * 통합 검증: Storybook과 같은 mock 서버(mockTodosApi)에 실제 화면을 붙여
 * 목록 → 상세 → 수정·삭제로 넘어갈 때 대상이 맞고 모달이 겹치지 않는지 확인합니다.
 */
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const FIRST = '첫 번째 할 일';
const SECOND = '두 번째 할 일';

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
    totalCount: 2,
    delay: 0,
    todoOverrides: {
      1: { title: FIRST, goal: { id: 1, title: '목표 A' }, goalId: 1 },
      2: { title: SECOND, goal: { id: 2, title: '목표 B' }, goalId: 2 },
    },
  });
  render(
    <TestProviders>
      <TodosView />
    </TestProviders>,
  );
  return userEvent.setup();
};

/**
 * 모달이 겹치지 않았는지 확인합니다. 뒤에 깔린 Radix 모달은 보조 기기에서 숨겨지므로
 * 숨겨진 것까지 포함해 DOM에 열린 dialog를 셉니다.
 */
const expectOnlyOneDialog = () =>
  expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1);

const openDetail = async (user: UserEvent, title: string) => {
  await user.click(await screen.findByRole('button', { name: title }));
  const dialog = await screen.findByRole('dialog', {
    name: new RegExp(title),
  });
  // 상세 값이 그려질 때까지 기다립니다.
  await within(dialog).findByText('목표', { selector: 'dt' });
  return dialog;
};

const chooseFromDetailKebab = async (
  user: UserEvent,
  dialog: HTMLElement,
  item: '수정하기' | '삭제하기',
) => {
  await user.click(within(dialog).getByRole('button', { name: '더보기' }));
  await user.click(await screen.findByRole('menuitem', { name: item }));
};

describe(
  '모든 할 일에서 할 일 상세 (mock 서버 통합)',
  { timeout: 20_000 },
  () => {
    it('누른 할 일의 상세를 연다', async () => {
      const user = setup();

      const dialog = await openDetail(user, SECOND);

      expect(within(dialog).getByText('목표 B')).toBeInTheDocument();
      expectOnlyOneDialog();
    });

    it('상세의 수정하기는 상세를 닫고 같은 할 일의 수정 모달만 연다', async () => {
      const user = setup();
      const detail = await openDetail(user, SECOND);

      await chooseFromDetailKebab(user, detail, '수정하기');

      const edit = await screen.findByRole('dialog', { name: '할 일 수정' });
      expect(
        await within(edit).findByRole('textbox', { name: '제목' }),
      ).toHaveValue(SECOND);
      expectOnlyOneDialog();
    });

    it('상세의 삭제하기는 상세를 닫고 같은 할 일의 삭제 확인만 띄우며, 확인하면 목록에서 뺀다', async () => {
      const user = setup();
      const detail = await openDetail(user, FIRST);

      await chooseFromDetailKebab(user, detail, '삭제하기');

      const confirm = await screen.findByRole('dialog', {
        name: `${FIRST} 할 일을 삭제하시겠습니까?`,
      });
      expectOnlyOneDialog();

      await user.click(within(confirm).getByRole('button', { name: '확인' }));

      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: FIRST }),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('button', { name: SECOND })).toBeInTheDocument();
    });
  },
);
