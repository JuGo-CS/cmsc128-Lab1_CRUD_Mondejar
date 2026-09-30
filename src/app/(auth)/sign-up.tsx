import SignupForm from '@/components/auth_components/signup-form';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 items-center justify-center px-4">
        <SignupForm />
      </View>
    </SafeAreaView>
  );
}
