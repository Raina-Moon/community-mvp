import 'react-native-get-random-values';
import BottomActionBar from "@/src/components/BottomActionBar";
import { useAuthStore } from "@/src/store/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

const qc = new QueryClient();

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const subscribeAuth = useAuthStore((s) => s.subscribeAuth);

  useEffect(() => {
    bootstrap();
    const unsubscribe = subscribeAuth();
    return () => unsubscribe();
  }, [bootstrap, subscribeAuth]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <Stack screenOptions={{ headerShown: false }} />
        <BottomActionBar />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
