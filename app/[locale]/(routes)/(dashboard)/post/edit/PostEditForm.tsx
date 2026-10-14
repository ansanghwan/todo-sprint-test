'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from '@/components/ui/toast/Toaster';
import PostForm, { type PostFormValues } from '@/components/post/PostForm';
import { postMutations, postQueries } from '@/queries/post';
import { useMutation, useQuery } from '@tanstack/react-query';
import { uploadImage } from '@/lib/api/images';

interface PostEditFormProps {
  postId: number;
}

export default function PostEditForm({ postId }: PostEditFormProps) {
  const t = useTranslations('Todo');
  const router = useRouter();
  const {
    data: post,
    isPending: isLoading,
    isError,
  } = useQuery(postQueries.detail(postId));
  const { mutateAsync: updatePost, isPending } = useMutation(
    postMutations.update(postId),
  );

  // ⚠️ 노트를 다 불러온 "뒤에" 폼을 그려야 에디터에 기존 내용이 들어갑니다.
  if (isLoading) return <p>불러오는 중…</p>;
  if (isError) return <p>게시글을 불러오지 못했어요.</p>;

  const handleSubmit = async ({ title, content, image }: PostFormValues) => {
    try {
      const imageUrl =
        image instanceof File
          ? await uploadImage(image) // 새로 고름 → 업로드
          : image; // 기존 URL 그대로 or null(삭제)
      await updatePost({ title, content, image: imageUrl });
      router.push(`/posts/${postId}`);
    } catch {
      toast.error(t('updatePostError'));
    }
  };

  return (
    <PostForm
      heading={t('editPost')}
      submitLabel={t('edit')}
      defaultValues={{
        title: post.title,
        content: post.content,
        image: post.image,
      }}
      isPending={isPending}
      onSubmit={handleSubmit}
    />
  );
}
