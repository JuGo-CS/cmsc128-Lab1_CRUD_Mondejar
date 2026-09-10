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
    priority: string | null;
    deadline: string | null;
    completed_date: string | null;
    completed_time: string | null;
    created_at: string;
    // Manual ordering column. Optional because it may not exist yet in the
    // database; when absent the queue falls back to `created_at`.
    position: number | null;
    // Joined from `categories` via cat_id
    categories?: { emoji_holder: string | null; cat_name: string | null } | null;
}

/**
 * A pending task with the extra metadata the Home screen needs for sorting,
 * manual reordering, and Hero Task selection. This is the UI-facing shape.
 * It also carries the fields the Calendar needs so Calendar can render the
 * same global queue as a filtered view.
 */
export interface HomeTask extends TaskItemData {
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

/** Normalize a priority value into a known union, defaulting to 'low'. */
function normalizePriority(priority: string | null): 'high' | 'medium' | 'low' {
    const value = (priority ?? '').toLowerCase();
    if (value === 'high' || value === 'medium') return value;
    return 'low';
}

/** Normalize a deadline value to a `YYYY-MM-DD` date string (first 10 chars). */
function normalizeDate(value: string | null): string | null {
    if (!value) return null;
    const datePart = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

/** Extract a `HH:MM` time from a deadline value, or null if none is present. */
function extractTime(value: string | null): string | null {
    if (!value) return null;
    const match = value.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : null;
}

/** Convert a raw tasks row into the `HomeTask` shape the UI expects. */
function toHomeTask(row: TaskRow): HomeTask {
    return {
        id: row.task_id,
        title: row.title,
        iconName: iconForEmoji(row.categories?.emoji_holder),
        completed: row.status === 'completed',
        description: row.description,
        catId: row.cat_id,
        priority: normalizePriority(row.priority),
        deadline: normalizeDate(row.deadline),
        deadlineTime: extractTime(row.deadline),
        categoryName: row.categories?.cat_name ?? null,
        createdAt: row.created_at,
        position: row.position,
        isFocus: row.is_focus,
    };
}

/**
 * Order the pending task rows into the queue.
 *
 * The queue is a single ordered list where index 0 is the current Hero Task.
 * The hero task is the one flagged `is_focus`; the rest follow by their manual
 * `position` when available, otherwise by `created_at`.
 */
function orderTaskQueue(rows: TaskRow[]): TaskRow[] {
    const focusTasks = rows.filter((r) => r.is_focus);
    const otherTasks = rows
        .filter((r) => !r.is_focus)
        // Tasks with a `position` come first (ordered by it); tasks without one
        // (e.g. newly added before any reorder) go to the end by `created_at`.
        // This keeps the manual order stable and never mixes null/non-null
        // positions in a way that produces an inconsistent sequence.
        .sort((a, b) => {
            const aHasPos = a.position != null;
            const bHasPos = b.position != null;
            if (aHasPos && bHasPos) {
                return a.position! - b.position!;
            }
            if (aHasPos) return -1;
            if (bHasPos) return 1;
            return a.created_at.localeCompare(b.created_at);
        });
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
        .select('*, categories(emoji_holder, cat_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to fetch pending tasks:', error.message);
        throw error;
    }

    const rows = (data ?? []) as unknown as TaskRow[];
    return orderTaskQueue(rows).map(toHomeTask);
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
        .select('task_id, is_focus, created_at, position')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (fetchError) {
        console.error('Failed to load tasks for promotion:', fetchError.message);
        throw fetchError;
    }

    const rows = (data ?? []) as {
        task_id: string;
        is_focus: boolean;
        created_at: string;
        position: number | null;
    }[];
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

/**
 * Set the given task as the Hero Task (`is_focus` = true).
 *
 * Only one task can be the Hero Task at a time, so any task currently flagged
 * `is_focus` is unset first. Returns the id of the task that was the previous
 * Hero Task (if any) so the caller can restore it to the queue.
 */
export async function setHeroTask(taskId: string): Promise<string | null> {
    // Find the current Hero Task (if any).
    const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('task_id')
        .eq('status', 'pending')
        .eq('is_focus', true);

    if (fetchError) {
        console.error('Failed to load current hero task:', fetchError.message);
        throw fetchError;
    }

    const rows = (data ?? []) as { task_id: string }[];
    const previousHero = rows.find((r) => r.task_id !== taskId)?.task_id ?? null;

    // Unset the previous hero (if it is a different task) and set the new one.
    // Supabase query builders are thenables (not real Promises), so type the
    // array as PromiseLike to match what `.update().eq()` returns.
    const updates: PromiseLike<unknown>[] = [];

    if (previousHero) {
        updates.push(
            supabase
                .from('tasks')
                .update({ is_focus: false })
                .eq('task_id', previousHero)
        );
    }

    updates.push(supabase.from('tasks').update({ is_focus: true }).eq('task_id', taskId));

    const results = await Promise.all(updates);
    const error = results.find((r) => (r as { error?: unknown }).error);
    if (error) {
        const err = (error as { error: { message: string } }).error;
        console.error('Failed to set hero task:', err.message);
        throw err;
    }

    return previousHero;
}

/**
 * Persist the order of the active non-Hero tasks to `tasks.position`.
 *
 * The Hero Task is excluded from the position sequence — its `position` is set
 * to null so it never occupies a slot in the Other Tasks queue. The non-Hero
 * tasks are written with sequential, unique positions `0, 1, 2, ...` in the
 * given order. This keeps the database order in sync with the visible queue.
 */
export async function persistTaskPositions(
    orderedOtherIds: string[],
    heroId: string | null
): Promise<void> {
    // Supabase query builders are thenables (not real Promises), so type the
    // array as PromiseLike to match what `.update().eq()` returns.
    const updates: PromiseLike<unknown>[] = [];

    // The Hero Task must not occupy a position in the Other Tasks queue.
    if (heroId) {
        updates.push(
            supabase.from('tasks').update({ position: null }).eq('task_id', heroId)
        );
    }

    // Deduplicate so a task never gets two conflicting `position` values, then
    // write each non-Hero task's index as its new position (contiguous, unique).
    const uniqueIds = Array.from(new Set(orderedOtherIds));
    uniqueIds.forEach((taskId, index) => {
        updates.push(
            supabase.from('tasks').update({ position: index }).eq('task_id', taskId)
        );
    });

    const results = await Promise.all(updates);
    const error = results.find((r) => (r as { error?: unknown }).error);
    if (error) {
        const err = (error as { error: { message: string } }).error;
        console.error('Failed to persist task positions:', err.message);
        throw err;
    }
}

/**
 * Sorting criteria for the Home task queue.
 * - 'manual' → the persisted `position` order (the default; never re-sorted)
 * - 'priority' → High → Low
 * - 'deadline' → Earliest → Latest
 * - 'category' → A → Z by category title
 * - 'createdAt' → Newest → Oldest
 */
export type HomeSortCriteria = 'manual' | 'priority' | 'deadline' | 'category' | 'createdAt';

/** A fixed rank for each priority level, used to order High → Low. */
const HOME_PRIORITY_RANK: Record<HomeTask['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2,
};

/**
 * Sort the Home task queue (excluding the Hero Task) by the given criterion.
 *
 * The Hero Task stays pinned at index 0 regardless of the sort criterion, so
 * only the "other tasks" portion is reordered. This keeps the low-pressure
 * hero-first behavior intact.
 */
export function sortHomeTasks(
    tasks: HomeTask[],
    criteria: HomeSortCriteria
): HomeTask[] {
    // Split the Hero Task (is_focus) from the rest.
    const hero = tasks.filter((t) => t.isFocus);
    const others = tasks.filter((t) => !t.isFocus);

    // 'manual' means "keep the persisted `position` order" — the Hero stays
    // first and the others keep whatever order `orderTaskQueue` produced. This
    // ensures manual drag ordering is never overwritten by automatic sorting.
    if (criteria === 'manual') {
        return [...hero, ...others];
    }

    const sortedOthers = [...others].sort((a, b) => {
        switch (criteria) {
            case 'priority':
                return HOME_PRIORITY_RANK[a.priority] - HOME_PRIORITY_RANK[b.priority];
            case 'deadline':
                // Tasks with no deadline sort last.
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return a.deadline.localeCompare(b.deadline);
            case 'category':
                return (a.categoryName ?? '').localeCompare(b.categoryName ?? '');
            case 'createdAt':
                return b.createdAt.localeCompare(a.createdAt);
            default:
                return 0;
        }
    });

    return [...hero, ...sortedOthers];
}

/**
 * Undo a task completion by restoring it to the active queue.
 *
 * If the task was the Hero Task before completion, the task that was promoted
 * in its place is demoted and this task becomes the Hero again. The task's
 * completion metadata is cleared. Callers should re-sync positions afterward.
 */
export async function undoCompleteTask(taskId: string, wasHero: boolean): Promise<void> {
    const restore: Record<string, unknown> = {
        status: 'pending',
        completed_date: null,
        completed_time: null,
    };

    if (wasHero) {
        // Demote the current Hero (the task that was promoted on completion)
        // and make this task the Hero again.
        const { data, error: fetchError } = await supabase
            .from('tasks')
            .select('task_id')
            .eq('status', 'pending')
            .eq('is_focus', true);

        if (fetchError) {
            console.error('Failed to load current hero for undo:', fetchError.message);
            throw fetchError;
        }

        const currentHero = (data ?? [])[0]?.task_id;
        if (currentHero && currentHero !== taskId) {
            const { error: demoteError } = await supabase
                .from('tasks')
                .update({ is_focus: false })
                .eq('task_id', currentHero);
            if (demoteError) {
                console.error('Failed to demote hero for undo:', demoteError.message);
                throw demoteError;
            }
        }
        restore.is_focus = true;
    }

    const { error } = await supabase.from('tasks').update(restore).eq('task_id', taskId);
    if (error) {
        console.error('Failed to undo task completion:', error.message);
        throw error;
    }
}

/**
 * Restore a previously deleted task by re-inserting it with its original data
 * and position. Used to undo a task deletion.
 */
export async function restoreTask(task: HomeTask): Promise<void> {
    const { error } = await supabase.from('tasks').insert({
        task_id: task.id,
        cat_id: task.catId,
        title: task.title,
        description: task.description,
        status: task.completed ? 'completed' : 'pending',
        is_focus: task.isFocus,
        priority: task.priority,
        deadline: task.deadline,
        created_at: task.createdAt,
        position: task.position,
    });

    if (error) {
        console.error('Failed to restore task:', error.message);
        throw error;
    }
}

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

/** Build a snapshot from a pending `HomeTask` (used by Home/Calendar edits). */
export function homeTaskToSnapshot(task: HomeTask): TaskSnapshot {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        catId: task.catId,
        priority: task.priority,
        deadline: task.deadline,
        status: task.completed ? 'completed' : 'pending',
        isFocus: task.isFocus,
        position: task.position,
        completedDate: null,
        completedTime: null,
        createdAt: task.createdAt,
    };
}

/**
 * Restore a task to a previously captured snapshot. Used to undo an edit.
 * Re-applies every persisted field exactly as it was before the edit.
 */
export async function restoreTaskSnapshot(snapshot: TaskSnapshot): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .update({
            title: snapshot.title,
            description: snapshot.description,
            cat_id: snapshot.catId,
            priority: snapshot.priority,
            deadline: snapshot.deadline,
            status: snapshot.status,
            is_focus: snapshot.isFocus,
            position: snapshot.position,
            completed_date: snapshot.completedDate,
            completed_time: snapshot.completedTime,
        })
        .eq('task_id', snapshot.id);

    if (error) {
        console.error('Failed to restore task snapshot:', error.message);
        throw error;
    }
}
