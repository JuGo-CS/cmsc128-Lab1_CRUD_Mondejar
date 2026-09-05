import { Text, View, Pressable, ScrollView } from 'react-native';

const tasks = [
  {
    title: 'Finish CMSC 128 project',
    category: 'School',
    completed: false,
  },
  {
    title: 'Review Kotlin basics',
    category: 'Study',
    completed: true,
  },
  {
    title: 'Practice badminton',
    category: 'Personal',
    completed: false,
  },
];

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10"
      >
        {/* Header */}
        <View className="mb-8 mt-16">
          <Text className="text-sm font-medium text-slate-500">
            Saturday, September 5
          </Text>

          <Text className="mt-1 text-3xl font-bold text-slate-900">
            Good evening!
          </Text>

          <Text className="mt-2 text-base text-slate-500">
            Let's take things one step at a time.
          </Text>
        </View>

        {/* Progress Card */}
        <View className="mb-6 rounded-3xl bg-blue-600 p-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-blue-100">
                Today's progress
              </Text>

              <Text className="mt-1 text-3xl font-bold text-white">
                1 of 3
              </Text>

              <Text className="mt-1 text-sm text-blue-100">
                tasks completed
              </Text>
            </View>

            <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-blue-300">
              <Text className="text-xl font-bold text-white">33%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mt-6 h-2 overflow-hidden rounded-full bg-blue-400">
            <View className="h-full w-1/3 rounded-full bg-white" />
          </View>
        </View>

        {/* Section Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-slate-900">
            Today's tasks
          </Text>

          <Text className="text-sm font-semibold text-blue-600">
            3 tasks
          </Text>
        </View>

        {/* Task List */}
        <View className="gap-3">
          {tasks.map((task) => (
            <Pressable
              key={task.title}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <View className="flex-row items-center">
                {/* Checkbox */}
                <View
                  className={`mr-4 h-6 w-6 items-center justify-center rounded-full border-2 ${
                    task.completed
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {task.completed && (
                    <Text className="text-xs font-bold text-white">✓</Text>
                  )}
                </View>

                {/* Task Info */}
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      task.completed
                        ? 'text-slate-400 line-through'
                        : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </Text>

                  <Text className="mt-1 text-sm text-slate-400">
                    {task.category}
                  </Text>
                </View>

                <Text className="text-xl text-slate-300">›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Add Task Button */}
        <Pressable className="mt-6 items-center rounded-2xl bg-slate-900 py-4">
          <Text className="text-base font-bold text-white">
            + Add a new task
          </Text>
        </Pressable>

        {/* Small motivational card */}
        <View className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <Text className="text-base font-bold text-blue-900">
            Keep going!
          </Text>

          <Text className="mt-1 leading-5 text-blue-700">
            Progress doesn't have to be perfect. Just keep moving, unti-unti.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}