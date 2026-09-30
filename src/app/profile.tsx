import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

export default function ProfileScreen() {
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown">
                Profile Settings
            </Text>
            <TouchableOpacity
                onPress={handleSignOut}
                className="bg-highPriority/40 border border-highPriority text-deepBrown rounded-2xl py-3 px-4 mt-6"
            >
                <Text className="font-fredoka-bold text-center">
                    Sign Out
                </Text>
            </TouchableOpacity>
        </View>
    );
}
