import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import FavoritesView from './FavoritesView';

/**
 * 통합 검증: mock 서버(mockTodosApi)에 찜한 할 일 화면을 붙여
 * 목록 → 상세(FN-TD-13)·수정(FN-TD-29)과 상세 → 수정·삭제·노트 상세 전환을 확인합니다. (FN-FV-06)
 */
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// mock 서버는 id가 4의 배수인 할 일에 같은 id의 노트를 연결합니다.
const WITH_NOTE = '노트 있는 찜';
const PLAIN = '그냥 찜';
const GOAL = { id: 1, title: '자바스크립트로 웹 서비스 만들기 1' };
// 수정 폼의 필수값(목표·마감기한)을 채워 둡니다.
const editable = {
  isFavorite: true,
  done: false,
  goalId: GOAL.id,
  goal: GOAL,
  dueDate: '2026-10-10T14:59:59.000Z',
};

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

const setup = () => {
  restoreApi = mockTodosApi({
    totalCount: 4,
    delay: 0,
    todoOverrides: {
      3: { ...editable, title: PLAIN },
      4: { ...editable, title: WITH_NOTE },
    },
  });
  render(
    <TestProviders>
      <FavoritesView />
    </TestProviders>,
  );
  return userEvent.setup();
};

const itemOf = async (title: string) =>
  (await screen.findByRole('button', { name: title })).closest('li')!;

const openDetail = async (user: UserEvent, title: string) => {
  await user.click(await screen.findByRole('button', { name: title }));
  const dialog = await screen.findByRole('dialog', {
    name: new RegExp(title),
  });
  await within(dialog).findByText('프로젝트', { selector: 'dt' });
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

/** 뒤에 깔린 Radix 모달까지 세어 창이 겹치지 않았는지 확인합니다. */
const expectOnlyOneDialog = () =>
  waitFor(() =>
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1),
  );

describe('찜한 할 일의 상세·수정 (mock 서버 통합)', { timeout: 20_000 }, () => {
  it('제목을 누르면 그 할 일의 상세를 연다', async () => {
    const user = setup();

    const dialog = await openDetail(user, PLAIN);

    expect(within(dialog).getByText(GOAL.title)).toBeInTheDocument();
  });

  it('목록 케밥의 수정하기로 수정하면 찜 목록에 바뀐 제목이 보인다', async () => {
    const user = setup();
    await user.click(
      within(await itemOf(PLAIN)).getByRole('button', { name: '더보기' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: '수정하기' }));
    const edit = await screen.findByRole('dialog', { name: '할 일 수정' });
    const titleInput = await within(edit).findByRole('textbox', {
      name: '제목',
    });

    await user.clear(titleInput);
    await user.click(titleInput);
    await user.paste('바뀐 찜 제목');
    await user.click(within(edit).getByRole('button', { name: '수정하기' }));

    expect(await screen.findByText('바뀐 찜 제목')).toBeInTheDocument();
    expect(screen.queryByText(PLAIN)).not.toBeInTheDocument();
  });

  it('상세의 수정하기는 상세를 닫고 같은 할 일의 수정 모달만 연다', async () => {
    const user = setup();
    const detail = await openDetail(user, PLAIN);

    await chooseFromDetailKebab(user, detail, '수정하기');

    const edit = await screen.findByRole('dialog', { name: '할 일 수정' });
    expect(
      await within(edit).findByRole('textbox', { name: '제목' }),
    ).toHaveValue(PLAIN);
    await expectOnlyOneDialog();
  });

  it('상세의 삭제하기는 상세를 닫고 삭제 확인만 띄우며, 확인하면 찜 목록에서 뺀다', async () => {
    const user = setup();
    const detail = await openDetail(user, PLAIN);

    await chooseFromDetailKebab(user, detail, '삭제하기');

    const confirm = await screen.findByRole('dialog', {
      name: `${PLAIN} 할 일을 삭제하시겠습니까?`,
    });
    await expectOnlyOneDialog();
    await user.click(within(confirm).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: PLAIN }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: WITH_NOTE })).toBeInTheDocument();
  });

  it('상세의 작성된 노트를 누르면 상세를 닫고 노트 상세만 연다', async () => {
    const user = setup();
    const detail = await openDetail(user, WITH_NOTE);

    await user.click(
      await within(detail).findByRole('button', { name: `${WITH_NOTE} 정리` }),
    );

    await screen.findByRole('dialog', { name: `${WITH_NOTE} 정리` });
    await expectOnlyOneDialog();
  });
});
