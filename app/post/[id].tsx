import React from "react";
import LoginRequired from "@/src/components/LoginRequired";
import { usePostQuery } from "@/src/hooks/usePosts";
import { useAuthStore } from "@/src/store/auth";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Image, ScrollView, Text } from "react-native";

const PostDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? ""; // 안전하게 문자열화
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = usePostQuery(id);

  if (!user) {
    return (
      <LoginRequired
        redirectTo={`/post/${id}`}
        message="글을 보려면 로그인이 필요합니다."
      />
    );
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  if (!data) {
    return <Text>존재하지 않는 글입니다.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 6 }}>
        {data.title}
      </Text>
      <Text style={{ color: "#666", marginBottom: 12 }}>
        {data.author?.username ?? "Unknown"}
      </Text>
      {data.imageUrls?.[0] && (
        <Image
          source={{ uri: data.imageUrls[0] }}
          style={{ height: 200, borderRadius: 8, marginBottom: 12 }}
        />
      )}
      <Text style={{ fontSize: 16, lineHeight: 22 }}>{data.content}</Text>
    </ScrollView>
  );
};

export default PostDetailScreen;
