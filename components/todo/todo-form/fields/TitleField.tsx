'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import TextField from '@/components/ui/textfield/TextField';
import useTodoFormErrorMessage from '@/hooks/todo/useTodoFormErrorMessage';
import { cn } from '@/lib/utils';
import { fieldBoxVariants } from '../fieldStyles';
import type { TodoFormErrorKey } from '../todoFormSchema';
import FieldLayout from './FieldLayout';

interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: TodoFormErrorKey;
}

/**
 * 제목 (FN-TD-21). 공용 TextField의 크기·포커스·오류 색을 폼 시안 값으로 덮어씁니다.
 * TextField의 label·error를 쓰지 않고 라벨과 오류 문구, aria 속성을 여기서 직접 다룹니다.
 */
const TitleField = ({ value, onChange, onBlur, error }: TitleFieldProps) => {
  const t = useTranslations('Todo');
  const getErrorMessage = useTodoFormErrorMessage();
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <FieldLayout
      label={t('title')}
      htmlFor={inputId}
      isRequired
      errorId={errorId}
      errorMessage={getErrorMessage(error)}
    >
      <div className="w-full">
        <TextField
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={t('form.titlePlaceholder')}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldBoxVariants({ isError: Boolean(error) }),
            'h-11 py-0 focus:ring-0 md:h-14',
            // TextField의 파란 포커스 테두리가 오류 상태에 남지 않게 덮어씁니다.
            error && 'focus:border-danger',
          )}
        />
      </div>
    </FieldLayout>
  );
};

export default TitleField;
