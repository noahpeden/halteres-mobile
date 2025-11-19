# Fresh Expo + React Native Mobile App - Complete Implementation Plan

## Project Overview

Build a native mobile application using Expo, React Native, and modern React tooling that shares the Supabase backend with your existing web app. This is a pure mobile app optimized for iOS and Android with file-based routing similar to Next.js.

## Tech Stack

### Core Framework

- **Expo SDK 52** - Modern React Native development platform
- **React Native 0.76** - Native mobile framework
- **Expo Router** - File-based routing (similar to Next.js App Router)
- **TypeScript** - Type safety throughout
- **NativeWind** - Tailwind CSS for React Native

### UI & Animation

- **NativeWind** - Tailwind CSS utility classes for React Native
- **Lucide React Native** - Beautiful, consistent icon library
- **React Native Reanimated** - Smooth native animations and gestures
- **React Native Gesture Handler** - Native touch & gesture system

### Data & State Management

- **TanStack Query** - Server state management with caching
- **Zustand** - Client state (user, UI state)
- **Supabase JS Client** - Direct client SDK with Expo SecureStore

### Forms & Validation

- **React Hook Form** - Performant forms
- **Zod** - Schema validation
- **Custom hooks** - Form state management

### Native Features

- **Expo Modules** - Camera, ImagePicker, SecureStore, Notifications
- **Expo SecureStore** - Secure token storage
- **Expo Linking** - Deep linking support
- **Expo Constants** - App configuration

## Project Structure

```
halteres-mobile/
├── app/
│   ├── _layout.tsx                # Root layout with providers
│   ├── index.tsx                  # Landing/redirect page
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth group layout
│   │   ├── login.tsx             # Login screen
│   │   ├── signup.tsx            # Signup screen
│   │   └── reset.tsx             # Password reset
│   ├── (app)/
│   │   ├── _layout.tsx           # App layout with tabs
│   │   ├── dashboard.tsx         # Main dashboard
│   │   ├── programs/
│   │   │   ├── index.tsx         # Programs list
│   │   │   └── [id].tsx          # Program detail
│   │   └── settings.tsx          # User settings
│   └── +not-found.tsx            # 404 screen
├── components/
│   ├── ui/                       # React Native UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── forms/
│   │   ├── LoginForm.tsx        # React Hook Form + Zod
│   │   ├── ProgramForm.tsx
│   │   └── WorkoutForm.tsx
│   ├── mobile/
│   │   ├── TabBar.tsx           # Custom tab navigation
│   │   ├── PullToRefresh.tsx    # Reanimated gesture
│   │   └── SwipeableCard.tsx    # Reanimated gesture
│   └── providers/
│       ├── QueryProvider.tsx     # TanStack Query
│       └── AuthProvider.tsx      # Auth context
├── lib/
│   ├── api/
│   │   ├── client.ts             # API client with auth
│   │   ├── programs.ts           # Program endpoints
│   │   ├── workouts.ts           # Workout endpoints
│   │   └── ai.ts                 # AI generation endpoints
│   ├── supabase/
│   │   ├── client.ts             # Supabase client setup
│   │   └── auth.ts               # Auth helpers
│   ├── validations/
│   │   ├── workout.schema.ts     # Zod schemas
│   │   ├── program.schema.ts
│   │   └── auth.schema.ts
│   └── utils/
│       └── platform.ts           # Platform detection helpers
├── hooks/
│   ├── useAuth.ts                # Auth hook
│   ├── usePrograms.ts            # TanStack Query hooks
│   ├── useWorkouts.ts
│   └── useMobileGestures.ts      # Reanimated gestures
├── assets/
│   ├── icon.png                  # App icon (1024x1024)
│   ├── splash.png                # Splash screen
│   └── adaptive-icon.png         # Android adaptive icon
├── app.json                       # Expo configuration
├── babel.config.js                # Babel config (NativeWind, Reanimated)
├── metro.config.js                # Metro bundler config
├── tailwind.config.js             # Tailwind CSS v3 config
├── global.css                     # Global NativeWind styles
├── nativewind-env.d.ts           # NativeWind types
├── tsconfig.json                  # TypeScript config
└── package.json
```

## Phase 1: Project Setup & Core Architecture (Week 1)

### Day 1-2: Initialize Project

