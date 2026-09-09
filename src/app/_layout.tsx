import "../../global.css";
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import AddModal from '@/components/add-modal';

function FloatingAddButton({ onPress }: { onPress?: () => void }) {
    return (
        <View
            pointerEvents="box-none"
            className="absolute left-0 right-0 items-center z-20 "
            style={{ bottom: Platform.OS === 'ios' ? 40 : 32 }}
        >
            <View className="w-[80px] h-[80px] rounded-full bg-tabBarBg items-center justify-center">
                <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.85}
                    className="w-[65px] h-[65px] rounded-full items-center justify-center bg-fabPinkBg shadow-sm"
                    style={{ elevation: 8 }}
                >
                    <Ionicons name="add" size={38} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
    return (
        <Text className={`${focused ? 'font-fredoka-semibold' : 'font-fredoka'} text-deepBrown text-[15px] mt-0.5`}>
            {label}
        </Text>
    );
}

export default function AppLayout() {
	const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    const [addModalVisible, setAddModalVisible] = useState(false);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }


    return (
        <View className="flex-1 mx-1">
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#3D2E2B',
                    tabBarInactiveTintColor: '#3D2E2B',
                    tabBarStyle: {
                        backgroundColor: '#F7F2EB',
                        borderTopColor: '#E6DDD4',
                        borderTopWidth: 1,
                        height: Platform.OS === 'ios' ? 92 : 82,
                        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
                        paddingTop: 8,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
                        tabBarIcon: ({ focused }) => (
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={26} color="#3D2E2B" />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="wins"
                    options={{
                        title: 'Wins',
                        tabBarLabel: ({ focused }) => <TabLabel label="Wins" focused={focused} />,
                        tabBarIcon: ({ focused }) => (
                            <Ionicons name={focused ? 'star' : 'star-outline'} size={26} color="#3D2E2B" />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="add-modal"
                    options={{
                        title: '',
                        tabBarButton: () => <View className="w-[74px]" />, // spacer
                    }}
                />

                <Tabs.Screen
                    name="calendar"
                    options={{
                        title: 'Calendar',
                        tabBarLabel: ({ focused }) => <TabLabel label="Calendar" focused={focused} />,
                        tabBarIcon: ({ focused }) => (
                            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={26} color="#3D2E2B" />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
                        tabBarIcon: ({ focused }) => (
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={26} color="#3D2E2B" />
                        ),
                    }}
                />
            </Tabs>

            <FloatingAddButton onPress={() => setAddModalVisible(true)} />

            <AddModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onSaved={() => {
                    // The underlying screen refetches on focus (useFocusEffect),
                    // so newly created tasks/habits appear automatically.
                    setAddModalVisible(false);
                }}
            />
        </View>
    );
}