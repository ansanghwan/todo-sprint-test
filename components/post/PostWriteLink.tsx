import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const PostWriteLink = () => {
  const t = useTranslations('Post');

  return (
    <Link
      href="/posts/write"
      className="fixed right-4 bottom-6 z-40 flex size-13 items-center justify-center gap-1 rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 motion-reduce:transition-none md:right-8 md:bottom-8 md:h-14 md:w-auto md:px-4.5 lg:right-16 lg:bottom-20"
    >
      <span aria-hidden className="material-symbols-rounded">
        add
      </span>
      <span className="sr-only text-lg font-semibold tracking-[-0.03em] md:not-sr-only">
        {t('writePost')}
      </span>
    </Link>
  );
};

export default PostWriteLink;
