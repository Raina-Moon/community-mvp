import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
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

const COLORS = {
  bg: "#F7FAFC",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  line: "#E5E7EB",
  tint: "#111827",
  chipBg: "#F3F4F6",
  inputBg: "#F3F4F6",
};

type TabKey = "posts" | "comments";

export default function MeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [tab, setTab] = useState<TabKey>("posts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const insets = useSafeAreaInsets();

  const { data: profile, isLoading: loadingProfile } = useMeProfile();
  const { data: posts, isLoading: loadingPosts } = useMePosts();
  const { data: comments, isLoading: loadingComments } = useMeComments();
  const { mutateAsync: saveUsername, isPending: savingName } =
    useUpdateMyUsername();

  const [usernameInput, setUsernameInput] = useState("");
  useEffect(() => {
    if (profile && !editOpen) setUsernameInput(profile.username ?? "");
  }, [profile, editOpen]);

  const loading =
    loadingProfile || (tab === "posts" ? loadingPosts : loadingComments);

  const postCount = posts?.length ?? 0;
  const commentCount = comments?.length ?? 0;

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
      setEditOpen(false);
      Alert.alert("완료", "닉네임이 변경되었습니다.");
    } catch (e: any) {
      Alert.alert("에러", e.message ?? "닉네임 변경 실패");
    }
  }, [usernameInput, saveUsername]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.root, { paddingHorizontal: 16 }]}>
        <Text style={{ marginTop: 24, fontSize: 16 }}>
          로그인이 필요합니다.
        </Text>
      </SafeAreaView>
    );
  }

  const headerMenu = (
    <Modal
      visible={menuOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuOpen(false)}
    >
      <Pressable
        style={styles.menuBackdrop}
        onPress={() => setMenuOpen(false)}
      />
      <View style={styles.menuCard}>
        <Pressable
          style={styles.menuItem}
          android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          onPress={() => {
            setMenuOpen(false);
            setEditOpen(true);
          }}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.text} />
          <Text style={styles.menuText}>닉네임 수정</Text>
        </Pressable>
        <View style={styles.menuDivider} />
        <Pressable
          style={styles.menuItem}
          android_ripple={{ color: "rgba(0,0,0,0.08)" }}
          onPress={() => {
            setMenuOpen(false);
            handleSignOut();
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={[styles.menuText, { color: "#DC2626" }]}>로그아웃</Text>
        </Pressable>
      </View>
    </Modal>
  );

  const editNameModal = (
    <Modal
      visible={editOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setEditOpen(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        style={styles.modalRoot} // flex:1 + justifyContent:"flex-end"
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setEditOpen(false)}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>닉네임 수정</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={COLORS.sub} />
            <TextInput
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoFocus
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            {!!usernameInput && (
              <TouchableOpacity
                onPress={() => setUsernameInput("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => setEditOpen(false)}
              activeOpacity={0.9}
            >
              <Text style={styles.ghostBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !usernameInput.trim() && { opacity: 0.5 },
              ]}
              onPress={handleSaveName}
              disabled={!usernameInput.trim() || !!savingName}
              activeOpacity={0.9}
            >
              {savingName ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const headerCard = (
    <View style={styles.profileCard}>
      <View style={styles.avatarRow}>
        <Ionicons name="person-circle-outline" size={60} color="#CBD5E1" />
        <View style={{ flex: 1 }}>
          <Text style={styles.nameText}>
            {profile?.username ?? "이름 없음"}
          </Text>
          <Text style={styles.subText}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.segment}>
        <View
          style={[
            styles.segmentIndicator,
            tab === "comments" && { left: "50%" },
          ]}
        />
        <Pressable
          style={styles.segmentBtn}
          onPress={() => setTab("posts")}
          android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
        >
          <Text
            style={[
              styles.segmentText,
              tab === "posts" && styles.segmentTextActive,
            ]}
          >
            게시글 {postCount}
          </Text>
        </Pressable>
        <Pressable
          style={styles.segmentBtn}
          onPress={() => setTab("comments")}
          android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
        >
          <Text
            style={[
              styles.segmentText,
              tab === "comments" && styles.segmentTextActive,
            ]}
          >
            댓글 {commentCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 프로필</Text>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.headerIconBtn}
            activeOpacity={0.85}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={COLORS.tint}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      {tab === "posts" ? (
        <FlatList<Post>
          ListHeaderComponent={headerCard}
          data={posts ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                Platform.OS === "ios" && pressed && { opacity: 0.96 },
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              onPress={() => router.push(`/post/${item.id}` as any)}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!!item.content && (
                <Text style={styles.cardBody} numberOfLines={2}>
                  {item.content}
                </Text>
              )}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="calendar-outline" size={14} color="#9AA0A6" />
                  <Text style={styles.cardMeta}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons
                  name="document-text-outline"
                  size={36}
                  color="#CBD5E1"
                />
                <Text style={styles.empty}>작성한 글이 없습니다.</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={styles.listContent}
          overScrollMode="never"
        />
      ) : (
        <FlatList<Comment>
          ListHeaderComponent={headerCard}
          data={comments ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                Platform.OS === "ios" && pressed && { opacity: 0.96 },
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              onPress={() => router.push(`/post/${item.postId}` as any)}
            >
              <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={14}
                    color="#9AA0A6"
                  />
                  <Text style={styles.cardMeta}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons
                  name="document-text-outline"
                  size={36}
                  color="#CBD5E1"
                />
                <Text style={styles.empty}>작성한 댓글이 없습니다.</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={styles.listContent}
          overScrollMode="never"
        />
      )}

      {headerMenu}
      {editNameModal}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  headerArea: {
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  nameText: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  subText: { fontSize: 12, color: COLORS.sub, marginTop: 2 },

  smallGhostBtn: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallGhostText: { color: COLORS.text, fontWeight: "700", fontSize: 12 },

  segment: {
    marginTop: 16,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    position: "relative",
    flexDirection: "row",
    overflow: "hidden",
  },
  segmentIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "50%",
    height: 32,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  segmentText: { fontSize: 13, fontWeight: "700", color: COLORS.sub },
  segmentTextActive: { color: COLORS.text },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 21,
    marginBottom: 10,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
  },
  cardMeta: { fontSize: 12, color: COLORS.sub },

  empty: {
    textAlign: "center",
    marginTop: 32,
    color: COLORS.sub,
    fontSize: 14,
  },

  menuBackdrop: { position: "absolute", inset: 0 },
  menuCard: {
    position: "absolute",
    top: Platform.select({ ios: 70, android: 70 }),
    right: 16,
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  menuText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
  },

  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 16,
    elevation: 14,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
  },
  input: { flex: 1, fontSize: 16, color: COLORS.text },

  sheetActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  ghostBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  ghostBtnText: { color: COLORS.text, fontWeight: "700" },
  primaryBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
