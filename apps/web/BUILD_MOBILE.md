# Building Careerly for Mobile

## Option 1: PWA (Instant - No Build Needed)
The app is already a Progressive Web App. Users can install it directly:
- **Android**: Open in Chrome → Menu → "Add to Home Screen"
- **iOS**: Open in Safari → Share → "Add to Home Screen"

## Option 2: Android APK

### Prerequisites
1. Install [Android Studio](https://developer.android.com/studio)
2. During install, ensure Android SDK and Java JDK are included

### Build Steps
```bash
cd apps/web

# Build the static export
CAPACITOR_BUILD=1 npx next build

# Sync web assets to Android project
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build from command line:
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release Build (for Play Store)
```bash
cd android
./gradlew assembleRelease
```
You'll need to configure signing in `android/app/build.gradle`.

## Option 3: iOS App

### Prerequisites
- macOS with Xcode 15+
- Apple Developer Account ($99/year)

### Build Steps
```bash
cd apps/web

# Build the static export
CAPACITOR_BUILD=1 npx next build

# Sync web assets to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then build and archive from Xcode.

## API Configuration
For production mobile builds, update the API URL in `src/lib/api.ts`:
```typescript
const API_BASE = 'https://your-deployed-api.com/api/v1';
```
