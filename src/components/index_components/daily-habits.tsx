import React from 'react';
import { View, Text, FlatList } from 'react-native';
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

            {/* Horizontal carousel of habit cards */}
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
        </View>
    );
}
