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

/**
 * 통합 검증: API 모듈을 가짜로 바꾸지 않고, Storybook과 같은 mock 서버(mockTodosApi)에
 * 실제 화면(TodosView + 수정 모달)을 붙여 케밥 → 수정 → 목록 갱신 흐름을 확인합니다.
 */
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const TODO_ID = 3;
const TITLE = '수정할 할 일';

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
    totalCount: 3,
    delay: 0,
    todoOverrides: {
      [TODO_ID]: {
        title: TITLE,
        done: false,
        goalId: 1,
        goal: { id: 1, title: '자바스크립트로 웹 서비스 만들기 1' },
        dueDate: '2026-10-10T14:59:59.000Z',
      },
    },
  });
  render(
    <TestProviders>
      <TodosView />
    </TestProviders>,
  );
  return userEvent.setup();
};

const todoItem = async (title: string) =>
  (await screen.findByText(title)).closest<HTMLElement>('li')!;
const editModal = () => screen.getByRole('dialog', { name: '할 일 수정' });
const queryEditModal = () =>
  screen.queryByRole('dialog', { name: '할 일 수정' });

const openEdit = async (user: UserEvent, title = TITLE) => {
  await user.click(
    within(await todoItem(title)).getByRole('button', { name: '더보기' }),
  );
  await user.click(await screen.findByRole('menuitem', { name: '수정하기' }));
  await within(editModal()).findByRole('textbox', { name: '제목' });
};

describe(
  '모든 할 일에서 할 일 수정 (mock 서버 통합)',
  { timeout: 20_000 },
  () => {
    it('케밥의 수정하기로 기존 값이 채워진 수정 모달을 연다', async () => {
      const user = setup();

      await openEdit(user);

      expect(
        within(editModal()).getByRole('textbox', { name: '제목' }),
      ).toHaveValue(TITLE);
      expect(
        within(editModal()).getByRole('radio', { name: 'TO DO' }),
      ).toBeChecked();
    });

    it('닫고 목록에서 완료로 바꾼 뒤 다시 열면 바뀐 상태로 시작한다', async () => {
      const user = setup();
      await openEdit(user);
      await user.click(
        within(editModal()).getByRole('button', { name: '취소' }),
      );
      await waitFor(() => expect(queryEditModal()).not.toBeInTheDocument());

      await user.click(
        within(await todoItem(TITLE)).getByRole('checkbox', { name: '완료' }),
      );
      await waitFor(async () =>
        expect(
          within(await todoItem(TITLE)).getByRole('checkbox', { name: '완료' }),
        ).toBeChecked(),
      );
      await openEdit(user);

      expect(
        within(editModal()).getByRole('radio', { name: 'DONE' }),
      ).toBeChecked();
    });

    it('저장하면 모달이 닫히고 목록에 바뀐 제목이 보인다', async () => {
      const user = setup();
      await openEdit(user);
      const titleInput = within(editModal()).getByRole('textbox', {
        name: '제목',
      });

      await user.clear(titleInput);
      await user.click(titleInput);
      await user.paste('바뀐 제목');
      await user.click(
        within(editModal()).getByRole('button', { name: '수정하기' }),
      );

      await waitFor(() => expect(queryEditModal()).not.toBeInTheDocument());
      expect(await screen.findByText('바뀐 제목')).toBeInTheDocument();
      expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    });
  },
);
