'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import NoteDetailDrawer from '@/components/note/note-detail/NoteDetailDrawer';
import DeleteTodoModal from '@/components/todo/DeleteTodoModal';
import TodoCreateModal from '@/components/todo/todo-create/TodoCreateModal';
import TodoDetailModal from '@/components/todo/todo-detail/TodoDetailModal';
import TodoEditModal from '@/components/todo/todo-edit/TodoEditModal';
import Button from '@/components/ui/button/Button';
import IcPlus from '@/components/ui/icons/IcPlus';
import useAllGoals from '@/hooks/goal/useAllGoals';
import useCalendarTodos from '@/hooks/todo/useCalendarTodos';
import { useRouter } from '@/i18n/navigation';
import type { TodoDto } from '@/types/api/todo';
import {
  addMonths,
  getCalendarDays,
  getMonthKey,
  groupTodosByDueDate,
  type DateKey,
} from '../_lib/calendarDates';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import CalendarPageHeader from './CalendarPageHeader';
import DayTodosModal from './DayTodosModal';

interface MonthCalendarProps {
  today: DateKey;
  /** null이면 전체 목표 */
  selectedGoalId: number | null;
  onSelectGoal: (goalId: number | null) => void;
}

const MonthCalendar = ({
  today,
  selectedGoalId,
  onSelectGoal,
}: MonthCalendarProps) => {
  const t = useTranslations('Todo');
  const [month, setMonth] = useState(() => getMonthKey(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [openedDate, setOpenedDate] = useState<DateKey | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openedTodoId, setOpenedTodoId] = useState<number | null>(null);
  const [openedNoteId, setOpenedNoteId] = useState<number | null>(null);
  const [editTodoId, setEditTodoId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pick<
    TodoDto,
    'id' | 'title'
  > | null>(null);
  const router = useRouter();
  const { goals } = useAllGoals();
  const selectedGoal = goals?.find(({ id }) => id === selectedGoalId);

  const days = getCalendarDays(month);
  const { todos, isLoading, isError, retry } = useCalendarTodos({
    from: days[0],
    to: days[days.length - 1],
    goalId: selectedGoalId ?? undefined,
  });
  const todosByDate = groupTodosByDueDate(todos ?? []);

  const handlePreviousMonth = () => setMonth(addMonths(month, -1));
  const handleNextMonth = () => setMonth(addMonths(month, 1));
  const handleSelectDate = (dateKey: DateKey) => {
    setSelectedDate(dateKey);
    if (todosByDate.has(dateKey)) {
      setOpenedDate(dateKey);
    }
  };
  const handleCloseDay = () => setOpenedDate(null);
  const handleCloseTodo = () => setOpenedTodoId(null);
  const handleAddTodo = () => setIsCreateOpen(true);
  const handleCreateNote = (todoId: number) =>
    router.push(`/notes/write?todoId=${todoId}`);
  // 그날의 마지막 할 일을 지웠으면 빈 날짜 모달로 돌아가지 않고 닫습니다.
  const handleTodoDeleted = (todoId: number) => {
    const remainingTodos = (
      openedDate === null ? [] : (todosByDate.get(openedDate) ?? [])
    ).filter(({ id }) => id !== todoId);
    if (remainingTodos.length === 0) {
      setOpenedDate(null);
    }
  };
  // 날짜 모달 위에 다른 레이어가 열린 동안에는 날짜 모달을 숨겨 겹치지 않게 합니다.
  const isLayerOpen =
    openedTodoId !== null ||
    openedNoteId !== null ||
    editTodoId !== null ||
    deleteTarget !== null;

  return (
    <div className="mx-auto w-full max-w-7xl pb-16 md:pb-0">
      <CalendarPageHeader onAddTodo={handleAddTodo} />
      <section className="-mx-4 overflow-hidden bg-white-section shadow-lg md:mx-0 md:rounded-3xl lg:rounded-4xl">
        <CalendarHeader
          month={month}
          selectedGoalId={selectedGoalId}
          onSelectGoal={onSelectGoal}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        {isLoading && (
          <p role="status" className="sr-only">
            {t('loadingTodos')}
          </p>
        )}
        {isError && (
          <div
            role="alert"
            className="flex items-center justify-center gap-4 border-b border-subtle px-4 py-3"
          >
            <p className="text-sm text-muted">{t('fetchTodosError')}</p>
            <Button
              variant="neutral"
              size="sm"
              className="w-auto"
              onClick={retry}
            >
              {t('retry')}
            </Button>
          </div>
        )}
        <CalendarGrid
          days={days}
          month={month}
          today={today}
          selectedDate={selectedDate}
          todosByDate={todosByDate}
          isLoading={isLoading}
          onSelectDate={handleSelectDate}
        />
      </section>

      {openedDate !== null && !isLayerOpen && (
        <DayTodosModal
          dateKey={openedDate}
          todos={todosByDate.get(openedDate) ?? []}
          onClose={handleCloseDay}
          onOpenTodo={setOpenedTodoId}
          onViewNote={setOpenedNoteId}
          onCreateNote={handleCreateNote}
          onEditTodo={setEditTodoId}
          onDeleteTodo={setDeleteTarget}
        />
      )}
      {/* 상세의 케밥·작성된 노트는 상세를 닫고 다음 레이어를 엽니다. */}
      <TodoDetailModal
        todoId={openedTodoId}
        onClose={handleCloseTodo}
        onEdit={(todoId) => {
          handleCloseTodo();
          setEditTodoId(todoId);
        }}
        onDelete={(todo) => {
          handleCloseTodo();
          setDeleteTarget(todo);
        }}
        onOpenNote={(noteId) => {
          handleCloseTodo();
          setOpenedNoteId(noteId);
        }}
      />
      <NoteDetailDrawer
        noteId={openedNoteId}
        onClose={() => setOpenedNoteId(null)}
      />
      {/* 수정·삭제 mutation이 할 일 목록 캐시를 갱신해서 달력에도 바로 반영됩니다. */}
      <TodoEditModal todoId={editTodoId} onClose={() => setEditTodoId(null)} />
      <DeleteTodoModal
        todo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleTodoDeleted}
      />
      {/* 생성에 성공하면 생성 mutation이 할 일 목록 query를 무효화해서 달력도 다시 조회합니다. */}
      <TodoCreateModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        initialGoal={selectedGoal}
        initialDueDate={selectedDate}
      />

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-subtle bg-white-section px-4 py-3 shadow-lg md:hidden">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleAddTodo}
        >
          <IcPlus className="size-5 shrink-0" />
          {t('addTodo')}
        </Button>
      </div>
    </div>
  );
};

export default MonthCalendar;
