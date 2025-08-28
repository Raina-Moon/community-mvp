import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePost } from "../services/posts";

export function useUpdatePostMutation(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

