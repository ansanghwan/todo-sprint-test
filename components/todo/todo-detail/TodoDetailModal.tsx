'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import TodoItemKebab from '@/components/todo/TodoItemKebab';
import TodoStatusChip from '@/components/todo/TodoStatusChip';
import Button from '@/components/ui/button/Button';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';
import { toast } from '@/components/ui/toast/Toaster';
import { todoQueries } from '@/queries/todo';
import type { TodoDto } from '@/types/api/todo';
import TodoDetailContent from './TodoDetailContent';
import TodoDetailNote from './TodoDetailNote';

export interface TodoDetailModalProps {
  /** 볼 할 일 id. null이면 닫힌 상태입니다. */
  todoId: number | null;
  onClose: () => void;
  /** 케밥의 수정하기. 넘기면 상세를 닫고 수정 모달을 여는 일은 호출부가 맡습니다. */
  onEdit?: (todoId: number) => void;
  /** 케밥의 삭제하기. 넘기지 않으면 케밥을 그리지 않습니다. */
  onDelete?: (todo: Pick<TodoDto, 'id' | 'title'>) => void;
  /** 작성된 노트 열기 (FN-TD-43). 넘기면 노트 제목을 보여 주고, 상세를 닫고 노트를 여는 일은 호출부가 맡습니다. */
  onOpenNote?: (noteId: number) => void;
}

/**
 * 할 일 상세 모달 (FN-TD-40~44). Figma Task modal (4:9953 PC, 4:9995 모바일)
 * PC는 가운데 모달, 모바일은 바텀시트입니다 (Modal size="detail").
 * 열 때마다 GET /todos/{todoId}로 새로 받되, 캐시가 있으면 먼저 보여 줍니다.
 */
const TodoDetailModal = ({ todoId, ...props }: TodoDetailModalProps) => {
  if (todoId === null) {
    return null;
  }
  return <TodoDetailDialog key={todoId} todoId={todoId} {...props} />;
};

const TodoDetailDialog = ({
  todoId,
  onClose,
  onEdit,
  onDelete,
  onOpenNote,
}: TodoDetailModalProps & { todoId: number }) => {
  const t = useTranslations('Todo');
  const {
    data: todo,
    isError,
    errorUpdatedAt,
    refetch,
  } = useQuery({
    ...todoQueries.detail(todoId),
    // 앱 QueryClient의 staleTime(60초) 안이어도 열 때마다 최신 값을 받습니다.
    refetchOnMount: 'always',
  });

  // FN-TD-40: 조회에 실패하면 에러 토스트를 띄웁니다.
  useEffect(() => {
    if (isError) {
      toast.error(t('fetchTodosError'));
    }
  }, [isError, errorUpdatedAt, t]);

  const kebab =
    todo && onDelete ? (
      <TodoItemKebab
        onEdit={onEdit ? () => onEdit(todo.id) : undefined}
        onDelete={() => onDelete({ id: todo.id, title: todo.title })}
      />
    ) : undefined;

  return (
    <Modal
      isOpen
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) {
          onClose();
        }
      }}
      size="detail"
      className="overflow-hidden"
    >
      {/* 스크롤을 패딩 안쪽에 두어 둥근 모서리 밖으로 나오지 않게 합니다. */}
      <div className="-m-1 flex min-h-0 scrollbar-thin flex-col gap-6 overflow-y-auto overscroll-contain p-1 pr-2">
        <ModalHeader actions={kebab} className="items-start gap-2">
          {todo ? (
            <>
              <span className="text-base/6 break-all md:text-xl/7.5">
                {todo.title}
              </span>
              {/* TodoStatusChip은 isTodo가 true일 때 DONE을 보여 줍니다. */}
              <TodoStatusChip isTodo={todo.done} className="shrink-0" />
            </>
          ) : (
            t('todo')
          )}
        </ModalHeader>

        {todo && <TodoDetailContent todo={todo} />}
        {todo && onOpenNote && todo.noteIds.length > 0 && (
          <TodoDetailNote noteId={todo.noteIds[0]} onOpen={onOpenNote} />
        )}

        {!todo && !isError && (
          <p
            role="status"
            className="py-10 text-center text-sm text-grayscale-400"
          >
            {t('loadingTodos')}
          </p>
        )}

        {!todo && isError && (
          <div className="flex flex-col items-center gap-4 py-10">
            <p className="text-sm text-grayscale-500">{t('fetchTodosError')}</p>
            <Button
              variant="neutral"
              size="sm"
              className="w-auto"
              onClick={() => void refetch()}
            >
              {t('retry')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TodoDetailModal;
