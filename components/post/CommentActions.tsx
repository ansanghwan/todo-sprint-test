'use client';

import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import KebabMenu, {
  type KebabMenuItem,
} from '@/components/ui/kebab-menu/KebabMenu';
import { toast } from '@/components/ui/toast/Toaster';
import useDeleteComment from '@/hooks/post/useDeleteComment';
import type { ApiHttpCategory } from '@/lib/api/errors';

const DELETE_ERROR_MESSAGES: Record<ApiHttpCategory, string> = {
  forbidden: '댓글을 삭제할 권한이 없어요.',
  notFound: '이미 삭제된 댓글이에요.',
  other: '댓글을 삭제하지 못했어요.',
};

interface CommentActionsProps {
  postId: number;
  commentId: number;
  onEdit: () => void;
}

const CommentActions = ({ postId, commentId, onEdit }: CommentActionsProps) => {
  const { deleteComment, isDeleting } = useDeleteComment(postId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDelete = () => {
    deleteComment(commentId, {
      onSuccess: () => setIsDeleteModalOpen(false),
      onError: ({ httpCategory }) => {
        setIsDeleteModalOpen(false);
        toast.error(DELETE_ERROR_MESSAGES[httpCategory]);
      },
    });
  };

  const menuItems: KebabMenuItem[] = [
    { label: '수정하기', onSelect: onEdit },
    { label: '삭제하기', onSelect: () => setIsDeleteModalOpen(true) },
  ];

  return (
    <>
      <KebabMenu ariaLabel="댓글 메뉴" items={menuItems} />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="댓글을 삭제하시겠어요?"
        description="삭제된 댓글은 복구할 수 없어요."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
};

export default CommentActions;
