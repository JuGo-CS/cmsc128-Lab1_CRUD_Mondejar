import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeSortCriteria } from '@/dp_operations/home/tasks';

// Storage key for the persisted sort preference. This is a client-side UI
// preference, so AsyncStorage (already used in the app) is the right place.
export const SORT_CRITERIA_KEY = 'unti-unti:home-sort-criteria';

// The valid sort criteria, used to validate a value loaded from storage.
// 'manual' (the default position order) is included so it survives a reload.
const SORT_CRITERIA_VALUES: HomeSortCriteria[] = ['manual', 'priority', 'deadline', 'category', 'createdAt'];

/** Safely coerce an unknown stored value into a valid sort criterion. */
export function parseSortCriteria(value: unknown): HomeSortCriteria {
    return SORT_CRITERIA_VALUES.includes(value as HomeSortCriteria)
        ? (value as HomeSortCriteria)
        : 'manual';
}

/** Read the persisted Home sort criterion (defaults to 'manual'). */
export async function getHomeSortCriteria(): Promise<HomeSortCriteria> {
    try {
        const stored = await AsyncStorage.getItem(SORT_CRITERIA_KEY);
        if (stored) return parseSortCriteria(stored);
    } catch (err) {
        console.error('Failed to load sort preference:', err);
    }
    return 'manual';
}

/** Persist the Home sort criterion. */
export async function setHomeSortCriteria(criteria: HomeSortCriteria): Promise<void> {
    try {
        await AsyncStorage.setItem(SORT_CRITERIA_KEY, criteria);
    } catch (err) {
        console.error('Failed to save sort preference:', err);
    }
}
