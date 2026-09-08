import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CalendarTask, SortCriteria } from '@/dp_operations/calendar/tasks';

// Priority badge colors — match the Unti-Unti priority palette.
const PRIORITY_STYLES: Record<CalendarTask['priority'], { bg: string; label: string }> = {
    high: { bg: '#F4C5B5', label: 'High' },
    medium: { bg: '#F3E1B9', label: 'Medium' },
    low: { bg: '#C3E2DD', label: 'Low' },
};

// The bottom-bar background color when sorting by category (light blue).
const CATEGORY_BADGE_BG = '#D4E5F7';
const CREATEDAT_BADGE_BG = '#E1D5E7'

interface CalendarTaskCardProps {
    task: CalendarTask;
    /** The active sort criterion — determines what the bottom detail shows. */
    sortCriteria: SortCriteria;
    onToggle?: (task: CalendarTask) => void;
}

/** Format a `YYYY-MM-DD` date into a short friendly label like "Sep 12, 2026". */
function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'No deadline';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Format a `created_at` timestamp into a short friendly label like "Sep 9, 2026". */
function formatCreatedAt(createdAt: string): string {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Resolve the bottom-detail text for a task based on the active sort criterion. */
function detailForCriteria(task: CalendarTask, criteria: SortCriteria): string {
    switch (criteria) {
        case 'priority':
            return PRIORITY_STYLES[task.priority].label;
        case 'deadline':
            return formatDate(task.deadline);
        case 'category':
            return task.categoryName ?? 'No category';
        case 'createdAt':
            return formatCreatedAt(task.createdAt);
        default:
            return '';
    }
}

/** Resolve the bottom-bar background color based on the active sort criterion. */
function bgForCriteria(task: CalendarTask, criteria: SortCriteria): string {
    switch (criteria) {
        case 'priority':
            return PRIORITY_STYLES[task.priority].bg;
        case 'category':
            return CATEGORY_BADGE_BG;
        case 'createdAt':
            return CREATEDAT_BADGE_BG;
        default:
            return PRIORITY_STYLES[task.priority].bg;
    }
}

// A task card in the date-based calendar queue. Shows the task row (icon, title,
// checkbox) on top and a detail bar below whose text and color follow the sort.
export default function CalendarTaskCard({ task, sortCriteria, onToggle }: CalendarTaskCardProps) {
    const detail = detailForCriteria(task, sortCriteria);
    const bg = bgForCriteria(task, sortCriteria);

    return (
        <View className="bg-cardBg rounded-2xl mb-4 overflow-hidden border border-white/50">
            {/* Task row */}
            <View className="flex-row items-center px-4 py-3 bg-habitCard">
                {/* Task icon */}
                <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                    <Ionicons name={task.iconName} size={20} color="#7D6E6B" />
                </View>

                {/* Title */}
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="flex-1 text-base font-fredoka-semibold text-deepBrown"
                >
                    {task.title}
                </Text>

                {/* Checkbox */}
                <TouchableOpacityCheckbox
                    completed={task.completed}
                    onPress={() => onToggle?.(task)}
                />
            </View>

            {/* Detail bar — text + color reflect the active sort criterion */}
            <View
                className="flex-row items-center justify-between px-4 py-2"
                style={{ backgroundColor: bg }}
            >
                <Text numberOfLines={1} className="flex-1 text-base font-fredoka-semibold text-deepBrown">
                    {detail}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#3D2E2B" />
            </View>
        </View>
    );
}

// A simple reusable checkbox used inside the task card.
function TouchableOpacityCheckbox({
    completed,
    onPress,
}: {
    completed: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="ml-3"
        >
            <View
                className={`w-6 h-6 rounded-md items-center justify-center border-2 ${
                    completed
                        ? 'bg-focusHero border-focusHero'
                        : 'bg-white/60 border-mutedBrown/40'
                }`}
            >
                {completed && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
            </View>
        </TouchableOpacity>
    );
}
