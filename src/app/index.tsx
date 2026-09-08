import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import HeroCard from '@/components/index_components/hero-card';
import OtherTasks from '@/components/index_components/other-tasks';
import { TaskItemData } from '@/components/index_components/task-item';

// Single ordered task queue. The first item is the current Hero Task (Focus for now),
// and the remaining items form the "Other tasks" queue in priority order.
// This mirrors how the database will supply tasks later — one ordered list.
const INITIAL_TASK_QUEUE: TaskItemData[] = [
    { id: 'task-1', title: 'Finish wireframes for Unti-Unti', iconName: 'school' },
    { id: 'task-2', title: 'Review the CMSC 128 lab report', iconName: 'document-text' },
    { id: 'task-3', title: 'Prepare slides for the group presentation', iconName: 'easel' },
    { id: 'task-4', title: 'Reply to Professor Santos email', iconName: 'mail' },
    { id: 'task-5', title: 'Water the plants', iconName: 'leaf' },
];

export default function HomeScreen() {
	const [fontsLoaded] = useFonts({
		Fredoka_400Regular,
		Fredoka_500Medium,
		Fredoka_600SemiBold,
		Fredoka_700Bold,
	});

	// The ordered task queue. Index 0 is the current Hero Task.
	const [taskQueue, setTaskQueue] = useState<TaskItemData[]>(INITIAL_TASK_QUEUE);

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	// The Hero Task is always the first item in the queue (next in line).
	const heroTask = taskQueue[0];
	// The remaining tasks form the "Other tasks" queue, in order.
	const otherTasks = taskQueue.slice(1);

	// Completing the Hero Task promotes the next task in line.
	const handleHeroComplete = (task: TaskItemData) => {
		// TODO: connect to database to mark the task as done + promote next task
		console.log('Hero task completed:', task.id);
		setTaskQueue((prev) => prev.filter((t) => t.id !== task.id));
	};

	const handleToggleTask = (task: TaskItemData) => {
		// TODO: connect to database to toggle task completion
		console.log('Toggle task:', task.id);
	};

	return (
		<View className="flex-1 bg-cozyBg pt-14 px-5">
			{/* Header row with greeting and sun icon */}
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
				<Ionicons name="sunny" size={64} color="#F4C542" style={{ marginTop: -8 }} />
			</View>

			{/* Hero Card — highlights the single focus task */}
			{heroTask && (
				<View className="mt-8">
					<HeroCard
						task={heroTask}
						onComplete={handleHeroComplete}
					/>
				</View>
			)}

			{/* Other tasks — stacked queue preview with expand/collapse */}
			<OtherTasks
				tasks={otherTasks}
				onToggleTask={handleToggleTask}
			/>
		</View>
	);
}