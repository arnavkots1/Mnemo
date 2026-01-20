# Mnemo Consolidated Guide

## Overview
Mnemo is a personal memory app that captures photos, audio, notes, and location to create moments and daily summaries. The Expo app runs in `expo-mnemo/`, and the Express backend runs in `expo-mnemo-backend/`.

## Project Structure
- `expo-mnemo/` — Expo React Native app
- `expo-mnemo-backend/` — Express API (Gemini, uploads, Places)

## Quick Start
### Frontend (Expo)
1. Install dependencies:
   - `npm install` inside `expo-mnemo/`
2. Start Expo:
   - `npx expo start`

### Backend (Express)
1. Install dependencies:
   - `npm install` inside `expo-mnemo-backend/`
2. Start backend:
   - `npm run dev`

### Tunnel (Cloudflare quick tunnel)
Use the PowerShell script already in the repo:
- `expo-mnemo-backend/scripts/start-cloudflared.ps1`

Set `EXPO_PUBLIC_API_URL` to the resulting URL and restart Expo.

## Environment Variables
### Frontend (`expo-mnemo/.env`)
- `EXPO_PUBLIC_API_URL` — Base URL for the backend (Cloudflare URL)
- `EXPO_PUBLIC_TUNNEL_URL` — Optional tunnel URL (if used)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

### Backend (`expo-mnemo-backend/.env`)
- `GEMINI_API_KEY` — Google Gemini API key
- `GOOGLE_MAPS_API_KEY` — Google Places/Geocoding key
- `PORT` — API port (default 3000)
- `USE_TUNNEL` — Set to `true` to enable localtunnel
- `TUNNEL_SUBDOMAIN` — Optional localtunnel subdomain

## Features and Behavior
- **Moments**: Individual entries (photo, audio, location).
- **Memories**: Daily summaries aggregated from moments.
- **Location logging**: Only when time >= 10 minutes AND distance >= 500m.
- **Gemini**: Used for image, audio, and memory analysis with fallback models.
- **Firebase**: Auth, Firestore, Storage for cloud sync.

## Google Places
Backend exposes `/api/location/lookup` which uses `GOOGLE_MAPS_API_KEY` for richer place data.

## Testing
- Use Expo Go for quick testing.
- For background location and persistent auth, use a dev build.

## Deployment (Google Play)
### 1) Accounts
- Create a Google Play Console account (one-time fee).

### 2) App Config
- `expo-mnemo/app.json` already includes:
  - `android.package`
  - `android.versionCode`
  - required permissions
- Keep `versionCode` incremented for every release.

### 3) EAS Build
`expo-mnemo/eas.json` is set up for Android app bundles.

Build production AAB:
- `npx eas build --platform android --profile production`

### 4) Play Console
- Create a new app
- Upload the `.aab`
- Complete store listing (description, screenshots, icon)
- Set content ratings, data safety, and privacy policy URL
- Submit to review

## Legal and Policy
The in‑app Legal screen contains the Privacy Policy and Terms content. For store submission, host these documents on a public URL and link them in the Play Console listing.
