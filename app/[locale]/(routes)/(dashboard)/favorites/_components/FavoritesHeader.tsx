'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { todoQueries } from '@/queries/todo';

/**
 * 페이지 제목과 개수 (FN-FV-02). 개수는 서버가 준 찜 전체 개수(totalCount)이며
 * 탭·목표 필터와 상관없이 같습니다. 모바일은 제목이 GNB에 있어 스크린리더용만 남깁니다.
 */
const FavoritesHeader = () => {
  const t = useTranslations('Todo');
  const { data } = useQuery(todoQueries.favorites());

  return (
    <h1 className="sr-only text-xl/7.5 font-semibold tracking-[-0.03em] md:not-sr-only md:flex md:gap-2 md:px-2 lg:text-2xl/8">
      <span className="text-foreground">{t('favoriteTodos')}</span>{' '}
      {data && <span className="text-orange-600">{data.totalCount}</span>}
    </h1>
  );
};

export default FavoritesHeader;
