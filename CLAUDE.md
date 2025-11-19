# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator (requires Android Studio)
- `npm run ios` - Run on iOS simulator (requires Xcode, macOS only)
- `npm run lint` - Run Biome linter to check code quality
- `npm run format` - Format code using Biome formatter

### Development Workflow
To start development:
1. Run `npm install` to install dependencies
2. Create a `.env` file based on `.env.example` with your Supabase credentials
3. Run `npm start` to start the Expo dev server
4. Press `i` for iOS simulator, `a` for Android emulator, or scan QR code with Expo Go app

### Build Commands (EAS Build)
- `npm run build:dev:ios` - Build development iOS app
- `npm run build:dev:android` - Build development Android app
- `npm run build:preview:ios` - Build preview iOS app for testing
- `npm run build:preview:android` - Build preview Android app for testing
- `npm run build:prod` - Build production apps for both platforms

## Architecture Overview

### Technology Stack
- **Framework**: Expo SDK 52 with React Native 0.76
- **Routing**: Expo Router (file-based routing, similar to Next.js App Router)
- **UI**: React Native with NativeWind (Tailwind CSS for React Native)
- **Styling**: Tailwind CSS v3 via NativeWind
- **Backend**: Supabase for authentication and database
- **State Management**:
  - Zustand for global/UI state
  - TanStack Query (React Query) for server state and caching
- **Forms**: React Hook Form with Zod validation
- **Animation**: React Native Reanimated for native 60fps animations
- **Icons**: Lucide React Native
- **Code Quality**: Biome for linting and formatting

### Project Structure
- `/app` - Expo Router pages and layouts (file-based routing)
  - `_layout.tsx` - Root layout with providers
  - `index.tsx` - Landing page with auth redirect
  - `(auth)/` - Auth group (login, signup, reset)
  - `(app)/` - Main app group with bottom tab navigation
  - `+not-found.tsx` - 404 screen
- `/components` - Reusable React Native components
  - `/ui` - Base UI components (Button, Input, Card, etc.)
  - `/forms` - Form components with React Hook Form
  - `/providers` - Context providers (Auth, Query)
- `/lib` - Core libraries and utilities
  - `/supabase` - Supabase client and auth helpers
  - `/api` - API client for halteres.ai backend
- `/hooks` - Custom React hooks
- `/assets` - App icons, splash screens, and images
- TypeScript path alias: `@/*` maps to project root

### Configuration Files
- **app.json**: Expo app configuration (app name, bundle IDs, permissions, plugins)
- **babel.config.js**: Babel config for Expo, NativeWind, and Reanimated
- **metro.config.js**: Metro bundler config with NativeWind integration
- **tailwind.config.js**: Tailwind CSS v3 configuration for NativeWind
- **global.css**: Global NativeWind/Tailwind styles
- **tsconfig.json**: TypeScript config extending Expo's base config
- **nativewind-env.d.ts**: TypeScript types for NativeWind

## Key Development Notes

### Expo Router (File-based Routing)
- Uses file-based routing like Next.js App Router
- `(auth)` and `(app)` are route groups (parentheses don't appear in URL)
- `_layout.tsx` files define layouts for nested routes
- `[id].tsx` creates dynamic routes (e.g., `/programs/[id]`)
- `+not-found.tsx` handles 404 errors

### NativeWind (Tailwind for React Native)
- Use Tailwind utility classes with `className` prop on React Native components
- Most Tailwind utilities work, but some CSS-only features don't translate
- Use `View`, `Text`, `ScrollView` instead of `div`, `span`, `section`
- Flexbox is default layout (no need for `flex` class)
- Colors defined in tailwind.config.js match the app theme

### React Native Best Practices
- Use `View` for containers, `Text` for text (required in RN)
- Use `TouchableOpacity` or `Pressable` for touchable elements
- Use `ScrollView` or `FlatList` for scrollable content
- Import from `react-native` not `react-dom`
- Platform-specific code: `Platform.OS === 'ios'` or `Platform.OS === 'android'`
- Safe areas: Use `SafeAreaView` from `react-native-safe-area-context`

### Authentication Flow
- Supabase auth with Expo SecureStore for token persistence
- Auth state managed by AuthProvider context
- `app/index.tsx` redirects based on auth state:
  - Logged in → `/(app)/dashboard`
  - Logged out → `/(auth)/login`

### API Integration
- API client in `lib/api/client.ts` calls halteres.ai backend
- Uses bearer token authentication (Supabase access token)
- TanStack Query hooks in `/hooks` for data fetching

### State Management
- TanStack Query: Server state, caching, background refetching
- Zustand: Client state (UI state, user preferences)
- Auth: Context API via AuthProvider

### Development Tools
- Biome instead of ESLint/Prettier for faster linting and formatting
- React Query DevTools available in development builds
- Expo dev tools accessible via dev server

## Environment Variables

Required environment variables (create `.env` file):
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=https://halteres.ai
```

## Common Tasks

### Adding a New Screen
1. Create file in `/app` directory (e.g., `app/(app)/workouts.tsx`)
2. Export default component
3. Add to tab navigator if needed in `app/(app)/_layout.tsx`

### Adding a New Component
1. Create in `/components/ui` or appropriate subdirectory
2. Use NativeWind classes for styling
3. Export and use in screens

### Adding a New API Hook
1. Create in `/hooks` directory (e.g., `useWorkouts.ts`)
2. Use TanStack Query's `useQuery` or `useMutation`
3. Call API client methods from `lib/api/client.ts`

### Running on Physical Device
1. Install Expo Go app on your device
2. Run `npm start`
3. Scan QR code with camera (iOS) or Expo Go app (Android)
4. Make sure device and computer are on same network

## Troubleshooting

- **Metro bundler issues**: Clear cache with `npx expo start -c`
- **Module not found**: Run `npm install` and restart dev server
- **iOS simulator not opening**: Ensure Xcode is installed and simulators are available
- **Android emulator issues**: Ensure Android Studio is installed and emulator is running
- **NativeWind styles not working**: Check metro.config.js and babel.config.js are correctly configured

## Platform-Specific Notes

### iOS (macOS only)
- Requires Xcode installed
- Simulators available via Xcode
- Can also run on physical device via Expo Go

### Android
- Requires Android Studio installed
- Create and run emulator via Android Studio AVD Manager
- Can also run on physical device via Expo Go or USB debugging

## Next Steps

1. Set up environment variables (.env file)
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Create app icons and splash screens in `/assets`
5. Configure Supabase backend connection
6. Begin implementing features based on docs/init-plan.md
