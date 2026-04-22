# Juice Native Expo Playground

This folder is a minimal Expo environment for testing the React Native side of Juice.

## Start

From this folder:

```powershell
npm install
npx expo start
```

## What this is for

- testing React Native component rendering
- trying layout and styling ideas quickly
- giving `src/native` a real runtime target while the API is still forming

## Current limitation

The current `src/native` token-loading path uses `node:fs` to read YAML at runtime.

That works in Node-based checks, but it will not run directly inside Expo yet.

So this playground is ready for:

- UI experimentation
- RN component scaffolding
- layout primitive testing

The next native milestone is making token access Expo-friendly, either by:

- generating static token modules ahead of time
- or bundling token JSON in a way Metro can import directly
