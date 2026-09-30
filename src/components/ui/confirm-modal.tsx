import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    visible,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
            {/* Backdrop */}
            <Pressable 
                onPress={onCancel}
                className="flex-1 bg-deepBrown/50 justify-center items-center px-6"
            >
                <Animated.View 
                    entering={FadeIn.duration(200)} 
                    exiting={FadeOut.duration(150)}
                    className="w-full bg-cozyBg border border-mutedBrown/20 rounded-3xl p-6 shadow-xl"
                >
                    {/* Title */}
                    <Text className="text-xl font-fredoka-bold text-deepBrown mb-2 text-center">
                        {title}
                    </Text>

                    {/* Message */}
                    <Text className="text-sm font-fredoka text-mutedBrown text-center mb-6 leading-5">
                        {message}
                    </Text>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={onCancel}
                            disabled={loading}
                            activeOpacity={0.8}
                            className="flex-1 bg-bgCardBg border border-mutedBrown/30 py-3.5 rounded-2xl items-center"
                        >
                            <Text className="font-fredoka-semibold text-deepBrown text-sm">
                                {cancelText}
                            </Text>
                        </TouchableOpacity>

                        {/* Confirm/Sign Out Button */}
                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={loading}
                            activeOpacity={0.8}
                            className="flex-1 bg-highPriority border border-mutedBrown/30 py-3.5 rounded-2xl items-center justify-center"
                        >
                            {loading ? (
                                <ActivityIndicator color="#2C221E" size="small" />
                            ) : (
                                <Text className="font-fredoka-bold text-deepBrown text-sm">
                                    {confirmText}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}