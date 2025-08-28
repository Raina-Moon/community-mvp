import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteComment } from "../services/comments";

export function useDeleteCommentMutation(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
