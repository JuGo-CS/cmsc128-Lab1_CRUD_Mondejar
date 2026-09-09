import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HomeSortCriteria } from '@/dp_operations/home/tasks';

interface SortControlProps {
    criteria: HomeSortCriteria;
}

// Human-readable label for each (user-selectable) Home sort criterion.
// 'manual' is the default position-order mode.
const CRITERIA_LABELS: Record<HomeSortCriteria, string> = {
    manual: 'Manual',
    priority: 'Priority',
    deadline: 'Deadline',
    category: 'Category',
    createdAt: 'Time added',
};

// A read-only sort indicator. The sort mode is owned globally by Home, so
// Calendar only reflects it here — it does not have its own sort state or menu.
export default function SortControl({ criteria }: SortControlProps) {
    return (
        <View className="flex-row items-center">
            <Ionicons name="file-tray-full-sharp" size={20} color="#3D2E2B" />
            <Text className="text-xl font-fredoka-bold text-deepBrown ml-2">
                {CRITERIA_LABELS[criteria]}
            </Text>
        </View>
    );
}
