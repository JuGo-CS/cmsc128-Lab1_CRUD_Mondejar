import React from 'react';
import { View, Text } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function HomeScreen() {
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
		return null;
	}

	return (
		<View className="flex-1 bg-cozyBg pt-14 px-5">
			{/* Header row with greeting and sun icon */}
			<View className="flex-row items-start justify-between">
				<View className="flex-1 pr-4">
					<Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown leading-tight">
						Maayung{'\n'}
						adlaw, Kenneth!
					</Text>
					{/* Horizontal line underneath the heading */}
					<View className="h-[2px] bg-deepBrown mt-2" />
					{/* Date text (placeholder for now) */}
					<Text className="text-lg text-mutedBrown mt-2">
						Thursday, September 10
					</Text>
				</View>
				{/* Sun icon in the top-right, slightly above the text */}
				<Ionicons name="sunny" size={64} color="#F4C542" style={{ marginTop: -8 }} />
			</View>
		</View>
	);
}