'use client';

import { useRef, type ChangeEvent } from 'react';
import useImagePreview from '@/hooks/useImagePreview';
import {
  hasImageExtension,
  IMAGE_ACCEPT,
} from '@/components/todo/todo-form/imageFile';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/button/Button';
import PostEditor from '@/components/ui/editor/PostEditor';
import { toast } from '@/components/ui/toast/Toaster';

const TITLE_MAX_LENGTH = 30;
const CONTENT_MAX_LENGTH = 10000;

const schema = z.object({
  title: z.string().trim().min(1).max(TITLE_MAX_LENGTH),
  content: z.string().min(1).max(CONTENT_MAX_LENGTH),
  image: z.custom<File | string | null>(),
});

export type PostFormValues = z.infer<typeof schema>;

interface PostFormProps {
  /** 페이지 제목 (게시물 작성하기 / 게시물 수정하기) */
  heading: string;
  /** 제출 버튼 글자 (등록하기 / 수정하기) */
  submitLabel: string;
  /** 수정할 때 채워 넣을 기존 값 */
  defaultValues?: PostFormValues;
  /** 저장 요청 중이면 버튼 비활성화 */
  isPending: boolean;
  onSubmit: (values: PostFormValues) => void;
}

export default function PostForm({
  heading,
  submitLabel,
  defaultValues,
  isPending,
  onSubmit,
}: PostFormProps) {
  const t = useTranslations('Todo');
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { isValid },
  } = useForm<PostFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { title: '', content: '', image: null },
  });
  const title = useWatch({ control, name: 'title' });
  const titleLength = title.length;
  const image = useWatch({ control, name: 'image' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useImagePreview(image instanceof File ? image : null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // 같은 파일을 다시 골라도 change가 나도록
    if (!file) return;
    if (!hasImageExtension(file.name)) {
      toast.error('jpg, png, gif, webp, svg 이미지만 첨부할 수 있어요');
      return;
    }
    setValue('image', file, { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={'mx-auto my-0 max-w-3xl items-center bg-grayscale-100'}>
        <div
          className={'mb-[1.4rem] flex flex-row items-center justify-between'}
        >
          <h2 className={'text-2xl font-semibold'}>{heading}</h2>
          <Button
            type="submit"
            className="w-auto"
            disabled={!isValid || isPending}
          >
            {submitLabel}
          </Button>
        </div>
        <div className={'gap-2.5 rounded-4xl bg-white px-8.5 py-8'}>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <PostEditor
                  placeholder={t('postContentPlaceholder')}
                  value={field.value}
                  onChange={field.onChange}
                  onImageClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className={
                      'mt-[1.4rem] flex flex-row flex-nowrap items-center'
                    }
                  >
                    <input
                      {...register('title')}
                      maxLength={30}
                      placeholder={t('postTitlePlaceholder')}
                      className={
                        'w-full text-2xl font-semibold outline-none placeholder:text-[#BBBBBB]'
                      }
                    />
                    <span className={'ml-auto text-xs'}>
                      {titleLength}/
                      <span className={'text-orange-600'}>30</span>
                    </span>
                  </div>
                </PostEditor>

                {image && (
                  <div className="relative mt-4 w-40">
                    {image instanceof File ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        ref={previewRef}
                        alt="첨부 이미지 미리보기"
                        className="rounded-xl"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={image}
                        alt="첨부 이미지"
                        className="rounded-xl"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="첨부 이미지 삭제"
                      onClick={() =>
                        setValue('image', null, { shouldDirty: true })
                      }
                      className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </>
            )}
          />
        </div>
      </div>
    </form>
  );
}
