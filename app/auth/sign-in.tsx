import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuthStore } from "../../src/store/auth";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function SignInScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false); // ✅ 로컬 로딩

  const goAfterLogin = () => {
    if (typeof redirect === "string" && redirect.startsWith("/post/")) {
      const id = redirect.split("/").pop()!;
      router.replace({ pathname: "/post/[id]", params: { id } });
    } else {
      router.replace("/");
    }
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      goAfterLogin();
    } catch (e: any) {
      Alert.alert("로그인 실패", e?.message ?? "다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={[styles.btn, submitting && { opacity: 0.6 }]} // ✅ submitting 반영
        onPress={onSubmit}
        disabled={submitting}
      >
        <Text style={styles.btnText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/sign-up")}>
        <Text style={{ marginTop: 12 }}>회원가입</Text>
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
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
