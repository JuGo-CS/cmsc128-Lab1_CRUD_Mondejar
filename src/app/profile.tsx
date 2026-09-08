import React from 'react';
import { View, Text } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

export default function ProfileScreen() {
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
            <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown">
                Profile Settings 👤
            </Text>
        </View>
    );
}