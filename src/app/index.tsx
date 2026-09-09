import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { subscribeToTaskChanges, emitTaskDataChanged } from '@/lib/data-events';
import HeroCard from '@/components/index_components/hero-card';
import OtherTasks, { OtherTasksHeader } from '@/components/index_components/other-tasks';
import DailyHabits from '@/components/index_components/daily-habits';
import { TaskItemData } from '@/components/index_components/task-item';
import { HabitData } from '@/components/index_components/habit-card';
import Toast, { ToastData } from '@/components/ui/toast';
import {
    fetchPendingTaskQueue,
    completeTask,
    setHeroTask,
    persistTaskPositions,
    sortHomeTasks,
    HomeTask,
    HomeSortCriteria,
} from '@/dp_operations/home/tasks';
import { fetchTodayHabits, logHabitCompletion } from '@/dp_operations/home/habits';

// Storage key for the persisted sort preference. This is a client-side UI
// preference, so AsyncStorage (already used in the app) is the right place.
const SORT_CRITERIA_KEY = 'unti-unti:home-sort-criteria';

// The valid sort criteria, used to validate a value loaded from storage.
// 'manual' (the default position order) is included so it survives a reload.
const SORT_CRITERIA_VALUES: HomeSortCriteria[] = ['manual', 'priority', 'deadline', 'category', 'createdAt'];

/** Safely coerce an unknown stored value into a valid sort criterion. */
function parseSortCriteria(value: unknown): HomeSortCriteria {
    return SORT_CRITERIA_VALUES.includes(value as HomeSortCriteria)
        ? (value as HomeSortCriteria)
        : 'manual';
}

export default function HomeScreen() {
	const [fontsLoaded] = useFonts({
		Fredoka_400Regular,
		Fredoka_500Medium,
		Fredoka_600SemiBold,
		Fredoka_700Bold,
	});

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

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	// Load the persisted sort criterion when the screen mounts.
	useEffect(() => {
		let active = true;
		AsyncStorage.getItem(SORT_CRITERIA_KEY)
			.then((stored) => {
				if (active && stored) {
					setSortCriteria(parseSortCriteria(stored));
				}
			})
			.catch((err) => {
				console.error('Failed to load sort preference:', err);
			});
		return () => {
			active = false;
		};
	}, []);

	// Persist the sort criterion whenever it changes.
	useEffect(() => {
		AsyncStorage.setItem(SORT_CRITERIA_KEY, sortCriteria).catch((err) => {
			console.error('Failed to save sort preference:', err);
		});
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

	// Completing the Hero Task promotes the next task in line.
	const handleHeroComplete = (task: TaskItemData) => {
		// Persist completion to the database first. Only update the frontend
		// once the write succeeds, so the UI never shows it as done on failure.
		completeTask(task.id)
			.then(() => {
				// Refetch the queue: the completed task is gone and the next
				// task has been promoted to Hero. This also gives us the latest
				// order so we can recalculate positions.
				return fetchPendingTaskQueue().then((tasks) => {
					const nextQueue = tasks as HomeTask[];
					setTaskQueue(nextQueue);
					return syncPositions(nextQueue, sortCriteria).then(() => {
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
		completeTask(task.id)
			.then(() => {
				// Refetch the queue so the completed task is removed and the
				// remaining non-Hero positions are recalculated (no gap).
				return fetchPendingTaskQueue().then((tasks) => {
					const nextQueue = tasks as HomeTask[];
					setTaskQueue(nextQueue);
					return syncPositions(nextQueue, sortCriteria).then(() => {
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
	// The new sorted order of the non-Hero tasks is persisted to `position`.
	const handleChangeSort = (criteria: HomeSortCriteria) => {
		setSortCriteria(criteria);
		syncPositions(taskQueue, criteria)
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
				setToast({ message: 'Habit completed!' });
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
					{/* Date text (placeholder for now) */}
					<Text className="text-lg text-mutedBrown mt-2">
						Thursday, September 10
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

			{/* Success toast for daily habit completion. */}
			<Toast toast={toast} onDismiss={() => setToast(null)} />
		</View>
	);
}