import { notFound } from 'next/navigation';
import PostEditForm from './PostEditForm';

export default async function Page({
  searchParams,
}: PageProps<'/[locale]/post/edit'>) {
  const { postId } = await searchParams;
  const id = Number(postId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <PostEditForm postId={id} />;
}
