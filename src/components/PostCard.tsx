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
  showComments?: boolean;
};

function PostCard({
  post,
  showAuthor = true,
  showExcerpt = true,
  showThumbnail = true,
  showComments = true,
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

  const commentCount =
    typeof post.commentsCount === "number"
      ? post.commentsCount
      : post.comments?.length ?? 0;

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
        {showExcerpt && (
          <Text numberOfLines={2} style={styles.excerpt}>
            {post.content}
          </Text>
        )}

        <View style={styles.metaRow}>
          {showAuthor && (
            <Text style={styles.meta}>
              작성자 {post.author?.username ?? "Unknown"}
            </Text>
          )}

          {showAuthor && showComments && <Text style={styles.sep}>|</Text>}

          {showComments && <Text style={styles.meta}>댓글 {commentCount}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    marginHorizontal: 14,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  thumb: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 12, 
  },
  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbText: { fontSize: 12, color: "#9aa0a6" },

  content: {
    flex: 1,
    justifyContent: "space-between", 
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#232323",
    marginBottom: 4, 
  },
  excerpt: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 6, 
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  meta: {
    fontSize: 12,
    color: "#7a7a7a",
  },
  sep: {
    marginHorizontal: 6,
    fontSize: 12,
    color: "#c9c9c9",
  },
});

export default memo(PostCard);
