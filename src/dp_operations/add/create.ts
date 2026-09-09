import { supabase } from '../../lib/supabase';

/**
 * Fields required to create a new task.
 * Column names match the `tasks` table schema exactly — we do not modify it.
 */
export interface CreateTaskInput {
    title: string;
    description: string | null;
    cat_id: string | null;
    /** `YYYY-MM-DD` deadline, or null if the task has no deadline. */
    deadline: string | null;
    /** 'high' | 'medium' | 'low' — matches `tasks.priority`. */
    priority: string;
}

/**
 * Fields required to create a new daily habit.
 * Column names match the `habits` table schema exactly — we do not modify it.
 */
export interface CreateHabitInput {
    title: string;
    cat_id: string | null;
}

/** Today's date as `YYYY-MM-DD` in local time. */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Current time as `HH:MM:SS` in local time. */
function nowTimeString(): string {
    return new Date().toTimeString().slice(0, 8);
}

/**
 * Create a new task in the `tasks` table.
 *
 * New tasks start as `pending`, are not the focus task (`is_focus` = false),
 * and are appended to the end of the queue by assigning the next `position`.
 * The `created_at` timestamp is set by the database default.
 */
export async function createTask(input: CreateTaskInput): Promise<void> {
    // Determine the next queue position so the new task is appended without
    // creating a gap or conflicting with existing positions.
    const { data: posRows, error: posError } = await supabase
        .from('tasks')
        .select('position')
        .eq('status', 'pending')
        .not('position', 'is', null);

    if (posError) {
        console.error('Failed to read task positions:', posError.message);
        throw posError;
    }

    const maxPosition = (posRows ?? []).reduce(
        (max, r) => Math.max(max, (r as { position: number }).position),
        0
    );
    const nextPosition = (posRows ?? []).length > 0 ? maxPosition + 1 : 0;

    const { error } = await supabase.from('tasks').insert({
        title: input.title,
        description: input.description,
        cat_id: input.cat_id,
        status: 'pending',
        is_focus: false,
        deadline: input.deadline,
        priority: input.priority,
        position: nextPosition,
    });

    if (error) {
        console.error('Failed to create task:', error.message);
        throw error;
    }
}

/**
 * Create a new daily habit in the `habits` table.
 *
 * `date_created` and `time_created` are set to now, matching the schema.
 */
export async function createHabit(input: CreateHabitInput): Promise<void> {
    const { error } = await supabase.from('habits').insert({
        title: input.title,
        cat_id: input.cat_id,
        date_created: todayDateString(),
        time_created: nowTimeString(),
    });

    if (error) {
        console.error('Failed to create habit:', error.message);
        throw error;
    }
}
