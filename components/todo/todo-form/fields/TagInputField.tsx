'use client';

import { useTranslations } from 'next-intl';
import { useId, useState, type KeyboardEvent } from 'react';

import useTodoFormErrorMessage from '@/hooks/todo/useTodoFormErrorMessage';
import { cn } from '@/lib/utils';
import { FIELD_INNER_INPUT_CLASS, fieldBoxVariants } from '../fieldStyles';
import { getTagColor } from '../tagColors';
import { addTag } from '../tagRules';
import type { TodoFormErrorKey } from '../todoFormSchema';
import FieldLayout from './FieldLayout';
import TagChip from './TagChip';

interface TagInputFieldProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  error?: TodoFormErrorKey;
  /** 입력란에 적고 아직 추가하지 않은 글자가 바뀔 때 알립니다 (작성 중인지 판단하는 데 씁니다). */
  onDraftChange?: (draft: string) => void;
}

/** 태그 (FN-TD-24). Enter로 추가하고 칩의 X로 지웁니다. */
const TagInputField = ({
  value,
  onChange,
  onBlur,
  error,
  onDraftChange,
}: TagInputFieldProps) => {
  const t = useTranslations('Todo');
  const getErrorMessage = useTodoFormErrorMessage();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [draft, setDraft] = useState('');
  // 추가하려다 막힌 이유. 폼 검증 에러(error)보다 먼저 보여 줍니다.
  const [addError, setAddError] = useState<TodoFormErrorKey>();
  const shownError = addError ?? error;

  const updateDraft = (nextDraft: string) => {
    setDraft(nextDraft);
    onDraftChange?.(nextDraft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중의 Enter는 글자 확정이라 태그 추가로 보지 않습니다.
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
      return;
    }
    // 폼이 제출되지 않게 막습니다.
    event.preventDefault();

    const result = addTag(value, draft);
    if (!result.success) {
      setAddError(result.error);
      return;
    }
    setAddError(undefined);
    updateDraft('');
    if (result.tags !== value) {
      onChange(result.tags);
    }
  };

  const handleRemove = (index: number) => {
    setAddError(undefined);
    onChange(value.filter((_, tagIndex) => tagIndex !== index));
  };

  return (
    <FieldLayout
      label={t('tag')}
      htmlFor={inputId}
      errorId={errorId}
      errorMessage={getErrorMessage(shownError)}
    >
      <div
        className={cn(
          fieldBoxVariants({ isError: Boolean(shownError) }),
          'flex-wrap py-2.5 md:py-4',
        )}
      >
        {value.length > 0 && (
          <ul className="contents">
            {value.map((tag, index) => (
              <TagChip
                key={tag}
                label={tag}
                color={getTagColor(index)}
                removeLabel={t('form.removeTag', { tag })}
                onRemove={() => handleRemove(index)}
              />
            ))}
          </ul>
        )}
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => {
            updateDraft(event.target.value);
            setAddError(undefined);
          }}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={t('form.tagPlaceholder')}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? errorId : undefined}
          className={cn(FIELD_INNER_INPUT_CLASS, 'min-w-24')}
        />
      </div>
    </FieldLayout>
  );
};

export default TagInputField;
