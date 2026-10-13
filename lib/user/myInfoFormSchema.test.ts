import { describe, expect, it } from 'vitest';
import { passwordFormSchema } from './myInfoFormSchema';

const errorKeys = (values: Record<string, string>) => {
  const result = passwordFormSchema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.map(({ message }) => message);
};

describe('passwordFormSchema', () => {
  it('새 비밀번호가 8자 미만이면 passwordTooShort', () => {
    expect(
      errorKeys({
        currentPassword: 'current',
        newPassword: 'short',
        newPasswordConfirm: 'short',
      }),
    ).toEqual(['passwordTooShort']);
  });

  it('새 비밀번호와 확인 값이 다르면 passwordMismatch', () => {
    expect(
      errorKeys({
        currentPassword: 'current',
        newPassword: 'password123',
        newPasswordConfirm: 'password124',
      }),
    ).toEqual(['passwordMismatch']);
  });

  it('현재 비밀번호가 비어 있으면 currentPasswordRequired', () => {
    expect(
      errorKeys({
        currentPassword: '',
        newPassword: 'password123',
        newPasswordConfirm: 'password123',
      }),
    ).toEqual(['currentPasswordRequired']);
  });
});
