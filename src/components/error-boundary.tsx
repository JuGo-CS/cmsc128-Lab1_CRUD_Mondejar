import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-6 bg-cozyBg">
          <Text className="text-2xl font-fredoka-bold text-deepBrown mb-4">
            Something went wrong
          </Text>
          <Text className="text-base font-fredoka text-mutedBrown text-center mb-6">
            We apologize for the inconvenience. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => {
              this.setState({ hasError: false });
              // Optionally, you can trigger a refresh here if needed
            }}
            activeOpacity={0.7}
            className="bg-focusHero text-white px-6 py-3 rounded-xl font-fredoka-semibold"
          >
            Try Again
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}