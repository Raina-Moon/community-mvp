import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import {
  useMeProfile,
  useMePosts,
  useMeComments,
  useUpdateMyUsername,
} from "@/src/features/profile/hooks/useMe";
import { Post } from "@/src/types/post";
import { Comment } from "@/src/types/comment";
import { formatDate } from "@/src/utils/date";
import ProfileHeader from "@/src/features/profile/components/ProfileHeader";

const MeScreen = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [tab, setTab] = useState<"posts" | "comments">("posts");

  const { data: profile, isLoading: loadingProfile } = useMeProfile();
  const { data: posts, isLoading: loadingPosts } = useMePosts();
  const { data: comments, isLoading: loadingComments } = useMeComments();
  const { mutateAsync: saveUsername, isPending: savingName } =
    useUpdateMyUsername();

  const [editing, setEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    if (profile && !editing) setUsernameInput(profile.username ?? "");
  }, [profile, editing]);

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

  const handleSaveName = useCallback(async () => {
    const next = usernameInput.trim();
    if (!next) return Alert.alert("알림", "닉네임을 입력하세요");
    if (next.length < 2 || next.length > 20)
      return Alert.alert("알림", "닉네임은 2~20자로 입력하세요");
    try {
      await saveUsername(next);
      setEditing(false);
      Alert.alert("완료", "닉네임이 변경되었습니다.");
    } catch (e: any) {
      Alert.alert("에러", e.message ?? "닉네임 변경 실패");
    }
  }, [usernameInput, saveUsername]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ marginTop: 24, fontSize: 16 }}>
          로그인이 필요합니다.
        </Text>
      </SafeAreaView>
    );
  }

  const headerEl = (
    <ProfileHeader
      profile={profile}
      editing={editing}
      usernameInput={usernameInput}
      onChangeUsername={setUsernameInput}
      onStartEdit={() => setEditing(true)}
      onCancelEdit={() => {
        setEditing(false);
        setUsernameInput(profile?.username ?? "");
      }}
      onSaveName={handleSaveName}
      savingName={savingName}
      onSignOut={handleSignOut}
      tab={tab}
      setTab={setTab}
      postsLen={posts?.length}
      commentsLen={comments?.length}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {tab === "posts" ? (
        <FlatList<Post>
          ListHeaderComponent={headerEl}
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
          ListHeaderComponent={headerEl}
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
              <Text style={styles.empty}>작성한 댓글이 없습니다。</Text>
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
