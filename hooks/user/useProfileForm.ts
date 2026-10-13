import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { toast } from '@/components/ui/toast/Toaster';
import useValidateOnIdle from '@/hooks/auth/useValidateOnIdle';
import {
  profileFormSchema,
  type ProfileFormValues,
} from '@/lib/user/myInfoFormSchema';
import type { UserDto } from '@/types/api/user';
import useCheckNickname from './useCheckNickname';
import useUpdateProfile from './useUpdateProfile';

interface NameCheck {
  name: string;
  isAvailable: boolean;
}

const useProfileForm = (user: UserDto) => {
  const t = useTranslations('MyInfo');
  const { updateProfile, isUpdating } = useUpdateProfile();
  const { checkNickname, isChecking } = useCheckNickname();
  const [image, setImage] = useState<File | null>(null);
  const [lastNameCheck, setLastNameCheck] = useState<NameCheck>();
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user.name },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });
  const idleValidation = useValidateOnIdle((name: keyof ProfileFormValues) =>
    trigger(name),
  );

  const name = useWatch({ control, name: 'name' }).trim();
  const isNameChanged = name !== user.name.trim();
  // 검사한 뒤 이름을 다시 고치면 그 결과는 더 이상 쓰지 않습니다.
  const nameCheck = lastNameCheck?.name === name ? lastNameCheck : undefined;
  const isNameAvailable = isNameChanged && nameCheck?.isAvailable === true;
  const isNameReady = !isNameChanged || isNameAvailable;

  const checkName = () =>
    checkNickname(name, {
      onSuccess: ({ available }) =>
        setLastNameCheck({ name, isAvailable: available }),
      onError: () => toast.error(t('nameCheckFailed')),
    });

  const submit = (values: ProfileFormValues) => {
    updateProfile(
      {
        name: isNameChanged ? values.name : undefined,
        image: image ?? undefined,
      },
      {
        onSuccess: (updatedUser) => {
          reset({ name: updatedUser.name });
          setImage(null);
          setLastNameCheck(undefined);
          toast.success(t('saved'));
        },
        onError: () => toast.error(t('saveFailed')),
      },
    );
  };

  const nameError =
    errors.name?.message ??
    (nameCheck?.isAvailable === false ? 'nameTaken' : undefined);

  return {
    formProps: { onSubmit: handleSubmit(submit), ...idleValidation },
    nameField: register('name'),
    nameError: nameError ? t(`errors.${nameError}`) : undefined,
    isNameAvailable,
    checkName,
    canCheckName:
      isNameChanged && name !== '' && !nameCheck && !isChecking && !isUpdating,
    image,
    selectImage: setImage,
    canSave: (isNameChanged || image !== null) && isNameReady && !isUpdating,
    isSaving: isUpdating,
  };
};

export default useProfileForm;
