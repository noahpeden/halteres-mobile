# App Store Submission Checklist

Quick reference checklist for publishing Halteres to the Apple App Store.

## Pre-Submission Checklist

### Apple Developer Setup
- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] App Store Connect account accessible
- [ ] Team ID obtained from developer.apple.com/account
- [ ] App created in App Store Connect with Bundle ID: com.halteres.mobile
- [ ] Apple App Store Connect API key created and configured
- [ ] eas.json updated with correct Apple IDs

### Assets Required
- [ ] `assets/icon.png` (1024x1024 PNG)
- [ ] `assets/adaptive-icon.png` (1024x1024 PNG with transparency)
- [ ] `assets/splash.png` (1284x2778 PNG)

### App Store Metadata
- [ ] App name: Halteres
- [ ] Subtitle (30 chars max)
- [ ] Primary category: Health & Fitness
- [ ] Description (4000 chars max)
- [ ] Keywords (100 chars total)
- [ ] Support URL
- [ ] Privacy Policy URL (must be publicly accessible)
- [ ] Copyright info
- [ ] Age rating completed

### Screenshots Required
- [ ] iPhone 6.7" (1290x2796) - 3-10 screenshots
- [ ] iPhone 6.5" (1284x2778) - 3-10 screenshots
- [ ] iPhone 5.5" (1242x2208) - 3-10 screenshots
- [ ] iPad Pro 12.9" (2048x2732) - 3-10 screenshots (if supporting iPad)

### App Configuration
- [ ] Version number set in app.json (line 5)
- [ ] Build number set in app.json (line 22)
- [ ] Bundle identifier correct: com.halteres.mobile
- [ ] All permissions have usage descriptions in infoPlist
- [ ] usesNonExemptEncryption set correctly (currently false)

### Testing
- [ ] App tested on iOS simulator
- [ ] App tested on physical iOS device (recommended)
- [ ] All features working as expected
- [ ] No crashes or critical bugs
- [ ] Login flow works (if applicable)

### App Review Preparation
- [ ] Contact information for reviewers
- [ ] Demo account credentials (if app requires login)
- [ ] Notes for reviewers (if special instructions needed)
- [ ] All features match screenshots and description

## Build & Submit Checklist

### Build Production App
```bash
cd /Users/noahpeden/personal/halteres/halteres-mobile
npm run build:prod:ios
```

- [ ] EAS Build started successfully
- [ ] Build completed without errors
- [ ] Build ID and download link received

### Submit to App Store
```bash
npm run submit:ios
```

- [ ] Upload to App Store Connect successful
- [ ] Build appears in App Store Connect (wait 10-30 min for processing)
- [ ] Build selected in App Store Connect listing
- [ ] All metadata fields complete
- [ ] Screenshots uploaded for all device sizes
- [ ] "Submit for Review" clicked

## Post-Submission

- [ ] Email confirmation received from Apple
- [ ] App status: "Waiting for Review" → "In Review" → "Pending Developer Release" or "Ready for Sale"
- [ ] Reviewed rejection reasons (if rejected)
- [ ] App live on App Store (if approved)

## Quick Commands

### Development
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
```

### Production Build
```bash
npm run build:prod:ios     # Build iOS production app
npm run submit:ios         # Submit to App Store Connect
```

### EAS Commands
```bash
eas build --platform ios --profile production   # Build manually
eas submit --platform ios                       # Submit manually
eas build:list                                  # View build history
eas credentials                                 # Manage credentials
```

## Important Notes

1. **First Submission**: Apple review typically takes 1-3 business days
2. **Subsequent Updates**: Usually faster review (24-48 hours)
3. **Rejections**: Common on first submission; review feedback and resubmit
4. **Build Numbers**: Increment buildNumber in app.json for each new build
5. **Versions**: Increment version in app.json for feature updates

## Estimated Timeline

- **Apple Developer Account Approval**: 1-2 business days
- **Asset Creation**: 2-4 hours
- **Metadata Preparation**: 1-2 hours
- **Screenshot Creation**: 1-2 hours
- **Build Process**: 15-30 minutes (automated)
- **Upload & Processing**: 10-30 minutes
- **Apple Review**: 1-3 business days
- **Total**: ~3-5 days from start to App Store

## Next Steps

1. **Create Assets** → Generate icon.png, adaptive-icon.png, splash.png
2. **Apple Setup** → Enroll in Developer Program and create app
3. **Prepare Metadata** → Write description, keywords, take screenshots
4. **Build** → Run production build with EAS
5. **Submit** → Upload and submit for review
6. **Wait** → Apple reviews (monitor email and App Store Connect)
7. **Launch** → App goes live on approval

## Resources

- Guide: `/docs/app-store-submission-guide.md`
- Assets: `/assets/README.md`
- EAS Config: `/eas.json`
- App Config: `/app.json`
- Expo Docs: https://docs.expo.dev/submit/ios/
