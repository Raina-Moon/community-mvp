import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  getMyPosts,
  getMyComments,
  updateMyUsername,
} from "../services/profile";
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

export function useUpdateMyUsername() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (newName: string) => updateMyUsername(user!.id, newName),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me", "profile", user?.id] });
    },
  });
}
