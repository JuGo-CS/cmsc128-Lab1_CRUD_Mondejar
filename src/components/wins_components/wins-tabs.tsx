import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type WinsTab = 'treasures' | 'mosaic';

interface WinsTabsProps {
    activeTab: WinsTab;
    onChangeTab: (tab: WinsTab) => void;
}

// The Treasures / Mosaic toggle at the top of the Wins screen.
// Treasures shows completed task logs; Mosaic (future) will show habit logs.
export default function WinsTabs({ activeTab, onChangeTab }: WinsTabsProps) {
    return (
        <View className="flex-row items-center mt-6">
            <TouchableOpacity
                onPress={() => onChangeTab('treasures')}
                activeOpacity={0.8}
                className={`px-6 py-3 rounded-2xl ${
                    activeTab === 'treasures'
                        ? 'bg-focusHero'
                        : 'bg-transparent'
                }`}
            >
                <Text
                    className={`text-lg font-fredoka-bold ${
                        activeTab === 'treasures' ? 'text-white' : 'text-deepBrown'
                    }`}
                >
                    Treasures
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => onChangeTab('mosaic')}
                activeOpacity={0.8}
                className={`px-6 py-3 rounded-2xl ${
                    activeTab === 'mosaic'
                        ? 'bg-focusHero'
                        : 'bg-transparent'
                }`}
            >
                <Text
                    className={`text-lg font-fredoka-bold ${
                        activeTab === 'mosaic' ? 'text-white' : 'text-deepBrown'
                    }`}
                >
                    Mosaic
                </Text>
            </TouchableOpacity>
        </View>
    );
}
