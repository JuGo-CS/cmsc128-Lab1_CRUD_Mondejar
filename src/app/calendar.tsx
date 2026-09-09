import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarTaskCard from '@/components/calendar_components/calendar-task-card';
import SortControl from '@/components/calendar_components/sort-control';
import EditTreasureModal from '@/components/wins_components/edit-treasure-modal';
import DeleteTreasureModal from '@/components/wins_components/delete-treasure-modal';
import WinsCalendarModal from '@/components/wins_components/wins-calendar-modal';
import { fetchTasksForDate, CalendarTask, SortCriteria, sortTasks } from '@/dp_operations/calendar/tasks';
import { completeTask } from '@/dp_operations/home/tasks';
import { fetchCategories, updateTreasure, deleteTreasure, Category, TreasureLog } from '@/dp_operations/wins/treasures';

// Map a CalendarTask to the TreasureLog shape the Wins edit/delete modals expect.
// The modals only read id/title/description/catId; completedDate/Time are unused
// in the edit/delete flows, so we supply empty placeholders.
function toTreasureLog(task: CalendarTask): TreasureLog {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        catId: task.catId,
        iconName: task.iconName,
        completedDate: '',
        completedTime: '',
    };
}

/** Today's date as `YYYY-MM-DD` in local time (default selected date). */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Format a `YYYY-MM-DD` date into "September 12" style label. */
function formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
    });
}

export default function CalendarScreen() {
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [criteria, setCriteria] = useState<SortCriteria>('priority');
    const [ascending, setAscending] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(todayDateString());
    const [calendarVisible, setCalendarVisible] = useState(false);

    // Edit / delete modal state (reuses the Wins tab flow).
    const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);
    const [deletingTask, setDeletingTask] = useState<CalendarTask | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // Fetch the tasks applicable to the selected date. Refetches whenever the
    // screen gains focus so newly created tasks appear after the Add modal closes.
    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            setLoading(true);
            fetchTasksForDate(selectedDate)
                .then((data) => {
                    if (isMounted) {
                        setTasks(data);
                    }
                })
                .catch((err) => {
                    console.error('Failed to load tasks for date:', err);
                })
                .finally(() => {
                    if (isMounted) {
                        setLoading(false);
                    }
                });

            return () => {
                isMounted = false;
            };
        }, [selectedDate])
    );

    // Fetch categories once on mount (for the edit modal).
    useEffect(() => {
        let isMounted = true;
        fetchCategories()
            .then((data) => {
                if (isMounted) {
                    setCategories(data);
                }
            })
            .catch((err) => {
                console.error('Failed to load categories:', err);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Mark a task as completed (goes to Treasures via the existing logic).
    const handleCompleteTask = (task: CalendarTask) => {
        completeTask(task.id)
            .then(() => {
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
            })
            .catch((err) => {
                console.error('Failed to complete task:', err);
            });
    };

    // Open the edit modal for a task.
    const handleEditTask = (task: CalendarTask) => {
        setEditingTask(task);
        setEditModalVisible(true);
    };

    // Confirm the edited task, then refresh the queue.
    const handleConfirmEdit = (payload: {
        status: 'completed' | 'pending';
        title: string;
        description: string | null;
        cat_id: string | null;
    }) => {
        if (!editingTask) return;
        setSaving(true);
        updateTreasure(editingTask.id, payload)
            .then(() => {
                setEditModalVisible(false);
                setEditingTask(null);
                return fetchTasksForDate(selectedDate).then((data) => {
                    setTasks(data);
                });
            })
            .catch((err) => {
                console.error('Failed to update task:', err);
            })
            .finally(() => {
                setSaving(false);
            });
    };

    // Open the delete confirmation for a task.
    const handleDeleteTask = (task: CalendarTask) => {
        setDeletingTask(task);
        setDeleteModalVisible(true);
    };

    // Confirm the permanent deletion, then refresh the queue.
    const handleConfirmDelete = (task: CalendarTask) => {
        setDeleting(true);
        deleteTreasure(task.id)
            .then(() => {
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
                setDeleteModalVisible(false);
                setDeletingTask(null);
            })
            .catch((err) => {
                console.error('Failed to delete task:', err);
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    if (!fontsLoaded) {
        return null;
    }

    // Apply the current sort criteria + direction to the fetched tasks.
    const sortedTasks = sortTasks(tasks, criteria, ascending);

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            {/* Header row with "Calendar" title and sun icon (wins.tsx styling) */}
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                    <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown mt-2 leading-tight">
                        Calendar
                    </Text>
                </View>
                <Ionicons name="sunny" size={80} color="#F4C542" style={{ marginTop: -22 }} />
            </View>
            <View className="h-[2px] bg-deepBrown mr-28 -mt-2" />

            {/* Scrollable content */}
            <ScrollView
                className="flex-1 mt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* "In your Queue" header */}
                <View className="flex-row items-start justify-between mb-1">
                    <View className="flex-1 pr-4">
                        <Text className="text-2xl font-fredoka-bold text-deepBrown">
                            In your Queue
                        </Text>
                        <Text className="text-base font-fredoka text-mutedBrown mt-1">
                            For {formatDateLabel(selectedDate)}.
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setCalendarVisible(true)}
                        activeOpacity={0.7}
                        className="p-1"
                    >
                        <Ionicons name="calendar" size={40} color="#6B8E70" />
                    </TouchableOpacity>
                </View>

                {/* Sort control header */}
                <View className="flex-row items-center justify-between mt-8 mb-4">
                    <SortControl
                        criteria={criteria}
                        ascending={ascending}
                        onChangeCriteria={setCriteria}
                        onToggleDirection={() => setAscending((prev) => !prev)}
                    />
                    <TouchableOpacity
                        onPress={() => setEditMode((prev) => !prev)}
                        activeOpacity={0.7}
                        className="p-1"
                    >
                        <Ionicons
                            name={editMode ? 'close' : 'create-outline'}
                            size={24}
                            color={editMode ? '#C0392B' : '#3D2E2B'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Task cards */}
                {loading ? (
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Loading your queue...
                    </Text>
                ) : sortedTasks.length === 0 ? (
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Nothing in your queue for this day. Enjoy the calm!
                    </Text>
                ) : (
                    sortedTasks.map((task) => (
                        <CalendarTaskCard
                            key={task.id}
                            task={task}
                            sortCriteria={criteria}
                            editMode={editMode}
                            onToggle={handleCompleteTask}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                        />
                    ))
                )}
            </ScrollView>

            {/* Edit task modal */}
            <EditTreasureModal
                visible={editModalVisible}
                log={editingTask ? toTreasureLog(editingTask) : null}
                categories={categories}
                onClose={() => {
                    setEditModalVisible(false);
                    setEditingTask(null);
                }}
                onConfirm={handleConfirmEdit}
                saving={saving}
            />

            {/* Delete confirmation modal */}
            <DeleteTreasureModal
                visible={deleteModalVisible}
                log={deletingTask ? toTreasureLog(deletingTask) : null}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setDeletingTask(null);
                }}
                onConfirmDelete={(log) => handleConfirmDelete(deletingTask!)}
                deleting={deleting}
            />

            {/* Calendar date-selection modal (reused from Wins) */}
            <WinsCalendarModal
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                onSelectDate={(date) => {
                    setSelectedDate(date);
                    setCalendarVisible(false);
                }}
                selectedDate={selectedDate}
            />
        </View>
    );
}