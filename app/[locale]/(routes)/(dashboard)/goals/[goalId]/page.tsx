'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import TodoCreateModal from '@/components/todo/todo-create/TodoCreateModal';
import useCurrentUser from '@/hooks/useCurrentUser';
import useGoalDetailLoadMeasurement from '@/hooks/useGoalDetailLoadMeasurement';
import { useParams } from 'next/navigation';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { todoQueries } from '@/queries/todo';
import { goalQueries } from '@/queries/goal';
import { calculateProgress } from '@/lib/calculateProgress';
import { Link } from '@/i18n/navigation';
import ProgressChart from '@/components/dashboard/ProgressChart';
import GoalTitleCard from '@/components/goal/GoalTitleCard';
import GoalDetailSkeleton from '@/components/goal/GoalDetailSkeleton';
import { GoalTodoSkeletonRows } from '@/components/goal/GoalDetailSkeleton';
import TodoItem from '@/components/todo/TodoItem';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import DeleteTodoModal from '@/components/todo/DeleteTodoModal';
import TodoEditModal from '@/components/todo/todo-edit/TodoEditModal';
import TodoDetailModal from '@/components/todo/todo-detail/TodoDetailModal';
import NoteDetailDrawer from '@/components/note/note-detail/NoteDetailDrawer';
import useMediaQuery from '@/hooks/useMediaQuery';
import useTodoItemActions from '@/hooks/todo/useTodoItemActions';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import { useRouter } from '@/i18n/navigation';
import type { TodoDto } from '@/types/api/todo';
import Image from 'next/image';
import Button from '@/components/ui/button/Button';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
// 대시보드와 같은 행 강조와 케밥 버튼 배경을 사용합니다. 키보드 포커스도 함께 처리합니다.
const goalTodoItemClass =
  'group/goal-todo rounded-lg transition-colors hover:bg-orange-alpha-20 focus-within:bg-orange-alpha-20 hover:[&>button:nth-of-type(2)]:text-orange-600 focus-within:[&>button:nth-of-type(2)]:text-orange-600';
const goalTodoKebabClass =
  'flex shrink-0 rounded-full transition-colors group-hover/goal-todo:bg-white group-focus-within/goal-todo:bg-white [&>button]:size-6 [&>button]:rounded-full [&>button[data-state=open]]:bg-white [&_svg>circle:first-child]:fill-transparent';

