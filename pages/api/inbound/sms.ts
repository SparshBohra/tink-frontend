// ===================================================================
// SMS Webhook Endpoint - Receives inbound SMS from Twilio
// POST /api/inbound/sms
// ===================================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { parseMaintenanceRequest, toAIMetadata } from '../../../lib/gemini-parser'
import type { Database } from '../../../lib/supabase-types'

// Supabase admin client (has full access, bypasses RLS)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Twilio credentials for signature verification
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!

interface TwilioSMSWebhook {
  MessageSid: string
  AccountSid: string
  From: string // Phone number that sent the SMS
  To: string // Your Twilio number
  Body: string // SMS text content
  NumMedia?: string // Number of media attachments
  [key: string]: string | undefined
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
  
  console.log('📱 SMS webhook received:', {
    from: req.body.From,
    to: req.body.To,
    bodyLength: req.body.Body?.length
  })
  
  try {
    const twilioData: TwilioSMSWebhook = req.body
    
    // Validate required fields
    if (!twilioData.From || !twilioData.To || !twilioData.Body) {
      console.error('Missing required fields:', twilioData)
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // TODO: Verify Twilio signature for security
    // const isValid = validateTwilioSignature(req)
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' })
    // }
    
    // Step 1: Log webhook event
    const { data: webhookEvent, error: webhookError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        source: 'twilio',
        event_type: 'inbound_sms',
        payload: twilioData as any,
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
        source_type: 'sms',
        source_contact: twilioData.From,
        destination: twilioData.To,
        raw_subject: null,
        raw_body: twilioData.Body,
        raw_headers: twilioData as any,
        processing_status: 'pending'
      } as any)
      .select()
      .single()
    
    if (queueError || !queueEntry) {
      console.error('Failed to create queue entry:', queueError)
      
      // Update webhook event
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
    
    // Step 3: Identify organization by phone number
    const { data: orgContact } = await supabaseAdmin
      .from('org_contacts')
      .select('organization_id, label')
      .eq('contact_type', 'phone')
      .eq('contact_value', twilioData.From)
      .eq('is_verified', true)
      .single()
    
    if (!orgContact) {
      console.warn('⚠️ No organization found for phone:', twilioData.From)
      
      // Update queue as needing manual review
      await supabaseAdmin
        .from('inbound_queue')
        .update({
          processing_status: 'manual_review',
          error_message: `Unknown phone number: ${twilioData.From}. Please add this contact to an organization.`
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
      
      // Return success to Twilio (don't retry)
      return res.status(200).json({ 
        message: 'Message received but needs manual review',
        queue_id: queueEntry.id,
        reason: 'unknown_sender'
      })
    }
    
    console.log('🏢 Organization identified:', orgContact.organization_id)
    
    // Update queue with org ID
    await supabaseAdmin
      .from('inbound_queue')
      .update({
        organization_id: orgContact.organization_id,
        processing_status: 'processing'
      } as any)
      .eq('id', queueEntry.id)
    
    // Step 4: Parse message with Gemini AI
    console.log('🤖 Parsing with Gemini...')
    const parseResult = await parseMaintenanceRequest(twilioData.Body, 'sms')
    
    if (!parseResult.success || !parseResult.data) {
      console.error('❌ Gemini parsing failed:', parseResult.error)
      
      // Update queue
      await supabaseAdmin
        .from('inbound_queue')
        .update({
          processing_status: 'failed',
          error_message: `Gemini parsing failed: ${parseResult.error}`,
          retry_count: 0
        } as any)
        .eq('id', queueEntry.id)
      
      // Update webhook event
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
      console.warn('⚠️ Non-maintenance message detected:', parseResult.data.message_type)
      
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
      
      console.log(`✅ Non-maintenance message handled: ${queueStatus}`)
      
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
        source: 'sms',
        sender_phone: twilioData.From,
        sender_name: parseResult.data.extracted_data.tenant_name || null,
        raw_subject: null,
        raw_body: twilioData.Body,
        raw_headers: twilioData as any,
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
    
    console.log('✅ SMS processed successfully in', Date.now() - startTime, 'ms')
    
    // Return success to Twilio
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
