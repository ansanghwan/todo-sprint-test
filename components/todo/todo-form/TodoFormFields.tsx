'use client';

import { Controller, type Control, type FieldError } from 'react-hook-form';

import DueDateField from './fields/DueDateField';
import GoalSelectField, { type GoalOption } from './fields/GoalSelectField';
import ImageField from './fields/ImageField';
import LinkField from './fields/LinkField';
import StatusField from './fields/StatusField';
import TagInputField from './fields/TagInputField';
import TitleField from './fields/TitleField';
import {
  toTodoFormErrorKey,
  type TodoFormInput,
  type TodoFormOutput,
} from './todoFormSchema';

/** 배열 필드는 에러가 배열 전체(root)나 항목 하나에 달릴 수 있어서 처음 찾은 메시지를 씁니다. */
const getTagsErrorMessage = (error?: FieldError) => {
  if (!error) {
    return undefined;
  }
  const itemErrors = Array.isArray(error) ? (error as FieldError[]) : [];

  return (
    error.message ??
    error.root?.message ??
    itemErrors.find((itemError) => itemError?.message)?.message
  );
};

interface TodoFormFieldsProps {
  control: Control<TodoFormInput, unknown, TodoFormOutput>;
  initialGoal?: GoalOption;
  /** 태그 입력란에 적고 아직 추가하지 않은 글자가 바뀔 때 알립니다. */
  onTagDraftChange?: (draft: string) => void;
  /** 맨 위에 상태(TO DO / DONE) 필드를 보여 줍니다. 수정 모달에서만 씁니다 (FN-TD-29). */
  showStatus?: boolean;
}

/**
 * 할 일 폼의 입력 필드 묶음. RHF 값·에러를 각 필드에 연결합니다.
 * 모바일 12px, PC 16px 간격 (Figma TaskForm).
 */
const TodoFormFields = ({
  control,
  initialGoal,
  onTagDraftChange,
  showStatus = false,
}: TodoFormFieldsProps) => (
  <div className="flex flex-col gap-3 md:gap-4">
    {showStatus && (
      <Controller
        control={control}
        name="done"
        render={({ field }) => (
          <StatusField value={field.value} onChange={field.onChange} />
        )}
      />
    )}
    <Controller
      control={control}
      name="title"
      render={({ field, fieldState }) => (
        <TitleField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={toTodoFormErrorKey(fieldState.error?.message)}
        />
      )}
    />
    <Controller
      control={control}
      name="goalId"
      render={({ field, fieldState }) => (
        <GoalSelectField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={toTodoFormErrorKey(fieldState.error?.message)}
          initialGoal={initialGoal}
        />
      )}
    />
    <Controller
      control={control}
      name="dueDate"
      render={({ field, fieldState }) => (
        <DueDateField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={toTodoFormErrorKey(fieldState.error?.message)}
        />
      )}
    />
    <Controller
      control={control}
      name="tags"
      render={({ field, fieldState }) => (
        <TagInputField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={toTodoFormErrorKey(getTagsErrorMessage(fieldState.error))}
          onDraftChange={onTagDraftChange}
        />
      )}
    />
    <Controller
      control={control}
      name="linkUrl"
      render={({ field, fieldState }) => (
        <LinkField
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={toTodoFormErrorKey(fieldState.error?.message)}
        />
      )}
    />
    <Controller
      control={control}
      name="image"
      render={({ field, fieldState }) => (
        <ImageField
          value={field.value}
          onChange={field.onChange}
          error={toTodoFormErrorKey(fieldState.error?.message)}
        />
      )}
    />
  </div>
);

export default TodoFormFields;
