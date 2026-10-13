'use client';

import { useTranslations } from 'next-intl';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/components/ui/toast/Toaster';
import { useDeleteNoteMutation } from '@/queries/notes';
import type { Note } from '@/types/api/note';

interface DeleteNoteModalProps {
  /** 삭제할 노트. null이면 닫힌 상태입니다. */
  note: Pick<Note, 'id' | 'title'> | null;
  onClose: () => void;
}

/** 노트 삭제 확인. 실패하면 토스트를 띄우고 모달은 열어 둬 다시 시도할 수 있게 합니다. */
export default function DeleteNoteModal({
  note,
  onClose,
}: DeleteNoteModalProps) {
  const t = useTranslations('Todo');
  const { mutate: deleteNote, isPending } = useDeleteNoteMutation();

  const handleConfirm = () => {
    if (!note) return;
    deleteNote(note.id, {
      onSuccess: onClose,
      onError: () => toast.error(t('deleteNoteError')),
    });
  };

  return (
    <ConfirmModal
      isOpen={note !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={t('deleteNoteConfirm')}
      description={t('deleteNoteWarning')}
      cancelLabel={t('cancel')}
      confirmLabel={t('confirm')}
      onConfirm={handleConfirm}
      isPending={isPending}
    />
  );
}
