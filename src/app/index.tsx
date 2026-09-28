import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { subscribeToTaskChanges, emitTaskDataChanged } from '@/lib/data-events';
import { getHomeSortCriteria, setHomeSortCriteria } from '@/lib/home-sort';
import HeroCard from '@/components/index_components/hero-card';
import OtherTasks, { OtherTasksHeader } from '@/components/index_components/other-tasks';
import DailyHabits from '@/components/index_components/daily-habits';
import { TaskItemData } from '@/components/index_components/task-item';
import { HabitData } from '@/features/habits/habits.types';
import Toast, { ToastData } from '@/components/ui/toast';
import EditTreasureModal from '@/components/wins_components/edit-treasure-modal';
import DeleteTreasureModal from '@/components/wins_components/delete-treasure-modal';
import { HomeTask, TaskSnapshot, HomeSortCriteria } from '@/features/tasks/tasks.types';
import {
    fetchPendingTaskQueue,
    completeTask,
    setHeroTask,
    persistTaskPositions,
    sortHomeTasks,
    undoCompleteTask,
    restoreTask,
    restoreTaskSnapshot,
    homeTaskToSnapshot,
} from '@/features/tasks/tasks.api';
import { fetchTodayHabits, logHabitCompletion, undoHabitCompletion } from '@/features/habits/habits.api';
import { fetchCategories, updateTreasure, deleteTreasure, Category, TreasureLog } from '@/features/treasures/treasures.api';
import { triggerHaptic } from '@/utils/haptics';


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

