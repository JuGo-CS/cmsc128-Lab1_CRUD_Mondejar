import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import WinsTabs, { WinsTab } from '@/components/wins_components/wins-tabs';
import TreasureDateSection from '@/components/wins_components/treasure-date-section';
import WinsCalendarModal from '@/components/wins_components/wins-calendar-modal';
import { fetchTreasureGroups, TreasureGroup, TreasureLog, deleteTreasure } from '@/dp_operations/wins/treasures';

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

/** Today's date as `YYYY-MM-DD` in local time. */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(todayDateString());

    // Ref to the scrollable logbook + a map of each date group's y-offset.
    const scrollRef = useRef<ScrollView>(null);
    const dateOffsets = useRef<Record<string, number>>({});

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

    // Handle editing a treasure's title.
    const handleEditLog = (log: TreasureLog) => {
        // TODO: replace with a text-input prompt/modal for editing the title.
        console.log('Edit treasure:', log.id);
    };

    // Handle deleting a treasure from the database, then update local state.
    const handleDeleteLog = (log: TreasureLog) => {
        deleteTreasure(log.id)
            .then(() => {
                setGroups((prev) =>
                    prev
                        .map((group) => ({
                            ...group,
                            logs: group.logs.filter((l) => l.id !== log.id),
                        }))
                        .filter((group) => group.logs.length > 0)
                );
            })
            .catch((err) => {
                console.error('Failed to delete treasure:', err);
            });
    };

    // Jump the logbook to the selected date. Does NOT filter — the whole
    // logbook stays scrollable so the user can continue browsing nearby days.
    const handleSelectDate = (date: string) => {
        setSelectedDate(date);
        const y = dateOffsets.current[date];
        if (y != null) {
            scrollRef.current?.scrollTo({ y, animated: true });
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            {/* Header row with "Wins" title and sun icon */}
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                    <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown mt-2 leading-tight">
                        Wins
                    </Text>
                </View>
                <Ionicons name="sunny" size={80} color="#F4C542" style={{ marginTop: -22 }} />
            </View>
            <View className="h-[2px] bg-deepBrown mr-28 -mt-2" />

            {/* Treasures / Mosaic toggle */}
            <WinsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

            {/* Single calendar icon at the top of the Treasures section */}
            {activeTab === 'treasures' && (
                <View className="flex-row items-center justify-end mt-4">
                    <TouchableOpacity
                        onPress={() => setCalendarVisible(true)}
                        activeOpacity={0.7}
                        className="p-2"
                    >
                        <Ionicons name="calendar-outline" size={24} color="#7D6E6B" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Scrollable logbook content */}
            <ScrollView
                ref={scrollRef}
                className="flex-1 mt-2"
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
                            <View
                                key={group.date}
                                onLayout={(e) => {
                                    dateOffsets.current[group.date] = e.nativeEvent.layout.y;
                                }}
                            >
                                <TreasureDateSection
                                    group={group}
                                    onEditLog={handleEditLog}
                                    onDeleteLog={handleDeleteLog}
                                />
                            </View>
                        ))
                    )
                ) : (
                    // Mosaic section — will display Daily Habit completion logs later.
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Mosaic is coming soon!
                    </Text>
                )}
            </ScrollView>

            {/* Calendar modal */}
            <WinsCalendarModal
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
            />
        </View>
    );
}