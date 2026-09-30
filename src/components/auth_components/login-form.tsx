import { supabase } from "@/lib/supabase";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const params = useLocalSearchParams<{ success?: string }>();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (params.success === "reset") {
      setSuccessMessage(
        "Password reset successfully! Please sign in with your new password.",
      );
    }
  }, [params.success]);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError("All fields are required.");
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      Alert.alert("Success", "Logged in successfully!");

      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = () => {
    setResetError(null);
    setResetEmail(email);
    setResetModalVisible(true);
  };

  const closeResetModal = () => {
    if (resetLoading) return;
    setResetModalVisible(false);
  };

  const handleResetPassword = async () => {
    setResetError(null);

    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      setResetError("Please enter your email address.");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

      if (error) throw error;

      setResetModalVisible(false);
      setResetEmail("");
      router.push({
        pathname: "/reset-password",
        params: { email: trimmedEmail },
      });
    } catch (err: any) {
      setResetError(
        err.message || "Failed to send reset code. Please try again.",
      );
    } finally {
      setResetLoading(false);
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
              Welcome Back
            </Text>
            <Text className="font-fredoka text-base text-mutedBrown mt-1.5 leading-6">
              Log in to continue your progress 
            </Text>
          </View>

          {/* Email Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              Email Address
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="font-fredoka text-base text-deepBrown p-0"
                placeholderTextColor="#7D6E6B"
              />
            </View>
          </View>

          {/* Password Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              Password
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm flex-row items-center justify-between">
              <TextInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="font-fredoka text-base text-deepBrown flex-1 p-0"
                placeholderTextColor="#7D6E6B"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
              >
                <Text className="font-fredoka-semibold text-xs text-focusHero ml-2">
                  {showPassword ? "Hide" : "Show"}
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
                  Logging in...
                </Text>
              </View>
            ) : (
              <Text className="font-fredoka-bold text-white text-base">
                Log In
              </Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={openResetModal}
            activeOpacity={0.8}
            className="flex-row justify-center items-center mt-4"
          >
            <Text className="font-fredoka text-base text-focusHero underline">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Success Message Banner */}
          {successMessage && (
            <View className="bg-success/60 border border-success rounded-2xl p-4 mb-6 items-center">
              <Text className="font-fredoka text-sm text-deepBrown text-center">
                {successMessage}
              </Text>
            </View>
          )}

          {/* Footer Link */}
          <View className="flex-row justify-center items-center">
            <Text className="font-fredoka text-base text-mutedBrown">
              Don&apos;t have an account?{" "}
            </Text>
            <Link href={"/sign-up" as any}>
              <Text className="font-fredoka-bold text-base text-focusHero">
                Sign Up
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeResetModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center items-center px-6"
        >
          <Pressable
            className="absolute inset-0 bg-deepBrown/50"
            onPress={closeResetModal}
          />

          <View className="w-full bg-cozyBg border border-mutedBrown/20 rounded-3xl p-6 shadow-xl">
            <Text className="text-xl font-fredoka-bold text-deepBrown mb-2 text-center">
              Forgot Password?
            </Text>
            <Text className="text-sm font-fredoka text-mutedBrown text-center mb-6 leading-5">
              Enter your registered email and we&apos;ll send you a 6-digit code
              to reset your password.
            </Text>

            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm mb-4">
              <TextInput
                placeholder="name@example.com"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                className="font-fredoka text-base text-deepBrown p-0"
                placeholderTextColor="#7D6E6B"
              />
            </View>

            {resetError && (
              <View className="bg-highPriority/60 border border-highPriority rounded-2xl p-3 mb-4 items-center">
                <Text className="font-fredoka text-sm text-deepBrown text-center">
                  {resetError}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={closeResetModal}
                disabled={resetLoading}
                activeOpacity={0.8}
                className="flex-1 bg-bgCardBg border border-mutedBrown/30 py-3.5 rounded-2xl items-center"
              >
                <Text className="font-fredoka-semibold text-deepBrown text-sm">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={resetLoading}
                activeOpacity={0.8}
                className="flex-1 bg-focusHero active:bg-focusHero/90 py-3.5 rounded-2xl items-center justify-center flex-row"
              >
                {resetLoading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="font-fredoka-bold text-white text-sm ml-2">
                      Sending...
                    </Text>
                  </>
                ) : (
                  <Text className="font-fredoka-bold text-white text-sm">
                    Send Code
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default LoginForm;
