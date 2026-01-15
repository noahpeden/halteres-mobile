# Apple App Store Submission Guide

This guide walks you through publishing Halteres to the Apple App Store.

## Prerequisites

### 1. Apple Developer Account
- Enroll at https://developer.apple.com/programs/
- Cost: $99 USD per year
- Processing time: 1-2 business days

### 2. App Store Connect Access
- Once enrolled, access App Store Connect at https://appstoreconnect.apple.com
- This is where you manage your app listings, builds, and submissions

## Step-by-Step Process

### Phase 1: Create App Assets (Required Before Building)

#### Missing Assets
You need to create these files in `/assets`:
- `icon.png` (1024x1024) - Main app icon
- `adaptive-icon.png` (1024x1024) - Android adaptive icon foreground
- `splash.png` (1284x2778) - Splash screen

#### Asset Creation Options

**Option A: Icon Kitchen (Quick)**
1. Go to https://icon.kitchen/
2. Upload your logo or design an icon
3. Download generated assets
4. Rename and place in `/assets` folder

**Option B: Figma/Design Tool (Professional)**
1. Design custom assets using brand colors:
   - Primary: #1771dc
   - Secondary: #ea7f49
   - Background: #020817
2. Export as PNG at required sizes
3. Place in `/assets` folder

**Option C: Placeholder (For Testing)**
```bash
# Generate simple colored placeholders for testing
# (Replace with real assets before final submission)
```

### Phase 2: Apple Developer Setup

#### 2.1 Create App Store Connect API Key (Recommended)
1. Go to App Store Connect → Users and Access → Keys
2. Click "+" to create new key
3. Name: "EAS Build Halteres"
4. Access: App Manager or Admin
5. Download the API Key (.p8 file) - **save securely, can only download once**
6. Note the Key ID and Issuer ID

#### 2.2 Configure EAS with App Store Connect API Key
```bash
cd /Users/noahpeden/personal/halteres/halteres-mobile
eas credentials
```

Select iOS → Production → App Store Connect API Key → Add new key

Or manually create `app-store-api-key.json`:
```json
{
  "keyId": "YOUR_KEY_ID",
  "issuerId": "YOUR_ISSUER_ID",
  "keyP8": "PASTE_CONTENTS_OF_P8_FILE_HERE"
}
```

#### 2.3 Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: Halteres
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.halteres.mobile (should be in dropdown)
   - **SKU**: com.halteres.mobile (or any unique identifier)
   - **User Access**: Full Access
4. Note the Apple ID (numeric) - you'll need this for eas.json

#### 2.4 Update eas.json with Your Details
Open `/halteres-mobile/eas.json` and update:
```json
"ios": {
  "appleId": "your-apple-id@example.com",
  "ascAppId": "1234567890",  // From App Store Connect
  "appleTeamId": "ABCDE12345"  // From developer.apple.com membership
}
```

Find your Team ID:
- Go to https://developer.apple.com/account
- Click "Membership" in sidebar
- Team ID is displayed there

### Phase 3: Prepare App Store Metadata

Before submitting, prepare this information:

#### Required Information
- **App Name**: Halteres (32 character max)
- **Subtitle**: Brief tagline (30 character max)
- **Primary Category**: Health & Fitness
- **Secondary Category**: (Optional) Sports
- **Description**: Detailed app description (4000 character max)
- **Keywords**: Comma-separated (100 character max total)
  - Example: "workout,fitness,gym,tracking,strength,training,exercise"
- **Support URL**: Your support website
- **Marketing URL**: (Optional) Your main website
- **Privacy Policy URL**: Required - must be publicly accessible

#### Content Rights
- **Age Rating**: Complete questionnaire in App Store Connect
- **Copyright**: © 2026 Halteres

#### App Review Information
- **Contact Information**: Email and phone for Apple reviewers
- **Demo Account**: If app requires login, provide test credentials
- **Notes**: Any special instructions for reviewers

### Phase 4: Create Screenshots

Required screenshot sizes for iPhone:
- **6.7" Display** (1290x2796) - iPhone 14/15 Pro Max - REQUIRED
- **6.5" Display** (1284x2778) - iPhone 11/12/13 Pro Max - REQUIRED
- **5.5" Display** (1242x2208) - iPhone 8 Plus - REQUIRED

If supporting iPad (you have `supportsTablet: true`):
- **12.9" iPad Pro** (2048x2732) - REQUIRED

#### Screenshot Capture Methods

**Method 1: iOS Simulator**
```bash
# Start app in simulator
npm run ios

# Take screenshots in simulator:
# CMD + S saves to Desktop
```

**Method 2: Real Device**
- Run app on physical device
- Take screenshots (Volume Up + Power button)
- Transfer via AirDrop or cable

