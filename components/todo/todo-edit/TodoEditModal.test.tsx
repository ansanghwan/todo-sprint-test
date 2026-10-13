import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import { getGoals } from '@/lib/api/goals';
import { uploadImage } from '@/lib/api/images';
import { getTodo, updateTodo } from '@/lib/api/todos';
import { todoKeys } from '@/queries/todo';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import { makeTodo } from '@/test/todoMocks';
import type { GoalDto } from '@/types/api/goal';
import TodoEditModal from './TodoEditModal';

vi.mock('@/lib/api/todos', () => ({ getTodo: vi.fn(), updateTodo: vi.fn() }));
vi.mock('@/lib/api/goals', () => ({ getGoals: vi.fn() }));
vi.mock('@/lib/api/images', () => ({ uploadImage: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const mockedGetTodo = vi.mocked(getTodo);
const mockedUpdateTodo = vi.mocked(updateTodo);
const mockedUploadImage = vi.mocked(uploadImage);
const mockedGetGoals = vi.mocked(getGoals);

const goal = (id: number): GoalDto => ({
  id,
  teamId: 'team',
  userId: 1,
  title: `목표 ${id}`,
  createdAt: '2026-09-28T09:00:00.000Z',
  updatedAt: '2026-09-28T09:00:00.000Z',
  todoCount: 0,
  completedCount: 0,
});

const TODO_ID = 7;
const TODO = makeTodo(TODO_ID, {
  title: '보고서 작성',
  done: false,
  goalId: 1,
  goal: { id: 1, title: '목표 1' },
  // KST 2026-10-10 23:59:59
  dueDate: '2026-10-10T14:59:59.000Z',
  tags: [{ id: 1, name: '공부' }],
  linkUrl: 'https://example.com',
  fileUrl: 'https://files.test/a.png',
});

beforeEach(() => {
  installRadixDomMocks();
  stubIntersectionObserver();
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  });
  mockedGetGoals.mockResolvedValue({
    goals: [goal(1), goal(2)],
    nextCursor: null,
    totalCount: 2,
  });
  mockedGetTodo.mockResolvedValue(TODO);
  mockedUpdateTodo.mockResolvedValue();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

interface SetupOptions {
  queryClient?: QueryClient;
}

const setup = ({
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
}: SetupOptions = {}) => {
  const onClose = vi.fn();
  const onUpdated = vi.fn();
  let reopen: () => void = () => {};

  const Harness = () => {
    const [todoId, setTodoId] = useState<number | null>(TODO_ID);
    reopen = () => setTodoId(TODO_ID);
    return (
      <IntlTestProvider>
        <QueryClientProvider client={queryClient}>
          <TodoEditModal
            todoId={todoId}
            onClose={() => {
              onClose();
              setTodoId(null);
            }}
            onUpdated={onUpdated}
          />
        </QueryClientProvider>
      </IntlTestProvider>
    );
  };

  render(<Harness />);
  return {
    user: userEvent.setup(),
    onClose,
    onUpdated,
    queryClient,
    reopen: () => reopen(),
  };
};

const MODAL_NAME = '할 일 수정';

const queryModal = () =>
  screen.queryByRole('dialog', { name: MODAL_NAME, hidden: true });
const modal = () => screen.getByRole('dialog', { name: MODAL_NAME });
/** 폼이 기존 값으로 채워질 때까지 기다립니다. */
const waitForForm = () =>
  within(modal()).findByRole<HTMLInputElement>('textbox', { name: '제목' });
const titleInput = () =>
  within(modal()).getByRole<HTMLInputElement>('textbox', { name: '제목' });
const linkInput = () =>
  within(modal()).getByRole<HTMLInputElement>('textbox', { name: '링크' });
const submitButton = () =>
  within(modal()).getByRole('button', { name: '수정하기' });
const statusRadio = (name: 'TO DO' | 'DONE') =>
  within(modal()).getByRole('radio', { name });
const dueDateTrigger = () =>
  within(modal()).getByRole('button', { name: /^마감기한/ });

const replaceTitle = async (user: UserEvent, title: string) => {
  await user.clear(titleInput());
  await user.click(titleInput());
  await user.paste(title);
};

/** 달력에서 보이는 달의 첫 날짜를 골라 확인하고, 고른 날짜(YYYY-MM-DD)를 돌려줍니다. */
const pickFirstDueDate = async (user: UserEvent) => {
  await user.click(dueDateTrigger());
  const grid = await screen.findByRole('grid');
  const cell = grid.querySelector<HTMLElement>(
    '[data-day]:not([data-outside])',
  )!;
  await user.click(within(cell).getByRole('button'));
  await user.click(
    within(grid.closest<HTMLElement>('[role="dialog"]')!).getByRole('button', {
      name: '확인',
    }),
  );
  return cell.getAttribute('data-day')!;
};

// Radix 모달·선택 목록·달력을 실제로 조작해서 한 테스트가 몇 초씩 걸립니다.
describe('TodoEditModal', { timeout: 20_000 }, () => {
  describe('열기 (FN-TD-29)', () => {
    it('상세 조회 값으로 상태·제목·목표·마감기한·태그·링크·이미지를 채운다', async () => {
      setup();

      expect(await waitForForm()).toHaveValue('보고서 작성');
      expect(mockedGetTodo).toHaveBeenCalledWith(TODO_ID, expect.anything());
      expect(statusRadio('TO DO')).toBeChecked();
      expect(statusRadio('DONE')).not.toBeChecked();
      expect(
        within(modal()).getByRole('combobox', { name: '목표' }),
      ).toHaveTextContent('목표 1');
      expect(dueDateTrigger()).toHaveTextContent('2026. 10. 10');
      expect(within(modal()).getByText('공부')).toBeInTheDocument();
      expect(linkInput()).toHaveValue('https://example.com');
      expect(
        within(modal()).getByRole('img', { name: '첨부한 이미지 미리보기' }),
      ).toHaveAttribute('src', 'https://files.test/a.png');
    });

    it('불러오는 중에는 폼 대신 안내를 보여 준다', async () => {
      mockedGetTodo.mockReturnValue(new Promise(() => {}));
      setup();

      expect(within(modal()).getByRole('status')).toHaveTextContent(
        '할 일을 불러오는 중이에요',
      );
      expect(
        within(modal()).queryByRole('textbox', { name: '제목' }),
      ).not.toBeInTheDocument();
    });

    it('조회에 실패하면 다시 시도할 수 있다', async () => {
      mockedGetTodo.mockRejectedValueOnce(new Error('network'));
      const { user } = setup();

      await user.click(
        await within(modal()).findByRole('button', { name: '다시 시도' }),
      );

      expect(await waitForForm()).toHaveValue('보고서 작성');
    });

    it('다시 열면 캐시된 이전 값이 아니라 새로 받은 값으로 시작한다', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      // 목록에서 완료로 바꾸기 전 값이 캐시에 남아 있는 상황입니다.
      queryClient.setQueryData(todoKeys.detail(TODO_ID), {
        ...TODO,
        done: false,
      });
      mockedGetTodo.mockResolvedValue({ ...TODO, done: true });
      setup({ queryClient });

      // 캐시 값으로 폼을 먼저 띄우지 않습니다.
      expect(within(modal()).getByRole('status')).toBeInTheDocument();
      await waitForForm();
      expect(statusRadio('DONE')).toBeChecked();
    });

    it('앱 설정(staleTime 60초)에서도 닫자마자 다시 열면 새로 조회해 폼을 띄운다', async () => {
      // providers/getQueryClient.ts와 같은 캐시 조건입니다.
      const queryClient = new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: false } },
      });
      const { user, reopen } = setup({ queryClient });
      await waitForForm();
      await user.click(within(modal()).getByRole('button', { name: '취소' }));
      await waitFor(() => expect(queryModal()).not.toBeInTheDocument());

      // 그사이 목록에서 완료로 바뀐 상황입니다.
      mockedGetTodo.mockResolvedValue({ ...TODO, done: true });
      reopen();

      await screen.findByRole('dialog', { name: MODAL_NAME });
      await waitForForm();
      expect(statusRadio('DONE')).toBeChecked();
      expect(mockedGetTodo).toHaveBeenCalledTimes(2);
    });

    it('편집 중에 상세가 다시 조회돼도 입력한 값을 덮어쓰지 않는다', async () => {
      const { user, queryClient } = setup();
      await waitForForm();
      await replaceTitle(user, '편집 중인 제목');

      mockedGetTodo.mockResolvedValue({ ...TODO, title: '서버에서 바뀐 제목' });
      await queryClient.refetchQueries({ queryKey: todoKeys.detail(TODO_ID) });

      expect(titleInput()).toHaveValue('편집 중인 제목');
    });
  });

  describe('규격 밖 기존 데이터', () => {
    it('값을 고치지 않고 열자마자 오류로 알려 저장을 막는다', async () => {
      const longTitle =
        '다른 화면에서 만든 아주 긴 제목의 할 일이라 서른 글자를 넘습니다';
      mockedGetTodo.mockResolvedValue({
        ...TODO,
        title: longTitle,
        goalId: null,
        goal: null,
        dueDate: null,
      });
      setup();

      expect(await waitForForm()).toHaveValue(longTitle);
      expect(
        await within(modal()).findByText('제목은 30자 이내로 입력해주세요'),
      ).toBeInTheDocument();
      expect(
        within(modal()).getByText('목표를 선택해주세요', { selector: 'p' }),
      ).toBeInTheDocument();
      expect(
        within(modal()).getByText('마감기한을 선택해주세요', {
          selector: 'p',
        }),
      ).toBeInTheDocument();
      expect(submitButton()).toBeDisabled();
    });
  });

  describe('저장 (FN-TD-31)', () => {
    it('바뀐 필드만 PATCH하고, 모달을 먼저 닫은 뒤 onUpdated를 호출한다', async () => {
      const order: string[] = [];
      const { user, onClose, onUpdated } = setup();
      onClose.mockImplementation(() => order.push('close'));
      onUpdated.mockImplementation(() => order.push('onUpdated'));
      await waitForForm();
      await replaceTitle(user, '새 제목');

      await user.click(submitButton());

      await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(TODO_ID));
      expect(mockedUpdateTodo).toHaveBeenCalledWith(TODO_ID, {
        title: '새 제목',
      });
      expect(order).toEqual(['close', 'onUpdated']);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('바뀐 것이 없으면 요청 없이 닫는다', async () => {
      const { user, onClose, onUpdated } = setup();
      await waitForForm();

      await user.click(submitButton());

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(mockedUpdateTodo).not.toHaveBeenCalled();
      expect(onUpdated).not.toHaveBeenCalled();
    });

    it('상태를 바꾸면 done만 보낸다', async () => {
      const { user } = setup();
      await waitForForm();

      await user.click(statusRadio('DONE'));
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedUpdateTodo).toHaveBeenCalledWith(TODO_ID, { done: true }),
      );
    });

    it('날짜를 바꾸면 고른 날짜의 KST 23:59:59를 UTC로 보낸다', async () => {
      const { user } = setup();
      await waitForForm();

      const date = await pickFirstDueDate(user);
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedUpdateTodo).toHaveBeenCalledWith(TODO_ID, {
          dueDate: new Date(`${date}T23:59:59+09:00`).toISOString(),
        }),
      );
    });

    it('링크를 지우면 linkUrl을 null로 보낸다', async () => {
      const { user } = setup();
      await waitForForm();

      await user.click(
        within(modal()).getByRole('button', { name: '링크 삭제' }),
      );
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedUpdateTodo).toHaveBeenCalledWith(TODO_ID, {
          linkUrl: null,
        }),
      );
    });

    it('이미지만 지우면 업로드 없이 fileUrl을 null로 보낸다', async () => {
      const { user } = setup();
      await waitForForm();

      await user.click(
        within(modal()).getByRole('button', { name: '이미지 삭제' }),
      );
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedUpdateTodo).toHaveBeenCalledWith(TODO_ID, {
          fileUrl: null,
        }),
      );
      expect(mockedUploadImage).not.toHaveBeenCalled();
    });

    it('이미지만 새 파일로 바꾸면 그 파일을 올린 뒤 받은 URL만 보낸다', async () => {
      mockedUploadImage.mockResolvedValue('https://files.test/new.png');
      const { user } = setup();
      await waitForForm();
      const file = new File(['image'], 'new.png', { type: 'image/png' });

      await user.click(
        within(modal()).getByRole('button', { name: '이미지 삭제' }),
      );
      await user.upload(screen.getByTestId('image-file-input'), file);
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedUpdateTodo).toHaveBeenCalledWith(TODO_ID, {
          fileUrl: 'https://files.test/new.png',
        }),
      );
      expect(mockedUploadImage).toHaveBeenCalledWith(file);
    });

    it('저장에 실패하면 토스트를 띄우고 모달과 입력값을 그대로 둔다', async () => {
      mockedUpdateTodo.mockRejectedValueOnce(new Error('network'));
      const { user, onClose, onUpdated } = setup();
      await waitForForm();
      await replaceTitle(user, '새 제목');

      await user.click(submitButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('할 일을 수정하지 못했어요'),
      );
      expect(queryModal()).toBeInTheDocument();
      expect(titleInput()).toHaveValue('새 제목');
      expect(onClose).not.toHaveBeenCalled();
      expect(onUpdated).not.toHaveBeenCalled();
    });

    it('저장 중에는 다시 제출하거나 닫을 수 없다', async () => {
      let finishUpdate: () => void = () => {};
      mockedUpdateTodo.mockReturnValue(
        new Promise<void>((resolve) => {
          finishUpdate = resolve;
        }),
      );
      const { user, onClose } = setup();
      await waitForForm();
      await replaceTitle(user, '새 제목');

      await user.click(submitButton());
      await waitFor(() => expect(submitButton()).toBeDisabled());
      await user.click(submitButton());
      await user.keyboard('{Escape}');

      expect(mockedUpdateTodo).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('dialog', { name: '할 일 작성을 취소하시겠어요?' }),
      ).not.toBeInTheDocument();

      finishUpdate();
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });
  });

  describe('닫기 확인 (FN-TD-20)', () => {
    it('바꾼 내용이 있으면 닫기 전에 확인한다', async () => {
      const { user, onClose } = setup();
      await waitForForm();
      await replaceTitle(user, '새 제목');

      await user.keyboard('{Escape}');

      expect(
        await screen.findByRole('dialog', {
          name: '할 일 작성을 취소하시겠어요?',
        }),
      ).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('바꾼 내용이 없으면 바로 닫는다', async () => {
      const { user, onClose } = setup();
      await waitForForm();

      await user.click(within(modal()).getByRole('button', { name: '취소' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
