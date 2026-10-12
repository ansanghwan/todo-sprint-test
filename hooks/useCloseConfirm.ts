import { useState } from 'react';

interface UseCloseConfirmOptions {
  /** true면 닫기 전에 확인창을 띄웁니다. 닫으려는 순간의 상태로 판단합니다. */
  shouldConfirm: () => boolean;
  /** true인 동안에는 닫기 요청을 무시합니다 (예: 제출 중). */
  isBlocked: boolean;
  /** 실제로 닫을 때 실행합니다. */
  onClose: () => void;
}

/**
 * 작성 중인 모달을 닫을 때 확인을 거치게 합니다 (FN-TD-20).
 * X·취소·Esc·바깥 클릭은 모두 requestClose로 모읍니다.
 */
const useCloseConfirm = ({
  shouldConfirm,
  isBlocked,
  onClose,
}: UseCloseConfirmOptions) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const requestClose = () => {
    if (isBlocked) {
      return;
    }
    if (shouldConfirm()) {
      setIsConfirmOpen(true);
      return;
    }
    onClose();
  };

  const confirmClose = () => {
    setIsConfirmOpen(false);
    onClose();
  };

  return { isConfirmOpen, setIsConfirmOpen, requestClose, confirmClose };
};

export default useCloseConfirm;
