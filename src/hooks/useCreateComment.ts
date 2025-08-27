import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../services/posts";

export function useCreateCommentMutation(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(postId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
