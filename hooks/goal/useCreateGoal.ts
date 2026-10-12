import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createGoal } from '@/lib/api/goals';
import { goalKeys } from '@/queries/goal';

const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
};

export default useCreateGoal;
