'use client';

import { useTranslations } from 'next-intl';
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

const DELETE_ERROR_KEYS: Record<ApiHttpCategory, string> = {
  unauthorized: 'deletePostError',
  forbidden: 'deletePostForbidden',
  notFound: 'postAlreadyDeleted',
  conflict: 'deletePostError',
  other: 'deletePostError',
};

interface PostActionsProps {
  postId: number;
  writerId: number;
}

const PostActions = ({ postId, writerId }: PostActionsProps) => {
  const router = useRouter();
  const t = useTranslations('Post');
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
        toast.error(t(DELETE_ERROR_KEYS[httpCategory]));
        if (httpCategory === 'notFound') {
          goToList();
        }
      },
    });
  };

  const menuItems: KebabMenuItem[] = [
    {
      label: t('edit'),
      onSelect: () => router.push(`/posts/edit?postId=${postId}`),
    },
    { label: t('delete'), onSelect: () => setIsDeleteModalOpen(true) },
  ];

  return (
    <>
      <KebabMenu ariaLabel={t('postMenu')} items={menuItems} />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title={t('deletePostConfirm')}
        description={t('deletePostWarning')}
        confirmLabel={t('confirmDelete')}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </>
  );
};

export default PostActions;
