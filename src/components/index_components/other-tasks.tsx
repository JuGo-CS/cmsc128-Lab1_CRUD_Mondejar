import { HomeSortCriteria } from "@/dp_operations/home/tasks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import TaskItem, { TaskItemData } from "./task-item";

interface OtherTasksProps {
  tasks: TaskItemData[];
  onToggleTask?: (task: TaskItemData) => void;
  /** Whether the full task queue is expanded. */
  expanded: boolean;
  /** Toggle the expanded/collapsed state. */
  onToggleExpanded: () => void;
  /** When true, the queue is in edit mode (drag + hero selection). */
  editMode?: boolean;
  /** Toggle edit mode. */
  onToggleEdit?: () => void;
  /** Active sort criterion. */
  sortCriteria?: HomeSortCriteria;
  /** Change the active sort criterion. */
  onChangeSort?: (criteria: HomeSortCriteria) => void;
  /** Called when a task is chosen as the Hero Task. */
  onMakeHero?: (task: TaskItemData) => void;
  /** Called with the new full queue order after a manual drag. */
  onReorder?: (orderedIds: string[]) => void;
  /** Called when the user taps "Edit" on a task in edit mode. */
  onEdit?: (task: TaskItemData) => void;
  /** Called when the user taps "Delete" on a task in edit mode. */
  onDelete?: (task: TaskItemData) => void;
}

// Human-readable label for each (user-selectable) Home sort criterion.
// 'manual' is the default position-order mode and is not shown in the menu.
const SORT_LABELS: Record<HomeSortCriteria, string> = {
  manual: "Manual",
  priority: "Priority",
  deadline: "Deadline",
  category: "Category",
  createdAt: "Time added",
};

// The options shown in the sort menu (excludes the 'manual' position order).
const SORT_OPTIONS: HomeSortCriteria[] = [
  "priority",
  "deadline",
  "category",
  "createdAt",
];

