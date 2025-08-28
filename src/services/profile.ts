import { supabase } from "../lib/supabase";
import { Post } from "../types/post";
import { Comment } from "../types/comment";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
};

type PostRow = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  created_at: string;
  updated_at: string;
  imageUrls: string[] | null;
};

type CommentRow = {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  created_at: string;
};

const mapPost = (r: PostRow): Post => ({
  id: r.id,
  title: r.title,
  content: r.content,
  authorId: r.authorId,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  imageUrls: r.imageUrls ?? [],
  comments: [],
});

const mapComment = (r: CommentRow): Comment => ({
  id: r.id,
  postId: r.postId,
  body: r.body,
  authorId: r.authorId,
  createdAt: r.created_at,
});

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, created_at")
    .eq("id", userId)
    .single<ProfileRow>();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email ?? undefined,
    username: data.username,
    createdAt: data.created_at,
  };
}

export async function getMyPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, authorId, created_at, updated_at, imageUrls")
    .eq("authorId", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as PostRow[]).map(mapPost);
}

export async function getMyComments(userId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, postId, authorId")
    .eq("authorId", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as CommentRow[]).map(mapComment);
}
