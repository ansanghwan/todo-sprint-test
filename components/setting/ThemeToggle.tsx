'use client';

import { useTranslations } from 'next-intl';
import { RadioGroup } from 'radix-ui';

export type ThemeMode = 'light' | 'dark';

const THEME_OPTIONS = [
  { mode: 'light', icon: 'light_mode' },
  { mode: 'dark', icon: 'dark_mode' },
] as const;

interface ThemeToggleProps {
  /** 이 버튼 묶음의 이름이 되는 제목 요소의 id */
  labelId: string;
  value: ThemeMode;
  onValueChange: (mode: ThemeMode) => void;
}

/** 해·달 아이콘 중 하나를 고르는 토글. 아이콘만 보이므로 버튼 이름은 aria-label로 붙입니다. */
export default function ThemeToggle({
  labelId,
  value,
  onValueChange,
}: ThemeToggleProps) {
  const t = useTranslations('Setting');

  return (
    <RadioGroup.Root
      aria-labelledby={labelId}
      orientation="horizontal"
      value={value}
      onValueChange={(next) => onValueChange(next as ThemeMode)}
      className="flex w-fit gap-1 rounded-full bg-grayscale-100 p-1"
    >
      {THEME_OPTIONS.map(({ mode, icon }) => (
        <RadioGroup.Item
          key={mode}
          value={mode}
          aria-label={t(mode)}
          className="flex h-8 w-16 cursor-pointer items-center justify-center rounded-full text-grayscale-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 data-[state=checked]:bg-white data-[state=checked]:text-grayscale-700 data-[state=checked]:shadow-sm motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[1.25rem]"
          >
            {icon}
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
