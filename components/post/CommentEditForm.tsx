'use client';

import { useState, type SubmitEvent } from 'react';
import Button from '@/components/ui/button/Button';
import { toast } from '@/components/ui/toast/Toaster';
import useUpdateComment from '@/hooks/post/useUpdateComment';
import type { ApiHttpCategory } from '@/lib/api/errors';
import { formatUtcDateToYmd } from '@/lib/formatter';
import type { CommentDto } from '@/types/api/comment';
import CommentInput from './CommentInput';

const UPDATE_ERROR_MESSAGES: Record<ApiHttpCategory, string> = {
  forbidden: '댓글을 수정할 권한이 없어요.',
  notFound: '이미 삭제된 댓글이에요.',
  other: '댓글을 수정하지 못했어요.',
};

interface CommentEditFormProps {
  postId: number;
  comment: Pick<CommentDto, 'id' | 'content' | 'createdAt'>;
  onClose: () => void;
}

const CommentEditForm = ({
  postId,
  comment,
  onClose,
}: CommentEditFormProps) => {
  const [content, setContent] = useState(comment.content);
  const { updateComment, isUpdating } = useUpdateComment(postId);
  const trimmedContent = content.trim();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateComment(
      { commentId: comment.id, content: trimmedContent },
      {
        onSuccess: onClose,
        onError: ({ httpCategory }) =>
          toast.error(UPDATE_ERROR_MESSAGES[httpCategory]),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <CommentInput
        size="sm"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        aria-label="댓글 수정"
      />
      <div className="flex items-center justify-between gap-2">
        <time
          dateTime={comment.createdAt}
          className="text-xs text-subtle md:text-sm"
        >
          {formatUtcDateToYmd(comment.createdAt)}
        </time>
        <div className="flex gap-2">
          <Button
            variant="neutral"
            size="sm"
            className="w-16 px-0"
            disabled={isUpdating}
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="submit"
            size="sm"
            className="w-16 px-0"
            disabled={!trimmedContent || isUpdating}
          >
            수정
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CommentEditForm;
