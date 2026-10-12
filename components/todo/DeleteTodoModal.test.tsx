import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast/Toaster';
import { deleteTodo } from '@/lib/api/todos';
import TestProviders from '@/test/TestProviders';
import DeleteTodoModal from './DeleteTodoModal';

vi.mock('@/lib/api/todos', () => ({ deleteTodo: vi.fn() }));
vi.mock('@/components/ui/toast/Toaster', () => ({
  toast: { error: vi.fn() },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const confirmDelete = async (
  onDeleted?: (todoId: number) => void,
  onClose = vi.fn(),
) => {
  // 모달이 열려 있는 동안 Radix가 body에 pointer-events: none을 겁니다.
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(
    <TestProviders>
      <DeleteTodoModal
        todo={{ id: 7, title: '할 일 7' }}
        onClose={onClose}
        onDeleted={onDeleted}
      />
    </TestProviders>,
  );
  await user.click(screen.getByRole('button', { name: '확인' }));
  return { onClose };
};

describe('DeleteTodoModal', () => {
  it('할 일 제목이 들어간 확인 문구를 보여준다', () => {
    render(
      <TestProviders>
        <DeleteTodoModal todo={{ id: 7, title: '할 일 7' }} onClose={vi.fn()} />
      </TestProviders>,
    );

    expect(
      screen.getByRole('dialog', { name: '할 일 7 할 일을 삭제하시겠습니까?' }),
    ).toBeInTheDocument();
  });

  it('삭제가 성공하면 모달을 먼저 닫고 onDeleted에 id를 넘긴다', async () => {
    vi.mocked(deleteTodo).mockResolvedValue();
    const order: string[] = [];
    const onDeleted = vi.fn(() => {
      order.push('onDeleted');
    });
    const onClose = vi.fn(() => {
      order.push('close');
    });

    await confirmDelete(onDeleted, onClose);

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(order).toEqual(['close', 'onDeleted']);
    expect(deleteTodo).toHaveBeenCalledWith(7);
    expect(onDeleted).toHaveBeenCalledWith(7);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('삭제가 실패하면 토스트를 띄우고 onDeleted·닫기를 실행하지 않는다', async () => {
    vi.mocked(deleteTodo).mockRejectedValue(new Error('network'));
    const onDeleted = vi.fn();

    const { onClose } = await confirmDelete(onDeleted);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('할 일을 삭제하지 못했어요'),
    );
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
