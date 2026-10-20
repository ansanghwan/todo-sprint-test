import { useQuery } from '@tanstack/react-query';
import { postQueries } from '@/queries/post';

/**
 * 본문이 받아 오는 게시글 상세가 404로 실패했는지 읽습니다.
 * 상세를 다시 받으면 서버가 조회수를 올리므로 캐시가 있거나 실패했어도 다시 요청하지 않습니다.
 */
const usePostNotFound = (postId: number) => {
  const { error } = useQuery({
    ...postQueries.detail(postId),
    staleTime: Infinity,
    retryOnMount: false,
  });

  return error?.httpCategory === 'notFound';
};

export default usePostNotFound;
