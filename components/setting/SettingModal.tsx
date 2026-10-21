'use client';

import { useTranslations } from 'next-intl';

import SettingForm from '@/components/setting/SettingForm';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';

interface SettingModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SettingModal({
  isOpen,
  onOpenChange,
}: SettingModalProps) {
  const t = useTranslations('Setting');

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="sm"
      className={'bg-white-section'}
    >
      <ModalHeader>{t('title')}</ModalHeader>
      {/* 모달이 열릴 때마다 새로 그려지므로, 고르다가 취소한 값은 다음에 남지 않습니다. */}
      <SettingForm onClose={() => onOpenChange(false)} />
    </Modal>
  );
}
