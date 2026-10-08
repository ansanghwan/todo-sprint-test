'use client';

import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useState } from 'react';

import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DeleteTodoModal from '@/components/todo/DeleteTodoModal';
import TodoItem from '@/components/todo/TodoItem';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import Button from '@/components/ui/button/Button';
import useMediaQuery from '@/hooks/useMediaQuery';
import useTodoItemActions from '@/hooks/todo/useTodoItemActions';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import { useRouter } from '@/i18n/navigation';
import type { TodoDto, TodoPageDto } from '@/types/api/todo';

interface GoalTodoListProps {
  query: UseInfiniteQueryResult<InfiniteData<TodoPageDto>, Error>;
  goalId: number;
}

/** 조회는 부모에서 공유하고, 목록 표시와 더보기·빈 상태를 담당합니다. */
export default function GoalTodoList({ query, goalId }: GoalTodoListProps) {
  const actions = useTodoItemActions();
  const labels = useTodoItemLabels();
  const isTablet = useMediaQuery('(min-width: 46.5rem)');
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Pick<
    TodoDto,
    'id' | 'title'
  > | null>(null);

  if (query.isPending)
    return (
      <DashboardLoading
        message="할 일을 불러오는 중입니다."
        color="foreground"
        className="min-h-26 md:flex-1"
      />
    );
  if (!query.data)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 md:flex-1">
        <p role="alert">할 일을 불러오지 못했습니다.</p>
        <Button
          variant="neutral"
          size="sm"
          className="w-auto"
          onClick={() => void query.refetch()}
        >
          다시 시도
        </Button>
      </div>
    );

  // 더보기로 받은 페이지들을 합쳐 표시합니다. 진행률은 부모에서 totalCount로 계산합니다.
  const todos = query.data.pages.flatMap((page) => page.todos);
  return (
    <div className="md:flex md:max-h-[calc(36rem-2rem)] md:min-h-0 md:flex-1 md:flex-col lg:max-h-[calc(36rem-3rem)]">
      {/* 최대 576px에서 카드 패딩을 제외하고, 목록과 하단 버튼에 공간을 배분합니다. */}
      <div className="max-h-69 scrollbar-thin overflow-y-auto md:max-h-none md:min-h-0 md:flex-1">
        {query.data.pages[0]?.totalCount === 0 ? (
          <div className="py-6">
            <DashboardEmptyState message="등록된 할 일이 없어요" />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                labels={labels}
                size={isTablet ? 'large' : 'small'}
                {...actions}
                // 할 일 상세 열기는 기존 다른 목록과 같이 별도 연동 단계에서 연결합니다.
                onOpenDetail={() => {}}
                onCreateNote={(todoId) =>
                  router.push(`/notes/note/write?todoId=${todoId}`)
                }
                onViewNote={() => router.push(`/notes?goalId=${goalId}`)}
                kebabSlot={
                  <TodoItemKebab onDelete={() => setDeleteTarget(todo)} />
                }
              />
            ))}
          </ul>
        )}
        {query.isError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {query.isFetchNextPageError
              ? '추가 목록을 불러오지 못했습니다. 다시 시도해주세요.'
              : '목록 갱신에 실패했습니다.'}
          </p>
        )}
      </div>
      {(query.hasNextPage || query.isError) && (
        <div className="mt-4 flex shrink-0 justify-center">
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-4 text-sm font-medium text-orange-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
            aria-busy={query.isFetching}
            aria-label={query.isError ? '목록 다시 시도' : '할 일 더보기'}
            disabled={query.isFetching}
            onClick={() => {
              if (query.isError && !query.isFetchNextPageError)
                void query.refetch();
              else void query.fetchNextPage({ cancelRefetch: false });
            }}
          >
            {query.isFetching
              ? '불러오는 중…'
              : query.isError
                ? '다시 시도'
                : '더보기'}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="size-6 shrink-0"
            >
              <path
                d="M17.293 9.29289C17.6835 8.90237 18.3165 8.90237 18.707 9.29289C19.0975 9.68342 19.0975 10.3164 18.707 10.707L12.707 16.707C12.3165 17.0975 11.6835 17.0975 11.293 16.707L5.29295 10.707C4.90243 10.3164 4.90243 9.68342 5.29295 9.29289C5.68348 8.90237 6.31649 8.90237 6.70702 9.29289L12 14.5859L17.293 9.29289Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      )}
      <DeleteTodoModal
        todo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
