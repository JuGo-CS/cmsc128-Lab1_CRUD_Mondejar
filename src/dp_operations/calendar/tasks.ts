import { supabase } from '../../lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * A task shown in the date-based calendar queue.
 * This is the UI-facing shape — the backend supplies these from the `tasks` table.
 */
export interface CalendarTask {
    id: string;
    title: string;
    description: string | null;
    catId: string | null;
    iconName: keyof typeof Ionicons.glyphMap;
    /** Priority from `tasks.priority`: 'high' | 'medium' | 'low'. */
    priority: 'high' | 'medium' | 'low';
    /** Deadline date as `YYYY-MM-DD`, or null if the task has no deadline. */
    deadline: string | null;
    /** Deadline time as `HH:MM`, or null if the task has no deadline/time. */
    deadlineTime: string | null;
    /** Category name from `categories.cat_name`, used for sorting by category. */
    categoryName: string | null;
    /** When the task was created, used for sorting by time added. */
    createdAt: string;
    completed: boolean;
}

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
    priority: string | null;
    deadline: string | null;
    created_at: string;
    // Joined from `categories` via cat_id
    categories?: { emoji_holder: string | null; cat_name: string | null } | null;
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

/** Resolve the Ionicons name for a category emoji, with a neutral fallback. */
function iconForEmoji(emoji: string | null | undefined): keyof typeof Ionicons.glyphMap {
    if (!emoji) return DEFAULT_ICON;
    return EMOJI_TO_ICON[emoji] ?? DEFAULT_ICON;
}

/**
 * Normalize a deadline value to a `YYYY-MM-DD` date string.
 *
 * Deadlines may be stored as a full timestamp (e.g. `2026-09-12 19:30:00+00`)
 * or as a bare date (`2026-09-12`). We only care about the calendar day, so we
 * take the first 10 characters. Invalid/missing values return null.
 */
function normalizeDate(value: string | null): string | null {
    if (!value) return null;
    const datePart = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

/**
 * Extract a `HH:MM` time from a deadline value.
 *
 * Deadlines may be stored as a full timestamp (e.g. `2026-09-12 19:30:00+00`),
 * a bare date (`2026-09-12`), or an ISO string. We extract the HH:MM portion so
 * the UI can display the deadline time. Returns null if no time is present.
 */
function extractTime(value: string | null): string | null {
    if (!value) return null;
    const match = value.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : null;
}

/**
 * Normalize a priority value from `tasks.priority` into a known label.
 * The schema stores priority as a varchar; we map it to a known union.
 * Unknown/missing values fall back to 'low'.
 */
function normalizePriority(priority: string | null): 'high' | 'medium' | 'low' {
    const value = (priority ?? '').toLowerCase();
    if (value === 'high' || value === 'medium') return value;
    return 'low';
}

/** Convert a raw task row into a `CalendarTask`. */
function toCalendarTask(row: TaskRow): CalendarTask {
    return {
        id: row.task_id,
        title: row.title,
        description: row.description,
        catId: row.cat_id,
        iconName: iconForEmoji(row.categories?.emoji_holder),
        priority: normalizePriority(row.priority),
        deadline: normalizeDate(row.deadline),
        deadlineTime: extractTime(row.deadline),
        categoryName: row.categories?.cat_name ?? null,
        createdAt: row.created_at,
        completed: row.status === 'completed',
    };
}

/**
 * Fetch the tasks applicable to a given selected date.
 *
 * Includes:
 * - Pending tasks whose deadline falls on the selected date.
 * - Pending tasks that are still active on the selected date (deadline on/after it).
 *
 * Completed tasks are excluded so the queue only shows what's still actionable.
 * Priority is derived from deadline urgency so the UI can display High/Medium/Low
 * without a schema change. The selected date is a parameter so a real calendar can
 * later supply any date without a rewrite.
 */
export async function fetchTasksForDate(selectedDate: string): Promise<CalendarTask[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*, categories(emoji_holder, cat_name)')
        .eq('status', 'pending')
        .order('deadline', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to fetch tasks for date:', error.message);
        throw error;
    }

    const rows = (data ?? []) as unknown as TaskRow[];

    // Keep tasks whose deadline is on or after the selected date (active then),
    // plus those with no deadline (still applicable). Deadlines are normalized
    // to `YYYY-MM-DD` so timestamp values (e.g. `2026-09-12 19:30:00+00`) compare
    // correctly against the selected date.
    const applicable = rows.filter((row) => {
        const deadline = normalizeDate(row.deadline);
        if (!deadline) return true;
        return deadline >= selectedDate;
    });

    return applicable.map(toCalendarTask);
}

/**
 * Sorting criteria for the calendar queue.
 * - 'priority'  → High → Low (or reversed)
 * - 'deadline'  → Earliest → Latest (or reversed)
 * - 'category'  → A → Z by category title (or reversed)
 * - 'createdAt' → Newest → Oldest (or reversed)
 */
export type SortCriteria = 'priority' | 'deadline' | 'category' | 'createdAt';

/** A fixed rank for each priority level, used to order High → Low. */
const PRIORITY_RANK: Record<CalendarTask['priority'], number> = {
    high: 0,
    medium: 1,
    low: 2,
};

/**
 * Sort the calendar tasks by the given criterion and direction.
 *
 * `ascending` is the default direction for each criterion; passing `false`
 * reverses it. The sort is stable so tasks that tie keep their original order.
 */
export function sortTasks(
    tasks: CalendarTask[],
    criteria: SortCriteria,
    ascending: boolean
): CalendarTask[] {
    const sorted = [...tasks].sort((a, b) => {
        let result: number;
        switch (criteria) {
            case 'priority':
                result = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
                break;
            case 'deadline':
                // Tasks with no deadline sort last (treated as furthest out).
                if (!a.deadline && !b.deadline) result = 0;
                else if (!a.deadline) result = 1;
                else if (!b.deadline) result = -1;
                else result = a.deadline.localeCompare(b.deadline);
                break;
            case 'category':
                result = (a.categoryName ?? '').localeCompare(b.categoryName ?? '');
                break;
            case 'createdAt':
                // Newest first by default.
                result = b.createdAt.localeCompare(a.createdAt);
                break;
            default:
                result = 0;
        }
        return ascending ? result : -result;
    });
    return sorted;
}
