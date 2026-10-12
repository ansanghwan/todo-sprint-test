'use client';

import type { ReactNode } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import type { JSONContent } from '@tiptap/react';
import Button from '@/components/ui/button/Button';
import NoteEditor from '@/components/ui/editor/Editor';
import Image from 'next/image';

const schema = z.object({
  title: z.string().trim().min(1).max(30),
  content: z.custom<JSONContent>((value) => value != null),
});

export type NoteFormValues = z.infer<typeof schema>;

interface NoteFormProps {
  /** 페이지 제목 (노트 작성하기 / 노트 수정하기) */
  heading: string;
  /** 제출 버튼 글자 (등록하기 / 수정하기) */
  submitLabel: string;
  /** 수정할 때 채워 넣을 기존 값 */
  defaultValues?: NoteFormValues;
  /** 저장 요청 중이면 버튼 비활성화 */
  isPending: boolean;
  onSubmit: (values: NoteFormValues) => void;
  /** 제목 아래에 들어갈 목표·할 일·태그 정보 */
  meta: ReactNode;
}

export default function NoteForm({
  heading,
  submitLabel,
  defaultValues,
  isPending,
  onSubmit,
  meta,
}: NoteFormProps) {
  const t = useTranslations('Todo');
  const {
    register,
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { title: '', content: undefined },
  });
  const title = useWatch({ control, name: 'title' });
  const titleLength = title.length;

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
              <NoteEditor value={field.value} onChange={field.onChange}>
                <div
                  className={
                    'mt-[1.4rem] flex flex-row flex-nowrap items-center'
                  }
                >
                  <Image
                    src="/icons/note_icon.svg"
                    alt="note"
                    height={40}
                    width={40}
                  />
                  <input
                    {...register('title')}
                    maxLength={30}
                    placeholder={t('noteTitlePlaceholder')}
                    className={
                      'w-full pl-3 text-2xl font-semibold outline-none placeholder:text-[#BBBBBB]'
                    }
                  />
                  <span className={'ml-auto text-xs'}>
                    {titleLength}/<span className={'text-orange-600'}>30</span>
                  </span>
                </div>

                <div>
                  <dl className="mt-7.5 grid grid-cols-2 gap-y-3 text-sm">
                    {meta}
                  </dl>
                </div>
              </NoteEditor>
            )}
          />
        </div>
      </div>
    </form>
  );
}
