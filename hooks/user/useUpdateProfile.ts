import { useMutation } from '@tanstack/react-query';
import { userMutations } from '@/queries/user';

const useUpdateProfile = () => {
  const { mutate, isPending } = useMutation(userMutations.update());

  return { updateProfile: mutate, isUpdating: isPending };
};

export default useUpdateProfile;
