import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PostCard from "../src/components/PostCard";
import { usePostsQuery } from "@/src/hooks/usePosts";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth";

const Home = () => {
  const router = useRouter();
  const { data, isLoading } = usePostsQuery(1, 20);
  const { user } = useAuthStore();

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ flex: 1 }}>Home Screen</Text>
      {user ? (
        <TouchableOpacity onPress={() => router.push("/profile/me")}>
          <Text>Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => router.push("/auth/sign-in")}>
          <Text>Login</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  );
};

export default Home;
