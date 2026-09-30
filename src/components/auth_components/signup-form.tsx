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

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !username || !displayName || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            display_name: displayName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      Alert.alert('Welcome to Unti-Unti!', 'Please check your email to confirm your account.');
      
      setEmail('');
      setUsername('');
      setDisplayName('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up.');
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
              Create Account
            </Text>
            <Text className="font-fredoka text-base text-mutedBrown mt-1.5 leading-6">
              Unti-unti, step by step towards your goals 
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

          {/* Username Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              Username
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                placeholder="juan_delacruz"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                className="font-fredoka text-base text-deepBrown p-0"
                placeholderTextColor="#7D6E6B"
              />
            </View>
          </View>

          {/* Display Name Field */}
          <View className="mb-5">
            <Text className="font-fredoka-medium text-xs text-deepBrown uppercase tracking-wider mb-2 ml-1">
              Display Name
            </Text>
            <View className="bg-white border border-deepBrown/15 rounded-2xl px-4 py-3.5 shadow-sm">
              <TextInput
                placeholder="Juan Dela Cruz"
                value={displayName}
                onChangeText={setDisplayName}
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

          {/* Confirm Password Field */}
          <View className="mb-6">
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
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={10}>
                <Text className="font-fredoka-semibold text-xs text-focusHero ml-2">
                  {showConfirmPassword ? 'Hide' : 'Show'}
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
                  Creating account...
                </Text>
              </View>
            ) : (
              <Text className="font-fredoka-bold text-white text-base">
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer Link */}
          <View className="flex-row justify-center items-center">
            <Text className="font-fredoka text-base text-mutedBrown">
              Already have an account?{' '}
            </Text>
            <Link href={"/sign-in" as any}>
              <Text className="font-fredoka-bold text-base text-focusHero">
                Sign In
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupForm;