import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface HeroTask {
    id: string;
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
}

interface HeroCardProps {
    task?: HeroTask;
    onComplete?: (task: HeroTask) => void;
    /** When true, show a relaxing "all done" message instead of a task. */
    empty?: boolean;
}

export default function HeroCard({ task, onComplete, empty }: HeroCardProps) {
    // Relaxing empty state — all tasks done for today.
    if (empty || !task) {
        return (
            <View className="rounded-3xl bg-focusHero p-5">
                {/* "Focus for now:" header */}
                <Text className="text-xl font-fredoka-bold text-white">
                    All done for now!
                </Text>
                <View className="h-[2px] bg-white/80 mt-1" />

                {/* Relaxing message */}
                <View className="flex-row items-center mt-4">
                    <View className="bg-white/20 rounded-lg p-2 mr-3">
                        <Ionicons name="leaf" size={22} color="#FFFFFF" />
                    </View>
                    <Text className="flex-1 text-lg font-fredoka-medium text-white">
                        You've done enough for today. Take a little breather~
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="rounded-3xl bg-focusHero p-5">
            {/* "Focus for now:" header */}
            <Text className="text-xl font-fredoka-bold text-white">
                Focus for now:
            </Text>
            <View className="h-[2px] bg-white/80 mt-1" />

            {/* Task row: icon + task title */}
            <View className="flex-row items-center mt-4">
                <View className="bg-white/20 rounded-lg p-2 mr-3">
                    <Ionicons name={task.iconName} size={22} color="#FFFFFF" />
                </View>
                <Text className="flex-1 text-lg font-fredoka-medium text-white">
                    {task.title}
                </Text>
            </View>

            {/* "Done" button */}
            <TouchableOpacity
                onPress={() => onComplete?.(task)}
                activeOpacity={0.85}
                className="mt-5 bg-cozyBg rounded-xl py-3 items-center justify-center"
            >
                <Text className="text-lg font-fredoka-bold text-deepBrown">
                    Done
                </Text>
            </TouchableOpacity>
        </View>
    );
}
