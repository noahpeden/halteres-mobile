# App Store & Google Play Deployment Checklist

This guide walks you through deploying Halteres to both the Apple App Store and Google Play Store.

## Prerequisites

### 1. Developer Accounts

#### Apple Developer Program ($99/year)
1. Go to [developer.apple.com/programs](https://developer.apple.com/programs/)
2. Click "Enroll"
3. Sign in with your Apple ID (or create one)
4. Complete enrollment (takes up to 48 hours for approval)

#### Google Play Console ($25 one-time)
1. Go to [play.google.com/console](https://play.google.com/console/)
2. Sign in with your Google account
3. Pay the registration fee
4. Complete the developer profile

### 2. Expo Account
1. Create an account at [expo.dev](https://expo.dev/)
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`

---

## Step-by-Step Deployment

### Phase 1: Project Setup

#### 1.1 Initialize EAS Project
```bash
cd halteres-mobile
eas init
```
This will create a project on Expo servers and give you a project ID.

#### 1.2 Update app.json
After running `eas init`, update the following in `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_FROM_EAS_INIT"
      }
    },
    "owner": "your-expo-username"
  }
}
```

#### 1.3 Create App Assets
Place these files in the `assets/` folder:
- `icon.png` (1024x1024)
- `adaptive-icon.png` (1024x1024)
- `splash.png` (1284x2778)

See `assets/README.md` for detailed requirements.

---

### Phase 2: iOS Deployment

#### 2.1 Configure Apple Developer Account
```bash
eas credentials
```
Select iOS → production → choose to let EAS manage your credentials (recommended)

#### 2.2 Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Halteres
   - Primary Language: English (U.S.)
   - Bundle ID: com.halteres.mobile
   - SKU: halteres-mobile-001 (any unique identifier)
4. Save the **Apple ID** (numeric) for eas.json

#### 2.3 Update eas.json with Apple Credentials
Edit `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_NUMERIC_APP_ID_FROM_APP_STORE_CONNECT",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

Find your Team ID:
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Scroll down to "Membership details"
3. Copy the Team ID

#### 2.4 Build iOS App
```bash
npm run build:prod:ios
# or: eas build --profile production --platform ios
```

#### 2.5 Submit to App Store
```bash
npm run submit:ios
# or: eas submit --platform ios
```

#### 2.6 Complete App Store Listing
In App Store Connect:
1. **App Information**
   - Category: Health & Fitness
   - Content Rights: Does not use third-party content

2. **Pricing and Availability**
   - Set price (Free or paid)
   - Select countries

3. **App Privacy**
   - Fill out privacy policy URL
   - Complete data collection questions

4. **Version Information**
   - Screenshots (see assets/README.md for sizes)
   - Description (up to 4000 characters)
   - Keywords (up to 100 characters)
   - Support URL
   - Marketing URL (optional)

5. **App Review Information**
   - Contact information
   - Demo account credentials (if login required)
   - Notes for reviewers

6. Submit for Review

---

### Phase 3: Android Deployment

#### 3.1 Create App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - App name: Halteres
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
4. Accept policies and create

#### 3.2 Set Up Google Play Service Account
1. In Play Console, go to Setup → API access
2. Click "Create new service account"
3. Follow link to Google Cloud Console
4. Create service account with "Service Account User" role
5. Create and download JSON key
6. Back in Play Console, grant "Release manager" permissions to the service account

#### 3.3 Update eas.json with Google Credentials
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Important**: Add `google-service-account.json` to `.gitignore`!

#### 3.4 Build Android App
```bash
npm run build:prod:android
# or: eas build --profile production --platform android
```

#### 3.5 Submit to Google Play
```bash
npm run submit:android
# or: eas submit --platform android
```

#### 3.6 Complete Play Store Listing
In Google Play Console:

1. **Store Listing**
   - Short description (80 characters)
   - Full description (4000 characters)
   - Screenshots (see assets/README.md)
   - Feature graphic (1024x500)
   - App icon (512x512)

2. **App Content**
   - Privacy policy URL
   - App access (restricted or open)
   - Ads declaration
   - Content rating questionnaire
   - Target audience
   - News app declaration
   - COVID-19 contact tracing
   - Data safety section

3. **Countries/Regions**
   - Select where to publish

4. **Release**
   - Start with Internal testing track
   - Promote to Production when ready

---

## Environment Variables for Production

Create a `.env.production` file or set these via EAS Secrets:

```bash
# Set secrets via EAS CLI
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-production-url"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-production-key"
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://halteres.ai"
```

---

## Useful Commands Reference

```bash
# Build commands
npm run build:prod:ios        # Production iOS build
npm run build:prod:android    # Production Android build
npm run build:prod            # Both platforms

# Submit commands
npm run submit:ios            # Submit iOS to App Store
npm run submit:android        # Submit Android to Play Store

# Credential management
eas credentials               # Manage signing credentials

# Check build status
eas build:list               # List recent builds

# Over-the-air updates (after initial store release)
eas update                   # Push OTA update
```

---

## Review Timeline

- **Apple App Store**: Usually 24-48 hours, can be up to 1 week
- **Google Play Store**: Usually a few hours to 3 days for new apps

---

## Common Issues

### iOS: "Missing required icon"
Ensure `icon.png` is exactly 1024x1024 with no transparency.

### iOS: "Binary rejected - Privacy declarations"
Update `infoPlist` in app.json with usage descriptions for any permissions.

### Android: "APK rejected - 64-bit requirement"
EAS builds include 64-bit by default. Ensure you're using `app-bundle` for production.

### Android: "App not eligible for review"
Complete all sections in Play Console including Data Safety form.

---

## Post-Launch Checklist

- [ ] Monitor crash reports (Expo dashboard, App Store Connect, Play Console)
- [ ] Set up analytics
- [ ] Plan update release cycle
- [ ] Respond to user reviews
- [ ] Monitor app performance
