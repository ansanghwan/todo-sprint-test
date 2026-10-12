'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import useTodoFormErrorMessage from '@/hooks/todo/useTodoFormErrorMessage';
import { FIELD_INNER_INPUT_CLASS, fieldBoxVariants } from '../fieldStyles';
import type { TodoFormErrorKey } from '../todoFormSchema';
import FieldLayout from './FieldLayout';

interface LinkFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: TodoFormErrorKey;
}

/** 링크 (FN-TD-25). 직접 입력하고 X로 지웁니다. 스킴 보완과 형식 검증은 스키마가 합니다. */
const LinkField = ({ value, onChange, onBlur, error }: LinkFieldProps) => {
  const t = useTranslations('Todo');
  const getErrorMessage = useTodoFormErrorMessage();
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <FieldLayout
      label={t('link')}
      htmlFor={inputId}
      errorId={errorId}
      errorMessage={getErrorMessage(error)}
    >
      <div
        className={fieldBoxVariants({
          tone: 'upload',
          isError: Boolean(error),
        })}
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[1.25rem] text-grayscale-500"
        >
          link
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={t('form.linkPlaceholder')}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={FIELD_INNER_INPUT_CLASS}
        />
        {value && (
          <button
            type="button"
            aria-label={t('form.removeLink')}
            onClick={() => onChange('')}
            className="flex rounded-full text-grayscale-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[1.25rem]"
            >
              close
            </span>
          </button>
        )}
      </div>
    </FieldLayout>
  );
};

export default LinkField;
