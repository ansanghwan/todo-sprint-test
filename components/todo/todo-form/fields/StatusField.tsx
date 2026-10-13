'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { IconCheckboxActive, IconCheckboxInactive } from '@/components/icons';
import FieldLayout from './FieldLayout';

interface StatusFieldProps {
  /** 완료 여부. true면 DONE입니다. */
  value: boolean;
  onChange: (done: boolean) => void;
}

/**
 * 상태 (FN-TD-30). 수정 모달 맨 위에서 TO DO / DONE 중 하나를 고릅니다. Figma TaskForm 수정 상태 (4:5314)
 * 시안은 체크박스 모양이지만 둘 중 하나만 고르는 값이라 라디오로 만들어 키보드 방향키로도 바꿀 수 있게 합니다.
 */
const StatusField = ({ value, onChange }: StatusFieldProps) => {
  const t = useTranslations('Todo');
  const id = useId();
  const labelId = `${id}-label`;
  const options = [
    { label: t('toDo'), done: false },
    { label: t('done'), done: true },
  ];

  return (
    <FieldLayout
      label={t('status')}
      labelId={labelId}
      isRequired
      errorId={`${id}-error`}
    >
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-required="true"
        className="flex gap-2"
      >
        {options.map((option) => {
          const isChecked = value === option.done;
          const Icon = isChecked ? IconCheckboxActive : IconCheckboxInactive;

          return (
            <label
              key={option.label}
              className="flex w-19 cursor-pointer items-center gap-1.5 text-sm/5 font-medium tracking-[-0.03em] text-grayscale-500 md:text-base/6"
            >
              <input
                type="radio"
                name={id}
                checked={isChecked}
                onChange={() => onChange(option.done)}
                className="peer sr-only"
              />
              <Icon className="size-4.5 shrink-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-600" />
              {option.label}
            </label>
          );
        })}
      </div>
    </FieldLayout>
  );
};

export default StatusField;
