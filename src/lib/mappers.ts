import { Comment } from "../types/comment";
import { Post } from "../types/post";
import { User } from "../types/user";

export const toUser = (row: any): User => ({
  id: row.id,
  username: row.username ?? null,
  createdAt: row.created_at,
});

export const toPostBase = (row: any): Omit<Post, "imageUrls" | "comments"> => ({
  id: row.id,
  title: row.title,
  content: row.content,
  authorId: row.authorId ?? row.author_id,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at ?? row.created_at,
  author: row.author ? toUser(row.author) : undefined,
});

export const toComment = (row: any, author?: any): Comment => ({
  id: row.id,
  postId: row.postId ?? row.post_id,
  body: row.body,
  authorId: row.authorId ?? row.author_id,
  createdAt: row.createdAt ?? row.created_at,
  author: author ? toUser(author) : undefined,
});
