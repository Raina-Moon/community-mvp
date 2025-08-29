import LoginRequired from "@/src/components/LoginRequired";
import { useDeletePostMutation } from "@/src/features/post/hooks/useDeletePost";
import { usePostQuery } from "@/src/features/post/hooks/usePosts";
import { useCreateCommentMutation } from "@/src/features/comment/hooks/useCreateComment";
import { useDeleteCommentMutation } from "@/src/features/comment/hooks/useDeleteComment";
import { useUpdateCommentMutation } from "@/src/features/comment/hooks/useUploadComment";
import { useAuthStore } from "@/src/store/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const COLORS = {
  bg: "#F7FAFC",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  line: "#E5E7EB",
  tint: "#111827",
  chipBg: "#F3F4F6",
  danger: "#DC2626",
};

const PostDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [commentText, setCommentText] = useState("");

  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";

  const { data, isLoading } = usePostQuery(id);
  const { width } = useWindowDimensions();

  const isMine = !!(user?.id && data?.authorId === user.id);

  const { mutateAsync: updateCommentMut, isPending: updatingComment } =
    useUpdateCommentMutation(id);
  const { mutateAsync: deleteCommentMut, isPending: deletingComment } =
    useDeleteCommentMutation(id);
  const { mutateAsync: removePost, isPending: removing } =
    useDeletePostMutation(id);
  const { mutateAsync: addComment, isPending: adding } =
    useCreateCommentMutation(id);

  const images = useMemo(() => data?.imageUrls ?? [], [data?.imageUrls]);
  const [index, setIndex] = useState(0);

  if (!user) {
    return (
      <LoginRequired
        redirectTo={`/post/${id}`}
        message="글을 보려면 로그인이 필요합니다."
      />
    );
  }
  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!data) return <Text>존재하지 않는 글입니다.</Text>;

  const createdAt = (data as any).createdAt ?? (data as any).created_at;
  const authorName = data.author?.username ?? "Unknown";
  const authorAvatar =
    (data.author as any)?.avatarUrl || (data.author as any)?.avatar_url;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i !== index) setIndex(i);
  };

  const submitComment = async () => {
    const body = commentText.trim();
    if (!body || adding) return;
    try {
      await addComment(body);
      setCommentText("");
    } catch (e: any) {
      Alert.alert("댓글 등록 실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  const confirmDeletePost = () => {
    Alert.alert("삭제할까요?", "삭제하면 되돌릴 수 없습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await removePost();
            router.replace("/");
          } catch (e: any) {
            Alert.alert("삭제 실패", e?.message ?? "다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  const startEdit = (commentId: string, initial: string) => {
    setEditingCommentId(commentId);
    setEditingText(initial);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    const commentId = editingCommentId!;
    const next = editingText.trim();
    if (!next) return Alert.alert("알림", "내용을 입력하세요");
    try {
      await updateCommentMut({ commentId, body: next });
      setEditingCommentId(null);
      setEditingText("");
    } catch (e: any) {
      Alert.alert("수정 실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    Alert.alert("삭제할까요?", "댓글은 되돌릴 수 없습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCommentMut(commentId);
          } catch (e: any) {
            Alert.alert("삭제 실패", e?.message ?? "다시 시도해 주세요.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          게시글
        </Text>
        {isMine ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push(`/post/edit/${id}`)}
              style={styles.headerIconBtn}
              disabled={removing}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDeletePost}
              style={styles.headerIconBtn}
              disabled={removing}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={removing ? "#bbb" : "#DC2626"}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerIconBtn} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={isIOS ? "padding" : "height"}
        keyboardVerticalOffset={insets.bottom}
      >
        <FlatList
          contentContainerStyle={{
            paddingBottom: (editingCommentId ? 92 : 76) + insets.bottom,
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.contentWrap}>
              <Text style={styles.title}>{data.title}</Text>

              <View style={styles.metaRow}>
                {authorAvatar ? (
                  <Image
                    source={{ uri: authorAvatar }}
                    style={styles.authorAvatar}
                  />
                ) : (
                  <View style={[styles.authorAvatar, styles.avatarFallback]}>
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      {authorName.slice(0, 1)}
                    </Text>
                  </View>
                )}
                <View style={styles.metaChip}>
                  <Ionicons name="person-outline" size={14} color="#9AA0A6" />
                  <Text style={styles.metaText}>{authorName}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={14} color="#9AA0A6" />
                  <Text style={styles.metaText}>{formatDate(createdAt)}</Text>
                </View>
              </View>

              {images.length > 0 && (
                <View style={styles.carouselCard}>
                  <FlatList
                    data={images}
                    keyExtractor={(uri, i) => `${uri}-${i}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    renderItem={({ item: uri }) => (
                      <Image
                        source={{ uri }}
                        style={[styles.image, { width: width - 32 }]}
                        resizeMode="cover"
                      />
                    )}
                  />
                  <View style={styles.dotsRow}>
                    {images.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.dot, i === index && styles.dotActive]}
                      />
                    ))}
                  </View>
                </View>
              )}

              {!!data.content && (
                <Text style={styles.bodyText}>{data.content}</Text>
              )}

              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                댓글 {data.comments?.length ?? 0}
              </Text>
            </View>
          }
          data={data.comments ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item: c }) => {
            const isMyComment = user?.id === c.authorId;
            const cAuthor = c.author?.username ?? "익명";
            const cDate = (c as any).createdAt ?? (c as any).created_at;
            const isEditing = editingCommentId === c.id;

            return (
              <View style={styles.commentItem}>
                <View style={[styles.commentAvatar, styles.avatarFallback]}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>
                    {cAuthor.slice(0, 1)}
                  </Text>
                </View>

                <View style={styles.bubble}>
                  <View style={styles.commentTopRow}>
                    <Text style={styles.commentAuthor}>{cAuthor}</Text>
                    <Text style={styles.commentDate}>{formatDate(cDate)}</Text>

                    {!isEditing && isMyComment && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => startEdit(c.id, c.body)}
                        >
                          <Text style={styles.actionText}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => confirmDeleteComment(c.id)}
                          disabled={deletingComment}
                        >
                          <Text
                            style={[
                              styles.actionText,
                              { color: COLORS.danger },
                            ]}
                          >
                            {deletingComment ? "삭제중…" : "삭제"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {isEditing && (
                      <View style={styles.editTag}>
                        <Text style={{ color: "#334155", fontSize: 12 }}>
                          수정 중
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.commentBody}>{c.body}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 18 }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={32}
                color="#CBD5E1"
              />
              <Text style={{ color: COLORS.sub, marginTop: 6 }}>
                아직 댓글이 없어요.
              </Text>
            </View>
          }
          style={{ flex: 1, backgroundColor: COLORS.bg }}
        />

        {!editingCommentId ? (
          <View
            style={[
              styles.inputBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="댓글을 입력하세요"
              value={commentText}
              onChangeText={setCommentText}
              editable={!adding}
              returnKeyType="send"
              onSubmitEditing={submitComment}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!commentText.trim() || adding) && { opacity: 0.5 },
              ]}
              onPress={submitComment}
              disabled={!commentText.trim() || adding}
            >
              {adding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="paper-plane" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.editBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="댓글을 수정하세요"
              value={editingText}
              onChangeText={setEditingText}
              editable={!updatingComment}
              returnKeyType="send"
              onSubmitEditing={saveEdit}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.cancelBtn, updatingComment && { opacity: 0.6 }]}
              onPress={cancelEdit}
              disabled={updatingComment}
            >
              <Text style={{ fontWeight: "700", color: COLORS.text }}>
                취소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!editingText.trim() || updatingComment) && { opacity: 0.6 },
              ]}
              onPress={saveEdit}
              disabled={!editingText.trim() || updatingComment}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {updatingComment ? "저장중…" : "저장"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.card },

  header: {
    height: 52,
    backgroundColor: COLORS.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  contentWrap: { paddingHorizontal: 16, paddingTop: 12 },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
  },
  avatarFallback: {
    backgroundColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
  },
  metaText: { fontSize: 12, color: COLORS.sub },

  carouselCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 12,
  },
  image: { height: 320 },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff", width: 8, height: 8, borderRadius: 4 },

  bodyText: { fontSize: 16, lineHeight: 24, color: "#1F2937", marginTop: 8 },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    paddingHorizontal: 0,
    marginBottom: 8,
  },

  commentItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E5E7EB",
  },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  commentAuthor: { fontWeight: "800", color: COLORS.text },
  commentDate: { color: COLORS.sub, fontSize: 12, marginLeft: 2, flex: 1 },
  actionText: { fontSize: 12, color: COLORS.text, fontWeight: "700" },
  editTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#E0E7FF",
    borderRadius: 6,
  },
  commentBody: { lineHeight: 20, color: "#1F2937" },

  inputBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.line,
  },
  editBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.line,
  },

  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  saveBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: COLORS.tint,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PostDetailScreen;
