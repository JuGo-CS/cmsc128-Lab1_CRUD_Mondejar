import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WinsCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    /** Called with the selected date as `YYYY-MM-DD`. */
    onSelectDate: (date: string) => void;
    /** The currently selected date as `YYYY-MM-DD`. */
    selectedDate: string;
}

/** Format a `YYYY-MM-DD` string into a monthly label like "September 2026". */
function monthLabel(year: number, month: number): string {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Build the grid of day cells for a given month. */
function buildMonthDays(year: number, month: number): (string | null)[] {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    return cells;
}

// A calendar modal for the Wins screen. Shows the current and previous month,
// with selectable dates that navigate the logbook to that day's records.
export default function WinsCalendarModal({
    visible,
    onClose,
    onSelectDate,
    selectedDate,
}: WinsCalendarModalProps) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Show current month first, then the previous month.
    const months = [
        { year: currentYear, month: currentMonth },
        { year: currentMonth === 0 ? currentYear - 1 : currentYear, month: currentMonth === 0 ? 11 : currentMonth - 1 },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 justify-end bg-black/60">
                <View
                    className="bg-cozyBg rounded-t-3xl p-5 pb-8"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 12,
                        elevation: 16,
                    }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-fredoka-bold text-deepBrown">
                            Jump to a day
                        </Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color="#7D6E6B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {months.map(({ year, month }) => (
                            <View key={`${year}-${month}`} className="mb-6">
                                <Text className="text-base font-fredoka-semibold text-deepBrown mb-2">
                                    {monthLabel(year, month)}
                                </Text>

                                {/* Weekday header */}
                                <View className="flex-row mb-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <Text key={i} className="flex-1 text-center text-xs font-fredoka text-mutedBrown">
                                            {d}
                                        </Text>
                                    ))}
                                </View>

                                {/* Day grid */}
                                <View className="flex-row flex-wrap">
                                    {buildMonthDays(year, month).map((date, i) => {
                                        if (!date) {
                                            return <View key={`e-${i}`} className="w-[14.28%] aspect-square" />;
                                        }
                                        const isSelected = date === selectedDate;
                                        return (
                                            <TouchableOpacity
                                                key={date}
                                                onPress={() => {
                                                    onSelectDate(date);
                                                    onClose();
                                                }}
                                                activeOpacity={0.7}
                                                className={`w-[14.28%] aspect-square items-center justify-center rounded-full ${
                                                    isSelected ? 'bg-focusHero' : ''
                                                }`}
                                            >
                                                <Text
                                                    className={`text-sm font-fredoka ${
                                                        isSelected ? 'text-white' : 'text-deepBrown'
                                                    }`}
                                                >
                                                    {Number(date.split('-')[2])}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
