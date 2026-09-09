import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    // Top safe-area inset so the toast clears the status bar / notch.
    const insets = useSafeAreaInsets();

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
            entering={FadeInDown.duration(300)}
            exiting={FadeOutUp.duration(200)}
            pointerEvents="box-none"
            className="absolute left-5 right-5"
            style={{ top: insets.top + 12 }}
        >
            <View className="flex-row items-center bg-deepBrown rounded-3xl px-5 py-4 shadow-lg">
                {/* Success checkmark */}
                <View className="w-9 h-9 rounded-full bg-focusHero items-center justify-center mr-3">
                    <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                </View>

                {/* Message */}
                <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    className="flex-1 text-base font-fredoka-medium text-cozyBg"
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
                        className="ml-4 px-4 py-2.5 rounded-xl bg-focusHero"
                    >
                        <Text className="text-base font-fredoka-bold text-white">
                            {toast.undoLabel ?? 'Undo'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
}
