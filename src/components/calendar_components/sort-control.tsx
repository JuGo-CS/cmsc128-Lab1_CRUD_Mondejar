import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SortCriteria } from '@/dp_operations/calendar/tasks';

interface SortControlProps {
    criteria: SortCriteria;
    ascending: boolean;
    onChangeCriteria: (criteria: SortCriteria) => void;
    onToggleDirection: () => void;
}

// Human-readable label for each sort criterion.
const CRITERIA_LABELS: Record<SortCriteria, string> = {
    priority: 'Priority',
    deadline: 'Deadline',
    category: 'Category',
    createdAt: 'Time added',
};

// A touchable sort control: the criterion text (underlined) opens a dropdown of
// options, and the arrow beside it reverses the current sort direction.
export default function SortControl({
    criteria,
    ascending,
    onChangeCriteria,
    onToggleDirection,
}: SortControlProps) {
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View className="flex-row items-center">
            {/* Criterion label — touchable to open the sort menu */}
            <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center py-1"
            >
                <Ionicons name="file-tray-full-sharp" size={20} color="#3D2E2B" />
                <Text className="text-xl font-fredoka-bold text-deepBrown ml-2 underline">
                    {CRITERIA_LABELS[criteria]}
                </Text>
            </TouchableOpacity>

            {/* Direction arrow — reverses the sort direction */}
            <TouchableOpacity
                onPress={onToggleDirection}
                activeOpacity={0.7}
                className="ml-4 p-1"
                accessibilityLabel="Reverse sort direction"
            >
                <Ionicons
                    name={ascending ? 'arrow-down' : 'arrow-up'}
                    size={22}
                    color="#3D2E2B"
                />
            </TouchableOpacity>

            {/* Sort options menu */}
            <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View className="bg-cozyBg rounded-2xl mx-8 my-auto p-8">
                        <Text className="text-base font-fredoka-bold text-deepBrown mb-3 ">
                            Sort by
                        </Text>
                        {(Object.keys(CRITERIA_LABELS) as SortCriteria[]).map((option) => {
                            const selected = option === criteria;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    onPress={() => {
                                        onChangeCriteria(option);
                                        setMenuVisible(false);
                                    }}
                                    activeOpacity={0.7}
                                    className="flex-row items-center justify-between py-3 px-2 rounded-xl"
                                >
                                    <Text
                                        className={`text-base font-fredoka-semibold ${
                                            selected ? 'text-focusHero' : 'text-deepBrown'
                                        }`}
                                    >
                                        {CRITERIA_LABELS[option]}
                                    </Text>
                                    {selected && (
                                        <Ionicons name="checkmark" size={20} color="#6B8E70" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
