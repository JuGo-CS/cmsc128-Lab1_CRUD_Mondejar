import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import WinsTabs, { WinsTab } from '@/components/wins_components/wins-tabs';
import TreasureDateSection from '@/components/wins_components/treasure-date-section';
import { fetchTreasureGroups, TreasureGroup } from '@/dp_operations/wins/treasures';

// Placeholder treasure groups used when the database fetch hasn't loaded yet.
// Replace with real data once the backend is fully wired.
const PLACEHOLDER_GROUPS: TreasureGroup[] = [
    {
        date: '2026-09-09',
        label: 'September 9, 2026',
        logs: [
            { id: 't-1', title: 'Finish wireframes for Unti-Unti', iconName: 'school', completedDate: '2026-09-09', completedTime: '14:30:00' },
            { id: 't-2', title: 'Finish wireframes for Unti-Unti', iconName: 'school', completedDate: '2026-09-09', completedTime: '14:30:00' },
            { id: 't-3', title: 'Finish wireframes for Unti-Unti', iconName: 'school', completedDate: '2026-09-09', completedTime: '14:30:00' },
        ],
    },
    {
        date: '2026-09-08',
        label: 'September 8, 2026',
        logs: [
            { id: 't-4', title: 'Finish wireframes for Unti-Unti', iconName: 'school', completedDate: '2026-09-08', completedTime: '14:30:00' },
            { id: 't-5', title: 'Finish wireframes for Unti-Unti', iconName: 'school', completedDate: '2026-09-08', completedTime: '14:30:00' },
        ],
    },
];

export default function WinsScreen() {
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    const [activeTab, setActiveTab] = useState<WinsTab>('treasures');
    const [groups, setGroups] = useState<TreasureGroup[]>(PLACEHOLDER_GROUPS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // Fetch the completed task logs (Treasures) from the database.
    useEffect(() => {
        let isMounted = true;
        fetchTreasureGroups()
            .then((data) => {
                if (isMounted) {
                    setGroups(data);
                }
            })
            .catch((err) => {
                console.error('Failed to load treasures:', err);
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            {/* Header row with "Wins" title and sun icon */}
            <View className="flex-row items-start justify-between">
                <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown">
                    Wins
                </Text>
                <Ionicons name="sunny" size={56} color="#F4C542" />
            </View>
            <View className="h-[2px] bg-deepBrown mt-2" />

            {/* Treasures / Mosaic toggle */}
            <WinsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

            {/* Scrollable content */}
            <ScrollView
                className="flex-1 mt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {activeTab === 'treasures' ? (
                    loading ? (
                        <Text className="text-base font-fredoka text-mutedBrown">
                            Loading your treasures...
                        </Text>
                    ) : groups.length === 0 ? (
                        <Text className="text-base font-fredoka text-mutedBrown">
                            No treasures yet. Complete a task to see it here!
                        </Text>
                    ) : (
                        groups.map((group) => (
                            <TreasureDateSection key={group.date} group={group} />
                        ))
                    )
                ) : (
                    // Mosaic section — will display Daily Habit completion logs later.
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Mosaic is coming soon!
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}