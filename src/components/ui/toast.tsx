import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

export interface ToastData {
    /** The short message to display, e.g. "Task completed". */
    message: string;
    /** Optional label for the undo action, e.g. "Undo". */
    undoLabel?: string;
    /** Called when the undo action is pressed. */
    onUndo?: () => void;
}

interface ToastProps {
    /** The toast data, or null/undefined to hide the toast. */
    toast: ToastData | null;
    /** Called when the toast auto-dismisses (after the timeout). */
    onDismiss?: () => void;
}

// How long the toast stays visible when an undo action is available.
const WITH_UNDO_DURATION_MS = 10_000;
// How long the toast stays visible when there is no undo action.
const WITHOUT_UNDO_DURATION_MS = 3_000;

// A cozy, reusable toast for short success messages. It can optionally show an
// Undo action and auto-dismisses after a short delay (10s when Undo is shown).
// It is independent of any task/habit logic — pass in plain data.
export default function Toast({ toast, onDismiss }: ToastProps) {
    // Track the dismissal timeout so we can clear it when the toast changes.
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Clear any existing timeout before scheduling a new one.
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (!toast) {
            return;
        }

        const duration = toast.onUndo ? WITH_UNDO_DURATION_MS : WITHOUT_UNDO_DURATION_MS;
        timeoutRef.current = setTimeout(() => {
            onDismiss?.();
        }, duration);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [toast, onDismiss]);

    if (!toast) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInDown.duration(250)}
            exiting={FadeOutDown.duration(200)}
            pointerEvents="box-none"
            className="absolute left-5 right-5"
            style={{ bottom: 120 }}
        >
            <View className="flex-row items-center bg-deepBrown rounded-2xl px-4 py-3 shadow-md">
                {/* Success checkmark */}
                <Ionicons name="checkmark-circle" size={22} color="#E2EBE2" />

                {/* Message */}
                <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    className="flex-1 text-sm font-fredoka-medium text-cozyBg ml-2.5"
                >
                    {toast.message}
                </Text>

                {/* Optional Undo action */}
                {toast.onUndo && (
                    <TouchableOpacity
                        onPress={() => {
                            toast.onUndo?.();
                            onDismiss?.();
                        }}
                        activeOpacity={0.7}
                        className="ml-3 px-3 py-1.5 rounded-lg bg-focusHero"
                    >
                        <Text className="text-sm font-fredoka-semibold text-white">
                            {toast.undoLabel ?? 'Undo'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
}
