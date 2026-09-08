import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TreasureGroup } from '@/dp_operations/wins/treasures';
import TreasureLogCard from './treasure-log-card';

interface TreasureDateSectionProps {
    group: TreasureGroup;
}

// A date group in the Treasures section — a header row with a collapse/expand
// chevron and a calendar icon, followed by the completed task logs for that day.
export default function TreasureDateSection({ group }: TreasureDateSectionProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <View className="mb-6">
            {/* Date header row */}
            <TouchableOpacity
                onPress={() => setCollapsed((prev) => !prev)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between mb-3"
            >
                <View className="flex-row items-center flex-1">
                    <Ionicons
                        name={collapsed ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#3D2E2B"
                    />
                    <Text className="text-lg font-fredoka-semibold text-deepBrown ml-2">
                        {group.label}
                    </Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color="#7D6E6B" />
            </TouchableOpacity>

            {/* Logs for this date */}
            {!collapsed &&
                group.logs.map((log) => (
                    <TreasureLogCard key={log.id} log={log} />
                ))}
        </View>
    );
}
