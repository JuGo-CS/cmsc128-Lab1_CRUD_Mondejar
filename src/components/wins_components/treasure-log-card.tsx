import React from 'react';
import { View, Text } from 'react-native';
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
}

// A single completed task log card ("Treasure") displayed under a date group.
export default function TreasureLogCard({ log }: TreasureLogCardProps) {
    return (
        <View className="flex-row items-center bg-cardBg rounded-2xl px-4 py-3 mb-3 border border-white/50">
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
        </View>
    );
}
