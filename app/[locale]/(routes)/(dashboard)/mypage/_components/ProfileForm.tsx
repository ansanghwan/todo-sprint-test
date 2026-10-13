'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import Button from '@/components/ui/button/Button';
import TextField from '@/components/ui/textfield/TextField';
import useMyInfo from '@/hooks/user/useMyInfo';
import useProfileForm from '@/hooks/user/useProfileForm';
import { NAME_MAX_LENGTH } from '@/lib/auth/authFormSchema';
import ProfileImageField from './ProfileImageField';

const ProfileForm = () => {
  const t = useTranslations('MyInfo');
  const user = useMyInfo();
  const {
    formProps,
    nameField,
    nameError,
    isNameAvailable,
    checkName,
    canCheckName,
    image,
    selectImage,
    canSave,
    isSaving,
  } = useProfileForm(user);
  const nameMessageId = useId();

  return (
    <div className="flex flex-col items-center gap-8 md:gap-12">
      <ProfileImageField
        imageUrl={user.image}
        selectedFile={image}
        onSelect={selectImage}
        disabled={isSaving}
      />
      <form
        noValidate
        {...formProps}
        className="flex w-full flex-col gap-8 md:gap-12"
      >
        <div className="flex flex-col gap-4">
          <TextField
            type="email"
            label={t('emailLabel')}
            value={user.email}
            readOnly
            className="bg-grayscale-50 text-grayscale-600"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  {...nameField}
                  type="text"
                  autoComplete="name"
                  maxLength={NAME_MAX_LENGTH}
                  readOnly={isSaving}
                  label={t('nameLabel')}
                  placeholder={t('namePlaceholder')}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameMessageId}
                  className={
                    nameError &&
                    'border-danger focus:border-danger focus:ring-danger/25'
                  }
                />
              </div>
              <Button
                variant="outline"
                className="h-14.5 w-auto px-5"
                disabled={!canCheckName}
                onClick={checkName}
              >
                {t('checkName')}
              </Button>
            </div>
            {/* 버튼과 입력의 아래쪽을 맞추려고 안내 문구를 TextField 밖에 둡니다. */}
            <p
              id={nameMessageId}
              role="status"
              className={
                nameError
                  ? 'min-h-5 text-sm text-danger'
                  : 'min-h-5 text-sm text-blue-300'
              }
            >
              {nameError ?? (isNameAvailable ? t('nameAvailable') : null)}
            </p>
          </div>
        </div>
        <Button type="submit" size="lg" disabled={!canSave}>
          {t('save')}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
