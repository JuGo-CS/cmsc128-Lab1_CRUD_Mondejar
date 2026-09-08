/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,jsx,ts,tsx}",
        "./src/components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                fredoka: ['Fredoka', 'Quicksand', 'Varela Round', 'sans-serif'],
            },
            colors: {
                // Core Palette & Backgrounds
                cozyBg: '#FDFBF7',
                deepBrown: '#2C221E',
                mutedBrown: '#7D6E6B',

                // Hero & Main Features
                focusHero: '#6B8E70',
                taskStack: '#E8C5B5',
                habitCard: '#E2EBE2',
                habitBackground: '#F4EAE1',

                // Navigation Tones
                tabBarBg: '#FAF6EE',
                fabPinkBg: '#E8C5B5',

                // Priority & Metadata Tones
                highPriority: '#F4C5B5',
                mediumPriority: '#F3E1B9',
                lowPriority: '#C3E2DD',
                deadlineBadge: '#D6E2E9',
                timeBadge: '#E1D5E7',
            },
        },
    },
    plugins: [],
};