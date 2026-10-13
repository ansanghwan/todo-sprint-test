import z from 'zod';

export const NAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/** 검증 실패 메시지는 번역 key입니다. 문구는 화면에서 번역(Auth.errors)합니다. */
const email = z.email({
  error: ({ input }) => (input === '' ? 'emailRequired' : 'emailInvalid'),
});

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, { error: 'passwordRequired' }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z
  .object({
    name: z.string().trim().min(1, { error: 'nameRequired' }),
    email,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { error: 'passwordTooShort' })
      .max(PASSWORD_MAX_LENGTH, { error: 'passwordTooLong' }),
    passwordConfirm: z.string(),
  })
  .refine(({ password, passwordConfirm }) => password === passwordConfirm, {
    path: ['passwordConfirm'],
    error: 'passwordMismatch',
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;
