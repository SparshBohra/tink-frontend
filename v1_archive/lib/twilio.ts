// Twilio SMS Service
import twilio from 'twilio';

// Twilio Configuration
// Add your Twilio credentials here:
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid_here';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'your_twilio_phone_number_here';

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
  dateSent?: Date;
  errorCode?: string;
  errorMessage?: string;
}

export class TwilioSMSService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    this.client = client;
    this.fromNumber = TWILIO_PHONE_NUMBER;
  }

  /**
   * Send a single SMS message
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      const result = await this.client.messages.create({
        body: message.body,
        from: message.from || this.fromNumber,
        to: message.to
      });

      return {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        body: result.body,
        dateCreated: result.dateCreated,
        dateSent: result.dateSent || undefined,
        errorCode: result.errorCode || undefined,
        errorMessage: result.errorMessage || undefined
      };
    } catch (error: any) {
      console.error('Failed to send SMS:', error);
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    try {
      const promises = messages.map(message => this.sendSMS(message));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Failed to send SMS to ${messages[index].to}:`, result.reason);
          return {
            sid: '',
            status: 'failed',
            to: messages[index].to,
            from: this.fromNumber,
            body: messages[index].body,
            dateCreated: new Date(),
            errorMessage: result.reason.message
          };
        }
      });
    } catch (error: any) {
      console.error('Failed to send bulk SMS:', error);
      throw new Error(`Bulk SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Get message status by SID
   */
  async getMessageStatus(messageSid: string): Promise<any> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      console.error('Failed to get message status:', error);
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s|-|\(|\)/g, ''));
  }

  /**
   * Format phone number for Twilio (E.164 format)
   */
  formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `${countryCode}${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return phoneNumber; // Return as-is if already formatted
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      const account = await this.client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      };
    } catch (error: any) {
      console.error('Failed to get account info:', error);
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }
}

// Export singleton instance
export const twilioSMS = new TwilioSMSService(); 