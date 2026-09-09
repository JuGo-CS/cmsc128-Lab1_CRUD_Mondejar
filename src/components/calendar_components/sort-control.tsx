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
                    style={{ flex: 1, backgroundColor: 'rgba(61, 46, 43, 0.4)' }}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    {/* Modal Card - Stretches pure color up behind status bar via pt-14 */}
                    <TouchableOpacity 
                        activeOpacity={1}
                        className="bg-cozyBg rounded-b-[28px] px-6 pt-14 pb-8 shadow-xl"
                    >
                        {/* Header Section */}
                        <View className="flex-row items-center justify-between mb-3 px-1">
                            <Text className="text-2xl font-fredoka-semibold text-deepBrown tracking-wide">
                                Sort by:
                            </Text>
                        </View>

                        {/* Subtle Divider Line */}
                        <View className="h-[3px] bg-deepBrown/10 mb-3" />

                        {/* Options List */}
                        <View className="gap-y-4">
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
                                        className={`flex-row items-center justify-between py-4 pl-11 rounded-2xl transition-all ${
                                            selected 
                                                ? 'bg-focusHero/15 border border-focusHero/20' 
                                                : 'bg-transparent'
                                        }`}
                                    >
                                        <Text
                                            className={`text-base ${
                                                selected 
                                                    ? 'font-fredoka-bold text-focusHero' 
                                                    : 'font-fredoka-medium text-deepBrown'
                                            }`}
                                        >
                                            {CRITERIA_LABELS[option]}
                                        </Text>
                                        
                                        {/* Checkmark Badge */}
                                        {selected && (
                                            <View className="bg-focusHero/20 p-1 rounded-full">
                                                <Ionicons name="checkmark" size={16} color="#6B8E70" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
