import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import { usePostQuery } from "@/src/hooks/usePosts";
import { useAuthStore } from "@/src/store/auth";
import { useUpdatePostMutation } from "@/src/hooks/useUpdatePost";
import { supabase } from "@/src/lib/supabase";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Pressable } from "react-native-gesture-handler";

type UploadPart = {
  name: string;
  type: string;
  buffer: ArrayBuffer;
  previewUri: string;
};
type PostImageRow = { path: string; url: string };

type ExistingItem = {
  key: string;
  kind: "existing";
  uri: string;
  path: string;
};
type NewItem = { key: string; kind: "new"; uri: string; name: string };
type GalleryItem = ExistingItem | NewItem;

const isExisting = (i: GalleryItem): i is ExistingItem => i.kind === "existing";

const extFromMime = (mime?: string) => {
  if (!mime) return "jpg";
  const m = mime.split("/")[1];
  return (m === "jpeg" ? "jpg" : m) || "jpg";
};

const PostEditScreen = () => {
  const { id: raw } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(raw) ? raw[0] : raw ?? "";
  const router = useRouter();
  const me = useAuthStore((s) => s.user);

  const { data, isLoading } = usePostQuery(id);
  const { mutateAsync: updatePost, isPending } = useUpdatePostMutation(id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [existing, setExisting] = useState<PostImageRow[]>([]);
  const [removePaths, setRemovePaths] = useState<Set<string>>(new Set());

  const [addFiles, setAddFiles] = useState<UploadPart[]>([]);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const initializedRef = useRef(false);

  const isMine = useMemo(
    () => !!(me && data && data.authorId === me.id),
    [me, data]
  );

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setContent(data.content);
    }
  }, [data]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: rows, error } = await supabase
        .from("post_images")
        .select("path, created_at")
        .eq("post_id", id)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn(error);
        return;
      }
      const list: PostImageRow[] =
        rows?.map((r) => ({
          path: r.path,
          url: supabase.storage.from("post_images").getPublicUrl(r.path).data
            .publicUrl,
        })) ?? [];
      setExisting(list);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (existing.length === 0) return;
    const initial: GalleryItem[] = existing.map((ex) => ({
      key: `ex-${ex.path}`,
      kind: "existing",
      uri: ex.url,
      path: ex.path,
    }));
    setGallery(initial);
    initializedRef.current = true;
  }, [existing]);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
      base64: true,
    });
    if (res.canceled) return;

    const newUploads: UploadPart[] = [];
    const newGallery: GalleryItem[] = [];

    for (const a of res.assets) {
      let b64 = a.base64;
      if (!b64) {
        b64 = await FileSystem.readAsStringAsync(a.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      const type = a.mimeType || "image/jpeg";
      const ext = extFromMime(a.mimeType);
      const name = `${uuidv4()}.${ext}`;
      const buffer = decode(b64!);
      const previewUri = a.uri;
      newUploads.push({ name, type, buffer, previewUri });
      newGallery.push({
        key: `new-${name}`,
        kind: "new",
        uri: previewUri,
        name,
      });
    }

    setAddFiles((prev) => [...prev, ...newUploads]);
    setGallery((prev) => [...prev, ...newGallery]);
  };

  const onPressRemove = (item: GalleryItem) => {
    if (isExisting(item)) {
      setRemovePaths((prev) => {
        const next = new Set(prev);
        if (next.has(item.path)) {
          next.delete(item.path);
        } else {
          next.add(item.path);
        }
        return next;
      });
    } else {
      setGallery((prev) => prev.filter((g) => g.key !== item.key));
      setAddFiles((prev) => prev.filter((f) => f.name !== item.name));
    }
  };

  const onSave = async () => {
    if (!isMine) {
      Alert.alert("권한 없음", "작성자만 수정할 수 있습니다.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      Alert.alert("입력 확인", "제목과 내용을 입력하세요.");
      return;
    }

    const addOrderNames = gallery
      .filter((g) => g.kind === "new")
      .map((g) => (g as any).name as string);

    const addFilesOrdered =
      addOrderNames.length === addFiles.length
        ? addOrderNames
            .map((nm) => addFiles.find((f) => f.name === nm)!)
            .filter(Boolean)
        : addFiles;

    const reorderPaths = gallery
      .filter((g) => g.kind === "existing")
      .map((g) => (g as any).path as string)
      .filter((p) => !removePaths.has(p));

    try {
      await updatePost({
        id,
        title: title.trim(),
        content: content.trim(),
        addFiles: addFilesOrdered.length ? addFilesOrdered : undefined,
        removePaths: removePaths.size ? Array.from(removePaths) : undefined,
        reorderPaths,
      });

      Alert.alert("완료", "수정되었습니다.", [
        {
          text: "확인",
          onPress: () =>
            router.replace({ pathname: "/post/[id]", params: { id } }),
        },
      ]);
    } catch (e: any) {
      Alert.alert("수정 실패", e?.message ?? "다시 시도해 주세요.");
    }
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!data)
    return <Text style={{ padding: 16 }}>존재하지 않는 글입니다.</Text>;
  if (!isMine)
    return <Text style={{ padding: 16 }}>작성자만 수정할 수 있습니다.</Text>;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.h1}>글 수정</Text>

        <TextInput
          style={styles.input}
          placeholder="제목"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { height: 160 }]}
          multiline
          placeholder="내용"
          value={content}
          onChangeText={setContent}
        />

        {gallery.length > 0 && (
          <>
            <Text style={styles.section}>이미지 (꾹 눌러 순서 변경)</Text>

            <DraggableFlatList<GalleryItem>
              data={gallery}
              keyExtractor={(item) => item.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              onDragEnd={({ data }) => setGallery(data)}
              activationDistance={10}
              dragItemOverflow
              contentContainerStyle={{ paddingVertical: 4, marginBottom: 12 }}
              renderItem={({ item, drag, isActive, getIndex }) => {
                const marked = isExisting(item) && removePaths.has(item.path);

                return (
                  <ScaleDecorator>
                    <View style={{ marginRight: 8 }}>
                      <View style={{ position: "relative" }}>
                        <Pressable
                          onLongPress={drag}
                          delayLongPress={160}
                          disabled={isActive}
                          style={{ borderRadius: 8, overflow: "hidden" }}
                        >
                          <Image
                            source={{ uri: item.uri }}
                            style={[styles.thumb, isActive && { opacity: 0.8 }]}
                          />
                        </Pressable>

                        {marked && (
                          <View pointerEvents="none" style={styles.overlay}>
                            <Text style={{ color: "#fff", fontWeight: "700" }}>
                              삭제
                            </Text>
                          </View>
                        )}

                        <Pressable
                          onPress={() => onPressRemove(item)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          style={[styles.remove, { zIndex: 2 }]}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            ×
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </ScaleDecorator>
                );
              }}
            />
          </>
        )}

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.btn, styles.gray]}
            onPress={pickImages}
          >
            <Text style={styles.btnText}>이미지 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, isPending && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={isPending}
          >
            <Text style={styles.btnText}>
              {isPending ? "저장 중..." : "저장"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  section: { fontWeight: "700", marginTop: 6, marginBottom: 8 },
  thumb: { width: 100, height: 100, borderRadius: 8, backgroundColor: "#eee" },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    flex: 1,
  },
  gray: { backgroundColor: "#555" },
  btnText: { color: "#fff", fontWeight: "600" },
});

export default PostEditScreen;
