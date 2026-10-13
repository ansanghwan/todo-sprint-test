'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { isTodoFormChanged } from '@/components/todo/todo-form/isTodoFormChanged';
import TodoFormFields from '@/components/todo/todo-form/TodoFormFields';
import {
  canSubmitRequiredFields,
  todoFormSchema,
  type TodoFormInput,
  type TodoFormOutput,
} from '@/components/todo/todo-form/todoFormSchema';
import {
  toTodoEditFormValues,
  toUpdateTodoRequest,
} from '@/components/todo/todo-form/todoFormValues';
import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/toast/Toaster';
import useUpdateTodo from '@/hooks/todo/useUpdateTodo';
import useCloseConfirm from '@/hooks/useCloseConfirm';
import type { TodoDto } from '@/types/api/todo';

interface TodoEditFormProps {
  todo: TodoDto;
  onClose: () => void;
  onUpdated?: (todoId: number) => void;
  /** 모달의 X·Esc·바깥 클릭이 이 폼의 닫기 확인을 거치도록 닫기 요청 함수를 넘겨받습니다. */
  onCloseRequestChange: (requestClose: () => void) => void;
}

/**
 * 할 일 수정 폼 (FN-TD-29~31). 생성 폼의 필드·검증을 그대로 쓰고 맨 위에 상태 필드를 더합니다.
 * 규격에 맞지 않는 기존 값(목표·마감기한 없음, 제목 30자 초과)은 고치지 않고 열자마자 오류로 알려서,
 * 저장하려면 무엇을 바꿔야 하는지 보이게 합니다.
 */
const TodoEditForm = ({
  todo,
  onClose,
  onUpdated,
  onCloseRequestChange,
}: TodoEditFormProps) => {
  const t = useTranslations('Todo');
  const updateTodo = useUpdateTodo();
  // 열 때의 값으로 고정합니다. 편집 중에 상세 query가 다시 받아져도 처음 값은 바뀌지 않습니다.
  const [initialValues] = useState(() => toTodoEditFormValues(todo));
  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { isSubmitting },
  } = useForm<TodoFormInput, unknown, TodoFormOutput>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: initialValues,
    // FN-TD-27: 폼 값이 바뀔 때마다 검증합니다.
    mode: 'onChange',
  });

  // 기존 값이 규격에 맞지 않으면 바로 오류 문구가 보이도록 처음 한 번 검증합니다.
  useEffect(() => {
    void trigger();
  }, [trigger]);

  const [title, goalId, dueDate] = useWatch({
    control,
    name: ['title', 'goalId', 'dueDate'],
  });
  const canSubmit = canSubmitRequiredFields({ title, goalId, dueDate });

  // 태그 입력란에 적고 아직 추가하지 않은 글자. 닫을 때만 보면 되므로 렌더를 일으키지 않게 ref에 둡니다.
  const tagDraftRef = useRef('');

  const { isConfirmOpen, setIsConfirmOpen, requestClose, confirmClose } =
    useCloseConfirm({
      shouldConfirm: () =>
        isTodoFormChanged(getValues(), initialValues, tagDraftRef.current),
      isBlocked: isSubmitting,
      onClose,
    });

  useEffect(() => {
    onCloseRequestChange(requestClose);
  });

  const onSubmit = async (values: TodoFormOutput) => {
    const current = getValues();
    const body = toUpdateTodoRequest(initialValues, current, values);
    const newImage = current.image instanceof File ? current.image : undefined;

    // 바뀐 것이 없으면 요청 없이 닫습니다.
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    try {
      await updateTodo.mutateAsync({ todoId: todo.id, body, newImage });
    } catch {
      // FN-TD-31: 실패하면 모달과 입력값을 그대로 둡니다.
      toast.error(t('form.updateError'));
      return;
    }

    // 수정은 이미 끝났으므로 모달을 먼저 닫고, 호출부에는 결과만 알립니다.
    onClose();
    onUpdated?.(todo.id);
  };

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-6"
      >
        <TodoFormFields
          control={control}
          initialGoal={todo.goal ?? undefined}
          onTagDraftChange={(draft) => {
            tagDraftRef.current = draft;
          }}
          showStatus
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
            {t('edit')}
          </Button>
        </div>
      </form>

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

export default TodoEditForm;
