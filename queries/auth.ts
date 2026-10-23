import {
  mutationOptions,
  type MutationFunctionContext,
} from '@tanstack/react-query';
import { login, signup } from '@/lib/api/auth';

// 기본값('online')은 오프라인일 때 요청을 보류해 버튼이 비활성인 채 멈춥니다.
// 로그인·회원가입은 나중에 몰래 실행되면 안 되므로 바로 보내고 실패를 알립니다.
const NETWORK_MODE = 'always';

// 세션 만료 후 같은 탭에서 다른 계정으로 로그인하면 이전 계정의 캐시가 보일 수 있어 비웁니다.
// clear()는 진행 중인 이 mutation까지 지우므로 조회 캐시만 지웁니다.
const removePreviousUserQueries = (
  _data: unknown,
  _variables: unknown,
  _onMutateResult: unknown,
  context: MutationFunctionContext,
) => context.client.removeQueries();

export const authMutations = {
  login: () =>
    mutationOptions({
      mutationFn: login,
      networkMode: NETWORK_MODE,
      onSuccess: removePreviousUserQueries,
    }),
  signup: () =>
    mutationOptions({
      mutationFn: signup,
      networkMode: NETWORK_MODE,
      onSuccess: removePreviousUserQueries,
    }),
};
