'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState, type ChangeEvent } from 'react';

import useTodoFormErrorMessage from '@/hooks/todo/useTodoFormErrorMessage';
import useImagePreview from '@/hooks/useImagePreview';
import { cn } from '@/lib/utils';
import { hasImageExtension, IMAGE_ACCEPT } from '../imageFile';
import type { TodoFormErrorKey } from '../todoFormSchema';
import FieldLayout from './FieldLayout';

interface ImageFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: TodoFormErrorKey;
}

/**
 * 이미지 1개 첨부 (FN-TD-26). 선택하면 미리보기만 보여 주고, 실제 업로드는 제출할 때 합니다.
 * 허용하지 않는 확장자는 첨부하지 않고 에러만 보여 줍니다.
 */
const ImageField = ({ value, onChange, error }: ImageFieldProps) => {
  const t = useTranslations('Todo');
  const getErrorMessage = useTodoFormErrorMessage();
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useImagePreview(value);
  // 고른 파일을 첨부하지 못한 이유. 폼 검증 에러(error)보다 먼저 보여 줍니다.
  const [selectError, setSelectError] = useState<TodoFormErrorKey>();
  const shownError = selectError ?? error;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change 이벤트가 나도록 비웁니다.
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!hasImageExtension(file.name)) {
      setSelectError('imageExtensionInvalid');
      return;
    }
    setSelectError(undefined);
    onChange(file);
  };

  const handleRemove = () => {
    setSelectError(undefined);
    onChange(null);
  };

  return (
    <FieldLayout
      label={t('image')}
      labelId={labelId}
      errorId={errorId}
      errorMessage={getErrorMessage(shownError)}
    >
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex w-full flex-col items-start gap-2"
      >
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
          data-testid="image-file-input"
          className="hidden"
        />

        {value ? (
          <div className="relative h-25.25 w-40 overflow-hidden rounded-2xl border border-grayscale-300 bg-grayscale-50">
            {/* 브라우저가 만든 임시 blob URL이라 next/image 최적화 대상이 아닙니다. src는 useImagePreview가 넣습니다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={previewRef}
              alt={t('form.imagePreview')}
              className="size-full object-cover"
            />
            <button
              type="button"
              aria-label={t('form.removeImage')}
              onClick={handleRemove}
              className="absolute top-3 right-3 flex rounded-full bg-white text-grayscale-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[1.25rem]"
              >
                cancel
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-describedby={cn(helpId, shownError && errorId)}
            className={cn(
              'flex h-25.25 w-full flex-col items-center justify-center gap-0.5 rounded-2xl border bg-grayscale-50 p-3 text-base/6 font-medium text-grayscale-500 outline-none focus-visible:border-orange-500',
              shownError ? 'border-danger' : 'border-grayscale-300',
            )}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[1.5rem] text-grayscale-400"
            >
              upload_file
            </span>
            {t('form.attachImage')}
          </button>
        )}

        <p id={helpId} className="text-xs/4 font-medium text-grayscale-400">
          {t('maxOneImage')}
        </p>
      </div>
    </FieldLayout>
  );
};

export default ImageField;
