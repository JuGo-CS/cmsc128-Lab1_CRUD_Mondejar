import { supabase } from '../../lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * A single completed task log ("Treasure") shown in the Wins screen.
 * This is the UI-facing shape — the backend supplies these from the `tasks` table.
 */
export interface TreasureLog {
    id: string;
    title: string;
    iconName: keyof typeof Ionicons.glyphMap;
    /** Completion date as `YYYY-MM-DD` (matches `tasks.completed_date`). */
    completedDate: string;
    /** Completion time as `HH:MM:SS` (matches `tasks.completed_time`). */
    completedTime: string;
}

/**
 * A group of treasure logs sharing the same completion date, ordered for display.
 */
export interface TreasureGroup {
    /** The group's date as `YYYY-MM-DD`. */
    date: string;
    /** Human-friendly date label, e.g. "September 9, 2026". */
    label: string;
    logs: TreasureLog[];
}

/**
 * Raw shape of a row from the `tasks` table (joined with its category).
 * Column names match the Supabase schema exactly — we do not modify the schema.
 */
interface CompletedTaskRow {
    task_id: string;
    cat_id: string | null;
    title: string;
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

/** Resolve the Ionicons name for a category emoji, with a neutral fallback. */
function iconForEmoji(emoji: string | null | undefined): keyof typeof Ionicons.glyphMap {
    if (!emoji) return DEFAULT_ICON;
    return EMOJI_TO_ICON[emoji] ?? DEFAULT_ICON;
}

/** Format a `YYYY-MM-DD` date into a friendly label like "September 9, 2026". */
function formatDateLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Convert a raw completed task row into a `TreasureLog`. */
function toTreasureLog(row: CompletedTaskRow): TreasureLog {
    return {
        id: row.task_id,
        title: row.title,
        iconName: iconForEmoji(row.categories?.emoji_holder),
        completedDate: row.completed_date ?? '',
        completedTime: row.completed_time ?? '',
    };
}

/**
 * Fetch all completed tasks and group them by completion date, newest first.
 *
 * Each group is ordered by its date descending, and the logs within a group are
 * ordered by completion time descending. This mirrors the Wins screen's grouped,
 * day-by-day layout. The completed tasks are not deleted — they stay in the
 * `tasks` table for history, and are grouped here by their `completed_date`.
 */
export async function fetchTreasureGroups(): Promise<TreasureGroup[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*, categories(emoji_holder)')
        .eq('status', 'completed')
        .not('completed_date', 'is', null)
        .order('completed_date', { ascending: false })
        .order('completed_time', { ascending: false });

    if (error) {
        console.error('Failed to fetch completed tasks:', error.message);
        throw error;
    }

    const rows = (data ?? []) as unknown as CompletedTaskRow[];
    const logs = rows.map(toTreasureLog);

    // Group logs by their completion date, preserving the newest-first order.
    const groups = new Map<string, TreasureLog[]>();
    for (const log of logs) {
        const group = groups.get(log.completedDate);
        if (group) {
            group.push(log);
        } else {
            groups.set(log.completedDate, [log]);
        }
    }

    return Array.from(groups.entries()).map(([date, groupLogs]) => ({
        date,
        label: formatDateLabel(date),
        logs: groupLogs,
    }));
}

/**
 * Update the title of a completed task log ("Treasure").
 *
 * The completed task stays in the `tasks` table; only its title is edited.
 * This keeps the edit action persistent across app reloads.
 */
export async function updateTreasureTitle(taskId: string, title: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .update({ title })
        .eq('task_id', taskId);

    if (error) {
        console.error('Failed to update treasure title:', error.message);
        throw error;
    }
}

/**
 * Delete a completed task log ("Treasure") from the `tasks` table.
 *
 * This permanently removes the task record. Use with care — the completion
 * history is not recoverable once deleted.
 */
export async function deleteTreasure(taskId: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('task_id', taskId);

    if (error) {
        console.error('Failed to delete treasure:', error.message);
        throw error;
    }
}
