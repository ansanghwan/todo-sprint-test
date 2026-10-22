'use client';

import { useTranslations } from 'next-intl';
import PostForm, { PostFormValues } from '@/components/post/PostForm';
import { useRouter } from '@/i18n/navigation';
import { postMutations } from '@/queries/post';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast/Toaster';

export default function PostWriteForm() {
  const t = useTranslations('Post');
  const router = useRouter();
  const { mutateAsync: createPost, isPending } = useMutation(
    postMutations.create(),
  );

  const handleSubmit = async ({ title, content, image }: PostFormValues) => {
    try {
      // 업로드는 mutationFn 안에서 하므로, 업로드 중에도 isPending이 true입니다.
      const post = await createPost({
        title,
        content,
        image: image instanceof File ? image : null,
      });
      router.push(`/posts/${post.id}`);
    } catch {
      toast.error(t('createPostError'));
    }
  };
  return (
    <PostForm
      heading={t('writePost')}
      submitLabel={t('register')}
      isPending={isPending}
      onSubmit={handleSubmit}
    />
  );
}
