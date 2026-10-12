'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { isTodoFormChanged } from '@/components/todo/todo-form/isTodoFormChanged';
import TodoFormFields from '@/components/todo/todo-form/TodoFormFields';
import {
  canSubmitRequiredFields,
  EMPTY_TODO_FORM,
  todoFormSchema,
  type TodoFormInput,
  type TodoFormOutput,
} from '@/components/todo/todo-form/todoFormSchema';
import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';
import { toast } from '@/components/ui/toast/Toaster';
import useCreateTodo from '@/hooks/todo/useCreateTodo';
import useCloseConfirm from '@/hooks/useCloseConfirm';
import type { GoalDto } from '@/types/api/goal';
import type { TodoDto } from '@/types/api/todo';

export interface TodoCreateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** 미리 선택해 둘 목표. 사용자가 다른 목표로 바꿀 수 있습니다. */
  initialGoal?: Pick<GoalDto, 'id' | 'title'>;
  /**
   * 생성 성공 후 모달과 폼을 정리한 다음 호출합니다.
   * 할 일 목록 query 무효화는 생성 mutation이 처리합니다.
   */
  onCreated?: (todo: TodoDto) => void;
}

/**
 * 할 일 생성 모달 (FN-TD-20~28). Figma TaskForm modal (4:10125, 4:10184)
 * 별도 URL 없이 모달로만 동작합니다.
 */
const TodoCreateModal = (props: TodoCreateModalProps) => {
  // 닫혀 있을 때는 폼을 만들지 않아서, 열 때마다 initialGoal 기준의 새 폼으로 시작합니다.
  if (!props.isOpen) {
    return null;
  }
  return <TodoCreateDialog {...props} />;
};

const TodoCreateDialog = ({
  isOpen,
  onOpenChange,
  initialGoal,
  onCreated,
}: TodoCreateModalProps) => {
  const t = useTranslations('Todo');
  const createTodo = useCreateTodo();
  const initialValues: TodoFormInput = {
    ...EMPTY_TODO_FORM,
    goalId: initialGoal?.id ?? null,
  };
  const {
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { isSubmitting },
  } = useForm<TodoFormInput, unknown, TodoFormOutput>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: initialValues,
    // FN-TD-27: 폼 값이 바뀔 때마다 검증합니다.
    mode: 'onChange',
  });

  const [title, goalId, dueDate] = useWatch({
    control,
    name: ['title', 'goalId', 'dueDate'],
  });
  // FN-TD-27: 필수 3개가 유효하면 누를 수 있습니다. 선택 항목의 오류는 제출할 때 전체 검증에서 걸러집니다.
  const canSubmit = canSubmitRequiredFields({ title, goalId, dueDate });

  // 태그 입력란에 적고 아직 추가하지 않은 글자. 닫을 때만 보면 되므로 렌더를 일으키지 않게 ref에 둡니다.
  const tagDraftRef = useRef('');
  // 필드 안쪽 상태(태그 입력 글자, 즉시 오류)까지 처음으로 되돌리려고 필드 묶음을 새로 만듭니다.
  const [fieldsKey, setFieldsKey] = useState(0);

  const close = () => {
    reset(initialValues);
    tagDraftRef.current = '';
    setFieldsKey((key) => key + 1);
    onOpenChange(false);
  };

  const { isConfirmOpen, setIsConfirmOpen, requestClose, confirmClose } =
    useCloseConfirm({
      shouldConfirm: () =>
        isTodoFormChanged(getValues(), initialValues, tagDraftRef.current),
      isBlocked: isSubmitting,
      onClose: close,
    });

  const onSubmit = async (values: TodoFormOutput) => {
    let createdTodo: TodoDto;
    try {
      createdTodo = await createTodo.mutateAsync(values);
    } catch {
      // FN-TD-28: 실패하면 모달과 입력값을 그대로 둡니다.
      toast.error(t('form.createError'));
      return;
    }

    // 생성은 이미 끝났으므로 확인창 없이 모달과 폼을 먼저 정리한 뒤 호출부에 알립니다.
    close();
    try {
      onCreated?.(createdTodo);
    } catch (error) {
      console.error(
        '[TodoCreateModal] onCreated 실행 중 오류가 났습니다.',
        error,
      );
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(nextIsOpen) => {
          if (!nextIsOpen) {
            requestClose();
          }
        }}
        size="lg"
        className="overflow-hidden"
      >
        {/* 스크롤을 패딩 안쪽에 두어 둥근 모서리 밖으로 나오지 않게 합니다. */}
        <div className="-m-1 min-h-0 scrollbar-thin overflow-y-auto overscroll-contain p-1 pr-2">
          <form
            noValidate
            // 제출 시점에 handleSubmit을 호출해 onSubmit 내부의 ref 변경과 렌더를 분리합니다.
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            className="flex flex-col gap-6"
          >
            <ModalHeader>{t('createTodo')}</ModalHeader>
            <TodoFormFields
              key={fieldsKey}
              control={control}
              initialGoal={initialGoal}
              onTagDraftChange={(draft) => {
                tagDraftRef.current = draft;
              }}
            />
            {/* 공용 Button은 w-full shrink-0이라 나란히 두면 각자 한 줄을 다 차지합니다. 절반씩 나누도록 덮어씁니다. */}
            <div className="mt-2 flex gap-3 md:mt-4">
              <Button
                variant="neutral"
                className="min-w-0 flex-1 shrink"
                disabled={isSubmitting}
                onClick={requestClose}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="min-w-0 flex-1 shrink"
                disabled={!canSubmit || isSubmitting}
              >
                {t('confirm')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('form.closeConfirm')}
        description={t('form.closeWarning')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        onConfirm={confirmClose}
      />
    </>
  );
};

export default TodoCreateModal;
