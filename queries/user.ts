import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { uploadImage } from '@/lib/api/images';
import { changePassword, checkNickname, getMe, updateMe } from '@/lib/api/user';

// 기본값('online')은 오프라인일 때 요청을 보류해 버튼이 비활성인 채 멈춥니다. 바로 보내고 실패를 알립니다.
const NETWORK_MODE = 'always';

export interface ProfileChanges {
  name?: string;
  image?: File;
}

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export const userQueries = {
  me: () =>
    queryOptions({
      queryKey: userKeys.me(),
      queryFn: ({ signal }) => getMe(signal),
      // 내 정보는 세션 중 거의 바뀌지 않으므로 마운트마다 다시 받지 않습니다. 수정·로그아웃 시 무효화하세요.
      staleTime: Infinity,
    }),
};

export const userMutations = {
  update: () =>
    mutationOptions({
      mutationFn: async ({ name, image }: ProfileChanges) =>
        updateMe({
          name,
          image: image ? await uploadImage(image) : undefined,
        }),
      networkMode: NETWORK_MODE,
      onSuccess: (user, _changes, _onMutateResult, context) => {
        context.client.setQueryData(userKeys.me(), user);
      },
    }),
  changePassword: () =>
    mutationOptions({
      mutationFn: changePassword,
      networkMode: NETWORK_MODE,
    }),
  checkNickname: () =>
    mutationOptions({
      mutationFn: checkNickname,
      networkMode: NETWORK_MODE,
    }),
};
