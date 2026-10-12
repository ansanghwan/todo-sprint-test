import { useMutation } from '@tanstack/react-query';
import { commentMutations } from '@/queries/comment';

const useUpdateComment = (postId: number) => {
  const { mutate, isPending } = useMutation(commentMutations.update(postId));

  return { updateComment: mutate, isUpdating: isPending };
};

export default useUpdateComment;
