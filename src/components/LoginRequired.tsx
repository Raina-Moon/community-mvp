import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

type Props = { redirectTo: string; message?: string };

export default function LoginRequired({ redirectTo, message }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text style={styles.msg}>{message ?? "로그인이 필요합니다."}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() =>
          router.push({
            pathname: "/auth/sign-in",
            params: { redirect: redirectTo },
          })
        }
      >
        <Text style={styles.btnText}>로그인하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  msg: { fontSize: 16, marginBottom: 12 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111",
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
