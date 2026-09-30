import LoginForm from '@/components/auth_components/login-form';
import { View } from 'react-native';

export default function SignInScreen() {
  return (
    <View className="flex-1 bg-cozyBg">
      <LoginForm />
    </View>
  );
}
