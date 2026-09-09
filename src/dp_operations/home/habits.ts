import { supabase } from '../../lib/supabase';
import { HabitData } from '@/components/index_components/habit-card';

/**
 * Raw shape of a row from the `habits` table (joined with its category).
 * Column names match the Supabase schema exactly — we do not modify the schema.
 */
interface HabitRow {
    habit_id: string;
    cat_id: string | null;
    title: string;
    date_created: string;
    time_created: string;
    created_at: string;
    // Joined from `categories` via cat_id
    categories?: { emoji_holder: string | null } | null;
}

/** Today's date as `YYYY-MM-DD` in local time, matching `habit_logs.completed_date`. */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Current time as `HH:MM:SS` in local time, matching `habit_logs.completed_time`. */
function nowTimeString(): string {
    return new Date().toTimeString().slice(0, 8);
}

/** Convert a raw habits row into the `HabitData` shape the UI expects. */
function toHabitData(row: HabitRow): HabitData {
    return {
        id: row.habit_id,
        title: row.title,
        emoji: row.categories?.emoji_holder ?? '✨',
        completed: false,
    };
}

/**
 * Fetch the user's habits that have not yet been completed today.
 *
 * Habits already logged in `habit_logs` for today are excluded so they drop out
 * of the carousel (matching the existing "remove when done" behavior). Completion
 * is tracked through `habit_logs`, not a boolean on the habit row. This makes
 * completion persistent — reopening the app reflects the database state.
 */
export async function fetchTodayHabits(): Promise<HabitData[]> {
    const today = todayDateString();

    // Fetch all habits (with their category emoji) and today's completion logs.
    const [habitsResult, logsResult] = await Promise.all([
        supabase.from('habits').select('*, categories(emoji_holder)'),
        supabase.from('habit_logs').select('habit_id').eq('completed_date', today),
    ]);

    if (habitsResult.error) {
        console.error('Failed to fetch habits:', habitsResult.error.message);
        throw habitsResult.error;
    }
    if (logsResult.error) {
        console.error('Failed to fetch habit logs:', logsResult.error.message);
        throw logsResult.error;
    }

    const habitRows = (habitsResult.data ?? []) as unknown as HabitRow[];
    const completedToday = new Set((logsResult.data ?? []).map((l) => l.habit_id));

    // Only show habits that haven't been completed today yet.
    return habitRows
        .filter((row) => !completedToday.has(row.habit_id))
        .map(toHabitData);
}

/**
 * Mark a habit as completed for today by inserting a row into `habit_logs`.
 *
 * Saves the `habit_id`, `completed_date`, and `completed_time`. This keeps
 * completion history in the database via the logs table, so completion is
 * persistent across app reloads.
 */
export async function logHabitCompletion(habitId: string): Promise<void> {
    const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        completed_date: todayDateString(),
        completed_time: nowTimeString(),
    });

    if (error) {
        console.error('Failed to log habit completion:', error.message);
        throw error;
    }
}

/**
 * Undo a habit completion by removing today's completion log for the habit.
 * This restores the habit to the "not completed today" list.
 */
export async function undoHabitCompletion(habitId: string): Promise<void> {
    const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_date', todayDateString());

    if (error) {
        console.error('Failed to undo habit completion:', error.message);
        throw error;
    }
}
