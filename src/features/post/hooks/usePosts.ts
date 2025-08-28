import { useQuery } from "@tanstack/react-query";
import { Post } from "../../../types/post";
import { getPostSimple, listPostsSimple } from "../services/posts";

export const usePostsQuery = (page = 1, pageSize = 10) => {
  return useQuery<Post[]>({
    queryKey: ["posts", page, pageSize],
    queryFn: () => listPostsSimple(page, pageSize),
  });
};

export const usePostQuery = (id: string) => {
  return useQuery<Post>({
    queryKey: ["post", id],
    queryFn: () => getPostSimple(id),
  });
};