**Method 3: Screenshot Tools**
- Use tools like [Screely](https://www.screely.com/) or [AppMockUp](https://app-mockup.com/)
- Add device frames for better presentation

#### Screenshot Best Practices
- Show 3-5 key features
- Use captions/text overlays to explain features
- First screenshot is most important (appears in search)
- Keep consistent style across all screenshots
- Test on different screen sizes

### Phase 5: Build Production App

#### 5.1 Pre-Build Checklist
- [ ] Assets (icon.png, splash.png) exist in `/assets`
- [ ] EAS configured with Apple credentials
- [ ] App created in App Store Connect
- [ ] eas.json updated with correct IDs
- [ ] Version numbers are correct in app.json

#### 5.2 Build with EAS
```bash
cd /Users/noahpeden/personal/halteres/halteres-mobile

# Build production iOS app
npm run build:prod:ios

# Or manually:
eas build --platform ios --profile production
```

This will:
1. Upload your code to EAS Build servers
2. Install dependencies
3. Build the iOS app bundle
4. Sign with your Apple Developer credentials
5. Create an `.ipa` file ready for App Store

Build time: ~15-30 minutes

Monitor progress:
- Check terminal for status
- View detailed logs at https://expo.dev

#### 5.3 Download Build (Optional)
Once complete, EAS will provide:
- Download link for `.ipa` file
- Build ID for tracking
- Link to view in Expo dashboard

### Phase 6: Submit to App Store

#### 6.1 Upload to App Store Connect

**Option A: Automatic Submit via EAS (Recommended)**
```bash
npm run submit:ios

# Or manually:
eas submit --platform ios
```

EAS will:
1. Download the build
2. Upload to App Store Connect via App Store Connect API
3. Process the build (10-30 minutes)

**Option B: Manual Upload**
1. Download `.ipa` from EAS Build
2. Use Transporter app (from Mac App Store)
3. Drag `.ipa` file to Transporter
4. Click "Deliver"

#### 6.2 Complete App Store Connect Listing

1. Go to App Store Connect → My Apps → Halteres
2. Click on "1.0 Prepare for Submission"
3. Fill in all required fields:
   - Screenshots (upload for each device size)
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL
   - Age Rating
4. Select the build you just uploaded
5. Complete App Review Information
6. Add pricing (Free or Paid)
7. Select availability (all countries or specific)

#### 6.3 Submit for Review

1. Click "Add for Review" at top right
2. Review all information one final time
3. Click "Submit for Review"
4. Apple will review your app (typically 1-3 days)

### Phase 7: App Review Process

#### What Apple Reviews
- Functionality (app must work as described)
- Content (must follow App Store Review Guidelines)
- Compliance (privacy policy, permissions, etc.)
- Metadata accuracy (screenshots match actual app)

#### Common Rejection Reasons
- Crashes or bugs
- Missing features shown in screenshots
- Privacy policy issues
- Incomplete or misleading metadata

#### If Rejected
1. Apple will explain the issue
2. Fix the problems in your code
3. Build and submit a new version
4. Respond to Apple's feedback

#### If Approved
- App goes live automatically (or on date you chose)
- Available on App Store within 24 hours
- You'll receive email notification

## Troubleshooting

### Build Errors
```bash
# Clear EAS cache
eas build:cancel

# Clear local cache
npx expo start -c
```

### Certificate Issues
```bash
# Reset credentials
eas credentials

# Follow prompts to regenerate
```

### Common Issues
- **Bundle ID mismatch**: Ensure Bundle ID in app.json matches App Store Connect
- **Missing assets**: Verify icon.png and splash.png exist and are correct size
- **Version conflicts**: Increment version/buildNumber in app.json for each build
- **Permissions**: Ensure all required permissions are declared in app.json

## Checklist Before Final Submission

- [ ] Real app assets (not placeholders) in `/assets`
- [ ] All App Store Connect metadata complete
- [ ] Screenshots for all required device sizes
- [ ] Privacy policy URL is live and accessible
- [ ] Test account provided (if app requires login)
- [ ] App tested on physical device
- [ ] Version and build numbers updated
- [ ] EAS credentials configured correctly
- [ ] Production build successful
- [ ] Upload to App Store Connect complete

## Post-Launch

### Monitor Reviews
- Respond to user reviews in App Store Connect
- Address bugs and feedback quickly

### Analytics
- Use App Store Connect Analytics to track downloads
- Monitor crash reports

### Updates
To release updates:
1. Increment version/buildNumber in app.json
2. Make changes to code
3. Run `npm run build:prod:ios`
4. Submit new build for review
5. Apple reviews again (usually faster for updates)

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

## Need Help?

- Check logs: `eas build:list`
- View build details: https://expo.dev
- Expo Discord: https://chat.expo.dev
- Apple Developer Forums: https://developer.apple.com/forums/

---

**Estimated Timeline:**
- Asset creation: 2-4 hours
- Apple Developer setup: 1-2 days (account approval)
- App Store Connect setup: 1 hour
- Building: 30 minutes (automated)
- Submission preparation: 2-3 hours
- Apple review: 1-3 days
- **Total: ~3-5 days from start to App Store**
