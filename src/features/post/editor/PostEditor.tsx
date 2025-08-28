import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import AssetDraggableList from "@/src/features/post/components/AssetDraggableList";
import { useImageAssets } from "@/src/features/post/editor/useImageAssets";
import { assetsToUploads, extFromMime, UploadFile } from "../utils/imageUpload";

export type PostEditorValues = {
  title: string;
  content: string;
  assets: ImagePicker.ImagePickerAsset[];
};

export type PostEditorProps = {
  header?: string;
  submitLabel?: string;
  initialTitle?: string;
  initialContent?: string;
  initialAssets?: ImagePicker.ImagePickerAsset[];
  isBusy?: boolean;
  onSubmit: (
    values: PostEditorValues,
    files?: UploadFile[]
  ) => Promise<void> | void;
};

export default function PostEditor({
  header = "새 글 작성",
  submitLabel = "작성하기",
  initialTitle = "",
  initialContent = "",
  initialAssets = [],
  isBusy = false,
  onSubmit,
}: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const { assets, pickImages, removeAt, reorder } =
    useImageAssets(initialAssets);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting || isBusy) return;
    if (!title.trim() || !content.trim()) {
      // Let parent handle Alerting if they wish; simple guard here
      return;
    }
    setSubmitting(true);
    try {
      const files = assets.length
        ? await assetsToUploads(
            assets,
            (a) => `${uuidv4()}.${extFromMime(a.mimeType)}`
          )
        : undefined;
      await onSubmit(
        { title: title.trim(), content: content.trim(), assets },
        files
      );
    } finally {
      setSubmitting(false);
    }
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

        <AssetDraggableList
          assets={assets}
          onReorder={reorder}
          onRemoveAt={removeAt}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.btn, styles.gray]}
            onPress={pickImages}
          >
            <Text style={styles.btnText}>이미지 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, (submitting || isBusy) && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting || isBusy}
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
});
