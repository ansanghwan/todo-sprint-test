'use client';

import { useState } from 'react';
import useIsMe from '@/hooks/user/useIsMe';
import { formatUtcDateToYmd } from '@/lib/formatter';
import type { CommentDto } from '@/types/api/comment';
import CommentActions from './CommentActions';
import CommentEditForm from './CommentEditForm';
import WriterAvatar from './WriterAvatar';

interface CommentItemProps {
  postId: number;
  comment: Pick<CommentDto, 'id' | 'content' | 'createdAt' | 'writer'>;
}

const CommentItem = ({ postId, comment }: CommentItemProps) => {
  const { id, content, createdAt, writer } = comment;
  const isMine = useIsMe(writer.id);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <article className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted md:text-sm">
            <WriterAvatar image={writer.image} className="md:size-5" />
            <span className="truncate">{writer.name}</span>
          </div>
          {isMine && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              내 댓글
            </span>
          )}
        </div>
        {isMine && (
          <CommentActions
            postId={postId}
            commentId={id}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
      {isEditing ? (
        <CommentEditForm
          postId={postId}
          comment={comment}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm wrap-break-word whitespace-pre-wrap text-foreground md:text-base">
            {content}
          </p>
          <time dateTime={createdAt} className="text-xs text-subtle md:text-sm">
            {formatUtcDateToYmd(createdAt)}
          </time>
        </div>
      )}
    </article>
  );
};

export default CommentItem;
