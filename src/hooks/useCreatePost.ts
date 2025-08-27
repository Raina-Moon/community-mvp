import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "../services/posts";

export function useCreatePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
