import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { User } from '@supabase/supabase-js';
import Toast, { ToastData } from '@/components/ui/toast';
import ConfirmModal from '@/components/ui/confirm-modal';
import { updateProfile } from '@/dp_operations/profile/profile';

export default function ProfileScreen() {
    const [fontsLoaded] = useFonts({
        Fredoka_400Regular,
        Fredoka_500Medium,
        Fredoka_600SemiBold,
        Fredoka_700Bold,
    });

    const [user, setUser] = useState<User | null>(null);
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Toast & Modal States
    const [toast, setToast] = useState<ToastData | null>(null);
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    
    const [loadingName, setLoadingName] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingSignOut, setLoadingSignOut] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                if (data?.user) {
                    setUser(data.user);
                    setDisplayNameInput(data.user.user_metadata?.full_name || '');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, []);

    if (!fontsLoaded || !user) {
        return (
            <View className="flex-1 bg-cozyBg justify-center items-center">
                <ActivityIndicator size="large" color="#2C221E" />
                <Text className="mt-3 font-fredoka-medium text-deepBrown">Loading Profile...</Text>
            </View>
        );
    }

    const confirmSignOut = async () => {
        setLoadingSignOut(true);
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            setToast({ message: 'Failed to sign out. Please try again.' });
            setShowSignOutModal(false);
        } finally {
            setLoadingSignOut(false);
        }
    };

    const handleUpdateDisplayName = async () => {
        if (!displayNameInput.trim()) {
            setToast({ message: 'Display name cannot be empty.' });
            return;
        }

        setLoadingName(true);
        try {
            const trimmedName = displayNameInput.trim();

            // Updates both Auth user_metadata AND public.profiles
            const { error } = await updateProfile(user.id, { display_name: trimmedName });
            if (error) throw error;

            setToast({ message: 'Display name updated successfully!' });
            
            // Keep local user metadata state in sync
            setUser(prev => prev ? {
                ...prev,
                user_metadata: { ...prev.user_metadata, display_name: trimmedName, full_name: trimmedName }
            } : null);
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to update display name.' });
        } finally {
            setLoadingName(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            setToast({ message: 'Password must be at least 6 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setToast({ message: 'Passwords do not match.' });
            return;
        }

        setLoadingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setToast({ message: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to update password.' });
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <View className="flex-1 bg-cozyBg">
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 }}>
                <Text className="text-3xl font-fredoka-bold text-deepBrown mb-6">
                    Profile Settings
                </Text>

                {/* Account Info Card */}
                <View className="bg-bgCardBg border border-mutedBrown/20 rounded-2xl p-4 mb-5">
                    <Text className="text-xs font-fredoka-semibold text-mutedBrown uppercase tracking-wider mb-1">
                        Logged In As
                    </Text>
                    <Text className="text-xl font-fredoka-bold text-deepBrown">
                        {user.user_metadata?.full_name || 'No Name Set'}
                    </Text>
                    <Text className="text-sm font-fredoka text-mutedBrown mt-0.5">
                        {user.email}
                    </Text>
                </View>

                {/* Section 1: Display Name */}
                <View className="bg-bgCardBg border border-mutedBrown/20 rounded-2xl p-4 mb-5">
                    <Text className="text-lg font-fredoka-semibold text-deepBrown mb-3">
                        Display Name
                    </Text>

                    <TextInput
                        className="border border-mutedBrown/30 rounded-xl px-3 py-2.5 mb-3 bg-cozyBg font-fredoka text-deepBrown"
                        placeholder="Enter display name"
                        placeholderTextColor="#7D6E6B"
                        value={displayNameInput}
                        onChangeText={setDisplayNameInput}
                    />

                    <TouchableOpacity
                        onPress={handleUpdateDisplayName}
                        disabled={loadingName}
                        className="bg-focusHero rounded-xl py-3 items-center justify-center"
                    >
                        {loadingName ? (
                            <ActivityIndicator color="#FDFBF7" size="small" />
                        ) : (
                            <Text className="font-fredoka-bold text-cozyBg text-sm">Save Display Name</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Section 2: Password */}
                <View className="bg-bgCardBg border border-mutedBrown/20 rounded-2xl p-4 mb-6">
                    <Text className="text-lg font-fredoka-semibold text-deepBrown mb-3">
                        Change Password
                    </Text>

                    <TextInput
                        className="border border-mutedBrown/30 rounded-xl px-3 py-2.5 mb-2.5 bg-cozyBg font-fredoka text-deepBrown"
                        placeholder="New Password (min. 6 characters)"
                        placeholderTextColor="#7D6E6B"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />

                    <TextInput
                        className="border border-mutedBrown/30 rounded-xl px-3 py-2.5 mb-3 bg-cozyBg font-fredoka text-deepBrown"
                        placeholder="Confirm New Password"
                        placeholderTextColor="#7D6E6B"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        onPress={handleUpdatePassword}
                        disabled={loadingPassword}
                        className="bg-focusHero rounded-xl py-3 items-center justify-center"
                    >
                        {loadingPassword ? (
                            <ActivityIndicator color="#FDFBF7" size="small" />
                        ) : (
                            <Text className="font-fredoka-bold text-cozyBg text-sm">Update Password</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Section 3: Sign Out Trigger */}
                <TouchableOpacity
                    onPress={() => setShowSignOutModal(true)}
                    className="bg-highPriority border border-mutedBrown/30 rounded-xl py-3.5 items-center justify-center mb-6"
                >
                    <Text className="font-fredoka-bold text-deepBrown text-sm">Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Confirm Sign Out Modal */}
            <ConfirmModal
                visible={showSignOutModal}
                title="Sign Out?"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                cancelText="Cancel"
                loading={loadingSignOut}
                onConfirm={confirmSignOut}
                onCancel={() => setShowSignOutModal(false)}
            />

            {/* Built-in Toast Floating Notification */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
        </View>
    );
}