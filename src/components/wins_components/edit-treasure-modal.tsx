import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Category, TreasureLog } from '@/dp_operations/wins/treasures';

interface EditTreasureModalProps {
    visible: boolean;
    log: TreasureLog | null;
    categories: Category[];
    onClose: () => void;
    /** Called with the edited payload when the user confirms the changes. */
    onConfirm: (payload: {
        status: 'completed' | 'pending';
        title: string;
        description: string | null;
        cat_id: string | null;
    }) => void;
    saving?: boolean;
}

// A modal to edit a completed task ("Treasure"): status, title, description, and
// category. Requires a confirmation action before saving.
export default function EditTreasureModal({
    visible,
    log,
    categories,
    onClose,
    onConfirm,
    saving,
}: EditTreasureModalProps) {
    const [status, setStatus] = useState<'completed' | 'pending'>('completed');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [catId, setCatId] = useState<string | null>(null);

    // Reset the form whenever a new task is opened.
    useEffect(() => {
        if (log) {
            setStatus('completed');
            setTitle(log.title);
            setDescription(log.description ?? '');
            setCatId(log.catId);
        }
    }, [log]);

    const handleConfirm = () => {
        if (!title.trim()) return;
        onConfirm({
            status,
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            cat_id: catId,
        });
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 justify-end bg-black/30">
                <View className="bg-cozyBg rounded-t-3xl p-5 pb-8">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-fredoka-bold text-deepBrown">
                            Edit Treasure
                        </Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7} disabled={saving}>
                            <Ionicons name="close" size={24} color="#7D6E6B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Status toggle */}
                        <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">
                            Status
                        </Text>
                        <View className="flex-row mb-4">
                            <TouchableOpacity
                                onPress={() => setStatus('completed')}
                                activeOpacity={0.7}
                                className={`flex-1 py-2.5 rounded-xl items-center mr-2 ${
                                    status === 'completed' ? 'bg-focusHero' : 'bg-cardBg'
                                }`}
                            >
                                <Text className={`font-fredoka-semibold ${status === 'completed' ? 'text-white' : 'text-deepBrown'}`}>
                                    Completed
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setStatus('pending')}
                                activeOpacity={0.7}
                                className={`flex-1 py-2.5 rounded-xl items-center ${
                                    status === 'pending' ? 'bg-focusHero' : 'bg-cardBg'
                                }`}
                            >
                                <Text className={`font-fredoka-semibold ${status === 'pending' ? 'text-white' : 'text-deepBrown'}`}>
                                    Pending
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Title */}
                        <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">
                            Title
                        </Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Task title"
                            placeholderTextColor="#7D6E6B"
                            className="bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-4"
                        />

                        {/* Description */}
                        <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">
                            Description
                        </Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Optional description"
                            placeholderTextColor="#7D6E6B"
                            multiline
                            className="bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-4 min-h-[80px]"
                        />

                        {/* Category */}
                        <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">
                            Category
                        </Text>
                        <View className="flex-row flex-wrap mb-6">
                            {categories.length === 0 ? (
                                <Text className="text-sm font-fredoka text-mutedBrown">
                                    No categories available.
                                </Text>
                            ) : (
                                categories.map((cat) => {
                                    const selected = cat.cat_id === catId;
                                    return (
                                        <TouchableOpacity
                                            key={cat.cat_id}
                                            onPress={() => setCatId(selected ? null : cat.cat_id)}
                                            activeOpacity={0.7}
                                            className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 ${
                                                selected ? 'bg-focusHero' : 'bg-cardBg'
                                            }`}
                                        >
                                            <Text className="mr-1">{cat.emoji}</Text>
                                            <Text className={`font-fredoka-semibold ${selected ? 'text-white' : 'text-deepBrown'}`}>
                                                {cat.title}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>

                        {/* Actions */}
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={onClose}
                                activeOpacity={0.7}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl items-center mr-2 bg-cardBg"
                            >
                                <Text className="font-fredoka-bold text-deepBrown">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleConfirm}
                                activeOpacity={0.85}
                                disabled={saving || !title.trim()}
                                className="flex-1 py-3 rounded-xl items-center bg-focusHero"
                            >
                                <Text className="font-fredoka-bold text-white">
                                    {saving ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
