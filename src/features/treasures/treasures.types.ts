import { Ionicons } from '@expo/vector-icons';

/**
 * A single completed task log ("Treasure") shown in the Wins screen.
 * This is the UI-facing shape — the backend supplies these from the `tasks` table.
 */
export interface TreasureLog {
    id: string;
    title: string;
    description: string | null;
    catId: string | null;
    iconName: keyof typeof Ionicons.glyphMap;
    /** The task's actual status: 'completed' for Wins, 'pending' for Home/Calendar. */
    status: 'completed' | 'pending';
    /** Deadline date as `YYYY-MM-DD`, or null if the task has no deadline. */
    deadline: string | null;
    /** Priority from `tasks.priority`, or null. */
    priority: string | null;
    /** Manual order index, or null. */
    position: number | null;
    /** When the task was created, used for restoring. */
    createdAt: string;
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
 * A task category, used by the edit form to pick a new category.
 */
export interface Category {
    cat_id: string;
    cat_name: string;
    emoji: string;
}

/**
 * The editable fields of a completed task ("Treasure").
 * Used by the edit form and the update operation.
 */
export interface TreasureEditPayload {
    status: 'completed' | 'pending';
    title: string;
    description: string | null;
    cat_id: string | null;
    /** Deadline date as `YYYY-MM-DD`, or null to clear it. */
    deadline: string | null;
}