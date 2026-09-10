import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TreasureLog } from '@/dp_operations/wins/treasures';

interface DeleteTreasureModalProps {
    visible: boolean;
    log: TreasureLog | null;
    onClose: () => void;
    /** Called only when the user confirms the permanent deletion. */
    onConfirmDelete: (log: TreasureLog) => void;
    deleting?: boolean;
}

// A confirmation dialog for deleting a completed task ("Treasure").
// Clearly communicates permanent deletion and requires an explicit confirm.
export default function DeleteTreasureModal({
    visible,
    log,
    onClose,
    onConfirmDelete,
    deleting,
}: DeleteTreasureModalProps) {
    return (
        <Modal 
            visible={visible} 
            transparent 
            statusBarTranslucent
            animationType="fade" 
            onRequestClose={onClose}
        >
            {/* Dimmed backdrop — guides focus to the dialog */}
            <View className="flex-1 items-center justify-center bg-black/60 px-[35px]">
                {/* Modal Container */}
                <View className="w-full max-w-[360px] bg-[#FDFBF7] rounded-[24px] p-[24px] shadow-black shadow-lg elevation-[16]">
                    {/* Warning icon */}
                    <View className="items-center mb-[16px]">
                        <View className="bg-[#F4C5B5]/40 rounded-full p-[16px]">
                            <Ionicons name="trash-outline" size={32} color="#C0392B" />
                        </View>
                    </View>

                    {/* Heading */}
                    <Text className="font-fredoka-bold text-[20px] text-[#2C221E] text-center mb-[4px]">
                        Delete this treasure?
                    </Text>

                    {/* Subtitle / Item Title */}
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="font-fredoka-semibold text-[16px] text-[#2C221E] text-center mb-[32px]"
                    >
                        "{log?.title}"
                    </Text>

                    {/* Body text */}
                    <Text className="font-fredoka text-[14px] text-[#7D6E6B] text-center mb-[24px]">
                        This action will delete a task/habit.
                    </Text>

                    {/* Actions */}
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            disabled={deleting}
                            className="flex-1 py-[12px] rounded-[12px] items-center mr-[8px] bg-[#F9F6F0]"
                        >
                            <Text className="font-fredoka-bold text-[#2C221E]">
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => log && onConfirmDelete(log)}
                            activeOpacity={0.85}
                            disabled={deleting}
                            className="flex-1 py-[12px] rounded-[12px] items-center bg-[#C0392B]"
                        >
                            <Text className="font-fredoka-bold text-white">
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}