export default function GoalDetailPage() {
  const isKorean = useLocale() === 'ko';
  const nextIntlTodo = useTranslations('Todo');
  const nextIntlGoalDetail = useTranslations('GoalDetail');
  const nextIntlDashboard = useTranslations('Dashboard');
  const actions = useTodoItemActions();
  const labels = useTodoItemLabels();
  const isTablet = useMediaQuery('(min-width: 46.5rem)');
  const router = useRouter();
  const [detailTodoId, setDetailTodoId] = useState<number | null>(null);
  const [noteId, setNoteId] = useState<number | null>(null);
  const [editTodoId, setEditTodoId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pick<
    TodoDto,
    'id' | 'title'
  > | null>(null);
  const goalSecTitle = 'text-base font-semibold text-heading md:text-lg';
  const { userName } = useCurrentUser();
  const [isTodoCreateOpen, setIsTodoCreateOpen] = useState(false);

  const { goalId } = useParams<{ goalId: string }>();
  const id = Number(goalId);

  const {
    data: goal,
    isPending,
    isError,
  } = useQuery({
    ...goalQueries.detail(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  // 현재 목표의 미완료·완료 목록을 10개씩 조회합니다. 다음 페이지는 각 목록의 더보기 버튼으로 조회합니다.
  const todoQuery = useInfiniteQuery({
    ...todoQueries.list({
      goalId: id,
      done: 'false',
      limit: 10,
      sort: 'latest',
    }),
    enabled: Number.isInteger(id) && id > 0,
  });

  const doneQuery = useInfiniteQuery({
    ...todoQueries.list({
      goalId: id,
      done: 'true',
      limit: 10,
      sort: 'latest',
    }),
    enabled: Number.isInteger(id) && id > 0,
  });

  // 조회 조건·캐시·로딩 UI는 바꾸지 않고 첫 성공 화면의 표시 시간만 기록합니다.
  useGoalDetailLoadMeasurement(
    Number.isInteger(id) &&
      id > 0 &&
      !!goal &&
      !isPending &&
      todoQuery.isSuccess &&
      doneQuery.isSuccess,
    isError || todoQuery.isError || doneQuery.isError,
  );

  // 더보기로 받아온 페이지를 합쳐 각 목록에 표시합니다.
  const todoItems = todoQuery.data?.pages.flatMap((page) => page.todos) ?? [];
  const doneItems = doneQuery.data?.pages.flatMap((page) => page.todos) ?? [];

  // 더보기로 받은 배열 길이가 아닌 서버의 전체 개수를 사용해, 펼친 항목 수가 진행률에 영향을 주지 않게 합니다.
  const todoCount = todoQuery.data?.pages[0]?.totalCount;
  const doneCount = doneQuery.data?.pages[0]?.totalCount;

  // 두 개수가 준비되기 전에는 undefined로 두어, 조회 중인 상태를 실제 0%와 구분합니다.
  // 목록 응답을 재사용하므로 진행률 계산을 위한 추가 API 요청은 없습니다.
  const progress =
    todoCount !== undefined && doneCount !== undefined
      ? calculateProgress(todoCount + doneCount, doneCount)
      : undefined;

  if (!Number.isInteger(id) || id <= 0) {
    return <p role="alert">{nextIntlGoalDetail('invalidAddress')}</p>;
  }

  // 최초 조회에만 표시하고, 갱신 중에는 기존 콘텐츠를 유지합니다.
  if (isPending || (!isError && (todoQuery.isPending || doneQuery.isPending))) {
    return <GoalDetailSkeleton />;
  }

  if (isError || !goal) {
    return <DashboardEmptyState message={nextIntlTodo('fetchGoalsError')} />;
  }

  return (
    // 이곳에 꼭 해당 컨텐츠 영역의 width를 추가해주세요
    <div className="lg:mx-auto lg:w-full lg:max-w-328">
      {/* 컨텐츠 마크업은 여기서 부터 */}
      <div>
        <h1 className="mb-7.5 text-xl font-semibold text-heading max-md:hidden lg:mb-8.5 lg:text-2xl">
          {userName
            ? nextIntlTodo('myGoals', { name: userName })
            : nextIntlTodo('goal')}
        </h1>
      </div>
      {/* 사이드바가 펼쳐진 중간 PC 폭에서는 제목과 카드 묶음을 각각 한 줄로 배치합니다. */}
      <div className="max-md:space-y-4 md:grid md:gap-6 lg:gap-8 xl:grid-cols-2 lg:max-[93.75rem]:[aside[data-open=false]~main_&]:grid-cols-1">
        <GoalTitleCard key={goal.id} goal={goal} />
        <div className="min-w-0">
          <div className="gap-6 md:grid md:grid-cols-2 md:gap-5">
            <div className="relative isolate flex aspect-343/160 min-w-0 items-end overflow-hidden rounded-[1.75rem] bg-orange-500 text-white shadow-[0_0.625rem_2.5rem_0_#FF9E594D] max-md:mb-4 md:aspect-auto md:h-40 md:rounded-4xl md:pb-8.75">
              {/* 조회 실패·로딩을 먼저 처리하고, 숫자가 준비됐을 때만 차트와 퍼센트를 표시합니다. */}
              {todoQuery.isError || doneQuery.isError ? (
                <p
                  role="alert"
                  className="absolute inset-0 flex items-center justify-center p-6 text-center text-white"
                >
                  {nextIntlDashboard('fetchProgressError')}
                </p>
              ) : progress === undefined ? (
                <DashboardLoading
                  message={nextIntlDashboard('loadingProgress')}
                  className="absolute inset-0"
                />
              ) : (
                <div className="absolute top-1/2 left-0 z-10 flex w-full -translate-y-1/2 items-center gap-7.5 px-6">
                  <ProgressChart
                    progress={progress}
                    trackColor="var(--color-orange-400)"
                    strokeWidth={16}
                    className="aspect-square w-[calc((100%+2.5rem)*0.268222)] shrink-0 md:size-23"
                  />
                  <div className="min-w-0 text-white">
                    <p className="text-lg font-bold">
                      {nextIntlTodo('goalProgress')}
                    </p>
                    <p className="flex items-baseline">
                      <span className="text-display-lg leading-none font-bold">
                        {progress}
                      </span>
                      <span className="ml-1 text-xl leading-none font-semibold">
                        %
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Link
              href={`/notes?goalId=${id}`}
              className="relative isolate flex aspect-343/160 min-w-0 items-end overflow-hidden rounded-[1.75rem] bg-blue-200 pb-8 pl-10 text-white shadow-[0_0.625rem_2.5rem_0_#00D4BE3D] before:pointer-events-none before:absolute before:top-1/2 before:right-4.5 before:aspect-square before:w-[30%] before:-translate-y-1/2 before:bg-[url('/images/goal/img_note.png')] before:bg-contain before:bg-center before:bg-no-repeat before:opacity-45 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 md:aspect-auto md:h-40 md:rounded-4xl md:pb-8.75 md:before:size-24.25"
            >
              <span className="relative z-10 inline-flex items-center gap-1.5 text-2xl font-bold">
                {nextIntlTodo('notes')}
                <Image
                  src="/icons/icon_arrow_right.svg"
                  width={8}
                  height={14}
                  alt=""
                  className="h-3.5 w-2 shrink-0"
                />
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-16 lg:flex lg:flex-wrap lg:gap-8">
        <div className="flex-1 lg:flex lg:min-w-0 lg:flex-col">
          <div className="mb-2.5 flex flex-wrap items-center">
            <div className="mr-auto flex-1">
              <h3 className={goalSecTitle}>TO DO</h3>
            </div>
            <div className="ml-auto">
              <Link
                href={`/calendar?goalId=${id}`}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full border border-[#ccc] px-4 text-sm leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-grayscale-500 transition-colors hover:border-[#bbb] hover:text-grayscale-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600',
                  isKorean ? 'w-30' : 'w-auto',
                )}
              >
                <Image
                  src="/icons/icon_calendar.svg"
                  width={20}
                  height={20}
                  alt=""
                />
                {nextIntlTodo('calendarView')}
              </Link>
              <Button
                size="sm"
                className={cn(
                  'ml-2 gap-1 tracking-[-0.03em] whitespace-nowrap',
                  isKorean ? 'w-30' : 'w-auto px-4',
                )}
                onClick={() => setIsTodoCreateOpen(true)}
              >
                <Image
                  src="/icons/icon_plus_white.svg"
                  width={20}
                  height={20}
                  alt=""
                />
                {nextIntlTodo('addTodo')}
              </Button>
            </div>
          </div>

          <div className="relative min-h-34 rounded-2xl bg-[#fff6df] p-4 md:flex md:max-h-144 md:flex-col lg:flex-1 lg:p-6">
            {todoQuery.isPending ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">{nextIntlTodo('loadingTodos')}</span>
                <GoalTodoSkeletonRows />
              </div>
            ) : !todoQuery.data ? (
              <div className="flex items-center justify-center py-6 md:flex-1">
                <p role="alert">{nextIntlTodo('fetchTodosError')}</p>
              </div>
            ) : (
              <div className="md:flex md:max-h-136 md:min-h-0 md:flex-1 md:flex-col lg:max-h-132">
                {/* 최대 576px에서 카드 패딩을 제외하고, 목록과 하단 버튼에 공간을 배분합니다. */}
                <div className="max-h-69 scrollbar-thin overflow-y-auto md:max-h-none md:min-h-0 md:flex-1">
                  {todoQuery.data.pages[0]?.totalCount === 0 ? (
                    <div className="py-6">
                      <DashboardEmptyState
                        message={nextIntlTodo('noTodos')}
                        imageSrc="/images/dashboard/img_result_none02.svg"
                      />
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {todoItems.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          labels={labels}
                          size={isTablet ? 'large' : 'small'}
                          className={goalTodoItemClass}
                          {...actions}
                          onOpenDetail={setDetailTodoId}
                          onCreateNote={(todoId) =>
                            router.push(`/notes/write?todoId=${todoId}`)
                          }
                          // FN-TD-11: 그 할 일의 노트(noteIds[0])를 노트 상세로 엽니다.
                          onViewNote={setNoteId}
                          kebabSlot={
                            <span className={goalTodoKebabClass}>
                              <TodoItemKebab
                                onEdit={() => setEditTodoId(todo.id)}
                                isWhite
                                onDelete={() => setDeleteTarget(todo)}
                              />
                            </span>
                          }
                        />
                      ))}
                    </ul>
                  )}
                  {todoQuery.isError && (
                    <p role="alert" className="mt-3 text-sm text-danger">
                      {todoQuery.isFetchNextPageError
                        ? nextIntlGoalDetail('loadMoreError')
                        : nextIntlGoalDetail('refreshError')}
                    </p>
                  )}
                </div>
                {(todoQuery.hasNextPage || todoQuery.isError) && (
                  <div className="mt-4 flex shrink-0 justify-center">
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-4 text-sm font-medium text-orange-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                      aria-busy={todoQuery.isFetching}
                      aria-label={
                        todoQuery.isError
                          ? nextIntlGoalDetail('retryList')
                          : nextIntlGoalDetail('loadMoreTodos')
                      }
                      disabled={todoQuery.isFetching}
                      onClick={() => {
                        if (
                          todoQuery.isError &&
                          !todoQuery.isFetchNextPageError
                        )
                          void todoQuery.refetch();
                        else
                          void todoQuery.fetchNextPage({
                            cancelRefetch: false,
                          });
                      }}
                    >
                      {todoQuery.isFetching
                        ? nextIntlDashboard('loading')
                        : todoQuery.isError
                          ? nextIntlTodo('retry')
                          : nextIntlDashboard('more')}
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
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 lg:flex lg:min-w-0 lg:flex-col">
          <div className="mb-2.5 md:flex md:h-10 md:items-center">
            <h3 className={goalSecTitle}>DONE</h3>
          </div>
          <div className="relative min-h-34 rounded-2xl bg-white-section p-4 md:flex md:max-h-144 md:flex-col lg:flex-1 lg:p-6">
            {doneQuery.isPending ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">{nextIntlTodo('loadingTodos')}</span>
                <GoalTodoSkeletonRows />
              </div>
            ) : !doneQuery.data ? (
              <div className="flex items-center justify-center py-6 md:flex-1">
                <p role="alert">{nextIntlTodo('fetchTodosError')}</p>
              </div>
            ) : (
              <div className="md:flex md:max-h-136 md:min-h-0 md:flex-1 md:flex-col lg:max-h-132">
                {/* 최대 576px에서 카드 패딩을 제외하고, 목록과 하단 버튼에 공간을 배분합니다. */}
                <div className="max-h-69 scrollbar-thin overflow-y-auto md:max-h-none md:min-h-0 md:flex-1">
                  {doneQuery.data.pages[0]?.totalCount === 0 ? (
                    <div className="py-6">
                      <DashboardEmptyState
                        message={nextIntlTodo('noCompletedTodos')}
                        imageSrc="/images/dashboard/img_result_none.svg"
                      />
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {doneItems.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          labels={labels}
                          size={isTablet ? 'large' : 'small'}
                          className={goalTodoItemClass}
                          {...actions}
                          onOpenDetail={setDetailTodoId}
                          onCreateNote={(todoId) =>
                            router.push(`/notes/write?todoId=${todoId}`)
                          }
                          // FN-TD-11: 그 할 일의 노트(noteIds[0])를 노트 상세로 엽니다.
                          onViewNote={setNoteId}
                          kebabSlot={
                            <span className={goalTodoKebabClass}>
                              <TodoItemKebab
                                onEdit={() => setEditTodoId(todo.id)}
                                isWhite
                                onDelete={() => setDeleteTarget(todo)}
                              />
                            </span>
                          }
                        />
                      ))}
                    </ul>
                  )}
                  {doneQuery.isError && (
                    <p role="alert" className="mt-3 text-sm text-danger">
                      {doneQuery.isFetchNextPageError
                        ? nextIntlGoalDetail('loadMoreError')
                        : nextIntlGoalDetail('refreshError')}
                    </p>
                  )}
                </div>
                {(doneQuery.hasNextPage || doneQuery.isError) && (
                  <div className="mt-4 flex shrink-0 justify-center">
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-4 text-sm font-medium text-orange-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                      aria-busy={doneQuery.isFetching}
                      aria-label={
                        doneQuery.isError
                          ? nextIntlGoalDetail('retryList')
                          : nextIntlGoalDetail('loadMoreTodos')
                      }
                      disabled={doneQuery.isFetching}
                      onClick={() => {
                        if (
                          doneQuery.isError &&
                          !doneQuery.isFetchNextPageError
                        )
                          void doneQuery.refetch();
                        else
                          void doneQuery.fetchNextPage({
                            cancelRefetch: false,
                          });
                      }}
                    >
                      {doneQuery.isFetching
                        ? nextIntlDashboard('loading')
                        : doneQuery.isError
                          ? nextIntlTodo('retry')
                          : nextIntlDashboard('more')}
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
              </div>
            )}
          </div>
        </div>
      </div>
      <TodoDetailModal
        todoId={detailTodoId}
        onClose={() => setDetailTodoId(null)}
        onEdit={(todoId) => {
          setDetailTodoId(null);
          setEditTodoId(todoId);
        }}
        onDelete={(todo) => {
          setDetailTodoId(null);
          setDeleteTarget(todo);
        }}
        // FN-TD-43: 상세를 닫고 노트 상세를 엽니다. 노트 상세를 닫아도 할 일 상세는 다시 열지 않습니다.
        onOpenNote={(noteIdToOpen) => {
          setDetailTodoId(null);
          setNoteId(noteIdToOpen);
        }}
      />
      <NoteDetailDrawer noteId={noteId} onClose={() => setNoteId(null)} />
      <TodoEditModal todoId={editTodoId} onClose={() => setEditTodoId(null)} />
      <DeleteTodoModal
        todo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
      {/* 현재 목표를 미리 선택합니다. 생성 후 목록 재조회는 기존 모달의 mutation이 처리합니다. */}
      <TodoCreateModal
        isOpen={isTodoCreateOpen}
        onOpenChange={setIsTodoCreateOpen}
        initialGoal={{ id: goal.id, title: goal.title }}
      />
    </div>
  );
}
