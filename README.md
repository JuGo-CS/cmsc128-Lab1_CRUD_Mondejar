# Unti-Unti

A cozy, step-by-step habit & goal tracker built with React Native and Expo. Track your progress, build better habits, and watch your growth unfold—one gentle step at a time.

---

## App Overview

Unti-Unti is a mobile application designed to help users cultivate positive habits and achieve personal goals through a warm, encouraging interface. Built with React Native and Expo, it combines intuitive habit tracking with a soothing aesthetic inspired by nature and mindfulness practices. The app focuses on making progress feel achievable and enjoyable, turning daily actions into meaningful steps toward long-term aspirations.

---

## Tech Stack

| Category           | Technology                                                                 |
|--------------------|----------------------------------------------------------------------------|
| **Framework**      | React Native (Expo Router v3)                                              |
| **Styling**        | NativeWind v4 / Tailwind CSS (Fredoka font theme, cozy color palette)      |
| **Backend & Auth** | Supabase (Authentication & PostgreSQL Database)                            |
| **State Management**| React Context & Local State                                                |
| **Database**       | PostgreSQL (via Supabase)                                                  |

---

## Authentication System

Unti-Unti implements a secure authentication system using Supabase Auth with the following features:

### Core Authentication Flows
- **Email & Password Sign Up**: Users create accounts with email validation and secure password storage
- **Email & Password Sign In**: Secure login with session management via JWT tokens
- _**Password Recovery**:  To be implemented_
  - OTP-based recovery flow (6-digit code sent to email)
  - User enters OTP in app to verify identity
  - Upon verification, user can set new password
  - Automatic sign-out after password reset for security
- **Session Management**:
  - Server-side sessions managed by Supabase
  - Client stores session refresh token securely
  - Automatic token refresh when needed
  - Session persistence across app restarts
  - Sign-out clears all session data

### Profile Management
- **Display Name Updates**: Changes synchronized between Supabase Auth `user_metadata` and custom `profiles` table
- **Password Updates**: Secure password change requiring current password verification
- **Real-time Synchronization**: Profile updates reflected immediately across auth and database layers

### Example Authentication Operations
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password123',
  options: {
    data: { display_name: 'User Name' }
  }
});

// Sign in  
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password123'
});

// Password reset request (sends OTP)
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com');

// OTP verification
const { error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'recovery'
});

// Password update (after OTP verification)
const { error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
});

// Sign out
await supabase.auth.signOut();
```

---

## Database Schema

While Supabase manages the auth system automatically, Unti-Unti extends functionality with a custom `profiles` table:

```sql
-- profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable real-time subscriptions
alter publication supabase_realtime add table profiles;
```

**Note**: No manual migrations or seeding required - Supabase handles auth schema automatically, and the profiles table is created on first app launch if needed.

---

## Key Features Implemented

### Authentication
- **Email & Password Sign Up**: Secure account creation with validation
- **Email & Password Sign In**: Seamless login experience with session persistence
- **Password Recovery**: _To be implemented_
- **Profile Management**: 
  - Update display name (synced across Supabase Auth `user_metadata` and `profiles` table)
  - Secure password update functionality
  - Real-time synchronization between client and server

### 🎨 Cozy Design System
- **Typography**: Custom Fredoka font throughout for friendly, approachable feel
- **Color Theme**: 
  - `bg-cozyBg` - Warm, inviting background
  - `text-deepBrown` - Rich, readable text
  - `bg-focusHero` - Vibrant accent for primary actions
- **Spacing & Rhythm**: Consistent, comfortable layout based on 4px grid
- **Interactive Feedback**: Subtle press animations and loading states

### 📱 Core Functionality
- Habit creation with customizable frequency (daily, weekly, etc.)
- Progress tracking with visual streaks and completion rates
- Goal setting with milestone tracking
- Gentle reminders and notifications (Expo Notifications)
- Data persistence via Supabase (online-first with optimistic updates)
- Offline capability with automatic sync on reconnect

---

## 🛠️ Local Setup & Getting Started

Follow these steps to get Unti-Unti running on your local machine:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- A [Supabase](https://supabase.io/) project (free tier available)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/unti-unti.git
cd unti-unti

# Install dependencies
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 🔑 **Finding your Supabase keys**:
> 1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
> 2. Select your project
> 3. Navigate to **Settings → API**
> 4. Copy the **Project URL** and **anon public** key

### 4. Database Setup (Supabase)

### 5. Running the App

### 6. Common Development Commands

```bash
# Run tests (if configured)
npm test

# Lint code
npm run lint

# Format code
npm run format

# Clear Expo cache (if needed)
npx expo start -c
```

---

## 📱 Supported Platforms

- **iOS**: 13.0+
- **Android**: 6.0+ (API 23+)

---

## 🤝 Contributing

We welcome contributions to make Unti-Unti even better! Please:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and submission process.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the incredible development platform
- [Supabase](https://supabase.io/) for the open-source Firebase alternative
- [NativeWind](https://www.nativewind.dev/) for Tailwind CSS in React Native
- [Fredoka Font](https://fonts.google.com/specimen/Fredoka) for the cheerful typography
- All contributors and users who help make Unti-Unti better

---

> **Note**: This app is developed as part of CMSC 128 at University of the Philippines Visayas.  
> Built with care by Kenneth Modejar 

--- 

*Last updated: September 2026*  
*Version: 1.0.0*