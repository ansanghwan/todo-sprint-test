'use client';

import { DropdownMenu } from 'radix-ui';

import { IconKebab, IconKebabWhite } from '@/components/icons';

export interface KebabMenuItem {
  label: string;
  onSelect: () => void;
}

interface KebabMenuProps {
  /** 메뉴 항목. 할 일·목표·게시판마다 달라서 밖에서 주입합니다. */
  items: KebabMenuItem[];
  /** 어두운 배경(todo_white)용 흰 아이콘 */
  isWhite?: boolean;
  ariaLabel?: string;
}

/**
 * 케밥(⋮) 버튼과 작은 드롭다운. Figma `dropdown size=small` (4:9076)
 *
 * 바깥 클릭·ESC 닫기, 화면 경계 충돌 시 위치 보정, 방향키 이동은
 * Radix DropdownMenu가 처리합니다.
 */
const KebabMenu = ({
  items,
  isWhite = false,
  ariaLabel = '더보기',
}: KebabMenuProps) => {
  const KebabIcon = isWhite ? IconKebabWhite : IconKebab;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={ariaLabel}
        className="flex size-6 shrink-0 items-center justify-center rounded-sm leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
      >
        <KebabIcon className="block size-6 shrink-0" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={16}
          className="z-50 w-25.5 overflow-hidden rounded-xl bg-white shadow-[0_0.25rem_0.5rem_rgba(0,0,0,0.1)]"
        >
          {items.map(({ label, onSelect }) => (
            <DropdownMenu.Item
              key={label}
              onSelect={onSelect}
              className="group cursor-pointer p-1.25 outline-none"
            >
              <span className="block rounded-lg px-1.5 py-0.75 text-sm/5 font-medium tracking-[-0.03em] text-grayscale-700 group-data-highlighted:bg-orange-alpha-20">
                {label}
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default KebabMenu;