// Fixed header for the "Other tasks" section (title + sort + edit button).
// Rendered outside the scrollable area so it stays pinned on screen.
export function OtherTasksHeader({
  editMode,
  onToggleEdit,
  sortCriteria = "manual",
  onChangeSort,
}: {
  editMode?: boolean;
  onToggleEdit?: () => void;
  sortCriteria?: HomeSortCriteria;
  onChangeSort?: (criteria: HomeSortCriteria) => void;
}) {
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  return (
    // Header part of the  "Other tasks"
    <View className="flex-row items-center justify-between">
      <Text className="text-xl font-fredoka text-deepBrown">Other tasks:</Text>

      <View className="flex-row items-center">
        {/* Sort control — only shown when not editing */}
        {!editMode && (
          <TouchableOpacity
            onPress={() => setSortMenuVisible(true)}
            activeOpacity={0.7}
            className="flex-row items-center mr-3 py-1"
          >
            <Ionicons name="file-tray-full-sharp" size={18} color="#3D2E2B" />
            <Text className="text-base font-fredoka-semibold text-deepBrown ml-1 underline">
              {SORT_LABELS[sortCriteria]}
            </Text>
          </TouchableOpacity>
        )}

        {/* Edit toggle */}
        <TouchableOpacity
          onPress={onToggleEdit}
          activeOpacity={0.7}
          className="p-1"
        >
          <Ionicons
            name={editMode ? "close" : "create-outline"}
            size={22}
            color={editMode ? "#C0392B" : "#7D6E6B"}
          />
        </TouchableOpacity>
      </View>

      {/* Sort options menu at the top*/}
      <Modal
        visible={sortMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(61, 46, 43, 0.4)" }}
          activeOpacity={1}
          onPress={() => setSortMenuVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-cozyBg rounded-b-[28px] px-6 pt-14 pb-8 shadow-xl"
          >
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-2xl font-fredoka-semibold text-deepBrown tracking-wide">
                Sort by:
              </Text>
            </View>
            <View className="h-[3px] bg-deepBrown/10 mb-3" />
            <View className="gap-y-4">
              {SORT_OPTIONS.map((option) => {
                const selected = option === sortCriteria;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      onChangeSort?.(option);
                      setSortMenuVisible(false);
                    }}
                    activeOpacity={0.7}
                    className={`flex-row items-center justify-between py-4 pl-11 rounded-2xl transition-all ${
                      selected
                        ? "bg-focusHero/15 border border-focusHero/20"
                        : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        selected
                          ? "font-fredoka-bold text-focusHero"
                          : "font-fredoka-medium text-deepBrown"
                      }`}
                    >
                      {SORT_LABELS[option]}
                    </Text>
                    {selected && (
                      <View className="bg-focusHero/20 p-1 rounded-full">
                        <Ionicons name="checkmark" size={16} color="#6B8E70" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// "Other tasks" section — shows a low-pressure stacked preview of a few tasks.
// Tapping the stack or "See some tasks" expands the full queue; tapping again collapses.
export default function OtherTasks({
  tasks,
  onToggleTask,
  expanded,
  onToggleExpanded,
  editMode,
  onToggleEdit,
  sortCriteria,
  onChangeSort,
  onMakeHero,
  onReorder,
  onEdit,
  onDelete,
}: OtherTasksProps) {
  // Show a limited number of tasks in the stacked preview.
  const PREVIEW_COUNT = 3;
  const visibleTasks = expanded ? tasks : tasks.slice(0, PREVIEW_COUNT);
  const hasMore = tasks.length > PREVIEW_COUNT;

  // Empty state — no other tasks remaining.
  if (tasks.length === 0) {
    return (
      <View className="mt-2">
        <View className="bg-cardBg rounded-2xl px-5 py-6 items-center justify-center">
          <Ionicons
            name="checkmark-done-circle-outline"
            size={40}
            color="#7D6E6B"
          />
          <Text className="text-base font-fredoka-medium text-mutedBrown text-center mt-3">
            Nothing else on your plate. Time to relax ~
          </Text>
        </View>
      </View>
    );
  }

  // Edit mode: render a plain, fully expanded list with drag handles so the
  // user can press-and-hold a card and drag it to reorder.
  if (editMode) {
    return (
      <View className="mt-2">
        <DraggableTaskList
          tasks={tasks}
          onMakeHero={onMakeHero}
          onReorder={onReorder}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </View>
    );
  }

  return (
    <View className="mt-2">
      {expanded ? (
        // Expanded: show all tasks as normal stacked rows.
        // Expansion is intentionally only toggled by the explicit 'See some tasks' button.
        visibleTasks.map((task) => (
          <View
            key={task.id}
            className="bg-taskStack rounded-2xl px-4 mb-3 border border-white/50"
          >
            <TaskItem task={task} onToggle={onToggleTask} compact />
          </View>
        ))
      ) : (
        // Collapsed: the top visible task is tappable and completes the task.
        // The queue advances automatically after the DB write succeeds.
        <View
          className="relative"
          style={{ paddingBottom: (visibleTasks.length - 1) * 12 }}
        >
          <TouchableOpacity
            onPress={() => onToggleTask?.(visibleTasks[0])}
            activeOpacity={0.85}
            className="relative z-10 bg-taskStack rounded-2xl px-4 border border-white/50"
            style={{
              shadowColor: "#3D2E2B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <TaskItem task={visibleTasks[0]} onToggle={onToggleTask} compact />
          </TouchableOpacity>
          {/* Remaining queue tasks peek out from behind the front card, in order */}
          {visibleTasks.slice(1).map((task, index) => (
            <View
              key={task.id}
              className="absolute left-0 right-0 bg-taskStack rounded-2xl px-4 border border-white/50"
              style={{
                top: (index + 1) * 12,
                zIndex: index,
                opacity: 0.7,
              }}
            >
              <TaskItem task={task} onToggle={onToggleTask} compact muted />
            </View>
          ))}
        </View>
      )}

      {/* "See other tasks" toggle */}
      <TouchableOpacity
        onPress={onToggleExpanded}
        activeOpacity={0.7}
        className="flex-row items-center justify-end mt-3"
      >
        <Text className="text-lg font-fredoka-semibold text-deepBrown underline">
          {expanded ? "See fewer tasks" : "See other tasks"}
        </Text>
        <Ionicons
          name={expanded ? "caret-up" : "caret-down"}
          size={16}
          color="#3D2E2B"
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    </View>
  );
}

/**
 * A press-and-hold draggable list used in edit mode.
 *
 * Uses `react-native-gesture-handler` + reanimated (both already in the project)
 * so no extra dependency is needed. Dragging a card past the midpoint of a
 * neighbor reorders the list, and the new order is reported via `onReorder`.
 */
function DraggableTaskList({
  tasks,
  onMakeHero,
  onReorder,
  onEdit,
  onDelete,
}: {
  tasks: TaskItemData[];
  onMakeHero?: (task: TaskItemData) => void;
  onReorder?: (orderedIds: string[]) => void;
  onEdit?: (task: TaskItemData) => void;
  onDelete?: (task: TaskItemData) => void;
}) {
  const [order, setOrder] = useState<string[]>(() => tasks.map((t) => t.id));

  // Measured height of a single row (captured from the first row's layout).
  // Used to translate a drag offset into how many rows were crossed.
  const [rowHeight, setRowHeight] = useState(0);

  // The id of the card whose Edit/Delete actions are open (only one at a
  // time so row heights stay consistent). Reset to null on any drag start.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Whether a drag is currently in progress. Used to avoid clobbering the
  // in-progress drag when the parent refetches after a task change.
  const [dragging, setDragging] = useState(false);

  // Keep the local order in sync when the tasks list changes. The parent
  // refetches from the shared task-change event, so a new task (Add) or a
  // reordered queue is reflected here without a manual refresh — but a drag
  // in progress must not be clobbered, so only resync when not dragging.
  useEffect(() => {
    if (dragging) return;
    setOrder(tasks.map((t) => t.id));
  }, [tasks, dragging]);

  // useEffect(() => {
  //     setOrder(tasks.map((t) => t.id));
  // }, [tasks]);

  // On drag end, compute the new index from the dragged offset and reorder.
  const handleDragEnd = (task: TaskItemData, offsetY: number) => {
    const fromIndex = order.indexOf(task.id);
    if (fromIndex === -1) return;

    // Use the measured row height if available; otherwise fall back to a
    // sensible default. The card has a `mb-3` (12px) bottom margin, so the
    // pitch between row tops is the card height plus that gap.
    const ROW_GAP = 12;
    const pitch = rowHeight > 0 ? rowHeight + ROW_GAP : 60;
    const move = Math.round(offsetY / pitch);
    const toIndex = Math.max(0, Math.min(order.length - 1, fromIndex + move));
    if (toIndex === fromIndex) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setOrder(next);
    onReorder?.(next);
  };

  return (
    <View>
      <Text className="text-sm font-fredoka text-mutedBrown mb-2 text-center">
        Press and hold the handle, then drag to reorder.
      </Text>

      {order.map((id) => {
        // Guard against stale ids: a task may have been removed from
        // `tasks` (e.g. it just became the Hero Task) while `order` still
        // holds its id. Skip it rather than assume it always exists.
        const task = tasks.find((t) => t.id === id);
        if (!task) return null;
        return (
          <DraggableRow
            key={id}
            task={task}
            onLayoutHeight={setRowHeight}
            onDragEnd={handleDragEnd}
            onMakeHero={onMakeHero}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={expandedId === id}
            onToggleActions={() =>
              setExpandedId((prev) => (prev === id ? null : id))
            }
            onDragStart={() => setExpandedId(null)}
          />
        );
      })}
    </View>
  );
}

function DraggableRow({
  task,
  onLayoutHeight,
  onDragEnd,
  onMakeHero,
  onEdit,
  onDelete,
  showActions,
  onToggleActions,
  onDragStart,
}: {
  task: TaskItemData;
  onLayoutHeight: (height: number) => void;
  onDragEnd: (task: TaskItemData, offsetY: number) => void;
  onMakeHero?: (task: TaskItemData) => void;
  onEdit?: (task: TaskItemData) => void;
  onDelete?: (task: TaskItemData) => void;
  showActions?: boolean;
  onToggleActions?: () => void;
  onDragStart?: () => void;
}) {
  const translateY = useSharedValue(0);
  const [dragging, setDragging] = useState(false);

  const pan = Gesture.Pan()
    // Require a short press-and-hold before the drag begins, so accidental
    // swipes/taps don't reorder tasks.
    .activateAfterLongPress(200)
    .onStart(() => {
      // Collapse any open actions so all rows return to their base height
      // before dragging (keeps the drag pitch consistent).
      if (onDragStart) runOnJS(onDragStart)();
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(onDragEnd)(task, e.translationY);
      runOnJS(setDragging)(false);
      translateY.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: dragging ? 20 : 0,
    opacity: dragging ? 0.9 : 1,
    elevation: dragging ? 8 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        className="bg-taskStack rounded-2xl px-4 mb-3 border border-white/50"
        style={animatedStyle}
        onLayout={(e) => onLayoutHeight(e.nativeEvent.layout.height)}
      >
        <TaskItem
          task={task}
          editMode
          isHero={task.isFocus === true}
          onMakeHero={onMakeHero}
          showActions={showActions}
          onToggleActions={onToggleActions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Animated.View>
    </GestureDetector>
  );
}
