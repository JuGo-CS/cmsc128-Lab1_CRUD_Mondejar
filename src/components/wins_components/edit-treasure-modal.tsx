import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
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
// category. Includes a confirmation step before applying any changes.
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
    const [confirming, setConfirming] = useState(false);

    // Reset the form whenever a new task is opened.
    useEffect(() => {
        if (log) {
            setStatus('completed');
            setTitle(log.title);
            setDescription(log.description ?? '');
            setCatId(log.catId);
            setConfirming(false);
        }
    }, [log]);

    // Reset the confirmation step when the modal closes.
    useEffect(() => {
        if (!visible) {
            setConfirming(false);
        }
    }, [visible]);

    const handleClose = () => {
        Keyboard.dismiss();
        setConfirming(false);
        onClose();
    };

    // Move to the confirmation step. Nothing is saved yet.
    const handleSavePress = () => {
        if (!title.trim()) return;
        Keyboard.dismiss();
        setConfirming(true);
    };

    // Apply the edit — this is the only place that updates the database.
    const handleConfirm = () => {
        if (!title.trim()) return;
        onConfirm({
            status,
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            cat_id: catId,
        });
    };

    const selectedCategory = categories.find((c) => c.cat_id === catId);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1 justify-end"
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View
                        className="bg-cozyBg rounded-t-3xl p-5 pb-8 max-h-[85%]"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 16,
                        }}
                    >
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-fredoka-bold text-deepBrown">
                                {confirming ? 'Confirm Changes' : 'Edit Treasure'}
                            </Text>
                            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} disabled={saving}>
                                <Ionicons name="close" size={24} color="#7D6E6B" />
                            </TouchableOpacity>
                        </View>

                        {confirming ? (
                            /* Confirmation step */
                            <View>
                                <Text className="text-base font-fredoka text-mutedBrown mb-4">
                                    Are you sure you want to apply these changes?
                                </Text>

                                <View className="bg-cardBg rounded-2xl p-4 mb-6">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown">Status</Text>
                                        <Text className="text-sm font-fredoka-semibold text-deepBrown capitalize">
                                            {status}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown">Title</Text>
                                        <Text numberOfLines={1} className="text-sm font-fredoka-semibold text-deepBrown flex-1 text-right ml-4">
                                            {title.trim()}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center justify-between mb-2">
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown">Description</Text>
                                        <Text numberOfLines={2} className="text-sm font-fredoka text-deepBrown flex-1 text-right ml-4">
                                            {description.trim() || '—'}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown">Category</Text>
                                        <Text className="text-sm font-fredoka-semibold text-deepBrown">
                                            {selectedCategory
                                                ? `${selectedCategory.emoji} ${selectedCategory.cat_name}`
                                                : 'None'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => setConfirming(false)}
                                        activeOpacity={0.7}
                                        disabled={saving}
                                        className="flex-1 py-3 rounded-xl items-center mr-2 bg-cardBg"
                                    >
                                        <Text className="font-fredoka-bold text-deepBrown">Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleConfirm}
                                        activeOpacity={0.85}
                                        disabled={saving}
                                        className="flex-1 py-3 rounded-xl items-center bg-focusHero"
                                    >
                                        <Text className="font-fredoka-bold text-white">
                                            {saving ? 'Saving...' : 'Confirm'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            /* Edit form */
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
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
                                                        {cat.cat_name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </View>

                                {/* Actions */}
                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={handleClose}
                                        activeOpacity={0.7}
                                        disabled={saving}
                                        className="flex-1 py-3 rounded-xl items-center mr-2 bg-cardBg"
                                    >
                                        <Text className="font-fredoka-bold text-deepBrown">
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSavePress}
                                        activeOpacity={0.85}
                                        disabled={!title.trim()}
                                        className="flex-1 py-3 rounded-xl items-center bg-focusHero"
                                    >
                                        <Text className="font-fredoka-bold text-white">
                                            Save
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
