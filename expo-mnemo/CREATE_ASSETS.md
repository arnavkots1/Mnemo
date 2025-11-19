# Creating App Assets (Optional)

The app will work without custom assets, but you can add them later for a polished look.

## Quick Option: Use Expo's Default Assets

The app is configured to work without custom assets. Expo will use default icons.

## Create Custom Assets (Optional)

If you want custom icons and splash screens:

### 1. Create Icon (1024x1024 PNG)
- Save as: `assets/icon.png`
- Size: 1024x1024 pixels
- Format: PNG with transparency

### 2. Create Splash Screen (1242x2436 PNG)
- Save as: `assets/splash.png`
- Size: 1242x2436 pixels (or use any size, Expo will scale)
- Format: PNG

### 3. Create Adaptive Icon (Android)
- Save as: `assets/adaptive-icon.png`
- Size: 1024x1024 pixels
- Format: PNG

### 4. Create Favicon (Web)
- Save as: `assets/favicon.png`
- Size: 48x48 or 96x96 pixels
- Format: PNG or ICO

## Online Tools

You can use online tools to generate these:
- **Icon Generator**: https://www.appicon.co/
- **Splash Screen Generator**: https://www.appicon.co/splash
- Or use any image editor (Photoshop, GIMP, Canva, etc.)

## After Creating Assets

1. Add the files to `assets/` folder
2. Update `app.json` to reference them (they're currently optional)
3. Restart Expo: `npm start`

## For Now

The app works fine without custom assets - Expo uses defaults. You can add them later!

