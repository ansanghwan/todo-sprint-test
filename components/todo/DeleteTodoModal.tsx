'use client';

import { useTranslations } from 'next-intl';

import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/toast/Toaster';
import { useDeleteTodo } from '@/queries/todoMutations';
import type { TodoDto } from '@/types/api/todo';

interface DeleteTodoModalProps {
  /** 삭제할 할 일. null이면 닫힌 상태입니다. */
  todo: Pick<TodoDto, 'id' | 'title'> | null;
  onClose: () => void;
  /**
   * 삭제 성공 후 모달을 닫은 뒤 호출하는 알림용 콜백입니다 (통계·진행률 갱신 등). 예외를 던지지 않아야 합니다.
   * 목록 캐시에서 빼는 일은 useDeleteTodo가 이미 했으므로 여기서 하지 않습니다.
   */
  onDeleted?: (todoId: number) => void;
}

/**
 * 할 일 삭제 확인 (FN-TD-10). 확인하면 DELETE를 보내고, 성공하면 닫습니다.
 * 실패하면 토스트를 띄우고 모달은 열어 둬 다시 시도하거나 취소할 수 있게 합니다.
 */
const DeleteTodoModal = ({
  todo,
  onClose,
  onDeleted,
}: DeleteTodoModalProps) => {
  const t = useTranslations('Todo');
  const { mutate: deleteTodo, isPending } = useDeleteTodo();

  const handleConfirm = () => {
    if (!todo) {
      return;
    }
    deleteTodo(todo.id, {
      onSuccess: (_data, todoId) => {
        // 삭제는 이미 끝났으므로 모달을 먼저 닫고, 호출부에는 결과만 알립니다.
        onClose();
        onDeleted?.(todoId);
      },
      onError: () => toast.error(t('deleteTodoError')),
    });
  };

  return (
    <ConfirmModal
      isOpen={todo !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      title={t('deleteTodoConfirm', { title: todo?.title ?? '' })}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      onConfirm={handleConfirm}
      isPending={isPending}
    />
  );
};

export default DeleteTodoModal;
