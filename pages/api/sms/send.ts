import { NextApiRequest, NextApiResponse } from 'next';
import { twilioSMS } from '../../../lib/twilio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message, type = 'individual', recipients = [] } = req.body;

    // Validate required fields
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let results = [];

    if (type === 'individual') {
      // Send to single recipient
      if (!to) {
        return res.status(400).json({ error: 'Recipient phone number is required' });
      }

      const formattedPhone = twilioSMS.formatPhoneNumber(to);
      if (!twilioSMS.validatePhoneNumber(formattedPhone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }

      const result = await twilioSMS.sendSMS({
        to: formattedPhone,
        body: message
      });

      results = [result];
    } else if (type === 'broadcast') {
      // Send to multiple recipients
      if (!recipients || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients list is required for broadcast' });
      }

      const smsMessages = recipients.map((recipient: any) => ({
        to: twilioSMS.formatPhoneNumber(recipient.phone),
        body: message.replace('{{name}}', recipient.name || 'Tenant')
      }));

      results = await twilioSMS.sendBulkSMS(smsMessages);
    } else {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    // Log the SMS sending activity
    console.log(`SMS sent - Type: ${type}, Count: ${results.length}, Success: ${results.filter(r => r.status !== 'failed').length}`);

    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status !== 'failed').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });

  } catch (error: any) {
    console.error('SMS sending error:', error);
    return res.status(500).json({ 
      error: 'Failed to send SMS', 
      details: error.message 
    });
  }
} 