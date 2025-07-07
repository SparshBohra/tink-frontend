import { NextApiRequest, NextApiResponse } from 'next';

// SMS Message Templates
const SMS_TEMPLATES = {
  rentReminder: {
    id: 'rent-reminder',
    name: 'Rent Reminder',
    category: 'Payment',
    subject: 'Rent Payment Reminder',
    body: 'Hi {{name}}, this is a friendly reminder that your rent payment of ${{amount}} is due on {{dueDate}}. Please make your payment at your earliest convenience. Thank you! - {{propertyName}} Management',
    variables: ['name', 'amount', 'dueDate', 'propertyName']
  },
  maintenanceNotice: {
    id: 'maintenance-notice',
    name: 'Maintenance Notice',
    category: 'Maintenance',
    subject: 'Scheduled Maintenance Notice',
    body: 'Dear {{name}}, we have scheduled maintenance for {{maintenanceType}} on {{date}} from {{startTime}} to {{endTime}}. {{additionalInfo}} We apologize for any inconvenience. - {{propertyName}} Management',
    variables: ['name', 'maintenanceType', 'date', 'startTime', 'endTime', 'additionalInfo', 'propertyName']
  },
  leaseRenewal: {
    id: 'lease-renewal',
    name: 'Lease Renewal',
    category: 'Lease',
    subject: 'Lease Renewal Notice',
    body: 'Hi {{name}}, your lease for {{unitNumber}} expires on {{expirationDate}}. We would love to have you stay! Please contact us at {{contactInfo}} to discuss renewal options. - {{propertyName}} Management',
    variables: ['name', 'unitNumber', 'expirationDate', 'contactInfo', 'propertyName']
  },
  welcome: {
    id: 'welcome',
    name: 'Welcome Message',
    category: 'General',
    subject: 'Welcome to Your New Home',
    body: 'Welcome to {{propertyName}}, {{name}}! We\'re excited to have you as our new tenant in {{unitNumber}}. If you have any questions or need assistance, please don\'t hesitate to contact us at {{contactInfo}}. Welcome home!',
    variables: ['name', 'propertyName', 'unitNumber', 'contactInfo']
  },
  policyUpdate: {
    id: 'policy-update',
    name: 'Policy Update',
    category: 'General',
    subject: 'Important Policy Update',
    body: 'Dear {{name}}, we want to inform you about an important update to our {{policyType}}. {{updateDetails}} This change will take effect on {{effectiveDate}}. Please contact us if you have any questions. - {{propertyName}} Management',
    variables: ['name', 'policyType', 'updateDetails', 'effectiveDate', 'propertyName']
  },
  packageDelivery: {
    id: 'package-delivery',
    name: 'Package Delivery',
    category: 'General',
    subject: 'Package Delivery Notification',
    body: 'Hi {{name}}, a package has been delivered for you and is available for pickup at {{pickupLocation}}. Please bring a valid ID when collecting your package. - {{propertyName}} Management',
    variables: ['name', 'pickupLocation', 'propertyName']
  },
  emergencyNotice: {
    id: 'emergency-notice',
    name: 'Emergency Notice',
    category: 'Emergency',
    subject: 'Emergency Notice',
    body: 'EMERGENCY NOTICE: {{emergencyType}} at {{propertyName}}. {{emergencyDetails}} Please follow all safety instructions. For immediate assistance, call {{emergencyContact}}.',
    variables: ['emergencyType', 'propertyName', 'emergencyDetails', 'emergencyContact']
  },
  paymentConfirmation: {
    id: 'payment-confirmation',
    name: 'Payment Confirmation',
    category: 'Payment',
    subject: 'Payment Received',
    body: 'Hi {{name}}, we have received your payment of ${{amount}} for {{paymentType}}. Transaction ID: {{transactionId}}. Thank you for your prompt payment! - {{propertyName}} Management',
    variables: ['name', 'amount', 'paymentType', 'transactionId', 'propertyName']
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { category, id } = req.query;

      if (id) {
        // Get specific template
        const template = Object.values(SMS_TEMPLATES).find(t => t.id === id);
        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json({ success: true, template });
      }

      // Get all templates or filter by category
      let templates = Object.values(SMS_TEMPLATES);
      
      if (category) {
        templates = templates.filter(t => t.category.toLowerCase() === category.toString().toLowerCase());
      }

      return res.status(200).json({ 
        success: true, 
        templates,
        categories: [...new Set(Object.values(SMS_TEMPLATES).map(t => t.category))]
      });

    } catch (error: any) {
      console.error('Template fetch error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch templates', 
        details: error.message 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 