// Format a Date into the "Thursday, September 10" style label used on Home.
function formatTodayLabel(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

export default function HomeScreen() {
    // 1. ALL HOOK DECLARATIONS MUST COME FIRST (Never place early returns above these)
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    // The current device date. Updated automatically when the day changes.
    const [today, setToday] = useState(() => new Date());

    // The ordered task queue. Index 0 is the current Hero Task.
    const [taskQueue, setTaskQueue] = useState<HomeTask[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [taskError, setTaskError] = useState(false);

    // Whether the "Other tasks" section is in edit mode (drag + hero selection).
    const [editMode, setEditMode] = useState(false);

    // Active sort criterion for the "Other tasks" queue.
    const [sortCriteria, setSortCriteria] = useState<HomeSortCriteria>('manual');

    // Daily habits — loaded from the Supabase `habits` table.
    const [habits, setHabits] = useState<HabitData[]>([]);
    const [habitsLoading, setHabitsLoading] = useState(true);
    const [habitsError, setHabitsError] = useState(false);

    // Whether the "Other tasks" queue is expanded.
    const [otherTasksExpanded, setOtherTasksExpanded] = useState(false);

    // Success toast feedback for daily habit completion.
    const [toast, setToast] = useState<ToastData | null>(null);

    // Pull-to-refresh state for the task queue.
    const [refreshing, setRefreshing] = useState(false);

    // Edit / delete modal state.
    const [editingTask, setEditingTask] = useState<HomeTask | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);
    const [deletingTask, setDeletingTask] = useState<HomeTask | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // --- EFFECTS & CALLBACKS ---

    // Refresh the date at the next midnight so it stays current.
    useEffect(() => {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);
        const timer = setTimeout(() => {
            setToday(new Date());
        }, nextMidnight.getTime() - now.getTime());
        return () => clearTimeout(timer);
    }, [today]);

    // Load the persisted sort criterion when the screen mounts.
    useEffect(() => {
        let active = true;
        getHomeSortCriteria().then((criteria) => {
            if (active) setSortCriteria(criteria);
        });
        return () => {
            active = false;
        };
    }, []);

    // Persist the sort criterion whenever it changes.
    useEffect(() => {
        setHomeSortCriteria(sortCriteria);
    }, [sortCriteria]);

    const refreshTasks = useCallback(() => {
        setTaskError(false); // reset error at start of fetch
        return Promise.all([fetchPendingTaskQueue(), getHomeSortCriteria()])
            .then(([tasks, criteria]) => {
                setSortCriteria(criteria);
                setTaskQueue(sortHomeTasks(tasks as HomeTask[], criteria));
            })
            .catch((err) => {
                console.error('Failed to load task queue:', err);
                setTaskError(true);
            })
            .finally(() => {
                setTasksLoading(false);
            });
    }, []);

    // Load the pending task queue whenever the screen gains focus.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            setTaskError(false); // reset error at start of fetch
            refreshTasks()
                .catch((err) => {
                    if (active) {
                        console.error('Failed to load task queue:', err);
                        setTaskError(true);
                    }
                });
            return () => {
                active = false;
            };
        }, [refreshTasks])
    );

    // Refetch whenever task data changes.
    useEffect(() => {
        const subs = subscribeToTaskChanges(() => {
            refreshTasks();
        });
        return subs;
    }, [refreshTasks]);

    // Load today's habits from Supabase whenever the screen gains focus.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            setHabitsError(false); // reset error at start of fetch
            fetchTodayHabits()
                .then((habitsData) => {
                    if (active) setHabits(habitsData);
                })
                .catch((err) => {
                    if (active) {
                        console.error('Failed to load habits:', err);
                        setHabitsError(true);
                    }
                })
                .finally(() => {
                    if (active) setHabitsLoading(false);
                });

            return () => {
                active = false;
            };
        }, [])
    );

    // Fetch categories once on mount.
    useEffect(() => {
        let isMounted = true;
        fetchCategories()
            .then((data) => {
                if (isMounted) setCategories(data);
            })
            .catch((err) => {
                if (isMounted) console.error('Failed to load categories:', err);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // 2. NOW IT IS SAFE TO DO EARLY RETURNS (All hooks have been registered)


    // The queue state is kept already ordered (hero first, then the active sort
    // order) so the Other Tasks list updates immediately when a task change is
    // emitted — no re-sort is needed on render.
    const heroTask = taskQueue[0];
    // The remaining tasks form the "Other tasks" queue, in order.
    const otherTasks = taskQueue.slice(1);

    // Persist the positions of the active non-Hero tasks so the database order
    // matches the given visible queue. Uses the current sort to determine the
    // final order of the non-Hero tasks.
    const syncPositions = useCallback((queue: HomeTask[], criteria: HomeSortCriteria) => {
        const sorted = sortHomeTasks(queue, criteria);
        const hero = sorted.find((t) => t.isFocus) ?? null;
        const others = sorted.filter((t) => !t.isFocus);
        return persistTaskPositions(
            others.map((t) => t.id),
            hero?.id ?? null
        );
    }, []);

    // Undo a task completion: restore it to the active queue, re-sync positions,
    // and refresh the UI. Shows a success toast on success, an error toast on failure.
    // If showToast is false, no toast is shown (used for internal rollback).
    const undoTaskCompletion = useCallback((task: TaskItemData, wasHero: boolean, showToast: boolean = true) => {
        undoCompleteTask(task.id, wasHero)
            .then(() => fetchPendingTaskQueue())
            .then((tasks) => {
                const nextQueue = tasks as HomeTask[];
                setTaskQueue(nextQueue);
                return syncPositions(nextQueue, sortCriteria).then(() => {
                    if (showToast) {
                        setToast({ message: 'Task restored.' });
                    }
                    emitTaskDataChanged();
                });
            })
            .catch((err) => {
                console.error('Failed to undo task completion:', err);
                if (showToast) {
                    setToast({ message: 'Could not undo. Please try again.' });
                }
            });
    }, [syncPositions, emitTaskDataChanged]);

    // Undo a task deletion: restore the deleted task and refresh the UI.
    const undoTaskDeletion = useCallback((task: HomeTask) => {
        restoreTask(task)
            .then(() => fetchPendingTaskQueue())
            .then((tasks) => {
                const nextQueue = tasks as HomeTask[];
                setTaskQueue(nextQueue);
                return syncPositions(nextQueue, sortCriteria).then(() => {
                    setToast({ message: 'Task restored.' });
                    emitTaskDataChanged();
                });
            })
            .catch((err) => {
                console.error('Failed to undo task deletion:', err);
                setToast({ message: 'Could not undo. Please try again.' });
            });
    }, [syncPositions, emitTaskDataChanged]);

    // Undo a habit completion: remove today's log so the habit reappears.
    // If showToast is false, no toast is shown (used for internal rollback).
    const undoHabit = useCallback((habit: HabitData, showToast: boolean = true) => {
        undoHabitCompletion(habit.id)
            .then(() => {
                setHabits((prev) => (prev.some((h) => h.id === habit.id) ? prev : [...prev, habit]));
                if (showToast) {
                    setToast({ message: 'Habit restored.' });
                }
            })
            .catch((err) => {
                console.error('Failed to undo habit completion:', err);
                if (showToast) {
                    setToast({ message: 'Could not undo. Please try again later.' });
                }
            });
    }, [setHabits, setToast]);

    // Completing the Hero Task promotes the next task in line.
    const handleHeroComplete = useCallback((task: TaskItemData) => {
        triggerHaptic.heavy(); // Task completion toggle
        const wasHero = task.isFocus === true;

        // 1. Optimistically update the state: remove the hero task and promote the next task.
        const optimisticNextQueue = taskQueue.filter((t) => t.id !== task.id);
        setTaskQueue(optimisticNextQueue);
        // Persist the new positions (non-hero tasks) optimistically.
        syncPositions(optimisticNextQueue, sortCriteria).catch(console.error);

        // 2. Show a toast with an undo option.
        setToast({
            message: 'Task completed!',
            undoLabel: 'Undo',
            onUndo: () => undoTaskCompletion(task, wasHero, true), // User-initiated undo shows a toast.
        });

        // 3. Persist the completion to the database.
        completeTask(task.id)
            .then(() => {
                // On success, we do nothing to the toast (the undo toast remains until user action).
                // The state is already updated optimistically, and the database is now consistent.
                emitTaskDataChanged();
            })
            .catch((err) => {
                console.error('Failed to complete hero task:', err);
                // Rollback the optimistic update.
                undoTaskCompletion(task, wasHero, false); // Internal rollback: no toast from undo function.
                setToast({ message: 'Failed to complete task. Please try again.', undoLabel: undefined });
            });
    }, [taskQueue, sortCriteria, syncPositions, undoTaskCompletion, completeTask, emitTaskDataChanged]);

    const handleToggleTask = useCallback((task: TaskItemData) => {
        triggerHaptic.heavy(); // Task completion toggle
        const wasHero = task.isFocus === true;

        // 1. Optimistically update the state.
        const optimisticNextQueue = taskQueue.map((t) =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        );
        setTaskQueue(optimisticNextQueue);
        // Persist the new positions (non-hero tasks) optimistically.
        syncPositions(optimisticNextQueue, sortCriteria).catch(console.error);

        // 2. Show a toast with an undo option.
        setToast({
            message: task.completed ? 'Task undone!' : 'Task complete!',
            undoLabel: 'Undo',
            onUndo: () => undoTaskCompletion(task, wasHero, true),
        });

        // 3. Persist the toggle to the database.
        completeTask(task.id)
            .then(() => {
                // On success, do nothing to the toast.
                emitTaskDataChanged();
            })
            .catch((err) => {
                console.error('Failed to toggle task:', err);
                // Rollback the optimistic update.
                undoTaskCompletion(task, wasHero, false);
                setToast({ message: 'Failed to toggle task. Please try again.', undoLabel: undefined });
            });
    }, [taskQueue, sortCriteria, syncPositions, undoTaskCompletion, completeTask, emitTaskDataChanged]);

    // Toggle edit mode for the Other tasks section.
    const handleToggleEdit = useCallback(() => {
        setEditMode((prev) => !prev);
    }, []);

    // Change the active sort criterion for the Other tasks queue.
    // The new sorted order of the non-Hero tasks is persisted to `position`,
    // and the sort mode is persisted so Calendar reflects the same mode.
    const handleChangeSort = useCallback((criteria: HomeSortCriteria) => {
        triggerHaptic.light(); // Filter/sort change
        setSortCriteria(criteria);
        Promise.all([setHomeSortCriteria(criteria), syncPositions(taskQueue, criteria)])
            .then(() => {
                emitTaskDataChanged();
            })
            .catch((err) => {
                console.error('Failed to persist sort order:', err);
            });
    }, [setHomeSortCriteria, syncPositions, emitTaskDataChanged]);

    // Make the given task the Hero Task. Persists `is_focus` to Supabase.
    const handleMakeHero = useCallback((task: TaskItemData) => {
        setHeroTask(task.id)
            .then(() => {
                // The DB now has exactly one `is_focus` task. Refetch so the
                // queue reflects the new hero + the previous hero rejoins it.
                return fetchPendingTaskQueue().then((tasks) => {
                    const nextQueue = tasks as HomeTask[];
                    setTaskQueue(nextQueue);
                    // Recalculate the non-Hero positions so the new hero has no
                    // position and the remaining tasks are sequential (0,1,2,...).
                    return syncPositions(nextQueue, 'manual').then(() => {
                        emitTaskDataChanged();
                    });
                });
            })
            .catch((err) => {
                console.error('Failed to set hero task:', err);
            });
    }, [setHeroTask, fetchPendingTaskQueue, setTaskQueue, syncPositions, emitTaskDataChanged]);

    // Persist a manual drag reorder of the non-Hero tasks.
    const handleReorder = useCallback((orderedOtherIds: string[]) => {
        // Build the new queue (hero first, then the dragged non-Hero order).
        const hero = taskQueue.find((t) => t.isFocus) ?? null;
        const orderedOthers = orderedOtherIds
            .map((id) => taskQueue.find((t) => t.id === id))
            .filter((t): t is HomeTask => !!t);
        const nextQueue = hero ? [hero, ...orderedOthers] : orderedOthers;

        // A manual drag overrides any automatic sort, so the display reverts to
        // the persisted `position` order ('manual').
        setSortCriteria('manual');
        setTaskQueue(nextQueue);
        // Persist the new non-Hero positions, then notify subscribed screens so
        // they refetch and re-sync to the new order.
        syncPositions(nextQueue, 'manual')
            .then(() => {
                emitTaskDataChanged();
            })
            .catch((err) => {
                console.error('Failed to persist reorder:', err);
            });
    }, [taskQueue, setSortCriteria, setTaskQueue, syncPositions, emitTaskDataChanged]);

    // Open the edit modal for a task (edit mode → tap body → Edit).
    const handleEditTask = useCallback((task: TaskItemData) => {
        triggerHaptic.light(); // Opening task for editing
        triggerHaptic.medium(); // Opening modal
        setEditingTask(task as HomeTask);
        setEditModalVisible(true);
    }, []);

    // Confirm the edited task, then refresh the queue.
    const handleConfirmEdit = useCallback((payload: {
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
                    onUndo: () => undoTaskEdit(snapshot),
                });
                // Refetch the queue (ordered by the active sort), then re-sync
                // positions so a status change (e.g. completed → pending) keeps the
                // global order consistent, and notify all subscribed screens.
                return refreshTasks().then(() => {
                    emitTaskDataChanged();
                    triggerHaptic.success(); // Successful update
                });
            })
            .catch((err) => {
                console.error('Failed to update task:', err);
            })
            .finally(() => {
                setSaving(false);
            });
    }, [refreshTasks, emitTaskDataChanged]);

    // Undo a task edit: restore the pre-edit snapshot and refresh the UI.
    const undoTaskEdit = useCallback((snapshot: TaskSnapshot) => {
        restoreTaskSnapshot(snapshot)
            .then(() => fetchPendingTaskQueue())
            .then((fetchedTasks) => {
                const nextQueue = fetchedTasks as HomeTask[];
                setTaskQueue(nextQueue);
                return syncPositions(nextQueue, sortCriteria).then(() => {
                    setToast({ message: 'Task restored.' });
                    emitTaskDataChanged();
                });
            })
            .catch((err) => {
                console.error('Failed to undo task edit:', err);
                setToast({ message: 'Could not undo. Please try again.' });
            });
    }, [syncPositions, emitTaskDataChanged]);

    // Open the delete confirmation for a task (edit mode → tap body → Delete).
    const handleDeleteTask = useCallback((task: TaskItemData) => {
        triggerHaptic.warning(); // Delete prompt
        triggerHaptic.medium(); // Opening modal
        setDeletingTask(task as HomeTask);
        setDeleteModalVisible(true);
    }, []);

    // Confirm the permanent deletion, then refresh the queue.
    const handleConfirmDelete = useCallback((task: HomeTask) => {
        setDeleting(true);
        deleteTreasure(task.id)
            .then(() => {
                setDeleteModalVisible(false);
                setDeletingTask(null);
                setToast({
                    message: 'Task deleted.',
                    undoLabel: 'Undo',
                    onUndo: () => undoTaskDeletion(task),
                });
                return refreshTasks().then(() => {
                    emitTaskDataChanged();
                });
            })
            .catch((err) => {
                console.error('Failed to delete task:', err);
            })
            .finally(() => {
                setDeleting(false);
            });
    }, [refreshTasks, emitTaskDataChanged]);

    // Pull-to-refresh: refetch tasks + habits, guarding against duplicate runs.
    const handleRefresh = useCallback(() => {
        if (refreshing) return;
        setRefreshing(true);
        setTaskError(false); // reset error on refresh
        setHabitsError(false); // reset error on refresh
        Promise.all([refreshTasks(), fetchTodayHabits().then(setHabits).catch(() => setHabitsError(true))])
            .catch((err) => {
                console.error('Failed to refresh Home:', err);
                setTaskError(true);
                setHabitsError(true);
            })
            .finally(() => {
                setRefreshing(false);
            });
    }, [refreshing, refreshTasks]);

    const handleToggleHabit = useCallback((habit: HabitData) => {
        triggerHaptic.heavy(); // Habit completion toggle
        // 1. Optimistically update the state: remove the habit from the list.
        setHabits(prev => prev.filter(h => h.id !== habit.id));

        // 2. Show a toast with an undo option.
        setToast({
            message: 'Habit completed!',
            undoLabel: 'Undo',
            onUndo: () => undoHabit(habit, true),
        });

        // 3. Persist the completion to the database.
        logHabitCompletion(habit.id)
            .then(() => {
                // On success, do nothing to the toast.
                emitTaskDataChanged();
            })
            .catch((err) => {
                console.error('Failed to complete habit:', err);
                // Rollback the optimistic update.
                undoHabit(habit, false);
                setToast({ message: 'Failed to complete habit. Please try again.', undoLabel: undefined });
            });
    }, [setHabits, setToast, undoHabit, logHabitCompletion, emitTaskDataChanged]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            {/* Header row with greeting and sun icon — fixed */}
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                    <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown leading-tight">
                        Maayung{'\n'}
                        adlaw, Kenneth!
                    </Text>
                    {/* Horizontal line underneath the heading */}
                    <View className="h-[2px] bg-deepBrown mt-2" />
                    {/* Current device date */}
                    <Text className="text-lg text-mutedBrown mt-2">
                        {formatTodayLabel(today)}
                    </Text>
                </View>
                {/* Sun icon in the top-right, slightly above the text */}
                <Ionicons name="sunny" size={80} color="#F4C542" style={{ marginTop: -22 }} />
            </View>

            {/* Hero Card — highlights the single focus task, or a relaxing message when all done */}
            <View className="mt-8">
                {tasksLoading ? (
                    <View className="rounded-3xl bg-focusHero p-5 items-center justify-center">
                        <ActivityIndicator color="#FFFFFF" />
                        <Text className="text-lg font-fredoka-medium text-white mt-3">
                            Loading your tasks...
                        </Text>
                    </View>
                ) : taskError ? (
                    <View className="rounded-3xl bg-focusHero p-5 items-center justify-center">
                        <Text className="text-lg font-fredoka-medium text-deepBrown mt-3">
                            Failed to load tasks. Please try again.
                        </Text>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            activeOpacity={0.7}
                            className="mt-4 bg-focusHero text-white px-6 py-3 rounded-xl font-fredoka-semibold"
                        >
                            Retry
                        </TouchableOpacity>
                    </View>
                ) : (
                    <HeroCard
                        task={heroTask}
                        empty={!heroTask}
                        onComplete={handleHeroComplete}
                    />
                )}
            </View>

            {/* Other tasks title + sort + edit button — fixed (hidden when no other tasks remain) */}
            {!tasksLoading && !taskError && otherTasks.length > 0 && (
                <View className="mt-8">
                    <OtherTasksHeader
                        editMode={editMode}
                        onToggleEdit={handleToggleEdit}
                        sortCriteria={sortCriteria}
                        onChangeSort={handleChangeSort}
                    />
                </View>
            )}

            {/* Scrollable content below the Other Tasks header — scroll only when expanded */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                // scrollEnabled={otherTasksExpanded}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6B8E70" />
                }
            >
                {/* Other tasks — stacked queue preview with expand/collapse */}
                {!tasksLoading && !taskError && (
                    <OtherTasks
                        tasks={otherTasks}
                        onToggleTask={handleToggleTask}
                        expanded={otherTasksExpanded}
                        onToggleExpanded={() => setOtherTasksExpanded((prev) => !prev)}
                        editMode={editMode}
                        sortCriteria={sortCriteria}
                        onMakeHero={handleMakeHero}
                        onReorder={handleReorder}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                    />
                )}

                {/* Daily habits — horizontal carousel */}
                {!habitsLoading && !habitsError && (
                    <DailyHabits
                        habits={habits}
                        onToggleHabit={handleToggleHabit}
                    />
                )}

                {/* Error states for habits and tasks */}
                {habitsError && !habitsLoading && (
                    <View className="mt-8">
                        <Text className="text-base font-fredoka text-deepBrown">
                            Failed to load habits. Please try again.
                        </Text>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            activeOpacity={0.7}
                            className="bg-focusHero text-white px-6 py-3 rounded-xl font-fredoka-semibold"
                        >
                            Retry
                        </TouchableOpacity>
                    </View>
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

            {/* Success toast for daily habit completion. */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </View>
    );
}