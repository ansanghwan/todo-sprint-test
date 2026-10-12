import { useSuspenseQuery } from '@tanstack/react-query';
import { postQueries } from '@/queries/post';

const usePostDetail = (postId: number) => {
  const { data } = useSuspenseQuery(postQueries.detail(postId));

  return data;
};

export default usePostDetail;
