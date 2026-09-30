import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ResetPasswordScreen: React.FC = () => {
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(searchParams.email)
    ? (searchParams.email[0] ?? "")
    : (searchParams.email ?? "");

  const handleSubmit = async () => {
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedOtp = otpCode.trim();

    if (!trimmedEmail || !trimmedOtp || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedOtp,
        type: "recovery",
      });

      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Sign the user out so they can sign in with their new password.
      await supabase.auth.signOut();

      router.replace({
        pathname: "/sign-in",
        params: { success: "reset" },
      });
    } catch (err: any) {
      setError(
        err.message || "An error occurred while resetting your password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-cozyBg">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 80,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8 mt-2">
            <Text className="font-fredoka-bold text-3xl text-deepBrown tracking-wide">
              Reset Password
            </Text>
            <Text className="font-fredoka text-base text-mutedBrown mt-1.5 leading-6">
              Enter the 6-digit code sent to your email and your new password
            </Text>
          </View>

          {/* OTP Code Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              6-Digit OTP Token
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                placeholder="••••••"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                autoCorrect={false}
                className="font-fredoka text-base text-deepBrown p-0 tracking-widest"
                placeholderTextColor="#7D6E6B"
              />
            </View>
          </View>

          {/* New Password Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              New Password
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm flex-row items-center justify-between">
              <TextInput
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                className="font-fredoka text-base text-deepBrown flex-1 p-0"
                placeholderTextColor="#7D6E6B"
              />
              <Pressable
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={10}
              >
                <Text className="font-fredoka-semibold text-xs text-focusHero ml-2">
                  {showNewPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              Confirm Password
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm flex-row items-center justify-between">
              <TextInput
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                className="font-fredoka text-base text-deepBrown flex-1 p-0"
                placeholderTextColor="#7D6E6B"
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={10}
              >
                <Text className="font-fredoka-semibold text-xs text-focusHero ml-2">
                  {showConfirmPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Error Banner */}
          {error && (
            <View className="bg-highPriority/60 border border-highPriority rounded-2xl p-4 mb-6 items-center">
              <Text className="font-fredoka text-sm text-deepBrown text-center">
                {error}
              </Text>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
            className="bg-focusHero active:bg-focusHero/90 rounded-2xl py-4 items-center justify-center shadow-md mb-6"
          >
            {loading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="font-fredoka-bold text-white text-base ml-2">
                  Resetting...
                </Text>
              </View>
            ) : (
              <Text className="font-fredoka-bold text-white text-base">
                Reset Password
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer Link */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="font-fredoka text-base text-mutedBrown">
              Remember your password?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/sign-in")}
              activeOpacity={0.8}
            >
              <Text className="font-fredoka-bold text-base text-focusHero">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
