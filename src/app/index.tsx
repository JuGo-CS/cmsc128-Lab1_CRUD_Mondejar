import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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
    reorderTasks,
    sortHomeTasks,
    HomeTask,
    HomeSortCriteria,
} from '@/dp_operations/home/tasks';
import { fetchTodayHabits, logHabitCompletion } from '@/dp_operations/home/habits';

// Storage key for the persisted sort preference. This is a client-side UI
// preference, so AsyncStorage (already used in the app) is the right place.
const SORT_CRITERIA_KEY = 'unti-unti:home-sort-criteria';

// The valid sort criteria, used to validate a value loaded from storage.
const SORT_CRITERIA_VALUES: HomeSortCriteria[] = ['priority', 'deadline', 'category', 'createdAt'];

/** Safely coerce an unknown stored value into a valid sort criterion. */
function parseSortCriteria(value: unknown): HomeSortCriteria {
    return SORT_CRITERIA_VALUES.includes(value as HomeSortCriteria)
        ? (value as HomeSortCriteria)
        : 'priority';
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
	// Active sort criterion for the "Other tasks" queue. Loaded from storage on
	// mount so the user's preference survives a refresh/reopen.
	const [sortCriteria, setSortCriteria] = useState<HomeSortCriteria>('priority');

	// Daily habits — loaded from the Supabase `habits` table (not yet completed today).
	const [habits, setHabits] = useState<HabitData[]>([]);
	const [habitsLoading, setHabitsLoading] = useState(true);

	// Whether the "Other tasks" queue is expanded. Controls scrollability below.
	const [otherTasksExpanded, setOtherTasksExpanded] = useState(false);

	// Success toast feedback for daily habit completion.
	const [toast, setToast] = useState<ToastData | null>(null);

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

	// Load the pending task queue from Supabase whenever the screen gains focus
	// (so newly created tasks appear after the Add modal closes).
	useFocusEffect(
		useCallback(() => {
			let active = true;

			fetchPendingTaskQueue()
				.then((tasks) => {
					if (active) setTaskQueue(tasks);
				})
				.catch((err) => {
					console.error('Failed to load task queue:', err);
				})
				.finally(() => {
					if (active) setTasksLoading(false);
				});

			return () => {
				active = false;
			};
		}, [])
	);

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

	// Completing the Hero Task promotes the next task in line.
	const handleHeroComplete = (task: TaskItemData) => {
		// Persist completion to the database first. Only update the frontend
		// once the write succeeds, so the UI never shows it as done on failure.
		completeTask(task.id)
			.then(() => {
				// Remove the completed task; the next pending task becomes the Hero.
				setTaskQueue((prev) => prev.filter((t) => t.id !== task.id));
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
				// Remove it from the Other Tasks queue, preserving the order of
				// the remaining tasks.
				setTaskQueue((prev) => prev.filter((t) => t.id !== task.id));
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
	const handleChangeSort = (criteria: HomeSortCriteria) => {
		setSortCriteria(criteria);
	};

	// Make the given task the Hero Task. Persists `is_focus` to Supabase.
	const handleMakeHero = (task: TaskItemData) => {
		setHeroTask(task.id)
			.then(() => {
				// The DB now has exactly one `is_focus` task. Refetch so the
				// queue reflects the new hero + the previous hero rejoins it.
				return fetchPendingTaskQueue().then((tasks) => {
					setTaskQueue(tasks as HomeTask[]);
				});
			})
			.catch((err) => {
				console.error('Failed to set hero task:', err);
			});
	};

	// Persist a manual drag reorder of the full queue (hero first).
	const handleReorder = (orderedOtherIds: string[]) => {
		// The Hero Task stays pinned at the front of the queue, so prepend it
		// to the reordered "other tasks" before persisting the full order.
		const fullOrder = heroTask ? [heroTask.id, ...orderedOtherIds] : orderedOtherIds;
		reorderTasks(fullOrder)
			.then(() => {
				// Reorder the local queue to match the persisted order.
				setTaskQueue((prev) =>
					fullOrder
						.map((id) => prev.find((t) => t.id === id))
						.filter((t): t is HomeTask => !!t)
				);
			})
			.catch((err) => {
				console.error('Failed to reorder tasks:', err);
			});
	};

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