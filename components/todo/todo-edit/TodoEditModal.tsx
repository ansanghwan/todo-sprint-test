'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import Button from '@/components/ui/button/Button';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';
import { todoQueries } from '@/queries/todo';
import type { TodoDto } from '@/types/api/todo';
import TodoEditForm from './TodoEditForm';

export interface TodoEditModalProps {
  /** 수정할 할 일 id. null이면 닫힌 상태입니다. */
  todoId: number | null;
  onClose: () => void;
  /**
   * 수정 성공 후 모달을 닫은 뒤 호출하는 알림용 콜백입니다. 예외를 던지지 않아야 합니다.
   * 할 일 목록·상세 query 무효화는 수정 mutation이 처리하므로,
   * React Query를 쓰지 않는 화면의 새로고침 같은 후처리에만 씁니다.
   */
  onUpdated?: (todoId: number) => void;
}

/**
 * 할 일 수정 모달 (FN-TD-29~31). Figma TaskForm 수정 상태 (4:5314, 4:5389, 4:5462)
 * 열 때 GET /todos/{todoId}로 받은 값으로 폼을 채웁니다.
 */
const TodoEditModal = ({ todoId, ...props }: TodoEditModalProps) => {
  // 닫혀 있을 때는 조회도 폼도 만들지 않아서, 열 때마다 최신 값으로 새 폼을 시작합니다.
  if (todoId === null) {
    return null;
  }
  return <TodoEditDialog key={todoId} todoId={todoId} {...props} />;
};

const TodoEditDialog = ({
  todoId,
  onClose,
  onUpdated,
}: TodoEditModalProps & { todoId: number }) => {
  const t = useTranslations('Todo');
  const {
    data: todo,
    isError,
    isFetchedAfterMount,
    refetch,
  } = useQuery({
    ...todoQueries.detail(todoId),
    // 앱 QueryClient는 staleTime이 60초라, 그 안에 다시 열면 재조회가 생략되어
    // 아래 isFetchedAfterMount가 참이 되지 않습니다. 이 조회만 열 때마다 새로 받습니다.
    refetchOnMount: 'always',
  });
  // 폼은 이번에 연 뒤 받아 온 값으로만 시작합니다. 이전에 캐시된 상세 값으로 먼저 띄우면
  // 그사이 목록에서 바꾼 상태 등이 빠진 채 폼이 고정되기 때문입니다.
  // 한 번 띄운 뒤에는 이 값을 유지해서, 편집 중 재조회로 입력이 덮어써지지 않게 합니다.
  const [formTodo, setFormTodo] = useState<TodoDto | null>(null);
  const freshTodo = isFetchedAfterMount && !isError ? todo : undefined;
  if (freshTodo && !formTodo) {
    setFormTodo(freshTodo);
  }
  const isLoading = !formTodo && !isError;
  // 폼이 열려 있으면 닫기 확인을 거치고, 불러오는 중·실패 화면에서는 바로 닫습니다.
  const requestCloseRef = useRef<(() => void) | null>(null);

  return (
    <Modal
      isOpen
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) {
          (requestCloseRef.current ?? onClose)();
        }
      }}
      size="lg"
      className="overflow-hidden"
    >
      {/* 스크롤을 패딩 안쪽에 두어 둥근 모서리 밖으로 나오지 않게 합니다. */}
      <div className="-m-1 flex min-h-0 scrollbar-thin flex-col gap-6 overflow-y-auto overscroll-contain p-1 pr-2">
        <ModalHeader>{t('editTodo')}</ModalHeader>
        {isLoading && (
          <p
            role="status"
            className="py-10 text-center text-sm text-grayscale-400"
          >
            {t('loadingTodos')}
          </p>
        )}
        {!formTodo && isError && (
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
        {formTodo && (
          <TodoEditForm
            todo={formTodo}
            onClose={onClose}
            onUpdated={onUpdated}
            onCloseRequestChange={(requestClose) => {
              requestCloseRef.current = requestClose;
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default TodoEditModal;
