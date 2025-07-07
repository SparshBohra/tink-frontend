import { NextApiRequest, NextApiResponse } from 'next';
import { twilioSMS } from '../../../lib/twilio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sid } = req.query;

    if (!sid || typeof sid !== 'string') {
      return res.status(400).json({ error: 'Message SID is required' });
    }

    const messageStatus = await twilioSMS.getMessageStatus(sid);

    return res.status(200).json({
      success: true,
      message: messageStatus
    });

  } catch (error: any) {
    console.error('SMS status check error:', error);
    return res.status(500).json({ 
      error: 'Failed to get message status', 
      details: error.message 
    });
  }
} 