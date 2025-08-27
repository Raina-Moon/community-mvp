import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import PostCard from "../src/components/PostCard";
import { usePostsQuery } from "@/src/hooks/usePosts";

const Home = () => {
  const { data } = usePostsQuery();

  return (
    <View>
      <Text>Home Screen</Text>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  );
};

export default Home;
