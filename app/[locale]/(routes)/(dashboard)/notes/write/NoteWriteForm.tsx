'use client';

import { useTranslations } from 'next-intl';
import NoteForm, { type NoteFormValues } from '@/components/note/NoteForm';
import TodoStatusChip from '@/components/todo/TodoStatusChip';
import { useRouter } from '@/i18n/navigation';
import { useCreateNoteMutation } from '@/queries/notes';
import { toast } from '@/components/ui/toast/Toaster';
import { ApiError } from '@/lib/api/errors';
import MetaRow from '@/components/note/MetaRow';
import { formatUtcDateToYmd } from '@/lib/formatter';
import { todoQueries } from '@/queries/todo';
import { useQuery } from '@tanstack/react-query';
import TagChip from '@/components/todo/todo-form/fields/TagChip';
import { getTagColor } from '@/components/todo/todo-form/tagColors';

interface NoteWriteFormProps {
  /** 노트를 연결할 할 일 ID (page.tsx에서 검사를 마친 값) */
  todoId: number;
}

export default function NoteWriteForm({ todoId }: NoteWriteFormProps) {
  const t = useTranslations('Todo');
  const router = useRouter();
  const { mutate: createNote, isPending } = useCreateNoteMutation();
  const { data: todo } = useQuery(todoQueries.detail(todoId));
  const handleSubmit = (values: NoteFormValues) => {
    createNote(
      { todoId, ...values },
      {
        onSuccess: () => {
          toast.success('노트가 등록되었어요');
          router.push('/notes');
        },
        onError: (error) => toast.error(getCreateNoteErrorMessage(error)),
      },
    );
  };

  return (
    <NoteForm
      heading={t('writeNote')}
      submitLabel={t('register')}
      isPending={isPending}
      onSubmit={handleSubmit}
      meta={
        // 할 일 단건 조회 API가 생기면 실제 값으로 교체
        <>
          <MetaRow icon="flag_2" label={t('goal')}>
            <span className="truncate">{todo?.goal?.title}</span>
          </MetaRow>
          <MetaRow icon="calendar_today" label={t('createdAt')}>
            {formatUtcDateToYmd(todo?.createdAt || '')}
          </MetaRow>
          <MetaRow icon="check_box" label={t('todo')}>
            <span className="truncate">{todo?.title}</span>
            <TodoStatusChip isTodo={todo?.done} className="ml-1 shrink-0" />
          </MetaRow>
          <MetaRow icon="tag" label={t('tag')}>
            {todo?.tags && todo.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-1">
                {todo.tags.map((tag, index) => (
                  <TagChip
                    key={tag.id}
                    label={tag.name}
                    color={getTagColor(index)}
                  />
                ))}
              </ul>
            ) : (
              '-'
            )}
          </MetaRow>
        </>
      }
    />
  );
}

function getCreateNoteErrorMessage(error: Error) {
  if (error instanceof ApiError) {
    if (error.status === 403) return '본인의 할 일에만 노트를 작성할 수 있어요';
    if (error.status === 404) return '할 일을 찾을 수 없어요';
  }
  return '노트를 등록하지 못했어요. 잠시 후 다시 시도해주세요';
}
