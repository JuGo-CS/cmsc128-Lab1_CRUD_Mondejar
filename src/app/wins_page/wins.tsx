import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { subscribeToTaskChanges, emitTaskDataChanged } from '@/lib/data-events';
import WinsTabs, { WinsTab } from '@/components/wins_components/wins-tabs';
import TreasureDateSection from '@/components/wins_components/treasure-date-section';
import WinsCalendarModal from '@/components/wins_components/wins-calendar-modal';
import EditTreasureModal from '@/components/wins_components/edit-treasure-modal';
import DeleteTreasureModal from '@/components/wins_components/delete-treasure-modal';
import Toast, { ToastData } from '@/components/ui/toast';
import { fetchTreasureGroups, TreasureGroup, TreasureLog, deleteTreasure, fetchCategories, updateTreasure, restoreTreasure, Category } from '@/dp_operations/wins/treasures';
import { restoreTaskSnapshot, TaskSnapshot } from '@/dp_operations/home/tasks';

// Placeholder treasure groups used when the database fetch hasn't loaded yet.
// Replace with real data once the backend is fully wired.
const PLACEHOLDER_GROUPS: TreasureGroup[] = [
    {
        date: '2026-09-09',
        label: 'September 9, 2026',
        logs: [
            { 
                id: 't-1', 
                title: 'Finish wireframes for Unti-Unti', 
                description: null, 
                catId: null, 
                iconName: 'school', 
                completedDate: '2026-09-09', 
                completedTime: '14:30:00',
                status: 'completed',
                deadline: null,
                priority: 'medium',
                position: 0,
                createdAt: '2026-09-01T00:00:00.000Z',
            },
            { 
                id: 't-2', 
                title: 'Finish wireframes for Unti-Unti', 
                description: null, 
                catId: null, 
                iconName: 'school', 
                completedDate: '2026-09-09', 
                completedTime: '14:30:00',
                status: 'completed',
                deadline: null,
                priority: 'medium',
                position: 1,
                createdAt: '2026-09-01T00:00:00.000Z',
            },
            { 
                id: 't-3', 
                title: 'Finish wireframes for Unti-Unti', 
                description: null, 
                catId: null, 
                iconName: 'school', 
                completedDate: '2026-09-09', 
                completedTime: '14:30:00',
                status: 'completed',
                deadline: null,
                priority: 'medium',
                position: 2,
                createdAt: '2026-09-01T00:00:00.000Z',
            },
        ],
    },
    {
        date: '2026-09-08',
        label: 'September 8, 2026',
        logs: [
            { 
                id: 't-4', 
                title: 'Finish wireframes for Unti-Unti', 
                description: null, 
                catId: null, 
                iconName: 'school', 
                completedDate: '2026-09-08', 
                completedTime: '14:30:00',
                status: 'completed',
                deadline: null,
                priority: 'medium',
                position: 0,
                createdAt: '2026-09-01T00:00:00.000Z',
            },
            { 
                id: 't-5', 
                title: 'Finish wireframes for Unti-Unti', 
                description: null, 
                catId: null, 
                iconName: 'school', 
                completedDate: '2026-09-08', 
                completedTime: '14:30:00',
                status: 'completed',
                deadline: null,
                priority: 'medium',
                position: 1,
                createdAt: '2026-09-01T00:00:00.000Z',
            },
        ],
    },
];

