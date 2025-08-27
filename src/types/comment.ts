import { User } from "./user";

export type Comment = {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  createdAt: string;
  author?: User;
};
