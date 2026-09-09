import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import TaskActions from '@/components/ui/task-actions';

export interface TaskItemData {
    id: string;
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
    completed?: boolean;
    /** Priority from `tasks.priority`: 'high' | 'medium' | 'low'. */
    priority?: 'high' | 'medium' | 'low';
    /** Deadline date as `YYYY-MM-DD`, or null if the task has no deadline. */
    deadline?: string | null;
    /** Category name from `categories.cat_name`. */
    categoryName?: string | null;
    /** When the task was created, used for time-added sorting. */
    createdAt?: string;
    /** Manual order index (0-based), when the DB has a `position` column. */
    position?: number | null;
    /** Whether this task is currently the Hero Task (`is_focus`). */
    isFocus?: boolean;
}

interface TaskItemProps {
    task: TaskItemData;
    onToggle?: (task: TaskItemData) => void;
    /** When true, the item is shown inside the stacked, condensed card layout. */
    compact?: boolean;
    /** When true, the content is faded/muted for back cards in the stack. */
    muted?: boolean;
    /** When true, the item is in global edit mode (drag + hero selection). */
    editMode?: boolean;
    /** Whether this task is the Hero Task (shown in edit mode). */
    isHero?: boolean;
    /** Called when the user taps "Make Hero" in edit mode. */
    onMakeHero?: (task: TaskItemData) => void;
    /** When true, the Edit/Delete actions are revealed (edit mode). */
    showActions?: boolean;
    /** Toggle the Edit/Delete actions (edit mode). */
    onToggleActions?: () => void;
    /** Called when the user taps "Edit" (edit mode). */
    onEdit?: (task: TaskItemData) => void;
    /** Called when the user taps "Delete" (edit mode). */
    onDelete?: (task: TaskItemData) => void;
}

// A single task row with an icon on the left and a checkbox on the right.
// Titles are truncated with an ellipsis when they are too long.
export default function TaskItem({
    task,
    onToggle,
    compact,
    muted,
    editMode,
    isHero,
    onMakeHero,
    showActions,
    onToggleActions,
    onEdit,
    onDelete,
}: TaskItemProps) {
    // In edit mode the checkbox is replaced by a drag handle + "Make Hero" action.
    // Tapping the task body reveals Edit/Delete actions (Wins tab pattern).
    if (editMode) {
        return (
            <View className={`${muted ? 'opacity-40' : ''}`}>
                <View className="flex-row items-center py-2.5">
                    {/* Drag handle — the whole card is press-and-hold draggable */}
                    <View className="p-2 mr-1">
                        <Ionicons name="reorder-three" size={24} color="#7D6E6B" />
                    </View>

                    {/* Task body — tap to reveal Edit/Delete actions */}
                    <TouchableOpacity
                        onPress={onToggleActions}
                        activeOpacity={0.7}
                        className="flex-row items-center flex-1"
                    >
                        {/* Task icon */}
                        <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                            <Ionicons name={task.iconName} size={20} color="#7D6E6B" />
                        </View>

                        {/* Truncated title */}
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            className="flex-1 text-base font-fredoka-medium text-deepBrown"
                        >
                            {task.title}
                        </Text>
                    </TouchableOpacity>

                    {/* Make Hero button — separate, only performs the Hero action */}
                    {isHero ? (
                        <View className="flex-row items-center ml-3 bg-focusHero rounded-lg px-2.5 py-1">
                            <Ionicons name="star" size={14} color="#FFFFFF" />
                            <Text className="text-xs font-fredoka-bold text-white ml-1">
                                Hero
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => onMakeHero?.(task)}
                            activeOpacity={0.7}
                            className="ml-3 flex-row items-center bg-focusHero/15 border border-focusHero/20 rounded-lg px-2.5 py-1.5"
                        >
                            <Ionicons name="star-outline" size={14} color="#6B8E70" />
                            <Text className="text-xs font-fredoka-semibold text-focusHero ml-1">
                                Make Hero
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

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

    return (
        <View className={`flex-row items-center py-2.5 ${muted ? 'opacity-40' : ''}`}>
            {/* Task icon */}
            <View className="bg-taskStack/40 rounded-lg p-2 mr-3">
                <Ionicons name={task.iconName} size={20} color="#7D6E6B" />
            </View>

            {/* Truncated title */}
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="flex-1 text-base font-fredoka-medium text-deepBrown"
            >
                {task.title}
            </Text>

            {/* Checkbox on the right */}
            <TouchableOpacity
                onPress={() => onToggle?.(task)}
                activeOpacity={0.7}
                className="ml-3"
            >
                <View
                    className={`w-6 h-6 rounded-md items-center justify-center border-2 ${
                        task.completed
                            ? 'bg-focusHero border-focusHero'
                            : 'bg-white/60 border-mutedBrown/40'
                    }`}
                >
                    {task.completed && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
}
