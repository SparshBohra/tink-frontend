// ===================================================================
// Email Webhook Endpoint - Receives inbound emails from SendGrid
// POST /api/inbound/email
// ===================================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { parseMaintenanceRequest, toAIMetadata } from '../../../lib/gemini-parser'
import type { Database } from '../../../lib/supabase-types'
import formidable, { Fields, Files } from 'formidable'
import { IncomingMessage } from 'http'

// Supabase admin client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SendGridEmail {
  from: string // Sender email (the person forwarding - this identifies the org!)
  to: string // Recipient (tickets@inbound.squareft.ai - same for everyone)
  subject: string
  text: string // Plain text body
  html?: string // HTML body
  headers: string // Raw headers
  envelope: string // JSON envelope info
  [key: string]: string | undefined
}

// Disable body parsing - SendGrid sends multipart/form-data
export const config = {
  api: {
    bodyParser: false
  }
}

// Helper to parse multipart form data
async function parseFormData(req: IncomingMessage): Promise<Fields> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve(fields)
    })
  })
}

// Helper to extract first value from field
function getFieldValue(field: string | string[] | undefined): string {
  if (Array.isArray(field)) return field[0] || ''
  return field || ''
}

// Helper to extract email from "Name <email@domain.com>" format
function extractEmail(fromField: string): string {
  const match = fromField.match(/<([^>]+)>/)
  return match ? match[1] : fromField.trim()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now()
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Parse multipart form data from SendGrid
    const fields = await parseFormData(req)
    
    // Extract values from form fields
    const fromRaw = getFieldValue(fields.from)
    const from = extractEmail(fromRaw) // Extract email from "Name <email>" format
    const to = getFieldValue(fields.to)
    const subject = getFieldValue(fields.subject)
    const text = getFieldValue(fields.text)
    const html = getFieldValue(fields.html)
    const headers = getFieldValue(fields.headers)
    const envelope = getFieldValue(fields.envelope)
    
    console.log('📧 Email webhook received:', {
      from,
      to,
      subject
    })
    
    const emailData: SendGridEmail = {
      from,
      to,
      subject,
      text,
      html,
      headers,
      envelope
    }
    
    // Validate required fields
    if (!emailData.from || !emailData.to || !emailData.text) {
      console.error('Missing required fields:', emailData)
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // TODO: Verify SendGrid signature for security
    // const isValid = verifySendGridSignature(req)
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' })
    // }
    
    // Step 1: Log webhook event
    const { data: webhookEvent, error: webhookError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        source: 'sendgrid',
        event_type: 'inbound_email',
        payload: emailData as any,
        headers: req.headers as any,
        signature_valid: true, // TODO: Actually verify
        status: 'received'
      } as any)
      .select()
      .single()
    
    if (webhookError) {
      console.error('Failed to log webhook event:', webhookError)
    }
    
    // Step 2: Create inbound queue entry
    const { data: queueEntry, error: queueError } = await supabaseAdmin
      .from('inbound_queue')
      .insert({
        source_type: 'email',
        source_contact: emailData.from,
        destination: emailData.to,
        raw_subject: emailData.subject,
        raw_body: emailData.text,
        raw_headers: {
          headers: emailData.headers,
          envelope: emailData.envelope,
          html: emailData.html
        } as any,
        processing_status: 'pending'
      } as any)
      .select()
      .single()
    
    if (queueError || !queueEntry) {
      console.error('Failed to create queue entry:', queueError)
      
      if (webhookEvent) {
        await supabaseAdmin
          .from('webhook_events')
          .update({
            status: 'failed',
            error: queueError?.message || 'Failed to create queue entry',
            processing_time_ms: Date.now() - startTime
          } as any)
          .eq('id', webhookEvent.id)
      }
      
      return res.status(500).json({ error: 'Failed to queue message' })
    }
    
    console.log('✅ Queue entry created:', queueEntry.id)
    
    // Step 3: Identify organization by sender email (forwarder)
    // The person forwarding the email is in org_contacts - same logic as SMS!
    const { data: orgContact } = await supabaseAdmin
      .from('org_contacts')
      .select('organization_id, label, organizations(id, name)')
      .eq('contact_type', 'email')
      .eq('contact_value', emailData.from)
      .eq('is_verified', true)
      .single()
    
    if (!orgContact) {
      console.warn('⚠️ No organization found for email:', emailData.from)
      
      await supabaseAdmin
        .from('inbound_queue')
        .update({
          processing_status: 'manual_review',
          error_message: `Unknown sender email: ${emailData.from}. Please add this email to an organization's contacts.`
        } as any)
        .eq('id', queueEntry.id)
      
      if (webhookEvent) {
        await supabaseAdmin
          .from('webhook_events')
          .update({
            status: 'processed',
            processing_time_ms: Date.now() - startTime,
            inbound_queue_id: queueEntry.id
          } as any)
          .eq('id', webhookEvent.id)
      }
      
      return res.status(200).json({ 
        message: 'Message received but needs manual review',
        queue_id: queueEntry.id,
        reason: 'unknown_sender'
      })
    }
    
    const organization = (orgContact as any).organizations
    console.log('🏢 Organization identified:', organization.name, organization.id, `(via ${orgContact.label || 'contact'})`)
    
    // Update queue with org ID
    await supabaseAdmin
      .from('inbound_queue')
      .update({
        organization_id: orgContact.organization_id,
        processing_status: 'processing'
      } as any)
      .eq('id', queueEntry.id)
    
    // Step 4: Parse message with Gemini AI
    // Combine subject and body for better parsing
    const fullMessage = `Subject: ${emailData.subject}\n\n${emailData.text}`
    
    console.log('🤖 Parsing with Gemini...')
    const parseResult = await parseMaintenanceRequest(fullMessage, 'email')
    
    if (!parseResult.success || !parseResult.data) {
      console.error('❌ Gemini parsing failed:', parseResult.error)
      
      await supabaseAdmin
        .from('inbound_queue')
        .update({
          processing_status: 'failed',
          error_message: `Gemini parsing failed: ${parseResult.error}`,
          retry_count: 0
        } as any)
        .eq('id', queueEntry.id)
      
      if (webhookEvent) {
        await supabaseAdmin
          .from('webhook_events')
          .update({
            status: 'failed',
            error: parseResult.error,
            processing_time_ms: Date.now() - startTime,
            inbound_queue_id: queueEntry.id
          } as any)
          .eq('id', webhookEvent.id)
      }
      
      return res.status(200).json({ 
        message: 'Failed to parse message',
        queue_id: queueEntry.id,
        error: parseResult.error
      })
    }
    
    console.log('✅ Gemini parsed:', {
      title: parseResult.data.title,
      priority: parseResult.data.priority,
      category: parseResult.data.category,
      confidence: parseResult.data.confidence,
      is_maintenance: parseResult.data.is_maintenance_related,
      message_type: parseResult.data.message_type
    })
    
    // Check if this is actually a maintenance request
    if (!parseResult.data.is_maintenance_related) {
      console.warn('⚠️ Non-maintenance email detected:', parseResult.data.message_type)
      
      // Determine status based on message type
      let queueStatus: 'spam' | 'manual_review' = 'manual_review'
      if (parseResult.data.message_type === 'spam') {
        queueStatus = 'spam'
      }
      
      await supabaseAdmin
        .from('inbound_queue')
        .update({
          processing_status: queueStatus,
          error_message: `Non-maintenance message: ${parseResult.data.message_type}. ${parseResult.data.reasoning}`,
          parsed_data: parseResult.data as any,
          processed_at: new Date().toISOString()
        } as any)
        .eq('id', queueEntry.id)
      
      // Update webhook event
      if (webhookEvent) {
        await supabaseAdmin
          .from('webhook_events')
          .update({
            status: 'processed',
            processing_time_ms: Date.now() - startTime,
            inbound_queue_id: queueEntry.id
          } as any)
          .eq('id', webhookEvent.id)
      }
      
      console.log(`✅ Non-maintenance email handled: ${queueStatus}`)
      
      return res.status(200).json({
        success: true,
        queue_id: queueEntry.id,
        message_type: parseResult.data.message_type,
        is_maintenance: false,
        reason: 'Not a maintenance request - marked for review'
      })
    }
    
    // Step 5: Create ticket (only for maintenance requests)
    const aiMetadata = toAIMetadata(parseResult.data)
    
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        organization_id: orgContact.organization_id,
        status: 'triage',
        priority: parseResult.data.priority,
        category: parseResult.data.category,
        title: parseResult.data.title,
        description: parseResult.data.description,
        ai_metadata: aiMetadata as any
      } as any)
      .select()
      .single()
    
    if (ticketError || !ticket) {
      console.error('❌ Failed to create ticket:', ticketError)
      
      await supabaseAdmin
        .from('inbound_queue')
        .update({
          processing_status: 'failed',
          error_message: `Failed to create ticket: ${ticketError?.message}`,
          parsed_data: parseResult.data as any
        } as any)
        .eq('id', queueEntry.id)
      
      return res.status(500).json({ error: 'Failed to create ticket' })
    }
    
    console.log('🎫 Ticket created:', ticket.id, `#${ticket.ticket_number}`)
    
    // Step 6: Create inbound message record
    const { error: messageError } = await supabaseAdmin
      .from('inbound_messages')
      .insert({
        organization_id: orgContact.organization_id,
        ticket_id: ticket.id,
        source: 'email',
        sender_email: emailData.from, // The forwarder (property manager)
        sender_name: parseResult.data.extracted_data.tenant_name || null,
        forwarder_email: emailData.from,
        forwarder_name: orgContact.label || null,
        raw_subject: emailData.subject,
        raw_body: emailData.text,
        raw_headers: {
          headers: emailData.headers,
          envelope: emailData.envelope
        } as any,
        received_at: new Date().toISOString()
      } as any)
    
    if (messageError) {
      console.error('⚠️ Failed to create message record:', messageError)
    }
    
    // Step 7: Update queue as processed
    await supabaseAdmin
      .from('inbound_queue')
      .update({
        processing_status: 'processed',
        ticket_id: ticket.id,
        parsed_data: parseResult.data as any,
        processed_at: new Date().toISOString()
      } as any)
      .eq('id', queueEntry.id)
    
    // Step 8: Update webhook event
    if (webhookEvent) {
      await supabaseAdmin
        .from('webhook_events')
        .update({
          status: 'processed',
          processing_time_ms: Date.now() - startTime,
          inbound_queue_id: queueEntry.id
        } as any)
        .eq('id', webhookEvent.id)
      }
    
    console.log('✅ Email processed successfully in', Date.now() - startTime, 'ms')
    
    // Return success to SendGrid
    res.status(200).json({
      success: true,
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      priority: ticket.priority,
      category: ticket.category,
      is_maintenance: true,
      message_type: 'maintenance',
      processing_time_ms: Date.now() - startTime
    })
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
