import { useQuery } from '@tanstack/react-query';
import { userQueries } from '@/queries/user';

/** 내 정보를 불러오기 전이거나 실패하면 false입니다. */
const useIsMe = (userId: number) => {
  const { data: me } = useQuery(userQueries.me());

  return me?.id === userId;
};

export default useIsMe;
