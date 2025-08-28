import React from "react";
import { Alert, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import LoginRequired from "@/src/components/LoginRequired";
import { useAuthStore } from "@/src/store/auth";
import { usePostQuery } from "@/src/hooks/usePosts";
import { useUpdatePostMutation } from "@/src/hooks/useUpdatePost";
import PostEditorEdit, {
  UploadPart,
} from "@/src/features/post/editor/PostEditorEdit";

function extractSupabasePath(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    const marker = "/object/public/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const after = u.pathname.substring(idx + marker.length);
    const firstSlash = after.indexOf("/");
    if (firstSlash === -1) return null;
    return after.substring(firstSlash + 1);
  } catch {
    return null;
  }
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: post, isLoading } = usePostQuery(id);
  const { mutateAsync, isPending } = useUpdatePostMutation(id);

  if (!user)
    return (
      <LoginRequired
        redirectTo={`/post/edit/${id}`}
        message="수정하려면 로그인이 필요합니다."
      />
    );

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!post)
    return <Text style={{ padding: 16 }}>존재하지 않는 글입니다.</Text>;
  if (user.id !== post.authorId)
    return <Text style={{ padding: 16 }}>작성자만 수정할 수 있습니다.</Text>;

  const existing = (post.imageUrls ?? []).map((url) => {
    const path = extractSupabasePath(url);
    return { path: path ?? "", url };
  });

  return (
    <PostEditorEdit
      header="글 수정"
      submitLabel="수정하기"
      initialTitle={post.title}
      initialContent={post.content}
      existingImages={existing}
      isBusy={isPending}
      onSubmit={async ({
        title,
        content,
        addFiles,
        removePaths,
        reorderPaths,
      }) => {
        if (!title || !content) {
          Alert.alert("입력 확인", "제목과 내용을 입력하세요.");
          return;
        }
        try {
          await mutateAsync({
            id: String(id),
            title,
            content,
            addFiles: (addFiles as UploadPart[] | undefined) ?? undefined,
            removePaths,
            reorderPaths,
          });
          router.replace({ pathname: "/post/[id]", params: { id } });
        } catch (e: any) {
          Alert.alert("수정 실패", e?.message ?? "다시 시도해 주세요.");
        }
      }}
    />
  );
}
