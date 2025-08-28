import { formatDate } from "@/src/utils/date";
import React, { memo } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  profile: { username?: string | null; createdAt?: string } | undefined;
  editing: boolean;
  usernameInput: string;
  onChangeUsername: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveName: () => void;
  savingName: boolean;
  onSignOut: () => void;
  tab: "posts" | "comments";
  setTab: (t: "posts" | "comments") => void;
  postsLen?: number;
  commentsLen?: number;
};

const ProfileHeader = ({
  profile,
  editing,
  usernameInput,
  onChangeUsername,
  onStartEdit,
  onCancelEdit,
  onSaveName,
  savingName,
  onSignOut,
  tab,
  setTab,
  postsLen,
  commentsLen,
}: Props) => {
  const pristine = (profile?.username ?? "") === usernameInput.trim();
  const canSave = !!usernameInput.trim() && !savingName && !pristine;

  return (
    <View style={styles.headerBox}>
      <Text style={styles.heading}>My Profile</Text>

      <View style={styles.profileBox}>
        {!editing ? (
          <View style={styles.row}>
            <Text style={styles.username}>
              {profile?.username ?? "(no username)"}
            </Text>
            <TouchableOpacity style={styles.editBtn} onPress={onStartEdit}>
              <Text style={styles.editText}>수정</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editRow}>
            <TextInput
              value={usernameInput}
              onChangeText={onChangeUsername}
              placeholder="닉네임 (2~20자)"
              maxLength={20}
              autoCapitalize="none"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!canSave) {
                  if (!usernameInput.trim())
                    Alert.alert("알림", "닉네임을 입력하세요");
                  return;
                }
                onSaveName();
              }}
              style={styles.input}
              editable={!savingName}
            />
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && { opacity: 0.6 }]}
              onPress={onSaveName}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>
                {savingName ? "저장중..." : "저장"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancelEdit}
              disabled={savingName}
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.createdAt}>
          Joined: {formatDate(profile?.createdAt ?? "")}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut}>
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
            내 글{typeof postsLen === "number" ? ` (${postsLen})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("comments")}
          style={[styles.tabBtn, tab === "comments" && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, tab === "comments" && styles.tabTextActive]}
          >
            내 댓글{typeof commentsLen === "number" ? ` (${commentsLen})` : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(ProfileHeader);

const styles = StyleSheet.create({
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
});
