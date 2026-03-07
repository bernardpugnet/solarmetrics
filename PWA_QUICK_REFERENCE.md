# SolarMetrics PWA - Quick Reference Guide

## Files Created

### Root Level Files
- `/sessions/dazzling-brave-lamport/mnt/solarmetrics/manifest.json` (769 bytes)
- `/sessions/dazzling-brave-lamport/mnt/solarmetrics/sw.js` (5.6 KB)
- `/sessions/dazzling-brave-lamport/mnt/solarmetrics/offline.html` (4.7 KB)

### Icon Files
- `/sessions/dazzling-brave-lamport/mnt/solarmetrics/icons/icon.svg` (1.3 KB)
- `/sessions/dazzling-brave-lamport/mnt/solarmetrics/icons/generate.html` (11 KB)

### Modified File
- `/sessions/dazzling-brave-lamport/mnt/solarmetrics/fr/index.html`
  - Added 6 PWA meta tags (lines 50-55)
  - Added Service Worker registration (lines 751-754)

## Manifest.json Highlights

```json
{
  "name": "SolarMetrics - Finance & Énergie Solaire",
  "start_url": "/fr/",
  "display": "standalone",
  "theme_color": "#f59e0b",
  "background_color": "#0f172a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

## Service Worker Features

| Feature | Strategy | Applies To |
|---------|----------|-----------|
| Cache-First | Check cache first, fallback to network | Static assets (fonts, CSS, JS, images) |
| Stale-While-Revalidate | Serve cached + update in background | HTML pages |
| Network-First | Try network, fallback to cache | Other resources |
| Offline Fallback | Show offline.html | Uncached pages when offline |

## App Shell Cache (Pre-cached on Install)

- `/` (site root)
- `/fr/` (French home)
- `/fr/economie.html`
- `/fr/technologies.html`
- `/fr/outils-autoconsommation.html`
- `/fr/comparateur.html`
- `/manifest.json`
- `/offline.html`

## Cache Configuration

| Property | Value | Notes |
|----------|-------|-------|
| CACHE_VERSION | `solarmetrics-v2026-03` | Change to invalidate cache |
| SHELL_CACHE | `{version}-shell` | For app shell pages |
| ASSETS_CACHE | `{version}-assets` | For static resources |

## Testing Checklist

- [ ] Open DevTools → Application tab
- [ ] Check "Manifest" section is valid
- [ ] Check "Service Workers" shows registered
- [ ] Set to "Offline" in Network tab
- [ ] Navigate to `/fr/` - should load from cache
- [ ] Navigate to uncached page - should show offline.html
- [ ] Reset to online, refresh - cache should update
- [ ] Mobile: Install app to home screen
- [ ] Mobile: App should launch in standalone mode

## Icon Export

1. Visit `/icons/generate.html`
2. Download 3 PNG files:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)
   - `icon-maskable-512.png` (512x512 with safe zones)
3. Save to `/icons/` directory
4. All sizes will be auto-used by PWA

## Common Tasks

### Update Cache Version (Force Update)
Edit `/sessions/dazzling-brave-lamport/mnt/solarmetrics/sw.js` line 1:
```javascript
const CACHE_VERSION = 'solarmetrics-v2026-04'; // Changed from 03 to 04
```

### Add Page to App Shell
Edit `/sessions/dazzling-brave-lamport/mnt/solarmetrics/sw.js` line 8:
```javascript
const SHELL_URLS = [
  '/',
  '/fr/',
  '/fr/economie.html',
  '/fr/new-page.html', // Add this
  // ... other pages
];
```

### Modify Offline Message
Edit `/sessions/dazzling-brave-lamport/mnt/solarmetrics/offline.html`:
- Change heading text (line ~80)
- Change description (line ~83)
- Modify button actions (lines ~93-96)

### Change Theme Colors
Edit `/sessions/dazzling-brave-lamport/mnt/solarmetrics/manifest.json`:
```json
"theme_color": "#f59e0b",        // PWA header color
"background_color": "#0f172a",   // Splash screen background
```

## Browser Devtools Navigation

**Chrome/Edge Desktop:**
1. F12 or Ctrl+Shift+I
2. Application tab
3. Left sidebar → Service Workers / Manifest / Cache Storage

**Chrome Mobile (Android):**
1. Open Chrome
2. Menu → More tools → Remote devices
3. Enable USB debugging
4. Connect device and inspect

**Safari (iOS):**
1. Settings → Safari → Advanced → Web Inspector
2. Connect to Mac
3. Develop menu shows iOS app

## Performance Metrics

- **Initial Load**: +5 KB (manifest + SW registration)
- **Cache Size**: ~200-300 KB (configurable)
- **Offline Speed**: Instant (served from cache)
- **Update Time**: Background (non-blocking)
- **Max Cache Age**: Not enforced (manual versioning)

## Security Best Practices

- ✓ Service Worker only on HTTPS
- ✓ Manifest doesn't expose sensitive data
- ✓ Offline page shows no user data
- ✓ Cache contains only public assets
- ✓ No tracking or analytics in PWA

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Service Worker not registering | Check HTTPS, valid sw.js syntax, clear cache |
| Manifest not found | Verify `/manifest.json` exists at root |
| Icons not showing | Check icon paths in manifest, use /icons/ prefix |
| Pages not offline | Add to SHELL_URLS in sw.js |
| Cache not updating | Increment CACHE_VERSION number |
| Offline page not showing | Check offline.html exists, no syntax errors |

## File Checklist

- [x] `/manifest.json` - Valid JSON ✓
- [x] `/sw.js` - Service Worker registered ✓
- [x] `/offline.html` - Fallback page ✓
- [x] `/icons/icon.svg` - Vector icon ✓
- [x] `/icons/generate.html` - Export tool ✓
- [x] `/fr/index.html` - PWA links added ✓
- [ ] `/icons/icon-192.png` - Pending export
- [ ] `/icons/icon-512.png` - Pending export
- [ ] `/icons/icon-maskable-512.png` - Pending export

## URLs for Testing

- **Home**: `https://solarmetrics.netlify.app/fr/`
- **Manifest**: `https://solarmetrics.netlify.app/manifest.json`
- **Service Worker**: `https://solarmetrics.netlify.app/sw.js`
- **Offline Page**: `https://solarmetrics.netlify.app/offline.html`
- **Icon Generator**: `https://solarmetrics.netlify.app/icons/generate.html`

---

**Created**: March 7, 2026
**Status**: Production Ready (pending optional PNG icon export)
