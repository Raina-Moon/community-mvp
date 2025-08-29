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
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Pressable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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

const TITLE_MAX = 60;
const CONTENT_MAX = 5000;
const PAGE_BAR_HEIGHT = 64;

const COLORS = {
  bg: "#fff",
  card: "#fff",
  line: "#EAEAEA",
  text: "#111",
  textSub: "#8A8A96",
  textWeak: "#7C7C83",
  primary: "#4F46E5",
  danger: "#EF4444",
  focus: "#6366F1",
  inputBg: "#fff",
};

const extFromMime = (mime?: string) => {
  if (!mime) return "jpg";
  const m = mime.split("/")[1];
  return (m === "jpeg" ? "jpg" : m) || "jpg";
};

export type PostEditorEditProps = {
  header?: string;
  subHeader?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialTitle: string;
  initialContent: string;
  existingImages: ExistingImage[];
  isBusy?: boolean;
  onCancel?: () => void;
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
  subHeader = "이미지는 길게 눌러 순서를 바꾸고, × 로 제거할 수 있어요.",
  submitLabel = "수정하기",
  cancelLabel = "취소",
  initialTitle,
  initialContent,
  existingImages,
  isBusy = false,
  onCancel,
  onSubmit,
}: PostEditorEditProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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
  const [submitting, setSubmitting] = React.useState(false);

  const [titleFocused, setTitleFocused] = React.useState(false);
  const [contentFocused, setContentFocused] = React.useState(false);

  const disabled = isBusy || submitting;

  const titleError =
    title.trim().length === 0
      ? "제목을 입력해주세요."
      : title.length > TITLE_MAX
      ? "제목이 너무 길어요."
      : "";
  const contentError =
    content.trim().length === 0
      ? "내용을 입력해주세요."
      : content.length > CONTENT_MAX
      ? "내용이 너무 길어요."
      : "";

  const canSubmit =
    !disabled &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    title.length <= TITLE_MAX &&
    content.length <= CONTENT_MAX;

  const firstImage = gallery.find(Boolean);

  const pickImages = React.useCallback(async () => {
    if (disabled) return;
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [disabled]);

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
      setAddFiles((prev) =>
        prev.filter((f) => f.name !== (item as NewItem).name)
      );
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSubmitting(true);
    try {
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.h1}>{header}</Text>
          {!!subHeader && <Text style={styles.subHeader}>{subHeader}</Text>}
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.wrap,
            {
              paddingBottom: 24 + PAGE_BAR_HEIGHT + Math.max(insets.bottom, 12),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {firstImage ? (
            <View style={styles.thumbCard}>
              <Image
                source={{ uri: (firstImage as any).uri }}
                style={[
                  styles.thumbHero,
                  { width: width - 32, height: (width - 32) * 0.56 },
                ]}
                resizeMode="cover"
              />
              <View style={styles.thumbMeta}>
                <View style={styles.badge}>
                  <Ionicons
                    name="images-outline"
                    size={14}
                    color={COLORS.text}
                  />
                  <Text style={styles.badgeText}>{gallery.length}</Text>
                </View>
                <Text style={styles.thumbHint}>
                  첫 이미지는 썸네일로 사용돼요
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="이미지 선택"
              onPress={pickImages}
              style={styles.emptyThumb}
              disabled={disabled}
            >
              <Ionicons name="image-outline" size={22} color={COLORS.textSub} />
              <Text style={styles.emptyThumbText}>이미지 추가</Text>
            </TouchableOpacity>
          )}

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>제목</Text>
              <Text
                style={[
                  styles.counter,
                  title.length > TITLE_MAX && styles.counterError,
                ]}
              >
                {title.length}/{TITLE_MAX}
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                titleFocused && styles.inputFocused,
                !!titleError && styles.inputError,
              ]}
              placeholder="예) 오늘의 배움 기록"
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              maxLength={TITLE_MAX + 200}
              returnKeyType="next"
            />
            {!!titleError && <Text style={styles.errorText}>{titleError}</Text>}
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>내용</Text>
              <Text
                style={[
                  styles.counter,
                  content.length > CONTENT_MAX && styles.counterError,
                ]}
              >
                {content.length}/{CONTENT_MAX}
              </Text>
            </View>
            <AutoGrowTextInput
              style={[
                styles.input,
                styles.multiline,
                contentFocused && styles.inputFocused,
                !!contentError && styles.inputError,
              ]}
              placeholder="무슨 일이 있었나요?"
              value={content}
              onChangeText={setContent}
              onFocus={() => setContentFocused(true)}
              onBlur={() => setContentFocused(false)}
              maxLength={CONTENT_MAX + 1000}
            />
            {!!contentError && (
              <Text style={styles.errorText}>{contentError}</Text>
            )}
          </View>

          {gallery.length > 0 && (
            <View style={styles.assetsBlock}>
              <View style={styles.assetsHeader}>
                <Text style={styles.assetsTitle}>이미지</Text>
                <Text style={styles.assetsHint}>
                  길게 눌러 순서 변경 · 탭하여 제거
                </Text>
              </View>

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
                          disabled={isActive || disabled}
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
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                            toggleRemove(item);
                          }}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          style={[
                            styles.remove,
                            {
                              zIndex: 2,
                              backgroundColor: marked ? COLORS.danger : "#000",
                            },
                          ]}
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
            </View>
          )}

          <View style={styles.inlineActions}>
            <ChipButton
              icon="add-circle-outline"
              label="이미지 추가"
              onPress={pickImages}
              disabled={disabled}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBarWrap}>
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(12, insets.bottom) },
            ]}
          >
            {!!onCancel && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="수정 취소"
                onPress={onCancel}
                style={[styles.barBtn, styles.barBtnGhost]}
                disabled={disabled}
              >
                <Text style={[styles.barBtnText, styles.barBtnGhostText]}>
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="수정하기"
              onPress={handleSubmit}
              style={[
                styles.barBtn,
                styles.barBtnPrimary,
                (!canSubmit || disabled) && styles.barBtnDisabled,
              ]}
              disabled={!canSubmit || disabled}
            >
              <Text style={styles.barBtnText}>
                {disabled ? "수정 중..." : submitLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AutoGrowTextInput({
  style,
  value,
  onChangeText,
  ...rest
}: React.ComponentProps<typeof TextInput>) {
  const [height, setHeight] = React.useState(160);
  return (
    <TextInput
      {...rest}
      multiline
      value={value}
      onChangeText={onChangeText}
      onContentSizeChange={(e) => {
        const h = Math.max(
          160,
          Math.min(800, e.nativeEvent.contentSize.height)
        );
        setHeight(h);
      }}
      style={[style, { height }]}
      textAlignVertical="top"
    />
  );
}

function ChipButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.chipBtn, disabled && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={COLORS.text} />
      <Text style={styles.chipBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  h1: { color: COLORS.text, fontSize: 22, fontWeight: "800", marginBottom: 6 },
  subHeader: { color: COLORS.textSub, fontSize: 13, lineHeight: 18 },

  wrap: { paddingHorizontal: 16, backgroundColor: COLORS.bg },

  field: { marginTop: 16 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  counter: { color: COLORS.textWeak, fontSize: 12 },
  counterError: { color: COLORS.danger },

  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  multiline: { paddingTop: 12, paddingBottom: 12 },
  inputFocused: {
    borderColor: COLORS.focus,
    shadowColor: COLORS.focus,
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { marginTop: 6, color: COLORS.danger, fontSize: 12 },

  thumbCard: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  thumbHero: { alignSelf: "center" },
  thumbMeta: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  badgeText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  thumbHint: { color: COLORS.textWeak, fontSize: 12 },

  emptyThumb: {
    marginTop: 8,
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyThumbText: { color: COLORS.textSub, fontSize: 13, fontWeight: "600" },

  assetsBlock: { marginTop: 20 },
  assetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  assetsTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  assetsHint: { color: COLORS.textWeak, fontSize: 12 },

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

  inlineActions: { marginTop: 12, flexDirection: "row", gap: 8 },
  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.inputBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chipBtnText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },

  bottomBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  barBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  barBtnPrimary: { backgroundColor: COLORS.primary },
  barBtnDisabled: { opacity: 0.6 },
  barBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  barBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  barBtnGhostText: { color: COLORS.text },
});
