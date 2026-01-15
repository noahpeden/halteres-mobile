# App Assets Requirements for Store Submission

## Required Assets

### 1. App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG (no transparency for iOS App Store)
- **Usage**: Used as the main app icon on both iOS and Android

### 2. Adaptive Icon (`adaptive-icon.png`) - Android Only
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground layer
- **Note**: The background color is set to `#020817` in app.json

### 3. Splash Screen (`splash.png`)
- **Size**: 1284x2778 pixels (iPhone 14 Pro Max) or at least 1242x2688
- **Format**: PNG
- **Usage**: Displayed while the app loads
- **Note**: Will be displayed on background color `#020817`

## Quick Generation with Icon Kitchen

1. Go to [Icon Kitchen](https://icon.kitchen/)
2. Upload or design your icon
3. Download the generated assets
4. Rename and place files:
   - `icon.png` → App icon
   - `adaptive-icon.png` → Android adaptive icon foreground

## Figma Template (Recommended)

Use the official Expo Asset Guidelines:
1. Create a new Figma file
2. Add artboards:
   - 1024x1024 for `icon.png`
   - 1024x1024 for `adaptive-icon.png`
   - 1284x2778 for `splash.png`
3. Design your assets
4. Export as PNG

## Design Guidelines

### App Icon Tips
- Keep it simple and recognizable
- Use your brand colors (primary: #1771dc, secondary: #ea7f49)
- Ensure good contrast for visibility
- Test at small sizes (app icons appear as small as 29px on iOS)

### Splash Screen Tips
- Keep the logo/artwork centered
- Use the same background color as app (`#020817`)
- Don't include text that needs to be readable
- Simple is better - users only see this briefly

## Brand Colors Reference
- **Primary (Smart Blue)**: #1771dc
- **Secondary (Helpful Orange)**: #ea7f49
- **Tertiary (Thriving Green)**: #3c8f73
- **Background**: #020817

## Store Screenshot Requirements

In addition to app icons, you'll need screenshots for store listings:

### iOS App Store
- iPhone 6.7" (1290x2796) - Required for iPhone 14/15 Pro Max
- iPhone 6.5" (1284x2778) - Required for iPhone 11 Pro Max
- iPhone 5.5" (1242x2208) - Required for iPhone 8 Plus
- iPad Pro 12.9" (2048x2732) - Required if supporting iPad

### Google Play Store
- Phone screenshots (1080x1920 to 1080x2400)
- 7-inch tablet (1200x1920) - Optional
- 10-inch tablet (1600x2560) - Optional
- Feature graphic (1024x500) - Required

## Testing Your Assets

After adding assets, run:
```bash
npx expo start
```

Check that:
1. App icon appears correctly in the simulator/device
2. Splash screen displays without stretching or cropping
3. Android adaptive icon looks correct in the icon preview
