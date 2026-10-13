import { useMutation } from '@tanstack/react-query';
import { userMutations } from '@/queries/user';
import type { ChangePasswordBodyDto } from '@/types/api/user';

const UNAUTHORIZED = 401;
// refresh까지 실패해 세션이 끝났을 때 BFF가 돌려주는 code (app/api/auth/refresh/route.ts)
const SESSION_EXPIRED_CODE = 'TOKEN_INVALID';

export type ChangePasswordFailure = 'wrongCurrentPassword' | 'unknown';

interface ChangePasswordCallbacks {
  onSuccess: () => void;
  onFailure: (reason: ChangePasswordFailure) => void;
}

const useChangePassword = () => {
  const { mutate, isPending } = useMutation(userMutations.changePassword());

  const changePassword = (
    body: ChangePasswordBodyDto,
    { onSuccess, onFailure }: ChangePasswordCallbacks,
  ) =>
    mutate(body, {
      onSuccess,
      // 이 API의 401은 현재 비밀번호 불일치입니다. 세션 만료 401은 client가 refresh 후 재요청하고,
      // refresh도 실패한 401은 비밀번호 문제가 아니므로 구분합니다.
      onError: (error) =>
        onFailure(
          error.status === UNAUTHORIZED && error.code !== SESSION_EXPIRED_CODE
            ? 'wrongCurrentPassword'
            : 'unknown',
        ),
    });

  return { changePassword, isChanging: isPending };
};

export default useChangePassword;
