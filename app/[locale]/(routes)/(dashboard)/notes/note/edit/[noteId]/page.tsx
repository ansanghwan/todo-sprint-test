import { notFound } from 'next/navigation';
import NoteEditForm from './NoteEditForm';

export default async function Page({
  params,
}: PageProps<'/[locale]/notes/note/edit/[noteId]'>) {
  const { noteId } = await params;
  const id = Number(noteId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <NoteEditForm noteId={id} />;
}
