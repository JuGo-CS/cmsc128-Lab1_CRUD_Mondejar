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
import { Category, TreasureLog } from '@/features/treasures/treasures.types';
import WinsCalendarModal from '@/components/wins_components/wins-calendar-modal';

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
        deadline: string | null;
    }) => void;
    saving?: boolean;
}

/** Today's date as `YYYY-MM-DD` in local time. */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Format a `YYYY-MM-DD` string into a friendly label like "Sep 12, 2026". */
function formatDeadline(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Validate a deadline string in YYYY-MM-DD format. */
function isValidDeadline(dateStr: string): boolean {
    if (!dateStr) return true; // empty is allowed (optional)
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Check if the date is valid and not NaN
    return date instanceof Date && !isNaN(date.getTime());
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
    const [deadline, setDeadline] = useState<string | null>(null);
    const [deadlinePickerVisible, setDeadlinePickerVisible] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Validation errors
    const [titleError, setTitleError] = useState<string | null>(null);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [deadlineError, setDeadlineError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset the form whenever a new task is opened, loading the task's actual
    // database values (status, deadline, etc.) instead of incorrect defaults.
    useEffect(() => {
        if (log) {
            setStatus(log.status);
            setTitle(log.title);
            setDescription(log.description ?? '');
            setCatId(log.catId);
            setDeadline(log.deadline);
            setConfirming(false);
            // Reset errors
            setTitleError(null);
            setDescriptionError(null);
            setDeadlineError(null);
            setError(null);
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

    // Validate the form and move to the confirmation step if valid.
    const handleSavePress = () => {
        // Reset errors
        setTitleError(null);
        setDescriptionError(null);
        setDeadlineError(null);
        setError(null);

        // Validate title
        const trimmedTitle = title.trim();
        if (trimmedTitle.length === 0) {
            setTitleError('Title is required.');
            return;
        }
        if (trimmedTitle.length > 100) {
            setTitleError('Title must be 100 characters or less.');
            return;
        }

        // Validate description length (if provided)
        if (description.trim().length > 500) {
            setDescriptionError('Description must be 500 characters or less.');
            return;
        }

        // Validate deadline format
        if (!isValidDeadline(deadline ?? '')) {
            setDeadlineError('Please enter a valid date (YYYY-MM-DD).');
            return;
        }

        // If all valid, proceed to confirmation.
        Keyboard.dismiss();
        setConfirming(true);
    };

    // Apply the edit — this is the only place that updates the database.
    const handleConfirm = () => {
        // Double-check validation (should already be valid from handleSavePress)
        const trimmedTitle = title.trim();
        if (trimmedTitle.length === 0) {
            setTitleError('Title is required.');
            return;
        }
        if (trimmedTitle.length > 100) {
            setTitleError('Title must be 100 characters or less.');
            return;
        }
        if (description.trim().length > 500) {
            setDescriptionError('Description must be 500 characters or less.');
            return;
        }
        if (!isValidDeadline(deadline ?? '')) {
            setDeadlineError('Please enter a valid date (YYYY-MM-DD).');
            return;
        }

        setError(null);
        onConfirm({
            status,
            title: trimmedTitle,
            description: description.trim() ? description.trim() : null,
            cat_id: catId,
            deadline: deadline ?? null,
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
                                    <View className="flex-row items-center justify-between mt-2">
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown">Deadline</Text>
                                        <Text className="text-sm font-fredoka-semibold text-deepBrown">
                                            {deadline ? formatDeadline(deadline) : 'None'}
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
                                    onChangeText={(text) => {
                                        setTitle(text);
                                        if (titleError) setTitleError(null);
                                    }}
                                    placeholder="Task title"
                                    placeholderTextColor="#7D6E6B"
                                    className="bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-4"
                                />
                                {titleError && (
                                    <Text className="text-sm font-fredoka text-[#C0392B] mb-2">
                                        {titleError}
                                    </Text>
                                )}

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
                                {descriptionError && (
                                    <Text className="text-sm font-fredoka text-[#C0392B] mb-2">
                                        {descriptionError}
                                    </Text>
                                )}

                                {/* Category */}
                                <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">
                                    Category
                                </Text>
                                <View className="flex-row flex-wrap mb-4">
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

                                {/* Deadline */}
                                <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">
                                    Deadline
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setDeadlinePickerVisible(true)}
                                    activeOpacity={0.8}
                                    className="flex-row items-center bg-cardBg rounded-xl px-4 py-3 mb-6"
                                >
                                    <Ionicons name="calendar-outline" size={20} color="#7D6E6B" />
                                    <Text className={`ml-3 text-base font-fredoka ${deadline ? 'text-deepBrown' : 'text-mutedBrown'}`}>
                                        {deadline ? formatDeadline(deadline) : 'Pick a date (optional)'}
                                    </Text>
                                    {deadline ? (
                                        <TouchableOpacity
                                            onPress={() => setDeadline(null)}
                                            activeOpacity={0.7}
                                            className="ml-auto"
                                        >
                                            <Ionicons name="close-circle" size={20} color="#7D6E6B" />
                                        </TouchableOpacity>
                                    ) : (
                                        <Ionicons name="chevron-forward" size={20} color="#7D6E6B" className="ml-auto" />
                                    )}
                                </TouchableOpacity>
                                {deadlineError && (
                                    <Text className="text-sm font-fredoka text-[#C0392B] mb-2">
                                        {deadlineError}
                                    </Text>
                                )}

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
                                        disabled={!!titleError || !!descriptionError || !!deadlineError || !!error}
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

                {/* Deadline date picker */}
                <WinsCalendarModal
                    visible={deadlinePickerVisible}
                    onClose={() => setDeadlinePickerVisible(false)}
                    onSelectDate={(date) => {
                        setDeadline(date);
                        setDeadlinePickerVisible(false);
                    }}
                    selectedDate={deadline || todayDateString()}
                />
            </KeyboardAvoidingView>
        </Modal>
    );
}