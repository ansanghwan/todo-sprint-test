'use client';

import { useTranslations } from 'next-intl';
import { DropdownMenu } from 'radix-ui';
import type { PostSortType } from '@/lib/api/post';

const SORT_LABEL_KEYS = {
  all: 'sortLatest',
  best: 'sortPopular',
} as const satisfies Record<PostSortType, string>;
const SORT_OPTIONS: PostSortType[] = ['all', 'best'];

interface PostSortDropdownProps {
  value: PostSortType;
  onChange: (value: PostSortType) => void;
}

const PostSortDropdown = ({ value, onChange }: PostSortDropdownProps) => {
  const t = useTranslations('Post');

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex cursor-pointer items-center gap-1 text-sm font-medium text-grayscale-600 md:pr-2 md:text-base">
        {t(SORT_LABEL_KEYS[value])}
        <span
          aria-hidden
          className="material-symbols-rounded text-xl leading-none"
        >
          filter_list
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-10 w-25.5 rounded-xl bg-white-section p-1.25 shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
        >
          <DropdownMenu.RadioGroup
            className="flex flex-col gap-2.5"
            value={value}
          >
            {SORT_OPTIONS.map((sort) => (
              <DropdownMenu.RadioItem
                key={sort}
                value={sort}
                onSelect={() => onChange(sort)}
                className="cursor-pointer rounded-lg px-1.5 py-0.75 text-sm font-medium text-foreground outline-none data-highlighted:bg-background"
              >
                {t(SORT_LABEL_KEYS[sort])}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default PostSortDropdown;
