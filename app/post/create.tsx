import React from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import LoginRequired from "@/src/components/LoginRequired";
import { useAuthStore } from "@/src/store/auth";
import { useCreatePostMutation } from "@/src/hooks/useCreatePost";
import PostEditor from "@/src/features/post/editor/PostEditor";

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutateAsync, isPending } = useCreatePostMutation();

  if (!user)
    return (
      <LoginRequired
        redirectTo="/post/create"
        message="글을 작성하려면 로그인이 필요합니다."
      />
    );
  return (
    <PostEditor
      header="새 글 작성"
      submitLabel="작성하기"
      isBusy={isPending}
      onSubmit={async ({ title, content }, files) => {
        if (!title || !content) {
          Alert.alert("입력 확인", "제목과 내용을 입력하세요.");
          return;
        }
        try {
          const p = await mutateAsync({ title, content, files });
          router.replace({ pathname: "/post/[id]", params: { id: p.id } });
        } catch (e: any) {
          Alert.alert("작성 실패", e?.message ?? "다시 시도해 주세요.");
        }
      }}
    />
  );
}
