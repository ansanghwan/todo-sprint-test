'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import NoteDetailDrawer from '@/components/note/note-detail/NoteDetailDrawer';
import DeleteTodoModal from '@/components/todo/DeleteTodoModal';
import TodoDetailModal from '@/components/todo/todo-detail/TodoDetailModal';
import TodoEditModal from '@/components/todo/todo-edit/TodoEditModal';
import TodoItem from '@/components/todo/TodoItem';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import Button from '@/components/ui/button/Button';
import { toast } from '@/components/ui/toast/Toaster';
import useTodoItemActions from '@/hooks/todo/useTodoItemActions';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useRouter } from '@/i18n/navigation';
import { todoQueries } from '@/queries/todo';
import type { TodoDto } from '@/types/api/todo';
import TodoListEmpty from '../../todos/_components/TodoListEmpty';
import type { TodoStatus } from '../../todos/_components/todoListParams';
import {
  filterFavoriteTodos,
  type FavoriteGoalFilterValue,
} from './filterFavoriteTodos';

// globals.css의 --breakpoint-md(744px)와 같은 값입니다.
const TABLET_QUERY = '(min-width: 46.5rem)';

interface FavoriteTodoListProps {
  status: TodoStatus;
  goalId: FavoriteGoalFilterValue;
}

/**
 * 찜한 할 일 목록 (FN-FV-01, 03~06).
 * 전체를 받은 뒤 화면에서 거르므로, 다 받기 전이나 실패했을 때는 빈 상태를 보여 주지 않습니다.
 */
const FavoriteTodoList = ({ status, goalId }: FavoriteTodoListProps) => {
  const { data, isPending, isError, errorUpdatedAt, refetch } = useQuery(
    todoQueries.favorites(),
  );
  const router = useRouter();
  const isTablet = useMediaQuery(TABLET_QUERY);
  const actions = useTodoItemActions();
  const labels = useTodoItemLabels();
  const t = useTranslations('Todo');
  const [deleteTarget, setDeleteTarget] = useState<Pick<
    TodoDto,
    'id' | 'title'
  > | null>(null);
  const [noteId, setNoteId] = useState<number | null>(null);
  // FN-FV-06: 모든 할 일과 같이 상세(FN-TD-13)·수정(FN-TD-29)을 엽니다.
  const [detailTodoId, setDetailTodoId] = useState<number | null>(null);
  const [editTodoId, setEditTodoId] = useState<number | null>(null);

  // FN-FV-01: 조회에 실패하면 에러 토스트를 띄웁니다.
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

  const todos = filterFavoriteTodos(data.todos, status, goalId);

  // FN-FV-05: 거른 결과가 0개면 빈 상태입니다.
  if (todos.length === 0) {
    return <TodoListEmpty message={t('noFavoriteTodos')} />;
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
            {...actions}
            onOpenDetail={setDetailTodoId}
            onViewNote={setNoteId}
            onCreateNote={(todoId) =>
              router.push(`/notes/write?todoId=${todoId}`)
            }
            kebabSlot={
              <TodoItemKebab
                onEdit={() => setEditTodoId(todo.id)}
                onDelete={() =>
                  setDeleteTarget({ id: todo.id, title: todo.title })
                }
              />
            }
          />
        ))}
      </ul>
      <DeleteTodoModal
        todo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
      <TodoEditModal todoId={editTodoId} onClose={() => setEditTodoId(null)} />
      {/* 상세에서 다른 창으로 넘어갈 때는 상세를 먼저 닫아 창이 겹치지 않게 합니다. */}
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
        onOpenNote={(id) => {
          setDetailTodoId(null);
          setNoteId(id);
        }}
      />
      <NoteDetailDrawer noteId={noteId} onClose={() => setNoteId(null)} />
    </>
  );
};

export default FavoriteTodoList;
