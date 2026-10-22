import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { PostDto } from '@/types/api/post';
import CommentCount from './CommentCount';
import WriterAvatar from './WriterAvatar';

export type BestPostCardData = Pick<
  PostDto,
  'title' | 'image' | 'writer' | 'viewCount' | 'commentCount'
>;

interface BestPostCardProps {
  post: BestPostCardData;
}

const BestPostCard = ({ post }: BestPostCardProps) => {
  const t = useTranslations('Post');
  const { title, image, writer, viewCount, commentCount } = post;

  return (
    <article className="flex w-65 shrink-0 flex-col gap-4 rounded-3xl bg-white-section px-6 py-4 shadow-md md:w-96 md:rounded-4xl md:p-8 lg:w-full">
      <div className="flex flex-col gap-3 md:gap-4">
        <h3 className="truncate text-base font-semibold text-heading md:text-xl md:whitespace-normal">
          {title}
        </h3>
        {image && (
          <div className="relative size-25 overflow-hidden rounded-2xl border border-subtle">
            <Image
              src={image}
              alt={t('imageAlt', { title })}
              fill
              sizes="100px"
              className="object-cover"
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted md:text-base">
        <div className="flex min-w-0 items-center gap-1 md:gap-2">
          <WriterAvatar image={writer.image} />
          <p className="truncate">
            {writer.name} · {t('views', { count: viewCount })}
          </p>
        </div>
        <CommentCount count={commentCount} />
      </div>
    </article>
  );
};

export default BestPostCard;
