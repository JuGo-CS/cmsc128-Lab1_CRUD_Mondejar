import React from 'react';
import { View, Text } from 'react-native';

export default function ProfileScreen() {
    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            <Text className="text-2xl font-bold text-deepBrown">
                Profile Settings 👤
            </Text>
        </View>
    );
}