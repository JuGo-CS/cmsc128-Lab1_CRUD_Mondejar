import { supabase } from '../../lib/supabase';
import { TaskItemData } from '@/components/index_components/task-item';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Raw shape of a row from the `tasks` table (joined with its category).
 * Column names match the Supabase schema exactly — we do not modify the schema.
 */
interface TaskRow {
    task_id: string;
    cat_id: string | null;
    title: string;
    description: string | null;
    status: string;
    is_focus: boolean;
    deadline: string | null;
    completed_date: string | null;
    completed_time: string | null;
    created_at: string;
    // Joined from `categories` via cat_id
    categories?: { emoji_holder: string | null } | null;
}

/**
 * Map a category's stored emoji to an Ionicons glyph name so the UI can render it.
 * Falls back to a neutral icon when the emoji is unknown or missing.
 */
const EMOJI_TO_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    '🧘': 'body',
    '💻': 'laptop',
    '🌱': 'leaf',
    '📚': 'book',
    '💧': 'water',
    '🚶': 'walk',
    '🧎': 'body',
    '📝': 'create',
    '🎓': 'school',
    '💼': 'briefcase',
    '🏃': 'barbell',
    '🧠': 'bulb',
    '💤': 'moon',
    '🍎': 'nutrition',
    '🎨': 'color-palette',
};

const DEFAULT_ICON: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

/** Today's date as `YYYY-MM-DD` in local time, matching `completed_date`. */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Current time as `HH:MM:SS` in local time, matching `completed_time`. */
function nowTimeString(): string {
    return new Date().toTimeString().slice(0, 8);
}

/** Resolve the Ionicons name for a category emoji, with a neutral fallback. */
function iconForEmoji(emoji: string | null | undefined): keyof typeof Ionicons.glyphMap {
    if (!emoji) return DEFAULT_ICON;
    return EMOJI_TO_ICON[emoji] ?? DEFAULT_ICON;
}

/** Convert a raw tasks row into the `TaskItemData` shape the UI expects. */
function toTaskItemData(row: TaskRow): TaskItemData {
    return {
        id: row.task_id,
        title: row.title,
        iconName: iconForEmoji(row.categories?.emoji_holder),
        completed: row.status === 'completed',
    };
}

/**
 * Order the pending task rows into the queue.
 *
 * The queue is a single ordered list where index 0 is the current Hero Task.
 * The hero task is the one flagged `is_focus`; the rest follow in queue order.
 *
 * NOTE: the ordering strategy is intentionally not hard-coded. It can later be
 * made configurable (priority, deadline, category, etc.) by changing this helper
 * without touching the UI.
 */
function orderTaskQueue(rows: TaskRow[]): TaskRow[] {
    const focusTasks = rows.filter((r) => r.is_focus);
    const otherTasks = rows.filter((r) => !r.is_focus);
    return [...focusTasks, ...otherTasks];
}

/**
 * Fetch all pending tasks and return them as an ordered queue.
 *
 * The frontend treats the queue as a single ordered list where index 0 is the
 * current Hero Task. The schema marks the hero task with `is_focus`.
 */
export async function fetchPendingTaskQueue(): Promise<TaskItemData[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*, categories(emoji_holder)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to fetch pending tasks:', error.message);
        throw error;
    }

    const rows = (data ?? []) as unknown as TaskRow[];
    return orderTaskQueue(rows).map(toTaskItemData);
}

/**
 * Mark a task as completed and promote the next task in the queue.
 *
 * Steps:
 * 1. Load the current ordered pending queue to determine the next task.
 * 2. Update the completed task: `status` = 'completed', `is_focus` = false,
 *    `completed_date` = today, `completed_time` = now.
 * 3. Promote the next task in queue order to `is_focus` = true (if any remain).
 *
 * The completed task is not deleted — it stays in the `tasks` table for history,
 * but is filtered out of the active queue by `fetchPendingTaskQueue`.
 */
export async function completeTask(taskId: string): Promise<void> {
    const today = todayDateString();
    const time = nowTimeString();

    // Load the current ordered pending queue to find the next task to promote.
    const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('task_id, is_focus, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (fetchError) {
        console.error('Failed to load tasks for promotion:', fetchError.message);
        throw fetchError;
    }

    const rows = (data ?? []) as { task_id: string; is_focus: boolean; created_at: string }[];
    const ordered = orderTaskQueue(rows as unknown as TaskRow[]);
    const index = ordered.findIndex((r) => r.task_id === taskId);

    // Only the current Hero Task (index 0 in the ordered queue) triggers a
    // promotion. Completing an "other task" leaves the hero unchanged.
    const isHeroTask = index === 0;
    const nextTask = isHeroTask ? ordered[1] : undefined;

    // 1. Mark the completed task as done and clear its focus flag.
    const { error: updateError } = await supabase
        .from('tasks')
        .update({
            status: 'completed',
            is_focus: false,
            completed_date: today,
            completed_time: time,
        })
        .eq('task_id', taskId);

    if (updateError) {
        console.error('Failed to complete task:', updateError.message);
        throw updateError;
    }

    // 2. Promote the next task in queue order to be the new Hero Task.
    if (nextTask) {
        const { error: promoteError } = await supabase
            .from('tasks')
            .update({ is_focus: true })
            .eq('task_id', nextTask.task_id);

        if (promoteError) {
            console.error('Failed to promote next task:', promoteError.message);
            throw promoteError;
        }
    }
}
