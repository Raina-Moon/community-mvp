import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Pressable } from "react-native-gesture-handler";

export type UploadPart = { name: string; type: string; buffer: ArrayBuffer };
export type ExistingImage = { path: string; url: string };

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

export type PostEditorEditProps = {
  header?: string;
  submitLabel?: string;
  initialTitle: string;
  initialContent: string;
  existingImages: ExistingImage[];
  isBusy?: boolean;
  onSubmit: (payload: {
    title: string;
    content: string;
    addFiles?: UploadPart[];
    removePaths?: string[];
    reorderPaths?: string[];
  }) => Promise<void> | void;
};

export default function PostEditorEdit({
  header = "글 수정",
  submitLabel = "수정하기",
  initialTitle,
  initialContent,
  existingImages,
  isBusy = false,
  onSubmit,
}: PostEditorEditProps) {
  const [title, setTitle] = React.useState(initialTitle);
  const [content, setContent] = React.useState(initialContent);

  const [gallery, setGallery] = React.useState<GalleryItem[]>(
    existingImages.map((ex) => ({
      key: `ex-${ex.path}`,
      kind: "existing",
      uri: ex.url,
      path: ex.path,
    }))
  );
  const [removed, setRemoved] = React.useState<Set<string>>(new Set());
  const [addFiles, setAddFiles] = React.useState<UploadPart[]>([]);

  const pickImages = React.useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
      base64: true,
    });
    if (res.canceled) return;

    const nextUploads: UploadPart[] = [];
    const nextGallery: GalleryItem[] = [];

    for (const a of res.assets) {
      const type = a.mimeType || "image/jpeg";
      const ext = extFromMime(a.mimeType);
      const name = `${uuidv4()}.${ext}`;
      const base64 =
        a.base64 ??
        (await FileSystem.readAsStringAsync(a.uri, {
          encoding: FileSystem.EncodingType.Base64,
        }));
      nextUploads.push({ name, type, buffer: decode(base64) });
      nextGallery.push({ key: `new-${name}`, kind: "new", uri: a.uri, name });
    }

    setAddFiles((prev) => [...prev, ...nextUploads]);
    setGallery((prev) => [...prev, ...nextGallery]);
  }, []);

  const toggleRemove = (item: GalleryItem) => {
    if (isExisting(item)) {
      setRemoved((prev) => {
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

  const handleSubmit = async () => {
    if (isBusy) return;
    if (!title.trim() || !content.trim()) return;

    const newOrderNames = gallery
      .filter((g) => g.kind === "new")
      .map((g) => (g as NewItem).name);
    const orderedAddFiles =
      newOrderNames.length === addFiles.length
        ? newOrderNames
            .map((nm) => addFiles.find((f) => f.name === nm)!)
            .filter(Boolean)
        : addFiles;

    const reorderPaths = gallery
      .filter((g) => g.kind === "existing")
      .map((g) => (g as ExistingItem).path)
      .filter((p) => !removed.has(p));

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      addFiles: orderedAddFiles.length ? orderedAddFiles : undefined,
      removePaths: removed.size ? Array.from(removed) : undefined,
      reorderPaths,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingBottom: 140 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>{header}</Text>
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
          <DraggableFlatList
            data={gallery}
            keyExtractor={(it) => it.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            onDragEnd={({ data }) => setGallery(data)}
            activationDistance={10}
            dragItemOverflow
            contentContainerStyle={{ paddingVertical: 4, marginBottom: 12 }}
            renderItem={({ item, drag, isActive }) => {
              const marked = isExisting(item) && removed.has(item.path);
              const uri =
                item.kind === "existing" ? item.uri : (item as NewItem).uri;
              return (
                <ScaleDecorator>
                  <View style={{ marginRight: 8, position: "relative" }}>
                    <Pressable
                      onLongPress={drag}
                      delayLongPress={160}
                      disabled={isActive}
                      style={{ borderRadius: 8, overflow: "hidden" }}
                    >
                      <Image
                        source={{ uri }}
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
                      onPress={() => toggleRemove(item)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      style={[styles.remove, { zIndex: 2 }]}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>
                        ×
                      </Text>
                    </Pressable>
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        )}

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.btn, styles.gray]}
            onPress={pickImages}
          >
            <Text style={styles.btnText}>이미지 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, isBusy && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isBusy}
          >
            <Text style={styles.btnText}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
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
});
