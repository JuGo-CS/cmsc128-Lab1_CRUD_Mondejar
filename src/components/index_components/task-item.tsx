import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export interface TaskItemData {
    id: string;
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
    completed?: boolean;
}

interface TaskItemProps {
    task: TaskItemData;
    onToggle?: (task: TaskItemData) => void;
    /** When true, the item is shown inside the stacked, condensed card layout. */
    compact?: boolean;
    /** When true, the content is faded/muted for back cards in the stack. */
    muted?: boolean;
}

// A single task row with an icon on the left and a checkbox on the right.
// Titles are truncated with an ellipsis when they are too long.
export default function TaskItem({ task, onToggle, compact, muted }: TaskItemProps) {
    return (
        <View className={`flex-row items-center py-2.5 ${muted ? 'opacity-40' : ''}`}>
            {/* Task icon */}
            <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                <Ionicons name={task.iconName} size={20} color="#7D6E6B" />
            </View>

            {/* Truncated title */}
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="flex-1 text-base font-fredoka-medium text-deepBrown"
            >
                {task.title}
            </Text>

            {/* Checkbox on the right */}
            <TouchableOpacity
                onPress={() => onToggle?.(task)}
                activeOpacity={0.7}
                className="ml-3"
            >
                <View
                    className={`w-6 h-6 rounded-md items-center justify-center border-2 ${
                        task.completed
                            ? 'bg-focusHero border-focusHero'
                            : 'bg-white/60 border-mutedBrown/40'
                    }`}
                >
                    {task.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
}
