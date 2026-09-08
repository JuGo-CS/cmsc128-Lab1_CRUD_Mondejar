import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import TaskItem, { TaskItemData } from './task-item';

interface OtherTasksProps {
    tasks: TaskItemData[];
    onToggleTask?: (task: TaskItemData) => void;
    /** Whether the full task queue is expanded. */
    expanded: boolean;
    /** Toggle the expanded/collapsed state. */
    onToggleExpanded: () => void;
}

// Fixed header for the "Other tasks" section (title + edit button).
// Rendered outside the scrollable area so it stays pinned on screen.
export function OtherTasksHeader() {
    return (
        <View className="flex-row items-center justify-between">
            <Text className="text-xl font-fredoka text-deepBrown">
                Other tasks:
            </Text>
            <TouchableOpacity
                onPress={() => {
                    // TODO: Later e connect na sa database edit flow
                    console.log('Edit tasks');
                }}
                activeOpacity={0.7}
                className="p-1"
            >
                <Ionicons name="create-outline" size={22} color="#7D6E6B" />
            </TouchableOpacity>
        </View>
    );
}

// "Other tasks" section — shows a low-pressure stacked preview of a few tasks.
// Tapping the stack or "See some tasks" expands the full queue; tapping again collapses.
export default function OtherTasks({ tasks, onToggleTask, expanded, onToggleExpanded }: OtherTasksProps) {
    // Show a limited number of tasks in the stacked preview.
    const PREVIEW_COUNT = 3;
    const visibleTasks = expanded ? tasks : tasks.slice(0, PREVIEW_COUNT);
    const hasMore = tasks.length > PREVIEW_COUNT;

    // Empty state — no other tasks remaining.
    if (tasks.length === 0) {
        return (
            <View className="mt-2">
                <View className="bg-cardBg rounded-2xl px-5 py-6 items-center justify-center">
                    <Ionicons name="checkmark-done-circle-outline" size={40} color="#7D6E6B" />
                    <Text className="text-base font-fredoka-medium text-mutedBrown text-center mt-3">
                        Nothing else on your plate. Nice and light!
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="mt-2">
            {/* Stacked task area — touchable to expand/collapse */}
            <TouchableOpacity
                onPress={onToggleExpanded}
                activeOpacity={0.9}
                className="mt-2"
            >
                {expanded ? (
                    // Expanded: show all tasks as normal stacked rows
                    visibleTasks.map((task) => (
                        <View
                            key={task.id}
                            className="bg-taskStack rounded-2xl px-4 mb-3 border border-white/50"
                        >
                            <TaskItem task={task} onToggle={onToggleTask} compact />
                        </View>
                    ))
                ) : (
                    // Collapsed: show a clean stack — the first task (next in line) is the front card,
                    // with the rest of the queue peeking out behind/below it in order.
                    <View className="relative" style={{ paddingBottom: (visibleTasks.length - 1) * 12 }}>
                        {/* Front card — the task at the top of the queue (next in line) */}
                        <View
                            className="relative z-10 bg-taskStack rounded-2xl px-4 border border-white/50"
                            style={{
                                shadowColor: '#3D2E2B',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 6,
                                elevation: 4,
                            }}
                        >
                            <TaskItem
                                task={visibleTasks[0]}
                                onToggle={onToggleTask}
                                compact
                            />
                        </View>
                        {/* Remaining queue tasks peek out from behind the front card, in order */}
                        {visibleTasks.slice(1).map((task, index) => (
                            <View
                                key={task.id}
                                className="absolute left-0 right-0 bg-taskStack rounded-2xl px-4 border border-white/50"
                                style={{
                                    top: (index + 1) * 12,
                                    zIndex: index,
                                    opacity: 0.70,
                                }}
                            >
                                <TaskItem task={task} onToggle={onToggleTask} compact muted />
                            </View>
                        ))}
                    </View>
                )}
            </TouchableOpacity>

            {/* "See some tasks" toggle */}
            <TouchableOpacity
                onPress={onToggleExpanded}
                activeOpacity={0.7}
                className="flex-row items-center justify-end mt-3"
            >
                <Text className="text-lg font-fredoka-semibold text-deepBrown underline">
                    {expanded ? 'See fewer tasks' : 'See some tasks'}
                </Text>
                <Ionicons
                    name={expanded ? 'caret-up' : 'caret-down'}
                    size={16}
                    color="#3D2E2B"
                    style={{ marginLeft: 4 }}
                />
            </TouchableOpacity>
        </View>
    );
}
