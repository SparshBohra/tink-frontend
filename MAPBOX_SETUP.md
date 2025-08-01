# Mapbox Address Autocomplete Setup

## 🚀 Quick Setup

The property creation form now includes address autocomplete powered by Mapbox! Follow these steps to get it working:

### 1. Get a Mapbox Access Token

1. Go to [Mapbox Account Dashboard](https://account.mapbox.com/access-tokens/)
2. Sign up for a free account if you don't have one
3. Create a new access token or use your default public token
4. Make sure it has the **geocoding:read** scope enabled

### 2. Add Environment Variable

Create a `.env.local` file in the `tink-frontend` directory with:

```env
# Mapbox API Key for address autocomplete
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cl91c2VybmFtZSIsImEiOiJjbGV0c..." # Your actual token here
```

### 3. Restart Development Server

```bash
npm run dev
```

## 💰 Pricing

- **Free Tier**: 100,000 requests per month
- **After free tier**: $0.50 per 1,000 requests
- **Typical usage**: ~2-5 requests per property created

## ✨ Features

- **US-only addresses** - Automatically filtered to United States
- **Auto-complete** - Shows suggestions as you type
- **Auto-populate** - Fills in city, state, and ZIP code automatically
- **Keyboard navigation** - Use arrow keys and Enter to select
- **Fallback mode** - Works as regular text input if API key is missing

## 🛠️ How It Works

1. User types address in "Address Line 1" field
2. After 300ms delay, Mapbox API is called
3. Up to 5 address suggestions are shown
4. When user selects an address:
   - Address Line 1 is populated
   - City is auto-filled
   - State is auto-filled  
   - ZIP Code is auto-filled

## 🔧 Troubleshooting

**No suggestions appearing?**
- Check your API key is correctly set in `.env.local`
- Verify the token has `geocoding:read` permissions
- Check browser console for any error messages

**Getting charged unexpectedly?**
- Monitor usage at [Mapbox Account Dashboard](https://account.mapbox.com/)
- Each keystroke after 300ms pause counts as 1 request
- Consider increasing debounce delay if needed

**Want to disable temporarily?**
- Remove or comment out `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` 
- Component will fall back to regular text input with a warning message 