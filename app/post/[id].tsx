import LoginRequired from "@/src/components/LoginRequired";
import { useDeletePostMutation } from "@/src/features/post/hooks/useDeletePost";
import { usePostQuery } from "@/src/features/post/hooks/usePosts";
import { useCreateCommentMutation } from "@/src/hooks/useCreateComment";
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const PostDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const { data, isLoading } = usePostQuery(id);
  const { width } = useWindowDimensions();

  const isMine = user?.id && data?.authorId === user.id;

  const { mutateAsync: removePost, isPending: removing } =
    useDeletePostMutation(id);

  const images = useMemo(() => data?.imageUrls ?? [], [data?.imageUrls]);
  const [index, setIndex] = useState(0);
  const [commentText, setCommentText] = useState("");

  const insets = useSafeAreaInsets();

  const { mutateAsync: addComment, isPending: adding } =
    useCreateCommentMutation(id);

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

  const createdAt = (data as any).createdAt ?? (data as any).created_at;
  const authorName = data.author?.username ?? "Unknown";

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i !== index) setIndex(i);
  };

  const submitComment = async () => {
    const body = commentText.trim();
    if (!body) return;
    try {
      await addComment(body);
      setCommentText("");
    } catch (e: any) {
      Alert.alert("댓글 등록 실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  const confirmDelete = () => {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{data.title}</Text>

          {isMine && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/post/edit/${id}`)
                }
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "#eee",
                  borderRadius: 8,
                }}
              >
                <Text>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={removing}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: "#ffefef",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#c00" }}>
                  {removing ? "삭제중..." : "삭제"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.meta}>
            {authorName} · {formatDate(createdAt)}
          </Text>

          {images.length > 0 && (
            <View style={[styles.carouselWrap, { width }]}>
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
                    style={[styles.image, { width }]}
                    resizeMode="cover"
                  />
                )}
              />
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>
                  {index + 1} / {images.length}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.content}>{data.content}</Text>

          {/* 구분선 */}
          <View style={styles.hr} />

          <Text style={styles.sectionTitle}>
            댓글 {data.comments?.length ?? 0}
          </Text>

          {!data.comments || data.comments.length === 0 ? (
            <Text style={styles.empty}>아직 댓글이 없어요.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {data.comments.map((c) => {
                const cAuthor = c.author?.username ?? "익명";
                const cAvatar =
                  (c.author as any)?.avatarUrl || (c.author as any)?.avatar_url;
                const cDate = (c as any).createdAt ?? (c as any).created_at;
                return (
                  <View key={c.id} style={styles.commentRow}>
                    {cAvatar ? (
                      <Image source={{ uri: cAvatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          {cAuthor.slice(0, 1)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{cAuthor}</Text>
                        <Text style={styles.commentDate}>
                          {formatDate(cDate)}
                        </Text>
                      </View>
                      <Text style={styles.commentBody}>{c.body}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

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
            <Text style={styles.sendBtnText}>
              {adding ? "등록중..." : "등록"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  meta: { color: "#666", marginBottom: 12 },
  carouselWrap: { position: "relative", marginBottom: 12 },
  image: { height: 320, borderRadius: 10 },
  pageBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageBadgeText: { color: "#fff", fontWeight: "600" },
  content: { fontSize: 16, lineHeight: 22 },
  hr: { height: 1, backgroundColor: "#eee", marginVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  empty: { color: "#888" },
  commentRow: { flexDirection: "row", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#ddd" },
  avatarFallback: {
    backgroundColor: "#888",
    alignItems: "center",
    justifyContent: "center",
  },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentAuthor: { fontWeight: "700" },
  commentDate: { color: "#888", fontSize: 12 },
  commentBody: { marginTop: 4, lineHeight: 20 },
  inputBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700" },
});

export default PostDetailScreen;
