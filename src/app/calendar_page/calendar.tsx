import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { subscribeToTaskChanges, emitTaskDataChanged } from '@/lib/data-events';
import { getHomeSortCriteria } from '@/lib/home-sort';
import CalendarTaskCard from '@/components/calendar_components/calendar-task-card';
import SortControl from '@/components/calendar_components/sort-control';
import EditTreasureModal from '@/components/wins_components/edit-treasure-modal';
import DeleteTreasureModal from '@/components/wins_components/delete-treasure-modal';
import WinsCalendarModal from '@/components/wins_components/wins-calendar-modal';
import Toast, { ToastData } from '@/components/ui/toast';
import { fetchPendingTaskQueue, sortHomeTasks, restoreTask, restoreTaskSnapshot, homeTaskToSnapshot, undoCompleteTask, TaskSnapshot, HomeTask, HomeSortCriteria } from '@/dp_operations/home/tasks';
import { filterTasksByDate, filterTasks, CalendarFilterCriteria } from '@/dp_operations/calendar/tasks';
import { completeTask } from '@/dp_operations/home/tasks';
import { fetchCategories, updateTreasure, deleteTreasure, Category, TreasureLog } from '@/dp_operations/wins/treasures';

// Map a HomeTask to the TreasureLog shape the Wins edit/delete modals expect.
// The modals only read id/title/description/catId; completedDate/Time are unused
// in the edit/delete flows, so we supply empty placeholders.
function toTreasureLog(task: HomeTask): TreasureLog {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        catId: task.catId,
        iconName: task.iconName,
        status: task.completed ? 'completed' : 'pending',
        deadline: task.deadline,
        priority: task.priority,
        position: task.position,
        createdAt: task.createdAt,
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

    // The global task queue (Home owns ordering). Calendar is a filtered view.
    const [tasks, setTasks] = useState<HomeTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // The global sort mode, owned by Home. Calendar only reflects it.
    const [sortCriteria, setSortCriteria] = useState<HomeSortCriteria>('manual');
    // Calendar's own filter (which tasks are visible). This is a local filter,
    // NOT a global reorder — it never touches the global queue or positions.
    const [filterCriteria, setFilterCriteria] = useState<CalendarFilterCriteria>('manual');
    const [filterValue, setFilterValue] = useState<string | null>(null);
    // Date picker for the "Deadline" / "Time Added" filter value.
    const [filterDatePickerVisible, setFilterDatePickerVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(todayDateString());
    const [calendarVisible, setCalendarVisible] = useState(false);

    // Edit / delete modal state (reuses the Wins tab flow).
    const [editingTask, setEditingTask] = useState<HomeTask | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);
    const [deletingTask, setDeletingTask] = useState<HomeTask | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Success toast feedback for complete/edit/delete actions.
    const [toast, setToast] = useState<ToastData | null>(null);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // Refetch the global queue from Supabase, apply the current Home sort mode,
    // then apply the date filter. Calendar is a filtered view of the global
    // queue — it never reorders, re-sorts, or modifies positions. The task
    // filter is applied separately in the render so changing it doesn't refetch.
    const refreshTasks = useCallback(() => {
        return Promise.all([fetchPendingTaskQueue(), getHomeSortCriteria()])
            .then(([queue, sortMode]) => {
                setSortCriteria(sortMode);
                const sorted = sortHomeTasks(queue as HomeTask[], sortMode);
                setTasks(filterTasksByDate(sorted, selectedDate));
            })
            .catch((err) => {
                console.error('Failed to load tasks for date:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedDate]);

    // Fetch the tasks applicable to the selected date whenever the screen gains
    // focus so newly created tasks appear after the Add modal closes.
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            refreshTasks();
        }, [refreshTasks])
    );

    // Refetch whenever another screen mutates task data, so Calendar stays in sync.
    useEffect(() => {
        const unsubscribe = subscribeToTaskChanges(() => {
            refreshTasks();
        });
        return unsubscribe;
    }, [refreshTasks]);

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
    const handleCompleteTask = (task: HomeTask) => {
        // Capture whether the task was the Hero so Undo can restore it.
        const wasHero = task.isFocus === true;
        completeTask(task.id)
            .then(() => {
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
                setToast({
                    message: 'Task completed!',
                    undoLabel: 'Undo',
                    onUndo: () => {
                        // Reuse the centralized completion undo: restore the task
                        // to its previous state, then refetch the filtered view.
                        undoCompleteTask(task.id, wasHero)
                            .then(() => refreshTasks())
                            .then(() => {
                                setToast({ message: 'Task restored.' });
                                emitTaskDataChanged();
                            })
                            .catch((err) => {
                                console.error('Failed to undo task completion:', err);
                                setToast({ message: 'Could not undo. Please try again.' });
                            });
                    },
                });
                emitTaskDataChanged();
            })
            .catch((err) => {
                console.error('Failed to complete task:', err);
            });
    };

    // Open the edit modal for a task.
    const handleEditTask = (task: HomeTask) => {
        setEditingTask(task);
        setEditModalVisible(true);
    };

    // Confirm the edited task, then refresh the queue.
    const handleConfirmEdit = (payload: {
        status: 'completed' | 'pending';
        title: string;
        description: string | null;
        cat_id: string | null;
        deadline: string | null;
    }) => {
        if (!editingTask) return;
        // Capture the task's full state before the edit so Undo can restore it.
        const snapshot = homeTaskToSnapshot(editingTask);
        setSaving(true);
        updateTreasure(editingTask.id, payload)
            .then(() => {
                setEditModalVisible(false);
                setEditingTask(null);
                setToast({
                    message: 'Task updated!',
                    undoLabel: 'Undo',
                    onUndo: () => {
                        restoreTaskSnapshot(snapshot)
                            .then(() => refreshTasks())
                            .then(() => {
                                setToast({ message: 'Task restored.' });
                                emitTaskDataChanged();
                            })
                            .catch((err) => {
                                console.error('Failed to undo task edit:', err);
                                setToast({ message: 'Could not undo. Please try again.' });
                            });
                    },
                });
                return refreshTasks().then(() => {
                    emitTaskDataChanged();
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
    const handleDeleteTask = (task: HomeTask) => {
        setDeletingTask(task);
        setDeleteModalVisible(true);
    };

    // Confirm the permanent deletion, then refresh the queue.
    const handleConfirmDelete = (task: HomeTask) => {
        setDeleting(true);
        deleteTreasure(task.id)
            .then(() => {
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
                setDeleteModalVisible(false);
                setDeletingTask(null);
                setToast({
                    message: 'Task deleted.',
                    undoLabel: 'Undo',
                    onUndo: () => {
                        restoreTask(task)
                            .then(() => refreshTasks())
                            .then(() => {
                                setToast({ message: 'Task restored.' });
                                emitTaskDataChanged();
                            })
                            .catch((err) => {
                                console.error('Failed to undo task deletion:', err);
                                setToast({ message: 'Could not undo. Please try again.' });
                            });
                    },
                });
                emitTaskDataChanged();
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

    // Pull-to-refresh: refetch the global queue, guarding against duplicate runs.
    const handleRefresh = useCallback(() => {
        if (refreshing) return;
        setRefreshing(true);
        refreshTasks().finally(() => {
            setRefreshing(false);
        });
    }, [refreshing, refreshTasks]);

    // Change the Calendar filter criterion. Resets the filter value, since the
    // previous value may not apply to the new criterion.
    const handleChangeFilterCriteria = (criteria: CalendarFilterCriteria) => {
        setFilterCriteria(criteria);
        setFilterValue(null);
    };

    // Set the Calendar filter value (e.g. a category name or priority level).
    const handleChangeFilterValue = (value: string) => {
        setFilterValue(value);
    };

    // Apply the Calendar filter to the date-filtered tasks, preserving the
    // global order. This is a local view filter — it never reorders or modifies
    // the global queue.
    const filteredTasks = filterTasks(tasks, filterCriteria, filterValue);

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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6B8E70" />
                }
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

                {/* Filter control header — filters which tasks are visible */}
                <View className="flex-row items-center justify-between mt-8 mb-4">
                    <SortControl criteria={filterCriteria} onChangeCriteria={handleChangeFilterCriteria} />
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

                {/* Filter value selector — only shown when a value is required */}
                {filterCriteria !== 'manual' && (
                    <View className="mb-4">
                        {filterCriteria === 'category' && (
                            <View className="flex-row flex-wrap">
                                {categories.map((cat) => {
                                    const selected = filterValue === cat.cat_name;
                                    return (
                                        <TouchableOpacity
                                            key={cat.cat_id}
                                            onPress={() => handleChangeFilterValue(cat.cat_name)}
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
                                })}
                            </View>
                        )}
                        {filterCriteria === 'priority' && (
                            <View className="flex-row">
                                {(['high', 'medium', 'low'] as const).map((p) => {
                                    const selected = filterValue === p;
                                    return (
                                        <TouchableOpacity
                                            key={p}
                                            onPress={() => handleChangeFilterValue(p)}
                                            activeOpacity={0.7}
                                            className={`flex-1 py-2.5 rounded-xl items-center mr-2 last:mr-0 ${
                                                selected ? 'bg-focusHero' : 'bg-cardBg'
                                            }`}
                                        >
                                            <Text className={`font-fredoka-semibold capitalize ${selected ? 'text-white' : 'text-deepBrown'}`}>
                                                {p}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* Task cards */}
                {loading ? (
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Loading your queue...
                    </Text>
                ) : filteredTasks.length === 0 ? (
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Nothing in your queue for this day. Enjoy the calm!
                    </Text>
                ) : (
                    filteredTasks.map((task, index) => (
                        <CalendarTaskCard
                            key={task.id}
                            task={task}
                            filterCriteria={filterCriteria}
                            queuePosition={index + 1}
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

            {/* Filter value date picker (Deadline / Time Added filters) */}
            <WinsCalendarModal
                visible={filterDatePickerVisible}
                onClose={() => setFilterDatePickerVisible(false)}
                onSelectDate={(date) => {
                    handleChangeFilterValue(date);
                    setFilterDatePickerVisible(false);
                }}
                selectedDate={filterValue ?? todayDateString()}
            />

            {/* Success toast for complete/edit/delete actions. */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </View>
    );
}