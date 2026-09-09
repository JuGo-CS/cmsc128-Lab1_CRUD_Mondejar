/**
 * A tiny, dependency-free pub/sub used to keep screens in sync after task
 * mutations (complete, edit, delete, hero change, reorder).
 *
 * Supabase is the source of truth. When a mutation succeeds, the mutating
 * screen emits `taskDataChanged`; any screen subscribed to it refetches its
 * relevant data so the whole app reflects the latest state without a manual
 * refresh. This avoids a state-management library while keeping a single
 * consistent invalidation point.
 */

type Listener = () => void;

const taskListeners = new Set<Listener>();

/**
 * Subscribe to task-data changes. Returns an unsubscribe function.
 * Callers should pass a stable (memoized) listener.
 */
export function subscribeToTaskChanges(listener: Listener): () => void {
    taskListeners.add(listener);
    return () => {
        taskListeners.delete(listener);
    };
}

/** Notify all subscribers that task data may have changed. */
export function emitTaskDataChanged(): void {
    taskListeners.forEach((listener) => {
        try {
            listener();
        } catch (err) {
            console.error('Task change listener threw:', err);
        }
    });
}
