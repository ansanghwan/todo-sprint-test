'use client';

import { Select } from 'radix-ui';

import { routing } from '@/i18n/routing';

export type AppLocale = (typeof routing.locales)[number];

/** 언어 이름은 번역하지 않습니다. 영어 화면에서도 "한국어"를 찾을 수 있어야 합니다. */
const LANGUAGE_LABELS: Record<AppLocale, string> = {
  ko: '한국어',
  en: 'English',
};

interface LanguageSelectProps {
  /** 이 선택 상자의 이름이 되는 제목 요소의 id */
  labelId: string;
  value: AppLocale;
  onValueChange: (locale: AppLocale) => void;
}

/** 열기·닫기, 방향키 이동, Enter 선택은 Radix Select가 처리합니다. */
export default function LanguageSelect({
  labelId,
  value,
  onValueChange,
}: LanguageSelectProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => onValueChange(next as AppLocale)}
    >
      <Select.Trigger
        aria-labelledby={labelId}
        className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input-border bg-input px-3 text-sm/5 text-foreground outline-none focus-visible:border-orange-500 data-[state=open]:border-orange-500"
      >
        <Select.Value />
        <Select.Icon
          aria-hidden="true"
          className="material-symbols-outlined text-[1.5rem] text-grayscale-500"
        >
          keyboard_arrow_down
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 w-(--radix-select-trigger-width) overflow-hidden rounded-2xl bg-white-section shadow-md"
        >
          <Select.Viewport>
            {routing.locales.map((locale) => (
              <Select.Item
                key={locale}
                value={locale}
                className="group cursor-pointer p-1.5 outline-none"
              >
                <span className="block rounded-xl p-2 text-sm/5 font-medium text-foreground group-data-highlighted:bg-orange-200 group-data-highlighted:text-orange-600">
                  <Select.ItemText>{LANGUAGE_LABELS[locale]}</Select.ItemText>
                </span>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
