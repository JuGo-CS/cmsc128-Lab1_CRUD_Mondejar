import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface HabitData {
    id: string;
    title: string;
    /** Emoji shown on the left of the habit card. */
    emoji: string;
    completed?: boolean;
}

interface HabitCardProps {
    habit: HabitData;
    onToggle?: (habit: HabitData) => void;
}

// A single habit card — green background, emoji, title, and a checkbox.
// The entire card is touchable; tapping anywhere marks the habit as completed.
export default function HabitCard({ habit, onToggle }: HabitCardProps) {
    return (
        <TouchableOpacity
            onPress={() => onToggle?.(habit)}
            activeOpacity={0.7}
            className="flex-row items-center bg-habitCard rounded-2xl px-4 py-4 mr-3"
        >
            {/* Emoji icon */}
            <Text className="text-2xl mr-3">{habit.emoji}</Text>

            {/* Habit title */}
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="flex-1 text-base font-fredoka-medium text-deepBrown"
            >
                {habit.title}
            </Text>

            {/* Checkbox — visual completion indicator */}
            <View
                className={`w-6 h-6 rounded-md items-center justify-center border-2 ml-3 ${
                    habit.completed
                        ? 'bg-focusHero border-focusHero'
                        : 'bg-white/70 border-mutedBrown/40'
                }`}
            >
                {habit.completed && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
            </View>
        </TouchableOpacity>
    );
}
