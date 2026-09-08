import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarTaskCard from '@/components/calendar_components/calendar-task-card';
import SortControl from '@/components/calendar_components/sort-control';
import { fetchTasksForDate, CalendarTask, SortCriteria, sortTasks } from '@/dp_operations/calendar/tasks';

// Temporary/hardcoded selected date for this scenario.
// A real calendar will later supply this value without a rewrite.
const SELECTED_DATE = '2026-09-12';

/** Format a `YYYY-MM-DD` date into "September 12" style label. */
function formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
    });
}

export default function CalendarScreen() {
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [criteria, setCriteria] = useState<SortCriteria>('priority');
    const [ascending, setAscending] = useState(true);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // Fetch the tasks applicable to the selected date.
    useEffect(() => {
        let isMounted = true;
        fetchTasksForDate(SELECTED_DATE)
            .then((data) => {
                if (isMounted) {
                    setTasks(data);
                }
            })
            .catch((err) => {
                console.error('Failed to load tasks for date:', err);
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

    // Apply the current sort criteria + direction to the fetched tasks.
    const sortedTasks = sortTasks(tasks, criteria, ascending);

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            {/* Header row with "Calendar" title and sun icon (wins.tsx styling) */}
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                    <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown mt-2 leading-tight">
                        Calendar
                    </Text>
                </View>
                <Ionicons name="sunny" size={80} color="#F4C542" style={{ marginTop: -22 }} />
            </View>
            <View className="h-[2px] bg-deepBrown mr-28 -mt-2" />

            {/* Scrollable content */}
            <ScrollView
                className="flex-1 mt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* "In your Queue" header */}
                <View className="flex-row items-start justify-between mb-1">
                    <View className="flex-1 pr-4">
                        <Text className="text-2xl font-fredoka-bold text-deepBrown">
                            In your Queue
                        </Text>
                        <Text className="text-base font-fredoka text-mutedBrown mt-1">
                            For today, {formatDateLabel(SELECTED_DATE)}.
                        </Text>
                    </View>
                    <Ionicons name="calendar" size={40} color="#6B8E70" />
                </View>

                {/* Sort control header */}
                <View className="flex-row items-center justify-between mt-8 mb-4">
                    <SortControl
                        criteria={criteria}
                        ascending={ascending}
                        onChangeCriteria={setCriteria}
                        onToggleDirection={() => setAscending((prev) => !prev)}
                    />
                    <TouchableOpacity activeOpacity={0.7} className="p-1">
                        <Ionicons name="create-outline" size={24} color="#3D2E2B" />
                    </TouchableOpacity>
                </View>

                {/* Task cards */}
                {loading ? (
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Loading your queue...
                    </Text>
                ) : sortedTasks.length === 0 ? (
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Nothing in your queue for this day. Enjoy the calm!
                    </Text>
                ) : (
                    sortedTasks.map((task) => (
                        <CalendarTaskCard
                            key={task.id}
                            task={task}
                            sortCriteria={criteria}
                            onToggle={(t) => {
                                // TODO: connect to database to toggle task completion
                                console.log('Toggle task:', t.id);
                            }}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}