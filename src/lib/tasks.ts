import { supabase } from './supabase';
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
 * Fetch all pending tasks and return them as an ordered queue.
 *
 * The frontend treats the queue as a single ordered list where index 0 is the
 * current Hero Task. The schema marks the hero task with `is_focus`, so we place
 * that task first and then order the remaining pending tasks by creation time.
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

    // Split into the focus task and the rest, then recombine so the focus task
    // is always at the front of the queue (index 0 = Hero Task).
    const focusTasks = rows.filter((r) => r.is_focus);
    const otherTasks = rows.filter((r) => !r.is_focus);

    const orderedRows = [...focusTasks, ...otherTasks];
    return orderedRows.map(toTaskItemData);
}
