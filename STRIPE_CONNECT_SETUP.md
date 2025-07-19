# Stripe Connect Frontend Integration Setup

## Overview
This guide helps you set up the Stripe Connect frontend integration for your Tink property management platform.

## Environment Variables

Create a `.env.local` file in your frontend root directory with the following variables:

```bash
# Stripe Connect Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# API Configuration  
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Replace `pk_test_your_stripe_publishable_key_here` with your actual Stripe publishable key.

## Files Created

### 1. Types (`lib/types.ts`)
- `StripeConnectAccountData` - Account creation data
- `StripeConnectAccountStatus` - Account status information
- `StripeConnectAccountSession` - Session for embedded components
- `StripeConnectAccountLink` - Hosted onboarding link
- `StripeConnectSessionData` - Session creation data
- `StripeConnectLinkData` - Link creation data

### 2. API Methods (`lib/api.ts`)
- `getStripeAccountStatus()` - Get account status
- `createStripeConnectedAccount()` - Create Stripe account
- `createStripeAccountSession()` - Create embedded session
- `createStripeAccountLink()` - Create hosted link

### 3. Components (`components/StripeConnectOnboarding.tsx`)
- Main onboarding component with embedded and hosted options
- Account status display
- Error handling and loading states
- Feature highlights

### 4. Pages
- `/stripe-connect` - Main setup page
- `/stripe/return` - Success/completion callback
- `/stripe/refresh` - Refresh callback

## Features

### 🎯 **Embedded Onboarding**
- Uses Stripe Connect's embedded components
- Seamless in-app experience
- Real-time form validation

### 🔗 **Hosted Onboarding** 
- Fallback option using Stripe's hosted pages
- Opens in new tab
- Full Stripe-managed experience

### 📊 **Account Status Tracking**
- Real-time status updates
- Requirements tracking
- Visual status indicators

### 🛡️ **Security**
- JWT-based authentication
- Role-based access (landlords only)
- Secure API communication

## Usage

### For Landlords
1. Navigate to `/stripe-connect`
2. Click "Create Stripe Account"
3. Choose embedded or hosted onboarding
4. Complete the setup process
5. Return to dashboard when complete

### For Developers
```jsx
import StripeConnectOnboarding from '../components/StripeConnectOnboarding';

function MyComponent() {
  const handleComplete = (accountId: string) => {
    console.log('Setup complete:', accountId);
  };

  const handleError = (error: string) => {
    console.error('Setup error:', error);
  };

  return (
    <StripeConnectOnboarding
      onComplete={handleComplete}
      onError={handleError}
    />
  );
}
```

## Backend Integration

Ensure your backend has these endpoints:
- `POST /api/auth/stripe/create-connected-account/`
- `POST /api/auth/stripe/create-account-session/`
- `GET /api/auth/stripe/account-status/`
- `POST /api/auth/stripe/create-account-link/`

## Dependencies

The following packages are already installed:
- `@stripe/react-connect-js` - React Connect components
- `@stripe/stripe-js` - Stripe JavaScript SDK
- `stripe` - Stripe Node.js library

## Testing

1. Start your backend server with Stripe test keys
2. Start your frontend development server
3. Login as a landlord
4. Navigate to `/stripe-connect`
5. Test the onboarding flow

## Production Deployment

1. Update environment variables with live Stripe keys
2. Ensure HTTPS is enabled (required by Stripe)
3. Update return/refresh URLs to production URLs
4. Test the complete flow in production

## Support

If you encounter issues:
- Check the browser console for errors
- Verify your Stripe keys are correct
- Ensure the backend is running and accessible
- Check that the user has the 'owner' role

## Next Steps

After setup is complete, you can:
1. Implement payment processing for rent collection
2. Add webhook handling for real-time updates
3. Build tenant payment interfaces
4. Add reporting and analytics 