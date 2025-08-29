import { usePostsQuery } from "@/src/features/post/hooks/usePosts";
import { useAuthStore } from "@/src/store/auth";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PostCard from "../src/components/PostCard";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";                  // ✅ 상태바

const Home = () => {
  const router = useRouter();
  const { data, isLoading } = usePostsQuery(1, 20);
  const { user } = useAuthStore();

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
        <View style={styles.root}>

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
              <StatusBar style="dark" backgroundColor="#fff" translucent={false} />

        <View style={styles.header}>
          <Text style={styles.centerTitle}>모두의 광장</Text>

          {user ? (
            <TouchableOpacity onPress={() => router.push("/profile/me")}>
              <Ionicons name="person-circle-outline" size={28} color="#333" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push("/auth/sign-in")}>
              <Ionicons name="log-in-outline" size={28} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap:14,
    backgroundColor: "#F7FAFC",
  },
  headerArea: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
  },
  centerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
});

export default Home;
