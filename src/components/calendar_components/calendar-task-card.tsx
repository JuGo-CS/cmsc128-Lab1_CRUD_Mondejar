import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import TaskActions from '@/components/ui/task-actions';
import { CalendarFilterCriteria } from '@/dp_operations/calendar/tasks';
import { HomeTask } from '@/dp_operations/home/tasks';

// Priority badge colors — match the Unti-Unti priority palette.
const PRIORITY_STYLES: Record<HomeTask['priority'], { bg: string; label: string }> = {
    high: { bg: '#F4C5B5', label: 'High' },
    medium: { bg: '#F3E1B9', label: 'Medium' },
    low: { bg: '#C3E2DD', label: 'Low' },
};

// The bottom-bar background color when sorting by category (light blue).
const CATEGORY_BADGE_BG = '#D4E5F7';
const CREATEDAT_BADGE_BG = '#E1D5E7';

interface CalendarTaskCardProps {
    task: HomeTask;
    /** The active Calendar filter criterion — determines what the bottom detail shows. */
    filterCriteria: CalendarFilterCriteria;
    /** 1-based global queue position used when the current filter is Manual. */
    queuePosition?: number;
    /** When true, the card is in global edit mode (unified, reveals actions). */
    editMode: boolean;
    onToggle?: (task: HomeTask) => void;
    onEdit?: (task: HomeTask) => void;
    onDelete?: (task: HomeTask) => void;
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

/** Format a `HH:MM` time into a 12-hour label like "5:00 P.M.". */
function formatTime(timeStr: string | null): string {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const formatted = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    // "5:00 PM" → "5:00 P.M."
    return formatted.replace(/\s?(AM|PM)/i, (_, m) => ` ${m.toUpperCase()}.`);
}

/** Format a deadline into "Sep 12, 2026 @ 5:00 P.M." (or just the date if no time). */
function formatDeadline(task: HomeTask): string {
    const datePart = formatDate(task.deadline);
    const timePart = formatTime(task.deadlineTime);
    return timePart ? `${datePart} @ ${timePart}` : datePart;
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

/** Format a numeric queue position into a friendly label like "1st in queue". */
function formatQueuePosition(position: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = position % 100;
    const suffix = suffixes[(remainder - 20) % 10] ?? suffixes[remainder] ?? suffixes[0];
    return `${position}${suffix} in queue`;
}

/** Resolve the bottom-detail text for a task based on the active Calendar filter. */
function detailForCriteria(task: HomeTask, criteria: CalendarFilterCriteria, queuePosition?: number): string {
    switch (criteria) {
        case 'manual':
            return formatQueuePosition(queuePosition ?? (task.isFocus ? 1 : 1));
        case 'priority':
            return PRIORITY_STYLES[task.priority].label;
        case 'deadline':
            return formatDeadline(task);
        case 'category':
            return task.categoryName ?? 'No category';
        case 'createdAt':
            return formatCreatedAt(task.createdAt);
        default:
            return '';
    }
}

/** Resolve the bottom-bar background color based on the active Calendar filter. */
function bgForCriteria(task: HomeTask, criteria: CalendarFilterCriteria): string {
    switch (criteria) {
        case 'manual':
            return PRIORITY_STYLES[task.priority].bg;
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

// A task card in the date-based calendar queue.
//
// Normal mode: two sections — the top row completes the task, the bottom bar
// expands to reveal details. Edit mode: the whole card is unified and tapping it
// reveals Edit / Delete actions (matching the Wins tab interaction).
export default function CalendarTaskCard({
    task,
    filterCriteria,
    queuePosition,
    editMode,
    onToggle,
    onEdit,
    onDelete,
}: CalendarTaskCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const detail = detailForCriteria(task, filterCriteria, queuePosition);
    const bg = bgForCriteria(task, filterCriteria);

    // Edit mode: the entire card is one tappable unit that reveals Edit/Delete.
    if (editMode) {
        return (
            <View className="mb-4">
                <TouchableOpacity
                    onPress={() => setShowActions((prev) => !prev)}
                    activeOpacity={0.8}
                    className="rounded-2xl overflow-hidden border border-white/50"
                >
                    <View className="flex-row items-center px-4 py-3 bg-habitCard">
                        <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                            <Ionicons name={task.iconName} size={20} color="#7D6E6B" />
                        </View>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            className="flex-1 text-base font-fredoka-semibold text-deepBrown"
                        >
                            {task.title}
                        </Text>
                    </View>
                    <View
                        className="flex-row items-center justify-between px-4 py-2"
                        style={{ backgroundColor: bg }}
                    >
                        <Text numberOfLines={1} className="flex-1 text-base font-fredoka-semibold text-deepBrown">
                            {detail}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#3D2E2B" />
                    </View>
                </TouchableOpacity>

                {/* Edit / Delete actions revealed on tap */}
                {showActions && (
                    <TaskActions
                        onEdit={() => onEdit?.(task)}
                        onDelete={() => onDelete?.(task)}
                    />
                )}
            </View>
        );
    }

    // Normal mode: top row completes, bottom bar expands details.
    return (
        <View className="bg-cardBg rounded-2xl mb-4 overflow-hidden border border-white/50">
            {/* Top section — tap to complete */}
            <TouchableOpacity
                onPress={() => onToggle?.(task)}
                activeOpacity={0.8}
                className="flex-row items-center px-4 py-3 bg-habitCard rounded-2xl z-20"
            >
                <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                    <Ionicons name={task.iconName} size={20} color="#7D6E6B" />
                </View>
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="flex-1 text-base font-fredoka-semibold text-deepBrown"
                >
                    {task.title}
                </Text>
                <TouchableOpacityCheckbox
                    completed={!!task.completed}
                    onPress={() => onToggle?.(task)}
                />
            </TouchableOpacity>

            {/* Bottom section — tap to expand/collapse details */}
            <TouchableOpacity
                onPress={() => setExpanded((prev) => !prev)}
                activeOpacity={0.8}
                className="flex-row justify-between px-4 py-3 -mt-3 z-10 rounded-b-2xl"
                style={{ backgroundColor: bg }}
            >
                <Text numberOfLines={1} className="flex-1 text-base font-fredoka-semibold text-deepBrown -bottom-1">
                    {detail}
                </Text>
                <Ionicons
                    name={expanded ? 'arrow-up' : 'arrow-down'}
                    size={18}
                    color="#3D2E2B"
                    className='-bottom-1'
                />
            </TouchableOpacity>

            {/* Expanded details */}
            {expanded && (
                <View className="px-4 pt-4 pb-5 bg-cardBg border-t border-deepBrown/10 rounded-b-2xl">
    {/* Description Section */}
    <View className="mb-4">
        <Text className="text-xs font-fredoka-semibold text-mutedBrown uppercase tracking-wider mb-1">
            Description
        </Text>
        <Text 
            className={`text-sm font-fredoka ${
                task.description ? 'text-deepBrown' : 'text-mutedBrown/70 italic'
            } leading-relaxed`}
            style={{ includeFontPadding: false }}
        >
            {task.description || 'No description provided.'}
        </Text>
    </View>

    {/* Details Grid Container */}
    <View className="bg-habitCard/60 rounded-xl p-3.5 gap-y-3 border border-white/60">
        {/* Status */}
        <DetailRow
            label="Status"
            value={task.completed ? 'Completed' : 'Pending'}
        />

        {/* Category */}
        <DetailRow
            label="Category"
            value={task.categoryName ?? 'None'}
        />

        {/* Deadline */}
        <DetailRow
            label="Deadline"
            value={task.deadline ? formatDeadline(task) : 'None'}
        />

        {/* Priority */}
        <DetailRow
            label="Priority"
            value={PRIORITY_STYLES[task.priority].label}
            accent={PRIORITY_STYLES[task.priority].bg}
        />
    </View>
</View>
            )}
        </View>
    );
}

// A single label/value row in the task-details section.
function DetailRow({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: string;
}) {
    return (
        <View className="flex-row items-center justify-between">
            <Text className="text-sm font-fredoka-semibold text-mutedBrown">
                {label}
            </Text>
            {accent ? (
                <View
                    className="px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: accent }}
                >
                    <Text className="text-sm font-fredoka-semibold text-deepBrown">
                        {value}
                    </Text>
                </View>
            ) : (
                <Text className="text-sm font-fredoka-semibold text-deepBrown">
                    {value}
                </Text>
            )}
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
