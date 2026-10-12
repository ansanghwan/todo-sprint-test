import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import TodosView from './TodosView';

/**
 * 통합 검증: API 모듈을 가짜로 바꾸지 않고, Storybook과 같은 mock 서버(mockTodosApi)에
 * 실제 화면(TodosView + 생성 모달)을 붙여 목록 → 생성 → 목록 갱신 흐름을 확인합니다.
 */
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

let triggerIntersect: () => void;
let restoreApi: () => void = () => {};
let mockLogs: unknown[][] = [];

beforeEach(() => {
  installRadixDomMocks();
  triggerIntersect = stubIntersectionObserver();
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  });
  mockLogs = [];
  vi.spyOn(console, 'info').mockImplementation((...args: unknown[]) => {
    mockLogs.push(args);
  });
});

afterEach(() => {
  restoreApi();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const setup = (options: Partial<Parameters<typeof mockTodosApi>[0]> = {}) => {
  restoreApi = mockTodosApi({ totalCount: 12, delay: 0, ...options });
  render(
    <TestProviders>
      <TodosView />
    </TestProviders>,
  );
  return userEvent.setup();
};

const heading = (count: number) =>
  screen.findByRole('heading', { name: `모든 할 일 ${count}` });
const modal = () => screen.getByRole('dialog', { name: '할 일 생성' });
const firstTodoTitle = () =>
  within(screen.getAllByRole('list')[0]).getAllByRole('listitem')[0];

const openModal = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: '할 일 추가' }));
  return screen.findByRole('dialog', { name: '할 일 생성' });
};

const fillRequired = async (user: UserEvent, title: string) => {
  await user.click(within(modal()).getByRole('textbox', { name: '제목' }));
  await user.paste(title);
  await user.click(within(modal()).getByRole('combobox', { name: '목표' }));
  await user.click((await screen.findAllByRole('option'))[1]);
  await user.click(within(modal()).getByRole('button', { name: /^마감기한/ }));
  const grid = await screen.findByRole('grid');
  await user.click(
    within(
      grid.querySelector<HTMLElement>('[data-day]:not([data-outside])')!,
    ).getByRole('button'),
  );
  await user.click(
    within(grid.closest<HTMLElement>('[role="dialog"]')!).getByRole('button', {
      name: '확인',
    }),
  );
};

const submit = (user: UserEvent) =>
  user.click(within(modal()).getByRole('button', { name: '확인' }));

const createRequestBody = () =>
  mockLogs.find(([label]) =>
    String(label).startsWith('[mock POST /todos] → id'),
  )?.[1];

// 모달·선택 목록·달력을 실제로 조작해서 느립니다. 이 describe에만 제한 시간을 늘립니다.
describe(
  '모든 할 일에서 할 일 생성 (mock 서버 통합)',
  { timeout: 20_000 },
  () => {
    it('생성하면 모달이 닫히고 목록 맨 위와 전체 개수가 갱신된다', async () => {
      const user = setup();
      await heading(12);
      await openModal(user);
      await fillRequired(user, '새로 만든 할 일');

      await submit(user);

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(await heading(13)).toBeVisible();
      expect(firstTodoTitle()).toHaveTextContent('새로 만든 할 일');
      expect(createRequestBody()).toEqual({
        title: '새로 만든 할 일',
        goalId: 2,
        dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T14:59:59\.000Z$/),
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('태그·링크·이미지를 넣으면 업로드한 뒤 모두 담아 생성한다', async () => {
      const user = setup();
      await heading(12);
      await openModal(user);
      await fillRequired(user, '자료가 있는 할 일');
      await user.type(
        within(modal()).getByRole('textbox', { name: '태그' }),
        '공부{Enter}문서{Enter}',
      );
      await user.click(within(modal()).getByRole('textbox', { name: '링크' }));
      await user.paste('example.com');
      await user.upload(
        screen.getByTestId('image-file-input'),
        new File(['image'], 'photo.png', { type: 'image/png' }),
      );

      await submit(user);

      expect(await heading(13)).toBeVisible();
      expect(createRequestBody()).toEqual(
        expect.objectContaining({
          tags: ['공부', '문서'],
          linkUrl: 'https://example.com',
          fileUrl: 'https://mock-upload.invalid/files/photo.png',
        }),
      );
      const labels = mockLogs.map(([label]) => String(label));
      const indexOf = (prefix: string) =>
        labels.findIndex((label) => label.startsWith(prefix));
      expect(indexOf('[mock POST /images]')).toBeGreaterThan(-1);
      expect(indexOf('[mock POST /images]')).toBeLessThan(
        indexOf('[mock PUT upload]'),
      );
      expect(indexOf('[mock PUT upload]')).toBeLessThan(
        indexOf('[mock POST /todos]'),
      );
    });

    it('목표는 10개씩 불러오고 목록 끝에서 다음 10개를 이어 붙인다', async () => {
      const user = setup({ goalCount: 25 });
      await heading(12);
      await openModal(user);

      await user.click(within(modal()).getByRole('combobox', { name: '목표' }));
      expect(await screen.findAllByRole('option')).toHaveLength(10);

      await act(async () => triggerIntersect());
      await waitFor(() =>
        expect(screen.getAllByRole('option')).toHaveLength(20),
      );
      await act(async () => triggerIntersect());
      await waitFor(() =>
        expect(screen.getAllByRole('option')).toHaveLength(25),
      );

      await act(async () => triggerIntersect());
      expect(
        mockLogs.filter(([label]) =>
          String(label).startsWith('[mock GET /goals]'),
        ),
      ).toHaveLength(3);
    });

    it('생성이 실패하면 토스트를 띄우고 모달·입력값·목록을 그대로 둔다', async () => {
      const user = setup({ failCreate: true });
      await heading(12);
      await openModal(user);
      await fillRequired(user, '실패할 할 일');

      await submit(user);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('할 일을 생성하지 못했어요'),
      );
      expect(
        within(modal()).getByRole('textbox', { name: '제목' }),
      ).toHaveValue('실패할 할 일');
      expect(
        screen.getByRole('heading', { name: '모든 할 일 12', hidden: true }),
      ).toBeInTheDocument();
    });

    it('이미지 업로드가 실패하면 할 일을 만들지 않는다', async () => {
      const user = setup({ failUpload: true });
      await heading(12);
      await openModal(user);
      await fillRequired(user, '업로드 실패');
      await user.upload(
        screen.getByTestId('image-file-input'),
        new File(['image'], 'photo.png', { type: 'image/png' }),
      );

      await submit(user);

      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
      expect(createRequestBody()).toBeUndefined();
      expect(modal()).toBeInTheDocument();
    });
  },
);
