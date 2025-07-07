# Twilio SMS Setup Guide

This guide will help you set up Twilio SMS functionality for the property management communication system.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/)
2. A verified phone number for sending SMS messages

## Step 1: Get Your Twilio Credentials

1. **Log in to your Twilio Console**: https://console.twilio.com/
2. **Find your Account SID and Auth Token**:
   - Go to the Dashboard
   - Copy your "Account SID" and "Auth Token" from the Project Info section

3. **Get a Twilio Phone Number**:
   - Go to Phone Numbers > Manage > Buy a number
   - Purchase a phone number that supports SMS
   - Note down the phone number (it will be in E.164 format like +1234567890)

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root and add the following:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### Example:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 3: Test the Configuration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the Communication page**: http://localhost:3000/communication

3. **Send a test SMS**:
   - Click "Send Message"
   - Select "SMS Text Message"
   - Choose "Individual Tenant"
   - Enter a valid phone number (your own for testing)
   - Write a test message
   - Click "Send SMS"

## Features

### SMS Templates
The system includes pre-built templates for common scenarios:
- **Rent Reminder**: Payment due notifications
- **Maintenance Notice**: Scheduled maintenance alerts
- **Lease Renewal**: Lease expiration reminders
- **Welcome Message**: New tenant greetings
- **Policy Update**: Important policy changes
- **Package Delivery**: Package pickup notifications
- **Emergency Notice**: Emergency alerts
- **Payment Confirmation**: Payment received confirmations

### Individual vs Broadcast Messages
- **Individual**: Send to a specific tenant
- **Broadcast**: Send to all tenants or selected tenants

### Message Variables
Use these variables in your messages for personalization:
- `{{name}}` - Tenant name
- `{{amount}}` - Payment amount
- `{{dueDate}}` - Due date
- `{{propertyName}}` - Property name
- `{{unitNumber}}` - Unit number
- And more...

## API Endpoints

The system provides the following API endpoints:

### Send SMS
- **POST** `/api/sms/send`
- Send individual or broadcast SMS messages

### Get Templates
- **GET** `/api/sms/templates`
- Retrieve available message templates

### Check Message Status
- **GET** `/api/sms/status?sid=MESSAGE_SID`
- Check the delivery status of a sent message

## Troubleshooting

### Common Issues

1. **"Invalid phone number format"**
   - Ensure phone numbers are in E.164 format (+1234567890)
   - Use the built-in phone number formatting

2. **"Authentication failed"**
   - Double-check your Account SID and Auth Token
   - Make sure there are no extra spaces in your .env.local file

3. **"From phone number not verified"**
   - Ensure your Twilio phone number is active and SMS-enabled
   - Check your Twilio account balance

4. **Messages not sending**
   - Verify recipient phone numbers are valid
   - Check Twilio console for error logs
   - Ensure your Twilio account has sufficient balance

### Testing Tips

1. **Use your own phone number** for initial testing
2. **Start with short messages** (under 160 characters)
3. **Check Twilio logs** in the console for detailed error information
4. **Test both individual and broadcast** messaging

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Auth Token secure and private
- Regularly rotate your Auth Token if needed
- Use environment variables for all sensitive configuration

## Cost Considerations

- SMS messages typically cost $0.0075 per message in the US
- International rates vary by country
- Monitor usage in your Twilio console
- Set up billing alerts to avoid unexpected charges

## Support

For Twilio-specific issues:
- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com/

For application-specific issues:
- Check the browser console for error messages
- Review server logs for API errors
- Ensure all dependencies are installed (`npm install`) 