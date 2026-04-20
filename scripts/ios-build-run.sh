#!/bin/bash

# RhythmRun iOS CLI Build & Run Script
# This script automates the process of building the iOS app and running it on a simulator.

set -e

PROJECT_PATH="ios/App/App.xcodeproj"
WORKSPACE_PATH="ios/App/App.xcworkspace"
SCHEME="App"
BUNDLE_ID="com.phchu.rhythmrun"
CONFIGURATION="Debug"
SDK="iphonesimulator"

echo "🚀 Starting iOS CLI Build Process..."

# 1. Sync Capacitor (Optional, assumes web build is done)
# Uncomment the following line if you want to sync every time
# npx cap sync ios

# 2. Build for Simulator
echo "📦 Building for Simulator ($SDK)..."
xcodebuild \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -sdk "$SDK" \
  -destination "generic/platform=iOS Simulator" \
  build | xcpretty || xcodebuild -workspace "$WORKSPACE_PATH" -scheme "$SCHEME" -configuration "$CONFIGURATION" -sdk "$SDK" -destination "generic/platform=iOS Simulator" build

# 3. Find/Boot Simulator
echo "📱 Checking for booted simulator..."
DEVICE_ID=$(xcrun simctl list devices booted | grep -E '([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})' -o | head -n 1)

if [ -z "$DEVICE_ID" ]; then
    echo "⚠️ No booted simulator found. Booting iPhone 15..."
    DEVICE_ID=$(xcrun simctl list devices | grep "iPhone 15" | grep -v "unavailable" | head -n 1 | grep -E '([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})' -o)
    xcrun simctl boot "$DEVICE_ID"
    open -a Simulator
fi

echo "✅ Using Simulator ID: $DEVICE_ID"

# 4. Install and Launch
APP_PATH=$(xcodebuild -workspace "$WORKSPACE_PATH" -scheme "$SCHEME" -configuration "$CONFIGURATION" -sdk "$SDK" -showBuildSettings | grep -w TARGET_BUILD_DIR | awk '{print $3}')
FINAL_APP_PATH="$APP_PATH/App.app"

echo "📥 Installing App from: $FINAL_APP_PATH"
xcrun simctl install "$DEVICE_ID" "$FINAL_APP_PATH"

echo "🚀 Launching App ($BUNDLE_ID)..."
xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID"

echo "✨ Done! App is running on the simulator."
