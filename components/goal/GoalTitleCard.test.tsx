import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { deleteGoal, updateGoal } from '@/lib/api/goals';
import { goalKeys } from '@/queries/goal';
import { installRadixDomMocks } from '@/test/domMocks';
import type { GoalDetailDto } from '@/types/api/goal';
import GoalTitleCard from './GoalTitleCard';
import IntlTestProvider from '@/test/IntlTestProvider';

const { replace, error } = vi.hoisted(() => ({
  replace: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/components/ui/toast/Toaster', () => ({ toast: { error } }));
vi.mock('@/lib/api/goals', () => ({
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));
const goal: GoalDetailDto = {
  id: 683,
  teamId: 'team',
  userId: 1,
  title: '기존 목표',
  createdAt: '',
  updatedAt: '',
  todos: [{ id: 1, title: '할 일', done: false, createdAt: '', updatedAt: '' }],
};
beforeEach(() => {
  vi.clearAllMocks();
  installRadixDomMocks();
});
function setup(locale: 'ko' | 'en' = 'ko') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(goalKeys.detail(goal.id), goal);
  function View() {
    const { data } = useQuery({
      queryKey: goalKeys.detail(goal.id),
      queryFn: async () => goal,
      enabled: false,
    });
    return <GoalTitleCard goal={data!} />;
  }
  render(
    <IntlTestProvider locale={locale}>
      <QueryClientProvider client={client}>
        <View />
      </QueryClientProvider>
    </IntlTestProvider>,
  );
  return { client, user: userEvent.setup() };
}
async function select(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: '프로젝트 더보기' }));
  await user.click(await screen.findByRole('menuitem', { name }));
}
it('제목을 저장하고 기존 할 일 데이터를 유지한다', async () => {
  vi.mocked(updateGoal).mockResolvedValue({ ...goal, title: '수정 목표' });
  const { client, user } = setup();
  await select(user, '수정하기');
  fireEvent.change(screen.getByRole('textbox', { name: '프로젝트명' }), {
    target: { value: '  수정 목표  ' },
  });
  await user.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByRole('heading', { name: '수정 목표' });
  expect(updateGoal).toHaveBeenCalledWith(683, { title: '수정 목표' });
  expect(
    client.getQueryData<GoalDetailDto>(goalKeys.detail(683))?.todos,
  ).toEqual(goal.todos);
});
it('빈 제목은 저장하지 않고 Esc는 수정을 취소한다', async () => {
  const { user } = setup();
  await select(user, '수정하기');
  const input = screen.getByRole('textbox', { name: '프로젝트명' });
  fireEvent.change(input, { target: { value: ' ' } });
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(
    screen.getByRole('heading', { name: '기존 목표' }),
  ).toBeInTheDocument();
  expect(updateGoal).not.toHaveBeenCalled();
});
it('수정 실패하면 입력을 유지한다', async () => {
  vi.mocked(updateGoal).mockRejectedValue(new Error('Offline'));
  const { user } = setup();
  await select(user, '수정하기');
  fireEvent.change(screen.getByRole('textbox', { name: '프로젝트명' }), {
    target: { value: '수정 목표' },
  });
  await user.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(error).toHaveBeenCalled());
  expect(screen.getByRole('textbox', { name: '프로젝트명' })).toHaveValue(
    '수정 목표',
  );
});
it('삭제 확인 후에만 삭제하고 대시보드로 이동한다', async () => {
  vi.mocked(deleteGoal).mockResolvedValue(undefined);
  const { user } = setup();
  await select(user, '삭제하기');
  expect(deleteGoal).not.toHaveBeenCalled();
  const dialog = screen.getByRole('dialog', { name: '정말 삭제하시겠어요?' });
  await user.click(within(dialog).getByRole('button', { name: '확인' }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  expect(deleteGoal).toHaveBeenCalledWith(683);
});
it('삭제 실패하면 확인창을 유지하고 이동하지 않는다', async () => {
  vi.mocked(deleteGoal).mockRejectedValue(new Error('Offline'));
  const { user } = setup();
  await select(user, '삭제하기');
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: '확인',
    }),
  );
  await waitFor(() => expect(error).toHaveBeenCalled());
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

it('영문에서 수정·삭제 문구를 번역하고 사용자가 작성한 목표명은 유지한다', async () => {
  const { user } = setup('en');
  expect(
    screen.getByRole('heading', { name: '기존 목표' }),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'More project actions' }),
  );
  await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
  expect(screen.getByRole('textbox', { name: 'Project title' })).toHaveValue(
    '기존 목표',
  );
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  await user.click(
    screen.getByRole('button', { name: 'More project actions' }),
  );
  await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const dialog = screen.getByRole('dialog', {
    name: 'Are you sure you want to delete this project?',
  });
  expect(
    within(dialog).getByText('Deleted projects cannot be recovered.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole('button', { name: 'Confirm' }),
  ).toBeInTheDocument();
});
