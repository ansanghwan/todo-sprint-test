'use client';

import { DayPicker } from '@daypicker/react';
import { enUS, ko } from '@daypicker/react/locale';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import Button from '@/components/ui/button/Button';
import { parseDateString, toDateString } from '../dateString';

const DAY_PICKER_LOCALES = { ko, en: enUS };
const HALF_WIDTH_BUTTON_CLASS = 'min-w-0 flex-1 shrink';

interface DueDatePickerProps {
  /** 폼에 저장된 날짜 'YYYY-MM-DD'. 선택 전이면 빈 문자열 */
  value: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

/**
 * 날짜 선택 달력 (FN-TD-23). Figma Date picker (4:5013): 일요일 시작, 6주 고정
 * 달력에서 누른 날짜는 임시 선택이고, [확인]을 눌러야 폼에 반영됩니다.
 * 열릴 때마다 새로 만들어지므로 임시 선택은 항상 저장된 날짜에서 시작합니다.
 */
const DueDatePicker = ({ value, onConfirm, onCancel }: DueDatePickerProps) => {
  const t = useTranslations('Todo');
  const locale = useLocale();
  const [draft, setDraft] = useState(() => parseDateString(value));
  const captionFormat = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col gap-9">
      <DayPicker
        mode="single"
        required
        selected={draft}
        onSelect={setDraft}
        defaultMonth={draft}
        locale={
          DAY_PICKER_LOCALES[locale as keyof typeof DAY_PICKER_LOCALES] ?? ko
        }
        weekStartsOn={0}
        showOutsideDays
        fixedWeeks
        navLayout="around"
        formatters={{
          formatCaption: (month) => captionFormat.format(month),
        }}
        labels={{
          labelPrevious: () => t('form.previousMonth'),
          labelNext: () => t('form.nextMonth'),
        }}
        classNames={{
          month: 'relative',
          month_caption:
            'flex h-10 items-center justify-center text-sm/5 font-semibold text-grayscale-700',
          button_previous:
            'absolute top-0 left-0 flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange-600',
          button_next:
            'absolute top-0 right-0 flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-orange-600',
          chevron: 'size-5 fill-grayscale-500',
          month_grid: 'w-full border-collapse',
          weekday: 'size-10 text-sm/5 font-medium text-grayscale-700',
          day: 'size-10 p-0 text-center text-sm/5 text-grayscale-700',
          day_button:
            'size-10 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600',
          outside: 'text-grayscale-400',
          today: '[&:not([data-selected])>button]:bg-grayscale-50',
          selected: '[&>button]:bg-orange-500 [&>button]:text-white',
        }}
      />

      {/* 공용 Button은 w-full shrink-0이라 나란히 두면 각자 한 줄을 다 차지합니다. 절반씩 나누도록 덮어씁니다. */}
      <div className="flex gap-3">
        <Button
          variant="neutral"
          size="sm"
          className={HALF_WIDTH_BUTTON_CLASS}
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          size="sm"
          className={HALF_WIDTH_BUTTON_CLASS}
          disabled={!draft}
          onClick={() => {
            if (draft) {
              onConfirm(toDateString(draft));
            }
          }}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
};

export default DueDatePicker;
