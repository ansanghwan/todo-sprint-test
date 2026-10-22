'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import KebabMenu, {
  type KebabMenuItem,
} from '@/components/ui/kebab-menu/KebabMenu';
import { toast } from '@/components/ui/toast/Toaster';
import useDeleteComment from '@/hooks/post/useDeleteComment';
import type { ApiHttpCategory } from '@/lib/api/errors';

const DELETE_ERROR_KEYS: Record<ApiHttpCategory, string> = {
  unauthorized: 'deleteCommentError',
  forbidden: 'deleteCommentForbidden',
  notFound: 'commentAlreadyDeleted',
  conflict: 'deleteCommentError',
  other: 'deleteCommentError',
};

interface CommentActionsProps {
  postId: number;
  commentId: number;
  onEdit: () => void;
}

const CommentActions = ({ postId, commentId, onEdit }: CommentActionsProps) => {
  const t = useTranslations('Post');
  const { deleteComment, isDeleting } = useDeleteComment(postId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = () => {
    deleteComment(commentId, {
      onSuccess: () => setIsDeleteModalOpen(false),
      onError: ({ httpCategory }) => {
        setIsDeleteModalOpen(false);
        toast.error(t(DELETE_ERROR_KEYS[httpCategory]));
      },
    });
  };

  const menuItems: KebabMenuItem[] = [
    { label: t('edit'), onSelect: onEdit },
    { label: t('delete'), onSelect: () => setIsDeleteModalOpen(true) },
  ];

  return (
    <>
      <KebabMenu ariaLabel={t('commentMenu')} items={menuItems} />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title={t('deleteCommentConfirm')}
        description={t('deleteCommentWarning')}
        confirmLabel={t('confirmDelete')}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
};

export default CommentActions;
