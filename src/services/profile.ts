import { supabase } from "../lib/supabase";
import { Post } from "../types/post";
import { Comment } from "../types/comment";

type ProfileRow = {
  id: string;
  username: string | null;
  created_at: string;
};

type PostImageRow = { path: string; sort: number | null };

type PostRow = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  post_images?: PostImageRow[];
};

type CommentRow = {
  id: string;
  post_id: string;
  body: string;
  author_id: string;
  created_at: string;
};

const mapPost = (r: PostRow): Post => ({
  id: r.id,
  title: r.title,
  content: r.content,
  authorId: r.author_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  imageUrls: (r.post_images ?? [])
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((i) => i.path),
  comments: [],
});

const mapComment = (r: CommentRow): Comment => ({
  id: r.id,
  postId: r.post_id,
  body: r.body,
  authorId: r.author_id,
  createdAt: r.created_at,
});

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .eq("id", userId)
    .single<ProfileRow>();

  if (error) throw error;

  return {
    id: data.id,
    username: data.username,
    createdAt: data.created_at,
  };
}

export async function getMyPosts(userId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, content, author_id, created_at, updated_at, post_images(path, sort)"
    )
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as PostRow[]).map(mapPost);
}

export async function getMyComments(userId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, post_id, author_id")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as CommentRow[]).map(mapComment);
}

export async function updateMyUsername(userId: string, username: string) {
  const trimmed = (username ?? "").trim();
  if (!trimmed) throw new Error("닉네임을 입력하세요");
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error("닉네임은 2~20자로 입력하세요");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmed })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 닉네임입니다");
    }
    throw error;
  }

  return { ok: true, username: trimmed };
}