```bash
# Create Expo app with TypeScript
npx create-expo-app@latest halteres-mobile --template blank-typescript

cd halteres-mobile

# Install core dependencies
npx expo install expo-router expo-constants expo-linking expo-status-bar
npx expo install react-native-safe-area-context react-native-screens
npx expo install react-native-gesture-handler react-native-reanimated
npx expo install expo-secure-store

# Install state management & data fetching
npm install @tanstack/react-query zustand
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# Install forms & validation
npm install react-hook-form @hookform/resolvers zod

# Install NativeWind
npm install nativewind
npm install --save-dev tailwindcss@3
```

### Day 2-3: Configure Expo Router & NativeWind

```javascript
// app.json
{
  "expo": {
    "name": "Halteres",
    "slug": "halteres-mobile",
    "scheme": "halteres",
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}

// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "nativewind/babel",
      "react-native-reanimated/plugin",
    ],
  };
};

// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });

// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#020817',
        foreground: '#f8fafc',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        // ... rest of color scheme
      },
    },
  },
};
```

### Day 3-4: Setup Providers & Routing

```typescript
// app/_layout.tsx
import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

// app/index.tsx - Smart redirect based on auth
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  return user ? <Redirect href="/(app)/dashboard" /> : <Redirect href="/(auth)/login" />;
}
```

## Phase 2: Authentication & API Integration (Week 2)

### Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Auth Provider with Context

```typescript
// components/providers/AuthProvider.tsx
import { createContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>(/* ... */);

export function AuthProvider({ children }) {
  // Auth state management
  // Listen to auth state changes
  // Expose sign in/up/out methods
}
```

### API Client with Bearer Auth

```typescript
// lib/api/client.ts
import { supabase } from "@/lib/supabase/client";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://halteres.ai";

export class ApiClient {
  private async getAuthHeader(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No authentication token");
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeader();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### Auth Forms with React Hook Form + Zod

```typescript
// components/forms/LoginForm.tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    await signIn(data.email, data.password);
  };

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email"
            placeholder="email@example.com"
            {...field}
            error={errors.email?.message}
          />
        )}
      />
      <Button onPress={handleSubmit(onSubmit)}>Sign In</Button>
    </View>
  );
}
```

## Phase 3: Core Features with TanStack Query (Week 3)

### TanStack Query Hooks

```typescript
// hooks/usePrograms.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: () => apiClient.get("/api/programs"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => apiClient.get(`/api/programs/${id}`),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProgramInput) => apiClient.post("/api/programs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useGenerateWorkout() {
  return useMutation({
    mutationFn: (params: WorkoutParams) =>
      apiClient.post("/api/generate-program-anthropic", params),
    retry: 1,
  });
}
```

### Mobile-Optimized Components with Reanimated

```typescript
// components/mobile/PullToRefresh.tsx
import { useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";

export function PullToRefresh({
  onRefresh,
  children
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateY.value = Math.max(0, event.translationY);
    },
    onEnd: () => {
      if (translateY.value > 80) {
        runOnJS(handleRefresh)();
      }
      translateY.value = withSpring(0);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
}
```

## Phase 4: Native Features & Platform Integration (Week 4)

### Expo Configuration

```json
// app.json
{
  "expo": {
    "name": "Halteres",
    "slug": "halteres-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "halteres",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.halteres.mobile"
    },
    "android": {
      "package": "com.halteres.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#020817"
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Halteres to access your photos to upload workout images."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Halteres to access your camera to capture workout images."
        }
      ]
    ]
  }
}
```

### File Upload with Expo

```typescript
// hooks/useFileUpload.ts
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export function useWorkoutUpload() {
  return useMutation({
    mutationFn: async (type: "camera" | "gallery" | "file") => {
      let fileData: string;

      if (type === "camera") {
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.9,
          base64: true,
          allowsEditing: false,
        });
        if (!result.canceled) {
          fileData = result.assets[0].base64!;
        }
      } else if (type === "gallery") {
        const result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.9,
          base64: true,
        });
        if (!result.canceled) {
          fileData = result.assets[0].base64!;
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "application/vnd.ms-excel"],
        });
        // Handle document
      }

      // Upload to API
      return apiClient.post("/api/upload-workout", {
        file: fileData,
        type,
      });
    },
  });
}
```

### Push Notifications with Expo

```typescript
// lib/native/push-notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiClient } from "@/lib/api/client";

