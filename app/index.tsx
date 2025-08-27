import React from "react";
import { FlatList, Text, View } from "react-native";
import PostCard from "../src/components/PostCard";

const Home = () => {
  return (
    <View>
      <Text>Home Screen</Text>
       <FlatList
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  );
};

export default Home;
