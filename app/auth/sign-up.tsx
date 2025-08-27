import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, Href, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../src/store/auth"; // 네 구조에 맞춰 상대경로 사용

export default function SignUpScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (submitting) return;
    if (!email.trim() || !username.trim() || !password) {
      Alert.alert("입력 확인", "이메일, 사용자명, 비밀번호를 모두 입력하세요.");
      return;
    }
    if (password !== password2) {
      Alert.alert("비밀번호 불일치", "비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email.trim(), password, username.trim());

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
    <View style={styles.wrap}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="confirm password"
        secureTextEntry
        value={password2}
        onChangeText={setPassword2}
      />

      <TouchableOpacity
        style={[styles.btn, submitting && { opacity: 0.6 }]}
        onPress={onSubmit}
        disabled={submitting}
      >
        <Text style={styles.btnText}>가입하기</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/sign-in" as Href)}>
        <Text style={{ marginTop: 12, textAlign: "center" }}>
          이미 계정이 있나요? 로그인
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
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
    marginTop: 6,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
