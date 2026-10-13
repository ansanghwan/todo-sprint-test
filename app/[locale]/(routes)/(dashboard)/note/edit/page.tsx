import { notFound } from 'next/navigation';
import NoteEditForm from './NoteEditForm';

export default async function Page({
  searchParams,
}: PageProps<'/[locale]/note/edit'>) {
  const { noteId } = await searchParams;
  const id = Number(noteId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <NoteEditForm noteId={id} />;
}
