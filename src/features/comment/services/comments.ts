import { supabase } from "../../../lib/supabase";
import { toComment } from "../../../lib/mappers";
import type { Comment as CommentType } from "../../../types/comment";

export async function listCommentsByPost(
  postId: string,
  page = 1,
  size = 20
): Promise<CommentType[]> {
  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data: rows, error } = await supabase
    .from("comments")
    .select("id,body,author_id,post_id,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  if (!rows?.length) return [];

  const authorIds = Array.from(new Set(rows.map((c) => c.author_id)));
  const { data: authors } = await supabase
    .from("profiles")
    .select("id,username,avatar_url,created_at")
    .in("id", authorIds);

  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
  return rows.map((c) => toComment(c, authorMap.get(c.author_id)));
}

export async function createComment(postId: string, body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body })
    .select("id,post_id,author_id,body,created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updateComment(commentId: string, body: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("로그인이 만료되었어요. 다시 로그인 해 주세요.");

  const { error } = await supabase
    .from("comments")
    .update({ body })
    .eq("id", commentId)
    .eq("author_id", session.user.id);

  if (error) throw error;
  return true;
}

export async function deleteComment(commentId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("로그인이 만료되었어요. 다시 로그인 해 주세요.");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", session.user.id);

  if (error) throw error;
  return true;
}
