import Image from 'next/image';
import type { PostDto } from '@/types/api/post';
import { formatDateToRelativeTime } from '@/lib/formatter';
import CommentCount from './CommentCount';
import WriterAvatar from './WriterAvatar';

export type PostListItemData = Pick<
  PostDto,
  | 'title'
  | 'content'
  | 'image'
  | 'writer'
  | 'createdAt'
  | 'viewCount'
  | 'commentCount'
>;

interface PostListItemProps {
  post: PostListItemData;
}

const PostListItem = ({ post }: PostListItemProps) => {
  const { title, content, image, writer, createdAt, viewCount, commentCount } =
    post;

  return (
    <article className="flex items-center gap-6 border-b border-subtle px-2 py-6 md:gap-8 md:px-4 md:py-10">
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-6.5">
        <div className="flex flex-col gap-1 text-sm md:gap-4 md:text-base">
          <h3 className="truncate font-semibold text-heading md:text-xl md:whitespace-normal">
            {title}
          </h3>
          <p className="truncate text-foreground md:line-clamp-2 md:whitespace-normal">
            {content}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted md:gap-2 md:text-base">
          <WriterAvatar image={writer.image} />
          <p className="flex min-w-0 items-center gap-0.5 md:gap-1">
            <span className="truncate">{writer.name}</span>
            <span>·</span>
            <time dateTime={createdAt} className="shrink-0">
              {formatDateToRelativeTime(createdAt)}
            </time>
            <span>·</span>
            <span className="shrink-0">조회 {viewCount}</span>
            <span>·</span>
            <CommentCount count={commentCount} />
          </p>
        </div>
      </div>
      {image && (
        <div className="relative size-18 shrink-0 overflow-hidden rounded-xl border border-subtle md:size-30 md:rounded-2xl">
          <Image
            src={image}
            alt={`${title} 첨부 이미지`}
            fill
            sizes="(min-width: 46.5rem) 120px, 72px"
            className="object-cover"
          />
        </div>
      )}
    </article>
  );
};

export default PostListItem;
