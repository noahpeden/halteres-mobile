# Halteres Mobile

A native mobile application for iOS and Android built with Expo and React Native.

## Tech Stack

- **Expo SDK 52** - React Native development platform
- **React Native 0.76** - Native mobile framework
- **Expo Router** - File-based routing (like Next.js)
- **NativeWind** - Tailwind CSS for React Native
- **TypeScript** - Type safety
- **Supabase** - Authentication and database
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form + Zod** - Forms and validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- For iOS: macOS with Xcode installed
- For Android: Android Studio installed

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=https://halteres.ai
```

### Running the App

Start the development server:
```bash
npm start
```

Then choose a platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

## Project Structure

```
halteres-mobile/
├── app/                      # Expo Router pages (file-based routing)
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Landing/redirect page
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset.tsx
│   └── (app)/               # Main app screens
│       ├── _layout.tsx      # Tab navigation
│       ├── dashboard.tsx
│       ├── programs/
│       └── settings.tsx
├── components/              # Reusable components
│   ├── ui/                 # Base UI components
│   ├── forms/              # Form components
│   └── providers/          # Context providers
├── lib/                    # Core libraries
│   ├── supabase/          # Supabase client
│   └── api/               # API client
├── hooks/                  # Custom hooks
└── assets/                # Icons, splash screens
```

## Available Scripts

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Check code with Biome
- `npm run format` - Format code with Biome

## Key Features

- **File-based Routing** - Expo Router with Next.js-like app router
- **Authentication** - Supabase auth with secure token storage
- **API Integration** - Connects to halteres.ai backend
- **Offline Support** - TanStack Query caching
- **Native Animations** - React Native Reanimated
- **Type Safety** - Full TypeScript coverage

## Development

### Adding a New Screen

1. Create a file in `/app`:
```tsx
// app/(app)/workouts.tsx
export default function WorkoutsScreen() {
  return <View><Text>Workouts</Text></View>;
}
```

2. It's automatically routed at `/(app)/workouts`

### Adding a New Component

1. Create in `/components/ui`:
```tsx
// components/ui/card.tsx
export function Card({ children }) {
  return <View className="bg-muted p-4 rounded-lg">{children}</View>;
}
```

2. Import and use:
```tsx
import { Card } from "@/components/ui/card";
```

## Styling with NativeWind

Use Tailwind utility classes on React Native components:

```tsx
<View className="flex-1 bg-background p-6">
  <Text className="text-2xl font-bold text-foreground">
    Hello World
  </Text>
  <TouchableOpacity className="bg-primary p-4 rounded-lg">
    <Text className="text-primary-foreground">Press me</Text>
  </TouchableOpacity>
</View>
```

## Documentation

- **CLAUDE.md** - Development commands and architecture
- **docs/init-plan.md** - Complete implementation plan
- **docs/backend-modifications.md** - Backend integration guide

## Building for Production

### Using EAS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login:
```bash
eas login
```

3. Build:
```bash
# Development build
npm run build:dev:ios
npm run build:dev:android

# Production build
npm run build:prod
```

## Next Steps

1. ✅ Set up environment variables
2. ✅ Install dependencies
3. ✅ Start development server
4. 📝 Create app icons in `/assets` (icon.png, splash.png, adaptive-icon.png)
5. 📝 Configure Supabase project
6. 📝 Implement core features following docs/init-plan.md

## Contributing

1. Keep code formatted with Biome (`npm run format`)
2. Check types with TypeScript
3. Follow React Native best practices
4. Use NativeWind for styling

## License

Private - Halteres AI
