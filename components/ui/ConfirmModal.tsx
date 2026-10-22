'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/button/Button';
import IcReport from '@/components/ui/icons/IcReport';

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  /** 제목 아래 주황 경고 문구. 없으면 줄 자체를 그리지 않습니다. */
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  /** 요청 중에는 버튼을 막고 ESC·바깥 클릭으로도 닫히지 않습니다. */
  isPending?: boolean;
}

/**
 * 삭제·닫기 같은 동작을 한 번 더 묻는 모달. Figma `popup` (4:9872)
 *
 * 시안에 X 버튼이 없어서 헤더 없는 Modal(sm)을 씁니다.
 * 닫기는 취소 버튼, ESC, 바깥 클릭으로 합니다.
 */
const ConfirmModal = ({
  isOpen,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  isPending = false,
}: ConfirmModalProps) => {
  const t = useTranslations('Common');
  const handleOpenChange = (nextIsOpen: boolean) => {
    if (isPending) {
      return;
    }
    onOpenChange(nextIsOpen);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      size="sm"
      hasHeader={false}
      srTitle={title}
    >
      <div className="flex flex-col gap-8 md:gap-10">
        <div className="flex flex-col items-center gap-1 text-center">
          {/* 스크린리더에는 Modal의 숨김 제목(srTitle)으로 읽히므로 중복을 막습니다. */}
          <p
            aria-hidden="true"
            className="text-sm/5 font-semibold tracking-[-0.03em] text-grayscale-800 md:text-xl/7.5"
          >
            {title}
          </p>
          {description && (
            <p className="flex items-center justify-center text-xs/4 font-medium text-orange-600 md:gap-1 md:text-base/6 md:tracking-[-0.03em]">
              <IcReport className="size-4.5 shrink-0 text-orange-500 md:size-5" />
              {description}
            </p>
          )}
        </div>

        <div className="flex gap-2 md:gap-3">
          <Button
            variant="neutral"
            size="lg"
            className="h-10 flex-1 text-sm"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="h-10 flex-1 text-sm"
            disabled={isPending}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
