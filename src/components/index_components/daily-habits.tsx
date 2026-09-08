import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import HabitCard, { HabitData } from './habit-card';

interface DailyHabitsProps {
    habits: HabitData[];
    onToggleHabit?: (habit: HabitData) => void;
}

// "Little habits" section — a low-pressure horizontal carousel of habit cards.
// Users can swipe left/right to browse through their daily habits.
export default function DailyHabits({ habits, onToggleHabit }: DailyHabitsProps) {
    return (
        <View className="mt-8">
            {/* Section header */}
            <Text className="text-xl font-fredoka text-deepBrown mb-4">
                Little habits:
            </Text>

            {habits.length === 0 ? (
                // Congratulatory empty state — all habits done for today.
                <View className="bg-habitCard rounded-2xl px-5 py-6 items-center justify-center">
                    <Ionicons name="sparkles" size={40} color="#6B8E70" />
                    <Text className="text-base font-fredoka-medium text-deepBrown text-center mt-3">
                        You did it! All your little habits are done for today.
                    </Text>
                </View>
            ) : (
                // Horizontal carousel of habit cards
                <FlatList
                    data={habits}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                    renderItem={({ item }) => (
                        <HabitCard habit={item} onToggle={onToggleHabit} />
                    )}
                />
            )}
        </View>
    );
}
