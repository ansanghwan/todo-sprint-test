import { useMutation } from '@tanstack/react-query';
import { commentMutations } from '@/queries/comment';

const useCreateComment = (postId: number) => {
  const { mutate, isPending } = useMutation(commentMutations.create(postId));

  return { createComment: mutate, isCreating: isPending };
};

export default useCreateComment;
