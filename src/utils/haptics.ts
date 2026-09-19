import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Safe wrapper around expo-haptics to ensure smooth execution
 * across both iOS and Android (and non-op on Web if needed).
 */
export const triggerHaptic = {
	/** Light impact - ideal for tab changes, day selections, simple button taps */
	light: () => {
		if (Platform.OS !== 'web') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	},

	/** Medium impact - ideal for toggling checkboxes, opening/closing modals */
	medium: () => {
		if (Platform.OS !== 'web') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		}
	},

	/** Heavy impact - ideal for task completion or major state changes */
	heavy: () => {
		if (Platform.OS !== 'web') {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		}
	},

	/** Success notification - ideal for creating a task or completing a session */
	success: () => {
		if (Platform.OS !== 'web') {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}
	},

	/** Warning/Error notification - ideal for delete prompts or errors */
	warning: () => {
		if (Platform.OS !== 'web') {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		}
	},
};