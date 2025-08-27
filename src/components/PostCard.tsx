import React, { memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Post } from "../types/post";
import { useAuthStore } from "../store/auth";

type Props = {
  post: Post;
  onPress?: (id: string) => void;
  showAuthor?: boolean;
  showExcerpt?: boolean;
  showThumbnail?: boolean;
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
};

function PostCard({
  post,
  onPress,
  showAuthor = true,
  showExcerpt = true,
  showThumbnail = true,
}: Props) {
  const user = useAuthStore((s) => s.user);

  const router = useRouter();
  const firstImage = post.imageUrls?.[0];

  const handlePress = () => {
    if (!user)
      router.push({
        pathname: "/auth/sign-in",
        params: { redirect: `/post/${post.id}` },
      });
    else router.push({ pathname: "/post/[id]", params: { id: post.id } });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={handlePress}
      accessibilityRole="button"
    >
      {showThumbnail && firstImage ? (
        <Image
          source={{ uri: firstImage }}
          style={styles.thumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbText}>No Image</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {post.title}
        </Text>

        {showAuthor && (
          <Text style={styles.meta}>
            {post.author?.username ?? "Unknown"} · {formatDate(post.createdAt)}
          </Text>
        )}

        {showExcerpt && (
          <Text numberOfLines={2} style={styles.excerpt}>
            {post.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e6e6e6",
    backgroundColor: "#fff",
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },
  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbText: { fontSize: 12, color: "#9aa0a6" },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  meta: { fontSize: 12, color: "#7a7a7a", marginBottom: 6 },
  excerpt: { fontSize: 14, color: "#333" },
});

export default memo(PostCard);
