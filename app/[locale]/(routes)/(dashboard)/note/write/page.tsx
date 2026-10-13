import { notFound } from 'next/navigation';
import NoteWriteForm from './NoteWriteForm';

export default async function Page({
  searchParams,
}: PageProps<'/[locale]/note/write'>) {
  const { todoId } = await searchParams;
  const id = Number(todoId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <NoteWriteForm todoId={id} />;
}
