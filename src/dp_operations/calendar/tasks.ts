import { HomeTask } from '@/dp_operations/home/tasks';

/**
 * The Calendar is a filtered view of the global Home task queue. It does NOT
 * own its own ordering or sorting — it only decides which tasks are visible for
 * a selected date and any active filter, preserving the relative order of the
 * global queue.
 */

/** Normalize a deadline value to a `YYYY-MM-DD` date string (first 10 chars). */
function normalizeDate(value: string | null): string | null {
    if (!value) return null;
    const datePart = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

/**
 * Filter the globally ordered task queue to only the tasks applicable to the
 * selected date.
 *
 * A task is shown if it has no deadline (still applicable) or its deadline is
 * on/after the selected date. The relative order of the remaining tasks is
 * preserved — this function never reorders or re-sorts. The Hero Task, if it
 * qualifies, stays at the top (it is already first in the global queue).
 */
export function filterTasksByDate(
    tasks: HomeTask[],
    selectedDate: string
): HomeTask[] {
    return tasks.filter((task) => {
        const deadline = normalizeDate(task.deadline);
        if (!deadline) return true;
        return deadline >= selectedDate;
    });
}

/**
 * The available Calendar filter criteria. These act as filters (which tasks are
 * visible), NOT global ordering — the global Home queue is never modified.
 */
export type CalendarFilterCriteria = 'manual' | 'priority' | 'deadline' | 'category' | 'createdAt';

/**
 * Filter the tasks by the given criterion + value, preserving their relative
 * order. This never reorders the tasks.
 *
 * - 'manual'   → no filter (show all tasks).
 * - 'category' → keep tasks whose category name matches `value`.
 * - 'priority' → keep tasks whose priority matches `value`.
 * - 'deadline' → keep tasks whose deadline is on/after `value` (YYYY-MM-DD).
 * - 'createdAt'→ keep tasks created on/after `value` (YYYY-MM-DD).
 *
 * A missing/null value behaves like 'manual' (no filtering) for that criterion.
 */
export function filterTasks(
    tasks: HomeTask[],
    criteria: CalendarFilterCriteria,
    value: string | null
): HomeTask[] {
    if (!value) return tasks;
    switch (criteria) {
        case 'category':
            return tasks.filter((t) => t.categoryName === value);
        case 'priority':
            return tasks.filter((t) => t.priority === value);
        case 'deadline':
            return tasks.filter((t) => {
                const deadline = normalizeDate(t.deadline);
                return !!deadline && deadline >= value;
            });
        case 'createdAt':
            return tasks.filter((t) => t.createdAt.slice(0, 10) >= value);
        case 'manual':
        default:
            return tasks;
    }
}

