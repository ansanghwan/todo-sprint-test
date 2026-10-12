'use client';

import { useTranslations } from 'next-intl';
import { Popover } from 'radix-ui';
import { useId, useState } from 'react';

import useTodoFormErrorMessage from '@/hooks/todo/useTodoFormErrorMessage';
import { cn } from '@/lib/utils';
import { fieldBoxVariants } from '../fieldStyles';
import type { TodoFormErrorKey } from '../todoFormSchema';
import { formatDueDateForDisplay } from '../todoFormValues';
import DueDatePicker from './DueDatePicker';
import FieldLayout from './FieldLayout';

interface DueDateFieldProps {
  /** 'YYYY-MM-DD'. 선택 전이면 빈 문자열 */
  value: string;
  onChange: (date: string) => void;
  onBlur?: () => void;
  error?: TodoFormErrorKey;
}

/**
 * 마감기한 (FN-TD-23). 필드를 누르면 아래에 달력이 열립니다.
 * 바깥 클릭·Esc로 닫으면 선택을 버리고 기존 값을 유지합니다. 포커스 이동과 닫기는 Radix Popover가 처리합니다.
 */
const DueDateField = ({
  value,
  onChange,
  onBlur,
  error,
}: DueDateFieldProps) => {
  const t = useTranslations('Todo');
  const getErrorMessage = useTodoFormErrorMessage();
  const triggerId = useId();
  const errorId = `${triggerId}-error`;
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) {
      onBlur?.();
    }
  };

  return (
    <FieldLayout
      label={t('dueDate')}
      htmlFor={triggerId}
      isRequired
      errorId={errorId}
      errorMessage={getErrorMessage(error)}
    >
      <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          id={triggerId}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldBoxVariants({ isError: Boolean(error) }),
            'text-left',
            !value && 'text-grayscale-500',
          )}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[1.25rem] text-grayscale-500"
          >
            calendar_today
          </span>
          {value
            ? formatDueDateForDisplay(value)
            : t('form.dueDatePlaceholder')}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            collisionPadding={16}
            className="z-50 w-82 max-w-(--radix-popover-content-available-width) rounded-2xl bg-white p-6 shadow-md outline-none"
          >
            <DueDatePicker
              value={value}
              onConfirm={(date) => {
                onChange(date);
                handleOpenChange(false);
              }}
              onCancel={() => handleOpenChange(false)}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </FieldLayout>
  );
};

export default DueDateField;
