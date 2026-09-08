import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TreasureLog } from '@/dp_operations/wins/treasures';

/** Format a `HH:MM:SS` time into a friendly label like "2:30 PM". */
function formatTimeLabel(timeStr: string): string {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

interface TreasureLogCardProps {
    log: TreasureLog;
    onEdit?: (log: TreasureLog) => void;
    onDelete?: (log: TreasureLog) => void;
}

// A single completed task log card ("Treasure") displayed under a date group.
// Tapping the card reveals Edit and Delete actions.
export default function TreasureLogCard({ log, onEdit, onDelete }: TreasureLogCardProps) {
    const [showActions, setShowActions] = useState(false);

    return (
        <View className="mb-3">
            <TouchableOpacity
                onPress={() => setShowActions((prev) => !prev)}
                activeOpacity={0.8}
                className="flex-row items-center bg-cardBg rounded-2xl px-4 py-3 border border-black"
            >
                {/* Task icon */}
                <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                    <Ionicons name={log.iconName} size={20} color="#7D6E6B" />
                </View>

                {/* Title + completion time */}
                <View className="flex-1">
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-base font-fredoka-semibold text-deepBrown"
                    >
                        {log.title}
                    </Text>
                    <Text className="text-sm font-fredoka text-mutedBrown mt-0.5">
                        Completed at {formatTimeLabel(log.completedTime)}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Edit / Delete actions revealed on tap */}
            {showActions && (
                <View className="flex-row items-center justify-end mt-2">
                    <TouchableOpacity
                        onPress={() => onEdit?.(log)}
                        activeOpacity={0.7}
                        className="flex-row items-center px-3 py-2 rounded-xl bg-cardBg border border-white/50 mr-2"
                    >
                        <Ionicons name="create-outline" size={16} color="#7D6E6B" />
                        <Text className="text-sm font-fredoka-semibold text-deepBrown ml-1">
                            Edit
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => onDelete?.(log)}
                        activeOpacity={0.7}
                        className="flex-row items-center px-3 py-2 rounded-xl bg-cardBg border border-white/50"
                    >
                        <Ionicons name="trash-outline" size={16} color="#C0392B" />
                        <Text className="text-sm font-fredoka-semibold text-deepBrown ml-1">
                            Delete
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