/** Today's date as `YYYY-MM-DD` in local time. */
function todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function WinsScreen() {
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    const [activeTab, setActiveTab] = useState<WinsTab>('treasures');
    const [groups, setGroups] = useState<TreasureGroup[]>(PLACEHOLDER_GROUPS);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(todayDateString());

    // Edit modal state.
    const [editingLog, setEditingLog] = useState<TreasureLog | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);

    // Delete confirmation modal state.
    const [deletingLog, setDeletingLog] = useState<TreasureLog | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Success toast feedback for edit/delete actions.
    const [toast, setToast] = useState<ToastData | null>(null);

    // Ref to the scrollable logbook + a map of each date group's y-offset.
    const scrollRef = useRef<ScrollView>(null);
    const dateOffsets = useRef<Record<string, number>>({});

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    // Refetch the completed task logs (Treasures) + categories from Supabase.
    // Used on focus, on pull-to-refresh, and when task data changes elsewhere.
    const refresh = useCallback(() => {
        return Promise.all([
            fetchTreasureGroups().then((data) => {
                setGroups(data);
            }),
            fetchCategories().then((data) => {
                setCategories(data);
            }),
        ])
            .catch((err) => {
                console.error('Failed to load treasures:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Refetch whenever the screen gains focus so newly completed tasks appear.
    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    // Refetch whenever another screen mutates task data, so Wins stays in sync.
    useEffect(() => {
        const unsubscribe = subscribeToTaskChanges(() => {
            refresh();
        });
        return unsubscribe;
    }, [refresh]);

    // Handle editing a treasure's title.
    const handleEditLog = (log: TreasureLog) => {
        setEditingLog(log);
        setEditModalVisible(true);
    };

    // Handle confirming the edited treasure, then refresh the logbook.
    const handleConfirmEdit = (payload: {
        status: 'completed' | 'pending';
        title: string;
        description: string | null;
        cat_id: string | null;
        deadline: string | null;
    }) => {
        if (!editingLog) return;
        // Capture the task's full state before the edit so Undo can restore it.
        const snapshot: TaskSnapshot = {
            id: editingLog.id,
            title: editingLog.title,
            description: editingLog.description,
            catId: editingLog.catId,
            priority: editingLog.priority,
            deadline: editingLog.deadline,
            status: editingLog.status,
            isFocus: false,
            position: editingLog.position,
            completedDate: editingLog.completedDate || null,
            completedTime: editingLog.completedTime || null,
            createdAt: editingLog.createdAt,
        };
        setSaving(true);
        updateTreasure(editingLog.id, payload)
            .then(() => {
                setEditModalVisible(false);
                setEditingLog(null);
                setToast({
                    message: 'Treasure updated!',
                    undoLabel: 'Undo',
                    onUndo: () => {
                        restoreTaskSnapshot(snapshot)
                            .then(() => fetchTreasureGroups())
                            .then((data) => {
                                setGroups(data);
                                setToast({ message: 'Treasure restored.' });
                                emitTaskDataChanged();
                            })
                            .catch((err) => {
                                console.error('Failed to undo treasure edit:', err);
                                setToast({ message: 'Could not undo. Please try again.' });
                            });
                    },
                });
                // Refresh the logbook so changes are immediately reflected.
                return fetchTreasureGroups().then((data) => {
                    setGroups(data);
                    emitTaskDataChanged();
                });
            })
            .catch((err) => {
                console.error('Failed to update treasure:', err);
            })
            .finally(() => {
                setSaving(false);
            });
    };

    // Handle tapping Delete — open the confirmation dialog (does not delete yet).
    const handleDeleteLog = (log: TreasureLog) => {
        setDeletingLog(log);
        setDeleteModalVisible(true);
    };

    // Handle confirming the permanent deletion. Only deletes after confirmation.
    const handleConfirmDelete = (log: TreasureLog) => {
        setDeleting(true);
        deleteTreasure(log.id)
            .then(() => {
                // Remove the task from the Treasures UI immediately.
                setGroups((prev) =>
                    prev
                        .map((group) => ({
                            ...group,
                            logs: group.logs.filter((l) => l.id !== log.id),
                        }))
                        .filter((group) => group.logs.length > 0)
                );
                setDeleteModalVisible(false);
                setDeletingLog(null);
                setToast({
                    message: 'Treasure deleted.',
                    undoLabel: 'Undo',
                    onUndo: () => {
                        restoreTreasure(log)
                            .then(() => fetchTreasureGroups())
                            .then((data) => {
                                setGroups(data);
                                setToast({ message: 'Treasure restored.' });
                                emitTaskDataChanged();
                            })
                            .catch((err) => {
                                console.error('Failed to undo treasure deletion:', err);
                                setToast({ message: 'Could not undo. Please try again.' });
                            });
                    },
                });
                emitTaskDataChanged();
            })
            .catch((err) => {
                // Keep the task visible on failure; the user can retry.
                console.error('Failed to delete treasure:', err);
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    // Jump the logbook to the selected date. Does NOT filter — the whole
    // logbook stays scrollable so the user can continue browsing nearby days.
    const handleSelectDate = (date: string) => {
        setSelectedDate(date);
        const y = dateOffsets.current[date];
        if (y != null) {
            scrollRef.current?.scrollTo({ y, animated: true });
        }
    };

    // Pull-to-refresh: refetch treasures, guarding against duplicate runs.
    const handleRefresh = useCallback(() => {
        if (refreshing) return;
        setRefreshing(true);
        refresh().finally(() => {
            setRefreshing(false);
        });
    }, [refreshing, refresh]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View className="flex-1 bg-cozyBg pt-14 px-5">
            {/* Header row with "Wins" title and sun icon */}
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                    <Text className="text-4xl font-fredoka-semibold font-bold text-deepBrown mt-2 leading-tight">
                        Wins
                    </Text>
                </View>
                <Ionicons name="sunny" size={80} color="#F4C542" style={{ marginTop: -22 }} />
            </View>
            <View className="h-[2px] bg-deepBrown mr-28 -mt-2" />

            {/* Treasures / Mosaic toggle */}
            <WinsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

            {/* Single calendar icon at the top of the Treasures section */}
            {activeTab === 'treasures' && (
                <View className="flex-row items-center justify-end mt-4">
                    <TouchableOpacity
                        onPress={() => setCalendarVisible(true)}
                        activeOpacity={0.7}
                        className="p-2"
                    >
                        <Ionicons name="calendar-outline" size={24} color="#7D6E6B" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Scrollable logbook content */}
            <ScrollView
                ref={scrollRef}
                className="flex-1 mt-2"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6B8E70" />
                }
            >
                {activeTab === 'treasures' ? (
                    loading ? (
                        <Text className="text-base font-fredoka text-mutedBrown">
                            Loading your treasures...
                        </Text>
                    ) : groups.length === 0 ? (
                        <Text className="text-base font-fredoka text-mutedBrown">
                            No treasures yet. Complete a task to see it here!
                        </Text>
                    ) : (
                        groups.map((group) => (
                            <View
                                key={group.date}
                                onLayout={(e) => {
                                    dateOffsets.current[group.date] = e.nativeEvent.layout.y;
                                }}
                            >
                                <TreasureDateSection
                                    group={group}
                                    onEditLog={handleEditLog}
                                    onDeleteLog={handleDeleteLog}
                                />
                            </View>
                        ))
                    )
                ) : (
                    // Mosaic section — will display Daily Habit completion logs later.
                    <Text className="text-base font-fredoka text-mutedBrown">
                        Mosaic is coming soon!
                    </Text>
                )}
            </ScrollView>

            {/* Calendar modal */}
            <WinsCalendarModal
                visible={calendarVisible}
                onClose={() => setCalendarVisible(false)}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
            />

            {/* Edit treasure modal */}
            <EditTreasureModal
                visible={editModalVisible}
                log={editingLog}
                categories={categories}
                onClose={() => {
                    setEditModalVisible(false);
                    setEditingLog(null);
                }}
                onConfirm={handleConfirmEdit}
                saving={saving}
            />

            {/* Delete confirmation modal */}
            <DeleteTreasureModal
                visible={deleteModalVisible}
                log={deletingLog}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setDeletingLog(null);
                }}
                onConfirmDelete={handleConfirmDelete}
                deleting={deleting}
            />

            {/* Success toast for edit/delete actions. */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </View>
    );
}