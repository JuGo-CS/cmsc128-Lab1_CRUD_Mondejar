import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      Alert.alert('Success', 'Logged in successfully!');
      
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-cozyBg">
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8 mt-2">
            <Text className="font-fredoka-bold text-3xl text-deepBrown tracking-wide">
              Welcome Back
            </Text>
            <Text className="font-fredoka text-base text-mutedBrown mt-1.5 leading-6">
              Log in to continue your progress 🌱
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
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                <Text className="font-fredoka-semibold text-xs text-focusHero ml-2">
                  {showPassword ? 'Hide' : 'Show'}
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

          {/* Footer Link */}
          <View className="flex-row justify-center items-center">
            <Text className="font-fredoka text-base text-mutedBrown">
              Don&apos;t have an account?{' '}
            </Text>
            <Link href={"/sign-up" as any}>
              <Text className="font-fredoka-bold text-base text-focusHero">
                Sign Up
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginForm;
