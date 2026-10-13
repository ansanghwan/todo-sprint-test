'use client';

import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import IcDelete from '@/components/ui/icons/IcDelete';

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
  /** X 왼쪽에 둘 버튼 (예: 케밥 메뉴). 없으면 X만 그립니다. */
  actions?: ReactNode;
}

/**
 * 모달 상단의 제목 + 우상단 X 한 줄. Modal 안에서만 씁니다.
 *
 * children이 곧 제목이라 뱃지 같은 걸 같이 넣어도 됩니다.
 *   <ModalHeader>할 일 상세 <Chips>TO DO</Chips></ModalHeader>
 *
 * justify-between이라 제목이 길어지면 X를 밀어낼 뿐 겹치지 않습니다.
 */
const ModalHeader = ({ children, className, actions }: ModalHeaderProps) => {
  const closeButton = (
    <Dialog.Close
      aria-label="닫기"
      className="shrink-0 text-grayscale-400 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <IcDelete className="size-6" />
    </Dialog.Close>
  );

  return (
    <div className={cn('flex w-full items-center justify-between', className)}>
      <Dialog.Title className="flex items-center gap-2 text-xl/7.5 font-semibold tracking-[-0.03em] text-grayscale-800">
        {children}
      </Dialog.Title>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {closeButton}
        </div>
      ) : (
        closeButton
      )}
    </div>
  );
};

export default ModalHeader;
