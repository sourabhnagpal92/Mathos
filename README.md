# MATH_OS — PWA Setup Guide

## What's in this folder

```
mathos-pwa/
├── index.html          ← Entry point (PWA meta tags, iPhone support)
├── vite.config.js      ← Build config + PWA plugin
├── package.json        ← Dependencies
├── vercel.json         ← Vercel deploy config
├── src/
│   ├── main.jsx        ← React entry point
│   └── App.jsx         ← THE GAME (all code here)
└── public/
    └── icons/
        ├── icon-192.png          ← App icon
        ├── icon-512.png          ← App icon (large)
        └── splash-1290x2796.png  ← iPhone 14 Pro Max splash
```

---

## Step 1 — Deploy to Vercel (free, takes ~5 minutes)

### Option A: GitHub + Vercel (recommended)

1. Go to **github.com** → sign up / log in (free)
2. Click **New repository** → name it `mathos` → Create
3. Upload all files in this folder to the repo (drag & drop works)
4. Go to **vercel.com** → sign up with GitHub
5. Click **Add New Project** → Import your `mathos` repo
6. Leave all settings as default → click **Deploy**
7. In ~60 seconds you get a URL like: `mathos.vercel.app` ✅

### Option B: Vercel CLI (if you have Node.js installed)

```bash
npm install -g vercel
cd mathos-pwa
npm install
vercel --prod
```

---

## Step 2 — Install on iPhone 14 Pro Max

1. Open **Safari** on your iPhone (⚠️ must be Safari — Chrome won't show the install option)
2. Go to your Vercel URL (e.g. `mathos.vercel.app`)
3. Tap the **Share** button (📤 box with arrow, bottom center of Safari)
4. Scroll down in the share sheet → tap **"Add to Home Screen"**
5. Name it **MATH_OS** → tap **Add**

The app now appears on your home screen. When you open it:
- ✅ Opens fullscreen (no Safari address bar)
- ✅ Works offline (service worker caches everything)
- ✅ Has a proper splash screen
- ✅ Respects the Dynamic Island / notch safe area
- ✅ No bounce/scroll on background

---

## Step 3 — Making updates later

If you want to update the game, just edit `src/App.jsx` and push to GitHub.
Vercel auto-redeploys in ~30 seconds. The app on your phone updates automatically
next time you open it with internet.

---

## Troubleshooting

**"Add to Home Screen" not appearing?**
→ Make sure you're using Safari, not Chrome or Firefox

**App opens in browser instead of fullscreen?**
→ You may have added it before the PWA was fully deployed. Delete the icon and re-add.

**Splash screen not showing?**
→ Normal on first install. Force-close the app and reopen.

**Offline not working?**
→ Open the app once with internet first to let the service worker cache everything.
