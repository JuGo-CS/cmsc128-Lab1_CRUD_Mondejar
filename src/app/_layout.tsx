import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from "@expo-google-fonts/fredoka";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";

// Inner navigator that guards routes based on auth state.
function RootNavigator() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Protect routes based on auth state
  useEffect(() => {
    if (isLoading) {
      // While loading, we don't want to redirect yet
      return;
    }

    const isAuthRoute = segments[0] === "(auth)";
    const isAuthenticated = !!session;

    if (!isAuthenticated && !isAuthRoute) {
      // User is not auth and trying to access a protected route -> redirect to sign-in
      router.replace("/(auth)/sign-in");
    } else if (isAuthenticated && isAuthRoute) {
      // User is auth and trying to access an auth route -> redirect to home
      router.replace("/");
    }
  }, [isLoading, session, segments, router]);

  // Show loading indicator while auth state is initializing
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cozyBg">
        <ActivityIndicator size="large" color="#3D2E2B" />
      </View>
    );
  }

  return <Slot />;
}

// Root layout: loads fonts, provides auth context, and renders the matched route.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-cozyBg">
        <ActivityIndicator size="large" color="#3D2E2B" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
