import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TaskActionsProps {
    /** Called when the user taps "Edit". */
    onEdit: () => void;
    /** Called when the user taps "Delete". */
    onDelete: () => void;
}

// Reusable Edit/Delete action buttons shown when a task card is tapped in edit
// mode. Shared across Home, Wins, and Calendar so task actions look identical
// everywhere. Matches the Home Edit Mode visual reference.
export default function TaskActions({ onEdit, onDelete }: TaskActionsProps) {
    return (
        <View className="flex-row items-center gap-x-2 pt-2 pb-1">
    {/* Edit Button — Soft Earthy Sage Accent */}
    <TouchableOpacity
        onPress={onEdit}
        activeOpacity={0.7}
        className="flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-focusHero/15 border border-focusHero/20 shadow-xs"
    >
        <Ionicons name="create-outline" size={16} color="#6B8E70" />
        <Text className="text-sm font-fredoka-semibold text-focusHero ml-1.5">
            Edit
        </Text>
    </TouchableOpacity>

    {/* Delete Button — Soft Terracotta Accent */}
    <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.7}
        className="flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 shadow-xs"
    >
        <Ionicons name="trash-outline" size={16} color="#C0392B" />
        <Text className="text-sm font-fredoka-semibold text-red-700 ml-1.5">
            Delete
        </Text>
    </TouchableOpacity>
</View>
    );
}
