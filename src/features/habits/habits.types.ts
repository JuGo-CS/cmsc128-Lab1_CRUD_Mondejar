/** Emoji shown on the left of the habit card. */
export interface HabitData {
    id: string;
    title: string;
    /** Emoji shown on the left of the habit card. */
    emoji: string;
    completed?: boolean;
}