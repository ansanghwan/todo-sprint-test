'use client';

import Image from 'next/image';
import usePostDetail from '@/hooks/post/usePostDetail';
import { formatUtcDateToYmd } from '@/lib/formatter';
import PostActions from './PostActions';
import WriterAvatar from './WriterAvatar';

interface PostDetailProps {
  postId: number;
}

const PostDetail = ({ postId }: PostDetailProps) => {
  const { id, title, content, image, writer, createdAt, viewCount } =
    usePostDetail(postId);

  return (
    <article className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-6 border-b border-subtle pb-4 md:gap-4 md:pb-6">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="min-w-0 flex-1 text-base font-semibold wrap-break-word text-heading md:text-2xl">
                {title}
              </h2>
              <PostActions postId={id} writerId={writer.id} />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted md:gap-2 md:text-base md:font-medium">
              <WriterAvatar image={writer.image} />
              <span className="truncate">{writer.name}</span>
            </div>
          </header>
          <p className="text-sm wrap-break-word whitespace-pre-wrap text-foreground md:text-base">
            {content}
          </p>
        </div>
        {image && (
          <div className="relative size-37.5 overflow-hidden rounded-[1.25rem] border border-subtle md:size-58 md:rounded-3xl">
            <Image
              src={image}
              alt={`${title} 첨부 이미지`}
              fill
              sizes="(min-width: 46.5rem) 232px, 150px"
              className="object-cover"
            />
          </div>
        )}
      </div>
      <p className="flex items-center gap-0.5 text-xs text-subtle md:gap-1 md:text-sm">
        <time dateTime={createdAt}>{formatUtcDateToYmd(createdAt)}</time>
        <span>·</span>
        <span>조회 {viewCount}</span>
      </p>
    </article>
  );
};

export default PostDetail;
