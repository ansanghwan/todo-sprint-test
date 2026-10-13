import z from 'zod';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/lib/auth/authFormSchema';

/** 검증 실패 메시지는 번역 key입니다. 문구는 화면에서 번역(MyInfo.errors)합니다. */
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, { error: 'nameRequired' }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'currentPasswordRequired' }),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { error: 'passwordTooShort' })
      .max(PASSWORD_MAX_LENGTH, { error: 'passwordTooLong' }),
    newPasswordConfirm: z.string(),
  })
  .refine(
    ({ newPassword, newPasswordConfirm }) => newPassword === newPasswordConfirm,
    { path: ['newPasswordConfirm'], error: 'passwordMismatch' },
  );

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
