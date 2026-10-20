import { useQueryClient } from '@tanstack/react-query';
import {
  keepFirstPage,
  postQueries,
  type PostListParams,
} from '@/queries/post';

const useResetPostListCursor = () => {
  const queryClient = useQueryClient();

  const resetCursor = (params: PostListParams) => {
    const { queryKey } = postQueries.list(params);
    // 자르기만 하고 받은 시각은 유지해야 stale 여부(재조회)가 그대로 판단됩니다.
    queryClient.setQueryData(queryKey, keepFirstPage, {
      updatedAt: queryClient.getQueryState(queryKey)?.dataUpdatedAt,
    });
  };

  return { resetCursor };
};

export default useResetPostListCursor;
