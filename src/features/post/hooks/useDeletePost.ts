import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost } from "../services/posts";

export function useDeletePostMutation(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}