import React, { useMemo, useRef, useState } from "react";
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
import { useRouter, Href, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../src/store/auth";

const COLORS = {
  bg: "#F7FAFC",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  line: "#E5E7EB",
  tint: "#111827",
  inputBg: "#F3F4F6",
  danger: "#DC2626",
  success: "#16A34A",
  warn: "#F59E0B",
};

export default function SignUpScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const userRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const pw2Ref = useRef<TextInput>(null);

  const emailTrim = email.trim();
  const usernameTrim = username.trim();

  const isEmailValid = useMemo(() => /^\S+@\S+\.\S+$/.test(emailTrim), [emailTrim]);
  const isUsernameValid = useMemo(() => usernameTrim.length >= 2 && usernameTrim.length <= 20, [usernameTrim]);
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    if (score <= 2) return { label: "약함", color: COLORS.danger };
    if (score === 3) return { label: "보통", color: COLORS.warn };
    return { label: "강함", color: COLORS.success };
  }, [password]);
  const isPasswordOk = password.length >= 8;
  const isMatch = password2.length > 0 && password === password2;

  const canSubmit = isEmailValid && isUsernameValid && isPasswordOk && isMatch && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) {
      if (!isEmailValid) return Alert.alert("입력 확인", "올바른 이메일을 입력하세요.");
      if (!isUsernameValid) return Alert.alert("입력 확인", "닉네임은 2~20자로 입력하세요.");
      if (!isPasswordOk) return Alert.alert("입력 확인", "비밀번호는 8자 이상이어야 합니다.");
      if (!isMatch) return Alert.alert("입력 확인", "비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(emailTrim, password, usernameTrim);
      if (typeof redirect === "string" && redirect.length > 0) {
        router.replace(redirect as Href);
      } else {
        router.replace("/" as Href);
      }
    } catch (e: any) {
      Alert.alert("회원가입 실패", e?.message ?? "다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style="dark" backgroundColor={COLORS.bg} translucent={false} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>모두의 광장</Text>
            <TouchableOpacity onPress={() => router.replace("/")} style={styles.topIconBtn}>
              <Ionicons name="home-outline" size={20} color={COLORS.tint} />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>계정을 만들고 지금 바로 시작해 보세요.</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={COLORS.sub} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => userRef.current?.focus()}
                autoFocus
              />
              {email.length > 0 && (
                <Ionicons
                  name={isEmailValid ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={isEmailValid ? COLORS.success : COLORS.danger}
                />
              )}
            </View>

            <View style={[styles.inputWrap, { marginTop: 10 }]}>
              <Ionicons name="person-outline" size={16} color={COLORS.sub} />
              <TextInput
                ref={userRef}
                style={styles.input}
                placeholder="닉네임 (2~20자)"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />
              {username.length > 0 && (
                <Ionicons
                  name={isUsernameValid ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={isUsernameValid ? COLORS.success : COLORS.danger}
                />
              )}
            </View>

            <View style={[styles.inputWrap, { marginTop: 10 }]}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.sub} />
              <TextInput
                ref={pwRef}
                style={styles.input}
                placeholder="비밀번호 (8자 이상)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPw1}
                textContentType="newPassword"
                autoComplete="password-new"
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                onSubmitEditing={() => pw2Ref.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowPw1((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPw1 ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {password.length > 0 && (
              <View style={styles.hintRow}>
                <View style={[styles.dot, { backgroundColor: passwordStrength.color }]} />
                <Text style={[styles.hintText, { color: passwordStrength.color }]}>
                  비밀번호 강도: {passwordStrength.label}
                </Text>
              </View>
            )}

            <View style={[styles.inputWrap, { marginTop: 10 }]}>
              <Ionicons name="lock-open-outline" size={16} color={COLORS.sub} />
              <TextInput
                ref={pw2Ref}
                style={styles.input}
                placeholder="비밀번호 확인"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPw2}
                textContentType="oneTimeCode"
                value={password2}
                onChangeText={setPassword2}
                returnKeyType="go"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity onPress={() => setShowPw2((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPw2 ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {password2.length > 0 && !isMatch && (
              <Text style={[styles.hintText, { color: COLORS.danger, marginTop: 6 }]}>
                비밀번호가 일치하지 않습니다.
              </Text>
            )}

            <Pressable
              onPress={onSubmit}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              style={({ pressed }) => [
                styles.btn,
                (pressed && Platform.OS === "ios") ? { opacity: 0.95 } : null,
                !canSubmit && { opacity: 0.6 },
              ]}
              disabled={!canSubmit}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>가입하기</Text>}
            </Pressable>

            <View style={styles.footer}>
              <View style={styles.divider} />
              <View style={styles.bottomRow}>
                <Text style={styles.subtleText}>이미 계정이 있으신가요?</Text>
                <TouchableOpacity
                  onPress={() => router.push("/auth/sign-in" as Href)}
                  activeOpacity={0.9}
                  style={styles.ghostBtn}
                >
                  <Ionicons name="log-in-outline" size={16} color={COLORS.tint} />
                  <Text style={styles.ghostBtnText}>로그인</Text>
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, justifyContent: "center" },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, height: 48,
    paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  brand: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  topIconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center",
  },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "rgba(17,24,39,0.06)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 2,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  subtitle: { marginTop: 6, fontSize: 13, color: COLORS.sub },

  inputWrap: {
    marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 48,
    borderWidth: 1, borderColor: "rgba(17,24,39,0.05)",
  },
  input: { flex: 1, fontSize: 16, color: COLORS.text },

  hintRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  hintText: { fontSize: 12 },

  btn: {
    marginTop: 16, backgroundColor: COLORS.tint, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  footer: { marginTop: 18 },
  divider: { height: 1, backgroundColor: "rgba(17,24,39,0.06)" },
  bottomRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subtleText: { fontSize: 12, color: COLORS.sub },

  ghostBtn: {
    paddingHorizontal: 14, height: 40, borderRadius: 10,
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: COLORS.line,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  ghostBtnText: { color: COLORS.text, fontWeight: "800", fontSize: 13 },
});
