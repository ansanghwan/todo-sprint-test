import { useMutation } from '@tanstack/react-query';
import { userMutations } from '@/queries/user';

const useCheckNickname = () => {
  const { mutate, isPending } = useMutation(userMutations.checkNickname());

  return { checkNickname: mutate, isChecking: isPending };
};

export default useCheckNickname;
