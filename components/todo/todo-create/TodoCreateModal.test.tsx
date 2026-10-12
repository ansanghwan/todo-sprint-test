import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import { getGoals } from '@/lib/api/goals';
import { uploadImage } from '@/lib/api/images';
import { createTodo } from '@/lib/api/todos';
import { todoKeys } from '@/queries/todo';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import { makeTodo } from '@/test/todoMocks';
import type { GoalDto } from '@/types/api/goal';
import type { TodoDto } from '@/types/api/todo';
import TodoCreateModal, { type TodoCreateModalProps } from './TodoCreateModal';

vi.mock('@/lib/api/todos', () => ({ createTodo: vi.fn() }));
vi.mock('@/lib/api/goals', () => ({ getGoals: vi.fn() }));
vi.mock('@/lib/api/images', () => ({ uploadImage: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

const mockedCreateTodo = vi.mocked(createTodo);
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
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

interface SetupOptions extends Pick<
  TodoCreateModalProps,
  'initialGoal' | 'onCreated'
> {
  /** true면 onOpenChange(false)가 와도 부모가 모달을 닫지 않습니다 (폼 초기화 확인용). */
  keepOpen?: boolean;
}

const setup = ({ keepOpen = false, ...props }: SetupOptions = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onOpenChange = vi.fn();

  const Harness = () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <IntlTestProvider>
        <QueryClientProvider client={queryClient}>
          <TodoCreateModal
            isOpen={isOpen}
            onOpenChange={(nextIsOpen) => {
              onOpenChange(nextIsOpen);
              if (!keepOpen) {
                setIsOpen(nextIsOpen);
              }
            }}
            {...props}
          />
        </QueryClientProvider>
      </IntlTestProvider>
    );
  };

  render(<Harness />);
  return { user: userEvent.setup(), onOpenChange, queryClient };
};

const MODAL_NAME = '할 일 생성';
const CONFIRM_NAME = '할 일 작성을 취소하시겠어요?';

// 확인창이 뜨면 아래 모달은 보조 기기에서 숨겨져 이름으로 찾을 수 없으므로, 폼을 품은 dialog로 찾습니다.
const queryModal = () =>
  document.querySelector('form')?.closest<HTMLElement>('[role="dialog"]') ??
  null;
const modal = () => {
  const element = queryModal();
  if (!element) {
    throw new Error('생성 모달이 열려 있지 않습니다.');
  }
  return element;
};
const queryConfirm = () => screen.queryByRole('dialog', { name: CONFIRM_NAME });
const titleInput = () =>
  within(modal()).getByRole<HTMLInputElement>('textbox', {
    name: '제목',
    hidden: true,
  });
const submitButton = () =>
  within(modal()).getByRole('button', { name: '확인' });
const cancelButton = () =>
  within(modal()).getByRole('button', { name: '취소' });
const linkInput = () =>
  within(modal()).getByRole('textbox', { name: '링크', hidden: true });
const tagInput = () =>
  within(modal()).getByRole<HTMLInputElement>('textbox', {
    name: '태그',
    hidden: true,
  });
const goalTrigger = () =>
  within(modal()).getByRole('combobox', { name: '목표' });
const dueDateTrigger = () =>
  within(modal()).getByRole('button', { name: /^마감기한/ });

const selectGoal = async (user: UserEvent, name: string) => {
  await user.click(goalTrigger());
  await user.click(await screen.findByRole('option', { name }));
};

/** 달력에서 이번 달의 날짜 하나를 골라 확인하고, 고른 날짜(YYYY-MM-DD)를 돌려줍니다. */
const pickDueDate = async (user: UserEvent) => {
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

/** 한 글자씩 치면 느려서 붙여 넣습니다. */
const enterTitle = async (user: UserEvent, title = '보고서 작성') => {
  await user.click(titleInput());
  await user.paste(title);
};

const fillRequired = async (user: UserEvent, title = '보고서 작성') => {
  await enterTitle(user, title);
  await selectGoal(user, '목표 2');
  return pickDueDate(user);
};

const attachImage = async (user: UserEvent) => {
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  await user.upload(screen.getByTestId('image-file-input'), file);
  return file;
};

/** 모달을 닫는 네 가지 방법 */
const CLOSE_PATHS: [string, (user: UserEvent) => Promise<void>][] = [
  [
    'X 버튼',
    (user) => user.click(within(modal()).getByRole('button', { name: '닫기' })),
  ],
  ['취소 버튼', (user) => user.click(cancelButton())],
  ['Esc', (user) => user.keyboard('{Escape}')],
  [
    '바깥(오버레이) 클릭',
    (user) =>
      user.click(document.querySelector<HTMLElement>('.bg-black\\/60')!),
  ],
];

// Radix 모달·선택 목록·달력을 실제로 조작해서 한 테스트가 몇 초씩 걸립니다.
// 전역 설정(vi.setConfig)을 바꾸지 않고 이 describe에만 제한 시간을 늘립니다.
describe('TodoCreateModal', { timeout: 20_000 }, () => {
  it('제목이 있는 모달로 열리고 상태 필드는 없다', async () => {
    setup();

    expect(screen.getByRole('dialog', { name: MODAL_NAME })).toBe(modal());
    expect(within(modal()).queryByText('상태')).not.toBeInTheDocument();
    await waitFor(() => expect(mockedGetGoals).toHaveBeenCalled());
  });

  it('취소·확인 버튼은 한 줄을 절반씩 나눠 써서 모달 밖으로 넘치지 않는다', async () => {
    // 공용 Button의 w-full shrink-0 그대로면 확인 버튼이 모달 밖으로 밀립니다 (화면 검수에서 확인).
    setup();

    for (const button of [cancelButton(), submitButton()]) {
      expect(button).toHaveClass('min-w-0', 'flex-1', 'shrink');
      expect(button).not.toHaveClass('shrink-0');
    }
    await waitFor(() => expect(mockedGetGoals).toHaveBeenCalled());
  });

  describe('확인 버튼 (FN-TD-27)', () => {
    it('필수값을 입력하기 전에는 누를 수 없다', async () => {
      setup();

      expect(submitButton()).toBeDisabled();
      await waitFor(() => expect(mockedGetGoals).toHaveBeenCalled());
    });

    it('제목·목표·마감기한을 모두 입력하면 누를 수 있다', async () => {
      const { user } = setup();

      await enterTitle(user);
      expect(submitButton()).toBeDisabled();
      await selectGoal(user, '목표 2');
      expect(submitButton()).toBeDisabled();
      await pickDueDate(user);

      await waitFor(() => expect(submitButton()).toBeEnabled());
    });

    it('링크가 잘못돼도 필수값이 유효하면 누를 수 있고, 누르면 요청 없이 링크 오류를 보여 준다', async () => {
      const { user, onOpenChange } = setup();
      await fillRequired(user);
      await user.type(linkInput(), 'hello world');

      expect(submitButton()).toBeEnabled();
      await user.click(submitButton());

      await waitFor(() =>
        expect(linkInput()).toHaveAccessibleDescription(
          '올바른 링크를 입력해주세요',
        ),
      );
      expect(mockedCreateTodo).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(submitButton()).toBeEnabled();
    });

    it('잘못된 링크를 고치면 그대로 생성된다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user } = setup();
      await fillRequired(user);
      await user.type(linkInput(), 'hello world');
      await user.click(submitButton());
      await waitFor(() =>
        expect(linkInput()).toHaveAttribute('aria-invalid', 'true'),
      );

      await user.clear(linkInput());
      await user.type(linkInput(), 'example.com');
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedCreateTodo).toHaveBeenCalledWith(
          expect.objectContaining({ linkUrl: 'https://example.com' }),
        ),
      );
    });

    it('필수값을 채웠다가 제목을 지우면 다시 누를 수 없고 오류를 보여 준다', async () => {
      const { user } = setup();
      await fillRequired(user);

      await user.clear(titleInput());

      await waitFor(() => expect(submitButton()).toBeDisabled());
      expect(titleInput()).toHaveAccessibleDescription('제목을 입력해주세요');
    });
  });

  describe('생성 요청 (FN-TD-28)', () => {
    it('이미지가 없으면 업로드 없이 입력한 값으로 생성한다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user } = setup();
      const date = await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedCreateTodo).toHaveBeenCalledWith({
          title: '보고서 작성',
          goalId: 2,
          dueDate: `${date}T14:59:59.000Z`,
        }),
      );
      expect(mockedUploadImage).not.toHaveBeenCalled();
    });

    it('이미지가 있으면 업로드한 뒤 받은 URL을 넣어 생성한다', async () => {
      mockedUploadImage.mockResolvedValueOnce('https://cdn.example.com/a.png');
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user } = setup();
      await fillRequired(user);
      const file = await attachImage(user);

      await user.click(submitButton());

      await waitFor(() => expect(mockedCreateTodo).toHaveBeenCalled());
      expect(mockedUploadImage).toHaveBeenCalledWith(file);
      expect(mockedUploadImage.mock.invocationCallOrder[0]).toBeLessThan(
        mockedCreateTodo.mock.invocationCallOrder[0],
      );
      expect(mockedCreateTodo).toHaveBeenCalledWith(
        expect.objectContaining({ fileUrl: 'https://cdn.example.com/a.png' }),
      );
    });

    it('이미지 업로드가 실패하면 생성 요청을 보내지 않고 모달과 입력값을 유지한다', async () => {
      mockedUploadImage.mockRejectedValueOnce(new Error('upload failed'));
      const { user, onOpenChange } = setup();
      await fillRequired(user);
      await attachImage(user);

      await user.click(submitButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('할 일을 생성하지 못했어요'),
      );
      expect(mockedCreateTodo).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(titleInput()).toHaveValue('보고서 작성');
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('생성이 실패하면 모달과 입력값을 유지하고, 다시 제출할 수 있다', async () => {
      mockedCreateTodo
        .mockRejectedValueOnce(new Error('server'))
        .mockResolvedValueOnce(makeTodo(7));
      const { user, onOpenChange } = setup();
      await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(titleInput()).toHaveValue('보고서 작성');
      expect(goalTrigger()).toHaveTextContent('목표 2');

      await waitFor(() => expect(submitButton()).toBeEnabled());
      await user.click(submitButton());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(mockedCreateTodo).toHaveBeenCalledTimes(2);
    });
  });

  describe('생성 성공', () => {
    it('생성 → 목록 무효화 → 닫기 → onCreated 순서로 진행하고 재조회를 기다리지 않는다', async () => {
      const created = makeTodo(7);
      const order: string[] = [];
      mockedCreateTodo.mockImplementationOnce(async () => {
        order.push('createTodo');
        return created;
      });
      const onCreated = vi.fn<(todo: TodoDto) => void>(() => {
        order.push('onCreated');
      });
      const { user, onOpenChange, queryClient } = setup({ onCreated });
      const invalidateQueries = vi
        .spyOn(queryClient, 'invalidateQueries')
        .mockImplementation(() => {
          order.push('invalidate');
          // 재조회가 끝나지 않아도 모달은 닫혀야 합니다.
          return new Promise(() => {});
        });
      onOpenChange.mockImplementation(() => order.push('close'));
      await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() => expect(queryModal()).not.toBeInTheDocument());
      // 모달과 폼을 먼저 정리한 뒤 호출부에 알립니다.
      expect(order).toEqual(['createTodo', 'invalidate', 'close', 'onCreated']);
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: todoKeys.lists(),
      });
      expect(onCreated).toHaveBeenCalledTimes(1);
      expect(onCreated).toHaveBeenCalledWith(created);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('작성한 내용이 있어도 닫기 확인창을 띄우지 않는다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user, onOpenChange } = setup();
      await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      expect(queryConfirm()).not.toBeInTheDocument();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('닫기 전에 폼을 처음 상태로 되돌린다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user, onOpenChange } = setup({ keepOpen: true });
      await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      await waitFor(() => expect(titleInput()).toHaveValue(''));
      expect(goalTrigger()).toHaveTextContent('목표를 선택해주세요');
      expect(dueDateTrigger()).toHaveTextContent('날짜를 선택해주세요');
      expect(submitButton()).toBeDisabled();
    });

    it('onCreated가 없어도 닫힌다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user, onOpenChange } = setup();
      await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() => expect(queryModal()).not.toBeInTheDocument());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
    });

    it('onCreated가 예외를 던져도 폼을 정리하고 닫으며, 생성 실패로 알리지 않는다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const callbackError = new Error('호출부 오류');
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const { user, onOpenChange } = setup({
        keepOpen: true,
        onCreated: () => {
          throw callbackError;
        },
      });
      await fillRequired(user);

      await user.click(submitButton());

      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
      await waitFor(() => expect(titleInput()).toHaveValue(''));
      expect(toast.error).not.toHaveBeenCalled();
      // 조용히 버리지 않고 개발 오류로 남깁니다.
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('onCreated'),
        callbackError,
      );
    });
  });

  describe('닫기 확인 (FN-TD-20)', () => {
    it.each(CLOSE_PATHS)(
      '작성하지 않은 폼은 %s로 바로 닫힌다',
      async (_, closeBy) => {
        const { user, onOpenChange } = setup();

        await closeBy(user);

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(queryModal()).not.toBeInTheDocument();
        expect(queryConfirm()).not.toBeInTheDocument();
      },
    );

    it.each(CLOSE_PATHS)(
      '값을 바꾼 폼은 %s로 닫으려 하면 확인창을 띄운다',
      async (_, closeBy) => {
        const { user, onOpenChange } = setup();
        await enterTitle(user);

        await closeBy(user);

        expect(
          await screen.findByRole('dialog', { name: CONFIRM_NAME }),
        ).toHaveTextContent('작성하신 모든 내용이 사라집니다');
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(modal()).toBeInTheDocument();
      },
    );

    it('확인창에서 취소하면 작성한 값을 그대로 둔다', async () => {
      const { user, onOpenChange } = setup();
      await enterTitle(user);
      await user.click(cancelButton());
      const confirm = await screen.findByRole('dialog', { name: CONFIRM_NAME });

      await user.click(within(confirm).getByRole('button', { name: '취소' }));

      expect(queryConfirm()).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(titleInput()).toHaveValue('보고서 작성');
    });

    it('확인창에서 확인하면 폼을 비우고 생성 모달을 닫는다', async () => {
      const { user, onOpenChange } = setup({ keepOpen: true });
      await enterTitle(user);
      await user.click(cancelButton());
      const confirm = await screen.findByRole('dialog', { name: CONFIRM_NAME });

      await user.click(within(confirm).getByRole('button', { name: '확인' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(queryConfirm()).not.toBeInTheDocument();
      await waitFor(() => expect(titleInput()).toHaveValue(''));
      expect(mockedCreateTodo).not.toHaveBeenCalled();
    });

    describe('처음 상태로 되돌린 폼은 확인창 없이 닫힌다', () => {
      const expectClosesImmediately = async (
        user: UserEvent,
        onOpenChange: ReturnType<typeof vi.fn>,
      ) => {
        await user.click(cancelButton());

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(queryConfirm()).not.toBeInTheDocument();
      };

      it('initialGoal이 미리 들어간 상태', async () => {
        const { user, onOpenChange } = setup({
          initialGoal: { id: 7, title: '미리 고른 목표' },
        });

        await expectClosesImmediately(user, onOpenChange);
      });

      it('제목을 입력했다가 지운 경우', async () => {
        const { user, onOpenChange } = setup();
        await user.type(titleInput(), '보고서');
        await user.clear(titleInput());

        await expectClosesImmediately(user, onOpenChange);
      });

      it('태그를 추가했다가 지운 경우', async () => {
        const { user, onOpenChange } = setup();
        await user.type(
          within(modal()).getByRole('textbox', { name: '태그' }),
          '공부{Enter}',
        );
        await user.click(
          screen.getByRole('button', { name: '공부 태그 삭제' }),
        );

        await expectClosesImmediately(user, onOpenChange);
      });

      it('링크를 입력했다가 X로 지운 경우', async () => {
        const { user, onOpenChange } = setup();
        await user.type(
          within(modal()).getByRole('textbox', { name: '링크' }),
          'example.com',
        );
        await user.click(screen.getByRole('button', { name: '링크 삭제' }));

        await expectClosesImmediately(user, onOpenChange);
      });

      it('이미지를 첨부했다가 지운 경우', async () => {
        const { user, onOpenChange } = setup();
        await attachImage(user);
        await user.click(screen.getByRole('button', { name: '이미지 삭제' }));

        await expectClosesImmediately(user, onOpenChange);
      });

      it('initialGoal을 다른 목표로 바꾸면 확인창을 띄운다', async () => {
        const { user, onOpenChange } = setup({
          initialGoal: { id: 7, title: '미리 고른 목표' },
        });
        await selectGoal(user, '목표 1');

        await user.click(cancelButton());

        expect(
          await screen.findByRole('dialog', { name: CONFIRM_NAME }),
        ).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
      });
    });

    describe('Enter를 누르기 전의 태그 글자', () => {
      it('글자를 입력한 채 닫으려 하면 확인창을 띄운다', async () => {
        const { user, onOpenChange } = setup();
        await user.type(tagInput(), '공부');

        await user.click(cancelButton());

        expect(
          await screen.findByRole('dialog', { name: CONFIRM_NAME }),
        ).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it('확인창에서 취소하면 입력하던 글자를 그대로 둔다', async () => {
        const { user } = setup();
        await user.type(tagInput(), '공부');
        await user.click(cancelButton());
        const confirm = await screen.findByRole('dialog', {
          name: CONFIRM_NAME,
        });

        await user.click(within(confirm).getByRole('button', { name: '취소' }));

        expect(tagInput()).toHaveValue('공부');
      });

      it('공백만 입력했으면 바로 닫힌다', async () => {
        const { user, onOpenChange } = setup();
        await user.type(tagInput(), '   ');

        await user.click(cancelButton());

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(queryConfirm()).not.toBeInTheDocument();
      });

      it('입력했다가 모두 지웠으면 바로 닫힌다', async () => {
        const { user, onOpenChange } = setup();
        await user.type(tagInput(), '공부');
        await user.clear(tagInput());

        await user.click(cancelButton());

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(queryConfirm()).not.toBeInTheDocument();
      });

      it('Enter로 태그가 된 뒤에는 태그 목록으로 판단한다', async () => {
        const { user, onOpenChange } = setup();
        await user.type(tagInput(), '공부{Enter}');
        await user.click(
          screen.getByRole('button', { name: '공부 태그 삭제' }),
        );

        await user.click(cancelButton());

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(queryConfirm()).not.toBeInTheDocument();
      });

      it('확인하고 닫으면 입력하던 글자도 비운다', async () => {
        const { user, onOpenChange } = setup({ keepOpen: true });
        await user.type(tagInput(), '공부');
        await user.click(cancelButton());
        const confirm = await screen.findByRole('dialog', {
          name: CONFIRM_NAME,
        });

        await user.click(within(confirm).getByRole('button', { name: '확인' }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        await waitFor(() => expect(tagInput()).toHaveValue(''));
        // 비운 뒤에는 작성 중이 아니므로 다시 닫을 때 확인창이 뜨지 않습니다.
        await user.click(cancelButton());
        expect(queryConfirm()).not.toBeInTheDocument();
      });

      it('생성에 성공하면 입력하던 글자도 비운다', async () => {
        mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
        const { user, onOpenChange } = setup({ keepOpen: true });
        await fillRequired(user);
        await user.type(tagInput(), '공부');

        await user.click(submitButton());

        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
        await waitFor(() => expect(tagInput()).toHaveValue(''));
      });
    });

    it('날짜 선택기가 열려 있을 때 Esc는 선택기만 닫는다', async () => {
      const { user, onOpenChange } = setup();
      await enterTitle(user);
      await user.click(dueDateTrigger());
      await screen.findByRole('grid');

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(queryConfirm()).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(modal()).toBeVisible();
    });
  });

  describe('제출 중', () => {
    const submitAndHold = async () => {
      let finish: (todo: TodoDto) => void = () => {};
      mockedCreateTodo.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const context = setup();
      await fillRequired(context.user);
      await context.user.click(submitButton());
      await waitFor(() => expect(mockedCreateTodo).toHaveBeenCalledTimes(1));
      return { ...context, finish: () => finish(makeTodo(7)) };
    };

    it('확인·취소 버튼을 막아 중복 제출하지 않는다', async () => {
      const { user, finish } = await submitAndHold();

      expect(submitButton()).toBeDisabled();
      expect(cancelButton()).toBeDisabled();
      await user.type(titleInput(), '{Enter}');

      expect(mockedCreateTodo).toHaveBeenCalledTimes(1);
      finish();
      await waitFor(() => expect(queryModal()).not.toBeInTheDocument());
    });

    it.each([CLOSE_PATHS[0], CLOSE_PATHS[2], CLOSE_PATHS[3]])(
      '%s로 닫을 수 없고 확인창도 뜨지 않는다',
      async (_, closeBy) => {
        const { user, onOpenChange, finish } = await submitAndHold();

        await closeBy(user);

        expect(onOpenChange).not.toHaveBeenCalled();
        expect(queryConfirm()).not.toBeInTheDocument();
        expect(modal()).toBeInTheDocument();
        finish();
        await waitFor(() => expect(queryModal()).not.toBeInTheDocument());
      },
    );
  });

  describe('initialGoal', () => {
    it('목록 첫 페이지에 없어도 선택된 목표로 보여 주고 그 id로 생성한다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user } = setup({
        initialGoal: { id: 7, title: '미리 고른 목표' },
      });

      expect(goalTrigger()).toHaveTextContent('미리 고른 목표');
      await enterTitle(user);
      await pickDueDate(user);
      await waitFor(() => expect(submitButton()).toBeEnabled());
      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedCreateTodo).toHaveBeenCalledWith(
          expect.objectContaining({ goalId: 7 }),
        ),
      );
    });

    it('다른 목표로 바꿔서 생성할 수 있다', async () => {
      mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
      const { user } = setup({
        initialGoal: { id: 7, title: '미리 고른 목표' },
      });
      await enterTitle(user);
      await selectGoal(user, '목표 1');
      await pickDueDate(user);
      await waitFor(() => expect(submitButton()).toBeEnabled());

      await user.click(submitButton());

      await waitFor(() =>
        expect(mockedCreateTodo).toHaveBeenCalledWith(
          expect.objectContaining({ goalId: 1 }),
        ),
      );
    });
  });
});
