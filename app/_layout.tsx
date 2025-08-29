import "react-native-gesture-handler";
import "react-native-reanimated";
import "react-native-get-random-values";

import BottomActionBar from "@/src/components/BottomActionBar";
import { useAuthStore } from "@/src/store/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const qc = new QueryClient();
const BAR_HEIGHT = 64;
const BG = "#F7FAFC";

function LayoutInner() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname() ?? "";

  const showBar = !(
    pathname.startsWith("/auth") || pathname === "/post/create"
  );

  const contentPaddingBottom = showBar
    ? BAR_HEIGHT + Math.max(insets.bottom)
    : Math.max(insets.bottom, 0);

  return (
    <>
      <View style={{ flex: 1, paddingBottom: contentPaddingBottom , backgroundColor: BG }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <BottomActionBar />
    </>
  );
}

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const subscribeAuth = useAuthStore((s) => s.subscribeAuth);

  useEffect(() => {
    bootstrap();
    const unsubscribe = subscribeAuth();
    return () => unsubscribe();
  }, [bootstrap, subscribeAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: BG }}>
        <QueryClientProvider client={qc}>
          <LayoutInner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
