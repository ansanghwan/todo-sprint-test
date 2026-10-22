import { useTranslations } from 'next-intl';

interface CommentCountProps {
  count: number;
}

const CommentCount = ({ count }: CommentCountProps) => {
  const t = useTranslations('Post');

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <span
        aria-hidden
        className="material-symbols-rounded text-base leading-none text-grayscale-600"
      >
        chat_bubble
      </span>
      <span className="sr-only">{t('comments')}</span>
      {count}
    </span>
  );
};

export default CommentCount;