export async function initializePushNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status === "granted") {
    const token = await Notifications.getExpoPushTokenAsync();

    // Send token to backend
    await apiClient.post("/api/device-tokens", {
      token: token.data,
      platform: Platform.OS,
    });
  }

  // Handle notifications
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("Push received:", notification);
  });
}
```

## Phase 5: Build & Deployment (Week 5)

### EAS Build Configuration

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure
```

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "buildType": "archive"
      }
    }
  }
}
```

### Build Scripts

```json
// package.json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "biome check",
    "format": "biome format --write",
    "build:dev:ios": "eas build --profile development --platform ios",
    "build:dev:android": "eas build --profile development --platform android",
    "build:preview:ios": "eas build --profile preview --platform ios",
    "build:preview:android": "eas build --profile preview --platform android",
    "build:prod": "eas build --platform all"
  }
}
```

## API Modifications Needed (On Existing Backend)

⚠️ **IMPORTANT ARCHITECTURE DECISION:**
=====================================
The mobile app will connect to the EXISTING halteres.ai backend.
- NO migration of prompt JS files to Edge Functions
- NO duplication of AI generation logic
- Keep all prompts in their current location
- Simply add mobile support to existing API

### Add Bearer Token Support

```javascript
// Update existing API routes to accept bearer tokens
export async function GET(request) {
  // Add bearer token support alongside cookies
  const authHeader = request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    // Continue with user context
  } else {
    // Fall back to cookie auth for web
    const { user } = await getServerSession(request);
  }

  // YOUR EXISTING PROMPT LOGIC STAYS HERE - NO CHANGES NEEDED
  const prompt = await loadPrompt('generate-program');
  const result = await callAnthropicAPI(prompt, params);
  // ... rest of existing code unchanged
}
```

### CORS Headers for Mobile

```javascript
// Add to API routes
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
```

### What Stays Where:
- Prompt JS files: Stay in halteres.ai backend ✅
- AI generation logic: Stay in halteres.ai backend ✅
- Anthropic API calls: Stay in halteres.ai backend ✅
- Mobile app: Only calls existing endpoints with bearer tokens ✅

## Testing Strategy

### Week 5: Testing & Polish

1. **Device Testing Matrix**
   - iOS: iPhone SE, 14, 15 Pro (iOS 15+)
   - Android: Pixel 5, Samsung S21 (Android 8+)
   - Tablets: iPad, Android tablets

2. **Performance Testing**
   - Bundle size < 50MB
   - Time to interactive < 3s
   - Smooth 60fps animations
   - Reanimated worklet performance

3. **Offline Testing**
   - Cache critical data with TanStack Query
   - Queue API calls when offline
   - Sync when connection restored

## Launch Checklist

### iOS

- [ ] App icons (1024x1024 + all sizes)
- [ ] Launch screens
- [ ] App Store screenshots
- [ ] Privacy policy URL
- [ ] TestFlight beta testing
- [ ] App Store submission

### Android

- [ ] App icons (adaptive icons)
- [ ] Splash screens
- [ ] Play Store graphics
- [ ] Privacy policy
- [ ] Internal testing track
- [ ] Play Store submission

### Both Platforms

- [ ] Push notification setup (Expo)
- [ ] Deep linking configuration
- [ ] Analytics integration
- [ ] Crash reporting (Sentry)
- [ ] Environment variables configured

## Success Metrics

- **Week 1**: Core app structure working, auth functional
- **Week 2**: Can create/view programs, API integration complete
- **Week 3**: AI generation working, all core features done
- **Week 4**: Native features integrated, platform-specific polish
- **Week 5**: Testing complete, ready for store submission

## Long-Term Advantages

1. **Native Performance**: True native app with React Native
2. **Familiar Routing**: Expo Router file-based routing like Next.js
3. **Modern Tooling**: Best-in-class libraries for every need
4. **Type Safety**: Full TypeScript coverage
5. **Expo Ecosystem**: Easy updates, OTA, and native modules
6. **Maintainability**: Clean separation from web app
7. **Developer Experience**: Fast refresh, debugging, and iteration

This approach gives you a production-ready native mobile app in 5 weeks while maintaining your existing web app unchanged.
