'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import DeleteTodoModal from '@/components/todo/DeleteTodoModal';
import TodoItem from '@/components/todo/TodoItem';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import type { TodoNoteActions } from '@/components/todo/todoNoteActions';
import useTodoItemActions from '@/hooks/todo/useTodoItemActions';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import Button from '@/components/ui/button/Button';
import { toast } from '@/components/ui/toast/Toaster';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import useMediaQuery from '@/hooks/useMediaQuery';
import { todoQueries, type TodoListParams } from '@/queries/todo';
import type { TodoDto } from '@/types/api/todo';
import TodoListEmpty from './TodoListEmpty';

// globals.css의 --breakpoint-md(744px)와 같은 값입니다.
const TABLET_QUERY = '(min-width: 46.5rem)';

// 할 일 상세 모달(FN-TD-13)이 생기면 연결합니다.
const openDetailNotConnected = () => {};
// 노트 보기·작성(FN-TD-11, 12)은 노트 담당과 연결 방식을 확정한 뒤 noteActions로 받습니다.
const noteNotConnected = () => {};

interface TodoListProps {
  params: TodoListParams;
  noteActions?: TodoNoteActions;
}

/** 모든 할 일 목록 (FN-TD-01). 커서 기반 무한 스크롤, nextCursor가 null이면 멈춥니다. */
const TodoList = ({ params, noteActions }: TodoListProps) => {
  const {
    data,
    isPending,
    isError,
    errorUpdatedAt,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useInfiniteQuery(todoQueries.list(params));
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    // 다음 페이지가 있고 요청 중이 아닐 때만 감시합니다.
    // 다음 페이지 요청이 실패하면 자동 재요청이 반복되지 않도록 [다시 시도] 전까지 멈춥니다.
    enabled:
      Boolean(hasNextPage) && !isFetchingNextPage && !isFetchNextPageError,
    onIntersect: () => {
      // 요청 중 상태가 렌더에 반영되기 전에 다시 호출돼도 새 요청을 시작하지 않습니다.
      void fetchNextPage({ cancelRefetch: false });
    },
  });
  const isTablet = useMediaQuery(TABLET_QUERY);
  const actions = useTodoItemActions();
  const labels = useTodoItemLabels();
  const t = useTranslations('Todo');
  const [deleteTarget, setDeleteTarget] = useState<Pick<
    TodoDto,
    'id' | 'title'
  > | null>(null);

  useEffect(() => {
    if (isError) {
      toast.error(t('fetchTodosError'));
    }
  }, [isError, errorUpdatedAt, t]);

  if (isPending) {
    return (
      <p role="status" className="py-10 text-center text-sm text-grayscale-400">
        {t('loadingTodos')}
      </p>
    );
  }

  if (isError && !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <p className="text-sm text-grayscale-500">{t('fetchTodosError')}</p>
        <Button
          variant="neutral"
          size="sm"
          className="w-auto"
          onClick={() => refetch()}
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  const todos = data.pages.flatMap((page) => page.todos);

  // FN-TD-03: 조회 결과(서버 전체 개수)가 0개일 때만 빈 상태입니다. 탭마다 따로 판단합니다.
  // 불러온 항목이 모두 빠졌어도 남은 페이지가 있으면 아래 감시 요소로 이어서 불러옵니다.
  if (data.pages[0].totalCount === 0) {
    return <TodoListEmpty />;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            labels={labels}
            size={isTablet ? 'large' : 'small'}
            // FN-TD-01: 새 항목이 부드럽게 올라오는 애니메이션
            className="transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none starting:translate-y-2 starting:opacity-0"
            {...actions}
            onOpenDetail={openDetailNotConnected}
            onViewNote={noteActions?.onViewNote ?? noteNotConnected}
            onCreateNote={noteActions?.onCreateNote ?? noteNotConnected}
            kebabSlot={
              <TodoItemKebab
                onDelete={() =>
                  setDeleteTarget({ id: todo.id, title: todo.title })
                }
              />
            }
          />
        ))}
      </ul>
      <div ref={sentinelRef} aria-hidden="true" />
      {isFetchingNextPage && (
        <p
          role="status"
          className="pt-4 text-center text-sm text-grayscale-400"
        >
          {t('loadingMoreTodos')}
        </p>
      )}
      {isFetchNextPageError && (
        <div className="flex justify-center pt-4">
          <Button
            variant="neutral"
            size="sm"
            className="w-auto"
            onClick={() => fetchNextPage()}
          >
            {t('retry')}
          </Button>
        </div>
      )}
      <DeleteTodoModal
        todo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default TodoList;
