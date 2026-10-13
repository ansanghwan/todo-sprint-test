'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef, type ChangeEvent } from 'react';

import {
  hasImageExtension,
  IMAGE_ACCEPT,
} from '@/components/todo/todo-form/imageFile';
import { toast } from '@/components/ui/toast/Toaster';
import useImagePreview from '@/hooks/useImagePreview';
import { getProfileImageProps } from '@/lib/user/profileImage';

interface ProfileImageFieldProps {
  imageUrl: string | null;
  selectedFile: File | null;
  onSelect: (file: File) => void;
  disabled: boolean;
}

/** 프로필 이미지와 변경 버튼. 고른 파일은 미리보기만 하고 업로드는 저장할 때 합니다. */
const ProfileImageField = ({
  imageUrl,
  selectedFile,
  onSelect,
  disabled,
}: ProfileImageFieldProps) => {
  const t = useTranslations('MyInfo');
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useImagePreview(selectedFile);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change 이벤트가 나도록 비웁니다.
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!hasImageExtension(file.name)) {
      toast.error(t('imageExtensionInvalid'));
      return;
    }
    onSelect(file);
  };

  return (
    <div className="relative size-33">
      {selectedFile ? (
        // 브라우저가 만든 임시 blob URL이라 next/image 최적화 대상이 아닙니다. src는 useImagePreview가 넣습니다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={previewRef}
          alt={t('profileImagePreview')}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <Image
          {...getProfileImageProps(imageUrl)}
          alt={t('profileImage')}
          width={132}
          height={132}
          className="size-full rounded-full object-cover"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
        data-testid="profile-image-input"
        className="hidden"
      />
      <button
        type="button"
        aria-label={t('changeProfileImage')}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="absolute right-1.25 bottom-1.25 flex size-9 cursor-pointer items-center justify-center rounded-full bg-orange-500 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed"
      >
        <span aria-hidden className="material-symbols-rounded text-xl!">
          edit
        </span>
      </button>
    </div>
  );
};

export default ProfileImageField;
