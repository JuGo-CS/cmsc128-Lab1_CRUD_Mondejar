import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
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
import { fetchPendingTaskQueue, completeTask } from '@/dp_operations/home/tasks';
import { fetchTodayHabits, logHabitCompletion } from '@/dp_operations/home/habits';

export default function HomeScreen() {
	const [fontsLoaded] = useFonts({
		Fredoka_400Regular,
		Fredoka_500Medium,
		Fredoka_600SemiBold,
		Fredoka_700Bold,
	});

	// The ordered task queue. Index 0 is the current Hero Task.
	// Loaded from the Supabase `tasks` table (status = 'pending').
	const [taskQueue, setTaskQueue] = useState<TaskItemData[]>([]);
	const [tasksLoading, setTasksLoading] = useState(true);

	// Daily habits — loaded from the Supabase `habits` table (not yet completed today).
	const [habits, setHabits] = useState<HabitData[]>([]);
	const [habitsLoading, setHabitsLoading] = useState(true);

	// Whether the "Other tasks" queue is expanded. Controls scrollability below.
	const [otherTasksExpanded, setOtherTasksExpanded] = useState(false);

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

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
	const heroTask = taskQueue[0];
	// The remaining tasks form the "Other tasks" queue, in order.
	const otherTasks = taskQueue.slice(1);

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

	const handleToggleHabit = (habit: HabitData) => {
		// Persist completion through the `habit_logs` table (database-backed).
		// Only update the frontend once the write succeeds.
		logHabitCompletion(habit.id)
			.then(() => {
				// Remove it from the Daily Habits list once logged successfully.
				setHabits((prev) => prev.filter((h) => h.id !== habit.id));
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

			{/* Other tasks title + edit button — fixed (hidden when no other tasks remain) */}
			{!tasksLoading && otherTasks.length > 0 && (
				<View className="mt-8">
					<OtherTasksHeader />
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
		</View>
	);
}