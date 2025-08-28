import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import {
  useMeProfile,
  useMePosts,
  useMeComments,
  useUpdateMyUsername,
} from "@/src/hooks/useMe";
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
  const { mutateAsync: saveUsername, isPending: savingName } =
    useUpdateMyUsername();

  const [editing, setEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    if (profile && !editing) {
      setUsernameInput(profile.username ?? "");
    }
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
    if (next.length < 2 || next.length > 20) {
      return Alert.alert("알림", "닉네임은 2~20자로 입력하세요");
    }
    try {
      await saveUsername(next);
      setEditing(false);
      Alert.alert("완료", "닉네임이 변경되었습니다.");
    } catch (e: any) {
      Alert.alert("에러", e.message ?? "닉네임 변경 실패");
    }
  }, [usernameInput, saveUsername]);

  const header = useMemo(
    () => (
      <View style={styles.headerBox}>
        <Text style={styles.heading}>My Profile</Text>

        <View style={styles.profileBox}>
          {!editing ? (
            <View style={styles.row}>
              <Text style={styles.username}>
                {profile?.username ?? "(no username)"}
              </Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.editText}>수정</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editRow}>
              <TextInput
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="닉네임 (2~20자)"
                maxLength={20}
                autoCapitalize="none"
                style={styles.input}
                editable={!savingName}
              />
              <TouchableOpacity
                style={[styles.saveBtn, savingName && { opacity: 0.6 }]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                <Text style={styles.saveText}>
                  {savingName ? "저장중..." : "저장"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditing(false);
                  setUsernameInput(profile?.username ?? "");
                }}
                disabled={savingName}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          )}

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
    [
      profile,
      tab,
      posts?.length,
      comments?.length,
      handleSignOut,
      editing,
      usernameInput,
      savingName,
      handleSaveName,
    ]
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
  profileBox: { gap: 6, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 18, fontWeight: "600" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editText: { color: "#333" },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2a7",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  cancelText: { color: "#333", fontWeight: "600" },
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
  tabActive: { backgroundColor: "#eef5ff", borderColor: "#aac8ff" },
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
