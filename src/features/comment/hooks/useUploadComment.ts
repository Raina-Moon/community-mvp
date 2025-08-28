import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateComment } from "../services/comments";

export function useUpdateCommentMutation(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
