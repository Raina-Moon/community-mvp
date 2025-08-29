import React, { useMemo, useState } from "react";
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
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AssetDraggableList from "@/src/features/post/components/AssetDraggableList";
import { useImageAssets } from "@/src/features/post/editor/useImageAssets";
import { assetsToUploads, extFromMime, UploadFile } from "../utils/imageUpload";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const TITLE_MAX = 60;
const CONTENT_MAX = 5000;

export type PostEditorValues = {
  title: string;
  content: string;
  assets: ImagePicker.ImagePickerAsset[];
};

export type PostEditorProps = {
  header?: string;
  subHeader?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialTitle?: string;
  initialContent?: string;
  initialAssets?: ImagePicker.ImagePickerAsset[];
  isBusy?: boolean;
  onCancel?: () => void;
  onSubmit: (
    values: PostEditorValues,
    files?: UploadFile[]
  ) => Promise<void> | void;
};

export default function PostEditor({
  header = "새 글 작성",
  subHeader,
  submitLabel = "작성하기",
  cancelLabel = "취소",
  initialTitle = "",
  initialContent = "",
  initialAssets = [],
  isBusy = false,
  onCancel,
  onSubmit,
}: PostEditorProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const { assets, pickImages, removeAt, reorder } =
    useImageAssets(initialAssets);
  const [submitting, setSubmitting] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  const firstImage = assets[0];
  const disabled = submitting || isBusy;

  const titleCount = `${title.length}/${TITLE_MAX}`;
  const contentCount = `${content.length}/${CONTENT_MAX}`;

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

  const canSubmit = useMemo(() => {
    return (
      !disabled &&
      title.trim().length > 0 &&
      content.trim().length > 0 &&
      title.length <= TITLE_MAX &&
      content.length <= CONTENT_MAX
    );
  }, [disabled, title, content]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
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
            { paddingBottom: 24 + 64 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {firstImage ? (
            <View style={styles.thumbCard}>
              <Image
                source={{ uri: firstImage.uri }}
                style={[
                  styles.thumb,
                  { width: width - 32, height: (width - 32) * 0.56 },
                ]}
                resizeMode="cover"
              />
              <View style={styles.thumbMeta}>
                <View style={styles.badge}>
                  <Ionicons name="images-outline" size={14} />
                  <Text style={styles.badgeText}>{assets.length}</Text>
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
            >
              <Ionicons name="image-outline" size={22} />
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
                {titleCount}
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
                {contentCount}
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

          {assets.length > 0 && (
            <View style={styles.assetsBlock}>
              <View style={styles.assetsHeader}>
                <Text style={styles.assetsTitle}>이미지</Text>
                <Text style={styles.assetsHint}>
                  길게 눌러 순서 변경 · 탭하여 제거
                </Text>
              </View>
              <AssetDraggableList
                assets={assets}
                onReorder={reorder}
                onRemoveAt={(i) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  removeAt(i);
                }}
              />
            </View>
          )}

          <View style={styles.inlineActions}>
            <ChipButton
              icon="add-circle-outline"
              label="이미지 선택"
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
                accessibilityLabel="작성 취소"
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
              accessibilityLabel="작성하기"
              onPress={handleSubmit}
              style={[
                styles.barBtn,
                styles.barBtnPrimary,
                (!canSubmit || disabled) && styles.barBtnDisabled,
              ]}
              disabled={!canSubmit || disabled}
            >
              <Text style={styles.barBtnText}>
                {disabled ? "작성 중..." : submitLabel}
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
  const [height, setHeight] = useState(160);
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
      <Ionicons name={icon} size={16} />
      <Text style={styles.chipBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const COLORS = {
  bg: "#fff",
  card: "#fff",
  line: "#fff",
  text: "#111",
  textSub: "#A8A8AE",
  textWeak: "#7C7C83",
  primary: "#4F46E5",
  danger: "#EF4444",
  focus: "#6366F1",
  inputBg: "#fff",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  h1: { color: COLORS.text, fontSize: 22, fontWeight: "800", marginBottom: 6 },
  subHeader: { color: COLORS.textSub, fontSize: 13, lineHeight: 18 },

  wrap: { paddingHorizontal: 16 },

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
    shadowOpacity: 0.3,
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
  thumb: { alignSelf: "center" },
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
  barBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  barBtnDisabled: {
    opacity: 0.6,
  },
  barBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  barBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  barBtnGhostText: { color: COLORS.text },
});
