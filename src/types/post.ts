import { Comment } from "./comment";
import { User } from "./user";

export type Post = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];   
  comments: Comment[];
  author?: User;        
};