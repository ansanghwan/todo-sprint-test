import { useSuspenseQuery } from '@tanstack/react-query';
import { userQueries } from '@/queries/user';

const useMyInfo = () => {
  const { data } = useSuspenseQuery(userQueries.me());

  return data;
};

export default useMyInfo;
