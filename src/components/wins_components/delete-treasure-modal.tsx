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
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            {/* Dimmed backdrop — guides focus to the dialog */}
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    paddingHorizontal: 35,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 360,
                        backgroundColor: '#FDFBF7',
                        borderRadius: 24,
                        padding: 24,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 16,
                    }}
                >
                    {/* Warning icon */}
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <View
                            style={{
                                backgroundColor: 'rgba(244, 197, 181, 0.4)',
                                borderRadius: 999,
                                padding: 16,
                            }}
                        >
                            <Ionicons name="trash-outline" size={32} color="#C0392B" />
                        </View>
                    </View>

                    {/* Heading */}
                    <Text
                        style={{
                            fontFamily: 'Fredoka_700Bold',
                            fontSize: 20,
                            color: '#2C221E',
                            textAlign: 'center',
                            marginBottom: 4,
                        }}
                    >
                        Delete this treasure?
                    </Text>

                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            fontFamily: 'Fredoka_600SemiBold',
                            fontSize: 16,
                            color: '#2C221E',
                            textAlign: 'center',
                            marginBottom: 32,
                        }}
                    >
                        "{log?.title}"
                    </Text>
                    <Text
                        style={{
                            fontFamily: 'Fredoka_400Regular',
                            fontSize: 14,
                            color: '#7D6E6B',
                            textAlign: 'center',
                            marginBottom: 24,
                        }}
                    >
                        This action will delete a task/habit.
                    </Text>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            disabled={deleting}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: 'center',
                                marginRight: 8,
                                backgroundColor: '#F9F6F0',
                            }}
                        >
                            <Text style={{ fontFamily: 'Fredoka_700Bold', color: '#2C221E' }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => log && onConfirmDelete(log)}
                            activeOpacity={0.85}
                            disabled={deleting}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: 'center',
                                backgroundColor: '#C0392B',
                            }}
                        >
                            <Text style={{ fontFamily: 'Fredoka_700Bold', color: '#FFFFFF' }}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
