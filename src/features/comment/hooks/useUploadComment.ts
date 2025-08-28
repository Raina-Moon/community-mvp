import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateComment } from "../services/comments";

export function useUpdateCommentMutation(postId: string) {
  const qc = useQueryClient();
  const postKey = ["post", postId];

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body),

    onMutate: async ({ commentId, body }) => {
      await qc.cancelQueries({ queryKey: postKey });
      const prev = qc.getQueryData<any>(postKey);

      if (prev) {
        qc.setQueryData<any>(postKey, {
          ...prev,
          comments: (prev.comments ?? []).map((c: any) =>
            c.id === commentId ? { ...c, body } : c
          ),
        });
      }
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(postKey, ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: postKey });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
