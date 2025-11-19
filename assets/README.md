# Assets Directory

This directory should contain the following app assets:

## Required Assets

1. **icon.png** (1024x1024)
   - App icon used for iOS and Android
   - Should be a square PNG image

2. **splash.png** (2048x2048 recommended)
   - Splash screen image
   - Will be displayed while the app is loading

3. **adaptive-icon.png** (1024x1024)
   - Android adaptive icon foreground
   - Should work with the background color defined in app.json (#020817)

## Generating Assets

You can use the following tools to generate your app assets:
- [Expo Icon Generator](https://icon.kitchen/)
- [App Icon Generator](https://appicon.co/)

## Placeholder Assets

For now, you can create simple placeholder images or use the default Expo assets.

To generate default assets, run:
```bash
npx expo prebuild
```

This will generate default iOS and Android assets.
