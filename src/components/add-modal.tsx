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
import { Category } from '@/dp_operations/wins/treasures';
import { createTask, createHabit } from '@/dp_operations/add/create';

interface AddModalProps {
    visible: boolean;
    onClose: () => void;
    /** Called after a successful save so the parent can refresh its data. */
    onSaved?: () => void;
}

type AddType = 'task' | 'habit';

// Priority options for the task form.
const PRIORITY_OPTIONS: { value: string; label: string }[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

// A modal to add a new Task or Daily Habit. Starts with a choice, then shows the
// appropriate form. Saving is disabled until required fields are filled.
export default function AddModal({ visible, onClose, onSaved }: AddModalProps) {
    const [step, setStep] = useState<'choose' | 'task' | 'habit'>('choose');
    const [categories, setCategories] = useState<Category[]>([]);

    // Task form state.
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [catId, setCatId] = useState<string | null>(null);
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState('medium');

    // Habit form state.
    const [habitTitle, setHabitTitle] = useState('');
    const [habitCatId, setHabitCatId] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);

    // Fetch categories when the modal opens.
    useEffect(() => {
        if (!visible) return;
        // Lazy import to avoid a circular dependency risk; categories come from
        // the wins treasures operations.
        import('@/dp_operations/wins/treasures')
            .then((mod) => mod.fetchCategories())
            .then((data) => setCategories(data))
            .catch((err) => console.error('Failed to load categories:', err));
    }, [visible]);

    // Reset the form when the modal is closed/reopened.
    useEffect(() => {
        if (!visible) {
            setStep('choose');
            setTitle('');
            setDescription('');
            setCatId(null);
            setDeadline('');
            setPriority('medium');
            setHabitTitle('');
            setHabitCatId(null);
            setError(null);
            setTitleError(null);
        }
    }, [visible]);

    const handleClose = () => {
        Keyboard.dismiss();
        onClose();
    };

    const canSaveTask = title.trim().length > 0;
    const canSaveHabit = habitTitle.trim().length > 0;

    const handleSaveTask = () => {
        if (saving) return;
        // Validate the title — show a friendly message and keep the modal open.
        if (!canSaveTask) {
            setTitleError('Please enter a task title before saving.');
            return;
        }
        setTitleError(null);
        setSaving(true);
        setError(null);
        createTask({
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            cat_id: catId,
            deadline: deadline.trim() ? deadline.trim() : null,
            priority,
        })
            .then(() => {
                onSaved?.();
                handleClose();
            })
            .catch((err) => {
                setError('Could not save the task. Please try again.');
                console.error('Failed to create task:', err);
            })
            .finally(() => setSaving(false));
    };

    const handleSaveHabit = () => {
        if (!canSaveHabit || saving) return;
        setSaving(true);
        setError(null);
        createHabit({
            title: habitTitle.trim(),
            cat_id: habitCatId,
        })
            .then(() => {
                onSaved?.();
                handleClose();
            })
            .catch((err) => {
                setError('Could not save the habit. Please try again.');
                console.error('Failed to create habit:', err);
            })
            .finally(() => setSaving(false));
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1 justify-end"
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View
                        className="bg-cozyBg rounded-t-3xl p-6 pb-16 max-h-[90%]"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 16,
                        }}
                    >
                        {/* Header */}
                        <View className="flex-row items-start justify-between mb-4">
                            <Text className="text-2xl font-fredoka-bold text-deepBrown">
                                {step === 'choose' ? 'Add New' : step === 'task' ? 'New Task' : 'New Habit'}
                            </Text>
                            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} className="p-1">
                                <Ionicons name="close" size={26} color="#7D6E6B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {step === 'choose' ? (
                                /* Choice step */
                                <View>
                                    <Text className="text-base font-fredoka text-mutedBrown mb-4">
                                        What would you like to create?
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setStep('task')}
                                        activeOpacity={0.85}
                                        className="flex-row items-center bg-cardBg rounded-2xl p-4 mb-3 border border-white/50"
                                    >
                                        <View className="bg-taskStack/40 rounded-xl p-3 mr-4">
                                            <Ionicons name="checkbox-outline" size={26} color="#7D6E6B" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-fredoka-bold text-deepBrown">Task</Text>
                                            <Text className="text-sm font-fredoka text-mutedBrown mt-0.5">
                                                Add something to your queue
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#7D6E6B" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setStep('habit')}
                                        activeOpacity={0.85}
                                        className="flex-row items-center bg-cardBg rounded-2xl p-4 border border-white/50"
                                    >
                                        <View className="bg-habitCard/60 rounded-xl p-3 mr-4">
                                            <Ionicons name="repeat-outline" size={26} color="#7D6E6B" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-fredoka-bold text-deepBrown">Daily Habit</Text>
                                            <Text className="text-sm font-fredoka text-mutedBrown mt-0.5">
                                                Add a little habit to repeat
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#7D6E6B" />
                                    </TouchableOpacity>
                                </View>
                            ) : step === 'task' ? (
                                /* Task form */
                                <View>
                                    <TouchableOpacity
                                        onPress={() => setStep('choose')}
                                        activeOpacity={0.7}
                                        className="flex-row items-center mb-4"
                                    >
                                        <Ionicons name="chevron-back" size={18} color="#7D6E6B" />
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown ml-1">Back</Text>
                                    </TouchableOpacity>

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Title</Text>
                                    <TextInput
                                        value={title}
                                        onChangeText={(text) => {
                                            setTitle(text);
                                            if (titleError) setTitleError(null);
                                        }}
                                        placeholder="What needs to be done?"
                                        placeholderTextColor="#7D6E6B"
                                        className={`bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-2 ${
                                            titleError ? 'border border-[#C0392B]' : ''
                                        }`}
                                    />
                                    {titleError && (
                                        <Text className="text-sm font-fredoka text-[#C0392B] mb-4">
                                            {titleError}
                                        </Text>
                                    )}

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Description</Text>
                                    <TextInput
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Optional details"
                                        placeholderTextColor="#7D6E6B"
                                        multiline
                                        className="bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-4 min-h-[70px]"
                                    />

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Category</Text>
                                    <View className="flex-row flex-wrap mb-4">
                                        {categories.length === 0 ? (
                                            <Text className="text-sm font-fredoka text-mutedBrown">No categories available.</Text>
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

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Deadline</Text>
                                    <TextInput
                                        value={deadline}
                                        onChangeText={setDeadline}
                                        placeholder="YYYY-MM-DD (optional)"
                                        placeholderTextColor="#7D6E6B"
                                        className="bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-4"
                                    />

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Priority</Text>
                                    <View className="flex-row mb-4">
                                        {PRIORITY_OPTIONS.map((opt) => {
                                            const selected = priority === opt.value;
                                            return (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    onPress={() => setPriority(opt.value)}
                                                    activeOpacity={0.7}
                                                    className={`flex-1 py-2.5 rounded-xl items-center mr-2 last:mr-0 ${
                                                        selected ? 'bg-focusHero' : 'bg-cardBg'
                                                    }`}
                                                >
                                                    <Text className={`font-fredoka-semibold ${selected ? 'text-white' : 'text-deepBrown'}`}>
                                                        {opt.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {/* Error message */}
                                    {error && (
                                        <Text className="text-sm font-fredoka text-[#C0392B] mb-3">{error}</Text>
                                    )}

                                    {/* Save button */}
                                    <TouchableOpacity
                                        onPress={handleSaveTask}
                                        activeOpacity={0.85}
                                        disabled={saving}
                                        className={`mt-2 rounded-xl py-4 items-center justify-center bg-cozyBg border border-white/50`}
                                    >
                                        <Text className="text-lg font-fredoka-bold text-deepBrown">
                                            {saving ? 'Saving...' : 'Save Task'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                /* Habit form */
                                <View>
                                    <TouchableOpacity
                                        onPress={() => setStep('choose')}
                                        activeOpacity={0.7}
                                        className="flex-row items-center mb-4"
                                    >
                                        <Ionicons name="chevron-back" size={18} color="#7D6E6B" />
                                        <Text className="text-sm font-fredoka-semibold text-mutedBrown ml-1">Back</Text>
                                    </TouchableOpacity>

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Title</Text>
                                    <TextInput
                                        value={habitTitle}
                                        onChangeText={setHabitTitle}
                                        placeholder="e.g. Read a book"
                                        placeholderTextColor="#7D6E6B"
                                        className="bg-cardBg rounded-xl px-4 py-3 text-base font-fredoka text-deepBrown mb-4"
                                    />

                                    <Text className="text-sm font-fredoka-semibold text-mutedBrown mb-2">Category</Text>
                                    <View className="flex-row flex-wrap mb-4">
                                        {categories.length === 0 ? (
                                            <Text className="text-sm font-fredoka text-mutedBrown">No categories available.</Text>
                                        ) : (
                                            categories.map((cat) => {
                                                const selected = cat.cat_id === habitCatId;
                                                return (
                                                    <TouchableOpacity
                                                        key={cat.cat_id}
                                                        onPress={() => setHabitCatId(selected ? null : cat.cat_id)}
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

                                    {/* Error message */}
                                    {error && (
                                        <Text className="text-sm font-fredoka text-[#C0392B] mb-3">{error}</Text>
                                    )}

                                    {/* Save button */}
                                    <TouchableOpacity
                                        onPress={handleSaveHabit}
                                        activeOpacity={0.85}
                                        disabled={!canSaveHabit || saving}
                                        className={`mt-2 rounded-xl py-4 items-center justify-center ${
                                            canSaveHabit && !saving ? 'bg-cozyBg border border-white/50' : 'bg-cardBg'
                                        }`}
                                    >
                                        <Text className="text-lg font-fredoka-bold text-deepBrown">
                                            {saving ? 'Saving...' : 'Save Habit'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
