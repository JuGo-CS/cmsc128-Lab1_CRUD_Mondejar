import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WinsCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    /** Called with the selected date as `YYYY-MM-DD`. */
    onSelectDate: (date: string) => void;
    /** The currently selected date as `YYYY-MM-DD`. */
    selectedDate: string;
}

/** Format a `YYYY-MM-DD` string into "September 12, 2026" style label. */
function formatFullDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
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

// A day cell that scales up slightly when tapped, giving tactile feedback.
function DayCell({
    date,
    isSelected,
    isToday,
    onPress,
}: {
    date: string;
    isSelected: boolean;
    isToday: boolean;
    onPress: () => void;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.85, duration: 90, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
        onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7} className="w-[14.28%] aspect-square items-center justify-center">
            <Animated.View
                style={{ transform: [{ scale }] }}
                className={`w-10 h-10 items-center justify-center rounded-full ${
                    isSelected
                        ? 'bg-focusHero'
                        : isToday
                        ? 'bg-focusHero/20'
                        : 'bg-transparent'
                }`}
            >
                <Text
                    className={`text-base font-fredoka-semibold ${
                        isSelected
                            ? 'text-white'
                            : isToday
                            ? 'text-focusHero'
                            : 'text-deepBrown'
                    }`}
                >
                    {Number(date.split('-')[2])}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
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
    const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Show current month first, then the previous month.
    const months = [
        { year: currentYear, month: currentMonth },
        { year: currentMonth === 0 ? currentYear - 1 : currentYear, month: currentMonth === 0 ? 11 : currentMonth - 1 },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/60 pt-40">
                <View
                    className="bg-cozyBg rounded-t-3xl p-6 pb-8"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 12,
                        elevation: 16,
                    }}
                >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 pr-4">
                            <Text className="text-2xl font-fredoka-bold text-deepBrown">
                                Jump to a day
                            </Text>
                            <Text className="text-sm font-fredoka text-mutedBrown mt-1">
                                Currently viewing
                            </Text>
                            <Text className="text-base font-fredoka-semibold text-focusHero mt-0.5">
                                {formatFullDate(selectedDate)}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
                            <Ionicons name="close" size={26} color="#7D6E6B" />
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View className="h-[2px] bg-deepBrown/10 mb-5" />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {months.map(({ year, month }) => (
                            <View key={`${year}-${month}`} className="mb-6">
                                {/* Month label */}
                                <Text className="text-lg font-fredoka-bold text-deepBrown mb-3">
                                    {monthLabel(year, month)}
                                </Text>

                                {/* Weekday header */}
                                <View className="flex-row mb-2">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <Text key={i} className="flex-1 text-center text-xs font-fredoka-semibold text-mutedBrown">
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
                                        return (
                                            <DayCell
                                                key={date}
                                                date={date}
                                                isSelected={date === selectedDate}
                                                isToday={date === todayStr}
                                                onPress={() => {
                                                    onSelectDate(date);
                                                    onClose();
                                                }}
                                            />
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
