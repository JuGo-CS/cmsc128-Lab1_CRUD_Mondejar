import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HomeSortCriteria } from '@/dp_operations/home/tasks';

interface SortControlProps {
    criteria: HomeSortCriteria;
    onChangeCriteria: (criteria: HomeSortCriteria) => void;
}

// Human-readable label for each (user-selectable) filter criterion.
// 'manual' means "no filter — show all tasks in the global order".
const CRITERIA_LABELS: Record<HomeSortCriteria, string> = {
    manual: 'Manual',
    priority: 'Priority',
    deadline: 'Deadline',
    category: 'Category',
    createdAt: 'Time added',
};

// The options shown in the filter menu (excludes 'manual' which is "no filter").
const FILTER_OPTIONS: HomeSortCriteria[] = ['priority', 'deadline', 'category', 'createdAt'];

// A filter selector. In Calendar these options act as FILTERS (which tasks are
// visible), not global reordering — the global Home queue is never modified.
// Tapping the label opens a dropdown of the available filter criteria.
export default function SortControl({ criteria, onChangeCriteria }: SortControlProps) {
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View className="flex-row items-center">
            {/* Criterion label — touchable to open the filter menu */}
            <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center py-1"
            >
                <Ionicons name="filter" size={20} color="#3D2E2B" />
                <Text className="text-xl font-fredoka-bold text-deepBrown ml-2 underline">
                    {CRITERIA_LABELS[criteria]}
                </Text>
            </TouchableOpacity>

            {/* Filter options menu */}
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
                                Filter by:
                            </Text>
                        </View>

                        {/* Subtle Divider Line */}
                        <View className="h-[3px] bg-deepBrown/10 mb-3" />

                        {/* Options List */}
                        <View className="gap-y-4">
                            <TouchableOpacity
                                onPress={() => {
                                    onChangeCriteria('manual');
                                    setMenuVisible(false);
                                }}
                                activeOpacity={0.7}
                                className={`flex-row items-center justify-between py-4 pl-11 rounded-2xl transition-all ${
                                    criteria === 'manual'
                                        ? 'bg-focusHero/15 border border-focusHero/20'
                                        : 'bg-transparent'
                                }`}
                            >
                                <Text
                                    className={`text-base ${
                                        criteria === 'manual'
                                            ? 'font-fredoka-bold text-focusHero'
                                            : 'font-fredoka-medium text-deepBrown'
                                    }`}
                                >
                                    {CRITERIA_LABELS.manual}
                                </Text>
                                {criteria === 'manual' && (
                                    <View className="bg-focusHero/20 p-1 rounded-full">
                                        <Ionicons name="checkmark" size={16} color="#6B8E70" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            {FILTER_OPTIONS.map((option) => {
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
