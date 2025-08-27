import React, { useMemo, useState } from "react";
import LoginRequired from "@/src/components/LoginRequired";
import { usePostQuery } from "@/src/hooks/usePosts";
import { useAuthStore } from "@/src/store/auth";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PostDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = usePostQuery(id);
  const { width } = useWindowDimensions();

  const images = useMemo(() => data?.imageUrls ?? [], [data?.imageUrls]);
  const [index, setIndex] = useState(0);

  if (!user) {
    return (
      <LoginRequired
        redirectTo={`/post/${id}`}
        message="글을 보려면 로그인이 필요합니다."
      />
    );
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  if (!data) {
    return <Text>존재하지 않는 글입니다.</Text>;
  }

  const createdAt = (data as any).createdAt ?? (data as any).created_at; //안전대응 : 백엔드 필드명 차이
  const authorName = data.author?.username ?? "Unknown";

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>{data.title}</Text>

      <Text style={styles.meta}>
        {authorName} · {formatDate(createdAt)}
      </Text>

      {images.length > 0 && (
        <View style={[styles.carouselWrap, { width }]}>
          <FlatList
            data={images}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item: uri }) => (
              <Image
                source={{ uri }}
                style={[styles.image, { width }]}
                resizeMode="cover"
              />
            )}
          />
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>
              {index + 1} / {images.length}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.content}>{data.content}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  meta: { color: "#666", marginBottom: 12 },
  carouselWrap: { position: "relative", marginBottom: 12 },
  image: {
    height: 320,
    borderRadius: 10,
  },
  pageBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageBadgeText: { color: "#fff", fontWeight: "600" },
  content: { fontSize: 16, lineHeight: 22 },
});

export default PostDetailScreen;
