'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { todoQueries, type TodoListParams } from '@/queries/todo';

/**
 * 페이지 제목과 전체 개수. 모바일은 시안상 제목이 GNB에 들어가서 화면에서는 숨기고
 * 스크린리더용 제목만 남깁니다. 개수는 선택한 탭의 totalCount입니다.
 */
interface TodosHeaderProps {
  params: TodoListParams;
}

const TodosHeader = ({ params }: TodosHeaderProps) => {
  const t = useTranslations('Todo');
  const { data } = useInfiniteQuery(todoQueries.list(params));
  const totalCount = data?.pages[0]?.totalCount;

  return (
    <h1 className="sr-only text-xl/7.5 font-semibold tracking-[-0.03em] md:not-sr-only md:flex md:gap-2 md:px-2 lg:text-2xl/8">
      <span className="text-foreground">{t('allTodos')}</span>{' '}
      {totalCount !== undefined && (
        <span className="text-orange-600">{totalCount}</span>
      )}
    </h1>
  );
};

export default TodosHeader;
