'use client';

import { useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import KebabMenu, {
  type KebabMenuItem,
} from '@/components/ui/kebab-menu/KebabMenu';
import { toast } from '@/components/ui/toast/Toaster';
import useDeletePost from '@/hooks/post/useDeletePost';
import useIsMe from '@/hooks/user/useIsMe';
import { useRouter } from '@/i18n/navigation';
import type { ApiHttpCategory } from '@/lib/api/errors';

const DELETE_ERROR_MESSAGES: Record<ApiHttpCategory, string> = {
  forbidden: '게시글을 삭제할 권한이 없어요.',
  notFound: '이미 삭제된 게시글이에요.',
  other: '게시글을 삭제하지 못했어요.',
};

interface PostActionsProps {
  postId: number;
  writerId: number;
}

const PostActions = ({ postId, writerId }: PostActionsProps) => {
  const router = useRouter();
  const isMine = useIsMe(writerId);
  const { deletePost, isDeleting } = useDeletePost();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!isMine) {
    return null;
  }

  const goToList = () => router.replace('/posts');

  const handleDelete = () => {
    deletePost(postId, {
      onSuccess: goToList,
      onError: ({ httpCategory }) => {
        setIsDeleteModalOpen(false);
        toast.error(DELETE_ERROR_MESSAGES[httpCategory]);
        if (httpCategory === 'notFound') {
          goToList();
        }
      },
    });
  };

  const menuItems: KebabMenuItem[] = [
    { label: '수정하기', onSelect: () => router.push(`/posts/${postId}/edit`) },
    { label: '삭제하기', onSelect: () => setIsDeleteModalOpen(true) },
  ];

  return (
    <>
      <KebabMenu ariaLabel="게시글 메뉴" items={menuItems} />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="게시글을 삭제하시겠어요?"
        description="삭제된 게시글은 복구할 수 없어요."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
};

export default PostActions;
