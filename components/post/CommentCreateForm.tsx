'use client';

import { useTranslations } from 'next-intl';
import { useState, type SubmitEvent } from 'react';
import Button from '@/components/ui/button/Button';
import { toast } from '@/components/ui/toast/Toaster';
import useCreateComment from '@/hooks/post/useCreateComment';
import CommentInput from './CommentInput';

interface CommentCreateFormProps {
  postId: number;
}

const CommentCreateForm = ({ postId }: CommentCreateFormProps) => {
  const t = useTranslations('Post');
  const [content, setContent] = useState('');
  const { createComment, isCreating } = useCreateComment(postId);
  const trimmedContent = content.trim();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    createComment(trimmedContent, {
      onSuccess: () => setContent(''),
      onError: () => toast.error(t('createCommentError')),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 md:gap-4">
      <CommentInput
        value={content}
        onChange={(event) => setContent(event.target.value)}
        aria-label={t('commentInput')}
        placeholder={t('commentPlaceholder')}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={!trimmedContent || isCreating}
        className="w-16 px-0 md:w-20"
      >
        {t('submit')}
      </Button>
    </form>
  );
};

export default CommentCreateForm;
