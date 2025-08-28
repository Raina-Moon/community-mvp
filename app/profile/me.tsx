import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import { useMeProfile, useMePosts, useMeComments } from "@/src/hooks/useMe";
import { Post } from "@/src/types/post";
import { Comment } from "@/src/types/comment";

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

const MeScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [tab, setTab] = useState<"posts" | "comments">("posts");

  const { data: profile, isLoading: loadingProfile } = useMeProfile();
  const { data: posts, isLoading: loadingPosts } = useMePosts();
  const { data: comments, isLoading: loadingComments } = useMeComments();

  const loading =
    loadingProfile || (tab === "posts" ? loadingPosts : loadingComments);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      Alert.alert("로그아웃", "정상적으로 로그아웃 되었습니다.");
      router.replace("/auth/sign-in");
    } catch (e: any) {
      Alert.alert("에러", e.message ?? "로그아웃 실패");
    }
  }, [signOut, router]);

  const header = useMemo(
    () => (
      <View style={styles.headerBox}>
        <Text style={styles.heading}>My Profile</Text>
        <View style={styles.profileBox}>
          <Text style={styles.username}>
            {profile?.username ?? "(no username)"}
          </Text>
          <Text style={styles.createdAt}>
            Joined: {formatDate(profile?.createdAt)}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setTab("posts")}
            style={[styles.tabBtn, tab === "posts" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "posts" && styles.tabTextActive]}
            >
              내 글
              {typeof posts?.length === "number" ? ` (${posts.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("comments")}
            style={[styles.tabBtn, tab === "comments" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === "comments" && styles.tabTextActive,
              ]}
            >
              내 댓글
              {typeof comments?.length === "number"
                ? ` (${comments.length})`
                : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [profile, tab, posts?.length, comments?.length, handleSignOut]
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ marginTop: 24, fontSize: 16 }}>
          로그인이 필요합니다.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {tab === "posts" ? (
        <FlatList<Post>
          ListHeaderComponent={header}
          data={posts ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemBox}
              onPress={() => router.push(`/post/${item.id}` as any)}
            >
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.content && (
                <Text style={styles.itemBody} numberOfLines={2}>
                  {item.content}
                </Text>
              )}
              <Text style={styles.itemMeta}>{formatDate(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>작성한 글이 없습니다.</Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList<Comment>
          ListHeaderComponent={header}
          data={comments ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemBox}
              onPress={() => router.push(`/post/${item.postId}` as any)}
            >
              <Text style={styles.itemBody} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.itemMeta}>{formatDate(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>작성한 댓글이 없습니다.</Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

export default MeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerBox: { paddingTop: 8, paddingBottom: 12 },
  heading: { fontSize: 20, fontWeight: "700", marginTop: 8, marginBottom: 6 },
  profileBox: { gap: 2, marginBottom: 12 },
  username: { fontSize: 18, fontWeight: "600" },
  email: { color: "#444" },
  createdAt: { color: "#666", fontSize: 12 },
  logoutBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f55",
  },
  logoutText: { color: "#fff", fontWeight: "600" },
  tabs: { flexDirection: "row", gap: 8, marginTop: 12 },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tabActive: {
    backgroundColor: "#eef5ff",
    borderColor: "#aac8ff",
  },
  tabText: { fontSize: 14, color: "#333" },
  tabTextActive: { fontWeight: "700" },
  listContent: { paddingBottom: 24 },
  itemBox: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  itemTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  itemBody: { fontSize: 14, color: "#333" },
  itemMeta: { marginTop: 6, fontSize: 12, color: "#666" },
  empty: { textAlign: "center", marginTop: 24, color: "#777" },
});
