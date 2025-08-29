import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/auth";
import { useLocalSearchParams, useRouter } from "expo-router";

const COLORS = {
  bg: "#F7FAFC",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  line: "#E5E7EB",
  tint: "#111827",
  inputBg: "#F3F4F6",
};

export default function SignInScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const pwRef = useRef<TextInput>(null);

  const goAfterLogin = () => {
    if (redirect === "/post/create") {
      router.replace("/post/create");
    } else if (
      typeof redirect === "string" &&
      /^\/post\/[^/]+$/.test(redirect)
    ) {
      const id = redirect.split("/").pop()!;
      router.replace({ pathname: "/post/[id]", params: { id } });
    } else {
      router.replace("/");
    }
  };

  const onSubmit = async () => {
    if (submitting) return;
    const mail = email.trim();
    if (!mail || !password) {
      return Alert.alert("알림", "이메일과 비밀번호를 입력하세요.");
    }
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      return Alert.alert("알림", "이메일 형식이 올바르지 않습니다.");
    }

    setSubmitting(true);
    try {
      await signIn(mail, password);
      goAfterLogin();
    } catch (e: any) {
      Alert.alert("로그인 실패", e?.message ?? "다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} translucent={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>모두의 광장</Text>
            <TouchableOpacity
              onPress={() => router.replace("/")}
              style={styles.topIconBtn}
            >
              <Ionicons name="home-outline" size={20} color={COLORS.tint} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>로그인</Text>
            <Text style={styles.subtitle}>
              계정에 접속해 서비스를 이용해 보세요.
            </Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={COLORS.sub} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="이메일"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
                autoFocus
              />
            </View>

            <View style={[styles.inputWrap, { marginTop: 10 }]}>
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={COLORS.sub}
              />
              <TextInput
                ref={pwRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPw}
                textContentType="password"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPw((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <Pressable
              onPress={onSubmit}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              style={({ pressed }) => [
                styles.btn,
                pressed && Platform.OS === "ios" ? { opacity: 0.95 } : null,
                (!email.trim() || !password || submitting) && { opacity: 0.6 },
              ]}
              disabled={!email.trim() || !password || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>로그인</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <View style={styles.divider} />
              <View style={styles.signupRow}>
                <Text style={styles.subtleText}>아직 계정이 없으신가요?</Text>
                <TouchableOpacity
                  onPress={() => router.push("/auth/sign-up")}
                  activeOpacity={0.9}
                  style={styles.signupBtn}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={16}
                    color={COLORS.tint}
                  />
                  <Text style={styles.signupBtnText}>회원가입</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: "center",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  topIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { marginTop: 6, fontSize: 13, color: COLORS.sub },

  inputWrap: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },

  btn: {
    marginTop: 16,
    backgroundColor: COLORS.tint,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  footer: { marginTop: 18 },
  divider: { height: 1, backgroundColor: "rgba(17,24,39,0.06)" },
  signupRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subtleText: { fontSize: 12, color: COLORS.sub },
  signupBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signupBtnText: { color: COLORS.text, fontWeight: "800", fontSize: 13 },
});
