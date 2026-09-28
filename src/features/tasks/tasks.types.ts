import { Ionicons } from '@expo/vector-icons';

/**
 * A pending task with the extra metadata the Home screen needs for sorting,
 * manual reordering, and Hero Task selection. This is the UI-facing shape.
 * It also carries the fields the Calendar needs so Calendar can render the
 * same global queue as a filtered view.
 */
export interface HomeTask {
  /** The task's unique identifier. */
  id: string;
  /** The task's title. */
  title: string;
  /** The task's description, or null. */
  description: string | null;
  /** The category id, or null. */
  catId: string | null;
  /** Priority from `tasks.priority`: 'high' | 'medium' | 'low'. */
  priority: 'high' | 'medium' | 'low';
  /** Deadline date as `YYYY-MM-DD`, or null if the task has no deadline. */
  deadline: string | null;
  /** Deadline time as `HH:MM`, or null if the task has no deadline/time. */
  deadlineTime: string | null;
  /** Category name from `categories.cat_name`, used for category sorting. */
  categoryName: string | null;
  /** When the task was created, used for time-added sorting. */
  createdAt: string;
  /** Manual order index (0-based). Null when the DB has no `position` column. */
  position: number | null;
  /** Whether this task is currently the Hero Task (`is_focus`). */
  isFocus: boolean;
  /** Whether the task is completed. */
  completed: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  emoji: string;
}

/** Sorting criteria for the Home task queue. */
export type HomeSortCriteria = 'manual' | 'priority' | 'deadline' | 'category' | 'createdAt';

/**
 * A full snapshot of a task's persisted state, captured before an edit so Undo
 * can restore the exact previous values (rather than reversing individual
 * fields). Covers every field the edit form can change.
 */
export interface TaskSnapshot {
  id: string;
  title: string;
  description: string | null;
  catId: string | null;
  priority: string | null;
  deadline: string | null;
  status: string;
  isFocus: boolean;
  position: number | null;
  completedDate: string | null;
  completedTime: string | null;
  createdAt: string;
}