# SquareFt Chrome Extension

AI-powered maintenance triage for property managers. View and manage tickets while working in Yardi, AppFolio, or any property management system.

## Features

- View the 5 most recent tickets in "Triage" status
- Copy ticket descriptions with one click
- Emergency ticket notifications
- Syncs with your SquareFt dashboard

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd extension
npm install
```

### Build

```bash
# Production build
npm run build

# Watch mode (development)
npm run watch
```

### Load in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `extension/dist` folder

### Icons

Create icon images in `extension/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)  
- `icon128.png` (128x128)

Use a gradient from #3b82f6 to #8b5cf6 with a sparkle/star icon.

## Architecture

```
extension/
├── manifest.json      # Chrome extension manifest (v3)
├── popup.html         # Popup HTML shell
├── popup.css          # Popup styles
├── src/
│   ├── popup.ts       # Popup logic (ticket list, copy)
│   └── background.ts  # Service worker (auth, notifications)
├── icons/             # Extension icons
├── build.js           # esbuild script
└── dist/              # Built files (load this in Chrome)
```

## Authentication

The extension shares authentication with the main SquareFt dashboard:

1. User logs in at squareft.ai/auth/login
2. Session is stored and shared with the extension
3. Extension uses the same Supabase session to fetch tickets

## Supabase Integration

- Uses Supabase Auth for authentication
- Fetches tickets from the `tickets` table
- Filters by `organization_id` for multi-tenant isolation
- Subscribes to real-time updates for live ticket notifications
