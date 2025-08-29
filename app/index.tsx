import { usePostsQuery } from "@/src/features/post/hooks/usePosts";
import { useAuthStore } from "@/src/store/auth";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PostCard from "../src/components/PostCard";

const Home = () => {
  const router = useRouter();
  const { data, isLoading } = usePostsQuery(1, 20);
  const { user } = useAuthStore();

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home Screen</Text>
        {user ? (
          <TouchableOpacity onPress={() => router.push("/profile/me")}>
            <Text style={styles.link}>Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push("/auth/sign-in")}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
        overScrollMode="never"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 14,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    fontSize: 16,
    color: "blue",
  },
});

export default Home;
