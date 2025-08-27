import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  Image,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";
import LoginRequired from "@/src/components/LoginRequired";
import { useCreatePostMutation } from "@/src/hooks/useCreatePost";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutateAsync, isPending } = useCreatePostMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <LoginRequired
        redirectTo="/post/create"
        message="글을 작성하려면 로그인이 필요합니다."
      />
    );
  }

  const pickImages = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.9,
    base64: true,              
  });
  if (!res.canceled) setAssets(prev => [...prev, ...res.assets]);
};
  const removeAt = (idx: number) =>
    setAssets((prev) => prev.filter((_, i) => i !== idx));

  const extFromMime = (mime?: string) => {
  if (!mime) return "jpg";
  const m = mime.split("/")[1];
  return (m === "jpeg" ? "jpg" : m) || "jpg";
};

  const toUploads = async (assets: ImagePicker.ImagePickerAsset[]) => {
  return Promise.all(
    assets.map(async (a) => {
      const type = a.mimeType || "image/jpeg";
      const ext = extFromMime(a.mimeType);
      const name = `${uuidv4()}.${ext}`;

      let b64 = a.base64;

      if (!b64) {
        b64 = await FileSystem.readAsStringAsync(a.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const buffer = decode(b64!);
      return { name, type, buffer };
    })
  );
};

  const onSubmit = async () => {
    if (submitting) return;
    if (!title.trim() || !content.trim()) {
      Alert.alert("입력 확인", "제목과 내용을 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
    const files = assets.length ? await toUploads(assets) : undefined;
    const p = await mutateAsync({
      title: title.trim(),
      content: content.trim(),
      files,
    });
    router.replace({ pathname: "/post/[id]", params: { id: p.id } });
  } catch (e: any) {
    Alert.alert("작성 실패", e?.message ?? "다시 시도해 주세요.");
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
        <Text style={styles.h1}>새 글 작성</Text>

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

        {assets.length > 0 && (
          <FlatList
            data={assets}
            keyExtractor={(item, i) => `${item.assetId ?? item.uri}-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            renderItem={({ item, index }) => (
              <View style={styles.thumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.remove}
                  onPress={() => removeAt(index)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.btn, styles.gray]}
            onPress={pickImages}
          >
            <Text style={styles.btnText}>이미지 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, (submitting || isPending) && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={submitting || isPending}
          >
            <Text style={styles.btnText}>작성하기</Text>
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
  thumbWrap: { marginRight: 8 },
  thumb: { width: 84, height: 84, borderRadius: 8 },
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
