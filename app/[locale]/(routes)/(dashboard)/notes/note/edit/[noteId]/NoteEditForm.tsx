'use client';

import type { JSONContent } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useNoteQuery, useUpdateNoteMutation } from '@/queries/notes';
import { toast } from '@/components/ui/toast/Toaster';
import NoteForm, { type NoteFormValues } from '@/components/note/NoteForm';
import TodoStatusChip from '@/components/todo/TodoStatusChip';
import { formatUtcDateToYmd } from '@/lib/formatter';
import MetaRow from '@/components/note/MetaRow';

interface NoteEditFormProps {
  noteId: number;
}

export default function NoteEditForm({ noteId }: NoteEditFormProps) {
  const t = useTranslations('Todo');
  const router = useRouter();
  const { data: note, isPending: isLoading, isError } = useNoteQuery(noteId);
  const { mutate: updateNote, isPending } = useUpdateNoteMutation(noteId);

  // ⚠️ 노트를 다 불러온 "뒤에" 폼을 그려야 에디터에 기존 내용이 들어가요
  if (isLoading) return <p>불러오는 중…</p>;
  if (isError) return <p>노트를 불러오지 못했어요.</p>;

  const handleSubmit = (values: NoteFormValues) => {
    updateNote(values, {
      onSuccess: () => {
        toast.success('노트가 수정되었어요');
        router.push('/notes');
      },
      onError: () => toast.error('노트를 수정하지 못했어요'),
    });
  };

  return (
    <NoteForm
      heading="노트 수정하기"
      submitLabel={t('edit')}
      defaultValues={{
        title: note.title,
        content: note.content as JSONContent,
      }}
      isPending={isPending}
      onSubmit={handleSubmit}
      meta={
        <>
          <MetaRow icon="flag_2" label={t('goal')}>
            <span className="truncate">{note.todo.goal?.title ?? '-'}</span>
          </MetaRow>
          <MetaRow icon="calendar_today" label={t('createdAt')}>
            {formatUtcDateToYmd(note.createdAt)}
          </MetaRow>
          <MetaRow icon="check_box" label={t('todo')}>
            <span className="truncate">{note.todo.title}</span>
            <TodoStatusChip isTodo={note.todo.done} className="ml-1 shrink-0" />
          </MetaRow>
          <MetaRow icon="tag" label={t('tag')}>
            {note.todo.tags?.map((tag) => tag.name).join(', ') || '-'}
          </MetaRow>
        </>
      }
    />
  );
}
