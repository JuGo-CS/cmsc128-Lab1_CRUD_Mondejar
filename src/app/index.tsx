import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { subscribeToTaskChanges, emitTaskDataChanged } from '@/lib/data-events';
import { getHomeSortCriteria, setHomeSortCriteria } from '@/lib/home-sort';
import HeroCard from '@/components/index_components/hero-card';
import OtherTasks, { OtherTasksHeader } from '@/components/index_components/other-tasks';
import DailyHabits from '@/components/index_components/daily-habits';
import { TaskItemData } from '@/components/index_components/task-item';
import { HabitData } from '@/components/index_components/habit-card';
import Toast, { ToastData } from '@/components/ui/toast';
import EditTreasureModal from '@/components/wins_components/edit-treasure-modal';
import DeleteTreasureModal from '@/components/wins_components/delete-treasure-modal';
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
    TaskSnapshot,
    HomeTask,
    HomeSortCriteria,
} from '@/dp_operations/home/tasks';
import { fetchTodayHabits, logHabitCompletion, undoHabitCompletion } from '@/dp_operations/home/habits';
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

// Format a Date into the "Thursday, September 10" style label used on Home.
function formatTodayLabel(date: Date): string {
	return date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	});
}

export default function HomeScreen() {
	const [fontsLoaded] = useFonts({
		Fredoka_400Regular,
		Fredoka_500Medium,
		Fredoka_600SemiBold,
		Fredoka_700Bold,
	});

	// The current device date. Updated automatically when the day changes.
	const [today, setToday] = useState(() => new Date());

	// Refresh the date at the next midnight so it stays current even if the app
	// stays open across a day change. Uses the device's local timezone.
	useEffect(() => {
		const now = new Date();
		const nextMidnight = new Date(now);
		nextMidnight.setHours(24, 0, 0, 0);
		const timer = setTimeout(() => {
			setToday(new Date());
		}, nextMidnight.getTime() - now.getTime());
		return () => clearTimeout(timer);
	}, [today]);

	// The ordered task queue. Index 0 is the current Hero Task.
	// Loaded from the Supabase `tasks` table (status = 'pending').
	const [taskQueue, setTaskQueue] = useState<HomeTask[]>([]);
	const [tasksLoading, setTasksLoading] = useState(true);

	// Whether the "Other tasks" section is in edit mode (drag + hero selection).
	const [editMode, setEditMode] = useState(false);
	// Active sort criterion for the "Other tasks" queue. 'manual' (the default)
	// keeps the persisted `position` order; the other options apply automatic
	// sorting. Loaded from storage on mount so the preference survives reload.
	const [sortCriteria, setSortCriteria] = useState<HomeSortCriteria>('manual');

	// Daily habits — loaded from the Supabase `habits` table (not yet completed today).
	const [habits, setHabits] = useState<HabitData[]>([]);
	const [habitsLoading, setHabitsLoading] = useState(true);

	// Whether the "Other tasks" queue is expanded. Controls scrollability below.
	const [otherTasksExpanded, setOtherTasksExpanded] = useState(false);

	// Success toast feedback for daily habit completion.
	const [toast, setToast] = useState<ToastData | null>(null);

	// Pull-to-refresh state for the task queue.
	const [refreshing, setRefreshing] = useState(false);

	// Edit / delete modal state (reuses the Wins tab flow).
	const [editingTask, setEditingTask] = useState<HomeTask | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [saving, setSaving] = useState(false);
	const [deletingTask, setDeletingTask] = useState<HomeTask | null>(null);
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

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

	// Refetch the pending task queue from Supabase (source of truth). Used on
	// focus, on pull-to-refresh, and when another screen changes task data.
	const refreshTasks = useCallback(() => {
		return fetchPendingTaskQueue()
			.then((tasks) => {
				setTaskQueue(tasks as HomeTask[]);
			})
			.catch((err) => {
				console.error('Failed to load task queue:', err);
			})
			.finally(() => {
				setTasksLoading(false);
			});
	}, []);

	// Load the pending task queue whenever the screen gains focus.
	useFocusEffect(
		useCallback(() => {
			refreshTasks();
		}, [refreshTasks])
	);

	// Refetch whenever another screen mutates task data, so Home stays in sync.
	useEffect(() => {
		const unsubscribe = subscribeToTaskChanges(() => {
			refreshTasks();
		});
		return unsubscribe;
	}, [refreshTasks]);

	// Load today's habits from Supabase whenever the screen gains focus.
	useFocusEffect(
		useCallback(() => {
			let active = true;

			fetchTodayHabits()
				.then((habitsData) => {
					if (active) setHabits(habitsData);
				})
				.catch((err) => {
					console.error('Failed to load habits:', err);
				})
				.finally(() => {
					if (active) setHabitsLoading(false);
				});

			return () => {
				active = false;
			};
		}, [])
	);

	// Fetch categories once on mount (for the edit modal).
	useEffect(() => {
		let isMounted = true;
		fetchCategories()
			.then((data) => {
				if (isMounted) setCategories(data);
			})
			.catch((err) => {
				console.error('Failed to load categories:', err);
			});
		return () => {
			isMounted = false;
		};
	}, []);

	if (!fontsLoaded) {
		return null;
	}

	// The Hero Task is always the first item in the queue (next in line).
	// The remaining tasks are sorted according to the active sort criterion.
	const sortedQueue = sortHomeTasks(taskQueue, sortCriteria);
	const heroTask = sortedQueue[0];
	// The remaining tasks form the "Other tasks" queue, in order.
	const otherTasks = sortedQueue.slice(1);

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
	const undoTaskCompletion = (task: TaskItemData, wasHero: boolean) => {
		undoCompleteTask(task.id, wasHero)
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
				console.error('Failed to undo task completion:', err);
				setToast({ message: 'Could not undo. Please try again.' });
			});
	};

	// Undo a task deletion: restore the deleted task and refresh the UI.
	const undoTaskDeletion = (task: HomeTask) => {
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
	};

	// Undo a habit completion: remove today's log so the habit reappears.
	const undoHabit = (habit: HabitData) => {
		undoHabitCompletion(habit.id)
			.then(() => {
				setHabits((prev) => (prev.some((h) => h.id === habit.id) ? prev : [...prev, habit]));
				setToast({ message: 'Habit restored.' });
			})
			.catch((err) => {
				console.error('Failed to undo habit completion:', err);
				setToast({ message: 'Could not undo. Please try again.' });
			});
	};

	// Completing the Hero Task promotes the next task in line.
	const handleHeroComplete = (task: TaskItemData) => {
		// Persist completion to the database first. Only update the frontend
		// once the write succeeds, so the UI never shows it as done on failure.
		const wasHero = task.isFocus === true;
		completeTask(task.id)
			.then(() => {
				// Refetch the queue: the completed task is gone and the next
				// task has been promoted to Hero. This also gives us the latest
				// order so we can recalculate positions.
				return fetchPendingTaskQueue().then((tasks) => {
					const nextQueue = tasks as HomeTask[];
					setTaskQueue(nextQueue);
					return syncPositions(nextQueue, sortCriteria).then(() => {
						setToast({
							message: 'Task complete! One less thing to worry about.',
							undoLabel: 'Undo',
							onUndo: () => undoTaskCompletion(task, wasHero),
						});
						emitTaskDataChanged();
					});
				});
			})
			.catch((err) => {
				console.error('Failed to complete hero task:', err);
			});
	};

	const handleToggleTask = (task: TaskItemData) => {
		// Persist completion to the database first. Only update the frontend
		// once the write succeeds, so the UI never shows it as done on failure.
		const wasHero = task.isFocus === true;
		completeTask(task.id)
			.then(() => {
				// Refetch the queue so the completed task is removed and the
				// remaining non-Hero positions are recalculated (no gap).
				return fetchPendingTaskQueue().then((tasks) => {
					const nextQueue = tasks as HomeTask[];
					setTaskQueue(nextQueue);
					return syncPositions(nextQueue, sortCriteria).then(() => {
						setToast({
							message: 'Task complete! One less thing to worry about.',
							undoLabel: 'Undo',
							onUndo: () => undoTaskCompletion(task, wasHero),
						});
						emitTaskDataChanged();
					});
				});
			})
			.catch((err) => {
				console.error('Failed to complete task:', err);
			});
	};

	// Toggle edit mode for the Other tasks section.
	const handleToggleEdit = () => {
		setEditMode((prev) => !prev);
	};

	// Change the active sort criterion for the Other tasks queue.
	// The new sorted order of the non-Hero tasks is persisted to `position`,
	// and the sort mode is persisted so Calendar reflects the same mode.
	const handleChangeSort = (criteria: HomeSortCriteria) => {
		setSortCriteria(criteria);
		Promise.all([setHomeSortCriteria(criteria), syncPositions(taskQueue, criteria)])
			.then(() => {
				emitTaskDataChanged();
			})
			.catch((err) => {
				console.error('Failed to persist sort order:', err);
			});
	};

	// Make the given task the Hero Task. Persists `is_focus` to Supabase.
	const handleMakeHero = (task: TaskItemData) => {
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
	};

	// Persist a manual drag reorder of the non-Hero tasks.
	const handleReorder = (orderedOtherIds: string[]) => {
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
		// Persist the new non-Hero positions, then notify other screens.
		syncPositions(nextQueue, 'manual')
			.then(() => {
				emitTaskDataChanged();
			})
			.catch((err) => {
				console.error('Failed to persist reorder:', err);
			});
	};

	// Open the edit modal for a task (edit mode → tap body → Edit).
	const handleEditTask = (task: TaskItemData) => {
		setEditingTask(task as HomeTask);
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
					onUndo: () => undoTaskEdit(snapshot),
				});
				// Refetch the queue, then re-sync positions so a status change
				// (e.g. completed → pending) keeps the global order consistent.
				return fetchPendingTaskQueue().then((tasks) => {
					const nextQueue = tasks as HomeTask[];
					setTaskQueue(nextQueue);
					return syncPositions(nextQueue, sortCriteria).then(() => {
						emitTaskDataChanged();
					});
				});
			})
			.catch((err) => {
				console.error('Failed to update task:', err);
			})
			.finally(() => {
				setSaving(false);
			});
	};

	// Undo a task edit: restore the pre-edit snapshot and refresh the UI.
	const undoTaskEdit = (snapshot: TaskSnapshot) => {
		restoreTaskSnapshot(snapshot)
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
				console.error('Failed to undo task edit:', err);
				setToast({ message: 'Could not undo. Please try again.' });
			});
	};

	// Open the delete confirmation for a task (edit mode → tap body → Delete).
	const handleDeleteTask = (task: TaskItemData) => {
		setDeletingTask(task as HomeTask);
		setDeleteModalVisible(true);
	};

	// Confirm the permanent deletion, then refresh the queue.
	const handleConfirmDelete = (task: HomeTask) => {
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
	};

	// Pull-to-refresh: refetch tasks + habits, guarding against duplicate runs.
	const handleRefresh = useCallback(() => {
		if (refreshing) return;
		setRefreshing(true);
		Promise.all([refreshTasks(), fetchTodayHabits().then(setHabits)])
			.catch((err) => {
				console.error('Failed to refresh Home:', err);
			})
			.finally(() => {
				setRefreshing(false);
			});
	}, [refreshing, refreshTasks]);

	const handleToggleHabit = (habit: HabitData) => {
		// Persist completion through the `habit_logs` table (database-backed).
		// Only update the frontend once the write succeeds.
		logHabitCompletion(habit.id)
			.then(() => {
				// Remove it from the Daily Habits list once logged successfully.
				setHabits((prev) => prev.filter((h) => h.id !== habit.id));
				setToast({
					message: 'Habit completed!',
					undoLabel: 'Undo',
					onUndo: () => undoHabit(habit),
				});
			})
			.catch((err) => {
				console.error('Failed to complete habit:', err);
			});
	};

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
				) : (
					<HeroCard
						task={heroTask}
						empty={!heroTask}
						onComplete={handleHeroComplete}
					/>
				)}
			</View>

			{/* Other tasks title + sort + edit button — fixed (hidden when no other tasks remain) */}
			{!tasksLoading && otherTasks.length > 0 && (
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
				{!tasksLoading && (
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
				{!habitsLoading && (
					<DailyHabits
						habits={habits}
						onToggleHabit={handleToggleHabit}
					/>
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