import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getMyPosts, getMyComments } from "../services/profile";
import { useAuthStore } from "../store/auth";

export function useMeProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["me", "profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: !!user?.id,
  });
}

export function useMePosts() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["me", "posts", user?.id],
    queryFn: () => getMyPosts(user!.id),
    enabled: !!user?.id,
  });
}

export function useMeComments() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["me", "comments", user?.id],
    queryFn: () => getMyComments(user!.id),
    enabled: !!user?.id,
  });
}
